// src/index.ts
import { fileURLToPath as fileURLToPath2 } from "node:url";

// src/config.ts
import z from "schemastery";
var SETTINGS_NS = "directorx";
var VISION_MODES = ["openai-chat", "mock"];
var IMAGE_MODES = ["openai-images", "modelverse-tasks", "mock"];
var VIDEO_MODES = ["openai-videos", "modelverse-tasks", "mock"];
var AUDIO_MODES = ["openai-tts", "mock"];
function capability(modes, mode, baseURL, model, resolution = "1K") {
  return z.object({
    enabled: z.boolean().default(true).description("Register and expose this capability to the agent."),
    mode: z.union(modes).default(mode).description("Protocol used to reach the provider."),
    baseURL: z.string().default(baseURL).description("Base URL, e.g. https://api.openai.com/v1."),
    apiKey: z.string().role("secret").default("").description("API key; empty means local endpoint or env fallback."),
    model: z.string().default(model).description("Model id."),
    resolution: z.string().default(resolution).description("Provider-specific output tier.")
  });
}
var DirectorxSettings = z.object({
  outputDir: z.string().default("directorx_output").description("Directory under the current working directory for downloaded media."),
  timeoutMs: z.number().step(1).min(1e3).max(36e5).default(12e4).description("HTTP timeout for one provider request."),
  pollIntervalMs: z.number().step(1).min(500).max(6e4).default(5e3).description("Async task polling interval."),
  maxPollAttempts: z.number().step(1).min(1).max(2e3).default(360).description("Maximum async task polling attempts."),
  vision: capability(VISION_MODES, "openai-chat", "https://api.openai.com/v1", "gpt-4o-mini"),
  image: capability(IMAGE_MODES, "openai-images", "https://api.openai.com/v1", "gpt-image-1"),
  video: capability(VIDEO_MODES, "openai-videos", "https://api.openai.com/v1", "sora-2", "2K"),
  audio: capability(AUDIO_MODES, "openai-tts", "https://api.openai.com/v1", "gpt-4o-mini-tts")
});

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

