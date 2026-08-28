import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { access, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';

interface RenderJob {
  id: string;
  directory: string;
  outputPath: string;
  partialPath: string;
  fps: number;
  width: number;
  height: number;
  startFrame: number;
  endFrame: number;
  received: Set<number>;
}

export interface RenderRequest {
  fps?: number;
  width?: number;
  height?: number;
  start_frame?: number;
  end_frame?: number;
  output_dir?: string;
  file_name?: string;
}

const jobs = new Map<string, RenderJob>();
const approvedOutputDirectories = new Set<string>();

async function exists(path: string): Promise<boolean> { try { await access(path); return true; } catch { return false; } }

async function executable(candidates: string[]): Promise<string> {
  for (const item of candidates) if (await exists(item)) return item;
  throw new Error('未找到 FFmpeg。请先让 Codex 或系统包管理器安装 FFmpeg，再重新导出。');
}

function safeOutputDirectory(input?: string): string {
  const home = resolve(homedir());
  const directory = resolve(input?.trim() || join(home, 'Movies', 'Director Stage'));
  if (directory !== home && !directory.startsWith(`${home}/`) && !approvedOutputDirectories.has(directory)) throw new Error('请先通过“选择保存文件夹”授权此导出位置');
  return directory;
}

function safeFileName(input?: string): string {
  const raw = basename(input?.trim() || `director-previs-${Date.now()}.mp4`);
  const stem = extname(raw).toLowerCase() === '.mp4' ? raw.slice(0, -4) : raw;
  const clean = stem.replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '') || 'director-previs';
  return `${clean}.mp4`;
}

function run(command: string, args: string[]): Promise<{ output: string }> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks: Buffer[] = [];
    child.stdout.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    child.stderr.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    child.once('error', reject);
    child.once('close', (code) => code === 0 ? resolveRun({ output: Buffer.concat(chunks).toString('utf8') }) : reject(new Error(Buffer.concat(chunks).toString('utf8').trim() || `${command} exited with ${code}`)));
  });
}

export async function createRenderJob(request: RenderRequest): Promise<RenderJob> {
  const fps = Math.round(request.fps ?? 24);
  const width = Math.round(request.width ?? 1920);
  const height = Math.round(request.height ?? 1080);
  const startFrame = Math.max(0, Math.round(request.start_frame ?? 0));
  const endFrame = Math.max(startFrame, Math.round(request.end_frame ?? startFrame));
  if (fps !== 24) throw new Error('当前仅支持 24fps');
  if (width < 320 || width > 4096 || height < 320 || height > 4096) throw new Error('导出尺寸无效');
  if (endFrame - startFrame > 24 * 60 * 10) throw new Error('单次导出最长 10 分钟');
  const outputDir = safeOutputDirectory(request.output_dir);
  await mkdir(outputDir, { recursive: true });
  const outputPath = join(outputDir, safeFileName(request.file_name));
  const directory = await mkdtemp(join(tmpdir(), 'director-stage-render-'));
  const job: RenderJob = {
    id: randomUUID(), directory, outputPath, partialPath: `${outputPath}.partial.mp4`,
    fps, width, height, startFrame, endFrame, received: new Set(),
  };
  jobs.set(job.id, job);
  return job;
}

export async function writeRenderFrame(id: string, index: number, data: Buffer): Promise<void> {
  const job = jobs.get(id);
  if (!job) throw new Error('渲染任务不存在或已结束');
  const frame = Math.round(index);
  if (frame < job.startFrame || frame > job.endFrame) throw new Error('帧编号超出导出范围');
  if (data.length < 8 || data[0] !== 0x89 || data[1] !== 0x50 || data[2] !== 0x4e || data[3] !== 0x47) throw new Error('上传内容不是有效 PNG 帧');
  await writeFile(join(job.directory, `frame-${String(frame - job.startFrame).padStart(7, '0')}.png`), data);
  job.received.add(frame);
}

