#!/usr/bin/env python3
"""
vcam_server.py — VCam 局域网信令 + 手机页面服务（常驻 daemon）。

由 vcam_launcher.py 以脱离进程（detached）方式拉起，跑在插件 venv 里：

  两个监听：
    1. http://127.0.0.1:<http_port>   — 桌面 iframe 用（明文 WS 信令 + healthz/shutdown）。
       iframe 是 http 页面，连自签 wss 会被浏览器静默拒绝，故桌面侧必须走明文本地口。
    2. https://0.0.0.0:<https_port>   — 手机用（phone.html 静态页 + wss 信令）。
       陀螺仪 API 要求 secure context，手机侧必须 HTTPS。

  证书两档：
    trusted     — 从 local-ip.co 下载公开共享的 GlobalSign 通配证书 *.my.local-ip.co，
                  二维码域名 <lan-ip 连字符>.my.local-ip.co（公共 DNS 解析回局域网 IP），
                  手机无任何警告。注意：该证书私钥公开，仅适合无敏感数据的局域网场景
                  （VCam 信令只有 SDP/ICE 与操控指令，且高频数据走 WebRTC 直连不经此服务）。
    self-signed — local-ip.co 不可达时回退：cryptography 生成自签证书（SAN=局域网 IP），
                  手机首次打开需手动信任。

  信令协议（与 src/vcam/protocol.ts 对齐）：
    连接 /vcam-ws?role=desktop|phone&session=<id>&token=<secret>
    - 服务器发出：hello-ack（带 lanUrl/lanIp/certMode）、paired、peer-left
    - 其余消息在 desktop/phone 之间原样转发
    - 4001 token 校验失败（客户端不重连）、4002 被同角色新连接顶替

  生命周期：15 分钟无桌面连接自动退出；/shutdown?k=<admin-token> 主动退出。
"""
from __future__ import annotations

import argparse
import asyncio
import http
import json
import mimetypes
import os
import sys
import time
import urllib.request
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

from websockets.asyncio.server import serve
from websockets.datastructures import Headers
from websockets.http11 import Response

CLOSE_UNAUTHORIZED = 4001
CLOSE_REPLACED = 4002
IDLE_EXIT_S = 15 * 60
SERVER_REVISION = "2"  # bump when daemon routes/protocol change; launcher restarts stale copies
CERT_MAX_AGE_S = 7 * 24 * 3600  # local-ip.co 证书缓存（定期轮换，7 天内直接复用）
# local-ip.co：公开共享的 GlobalSign 通配证书 *.my.local-ip.co，
# DNS 把 <ip 连字符>.my.local-ip.co 解析回局域网 IP（xip.io 式服务）
LOCALIP_CERT_URL = "http://local-ip.co/cert/server.pem"
LOCALIP_CHAIN_URL = "http://local-ip.co/cert/chain.pem"
LOCALIP_KEY_URL = "http://local-ip.co/cert/server.key"
LOCALIP_DOMAIN_SUFFIX = ".my.local-ip.co"

# 静态服务白名单：根文件 + 允许的子目录（插件产物里手机页所需的全部资源）
STATIC_FILES = {
    "phone.html",
    "favicon.svg",
    "phone-DyeVK3Rl.js",
    "index-Bt3LoRYv.js",
    "index-D7VV03Tb.css",
}
STATIC_DIRS = {"assets", "models"}
PHONE_LOG_MAX_CHARS = 6000
PHONE_LOG_MAX_PER_SESSION = 20

# 由 main() 填充的运行时全局
ROOT = Path.cwd()
LAN_IP = ""
PHONE_BASE = ""  # 如 https://192-168-1-7.my.local-ip.co:45821
CERT_MODE = "self-signed"
ADMIN_TOKEN = ""
HTTP_PORT = 0
HTTPS_PORT = 0
START_TS = time.time()

last_desktop_ts = time.monotonic()


