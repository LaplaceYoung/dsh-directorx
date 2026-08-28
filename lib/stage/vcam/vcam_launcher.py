#!/usr/bin/env python3
"""
vcam_launcher.py — VCam 信令 daemon 的幂等启动器。

由插件前端经 hub.python.run 调用（几百 ms 内返回，完全避开 run 的超时模型）：
  1. 读 .vcam/state.json + healthz 探测：daemon 已在跑且局域网 IP 未变 → 直接返回；
     IP 变了（换 Wi-Fi）→ 经 /shutdown 停旧的再重启。
  2. 以脱离进程（detached）方式拉起 vcam_server.py：
     POSIX 用 start_new_session（gateway 超时只 SIGKILL 直接子进程，daemon 存活）；
     Windows 用 DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW。
  3. 轮询 healthz 至就绪（daemon 首次要下载/生成 TLS 证书，给 20s 窗口），
     stdout 输出一行 JSON 结果供前端解析。

stdout 约定（前端取最后一行 JSON）：
  成功 {"ok": true, "lanIp", "httpPort", "httpsPort", "phoneBase", "certMode"}
  失败 {"ok": false, "error": "...", "logTail": "..."}

本地调试（cwd 必须是插件根目录 —— 有 phone.html / assets/ 的那层，如 plugins/3d-director-stage/）：
  # 装依赖
  python3 -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt

  # 方式一：经 launcher 启动（模拟线上路径，daemon 脱离进程，日志在 .vcam/server.log）
  python3 vcam/vcam_launcher.py

  # 方式二：前台直接跑 server（日志直接打终端，方便调试）
  python3 vcam/vcam_server.py --http-port 45820 --https-port 45821 \
      --lan-ip $(ipconfig getifaddr en0) --admin-token dev --root .

  # 停服务（admin token 在 .vcam/state.json）
  curl "http://127.0.0.1:45820/shutdown?k=<adminToken>"
"""
from __future__ import annotations

import json
import os
import secrets
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from typing import NoReturn

PREFERRED_HTTP = 45820
PREFERRED_HTTPS = 45821
START_WAIT_S = 20.0
SERVER_REVISION = "2"  # 与 vcam_server.py 对齐；不匹配时重启旧 daemon

def find_root() -> Path:
    here = Path(__file__).resolve().parent
    for candidate in (Path.cwd(), here / "web", here):
        if (candidate / "phone.html").is_file():
            return candidate.resolve()
    return Path.cwd().resolve()


ROOT = find_root()
VDIR = ROOT / ".vcam"
STATE = VDIR / "state.json"
LOG = VDIR / "server.log"
SERVER = Path(__file__).resolve().parent / "vcam_server.py"


def out(obj: dict) -> NoReturn:
    print(json.dumps(obj, ensure_ascii=False), flush=True)
    sys.exit(0 if obj.get("ok") else 1)


