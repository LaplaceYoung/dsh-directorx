import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  createDefaultProject,
  validateProject,
  type OpenDirectorProject,
} from '../index.js';

interface HistoryEntry {
  label: string;
  project: OpenDirectorProject;
  createdAt: number;
}

interface HistoryFile {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

const HISTORY_LIMIT = 50;

function clone<T>(value: T): T {
  return structuredClone(value);
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function atomicJsonWrite(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, path);
}

export class ProjectRepository {
  readonly root: string;
  readonly projectPath: string;
  readonly historyPath: string;

  constructor(root = process.env.DIRECTOR_STAGE_HOME || join(homedir(), '.director-stage')) {
    this.root = root;
    this.projectPath = join(root, 'project.json');
    this.historyPath = join(root, 'history.json');
  }

  async get(): Promise<OpenDirectorProject> {
    const project = await readJson<OpenDirectorProject>(this.projectPath);
    if (!project) {
      const initial = createDefaultProject();
      await atomicJsonWrite(this.projectPath, initial);
      return clone(initial);
    }
    const issues = validateProject(project);
    if (issues.some((issue) => issue.startsWith('Unsupported project version'))) {
      throw new Error(`Cannot open project: ${issues.join('; ')}`);
    }
    return clone(project);
  }

  async replace(project: OpenDirectorProject): Promise<OpenDirectorProject> {
    const next = { ...clone(project), updatedAt: Date.now() };
    await atomicJsonWrite(this.projectPath, next);
    return clone(next);
  }

  async mutate(label: string, updater: (draft: OpenDirectorProject) => void, recordHistory = true): Promise<OpenDirectorProject> {
    const current = await this.get();
    const draft = clone(current);
    updater(draft);
    draft.updatedAt = Date.now();
    const issues = validateProject(draft);
    const fatal = issues.filter((issue) => issue.startsWith('Unsupported project version') || issue.includes('Duplicate element id'));
    if (fatal.length) throw new Error(`Project mutation rejected: ${fatal.join('; ')}`);
    if (recordHistory) {
      const history = await this.readHistory();
      history.past.push({ label, project: current, createdAt: Date.now() });
      history.past = history.past.slice(-HISTORY_LIMIT);
      history.future = [];
      await Promise.all([
        atomicJsonWrite(this.projectPath, draft),
        atomicJsonWrite(this.historyPath, history),
      ]);
    } else {
      await atomicJsonWrite(this.projectPath, draft);
    }
    return clone(draft);
  }

  async reset(name?: string): Promise<OpenDirectorProject> {
    const current = await this.get();
    const next = createDefaultProject(name);
    const history = await this.readHistory();
    history.past.push({ label: 'Create project', project: current, createdAt: Date.now() });
    history.past = history.past.slice(-HISTORY_LIMIT);
    history.future = [];
    await Promise.all([
      atomicJsonWrite(this.projectPath, next),
      atomicJsonWrite(this.historyPath, history),
    ]);
    return clone(next);
  }

  async undo(): Promise<{ project: OpenDirectorProject; label: string } | null> {
    const current = await this.get();
    const history = await this.readHistory();
    const entry = history.past.pop();
    if (!entry) return null;
    history.future.push({ label: entry.label, project: current, createdAt: Date.now() });
    await Promise.all([
      atomicJsonWrite(this.projectPath, entry.project),
      atomicJsonWrite(this.historyPath, history),
    ]);
    return { project: clone(entry.project), label: entry.label };
  }

  async redo(): Promise<{ project: OpenDirectorProject; label: string } | null> {
    const current = await this.get();
    const history = await this.readHistory();
    const entry = history.future.pop();
    if (!entry) return null;
    history.past.push({ label: entry.label, project: current, createdAt: Date.now() });
    await Promise.all([
      atomicJsonWrite(this.projectPath, entry.project),
      atomicJsonWrite(this.historyPath, history),
    ]);
    return { project: clone(entry.project), label: entry.label };
  }

  private async readHistory(): Promise<HistoryFile> {
    return (await readJson<HistoryFile>(this.historyPath)) ?? { past: [], future: [] };
  }
}