// src/skills.ts
import { readdir, readFile as readFile2 } from "node:fs/promises";
import { join as join2, resolve as resolve2 } from "node:path";
import { fileURLToPath } from "node:url";
var CN_NAME_TO_SLUG = {
  "\u5BFC\u6F14\u98CE\u683C\u81F4\u656C": "director-style",
  "\u52A8\u753B\u4E0E\u4E8C\u6B21\u5143": "animation",
  "\u77ED\u5267\u4E0E\u53D9\u4E8B": "short-drama",
  "\u97F3\u4E50MV\u4E0E\u821E\u53F0": "music-stage",
  "\u5E7F\u544A\u4E0E\u7535\u5546": "ads-ecommerce",
  "\u7EAA\u5F55\u7247\u4E0E\u7EAA\u5B9E": "documentary",
  "POV\u4E0E\u8FD0\u52A8": "pov-motion",
  "\u7279\u6548\u4E0E\u89C6\u89C9\u5B9E\u9A8C": "vfx-experiments",
  "\u89C6\u9891\u5236\u4F5C\u6280\u80FD\u5E93": "video-production-cn"
};
function validSkillName(name2) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name2);
}
function blockScalar(lines, startIndex) {
  const parts = [];
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "") {
      parts.push("");
      index += 1;
      continue;
    }
    if (!line.startsWith(" ") && !line.startsWith("	") && /^[A-Za-z0-9_-]+:/.test(line)) break;
    parts.push(line.replace(/^\s+/, "").replace(/^>\s?/, ""));
    index += 1;
  }
  return { value: parts.join(" ").replace(/\s+/g, " ").trim(), next: index };
}
function parseFrontmatter(source) {
  if (!source.startsWith("---\n") && !source.startsWith("---\r\n")) {
    return { frontmatter: {}, content: source };
  }
  const end = source.indexOf("\n---", 3);
  const raw = end >= 0 ? source.slice(4, end) : source.slice(4);
  const content = end >= 0 ? source.slice(end + 4).replace(/^\r?\n/, "") : "";
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const frontmatter = {};
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (match === null) continue;
    const key = match[1];
    let value = (match[2] ?? "").trim();
    const scalarStart = value.startsWith("|") || value.startsWith(">");
    if (value === "" || scalarStart) {
      const folded = blockScalar(lines, i + 1);
      value = folded.value;
      i = folded.next - 1;
    } else {
      value = value.replace(/^["']|["']$/g, "");
    }
    if (key === "name") frontmatter.name = value;
    if (key === "description") frontmatter.description = value;
    if (key === "whenToUse") frontmatter.whenToUse = value;
    if (key === "user-invocable") frontmatter.userInvocable = value === "true";
  }
  return { frontmatter, content };
}
async function readSkillFile(path) {
  try {
    return parseFrontmatter(await readFile2(path, "utf8"));
  } catch {
    return void 0;
  }
}
async function firstLevelSkillDirs(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    const dir = join2(root, entry.name);
    let safeName = entry.name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!validSkillName(safeName)) safeName = CN_NAME_TO_SLUG[entry.name] ?? `cn-${Buffer.from(entry.name).toString("hex").slice(0, 12)}`;
    out.push({ dir, safeName });
  }
  return out;
}
function defaultDescription(title) {
  return `DirectorX bundled skill "${title}". Load it when the task matches this craft domain.`;
}
async function registerBundledSkills(ctx) {
  const skillsRoot = fileURLToPath(new URL("../skills/", import.meta.url));
  const root = resolve2(skillsRoot);
  for (const { dir, safeName } of await firstLevelSkillDirs(root)) {
    const parsed = await readSkillFile(join2(dir, "SKILL.md"));
    if (parsed === void 0) continue;
    const name2 = parsed.frontmatter.name !== void 0 && validSkillName(parsed.frontmatter.name) ? parsed.frontmatter.name : safeName;
    const description = parsed.frontmatter.description?.trim() !== "" ? parsed.frontmatter.description ?? defaultDescription(name2) : defaultDescription(name2);
    ctx.skills.register({
      name: name2,
      description,
      ...parsed.frontmatter.whenToUse === void 0 ? {} : { whenToUse: parsed.frontmatter.whenToUse },
      content: parsed.content,
      source: "bundled",
      provider: "directorx",
      resourceBase: { kind: "directory", path: dir },
      invocation: {
        modelInvocable: true,
        userInvocable: parsed.frontmatter.userInvocable ?? true
      }
    });
  }
  const cnRoot = join2(root, "video-production-cn");
  const cnEntries = await firstLevelSkillDirs(cnRoot).catch(() => []);
  for (const { dir, safeName } of cnEntries) {
    const parsed = await readSkillFile(join2(dir, "SKILL.md"));
    if (parsed === void 0) continue;
    const name2 = `directorx-${safeName}`;
    ctx.skills.register({
      name: name2,
      description: parsed.frontmatter.description?.trim() !== "" ? parsed.frontmatter.description ?? defaultDescription(name2) : defaultDescription(name2),
      content: parsed.content,
      source: "bundled",
      provider: "directorx",
      resourceBase: { kind: "directory", path: dir },
      invocation: { modelInvocable: true, userInvocable: true }
    });
  }
  ctx.skills.register({
    name: "directorx-knowledge",
    description: "Search and read the bundled DirectorX film/AI-video knowledge corpus (350+ Chinese craft articles, model matrixes, prompt engineering, workflows). Use directorx_knowledge_search and directorx_knowledge_read instead of guessing domain facts.",
    content: [
      "# DirectorX Knowledge Corpus",
      "",
      "Use the `directorx_knowledge_search` tool with a focused Chinese or English query before making a filmmaking, prompting, model-selection, or workflow decision. Inspect the returned `id` / `slug` / `path`, then call `directorx_knowledge_read` for the full article.",
      "The corpus covers: camera language, editing, screenplay, AI video/image prompting, model matrix, first/last-frame control, consistency systems, sound design, vertical drama, ad/e-commerce workflows, platform delivery specs, and copyright-safe prompting.",
      "Prefer corpus facts over guessed model capabilities. Cite the article id when you use its guidance."
    ].join("\n"),
    source: "runtime",
    provider: "directorx",
    invocation: { modelInvocable: true, userInvocable: true }
  });
  ctx.skills.register({
    name: "directorx-recipes",
    description: "Reusable DirectorX production recipes (ad video, clip recut, tutorial, documentary, novel adaptation, unit production, promo, one-line ad). Load when the user asks for an end-to-end AI-video workflow and a recipe matches the format.",
    content: [
      "# DirectorX Recipes",
      "",
      "Recipes are step plans, not agents. DSH owns planning and execution; treat recipes as checklists and stage contracts.",
      "Recipe files ship in the plugin `recipes/` directory. Read the matching markdown file when a production format matches (e.g. `recipes/ad-video.md`, `recipes/tutorial-video.md`, `recipes/short-drama.md`).",
      "Every recipe assumes the DirectorX generation tools are configured in Settings; before queuing media, verify the matching capability is enabled and its Base URL / API Key / model are set."
    ].join("\n"),
    source: "runtime",
    provider: "directorx",
    invocation: { modelInvocable: true, userInvocable: true }
  });
}