export async function finishRenderJob(id: string): Promise<{ path: string; size: number; frames: number }> {
  const job = jobs.get(id);
  if (!job) throw new Error('渲染任务不存在或已结束');
  const expected = job.endFrame - job.startFrame + 1;
  if (job.received.size !== expected) throw new Error(`渲染帧不完整：应有 ${expected} 帧，实际 ${job.received.size} 帧`);
  const ffmpeg = await executable(['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg']);
  await rm(job.partialPath, { force: true });
  try {
    await run(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(job.fps),
      '-i', join(job.directory, 'frame-%07d.png'), '-c:v', 'libx264', '-preset', 'medium',
      '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(job.fps), job.partialPath,
    ]);
    const file = await stat(job.partialPath);
    if (file.size < 1024) throw new Error('导出文件异常，体积过小');
    const ffprobe = await executable(['/opt/homebrew/bin/ffprobe', '/usr/local/bin/ffprobe', '/usr/bin/ffprobe']);
    const probe = await run(ffprobe, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,r_frame_rate', '-of', 'json', job.partialPath]);
    const parsed = JSON.parse(probe.output) as { streams?: Array<{ codec_name?: string; width?: number; height?: number; r_frame_rate?: string }> };
    const stream = parsed.streams?.[0];
    if (stream?.codec_name !== 'h264' || stream.width !== job.width || stream.height !== job.height) {
      throw new Error(`成片校验失败：期望 ${job.width}×${job.height} H.264，实际 ${stream?.width ?? '?'}×${stream?.height ?? '?'} ${stream?.codec_name ?? '?'}`);
    }
    await rm(job.outputPath, { force: true });
    await rename(job.partialPath, job.outputPath);
    return { path: job.outputPath, size: file.size, frames: expected };
  } finally {
    jobs.delete(id);
    await rm(job.directory, { recursive: true, force: true });
    await rm(job.partialPath, { force: true });
  }
}

export async function cancelRenderJob(id: string): Promise<void> {
  const job = jobs.get(id);
  if (!job) return;
  jobs.delete(id);
  await Promise.all([rm(job.directory, { recursive: true, force: true }), rm(job.partialPath, { force: true })]);
}

export async function revealPath(input: string): Promise<void> {
  const path = resolve(input);
  const home = resolve(homedir());
  const approved = [...approvedOutputDirectories].some((directory) => path === directory || path.startsWith(`${directory}/`));
  if (!isAbsolute(path) || (path !== home && !path.startsWith(`${home}/`) && !approved)) throw new Error('只能打开已授权导出目录中的文件');
  await access(path);
  if (process.platform === 'darwin') await run('/usr/bin/open', ['-R', path]);
  else if (process.platform === 'win32') await run('explorer.exe', ['/select,', path]);
  else await run('xdg-open', [dirname(path)]);
}

export async function selectOutputDirectory(): Promise<string | null> {
  try {
    if (process.platform === 'darwin') {
      const result = await run('/usr/bin/osascript', ['-e', 'POSIX path of (choose folder with prompt "选择导演台导出文件夹")']);
      const directory = resolve(result.output.trim().replace(/\/$/, ''));
      approvedOutputDirectories.add(directory);
      return directory;
    }
    if (process.platform === 'win32') {
      const script = "Add-Type -AssemblyName System.Windows.Forms; $d=New-Object System.Windows.Forms.FolderBrowserDialog; if($d.ShowDialog() -eq 'OK'){Write-Output $d.SelectedPath}";
      const result = await run('powershell.exe', ['-NoProfile', '-Command', script]);
      const directory = result.output.trim();
      if (!directory) return null;
      approvedOutputDirectories.add(resolve(directory));
      return resolve(directory);
    }
    const result = await run('zenity', ['--file-selection', '--directory', '--title=选择导演台导出文件夹']);
    const directory = result.output.trim();
    if (!directory) return null;
    approvedOutputDirectories.add(resolve(directory));
    return resolve(directory);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('User canceled') || message.includes('(-128)') || message.includes('cancel')) return null;
    throw error;
  }
}

export function publicRenderJob(job: RenderJob) {
  return { id: job.id, fps: job.fps, width: job.width, height: job.height, start_frame: job.startFrame, end_frame: job.endFrame, output_path: job.outputPath };
}