def log(msg: str) -> None:
    print(f"[vcam-server] {time.strftime('%H:%M:%S')} {msg}", flush=True)


# ── 会话与转发 ────────────────────────────────────────────────────────────────

class Session:
    __slots__ = ("token", "desktop", "phone", "phone_log_count")

    def __init__(self, token: str):
        self.token = token
        self.desktop = None
        self.phone = None
        self.phone_log_count = 0


sessions: dict[str, Session] = {}


async def send_json(conn, obj: dict) -> None:
    try:
        await conn.send(json.dumps(obj))
    except Exception:
        pass  # 对端正在断开，随 finally 清理


async def ws_handler(conn) -> None:
    global last_desktop_ts
    q = parse_qs(urlsplit(conn.request.path).query)
    role = (q.get("role") or [""])[0]
    sid = (q.get("session") or [""])[0]
    token = (q.get("token") or [""])[0]
    if role not in ("desktop", "phone") or not sid or not token:
        await conn.close(CLOSE_UNAUTHORIZED, "bad params")
        return

    sess = sessions.get(sid)
    if role == "desktop":
        # 桌面首连注册会话；token 不符（极小概率的 session id 撞车）拒绝
        if sess is None:
            sess = sessions[sid] = Session(token)
        elif sess.token != token:
            await conn.close(CLOSE_UNAUTHORIZED, "token mismatch")
            return
    else:
        # 手机必须凭桌面已注册的 session+token 进入
        if sess is None or sess.token != token:
            await conn.close(CLOSE_UNAUTHORIZED, "unknown session")
            return

    # 同角色重复连接：新连接顶替旧连接（旧的收 4002 不再重连）
    old = getattr(sess, role)
    setattr(sess, role, conn)
    if old is not None:
        try:
            await old.close(CLOSE_REPLACED, "replaced")
        except Exception:
            pass

    log(f"{role} connected (session={sid})")
    if role == "desktop":
        last_desktop_ts = time.monotonic()
        await send_json(conn, {
            "type": "hello-ack",
            "lanUrl": PHONE_BASE,
            "lanIp": LAN_IP,
            "certMode": CERT_MODE,
        })
    if sess.desktop is not None and sess.phone is not None:
        await send_json(sess.desktop, {"type": "paired"})
        await send_json(sess.phone, {"type": "paired"})

    try:
        async for raw in conn:
            peer = sess.phone if role == "desktop" else sess.desktop
            if peer is not None:
                try:
                    await peer.send(raw)
                except Exception:
                    pass
    finally:
        # 仅当槽位仍是本连接时才清理（可能已被新连接顶替）
        if getattr(sess, role) is conn:
            setattr(sess, role, None)
            peer = sess.phone if role == "desktop" else sess.desktop
            if peer is not None:
                await send_json(peer, {"type": "peer-left"})
            if sess.desktop is None and sess.phone is None:
                sessions.pop(sid, None)
        if role == "desktop":
            last_desktop_ts = time.monotonic()
        log(f"{role} disconnected (session={sid})")


# ── HTTP（healthz / shutdown / 手机静态页）──────────────────────────────────

def _response(status: http.HTTPStatus, body: bytes, content_type: str) -> Response:
    h = Headers()
    h["Content-Type"] = content_type
    h["Content-Length"] = str(len(body))
    h["Cache-Control"] = "no-cache"
    return Response(status.value, status.phrase, h, body)


def _health_payload() -> dict:
    return {
        "app": "vcam-signaling",
        "serverRevision": SERVER_REVISION,
        "pid": os.getpid(),
        "lanIp": LAN_IP,
        "httpPort": HTTP_PORT,
        "httpsPort": HTTPS_PORT,
        "phoneBase": PHONE_BASE,
        "certMode": CERT_MODE,
        "startedAt": START_TS,
    }