// src/tools.ts
import { defineTool } from "@deepseek-ai/dsh-tools";

// src/providers/audio.ts
import { writeFile as writeFile2 } from "node:fs/promises";
import { join as join4 } from "node:path";

// src/support.ts
import { mkdir, readFile as readFile3, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname, join as join3, resolve as resolve3 } from "node:path";
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
  const path = resolve3(source);
  if (!existsSync(path)) throw new Error(`File not found: ${source}`);
  const data = await readFile3(path);
  if (data.length > maxBytes) {
    throw new Error(`File too large to inline (${Math.round(data.length / 1024 / 1024)}MB > ${Math.round(maxBytes / 1024 / 1024)}MB): ${source}`);
  }
  return `data:${mimeForPath(path)};base64,${data.toString("base64")}`;
}
async function ensureOutputDir(dir) {
  const out = resolve3(process.cwd(), dir);
  await mkdir(out, { recursive: true });
  return out;
}
async function downloadToFile(url, outDir, prefix, ext) {
  await ensureOutputDir(outDir);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const stem = `${prefix}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}${ext}`;
  const path = join3(outDir, stem);
  await writeFile(path, bytes);
  return path;
}
async function saveBase64ToFile(data, outDir, prefix, ext) {
  await ensureOutputDir(outDir);
  const raw = data.replace(/^data:[^;]+;base64,/, "");
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  const path = join3(outDir, `${prefix}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}${normalizedExt}`);
  await writeFile(path, Buffer.from(raw, "base64"));
  return path;
}
function apiKeyOf(configApiKey, envNames, baseURL) {
  const fromEnv = envNames.map((name2) => process.env[name2]).find((value) => value !== void 0 && value !== "");
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
  const path = join4(outDir, `${slugify(text, 24)}-mock.wav`);
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
  const path = join4(outDir, `${slugify(text, 24)}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}.${ext}`);
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
import { join as join5 } from "node:path";

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
    await new Promise((resolve4) => setTimeout(resolve4, settings.pollIntervalMs));
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
    await new Promise((resolve4) => setTimeout(resolve4, settings.pollIntervalMs));
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
  const name2 = `${slugify(prompt, 24)}-${size.replace(/[^\d]/g, "x")}.svg`;
  const path = join5(outDir, name2);
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
import { join as join6 } from "node:path";
async function mockVideo(ctx, prompt) {
  const outDir = await ensureOutputDir(ctx.settings.outputDir);
  const path = join6(outDir, `${slugify(prompt)}-mock.mp4`);
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

// src/tools.ts
function renderJson(_args, value) {
  return [{ type: "text", text: JSON.stringify(value, null, 2) }];
}
function objectOutput() {
  return {
    schema: { type: "object", properties: {}, additionalProperties: true },
    render: renderJson
  };
}
function combinedSignal(execSignal, timeoutMs) {
  return AbortSignal.any([execSignal, AbortSignal.timeout(timeoutMs)]);
}
function toolContext(settings, capability2, signal) {
  return { settings, capability: capability2, signal };
}
function syncTools(ctx, settings) {
  const disposers = [];
  if (settings.vision.enabled) {
    disposers.push(ctx.tools.register(defineTool({
      name: "directorx_view_image",
      description: "Look at an image and answer a focused question about it. Accepts an absolute local file path, an http(s) URL, or a data: URL. Configure the vision Base URL / API Key / model in DSH WebUI Settings \u2192 DirectorX.",
      parameters: {
        source: { type: "string", required: true, description: "The image: absolute local file path, http(s) URL, or data: URL." },
        question: { type: "string", description: "What to find out. Be specific. Default: a thorough visual description including text, layout, people, and notable details." }
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs);
        const source = args.source.trim();
        const question = args.question?.trim() || "Describe this image thoroughly. Include any visible text verbatim, the layout, people, objects, and notable details.";
        return runVision(toolContext(settings, settings.vision, signal), source, question);
      }
    })));
  }
  if (settings.image.enabled) {
    disposers.push(ctx.tools.register(defineTool({
      name: "directorx_generate_image",
      description: "Generate one or more images through a configurable OpenAI-compatible /images/generations endpoint or a ModelVerse tasks endpoint. Supports optional reference images in modelverse-tasks mode. Configure the image Base URL / API Key / model in DSH WebUI Settings \u2192 DirectorX.",
      parameters: {
        prompt: { type: "string", required: true, description: "Text-to-image prompt. Follow DirectorX prompting craft: subject, action, environment, style, light, lens." },
        size: { type: "string", description: "Size such as 1024x1024, 1536x1024, or 1024x1536. Optional; provider defaults apply." },
        quality: { type: "string", enum: ["auto", "low", "medium", "high"], description: "Quality hint for providers that support it." },
        reference_image_paths: { type: "array", items: { type: "string" }, description: "Optional local paths or URLs used as image references (modelverse-tasks mode)." }
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs);
        return runImage(toolContext(settings, settings.image, signal), args.prompt, {
          size: args.size,
          quality: args.quality,
          referenceImagePaths: args.reference_image_paths
        });
      }
    })));
  }
  if (settings.video.enabled) {
    disposers.push(ctx.tools.register(defineTool({
      name: "directorx_generate_video",
      description: "Generate an AI video through a configurable OpenAI /videos endpoint or a ModelVerse tasks endpoint. Supports first-frame, last-frame, and reference-image controls. Configure the video Base URL / API Key / model in DSH WebUI Settings \u2192 DirectorX.",
      parameters: {
        prompt: { type: "string", required: true, description: "DirectorX video prompt: physical action first, then camera, environment, style, lighting. Positive language; concrete motion." },
        seconds: { type: "number", description: "Target duration in seconds. Provider clamps unknown values." },
        size: { type: "string", description: "Output size for providers that accept it, e.g. 1280x720 or 1920x1080." },
        aspect_ratio: { type: "string", description: "Aspect ratio such as 16:9, 9:16, 1:1 (modelverse-tasks mode)." },
        first_frame_path: { type: "string", description: "Optional first frame image path/URL for frame-locked generation." },
        last_frame_path: { type: "string", description: "Optional last frame image path/URL for frame-locked transition." },
        reference_image_paths: { type: "array", items: { type: "string" }, description: "Optional reference image paths/URLs for character/appearance consistency." }
      },
      output: objectOutput(),
      timeoutMs: Math.max(settings.timeoutMs, settings.pollIntervalMs * settings.maxPollAttempts),
      async execute(args, exec) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs);
        return runVideo(toolContext(settings, settings.video, signal), args.prompt, {
          seconds: args.seconds,
          size: args.size,
          aspectRatio: args.aspect_ratio,
          resolution: settings.video.resolution,
          firstFramePath: args.first_frame_path,
          lastFramePath: args.last_frame_path,
          referenceImagePaths: args.reference_image_paths
        });
      }
    })));
  }
  if (settings.audio.enabled) {
    disposers.push(ctx.tools.register(defineTool({
      name: "directorx_generate_audio",
      description: "Generate speech (and provider-supported music/audio) through a configurable OpenAI-compatible /audio/speech endpoint. Configure the audio Base URL / API Key / model in DSH WebUI Settings \u2192 DirectorX.",
      parameters: {
        text: { type: "string", required: true, description: "Text to synthesize. For music prompts, write the desired style, tempo, and instrumentation." },
        voice: { type: "string", description: "Voice id such as alloy, echo, onyx, nova, or a provider-specific voice." },
        format: { type: "string", enum: ["mp3", "wav", "opus", "aac"], description: "Audio format. Default mp3." }
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      async execute(args, exec) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs);
        return runAudio(toolContext(settings, settings.audio, signal), args.text, { voice: args.voice, format: args.format });
      }
    })));
  }
  disposers.push(ctx.tools.register(defineTool({
    name: "directorx_knowledge_search",
    description: "Search the bundled DirectorX film/AI-video knowledge corpus (350+ Chinese craft articles). Returns ranked article ids, titles, paths, and snippets. Call directorx_knowledge_read for the full article.",
    parameters: {
      query: { type: "string", required: true, description: 'Search query, e.g. "\u56FE\u751F\u89C6\u9891 \u9996\u5C3E\u5E27 \u63D0\u793A\u8BCD" or "camera movement semantics".' },
      max_results: { type: "number", description: "Maximum results (default 8, max 20)." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const maxResults = Math.min(20, Math.max(1, Math.round(args.max_results ?? 8)));
      return { query: args.query, results: await corpus.search(args.query, maxResults) };
    }
  })));
  disposers.push(ctx.tools.register(defineTool({
    name: "directorx_knowledge_read",
    description: "Read one bundled DirectorX knowledge article by id, slug, numeric id, or package-relative path returned by directorx_knowledge_search.",
    parameters: {
      ref: { type: "string", required: true, description: 'Article id/slug/path from directorx_knowledge_search, e.g. "114" or "ai-video-model-matrix".' }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      return corpus.readArticle(args.ref);
    }
  })));
  return () => {
    for (const dispose of disposers.reverse()) dispose();
  };
}
function registerSystemPrompt(ctx, settings) {
  const enabled = ["vision", "image", "video", "audio"].filter((key) => settings[key].enabled);
  const toolList = [
    ...settings.vision.enabled ? ["directorx_view_image"] : [],
    ...settings.image.enabled ? ["directorx_generate_image"] : [],
    ...settings.video.enabled ? ["directorx_generate_video"] : [],
    ...settings.audio.enabled ? ["directorx_generate_audio"] : []
  ];
  return ctx.systemPrompt.section({
    name: "tool:directorx",
    order: 117,
    text: [
      "## DirectorX media tools",
      `Enabled capabilities: ${enabled.length === 0 ? "none (open Settings \u2192 DirectorX to enable)" : enabled.join(", ")}.`,
      toolList.length > 0 ? `Available tools: ${toolList.join(", ")}.` : "",
      "",
      "- Before media generation, load the relevant DirectorX skill (`skill` tool) and search the knowledge corpus with `directorx_knowledge_search`; do not guess model capabilities.",
      "- Keep prompts positive and physical; lock subject, style, light, lens, and continuity in writing before calling generation tools.",
      "- Treat provider responses as authoritative: inspect returned paths/URLs/status before claiming completion.",
      "- If a tool fails with a Base URL / API Key / mode error, tell the user to open WebUI Settings \u2192 DirectorX and configure the matching capability."
    ].filter(Boolean).join("\n")
  });
}

