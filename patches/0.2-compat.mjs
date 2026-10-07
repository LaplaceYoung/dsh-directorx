// 0.2-compat.mjs — 给 dsh-directorx 打「DSH 0.1.x → 0.2.x」兼容垫片
//
// 背景
//   dsh-directorx v0.2.0（上游 LaplaceYoung/dsh-directorx，Apache-2.0）是为 DSH 0.1.x 写的。
//   它在 apply() 里调用 ctx.settings.register(ns, Schema, {...}) 并拿到一个 scope 对象
//   （get/update/watch/load）；DSH 0.2.x 的 settings 服务已删除 register，
//   于是激活即抛 TypeError: ctx.settings.register is not a function → 153 个工具全部注册不上。
//   同样地，llm.registerConfigurableProviders 在 0.2.x 也不存在。
//
// 本补丁做了什么（只加垫片，不改上游业务逻辑）
//   1) 若存在旧 API（0.1.x）→ 原样走上游路径；
//      否则用 __dxCompatScope 提供一个等价的 scope（默认值 + 来自 entry config 的覆盖）。
//   2) 给 llm.registerConfigurableProviders 装一个 no-op 兜底，避免第二个缺失 API 再次炸掉激活。
//   3) apply() 增加第二形参 hostConfig，把 preset/entry 行里的 config 接进来当设置覆盖。
//
// 用法：node patches/0.2-compat.mjs [目标 lib/index.js]
//   不给参数时默认打 ./lib/index.js。幂等：打过会跳过。

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const target = resolve(process.argv[2] || 'lib/index.js')
// 统一换行：esbuild 产物在 Windows 上是 CRLF，锚点用 \n 写，必须先归一化
let src = readFileSync(target, 'utf8').replace(/\r\n/g, '\n')

if (src.includes('__dxCompatScope')) {
  console.log(`已打过补丁，跳过：${target}`)
  process.exit(0)
}

const SHIM = `/* --- dsh 0.2.x compatibility shim -----------------------------------------
 * 本地补丁，非上游代码。上游：LaplaceYoung/dsh-directorx v0.2.0 (Apache-2.0)。
 * DSH 0.2.x 删除了 ctx.settings.register 与 llm.registerConfigurableProviders，
 * 这里用等价的本地实现兜住，使插件仍能激活并注册工具。
 * ------------------------------------------------------------------------- */
var __DX_AUTH = { klingAk: "", klingSk: "", runwayVersion: "" };
var __DX_DEFAULTS = {
  outputDir: "directorx_output",
  timeoutMs: 120000,
  pollIntervalMs: 5000,
  maxPollAttempts: 360,
  persona: "\\u6210\\u7247",
  initiative: "\\u534F\\u540C",
  vision: { enabled: true, mode: "deepseek-chat", baseURL: "https://api.deepseek.com", apiKey: "", model: "deepseek-v4-flash-vision-exp", resolution: "1K", auth: { ...__DX_AUTH } },
  image: { enabled: true, mode: "openai-images", baseURL: "https://api.modelverse.cn/v1", apiKey: "", model: "gpt-image-2", resolution: "1K", auth: { ...__DX_AUTH } },
  video: { enabled: true, mode: "modelverse-tasks", baseURL: "https://api.modelverse.cn/v1", apiKey: "", model: "doubao-seedance-2-0-260128", resolution: "2K", auth: { ...__DX_AUTH } },
  audio: { enabled: true, mode: "openai-tts", baseURL: "https://api.modelverse.cn/v1", apiKey: "", model: "qwen3-tts-flash", resolution: "1K", auth: { ...__DX_AUTH } }
};
function __dxClone(v) { return v === void 0 ? v : JSON.parse(JSON.stringify(v)); }
function __dxMerge(a, b) {
  if (b === void 0 || b === null) return __dxClone(a);
  if (Array.isArray(a) || Array.isArray(b) || typeof a !== "object" || typeof b !== "object" || a === null || b === null) return __dxClone(b);
  const out = { ...a };
  for (const k of Object.keys(b)) out[k] = __dxMerge(a[k], b[k]);
  return out;
}
function __dxCompatScope(ctx, ns, schema, hostConfig) {
  let current = __dxMerge(__dxClone(__DX_DEFAULTS), hostConfig || {});
  const watchers = new Set();
  const emit = () => {
    for (const fn of [...watchers]) {
      try { fn(__dxClone(current)); } catch (e) {
        ctx.logger?.error?.("directorx: settings watcher failed: %s", e instanceof Error ? e.message : String(e));
      }
    }
  };
  return {
    get: () => __dxClone(current),
    update: async (patch) => { current = __dxMerge(current, patch); emit(); return __dxClone(current); },
    watch: (fn) => { if (typeof fn === "function") watchers.add(fn); return () => watchers.delete(fn); },
    load: async () => __dxClone(current)
  };
}
`

const edits = [
  {
    name: 'A: 在 src/index.ts 段落前插入垫片',
    from: '// src/index.ts\nvar name = "directorx";',
    to: SHIM + '// src/index.ts\nvar name = "directorx";',
  },
  {
    name: 'B1: apply 接收 hostConfig，并优先走旧 API',
    from: `function apply(ctx) {
  corpus.setRoot(fileURLToPath7(new URL("../knowledge/", import.meta.url)));
  const namespace = SETTINGS_NS;
  const scope = ctx.settings.register(namespace, DirectorxSettings, {`,
    to: `function apply(ctx, __dxHostConfig) {
  corpus.setRoot(fileURLToPath7(new URL("../knowledge/", import.meta.url)));
  const namespace = SETTINGS_NS;
  const scope = ctx.settings && typeof ctx.settings.register === "function"
    ? ctx.settings.register(namespace, DirectorxSettings, {`,
  },
  {
    name: 'B2: 关闭三元并在 0.2.x 分支用垫片；给 llm 注册装 no-op 兜底',
    from: `    }
  });
  const llm = ctx.get("llm");`,
    to: `    }
  })
    : __dxCompatScope(ctx, namespace, DirectorxSettings, __dxHostConfig);
  const llm = ctx.get("llm");
  if (llm && typeof llm.registerConfigurableProviders !== "function") llm.registerConfigurableProviders = () => {};`,
  },
]

for (const e of edits) {
  const count = src.split(e.from).length - 1
  if (count !== 1) {
    console.error(`❌ 锚点不唯一或缺失（${count} 处）：${e.name}`)
    process.exit(1)
  }
  src = src.replace(e.from, e.to)
  console.log(`✅ ${e.name}`)
}

writeFileSync(target, src, 'utf8')
console.log(`\n补丁已写入：${target}`)