def _serve_static(path: str) -> Response:
    rel = path.lstrip("/") or "phone.html"
    parts = Path(rel).parts
    allowed = (len(parts) == 1 and parts[0] in STATIC_FILES) or (
        len(parts) > 1 and parts[0] in STATIC_DIRS
    )
    f = (ROOT / rel).resolve()
    root = str(ROOT.resolve())
    if not allowed or not str(f).startswith(root + os.sep) or not f.is_file():
        return _response(http.HTTPStatus.NOT_FOUND, b"not found", "text/plain")
    ct = mimetypes.guess_type(f.name)[0] or "application/octet-stream"
    return _response(http.HTTPStatus.OK, f.read_bytes(), ct)


def make_process_request(kind: str):
    """kind: 'local'（127.0.0.1 明文口）| 'lan'（0.0.0.0 HTTPS 口）"""

    def process_request(connection, request):
        path = urlsplit(request.path).path
        if path == "/vcam-ws":
            return None  # 交给 WebSocket 握手
        if path == "/healthz":
            body = json.dumps(_health_payload()).encode()
            return _response(http.HTTPStatus.OK, body, "application/json")
        if kind == "lan" and path == "/vcam-log":
            # phone.html 的内联启动诊断：即使主 module 加载/执行失败，也能把错误
            # 经 daemon 转发给已连接的桌面端，再由 hub.log 写入 Hub 日志。
            # 凭据与诊断放自定义 header，避免进入 URL / 代理 access log。
            sid = request.headers.get("X-VCam-Session", "")
            token = request.headers.get("X-VCam-Token", "")
            message = unquote(request.headers.get("X-VCam-Log", ""))[:PHONE_LOG_MAX_CHARS]
            sess = sessions.get(sid)
            if not message or sess is None or sess.token != token:
                return _response(http.HTTPStatus.FORBIDDEN, b"forbidden", "text/plain")
            if sess.phone_log_count >= PHONE_LOG_MAX_PER_SESSION:
                return _response(http.HTTPStatus.TOO_MANY_REQUESTS, b"rate limited", "text/plain")
            sess.phone_log_count += 1
            log(f"phone diagnostic (session={sid}): {message}")
            if sess.desktop is not None:
                asyncio.get_running_loop().create_task(
                    send_json(sess.desktop, {"type": "debug-log", "text": message})
                )
            return _response(http.HTTPStatus.NO_CONTENT, b"", "text/plain")
        if kind == "local" and path == "/shutdown":
            k = (parse_qs(urlsplit(request.path).query).get("k") or [""])[0]
            if k and k == ADMIN_TOKEN:
                log("shutdown requested")
                asyncio.get_running_loop().call_later(0.2, os._exit, 0)
                return _response(http.HTTPStatus.OK, b"bye", "text/plain")
            return _response(http.HTTPStatus.FORBIDDEN, b"forbidden", "text/plain")
        if kind == "lan":
            return _serve_static(path)
        return _response(http.HTTPStatus.NOT_FOUND, b"not found", "text/plain")

    return process_request


# ── TLS 证书 ─────────────────────────────────────────────────────────────────

def _fetch(url: str, timeout: float = 6.0) -> bytes:
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return r.read()


def _make_ctx(cert_f: Path, key_f: Path):
    import ssl

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(str(cert_f), str(key_f))
    return ctx


def _ensure_self_signed(state_dir: Path, lan_ip: str) -> tuple[Path, Path]:
    cert_f = state_dir / f"self-{lan_ip}.pem"
    key_f = state_dir / f"self-{lan_ip}.key"
    if (
        cert_f.is_file()
        and key_f.is_file()
        and time.time() - cert_f.stat().st_mtime < 300 * 24 * 3600
    ):
        return cert_f, key_f

    import datetime
    import ipaddress

    from cryptography import x509
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.x509.oid import NameOID

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, f"VCam {lan_ip}")])
    now = datetime.datetime.now(datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(name)
        .issuer_name(name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=397))
        .add_extension(
            x509.SubjectAlternativeName([x509.IPAddress(ipaddress.ip_address(lan_ip))]),
            critical=False,
        )
        .sign(key, hashes.SHA256())
    )
    key_f.write_bytes(
        key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    )
    cert_f.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    return cert_f, key_f


