/**
 * 3D 导演台打包步骤：把 assets/stage 下的恢复版应用打进 lib/stage/。
 *
 * - 模块入口（app.jsx、stage-*）经 esbuild 打包：jsx 运行时走 jsx-shim
 *   （借 vendor chunk 内置的 react/jsx-runtime），`../src/*` 别名到
 *   src/director（服务端共享的引擎源码锥）。
 * - 经典脚本与静态资源按规则复制，并把根绝对路径重写到 /directorx/stage 前缀。
 * - index.html 模板是我们自己的（脚本顺序与原宿主一致，加上 API 前缀注入）。
 */
import { build } from 'esbuild'
import { cp, mkdir, readFile, rm, writeFile, copyFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WEB = join(ROOT, 'assets/stage/web')
const HOST = join(ROOT, 'assets/stage/host')
const VCAM = join(ROOT, 'assets/stage/vcam')
const ENGINE = join(ROOT, 'src/director')
const OUT = join(ROOT, 'lib/stage')

const STAGE_BASE = '/directorx/stage'

/** 根绝对路径 → 前缀。app.jsx 的 fetch 与资产引用要落到我们的路由下。 */
const REWRITES = [
  ['"/api/upload', `"/directorx/stage/api/upload`],
  ['"/api/takes', `"/directorx/stage/api/takes`],
  ['"/api/agent/events', `"/directorx/stage/api/agent/events`],
  ['"/api/agent/result', `"/directorx/stage/api/agent/result`],
  ['"/api/agent/invoke', `"/directorx/stage/api/agent/invoke`],
  ['"/api/agent/tools', `"/directorx/stage/api/agent/tools`],
  ['"/api/agent/prompts', `"/directorx/stage/api/agent/prompts`],
  ['"/api/agent/resources', `"/directorx/stage/api/agent/resources`],
  ['"/api/agent/resource', `"/directorx/stage/api/agent/resource`],
  ['"/api/python/run', `"/directorx/stage/api/python/run`],
  ['"/models/', `"/directorx/stage/models/`],
  ['"/luts/', `"/directorx/stage/luts/`],
  ['"/files/', `"/directorx/stage/files/`],
  ['"/phone.html', `"/directorx/stage/phone.html`],
  // agent-bus 的导入守卫：放行我们前缀下的 uploads 产物
  ['^(\\/uploads\\/|blob:|data:)', '^(\\\\/directorx\\\\/stage\\\\/files\\\\/uploads\\\\/|\\\\/uploads\\\\/|blob:|data:)'],
]

const rewrite = (source) => REWRITES.reduce((text, [from, to]) => text.split(from).join(to), source)

/** 不会进入重写集合（min vendor chunk 与加载器 blob，改动风险大于收益）。 */
const NO_REWRITE = new Set(['index-Bt3LoRYv.js', 'plyLoader-ChQmPnxM.js', 'spzLoader-CU_GD7s0.js', 'phone-DyeVK3Rl.js'])

const MODULE_ENTRIES = [
  'app.jsx',
  'stage-look.js',
  'stage-studio.js',
  'stage-multicam.js',
  'stage-contact.js',
  'stage-env.js',
  'stage-viewfinder.js',
]

const CLASSIC_SCRIPTS = [
  'possess-mode.js',
  'camera-optics.js',
  'agent-bus.js',
  'stage-review.js',
  'stage-trim.js',
  'stage-keys.js',
]

const STATIC_FILES = ['index-D7VV03Tb.css', 'favicon.svg', 'phone.html', 'phone-DyeVK3Rl.js']

const engineAliasPlugin = {
  name: 'director-engine-alias',
  setup(b) {
    // web 模块里的 `../src/...` 指回我们 vendored 的引擎源码锥
    b.onResolve({ filter: /^\.\.\/src\// }, (args) => {
      const rel = args.path.replace('../src/', '')
      const normalized = rel.endsWith('.ts') ? rel.slice(0, -3) : rel
      for (const ext of ['.ts', '.tsx', '.js']) {
        const candidate = join(ENGINE, normalized + ext)
        if (existsSync(candidate)) return { path: candidate }
      }
      throw new Error(`stage engine alias miss: ${args.path} (from ${args.importer})`)
    })
  },
}

const rewritePlugin = {
  name: 'director-stage-rewrite',
  setup(b) {
    b.onLoad({ namespace: 'file', filter: /.*/ }, async (args) => {
      if (!args.path.startsWith(WEB)) return undefined
      const base = args.path.slice(WEB.length + 1)
      if (NO_REWRITE.has(base)) return undefined
      const source = await readFile(args.path, 'utf8')
      return {
        contents: rewrite(source),
        loader: args.path.endsWith('.jsx') ? 'jsx' : args.path.endsWith('.ts') ? 'ts' : args.path.endsWith('.tsx') ? 'tsx' : 'jsx',
      }
    })
  },
}

export async function buildStage() {
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  await build({
    absWorkingDir: WEB,
    entryPoints: MODULE_ENTRIES,
    outdir: OUT,
    outExtension: { '.js': '.js' },
    bundle: true,
    format: 'esm',
    target: 'es2022',
    sourcemap: true,
    splitting: true,
    jsx: 'automatic',
    jsxImportSource: 'jsx-shim',
    alias: {
      'jsx-shim/jsx-runtime': join(WEB, 'jsx-shim/jsx-runtime.js'),
      'jsx-shim/jsx-dev-runtime': join(WEB, 'jsx-shim/jsx-dev-runtime.js'),
    },
    plugins: [engineAliasPlugin, rewritePlugin],
    logLevel: 'silent',
    entryNames: '[name]',
    chunkNames: 'chunks/[name]-[hash]',
  })

  for (const file of CLASSIC_SCRIPTS) {
    await writeFile(join(OUT, file), rewrite(await readFile(join(WEB, file), 'utf8')))
  }
  for (const file of STATIC_FILES) {
    await copyFile(join(WEB, file), join(OUT, file))
  }
  await cp(join(WEB, 'models'), join(OUT, 'models'), { recursive: true })
  await cp(join(WEB, 'luts'), join(OUT, 'luts'), { recursive: true })
  await cp(VCAM, join(OUT, 'vcam'), { recursive: true })
  await copyFile(join(HOST, 'dsh-host.js'), join(OUT, 'dsh-host.js'))

  await writeFile(join(OUT, 'index.html'), `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
    <title>3D 导演台</title>
    <link rel="icon" type="image/svg+xml" href="${STAGE_BASE}/favicon.svg" />
    <link rel="stylesheet" href="${STAGE_BASE}/index-D7VV03Tb.css" />
    <script>
      window.__DIRECTOR_API_HOST__ = ${JSON.stringify(STAGE_BASE)};
      window.__dxBoot = [];
      window.addEventListener("error", (e) => {
        const msg = String(e.message || (e.error && e.error.message) || "");
        if (!msg) return;
        window.__dxBoot.push({ type: "error", msg, src: String(e.filename || ""), line: e.lineno, stack: String((e.error && e.error.stack) || "") });
      }, true);
      window.addEventListener("unhandledrejection", (e) => {
        window.__dxBoot.push({ type: "rej", msg: String((e.reason && (e.reason.stack || e.reason.message || e.reason)) || e.reason) });
      });
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script src="${STAGE_BASE}/dsh-host.js"></script>
    <script src="${STAGE_BASE}/possess-mode.js"></script>
    <script src="${STAGE_BASE}/camera-optics.js"></script>
    <script src="${STAGE_BASE}/agent-bus.js"></script>
    <script type="module" src="${STAGE_BASE}/app.js"></script>
    <script type="module" src="${STAGE_BASE}/stage-look.js"></script>
    <script src="${STAGE_BASE}/stage-review.js"></script>
    <script type="module" src="${STAGE_BASE}/stage-multicam.js"></script>
    <script type="module" src="${STAGE_BASE}/stage-contact.js"></script>
    <script type="module" src="${STAGE_BASE}/stage-studio.js"></script>
    <script src="${STAGE_BASE}/stage-trim.js"></script>
    <script src="${STAGE_BASE}/stage-keys.js"></script>
    <script type="module" src="${STAGE_BASE}/stage-viewfinder.js"></script>
    <script type="module" src="${STAGE_BASE}/stage-env.js"></script>
    <script>
      window.addEventListener("wheel", (e) => {
        if (e.ctrlKey || e.metaKey) e.preventDefault();
      }, { passive: false });
      window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault();
      });
      ["gesturestart", "gesturechange", "gestureend"].forEach((evt) => window.addEventListener(evt, (e) => e.preventDefault()));
    </script>
  </body>
</html>
`)

  const files = await readdir(OUT)
  console.log(`  lib/stage: ${files.length} entries`)
}
