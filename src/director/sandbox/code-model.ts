/**
 * 代码模型安全沙箱 — createModel(code, ctx?) 的隔离执行环境。
 * 用户提交的 JS 程序在此沙箱中编译为 THREE.Group。
 *
 * 契约：
 * - 用户程序必须定义 function createModel(ctx) 并返回 THREE.Object3D
 * - 沙箱通过 new Function('ctx', strict 包装) 隔离执行
 * - 静态禁止：import / require / await / fetch / DOM / eval / Function / process
 * - 返回值校验：Object3D 实例 + NaN 法线检查 + 有限变换检查
 */

import type { CodeModelContext } from '../types'
import * as THREE from 'three'

export type { CodeModelContext } from '../types'

export interface CodeModelResult {
  ok: boolean
  model?: THREE.Group
  error?: string
}

/** 静态检查禁止的模式（含括号访问与裸标识符） */
const FORBIDDEN_PATTERNS: [RegExp, string][] = [
  [/\bimport\b/, 'import statement'],
  [/\brequire\s*\(/, 'require()'],
  [/\bawait\b/, 'await expression'],
  [/fetch\s*\(/, 'fetch()'],
  [/XMLHttpRequest/, 'XMLHttpRequest'],
  [/document\s*[.[]/, 'document access'],
  [/window\s*[.[]/, 'window access'],
  [/globalThis\b/, 'globalThis access'],
  [/localStorage/, 'localStorage'],
  [/sessionStorage/, 'sessionStorage'],
  [/\beval\s*\(/, 'eval()'],
  [/Function\s*\(/, 'Function constructor'],
  [/\bprocess\b/, 'process object'],
]
export function validateCode(code: string): { ok: boolean; violations?: string[] } {
  const violations: string[] = []
  for (const [pattern, desc] of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) violations.push(desc)
  }
  if (violations.length > 0) return { ok: false, violations }
  return { ok: true }
}

/**
 * 安全执行用户代码并返回 THREE.Group。
 * 使用 new Function 隔离作用域，ctx 仅暴露 THREE。
 */
export function executeCodeModel(code: string, context?: CodeModelContext): CodeModelResult {
  // 静态检查
  const validation = validateCode(code)
  if (!validation.ok) {
    return { ok: false, error: `Forbidden patterns: ${validation.violations?.join(', ')}` }
  }

  try {
    const ctx = context ?? { THREE }
    // wrapper：执行用户代码后调用其定义的 createModel(ctx)（bundle 同款后缀）
    const wrapper =
      '"use strict";\n' + code +
      ';if (typeof createModel !== "function") throw new Error("code must define function createModel(ctx)");return createModel(ctx);'
    const fn = new Function('ctx', wrapper)
    const result = fn(ctx)

    // 返回值类型校验（严格 Group 契约；兼容自定义 ctx 注入的 THREE）
    const GroupCtor = ctx.THREE?.Group ?? THREE.Group
    if (!result || typeof result !== 'object') {
      return { ok: false, error: 'createModel must return a THREE.Group' }
    }
    if (!(result instanceof GroupCtor)) {
      return { ok: false, error: 'createModel(ctx) must return a THREE.Group' }
    }

    let hasNaN = false
    result.traverse((child) => {
      if ('geometry' in child && child.geometry) {
        const geo = child.geometry as THREE.BufferGeometry
        const normals = geo.attributes.normal
        if (normals) {
          for (let i = 0; i < normals.count; i++) {
            if (isNaN(normals.getX(i)) || isNaN(normals.getY(i)) || isNaN(normals.getZ(i))) {
              hasNaN = true
              break
            }
          }
        }
      }
    })
    if (hasNaN) {
      return { ok: false, error: 'Geometry contains NaN normals' }
    }

    // 有限变换检查
    let hasBadTransform = false
    result.traverse((child) => {
      const p = child.position
      const r = child.rotation
      const sc = child.scale
      if (![p.x, p.y, p.z, r.x, r.y, r.z, sc.x, sc.y, sc.z].every(Number.isFinite)) {
        hasBadTransform = true
      }
    })
    if (hasBadTransform) {
      return { ok: false, error: 'Object contains NaN/Infinity transform values' }
    }

    return { ok: true, model: result as THREE.Group }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * 主入口：编译用户代码为 THREE.Group。
 * @param code  用户 JS 源码，须定义 function createModel(ctx)
 * @param context  可选上下文（默认 { THREE }）
 */
export function createModel(code: string, context?: CodeModelContext): CodeModelResult {
  return executeCodeModel(code, context)
}
