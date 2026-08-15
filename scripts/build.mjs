import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'

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
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-schema-form',
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

console.log('dsh-directorx built: lib/index.js, lib/client.js')