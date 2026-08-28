/**
 * Agent 桥 — 宿主(Design app) ↔ 导演台 iframe 的双向通信协议。
 * 请求-响应模式 + 安全校验(origin/token)。
 */

export interface BridgeRequest {
  id: string
  method: string
  params: Record<string, unknown>
}

export interface BridgeResponse {
  id: string
  result?: unknown
  error?: { code: string; message: string }
}

type MethodHandler = (params: Record<string, unknown>) => Promise<unknown>

export class DirectorBridge {
  private handlers = new Map<string, MethodHandler>()
  private allowedOrigins = new Set<string>()
  private sessionToken = ''

  registerHandler(method: string, handler: MethodHandler): void {
    this.handlers.set(method, handler)
  }

  registerBatch(handlers: Record<string, MethodHandler>): void {
    Object.entries(handlers).forEach(([m, h]) => this.registerHandler(m, h))
  }

  setSessionToken(token: string): void { this.sessionToken = token }

  listen(targetOrigin: string): void {
    if (targetOrigin !== '*') this.allowedOrigins.add(targetOrigin)
    window.addEventListener('message', (event: MessageEvent) => {
      if (this.allowedOrigins.size > 0 && !this.allowedOrigins.has(event.origin)) return
      const data = event.data as Partial<BridgeRequest>
      if (!data || typeof data.id !== 'string' || typeof data.method !== 'string') return
      const handler = this.handlers.get(data.method)
      if (!handler) return
      handler((data.params ?? {}) as Record<string, unknown>)
        .then(result => event.source?.postMessage({ id: data.id, result }, { targetOrigin: event.origin }))
        .catch(err => event.source?.postMessage({ id: data.id, error: String(err) }, { targetOrigin: event.origin }))
    })
  }

  /** 桌面侧发起调用到插件 iframe */
  static call<T>(iframe: HTMLIFrameElement, method: string, params: Record<string, unknown>, timeoutMs = 30000): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `req_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
      const timer = setTimeout(() => reject(new Error(`timeout: ${method}`)), timeoutMs)
      const listener = (ev: MessageEvent) => {
        if (ev.data?.id !== id) return
        clearTimeout(timer)
        window.removeEventListener('message', listener)
        ev.data.ok ? resolve(ev.data.result) : reject(new Error(ev.data.error))
      }
      window.addEventListener('message', listener)
      iframe.contentWindow?.postMessage({ id, method, params }, '*')
    })
  }
}
