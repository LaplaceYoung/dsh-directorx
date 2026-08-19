import { build } from 'esbuild'
import { cp, mkdir, readFile, rm, writeFile, appendFile } from 'node:fs/promises'

const HOST_EXTERNALS = [
  'cordis',
  'schemastery',
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
  'cordis',
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
  external: HOST_EXTERNALS,
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
  loader: { '.css': 'local-css' },
  external: CLIENT_EXTERNALS,
  banner: {
    js: `var module = { exports: {} }; var exports = module.exports;
window.__ModuleLoader__.load({ id: "dsh-directorx", factory: (require) => {`,
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

// The module loader serves only client.js (and its map); any CSS esbuild
// still emits (e.g. tippy styles pulled in by the image editor) is inlined
// into the bundle as a runtime style injection so no separate file is needed.
try {
  const css = await readFile('lib/client.css', 'utf8')
  const injected = `\n;(function(){try{var el=document.createElement('style');el.setAttribute('data-directorx','1');el.textContent=${JSON.stringify(css)};document.head.appendChild(el);}catch(e){}})();`
  await appendFile('lib/client.js', injected)
  await rm('lib/client.css', { force: true })
  await rm('lib/client.css.map', { force: true })
} catch {
  // No CSS emitted this build — nothing to inline.
}

// Vendor runtime assets (transformers.js WASM stack) ship inside lib/ so the
// installed package under ~/.dsh/profiles/*/node_modules stays self-contained.
try {
  await cp('vendor', 'lib/vendor', { recursive: true })
} catch {
  // No vendor directory — nothing to ship.
}

console.log('dsh-directorx built: lib/index.js, lib/client.js (+ lib/vendor)')