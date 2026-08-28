import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { concatNormalizeGraph } from './playlist';
import { clampTrim } from './trim';

function run(bin: string, args: string[]): Promise<{ code: number; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks: Buffer[] = [];
    child.stdout.on('data', (d) => chunks.push(Buffer.from(d)));
    child.stderr.on('data', (d) => chunks.push(Buffer.from(d)));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 1, output: Buffer.concat(chunks).toString('utf8') }));
  });
}

async function which(candidates: string[]): Promise<string> {
  for (const bin of candidates) {
    const probe = await run(bin, ['-version']).catch(() => null);
    if (probe && probe.code === 0) return bin;
  }
  throw new Error('ffmpeg/ffprobe not found');
}

export async function probeDurationMs(file: string): Promise<number> {
  const ffprobe = await which(['/opt/homebrew/bin/ffprobe', '/usr/local/bin/ffprobe', '/usr/bin/ffprobe', 'ffprobe']);
  const result = await run(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nk=1:nw=1', file]);
  const seconds = Number(result.output.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error(`cannot probe duration: ${result.output.slice(0, 120)}`);
  return Math.round(seconds * 1000);
}

export async function detectCutsMs(file: string): Promise<number[]> {
  const ffmpeg = await which(['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg', 'ffmpeg']);
  const result = await run(ffmpeg, ['-hide_banner', '-i', file, '-filter:v', "select='gt(scene,0.28)',showinfo", '-f', 'null', '-']);
  const times: number[] = [];
  for (const match of result.output.matchAll(/pts_time:([\d.]+)/g)) {
    times.push(Math.round(Number(match[1]) * 1000));
  }
  return [...new Set(times)].sort((a, b) => a - b);
}

export async function captureFrameFile(input: string, outputDir: string, atMs: number): Promise<{ path: string; atMs: number }> {
  const ffmpeg = await which(['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg', 'ffmpeg']);
  mkdirSync(outputDir, { recursive: true });
  const name = `${Date.now()}-frame.jpg`;
  const output = path.join(outputDir, name);
  const ss = (Math.max(0, atMs) / 1000).toFixed(3);
  const result = await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', ss, '-i', input, '-frames:v', '1', '-q:v', '3', output,
  ]);
  if (result.code !== 0) throw new Error(result.output.slice(0, 240) || 'ffmpeg capture frame failed');
  return { path: `/uploads/${name}`, atMs };
}

export async function concatMediaFiles(inputs: string[], outputDir: string): Promise<{ path: string; count: number }> {
  if (inputs.length < 2) throw new Error('playlist concat needs at least two clips');
  const ffmpeg = await which(['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg', 'ffmpeg']);
  mkdirSync(outputDir, { recursive: true });
  const name = `${Date.now()}-playlist.mp4`;
  const output = path.join(outputDir, name);
  const args = ['-hide_banner', '-loglevel', 'error', '-y'];
  for (const file of inputs) args.push('-i', file);
  args.push(
    '-filter_complex', concatNormalizeGraph(inputs.length),
    '-map', '[v]',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-an', '-movflags', '+faststart',
    output,
  );
  const result = await run(ffmpeg, args);
  if (result.code !== 0) throw new Error(result.output.slice(0, 240) || 'ffmpeg concat failed');
  return { path: `/uploads/${name}`, count: inputs.length };
}

export async function trimMediaFile(input: string, outputDir: string, inMs: number, outMs: number): Promise<{ path: string; durationMs: number; inMs: number; outMs: number }> {
  const sourceMs = await probeDurationMs(input);
  const span = clampTrim(inMs, outMs, sourceMs);
  const ffmpeg = await which(['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg', 'ffmpeg']);
  mkdirSync(outputDir, { recursive: true });
  const name = `${Date.now()}-trim.mp4`;
  const output = path.join(outputDir, name);
  const start = (span.inMs / 1000).toFixed(3);
  const dur = (span.durationMs / 1000).toFixed(3);
  const result = await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', start, '-i', input, '-t', dur,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart',
    output,
  ]);
  if (result.code !== 0) {
    const retry = await run(ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-ss', start, '-i', input, '-t', dur,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-an',
      '-movflags', '+faststart', output,
    ]);
    if (retry.code !== 0) throw new Error(retry.output.slice(0, 240) || 'ffmpeg trim failed');
  }
  return { path: `/uploads/${name}`, durationMs: span.durationMs, inMs: span.inMs, outMs: span.outMs };
}
