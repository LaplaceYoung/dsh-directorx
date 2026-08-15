// src/corpus.ts
import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
var MAX_READ_CHARS = 6e4;
function normPath(value) {
  return value.replaceAll("\\", "/").replace(/^\/+/, "");
}
function textTokens(value) {
  const tokens = /* @__PURE__ */ new Set();
  const words = value.toLowerCase().match(/[a-z0-9][a-z0-9_-]{1,}/g);
  for (const word of words ?? []) {
    tokens.add(word);
    if (word.length > 3) tokens.add(word.slice(0, 4));
  }
  const han = value.replace(/[^\u4e00-\u9fff]/g, "");
  for (let i = 0; i < han.length - 1; i += 1) tokens.add(han.slice(i, i + 2));
  return tokens;
}
function overlapScore(a, b) {
  let hit = 0;
  for (const token of a) if (b.has(token)) hit += 1;
  return hit;
}
function scoreQuery(queryTokens, title, body) {
  const titleTokens = textTokens(title);
  const bodyTokens = textTokens(body);
  let score = overlapScore(queryTokens, titleTokens) * 8;
  score += overlapScore(queryTokens, bodyTokens);
  if (/prompt|提示词|generation|生成|模型/.test(title)) score += 2;
  return score;
}
function makeSnippet(body, queryTokens) {
  const clean = body.replace(/\s+/g, " ").trim();
  const lower = clean.toLowerCase();
  let best = -1;
  let bestIndex = 0;
  for (const token of queryTokens) {
    const index = lower.indexOf(token);
    if (index >= 0 && (best < 0 || index < bestIndex)) {
      best = index;
      bestIndex = index;
    }
  }
  const start = best >= 0 ? Math.max(0, best - 80) : 0;
  const snippet = clean.slice(start, start + 280).trim();
  return snippet === "" ? clean.slice(0, 240) : snippet;
}
var DirectorxCorpus = class {
  root = resolve(process.cwd(), "knowledge");
  inventoryPath = join(this.root, "_meta", "inventory.json");
  redirectsPath = join(this.root, "_meta", "redirects.json");
  inventory;
  cache = /* @__PURE__ */ new Map();
  setRoot(root) {
    this.root = resolve(root);
    this.inventoryPath = join(this.root, "_meta", "inventory.json");
    this.redirectsPath = join(this.root, "_meta", "redirects.json");
    this.inventory = void 0;
    this.cache.clear();
  }
  loadInventory() {
    if (this.inventory === void 0) {
      this.inventory = this.readInventory();
    }
    return this.inventory;
  }
  async readInventory() {
    try {
      const raw = await readFile(this.inventoryPath, "utf8");
      const data = JSON.parse(raw);
      return (data.articles ?? []).filter((article) => typeof article.path === "string").map((article) => ({
        number: article.number ?? 0,
        id: article.id ?? "",
        slug: article.slug ?? "",
        title: article.title ?? article.slug ?? article.id ?? "",
        path: normPath(article.path ?? "").replace(/^knowledge\//, ""),
        group: article.group,
        chars: article.chars,
        sourceStatus: article.source_status
      }));
    } catch {
      return [];
    }
  }
  async redirects() {
    try {
      const raw = await readFile(this.redirectsPath, "utf8");
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  safePath(path) {
    const base = resolve(this.root);
    const target = resolve(base, path);
    if (target !== base && !target.startsWith(base + sep)) {
      throw new Error(`Knowledge path escapes corpus root: ${path}`);
    }
    return target;
  }
  async read(path) {
    const cached = this.cache.get(path);
    if (cached !== void 0) return cached;
    const content = await readFile(this.safePath(path), "utf8");
    this.cache.set(path, content);
    return content;
  }
  async list() {
    return this.loadInventory();
  }
  async search(query, maxResults = 8) {
    const q = query.trim();
    if (q === "") return [];
    const queryTokens = textTokens(q);
    if (queryTokens.size === 0) return [];
    const articles = await this.loadInventory();
    const scored = [];
    const exactTitle = [];
    for (const article of articles) {
      if (article.title.toLowerCase().includes(q.toLowerCase())) {
        exactTitle.push({ ...article, score: 1e4, snippet: article.title });
        continue;
      }
      const body = await this.read(article.path).catch(() => "");
      const score = scoreQuery(queryTokens, article.title, body);
      if (score > 0) scored.push({ article, score });
    }
    const ranked = exactTitle.concat(scored.sort((a, b) => b.score - a.score).map((item) => ({
      ...item.article,
      score: item.score,
      snippet: ""
    }))).slice(0, Math.max(1, maxResults));
    for (const hit of ranked) {
      if (hit.snippet === "" || hit.snippet === hit.title) {
        const body = await this.read(hit.path).catch(() => "");
        hit.snippet = makeSnippet(body, queryTokens);
      }
    }
    return ranked;
  }
  async readArticle(ref) {
    const inventory = await this.loadInventory();
    const wanted = ref.trim();
    const byId = inventory.find((article) => article.id === wanted || article.slug === wanted || String(article.number) === wanted);
    if (byId !== void 0) {
      const content = await this.read(byId.path);
      return { article: byId, content: content.slice(0, MAX_READ_CHARS) };
    }
    const redirects = await this.redirects();
    const target = redirects[wanted]?.to;
    if (target !== void 0) {
      const byTarget = inventory.find((article) => String(article.number) === String(target) || article.id === String(target));
      if (byTarget !== void 0) {
        const content = await this.read(byTarget.path);
        return { article: byTarget, content: content.slice(0, MAX_READ_CHARS), redirectedFrom: wanted };
      }
    }
    const normalized = normPath(wanted).replace(/^knowledge\//, "");
    if (inventory.some((article) => article.path === normalized)) {
      const article = inventory.find((item) => item.path === normalized);
      if (article !== void 0) {
        const content = await this.read(article.path);
        return { article, content: content.slice(0, MAX_READ_CHARS) };
      }
    }
    throw new Error(`Unknown knowledge article "${wanted}". Use directorx_knowledge_search first, then read an id/slug/path from the results.`);
  }
};
var corpus = new DirectorxCorpus();

// src/providers/audio.ts
import { writeFile as writeFile2 } from "node:fs/promises";
import { join as join3 } from "node:path";

// src/support.ts
import { mkdir, readFile as readFile2, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname, join as join2, resolve as resolve2 } from "node:path";
var MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav"
};
function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}
function mimeForPath(path) {
  return MIME[extname(path).toLowerCase()] ?? "application/octet-stream";
}
async function mediaSourceToDataUrl(source, maxBytes = 15 * 1024 * 1024) {
  if (/^data:/i.test(source)) return source;
  if (isHttpUrl(source)) return source;
  const path = resolve2(source);
  if (!existsSync(path)) throw new Error(`File not found: ${source}`);
  const data = await readFile2(path);
  if (data.length > maxBytes) {
    throw new Error(`File too large to inline (${Math.round(data.length / 1024 / 1024)}MB > ${Math.round(maxBytes / 1024 / 1024)}MB): ${source}`);
  }
  return `data:${mimeForPath(path)};base64,${data.toString("base64")}`;
}
async function ensureOutputDir(dir) {
  const out = resolve2(process.cwd(), dir);
  await mkdir(out, { recursive: true });
  return out;
}
async function downloadToFile(url, outDir, prefix, ext) {
  await ensureOutputDir(outDir);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const stem = `${prefix}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}${ext}`;
  const path = join2(outDir, stem);
  await writeFile(path, bytes);
  return path;
}
async function saveBase64ToFile(data, outDir, prefix, ext) {
  await ensureOutputDir(outDir);
  const raw = data.replace(/^data:[^;]+;base64,/, "");
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  const path = join2(outDir, `${prefix}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}${normalizedExt}`);
  await writeFile(path, Buffer.from(raw, "base64"));
  return path;
}
function apiKeyOf(configApiKey, envNames, baseURL) {
  const fromEnv = envNames.map((name) => process.env[name]).find((value) => value !== void 0 && value !== "");
  const key = configApiKey !== "" ? configApiKey : fromEnv ?? "";
  if (key === "" && !isLocalBaseUrl(baseURL)) {
    throw new Error(
      `No API key configured. Fill Base URL / API Key in WebUI Settings \u2192 DirectorX, or export ${envNames.join(" / ")}.`
    );
  }
  return key;
}
function isLocalBaseUrl(baseURL) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(baseURL);
}
async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Provider returned non-JSON response (HTTP ${response.status}): ${text.slice(0, 300)}`);
  }
}
function slugify(value, max = 40) {
  const slug = basename(value, extname(value)).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max);
  return slug === "" ? "directorx" : slug;
}
function stringContentOf(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((part) => {
      if (typeof part === "string") return part;
      if (part !== null && typeof part === "object") {
        const record = part;
        if (typeof record.text === "string") return record.text;
        if (typeof record.content === "string") return record.content;
      }
      return "";
    }).join("\n");
  }
  return String(value ?? "");
}

// src/providers/audio.ts
function makeWav(sampleRate = 16e3, seconds = 2) {
  const samples = Math.floor(sampleRate * seconds);
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples; i += 1) {
    const envelope = Math.min(1, i / (sampleRate * 0.05), (samples - i) / (sampleRate * 0.05));
    const value = Math.sin(2 * Math.PI * 220 * (i / sampleRate)) * envelope;
    buffer.writeInt16LE(Math.round(value * 0.25 * 32767), 44 + i * 2);
  }
  return buffer;
}
async function mockAudio(ctx, text) {
  const outDir = await ensureOutputDir(ctx.settings.outputDir);
  const path = join3(outDir, `${slugify(text, 24)}-mock.wav`);
  await writeFile2(path, makeWav());
  return { model: ctx.capability.model, text, files: [{ path, mimeType: "audio/wav" }], mode: "mock" };
}
async function openaiTts(ctx, text, voice, format) {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, "");
  const apiKey = apiKeyOf(ctx.capability.apiKey, ["DIRECTORX_AUDIO_API_KEY", "OPENAI_API_KEY"], baseURL);
  const response = await fetch(`${baseURL}/audio/speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ctx.capability.model,
      input: text,
      voice: voice ?? "alloy",
      response_format: format ?? "mp3"
    }),
    signal: ctx.signal
  });
  if (!response.ok) {
    const body = await readJsonResponse(response).catch(() => ({}));
    throw new Error(`Audio generation failed (HTTP ${response.status}): ${JSON.stringify(body).slice(0, 400)}`);
  }
  const outDir = await ensureOutputDir(ctx.settings.outputDir);
  const bytes = Buffer.from(await response.arrayBuffer());
  const ext = format === "wav" ? "wav" : format === "opus" ? "opus" : format === "aac" ? "aac" : "mp3";
  const path = join3(outDir, `${slugify(text, 24)}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}.${ext}`);
  await writeFile2(path, bytes);
  const files = [{ path, mimeType: `audio/${ext === "mp3" ? "mpeg" : ext}` }];
  return { model: ctx.capability.model, text, files, mode: "openai-tts" };
}
async function runAudio(ctx, text, options) {
  if (ctx.capability.mode === "mock") return mockAudio(ctx, text);
  if (ctx.capability.mode === "openai-tts") return openaiTts(ctx, text, options.voice, options.format);
  throw new Error(`Unsupported audio mode: ${ctx.capability.mode}`);
}

