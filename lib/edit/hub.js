/* 剪辑台 iframe 内的 window.hub：存储走 localStorage，文件/导出走 /directorx/edit/api。 */
(() => {
  const BASE = '/directorx/edit';
  const NODE = new URLSearchParams(location.search).get('node') || 'default';
  const storageKey = (key) => `directorx-edit:${NODE}:${key}`;

  const project = new URLSearchParams(location.search).get('project');
  const mediaEndpoint = project ? `/directorx/media?project=${encodeURIComponent(project)}` : '/directorx/media';

  const insertMedia = async ({ source, name, kind }) => {
    if (!source) return false;
    const blob = source instanceof Blob ? source : await fetch(source).then(r => r.blob()).catch(() => null);
    if (!blob) return false;
    const response = await fetch(mediaEndpoint, {
      method: 'POST',
      headers: { 'x-directorx-name': encodeURIComponent(name || (kind === 'video' ? 'edit.webm' : 'edit.jpg')), 'content-type': blob.type || 'application/octet-stream' },
      body: blob,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.path) return false;
    if (window.parent === window) return true;
    window.parent.postMessage({ type: 'directorx:insert-media', nodeId: NODE, path: data.path, name: data.name || name, kind }, window.location.origin);
    return true;
  };

  window.hub = {
    ready: Promise.resolve(),
    app: {
      locale: navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'zh',
    },
    python: {
      ensureEnv: async () => ({ ok: true, ready: true }),
      run: async () => ({ ok: false, stdout: '', stderr: 'python export is not wired in this host', exitCode: 1 }),
    },
    files: {
      writeToPluginDir: async () => ({ ok: false }),
      uploadToCdn: async () => ({ ok: false }),
    },
    canvas: {
      insertImageNode: async ({ source, name } = {}) => insertMedia({ source, name: name || 'shot.jpg', kind: 'image' }),
      insertVideoNode: async ({ source, name } = {}) => insertMedia({ source, name: name || 'timeline.webm', kind: 'video' }),
      insertFileNode: async ({ source, name } = {}) => insertMedia({ source, name, kind: 'image' }),
    },
    storage: {
      get: async (key) => {
        const raw = localStorage.getItem(storageKey(key));
        if (!raw) return undefined;
        try { return JSON.parse(raw); } catch { return undefined; }
      },
      set: async (key, value) => {
        localStorage.setItem(storageKey(key), JSON.stringify(value));
        return true;
      },
    },
    ui: {
      notify: (message) => console.info('[edit]', message),
    },
    log: {
      debug: (message, extra) => console.debug('[edit]', message, extra ?? ''),
      info: (message, extra) => console.info('[edit]', message, extra ?? ''),
      warn: (message, extra) => console.warn('[edit]', message, extra ?? ''),
      error: (message, extra) => console.error('[edit]', message, extra ?? ''),
    },
    agent: {
      onInvoke: (handler) => {
        window.__dxEditInvoke = handler;
        return () => { if (window.__dxEditInvoke === handler) window.__dxEditInvoke = null; };
      },
      setEditorState: (state) => { window.__dxEditState = state; },
    },
  };
})();
