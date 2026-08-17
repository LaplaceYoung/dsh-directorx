// src/index.ts
import { fileURLToPath as fileURLToPath4 } from "node:url";
import { defineTool } from "@deepseek-ai/dsh-tools";

// src/config.ts
import z from "schemastery";
var SETTINGS_NS = "directorx";
var VISION_MODES = ["openai-chat", "mock"];
var IMAGE_MODES = ["openai-images", "modelverse-tasks", "generic-rest", "mock"];
var VIDEO_MODES = ["openai-videos", "modelverse-tasks", "kling", "kling-v3", "runway", "minimax-h3", "vidu", "veo", "generic-rest", "mock"];
var AUDIO_MODES = ["openai-tts", "generic-rest", "mock"];
function modeAuth() {
  return z.object({
    klingAk: z.string().role("secret").default("").description("Kling \u53EF\u7075 AccessKey\uFF08JWT \u7B7E\u540D\u7528\uFF0C\u4EC5 kling \u6A21\u5F0F\u9700\u8981\uFF09\u3002"),
    klingSk: z.string().role("secret").default("").description("Kling \u53EF\u7075 SecretKey\uFF08JWT \u7B7E\u540D\u7528\uFF0C\u4EC5 kling \u6A21\u5F0F\u9700\u8981\uFF09\u3002"),
    runwayVersion: z.string().default("").description("Runway API \u7248\u672C\u5934\uFF08\u5982 2024-11-06\uFF09\uFF0C\u7559\u7A7A\u5219\u4E0D\u53D1\u9001\u8BE5\u5934\u3002")
  });
}
function capability(modes, mode, baseURL, model, resolution = "1K") {
  return z.object({
    enabled: z.boolean().default(true).description("Register and expose this capability to the agent."),
    mode: z.union(modes).default(mode).description("Protocol used to reach the provider."),
    baseURL: z.string().default(baseURL).description("Base URL, e.g. https://api.openai.com/v1."),
    apiKey: z.string().role("secret").default("").description("API key; empty means local endpoint or env fallback."),
    model: z.string().default(model).description("Model id."),
    resolution: z.string().default(resolution).description("Provider-specific output tier."),
    auth: modeAuth()
  });
}
var DirectorxSettings = z.object({
  outputDir: z.string().default("directorx_output").description("Directory under the current working directory for downloaded media."),
  timeoutMs: z.number().step(1).min(1e3).max(36e5).default(12e4).description("HTTP timeout for one provider request."),
  pollIntervalMs: z.number().step(1).min(500).max(6e4).default(5e3).description("Async task polling interval."),
  maxPollAttempts: z.number().step(1).min(1).max(2e3).default(360).description("Maximum async task polling attempts."),
  persona: z.union(["\u6210\u7247"]).default("\u6210\u7247").description("\u6210\u7247 persona\uFF1A\u5BFC\u6F14\u89D2\u5EA6\u5206\u6790\uFF0C\u79EF\u6781\u8C03\u7528\u77E5\u8BC6\u5E93\u4E0E skill\u3002"),
  initiative: z.union(["\u4E25\u683C", "\u81EA\u52A8", "\u534F\u540C"]).default("\u534F\u540C").description("\u4E25\u683C\uFF1A\u591A\u786E\u8BA4\u3001\u4E0D\u751F\u6210\u3001\u4E8C\u5230\u56DB\u4E2A\u63D0\u793A\u8BCD\u3002\u81EA\u52A8\uFF1A\u9884\u7B97\u5185\u76F4\u63A5\u6267\u884C\u751F\u6210\u3002\u534F\u540C\uFF1A\u63D0\u793A\u8BCD\u548C\u5360\u4F4D\uFF0C\u7528\u6237\u5BA1\u9605\u540E\u6267\u884C\u751F\u6210\u3002"),
  vision: capability(VISION_MODES, "openai-chat", "https://api.modelverse.cn/v1", "gpt-5.6-luna"),
  image: capability(IMAGE_MODES, "openai-images", "https://api.modelverse.cn/v1", "gpt-image-2"),
  video: capability(VIDEO_MODES, "modelverse-tasks", "https://api.modelverse.cn/v1", "doubao-seedance-2-0-260128", "2K"),
  audio: capability(AUDIO_MODES, "openai-tts", "https://api.modelverse.cn/v1", "qwen3-tts-flash")
});

// src/corpus.ts
import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
var MAX_READ_CHARS = 6e4;
function normPath(value) {
  return value.replaceAll("\\", "/").replace(/^\/+/, "");
}
var SYNONYMS = [
  [/首尾帧|首帧|尾帧|first.?frame|last.?frame/i, "\u56FE\u751F\u89C6\u9891 image-to-video i2v \u9996\u5E27 \u5C3E\u5E27"],
  [/图生视频|i2v|image.to.video/i, "\u9996\u5C3E\u5E27 \u9996\u5E27 \u53C2\u8003\u56FE"],
  [/三视图|设定图|正侧背|turnaround|character sheet/i, "\u89D2\u8272 \u8BBE\u5B9A \u4E09\u89C6\u56FE \u6B63\u89C6 \u4FA7\u89C6 \u80CC\u89C6"],
  [/分镜|storyboard|镜号/i, "\u5206\u955C \u955C\u5934 \u666F\u522B \u8FD0\u955C"],
  [/调色|lut|grade|色板|配色/i, "\u8C03\u8272 \u8272\u5F69 \u80F6\u7247 \u9752\u6A59"],
  [/一致性|continuity|锚点/i, "\u89D2\u8272\u4E00\u81F4\u6027 \u8DE8\u955C \u53C2\u8003\u56FE"],
  [/口播|配音|tts|旁白/i, "\u97F3\u9891 \u8BED\u97F3 \u53E3\u64AD \u5B57\u5E55"],
  [/质检|qa|黑场|响度/i, "\u6210\u7247\u8D28\u68C0 \u65F6\u957F \u753B\u5E45"]
];
function expandQuery(query) {
  let extra = "";
  for (const [pattern, words] of SYNONYMS) {
    if (pattern.test(query)) extra += ` ${words}`;
  }
  return `${query} ${extra}`.trim();
}
function textTokens(value) {
  const tokens2 = /* @__PURE__ */ new Set();
  const words = value.toLowerCase().match(/[a-z0-9][a-z0-9_-]{1,}/g);
  for (const word of words ?? []) {
    tokens2.add(word);
    if (word.length > 3) tokens2.add(word.slice(0, 4));
  }
  const han = value.replace(/[^\u4e00-\u9fff]/g, "");
  for (let i = 0; i < han.length; i += 1) {
    tokens2.add(han[i] ?? "");
    if (i + 1 < han.length) tokens2.add(han.slice(i, i + 2));
  }
  return tokens2;
}
function overlapScore(a, b) {
  let hit = 0;
  for (const token of a) if (b.has(token)) hit += 1;
  return hit;
}
function scoreMeta(query, queryTokens, article) {
  const title = article.title;
  const slug = article.slug;
  const group = article.group ?? "";
  const lower = query.toLowerCase();
  let score = overlapScore(queryTokens, textTokens(`${title} ${slug} ${group}`)) * 6;
  score += overlapScore(queryTokens, textTokens(title)) * 4;
  if (title.toLowerCase().includes(lower) || slug.toLowerCase().includes(lower)) score += 80;
  if (title.toLowerCase().startsWith(lower) || slug.startsWith(lower.replace(/\s+/g, "-"))) score += 40;
  if (group !== "" && overlapScore(queryTokens, textTokens(group)) > 0) score += 8;
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
  async search(query, maxResults = 8, options = {}) {
    const q = query.trim();
    if (q === "") return [];
    const expanded = expandQuery(q);
    const queryTokens = textTokens(expanded);
    if (queryTokens.size === 0) return [];
    const groupFilter = options.group?.trim().toLowerCase();
    const articles = (await this.loadInventory()).filter((article) => groupFilter === void 0 || groupFilter === "" || (article.group ?? "").toLowerCase() === groupFilter);
    const prelim = [];
    for (const article of articles) {
      const score = scoreMeta(q, queryTokens, article);
      if (score > 0) prelim.push({ article, score });
    }
    prelim.sort((a, b) => b.score - a.score);
    const shortlist = prelim.slice(0, Math.max(24, maxResults * 4));
    const refined = [];
    for (const item of shortlist) {
      const body = await this.read(item.article.path).catch(() => "");
      const score = item.score + overlapScore(queryTokens, textTokens(body.slice(0, 4e3)));
      refined.push({
        ...item.article,
        score,
        snippet: makeSnippet(body, textTokens(q))
      });
    }
    return refined.sort((a, b) => b.score - a.score).slice(0, Math.max(1, maxResults));
  }
  async related(ref, maxResults = 3) {
    const { article } = await this.readArticle(ref);
    const hits = await this.search(`${article.title} ${article.group ?? ""}`, maxResults + 1);
    return hits.filter((hit) => hit.id !== article.id).slice(0, maxResults);
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

// src/media-server.ts
import { createReadStream, existsSync as existsSync3 } from "node:fs";
import { mkdir as mkdir9, readFile as readFile10, readdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { join as join12, relative } from "node:path";

// src/proposals.ts
import { mkdir as mkdir2, readFile as readFile3, writeFile as writeFile2 } from "node:fs/promises";

// src/limits.ts
var LIMITS = {
  /** 输入文件上限。 */
  maxFileBytes: 4 * 1024 * 1024 * 1024,
  /** 素材时长上限。 */
  maxDurationSec: 4 * 3600,
  /** 最大分辨率（宽）。 */
  maxWidth: 7680,
  /** probe 超时。 */
  probeTimeoutMs: 3e4,
  /** 批量操作条目上限。 */
  maxBatch: 50,
  /** 生成并发上限。 */
  maxConcurrency: 16,
  /** workflow 步骤上限。 */
  maxWorkflowSteps: 64,
  /** 编码质量区间。 */
  crfRange: [0, 51],
  /** 变速区间。 */
  speedRange: [0.01, 100],
  /** 音量区间。 */
  volumeRange: [0, 4],
  /** 音频频率区间（Hz）。 */
  audioFreqRange: [20, 2e4],
  /** 提案预检区间。 */
  proposalDurationRange: [1, 300],
  proposalCountRange: [1, 50],
  /** 转场时长区间（秒）。 */
  transitionRange: [0.05, 8]
};

// src/proposals.ts
import { join as join4 } from "node:path";

// src/support.ts
import { mkdir, readFile as readFile2, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname, isAbsolute, join as join3, resolve as resolve3, sep as sep2 } from "node:path";

// src/project.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join as join2, resolve as resolve2 } from "node:path";
var projectStore = new AsyncLocalStorage();
function currentProjectRoot() {
  return projectStore.getStore() ?? process.cwd();
}
function runInProject(root, fn) {
  const next = typeof root === "string" && root.trim() !== "" ? resolve2(root) : currentProjectRoot();
  return projectStore.run(next, fn);
}
function sessionProjectRoot(exec) {
  const cwd = exec?.agent?.session?.header?.cwd;
  return typeof cwd === "string" && cwd.trim() !== "" ? cwd : void 0;
}
function projectFromRequest(request) {
  const header = request.headers["x-directorx-project"];
  if (typeof header === "string" && header.trim() !== "") return header.trim();
  const url = request.url ?? "";
  const queryStart = url.indexOf("?");
  if (queryStart < 0) return void 0;
  const value = new URLSearchParams(url.slice(queryStart + 1)).get("project");
  return value !== null && value.trim() !== "" ? value.trim() : void 0;
}
function normalizeProjects(items) {
  return items.map((item) => ({
    path: typeof item.path === "string" ? item.path : "",
    title: typeof item.title === "string" && item.title !== "" ? item.title : (item.path ?? "").split("/").filter(Boolean).at(-1) ?? ""
  })).filter((item) => item.path !== "");
}
function listProjectsFromDisk() {
  const home = process.env.DSH_HOME ?? join2(homedir(), ".dsh");
  try {
    const parsed = JSON.parse(readFileSync(join2(home, "storages", "workspace.json"), "utf8"));
    return normalizeProjects(Object.values(parsed.tables?.workspaces ?? {}));
  } catch {
    return [];
  }
}
function listWorkspaceRoots(ctx) {
  const workspace = ctx.get("workspace");
  const live = normalizeProjects(workspace?.list?.() ?? []);
  return live.length > 0 ? live : listProjectsFromDisk();
}
function resolveRequestProject(ctx, request) {
  const requested = projectFromRequest(request);
  if (requested === void 0) return process.cwd();
  const resolved = resolve2(requested);
  const allowed = listWorkspaceRoots(ctx).map((item) => resolve2(item.path));
  if (allowed.includes(resolved)) return resolved;
  if (allowed.length === 0) return resolved;
  throw new Error("unknown project");
}

// src/support.ts
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
  const project = currentProjectRoot();
  const guesses = [
    resolve3(source),
    resolve3(project, source),
    resolve3(project, "directorx_output", source.replace(/^directorx_output[/\\]/, ""))
  ];
  const path = [...new Set(guesses)].find((candidate) => existsSync(candidate));
  if (path === void 0) throw new Error(`File not found: ${source}`);
  const data = await readFile2(path);
  if (data.length > maxBytes) {
    throw new Error(`File too large to inline (${Math.round(data.length / 1024 / 1024)}MB > ${Math.round(maxBytes / 1024 / 1024)}MB): ${source}`);
  }
  return `data:${mimeForPath(path)};base64,${data.toString("base64")}`;
}
function losslessJsonObject(value) {
  const clean = JSON.parse(JSON.stringify(value ?? null));
  if (clean !== null && typeof clean === "object" && !Array.isArray(clean)) return clean;
  return { value: clean };
}
function resolveOutputDir(dir) {
  return resolve3(currentProjectRoot(), dir);
}
async function ensureOutputDir(dir) {
  const out = resolveOutputDir(dir);
  await mkdir(out, { recursive: true });
  return out;
}
async function downloadToFile(url, outDir, prefix, ext) {
  const dir = await ensureOutputDir(outDir);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const stem = `${prefix}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}${ext}`;
  const path = join3(dir, stem);
  await writeFile(path, bytes);
  return path;
}
async function saveBase64ToFile(data, outDir, prefix, ext) {
  const dir = await ensureOutputDir(outDir);
  const raw = data.replace(/^data:[^;]+;base64,/, "");
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  const path = join3(dir, `${prefix}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}${normalizedExt}`);
  await writeFile(path, Buffer.from(raw, "base64"));
  return path;
}
var MAX_MEDIA_BYTES = 512 * 1024 * 1024;
function resolveMediaPath(outputDir, candidate) {
  const project = currentProjectRoot();
  const root = resolve3(project, outputDir);
  const inside = (target) => target === root || target.startsWith(root + sep2);
  const guesses = isAbsolute(candidate) ? [resolve3(candidate)] : [resolve3(project, candidate), resolve3(root, candidate)];
  const allowed = [...new Set(guesses)].filter(inside);
  if (allowed.length === 0) {
    throw new Error(`Media path escapes the DirectorX output directory: ${candidate}`);
  }
  const existing = allowed.find((path) => existsSync(path));
  return existing ?? allowed[0];
}
function parseRangeHeader(value, size) {
  if (value === void 0) return void 0;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (match === null || size <= 0) return void 0;
  const startRaw = match[1] ?? "";
  const endRaw = match[2] ?? "";
  if (startRaw === "" && endRaw === "") return void 0;
  if (startRaw === "") {
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) return void 0;
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(startRaw);
  if (!Number.isFinite(start) || start < 0 || start >= size) return void 0;
  const end = endRaw === "" ? size - 1 : Math.min(size - 1, Number(endRaw));
  if (!Number.isFinite(end) || end < start) return void 0;
  return { start, end };
}
function parseMediaQuery(url) {
  if (url === void 0) return void 0;
  const queryStart = url.indexOf("?");
  if (queryStart < 0) return void 0;
  const value = new URLSearchParams(url.slice(queryStart + 1)).get("path");
  return value === null || value === "" ? void 0 : value;
}
function apiKeyOf(configApiKey, envNames, baseURL) {
  const candidates = [...envNames, "MODELVERSE_API_KEY", "AIGW_API_KEY", "OPENAI_API_KEY"];
  const fromEnv = candidates.map((name2) => process.env[name2]).find((value) => value !== void 0 && value !== "");
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

// src/proposals.ts
var MAX_PROPOSALS = 200;
var STAGE_ORDER = ["script", "character", "shot", "assembly"];
var ProposalStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join4(resolveOutputDir(this.outputDir), "proposals.json");
  }
  async read() {
    try {
      const raw = await readFile3(this.filePath(), "utf8");
      const parsed = JSON.parse(raw);
      return { proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [] };
    } catch {
      return { proposals: [] };
    }
  }
  async write(ledger) {
    await mkdir2(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile2(this.filePath(), JSON.stringify(ledger, null, 2), "utf8");
    return ledger;
  }
  /** 预检：提交即校验基础参数（模型目录预检的前置层）。 */
  precheck(input) {
    if (input.prompt.trim() === "") return "prompt \u4E0D\u80FD\u4E3A\u7A7A";
    if (input.kind !== "image" && input.kind !== "video" && input.kind !== "audio") return "kind \u5FC5\u987B\u662F image/video/audio";
    if (input.duration !== void 0 && (input.duration < LIMITS.proposalDurationRange[0] || input.duration > LIMITS.proposalDurationRange[1])) return `duration \u8D85\u51FA ${LIMITS.proposalDurationRange[0]}-${LIMITS.proposalDurationRange[1]}s \u652F\u6301\u8303\u56F4`;
    if (input.count < LIMITS.proposalCountRange[0] || input.count > LIMITS.proposalCountRange[1]) return `count \u8D85\u51FA ${LIMITS.proposalCountRange[0]}-${LIMITS.proposalCountRange[1]} \u652F\u6301\u8303\u56F4`;
    if (input.size !== void 0 && !/^\d{3,4}[x:]\d{3,4}$|^\d+:\d+$/.test(input.size)) return "size \u683C\u5F0F\u5E94\u4E3A 1280x720 \u6216 16:9 \u7C7B";
    return null;
  }
  async propose(input) {
    const invalid = this.precheck(input);
    if (invalid !== null) throw new Error(`\u63D0\u6848\u9884\u68C0\u672A\u901A\u8FC7\uFF1A${invalid}`);
    const ledger = await this.read();
    const proposal = {
      ...input,
      attempts: 0,
      id: `proposal-${Date.now().toString(36)}`,
      status: "proposed",
      at: Date.now()
    };
    ledger.proposals.push(proposal);
    if (ledger.proposals.length > MAX_PROPOSALS) ledger.proposals.splice(0, ledger.proposals.length - MAX_PROPOSALS);
    await this.write(ledger);
    return proposal;
  }
  /** 审批队列：取最旧的一条待批准提案（审批门循环的下一步）。 */
  async next() {
    const ledger = await this.read();
    const approved = ledger.proposals.filter((proposal) => proposal.status === "approved" && (proposal.taskId ?? "") === "").sort((a, b) => a.at - b.at);
    if (approved.length > 0) return approved[0];
    const proposed = ledger.proposals.filter((proposal) => proposal.status === "proposed").sort((a, b) => a.at - b.at);
    if (proposed.length === 0) return null;
    const earliestOpenStage = Math.min(...proposed.map((proposal) => STAGE_ORDER.indexOf(proposal.stage ?? "shot")));
    const executable = proposed.find((proposal) => STAGE_ORDER.indexOf(proposal.stage ?? "shot") === earliestOpenStage);
    return executable ?? null;
  }
  async get(id) {
    const ledger = await this.read();
    return ledger.proposals.find((proposal) => proposal.id === id) ?? null;
  }
  async list(status, limit = 50) {
    const ledger = await this.read();
    const filtered = status === void 0 ? ledger.proposals : ledger.proposals.filter((proposal) => proposal.status === status);
    return filtered.slice(-limit).reverse();
  }
  async update(id, status, fields = {}) {
    const ledger = await this.read();
    const proposal = ledger.proposals.find((candidate) => candidate.id === id);
    if (proposal === void 0) throw new Error(`proposal "${id}" not found`);
    proposal.status = status;
    if (status === "rejected" && fields.rejectReason !== void 0 && fields.rejectReason !== "") proposal.rejectReason = fields.rejectReason;
    if (fields.taskId !== void 0 && fields.taskId !== "") proposal.taskId = fields.taskId;
    if (fields.attempts !== void 0) proposal.attempts = fields.attempts;
    if (fields.prompt !== void 0 && fields.prompt.trim() !== "") proposal.prompt = fields.prompt.slice(0, 2e3);
    await this.write(ledger);
    return proposal;
  }
  /** 版本血统：基于被拒提案生成新版本（parentId 链 + attempts 递增）。 */
  async regenerate(id, patch = {}) {
    const ledger = await this.read();
    const parent = ledger.proposals.find((candidate) => candidate.id === id);
    if (parent === void 0) throw new Error(`proposal "${id}" not found`);
    const proposal = {
      ...parent,
      id: `proposal-${Date.now().toString(36)}`,
      ...patch.prompt !== void 0 ? { prompt: patch.prompt } : {},
      ...patch.note !== void 0 ? { note: patch.note } : {},
      parentId: parent.id,
      status: "proposed",
      at: Date.now(),
      attempts: parent.attempts + 1,
      rejectReason: void 0,
      taskId: void 0
    };
    ledger.proposals.push(proposal);
    await this.write(ledger);
    return proposal;
  }
};

// src/canvas-intent.ts
import { mkdir as mkdir3, readFile as readFile4, writeFile as writeFile3 } from "node:fs/promises";
import { join as join5 } from "node:path";
var FILE = "canvas-intents.json";
var MAX = 100;
function formatDshCanvasPrompt(intent, extras = {}) {
  const source = intent.sourceId !== void 0 ? `${intent.sourceId}${extras.sourceLabel !== void 0 && extras.sourceLabel !== "" ? `\uFF08${extras.sourceLabel}\uFF09` : ""}` : "\uFF08\u65E0\uFF0C\u4ECE\u7A7A\u767D\u5F00\u65B0\u8282\u70B9\uFF09";
  return [
    "[DirectorX \u753B\u5E03\u6307\u4EE4]",
    "\u4E0B\u9762\u300C\u610F\u56FE\u300D\u53EA\u662F\u7528\u6237\u539F\u53E5\uFF0C\u4E0D\u662F\u751F\u6210\u63D0\u793A\u8BCD\u3002\u7981\u6B62\u62FF\u5B83\u76F4\u63A5 generate\u3002",
    "\u7528 directorx_canvas_intents { claim: true } \u9886\u53D6\u672C\u6761\u3002\u56FA\u5B9A\u987A\u5E8F\uFF1Aclaim \u2192 directorx_knowledge_search/read \u2192 directorx_skill_search/read\uFF08\u5FC5\u8981\u65F6\u5916\u90E8\u8C03\u7814\uFF09\u2192 directorx_prompt_craft\uFF08intent=\u539F\u53E5\uFF0Cprompt=\u6210\u7A3F\uFF09\u2192 directorx_generate_ready\uFF08\u8BBE\u5B9A\u56FE/\u573A\u666F/\u5173\u952E\u5E27/\u9996\u5C3E\u5E27/\u56FE\u751F\uFF0C\u7F3A\u53C2\u8003\u5148\u8865\uFF09\u2192 \u4E25\u683C/\u534F\u540C directorx_propose+confirm \u2192 \u5E26 craftId \u548C readyId \u518D directorx_canvas_continue / generate\u3002\u4E0D\u8981\u8BA9\u753B\u5E03 UI \u81EA\u5DF1\u5199 generating \u8282\u70B9\u3002\u56DE\u5199\u753B\u5E03\u53EA\u6539 path / shotStatus\uFF1B\u4E0D\u8981\u7528\u6587\u4EF6\u540D\u8986\u76D6\u955C\u5934\u6807\u9898\u3002",
    `- \u610F\u56FE id: ${intent.id}`,
    `- \u7C7B\u578B: ${intent.kind}`,
    `- \u610F\u56FE\uFF08\u672A\u6210\u7A3F\uFF09: ${intent.prompt}`,
    `- \u6E90\u8282\u70B9: ${source}`,
    intent.selectedIds.length > 0 ? `- \u5F53\u524D\u9009\u4E2D: ${intent.selectedIds.join(", ")}` : "",
    intent.model !== void 0 && intent.model !== "" ? `- \u6A21\u578B: ${intent.model}` : "",
    intent.aspect !== void 0 && intent.aspect !== "" ? `- \u753B\u5E45: ${intent.aspect}` : "",
    intent.count !== void 0 && intent.count > 1 ? `- \u6B21\u6570: ${intent.count}` : "",
    intent.durationSec !== void 0 ? `- \u65F6\u957F: ${intent.durationSec}s` : "",
    intent.refIds !== void 0 && intent.refIds.length > 0 ? `- \u53C2\u8003\u8282\u70B9: ${intent.refIds.join(", ")}` : "",
    intent.characters.length > 0 ? `- \u89D2\u8272\u951A\u70B9: ${intent.characters.join(", ")}\u3002\u751F\u6210\u5DE5\u5177\u5FC5\u987B\u4F20 characters \u53C2\u6570\uFF08directorx_character_list \u5DF2\u6CE8\u518C\uFF09\u3002` : "",
    "\u505A\u5B8C\u540E\u8C03\u7528 directorx_canvas_intent_ack\u3002"
  ].filter(Boolean).join("\n");
}
var CanvasIntentStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join5(resolveOutputDir(this.outputDir), FILE);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile4(this.filePath(), "utf8"));
      return {
        intents: Array.isArray(parsed.intents) ? parsed.intents.map((item) => ({
          ...item,
          characters: Array.isArray(item.characters) ? item.characters : [],
          selectedIds: Array.isArray(item.selectedIds) ? item.selectedIds : []
        })) : []
      };
    } catch {
      return { intents: [] };
    }
  }
  async write(ledger) {
    await mkdir3(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile3(this.filePath(), JSON.stringify(ledger, null, 2), "utf8");
    return ledger;
  }
  async enqueue(input) {
    const prompt = input.prompt.trim();
    if (prompt === "") throw new Error("prompt \u4E0D\u80FD\u4E3A\u7A7A");
    if (input.kind !== "image" && input.kind !== "video") throw new Error("kind \u5FC5\u987B\u662F image/video");
    const ledger = await this.read();
    const count = typeof input.count === "number" && Number.isFinite(input.count) ? Math.max(1, Math.min(4, Math.floor(input.count))) : void 0;
    const durationSec = typeof input.durationSec === "number" && Number.isFinite(input.durationSec) ? Math.max(1, Math.min(15, Math.floor(input.durationSec))) : void 0;
    const intent = {
      id: `intent-${Date.now().toString(36)}`,
      kind: input.kind,
      prompt: prompt.slice(0, 2e3),
      ...typeof input.sourceId === "string" && input.sourceId !== "" ? { sourceId: input.sourceId.slice(0, 100) } : {},
      selectedIds: (input.selectedIds ?? []).filter((id) => typeof id === "string" && id !== "").slice(0, 20),
      characters: (input.characters ?? []).filter((name2) => typeof name2 === "string" && name2.trim() !== "").map((name2) => name2.trim().slice(0, 80)).slice(0, 8),
      ...typeof input.model === "string" && input.model !== "" ? { model: input.model.slice(0, 80) } : {},
      ...typeof input.aspect === "string" && input.aspect !== "" ? { aspect: input.aspect.slice(0, 16) } : {},
      ...count !== void 0 ? { count } : {},
      ...durationSec !== void 0 ? { durationSec } : {},
      ...Array.isArray(input.refIds) ? { refIds: input.refIds.filter((id) => typeof id === "string" && id !== "").slice(0, 8) } : {},
      status: "pending",
      at: Date.now()
    };
    ledger.intents.push(intent);
    if (ledger.intents.length > MAX) ledger.intents.splice(0, ledger.intents.length - MAX);
    await this.write(ledger);
    return intent;
  }
  async list(status) {
    const ledger = await this.read();
    const filtered = status === void 0 ? ledger.intents : ledger.intents.filter((item) => item.status === status);
    return filtered.slice().reverse();
  }
  /**
   * Claim the oldest pending intent. Two DSH turns cannot take the same
   * directive: the first call marks it taken, the next call gets the next one.
   */
  async takeNext() {
    const ledger = await this.read();
    const pending = ledger.intents.filter((item) => item.status === "pending").slice().sort((a, b) => a.at - b.at);
    const intent = pending[0];
    if (intent === void 0) return null;
    intent.status = "taken";
    intent.takenAt = Date.now();
    await this.write(ledger);
    return intent;
  }
  async ack(id, status) {
    const ledger = await this.read();
    const intent = ledger.intents.find((item) => item.id === id);
    if (intent === void 0) throw new Error(`canvas intent "${id}" not found`);
    const allowed = TRANSITIONS[intent.status];
    if (!allowed.includes(status)) {
      throw new Error(`canvas intent "${id}" cannot move ${intent.status} \u2192 ${status}`);
    }
    intent.status = status;
    if (status === "taken") intent.takenAt = Date.now();
    await this.write(ledger);
    return intent;
  }
};
var TRANSITIONS = {
  pending: ["taken", "done", "cancelled"],
  taken: ["done", "cancelled"],
  done: [],
  cancelled: []
};

// src/characters.ts
import { mkdir as mkdir4, readFile as readFile5, writeFile as writeFile4 } from "node:fs/promises";
import { join as join6 } from "node:path";
var MAX_CHARACTERS = 100;
var CharacterStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join6(resolveOutputDir(this.outputDir), "characters.json");
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile5(this.filePath(), "utf8"));
      return { characters: Array.isArray(parsed.characters) ? parsed.characters : [] };
    } catch {
      return { characters: [] };
    }
  }
  async register(input) {
    const name2 = input.name.trim().slice(0, 100);
    if (name2 === "") throw new Error("character name is required");
    if (input.refPath.trim() === "") throw new Error("refPath is required (local media path or http(s) URL)");
    const ledger = await this.read();
    const existing = ledger.characters.findIndex((card2) => card2.name === name2);
    const card = {
      name: name2,
      description: (input.description ?? "").slice(0, 1e3),
      refPath: input.refPath,
      ...input.outfit !== void 0 && input.outfit !== "" ? { outfit: input.outfit.slice(0, 300) } : {},
      ...input.props !== void 0 && input.props !== "" ? { props: input.props.slice(0, 300) } : {},
      at: Date.now()
    };
    if (existing >= 0) ledger.characters[existing] = card;
    else {
      ledger.characters.push(card);
      if (ledger.characters.length > MAX_CHARACTERS) ledger.characters.shift();
    }
    await mkdir4(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile4(this.filePath(), JSON.stringify(ledger, null, 2), "utf8");
    return card;
  }
  async list() {
    const ledger = await this.read();
    return ledger.characters.slice().reverse();
  }
  async remove(name2) {
    const trimmed = name2.trim();
    const ledger = await this.read();
    const next = ledger.characters.filter((card) => card.name !== trimmed);
    if (next.length === ledger.characters.length) throw new Error(`character "${trimmed}" not found`);
    ledger.characters = next;
    await mkdir4(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile4(this.filePath(), JSON.stringify(ledger, null, 2), "utf8");
  }
  async get(names) {
    const ledger = await this.read();
    return names.map((name2) => ledger.characters.find((card) => card.name === name2)).filter((card) => card !== void 0);
  }
};

// src/edits.ts
import { appendFile, mkdir as mkdir5, readFile as readFile6 } from "node:fs/promises";
import { join as join7 } from "node:path";
var EDITS_FILE = "edits.jsonl";
var MAX_EDIT_LINES = 2e4;
var DirectorxEditLedger = class {
  outputDir;
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  async filePath() {
    const dir = resolveOutputDir(this.outputDir);
    await mkdir5(dir, { recursive: true });
    return join7(dir, EDITS_FILE);
  }
  async append(record) {
    const path = await this.filePath();
    await appendFile(path, `${JSON.stringify(record)}
`, "utf8");
  }
  /** Most recent edits first, bounded to `limit`. */
  async list(limit = 20) {
    const path = await this.filePath();
    const content = await readFile6(path, "utf8").catch((error) => {
      if (error.code === "ENOENT") return "";
      throw error;
    });
    const records = [];
    for (const line of content.split("\n").slice(-MAX_EDIT_LINES)) {
      const trimmed = line.trim();
      if (trimmed === "") continue;
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed.path === "string" && parsed.path !== "") records.push(parsed);
      } catch {
      }
    }
    return records.reverse().slice(0, Math.min(50, Math.max(1, limit)));
  }
};

// src/tasks.ts
import { appendFile as appendFile2, mkdir as mkdir6, readFile as readFile7 } from "node:fs/promises";
import { join as join8 } from "node:path";
var LEDGER_FILE = "tasks.jsonl";
var MAX_LEDGER_LINES = 2e4;
var DirectorxTaskLedger = class {
  outputDir;
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  async filePath() {
    const dir = resolveOutputDir(this.outputDir);
    await mkdir6(dir, { recursive: true });
    return join8(dir, LEDGER_FILE);
  }
  async append(record) {
    if (record.taskId === "") return;
    const path = await this.filePath();
    await appendFile2(path, `${JSON.stringify(record)}
`, "utf8");
  }
  /** All transitions of every task, in append order. */
  async list() {
    const path = await this.filePath();
    const content = await readFile7(path, "utf8").catch((error) => {
      if (error.code === "ENOENT") return "";
      throw error;
    });
    const records = [];
    for (const line of content.split("\n").slice(-MAX_LEDGER_LINES)) {
      const trimmed = line.trim();
      if (trimmed === "") continue;
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed.taskId === "string" && parsed.taskId !== "") records.push(parsed);
      } catch {
      }
    }
    return records;
  }
  /** All transitions of one task in append order. */
  async fold(taskId) {
    return (await this.list()).filter((record) => record.taskId === taskId);
  }
  /** The task's latest transition, or `undefined` for an unknown id. */
  async latest(taskId) {
    const records = await this.fold(taskId);
    return records.at(-1);
  }
  /** Whether the ledger carries a `cancelled` transition for this task. */
  async isCancelled(taskId) {
    const latest = await this.latest(taskId);
    return latest?.state === "cancelled";
  }
  /**
   * Record a cancel intent. Idempotent for finished tasks: appending a
   * `cancelled` transition over a `succeeded`/`cancelled` task is a no-op. A
   * locally `failed` task may still be running at the provider (orphan), so it
   * accepts the cancel transition; an in-flight task flips to cancelled and
   * the matching poll loop aborts on its next ledger check.
   */
  async cancel(taskId, reason = "cancel requested") {
    const latest = await this.latest(taskId);
    const terminal = latest !== void 0 && (latest.state === "succeeded" || latest.state === "cancelled");
    if (terminal) return latest;
    const record = {
      taskId,
      model: latest?.model ?? "",
      mode: latest?.mode ?? "",
      prompt: latest?.prompt ?? "",
      state: "cancelled",
      at: Date.now(),
      reason
    };
    await this.append(record);
    return record;
  }
};

// src/canvas.ts
import { mkdir as mkdir7, readFile as readFile8, writeFile as writeFile5 } from "node:fs/promises";
import { join as join9 } from "node:path";

// src/card-label.ts
var PLACEHOLDERS = /* @__PURE__ */ new Set(["", "\u56FE\u7247", "\u89C6\u9891", "\u672A\u547D\u540D", "\u6587\u672C", "Image", "Video", "Untitled"]);
var FILE_EXT = /\.(png|jpe?g|webp|gif|mp4|webm|mov|mkv)$/i;
var DATE_STAMP = /-\d{4}-\d{2}(-\d{2})?(t\d{2}-\d{2}-\d{2}z?)?$/i;
var KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+){3,}$/i;
function stemOf(text) {
  return text.replace(FILE_EXT, "");
}
function humanizeSlug(label) {
  const stem = stemOf((label ?? "").trim());
  const cut = stem.replace(DATE_STAMP, "").replace(/[_]+/g, "-");
  const words = cut.split("-").filter((part) => part !== "" && !/^\d+$/.test(part));
  if (words.length < 2) return "";
  return words.join(" ").slice(0, 42);
}
function isAssetSlug(label) {
  const text = (label ?? "").trim();
  if (PLACEHOLDERS.has(text)) return true;
  const stem = stemOf(text);
  if (DATE_STAMP.test(stem)) return true;
  if (KEBAB.test(stem) && !/[\u4e00-\u9fff]/.test(stem)) return true;
  if (stem !== text && !/[\u4e00-\u9fff]/.test(stem)) return true;
  return false;
}
function displayCardTitle(label, prompt, shotIndex) {
  const raw = (label ?? "").trim();
  const stem = stemOf(raw);
  if (!isAssetSlug(raw) && stem !== "") return stem;
  const fromPrompt = (prompt ?? "").trim().split(/[\n。！？.!?]/)[0]?.trim() ?? "";
  if (fromPrompt !== "") return fromPrompt.slice(0, 36);
  if (shotIndex !== void 0) return `\u955C\u5934 ${String(shotIndex).padStart(2, "0")}`;
  return humanizeSlug(raw);
}
function nextCardLabel(current, incoming) {
  if (incoming === void 0 || incoming.trim() === "") return current;
  if (!isAssetSlug(current) && isAssetSlug(incoming)) return current;
  return incoming;
}
function resolveStoredLabel(current, incoming, prompt, shotIndex) {
  const kept = nextCardLabel(current, incoming);
  const shown = displayCardTitle(kept, prompt, shotIndex);
  if (shown !== "") return shown;
  const fallback = (kept ?? incoming ?? current ?? "").trim();
  return isAssetSlug(fallback) ? "" : fallback;
}

// src/canvas-generate.ts
var PLACEHOLDER_WIDTH = 220;
var PLACEHOLDER_HEIGHT = 188;
var DOWNSTREAM_GAP = 80;
function inferContinueKind(sourceKind) {
  return sourceKind === "image" || sourceKind === "video" ? "video" : "image";
}
function planContinueGenerate(input) {
  const prompt = input.prompt.trim();
  if (prompt === "") throw new Error("prompt \u4E0D\u80FD\u4E3A\u7A7A");
  const kind = input.kind ?? inferContinueKind(input.source?.kind);
  const x = input.source !== void 0 ? input.source.x + (input.source.width ?? PLACEHOLDER_WIDTH) + DOWNSTREAM_GAP : 80;
  const y = input.source !== void 0 ? input.source.y : 80;
  return {
    node: {
      kind,
      label: prompt.slice(0, 48),
      prompt,
      shotStatus: "generating",
      x,
      y,
      width: PLACEHOLDER_WIDTH,
      height: PLACEHOLDER_HEIGHT
    },
    ...input.source !== void 0 ? { edgeFrom: input.source.id } : {},
    proposal: {
      kind,
      prompt,
      count: 1,
      ...input.source !== void 0 ? { note: `from:${input.source.id}` } : {}
    }
  };
}

// src/canvas.ts
var CANVAS_FILE = "canvas.json";
function emptyDocument() {
  return { version: 1, updatedAt: 0, nodes: [], edges: [] };
}
function newId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
var SHOT_CARD_W = 280;
var SHOT_CARD_H = 158;
var SHOT_GAP = 20;
var ACT_GAP = 48;
var GROUP_PAD_X = 36;
var GROUP_PAD_Y = 56;
function nextOpenSlot(nodes) {
  const top = nodes.filter((node) => node.parent === void 0);
  if (top.length === 0) return { x: 48, y: 48 };
  const right = Math.max(...top.map((node) => node.x + (node.width ?? SHOT_CARD_W)));
  const topY = Math.min(...top.map((node) => node.y));
  if (right > 48 + 4 * (SHOT_CARD_W + SHOT_GAP)) {
    const bottom = Math.max(...top.map((node) => node.y + (node.height ?? SHOT_CARD_H)));
    return { x: 48, y: bottom + SHOT_GAP };
  }
  return { x: right + SHOT_GAP, y: topY };
}
function layoutStoryboard(nodes) {
  const groups = nodes.filter((node) => node.kind === "group" && node.parent === void 0);
  const loose = nodes.filter((node) => node.kind !== "group" && node.parent === void 0);
  if (groups.length === 0) {
    loose.forEach((node, index) => {
      node.x = 48 + index % 4 * (SHOT_CARD_W + SHOT_GAP);
      node.y = 48 + Math.floor(index / 4) * (SHOT_CARD_H + 36);
      node.width = node.width ?? SHOT_CARD_W;
      node.height = node.height ?? (node.kind === "text" ? 120 : SHOT_CARD_H);
    });
    return;
  }
  let cursorY = 48;
  for (const group of groups) {
    const members = nodes.filter((node) => node.parent === group.id).sort((left, right) => (left.shotIndex ?? 1e9) - (right.shotIndex ?? 1e9));
    const count = Math.max(1, members.length);
    group.x = 48;
    group.y = cursorY;
    group.width = GROUP_PAD_X * 2 + count * SHOT_CARD_W + (count - 1) * SHOT_GAP;
    group.height = GROUP_PAD_Y + SHOT_CARD_H + 32;
    members.forEach((member, index) => {
      member.x = group.x + GROUP_PAD_X + index * (SHOT_CARD_W + SHOT_GAP);
      member.y = group.y + GROUP_PAD_Y;
      member.width = SHOT_CARD_W;
      member.height = member.kind === "text" ? 120 : SHOT_CARD_H;
    });
    cursorY += group.height + ACT_GAP;
  }
  loose.forEach((node, index) => {
    node.x = 48 + index % 4 * (SHOT_CARD_W + SHOT_GAP);
    node.y = cursorY + Math.floor(index / 4) * (SHOT_CARD_H + 36);
    node.width = node.width ?? SHOT_CARD_W;
    node.height = node.height ?? (node.kind === "text" ? 120 : SHOT_CARD_H);
  });
}
function sanitizeNode(input) {
  const kind = input.kind === "image" || input.kind === "video" || input.kind === "text" || input.kind === "group" ? input.kind : "text";
  const numberOr = (value, fallback) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const rawParent = input.parent;
  const prompt = typeof input.prompt === "string" && input.prompt !== "" ? input.prompt.slice(0, 2e3) : void 0;
  const shotIndex = typeof input.shotIndex === "number" && Number.isFinite(input.shotIndex) ? Math.floor(input.shotIndex) : void 0;
  const node = {
    id: typeof input.id === "string" && input.id !== "" ? input.id : newId(kind),
    kind,
    label: resolveStoredLabel(void 0, typeof input.label === "string" ? input.label.slice(0, 200) : "", prompt, shotIndex).slice(0, 200),
    ...typeof input.path === "string" && input.path !== "" ? { path: input.path.slice(0, 1e3) } : {},
    ...typeof rawParent === "string" && rawParent !== "" ? { parent: rawParent.slice(0, 100) } : {},
    x: numberOr(input.x, 0),
    y: numberOr(input.y, 0),
    ...input.width !== void 0 ? { width: Math.max(60, Math.min(kind === "group" ? 3200 : 1600, numberOr(input.width, 240))) } : {},
    ...input.height !== void 0 ? { height: Math.max(60, Math.min(kind === "group" ? 2400 : 1200, numberOr(input.height, 160))) } : {},
    ...shotIndex !== void 0 ? { shotIndex } : {},
    ...prompt !== void 0 ? { prompt } : {},
    ...input.locked === true ? { locked: true } : {},
    ...typeof input.aiBrief === "string" && input.aiBrief !== "" ? { aiBrief: input.aiBrief.slice(0, 500) } : {},
    ...typeof input.shotStatus === "string" && ["idea", "approved", "generating", "review", "locked", "failed"].includes(input.shotStatus) ? { shotStatus: input.shotStatus } : {},
    ...typeof input.selectedTakeId === "string" && input.selectedTakeId !== "" ? { selectedTakeId: input.selectedTakeId.slice(0, 100) } : {},
    ...typeof input.aspect === "string" && input.aspect !== "" ? { aspect: input.aspect.slice(0, 16) } : {},
    ...typeof input.model === "string" && input.model !== "" ? { model: input.model.slice(0, 80) } : {},
    ...typeof input.durationSec === "number" && Number.isFinite(input.durationSec) ? { durationSec: Math.max(1, Math.min(15, Math.floor(input.durationSec))) } : {},
    ...typeof input.lastError === "string" && input.lastError !== "" ? { lastError: input.lastError.slice(0, 300) } : {},
    ...typeof input.count === "number" && Number.isFinite(input.count) ? { count: Math.max(1, Math.min(4, Math.floor(input.count))) } : {},
    ...Array.isArray(input.characters) ? { characters: input.characters.filter((name2) => typeof name2 === "string" && name2.trim() !== "").map((name2) => name2.trim().slice(0, 80)).slice(0, 8) } : {},
    ...Array.isArray(input.continuityRules) ? { continuityRules: input.continuityRules.filter((rule) => typeof rule === "string" && rule !== "").slice(0, 5).map((rule) => rule.slice(0, 200)) } : {}
  };
  return node;
}
function validateParents(doc) {
  const byId = new Map(doc.nodes.map((node) => [node.id, node]));
  for (const node of doc.nodes) {
    if (node.parent === void 0) continue;
    const parent = byId.get(node.parent);
    if (parent === void 0 || parent.kind !== "group" || parent.id === node.id) {
      delete node.parent;
    }
  }
}
function sanitizeEdge(input) {
  return {
    id: typeof input.id === "string" && input.id !== "" ? input.id : newId("edge"),
    from: typeof input.from === "string" ? input.from : "",
    to: typeof input.to === "string" ? input.to : "",
    ...typeof input.label === "string" && input.label !== "" ? { label: input.label.slice(0, 200) } : {},
    ...typeof input.sourceHandle === "string" && input.sourceHandle !== "" ? { sourceHandle: input.sourceHandle.slice(0, 16) } : {},
    ...typeof input.targetHandle === "string" && input.targetHandle !== "" ? { targetHandle: input.targetHandle.slice(0, 16) } : {},
    ...typeof input.sourceVariantIdx === "number" && Number.isFinite(input.sourceVariantIdx) && input.sourceVariantIdx >= 0 ? { sourceVariantIdx: Math.floor(input.sourceVariantIdx) } : {}
  };
}
var DirectorxCanvasStore = class {
  outputDir;
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join9(resolveOutputDir(this.outputDir), CANVAS_FILE);
  }
  async read() {
    const path = this.filePath();
    const raw = await readFile8(path, "utf8").catch((error) => {
      if (error.code === "ENOENT") return "";
      throw error;
    });
    if (raw === "") return emptyDocument();
    try {
      const parsed = JSON.parse(raw);
      const migrated = {
        version: 1,
        updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
        ...typeof parsed.title === "string" && parsed.title !== "" ? { title: parsed.title.slice(0, 200) } : {},
        nodes: Array.isArray(parsed.nodes) ? parsed.nodes.map((item) => sanitizeNode(item)) : [],
        edges: Array.isArray(parsed.edges) ? parsed.edges.map((item) => sanitizeEdge(item)) : []
      };
      validateParents(migrated);
      return migrated;
    } catch {
      return emptyDocument();
    }
  }
  /** Clear the canvas, keeping a timestamped backup of the previous doc. */
  async reset() {
    const path = this.filePath();
    try {
      const existing = await readFile8(path, "utf8");
      if (existing.trim() !== "") {
        const backup = join9(resolveOutputDir(this.outputDir), `canvas.json.bak-${Date.now()}`);
        await writeFile5(backup, existing, "utf8");
      }
    } catch {
    }
    return this.write({ version: 1, updatedAt: 0, nodes: [], edges: [] });
  }
  /**
   * Persist a full document. When `expectedUpdatedAt` is provided and does not
   * match the stored revision, the write is refused with a conflict error so
   * the caller can re-read and merge.
   */
  async write(doc, expectedUpdatedAt) {
    const dir = join9(resolveOutputDir(this.outputDir));
    await mkdir7(dir, { recursive: true });
    const path = this.filePath();
    if (expectedUpdatedAt !== void 0) {
      const current = await this.read();
      if (current.updatedAt !== expectedUpdatedAt) {
        throw Object.assign(new Error("canvas document changed since read; re-read and merge before saving"), { code: "CANVAS_CONFLICT" });
      }
    }
    const saved = {
      version: 1,
      updatedAt: Date.now(),
      ...typeof doc.title === "string" && doc.title !== "" ? { title: doc.title.slice(0, 200) } : {},
      nodes: doc.nodes.map((node) => sanitizeNode(node)),
      edges: doc.edges.map((edge) => sanitizeEdge(edge))
    };
    validateParents(saved);
    await writeFile5(path, JSON.stringify(saved), "utf8");
    return saved;
  }
  /** Apply one mutation transactionally: read → mutate → write (with conflict retry off). */
  async mutate(mutator) {
    const current = await this.read();
    mutator(current);
    return this.write(current, current.updatedAt);
  }
  /**
   * Continue-generate: drop a generating placeholder (and an inbound
   * wire when a source exists) using the same planner as the WebUI sheet.
   */
  async continueGenerate(input) {
    const current = await this.read();
    const source = input.sourceId !== void 0 ? current.nodes.find((node) => node.id === input.sourceId) : void 0;
    if (input.sourceId !== void 0 && source === void 0) throw new Error(`canvas node "${input.sourceId}" not found`);
    const plan = planContinueGenerate({
      ...source !== void 0 ? { source: { id: source.id, x: source.x, y: source.y, width: source.width, kind: source.kind } } : {},
      ...input.kind !== void 0 ? { kind: input.kind } : {},
      prompt: input.prompt
    });
    let nodeId = "";
    const doc = await this.mutate((draft) => {
      const node = sanitizeNode({ id: newId(plan.node.kind), ...plan.node });
      nodeId = node.id;
      draft.nodes.push(node);
      if (plan.edgeFrom !== void 0) {
        const edge = sanitizeEdge({ id: newId("edge"), from: plan.edgeFrom, to: node.id });
        this.validateEdgeForDoc(draft, edge);
        draft.edges.push(edge);
      }
    });
    return {
      doc,
      nodeId,
      proposal: {
        ...plan.proposal,
        canvasNodeId: nodeId
      }
    };
  }
  async addNode(input) {
    return this.mutate((doc) => {
      const node = sanitizeNode(input);
      if (input.x === void 0 && input.y === void 0 && node.parent === void 0) {
        const slot = nextOpenSlot(doc.nodes);
        node.x = slot.x;
        node.y = slot.y;
      }
      if (!doc.nodes.some((existing) => existing.id === node.id)) doc.nodes.push(node);
    });
  }
  async addEdge(input) {
    return this.mutate((doc) => {
      const edge = sanitizeEdge(input);
      const fromExists = doc.nodes.some((node) => node.id === edge.from);
      const toExists = doc.nodes.some((node) => node.id === edge.to);
      if (!fromExists || !toExists) {
        throw new Error(`canvas edge endpoints must reference existing nodes (${edge.from} -> ${edge.to})`);
      }
      this.validateEdgeForDoc(doc, edge);
      if (!doc.edges.some((existing) => existing.id === edge.id)) doc.edges.push(edge);
    });
  }
  /** 连线校验（端点存在/类型矩阵/锁定）——addEdge 与 batchAdd 共用。 */
  validateEdgeForDoc(doc, edge) {
    const fromExists = doc.nodes.some((node) => node.id === edge.from);
    const toExists = doc.nodes.some((node) => node.id === edge.to);
    if (!fromExists || !toExists) {
      throw new Error(`canvas edge endpoints must reference existing nodes (${edge.from} -> ${edge.to})`);
    }
    const fromNode = doc.nodes.find((node) => node.id === edge.from);
    const toNode = doc.nodes.find((node) => node.id === edge.to);
    const fromKind = fromNode?.kind;
    const toKind = toNode?.kind;
    if (toNode?.locked === true) {
      throw new Error(`edge reason: \u76EE\u6807\u8282\u70B9 ${edge.to} \u5DF2\u9501\u5B9A\uFF08\u5B9A\u5986\u7528\u9014\uFF09\uFF0C\u62D2\u7EDD\u65B0\u5165\u8FB9\uFF1B\u89E3\u9501 = update \u8BE5\u8282\u70B9 patch {locked: false}`);
    }
    if (fromKind !== void 0 && toKind !== void 0) {
      if (toKind === "text" || toKind === "group") throw new Error(`edge reason: \u76EE\u6807\u8282\u70B9\u662F ${toKind}\uFF0C\u4E0D\u80FD\u4F5C\u4E3A\u8F93\u5165\u4F9D\u8D56\uFF08\u8FDE\u7EBF\u53EA\u80FD\u6307\u5411 image/video\uFF09`);
      if (fromKind === "video" && toKind === "image") throw new Error("edge reason: video \u4E0D\u80FD\u5582\u7ED9 image\uFF08\u89C6\u9891\u53EA\u80FD\u63A5\u529B\u5230 video\uFF09");
      if (fromKind === "group") throw new Error("edge reason: group \u53EA\u4F5C\u5BB9\u5668\uFF0C\u4E0D\u80FD\u4F5C\u4E3A\u8FDE\u7EBF\u6E90");
    }
  }
  canConnect(from, to) {
    if (to.locked === true) return false;
    if (to.kind === "text" || to.kind === "group") return false;
    if (from.kind === "group") return false;
    if (from.kind === "video" && to.kind === "image") return false;
    return to.kind === "image" || to.kind === "video";
  }
  async update(id, patch) {
    return this.mutate((doc) => {
      const nodeIndex = doc.nodes.findIndex((node) => node.id === id);
      if (nodeIndex >= 0) {
        const lockedNode = doc.nodes[nodeIndex];
        if (lockedNode.locked === true) {
          const contentKeys = ["prompt", "label", "path", "kind", "parent", "shotIndex"];
          const changingContent = contentKeys.some((key) => Object.prototype.hasOwnProperty.call(patch, key));
          const onlyPosition = Object.keys(patch).every((key) => key === "x" || key === "y" || key === "width" || key === "height");
          if (changingContent && !onlyPosition) {
            throw new Error(`\u8282\u70B9 ${id} \u5DF2\u9501\u5B9A\uFF08\u5B9A\u5986\u7528\u9014\uFF09\uFF1A\u62D2\u6539\u63D0\u793A\u8BCD/\u5185\u5BB9/\u5206\u7EC4\uFF1B\u89E3\u9501 = \u5148 update \u8BE5\u8282\u70B9 patch {locked: false}\u3002\u4F4D\u7F6E\u8C03\u6574\u653E\u884C\u3002`);
          }
        }
        const existing = doc.nodes[nodeIndex];
        if (typeof patch.label === "string") {
          patch.label = resolveStoredLabel(
            existing.label,
            patch.label,
            typeof patch.prompt === "string" ? patch.prompt : existing.prompt,
            typeof patch.shotIndex === "number" ? patch.shotIndex : existing.shotIndex
          );
        }
        const merged = { ...existing, ...patch, id };
        if (patch.parent === null) delete merged.parent;
        doc.nodes[nodeIndex] = sanitizeNode(merged);
        return;
      }
      const edgeIndex = doc.edges.findIndex((edge) => edge.id === id);
      if (edgeIndex >= 0) {
        doc.edges[edgeIndex] = sanitizeEdge({ ...doc.edges[edgeIndex], ...patch, id });
        return;
      }
      throw new Error(`canvas element "${id}" not found`);
    });
  }
  async remove(id) {
    return this.mutate((doc) => {
      const target = doc.nodes.find((node) => node.id === id);
      if (target?.locked === true) {
        throw new Error(`\u8282\u70B9 ${id} \u5DF2\u9501\u5B9A\uFF08\u5B9A\u5986\u7528\u9014\uFF09\uFF1A\u62D2\u7EDD\u5220\u9664\uFF1B\u89E3\u9501 = \u5148 update \u8BE5\u8282\u70B9 patch {locked: false}`);
      }
      const hadNode = doc.nodes.some((node) => node.id === id);
      const hadEdge = doc.edges.some((edge) => edge.id === id);
      if (!hadNode && !hadEdge) throw new Error(`canvas element "${id}" not found`);
      doc.nodes = doc.nodes.filter((node) => node.id !== id);
      doc.edges = doc.edges.filter((edge) => edge.id !== id && edge.from !== id && edge.to !== id);
    });
  }
  /** Search nodes by label substring / kind / group membership. */
  async search(query) {
    const doc = await this.read();
    const label = (query.label ?? "").trim().toLowerCase();
    return doc.nodes.filter((node) => {
      if (label !== "" && !node.label.toLowerCase().includes(label)) return false;
      if (query.kind !== void 0 && node.kind !== query.kind) return false;
      if (query.parent !== void 0 && node.parent !== query.parent) return false;
      return true;
    });
  }
  /** Batch add nodes (and optional edges) in one write. */
  async batchAdd(input) {
    return this.mutate((doc) => {
      for (const raw of input.nodes ?? []) {
        const node = sanitizeNode({ id: newId("text"), ...raw });
        if (raw.x === void 0 && raw.y === void 0 && node.parent === void 0) {
          const slot = nextOpenSlot(doc.nodes);
          node.x = slot.x;
          node.y = slot.y;
        }
        doc.nodes.push(node);
      }
      for (const edge of input.edges ?? []) {
        const candidate = sanitizeEdge({ id: newId("edge"), ...edge });
        this.validateEdgeForDoc(doc, candidate);
        doc.edges.push(candidate);
      }
    });
  }
  /** Dissolve a group: children become top-level (absolute coords), group and its edges removed. */
  async dissolveGroup(groupId) {
    return this.mutate((doc) => {
      const group = doc.nodes.find((node) => node.id === groupId && node.kind === "group");
      if (group === void 0) throw new Error(`group "${groupId}" not found`);
      for (const node of doc.nodes) {
        if (node.parent === groupId) delete node.parent;
      }
      doc.nodes = doc.nodes.filter((node) => node.id !== groupId);
      doc.edges = doc.edges.filter((edge) => edge.from !== groupId && edge.to !== groupId);
    });
  }
  /**
   * Branch a node into labelled variants (multi-version comparison): clones
   * the source node N times, labels each with its variation tag, and places
   * them in a new「名称 分支探索」group. Edges pointing at the source are
   * re-pointed to a hub note... (kept simple: edges to the source stay;
   * callers decide which variant wins later).
   */
  async branch(sourceId, variations) {
    return this.mutate((doc) => {
      const source = doc.nodes.find((node) => node.id === sourceId);
      if (source === void 0) throw new Error(`canvas node "${sourceId}" not found`);
      const groupId = newId("group");
      const originX = source.x;
      const originY = source.y;
      doc.nodes.push({
        id: groupId,
        kind: "group",
        label: `${source.label.slice(0, 24)} \u5206\u652F\u63A2\u7D22`,
        x: originX,
        y: originY,
        width: 620,
        height: Math.max(240, variations.length * 190 + 60)
      });
      variations.forEach((variation, index) => {
        doc.nodes.push({
          id: newId(source.kind),
          kind: source.kind,
          label: `${source.label}\uFF5C\u53D8\u4F53${index + 1} ${variation}`.slice(0, 200),
          ...source.path !== void 0 ? { path: source.path } : {},
          parent: groupId,
          x: originX + 56,
          y: originY + 56 + index * 190,
          ...source.width !== void 0 ? { width: source.width } : {}
        });
      });
    });
  }
  /**
   * 确定性排片：按显式 shotIndex（存储身份）排序镜头节点；
   * 未标 shotIndex 的按创建序（id 时间序）排后。
   */
  async shotSequence(parentGroupId) {
    const doc = await this.read();
    const shots = doc.nodes.filter((node) => (node.kind === "image" || node.kind === "video") && (parentGroupId === void 0 ? node.parent === void 0 : node.parent === parentGroupId)).map((node) => ({ id: node.id, label: node.label, shotIndex: node.shotIndex ?? null }));
    shots.sort((a, b) => {
      if (a.shotIndex !== null && b.shotIndex !== null) return a.shotIndex - b.shotIndex;
      if (a.shotIndex !== null) return -1;
      if (b.shotIndex !== null) return 1;
      return 0;
    });
    return shots;
  }
  /**
   * 自动合成 prompt 上下文：沿入边回溯上游节点（最多两层），按
   * prompt-first 规则拼出分块提示上下文——主体 / 参考图（ref_image_N
   * 槽位）/ 方向 / 标题。LLM 合成步骤由 agent 在此基础上完成。
   */
  async promptFor(targetId) {
    const doc = await this.read();
    const target = doc.nodes.find((node) => node.id === targetId);
    if (target === void 0) throw new Error(`canvas node "${targetId}" not found`);
    const upstreamIds = new Set(doc.edges.filter((edge) => edge.to === targetId).map((edge) => edge.from));
    const subjects = [];
    const references = [];
    const directions = [];
    let refN = 1;
    for (const id of upstreamIds) {
      const node = doc.nodes.find((candidate) => candidate.id === id);
      if (node === void 0) continue;
      if (node.kind === "text") {
        if (node.prompt !== void 0 && node.prompt !== "") directions.push(node.prompt);
        else if (node.label !== "") directions.push(node.label);
        continue;
      }
      if (node.kind === "image" || node.kind === "video") {
        const hasMedia = node.path !== void 0 && node.path !== "";
        const grandparents = doc.edges.filter((edge) => edge.to === id).map((edge) => edge.from);
        for (const grandId of grandparents) {
          const grand = doc.nodes.find((candidate) => candidate.id === grandId);
          if (grand !== void 0 && grand.kind === "text") {
            subjects.push({ id: grand.id, label: grand.label, ...grand.prompt !== void 0 ? { prompt: grand.prompt } : {} });
          }
        }
        references.push({ n: refN, id, path: hasMedia ? node.path : null, label: node.label });
        refN += 1;
      }
    }
    return {
      targetId,
      ownPrompt: target.prompt ?? null,
      blocks: { subjects, references, directions, title: target.label !== "" ? target.label : null }
    };
  }
  /** 画布快照：提案执行前的可回滚检查点（撤销此批）。 */
  snapshotsPath() {
    return join9(resolveOutputDir(this.outputDir), ".canvas-snapshots");
  }
  snapshotsFile() {
    return join9(this.snapshotsPath(), "index.json");
  }
  async snapshot(label) {
    const doc = await this.read();
    const id = `snap-${Date.now().toString(36)}`;
    const index = await this.readSnapshotsIndex();
    index.unshift({ id, at: Date.now(), label: label.slice(0, 100) });
    while (index.length > 20) index.pop();
    await mkdir7(this.snapshotsPath(), { recursive: true });
    await writeFile5(this.snapshotsFile(), JSON.stringify(index, null, 2), "utf8");
    await writeFile5(join9(this.snapshotsPath(), `${id}.json`), JSON.stringify(doc, null, 2), "utf8");
    return index[0];
  }
  async readSnapshotsIndex() {
    try {
      const parsed = JSON.parse(await readFile8(this.snapshotsFile(), "utf8"));
      return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
    } catch {
      return [];
    }
  }
  async restoreSnapshot(id) {
    const raw = await readFile8(join9(this.snapshotsPath(), `${id}.json`), "utf8");
    const parsed = JSON.parse(raw);
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes.map((input) => sanitizeNode(input)) : [];
    const edges = Array.isArray(parsed.edges) ? parsed.edges.map((input) => sanitizeEdge(input)) : [];
    return this.write({ version: 1, updatedAt: Date.now(), ...typeof parsed.title === "string" ? { title: parsed.title } : {}, nodes, edges });
  }
  /**
   * 连续性规则注册表：汇总全部 Shot 组的 continuityRules；跨镜头重复
   * 出现的规则即「连续性锁」（报告 16.4：角色/服装/道具/光线/方位）。
   */
  async continuity() {
    const doc = await this.read();
    const shots = doc.nodes.filter((node) => node.kind === "group" && Array.isArray(node.continuityRules) && node.continuityRules.length > 0).map((node) => ({ id: node.id, label: node.label, rules: node.continuityRules ?? [] }));
    const counts = /* @__PURE__ */ new Map();
    for (const shot of shots) {
      for (const rule of shot.rules) counts.set(rule, (counts.get(rule) ?? 0) + 1);
    }
    const locks = [...counts.entries()].filter(([, count]) => count >= 2).map(([rule, shotCount]) => ({ rule, shotCount }));
    return { shots, locks };
  }
  /**
   * Take 归档查询：Shot 组内媒体成员即 Takes（确定性排序：shotIndex
   * 优先，同值按 id）。返回选定 Take 与全体候选，供 agent 打分/对比/
   * 钉选使用。
   */
  async takes(groupId) {
    const doc = await this.read();
    const group = doc.nodes.find((node) => node.id === groupId);
    if (group === void 0 || group.kind !== "group") throw new Error(`canvas shot group "${groupId}" not found`);
    const members = doc.nodes.filter((node) => node.parent === groupId && (node.kind === "image" || node.kind === "video")).map((node) => ({ id: node.id, label: node.label, path: node.path ?? null, shotIndex: node.shotIndex ?? null })).sort((a, b) => {
      if (a.shotIndex !== null && b.shotIndex !== null && a.shotIndex !== b.shotIndex) return a.shotIndex - b.shotIndex;
      if (a.shotIndex !== null) return -1;
      if (b.shotIndex !== null) return 1;
      return a.id < b.id ? -1 : 1;
    });
    return { groupId, shotStatus: group.shotStatus ?? null, selectedTakeId: group.selectedTakeId ?? null, takes: members };
  }
  /**
   * 紧凑上下文快照：白名单行格式（id|kind|label 截断|parent），
   * 给 LLM 的画布上下文从 2-3k token 压到几百。
   */
  async summary() {
    const doc = await this.read();
    return doc.nodes.map((node) => {
      const label = node.label.replace(/\n/g, " ").slice(0, 60);
      const parent = node.parent ?? "-";
      const index = node.shotIndex !== void 0 ? `#${node.shotIndex}` : "";
      return `${node.id}|${node.kind}${index}|${label}|${parent}`;
    });
  }
  /** Set the document title. */
  async setTitle(title) {
    return this.mutate((doc) => {
      doc.title = title.slice(0, 200);
    });
  }
  /** Tree layout along edge direction: sources left, targets right, BFS levels. */
  async hierarchyLayout(gapX = 260, gapY = 140) {
    return this.mutate((doc) => {
      const level = /* @__PURE__ */ new Map();
      const indegree = /* @__PURE__ */ new Map();
      const targets = /* @__PURE__ */ new Map();
      for (const edge of doc.edges) {
        indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
        const list = targets.get(edge.from) ?? [];
        list.push(edge.to);
        targets.set(edge.from, list);
      }
      const roots = doc.nodes.filter((node) => (indegree.get(node.id) ?? 0) === 0);
      const queue = roots.map((node, index) => ({ id: node.id, level: 0, order: index }));
      const visited = /* @__PURE__ */ new Set();
      while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current.id)) continue;
        visited.add(current.id);
        level.set(current.id, current.level);
        const children = targets.get(current.id) ?? [];
        children.forEach((child, index) => {
          if (!visited.has(child)) queue.push({ id: child, level: current.level + 1, order: index });
        });
      }
      const orderInLevel = /* @__PURE__ */ new Map();
      for (const [id, nodeLevel] of level) {
        const node = doc.nodes.find((candidate) => candidate.id === id);
        if (node === void 0) continue;
        const order = orderInLevel.get(nodeLevel) ?? 0;
        orderInLevel.set(nodeLevel, order + 1);
        const width = node.width ?? 200;
        node.x = nodeLevel * gapX;
        node.y = order * gapY;
        void width;
      }
    });
  }
  /** 整理：分镜感横条（幕为行、镜为格）或单行；组成员留在组框内。 */
  async arrange(layout = "grid", _gap = 40) {
    return this.mutate((doc) => {
      if (layout === "row") {
        const topLevel = doc.nodes.filter((node) => node.parent === void 0);
        topLevel.forEach((node, index) => {
          const width = node.width ?? (node.kind === "group" ? 520 : SHOT_CARD_W);
          node.x = 48 + index * (width + SHOT_GAP);
          node.y = 48;
          node.width = width;
          node.height = node.height ?? (node.kind === "group" ? 240 : SHOT_CARD_H);
        });
        return;
      }
      layoutStoryboard(doc.nodes);
    });
  }
  /** 查一条：节点带入/出边与组员，或一条边。 */
  async getNode(id) {
    const doc = await this.read();
    const node = doc.nodes.find((candidate) => candidate.id === id);
    if (node !== void 0) {
      return {
        kind: "node",
        node,
        inbound: doc.edges.filter((edge2) => edge2.to === id),
        outbound: doc.edges.filter((edge2) => edge2.from === id),
        members: node.kind === "group" ? doc.nodes.filter((candidate) => candidate.parent === id) : []
      };
    }
    const edge = doc.edges.find((candidate) => candidate.id === id);
    if (edge !== void 0) return { kind: "edge", edge };
    throw new Error(`canvas element "${id}" not found`);
  }
  /** 分组一览：每个 group 带成员（id/kind/label/shotIndex）。 */
  async listGroups() {
    const doc = await this.read();
    return doc.nodes.filter((node) => node.kind === "group").map((group) => ({
      id: group.id,
      label: group.label,
      shotStatus: group.shotStatus ?? null,
      members: doc.nodes.filter((node) => node.parent === group.id).map((node) => ({ id: node.id, kind: node.kind, label: node.label, shotIndex: node.shotIndex ?? null }))
    }));
  }
  /** 把已有节点收进一个新 group（相对坐标保留；组框包住成员）。 */
  async groupNodes(input) {
    if (input.memberIds.length === 0) throw new Error("group needs at least one member id");
    let groupId = "";
    const doc = await this.mutate((draft) => {
      const members = [];
      for (const id of input.memberIds) {
        const node = draft.nodes.find((candidate) => candidate.id === id);
        if (node === void 0) throw new Error(`canvas node "${id}" not found`);
        if (node.kind === "group") throw new Error(`cannot put group "${id}" inside a new group`);
        members.push(node);
      }
      const minX = Math.min(...members.map((node) => node.x));
      const minY = Math.min(...members.map((node) => node.y));
      const maxX = Math.max(...members.map((node) => node.x + (node.width ?? 240)));
      const maxY = Math.max(...members.map((node) => node.y + (node.height ?? 160)));
      const group = sanitizeNode({
        kind: "group",
        label: input.label ?? "\u7EC4",
        x: minX - 40,
        y: minY - 48,
        width: Math.max(320, maxX - minX + 80),
        height: Math.max(240, maxY - minY + 96)
      });
      groupId = group.id;
      draft.nodes.push(group);
      for (const member of members) member.parent = groupId;
    });
    return { doc, groupId };
  }
  /** 按端点删一条边（不用先查 edge id）。 */
  async disconnect(from, to) {
    return this.mutate((doc) => {
      const next = doc.edges.filter((edge) => !(edge.from === from && edge.to === to));
      if (next.length === doc.edges.length) throw new Error(`no edge ${from} -> ${to}`);
      doc.edges = next;
    });
  }
  /**
   * 编排已有镜头：按传入顺序写入 shotIndex，可选把相邻 image/video 连成承接边。
   */
  async sequenceShots(input) {
    if (input.ids.length === 0) throw new Error("sequence needs at least one node id");
    return this.mutate((doc) => {
      const nodes = [];
      for (const id of input.ids) {
        const node = doc.nodes.find((candidate) => candidate.id === id);
        if (node === void 0) throw new Error(`canvas node "${id}" not found`);
        nodes.push(node);
      }
      nodes.forEach((node, index) => {
        node.shotIndex = index + 1;
      });
      if (input.connect !== true) return;
      const media = nodes.filter((node) => node.kind === "image" || node.kind === "video");
      for (let index = 0; index < media.length - 1; index += 1) {
        const fromNode = media[index];
        const toNode = media[index + 1];
        if (!this.canConnect(fromNode, toNode)) continue;
        if (doc.edges.some((edge2) => edge2.from === fromNode.id && edge2.to === toNode.id)) continue;
        const edge = sanitizeEdge({ from: fromNode.id, to: toNode.id, label: input.edgeLabel ?? "\u627F\u63A5" });
        this.validateEdgeForDoc(doc, edge);
        doc.edges.push(edge);
      }
    });
  }
  /**
   * 把幕/镜计划一次写入画布：每幕一个 group，每镜一个节点，全局 shotIndex，
   * 相邻媒体镜连承接边。不生成媒体。
   */
  async planBoard(input) {
    if (input.acts.length === 0) throw new Error("plan needs at least one act");
    const groups = [];
    const doc = await this.mutate((draft) => {
      if (input.title !== void 0 && input.title.trim() !== "") draft.title = input.title.trim().slice(0, 200);
      let shotNumber = draft.nodes.reduce((max, node) => Math.max(max, node.shotIndex ?? 0), 0);
      const mediaIds = [];
      input.acts.forEach((act, actIndex) => {
        if (act.shots.length === 0) throw new Error(`act "${act.label}" has no shots`);
        const group = sanitizeNode({
          kind: "group",
          label: act.label,
          x: 48,
          y: 48 + actIndex * (SHOT_CARD_H + GROUP_PAD_Y + 32 + ACT_GAP),
          width: GROUP_PAD_X * 2 + Math.max(1, act.shots.length) * SHOT_CARD_W + (Math.max(1, act.shots.length) - 1) * SHOT_GAP,
          height: GROUP_PAD_Y + SHOT_CARD_H + 32
        });
        draft.nodes.push(group);
        const shotIds = [];
        act.shots.forEach((shot, shotIndex) => {
          shotNumber += 1;
          const kind = shot.kind === "image" || shot.kind === "video" || shot.kind === "text" || shot.kind === "group" ? shot.kind : "video";
          if (kind === "group") throw new Error(`shot "${shot.label}" cannot be kind=group; use an act`);
          const seconds = typeof shot.seconds === "number" && Number.isFinite(shot.seconds) && shot.seconds > 0 ? Math.min(30, Math.round(shot.seconds)) : void 0;
          const basePrompt = (shot.prompt ?? "").trim();
          const prompt = seconds === void 0 ? basePrompt === "" ? void 0 : basePrompt : basePrompt === "" ? `${seconds}s` : `${basePrompt}, ${seconds}s`;
          const node = sanitizeNode({
            kind,
            label: shot.label,
            parent: group.id,
            x: group.x + GROUP_PAD_X + shotIndex * (SHOT_CARD_W + SHOT_GAP),
            y: group.y + GROUP_PAD_Y,
            width: SHOT_CARD_W,
            height: kind === "text" ? 120 : SHOT_CARD_H,
            shotIndex: shotNumber,
            shotStatus: "idea",
            ...prompt !== void 0 ? { prompt } : {},
            ...shot.continuity !== void 0 && shot.continuity.length > 0 ? { continuityRules: shot.continuity } : {}
          });
          draft.nodes.push(node);
          shotIds.push(node.id);
          if (kind === "image" || kind === "video") mediaIds.push(node.id);
        });
        groups.push({ id: group.id, label: act.label, shotIds });
      });
      if (input.connect === false) return;
      const byId = new Map(draft.nodes.map((node) => [node.id, node]));
      for (let index = 0; index < mediaIds.length - 1; index += 1) {
        const fromNode = byId.get(mediaIds[index]);
        const toNode = byId.get(mediaIds[index + 1]);
        if (fromNode === void 0 || toNode === void 0 || !this.canConnect(fromNode, toNode)) continue;
        const edge = sanitizeEdge({ from: fromNode.id, to: toNode.id, label: "\u627F\u63A5" });
        this.validateEdgeForDoc(draft, edge);
        draft.edges.push(edge);
      }
    });
    return { doc, groups };
  }
};

// src/providers/grade.ts
import { spawnSync } from "node:child_process";
import { existsSync as existsSync2 } from "node:fs";
import { extname as extname2, join as join10 } from "node:path";

// src/providers/grade-catalog.ts
var GRADE_LOOKS = [
  "wasteland",
  "teal-orange",
  "bleach-bypass",
  "cyber",
  "film-fade",
  "vintage",
  "kodachrome",
  "portra",
  "cross-process",
  "color-negative",
  "bw-contrast",
  "muted",
  "night",
  "cold",
  "warm",
  "golden"
];
var GRADE_TABLE = {
  wasteland: {
    id: "wasteland",
    label: "\u8352\u571F",
    family: "cinema",
    vf: "format=yuv420p10le,colorbalance=rs=0.16:gs=0.05:bs=-0.18:rh=0.14:gh=0.02:bh=-0.12,eq=contrast=1.16:saturation=0.68:brightness=-0.05:gamma=1.08,vignette=angle=PI/6,format=yuv420p",
    css: "sepia(0.38) saturate(0.72) contrast(1.16) brightness(0.94) hue-rotate(-14deg)",
    pattern: /末日|荒土|废土|黄沙|沙尘|dust|wasteland|desert|apocalyp/i,
    source: "DirectorX 36-color-luts \u6218\u4E89/\u672B\u65E5\u6761"
  },
  "teal-orange": {
    id: "teal-orange",
    label: "\u9752\u6A59",
    family: "cinema",
    vf: "format=yuv420p10le,colorbalance=rs=-0.12:gs=0.06:bs=0.12:rh=0.12:gh=0.03:bh=-0.12:rm=0.03:bm=-0.03,eq=contrast=1.08:saturation=1.2,format=yuv420p",
    css: "saturate(1.18) contrast(1.08) hue-rotate(8deg)",
    pattern: /青橙|teal|orange|好莱坞/i,
    source: "36-color-luts \u9752\u6A59 + Pixflow \u516C\u5F00\u6559\u7A0B"
  },
  "bleach-bypass": {
    id: "bleach-bypass",
    label: "\u6F02\u767D",
    family: "cinema",
    vf: "format=yuv420p10le,eq=saturation=0.42:contrast=1.38:brightness=-0.04:gamma=1.06,colorbalance=bs=0.06:rs=-0.04:bh=0.04,curves=preset=strong_contrast,format=yuv420p",
    css: "grayscale(0.35) contrast(1.32) saturate(0.55) brightness(0.96)",
    pattern: /漂白|bypass|银盐|skip.?bleach/i,
    source: "36-color-luts \u6F02\u767D\u65C1\u8DEF + FFmpeg curves=strong_contrast"
  },
  cyber: {
    id: "cyber",
    label: "\u9713\u8679",
    family: "cinema",
    vf: "format=yuv420p10le,colorbalance=bs=0.16:rs=-0.08:rh=0.14:bh=-0.06:gm=-0.04:bm=0.08,eq=contrast=1.18:saturation=1.35:gamma=0.98,format=yuv420p",
    css: "saturate(1.42) contrast(1.18) hue-rotate(-12deg) brightness(1.02)",
    pattern: /赛博|霓虹|cyber|neon|品红青|品红/i,
    source: "yeun/open-color MIT \u9752/\u7C89\u951A + chromotome MIT \u9713\u8679\u677F\u6C14\u8D28"
  },
  "film-fade": {
    id: "film-fade",
    label: "\u80F6\u7247",
    family: "film",
    vf: "format=yuv420p10le,curves=master='0/0.05 0.2/0.24 0.6/0.58 1/0.96':interp=pchip,eq=saturation=0.85:gamma=1.05,colorbalance=rh=0.06:bh=-0.05,vignette=angle=PI/7,noise=alls=5:allf=t+u,format=yuv420p",
    css: "sepia(0.18) saturate(0.86) contrast(1.05) brightness(1.02)",
    pattern: /胶片|褪色|film.?fade|fade.?film/i,
    source: "36-color-luts \u80F6\u7247\u6A21\u62DF"
  },
  vintage: {
    id: "vintage",
    label: "\u590D\u53E4",
    family: "film",
    vf: "format=yuv420p10le,curves=preset=vintage,eq=saturation=0.82:gamma=1.06,vignette=angle=PI/6,noise=alls=6:allf=t+u,format=yuv420p",
    css: "sepia(0.32) saturate(0.78) contrast(1.08) brightness(1.04)",
    pattern: /vintage|复古|怀旧|老照片/i,
    source: "FFmpeg libavfilter curves=preset=vintage\uFF08\u8FD0\u884C\u65F6\uFF0C\u4E0D\u6346\u7ED1\u6E90\u7801\uFF09"
  },
  kodachrome: {
    id: "kodachrome",
    label: "\u514B\u7F57\u59C6",
    family: "film",
    vf: "format=yuv420p10le,colorbalance=rs=0.1:rh=0.12:bs=-0.06:bh=0.08:gs=-0.02,eq=contrast=1.22:saturation=1.28:gamma=0.96,curves=preset=increase_contrast,format=yuv420p",
    css: "saturate(1.28) contrast(1.2) brightness(0.98) hue-rotate(-6deg)",
    pattern: /kodachrome|克罗姆|柯达正片|velvia|正片/i,
    source: "colour-science/colour BSD-3 \u6B63\u7247\u7279\u5F81\u8FD1\u4F3C\uFF0C\u975E\u5546\u6807\u80F6\u7247\u62F7\u8D1D"
  },
  portra: {
    id: "portra",
    label: "\u4EBA\u50CF\u8D1F\u7247",
    family: "film",
    vf: "format=yuv420p10le,curves=master='0/0.04 0.25/0.28 0.6/0.62 1/0.97':interp=pchip,colorbalance=rs=0.08:gs=0.04:bs=-0.04:rh=0.06:gh=0.02,eq=saturation=0.92:contrast=0.98:gamma=1.04,format=yuv420p",
    css: "saturate(0.92) contrast(0.98) brightness(1.04) sepia(0.08)",
    pattern: /portra|波特拉|人像胶片|人像负片|肤色胶片/i,
    source: "colour-science/colour BSD-3 \u8D1F\u7247\u80A4\u8272\u503E\u5411\u8FD1\u4F3C\uFF1BFilm-Luts MIT \u6C14\u8D28\u5BF9\u7167\uFF08\u672A\u6346\u7ED1 .cube\uFF09"
  },
  "cross-process": {
    id: "cross-process",
    label: "\u4EA4\u53C9\u51B2\u5370",
    family: "film",
    vf: "format=yuv420p10le,curves=preset=cross_process,eq=saturation=1.12:contrast=1.08,format=yuv420p",
    css: "saturate(1.2) contrast(1.1) hue-rotate(-18deg)",
    pattern: /交叉冲印|cross.?process|冲印/i,
    source: "FFmpeg curves=preset=cross_process + 36-color-luts \u4EA4\u53C9\u51B2\u5370\u6761"
  },
  "color-negative": {
    id: "color-negative",
    label: "\u8D1F\u7247",
    family: "film",
    vf: "format=yuv420p10le,curves=preset=color_negative,eq=contrast=1.05,format=yuv420p",
    css: "invert(1) hue-rotate(180deg) contrast(1.05)",
    pattern: /负片|color.?negative|invert|反相|底片/i,
    source: "FFmpeg curves=preset=color_negative"
  },
  "bw-contrast": {
    id: "bw-contrast",
    label: "\u9ED1\u767D",
    family: "film",
    vf: "format=yuv420p10le,hue=s=0,curves=preset=strong_contrast,eq=contrast=1.15:brightness=-0.02,noise=alls=4:allf=t,format=yuv420p",
    css: "grayscale(1) contrast(1.18) brightness(0.98)",
    pattern: /黑白|noir|mono|grayscale|b\s*[&\/]\s*w/i,
    source: "FFmpeg curves=preset=strong_contrast + hue=s=0"
  },
  muted: {
    id: "muted",
    label: "\u4F4E\u9971\u548C",
    family: "tone",
    vf: "format=yuv420p10le,eq=saturation=0.55:contrast=0.96:brightness=0.02:gamma=1.04,colorbalance=rs=0.03:bs=0.02,format=yuv420p",
    css: "saturate(0.58) contrast(0.96) brightness(1.02)",
    pattern: /低饱和|muted|desat|去饱和|淡彩|北欧|冷淡/i,
    source: "36-color-luts \u4F4E\u9971\u548C\u6761 + d3 ColorBrewer \u4F4E\u5F69\u5E8F\u5217\u6C14\u8D28"
  },
  night: {
    id: "night",
    label: "\u591C\u8272",
    family: "tone",
    vf: "format=yuv420p10le,colorbalance=bs=0.18:gs=0.04:rs=-0.14:bh=0.1:rh=-0.08,eq=contrast=1.12:saturation=0.78:brightness=-0.08:gamma=1.08,format=yuv420p",
    css: "saturate(0.78) contrast(1.12) brightness(0.88) hue-rotate(196deg)",
    pattern: /夜色|月光|夜景|night|moonlight|深夜/i,
    source: "yeun/open-color MIT indigo/blue \u951A"
  },
  cold: {
    id: "cold",
    label: "\u51B7\u8C03",
    family: "tone",
    vf: "format=yuv420p10le,colorbalance=bs=0.14:gs=0.04:rs=-0.1:bh=0.08:rh=-0.06,eq=contrast=1.06:saturation=0.9:gamma=1.04,format=yuv420p",
    css: "saturate(0.9) contrast(1.06) hue-rotate(168deg) brightness(1.02)",
    pattern: /冷调|冷色|青冷|steel|cyan|ice/i,
    source: "36-color-luts \u51B7\u79D1\u6280\u6761"
  },
  warm: {
    id: "warm",
    label: "\u6696\u8C03",
    family: "tone",
    vf: "format=yuv420p10le,colorbalance=rs=0.12:gs=0.04:bs=-0.1:rh=0.1:bh=-0.06,eq=contrast=1.05:saturation=1.08:gamma=1.03,format=yuv420p",
    css: "sepia(0.16) saturate(1.08) contrast(1.05) brightness(1.03) hue-rotate(-8deg)",
    pattern: /暖调|暖色|warm/i,
    source: "36-color-luts \u6696\u8BB0\u5FC6\u6761"
  },
  golden: {
    id: "golden",
    label: "\u91D1\u9EC4\u660F",
    family: "tone",
    vf: "format=yuv420p10le,colorbalance=rs=0.16:gs=0.08:bs=-0.14:rh=0.14:gh=0.04:bh=-0.1,eq=contrast=1.08:saturation=1.12:gamma=1.04:brightness=0.03,format=yuv420p",
    css: "sepia(0.22) saturate(1.16) contrast(1.08) brightness(1.06) hue-rotate(-12deg)",
    pattern: /金色|黄昏|golden|sunset|magic.?hour|黄金时刻|日落/i,
    source: "yeun/open-color MIT yellow/orange \u951A + 36-color-luts \u6696\u8BB0\u5FC6"
  }
};
var GRADE_LOOK_LIST = GRADE_LOOKS.map((id) => GRADE_TABLE[id]);
var GRADE_ALIASES = [
  { look: "bleach-bypass", pattern: GRADE_TABLE["bleach-bypass"].pattern },
  { look: "cross-process", pattern: GRADE_TABLE["cross-process"].pattern },
  { look: "portra", pattern: GRADE_TABLE.portra.pattern },
  { look: "kodachrome", pattern: GRADE_TABLE.kodachrome.pattern },
  { look: "color-negative", pattern: GRADE_TABLE["color-negative"].pattern },
  { look: "teal-orange", pattern: GRADE_TABLE["teal-orange"].pattern },
  { look: "wasteland", pattern: GRADE_TABLE.wasteland.pattern },
  { look: "vintage", pattern: GRADE_TABLE.vintage.pattern },
  { look: "cyber", pattern: GRADE_TABLE.cyber.pattern },
  { look: "golden", pattern: GRADE_TABLE.golden.pattern },
  { look: "night", pattern: GRADE_TABLE.night.pattern },
  { look: "muted", pattern: GRADE_TABLE.muted.pattern },
  { look: "bw-contrast", pattern: GRADE_TABLE["bw-contrast"].pattern },
  { look: "film-fade", pattern: GRADE_TABLE["film-fade"].pattern },
  { look: "cold", pattern: GRADE_TABLE.cold.pattern },
  { look: "warm", pattern: GRADE_TABLE.warm.pattern }
];
function isGradeLook(value) {
  return GRADE_LOOKS.includes(value);
}
function listGradeLabels() {
  return GRADE_LOOK_LIST.map((item) => item.label).join(" / ");
}

// src/providers/grade.ts
function resolveGradeLook(text) {
  const raw = text.trim();
  if (isGradeLook(raw)) return raw;
  for (const item of GRADE_ALIASES) {
    if (item.pattern.test(raw)) return item.look;
  }
  if (/调色|色调|配色|grade|look|滤镜/i.test(raw)) return "wasteland";
  throw new Error(`\u65E0\u6CD5\u4ECE\u300C${raw.slice(0, 40)}\u300D\u8BC6\u522B\u8C03\u8272\u3002\u53EF\u7528\uFF1A${listGradeLabels()}`);
}
function gradeFilter(look) {
  return GRADE_TABLE[look].vf;
}
function inferMediaKind(path, fallback) {
  const ext = extname2(path).toLowerCase();
  if ([".mp4", ".mov", ".webm", ".m4v", ".mkv"].includes(ext)) return "video";
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"].includes(ext)) return "image";
  return fallback ?? "image";
}
async function applyGrade(input) {
  const source = input.source;
  if (!existsSync2(source)) throw new Error(`\u5A92\u4F53\u4E0D\u5B58\u5728\uFF1A${source}`);
  const which = spawnSync("which", ["ffmpeg"], { encoding: "utf8" });
  if (which.status !== 0 || which.stdout.trim() === "") {
    throw new Error("\u8C03\u8272\u9700\u8981\u672C\u673A ffmpeg\u3002\u8BF7\u5148\u5B89\u88C5 ffmpeg\uFF08brew install ffmpeg\uFF09\u3002");
  }
  const kind = input.kind ?? inferMediaKind(source);
  const ext = kind === "video" ? ".mp4" : extname2(source).toLowerCase() === ".png" ? ".png" : ".jpg";
  const out = join10(resolveOutputDir(input.outputDir), `${slugify(`grade-${input.look}`)}-${Date.now().toString(36)}${ext}`);
  const vf = gradeFilter(input.look);
  const args = kind === "video" ? ["-y", "-i", source, "-vf", vf, "-c:a", "copy", out] : ["-y", "-i", source, "-vf", vf, out];
  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0 || !existsSync2(out)) {
    throw new Error(`\u8C03\u8272\u5931\u8D25\uFF1A${(result.stderr ?? "").slice(-400) || `exit ${result.status}`}`);
  }
  return { path: out, look: input.look, kind };
}

// src/studio-intent.ts
import { mkdir as mkdir8, readFile as readFile9, writeFile as writeFile6 } from "node:fs/promises";
import { join as join11 } from "node:path";
var FILE2 = "studio-open.json";
var StudioTicketStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join11(resolveOutputDir(this.outputDir), FILE2);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile9(this.filePath(), "utf8"));
      if (typeof parsed.path !== "string" || parsed.path === "") return null;
      if (parsed.kind !== "image" && parsed.kind !== "video") return null;
      return parsed;
    } catch {
      return null;
    }
  }
  async write(input) {
    const ticket = {
      id: input.id ?? `studio-${Date.now().toString(36)}`,
      kind: input.kind,
      path: input.path,
      at: Date.now(),
      ...input.look !== void 0 ? { look: input.look } : {},
      ...input.nodeId !== void 0 ? { nodeId: input.nodeId } : {}
    };
    await mkdir8(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile6(this.filePath(), JSON.stringify(ticket), "utf8");
    return ticket;
  }
};

// src/media-server.ts
function directorxWeb(ctx) {
  const webServer = ctx.get("webServer");
  if (webServer === void 0) return void 0;
  return {
    register(route) {
      return webServer.register({
        ...route,
        handler: (request, response) => {
          let project;
          try {
            project = resolveRequestProject(ctx, request);
          } catch {
            response.writeHead(403);
            response.end("unknown project");
            return;
          }
          return runInProject(project, () => route.handler(request, response));
        }
      });
    }
  };
}
function sendJsonLocal(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}
async function readBodyLocal(request, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) throw new Error("body too large");
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}
var MEDIA_ROUTE_PATH = "/directorx/media";
var MEDIA_EDITS_ROUTE_PATH = "/directorx/media/edits";
var MEDIA_TASKS_ROUTE_PATH = "/directorx/media/tasks";
var MEDIA_LIST_ROUTE_PATH = "/directorx/media/list";
var CANVAS_ROUTE_PATH = "/directorx/canvas";
var EDIT_SUBDIR = "edited";
var MEDIA_TYPE_EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/wav": "wav"
};
function mediaTypeExt(mediaType) {
  return MEDIA_TYPE_EXT[mediaType.toLowerCase().split(";")[0].trim()];
}
function byteCapStream(cap) {
  let total = 0;
  const stream = new Transform({
    transform(chunk, _encoding, callback) {
      total += chunk.length;
      if (total > cap) {
        callback(new Error(`Media save exceeds the ${Math.round(cap / 1024 / 1024)}MB cap`));
        return;
      }
      callback(null, chunk);
    }
  });
  return { stream, size: () => total };
}
async function inspectMediaFile(outputDir, requestedPath) {
  const path = resolveMediaPath(outputDir, requestedPath);
  const fileStat = await stat(path);
  if (!fileStat.isFile()) throw new Error(`Not a regular file: ${requestedPath}`);
  if (fileStat.size > MAX_MEDIA_BYTES) {
    throw new Error(`Media file too large to serve (${fileStat.size} bytes): ${requestedPath}`);
  }
  return { path, size: fileStat.size, mediaType: mimeForPath(path) };
}
function isCrossOrigin(request) {
  const origin = request.headers.origin;
  if (origin === void 0) return false;
  const host = request.headers.host ?? "";
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}
async function saveEditedMedia(outputDir, request, response) {
  const mediaType = String(request.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
  const ext = mediaTypeExt(mediaType);
  if (ext === void 0) {
    response.writeHead(415, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: `Unsupported media type: ${mediaType}` }));
    return;
  }
  const nameHint = String(request.headers["x-directorx-name"] ?? "edit");
  const stem = slugify(nameHint, 40);
  const dir = join12(resolveOutputDir(outputDir), EDIT_SUBDIR);
  await mkdir9(dir, { recursive: true });
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
  const name2 = `${stamp}-${stem}.${ext}`;
  const path = join12(dir, name2);
  const cap = byteCapStream(MAX_MEDIA_BYTES);
  try {
    await pipeline(request, cap.stream, createWriteStream(path));
  } catch (error) {
    await rm(path, { force: true }).catch(() => {
    });
    const tooLarge = error instanceof Error && /exceeds the/.test(error.message);
    response.writeHead(tooLarge ? 413 : 400, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "save failed" }));
    return;
  }
  const bytes = cap.size();
  await new DirectorxEditLedger(outputDir).append({ at: Date.now(), path, mediaType, bytes, name: name2 }).catch(() => {
  });
  response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ path, bytes, mediaType, name: name2 }));
}
function registerMediaRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: MEDIA_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      if (request.method === "POST") {
        await saveEditedMedia(getOutputDir(), request, response);
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      try {
        const requested = parseMediaQuery(request.url);
        if (requested === void 0) {
          response.writeHead(400);
          response.end("missing path");
          return;
        }
        const info = await inspectMediaFile(getOutputDir(), requested);
        const range = parseRangeHeader(request.headers.range, info.size);
        const length = range === void 0 ? info.size : range.end - range.start + 1;
        response.writeHead(range === void 0 ? 200 : 206, {
          "content-type": info.mediaType,
          "content-length": length,
          "accept-ranges": "bytes",
          "cache-control": "no-store",
          ...range === void 0 ? {} : { "content-range": `bytes ${range.start}-${range.end}/${info.size}` }
        });
        if (request.method === "HEAD") {
          response.end();
          return;
        }
        createReadStream(info.path, range === void 0 ? void 0 : { start: range.start, end: range.end }).pipe(response);
      } catch {
        if (!response.headersSent) {
          response.writeHead(404);
          response.end("not found");
        } else {
          response.destroy();
        }
      }
    }
  });
}
function registerMediaEditsRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: MEDIA_EDITS_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      const edits = await new DirectorxEditLedger(getOutputDir()).list(20);
      response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify({ edits }));
    }
  });
}
function registerMediaTasksRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: MEDIA_TASKS_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      const records = await new DirectorxTaskLedger(getOutputDir()).list();
      const latestByTask = /* @__PURE__ */ new Map();
      for (const record of records) latestByTask.set(record.taskId, record);
      const tasks = [...latestByTask.values()].reverse().slice(0, 20);
      response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      response.end(JSON.stringify({ tasks }));
    }
  });
}
async function listMediaFiles(outputDir) {
  const root = resolveOutputDir(outputDir);
  const files = [];
  const scan = async (dir, depth) => {
    if (depth > 1) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join12(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "frames" || entry.name === "edited" || entry.name === "transcripts") await scan(full, depth + 1);
        continue;
      }
      const info = await stat(full).catch(() => void 0);
      if (info === void 0 || !info.isFile()) continue;
      const mediaType = mimeForPath(full);
      if (mediaType === "application/octet-stream") continue;
      const rel = relative(currentProjectRoot(), full);
      files.push({
        path: rel === "" || rel.startsWith("..") ? full : rel,
        name: entry.name,
        mediaType,
        size: info.size,
        at: info.mtimeMs
      });
    }
  };
  await scan(root, 0);
  files.sort((a, b) => b.at - a.at);
  return files.slice(0, 200);
}
function registerMediaListRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: MEDIA_LIST_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      try {
        const files = await listMediaFiles(getOutputDir());
        response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        response.end(JSON.stringify({ files }));
      } catch (error) {
        response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : "list failed" }));
      }
    }
  });
}
function registerCanvasRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: CANVAS_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      const store = new DirectorxCanvasStore(getOutputDir());
      const send = (status, body) => {
        response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        response.end(JSON.stringify(body));
      };
      try {
        if (request.method === "GET" || request.method === "HEAD") {
          const doc = await store.read();
          if (request.method === "HEAD") {
            response.writeHead(200);
            response.end();
            return;
          }
          send(200, doc);
          return;
        }
        if (request.method === "PUT") {
          const chunks = [];
          for await (const chunk of request) chunks.push(chunk);
          const raw = Buffer.concat(chunks).toString("utf8");
          const body = JSON.parse(raw);
          const queryStart = request.url?.indexOf("?") ?? -1;
          const expectedRaw = queryStart >= 0 && request.url !== void 0 ? new URLSearchParams(request.url.slice(queryStart + 1)).get("expectedUpdatedAt") : null;
          const expectedUpdatedAt = expectedRaw !== null && expectedRaw !== "" && Number.isFinite(Number(expectedRaw)) ? Number(expectedRaw) : void 0;
          const doc = await store.write(
            { version: 1, updatedAt: body.updatedAt ?? 0, ...typeof body.title === "string" && body.title !== "" ? { title: body.title } : {}, nodes: body.nodes ?? [], edges: body.edges ?? [] },
            expectedUpdatedAt
          );
          send(200, doc);
          return;
        }
        response.writeHead(405);
        response.end("method not allowed");
      } catch (error) {
        const code = error?.code;
        send(code === "CANVAS_CONFLICT" ? 409 : 400, { error: error instanceof Error ? error.message : String(error), code });
      }
    }
  });
}
var PROJECTS_ROUTE_PATH = "/directorx/projects";
function registerProjectsRoute(ctx) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: PROJECTS_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      sendJsonLocal(response, 200, { projects: listWorkspaceRoots(ctx) });
    }
  });
}
var VENDOR_FILES = {
  "transformers.min.js": "text/javascript",
  "ort-wasm-simd-threaded.jsep.mjs": "text/javascript",
  "ort-wasm-simd-threaded.jsep.wasm": "application/wasm"
};
function registerVendorRoute(ctx) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  const vendorDirs = [
    fileURLToPath(new URL("./vendor/", import.meta.url)),
    fileURLToPath(new URL("../vendor/", import.meta.url))
  ];
  const serve = async (name2, contentType, response) => {
    try {
      const dir = vendorDirs.find((candidate) => existsSync3(join12(candidate, name2)));
      if (dir === void 0) throw new Error(`vendor asset ${name2} missing`);
      const data = await readFile10(join12(dir, name2));
      response.writeHead(200, {
        "content-type": contentType,
        "cache-control": "public, max-age=86400",
        "cross-origin-resource-policy": "same-origin"
      });
      response.end(data);
    } catch (cause) {
      response.writeHead(500, { "content-type": "text/plain" });
      response.end(`vendor serve failed: ${cause instanceof Error ? cause.message : String(cause)}`);
    }
  };
  const disposers = [];
  for (const [name2, contentType] of Object.entries(VENDOR_FILES)) {
    disposers.push(webServer.register({
      kind: "exact",
      path: `/directorx/vendor/${name2}`,
      handler: async (request, response) => {
        if (isCrossOrigin(request)) {
          response.writeHead(403);
          response.end("forbidden");
          return;
        }
        if (request.method !== "GET" && request.method !== "HEAD") {
          response.writeHead(405);
          response.end("method not allowed");
          return;
        }
        await serve(name2, contentType, response);
      }
    }));
  }
  return () => {
    for (const dispose of disposers) dispose();
  };
}
function registerCanvasResetRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: "/directorx/canvas/reset",
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      if (request.method !== "POST") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      try {
        const store = new DirectorxCanvasStore(getOutputDir());
        const doc = await store.reset();
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(doc));
      } catch (error) {
        response.writeHead(400, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      }
    }
  });
}
function registerCanvasSnapshotsRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: "/directorx/canvas/snapshots",
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      const store = new DirectorxCanvasStore(getOutputDir());
      if (request.method === "POST") {
        const snap = await store.snapshot("\u624B\u52A8\u68C0\u67E5\u70B9");
        sendJsonLocal(response, 200, { ok: true, snapshot: snap });
        return;
      }
      sendJsonLocal(response, 200, { snapshots: await store.readSnapshotsIndex() });
    }
  });
}
function registerCanvasRestoreRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: "/directorx/canvas/restore",
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      if (request.method !== "POST") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      const body = await readBodyLocal(request, 16 * 1024);
      const id = typeof body.id === "string" ? body.id : "";
      if (id === "") {
        sendJsonLocal(response, 400, { ok: false, message: "snapshot id \u5FC5\u586B" });
        return;
      }
      try {
        const store = new DirectorxCanvasStore(getOutputDir());
        const doc = await store.restoreSnapshot(id);
        sendJsonLocal(response, 200, { ok: true, updatedAt: doc.updatedAt });
      } catch {
        sendJsonLocal(response, 404, { ok: false, message: "\u5FEB\u7167\u4E0D\u5B58\u5728\u6216\u5DF2\u635F\u574F" });
      }
    }
  });
}
function registerCanvasIntentRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: "/directorx/canvas/intent",
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      const store = new CanvasIntentStore(getOutputDir());
      if (request.method === "GET" || request.method === "HEAD") {
        const intents = await store.list();
        sendJsonLocal(response, 200, { intents });
        return;
      }
      if (request.method !== "POST") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      const body = await readBodyLocal(request, 64 * 1024);
      if (body.claim === true) {
        const intent = await store.takeNext();
        sendJsonLocal(response, 200, {
          ok: true,
          intent,
          ...intent !== null ? { prompt: formatDshCanvasPrompt(intent) } : {}
        });
        return;
      }
      const ackStatus = body.status;
      if (typeof body.id === "string" && body.id !== "" && (ackStatus === "taken" || ackStatus === "done" || ackStatus === "cancelled")) {
        try {
          const intent = await store.ack(body.id, ackStatus);
          sendJsonLocal(response, 200, { ok: true, intent });
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : String(cause);
          sendJsonLocal(response, /cannot move/.test(message) ? 409 : 404, { ok: false, message });
        }
        return;
      }
      const kind = body.kind === "image" || body.kind === "video" ? body.kind : "";
      const prompt = typeof body.prompt === "string" ? body.prompt : "";
      if (kind === "" || prompt.trim() === "") {
        sendJsonLocal(response, 400, { ok: false, message: "kind \u4E0E prompt \u5FC5\u586B" });
        return;
      }
      try {
        const intent = await store.enqueue({
          kind,
          prompt,
          ...typeof body.sourceId === "string" && body.sourceId !== "" ? { sourceId: body.sourceId } : {},
          ...Array.isArray(body.selectedIds) ? { selectedIds: body.selectedIds } : {},
          ...Array.isArray(body.characters) ? { characters: body.characters } : {},
          ...typeof body.model === "string" && body.model !== "" ? { model: body.model } : {},
          ...typeof body.aspect === "string" && body.aspect !== "" ? { aspect: body.aspect } : {},
          ...typeof body.count === "number" ? { count: body.count } : {},
          ...typeof body.durationSec === "number" ? { durationSec: body.durationSec } : {},
          ...Array.isArray(body.refIds) ? { refIds: body.refIds } : {}
        });
        sendJsonLocal(response, 200, { ok: true, intent, prompt: formatDshCanvasPrompt(intent) });
      } catch (cause) {
        sendJsonLocal(response, 400, { ok: false, message: cause instanceof Error ? cause.message : String(cause) });
      }
    }
  });
}
function registerProposalsRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: "/directorx/proposals",
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      const store = new ProposalStore(getOutputDir());
      if (request.method === "POST") {
        const body = await readBodyLocal(request, 64 * 1024);
        const kind = body.kind === "image" || body.kind === "video" || body.kind === "audio" ? body.kind : "";
        const prompt = typeof body.prompt === "string" ? body.prompt : "";
        if (kind === "" || prompt.trim() === "") {
          sendJsonLocal(response, 400, { ok: false, message: "kind \u4E0E prompt \u5FC5\u586B" });
          return;
        }
        try {
          const proposal = await store.propose({
            kind,
            prompt: prompt.slice(0, 2e3),
            count: typeof body.count === "number" && Number.isFinite(body.count) ? body.count : 1,
            ...typeof body.model === "string" && body.model !== "" ? { model: body.model.slice(0, 80) } : {},
            ...typeof body.size === "string" && body.size !== "" ? { size: body.size.slice(0, 40) } : {},
            ...typeof body.duration === "number" && Number.isFinite(body.duration) ? { duration: body.duration } : {},
            ...typeof body.note === "string" && body.note !== "" ? { note: body.note.slice(0, 400) } : {},
            ...typeof body.canvasNodeId === "string" && body.canvasNodeId !== "" ? { canvasNodeId: body.canvasNodeId.slice(0, 100) } : {},
            ...typeof body.estimatedCost === "string" && body.estimatedCost !== "" ? { estimatedCost: body.estimatedCost.slice(0, 80) } : {}
          });
          sendJsonLocal(response, 200, { ok: true, proposal });
        } catch (cause) {
          sendJsonLocal(response, 400, { ok: false, message: cause instanceof Error ? cause.message : String(cause) });
        }
        return;
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      const ledger = await store.read();
      sendJsonLocal(response, 200, { proposals: ledger.proposals });
    }
  });
}
function registerProposalUpdateRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: "/directorx/proposals/update",
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      if (request.method !== "POST") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      const body = await readBodyLocal(request, 64 * 1024);
      const id = typeof body.id === "string" ? body.id : "";
      const status = body.status === "approved" || body.status === "rejected" ? body.status : null;
      if (id === "" || status === null) {
        sendJsonLocal(response, 400, { ok: false, message: "id \u4E0E status(approved/rejected) \u5FC5\u586B" });
        return;
      }
      const store = new ProposalStore(getOutputDir());
      const updated = await store.update(id, status, { ...typeof body.reason === "string" && body.reason !== "" ? { rejectReason: body.reason.slice(0, 200) } : {}, ...typeof body.prompt === "string" && body.prompt !== "" ? { prompt: body.prompt.slice(0, 2e3) } : {} });
      if (status === "approved") {
        try {
          const canvas = new DirectorxCanvasStore(getOutputDir());
          await canvas.snapshot(`proposal-${id}`);
        } catch {
        }
      }
      sendJsonLocal(response, 200, { ok: true, proposal: updated });
    }
  });
}
function registerCharactersRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: "/directorx/characters",
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      const store = new CharacterStore(getOutputDir());
      if (request.method === "GET" || request.method === "HEAD") {
        sendJsonLocal(response, 200, { characters: await store.list() });
        return;
      }
      if (request.method !== "POST") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      const body = await readBodyLocal(request, 64 * 1024);
      const name2 = typeof body.name === "string" ? body.name : "";
      if (name2.trim() === "") {
        sendJsonLocal(response, 400, { ok: false, message: "name \u5FC5\u586B" });
        return;
      }
      if (body.remove === true) {
        try {
          await store.remove(name2);
          sendJsonLocal(response, 200, { ok: true });
        } catch (cause) {
          sendJsonLocal(response, 404, { ok: false, message: cause instanceof Error ? cause.message : String(cause) });
        }
        return;
      }
      const refPath = typeof body.refPath === "string" ? body.refPath : "";
      try {
        const character = await store.register({
          name: name2,
          refPath,
          ...typeof body.description === "string" ? { description: body.description } : {},
          ...typeof body.outfit === "string" ? { outfit: body.outfit } : {},
          ...typeof body.props === "string" ? { props: body.props } : {}
        });
        sendJsonLocal(response, 200, { ok: true, character });
      } catch (cause) {
        sendJsonLocal(response, 400, { ok: false, message: cause instanceof Error ? cause.message : String(cause) });
      }
    }
  });
}
var STUDIO_ROUTE_PATH = "/directorx/studio";
function registerStudioRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: STUDIO_ROUTE_PATH,
    handler: async (request, response) => {
      if (isCrossOrigin(request)) {
        response.writeHead(403);
        response.end("forbidden");
        return;
      }
      const tickets = new StudioTicketStore(getOutputDir());
      if (request.method === "GET" || request.method === "HEAD") {
        sendJsonLocal(response, 200, { ticket: await tickets.read() });
        return;
      }
      if (request.method !== "POST") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      const body = await readBodyLocal(request, 64 * 1024);
      const rawPath = typeof body.path === "string" ? body.path : "";
      const prompt = typeof body.look === "string" && body.look !== "" ? body.look : typeof body.prompt === "string" ? body.prompt : "";
      if (rawPath === "" || prompt.trim() === "") {
        sendJsonLocal(response, 400, { ok: false, message: "path \u4E0E look/prompt \u5FC5\u586B" });
        return;
      }
      try {
        const source = resolveMediaPath(getOutputDir(), rawPath);
        const look = resolveGradeLook(prompt);
        const kind = body.kind === "video" || body.kind === "image" ? body.kind : inferMediaKind(source);
        const graded = await applyGrade({ source, look, outputDir: getOutputDir(), kind });
        const nodeId = typeof body.nodeId === "string" && body.nodeId !== "" ? body.nodeId : void 0;
        if (nodeId !== void 0) {
          await new DirectorxCanvasStore(getOutputDir()).update(nodeId, { path: graded.path });
        }
        const ticket = await tickets.write({
          kind: graded.kind,
          path: graded.path,
          look: graded.look,
          ...nodeId !== void 0 ? { nodeId } : {}
        });
        sendJsonLocal(response, 200, { ok: true, ...graded, ticket, openStudio: true });
      } catch (cause) {
        sendJsonLocal(response, 400, { ok: false, message: cause instanceof Error ? cause.message : String(cause) });
      }
    }
  });
}

// src/skills.ts
import { readdir as readdir2, readFile as readFile11 } from "node:fs/promises";
import { join as join13, resolve as resolve5 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
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
    return parseFrontmatter(await readFile11(path, "utf8"));
  } catch {
    return void 0;
  }
}
async function firstLevelSkillDirs(root) {
  const entries = await readdir2(root, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    const dir = join13(root, entry.name);
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
  const skillsRoot = fileURLToPath2(new URL("../skills/", import.meta.url));
  const root = resolve5(skillsRoot);
  for (const { dir, safeName } of await firstLevelSkillDirs(root)) {
    const parsed = await readSkillFile(join13(dir, "SKILL.md"));
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
  const cnRoot = join13(root, "video-production-cn");
  const cnEntries = await firstLevelSkillDirs(cnRoot).catch(() => []);
  for (const { dir, safeName } of cnEntries) {
    const parsed = await readSkillFile(join13(dir, "SKILL.md"));
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
      "Recipe files ship in the plugin `recipes/` directory as prior art. Adapt `recipes/promo-video.md`, `recipes/novel-adaptation.md`, `recipes/remake-subject.md`, or `recipes/unit-production.md` to the actual request. `directorx_brief.compose` names the matching recipe and the tool sequence. Queue generation as placeholders the user confirms. Do not route every job through directorx_orchestrate or a single workflow template.",
      "Every recipe assumes the DirectorX generation tools are configured in Settings; before queuing media, verify the matching capability is enabled and its Base URL / API Key / model are set."
    ].join("\n"),
    source: "runtime",
    provider: "directorx",
    invocation: { modelInvocable: true, userInvocable: true }
  });
  ctx.skills.register({
    name: "directorx-workflow",
    description: "Optional accelerator for multi-shot fan-out. Default path is compose existing tools against a matching recipe (brief \u2192 research \u2192 confirm \u2192 propose \u2192 shotlist). Load when you actually need parallel subagents, not for every production.",
    content: [
      "# DirectorX Workflow \u7F16\u6392\uFF08\u63A8\u5BFC\u4F18\u5148\uFF09",
      "",
      "\u9ED8\u8BA4\u4E0D\u8981\u5957\u672C skill \u7684\u6A21\u677F\u3002\u5148 `directorx_brief`\uFF0C\u6309\u8FD4\u56DE\u7684 `compose` \u7528\u73B0\u6709\u5DE5\u5177\u8D70\u5B8C\uFF08\u8C03\u7814 \u2192 \u6F84\u6E05 \u2192 \u5360\u4F4D \u2192 \u5206\u955C\u8868\u7B7E\u5B57\uFF09\u3002\u53EA\u6709\u9700\u8981\u5E76\u884C\u5B50\u4EE3\u7406\u65F6\u624D\u5199 workflow \u811A\u672C\u3002",
      "",
      "**agentic \u7684\u542B\u4E49\u662F\uFF1A\u6839\u636E\u76EE\u6807\u81EA\u4E3B\u63A8\u5BFC\u5E76\u7F16\u6392\u6D41\u7A0B\uFF0C\u800C\u4E0D\u662F\u5957\u56FA\u5B9A\u6A21\u677F\u3002** \u5185\u7F6E\u6A21\u677F\u53EA\u662F\u5148\u4F8B\uFF08prior art\uFF09\u2014\u2014\u5F53\u76EE\u6807\u3001\u7D20\u6750\u4E0E\u6A21\u677F\u4E0D\u5B8C\u5168\u5339\u914D\u65F6\uFF0C\u81EA\u5DF1\u63A8\u5BFC\u9636\u6BB5\u4E0E\u5E76\u884C\u5EA6\uFF0C\u73B0\u573A\u5199 workflow \u811A\u672C\uFF0C\u800C\u4E0D\u662F\u786C\u5957\u6A21\u677F\u3002",
      "",
      "## \u63A8\u5BFC\u6D41\u7A0B\uFF08\u6BCF\u6B21\u591A\u5355\u5143\u4EFB\u52A1\u90FD\u8D70\u4E00\u904D\uFF09",
      "",
      "1. \u76D8\u70B9\u7D20\u6750\u4E0E\u76EE\u6807\uFF08directorx_probe_media / extract_frames / view_image / canvas_get\uFF09\uFF1B",
      "2. \u63A8\u6F14\u6D41\u7A0B\u5F62\u72B6\uFF1A\u54EA\u4E9B\u9636\u6BB5\u5FC5\u987B\u4E32\u884C\uFF08\u5267\u672C\u2192\u5206\u955C\uFF09\u3001\u54EA\u4E9B\u53EF\u4EE5\u5E76\u884C\uFF08\u9010\u955C\u63D0\u793A\u8BCD/\u9010\u955C\u751F\u6210\uFF09\u3001\u54EA\u4E9B\u662F\u95F8\u95E8\uFF08preflight \u56DB\u9053\u95F8\u95E8\u3001\u8D28\u68C0 verdict\uFF09\uFF1B",
      "3. \u5199\u51FA workflow \u5DE5\u5177\u7684 meta\uFF08\u9636\u6BB5\u6807\u9898 = \u4F60\u63A8\u5BFC\u51FA\u7684\u6D41\u7A0B\uFF09+ script\uFF08\u6309\u63A8\u5BFC\u7684\u5E76\u884C\u5EA6\u7528 pipeline/parallel\uFF09\uFF1B",
      "3b. \u9010\u955C\u63D0\u793A\u8BCD\u5FC5\u586B\u627F\u63A5\u53D8\u91CF\uFF1A\u4E0A\u4E00\u955C end_state\uFF08\u753B\u9762\u6536\u5728\u54EA\uFF09\u3001\u4E0B\u4E00\u955C start_goal\uFF08\u4ECE\u54EA\u5F00\u59CB\uFF09\u3001\u8F74\u7EBF\u65B9\u5411\u3001\u6784\u56FE\u951A\u70B9\u3001\u4E3B\u4F53\u4F18\u5148\u7EA7\u2014\u2014\u76F8\u90BB\u955C\u5934\u672A\u5199\u627F\u63A5\u53D8\u91CF\u7684\u63D0\u793A\u8BCD\u4E00\u5F8B\u9000\u56DE\u91CD\u5199\uFF1B",
      "3c. \u5267\u672C\u5355\u4E00\u4E8B\u5B9E\u6E90\uFF1A\u753B\u5E03 group = beat\uFF08\u5206\u573A/\u8282\u62CD\uFF09\u3001node = shot\uFF08\u955C\u5934\uFF09\u3001\u8282\u70B9\u5C5E\u6027 = \u65C1\u767D/\u6807\u9898/\u666F\u522B/\u8FD0\u955C/\u52A8\u6548/\u65F6\u957F\u2014\u2014\u4E0E timeline JSON \u4E00\u4E00\u5BF9\u5E94\uFF0C\u6240\u6709 recipe \u5171\u7528\u540C\u4E00\u8BED\u4E49\uFF1B",
      "3d. \u8FDE\u7EBF\u8BED\u4E49 = \u751F\u6210\u65F6\u7684\u8F93\u5165\u4F9D\u8D56\uFF08\u975E\u6267\u884C\u987A\u5E8F\uFF09\uFF1Atext/group \u4E0D\u53EF\u4F5C\u8FDE\u7EBF\u76EE\u6807\uFF0Cvideo \u53EA\u80FD\u63A5\u529B\u5230 video\uFF1B\u8FDE\u7EBF\u88AB\u62D2\u65F6\u6309\u8FD4\u56DE\u7684 reason \u81EA\u7EA0\uFF1B",
      "3e. \u6392\u7247\u7EAA\u5F8B\uFF1A\u955C\u5934\u987A\u5E8F\u53EA\u4FE1 directorx_canvas_shot_order\uFF08shotIndex \u5B58\u50A8\u8EAB\u4EFD\uFF09\uFF0C\u4E0D\u9760\u5750\u6807/\u8FDE\u7EBF/\u6807\u9898\u731C\uFF1B\u4E0A\u4E0B\u6587\u5FEB\u7167\u7528 directorx_canvas_summary \u800C\u975E\u5168\u91CF JSON\uFF1B",
      "3f. \u753B\u5E03\u7EA2\u7EBF\uFF1A\u5E03\u5C40\u5750\u6807\u5FC5\u987B\u7531\u5DE5\u5177\u63A8\u5BFC\u4E0D\u4FE1\u4EFB\u6A21\u578B\u7ED9\u7684\u50CF\u7D20\u503C\uFF1Bcreate+connect \u540C\u8F6E\u5B8C\u6210\uFF1B\u4ED8\u8D39\u751F\u6210\u65E0\u786E\u8BA4\u5373\u62D2\u7EDD\uFF1B\u751F\u6210\u7ED3\u679C\u5FC5\u987B\u56DE\u62A5\u843D\u76D8\u4F4D\u7F6E\uFF1B\u53D6\u6D88/\u5931\u8D25\u5FC5\u987B\u5408\u6210\u7EC8\u6001\u9632 busy \u5361\u6B7B\uFF1B\u591A\u53D8\u4F53\u5F15\u7528\u5FC5\u987B\u9010\u8FB9\u7ED1\u5B9A\u3002",
      "4. \u6BCF\u4E2A\u5B50\u4EE3\u7406\u7684\u804C\u8D23\u5199\u8FDB\u5B83\u7684 prompt\uFF08\u7528\u54EA\u4E2A\u6280\u80FD\u3001\u54EA\u4E2A\u5DE5\u5177\u3001\u4EA7\u51FA\u4EC0\u4E48 schema\u3001\u5199\u4E0D\u5199\u753B\u5E03\uFF09\uFF1B",
      "5. \u5148 dryRun \u9A8C\u8BC1\u7F16\u6392\u96F6\u6210\u672C\u6210\u7ACB\uFF0C\u518D\u51B3\u5B9A\u662F\u5426\u8FDB\u5165\u771F\u5B9E\u751F\u6210\u3002",
      "",
      "## \u63A8\u5BFC\u793A\u4F8B\uFF08\u975E\u6A21\u677F\uFF09",
      "",
      "- \u62C9\u7247\u590D\u76D8\uFF1Aprobe \u2192 extract_frames \u62BD\u5E27 \u2192 \u9010\u5E27 view_image \u63CF\u8FF0 \u2192 canvas_batch \u5EFA\u5206\u955C\u677F\uFF08\u65E0\u751F\u6210\u9636\u6BB5\uFF09\u3002",
      "- \u6279\u91CF\u8FD4\u5DE5\uFF1Acanvas_search \u627E\u51FA\u8D28\u68C0 \u2717 \u955C\u5934 \u2192 propose \u6392\u961F\u8FD4\u5DE5\u89C4\u683C \u2192 \u7528\u6237\u6279\u51C6 \u2192 \u5E76\u884C\u751F\u6210 \u2192 \u8D28\u68C0\u590D\u6838 \u2192 concat \u91CD\u526A\u3002",
      "- \u7D20\u6750\u6CBB\u7406\uFF1A\u76EE\u5F55\u76D8\u70B9 \u2192 \u9010\u4E2A video_process \u7EDF\u4E00\u89C4\u683C \u2192 audio_beat \u627E BGM \u5207\u70B9 \u2192 concat + audio_mix \u51FA\u6210\u7247\u3002",
      "",
      "## \u5185\u7F6E\u6A21\u677F\uFF08\u5148\u4F8B\uFF0C\u6309\u9700\u88C1\u526A\uFF09",
      "",
      "1. \u8BFB\u53D6\u63D2\u4EF6\u5185\u7F6E\u6A21\u677F\uFF08\u968F\u63D2\u4EF6\u53D1\u5E03\uFF0C\u5728\u5DE5\u4F5C\u533A\u63D2\u4EF6\u76EE\u5F55\u4E0B\uFF09\uFF1A",
      "   - `workflows/directorx-pipeline.js`\uFF1A\u591A\u955C\u5934\u53D9\u4E8B\uFF08\u5267\u672C\u5206\u955C \u2192 \u63D0\u793A\u8BCD\u5DE5\u574A \u2192 \u5E76\u884C\u751F\u6210 \u2192 \u8D28\u68C0 \u2192 \u7EC4\u88C5\u6210\u7247\uFF09\uFF1B",
      "   - `workflows/directorx-talking-video.js`\uFF1A\u53E3\u64AD/\u8BB2\u89E3/\u4EA7\u54C1\u4ECB\u7ECD\u77ED\u7247\uFF08\u811A\u672C \u2192 \u914D\u97F3 tts \u2192 \u7D20\u6750 b-roll \u2192 concat \u6210\u7247 \u2192 audio_mix \u6DF7\u97F3 \u2192 srt \u5B57\u5E55\u4FA7\u8F66\uFF09\uFF1B",
      "   - `workflows/directorx-montage.js`\uFF1A\u6DF7\u526A\u5361\u70B9\uFF08\u7D20\u6750\u76D8\u70B9 \u2192 beat \u68C0\u6D4B \u2192 \u88C1\u526A \u2192 \u62FC\u63A5 \u2192 \u6DF7\u97F3\u6210\u7247\uFF09\u3002",
      "2. \u8C03\u7528 workflow \u5DE5\u5177\uFF1A",
      "   - meta.name = `directorx-pipeline`\uFF1Bmeta.phases \u6309\u6A21\u677F\u6CE8\u91CA\u58F0\u660E\uFF08\u5267\u672C\u4E0E\u5206\u955C/\u63D0\u793A\u8BCD\u5DE5\u574A/\u5E76\u884C\u751F\u6210/\u6210\u7247\u8D28\u68C0/\u7EC4\u88C5\u65B9\u6848\uFF09\u3002",
      "   - script \u7528\u6A21\u677F\u5185\u5BB9\uFF08\u6309\u9879\u76EE\u88C1\u526A\u9636\u6BB5\u4E0E schema\uFF0C\u4FDD\u6301 JSON Schema \u4EC5\u7528 type/properties/required/additionalProperties/items/enum\uFF09\u3002",
      "   - args\uFF1A`{ brief, shots?, count?, dryRun? }`\u3002dryRun=true \u53EA\u4EA7\u51FA\u5267\u672C\u4E0E\u63D0\u793A\u8BCD\u5E76\u505A\u8D28\u68C0\uFF0C\u4E0D\u82B1\u751F\u6210\u914D\u989D\u2014\u2014\u4EFB\u4F55\u65B0\u6D41\u6C34\u7EBF\u5148 dryRun\u3002",
      "3. \u5B50\u4EE3\u7406\u4F1A\u5728\u5176\u4E0A\u4E0B\u6587\u91CC\u6536\u5230 DirectorX \u7F16\u6392\u7EAA\u5F8B\uFF08directorx-subagent-orchestration\uFF09\uFF0C\u5E76\u62E5\u6709\u4E0E\u4E3B\u4EE3\u7406\u76F8\u540C\u7684\u751F\u6210\u5DE5\u5177\u4E0E\u77E5\u8BC6\u5E93\u3002",
      "",
      "## \u7F16\u6392\u7EAA\u5F8B",
      "",
      "- \u6BCF\u4E2A\u5B50\u4EE3\u7406\u53EA\u505A\u4E00\u4EF6\u4E8B\u5E76\u8FD4\u56DE\u7ED3\u6784\u5316\u62A5\u544A\uFF08\u6587\u4EF6\u8DEF\u5F84 / task id / status \u539F\u6837\u5F15\u7528\uFF09\u3002",
      "- \u951A\u70B9\uFF08\u4E3B\u4F53/\u98CE\u683C/\u5149\u7EBF/\u955C\u5934\uFF09\u5728\u300C\u5267\u672C\u4E0E\u5206\u955C\u300D\u9636\u6BB5\u4E00\u6B21\u6027\u9501\u5B9A\uFF0C\u540E\u7EED\u9636\u6BB5\u5F15\u7528\u800C\u4E0D\u65B0\u589E\u8BBE\u5B9A\u3002",
      "- \u751F\u6210\u5931\u8D25\u4E0D\u91CD\u8BD5\u7B2C\u4E09\u6B21\uFF1A\u8BB0\u5F55\u9519\u8BEF\uFF0C\u8BA9\u8D28\u68C0\u9636\u6BB5\u7ED9\u51FA\u964D\u7EA7\u8DEF\u5F84\u3002",
      "- \u7F16\u6392\u53EA\u8D1F\u8D23\u6D41\u7A0B\uFF1B\u4ED8\u8D39\u751F\u6210\u524D\u56DB\u9053\u95F8\u95E8\uFF08\u89C4\u683C/\u5185\u5BB9/\u6210\u672C/\u6743\u5229\uFF09\u7531\u751F\u6210\u6267\u884C\u5458\u6309 playbook \u786E\u8BA4\u3002",
      "- \u98CE\u683C\u9501\u5B9A\u7528 directorx_style\uFF08\u77E5\u8BC6\u5E93\u5B9E\u6587\u6CE8\u5165\u63D0\u793A\u8BCD\uFF09\uFF0C\u955C\u5934\u8BED\u8A00/\u666F\u522B\u8FD0\u955C\u540C\u6E90\uFF1B\u4E0D\u81C6\u9020\u98CE\u683C\u3002",
      "- \u7EC4\u88C5\u4F18\u5148\u786E\u5B9A\u6027\uFF1Adirectorx_video_process\uFF08\u7EDF\u4E00\u89C4\u683C\uFF09+ directorx_video_concat\uFF08xfade \u6210\u7247\uFF09\uFF0C\u4EA7\u7269\u8DEF\u5F84\u5199\u56DE\u753B\u5E03\u3002",
      "",
      "## \u753B\u5E03\u955C\u50CF\uFF08\u5FC5\u987B\uFF09",
      "",
      "\u6D41\u6C34\u7EBF\u5168\u7A0B\u628A\u9879\u76EE\u955C\u50CF\u5230\u65E0\u9650\u753B\u5E03\uFF0C\u8BA9\u7528\u6237\u5728 WebUI \u770B\u5230\u4E0E agent \u4E00\u81F4\u7684\u751F\u4EA7\u89C6\u56FE\uFF1A",
      "- \u5267\u672C\u4E0E\u5206\u955C\uFF1A\u5148\u5411\u7528\u6237\u786E\u8BA4\u8349\u6848\uFF08`directorx_confirm` / \u63D0\u95EE\uFF09\uFF0C\u901A\u8FC7\u540E\u518D `directorx_canvas_get` \u2192 `directorx_canvas_plan` \u6216\u5EFA group + \u8282\u70B9 + \u8FDE\u7EBF \u2192 `directorx_canvas_arrange`\u3002\u672A\u786E\u8BA4\u4E0D\u8981\u5F80\u753B\u5E03\u94FA\u7A7A\u5361\uFF1B",
      "- \u5E76\u884C\u751F\u6210\uFF1A\u4EA7\u7269\u8DEF\u5F84\u7528 `directorx_canvas_update` \u5199\u56DE\u5BF9\u5E94\u8282\u70B9\uFF08patch { path }\uFF0C\u5A92\u4F53\u8282\u70B9\uFF09\u6216\u66FF\u6362\u4E3A image/video \u8282\u70B9\uFF1B",
      "- \u8D28\u68C0\uFF1A\u7ED3\u8BBA\u5199\u8FDB\u8282\u70B9 label\uFF08\u5982\u300C\u955C\u59342 \u2713 / \u2717 \u91CD\u62CD\u300D\uFF09\uFF0C\u4E0D\u8981\u9759\u9ED8\u8DF3\u8FC7\u3002"
    ].join("\n"),
    source: "runtime",
    provider: "directorx",
    invocation: { modelInvocable: true, userInvocable: true }
  });
}

// src/providers/video-models.ts
import { createHmac } from "node:crypto";
function klingJwt(accessKey, secretKey) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1e3);
  const payload = Buffer.from(JSON.stringify({ iss: accessKey, exp: now + 1800, nbf: now - 5 })).toString("base64url");
  const signature = createHmac("sha256", secretKey).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}
function clampDuration(seconds, fallback, min, max) {
  const value = Math.round(seconds ?? fallback);
  return String(Math.min(max, Math.max(min, value)));
}
function runwayRatio(aspectRatio) {
  const table = {
    "16:9": "1280:720",
    "9:16": "720:1280",
    "1:1": "960:960",
    "4:3": "1104:832",
    "3:4": "832:1104",
    "21:9": "1584:672"
  };
  const key = aspectRatio ?? "16:9";
  return table[key] ?? (/\d+:\d+/.test(key) ? key : "1280:720");
}
async function recordTask(ledger, taskId, ctx, prompt, state, extra = {}) {
  if (ledger === void 0) return;
  await ledger.append({
    taskId,
    model: ctx.capability.model,
    mode: ctx.capability.mode,
    prompt,
    state,
    at: Date.now(),
    ...extra.files !== void 0 ? { files: extra.files } : {},
    ...extra.urls !== void 0 ? { urls: extra.urls } : {},
    ...extra.error !== void 0 ? { error: extra.error } : {}
  }).catch(() => {
  });
}
async function downloadFirst(urls, ctx, prompt) {
  const files = [];
  for (const url of urls) {
    files.push({ url });
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, slugify(prompt), ".mp4");
      files[0] = { path, url, mimeType: "video/mp4" };
    }
  }
  return files;
}
async function klingImagePayload(source) {
  const dataUrl = await mediaSourceToDataUrl(source);
  const match = dataUrl.match(/^data:[^;]+;base64,(.*)$/);
  if (match !== null) return match[1];
  return dataUrl;
}
async function klingVideo(ctx, prompt, options) {
  const ak = ctx.capability.auth.klingAk;
  const sk = ctx.capability.auth.klingSk;
  if (ak === "" || sk === "") {
    throw new Error("Kling \u6A21\u5F0F\u9700\u8981\u53EF\u7075 AccessKey / SecretKey\uFF1ASettings \u2192 DirectorX \u2192 \u89C6\u9891\u751F\u6210\u9009\u62E9 kling \u6A21\u5F0F\u540E\u586B\u5199");
  }
  const base = ctx.capability.baseURL.replace(/\/+$/, "");
  const token = klingJwt(ak, sk);
  const isImageToVideo = options.firstFramePath !== void 0;
  const kindPath = isImageToVideo ? "image2video" : "text2video";
  const payload = {
    model_name: ctx.capability.model !== "" ? ctx.capability.model : "kling-v3",
    prompt,
    mode: "std",
    duration: clampDuration(options.seconds, 5, 5, 15),
    aspect_ratio: options.aspectRatio ?? "16:9"
  };
  if (options.generateAudio === true) payload.generate_audio = true;
  if (options.voiceIds !== void 0 && options.voiceIds.length > 0) payload.voice_ids = options.voiceIds;
  if (isImageToVideo) {
    payload.image = await klingImagePayload(options.firstFramePath);
    if (options.lastFramePath !== void 0) payload.image_tail = await klingImagePayload(options.lastFramePath);
  }
  if (options.negativePrompt !== void 0 && options.negativePrompt !== "") payload.negative_prompt = options.negativePrompt;
  if (options.cameraControl !== void 0) payload.camera_control = options.cameraControl;
  const response = await fetch(`${base}/v1/videos/${kindPath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: ctx.signal
  });
  const body = await readJsonResponse(response);
  const taskId = body.data?.task_id;
  if (!response.ok || body.code !== 0 || taskId === void 0) {
    throw new Error(`Kling creation failed (HTTP ${response.status}, code ${body.code}): ${body.message ?? JSON.stringify(body).slice(0, 300)}`);
  }
  await recordTask(ctx.ledger, taskId, ctx, prompt, "submitted");
  const settings = ctx.settings;
  for (let attempt = 0; attempt < settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error("Kling polling cancelled");
    if (ctx.ledger !== void 0 && await ctx.ledger.isCancelled(taskId)) {
      throw new Error(`Task ${taskId} was cancelled via directorx_cancel_task`);
    }
    await new Promise((resolve13) => setTimeout(resolve13, settings.pollIntervalMs));
    const statusResponse = await fetch(`${base}/v1/videos/${kindPath}/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctx.signal
    });
    const statusBody = await readJsonResponse(statusResponse);
    const state = (statusBody.data?.task_status ?? "").toLowerCase();
    if (state === "succeed" || state === "success") {
      const urls = (statusBody.data?.task_result?.videos ?? []).map((video) => video.url).filter((url) => typeof url === "string" && url !== "");
      if (urls.length === 0) throw new Error(`Kling task ${taskId} succeeded but returned no video URLs`);
      const files = await downloadFirst(urls, ctx, prompt);
      await recordTask(ctx.ledger, taskId, ctx, prompt, "succeeded", { files, urls });
      return { model: ctx.capability.model, prompt, taskId, status: "succeed", files, mode: "kling" };
    }
    if (state === "failed" || state === "fail") {
      const message = statusBody.data?.task_status_msg ?? "unknown error";
      await recordTask(ctx.ledger, taskId, ctx, prompt, "failed", { error: message });
      throw new Error(`Kling task ${taskId} failed: ${message}`);
    }
  }
  throw new Error(`Kling task ${taskId} did not finish within ${settings.maxPollAttempts * settings.pollIntervalMs}ms`);
}
async function runwayVideo(ctx, prompt, options) {
  const base = ctx.capability.baseURL.replace(/\/+$/, "");
  const apiKey = ctx.capability.apiKey;
  if (apiKey === "") {
    throw new Error("Runway \u6A21\u5F0F\u9700\u8981 API Key\uFF1ASettings \u2192 DirectorX \u2192 \u89C6\u9891\u751F\u6210\u9009\u62E9 runway \u6A21\u5F0F\u540E\u586B\u5199");
  }
  const version = ctx.capability.auth.runwayVersion;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...version !== "" ? { "x-runway-version": version } : {}
  };
  const isImageToVideo = options.firstFramePath !== void 0;
  const payload = {
    model: ctx.capability.model !== "" ? ctx.capability.model : "gen4.5",
    promptText: prompt,
    duration: options.seconds !== void 0 && options.seconds > 0 ? Math.min(10, Math.max(2, Math.round(options.seconds))) : 5,
    ratio: runwayRatio(options.aspectRatio)
  };
  if (isImageToVideo) {
    const firstUri = await mediaSourceToDataUrl(options.firstFramePath);
    const first = { uri: firstUri, position: "first" };
    if (options.lastFramePath !== void 0 && (ctx.capability.model === "gen4.5" || ctx.capability.model.startsWith("gen4.5"))) {
      throw new Error("Runway gen4.5 \u56FE\u751F\u89C6\u9891\u4EC5\u652F\u6301\u9996\u5E27\uFF08\u65E0\u5C3E\u5E27\uFF09\u3002\u8BF7\u6539\u7528\u652F\u6301\u9996\u5C3E\u5E27\u7684\u6A21\u578B\uFF08\u5982 gen-4\uFF09\uFF0C\u6216\u53BB\u6389 last_frame_path\u3002");
    }
    if (options.lastFramePath !== void 0) {
      const lastUri = await mediaSourceToDataUrl(options.lastFramePath);
      payload.promptImage = [first, { uri: lastUri, position: "last" }];
    } else {
      payload.promptImage = first;
    }
  }
  const response = await fetch(`${base}/v1/${isImageToVideo ? "image_to_video" : "text_to_video"}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: ctx.signal
  });
  const body = await readJsonResponse(response);
  if (!response.ok || body.id === void 0) {
    throw new Error(`Runway creation failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 300)}`);
  }
  const taskId = body.id;
  await recordTask(ctx.ledger, taskId, ctx, prompt, "submitted");
  const settings = ctx.settings;
  for (let attempt = 0; attempt < settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error("Runway polling cancelled");
    if (ctx.ledger !== void 0 && await ctx.ledger.isCancelled(taskId)) {
      throw new Error(`Task ${taskId} was cancelled via directorx_cancel_task`);
    }
    await new Promise((resolve13) => setTimeout(resolve13, settings.pollIntervalMs));
    const statusResponse = await fetch(`${base}/v1/tasks/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}`, ...version !== "" ? { "x-runway-version": version } : {} },
      signal: ctx.signal
    });
    const statusBody = await readJsonResponse(statusResponse);
    const state = (statusBody.status ?? "").toUpperCase();
    if (state === "SUCCEEDED") {
      const urls = (statusBody.output ?? []).filter((url) => typeof url === "string" && url !== "");
      if (urls.length === 0) throw new Error(`Runway task ${taskId} succeeded but returned no URLs`);
      const files = await downloadFirst(urls, ctx, prompt);
      await recordTask(ctx.ledger, taskId, ctx, prompt, "succeeded", { files, urls });
      return { model: ctx.capability.model, prompt, taskId, status: "SUCCEEDED", files, mode: "runway" };
    }
    if (state === "FAILED") {
      const message = statusBody.failure ?? statusBody.failureCode ?? "unknown error";
      await recordTask(ctx.ledger, taskId, ctx, prompt, "failed", { error: message });
      throw new Error(`Runway task ${taskId} failed: ${message}`);
    }
  }
  throw new Error(`Runway task ${taskId} did not finish within ${settings.maxPollAttempts * settings.pollIntervalMs}ms`);
}

// src/settings-test.ts
var TEST_ROUTE_PATH = "/directorx/settings/test";
function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}
async function readJsonBody(request) {
  let raw = "";
  for await (const chunk of request) raw += String(chunk);
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function registerSettingsTestRoute(ctx, getSettings) {
  const webServer = ctx.get("webServer");
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: TEST_ROUTE_PATH,
    handler: async (request, response) => {
      if (request.method !== "POST") {
        sendJson(response, 405, { ok: false, message: "method not allowed" });
        return;
      }
      try {
        const body = await readJsonBody(request);
        const capability2 = String(body.capability ?? "");
        const settings = getSettings();
        const profile = settings[capability2];
        if (profile === void 0) {
          sendJson(response, 400, { ok: false, message: `\u672A\u77E5\u80FD\u529B "${capability2}"\uFF08\u53EF\u9009 vision/image/video/audio\uFF09` });
          return;
        }
        const ENV_NAMES = {
          vision: ["DIRECTORX_VISION_API_KEY"],
          image: ["DIRECTORX_IMAGE_API_KEY"],
          video: ["DIRECTORX_VIDEO_API_KEY"],
          audio: ["DIRECTORX_AUDIO_API_KEY"]
        };
        if (profile.mode === "mock") {
          sendJson(response, 200, { ok: true, message: "mock \u6A21\u5F0F\uFF1A\u65E0\u7F51\u7EDC\u8BF7\u6C42\uFF0C\u59CB\u7EC8\u53EF\u7528" });
          return;
        }
        const baseURL = profile.baseURL.trim().replace(/\/+$/, "");
        let key = "";
        try {
          key = apiKeyOf(profile.apiKey, ENV_NAMES[capability2] ?? [], baseURL);
        } catch {
          sendJson(response, 200, { ok: false, message: "\u672A\u627E\u5230 API Key\uFF08\u68C0\u67E5\u8BBE\u7F6E\u6216\u73AF\u5883\u53D8\u91CF\uFF09" });
          return;
        }
        if (key === "") {
          sendJson(response, 200, { ok: false, message: "\u672A\u627E\u5230 API Key\uFF08\u68C0\u67E5\u8BBE\u7F6E\u6216\u73AF\u5883\u53D8\u91CF\uFF09" });
          return;
        }
        try {
          if (capability2 === "video" && profile.mode === "kling") {
            const auth = profile;
            const ak = auth.auth?.klingAk ?? "";
            const sk = auth.auth?.klingSk ?? "";
            if (ak === "" || sk === "") {
              sendJson(response, 200, { ok: false, message: "\u53EF\u7075\u6A21\u5F0F\u9700\u8981 AK \u4E0E SK" });
              return;
            }
            klingJwt(ak, sk);
            sendJson(response, 200, { ok: true, message: `JWT \u7B7E\u53D1\u6210\u529F\uFF08${ak.slice(0, 6)}\u2026\uFF09` });
            return;
          }
          if (capability2 === "video" && profile.mode === "runway") {
            const probe2 = await fetch(`${baseURL}/v1/tasks?limit=1`, {
              headers: { authorization: `Bearer ${key}`, "x-runway-version": "2024-11-06" },
              signal: AbortSignal.timeout(12e3)
            });
            sendJson(response, 200, probe2.status === 200 ? { ok: true, message: "Runway \u9274\u6743\u901A\u8FC7\uFF08tasks \u5217\u8868\u53EF\u8BBF\u95EE\uFF09" } : { ok: false, message: `Runway \u8FD4\u56DE HTTP ${probe2.status}` });
            return;
          }
          const probe = await fetch(`${baseURL}/models`, {
            headers: { authorization: `Bearer ${key}` },
            signal: AbortSignal.timeout(12e3)
          });
          if (probe.status === 200) {
            const text = await probe.text().catch(() => "");
            try {
              const data = JSON.parse(text);
              const count = Array.isArray(data.data) ? data.data.length : Array.isArray(data.models) ? data.models.length : 0;
              sendJson(response, 200, { ok: true, message: `\u9274\u6743\u901A\u8FC7\uFF0C\u6A21\u578B\u5217\u8868\u53EF\u8BBF\u95EE\uFF08${count} \u4E2A\u6A21\u578B\uFF09` });
            } catch {
              sendJson(response, 200, { ok: true, message: "\u7AEF\u70B9\u54CD\u5E94\u6B63\u5E38\uFF08HTTP 200\uFF09" });
            }
            return;
          }
          sendJson(response, 200, { ok: false, message: probe.status === 401 || probe.status === 403 ? `HTTP ${probe.status}\uFF1A\u9274\u6743\u88AB\u62D2\u7EDD\uFF08\u68C0\u67E5 Key \u4E0E Base URL\uFF09` : `HTTP ${probe.status}\uFF1A\u7AEF\u70B9\u5F02\u5E38` });
        } catch (cause) {
          sendJson(response, 200, { ok: false, message: cause instanceof Error ? cause.message : String(cause) });
        }
      } catch (error) {
        sendJson(response, 400, { ok: false, message: error instanceof Error ? error.message : String(error) });
      }
    }
  });
}

// src/providers/preflight.ts
var COMMON_SIZES = ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"];
var COMMON_VIDEO_SIZES = ["720p", "1080p", "2k", "1280x720", "1920x1080"];
var ELEMENTS = [
  { name: "\u4E3B\u4F53", keywords: ["\u4EBA", "\u89D2\u8272", "\u4EBA\u7269", "\u4E3B\u89D2", "\u52A8\u7269", "\u4EA7\u54C1", "\u8F66", "\u5EFA\u7B51", "\u673A\u68B0", "\u732B", "\u72D7", "\u6F14\u5458", "\u5973\u5B69", "\u7537\u5B69", "\u7537\u4EBA", "\u5973\u4EBA"] },
  { name: "\u52A8\u4F5C", keywords: ["\u8D70", "\u8DD1", "\u8DF3", "\u8F6C\u8EAB", "\u56DE\u5934", "\u7B11", "\u98DE", "\u6D41", "\u843D", "\u5347\u8D77", "\u65CB\u8F6C", "\u63A8\u8FDB", "\u79FB\u52A8", "\u821E", "\u6253", "\u63E1", "\u62FF\u8D77", "\u5954\u8DD1"] },
  { name: "\u573A\u666F", keywords: ["\u8857", "\u5DF7", "\u57CE\u5E02", "\u5C71", "\u6D77", "\u623F\u95F4", "\u68EE\u6797", "\u5929\u7A7A", "\u6C99\u6F20", "\u529E\u516C\u5BA4", "\u821E\u53F0", "\u96E8", "\u591C", "\u5BA4\u5185", "\u6237\u5916"] },
  { name: "\u5149\u7EBF", keywords: ["\u5149", "\u706F", "\u9006\u5149", "\u4FA7\u5149", "\u9713\u8679", "\u9633\u5149", "\u6708\u5149", "\u6697", "\u9634\u5F71", "\u66DD\u5149", "\u6696\u5149", "\u51B7\u5149"] },
  { name: "\u98CE\u683C", keywords: ["\u98CE\u683C", "\u7535\u5F71\u611F", "\u5199\u5B9E", "\u8D5B\u535A", "\u4E8C\u6B21\u5143", "\u5361\u901A", "\u6CB9\u753B", "\u6C34\u58A8", "\u80F6\u7247", "\u7EAA\u5B9E", "\u5E7F\u544A", "\u9AD8\u5BF9\u6BD4"] },
  { name: "\u8D1F\u9762\u8BCD", keywords: ["\u7981\u6B62", "\u4E0D\u8981", "\u907F\u514D", "\u65E0\u6C34\u5370", "\u65E0\u5B57\u5E55", "\u4E0D\u53D8\u5F62"] }
];
var IP_FLAGS = [
  { name: "\u771F\u4EBA\u8096\u50CF", keywords: ["\u660E\u661F", "\u5468\u6770\u4F26", "\u5218\u4EA6\u83F2", "\u6768\u5E42", "\u6210\u9F99", "\u9A6C\u65AF\u514B", "\u9A6C\u4E91"] },
  { name: "\u54C1\u724C/IP", keywords: ["\u7C73\u5947", "\u7C73\u8001\u9F20", "\u8FEA\u58EB\u5C3C", "\u54C8\u5229\u6CE2\u7279", "\u5965\u7279\u66FC", "\u76AE\u5361\u4E18", "Hello Kitty", "\u4E50\u9AD8", "\u8010\u514B", "Nike", "\u82F9\u679Clogo"] },
  { name: "\u97F3\u4E50\u7248\u6743", keywords: ["\u5468\u6770\u4F26\u7684\u6B4C", "\u539F\u58F0\u5E26", "\u7FFB\u5531", "\u91C7\u6837"] },
  { name: "\u98CE\u683C\u6A21\u4EFF", keywords: ["\u5BAB\u5D0E\u9A8F\u98CE\u683C", "\u5409\u535C\u529B\u98CE\u683C", "\u65B0\u6D77\u8BDA\u98CE\u683C", "\u68B5\u9AD8\u98CE\u683C"] }
];
function preflight(input) {
  const prompt = (input.prompt ?? "").trim();
  const gates = {
    spec: { pass: true, issues: [], notes: [] },
    content: { pass: true, issues: [], notes: [] },
    cost: { pass: false, issues: [], notes: [] },
    rights: { pass: true, issues: [], notes: [] }
  };
  if (prompt === "") gates.spec.issues.push("\u63D0\u793A\u8BCD\u4E3A\u7A7A");
  if (input.type === "video" && input.duration !== void 0 && (input.duration < 1 || input.duration > 30)) {
    gates.spec.issues.push(`\u89C6\u9891\u65F6\u957F ${input.duration}s \u8D85\u51FA\u5E38\u89C4\uFF081\u201330s \u9700\u4E0E\u7528\u6237\u786E\u8BA4\uFF09`);
  }
  if (input.size !== void 0 && input.size !== "") {
    const normalized = input.size.toLowerCase();
    if (!COMMON_SIZES.includes(normalized) && !COMMON_VIDEO_SIZES.includes(normalized)) {
      gates.spec.issues.push(`\u5C3A\u5BF8 "${input.size}" \u4E0D\u662F\u5E38\u89C1\u679A\u4E3E\uFF08${COMMON_SIZES.join("/")}\uFF09`);
    }
  }
  if (input.model !== void 0 && input.model !== "") {
    gates.spec.notes.push(`\u6A21\u578B ${input.model}\uFF1A\u4EE5 directorx_knowledge_search \u6838\u5B9E\u8BE5\u6A21\u578B\u89C4\u683C\u540E\u518D\u63D0\u4EA4`);
  }
  gates.spec.pass = gates.spec.issues.length === 0;
  for (const element of ELEMENTS) {
    if (!element.keywords.some((keyword) => prompt.includes(keyword))) {
      gates.content.issues.push(`\u7F3A\u5C11${element.name}\u8981\u7D20`);
    }
  }
  if (prompt.length > 0 && prompt.length < 12) gates.content.issues.push("\u63D0\u793A\u8BCD\u8FC7\u77ED\uFF0C\u4FE1\u606F\u4E0D\u8DB3");
  if (input.userConfirmedContent === true) gates.content.notes.push("\u5185\u5BB9\u5DF2\u7ECF\u7528\u6237\u786E\u8BA4");
  else gates.content.notes.push("\u5185\u5BB9\u95F8\u95E8\u9700\u8981\u7528\u6237\u786E\u8BA4\u811A\u672C/\u63D0\u793A\u8BCD\uFF08\u672A\u786E\u8BA4\u5219\u5148\u751F\u6210\u5360\u4F4D\u8BA1\u5212\uFF09");
  gates.content.pass = gates.content.issues.length === 0;
  const count = input.count ?? 1;
  gates.cost.issues.push(`\u9884\u8BA1\u751F\u6210 ${count} \u6B21\uFF1B\u672C\u63D2\u4EF6\u65E0\u6A21\u578B\u4EF7\u76EE\u8868\u2014\u2014\u9700\u4E0E\u7528\u6237\u786E\u8BA4\u9884\u7B97\u4E0A\u9650\u4E0E\u5931\u8D25\u91CD\u8BD5\u7B56\u7565\uFF08\u5148 mock/\u4F4E\u6863\u9A8C\u8BC1\u6784\u56FE\uFF0C\u518D\u4ED8\u8D39\uFF09`);
  if (input.userConfirmedBudget === true) {
    gates.cost.issues.length = 0;
    gates.cost.notes.push("\u9884\u7B97\u5DF2\u7ECF\u7528\u6237\u786E\u8BA4");
    gates.cost.pass = true;
  }
  for (const flag of IP_FLAGS) {
    if (flag.keywords.some((keyword) => prompt.includes(keyword))) {
      gates.rights.issues.push(`\u53EF\u80FD\u6D89\u53CA${flag.name}\u6388\u6743\uFF1A\u786E\u8BA4\u6743\u5229\u8303\u56F4\u5185\u518D\u751F\u6210`);
    }
  }
  gates.rights.pass = gates.rights.issues.length === 0;
  const pass = gates.spec.pass && gates.content.pass && gates.cost.pass && gates.rights.pass;
  return {
    gates,
    verdict: pass ? "pass" : "review",
    summary: pass ? "\u56DB\u9053\u95F8\u95E8\u901A\u8FC7\uFF0C\u53EF\u63D0\u4EA4\u751F\u6210\u3002" : "\u5B58\u5728\u5F85\u529E\u95F8\u95E8\uFF1A\u5148\u4FEE\u590D issues\uFF08\u6216\u4E0E\u7528\u6237\u786E\u8BA4\uFF09\uFF0C\u6309 directorx-playbook \u5148\u5360\u4F4D\u540E\u751F\u6210\u3002"
  };
}

// src/providers/video-process.ts
import { spawnSync as spawnSync3 } from "node:child_process";
import { mkdir as mkdir11 } from "node:fs/promises";
import { existsSync as existsSync4, renameSync, rmSync } from "node:fs";
import { join as join15 } from "node:path";

// src/providers/ffmpeg.ts
import { spawnSync as spawnSync2 } from "node:child_process";
import { mkdir as mkdir10 } from "node:fs/promises";
import { join as join14 } from "node:path";
function parseFps(rate) {
  const parts = rate.split("/").map(Number);
  if (parts.length === 2 && parts[1] > 0 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
    return Number((parts[0] / parts[1]).toFixed(3));
  }
  const direct = Number(rate);
  return Number.isFinite(direct) && direct > 0 ? direct : 24;
}
function requireBinary(command) {
  const found = spawnSync2("which", [command], { encoding: "utf8" });
  if (found.status !== 0 || found.stdout.trim() === "") {
    throw new Error(`${command} is required for this operation but was not found on PATH. Install ffmpeg (brew install ffmpeg) or use the model-provider tools instead.`);
  }
  return command;
}
function probeMedia(source) {
  requireBinary("ffprobe");
  const result = spawnSync2("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    source
  ], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`ffprobe failed: ${result.stderr?.slice(-400) || `exit ${result.status}`}`);
  }
  const parsed = JSON.parse(result.stdout);
  const compactStreams = (parsed.streams ?? []).map((stream) => ({
    type: stream.codec_type,
    codec: stream.codec_name,
    ...stream.width !== void 0 ? { width: stream.width } : {},
    ...stream.height !== void 0 ? { height: stream.height } : {},
    ...stream.r_frame_rate !== void 0 ? { fps: parseFps(String(stream.r_frame_rate)) } : {},
    ...stream.channels !== void 0 ? { channels: stream.channels } : {},
    ...stream.sample_rate !== void 0 ? { sampleRate: stream.sample_rate } : {}
  }));
  return {
    source,
    format: parsed.format?.format_name ?? "unknown",
    durationSec: Number(parsed.format?.duration ?? 0),
    sizeBytes: Number(parsed.format?.size ?? 0),
    streams: compactStreams
  };
}
async function extractFrames(source, outputDir, options = {}) {
  requireBinary("ffmpeg");
  const dir = join14(resolveOutputDir(outputDir), "frames");
  await mkdir10(dir, { recursive: true });
  const stem = slugify(source, 24);
  const times = [];
  if (options.at !== void 0 && options.at.length > 0) {
    for (const t of options.at) if (Number.isFinite(t) && t >= 0) times.push(t);
  } else {
    const info = probeMedia(source);
    const count = Math.min(24, Math.max(1, Math.round(options.count ?? 4)));
    for (let i = 0; i < count; i += 1) {
      times.push(info.durationSec * (i + 0.5) / count);
    }
  }
  const files = [];
  for (const t of times) {
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
    const path = join14(dir, `${stem}-${stamp}-${t.toFixed(2)}s.png`);
    const result = spawnSync2("ffmpeg", [
      "-y",
      "-ss",
      String(t),
      "-i",
      source,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      path
    ], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(`ffmpeg frame extraction failed at ${t}s: ${result.stderr?.slice(-400) || `exit ${result.status}`}`);
    }
    files.push({ path, mimeType: "image/png" });
  }
  return files;
}

// src/providers/video-process.ts
function runFfmpeg(args, what) {
  let outputIndex = -1;
  for (let index = args.length - 1; index >= 0; index -= 1) {
    const arg = args[index];
    if (arg !== void 0 && !arg.startsWith("-")) {
      outputIndex = index;
      break;
    }
  }
  const finalArgs = [...args];
  const dot = outputIndex >= 0 ? args[outputIndex].lastIndexOf(".") : -1;
  const tempPath = outputIndex >= 0 && dot > 0 ? `${args[outputIndex].slice(0, dot)}.tmp-${Date.now().toString(36)}${args[outputIndex].slice(dot)}` : void 0;
  if (outputIndex >= 0 && tempPath !== void 0) finalArgs[outputIndex] = tempPath;
  const result = spawnSync3("ffmpeg", ["-hide_banner", "-y", ...finalArgs], { encoding: "utf8" });
  if (result.status !== 0) {
    if (tempPath !== void 0) rmSync(tempPath, { force: true });
    throw new Error(`${what} failed: ${result.stderr?.slice(-600) || `exit ${result.status}`}`);
  }
  if (outputIndex >= 0 && tempPath !== void 0) {
    renameSync(tempPath, args[outputIndex]);
  }
}
function outputPath(outputDir, tag, ext) {
  const root = resolveOutputDir(outputDir);
  mkdir11(root, { recursive: true }).catch(() => {
  });
  return join15(root, `${slugify(tag)}-${Date.now().toString(36)}.${ext}`);
}
async function videoProcess(input) {
  const out = outputPath(input.outputDir, "processed", "mp4");
  const videoFilters = [];
  const audioFilters = [];
  if (input.start !== void 0 || input.end !== void 0) {
    const start = input.start ?? 0;
    const end = input.end !== void 0 ? `:end=${input.end}` : "";
    videoFilters.push(`trim=start=${start}${end},setpts=PTS-STARTPTS`);
    audioFilters.push(`atrim=start=${start}${end},asetpts=PTS-STARTPTS`);
  }
  if (input.speed !== void 0 && input.speed > 0 && input.speed !== 1) {
    const speed = input.speed;
    videoFilters.push(`setpts=${(1 / speed).toFixed(4)}*PTS`);
    let remaining = speed;
    const atempoParts = [];
    while (remaining > 2.0001) {
      atempoParts.push("atempo=2.0");
      remaining /= 2;
    }
    while (remaining < 0.4999) {
      atempoParts.push("atempo=0.5");
      remaining /= 0.5;
    }
    atempoParts.push(`atempo=${Math.min(2, Math.max(0.5, remaining)).toFixed(4)}`);
    audioFilters.push(...atempoParts);
  }
  if (input.scale !== void 0 && input.scale !== "") {
    videoFilters.push(`scale=${input.scale}`);
  }
  if (input.fps !== void 0 && input.fps > 0) {
    videoFilters.push(`fps=${input.fps}`);
  }
  if (input.crop !== void 0 && input.crop !== "") {
    const parts = input.crop.split(":").map(Number);
    if (parts.length === 4 && parts.every((part) => Number.isFinite(part) && part >= 0)) {
      videoFilters.push(`crop=${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}`);
    }
  }
  if (input.rotate !== void 0) {
    if (input.rotate === 90) videoFilters.push("transpose=1");
    if (input.rotate === 180) videoFilters.push("transpose=1,transpose=1");
    if (input.rotate === 270) videoFilters.push("transpose=2");
  }
  if (input.hflip === true) videoFilters.push("hflip");
  if (input.vflip === true) videoFilters.push("vflip");
  if (input.filters !== void 0) {
    for (const filter of input.filters) {
      const name2 = filter.name.trim();
      let value = filter.value;
      if (name2 === "eq") {
        const nums = value.split(":").map(Number);
        const clamped = nums.map((num) => Number.isFinite(num) ? Math.max(-1, Math.min(1, num)) : 0);
        value = clamped.join(":");
      } else if (name2 === "gblur") {
        const sigma = Number(value);
        value = String(Number.isFinite(sigma) ? Math.max(0, Math.min(50, sigma)) : 1);
      } else if (name2 === "noise") {
        const amount = Number(value);
        value = String(Number.isFinite(amount) ? Math.max(0, Math.min(100, amount)) : 10);
      } else if (name2 === "vignette") {
        const angle = value.replace(/^angle=/, "");
        const degrees = Number(angle);
        value = `angle=${String(Number.isFinite(degrees) ? Math.max(0, Math.min(360, degrees)) : 180)}`.replace(/^angle=0$/, "angle=PI*0");
      }
      videoFilters.push(`${name2}=${value}`);
    }
  }
  if (input.reverse === true) {
    videoFilters.push("reverse");
    audioFilters.push("areverse");
  }
  if (input.freezeEnd !== void 0 && input.freezeEnd > 0) {
    videoFilters.push(`tpad=stop_mode=clone:stop_duration=${input.freezeEnd}`);
    audioFilters.push(`apad=pad_dur=${input.freezeEnd}`);
  }
  if (input.freezeStart !== void 0 && input.freezeStart > 0) {
    videoFilters.push(`tpad=start_mode=clone:start_duration=${input.freezeStart}`);
    audioFilters.push(`apad=pad_dur=${input.freezeStart}`);
  }
  if (input.mute === true) {
    audioFilters.length = 0;
  } else if (input.volume !== void 0) {
    audioFilters.push(`volume=${input.volume}`);
  }
  if (input.lut3d !== void 0 && input.lut3d !== "") {
    if (!existsSync4(input.lut3d)) throw new Error(`LUT \u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${input.lut3d}`);
    const interp = input.lut3dInterp ?? "tetrahedral";
    videoFilters.push(`lut3d=file=${input.lut3d.replace(/[,;\\]/g, "")}:interp=${interp}`);
  }
  if (input.restore === "upscale-sharp") {
    videoFilters.push("scale=iw*2:ih*2:flags=lanczos,unsharp=5:5:0.6:5:5:0.0,cas=0.4");
  } else if (input.restore === "denoise") {
    videoFilters.push("hqdn3d=1.5:1.5:6:6,tmix=frames=3:weights=1 2 1");
  }
  if (input.delogo !== void 0 && /^\d+:\d+:\d+:\d+$/.test(input.delogo)) {
    videoFilters.push(`delogo=x=${input.delogo.split(":")[0]}:y=${input.delogo.split(":")[1]}:w=${input.delogo.split(":")[2]}:h=${input.delogo.split(":")[3]}`);
  }
  if (input.grade !== void 0) {
    videoFilters.push(gradeFilter(input.grade));
  }
  const args = ["-i", input.source];
  if (videoFilters.length > 0) args.push("-vf", videoFilters.join(","));
  if (audioFilters.length > 0) args.push("-af", audioFilters.join(","));
  if (input.mute === true) args.push("-an");
  if (input.textOverlays !== void 0 && input.textOverlays.length > 0) {
    for (const overlay of input.textOverlays) {
      const escaped = overlay.text.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/,/g, "\\,").replace(/%/g, "\\%").replace(/'/g, "\\'");
      const options = [
        `text='${escaped}'`,
        ...overlay.x !== void 0 && overlay.x !== "" ? [`x=${overlay.x}`] : [],
        ...overlay.y !== void 0 && overlay.y !== "" ? [`y=${overlay.y}`] : [],
        ...overlay.fontSize !== void 0 && overlay.fontSize > 0 ? [`fontsize=${overlay.fontSize}`] : [],
        ...overlay.color !== void 0 && overlay.color !== "" ? [`fontcolor=${overlay.color}`] : [],
        ...overlay.borderColor !== void 0 && overlay.borderColor !== "" ? [`bordercolor=${overlay.borderColor}`] : [],
        ...overlay.borderWidth !== void 0 && overlay.borderWidth > 0 ? [`borderw=${overlay.borderWidth}`] : [],
        ...overlay.backgroundColor !== void 0 && overlay.backgroundColor !== "" ? [`box=1:boxcolor=${overlay.backgroundColor}@0.6:boxborderw=8`] : [],
        ...overlay.fontFile !== void 0 && overlay.fontFile !== "" ? [`fontfile=${overlay.fontFile}`] : []
      ];
      videoFilters.push(`drawtext=${options.join(":")}`);
    }
  }
  if (input.extractAudio === true) {
    const audioOut = out.replace(/\.mp4$/, ".m4a");
    args.push("-vn", "-c:a", "aac", audioOut);
    runFfmpeg(args, "audio extract");
    return { path: audioOut, mimeType: "video/mp4", probe: probeMedia(audioOut) };
  }
  args.push("-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac", out);
  runFfmpeg(args, "video process");
  return { path: out, mimeType: "video/mp4", probe: probeMedia(out) };
}
async function videoConcat(input) {
  if (input.files.length < 2) throw new Error("videoConcat needs at least 2 files");
  const out = outputPath(input.outputDir, "concat", "mp4");
  const fadeSec = input.fadeSec ?? 0.5;
  const scale = input.scale ?? "1280:720";
  const XFADE_WHITELIST = /* @__PURE__ */ new Set(["fade", "dissolve", "fadeblack", "fadewhite", "wipeleft", "wiperight", "wipeup", "wipedown", "slideleft", "slideright", "slideup", "slidedown", "circlecrop", "rectcrop", "distance", "radial", "smoothleft", "smoothright", "smoothup", "smoothdown", "circleopen", "circleclose", "vertopen", "vertclose", "horzopen", "horzclose", "pixelize", "diagtl", "diagtr", "diagbl", "diagbr", "hlslice", "hrslice", "vuslice", "vdslice", "hblur", "fadegrays", "wipetl", "wipetr", "wipebl", "wipebr", "squeezeh", "squeezev", "zoomin", "hlwind", "hrwind", "vuwind", "vdwind", "coverleft", "coverright", "coverup", "coverdown", "revealleft", "revealright", "revealup", "revealdown"]);
  const perPairTransitions = Array.isArray(input.transition) ? input.transition : void 0;
  if (input.transition === "cut" || fadeSec <= 0) {
    const probes2 = input.files.map((file) => probeMedia(file));
    const anyAudio2 = probes2.some((probe) => probe.streams.some((stream) => stream.type === "audio"));
    const args2 = [];
    const filters2 = [];
    input.files.forEach((file, index) => {
      args2.push("-i", file);
      const hasAudio = probes2[index].streams.some((stream) => stream.type === "audio");
      if (anyAudio2) {
        filters2.push(`[${index}:v]scale=${scale},fps=30,setpts=PTS-STARTPTS[v${index}];${hasAudio ? `[${index}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${index}]` : `anullsrc=channel_layout=stereo:sample_rate=48000[a${index}]`}`);
      } else {
        filters2.push(`[${index}:v]scale=${scale},fps=30,setpts=PTS-STARTPTS[v${index}]`);
      }
    });
    const inputs = anyAudio2 ? input.files.map((_, index) => `[v${index}][a${index}]`).join("") : input.files.map((_, index) => `[v${index}]`).join("");
    const filterComplex2 = `${filters2.join(";")};${inputs}concat=n=${input.files.length}:v=1:a=${anyAudio2 ? 1 : 0}${anyAudio2 ? "[v][a]" : "[v]"}`;
    args2.push("-filter_complex", filterComplex2, "-map", "[v]", "-c:v", "libx264", "-preset", "veryfast");
    if (anyAudio2) args2.push("-map", "[a]", "-c:a", "aac");
    args2.push(out);
    runFfmpeg(args2, "video concat (cut)");
    return { path: out, mimeType: "video/mp4", probe: probeMedia(out) };
  }
  const probes = input.files.map((file) => probeMedia(file));
  const anyAudio = probes.some((probe) => probe.streams.some((stream) => stream.type === "audio"));
  const args = [];
  for (const file of input.files) args.push("-i", file);
  const filters = [];
  if (anyAudio) {
    input.files.forEach((_, index) => {
      const hasAudio = probes[index].streams.some((stream) => stream.type === "audio");
      filters.push(`[${index}:v]scale=${scale},fps=30,setpts=PTS-STARTPTS[v${index}];${hasAudio ? `[${index}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${index}]` : `anullsrc=channel_layout=stereo:sample_rate=48000[a${index}]`}`);
    });
  } else {
    input.files.forEach((_, index) => {
      filters.push(`[${index}:v]scale=${scale},fps=30,setpts=PTS-STARTPTS[v${index}]`);
    });
  }
  let video = "[v0]";
  let audio = "[a0]";
  let offset = (probes[0]?.durationSec ?? 3) - fadeSec;
  for (let index = 1; index < input.files.length; index += 1) {
    const nextV = `[vx${index}]`;
    const transitionName = perPairTransitions?.[index - 1] !== void 0 && XFADE_WHITELIST.has(perPairTransitions[index - 1]) ? perPairTransitions[index - 1] : "fade";
    filters.push(`${video}[v${index}]xfade=transition=${transitionName}:duration=${fadeSec}:offset=${offset.toFixed(3)}${nextV}`);
    if (anyAudio) {
      const nextA = `[ax${index}]`;
      filters.push(`${audio}[a${index}]acrossfade=d=${fadeSec}${nextA}`);
      audio = nextA;
    }
    video = nextV;
    offset += (probes[index]?.durationSec ?? 3) - fadeSec;
  }
  const filterComplex = `${filters.join(";")}`;
  args.push("-filter_complex", filterComplex, "-map", video);
  if (anyAudio) args.push("-map", audio, "-c:a", "aac");
  args.push("-c:v", "libx264", "-preset", "veryfast", out);
  runFfmpeg(args, "video concat (fade)");
  return { path: out, mimeType: "video/mp4", probe: probeMedia(out) };
}
async function audioMix(input) {
  if (input.tracks.length === 0) throw new Error("audioMix needs at least one track");
  const out = outputPath(input.outputDir, "mixed", "mp4");
  const args = ["-i", input.video];
  for (const track of input.tracks) args.push("-i", track.path);
  const parts = [];
  const trackLabels = [];
  input.tracks.forEach((track, index) => {
    const vol = track.volume ?? 1;
    parts.push(`[${index + 1}:a]volume=${vol},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[trk${index}]`);
    trackLabels.push(`[trk${index}]`);
  });
  let mixInputs = trackLabels.join("");
  if (input.duckUnder !== void 0 && input.duckUnder >= 0 && input.duckUnder < input.tracks.length) {
    const voice = `[trk${input.duckUnder}]`;
    const bgm = input.duckUnder === 0 ? trackLabels.slice(1).join("") === "" ? null : trackLabels.slice(1) : [trackLabels[0]];
    if (bgm !== null && bgm.length > 0) {
      const ducked = bgm.map((label) => `${label}${voice}sidechaincompress=threshold=0.15:ratio=4:attack=20:release=400:makeup=1[duck${bgm.indexOf(label)}]`).join(";");
      parts.push(ducked);
      const duckLabels = bgm.map((_, index) => `[duck${index}]`);
      const all = input.duckUnder === 0 ? [voice, ...duckLabels] : [...duckLabels, voice];
      mixInputs = all.join("");
    }
  }
  let audioLabel = "[mixed]";
  if (input.targetLufs !== void 0) {
    parts.push(`${mixInputs}amix=inputs=${input.tracks.length}:duration=first:normalize=0[mixed0]`);
    parts.push(`[mixed0]loudnorm=I=${input.targetLufs}:TP=-1:LRA=11[mixed]`);
    audioLabel = "[mixed]";
  } else {
    parts.push(`${mixInputs}amix=inputs=${input.tracks.length}:duration=first:normalize=0[mixed]`);
  }
  args.push("-filter_complex", parts.join(";"), "-map", "0:v", "-map", audioLabel, "-c:v", "copy", "-c:a", "aac", "-shortest", out);
  runFfmpeg(args, "audio mix");
  return { path: out, mimeType: "video/mp4", probe: probeMedia(out) };
}
var libassProbe;
function hasLibass() {
  if (libassProbe !== void 0) return libassProbe;
  const result = spawnSync3("ffmpeg", ["-hide_banner", "-h", "filter=ass"], { encoding: "utf8" });
  libassProbe = result.status === 0 && !/Unknown filter/.test(result.stdout ?? "");
  return libassProbe;
}
async function videoSubtitle(input) {
  const mode = input.mode ?? "soft";
  const out = outputPath(input.outputDir, "subtitle", "mp4");
  if (mode === "burn") {
    if (!hasLibass()) {
      throw new Error("\u5F53\u524D ffmpeg \u6784\u5EFA\u7F3A\u5C11 libass\uFF08\u65E0\u6CD5\u70E7\u5F55\u5B57\u5E55\uFF09\u3002\u8BF7\u4F7F\u7528 mode=soft \u8F6F\u5B57\u5E55\uFF0C\u6216\u5B89\u88C5\u5E26 libass \u7684 ffmpeg\u3002");
    }
    const escaped = input.srt.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
    runFfmpeg(["-i", input.video, "-vf", `subtitles='${escaped}'`, "-c:v", "libx264", "-preset", "veryfast", "-c:a", "copy", out], "subtitle burn");
    return { path: out, mimeType: "video/mp4", probe: probeMedia(out) };
  }
  runFfmpeg(["-i", input.video, "-i", input.srt, "-map", "0", "-map", "1", "-c", "copy", "-c:s", "mov_text", "-metadata:s:s:0", "language=chi", out], "subtitle mux");
  return { path: out, mimeType: "video/mp4", probe: probeMedia(out) };
}
async function videoZoom(input) {
  const out = outputPath(input.outputDir, "zoom", "mp4");
  const strength = input.strength ?? 0.25;
  const direction = input.direction ?? "in";
  const dur = probeMedia(input.video).durationSec || 3;
  const isPan = direction !== "in" && direction !== "out";
  const sizeExpr = isPan ? `iw/(1+${strength}):ih/(1+${strength})` : direction === "in" ? `iw-iw*${strength}*min(t/${dur}\\,1):ih-ih*${strength}*min(t/${dur}\\,1)` : `iw/(1+${strength})+iw*${strength}*min(t/${dur}\\,1):ih/(1+${strength})+ih*${strength}*min(t/${dur}\\,1)`;
  const xExpr = direction === "left" || direction === "tl" || direction === "bl" ? "(iw-ow)*min(t/" + dur + "\\,1)" : direction === "right" || direction === "tr" || direction === "br" ? "(iw-ow)*(1-min(t/" + dur + "\\,1))" : "(iw-ow)/2";
  const yExpr = direction === "tl" || direction === "tr" ? "(ih-oh)*min(t/" + dur + "\\,1)" : direction === "bl" || direction === "br" ? "(ih-oh)*(1-min(t/" + dur + "\\,1))" : "(ih-oh)/2";
  runFfmpeg([
    "-i",
    input.video,
    "-vf",
    `crop=${sizeExpr}:x=${xExpr}:y=${yExpr},scale=iw:ih`,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-c:a",
    "copy",
    out
  ], "video zoom");
  return { path: out, mimeType: "video/mp4", probe: probeMedia(out) };
}
async function videoPip(input) {
  const out = outputPath(input.outputDir, "pip", "mp4");
  const x = input.x ?? 20;
  const y = input.y ?? 20;
  const w = input.w ?? 320;
  const h = input.h ?? -1;
  const alpha = input.alpha ?? 1;
  const enable = input.enable !== void 0 ? `:enable='between(t,${input.enable[0]},${input.enable[1]})'` : "";
  const vf = `[1:v]scale=${w}:${h},format=rgba,colorchannelmixer=aa=${alpha}[ov];[0:v][ov]overlay=${x}:${y}${enable},format=yuv420p`;
  runFfmpeg([
    "-i",
    input.video,
    "-i",
    input.overlay,
    "-filter_complex",
    vf,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-c:a",
    "copy",
    out
  ], "video pip");
  return { path: out, mimeType: "video/mp4", probe: probeMedia(out) };
}
function audioBeats(input) {
  const result = spawnSync3("ffmpeg", [
    "-hide_banner",
    "-i",
    input.source,
    "-af",
    "ebur128=peak=true",
    "-vn",
    "-f",
    "null",
    "-"
  ], { encoding: "utf8" });
  const samples = [];
  for (const line of (result.stderr ?? "").split("\n")) {
    const tMatch = line.match(/t:\s*([\d.]+)/);
    const mMatch = line.match(/M:\s*(-?[\d.]+)/);
    if (tMatch !== null && mMatch !== null) {
      const lufs = Number(mMatch[1]);
      const energy = Math.pow(10, (lufs + 70) / 20);
      samples.push({ t: Number(tMatch[1]), energy });
    }
  }
  if (samples.length < 4) return [];
  const window = 3;
  const smoothed = samples.map((_, index) => {
    let sum = 0;
    let count = 0;
    for (let offset = -window; offset <= window; offset += 1) {
      const value = samples[index + offset];
      if (value !== void 0) {
        sum += value.energy;
        count += 1;
      }
    }
    return sum / count;
  });
  const minGap = input.minGap ?? 0.4;
  const candidates = [];
  let lastPick = -9999;
  for (let index = 1; index < smoothed.length - 1; index += 1) {
    const value = smoothed[index];
    if (value > smoothed[index - 1] && value >= smoothed[index + 1]) {
      const t = samples[index].t;
      if (t - lastPick >= minGap) {
        candidates.push({ t: Number(t.toFixed(2)), strength: Number(value.toFixed(4)) });
        lastPick = t;
      }
    }
  }
  const mean = smoothed.reduce((sum, value) => sum + value, 0) / (smoothed.length || 1);
  const strong = candidates.filter((point) => point.strength > mean * 1.15);
  return (strong.length > 0 ? strong : candidates).slice(0, input.count ?? 16);
}

// src/mcp.ts
var MCP_ROUTE_PATH = "/directorx/mcp";
function sendJson2(response, status, body) {
  response.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*" });
  response.end(JSON.stringify(body));
}
async function readBody(request) {
  let raw = "";
  for await (const chunk of request) raw += String(chunk);
  try {
    return JSON.parse(raw);
  } catch {
    return void 0;
  }
}
var MCP_TOOLS = [
  { name: "directorx_canvas_get", description: "Read the full canvas document (nodes + edges).", inputSchema: { type: "object", properties: {} }, readOnly: true },
  { name: "directorx_canvas_add", readOnly: false, description: "Add a canvas node (image/video/text/group) with optional prompt/shotIndex.", inputSchema: { type: "object", properties: { kind: { type: "string" }, id: { type: "string" }, label: { type: "string" }, path: { type: "string" }, prompt: { type: "string" }, shotIndex: { type: "number" }, parent: { type: "string" }, x: { type: "number" }, y: { type: "number" } } } },
  { name: "directorx_canvas_node", description: "Read one node or edge by id.", inputSchema: { type: "object", properties: { id: { type: "string" } } }, readOnly: true },
  { name: "directorx_canvas_groups", description: "List groups with members.", inputSchema: { type: "object", properties: {} }, readOnly: true },
  { name: "directorx_canvas_group", readOnly: false, description: "Wrap existing nodes into a new group.", inputSchema: { type: "object", properties: { memberIds: { type: "array" }, label: { type: "string" } } } },
  { name: "directorx_canvas_disconnect", readOnly: false, description: "Remove an edge by from/to.", inputSchema: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } } } },
  { name: "directorx_canvas_sequence", readOnly: false, description: "Write shotIndex 1..N and optionally connect media.", inputSchema: { type: "object", properties: { ids: { type: "array" }, connect: { type: "boolean" } } } },
  { name: "directorx_canvas_plan", readOnly: false, description: "Write acts/shots onto the canvas in one call.", inputSchema: { type: "object", properties: { title: { type: "string" }, acts: { type: "array" }, connect: { type: "boolean" } } } },
  { name: "directorx_canvas_batch", readOnly: false, description: "Batch add nodes and edges in one write.", inputSchema: { type: "object", properties: { nodes: { type: "array" }, edges: { type: "array" } } } },
  { name: "directorx_canvas_replace", readOnly: false, description: "Replace the entire canvas document.", inputSchema: { type: "object", properties: { nodes: { type: "array" }, edges: { type: "array" } } } },
  { name: "directorx_canvas_arrange", readOnly: false, description: "Auto-layout the canvas (grid/row).", inputSchema: { type: "object", properties: { layout: { type: "string" } } } },
  { name: "directorx_propose", readOnly: false, description: "Queue a generation proposal placeholder (no API spend).", inputSchema: { type: "object", properties: { kind: { type: "string" }, prompt: { type: "string" }, count: { type: "number" }, duration: { type: "number" } } } },
  { name: "directorx_proposals", description: "List generation proposals.", inputSchema: { type: "object", properties: { status: { type: "string" } } }, readOnly: true },
  { name: "directorx_preflight", description: "Four-gate pre-generation audit.", inputSchema: { type: "object", properties: { prompt: { type: "string" }, type: { type: "string" } } }, readOnly: true },
  { name: "directorx_style", description: "Grounded style/camera-language injection from the corpus.", inputSchema: { type: "object", properties: { style: { type: "string" } } }, readOnly: true },
  { name: "directorx_video_process", readOnly: false, description: "Deterministic trim/speed/scale/volume/mute/fps via ffmpeg.", inputSchema: { type: "object", properties: { source: { type: "string" }, start: { type: "number" }, end: { type: "number" }, speed: { type: "number" }, scale: { type: "string" }, volume: { type: "number" }, mute: { type: "boolean" }, fps: { type: "number" } } } },
  { name: "directorx_video_concat", readOnly: false, description: "Concatenate clips (cut or xfade).", inputSchema: { type: "object", properties: { files: { type: "array" }, transition: { type: "string" }, fadeSec: { type: "number" }, scale: { type: "string" } } } },
  { name: "directorx_audio_mix", readOnly: false, description: "Mix tracks onto a video with ducking.", inputSchema: { type: "object", properties: { video: { type: "string" }, tracks: { type: "array" }, duckUnder: { type: "number" } } } },
  { name: "directorx_video_subtitle", readOnly: false, description: "Mux or burn subtitles.", inputSchema: { type: "object", properties: { video: { type: "string" }, srt: { type: "string" }, mode: { type: "string" } } } }
];
function registerMcpRoute(ctx, getSettings) {
  const webServer = ctx.get("webServer");
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: MCP_ROUTE_PATH,
    handler: async (request, response) => {
      if (request.method !== "POST") {
        response.writeHead(405);
        response.end("method not allowed");
        return;
      }
      const rpc = await readBody(request);
      if (rpc === void 0 || rpc.jsonrpc !== "2.0") {
        sendJson2(response, 400, { jsonrpc: "2.0", error: { code: -32700, message: "parse error" }, id: null });
        return;
      }
      const respond = (result) => sendJson2(response, 200, { jsonrpc: "2.0", id: rpc.id ?? null, result });
      const envelope = (result) => ({ ok: true, result });
      const envelopeError = (error) => {
        const message = error instanceof Error ? error.message : String(error);
        const code = error?.code ?? "internal";
        return {
          ok: false,
          error: {
            code,
            message,
            details: error?.detail ?? null,
            recoverable: code === "internal" || code === "parse" || code === "notFound"
          }
        };
      };
      const fail = (code, message) => sendJson2(response, 200, { jsonrpc: "2.0", id: rpc.id ?? null, error: { code, message } });
      try {
        if (rpc.method === "initialize") {
          respond({ protocolVersion: "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: "dsh-directorx", version: "1.0.0" } });
          return;
        }
        if (rpc.method === "tools/list") {
          respond({ tools: MCP_TOOLS });
          return;
        }
        if (rpc.method === "tools/call") {
          const name2 = String(rpc.params?.name ?? "");
          const args = rpc.params?.arguments ?? {};
          const settings = getSettings();
          const canvas = new DirectorxCanvasStore(settings.outputDir);
          const proposals = new ProposalStore(settings.outputDir);
          switch (name2) {
            case "directorx_canvas_get":
              respond(envelope(await canvas.read()));
              return;
            case "directorx_canvas_add":
              respond(envelope(await canvas.addNode(args)));
              return;
            case "directorx_canvas_node":
              respond(envelope(await canvas.getNode(String(args.id ?? ""))));
              return;
            case "directorx_canvas_groups":
              respond(envelope(await canvas.listGroups()));
              return;
            case "directorx_canvas_group":
              respond(envelope(await canvas.groupNodes({ memberIds: Array.isArray(args.memberIds) ? args.memberIds.map(String) : [], ...typeof args.label === "string" ? { label: args.label } : {} })));
              return;
            case "directorx_canvas_disconnect":
              respond(envelope(await canvas.disconnect(String(args.from ?? ""), String(args.to ?? ""))));
              return;
            case "directorx_canvas_sequence":
              respond(envelope(await canvas.sequenceShots({ ids: Array.isArray(args.ids) ? args.ids.map(String) : [], ...args.connect === true ? { connect: true } : {} })));
              return;
            case "directorx_canvas_plan":
              respond(envelope(await canvas.planBoard({ acts: Array.isArray(args.acts) ? args.acts : [], ...typeof args.title === "string" ? { title: args.title } : {}, ...args.connect === false ? { connect: false } : {} })));
              return;
            case "directorx_canvas_batch":
              respond(envelope(await canvas.batchAdd({ nodes: args.nodes ?? [], edges: args.edges ?? [] })));
              return;
            case "directorx_canvas_replace": {
              const current = await canvas.read();
              respond(envelope(await canvas.write({ version: 1, updatedAt: 0, nodes: args.nodes ?? [], edges: args.edges ?? [] }, current.updatedAt)));
              return;
            }
            case "directorx_canvas_arrange":
              respond(envelope(await canvas.arrange(args.layout === "row" ? "row" : "grid")));
              return;
            case "directorx_propose":
              respond(envelope(await proposals.propose(args)));
              return;
            case "directorx_proposals":
              respond(envelope(await proposals.list(args.status)));
              return;
            case "directorx_preflight":
              respond(envelope(preflight(args)));
              return;
            case "directorx_style": {
              const style = String(args.style ?? "").trim();
              if (style === "") {
                fail(-32602, "style is required");
                return;
              }
              const hits = await corpus.search(style, 1);
              if (hits.length === 0) {
                respond({ style, found: false, hint: "no corpus match" });
                return;
              }
              const article = await corpus.readArticle(hits[0].id);
              respond({ style, found: true, article: { id: article.article.id, title: article.article.title }, guidance: article.content.slice(0, 2500) });
              return;
            }
            case "directorx_video_process":
              respond(envelope(await videoProcess({ source: String(args.source ?? ""), outputDir: settings.outputDir, start: typeof args.start === "number" ? args.start : void 0, end: typeof args.end === "number" ? args.end : void 0, speed: typeof args.speed === "number" ? args.speed : void 0, scale: typeof args.scale === "string" ? args.scale : void 0, volume: typeof args.volume === "number" ? args.volume : void 0, mute: args.mute === true, fps: typeof args.fps === "number" ? args.fps : void 0 })));
              return;
            case "directorx_video_concat":
              respond(envelope(await videoConcat({ files: Array.isArray(args.files) ? args.files.map(String) : [], outputDir: settings.outputDir, transition: args.transition === "cut" ? "cut" : "fade", fadeSec: typeof args.fadeSec === "number" ? args.fadeSec : void 0, scale: typeof args.scale === "string" ? args.scale : void 0 })));
              return;
            case "directorx_audio_mix":
              respond(envelope(await audioMix({ video: String(args.video ?? ""), outputDir: settings.outputDir, tracks: Array.isArray(args.tracks) ? args.tracks : [], duckUnder: typeof args.duckUnder === "number" ? args.duckUnder : void 0 })));
              return;
            case "directorx_video_subtitle":
              respond(envelope(await videoSubtitle({ video: String(args.video ?? ""), srt: String(args.srt ?? ""), outputDir: settings.outputDir, mode: args.mode === "burn" ? "burn" : "soft" })));
              return;
            default:
              fail(-32602, `unknown tool "${name2}"`);
              return;
          }
        }
        if (rpc.method === "notifications/initialized") {
          sendJson2(response, 202, { jsonrpc: "2.0", id: rpc.id ?? null, result: {} });
          return;
        }
        fail(-32601, `method not found: ${rpc.method}`);
      } catch (error) {
        respond(envelopeError(error));
      }
    }
  });
}

// src/board.ts
function countProposals(proposals) {
  const counts = { proposed: 0, approved: 0, rejected: 0, done: 0 };
  for (const proposal of proposals) {
    if (proposal.status === "proposed") counts.proposed += 1;
    else if (proposal.status === "approved") counts.approved += 1;
    else if (proposal.status === "rejected") counts.rejected += 1;
    else counts.done += 1;
  }
  return counts;
}
function formatProductionBoard(input) {
  const statusCounts = countProposals(input.proposals);
  const counts = {
    shots: input.shotlist.rows.length,
    totalDurationSec: input.shotlist.totalDurationSec,
    ...statusCounts
  };
  const next = input.next ?? input.proposals.filter((item) => item.status === "proposed").sort((a, b) => a.at - b.at)[0] ?? null;
  const nextId = next === null ? null : next.id;
  const durationLine = input.shotlist.targetSeconds === void 0 ? `Shots ${counts.shots} \xB7 ${counts.totalDurationSec}s` : `Shots ${counts.shots} \xB7 ${counts.totalDurationSec}s / target ${input.shotlist.targetSeconds}s`;
  const markdown = [
    `# ${input.shotlist.title}`,
    durationLine,
    `Proposals proposed ${counts.proposed} \xB7 approved ${counts.approved} \xB7 rejected ${counts.rejected} \xB7 done ${counts.done}`,
    next === null ? "Next: none pending" : `Next: ${next.id} (${next.kind}) ${next.prompt.slice(0, 80)}`,
    "",
    "Commands: /directorx shotlist \xB7 /directorx proposals \xB7 /directorx next",
    "Confirm: directorx_confirm (DSH ask UI)"
  ].join("\n");
  return { title: input.shotlist.title, counts, nextId, markdown };
}
function formatProposalList(proposals) {
  if (proposals.length === 0) return "No proposals.";
  return [
    "| id | kind | status | model | spec | prompt |",
    "| --- | --- | --- | --- | --- | --- |",
    ...proposals.map((proposal) => {
      const spec = [proposal.size, proposal.duration === void 0 ? "" : `${proposal.duration}s`].filter((part) => part !== "").join(" ");
      return `| ${proposal.id} | ${proposal.kind} | ${proposal.status} | ${proposal.model ?? "\u2014"} | ${spec || "\u2014"} | ${proposal.prompt.replace(/\|/g, "/").slice(0, 60)} |`;
    })
  ].join("\n");
}

// src/shotlist.ts
var DEFAULT_DURATION = 5;
function durationFromPrompt(prompt, fallback = DEFAULT_DURATION) {
  const match = prompt.match(/(\d+(?:\.\d+)?)\s*s(?:ec(?:onds)?)?\b/i);
  if (match === null) return fallback;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return fallback;
  return Math.min(30, Math.round(seconds));
}
function isShot(node) {
  return node.kind === "image" || node.kind === "video";
}
function formatCanvasShotlist(doc, options = {}) {
  const fallback = options.defaultDurationSec ?? DEFAULT_DURATION;
  const shots = doc.nodes.filter(isShot).slice();
  shots.sort((a, b) => {
    if (a.shotIndex !== void 0 && b.shotIndex !== void 0) return a.shotIndex - b.shotIndex;
    if (a.shotIndex !== void 0) return -1;
    if (b.shotIndex !== void 0) return 1;
    return a.id.localeCompare(b.id);
  });
  const rows = shots.map((node, i) => ({
    index: node.shotIndex ?? i + 1,
    id: node.id,
    kind: node.kind,
    label: node.label,
    prompt: node.prompt ?? "",
    durationSec: durationFromPrompt(node.prompt ?? "", fallback),
    continuity: node.continuityRules ?? [],
    status: node.shotStatus ?? "idea"
  }));
  const totalDurationSec = rows.reduce((sum, row) => sum + row.durationSec, 0);
  const title = doc.title !== void 0 && doc.title !== "" ? doc.title : "untitled board";
  const targetSeconds = options.targetSeconds;
  const remainingSeconds = targetSeconds === void 0 ? void 0 : targetSeconds - totalDurationSec;
  const lines = [
    `# ${title}`,
    "",
    `| # | kind | label | dur | status | continuity |`,
    `| --- | --- | --- | ---: | --- | --- |`,
    ...rows.map((row) => `| ${row.index} | ${row.kind} | ${row.label || row.id} | ${row.durationSec}s | ${row.status} | ${row.continuity.join(", ") || "\u2014"} |`),
    "",
    `Total ${totalDurationSec}s` + (targetSeconds !== void 0 ? ` / target ${targetSeconds}s (${remainingSeconds}s remaining)` : ""),
    "",
    ...rows.flatMap((row) => [
      `## Shot ${row.index} \u2014 ${row.label || row.id}`,
      row.prompt === "" ? "_no prompt yet_" : row.prompt,
      ""
    ])
  ];
  return { title, rows, totalDurationSec, targetSeconds, remainingSeconds, markdown: lines.join("\n") };
}

// src/commands.ts
var USAGE = "Usage: /directorx [shotlist|proposals|next]";
function parseDirectorxCommand(rawInput) {
  const token = rawInput.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (token === "" || token === "board") return "board";
  if (token === "shotlist") return "shotlist";
  if (token === "proposals") return "proposals";
  if (token === "next") return "next";
  return "help";
}
async function runDirectorxCommand(rawInput, outputDir) {
  const kind = parseDirectorxCommand(rawInput);
  if (kind === "help") {
    return { kind: "error", text: `Unknown /directorx argument.
${USAGE}` };
  }
  const canvas = new DirectorxCanvasStore(outputDir);
  const store = new ProposalStore(outputDir);
  const [doc, proposals, next] = await Promise.all([canvas.read(), store.list(), store.next()]);
  const shotlist = formatCanvasShotlist(doc);
  if (kind === "shotlist") {
    return { kind: "success", text: shotlist.markdown };
  }
  if (kind === "proposals") {
    return { kind: "success", text: formatProposalList(proposals) };
  }
  if (kind === "next") {
    if (next === null) return { kind: "success", text: "No pending proposal. Queue one with directorx_propose, then /directorx next." };
    const spec = [next.model, next.size, next.duration === void 0 ? "" : `${next.duration}s`].filter((part) => part !== "").join(" \xB7 ");
    return {
      kind: "success",
      text: [
        `${next.id} \xB7 ${next.status} \xB7 ${next.kind}`,
        spec,
        next.prompt,
        next.note ?? "",
        "Approve in the canvas or call directorx_confirm."
      ].filter((line) => line !== "").join("\n")
    };
  }
  const board = formatProductionBoard({ shotlist, proposals, next });
  return { kind: "success", text: board.markdown };
}
function registerDirectorxCommands(ctx, getOutputDir) {
  ctx.inject(["commands"], (commandCtx) => {
    const commands = commandCtx.commands;
    if (commands === void 0) throw new Error("directorx commands inject ran without ctx.commands");
    commands.register({
      name: "directorx",
      description: "DirectorX production board (shot list + proposal queue). Direct UI, no model tokens.",
      input: { hint: "[shotlist|proposals|next]" },
      handler: async ({ rawInput }) => runDirectorxCommand(rawInput, getOutputDir())
    });
  });
  return () => {
  };
}

// src/subagents.ts
var GUIDANCE = [
  "## DirectorX media orchestration (injected for subagents)",
  "You are a subagent in a DirectorX production pipeline \u2014 part of the DirectorX (DX) production lead persona: plan \u2192 confirm \u2192 generate \u2192 inspect \u2192 deliver, in the user's language.",
  "- The project storyboard lives on the DirectorX canvas: read `directorx_canvas_get` for context before planning, and write your results back with `directorx_canvas_*` (shots/assets as nodes, handoffs as edges, acts as groups).",
  "Media capabilities available to you:",
  "- `directorx_generate_image` / `directorx_generate_video` / `directorx_generate_audio` / `directorx_view_image` generation tools.",
  "- `directorx_knowledge_search` / `directorx_knowledge_read` for craft facts (prompt specs, model matrix, camera language).",
  "- The `directorx-playbook` skill: prompt principles, consistency & control checklist, workflow gates, model routing.",
  "- `directorx_task_status` / `directorx_cancel_task` for async tasks; `directorx_edits` for WebUI edit artifacts.",
  "",
  "Orchestration discipline:",
  "- Lock subject, style, light, lens, and continuity in writing BEFORE generating; reuse the anchors across shots instead of re-describing.",
  "- Pass the four workflow gates (spec, content, cost, rights) before any paid generation; prefer mock mode to validate a pipeline.",
  "- Treat provider responses as authoritative: return file paths, task ids, and statuses verbatim in your structured report; never claim completion without them.",
  "- After a timeout, recover the provider task with `directorx_task_status` instead of re-submitting.",
  "- Keep prompts positive and physical; search the knowledge corpus instead of guessing model capabilities."
].join("\n");
var SKILL_CONTENT = [
  "# DirectorX Subagent Orchestration",
  "",
  "This skill is injected into every continuable subagent when the dsh-directorx plugin is active.",
  "When the task involves planning, prompting, generating, or reviewing AI media:",
  "",
  "1. Load `directorx-playbook` and follow its four checklists.",
  "2. Search `directorx_knowledge_search` for the model/craft facts the shot needs.",
  "3. Lock the consistency anchors (subject, style, light, lens) before generating.",
  "4. Generate, then report file paths / task ids / statuses as structured data \u2014 the parent agent orchestrates, you produce verified artifacts."
].join("\n");
function registerSubagentSetup(ctx) {
  const subagents = ctx.get("subagents");
  if (subagents === void 0) return () => {
  };
  return subagents.registerContinuableSetup((childCtx) => {
    const systemPrompt = childCtx.get("systemPrompt");
    const skills = childCtx.get("skills");
    const disposers = [];
    if (systemPrompt !== void 0) {
      disposers.push(systemPrompt.section({ name: "tool:directorx-subagent", order: 118, text: GUIDANCE }));
    }
    if (skills !== void 0) {
      disposers.push(skills.register({
        name: "directorx-subagent-orchestration",
        description: "Injected DirectorX subagent orchestration discipline: playbook first, knowledge corpus for craft facts, consistency anchors before generation, structured artifact reports.",
        content: SKILL_CONTENT,
        source: "runtime",
        provider: "directorx",
        invocation: { modelInvocable: true, userInvocable: true }
      }));
    }
    return () => {
      for (const dispose of disposers.reverse()) dispose();
    };
  });
}

// src/tools.ts
import { readFileSync as readFileSync3 } from "node:fs";

// src/providers/storyboard.ts
var CAMERA_SAFE_MOVES = ["static", "push_in", "pull_out", "pan", "tilt", "parallax", "element"];
var CAMERA_BOLD_MOVES = ["orbit", "dolly_zoom", "roll", "whip"];
function planStoryboard(input) {
  const minShot = input.minShotSeconds ?? 1;
  const maxShot = input.maxShotSeconds ?? 10;
  const issues = [];
  const notes = [];
  const shots = input.shots.map((shot, index) => {
    let seconds = typeof shot.seconds === "number" && shot.seconds > 0 ? shot.seconds : 0;
    if (seconds > 0 && (seconds < minShot || seconds > maxShot)) {
      issues.push(`\u955C\u5934 ${shot.id ?? index + 1} \u65F6\u957F ${seconds}s \u8D85\u51FA\u6A21\u578B\u533A\u95F4 [${minShot},${maxShot}]\uFF0C\u5DF2\u94B3\u5236`);
      seconds = Math.min(maxShot, Math.max(minShot, seconds));
    }
    return {
      id: shot.id ?? `shot-${index + 1}`,
      description: shot.description,
      seconds,
      ...shot.cameraShot !== void 0 ? { cameraShot: shot.cameraShot } : {},
      ...shot.angle !== void 0 ? { angle: shot.angle } : {},
      ...shot.movement !== void 0 ? { movement: shot.movement } : {},
      ...shot.moodTags !== void 0 ? { moodTags: shot.moodTags } : {},
      ...shot.actionBeats !== void 0 ? { actionBeats: shot.actionBeats } : {},
      ...shot.dialogue !== void 0 ? { dialogue: shot.dialogue } : {},
      ...shot.storyBeat !== void 0 ? { storyBeat: shot.storyBeat } : {}
    };
  });
  const unspecified = shots.filter((shot) => shot.seconds === 0);
  const specifiedTotal = shots.reduce((sum, shot) => sum + (shot.seconds > 0 ? shot.seconds : 0), 0);
  const target = input.targetSeconds ?? shots.length * 5;
  if (unspecified.length > 0) {
    const remaining = Math.max(unspecified.length * minShot, target - specifiedTotal);
    const perShot = Math.min(maxShot, remaining / unspecified.length);
    for (const shot of unspecified) shot.seconds = Number(perShot.toFixed(1));
    notes.push(`\u672A\u6307\u5B9A\u65F6\u957F\u7684 ${unspecified.length} \u4E2A\u955C\u5934\u6309\u76EE\u6807 ${target}s \u5206\u914D\uFF08\u6BCF\u4E2A ${perShot.toFixed(1)}s\uFF09`);
  }
  const totalSeconds = shots.reduce((sum, shot) => sum + shot.seconds, 0);
  if (input.targetSeconds !== void 0 && Math.abs(totalSeconds - input.targetSeconds) > Math.max(1, input.targetSeconds * 0.2)) {
    notes.push(`\u603B\u65F6\u957F ${totalSeconds.toFixed(1)}s \u4E0E\u76EE\u6807 ${input.targetSeconds}s \u504F\u5DEE\u8F83\u5927\uFF0C\u5EFA\u8BAE\u8C03\u6574\u955C\u5934\u6570\u6216\u5355\u955C\u65F6\u957F`);
  }
  if (input.anchors !== void 0) {
    const characterNames = input.anchors.characters ?? [];
    const sceneNames = input.anchors.scenes ?? [];
    for (const shot of shots) {
      const missing = [];
      for (const name2 of characterNames) if (!shot.description.includes(name2)) missing.push(`\u89D2\u8272\u300C${name2}\u300D`);
      for (const name2 of sceneNames) if (!shot.description.includes(name2)) missing.push(`\u573A\u666F\u300C${name2}\u300D`);
      if (missing.length > 0) issues.push(`\u955C\u5934 ${shot.id} \u672A\u5F15\u7528\u8FDE\u7EED\u6027\u951A\u70B9\uFF1A${missing.join("\u3001")}`);
    }
  }
  const safeSet = new Set(CAMERA_SAFE_MOVES);
  const boldSet = new Set(CAMERA_BOLD_MOVES);
  let previousMove;
  for (const shot of shots) {
    const move = shot.movement !== void 0 && shot.movement !== "" ? String(shot.movement).toLowerCase() : void 0;
    if (move !== void 0) {
      if (!safeSet.has(move) && !boldSet.has(move)) {
        issues.push(`\u955C\u5934 ${shot.id} \u8FD0\u955C\u300C${shot.movement}\u300D\u4E0D\u5728\u8BCD\u8868\u5185\uFF08\u5B89\u5168\uFF1Astatic/push_in/pull_out/pan/tilt/parallax/element\uFF1B\u5927\u80C6\u9700\u663E\u5F0F\u653E\u5F00\uFF1Aorbit/dolly_zoom/roll/whip\uFF09`);
      }
      if (boldSet.has(move)) {
        notes.push(`\u955C\u5934 ${shot.id} \u4F7F\u7528\u5927\u80C6\u8FD0\u955C\u300C${shot.movement}\u300D\u2014\u2014\u751F\u6210\u5931\u8D25\u7387\u9AD8\uFF0C\u5EFA\u8BAE\u5907\u9009\u5B89\u5168\u8FD0\u955C`);
      }
      if (previousMove !== void 0 && previousMove === move && move !== "static") {
        issues.push(`\u955C\u5934 ${shot.id} \u4E0E\u4E0A\u4E00\u955C\u8FD0\u955C\u76F8\u540C\uFF08\u53CD\u5355\u8C03\u89C4\u5219\uFF1A\u76F8\u90BB\u955C\u5934\u8FD0\u955C\u5FC5\u987B\u4E0D\u540C\uFF09`);
      }
      previousMove = move;
    }
  }
  return { shots, totalSeconds: Number(totalSeconds.toFixed(1)), issues, notes };
}

// src/model-matrix.ts
var MODEL_MATRIX = [
  { model: "sora-2", mode: "openai-videos", maxDurationSec: 12, minDurationSec: 4, aspectRatios: ["16:9", "9:16"], firstFrame: true, lastFrame: false, audio: false, multiRef: false },
  { model: "sora-2-pro", mode: "openai-videos", maxDurationSec: 12, minDurationSec: 4, aspectRatios: ["16:9", "9:16"], firstFrame: true, lastFrame: false, audio: false, multiRef: false },
  { model: "kling-v3", mode: "kling", maxDurationSec: 15, minDurationSec: 3, aspectRatios: ["16:9", "9:16", "1:1"], firstFrame: true, lastFrame: true, audio: true, multiRef: false },
  { model: "kling-3.0", mode: "kling-v3", maxDurationSec: 15, minDurationSec: 3, aspectRatios: ["16:9", "9:16", "1:1"], firstFrame: true, lastFrame: true, audio: true, multiRef: false },
  { model: "gen4.5", mode: "runway", maxDurationSec: 10, minDurationSec: 2, aspectRatios: ["16:9", "9:16", "1:1"], firstFrame: true, lastFrame: false, audio: false, multiRef: false },
  { model: "gen4_turbo", mode: "runway", maxDurationSec: 10, minDurationSec: 2, aspectRatios: ["16:9", "9:16"], firstFrame: true, lastFrame: false, audio: false, multiRef: false },
  { model: "MiniMax-H3", mode: "minimax-h3", maxDurationSec: 15, minDurationSec: 4, aspectRatios: ["16:9", "9:16", "1:1", "21:9"], firstFrame: true, lastFrame: true, audio: false, multiRef: false },
  { model: "viduq3", mode: "vidu", maxDurationSec: 16, minDurationSec: 3, aspectRatios: ["16:9", "9:16", "1:1"], firstFrame: false, lastFrame: false, audio: true, multiRef: false },
  { model: "viduq3-turbo", mode: "vidu", maxDurationSec: 16, minDurationSec: 3, aspectRatios: ["16:9", "9:16", "1:1"], firstFrame: false, lastFrame: false, audio: true, multiRef: false },
  { model: "veo-3.1-generate-preview", mode: "veo", maxDurationSec: 8, minDurationSec: 4, aspectRatios: ["16:9", "9:16"], firstFrame: true, lastFrame: true, audio: true, multiRef: false }
];
function routeModel(request, extras = []) {
  const eligible = [];
  const excluded = [];
  const seen = /* @__PURE__ */ new Set();
  const matrix = [];
  for (const capability2 of [...MODEL_MATRIX, ...extras]) {
    if (seen.has(`${capability2.mode}:${capability2.model}`)) continue;
    seen.add(`${capability2.mode}:${capability2.model}`);
    matrix.push(capability2);
  }
  for (const capability2 of matrix) {
    const reasons = [];
    if (request.durationSec !== void 0 && (request.durationSec < capability2.minDurationSec || request.durationSec > capability2.maxDurationSec)) {
      reasons.push(`\u65F6\u957F ${request.durationSec}s \u8D85\u51FA [${capability2.minDurationSec},${capability2.maxDurationSec}]`);
    }
    if (request.aspectRatio !== void 0 && !capability2.aspectRatios.includes(request.aspectRatio)) {
      reasons.push(`\u753B\u5E45 ${request.aspectRatio} \u4E0D\u5728 ${capability2.aspectRatios.join("/")}`);
    }
    if (request.needsFirstFrame === true && !capability2.firstFrame) reasons.push("\u4E0D\u652F\u6301\u9996\u5E27");
    if (request.needsLastFrame === true && !capability2.lastFrame) reasons.push("\u4E0D\u652F\u6301\u5C3E\u5E27");
    if (request.needsAudio === true && !capability2.audio) reasons.push("\u4E0D\u652F\u6301\u97F3\u753B\u540C\u51FA");
    if (request.needsMultiRef === true && !capability2.multiRef) reasons.push("\u4E0D\u652F\u6301\u591A\u53C2\u8003\u56FE\uFF08\u591A\u4E3B\u4F53\u8F93\u5165\uFF09");
    if (reasons.length === 0) eligible.push(capability2);
    else excluded.push({ model: capability2.model, reasons });
  }
  eligible.sort((a, b) => {
    const score = (capability2) => (request.needsFirstFrame === true ? Number(capability2.firstFrame) : 0) + (request.needsLastFrame === true ? Number(capability2.lastFrame) : 0) + (request.needsAudio === true ? Number(capability2.audio) : 0) + (request.needsMultiRef === true ? Number(capability2.multiRef) : 0) + (request.durationSec !== void 0 && request.durationSec <= capability2.maxDurationSec ? 1 : 0);
    return score(b) - score(a);
  });
  return { eligible, excluded };
}

// src/providers/shot-builder.ts
var SHOT_SIZES = {
  ECU: { phrase: "extreme close-up", use: "\u51B3\u5B9A\u6027\u7EC6\u8282\u4E0E\u6781\u7AEF\u60C5\u7EEA\uFF1B\u5168\u7247 1-2 \u6B21\u60DC\u7528\uFF08\u89C4\u5219 36\uFF09" },
  CU: { phrase: "close-up", use: "\u60C5\u7EEA\u8D27\u5E01\uFF1A\u5185\u5FC3\u620F/\u53CD\u5E94\u955C\u5934\uFF08\u89C4\u5219 36\uFF09" },
  MCU: { phrase: "medium close-up", use: "\u5BF9\u8BDD\u4E0E\u60C5\u7EEA\u8FC7\u6E21\u7684\u9ED8\u8BA4\u6863" },
  MS: { phrase: "medium shot", use: "\u4FE1\u606F\u9ED8\u8BA4\u503C\uFF1A\u4EA4\u4EE3\u52A8\u4F5C\uFF08\u89C4\u5219 36\uFF09" },
  MLS: { phrase: "medium long shot", use: "\u4EBA\u7269\u4E0E\u73AF\u5883\u5173\u7CFB" },
  LS: { phrase: "long shot", use: "\u5EFA\u7ACB\u7A7A\u95F4\uFF1Aestablishing \u9996\u955C" },
  ELS: { phrase: "extreme long shot", use: "\u89C4\u6A21\u4E0E\u5B64\u5BC2\uFF1A\u7ED3\u5C3E\u62C9\u8FDC" }
};
var ANGLES = {
  "eye-level": { phrase: "eye-level camera", use: "\u4E2D\u7ACB\u5BA2\u89C2\uFF08\u89C4\u5219 38 \u7AD9\u4F4D\u5373\u6743\u529B\uFF09" },
  low: { phrase: "low angle looking up", use: "\u4EF0\u89D2=\u6743\u5A01/\u652F\u914D" },
  high: { phrase: "high angle looking down", use: "\u4FEF\u89D2=\u5F31\u52BF/\u6E3A\u5C0F" },
  "birds-eye": { phrase: "bird's-eye view from directly above", use: "\u4FEF\u77B0\u6536\u675F/\u89C4\u6A21\u63ED\u793A\uFF08\u89C4\u5219 46\uFF09" },
  "worms-eye": { phrase: "worm's-eye view from below", use: "\u538B\u8FEB\u611F/\u4EF0\u89C6\u5F20\u529B" },
  dutch: { phrase: "dutch angle, tilted horizon", use: "\u5931\u8861/\u4E0D\u5B89\u2014\u2014\u514B\u5236\u4F7F\u7528" },
  OTS: { phrase: "over-the-shoulder shot", use: "\u5BF9\u8BDD\u6B63\u53CD\u6253\uFF08\u89C4\u5219 38 \u89C6\u7EBF\u5339\u914D\uFF09" },
  POV: { phrase: "POV shot through the eyes of the character", use: "\u4E3B\u89C2\u4EE3\u5165\uFF08\u8BED\u6599 234 \u89C6\u70B9\uFF09" }
};
var LIGHTING = {
  rembrandt: { phrase: "Rembrandt key from screen-left lamp, no fill, 85:15 dark-to-light", use: "\u620F\u5267\u4FA7\u5149\uFF08\u89C4\u5219 31 \u547D\u540D\u5149\u6E90\u4E0E\u6BD4\u4F8B\uFF09" },
  "low-key": { phrase: "low-key lighting, harsh shadows, chiaroscuro contrast", use: "\u60AC\u7591/\u9ED1\u8272\u7535\u5F71\uFF08\u89C4\u5219 39 \u9AD8\u4F4E\u8C03\u5339\u914D\uFF09" },
  "high-key": { phrase: "high-key lighting, soft even illumination, low contrast", use: "\u559C\u5267/\u5E7F\u544A\uFF08\u89C4\u5219 39\uFF09" },
  neon: { phrase: "neon signs as the only practical source, cyan and magenta spill on faces", use: "\u6709\u6E90\u5149\u5F8B\uFF08\u89C4\u5219 44\uFF09\uFF1A\u5149\u6E90\u5728\u753B\u5185\u53EF\u89C1" },
  "golden-hour": { phrase: "golden hour back-light, long shadows on the ground", use: "\u6E29\u6696\u6C1B\u56F4\uFF08\u89C4\u5219 31\uFF09" },
  "soft-window": { phrase: "soft window key from camera-left, warm lamp fill, cool hallway rim", use: "\u9690\u5F62\u5149\u951A\uFF1A\u9010\u955C\u590D\u7528\u540C\u53E5\uFF08\u89C4\u5219 68\uFF09" },
  practical: { phrase: "motivated practicals only, warm yellow from the visible lamps", use: "\u6709\u6E90\u5149\u5F8B\uFF08\u89C4\u5219 44\uFF09" }
};
var COMPOSITION = {
  "rule-of-thirds": { phrase: "subject offset to the third line", use: "\u4E09\u5206\u6784\u56FE\u5E38\u6001\uFF08\u89C4\u5219 62 \u753B\u5E45\u5148\u5B9A\uFF09" },
  symmetry: { phrase: "perfectly symmetrical composition, centered subject", use: "\u79E9\u5E8F/\u5E84\u91CD\uFF08\u97E6\u5F0F\u8BED\u6CD5\uFF09" },
  "negative-space": { phrase: "subject on the far third, large negative space", use: "\u5B64\u72EC/\u538B\u6291\uFF08\u89C4\u5219 38\uFF09" },
  "frame-in-frame": { phrase: "frame within a frame through window/door", use: "\u7AA5\u89C6/\u56DA\u7981\uFF08\u89C4\u5219 38\uFF09" },
  "depth-layers": { phrase: "foreground occlusion, midground subject, background story", use: "Kurosawa \u7EB5\u6DF1\u4E09\u5C42\uFF08\u89C4\u5219 38\uFF09" }
};
var BOLD_MOVES = /* @__PURE__ */ new Set(["orbit", "dolly_zoom", "roll", "whip"]);
var NEGATIVE_BASELINE = "blurry, low quality, pixelated, watermark, text overlay, subtitles, distorted limbs, extra fingers, deformed face, flickering, jitter, strobing, duplicate subjects, morphing face";
function buildShotPrompt(input) {
  const parts = {};
  const notes = [];
  const size = SHOT_SIZES[input.shotSize ?? "MS"];
  parts.shot = size.phrase;
  notes.push(`\u666F\u522B ${input.shotSize ?? "MS"}: ${size.use}`);
  const angle = ANGLES[input.angle ?? "eye-level"];
  parts.angle = angle.phrase;
  notes.push(`\u89D2\u5EA6 ${input.angle ?? "eye-level"}: ${angle.use}`);
  const move = (input.cameraMove ?? "static").toLowerCase();
  const safeMove = CAMERA_SAFE_MOVES.includes(move);
  parts.move = safeMove ? `${move.replace("_", " ")} camera movement` : `${move} camera movement`;
  if (BOLD_MOVES.has(move)) notes.push(`\u8FD0\u955C ${move}: \u5927\u80C6\u8FD0\u955C\uFF0C\u5931\u8D25\u7387\u9AD8\uFF0C\u5EFA\u8BAE\u5907\u9009\u5B89\u5168\u8FD0\u955C\uFF08\u89C4\u5219 36 \u8BCD\u8868\uFF09`);
  else if (!safeMove) notes.push(`\u8FD0\u955C ${move} \u4E0D\u5728\u5B89\u5168\u8BCD\u8868\uFF08static/push_in/pull_out/pan/tilt/parallax/element\uFF09\uFF0C\u8BF7\u786E\u8BA4\u6A21\u578B\u652F\u6301`);
  if (move === "static") parts.move = "Static camera, no movement";
  const light = LIGHTING[input.lighting ?? "soft-window"];
  parts.lighting = light.phrase;
  notes.push(`\u5E03\u5149 ${input.lighting ?? "soft-window"}: ${light.use}`);
  if (input.composition !== void 0) {
    const comp = COMPOSITION[input.composition];
    parts.composition = comp.phrase;
    notes.push(`\u6784\u56FE ${input.composition}: ${comp.use}`);
  }
  if (input.mood !== void 0 && input.mood !== "") {
    parts.mood = `atmosphere: ${input.mood}`;
  }
  const actionPart = input.action !== void 0 && input.action !== "" ? input.action : "perform one clear action";
  const subjectPart = `${input.subject}, ${parts.shot}, ${parts.angle}, ${parts.move}`;
  const prompt = [subjectPart, actionPart, parts.lighting, parts.composition ?? "", parts.mood ?? ""].filter((part) => part !== "").join("; ");
  notes.push("\u52A8\u4F5C\u6309\u8282\u62CD\u8BA1\u6570\u5199\uFF08\u89C4\u5219 32\uFF1A\u53EF\u89C2\u5BDF\u884C\u4E3A\uFF0C\u4E0D\u5199\u60C5\u7EEA\u52A8\u8BCD\uFF09");
  notes.push(`\u5355\u955C ${input.durationSec ?? 5}s\uFF1A\u65F6\u957F\u5199\u751F\u6210\u53C2\u6570\u4E0E\u7EA6\u675F\u53E5\uFF0C\u4E0D\u5199\u8FDB\u63D0\u793A\u8BCD\uFF08\u89C4\u5219 59\uFF09`);
  return {
    prompt,
    negative: NEGATIVE_BASELINE,
    notes,
    parts
  };
}
function tailSentence(text) {
  const parts = text.split(/[。！？；\n]+/).filter((part) => part.trim() !== "");
  return parts[parts.length - 1] ?? text;
}
function buildShotSequence(shots) {
  const specs = [];
  const issues = [];
  let previousMove;
  shots.forEach((shot, index) => {
    const id = shot.id ?? `shot-${index + 1}`;
    const built = buildShotPrompt({
      subject: shot.description,
      shotSize: shot.shotSize,
      cameraMove: shot.cameraMove,
      lighting: shot.lighting,
      mood: shot.mood,
      composition: shot.composition
    });
    const prev = shots[index - 1];
    const next = shots[index + 1];
    const prevEnd = prev !== void 0 ? tailSentence(prev.description) : null;
    const nextStart = next !== void 0 ? next.description.split(/[。！？；\n]+/)[0]?.trim() ?? next.description : null;
    const handoffFrom = shot.handoff === true && prev !== void 0 ? prev.id ?? `shot-${index}` : null;
    if (shot.cameraMove !== void 0) {
      const move = shot.cameraMove.toLowerCase();
      if (previousMove !== void 0 && previousMove === move && move !== "static") {
        issues.push(`\u955C\u5934 ${id} \u4E0E\u4E0A\u4E00\u955C\u8FD0\u955C\u76F8\u540C\uFF08\u53CD\u5355\u8C03\u89C4\u5219\uFF09`);
      }
      previousMove = move;
    }
    specs.push({
      id,
      prompt: built.prompt,
      negative: built.negative,
      carry: { prevEnd, nextStart },
      handoffFrom
    });
  });
  return { specs, issues };
}
function gateShotSequence(input) {
  const checks = [];
  const shots = input.shots;
  if (shots.length === 0) {
    return { verdict: "fix", checks: [{ name: "\u955C\u5934\u6570", pass: false, detail: "\u955C\u5934\u5217\u8868\u4E3A\u7A7A", rule: "\u89C4\u5219 3c \u5267\u672C\u5355\u4E00\u4E8B\u5B9E\u6E90" }] };
  }
  const ecuCount = shots.filter((shot) => shot.shotSize === "ECU").length;
  checks.push({
    name: "ECU \u60DC\u7528\u5F8B",
    pass: ecuCount / shots.length <= 0.2,
    detail: `${ecuCount}/${shots.length} \u955C\u7528 ECU\uFF08\u4E0A\u9650 20%\uFF09`,
    rule: "\u89C4\u5219 36 ECU \u53EA\u7ED9\u51B3\u5B9A\u6027\u7EC6\u8282"
  });
  checks.push({ name: "\u8D1F\u9762\u57FA\u7EBF", pass: true, detail: "\u88C5\u914D\u5C42\u9010\u955C\u6CE8\u5165\u56DB\u7C7B\u8D1F\u9762\u57FA\u7EBF", rule: "\u89C4\u5219 26 \u8D1F\u9762\u56DB\u7C7B\u57FA\u5E95" });
  const missingCarry = [];
  shots.forEach((shot, index) => {
    if (index > 0 && tailSentence(shots[index - 1].description) === "") missingCarry.push(shot.id ?? `shot-${index + 1}`);
    if (index < shots.length - 1 && (shot.description.split(/[。！？；\n]+/)[0] ?? "").trim() === "") missingCarry.push(shot.id ?? `shot-${index + 1}`);
  });
  checks.push({ name: "\u627F\u63A5\u53D8\u91CF", pass: missingCarry.length === 0, detail: missingCarry.length > 0 ? `\u7F3A\u627F\u63A5\u63CF\u8FF0\uFF1A${missingCarry.join(", ")}` : "\u9010\u955C\u627F\u63A5\u6587\u672C\u9F50\u5907", rule: "\u89C4\u5219 3b \u627F\u63A5\u53D8\u91CF\u5FC5\u586B" });
  const overlong = shots.filter((shot) => shot.description.length > 200).map((shot) => shot.id ?? "?");
  checks.push({ name: "\u63CF\u8FF0\u957F\u5EA6", pass: overlong.length === 0, detail: overlong.length > 0 ? `\u8D85\u957F\u63CF\u8FF0\uFF1A${overlong.join(", ")}` : "\u5168\u90E8 \u2264200 \u5B57", rule: "\u89C4\u5219 14 \u5BB9\u5668\u4E0E\u5185\u5BB9\u5206\u79BB" });
  const safeSet = new Set(CAMERA_SAFE_MOVES);
  const boldSet = /* @__PURE__ */ new Set(["orbit", "dolly_zoom", "roll", "whip"]);
  const badMoves = [];
  let prevMove;
  shots.forEach((shot, index) => {
    const move = shot.cameraMove?.toLowerCase();
    if (move === void 0) return;
    const id = shot.id ?? `shot-${index + 1}`;
    if (!safeSet.has(move) && !boldSet.has(move)) badMoves.push(`${id}(${move})`);
    if (prevMove !== void 0 && prevMove === move && move !== "static") badMoves.push(`${id}(\u4E0E\u4E0A\u955C\u540C\u8FD0\u955C)`);
    prevMove = move;
  });
  checks.push({ name: "\u8FD0\u955C\u8BCD\u8868\u4E0E\u53CD\u5355\u8C03", pass: badMoves.length === 0, detail: badMoves.length > 0 ? badMoves.join("\uFF1B") : "\u8BCD\u8868\u5408\u89C4\u3001\u76F8\u90BB\u4E0D\u540C", rule: "\u89C4\u5219 36 \u8FD0\u955C\u5B89\u5168\u8BCD\u8868" });
  if (input.durationSec !== void 0 || input.aspectRatio !== void 0) {
    const route = routeModelForGate(input.durationSec, input.aspectRatio);
    checks.push({
      name: "\u6A21\u578B\u8DEF\u7531",
      pass: route.eligible.length > 0,
      detail: route.eligible.length > 0 ? `${route.eligible.length} \u4E2A\u6A21\u578B\u53EF\u7528` : "\u65E0\u6A21\u578B\u6EE1\u8DB3\u8BE5\u53C2\u6570\u7EC4\u5408",
      rule: "\u89C4\u5219 59/62 \u65F6\u957F\u4E0E\u753B\u5E45\u662F\u53C2\u6570"
    });
  }
  return { verdict: checks.every((check) => check.pass) ? "pass" : "fix", checks };
}
function routeModelForGate(durationSec, aspectRatio) {
  return routeModel({ durationSec, aspectRatio });
}

// src/persona.ts
var CHENGPIAN_PERSONA = "\u6210\u7247";
var MODES = ["\u4E25\u683C", "\u81EA\u52A8", "\u534F\u540C"];
var VARIANT_LENSES = [
  { shotSize: "LS", lighting: "soft-window", composition: "depth-layers", cameraMove: "static", label: "\u5EFA\u7ACB\u955C\u5934" },
  { shotSize: "MCU", lighting: "rembrandt", composition: "rule-of-thirds", cameraMove: "push_in", label: "\u4EBA\u7269\u8FD1\u903C" },
  { shotSize: "CU", lighting: "low-key", composition: "negative-space", cameraMove: "static", label: "\u60C5\u7EEA\u7279\u5199" },
  { shotSize: "MS", lighting: "golden-hour", composition: "symmetry", cameraMove: "pan", label: "\u52A8\u4F5C\u4E2D\u666F" }
];
function parseInitiative(raw) {
  if (typeof raw === "string" && MODES.includes(raw)) return raw;
  return "\u534F\u540C";
}
function clampPromptCount(requested) {
  const n = requested ?? 3;
  return Math.max(2, Math.min(4, Math.round(n)));
}
function draftDirectorPrompts(task, count = 3) {
  const subject = task.trim() === "" ? "\u4E3B\u4F53\u5728\u573A\uFF0C\u5B8C\u6210\u4E00\u4E2A\u53EF\u89C2\u5BDF\u7684\u52A8\u4F5C" : task.trim();
  const n = clampPromptCount(count);
  return VARIANT_LENSES.slice(0, n).map((lens) => {
    const built = buildShotPrompt({
      subject,
      action: "one complete observable action with a start and end state",
      shotSize: lens.shotSize,
      lighting: lens.lighting,
      composition: lens.composition,
      cameraMove: lens.cameraMove
    });
    return `\u3010${lens.label}\u3011${built.prompt}`;
  });
}
function decideChengpian(mode, event) {
  const base = {
    persona: CHENGPIAN_PERSONA,
    mode,
    loadKnowledge: true,
    loadSkill: true
  };
  if (mode === "\u4E25\u683C") {
    if (event.kind === "unclear") {
      return {
        ...base,
        confirm: true,
        generate: false,
        promptCount: 0,
        placeholders: false,
        prompts: [],
        reason: "\u4E25\u683C\uFF1A\u7B2C\u4E00\u4E2A\u4E0D\u660E\u786E\u4E8B\u4EF6\u53CA\u65F6\u5411\u7528\u6237\u786E\u8BA4\uFF1B\u786E\u8BA4\u6B21\u6570\u8F83\u591A\uFF1B\u7EDD\u4E0D\u81EA\u5DF1\u6267\u884C\u751F\u6210"
      };
    }
    const promptCount = clampPromptCount(event.variantCount);
    const prompts2 = draftDirectorPrompts(event.prompt ?? "", promptCount);
    return {
      ...base,
      confirm: true,
      generate: false,
      promptCount,
      placeholders: true,
      prompts: prompts2,
      reason: "\u4E25\u683C\uFF1A\u7EDD\u4E0D\u81EA\u5DF1\u6267\u884C\u751F\u6210\uFF1B\u6BCF\u4E2A\u751F\u6210\u4EFB\u52A1\u63D0\u4F9B\u4E8C\u5230\u56DB\u4E2A\u63D0\u793A\u8BCD\u4F9B\u7528\u6237\u9009\u62E9"
    };
  }
  if (mode === "\u81EA\u52A8") {
    if (event.kind === "unclear") {
      const necessary = event.necessaryAsk === true;
      return {
        ...base,
        confirm: necessary,
        generate: false,
        promptCount: 0,
        placeholders: false,
        prompts: [],
        reason: necessary ? "\u81EA\u52A8\uFF1A\u5FC5\u8981\u6B67\u4E49\u624D\u95EE" : "\u81EA\u52A8\uFF1A\u975E\u5FC5\u8981\u4E0D\u8BE2\u95EE\u7528\u6237"
      };
    }
    const inBudget = event.inBudget !== false;
    const prompts2 = event.prompt !== void 0 && event.prompt.trim() !== "" ? [event.prompt.trim()] : [];
    return {
      ...base,
      confirm: !inBudget,
      generate: inBudget,
      promptCount: prompts2.length,
      placeholders: !inBudget,
      prompts: prompts2,
      reason: inBudget ? "\u81EA\u52A8\uFF1A\u9884\u7B97\u8303\u56F4\u5185\u76F4\u63A5\u6267\u884C\u751F\u6210" : "\u81EA\u52A8\uFF1A\u8D85\u51FA\u9884\u7B97\u5148\u786E\u8BA4\uFF0C\u4E0D\u76F4\u63A5\u6267\u884C\u751F\u6210"
    };
  }
  if (event.kind === "unclear") {
    return {
      ...base,
      confirm: true,
      generate: false,
      promptCount: 0,
      placeholders: false,
      prompts: [],
      reason: "\u534F\u540C\uFF1A\u4E0D\u660E\u786E\u65F6\u5411\u7528\u6237\u786E\u8BA4\uFF0C\u4F46\u4E0D\u81EA\u5DF1\u6267\u884C\u751F\u6210"
    };
  }
  const prompt = (event.prompt ?? "").trim();
  const prompts = prompt === "" ? [] : [prompt];
  return {
    ...base,
    confirm: false,
    generate: false,
    promptCount: prompts.length,
    placeholders: true,
    prompts,
    reason: "\u534F\u540C\uFF1A\u4E0D\u76F4\u63A5\u6267\u884C\u751F\u6210\uFF1B\u6BCF\u6B21\u751F\u6210\u4EFB\u52A1\u53EA\u7ED9\u51FA\u63D0\u793A\u8BCD\u548C\u5360\u4F4D\uFF0C\u7528\u6237\u4ECE\u5934\u5BA1\u9605\u540E\u6267\u884C\u751F\u6210"
  };
}
function planPlaceholderEnqueue(input) {
  const mode = parseInitiative(input.mode);
  const prompt = input.prompt.trim();
  if (mode === "\u4E25\u683C" && input.chosen !== true) {
    const prompts = draftDirectorPrompts(prompt === "" ? "\u4E3B\u4F53\u5728\u573A\uFF0C\u5B8C\u6210\u4E00\u4E2A\u53EF\u89C2\u5BDF\u7684\u52A8\u4F5C" : prompt, input.variantCount);
    return { expand: true, prompts, reason: "\u4E25\u683C\uFF1A\u6BCF\u4E2A\u751F\u6210\u4EFB\u52A1\u5148\u51FA\u4E8C\u5230\u56DB\u4E2A\u63D0\u793A\u8BCD\u4F9B\u7528\u6237\u9009\u62E9" };
  }
  return {
    expand: false,
    prompts: prompt === "" ? [] : [prompt],
    reason: input.chosen === true ? "\u7528\u6237\u5DF2\u9009\u5B9A\u63D0\u793A\u8BCD\uFF0C\u5165\u961F\u5355\u6761\u5360\u4F4D" : "\u63D0\u793A\u8BCD\u548C\u5360\u4F4D\uFF0C\u4F9B\u5BA1\u9605\u540E\u6267\u884C\u751F\u6210"
  };
}
function resolveGenerateAuthorization(input) {
  const mode = parseInitiative(input.mode);
  if (input.proposal !== void 0 && input.proposal !== null) {
    if (input.proposal.status === "approved") {
      return {
        generate: true,
        prompt: input.proposal.prompt,
        reason: "\u7528\u6237\u5DF2\u5BA1\u9605\u5E76\u6279\u51C6\u5360\u4F4D\uFF0C\u6267\u884C\u751F\u6210",
        authorized: true
      };
    }
    return {
      generate: false,
      prompt: input.proposal.prompt,
      reason: `\u63D0\u6848 ${input.proposal.status}\uFF0C\u5C1A\u672A\u6279\u51C6\uFF0C\u4E0D\u5F97\u6267\u884C\u751F\u6210`,
      authorized: false
    };
  }
  if (mode === "\u81EA\u52A8" && input.inBudget !== false) {
    return {
      generate: true,
      prompt: (input.prompt ?? "").trim(),
      reason: "\u81EA\u52A8\uFF1A\u9884\u7B97\u8303\u56F4\u5185\u76F4\u63A5\u6267\u884C\u751F\u6210",
      authorized: false
    };
  }
  return {
    generate: false,
    prompt: (input.prompt ?? "").trim(),
    reason: "\u672A\u6388\u6743\uFF1A\u4E25\u683C/\u534F\u540C\u4E0D\u5F97\u81EA\u884C\u6267\u884C\u751F\u6210\uFF0C\u5148\u5360\u4F4D\u5E76\u7ECF\u7528\u6237\u5BA1\u9605",
    authorized: false
  };
}
function runChengpianEvent(input) {
  return decideChengpian(parseInitiative(input.mode), {
    kind: input.event,
    prompt: input.prompt,
    inBudget: input.inBudget,
    necessaryAsk: input.necessaryAsk,
    variantCount: input.variantCount
  });
}
function chengpianAskQuestions(decision, event) {
  if (event === "generate" && decision.prompts.length > 0) {
    return [{
      id: "prompt",
      header: "\u9009\u63D0\u793A\u8BCD",
      question: "\u9009\u4E00\u6761\u5BFC\u6F14\u89D2\u5EA6\u63D0\u793A\u8BCD\u5165\u961F\u3002\u4E0D\u8981\u5728\u6B63\u6587\u91CC\u518D\u5217\u4E00\u904D\u83DC\u5355\u3002",
      options: decision.prompts.map((line, index) => ({
        label: `\u89D2\u5EA6 ${index + 1}`,
        description: line.slice(0, 160)
      })),
      recommended: "\u89D2\u5EA6 1"
    }];
  }
  return [{
    id: "forks",
    header: "\u6210\u7247\u5206\u53C9",
    question: "\u5148\u5B9A\u4F1A\u5F71\u54CD\u540E\u9762\u6240\u6709\u955C\u5934\u7684\u5206\u53C9\u3002\u63A8\u8350\u503C\u5DF2\u6807\u51FA\uFF0C\u53EF\u6539\u3002",
    options: [
      { label: "15\u79D2 16:9 \u7535\u5F71\u611F", description: "\u77ED\u7247\u9ED8\u8BA4\uFF1A\u6A2A\u5C4F\u300115 \u79D2\u5185\u3001\u7535\u5F71\u5149\u5F71" },
      { label: "30\u79D2 9:16 \u7AD6\u5C4F", description: "\u77ED\u89C6\u9891\u9ED8\u8BA4" },
      { label: "\u591A\u955C\u53D9\u4E8B\u6A2A\u5C4F", description: "\u8981\u5267\u672C/\u5206\u955C/\u89D2\u8272\u8868\uFF0C\u786E\u8BA4\u540E\u518D\u843D\u753B\u5E03" },
      { label: "\u6211\u8865\u5145\u7EA6\u675F", description: "\u65F6\u957F/\u753B\u5E45/\u6539\u7F16\u5E45\u5EA6\u6211\u81EA\u5DF1\u8BF4" }
    ],
    recommended: "15\u79D2 16:9 \u7535\u5F71\u611F"
  }];
}
function chengpianPersonaText(mode) {
  return [
    "## \u6210\u7247 persona",
    `- You are DirectorX in the dedicated **\u6210\u7247** persona. Analyse every request from a **\u5BFC\u6F14\u89D2\u5EA6** (blocking, continuity, light, lens, emotion, cut). Do not guess craft: actively load \u6210\u7247-related **\u77E5\u8BC6\u5E93** via \`directorx_knowledge_search\` / \`directorx_knowledge_read\` and the matching **skill** body via \`directorx_skill_search\` / \`directorx_skill_read\` (\`directorx-chengpian\`, \`directorx-methodology\`, \`directorx-production-lead\`) before planning or generating.`,
    `- Initiative mode is **${mode}**. Call \`directorx_chengpian\` on unclear events and before every generation unit.`,
    "- **\u4E25\u683C**: \u7B2C\u4E00\u4E2A\u4E0D\u660E\u786E\u7684\u4E8B\u4EF6\u53CA\u65F6\u5411\u7528\u6237\u786E\u8BA4\uFF1B\u786E\u8BA4\u6B21\u6570\u8F83\u591A\uFF1B\u7EDD\u4E0D\u81EA\u5DF1\u6267\u884C\u751F\u6210\uFF1B\u6BCF\u4E2A\u751F\u6210\u4EFB\u52A1\u63D0\u4F9B**\u4E8C\u5230\u56DB\u4E2A\u63D0\u793A\u8BCD**\uFF0C\u7528 `directorx_ask` \u63D0\u95EE\u5361\u8BA9\u7528\u6237\u9009\uFF08\u7981\u6B62\u5728\u6B63\u6587\u91CC\u5199 1.2.3. \u83DC\u5355\uFF09\uFF1B\u9009\u5B9A\u540E `directorx_propose` chosen=true \u5165\u961F\u5355\u6761\u5360\u4F4D\uFF1B\u6279\u51C6\u540E\u5E26 `proposalId` \u6267\u884C\u751F\u6210\u3002",
    "- **\u81EA\u52A8**: \u975E\u5FC5\u8981\u4E0D\u4F1A\u8BE2\u95EE\u7528\u6237\uFF1B\u5728\u9884\u7B97\u8303\u56F4\u5185\u4F1A\u76F4\u63A5\u5E72\uFF0C**\u76F4\u63A5\u6267\u884C\u751F\u6210**\u3002",
    "- **\u534F\u540C**: \u4E5F\u4F1A\u95EE\u7528\u6237\uFF0C\u4F46\u6BD4\u8F83\u4E3B\u52A8\uFF1B\u4E0D\u76F4\u63A5\u6267\u884C\u751F\u6210\uFF1B\u5DE5\u4F5C\u5230\u6700\u540E\u4EA7\u51FA\u89C6\u9891\u8BA1\u5212\uFF1B\u6BCF\u6B21\u9047\u5230\u751F\u6210\u4EFB\u52A1\u53EA\u7ED9\u51FA**\u63D0\u793A\u8BCD\u548C\u5360\u4F4D**\uFF0C\u7528\u6237\u6700\u540E\u4ECE\u5934\u5F00\u59CB\u4E00\u4E2A\u4E2A\u5BA1\u9605\u7136\u540E\u5E26 `proposalId` \u6267\u884C\u751F\u6210\u3002",
    "- \u6D41\u7A0B\u95F8\uFF1A\u5148 `directorx_brief` / `directorx_chengpian` \u2192 \u5206\u53C9\u7528 `directorx_ask` \u2192 \u5267\u672C/\u5206\u955C `directorx_confirm` \u2192 **\u7B7E\u5B57\u540E\u624D**\u843D\u753B\u5E03\u3002\u751F\u6210\u524D\u5FC5\u987B knowledge_read + skill_read +\uFF08\u5FC5\u8981\u65F6\u5916\u90E8\u8C03\u7814\uFF09+ `directorx_prompt_craft` + `directorx_generate_ready`\u3002ready \u4F1A\u95EE\uFF1A\u8981\u4E0D\u8981\u4EBA\u7269\u8BBE\u5B9A\u56FE\u3001\u573A\u666F\u53C2\u8003\u3001\u5173\u952E\u5E27\u3001\u9996\u5C3E\u5E27\u3001\u56FE\u751F\u8FD8\u662F\u6587\u751F\u3002\u7F3A\u53C2\u8003\u5148\u8865\u8D44\u4EA7\uFF0C\u7981\u6B62\u628A\u7528\u6237\u539F\u53E5\u5F53\u63D0\u793A\u8BCD\uFF0C\u4E5F\u7981\u6B62\u53C2\u8003\u4E0D\u9F50\u5C31 generate\u3002\u9636\u6BB5\u4EA7\u7269\u5199\u5165 `directorx_stage`\u3002",
    "- NEVER write a numbered 1. 2. 3. choice menu in assistant text. Call `directorx_ask` so the WebUI renders a card.",
    "- \u89D2\u8272\u51FA\u56FE\uFF1A\u5148 `directorx_skill_read` `novel-characters`\u3002\u4E00\u5F20\u56FE\u5FC5\u987B\u662F 16:9 \u8BBE\u5B9A\u8868\uFF08\u5DE6\u680F\u534A\u8EAB\u57FA\u51C6 + \u53F3\u680F\u6B63\u89C6/\u4FA7\u89C6/\u80CC\u89C6\uFF09\uFF0C\u7981\u6B62\u5355\u5F20\u5267\u7167\u5192\u5145\u4E09\u89C6\u56FE\u3002",
    "- \u843D\u753B\u5E03\u540E\u7ACB\u523B `directorx_canvas_arrange`\uFF0C\u4FDD\u8BC1\u5206\u955C\u6A2A\u6761\u53EF\u8BFB\uFF0C\u4E0D\u8981\u53E0\u5728\u539F\u70B9\u3002"
  ].join("\n");
}

// src/providers/contact-sheet.ts
import { spawnSync as spawnSync4 } from "node:child_process";
import { join as join16 } from "node:path";
async function contactSheet(input) {
  if (input.sources.length === 0) throw new Error("contact sheet needs at least one source");
  const columns = Math.min(8, Math.max(2, input.columns ?? 4));
  await ensureOutputDir(input.outputDir);
  const frames = [];
  for (const source of input.sources) {
    const probe = probeMedia(source);
    const duration = probe.durationSec ?? 0;
    const midpoint = Number((duration / 2).toFixed(2));
    const extracted = await extractFrames(source, input.outputDir, { at: [midpoint] });
    const framePath = extracted[0]?.path;
    if (framePath !== void 0) frames.push({ source, t: midpoint, framePath });
  }
  if (frames.length === 0) throw new Error("\u6CA1\u6709\u62BD\u5230\u4EFB\u4F55\u5E27\uFF08\u68C0\u67E5\u7D20\u6750\u662F\u5426\u53EF\u8BFB\uFF09");
  const out = join16(resolveOutputDir(input.outputDir), `contact-sheet-${Date.now().toString(36)}.png`);
  const rows = Math.ceil(frames.length / columns);
  const args = ["-hide_banner", "-y"];
  for (const frame of frames) args.push("-i", frame.framePath);
  const parts = [];
  frames.forEach((_, index) => {
    parts.push(`[${index}:v]scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2[f${index}]`);
  });
  const rowLabels = [];
  for (let row = 0; row < rows; row += 1) {
    const rowFrames = frames.slice(row * columns, row * columns + columns);
    const inputs = rowFrames.map((_, index) => `[f${row * columns + index}]`).join("");
    const label = `[row${row}]`;
    if (rowFrames.length === columns) parts.push(`${inputs}hstack=inputs=${columns}${label}`);
    else {
      const colorLabels = [];
      for (let extra = rowFrames.length; extra < columns; extra += 1) {
        parts.push(`color=black:s=320x180[c${row}x${extra}]`);
        colorLabels.push(`[c${row}x${extra}]`);
      }
      parts.push(`${inputs}${colorLabels.join("")}hstack=inputs=${columns}${label}`);
    }
    rowLabels.push(label);
  }
  if (rowLabels.length === 1) parts.push(`${rowLabels[0]}null[out]`);
  else parts.push(`${rowLabels.join("")}vstack=inputs=${rowLabels.length}[out]`);
  const filterComplex = parts.join(";");
  args.push("-filter_complex", filterComplex, "-map", "[out]", "-frames:v", "1", out);
  const result = spawnSync4("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`contact sheet failed: ${result.stderr?.slice(-300)}`);
  return { path: out, frames, columns };
}

// src/presets.ts
var PRESET_TABLE = [
  {
    slug: "douyin-oral",
    label: "\u6296\u97F3\u53E3\u64AD",
    aspectRatio: "9:16",
    durationRange: [5, 10],
    cameraMoves: ["static", "push_in", "pan", "static"],
    styleSlug: "commercial",
    rules: ["\u89C4\u5219 62 \u7AD6\u5C4F\u8FD0\u955C\uFF1A\u63A8\u62C9/\u4EF0\u4FEF\u5B89\u5168\uFF0C\u6A2A\u79FB\u8DDF\u62CD\u7981\u7528", "\u89C4\u5219 59 \u65F6\u957F\u5199\u53C2\u6570\u4E0D\u5199\u63D0\u793A\u8BCD", "\u89C4\u5219 21 \u53E3\u64AD 4 \u5B57\u6BCF\u79D2\u9884\u7B97"]
  },
  {
    slug: "xiaohongshu-mix",
    label: "\u5C0F\u7EA2\u4E66\u6DF7\u526A",
    aspectRatio: "3:4",
    durationRange: [2, 5],
    cameraMoves: ["static", "tilt", "parallax", "element", "static"],
    styleSlug: "cyberpunk",
    rules: ["\u89C4\u5219 10 \u5361\u70B9\u65F6\u957F\u5206\u914D\u8868\uFF1A\u91CD\u97F3 0.5-1s", "\u89C4\u5219 17 cut-on-beat/cut-on-breath \u4EA4\u66FF", "\u89C4\u5219 85 \u5C0F\u7EA2\u4E66\u5C01\u9762 1:1 \u5B89\u5168\u533A"]
  },
  {
    slug: "bilibili-long",
    label: "B\u7AD9\u4E2D\u957F\u89C6\u9891",
    aspectRatio: "16:9",
    durationRange: [8, 15],
    cameraMoves: ["static", "pan", "tilt", "parallax", "static"],
    styleSlug: "documentary",
    rules: ["\u89C4\u5219 50 \u4E09\u5E55 20/60/20\uFF08\u4E2D\u89C6\u9891\uFF09", "\u89C4\u5219 51 \u77E5\u8BC6\u7C7B\u70ED\u5FEB\u542F\u52A8\u5F00\u573A", "\u89C4\u5219 36 ASL 4-6s \u65E5\u5E38\u8282\u594F"]
  },
  {
    slug: "ads-vertical",
    label: "\u5E7F\u544A\u7AD6\u5C4F",
    aspectRatio: "9:16",
    durationRange: [3, 8],
    cameraMoves: ["push_in", "orbit", "push_in"],
    styleSlug: "commercial",
    rules: ["\u89C4\u5219 70 \u5E7F\u544A\u5F00\u573A\u7ED9\u7ED3\u679C\u518D\u5012\u53D9", "\u89C4\u5219 71 \u53EA\u53D8\u4E00\u4E2A\u53D8\u91CF\u7684 A/B \u7EAA\u5F8B", "\u89C4\u5219 26 \u8D1F\u9762\u56DB\u7C7B\u57FA\u7EBF"]
  },
  {
    slug: "drama-horizontal",
    label: "\u5267\u60C5\u6A2A\u5C4F",
    aspectRatio: "16:9",
    durationRange: [5, 10],
    cameraMoves: ["parallax", "tilt", "push_in", "pull_out", "static"],
    styleSlug: "cinematic",
    rules: ["\u89C4\u5219 36 \u666F\u522B\u63A8\u8FDB\u5E8F\u5217", "\u89C4\u5219 37 \u8FD0\u955C\u52A8\u673A\u5F8B", "\u89C4\u5219 52 Setup-Payoff \u914D\u5BF9\u8868"]
  },
  {
    slug: "mv",
    label: "MV/\u97F3\u4E50",
    aspectRatio: "9:16",
    durationRange: [2, 6],
    cameraMoves: ["parallax", "push_in", "element", "tilt", "static"],
    styleSlug: "wong-kar-wai",
    rules: ["\u89C4\u5219 10 \u5361\u70B9\u5206\u914D\u8868", "\u89C4\u5219 24 \u5361\u70B9\u5C42\u7EA7\u8868\uFF1A\u9F13\u70B9=\u5FEB\u5207", "\u89C4\u5219 57 \u97F3\u4E50\u4E09\u652F\u67F1"]
  }
];
function generationPreset(slug) {
  const preset = PRESET_TABLE.find((entry) => entry.slug === slug);
  if (preset === void 0) return null;
  const mid = Math.round((preset.durationRange[0] + preset.durationRange[1]) / 2);
  const models = routeModel({ durationSec: mid, aspectRatio: preset.aspectRatio });
  return { ...preset, models };
}
function listPresets() {
  return PRESET_TABLE.map(({ slug, label, aspectRatio, durationRange }) => ({ slug, label, aspectRatio, durationRange }));
}

// src/style-constants.ts
import { mkdir as mkdir12, readFile as readFile12, writeFile as writeFile7 } from "node:fs/promises";
import { join as join17 } from "node:path";
var ProjectStyleStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join17(resolveOutputDir(this.outputDir), "style.json");
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile12(this.filePath(), "utf8"));
      if (typeof parsed.camera !== "string") return null;
      return parsed;
    } catch {
      return null;
    }
  }
  async set(input) {
    const current = await this.read();
    const merged = {
      camera: input.camera ?? current?.camera ?? "",
      palette: input.palette ?? current?.palette ?? "",
      lighting: input.lighting ?? current?.lighting ?? "",
      sceneAnchors: input.sceneAnchors ?? current?.sceneAnchors ?? [],
      negativeBaseline: input.negativeBaseline ?? current?.negativeBaseline ?? "",
      at: Date.now()
    };
    await mkdir12(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile7(this.filePath(), JSON.stringify(merged, null, 2), "utf8");
    return merged;
  }
  /** 生成提示词的常量块（逐字复用）。 */
  block() {
    return "";
  }
};

// src/terms.ts
import { mkdir as mkdir13, readFile as readFile13, writeFile as writeFile8 } from "node:fs/promises";
import { join as join18 } from "node:path";
var TermStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join18(resolveOutputDir(this.outputDir), "terms.json");
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile13(this.filePath(), "utf8"));
      return Array.isArray(parsed.terms) ? parsed.terms : [];
    } catch {
      return [];
    }
  }
  async set(entries) {
    const ledger = await this.read();
    for (const entry of entries) {
      const term = entry.term.trim().slice(0, 100);
      if (term === "") continue;
      const index = ledger.findIndex((existing) => existing.term === term);
      if (index >= 0) ledger[index] = { term, reading: entry.reading.slice(0, 200), at: Date.now() };
      else ledger.push({ term, reading: entry.reading.slice(0, 200), at: Date.now() });
    }
    await mkdir13(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile8(this.filePath(), JSON.stringify({ terms: ledger }, null, 2), "utf8");
    return ledger;
  }
  /** 按句命中：返回文本中出现的术语及其读法。 */
  async match(text) {
    const ledger = await this.read();
    return ledger.filter((entry) => text.includes(entry.term));
  }
};

// src/orchestrate/run.ts
import { mkdir as mkdir14, writeFile as writeFile9 } from "node:fs/promises";
import { join as join19 } from "node:path";

// src/compose.ts
var RECIPES = {
  promo: { file: "recipes/promo-video.md", name: "\u5BA3\u4F20\u7247" },
  literary: { file: "recipes/novel-adaptation.md", name: "\u5C0F\u8BF4\u6539\u7F16" },
  remake: { file: "recipes/remake-subject.md", name: "\u62C9\u7247\u590D\u523B" },
  narrative: { file: "recipes/unit-production.md", name: "\u5355\u5143\u5316\u5236\u4F5C" },
  talk: { file: "recipes/tutorial-video.md", name: "\u6559\u7A0B/\u53E3\u64AD" },
  montage: { file: "recipes/clip-recut.md", name: "\u6DF7\u526A" }
};
function composeKindFromBriefType(type) {
  if (type === "\u5E7F\u544A/\u5BA3\u4F20") return "promo";
  if (type === "\u6539\u7F16/\u957F\u5267") return "literary";
  if (type === "\u62C9\u7247/\u590D\u523B") return "remake";
  if (type === "\u53E3\u64AD/\u8BB2\u89E3") return "talk";
  if (type === "\u6DF7\u526A/\u5361\u70B9") return "montage";
  return "narrative";
}
function commonSignoff() {
  return {
    name: "\u4F4D",
    purpose: "\u6BCF\u4E2A\u751F\u6210\u5355\u5143\u6392\u961F\u5B8C\u6574\u5360\u4F4D\uFF08\u63D0\u793A\u8BCD + \u63A8\u8350\u6A21\u578B + \u89C4\u683C\uFF09\uFF0C\u5BFC\u51FA\u5206\u955C\u8868\u7ED9\u7528\u6237\u7B7E\u5B57\uFF1B\u786E\u8BA4\u524D\u4E0D\u751F\u6210",
    tools: ["directorx_propose", "directorx_canvas_shotlist", "directorx_confirm"],
    phase: "refine"
  };
}
function stagesFor(kind, hasMaterials) {
  const inventory = {
    name: "\u6790",
    purpose: hasMaterials ? "\u8BFB\u8BF7\u6C42\u4E0E\u7D20\u6750\uFF0C\u8BF4\u660E\u7406\u89E3\u4E0E\u7F3A\u53E3" : "\u8BFB\u8BF7\u6C42\uFF0C\u5217\u51FA\u672A\u77E5\u9879\uFF08\u54C1\u724C\u4E8B\u5B9E / \u539F\u4F5C / \u6E90\u7247\uFF09",
    tools: hasMaterials ? ["directorx_video_analyze", "directorx_probe_media", "directorx_canvas_get"] : ["directorx_brief"],
    phase: "plan"
  };
  const research = {
    name: "\u7814",
    purpose: "\u5DE5\u827A\u6587\u732E + \u5916\u90E8\u4E8B\u5B9E\uFF1B\u68C0\u7D22\u4E0D\u5230\u5C31\u95EE\u7528\u6237\uFF0C\u4E0D\u7F16\u9020\u54C1\u724C/\u539F\u4F5C/\u6E90\u7247",
    tools: ["directorx_knowledge_search", "directorx_knowledge_read"],
    phase: "plan"
  };
  const ask = {
    name: "\u95EE",
    purpose: "\u4E00\u6B21\u6F84\u6E05\u771F\u6B63\u7684\u5206\u53C9\uFF08\u65F6\u957F/\u753B\u5E45/\u6539\u7F16\u5E45\u5EA6/\u66FF\u6362\u8303\u56F4\uFF09\uFF0C\u6BCF\u9879\u5E26\u63A8\u8350\u9ED8\u8BA4\u3002\u5FC5\u987B directorx_ask \u63D0\u95EE\u5361\uFF0C\u7981\u6B62\u6B63\u6587\u83DC\u5355\u3002",
    tools: ["directorx_ask"],
    phase: "plan"
  };
  if (kind === "promo") {
    return [
      inventory,
      { ...research, purpose: "\u597D\u5BA3\u4F20\u7247\u57FA\u51C6\uFF08\u7ED3\u6784/\u89C6\u89C9/\u5E73\u53F0\uFF09+ \u59D4\u6258\u65B9\u516C\u5F00\u5B9A\u4F4D\uFF0C\u5199\u5165\u4E3B\u9898\u53E5" },
      ask,
      { name: "\u6848", purpose: "\u4E3B\u9898\u53E5 + \u4E09\u5E55 + \u51FA\u955C\u5951\u7EA6 + \u5206\u955C\u8868\uFF08\u542B\u8FDE\u7EED\u6027\uFF09", tools: ["directorx_storyboard", "directorx_character_register"], phase: "create" },
      commonSignoff()
    ];
  }
  if (kind === "literary") {
    return [
      inventory,
      { ...research, purpose: "\u8BFB\u539F\u4F5C\uFF08\u7528\u6237\u6750\u6599\u6216\u516C\u5F00\u6587\u672C\uFF09\uFF0C\u5224\u65AD\u9898\u6750/\u4F53\u91CF/\u6539\u7F16\u98CE\u9669" },
      { ...ask, purpose: "\u4E00\u6B21\u95EE\u6E05\u96C6\u6570\xD7\u5355\u96C6\u65F6\u957F\u3001\u6539\u7F16\u5E45\u5EA6\u3001\u5E73\u53F0\u3001\u753B\u98CE" },
      { name: "\u89D2\u8272", purpose: "cast.json \u95E8\u7981\u8FC7\u4E86\u518D\u5F80\u4E0B", tools: ["directorx_character_register"], phase: "create" },
      { name: "\u5927\u7EB2", purpose: "\u9AA8\u67B6\u62CD\u677F\u540E\u624D\u5199\u5206\u96C6\uFF1Bvalidate \u4E0D\u8FC7\u4E0D\u8FDB\u4E0B\u4E00\u5C42", tools: [], phase: "create" },
      { name: "\u7F8E\u672F", purpose: "\u573A\u666F\u951A + \u5149\u7167\u53D8\u4F53\uFF0C\u753B\u98CE\u4E0E\u89D2\u8272\u540C\u6863", tools: [], phase: "create" },
      { name: "\u5267\u672C", purpose: "\u573A\u6B21/\u8282\u62CD/\u53F0\u8BCD\u672C\uFF0C\u65F6\u957F\u9884\u7B97 \xB115%", tools: [], phase: "create" },
      { name: "\u4EA4\u63A5", purpose: "\u56DB\u4EFD JSON \u4EA4\u7ED9\u5355\u5143\u5316\u5236\u4F5C\u5206\u955C\uFF0C\u518D\u5360\u4F4D", tools: ["directorx_storyboard"], phase: "create" },
      commonSignoff()
    ];
  }
  if (kind === "remake") {
    return [
      { ...inventory, purpose: "\u8FD9\u662F\u590D\u523B\u4E0D\u662F\u65B0\u62CD\u3002\u5217\u51FA\u6E90\u7247\u4E0E\u66FF\u6362\u4E3B\u4F53" },
      { ...research, purpose: "\u62C9\u7247\u5B57\u6BB5\u4E0E\u4E3B\u4F53\u66FF\u6362\u7EAA\u5F8B\uFF08\u9501\u6444\u5F71\u3001\u6362\u8EAB\u4EFD\u3001\u7981\u6E90\u5546\u6807\uFF09" },
      {
        name: "\u62C9\u7247",
        purpose: "\u6709\u6E90\u6587\u4EF6\u5219\u9010\u955C\u62C6\uFF1B\u6CA1\u6709\u5219\u6309\u8BE5\u7C7B\u578B\u53D1\u5E03\u7247\u9AA8\u67B6\u5360\u4F4D\u5E76\u6807\u5F85\u5BF9\u5E27",
        tools: hasMaterials ? ["directorx_video_analyze", "directorx_extract_frames", "directorx_view_image"] : ["directorx_knowledge_search"],
        phase: "create"
      },
      { ...ask, purpose: "\u6E90\u7247\u7248\u672C\u3001\u66FF\u6362\u8303\u56F4\uFF08\u4EBA/\u4EA7\u54C1/endcard\uFF09\u3001\u5360\u4F4D\u6279\u6B21" },
      commonSignoff()
    ];
  }
  if (kind === "talk") {
    return [
      inventory,
      research,
      ask,
      { name: "\u6848", purpose: "\u811A\u672C \u2192 \u914D\u97F3\u89C4\u683C \u2192 \u753B\u9762\u5360\u4F4D", tools: ["directorx_speech_duration"], phase: "create" },
      commonSignoff()
    ];
  }
  if (kind === "montage") {
    return [
      inventory,
      research,
      ask,
      { name: "\u6848", purpose: "\u8282\u62CD\u68C0\u6D4B + \u5361\u70B9\u88C1\u526A\u8BA1\u5212\uFF0C\u80FD\u526A\u5C31\u4E0D\u751F\u6210", tools: ["directorx_audio_beat", "directorx_video_analyze"], phase: "create" },
      commonSignoff()
    ];
  }
  return [
    inventory,
    research,
    ask,
    { name: "\u6848", purpose: "\u6545\u4E8B/\u89D2\u8272\u5951\u7EA6/\u9010\u955C\u5206\u955C\u8868\uFF08\u542B continuity_in/out\uFF09", tools: ["directorx_storyboard", "directorx_character_register"], phase: "create" },
    commonSignoff()
  ];
}
function composeProductionFlow(input) {
  const kind = composeKindFromBriefType(input.type);
  const recipe = RECIPES[kind];
  const hasMaterials = (input.materials ?? []).length > 0;
  const stages = stagesFor(kind, hasMaterials);
  const nextActions = [
    `\u8BFB ${recipe.file}\uFF08skill directorx-recipes / ${recipe.name}\uFF09\u5F53\u5148\u4F8B\uFF0C\u6309\u7D20\u6750\u6539\uFF0C\u4E0D\u662F\u76EE\u5F55`,
    ...stages.flatMap((stage) => {
      if (stage.tools.length === 0) return [`${stage.name}\uFF1A${stage.purpose}`];
      return [`${stage.name}\uFF1A${stage.purpose} \u2014 ${stage.tools.join(" / ")}`];
    }),
    "\u7528\u6237\u7528 /directorx \u770B\u5236\u7247\u677F\uFF0C\u6216 directorx_confirm \u8D70 DSH \u63D0\u95EE\u7B7E\u5B57\uFF1B\u786E\u8BA4\u524D\u4E0D\u751F\u6210\u3002directorx_orchestrate \u662F\u53EF\u9009\u52A0\u901F\uFF0C\u4E0D\u662F\u5FC5\u7ECF\u5165\u53E3"
  ];
  const researchQueries = researchFor(kind, input.request);
  return {
    kind,
    recipe: recipe.file,
    recipeName: recipe.name,
    stages,
    nextActions,
    researchQueries
  };
}
function researchFor(kind, request) {
  const topic = request.replace(/\s+/g, " ").slice(0, 40);
  if (kind === "promo") return [`${topic} \u54C1\u724C\u5B9A\u4F4D`, "\u5BA3\u4F20\u7247 \u5F00\u573A\u7ED3\u6784", "\u54C1\u724C \u89C6\u89C9\u4E00\u81F4\u6027"];
  if (kind === "literary") return [`${topic} \u539F\u4F5C`, "\u5C0F\u8BF4\u6539\u7F16 \u5E45\u5EA6", "\u89D2\u8272\u4E00\u81F4\u6027 \u5916\u89C2\u5951\u7EA6"];
  if (kind === "remake") return [`${topic} \u6E90\u7247\u7ED3\u6784`, "\u62C9\u7247 \u666F\u522B\u8FD0\u955C\u526A\u70B9", "\u4E3B\u4F53\u66FF\u6362 \u5546\u6807\u9694\u79BB"];
  if (kind === "talk") return ["\u53E3\u64AD \u8BED\u901F", "\u8BB2\u89E3 \u5B57\u5E55\u8282\u594F"];
  if (kind === "montage") return ["\u5361\u70B9 \u8282\u62CD", "\u6DF7\u526A \u7D20\u6750\u76D8\u70B9"];
  return ["\u5206\u955C \u8FDE\u7EED\u6027", "\u53D9\u4E8B \u8282\u594F"];
}

// src/providers/brief.ts
var TYPE_RULES = [
  { type: "\u53E3\u64AD/\u8BB2\u89E3", keywords: ["\u4ECB\u7ECD", "\u8BB2\u89E3", "\u53E3\u64AD", "\u6559\u7A0B", "\u79D1\u666E", "\u6D4B\u8BC4", "\u5206\u4EAB"], seconds: 45 },
  { type: "\u5E7F\u544A/\u5BA3\u4F20", keywords: ["\u5E7F\u544A", "\u4EA7\u54C1", "\u5E26\u8D27", "\u5BA3\u4F20", "\u63A8\u5E7F", "\u4FC3\u9500", "\u5BA3\u4F20\u7247", "\u54C1\u724C"], seconds: 75 },
  { type: "\u6539\u7F16/\u957F\u5267", keywords: ["\u6539\u7F16", "\u5C0F\u8BF4", "\u540D\u8457", "\u7535\u89C6\u5267", "\u7F51\u6587"], seconds: 1800 },
  { type: "\u62C9\u7247/\u590D\u523B", keywords: ["\u62C9\u7247", "\u590D\u523B", "\u5BF9\u5E27", "\u4E3B\u4F53\u66FF\u6362"], seconds: 45 },
  { type: "\u6DF7\u526A/\u5361\u70B9", keywords: ["\u6DF7\u526A", "\u5361\u70B9", "\u5408\u96C6", "\u7CBE\u5F69\u96C6\u9526", "\u5FEB\u526A"], seconds: 30 },
  { type: "\u5267\u60C5/\u77ED\u5267", keywords: ["\u77ED\u5267", "\u5267\u60C5", "\u6545\u4E8B", "\u60C5\u666F", "\u8FDE\u7EED\u5267"], seconds: 60 },
  { type: "MV/\u97F3\u4E50", keywords: ["MV", "\u97F3\u4E50", "\u6B4C\u66F2", "\u7FFB\u5531", "\u821E\u8E48"], seconds: 60 },
  { type: "\u7EAA\u5F55\u7247/\u7EAA\u5B9E", keywords: ["\u7EAA\u5F55", "\u7EAA\u5B9E", "\u91C7\u8BBF", "vlog", "Vlog"], seconds: 90 },
  { type: "\u5206\u955C/\u6210\u7247", keywords: ["\u5206\u955C", "\u6210\u7247", "\u77ED\u7247", "\u7535\u5F71\u611F", "\u5BA3\u4F20\u7247"], seconds: 30 }
];
var PLATFORM_RULES = [
  { platform: "\u6296\u97F3", keywords: ["\u6296\u97F3", "\u7AD6\u5C4F", "\u77ED\u89C6\u9891"], aspect: "9:16", coverSpec: "\u89C6\u9891 9:16\uFF0C\u4FE1\u606F\u6D41\u6309 3:4 \u5C55\u793A\uFF0C\u9996\u5E27\u5373\u5C01\u9762\uFF1B\u6838\u5FC3\u5C45\u4E2D\uFF0C\u4E0A\u4E0B 15% \u7559 UI \u533A", titleCap: 55, publishWindows: "21-23 \u70B9\u5CF0\u503C\uFF08\u5B8C\u64AD +41%\uFF09\uFF1B\u70ED\u70B9\u540E 30-90 \u5206\u949F\u53D1\u5E03\u52A0\u6743 3.2x" },
  { platform: "\u5C0F\u7EA2\u4E66", keywords: ["\u5C0F\u7EA2\u4E66"], aspect: "3:4", coverSpec: "1080x1440 3:4\uFF0C\u5927\u6807\u9898/\u4EBA\u8138\u653E\u5C45\u4E2D 1:1 \u5B89\u5168\u533A\uFF08\u4E0A\u4E0B\u5404\u7559 180px\uFF09", titleCap: 20, publishWindows: "7-9 / 12-14 / 20-22 \u70B9\uFF1B\u53D1\u5E03\u540E 1 \u5C0F\u65F6\u4E92\u52A8\u5B9A\u6D41\u91CF\u6C60" },
  { platform: "B\u7AD9", keywords: ["b\u7AD9", "B\u7AD9"], aspect: "16:9", coverSpec: "16:9\uFF0C\u2265640x360\uFF1B\u6807\u9898\u5C01\u9762\u4E0D\u5F97\u4E0E\u5185\u5BB9\u4E0D\u7B26\uFF08\u5C01\u9762\u515A\u7EA2\u7EBF\uFF09", titleCap: 80, publishWindows: "\u64AD\u653E\u9AD8\u5CF0\u524D 30-60 \u5206\u949F\u53D1\u5E03\uFF0C\u907F\u5F00 13 \u70B9\u540E\u53D1\u5E03\u7ADE\u4E89" },
  { platform: "YouTube", keywords: ["youtube", "YouTube", "\u6A2A\u5C4F"], aspect: "16:9", coverSpec: "16:9 \u2265640px\uFF08\u7AD6\u89C6\u9891 16:9 \u5C01\u9762\u4F1A\u88AB\u6362\u6210 4:5\uFF09", titleCap: 100, publishWindows: "\u6309\u53D7\u4F17\u65F6\u533A\uFF1B\u7528\u5B98\u65B9\u300C\u6D4B\u8BD5\u4E0E\u6BD4\u8F83\u300DA/B \u7F29\u7565\u56FE" },
  { platform: "\u89C6\u9891\u53F7", keywords: ["\u89C6\u9891\u53F7"], aspect: "6:7", coverSpec: "\u7AD6 6:7 1080x1260 / \u6A2A 16:9\uFF1B\u6696\u8272\u4EB2\u548C\u98CE\u683C\u4F18\u5148", titleCap: 55, publishWindows: "20-22 \u70B9 + \u670B\u53CB\u5708\u6D3B\u8DC3\u65F6\u6BB5\uFF08\u70B9\u8D5E\u5373\u5206\u53D1\uFF09" }
];
var STYLE_HINTS = {
  "\u8D5B\u535A\u670B\u514B": "cyberpunk",
  "\u8D5B\u535A": "cyberpunk",
  "\u9ED1\u8272\u7535\u5F71": "noir",
  "noir": "noir",
  "\u5409\u535C\u529B": "ghibli",
  "\u97E6\u65AF\u5B89\u5FB7\u68EE": "wes-anderson",
  "\u7EAA\u5F55\u7247": "documentary",
  "\u5E7F\u544A": "commercial",
  "\u590D\u53E4": "retro-80s",
  "\u6050\u6016": "horror",
  "\u7535\u5F71\u611F": "cinematic",
  "\u5199\u5B9E": "cinematic"
};
function secondsFrom(request) {
  const minuteMatch = request.match(/(\d+)\s*分钟/);
  if (minuteMatch !== null) return Number(minuteMatch[1]) * 60;
  const secondMatch = request.match(/(\d+)\s*秒/);
  if (secondMatch !== null) return Number(secondMatch[1]);
  return void 0;
}
function materialKind(path) {
  if (/\.(mp4|mov|webm|avi)$/i.test(path)) return "video";
  if (/\.(png|jpe?g|webp)$/i.test(path)) return "image";
  if (/\.(mp3|wav|m4a|aac)$/i.test(path)) return "audio";
  return "other";
}
async function brief(input) {
  const request = input.request.trim();
  const scored = TYPE_RULES.map((rule) => ({ rule, hits: rule.keywords.filter((keyword) => request.includes(keyword)).length })).filter((entry) => entry.hits > 0).sort((a, b) => b.hits - a.hits);
  const matchedType = scored[0]?.rule;
  const type = matchedType?.type ?? "\u901A\u7528\u77ED\u7247";
  const explicitSeconds = secondsFrom(request);
  const targetSeconds = explicitSeconds ?? matchedType?.seconds ?? 30;
  const platform = PLATFORM_RULES.find((rule) => rule.keywords.some((keyword) => request.includes(keyword)));
  const aspectRatio = platform?.aspect ?? "16:9";
  const platformCard = platform !== void 0 ? { platform: platform.platform, coverSpec: platform.coverSpec, titleCap: platform.titleCap, publishWindows: platform.publishWindows } : null;
  const styleHints = [];
  for (const [keyword, slug] of Object.entries(STYLE_HINTS)) {
    if (request.includes(keyword) && !styleHints.includes(slug)) styleHints.push(slug);
  }
  const characters = [];
  try {
    const registered = await new CharacterStore(input.outputDir).list();
    for (const card of registered) {
      if (request.includes(card.name)) characters.push(card.name);
    }
  } catch {
  }
  const materials = (input.materials ?? []).map((path) => ({ path, kind: materialKind(path) }));
  const questions = [
    { question: "\u53D1\u5E03\u5E73\u53F0\uFF08\u51B3\u5B9A\u753B\u5E45\u4E0E\u8282\u594F\uFF09\uFF1F", default: `${platform?.platform ?? "\u672A\u6307\u5B9A"}\uFF08${aspectRatio}\uFF09` },
    { question: "\u6210\u7247\u65F6\u957F\uFF1F", default: `${targetSeconds}s` },
    { question: "\u98CE\u683C\u57FA\u8C03\uFF1F", default: styleHints.length > 0 ? styleHints.join("/") : "\u7531\u4F60\u6309\u5185\u5BB9\u5B9A\u8C03" },
    ...characters.length > 0 ? [{ question: "\u4E3B\u4F53\u4E00\u81F4\u6027\u951A\u70B9\uFF1F", default: characters.join("/") }] : [],
    ...materials.length > 0 ? [{ question: "\u7D20\u6750\u4F7F\u7528\u65B9\u5F0F\uFF1F", default: `\u63D0\u4F9B ${materials.length} \u4E2A\u7D20\u6750\uFF08${materials.map((material) => material.kind).join("/")}\uFF09\uFF0C\u6309\u9700\u88C1\u526A/\u53C2\u8003` }] : [{ question: "\u9700\u8981\u6211\u5148\u751F\u6210\u7D20\u6750\u8FD8\u662F\u7528\u73B0\u6709\u753B\u5E03\u7D20\u6750\uFF1F", default: "\u753B\u5E03\u7D20\u6750\u4F18\u5148\uFF0C\u7F3A\u5931\u518D\u751F\u6210" }]
  ];
  let suggestedFlow = "\u901A\u7528\u77ED\u7247\u6D41\u6C34\u7EBF\uFF08directorx-pipeline\uFF1A\u5267\u672C\u5206\u955C \u2192 \u63D0\u793A\u8BCD \u2192 \u751F\u6210 \u2192 \u8D28\u68C0 \u2192 \u7EC4\u88C5\uFF09";
  if (type === "\u53E3\u64AD/\u8BB2\u89E3") suggestedFlow = "directorx-talking-video\uFF08\u811A\u672C \u2192 \u914D\u97F3 \u2192 \u7D20\u6750 \u2192 \u5B57\u5E55 \u2192 \u6210\u7247\uFF09";
  if (type === "\u6DF7\u526A/\u5361\u70B9") suggestedFlow = "directorx-montage\uFF08\u7D20\u6750\u76D8\u70B9 \u2192 \u8282\u62CD\u68C0\u6D4B \u2192 \u5361\u70B9\u88C1\u526A \u2192 \u62FC\u63A5 \u2192 \u6DF7\u97F3\uFF09";
  if (type === "\u5E7F\u544A/\u5BA3\u4F20") suggestedFlow = "promo-video\uFF1A\u8C03\u7814\u57FA\u51C6 \u2192 \u811A\u672C\u786E\u8BA4 \u2192 \u5206\u955C \u2192 propose \u5360\u4F4D \u2192 \u7528\u6237\u6267\u884C";
  if (type === "\u6539\u7F16/\u957F\u5267") suggestedFlow = "novel-adaptation\uFF1A\u8BFB\u539F\u4F5C \u2192 \u95EE\u6539\u7F16\u5E45\u5EA6 \u2192 \u89D2\u8272/\u5927\u7EB2/\u7F8E\u672F/\u5267\u672C\u95E8\u7981 \u2192 \u5355\u5143\u5360\u4F4D";
  if (type === "\u62C9\u7247/\u590D\u523B") suggestedFlow = "remake-subject\uFF1A\u62C9\u7247 \u2192 \u9501\u6444\u5F71\u6362\u4E3B\u4F53 \u2192 propose \u5360\u4F4D \u2192 \u7528\u6237\u786E\u8BA4";
  const topic = request.replace(/[帮我做要搞|，。！？\s]/g, "").slice(0, 24);
  const titles = topic === "" ? [] : [
    `3 \u4E2A\u5173\u4E8E\u300C${topic}\u300D\u7684\u771F\u76F8\uFF0C\u7B2C 2 \u4E2A\u6CA1\u4EBA\u544A\u8BC9\u4F60`,
    `\u4E3A\u4EC0\u4E48\u300C${topic}\u300D\u603B\u88AB\u8BEF\u89E3\uFF1F\u4E00\u6B21\u8BF4\u6E05`,
    `\u300C${topic}\u300D\u7684\u6B63\u786E\u6253\u5F00\u65B9\u5F0F\uFF08${targetSeconds}s \u770B\u5B8C\uFF09`
  ];
  const coverPrompt = topic === "" ? null : `\u77ED\u89C6\u9891\u5C01\u9762\uFF1A\u4E3B\u9898\u300C${topic}\u300D\u5927\u5B57\u6807\u9898\u5C45\u4E2D\uFF0C${aspectRatio} \u7AD6\u5E45\u6784\u56FE\uFF0C\u98CE\u683C ${styleHints.length > 0 ? styleHints.join("\u3001") : "\u5E72\u51C0\u9AD8\u5BF9\u6BD4"}\uFF0C\u6807\u9898\u6587\u5B57\u533A\u57DF\u7559\u767D\uFF0C\u4E3B\u4F53\u6E05\u6670\uFF0C\u65E0\u6742\u4E71\u80CC\u666F`;
  const compose = composeProductionFlow({ type, request, materials: input.materials });
  const nextActions = [...compose.nextActions];
  if (characters.length === 0 && (type === "\u5267\u60C5/\u77ED\u5267" || type === "\u5206\u955C/\u6210\u7247" || type === "MV/\u97F3\u4E50")) {
    nextActions.splice(1, 0, "\u7528 directorx_character_register \u6CE8\u518C\u4E3B\u4F53\u951A\u70B9\uFF08\u591A\u955C\u5934\u4E00\u81F4\u6027\u524D\u63D0\uFF09");
  }
  return {
    nextActions,
    compose,
    titles,
    coverPrompt,
    platformCard,
    brief: {
      type,
      typeConfidence: matchedType !== void 0 ? "high" : "low",
      platform: platform?.platform ?? "\u672A\u6307\u5B9A",
      aspectRatio,
      targetSeconds,
      styleHints,
      characters,
      materials
    },
    questions,
    suggestedFlow
  };
}

// src/orchestrate/extract.ts
function parseDurationSeconds(request) {
  if (/半\s*个?\s*小时/.test(request)) return 1800;
  const hour = request.match(/(\d+(?:\.\d+)?)\s*小时/);
  if (hour) return Math.round(Number(hour[1]) * 3600);
  const minute = request.match(/([一二三四五六七八九十两\d]+)\s*分钟/);
  if (minute) return chineseOrArabic(minute[1]) * 60;
  const second = request.match(/(\d+)\s*秒/);
  if (second) return Number(second[1]);
  return void 0;
}
function chineseOrArabic(raw) {
  if (/^\d+$/.test(raw)) return Number(raw);
  const digits = { \u4E00: 1, \u4E8C: 2, \u4E24: 2, \u4E09: 3, \u56DB: 4, \u4E94: 5, \u516D: 6, \u4E03: 7, \u516B: 8, \u4E5D: 9, \u5341: 10 };
  if (raw === "\u5341") return 10;
  if (raw.startsWith("\u5341")) return 10 + (digits[raw.slice(1)] ?? 0);
  if (raw.endsWith("\u5341") && raw.length === 2) return (digits[raw[0] ?? ""] ?? 0) * 10;
  if (raw.includes("\u5341")) {
    const [tens, ones] = raw.split("\u5341");
    return (digits[tens ?? ""] ?? 1) * 10 + (digits[ones ?? ""] ?? 0);
  }
  return digits[raw] ?? 0;
}
function inferProductionKind(request) {
  const text = request.trim();
  const score = (keywords) => keywords.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0);
  const remake = score(["\u62C9\u7247", "\u590D\u523B", "\u5BF9\u5E27", "\u66FF\u6362", "\u6362\u6210", "\u4E3B\u4F53\u66FF\u6362"]);
  const literary = score(["\u6539\u7F16", "\u5C0F\u8BF4", "\u540D\u8457", "\u7F51\u6587", "\u7535\u89C6\u5267", "\u5267\u672C"]);
  const promo = score(["\u5BA3\u4F20\u7247", "\u5E7F\u544A", "\u54C1\u724C", "\u63A8\u5E7F", "promo"]);
  const narrative = score(["\u77ED\u5267", "\u5206\u955C", "\u6210\u7247", "\u6545\u4E8B", "\u5267\u60C5"]);
  const ranked = [
    { kind: "remake", hits: remake },
    { kind: "literary", hits: literary },
    { kind: "promo", hits: promo },
    { kind: "narrative", hits: narrative }
  ];
  ranked.sort((a, b) => b.hits - a.hits);
  if ((ranked[0]?.hits ?? 0) === 0) return "narrative";
  return ranked[0].kind;
}
function extractEntities(request, kind, fallbackSeconds, aspectRatio) {
  const text = request.trim();
  const targetSeconds = parseDurationSeconds(text) ?? fallbackSeconds;
  const entities = { targetSeconds, aspectRatio };
  const brandProduct = text.match(/[为给](.+?)的(.+?)制作/) ?? text.match(/[为给](.+?)做(.+?)宣传/);
  if (brandProduct) {
    entities.brand = brandProduct[1]?.trim();
    entities.product = brandProduct[2]?.replace(/品牌|宣传片|广告片/g, "").trim();
  }
  const novel = text.match(/改编(.+?)的小说(.+?)为/) ?? text.match(/改编(.+?)的(.+?)为/);
  if (novel) {
    entities.author = novel[1]?.replace(/小说/g, "").trim();
    entities.sourceTitle = novel[2]?.replace(/为.+$/, "").trim();
  }
  const titled = text.match(/[《「](.+?)[》」]/);
  if (titled && !entities.sourceTitle) entities.sourceTitle = titled[1];
  const sourceClip = text.match(/拉片分析(.+?)(?:并且|并把|，|。|$)/);
  if (sourceClip) entities.sourceClip = sourceClip[1]?.trim();
  const swapped = text.match(/主体替换为(.+?)进行/) ?? text.match(/替换为(.+?)进行/) ?? text.match(/替换成(.{1,24}?)(?:进行|复刻|$)/) ?? text.match(/换成(.{1,16}?)(?:进行|复刻|$)/);
  if (swapped) entities.replaceSubject = swapped[1]?.trim();
  if (text.includes("\u7535\u89C6\u5267")) entities.format = "\u7535\u89C6\u5267";
  else if (text.includes("\u77ED\u5267")) entities.format = "\u77ED\u5267";
  else if (text.includes("\u5BA3\u4F20\u7247")) entities.format = "\u5BA3\u4F20\u7247";
  else if (kind === "remake") entities.format = "\u590D\u523B\u7247";
  else if (kind === "literary") entities.format = "\u6539\u7F16\u5267";
  else if (kind === "promo") entities.format = "\u5BA3\u4F20\u7247";
  return entities;
}
function slugify2(value) {
  const compact = value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return compact.slice(0, 40) || "subject";
}

// src/orchestrate/plan.ts
function clip(seconds, min, max) {
  return Math.max(min, Math.min(max, seconds));
}
function splitBudget(total, blocks) {
  const weightSum = blocks.reduce((sum, item) => sum + item.weight, 0);
  return blocks.map((item) => ({
    block: item.block,
    purpose: item.purpose,
    seconds: Math.max(1, Math.round(total * (item.weight / weightSum)))
  }));
}
function promoPlan(entities) {
  const brand = entities.brand ?? "\u59D4\u6258\u65B9";
  const product = entities.product ?? brand;
  const subject = `${product} \u54C1\u724C\u4E3B\u4F53`;
  const aspect = entities.aspectRatio;
  const shots = [
    { id: "mark", kind: "image", task: `${product} \u6807\u8BC6\u9501\u5B9A\u56FE`, subject: `${product} wordmark, quiet luxury, no extra ornaments`, lighting: "soft-window", composition: "symmetry", aspectRatio: aspect, note: "\u5168\u7247\u54C1\u724C\u951A" },
    { id: "hook", kind: "video", task: "\u5F00\u573A\u627F\u8BFA", subject: `${subject} at a working surface branded ${brand}`, action: "holds one beat then looks to camera", shotSize: "MCU", cameraMove: "push_in", lighting: "soft-window", durationSec: 5, aspectRatio: aspect, needsAudio: true, note: "3 \u79D2\u5185\u7ED9\u7ED3\u679C" },
    { id: "mechanic", kind: "video", task: "\u4EA7\u54C1\u673A\u5236", subject: `${product} interface or process made visible`, action: "one complete cycle of the product doing its job", shotSize: "LS", angle: "birds-eye", cameraMove: "pan", lighting: "neon", durationSec: 6, aspectRatio: aspect, needsFirstFrame: true, continuity: "frame_chain", note: "\u5356\u673A\u5236\u4E0D\u5356\u6309\u94AE" },
    { id: "identity", kind: "video", task: "\u4E3B\u4F53\u4E00\u81F4", subject: `${subject} locked across three matching frames`, action: "the same face holds while frames change", shotSize: "MS", cameraMove: "parallax", lighting: "rembrandt", durationSec: 6, aspectRatio: aspect, note: "\u8EAB\u4EFD\u9501" },
    { id: "result", kind: "video", task: "\u7ED3\u679C\u56DE\u653E", subject: `finished ${product} piece on a studio monitor, ${brand} in frame`, action: "camera pulls back to the maker watching", shotSize: "MLS", cameraMove: "pull_out", lighting: "golden-hour", durationSec: 7, aspectRatio: aspect, needsAudio: true, note: "\u7ED3\u679C\u955C" },
    { id: "end", kind: "image", task: "\u7ED3\u5C3E\u8BB0\u5FC6\u70B9", subject: `${product} wordmark and one positioning line`, lighting: "soft-window", composition: "symmetry", aspectRatio: aspect, note: "endcard" },
    { id: "vo", kind: "audio", task: `\u65C1\u767D ${entities.targetSeconds}s`, subject: `calm VO naming ${brand} and ${product}`, durationSec: clip(entities.targetSeconds, 15, 120), aspectRatio: aspect, note: "\u540E\u671F\u6DF7\u97F3" }
  ];
  return {
    kind: "promo",
    title: `${brand} \xB7 ${product} \u5BA3\u4F20\u7247`,
    workflow: ["\u6790", "\u7814", "\u95EE", "\u6848", "\u4F4D"],
    entities,
    researchQueries: [`${product} \u54C1\u724C`, "\u5BA3\u4F20\u7247 \u7ED3\u6784", "\u54C1\u724C \u4E00\u81F4\u6027", "\u5E7F\u544A \u5F00\u573A"],
    characters: [{ name: subject, description: `${brand} / ${product} \u51FA\u955C\u4E3B\u4F53\uFF0C\u5168\u7247\u540C\u4E00\u8EAB\u4EFD`, slug: slugify2(product) }],
    confirms: [
      { id: "duration", question: "\u4E3B\u7247\u65F6\u957F\u4E0E\u753B\u5E45\uFF1F", options: [`${entities.targetSeconds}s / ${aspect}\uFF08\u6309\u8BF7\u6C42\uFF09`, "30s \u9884\u544A", `${entities.targetSeconds}s + \u53E6\u5207 9:16`], recommended: 0 },
      { id: "placeholders", question: "\u5360\u4F4D\u5148\u4E0D\u751F\u6210\u3002\u786E\u8BA4\u6279\u6B21\uFF1F", options: ["\u786E\u8BA4\u5168\u90E8\u5360\u4F4D\uFF0C\u6682\u4E0D\u751F\u6210", "\u5148\u8BD5\u70B9\u5F00\u573A 3 \u955C", "\u6539\u4E3B\u9898\u53E5\u540E\u518D\u6392\u961F"], recommended: 0 }
    ],
    shots,
    durationBudget: splitBudget(entities.targetSeconds, [
      { block: "\u5F00\u573A\u627F\u8BFA", purpose: "3 \u79D2\u7ED9\u7ED3\u679C", weight: 1 },
      { block: "\u673A\u5236\u8499\u592A\u5947", purpose: "\u4EA7\u54C1\u5982\u4F55\u5DE5\u4F5C", weight: 3 },
      { block: "\u7ED3\u679C", purpose: "\u6210\u7247\u53EF\u89C1", weight: 2 },
      { block: "\u8BB0\u5FC6\u70B9", purpose: "\u540D\u79F0+\u4E00\u53E5\u5B9A\u4F4D", weight: 1 }
    ])
  };
}
function literaryPlan(entities) {
  const title = entities.sourceTitle ?? "\u6E90\u6587\u672C";
  const author = entities.author ?? "\u539F\u4F5C\u8005";
  const format = entities.format ?? "\u6539\u7F16\u5267";
  const aspect = entities.aspectRatio;
  const acts = [
    { block: "\u5E8F", purpose: "\u4E3B\u9898\u53E5\u4E0E\u4E16\u754C", weight: 2 },
    { block: "\u5EFA\u7ACB", purpose: "\u4EBA\u7269\u8FDB\u5165\u5904\u5883", weight: 3 },
    { block: "\u8F6C\u6298", purpose: "\u4E0D\u53EF\u9006\u4E8B\u4EF6", weight: 3 },
    { block: "\u4EE3\u4EF7", purpose: "\u635F\u5931\u5750\u5B9E", weight: 3 },
    { block: "\u518D\u5165", purpose: "\u88AB\u539F\u79E9\u5E8F\u62D2\u7EDD", weight: 2 },
    { block: "\u6536\u675F", purpose: "\u5F00\u653E\u95EE\u53E5", weight: 2 }
  ];
  const budget = splitBudget(entities.targetSeconds, acts);
  const lead = `\u300A${title}\u300B\u4E3B\u89D2`;
  const power = `\u300A${title}\u300B\u5BF9\u5CD9\u65B9`;
  const shots = [
    { id: "c-lead", kind: "image", task: `${lead}\u8BBE\u5B9A\u56FE`, subject: `${lead} from ${author}'s ${title}, period-correct, three-view sheet`, lighting: "soft-window", composition: "symmetry", aspectRatio: aspect, note: "\u5916\u89C2\u5951\u7EA6\uFF0C\u4E0D\u6284\u65E2\u6709\u5F71\u89C6\u9020\u578B" },
    { id: "c-power", kind: "image", task: `${power}\u8BBE\u5B9A\u56FE`, subject: `${power} in ${title}, status visible in costume and space`, lighting: "practical", aspectRatio: aspect, note: "\u6743\u529B\u4E00\u65B9" },
    { id: "est", kind: "image", task: `${title}\u4E16\u754C\u7A7A\u955C`, subject: `establishing world of ${title}, empty of hero, atmosphere first`, shotSize: "ELS", lighting: "low-key", composition: "negative-space", aspectRatio: aspect, note: "\u573A\u666F\u677F" }
  ];
  budget.forEach((act, index) => {
    const durationSec = clip(Math.round(act.seconds / 30), 5, 8);
    shots.push({
      id: `act-${index + 1}`,
      kind: "video",
      task: `${act.block}\uFF1A${act.purpose}`,
      subject: `${lead} in ${title}, act "${act.block}"`,
      action: act.purpose,
      shotSize: index === 0 || index === budget.length - 1 ? "CU" : "MS",
      cameraMove: index === 0 ? "static" : "push_in",
      lighting: index >= 3 ? "low-key" : "rembrandt",
      durationSec,
      aspectRatio: aspect,
      needsAudio: index === 0 || index === budget.length - 1,
      note: `${author}\u300A${title}\u300B${format} \xB7 ${act.seconds}s \u6BB5\u843D\u7684\u5173\u952E\u620F\u5267\u955C\uFF0C\u4E0D\u8986\u76D6\u6574\u6BB5\u65F6\u957F`
    });
  });
  return {
    kind: "literary",
    title: `${author}\u300A${title}\u300B${format}`,
    workflow: ["\u6790", "\u7814", "\u95EE", "\u89D2\u8272", "\u5927\u7EB2", "\u4F4D"],
    entities,
    researchQueries: [`${author} ${title}`, "\u5C0F\u8BF4\u6539\u7F16 \u5206\u955C", "\u89D2\u8272\u4E00\u81F4\u6027", "\u65F6\u957F\u9884\u7B97"],
    characters: [
      { name: lead, description: `${author}\u300A${title}\u300B\u53D9\u4E8B\u4E3B\u4F53`, slug: slugify2(`${title}-lead`) },
      { name: power, description: `${title} \u4E2D\u7684\u79E9\u5E8F/\u6743\u529B\u4E00\u65B9`, slug: slugify2(`${title}-power`) }
    ],
    confirms: [
      { id: "adaptation", question: "\u6539\u7F16\u5E45\u5EA6\uFF1F\u9AA8\u67B6\u672A\u786E\u8BA4\u4E0D\u5F97\u6269\u5199\u3002", options: ["\u62BD\u6838\uFF1A\u4FDD\u7559\u4E3B\u9898\u5BF9\u7167\uFF08\u63A8\u8350\uFF09", "\u8FD1\u539F\uFF1A\u6309\u539F\u4F5C\u987A\u5E8F", "\u91CD\u5199\uFF1A\u73B0\u4EE3\u5E73\u884C"], recommended: 0 },
      { id: "duration", question: `${entities.targetSeconds}s \u5982\u4F55\u843D\u5730\uFF1F`, options: [`\u6309 ${budget.length} \u6BB5\u5207\u5757\uFF08\u63A8\u8350\uFF09`, "\u5148\u505A 8 \u5206\u949F\u8BD5\u70B9", "\u62C6\u6210\u591A\u96C6"], recommended: 0 },
      { id: "placeholders", question: "\u89D2\u8272\u951A + \u5404\u6BB5\u5173\u952E\u955C\u5168\u90E8\u5360\u4F4D\uFF0C\u4E0D\u76F4\u63A5\u751F\u6210\u3002", options: ["\u786E\u8BA4\u5168\u90E8\u5360\u4F4D", "\u5148\u51FA\u4E3B\u89D2\u8BBE\u5B9A\u56FE\u8BD5\u70B9", "\u5148\u53EA\u6392\u5F00\u573A"], recommended: 0 }
    ],
    shots,
    durationBudget: budget
  };
}
function remakePlan(entities) {
  const source = entities.sourceClip ?? "\u6E90\u5BA3\u4F20\u7247";
  const subject = entities.replaceSubject ?? "\u66FF\u6362\u4E3B\u4F53";
  const aspect = entities.aspectRatio;
  const beats = ["\u94A9\u5B50", "\u80FD\u529B\u4E00", "\u80FD\u529B\u4E8C", "\u80FD\u529B\u4E09", "\u80FD\u529B\u56DB", "\u627F\u8BFA"];
  const shots = [
    { id: "sheet", kind: "image", task: `${subject} \u66FF\u6362\u7528\u5B9A\u5986`, subject: `${subject}, same eyeline as the source hero close-up, no source trademarks`, lighting: "rembrandt", composition: "rule-of-thirds", aspectRatio: aspect, note: `\u66FF\u6362\u951A\uFF1B\u6E90\u7247\uFF1A${source}` }
  ];
  beats.forEach((beat, index) => {
    shots.push({
      id: `k${index + 1}`,
      kind: "video",
      task: `\u590D\u523B\u955C ${index + 1}\uFF1A${beat}`,
      subject: `${subject} occupying the source frame for "${beat}" from ${source}`,
      action: "same camera move and cut point as the source beat, different identity",
      shotSize: index === 0 ? "CU" : "MCU",
      cameraMove: index === 1 ? "push_in" : "static",
      lighting: index === 0 ? "low-key" : "rembrandt",
      durationSec: index === 0 ? 4 : 6,
      aspectRatio: aspect,
      needsAudio: index === 0 || beat === "\u627F\u8BFA",
      needsFirstFrame: index === 1,
      continuity: index === 1 ? "frame_chain" : void 0,
      note: `\u9501\u6E90\u7247\u666F\u522B/\u8FD0\u955C/\u526A\u70B9\uFF0C\u53EA\u6362\u4E3B\u4F53\u3002\u7981\u6B62\u518D\u73B0 ${source} \u5546\u6807\u3002`
    });
  });
  shots.push({
    id: "end",
    kind: "image",
    task: `${subject} endcard`,
    subject: `${subject} wordmark, no marks from ${source}`,
    lighting: "soft-window",
    composition: "symmetry",
    aspectRatio: aspect,
    note: "\u5546\u6807\u9694\u79BB"
  });
  return {
    kind: "remake",
    title: `${source} \u2192 ${subject} \u590D\u523B`,
    workflow: ["\u6790", "\u7814", "\u62C9\u7247", "\u95EE", "\u4F4D"],
    entities,
    researchQueries: [`${source} \u955C\u5934`, "\u62C9\u7247 \u955C\u5934\u8BED\u8A00", "\u4E3B\u4F53\u66FF\u6362 \u4E00\u81F4\u6027", "\u4EA7\u54C1\u5BA3\u4F20 \u590D\u523B"],
    characters: [{ name: subject, description: `\u66FF\u6362 ${source} \u51FA\u955C\u4E3B\u4F53\uFF0C\u540C\u673A\u4F4D\u540C\u5149\u7EBF`, slug: slugify2(subject) }],
    confirms: [
      { id: "source", question: "\u6E90\u7247\u6309\u54EA\u6761\u65F6\u95F4\u8F74\u62C9\uFF1F", options: ["\u6309\u5E38\u89C1\u53D1\u5E03\u526A\u8F91\u9AA8\u67B6\uFF08\u65E0\u6E90\u6587\u4EF6\u65F6\uFF09", "\u6211\u7A0D\u540E\u4E0A\u4F20\u6E90\u7247\u518D\u5BF9\u5E27", "\u53EA\u62C9\u7247\u3001\u6682\u4E0D\u590D\u523B"], recommended: 0 },
      { id: "swap", question: "\u4E3B\u4F53\u66FF\u6362\u8303\u56F4\uFF1F", options: [`\u4EBA + \u4EA7\u54C1\u754C\u9762\u90FD\u6362\u6210 ${subject}\uFF08\u63A8\u8350\uFF09`, "\u53EA\u6362\u4EBA", "\u53EA\u6362 endcard"], recommended: 0 },
      { id: "placeholders", question: "\u6309\u62C9\u7247\u8868 1:1 \u5360\u4F4D\uFF0C\u4E0D\u76F4\u63A5\u751F\u6210\u3002", options: ["\u786E\u8BA4 1:1 \u5360\u4F4D\u6279\u6B21", "\u5148\u505A\u5BF9\u7167\u8868", "\u5148\u8BD5\u70B9\u7B2C 1 \u955C"], recommended: 0 }
    ],
    shots,
    durationBudget: splitBudget(entities.targetSeconds, [
      { block: "\u94A9\u5B50", purpose: "\u6E90\u7247\u5F00\u573A\u526A\u70B9", weight: 1 },
      { block: "\u80FD\u529B\u8499\u592A\u5947", purpose: "\u5BF9\u4F4D\u66FF\u6362", weight: 4 },
      { block: "\u627F\u8BFA", purpose: "\u4E00\u53E5\u5B9A\u4F4D", weight: 2 },
      { block: "endcard", purpose: "\u65B0\u4E3B\u4F53\u8BB0\u5FC6\u70B9", weight: 1 }
    ])
  };
}
function narrativePlan(entities) {
  const topic = entities.product ?? entities.sourceTitle ?? "\u672C\u7247";
  const aspect = entities.aspectRatio;
  const shots = [1, 2, 3, 4, 5].map((index) => ({
    id: `s${index}`,
    kind: "video",
    task: `${topic} \u955C ${index}`,
    subject: topic,
    action: "one clear observable action with a start and end state",
    shotSize: index === 1 ? "LS" : index === 5 ? "CU" : "MS",
    cameraMove: index === 1 ? "static" : "push_in",
    lighting: "soft-window",
    durationSec: 6,
    aspectRatio: aspect,
    note: "\u901A\u7528\u53D9\u4E8B\u5355\u5143\uFF0C\u786E\u8BA4\u540E\u518D\u751F\u6210"
  }));
  return {
    kind: "narrative",
    title: topic,
    workflow: ["\u6790", "\u7814", "\u95EE", "\u6848", "\u4F4D"],
    entities,
    researchQueries: ["\u5206\u955C \u8FDE\u7EED\u6027", "\u53D9\u4E8B \u8282\u594F"],
    characters: [],
    confirms: [
      { id: "placeholders", question: "\u5148\u5360\u4F4D\u8FD8\u662F\u5148\u6539\u5206\u955C\uFF1F", options: ["\u786E\u8BA4\u5360\u4F4D\uFF0C\u6682\u4E0D\u751F\u6210", "\u5148\u6539\u5206\u955C"], recommended: 0 }
    ],
    shots,
    durationBudget: splitBudget(entities.targetSeconds, [
      { block: "\u5EFA\u7ACB", purpose: "\u7A7A\u95F4", weight: 1 },
      { block: "\u53D1\u5C55", purpose: "\u52A8\u4F5C", weight: 2 },
      { block: "\u6536\u675F", purpose: "\u53CD\u5E94", weight: 1 }
    ])
  };
}
function deriveProductionPlan(kind, entities) {
  if (kind === "promo") return promoPlan(entities);
  if (kind === "literary") return literaryPlan(entities);
  if (kind === "remake") return remakePlan(entities);
  return narrativePlan(entities);
}

// src/orchestrate/run.ts
var IMAGE_MODEL = "gpt-image-2";
var AUDIO_MODEL = "openai-tts";
function recommendVideoModel(shot) {
  const routed = routeModel({
    durationSec: shot.durationSec ?? 6,
    aspectRatio: shot.aspectRatio,
    needsAudio: shot.needsAudio,
    needsFirstFrame: shot.needsFirstFrame,
    needsLastFrame: shot.needsLastFrame
  });
  return routed.eligible[0]?.model ?? "kling-3.0";
}
function toPlaceholder(shot, index) {
  if (shot.kind === "audio") {
    return {
      id: shot.id,
      kind: "audio",
      task: shot.task,
      prompt: `${shot.subject}${shot.action !== void 0 ? `\u3002${shot.action}` : ""}`,
      model: AUDIO_MODEL,
      size: shot.aspectRatio,
      duration: shot.durationSec,
      shotIdx: index + 1,
      continuity: shot.continuity,
      note: shot.note
    };
  }
  const built = buildShotPrompt({
    subject: shot.subject,
    action: shot.action,
    shotSize: shot.shotSize,
    angle: shot.angle,
    cameraMove: shot.kind === "image" ? "static" : shot.cameraMove,
    lighting: shot.lighting,
    mood: shot.mood,
    composition: shot.composition,
    durationSec: shot.durationSec
  });
  const model = shot.kind === "image" ? IMAGE_MODEL : recommendVideoModel(shot);
  return {
    id: shot.id,
    kind: shot.kind,
    task: shot.task,
    prompt: built.prompt,
    model,
    size: shot.kind === "image" ? shot.aspectRatio === "9:16" ? "1080x1920" : "1920x1080" : shot.aspectRatio,
    duration: shot.kind === "video" ? shot.durationSec ?? 6 : void 0,
    shotIdx: index + 1,
    continuity: shot.continuity,
    note: shot.kind === "video" ? `${shot.note}\uFF1B\u63A8\u8350 ${model}` : shot.note
  };
}
async function orchestrateProduction(input) {
  const request = input.request.trim();
  if (request === "") throw new Error("request is empty");
  const stages = [];
  const tool = (name2, args, output) => ({ name: name2, input: args, output });
  const briefOut = await brief({ request, materials: input.materials ?? [], outputDir: input.outputDir });
  const kind = inferProductionKind(request);
  const entities = extractEntities(request, kind, briefOut.brief.targetSeconds, briefOut.brief.aspectRatio);
  const plan = deriveProductionPlan(kind, entities);
  stages.push({
    name: "\u6790",
    thinking: `\u8FD9\u662F\u590D\u6742\u591A\u5355\u5143\u5236\u4F5C\uFF0C\u5F62\u6001\u63A8\u6210\u300C${kind}\u300D\uFF0C\u4E0D\u662F\u6309\u4F5C\u54C1\u540D\u67E5\u8868\u3002\u65F6\u957F ${entities.targetSeconds}s / ${entities.aspectRatio}\u3002\u672C\u8F6E\u4E0D\u8C03\u7528 directorx_generate_*\u3002`,
    tools: [
      tool("directorx_brief", { request }, { type: briefOut.brief.type, targetSeconds: briefOut.brief.targetSeconds, aspectRatio: briefOut.brief.aspectRatio }),
      tool("directorx_infer_kind", { request }, { kind, entities })
    ]
  });
  const research = [];
  const searchCalls = [];
  for (const query of plan.researchQueries) {
    const hits = await corpus.search(query, 3);
    searchCalls.push(tool("directorx_knowledge_search", { query, maxResults: 3 }, hits.map((hit) => ({ slug: hit.slug, title: hit.title, score: hit.score }))));
    for (const hit of hits.slice(0, 2)) {
      research.push({ query, source: `knowledge:${hit.slug || hit.id}`, finding: hit.snippet });
    }
    if (hits.length === 0) {
      research.push({ query, source: "derived", finding: `\u77E5\u8BC6\u5E93\u672A\u547D\u4E2D\u300C${query}\u300D\uFF0C\u5360\u4F4D\u63D0\u793A\u8BCD\u4ECD\u5199\u5165\u5B9E\u4F53 ${JSON.stringify(entities)}\uFF0C\u5F85\u7528\u6237\u8865\u6750\u6599\u3002` });
    }
  }
  stages.push({
    name: "\u7814",
    thinking: "\u8C03\u7814\u67E5\u8BE2\u4ECE\u8BF7\u6C42\u5B9E\u4F53\u63A8\u5BFC\uFF08\u54C1\u724C/\u539F\u4F5C/\u6E90\u7247\uFF09\uFF0C\u5DE5\u827A\u95EE\u9898\u8FDB\u77E5\u8BC6\u5E93\u3002\u6CA1\u6709\u6E90\u7247\u5C31\u6309\u8BE5\u5F62\u6001\u7684\u9AA8\u67B6\u62C9\u7247\uFF0C\u4E0D\u7F16\u9020\u4E0D\u5B58\u5728\u7684\u955C\u5934\u3002",
    tools: searchCalls
  });
  const characters = new CharacterStore(input.outputDir);
  const characterCalls = [];
  for (const card of plan.characters) {
    const registered = await characters.register({
      name: card.name,
      description: card.description,
      refPath: `generated/anchors/${card.slug || slugify2(card.name)}.png`
    });
    characterCalls.push(tool("directorx_character_register", { name: card.name }, { name: registered.name, refPath: registered.refPath }));
  }
  stages.push({
    name: "\u6848",
    thinking: `\u5DE5\u4F5C\u6D41\uFF1A${plan.workflow.join(" \u2192 ")}\u3002\u89D2\u8272\u951A\u6765\u81EA\u5B9E\u4F53\u62BD\u53D6\uFF0C\u4E0D\u662F\u5199\u6B7B\u7684\u4EBA\u540D\u8868\u3002`,
    tools: characterCalls.length > 0 ? characterCalls : [tool("directorx_plan", { kind }, { title: plan.title, shots: plan.shots.length })]
  });
  stages.push({
    name: "\u95EE",
    thinking: "\u751F\u6210\u524D\u8BA9\u7528\u6237\u62CD\u677F\u5E45\u5EA6 / \u65F6\u957F / \u5360\u4F4D\u6279\u6B21\u3002\u63A8\u8350\u9879\u6C38\u8FDC\u662F\u786E\u8BA4\u5360\u4F4D\u3001\u6682\u4E0D\u751F\u6210\u3002",
    tools: [tool("directorx_case_confirm", { confirms: plan.confirms.map((item) => item.id) }, plan.confirms)]
  });
  const placeholders = [];
  const proposeCalls = [];
  const store = new ProposalStore(input.outputDir);
  const enqueue = input.enqueue !== false;
  for (const [index, shot] of plan.shots.entries()) {
    const spec = toPlaceholder(shot, index);
    let proposalId;
    if (enqueue) {
      const proposal = await store.propose({
        kind: spec.kind,
        prompt: spec.prompt,
        model: spec.model,
        ...spec.kind !== "audio" ? { size: spec.size } : {},
        ...spec.duration !== void 0 ? { duration: spec.duration } : {},
        count: 1,
        note: spec.note,
        estimatedCost: "placeholder \u2014 no API spend",
        stage: spec.kind === "image" && spec.id.startsWith("c-") ? "character" : "shot"
      });
      proposalId = proposal.id;
      proposeCalls.push(tool("directorx_propose", { kind: spec.kind, model: spec.model, task: spec.task }, { id: proposal.id, status: proposal.status }));
    }
    placeholders.push({ ...spec, proposalId });
  }
  stages.push({
    name: "\u4F4D",
    thinking: `\u5DF2\u6392\u51FA ${placeholders.length} \u6761\u5360\u4F4D\uFF1A\u6BCF\u6761\u542B\u63D0\u793A\u8BCD\u3001\u63A8\u8350\u6A21\u578B\u3001\u89C4\u683C\u3002\u6CA1\u6709\u8C03\u7528\u751F\u6210\u63A5\u53E3\u3002`,
    tools: proposeCalls
  });
  const run = {
    kind,
    title: plan.title,
    request,
    generated: false,
    workflow: plan.workflow,
    entities,
    stages,
    brief: briefOut,
    research,
    confirms: plan.confirms,
    placeholders,
    durationBudget: plan.durationBudget,
    reportPath: join19(resolveOutputDir(input.outputDir), `orchestrate-${kind}.json`)
  };
  await mkdir14(resolveOutputDir(input.outputDir), { recursive: true });
  await writeFile9(run.reportPath, JSON.stringify(run, null, 2), "utf8");
  return run;
}

// src/confirm.ts
var APPROVE = "\u6279\u51C6";
var REJECT = "\u62D2\u7EDD";
var SIGN_ALL = "\u6574\u8868\u7B7E\u5B57";
var REVISE = "\u56DE\u53BB\u6539\u5206\u955C";
var KEEP = "\u4FDD\u6301\u5F85\u6279";
function buildConfirmQuestions(input) {
  if (input.scope === "shotlist") {
    const pending = input.proposals.filter((item) => item.status === "proposed");
    const detail = input.shotlist?.markdown ?? "empty board";
    return [{
      id: "shotlist",
      header: "\u5206\u955C\u8868\u7B7E\u5B57",
      question: pending.length === 0 ? "\u5206\u955C\u8868\u5DF2\u5BFC\u51FA\u3002\u6CA1\u6709\u5F85\u6279\u63D0\u6848\u3002\u4E0B\u4E00\u6B65\uFF1F" : `\u5206\u955C\u8868 ${input.shotlist?.title ?? ""}\uFF1A${input.shotlist?.rows.length ?? 0} \u955C / ${pending.length} \u6761\u5F85\u6279\u3002\u7B7E\u5B57\u540E\u624D\u80FD\u82B1\u94B1\u751F\u6210\u3002`,
      detail,
      options: pending.length === 0 ? [
        { label: REVISE, description: "\u56DE\u5230\u753B\u5E03\u6539\u955C\u53F7\u3001\u63D0\u793A\u8BCD\u6216\u8FDE\u7EED\u6027" },
        { label: KEEP, description: "\u5148\u4E0D\u6539\uFF0C\u7A0D\u540E\u518D\u6279" }
      ] : [
        { label: SIGN_ALL, description: `\u6279\u51C6\u5168\u90E8 ${pending.length} \u6761\u5F85\u6279\u5360\u4F4D` },
        { label: REVISE, description: "\u56DE\u5230\u753B\u5E03\u6539\u5206\u955C\uFF0C\u63D0\u6848\u4FDD\u6301\u5F85\u6279" },
        { label: KEEP, description: "\u5148\u4E0D\u6279\uFF0C\u7A0D\u540E\u518D\u770B" }
      ]
    }];
  }
  if (input.scope === "proposals") {
    const pending = input.proposals.filter((item) => item.status === "proposed");
    if (pending.length === 0) {
      return [{
        id: "proposals",
        header: "\u63D0\u6848\u961F\u5217",
        question: "\u6CA1\u6709\u5F85\u6279\u63D0\u6848\u3002",
        options: [{ label: KEEP, description: "\u5148\u53BB directorx_propose \u6392\u961F\u5360\u4F4D" }]
      }];
    }
    return [{
      id: "proposals",
      header: "\u63D0\u6848\u7B7E\u5B57",
      question: "\u52FE\u9009\u8981\u6279\u51C6\u7684\u5360\u4F4D\u3002\u672A\u52FE\u9009\u7684\u4FDD\u6301\u5F85\u6279\u3002",
      multiSelect: true,
      options: pending.map((proposal) => ({
        label: proposal.id,
        description: `${proposal.kind} \xB7 ${proposal.model ?? "\u672A\u6307\u5B9A\u6A21\u578B"} \xB7 ${proposal.prompt.slice(0, 80)}`
      }))
    }];
  }
  const next = input.next ?? input.proposals.filter((item) => item.status === "proposed").sort((a, b) => a.at - b.at)[0] ?? null;
  if (next === null) {
    return [{
      id: "next",
      header: "\u4E0B\u4E00\u6761",
      question: "\u6CA1\u6709\u5F85\u6279\u63D0\u6848\u3002",
      options: [{ label: KEEP, description: "\u5148\u6392\u961F\u5360\u4F4D\u6216\u5BFC\u51FA\u5206\u955C\u8868" }]
    }];
  }
  return [{
    id: "next",
    header: "\u6279\u51C6\u5360\u4F4D",
    question: `\u6279\u51C6 ${next.id}\uFF1F`,
    detail: [
      `${next.kind} \xB7 ${next.model ?? "\u672A\u6307\u5B9A\u6A21\u578B"} \xB7 ${next.size ?? ""} ${next.duration === void 0 ? "" : `${next.duration}s`}`.trim(),
      next.prompt,
      next.note ?? "",
      next.estimatedCost === void 0 ? "" : `\u6210\u672C\u5047\u8BBE\uFF1A${next.estimatedCost}`
    ].filter((line) => line !== "").join("\n"),
    options: [
      { label: APPROVE, description: "\u5199\u5165 approved\uFF0C\u4E4B\u540E generate \u5E26 proposalId" },
      { label: REJECT, description: "\u5199\u5165 rejected\uFF0C\u4E0D\u751F\u6210" }
    ]
  }];
}
function applyConfirmAnswers(input) {
  const applied = [];
  const pending = input.proposals.filter((item) => item.status === "proposed");
  const next = input.next ?? pending.sort((a, b) => a.at - b.at)[0] ?? null;
  for (const answer of input.answers) {
    const picked = answer.custom !== void 0 && answer.custom.trim() !== "" ? [answer.custom.trim()] : answer.selected;
    if (answer.id === "next" && next !== null) {
      if (picked.includes(APPROVE)) applied.push({ id: next.id, status: "approved" });
      else if (picked.includes(REJECT)) applied.push({ id: next.id, status: "rejected" });
      continue;
    }
    if (answer.id === "shotlist" && picked.includes(SIGN_ALL)) {
      for (const proposal of pending) applied.push({ id: proposal.id, status: "approved" });
      continue;
    }
    if (answer.id === "proposals") {
      const chosen = new Set(picked);
      for (const proposal of pending) {
        if (chosen.has(proposal.id)) applied.push({ id: proposal.id, status: "approved" });
      }
    }
  }
  return applied;
}
async function confirmProduction(input) {
  const canvas = new DirectorxCanvasStore(input.outputDir);
  const store = new ProposalStore(input.outputDir);
  const [doc, proposals, next] = await Promise.all([canvas.read(), store.list(), store.next()]);
  const shotlist = formatCanvasShotlist(doc);
  const questions = buildConfirmQuestions({ scope: input.scope, proposals, shotlist, next });
  const asked = await input.ask({
    questions,
    ...input.agent === void 0 ? {} : { agent: input.agent },
    ...input.signal === void 0 ? {} : { signal: input.signal }
  });
  const applied = applyConfirmAnswers({ answers: asked.answers, proposals, next });
  for (const change of applied) {
    await store.update(change.id, change.status);
  }
  const after = await store.list();
  return {
    scope: input.scope,
    answers: asked.answers,
    applied,
    board: formatProductionBoard({ shotlist, proposals: after, next: await store.next() })
  };
}

// src/providers/audio.ts
import { writeFile as writeFile10 } from "node:fs/promises";
import { join as join20 } from "node:path";

// src/providers/adapter-spec.ts
var ADAPTER_CAPABILITIES = ["vision", "image", "video", "audio"];
var BUILTIN_ADAPTER_MODES = [
  "openai-chat",
  "openai-images",
  "openai-videos",
  "openai-tts",
  "modelverse-tasks",
  "kling",
  "kling-v3",
  "runway",
  "minimax-h3",
  "vidu",
  "veo"
];
var ADAPTER_MODES = [...BUILTIN_ADAPTER_MODES, "generic-rest"];
var BODY_SLOTS = [
  "prompt",
  "text",
  "model",
  "seconds",
  "size",
  "aspectRatio",
  "resolution",
  "firstFrame",
  "lastFrame",
  "negativePrompt",
  "voice"
];
var MODE_SET = new Set(ADAPTER_MODES);
var CAP_SET = new Set(ADAPTER_CAPABILITIES);
var SLOT_SET = new Set(BODY_SLOTS);
function readPath(root, path) {
  const parts = path.replace(/^\//, "").split(/[.\/\[\]]+/).filter(Boolean);
  let current = root;
  for (const part of parts) {
    if (current === null || current === void 0) return void 0;
    if (Array.isArray(current) && /^\d+$/.test(part)) {
      current = current[Number(part)];
      continue;
    }
    if (typeof current !== "object") return void 0;
    current = current[part];
  }
  return current;
}
function collectUrls(value) {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return [value];
  if (Array.isArray(value)) return value.flatMap(collectUrls);
  if (value !== null && typeof value === "object") {
    return Object.values(value).flatMap(collectUrls);
  }
  return [];
}
function parseMapping(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return void 0;
  const record = raw;
  if (record.type === "const") return { type: "const", value: record.value };
  if (record.type === "from" && typeof record.field === "string" && SLOT_SET.has(record.field)) {
    const mapped = { type: "from", field: record.field };
    if (typeof record.default === "string" || typeof record.default === "number" || typeof record.default === "boolean") {
      mapped.default = record.default;
    }
    return mapped;
  }
  return void 0;
}
function parseBodyMap(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return void 0;
  const body = {};
  for (const [key, value] of Object.entries(raw)) {
    const mapping = parseMapping(value);
    if (mapping === void 0) return void 0;
    body[key] = mapping;
  }
  return body;
}
function parseAdapterSpec(raw) {
  const issues = [];
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { issues: [{ path: "", message: "spec \u5FC5\u987B\u662F\u5BF9\u8C61" }] };
  }
  const record = raw;
  const id = typeof record.id === "string" ? record.id.trim() : "";
  const model = typeof record.model === "string" ? record.model.trim() : "";
  const baseURL = typeof record.baseURL === "string" ? record.baseURL.trim() : "";
  const displayName = typeof record.displayName === "string" && record.displayName.trim() !== "" ? record.displayName.trim() : model;
  const capability2 = typeof record.capability === "string" ? record.capability : "";
  const mode = typeof record.mode === "string" ? record.mode : "";
  if (id === "") issues.push({ path: "id", message: "\u5FC5\u586B" });
  if (model === "") issues.push({ path: "model", message: "\u5FC5\u586B" });
  if (baseURL === "") issues.push({ path: "baseURL", message: "\u5FC5\u586B" });
  if (!CAP_SET.has(capability2)) issues.push({ path: "capability", message: "\u5FC5\u987B\u662F vision/image/video/audio" });
  if (!MODE_SET.has(mode)) issues.push({ path: "mode", message: `\u672A\u77E5 mode\uFF1A${mode}` });
  const authRaw = record.auth !== null && typeof record.auth === "object" && !Array.isArray(record.auth) ? record.auth : {};
  const authKind = typeof authRaw.kind === "string" ? authRaw.kind : "bearer";
  if (!["bearer", "header", "query", "kling-jwt"].includes(authKind)) {
    issues.push({ path: "auth.kind", message: "\u5FC5\u987B\u662F bearer/header/query/kling-jwt" });
  }
  if (authKind === "header" && (typeof authRaw.headerName !== "string" || authRaw.headerName.trim() === "")) {
    issues.push({ path: "auth.headerName", message: "header \u9274\u6743\u9700\u8981 headerName" });
  }
  if (authKind === "query" && (typeof authRaw.queryName !== "string" || authRaw.queryName.trim() === "")) {
    issues.push({ path: "auth.queryName", message: "query \u9274\u6743\u9700\u8981 queryName" });
  }
  const capsRaw = record.caps !== null && typeof record.caps === "object" && !Array.isArray(record.caps) ? record.caps : {};
  const aspectRatios = Array.isArray(capsRaw.aspectRatios) ? capsRaw.aspectRatios.filter((item) => typeof item === "string" && item !== "") : ["16:9"];
  let create;
  if (record.create !== void 0) {
    const createRaw = record.create !== null && typeof record.create === "object" && !Array.isArray(record.create) ? record.create : void 0;
    const path = typeof createRaw?.path === "string" ? createRaw.path.trim() : "";
    const body = parseBodyMap(createRaw?.body);
    if (path === "") issues.push({ path: "create.path", message: "generic-rest \u9700\u8981 create.path" });
    if (body === void 0) issues.push({ path: "create.body", message: "body \u7684\u6BCF\u4E2A\u503C\u5FC5\u987B\u662F {type:from|const,...}" });
    else create = {
      path,
      method: createRaw?.method === "PUT" ? "PUT" : "POST",
      body
    };
  }
  let poll;
  if (record.poll !== void 0) {
    const pollRaw = record.poll !== null && typeof record.poll === "object" && !Array.isArray(record.poll) ? record.poll : void 0;
    const path = typeof pollRaw?.path === "string" ? pollRaw.path.trim() : "";
    const taskId = typeof pollRaw?.taskId === "string" ? pollRaw.taskId.trim() : "";
    const status = typeof pollRaw?.status === "string" ? pollRaw.status.trim() : "";
    const resultUrls = typeof pollRaw?.resultUrls === "string" ? pollRaw.resultUrls.trim() : "";
    if (path === "" || taskId === "" || status === "" || resultUrls === "") {
      issues.push({ path: "poll", message: "poll \u9700\u8981 path / taskId / status / resultUrls" });
    } else {
      poll = {
        path,
        method: pollRaw?.method === "POST" ? "POST" : "GET",
        taskId,
        status,
        success: Array.isArray(pollRaw?.success) ? pollRaw.success.filter((item) => typeof item === "string") : ["success", "succeeded", "completed", "complete", "finished", "done"],
        failure: Array.isArray(pollRaw?.failure) ? pollRaw.failure.filter((item) => typeof item === "string") : ["failed", "failure", "error", "cancelled", "canceled"],
        resultUrls
      };
    }
  }
  let syncResult;
  if (record.syncResult !== void 0) {
    const syncRaw = record.syncResult !== null && typeof record.syncResult === "object" && !Array.isArray(record.syncResult) ? record.syncResult : void 0;
    syncResult = {
      urls: typeof syncRaw?.urls === "string" ? syncRaw.urls : void 0,
      b64: typeof syncRaw?.b64 === "string" ? syncRaw.b64 : void 0
    };
  }
  if (capability2 === "vision" && mode === "generic-rest") {
    issues.push({ path: "mode", message: "vision \u53EA\u652F\u6301 openai-chat / mock" });
  }
  if (mode === "generic-rest") {
    if (create === void 0) issues.push({ path: "create", message: "generic-rest \u5FC5\u987B\u6709 create" });
    if (poll === void 0 && syncResult === void 0) {
      issues.push({ path: "poll", message: "generic-rest \u9700\u8981 poll\uFF08\u5F02\u6B65\uFF09\u6216 syncResult\uFF08\u540C\u6B65\uFF09" });
    }
    const bodyValues = Object.values(create?.body ?? {});
    const hasPrompt = bodyValues.some((item) => item.type === "from" && (item.field === "prompt" || item.field === "text"));
    if (!hasPrompt) issues.push({ path: "create.body", message: "\u81F3\u5C11\u628A prompt \u6216 text \u6620\u5C04\u8FDB\u8BF7\u6C42\u4F53" });
  }
  if (issues.length > 0) return { issues };
  return {
    spec: {
      id,
      capability: capability2,
      displayName,
      model,
      mode,
      baseURL,
      auth: {
        kind: authKind,
        ...typeof authRaw.headerName === "string" ? { headerName: authRaw.headerName.trim() } : {},
        ...typeof authRaw.queryName === "string" ? { queryName: authRaw.queryName.trim() } : {}
      },
      ...create !== void 0 ? { create } : {},
      ...poll !== void 0 ? { poll } : {},
      ...syncResult !== void 0 ? { syncResult } : {},
      smoke: record.smoke !== null && typeof record.smoke === "object" && !Array.isArray(record.smoke) ? {
        probe: record.smoke.probe === "auth-only" ? "auth-only" : "GET /models",
        cheapest: record.smoke.cheapest !== null && typeof record.smoke.cheapest === "object" ? record.smoke.cheapest : { seconds: 4, size: "1024x1024" }
      } : { probe: "GET /models", cheapest: { seconds: 4, size: "1024x1024" } },
      caps: {
        aspectRatios: aspectRatios.length > 0 ? aspectRatios : ["16:9"],
        firstFrame: capsRaw.firstFrame === true,
        lastFrame: capsRaw.lastFrame === true,
        audio: capsRaw.audio === true,
        multiRef: capsRaw.multiRef === true,
        ...typeof capsRaw.maxDurationSec === "number" ? { maxDurationSec: capsRaw.maxDurationSec } : {},
        ...typeof capsRaw.minDurationSec === "number" ? { minDurationSec: capsRaw.minDurationSec } : {}
      }
    },
    issues
  };
}
var FINGERPRINTS = [
  { mode: "kling-v3", family: "A", pattern: /kling[\s_-]*v3|new-standard|omni-video/i, reason: "\u6587\u6863\u547D\u4E2D\u53EF\u7075 v3 / new-standard", path: "/v1/videos/omni-video", authKind: "bearer" },
  { mode: "kling", family: "A", pattern: /kling|可灵|image2video|access.?key|secret.?key|hs256/i, reason: "\u6587\u6863\u547D\u4E2D\u53EF\u7075 JWT / image2video", path: "/v1/videos/text2video", authKind: "kling-jwt" },
  { mode: "runway", family: "A", pattern: /runway|x-runway-version|gen4/i, reason: "\u6587\u6863\u547D\u4E2D Runway", path: "/v1/text_to_video", authKind: "bearer" },
  { mode: "minimax-h3", family: "A", pattern: /minimax|hailuo|video_generation/i, reason: "\u6587\u6863\u547D\u4E2D MiniMax / Hailuo", path: "/v1/video_generation", authKind: "bearer" },
  { mode: "vidu", family: "A", pattern: /\bvidu\b|viduq/i, reason: "\u6587\u6863\u547D\u4E2D Vidu", path: "/ent/v2/text2video", authKind: "header" },
  { mode: "veo", family: "A", pattern: /\bveo\b|generatevideos|predictlongrunning/i, reason: "\u6587\u6863\u547D\u4E2D Veo / generateVideos", path: "/v1/models", authKind: "bearer" },
  { mode: "modelverse-tasks", family: "A", pattern: /tasks\/submit|modelverse|\/tasks\/status/i, reason: "\u6587\u6863\u547D\u4E2D tasks/submit \u8F6E\u8BE2\u534F\u8BAE", path: "/tasks/submit", authKind: "bearer" },
  { mode: "openai-images", family: "A", pattern: /\/images\/generations|images\/edits/i, reason: "\u6587\u6863\u547D\u4E2D OpenAI images \u534F\u8BAE", path: "/images/generations", authKind: "bearer" },
  { mode: "openai-tts", family: "A", pattern: /\/audio\/speech|openai-tts/i, reason: "\u6587\u6863\u547D\u4E2D OpenAI speech \u534F\u8BAE", path: "/audio/speech", authKind: "bearer" },
  { mode: "openai-videos", family: "A", pattern: /\/videos\b|openai-videos|sora/i, reason: "\u6587\u6863\u547D\u4E2D OpenAI videos \u534F\u8BAE", path: "/videos", authKind: "bearer" },
  { mode: "openai-chat", family: "A", pattern: /\/chat\/completions|image_url/i, reason: "\u6587\u6863\u547D\u4E2D OpenAI chat \u534F\u8BAE", path: "/chat/completions", authKind: "bearer" }
];
function classifyProviderDoc(doc, extra = "") {
  const text = `${doc}
${extra}`;
  for (const fingerprint of FINGERPRINTS) {
    if (fingerprint.pattern.test(text)) {
      return {
        family: "A",
        mode: fingerprint.mode,
        confidence: "high",
        reasons: [fingerprint.reason],
        hints: { path: fingerprint.path, authKind: fingerprint.authKind }
      };
    }
  }
  const reasons = ["\u672A\u547D\u4E2D\u5DF2\u63A5\u5165\u534F\u8BAE\u6307\u7EB9\uFF0C\u6309\u65B0\u63D0\u4F9B\u5546\u8D70 generic-rest"];
  if (/authorization:\s*bearer|bearer token/i.test(text)) reasons.push("\u6587\u6863\u5199\u4E86 Bearer");
  if (/task[_-]?id|polling|status/i.test(text)) reasons.push("\u6587\u6863\u50CF\u5F02\u6B65\u4EFB\u52A1\uFF08\u9700\u8981 poll\uFF09");
  return {
    family: "B",
    mode: "generic-rest",
    confidence: /https?:\/\//i.test(text) ? "medium" : "low",
    reasons,
    hints: {
      path: /\/v\d+\//.exec(text)?.[0],
      authKind: /bearer/i.test(text) ? "bearer" : void 0
    }
  };
}
function buildBody(map, slots) {
  const body = {};
  for (const [key, mapping] of Object.entries(map)) {
    if (mapping.type === "const") {
      body[key] = mapping.value;
      continue;
    }
    const value = slots[mapping.field];
    if (value !== void 0 && value !== "") body[key] = value;
    else if (mapping.default !== void 0) body[key] = mapping.default;
  }
  return body;
}
function adapterIdFor(capability2, model) {
  const slug = model.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return `${capability2}-${slug || "model"}`;
}

// src/providers/generic-rest.ts
function joinUrl(baseURL, path) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = baseURL.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
function authHeaders(spec, apiKey) {
  const headers = { "content-type": "application/json" };
  if (spec.auth.kind === "bearer" && apiKey !== "") headers.authorization = `Bearer ${apiKey}`;
  if (spec.auth.kind === "header" && spec.auth.headerName && apiKey !== "") headers[spec.auth.headerName] = apiKey;
  return headers;
}
function withQuery(url, spec, apiKey) {
  if (spec.auth.kind !== "query" || !spec.auth.queryName || apiKey === "") return url;
  const parsed = new URL(url);
  parsed.searchParams.set(spec.auth.queryName, apiKey);
  return parsed.toString();
}
async function slotValues(spec, slots) {
  const values = {
    prompt: slots.prompt,
    text: slots.text ?? slots.prompt,
    model: spec.model,
    seconds: slots.seconds,
    size: slots.size,
    aspectRatio: slots.aspectRatio,
    resolution: slots.resolution,
    negativePrompt: slots.negativePrompt,
    voice: slots.voice
  };
  if (slots.firstFramePath !== void 0) values.firstFrame = await mediaSourceToDataUrl(slots.firstFramePath);
  if (slots.lastFramePath !== void 0) values.lastFrame = await mediaSourceToDataUrl(slots.lastFramePath);
  return values;
}
function fallbackUrls(body) {
  const preferred = [
    readPath(body, "url"),
    readPath(body, "data.url"),
    readPath(body, "output.url"),
    readPath(body, "data.urls"),
    readPath(body, "output.urls"),
    readPath(body, "result.url"),
    readPath(body, "video_url"),
    readPath(body, "image_url")
  ];
  const fromPreferred = preferred.flatMap(collectUrls);
  return fromPreferred.length > 0 ? fromPreferred : collectUrls(body);
}
async function genericGenerate(ctx, spec, slots) {
  if (spec.mode !== "generic-rest" || spec.create === void 0) {
    throw new Error(`generic-rest runner \u53EA\u63A5\u53D7 mode=generic-rest \u7684\u5B8C\u6574 spec\uFF0C\u6536\u5230 ${spec.mode}`);
  }
  if (spec.auth.kind === "kling-jwt") {
    throw new Error("kling-jwt \u8BF7\u628A classify \u7ED3\u679C\u5199\u6210 kling \u6A21\u5F0F\uFF0C\u4E0D\u8981\u8D70 generic-rest");
  }
  const apiKey = apiKeyOf(ctx.capability.apiKey, ["DIRECTORX_VIDEO_API_KEY", "DIRECTORX_IMAGE_API_KEY", "DIRECTORX_AUDIO_API_KEY"], spec.baseURL);
  const headers = authHeaders(spec, apiKey);
  const values = await slotValues(spec, slots);
  const payload = buildBody(spec.create.body, values);
  const createUrl = withQuery(joinUrl(spec.baseURL, spec.create.path), spec, apiKey);
  const created = await fetch(createUrl, {
    method: spec.create.method ?? "POST",
    headers,
    body: JSON.stringify(payload),
    signal: ctx.signal
  });
  const createBody = await readJsonResponse(created);
  if (!created.ok) {
    throw new Error(`generic create failed (HTTP ${created.status}): ${JSON.stringify(createBody).slice(0, 400)}`);
  }
  let taskId;
  let resultBody = createBody;
  if (spec.poll !== void 0) {
    const rawId = readPath(createBody, spec.poll.taskId);
    taskId = rawId === void 0 || rawId === null ? void 0 : String(rawId);
    if (taskId === void 0 || taskId === "") {
      throw new Error(`create \u54CD\u5E94\u91CC\u627E\u4E0D\u5230 taskId\uFF08${spec.poll.taskId}\uFF09\uFF1A${JSON.stringify(createBody).slice(0, 300)}`);
    }
    await ctx.ledger?.append({
      taskId,
      model: spec.model,
      mode: "generic-rest",
      prompt: slots.prompt ?? slots.text ?? "",
      state: "submitted",
      at: Date.now()
    }).catch(() => {
    });
    resultBody = await pollGeneric(ctx, spec, apiKey, headers, taskId);
  }
  const files = await materializeFiles(ctx, spec, resultBody, slots.prompt ?? slots.text ?? spec.model);
  const status = spec.poll === void 0 ? "completed" : "succeed";
  if (taskId !== void 0) {
    await ctx.ledger?.append({
      taskId,
      model: spec.model,
      mode: "generic-rest",
      prompt: slots.prompt ?? slots.text ?? "",
      state: "succeeded",
      at: Date.now(),
      files
    }).catch(() => {
    });
  }
  return { files, taskId, status, mode: "generic-rest", model: spec.model, prompt: slots.prompt ?? slots.text ?? "" };
}
async function pollGeneric(ctx, spec, apiKey, headers, taskId) {
  const poll = spec.poll;
  if (poll === void 0) throw new Error("poll missing");
  for (let attempt = 0; attempt < ctx.settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw Object.assign(new Error("Task polling cancelled"), { taskId });
    if (ctx.ledger !== void 0 && await ctx.ledger.isCancelled(taskId)) {
      throw Object.assign(new Error(`Task ${taskId} was cancelled via directorx_cancel_task`), { taskId });
    }
    await new Promise((resolve13) => setTimeout(resolve13, ctx.settings.pollIntervalMs));
    const path = poll.path.replaceAll("{taskId}", encodeURIComponent(taskId));
    const url = withQuery(joinUrl(spec.baseURL, path), spec, apiKey);
    const response = await fetch(url, { method: poll.method ?? "GET", headers, signal: ctx.signal });
    const body = await readJsonResponse(response);
    const rawStatus = readPath(body, poll.status);
    const status = String(rawStatus ?? "").toLowerCase();
    if (poll.success.some((item) => item.toLowerCase() === status)) return body;
    if (poll.failure.some((item) => item.toLowerCase() === status)) {
      throw Object.assign(new Error(`generic task ${taskId} failed (${status}): ${JSON.stringify(body).slice(0, 300)}`), { taskId });
    }
  }
  throw Object.assign(new Error(`generic task ${taskId} timed out`), { taskId });
}
async function materializeFiles(ctx, spec, body, prompt) {
  const files = [];
  if (spec.syncResult?.b64 !== void 0) {
    const raw = readPath(body, spec.syncResult.b64);
    if (typeof raw === "string" && raw !== "") {
      const ext2 = spec.capability === "audio" ? "mp3" : spec.capability === "video" ? "mp4" : "png";
      const path = await saveBase64ToFile(raw, ctx.settings.outputDir, slugify(prompt), ext2);
      files.push({ path, mimeType: spec.capability === "audio" ? "audio/mpeg" : spec.capability === "video" ? "video/mp4" : "image/png" });
      return files;
    }
  }
  const pointed = spec.poll?.resultUrls ? collectUrls(readPath(body, spec.poll.resultUrls)) : spec.syncResult?.urls ? collectUrls(readPath(body, spec.syncResult.urls)) : [];
  const urls = pointed.length > 0 ? pointed : fallbackUrls(body);
  const ext = spec.capability === "audio" ? ".mp3" : spec.capability === "video" ? ".mp4" : ".png";
  const mime = spec.capability === "audio" ? "audio/mpeg" : spec.capability === "video" ? "video/mp4" : "image/png";
  for (const url of urls) {
    files.push({ url, mimeType: mime });
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, slugify(prompt), ext);
      files[0] = { path, url, mimeType: mime };
    }
  }
  if (files.length === 0) throw new Error(`generic \u54CD\u5E94\u6CA1\u6709\u53EF\u4E0B\u8F7D\u7684\u7ED3\u679C\uFF1A${JSON.stringify(body).slice(0, 300)}`);
  return files;
}
async function genericAsImage(ctx, spec, slots) {
  const result = await genericGenerate(ctx, spec, slots);
  return { model: result.model, prompt: result.prompt, files: result.files, mode: result.mode };
}
async function genericAsVideo(ctx, spec, slots) {
  const result = await genericGenerate(ctx, spec, slots);
  return { model: result.model, prompt: result.prompt, files: result.files, mode: result.mode, status: result.status, taskId: result.taskId };
}
async function genericAsAudio(ctx, spec, slots) {
  const result = await genericGenerate(ctx, spec, { ...slots, text: slots.text ?? slots.prompt });
  return { model: result.model, text: slots.text ?? slots.prompt ?? "", files: result.files, mode: result.mode };
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
  const path = join20(outDir, `${slugify(text, 24)}-mock.wav`);
  await writeFile10(path, makeWav());
  return { model: ctx.capability.model, text, files: [{ path, mimeType: "audio/wav" }], mode: "mock" };
}
async function openaiTts(ctx, text, voice, format, instructions, speed) {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, "");
  const apiKey = apiKeyOf(ctx.capability.apiKey, ["DIRECTORX_AUDIO_API_KEY", "OPENAI_API_KEY"], baseURL);
  const models = ctx.capability.model === "qwen3-tts-flash" ? [ctx.capability.model] : [ctx.capability.model, "qwen3-tts-flash"];
  const payloads = models.flatMap((model) => [
    {
      model,
      input: text,
      ...voice !== void 0 && voice !== "" ? { voice } : {},
      ...format !== void 0 && format !== "" ? { response_format: format } : {},
      ...instructions !== void 0 && instructions !== "" ? { instructions } : {},
      ...speed !== void 0 && speed > 0 ? { speed: Math.min(4, Math.max(0.25, speed)) } : {}
    },
    { model, input: text }
  ]);
  let lastError = "unknown";
  let bytes;
  let usedModel = ctx.capability.model;
  for (const payload of payloads) {
    const response = await fetch(`${baseURL}/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctx.signal
    });
    if (response.ok) {
      bytes = Buffer.from(await response.arrayBuffer());
      usedModel = typeof payload.model === "string" ? payload.model : ctx.capability.model;
      break;
    }
    const body = await readJsonResponse(response).catch(() => ({}));
    lastError = `HTTP ${response.status}: ${JSON.stringify(body).slice(0, 400)}`;
    if (response.status !== 400) break;
  }
  if (bytes === void 0) throw new Error(`Audio generation failed (${lastError})`);
  const outDir = await ensureOutputDir(ctx.settings.outputDir);
  const ext = format === "wav" ? "wav" : format === "opus" ? "opus" : format === "aac" ? "aac" : "mp3";
  const path = join20(outDir, `${slugify(text, 24)}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}.${ext}`);
  await writeFile10(path, bytes);
  const files = [{ path, mimeType: `audio/${ext === "mp3" ? "mpeg" : ext}` }];
  return { model: usedModel, text, files, mode: "openai-tts" };
}
async function runAudio(ctx, text, options) {
  if (ctx.capability.mode === "mock") return mockAudio(ctx, text);
  if (ctx.capability.mode === "openai-tts") return openaiTts(ctx, text, options.voice, options.format, options.instructions, options.speed);
  if (ctx.capability.mode === "generic-rest") {
    if (ctx.adapter === void 0) throw new Error("generic-rest \u9700\u8981\u5DF2 commit \u7684 AdapterSpec\uFF08directorx_provider_commit\uFF09");
    return genericAsAudio(ctx, ctx.adapter, { prompt: text, text, voice: options.voice });
  }
  throw new Error(`Unsupported audio mode: ${ctx.capability.mode}`);
}

// src/providers/image.ts
import { writeFile as writeFile11 } from "node:fs/promises";
import { join as join21 } from "node:path";

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
async function pollModelverseTask(baseURL, apiKey, taskId, settings, signal, ledger) {
  const base = baseURL.replace(/\/+$/, "");
  for (let attempt = 0; attempt < settings.maxPollAttempts; attempt += 1) {
    if (signal.aborted) throw new Error("Task polling cancelled");
    if (ledger !== void 0 && await ledger.isCancelled(taskId)) {
      throw new Error(`Task ${taskId} was cancelled via directorx_cancel_task`);
    }
    await new Promise((resolve13) => setTimeout(resolve13, settings.pollIntervalMs));
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
async function pollOpenAIVideoTask(baseURL, apiKey, taskId, settings, signal, ledger) {
  const base = baseURL.replace(/\/+$/, "");
  for (let attempt = 0; attempt < settings.maxPollAttempts; attempt += 1) {
    if (signal.aborted) throw new Error("Video polling cancelled");
    if (ledger !== void 0 && await ledger.isCancelled(taskId)) {
      throw new Error(`Video task ${taskId} was cancelled via directorx_cancel_task`);
    }
    await new Promise((resolve13) => setTimeout(resolve13, settings.pollIntervalMs));
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
  const path = join21(outDir, name2);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">',
    '<rect width="100%" height="100%" fill="#0b1020"/>',
    '<text x="50%" y="50%" fill="#9fd8ff" font-family="sans-serif" font-size="28" text-anchor="middle">DirectorX mock image</text>',
    "</svg>"
  ].join("");
  await writeFile11(path, svg, "utf8");
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
  await ctx.ledger?.append({
    taskId,
    model: ctx.capability.model,
    mode: "modelverse-tasks",
    prompt,
    state: "submitted",
    at: Date.now()
  });
  const finished = await pollModelverseTask(baseURL, apiKey, taskId, ctx.settings, ctx.signal, ctx.ledger).catch((error) => {
    const taskIdError = error;
    taskIdError.taskId = taskId;
    throw taskIdError;
  });
  const files = [];
  for (const url of finished.urls) {
    files.push({ url });
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, `${slugify(prompt)}-image`, ".png");
      files[0] = { path, url, mimeType: "image/png" };
    }
  }
  await ctx.ledger?.append({
    taskId,
    model: ctx.capability.model,
    mode: "modelverse-tasks",
    prompt,
    state: "succeeded",
    at: Date.now(),
    urls: finished.urls,
    files
  });
  return { model: ctx.capability.model, prompt, files, mode: "modelverse-tasks" };
}
async function runImage(ctx, prompt, options) {
  try {
    if (ctx.capability.mode === "mock") return mockImage(ctx, prompt, options.size ?? "1024x1024");
    if (ctx.capability.mode === "openai-images") return openaiImage(ctx, prompt, options.size, options.quality);
    if (ctx.capability.mode === "modelverse-tasks") return modelverseImage(ctx, prompt, options.size, options.referenceImagePaths ?? []);
    if (ctx.capability.mode === "generic-rest") {
      if (ctx.adapter === void 0) throw new Error("generic-rest \u9700\u8981\u5DF2 commit \u7684 AdapterSpec\uFF08directorx_provider_commit\uFF09");
      return genericAsImage(ctx, ctx.adapter, { prompt, size: options.size });
    }
    throw new Error(`Unsupported image mode: ${ctx.capability.mode}`);
  } catch (error) {
    const taskId = error?.taskId;
    if (taskId !== void 0 && taskId !== "" && !await ctx.ledger?.isCancelled(taskId)) {
      const message = error instanceof Error ? error.message : String(error);
      await ctx.ledger?.append({
        taskId,
        model: ctx.capability.model,
        mode: ctx.capability.mode,
        prompt,
        state: "failed",
        at: Date.now(),
        error: `${message} \u2014 the provider task may still be running; check directorx_task_status.`
      }).catch(() => {
      });
    }
    throw error;
  }
}

// src/providers/transcribe.ts
import { mkdir as mkdir15, readFile as readFile14, writeFile as writeFile12 } from "node:fs/promises";
import { join as join22, resolve as resolve10 } from "node:path";
function mockText(source) {
  return `[mock transcription] \u8FD9\u662F\u4E00\u6BB5\u6A21\u62DF\u8F6C\u5199\u6587\u672C\uFF0C\u7528\u4E8E\u9A8C\u8BC1\u5B57\u5E55\u94FE\u8DEF\u3002\u6765\u6E90\uFF1A${source}\u3002`;
}
function toSrt(text, source) {
  const sentences = text.split(/(?<=[。！？!?])/).map((part) => part.trim()).filter((part) => part !== "");
  const cues = sentences.length > 0 ? sentences : [text];
  const lines = [];
  let cursor = 0;
  cues.forEach((cue, index) => {
    const start = cursor;
    const end = cursor + 3;
    const pad = (value) => String(value).padStart(2, "0");
    const stamp = (seconds) => `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)},000`;
    lines.push(String(index + 1), `${stamp(start)} --> ${stamp(end)}`, cue, "");
    cursor = end;
  });
  void source;
  return lines.join("\n").trimEnd();
}
async function mockTranscribe(ctx, source) {
  const text = mockText(source);
  const srt = toSrt(text, source);
  const dir = join22(resolveOutputDir(ctx.settings.outputDir), "transcripts");
  await mkdir15(dir, { recursive: true });
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
  const srtPath = join22(dir, `${slugify(source, 24)}-${stamp}.srt`);
  await writeFile12(srtPath, srt, "utf8");
  return {
    model: ctx.capability.model,
    source,
    text,
    srt,
    files: [{ path: srtPath, mimeType: "application/x-subrip" }],
    mode: "mock"
  };
}
async function openaiTranscribe(ctx, source, options) {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, "");
  const apiKey = apiKeyOf(ctx.capability.apiKey, ["DIRECTORX_AUDIO_API_KEY", "OPENAI_API_KEY"], baseURL);
  const bytes = await readFile14(resolve10(source));
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeForPath(source) }), slugify(source, 32) || "audio");
  form.append("model", ctx.capability.model);
  form.append("response_format", options.format ?? "json");
  if (options.language !== void 0 && options.language !== "") form.append("language", options.language);
  const response = await fetch(`${baseURL}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: ctx.signal
  });
  if (!response.ok) {
    const body = await readJsonResponse(response).catch(() => ({}));
    throw new Error(`Transcription failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 400)}`);
  }
  const raw = await response.text();
  let text = raw;
  if (options.format === void 0 || options.format === "json") {
    try {
      const parsed = JSON.parse(raw);
      text = parsed.text ?? "";
    } catch {
      text = raw;
    }
  }
  if (text === "") throw new Error("Transcription returned empty text.");
  const dir = join22(resolveOutputDir(ctx.settings.outputDir), "transcripts");
  await mkdir15(dir, { recursive: true });
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
  const files = [];
  const srt = options.format === "srt" ? text : void 0;
  if (srt !== void 0) {
    const srtPath = join22(dir, `${slugify(source, 24)}-${stamp}.srt`);
    await writeFile12(srtPath, srt, "utf8");
    files.push({ path: srtPath, mimeType: "application/x-subrip" });
  } else {
    const txtPath = join22(dir, `${slugify(source, 24)}-${stamp}.txt`);
    await writeFile12(txtPath, text, "utf8");
    files.push({ path: txtPath, mimeType: "text/plain" });
  }
  return { model: ctx.capability.model, source, language: options.language, text, srt, files, mode: ctx.capability.mode };
}
async function runTranscribe(ctx, source, options) {
  if (ctx.capability.mode === "mock") return mockTranscribe(ctx, source);
  return openaiTranscribe(ctx, source, options);
}

// src/providers/video.ts
import { spawnSync as spawnSync5 } from "node:child_process";
import { join as join23 } from "node:path";

// src/providers/minimax.ts
async function minimaxH3Video(ctx, prompt, options) {
  const apiKey = ctx.capability.apiKey;
  if (apiKey === "") throw new Error("MiniMax \u6A21\u5F0F\u9700\u8981 API Key\uFF1ASettings \u2192 DirectorX \u2192 \u89C6\u9891\u751F\u6210\u9009\u62E9 minimax-h3 \u6A21\u5F0F\u540E\u586B\u5199");
  const base = ctx.capability.baseURL.replace(/\/+$/, "");
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const content = [];
  const pushImage = async (url, role) => {
    content.push({ type: "image_url", image_url: { url }, role });
  };
  if (options.firstFramePath !== void 0) await pushImage(options.firstFramePath, "first_frame");
  if (options.lastFramePath !== void 0) await pushImage(options.lastFramePath, "last_frame");
  if (options.referenceImagePaths !== void 0) {
    for (const reference of options.referenceImagePaths) await pushImage(reference, "reference_image");
  }
  content.push({ type: "text", text: prompt });
  const hasImages = content.length > 1;
  const payload = {
    model: ctx.capability.model !== "" ? ctx.capability.model : "MiniMax-H3",
    content,
    resolution: ctx.capability.resolution ?? "768P",
    duration: options.seconds !== void 0 && options.seconds > 0 ? Math.min(15, Math.max(4, Math.round(options.seconds))) : 6,
    ...hasImages ? {} : { ratio: options.aspectRatio ?? "16:9" }
  };
  const createResponse = await fetch(`${base}/v2/video_generation`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: ctx.signal
  });
  const create = await readJsonResponse(createResponse);
  const taskId = create.task_id;
  if (!createResponse.ok || create.base_resp?.status_code !== 0 || taskId === void 0) {
    throw new Error(`MiniMax creation failed (HTTP ${createResponse.status}): ${create.base_resp?.status_msg ?? JSON.stringify(create).slice(0, 300)}`);
  }
  await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: "submitted", at: Date.now() }).catch(() => {
  });
  for (let attempt = 0; attempt < ctx.settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error("MiniMax polling cancelled");
    if (ctx.ledger !== void 0 && await ctx.ledger.isCancelled(taskId)) throw new Error(`Task ${taskId} was cancelled via directorx_cancel_task`);
    await new Promise((resolve13) => setTimeout(resolve13, ctx.settings.pollIntervalMs));
    const statusResponse = await fetch(`${base}/v2/query/video_generation/${encodeURIComponent(taskId)}`, { headers, signal: ctx.signal });
    const status = await readJsonResponse(statusResponse);
    const state = (status.status ?? "").toLowerCase();
    if (state === "success") {
      const fileId = status.file_id;
      if (fileId === void 0 || fileId === "") throw new Error(`MiniMax task ${taskId} succeeded without a file_id`);
      const fileResponse = await fetch(`${base}/v1/files/retrieve?file_id=${encodeURIComponent(fileId)}`, { headers, signal: ctx.signal });
      const file = await readJsonResponse(fileResponse);
      const url = file.file?.download_url;
      if (url === void 0 || url === "") throw new Error(`MiniMax file ${fileId} has no download_url`);
      const filePath = await downloadToFile(url, ctx.settings.outputDir, "minimax", ".mp4");
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: "succeeded", at: Date.now(), files: [{ path: filePath }], urls: [url] }).catch(() => {
      });
      return { model: ctx.capability.model, prompt, taskId, status: "succeed", files: [{ path: filePath }], mode: "minimax-h3" };
    }
    if (state === "fail" || state === "failed") {
      const message = status.base_resp?.status_msg ?? "unknown error";
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: "failed", at: Date.now(), error: message }).catch(() => {
      });
      throw new Error(`MiniMax task ${taskId} failed: ${message}`);
    }
  }
  throw new Error(`MiniMax task ${taskId} timed out after ${ctx.settings.maxPollAttempts} attempts`);
}

// src/providers/kling-v3.ts
async function klingV3Video(ctx, prompt, options) {
  const apiKey = ctx.capability.apiKey;
  if (apiKey === "") throw new Error("Kling 3.0\uFF08\u65B0\u6807\u51C6\uFF09\u6A21\u5F0F\u9700\u8981 API Key\uFF1ASettings \u2192 DirectorX \u2192 \u89C6\u9891\u751F\u6210\u9009\u62E9 kling-v3 \u6A21\u5F0F\u540E\u586B\u5199");
  const base = ctx.capability.baseURL.replace(/\/+$/, "");
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  const settings = {
    duration: options.seconds !== void 0 && options.seconds > 0 ? Math.min(15, Math.max(3, Math.round(options.seconds))) : 5,
    aspect_ratio: options.aspectRatio ?? "16:9",
    ...options.generateAudio === true ? { audio: "native" } : { audio: "off" },
    ...options.multiShot === true ? { muti_shot: true } : {}
  };
  if (ctx.capability.resolution !== "") settings.resolution = ctx.capability.resolution;
  let path;
  let body;
  if (options.firstFramePath !== void 0) {
    const contents = [{ type: "prompt", text: prompt }];
    const firstFrame = options.firstFramePath;
    contents.unshift({ type: "first_frame", url: firstFrame });
    if (options.lastFramePath !== void 0) contents.push({ type: "last_frame", url: options.lastFramePath });
    path = "/image-to-video/kling-3.0";
    body = { contents, settings };
  } else {
    path = "/text-to-video/kling-3.0";
    body = { prompt, settings };
  }
  const createResponse = await fetch(`${base}${path}`, { method: "POST", headers, body: JSON.stringify(body), signal: ctx.signal });
  const create = await readJsonResponse(createResponse);
  const taskId = create.data?.id;
  if (!createResponse.ok || create.code !== 0 || taskId === void 0) {
    throw new Error(`Kling v3 creation failed (HTTP ${createResponse.status}, code ${create.code}): ${create.message ?? JSON.stringify(create).slice(0, 300)}`);
  }
  await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: "submitted", at: Date.now() }).catch(() => {
  });
  for (let attempt = 0; attempt < ctx.settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error("Kling v3 polling cancelled");
    if (ctx.ledger !== void 0 && await ctx.ledger.isCancelled(taskId)) throw new Error(`Task ${taskId} was cancelled via directorx_cancel_task`);
    await new Promise((resolve13) => setTimeout(resolve13, ctx.settings.pollIntervalMs));
    const statusResponse = await fetch(`${base}/tasks?task_ids=${encodeURIComponent(taskId)}`, { headers, signal: ctx.signal });
    const status = await readJsonResponse(statusResponse);
    const task = status.data?.[0];
    const state = (task?.status ?? "").toLowerCase();
    if (state === "succeeded") {
      const urls = (task?.outputs ?? []).map((output) => output.url).filter((url) => typeof url === "string" && url !== "");
      if (urls.length === 0) throw new Error(`Kling v3 task ${taskId} succeeded with no outputs`);
      const files = [];
      for (const url of urls) files.push(await downloadToFile(url, ctx.settings.outputDir, "kling3", ".mp4"));
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: "succeeded", at: Date.now(), files: files.map((file) => ({ path: file })), urls }).catch(() => {
      });
      return { model: ctx.capability.model, prompt, taskId, status: "succeed", files: files.map((file) => ({ path: file })), mode: "kling-v3" };
    }
    if (state === "failed") {
      const message = task?.task_error?.message ?? "unknown error";
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: "failed", at: Date.now(), error: message }).catch(() => {
      });
      throw new Error(`Kling v3 task ${taskId} failed: ${message}`);
    }
  }
  throw new Error(`Kling v3 task ${taskId} timed out after ${ctx.settings.maxPollAttempts} attempts`);
}

// src/providers/vidu.ts
async function viduVideo(ctx, prompt, options) {
  const apiKey = ctx.capability.apiKey;
  if (apiKey === "") throw new Error("Vidu \u6A21\u5F0F\u9700\u8981 API Key\uFF08Token\uFF09\uFF1ASettings \u2192 DirectorX \u2192 \u89C6\u9891\u751F\u6210\u9009\u62E9 vidu \u6A21\u5F0F\u540E\u586B\u5199");
  const base = ctx.capability.baseURL.replace(/\/+$/, "");
  const headers = { Authorization: `Token ${apiKey}`, "Content-Type": "application/json" };
  const payload = {
    model: ctx.capability.model !== "" ? ctx.capability.model : "viduq3",
    prompt,
    duration: options.seconds !== void 0 && options.seconds > 0 ? Math.min(16, Math.max(3, Math.round(options.seconds))) : 5,
    aspect_ratio: options.aspectRatio ?? "16:9",
    ...ctx.capability.resolution !== "" ? { resolution: ctx.capability.resolution } : {}
  };
  if (options.subjects !== void 0 && options.subjects.length > 0) {
    payload.subjects = options.subjects.map((subject) => ({
      name: subject.name,
      images: subject.images.slice(0, 3),
      ...subject.voiceId !== void 0 && subject.voiceId !== "" ? { voice_id: subject.voiceId } : {}
    }));
  }
  if (options.generateAudio === true) {
    payload.audio = true;
    payload.audio_type = options.audioType ?? "all";
  }
  const createResponse = await fetch(`${base}/ent/v2/reference2video`, { method: "POST", headers, body: JSON.stringify(payload), signal: ctx.signal });
  const create = await readJsonResponse(createResponse);
  const taskId = create.task_id;
  if (!createResponse.ok || taskId === void 0 || taskId === "") {
    throw new Error(`Vidu creation failed (HTTP ${createResponse.status}): ${create.err_code ?? JSON.stringify(create).slice(0, 300)}`);
  }
  await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: "submitted", at: Date.now() }).catch(() => {
  });
  for (let attempt = 0; attempt < ctx.settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error("Vidu polling cancelled");
    if (ctx.ledger !== void 0 && await ctx.ledger.isCancelled(taskId)) throw new Error(`Task ${taskId} was cancelled via directorx_cancel_task`);
    await new Promise((resolve13) => setTimeout(resolve13, ctx.settings.pollIntervalMs));
    const statusResponse = await fetch(`${base}/ent/v2/tasks/${encodeURIComponent(taskId)}/creations`, { headers, signal: ctx.signal });
    const status = await readJsonResponse(statusResponse);
    const state = (status.state ?? "").toLowerCase();
    if (state === "success") {
      const urls = (status.creations ?? []).map((creation) => creation.url).filter((url) => typeof url === "string" && url !== "");
      if (urls.length === 0) throw new Error(`Vidu task ${taskId} succeeded with no creations`);
      const files = [];
      for (const url of urls) files.push(await downloadToFile(url, ctx.settings.outputDir, "vidu", ".mp4"));
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: "succeeded", at: Date.now(), files: files.map((file) => ({ path: file })), urls }).catch(() => {
      });
      return { model: ctx.capability.model, prompt, taskId, status: "succeed", files: files.map((file) => ({ path: file })), mode: "vidu" };
    }
    if (state === "failed") {
      const message = status.err_code ?? "unknown error";
      await ctx.ledger?.append({ taskId, model: ctx.capability.model, mode: ctx.capability.mode, prompt, state: "failed", at: Date.now(), error: message }).catch(() => {
      });
      throw new Error(`Vidu task ${taskId} failed: ${message}`);
    }
  }
  throw new Error(`Vidu task ${taskId} timed out after ${ctx.settings.maxPollAttempts} attempts`);
}

// src/providers/veo.ts
function imageBytes(source) {
  const dataUrl = source.startsWith("data:") ? source : "";
  if (dataUrl !== "") {
    const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
    if (match !== null) return { bytesBase64Encoded: match[2], mimeType: match[1] };
  }
  return { bytesBase64Encoded: "", mimeType: "image/png" };
}
async function veoVideo(ctx, prompt, options) {
  const apiKey = ctx.capability.apiKey;
  if (apiKey === "") throw new Error("Veo \u6A21\u5F0F\u9700\u8981 Gemini API Key\uFF1ASettings \u2192 DirectorX \u2192 \u89C6\u9891\u751F\u6210\u9009\u62E9 veo \u6A21\u5F0F\u540E\u586B\u5199");
  const base = ctx.capability.baseURL.replace(/\/+$/, "");
  const model = ctx.capability.model !== "" ? ctx.capability.model : "veo-3.1-generate-preview";
  const durationSeconds = options.seconds !== void 0 && options.seconds > 0 ? Math.min(8, Math.max(4, Math.round(options.seconds))) : 8;
  const config = {
    durationSeconds,
    ...options.aspectRatio !== void 0 ? { aspectRatio: options.aspectRatio } : {},
    ...ctx.capability.resolution !== "" ? { resolution: ctx.capability.resolution } : {}
  };
  if (options.referenceImagePaths !== void 0 && options.referenceImagePaths.length > 0) {
    const referenceImages = [];
    for (const path of options.referenceImagePaths.slice(0, 3)) {
      const bytes = imageBytes(await mediaSourceToDataUrl(path));
      referenceImages.push({ image: { bytesBase64Encoded: bytes.bytesBase64Encoded, mimeType: bytes.mimeType }, referenceType: "asset" });
    }
    config.referenceImages = referenceImages;
  }
  const body = { prompt, config };
  if (options.firstFramePath !== void 0) {
    const bytes = imageBytes(await mediaSourceToDataUrl(options.firstFramePath));
    body.image = { bytesBase64Encoded: bytes.bytesBase64Encoded, mimeType: bytes.mimeType };
  }
  if (options.lastFramePath !== void 0) {
    const bytes = imageBytes(await mediaSourceToDataUrl(options.lastFramePath));
    config.lastFrame = { bytesBase64Encoded: bytes.bytesBase64Encoded, mimeType: bytes.mimeType };
  }
  const headers = { "Content-Type": "application/json", "x-goog-api-key": apiKey };
  const createResponse = await fetch(`${base}/models/${model}:generateVideos`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: ctx.signal
  });
  const create = await readJsonResponse(createResponse);
  if (!createResponse.ok || create.name === void 0) {
    throw new Error(`Veo creation failed (HTTP ${createResponse.status}): ${create.error?.message ?? JSON.stringify(create).slice(0, 300)}`);
  }
  const operationName = create.name;
  await ctx.ledger?.append({ taskId: operationName, model, mode: ctx.capability.mode, prompt, state: "submitted", at: Date.now() }).catch(() => {
  });
  for (let attempt = 0; attempt < ctx.settings.maxPollAttempts; attempt += 1) {
    if (ctx.signal.aborted) throw new Error("Veo polling cancelled");
    if (ctx.ledger !== void 0 && await ctx.ledger.isCancelled(operationName)) throw new Error(`Operation ${operationName} was cancelled via directorx_cancel_task`);
    await new Promise((resolve13) => setTimeout(resolve13, ctx.settings.pollIntervalMs));
    const statusResponse = await fetch(`${base}/${operationName}`, { headers, signal: ctx.signal });
    const status = await readJsonResponse(statusResponse);
    if (status.error !== void 0) throw new Error(`Veo operation failed: ${status.error.message ?? "unknown"}`);
    if (status.done === true) {
      const uris = (status.response?.generatedVideos ?? []).map((video) => video.video?.uri).filter((uri) => typeof uri === "string" && uri !== "");
      if (uris.length === 0) throw new Error(`Veo operation ${operationName} done with no videos`);
      const files = [];
      for (const uri of uris) files.push(await downloadToFile(uri, ctx.settings.outputDir, "veo", ".mp4"));
      await ctx.ledger?.append({ taskId: operationName, model, mode: ctx.capability.mode, prompt, state: "succeeded", at: Date.now(), files: files.map((file) => ({ path: file })), urls: uris }).catch(() => {
      });
      return { model, prompt, taskId: operationName, status: "succeed", files: files.map((file) => ({ path: file })), mode: "veo" };
    }
  }
  throw new Error(`Veo operation ${operationName} timed out after ${ctx.settings.maxPollAttempts} attempts`);
}

// src/providers/video.ts
async function mockVideo(ctx, prompt) {
  const outDir = await ensureOutputDir(ctx.settings.outputDir);
  const path = join23(outDir, `${slugify(prompt)}-mock.mp4`);
  const ffmpeg = spawnSync5("ffmpeg", [
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
function withTaskId(error, taskId) {
  const wrapped = error instanceof Error ? error : new Error(String(error));
  wrapped.taskId = taskId;
  return wrapped;
}
async function openaiVideo(ctx, prompt, seconds, size, options = {}) {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, "");
  const apiKey = apiKeyOf(ctx.capability.apiKey, ["DIRECTORX_VIDEO_API_KEY", "OPENAI_API_KEY"], baseURL);
  const payload = { model: ctx.capability.model, prompt };
  if (seconds !== void 0 && seconds > 0) {
    const allowed = [4, 8, 12];
    const nearest = allowed.reduce((best, candidate) => Math.abs(candidate - seconds) < Math.abs(best - seconds) ? candidate : best, 8);
    payload.seconds = String(nearest);
  }
  if (size !== void 0 && size !== "") payload.size = size;
  if (options.firstFramePath !== void 0) {
    const dataUrl = await mediaSourceToDataUrl(options.firstFramePath);
    if (dataUrl.startsWith("data:")) payload.input_reference = { image_url: dataUrl };
    else payload.input_reference = { image_url: options.firstFramePath };
  }
  if (options.characterIds !== void 0 && options.characterIds.length > 0) {
    payload.characters = options.characterIds.map((id) => ({ id }));
  }
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
  await ctx.ledger?.append({
    taskId,
    model: ctx.capability.model,
    mode: "openai-videos",
    prompt,
    state: "submitted",
    at: Date.now()
  });
  const finished = await pollOpenAIVideoTask(baseURL, apiKey, taskId, ctx.settings, ctx.signal, ctx.ledger).catch((error) => {
    throw withTaskId(error, taskId);
  });
  const files = [];
  for (const url of finished.urls) {
    files.push({ url });
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, slugify(prompt), ".mp4");
      files[0] = { path, url, mimeType: "video/mp4" };
    }
  }
  await ctx.ledger?.append({
    taskId,
    model: ctx.capability.model,
    mode: "openai-videos",
    prompt,
    state: "succeeded",
    at: Date.now(),
    urls: finished.urls,
    files
  });
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
  await ctx.ledger?.append({
    taskId,
    model: ctx.capability.model,
    mode: "modelverse-tasks",
    prompt,
    state: "submitted",
    at: Date.now()
  });
  const finished = await pollModelverseTask(baseURL, apiKey, taskId, ctx.settings, ctx.signal, ctx.ledger).catch((error) => {
    throw withTaskId(error, taskId);
  });
  const files = [];
  for (const url of finished.urls) {
    files.push({ url });
    if (files.length === 1 && /^https?:\/\//i.test(url)) {
      const path = await downloadToFile(url, ctx.settings.outputDir, slugify(prompt), ".mp4");
      files[0] = { path, url, mimeType: "video/mp4" };
    }
  }
  await ctx.ledger?.append({
    taskId,
    model: ctx.capability.model,
    mode: "modelverse-tasks",
    prompt,
    state: "succeeded",
    at: Date.now(),
    urls: finished.urls,
    files
  });
  return { model: ctx.capability.model, prompt, taskId, status: finished.status, files, mode: "modelverse-tasks" };
}
async function runVideo(ctx, prompt, options) {
  try {
    if (ctx.capability.mode === "mock") return mockVideo(ctx, prompt);
    if (ctx.capability.mode === "openai-videos") return openaiVideo(ctx, prompt, options.seconds, options.size, { firstFramePath: options.firstFramePath });
    if (ctx.capability.mode === "modelverse-tasks") return modelverseVideo(ctx, prompt, options);
    if (ctx.capability.mode === "kling") return klingVideo(ctx, prompt, { ...options, negativePrompt: options.negativePrompt });
    if (ctx.capability.mode === "runway") return runwayVideo(ctx, prompt, options);
    if (ctx.capability.mode === "minimax-h3") return minimaxH3Video(ctx, prompt, options);
    if (ctx.capability.mode === "kling-v3") return klingV3Video(ctx, prompt, options);
    if (ctx.capability.mode === "vidu") return viduVideo(ctx, prompt, options);
    if (ctx.capability.mode === "veo") return veoVideo(ctx, prompt, options);
    if (ctx.capability.mode === "generic-rest") {
      if (ctx.adapter === void 0) throw new Error("generic-rest \u9700\u8981\u5DF2 commit \u7684 AdapterSpec\uFF08directorx_provider_commit\uFF09");
      return genericAsVideo(ctx, ctx.adapter, { prompt, ...options });
    }
    throw new Error(`Unsupported video mode: ${ctx.capability.mode}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const httpMatch = message.match(/HTTP (\d{3})/);
    const classified = httpMatch !== null ? Number(httpMatch[1]) >= 400 && Number(httpMatch[1]) < 500 ? `${message} [\u5931\u8D25\u5206\u7C7B: 4xx \u53C2\u6570/\u9274\u6743\u7C7B\u2014\u2014\u91CD\u8BD5\u65E0\u6548\uFF0C\u68C0\u67E5 Settings \u914D\u7F6E\u4E0E\u53C2\u6570]` : Number(httpMatch[1]) >= 500 ? `${message} [\u5931\u8D25\u5206\u7C7B: 5xx \u4E0A\u6E38\u4E34\u65F6\u2014\u2014\u53EF\u7A0D\u540E\u91CD\u8BD5]` : message : /timed out|abort|ECONNRESET|fetch failed/i.test(message) ? `${message} [\u5931\u8D25\u5206\u7C7B: \u7F51\u7EDC/\u8D85\u65F6\u2014\u2014\u53EF\u7A0D\u540E\u91CD\u8BD5]` : message;
    const taskId = error?.taskId;
    const stillRunning = taskId !== void 0 && taskId !== "" && /abort|timed out|timeout/i.test(message);
    if (stillRunning && !await ctx.ledger?.isCancelled(taskId)) {
      await ctx.ledger?.append({
        taskId,
        model: ctx.capability.model,
        mode: ctx.capability.mode,
        prompt,
        state: "submitted",
        at: Date.now()
      }).catch(() => {
      });
      return {
        model: ctx.capability.model,
        prompt,
        taskId,
        status: "submitted",
        files: [],
        mode: ctx.capability.mode,
        next: "directorx_task_status"
      };
    }
    if (taskId !== void 0 && taskId !== "" && !await ctx.ledger?.isCancelled(taskId)) {
      await ctx.ledger?.append({
        taskId,
        model: ctx.capability.model,
        mode: ctx.capability.mode,
        prompt,
        state: "failed",
        at: Date.now(),
        error: `${message} \u2014 the provider task may still be running; check directorx_task_status.`
      }).catch(() => {
      });
    }
    const classifiedError = new Error(classified);
    classifiedError.taskId = taskId;
    throw classifiedError;
  }
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

// src/providers/video-analyze.ts
import { spawnSync as spawnSync6 } from "node:child_process";
async function videoAnalyze(input) {
  const probe = probeMedia(input.source);
  const cutThreshold = input.cutThreshold ?? 12;
  const minShotSec = input.minShotSec ?? 0.4;
  const result = spawnSync6("ffmpeg", [
    "-hide_banner",
    "-i",
    input.source,
    "-vf",
    "signalstats,metadata=print:key=lavfi.signalstats.YAVG",
    "-an",
    "-f",
    "null",
    "-"
  ], { encoding: "utf8" });
  const yavg = [];
  for (const line of (result.stderr ?? "").split("\n")) {
    const match = line.match(/YAVG=([\d.]+)/);
    if (match !== null) yavg.push(Number(match[1]));
  }
  const freezeResult = spawnSync6("ffmpeg", [
    "-hide_banner",
    "-i",
    input.source,
    "-vf",
    "freezedetect=n=-60dB:d=0.5",
    "-an",
    "-f",
    "null",
    "-"
  ], { encoding: "utf8" });
  const freezeStderr = freezeResult.stderr ?? "";
  const freezeMatches = freezeStderr.match(/freeze_start/g);
  const freezeCount = freezeMatches !== null ? freezeMatches.length : 0;
  const freezeDurations = [];
  for (const match of freezeStderr.matchAll(/freeze_duration: ([\d.]+)/g)) freezeDurations.push(Number(match[1]));
  const freezeSeconds = Number(freezeDurations.reduce((sum, value) => sum + value, 0).toFixed(2));
  const sobelResult = spawnSync6("ffmpeg", [
    "-hide_banner",
    "-i",
    input.source,
    "-vf",
    "sobel,signalstats,metadata=print:key=lavfi.signalstats.YAVG",
    "-an",
    "-f",
    "null",
    "-"
  ], { encoding: "utf8" });
  const edgeValues = [];
  for (const line of (sobelResult.stderr ?? "").split("\n")) {
    const match = line.match(/YAVG=([\d.]+)/);
    if (match !== null) edgeValues.push(Number(match[1]));
  }
  const edgeSharpness = edgeValues.length > 0 ? Number((edgeValues.reduce((sum, value) => sum + value, 0) / edgeValues.length).toFixed(1)) : 0;
  let flickerCount = 0;
  for (let index = 2; index < yavg.length; index += 1) {
    const prev = yavg[index - 1] - yavg[index - 2];
    const current = yavg[index] - yavg[index - 1];
    if (Math.abs(prev) >= 4 && Math.abs(current) >= 4 && prev * current < 0) flickerCount += 1;
  }
  const fps = probe.streams.find((stream) => stream.type === "video" && typeof stream.fps === "number");
  const frameRate = fps?.fps ?? 24;
  const frameSec = 1 / frameRate;
  const deltas = [];
  for (let index = 1; index < yavg.length; index += 1) deltas.push(Math.abs(yavg[index] - yavg[index - 1]));
  const sortedDeltas = [...deltas].sort((a, b) => a - b);
  const medianDelta = sortedDeltas.length > 0 ? sortedDeltas[Math.floor(sortedDeltas.length / 2)] : 0;
  const cutFrames = [0];
  for (let index = 1; index < yavg.length; index += 1) {
    const delta = Math.abs(yavg[index] - yavg[index - 1]);
    if (delta > cutThreshold && (index - (cutFrames[cutFrames.length - 1] ?? 0)) * frameSec >= minShotSec) {
      cutFrames.push(index);
    }
  }
  cutFrames.push(yavg.length);
  const cutSet = new Set(cutFrames);
  let jumpCount = 0;
  for (let index = 1; index < yavg.length; index += 1) {
    const delta = Math.abs(yavg[index] - yavg[index - 1]);
    if (!cutSet.has(index) && delta > Math.max(2 * medianDelta, 20)) jumpCount += 1;
  }
  const shots = [];
  for (let index = 0; index < cutFrames.length - 1; index += 1) {
    const start = cutFrames[index] * frameSec;
    const end = cutFrames[index + 1] * frameSec;
    shots.push({ index: index + 1, start: Number(start.toFixed(2)), end: Number(end.toFixed(2)), durationSec: Number((end - start).toFixed(2)), description: null });
  }
  const midpoints = shots.map((shot) => Number(((shot.start + shot.end) / 2).toFixed(3)));
  const extracted = await extractFrames(input.source, input.outputDir, { at: midpoints });
  extracted.forEach((frame, index) => {
    const shot = shots[index];
    if (shot !== void 0 && frame.path !== void 0) shot.framePath = frame.path;
  });
  const visionAvailable = input.vision.enabled && input.vision.mode !== "mock";
  if (input.describe === true && visionAvailable) {
    for (const shot of shots) {
      if (shot.framePath === void 0) continue;
      try {
        const described = await runVision({ settings: input.settings, capability: input.vision, signal: AbortSignal.timeout(6e4) }, shot.framePath, "\u63CF\u8FF0\u8FD9\u4E00\u5E27\uFF1A\u4E3B\u4F53\u3001\u52A8\u4F5C\u3001\u666F\u522B\u3001\u5149\u7EBF\u3001\u6784\u56FE\uFF1B\u53EA\u63CF\u8FF0\u53EF\u89C1\u5185\u5BB9\u3002");
        shot.description = described.answer;
      } catch {
        shot.description = null;
      }
    }
  }
  const blackDetect = spawnSync6("ffmpeg", [
    "-hide_banner",
    "-i",
    input.source,
    "-vf",
    "blackdetect=d=0.25:pix_th=0.10",
    "-an",
    "-f",
    "null",
    "-"
  ], { encoding: "utf8" });
  const blackSegments = [];
  for (const line of (blackDetect.stderr ?? "").split("\n")) {
    const match = line.match(/black_start:([\d.]+).*?black_end:([\d.]+).*?black_duration:([\d.]+)/);
    if (match !== null) {
      blackSegments.push({ start: Number(match[1]), end: Number(match[2]), durationSec: Number(match[3]) });
    }
  }
  const volumeDetect = spawnSync6("ffmpeg", [
    "-hide_banner",
    "-i",
    input.source,
    "-af",
    "volumedetect",
    "-vn",
    "-f",
    "null",
    "-"
  ], { encoding: "utf8" });
  let volumeDbfs;
  const meanMatch = (volumeDetect.stderr ?? "").match(/mean_volume:\s*(-?[\d.]+)\s*dB/);
  const peakMatch = (volumeDetect.stderr ?? "").match(/max_volume:\s*(-?[\d.]+)\s*dB/);
  if (meanMatch !== null && peakMatch !== null) volumeDbfs = { mean: Number(meanMatch[1]), peak: Number(peakMatch[1]) };
  let audioLoudness;
  const loud = spawnSync6("ffmpeg", [
    "-hide_banner",
    "-i",
    input.source,
    "-af",
    "ebur128=peak=true",
    "-vn",
    "-f",
    "null",
    "-"
  ], { encoding: "utf8" });
  const mValues = [];
  for (const line of (loud.stderr ?? "").split("\n")) {
    const match = line.match(/M:\s*(-?[\d.]+)/);
    if (match !== null && Number(match[1]) > -100) mValues.push(Number(match[1]));
  }
  if (mValues.length > 0) {
    audioLoudness = {
      meanLu: Number((mValues.reduce((sum, value) => sum + value, 0) / mValues.length).toFixed(1)),
      peakLu: Math.max(...mValues)
    };
  }
  return {
    source: input.source,
    probe,
    fps: frameRate,
    shots,
    blackFrameCount: yavg.filter((value) => value < 16).length,
    flickerCount,
    edgeSharpness,
    freezeCount,
    freezeSeconds,
    jumpCount,
    whiteFrameCount: yavg.filter((value) => value > 240).length,
    ...blackSegments.length > 0 ? { blackSegments } : {},
    ...volumeDbfs !== void 0 ? { volumeDbfs } : {},
    ...audioLoudness !== void 0 ? { audioLoudness } : {},
    ...visionAvailable ? {} : { note: "vision \u672A\u914D\u7F6E\uFF1A\u5206\u955C\u63CF\u8FF0\u4E3A null\uFF08\u5E27\u8DEF\u5F84\u53EF\u7528\uFF09\uFF0C\u914D\u7F6E DirectorX vision \u540E\u4EE5 describe=true \u91CD\u8DD1\u53EF\u83B7\u5F97\u9010\u955C\u63CF\u8FF0\u3002" }
  };
}
async function qaCheck(input, settings, vision) {
  const analysis = await videoAnalyze({ source: input.source, outputDir: input.outputDir, settings, vision, minShotSec: 0.3 });
  const checks = [];
  const videoStream = analysis.probe.streams.find((stream) => stream.type === "video");
  const audioStream = analysis.probe.streams.some((stream) => stream.type === "audio");
  const duration = analysis.probe.durationSec;
  if (input.expect?.targetSeconds !== void 0) {
    const target = input.expect.targetSeconds;
    const ok = Math.abs(duration - target) <= Math.max(1, target * 0.25);
    checks.push({ name: "\u65F6\u957F", pass: ok, detail: `\u5B9E\u6D4B ${duration}s / \u76EE\u6807 ${target}s` });
  }
  if (input.expect?.aspectRatio !== void 0) {
    const width = videoStream?.width;
    const height = videoStream?.height;
    const [tw, th] = String(input.expect.aspectRatio).split(":").map(Number);
    const ok = width !== void 0 && height !== void 0 && Math.abs(width / height - tw / th) < 0.08;
    checks.push({ name: "\u753B\u5E45", pass: ok, detail: `${width}x${height} / \u671F\u671B ${input.expect.aspectRatio}` });
  }
  if (input.expect?.hasAudio !== void 0) {
    checks.push({ name: "\u97F3\u8F68", pass: audioStream === input.expect.hasAudio, detail: audioStream ? "\u542B\u97F3\u8F68" : "\u65E0\u97F3\u8F68" });
  }
  if (input.expect?.minShots !== void 0 || input.expect?.maxShots !== void 0) {
    const count = analysis.shots.length;
    const minOk = input.expect.minShots === void 0 || count >= input.expect.minShots;
    const maxOk = input.expect.maxShots === void 0 || count <= input.expect.maxShots;
    checks.push({ name: "\u955C\u5934\u6570", pass: minOk && maxOk, detail: `${count} \u955C / \u671F\u671B [${input.expect.minShots ?? "-"}, ${input.expect.maxShots ?? "-"}]` });
  }
  checks.push({ name: "\u9ED1\u5E27", pass: analysis.blackFrameCount === 0, detail: analysis.blackFrameCount > 0 ? `\u68C0\u51FA ${analysis.blackFrameCount} \u5E27\u8FD1\u9ED1\uFF08YAVG<16\uFF09` : "\u65E0\u8FD1\u9ED1\u5E27" });
  checks.push({ name: "\u767D\u5E27", pass: analysis.whiteFrameCount === 0, detail: analysis.whiteFrameCount > 0 ? `\u68C0\u51FA ${analysis.whiteFrameCount} \u5E27\u8FC7\u66DD\uFF08YAVG>240\uFF09` : "\u65E0\u8FC7\u66DD\u5E27" });
  checks.push({ name: "\u95EA\u70C1", pass: analysis.flickerCount <= Math.max(3, Math.round((analysis.probe.durationSec ?? 0) * 2)), detail: analysis.flickerCount > 0 ? `\u68C0\u51FA ${analysis.flickerCount} \u6B21\u4EAE\u5EA6\u7B26\u53F7\u4EA4\u66FF\uFF08AI \u89C6\u9891\u5E38\u89C1\u95EA\u70C1\u4F2A\u5F71\uFF09` : "\u65E0\u95EA\u70C1" });
  checks.push({ name: "\u9510\u5EA6", pass: analysis.edgeSharpness >= 15, detail: analysis.edgeSharpness > 0 ? `\u8FB9\u7F18\u80FD\u91CF\u5747\u503C ${analysis.edgeSharpness}${analysis.edgeSharpness < 15 ? "\uFF08\u7591\u4F3C\u6574\u4F53\u6A21\u7CCA\uFF09" : "\uFF08\u6E05\u6670\uFF09"}` : "\u65E0\u6CD5\u6D4B\u91CF" });
  checks.push({ name: "\u51BB\u7ED3", pass: analysis.freezeSeconds <= 1, detail: analysis.freezeCount > 0 ? `\u68C0\u51FA ${analysis.freezeCount} \u5904\u9759\u6B62\u6BB5\u5171 ${analysis.freezeSeconds}s${analysis.freezeSeconds > 1 ? "\uFF08>1s\uFF0C\u7591\u4F3C\u5361\u5E27\uFF09" : "\uFF08\u8F7B\u5FAE\uFF09"}` : "\u65E0\u51BB\u7ED3\u6BB5" });
  checks.push({ name: "\u8DF3\u53D8", pass: analysis.jumpCount === 0, detail: analysis.jumpCount > 0 ? `\u68C0\u51FA ${analysis.jumpCount} \u5E27\u975E\u5207\u70B9\u4EAE\u5EA6\u5C16\u5CF0\uFF08\u5F62\u6001\u7A81\u53D8/\u6A21\u578B\u8DF3\u5E27\uFF09` : "\u65E0\u8DF3\u53D8" });
  checks.push({ name: "\u9ED1\u573A\u5360\u6BD4", pass: (analysis.blackSegments ?? []).reduce((sum, segment) => sum + segment.durationSec, 0) <= (analysis.probe.durationSec ?? 0) * 0.02, detail: (analysis.blackSegments ?? []).length > 0 ? `\u9ED1\u573A\u5171 ${(analysis.blackSegments ?? []).reduce((sum, segment) => sum + segment.durationSec, 0).toFixed(1)}s` : "\u65E0\u9ED1\u573A" });
  if (analysis.blackSegments !== void 0 && analysis.blackSegments.length > 0) {
    const total = analysis.blackSegments.reduce((sum, segment) => sum + segment.durationSec, 0);
    checks.push({ name: "\u9ED1\u573A\u6BB5", pass: false, detail: `${analysis.blackSegments.length} \u6BB5\u9ED1\u573A\u5171 ${total.toFixed(2)}s\uFF08blackdetect d=0.25\uFF09` });
  }
  if (analysis.volumeDbfs !== void 0) {
    const ok = !(analysis.volumeDbfs.mean < -40 && analysis.volumeDbfs.peak < -25);
    checks.push({ name: "\u97F3\u91CF", pass: ok, detail: `mean ${analysis.volumeDbfs.mean.toFixed(1)}dB, peak ${analysis.volumeDbfs.peak.toFixed(1)}dB\uFF08\u8FC7\u9759\u97F3\u6216\u8FC7\u4F4E\u5CF0\u503C\u4F1A\u62E6\u622A\uFF09` });
  }
  if (input.expect?.asl !== void 0 && analysis.shots.length > 1) {
    const mean = analysis.shots.reduce((sum, shot) => sum + shot.durationSec, 0) / analysis.shots.length;
    const [min, max] = input.expect.asl;
    const ok = mean >= min && mean <= max;
    checks.push({ name: "\u5E73\u5747\u955C\u5934\u65F6\u957F", pass: ok, detail: `ASL ${mean.toFixed(2)}s / \u671F\u671B [${min}, ${max}]s` });
  }
  if (input.expect?.rhythm === true && analysis.shots.length > 1) {
    const longest = Math.max(...analysis.shots.map((shot) => shot.durationSec));
    const over = analysis.shots.filter((shot) => shot.durationSec > 8).length;
    checks.push({ name: "\u8282\u594F\u5BC6\u5EA6", pass: over === 0, detail: `\u6700\u957F\u955C ${longest.toFixed(1)}s\uFF08${analysis.shots.length} \u955C\uFF09${over > 0 ? `\uFF0C${over} \u955C\u8D85 8s \u65E0\u53D8\u5316` : ""}` });
  }
  if (analysis.audioLoudness !== void 0 && analysis.audioLoudness.peakLu > -60) {
    checks.push({ name: "\u54CD\u5EA6", pass: true, detail: `\u5747\u503C ${analysis.audioLoudness.meanLu} LU\uFF0C\u5CF0\u503C ${analysis.audioLoudness.peakLu} LU` });
  } else if (audioStream) {
    checks.push({ name: "\u54CD\u5EA6", pass: false, detail: "\u97F3\u9891\u8FD1\u4E4E\u9759\u97F3\uFF08\u5CF0\u503C < -60 LU\uFF09" });
  }
  return { verdict: checks.every((check) => check.pass) ? "pass" : "fix", checks };
}

// src/providers/timeline.ts
import { createHash } from "node:crypto";
import { spawnSync as spawnSync7 } from "node:child_process";
import { copyFileSync, existsSync as existsSync5, readFileSync as readFileSync2, statSync, mkdirSync } from "node:fs";
import { rm as rm2 } from "node:fs/promises";
import { join as join24 } from "node:path";
var DirectiveError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "DirectiveError";
  }
};
function sceneFingerprint(scene, scale) {
  const source = scene.source;
  let sourceTag = source;
  try {
    const info = statSync(source);
    sourceTag = `${source}:${info.size}:${info.mtimeMs}`;
  } catch {
    sourceTag = `${source}:missing`;
  }
  const parts = [sourceTag, JSON.stringify(scene.trim ?? null), scene.speed ?? 1, scene.reverse === true ? "rev" : "fwd", scale ?? ""];
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 20);
}
function segmentCachePath(outputDir, fingerprint) {
  return join24(resolveOutputDir(outputDir), ".timeline-cache", `${fingerprint}.mp4`);
}
async function renderTimeline(spec, outputDir) {
  if (spec.scenes.length === 0) throw new DirectiveError("invalidArg", "timeline needs at least one scene");
  for (const [index, scene] of spec.scenes.entries()) {
    if (scene.source === "" || !existsSync5(scene.source)) {
      throw new DirectiveError("notFound", `timeline scene ${index + 1}: source not found (${scene.source || "<empty>"})`);
    }
    if (scene.trim !== void 0) {
      const [start, end] = scene.trim;
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
        throw new DirectiveError("outOfRange", `timeline scene ${index + 1}: trim window [${start},${end}] invalid (0 <= start < end)`);
      }
    }
    if (scene.speed !== void 0 && (scene.speed < 0.5 || scene.speed > 8)) {
      throw new DirectiveError("outOfRange", `timeline scene ${index + 1}: speed ${scene.speed}x out of range [0.5, 8]`);
    }
  }
  const steps = [];
  const staleFiles = [];
  try {
    const segmentPaths = [];
    for (const [index, scene] of spec.scenes.entries()) {
      const fingerprint = sceneFingerprint(scene, spec.scale);
      const cached = segmentCachePath(outputDir, fingerprint);
      if (existsSync5(cached)) {
        segmentPaths.push(cached);
        steps.push(`scene ${index + 1} cache hit (fingerprint ${fingerprint}): ${cached}`);
        continue;
      }
      if (scene.trim !== void 0) {
        const segment = await videoProcess({
          source: scene.source,
          outputDir,
          start: scene.trim[0],
          end: scene.trim[1],
          ...scene.speed !== void 0 && scene.speed > 0 ? { speed: Math.min(8, Math.max(0.5, scene.speed)) } : {},
          ...scene.reverse === true ? { reverse: true } : {},
          ...spec.scale !== void 0 && spec.scale !== "" ? { scale: spec.scale } : {}
        });
        staleFiles.push(segment.path);
        segmentPaths.push(segment.path);
        steps.push(`trim scene ${index + 1}${scene.speed !== void 0 && scene.speed > 0 ? ` (speed ${scene.speed}x)` : ""}: ${scene.source} [${scene.trim[0]},${scene.trim[1]}] -> ${segment.path}`);
        try {
          mkdirSync(join24(resolveOutputDir(outputDir), ".timeline-cache"), { recursive: true });
          copyFileSync(segment.path, cached);
        } catch {
        }
      } else if (scene.speed !== void 0 && scene.speed > 0 && Math.abs(scene.speed - 1) > 0.01) {
        const segment = await videoProcess({
          source: scene.source,
          outputDir,
          speed: Math.min(8, Math.max(0.5, scene.speed)),
          ...spec.scale !== void 0 && spec.scale !== "" ? { scale: spec.scale } : {}
        });
        staleFiles.push(segment.path);
        segmentPaths.push(segment.path);
        steps.push(`scene ${index + 1} speed ${scene.speed}x: ${scene.source} -> ${segment.path}`);
      } else {
        segmentPaths.push(scene.source);
        steps.push(`scene ${index + 1} untrimmed: ${scene.source}`);
      }
    }
    const allCut = spec.scenes.every((scene) => scene.transition === "cut");
    let assembled;
    if (segmentPaths.length === 1) {
      const single = await videoProcess({ source: segmentPaths[0], outputDir, ...spec.scale !== void 0 && spec.scale !== "" ? { scale: spec.scale } : {} });
      assembled = { path: single.path, mimeType: "video/mp4", probe: single.probe };
      steps.push(`single scene (no concat): ${segmentPaths[0]} -> ${single.path}`);
    } else {
      assembled = await videoConcat({
        files: segmentPaths,
        outputDir,
        transition: allCut ? "cut" : "fade",
        fadeSec: 0.5,
        ...spec.scale !== void 0 && spec.scale !== "" ? { scale: spec.scale } : {}
      });
      steps.push(`concat (${allCut ? "cut" : "fade"}): ${segmentPaths.length} scenes -> ${assembled.path}`);
    }
    if (spec.audio !== void 0 && spec.audio.length > 0) {
      const narrationIndex = spec.audio.findIndex((track) => track.duckUnder !== void 0 && track.duckUnder >= 0);
      staleFiles.push(assembled.path);
      assembled = await audioMix({
        video: assembled.path,
        outputDir,
        tracks: spec.audio.map((track) => ({ path: track.path, volume: track.volume })),
        duckUnder: narrationIndex >= 0 ? narrationIndex : void 0
      });
      steps.push(`audio mix: ${spec.audio.length} tracks${narrationIndex >= 0 ? ` (duck under track ${narrationIndex})` : ""} -> ${assembled.path}`);
    }
    if (spec.fadeIn !== void 0 || spec.fadeOut !== void 0) {
      const duration = assembled.probe.durationSec ?? 0;
      const fadeFilters = [];
      const audioFade = [];
      if (spec.fadeIn !== void 0 && spec.fadeIn > 0) {
        fadeFilters.push(`fade=t=in:st=0:d=${spec.fadeIn}`);
        audioFade.push(`afade=t=in:st=0:d=${spec.fadeIn}`);
      }
      if (spec.fadeOut !== void 0 && spec.fadeOut > 0 && duration > spec.fadeOut) {
        fadeFilters.push(`fade=t=out:st=${(duration - spec.fadeOut).toFixed(3)}:d=${spec.fadeOut}`);
        audioFade.push(`afade=t=out:st=${(duration - spec.fadeOut).toFixed(3)}:d=${spec.fadeOut}`);
      }
      if (fadeFilters.length > 0 || audioFade.length > 0) {
        const out = join24(resolveOutputDir(outputDir), `faded-${Date.now().toString(36)}.mp4`);
        const fargs = ["-hide_banner", "-y", "-i", assembled.path];
        if (fadeFilters.length > 0) fargs.push("-vf", fadeFilters.join(","));
        if (audioFade.length > 0) fargs.push("-af", audioFade.join(","));
        fargs.push("-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac", out);
        const result = spawnSync7("ffmpeg", fargs, { encoding: "utf8" });
        if (result.status !== 0) throw new Error(`fade failed: ${result.stderr?.slice(-300)}`);
        staleFiles.push(assembled.path);
        assembled = { path: out, mimeType: "video/mp4", probe: probeMedia(out) };
        steps.push(`fade in/out -> ${out}`);
      }
    }
    if (spec.subtitle !== void 0 && spec.subtitle !== "") {
      staleFiles.push(assembled.path);
      assembled = await videoSubtitle({ video: assembled.path, srt: spec.subtitle, mode: "soft", outputDir });
      steps.push(`subtitle mux: ${spec.subtitle} -> ${assembled.path}`);
    }
    return { path: assembled.path, mimeType: "video/mp4", steps, probe: assembled.probe };
  } finally {
    await Promise.all(staleFiles.map((stale) => rm2(stale, { force: true }).catch(() => {
    })));
  }
}
async function audioSync(input) {
  const steps = [];
  const detect = spawnSync7("ffmpeg", [
    "-hide_banner",
    "-i",
    input.narration,
    "-af",
    "silencedetect=noise=-35dB:d=0.25",
    "-vn",
    "-f",
    "null",
    "-"
  ], { encoding: "utf8" });
  const stderr = detect.stderr ?? "";
  const boundaries = [];
  for (const line of stderr.split("\n")) {
    const startMatch = line.match(/silence_start: *([\d.]+)/);
    const endMatch = line.match(/silence_end: *([\d.]+)/);
    if (startMatch !== null) boundaries.push({ kind: "end", t: Number(startMatch[1]) });
    if (endMatch !== null) boundaries.push({ kind: "start", t: Number(endMatch[1]) });
  }
  boundaries.sort((a, b) => a.t - b.t);
  const speechIntervals = [];
  let open;
  for (const boundary of boundaries) {
    if (boundary.kind === "start" && open === void 0) open = boundary.t;
    if (boundary.kind === "end" && open !== void 0) {
      speechIntervals.push({ start: Number(open.toFixed(2)), end: Number(boundary.t.toFixed(2)) });
      open = void 0;
    }
  }
  steps.push(`speech intervals: ${speechIntervals.map((interval) => `[${interval.start},${interval.end}]`).join(" ") || "none detected (continuous narration)"}`);
  const tracks = [{ path: input.narration, volume: 1 }];
  if (input.bgm !== void 0 && input.bgm !== "") tracks.push({ path: input.bgm, volume: 0.12 });
  let mixed = await audioMix({
    video: input.video,
    outputDir: input.outputDir,
    tracks,
    duckUnder: 0
  });
  steps.push(`mix: narration + ${tracks.length - 1} bgm tracks (duck under narration) -> ${mixed.path}`);
  if (input.srt !== void 0 && input.srt !== "") {
    mixed = await videoSubtitle({ video: mixed.path, srt: input.srt, mode: "soft", outputDir: input.outputDir });
    steps.push(`subtitle mux: ${input.srt} -> ${mixed.path}`);
  }
  return { path: mixed.path, mimeType: "video/mp4", speechIntervals, steps, probe: mixed.probe };
}
function parseSrt(content) {
  const cues = [];
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;
    const timeMatch = lines[1]?.match(/([\d:,]+)\s*-->\s*([\d:,]+)/);
    if (timeMatch === null || timeMatch === void 0) continue;
    const start = toSeconds(timeMatch[1]);
    const end = toSeconds(timeMatch[2]);
    const text = lines.slice(2).join(" ").trim();
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    cues.push({ index: Number(lines[0]) || cues.length + 1, start, end, text });
  }
  return cues;
}
function toSeconds(timestamp) {
  const normalized = timestamp.replace(",", ".");
  const parts = normalized.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(normalized);
}
async function subtitleCut(input) {
  const content = readFileSync2(input.srt, "utf8");
  const pad = input.pad ?? 0.15;
  let cues = parseSrt(content);
  if (input.include !== void 0 && input.include !== "") {
    cues = cues.filter((cue) => cue.text.includes(input.include ?? ""));
  }
  if (cues.length === 0) throw new DirectiveError("parse", "srt \u4E2D\u6CA1\u6709\u5339\u914D\u7684\u5B57\u5E55\u6761\u76EE");
  let windows = cues.map((cue) => ({ start: Math.max(0, cue.start - pad), end: cue.end + pad }));
  if (input.mergeOverlap !== false) {
    windows = windows.reduce((merged, window) => {
      const last = merged[merged.length - 1];
      if (last !== void 0 && window.start <= last.end) last.end = Math.max(last.end, window.end);
      else merged.push({ ...window });
      return merged;
    }, []);
  }
  const rendered = await renderTimeline({
    scenes: windows.map((window) => ({ source: input.video, trim: [window.start, window.end], transition: "cut" }))
  }, input.outputDir);
  return {
    path: rendered.path,
    mimeType: "video/mp4",
    cues: cues.map((cue) => ({ start: cue.start, end: cue.end, text: cue.text })),
    steps: rendered.steps,
    probe: rendered.probe
  };
}
function splitSentences(text) {
  return text.split(/[。！？；\n]+/).map((sentence) => sentence.trim()).filter((sentence) => sentence.length >= 4);
}
function overlap(a, b) {
  let score = 0;
  for (const char of a) if (b.includes(char)) score += 1;
  return score / Math.max(1, a.length);
}
async function smartCut(input) {
  const cues = parseSrt(readFileSync2(input.srt, "utf8"));
  const script = input.script.length > 0 && !input.script[0].includes("\u3002") && input.script.length > 1 ? input.script : splitSentences((input.script[0] ?? "").length > 0 ? input.script[0] : input.script.join(" "));
  const pad = input.pad ?? 0.15;
  const matched = [];
  const windows = [];
  for (const sentence of script) {
    let best = null;
    let bestScore = 0;
    for (const cue of cues) {
      const score = overlap(sentence, cue.text);
      if (score > bestScore) {
        bestScore = score;
        best = cue;
      }
    }
    if (best === null) {
      matched.push({ script: sentence, cue: null, start: 0, end: 0 });
      continue;
    }
    const start = Math.max(0, best.start - pad);
    const end = best.end + pad;
    windows.push({ start, end });
    matched.push({ script: sentence, cue: best, start, end });
  }
  if (windows.length === 0) throw new DirectiveError("parse", "\u811A\u672C\u4E0E\u5B57\u5E55\u6CA1\u6709\u53EF\u5339\u914D\u7684\u6761\u76EE\uFF08\u6362\u66F4\u63A5\u8FD1\u539F\u8BDD\u7684\u811A\u672C\uFF0C\u6216\u5148 transcribe \u5F97\u5230\u5B57\u5E55\uFF09");
  const rendered = await renderTimeline({
    scenes: windows.map((window) => ({ source: input.video, trim: [window.start, window.end], transition: "cut" }))
  }, input.outputDir);
  return { path: rendered.path, mimeType: "video/mp4", matched, steps: rendered.steps, probe: rendered.probe };
}
function charOverlap(a, b) {
  let score = 0;
  for (const char of a) if (b.includes(char)) score += 1;
  return score / Math.max(1, a.length);
}
async function clipRank(input) {
  const cues = parseSrt(readFileSync2(input.srt, "utf8"));
  const script = input.script.filter((sentence) => sentence.trim() !== "");
  const ranked = cues.map((cue) => {
    let best = 0;
    let matchedBy = "";
    for (const sentence of script) {
      const score = charOverlap(sentence, cue.text);
      if (score > best) {
        best = score;
        matchedBy = sentence;
      }
    }
    return { cue, score: Number(best.toFixed(3)), matchedBy };
  }).sort((a, b) => b.score - a.score).slice(0, input.topN ?? 10);
  return { ranked };
}
function parseEditInstructions(instructions, duration) {
  const commands = [];
  const duration2 = Number.isFinite(duration) && duration > 0 ? duration : Number.MAX_SAFE_INTEGER;
  for (const raw of instructions) {
    const text = raw.trim();
    if (text === "") continue;
    const seconds = (value) => {
      if (value === void 0) return void 0;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : void 0;
    };
    const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:到|至|-|~)\s*(\d+(?:\.\d+)?)\s*秒/);
    if (/整个|全部.*倒放|倒放整个|反向播放/.test(text) && rangeMatch === null) {
      commands.push({ op: "reverse" });
      continue;
    }
    if (rangeMatch !== null) {
      const from = seconds(rangeMatch[1]);
      const to = seconds(rangeMatch[2]);
      if (from !== void 0 && to !== void 0 && to > from) {
        const speedMatch = text.match(/(\d+(?:\.\d+)?)\s*倍|速度\s*(\d+(?:\.\d+)?)|(放慢|加快|加速|减速)\s*(\d+(?:\.\d+)?)/);
        const slower = /放慢|减速/.test(text);
        if (speedMatch !== null) {
          let speed = seconds(speedMatch[1] ?? speedMatch[2] ?? speedMatch[4]);
          if (speed !== void 0) {
            if (slower && speed > 1) speed = 1 / speed;
            commands.push({ op: "speed", from, to, speed });
          }
        } else {
          commands.push({ op: "keep", from, to });
        }
      }
      continue;
    }
    const headMatch = text.match(/开头|前面|前\s*(\d+(?:\.\d+)?)\s*秒.*(去掉|删除|剪掉|剪去|不要|删)/);
    const headMatch2 = text.match(/(去掉|删除|剪掉|剪去|不要|删).*?(开头|前面|前)\s*(\d+(?:\.\d+)?)\s*秒/);
    const head = headMatch ?? headMatch2;
    const headSeconds = seconds(headMatch?.[1] ?? headMatch2?.[3]);
    if (head !== null && headSeconds !== void 0 && headSeconds > 0) {
      commands.push({ op: "cut-head", seconds: Math.min(headSeconds, duration2) });
      continue;
    }
    const tailMatch = text.match(/(结尾|末尾|最后|后面|后)\s*(\d+(?:\.\d+)?)\s*秒.*(去掉|删除|剪掉|剪去|不要|删)/);
    const tailMatch2 = text.match(/(去掉|删除|剪掉|剪去|不要|删).*?(结尾|末尾|最后|后面|后)\s*(\d+(?:\.\d+)?)\s*秒/);
    const tail = tailMatch ?? tailMatch2;
    const tailSeconds = seconds(tailMatch?.[2] ?? tailMatch2?.[3]);
    if (tail !== null && tailSeconds !== void 0 && tailSeconds > 0) {
      commands.push({ op: "cut-tail", seconds: Math.min(tailSeconds, duration2) });
      continue;
    }
    const keepMatch = text.match(/(?:只保留|只留|保留|留下|取)\s*(\d+(?:\.\d+)?)\s*(?:到|至|-|~)\s*(\d+(?:\.\d+)?)\s*秒/);
    if (keepMatch !== null) {
      const from = seconds(keepMatch[1]);
      const to = seconds(keepMatch[2]);
      if (from !== void 0 && to !== void 0 && to > from) commands.push({ op: "keep", from, to });
      continue;
    }
  }
  return commands;
}
function editsToScenes(commands, duration) {
  if (commands.length === 0) return [];
  let windows = [[0, duration]];
  for (const command of commands) {
    if (command.op === "keep" && command.from !== void 0 && command.to !== void 0) {
      windows = [[command.from, Math.min(command.to, duration)]];
    } else if (command.op === "cut-head" && command.seconds !== void 0) {
      windows = windows.map(([start, end]) => {
        const cut = Math.min(command.seconds, end - start);
        return cut >= end - start ? [] : [[start + cut, end]];
      }).flat();
    } else if (command.op === "cut-tail" && command.seconds !== void 0) {
      windows = windows.map(([start, end]) => {
        const cut = Math.min(command.seconds, end - start);
        return cut >= end - start ? [] : [[start, end - cut]];
      }).flat();
    }
  }
  const scenes = windows.map(([start, end]) => ({ trim: [start, end], speed: void 0, reverse: false }));
  for (const command of commands) {
    if (command.op === "speed" && command.from !== void 0 && command.to !== void 0) {
      for (const scene of scenes) {
        if (command.from >= scene.trim[0] && command.to <= scene.trim[1]) {
          scene.speed = command.speed;
        }
      }
    }
    if (command.op === "reverse") {
      for (const scene of scenes) scene.reverse = true;
    }
  }
  return scenes.map((scene) => ({ source: "", trim: scene.trim, ...scene.speed !== void 0 ? { speed: scene.speed } : {}, ...scene.reverse ? { reverse: true } : {} }));
}
function srtLint(content, options = {}) {
  const cues = parseSrt(content);
  const issues = [];
  const maxLine = options.maxLineChars ?? 16;
  const maxCps = options.maxCps ?? 17;
  cues.forEach((cue, index) => {
    const lines = cue.text.split("\\n");
    for (const line of lines) {
      if (line.length > maxLine) issues.push({ cue: cue.index, kind: "line-width", detail: `\u7B2C ${cue.index} \u6761\u5355\u884C ${line.length} \u5B57 > ${maxLine}\uFF08\u5EFA\u8BAE\u62C6\u884C\uFF09` });
    }
    const duration = cue.end - cue.start;
    if (duration < 0.83) issues.push({ cue: cue.index, kind: "duration", detail: `\u7B2C ${cue.index} \u6761\u65F6\u957F ${duration.toFixed(2)}s < 0.83s\uFF08\u6700\u77ED\u5C55\u793A\u65F6\u957F\uFF09` });
    const chars = cue.text.replace(/\\s/g, "").length;
    const cps = chars / Math.max(0.1, duration);
    if (cps > maxCps) issues.push({ cue: cue.index, kind: "cps", detail: `\u7B2C ${cue.index} \u6761 ${cps.toFixed(1)} \u5B57/\u79D2 > ${maxCps}\uFF08\u9605\u8BFB\u901F\u7387\u8D85\u6807\uFF09` });
    if (index > 0 && cue.index !== cues[index - 1].index + 1) issues.push({ cue: cue.index, kind: "ordering", detail: `\u7B2C ${cue.index} \u6761\u5E8F\u53F7\u4E0D\u8FDE\u7EED\uFF08\u4E0A\u4E00\u5E8F\u53F7 ${cues[index - 1].index}\uFF09` });
    if (!Number.isFinite(cue.start) || !Number.isFinite(cue.end) || cue.end < cue.start) issues.push({ cue: cue.index, kind: "timestamp", detail: `\u7B2C ${cue.index} \u6761\u65F6\u95F4\u6233\u975E\u6CD5` });
  });
  return { totalCues: cues.length, issues, ok: issues.length === 0 };
}
function cleanSpeechText(text) {
  return text.replace(/[（(][^（）()]*[）)]/g, " ").replace(/[\[【][^\]】]*[\]】]/g, " ").replace(/[™®©]/g, "").replace(/——/g, "\uFF0C").replace(/\s+/g, " ").trim();
}
function srtNormalize(content, options = {}) {
  const cues = parseSrt(content);
  const applied = [];
  const minDuration = options.minDurationSec ?? 2.5;
  const gapMerge = options.gapMergeSec ?? 1;
  for (let index = 0; index < cues.length; index += 1) {
    const cue = cues[index];
    if (index < cues.length - 1) {
      const gap = cues[index + 1].start - cue.end;
      if (gap > 0 && gap < gapMerge) {
        cue.end = cues[index + 1].start;
        applied.push(`cue ${cue.index}: gap ${gap.toFixed(2)}s merged into end`);
      }
    }
    if (index < cues.length - 1 && cue.end - cue.start < minDuration) {
      const ceiling = index < cues.length - 1 ? cues[index + 1].start : Number.MAX_SAFE_INTEGER;
      const nextEnd = Math.min(cue.start + minDuration, ceiling);
      if (nextEnd > cue.end) {
        cue.end = Number(nextEnd.toFixed(3));
        applied.push(`cue ${cue.index}: duration extended to ${(cue.end - cue.start).toFixed(2)}s (capped at next start)`);
      }
    }
  }
  const lines = [];
  cues.forEach((cue, index) => {
    lines.push(String(index + 1));
    lines.push(`${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}`);
    lines.push(cue.text);
    lines.push("");
  });
  return { srt: lines.join("\n"), applied };
}
function formatSrtTime(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1e3));
  const h = String(Math.floor(ms / 36e5)).padStart(2, "0");
  const m = String(Math.floor(ms / 6e4) % 60).padStart(2, "0");
  const s = String(Math.floor(ms / 1e3) % 60).padStart(2, "0");
  const rem = String(ms % 1e3).padStart(3, "0");
  return `${h}:${m}:${s},${rem}`;
}
var SPEECH_RATES = {
  zh: 4.2,
  ja: 4,
  ko: 4.3,
  en: 13.5,
  de: 11.8,
  fr: 12.5,
  es: 12.8,
  ru: 10.5
};
function estimateSpeech(input, windowSec) {
  const lang = (input.lang ?? "zh").toLowerCase();
  const rate = SPEECH_RATES[lang] ?? (lang === "zh" ? 4.2 : 10);
  const clean = cleanSpeechText(input.text);
  const chars = clean.replace(/\\s/g, "").length;
  const punctuation = (clean.match(/[，。！？；：、,.!?;:]/g) ?? []).length;
  const seconds = Number((chars / rate + punctuation * 0.25).toFixed(2));
  const output = { seconds, chars, ratePerSec: rate };
  if (windowSec !== void 0) {
    output.windowSec = windowSec;
    output.fits = seconds <= windowSec;
    output.overflowSec = Number(Math.max(0, seconds - windowSec).toFixed(2));
    if (!output.fits) {
      const target = Math.floor(windowSec * rate * 0.92);
      output.suggestion = `\u8D85\u7A97 ${output.overflowSec}s\uFF1A\u5EFA\u8BAE\u7F29\u5230\u7EA6 ${target} \u5B57\uFF08\u5F53\u524D ${chars} \u5B57\uFF09\uFF0C\u6216\u653E\u5BBD\u5B57\u5E55\u7A97\u53E3`;
    }
  }
  return output;
}

// src/providers/video-understand.ts
import { mkdir as mkdir16 } from "node:fs/promises";
async function videoUnderstand(input) {
  const probe = probeMedia(input.source);
  const framesDir = resolveOutputDir(input.outputDir);
  await mkdir16(framesDir, { recursive: true });
  const count = Math.min(12, Math.max(2, input.frames ?? 6));
  const extracted = await extractFrames(input.source, framesDir, { count });
  const question = input.question ?? "\u63CF\u8FF0\u8FD9\u4E00\u5E27\u7684\u753B\u9762\uFF1A\u4E3B\u4F53\u3001\u52A8\u4F5C\u3001\u666F\u522B\u3001\u5149\u7EBF\u3001\u6784\u56FE\uFF1B\u53EA\u63CF\u8FF0\u53EF\u89C1\u5185\u5BB9\u3002";
  const visionAvailable = input.vision.enabled && input.vision.mode !== "mock";
  const duration = typeof probe.durationSec === "number" && probe.durationSec > 0 ? probe.durationSec : count;
  const frames = [];
  for (let index = 0; index < extracted.length; index += 1) {
    const frame = extracted[index];
    const path = frame?.path ?? "";
    const t = Number((duration * (index + 0.5) / Math.max(1, extracted.length)).toFixed(2));
    let description = null;
    if (visionAvailable && path !== "") {
      try {
        const result = await runVision({ settings: input.settings, capability: input.vision, signal: AbortSignal.timeout(6e4) }, path, question);
        description = result.answer;
      } catch {
        description = null;
      }
    }
    frames.push({ t, path, description });
  }
  return {
    source: input.source,
    probe,
    frames,
    visionMode: input.vision.mode,
    ...visionAvailable ? {} : { note: "vision \u672A\u914D\u7F6E\u6216\u4E0D\u53EF\u7528\uFF1A\u8FD4\u56DE\u5E27\u8DEF\u5F84\u4E0E\u5143\u6570\u636E\uFF0Cagent \u53EF\u81EA\u884C\u5224\u8BFB\uFF08\u6216\u914D\u7F6E DirectorX vision \u540E\u91CD\u8BD5\uFF09\u3002" }
  };
}

// src/providers/sheet-prompt.ts
var SHEET_HINT = /三视图|设定图|设定表|角色卡|角色设定|turnaround|character sheet|正侧背|正视.*侧视/i;
var SHEET_SPEC = [
  "\u3010\u5FC5\u987B\u662F\u4E00\u5F20\u89D2\u8272\u8BBE\u5B9A\u8868\uFF0C\u4E0D\u662F\u5355\u5F20\u5267\u7167\u301116:9\uFF0C\u7EAF\u767D\u5E95\u3002",
  "\u5DE6\u680F\u7EA6 34%\uFF1A\u534A\u8EAB\u8BC1\u4EF6\u7167\uFF0C\u9762\u90E8\u57FA\u51C6\uFF0C\u80A9\u8180\u5B8C\u6574\uFF0C\u5E95\u8FB9\u9F50\u5E73\u76F4\u5207\u3002",
  "\u53F3\u4E0A\uFF1A\u6B63\u89C6\u3001\u4FA7\u89C6\u3001\u80CC\u89C6\u4E09\u4E2A\u5168\u8EAB\u50CF\uFF0C\u7B49\u9AD8\u3001\u4E0D\u62C9\u4F38\u3001\u4E0D\u900F\u89C6\u538B\u7F29\u3002",
  "\u53F3\u4E0B\uFF1A\u6750\u8D28/\u914D\u9970\u7EC6\u8282\u6761\u3002",
  "\u5DE6\u53F3\u5FC5\u987B\u662F\u540C\u4E00\u4E2A\u4EBA\u3001\u540C\u4E00\u53D1\u578B\u3001\u540C\u4E00\u8868\u60C5\uFF1B\u5DE6\u680F\u67D4\u548C\u65B9\u5411\u5149\uFF0C\u53F3\u680F\u5E73\u5149\u6B63\u4EA4\u3002"
].join("");
function wantsCharacterSheet(prompt) {
  return SHEET_HINT.test(prompt);
}
function withCharacterSheetSpec(prompt) {
  if (!wantsCharacterSheet(prompt)) return prompt;
  if (prompt.includes("\u3010\u5FC5\u987B\u662F\u4E00\u5F20\u89D2\u8272\u8BBE\u5B9A\u8868")) return prompt;
  return `${prompt.trim()}

${SHEET_SPEC}`;
}

// src/research-ledger.ts
import { mkdir as mkdir17, readFile as readFile15, writeFile as writeFile13 } from "node:fs/promises";
import { join as join25 } from "node:path";
var FILE3 = "research.json";
var MAX2 = 80;
var FRESH_MS = 45 * 60 * 1e3;
var ResearchLedger = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join25(resolveOutputDir(this.outputDir), FILE3);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile15(this.filePath(), "utf8"));
      return Array.isArray(parsed.events) ? parsed.events : [];
    } catch {
      return [];
    }
  }
  async record(event) {
    const events = await this.read();
    events.push({ ...event, at: Date.now() });
    const next = events.slice(-MAX2);
    await mkdir17(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile13(this.filePath(), JSON.stringify({ events: next }, null, 2), "utf8");
  }
  async recent(kind, withinMs = FRESH_MS) {
    const since = Date.now() - withinMs;
    return (await this.read()).filter((event) => event.at >= since && (kind === void 0 || event.kind === kind));
  }
  async hasReads(input) {
    const recent = await this.recent();
    const knowledge = new Set(recent.filter((event) => event.kind === "knowledge").map((event) => event.ref));
    const skills = new Set(recent.filter((event) => event.kind === "skill").map((event) => event.ref));
    const missing = [];
    if (input.knowledge.length === 0) missing.push("knowledge");
    if (input.skills.length === 0) missing.push("skill");
    for (const ref of input.knowledge) {
      if (![...knowledge].some((item) => item === ref || item.includes(ref) || ref.includes(item))) missing.push(`knowledge:${ref}`);
    }
    for (const name2 of input.skills) {
      if (![...skills].some((item) => item === name2 || item.includes(name2))) missing.push(`skill:${name2}`);
    }
    return { ok: missing.length === 0, missing };
  }
};

// src/prompt-craft.ts
import { mkdir as mkdir18, readFile as readFile17, writeFile as writeFile14 } from "node:fs/promises";
import { join as join27 } from "node:path";

// src/skill-index.ts
import { readdir as readdir3, readFile as readFile16 } from "node:fs/promises";
import { join as join26, relative as relative2, resolve as resolve12, sep as sep3 } from "node:path";
import { fileURLToPath as fileURLToPath3 } from "node:url";
var MAX_READ = 4e4;
function tokens(value) {
  const out = /* @__PURE__ */ new Set();
  for (const word of value.toLowerCase().match(/[a-z0-9][a-z0-9_-]{1,}/g) ?? []) out.add(word);
  const han = value.replace(/[^\u4e00-\u9fff]/g, "");
  for (let i = 0; i < han.length; i += 1) {
    out.add(han[i] ?? "");
    if (i + 1 < han.length) out.add(han.slice(i, i + 2));
  }
  return out;
}
function overlap2(a, b) {
  let n = 0;
  for (const token of a) if (b.has(token)) n += 1;
  return n;
}
var SkillIndex = class {
  root = resolve12(process.cwd(), "skills");
  cache;
  setRoot(root) {
    this.root = resolve12(root);
    this.cache = void 0;
  }
  load() {
    if (this.cache === void 0) this.cache = this.scan();
    return this.cache;
  }
  async scan() {
    const records = [];
    const walk = async (dir) => {
      let entries;
      try {
        entries = await readdir3(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const path = join26(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(path);
          continue;
        }
        if (entry.name !== "SKILL.md") continue;
        const body = await readFile16(path, "utf8").catch(() => "");
        if (body === "") continue;
        const name2 = /(?:^|\n)name:\s*([a-z0-9-]+)/.exec(body)?.[1] ?? relative2(this.root, dir).replaceAll(sep3, "-");
        const description = /(?:^|\n)description:\s*(?:\||>-)\s*\n([\s\S]*?)(?:\n[a-zA-Z][a-zA-Z0-9_-]*:|\n---)/.exec(body)?.[1]?.replace(/\n\s+/g, " ").trim() ?? /(?:^|\n)description:\s*(.+)/.exec(body)?.[1]?.trim() ?? body.slice(0, 400);
        const headings = [...body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1] ?? "").filter(Boolean);
        const sibling = await readdir3(dir, { withFileTypes: true }).catch(() => []);
        const references = [];
        for (const child of sibling) {
          if (child.isDirectory() && (child.name === "references" || child.name === "examples")) {
            const nested = await readdir3(join26(dir, child.name)).catch(() => []);
            for (const file of nested) {
              if (file.endsWith(".md") || file.endsWith(".json")) references.push(`${child.name}/${file}`);
            }
          }
        }
        records.push({
          name: name2,
          description,
          dir: relative2(this.root, dir) || name2,
          headings,
          references,
          body
        });
      }
    };
    await walk(this.root);
    return records;
  }
  async search(query, maxResults = 8) {
    const q = query.trim();
    if (q === "") return [];
    const queryTokens = tokens(q);
    const records = await this.load();
    const hits = [];
    for (const record of records) {
      const hay = `${record.name} ${record.description} ${record.headings.join(" ")} ${record.references.join(" ")} ${record.body.slice(0, 2e3)}`;
      let score = overlap2(queryTokens, tokens(hay));
      if (record.name === q.toLowerCase() || record.name.includes(q.toLowerCase())) score += 20;
      if (hay.toLowerCase().includes(q.toLowerCase())) score += 12;
      if (score <= 0) continue;
      hits.push({
        name: record.name,
        description: record.description.slice(0, 240),
        dir: record.dir,
        headings: record.headings,
        references: record.references,
        score,
        snippet: record.headings.slice(0, 4).join(" \xB7 ") || record.description.slice(0, 160)
      });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, Math.max(1, maxResults));
  }
  async read(name2, file) {
    const records = await this.load();
    const wanted = name2.trim();
    const record = records.find((item) => item.name === wanted || item.dir === wanted || item.dir.endsWith(wanted));
    if (record === void 0) throw new Error(`Unknown skill "${wanted}". Use directorx_skill_search first.`);
    if (file !== void 0 && file.trim() !== "") {
      const rel = file.trim().replace(/^\/+/, "");
      if (rel.includes("..")) throw new Error("skill file path escapes the skill folder");
      const path = join26(this.root, record.dir, rel);
      const content = await readFile16(path, "utf8");
      return { name: record.name, path: `${record.dir}/${rel}`, content: content.slice(0, MAX_READ), references: record.references };
    }
    return {
      name: record.name,
      path: `${record.dir}/SKILL.md`,
      content: record.body.slice(0, MAX_READ),
      references: record.references
    };
  }
};
var skillIndex = new SkillIndex();
function defaultSkillRoot() {
  return fileURLToPath3(new URL("../skills/", import.meta.url));
}

// src/prompt-craft.ts
var FILE4 = "prompt-crafts.json";
var MAX3 = 100;
var CAMERA_MARK = /镜头|景别|运镜|光|焦|camera|shot|lens|light|close-up|wide|cinematic|35mm|构图|atmosphere/i;
var PromptCraftStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join27(resolveOutputDir(this.outputDir), FILE4);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile17(this.filePath(), "utf8"));
      return Array.isArray(parsed.crafts) ? parsed.crafts : [];
    } catch {
      return [];
    }
  }
  async get(id) {
    return (await this.read()).find((item) => item.id === id);
  }
  async save(craft) {
    const crafts = await this.read();
    crafts.push(craft);
    await mkdir18(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile14(this.filePath(), JSON.stringify({ crafts: crafts.slice(-MAX3) }, null, 2), "utf8");
    return craft;
  }
};
function isThinPrompt(intent, prompt) {
  const body = prompt.trim();
  const seed = intent.trim();
  if (body.length < 80) return "\u6210\u7A3F\u592A\u77ED\uFF08<80 \u5B57\uFF09\u3002\u610F\u56FE\u4E0D\u662F\u63D0\u793A\u8BCD\uFF0C\u5FC5\u987B\u5199\u6210\u5E26\u666F\u522B/\u5149\u7EBF/\u955C\u5934/\u73AF\u5883\u7684\u5BFC\u6F14\u7A3F\u3002";
  if (seed !== "" && body === seed) return "\u6210\u7A3F\u4E0D\u80FD\u7B49\u4E8E\u7528\u6237\u539F\u53E5\u3002\u5148\u68C0\u7D22\u518D\u6539\u5199\u3002";
  if (seed !== "" && body.length < seed.length + 40 && !CAMERA_MARK.test(body)) {
    return "\u6210\u7A3F\u51E0\u4E4E\u6CA1\u5C55\u5F00\uFF0C\u4E14\u770B\u4E0D\u5230\u955C\u5934/\u5149\u7EBF/\u6784\u56FE\u8BED\u8A00\u3002";
  }
  if (!CAMERA_MARK.test(body)) return "\u6210\u7A3F\u7F3A\u5C11\u955C\u5934\u8BED\u8A00\uFF08\u666F\u522B/\u8FD0\u955C/\u5149\u7EBF/\u7126\u6BB5/atmosphere\uFF09\u3002";
  return void 0;
}
async function craftPrompt(input) {
  const intent = input.intent.trim();
  const prompt = input.prompt.trim();
  if (intent === "") return { ok: false, refused: true, next: "\u5148\u5199\u6E05\u7528\u6237\u610F\u56FE\uFF08\u753B\u5E03\u751F\u6210\u6761\u91CC\u7684\u90A3\u53E5\uFF09" };
  if (input.knowledgeRefs.length === 0 || input.skillNames.length === 0) {
    const [knowledge, skills] = await Promise.all([
      corpus.search(intent, 5).catch(() => []),
      skillIndex.search(intent, 5).catch(() => [])
    ]);
    return {
      ok: false,
      refused: true,
      next: "\u5148 directorx_knowledge_search \u2192 directorx_knowledge_read\uFF0C\u518D directorx_skill_search \u2192 directorx_skill_read\uFF0C\u5916\u90E8\u4E8B\u5B9E\u4E0D\u591F\u518D\u4E0A\u7F51\u3002\u8BFB\u5B8C\u628A refs/names \u4F20\u56DE\u6765\u3002",
      suggestedKnowledge: knowledge.map((hit) => ({ id: hit.id, title: hit.title })),
      suggestedSkills: skills.map((hit) => ({ name: hit.name, snippet: hit.snippet }))
    };
  }
  const ledger = new ResearchLedger(input.outputDir);
  const reads = await ledger.hasReads({ knowledge: input.knowledgeRefs, skills: input.skillNames });
  if (!reads.ok) {
    return {
      ok: false,
      refused: true,
      missing: reads.missing,
      next: "\u5F15\u7528\u7684\u6587\u7AE0/\u6280\u80FD\u5FC5\u987B\u5148\u7528 directorx_knowledge_read / directorx_skill_read \u8BFB\u8FC7\uFF08\u672C\u9879\u76EE 45 \u5206\u949F\u5185\uFF09\u3002\u4E0D\u8981\u53EA\u62A5 id\u3002"
    };
  }
  for (const ref of input.knowledgeRefs) {
    try {
      await corpus.readArticle(ref);
    } catch {
      return { ok: false, refused: true, next: `\u77E5\u8BC6\u5E93\u6CA1\u6709 "${ref}"\uFF0C\u5148 search \u518D\u7528\u8FD4\u56DE\u7684 id` };
    }
  }
  for (const name2 of input.skillNames) {
    try {
      await skillIndex.read(name2);
    } catch {
      return { ok: false, refused: true, next: `\u6CA1\u6709\u6280\u80FD "${name2}"\uFF0C\u5148 directorx_skill_search` };
    }
  }
  const thin = isThinPrompt(intent, prompt);
  if (thin !== void 0) return { ok: false, refused: true, next: thin };
  let assembled = prompt;
  let negative;
  if (input.shot !== void 0) {
    const built = buildShotPrompt({ ...input.shot, subject: input.shot.subject || intent });
    assembled = `${built.prompt}

${prompt}`;
    negative = built.negative;
  }
  const craft = {
    id: `craft-${Date.now().toString(36)}`,
    kind: input.kind,
    intent,
    prompt: assembled,
    ...negative !== void 0 ? { negative } : {},
    knowledgeRefs: input.knowledgeRefs,
    skillNames: input.skillNames,
    externalNotes: input.externalNotes.trim() || "corpus-sufficient",
    at: Date.now()
  };
  await new PromptCraftStore(input.outputDir).save(craft);
  return {
    ok: true,
    craftId: craft.id,
    prompt: craft.prompt,
    negative: craft.negative ?? null,
    knowledgeRefs: craft.knowledgeRefs,
    skillNames: craft.skillNames,
    next: "\u4E25\u683C/\u534F\u540C\uFF1Adirectorx_propose \u5E26 craftId\uFF1B\u751F\u6210\u5FC5\u987B\u5E26\u540C\u4E00\u4E2A craftId"
  };
}
async function requireCraft(outputDir, craftId) {
  if (craftId === void 0 || craftId.trim() === "") {
    return {
      ok: false,
      refused: true,
      reason: "\u751F\u6210\u5FC5\u987B\u5148\u51FA\u8C03\u7814\u6210\u7A3F",
      next: "directorx_knowledge_search/read + directorx_skill_search/read\uFF08\u5FC5\u8981\u65F6\u5916\u90E8\u8C03\u7814\uFF09\u2192 directorx_prompt_craft \u2192 \u518D generate/propose\u3002\u753B\u5E03\u4E0A\u7684\u77ED\u53E5\u53EA\u662F\u610F\u56FE\u3002"
    };
  }
  const craft = await new PromptCraftStore(outputDir).get(craftId.trim());
  if (craft === void 0) {
    return { ok: false, refused: true, reason: `craft "${craftId}" \u4E0D\u5B58\u5728`, next: "directorx_prompt_craft" };
  }
  return { ok: true, craft };
}

// src/generate-ready.ts
import { mkdir as mkdir19, readFile as readFile18, writeFile as writeFile15 } from "node:fs/promises";
import { join as join28 } from "node:path";
var FILE5 = "generate-ready.json";
var MAX4 = 80;
var FRESH_MS2 = 2 * 60 * 60 * 1e3;
var STRATEGIES = /* @__PURE__ */ new Set([
  "character-sheet",
  "scene-still",
  "keyframe",
  "t2i",
  "t2v",
  "i2v",
  "fl2v",
  "ref2v"
]);
var PERSON_LOCK = /同一人|同一张脸|人物一致|角色一致|定妆|女主|男主|主角(?!线)|人物设定/;
var PERSON_WORD = /人物|角色|女孩|男孩|女人|男人|士兵|将军|民夫|工人|侠客/;
var SCENE_HINT = /空镜|场景图|场景设定|建立镜头|establishing|scene.?still|场景参考/;
var KEYFRAME_HINT = /关键帧|keyframe|首帧静帧|尾帧静帧/;
var I2V_HINT = /图生视频|i2v|image.to.video|用这张|以这张|这张图动/;
var FL_HINT = /首尾帧|first.+last|尾帧|last.?frame|从.+过渡到|转场到/;
var SHEET_NODE = /设定|三视图|定妆|turnaround|sheet|角色卡/;
function parseStrategy(value) {
  return typeof value === "string" && STRATEGIES.has(value) ? value : void 0;
}
function hasPath(value) {
  return typeof value === "string" && value.trim() !== "";
}
function blob(input) {
  return `${input.intent}
${input.prompt}`;
}
function detectNamedCharacters(text, snapshot, extra = []) {
  const found = /* @__PURE__ */ new Set();
  for (const name2 of extra) {
    const trimmed = name2.trim();
    if (trimmed !== "") found.add(trimmed);
  }
  const catalog = [
    ...snapshot.characters.map((card) => card.name),
    ...snapshot.nodes.flatMap((node) => node.characters ?? [])
  ];
  for (const name2 of catalog) {
    const trimmed = name2.trim();
    if (trimmed.length >= 2 && text.includes(trimmed)) found.add(trimmed);
  }
  for (const node of snapshot.nodes) {
    if (!SHEET_NODE.test(node.label)) continue;
    const hit = node.label.replace(SHEET_NODE, " ").trim().split(/[\s·\-_/]+/).find((part) => part.length >= 2);
    if (hit !== void 0 && text.includes(hit)) found.add(hit);
  }
  return [...found];
}
function nodeById(snapshot, id) {
  if (id === void 0 || id === "") return void 0;
  return snapshot.nodes.find((node) => node.id === id);
}
function previousMedia(input) {
  const source = nodeById(input.snapshot, input.sourceId);
  if (source !== void 0 && (source.kind === "image" || source.kind === "video")) return source;
  const self = nodeById(input.snapshot, input.nodeId);
  if (self === void 0) return void 0;
  const inbound = input.snapshot.edges.find((edge) => edge.to === self.id);
  const from = inbound !== void 0 ? nodeById(input.snapshot, inbound.from) : void 0;
  if (from !== void 0 && (from.kind === "image" || from.kind === "video")) return from;
  return void 0;
}
function sheetHit(name2, snapshot) {
  return snapshot.nodes.find((node) => {
    if (!hasPath(node.path)) return false;
    const labeled = node.label.includes(name2);
    const tagged = (node.characters ?? []).includes(name2);
    return (SHEET_NODE.test(node.label) || tagged) && (labeled || tagged);
  });
}
function sceneHit(name2, snapshot) {
  return snapshot.nodes.find(
    (node) => node.kind === "image" && hasPath(node.path) && (node.label.includes(name2) || SCENE_HINT.test(node.label))
  );
}
function classifyGenerateStrategy(input) {
  const declared = parseStrategy(input.strategy);
  const text = blob(input);
  if (input.kind === "image") {
    if (declared === "character-sheet" || wantsCharacterSheet(text)) return "character-sheet";
    if (declared === "keyframe" || KEYFRAME_HINT.test(text)) return "keyframe";
    if (declared === "scene-still" || SCENE_HINT.test(text)) return "scene-still";
    return "t2i";
  }
  if (declared === "fl2v" || hasPath(input.firstFrame) && hasPath(input.lastFrame) || FL_HINT.test(text)) return "fl2v";
  if (declared === "t2v" || declared === "ref2v") return declared;
  const source = previousMedia(input);
  if (declared === "i2v" || hasPath(input.firstFrame) || I2V_HINT.test(text)) return "i2v";
  if (source?.kind === "image" && hasPath(source.path)) return "i2v";
  if (source?.kind === "video" && hasPath(source.path)) return "i2v";
  const names = detectNamedCharacters(text, input.snapshot, input.characters);
  if (names.length > 0 && snapshotHasCharacterRef(names, input.snapshot) && !hasPath(input.firstFrame)) return "ref2v";
  return "t2v";
}
function snapshotHasCharacterRef(names, snapshot) {
  return names.some((name2) => {
    const card = snapshot.characters.find((item) => item.name === name2);
    return card !== void 0 && hasPath(card.refPath) || sheetHit(name2, snapshot) !== void 0;
  });
}
function needsFor(strategy, names, input) {
  const needs = ["detailed-prompt"];
  if (strategy === "character-sheet" || strategy === "scene-still") return needs;
  if (strategy === "keyframe" && names.length > 0) needs.push("character-sheet");
  if (strategy === "t2i" && names.length > 0) needs.push("character-sheet");
  if (strategy === "t2v") {
    if (names.length > 0 || PERSON_LOCK.test(blob(input))) needs.push("character-sheet");
  }
  if (strategy === "ref2v") needs.push("character-sheet");
  if (strategy === "i2v") {
    needs.push("first-frame");
    if (names.length > 0) needs.push("character-sheet");
  }
  if (strategy === "fl2v") {
    needs.push("first-frame", "last-frame");
    if (names.length > 0) needs.push("character-sheet");
  }
  if ((input.scenes ?? []).length > 0) needs.push("scene-still");
  return [...new Set(needs)];
}
function waived(input, need) {
  return (input.waivers ?? []).includes(need);
}
function resolveNeed(need, input, names) {
  if (need === "detailed-prompt") {
    const thin = isThinPrompt(input.intent, input.prompt);
    if (thin !== void 0) return { need, ok: false, detail: thin };
    return { need, ok: true, detail: "\u6210\u7A3F\u6709\u955C\u5934\u8BED\u8A00\uFF0C\u4E0D\u662F\u7528\u6237\u539F\u53E5" };
  }
  if (need === "character-sheet") {
    if (names.length === 0) {
      if (PERSON_LOCK.test(blob(input)) || PERSON_WORD.test(blob(input))) {
        return { need, ok: false, detail: "\u63D0\u793A\u8BCD\u91CC\u6709\u4EBA\uFF0C\u4F46\u6CA1\u70B9\u540D\u8981\u9501\u8C01\u3002\u5148\u767B\u8BB0\u6216\u51FA\u8BBE\u5B9A\u56FE\u3002" };
      }
      return { need, ok: true, detail: "\u8FD9\u955C\u4E0D\u9501\u56FA\u5B9A\u4EBA\u7269" };
    }
    const hits = [];
    const missing = [];
    for (const name2 of names) {
      const card = input.snapshot.characters.find((item) => item.name === name2);
      const sheet = sheetHit(name2, input.snapshot);
      if (card !== void 0 && hasPath(card.refPath)) hits.push(`${name2}\u2190\u89D2\u8272\u5E93`);
      else if (sheet !== void 0) hits.push(`${name2}\u2190${sheet.id}`);
      else missing.push(name2);
    }
    if (missing.length === 0) return { need, ok: true, detail: hits.join("\uFF1B"), name: names.join("\u3001") };
    if (waived(input, need) && missing.every((name2) => input.snapshot.characters.every((card) => card.name !== name2))) {
      return { need, ok: true, detail: `\u7528\u6237\u786E\u8BA4\u672C\u955C\u4E0D\u9501 ${missing.join("\u3001")}` };
    }
    return { need, ok: false, detail: `\u7F3A\u8BBE\u5B9A\u56FE/\u89D2\u8272\u5361\uFF1A${missing.join("\u3001")}`, name: missing.join("\u3001") };
  }
  if (need === "scene-still") {
    const scenes = (input.scenes ?? []).map((name2) => name2.trim()).filter((name2) => name2 !== "");
    if (scenes.length === 0) return { need, ok: true, detail: "\u672A\u6307\u5B9A\u8981\u9501\u7684\u573A\u666F" };
    const missing = scenes.filter((name2) => sceneHit(name2, input.snapshot) === void 0 && !(input.referenceImages ?? []).some(hasPath));
    if (missing.length === 0) {
      const hit = sceneHit(scenes[0], input.snapshot);
      return { need, ok: true, detail: `\u573A\u666F\u53C2\u8003 ${scenes.join("\u3001")}`, path: hit?.path, name: scenes.join("\u3001") };
    }
    if (waived(input, need)) return { need, ok: true, detail: "\u7528\u6237\u786E\u8BA4\u5148\u4E0D\u9501\u573A\u666F" };
    return { need, ok: false, detail: `\u7F3A\u573A\u666F\u9759\u5E27\uFF1A${missing.join("\u3001")}`, name: missing.join("\u3001") };
  }
  if (need === "first-frame") {
    if (hasPath(input.firstFrame)) return { need, ok: true, detail: "\u5DF2\u63D0\u4F9B\u9996\u5E27", path: input.firstFrame };
    const source = previousMedia(input);
    if (source?.kind === "image" && hasPath(source.path)) {
      return { need, ok: true, detail: `\u7528\u8282\u70B9 ${source.id} \u5F53\u9996\u5E27`, path: source.path, name: source.id };
    }
    if (source?.kind === "video" && hasPath(source.path)) {
      return {
        need,
        ok: false,
        detail: `\u4E0A\u4E00\u955C ${source.id} \u662F\u89C6\u9891\uFF0C\u5148 directorx_extract_frames \u62BD\u672B\u5E27\u518D\u5F53\u9996\u5E27`,
        path: source.path,
        name: source.id
      };
    }
    const key = input.snapshot.nodes.find((node) => hasPath(node.path) && node.kind === "image" && KEYFRAME_HINT.test(node.label));
    if (key !== void 0) return { need, ok: true, detail: `\u7528\u5173\u952E\u5E27 ${key.id}`, path: key.path, name: key.id };
    if (waived(input, need) && input.strategy === "t2v") return { need, ok: true, detail: "\u7528\u6237\u786E\u8BA4\u7EAF\u6587\u751F\u3001\u4E0D\u9501\u9996\u5E27" };
    return { need, ok: false, detail: "\u89C6\u9891\u8981\u9996\u5E27\uFF08\u5173\u952E\u5E27\u3001\u4E0A\u4E00\u955C\u672B\u5E27\u6216\u5DF2\u6709\u9759\u5E27\uFF09" };
  }
  if (need === "last-frame") {
    if (hasPath(input.lastFrame)) return { need, ok: true, detail: "\u5DF2\u63D0\u4F9B\u5C3E\u5E27", path: input.lastFrame };
    if (waived(input, need)) return { need, ok: true, detail: "\u7528\u6237\u786E\u8BA4\u4E0D\u505A\u9996\u5C3E\u5E27" };
    return { need, ok: false, detail: "\u9996\u5C3E\u5E27\u7B56\u7565\u7F3A\u5C3E\u5E27\u9759\u5E27" };
  }
  if (need === "keyframe") {
    const key = input.snapshot.nodes.find((node) => hasPath(node.path) && KEYFRAME_HINT.test(node.label));
    if (key !== void 0) return { need, ok: true, detail: `\u5173\u952E\u5E27 ${key.id}`, path: key.path };
    if (hasPath(input.firstFrame)) return { need, ok: true, detail: "\u9996\u5E27\u53EF\u5F53\u5173\u952E\u5E27", path: input.firstFrame };
    return { need, ok: false, detail: "\u590D\u6742\u52A8\u4F5C\u7F3A\u5173\u952E\u5E27\u9759\u5E27" };
  }
  return { need, ok: false, detail: `\u672A\u77E5\u9700\u6C42 ${need}` };
}
function buildAsk(report) {
  const cards = [];
  const missingNeeds = new Set(report.missing.map((item) => item.need));
  if (report.input.kind === "video" && (missingNeeds.has("first-frame") || missingNeeds.has("character-sheet") || report.strategy === "t2v")) {
    cards.push({
      id: "strategy",
      header: "\u8FD9\u6BB5\u89C6\u9891\u600E\u4E48\u751F\u6210",
      question: "\u4FE1\u606F\u548C\u53C2\u8003\u8FD8\u4E0D\u591F\u3002\u9009\u4E00\u6761\u8DEF\uFF0C\u7F3A\u7684\u8D44\u4EA7\u5148\u8865\u518D\u751F\u6210\u3002",
      recommended: missingNeeds.has("character-sheet") ? "\u5148\u51FA\u4EBA\u7269\u8BBE\u5B9A\u56FE\uFF0C\u518D\u56FE\u751F\u89C6\u9891" : "\u62BD\u4E0A\u4E00\u955C\u672B\u5E27\u505A\u9996\u5E27",
      options: [
        { label: "\u5148\u51FA\u4EBA\u7269\u8BBE\u5B9A\u56FE\uFF0C\u518D\u56FE\u751F\u89C6\u9891", description: "\u9501\u957F\u76F8\uFF1A16:9 \u8BBE\u5B9A\u8868 \u2192 \u5173\u952E\u5E27 \u2192 \u56FE\u751F\u89C6\u9891" },
        { label: "\u62BD\u4E0A\u4E00\u955C\u672B\u5E27\u505A\u9996\u5E27", description: "\u627F\u63A5\u4E0A\u4E00\u955C\uFF0Cextract_frames \u540E i2v" },
        { label: "\u5148\u51FA\u672C\u955C\u5173\u952E\u5E27\uFF0C\u518D\u56FE\u751F\u89C6\u9891", description: "\u672C\u955C\u5148\u9759\u5E27\uFF0C\u518D\u8BA9\u5B83\u52A8" },
        { label: "\u9996\u5C3E\u5E27\u8FC7\u6E21", description: "\u5DF2\u6709\u6216\u5148\u505A\u4E24\u5F20\u9759\u5E27" },
        { label: "\u7528\u5DF2\u767B\u8BB0\u89D2\u8272\u53C2\u8003\u751F\u89C6\u9891", description: "\u6709\u89D2\u8272\u5361\u3001\u4E0D\u5FC5\u9501\u67D0\u4E00\u5E27" },
        ...report.namedCharacters.some((name2) => report.input.snapshot.characters.some((card) => card.name === name2)) ? [] : [{ label: "\u7EAF\u6587\u751F\u89C6\u9891\uFF0C\u4E0D\u9501\u957F\u76F8", description: "\u6CA1\u6709\u8981\u8BA4\u7684\u4EBA/\u573A\u666F\u624D\u9009" }]
      ]
    });
  }
  if (missingNeeds.has("character-sheet")) {
    const who = report.missing.find((item) => item.need === "character-sheet")?.name ?? "\u4EBA\u7269";
    cards.push({
      id: "cast",
      header: "\u4EBA\u7269\u53C2\u8003",
      question: `${who} \u7528\u54EA\u5F20\u8BBE\u5B9A\u56FE\uFF1F\u6CA1\u6709\u5C31\u5148\u751F\u6210\u8BBE\u5B9A\u8868\u3002`,
      recommended: "\u5148\u6309 novel-characters \u51FA 16:9 \u8BBE\u5B9A\u8868",
      options: [
        { label: "\u5148\u6309 novel-characters \u51FA 16:9 \u8BBE\u5B9A\u8868", description: "\u5DE6\u680F\u534A\u8EAB\u57FA\u51C6 + \u53F3\u680F\u6B63\u4FA7\u80CC" },
        { label: "\u4F7F\u7528\u753B\u5E03\u4E0A\u5DF2\u6709\u8BBE\u5B9A/\u5B9A\u5986\u8282\u70B9", description: "directorx_character_register \u6302\u4E0A" },
        { label: "\u8FD9\u955C\u4E0D\u51FA\u73B0\u56FA\u5B9A\u89D2\u8272", description: "\u7FA4\u50CF/\u80CC\u5F71/\u7A7A\u955C\u624D\u9009" }
      ]
    });
  }
  if (missingNeeds.has("last-frame")) {
    cards.push({
      id: "tail",
      header: "\u5C3E\u5E27",
      question: "\u9996\u5C3E\u5E27\u8FD8\u7F3A\u5C3E\u5E27\u3002",
      recommended: "\u5148\u51FA\u5C3E\u5E27\u9759\u5E27",
      options: [
        { label: "\u5148\u51FA\u5C3E\u5E27\u9759\u5E27", description: "\u518D fl2v" },
        { label: "\u6539\u6210\u53EA\u9501\u9996\u5E27\u7684\u56FE\u751F\u89C6\u9891", description: "\u4E0D\u505A\u5C3E\u5E27" }
      ]
    });
  }
  return cards.slice(0, 6);
}
function buildNext(report) {
  const next = [];
  for (const item of report.missing) {
    if (item.need === "detailed-prompt") next.push("\u56DE\u5230 directorx_prompt_craft\uFF0C\u628A\u666F\u522B/\u8FD0\u955C/\u5149/\u73AF\u5883\u5199\u8FDB\u6210\u7A3F");
    if (item.need === "character-sheet") {
      next.push("directorx_skill_read novel-characters");
      next.push("\u5148 directorx_generate_ready strategy=character-sheet \u518D generate_image \u51FA\u8BBE\u5B9A\u8868");
      next.push("\u51FA\u56FE\u540E directorx_character_register");
    }
    if (item.need === "first-frame" && item.path !== void 0 && item.detail.includes("extract_frames")) {
      next.push(`directorx_extract_frames source=${item.path}\uFF08\u53D6\u672B\u5E27\uFF09`);
    } else if (item.need === "first-frame") {
      next.push("\u5148 generate_image strategy=keyframe \u51FA\u672C\u955C\u9996\u5E27\uFF0C\u6216\u6307\u5B9A firstFrame");
    }
    if (item.need === "last-frame") next.push("\u5148 generate_image \u51FA\u5C3E\u5E27\u9759\u5E27\uFF0C\u518D ready strategy=fl2v");
    if (item.need === "scene-still") next.push("\u5148 generate_image strategy=scene-still \u51FA\u573A\u666F\u7A7A\u955C");
    if (item.need === "keyframe") next.push("\u5148 generate_image strategy=keyframe");
  }
  if (report.verdict === "ready") {
    next.push("\u4E25\u683C/\u534F\u540C\uFF1Adirectorx_propose \u5E26 craftId+readyId\uFF1B\u751F\u6210\u5FC5\u987B\u5E26\u540C\u4E00\u4E2A readyId");
  } else {
    next.push("\u7528\u63D0\u95EE\u5361 directorx_ask \u8BA9\u7528\u6237\u9009\u8DEF\uFF0C\u8865\u8D44\u4EA7\u540E\u518D directorx_generate_ready commit:true");
  }
  return [...new Set(next)];
}
function collectBind(input, strategy, present, names) {
  const first = present.find((item) => item.need === "first-frame")?.path ?? (hasPath(input.firstFrame) ? input.firstFrame : void 0);
  const last = present.find((item) => item.need === "last-frame")?.path ?? (hasPath(input.lastFrame) ? input.lastFrame : void 0);
  const sceneRefs = (input.scenes ?? []).map((name2) => sceneHit(name2, input.snapshot)?.path).filter((path) => hasPath(path));
  const sheets = names.map((name2) => input.snapshot.characters.find((card) => card.name === name2)?.refPath ?? sheetHit(name2, input.snapshot)?.path).filter((path) => hasPath(path));
  const referenceImages = [.../* @__PURE__ */ new Set([
    ...(input.referenceImages ?? []).filter(hasPath),
    ...sheets,
    ...sceneRefs
  ])];
  return {
    strategy,
    characters: names,
    ...first !== void 0 ? { firstFrame: first } : {},
    ...last !== void 0 ? { lastFrame: last } : {},
    sceneRefs,
    referenceImages
  };
}
function assessGenerateReady(input) {
  const strategy = classifyGenerateStrategy(input);
  const namedCharacters = detectNamedCharacters(blob(input), input.snapshot, input.characters);
  const needs = needsFor(strategy, namedCharacters, input);
  const items = needs.map((need) => resolveNeed(need, input, namedCharacters));
  const present = items.filter((item) => item.ok);
  const missing = items.filter((item) => !item.ok);
  const bind = collectBind(input, strategy, present, namedCharacters);
  const draft = {
    verdict: missing.length === 0 ? "ready" : "blocked",
    strategy,
    needs,
    present,
    missing,
    namedCharacters,
    bind,
    next: [],
    ask: [],
    reason: missing.length === 0 ? `${strategy} \u53C2\u8003\u9F50\uFF0C\u53EF\u4EE5\u751F\u6210` : `\u8FD8\u4E0D\u80FD\u751F\u6210\uFF1A${missing.map((item) => item.detail).join("\uFF1B")}`
  };
  draft.ask = draft.verdict === "blocked" ? buildAsk({ ...draft, input }) : [];
  draft.next = buildNext(draft);
  return draft;
}
var GenerateReadyStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join28(resolveOutputDir(this.outputDir), FILE5);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile18(this.filePath(), "utf8"));
      return Array.isArray(parsed.briefs) ? parsed.briefs : [];
    } catch {
      return [];
    }
  }
  async get(id) {
    return (await this.read()).find((item) => item.id === id);
  }
  async save(brief2) {
    const briefs = await this.read();
    briefs.push(brief2);
    await mkdir19(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile15(this.filePath(), JSON.stringify({ briefs: briefs.slice(-MAX4) }, null, 2), "utf8");
    return brief2;
  }
};
async function commitGenerateReady(input) {
  const report = assessGenerateReady(input);
  if (report.verdict !== "ready") {
    return { ok: false, refused: true, ...report };
  }
  const brief2 = {
    id: `ready-${Date.now().toString(36)}`,
    craftId: input.craftId,
    kind: input.kind,
    strategy: report.strategy,
    intent: input.intent,
    prompt: input.prompt,
    bind: report.bind,
    at: Date.now()
  };
  await new GenerateReadyStore(input.outputDir).save(brief2);
  return {
    ok: true,
    readyId: brief2.id,
    ...report,
    next: ["\u4E25\u683C/\u534F\u540C\uFF1Adirectorx_propose \u5E26 craftId+readyId", "generate_* / canvas_continue \u5FC5\u987B\u5E26\u540C\u4E00\u4E2A readyId"]
  };
}
async function requireReady(outputDir, readyId, expected) {
  if (readyId === void 0 || readyId.trim() === "") {
    return {
      ok: false,
      refused: true,
      reason: "\u751F\u6210\u524D\u5FC5\u987B\u5148\u8FC7\u53C2\u8003\u9F50\u5907\u95F8",
      next: "directorx_generate_ready\uFF08\u9009\u5B9A\u8BBE\u5B9A\u56FE/\u573A\u666F/\u9996\u5C3E\u5E27/\u56FE\u751F\u7B56\u7565\uFF09\u3002\u7F3A\u4EC0\u4E48\u5148\u8865\uFF0C\u518D\u5E26 readyId \u751F\u6210\u3002"
    };
  }
  const brief2 = await new GenerateReadyStore(outputDir).get(readyId.trim());
  if (brief2 === void 0) {
    return { ok: false, refused: true, reason: `ready "${readyId}" \u4E0D\u5B58\u5728`, next: "directorx_generate_ready commit:true" };
  }
  if (Date.now() - brief2.at > FRESH_MS2) {
    return { ok: false, refused: true, reason: "\u5C31\u7EEA\u5355\u8FC7\u671F", next: "\u91CD\u65B0 directorx_generate_ready" };
  }
  if (expected?.craftId !== void 0 && expected.craftId !== "" && brief2.craftId !== expected.craftId) {
    return { ok: false, refused: true, reason: "readyId \u4E0E craftId \u4E0D\u662F\u4E00\u5BF9", next: "\u7528\u8FD9\u5BF9\u6210\u7A3F\u91CD\u65B0 generate_ready" };
  }
  if (expected?.kind !== void 0 && brief2.kind !== expected.kind) {
    return { ok: false, refused: true, reason: `ready \u662F ${brief2.kind}\uFF0C\u8FD9\u6B21\u8981 ${expected.kind}`, next: "\u6309\u6B63\u786E kind \u91CD\u65B0 ready" };
  }
  return { ok: true, brief: brief2 };
}
async function loadReadySnapshot(outputDir) {
  const [characters, doc] = await Promise.all([
    new CharacterStore(outputDir).list(),
    new DirectorxCanvasStore(outputDir).read()
  ]);
  return {
    characters: characters.map((card) => ({
      name: card.name,
      refPath: card.refPath,
      ...card.description !== void 0 ? { description: card.description } : {}
    })),
    nodes: doc.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      ...hasPath(node.path) ? { path: node.path } : {},
      ...node.characters !== void 0 && node.characters.length > 0 ? { characters: node.characters } : {},
      ...node.shotIndex !== void 0 ? { shotIndex: node.shotIndex } : {},
      ...node.prompt !== void 0 ? { prompt: node.prompt } : {}
    })),
    edges: doc.edges.map((edge) => ({ from: edge.from, to: edge.to }))
  };
}
function mergeReadyBind(brief2, args) {
  const extraChars = Array.isArray(args.characters) ? args.characters.map(String) : [];
  const extraRefs = Array.isArray(args.reference_image_paths) ? args.reference_image_paths.map(String) : [];
  const first = typeof args.first_frame_path === "string" && args.first_frame_path !== "" ? args.first_frame_path : brief2.bind.firstFrame;
  const last = typeof args.last_frame_path === "string" && args.last_frame_path !== "" ? args.last_frame_path : brief2.bind.lastFrame;
  return {
    characters: [.../* @__PURE__ */ new Set([...brief2.bind.characters, ...extraChars])],
    ...first !== void 0 ? { firstFrame: first } : {},
    ...last !== void 0 ? { lastFrame: last } : {},
    referenceImages: [.../* @__PURE__ */ new Set([...brief2.bind.referenceImages, ...extraRefs])]
  };
}

// src/ask.ts
function normalizeAskQuestions(raw) {
  if (Array.isArray(raw)) {
    return raw.flatMap((item, index) => normalizeOne(item, index)).slice(0, 6);
  }
  if (raw !== null && typeof raw === "object") {
    const record = raw;
    if (Array.isArray(record.questions)) return normalizeAskQuestions(record.questions);
    return normalizeOne(record, 0);
  }
  return [];
}
function normalizeOne(raw, index) {
  if (raw === null || typeof raw !== "object") return [];
  const record = raw;
  const question = typeof record.question === "string" ? record.question.trim() : "";
  if (question === "") return [];
  const optionsRaw = Array.isArray(record.options) ? record.options : [];
  const options = optionsRaw.flatMap((item) => {
    if (typeof item === "string" && item.trim() !== "") return [{ label: item.trim() }];
    if (item !== null && typeof item === "object") {
      const option = item;
      const label = typeof option.label === "string" ? option.label.trim() : "";
      if (label === "") return [];
      return [{
        label,
        ...typeof option.description === "string" && option.description !== "" ? { description: option.description } : {}
      }];
    }
    return [];
  }).slice(0, 8);
  const recommended = typeof record.recommended === "string" ? record.recommended.trim() : "";
  if (recommended !== "" && !options.some((item) => item.label === recommended) && options.length < 8) {
    options.unshift({ label: recommended, description: "\u63A8\u8350\u9ED8\u8BA4" });
  }
  return [{
    id: typeof record.id === "string" && record.id.trim() !== "" ? record.id.trim() : `q${index + 1}`,
    question,
    ...typeof record.header === "string" ? { header: record.header } : {},
    ...typeof record.detail === "string" ? { detail: record.detail } : {},
    ...options.length > 0 ? { options } : {},
    ...record.multiSelect === true ? { multiSelect: true } : {}
  }];
}
async function presentAsk(input) {
  if (input.questions.length === 0) throw new Error("directorx_ask \u9700\u8981\u81F3\u5C11\u4E00\u9053 question");
  const asked = await input.ask({
    questions: input.questions,
    ...input.agent === void 0 ? {} : { agent: input.agent },
    ...input.signal === void 0 ? {} : { signal: input.signal }
  });
  return { answers: asked.answers, questions: input.questions };
}

// src/stage.ts
import { mkdir as mkdir20, readFile as readFile19, writeFile as writeFile16 } from "node:fs/promises";
import { join as join29 } from "node:path";
var STAGE_IDS = [
  "brief",
  "research",
  "forks",
  "script",
  "cast",
  "storyboard",
  "place",
  "generate",
  "assemble",
  "qa",
  "deliver"
];
var LABELS = {
  brief: "\u5206\u8BCA",
  research: "\u8C03\u7814",
  forks: "\u5206\u53C9\u786E\u8BA4",
  script: "\u5267\u672C/\u5927\u7EB2",
  cast: "\u89D2\u8272\u951A\u70B9",
  storyboard: "\u5206\u955C",
  place: "\u5360\u4F4D\u7B7E\u5B57",
  generate: "\u751F\u6210",
  assemble: "\u526A\u8F91\u6210\u7247",
  qa: "\u8D28\u68C0",
  deliver: "\u4EA4\u4ED8"
};
function emptyDoc(title = "") {
  return {
    title,
    current: "brief",
    entries: STAGE_IDS.map((id) => ({
      id,
      label: LABELS[id],
      status: id === "brief" ? "active" : "pending",
      artifacts: []
    })),
    updatedAt: Date.now()
  };
}
var ProductionStageStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join29(resolveOutputDir(this.outputDir), "stage.json");
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile19(this.filePath(), "utf8"));
      if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) return emptyDoc(parsed.title);
      return parsed;
    } catch {
      return emptyDoc();
    }
  }
  async write(doc) {
    doc.updatedAt = Date.now();
    await mkdir20(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile16(this.filePath(), JSON.stringify(doc, null, 2), "utf8");
    return doc;
  }
  async get() {
    const doc = await this.read();
    const index = STAGE_IDS.indexOf(doc.current);
    const next = index >= 0 && index < STAGE_IDS.length - 1 ? STAGE_IDS[index + 1] : void 0;
    return {
      ...doc,
      next,
      gate: {
        id: "stage",
        header: `\u9636\u6BB5 \xB7 ${LABELS[doc.current]}`,
        question: next ? `\u5F53\u524D\u9636\u6BB5\u300C${LABELS[doc.current]}\u300D\u5B8C\u6210\u4E86\u5417\uFF1F\u4E0B\u4E00\u6B65\u662F\u300C${LABELS[next]}\u300D\u3002` : "\u5DF2\u5230\u4EA4\u4ED8\u3002\u786E\u8BA4\u6210\u7247\u53EF\u4EE5\u4EA4\u51FA\u53BB\uFF1F",
        options: next ? [
          { label: `\u8FDB\u5165 ${LABELS[next]}`, description: "\u4E0A\u6E38\u4EA7\u7269\u5DF2\u5728\u76D8\u4E0A" },
          { label: "\u8FD8\u505C\u5728\u672C\u9636\u6BB5", description: "\u4EA7\u7269\u672A\u9F50\uFF0C\u7EE7\u7EED\u8865" },
          { label: "\u8DF3\u8FC7\u672C\u9636\u6BB5", description: "\u672C\u7247\u4E0D\u9700\u8981\u8FD9\u4E00\u6B65" }
        ] : [
          { label: "\u4EA4\u4ED8", description: "\u8D28\u68C0\u5DF2\u8FC7\uFF0C\u53EF\u4EE5\u4EA4\u7247" },
          { label: "\u8FD8\u505C\u5728\u672C\u9636\u6BB5", description: "\u518D\u6539\u4E00\u7248" }
        ]
      }
    };
  }
  async record(input) {
    const doc = await this.read();
    const id = input.stage ?? doc.current;
    const entry = doc.entries.find((item) => item.id === id);
    if (entry === void 0) throw new Error(`unknown stage ${id}`);
    entry.artifacts.push({
      kind: input.kind.trim() || "note",
      ...input.path !== void 0 && input.path !== "" ? { path: input.path } : {},
      ...input.note !== void 0 && input.note !== "" ? { note: input.note.slice(0, 500) } : {},
      at: Date.now()
    });
    entry.updatedAt = Date.now();
    if (entry.status === "pending") entry.status = "active";
    doc.current = id;
    return this.write(doc);
  }
  async advance(to, mode = "done") {
    if (!STAGE_IDS.includes(to)) throw new Error(`unknown stage ${to}`);
    const doc = await this.read();
    const current = doc.entries.find((item) => item.id === doc.current);
    if (current !== void 0) current.status = mode === "skip" ? "skipped" : "done";
    const target = doc.entries.find((item) => item.id === to);
    if (target !== void 0 && target.status !== "done") target.status = "active";
    doc.current = to;
    return this.write(doc);
  }
};
function parseStageId(value) {
  return typeof value === "string" && STAGE_IDS.includes(value) ? value : void 0;
}

// src/providers/adapter-store.ts
import { mkdir as mkdir21, readFile as readFile20, writeFile as writeFile17 } from "node:fs/promises";
import { join as join30 } from "node:path";
var MAX_ADAPTERS = 40;
var MAX_DOC_CHARS = 8e4;
var AdapterStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  catalogPath() {
    return join30(resolveOutputDir(this.outputDir), "adapters.json");
  }
  secretsPath() {
    return join30(resolveOutputDir(this.outputDir), "adapters.secrets.json");
  }
  docPath(id) {
    return join30(resolveOutputDir(this.outputDir), "adapters", `${id}.doc.txt`);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile20(this.catalogPath(), "utf8"));
      const adapters = Array.isArray(parsed.adapters) ? parsed.adapters : [];
      return { version: 1, adapters };
    } catch {
      return { version: 1, adapters: [] };
    }
  }
  async list() {
    return (await this.read()).adapters;
  }
  async get(id) {
    return (await this.read()).adapters.find((item) => item.spec.id === id);
  }
  async findByModel(capability2, model) {
    const wanted = model.trim();
    if (wanted === "") return void 0;
    return (await this.read()).adapters.find((item) => item.spec.capability === capability2 && item.spec.model === wanted);
  }
  async readDoc(id) {
    try {
      return await readFile20(this.docPath(id), "utf8");
    } catch {
      return "";
    }
  }
  async readSecrets() {
    try {
      const parsed = JSON.parse(await readFile20(this.secretsPath(), "utf8"));
      return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  async secretOf(id) {
    return (await this.readSecrets())[id] ?? {};
  }
  async writeSecret(id, secret) {
    const all = await this.readSecrets();
    const prev = all[id] ?? {};
    all[id] = {
      ...prev,
      ...secret.apiKey !== void 0 && secret.apiKey !== "" ? { apiKey: secret.apiKey } : {},
      ...secret.klingAk !== void 0 && secret.klingAk !== "" ? { klingAk: secret.klingAk } : {},
      ...secret.klingSk !== void 0 && secret.klingSk !== "" ? { klingSk: secret.klingSk } : {}
    };
    await mkdir21(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile17(this.secretsPath(), JSON.stringify(all), "utf8");
  }
  async hasSecret(id) {
    const secret = await this.secretOf(id);
    return Boolean(secret.apiKey || secret.klingAk && secret.klingSk);
  }
  async writeCatalog(file) {
    await mkdir21(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile17(this.catalogPath(), JSON.stringify(file, null, 2), "utf8");
  }
  async upsert(record) {
    const file = await this.read();
    const index = file.adapters.findIndex((item) => item.spec.id === record.spec.id);
    if (index >= 0) file.adapters[index] = record;
    else {
      file.adapters.push(record);
      if (file.adapters.length > MAX_ADAPTERS) file.adapters.shift();
    }
    await this.writeCatalog(file);
    return record;
  }
  async saveDoc(id, text) {
    const clipped = text.slice(0, MAX_DOC_CHARS);
    await mkdir21(join30(resolveOutputDir(this.outputDir), "adapters"), { recursive: true });
    await writeFile17(this.docPath(id), clipped, "utf8");
    return clipped.length;
  }
  async putSpec(id, spec, status) {
    const existing = await this.get(id);
    const record = {
      spec,
      status,
      ingest: existing?.ingest ?? { docSource: "", docChars: 0, at: Date.now() },
      smoke: existing?.smoke,
      updatedAt: Date.now()
    };
    return this.upsert(record);
  }
};
function publicRecord(record, hasKey) {
  return {
    id: record.spec.id,
    capability: record.spec.capability,
    model: record.spec.model,
    mode: record.spec.mode,
    displayName: record.spec.displayName,
    baseURL: record.spec.baseURL,
    status: record.status,
    hasKey,
    caps: record.spec.caps,
    smoke: record.smoke,
    updatedAt: record.updatedAt
  };
}

// src/providers/provider-onboard.ts
var MAX_FETCH_BYTES = 4e5;
async function ingestProvider(input) {
  const model = input.model.trim();
  if (model === "") throw new Error("model \u5FC5\u586B");
  const id = adapterIdFor(input.capability, model);
  const store = new AdapterStore(input.outputDir);
  let doc = (input.apiDoc ?? "").trim();
  let docSource = "pasted";
  if ((input.apiDocUrl ?? "").trim() !== "") {
    const url = input.apiDocUrl.trim();
    if (!/^https?:\/\//i.test(url)) throw new Error("apiDocUrl \u5FC5\u987B\u662F http(s)");
    const fetched = await fetch(url, { signal: AbortSignal.timeout(15e3), headers: { accept: "text/plain, text/markdown, application/json, text/html" } });
    if (!fetched.ok) throw new Error(`\u62C9\u53D6\u6587\u6863\u5931\u8D25 HTTP ${fetched.status}`);
    const text = await fetched.text();
    if (text.length > MAX_FETCH_BYTES) throw new Error(`\u6587\u6863\u8D85\u8FC7 ${MAX_FETCH_BYTES} \u5B57\u8282\uFF0C\u8BF7\u7C98\u8D34\u5173\u952E\u7AE0\u8282`);
    doc = text;
    docSource = url;
  }
  if (doc === "") throw new Error("\u9700\u8981 apiDoc \u6587\u672C\u6216 apiDocUrl");
  const chars = await store.saveDoc(id, doc);
  const existing = await store.get(id);
  const stub = existing?.spec ?? {
    id,
    capability: input.capability,
    displayName: input.displayName?.trim() || model,
    model,
    mode: "generic-rest",
    baseURL: (input.baseURL ?? "").trim(),
    auth: { kind: "bearer" },
    caps: { aspectRatios: ["16:9", "9:16", "1:1"], firstFrame: false, lastFrame: false, audio: false, multiRef: false }
  };
  if ((input.baseURL ?? "").trim() !== "") stub.baseURL = input.baseURL.trim();
  stub.model = model;
  stub.capability = input.capability;
  await store.upsert({
    spec: stub,
    status: existing?.status === "active" ? existing.status : "ingested",
    ingest: { docSource, docChars: chars, at: Date.now() },
    smoke: existing?.smoke,
    updatedAt: Date.now()
  });
  if ((input.apiKey ?? "").trim() !== "") await store.writeSecret(id, { apiKey: input.apiKey.trim() });
  const excerpt = doc.slice(0, 800);
  return {
    id,
    model,
    capability: input.capability,
    docSource,
    docChars: chars,
    excerpt,
    apiKeySet: Boolean((input.apiKey ?? "").trim()) || await store.hasSecret(id),
    next: "directorx_provider_classify"
  };
}
async function classifyProvider(outputDir, id) {
  const store = new AdapterStore(outputDir);
  const record = await store.get(id);
  if (record === void 0) throw new Error(`\u672A\u627E\u5230\u5165\u9A7B ${id}\uFF0C\u5148 directorx_provider_ingest`);
  const doc = await store.readDoc(id);
  const classified = classifyProviderDoc(doc, `${record.spec.model} ${record.spec.baseURL}`);
  if (record.spec.baseURL === "" && classified.family === "A") {
  }
  const nextSpec = { ...record.spec, mode: classified.mode };
  if (classified.hints.authKind !== void 0) nextSpec.auth = { ...nextSpec.auth, kind: classified.hints.authKind };
  await store.upsert({ ...record, spec: nextSpec, updatedAt: Date.now() });
  return {
    id,
    ...classified,
    model: record.spec.model,
    capability: record.spec.capability,
    next: "directorx_provider_draft",
    note: classified.family === "A" ? "\u5DF2\u6709\u534F\u8BAE\uFF1Adraft \u53EA\u9700\u8865 baseURL / caps\uFF0C\u4E0D\u5FC5\u586B create/poll\u3002" : "\u65B0\u534F\u8BAE\uFF1Adraft \u5FC5\u987B\u586B create.body \u6620\u5C04\uFF0C\u4EE5\u53CA poll \u6216 syncResult\u3002\u5B57\u6BB5\u8DEF\u5F84\u5FC5\u987B\u80FD\u5728\u7528\u6237\u6587\u6863\u91CC\u627E\u5230\u3002"
  };
}
async function draftProvider(outputDir, id, specPatch) {
  const store = new AdapterStore(outputDir);
  const record = await store.get(id);
  if (record === void 0) throw new Error(`\u672A\u627E\u5230\u5165\u9A7B ${id}`);
  const merged = {
    ...record.spec,
    ...specPatch,
    id,
    model: typeof specPatch.model === "string" && specPatch.model.trim() !== "" ? specPatch.model.trim() : record.spec.model,
    capability: record.spec.capability,
    auth: specPatch.auth !== void 0 && typeof specPatch.auth === "object" ? { ...record.spec.auth, ...specPatch.auth } : record.spec.auth,
    caps: specPatch.caps !== void 0 && typeof specPatch.caps === "object" ? { ...record.spec.caps, ...specPatch.caps } : record.spec.caps
  };
  const parsed = parseAdapterSpec(merged);
  if (parsed.spec === void 0) {
    return {
      id,
      ok: false,
      issues: parsed.issues,
      next: "directorx_provider_draft",
      hint: "\u53EA\u586B AdapterSpec \u5DF2\u6709\u952E\u3002\u8DEF\u5F84\u5FC5\u987B\u80FD\u5F15\u7528\u7528\u6237\u6587\u6863\u539F\u6587\u3002\u4E0D\u8981\u5199\u4EE3\u7801\u3002"
    };
  }
  await store.putSpec(id, parsed.spec, "draft");
  return {
    id,
    ok: true,
    spec: parsed.spec,
    family: parsed.spec.mode === "generic-rest" ? "B" : "A",
    next: "directorx_confirm \u540E directorx_provider_smoke"
  };
}
function contractSmoke(spec, fixtures) {
  const issues = [];
  if (spec.mode !== "generic-rest") return { ok: true, issues };
  if (spec.create === void 0) {
    issues.push("\u7F3A\u5C11 create");
    return { ok: false, issues };
  }
  try {
    buildBody(spec.create.body, { prompt: "smoke", text: "smoke", model: spec.model, seconds: 4 });
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }
  if (spec.poll !== void 0 && fixtures.create !== void 0) {
    const taskId = readPath(fixtures.create, spec.poll.taskId);
    if (taskId === void 0 || taskId === "") issues.push(`create fixture \u5BF9\u4E0D\u4E0A poll.taskId=${spec.poll.taskId}`);
  }
  if (spec.poll !== void 0 && fixtures.poll !== void 0) {
    const status = readPath(fixtures.poll, spec.poll.status);
    if (status === void 0) issues.push(`poll fixture \u5BF9\u4E0D\u4E0A poll.status=${spec.poll.status}`);
    const urls = readPath(fixtures.poll, spec.poll.resultUrls);
    if (urls === void 0) issues.push(`poll fixture \u5BF9\u4E0D\u4E0A poll.resultUrls=${spec.poll.resultUrls}`);
  }
  if (spec.syncResult !== void 0 && fixtures.create !== void 0) {
    if (spec.syncResult.urls !== void 0 && readPath(fixtures.create, spec.syncResult.urls) === void 0) {
      issues.push(`create fixture \u5BF9\u4E0D\u4E0A syncResult.urls=${spec.syncResult.urls}`);
    }
  }
  return { ok: issues.length === 0, issues };
}
async function probeAdapter(spec, apiKey) {
  if (spec.auth.kind === "kling-jwt") return { ok: apiKey !== "", message: "kling-jwt \u63A2\u6D3B\u7559\u7ED9 kling \u6A21\u5F0F" };
  if (spec.smoke?.probe === "auth-only") return { ok: apiKey !== "" || /localhost|127\.0\.0\.1/.test(spec.baseURL), message: apiKey !== "" ? "\u5DF2\u914D\u7F6E Key" : "\u672A\u914D\u7F6E Key" };
  if (spec.baseURL.trim() === "") return { ok: false, message: "baseURL \u4E3A\u7A7A" };
  const url = `${spec.baseURL.replace(/\/+$/, "")}/models`;
  try {
    const response = await fetch(url, {
      headers: authHeaders(spec, apiKey),
      signal: AbortSignal.timeout(12e3)
    });
    if (response.status === 200) return { ok: true, message: "GET /models 200" };
    if (response.status === 404) return { ok: true, message: "\u9274\u6743\u53EF\u53D1\u51FA\uFF08/models 404\uFF0C\u5E38\u89C1\u4E8E\u65E0\u5217\u8868\u63A5\u53E3\uFF09" };
    if (response.status === 401 || response.status === 403) return { ok: false, message: `HTTP ${response.status} \u9274\u6743\u88AB\u62D2` };
    return { ok: false, message: `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}
async function smokeProvider(input) {
  const store = new AdapterStore(input.settings.outputDir);
  const record = await store.get(input.id);
  if (record === void 0) throw new Error(`\u672A\u627E\u5230\u5165\u9A7B ${input.id}`);
  const spec = record.spec;
  const secret = await store.secretOf(input.id);
  const apiKey = secret.apiKey ?? input.settings[spec.capability].apiKey;
  const contract = contractSmoke(spec, { create: input.createFixture, poll: input.pollFixture });
  const probe = await probeAdapter(spec, apiKey);
  let live;
  if (input.live === true) {
    if (spec.mode === "generic-rest") {
      try {
        const ctx = {
          settings: input.settings,
          capability: { ...input.settings[spec.capability], mode: "generic-rest", model: spec.model, baseURL: spec.baseURL, apiKey },
          signal: AbortSignal.timeout(Math.max(input.settings.timeoutMs, 3e4))
        };
        const result = await genericGenerate(ctx, spec, {
          prompt: "DirectorX adapter smoke",
          seconds: spec.smoke?.cheapest?.seconds ?? 4,
          size: spec.smoke?.cheapest?.size
        });
        live = { ok: result.files.length > 0, message: "\u6700\u77ED\u771F\u8C03\u7528\u6210\u529F", files: result.files };
      } catch (error) {
        live = { ok: false, message: error instanceof Error ? error.message : String(error) };
      }
    } else {
      live = { ok: probe.ok, message: "A \u7C7B\u534F\u8BAE\u6CBF\u7528\u63A2\u6D3B\uFF0C\u672A\u53E6\u6253\u4ED8\u8D39\u751F\u6210\u3002\u786E\u8BA4\u540E\u5373\u53EF commit\u3002" };
    }
  }
  const smoked = contract.ok && probe.ok && (input.live !== true || live?.ok === true);
  await store.upsert({
    ...record,
    status: smoked ? "smoked" : record.status,
    smoke: {
      probeOk: probe.ok,
      contractOk: contract.ok,
      liveOk: live?.ok === true,
      at: Date.now(),
      ...live?.ok === false || !probe.ok || !contract.ok ? { error: live?.message ?? probe.message ?? contract.issues.join("\uFF1B") } : {}
    },
    updatedAt: Date.now()
  });
  return {
    id: input.id,
    ok: smoked,
    contract,
    probe,
    live: live ?? { skipped: true, next: "\u8981\u6253\u6700\u77ED\u771F\u8C03\u7528\u65F6\u4F20 live:true\uFF0C\u4E14\u5148 directorx_confirm" },
    next: smoked ? "directorx_provider_commit" : "\u4FEE spec \u540E\u91CD\u8DD1 smoke"
  };
}
async function commitProvider(input) {
  const store = new AdapterStore(input.settings.outputDir);
  const record = await store.get(input.id);
  if (record === void 0) throw new Error(`\u672A\u627E\u5230\u5165\u9A7B ${input.id}`);
  if (record.status !== "smoked" && record.status !== "active" && input.force !== true) {
    throw new Error("\u5C1A\u672A smoke \u901A\u8FC7\u3002\u5148 directorx_provider_smoke\uFF0C\u6216\u5728\u7528\u6237\u660E\u786E\u8DF3\u8FC7\u56DE\u5F52\u65F6 force:true");
  }
  if (record.spec.baseURL.trim() === "") throw new Error("baseURL \u4E3A\u7A7A\uFF0C\u4E0D\u80FD commit");
  const secret = await store.secretOf(input.id);
  const current = input.settings[record.spec.capability];
  const patch = {
    enabled: true,
    mode: record.spec.mode,
    model: record.spec.model,
    baseURL: record.spec.baseURL
  };
  if (secret.apiKey) patch.apiKey = secret.apiKey;
  if (secret.klingAk || secret.klingSk) {
    patch.auth = {
      ...current.auth,
      ...secret.klingAk ? { klingAk: secret.klingAk } : {},
      ...secret.klingSk ? { klingSk: secret.klingSk } : {}
    };
  }
  if (input.apply !== void 0) await input.apply(record.spec.capability, patch);
  await store.upsert({ ...record, status: "active", updatedAt: Date.now() });
  return {
    id: input.id,
    ok: true,
    capability: record.spec.capability,
    mode: record.spec.mode,
    model: record.spec.model,
    baseURL: record.spec.baseURL,
    settingsWritten: input.apply !== void 0,
    refresh: "\u8BBE\u7F6E\u5DF2\u70ED\u66F4\u65B0\u3002\u8BF7\u5237\u65B0\u9875\u9762\uFF0CSettings \u2192 DirectorX \u91CC\u8BE5\u80FD\u529B\u5DF2\u5207\u5230\u6B64\u6A21\u578B\u3002",
    next: `directorx_generate_${record.spec.capability === "vision" ? "image" : record.spec.capability}`
  };
}
async function listProviders(outputDir) {
  const store = new AdapterStore(outputDir);
  const records = await store.list();
  const items = [];
  for (const record of records) {
    items.push(publicRecord(record, await store.hasSecret(record.spec.id)));
  }
  return { adapters: items, count: items.length };
}
async function adapterCapabilities(outputDir) {
  const extras = [];
  for (const record of await new AdapterStore(outputDir).list()) {
    extras.push({
      model: record.spec.model,
      mode: record.spec.mode,
      maxDurationSec: record.spec.caps.maxDurationSec ?? 15,
      minDurationSec: record.spec.caps.minDurationSec ?? 2,
      aspectRatios: record.spec.caps.aspectRatios,
      firstFrame: record.spec.caps.firstFrame,
      lastFrame: record.spec.caps.lastFrame,
      audio: record.spec.caps.audio,
      multiRef: record.spec.caps.multiRef
    });
  }
  return extras;
}
async function resolveGenerateCapability(settings, capability2, modelOverride) {
  const base = settings[capability2];
  const wanted = (modelOverride ?? base.model).trim();
  const store = new AdapterStore(settings.outputDir);
  const record = wanted === "" ? void 0 : await store.findByModel(capability2, wanted) ?? await store.get(wanted);
  if (record === void 0) {
    return { capability: { ...base, model: wanted || base.model } };
  }
  const secret = await store.secretOf(record.spec.id);
  return {
    spec: record.spec,
    capability: {
      ...base,
      mode: record.spec.mode,
      model: record.spec.model,
      baseURL: record.spec.baseURL || base.baseURL,
      apiKey: secret.apiKey || base.apiKey,
      auth: {
        ...base.auth,
        ...secret.klingAk ? { klingAk: secret.klingAk } : {},
        ...secret.klingSk ? { klingSk: secret.klingSk } : {}
      }
    }
  };
}

// src/tools.ts
function asJsonObject(value) {
  return losslessJsonObject(value);
}
function renderJson(_args, value) {
  return [{ type: "text", text: JSON.stringify(asJsonObject(value), null, 2) }];
}
var defineRegistered = (def) => def;
function safeDefine(def) {
  const run = def.execute;
  return defineRegistered({
    ...def,
    execute: async (args, exec) => {
      const root = sessionProjectRoot(exec);
      return runInProject(root, async () => asJsonObject(await run(args, exec)));
    }
  });
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
async function generationGate(settings, store, args, kind) {
  const proposalId = typeof args.proposalId === "string" ? args.proposalId.trim() : "";
  const proposal = proposalId === "" ? null : await store.get(proposalId);
  if (proposalId !== "" && proposal === null) {
    return { generate: false, prompt: "", reason: `proposal "${proposalId}" not found`, authorized: false, refused: true };
  }
  const craftId = typeof args.craftId === "string" ? args.craftId : proposal?.craftId;
  const crafted = await requireCraft(settings.outputDir, craftId);
  if (!crafted.ok) {
    return { generate: false, prompt: "", reason: crafted.reason, authorized: false, refused: true, next: crafted.next };
  }
  const readyId = typeof args.readyId === "string" ? args.readyId : proposal?.readyId;
  if (kind === "image" || kind === "video") {
    const ready = await requireReady(settings.outputDir, readyId, { craftId: crafted.craft.id, kind });
    if (!ready.ok) {
      return { generate: false, prompt: "", reason: ready.reason, authorized: false, refused: true, next: ready.next };
    }
    const auth = resolveGenerateAuthorization({
      mode: settings.initiative,
      prompt: crafted.craft.prompt,
      inBudget: true,
      proposal
    });
    return { ...auth, ready: ready.brief };
  }
  return resolveGenerateAuthorization({
    mode: settings.initiative,
    prompt: crafted.craft.prompt,
    inBudget: true,
    proposal
  });
}
function toolContext(settings, capability2, signal, adapter) {
  return { settings, capability: capability2, signal, ledger: new DirectorxTaskLedger(settings.outputDir), adapter };
}
async function generateContext(settings, capability2, signal, modelOverride) {
  const resolved = await resolveGenerateCapability(settings, capability2, modelOverride);
  return toolContext(settings, resolved.capability, signal, resolved.spec);
}
function syncTools(ctx, settings, applyCapability, define = (def) => def) {
  const previous = defineRegistered;
  defineRegistered = define;
  const disposers = [];
  const proposals = new ProposalStore(settings.outputDir);
  if (settings.vision.enabled) {
    disposers.push(ctx.tools.register(safeDefine({
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
    disposers.push(ctx.tools.register(safeDefine({
      name: "directorx_generate_image",
      description: "Generate images. \u5FC5\u987B\u5E26 craftId \u548C readyId\u3002\u5148 generate_ready \u5224\u5B9A\u8BBE\u5B9A\u56FE/\u573A\u666F/\u5173\u952E\u5E27\u662F\u5426\u9F50\u3002\u7981\u6B62\u7528\u753B\u5E03\u77ED\u53E5\u5F53\u63D0\u793A\u8BCD\u3002\u89D2\u8272/\u8BBE\u5B9A/\u4E09\u89C6\u56FE\u6309 novel-characters \u8BBE\u5B9A\u8868\u3002\u4E25\u683C/\u534F\u540C\u8FD8\u8981\u5DF2\u6279\u51C6 proposalId\u3002",
      parameters: {
        prompt: { type: "string", required: true, description: "Text-to-image prompt. \u89D2\u8272\u8BBE\u5B9A\u5199\u6E05\u534A\u8EAB\u57FA\u51C6+\u6B63\u4FA7\u80CC\u4E09\u89C6\u56FE\u540C\u4E00\u4EBA\u3002Follow subject, action, environment, style, light, lens." },
        size: { type: "string", description: "Size such as 1024x1024, 1536x1024, or 1024x1536. Optional; provider defaults apply." },
        quality: { type: "string", enum: ["auto", "low", "medium", "high"], description: "Quality hint for providers that support it." },
        reference_image_paths: { type: "array", items: { type: "string" }, description: "Optional local paths or URLs used as image references (modelverse-tasks mode)." },
        characters: { type: "array", items: { type: "string" }, description: "Optional registered character names (directorx_character_register); their reference images and descriptions are injected automatically." },
        model: { type: "string", description: "Optional model id. Overrides Settings for this call; user-onboarded adapters are resolved from the project catalog." },
        craftId: { type: "string", required: true, description: "directorx_prompt_craft \u8FD4\u56DE\u7684 id\u3002\u672A\u8C03\u7814\u6210\u7A3F\u7981\u6B62\u751F\u6210\u3002" },
        readyId: { type: "string", required: true, description: "directorx_generate_ready \u8FD4\u56DE\u7684 id\u3002\u53C2\u8003\u4E0D\u9F50\u7981\u6B62\u751F\u6210\u3002" },
        proposalId: { type: "string", description: "Approved proposal id. \u4E25\u683C/\u534F\u540C must pass this after \u5BA1\u9605; unsolicited generate is refused." }
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const gate = await generationGate(settings, proposals, args, "image");
        if (!gate.generate) {
          return { ...gate, refused: true, next: gate.next ?? (gate.authorized ? "directorx_propose" : "\u5148 directorx_prompt_craft \u2192 directorx_generate_ready") };
        }
        const signal = combinedSignal(exec.signal, settings.timeoutMs);
        const bind = "ready" in gate && gate.ready !== void 0 ? mergeReadyBind(gate.ready, args) : { characters: Array.isArray(args.characters) ? args.characters.map(String) : [], referenceImages: Array.isArray(args.reference_image_paths) ? args.reference_image_paths.map(String) : [] };
        const characterCards = await new CharacterStore(settings.outputDir).get(bind.characters);
        const refs = [.../* @__PURE__ */ new Set([...bind.referenceImages, ...characterCards.map((card) => card.refPath)])];
        const characterNote = characterCards.map((card) => `[\u89D2\u8272\u5361 ${card.name}] ${card.description}${card.outfit !== void 0 ? `\uFF1B\u670D\u88C5\uFF1A${card.outfit}` : ""}${card.props !== void 0 ? `\uFF1B\u9053\u5177\uFF1A${card.props}` : ""}`).join("\uFF1B");
        const style = await new ProjectStyleStore(settings.outputDir).read();
        const styleNote = style !== null ? `\u98CE\u683C\u5E38\u91CF\uFF1Acamera ${style.camera}\uFF1Bpalette ${style.palette}\uFF1Blighting ${style.lighting}${style.sceneAnchors.length > 0 ? `\uFF1B\u573A\u666F\u951A\u70B9 ${style.sceneAnchors.join(" / ")}` : ""}` : "";
        const blocks = [characterCards.length > 0 ? `\u89D2\u8272\u4E00\u81F4\u6027\u951A\u70B9\uFF1A${characterNote}` : "", styleNote].filter((block) => block !== "");
        const prompt = withCharacterSheetSpec(blocks.length > 0 ? `${gate.prompt}

${blocks.join("\uFF1B")}` : gate.prompt);
        return runImage(await generateContext(settings, "image", signal, typeof args.model === "string" ? args.model : void 0), prompt, {
          size: args.size,
          quality: args.quality,
          referenceImagePaths: refs
        });
      }
    })));
  }
  if (settings.video.enabled) {
    disposers.push(ctx.tools.register(safeDefine({
      name: "directorx_generate_video",
      description: "Generate video. \u5FC5\u987B\u5E26 craftId \u548C readyId\u3002\u5148 generate_ready\uFF1A\u6709\u4EBA\u7269\u8981\u8BBE\u5B9A\u56FE\uFF0C\u6709\u573A\u666F\u8981\u7A7A\u955C\uFF0C\u8FDE\u7EED\u955C\u8981\u9996\u5E27/\u4E0A\u4E00\u955C\u672B\u5E27\uFF0C\u8F6C\u573A\u8981\u9996\u5C3E\u5E27\u3002\u7981\u6B62\u539F\u6587\u76F4\u51FA\u3002\u97F3\u753B\u540C\u51FA\u4F18\u5148\u539F\u751F\u97F3\u9891\u6A21\u578B\u3002",
      parameters: {
        prompt: { type: "string", required: true, description: "DirectorX video prompt: physical action first, then camera, environment, style, lighting. Positive language; concrete motion." },
        seconds: { type: "number", description: "Target duration in seconds. Provider clamps unknown values." },
        size: { type: "string", description: "Output size for providers that accept it, e.g. 1280x720 or 1920x1080." },
        aspect_ratio: { type: "string", description: "Aspect ratio such as 16:9, 9:16, 1:1 (modelverse-tasks mode)." },
        first_frame_path: { type: "string", description: "First frame. ready \u5DF2\u7ED1\u5B9A\u65F6\u53EF\u7701\u7565\u3002" },
        last_frame_path: { type: "string", description: "Last frame for fl2v. ready \u5DF2\u7ED1\u5B9A\u65F6\u53EF\u7701\u7565\u3002" },
        reference_image_paths: { type: "array", items: { type: "string" }, description: "Optional reference image paths/URLs for character/appearance consistency." },
        characters: { type: "array", items: { type: "string" }, description: "Optional registered character names (directorx_character_register); their reference images and descriptions are injected automatically." },
        negative_prompt: { type: "string", description: "Optional negative prompt (\u57FA\u7EBF\u89C1 directorx-methodology \u89C4\u5219 26\uFF1A\u6A21\u7CCA/\u89E3\u5256\u9519\u8BEF/\u6C34\u5370/\u95EA\u70C1\u56DB\u7C7B)\u3002Provider \u652F\u6301\u65F6\u900F\u4F20\uFF08\u5982 kling legacy\uFF09\u3002" },
        model: { type: "string", description: "Optional model id. Overrides Settings for this call; user-onboarded adapters are resolved from the project catalog." },
        craftId: { type: "string", required: true, description: "directorx_prompt_craft \u8FD4\u56DE\u7684 id\u3002\u753B\u5E03\u77ED\u53E5\u4E0D\u662F\u63D0\u793A\u8BCD\u3002" },
        readyId: { type: "string", required: true, description: "directorx_generate_ready \u8FD4\u56DE\u7684 id\u3002\u53C2\u8003\u4E0D\u9F50\u7981\u6B62\u751F\u6210\u3002" },
        proposalId: { type: "string", description: "Approved proposal id. \u4E25\u683C/\u534F\u540C must pass this after \u5BA1\u9605; unsolicited generate is refused." }
      },
      output: objectOutput(),
      timeoutMs: Math.max(settings.timeoutMs, settings.pollIntervalMs * Math.min(settings.maxPollAttempts, 120)),
      async execute(args, exec) {
        const gate = await generationGate(settings, proposals, args, "video");
        if (!gate.generate) {
          return { ...gate, refused: true, next: gate.next ?? "\u5148 directorx_prompt_craft \u2192 directorx_generate_ready" };
        }
        const budget = Math.max(settings.timeoutMs, settings.pollIntervalMs * Math.min(settings.maxPollAttempts, 120));
        const signal = combinedSignal(exec.signal, budget);
        const bind = "ready" in gate && gate.ready !== void 0 ? mergeReadyBind(gate.ready, args) : {
          characters: Array.isArray(args.characters) ? args.characters.map(String) : [],
          referenceImages: Array.isArray(args.reference_image_paths) ? args.reference_image_paths.map(String) : [],
          firstFrame: typeof args.first_frame_path === "string" ? args.first_frame_path : void 0,
          lastFrame: typeof args.last_frame_path === "string" ? args.last_frame_path : void 0
        };
        const characterCards = await new CharacterStore(settings.outputDir).get(bind.characters);
        const refs = [.../* @__PURE__ */ new Set([...bind.referenceImages, ...characterCards.map((card) => card.refPath)])];
        const characterNote = characterCards.map((card) => `[\u89D2\u8272\u5361 ${card.name}] ${card.description}${card.outfit !== void 0 ? `\uFF1B\u670D\u88C5\uFF1A${card.outfit}` : ""}${card.props !== void 0 ? `\uFF1B\u9053\u5177\uFF1A${card.props}` : ""}`).join("\uFF1B");
        const style = await new ProjectStyleStore(settings.outputDir).read();
        const styleNote = style !== null ? `\u98CE\u683C\u5E38\u91CF\uFF1Acamera ${style.camera}\uFF1Bpalette ${style.palette}\uFF1Blighting ${style.lighting}${style.sceneAnchors.length > 0 ? `\uFF1B\u573A\u666F\u951A\u70B9 ${style.sceneAnchors.join(" / ")}` : ""}` : "";
        const blocks = [characterCards.length > 0 ? `\u89D2\u8272\u4E00\u81F4\u6027\u951A\u70B9\uFF1A${characterNote}` : "", styleNote].filter((block) => block !== "");
        const prompt = blocks.length > 0 ? `${gate.prompt}

${blocks.join("\uFF1B")}` : gate.prompt;
        const negative = [typeof args.negative_prompt === "string" ? args.negative_prompt : "", style?.negativeBaseline ?? ""].filter((part) => part !== "").join(", ");
        return runVideo(await generateContext(settings, "video", signal, typeof args.model === "string" ? args.model : void 0), prompt, {
          seconds: args.seconds,
          size: args.size,
          aspectRatio: args.aspect_ratio,
          resolution: settings.video.resolution,
          firstFramePath: bind.firstFrame,
          lastFramePath: bind.lastFrame,
          referenceImagePaths: refs,
          negativePrompt: negative !== "" ? negative : void 0
        });
      }
    })));
  }
  if (settings.audio.enabled) {
    disposers.push(ctx.tools.register(safeDefine({
      name: "directorx_generate_audio",
      description: "Generate speech (and provider-supported music/audio) through a configurable OpenAI-compatible /audio/speech endpoint. Configure the audio Base URL / API Key / model in DSH WebUI Settings \u2192 DirectorX.",
      parameters: {
        text: { type: "string", required: true, description: "Text to synthesize. For music prompts, write the desired style, tempo, and instrumentation." },
        voice: { type: "string", description: "Voice id such as alloy, echo, onyx, nova, or a provider-specific voice." },
        format: { type: "string", enum: ["mp3", "wav", "opus", "aac"], description: "Audio format. Default mp3." },
        instructions: { type: "string", description: "Performance instructions (gpt-4o-mini-tts \u5B98\u65B9\u4E03\u7EF4\uFF1A\u53E3\u97F3/\u60C5\u7EEA\u5E45\u5EA6/\u8BED\u8C03/\u6A21\u4EFF/\u8BED\u901F/\u8BED\u6C14/\u8033\u8BED)\u3002\u793A\u4F8B\uFF1A\u300CSpeak in a calm documentary tone; pause before numbers; end sentences level.\u300D\u4E0D\u900F\u4F20\u65F6\u8868\u6F14\u8D70 text \u6807\u70B9\u534F\u8BAE\uFF08directorx-methodology \u89C4\u5219 92-99\uFF09\u3002" },
        speed: { type: "number", description: "\u8BED\u901F\uFF080.25-4.0\uFF0C\u53E3\u64AD 1.0-1.2\uFF1B\u6781\u7AEF\u503C\u635F\u5BB3\u97F3\u8D28\uFF0C\u5FAE\u8C03\u4F18\u5148\u9760\u6587\u672C\u8282\u594F\uFF09\u3002" },
        model: { type: "string", description: "Optional model id. Overrides Settings for this call; user-onboarded adapters are resolved from the project catalog." },
        craftId: { type: "string", required: true, description: "directorx_prompt_craft \u8FD4\u56DE\u7684 id\u3002" },
        proposalId: { type: "string", description: "Approved proposal id. \u4E25\u683C/\u534F\u540C must pass this after \u5BA1\u9605." }
      },
      output: objectOutput(),
      timeoutMs: settings.timeoutMs,
      async execute(args, exec) {
        const gate = await generationGate(settings, proposals, { prompt: args.text, proposalId: args.proposalId });
        if (!gate.generate) {
          return { ...gate, refused: true, next: gate.next ?? "\u5148 directorx_prompt_craft" };
        }
        const signal = combinedSignal(exec.signal, settings.timeoutMs);
        return runAudio(await generateContext(settings, "audio", signal, typeof args.model === "string" ? args.model : void 0), gate.prompt, { voice: args.voice, format: args.format, instructions: typeof args.instructions === "string" ? args.instructions : void 0, speed: typeof args.speed === "number" ? args.speed : void 0 });
      }
    })));
    disposers.push(ctx.tools.register(safeDefine({
      name: "directorx_transcribe_audio",
      description: "Transcribe a local audio/video file through a configurable OpenAI-compatible /audio/transcriptions endpoint (multipart). Supports json/text/srt output; srt transcripts are saved under the output dir for the subtitle pipeline. Configure the audio Base URL / API Key / model in DSH WebUI Settings \u2192 DirectorX (mock mode returns a deterministic transcript).",
      parameters: {
        source: { type: "string", required: true, description: "Absolute path of the local audio or video file to transcribe." },
        format: { type: "string", enum: ["json", "text", "srt"], description: "Response format. Default json; choose srt for subtitles." },
        language: { type: "string", description: 'Optional ISO-639-1 language hint, e.g. "zh" or "en".' }
      },
      output: objectOutput(),
      timeoutMs: Math.max(settings.timeoutMs, 3e5),
      async execute(args, exec) {
        const signal = combinedSignal(exec.signal, settings.timeoutMs);
        return runTranscribe(toolContext(settings, settings.audio, signal), args.source, { language: args.language, format: args.format });
      }
    })));
  }
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_knowledge_search",
    description: "Search the bundled DirectorX film/AI-video knowledge corpus (350+ Chinese craft articles). Ranks title/slug/group first, then body; expands craft synonyms (\u9996\u5C3E\u5E27/\u4E09\u89C6\u56FE/\u5206\u955C\u2026). Always search before claiming the corpus lacks a topic. Then directorx_knowledge_read.",
    parameters: {
      query: { type: "string", required: true, description: 'Search query, e.g. "\u56FE\u751F\u89C6\u9891 \u9996\u5C3E\u5E27 \u63D0\u793A\u8BCD" or "camera movement semantics".' },
      max_results: { type: "number", description: "Maximum results (default 8, max 20)." },
      group: { type: "string", description: "Optional inventory group: foundation / production / consistency / synthesis." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const maxResults = Math.min(20, Math.max(1, Math.round(args.max_results ?? 8)));
      const group = typeof args.group === "string" ? args.group : void 0;
      return { query: args.query, group: group ?? null, results: await corpus.search(args.query, maxResults, { group }) };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_knowledge_read",
    description: "Read bundled knowledge article(s) by id/slug/number/path from directorx_knowledge_search. Pass refs[] to read several. Returns related ids to keep researching.",
    parameters: {
      ref: { type: "string", description: 'One article id/slug/path, e.g. "116".' },
      refs: { type: "array", items: { type: "string" }, description: "Read up to 3 articles in one call." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const refs = [
        ...typeof args.ref === "string" && args.ref.trim() !== "" ? [args.ref] : [],
        ...Array.isArray(args.refs) ? args.refs.map(String) : []
      ].slice(0, 3);
      if (refs.length === 0) throw new Error("directorx_knowledge_read \u9700\u8981 ref \u6216 refs");
      const articles = [];
      const ledger = new ResearchLedger(settings.outputDir);
      for (const ref of refs) {
        const article = await corpus.readArticle(ref);
        articles.push(article);
        await ledger.record({ kind: "knowledge", ref: article.article.id || ref });
      }
      const related = await corpus.related(refs[0], 3).catch(() => []);
      return { articles, related };
    }
  })));
  skillIndex.setRoot(defaultSkillRoot());
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_skill_search",
    description: "Search bundled DirectorX skills (name, description, headings, reference files). Use before guessing a workflow. Then directorx_skill_read the full SKILL.md.",
    parameters: {
      query: { type: "string", required: true, description: 'Craft term, e.g. "\u4E09\u89C6\u56FE \u89D2\u8272" or "seedance prompt".' },
      max_results: { type: "number", description: "Default 8, max 20." }
    },
    output: objectOutput(),
    timeoutMs: 2e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const maxResults = Math.min(20, Math.max(1, Math.round(args.max_results ?? 8)));
      return { query: args.query, results: await skillIndex.search(String(args.query), maxResults) };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_skill_read",
    description: "Read a bundled skill SKILL.md (or a references/*.md file). The DSH skill manifest is only a summary \u2014 read the body before executing that craft.",
    parameters: {
      name: { type: "string", required: true, description: "Skill name from directorx_skill_search, e.g. novel-characters." },
      file: { type: "string", description: "Optional relative file inside the skill folder, e.g. references/sheet.md." }
    },
    output: objectOutput(),
    timeoutMs: 2e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const body = await skillIndex.read(String(args.name), typeof args.file === "string" ? args.file : void 0);
      await new ResearchLedger(settings.outputDir).record({ kind: "skill", ref: body.name });
      return body;
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_prompt_craft",
    description: "\u628A\u7528\u6237\u610F\u56FE\u5199\u6210\u53EF\u751F\u6210\u7684\u5BFC\u6F14\u63D0\u793A\u8BCD\u3002\u5FC5\u987B\u5148 knowledge_read + skill_read\uFF08\u5FC5\u8981\u65F6\u5916\u90E8\u8C03\u7814\uFF09\uFF0C\u518D\u628A\u6210\u7A3F\u548C\u5F15\u7528\u4EA4\u6765\u3002\u753B\u5E03\u77ED\u53E5\u4E0D\u662F\u63D0\u793A\u8BCD\u3002\u8FD4\u56DE craftId\uFF0Cgenerate/propose \u5FC5\u5E26\u3002",
    parameters: {
      intent: { type: "string", required: true, description: "\u7528\u6237\u539F\u53E5 / \u753B\u5E03\u751F\u6210\u6761\u610F\u56FE\u3002" },
      prompt: { type: "string", required: true, description: "\u8C03\u7814\u540E\u7684\u6210\u7A3F\uFF1A\u4E3B\u4F53\u52A8\u4F5C + \u666F\u522B\u8FD0\u955C + \u73AF\u5883\u5149 + \u98CE\u683C\u7126\u6BB5\uFF0C\u6B63\u8BF4\uFF0C\u5177\u4F53\u8FD0\u52A8\u3002" },
      kind: { type: "string", enum: ["image", "video", "audio"], required: true, description: "\u6210\u7A3F\u7528\u4E8E\u51FA\u56FE\u3001\u51FA\u89C6\u9891\u8FD8\u662F\u51FA\u58F0\u97F3\u3002" },
      knowledgeRefs: { type: "array", items: { type: "string" }, required: true, description: "\u5DF2 read \u7684\u77E5\u8BC6\u5E93 id\u3002" },
      skillNames: { type: "array", items: { type: "string" }, required: true, description: "\u5DF2 read \u7684\u6280\u80FD\u540D\u3002" },
      externalNotes: { type: "string", description: "\u5916\u90E8\u8C03\u7814\u6458\u8981\uFF1B\u8BED\u6599\u5DF2\u591F\u5C31\u5199 corpus-sufficient\u3002" },
      shotSize: { type: "string" },
      angle: { type: "string" },
      cameraMove: { type: "string" },
      lighting: { type: "string" },
      mood: { type: "string" },
      composition: { type: "string" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return craftPrompt({
        outputDir: settings.outputDir,
        kind: args.kind,
        intent: String(args.intent),
        prompt: String(args.prompt),
        knowledgeRefs: Array.isArray(args.knowledgeRefs) ? args.knowledgeRefs.map(String) : [],
        skillNames: Array.isArray(args.skillNames) ? args.skillNames.map(String) : [],
        externalNotes: typeof args.externalNotes === "string" ? args.externalNotes : "",
        shot: {
          subject: String(args.intent),
          shotSize: args.shotSize,
          angle: args.angle,
          cameraMove: typeof args.cameraMove === "string" ? args.cameraMove : void 0,
          lighting: args.lighting,
          mood: typeof args.mood === "string" ? args.mood : void 0,
          composition: args.composition
        }
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_generate_ready",
    description: "\u751F\u6210\u524D\u53C2\u8003\u9F50\u5907\u95F8\u3002\u8BFB\u753B\u5E03\u548C\u89D2\u8272\u5E93\uFF0C\u5224\u5B9A\u672C\u4EFB\u52A1\u8BE5\u8D70\u8BBE\u5B9A\u56FE / \u573A\u666F\u7A7A\u955C / \u5173\u952E\u5E27 / \u56FE\u751F / \u9996\u5C3E\u5E27 / \u6587\u751F\u3002\u7F3A\u53C2\u8003\u5C31 blocked\uFF0C\u5E76\u7528\u63D0\u95EE\u5361\u8BA9\u7528\u6237\u9009\u8DEF\u3002commit:true \u53EA\u5728\u9F50\u5907\u65F6\u53D1 readyId\uFF1Bgenerate/propose/canvas_continue \u5FC5\u5E26\u3002",
    parameters: {
      kind: { type: "string", enum: ["image", "video"], required: true, description: "\u672C\u4EFB\u52A1\u51FA\u56FE\u8FD8\u662F\u51FA\u89C6\u9891\u3002" },
      intent: { type: "string", required: true, description: "\u7528\u6237\u539F\u53E5 / \u753B\u5E03\u610F\u56FE\u3002" },
      prompt: { type: "string", required: true, description: "prompt_craft \u6210\u7A3F\u3002\u4E0D\u9F50\u65F6\u4E5F\u53EF\u5148\u62FF\u6765\u8BCA\u65AD\u3002" },
      craftId: { type: "string", description: "commit \u65F6\u5FC5\u586B\u3002" },
      strategy: { type: "string", enum: ["character-sheet", "scene-still", "keyframe", "t2i", "t2v", "i2v", "fl2v", "ref2v"], description: "\u58F0\u660E\u7B56\u7565\uFF1B\u4E0D\u4F20\u5219\u6309\u610F\u56FE/\u753B\u5E03\u63A8\u65AD\u3002" },
      nodeId: { type: "string", description: "\u8981\u751F\u6210\u7684\u753B\u5E03\u8282\u70B9\u3002" },
      sourceId: { type: "string", description: "\u627F\u63A5\u7684\u4E0A\u4E00\u955C\u3002" },
      characters: { type: "array", items: { type: "string" }, description: "\u672C\u955C\u8981\u9501\u7684\u4EBA\u7269\u540D\u3002" },
      scenes: { type: "array", items: { type: "string" }, description: "\u672C\u955C\u8981\u9501\u7684\u573A\u666F\u540D\u3002" },
      firstFrame: { type: "string", description: "\u9996\u5E27\u8DEF\u5F84\u3002" },
      lastFrame: { type: "string", description: "\u5C3E\u5E27\u8DEF\u5F84\u3002" },
      referenceImages: { type: "array", items: { type: "string" } },
      waivers: { type: "array", items: { type: "string" }, description: "\u7528\u6237\u786E\u8BA4\u540E\u624D\u53EF\u653E\u5F03\u7684\u9879\uFF1Acharacter-sheet / scene-still / first-frame / last-frame\u3002\u5DF2\u767B\u8BB0\u89D2\u8272\u4E0D\u80FD\u653E\u5F03\u8BBE\u5B9A\u56FE\u3002" },
      commit: { type: "boolean", description: "true = \u9F50\u5907\u5219\u5199\u5165 readyId\u3002" },
      present: { type: "boolean", description: "blocked \u65F6\u7ACB\u523B\u5F39\u51FA\u63D0\u95EE\u5361\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e5,
    async execute(args, exec) {
      const crafted = await requireCraft(settings.outputDir, typeof args.craftId === "string" ? args.craftId : void 0);
      const snapshot = await loadReadySnapshot(settings.outputDir);
      const input = {
        kind: args.kind === "image" ? "image" : "video",
        intent: String(args.intent ?? ""),
        prompt: String(args.prompt ?? (crafted.ok ? crafted.craft.prompt : "")),
        ...crafted.ok ? { craftId: crafted.craft.id } : {},
        ...typeof args.nodeId === "string" ? { nodeId: args.nodeId } : {},
        ...typeof args.sourceId === "string" ? { sourceId: args.sourceId } : {},
        ...Array.isArray(args.characters) ? { characters: args.characters.map(String) } : {},
        ...Array.isArray(args.scenes) ? { scenes: args.scenes.map(String) } : {},
        ...parseStrategy(args.strategy) !== void 0 ? { strategy: parseStrategy(args.strategy) } : {},
        ...typeof args.firstFrame === "string" ? { firstFrame: args.firstFrame } : {},
        ...typeof args.lastFrame === "string" ? { lastFrame: args.lastFrame } : {},
        ...Array.isArray(args.referenceImages) ? { referenceImages: args.referenceImages.map(String) } : {},
        ...Array.isArray(args.waivers) ? { waivers: args.waivers.map(String) } : {},
        snapshot
      };
      const diagnosis = assessGenerateReady(input);
      if (args.commit === true && !crafted.ok) return { ...crafted, diagnosis };
      const diagnosed = args.commit === true && crafted.ok ? await commitGenerateReady({ ...input, outputDir: settings.outputDir, craftId: crafted.craft.id }) : { ok: diagnosis.verdict === "ready", ...diagnosis };
      let answers;
      const ask = diagnosed.ask;
      if (args.present === true && Array.isArray(ask) && ask.length > 0) {
        const userInteraction = ctx.get("userInteraction");
        if (userInteraction === void 0) throw new Error("directorx_generate_ready present \u9700\u8981 DSH userInteraction");
        answers = (await presentAsk({
          questions: normalizeAskQuestions(ask),
          ask: (request) => userInteraction.ask(request),
          agent: exec.agent,
          signal: exec.signal
        })).answers;
      }
      return {
        ...diagnosed,
        answers,
        next: diagnosed.next ?? (Array.isArray(ask) && ask.length > 0 && answers === void 0 ? "directorx_ask" : void 0)
      };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_task_status",
    description: "Read the DirectorX task ledger (persisted under the output directory). Without task_id, returns the most recent tasks; with task_id, the latest transition. Use it to recover tasks whose original tool call timed out or whose session was interrupted.",
    parameters: {
      task_id: { type: "string", description: "Optional provider task id; omit to list recent tasks." },
      limit: { type: "number", description: "Max tasks to list when task_id is omitted (default 10, max 50)." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    isConcurrencySafe: () => true,
    async execute(args, exec) {
      void exec;
      const ledger = new DirectorxTaskLedger(settings.outputDir);
      const taskId = typeof args.task_id === "string" ? args.task_id.trim() : "";
      if (taskId !== "") {
        const record = await ledger.latest(taskId);
        return record === void 0 ? { task_id: taskId, found: false } : { task_id: taskId, found: true, task: record };
      }
      const limit = Math.min(50, Math.max(1, Math.round(args.limit ?? 10)));
      const records = await ledger.list();
      const byId = /* @__PURE__ */ new Map();
      for (const record of records) byId.set(record.taskId, record);
      const tasks = [...byId.values()].reverse().slice(0, limit);
      return { tasks, count: byId.size };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_cancel_task",
    description: "Cancel an in-flight or orphaned DirectorX generation task by task id. An in-flight poll loop stops at its next ledger check; a task already succeeded is a no-op. The provider-side task may keep running remotely.",
    parameters: {
      task_id: { type: "string", required: true, description: "Provider task id from directorx_task_status or a previous generation result." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const ledger = new DirectorxTaskLedger(settings.outputDir);
      const taskId = args.task_id.trim();
      if (taskId === "") throw new Error("directorx_cancel_task requires a non-empty task_id");
      const record = await ledger.cancel(taskId);
      return { task_id: taskId, task: record };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_edits",
    description: "List media files saved from the WebUI editor panel (image/video secondary edits). Returns absolute paths under the output directory that the agent can reference in further steps.",
    parameters: {
      limit: { type: "number", description: "Max edits to list (default 20, max 50)." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const ledger = new DirectorxEditLedger(settings.outputDir);
      const limit = Math.min(50, Math.max(1, Math.round(args.limit ?? 20)));
      return { edits: await ledger.list(limit) };
    }
  })));
  const canvas = new DirectorxCanvasStore(settings.outputDir);
  const intents = new CanvasIntentStore(settings.outputDir);
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_get",
    description: "Read the DirectorX infinite-canvas document (nodes and edges). Use it before mutating the canvas, or to answer questions about what is on it.",
    parameters: {},
    output: objectOutput(),
    timeoutMs: 3e4,
    isConcurrencySafe: () => true,
    async execute() {
      return canvas.read();
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_add",
    description: "Add one canvas node. \u5267\u672C/\u5206\u955C/\u89D2\u8272\u8868\u672A\u7528 directorx_confirm \u6216\u7528\u6237\u660E\u786E\u8BF4\u300C\u843D\u5230\u753B\u5E03\u300D\u524D\uFF0C\u7981\u6B62\u6279\u91CF\u5360\u4F4D\u3002\u5355\u8282\u70B9\u8865\u4F4D\u53EF\u4EE5\u3002kind: image|video|text|group\u3002Pass prompt/shotIndex so the board is a storyboard, not empty cards.",
    parameters: {
      kind: { type: "string", enum: ["image", "video", "text", "group"], required: true, description: "Node kind." },
      id: { type: "string", description: "Optional stable id so later connect/sequence calls can name this node." },
      label: { type: "string", description: "Node label (shown under the preview)." },
      path: { type: "string", description: "Media path (local output-dir path or http(s) URL) for image/video nodes." },
      prompt: { type: "string", description: "Generation prompt stored on the node (shot-list / propose source)." },
      shotIndex: { type: "number", description: "Stable shot number. Order is this field, not x/y or edges." },
      shotStatus: { type: "string", enum: ["idea", "approved", "generating", "review", "locked", "failed"], description: "Shot status." },
      continuityRules: { type: "array", items: { type: "string" }, description: "Continuity locks (character/wardrobe/light)." },
      aspect: { type: "string", description: "Frame aspect stored on the node (e.g. 16:9, 9:16)." },
      model: { type: "string", description: "Preferred generation model id for this node." },
      count: { type: "number", description: "Preferred take count (1\u20134)." },
      durationSec: { type: "number", description: "Preferred video duration in seconds." },
      characters: { type: "array", items: { type: "string" }, description: "Registered character names to lock on this node." },
      x: { type: "number", description: "Canvas x position." },
      y: { type: "number", description: "Canvas y position." },
      width: { type: "number", description: "Node width." },
      height: { type: "number", description: "Node height." },
      parent: { type: "string", description: "Optional id of a group node to place this node inside." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      const doc = await canvas.addNode(args);
      const node = typeof args.id === "string" && args.id !== "" ? doc.nodes.find((candidate) => candidate.id === args.id) : doc.nodes[doc.nodes.length - 1];
      return { added: node ?? null, updatedAt: doc.updatedAt, nodeCount: doc.nodes.length };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_connect",
    description: "Connect two existing canvas nodes with an edge (optional label). Both endpoint ids must exist on the canvas.",
    parameters: {
      from: { type: "string", required: true, description: "Source node id." },
      to: { type: "string", required: true, description: "Target node id." },
      label: { type: "string", description: "Optional edge label." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.addEdge(args);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_update",
    description: 'Update a canvas node or edge by id: move (x/y), resize (width/height), relabel, replace its media path, or move it into/out of a group (patch { parent: "<group id>" } or { parent: null }). Patch fields merge over the existing element.',
    parameters: {
      id: { type: "string", required: true, description: "Node or edge id from directorx_canvas_get." },
      patch: { type: "object", additionalProperties: true, description: 'Fields to change, e.g. { x: 100, y: 200 } or { label: "\u955C\u5934 2" } or { parent: "group-xxx" }.' }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.update(args.id, args.patch ?? {});
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_remove",
    description: "Remove a canvas node (its edges go with it) or a single edge by id.",
    parameters: {
      id: { type: "string", required: true, description: "Node or edge id to remove." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.remove(args.id);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_arrange",
    description: "\u6574\u7406\u753B\u5E03\uFF1Aauto-layout every node into a tidy grid (or a single row) while keeping all connections. Group members stay inside their group frames.",
    parameters: {
      layout: { type: "string", enum: ["grid", "row"], description: "grid (default) or row." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.arrange(args.layout ?? "grid");
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_replace",
    description: "Replace the entire canvas document (full control): pass the complete nodes/edges arrays. Use with directorx_canvas_get to compose a new arrangement in one write.",
    parameters: {
      nodes: { type: "array", items: { type: "object", additionalProperties: true }, required: true, description: "Complete replacement node list (same shape as canvas_get returns)." },
      edges: { type: "array", items: { type: "object", additionalProperties: true }, required: true, description: "Complete replacement edge list." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      const current = await canvas.read();
      return canvas.write({ version: 1, updatedAt: 0, nodes: args.nodes ?? [], edges: args.edges ?? [] }, current.updatedAt);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_brief",
    description: "\u8282\u70B9\u81EA\u52A8\u7B80\u4ECB\uFF08\u5E42\u7B49\u7F13\u5B58\uFF09\uFF1Aprompt-first\u2014\u2014\u8282\u70B9\u81EA\u5E26 prompt \u76F4\u63A5\u8FD4\u56DE\uFF1B\u5DF2\u6709 aiBrief \u8FD4\u56DE\u7F13\u5B58\uFF1B\u5426\u5219\u82E5 vision \u53EF\u7528\uFF0C\u5BF9\u8282\u70B9\u5A92\u4F53\u8C03\u7528 view_image \u751F\u6210\u4E00\u53E5\u63CF\u8FF0\u5E76\u7F13\u5B58\u5230\u8282\u70B9 aiBrief\uFF1Bvision \u4E0D\u53EF\u7528\u65F6\u786E\u5B9A\u6027\u56DE\u9000\uFF08label+\u8DEF\u5F84\u5143\u6570\u636E\uFF09\u3002",
    parameters: {
      nodeId: { type: "string", required: true, description: "Target node id." }
    },
    output: objectOutput(),
    timeoutMs: 12e4,
    async execute(args) {
      const doc = await canvas.read();
      const node = doc.nodes.find((candidate) => candidate.id === String(args.nodeId));
      if (node === void 0) throw new Error(`canvas node "${args.nodeId}" not found`);
      if (node.prompt !== void 0 && node.prompt !== "") return { nodeId: node.id, brief: node.prompt, source: "prompt" };
      if (node.aiBrief !== void 0 && node.aiBrief !== "") return { nodeId: node.id, brief: node.aiBrief, source: "cache" };
      if (node.path !== void 0 && settings.vision.enabled && settings.vision.mode !== "mock") {
        try {
          const result = await runVision(toolContext(settings, settings.vision, AbortSignal.timeout(6e4)), node.path, "\u7528\u4E00\u53E5\u8BDD\u63CF\u8FF0\u8FD9\u5F20\u56FE\u7684\u4E3B\u4F53\u3001\u573A\u666F\u4E0E\u98CE\u683C\uFF0850 \u5B57\u5185\uFF09\u3002");
          const brief2 = result.answer.slice(0, 500);
          await canvas.update(node.id, { aiBrief: brief2 });
          return { nodeId: node.id, brief: brief2, source: "vision" };
        } catch {
        }
      }
      const fallback = node.label !== "" ? node.label : node.kind === "video" ? "\u89C6\u9891\u7D20\u6750\uFF08\u672A\u63CF\u8FF0\uFF09" : "\u56FE\u50CF\u7D20\u6750\uFF08\u672A\u63CF\u8FF0\uFF09";
      return { nodeId: node.id, brief: fallback, source: "fallback" };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_takes",
    description: "Take \u5F52\u6863\u67E5\u8BE2\uFF1A\u8FD4\u56DE Shot \u7EC4\u5185\u7684\u5019\u9009\u7ED3\u679C\uFF08\u5A92\u4F53\u6210\u5458\uFF0C\u6309 shotIndex \u786E\u5B9A\u6027\u6392\u5E8F\uFF09+ \u9009\u5B9A Take + \u955C\u5934\u72B6\u6001\u2014\u2014agent \u6253\u5206/\u5BF9\u6BD4/\u9489\u9009\uFF08selectedTakeId \u7ECF canvas_update \u5199\u5165\uFF09\u7684\u786E\u5B9A\u6027\u5E95\u5EA7\u3002",
    parameters: {
      groupId: { type: "string", required: true, description: "Shot group node id." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.takes(String(args.groupId));
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_continuity",
    description: "\u8FDE\u7EED\u6027\u89C4\u5219\u6CE8\u518C\u8868\uFF1A\u6C47\u603B\u5168\u90E8 Shot \u7EC4\u7684 continuityRules\uFF1B\u8DE8\u955C\u5934\u91CD\u590D\u51FA\u73B0\u7684\u89C4\u5219\u5373\u300C\u8FDE\u7EED\u6027\u9501\u300D\uFF08\u89D2\u8272/\u670D\u88C5/\u9053\u5177/\u5149\u7EBF/\u65B9\u4F4D\u8DE8\u955C\u5934\u9501\u5B9A\uFF09\u3002\u8FD4\u56DE\u9010\u955C\u5934\u89C4\u5219 + \u9501\u5217\u8868\uFF08\u89C4\u5219 \xD7 \u51FA\u73B0\u955C\u5934\u6570\uFF09\u3002",
    parameters: {},
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute() {
      return canvas.continuity();
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_prompt_for",
    description: "\u81EA\u52A8\u5408\u6210 prompt \u4E0A\u4E0B\u6587\uFF1A\u6CBF\u5165\u8FB9\u56DE\u6EAF\u76EE\u6807\u8282\u70B9\u7684\u4E0A\u6E38\uFF08\u4E3B\u4F53/\u53C2\u8003\u56FE ref_image_N \u69FD\u4F4D/\u65B9\u5411/\u6807\u9898\uFF09\uFF0Cprompt-first\uFF08\u8282\u70B9\u81EA\u5E26 prompt \u538B\u8FC7\u81EA\u52A8\u7B80\u4ECB\uFF09\u3002\u8FD4\u56DE\u7ED3\u6784\u5316\u5206\u5757\uFF0CLLM \u5408\u6210\u751F\u6210\u63D0\u793A\u8BCD\u5C31\u5728\u6B64\u57FA\u7840\u4E0A\u5B8C\u6210\u2014\u2014\u753B\u5E03\u72B6\u6001\u5230\u63D0\u793A\u8BCD\u7684\u786E\u5B9A\u6027\u4E00\u534A\u3002",
    parameters: {
      nodeId: { type: "string", required: true, description: "Target node id." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.promptFor(String(args.nodeId));
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_snapshots",
    description: "\u753B\u5E03\u5FEB\u7167\u5217\u8868\uFF08\u64A4\u9500\u6B64\u6279\u7684\u68C0\u67E5\u70B9\u7D22\u5F15\uFF1B\u63D0\u6848\u6279\u51C6\u65F6\u81EA\u52A8\u5EFA\u7ACB\uFF0C\u4E0A\u9650 20\uFF09\u3002",
    parameters: {},
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute() {
      return canvas.readSnapshotsIndex();
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_restore",
    description: "\u6062\u590D\u753B\u5E03\u5FEB\u7167\uFF08\u64A4\u9500\u6B64\u6279\uFF09\uFF1A\u628A\u753B\u5E03\u6574\u4F53\u56DE\u6EDA\u5230\u67D0\u4E2A\u68C0\u67E5\u70B9\uFF1B\u5DF2\u751F\u6210\u7D20\u6750\u4FDD\u7559\u5728\u7D20\u6750\u5E93\u3002",
    parameters: {
      snapshotId: { type: "string", required: true, description: "Snapshot id from directorx_canvas_snapshots." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.restoreSnapshot(String(args.snapshotId));
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_shot_order",
    description: "\u786E\u5B9A\u6027\u6392\u7247\uFF1A\u6309\u663E\u5F0F shotIndex\uFF08\u5B58\u50A8\u8EAB\u4EFD\uFF09\u6392\u5E8F\u955C\u5934\u8282\u70B9\uFF0C\u672A\u6807\u7684\u6392\u540E\u3002\u987A\u5E8F\u4E0D\u7528 LLM \u731C\u2014\u2014\u672C\u5DE5\u5177\u8FD4\u56DE\u5373\u6743\u5A01\uFF08\u8282\u70B9\u5750\u6807\u4E0E\u8FDE\u7EBF\u4E0D\u4EE3\u8868\u987A\u5E8F\uFF09\u3002",
    parameters: {
      groupId: { type: "string", description: "Optional parent group id; omit for top-level shots." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.shotSequence(typeof args.groupId === "string" ? args.groupId : void 0);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_summary",
    description: "\u7D27\u51D1\u753B\u5E03\u4E0A\u4E0B\u6587\u5FEB\u7167\uFF1A\u767D\u540D\u5355\u884C\u683C\u5F0F\uFF08id|kind#shotIndex|label \u622A\u65AD 60 \u5B57|parent\uFF09\u2014\u2014\u5582\u7ED9 LLM \u7684\u753B\u5E03\u4E0A\u4E0B\u6587\u4ECE\u5168\u91CF JSON \u7684 2-3k token \u538B\u5230\u51E0\u767E token\uFF0C\u9759\u6001\u524D\u7F00\u53EF\u5403\u7F13\u5B58\u3002",
    parameters: {},
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute() {
      return canvas.summary();
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_shotlist",
    description: "Export a numbered shot list from the canvas (Storyboarder/Boords-style board): shot index, kind, prompt, duration, continuity, status, and a running duration budget. Does not generate media. Use before proposing generation so the user can sign off the board.",
    parameters: {
      target_seconds: { type: "number", description: "Optional target runtime; remaining seconds are reported against the sum of shot durations." }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    isConcurrencySafe: () => true,
    async execute(args) {
      const doc = await canvas.read();
      return formatCanvasShotlist(doc, {
        ...typeof args.target_seconds === "number" && Number.isFinite(args.target_seconds) ? { targetSeconds: args.target_seconds } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_search",
    description: "Search canvas nodes by label substring / kind / group membership. Use it to locate nodes before update/connect (avoid dumping the whole document).",
    parameters: {
      label: { type: "string", description: "Label substring (case-insensitive)." },
      kind: { type: "string", enum: ["image", "video", "text", "group"], description: "Filter by kind." },
      parent: { type: "string", description: "Filter by parent group id." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      const rows = typeof args === "string" ? await canvas.search({ label: args }) : await canvas.search({
        label: typeof args?.label === "string" ? args.label : void 0,
        kind: ["image", "video", "text", "group"].includes(args?.kind) ? args.kind : void 0,
        parent: typeof args?.parent === "string" ? args.parent : void 0
      });
      return { hits: rows, count: rows.length };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_batch",
    description: "Batch add nodes (and optional edges) in one write. Each node accepts the same fields as canvas_add (id/kind/label/path/prompt/shotIndex/parent/x/y). Prefer this or canvas_plan over many canvas_add calls.",
    parameters: {
      nodes: { type: "array", items: { type: "object", additionalProperties: true }, required: true, description: "Nodes to add (same shape as canvas_add arguments)." },
      edges: { type: "array", items: { type: "object", additionalProperties: true }, description: "Optional edges between existing/new node ids." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.batchAdd({ nodes: args.nodes ?? [], edges: args.edges ?? [] });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_dissolve_group",
    description: "Dissolve a group node: its members become top-level (absolute coordinates) and the group plus its edges are removed. Members are NOT deleted.",
    parameters: {
      groupId: { type: "string", required: true, description: "Group node id from directorx_canvas_get." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.dissolveGroup(String(args.groupId));
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_title",
    description: "Set the canvas title (shown in the WebUI header).",
    parameters: {
      title: { type: "string", required: true, description: "New canvas title (max 200 chars)." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.setTitle(String(args.title));
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_layout_hierarchy",
    description: "Lay the canvas out as a left-to-right tree along edge direction (BFS levels; sources at left). Good for script->shot dependency boards.",
    parameters: {
      gapX: { type: "number", description: "Horizontal gap between levels (default 260)." },
      gapY: { type: "number", description: "Vertical gap between siblings (default 140)." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.hierarchyLayout(args.gapX ?? 260, args.gapY ?? 140);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_clear",
    description: "Clear the entire canvas (removes every node and edge). Irreversible; read with directorx_canvas_get first when unsure.",
    parameters: {},
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute() {
      const current = await canvas.read();
      return canvas.write({ version: 1, updatedAt: 0, nodes: [], edges: [] }, current.updatedAt);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_node",
    description: "Read one canvas node or edge by id. Nodes return inbound/outbound edges and group members. Use this instead of canvas_get when you only need one element.",
    parameters: {
      id: { type: "string", required: true, description: "Node or edge id." }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    isConcurrencySafe: () => true,
    async execute(args) {
      return canvas.getNode(String(args.id));
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_groups",
    description: "List every group on the canvas with its members (id/kind/label/shotIndex). The grouping query for DSH before group/dissolve/sequence.",
    parameters: {},
    output: objectOutput(),
    timeoutMs: 15e3,
    isConcurrencySafe: () => true,
    async execute() {
      return canvas.listGroups();
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_group",
    description: "Wrap existing nodes into a new group (act/scene). Members keep their positions; the group frame encloses them. Cannot nest a group inside a group \u2014 dissolve first.",
    parameters: {
      memberIds: { type: "array", items: { type: "string" }, required: true, description: "Node ids to put inside the new group." },
      label: { type: "string", description: "Group label (default \u7EC4)." }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    async execute(args) {
      const memberIds = Array.isArray(args.memberIds) ? args.memberIds.map(String) : [];
      return canvas.groupNodes({ memberIds, ...typeof args.label === "string" ? { label: args.label } : {} });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_disconnect",
    description: "Remove the edge from one node to another by endpoints. Use when you know from/to but not the edge id.",
    parameters: {
      from: { type: "string", required: true, description: "Source node id." },
      to: { type: "string", required: true, description: "Target node id." }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    async execute(args) {
      return canvas.disconnect(String(args.from), String(args.to));
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_sequence",
    description: "Write shot order onto existing nodes: shotIndex becomes 1..N in the given id order. Optionally connect consecutive image/video nodes as \u627F\u63A5 edges. Coordinates do not change.",
    parameters: {
      ids: { type: "array", items: { type: "string" }, required: true, description: "Node ids in playback order." },
      connect: { type: "boolean", description: "When true, wire consecutive media nodes with \u627F\u63A5 edges (default false)." },
      edgeLabel: { type: "string", description: "Label for new edges when connect=true (default \u627F\u63A5)." }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    async execute(args) {
      const ids = Array.isArray(args.ids) ? args.ids.map(String) : [];
      return canvas.sequenceShots({
        ids,
        ...args.connect === true ? { connect: true } : {},
        ...typeof args.edgeLabel === "string" ? { edgeLabel: args.edgeLabel } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_plan",
    description: "\u628A\u5DF2\u786E\u8BA4\u7684\u5206\u955C\u4E00\u6B21\u5199\u5165\u753B\u5E03\uFF08\u5E55=\u7EC4\uFF0C\u955C=\u8282\u70B9\uFF09\u3002\u672A\u5411\u7528\u6237\u786E\u8BA4\u5267\u672C/\u5206\u955C\uFF08directorx_confirm \u6216\u7528\u6237\u660E\u786E\u540C\u610F\u843D\u753B\u5E03\uFF09\u4E4B\u524D\u4E0D\u8981\u8C03\u7528\u3002Does not generate media.",
    parameters: {
      title: { type: "string", description: "Canvas title." },
      connect: { type: "boolean", description: "Wire consecutive image/video shots (default true)." },
      acts: {
        type: "array",
        required: true,
        description: "Acts/scenes. Each has a label and shots[].",
        items: {
          type: "object",
          additionalProperties: true,
          properties: {
            label: { type: "string", required: true, description: "Act/scene name." },
            shots: {
              type: "array",
              required: true,
              items: {
                type: "object",
                additionalProperties: true,
                properties: {
                  kind: { type: "string", enum: ["image", "video", "text"], description: "Default video." },
                  label: { type: "string", required: true, description: "Shot label." },
                  prompt: { type: "string", description: "Stored generation prompt." },
                  seconds: { type: "number", description: "Duration; appended to prompt as Ns for the shot list." },
                  continuity: { type: "array", items: { type: "string" }, description: "Continuity locks." }
                }
              }
            }
          }
        }
      }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      const acts = Array.isArray(args.acts) ? args.acts.map((act) => ({
        label: String(act.label ?? ""),
        shots: Array.isArray(act.shots) ? act.shots.map((shot) => ({
          label: String(shot.label ?? ""),
          ...shot.kind === "image" || shot.kind === "video" || shot.kind === "text" ? { kind: shot.kind } : {},
          ...typeof shot.prompt === "string" ? { prompt: shot.prompt } : {},
          ...typeof shot.seconds === "number" ? { seconds: shot.seconds } : {},
          ...Array.isArray(shot.continuity) ? { continuity: shot.continuity.map(String) } : {}
        })) : []
      })) : [];
      return canvas.planBoard({
        acts,
        ...typeof args.title === "string" ? { title: args.title } : {},
        ...args.connect === false ? { connect: false } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_video_process",
    description: "Deterministic local video processing with ffmpeg: trim (start/end seconds), speed change (0.5-8x), resize (scale like 1280:720 or 16:9), volume adjust, mute, and fps normalization \u2014 all in one call. Free and exact; prefer over regenerating. Output lands in the output dir.",
    parameters: {
      source: { type: "string", required: true, description: "Absolute path of the local video." },
      start: { type: "number", description: "Trim start (seconds)." },
      end: { type: "number", description: "Trim end (seconds)." },
      speed: { type: "number", description: "Playback speed multiplier (0.5-8)." },
      scale: { type: "string", description: "Output size, e.g. 1280:720 or 16:9." },
      volume: { type: "number", description: "Audio volume multiplier (e.g. 0.9)." },
      mute: { type: "boolean", description: "Strip the audio track." },
      fps: { type: "number", description: "Normalize to this frame rate." }
    },
    output: objectOutput(),
    timeoutMs: 6e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return videoProcess({ ...args, outputDir: settings.outputDir });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_video_concat",
    description: "Concatenate multiple local videos into one: normalizes size/fps/audio, then either hard cuts or xfade (cross-fade) transitions with audio acrossfade. Deterministic ffmpeg assembly for multi-shot deliverables. Output lands in the output dir.",
    parameters: {
      files: { type: "array", items: { type: "string" }, required: true, description: "Absolute paths of 2+ local videos in order." },
      transition: { type: "string", enum: ["fade", "cut"], description: "fade = xfade cross-fade (default); cut = hard cuts." },
      fadeSec: { type: "number", description: "Cross-fade duration (default 0.5s)." },
      scale: { type: "string", description: "Common output size (default 1280:720)." }
    },
    output: objectOutput(),
    timeoutMs: 9e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return videoConcat({ ...args, outputDir: settings.outputDir });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_style",
    description: 'Style / camera-language injector grounded in the bundled film knowledge corpus plus research-derived style grammars. Give a style name or craft need (e.g. "\u8D5B\u535A\u670B\u514B", "\u9ED1\u8272\u7535\u5F71", "\u63A8\u955C\u5934 \u9713\u8679\u5149", "\u97E6\u65AF\xB7\u5B89\u5FB7\u68EE", "wong-kar-wai") and get the matching craft article condensed for prompt injection \u2014 append it to generation prompts to lock the look. Never fabricates: returns real corpus text or cited research grammars.',
    parameters: {
      style: { type: "string", required: true, description: "Style name or craft need (Chinese or English). Preset slugs: noir/film-noir, cyberpunk, ghibli, wes-anderson, documentary, commercial, retro-80s, horror, cinematic + research grammars wong-kar-wai / wes-anderson." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      const style = String(args.style ?? "").trim();
      if (style === "") throw new Error("style is required");
      const PRESETS = {
        noir: "\u9ED1\u8272\u7535\u5F71 \u4F4E\u8C03\u5149 \u9634\u5F71",
        "film-noir": "\u9ED1\u8272\u7535\u5F71 \u4F4E\u8C03\u5149 \u9634\u5F71",
        cyberpunk: "\u8D5B\u535A\u670B\u514B \u9713\u8679 \u9AD8\u5BF9\u6BD4",
        ghibli: "\u5409\u535C\u529B \u624B\u7ED8 \u52A8\u753B",
        "wes-anderson": "\u97E6\u65AF\u5B89\u5FB7\u68EE \u5BF9\u79F0 \u590D\u53E4",
        documentary: "\u7EAA\u5F55\u7247 \u7EAA\u5B9E \u81EA\u7136\u5149",
        commercial: "\u5E7F\u544A \u5546\u4E1A \u4EA7\u54C1\u6253\u5149",
        "retro-80s": "80\u5E74\u4EE3 \u590D\u53E4 \u80F6\u7247\u9897\u7C92",
        horror: "\u6050\u6016\u7247 \u9ED1\u6697 \u60AC\u7591",
        cinematic: "\u7535\u5F71\u611F \u8FD0\u955C \u6D45\u666F\u6DF1"
      };
      const GRAMMARS = {
        "wong-kar-wai": {
          anchor: "in the visual language of Wong Kar-wai, shot by Christopher Doyle; 1970s-90s Hong Kong cinema nostalgia",
          palette: "split-toned amber and emerald, sodium-yellow key from streetlamps, electric green spill from signage, cyan haze in mid-ground",
          motion: "step-printed motion, low-frame-rate stutter, slow-shutter smear, speed-ramping, handheld micro-sway",
          negative: "clean digital sharpness, even daylight, wide establishing shot, anamorphic flares, plastic skin, over-stabilized camera, symmetrical composition",
          source: "invideo.io WKW style guide + OpenAI Cookbook"
        },
        "wes-anderson": {
          anchor: "perfectly symmetrical Wes Anderson composition, pastel color palette, flat depth of field, soft light without hard shadows",
          palette: "pastel macaron tones (powder blue, mint, cream, dusty pink), saturated accent colors",
          motion: "Static camera, no movement; whip pans only for transitions; centered framing",
          negative: "handheld shake, dutch angles, high contrast harsh shadows, dark moody lighting",
          source: "VePrompts Wes Anderson template (Veo 3)"
        },
        cyberpunk: {
          anchor: "cyberpunk megacity night, neon-noir aesthetic, rain-slick streets, holographic signage",
          palette: "electric cyan and magenta neon against deep black, sodium-amber highlights, cool blue ambient haze",
          motion: "slow dolly through neon reflections, shallow DOF, occasional handheld micro-sway in crowd scenes",
          negative: "daylight, pastel palette, natural landscape, clean minimalism, bright even lighting",
          source: "corpus 265 genre iconography + cyberpunk research grammar"
        },
        noir: {
          anchor: "film noir aesthetics, 1940s-50s hardboiled cinema, low-key chiaroscuro",
          palette: "monochrome-leaning low-key: deep blacks, single warm key, venetian blind shadow patterns",
          motion: "static locked-off camera with slow push-ins, low angles, cigarette smoke drifting through the frame",
          negative: "bright even lighting, saturated cheerful colors, high-key comedy lighting, modern clean interiors",
          source: "corpus 265 genre iconography + noir research grammar"
        },
        documentary: {
          anchor: "observational documentary realism, natural available light, handheld authenticity",
          palette: "natural ungraded tones, neutral white balance, muted earth colors",
          motion: "handheld follow with gentle sway, slow zooms for emphasis, locked-off interview frames",
          negative: "cinematic color grading, studio lighting, smooth gimbal motion, stylized slow motion",
          source: "corpus documentary preset + Ken Burns narration discipline (rule 5.2)"
        },
        commercial: {
          anchor: "high-end commercial product cinematography, clean studio environment",
          palette: "teal and orange commercial grade, crisp whites, product-color accent lighting",
          motion: "slow dolly and orbit around the product, macro inserts, light leak transitions",
          negative: "grainy footage, dirty surfaces, cluttered background, amateur handheld shake",
          source: "corpus commercial preset + teal-orange research (rule 4.6)"
        },
        ghibli: {
          anchor: "hand-painted Studio Ghibli-inspired animation, watercolor backgrounds, soft character design",
          palette: "pastel watercolor washes, warm sunlight greens, sky blues with painted clouds",
          motion: "gentle parallax pans, floating dust motes, wind through grass and hair",
          negative: "photorealistic, 3D render, live action, sharp digital lines, harsh shadows",
          source: "corpus ghibli preset + style-side locking (rule 27)"
        }
      };
      const grammar = GRAMMARS[style.toLowerCase()];
      if (grammar !== void 0) {
        return {
          style,
          found: true,
          grammar,
          guidance: `${grammar.anchor}\uFF1Bpalette: ${grammar.palette}\uFF1Bmotion: ${grammar.motion}\uFF1Bnegative: ${grammar.negative}`,
          usage: "\u628A guidance \u6574\u6BB5\u5E76\u5165\u63D0\u793A\u8BCD\uFF08\u98CE\u683C\u951A+\u8272\u8C03+\u8FD0\u52A8\u8BED\u6CD5+\u8D1F\u9762\u9501\u56DB\u4EF6\u5957\uFF09\uFF1B\u6765\u6E90\u5DF2\u6CE8\u660E\u3002"
        };
      }
      const query = PRESETS[style.toLowerCase()] ?? style;
      const hits = await corpus.search(query, 3);
      if (hits.length === 0) {
        return { style, found: false, hint: "\u672A\u627E\u5230\u5339\u914D\u7684\u5DE5\u827A\u6587\u7AE0\uFF1B\u6362\u4E00\u4E2A\u98CE\u683C/\u955C\u5934\u8BED\u8A00\u5173\u952E\u8BCD\uFF0C\u6216\u7528 directorx_knowledge_search \u76F4\u63A5\u68C0\u7D22\u3002" };
      }
      const hit = hits[0];
      const article = await corpus.readArticle(hit.id);
      return {
        style,
        found: true,
        article: { id: article.article.id, title: article.article.title },
        guidance: article.content.slice(0, 3500),
        usage: "\u628A guidance \u7684\u5173\u952E\u8BCD/\u53E5\u5F0F\u5E76\u5165\u751F\u6210\u63D0\u793A\u8BCD\uFF1B\u53EF\u7EE7\u7EED directorx_knowledge_read \u8BFB\u5168\u6587\u3002"
      };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_audio_mix",
    description: "Mix extra audio tracks (BGM / narration / SFX) onto a video with ffmpeg: per-track volume, optional sidechain ducking (music dips under the narration), normalized amix. Deterministic and free. Output lands in the output dir.",
    parameters: {
      video: { type: "string", required: true, description: "Absolute path of the video (or audio) to mix onto." },
      tracks: { type: "array", items: { type: "object", additionalProperties: true }, required: true, description: "Extra tracks in order, e.g. [{path, volume?}]; first track sits on top." },
      duckUnder: { type: "number", description: "Duck later tracks under this track index (0-based; typically the narration)." }
    },
    output: objectOutput(),
    timeoutMs: 9e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return audioMix({ ...args, outputDir: settings.outputDir });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_video_subtitle",
    description: "Add subtitles to a local video with ffmpeg. mode=soft muxes the SRT as a selectable mov_text track (works with every ffmpeg build); mode=burn hard-burns the text into the frame (requires a libass build; degrades with a clear error otherwise). Output lands in the output dir.",
    parameters: {
      video: { type: "string", required: true, description: "Absolute path of the local video." },
      srt: { type: "string", required: true, description: "Absolute path of the .srt subtitle file (e.g. from directorx_transcribe_audio)." },
      mode: { type: "string", enum: ["soft", "burn"], description: "soft = selectable subtitle track (default); burn = hard-burned text." }
    },
    output: objectOutput(),
    timeoutMs: 9e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return videoSubtitle({ ...args, outputDir: settings.outputDir });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_preflight",
    description: "Pre-flight audit before paid generation: the four gates from directorx-playbook (\u89C4\u683C/\u5185\u5BB9/\u6210\u672C/\u6743\u5229) checked deterministically \u2014 parameter completeness, six-element prompt lint, budget acknowledgment, and IP/persona/music rights flags. Returns per-gate pass/issues plus a verdict. Use before any batch generation.",
    parameters: {
      prompt: { type: "string", required: true, description: "The generation prompt to audit." },
      model: { type: "string", description: "Model key, if already chosen." },
      type: { type: "string", enum: ["image", "video", "audio"], description: "Task type." },
      size: { type: "string", description: "Size/aspect, e.g. 16:9." },
      duration: { type: "number", description: "Duration in seconds (video)." },
      count: { type: "number", description: "Expected generation count (cost gate)." },
      userConfirmedBudget: { type: "boolean", description: "Whether the user already confirmed the budget." },
      userConfirmedContent: { type: "boolean", description: "Whether the user already confirmed the script/prompt." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return preflight(args);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_video_zoom",
    description: "Ken Burns push-in/pull-back or pan on a local video: animated crop+scale (zoompan is absent from this ffmpeg build). strength = end scale delta (e.g. 0.3 -> 1.3x); direction in/out/left/right. Deterministic and free. Output lands in the output dir.",
    parameters: {
      video: { type: "string", required: true, description: "Absolute path of the local video." },
      strength: { type: "number", description: "End scale delta (default 0.25)." },
      direction: { type: "string", enum: ["in", "out", "left", "right", "tl", "tr", "bl", "br"], description: "in = push-in (default); out = pull-back; left/right/tl/tr/bl/br = pan\uFF08\u5BF9\u89D2\u7EBF\uFF09\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 9e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return videoZoom({ ...args, outputDir: settings.outputDir });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_video_pip",
    description: "Picture-in-picture / sticker overlay: place an image or video on top of a video at a position/size, with an optional visibility window and alpha. Deterministic ffmpeg overlay. Output lands in the output dir.",
    parameters: {
      video: { type: "string", required: true, description: "Absolute path of the base video." },
      overlay: { type: "string", required: true, description: "Absolute path of the overlay image/video." },
      x: { type: "number", description: "Overlay x (default 20)." },
      y: { type: "number", description: "Overlay y (default 20)." },
      w: { type: "number", description: "Overlay width px (default 320; -1 keeps ratio via height)." },
      h: { type: "number", description: "Overlay height px (default -1 = keep ratio)." },
      enable: { type: "array", items: { type: "number" }, description: "Optional [start, end] seconds visibility window." },
      alpha: { type: "number", description: "Overlay opacity 0-1 (default 1)." }
    },
    output: objectOutput(),
    timeoutMs: 9e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return videoPip({ ...args, outputDir: settings.outputDir });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_audio_beat",
    description: "Detect beat/energy peaks in a local audio or video file (ffmpeg astats, deterministic \u2014 no librosa): returns up to N cut-point timestamps with strengths. Use the beats to time cuts in a montage (feed them into directorx_video_process trims + directorx_video_concat).",
    parameters: {
      source: { type: "string", required: true, description: "Absolute path of the audio/video to analyze." },
      count: { type: "number", description: "Max beats returned (default 16)." },
      minGap: { type: "number", description: "Min gap between beats in seconds (default 0.4)." }
    },
    output: objectOutput(),
    timeoutMs: 3e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return audioBeats({ source: args.source, count: args.count, minGap: args.minGap });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_propose",
    description: "Queue a PLACEHOLDER (\u6210\u7247 \u4E25\u683C/\u534F\u540C). \u5FC5\u987B\u5E26 craftId+readyId\u3002\u53C2\u8003\u4E0D\u9F50\u5148 generate_ready\u3002\u4E25\u683C without chosen expands into \u4E8C\u5230\u56DB\u4E2A\u63D0\u793A\u8BCD. After the user picks, call again with chosen=true and that exact prompt to enqueue one \u5360\u4F4D. Does not spend quota.",
    parameters: {
      kind: { type: "string", enum: ["image", "video", "audio"], required: true, description: "Generation kind." },
      prompt: { type: "string", required: true, description: "Task wording, or the exact chosen prompt when chosen=true." },
      chosen: { type: "boolean", description: "true after the user picked one of the \u4E25\u683C variants \u2014 enqueue that single line, do not re-expand." },
      variantCount: { type: "number", description: "\u4E25\u683C options count, clamped 2\u20134. Ignored when chosen=true." },
      model: { type: "string", description: "Model key, if chosen." },
      size: { type: "string", description: "Size/aspect." },
      duration: { type: "number", description: "Duration seconds (video/audio)." },
      count: { type: "number", description: "Generation count (default 1)." },
      estimatedCost: { type: "string", description: "Cost note (the plugin ships no price table \u2014 state the assumption)." },
      note: { type: "string", description: "Free-form note (continuity/anchors/references)." },
      canvasNodeId: { type: "string", description: "Canvas node this proposal is bound to (visible on the board)." },
      craftId: { type: "string", required: true, description: "directorx_prompt_craft id. \u672A\u8C03\u7814\u6210\u7A3F\u4E0D\u80FD\u5360\u4F4D\u3002" },
      readyId: { type: "string", required: true, description: "directorx_generate_ready id. \u53C2\u8003\u4E0D\u9F50\u4E0D\u80FD\u5360\u4F4D\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      const crafted = await requireCraft(settings.outputDir, typeof args.craftId === "string" ? args.craftId : void 0);
      if (!crafted.ok) return crafted;
      const ready = await requireReady(settings.outputDir, typeof args.readyId === "string" ? args.readyId : void 0, {
        craftId: crafted.craft.id,
        kind: args.kind === "image" || args.kind === "video" ? args.kind : void 0
      });
      if (!ready.ok && (args.kind === "image" || args.kind === "video")) return ready;
      const plan = planPlaceholderEnqueue({
        mode: settings.initiative,
        prompt: crafted.craft.prompt,
        chosen: args.chosen === true,
        variantCount: typeof args.variantCount === "number" ? args.variantCount : void 0
      });
      if (plan.expand) {
        const queued = [];
        for (const [index, prompt2] of plan.prompts.entries()) {
          queued.push(await proposals.propose({
            kind: args.kind,
            prompt: prompt2,
            model: args.model,
            size: args.size,
            duration: args.duration,
            count: 1,
            estimatedCost: args.estimatedCost,
            note: `\u4E25\u683C\u53D8\u4F53 ${index + 1}/${plan.prompts.length}\uFF1B\u9009\u5B9A\u540E directorx_propose chosen:true\u3002${args.note ?? ""}`,
            canvasNodeId: args.canvasNodeId,
            craftId: crafted.craft.id,
            ...ready.ok ? { readyId: ready.brief.id } : {}
          }));
        }
        return { ...plan, next: "directorx_confirm", proposals: queued };
      }
      const prompt = plan.prompts[0] ?? crafted.craft.prompt;
      return proposals.propose({
        kind: args.kind,
        prompt,
        model: args.model,
        size: args.size,
        duration: args.duration,
        count: args.count ?? 1,
        estimatedCost: args.estimatedCost,
        note: args.note,
        canvasNodeId: args.canvasNodeId,
        craftId: crafted.craft.id,
        ...ready.ok ? { readyId: ready.brief.id } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_confirm",
    description: "Pause on the DSH ask UI (ctx.userInteraction) to sign off the production board: next pending proposal, multi-select proposals, or the canvas shot list. Applies approve/reject to the ledger. Does not generate media. Prefer this over a free-form ask_user_question after directorx_propose / directorx_canvas_shotlist.",
    parameters: {
      scope: {
        type: "string",
        enum: ["next", "proposals", "shotlist"],
        description: "next = oldest pending proposal; proposals = multi-select pending ids; shotlist = sign the whole board. Default next."
      }
    },
    output: objectOutput(),
    timeoutMs: 3e5,
    async execute(args, exec) {
      const userInteraction = ctx.get("userInteraction");
      if (userInteraction === void 0) {
        throw new Error("directorx_confirm requires DSH userInteraction (Web UI or TUI). This deployment has no ask provider.");
      }
      const scope = args.scope === "proposals" || args.scope === "shotlist" ? args.scope : "next";
      return confirmProduction({
        scope,
        outputDir: settings.outputDir,
        ask: (request) => userInteraction.ask(request),
        agent: exec.agent,
        signal: exec.signal
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_ask",
    description: "Pause on a DSH question card for any fork the user must own (\u65F6\u957F/\u753B\u5E45/\u98CE\u683C/\u63A5\u5165\u534F\u8BAE/\u662F\u5426\u6253\u6700\u77ED\u6D4B\u8BD5). NEVER write a numbered 1.2.3 menu in assistant text \u2014 call this instead. Up to 6 questions, each with options and a recommended default.",
    parameters: {
      question: { type: "string", description: "Single-question shorthand." },
      options: { type: "array", items: { type: "object", additionalProperties: true }, description: "[{label, description?}]" },
      recommended: { type: "string", description: "Default option label." },
      header: { type: "string" },
      detail: { type: "string" },
      multiSelect: { type: "boolean" },
      questions: { type: "array", items: { type: "object", additionalProperties: true }, description: "Full card list if you need more than one fork." }
    },
    output: objectOutput(),
    timeoutMs: 3e5,
    async execute(args, exec) {
      const userInteraction = ctx.get("userInteraction");
      if (userInteraction === void 0) {
        throw new Error("directorx_ask requires DSH userInteraction (Web UI or TUI).");
      }
      const questions = normalizeAskQuestions(args.questions ?? args);
      return presentAsk({
        questions,
        ask: (request) => userInteraction.ask(request),
        agent: exec.agent,
        signal: exec.signal
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_stage",
    description: "\u6210\u7247\u9636\u6BB5\u8D26\u672C\uFF08outputDir/stage.json\uFF09\uFF1Abrief\u2192research\u2192forks\u2192script\u2192cast\u2192storyboard\u2192place\u2192generate\u2192assemble\u2192qa\u2192deliver\u3002\u8BB0\u5F55\u9636\u6BB5\u6027\u4EA7\u7269\uFF0C\u8FC7\u95F8\u7528\u63D0\u95EE\u5361\u3002\u4E0D\u8981\u9759\u9ED8\u8DF3\u9636\u6BB5\u3002",
    parameters: {
      action: { type: "string", enum: ["get", "record", "advance"], description: "Default get." },
      stage: { type: "string", description: "record/advance \u7684\u9636\u6BB5 id\u3002" },
      kind: { type: "string", description: "record: \u4EA7\u7269\u7C7B\u578B\uFF0C\u5982 outline / cast / shotlist / cut\u3002" },
      path: { type: "string", description: "record: \u4EA7\u7269\u8DEF\u5F84\u3002" },
      note: { type: "string", description: "record: \u4E00\u53E5\u8BDD\u8BF4\u660E\u3002" },
      skip: { type: "boolean", description: "advance \u65F6\u8DF3\u8FC7\u5F53\u524D\u9636\u6BB5\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    async execute(args) {
      const store = new ProductionStageStore(settings.outputDir);
      const action = args.action === "record" || args.action === "advance" ? args.action : "get";
      if (action === "record") {
        return store.record({
          stage: parseStageId(args.stage),
          kind: String(args.kind ?? "note"),
          path: typeof args.path === "string" ? args.path : void 0,
          note: typeof args.note === "string" ? args.note : void 0
        });
      }
      if (action === "advance") {
        const to = parseStageId(args.stage);
        if (to === void 0) throw new Error("advance \u9700\u8981\u5408\u6CD5 stage id");
        return store.advance(to, args.skip === true ? "skip" : "done");
      }
      return store.get();
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_proposal_next",
    description: "\u5BA1\u6279\u95E8\u5FAA\u73AF\uFF1A\u8FD4\u56DE\u961F\u5217\u4E2D\u6700\u65E7\u7684\u4E00\u6761\u5F85\u6267\u884C\u63D0\u6848\u2014\u2014\u4F18\u5148\u8FD4\u56DE\u5DF2\u6279\u51C6\u4E14\u672A\u56DE\u586B taskId \u7684\uFF08\u753B\u5E03 UI \u6279\u51C6\u540E\u7531 DSH \u627F\u63A5\u6267\u884C\uFF09\uFF0C\u5426\u5219\u8FD4\u56DE\u6700\u65E7\u5F85\u6279\u51C6\u63D0\u6848\uFF1B\u914D\u5408 directorx_proposal_update \u8D70 \u63D0\u6848\u2192\u6279\u51C6\u2192\u6267\u884C\u2192\u5B8C\u6210 \u7684\u4EBA\u673A\u5BA1\u6279\u73AF\u3002",
    parameters: {},
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute() {
      return proposals.next();
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_proposals",
    description: "List generation proposals (the placeholder queue). Omit status for the latest across states; filter by proposed/approved/rejected/done.",
    parameters: {
      status: { type: "string", enum: ["proposed", "approved", "rejected", "done"], description: "Optional status filter." },
      limit: { type: "number", description: "Max entries (default 50)." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return proposals.list(args.status, args.limit ?? 50);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_proposal_update",
    description: "Update a proposal status (proposed -> approved/rejected/done). Approving moves it to the execution queue; done marks it executed with its artifact.",
    parameters: {
      id: { type: "string", required: true, description: "Proposal id from directorx_proposals." },
      status: { type: "string", enum: ["proposed", "approved", "rejected", "done"], required: true, description: "New status." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      const status = args.status;
      if (status === "approved") {
        try {
          await canvas.snapshot(`proposal-${String(args.id)}`);
        } catch {
        }
      }
      return proposals.update(String(args.id), status);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_video_understand",
    description: "Understand a local video shot-by-shot: samples N frames (default 6), describes each through the configured vision capability, and returns probe metadata + per-frame descriptions. Degrades to frame paths + metadata when vision is unavailable (the agent can still reason over frames itself). Use for \u62C9\u7247/\u590D\u76D8/\u7D20\u6750\u7406\u89E3 before editing.",
    parameters: {
      source: { type: "string", required: true, description: "Absolute path of the local video." },
      frames: { type: "number", description: "Frame sample count (default 6, max 12)." },
      question: { type: "string", description: "Optional per-frame question override." }
    },
    output: objectOutput(),
    timeoutMs: 9e5,
    async execute(args) {
      return videoUnderstand({
        source: String(args.source),
        outputDir: settings.outputDir,
        settings,
        vision: settings.vision,
        frames: args.frames,
        question: args.question
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_character_register",
    description: "Register a character/subject anchor: a reference image + description stored in characters.json. Later generation calls can pass the character name via the `characters` parameter and the reference + description are injected automatically \u2014 the subject-consistency pattern used across multi-shot productions (Runway Gen-4 / Kling 3.0 subject reference).",
    parameters: {
      name: { type: "string", required: true, description: "Character name (unique; re-registering overwrites)." },
      description: { type: "string", description: "Appearance description (stable features only: hair/outfit/scars/props)." },
      refPath: { type: "string", required: true, description: "Reference image path (local output-dir media or http(s) URL). \u6807\u51C6\uFF08Runway \u5B98\u65B9\uFF09\uFF1A\u81EA\u7136\u5747\u5300\u5149 + \u4E2D\u6027\u8868\u60C5 + \u4E2D\u7B49\u753B\u8D28\uFF08\u300C\u7A7A\u767D\u753B\u5E03\u300D\u539F\u5219\uFF0C\u4FBF\u4E8E\u8DE8\u573A\u666F\u6539\u9020\uFF09\u3002" },
      outfit: { type: "string", description: "\u7EC4\u88C5\u5F0F\u89D2\u8272\uFF1A\u670D\u88C5\u63CF\u8FF0\uFF08\u5916\u89C2\u5C42\uFF0C\u53EF\u5355\u72EC\u6362\u88C5\u4E0D\u6539\u8EAB\u4EFD\uFF09\u3002" },
      props: { type: "string", description: "\u7EC4\u88C5\u5F0F\u89D2\u8272\uFF1A\u968F\u8EAB\u9053\u5177\u63CF\u8FF0\uFF08\u9053\u5177\u5C42\uFF0C\u5982\u6B66\u5668/\u914D\u9970\uFF09\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return new CharacterStore(settings.outputDir).register({ name: String(args.name), description: args.description, refPath: String(args.refPath), outfit: typeof args.outfit === "string" ? args.outfit : void 0, props: typeof args.props === "string" ? args.props : void 0 });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_character_list",
    description: "List registered character anchors (names + descriptions + reference paths).",
    parameters: {},
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute() {
      return new CharacterStore(settings.outputDir).list();
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_studio",
    description: `\u6253\u5F00\u56FE\u7247/\u89C6\u9891\u7F16\u8F91\u5DE5\u4F5C\u53F0\uFF0C\u5E76\u6309\u81EA\u7136\u8BED\u8A00\u505A\u786E\u5B9A\u6027\u8C03\u8272\uFF08${listGradeLabels()}\uFF09\u3002\u7528\u6237\u8BF4\u300C\u628A\u8FD9\u5F20\u7167\u7247\u8C03\u6210\u672B\u65E5\u8352\u571F\u914D\u8272\u300D\u65F6\uFF1A\u89E3\u6790 look \u2192 ffmpeg \u8C03\u8272 \u2192 \u56DE\u5199\u753B\u5E03\u8282\u70B9 path \u2192 \u901A\u77E5 WebUI \u6253\u5F00\u5BF9\u5E94\u7F16\u8F91\u53F0\u3002\u4E0D\u5199 generating\u3002\u4E0D\u8981\u7528\u751F\u6210\u6A21\u578B\u91CD\u7ED8\u6765\u5B8C\u6210\u8C03\u8272\u3002`,
    parameters: {
      prompt: { type: "string", required: true, description: "\u8C03\u8272/\u7F16\u8F91\u610F\u56FE\uFF0C\u5982\u300C\u672B\u65E5\u8352\u571F\u914D\u8272\u300D\u300C\u6F02\u767D\u65C1\u8DEF\u300D\u300C\u4EA4\u53C9\u51B2\u5370\u300D\u300C\u591C\u8272\u300D\u300C\u91D1\u9EC4\u660F\u300D\u3002" },
      path: { type: "string", description: "\u672C\u5730\u5A92\u4F53\u8DEF\u5F84\u3002\u53EF\u4E0E nodeId \u4E8C\u9009\u4E00\u3002" },
      nodeId: { type: "string", description: "\u753B\u5E03\u8282\u70B9 id\u3002\u6709\u5219\u56DE\u5199 path\uFF0C\u5E76\u6309\u8282\u70B9 kind \u6253\u5F00\u7F16\u8F91\u53F0\u3002" },
      kind: { type: "string", enum: ["image", "video"], description: "\u8986\u76D6\u81EA\u52A8\u5224\u65AD\u7684\u5A92\u4F53\u7C7B\u578B\u3002" },
      openOnly: { type: "boolean", description: "\u53EA\u6253\u5F00\u7F16\u8F91\u53F0\u3001\u4E0D\u8C03\u8272\u3002\u9ED8\u8BA4 false\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 6e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      const canvas2 = new DirectorxCanvasStore(settings.outputDir);
      const nodeId = typeof args.nodeId === "string" && args.nodeId !== "" ? args.nodeId : "";
      let path = typeof args.path === "string" ? args.path.trim() : "";
      let kind = args.kind === "video" || args.kind === "image" ? args.kind : void 0;
      if (nodeId !== "") {
        const found = await canvas2.getNode(nodeId);
        if (found.kind !== "node") throw new Error(`nodeId ${nodeId} \u4E0D\u662F\u5A92\u4F53\u8282\u70B9`);
        if (found.node.kind !== "image" && found.node.kind !== "video") throw new Error(`\u8282\u70B9 ${nodeId} \u4E0D\u662F\u56FE\u7247/\u89C6\u9891`);
        if (path === "") path = found.node.path ?? "";
        kind = kind ?? found.node.kind;
      }
      if (path === "") throw new Error("\u9700\u8981 path \u6216\u5E26\u5A92\u4F53\u7684 nodeId");
      const source = resolveMediaPath(settings.outputDir, path);
      const mediaKind = kind ?? inferMediaKind(source);
      if (args.openOnly === true) {
        const ticket2 = await new StudioTicketStore(settings.outputDir).write({ kind: mediaKind, path: source, ...nodeId !== "" ? { nodeId } : {} });
        return { ok: true, openStudio: true, kind: mediaKind, path: source, nodeId: nodeId || void 0, ticket: ticket2 };
      }
      const look = resolveGradeLook(String(args.prompt ?? ""));
      const graded = await applyGrade({ source, look, outputDir: settings.outputDir, kind: mediaKind });
      if (nodeId !== "") await canvas2.update(nodeId, { path: graded.path });
      const ticket = await new StudioTicketStore(settings.outputDir).write({
        kind: graded.kind,
        path: graded.path,
        look: graded.look,
        ...nodeId !== "" ? { nodeId } : {}
      });
      return { ok: true, openStudio: true, ...graded, nodeId: nodeId || void 0, ticket };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_edit",
    description: "\u610F\u56FE\u9A71\u52A8\u526A\u8F91\uFF1A\u628A\u81EA\u7136\u8BED\u8A00\u526A\u8F91\u6307\u4EE4\uFF08\u300C\u53BB\u6389\u5F00\u5934 2 \u79D2\u300D\u300C\u53EA\u4FDD\u7559 3 \u5230 10 \u79D2\u300D\u300C5-8 \u79D2\u653E\u6162 2 \u500D\u300D\u300C\u6574\u4E2A\u5012\u653E\u300D\uFF09\u89E3\u6790\u6210\u786E\u5B9A\u6027\u65F6\u95F4\u8F74\u5E76\u6E32\u67D3\u6210\u7247\u3002\u591A\u6761\u6307\u4EE4\u6309\u987A\u5E8F\u5E94\u7528\uFF08cut list \u8BED\u4E49\uFF09\u3002\u6539\u6307\u4EE4=\u91CD\u6E32\u67D3\uFF0C\u96F6 API \u6210\u672C\u3002",
    parameters: {
      video: { type: "string", required: true, description: "Absolute path of the source video." },
      edits: { type: "array", items: { type: "string" }, required: true, description: "Natural-language edit instructions (or one string split by punctuation)." }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      const source = String(args.video);
      const raw = Array.isArray(args.edits) ? args.edits.map(String) : typeof args.edits === "string" && args.edits !== "" ? [args.edits] : [];
      const instructions = raw.length === 1 ? raw[0].split(/[；;。]+/).map((piece) => piece.trim()).filter((piece) => piece !== "") : raw;
      const probe = probeMedia(source);
      const commands = parseEditInstructions(instructions, probe.durationSec);
      const scenes = editsToScenes(commands, probe.durationSec).map((scene) => ({ ...scene, source }));
      if (commands.length === 0) throw new Error("\u6CA1\u6709\u89E3\u6790\u51FA\u53EF\u6267\u884C\u7684\u526A\u8F91\u6307\u4EE4\uFF08\u652F\u6301\uFF1A\u53BB\u6389\u5F00\u5934/\u7ED3\u5C3E N \u79D2\u3001\u53EA\u4FDD\u7559 X \u5230 Y \u79D2\u3001X-Y \u79D2\u53D8\u901F Z \u500D\u3001\u6574\u4E2A\u5012\u653E\uFF09");
      if (scenes.length === 0) throw new Error(`\u526A\u8F91\u7A97\u53E3\u88AB\u88C1\u526A\u4E3A\u7A7A\uFF08\u6E90\u65F6\u957F ${probe.durationSec}s\uFF0C\u88C1\u526A\u91CF\u8D85\u8FC7\u53EF\u4FDD\u7559\u8303\u56F4\uFF09\u2014\u2014\u8C03\u6574\u6307\u4EE4\u6216\u6362\u66F4\u957F\u7684\u7D20\u6750`);
      const rendered = await renderTimeline({ scenes }, settings.outputDir);
      return { commands, timeline: scenes, path: rendered.path, steps: rendered.steps, probe: rendered.probe };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_timeline",
    description: "Render a timeline JSON into a finished cut (OTIO-inspired subset \u2014 the editing agent's central format): scenes with per-scene trims, cross-fade/hard-cut concat, optional audio mixing with ducking, and subtitle muxing. Deterministic and re-renderable: change the plan, re-render, never re-generate. timeline = { scenes: [{source, trim?, transition?}], subtitle?, audio? [{path, volume?, duckUnder?}], scale? }.",
    parameters: {
      timeline: { type: "object", additionalProperties: true, required: true, description: "Timeline spec: scenes array + optional subtitle srt path, audio tracks, scale." }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      const timeline = args.timeline ?? {};
      return renderTimeline({
        scenes: Array.isArray(timeline.scenes) ? timeline.scenes : [],
        subtitle: timeline.subtitle,
        audio: Array.isArray(timeline.audio) ? timeline.audio : void 0,
        scale: timeline.scale
      }, settings.outputDir);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_audio_sync",
    description: "\u97F3\u753B\u540C\u51FA: detect narration speech boundaries (silencedetect), mix narration + optional BGM onto the video with ducking, and mux subtitles \u2014 returning speech intervals as timing anchors so scene cuts align with the voice track. Deterministic and free. Output lands in the output dir.",
    parameters: {
      video: { type: "string", required: true, description: "Absolute path of the base video." },
      narration: { type: "string", required: true, description: "Narration audio path (e.g. from directorx_generate_audio)." },
      bgm: { type: "string", description: "Optional BGM audio path (mixed at 0.3, ducked under narration)." },
      srt: { type: "string", description: "Optional .srt subtitle path to mux." }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return audioSync({
        video: String(args.video),
        narration: String(args.narration),
        bgm: typeof args.bgm === "string" ? args.bgm : void 0,
        srt: typeof args.srt === "string" ? args.srt : void 0,
        outputDir: settings.outputDir
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_intents",
    description: "List or atomically claim DSH-owned canvas generate directives queued by the WebUI generate bar. Prefer claim:true so two turns cannot take the same intent. Then execute with directorx_canvas_continue / canvas_* / propose / generate \u2014 the canvas UI does not write generating nodes.",
    parameters: {
      status: { type: "string", enum: ["pending", "taken", "done", "cancelled"], description: "Filter when listing; omit for all, newest first." },
      claim: { type: "boolean", description: "If true, take the oldest pending intent (status becomes taken) and return it with a session prompt. Ignores status filter." }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    async execute(args) {
      if (args.claim === true) {
        const intent = await intents.takeNext();
        if (intent === null) return { intent: null, pending: 0 };
        const doc = await canvas.read();
        const source = intent.sourceId !== void 0 ? doc.nodes.find((node) => node.id === intent.sourceId) : void 0;
        return {
          intent,
          prompt: formatDshCanvasPrompt(intent, { sourceLabel: source?.label }),
          canvasTitle: doc.title ?? "",
          nodeCount: doc.nodes.length,
          summary: (await canvas.summary()).slice(0, 40)
        };
      }
      const status = args.status === "pending" || args.status === "taken" || args.status === "done" || args.status === "cancelled" ? args.status : void 0;
      return { intents: await intents.list(status) };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_intent_ack",
    description: "Mark a canvas intent taken (you started) or done (canvas mutated). Call after directorx_canvas_continue / generate.",
    parameters: {
      id: { type: "string", required: true, description: "Intent id from directorx_canvas_intents." },
      status: { type: "string", enum: ["taken", "done"], required: true, description: "taken = claimed; done = applied on the canvas." }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    async execute(args) {
      const status = args.status === "done" ? "done" : "taken";
      return intents.ack(String(args.id), status);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_continue",
    description: "DSH-owned continue-generate: drop a generating placeholder wired from sourceId. \u5FC5\u987B\u5E26 readyId\u2014\u2014\u53C2\u8003\u4E0D\u9F50\u4E0D\u8BB8\u843D generating \u8282\u70B9\u3002",
    parameters: {
      sourceId: { type: "string", description: "Existing node to wire from. Omit to place a free node." },
      kind: { type: "string", enum: ["image", "video"], description: "Defaults from the source kind (image/video \u2192 video, else image)." },
      prompt: { type: "string", required: true, description: "Generation prompt for the placeholder." },
      readyId: { type: "string", required: true, description: "directorx_generate_ready id." },
      craftId: { type: "string", description: "Optional craftId to pair with readyId." }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    async execute(args) {
      const kind = args.kind === "image" || args.kind === "video" ? args.kind : void 0;
      const ready = await requireReady(settings.outputDir, typeof args.readyId === "string" ? args.readyId : void 0, {
        ...typeof args.craftId === "string" ? { craftId: args.craftId } : {},
        ...kind !== void 0 ? { kind } : {}
      });
      if (!ready.ok) return ready;
      return canvas.continueGenerate({
        prompt: ready.brief.prompt || String(args.prompt),
        ...typeof args.sourceId === "string" && args.sourceId !== "" ? { sourceId: args.sourceId } : {},
        ...kind !== void 0 ? { kind } : { kind: ready.brief.kind }
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_branch",
    description: "Branch a canvas node into labelled variants for multi-version comparison (Sora 2 remix pattern): clones the source N times into a new\u300C\u2026 \u5206\u652F\u63A2\u7D22\u300Dgroup. Use it to keep every candidate on the board; pick the winner with directorx_canvas_update afterwards.",
    parameters: {
      nodeId: { type: "string", required: true, description: "Source node id to branch." },
      variations: { type: "array", items: { type: "string" }, required: true, description: 'Variation labels, e.g. ["\u51B7\u6696\u5BF9\u6BD4\u8272\u8C03", "\u6781\u81F4\u9713\u8679\u8FC7\u66DD", "\u4F4E\u9971\u548C\u80F6\u7247\u611F"].' }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.branch(String(args.nodeId), Array.isArray(args.variations) ? args.variations.map(String) : []);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_subtitle_cut",
    description: "Cut a video at subtitle cue boundaries (FunClip-style \u6309\u6587\u672C\u6253\u70B9\u526A\u8F91): parses the SRT, optionally filters cues by a keyword, pads each window, merges overlaps, and renders the cut via the timeline pipeline. The talking-video/montage assembly step for caption-driven edits.",
    parameters: {
      video: { type: "string", required: true, description: "Absolute path of the local video." },
      srt: { type: "string", required: true, description: "Absolute path of the .srt file (e.g. from directorx_transcribe_audio)." },
      include: { type: "string", description: "Only cut cues whose text contains this keyword." },
      pad: { type: "number", description: "Padding seconds around each cue (default 0.15)." }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return subtitleCut({
        video: String(args.video),
        srt: String(args.srt),
        outputDir: settings.outputDir,
        include: typeof args.include === "string" ? args.include : void 0,
        pad: typeof args.pad === "number" ? args.pad : void 0
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_storyboard",
    description: "Storyboard duration planning (PenShot-inspired deterministic layer): allocates per-shot durations against model limits, clamps out-of-range values, fills unspecified shots toward the target, and checks continuity anchors (every shot must reference registered characters/scenes). Returns a generation-ready shot plan + issues.",
    parameters: {
      shots: { type: "array", items: { type: "object", additionalProperties: true }, required: true, description: "Shot list: [{id?, description, seconds?}]." },
      targetSeconds: { type: "number", description: "Whole-film target (e.g. 30)." },
      maxShotSeconds: { type: "number", description: "Provider clamp (default 10)." },
      minShotSeconds: { type: "number", description: "Minimum shot duration (default 1)." },
      anchors: { type: "object", additionalProperties: true, description: 'Continuity anchors: { characters: ["\u4E3B\u89D2"], scenes: ["\u96E8\u591C\u5C0F\u5DF7"] }.' }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return planStoryboard({
        shots: Array.isArray(args.shots) ? args.shots : [],
        targetSeconds: args.targetSeconds,
        maxShotSeconds: args.maxShotSeconds,
        minShotSeconds: args.minShotSeconds,
        anchors: args.anchors
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_video_analyze",
    description: "Comprehensive deterministic video analysis (\u62C9\u7247): scene-cut detection (per-frame signalstats luminance deltas), per-shot segments with durations, representative frames, optional per-shot vision descriptions, and an audio loudness summary. Use before editing/recut decisions; base claims on the returned data.",
    parameters: {
      source: { type: "string", required: true, description: "Absolute path of the local video." },
      cutThreshold: { type: "number", description: "Luminance delta threshold for cut detection (default 12)." },
      minShotSec: { type: "number", description: "Minimum shot length in seconds (default 0.4)." },
      describe: { type: "boolean", description: "Describe each shot via the vision capability (needs vision configured)." }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return videoAnalyze({
        source: String(args.source),
        outputDir: settings.outputDir,
        settings,
        vision: settings.vision,
        cutThreshold: args.cutThreshold,
        minShotSec: args.minShotSec,
        describe: args.describe === true
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_orchestrate",
    description: "Optional helper: draft a placeholder-first production plan (research + confirm questions + prompt/model/spec units) without generating. The agent can also do this itself with brief, knowledge_search, recipe_read, and directorx_propose.",
    parameters: {
      request: { type: "string", required: true, description: "The user's production request, any brand / source work / remake subject." },
      materials: { type: "array", items: { type: "string" }, description: "Optional local material paths." }
    },
    output: objectOutput(),
    timeoutMs: 6e4,
    async execute(args) {
      return orchestrateProduction({
        request: String(args.request),
        outputDir: settings.outputDir,
        materials: Array.isArray(args.materials) ? args.materials.map(String) : []
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_chengpian",
    description: "\u6210\u7247 persona decision. Call before asking or generating. When confirm=true it also returns `ask` cards \u2014 pass them to directorx_ask (or set present:true to pause now). Pair with directorx_knowledge_search / directorx_skill_read / directorx_stage.",
    parameters: {
      event: { type: "string", enum: ["unclear", "generate", "placeholder-batch"], required: true, description: "unclear = \u4E0D\u660E\u786E\u4E8B\u4EF6; generate = \u4E00\u4E2A\u751F\u6210\u4EFB\u52A1; placeholder-batch = \u6574\u6279\u5360\u4F4D\u3002" },
      prompt: { type: "string", description: "Generation task wording, or the exact chosen prompt." },
      chosen: { type: "boolean", description: "true after the user picked one \u4E25\u683C variant." },
      proposalStatus: { type: "string", description: "If executing: proposed/approved/rejected/done of the queued \u5360\u4F4D." },
      inBudget: { type: "boolean", description: "\u81EA\u52A8 only: false if this unit would exceed the agreed budget." },
      necessaryAsk: { type: "boolean", description: "\u81EA\u52A8 only: true if this ambiguity must be asked." },
      variantCount: { type: "number", description: "\u4E25\u683C: how many of \u4E8C\u5230\u56DB\u4E2A\u63D0\u793A\u8BCD (clamped 2\u20134)." },
      present: { type: "boolean", description: "true = \u7ACB\u523B\u5F39\u51FA\u63D0\u95EE\u5361\uFF0C\u4E0D\u8981\u53EA\u8FD4\u56DE JSON\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e5,
    async execute(args, exec) {
      const decision = runChengpianEvent({
        mode: settings.initiative,
        event: args.event,
        prompt: args.prompt,
        inBudget: args.inBudget,
        necessaryAsk: args.necessaryAsk,
        variantCount: args.variantCount
      });
      const enqueue = args.event === "unclear" ? void 0 : planPlaceholderEnqueue({
        mode: settings.initiative,
        prompt: String(args.prompt ?? ""),
        chosen: args.chosen === true,
        variantCount: args.variantCount
      });
      const auth = args.proposalStatus !== void 0 ? resolveGenerateAuthorization({
        mode: settings.initiative,
        prompt: args.prompt,
        inBudget: args.inBudget,
        proposal: { status: String(args.proposalStatus), prompt: String(args.prompt ?? "") }
      }) : resolveGenerateAuthorization({
        mode: settings.initiative,
        prompt: args.prompt,
        inBudget: args.inBudget
      });
      const ask = decision.confirm ? chengpianAskQuestions(decision, args.event) : [];
      let answers;
      if (args.present === true && ask.length > 0) {
        const userInteraction = ctx.get("userInteraction");
        if (userInteraction === void 0) throw new Error("directorx_chengpian present \u9700\u8981 DSH userInteraction");
        answers = (await presentAsk({
          questions: normalizeAskQuestions(ask),
          ask: (request) => userInteraction.ask(request),
          agent: exec.agent,
          signal: exec.signal
        })).answers;
      }
      return { ...decision, enqueue, auth, ask, answers, next: ask.length > 0 && answers === void 0 ? "directorx_ask" : void 0 };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_brief",
    description: "Intent understanding (\u610F\u56FE\u5206\u8BCA): turns a raw user request + materials into a structured production brief \u2014 type, platform, duration, questions, suggestedFlow, and a compose map (recipe + stages + tools). Follow compose.nextActions yourself with existing tools. directorx_orchestrate is optional.",
    parameters: {
      request: { type: "string", required: true, description: "The user's raw request text." },
      materials: { type: "array", items: { type: "string" }, description: "Optional local material paths (media files)." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return brief({ request: String(args.request), materials: Array.isArray(args.materials) ? args.materials.map(String) : [], outputDir: settings.outputDir });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_smart_cut",
    description: "LLM \u7CBE\u526A\uFF08deterministic matcher\uFF09: the agent writes the narration script; this tool locates each sentence's best-matching subtitle cue (character-overlap scoring) in the source video and assembles the matched windows into a finished cut via the timeline pipeline. \u667A\u80FD\u6210\u7247 for \u53E3\u64AD\u7CBE\u526A/\u7D20\u6750\u5B9A\u4F4D.",
    parameters: {
      video: { type: "string", required: true, description: "Absolute path of the source video." },
      srt: { type: "string", required: true, description: "Absolute path of the .srt transcript (directorx_transcribe_audio)." },
      script: { type: "array", items: { type: "string" }, required: true, description: "Script sentences (or one full text, split by punctuation)." },
      pad: { type: "number", description: "Padding seconds around each matched cue (default 0.15)." }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return smartCut({
        video: String(args.video),
        srt: String(args.srt),
        script: Array.isArray(args.script) ? args.script.map(String) : [],
        outputDir: settings.outputDir,
        pad: typeof args.pad === "number" ? args.pad : void 0
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_qa_report",
    description: "One-call QC report card: runs directorx_qa against the brief and mirrors the verdict + per-check evidence + rule citations onto the canvas as a\u300C\u8D28\u68C0\uFF5C\u2026\u300Dtext node. The standardized final-cut QA card for every deliverable.",
    parameters: {
      source: { type: "string", required: true, description: "Absolute path of the rendered video." },
      expect: { type: "object", additionalProperties: true, description: "Expected brief: { targetSeconds?, aspectRatio?, hasAudio?, minShots?, maxShots?, rhythm?, asl? [min,max] }." },
      title: { type: "string", description: "Optional report title (defaults to the file name)." }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      const expect = args.expect ?? {};
      const report = await qaCheck({ source: String(args.source), outputDir: settings.outputDir, expect }, settings, settings.vision);
      const name2 = typeof args.title === "string" && args.title !== "" ? args.title : String(args.source).split("/").pop();
      const lines = [`\u8D28\u68C0\uFF5C${name2}`, `verdict: ${report.verdict}`, ...report.checks.map((check) => `${check.pass ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`), "\u89C4\u5219\u5F15\u7528: directorx-methodology\uFF08\u8282\u594F\u89C4\u5219 2/10\uFF0C\u9ED1\u5E27\u767D\u5E27\u89C4\u5219\u7531\u786E\u5B9A\u6027\u4FE1\u53F7\u5206\u6790\u8986\u76D6\uFF09"];
      const doc = await canvas.read();
      const maxBottom = doc.nodes.reduce((max, node2) => Math.max(max, node2.y + (node2.height ?? 120)), 0);
      const nodeId = `qc-${Date.now()}`;
      const updatedDoc = await canvas.addNode({ id: nodeId, kind: "text", label: lines.join("\n"), x: 0, y: maxBottom + 60, width: 420, height: 60 + report.checks.length * 40 });
      const node = updatedDoc.nodes.find((candidate) => candidate.id === nodeId);
      return { qa: report, canvasNodeId: node?.id ?? nodeId };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_qa",
    description: "Deterministic final-cut QC gate (\u6210\u7247\u8D28\u68C0): checks duration vs target, aspect ratio, audio presence, shot-count sanity and loudness \u2014 built on videoAnalyze. Frame-level visual QA stays with directorx_extract_frames + directorx_view_image (frame-qa skill). Returns per-check pass/issues + verdict.",
    parameters: {
      source: { type: "string", required: true, description: "Absolute path of the rendered video." },
      expect: { type: "object", additionalProperties: true, description: "Expected brief: { targetSeconds?, aspectRatio?, hasAudio?, minShots?, maxShots? }." }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      const expect = args.expect ?? {};
      return qaCheck({ source: String(args.source), outputDir: settings.outputDir, expect }, settings, settings.vision);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_clip_rank",
    description: "Candidate clip ranking (\u7D20\u6750\u5B9A\u4F4D): scores every subtitle cue against the script semantics (character overlap) and returns the ranked candidates for the agent to assemble into a cut \u2014 the scoring step of the ESA/NarratoAI \u7CBE\u526A pipeline.",
    parameters: {
      srt: { type: "string", required: true, description: "Absolute path of the .srt transcript." },
      script: { type: "array", items: { type: "string" }, required: true, description: "Script sentences (or keyword groups) to match against." },
      topN: { type: "number", description: "Max candidates (default 10)." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return clipRank({ srt: String(args.srt), script: Array.isArray(args.script) ? args.script.map(String) : [], topN: args.topN });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_media_list",
    description: "\u5A92\u4F53\u8D44\u4EA7\u5E93\uFF1A\u5217\u51FA\u8F93\u51FA\u76EE\u5F55\u4E0B\u7684\u5168\u90E8\u5A92\u4F53\u6587\u4EF6\uFF08\u9876\u5C42 + edited/frames/transcripts\uFF09\uFF0C\u542B\u8DEF\u5F84/\u7C7B\u578B/\u5927\u5C0F\u3002\u7528\u5B83\u5728\u526A\u8F91/\u6DF7\u526A\u524D\u76D8\u70B9\u53EF\u7528\u7D20\u6750\uFF08\u7D20\u6750\u76D8\u70B9\u6B65\uFF09\uFF0C\u5177\u4F53\u89C4\u683C\u518D\u5BF9\u5355\u4E2A\u6587\u4EF6 directorx_probe_media\u3002",
    parameters: {},
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute() {
      const files = await listMediaFiles(settings.outputDir);
      return { files, count: files.length };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_style_lock",
    description: "\u9879\u76EE\u98CE\u683C\u5E38\u91CF\u9501\uFF1Acamera / palette / lighting / sceneAnchors / negativeBaseline \u4E00\u6B21\u5B9A\u4E49\u5B58 style.json\uFF0C\u4E4B\u540E\u6BCF\u4E2A\u751F\u6210\u63D0\u793A\u8BCD\u9010\u5B57\u590D\u7528\u540C\u4E00\u6BB5\u5E38\u91CF\u5757\uFF08\u8DE8\u62CD\u4E00\u81F4\u6027\u9760\u590D\u7528\u5E38\u91CF\u6587\u672C\uFF0C\u4E0D\u9760\u6BCF\u6B21\u91CD\u5199\uFF09\u3002",
    parameters: {
      camera: { type: "string", description: "\u673A\u4F4D/\u955C\u5934\u8BED\u8A00\u5E38\u91CF\uFF0C\u5982\u300C35mm anamorphic, \u6D45\u666F\u6DF1, \u9759\u6B62\u6216\u7F13\u6162\u63A8\u8F68\u300D" },
      palette: { type: "string", description: "\u8272\u8C03\u5E38\u91CF\uFF0C\u5982\u300C\u9752\u6A59\u5206\u8C03, \u7425\u73C0\u9AD8\u5149, 3-5 \u4E2A\u951A\u8272\u300D" },
      lighting: { type: "string", description: "\u5E03\u5149\u5E38\u91CF\uFF08\u5149\u6E90\u65B9\u5411/\u8272\u6E29/\u9634\u5F71\uFF09\uFF0C\u5982\u300C\u5DE6\u4FA7\u67D4\u7A97\u4E3B\u5149 5600K, \u6696\u706F\u8865\u5149\u300D" },
      sceneAnchors: { type: "array", items: { type: "string" }, description: "\u573A\u666F\u951A\u70B9\u5217\u8868\uFF08\u6BCF\u573A\u666F\u7684\u56FA\u5B9A\u63CF\u8FF0\u77ED\u53E5\uFF09" },
      negativeBaseline: { type: "string", description: "\u8D1F\u9762\u57FA\u7EBF\uFF08\u9ED8\u8BA4\u56DB\u7C7B\u4F2A\u5F71 + \u98CE\u683C\u8FB9\u754C\uFF09" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return new ProjectStyleStore(settings.outputDir).set({
        camera: typeof args.camera === "string" ? args.camera : void 0,
        palette: typeof args.palette === "string" ? args.palette : void 0,
        lighting: typeof args.lighting === "string" ? args.lighting : void 0,
        sceneAnchors: Array.isArray(args.sceneAnchors) ? args.sceneAnchors.map(String) : void 0,
        negativeBaseline: typeof args.negativeBaseline === "string" ? args.negativeBaseline : void 0
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_terms_set",
    description: "\u9879\u76EE\u672F\u8BED\u5B57\u5178\uFF1A\u8BBE\u7F6E\u672F\u8BED \u2192 \u671F\u671B\u8BFB\u6CD5/\u5199\u6CD5\uFF08terms.json\uFF09\u3002\u914D\u97F3/\u5B57\u5E55\u9636\u6BB5\u6309\u53E5\u547D\u4E2D\u6CE8\u5165\u2014\u2014\u4E13\u6709\u540D\u8BCD\u8BFB\u97F3\u3001\u54C1\u724C\u540D\u5927\u5C0F\u5199\u7B49\u8DE8\u96C6\u4E00\u81F4\u3002",
    parameters: {
      entries: { type: "array", items: { type: "object", additionalProperties: true }, required: true, description: "[{term: \u539F\u6587\u672F\u8BED, reading: \u671F\u671B\u8BFB\u6CD5/\u5199\u6CD5}]" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return new TermStore(settings.outputDir).set(Array.isArray(args.entries) ? args.entries : []);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_terms_match",
    description: "\u6309\u53E5\u547D\u4E2D\u672F\u8BED\u5B57\u5178\uFF1A\u8FD4\u56DE\u6587\u672C\u4E2D\u51FA\u73B0\u7684\u672F\u8BED\u53CA\u5176\u671F\u671B\u8BFB\u6CD5\uFF08\u914D\u97F3\u65F6\u5199\u8FDB TTS \u6587\u672C\u6216 instructions\uFF09\u3002",
    parameters: {
      text: { type: "string", required: true, description: "The narration/subtitle text to match against." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return new TermStore(settings.outputDir).match(String(args.text));
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_style_get",
    description: "\u8BFB\u53D6\u5F53\u524D\u9879\u76EE\u7684\u98CE\u683C\u5E38\u91CF\u9501\uFF08style.json\uFF09\u3002\u751F\u6210\u63D0\u793A\u8BCD\u65F6\u628A\u8FD4\u56DE\u5B57\u6BB5\u9010\u5B57\u5E76\u5165\u5BF9\u5E94\u4F4D\u7F6E\uFF08camera/palette/lighting/sceneAnchors/negativeBaseline\uFF09\u3002",
    parameters: {},
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute() {
      return new ProjectStyleStore(settings.outputDir).read();
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_contact_sheet",
    description: "\u63A5\u89E6\u8868\uFF08\u7D20\u6750\u76D8\u70B9\u80F6\u7247\u5E26\uFF09\uFF1A\u7ED9\u4E00\u7EC4\u7247\u6BB5\u5404\u81EA\u62BD\u4E2D\u70B9\u5E27\uFF0Ctile \u6210 N \u5217\u8499\u592A\u5947\u5355\u56FE\uFF0C\u4E00\u773C\u9884\u89C8\u5168\u90E8\u5019\u9009\u7247\u6BB5\uFF1B\u4EA7\u51FA\u53EF\u52A0\u5165\u753B\u5E03\u4F5C\u4E3A\u7D20\u6750\u9884\u89C8\u8282\u70B9\u3002",
    parameters: {
      sources: { type: "array", items: { type: "string" }, required: true, description: "Absolute paths of the clips to preview." },
      columns: { type: "number", description: "Grid columns (default 4, max 8)." }
    },
    output: objectOutput(),
    timeoutMs: 6e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      return contactSheet({ sources: Array.isArray(args.sources) ? args.sources.map(String) : [], outputDir: settings.outputDir, columns: args.columns });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_model_router",
    description: "\u6A21\u578B\u80FD\u529B\u8868\u8DEF\u7531\uFF1A\u6309\u8F93\u5165\u9700\u6C42\uFF08\u65F6\u957F/\u753B\u5E45/\u9996\u5C3E\u5E27/\u97F3\u753B\u540C\u51FA\uFF09\u8FC7\u6EE4\u5E76\u6392\u5E8F\u53EF\u7528\u89C6\u9891\u6A21\u578B\uFF0C\u8FD4\u56DE eligible \u5217\u8868 + \u6BCF\u6A21\u578B\u7684\u6392\u9664\u539F\u56E0\u2014\u2014\u53C2\u6570\u7EC4\u5408\u95EE\u9898\u5728\u8BA1\u5212\u671F\u66B4\u9732\uFF0C\u4E0D\u7B49\u5230\u6267\u884C\u671F\u5931\u8D25\u3002",
    parameters: {
      durationSec: { type: "number", description: "\u76EE\u6807\u65F6\u957F\uFF08\u79D2\uFF09\u3002" },
      aspectRatio: { type: "string", description: "\u76EE\u6807\u753B\u5E45\uFF0C\u5982 16:9 / 9:16 / 1:1\u3002" },
      needsFirstFrame: { type: "boolean", description: "\u662F\u5426\u8981\u6C42\u9996\u5E27\u8F93\u5165\u3002" },
      needsLastFrame: { type: "boolean", description: "\u662F\u5426\u8981\u6C42\u5C3E\u5E27\u8F93\u5165\u3002" },
      needsAudio: { type: "boolean", description: "\u662F\u5426\u8981\u6C42\u97F3\u753B\u540C\u51FA\uFF08\u539F\u751F\u97F3\u9891\uFF09\u3002" },
      needsMultiRef: { type: "boolean", description: "\u662F\u5426\u8981\u6C42\u591A\u53C2\u8003\u56FE\uFF08\u591A\u4E3B\u4F53/\u591A\u7D20\u6750\u6761\u4EF6\u8F93\u5165\uFF09\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return routeModel({
        durationSec: typeof args.durationSec === "number" ? args.durationSec : void 0,
        aspectRatio: typeof args.aspectRatio === "string" ? args.aspectRatio : void 0,
        needsFirstFrame: args.needsFirstFrame === true,
        needsLastFrame: args.needsLastFrame === true,
        needsAudio: args.needsAudio === true,
        needsMultiRef: args.needsMultiRef === true
      }, await adapterCapabilities(settings.outputDir));
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_srt_lint",
    description: "SRT \u89C4\u8303\u5316\u68C0\u67E5\uFF1A\u628A\u5B57\u5E55\u8D28\u91CF\u6807\u51C6\u53D8\u6210\u786E\u5B9A\u6027 lint\u2014\u2014\u5355\u884C \u226416 \u5B57\u3001\u226417 \u5B57/\u79D2\u3001\u5355\u6761\u6700\u77ED 0.83s\u3001\u5E8F\u53F7/\u65F6\u95F4\u6233\u8FDE\u7EED\u5408\u6CD5\u3002\u7FFB\u8BD1/\u672C\u5730\u5316/\u6210\u7247\u524D\u8DD1\u4E00\u904D\uFF0C\u95EE\u9898\u9010\u6761\u5E26 cue \u53F7\u4E0E\u5EFA\u8BAE\u3002",
    parameters: {
      srt: { type: "string", required: true, description: "Absolute path of the .srt file." },
      maxLineChars: { type: "number", description: "\u5355\u884C\u5B57\u6570\u4E0A\u9650\uFF08\u9ED8\u8BA4 16\uFF09\u3002" },
      maxCps: { type: "number", description: "\u6BCF\u79D2\u5B57\u6570\u4E0A\u9650\uFF08\u9ED8\u8BA4 17\uFF09\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return srtLint(readFileSync3(String(args.srt), "utf8"), { maxLineChars: args.maxLineChars, maxCps: args.maxCps });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_srt_normalize",
    description: "SRT \u89C4\u8303\u5316\uFF08\u786E\u5B9A\u6027\uFF09\uFF1A\u95F4\u9699\u541E\u5E76\uFF08gap<1s \u524D\u6761 end \u5EF6\u81F3\u4E0B\u6761 start\uFF09\u3001\u6700\u77ED\u5C55\u793A\u65F6\u957F\u5EF6\u957F\uFF08<2.5s\uFF0C\u672B\u6761\u9664\u5916\uFF09\u3001\u65F6\u95F4\u6233\u683C\u5F0F\u5F52\u4E00\u3002\u914D\u97F3\u5BF9\u9F50\u4E0E\u6210\u7247\u524D\u8DD1\u4E00\u904D\uFF0C\u8F93\u51FA\u89C4\u8303\u5316\u540E\u7684 srt \u6587\u672C\u4E0E\u5E94\u7528\u7684\u6539\u52A8\u6E05\u5355\u3002",
    parameters: {
      srt: { type: "string", required: true, description: "Absolute path of the .srt file." },
      minDurationSec: { type: "number", description: "\u6700\u77ED\u5C55\u793A\u65F6\u957F\uFF08\u9ED8\u8BA4 2.5\uFF09\u3002" },
      gapMergeSec: { type: "number", description: "\u95F4\u9699\u541E\u5E76\u9608\u503C\uFF08\u9ED8\u8BA4 1\uFF09\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return srtNormalize(readFileSync3(String(args.srt), "utf8"), { minDurationSec: args.minDurationSec, gapMergeSec: args.gapMergeSec });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_speech_clean",
    description: "\u53E3\u64AD\u6587\u672C\u6E05\u7406\uFF1A\u5220\u9664\u62EC\u53F7\u566A\u58F0\u6CE8\u91CA\uFF08(\u638C\u58F0)/[\u97F3\u4E50] \u7C7B\uFF09\u3001\u5546\u6807\u7B26\u53F7\u3001\u7834\u6298\u53F7\u5F52\u4E00\u2014\u2014SRT \u6587\u6848\u8F6C\u914D\u97F3\u524D\u7684\u51C0\u5316\u6B65\u9AA4\u3002",
    parameters: {
      text: { type: "string", required: true, description: "The narration text to clean." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return { cleaned: cleanSpeechText(String(args.text)) };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_speech_duration",
    description: "\u53E3\u64AD\u65F6\u957F\u9884\u4F30\uFF08\u786E\u5B9A\u6027\uFF09\uFF1A\u5B57\u6570 \xF7 \u8BED\u8A00\u901F\u7387\uFF08zh 4.2/ja 4.0/ko 4.3/en 13.5 \u5B57\u6BCF\u79D2\uFF09+ \u6807\u70B9\u505C\u987F\u7F5A\u65F6 \u2192 \u79D2\u6570\uFF1B\u4F20\u5165 windowSec\uFF08\u5B57\u5E55\u7A97\u53E3\uFF09\u65F6\u7ED9\u51FA \u8D85\u7A97/\u7F29\u53E5\u5EFA\u8BAE\u3002\u65C1\u767D\u4E0E\u5B57\u5E55\u7A97\u53E3\u5BF9\u9F50\u7684\u9884\u7B97\u6B65\u9AA4\u3002",
    parameters: {
      text: { type: "string", required: true, description: "The narration text." },
      lang: { type: "string", description: "ISO-639-1 language (default zh)." },
      windowSec: { type: "number", description: "Optional subtitle window seconds to check against." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return estimateSpeech({ text: String(args.text), lang: typeof args.lang === "string" ? args.lang : void 0 }, typeof args.windowSec === "number" ? args.windowSec : void 0);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_shot",
    description: "\u955C\u5934\u8BED\u8A00\u2192\u751F\u6210\u63D0\u793A\u8BCD\u786E\u5B9A\u6027\u7FFB\u8BD1\u5668\uFF08\u5BFC\u6F14\u6280\u5DE7\u7684 AIGC \u5E94\u7528\u5C42\uFF09\uFF1A\u628A \u666F\u522B/\u89D2\u5EA6/\u8FD0\u955C/\u5E03\u5149/\u6C1B\u56F4/\u6784\u56FE \u7684\u7ED3\u6784\u5316\u9009\u62E9\u7FFB\u8BD1\u6210\u4E94\u8F74\u88C5\u914D\u63D0\u793A\u8BCD + \u8D1F\u9762\u57FA\u7EBF + \u89C4\u5219\u7F16\u53F7\u5F15\u7528\uFF08directorx-methodology \u89C4\u5219 29-68\uFF09\u3002\u8BCD\u8868\u5168\u90E8\u6765\u81EA\u65B9\u6CD5\u8BBA\u6C89\u6DC0\uFF0C\u4E0D\u51ED\u611F\u89C9\u5199\u63D0\u793A\u8BCD\u3002",
    parameters: {
      subject: { type: "string", required: true, description: "\u4E3B\u4F53\uFF08\u542B 2-3 \u4E2A\u7279\u5F81\u951A\u70B9\uFF09\u3002" },
      action: { type: "string", description: "\u52A8\u4F5C\uFF08\u8282\u62CD\u8BA1\u6570\u5199\u6CD5\uFF1A\u300C\u8D70\u56DB\u6B65\u5230\u7A97\u8FB9\uFF0C\u505C\u987F\uFF0C\u6700\u540E\u4E00\u79D2\u62C9\u5F00\u7A97\u5E18\u300D\uFF09\u3002" },
      shotSize: { type: "string", enum: ["ECU", "CU", "MCU", "MS", "MLS", "LS", "ELS"], description: "\u666F\u522B\uFF08\u9ED8\u8BA4 MS\uFF09\u3002" },
      angle: { type: "string", enum: ["eye-level", "low", "high", "birds-eye", "worms-eye", "dutch", "OTS", "POV"], description: "\u673A\u4F4D\u89D2\u5EA6\uFF08\u9ED8\u8BA4 eye-level\uFF09\u3002" },
      cameraMove: { type: "string", description: "\u8FD0\u955C\uFF08\u5B89\u5168\u8BCD\u8868\uFF1Astatic/push_in/pull_out/pan/tilt/parallax/element\uFF1B\u5927\u80C6\uFF1Aorbit/dolly_zoom/roll/whip\uFF09\u3002" },
      lighting: { type: "string", enum: ["rembrandt", "low-key", "high-key", "neon", "golden-hour", "soft-window", "practical"], description: "\u5E03\u5149\u9884\u8BBE\uFF08\u9ED8\u8BA4 soft-window\uFF09\u3002" },
      mood: { type: "string", description: "\u6C1B\u56F4\u60C5\u7EEA\u3002" },
      composition: { type: "string", enum: ["rule-of-thirds", "symmetry", "negative-space", "frame-in-frame", "depth-layers"], description: "\u6784\u56FE\u9884\u8BBE\u3002" },
      durationSec: { type: "number", description: "\u5355\u955C\u65F6\u957F\uFF08\u53EA\u7528\u4E8E\u5EFA\u8BAE\uFF0C\u4E0D\u5199\u8FDB\u63D0\u793A\u8BCD\uFF09\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return buildShotPrompt({
        subject: String(args.subject),
        action: typeof args.action === "string" ? args.action : void 0,
        shotSize: args.shotSize,
        angle: args.angle,
        cameraMove: typeof args.cameraMove === "string" ? args.cameraMove : void 0,
        lighting: args.lighting,
        mood: typeof args.mood === "string" ? args.mood : void 0,
        composition: args.composition,
        durationSec: typeof args.durationSec === "number" ? args.durationSec : void 0
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_shot_gate",
    description: "\u751F\u6210\u524D\u89C4\u5219 gate\uFF1A\u628A\u5BFC\u6F14\u7EAA\u5F8B\u53D8\u6210\u89C4\u5219\u7F16\u53F7\u5316\u68C0\u67E5\u2014\u2014ECU \u60DC\u7528\u5F8B\uFF08\u226420%\uFF09\u3001\u627F\u63A5\u53D8\u91CF\u5FC5\u586B\u3001\u63CF\u8FF0\u957F\u5EA6\u3001\u8FD0\u955C\u8BCD\u8868\u4E0E\u53CD\u5355\u8C03\u3001\u6A21\u578B\u8DEF\u7531\u53EF\u7528\u6027\uFF08\u65F6\u957F/\u753B\u5E45\u65F6\uFF09\u3002\u4E0E\u6210\u7247\u8D28\u68C0 qa_report \u6784\u6210\u751F\u6210\u524D\u540E\u4E00\u5BF9 gate\u3002\u5168\u90E8\u786E\u5B9A\u6027\uFF0C\u4E0D\u8C03\u6A21\u578B\u3002",
    parameters: {
      shots: { type: "array", items: { type: "object", additionalProperties: true }, required: true, description: "Shot list\uFF08\u540C shot_sequence \u8F93\u5165\u5F62\u72B6\uFF09\u3002" },
      durationSec: { type: "number", description: "Optional target duration for model routing." },
      aspectRatio: { type: "string", description: "Optional aspect ratio for model routing." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return gateShotSequence({ shots: Array.isArray(args.shots) ? args.shots : [], durationSec: args.durationSec, aspectRatio: args.aspectRatio });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_shot_sequence",
    description: "\u5206\u955C\u6279\u91CF\u627F\u63A5\u94FE\uFF1A\u7ED9\u4E00\u7EC4\u955C\u5934\u63CF\u8FF0\u751F\u6210\u9010\u955C\u63D0\u793A\u8BCD\u89C4\u683C + \u627F\u63A5\u53D8\u91CF\uFF08\u4E0A\u955C end_state / \u4E0B\u955C start_goal\uFF0C\u89C4\u5219 3b \u5FC5\u586B\u9879\uFF09+ \u9996\u5C3E\u5E27\u63A5\u529B\u8BA1\u5212\uFF08handoff \u65F6\u672C\u955C\u6302\u4E0A\u4E00\u955C\u672B\u5E27\uFF09+ \u53CD\u5355\u8C03\u8FD0\u955C\u6821\u9A8C\u3002\u6279\u91CF\u751F\u6210\u524D\u7684\u786E\u5B9A\u6027\u88C5\u914D\u5C42\u3002",
    parameters: {
      shots: { type: "array", items: { type: "object", additionalProperties: true }, required: true, description: "[{id?, description, shotSize?, cameraMove?, lighting?, mood?, composition?, handoff?}]" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return buildShotSequence(Array.isArray(args.shots) ? args.shots : []);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_preset",
    description: "\u751F\u6210\u53C2\u6570\u9884\u8BBE\u5305\uFF1A\u753B\u5E45 \xD7 \u65F6\u957F \xD7 \u8FD0\u955C\uFF08\u8F6E\u6362\u5E8F\u9632\u53CD\u5355\u8C03\uFF09\xD7 \u98CE\u683C\u8BED\u6CD5 slug \u7684\u6700\u4F73\u5339\u914D\u8868\uFF0C\u5E76\u4E0E\u6A21\u578B\u80FD\u529B\u8DEF\u7531\u8054\u52A8\uFF08\u8FD4\u56DE\u8BE5\u53C2\u6570\u7EC4\u5408\u4E0B eligible \u6A21\u578B\uFF09\u3002slugs: douyin-oral / xiaohongshu-mix / bilibili-long / ads-vertical / drama-horizontal / mv\uFF1B\u4E0D\u4F20 slug \u8FD4\u56DE\u5168\u90E8\u9884\u8BBE\u6E05\u5355\u3002",
    parameters: {
      slug: { type: "string", description: "Preset slug\uFF08\u4E0D\u4F20\u5219\u5217\u51FA\u5168\u90E8\u9884\u8BBE\uFF09\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      const slug = typeof args.slug === "string" && args.slug !== "" ? args.slug : void 0;
      return slug === void 0 ? listPresets() : generationPreset(slug);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_probe_media",
    description: "Probe a local media file with ffprobe: container format, duration, size, and per-stream details (codec, resolution, fps, audio channels). Use it to verify generated outputs or plan edits. Requires ffmpeg on PATH.",
    parameters: {
      source: { type: "string", required: true, description: "Absolute path of the local media file." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      return probeMedia(args.source);
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_extract_frames",
    description: "Extract still frames from a local video with ffmpeg and save them as PNGs under the output dir (frames/). Use it with directorx_view_image for frame-level QA (the frame-qa workflow). Requires ffmpeg on PATH.",
    parameters: {
      source: { type: "string", required: true, description: "Absolute path of the local video file." },
      at: { type: "array", items: { type: "number" }, description: "Timestamps in seconds to capture one frame each; omit to sample evenly." },
      count: { type: "number", description: "Evenly spaced frame count when `at` is omitted (default 4, max 24)." }
    },
    output: objectOutput(),
    timeoutMs: 12e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const files = await extractFrames(args.source, settings.outputDir, { at: args.at, count: args.count });
      return { source: args.source, files };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_provider_ingest",
    description: "\u5165\u9A7B\u65B0\u751F\u6210\u6A21\u578B\u7B2C 1 \u6B65\uFF1A\u6536 model + API \u6587\u6863\uFF08\u7C98\u8D34\u6216 URL\uFF09+ \u53EF\u9009 Key/Base URL\u3002Key \u53EA\u5199\u5165\u672C\u673A secret\uFF0C\u4E0D\u56DE\u4F20\u5230\u4F1A\u8BDD\u3002\u4E0B\u4E00\u6B65 directorx_provider_classify\u3002",
    parameters: {
      model: { type: "string", required: true, description: "\u4E0A\u6E38 model id\u3002" },
      capability: { type: "string", enum: ["image", "video", "audio", "vision"], required: true, description: "\u6302\u5230\u54EA\u4E00\u4E2A\u80FD\u529B\u3002" },
      apiDoc: { type: "string", description: "API \u6587\u6863\u6B63\u6587\uFF08\u63A8\u8350\u7C98\u8D34\u5173\u952E\u7AE0\u8282\uFF09\u3002" },
      apiDocUrl: { type: "string", description: "\u7528\u6237\u7ED9\u51FA\u7684\u6587\u6863 URL\u3002\u63D2\u4EF6\u53EA\u62C9\u53D6\u8FD9\u4E00\u6B21\u3002" },
      baseURL: { type: "string", description: "API Base URL\u3002" },
      displayName: { type: "string", description: "\u8BBE\u7F6E\u9875\u663E\u793A\u540D\u3002" },
      apiKey: { type: "string", description: "API Key\u3002\u4E0D\u4F1A\u51FA\u73B0\u5728\u5DE5\u5177\u8FD4\u56DE\u91CC\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return ingestProvider({
        outputDir: settings.outputDir,
        model: String(args.model),
        capability: args.capability,
        apiDoc: typeof args.apiDoc === "string" ? args.apiDoc : void 0,
        apiDocUrl: typeof args.apiDocUrl === "string" ? args.apiDocUrl : void 0,
        baseURL: typeof args.baseURL === "string" ? args.baseURL : void 0,
        displayName: typeof args.displayName === "string" ? args.displayName : void 0,
        apiKey: typeof args.apiKey === "string" ? args.apiKey : void 0
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_provider_classify",
    description: "\u5165\u9A7B\u7B2C 2 \u6B65\uFF1A\u7528\u56FA\u5B9A\u6307\u7EB9\u5224\u65AD\u6587\u6863\u662F\u5DF2\u6709\u534F\u8BAE\uFF08A\uFF09\u8FD8\u662F\u65B0 HTTP\uFF08B/generic-rest\uFF09\u3002\u4E0D\u8C03\u7528\u6A21\u578B\u3002",
    parameters: {
      id: { type: "string", required: true, description: "ingest \u8FD4\u56DE\u7684 id\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    async execute(args) {
      return classifyProvider(settings.outputDir, String(args.id));
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_provider_draft",
    description: "\u5165\u9A7B\u7B2C 3 \u6B65\uFF1A\u5199\u5165/\u8865\u5168 AdapterSpec\u3002\u53EA\u5141\u8BB8\u5C01\u95ED\u5B57\u6BB5\uFF08mode/baseURL/auth/create/poll/syncResult/caps\uFF09\u3002\u7F3A\u5B57\u6BB5\u8FD4\u56DE issues\uFF0C\u4E0D\u8981\u53D1\u660E\u534F\u8BAE\u3002A \u7C7B\u901A\u5E38\u53EA\u9700 baseURL+caps\uFF1BB \u7C7B\u5FC5\u987B\u6709 create \u4E0E poll \u6216 syncResult\u3002",
    parameters: {
      id: { type: "string", required: true, description: "ingest id\u3002" },
      spec: { type: "object", additionalProperties: true, required: true, description: 'AdapterSpec \u8865\u4E01\u3002create.body \u7684\u503C\u5FC5\u987B\u662F {type:"from",field:"prompt"} \u6216 {type:"const",value}\u3002' }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    async execute(args) {
      return draftProvider(settings.outputDir, String(args.id), args.spec !== null && typeof args.spec === "object" ? args.spec : {});
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_provider_smoke",
    description: "\u5165\u9A7B\u7B2C 5 \u6B65\uFF1A\u6700\u5C0F\u56DE\u5F52\u3002\u9ED8\u8BA4\u5951\u7EA6+\u63A2\u6D3B\u3002live:true \u624D\u6253\u4E00\u53D1\u6700\u77ED\u771F\u8C03\u7528\uFF08B \u7C7B generic-rest\uFF09\uFF0C\u5FC5\u987B\u5148 directorx_confirm\u3002",
    parameters: {
      id: { type: "string", required: true, description: "ingest id\u3002" },
      live: { type: "boolean", description: "true \u65F6\u6253\u6700\u77ED\u4ED8\u8D39\u8C03\u7528\u3002\u9ED8\u8BA4 false\u3002" },
      createFixture: { type: "object", additionalProperties: true, description: "\u6587\u6863\u91CC\u7684 create \u54CD\u5E94\u793A\u4F8B\uFF0C\u7528\u4E8E\u5951\u7EA6\u6821\u9A8C\u3002" },
      pollFixture: { type: "object", additionalProperties: true, description: "\u6587\u6863\u91CC\u7684 poll \u54CD\u5E94\u793A\u4F8B\u3002" }
    },
    output: objectOutput(),
    timeoutMs: Math.max(settings.timeoutMs, 12e4),
    async execute(args) {
      return smokeProvider({
        settings,
        id: String(args.id),
        live: args.live === true,
        createFixture: args.createFixture,
        pollFixture: args.pollFixture
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_provider_commit",
    description: "\u5165\u9A7B\u7B2C 6 \u6B65\uFF1Asmoke \u901A\u8FC7\u540E\u5199\u5165 Settings\uFF08mode/model/baseURL/key\uFF09\u5E76\u70B9\u4EAE catalog\u3002\u8BBE\u7F6E live \u70ED\u66F4\u65B0\uFF1B\u8BF7\u7528\u6237\u5237\u65B0\u9875\u9762\u3002",
    parameters: {
      id: { type: "string", required: true, description: "ingest id\u3002" },
      force: { type: "boolean", description: "\u7528\u6237\u660E\u786E\u8DF3\u8FC7\u56DE\u5F52\u65F6\u624D\u5141\u8BB8\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    async execute(args) {
      return commitProvider({
        settings,
        id: String(args.id),
        apply: applyCapability,
        force: args.force === true
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_provider_list",
    description: "\u5217\u51FA\u672C\u9879\u76EE\u5DF2\u5165\u9A7B\u7684\u751F\u6210\u6A21\u578B\uFF08\u4E0D\u542B Key\uFF09\u3002",
    parameters: {},
    output: objectOutput(),
    timeoutMs: 1e4,
    async execute() {
      return listProviders(settings.outputDir);
    }
  })));
  return () => {
    for (const dispose of disposers.reverse()) dispose();
    defineRegistered = previous;
  };
}
function registerSystemPrompt(ctx, settings) {
  const enabled = ["vision", "image", "video", "audio"].filter((key) => settings[key].enabled);
  const toolList = [
    ...settings.vision.enabled ? ["directorx_view_image"] : [],
    ...settings.image.enabled ? ["directorx_generate_image"] : [],
    ...settings.video.enabled ? ["directorx_generate_video"] : [],
    ...settings.audio.enabled ? ["directorx_generate_audio", "directorx_transcribe_audio"] : [],
    "directorx_probe_media",
    "directorx_extract_frames",
    "directorx_generate_ready",
    "directorx_chengpian"
  ];
  const initiative = parseInitiative(settings.initiative);
  const disposePersona = ctx.systemPrompt.section({
    name: "directorx:chengpian",
    order: 5,
    text: chengpianPersonaText(initiative)
  });
  const disposeTools = ctx.systemPrompt.section({
    name: "tool:directorx",
    order: 117,
    text: [
      "## DirectorX media tools",
      "- DirectorX is the \u6210\u7247 plugin. DSH owns the agent loop. Load skill `directorx-chengpian` and call `directorx_chengpian` before generate/ask. Any choice the user must own goes through `directorx_ask` (question cards). NEVER write a numbered 1. 2. 3. menu in assistant text. Sign the board with `directorx_confirm`. Track stages with `directorx_stage`. The user can inspect the board with `/directorx` without spending tokens.",
      "- Work style: complex work \u2192 load `directorx-production-lead` + `directorx-chengpian`, match a recipe, compose research / confirm / placeholders; keep the user informed at unit granularity; answer in the user's language (Chinese by default).",
      "- Craft decisions cite rules from `directorx-methodology` (\u6210\u7247\u7ED3\u6784/\u63D0\u793A\u8BCD\u5DE5\u7A0B/\u526A\u8F91\u8282\u594F/LLM \u7CBE\u526A\u901F\u67E5); QC verdicts reference rule numbers.",
      "- The infinite canvas is the storyboard, but writing it is gated. Read freely (`directorx_canvas_get` / `node` / `search` / `summary`). Do **not** `directorx_canvas_plan` or batch-`directorx_canvas_add` until the user has signed the script/storyboard via `directorx_confirm` or an explicit \u300C\u843D\u5230\u753B\u5E03\u300D. After a signed plan: `directorx_canvas_plan` (acts\u2192groups, shots\u2192nodes, \u627F\u63A5 edges) then `directorx_canvas_arrange`. Single-node repairs are fine. The WebUI generate bar only queues `directorx_canvas_intents` \u2014 it must not write generating nodes. On a canvas instruction, claim with `directorx_canvas_intents` `{ claim: true }`, then continue only after the same confirm gate.",
      "- Generation: NEVER send the canvas one-liner to generate_*. Order is always `directorx_knowledge_search`/`read` + `directorx_skill_search`/`read` (+ web if facts are missing) \u2192 `directorx_prompt_craft` \u2192 `directorx_generate_ready` (decide \u8BBE\u5B9A\u56FE / \u573A\u666F\u7A7A\u955C / \u5173\u952E\u5E27 / \u56FE\u751F / \u9996\u5C3E\u5E27; if blocked, ask cards then make the missing asset first) \u2192 propose/confirm \u2192 generate with `craftId` **and** `readyId`. \u4E25\u683C/\u534F\u540C still need an approved `proposalId`. \u6709\u4EBA\u540D\u5C31\u8981\u89D2\u8272\u8BBE\u5B9A\u56FE\uFF1B\u8FDE\u7EED\u955C\u5934\u8981\u4E0A\u4E00\u955C\u672B\u5E27\u6216\u672C\u955C\u5173\u952E\u5E27\uFF1B\u8F6C\u573A\u8981\u9996\u5C3E\u5E27\u3002After a canvas intent, write results back with `directorx_canvas_update`.",
      "- Edit / grade: \u7528\u6237\u8981\u8C03\u8272\u3001\u6539\u8272\u8C03\u3001\u6253\u5F00\u7F16\u8F91\u53F0\u65F6\uFF0C\u8C03\u7528 `directorx_studio`\uFF08prompt + \u5F53\u524D\u753B\u5E03 nodeId \u6216 path\uFF09\u3002\u5B83\u4F1A ffmpeg \u8C03\u8272\u3001\u56DE\u5199\u8282\u70B9\uFF0C\u5E76\u6253\u5F00\u56FE\u7247/\u89C6\u9891\u7F16\u8F91\u5DE5\u4F5C\u53F0\u3002\u526A\u8F91\u4ECD\u7528 `directorx_edit` / `directorx_video_process` / `directorx_timeline` / `directorx_smart_cut`\u3002\u4E0D\u8981\u7528\u751F\u6210\u6A21\u578B\u91CD\u7ED8\u6765\u5B8C\u6210\u8C03\u8272\u3002",
      "- Reporting: when delivering, state the node/shot list, artifact paths (or WebUI cards), canvas updates, and what is next. Base claims on tool results, never on promises.",
      "",
      "## DirectorX media tools",
      `Enabled capabilities: ${enabled.length === 0 ? "none (open Settings \u2192 DirectorX to enable)" : enabled.join(", ")}.`,
      toolList.length > 0 ? `Available tools: ${toolList.join(", ")}.` : "",
      "",
      "- Multi-unit work: `directorx_brief` then follow its `compose` stages \u2014 research (knowledge/skill, then external facts) \u2192 `directorx_propose` (prompt + recommended model + spec) \u2192 `directorx_canvas_shotlist` \u2192 `directorx_confirm` (DSH ask UI signs the board). Do not generate until the batch is confirmed. Recipes are prior art, not a job catalog. `directorx_orchestrate` is optional.",
      "- Before media generation, `directorx_skill_search` / `directorx_skill_read` the matching skill body (manifest is only a summary) and `directorx_knowledge_search` / `directorx_knowledge_read` the corpus. Never claim the library lacks a topic without searching. For production requests, load `directorx-production-lead` first and triage simple vs complex. Record each stage artifact with `directorx_stage`.",
      "- Keep prompts positive and physical; lock subject, style, light, lens, and continuity in writing before calling generation tools. Use `directorx_style` to inject grounded style/camera-language craft from the corpus instead of inventing looks.",
      "- Treat provider responses as authoritative: inspect returned paths/URLs/status before claiming completion.",
      "- Long async tasks persist in the task ledger: after a timeout or interruption, recover them with `directorx_task_status` and stop them with `directorx_cancel_task`; never blindly re-submit.",
      "- Agentic orchestration: for multi-unit goals, compose existing tools against the matching recipe. Use the `workflow` tool only when you need parallel subagents; `directorx-workflow` templates are prior art, not the default path.",
      "- Frame-level QA: extract stills with `directorx_extract_frames`, then inspect them with `directorx_view_image` (multi-frame comparisons) before accepting a video result.",
      "- Subtitle pipeline: `directorx_transcribe_audio` (format srt) produces subtitle files the video editor can overlay; keep transcripts in the output dir for reuse.",
      "- New provider: user gives model + API doc + key. Load skill `directorx-provider-onboard`. Fixed path: `directorx_provider_ingest` \u2192 `classify` \u2192 `draft` (AdapterSpec only, never write code) \u2192 `directorx_ask` (\u786E\u8BA4\u534F\u8BAE/\u662F\u5426\u6700\u77ED\u771F\u8C03\u7528) \u2192 `smoke` \u2192 `commit`. Never echo the API key. After commit, ask the user to refresh; generate_* stays the only entry.",
      "- If a tool fails with a Base URL / API Key / mode error, tell the user to open WebUI Settings \u2192 DirectorX and configure the matching capability."
    ].filter(Boolean).join("\n")
  });
  return () => {
    disposePersona();
    disposeTools();
  };
}

// src/adapters-route.ts
var ADAPTERS_ROUTE_PATH = "/directorx/adapters";
function sendJson3(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}
async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    return {};
  }
}
function registerAdaptersRoute(ctx, getOutputDir) {
  const webServer = ctx.get("webServer");
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: ADAPTERS_ROUTE_PATH,
    handler: async (request, response) => {
      let project;
      try {
        project = resolveRequestProject(ctx, request);
      } catch {
        sendJson3(response, 403, { ok: false, message: "unknown project" });
        return;
      }
      await runInProject(project, async () => {
        const outputDir = getOutputDir();
        if (request.method === "GET") {
          const store = new AdapterStore(outputDir);
          const adapters = [];
          for (const record of await store.list()) {
            adapters.push(publicRecord(record, await store.hasSecret(record.spec.id)));
          }
          sendJson3(response, 200, { adapters });
          return;
        }
        if (request.method === "POST") {
          const body = await readJson(request);
          const capability2 = String(body.capability ?? "video");
          if (!["image", "video", "audio", "vision"].includes(capability2)) {
            sendJson3(response, 400, { ok: false, message: "capability \u5FC5\u987B\u662F image/video/audio/vision" });
            return;
          }
          try {
            const result = await ingestProvider({
              outputDir,
              model: String(body.model ?? ""),
              capability: capability2,
              apiDoc: typeof body.apiDoc === "string" ? body.apiDoc : void 0,
              apiDocUrl: typeof body.apiDocUrl === "string" ? body.apiDocUrl : void 0,
              baseURL: typeof body.baseURL === "string" ? body.baseURL : void 0,
              displayName: typeof body.displayName === "string" ? body.displayName : void 0,
              apiKey: typeof body.apiKey === "string" ? body.apiKey : void 0
            });
            sendJson3(response, 200, { ok: true, ...result, hint: `\u5728\u4F1A\u8BDD\u91CC\u8BF4\uFF1A\u7EE7\u7EED\u63A5\u5165 ${result.id}` });
          } catch (error) {
            sendJson3(response, 400, { ok: false, message: error instanceof Error ? error.message : String(error) });
          }
          return;
        }
        sendJson3(response, 405, { ok: false, message: "method not allowed" });
      });
    }
  });
}

// src/index.ts
var name = "directorx";
var inject = ["tools", "skills", "systemPrompt", "settings", "llm"];
function apply(ctx) {
  corpus.setRoot(fileURLToPath4(new URL("../knowledge/", import.meta.url)));
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
  const applyCapability = async (capability2, patch) => {
    const current = scope.get();
    const prev = current[capability2];
    await scope.update({
      [capability2]: {
        ...prev,
        ...patch,
        auth: { ...prev.auth, ...patch.auth ?? {} }
      }
    });
  };
  const sync = (settings) => {
    disposeTools?.();
    disposePrompt?.();
    disposeTools = syncTools(ctx, settings, applyCapability, defineTool);
    disposePrompt = registerSystemPrompt(ctx, settings);
  };
  sync(scope.get());
  ctx.effect(() => scope.watch(sync), "directorx settings watch");
  ctx.effect(() => registerMediaRoute(ctx, () => scope.get().outputDir), "directorx media route");
  ctx.effect(() => registerMediaEditsRoute(ctx, () => scope.get().outputDir), "directorx media edits route");
  ctx.effect(() => registerMediaTasksRoute(ctx, () => scope.get().outputDir), "directorx media tasks route");
  ctx.effect(() => registerMediaListRoute(ctx, () => scope.get().outputDir), "directorx media list route");
  ctx.effect(() => registerProjectsRoute(ctx), "directorx projects route");
  ctx.effect(() => registerCanvasRoute(ctx, () => scope.get().outputDir), "directorx canvas route");
  ctx.effect(() => registerCanvasResetRoute(ctx, () => scope.get().outputDir), "directorx canvas reset route");
  ctx.effect(() => registerCanvasSnapshotsRoute(ctx, () => scope.get().outputDir), "directorx canvas snapshots route");
  ctx.effect(() => registerCanvasRestoreRoute(ctx, () => scope.get().outputDir), "directorx canvas restore route");
  ctx.effect(() => registerCanvasIntentRoute(ctx, () => scope.get().outputDir), "directorx canvas intent route");
  ctx.effect(() => registerCharactersRoute(ctx, () => scope.get().outputDir), "directorx characters route");
  ctx.effect(() => registerStudioRoute(ctx, () => scope.get().outputDir), "directorx studio route");
  ctx.effect(() => registerVendorRoute(ctx), "directorx vendor assets route");
  ctx.effect(() => registerProposalsRoute(ctx, () => scope.get().outputDir), "directorx proposals route");
  ctx.effect(() => registerProposalUpdateRoute(ctx, () => scope.get().outputDir), "directorx proposal update route");
  ctx.effect(() => registerSettingsTestRoute(ctx, () => scope.get()), "directorx settings test route");
  ctx.effect(() => registerAdaptersRoute(ctx, () => scope.get().outputDir), "directorx adapters route");
  ctx.effect(() => registerMcpRoute(ctx, () => scope.get()), "directorx mcp route");
  ctx.effect(() => registerSubagentSetup(ctx), "directorx subagent setup");
  ctx.effect(() => registerDirectorxCommands(ctx, () => scope.get().outputDir), "directorx commands");
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