// src/providers/image.ts
import { writeFile as writeFile3 } from "node:fs/promises";
import { join as join4 } from "node:path";

// src/providers/tasks.ts
var SUCCESS_STATES = /* @__PURE__ */ new Set(["success", "succeeded", "completed", "complete", "finished", "done"]);
var FAILURE_STATES = /* @__PURE__ */ new Set(["failed", "failure", "error", "cancelled", "canceled"]);
async function submitModelverseTask(baseURL, apiKey, model, content, parameters, signal) {
  const response = await fetch(`${baseURL.replace(/\/+$/, "")}/tasks/submit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: { content }, parameters }),
    signal
  });
  const body = await readJsonResponse(response);
  const taskId = body.output?.task_id;
  if (!response.ok || !taskId) {
    throw new Error(`modelverse tasks/submit(${model}) failed: ${response.status} ${JSON.stringify(body.error ?? body).slice(0, 400)}`);
  }
  return taskId;
}
async function pollModelverseTask(baseURL, apiKey, taskId, settings, signal) {
  const base = baseURL.replace(/\/+$/, "");
  for (let attempt = 0; attempt < settings.maxPollAttempts; attempt += 1) {
    if (signal.aborted) throw new Error("Task polling cancelled");
    await new Promise((resolve3) => setTimeout(resolve3, settings.pollIntervalMs));
    const response = await fetch(`${base}/tasks/status?task_id=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal
    });
    const body = await readJsonResponse(response);
    const rawStatus = body.output?.task_status ?? body.output?.status ?? "";
    const status = rawStatus.toLowerCase();
    if (SUCCESS_STATES.has(status)) {
      const urls = [...body.output?.urls ?? [], ...body.output?.url ? [body.output.url] : []].filter((url) => typeof url === "string" && url.length > 0);
      if (urls.length === 0) throw new Error(`modelverse task ${taskId} succeeded but returned no result URLs`);
      return { urls, status: rawStatus };
    }
    if (FAILURE_STATES.has(status)) {
      throw new Error(`modelverse task ${taskId} failed: ${body.output?.error_message ?? rawStatus ?? "unknown error"}`);
    }
  }
  throw new Error(`modelverse task ${taskId} did not finish within ${settings.maxPollAttempts * settings.pollIntervalMs}ms`);
}
async function pollOpenAIVideoTask(baseURL, apiKey, taskId, settings, signal) {
  const base = baseURL.replace(/\/+$/, "");
  for (let attempt = 0; attempt < settings.maxPollAttempts; attempt += 1) {
    if (signal.aborted) throw new Error("Video polling cancelled");
    await new Promise((resolve3) => setTimeout(resolve3, settings.pollIntervalMs));
    const response = await fetch(`${base}/videos/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal
    });
    const body = await readJsonResponse(response);
    if (!response.ok) {
      throw new Error(`Video status request failed (HTTP ${response.status}): ${JSON.stringify(body).slice(0, 400)}`);
    }
    const rawStatus = body.output?.status ?? body.status ?? "";
    const status = String(rawStatus).toLowerCase();
    if (status === "completed" || status === "succeeded" || status === "success") {
      const topLevel = body;
      const urls = [
        ...body.output?.urls ?? [],
        ...body.output?.url ? [body.output.url] : [],
        ...Array.isArray(topLevel.urls) ? topLevel.urls : [],
        ...typeof topLevel.url === "string" ? [topLevel.url] : []
      ].filter((url) => typeof url === "string" && url.length > 0);
      if (urls.length === 0) throw new Error(`video task ${taskId} completed but returned no URLs`);
      return { urls, status: String(rawStatus) };
    }
    if (status === "failed" || status === "cancelled" || status === "error") {
      throw new Error(`video task ${taskId} failed: ${JSON.stringify(body).slice(0, 400)}`);
    }
  }
  throw new Error(`video task ${taskId} did not finish within ${settings.maxPollAttempts * settings.pollIntervalMs}ms`);
}

// src/providers/image.ts
async function mockImage(ctx, prompt, size) {
  const outDir = await ensureOutputDir(ctx.settings.outputDir);
  const name = `${slugify(prompt, 24)}-${size.replace(/[^\d]/g, "x")}.svg`;
  const path = join4(outDir, name);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">',
    '<rect width="100%" height="100%" fill="#0b1020"/>',
    '<text x="50%" y="50%" fill="#9fd8ff" font-family="sans-serif" font-size="28" text-anchor="middle">DirectorX mock image</text>',
    "</svg>"
  ].join("");
  await writeFile3(path, svg, "utf8");
  return {
    model: ctx.capability.model,
    prompt,
    files: [{ path, mimeType: "image/svg+xml" }],
    mode: "mock"
  };
}
async function openaiImage(ctx, prompt, size, quality) {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, "");
  const apiKey = apiKeyOf(ctx.capability.apiKey, ["DIRECTORX_IMAGE_API_KEY", "OPENAI_API_KEY"], baseURL);
  const payload = { model: ctx.capability.model, prompt, n: 1 };
  if (size !== void 0 && size !== "") payload.size = size;
  if (quality !== void 0 && quality !== "") payload.quality = quality;
  const response = await fetch(`${baseURL}/images/generations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: ctx.signal
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(`Image generation failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 400)}`);
  }
  const first = body.data?.[0];
  if (first === void 0) throw new Error(`Image response contained no data: ${JSON.stringify(body).slice(0, 300)}`);
  const files = [];
  if (first.b64_json !== void 0) {
    const path = await saveBase64ToFile(first.b64_json, ctx.settings.outputDir, slugify(prompt), "png");
    files.push({ path, mimeType: "image/png" });
  } else if (first.url !== void 0) {
    files.push({ url: first.url });
  } else {
    throw new Error(`Image response item contained neither b64_json nor url: ${JSON.stringify(first).slice(0, 300)}`);
  }
  return { model: ctx.capability.model, prompt, files, mode: "openai-images" };
}
async function modelverseImage(ctx, prompt, size, referenceImagePaths = []) {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, "");
  const apiKey = apiKeyOf(ctx.capability.apiKey, ["DIRECTORX_IMAGE_API_KEY", "OPENAI_API_KEY"], baseURL);
  const content = [
    { type: "text", text: prompt },
    ...await Promise.all(referenceImagePaths.slice(0, 16).map(async (source) => ({
      type: "image_url",
      image_url: { url: await mediaSourceToDataUrl(source) },
      role: "reference"
    })))
  ];
  const parameters = { size: size !== void 0 && size !== "" ? size : "1024x1024" };
  const taskId = await submitModelverseTask(baseURL, apiKey, ctx.capability.model, content, parameters, ctx.signal);
  const finished = await pollModelverseTask(baseURL, apiKey, taskId, ctx.settings, ctx.signal);
  const files = [];
  for (const url of finished.urls) {
    files.push({ url });
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, `${slugify(prompt)}-image`, ".png");
      files[0] = { path, url, mimeType: "image/png" };
    }
  }
  return { model: ctx.capability.model, prompt, files, mode: "modelverse-tasks" };
}
async function runImage(ctx, prompt, options) {
  if (ctx.capability.mode === "mock") return mockImage(ctx, prompt, options.size ?? "1024x1024");
  if (ctx.capability.mode === "openai-images") return openaiImage(ctx, prompt, options.size, options.quality);
  if (ctx.capability.mode === "modelverse-tasks") return modelverseImage(ctx, prompt, options.size, options.referenceImagePaths ?? []);
  throw new Error(`Unsupported image mode: ${ctx.capability.mode}`);
}

