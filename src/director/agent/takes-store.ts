import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export interface TakeMeta {
  id: string;
  label: string;
  createdAt: string;
  jpeg?: string;
  look?: Record<string, unknown>;
  handheld?: Record<string, unknown>;
}

export interface TakeRecord extends TakeMeta {
  composition: unknown;
}

const ID_RE = /^[A-Za-z0-9._-]{1,80}$/;

export function sanitizeTakeId(value: string): string {
  const id = value.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
  if (!ID_RE.test(id)) throw new Error('invalid take id');
  return id;
}

export function newTakeId(label?: string): string {
  const slug = (label || 'take').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'take';
  return sanitizeTakeId(`${slug}-${Date.now().toString(36)}`);
}

export function ensureTakesDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function takePaths(dir: string, id: string): { json: string; jpeg: string; jpegUrl: string } {
  const safe = sanitizeTakeId(id);
  return {
    json: path.join(dir, `${safe}.json`),
    jpeg: path.join(dir, `${safe}.jpg`),
    jpegUrl: `/takes/${safe}.jpg`,
  };
}

export function listTakes(dir: string): TakeMeta[] {
  try {
    return readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .map((name) => {
        const record = JSON.parse(readFileSync(path.join(dir, name), 'utf8')) as TakeRecord;
        return {
          id: record.id,
          label: record.label,
          createdAt: record.createdAt,
          jpeg: record.jpeg,
        };
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export function readTake(dir: string, id: string): TakeRecord {
  const raw = readFileSync(takePaths(dir, id).json, 'utf8');
  return JSON.parse(raw) as TakeRecord;
}

export function writeTake(dir: string, record: TakeRecord): TakeMeta {
  ensureTakesDir(dir);
  const id = sanitizeTakeId(record.id);
  const stored: TakeRecord = { ...record, id };
  writeFileSync(takePaths(dir, id).json, JSON.stringify(stored));
  return { id, label: stored.label, createdAt: stored.createdAt, jpeg: stored.jpeg };
}

export function deleteTake(dir: string, id: string): boolean {
  const files = takePaths(dir, id);
  let gone = false;
  try {
    unlinkSync(files.json);
    gone = true;
  } catch {
    /* missing json */
  }
  try {
    unlinkSync(files.jpeg);
  } catch {
    /* missing still */
  }
  return gone;
}
