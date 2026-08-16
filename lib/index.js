// src/index.ts
import { fileURLToPath as fileURLToPath3 } from "node:url";

// src/config.ts
import z from "schemastery";
var SETTINGS_NS = "directorx";
var VISION_MODES = ["openai-chat", "mock"];
var IMAGE_MODES = ["openai-images", "modelverse-tasks", "mock"];
var VIDEO_MODES = ["openai-videos", "modelverse-tasks", "kling", "runway", "mock"];
var AUDIO_MODES = ["openai-tts", "mock"];
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
  vision: capability(VISION_MODES, "openai-chat", "https://api.modelverse.cn/v1", "gpt-5.6-luna"),
  image: capability(IMAGE_MODES, "openai-images", "https://api.modelverse.cn/v1", "gpt-image-2"),
  video: capability(VIDEO_MODES, "modelverse-tasks", "https://api.modelverse.cn/v1", "doubao-seedance-2-0-260128", "2K"),
  audio: capability(AUDIO_MODES, "openai-tts", "https://api.modelverse.cn/v1", "gpt-4o-mini-tts")
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

// src/media-server.ts
import { createReadStream, existsSync as existsSync2 } from "node:fs";
import { mkdir as mkdir5, readFile as readFile6, readdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { join as join6, resolve as resolve6 } from "node:path";

// src/edits.ts
import { appendFile, mkdir, readFile as readFile2 } from "node:fs/promises";
import { join as join2, resolve as resolve2 } from "node:path";
var EDITS_FILE = "edits.jsonl";
var MAX_EDIT_LINES = 2e4;
var DirectorxEditLedger = class {
  outputDir;
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  async filePath() {
    const dir = resolve2(process.cwd(), this.outputDir);
    await mkdir(dir, { recursive: true });
    return join2(dir, EDITS_FILE);
  }
  async append(record) {
    const path = await this.filePath();
    await appendFile(path, `${JSON.stringify(record)}
`, "utf8");
  }
  /** Most recent edits first, bounded to `limit`. */
  async list(limit = 20) {
    const path = await this.filePath();
    const content = await readFile2(path, "utf8").catch((error) => {
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
import { appendFile as appendFile2, mkdir as mkdir2, readFile as readFile3 } from "node:fs/promises";
import { join as join3, resolve as resolve3 } from "node:path";
var LEDGER_FILE = "tasks.jsonl";
var MAX_LEDGER_LINES = 2e4;
var DirectorxTaskLedger = class {
  outputDir;
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  async filePath() {
    const dir = resolve3(process.cwd(), this.outputDir);
    await mkdir2(dir, { recursive: true });
    return join3(dir, LEDGER_FILE);
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
    const content = await readFile3(path, "utf8").catch((error) => {
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
import { mkdir as mkdir3, readFile as readFile4, writeFile } from "node:fs/promises";
import { join as join4, resolve as resolve4 } from "node:path";
var CANVAS_FILE = "canvas.json";
function emptyDocument() {
  return { version: 1, updatedAt: 0, nodes: [], edges: [] };
}
function newId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
function sanitizeNode(input) {
  const kind = input.kind === "image" || input.kind === "video" || input.kind === "text" || input.kind === "group" ? input.kind : "text";
  const numberOr = (value, fallback) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const rawParent = input.parent;
  const node = {
    id: typeof input.id === "string" && input.id !== "" ? input.id : newId(kind),
    kind,
    label: typeof input.label === "string" ? input.label.slice(0, 200) : "",
    ...typeof input.path === "string" && input.path !== "" ? { path: input.path.slice(0, 1e3) } : {},
    ...typeof rawParent === "string" && rawParent !== "" ? { parent: rawParent.slice(0, 100) } : {},
    x: numberOr(input.x, 0),
    y: numberOr(input.y, 0),
    ...input.width !== void 0 ? { width: Math.max(60, Math.min(1200, numberOr(input.width, 240))) } : {},
    ...input.height !== void 0 ? { height: Math.max(60, Math.min(1200, numberOr(input.height, 160))) } : {}
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
    ...typeof input.label === "string" && input.label !== "" ? { label: input.label.slice(0, 200) } : {}
  };
}
var DirectorxCanvasStore = class {
  outputDir;
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join4(resolve4(process.cwd(), this.outputDir), CANVAS_FILE);
  }
  async read() {
    const path = this.filePath();
    const raw = await readFile4(path, "utf8").catch((error) => {
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
      const existing = await readFile4(path, "utf8");
      if (existing.trim() !== "") {
        const backup = join4(resolve4(process.cwd(), this.outputDir), `canvas.json.bak-${Date.now()}`);
        await writeFile(backup, existing, "utf8");
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
    const dir = join4(resolve4(process.cwd(), this.outputDir));
    await mkdir3(dir, { recursive: true });
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
    await writeFile(path, JSON.stringify(saved), "utf8");
    return saved;
  }
  /** Apply one mutation transactionally: read → mutate → write (with conflict retry off). */
  async mutate(mutator) {
    const current = await this.read();
    mutator(current);
    return this.write(current, current.updatedAt);
  }
  async addNode(input) {
    return this.mutate((doc) => {
      const node = sanitizeNode(input);
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
      if (!doc.edges.some((existing) => existing.id === edge.id)) doc.edges.push(edge);
    });
  }
  async update(id, patch) {
    return this.mutate((doc) => {
      const nodeIndex = doc.nodes.findIndex((node) => node.id === id);
      if (nodeIndex >= 0) {
        const merged = { ...doc.nodes[nodeIndex], ...patch, id };
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
      for (const node of input.nodes ?? []) {
        doc.nodes.push(sanitizeNode({ id: newId("text"), ...node }));
      }
      for (const edge of input.edges ?? []) {
        doc.edges.push(sanitizeEdge({ id: newId("edge"), ...edge }));
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
  /** 整理：auto-layout nodes into a tidy grid (or a single row) while keeping all connections. Group children stay inside their group. */
  async arrange(layout = "grid", gap = 40) {
    return this.mutate((doc) => {
      const topLevel = doc.nodes.filter((node) => node.parent === void 0);
      const columns = layout === "row" ? topLevel.length : Math.max(1, Math.ceil(Math.sqrt(topLevel.length)));
      topLevel.forEach((node, index) => {
        const width = node.width ?? (node.kind === "group" ? 520 : 240);
        const height = node.height ?? (node.kind === "group" ? 380 : 160);
        if (layout === "row") {
          node.x = index * (width + gap);
          node.y = 0;
        } else {
          node.x = index % columns * (width + gap);
          node.y = Math.floor(index / columns) * (height + gap);
        }
        node.width = width;
        node.height = height;
      });
      for (const group of topLevel.filter((node) => node.kind === "group")) {
        const members = doc.nodes.filter((node) => node.parent === group.id);
        const frameWidth = group.width ?? 520;
        const margin = 46;
        const memberColumns = Math.max(1, Math.floor((frameWidth - margin) / 260));
        members.forEach((member, index) => {
          const width = member.width ?? 200;
          member.x = group.x + margin + index % memberColumns * (width + 20);
          member.y = group.y + margin + Math.floor(index / memberColumns) * 150;
        });
      }
    });
  }
};

// src/support.ts
import { mkdir as mkdir4, readFile as readFile5, writeFile as writeFile2 } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname, join as join5, resolve as resolve5, sep as sep2 } from "node:path";
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
  const path = resolve5(source);
  if (!existsSync(path)) throw new Error(`File not found: ${source}`);
  const data = await readFile5(path);
  if (data.length > maxBytes) {
    throw new Error(`File too large to inline (${Math.round(data.length / 1024 / 1024)}MB > ${Math.round(maxBytes / 1024 / 1024)}MB): ${source}`);
  }
  return `data:${mimeForPath(path)};base64,${data.toString("base64")}`;
}
async function ensureOutputDir(dir) {
  const out = resolve5(process.cwd(), dir);
  await mkdir4(out, { recursive: true });
  return out;
}
async function downloadToFile(url, outDir, prefix, ext) {
  await ensureOutputDir(outDir);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const stem = `${prefix}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}${ext}`;
  const path = join5(outDir, stem);
  await writeFile2(path, bytes);
  return path;
}
async function saveBase64ToFile(data, outDir, prefix, ext) {
  await ensureOutputDir(outDir);
  const raw = data.replace(/^data:[^;]+;base64,/, "");
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  const path = join5(outDir, `${prefix}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}${normalizedExt}`);
  await writeFile2(path, Buffer.from(raw, "base64"));
  return path;
}
var MAX_MEDIA_BYTES = 512 * 1024 * 1024;
function resolveMediaPath(outputDir, candidate) {
  const root = resolve5(process.cwd(), outputDir);
  const target = resolve5(root, candidate);
  if (target !== root && !target.startsWith(root + sep2)) {
    throw new Error(`Media path escapes the DirectorX output directory: ${candidate}`);
  }
  return target;
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

// src/media-server.ts
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
  const dir = join6(resolve6(process.cwd(), outputDir), EDIT_SUBDIR);
  await mkdir5(dir, { recursive: true });
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
  const name2 = `${stamp}-${stem}.${ext}`;
  const path = join6(dir, name2);
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
  const webServer = ctx.get("webServer");
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
  const webServer = ctx.get("webServer");
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
  const webServer = ctx.get("webServer");
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
function registerMediaListRoute(ctx, getOutputDir) {
  const webServer = ctx.get("webServer");
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
        const root = resolve6(process.cwd(), getOutputDir());
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
            const full = join6(dir, entry.name);
            if (entry.isDirectory()) {
              if (entry.name === "frames" || entry.name === "edited" || entry.name === "transcripts") await scan(full, depth + 1);
              continue;
            }
            const info = await stat(full).catch(() => void 0);
            if (info === void 0 || !info.isFile()) continue;
            const mediaType = mimeForPath(full);
            if (mediaType === "application/octet-stream") continue;
            files.push({ path: full, name: entry.name, mediaType, size: info.size });
          }
        };
        await scan(root, 0);
        files.sort((a, b) => b.size - a.size);
        response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        response.end(JSON.stringify({ files: files.slice(0, 200) }));
      } catch (error) {
        response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : "list failed" }));
      }
    }
  });
}
function registerCanvasRoute(ctx, getOutputDir) {
  const webServer = ctx.get("webServer");
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
var VENDOR_FILES = {
  "transformers.min.js": "text/javascript",
  "ort-wasm-simd-threaded.jsep.mjs": "text/javascript",
  "ort-wasm-simd-threaded.jsep.wasm": "application/wasm"
};
function registerVendorRoute(ctx) {
  const webServer = ctx.get("webServer");
  if (webServer === void 0) return () => {
  };
  const vendorDirs = [
    fileURLToPath(new URL("./vendor/", import.meta.url)),
    fileURLToPath(new URL("../vendor/", import.meta.url))
  ];
  const serve = async (name2, contentType, response) => {
    try {
      const dir = vendorDirs.find((candidate) => existsSync2(join6(candidate, name2)));
      if (dir === void 0) throw new Error(`vendor asset ${name2} missing`);
      const data = await readFile6(join6(dir, name2));
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
  const webServer = ctx.get("webServer");
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
        const store = new DirectorxCanvasStore(resolve6(process.cwd(), getOutputDir()));
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

// src/skills.ts
import { readdir as readdir2, readFile as readFile7 } from "node:fs/promises";
import { join as join7, resolve as resolve7 } from "node:path";
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
    return parseFrontmatter(await readFile7(path, "utf8"));
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
    const dir = join7(root, entry.name);
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
  const root = resolve7(skillsRoot);
  for (const { dir, safeName } of await firstLevelSkillDirs(root)) {
    const parsed = await readSkillFile(join7(dir, "SKILL.md"));
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
  const cnRoot = join7(root, "video-production-cn");
  const cnEntries = await firstLevelSkillDirs(cnRoot).catch(() => []);
  for (const { dir, safeName } of cnEntries) {
    const parsed = await readSkillFile(join7(dir, "SKILL.md"));
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
  ctx.skills.register({
    name: "directorx-workflow",
    description: "Orchestrate multi-shot DirectorX production with the workflow tool: script/storyboard \u2192 parallel prompt crafting \u2192 parallel generation \u2192 QA \u2192 assembly plan, run by fan-out subagents. Load when a project has more than one shot and should be produced as a pipeline instead of serial generation.",
    content: [
      "# DirectorX Workflow \u7F16\u6392",
      "",
      "\u591A\u955C\u5934\u9879\u76EE\u4E0D\u8981\u4E32\u884C\u751F\u6210\uFF1A\u7528 workflow \u5DE5\u5177\u628A\u300C\u5267\u672C\u5206\u955C \u2192 \u63D0\u793A\u8BCD\u5DE5\u574A \u2192 \u5E76\u884C\u751F\u6210 \u2192 \u8D28\u68C0 \u2192 \u7EC4\u88C5\u65B9\u6848\u300D\u53D8\u6210\u4E00\u6761\u5B50\u4EE3\u7406\u6D41\u6C34\u7EBF\u3002",
      "",
      "## \u4F7F\u7528\u65B9\u6CD5",
      "",
      "1. \u8BFB\u53D6\u63D2\u4EF6\u5185\u7F6E\u6A21\u677F `workflows/directorx-pipeline.js`\uFF08\u968F\u63D2\u4EF6\u53D1\u5E03\uFF0C\u5728\u5DE5\u4F5C\u533A\u63D2\u4EF6\u76EE\u5F55\u4E0B\uFF09\u3002",
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
      "",
      "## \u753B\u5E03\u955C\u50CF\uFF08\u5FC5\u987B\uFF09",
      "",
      "\u6D41\u6C34\u7EBF\u5168\u7A0B\u628A\u9879\u76EE\u955C\u50CF\u5230\u65E0\u9650\u753B\u5E03\uFF0C\u8BA9\u7528\u6237\u5728 WebUI \u770B\u5230\u4E0E agent \u4E00\u81F4\u7684\u751F\u4EA7\u89C6\u56FE\uFF1A",
      "- \u5267\u672C\u4E0E\u5206\u955C\uFF1A`directorx_canvas_get` \u8BFB\u73B0\u72B6 \u2192 \u5EFA group\uFF08\u9879\u76EE\u540D\uFF09\u2192 \u6BCF\u955C\u4E00\u4E2A\u8282\u70B9 \u2192 \u6309\u987A\u5E8F\u8FDE\u7EBF \u2192 `directorx_canvas_arrange`\uFF1B",
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
    model_name: ctx.capability.model !== "" ? ctx.capability.model : "kling-v2",
    prompt,
    mode: "std",
    duration: clampDuration(options.seconds, 5, 5, 10),
    aspect_ratio: options.aspectRatio ?? "16:9"
  };
  if (isImageToVideo) {
    payload.image = await mediaSourceToDataUrl(options.firstFramePath);
    if (options.lastFramePath !== void 0) payload.image_tail = await mediaSourceToDataUrl(options.lastFramePath);
  }
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
    await new Promise((resolve10) => setTimeout(resolve10, settings.pollIntervalMs));
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
    await new Promise((resolve10) => setTimeout(resolve10, settings.pollIntervalMs));
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
import { defineTool } from "@deepseek-ai/dsh-tools";

// src/providers/audio.ts
import { writeFile as writeFile3 } from "node:fs/promises";
import { join as join8 } from "node:path";
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
  const path = join8(outDir, `${slugify(text, 24)}-mock.wav`);
  await writeFile3(path, makeWav());
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
  const path = join8(outDir, `${slugify(text, 24)}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}.${ext}`);
  await writeFile3(path, bytes);
  const files = [{ path, mimeType: `audio/${ext === "mp3" ? "mpeg" : ext}` }];
  return { model: ctx.capability.model, text, files, mode: "openai-tts" };
}
async function runAudio(ctx, text, options) {
  if (ctx.capability.mode === "mock") return mockAudio(ctx, text);
  if (ctx.capability.mode === "openai-tts") return openaiTts(ctx, text, options.voice, options.format);
  throw new Error(`Unsupported audio mode: ${ctx.capability.mode}`);
}

// src/providers/ffmpeg.ts
import { spawnSync } from "node:child_process";
import { mkdir as mkdir6 } from "node:fs/promises";
import { join as join9, resolve as resolve8 } from "node:path";
function requireBinary(command) {
  const found = spawnSync("which", [command], { encoding: "utf8" });
  if (found.status !== 0 || found.stdout.trim() === "") {
    throw new Error(`${command} is required for this operation but was not found on PATH. Install ffmpeg (brew install ffmpeg) or use the model-provider tools instead.`);
  }
  return command;
}
function probeMedia(source) {
  requireBinary("ffprobe");
  const result = spawnSync("ffprobe", [
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
    ...stream.r_frame_rate !== void 0 ? { fps: String(stream.r_frame_rate) } : {},
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
  const dir = join9(resolve8(process.cwd(), outputDir), "frames");
  await mkdir6(dir, { recursive: true });
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
    const path = join9(dir, `${stem}-${stamp}-${t.toFixed(2)}s.png`);
    const result = spawnSync("ffmpeg", [
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

// src/providers/image.ts
import { writeFile as writeFile4 } from "node:fs/promises";
import { join as join10 } from "node:path";

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
    await new Promise((resolve10) => setTimeout(resolve10, settings.pollIntervalMs));
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
    await new Promise((resolve10) => setTimeout(resolve10, settings.pollIntervalMs));
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
  const path = join10(outDir, name2);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">',
    '<rect width="100%" height="100%" fill="#0b1020"/>',
    '<text x="50%" y="50%" fill="#9fd8ff" font-family="sans-serif" font-size="28" text-anchor="middle">DirectorX mock image</text>',
    "</svg>"
  ].join("");
  await writeFile4(path, svg, "utf8");
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
import { mkdir as mkdir7, readFile as readFile8, writeFile as writeFile5 } from "node:fs/promises";
import { join as join11, resolve as resolve9 } from "node:path";
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
  const dir = join11(resolve9(process.cwd(), ctx.settings.outputDir), "transcripts");
  await mkdir7(dir, { recursive: true });
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
  const srtPath = join11(dir, `${slugify(source, 24)}-${stamp}.srt`);
  await writeFile5(srtPath, srt, "utf8");
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
  const bytes = await readFile8(resolve9(source));
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
  const dir = join11(resolve9(process.cwd(), ctx.settings.outputDir), "transcripts");
  await mkdir7(dir, { recursive: true });
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
  const files = [];
  const srt = options.format === "srt" ? text : void 0;
  if (srt !== void 0) {
    const srtPath = join11(dir, `${slugify(source, 24)}-${stamp}.srt`);
    await writeFile5(srtPath, srt, "utf8");
    files.push({ path: srtPath, mimeType: "application/x-subrip" });
  } else {
    const txtPath = join11(dir, `${slugify(source, 24)}-${stamp}.txt`);
    await writeFile5(txtPath, text, "utf8");
    files.push({ path: txtPath, mimeType: "text/plain" });
  }
  return { model: ctx.capability.model, source, language: options.language, text, srt, files, mode: ctx.capability.mode };
}
async function runTranscribe(ctx, source, options) {
  if (ctx.capability.mode === "mock") return mockTranscribe(ctx, source);
  return openaiTranscribe(ctx, source, options);
}

// src/providers/video.ts
import { spawnSync as spawnSync2 } from "node:child_process";
import { join as join12 } from "node:path";
async function mockVideo(ctx, prompt) {
  const outDir = await ensureOutputDir(ctx.settings.outputDir);
  const path = join12(outDir, `${slugify(prompt)}-mock.mp4`);
  const ffmpeg = spawnSync2("ffmpeg", [
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
    if (ctx.capability.mode === "openai-videos") return openaiVideo(ctx, prompt, options.seconds, options.size);
    if (ctx.capability.mode === "modelverse-tasks") return modelverseVideo(ctx, prompt, options);
    if (ctx.capability.mode === "kling") return klingVideo(ctx, prompt, options);
    if (ctx.capability.mode === "runway") return runwayVideo(ctx, prompt, options);
    throw new Error(`Unsupported video mode: ${ctx.capability.mode}`);
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
  return { settings, capability: capability2, signal, ledger: new DirectorxTaskLedger(settings.outputDir) };
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
    disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
    name: "directorx_canvas_add",
    description: "Add a node to the DirectorX canvas. kind: image|video|text|group. Media nodes reference a local output-dir path (from generation/edit results) or an http(s) URL; group nodes act as containers (pass their id as `parent` when adding members).",
    parameters: {
      kind: { type: "string", enum: ["image", "video", "text", "group"], required: true, description: "Node kind." },
      label: { type: "string", description: "Node label (shown under the preview)." },
      path: { type: "string", description: "Media path (local output-dir path or http(s) URL) for image/video nodes." },
      x: { type: "number", description: "Canvas x position." },
      y: { type: "number", description: "Canvas y position." },
      parent: { type: "string", description: "Optional id of a group node to place this node inside." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return canvas.addNode(args);
    }
  })));
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
      return canvas.search({ label: args.label, kind: args.kind, parent: args.parent });
    }
  })));
  disposers.push(ctx.tools.register(defineTool({
    name: "directorx_canvas_batch",
    description: "Batch add nodes (and optional edges) to the canvas in one write. nodes: [{kind, label, path?, parent?, x, y, width?, height?}]; edges: [{from, to, label?}]. Much cheaper than repeated canvas_add + canvas_connect calls.",
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
  disposers.push(ctx.tools.register(defineTool({
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
    ...settings.audio.enabled ? ["directorx_generate_audio", "directorx_transcribe_audio"] : [],
    "directorx_probe_media",
    "directorx_extract_frames"
  ];
  return ctx.systemPrompt.section({
    name: "tool:directorx",
    order: 117,
    text: [
      "## DirectorX persona",
      "- You are DirectorX (DX), the AI film-director form of this assistant: a production lead who plans, confirms, generates, inspects, edits, and delivers visual media. The WebUI (canvas / editors / cards) is your working surface, not decoration.",
      "- Work style: triage every media request (simple \u2192 generate directly; complex \u2192 load `directorx-production-lead` and orchestrate); publish a plan before batch generation (cost guardrail); keep the user informed at unit granularity; answer in the user's language (Chinese by default).",
      "- The infinite canvas IS the storyboard: maintain the project on it with `directorx_canvas_*` \u2014 nodes are shots/assets, edges are handoffs, groups are acts. Mirror every significant plan there and mention canvas state in reports, so the user sees the same production view you work from.",
      "- Reporting: when delivering, state the node/shot list, artifact paths (or WebUI cards), canvas updates, and what is next. Base claims on tool results, never on promises.",
      "",
      "## DirectorX media tools",
      `Enabled capabilities: ${enabled.length === 0 ? "none (open Settings \u2192 DirectorX to enable)" : enabled.join(", ")}.`,
      toolList.length > 0 ? `Available tools: ${toolList.join(", ")}.` : "",
      "",
      "- Before media generation, load the relevant DirectorX skill (`skill` tool) and search the knowledge corpus with `directorx_knowledge_search`; do not guess model capabilities. For production requests, load `directorx-production-lead` first and triage simple vs complex.",
      "- Keep prompts positive and physical; lock subject, style, light, lens, and continuity in writing before calling generation tools.",
      "- Treat provider responses as authoritative: inspect returned paths/URLs/status before claiming completion.",
      "- Long async tasks persist in the task ledger: after a timeout or interruption, recover them with `directorx_task_status` and stop them with `directorx_cancel_task`; never blindly re-submit.",
      "- Multi-shot projects should be orchestrated with the `workflow` tool and the `directorx-workflow` skill (script/storyboard \u2192 parallel prompt crafting \u2192 parallel generation \u2192 QA \u2192 assembly); do not generate shots serially.",
      "- Frame-level QA: extract stills with `directorx_extract_frames`, then inspect them with `directorx_view_image` (multi-frame comparisons) before accepting a video result.",
      "- Subtitle pipeline: `directorx_transcribe_audio` (format srt) produces subtitle files the video editor can overlay; keep transcripts in the output dir for reuse.",
      "- If a tool fails with a Base URL / API Key / mode error, tell the user to open WebUI Settings \u2192 DirectorX and configure the matching capability."
    ].filter(Boolean).join("\n")
  });
}

// src/index.ts
var name = "directorx";
var inject = ["tools", "skills", "systemPrompt", "settings", "llm"];
function apply(ctx) {
  corpus.setRoot(fileURLToPath3(new URL("../knowledge/", import.meta.url)));
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
  ctx.effect(() => registerMediaRoute(ctx, () => scope.get().outputDir), "directorx media route");
  ctx.effect(() => registerMediaEditsRoute(ctx, () => scope.get().outputDir), "directorx media edits route");
  ctx.effect(() => registerMediaTasksRoute(ctx, () => scope.get().outputDir), "directorx media tasks route");
  ctx.effect(() => registerMediaListRoute(ctx, () => scope.get().outputDir), "directorx media list route");
  ctx.effect(() => registerCanvasRoute(ctx, () => scope.get().outputDir), "directorx canvas route");
  ctx.effect(() => registerCanvasResetRoute(ctx, () => scope.get().outputDir), "directorx canvas reset route");
  ctx.effect(() => registerVendorRoute(ctx), "directorx vendor assets route");
  ctx.effect(() => registerSettingsTestRoute(ctx, () => scope.get()), "directorx settings test route");
  ctx.effect(() => registerSubagentSetup(ctx), "directorx subagent setup");
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