// src/providers/video.ts
import { spawnSync } from "node:child_process";
import { join as join5 } from "node:path";
async function mockVideo(ctx, prompt) {
  const outDir = await ensureOutputDir(ctx.settings.outputDir);
  const path = join5(outDir, `${slugify(prompt)}-mock.mp4`);
  const ffmpeg = spawnSync("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=0x0b1020:s=640x360:d=1:r=24",
    "-vf",
    `drawtext=text='DirectorX mock video':fontcolor=white:fontsize=28:x=(w-text_w)/2:y=(h-text_h)/2`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    path
  ], { encoding: "utf8" });
  if (ffmpeg.error !== void 0) {
    throw new Error(`mock video mode requires ffmpeg on PATH (${ffmpeg.error.message}). Choose openai-videos or modelverse-tasks and configure Base URL / API Key.`);
  }
  if (ffmpeg.status !== 0) {
    throw new Error(`mock video ffmpeg failed: ${ffmpeg.stderr?.slice(-500)}`);
  }
  return { model: ctx.capability.model, prompt, status: "completed", files: [{ path, mimeType: "video/mp4" }], mode: "mock" };
}
async function openaiVideo(ctx, prompt, seconds, size) {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, "");
  const apiKey = apiKeyOf(ctx.capability.apiKey, ["DIRECTORX_VIDEO_API_KEY", "OPENAI_API_KEY"], baseURL);
  const payload = { model: ctx.capability.model, prompt };
  if (seconds !== void 0 && seconds > 0) payload.seconds = seconds;
  if (size !== void 0 && size !== "") payload.size = size;
  const response = await fetch(`${baseURL}/videos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: ctx.signal
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(`Video creation failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 400)}`);
  }
  const taskId = body.id ?? body.output?.task_id;
  if (taskId === void 0 || taskId === "") throw new Error(`Video response did not contain a task id: ${JSON.stringify(body).slice(0, 400)}`);
  const finished = await pollOpenAIVideoTask(baseURL, apiKey, taskId, ctx.settings, ctx.signal);
  const files = [];
  for (const url of finished.urls) {
    files.push({ url });
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, slugify(prompt), ".mp4");
      files[0] = { path, url, mimeType: "video/mp4" };
    }
  }
  return { model: ctx.capability.model, prompt, taskId, status: finished.status, files, mode: "openai-videos" };
}
async function modelverseVideo(ctx, prompt, options) {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, "");
  const apiKey = apiKeyOf(ctx.capability.apiKey, ["DIRECTORX_VIDEO_API_KEY", "OPENAI_API_KEY"], baseURL);
  const duration = Math.min(15, Math.max(4, Math.round(options.seconds ?? 5)));
  const content = [{ type: "text", text: prompt }];
  const hasFrameLocks = options.firstFramePath !== void 0 || options.lastFramePath !== void 0;
  if (options.firstFramePath !== void 0) {
    content.push({ type: "image_url", image_url: { url: await mediaSourceToDataUrl(options.firstFramePath) }, role: "first_frame" });
  }
  if (options.lastFramePath !== void 0) {
    content.push({ type: "image_url", image_url: { url: await mediaSourceToDataUrl(options.lastFramePath) }, role: "last_frame" });
  }
  for (const source of options.referenceImagePaths ?? []) {
    content.push({ type: "image_url", image_url: { url: await mediaSourceToDataUrl(source) }, role: "reference" });
  }
  const ratio = hasFrameLocks ? "adaptive" : options.aspectRatio ?? "16:9";
  const parameters = { duration, ratio, resolution: options.resolution ?? "2K", aigc_watermark: false };
  const taskId = await submitModelverseTask(baseURL, apiKey, ctx.capability.model, content, parameters, ctx.signal);
  const finished = await pollModelverseTask(baseURL, apiKey, taskId, ctx.settings, ctx.signal);
  const files = [];
  for (const url of finished.urls) {
    files.push({ url });
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, slugify(prompt), ".mp4");
      files[0] = { path, url, mimeType: "video/mp4" };
    }
  }
  return { model: ctx.capability.model, prompt, taskId, status: finished.status, files, mode: "modelverse-tasks" };
}
async function runVideo(ctx, prompt, options) {
  if (ctx.capability.mode === "mock") return mockVideo(ctx, prompt);
  if (ctx.capability.mode === "openai-videos") return openaiVideo(ctx, prompt, options.seconds, options.size);
  if (ctx.capability.mode === "modelverse-tasks") return modelverseVideo(ctx, prompt, options);
  throw new Error(`Unsupported video mode: ${ctx.capability.mode}`);
}

// src/providers/vision.ts
async function mockVision(ctx, source, question) {
  const isImage = /\.(png|jpe?g|webp|gif)$/i.test(source);
  return {
    model: ctx.capability.model,
    question,
    answer: `[mock vision] received ${isImage ? "image" : "source"} "${source}" and question "${question}". Set DirectorX \u2192 Vision mode to openai-chat with a real Base URL / API Key for actual answers.`,
    source
  };
}
async function openaiVision(ctx, source, question) {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, "");
  const apiKey = apiKeyOf(ctx.capability.apiKey, ["DIRECTORX_VISION_API_KEY", "OPENAI_API_KEY"], baseURL);
  const image = await mediaSourceToDataUrl(source);
  const content = isHttpUrl(image) || /^data:/i.test(image) ? [{ type: "text", text: question }, { type: "image_url", image_url: { url: image } }] : [{ type: "text", text: `${question}

Source path: ${source}` }];
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: ctx.capability.model,
      messages: [{ role: "user", content }],
      max_tokens: 2048
    }),
    signal: ctx.signal
  });
  const body = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(`Vision request failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 400)}`);
  }
  const answer = stringContentOf(body.choices?.[0]?.message?.content).trim();
  if (answer === "") throw new Error("Vision response contained no text content.");
  return { model: ctx.capability.model, question, answer, source };
}
async function runVision(ctx, source, question) {
  if (ctx.capability.mode === "mock") return mockVision(ctx, source, question);
  if (ctx.capability.mode === "openai-chat") return openaiVision(ctx, source, question);
  throw new Error(`Unsupported vision mode: ${ctx.capability.mode}`);
}
export {
  corpus,
  mockAudio,
  mockImage,
  mockVideo,
  mockVision,
  runAudio,
  runImage,
  runVideo,
  runVision
};
//# sourceMappingURL=testing.js.map
