import { build } from 'esbuild'
import { cp, mkdir, readFile, rm, writeFile, appendFile } from 'node:fs/promises'
import { buildStage } from './build-stage.mjs'

const HOST_EXTERNALS = [
  '@deepseek-ai/cordis',
  '@deepseek-ai/schemastery',
  '@deepseek-ai/dsh-tools',
  '@deepseek-ai/dsh-skill',
  '@deepseek-ai/dsh-settings',
  '@deepseek-ai/dsh-system-prompt',
]

const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
]

await mkdir('lib', { recursive: true })

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  external: [...HOST_EXTERNALS, 'node:*'],
  logLevel: 'info',
})

await build({
  entryPoints: ['src/testing-entry.ts'],
  outfile: 'lib/testing.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  external: ['node:*'],
  logLevel: 'info',
})

await build({
  entryPoints: ['src/client/index.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: 'es2022',
  sourcemap: true,
  jsx: 'automatic',
  // Global-class stylesheets only (xyflow base, tui-image-editor/tippy): CSS
  // Modules hashing (`local-css`) renames `react-flow__viewport` away from
  // the class names the components put on the DOM, breaking every selection/
  // pane measurement. No DirectorX-authored .module.css exists to protect.
  loader: { '.css': 'css' },
  external: CLIENT_EXTERNALS,
  banner: {
    js: `window.__ModuleLoader__.load({ id: "dsh-directorx", factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
  },
  footer: {
    js: 'return module.exports; } });',
  },
  logLevel: 'info',
})

await writeFile('lib/index.d.ts', `export declare const name: string
export declare const inject: string[]
export declare function apply(ctx: any): void
`)

await writeFile('lib/client.d.ts', `export declare const name: string
export declare const inject: string[]
export declare function apply(ctx: any): void
`)

// Vendor runtime assets (transformers.js WASM stack) ship inside lib/ so the
// installed package under ~/.dsh/profiles/*/node_modules stays self-contained.
try {
  await cp('vendor', 'lib/vendor', { recursive: true })
} catch {
  // No vendor directory — nothing to ship.
}
// 3D 导演台：恢复版应用 + 引擎源码锥打进 lib/stage（宿主 web 直接伺服）。
await buildStage()
  await rm('lib/edit', { recursive: true, force: true })
  await cp('assets/edit', 'lib/edit', { recursive: true })

// The module loader serves only client.js (and its map); the emitted CSS
// cannot reach the browser as a sidecar, so inline it as a runtime <style>
// injection. Keep this step — removing it silently blanks the base styles
// of the whole canvas stack.
try {
  const css = await readFile('lib/client.css', 'utf8')
  const injected = `\n;(function(){try{var el=document.createElement('style');el.setAttribute('data-directorx','1');el.textContent=${JSON.stringify(css)};document.head.appendChild(el);}catch(e){}})();`
  await appendFile('lib/client.js', injected)
  await rm('lib/client.css', { force: true })
  await rm('lib/client.css.map', { force: true })
} catch {
  // No CSS emitted this build — nothing to inline.
}

console.log('dsh-directorx built: lib/index.js, lib/client.js (+ lib/vendor, lib/stage, lib/edit)')