def _default_route_ip() -> str | None:
    """UDP connect 技巧取默认路由出口 IP（不发包）。开 VPN 时可能是隧道 IP，仅作兜底。"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        finally:
            s.close()
        return None if ip.startswith("127.") else ip
    except Exception:
        return None


def _is_private(ip: str) -> bool:
    if ip.startswith("192.168.") or ip.startswith("10."):
        return True
    if ip.startswith("172."):
        try:
            return 16 <= int(ip.split(".")[1]) <= 31
        except (ValueError, IndexError):
            return False
    return False


# 隧道 / 虚拟接口名前缀：这些 IP 手机在局域网里路由不到，必须排除
_TUNNEL_PREFIXES = (
    "utun", "tun", "tap", "ppp", "wg", "zt", "ts",       # VPN / 隧道
    "awdl", "llw",                                        # Apple P2P Wi-Fi
    "bridge", "vmnet", "vbox", "docker", "veth", "vnic",  # 虚拟机 / 容器
)


def detect_lan_ip() -> str | None:
    """
    选手机可达的局域网 IP。默认路由探测在开 VPN（TUN 模式）时会拿到隧道 IP
    （如 utun4 的 192.168.255.x），手机根本路由不到 —— 故优先用 psutil 枚举
    真实物理网卡打分，UDP 技巧仅作无 psutil 时的兜底。
    """
    default_ip = _default_route_ip()
    candidates: list[tuple[int, str]] = []
    try:
        import psutil

        stats = psutil.net_if_stats()
        for name, addrs in psutil.net_if_addrs().items():
            st = stats.get(name)
            if st is not None and not st.isup:
                continue
            lname = name.lower()
            is_tunnel = any(lname.startswith(p) for p in _TUNNEL_PREFIXES)
            for a in addrs:
                if a.family != socket.AF_INET:
                    continue
                ip = a.address
                if ip.startswith("127.") or ip.startswith("169.254."):
                    continue
                if getattr(a, "ptp", None):  # 点对点（VPN 隧道）
                    continue
                score = 0
                if not is_tunnel:
                    score += 100
                if _is_private(ip):
                    score += 50
                if getattr(a, "broadcast", None):  # 有广播地址 = 真实以太网/Wi-Fi 网段
                    score += 20
                if any(lname.startswith(p) for p in ("en", "eth", "wlan", "wl", "wi")):
                    score += 10
                if ip == default_ip:
                    score += 5
                candidates.append((score, ip))
    except Exception:
        pass
    if candidates:
        candidates.sort(reverse=True)
        return candidates[0][1]
    return default_ip


def healthz(port: int, timeout: float = 1.5) -> dict | None:
    try:
        with urllib.request.urlopen(
            f"http://127.0.0.1:{port}/healthz", timeout=timeout
        ) as r:
            data = json.loads(r.read().decode())
        return data if data.get("app") == "vcam-signaling" else None
    except Exception:
        return None


def shutdown_old(port: int, admin_token: str) -> None:
    try:
        urllib.request.urlopen(
            f"http://127.0.0.1:{port}/shutdown?k={admin_token}", timeout=2
        )
    except Exception:
        pass
    deadline = time.time() + 3
    while time.time() < deadline and healthz(port, 0.5) is not None:
        time.sleep(0.2)


def free_port(preferred: int) -> int:
    for candidate in (preferred, 0):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind(("", candidate))
            port = s.getsockname()[1]
            s.close()
            return port
        except OSError:
            continue
    raise OSError("no free port")


def result_from_health(h: dict) -> dict:
    return {
        "ok": True,
        "lanIp": h.get("lanIp"),
        "httpPort": h.get("httpPort"),
        "httpsPort": h.get("httpsPort"),
        "phoneBase": h.get("phoneBase"),
        "certMode": h.get("certMode"),
    }


def log_tail(n: int = 30) -> str:
    try:
        return "\n".join(LOG.read_text(errors="replace").splitlines()[-n:])
    except Exception:
        return ""


def main() -> None:
    ip = detect_lan_ip()
    if not ip:
        out({"ok": False, "error": "未检测到局域网 IP（电脑未联网？）"})

    # ── 1) 复用已在跑的 daemon ──
    state: dict = {}
    try:
        state = json.loads(STATE.read_text())
    except Exception:
        pass
    if state.get("httpPort"):
        h = healthz(int(state["httpPort"]))
        if h is not None:
            if h.get("lanIp") == ip and h.get("serverRevision") == SERVER_REVISION:
                out(result_from_health(h))
            # 换了网络或插件更新了 daemon 路由/协议：停旧的重启。
            shutdown_old(int(state["httpPort"]), str(state.get("adminToken", "")))

    # ── 2) 拉起新 daemon ──
    if not SERVER.is_file():
        out({"ok": False, "error": f"缺少 {SERVER.name}（插件安装不完整？）"})
    VDIR.mkdir(exist_ok=True)
    # token_hex（纯 [0-9a-f]）而非 token_urlsafe：后者可能以 "-" 开头，
    # 经 argv 传给 daemon 时会被 argparse 误认成选项
    admin_token = secrets.token_hex(16)
    http_port = free_port(PREFERRED_HTTP)
    https_port = free_port(PREFERRED_HTTPS)

    kwargs: dict = {}
    if os.name == "nt":
        DETACHED_PROCESS = 0x00000008
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        CREATE_NO_WINDOW = 0x08000000
        kwargs["creationflags"] = (
            DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW
        )
    else:
        kwargs["start_new_session"] = True

    logf = open(LOG, "ab")
    proc = subprocess.Popen(
        [
            sys.executable,
            str(SERVER),
            "--http-port", str(http_port),
            "--https-port", str(https_port),
            "--lan-ip", ip,
            "--admin-token", admin_token,
            "--root", str(ROOT),
        ],
        cwd=str(ROOT),
        stdout=logf,
        stderr=logf,
        stdin=subprocess.DEVNULL,
        **kwargs,
    )
    STATE.write_text(
        json.dumps(
            {
                "pid": proc.pid,
                "httpPort": http_port,
                "httpsPort": https_port,
                "adminToken": admin_token,
            }
        )
    )

    # ── 3) 等就绪（含首次 TLS 证书下载/生成）──
    deadline = time.time() + START_WAIT_S
    while time.time() < deadline:
        if proc.poll() is not None:
            out({
                "ok": False,
                "error": f"信令服务启动即退出（exit {proc.returncode}）",
                "logTail": log_tail(),
            })
        h = healthz(http_port, 1.0)
        if h is not None:
            out(result_from_health(h))
        time.sleep(0.3)

    out({"ok": False, "error": "信令服务启动超时", "logTail": log_tail()})


if __name__ == "__main__":
    main()