// src/index.ts
var name = "directorx";
var inject = ["tools", "skills", "systemPrompt", "settings", "llm"];
function apply(ctx) {
  corpus.setRoot(fileURLToPath2(new URL("../knowledge/", import.meta.url)));
  const namespace = SETTINGS_NS;
  const scope = ctx.settings.register(namespace, DirectorxSettings, {
    applies: "live",
    validate(value) {
      for (const capability2 of [value.vision, value.image, value.video, value.audio]) {
        if (capability2.enabled && capability2.mode !== "mock" && capability2.baseURL.trim() === "") {
          throw new Error("An enabled DirectorX capability needs a non-empty Base URL (or choose mock mode).");
        }
      }
    }
  });
  const llm = ctx.get("llm");
  llm.registerConfigurableProviders([
    { provider: "directorx-vision", displayName: "DirectorX Vision", settingsNs: SETTINGS_NS, settingsPath: ["vision"], declared: true },
    { provider: "directorx-image", displayName: "DirectorX Image", settingsNs: SETTINGS_NS, settingsPath: ["image"], declared: true },
    { provider: "directorx-video", displayName: "DirectorX Video", settingsNs: SETTINGS_NS, settingsPath: ["video"], declared: true },
    { provider: "directorx-audio", displayName: "DirectorX Audio", settingsNs: SETTINGS_NS, settingsPath: ["audio"], declared: true }
  ]);
  let disposeTools;
  let disposePrompt;
  const sync = (settings) => {
    disposeTools?.();
    disposePrompt?.();
    disposeTools = syncTools(ctx, settings);
    disposePrompt = registerSystemPrompt(ctx, settings);
  };
  sync(scope.get());
  ctx.effect(() => scope.watch(sync), "directorx settings watch");
  void registerBundledSkills(ctx).catch((error) => {
    ctx.logger?.error("directorx: failed to register bundled skills: %s", error instanceof Error ? error.message : String(error));
  });
}
export {
  apply,
  corpus,
  inject,
  mockAudio,
  mockImage,
  mockVideo,
  mockVision,
  name,
  runAudio,
  runImage,
  runVideo,
  runVision
};
//# sourceMappingURL=index.js.map