def prepare_tls(state_dir: Path, lan_ip: str):
    """返回 (ssl_ctx, 手机访问 host, certMode)。优先 local-ip.co 共享真证书，失败回退自签。"""
    cert_f = state_dir / "local-ip-fullchain.pem"
    key_f = state_dir / "local-ip-privkey.pem"
    try:
        fresh = (
            cert_f.is_file()
            and key_f.is_file()
            and time.time() - cert_f.stat().st_mtime < CERT_MAX_AGE_S
        )
        if not fresh:
            cert = _fetch(LOCALIP_CERT_URL)
            chain = _fetch(LOCALIP_CHAIN_URL)
            key = _fetch(LOCALIP_KEY_URL)
            if b"BEGIN CERTIFICATE" not in cert or b"PRIVATE KEY" not in key:
                raise ValueError("unexpected local-ip.co cert payload")
            # 叶证书 + 中间链拼成 fullchain（手机端校验需要完整链）
            cert_f.write_bytes(cert.rstrip() + b"\n" + chain)
            key_f.write_bytes(key)
        ctx = _make_ctx(cert_f, key_f)
        host = lan_ip.replace(".", "-") + LOCALIP_DOMAIN_SUFFIX
        return ctx, host, "trusted"
    except Exception as e:  # 无外网 / 服务不可达 / 证书损坏
        log(f"local-ip.co cert unavailable, falling back to self-signed: {e}")

    cert_f, key_f = _ensure_self_signed(state_dir, lan_ip)
    return _make_ctx(cert_f, key_f), lan_ip, "self-signed"


# ── 生命周期 ─────────────────────────────────────────────────────────────────

async def reaper() -> None:
    """15 分钟无桌面连接自动退出，不留常驻僵尸进程。"""
    global last_desktop_ts
    while True:
        await asyncio.sleep(30)
        if any(s.desktop is not None for s in sessions.values()):
            last_desktop_ts = time.monotonic()
            continue
        if time.monotonic() - last_desktop_ts > IDLE_EXIT_S:
            log("idle timeout, exiting")
            os._exit(0)


async def main_async(args) -> None:
    global ROOT, LAN_IP, PHONE_BASE, CERT_MODE, ADMIN_TOKEN, HTTP_PORT, HTTPS_PORT
    ROOT = Path(args.root).resolve()
    LAN_IP = args.lan_ip
    ADMIN_TOKEN = args.admin_token
    HTTP_PORT = args.http_port
    HTTPS_PORT = args.https_port

    state_dir = ROOT / ".vcam"
    state_dir.mkdir(exist_ok=True)

    ctx, host, CERT_MODE = prepare_tls(state_dir, LAN_IP)
    PHONE_BASE = f"https://{host}:{HTTPS_PORT}"

    async with (
        serve(
            ws_handler,
            "127.0.0.1",
            HTTP_PORT,
            process_request=make_process_request("local"),
        ),
        serve(
            ws_handler,
            "0.0.0.0",
            HTTPS_PORT,
            ssl=ctx,
            process_request=make_process_request("lan"),
        ),
    ):
        asyncio.get_running_loop().create_task(reaper())
        log(
            f"ready http=127.0.0.1:{HTTP_PORT} https=0.0.0.0:{HTTPS_PORT} "
            f"phone={PHONE_BASE} cert={CERT_MODE}"
        )
        await asyncio.Future()


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--http-port", type=int, required=True)
    p.add_argument("--https-port", type=int, required=True)
    p.add_argument("--lan-ip", required=True)
    p.add_argument("--admin-token", required=True)
    p.add_argument("--root", required=True)
    args = p.parse_args()
    try:
        asyncio.run(main_async(args))
    except Exception as e:
        log(f"fatal: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
