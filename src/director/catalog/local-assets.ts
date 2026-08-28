/**
 * Local-only asset policy.
 *
 * Runtime models, motions and camera language live in this repo.
 * Remote http(s) hosts are rejected unless they are loopback / LAN helper domains.
 *
 * Third-party character/animation packs are not vendored.
 */
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

function isAllowedHost(host: string): boolean {
  if (LOCAL_HOSTS.has(host)) return true;
  if (host.endsWith('.local')) return true;
  if (host.endsWith('.my.local-ip.co')) return true;
  return false;
}

export function assertLocalAssetUrl(url: string): string {
  let host = '';
  try { host = new URL(url, 'http://local.invalid').host; } catch { return url; }
  if (host && !isAllowedHost(host.split(':')[0])) {
    throw new Error(`Blocked remote asset host: ${host}`);
  }
  return url;
}

export function localAssetUrl(path: string): string {
  if (!path) return '';
  if (/^(blob:|data:)/i.test(path)) return path;
  if (/^https?:/i.test(path)) return assertLocalAssetUrl(path);
  return path.startsWith('/') ? path : `/${path}`;
}
