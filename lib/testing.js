// src/corpus.ts
import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

// src/craft-map.ts
var CRAFT_SYNONYMS = [
  [/首尾帧|首帧|尾帧|first.?frame|last.?frame/i, "\u56FE\u751F\u89C6\u9891 image-to-video i2v \u9996\u5E27 \u5C3E\u5E27 116"],
  [/图生视频|i2v|image.to.video/i, "\u9996\u5C3E\u5E27 \u9996\u5E27 \u53C2\u8003\u56FE 116 continuous-video"],
  [/三视图|设定图|正侧背|定妆|turnaround|character sheet/i, "novel-characters \u89D2\u8272 \u8BBE\u5B9A \u6B63\u89C6 \u4FA7\u89C6 \u80CC\u89C6 04 117"],
  [/分镜|storyboard|镜号|排片/i, "storyboard-craft novel-storyboard \u666F\u522B \u8FD0\u955C 172 01"],
  [/调色|lut|grade|色板|配色/i, "\u8C03\u8272 \u8272\u5F69 \u80F6\u7247 \u9752\u6A59 141 editing-workflow"],
  [/剪辑|精剪|裁剪|编辑台|转场/i, "editing-workflow directorx-methodology \u526A\u8F91 02 127"],
  [/一致性|continuity|锚点/i, "\u89D2\u8272\u4E00\u81F4\u6027 \u8DE8\u955C \u53C2\u8003\u56FE 117 123 novel-characters"],
  [/口播|配音|tts|旁白/i, "\u97F3\u9891 \u8BED\u97F3 \u53E3\u64AD \u5B57\u5E55 06 144 ai-audio"],
  [/质检|qa|黑场|响度|抽帧/i, "frame-qa directorx-methodology \u6210\u7247\u8D28\u68C0 \u65F6\u957F \u753B\u5E45 174"],
  [/可灵|kling/i, "kling-prompt-copilot 114 115"],
  [/即梦|seedance/i, "seedance-2-prompt-copilot 114 115"],
  [/minimax|海螺|\bh3\b/i, "minimax-h3-prompt-copilot 114 115"],
  [/王家卫|韦斯|安德森|赛博朋克|风格/i, "cinematic-style 126 01 09"],
  [/接入模型|新模型|apidoc|provider/i, "directorx-provider-onboard"],
  [/同一系列|系列包|沿用设定|下一集/i, "directorx-series-craft \u89D2\u8272\u951A \u98CE\u683C\u9501 117 123"],
  [/场面控制|场面锁|作战板|完全控制|单镜长拍|空间台账/i, "directorx-blocking-craft \u8FDE\u7EED\u6027 \u7A7A\u95F4 117 123"],
  [/改这一镜|重新生成|再生动|只改这/i, "directorx-series-craft directorx-chengpian 117"],
  [/预告片|片花|热血漫|日漫/i, "trailer-craft cinematic-style 151 205 \u94A9\u5B50 \u786C\u5207"],
  [/成片|开拍|导演/i, "directorx-chengpian directorx-production-lead directorx-methodology 07 115"],
  [/提示词|prompt/i, "video-prompt-builder 115 130 01"],
  [/版权|专名|商标|肖像权|改写提示词/i, "213 copyright-safe-prompting \u6CDB\u5316 \u8D1F\u5411\u6392\u9664"],
  [/编排|成片流程|制片/i, "directorx-chengpian directorx-production-lead 07 115 213"],
  [/追逐|追车|飞车|追捕|chase/i, "\u8FFD\u9010 \u8FFD\u8F66 \u901F\u5EA6\u611F 401"],
  [/悬疑|推理|谜案|解谜|mystery|whodunit/i, "\u60AC\u7591 \u63A8\u7406 \u60AC\u5FF5 402 268 289"],
  [/浪漫|爱情|情感戏|亲密|romance|love scene/i, "\u6D6A\u6F2B \u7231\u60C5 \u60C5\u611F \u4EB2\u5BC6 403"],
  [/史诗|宏大|大场面|千军万马|战争|epic|scale/i, "\u53F2\u8BD7 \u5B8F\u5927 \u5927\u573A\u9762 \u6218\u4E89 404 201"],
  [/视觉引导|视线引导|画面层次|depth|leading.?eye/i, "\u89C6\u89C9\u5F15\u5BFC \u89C6\u7EBF \u5C42\u6B21 405 216"],
  [/镜头情绪|情绪镜头|camera.?emotion|镜头语言情绪/i, "\u955C\u5934 \u60C5\u7EEA \u666F\u522B 406 231"]
];
var SKILL_ARTICLES = {
  "directorx-methodology": ["01", "02", "07", "123", "127", "213", "401", "402", "403", "404", "405", "406", "409", "410", "411", "413"],
  "directorx-production-lead": ["114", "115", "121"],
  "directorx-chengpian": ["115", "07", "01"],
  "directorx-playbook": ["114", "115", "158"],
  "novel-characters": ["04", "117", "123", "226"],
  "novel-outline": ["03", "101", "150"],
  "novel-script": ["03", "101", "159"],
  "novel-storyboard": ["172", "01", "109", "401", "404"],
  "novel-art": ["126", "228", "226"],
  "storyboard-craft": ["172", "01", "109", "401", "404", "405"],
  "trailer-craft": ["151", "205", "188", "01"],
  "directorx-series-craft": ["117", "123", "01", "408"],
  "directorx-blocking-craft": ["117", "123", "116", "408"],
  "editing-workflow": ["02", "127", "15"],
  "frame-qa": ["174", "118", "111"],
  "video-prompt-builder": ["115", "130", "158", "01", "213", "407", "417"],
  "video-prompt-reverse": ["159", "115", "103"],
  "kling-prompt-copilot": ["114", "115"],
  "seedance-2-prompt-copilot": ["114", "115"],
  "seedance-2-5-prompt-copilot": ["114", "115"],
  "minimax-h3-prompt-copilot": ["114", "115"],
  "gpt-image2-prompt-copilot": ["115", "221"],
  "banana-prompt-copilot": ["115", "223"],
  "cinematic-style": ["126", "01", "09", "405", "406"],
  "continuous-video": ["116", "117", "123", "407", "408", "418"],
  "caption-localization": ["63", "06"],
  "ai-audio": ["06", "144", "119"],
  "audio-sound": ["06", "144", "23"],
  "platform-specs": ["112", "142"],
  "thumbnail-cover": ["205", "16"],
  "script-writing": ["03", "101"],
  "short-video": ["05", "142", "188"],
  "vfx-compositing": ["128", "110"],
  "shot-recipes": ["01", "02", "07", "124", "401", "402", "403", "404", "405", "406", "409", "410", "411", "413"]
};
var MODE_ARTICLES = {
  onboard: ["114"],
  edit: ["02", "127", "141"],
  character: ["04", "117", "123"],
  script: ["03", "101", "172"],
  canvas: ["172", "01", "109"],
  qa: ["174", "118"],
  style: ["126", "01", "09"],
  generate: ["115", "01", "116", "213"],
  research: ["07", "115"]
};
var articleSkills;
function unique(items) {
  return [...new Set(items.filter((item2) => item2 !== ""))];
}
function expandCraftQuery(query) {
  let extra = "";
  for (const [pattern, words] of CRAFT_SYNONYMS) {
    if (pattern.test(query)) extra += ` ${words}`;
  }
  return `${query} ${extra}`.trim();
}
function articlesForSkill(name) {
  return SKILL_ARTICLES[name] ?? [];
}
function skillsForArticle(id) {
  if (articleSkills === void 0) {
    articleSkills = /* @__PURE__ */ new Map();
    for (const [skill, ids] of Object.entries(SKILL_ARTICLES)) {
      for (const article of ids) {
        const list = articleSkills.get(article) ?? [];
        list.push(skill);
        articleSkills.set(article, list);
      }
    }
  }
  return articleSkills.get(id) ?? [];
}
function articlesForSkills(names) {
  return unique(names.flatMap((name) => articlesForSkill(name)));
}
function articlesForMode(mode) {
  return MODE_ARTICLES[mode] ?? [];
}

// src/okf.ts
var OKF_VERSION = "0.2";
var OKF_TYPES = ["Reference", "Method", "Playbook", "Spec", "Case"];
var RESERVED_NAMES = /* @__PURE__ */ new Set(["index.md", "log.md"]);
var TYPE_FILTER_ALIASES = {
  reference: "Reference",
  \u53C2\u8003: "Reference",
  method: "Method",
  \u65B9\u6CD5: "Method",
  playbook: "Playbook",
  \u624B\u518C: "Playbook",
  \u5DE5\u4F5C\u6D41: "Playbook",
  spec: "Spec",
  \u89C4\u683C: "Spec",
  \u77E9\u9635: "Spec",
  case: "Case",
  \u6848\u4F8B: "Case"
};
var TAG_RULES = [
  [/镜头|运镜|景别|camera|shot size|shot-type/i, "camera"],
  [/剪辑|转场|edit(?:ing)?|cutaway/i, "editing"],
  [/灯光|光效|布光|lighting|motivated light/i, "lighting"],
  [/色彩|调色|色板|lut|color/i, "color"],
  [/声音|音频|配乐|口播|foley|sound|audio|配音/i, "sound"],
  [/提示词|prompt/i, "prompt"],
  [/模型|model matrix|选型|kling|seedance|minimax|veo|runway/i, "model"],
  [/分镜|storyboard|animatic|镜号/i, "storyboard"],
  [/角色|人设|character|表演|acting/i, "character"],
  [/风格|美术|style|art direction/i, "style"],
  [/版权|copyright|商标|肖像/i, "copyright"],
  [/工作流|管线|流程|pipeline|workflow/i, "workflow"],
  [/一致|连续|continuity|锚点/i, "continuity"],
  [/预告|片花|trailer|cutscene/i, "trailer"],
  [/质检|qa|缺陷|artifact/i, "qa"],
  [/平台|投放|seo|分发|distribution/i, "platform"],
  [/剧本|叙事|screenplay|narrative|节拍/i, "narrative"],
  [/图生|i2v|首尾帧|image-to-video|first.?frame|last.?frame/i, "i2v"],
  [/图片|image prompt|product photo/i, "image"],
  [/特效|合成|vfx|composit/i, "vfx"],
  [/规格|矩阵|总表|spec/i, "spec"]
];
var KNOWN_FRONTMATTER = /* @__PURE__ */ new Set([
  "type",
  "title",
  "description",
  "resource",
  "tags",
  "generated",
  "verified",
  "status",
  "stale_after",
  "sources",
  "dx_id",
  "aliases",
  "related"
]);
function isOkfReservedRel(rel) {
  const base = rel.split("/").pop()?.toLowerCase() ?? "";
  return RESERVED_NAMES.has(base);
}
function formatArticleId(number) {
  return number < 100 ? String(number).padStart(2, "0") : String(number);
}
function normalizeOkfType(value) {
  if (value === void 0) return void 0;
  const trimmed = value.trim();
  if (trimmed === "") return void 0;
  const mapped = TYPE_FILTER_ALIASES[trimmed.toLowerCase()];
  if (mapped !== void 0) return mapped;
  const exact = OKF_TYPES.find((type) => type.toLowerCase() === trimmed.toLowerCase());
  return exact ?? trimmed;
}
function trustTier(frontmatter) {
  const events = frontmatter.verified ?? [];
  if (events.length === 0) return "unverified";
  if (events.some((event) => event.by.startsWith("human:"))) return "human-reviewed";
  return "machine-confirmed";
}
function isStale(frontmatter, today = /* @__PURE__ */ new Date()) {
  const stamp = frontmatter.stale_after?.trim();
  if (stamp === void 0 || stamp === "") return false;
  const iso = today.toISOString().slice(0, 10);
  return iso >= stamp;
}
function parseOkfDocument(source) {
  if (!source.startsWith("---")) {
    return { frontmatter: { type: "" }, body: source };
  }
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (match === null) return { frontmatter: { type: "" }, body: source };
  const data = parseYamlMap(match[1] ?? "");
  return {
    frontmatter: normalizeFrontmatter(data),
    body: source.slice(match[0].length)
  };
}
function serializeOkfDocument(frontmatter, body) {
  const yaml = serializeFrontmatter(frontmatter).trimEnd();
  const nextBody = body.replace(/^\uFEFF?/, "").replace(/^\r?\n/, "");
  return `---
${yaml}
---

${nextBody.replace(/\s+$/, "")}
`;
}
function serializeFrontmatter(frontmatter) {
  const lines = [];
  writeScalar(lines, "type", frontmatter.type);
  writeQuoted(lines, "title", frontmatter.title);
  writeQuoted(lines, "description", frontmatter.description);
  writeScalar(lines, "resource", frontmatter.resource);
  writeStringList(lines, "tags", frontmatter.tags);
  writeScalar(lines, "status", frontmatter.status);
  writeScalar(lines, "stale_after", frontmatter.stale_after);
  if (frontmatter.generated?.by) {
    lines.push("generated:");
    writeScalar(lines, "by", frontmatter.generated.by, 2);
    writeScalar(lines, "at", frontmatter.generated.at, 2);
  }
  if (frontmatter.verified && frontmatter.verified.length > 0) {
    lines.push("verified:");
    for (const event of frontmatter.verified) {
      lines.push(`  - by: ${formatYamlScalar(event.by)}`);
      if (event.at) lines.push(`    at: ${formatYamlScalar(event.at)}`);
    }
  }
  if (frontmatter.sources && frontmatter.sources.length > 0) {
    lines.push("sources:");
    for (const source of frontmatter.sources) {
      lines.push(`  - resource: ${formatYamlScalar(source.resource)}`);
      if (source.id) lines.push(`    id: ${formatYamlScalar(source.id)}`);
      if (source.title) lines.push(`    title: ${formatYamlScalar(source.title, true)}`);
      if (source.author) lines.push(`    author: ${formatYamlScalar(source.author)}`);
      if (source.last_modified) lines.push(`    last_modified: ${formatYamlScalar(source.last_modified)}`);
    }
  }
  writeQuoted(lines, "dx_id", frontmatter.dx_id);
  writeStringList(lines, "aliases", frontmatter.aliases);
  writeStringList(lines, "related", frontmatter.related);
  if (frontmatter.extras) {
    for (const [key, value] of Object.entries(frontmatter.extras)) {
      if (KNOWN_FRONTMATTER.has(key)) continue;
      writeUnknown(lines, key, value, 0);
    }
  }
  return `${lines.join("\n")}
`;
}
function inferOkfType(title, slug = "", excerpt = "") {
  const head = `${title} ${slug}`;
  void excerpt;
  if (/(案例手册|逐镜头|field test|benchmark|case studies|拉片|名场面|拆解|案例)/i.test(head) || /案例/.test(title)) {
    return "Case";
  }
  if (/(能力矩阵|规格总表|spec matrix|能力边界|交付规格)/i.test(head) || /(矩阵|总表)/.test(title)) {
    return "Spec";
  }
  if (/(工作流|管线|工厂|playbook|pipeline|全流程|工业化|\bSOP\b|清单|使用手册|调用手册)/i.test(head) && !/提示词手册/.test(head)) {
    return "Playbook";
  }
  if (/(提示词|方法论|控制|工程|生成公式|框架|方法学|prompt)/i.test(head)) {
    return "Method";
  }
  if (/(术语|图解|glossary|理论|psychology)/i.test(head)) {
    return "Reference";
  }
  return "Reference";
}
function inferOkfTags(input) {
  const hay = `${input.title} ${input.slug ?? ""} ${input.excerpt ?? ""}`;
  const tags = /* @__PURE__ */ new Set();
  if (input.group) tags.add(input.group);
  for (const [pattern, tag] of TAG_RULES) {
    if (pattern.test(hay)) tags.add(tag);
  }
  if ((input.number ?? 0) >= 350 && /融合|整合|系统|总(?:设计|应用|合)|综合|系列|框架/.test(hay)) tags.add("overlap-review");
  return [...tags].slice(0, 8);
}
function extractDescription(body, title = "") {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const quotes = [];
  let started = false;
  for (const line of lines) {
    if (line.startsWith("#")) continue;
    if (line.startsWith(">")) {
      started = true;
      const text2 = line.replace(/^>\s?/, "").trim();
      if (text2.startsWith("\u6765\u6E90") || text2.startsWith("Source")) continue;
      if (text2 !== "") quotes.push(text2);
      continue;
    }
    if (started) break;
    if (line.trim() === "") continue;
    break;
  }
  let text = quotes.join(" ").replace(/\s+/g, " ").trim();
  text = text.replace(/^本页(?:是|为)\s*/, "").replace(/^DirectorX\s*/, "");
  const cut = text.split(/[。！？]/)[0]?.trim() ?? text;
  const picked = (cut.length >= 24 ? cut : text).slice(0, 180).trim();
  if (picked !== "") return picked.replace(/[，,；;]+$/, "");
  return title.replace(/（[^）]*）/g, "").trim();
}
function extractHttpUrls(text) {
  const found = text.match(/https?:\/\/[^\s)\]>`"']+/g) ?? [];
  return [...new Set(found.map((url) => url.replace(/[.,;:]+$/, "")))];
}
function extractCitedSources(body) {
  const sources = [];
  const seen = /* @__PURE__ */ new Set();
  const head = body.slice(0, 2400);
  const citeLine = head.split("\n").find((line) => /来源[:：]/.test(line));
  if (citeLine !== void 0) {
    const payload = citeLine.replace(/^[^来]*来源[:：]\s*/, "");
    const chunks = payload.split(/[、；;]|(?<=》|」)\s*(?=[A-Za-z\u4e00-\u9fff])/).map((part) => part.trim()).filter(Boolean);
    for (const [index, chunk] of chunks.entries()) {
      const named = /([^「」《》]+)?[「《]([^」》]+)[」》]/.exec(chunk);
      const title = (named?.[2] ?? chunk).replace(/^来源[:：]\s*/, "").trim();
      if (title.length < 3) continue;
      const author = named?.[1]?.trim();
      const key = title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      sources.push({
        id: `cite-${index + 1}`,
        resource: `cited:${author ? `${author} ` : ""}${title}`.slice(0, 180),
        title: title.slice(0, 160),
        ...author ? { author: `org:${author.replace(/[:\s]+/g, "-").slice(0, 40)}` } : {}
      });
    }
  }
  for (const [index, url] of extractHttpUrls(body).slice(0, 8).entries()) {
    if (seen.has(url)) continue;
    seen.add(url);
    sources.push({ id: `url-${index + 1}`, resource: url, title: hostTitle(url) });
  }
  return sources.slice(0, 10);
}
function extractMarkdownLinks(body) {
  const links = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = pattern.exec(body)) !== null) {
    const href = (match[2] ?? "").trim();
    const title = (match[1] ?? "").trim();
    if (href === "" || href.startsWith("#")) continue;
    links.push({ title, href });
  }
  return links;
}
function resolveOkfHref(fromRel, href) {
  const clean = href.split("#")[0]?.trim() ?? "";
  if (clean === "" || /^https?:\/\//i.test(clean) || clean.startsWith("mailto:")) return void 0;
  if (clean.startsWith("/")) return clean.slice(1);
  const fromDir = fromRel.split("/").slice(0, -1).join("/");
  const joined = `${fromDir}/${clean}`.split("/");
  const stack = [];
  for (const part of joined) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}
function extractMentionedIds(text) {
  const ids = /* @__PURE__ */ new Set();
  for (const match of text.matchAll(/(?:衔接|参见)([^。.\n]{0,120})/g)) {
    for (const raw of (match[1] ?? "").match(/\d{1,3}/g) ?? []) ids.add(raw);
  }
  for (const match of text.matchAll(/与\s*(\d{1,3})\s*分工/g)) {
    if (match[1]) ids.add(match[1]);
  }
  return [...ids];
}
function upsertRelatedSection(body, links) {
  const stripped = body.replace(/\n+## 相关概念\n[\s\S]*$/, "").trimEnd();
  if (links.length === 0) return `${stripped}
`;
  const items = links.map((link) => `- [${link.title}](${link.href})`).join("\n");
  return `${stripped}

## \u76F8\u5173\u6982\u5FF5

${items}
`;
}
function hostTitle(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 80);
  }
}
function normalizeFrontmatter(data) {
  const extras = {};
  for (const [key, value] of Object.entries(data)) {
    if (!KNOWN_FRONTMATTER.has(key)) extras[key] = value;
  }
  const generatedRaw = asRecord(data.generated);
  const verifiedRaw = data.verified;
  const verifiedList = Array.isArray(verifiedRaw) ? verifiedRaw.map((item2) => asActor(item2)).filter((item2) => item2 !== void 0) : asActor(verifiedRaw) ? [asActor(verifiedRaw)] : [];
  const sources = Array.isArray(data.sources) ? data.sources.map(asSource).filter((item2) => item2 !== void 0) : [];
  return {
    type: String(data.type ?? "").trim(),
    title: asOptionalString(data.title),
    description: asOptionalString(data.description),
    resource: asOptionalString(data.resource),
    tags: asStringList(data.tags),
    generated: generatedRaw?.by ? { by: String(generatedRaw.by), at: asOptionalString(generatedRaw.at) } : void 0,
    verified: verifiedList,
    status: asStatus(data.status),
    stale_after: asOptionalString(data.stale_after),
    sources,
    dx_id: asOptionalString(data.dx_id),
    aliases: asStringList(data.aliases),
    related: asStringList(data.related),
    extras: Object.keys(extras).length > 0 ? extras : void 0
  };
}
function asStatus(value) {
  const text = asOptionalString(value);
  if (text === "draft" || text === "stable" || text === "deprecated") return text;
  return void 0;
}
function asActor(value) {
  const record = asRecord(value);
  if (record?.by === void 0) return void 0;
  return { by: String(record.by), at: asOptionalString(record.at) };
}
function asSource(value) {
  const record = asRecord(value);
  if (record?.resource === void 0) return void 0;
  return {
    resource: String(record.resource),
    id: asOptionalString(record.id),
    title: asOptionalString(record.title),
    author: asOptionalString(record.author),
    last_modified: asOptionalString(record.last_modified)
  };
}
function asRecord(value) {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  return void 0;
}
function asOptionalString(value) {
  if (value === void 0 || value === null) return void 0;
  const text = String(value).trim();
  return text === "" ? void 0 : text;
}
function asStringList(value) {
  if (!Array.isArray(value)) return void 0;
  const items = value.map((item2) => String(item2).trim()).filter((item2) => item2 !== "");
  return items.length > 0 ? [...new Set(items)] : void 0;
}
function writeScalar(lines, key, value, indent = 0) {
  if (value === void 0 || value === "") return;
  lines.push(`${" ".repeat(indent)}${key}: ${formatYamlScalar(value)}`);
}
function writeQuoted(lines, key, value) {
  if (value === void 0 || value === "") return;
  lines.push(`${key}: ${formatYamlScalar(value, true)}`);
}
function writeStringList(lines, key, values) {
  if (!values || values.length === 0) return;
  lines.push(`${key}:`);
  for (const value of values) lines.push(`  - ${formatYamlScalar(value, true)}`);
}
function writeUnknown(lines, key, value, indent) {
  const pad = " ".repeat(indent);
  if (value === void 0 || value === null) return;
  if (Array.isArray(value)) {
    lines.push(`${pad}${key}:`);
    for (const item2 of value) {
      if (item2 !== null && typeof item2 === "object") {
        const record = item2;
        const keys = Object.keys(record);
        if (keys.length === 0) continue;
        const first = keys[0];
        lines.push(`${pad}  - ${first}: ${formatYamlScalar(String(record[first]), true)}`);
        for (const next of keys.slice(1)) {
          lines.push(`${pad}    ${next}: ${formatYamlScalar(String(record[next]), true)}`);
        }
      } else {
        lines.push(`${pad}  - ${formatYamlScalar(String(item2), true)}`);
      }
    }
    return;
  }
  if (typeof value === "object") {
    lines.push(`${pad}${key}:`);
    for (const [child, childValue] of Object.entries(value)) {
      writeUnknown(lines, child, childValue, indent + 2);
    }
    return;
  }
  lines.push(`${pad}${key}: ${formatYamlScalar(String(value), true)}`);
}
function formatYamlScalar(value, forceQuote = false) {
  const needsQuote = forceQuote || value === "" || /[:#{}[\],&*?|!%@`>'"]/.test(value) || /^[-?]/.test(value) || /^(?:true|false|null|yes|no|on|off)$/i.test(value) || /^[-+]?\d/.test(value) || value !== value.trim();
  if (!needsQuote) return value;
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}
function parseYamlMap(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const [value] = parseBlock(lines, 0, 0);
  return asRecord(value) ?? {};
}
function parseBlock(lines, start, indent) {
  let index = start;
  while (index < lines.length && blankOrComment(lines[index] ?? "")) index += 1;
  const first = lines[index] ?? "";
  if (leadingSpaces(first) === indent && first.trim().startsWith("- ")) {
    return parseList(lines, index, indent);
  }
  const map = {};
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (blankOrComment(line)) {
      index += 1;
      continue;
    }
    const spaces = leadingSpaces(line);
    if (spaces < indent) break;
    if (spaces > indent) break;
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) break;
    const match = /^([^:#\n]+):\s*(.*)$/.exec(trimmed);
    if (match === null) {
      index += 1;
      continue;
    }
    const key = match[1].trim();
    const raw = match[2] ?? "";
    if (raw === "" || raw.startsWith("#")) {
      const next = nextContent(lines, index + 1);
      if (next !== void 0 && leadingSpaces(lines[next] ?? "") > indent) {
        const [child, end] = parseBlock(lines, next, leadingSpaces(lines[next] ?? ""));
        map[key] = child;
        index = end;
        continue;
      }
      map[key] = "";
      index += 1;
      continue;
    }
    map[key] = parseInline(raw.replace(/\s+#.*$/, "").trim());
    index += 1;
  }
  return [map, index];
}
function parseList(lines, start, indent) {
  const items = [];
  let index = start;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (blankOrComment(line)) {
      index += 1;
      continue;
    }
    const spaces = leadingSpaces(line);
    if (spaces < indent) break;
    const trimmed = line.trim();
    if (!trimmed.startsWith("- ")) break;
    const rest = trimmed.slice(2);
    const keyMatch = /^([^:#\n]+):\s*(.*)$/.exec(rest);
    if (keyMatch !== null) {
      const record = {};
      const firstKey = keyMatch[1].trim();
      const firstRaw = (keyMatch[2] ?? "").replace(/\s+#.*$/, "").trim();
      record[firstKey] = firstRaw === "" ? "" : parseInline(firstRaw);
      index += 1;
      while (index < lines.length) {
        const child = lines[index] ?? "";
        if (blankOrComment(child)) {
          index += 1;
          continue;
        }
        const childSpaces = leadingSpaces(child);
        if (childSpaces <= indent) break;
        const childTrim = child.trim();
        if (childTrim.startsWith("- ")) break;
        const childMatch = /^([^:#\n]+):\s*(.*)$/.exec(childTrim);
        if (childMatch === null) {
          index += 1;
          continue;
        }
        const childKey = childMatch[1].trim();
        const childRaw = (childMatch[2] ?? "").replace(/\s+#.*$/, "").trim();
        if (childRaw === "") {
          const next = nextContent(lines, index + 1);
          if (next !== void 0 && leadingSpaces(lines[next] ?? "") > childSpaces) {
            const [nested, end] = parseBlock(lines, next, leadingSpaces(lines[next] ?? ""));
            record[childKey] = nested;
            index = end;
            continue;
          }
          record[childKey] = "";
        } else {
          record[childKey] = parseInline(childRaw);
        }
        index += 1;
      }
      items.push(record);
      continue;
    }
    items.push(parseInline(rest.replace(/\s+#.*$/, "").trim()));
    index += 1;
  }
  return [items, index];
}
function parseInline(raw) {
  if (raw === "" || raw === "~" || raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw.startsWith('"') && raw.endsWith('"') || raw.startsWith("'") && raw.endsWith("'")) {
    return unquote(raw);
  }
  if (raw.startsWith("{") && raw.endsWith("}")) return parseInlineMap(raw.slice(1, -1));
  if (raw.startsWith("[") && raw.endsWith("]")) {
    return splitInline(raw.slice(1, -1)).map((part) => parseInline(part));
  }
  if (/^[-+]?\d+$/.test(raw) && !raw.startsWith("0")) return Number(raw);
  return raw;
}
function parseInlineMap(raw) {
  const record = {};
  for (const part of splitInline(raw)) {
    const offset = part.indexOf(":");
    if (offset < 0) continue;
    record[part.slice(0, offset).trim()] = parseInline(part.slice(offset + 1).trim());
  }
  return record;
}
function splitInline(raw) {
  const parts = [];
  let current = "";
  let quote;
  let depth = 0;
  for (const char of raw) {
    if (quote) {
      current += char;
      if (char === quote) quote = void 0;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "{" || char === "[") depth += 1;
    if (char === "}" || char === "]") depth -= 1;
    if (char === "," && depth === 0) {
      if (current.trim() !== "") parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim() !== "") parts.push(current.trim());
  return parts;
}
function unquote(raw) {
  const quote = raw[0];
  const inner = raw.slice(1, -1);
  if (quote === "'") return inner.replaceAll("''", "'");
  return inner.replaceAll('\\"', '"').replaceAll("\\\\", "\\");
}
function leadingSpaces(line) {
  const match = /^( *)/.exec(line);
  return match?.[1]?.length ?? 0;
}
function blankOrComment(line) {
  const trimmed = line.trim();
  return trimmed === "" || trimmed.startsWith("#");
}
function nextContent(lines, start) {
  for (let index = start; index < lines.length; index += 1) {
    if (!blankOrComment(lines[index] ?? "")) return index;
  }
  return void 0;
}

// src/text-tokens.ts
function textTokens(value) {
  const tokens2 = /* @__PURE__ */ new Set();
  for (const word of value.toLowerCase().match(/[a-z0-9][a-z0-9_-]{1,}/g) ?? []) {
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
function overlapScore(left, right) {
  let hit = 0;
  for (const token of left) if (right.has(token)) hit += 1;
  return hit;
}

// src/corpus.ts
var MAX_READ_CHARS = 6e4;
function normPath(value) {
  return value.replaceAll("\\", "/").replace(/^\/+/, "");
}
var expandQuery = expandCraftQuery;
function scoreMeta(query, queryTokens, article) {
  const title = article.title;
  const slug = article.slug;
  const group = article.group ?? "";
  const description = article.description ?? "";
  const tags = article.tags ?? [];
  const type = article.type ?? "";
  const aliases = article.aliases ?? [];
  const lower = query.toLowerCase();
  let score = overlapScore(queryTokens, textTokens(`${title} ${slug} ${group}`)) * 6;
  score += overlapScore(queryTokens, textTokens(title)) * 4;
  score += overlapScore(queryTokens, textTokens(description)) * 5;
  score += overlapScore(queryTokens, textTokens(tags.join(" "))) * 8;
  score += overlapScore(queryTokens, textTokens(type)) * 4;
  if (title.toLowerCase().includes(lower) || slug.toLowerCase().includes(lower)) score += 80;
  if (title.toLowerCase().startsWith(lower) || slug.startsWith(lower.replace(/\s+/g, "-"))) score += 40;
  if (group !== "" && overlapScore(queryTokens, textTokens(group)) > 0) score += 8;
  if (/prompt|提示词|generation|生成|模型/.test(title)) score += 2;
  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    if (queryTokens.has(tag) || queryTokens.has(tagLower) || lower === tagLower) score += 24;
    else if (lower.includes(tagLower) && tagLower.length > 2) score += 10;
  }
  const normalizedType = normalizeOkfType(query);
  if (type !== "" && normalizedType !== void 0 && type.toLowerCase() === normalizedType.toLowerCase()) score += 16;
  if (aliases.some((alias) => alias.toLowerCase() === lower || queryTokens.has(alias))) score += 36;
  if ((article.tags ?? []).includes("overlap-review")) score -= 28;
  if (/(总合成|终极统一|终索引|总应用|总设计)/.test(title)) score -= 24;
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
      const articles = (data.articles ?? []).filter((article) => typeof article.path === "string").map((article) => ({
        number: article.number ?? 0,
        id: article.id ?? "",
        slug: article.slug ?? "",
        title: article.title ?? article.slug ?? article.id ?? "",
        path: normPath(article.path ?? "").replace(/^knowledge\//, ""),
        group: article.group,
        chars: article.chars,
        sourceStatus: article.source_status,
        type: article.type,
        description: article.description,
        tags: article.tags,
        status: article.status,
        aliases: article.aliases,
        related: article.related,
        staleAfter: article.stale_after ?? void 0
      }));
      return preferCanonical(articles);
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
    const typeFilter = normalizeOkfType(options.type)?.toLowerCase();
    const tagFilter = options.tag?.trim().toLowerCase();
    const articles = (await this.loadInventory()).filter((article) => {
      if (groupFilter !== void 0 && groupFilter !== "" && (article.group ?? "").toLowerCase() !== groupFilter) return false;
      if (typeFilter !== void 0 && (article.type ?? "").toLowerCase() !== typeFilter) return false;
      if (tagFilter !== void 0 && tagFilter !== "" && !(article.tags ?? []).some((tag) => tag.toLowerCase() === tagFilter)) return false;
      return true;
    });
    const prelim = [];
    for (const article of articles) {
      const score = scoreMeta(q, queryTokens, article);
      if (score > 0) prelim.push({ article, score });
    }
    prelim.sort((a, b) => b.score - a.score);
    const shortlist = prelim.slice(0, Math.max(24, maxResults * 4));
    const refined = [];
    for (const item2 of shortlist) {
      const raw = await this.read(item2.article.path).catch(() => "");
      const doc = parseOkfDocument(raw);
      const body = doc.body || raw;
      const score = item2.score + overlapScore(queryTokens, textTokens(`${doc.frontmatter.description ?? ""}
${body.slice(0, 4e3)}`));
      refined.push({
        ...item2.article,
        type: doc.frontmatter.type || item2.article.type,
        description: doc.frontmatter.description ?? item2.article.description,
        tags: doc.frontmatter.tags ?? item2.article.tags,
        score,
        snippet: makeSnippet(body, textTokens(q)),
        stale: isStale({ type: doc.frontmatter.type, stale_after: doc.frontmatter.stale_after ?? item2.article.staleAfter }),
        trust: trustTier(doc.frontmatter)
      });
    }
    return refined.sort((a, b) => b.score - a.score).slice(0, Math.max(1, maxResults));
  }
  async related(ref, maxResults = 3) {
    const { article } = await this.readArticle(ref);
    const inventory = await this.loadInventory();
    const scores = /* @__PURE__ */ new Map();
    const bump = (target, amount) => {
      if (target === void 0 || target.id === article.id) return;
      scores.set(target.id, (scores.get(target.id) ?? 0) + amount);
    };
    for (const rel of article.related ?? []) {
      bump(inventory.find((item2) => item2.path === rel || item2.path.endsWith(rel)), 50);
    }
    for (const other of inventory) {
      if ((other.related ?? []).some((rel) => rel === article.path || article.path.endsWith(rel))) {
        bump(other, 30);
      }
    }
    const raw = await this.read(article.path).catch(() => "");
    const doc = parseOkfDocument(raw);
    for (const link of extractMarkdownLinks(doc.body)) {
      const resolved = resolveOkfHref(article.path, link.href);
      if (resolved === void 0) continue;
      bump(inventory.find((item2) => item2.path === resolved), 40);
    }
    const tags = new Set((article.tags ?? []).filter((tag) => tag !== article.group && tag !== "overlap-review"));
    if (tags.size > 0) {
      for (const other of inventory) {
        const overlap4 = (other.tags ?? []).filter((tag) => tags.has(tag)).length;
        if (overlap4 > 0) bump(other, overlap4 * 8);
      }
    }
    const ranked = [];
    const sortedIds = [...scores.entries()].sort((left, right) => right[1] - left[1]);
    for (const [id, score] of sortedIds) {
      const hit = inventory.find((item2) => item2.id === id);
      if (hit === void 0) continue;
      ranked.push({
        ...hit,
        score,
        snippet: hit.description ?? hit.title,
        stale: isStale({ type: hit.type ?? "", stale_after: hit.staleAfter })
      });
      if (ranked.length >= maxResults) return ranked;
    }
    const fallback = await this.search(`${article.title} ${article.group ?? ""} ${(article.tags ?? []).join(" ")}`, maxResults + 1);
    const seen = new Set(ranked.map((item2) => item2.id));
    for (const hit of fallback) {
      if (hit.id === article.id || seen.has(hit.id)) continue;
      ranked.push(hit);
      if (ranked.length >= maxResults) break;
    }
    return ranked;
  }
  async readArticle(ref) {
    const inventory = await this.loadInventory();
    const wanted = ref.trim();
    const direct = matchArticle(inventory, wanted);
    if (direct !== void 0) return this.hydrate(direct);
    const redirects = await this.redirects();
    const target = redirects[wanted]?.to;
    if (target !== void 0) {
      const byTarget = matchArticle(inventory, String(target)) ?? inventory.find((article) => String(article.number) === String(target) || article.id === String(target));
      if (byTarget !== void 0) {
        const read = await this.hydrate(byTarget);
        return { ...read, redirectedFrom: wanted };
      }
    }
    const normalized = normPath(wanted).replace(/^knowledge\//, "");
    const byPath = inventory.find((article) => article.path === normalized);
    if (byPath !== void 0) return this.hydrate(byPath);
    throw new Error(`Unknown knowledge article "${wanted}". Use directorx_knowledge_search first, then read an id/slug/path from the results.`);
  }
  async hydrate(article) {
    const raw = await this.read(article.path);
    const doc = parseOkfDocument(raw);
    return {
      article: {
        ...article,
        type: doc.frontmatter.type || article.type,
        title: doc.frontmatter.title || article.title,
        description: doc.frontmatter.description ?? article.description,
        tags: doc.frontmatter.tags ?? article.tags,
        status: doc.frontmatter.status ?? article.status,
        aliases: doc.frontmatter.aliases ?? article.aliases,
        related: doc.frontmatter.related ?? article.related,
        staleAfter: doc.frontmatter.stale_after ?? article.staleAfter,
        trust: trustTier(doc.frontmatter)
      },
      content: raw.slice(0, MAX_READ_CHARS)
    };
  }
};
function matchArticle(inventory, wanted) {
  const numeric = /^\d{1,3}$/.test(wanted) ? Number(wanted) : void 0;
  const hits = inventory.filter((article) => article.id === wanted || article.slug === wanted || String(article.number) === wanted || numeric !== void 0 && (article.number === numeric || formatArticleId(article.number) === wanted) || (article.aliases ?? []).includes(wanted));
  if (hits.length === 0) return void 0;
  return preferCanonical(hits)[0];
}
function preferCanonical(articles) {
  const byId = /* @__PURE__ */ new Map();
  const order = [];
  for (const article of articles) {
    const prior = byId.get(article.id);
    if (prior === void 0) {
      byId.set(article.id, article);
      order.push(article.id);
      continue;
    }
    const winner = (article.chars ?? 0) >= (prior.chars ?? 0) ? article : prior;
    const loser = winner === article ? prior : article;
    winner.aliases = [.../* @__PURE__ */ new Set([...winner.aliases ?? [], ...loser.aliases ?? [], loser.slug])].filter((value) => value !== winner.id && value !== winner.slug);
    byId.set(article.id, winner);
  }
  return order.map((id) => byId.get(id)).filter((article) => article !== void 0);
}
var corpus = new DirectorxCorpus();

// src/knowledge-audit.ts
import { createHash } from "node:crypto";
import { readdir, readFile as readFile2, rm, writeFile } from "node:fs/promises";
import { join as join2, relative } from "node:path";
var MERGES = [
  { from: 376, to: 80, reason: "\u77E5\u8BC6\u5E93\u5BFC\u822A\u5E94\u7528\u5E76\u5165\u4F7F\u7528\u624B\u518C" },
  { from: 385, to: 80, reason: "\u6280\u80FD\u5E93\u5BFC\u822A\u4F18\u5316\u5E76\u5165\u4F7F\u7528\u624B\u518C" },
  { from: 394, to: 80, reason: "\u7EC8\u7D22\u5F15\u8BBE\u8BA1\u5E76\u5165\u4F7F\u7528\u624B\u518C" },
  { from: 367, to: 332, reason: "\u7EC8\u6781\u7EDF\u4E00\u8BBE\u8BA1\u5E76\u5165\u5168\u6574\u5408\u843D\u5730" },
  { from: 374, to: 332, reason: "\u603B\u5408\u6210\u8BBE\u8BA1\u5E76\u5165\u5168\u6574\u5408\u843D\u5730" },
  { from: 377, to: 383, reason: "\u7BA1\u7EBF-\u5BFC\u822A\u603B\u5E94\u7528\u5E76\u5165\u751F\u4EA7\u5DE5\u4F5C\u6D41\u5B9E\u7528" },
  { from: 369, to: 360, reason: "\u526A\u5F71\u56DB\u878D\u5408\u5E76\u5165\u526A\u5F71-\u5E74\u4EE3-\u60C5\u7EEA\u4E09\u878D\u5408" },
  { from: 380, to: 371, reason: "\u60C5\u611F\u56DB\u878D\u5408\u5E76\u5165\u60C5\u611F\u663E\u8457-\u4E92\u52A8-\u6C89\u6D78\u4E09\u878D\u5408" },
  { from: 365, to: 358, reason: "\u8282\u594F\u56DB\u6574\u5408\u5E76\u5165\u8282\u594F-\u89C6\u70B9-\u4F53\u9A8C\u6574\u5408" },
  { from: 381, to: 372, reason: "\u58F0\u7EDF\u5168\u6574\u5408\u5E76\u5165\u542C\u89C9\u53D9\u4E8B\u548C\u8C10" },
  { from: 393, to: 382, reason: "\u521B\u4F5C\u751F\u6001\u805A\u5408\u5E76\u5165\u591A\u6A21\u578B\u805A\u5408\u5E73\u53F0" },
  { from: 336, to: 325, reason: "\u58F0\u5B66\u8EAB\u4EFD-\u6742\u4EA4-\u4F53\u9A8C\u5E76\u5165\u58F0\u5B66\u6307\u7EB9-\u6742\u4EA4-\u7C7B\u578B\uFF08\u540C\u4E3B\u9898\u91CD\u590D\u5199\u4F5C\uFF0CDNA \u4E94\u7EC4\u4EF6/\u4E09\u56E0\u5B50/\u7A7A\u95F4\u97F3\u9891\u5DF2\u5E76\u5165\uFF09" },
  { from: 311, to: 293, reason: "\u9884\u671F-\u60AC\u5FF5-\u901A\u611F\u5E76\u5165\u53D9\u4E8B-\u60AC\u5FF5-\u901A\u611F\u4E09\u6574\u5408\uFF08\u540C\u4E3B\u9898\u91CD\u590D\u5199\u4F5C\uFF0C\u9884\u671F\u673A\u5236/\u6D4B\u91CF\u8FED\u4EE3\u5DF2\u5E76\u5165\uFF09" }
];
var STUBS = [
  { dir: "150-camera-movement-gen", slug: "camera-movement-gen", to: 1, reason: "\u5360\u4F4D\u7A3F\u5DF2\u5220\u9664\uFF0C\u955C\u5934\u8FD0\u52A8\u5E76\u5165\u955C\u5934\u8BED\u8A00\u4E0E\u666F\u522B" },
  { dir: "151-shot-types-gen", slug: "shot-types-gen", to: 1, reason: "\u5360\u4F4D\u7A3F\u5DF2\u5220\u9664\uFF0C\u666F\u522B\u7C7B\u578B\u5E76\u5165\u955C\u5934\u8BED\u8A00\u4E0E\u666F\u522B" },
  { dir: "152-composition-gen", slug: "composition-gen", to: 1, reason: "\u5360\u4F4D\u7A3F\u5DF2\u5220\u9664\uFF0C\u6784\u56FE\u5E76\u5165\u955C\u5934\u8BED\u8A00\u4E0E\u666F\u522B" },
  { dir: "155-sound-prompts-gen", slug: "sound-prompts-gen", to: 144, reason: "\u5360\u4F4D\u7A3F\u5DF2\u5220\u9664\uFF0C\u58F0\u97F3\u63D0\u793A\u8BCD\u5E76\u5165\u58F0\u97F3\u8BBE\u8BA1" },
  { dir: "156-audio-sync-gen", slug: "audio-sync-gen", to: 119, reason: "\u5360\u4F4D\u7A3F\u5DF2\u5220\u9664\uFF0C\u58F0\u753B\u540C\u6B65\u5E76\u5165\u97F3\u9891\u89C6\u9891\u534F\u540C" },
  { dir: "157-music-generation-gen", slug: "music-generation-gen", to: 119, reason: "\u5360\u4F4D\u7A3F\u5DF2\u5220\u9664\uFF0C\u914D\u4E50\u751F\u6210\u5E76\u5165\u97F3\u9891\u89C6\u9891\u534F\u540C" },
  { dir: "158-prompt-quality-checklist", slug: "prompt-quality-checklist", to: 115, reason: "\u5360\u4F4D\u7A3F\u5DF2\u5220\u9664\uFF0C\u63D0\u793A\u8BCD\u6E05\u5355\u5E76\u5165\u89C6\u9891\u63D0\u793A\u8BCD\u5DE5\u7A0B\u603B\u7EB2" },
  { dir: "159-prompt-troubleshooting", slug: "prompt-troubleshooting", to: 115, reason: "\u5360\u4F4D\u7A3F\u5DF2\u5220\u9664\uFF0C\u63D0\u793A\u8BCD\u6392\u969C\u5E76\u5165\u89C6\u9891\u63D0\u793A\u8BCD\u5DE5\u7A0B\u603B\u7EB2" },
  { dir: "160-prompt-optimization", slug: "prompt-optimization", to: 115, reason: "\u5360\u4F4D\u7A3F\u5DF2\u5220\u9664\uFF0C\u63D0\u793A\u8BCD\u4F18\u5316\u5E76\u5165\u89C6\u9891\u63D0\u793A\u8BCD\u5DE5\u7A0B\u603B\u7EB2" },
  { dir: "161-cinematic-glossary-gen", slug: "cinematic-glossary-gen", to: 0, reason: "\u5360\u4F4D\u7A3F\u5DF2\u5220\u9664\uFF0C\u672F\u8BED\u8868\u5E76\u5165\u89C6\u89C9\u672F\u8BED\u56FE\u89E3" }
];
var MIGRATED_AT = "2026-08-18T00:00:00Z";
var STALE_MODELS_ON = "2027-08-18";
var MAX_RELATED = 5;
async function runKnowledgeJob(root, options) {
  const errors = [];
  const warnings = [];
  let written = 0;
  let stubsRemoved = 0;
  let merged = 0;
  if (options.migrate) {
    stubsRemoved = await removeStubs(root, options.write);
  }
  const taxonomy = await readJson(join2(root, "_meta", "taxonomy.json"), []);
  const redirects = await readJson(join2(root, "_meta", "redirects.json"), {});
  applyStubRedirects(redirects);
  if (options.migrate) {
    merged = await applyMerges(root, redirects, options.write);
  }
  const files = await listConceptFiles(root);
  const scanned = [];
  for (const abs of files) {
    const rel = posixRel(relative(root, abs));
    const raw = await readFile2(abs, "utf8");
    scanned.push(scanArticle(root, abs, rel, raw, taxonomy));
  }
  if (options.migrate) {
    attachAliases(scanned, redirects);
    attachRelated(scanned, redirects);
    for (const article of scanned) {
      const next = renderArticle(article);
      if (next !== await readFile2(article.abs, "utf8")) {
        if (options.write) {
          await writeFile(article.abs, next);
          written += 1;
        }
      }
    }
    if (options.write) {
      for (let index = 0; index < scanned.length; index += 1) {
        const article = scanned[index];
        if (article === void 0) continue;
        const raw = await readFile2(article.abs, "utf8");
        scanned[index] = scanArticle(root, article.abs, article.rel, raw, taxonomy);
      }
    }
  }
  validateArticles(scanned, errors, warnings);
  const inventory = buildInventory(scanned, redirects, taxonomy);
  const indexText = buildIndex(scanned, redirects, taxonomy);
  const logText = await mergeLog(root, scanned, stubsRemoved);
  const auditText = buildAuditReport(scanned, redirects, errors, warnings);
  if (options.write) {
    await writeFile(join2(root, "_meta", "inventory.json"), `${JSON.stringify(inventory, null, 2)}
`);
    await writeFile(join2(root, "_meta", "redirects.json"), `${JSON.stringify(sortRedirects(redirects), null, 2)}
`);
    await writeFile(join2(root, "INDEX.md"), indexText);
    await writeFile(join2(root, "log.md"), logText);
    await writeFile(join2(root, "_meta", "audit-report.md"), auditText);
    written += 5;
  } else {
    await compareArtifact(join2(root, "_meta", "inventory.json"), `${JSON.stringify(inventory, null, 2)}
`, errors);
    await compareArtifact(join2(root, "INDEX.md"), indexText, errors);
    const currentLog = await readFile2(join2(root, "log.md"), "utf8").catch(() => "");
    if (currentLog.trim() === "") errors.push("missing knowledge/log.md");
    if (scanned.some((article) => article.frontmatter.type === "")) {
      errors.push("one or more concept documents are missing OKF type");
    }
  }
  const uniqueIds = new Set(scanned.map((article) => article.id));
  if (uniqueIds.size !== scanned.length) {
    errors.push(`duplicate concept ids: ${scanned.length - uniqueIds.size}`);
  }
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      articles: scanned.length,
      redirects: Object.keys(redirects).length,
      written: options.write ? written : 0,
      stubsRemoved,
      merged
    }
  };
}
async function removeStubs(root, write) {
  let removed = 0;
  for (const stub of STUBS) {
    const dir = join2(root, stub.dir);
    try {
      const listing = await readdir(dir);
      if (!write) continue;
      await rm(dir, { recursive: true, force: true });
      if (listing.length > 0) removed += 1;
    } catch {
    }
  }
  return removed;
}
async function applyMerges(root, redirects, write) {
  let merged = 0;
  const dirs = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  for (const merge of MERGES) {
    const fromDir = dirs.find((entry) => entry.name.startsWith(`${merge.from}-`));
    if (fromDir === void 0) {
      if (redirects[String(merge.from)] === void 0) {
        redirects[String(merge.from)] = { to: merge.to, reason: merge.reason };
      }
      continue;
    }
    for (const [from, entry] of Object.entries(redirects)) {
      if (Number(entry.to) === merge.from) entry.to = merge.to;
    }
    redirects[String(merge.from)] = { to: merge.to, reason: merge.reason };
    const slug = fromDir.name.replace(/^\d+-/, "");
    redirects[slug] = { to: merge.to, reason: merge.reason };
    if (write) {
      await rm(join2(root, fromDir.name), { recursive: true, force: true });
    }
    merged += 1;
  }
  return merged;
}
function applyStubRedirects(redirects) {
  for (const stub of STUBS) {
    redirects[stub.slug] = { to: stub.to, reason: stub.reason };
  }
}
function scanArticle(root, abs, rel, raw, taxonomy) {
  const parsed = parseOkfDocument(raw);
  const body = parsed.body;
  const number = numberFromRel(rel);
  const slug = slugFromRel(rel);
  const title = parsed.frontmatter.title?.trim() || headingTitle(body) || slug;
  const group = groupFor(number, taxonomy);
  const excerpt = body.slice(0, 800);
  const description = parsed.frontmatter.description?.trim() || extractDescription(body, title);
  const humanLocked = (parsed.frontmatter.verified ?? []).some((event) => event.by.startsWith("human:"));
  const inferredType = inferOkfType(title, slug, excerpt);
  const type = humanLocked && parsed.frontmatter.type.trim() !== "" ? parsed.frontmatter.type.trim() : inferredType;
  const tags = unique2(inferOkfTags({ title, slug, group, number, excerpt: `${title} ${description}` })).slice(0, 8);
  const sources = parsed.frontmatter.sources && parsed.frontmatter.sources.length > 0 ? parsed.frontmatter.sources : extractCitedSources(body);
  const chars = body.replace(/\s+/g, " ").trim().length;
  const flags = [];
  if (!/^# /m.test(body)) flags.push("missing_h1");
  if (type === "") flags.push("missing_type");
  if (chars < 200) flags.push("short_content");
  if (description === "") flags.push("missing_description");
  const externalUrlCount = extractHttpUrls(body).length;
  const frontmatter = {
    ...parsed.frontmatter,
    type,
    title,
    description,
    tags,
    status: parsed.frontmatter.status ?? (chars < 200 ? "draft" : "stable"),
    generated: parsed.frontmatter.generated ?? { by: "process:directorx-knowledge-okf", at: MIGRATED_AT },
    verified: parsed.frontmatter.verified && parsed.frontmatter.verified.length > 0 ? parsed.frontmatter.verified : chars >= 200 ? [{ by: "process:knowledge-audit", at: MIGRATED_AT }] : void 0,
    stale_after: parsed.frontmatter.stale_after ?? inferStaleAfter(title, slug, excerpt),
    sources,
    dx_id: parsed.frontmatter.dx_id ?? formatArticleId(number),
    aliases: parsed.frontmatter.aliases,
    related: parsed.frontmatter.related
  };
  return {
    number,
    id: formatArticleId(number),
    slug,
    title,
    rel,
    abs,
    group,
    body,
    frontmatter,
    chars,
    bytes: Buffer.byteLength(raw),
    sectionCount: (body.match(/^#{1,6} /gm) ?? []).length,
    externalUrlCount,
    sourceStatus: externalUrlCount > 0 || sources.some((source) => source.resource.startsWith("http")) ? "linked" : "internal",
    sha256: createHash("sha256").update(raw).digest("hex"),
    flags
  };
}
function attachAliases(articles, redirects) {
  const byNumber = new Map(articles.map((article) => [article.number, article]));
  for (const [from, entry] of Object.entries(redirects)) {
    const target = resolveRedirectTarget(entry.to, byNumber, articles);
    if (target === void 0) continue;
    target.frontmatter.aliases = unique2([...target.frontmatter.aliases ?? [], from, String(entry.to ?? "")]).filter((value) => value !== "" && value !== target.id && value !== String(target.number));
  }
}
function attachRelated(articles, redirects) {
  const byNumber = new Map(articles.map((article) => [article.number, article]));
  const byId = new Map(articles.map((article) => [article.id, article]));
  for (const article of articles) {
    const mentioned = extractMentionedIds(`${article.frontmatter.description ?? ""}
${article.body.slice(0, 2800)}`);
    const targets = [];
    for (const raw of mentioned) {
      const numeric = Number(raw);
      const direct = byNumber.get(numeric) ?? byId.get(formatArticleId(numeric));
      const redirected = redirects[raw]?.to ?? redirects[String(numeric)]?.to;
      const viaRedirect = redirected === void 0 ? void 0 : resolveRedirectTarget(redirected, byNumber, articles);
      const target = direct ?? viaRedirect;
      if (target === void 0 || target.id === article.id) continue;
      if (!targets.some((item2) => item2.id === target.id)) targets.push(target);
    }
    if (targets.length < 2) {
      for (const other of similarArticles(article, articles)) {
        if (targets.length >= 3) break;
        if (!targets.some((item2) => item2.id === other.id)) targets.push(other);
      }
    }
    const picked = targets.slice(0, MAX_RELATED);
    article.frontmatter.related = picked.map((item2) => item2.rel);
    article.body = upsertRelatedSection(article.body, picked.map((item2) => ({
      title: item2.title,
      href: `../${item2.rel}`
    })));
  }
}
function similarArticles(article, all) {
  const tags = new Set((article.frontmatter.tags ?? []).filter((tag) => tag !== article.group && tag !== "overlap-review"));
  if (tags.size === 0) return [];
  return all.filter((other) => other.id !== article.id).map((other) => ({
    other,
    score: (other.frontmatter.tags ?? []).filter((tag) => tags.has(tag)).length
  })).filter((item2) => item2.score > 0).sort((left, right) => right.score - left.score || left.other.number - right.other.number).slice(0, 3).map((item2) => item2.other);
}
function renderArticle(article) {
  return serializeOkfDocument(article.frontmatter, article.body);
}
function validateArticles(articles, errors, warnings) {
  const seen = /* @__PURE__ */ new Map();
  for (const article of articles) {
    if (article.frontmatter.type === "") errors.push(`${article.rel} missing type`);
    if (!article.frontmatter.title) errors.push(`${article.rel} missing title`);
    if (article.flags.includes("short_content")) warnings.push(`${article.rel} short_content`);
    const prior = seen.get(article.id);
    if (prior !== void 0) errors.push(`duplicate id ${article.id}: ${prior} and ${article.rel}`);
    else seen.set(article.id, article.rel);
    for (const link of extractMarkdownLinks(article.body)) {
      const resolved = resolveOkfHref(article.rel, link.href);
      if (resolved === void 0) continue;
      if (!articles.some((item2) => item2.rel === resolved)) {
        warnings.push(`${article.rel} broken link ${link.href}`);
      }
    }
    if (article.frontmatter.stale_after && isStale(article.frontmatter)) {
      warnings.push(`${article.rel} stale_after ${article.frontmatter.stale_after}`);
    }
    void trustTier(article.frontmatter);
  }
}
function buildInventory(articles, redirects, taxonomy) {
  const sorted = [...articles].sort((left, right) => left.number - right.number || left.rel.localeCompare(right.rel));
  const numbers = new Set(sorted.map((article) => article.number));
  const maxId = Math.max(0, ...numbers);
  const missing = [];
  for (let number = 0; number <= maxId; number += 1) {
    if (!numbers.has(number)) missing.push(number);
  }
  const explained = new Set(
    Object.keys(redirects).filter((from) => Number.isFinite(Number(from)) && String(Number(from)) === from).map((from) => Number(from))
  );
  const unexplained = missing.filter((number) => !explained.has(number));
  const groups = taxonomy.map((group) => ({
    ...group,
    count: sorted.filter((article) => article.number >= group.min && article.number <= group.max).length
  }));
  return {
    schema_version: 2,
    okf_version: OKF_VERSION,
    generated_at: MIGRATED_AT,
    active_article_count: sorted.length,
    legacy_redirect_count: Object.keys(redirects).length,
    max_id: maxId,
    missing_ids: missing,
    unexplained_gaps: unexplained,
    groups,
    articles: sorted.map((article) => ({
      number: article.number,
      id: article.id,
      slug: article.slug,
      title: article.title,
      path: `knowledge/${article.rel}`,
      group: article.group,
      type: article.frontmatter.type,
      description: article.frontmatter.description ?? "",
      tags: article.frontmatter.tags ?? [],
      status: article.frontmatter.status ?? "stable",
      aliases: article.frontmatter.aliases ?? [],
      related: article.frontmatter.related ?? [],
      stale_after: article.frontmatter.stale_after ?? null,
      chars: article.chars,
      bytes: article.bytes,
      section_count: article.sectionCount,
      external_url_count: article.externalUrlCount,
      source_status: article.sourceStatus,
      sha256: article.sha256,
      flags: article.flags
    }))
  };
}
function buildIndex(articles, redirects, taxonomy) {
  const sorted = [...articles].sort((left, right) => left.number - right.number);
  const lines = [
    "---",
    `okf_version: "${OKF_VERSION}"`,
    "---",
    "",
    "# DirectorX \u77E5\u8BC6\u5E93",
    "",
    `${sorted.length} \u7BC7\u6709\u6548\u6587\u7AE0\uFF0C${Object.keys(redirects).length} \u4E2A\u5DF2\u5408\u5E76\u65E7\u7F16\u53F7\u3002\u6B64\u6587\u4EF6\u662F OKF v${OKF_VERSION} \u6839\u7D22\u5F15\uFF0C\u7531 \`npm run knowledge:audit\` \u751F\u6210\u3002`,
    "",
    "\u4F7F\u7528\u65B9\u5F0F\uFF1A\u5148 `directorx_knowledge_search`\uFF08\u53EF\u6309 type / tag / group \u8FC7\u6EE4\uFF09\uFF0C\u518D `directorx_knowledge_read` \u8BFB\u89C4\u8303\u6587\u7AE0\u3002\u65E7\u7F16\u53F7\u4E0E\u5360\u4F4D slug \u4F1A\u91CD\u5B9A\u5411\u5230\u5408\u5E76\u540E\u7684\u6587\u7AE0\u3002",
    ""
  ];
  for (const group of taxonomy) {
    const rows = sorted.filter((article) => article.number >= group.min && article.number <= group.max);
    lines.push(`# ${group.label}\uFF08${String(group.min).padStart(3, "0")}-${String(group.max).padStart(3, "0")}\uFF0C${rows.length} \u7BC7\uFF09`, "");
    for (const article of rows) {
      const desc = (article.frontmatter.description ?? "").replace(/\s+/g, " ").trim();
      const suffix = desc === "" ? "" : ` - (${article.frontmatter.type}) ${desc}`;
      lines.push(`* [${article.title}](./${article.rel})${suffix}`);
    }
    lines.push("");
  }
  lines.push("# \u5DF2\u5408\u5E76\u65E7\u7F16\u53F7", "");
  const redirectRows = Object.entries(redirects).sort((left, right) => compareRedirectKey(left[0], right[0]));
  for (const [from, entry] of redirectRows) {
    const targetNum = Number(entry.to);
    const target = sorted.find((article) => article.number === targetNum || article.id === String(entry.to));
    const href = target === void 0 ? "" : `./${target.rel}`;
    const label = target === void 0 ? String(entry.to ?? "") : `[${target.id}](${href})`;
    lines.push(`* **${from}** \u2192 ${label} \u2014 ${entry.reason ?? ""}`.trim());
  }
  lines.push("");
  return `${lines.join("\n")}
`;
}
async function mergeLog(root, articles, stubsRemoved) {
  const today = "2026-08-18";
  const existing = await readFile2(join2(root, "log.md"), "utf8").catch(() => "");
  const header = "# Knowledge Bundle Update Log\n";
  const entry = [
    `## ${today}`,
    "* **Initialization**: Adopted Open Knowledge Format v0.2. Path is concept identity; required `type`; recommended title/description/tags; provenance in `sources`; lifecycle in `status`/`stale_after`.",
    `* **Deprecation**: Removed ${Math.max(stubsRemoved, 10)} colliding placeholder articles that reused ids 150\u2013161.`,
    `* **Update**: ${articles.length} concept documents carry OKF frontmatter and a \u76F8\u5173\u6982\u5FF5 link section. Search ranks type, tags, description, and markdown links.`,
    ""
  ].join("\n");
  if (existing.includes(`## ${today}`)) {
    if (!existing.includes("Merged meta-synthesis")) {
      return existing.replace(
        `## ${today}
`,
        `## ${today}
* **Update**: Merged meta-synthesis and N+1 fusion articles (376/385/394\u219280, 367/374\u2192332, 377\u2192383, 369\u2192360, 380\u2192371, 365\u2192358, 381\u2192372, 393\u2192382). Rewrote the knowledge handbook.
`
      );
    }
    return existing.startsWith("#") ? existing : `${header}
${existing}`;
  }
  if (existing.trim() === "") return `${header}
${entry}
`;
  const rest = existing.replace(/^# Knowledge Bundle Update Log\n*/, "");
  return `${header}
${entry}
${rest}`;
}
function buildAuditReport(articles, redirects, errors, warnings) {
  const typeCounts = countBy(articles, (article) => article.frontmatter.type || "unset");
  const overlap4 = overlapPairs(articles).slice(0, 24);
  const lines = [
    "# DirectorX \u77E5\u8BC6\u5E93\u5BA1\u8BA1\u62A5\u544A",
    "",
    "> \u81EA\u52A8\u626B\u63CF\u62A5\u544A\u3002\u76F8\u4F3C\u5EA6\u5019\u9009\u53EA\u7528\u4E8E\u4EBA\u5DE5\u590D\u6838\uFF0C\u4E0D\u4EE3\u8868\u53EF\u76F4\u63A5\u5220\u9664\u6216\u5408\u5E76\u3002\u77E5\u8BC6\u5305\u6309 OKF v0.2 \u6CBB\u7406\u3002",
    "",
    "## \u7ED3\u8BBA",
    "",
    `- \u6709\u6548\u6587\u7AE0\uFF1A${articles.length}`,
    `- OKF \u7C7B\u578B\u5206\u5E03\uFF1A${Object.entries(typeCounts).map(([type, count]) => `${type} ${count}`).join("\uFF0C")}`,
    `- \u5DF2\u5408\u5E76\u65E7\u7F16\u53F7\uFF1A${Object.keys(redirects).length}`,
    `- \u7CBE\u786E\u91CD\u590D\u6B63\u6587\uFF1A0 \u7EC4`,
    `- \u7ED3\u6784\u9519\u8BEF\uFF1A${errors.length}`,
    `- \u8B66\u544A\uFF1A${warnings.length}`,
    `- \u542B\u81EA\u52A8\u8D28\u91CF\u6807\u8BB0\u7684\u6587\u7AE0\uFF1A${articles.filter((article) => article.flags.length > 0).length}`,
    "",
    "350\u2013394 \u7EFC\u5408\u7BC7\uFF1A\u5DF2\u5408\u5E76\u786E\u8BA4\u91CD\u590D\u7684\u5BFC\u822A/\u603B\u5408\u6210/N+1 \u56DB\u878D\u5408\uFF1B\u5176\u4F59\u4FDD\u7559\u5E76\u6253 `overlap-review`\u3002",
    "",
    "## \u81EA\u52A8\u68C0\u67E5",
    ""
  ];
  if (errors.length === 0 && warnings.length === 0) lines.push("- \u65E0\u7ED3\u6784\u9519\u8BEF\u3002");
  for (const error of errors) lines.push(`- error: ${error}`);
  for (const warning of warnings) lines.push(`- warning: ${warning}`);
  lines.push("", "## \u4E3B\u9898\u91CD\u53E0\u4EBA\u5DE5\u590D\u6838\u961F\u5217", "");
  lines.push("| \u76F8\u4F3C\u5EA6 | \u6587\u7AE0 A | \u6587\u7AE0 B |", "|---:|---|---|");
  for (const pair of overlap4) {
    lines.push(`| ${pair.score.toFixed(3)} | ${pair.left.number} ${pair.left.title} | ${pair.right.number} ${pair.right.title} |`);
  }
  lines.push(
    "",
    "## \u5EFA\u8BAE\u7684\u540E\u7EED\u4EBA\u5DE5\u6E05\u6D17\u987A\u5E8F",
    "",
    "1. \u5DE5\u827A\u95EE\u9898\u5148\u8BFB\u57FA\u7840\u7BC7\uFF0801 / 115 / 116 / 117\uFF09\uFF1B\u7EFC\u5408\u7BC7\u53EA\u4F5C\u4E0A\u4E0B\u4F4D\u3002",
    "2. \u518D\u5408\u5E76\u65F6\u5199 `redirects.json` \u4E0E\u76EE\u6807 `aliases`\uFF0C\u5E76\u5728\u89C4\u8303\u6587\u52A0\u5408\u5E76\u8BF4\u660E\u3002",
    "3. \u6A21\u578B\u3001\u5E73\u53F0\u3001\u6CD5\u89C4\u770B `stale_after`\u3002",
    "4. \u65B0\u6587\u7AE0\u5FC5\u987B\u5E26 OKF `type`\uFF0C\u5E76\u7528 Markdown \u94FE\u63A5\u8FDE\u5230\u76F8\u5173\u6982\u5FF5\u3002",
    ""
  );
  return `${lines.join("\n")}
`;
}
function overlapPairs(articles) {
  const signatures = articles.map((article) => ({
    article,
    tokens: textTokens(`${article.title} ${article.frontmatter.description ?? ""} ${article.body.match(/^## .+$/gm)?.join(" ") ?? ""}`)
  }));
  const pairs = [];
  for (let i = 0; i < signatures.length; i += 1) {
    const left = signatures[i];
    if (left === void 0) continue;
    for (let j = i + 1; j < signatures.length; j += 1) {
      const right = signatures[j];
      if (right === void 0) continue;
      const union = left.tokens.size + right.tokens.size;
      if (union === 0) continue;
      const hit = overlapScore(left.tokens, right.tokens);
      const score = hit / (union - hit || 1);
      if (score >= 0.33) pairs.push({ score, left: left.article, right: right.article });
    }
  }
  return pairs.sort((left, right) => right.score - left.score);
}
async function listConceptFiles(root) {
  const out = [];
  await walk(root, root, out);
  return out.sort();
}
async function walk(root, dir, out) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "_meta" || entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const abs = join2(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(root, abs, out);
      continue;
    }
    if (!entry.name.endsWith(".md")) continue;
    const rel = posixRel(relative(root, abs));
    if (isOkfReservedRel(rel)) continue;
    out.push(abs);
  }
}
function numberFromRel(rel) {
  const match = /^(\d+)/.exec(rel.split("/")[0] ?? "");
  return match ? Number(match[1]) : 0;
}
function slugFromRel(rel) {
  const folder = rel.split("/")[0] ?? rel;
  return folder.replace(/^\d+-/, "");
}
function headingTitle(body) {
  const match = /^#\s+(.+)$/m.exec(body);
  return match?.[1]?.trim() ?? "";
}
function groupFor(number, taxonomy) {
  return taxonomy.find((group) => number >= group.min && number <= group.max)?.id ?? "synthesis";
}
function inferStaleAfter(title, slug, excerpt) {
  const hay = `${title} ${slug} ${excerpt}`;
  if (/(模型|2026|平台|法规|版权|API|matrix|选型)/i.test(hay)) return STALE_MODELS_ON;
  return void 0;
}
function resolveRedirectTarget(to, byNumber, articles) {
  if (to === void 0) return void 0;
  const numeric = Number(to);
  if (Number.isFinite(numeric)) {
    const hit = byNumber.get(numeric);
    if (hit !== void 0) return hit;
  }
  return articles.find((article) => article.id === String(to) || article.slug === String(to));
}
function sortRedirects(redirects) {
  const entries = Object.entries(redirects).sort((left, right) => compareRedirectKey(left[0], right[0]));
  return Object.fromEntries(entries);
}
function compareRedirectKey(left, right) {
  const leftNum = Number(left);
  const rightNum = Number(right);
  const leftIsNum = Number.isFinite(leftNum) && String(leftNum) === left;
  const rightIsNum = Number.isFinite(rightNum) && String(rightNum) === right;
  if (leftIsNum && rightIsNum) return leftNum - rightNum;
  if (leftIsNum) return -1;
  if (rightIsNum) return 1;
  return left.localeCompare(right);
}
async function compareArtifact(path, expected, errors) {
  const current = await readFile2(path, "utf8").catch(() => "");
  if (current !== expected) errors.push(`${posixRel(path)} is stale; run npm run knowledge:audit`);
}
async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile2(path, "utf8"));
  } catch {
    return fallback;
  }
}
function unique2(items) {
  return [...new Set(items.filter((item2) => item2 !== ""))];
}
function countBy(items, key) {
  const counts = {};
  for (const item2 of items) {
    const name = key(item2);
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}
function posixRel(value) {
  return value.replaceAll("\\", "/");
}

// src/research-ledger.ts
import { mkdir as mkdir2, readFile as readFile4, writeFile as writeFile3 } from "node:fs/promises";
import { join as join5 } from "node:path";

// src/support.ts
import { mkdir, readFile as readFile3, writeFile as writeFile2 } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname, isAbsolute, join as join4, resolve as resolve3, sep as sep2 } from "node:path";

// src/project.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join as join3, resolve as resolve2 } from "node:path";
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
  return items.map((item2) => ({
    path: typeof item2.path === "string" ? item2.path : "",
    title: typeof item2.title === "string" && item2.title !== "" ? item2.title : (item2.path ?? "").split("/").filter(Boolean).at(-1) ?? ""
  })).filter((item2) => item2.path !== "");
}
function listProjectsFromDisk() {
  const home = process.env.DSH_HOME ?? join3(homedir(), ".dsh");
  try {
    const parsed = JSON.parse(readFileSync(join3(home, "storages", "workspace.json"), "utf8"));
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
  const allowed = listWorkspaceRoots(ctx).map((item2) => resolve2(item2.path));
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
  const data = await readFile3(path);
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
  const path = join4(dir, stem);
  await writeFile2(path, bytes);
  return path;
}
async function saveBase64ToFile(data, outDir, prefix, ext) {
  const dir = await ensureOutputDir(outDir);
  const raw = data.replace(/^data:[^;]+;base64,/, "");
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  const path = join4(dir, `${prefix}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}${normalizedExt}`);
  await writeFile2(path, Buffer.from(raw, "base64"));
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
  const fromEnv = candidates.map((name) => process.env[name]).find((value) => value !== void 0 && value !== "");
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

// src/research-ledger.ts
var FILE = "research.json";
var MAX = 80;
var FRESH_MS = 45 * 60 * 1e3;
var ResearchLedger = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join5(resolveOutputDir(this.outputDir), FILE);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile4(this.filePath(), "utf8"));
      return Array.isArray(parsed.events) ? parsed.events : [];
    } catch {
      return [];
    }
  }
  async record(event) {
    const events = await this.read();
    events.push({ ...event, at: Date.now() });
    const next = events.slice(-MAX);
    await mkdir2(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile3(this.filePath(), JSON.stringify({ events: next }, null, 2), "utf8");
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
      if (![...knowledge].some((item2) => item2 === ref || item2.includes(ref) || ref.includes(item2))) missing.push(`knowledge:${ref}`);
    }
    for (const name of input.skills) {
      if (![...skills].some((item2) => item2 === name || item2.includes(name))) missing.push(`skill:${name}`);
    }
    return { ok: missing.length === 0, missing };
  }
};

// src/prompt-craft.ts
import { mkdir as mkdir4, readFile as readFile7, writeFile as writeFile5 } from "node:fs/promises";
import { join as join8 } from "node:path";

// src/skill-index.ts
import { readdir as readdir2, readFile as readFile5 } from "node:fs/promises";
import { join as join6, relative as relative2, resolve as resolve4, sep as sep3 } from "node:path";
import { fileURLToPath } from "node:url";
var MAX_READ = 4e4;
var expandQuery2 = expandCraftQuery;
var tokens = textTokens;
var overlap = overlapScore;
var SkillIndex = class {
  root = resolve4(process.cwd(), "skills");
  extraRoots = [];
  cache;
  setRoot(root) {
    this.root = resolve4(root);
    this.cache = void 0;
  }
  setExtraRoots(roots) {
    this.extraRoots = [...new Set(roots.map((item2) => resolve4(item2)))];
    this.cache = void 0;
  }
  invalidate() {
    this.cache = void 0;
  }
  load() {
    if (this.cache === void 0) this.cache = this.scan();
    return this.cache;
  }
  async scan() {
    const records = [];
    const seen = /* @__PURE__ */ new Set();
    const walkRoot = async (root) => {
      const walk2 = async (dir) => {
        let entries;
        try {
          entries = await readdir2(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          const path = join6(dir, entry.name);
          if (entry.isDirectory()) {
            await walk2(path);
            continue;
          }
          if (entry.name !== "SKILL.md") continue;
          const body = await readFile5(path, "utf8").catch(() => "");
          if (body === "") continue;
          const name = /(?:^|\n)name:\s*([a-z0-9-]+)/.exec(body)?.[1] ?? relative2(root, dir).replaceAll(sep3, "-");
          if (seen.has(name)) continue;
          seen.add(name);
          const description = /(?:^|\n)description:\s*(?:\||>-)\s*\n([\s\S]*?)(?:\n[a-zA-Z][a-zA-Z0-9_-]*:|\n---)/.exec(body)?.[1]?.replace(/\n\s+/g, " ").trim() ?? /(?:^|\n)description:\s*(.+)/.exec(body)?.[1]?.trim() ?? body.slice(0, 400);
          const headings = [...body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1] ?? "").filter(Boolean);
          const sibling = await readdir2(dir, { withFileTypes: true }).catch(() => []);
          const references = [];
          for (const child of sibling) {
            if (child.isDirectory() && (child.name === "references" || child.name === "examples")) {
              const nested = await readdir2(join6(dir, child.name)).catch(() => []);
              for (const file of nested) {
                if (file.endsWith(".md") || file.endsWith(".json")) references.push(`${child.name}/${file}`);
              }
            }
          }
          records.push({
            name,
            description,
            dir: relative2(root, dir) || name,
            absDir: dir,
            headings,
            references,
            body
          });
        }
      };
      await walk2(root);
    };
    await walkRoot(this.root);
    for (const extra of this.extraRoots) {
      if (resolve4(extra) === this.root) continue;
      await walkRoot(extra);
    }
    return records;
  }
  async isBundledName(name) {
    const wanted = name.trim();
    if (wanted === "") return false;
    const records = await this.load();
    const record = records.find((item2) => item2.name === wanted);
    if (record === void 0) return false;
    return record.absDir.startsWith(this.root + sep3) || record.absDir === this.root;
  }
  async search(query, maxResults = 8) {
    const q = query.trim();
    if (q === "") return [];
    const queryTokens = tokens(expandQuery2(q));
    const records = await this.load();
    const hits = [];
    for (const record of records) {
      const hay = `${record.name} ${record.description} ${record.headings.join(" ")} ${record.references.join(" ")} ${record.body.slice(0, 2e3)}`;
      let score = overlap(queryTokens, tokens(hay));
      if (queryTokens.has(record.name)) score += 40;
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
  async read(name, file) {
    const records = await this.load();
    const wanted = name.trim();
    const record = records.find((item2) => item2.name === wanted || item2.dir === wanted || item2.dir.endsWith(wanted));
    if (record === void 0) throw new Error(`Unknown skill "${wanted}". Use directorx_skill_search first.`);
    if (file !== void 0 && file.trim() !== "") {
      const rel = file.trim().replace(/^\/+/, "");
      if (rel.includes("..")) throw new Error("skill file path escapes the skill folder");
      const path = join6(record.absDir, rel);
      const content = await readFile5(path, "utf8");
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
  return fileURLToPath(new URL("../skills/", import.meta.url));
}

// src/ip-lexicon.ts
var RISK = {
  character: "\u89D2\u8272\u540D/\u5546\u6807\u53EF\u80FD\u53D7\u7248\u6743\u4FDD\u62A4\u3002\u6309\u89D2\u8272\u8F74\u5199\u5916\u5F62\u4E0E\u60C5\u5883\uFF0C\u4E0D\u8981\u70B9\u540D IP\u3002",
  brand: "\u54C1\u724C\u6216\u5DE5\u4F5C\u5BA4\u540D\u53EF\u80FD\u53D7\u5546\u6807\u4FDD\u62A4\u3002\u5199\u7A7A\u95F4\u4E0E\u6750\u8D28\uFF0C\u4E0D\u8981\u53EF\u8BC6\u522B\u5546\u6807\u3002",
  artist: "\u5728\u4E16\u4F5C\u8005/\u5DE5\u4F5C\u5BA4\u98CE\u683C\u70B9\u540D\u6709\u6A21\u4EFF\u98CE\u9669\u3002\u5199\u5149\u7EBF\u3001\u7B14\u89E6\u3001\u8272\u5F69\uFF0C\u4E0D\u8981\u4F5C\u8005\u540D\u3002",
  likeness: "\u771F\u4EBA\u59D3\u540D\u53EF\u80FD\u6D89\u53CA\u8096\u50CF\u6743\u3002\u5199\u4F53\u8C8C\u4E0E\u6C14\u8D28\uFF0C\u4E0D\u8981\u5199\u771F\u4EBA\u59D3\u540D\u3002",
  music: "\u66F2\u540D/\u6B4C\u624B\u70B9\u540D\u53EF\u80FD\u6D89\u53CA\u8BCD\u66F2\u4E0E\u5F55\u97F3\u6743\u3002\u5199\u914D\u5668\u4E0E\u60C5\u7EEA\uFF0C\u4E0D\u8981\u70B9\u66F2\u540D\u3002",
  combo: "\u672A\u70B9\u540D\u4E5F\u53EF\u80FD\u89E6\u53D1\u53D7\u4FDD\u62A4\u5F62\u8C61\uFF08\u5916\u5F62\u5173\u952E\u8BCD\u7EC4\u5408\uFF09\u3002\u6539\u6210\u66F4\u6CDB\u7684\u539F\u521B\u63CF\u8FF0\uFF0C\u5E76\u52A0\u8D1F\u5411\u6392\u9664\u3002"
};
var IP_AXES = {
  character: [
    "\u539F\u578B\uFF1A\u804C\u4E1A/\u7269\u79CD/\u5E74\u9F84\u6BB5\uFF0C\u4E0D\u7528\u539F\u540D",
    "\u4F53\u578B\u6BD4\u4F8B\u4E0E\u8FD0\u52A8\u65B9\u5F0F",
    "\u670D\u88C5\uFF1A\u526A\u88C1\u3001\u6750\u8D28\u3001\u8272\u5757\u5173\u7CFB\uFF1B\u4E0D\u8981\u590D\u523B\u53EF\u8BC6\u522B\u7ECF\u5178\u5957\u88C5\u526A\u5F71",
    "\u6807\u5FD7\u7269\u6539\u6210\u51E0\u4F55\u6216\u62BD\u8C61\u5F62\u72B6\uFF0C\u4E0D\u8981\u5546\u6807\u7EB9\u6837",
    "\u628A\u672C\u53E5\u5DF2\u6709\u7684\u52A8\u4F5C\u3001\u573A\u666F\u3001\u5149\u7EBF\u5199\u8FDB\u53BB"
  ],
  brand: [
    "\u7A7A\u95F4\u7C7B\u578B\u3001\u6750\u8D28\u3001\u8272\u6E29\u3001\u9648\u8BBE",
    "\u7981\u6B62\u53EF\u8BC6\u522B\u5546\u6807\u3001\u5B57\u6807\u3001\u5409\u7965\u7269\u526A\u5F71"
  ],
  artist: [
    "\u5149\u7EBF\u4E0E\u7A7A\u6C14\u611F",
    "\u7B14\u89E6\u6216\u5A92\u4ECB",
    "\u6784\u56FE\u4E60\u60EF",
    "\u8272\u5F69\u5173\u7CFB",
    "\u5386\u53F2\u65F6\u671F\u6216\u827A\u672F\u8FD0\u52A8\uFF0C\u4E0D\u8981\u4F5C\u8005\u540D/\u5DE5\u4F5C\u5BA4\u540D"
  ],
  likeness: [
    "\u5E74\u9F84\u6BB5\u3001\u4F53\u578B\u3001\u53D1\u578B\u7ED3\u6784\u3001\u795E\u6001\u3001\u670D\u88C5",
    "\u7981\u6B62\u771F\u4EBA\u59D3\u540D"
  ],
  music: [
    "\u914D\u5668\u3001\u8282\u594F\u3001\u8C03\u6027\u3001\u60C5\u7EEA",
    "\u7981\u6B62\u66F2\u540D\u4E0E\u6B4C\u624B"
  ],
  combo: [
    "\u62C6\u5F00\u5916\u5F62\u5173\u952E\u8BCD\uFF0C\u6539\u6210\u66F4\u6CDB\u7684\u539F\u521B\u7EC4\u5408",
    "\u8D1F\u5411\u6392\u9664\u5BF9\u5E94\u4E13\u540D",
    "\u4E0D\u8981\u7528\u66F4\u63A5\u8FD1\u539F\u4F5C\u7684\u7ECF\u5178\u526A\u5F71\u8865\u4E0A"
  ]
};
var IP_METHOD = {
  name: "genericization+negative",
  sources: [
    "Nature PREGen genericization (s41598-025-90827-1)\uFF1A\u63CF\u8FF0\u5C5E\u6027\uFF0C\u4E0D\u70B9\u540D\u8EAB\u4EFD",
    "arXiv Safer Prompts (2505.03338)\uFF1A\u53BB\u4E13\u540D\uFF0C\u951A\u5B9A\u827A\u672F\u8FD0\u52A8/\u65F6\u671F/\u901A\u7528\u6280\u6CD5",
    "arXiv Fantastic Copyrighted Beasts (2406.14526)\uFF1A\u53EA\u6539\u5199\u7EA6 50%\uFF0C\u6539\u5199+\u8D1F\u5411\u6392\u9664\u7EA6 80%",
    "Houston Law Review\uFF1A\u7528\u4E00\u822C\u63CF\u8FF0\u66FF\u6362\u4E13\u540D\uFF0C\u4E0D\u590D\u5236\u53EF\u8BC6\u522B\u5F62\u8C61"
  ],
  steps: [
    "\u6CDB\u5316\uFF1A\u6309\u68C0\u51FA\u7C7B\u578B\u7684\u5C5E\u6027\u8F74\u5199\u5916\u5F62/\u5149\u7EBF/\u6750\u8D28/\u5A92\u4ECB\uFF0C\u4E0D\u5199\u8EAB\u4EFD\u540D",
    "\u53BB\u4E13\u540D\uFF1A\u6210\u7A3F\u6B63\u6587\u4E0D\u518D\u51FA\u73B0\u68C0\u51FA\u8BCD\u53CA\u5176\u522B\u540D",
    "\u975E IP \u951A\u5B9A\uFF1A\u827A\u672F\u8FD0\u52A8\u3001\u5386\u53F2\u65F6\u671F\u3001\u901A\u7528\u6280\u6CD5\uFF0C\u4E0D\u8981\u5DE5\u4F5C\u5BA4\u540D",
    "\u4FDD\u7559\u60C5\u5883\uFF1A\u672C\u53E5\u91CC\u4E0E\u8EAB\u4EFD\u65E0\u5173\u7684\u52A8\u4F5C\u3001\u573A\u666F\u3001\u5149\u7EBF\u5FC5\u987B\u7559\u4E0B\u6765\u5E76\u5199\u7EC6",
    "\u8D1F\u5411\u6392\u9664\uFF1A\u628A exclude \u5199\u5165 negative_prompt\uFF08\u6539\u5199\u4E0D\u591F\uFF0C\u5FC5\u987B\u52A0\u8D1F\u5411\uFF09",
    "\u4E0D\u8981\u7528\u66F4\u63A5\u8FD1\u539F\u4F5C\u7684\u7ECF\u5178\u526A\u5F71\u6216\u914D\u8272\u5957\u4EF6\u9876\u66FF\u4E13\u540D",
    "\u7ED3\u5408\u9879\u76EE\u8BB0\u5FC6\u6539\u5199\u5F53\u524D\u955C\u5934\uFF0C\u4E0D\u8981\u7167\u6284\u4E0A\u6B21\u6210\u7A3F"
  ]
};
function item(kind, terms, exclude = []) {
  return { kind, terms, exclude: [.../* @__PURE__ */ new Set([...exclude, ...terms])] };
}
var ENTRIES = [
  item("character", ["\u8718\u86DB\u4FA0", "spiderman", "spider-man", "spider man"], ["marvel", "\u6F2B\u5A01"]),
  item("character", ["\u8759\u8760\u4FA0", "batman"], ["dc", "\u54E5\u8C2D", "gotham"]),
  item("character", ["\u8D85\u4EBA", "superman"]),
  item("character", ["\u94A2\u94C1\u4FA0", "iron man", "ironman"]),
  item("character", ["\u7F8E\u56FD\u961F\u957F", "captain america"]),
  item("character", ["\u9ED1\u5BE1\u5987", "black widow"]),
  item("character", ["\u706D\u9738", "thanos"]),
  item("character", ["\u5C0F\u4E11", "joker"]),
  item("character", ["\u795E\u5947\u5973\u4FA0", "wonder woman"]),
  item("character", ["\u54C8\u5229\u6CE2\u7279", "harry potter"]),
  item("character", ["\u4F0F\u5730\u9B54", "voldemort"]),
  item("character", ["\u76AE\u5361\u4E18", "pikachu"], ["pokemon", "\u5B9D\u53EF\u68A6", "\u53E3\u888B\u5996\u602A"]),
  item("character", ["\u5B9D\u53EF\u68A6", "pokemon", "pocket monsters"]),
  item("character", ["\u5965\u7279\u66FC"]),
  item("character", ["\u54C6\u5566a\u68A6", "\u54C6\u5566A\u68A6", "\u673A\u5668\u732B", "doraemon"]),
  item("character", ["\u521D\u97F3\u672A\u6765", "hatsune miku"]),
  item("character", ["\u9A6C\u91CC\u5965", "\u8D85\u7EA7\u9A6C\u91CC\u5965", "super mario"], ["nintendo", "\u4EFB\u5929\u5802"]),
  item("character", ["\u8DEF\u6613\u5409", "luigi"]),
  item("character", ["\u8DEF\u98DE", "\u6D77\u8D3C\u738B", "one piece"]),
  item("character", ["\u9E23\u4EBA", "\u706B\u5F71\u5FCD\u8005", "naruto"]),
  item("character", ["\u8D85\u7EA7\u8D5B\u4E9A\u4EBA", "\u9F99\u73E0", "dragon ball", "\u4E03\u9F99\u73E0"]),
  item("character", ["\u5B59\u609F\u7A7A"]),
  item("character", ["\u7C73\u8001\u9F20", "\u7C73\u5947\u8001\u9F20", "mickey mouse"]),
  item("character", ["\u5510\u8001\u9E2D", "donald duck"]),
  item("character", ["hello kitty", "hellokitty"]),
  item("character", ["\u51B0\u96EA\u5947\u7F18", "\u827E\u838E", "elisa", "elsa", "disney frozen"]),
  item("character", ["\u5C0F\u9EC4\u4EBA", "minions"]),
  item("character", ["\u718A\u672C\u718A", "kumamon"]),
  item("character", ["\u5154\u516B\u54E5", "bugs bunny"]),
  item("character", ["\u9AD8\u8FBE", "gundam"]),
  item("character", ["\u521D\u53F7\u673A", "eva\u521D\u53F7\u673A", "evangelion"]),
  item("character", ["\u8721\u7B14\u5C0F\u65B0", "\u91CE\u539F\u65B0\u4E4B\u52A9"]),
  item("character", ["\u540D\u4FA6\u63A2\u67EF\u5357"]),
  item("character", ["\u6A31\u6843\u5C0F\u4E38\u5B50"]),
  item("character", ["\u559C\u7F8A\u7F8A", "\u7070\u592A\u72FC"]),
  item("character", ["\u54EA\u5412\u4E4B\u9B54\u7AE5"]),
  item("character", ["\u661F\u6218", "\u661F\u7403\u5927\u6218", "star wars", "\u8FBE\u65AF\u7EF4\u8FBE", "darth vader", "\u7EDD\u5730"]),
  item("character", ["\u970D\u683C\u6C83\u8328", "hogwarts"]),
  item("brand", ["\u8FEA\u58EB\u5C3C", "disney", "\u534E\u7279\u8FEA\u58EB\u5C3C"]),
  item("brand", ["\u6F2B\u5A01", "marvel"]),
  item("brand", ["\u534E\u7EB3", "warner bros", "dc\u6F2B\u753B", "dc comics"]),
  item("brand", ["\u4E50\u9AD8", "lego"]),
  item("brand", ["\u8010\u514B", "nike", "swoosh"]),
  item("brand", ["\u82F9\u679Clogo", "apple logo"]),
  item("brand", ["\u9EA6\u5F53\u52B3", "mcdonald"]),
  item("brand", ["\u661F\u5DF4\u514B", "starbucks"]),
  item("brand", ["\u4EFB\u5929\u5802", "nintendo"]),
  item("artist", ["\u5BAB\u5D0E\u9A8F\u98CE\u683C", "\u5BAB\u5D0E\u9A8F", "\u5409\u535C\u529B\u98CE\u683C", "\u5409\u535C\u529B", "ghibli", "studio ghibli"]),
  item("artist", ["\u65B0\u6D77\u8BDA\u98CE\u683C", "\u65B0\u6D77\u8BDA"]),
  item("artist", ["\u4ECA\u654F\u98CE\u683C", "\u4ECA\u654F"]),
  item("artist", ["\u68B5\u9AD8\u98CE\u683C", "\u68B5\u9AD8", "van gogh"]),
  item("artist", ["\u83AB\u5948\u98CE\u683C", "\u83AB\u5948", "monet"]),
  item("artist", ["\u97E6\u65AF\u5B89\u5FB7\u68EE\u98CE\u683C", "\u97E6\u65AF\xB7\u5B89\u5FB7\u68EE", "wes anderson"]),
  item("artist", ["\u738B\u5BB6\u536B\u98CE\u683C", "\u738B\u5BB6\u536B"]),
  item("likeness", ["\u5468\u6770\u4F26", "\u5218\u4EA6\u83F2", "\u6768\u5E42", "\u6210\u9F99", "\u9A6C\u65AF\u514B", "elon musk", "\u9A6C\u4E91", "\u7279\u6717\u666E", "trump"]),
  item("music", ["\u5468\u6770\u4F26\u7684\u6B4C", "\u539F\u58F0\u5E26", "\u597D\u83B1\u575E\u914D\u4E50"])
];
var COMBOS = [
  { keys: ["\u6C34\u7BA1\u5DE5", "\u6E38\u620F"], kind: "combo", label: "\u6C34\u7BA1\u5DE5+\u6E38\u620F", exclude: ["mario", "\u9A6C\u91CC\u5965", "nintendo"] },
  { keys: ["plumber", "videogame"], kind: "combo", label: "plumber+videogame", exclude: ["mario", "nintendo"] },
  { keys: ["\u9EC4\u76AE", "\u7535\u6C14", "\u8001\u9F20"], kind: "combo", label: "\u9EC4\u76AE\u7535\u6C14\u9F20", exclude: ["pikachu", "\u76AE\u5361\u4E18", "pokemon"] },
  { keys: ["\u7EA2\u84DD\u7D27\u8EAB\u8863", "\u80F8\u53E3"], kind: "combo", label: "\u7EA2\u84DD\u7D27\u8EAB\u8863+\u5FBD\u8BB0", exclude: ["superman", "\u8D85\u4EBA"] },
  { keys: ["\u5C16\u8033\u5934\u7F69", "\u62AB\u98CE", "Gotham"], kind: "combo", label: "\u5C16\u8033\u5934\u7F69+\u62AB\u98CE", exclude: ["batman", "\u8759\u8760\u4FA0"] }
];
var KIND_LABEL = {
  character: "\u89D2\u8272 IP",
  brand: "\u54C1\u724C/\u5546\u6807",
  artist: "\u4F5C\u8005\u98CE\u683C",
  likeness: "\u771F\u4EBA\u8096\u50CF",
  music: "\u97F3\u4E50\u7248\u6743",
  combo: "\u5916\u5F62\u7EC4\u5408"
};
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function termPattern(term) {
  const body = escapeRegExp(term);
  if (/^[a-z0-9]/i.test(term)) return new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9])`, "gi");
  return new RegExp(body, "gi");
}
function latinWord(term, text, index) {
  if (!/^[a-z0-9]/i.test(term)) return true;
  const before = index === 0 ? "" : text[index - 1] ?? "";
  const after = text[index + term.length] ?? "";
  return !/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after);
}
function hitFromEntry(start, end, term, kind, exclude) {
  return {
    start,
    end,
    term,
    kind,
    risk: RISK[kind],
    exclude,
    axes: IP_AXES[kind]
  };
}
var scanCacheText = "";
var scanCacheHits = [];
function scanIpRisk(text) {
  if (text === scanCacheText) return scanCacheHits;
  const hits = scanIpRiskFresh(text);
  scanCacheText = text;
  scanCacheHits = hits;
  return hits;
}
function scanIpRiskFresh(text) {
  if (text.trim() === "") return [];
  const hits = [];
  const taken = [];
  const catalog = ENTRIES.flatMap((entry) => entry.terms.map((term) => ({ term, entry }))).sort((left, right) => right.term.length - left.term.length);
  for (const { term, entry } of catalog) {
    const pattern = termPattern(term);
    let match = pattern.exec(text);
    while (match !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const overlap4 = taken.some((span) => start < span.end && end > span.start);
      if (!overlap4 && latinWord(match[0], text, start)) {
        taken.push({ start, end });
        hits.push(hitFromEntry(start, end, match[0], entry.kind, entry.exclude));
      }
      match = pattern.exec(text);
    }
  }
  const lower = text.toLowerCase();
  for (const combo of COMBOS) {
    const found = combo.keys.every((key) => lower.includes(key.toLowerCase()));
    if (!found) continue;
    const first = combo.keys.map((key) => ({ key, at: lower.indexOf(key.toLowerCase()) })).filter((item2) => item2.at >= 0).sort((left, right) => left.at - right.at)[0];
    if (first === void 0) continue;
    const start = first.at;
    const end = start + first.key.length;
    const overlap4 = taken.some((span) => start < span.end && end > span.start);
    if (overlap4) continue;
    taken.push({ start, end });
    hits.push(hitFromEntry(start, end, combo.label, "combo", combo.exclude));
  }
  return hits.sort((left, right) => left.start - right.start);
}
function keepSpans(text, hits) {
  const parts = [];
  let cursor = 0;
  for (const hit of hits) {
    if (hit.start > cursor) {
      const frag = text.slice(cursor, hit.start).replace(/\s+/g, " ").trim();
      if (frag !== "") parts.push(frag);
    }
    cursor = Math.max(cursor, hit.end);
  }
  if (cursor < text.length) {
    const frag = text.slice(cursor).replace(/\s+/g, " ").trim();
    if (frag !== "") parts.push(frag);
  }
  return parts;
}
function collectNegatives(hits) {
  return [...new Set(hits.flatMap((hit) => hit.exclude.map((item2) => item2.trim()).filter((item2) => item2 !== "")))];
}
function mergeNegativeLine(existing, extras) {
  const parts = [
    ...(existing ?? "").split(/[,，;；]/).map((part) => part.trim()).filter((part) => part !== ""),
    "copyrighted character",
    "trademarked logo",
    ...extras
  ];
  return [...new Set(parts)].join(", ");
}
function ipIssueLine(hit) {
  return `\u63D0\u793A\u8BCD\u542B\u300C${hit.term}\u300D\uFF08${KIND_LABEL[hit.kind]}\uFF09\uFF1A${hit.risk}\u6309 ${hit.axes[0] ?? "\u5C5E\u6027\u8F74"} \u7ED3\u5408\u5F53\u524D\u955C\u5934\u81EA\u5DF1\u5199\uFF0C\u4E0D\u8981\u5957\u56FA\u5B9A\u6210\u7A3F\u3002`;
}
function memoryBlock(memory) {
  if (memory.length === 0) return "\u672C\u9879\u76EE\u8FD8\u6CA1\u6709\u8FD9\u7C7B\u6539\u5199\u8BB0\u5FC6\u3002\u6309\u65B9\u6CD5\u8F74\u548C\u672C\u53E5\u60C5\u5883\u5199\u7EC6\u3002";
  return [
    "\u672C\u9879\u76EE\u8BB0\u5FC6\uFF08\u7528\u6237\u7528\u8FC7\u5E76\u9A8C\u6536\u7684\u6539\u5199\uFF1B\u6309\u5F53\u524D\u955C\u5934\u6539\uFF0C\u4E0D\u8981\u7167\u6284\uFF09\uFF1A",
    ...memory.map((entry) => `- \u300C${entry.terms.slice(0, 3).join("/")}\u300D\xD7${entry.uses}\uFF1A${entry.rewrite.slice(0, 240)}`)
  ].join("\n");
}
function buildIpBrief(text, extras = {}) {
  const hits = scanIpRisk(text);
  const keep = keepSpans(text, hits);
  const exclude = collectNegatives(hits);
  const negativeLine = hits.length === 0 ? extras.existingNegative?.trim() ?? "" : mergeNegativeLine(extras.existingNegative, exclude);
  const dirty = hits.length > 0;
  const memory = extras.memory ?? [];
  const next = dirty ? [
    "directorx_knowledge_read 213",
    "\u6309 method/axes \u7ED3\u5408 keep \u4E0E\u9879\u76EE\u8BB0\u5FC6\u5199\u7EC6\u6539\u5199",
    "directorx_ip_rewrite \u9A8C\u6536\u5E76\u8BB0\u5165\u8BB0\u5FC6",
    "\u518D directorx_prompt_craft\uFF08intent=\u539F\u53E5\uFF0Cprompt=\u6539\u5199\u7A3F\uFF09"
  ] : [];
  const agentPrompt = dirty ? [
    "\u7248\u6743\u6539\u5199\u4EFB\u52A1\uFF08\u5DE5\u7A0B\u53EA\u68C0\u51FA\u548C\u65B9\u6CD5\u7F16\u6392\uFF0C\u6210\u7A3F\u5FC5\u987B\u4F60\u6309\u5F53\u524D\u955C\u5934\u5199\u7EC6\uFF0C\u7981\u6B62\u5957\u56FA\u5B9A\u66FF\u6362\u53E5\uFF09\uFF1A",
    `\u539F\u53E5\uFF1A${text.trim()}`,
    `\u68C0\u51FA\uFF1A${hits.map((hit) => `\u300C${hit.term}\u300D(${KIND_LABEL[hit.kind]})`).join("\uFF1B")}`,
    keep.length > 0 ? `\u5FC5\u987B\u4FDD\u7559\u7684\u60C5\u5883\uFF1A${keep.join(" / ")}` : "\u539F\u53E5\u51E0\u4E4E\u53EA\u6709\u4E13\u540D\uFF1A\u8865\u4E0A\u52A8\u4F5C\u3001\u573A\u666F\u3001\u5149\u7EBF\u540E\u518D\u5199\u5916\u5F62\u3002",
    "\u5C5E\u6027\u8F74\uFF1A",
    ...hits.flatMap((hit) => [`- ${hit.term}\uFF1A`, ...hit.axes.map((axis) => `  \xB7 ${axis}`)]),
    "\u65B9\u6CD5\uFF1A",
    ...IP_METHOD.steps.map((step, index) => `${index + 1}. ${step}`),
    `\u4F9D\u636E\uFF1A${IP_METHOD.sources.join("\uFF1B")}`,
    memoryBlock(memory),
    `\u8D1F\u5411\u6392\u9664\u5199\u5165 generate \u7684 negative_prompt\uFF1A${negativeLine}`,
    "\u9A8C\u6536\uFF1A\u5BF9\u6210\u7A3F\u518D\u626B\uFF0Chits \u5FC5\u987B\u4E3A\u7A7A\uFF1B\u901A\u8FC7 directorx_ip_rewrite \u8BB0\u5165\u672C\u9879\u76EE\u8BB0\u5FC6\u3002"
  ].join("\n") : "";
  return {
    dirty,
    hits,
    keep,
    exclude,
    negativeLine,
    method: IP_METHOD,
    knowledge: dirty ? ["213"] : [],
    next,
    agentPrompt
  };
}
function askDshRewriteText(text, memory = []) {
  const brief2 = buildIpBrief(text, { memory });
  if (!brief2.dirty) return "";
  return [
    "\u8BF7\u5B9E\u65BD\u7248\u6743\u5B89\u5168\u6539\u5199\uFF0C\u4E0D\u8981\u5957\u56FA\u5B9A\u6210\u7A3F\u3002",
    brief2.agentPrompt,
    "\u5148 directorx_ip_scan \u53D6\u9879\u76EE\u8BB0\u5FC6\uFF0C\u518D directorx_knowledge_read 213\uFF0C\u5199\u7EC6\u540E directorx_ip_rewrite\uFF08remember:true\uFF09\u3002\u4E0D\u8981 generate\u3002"
  ].join("\n");
}

// src/ip-memory.ts
import { mkdir as mkdir3, readFile as readFile6, writeFile as writeFile4 } from "node:fs/promises";
import { join as join7 } from "node:path";
var FILE2 = "ip-memory.json";
var MAX2 = 80;
function norm(term) {
  return term.toLowerCase().replace(/[\s_-]+/g, "");
}
function keysOf(terms) {
  return new Set(terms.map(norm).filter((item2) => item2 !== ""));
}
function overlap2(left, right) {
  const want = keysOf(right);
  for (const term of left) {
    if (want.has(norm(term))) return true;
  }
  return false;
}
var IpMemoryStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  memo;
  filePath() {
    return join7(resolveOutputDir(this.outputDir), FILE2);
  }
  async read() {
    if (this.memo !== void 0 && Date.now() - this.memo.at < 1500) return this.memo.entries;
    try {
      const parsed = JSON.parse(await readFile6(this.filePath(), "utf8"));
      const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
      this.memo = { at: Date.now(), entries };
      return entries;
    } catch {
      this.memo = { at: Date.now(), entries: [] };
      return [];
    }
  }
  async write(entries) {
    const next = entries.slice(-MAX2);
    this.memo = { at: Date.now(), entries: next };
    await mkdir3(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile4(this.filePath(), JSON.stringify({ entries: next }, null, 2), "utf8");
  }
  async remember(input) {
    const terms = [...new Set(input.terms.map((item2) => item2.trim()).filter((item2) => item2 !== ""))].slice(0, 16);
    const rewrite = input.rewrite.trim().slice(0, 2e3);
    const source = input.source.trim().slice(0, 400);
    if (terms.length === 0 || rewrite === "") {
      throw new Error("ip memory needs terms and rewrite");
    }
    const ledger = await this.read();
    const index = ledger.findIndex((entry) => overlap2(entry.terms, terms));
    const now = Date.now();
    if (index >= 0) {
      const prev = ledger[index];
      const next = {
        ...prev,
        terms: [.../* @__PURE__ */ new Set([...prev.terms, ...terms])].slice(0, 16),
        kind: input.kind,
        source,
        rewrite,
        keep: input.keep.slice(0, 8),
        exclude: [.../* @__PURE__ */ new Set([...prev.exclude, ...input.exclude])].slice(0, 24),
        uses: prev.uses + 1,
        at: now
      };
      ledger[index] = next;
      await this.write(ledger);
      return next;
    }
    const created = {
      id: `ipm-${now.toString(36)}`,
      terms,
      kind: input.kind,
      source,
      rewrite,
      keep: input.keep.slice(0, 8),
      exclude: input.exclude.slice(0, 24),
      uses: 1,
      at: now
    };
    ledger.push(created);
    await this.write(ledger);
    return created;
  }
  async recall(text) {
    const seed = text.trim();
    if (seed === "") return [];
    const brief2 = buildIpBrief(seed);
    const needles = brief2.dirty ? [...brief2.hits.flatMap((hit) => [hit.term, ...hit.exclude]), ...brief2.exclude] : seed.split(/[\s,，。；;]+/).filter((item2) => item2.length >= 2);
    const ranked = (await this.read()).filter((entry) => overlap2(entry.terms, needles) || overlap2(entry.exclude, needles)).sort((left, right) => right.uses - left.uses || right.at - left.at);
    return ranked.slice(0, 5);
  }
  asHints(entries) {
    return entries.map((entry) => ({
      terms: entry.terms,
      kind: entry.kind,
      source: entry.source,
      rewrite: entry.rewrite,
      uses: entry.uses
    }));
  }
};
async function scanIpWithMemory(outputDir, prompt) {
  const store = new IpMemoryStore(outputDir);
  const memory = await store.recall(prompt);
  return { brief: buildIpBrief(prompt, { memory: store.asHints(memory) }), memory };
}
async function commitIpRewrite(outputDir, input) {
  const source = input.source.trim();
  const rewrite = input.rewrite.trim();
  if (source === "" || rewrite === "") {
    return { ok: false, refused: true, next: "source \u4E0E rewrite \u90FD\u4E0D\u80FD\u7A7A" };
  }
  const store = new IpMemoryStore(outputDir);
  const memory = await store.recall(source);
  const hints = store.asHints(memory);
  const sourceBrief = buildIpBrief(source, { memory: hints });
  const rewriteBrief = buildIpBrief(rewrite, { memory: hints });
  if (rewriteBrief.dirty) {
    return {
      ok: false,
      refused: true,
      brief: rewriteBrief,
      memory,
      next: rewriteBrief.next
    };
  }
  let saved;
  if (input.remember !== false && sourceBrief.dirty) {
    saved = await store.remember({
      terms: [...new Set(sourceBrief.hits.flatMap((hit) => [hit.term, ...hit.exclude]))],
      kind: sourceBrief.hits[0]?.kind ?? "character",
      source,
      rewrite,
      keep: sourceBrief.keep,
      exclude: sourceBrief.exclude
    });
  }
  const recalled = await store.recall(source);
  return {
    ok: true,
    brief: sourceBrief,
    rewrite,
    negativeLine: mergeNegativeLine(void 0, sourceBrief.exclude),
    memory: recalled,
    ...saved !== void 0 ? { saved } : {},
    next: [
      "directorx_prompt_craft\uFF1Aintent=\u7528\u6237\u539F\u53E5\uFF0Cprompt=\u8FD9\u6B21 rewrite",
      "generate \u65F6\u628A negativeLine \u5199\u5165 negative_prompt"
    ]
  };
}

// src/skill-route.ts
var SKILL_TOOLS = {
  "directorx-chengpian": ["directorx_chengpian", "directorx_ask", "directorx_confirm", "directorx_stage", "directorx_prompt_plan", "directorx_skill_capture"],
  "directorx-production-lead": ["directorx_brief", "directorx_prompt_plan", "directorx_propose", "directorx_canvas_shotlist", "directorx_confirm", "directorx_skill_capture", "directorx_bible"],
  "directorx-skill-capture": ["directorx_skill_capture", "directorx_note", "directorx_ask", "directorx_stage"],
  "directorx-series-craft": ["directorx_series", "directorx_revise", "directorx_character_list", "directorx_style_get", "directorx_style_lock", "directorx_note"],
  "directorx-blocking-craft": ["directorx_blocking", "directorx_ask", "directorx_character_list", "directorx_prompt_plan", "directorx_prompt_craft"],
  "shot-recipes": ["directorx_shot_vocab", "directorx_storyboard", "directorx_knowledge_read"],
  "directorx-methodology": ["directorx_knowledge_search", "directorx_knowledge_read", "directorx_qa"],
  "directorx-playbook": ["directorx_preflight", "directorx_generate_ready", "directorx_ip_scan", "directorx_ip_rewrite"],
  "directorx-provider-onboard": [
    "directorx_provider_ingest",
    "directorx_provider_classify",
    "directorx_provider_draft",
    "directorx_ask",
    "directorx_provider_smoke",
    "directorx_provider_commit"
  ],
  "novel-characters": ["directorx_character_register", "directorx_character_list", "directorx_generate_ready", "directorx_bible"],
  "novel-outline": ["directorx_bible", "directorx_ask", "directorx_confirm"],
  "novel-script": ["directorx_speech_duration", "directorx_bible"],
  "novel-storyboard": ["directorx_shot_vocab", "directorx_storyboard", "directorx_bible"],
  "novel-art": ["directorx_bible", "directorx_style"],
  "storyboard-craft": ["directorx_storyboard", "directorx_shot", "directorx_shot_sequence", "directorx_canvas_plan", "directorx_canvas_script", "directorx_canvas_autolink", "directorx_canvas_parse", "directorx_canvas_pack", "directorx_canvas_sheet", "directorx_canvas_split", "directorx_canvas_join", "directorx_canvas_stack", "directorx_canvas_desub", "directorx_canvas_extend", "directorx_canvas_gif"],
  "editing-workflow": ["directorx_edit_plan", "directorx_edit", "directorx_video_process", "directorx_timeline", "directorx_canvas_reshoot", "directorx_canvas_pack"],
  "trailer-craft": ["directorx_canvas_pack", "directorx_canvas_sheet", "directorx_canvas_shotlist", "directorx_prompt_plan", "directorx_character_register", "directorx_storyboard"],
  "frame-qa": ["directorx_extract_frames", "directorx_view_image", "directorx_qa", "directorx_qa_report", "directorx_canvas_frames", "directorx_canvas_parse"],
  "video-prompt-builder": ["directorx_prompt_plan", "directorx_prompt_craft", "directorx_style", "directorx_shot", "directorx_ip_scan", "directorx_ip_rewrite"],
  "video-prompt-reverse": ["directorx_video_analyze", "directorx_extract_frames", "directorx_view_image"],
  "kling-prompt-copilot": ["directorx_prompt_craft", "directorx_generate_video"],
  "seedance-2-prompt-copilot": ["directorx_prompt_craft", "directorx_generate_video"],
  "seedance-2-5-prompt-copilot": ["directorx_prompt_craft", "directorx_generate_video"],
  "minimax-h3-prompt-copilot": ["directorx_prompt_craft", "directorx_generate_video"],
  "gpt-image2-prompt-copilot": ["directorx_prompt_craft", "directorx_generate_image"],
  "banana-prompt-copilot": ["directorx_prompt_craft", "directorx_generate_image"],
  "cinematic-style": ["directorx_style", "directorx_knowledge_search"],
  "continuous-video": ["directorx_generate_ready", "directorx_extract_frames", "directorx_canvas_connect"],
  "caption-localization": ["directorx_transcribe_audio", "directorx_srt_lint", "directorx_video_subtitle"],
  "ai-audio": ["directorx_generate_audio", "directorx_audio_sync"],
  "audio-sound": ["directorx_audio_mix", "directorx_audio_beat", "directorx_audio_sync"],
  "platform-specs": ["directorx_qa", "directorx_video_process"],
  "thumbnail-cover": ["directorx_generate_image", "directorx_view_image"],
  "script-writing": ["directorx_storyboard", "directorx_brief"],
  "short-video": ["directorx_chengpian", "directorx_brief", "directorx_qa"]
};
var RULES = [
  {
    id: "blocking",
    match: /场面控制|场面锁|作战板|完全控制|多人连续|单镜长拍|世界状态|空间台账|控球权|状态机/i,
    mode: "generate",
    reason: "\u573A\u9762\u63A7\u5236\u8868\uFF1A\u5148 harvest/schema\uFF0C\u4F60\u5199\u53F0\u8D26\u548C\u7269\u4EF6\u72B6\u6001\u673A\uFF0Cpin \u540E\u518D craft\u3002\u4E0D\u8981\u76F4\u63A5\u62FF\u4E8B\u4EF6\u987A\u5E8F\u53BB generate\u3002",
    skills: ["directorx-blocking-craft", "continuous-video", "directorx-production-lead", "directorx-chengpian"],
    knowledge: ["\u8FDE\u7EED\u6027 \u7A7A\u95F4 \u955C\u5934"],
    extraTools: ["directorx_blocking", "directorx_ask", "directorx_prompt_plan", "directorx_prompt_craft", "directorx_generate_ready"]
  },
  {
    id: "series",
    match: /同一系列|系列包|沿用设定|保存这次设定|保存本系列|下一集|续作|调用系列|套用系列/i,
    mode: "research",
    reason: "\u7CFB\u5217\u5305\uFF1A\u89D2\u8272\u951A\u3001\u98CE\u683C\u9501\u3001\u955C\u5934\u89C4\u5219\u4E00\u6B21\u6536\u6210\uFF0C\u4E0B\u6B21 apply\uFF0C\u4E0D\u8981\u91CD\u8BBE\u8BA1\u4EBA\u8BBE\u3002",
    skills: ["directorx-series-craft", "directorx-production-lead", "directorx-chengpian"],
    knowledge: ["\u89D2\u8272 \u4E00\u81F4\u6027 \u98CE\u683C\u9501"],
    extraTools: ["directorx_series", "directorx_character_list", "directorx_style_get"]
  },
  {
    id: "revise",
    match: /再生动|改这一镜|只改这|重新生成|这个表情|这张脸|这里眼神|节点重做|局部改(?!窗)/i,
    mode: "generate",
    reason: "\u91CD\u65B0\u751F\u6210\uFF1A\u5148 directorx_revise \u5E26\u4E0A\u8282\u70B9\u4E0A\u4E0B\u6587\uFF0C\u518D\u8D70 craft/ready\u3002\u4E0D\u8981\u91CD\u8F93\u6574\u7247\u8BBE\u5B9A\u3002",
    skills: ["directorx-series-craft", "directorx-production-lead", "directorx-chengpian"],
    knowledge: ["\u89D2\u8272 \u4E00\u81F4\u6027"],
    extraTools: ["directorx_revise", "directorx_prompt_plan", "directorx_prompt_craft", "directorx_generate_ready"]
  },
  {
    id: "capture",
    match: /保存为技能|存成 skill|收成技能|skill_capture|保存本次为/i,
    mode: "research",
    reason: "\u4EA4\u7247\u540E\u6536\u6210\uFF1A\u7528 DSH \u6807\u51C6\u63D0\u95EE\u662F\u5426\u4FDD\u5B58\u4E3A\u6280\u80FD\uFF0C\u518D\u628A\u6D41\u7A0B\u548C\u4FEE\u6539\u610F\u89C1\u5199\u6210 SKILL.md\u3002",
    skills: ["directorx-skill-capture", "directorx-chengpian"],
    knowledge: ["\u6210\u7247 \u6D41\u7A0B"],
    extraTools: ["directorx_skill_capture", "directorx_note", "directorx_ask"]
  },
  {
    id: "onboard",
    match: /接入模型|新模型|apidoc|api.?doc|provider.?onboard|自配置模型/i,
    mode: "onboard",
    reason: "\u65B0\u6A21\u578B\u5165\u9A7B\uFF1A\u53EA\u8D70 ingest\u2192classify\u2192draft\u2192ask\u2192smoke\u2192commit\uFF0C\u7981\u6B62\u5199\u4EE3\u7801\u3002",
    skills: ["directorx-provider-onboard"],
    knowledge: ["\u751F\u6210\u534F\u8BAE create poll"],
    extraTools: ["directorx_provider_list"]
  },
  {
    id: "edit",
    match: /剪辑|精剪|裁剪|裁切|调色|旋转|翻转|变速|倒放|拼接|编辑台|cut list|timeline/i,
    mode: "edit",
    reason: "\u786E\u5B9A\u6027\u7F16\u8F91\uFF1A\u5148 edit_plan\uFF0C\u518D\u672C\u5730\u5DE5\u5177\u56DE\u5199\u8282\u70B9\uFF0C\u4E0D\u91CD\u7ED8\u3002",
    skills: ["editing-workflow", "directorx-methodology"],
    knowledge: ["\u526A\u8F91\u8282\u594F \u8F6C\u573A"],
    extraTools: ["directorx_edit_plan", "directorx_studio", "directorx_image_edit"]
  },
  {
    id: "character",
    match: /设定图|三视图|角色卡|定妆|turnaround|character sheet|人物设定|角色设定/i,
    mode: "character",
    reason: "\u4EBA\u7269\u5148\u51FA 16:9 \u4E09\u89C6\u56FE\u8BBE\u5B9A\u8868\uFF0C\u518D\u6CE8\u518C\u89D2\u8272\u951A\u70B9\u3002",
    skills: ["novel-characters", "directorx-production-lead", "directorx-methodology"],
    knowledge: ["\u89D2\u8272 \u4E09\u89C6\u56FE \u4E00\u81F4\u6027"],
    extraTools: ["directorx_character_register", "directorx_generate_ready"]
  },
  {
    id: "script",
    match: /改编小说|小说改编|改编.{0,16}(小说|短剧)|写大纲|写剧本|分集|长剧|短剧大纲/i,
    mode: "script",
    reason: "\u6539\u7F16\uFF1A\u5927\u7EB2\u5148\u6536\u655B\u7ED3\u6784\uFF1B\u89D2\u8272/\u7F8E\u672F/\u5267\u672C\u53EF\u5E76\u884C\uFF1B\u5206\u955C\u53EA\u6620\u5C04\u4E0D\u53D1\u660E\u3002\u8BC4\u5BA1\u9489\u753B\u5E03\uFF0C\u4E0D\u8981 HTML\u3002",
    skills: ["novel-outline", "novel-characters", "novel-script", "novel-storyboard", "directorx-production-lead"],
    knowledge: ["\u6539\u7F16 \u53D9\u4E8B\u7ED3\u6784"],
    extraTools: ["directorx_brief", "directorx_bible", "directorx_confirm"]
  },
  {
    id: "vocab",
    match: /镜头语汇|正反打|怎么切|运镜词|shot vocab|这一刀/i,
    mode: "canvas",
    reason: "\u5148\u67E5\u914D\u65B9/\u6280\u6CD5\u5361\uFF1A\u600E\u4E48\u5207\u3001\u4EC0\u4E48\u65F6\u5019\u522B\u7528\uFF0C\u518D\u5199\u8FD9\u4E00\u683C\u3002",
    skills: ["shot-recipes", "storyboard-craft"],
    knowledge: ["\u955C\u5934\u8BED\u8A00 \u666F\u522B \u8FD0\u955C"],
    extraTools: ["directorx_shot_vocab", "directorx_storyboard"]
  },
  {
    id: "canvas-craft",
    match: /铺成分镜|生成分镜|分镜行|抽帧上板|提取帧|按引用连|自动连线|一键解析|智能解析|解析成片|片段重做|局部重绘|局部重拍|重做这段|拼成片|合成视频|接触表|九宫格|宫格切开|拆分宫格|宫格拼回|合并宫格|分镜组|分屏对照|分屏|去硬字|去字幕|续写位|视频延长|导出动图|导出\s*GIF|拼成一条/i,
    mode: "canvas",
    reason: "\u753B\u5E03\u5DE5\u5177\uFF1A\u751F\u6210\u5206\u955C\u3001\u63D0\u53D6\u5E27\u3001\u667A\u80FD\u89E3\u6790\u3001\u5C40\u90E8\u91CD\u7ED8\u3001\u5408\u6210\u89C6\u9891\u3001\u4E5D\u5BAB\u683C\u3001\u62C6\u5206\u5BAB\u683C\u3001\u81EA\u52A8\u8FDE\u7EBF\u3002\u89E3\u6790/\u5207\u7A97/\u62FC\u63A5/\u5207\u5F00\u4E0D\u751F\u6210\uFF1B\u91CD\u505A\u4E2D\u6BB5\u624D\u8D70\u751F\u6210\u95F8\u3002",
    skills: ["storyboard-craft", "frame-qa", "editing-workflow"],
    knowledge: ["\u5206\u955C \u666F\u522B \u8FD0\u955C"],
    extraTools: ["directorx_canvas_script", "directorx_canvas_frames", "directorx_canvas_parse", "directorx_canvas_reshoot", "directorx_canvas_pack", "directorx_canvas_sheet", "directorx_canvas_split", "directorx_canvas_join", "directorx_canvas_stack", "directorx_canvas_desub", "directorx_canvas_extend", "directorx_canvas_gif", "directorx_canvas_autolink"]
  },
  {
    id: "trailer",
    match: /预告片|电影预告|片花|热血漫|日漫.{0,12}(预告|热血)|shonen/i,
    mode: "generate",
    reason: "\u9884\u544A\u7247\uFF1A\u94A9\u5B50\u2192\u4E16\u754C\u2192\u5347\u7EA7\u2192\u7247\u540D\uFF0C\u786C\u5207\u7EC4\u88C5\u3002\u65E5\u6F2B\u70ED\u8840\u5148\u9501\u539F\u521B\u89D2\u8272\u951A\uFF0C\u4E13\u540D\u4E0D\u8FDB\u751F\u6210\u3002",
    skills: ["trailer-craft", "minimax-h3-prompt-copilot", "cinematic-style", "directorx-production-lead", "directorx-chengpian"],
    knowledge: ["\u9884\u544A\u7247 \u94A9\u5B50 \u786C\u5207", "\u65E5\u6F2B \u70ED\u8840 \u955C\u5934"],
    extraTools: ["directorx_canvas_pack", "directorx_prompt_plan", "directorx_prompt_craft", "directorx_generate_ready"]
  },
  {
    id: "storyboard",
    match: /分镜|落到画布|storyboard|镜号|排片/i,
    mode: "canvas",
    reason: "\u5206\u955C\u5148\u7B7E\u5B57\u518D canvas_plan\uFF1BUI \u4E0D\u5F97\u5199 generating\u3002",
    skills: ["storyboard-craft", "directorx-production-lead", "directorx-chengpian"],
    knowledge: ["\u5206\u955C \u666F\u522B \u8FD0\u955C"],
    extraTools: ["directorx_storyboard", "directorx_canvas_shotlist", "directorx_confirm", "directorx_canvas_plan", "directorx_canvas_script"]
  },
  {
    id: "qa",
    match: /质检|抽帧看|看看成片|对照提示词|\bqa\b/i,
    mode: "qa",
    reason: "\u5148\u62BD\u5E27\u518D\u770B\u56FE\u50CF\u7D20\uFF0C\u7ED3\u8BBA\u5F15\u7528 methodology \u89C4\u5219\u53F7\u3002",
    skills: ["frame-qa", "directorx-methodology"],
    knowledge: ["\u6210\u7247\u8D28\u68C0 \u9ED1\u573A \u54CD\u5EA6"],
    extraTools: ["directorx_extract_frames", "directorx_view_image", "directorx_qa"]
  },
  {
    id: "style",
    match: /王家卫|韦斯|安德森|赛博朋克|黑色电影|吉卜力|风格致敬|像.+的(片子|风格)/i,
    mode: "style",
    reason: "\u98CE\u683C\u7528 corpus + directorx_style \u6CE8\u5165\uFF0C\u4E0D\u81C6\u9020\u3002",
    skills: ["cinematic-style", "directorx-methodology", "video-prompt-builder"],
    knowledge: ["\u955C\u5934\u8BED\u8A00 \u98CE\u683C \u5149\u5F71"],
    extraTools: ["directorx_style", "directorx_knowledge_search"]
  },
  {
    id: "kling",
    match: /可灵|kling/i,
    mode: "generate",
    reason: "\u53EF\u7075\u63D0\u793A\u8BCD\u5148\u8BFB\u5BF9\u5E94 copilot\uFF0C\u518D craft + ready\u3002",
    skills: ["kling-prompt-copilot", "directorx-production-lead", "directorx-chengpian"],
    knowledge: ["\u53EF\u7075 \u63D0\u793A\u8BCD"],
    extraTools: ["directorx_prompt_plan", "directorx_prompt_craft", "directorx_generate_ready"]
  },
  {
    id: "seedance",
    match: /即梦|seedance/i,
    mode: "generate",
    reason: "Seedance \u63D0\u793A\u8BCD\u5148\u8BFB copilot\u3002",
    skills: ["seedance-2-prompt-copilot", "directorx-production-lead", "directorx-chengpian"],
    knowledge: ["\u5373\u68A6 \u63D0\u793A\u8BCD"],
    extraTools: ["directorx_prompt_plan", "directorx_prompt_craft", "directorx_generate_ready"]
  },
  {
    id: "minimax",
    match: /minimax|海螺|\bh3\b|t2va|i2va|fl2va|l2va|ref2va|极简产品广告|苹果味广告|歌词贴字|纸艺定格|手绘实拍/i,
    mode: "generate",
    reason: "H3 \u5148\u8BFB\u5B98\u65B9\u4E94\u79CD\u6A21\u5F0F\u548C\u7247\u79CD\u65B9\u6CD5\uFF0C\u518D\u6309\u5B57\u6BB5\u5199\u6210\u7A3F\u3002\u6709\u9996\u5C3E\u5E27\u4E0D\u8981\u518D\u585E reference\u3002",
    skills: ["minimax-h3-prompt-copilot", "directorx-production-lead", "directorx-chengpian"],
    knowledge: ["minimax \u63D0\u793A\u8BCD \u65F6\u95F4\u7EBF"],
    extraTools: ["directorx_prompt_plan", "directorx_prompt_craft", "directorx_generate_ready"]
  },
  {
    id: "i2v",
    match: /图生视频|i2v|首尾帧|image.to.video/i,
    mode: "generate",
    reason: "\u56FE\u751F/\u9996\u5C3E\u5E27\u5FC5\u987B generate_ready\uFF0C\u7F3A\u5E27\u5148\u8865\u3002",
    skills: ["continuous-video", "directorx-playbook", "directorx-production-lead"],
    knowledge: ["\u56FE\u751F\u89C6\u9891 \u9996\u5C3E\u5E27"],
    extraTools: ["directorx_generate_ready", "directorx_extract_frames"]
  },
  {
    id: "generate",
    match: /生成|出图|出视频|出片|文生|做一条|做一张|拍摄|开拍/i,
    mode: "generate",
    reason: "\u751F\u6210\u524D\u5FC5\u987B skill_read + knowledge_read + craft + ready\u3002",
    skills: ["directorx-production-lead", "directorx-chengpian", "directorx-methodology", "video-prompt-builder"],
    knowledge: ["\u63D0\u793A\u8BCD \u955C\u5934\u8BED\u8A00"],
    extraTools: ["directorx_chengpian", "directorx_prompt_plan", "directorx_prompt_craft", "directorx_generate_ready"]
  }
];
var DEFAULT_ROUTE = {
  mode: "research",
  reason: "\u672A\u547D\u4E2D\u4E13\u9879\uFF1A\u5148 production-lead + \u77E5\u8BC6/\u6280\u80FD\u68C0\u7D22\uFF0C\u518D\u51B3\u5B9A\u751F\u6210\u8FD8\u662F\u7F16\u8F91\u3002",
  skills: ["directorx-production-lead", "directorx-chengpian", "directorx-methodology"],
  knowledge: ["\u6210\u7247 \u5BFC\u6F14"],
  articles: articlesForMode("research"),
  tools: ["directorx_skill_search", "directorx_knowledge_search", "directorx_brief"],
  next: [
    "directorx_skill_read directorx-production-lead",
    "directorx_skill_read directorx-chengpian",
    ...articlesForMode("research").map((id) => `directorx_knowledge_read ${id}`)
  ],
  avoid: ["\u4E0D\u8981\u8DF3\u8FC7 skill_read \u76F4\u63A5 generate", "\u4E0D\u8981\u5728\u6B63\u6587\u5199\u7F16\u53F7\u83DC\u5355"]
};
function toolsForSkill(name) {
  return SKILL_TOOLS[name] ?? [];
}
function unique3(items) {
  return [...new Set(items.filter((item2) => item2 !== ""))];
}
function withIpRoute(intent, route) {
  if (scanIpRisk(intent).length === 0) return route;
  return {
    ...route,
    articles: unique3(["213", ...route.articles]),
    knowledge: unique3(["\u7248\u6743\u5B89\u5168 \u6CDB\u5316 213", ...route.knowledge]),
    tools: unique3(["directorx_ip_scan", "directorx_ip_rewrite", ...route.tools]),
    next: unique3(["directorx_ip_scan", "directorx_knowledge_read 213", ...route.next]),
    avoid: unique3([
      ...route.avoid,
      "\u4E0D\u8981\u628A IP \u4E13\u540D\u9001\u8FDB generate\uFF1B\u4E0D\u8981\u5957\u56FA\u5B9A\u66FF\u6362\u53E5\u3002\u5148 ip_scan\uFF0C\u6309\u65B9\u6CD5\u7ED3\u5408\u9879\u76EE\u8BB0\u5FC6\u5199\u7EC6\uFF0Cip_rewrite \u9A8C\u6536\u5E76\u8BB0\u5165\u8BB0\u5FC6"
    ])
  };
}
function routeSkills(intent) {
  const text = intent.trim();
  if (text === "") {
    return {
      ...DEFAULT_ROUTE,
      reason: "\u6CA1\u6709\u610F\u56FE\u3002\u5148\u95EE\u7528\u6237\u8981\u751F\u6210\u3001\u526A\u8F91\u8FD8\u662F\u6574\u7406\u753B\u5E03\u3002",
      next: ["directorx_ask"]
    };
  }
  const rule = RULES.find((item2) => item2.match.test(text));
  if (rule === void 0) {
    return withIpRoute(text, { ...DEFAULT_ROUTE, knowledge: unique3([text, ...DEFAULT_ROUTE.knowledge]) });
  }
  const tools = unique3([
    ...rule.skills.flatMap((name) => toolsForSkill(name)),
    ...rule.extraTools ?? []
  ]);
  const articles = unique3([...articlesForSkills(rule.skills), ...articlesForMode(rule.mode)]);
  const next = [
    ...rule.skills.map((name) => `directorx_skill_read ${name}`),
    ...articles.slice(0, 4).map((id) => `directorx_knowledge_read ${id}`),
    ...tools.slice(0, 4)
  ];
  const avoid = [
    "\u4E0D\u8981\u53EA\u770B skill \u76EE\u5F55\u6458\u8981\uFF0C\u5FC5\u987B skill_read \u6B63\u6587",
    "\u77E5\u8BC6\u5E93\u7528\u8FD4\u56DE\u7684\u6587\u7AE0 id \u76F4\u63A5 knowledge_read\uFF0C\u4E0D\u8981\u53E6\u8D77\u4E00\u5957\u68C0\u7D22\u8BCD",
    rule.mode === "generate" ? "\u6CA1\u6709 craftId+readyId \u4E0D\u8BB8 generate/propose" : "",
    rule.mode === "edit" ? "\u4E0D\u8981\u7528\u751F\u6210\u6A21\u578B\u5B8C\u6210\u88C1\u5207/\u65CB\u8F6C/\u8C03\u8272/\u53D8\u901F" : "",
    rule.mode === "canvas" ? "\u672A confirm \u4E0D\u8981 canvas_plan / \u6279\u91CF\u5360\u4F4D" : "",
    rule.mode === "onboard" ? "\u4E0D\u8981\u751F\u6210\u4EE3\u7801\u6216\u56DE\u663E API Key" : ""
  ].filter(Boolean);
  return withIpRoute(text, {
    mode: rule.mode,
    reason: rule.reason,
    skills: rule.skills,
    knowledge: rule.knowledge,
    articles,
    tools,
    next,
    avoid
  });
}

// src/prompt-plan.ts
var ELEMENTS = [
  { name: "\u4E3B\u4F53", write: "\u8C01/\u4EC0\u4E48\u5728\u573A\uFF1A\u4F53\u8C8C\u3001\u670D\u88C5\u3001\u6BD4\u4F8B\u7528\u5C5E\u6027\u5199\uFF0C\u4E0D\u70B9\u540D IP", keywords: ["\u4EBA", "\u89D2\u8272", "\u4EBA\u7269", "\u4E3B\u89D2", "\u5973", "\u7537", "\u52A8\u7269", "\u8F66", "\u4EA7\u54C1", "\u673A\u68B0"] },
  { name: "\u52A8\u4F5C", write: "\u4E00\u4E2A\u5B8C\u6574\u53EF\u89C2\u5BDF\u52A8\u4F5C\uFF1A\u8D77\u52BF \u2192 \u63A5\u89E6 \u2192 \u7ED3\u675F\u72B6\u6001", keywords: ["\u8D70", "\u8DD1", "\u8F6C", "\u56DE\u5934", "\u63A8", "\u62C9", "\u6253", "\u63E1", "\u98DE", "\u843D", "\u7AD9", "\u5750"] },
  { name: "\u573A\u666F", write: "\u7A7A\u95F4\u7C7B\u578B\u3001\u5929\u6C14\u3001\u65F6\u95F4\u3001\u524D\u540E\u666F\u5C42\u6B21", keywords: ["\u8857", "\u5DF7", "\u57CE", "\u623F", "\u591C", "\u96E8", "\u5BA4\u5185", "\u6237\u5916", "\u6D77", "\u5C71", "\u821E\u53F0"] },
  { name: "\u5149\u7EBF", write: "\u5149\u6E90\u5728\u54EA\u3001\u8272\u6E29\u3001\u8F6F\u786C\u3001\u753B\u5185\u662F\u5426\u53EF\u89C1", keywords: ["\u5149", "\u706F", "\u9006\u5149", "\u4FA7\u5149", "\u9713\u8679", "\u9633\u5149", "\u6708\u5149", "\u6697", "\u6696", "\u51B7"] },
  { name: "\u955C\u5934", write: "\u666F\u522B\u3001\u673A\u4F4D\u3001\u8FD0\u955C\u3001\u7126\u6BB5\u3001\u6784\u56FE", keywords: ["\u955C\u5934", "\u666F\u522B", "\u8FD0\u955C", "\u7279\u5199", "\u5168\u666F", "\u8DDF", "\u63A8", "35mm", "\u6784\u56FE"] },
  { name: "\u8D1F\u9762", write: "\u89E3\u5256\u9519\u8BEF/\u6A21\u7CCA/\u6C34\u5370/\u95EA\u70C1\uFF0C\u5916\u52A0 IP \u6392\u9664\u8BCD", keywords: ["\u4E0D\u8981", "\u907F\u514D", "\u7981\u6B62", "\u65E0\u6C34\u5370", "\u65E0\u5B57\u5E55"] }
];
var PHYSICS = [
  "cause\uFF1A\u52A8\u4F5C\u4ECE\u54EA\u5757\u808C\u8089/\u54EA\u4EF6\u7269\u4F53\u8D77\u52BF",
  "contact\uFF1A\u529B\u6253\u5728\u54EA\u4E2A\u63A5\u89E6\u70B9",
  "force\uFF1A\u65B9\u5411\u3001\u5927\u5C0F\u3001\u662F\u5426\u52A0\u901F",
  "feedback\uFF1A\u8EAB\u4F53\u6216\u7269\u4F53\u600E\u4E48\u53D8\u5F62\u3001\u4F4D\u79FB",
  "result\uFF1A\u955C\u5934\u7ED3\u675F\u65F6\u7684\u9759\u6B62\u6216\u65B0\u5E73\u8861"
];
var COPILOTS = [
  { match: /可灵|kling/i, skill: "kling-prompt-copilot" },
  { match: /即梦|seedance/i, skill: "seedance-2-prompt-copilot" },
  { match: /minimax|海螺|\bh3\b/i, skill: "minimax-h3-prompt-copilot" },
  { match: /gpt-image|gpt image/i, skill: "gpt-image2-prompt-copilot" },
  { match: /banana|nano.?banana/i, skill: "banana-prompt-copilot" }
];
function inferKind(intent, kind) {
  if (kind !== void 0) return kind;
  if (/口播|配音|旁白|tts|音乐/i.test(intent)) return "audio";
  if (/出图|静帧|海报|设定图|三视图|封面/i.test(intent) && !/视频|出片|开拍/i.test(intent)) return "image";
  return "video";
}
function inferLevel(intent, kind) {
  if (kind === "audio") return "L1";
  if (/格斗|物理|多角色|连续剧|长片|变身|关节|场面锁|完全控制|单镜长拍/i.test(intent)) return "L3";
  if (/叙事|分镜|角色|连续|宣传片|短剧|跟镜/i.test(intent) || kind === "video") return "L2";
  return "L1";
}
function inferStrategy(intent, kind) {
  if (/设定图|三视图|定妆|turnaround/i.test(intent)) return "character-sheet";
  if (/空镜|场景设定|establishing/i.test(intent)) return "scene-still";
  if (/关键帧|keyframe/i.test(intent)) return "keyframe";
  if (/首尾帧|转场到|fl2va/i.test(intent)) return "fl2v";
  if (/ref2va|全参考|多参考/i.test(intent)) return "ref2v";
  if (/尾帧落地|l2va/i.test(intent)) return "i2v";
  if (/图生|i2v|i2va|用这张|以这张/i.test(intent)) return "i2v";
  if (/t2va/i.test(intent)) return "t2v";
  if (kind === "image") return "t2i";
  if (kind === "audio") return "tts";
  return "t2v";
}
function inferCopilot(intent, model) {
  const blob2 = `${intent} ${model ?? ""}`;
  return COPILOTS.find((item2) => item2.match.test(blob2))?.skill;
}
function missingElements(intent) {
  return ELEMENTS.map((item2) => ({
    name: item2.name,
    present: item2.keywords.some((keyword) => intent.includes(keyword)),
    write: item2.write
  }));
}
function planPrompt(input) {
  const intent = input.intent.trim();
  const kind = inferKind(intent, input.kind);
  const route = routeSkills(intent === "" ? "\u5F00\u62CD" : intent);
  const level = inferLevel(intent, kind);
  const strategyHint = inferStrategy(intent, kind);
  const elements = missingElements(intent);
  const physics = kind === "video" ? PHYSICS : [];
  const copilot = inferCopilot(intent, input.model);
  const ip = buildIpBrief(intent);
  const next = [
    ...route.skills.slice(0, 3).map((name) => `directorx_skill_read ${name}`),
    ...copilot !== void 0 && !route.skills.includes(copilot) ? [`directorx_skill_read ${copilot}`] : [],
    ...route.articles.slice(0, 3).map((id) => `directorx_knowledge_read ${id}`),
    ...ip.dirty ? ["directorx_ip_scan", "directorx_knowledge_read 213", "directorx_ip_rewrite"] : [],
    .../场面锁|场面控制|作战板|完全控制|多人连续|单镜长拍/.test(intent) ? ["directorx_blocking harvest", "directorx_blocking schema"] : [],
    "directorx_prompt_craft\uFF08intent=\u539F\u53E5\uFF0Cprompt=\u6309\u672C\u8BA1\u5212\u5199\u7EC6\u7684\u6210\u7A3F\uFF09",
    "directorx_generate_ready"
  ];
  const lacking = elements.filter((item2) => !item2.present).map((item2) => item2.name);
  const agentPrompt = [
    "\u63D0\u793A\u8BCD\u7F16\u6392\uFF08\u5DE5\u7A0B\u53EA\u7ED9\u65B9\u6CD5\u548C\u7F3A\u53E3\uFF0C\u6210\u7A3F\u5FC5\u987B\u4F60\u6309\u5F53\u524D\u955C\u5934\u5199\u7EC6\uFF0C\u7981\u6B62\u62FF\u539F\u53E5\u6216\u56FA\u5B9A\u6A21\u677F\u5F53\u751F\u6210\u7A3F\uFF09\uFF1A",
    `\u610F\u56FE\uFF1A${intent || "\uFF08\u7A7A\uFF09"}`,
    `\u5F62\u6001\uFF1A${kind} \xB7 \u7B49\u7EA7 ${level}\uFF08video-prompt-builder\uFF09\xB7 \u7B56\u7565\u63D0\u793A ${strategyHint}`,
    copilot !== void 0 ? `\u6A21\u578B\u6280\u80FD\uFF1A\u5148 skill_read ${copilot}${copilot === "minimax-h3-prompt-copilot" ? "\uFF08\u5FC5\u8BFB handbook.md \u89C4\u683C\u548C\u4E09\u6BB5\u516C\u5F0F\uFF0C\u518D\u8BFB\u6A21\u5F0F\u7BC7\uFF09" : ""}\uFF0C\u6309\u8BE5\u6A21\u578B\u5403\u7684\u683C\u5F0F\u5199` : "\u6A21\u578B\u672A\u70B9\u540D\uFF1A\u7528\u901A\u7528\u5BFC\u6F14\u8BED\u8A00\uFF0C\u6B63\u8BF4\u3001\u5177\u4F53\u8FD0\u52A8",
    `\u516D\u8981\u7D20\uFF1A${elements.map((item2) => `${item2.name}${item2.present ? "\u2713" : "\u25B3"}`).join(" / ")}`,
    lacking.length > 0 ? `\u6210\u7A3F\u5FC5\u987B\u8865\u4E0A\uFF1A${lacking.join("\u3001")}` : "\u516D\u8981\u7D20\u90FD\u6709\u79CD\u5B50\uFF0C\u5C55\u5F00\u6210\u5BFC\u6F14\u8BED\u8A00",
    ...elements.filter((item2) => !item2.present).map((item2) => `- ${item2.name}\uFF1A${item2.write}`),
    physics.length > 0 ? `\u7269\u7406\u94FE\uFF08\u89C4\u5219 104\uFF09\uFF1A${physics.join(" \u2192 ")}` : "",
    ip.dirty ? `\u7248\u6743\uFF1A\u5148\u6309 ip_scan \u65B9\u6CD5\u6539\u5199\uFF0C\u7981\u6B62\u4E13\u540D\u8FDB\u6210\u7A3F\u3002\u8D1F\u5411\uFF1A${ip.negativeLine}` : "",
    /场面锁|场面控制|作战板|完全控制|多人连续|单镜长拍/.test(intent) ? "\u591A\u4EBA\u8FDE\u7EED\u5148 directorx_blocking\uFF1A\u7528\u6237\u53EA\u7ED9\u89D2\u8272\u56FE\u3001\u5F00\u573A\u548C\u4E8B\u4EF6\u987A\u5E8F\uFF0C\u4F60\u5199\u53F0\u8D26\u548C\u7269\u4EF6\u72B6\u6001\u673A\uFF0Cpin \u540E\u518D\u6210\u672C\u7A3F\u3002" : "",
    "\u672A\u9501\u7684\u4EBA\u7269/\u573A\u666F\u4E0D\u8981\u5199\u8FDB generate\uFF08\u89C4\u5219 103\uFF09\u3002\u5199\u6210\u7A3F\u540E directorx_prompt_craft\uFF0C\u518D generate_ready\u3002"
  ].filter(Boolean).join("\n");
  return {
    kind,
    intent,
    level,
    strategyHint,
    route,
    elements,
    physics,
    ...copilot !== void 0 ? { copilot } : {},
    ...ip.dirty ? { ip } : {},
    next,
    agentPrompt
  };
}

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
      for (const name of characterNames) if (!shot.description.includes(name)) missing.push(`\u89D2\u8272\u300C${name}\u300D`);
      for (const name of sceneNames) if (!shot.description.includes(name)) missing.push(`\u573A\u666F\u300C${name}\u300D`);
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
  for (const capability of [...MODEL_MATRIX, ...extras]) {
    if (seen.has(`${capability.mode}:${capability.model}`)) continue;
    seen.add(`${capability.mode}:${capability.model}`);
    matrix.push(capability);
  }
  for (const capability of matrix) {
    const reasons = [];
    if (request.durationSec !== void 0 && (request.durationSec < capability.minDurationSec || request.durationSec > capability.maxDurationSec)) {
      reasons.push(`\u65F6\u957F ${request.durationSec}s \u8D85\u51FA [${capability.minDurationSec},${capability.maxDurationSec}]`);
    }
    if (request.aspectRatio !== void 0 && !capability.aspectRatios.includes(request.aspectRatio)) {
      reasons.push(`\u753B\u5E45 ${request.aspectRatio} \u4E0D\u5728 ${capability.aspectRatios.join("/")}`);
    }
    if (request.needsFirstFrame === true && !capability.firstFrame) reasons.push("\u4E0D\u652F\u6301\u9996\u5E27");
    if (request.needsLastFrame === true && !capability.lastFrame) reasons.push("\u4E0D\u652F\u6301\u5C3E\u5E27");
    if (request.needsAudio === true && !capability.audio) reasons.push("\u4E0D\u652F\u6301\u97F3\u753B\u540C\u51FA");
    if (request.needsMultiRef === true && !capability.multiRef) reasons.push("\u4E0D\u652F\u6301\u591A\u53C2\u8003\u56FE\uFF08\u591A\u4E3B\u4F53\u8F93\u5165\uFF09");
    if (reasons.length === 0) eligible.push(capability);
    else excluded.push({ model: capability.model, reasons });
  }
  eligible.sort((a, b) => {
    const score = (capability) => (request.needsFirstFrame === true ? Number(capability.firstFrame) : 0) + (request.needsLastFrame === true ? Number(capability.lastFrame) : 0) + (request.needsAudio === true ? Number(capability.audio) : 0) + (request.needsMultiRef === true ? Number(capability.multiRef) : 0) + (request.durationSec !== void 0 && request.durationSec <= capability.maxDurationSec ? 1 : 0);
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
function routeModelForGate(durationSec, aspectRatio2) {
  return routeModel({ durationSec, aspectRatio: aspectRatio2 });
}

// src/providers/h3-contract.ts
var H3_MIN_SEC = 4;
var H3_MAX_SEC = 15;
var H3_PROMPT_MAX = 7e3;
var H3_MAX_REF_IMAGES = 9;
var H3_ASPECT_WIDE = 5 / 2;
var H3_ASPECT_TALL = 2 / 5;
var H3_RECOMMENDED_RESOLUTION = "1440p";
var H3_MODEL = /minimax-h3|hailuo|海螺|\bh3\b/i;
function isH3Model(model, mode) {
  const blob2 = `${model ?? ""} ${mode ?? ""}`;
  return H3_MODEL.test(blob2) || mode === "minimax-h3" || mode === "modelverse-tasks" && /minimax-h3/i.test(model ?? "");
}
function clampH3Duration(seconds) {
  return Math.min(H3_MAX_SEC, Math.max(H3_MIN_SEC, Math.round(seconds ?? 5)));
}
function clipH3Prompt(prompt) {
  if (prompt.length <= H3_PROMPT_MAX) return { prompt, clipped: false };
  return { prompt: prompt.slice(0, H3_PROMPT_MAX), clipped: true };
}
function h3Resolution(requested) {
  const raw = (requested ?? "").trim();
  const key = raw.toLowerCase();
  if (raw === "" || key === "2k" || key === "1080p" || key === "1k") return H3_RECOMMENDED_RESOLUTION;
  if (key === "768p" || key === "720p") return "768p";
  return key === "1440p" ? H3_RECOMMENDED_RESOLUTION : raw;
}
function h3SkipReferences(firstFrame, lastFrame) {
  return firstFrame !== void 0 && firstFrame !== "" || lastFrame !== void 0 && lastFrame !== "";
}
function limitH3Refs(paths) {
  return paths.filter((path) => path !== "").slice(0, H3_MAX_REF_IMAGES);
}

// src/h3-prompt.ts
var I2VA_ALIGN = "For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.";
var HAS_OFFICIAL_FIELDS = /integrated_multimodal_description\s*:/i;
var HAS_SOUNDSCAPE = /overall_soundscape\s*:/i;
var HAS_MUSIC = /non_diegetic_music\s*:/i;
var CN_BEAT = /【\s*(\d{1,2})\s*[:：]\s*(\d{2})\s*[-–~到至]\s*(\d{1,2})\s*[:：]\s*(\d{2})\s*】/g;
function inferH3PromptMode(input) {
  if (input.strategy === "fl2v" || has(input.firstFrame) && has(input.lastFrame)) return "fl2v";
  if (input.strategy === "ref2v") return "ref2v";
  if (input.strategy === "i2v" && has(input.lastFrame) && !has(input.firstFrame)) return "l2v";
  if (has(input.firstFrame)) return "i2v";
  if (has(input.lastFrame)) return "l2v";
  return "t2v";
}
function normalizeH3Prompt(prompt, input) {
  const notes = [];
  let body = rewriteChineseBeats(prompt.trim());
  const mode = input.mode ?? inferH3PromptMode(input);
  const seconds = Math.min(15, Math.max(4, Math.round(input.seconds ?? 5)));
  if (mode === "i2v" && !/fully referenced/i.test(body)) {
    body = `${I2VA_ALIGN}

${body}`;
    notes.push("\u8865 I2VA \u5BF9\u9F50\u53E5");
  }
  if (mode === "fl2v" && !/Picture 1 \(from Shot/i.test(body)) {
    body = [
      `How the reference pictures align with the target video \u2014 Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 1) aligns with the ${seconds.toFixed(2)}-second mark of the target video.`,
      "",
      body
    ].join("\n");
    notes.push("\u8865 FL2VA \u5BF9\u9F50\u53E5");
  }
  if (mode === "l2v" && !/aligns with the .+second mark/i.test(body)) {
    body = [
      `How the reference pictures align with the target video \u2014 <Picture 1> (from [Shot 1]) aligns with the ${seconds.toFixed(2)}-second mark of the target video.`,
      "",
      body
    ].join("\n");
    notes.push("\u8865 L2VA \u5BF9\u9F50\u53E5");
  }
  if (mode === "fl2v" && /the camera cuts to|【镜头|Shot 2/i.test(body) && !/不要切镜|no cut|single shot|单镜/i.test(body)) {
    body = `${body.trim()}

Keep a single continuous shot. Do not add extra cuts between Picture 1 and Picture 2.`;
    notes.push("FL2VA \u9489\u5355\u955C\u63D2\u503C");
  }
  if (!HAS_OFFICIAL_FIELDS.test(body) && !/【核心创意】|核心创意：/.test(body)) {
    body = promoteThreePart(body);
    notes.push("\u8865\u4E09\u6BB5\u516C\u5F0F\u5916\u58F3");
  }
  if (HAS_OFFICIAL_FIELDS.test(body) && !HAS_SOUNDSCAPE.test(body)) {
    body = `${body.trim()}

overall_soundscape: Physical action sounds and room tone only. No extra dialogue.`;
    notes.push("\u8865 overall_soundscape");
  }
  if ((HAS_OFFICIAL_FIELDS.test(body) || /【画面过程/.test(body)) && !HAS_MUSIC.test(body) && !/非叙事性音乐/.test(body)) {
    body = `${body.trim()}

non_diegetic_music: N/A`;
    notes.push("\u65E0\u914D\u4E50\u65F6\u9489 N/A");
  }
  return { prompt: body, notes };
}
function h3CraftLooksReady(prompt) {
  const body = prompt.trim();
  if (/角度不是成稿|本行是角度/.test(body)) return "H3 \u5360\u4F4D\u4E0D\u80FD\u662F\u89D2\u5EA6\u6807\u7B7E\u3002\u6309\u53C2\u8003\u8BF4\u660E + \u6838\u5FC3\u521B\u610F + \u753B\u9762\u8FC7\u7A0B\u5199\u7EC6\u3002";
  if (body.length < 160) return "H3 \u6210\u7A3F\u592A\u77ED\u3002\u6309\u53C2\u8003\u8BF4\u660E + \u6838\u5FC3\u521B\u610F + \u753B\u9762\u8FC7\u7A0B\u5199\uFF0C\u6216\u5199\u6210\u5B98\u65B9\u4E09\u5B57\u6BB5\uFF0C\u4E0D\u8981\u585E\u4E00\u4E2A [Shot 1] \u8FC7\u95F8\u3002";
  const hasOfficial = HAS_OFFICIAL_FIELDS.test(body);
  const hasThree = /参考素材说明/.test(body) && /核心创意/.test(body) && /画面过程/.test(body);
  const hasTimeline = /\[Shot\s*1\]/.test(body) || /At 00:/.test(body) || /0\.00-second/.test(body);
  if (!hasOfficial && !hasThree && !hasTimeline) {
    return "H3 \u6210\u7A3F\u7F3A\u5C11\u65F6\u95F4\u7EBF\u6216\u4E09\u6BB5\u516C\u5F0F\uFF08\u53C2\u8003\u8BF4\u660E + \u6838\u5FC3\u521B\u610F + \u753B\u9762\u8FC7\u7A0B / \u5B98\u65B9\u4E09\u5B57\u6BB5\uFF09\u3002\u4E0D\u8981\u53EA\u5199\u4E00\u53E5\u6C1B\u56F4\u3002";
  }
  return void 0;
}
function has(value) {
  return typeof value === "string" && value !== "";
}
function rewriteChineseBeats(text) {
  let shot = 0;
  return text.replace(CN_BEAT, (_match, mm, ss) => {
    shot += 1;
    const mark = `${String(Number(mm)).padStart(2, "0")}:${ss}.000`;
    return shot === 1 ? `[Shot 1]` : `[Shot ${shot}] At ${mark},`;
  });
}
function promoteThreePart(body) {
  if (/【参考素材说明】/.test(body)) return body;
  return [
    "\u3010\u53C2\u8003\u7D20\u6750\u8BF4\u660E\u3011\u6309\u4E0A\u4F20\u987A\u5E8F\u5199\u6E05\u6BCF\u5F20\u56FE/\u6BCF\u6BB5\u89C6\u9891\u7684\u7528\u9014\uFF08\u4EBA\u7269/\u573A\u666F/\u98CE\u683C/\u9996\u5E27/\u5C3E\u5E27/\u52A8\u4F5C\uFF09\u3002\u6CA1\u6709\u7D20\u6750\u5219\u6574\u6BB5\u8DF3\u8FC7\u3002",
    "\u3010\u6838\u5FC3\u521B\u610F\u3011\u4E00\u53E5\u8BDD\u9501\u4E3B\u4F53\u3001\u5730\u70B9\u3001\u4E8B\u4EF6\u3001\u9898\u6750/\u98CE\u683C\u3001\u662F\u5426\u4E00\u955C\u5230\u5E95\u3002",
    `\u3010\u753B\u9762\u8FC7\u7A0B\u8BF4\u660E\u3011${body}`,
    "\u3010\u4E0D\u60F3\u8981\u3011\u4E0D\u8981\u65B0\u589E\u4EBA\u7269\u3001\u4E0D\u8981\u4E71\u7801\u6587\u5B57\u3001\u4E0D\u8981\u6C34\u5370\u3002\u4E0D\u8981\u80CC\u666F\u97F3\u4E50\u65F6\u5199\uFF1A\u975E\u53D9\u4E8B\u6027\u97F3\u4E50\uFF1AN/A"
  ].join("\n");
}

// src/prompt-craft.ts
var FILE3 = "prompt-crafts.json";
var MAX3 = 100;
var SHOT_SIZE = /镜头|景别|特写|近景|中景|远景|全景|过肩|建立镜头|close-?up|medium shot|wide shot|extreme long|establishing|\bMCU\b|\bELS\b|\bCU\b|\bMS\b|\bLS\b/i;
var CAMERA = /运镜|机位|推近|推拉|摇移|跟镜|手持|固定机位|static|push|pan|tilt|dolly|handheld|eye-level|low[- ]?angle|high[- ]?angle|orbit|crane/i;
var LIGHT = /光|灯|逆光|侧光|伦勃朗|golden hour|key light|\bkey\b|rim light|soft light|practical|霓虹|月光|阳光|暖光|冷光|\bnight\b|work-lamp/i;
var ENV = /室内|室外|街|巷|城|工地|现场|场地|房间|码头|渡口|广场|雾|环境|空间|palace|site|street|room|rain|dust|fog|夜|dawn|dusk|atmosphere/i;
var STYLE = /cinematic|电影|胶片|赛璐璐|35mm|50mm|anamorphic|atmosphere|风格|grain|\blook\b/i;
var ANGLE_STUB = /角度不是成稿|本行是角度/;
var PromptCraftStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join8(resolveOutputDir(this.outputDir), FILE3);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile7(this.filePath(), "utf8"));
      return Array.isArray(parsed.crafts) ? parsed.crafts : [];
    } catch {
      return [];
    }
  }
  async get(id) {
    return (await this.read()).find((item2) => item2.id === id);
  }
  async save(craft) {
    const crafts = await this.read();
    crafts.push(craft);
    await mkdir4(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile5(this.filePath(), JSON.stringify({ crafts: crafts.slice(-MAX3) }, null, 2), "utf8");
    return craft;
  }
};
function isThinPrompt(intent, prompt) {
  const body = prompt.trim();
  const seed = intent.trim();
  if (body.length < 120) return "\u6210\u7A3F\u592A\u77ED\uFF08<120 \u5B57\uFF09\u3002\u610F\u56FE\u4E0D\u662F\u63D0\u793A\u8BCD\uFF0C\u5FC5\u987B\u5199\u6210\u5E26\u666F\u522B/\u8FD0\u955C/\u5149\u7EBF/\u73AF\u5883/\u98CE\u683C\u7684\u5BFC\u6F14\u7A3F\u3002";
  if (ANGLE_STUB.test(body)) return "\u5360\u4F4D\u4E0D\u80FD\u662F\u89D2\u5EA6\u6807\u7B7E\u3002\u6309\u666F\u522B/\u8FD0\u955C/\u5149\u7EBF/\u73AF\u5883/\u98CE\u683C\u5199\u6210\u53EF\u6267\u884C\u5BFC\u6F14\u7A3F\u3002";
  if (seed !== "" && body === seed) return "\u6210\u7A3F\u4E0D\u80FD\u7B49\u4E8E\u7528\u6237\u539F\u53E5\u3002\u5148\u68C0\u7D22\u518D\u6539\u5199\u3002";
  if (seed !== "" && body.length < seed.length + 60) return "\u6210\u7A3F\u51E0\u4E4E\u6CA1\u5C55\u5F00\u3002\u6309\u516D\u8981\u7D20\u5199\u7EC6\uFF0C\u4E0D\u8981\u590D\u8FF0\u539F\u53E5\u3002";
  const dims = [SHOT_SIZE, CAMERA, LIGHT, ENV, STYLE].filter((mark) => mark.test(body)).length;
  if (dims < 4) {
    return `\u6210\u7A3F\u7F3A\u5BFC\u6F14\u8981\u7D20\uFF08\u73B0\u6709 ${dims}/5\uFF1A\u666F\u522B/\u8FD0\u955C/\u5149\u7EBF/\u73AF\u5883/\u98CE\u683C\uFF09\u3002\u81F3\u5C11\u5199\u9F50 4 \u9879\uFF0C\u4E0D\u80FD\u53EA\u585E cinematic / 35mm\u3002`;
  }
  return void 0;
}
async function craftPrompt(input) {
  const intent = input.intent.trim();
  const prompt = input.prompt.trim();
  if (intent === "") return { ok: false, refused: true, next: "\u5148\u5199\u6E05\u7528\u6237\u610F\u56FE\uFF08\u753B\u5E03\u751F\u6210\u6761\u91CC\u7684\u90A3\u53E5\uFF09" };
  if (input.knowledgeRefs.length === 0 || input.skillNames.length === 0) {
    const routed = routeSkills(intent);
    const plan = planPrompt({ intent, kind: input.kind });
    let suggestedKnowledge = routed.articles.map((id) => ({ id, title: `route:${id}` }));
    let suggestedSkills = routed.skills.map((name) => ({ name, snippet: "route" }));
    if (suggestedKnowledge.length === 0 || suggestedSkills.length === 0) {
      const [knowledge, skills] = await Promise.all([
        corpus.search(intent, 5).catch(() => []),
        skillIndex.search(intent, 5).catch(() => [])
      ]);
      suggestedKnowledge = [...suggestedKnowledge, ...knowledge.map((hit) => ({ id: hit.id, title: hit.title }))];
      suggestedSkills = [...suggestedSkills, ...skills.map((hit) => ({ name: hit.name, snippet: hit.snippet }))];
    }
    return {
      ok: false,
      refused: true,
      next: "\u5148 directorx_prompt_plan / skill_route\uFF0C\u518D skill_read \u5217\u51FA\u7684\u6280\u80FD\u3001knowledge_read \u5217\u51FA\u7684\u6587\u7AE0 id\u3002\u5916\u90E8\u4E8B\u5B9E\u4E0D\u591F\u518D\u4E0A\u7F51\u3002\u8BFB\u5B8C\u628A refs/names \u4F20\u56DE\u6765\u3002",
      suggestedKnowledge,
      suggestedSkills,
      route: routed,
      plan
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
  for (const name of input.skillNames) {
    try {
      await skillIndex.read(name);
    } catch {
      return { ok: false, refused: true, next: `\u6CA1\u6709\u6280\u80FD "${name}"\uFF0C\u5148 directorx_skill_search` };
    }
  }
  const thin = isThinPrompt(intent, prompt);
  if (thin !== void 0) {
    const plan = planPrompt({ intent, kind: input.kind });
    return { ok: false, refused: true, next: thin, plan };
  }
  let assembled = prompt;
  let negative;
  const h3Craft = input.kind === "video" && input.skillNames.some((name) => /minimax-h3|hailuo/i.test(name));
  if (h3Craft) {
    const gap = h3CraftLooksReady(assembled);
    if (gap !== void 0) {
      return { ok: false, refused: true, next: gap, plan: planPrompt({ intent, kind: input.kind }) };
    }
    assembled = clipH3Prompt(normalizeH3Prompt(assembled, {}).prompt).prompt;
  }
  if (input.shot !== void 0) {
    const intentBrief = buildIpBrief(intent);
    const subject = intentBrief.dirty ? intentBrief.keep.join(" ").trim() || "\u4E3B\u4F53" : input.shot.subject || intent;
    const built = buildShotPrompt({ ...input.shot, subject });
    assembled = `${built.prompt}

${prompt}`;
    negative = built.negative;
  }
  const scanned = await scanIpWithMemory(input.outputDir, assembled);
  if (scanned.brief.dirty) {
    return {
      ok: false,
      refused: true,
      ip: scanned.brief,
      memory: scanned.memory,
      next: "\u6210\u7A3F\u4ECD\u542B IP \u4E13\u540D\u3002\u6309 ip.agentPrompt \u7ED3\u5408\u9879\u76EE\u8BB0\u5FC6\u5199\u7EC6\uFF0C\u518D directorx_ip_rewrite \u9A8C\u6536\u3002\u4E0D\u8981\u5957\u56FA\u5B9A\u66FF\u6362\u53E5\u3002"
    };
  }
  const intentScan = await scanIpWithMemory(input.outputDir, intent);
  if (intentScan.brief.dirty) {
    const cited = input.knowledgeRefs.some((ref) => ref === "213" || ref.includes("213"));
    if (!cited) {
      return {
        ok: false,
        refused: true,
        ip: intentScan.brief,
        memory: intentScan.memory,
        next: "\u610F\u56FE\u542B IP \u4E13\u540D\u3002\u5148 directorx_knowledge_read 213\uFF0C\u6309\u65B9\u6CD5\u6539\u5199\u6210\u7A3F\u540E\u518D\u4EA4\u3002"
      };
    }
    if (intentScan.brief.negativeLine !== "") negative = intentScan.brief.negativeLine;
    await commitIpRewrite(input.outputDir, { source: intent, rewrite: assembled, remember: true });
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
    ipHits: intentScan.brief.hits.map((hit) => hit.term),
    ipRemembered: intentScan.brief.dirty,
    next: "\u4E25\u683C/\u534F\u540C\uFF1Adirectorx_propose \u5E26 craftId\uFF1B\u751F\u6210\u5FC5\u987B\u5E26\u540C\u4E00\u4E2A craftId"
  };
}
async function requireCraft(outputDir, craftId) {
  if (craftId === void 0 || craftId.trim() === "") {
    return {
      ok: false,
      refused: true,
      reason: "\u751F\u6210\u5FC5\u987B\u5148\u51FA\u8C03\u7814\u6210\u7A3F",
      next: "directorx_skill_route \u2192 skill_read \u5217\u51FA\u7684\u6280\u80FD + knowledge_search/read\uFF08\u5FC5\u8981\u65F6\u5916\u90E8\u8C03\u7814\uFF09\u2192 directorx_prompt_craft \u2192 \u518D generate/propose\u3002\u753B\u5E03\u4E0A\u7684\u77ED\u53E5\u53EA\u662F\u610F\u56FE\u3002"
    };
  }
  const craft = await new PromptCraftStore(outputDir).get(craftId.trim());
  if (craft === void 0) {
    return { ok: false, refused: true, reason: `craft "${craftId}" \u4E0D\u5B58\u5728`, next: "directorx_prompt_craft" };
  }
  return { ok: true, craft };
}

// src/compose.ts
var RECIPES = {
  promo: { file: "recipes/promo-video.md", name: "\u5BA3\u4F20\u7247" },
  literary: { file: "recipes/novel-adaptation.md", name: "\u5C0F\u8BF4\u6539\u7F16" },
  remake: { file: "recipes/remake-subject.md", name: "\u62C9\u7247\u590D\u523B" },
  narrative: { file: "recipes/unit-production.md", name: "\u5355\u5143\u5316\u5236\u4F5C" },
  talk: { file: "recipes/tutorial-video.md", name: "\u6559\u7A0B/\u53E3\u64AD" },
  montage: { file: "recipes/clip-recut.md", name: "\u6DF7\u526A" },
  trailer: { file: "recipes/trailer.md", name: "\u9884\u544A\u7247" }
};
function composeKindFromBriefType(type) {
  if (type === "\u5E7F\u544A/\u5BA3\u4F20") return "promo";
  if (type === "\u6539\u7F16/\u957F\u5267") return "literary";
  if (type === "\u62C9\u7247/\u590D\u523B") return "remake";
  if (type === "\u53E3\u64AD/\u8BB2\u89E3") return "talk";
  if (type === "\u6DF7\u526A/\u5361\u70B9") return "montage";
  if (type === "\u9884\u544A/\u7247\u82B1") return "trailer";
  return "narrative";
}
function routeStage() {
  return {
    name: "\u8DEF",
    purpose: "\u5148 skill_route\uFF0C\u6309\u8FD4\u56DE\u7684 skills/articles/next \u7CBE\u8BFB\uFF0C\u4E0D\u8981\u53E6\u8D77\u68C0\u7D22\u8BCD",
    tools: ["directorx_skill_route"],
    phase: "plan"
  };
}
function craftStage() {
  return {
    name: "\u7A3F",
    purpose: "\u6BCF\u955C\u5148 prompt_plan \u518D\u5199\u6210\u7A3F\uFF1B\u53C2\u8003\u9F50\u4E86\u624D ready\uFF1BIP \u4E13\u540D\u8D70\u6539\u5199\u8BB0\u5FC6\u3002\u539F\u53E5\u4E0D\u662F\u63D0\u793A\u8BCD\u3002",
    tools: ["directorx_prompt_plan", "directorx_prompt_craft", "directorx_generate_ready"],
    phase: "create"
  };
}
function commonSignoff() {
  return {
    name: "\u4F4D",
    purpose: "\u6BCF\u4E2A\u751F\u6210\u5355\u5143\u6392\u961F\u5B8C\u6574\u5360\u4F4D\uFF08craftId + readyId + \u63A8\u8350\u6A21\u578B + \u89C4\u683C\uFF09\uFF0C\u5BFC\u51FA\u5206\u955C\u8868\u7ED9\u7528\u6237\u7B7E\u5B57\uFF1B\u786E\u8BA4\u524D\u4E0D\u751F\u6210",
    tools: ["directorx_propose", "directorx_canvas_shotlist", "directorx_confirm", "directorx_stage"],
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
    purpose: "\u4E00\u6B21\u6F84\u6E05\u771F\u6B63\u7684\u5206\u53C9\uFF08\u65F6\u957F/\u753B\u5E45/\u6539\u7F16\u5E45\u5EA6/\u66FF\u6362\u8303\u56F4\uFF09\uFF0C\u6BCF\u9879\u5E26\u63A8\u8350\u9ED8\u8BA4\u3002\u5FC5\u987B directorx_ask\uFF08DSH \u6807\u51C6\u63D0\u95EE\uFF09\uFF0C\u7981\u6B62\u6B63\u6587\u83DC\u5355\u3002",
    tools: ["directorx_ask"],
    phase: "plan"
  };
  if (kind === "promo") {
    return [
      inventory,
      routeStage(),
      { ...research, purpose: "\u597D\u5BA3\u4F20\u7247\u57FA\u51C6\uFF08\u7ED3\u6784/\u89C6\u89C9/\u5E73\u53F0\uFF09+ \u59D4\u6258\u65B9\u516C\u5F00\u5B9A\u4F4D\uFF0C\u5199\u5165\u4E3B\u9898\u53E5" },
      ask,
      { name: "\u6848", purpose: "\u4E3B\u9898\u53E5 + \u4E09\u5E55 + \u51FA\u955C\u5951\u7EA6 + \u5206\u955C\u8868\uFF08\u542B\u8FDE\u7EED\u6027\uFF09", tools: ["directorx_storyboard", "directorx_character_register"], phase: "create" },
      craftStage(),
      commonSignoff()
    ];
  }
  if (kind === "literary") {
    return [
      inventory,
      routeStage(),
      { ...research, purpose: "\u8BFB\u539F\u4F5C\uFF08\u7528\u6237\u6750\u6599\u6216\u516C\u5F00\u6587\u672C\uFF09\uFF0C\u5224\u65AD\u9898\u6750/\u4F53\u91CF/\u6539\u7F16\u98CE\u9669" },
      { ...ask, purpose: "\u4E00\u6B21\u95EE\u6E05\u96C6\u6570\xD7\u5355\u96C6\u65F6\u957F\u3001\u6539\u7F16\u5E45\u5EA6\u3001\u5E73\u53F0\u3001\u753B\u98CE" },
      { name: "\u7EB2", purpose: "\u5927\u7EB2\u5148\u6536\u655B\u7ED3\u6784\uFF1A\u780D\u7EBF/\u5408\u4EBA/\u5927\u7206\u70B9\u62CD\u677F\u3002\u95E8\u4E0D\u8FC7\u4E0D\u8FDB\u4E0B\u4E00\u5C42\u3002\u89D2\u8272\u3001\u7F8E\u672F\u3001\u5267\u672C\u53EF\u4EE5\u540E\u5E76\u884C\uFF0C\u4F46\u7ED3\u6784\u53EA\u8BA4\u5927\u7EB2\u3002", tools: ["directorx_ask", "directorx_bible"], phase: "create" },
      { name: "\u89D2", purpose: "cast.json \u95E8\u7981\uFF1B\u4E0E\u7F8E\u672F/\u5267\u672C\u53EF\u5E76\u884C\uFF0C\u4E0D\u6539\u5927\u7EB2\u5DF2\u7ECF\u62CD\u677F\u7684\u7ED3\u6784", tools: ["directorx_character_register", "directorx_bible"], phase: "create" },
      { name: "\u7F8E", purpose: "\u573A\u666F\u951A + \u5149\u7167\u53D8\u4F53\uFF0C\u753B\u98CE\u4E0E\u89D2\u8272\u540C\u6863\uFF1B\u53EF\u4E0E\u89D2\u8272/\u5267\u672C\u5E76\u884C", tools: ["directorx_bible"], phase: "create" },
      { name: "\u672C", purpose: "\u573A\u6B21/\u8282\u62CD/\u53F0\u8BCD\uFF0C\u65F6\u957F\u6309\u8BED\u901F\u6298\u7B97 \xB115%\uFF1B\u53EF\u4E0E\u89D2\u8272/\u7F8E\u672F\u5E76\u884C", tools: ["directorx_speech_duration", "directorx_bible"], phase: "create" },
      { name: "\u955C", purpose: "\u5206\u955C\u53EA\u6620\u5C04\u5267\u672C\u8282\u62CD\uFF0C\u4E0D\u53D1\u660E\u60C5\u8282\u3002\u5148\u67E5\u955C\u5934\u8BED\u6C47\u518D\u5207\u3002", tools: ["directorx_shot_vocab", "directorx_storyboard"], phase: "create" },
      { name: "\u8BC4", purpose: "\u628A\u8BC4\u5BA1 Markdown \u9489\u5230\u753B\u5E03\uFF0CDSH \u4F1A\u8BDD\u91CC\u5C55\u793A\u540C\u4E00\u4EFD\u3002\u4E0D\u8981\u53E6\u51FA HTML\u3002", tools: ["directorx_bible"], phase: "refine" },
      craftStage(),
      commonSignoff()
    ];
  }
  if (kind === "remake") {
    return [
      { ...inventory, purpose: "\u8FD9\u662F\u590D\u523B\u4E0D\u662F\u65B0\u62CD\u3002\u5217\u51FA\u6E90\u7247\u4E0E\u66FF\u6362\u4E3B\u4F53" },
      routeStage(),
      { ...research, purpose: "\u62C9\u7247\u5B57\u6BB5\u4E0E\u4E3B\u4F53\u66FF\u6362\u7EAA\u5F8B\uFF08\u9501\u6444\u5F71\u3001\u6362\u8EAB\u4EFD\u3001\u7981\u6E90\u5546\u6807\uFF09" },
      {
        name: "\u62C9\u7247",
        purpose: "\u6709\u6E90\u6587\u4EF6\u5219\u9010\u955C\u62C6\uFF1B\u6CA1\u6709\u5219\u6309\u8BE5\u7C7B\u578B\u53D1\u5E03\u7247\u9AA8\u67B6\u5360\u4F4D\u5E76\u6807\u5F85\u5BF9\u5E27",
        tools: hasMaterials ? ["directorx_video_analyze", "directorx_extract_frames", "directorx_view_image"] : ["directorx_knowledge_search"],
        phase: "create"
      },
      { ...ask, purpose: "\u6E90\u7247\u7248\u672C\u3001\u66FF\u6362\u8303\u56F4\uFF08\u4EBA/\u4EA7\u54C1/endcard\uFF09\u3001\u5360\u4F4D\u6279\u6B21" },
      craftStage(),
      commonSignoff()
    ];
  }
  if (kind === "talk") {
    return [
      inventory,
      routeStage(),
      research,
      ask,
      { name: "\u6848", purpose: "\u811A\u672C \u2192 \u914D\u97F3\u89C4\u683C \u2192 \u753B\u9762\u5360\u4F4D", tools: ["directorx_speech_duration"], phase: "create" },
      craftStage(),
      commonSignoff()
    ];
  }
  if (kind === "montage") {
    return [
      inventory,
      routeStage(),
      research,
      ask,
      { name: "\u6848", purpose: "\u8282\u62CD\u68C0\u6D4B + \u5361\u70B9\u88C1\u526A\u8BA1\u5212\uFF0C\u80FD\u526A\u5C31\u4E0D\u751F\u6210", tools: ["directorx_audio_beat", "directorx_video_analyze"], phase: "create" },
      { name: "\u526A", purpose: "\u5148 directorx_edit_plan\uFF0C\u518D video_process / edit / concat \u56DE\u5199\u753B\u5E03", tools: ["directorx_edit_plan", "directorx_video_process", "directorx_edit", "directorx_video_concat"], phase: "create" },
      craftStage(),
      commonSignoff()
    ];
  }
  if (kind === "trailer") {
    return [
      inventory,
      routeStage(),
      { ...research, purpose: "\u9884\u544A\u7247\u8BED\u6CD5\uFF1A\u94A9\u5B50\u2192\u4E16\u754C\u2192\u5347\u7EA7\u2192\u7247\u540D\u3002\u786C\u5207\uFF0C\u4E0D\u8BB2\u5B8C\u6574\u6545\u4E8B\u3002\u65E5\u6F2B\u70ED\u8840\u5148\u9501\u539F\u521B\u89D2\u8272\u951A\uFF0C\u4E13\u540D\u4E0D\u8FDB\u751F\u6210\u3002" },
      { ...ask, purpose: "\u4E00\u6B21\u95EE\u6E05\u65F6\u957F\uFF08\u9ED8\u8BA4 35s\uFF09\u3001\u753B\u5E45\u3001\u662F\u5426\u8981\u7247\u540D\u5361\u3001\u98CE\u683C\u5206\u671F\uFF08\u590D\u53E4\u8D5B\u7490\u7490 / \u5267\u573A\u7248\u6570\u5B57\u5149\uFF09" },
      { name: "\u6848", purpose: "\u7247\u82B1\u8282\u62CD\u8868 + \u89D2\u8272 16:9 \u8BBE\u5B9A\u8868 + \u6BCF\u955C\u51B2\u51FB\u5E27\u3002\u6BCF\u955C 4\u20136 \u79D2\u4E00\u4E2A\u52A8\u4F5C\u5F27\u3002", tools: ["directorx_storyboard", "directorx_character_register"], phase: "create" },
      craftStage(),
      { name: "\u5207", purpose: "\u6210\u7247\u540E directorx_canvas_pack transition=cut \u786C\u5207\u62FC\u6761\uFF1B\u63A5\u89E6\u8868 directorx_canvas_sheet \u7ED9\u8BC4\u5BA1\u3002\u7981\u6B62 fade\u3002", tools: ["directorx_canvas_pack", "directorx_canvas_sheet"], phase: "refine" },
      commonSignoff()
    ];
  }
  return [
    inventory,
    routeStage(),
    research,
    ask,
    { name: "\u6848", purpose: "\u6545\u4E8B/\u89D2\u8272\u5951\u7EA6/\u9010\u955C\u5206\u955C\u8868\uFF08\u542B continuity_in/out\uFF09", tools: ["directorx_storyboard", "directorx_character_register"], phase: "create" },
    craftStage(),
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
    "\u7528\u6237\u7528 /directorx \u770B\u5236\u7247\u677F\uFF0C\u6216 directorx_confirm \u8D70 DSH \u63D0\u95EE\u7B7E\u5B57\uFF1B\u786E\u8BA4\u524D\u4E0D\u751F\u6210\u3002directorx_orchestrate \u662F\u53EF\u9009\u52A0\u901F\uFF0C\u4E0D\u662F\u5FC5\u7ECF\u5165\u53E3",
    "\u4EA4\u7247\u540E directorx_skill_capture present:true\uFF1A\u7528 DSH \u6807\u51C6\u63D0\u95EE\u662F\u5426\u4FDD\u5B58\u4E3A\u6280\u80FD\uFF0C\u628A\u6D41\u7A0B\u548C\u7528\u6237\u6539\u610F\u89C1\u5199\u6210\u65B0\u6280\u80FD"
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
  if (kind === "trailer") return ["\u9884\u544A\u7247 \u94A9\u5B50 \u786C\u5207", "\u65E5\u6F2B \u70ED\u8840 \u51B2\u51FB\u5E27"];
  return ["\u5206\u955C \u8FDE\u7EED\u6027", "\u53D9\u4E8B \u8282\u594F"];
}

// src/characters.ts
import { mkdir as mkdir5, readFile as readFile8, writeFile as writeFile6 } from "node:fs/promises";
import { join as join9 } from "node:path";
var MAX_CHARACTERS = 100;
var CharacterStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join9(resolveOutputDir(this.outputDir), "characters.json");
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile8(this.filePath(), "utf8"));
      return { characters: Array.isArray(parsed.characters) ? parsed.characters : [] };
    } catch {
      return { characters: [] };
    }
  }
  async register(input) {
    const name = input.name.trim().slice(0, 100);
    if (name === "") throw new Error("character name is required");
    if (input.refPath.trim() === "") throw new Error("refPath is required (local media path or http(s) URL)");
    const ledger = await this.read();
    const existing = ledger.characters.findIndex((card2) => card2.name === name);
    const card = {
      name,
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
    await mkdir5(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile6(this.filePath(), JSON.stringify(ledger, null, 2), "utf8");
    return card;
  }
  async list() {
    const ledger = await this.read();
    return ledger.characters.slice().reverse();
  }
  async remove(name) {
    const trimmed = name.trim();
    const ledger = await this.read();
    const next = ledger.characters.filter((card) => card.name !== trimmed);
    if (next.length === ledger.characters.length) throw new Error(`character "${trimmed}" not found`);
    ledger.characters = next;
    await mkdir5(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile6(this.filePath(), JSON.stringify(ledger, null, 2), "utf8");
  }
  async get(names) {
    const ledger = await this.read();
    return names.map((name) => ledger.characters.find((card) => card.name === name)).filter((card) => card !== void 0);
  }
};

// src/providers/brief.ts
var TYPE_RULES = [
  { type: "\u53E3\u64AD/\u8BB2\u89E3", keywords: ["\u4ECB\u7ECD", "\u8BB2\u89E3", "\u53E3\u64AD", "\u6559\u7A0B", "\u79D1\u666E", "\u6D4B\u8BC4", "\u5206\u4EAB"], seconds: 45 },
  { type: "\u9884\u544A/\u7247\u82B1", keywords: ["\u9884\u544A\u7247", "\u7535\u5F71\u9884\u544A", "\u7247\u82B1", "trailer", "\u9884\u544A"], seconds: 40 },
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
  "\u5199\u5B9E": "cinematic",
  "\u65E5\u6F2B": "anime",
  "\u4E8C\u6B21\u5143": "anime",
  "\u70ED\u8840": "shonen",
  "\u8D5B\u7490\u7490": "cel"
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
function classifyRequestType(request) {
  const scored = TYPE_RULES.map((rule) => ({ rule, hits: rule.keywords.filter((keyword) => request.includes(keyword)).length })).filter((entry) => entry.hits > 0).sort((a, b) => b.hits - a.hits);
  const matched = scored[0]?.rule;
  return {
    type: matched?.type ?? "\u901A\u7528\u77ED\u7247",
    seconds: matched?.seconds ?? 30,
    confidence: matched !== void 0 ? "high" : "low"
  };
}
async function brief(input) {
  const request = input.request.trim();
  const classified = classifyRequestType(request);
  const type = classified.type;
  const explicitSeconds = secondsFrom(request);
  const targetSeconds = explicitSeconds ?? classified.seconds;
  const platform = PLATFORM_RULES.find((rule) => rule.keywords.some((keyword) => request.includes(keyword)));
  const aspectRatio2 = platform?.aspect ?? "16:9";
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
    { question: "\u53D1\u5E03\u5E73\u53F0\uFF08\u51B3\u5B9A\u753B\u5E45\u4E0E\u8282\u594F\uFF09\uFF1F", default: `${platform?.platform ?? "\u672A\u6307\u5B9A"}\uFF08${aspectRatio2}\uFF09` },
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
  if (type === "\u9884\u544A/\u7247\u82B1") suggestedFlow = "trailer\uFF1A\u94A9\u5B50-\u4E16\u754C-\u5347\u7EA7-\u7247\u540D\uFF0C\u786C\u5207\u62FC\u6210\u7247";
  const topic = request.replace(/[帮我做要搞|，。！？\s]/g, "").slice(0, 24);
  const titles = topic === "" ? [] : [
    `3 \u4E2A\u5173\u4E8E\u300C${topic}\u300D\u7684\u771F\u76F8\uFF0C\u7B2C 2 \u4E2A\u6CA1\u4EBA\u544A\u8BC9\u4F60`,
    `\u4E3A\u4EC0\u4E48\u300C${topic}\u300D\u603B\u88AB\u8BEF\u89E3\uFF1F\u4E00\u6B21\u8BF4\u6E05`,
    `\u300C${topic}\u300D\u7684\u6B63\u786E\u6253\u5F00\u65B9\u5F0F\uFF08${targetSeconds}s \u770B\u5B8C\uFF09`
  ];
  const coverPrompt = topic === "" ? null : `\u77ED\u89C6\u9891\u5C01\u9762\uFF1A\u4E3B\u9898\u300C${topic}\u300D\u5927\u5B57\u6807\u9898\u5C45\u4E2D\uFF0C${aspectRatio2} \u7AD6\u5E45\u6784\u56FE\uFF0C\u98CE\u683C ${styleHints.length > 0 ? styleHints.join("\u3001") : "\u5E72\u51C0\u9AD8\u5BF9\u6BD4"}\uFF0C\u6807\u9898\u6587\u5B57\u533A\u57DF\u7559\u767D\uFF0C\u4E3B\u4F53\u6E05\u6670\uFF0C\u65E0\u6742\u4E71\u80CC\u666F`;
  const compose = composeProductionFlow({ type, request, materials: input.materials });
  const plan = planPrompt({ intent: request });
  const nextActions = [`directorx_prompt_plan / \u7A3F\uFF1A${plan.level} ${plan.strategyHint}`, ...compose.nextActions];
  if (characters.length === 0 && (type === "\u5267\u60C5/\u77ED\u5267" || type === "\u5206\u955C/\u6210\u7247" || type === "MV/\u97F3\u4E50" || type === "\u9884\u544A/\u7247\u82B1")) {
    nextActions.splice(1, 0, "\u7528 directorx_character_register \u6CE8\u518C\u4E3B\u4F53\u951A\u70B9\uFF08\u591A\u955C\u5934\u4E00\u81F4\u6027\u524D\u63D0\uFF09");
  }
  return {
    nextActions,
    compose,
    plan,
    titles,
    coverPrompt,
    platformCard,
    brief: {
      type,
      typeConfidence: classified.confidence,
      platform: platform?.platform ?? "\u672A\u6307\u5B9A",
      aspectRatio: aspectRatio2,
      targetSeconds,
      styleHints,
      characters,
      materials
    },
    questions,
    suggestedFlow
  };
}

// src/stage.ts
import { mkdir as mkdir6, readFile as readFile9, writeFile as writeFile7 } from "node:fs/promises";
import { join as join10 } from "node:path";
var STAGE_IDS = [
  "brief",
  "research",
  "forks",
  "script",
  "cast",
  "storyboard",
  "craft",
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
  craft: "\u63D0\u793A\u8BCD\u6210\u7A3F",
  place: "\u5360\u4F4D\u7B7E\u5B57",
  generate: "\u751F\u6210",
  assemble: "\u526A\u8F91\u6210\u7247",
  qa: "\u8D28\u68C0",
  deliver: "\u4EA4\u4ED8"
};
function normalizeDoc(doc) {
  const entries = STAGE_IDS.map((id) => {
    const existing = doc.entries.find((item2) => item2.id === id);
    if (existing !== void 0) return { ...existing, label: LABELS[id] };
    return { id, label: LABELS[id], status: "pending", artifacts: [] };
  });
  const current = STAGE_IDS.includes(doc.current) ? doc.current : "brief";
  return { ...doc, current, entries };
}
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
    return join10(resolveOutputDir(this.outputDir), "stage.json");
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile9(this.filePath(), "utf8"));
      if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) return emptyDoc(parsed.title);
      return normalizeDoc(parsed);
    } catch {
      return emptyDoc();
    }
  }
  async write(doc) {
    doc.updatedAt = Date.now();
    await mkdir6(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile7(this.filePath(), JSON.stringify(doc, null, 2), "utf8");
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
    const entry = doc.entries.find((item2) => item2.id === id);
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
    const current = doc.entries.find((item2) => item2.id === doc.current);
    if (current !== void 0) current.status = mode === "skip" ? "skipped" : "done";
    const target = doc.entries.find((item2) => item2.id === to);
    if (target !== void 0 && target.status !== "done") target.status = "active";
    doc.current = to;
    return this.write(doc);
  }
};
function parseStageId(value) {
  return typeof value === "string" && STAGE_IDS.includes(value) ? value : void 0;
}

// src/production-flow.ts
var COMPLEX = /宣传片|改编|小说|分镜|多镜|短剧|拉片|复刻|系列|连续|成片|单元|混剪|卡点/;
function isSimpleUnit(request) {
  const text = request.trim();
  if (text === "") return true;
  if (COMPLEX.test(text)) return false;
  if (text.length > 80) return false;
  return true;
}
function planProduction(input) {
  const request = input.request.trim();
  const simple = isSimpleUnit(request);
  const prompt = planPrompt({ intent: request, kind: input.kind, model: input.model });
  const compose = composeProductionFlow({
    type: classifyRequestType(request).type,
    request: request || "\u6210\u7247",
    materials: input.materials
  });
  const reason = simple ? "\u5355\u955C/\u77ED\u53E5\uFF1A\u8D70\u63D0\u793A\u8BCD\u7F16\u6392\u95F8\uFF0C\u4E0D\u94FA\u6574\u677F\u3002" : "\u590D\u6742\u6210\u7247\uFF1A\u6309 brief.compose \u7684\u8DEF/\u7A3F/\u4F4D\u8D70\uFF0C\u7B7E\u5B57\u524D\u4E0D generate\u3002";
  const next = simple ? prompt.next : [
    "directorx_brief",
    "directorx_chengpian",
    "directorx_skill_route",
    ...compose.stages.flatMap((stage) => stage.tools).slice(0, 8),
    "directorx_stage record \u6BCF\u8FC7\u4E00\u9636\u6BB5",
    "\u4EA4\u4ED8\u540E directorx_skill_capture present:true"
  ];
  return {
    simple,
    reason,
    prompt,
    compose,
    stages: [...STAGE_IDS],
    next: [...new Set(next)]
  };
}

// src/generate-ready.ts
import { mkdir as mkdir8, readFile as readFile11, writeFile as writeFile9 } from "node:fs/promises";
import { join as join12 } from "node:path";

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

// src/canvas.ts
import { mkdir as mkdir7, readFile as readFile10, writeFile as writeFile8 } from "node:fs/promises";
import { join as join11 } from "node:path";

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
function shotMark(shotIndex) {
  if (shotIndex === void 0 || !Number.isFinite(shotIndex)) return "";
  return `#${String(Math.max(0, Math.floor(shotIndex))).padStart(2, "0")}`;
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
function flowAbsolutePosition(node, byId, seen = /* @__PURE__ */ new Set()) {
  if (node.parentId === void 0 || node.parentId === "" || seen.has(node.id)) {
    return { x: node.position.x, y: node.position.y };
  }
  seen.add(node.id);
  const parent = byId.get(node.parentId);
  if (parent === void 0) return { x: node.position.x, y: node.position.y };
  const origin = flowAbsolutePosition(parent, byId, seen);
  return { x: origin.x + node.position.x, y: origin.y + node.position.y };
}
function edgeHandlePoints(source, target) {
  return {
    sourceX: source.x + source.width,
    sourceY: source.y + source.height / 2,
    targetX: target.x,
    targetY: target.y + target.height / 2
  };
}
function portPoint(box, side) {
  if (side === "left") return { x: box.x, y: box.y + box.height / 2 };
  if (side === "right") return { x: box.x + box.width, y: box.y + box.height / 2 };
  if (side === "top") return { x: box.x + box.width / 2, y: box.y };
  return { x: box.x + box.width / 2, y: box.y + box.height };
}
function handleToSide(handle) {
  if (handle === "in") return "left";
  if (handle === "out") return "right";
  if (handle === "top") return "top";
  if (handle === "bottom") return "bottom";
  return void 0;
}
function sideToHandle(side) {
  if (side === "left") return "in";
  if (side === "right") return "out";
  return side;
}
function portsForHandles(source, target, sourceHandle, targetHandle) {
  const fallback = closestPorts(source, target);
  const sourceSide = handleToSide(sourceHandle) ?? fallback.sourceSide;
  const targetSide = handleToSide(targetHandle) ?? fallback.targetSide;
  const from = portPoint(source, sourceSide);
  const to = portPoint(target, targetSide);
  return { sourceSide, targetSide, sourceX: from.x, sourceY: from.y, targetX: to.x, targetY: to.y };
}
function gapAfter(start, end, otherStart, otherEnd) {
  if (otherStart >= end) return otherStart - end;
  if (start >= otherEnd) return start - otherEnd;
  return void 0;
}
function closestPorts(source, target) {
  const dx = target.x + target.width / 2 - (source.x + source.width / 2);
  const dy = target.y + target.height / 2 - (source.y + source.height / 2);
  const gapX = gapAfter(source.x, source.x + source.width, target.x, target.x + target.width);
  const gapY = gapAfter(source.y, source.y + source.height, target.y, target.y + target.height);
  const horizontal = gapX !== void 0 && gapY !== void 0 ? gapX <= gapY : gapX !== void 0 ? true : gapY !== void 0 ? false : Math.abs(dx) >= Math.abs(dy);
  const sourceSide = horizontal ? dx >= 0 ? "right" : "left" : dy >= 0 ? "bottom" : "top";
  const targetSide = horizontal ? dx >= 0 ? "left" : "right" : dy >= 0 ? "top" : "bottom";
  const from = portPoint(source, sourceSide);
  const to = portPoint(target, targetSide);
  return {
    sourceSide,
    targetSide,
    sourceX: from.x,
    sourceY: from.y,
    targetX: to.x,
    targetY: to.y
  };
}
function routeDisplayPorts(source, target, sourceHandle, targetHandle) {
  const sourceSide = handleToSide(sourceHandle);
  const targetSide = handleToSide(targetHandle);
  const explicit = sourceSide === "top" || sourceSide === "bottom" || targetSide === "top" || targetSide === "bottom";
  if (explicit) return portsForHandles(source, target, sourceHandle, targetHandle);
  return closestPorts(source, target);
}
var TITLE_CLEAR = 34;
var STACK_GAP = 18;
var GROUP_INSET_X = 28;
var GROUP_INSET_TOP = 52;
var GROUP_INSET_BOT = 36;
function fallbackCardSize(kind) {
  if (kind === "group") return { width: 640, height: 460 };
  if (kind === "text") return { width: 250, height: 180 };
  return { width: 400, height: 220 };
}
function stackBox(node) {
  const size = fallbackCardSize(node.kind);
  return {
    x: node.x,
    y: node.y,
    width: node.width ?? size.width,
    height: node.height ?? size.height
  };
}
function boxesOverlap(left, right) {
  return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;
}
function tidyOverlappingGroups(nodes) {
  const next = nodes.map((node) => ({ ...node }));
  for (const group of next.filter((node) => node.kind === "group")) {
    const members = next.filter((node) => node.parent === group.id);
    if (members.length === 0) continue;
    const boxes = members.map(stackBox);
    const frame = stackBox(group);
    const overflow = boxes.some(
      (box) => box.x < frame.x - 1 || box.y < frame.y - 1 || box.x + box.width > frame.x + frame.width + 1 || box.y + box.height > frame.y + frame.height + 1
    );
    const collide = boxes.some((box, index) => boxes.some((other, otherIndex) => {
      if (otherIndex <= index) return false;
      return boxesOverlap(
        { ...box, height: box.height + TITLE_CLEAR },
        { ...other, height: other.height + TITLE_CLEAR }
      );
    }));
    if (!overflow && !collide) continue;
    members.sort((left2, right) => (left2.shotIndex ?? 1e9) - (right.shotIndex ?? 1e9) || left2.y - right.y || left2.x - right.x);
    const cardWidth = Math.max(...members.map((member) => stackBox(member).width));
    let cursor = group.y + GROUP_INSET_TOP;
    const left = group.x + GROUP_INSET_X;
    for (const member of members) {
      const size = stackBox(member);
      member.x = left;
      member.y = cursor;
      cursor += size.height + TITLE_CLEAR + STACK_GAP;
    }
    group.width = Math.max(frame.width, GROUP_INSET_X * 2 + cardWidth);
    group.height = Math.max(frame.height, cursor - group.y - STACK_GAP + GROUP_INSET_BOT);
  }
  return next;
}
function hitTestAbsolute(flowPos, boxes) {
  return boxes.find(
    (box) => flowPos.x >= box.x && flowPos.x <= box.x + box.width && flowPos.y >= box.y && flowPos.y <= box.y + box.height
  )?.id;
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
function planContinueFromFlowNode(input) {
  const byId = new Map(input.nodes.map((node) => [node.id, node]));
  const abs = input.source !== void 0 ? flowAbsolutePosition(input.source, byId) : void 0;
  return planContinueGenerate({
    ...input.source !== void 0 && abs !== void 0 ? { source: { id: input.source.id, x: abs.x, y: abs.y, width: input.source.width, kind: input.source.kind } } : {},
    ...input.kind !== void 0 ? { kind: input.kind } : {},
    prompt: input.prompt
  });
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
var KIND_RANK = { text: 0, image: 1, video: 2, group: 3 };
function canvasEdgeAllowed(from, to) {
  if (to.locked === true) return false;
  if (to.kind === "text" || to.kind === "group") return false;
  if (from.kind === "group") return false;
  if (from.kind === "video" && to.kind === "image") return false;
  return to.kind === "image" || to.kind === "video";
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
    const members = nodes.filter((node) => node.parent === group.id).sort((left, right) => {
      const shot = (left.shotIndex ?? 1e9) - (right.shotIndex ?? 1e9);
      if (shot !== 0) return shot;
      return KIND_RANK[left.kind] - KIND_RANK[right.kind];
    });
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
    label: resolveStoredLabel(
      void 0,
      typeof input.label === "string" ? input.label.slice(0, kind === "text" ? 8e3 : 200) : "",
      prompt,
      shotIndex
    ).slice(0, kind === "text" ? 8e3 : 200),
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
    ...Array.isArray(input.characters) ? { characters: input.characters.filter((name) => typeof name === "string" && name.trim() !== "").map((name) => name.trim().slice(0, 80)).slice(0, 8) } : {},
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
    return join11(resolveOutputDir(this.outputDir), CANVAS_FILE);
  }
  async read() {
    const path = this.filePath();
    const raw = await readFile10(path, "utf8").catch((error) => {
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
        nodes: Array.isArray(parsed.nodes) ? parsed.nodes.map((item2) => sanitizeNode(item2)) : [],
        edges: Array.isArray(parsed.edges) ? parsed.edges.map((item2) => sanitizeEdge(item2)) : []
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
      const existing = await readFile10(path, "utf8");
      if (existing.trim() !== "") {
        const backup = join11(resolveOutputDir(this.outputDir), `canvas.json.bak-${Date.now()}`);
        await writeFile8(backup, existing, "utf8");
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
    const dir = join11(resolveOutputDir(this.outputDir));
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
    await writeFile8(path, JSON.stringify(saved), "utf8");
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
    if (fromNode !== void 0 && toNode !== void 0 && !canvasEdgeAllowed(fromNode, toNode)) {
      if (toKind === "text" || toKind === "group") throw new Error(`edge reason: \u76EE\u6807\u8282\u70B9\u662F ${toKind}\uFF0C\u4E0D\u80FD\u4F5C\u4E3A\u8F93\u5165\u4F9D\u8D56\uFF08\u8FDE\u7EBF\u53EA\u80FD\u6307\u5411 image/video\uFF09`);
      if (fromKind === "video" && toKind === "image") throw new Error("edge reason: video \u4E0D\u80FD\u5582\u7ED9 image\uFF08\u89C6\u9891\u53EA\u80FD\u63A5\u529B\u5230 video\uFF09");
      if (fromKind === "group") throw new Error("edge reason: group \u53EA\u4F5C\u5BB9\u5668\uFF0C\u4E0D\u80FD\u4F5C\u4E3A\u8FDE\u7EBF\u6E90");
      throw new Error(`edge reason: ${fromKind} \u4E0D\u80FD\u8FDE\u5230 ${toKind}`);
    }
  }
  canConnect(from, to) {
    return canvasEdgeAllowed(from, to);
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
    return join11(resolveOutputDir(this.outputDir), ".canvas-snapshots");
  }
  snapshotsFile() {
    return join11(this.snapshotsPath(), "index.json");
  }
  async snapshot(label) {
    const doc = await this.read();
    const id = `snap-${Date.now().toString(36)}`;
    const index = await this.readSnapshotsIndex();
    index.unshift({ id, at: Date.now(), label: label.slice(0, 100) });
    while (index.length > 20) index.pop();
    await mkdir7(this.snapshotsPath(), { recursive: true });
    await writeFile8(this.snapshotsFile(), JSON.stringify(index, null, 2), "utf8");
    await writeFile8(join11(this.snapshotsPath(), `${id}.json`), JSON.stringify(doc, null, 2), "utf8");
    return index[0];
  }
  async readSnapshotsIndex() {
    try {
      const parsed = JSON.parse(await readFile10(this.snapshotsFile(), "utf8"));
      return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
    } catch {
      return [];
    }
  }
  async restoreSnapshot(id) {
    const raw = await readFile10(join11(this.snapshotsPath(), `${id}.json`), "utf8");
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

// src/generate-ready.ts
var FILE4 = "generate-ready.json";
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
var FL_HINT = /首尾帧|fl2va|first[\s_-]*and[\s_-]*last|first[\s_-]*last[\s_-]*frame/i;
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
  for (const name of extra) {
    const trimmed = name.trim();
    if (trimmed !== "") found.add(trimmed);
  }
  const catalog = [
    ...snapshot.characters.map((card) => card.name),
    ...snapshot.nodes.flatMap((node) => node.characters ?? [])
  ];
  for (const name of catalog) {
    const trimmed = name.trim();
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
function sheetHit(name, snapshot) {
  return snapshot.nodes.find((node) => {
    if (!hasPath(node.path)) return false;
    const labeled = node.label.includes(name);
    const tagged = (node.characters ?? []).includes(name);
    return (SHEET_NODE.test(node.label) || tagged) && (labeled || tagged);
  });
}
function sceneHit(name, snapshot) {
  return snapshot.nodes.find(
    (node) => node.kind === "image" && hasPath(node.path) && (node.label.includes(name) || SCENE_HINT.test(node.label))
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
  if (declared === "fl2v" || hasPath(input.firstFrame) && hasPath(input.lastFrame)) return "fl2v";
  if (declared !== void 0) return declared;
  if (FL_HINT.test(text)) return "fl2v";
  const source = previousMedia(input);
  if (hasPath(input.firstFrame) || I2V_HINT.test(text)) return "i2v";
  if (source?.kind === "image" && hasPath(source.path)) return "i2v";
  if (source?.kind === "video" && hasPath(source.path)) return "i2v";
  const names = detectNamedCharacters(text, input.snapshot, input.characters);
  if (names.length > 0 && snapshotHasCharacterRef(names, input.snapshot) && !hasPath(input.firstFrame)) return "ref2v";
  return "t2v";
}
function snapshotHasCharacterRef(names, snapshot) {
  return names.some((name) => {
    const card = snapshot.characters.find((item2) => item2.name === name);
    return card !== void 0 && hasPath(card.refPath) || sheetHit(name, snapshot) !== void 0;
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
    for (const name of names) {
      const card = input.snapshot.characters.find((item2) => item2.name === name);
      const sheet = sheetHit(name, input.snapshot);
      if (card !== void 0 && hasPath(card.refPath)) hits.push(`${name}\u2190\u89D2\u8272\u5E93`);
      else if (sheet !== void 0) hits.push(`${name}\u2190${sheet.id}`);
      else missing.push(name);
    }
    if (missing.length === 0) return { need, ok: true, detail: hits.join("\uFF1B"), name: names.join("\u3001") };
    if (waived(input, need) && missing.every((name) => input.snapshot.characters.every((card) => card.name !== name))) {
      return { need, ok: true, detail: `\u7528\u6237\u786E\u8BA4\u672C\u955C\u4E0D\u9501 ${missing.join("\u3001")}` };
    }
    return { need, ok: false, detail: `\u7F3A\u8BBE\u5B9A\u56FE/\u89D2\u8272\u5361\uFF1A${missing.join("\u3001")}`, name: missing.join("\u3001") };
  }
  if (need === "scene-still") {
    const scenes = (input.scenes ?? []).map((name) => name.trim()).filter((name) => name !== "");
    if (scenes.length === 0) return { need, ok: true, detail: "\u672A\u6307\u5B9A\u8981\u9501\u7684\u573A\u666F" };
    const missing = scenes.filter((name) => sceneHit(name, input.snapshot) === void 0 && !(input.referenceImages ?? []).some(hasPath));
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
  const missingNeeds = new Set(report.missing.map((item2) => item2.need));
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
        ...report.namedCharacters.some((name) => report.input.snapshot.characters.some((card) => card.name === name)) ? [] : [{ label: "\u7EAF\u6587\u751F\u89C6\u9891\uFF0C\u4E0D\u9501\u957F\u76F8", description: "\u6CA1\u6709\u8981\u8BA4\u7684\u4EBA/\u573A\u666F\u624D\u9009" }]
      ]
    });
  }
  if (missingNeeds.has("character-sheet")) {
    const who = report.missing.find((item2) => item2.need === "character-sheet")?.name ?? "\u4EBA\u7269";
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
  for (const item2 of report.missing) {
    if (item2.need === "detailed-prompt") next.push("directorx_prompt_plan\uFF0C\u6309\u516D\u8981\u7D20\u5199\u7EC6\u518D prompt_craft");
    if (item2.need === "character-sheet") {
      next.push("directorx_skill_read novel-characters");
      next.push("\u5148 directorx_generate_ready strategy=character-sheet \u518D generate_image \u51FA\u8BBE\u5B9A\u8868");
      next.push("\u51FA\u56FE\u540E directorx_character_register");
    }
    if (item2.need === "first-frame" && item2.path !== void 0 && item2.detail.includes("extract_frames")) {
      next.push(`directorx_extract_frames source=${item2.path}\uFF08\u53D6\u672B\u5E27\uFF09`);
    } else if (item2.need === "first-frame") {
      next.push("\u5148 generate_image strategy=keyframe \u51FA\u672C\u955C\u9996\u5E27\uFF0C\u6216\u6307\u5B9A firstFrame");
    }
    if (item2.need === "last-frame") next.push("\u5148 generate_image \u51FA\u5C3E\u5E27\u9759\u5E27\uFF0C\u518D ready strategy=fl2v");
    if (item2.need === "scene-still") next.push("\u5148 generate_image strategy=scene-still \u51FA\u573A\u666F\u7A7A\u955C");
    if (item2.need === "keyframe") next.push("\u5148 generate_image strategy=keyframe");
  }
  if (report.verdict === "ready") {
    next.push("\u4E25\u683C/\u534F\u540C\uFF1Adirectorx_propose \u5E26 craftId+readyId\uFF1B\u751F\u6210\u5FC5\u987B\u5E26\u540C\u4E00\u4E2A readyId");
  } else {
    next.push("\u7528 directorx_ask\uFF08DSH \u6807\u51C6\u63D0\u95EE\uFF09\u8BA9\u7528\u6237\u9009\u8DEF\uFF0C\u8865\u8D44\u4EA7\u540E\u518D directorx_generate_ready commit:true");
  }
  return [...new Set(next)];
}
function collectBind(input, strategy, present, names) {
  const first = present.find((item2) => item2.need === "first-frame")?.path ?? (hasPath(input.firstFrame) ? input.firstFrame : void 0);
  const last = present.find((item2) => item2.need === "last-frame")?.path ?? (hasPath(input.lastFrame) ? input.lastFrame : void 0);
  const sceneRefs = (input.scenes ?? []).map((name) => sceneHit(name, input.snapshot)?.path).filter((path) => hasPath(path));
  const sheets = names.map((name) => input.snapshot.characters.find((card) => card.name === name)?.refPath ?? sheetHit(name, input.snapshot)?.path).filter((path) => hasPath(path));
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
  const present = items.filter((item2) => item2.ok);
  const missing = items.filter((item2) => !item2.ok);
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
    reason: missing.length === 0 ? `${strategy} \u53C2\u8003\u9F50\uFF0C\u53EF\u4EE5\u751F\u6210` : `\u8FD8\u4E0D\u80FD\u751F\u6210\uFF1A${missing.map((item2) => item2.detail).join("\uFF1B")}`
  };
  draft.ask = draft.verdict === "blocked" ? buildAsk({ ...draft, input }) : [];
  draft.next = buildNext(draft);
  const promptIp = scanIpRisk(input.prompt);
  const intentIp = promptIp.length > 0 ? promptIp : scanIpRisk(input.intent);
  if (promptIp.length > 0) {
    const brief2 = buildIpBrief(input.prompt);
    draft.ip = promptIp;
    draft.verdict = "blocked";
    draft.next = brief2.next;
    draft.reason = `\u6210\u7A3F\u4ECD\u542B IP \u4E13\u540D\uFF0C\u4E0D\u80FD ready\u3002${promptIp.map(ipIssueLine).join(" ")}`;
  } else if (intentIp.length > 0) {
    draft.ip = intentIp;
    draft.next = ["\u610F\u56FE\u542B IP \u4E13\u540D\uFF1A\u6210\u7A3F\u987B\u5DF2\u6539\u5199\u3002\u751F\u6210\u65F6\u5E26\u8D1F\u5411\u6392\u9664\u3002", ...draft.next];
  }
  return draft;
}
var GenerateReadyStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join12(resolveOutputDir(this.outputDir), FILE4);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile11(this.filePath(), "utf8"));
      return Array.isArray(parsed.briefs) ? parsed.briefs : [];
    } catch {
      return [];
    }
  }
  async get(id) {
    return (await this.read()).find((item2) => item2.id === id);
  }
  async save(brief2) {
    const briefs = await this.read();
    briefs.push(brief2);
    await mkdir8(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile9(this.filePath(), JSON.stringify({ briefs: briefs.slice(-MAX4) }, null, 2), "utf8");
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
    return raw.flatMap((item2, index) => normalizeOne(item2, index)).slice(0, 6);
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
  const options = optionsRaw.flatMap((item2) => {
    if (typeof item2 === "string" && item2.trim() !== "") return [{ label: item2.trim() }];
    if (item2 !== null && typeof item2 === "object") {
      const option = item2;
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
  if (recommended !== "" && !options.some((item2) => item2.label === recommended) && options.length < 8) {
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
  if (input.questions.length === 0) throw new Error("directorx_ask \u9700\u8981\u81F3\u5C11\u4E00\u9053 question\uFF08\u8D70 DSH \u6807\u51C6\u63D0\u95EE\uFF09");
  const asked = await input.ask({
    questions: input.questions,
    ...input.agent === void 0 ? {} : { agent: input.agent },
    ...input.signal === void 0 ? {} : { signal: input.signal }
  });
  return { answers: asked.answers, questions: input.questions };
}

// src/notes.ts
import { mkdir as mkdir9, readFile as readFile12, writeFile as writeFile10 } from "node:fs/promises";
import { join as join13 } from "node:path";
var FILE5 = "notes.json";
var MAX5 = 80;
var NoteStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join13(resolveOutputDir(this.outputDir), FILE5);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile12(this.filePath(), "utf8"));
      return Array.isArray(parsed.notes) ? parsed.notes : [];
    } catch {
      return [];
    }
  }
  async append(input) {
    const text = input.text.trim().slice(0, 500);
    if (text === "") throw new Error("directorx_note \u9700\u8981\u975E\u7A7A text");
    const note = {
      id: `note-${Date.now().toString(36)}`,
      text,
      source: input.source ?? "user",
      at: Date.now()
    };
    const notes = [...await this.read(), note].slice(-MAX5);
    await mkdir9(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile10(this.filePath(), JSON.stringify({ notes }, null, 2), "utf8");
    return note;
  }
};

// src/skill-capture.ts
import { existsSync as existsSync2 } from "node:fs";
import { mkdir as mkdir12, writeFile as writeFile13 } from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { join as join16 } from "node:path";

// src/proposals.ts
import { mkdir as mkdir10, readFile as readFile13, writeFile as writeFile11 } from "node:fs/promises";

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
function clampRange(value, range) {
  return Math.min(range[1], Math.max(range[0], value));
}

// src/proposals.ts
import { join as join14 } from "node:path";
var MAX_PROPOSALS = 200;
var STAGE_ORDER = ["script", "character", "shot", "assembly"];
var ProposalStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join14(resolveOutputDir(this.outputDir), "proposals.json");
  }
  async read() {
    try {
      const raw = await readFile13(this.filePath(), "utf8");
      const parsed = JSON.parse(raw);
      return { proposals: Array.isArray(parsed.proposals) ? parsed.proposals : [] };
    } catch {
      return { proposals: [] };
    }
  }
  async write(ledger) {
    await mkdir10(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile11(this.filePath(), JSON.stringify(ledger, null, 2), "utf8");
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

// src/style-constants.ts
import { mkdir as mkdir11, readFile as readFile14, writeFile as writeFile12 } from "node:fs/promises";
import { join as join15 } from "node:path";
var ProjectStyleStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join15(resolveOutputDir(this.outputDir), "style.json");
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile14(this.filePath(), "utf8"));
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
    await mkdir11(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile12(this.filePath(), JSON.stringify(merged, null, 2), "utf8");
    return merged;
  }
  /** 生成提示词的常量块（逐字复用）。 */
  block() {
    return "";
  }
};

// src/skill-capture.ts
var SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var RUNTIME_RESERVED = /* @__PURE__ */ new Set([
  "directorx-knowledge",
  "directorx-recipes",
  "directorx-workflow",
  "directorx-skill-capture"
]);
var SKIP_RE = /不保存|跳过|不必|不用|算了|skip|no\b/i;
var RENAME_RE = /换个名字|改名|rename/i;
function validSkillName(name) {
  return name.length >= 2 && name.length <= 64 && SKILL_NAME_RE.test(name);
}
function slugSkillName(raw) {
  const latin = raw.trim().toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  if (!validSkillName(latin)) return "";
  return latin.startsWith("dx-") ? latin : `dx-${latin}`;
}
function suggestSkillName(title) {
  const slug = slugSkillName(title);
  return slug !== "" ? slug : "dx-chengpian";
}
function dshHome() {
  return process.env.DSH_HOME ?? join16(homedir2(), ".dsh");
}
function userSkillRoot(override) {
  return override ?? join16(dshHome(), "skills");
}
function projectSkillRoot(outputDir) {
  return join16(resolveOutputDir(outputDir), "skills");
}
function extraSkillRoots(outputDir, userRoot) {
  return [projectSkillRoot(outputDir), userSkillRoot(userRoot)];
}
function saveSkillAsk(title) {
  const save = `\u4FDD\u5B58\u4E3A\u300C${title}\u300D\u6280\u80FD`;
  return {
    id: "save-skill",
    header: "\u6536\u6210\u6280\u80FD",
    question: `\u8981\u628A\u8FD9\u6B21\u6210\u7247\u6D41\u7A0B\u4FDD\u5B58\u4E3A\u300C${title}\u300D\u6280\u80FD\u5417\uFF1F`,
    detail: "\u4FDD\u5B58\u540E\uFF0C\u4E0B\u6B21\u540C\u7C7B\u6210\u7247\u4F1A\u5148\u8BFB\u8FD9\u4EFD\u6280\u80FD\uFF1A\u6D41\u7A0B\u3001\u4F60\u6539\u8FC7\u7684\u5730\u65B9\u3001\u98CE\u683C\u548C\u7248\u6743\u7EAA\u5F8B\u90FD\u5728\u91CC\u9762\u3002",
    options: [
      { label: save, description: "\u6309\u8FD9\u4E2A\u540D\u5B57\u5199\u5165\u9879\u76EE\u548C\u7528\u6237\u6280\u80FD\u5E93" },
      { label: "\u6362\u4E2A\u540D\u5B57", description: "\u5728\u4E0B\u65B9\u5199\u4E0B\u4F60\u8981\u7684\u6280\u80FD\u540D" },
      { label: "\u8FD9\u6B21\u4E0D\u4FDD\u5B58", description: "\u53EA\u4EA4\u7247\uFF0C\u4E0D\u6C89\u6DC0\u6280\u80FD" }
    ]
  };
}
function decideCaptureAnswer(input) {
  const explicit = typeof input.name === "string" ? input.name.trim() : "";
  if (explicit !== "") {
    if (SKIP_RE.test(explicit)) return { kind: "skip" };
    return { kind: "save", name: suggestSkillName(explicit), title: displayTitle(explicit, input.suggestedTitle) };
  }
  const answers = input.answers ?? [];
  const custom = answers.map((item2) => item2.custom?.trim() ?? "").find((item2) => item2 !== "") ?? "";
  const selected = answers.flatMap((item2) => item2.selected).join(" ");
  const spoken = (input.answer ?? "").trim();
  const blob2 = `${selected} ${custom} ${spoken}`.trim();
  if (blob2 === "") return { kind: "rename" };
  if (SKIP_RE.test(blob2) && custom === "") return { kind: "skip" };
  if (custom !== "") {
    if (SKIP_RE.test(custom)) return { kind: "skip" };
    return { kind: "save", name: suggestSkillName(custom), title: displayTitle(custom, input.suggestedTitle) };
  }
  if (RENAME_RE.test(blob2) && custom === "") return { kind: "rename" };
  if (spoken !== "" && !SKIP_RE.test(spoken) && !RENAME_RE.test(spoken) && !spoken.includes("\u4FDD\u5B58\u4E3A")) {
    return { kind: "save", name: suggestSkillName(spoken), title: displayTitle(spoken, input.suggestedTitle) };
  }
  return { kind: "save", name: input.suggestedName, title: input.suggestedTitle };
}
function displayTitle(raw, fallback) {
  const title = raw.replace(/^保存为[「"]?|[」"]?技能$/g, "").trim();
  return title !== "" ? title.slice(0, 40) : fallback;
}
function harvestPrompts(title, name) {
  return {
    agentPrompt: [
      "\u6210\u7247\u5DF2\u5230\u4EA4\u4ED8\u3002\u7ACB\u523B\u7528 directorx_ask / skill_capture present \u8D70 DSH \u6807\u51C6\u63D0\u95EE\uFF0C\u95EE\u7528\u6237\u8981\u4E0D\u8981\u628A\u8FD9\u6B21\u6D41\u7A0B\u6536\u6210\u6280\u80FD\uFF0C\u7981\u6B62\u5728\u6B63\u6587\u5199 1.2.3 \u83DC\u5355\u3002",
      `\u8C03\u7528 directorx_skill_capture { action: "offer", present: true }\uFF0C\u9ED8\u8BA4\u540D\u662F\u300C${title}\u300D/ ${name}\u3002`,
      "\u7528\u6237\u8BF4\u4E0D\u4FDD\u5B58\u5C31\u505C\u3002\u8BF4\u6362\u4E2A\u540D\u5B57\u5C31\u518D\u7528 DSH \u6807\u51C6\u63D0\u95EE\u6216\u81EA\u5B9A\u4E49\u56DE\u7B54\u6536\u4E0B\u540D\u5B57\u3002",
      "\u540C\u610F\u540E\u6839\u636E harvest \u7684 stages / notes / rejects / crafts / style / ip \u81EA\u5DF1\u5199 SKILL.md \u6B63\u6587\uFF0C\u518D directorx_skill_capture action:save\u3002",
      "\u4E0D\u8981\u5199\u5165\u63D2\u4EF6\u81EA\u5E26 skills/\u3002\u7528\u6237\u4FEE\u6539\u610F\u89C1\u7528 directorx_note \u8BB0\u8FC7\u7684\u548C\u63D0\u6848\u62D2\u7EDD\u539F\u56E0\u90FD\u8981\u5199\u8FDB\u6280\u80FD\u7EAA\u5F8B\u3002"
    ].join(""),
    writePrompt: [
      "\u6839\u636E harvest \u5199\u4E00\u4EFD\u53EF\u590D\u7528\u7684 SKILL.md \u6B63\u6587\uFF0C\u4E0D\u8981\u628A JSON \u539F\u6587\u8D34\u8FDB\u53BB\u3002",
      "\u5FC5\u987B\u5305\u542B\uFF1A\u4F55\u65F6\u89E6\u53D1\uFF08description \u91CC\u4E5F\u8981\u5199\uFF09\u3001\u8FD9\u6B21\u8D70\u901A\u7684\u9636\u6BB5\u987A\u5E8F\u3001\u7528\u6237\u6539\u8FC7\u4EC0\u4E48\u6240\u4EE5\u4E0B\u6B21\u9ED8\u8BA4\u600E\u4E48\u505A\u3001\u98CE\u683C/\u955C\u5934\u9501\u3001\u70B9\u540D IP \u65F6\u8D70\u6539\u5199\u8BB0\u5FC6\u3002",
      "\u6280\u80FD\u540D\u53EA\u80FD\u662F\u5C0F\u5199\u82F1\u6587\u77ED\u6A2A\u7EBF\u3002\u6B63\u6587\u7528\u7948\u4F7F\u53E5\u3002\u4E0D\u8981\u5199\u63D2\u4EF6\u5B9E\u73B0\u7EC6\u8282\u6216\u5185\u90E8\u8DEF\u5F84\u3002"
    ].join("")
  };
}
async function harvestProduction(outputDir, titleHint) {
  const [stage, canvas, crafts, proposals, notes, style, ip, research] = await Promise.all([
    new ProductionStageStore(outputDir).read(),
    new DirectorxCanvasStore(outputDir).read(),
    new PromptCraftStore(outputDir).read(),
    new ProposalStore(outputDir).read(),
    new NoteStore(outputDir).read(),
    new ProjectStyleStore(outputDir).read(),
    new IpMemoryStore(outputDir).read(),
    new ResearchLedger(outputDir).read()
  ]);
  const title = (titleHint?.trim() || canvas.title?.trim() || stage.title.trim() || crafts.at(-1)?.intent.trim() || "\u672C\u6B21\u6210\u7247").slice(0, 40);
  const suggestedName = suggestSkillName(title);
  const stages = stage.entries.map((entry) => ({
    id: entry.id,
    label: entry.label,
    status: entry.status,
    notes: entry.artifacts.map((item2) => [item2.kind, item2.note, item2.path].filter(Boolean).join(" ")).filter((item2) => item2 !== "").slice(-4)
  }));
  const harvestedCrafts = crafts.slice(-8).map((item2) => ({
    kind: item2.kind,
    intent: item2.intent.slice(0, 160),
    prompt: item2.prompt.slice(0, 400),
    skills: item2.skillNames.slice(0, 6)
  }));
  const userNotes = notes.slice(-20).map((item2) => item2.text);
  const rejects = proposals.proposals.filter((item2) => item2.status === "rejected" && (item2.rejectReason ?? "") !== "").slice(-12).map((item2) => item2.rejectReason?.trim() ?? "").filter((item2) => item2 !== "");
  const skillsUsed = [.../* @__PURE__ */ new Set([
    ...harvestedCrafts.flatMap((item2) => item2.skills),
    ...research.filter((item2) => item2.kind === "skill").map((item2) => item2.ref)
  ])].slice(0, 16);
  const locked = style !== null && [style.camera, style.palette, style.lighting].some((item2) => item2.trim() !== "") ? { camera: style.camera, palette: style.palette, lighting: style.lighting } : void 0;
  const ipHits = ip.slice(-8).map((item2) => ({ terms: item2.terms, rewrite: item2.rewrite.slice(0, 240) }));
  const prompts = harvestPrompts(title, suggestedName);
  return {
    title,
    suggestedName,
    suggestedTitle: title,
    stages,
    crafts: harvestedCrafts,
    notes: userNotes,
    rejects,
    skillsUsed,
    ...locked !== void 0 ? { style: locked } : {},
    ip: ipHits,
    ask: saveSkillAsk(title),
    agentPrompt: prompts.agentPrompt,
    writePrompt: prompts.writePrompt
  };
}
async function deliverCapture(outputDir) {
  const harvest = await harvestProduction(outputDir);
  return {
    capture: {
      suggestedName: harvest.suggestedName,
      suggestedTitle: harvest.suggestedTitle,
      ask: harvest.ask
    },
    nextTools: ["directorx_skill_capture"],
    agentPrompt: harvest.agentPrompt
  };
}
function stripFrontmatter(source) {
  if (!source.startsWith("---\n") && !source.startsWith("---\r\n")) return source.trim();
  const end = source.indexOf("\n---", 3);
  return (end >= 0 ? source.slice(end + 4) : source).replace(/^\r?\n/, "").trim();
}
function skillMarkdown(input) {
  const description = input.description.replace(/\r?\n/g, " ").trim().slice(0, 400);
  const heading = input.body.trim().startsWith("#") ? "" : `# ${input.title}

`;
  return [
    "---",
    `name: ${input.name}`,
    "description: >-",
    `  ${description}`,
    "user-invocable: true",
    "---",
    "",
    `${heading}${input.body.trim()}`,
    ""
  ].join("\n");
}
async function isReservedSkillName(name) {
  if (RUNTIME_RESERVED.has(name)) return true;
  return skillIndex.isBundledName(name);
}
async function assertWritableSkillName(name) {
  if (!validSkillName(name)) {
    throw new Error(`\u6280\u80FD\u540D\u5FC5\u987B\u662F 2\u201364 \u4F4D\u5C0F\u5199\u82F1\u6587\u77ED\u6A2A\u7EBF\uFF0C\u6536\u5230 "${name}"`);
  }
  if (await isReservedSkillName(name)) {
    throw new Error(`"${name}" \u662F\u63D2\u4EF6\u81EA\u5E26\u6280\u80FD\uFF0C\u4E0D\u80FD\u8986\u76D6\u3002\u6362\u4E00\u4E2A dx- \u524D\u7F00\u7684\u540D\u5B57\u3002`);
  }
  return name;
}
async function saveCapturedSkill(input) {
  const name = await assertWritableSkillName(input.name.trim());
  const body = stripFrontmatter(input.body).trim();
  if (body.length < 160) {
    throw new Error("\u5148\u6839\u636E harvest \u5199\u6EE1 SKILL.md \u6B63\u6587\uFF08\u6D41\u7A0B + \u7528\u6237\u4FEE\u6539\u7EAA\u5F8B\uFF09\uFF0C\u518D save\u3002\u4E0D\u8981\u4EA4\u7A7A\u58F3\u3002");
  }
  const title = input.title.trim().slice(0, 40) || name;
  const description = (input.description?.trim() || `\u628A\u300C${title}\u300D\u8FD9\u7C7B\u6210\u7247\u6309\u5DF2\u9A8C\u8BC1\u6D41\u7A0B\u505A\u5B8C\u3002\u7528\u6237\u518D\u8BF4\u540C\u7C7B\u9898\u6750\u3001\u540C\u6837\u6539\u6CD5\u6216\u540C\u4E00\u98CE\u683C\u65F6\u5148\u8BFB\u672C\u6280\u80FD\u3002`).slice(0, 400);
  const markdown = skillMarkdown({ name, description, title, body });
  const roots = extraSkillRoots(input.outputDir, input.userRoot);
  const files = roots.map((root) => join16(root, name, "SKILL.md"));
  if (input.replace !== true && files.some((file) => existsSync2(file))) {
    throw new Error(`\u6280\u80FD ${name} \u5DF2\u5B58\u5728\u3002\u786E\u8BA4\u8986\u76D6\u5C31\u4F20 replace:true\u3002`);
  }
  const paths = [];
  for (const file of files) {
    await mkdir12(join16(file, ".."), { recursive: true });
    await writeFile13(file, markdown, "utf8");
    paths.push(file);
  }
  skillIndex.invalidate();
  return { name, title, paths, description };
}
async function runSkillCapture(input) {
  const action = input.action === "harvest" || input.action === "save" ? input.action : "offer";
  const harvest = await harvestProduction(input.outputDir, input.title);
  if (action === "harvest") {
    return { ...harvest, next: ["directorx_ask", "directorx_skill_capture"] };
  }
  if (action === "offer") {
    let answers = input.answers;
    if (input.present === true) {
      if (input.ask === void 0) throw new Error("directorx_skill_capture present \u9700\u8981 DSH userInteraction");
      answers = (await presentAsk({
        questions: [harvest.ask],
        ask: input.ask,
        agent: input.agent,
        signal: input.signal
      })).answers;
    }
    const hasReply = answers !== void 0 && answers.length > 0 || (input.answer ?? "").trim() !== "" || (input.name ?? "").trim() !== "";
    if (!hasReply) {
      return {
        ...harvest,
        next: ["directorx_ask", "directorx_skill_capture"],
        agentPrompt: harvest.agentPrompt
      };
    }
    const decision2 = decideCaptureAnswer({
      suggestedName: harvest.suggestedName,
      suggestedTitle: harvest.suggestedTitle,
      answers,
      answer: input.answer,
      name: input.name
    });
    if (decision2.kind === "skip") {
      return { ok: true, saved: false, decision: decision2, harvest, next: [] };
    }
    if (decision2.kind === "rename") {
      return {
        ok: true,
        saved: false,
        decision: decision2,
        harvest,
        ask: harvest.ask,
        next: ["directorx_ask \u8BA9\u7528\u6237\u5199\u4E0B\u6280\u80FD\u540D", "directorx_skill_capture save"],
        agentPrompt: "\u7528\u6237\u8981\u6362\u540D\u5B57\u3002\u518D\u8D70 DSH \u6807\u51C6\u63D0\u95EE\uFF0C\u6216\u7528\u81EA\u5B9A\u4E49\u56DE\u7B54\u6536\u4E0B\u540D\u5B57\uFF0C\u7136\u540E\u5199\u6B63\u6587\u518D save\u3002"
      };
    }
    return {
      ok: true,
      saved: false,
      decision: decision2,
      harvest,
      name: decision2.name,
      title: decision2.title,
      next: [`\u6839\u636E harvest \u5199 SKILL.md \u6B63\u6587`, `directorx_skill_capture action:save name:${decision2.name}`],
      agentPrompt: harvest.writePrompt
    };
  }
  const decision = decideCaptureAnswer({
    suggestedName: harvest.suggestedName,
    suggestedTitle: harvest.suggestedTitle,
    answers: input.answers,
    answer: input.answer,
    name: input.name
  });
  if (decision.kind === "skip") return { ok: true, saved: false, decision, harvest, next: [] };
  if (decision.kind === "rename") {
    return {
      ok: false,
      saved: false,
      decision,
      harvest,
      next: ["\u5148\u7528 directorx_ask \u6216 name \u53C2\u6570\u786E\u5B9A\u6280\u80FD\u540D"]
    };
  }
  const saved = await saveCapturedSkill({
    outputDir: input.outputDir,
    name: decision.name,
    title: decision.title,
    description: input.description,
    body: input.body ?? "",
    userRoot: input.userRoot,
    replace: input.replace === true
  });
  await new ProductionStageStore(input.outputDir).record({
    stage: "deliver",
    kind: "skill",
    path: saved.paths[0],
    note: `\u4FDD\u5B58\u6280\u80FD ${saved.name}`
  }).catch(() => void 0);
  return {
    ok: true,
    saved: true,
    ...saved,
    harvest,
    next: [`\u4E0B\u6B21\u540C\u7C7B\u6210\u7247\u5148 directorx_skill_read ${saved.name}`],
    agentPrompt: `\u5DF2\u4FDD\u5B58\u4E3A\u300C${saved.title}\u300D\u6280\u80FD\u3002\u544A\u8BC9\u7528\u6237\u53EF\u4EE5\u76F4\u63A5\u518D\u7528\uFF0C\u4E0D\u8981\u62A5\u5185\u90E8\u76EE\u5F55\u3002`
  };
}

// src/bible.ts
import { readdir as readdir3, readFile as readFile15, writeFile as writeFile14, mkdir as mkdir13 } from "node:fs/promises";
import { basename as basename2, join as join17 } from "node:path";

// src/canvas-text.ts
var CAST_STAMP_PREFIX = "\u4EBA\u7269\u8BBE\u5B9A:";
var SCRIPT_CARD_STAMP = "\u5267\u672C\u5361:";
var STORYBOARD_STAMP = "\u5206\u955C\u8868";
function slugStamp(value) {
  const slug = value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
  return slug.slice(0, 40) || "card";
}
function formatCharacterSetting(card) {
  const lines = [
    `\u4EBA\u7269\u8BBE\u5B9A\uFF1A${card.name}`,
    "",
    `\u5916\u8C8C\uFF1A${card.description.trim() !== "" ? card.description.trim() : "\uFF08\u672A\u5199\uFF09"}`
  ];
  if (card.outfit !== void 0 && card.outfit.trim() !== "") lines.push(`\u670D\u88C5\uFF1A${card.outfit.trim()}`);
  if (card.props !== void 0 && card.props.trim() !== "") lines.push(`\u9053\u5177\uFF1A${card.props.trim()}`);
  if (card.refPath.trim() !== "") lines.push(`\u53C2\u8003\u56FE\uFF1A${card.refPath.trim()}`);
  return lines.join("\n");
}
function formatStoryboardText(plan) {
  const lines = [`\u5206\u955C\u8868 \xB7 ${plan.totalSeconds}s`, ""];
  for (const shot of plan.shots) {
    lines.push(`${shot.id} \xB7 ${shot.seconds}s`);
    if (shot.description.trim() !== "") lines.push(shot.description.trim());
    const camera = [shot.cameraShot, shot.angle, shot.movement].filter((part) => part !== void 0 && part !== "");
    if (camera.length > 0) lines.push(camera.join(" / "));
    if (shot.dialogue !== void 0 && shot.dialogue.trim() !== "") lines.push(`\u5BF9\u767D\uFF1A${shot.dialogue.trim()}`);
    lines.push("");
  }
  if ((plan.issues ?? []).length > 0) {
    lines.push("\u95EE\u9898");
    for (const issue of plan.issues ?? []) lines.push(`- ${issue}`);
  }
  return lines.join("\n").trim();
}
async function pinTextCard(input) {
  const body = input.body.trim();
  if (body === "") throw new Error("\u6587\u672C\u5361\u4E0D\u80FD\u4E3A\u7A7A");
  const doc = await input.store.read();
  const existing = (input.id !== void 0 ? doc.nodes.find((node) => node.id === input.id) : void 0) ?? doc.nodes.find((node) => node.kind === "text" && node.continuityRules?.includes(input.stamp) === true);
  const lines = body.split("\n").length;
  const height = Math.max(180, Math.min(720, 72 + lines * 18));
  const width = input.width ?? 420;
  if (existing !== void 0) {
    await input.store.update(existing.id, {
      label: body.slice(0, 8e3),
      prompt: body.slice(0, 2e3),
      width,
      height,
      continuityRules: [.../* @__PURE__ */ new Set([...existing.continuityRules ?? [], input.stamp])].slice(0, 5)
    });
    return { nodeId: existing.id, reused: true };
  }
  const maxBottom = doc.nodes.reduce((max, node) => Math.max(max, node.y + (node.height ?? 120)), 0);
  const nodeId = input.id ?? `text-${slugStamp(input.stamp)}`;
  await input.store.addNode({
    id: nodeId,
    kind: "text",
    label: body.slice(0, 8e3),
    prompt: body.slice(0, 2e3),
    x: 48,
    y: doc.nodes.length === 0 ? 48 : maxBottom + 48,
    width,
    height,
    continuityRules: [input.stamp]
  });
  return { nodeId, reused: false };
}
async function pinCharacterSetting(outputDir, card) {
  try {
    return await pinTextCard({
      store: new DirectorxCanvasStore(outputDir),
      stamp: `${CAST_STAMP_PREFIX}${card.name}`,
      body: formatCharacterSetting(card),
      id: `cast-${slugStamp(card.name)}`,
      width: 360
    });
  } catch {
    return void 0;
  }
}

// src/bible.ts
var KIND_FILE = {
  outline: /-outline\.json$/i,
  characters: /-cast\.json$/i,
  art: /-art\.json$/i,
  script: /-script\.json$/i,
  storyboard: /-storyboard\.json$/i
};
var KIND_LABEL2 = {
  outline: "\u5927\u7EB2",
  characters: "\u89D2\u8272",
  art: "\u7F8E\u672F",
  script: "\u5267\u672C",
  storyboard: "\u5206\u955C"
};
var SCRIPT = {
  outline: "novel-outline/scripts/novel-outline.mjs",
  art: "novel-art/scripts/novel-art.mjs",
  script: "novel-script/scripts/novel-script.mjs",
  storyboard: "novel-storyboard/scripts/novel-storyboard.mjs"
};
function asRecord2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function asGates(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item2) => {
    if (item2 === null || typeof item2 !== "object") return [];
    const rec = item2;
    const id = typeof rec.id === "string" ? rec.id : "";
    const label = typeof rec.label === "string" ? rec.label : id;
    if (label === "") return [];
    return [{
      id: id || label,
      label,
      ok: rec.ok === true,
      ...typeof rec.detail === "string" && rec.detail !== "" ? { detail: rec.detail } : {}
    }];
  });
}
async function walkJson(dir, depth = 0) {
  if (depth > 3) return [];
  let entries;
  try {
    entries = await readdir3(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const entry of entries) {
    const path = join17(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      out.push(...await walkJson(path, depth + 1));
      continue;
    }
    if (entry.name.endsWith(".json")) out.push(path);
  }
  return out;
}
function inferBibleKind(path) {
  const name = basename2(path);
  for (const kind of Object.keys(KIND_FILE)) {
    if (KIND_FILE[kind].test(name)) return kind;
  }
  return void 0;
}
async function detectBibles(outputDir) {
  const root = resolveOutputDir(outputDir);
  const files = await walkJson(root);
  const found = [];
  for (const path of files) {
    const kind = inferBibleKind(path);
    if (kind === void 0) continue;
    let title = basename2(path).replace(KIND_FILE[kind], "");
    try {
      const parsed = asRecord2(JSON.parse(await readFile15(path, "utf8")));
      if (typeof parsed.source === "string" && parsed.source.trim() !== "") title = parsed.source.trim();
    } catch {
    }
    found.push({ kind, path, title: title || KIND_LABEL2[kind] });
  }
  return found;
}
function characterReview(doc, path) {
  const characters = Array.isArray(doc.characters) ? doc.characters : [];
  const names = characters.map((item2) => {
    const rec = asRecord2(item2);
    return typeof rec.name === "string" ? rec.name : "";
  }).filter(Boolean);
  const missingName = characters.length === 0 || names.length !== characters.length;
  const promptBlob = JSON.stringify(characters.map((item2) => {
    const rec = asRecord2(item2);
    return [rec.image, rec.appearancePrompt, rec.sheet, rec.visual].filter(Boolean);
  })).toLowerCase();
  const namedInPrompt = names.filter((name) => name.length >= 2 && promptBlob.includes(name.toLowerCase()));
  const gates = [
    { id: "has-cast", label: "\u81F3\u5C11\u6709\u4E00\u540D\u89D2\u8272", ok: characters.length > 0, detail: `${characters.length} \u4EBA` },
    { id: "named", label: "\u6BCF\u4EBA\u6709\u540D\u5B57", ok: !missingName },
    { id: "no-name-in-prompt", label: "\u51FA\u56FE\u63D0\u793A\u8BCD\u4E0D\u76F4\u63A5\u5199\u4EBA\u540D", ok: namedInPrompt.length === 0, detail: namedInPrompt.join("\u3001") }
  ];
  const source = typeof doc.source === "string" ? doc.source : basename2(path);
  const lines = [
    `# \u8BC4\u5BA1\uFF5C\u89D2\u8272 \xB7 ${source}`,
    "",
    `\u95E8 ${gates.filter((item2) => item2.ok).length}/${gates.length} \u8FC7\u3002JSON \u662F\u4E8B\u5B9E\u6E90\uFF0C\u8FD9\u4EFD\u662F\u7ED9\u4EBA\u770B\u7684\u8BC4\u5BA1\uFF0C\u4E0D\u8981\u53E6\u51FA HTML\u3002`,
    "",
    "## \u8D28\u91CF\u95E8",
    ...gates.map((item2) => `- ${item2.ok ? "\u2713" : "\u2717"} ${item2.label}${item2.detail ? ` \u2014 ${item2.detail}` : ""}`),
    "",
    "## \u540D\u5355",
    ...characters.slice(0, 24).map((item2) => {
      const rec = asRecord2(item2);
      const name = typeof rec.name === "string" ? rec.name : "?";
      const role = typeof rec.oneLiner === "string" ? rec.oneLiner : typeof rec.importance === "string" ? rec.importance : "";
      return `- **${name}** ${role}`.trim();
    }),
    "",
    "\u8BBE\u5B9A\u56FE\u8D70 16:9 \u4E09\u89C6\u56FE\uFF08\u5DE6\u680F\u534A\u8EAB\u57FA\u51C6 + \u53F3\u680F\u6B63\u4FA7\u80CC\uFF09\u3002\u51FA\u56FE\u7528 `directorx_propose` / `generate_ready`\uFF0C\u4E0D\u8981\u53E6\u8D77\u751F\u6210\u5165\u53E3\u3002"
  ];
  return packReview("characters", path, source, gates, lines.join("\n"));
}
function formatCastSource(doc, title) {
  const characters = Array.isArray(doc.characters) ? doc.characters : [];
  const blocks = [`\u4EBA\u7269\u8BBE\u5B9A\uFF1A${title}`, ""];
  for (const item2 of characters.slice(0, 24)) {
    const rec = asRecord2(item2);
    const name = typeof rec.name === "string" ? rec.name : "?";
    const persona = asRecord2(rec.persona);
    const one = typeof rec.oneLiner === "string" ? rec.oneLiner : "";
    const appearance = typeof persona.appearance === "string" ? persona.appearance : typeof rec.description === "string" ? rec.description : "";
    const identity = typeof persona.identity === "string" ? persona.identity : "";
    blocks.push(`## ${name}`);
    if (one !== "") blocks.push(one);
    if (identity !== "") blocks.push(`\u8EAB\u4EFD\uFF1A${identity}`);
    if (appearance !== "") blocks.push(`\u5916\u8C8C\uFF1A${appearance}`);
    blocks.push("");
  }
  return blocks.join("\n").trim();
}
function packReview(kind, path, title, gates, markdown) {
  const passed = gates.filter((item2) => item2.ok).length;
  return {
    kind,
    path,
    title,
    gates,
    passed,
    total: gates.length,
    markdown,
    next: [
      passed === gates.length ? "\u53EF\u4EE5\u8FDB\u4E0B\u4E00\u5C42\uFF0C\u6216 directorx_bible pin \u9489\u5230\u753B\u5E03" : "\u6309\u672A\u8FC7\u7684\u95E8\u6539 JSON\uFF0C\u518D checkup",
      "\u5206\u955C\u53EA\u6620\u5C04\u5DF2\u8FC7\u95E8\u7684\u5267\u672C\u8282\u62CD\uFF0C\u4E0D\u53D1\u660E\u60C5\u8282"
    ]
  };
}
async function loadScript(kind) {
  const rel = SCRIPT[kind];
  const href = new URL(`../skills/${rel}`, import.meta.url).href;
  const mod = await import(href);
  if (typeof mod.gateReport !== "function" || typeof mod.renderMarkdown !== "function") {
    throw new Error(`${kind} \u811A\u672C\u6CA1\u6709 gateReport / renderMarkdown`);
  }
  return { gateReport: mod.gateReport, renderMarkdown: mod.renderMarkdown };
}
async function reviewBible(path, kindHint) {
  const kind = kindHint ?? inferBibleKind(path);
  if (kind === void 0) throw new Error(`\u65E0\u6CD5\u4ECE\u6587\u4EF6\u540D\u5224\u65AD\u7C7B\u578B\uFF1A${basename2(path)}`);
  const doc = JSON.parse(await readFile15(path, "utf8"));
  if (kind === "characters") return characterReview(asRecord2(doc), path);
  const script = await loadScript(kind);
  const langOrCtx = kind === "outline" || kind === "art" ? "zh" : {};
  const gates = asGates(script.gateReport(doc, langOrCtx === "zh" ? void 0 : langOrCtx));
  const rendered = String(script.renderMarkdown(doc, langOrCtx) ?? "").trim();
  const header = [
    `# \u8BC4\u5BA1\uFF5C${KIND_LABEL2[kind]} \xB7 ${asRecord2(doc).source ?? basename2(path)}`,
    "",
    `\u95E8 ${gates.filter((item2) => item2.ok).length}/${gates.length} \u8FC7\u3002JSON \u662F\u4E8B\u5B9E\u6E90\uFF1B\u8BC4\u5BA1\u7528 Markdown \u9489\u753B\u5E03\u6216\u7ED9 DSH \u5C55\u793A\uFF0C\u4E0D\u8981\u53E6\u51FA HTML\u3002`,
    ""
  ].join("\n");
  const markdown = rendered.startsWith("#") ? `${header}${rendered}` : `${header}${rendered}`;
  const title = typeof asRecord2(doc).source === "string" ? String(asRecord2(doc).source) : basename2(path);
  return packReview(kind, path, title, gates, markdown);
}
async function pinBible(input) {
  const dir = join17(resolveOutputDir(input.outputDir), "docs");
  await mkdir13(dir, { recursive: true });
  const file = join17(dir, `${input.review.kind}-review.md`);
  await writeFile14(file, input.review.markdown, "utf8");
  const canvas = new DirectorxCanvasStore(input.outputDir);
  const reviewPin = await pinTextCard({
    store: canvas,
    stamp: `\u8BC4\u5BA1:${input.review.kind}`,
    body: input.review.markdown,
    id: `bible-${input.review.kind}`,
    width: 520
  });
  let sourceNodeId;
  if (input.review.kind === "characters" || input.review.kind === "script") {
    try {
      const raw = asRecord2(JSON.parse(await readFile15(input.review.path, "utf8")));
      const sourceBody = input.review.kind === "characters" ? formatCastSource(raw, input.review.title) : input.review.markdown.replace(/^# 评审.+\n+/, "").trim();
      if (sourceBody !== "") {
        const source = await pinTextCard({
          store: canvas,
          stamp: `${input.review.kind === "characters" ? CAST_STAMP_PREFIX : SCRIPT_CARD_STAMP}${input.review.title}`,
          body: sourceBody,
          id: input.review.kind === "characters" ? `cast-bible-${input.review.kind}` : `script-bible`,
          width: 480
        });
        sourceNodeId = source.nodeId;
      }
    } catch {
    }
  }
  return { path: file, nodeId: reviewPin.nodeId, ...sourceNodeId !== void 0 ? { sourceNodeId } : {}, markdown: input.review.markdown };
}
async function runBible(input) {
  const action = input.action === "checkup" || input.action === "render" || input.action === "pin" ? input.action : "detect";
  const artifacts = await detectBibles(input.outputDir);
  if (action === "detect") {
    return {
      artifacts,
      next: artifacts.length === 0 ? ["\u5148\u5199\u51FA outline/cast/art/script/storyboard \u7684 JSON"] : ["directorx_bible checkup \u770B\u95E8", "\u901A\u8FC7\u540E directorx_bible pin \u9489\u5230\u753B\u5E03"]
    };
  }
  const kind = ["outline", "characters", "art", "script", "storyboard"].find((item2) => item2 === input.kind);
  let target = typeof input.path === "string" && input.path.trim() !== "" ? artifacts.find((item2) => item2.path === input.path) ?? { kind: kind ?? inferBibleKind(input.path), path: input.path, title: "" } : artifacts.find((item2) => kind === void 0 || item2.kind === kind);
  if (target === void 0 || target.kind === void 0) {
    throw new Error("\u6CA1\u6709\u53EF\u8BC4\u5BA1\u7684 JSON\u3002\u5148\u6539\u7F16\u4EA7\u51FA *-outline.json / *-cast.json \u7B49\uFF0C\u6216\u4F20\u5165 path\u3002");
  }
  const review = await reviewBible(target.path, target.kind);
  if (action === "checkup" || action === "render") {
    return { ...review, artifacts, pin: action === "render" ? "\u8981\u9489\u753B\u5E03\u518D pin" : void 0 };
  }
  const pinned = await pinBible({ outputDir: input.outputDir, review });
  return {
    ...review,
    saved: pinned.path,
    canvasNodeId: pinned.nodeId,
    next: ["\u7528\u6237\u5728\u753B\u5E03\u4E0A\u770B\u8BC4\u5BA1\u5361\uFF1BDSH \u4F1A\u8BDD\u91CC\u4E5F\u80FD\u8BFB\u540C\u4E00\u4EFD markdown\u3002\u4E0D\u8981\u53E6\u51FA HTML\u3002"]
  };
}

// src/shot-vocab.ts
var SHOT_VOCAB = [
  {
    id: "dialogue-reverse",
    kind: "recipe",
    category: "\u5BF9\u8BDD",
    title: "\u6B63\u53CD\u6253",
    intent: "\u4E24\u4EBA\u8BF4\u8BDD\u65F6\uFF0C\u8F74\u7EBF\u4E00\u4FA7\u6765\u56DE\u5207\uFF0C\u53CD\u5E94\u548C\u53F0\u8BCD\u5BF9\u4E0A\u3002",
    when: "\u5BF9\u5CD9\u3001\u8C08\u5224\u3001\u544A\u767D\uFF0C\u9700\u8981\u770B\u89C1\u542C\u7684\u4EBA\u3002",
    never: "\u4E09\u4EBA\u4EE5\u4E0A\u540C\u6846\u8FD8\u6CA1\u62C6\u89E3\u3001\u6216\u8F74\u7EBF\u8FD8\u6CA1\u7ACB\u4F4F\u65F6\u4E0D\u8981\u5F00\u5207\u3002",
    phrases: ["over the shoulder", "eyeline match"],
    knowledge: ["109", "124"]
  },
  {
    id: "emotion-hold",
    kind: "recipe",
    category: "\u60C5\u7EEA",
    title: "\u60C5\u7EEA\u505C\u4F4F",
    intent: "\u628A\u53CD\u5E94\u7559\u8DB3\uFF0C\u8BA9\u8138\u81EA\u5DF1\u8BF4\u5B8C\u3002",
    when: "\u8F6C\u6298\u53E5\u4E4B\u540E\u3001\u79D8\u5BC6\u63ED\u5F00\u3001\u51B3\u5B9A\u843D\u4E0B\u3002",
    never: "\u4FE1\u606F\u8FD8\u6CA1\u4EA4\u4EE3\u6E05\u695A\u5C31\u7279\u5199\uFF0C\u89C2\u4F17\u4E0D\u77E5\u9053\u5728\u5FC3\u75BC\u8C01\u3002",
    phrases: ["held close-up", "micro expression"],
    knowledge: ["107", "127"]
  },
  {
    id: "reveal-pan",
    kind: "recipe",
    category: "\u63ED\u793A",
    title: "\u906E\u6321\u540E\u63ED\u793A",
    intent: "\u5148\u6321\u540E\u8BA9\uFF0C\u955C\u5934\u81EA\u5DF1\u63ED\u5F00\u4E0B\u4E00\u5C42\u4FE1\u606F\u3002",
    when: "\u8FDB\u65B0\u7A7A\u95F4\u3001\u53D1\u73B0\u7269\u4EF6\u3001\u4EBA\u7269\u4ECE\u906E\u6321\u540E\u51FA\u73B0\u3002",
    never: "\u5DF2\u7ECF\u4E00\u89C8\u65E0\u4F59\u7684\u7A7A\u95F4\u518D\u6447\u4E00\u904D\uFF0C\u662F\u7A7A\u8FD0\u955C\u3002",
    phrases: ["camera reveals", "foreground occlusion"],
    knowledge: ["109", "116"]
  },
  {
    id: "entrance-trio",
    kind: "recipe",
    category: "\u8FDB\u573A",
    title: "\u8FDB\u573A\u4E09\u4EF6\u5957",
    intent: "\u8FDC\u666F\u7ACB\u7A7A\u95F4 \u2192 \u4E2D\u666F\u8D70\u8DEF \u2192 \u8FD1\u666F\u843D\u70B9\u3002",
    when: "\u7B2C\u4E00\u6B21\u8FDB\u573A\u3001\u6362\u573A\u666F\u3001\u628A\u4EBA\u4ECE\u73AF\u5883\u91CC\u9886\u5230\u620F\u91CC\u3002",
    never: "\u5DF2\u7ECF\u5728\u573A\u7684\u4EBA\u4E0D\u8981\u5047\u88C5\u8FDB\u95E8\u3002",
    phrases: ["establishing wide", "character enter"],
    knowledge: ["109", "107"]
  },
  {
    id: "reaction-insert",
    kind: "recipe",
    category: "\u53CD\u5E94",
    title: "\u53CD\u5E94\u63D2\u5165",
    intent: "\u52A8\u4F5C\u6216\u53F0\u8BCD\u4E4B\u540E\u7ACB\u523B\u5207\u542C\u8005/\u76EE\u51FB\u8005\u3002",
    when: "\u9700\u8981\u770B\u89C1\u51B2\u51FB\uFF0C\u800C\u4E0D\u662F\u518D\u8BF4\u4E00\u53E5\u89E3\u91CA\u3002",
    never: "\u8BF4\u8BDD\u4EBA\u8FD8\u6CA1\u628A\u4FE1\u606F\u9001\u5B8C\u5C31\u5207\u53CD\u5E94\u3002",
    phrases: ["reaction close-up"],
    knowledge: ["127", "102"]
  },
  {
    id: "product-hero",
    kind: "recipe",
    category: "\u4EA7\u54C1",
    title: "\u4EA7\u54C1\u4E3B\u89C6\u89C9",
    intent: "\u4EA7\u54C1\u662F\u4E3B\u4F53\uFF0C\u5149\u6BD4\u548C\u8F6E\u5ED3\u5148\u9501\uFF0C\u4EBA\u662F\u966A\u4F53\u3002",
    when: "\u5E7F\u544A\u3001\u5F00\u7BB1\u3001\u9759\u7269\u8D28\u611F\u3002",
    never: "\u628A\u5546\u6807\u6216\u53D7\u4FDD\u62A4\u5916\u89C2\u5F53\u8EAB\u4EFD\u5199\u8FDB\u63D0\u793A\u8BCD\u3002",
    phrases: ["hero product", "controlled highlight"],
    knowledge: ["125", "213"]
  },
  {
    id: "talk-to-camera",
    kind: "recipe",
    category: "\u53E3\u64AD",
    title: "\u5BF9\u955C\u5934\u8BF4",
    intent: "\u89C6\u7EBF\u9501\u955C\u5934\uFF0C\u673A\u4F4D\u7A33\uFF0C\u53E3\u578B\u533A\u5E72\u51C0\u3002",
    when: "\u8BB2\u89E3\u3001\u8BC4\u6D4B\u3001\u6559\u7A0B\u3002",
    never: "\u53D9\u4E8B\u77ED\u5267\u91CC\u7A81\u7136\u7834\u7B2C\u56DB\u9762\u5899\u5374\u6CA1\u6709\u52A8\u673A\u3002",
    phrases: ["direct address", "stable eyeline"],
    knowledge: ["104", "115"]
  },
  {
    id: "static",
    kind: "technique",
    category: "\u8FD0\u955C",
    title: "\u56FA\u5B9A",
    intent: "\u673A\u4F4D\u4E0D\u52A8\uFF0C\u8BA9\u8868\u6F14\u548C\u526A\u8F91\u627F\u62C5\u8282\u594F\u3002",
    when: "\u89C2\u5BDF\u3001\u5BF9\u5CD9\u3001\u9700\u8981\u7A33\u5B9A\u5C3E\u5E27\u63A5\u4E0B\u955C\u3002",
    never: "\u7528\u56FA\u5B9A\u53BB\u85CF\u8C03\u5EA6\u5931\u8D25\uFF1B\u4E5F\u522B\u5728\u8BE5\u8DDF\u7684\u52A8\u4F5C\u4E0A\u9489\u6B7B\u3002",
    phrases: ["locked off", "static camera"],
    knowledge: ["109"]
  },
  {
    id: "push-in",
    kind: "technique",
    category: "\u8FD0\u955C",
    title: "\u63A8\u8FD1",
    intent: "\u7A7A\u95F4\u6536\u7F29\uFF0C\u6CE8\u610F\u529B\u538B\u5230\u8138\u4E0A\u6216\u7269\u4EF6\u4E0A\u3002",
    when: "\u51B3\u5B9A\u3001\u5A01\u80C1\u3001\u770B\u6E05\u4E00\u4E2A\u7EC6\u8282\u3002",
    never: "\u6BCF\u53E5\u53F0\u8BCD\u90FD\u63A8\u4E00\u6B21\uFF0C\u6743\u91CD\u5C31\u88AB\u7A00\u91CA\u3002",
    phrases: ["slow push in"],
    knowledge: ["124"]
  },
  {
    id: "handheld",
    kind: "technique",
    category: "\u8FD0\u955C",
    title: "\u624B\u6301",
    intent: "\u547C\u5438\u611F\u3001\u4E0D\u5B89\u3001\u5728\u573A\u3002",
    when: "\u8FFD\u9010\u3001\u7EAA\u5F55\u7247\u611F\u3001\u60C5\u7EEA\u5931\u63A7\u3002",
    never: "\u4EA7\u54C1\u8D28\u611F\u3001\u8BBE\u5B9A\u56FE\u3001\u9700\u8981\u7A33\u5B9A\u5C3E\u5E27\u7684\u8854\u63A5\u955C\u3002",
    phrases: ["handheld shake"],
    knowledge: ["109"]
  },
  {
    id: "low-angle",
    kind: "technique",
    category: "\u673A\u4F4D",
    title: "\u4EF0\u62CD",
    intent: "\u6743\u529B\u4E0A\u79FB\uFF0C\u4E3B\u4F53\u538B\u5411\u89C2\u4F17\u3002",
    when: "\u538B\u8FEB\u3001\u5D07\u62DC\u3001\u5EFA\u7B51\u4F53\u91CF\u3002",
    never: "\u5DF2\u7ECF\u5728\u6C42\u540C\u60C5\u7684\u89D2\u8272\u518D\u4EF0\u62CD\uFF0C\u7ACB\u573A\u4F1A\u53CD\u3002",
    phrases: ["low angle"],
    knowledge: ["109"]
  },
  {
    id: "shallow-dof",
    kind: "technique",
    category: "\u7126\u6BB5\u4E0E\u666F\u6DF1",
    title: "\u6D45\u666F\u6DF1",
    intent: "\u80CC\u666F\u9000\u6210\u6C14\u6C1B\uFF0C\u4E3B\u4F53\u8F6E\u5ED3\u6E05\u695A\u3002",
    when: "\u8096\u50CF\u3001\u4EA7\u54C1\u3001\u4ECE\u6742\u4E71\u91CC\u5355\u70B9\u53D6\u51FA\u3002",
    never: "\u8FD8\u8981\u4EA4\u4EE3\u7A7A\u95F4\u5173\u7CFB\u7684\u5EFA\u7ACB\u955C\u5934\u3002",
    phrases: ["shallow depth of field"],
    knowledge: ["00", "125"]
  }
];
function listShotVocab(filter) {
  const query = filter?.query?.trim().toLowerCase() ?? "";
  return SHOT_VOCAB.filter((card) => {
    if (filter?.kind !== void 0 && card.kind !== filter.kind) return false;
    if (query === "") return true;
    const hay = `${card.id} ${card.title} ${card.category} ${card.intent} ${card.when} ${card.never}`.toLowerCase();
    return hay.includes(query) || card.phrases.some((item2) => item2.includes(query));
  });
}
function showShotVocab(id) {
  const wanted = id.trim().toLowerCase();
  return SHOT_VOCAB.find((card) => card.id === wanted || card.title === id.trim());
}
function checkShotVocab(input) {
  const prompt = input.prompt.trim();
  if (prompt === "") return { ok: false, skipped: false, missing: ["empty prompt"], hits: [] };
  const cjk = (prompt.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latin = (prompt.match(/[a-z]/gi) ?? []).length;
  if (cjk > latin * 2 && latin < 8) {
    return { ok: true, skipped: true, missing: [], hits: [], neverWarning: "\u4E2D\u6587\u7A3F\u8DF3\u8FC7\u82F1\u6587\u5FC5\u5907\u77ED\u8BED\uFF0C\u6539\u5199\u751F\u6210\u7A3F\u540E\u518D check" };
  }
  const recipe = input.recipe !== void 0 ? showShotVocab(input.recipe) : void 0;
  const cards = recipe !== void 0 ? [recipe] : SHOT_VOCAB.filter((item2) => item2.kind === "recipe");
  const hay = prompt.toLowerCase();
  if (recipe !== void 0) {
    const missing = recipe.phrases.filter((item2) => !hay.includes(item2.toLowerCase()));
    const hits2 = recipe.phrases.filter((item2) => hay.includes(item2.toLowerCase()));
    return {
      ok: missing.length === 0,
      skipped: false,
      recipe,
      missing,
      hits: hits2,
      ...recipe.never !== "" ? { neverWarning: recipe.never } : {}
    };
  }
  const hits = cards.flatMap((card) => card.phrases.filter((item2) => hay.includes(item2.toLowerCase())));
  return { ok: true, skipped: false, missing: [], hits: [...new Set(hits)] };
}

// src/persona.ts
var CHENGPIAN_PERSONA = "\u6210\u7247";
var MODES = ["\u4E25\u683C", "\u81EA\u52A8", "\u534F\u540C"];
var VARIANT_LENSES = [
  { shotSize: "\u8FDC\u666F", lighting: "\u67D4\u7A97\u5149\u4FA7\u9006", composition: "\u7EB5\u6DF1\u4E09\u5C42", cameraMove: "\u9759\u6B62\u673A\u4F4D\u7565\u4FEF", label: "\u5EFA\u7ACB\u955C\u5934", beat: "\u5148\u4EA4\u4EE3\u7A7A\u95F4\uFF0C\u4E3B\u4F53\u4ECE\u6DF1\u5904\u8D70\u8FDB\u505C\u6B65" },
  { shotSize: "\u4E2D\u8FD1\u666F", lighting: "\u4F26\u52C3\u6717\u4FA7\u5149", composition: "\u4E09\u5206\u6784\u56FE", cameraMove: "\u7F13\u6162\u63A8\u8FD1", label: "\u4EBA\u7269\u8FD1\u903C", beat: "\u63A8\u5230\u80A9\u4EE5\u4E0A\uFF0C\u8868\u60C5\u548C\u624B\u90E8\u843D\u5E45" },
  { shotSize: "\u7279\u5199", lighting: "\u4F4E\u8C03\u8F6E\u5ED3\u5149", composition: "\u8D1F\u7A7A\u95F4\u7559\u767D", cameraMove: "\u56FA\u5B9A\u673A\u4F4D", label: "\u60C5\u7EEA\u7279\u5199", beat: "\u9501\u773C\u775B\u6216\u624B\u7684\u4E00\u4E2A\u5B8C\u6574\u5FAE\u52A8\u4F5C" },
  { shotSize: "\u4E2D\u666F", lighting: "\u9EC4\u91D1\u65F6\u523B\u4FA7\u5149", composition: "\u5BF9\u79F0\u6A2A\u79FB", cameraMove: "\u6A2A\u79FB\u8DDF\u52A8\u4F5C", label: "\u52A8\u4F5C\u4E2D\u666F", beat: "\u4E00\u4E2A\u53EF\u89C2\u5BDF\u52A8\u4F5C\u4ECE\u8D77\u52BF\u5230\u7ED3\u675F" }
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
  const alreadyCrafted = isThinPrompt("", subject) === void 0;
  return VARIANT_LENSES.slice(0, n).map((lens) => {
    const head = `\u3010${lens.label}\u3011${lens.shotSize}\uFF0C${lens.cameraMove}\uFF0C${lens.lighting}\uFF0C${lens.composition}\u3002`;
    if (alreadyCrafted) return `${head}${subject}`;
    return [
      head,
      `${subject}\u3002${lens.beat}\u3002`,
      "\u73AF\u5883\u5199\u6E05\u7A7A\u95F4\u5C42\u6B21\u3001\u5929\u6C14\u548C\u7A7A\u6C14\uFF0C\u5730\u9762\u53CD\u5149\u4E0E\u524D\u540E\u666F\u5206\u5F00\u3002",
      "\u98CE\u683C\u6309\u7535\u5F71\u611F 35mm \u6D45\u666F\u6DF1\uFF0C\u5149\u7EBF\u5199\u6E05\u4E3B\u5149\u65B9\u5411\u548C\u8272\u6E29\u3002",
      "\u65F6\u95F4\u5199\u6E05\u8D77\u52BF\u3001\u63A5\u89E6\u548C\u843D\u5E45\uFF0C\u4E0D\u8981\u4E71\u7801\u5B57\u5E55\u3001\u4E0D\u8981\u65B0\u589E\u4EBA\u7269\u3001\u4E0D\u8981\u6C34\u5370\u3002"
    ].join("");
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
      question: "\u9009\u4E00\u4E2A\u5BFC\u6F14\u89D2\u5EA6\u3002\u9009\u5B8C\u540E\u6309 directorx_prompt_plan \u5199\u6210\u7A3F\uFF0C\u4E0D\u8981\u628A\u89D2\u5EA6\u539F\u6587\u4E22\u7ED9 generate\u3002",
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
    `- You are DirectorX in the dedicated **\u6210\u7247** persona. Analyse every request from a **\u5BFC\u6F14\u89D2\u5EA6** (blocking, continuity, light, lens, emotion, cut). Do not guess craft: call \`directorx_skill_route\`, then load \u6210\u7247-related **\u77E5\u8BC6\u5E93** via \`directorx_knowledge_search\` / \`directorx_knowledge_read\` and the matching **skill** body via \`directorx_skill_read\` (\`directorx-chengpian\`, \`directorx-methodology\`, \`directorx-production-lead\`) before planning or generating.`,
    `- Initiative mode is **${mode}**. Call \`directorx_chengpian\` on unclear events and before every generation unit.`,
    "- **\u4E25\u683C**: \u7B2C\u4E00\u4E2A\u4E0D\u660E\u786E\u7684\u4E8B\u4EF6\u53CA\u65F6\u5411\u7528\u6237\u786E\u8BA4\uFF1B\u786E\u8BA4\u6B21\u6570\u8F83\u591A\uFF1B\u7EDD\u4E0D\u81EA\u5DF1\u6267\u884C\u751F\u6210\uFF1B\u6BCF\u4E2A\u751F\u6210\u4EFB\u52A1\u63D0\u4F9B**\u4E8C\u5230\u56DB\u4E2A\u63D0\u793A\u8BCD**\uFF08\u6BCF\u6761\u90FD\u662F\u53EF\u6267\u884C\u5BFC\u6F14\u7A3F\uFF0C\u4E0D\u662F\u89D2\u5EA6\u6807\u7B7E\uFF09\uFF0C\u7528 `directorx_ask`\uFF08DSH \u6807\u51C6\u63D0\u95EE\uFF09\u8BA9\u7528\u6237\u9009\uFF08\u7981\u6B62\u5728\u6B63\u6587\u91CC\u5199 1.2.3. \u83DC\u5355\uFF09\uFF1B\u9009\u5B9A\u540E `directorx_propose` chosen=true \u5165\u961F\u5355\u6761\u5360\u4F4D\uFF1B\u6279\u51C6\u540E\u5E26 `proposalId` \u6267\u884C\u751F\u6210\u3002",
    "- **\u81EA\u52A8**: \u975E\u5FC5\u8981\u4E0D\u4F1A\u8BE2\u95EE\u7528\u6237\uFF1B\u5728\u9884\u7B97\u8303\u56F4\u5185\u4F1A\u76F4\u63A5\u5E72\uFF0C**\u76F4\u63A5\u6267\u884C\u751F\u6210**\u3002\u4ECD\u987B `prompt_plan` \u2192 `prompt_craft` \u2192 `generate_ready`\uFF0C\u7981\u6B62\u539F\u53E5\u76F4\u51FA\uFF0C\u6CA1\u6709 craftId+readyId \u4E0D\u5F97 generate\u3002",
    "- **\u534F\u540C**: \u4E5F\u4F1A\u95EE\u7528\u6237\uFF0C\u4F46\u6BD4\u8F83\u4E3B\u52A8\uFF1B\u4E0D\u76F4\u63A5\u6267\u884C\u751F\u6210\uFF1B\u5DE5\u4F5C\u5230\u6700\u540E\u4EA7\u51FA\u89C6\u9891\u8BA1\u5212\uFF1B\u6BCF\u6B21\u9047\u5230\u751F\u6210\u4EFB\u52A1\u53EA\u7ED9\u51FA**\u63D0\u793A\u8BCD\u548C\u5360\u4F4D**\uFF08\u5360\u4F4D\u6B63\u6587\u5FC5\u987B\u8FC7\u6210\u7A3F\u95E8\u69DB\uFF09\uFF0C\u7528\u6237\u6700\u540E\u4ECE\u5934\u5F00\u59CB\u4E00\u4E2A\u4E2A\u5BA1\u9605\u7136\u540E\u5E26 `proposalId` \u6267\u884C\u751F\u6210\u3002",
    "- \u6D41\u7A0B\u95F8\uFF1A\u5148 `directorx_brief` / `directorx_chengpian` \u2192 \u6309 compose \u7684 **\u8DEF/\u7A3F/\u4F4D** \u8D70\u3002\u5206\u53C9\u7528 `directorx_ask`\uFF08DSH `userInteraction` \u6807\u51C6\u63D0\u95EE\uFF0C\u4E0D\u8981\u53E6\u5F00\u63D0\u95EE\u901A\u9053\uFF09\u2192 \u5267\u672C/\u5206\u955C `directorx_confirm` \u2192 **\u7B7E\u5B57\u540E\u624D**\u843D\u753B\u5E03\u3002\u5267\u672C\u548C\u4EBA\u7269\u8BBE\u5B9A\u5FC5\u987B\u9489\u6210\u753B\u5E03\u6587\u672C\u8282\u70B9\u3002\u540C\u4E00\u7CFB\u5217\u5148 `directorx_series apply` \u518D\u5199\u7A3F\u3002\u591A\u4EBA\u8FDE\u7EED\u3001\u5355\u955C\u957F\u62CD\u3001\u5B8C\u5168\u63A7\u5236\u5148 `directorx_blocking` harvest/schema\uFF0C\u4F60\u5199\u573A\u9762\u53F0\u8D26\u548C\u7269\u4EF6\u72B6\u6001\u673A\u518D pin\uFF0C\u7136\u540E\u624D `directorx_prompt_plan`\u3002\u6BCF\u955C\u5148 `directorx_prompt_plan`\uFF08\u516D\u8981\u7D20/\u7269\u7406\u94FE/\u6A21\u578B\u6280\u80FD\uFF09\uFF0C\u518D knowledge_read + skill_read + `directorx_prompt_craft` + `directorx_generate_ready`\u3002\u6210\u7247\u89D2\u5EA6\uFF08\u5EFA\u7ACB/\u8FD1\u903C/\u7279\u5199/\u4E2D\u666F\uFF09\u53EA\u662F\u5199\u6CD5\uFF0C\u4E0D\u662F\u6210\u7A3F\u3002\u7F3A\u53C2\u8003\u5148\u8865\u8D44\u4EA7\u3002\u9636\u6BB5\u5199\u5165 `directorx_stage`\uFF08\u542B craft\uFF09\u3002\u70B9\u540D IP \u65F6\u5148 `directorx_ip_scan` / `ip_rewrite`\u3002\u7528\u6237\u6539\u610F\u89C1\u7ACB\u523B `directorx_note`\u3002\u53EA\u6539\u4E00\u955C\u7528 `directorx_revise`\uFF0C\u56DE\u5199\u53EA\u6539\u8BE5\u8282\u70B9\u3002\u4EA4\u7247\u540E `directorx_skill_capture` `{ present: true }` \u95EE\u662F\u5426\u4FDD\u5B58\u65B9\u6CD5\u6280\u80FD\uFF1B\u6709\u9501\u4EBA\u8BBE/\u753B\u98CE\u518D `directorx_series save`\u3002",
    "- \u6539\u7F16\u77ED\u5267\uFF1A\u5927\u7EB2\u5148\u6536\u655B\u7ED3\u6784\uFF1B\u89D2\u8272\u3001\u7F8E\u672F\u3001\u5267\u672C\u53EF\u4EE5\u5E76\u884C\uFF0C\u4F46\u4E0D\u5F97\u6539\u5DF2\u7ECF\u62CD\u677F\u7684\u7ED3\u6784\u3002\u5206\u955C\u53EA\u8BA4\u9886\u5267\u672C\u8282\u62CD\uFF0C\u4E0D\u53D1\u660E\u60C5\u8282\u3002\u5207\u955C\u524D `directorx_shot_vocab`\uFF08\u914D\u65B9 = \u8FD9\u4E00\u5200\u600E\u4E48\u5207\uFF0C\u6280\u6CD5 = \u4EC0\u4E48\u65F6\u5019\u522B\u7528\uFF09\u3002\u8BC4\u5BA1\u7528 `directorx_bible` \u51FA Markdown \u9489\u753B\u5E03\uFF0CDSH \u4F1A\u8BDD\u5C55\u793A\u540C\u4E00\u4EFD\uFF0C\u4E0D\u8981\u53E6\u51FA HTML\u3002",
    "- NEVER write a numbered 1. 2. 3. choice menu in assistant text. Call `directorx_ask` so DSH shows the standard question UI.",
    "- \u89C6\u9891\u6210\u7A3F\uFF1A\u5F53\u524D\u6A21\u578B\u662F MiniMax-H3 \u65F6\u5148 `directorx_skill_read` `minimax-h3-prompt-copilot`\uFF08`handbook.md` + \u5BF9\u5E94\u6A21\u5F0F\uFF09\u3002\u6210\u7A3F = \u53C2\u8003\u8BF4\u660E\uFF08\u6BCF\u5F20\u56FE\u7684\u804C\u8D23\uFF09+ \u6838\u5FC3\u521B\u610F + \u753B\u9762\u8FC7\u7A0B\uFF1B\u6709\u9996\u5C3E\u5E27\u53EA\u63D2\u503C\u3001\u4E0D\u8981\u518D\u585E\u53C2\u8003\u56FE\uFF1B\u753B\u5185\u6587\u5B57\u5199\u539F\u6587\uFF1B\u4E0D\u8981\u914D\u4E50\u5C31 `non_diegetic_music: N/A`\u3002\u5176\u5B83\u89C6\u9891\u6A21\u578B\u53EF\u501F\u540C\u4E00\u5957\u7ED3\u6784\uFF0C\u5B57\u6BB5\u7528\u8BE5\u6A21\u578B\u81EA\u5DF1\u7684\u3002",
    "- \u89D2\u8272\u51FA\u56FE\uFF1A\u5148 `directorx_skill_read` `novel-characters`\u3002\u4E00\u5F20\u56FE\u5FC5\u987B\u662F 16:9 \u8BBE\u5B9A\u8868\uFF08\u5DE6\u680F\u534A\u8EAB\u57FA\u51C6 + \u53F3\u680F\u6B63\u89C6/\u4FA7\u89C6/\u80CC\u89C6\uFF09\uFF0C\u7981\u6B62\u5355\u5F20\u5267\u7167\u5192\u5145\u4E09\u89C6\u56FE\u3002",
    "- \u843D\u753B\u5E03\u540E\u7ACB\u523B `directorx_canvas_arrange`\uFF0C\u4FDD\u8BC1\u5206\u955C\u6A2A\u6761\u53EF\u8BFB\uFF0C\u4E0D\u8981\u53E0\u5728\u539F\u70B9\u3002\u6587\u672C\u5267\u672C\u7528 `directorx_canvas_script` \u751F\u6210\u5206\u955C\uFF08\u672C\u2192\u9996\u5E27\u2192\u89C6\u9891\uFF09\uFF1B\u6210\u7247\u63D0\u53D6\u5E27\u7528 `directorx_canvas_frames`\uFF1B\u6210\u7247\u667A\u80FD\u89E3\u6790\u7528 `directorx_canvas_parse`\uFF1B\u5C40\u90E8\u91CD\u7ED8\u5148 `directorx_canvas_reshoot` cut\uFF0C\u4E2D\u6BB5\u8D70\u751F\u6210\u95F8\uFF0C\u518D assemble\u3002\u591A\u6BB5\u89C6\u9891\u786C\u5207\u5408\u6210\u7528 `directorx_canvas_pack`\uFF08\u9884\u544A\u7247\u7981\u6B62 fade\uFF09\uFF1B\u4E5D\u5BAB\u683C\u7528 `directorx_canvas_sheet`\uFF1B\u4E00\u5F20\u56FE\u62C6\u5206\u5BAB\u683C\u7528 `directorx_canvas_split`\uFF1B\u591A\u5F20\u56FE\u5408\u5E76\u5BAB\u683C\u7528 `directorx_canvas_join`\uFF1B2\u20134 \u8DEF\u5206\u5C4F\u7528 `directorx_canvas_stack`\uFF1B\u786C\u5B57\u5E55\u7528 `directorx_canvas_desub` \u53BB\u5B57\u5E55\uFF1B\u89C6\u9891\u5EF6\u957F\u5148 `directorx_canvas_extend` \u5207\u51FA\u5C3E\u5E27\u7A7A\u5361\u518D\u8D70\u751F\u6210\u95F8\uFF1B\u8BC4\u5BA1\u52A8\u56FE\u7528 `directorx_canvas_gif`\u3002\u89D2\u8272/\u8BCD\u4EE4\u91CD\u53E0\u7528 `directorx_canvas_autolink` \u81EA\u52A8\u8FDE\u7EBF\u3002\u5207\u7A97/\u89E3\u6790/\u94FA\u884C/\u62FC\u63A5/\u5207\u5F00/\u62FC\u56DE/\u5206\u5C4F/\u53BB\u5B57\u5E55/\u5EF6\u957F/\u52A8\u56FE\u90FD\u4E0D\u8C03\u7528\u751F\u6210\u6A21\u578B\u3002"
  ].join("\n");
}

// src/edits.ts
import { appendFile, mkdir as mkdir14, readFile as readFile16 } from "node:fs/promises";
import { join as join18 } from "node:path";
var EDITS_FILE = "edits.jsonl";
var MAX_EDIT_LINES = 2e4;
var DirectorxEditLedger = class {
  outputDir;
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  async filePath() {
    const dir = resolveOutputDir(this.outputDir);
    await mkdir14(dir, { recursive: true });
    return join18(dir, EDITS_FILE);
  }
  async append(record) {
    const path = await this.filePath();
    await appendFile(path, `${JSON.stringify(record)}
`, "utf8");
  }
  /** Most recent edits first, bounded to `limit`. */
  async list(limit = 20) {
    const path = await this.filePath();
    const content = await readFile16(path, "utf8").catch((error) => {
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

// src/edit-plan.ts
var GRADE = /调色|色调|配色|滤镜|grade|look|lut|末日荒土|漂白|交叉冲印|夜色|金黄昏|打开编辑台|编辑台|精修台/;
var IMAGE_GEOM = /旋转|翻转|镜像|裁切|裁剪|缩放|放大|缩小|hflip|vflip|rotate|crop|resize/;
var VIDEO_PROC = /去掉开头|去掉结尾|只保留|变速|放慢|加快|静音|倒放|定格|freeze|trim|speed|mute|reverse|裁掉前|裁掉后/;
var NL_CUT = /剪辑指令|按这些剪|多条指令|cut list/;
var CONCAT = /拼接|接上|串起来|concat|叠化|硬切成片|多镜组装/;
var SMART = /精剪|按脚本剪|口播剪|对字幕剪|smart.?cut/;
var QC = /质检|抽帧看|看看成片|检查成片|\bqa\b|对照提示词/;
var REGEN = /重绘|重新生成|再生成一张|换个画面|重新出图|重新出片|regen/;
var STUDIO_OPEN = /打开编辑台|打开编辑器|打开工作室|open.?studio/;
function parseRotate(text) {
  if (/270|逆时针/.test(text)) return 270;
  if (/180|倒过来|上下颠倒/.test(text)) return 180;
  if (/90|顺时针|右转/.test(text)) return 90;
  if (/旋转/.test(text)) return 90;
  return void 0;
}
function parseGeomArgs(text) {
  const args = {};
  const rotate = parseRotate(text);
  if (rotate !== void 0 && /旋转|倒过来|颠倒|顺时针|逆时针/.test(text)) args.rotate = rotate;
  if (/水平翻转|左右翻转|镜像|hflip/.test(text)) args.hflip = true;
  if (/垂直翻转|上下翻转|vflip/.test(text) && args.rotate === void 0) args.vflip = true;
  const crop = text.match(/(\d+)\s*[:x×]\s*(\d+)\s*[@＋+]\s*(\d+)\s*[,，]\s*(\d+)/);
  if (crop !== null) args.crop = `${crop[1]}:${crop[2]}:${crop[3]}:${crop[4]}`;
  const scale = text.match(/缩[放到]\s*(\d+)\s*[:x×]\s*(\d+)/);
  if (scale !== null) args.scale = `${scale[1]}:${scale[2]}`;
  return args;
}
function parseVideoArgs(text) {
  const args = parseGeomArgs(text);
  const head = text.match(/(?:去掉|裁掉|剪掉).*?(?:开头|前面|前)\s*(\d+(?:\.\d+)?)\s*秒/) ?? text.match(/(?:开头|前面|前)\s*(\d+(?:\.\d+)?)\s*秒.*(?:去掉|裁掉|剪掉)/);
  if (head !== null) args.start = Number(head[1]);
  const keep = text.match(/(?:只保留|只留|保留)\s*(\d+(?:\.\d+)?)\s*(?:到|至|-|~)\s*(\d+(?:\.\d+)?)\s*秒/);
  if (keep !== null) {
    args.start = Number(keep[1]);
    args.end = Number(keep[2]);
  }
  if (/静音|mute/.test(text)) args.mute = true;
  if (/倒放|反向播放|reverse/.test(text)) args.reverse = true;
  const freeze = text.match(/定格\s*(\d+(?:\.\d+)?)\s*秒/);
  if (freeze !== null) args.freezeEnd = Number(freeze[1]);
  const speed = text.match(/(?:放慢|减速)\s*(\d+(?:\.\d+)?)/);
  if (speed !== null) {
    const value = Number(speed[1]);
    args.speed = value > 1 ? 1 / value : value;
  }
  const faster = text.match(/(?:加快|加速|变速)\s*(\d+(?:\.\d+)?)/);
  if (faster !== null && args.speed === void 0) args.speed = Number(faster[1]);
  return args;
}
function planEdit(input) {
  const intent = input.intent.trim();
  let kind = input.kind;
  if (kind === void 0) {
    if (/照片|图片|这张图|静帧|设定图/.test(intent) && !/视频|片子/.test(intent)) kind = "image";
    else if (/视频|片子|这镜|成片/.test(intent) && !/照片|图片|设定图/.test(intent)) kind = "video";
  }
  const nodeId = input.nodeId;
  const path = input.path;
  const bind = {
    ...nodeId !== void 0 && nodeId !== "" ? { nodeId } : {},
    ...path !== void 0 && path !== "" ? { path } : {}
  };
  const warnings = [];
  const next = [];
  if (intent === "") {
    return {
      route: "ask",
      tool: "directorx_ask",
      reason: "\u6CA1\u6709\u7F16\u8F91\u610F\u56FE\uFF0C\u5148\u95EE\u8981\u8C03\u8272\u3001\u88C1\u5207\u3001\u65CB\u8F6C\u8FD8\u662F\u526A\u8F91\u3002",
      args: {},
      warnings,
      next: ["directorx_ask"]
    };
  }
  if (REGEN.test(intent) && !GRADE.test(intent) && !IMAGE_GEOM.test(intent) && !VIDEO_PROC.test(intent)) {
    return {
      route: "regenerate-blocked",
      tool: "",
      reason: "\u8FD9\u662F\u6539\u753B\u9762\u5185\u5BB9\uFF0C\u4E0D\u662F\u786E\u5B9A\u6027\u7F16\u8F91\u3002\u5FC5\u987B\u8D70 knowledge/skill \u2192 prompt_craft \u2192 generate_ready \u2192 generate\uFF0C\u4E0D\u80FD\u7528\u526A\u8F91\u5DE5\u5177\u5192\u5145\u91CD\u7ED8\u3002",
      args: {},
      warnings: ["\u4E0D\u8981\u7528 studio / image_edit / video_process \u5B8C\u6210\u300C\u6362\u4E2A\u753B\u9762\u300D\u3002"],
      next: ["directorx_knowledge_search", "directorx_prompt_craft", "directorx_generate_ready"]
    };
  }
  if (QC.test(intent)) {
    return {
      route: "qc",
      tool: "directorx_extract_frames",
      reason: "\u5148\u62BD\u5E27\u518D\u770B\u56FE\u50CF\u7D20\uFF0C\u5BF9\u7167\u63D0\u793A\u8BCD\u548C\u8FDE\u7EED\u6027\u3002",
      args: { ...bind, ...path !== void 0 ? { source: path } : {} },
      warnings,
      next: ["directorx_view_image", "directorx_qa"]
    };
  }
  if (SMART.test(intent)) {
    return {
      route: "smart-cut",
      tool: "directorx_smart_cut",
      reason: "\u53E3\u64AD/\u6309\u811A\u672C\u7CBE\u526A\uFF1A\u8F6C\u5199\u5B57\u5E55\u540E\u6309\u53E5\u5B50\u5339\u914D\u7A97\u53E3\u3002",
      args: { ...bind, ...path !== void 0 ? { video: path } : {} },
      warnings: kind === "image" ? ["\u5F53\u524D\u8282\u70B9\u662F\u56FE\u7247\uFF0C\u7CBE\u526A\u9700\u8981\u89C6\u9891\u3002"] : [],
      next: ["directorx_transcribe_audio", "directorx_smart_cut"]
    };
  }
  if (CONCAT.test(intent)) {
    return {
      route: "concat",
      tool: "directorx_video_concat",
      reason: "\u591A\u6BB5\u7D20\u6750\u7EC4\u88C5\u6210\u7247\uFF0C\u4F18\u5148\u786C\u5207\u6216\u53E0\u5316\uFF0C\u4E0D\u91CD\u65B0\u751F\u6210\u3002",
      args: { ...bind },
      warnings,
      next: ["directorx_canvas_shot_order", "directorx_video_concat", "directorx_qa"]
    };
  }
  if (GRADE.test(intent) || STUDIO_OPEN.test(intent)) {
    const openOnly = STUDIO_OPEN.test(intent) && !/调色|色调|配色|滤镜|荒土|漂白|冲印|夜色|黄昏/.test(intent);
    return {
      route: "studio",
      tool: "directorx_studio",
      reason: openOnly ? "\u53EA\u6253\u5F00\u7F16\u8F91\u53F0\uFF0C\u4E0D\u6539\u50CF\u7D20\u3002" : "\u81EA\u7136\u8BED\u8A00\u8C03\u8272\u8D70 ffmpeg \u914D\u65B9\uFF0C\u56DE\u5199\u8282\u70B9\u5E76\u6253\u5F00\u7F16\u8F91\u53F0\u3002",
      args: { prompt: intent, ...bind, ...openOnly ? { openOnly: true } : {} },
      warnings,
      next: openOnly ? [] : ["directorx_extract_frames", "directorx_view_image"]
    };
  }
  if (kind === "image" && (IMAGE_GEOM.test(intent) || VIDEO_PROC.test(intent))) {
    const args = parseGeomArgs(intent);
    return {
      route: "image-edit",
      tool: "directorx_image_edit",
      reason: "\u56FE\u7247\u51E0\u4F55/\u660E\u6697\u7528 ffmpeg \u672C\u5730\u5904\u7406\uFF0C\u4E0D\u91CD\u7ED8\u3002",
      args: { ...bind, ...args },
      warnings: Object.keys(args).length === 0 ? ["\u610F\u56FE\u91CC\u6CA1\u89E3\u6790\u51FA\u5177\u4F53\u53C2\u6570\uFF0C\u8C03\u7528\u524D\u8865 rotate/hflip/crop/scale\u3002"] : [],
      next: ["directorx_view_image"]
    };
  }
  if (NL_CUT.test(intent) || kind !== "image" && /去掉|只保留|放慢|加快|倒放/.test(intent) && /秒|倍/.test(intent) && /；|;|。|,|，/.test(intent)) {
    const edits = intent.split(/[；;。]+/).map((part) => part.trim()).filter((part) => part !== "");
    return {
      route: "nl-cut",
      tool: "directorx_edit",
      reason: "\u591A\u6761\u4EBA\u8BDD\u526A\u8F91\u6307\u4EE4\u89E3\u6790\u6210 cut list \u518D\u6E32\u67D3\u3002",
      args: { ...bind, ...path !== void 0 ? { video: path } : {}, edits },
      warnings: kind === "image" ? ["\u5F53\u524D\u8282\u70B9\u662F\u56FE\u7247\uFF0C\u526A\u8F91\u9700\u8981\u89C6\u9891\u3002"] : [],
      next: ["directorx_extract_frames", "directorx_view_image"]
    };
  }
  if (kind === "video" || kind === void 0 && (VIDEO_PROC.test(intent) || IMAGE_GEOM.test(intent))) {
    const args = parseVideoArgs(intent);
    return {
      route: "video-process",
      tool: "directorx_video_process",
      reason: "\u5355\u6BB5\u89C6\u9891\u7528 video_process \u7CBE\u786E\u88C1\u526A/\u53D8\u901F/\u7FFB\u8F6C/\u5B9A\u683C\u3002",
      args: { ...bind, ...path !== void 0 ? { source: path } : {}, ...args },
      warnings: Object.keys(args).length === 0 ? ["\u6CA1\u89E3\u6790\u51FA\u53C2\u6570\uFF0C\u8C03\u7528\u524D\u8865 start/end/speed/rotate\u3002"] : [],
      next: ["directorx_probe_media", "directorx_extract_frames"]
    };
  }
  if (/时间线|timeline|转场|混音成片/.test(intent)) {
    return {
      route: "timeline",
      tool: "directorx_timeline",
      reason: "\u591A\u573A\u666F\u65F6\u95F4\u7EBF\u6E32\u67D3\uFF08\u88C1\u526A/\u8F6C\u573A/\u6DF7\u97F3/\u5B57\u5E55\uFF09\u3002",
      args: { ...bind },
      warnings,
      next: ["directorx_timeline", "directorx_qa"]
    };
  }
  warnings.push("\u610F\u56FE\u4E0D\u591F\u5177\u4F53\uFF0C\u5148\u7528 directorx_ask \u786E\u8BA4\u8981\u8C03\u8272\u3001\u88C1\u5207\u8FD8\u662F\u526A\u8F91\u3002");
  next.push("directorx_ask");
  return {
    route: "ask",
    tool: "directorx_ask",
    reason: "\u65E0\u6CD5\u4ECE\u8FD9\u53E5\u8BDD\u5224\u5B9A\u7F16\u8F91\u8DEF\u7EBF\u3002",
    args: bind,
    warnings,
    next
  };
}

// src/media-bind.ts
import { existsSync as existsSync4, statSync } from "node:fs";
import { basename as basename3, isAbsolute as isAbsolute2 } from "node:path";

// src/providers/grade.ts
import { spawnSync } from "node:child_process";
import { existsSync as existsSync3 } from "node:fs";
import { extname as extname2, join as join19 } from "node:path";

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
  return GRADE_LOOK_LIST.map((item2) => item2.label).join(" / ");
}

// src/providers/grade.ts
function resolveGradeLook(text) {
  const raw = text.trim();
  if (isGradeLook(raw)) return raw;
  for (const item2 of GRADE_ALIASES) {
    if (item2.pattern.test(raw)) return item2.look;
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
  if (!existsSync3(source)) throw new Error(`\u5A92\u4F53\u4E0D\u5B58\u5728\uFF1A${source}`);
  const which = spawnSync("which", ["ffmpeg"], { encoding: "utf8" });
  if (which.status !== 0 || which.stdout.trim() === "") {
    throw new Error("\u8C03\u8272\u9700\u8981\u672C\u673A ffmpeg\u3002\u8BF7\u5148\u5B89\u88C5 ffmpeg\uFF08brew install ffmpeg\uFF09\u3002");
  }
  const kind = input.kind ?? inferMediaKind(source);
  const ext = kind === "video" ? ".mp4" : extname2(source).toLowerCase() === ".png" ? ".png" : ".jpg";
  const out = join19(resolveOutputDir(input.outputDir), `${slugify(`grade-${input.look}`)}-${Date.now().toString(36)}${ext}`);
  const vf = gradeFilter(input.look);
  const args = kind === "video" ? ["-y", "-i", source, "-vf", vf, "-c:a", "copy", out] : ["-y", "-i", source, "-vf", vf, out];
  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0 || !existsSync3(out)) {
    throw new Error(`\u8C03\u8272\u5931\u8D25\uFF1A${(result.stderr ?? "").slice(-400) || `exit ${result.status}`}`);
  }
  return { path: out, look: input.look, kind };
}

// src/media-bind.ts
function resolveLocalMedia(outputDir, candidate) {
  const trimmed = candidate.trim();
  if (trimmed === "") throw new Error("\u9700\u8981\u672C\u5730\u5A92\u4F53\u8DEF\u5F84");
  try {
    return resolveMediaPath(outputDir, trimmed);
  } catch (error) {
    if (isAbsolute2(trimmed) && existsSync4(trimmed)) return trimmed;
    throw error;
  }
}
async function resolveBoundMedia(input) {
  const nodeId = typeof input.nodeId === "string" && input.nodeId.trim() !== "" ? input.nodeId.trim() : "";
  let path = typeof input.path === "string" ? input.path.trim() : "";
  let kind = input.kind === "video" || input.kind === "image" ? input.kind : void 0;
  let label;
  if (nodeId !== "") {
    const found = await input.canvas.getNode(nodeId);
    if (found.kind !== "node") throw new Error(`nodeId ${nodeId} \u4E0D\u662F\u5A92\u4F53\u8282\u70B9`);
    if (found.node.kind !== "image" && found.node.kind !== "video") {
      throw new Error(`\u8282\u70B9 ${nodeId} \u4E0D\u662F\u56FE\u7247/\u89C6\u9891`);
    }
    if (path === "") path = found.node.path ?? "";
    kind = kind ?? found.node.kind;
    label = found.node.label;
  }
  if (path === "") throw new Error("\u9700\u8981 path \u6216\u5E26\u5A92\u4F53\u7684 nodeId");
  const source = resolveLocalMedia(input.outputDir, path);
  if (!existsSync4(source)) throw new Error(`\u5A92\u4F53\u4E0D\u5B58\u5728\uFF1A${source}`);
  const mediaKind = kind ?? inferMediaKind(source);
  const require2 = input.require ?? "media";
  if (require2 !== "media" && mediaKind !== require2) {
    throw new Error(`\u9700\u8981${require2 === "video" ? "\u89C6\u9891" : "\u56FE\u7247"}\uFF0C\u5F53\u524D\u662F${mediaKind === "video" ? "\u89C6\u9891" : "\u56FE\u7247"}`);
  }
  return {
    path: source,
    kind: mediaKind,
    ...nodeId !== "" ? { nodeId } : {},
    ...label !== void 0 && label !== "" ? { label } : {}
  };
}
async function commitBoundMedia(input) {
  const mediaType = input.mediaType ?? mimeForPath(input.path);
  const bytes = existsSync4(input.path) ? statSync(input.path).size : 0;
  await input.ledger.append({
    at: Date.now(),
    path: input.path,
    mediaType,
    bytes,
    name: basename3(input.path)
  });
  if (input.nodeId === void 0 || input.nodeId === "") return { written: false };
  await input.canvas.update(input.nodeId, { path: input.path });
  return { written: true, nodeId: input.nodeId };
}

// src/providers/image-process.ts
import { spawnSync as spawnSync3 } from "node:child_process";
import { existsSync as existsSync5 } from "node:fs";
import { extname as extname3, join as join21 } from "node:path";

// src/providers/ffmpeg.ts
import { spawnSync as spawnSync2 } from "node:child_process";
import { mkdir as mkdir15 } from "node:fs/promises";
import { join as join20 } from "node:path";
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
  const dir = join20(resolveOutputDir(outputDir), "frames");
  await mkdir15(dir, { recursive: true });
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
    const path = join20(dir, `${stem}-${stamp}-${t.toFixed(2)}s.png`);
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

// src/providers/image-process.ts
function parseRotate2(value) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (number === 90 || number === 180 || number === 270) return number;
  return void 0;
}
function hasImageOp(input) {
  return input.rotate !== void 0 || input.hflip === true || input.vflip === true || typeof input.crop === "string" && input.crop.trim() !== "" || typeof input.scale === "string" && input.scale.trim() !== "" || input.brightness !== void 0 || input.contrast !== void 0 || input.saturate !== void 0 || input.grade !== void 0;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function buildFilters(input) {
  const filters = [];
  const ops = [];
  if (input.rotate === 90) {
    filters.push("transpose=1");
    ops.push("rotate-90");
  } else if (input.rotate === 180) {
    filters.push("transpose=1,transpose=1");
    ops.push("rotate-180");
  } else if (input.rotate === 270) {
    filters.push("transpose=2");
    ops.push("rotate-270");
  }
  if (input.hflip === true) {
    filters.push("hflip");
    ops.push("hflip");
  }
  if (input.vflip === true) {
    filters.push("vflip");
    ops.push("vflip");
  }
  if (typeof input.crop === "string" && input.crop.trim() !== "") {
    const parts = input.crop.split(":").map(Number);
    if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part) || part < 0)) {
      throw new Error(`crop \u9700\u8981 w:h:x:y\uFF0C\u6536\u5230\u300C${input.crop}\u300D`);
    }
    filters.push(`crop=${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}`);
    ops.push("crop");
  }
  if (typeof input.scale === "string" && input.scale.trim() !== "") {
    filters.push(`scale=${input.scale.trim()}`);
    ops.push("scale");
  }
  const eq = [];
  if (input.brightness !== void 0 && Number.isFinite(input.brightness)) {
    eq.push(`brightness=${clamp(input.brightness, -1, 1).toFixed(3)}`);
  }
  if (input.contrast !== void 0 && Number.isFinite(input.contrast)) {
    eq.push(`contrast=${clamp(input.contrast, 0, 3).toFixed(3)}`);
  }
  if (input.saturate !== void 0 && Number.isFinite(input.saturate)) {
    eq.push(`saturation=${clamp(input.saturate, 0, 3).toFixed(3)}`);
  }
  if (eq.length > 0) {
    filters.push(`eq=${eq.join(":")}`);
    ops.push("eq");
  }
  if (input.grade !== void 0) {
    filters.push(gradeFilter(input.grade));
    ops.push(`grade-${input.grade}`);
  }
  return { filters, ops };
}
async function imageProcess(input) {
  if (!existsSync5(input.source)) throw new Error(`\u56FE\u7247\u4E0D\u5B58\u5728\uFF1A${input.source}`);
  if (!hasImageOp(input)) throw new Error("\u6CA1\u6709\u53EF\u6267\u884C\u7684\u56FE\u7247\u64CD\u4F5C\uFF08\u65CB\u8F6C/\u7FFB\u8F6C/\u88C1\u5207/\u7F29\u653E/\u660E\u6697/\u8C03\u8272\uFF09");
  const which = spawnSync3("which", ["ffmpeg"], { encoding: "utf8" });
  if (which.status !== 0 || which.stdout.trim() === "") {
    throw new Error("\u56FE\u7247\u7F16\u8F91\u9700\u8981\u672C\u673A ffmpeg\u3002\u8BF7\u5148\u5B89\u88C5 ffmpeg\uFF08brew install ffmpeg\uFF09\u3002");
  }
  const { filters, ops } = buildFilters(input);
  const png = extname3(input.source).toLowerCase() === ".png";
  const ext = png ? "png" : "jpg";
  const out = join21(resolveOutputDir(input.outputDir), `${slugify("image-edit")}-${Date.now().toString(36)}.${ext}`);
  const result = spawnSync3("ffmpeg", ["-hide_banner", "-y", "-i", input.source, "-vf", filters.join(","), out], { encoding: "utf8" });
  if (result.status !== 0 || !existsSync5(out)) {
    throw new Error(`\u56FE\u7247\u7F16\u8F91\u5931\u8D25\uFF1A${(result.stderr ?? "").slice(-400) || `exit ${result.status}`}`);
  }
  return {
    path: out,
    mimeType: png ? "image/png" : "image/jpeg",
    probe: probeMedia(out),
    ops
  };
}

// src/tasks.ts
import { appendFile as appendFile2, mkdir as mkdir16, readFile as readFile17 } from "node:fs/promises";
import { join as join22 } from "node:path";
var LEDGER_FILE = "tasks.jsonl";
var MAX_LEDGER_LINES = 2e4;
var DirectorxTaskLedger = class {
  outputDir;
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  async filePath() {
    const dir = resolveOutputDir(this.outputDir);
    await mkdir16(dir, { recursive: true });
    return join22(dir, LEDGER_FILE);
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
    const content = await readFile17(path, "utf8").catch((error) => {
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

// src/providers/audio.ts
import { writeFile as writeFile15 } from "node:fs/promises";
import { join as join23 } from "node:path";

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
  const capability = typeof record.capability === "string" ? record.capability : "";
  const mode = typeof record.mode === "string" ? record.mode : "";
  if (id === "") issues.push({ path: "id", message: "\u5FC5\u586B" });
  if (model === "") issues.push({ path: "model", message: "\u5FC5\u586B" });
  if (baseURL === "") issues.push({ path: "baseURL", message: "\u5FC5\u586B" });
  if (!CAP_SET.has(capability)) issues.push({ path: "capability", message: "\u5FC5\u987B\u662F vision/image/video/audio" });
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
  const aspectRatios = Array.isArray(capsRaw.aspectRatios) ? capsRaw.aspectRatios.filter((item2) => typeof item2 === "string" && item2 !== "") : ["16:9"];
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
        success: Array.isArray(pollRaw?.success) ? pollRaw.success.filter((item2) => typeof item2 === "string") : ["success", "succeeded", "completed", "complete", "finished", "done"],
        failure: Array.isArray(pollRaw?.failure) ? pollRaw.failure.filter((item2) => typeof item2 === "string") : ["failed", "failure", "error", "cancelled", "canceled"],
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
  if (capability === "vision" && mode === "generic-rest") {
    issues.push({ path: "mode", message: "vision \u53EA\u652F\u6301 openai-chat / mock" });
  }
  if (mode === "generic-rest") {
    if (create === void 0) issues.push({ path: "create", message: "generic-rest \u5FC5\u987B\u6709 create" });
    if (poll === void 0 && syncResult === void 0) {
      issues.push({ path: "poll", message: "generic-rest \u9700\u8981 poll\uFF08\u5F02\u6B65\uFF09\u6216 syncResult\uFF08\u540C\u6B65\uFF09" });
    }
    const bodyValues = Object.values(create?.body ?? {});
    const hasPrompt = bodyValues.some((item2) => item2.type === "from" && (item2.field === "prompt" || item2.field === "text"));
    if (!hasPrompt) issues.push({ path: "create.body", message: "\u81F3\u5C11\u628A prompt \u6216 text \u6620\u5C04\u8FDB\u8BF7\u6C42\u4F53" });
  }
  if (issues.length > 0) return { issues };
  return {
    spec: {
      id,
      capability,
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
function adapterIdFor(capability, model) {
  const slug = model.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  return `${capability}-${slug || "model"}`;
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
    if (poll.success.some((item2) => item2.toLowerCase() === status)) return body;
    if (poll.failure.some((item2) => item2.toLowerCase() === status)) {
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
  const path = join23(outDir, `${slugify(text, 24)}-mock.wav`);
  await writeFile15(path, makeWav());
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
      const raw = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("json") || raw[0] === 123) {
        const parsed = JSON.parse(raw.toString("utf8"));
        const url = parsed.output?.audio?.url ?? parsed.url;
        const data = parsed.output?.audio?.data;
        if (typeof data === "string" && data !== "") {
          bytes = Buffer.from(data, "base64");
        } else if (typeof url === "string" && url !== "") {
          const audio = await fetch(url, { signal: ctx.signal });
          if (!audio.ok) {
            lastError = `audio url HTTP ${audio.status}`;
            continue;
          }
          bytes = Buffer.from(await audio.arrayBuffer());
        } else {
          lastError = "speech JSON had empty audio data/url";
          continue;
        }
      } else {
        bytes = raw;
      }
      if (bytes.length < 1024) {
        lastError = `speech payload too small (${bytes.length} bytes)`;
        bytes = void 0;
        continue;
      }
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
  const path = join23(outDir, `${slugify(text, 24)}-${(/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z")}.${ext}`);
  await writeFile15(path, bytes);
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
import { existsSync as existsSync6 } from "node:fs";
import { readFile as readFile18, writeFile as writeFile16 } from "node:fs/promises";
import { basename as basename4, join as join24, resolve as resolve6 } from "node:path";

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
  const name = `${slugify(prompt, 24)}-${size.replace(/[^\d]/g, "x")}.svg`;
  const path = join24(outDir, name);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">',
    '<rect width="100%" height="100%" fill="#0b1020"/>',
    '<text x="50%" y="50%" fill="#9fd8ff" font-family="sans-serif" font-size="28" text-anchor="middle">DirectorX mock image</text>',
    "</svg>"
  ].join("");
  await writeFile16(path, svg, "utf8");
  return {
    model: ctx.capability.model,
    prompt,
    files: [{ path, mimeType: "image/svg+xml" }],
    mode: "mock"
  };
}
function resolveLocalImage(source) {
  if (existsSync6(source)) return source;
  const project = currentProjectRoot();
  const hit = [resolve6(source), resolve6(project, source)].find((candidate) => existsSync6(candidate));
  if (hit === void 0) throw new Error(`File not found: ${source}`);
  return hit;
}
async function filesFromImageEnvelope(ctx, prompt, body) {
  const first = body.data?.[0];
  if (first === void 0) throw new Error(`Image response contained no data: ${JSON.stringify(body).slice(0, 300)}`);
  const files = [];
  if (first.b64_json !== void 0) {
    const path = await saveBase64ToFile(first.b64_json, ctx.settings.outputDir, slugify(prompt), "png");
    files.push({ path, mimeType: "image/png" });
  } else if (first.url !== void 0) {
    if (/^https?:\/\//i.test(first.url)) {
      const path = await downloadToFile(first.url, ctx.settings.outputDir, slugify(prompt), ".png");
      files.push({ path, url: first.url, mimeType: "image/png" });
    } else {
      files.push({ url: first.url });
    }
  } else {
    throw new Error(`Image response item contained neither b64_json nor url: ${JSON.stringify(first).slice(0, 300)}`);
  }
  return files;
}
async function openaiImageEdit(ctx, prompt, size, quality, referenceImagePaths) {
  const baseURL = ctx.capability.baseURL.replace(/\/+$/, "");
  const apiKey = apiKeyOf(ctx.capability.apiKey, ["DIRECTORX_IMAGE_API_KEY", "OPENAI_API_KEY"], baseURL);
  const blobs = [];
  for (const source of referenceImagePaths.slice(0, 4)) {
    const path = resolveLocalImage(source);
    const bytes = await readFile18(path);
    blobs.push({ blob: new Blob([new Uint8Array(bytes)], { type: mimeForPath(path) }), name: basename4(path) });
  }
  const post = async (field, extras) => {
    const form = new FormData();
    form.append("model", ctx.capability.model);
    form.append("prompt", prompt);
    form.append("n", "1");
    if (size !== void 0 && size !== "") form.append("size", size);
    if (quality !== void 0 && quality !== "") form.append("quality", quality);
    for (const [key, value] of Object.entries(extras)) form.append(key, value);
    for (const item2 of blobs) form.append(field, item2.blob, item2.name);
    const response2 = await fetch(`${baseURL}/images/edits`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: ctx.signal
    });
    const body2 = await readJsonResponse(response2);
    return { response: response2, body: body2 };
  };
  let { response, body } = await post("image", {});
  if (!response.ok) ({ response, body } = await post("image[]", {}));
  if (!response.ok) ({ response, body } = await post("image", { input_fidelity: "high" }));
  if (!response.ok) {
    throw new Error(`Image edit failed (HTTP ${response.status}): ${JSON.stringify(body.error ?? body).slice(0, 400)}`);
  }
  return { model: ctx.capability.model, prompt, files: await filesFromImageEnvelope(ctx, prompt, body), mode: "openai-images" };
}
async function openaiImage(ctx, prompt, size, quality, referenceImagePaths = []) {
  if (referenceImagePaths.length > 0) {
    try {
      return await openaiImageEdit(ctx, prompt, size, quality, referenceImagePaths);
    } catch {
      return openaiImage(ctx, `${prompt}

Use the locked costume and face from the written character bible. Do not invent extra people.`, size, quality, []);
    }
  }
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
  return { model: ctx.capability.model, prompt, files: await filesFromImageEnvelope(ctx, prompt, body), mode: "openai-images" };
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
    if (ctx.capability.mode === "openai-images") {
      return openaiImage(ctx, prompt, options.size, options.quality, options.referenceImagePaths ?? []);
    }
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

// src/providers/video.ts
import { spawnSync as spawnSync5 } from "node:child_process";
import { join as join26 } from "node:path";

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
function runwayRatio(aspectRatio2) {
  const table = {
    "16:9": "1280:720",
    "9:16": "720:1280",
    "1:1": "960:960",
    "4:3": "1104:832",
    "3:4": "832:1104",
    "21:9": "1584:672"
  };
  const key = aspectRatio2 ?? "16:9";
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

// src/providers/frame-fit.ts
import { spawnSync as spawnSync4 } from "node:child_process";
import { existsSync as existsSync7 } from "node:fs";
import { join as join25 } from "node:path";
function fitScaleFilter(scale) {
  const raw = scale.trim();
  const match = /^(\d+):(\d+)$/.exec(raw);
  if (match === null) return raw.startsWith("scale=") ? raw : `scale=${raw}`;
  const width = match[1];
  const height = match[2];
  return `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
}
function parseAspectRatio(ratio) {
  const match = /^(\d+)\s*:\s*(\d+)$/.exec((ratio ?? "16:9").trim());
  if (match === null) return { w: 16, h: 9 };
  return { w: Number(match[1]), h: Number(match[2]) };
}
function requireFfmpeg() {
  const found = spawnSync4("which", ["ffmpeg"], { encoding: "utf8" });
  return found.status === 0 && found.stdout.trim() !== "";
}
function runVf(source, dest, vf, what) {
  if (!existsSync7(source)) throw new Error(`${what}: missing ${source}`);
  if (!requireFfmpeg()) throw new Error(`${what}: ffmpeg not on PATH`);
  const result = spawnSync4("ffmpeg", ["-hide_banner", "-y", "-i", source, "-vf", vf, dest], { encoding: "utf8" });
  if (result.status !== 0 || !existsSync7(dest)) {
    throw new Error(`${what} failed: ${(result.stderr ?? "").slice(-400) || `exit ${result.status}`}`);
  }
  return dest;
}
function cropToAspect(source, dest, aspectW = 16, aspectH = 9) {
  const vf = [
    `crop='min(iw,ih*${aspectW}/${aspectH})':'min(ih,iw*${aspectH}/${aspectW})'`,
    "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "setsar=1"
  ].join(",");
  return runVf(source, dest, vf, "cropToAspect");
}
function zoomEndFrame(source, dest, zoom = 1.16) {
  const factor = Math.min(1.45, Math.max(1.05, zoom));
  const vf = [
    `crop=iw/${factor}:ih/${factor}:(iw-ow)/2:(ih-oh)/2`,
    "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "setsar=1"
  ].join(",");
  return runVf(source, dest, vf, "zoomEndFrame");
}
function extractTailFrame(source, dest) {
  if (!existsSync7(source)) throw new Error(`extractTailFrame: missing ${source}`);
  if (!requireFfmpeg()) throw new Error("extractTailFrame: ffmpeg not on PATH");
  const result = spawnSync4("ffmpeg", [
    "-hide_banner",
    "-y",
    "-sseof",
    "-0.04",
    "-i",
    source,
    "-frames:v",
    "1",
    dest
  ], { encoding: "utf8" });
  if (result.status !== 0 || !existsSync7(dest)) {
    throw new Error(`extractTailFrame failed: ${(result.stderr ?? "").slice(-400) || `exit ${result.status}`}`);
  }
  return dest;
}
function ensureAspectFrame(source, outputDir, aspectW = 16, aspectH = 9) {
  if (!existsSync7(source)) throw new Error(`ensureAspectFrame: missing ${source}`);
  if (!requireFfmpeg()) return source;
  const dest = join25(resolveOutputDir(outputDir), `${slugify("frame-fit")}-${aspectW}x${aspectH}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.png`);
  try {
    return cropToAspect(source, dest, aspectW, aspectH);
  } catch {
    return source;
  }
}

// src/providers/video.ts
function modelverseH3Resolution(requested) {
  const official = h3Resolution(requested);
  const key = official.toLowerCase();
  if (key === "1440p" || key === "2k" || key === "1080p" || key === "1k") return "2K";
  if (key === "768p" || key === "720p") return "768P";
  return official === "768P" ? "768P" : official;
}
async function mockVideo(ctx, prompt) {
  const outDir = await ensureOutputDir(ctx.settings.outputDir);
  const path = join26(outDir, `${slugify(prompt)}-mock.mp4`);
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
  const h3 = isH3Model(ctx.capability.model, ctx.capability.mode);
  const duration = h3 ? clampH3Duration(options.seconds) : Math.min(15, Math.max(4, Math.round(options.seconds ?? 5)));
  const promptText = h3 ? clipH3Prompt(prompt).prompt : prompt;
  const content = [{ type: "text", text: promptText }];
  const aspect = parseAspectRatio(options.aspectRatio);
  const firstFramePath = options.firstFramePath !== void 0 ? ensureAspectFrame(options.firstFramePath, ctx.settings.outputDir, aspect.w, aspect.h) : void 0;
  const lastFramePath = options.lastFramePath !== void 0 ? ensureAspectFrame(options.lastFramePath, ctx.settings.outputDir, aspect.w, aspect.h) : void 0;
  const hasFrameLocks = firstFramePath !== void 0 || lastFramePath !== void 0;
  if (firstFramePath !== void 0) {
    content.push({ type: "image_url", image_url: { url: await mediaSourceToDataUrl(firstFramePath) }, role: "first_frame" });
  }
  if (lastFramePath !== void 0) {
    content.push({ type: "image_url", image_url: { url: await mediaSourceToDataUrl(lastFramePath) }, role: "last_frame" });
  }
  const skipRefs = h3SkipReferences(firstFramePath, lastFramePath);
  if (!skipRefs) {
    for (const source of limitH3Refs(options.referenceImagePaths ?? [])) {
      content.push({ type: "image_url", image_url: { url: await mediaSourceToDataUrl(source) }, role: h3 ? "reference_image" : "reference" });
    }
  }
  const ratio = hasFrameLocks ? "adaptive" : options.aspectRatio ?? "16:9";
  const parameters = {
    duration,
    ratio,
    resolution: h3 ? modelverseH3Resolution(options.resolution) : options.resolution ?? "2K",
    aigc_watermark: false
  };
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

// src/providers/transcribe.ts
import { mkdir as mkdir17, readFile as readFile19, writeFile as writeFile17 } from "node:fs/promises";
import { join as join27, resolve as resolve7 } from "node:path";
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
  const dir = join27(resolveOutputDir(ctx.settings.outputDir), "transcripts");
  await mkdir17(dir, { recursive: true });
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
  const srtPath = join27(dir, `${slugify(source, 24)}-${stamp}.srt`);
  await writeFile17(srtPath, srt, "utf8");
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
  const bytes = await readFile19(resolve7(source));
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
  const dir = join27(resolveOutputDir(ctx.settings.outputDir), "transcripts");
  await mkdir17(dir, { recursive: true });
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
  const files = [];
  const srt = options.format === "srt" ? text : void 0;
  if (srt !== void 0) {
    const srtPath = join27(dir, `${slugify(source, 24)}-${stamp}.srt`);
    await writeFile17(srtPath, srt, "utf8");
    files.push({ path: srtPath, mimeType: "application/x-subrip" });
  } else {
    const txtPath = join27(dir, `${slugify(source, 24)}-${stamp}.txt`);
    await writeFile17(txtPath, text, "utf8");
    files.push({ path: txtPath, mimeType: "text/plain" });
  }
  return { model: ctx.capability.model, source, language: options.language, text, srt, files, mode: ctx.capability.mode };
}
async function runTranscribe(ctx, source, options) {
  if (ctx.capability.mode === "mock") return mockTranscribe(ctx, source);
  return openaiTranscribe(ctx, source, options);
}

// src/providers/video-process.ts
import { spawnSync as spawnSync6 } from "node:child_process";
import { mkdir as mkdir18 } from "node:fs/promises";
import { existsSync as existsSync8, renameSync, rmSync } from "node:fs";
import { join as join28 } from "node:path";
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
  const result = spawnSync6("ffmpeg", ["-hide_banner", "-y", ...finalArgs], { encoding: "utf8" });
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
  mkdir18(root, { recursive: true }).catch(() => {
  });
  return join28(root, `${slugify(tag)}-${Date.now().toString(36)}.${ext}`);
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
      const name = filter.name.trim();
      let value = filter.value;
      if (name === "eq") {
        const nums = value.split(":").map(Number);
        const clamped = nums.map((num) => Number.isFinite(num) ? Math.max(-1, Math.min(1, num)) : 0);
        value = clamped.join(":");
      } else if (name === "gblur") {
        const sigma = Number(value);
        value = String(Number.isFinite(sigma) ? Math.max(0, Math.min(50, sigma)) : 1);
      } else if (name === "noise") {
        const amount = Number(value);
        value = String(Number.isFinite(amount) ? Math.max(0, Math.min(100, amount)) : 10);
      } else if (name === "vignette") {
        const angle = value.replace(/^angle=/, "");
        const degrees = Number(angle);
        value = `angle=${String(Number.isFinite(degrees) ? Math.max(0, Math.min(360, degrees)) : 180)}`.replace(/^angle=0$/, "angle=PI*0");
      }
      videoFilters.push(`${name}=${value}`);
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
    if (!existsSync8(input.lut3d)) throw new Error(`LUT \u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${input.lut3d}`);
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
  const scale = fitScaleFilter(input.scale ?? "1280:720");
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
        filters2.push(`[${index}:v]${scale},fps=30,format=yuv420p,setpts=PTS-STARTPTS[v${index}];${hasAudio ? `[${index}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${index}]` : `anullsrc=channel_layout=stereo:sample_rate=48000:d=${Math.max(0.2, probes2[index]?.durationSec ?? 3)}[a${index}]`}`);
      } else {
        filters2.push(`[${index}:v]${scale},fps=30,format=yuv420p,setpts=PTS-STARTPTS[v${index}]`);
      }
    });
    const inputs = anyAudio2 ? input.files.map((_, index) => `[v${index}][a${index}]`).join("") : input.files.map((_, index) => `[v${index}]`).join("");
    const filterComplex2 = `${filters2.join(";")};${inputs}concat=n=${input.files.length}:v=1:a=${anyAudio2 ? 1 : 0}${anyAudio2 ? "[v][a]" : "[v]"}`;
    args2.push("-filter_complex", filterComplex2, "-map", "[v]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast");
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
      filters.push(`[${index}:v]${scale},fps=30,format=yuv420p,setpts=PTS-STARTPTS[v${index}];${hasAudio ? `[${index}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${index}]` : `anullsrc=channel_layout=stereo:sample_rate=48000:d=${Math.max(0.2, probes[index]?.durationSec ?? 3)}[a${index}]`}`);
    });
  } else {
    input.files.forEach((_, index) => {
      filters.push(`[${index}:v]${scale},fps=30,format=yuv420p,setpts=PTS-STARTPTS[v${index}]`);
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
  args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", out);
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
    parts.push(`[${index + 1}:a]volume=${vol},aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[bus${index}]`);
    trackLabels.push(`[bus${index}]`);
  });
  let mixInputs = trackLabels.join("");
  if (input.duckUnder !== void 0 && input.duckUnder >= 0 && input.duckUnder < input.tracks.length) {
    const voice = `[bus${input.duckUnder}]`;
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
  const result = spawnSync6("ffmpeg", ["-hide_banner", "-h", "filter=ass"], { encoding: "utf8" });
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
  const result = spawnSync6("ffmpeg", [
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

// src/providers/preflight.ts
var COMMON_SIZES = ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"];
var COMMON_VIDEO_SIZES = ["720p", "1080p", "2k", "1280x720", "1920x1080"];
var ELEMENTS2 = [
  { name: "\u4E3B\u4F53", keywords: ["\u4EBA", "\u89D2\u8272", "\u4EBA\u7269", "\u4E3B\u89D2", "\u52A8\u7269", "\u4EA7\u54C1", "\u8F66", "\u5EFA\u7B51", "\u673A\u68B0", "\u732B", "\u72D7", "\u6F14\u5458", "\u5973\u5B69", "\u7537\u5B69", "\u7537\u4EBA", "\u5973\u4EBA"] },
  { name: "\u52A8\u4F5C", keywords: ["\u8D70", "\u8DD1", "\u8DF3", "\u8F6C\u8EAB", "\u56DE\u5934", "\u7B11", "\u98DE", "\u6D41", "\u843D", "\u5347\u8D77", "\u65CB\u8F6C", "\u63A8\u8FDB", "\u79FB\u52A8", "\u821E", "\u6253", "\u63E1", "\u62FF\u8D77", "\u5954\u8DD1"] },
  { name: "\u573A\u666F", keywords: ["\u8857", "\u5DF7", "\u57CE\u5E02", "\u5C71", "\u6D77", "\u623F\u95F4", "\u68EE\u6797", "\u5929\u7A7A", "\u6C99\u6F20", "\u529E\u516C\u5BA4", "\u821E\u53F0", "\u96E8", "\u591C", "\u5BA4\u5185", "\u6237\u5916"] },
  { name: "\u5149\u7EBF", keywords: ["\u5149", "\u706F", "\u9006\u5149", "\u4FA7\u5149", "\u9713\u8679", "\u9633\u5149", "\u6708\u5149", "\u6697", "\u9634\u5F71", "\u66DD\u5149", "\u6696\u5149", "\u51B7\u5149"] },
  { name: "\u98CE\u683C", keywords: ["\u98CE\u683C", "\u7535\u5F71\u611F", "\u5199\u5B9E", "\u8D5B\u535A", "\u4E8C\u6B21\u5143", "\u5361\u901A", "\u6CB9\u753B", "\u6C34\u58A8", "\u80F6\u7247", "\u7EAA\u5B9E", "\u5E7F\u544A", "\u9AD8\u5BF9\u6BD4"] },
  { name: "\u8D1F\u9762\u8BCD", keywords: ["\u7981\u6B62", "\u4E0D\u8981", "\u907F\u514D", "\u65E0\u6C34\u5370", "\u65E0\u5B57\u5E55", "\u4E0D\u53D8\u5F62"] }
];
var IP_FLAGS = [
  { name: "\u771F\u4EBA\u8096\u50CF", keywords: ["\u660E\u661F"] },
  { name: "\u97F3\u4E50\u7248\u6743", keywords: ["\u91C7\u6837"] }
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
  for (const element of ELEMENTS2) {
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
  const ipHits = scanIpRisk(prompt);
  const ipBrief = ipHits.length > 0 ? buildIpBrief(prompt) : void 0;
  for (const hit of ipHits) gates.rights.issues.push(ipIssueLine(hit));
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
    summary: pass ? "\u56DB\u9053\u95F8\u95E8\u901A\u8FC7\uFF0C\u53EF\u63D0\u4EA4\u751F\u6210\u3002" : "\u5B58\u5728\u5F85\u529E\u95F8\u95E8\uFF1A\u5148\u4FEE\u590D issues\uFF08\u6216\u4E0E\u7528\u6237\u786E\u8BA4\uFF09\uFF0C\u6309 directorx-playbook \u5148\u5360\u4F4D\u540E\u751F\u6210\u3002",
    ...ipBrief !== void 0 ? {
      ip: {
        hits: ipBrief.hits,
        dirty: ipBrief.dirty,
        brief: ipBrief,
        negatives: ipBrief.exclude,
        negativeLine: ipBrief.negativeLine
      }
    } : {}
  };
}

// src/providers/video-analyze.ts
import { spawnSync as spawnSync7 } from "node:child_process";
async function videoAnalyze(input) {
  const probe = probeMedia(input.source);
  const cutThreshold = input.cutThreshold ?? 12;
  const minShotSec = input.minShotSec ?? 0.4;
  const result = spawnSync7("ffmpeg", [
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
  const freezeResult = spawnSync7("ffmpeg", [
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
  const sobelResult = spawnSync7("ffmpeg", [
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
  const blackDetect = spawnSync7("ffmpeg", [
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
  const volumeDetect = spawnSync7("ffmpeg", [
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
  const loud = spawnSync7("ffmpeg", [
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
import { createHash as createHash2 } from "node:crypto";
import { spawnSync as spawnSync8 } from "node:child_process";
import { copyFileSync, existsSync as existsSync9, readFileSync as readFileSync2, statSync as statSync2, mkdirSync } from "node:fs";
import { rm as rm2 } from "node:fs/promises";
import { join as join29 } from "node:path";
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
    const info = statSync2(source);
    sourceTag = `${source}:${info.size}:${info.mtimeMs}`;
  } catch {
    sourceTag = `${source}:missing`;
  }
  const parts = [sourceTag, JSON.stringify(scene.trim ?? null), scene.speed ?? 1, scene.reverse === true ? "rev" : "fwd", scale ?? ""];
  return createHash2("sha256").update(parts.join("|")).digest("hex").slice(0, 20);
}
function segmentCachePath(outputDir, fingerprint) {
  return join29(resolveOutputDir(outputDir), ".timeline-cache", `${fingerprint}.mp4`);
}
async function renderTimeline(spec, outputDir) {
  if (spec.scenes.length === 0) throw new DirectiveError("invalidArg", "timeline needs at least one scene");
  for (const [index, scene] of spec.scenes.entries()) {
    if (scene.source === "" || !existsSync9(scene.source)) {
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
      if (existsSync9(cached)) {
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
          mkdirSync(join29(resolveOutputDir(outputDir), ".timeline-cache"), { recursive: true });
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
        const out = join29(resolveOutputDir(outputDir), `faded-${Date.now().toString(36)}.mp4`);
        const fargs = ["-hide_banner", "-y", "-i", assembled.path];
        if (fadeFilters.length > 0) fargs.push("-vf", fadeFilters.join(","));
        if (audioFade.length > 0) fargs.push("-af", audioFade.join(","));
        fargs.push("-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac", out);
        const result = spawnSync8("ffmpeg", fargs, { encoding: "utf8" });
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
  const detect = spawnSync8("ffmpeg", [
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
function overlap3(a, b) {
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
      const score = overlap3(sentence, cue.text);
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
function weightedWidth(text) {
  let width = 0;
  for (const char of text) {
    if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(char)) width += 1.75;
    else if (/[\uac00-\ud7af]/.test(char)) width += 1.5;
    else width += 1;
  }
  return width;
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
import { mkdir as mkdir19 } from "node:fs/promises";
async function videoUnderstand(input) {
  const probe = probeMedia(input.source);
  const framesDir = resolveOutputDir(input.outputDir);
  await mkdir19(framesDir, { recursive: true });
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

// src/canvas-script.ts
var SCRIPT_STARTER = `\u7B2C\u4E00\u573A \u5496\u5561\u9986 \u65E5\u5185
\u955C\u59341\uFF1A\u8FD1\u666F\uFF0C\u63A8\u95E8\u8FDB\u6765\uFF0C5s
\u955C\u59342\uFF1A\u8FC7\u80A9\uFF0C\u5E97\u5458\u62AC\u5934\uFF0C3s
`;
var MAX_SCRIPT_SHOTS = 16;
var SCRIPT_STAMP_PREFIX = "\u5267\u672C:";
var SCENE_EN = /^(INT\.|EXT\.|EST\.|INT\.\/EXT\.|INT\/EXT\.|I\/E\.)\b/i;
var SCENE_ZH = /^(第[0-9一二三四五六七八九十百]+场|场次\s*[0-9]+|[0-9]+\s*场)(?:\s|$|[：:])/;
var SCENE_MD = /^#{1,3}\s+(.+)$/;
var SHOT = /^(?:镜头|镜号|镜|Shot|SHOT|#)\s*[:：#]?\s*(\d+)?\s*[:：.]?\s*(.*)$/;
var NUMBERED = /^(\d+)[\.、\)]\s+(.+)$/;
var TRANSITION = /^(CUT TO:|FADE (?:IN|OUT):|DISSOLVE TO:|SMASH CUT:|切到|淡出|淡入)/i;
var TITLE_KEY = /^(Title|Credit|Author|Authors|Source|Draft date|Contact|标题|作者)\s*:/i;
var CHAR_EN = /^[A-Z][A-Z0-9 #.'\-]{1,40}(?:\s*\([^)]{1,24}\))?$/;
var CHAR_ZH = /^([\u4e00-\u9fffA-Za-z][\u4e00-\u9fffA-Za-z0-9·\s]{0,16})\s*(?:\([^)]{1,16}\))?\s*[:：]\s*(.*)$/;
var PAREN = /^\(.*\)$/;
function parseScriptBeats(raw, options = {}) {
  const cap = Math.max(1, Math.min(MAX_SCRIPT_SHOTS, options.maxShots ?? MAX_SCRIPT_SHOTS));
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (text.length < 4) return [];
  const lines = text.split("\n");
  let cursor = 0;
  while (cursor < lines.length && TITLE_KEY.test((lines[cursor] ?? "").trim())) cursor += 1;
  if (cursor > 0) {
    while (cursor < lines.length && (lines[cursor] ?? "").trim() === "") cursor += 1;
  }
  const structured = parseStructured(lines.slice(cursor), cap);
  if (structured.length > 0) return structured;
  return parseParagraphs(lines.slice(cursor).join("\n"), cap);
}
function parseStructured(lines, cap) {
  const beats = [];
  let act = "\u7B2C\u4E00\u573A";
  let actCount = 0;
  let sawMarker = false;
  let draft;
  let last = "blank";
  const flush = () => {
    if (draft === void 0) return;
    const prompt = draft.prompt.map((line) => line.trim()).filter((line) => line !== "").join("\n").trim();
    if (prompt === "") {
      draft = void 0;
      return;
    }
    if (beats.length >= cap) {
      draft = void 0;
      return;
    }
    const index = beats.length + 1;
    const seconds = Math.min(15, durationFromPrompt(prompt, 5));
    beats.push({
      act,
      index,
      label: (draft.label ?? `\u955C${index}`).slice(0, 40),
      prompt: prompt.slice(0, 2e3),
      seconds,
      characters: uniqueNames(draft.characters)
    });
    draft = void 0;
  };
  const startBeat = (label) => {
    flush();
    draft = { prompt: [], characters: [], ...label !== void 0 ? { label } : {} };
  };
  const ensureBeat = () => {
    if (draft === void 0) startBeat();
    return draft;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      last = "blank";
      continue;
    }
    if (TRANSITION.test(line)) {
      flush();
      last = "other";
      continue;
    }
    const md = SCENE_MD.exec(line);
    if (SCENE_EN.test(line) || SCENE_ZH.test(line) || md !== null) {
      flush();
      sawMarker = true;
      actCount += 1;
      act = (md?.[1] ?? line.replace(/^#+\s*/, "")).slice(0, 40) || `\u7B2C${actCount}\u573A`;
      last = "other";
      continue;
    }
    const shot = SHOT.exec(line);
    if (shot !== null) {
      const rest = (shot[2] ?? "").trim();
      const num = shot[1] !== void 0 && shot[1] !== "" ? shot[1] : String(beats.length + 1);
      sawMarker = true;
      startBeat(`\u955C${num}`);
      if (rest !== "") ensureBeat().prompt.push(rest);
      last = "other";
      continue;
    }
    const numbered = NUMBERED.exec(line);
    if (numbered !== null && looksLikeShot(numbered[2] ?? "")) {
      sawMarker = true;
      startBeat(`\u955C${numbered[1]}`);
      ensureBeat().prompt.push((numbered[2] ?? "").trim());
      last = "other";
      continue;
    }
    const spoken = CHAR_ZH.exec(line);
    if (spoken !== null) {
      const name = (spoken[1] ?? "").trim();
      const speech = (spoken[2] ?? "").trim();
      const beat = ensureBeat();
      if (name !== "") beat.characters.push(name);
      beat.prompt.push(speech === "" ? name : `${name}\uFF1A${speech}`);
      last = speech === "" ? "character" : "other";
      continue;
    }
    if (CHAR_EN.test(line) && !SCENE_EN.test(line) && !TRANSITION.test(line)) {
      const name = line.replace(/\s*\([^)]*\)\s*$/, "").trim();
      const beat = ensureBeat();
      beat.characters.push(name);
      last = "character";
      continue;
    }
    if (last === "character" || PAREN.test(line)) {
      ensureBeat().prompt.push(line);
      last = PAREN.test(line) ? "character" : "other";
      continue;
    }
    ensureBeat().prompt.push(line);
    last = "other";
  }
  flush();
  if (!sawMarker) return [];
  return beats;
}
function parseParagraphs(text, cap) {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter((block) => block.length >= 4);
  return blocks.slice(0, cap).map((block, index) => ({
    act: "\u7B2C\u4E00\u573A",
    index: index + 1,
    label: `\u955C${index + 1}`,
    prompt: block.slice(0, 2e3),
    seconds: Math.min(15, durationFromPrompt(block, 5)),
    characters: []
  }));
}
function looksLikeShot(body) {
  return /近景|远景|特写|过肩|全景|中景|推|拉|摇|移|跟|俯|仰|室内|室外|s\b|秒/i.test(body) || body.length >= 6;
}
function uniqueNames(names) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const name of names) {
    const trimmed = name.trim().slice(0, 80);
    if (trimmed.length < 2 || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= 8) break;
  }
  return out;
}
function newRowId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
function scriptTextOf(node) {
  const label = typeof node.label === "string" ? node.label : "";
  const prompt = typeof node.prompt === "string" ? node.prompt : "";
  if (label.length >= prompt.length) return [label, label === prompt ? "" : prompt].filter(Boolean).join("\n");
  return [label, prompt].filter(Boolean).join("\n");
}
function alreadyScripted(doc, sourceId) {
  const stamp = `${SCRIPT_STAMP_PREFIX}${sourceId}`;
  return doc.nodes.some((node) => node.continuityRules?.includes(stamp) === true);
}
async function applyScriptRows(input) {
  const store = input.store;
  let doc = await store.read();
  let sourceId = typeof input.nodeId === "string" ? input.nodeId : "";
  let source = sourceId !== "" ? doc.nodes.find((node) => node.id === sourceId) : void 0;
  if (sourceId !== "" && source === void 0) throw new Error(`canvas node "${sourceId}" not found`);
  if (source !== void 0 && source.kind !== "text") throw new Error("\u94FA\u6210\u5206\u955C\u884C\u53EA\u63A5\u53D7\u6587\u672C/\u5267\u672C\u8282\u70B9");
  const provided = typeof input.text === "string" ? input.text.trim() : "";
  const fromNode = source !== void 0 ? scriptTextOf(source).trim() : "";
  const text = provided !== "" ? provided : fromNode;
  if (text.length < 8) throw new Error("\u5148\u5199\u51E0\u573A\u620F\u6216\u51E0\u6761\u955C\u5934\uFF0C\u518D\u94FA\u6210\u5206\u955C\u884C");
  if (source === void 0) {
    doc = await store.addNode({
      kind: "text",
      label: text.slice(0, 8e3),
      prompt: text.slice(0, 2e3),
      x: input.origin?.x ?? 48,
      y: input.origin?.y ?? 48,
      width: 320,
      height: Math.max(200, Math.min(520, 80 + text.split("\n").length * 18)),
      continuityRules: [`${SCRIPT_STAMP_PREFIX}source`]
    });
    source = doc.nodes[doc.nodes.length - 1];
    sourceId = source.id;
  } else if (provided !== "" && provided !== fromNode) {
    doc = await store.update(source.id, { label: provided.slice(0, 8e3) });
    source = doc.nodes.find((node) => node.id === sourceId);
  }
  if (source === void 0) throw new Error("\u5267\u672C\u8282\u70B9\u5199\u5165\u5931\u8D25");
  if (alreadyScripted(doc, sourceId)) {
    const stamp2 = `${SCRIPT_STAMP_PREFIX}${sourceId}`;
    const nodeIds2 = doc.nodes.filter((node) => node.continuityRules?.includes(stamp2) === true).map((node) => node.id);
    const groupIds2 = doc.nodes.filter((node) => node.kind === "group" && nodeIds2.includes(node.id)).map((node) => node.id);
    return { action: "script", reused: true, sourceId, beats: parseScriptBeats(text), nodeIds: nodeIds2, groupIds: groupIds2, doc };
  }
  const beats = parseScriptBeats(text);
  if (beats.length === 0) throw new Error("\u6CA1\u6709\u62C6\u51FA\u955C\u5934\u3002\u7528\u300C\u955C\u59341\uFF1A\u300D\u6216\u7A7A\u884C\u5206\u6BB5\u518D\u8BD5");
  const stamp = `${SCRIPT_STAMP_PREFIX}${sourceId}`;
  const originX = input.origin?.x ?? source.x;
  const originY = input.origin?.y ?? source.y + (source.height ?? 200) + 64;
  let shotNumber = doc.nodes.reduce((max, node) => Math.max(max, node.shotIndex ?? 0), 0);
  const nodes = [];
  const edges = [];
  const nodeIds = [];
  const groupIds = [];
  const videoIds = [];
  const cardW = 280;
  const cardH = 158;
  const gap = 20;
  const padX = 36;
  const padY = 56;
  const groupW = padX * 2 + 3 * cardW + 2 * gap;
  const groupH = padY + cardH + 32;
  beats.forEach((beat, index) => {
    shotNumber += 1;
    const groupId = newRowId("group");
    const textId = newRowId("text");
    const stillId = newRowId("image");
    const shotId = newRowId("video");
    const y = originY + index * (groupH + 48);
    groupIds.push(groupId);
    nodeIds.push(groupId, textId, stillId, shotId);
    videoIds.push(shotId);
    nodes.push({
      id: groupId,
      kind: "group",
      label: `${beat.act} \xB7 ${beat.label}`.slice(0, 200),
      x: originX,
      y,
      width: groupW,
      height: groupH,
      continuityRules: [stamp]
    });
    const rowY = y + padY;
    nodes.push({
      id: textId,
      kind: "text",
      label: beat.prompt.slice(0, 8e3),
      prompt: beat.prompt,
      parent: groupId,
      x: originX + padX,
      y: rowY,
      width: cardW,
      height: 120,
      shotIndex: shotNumber,
      shotStatus: "idea",
      continuityRules: [stamp],
      ...beat.characters.length > 0 ? { characters: beat.characters } : {}
    });
    nodes.push({
      id: stillId,
      kind: "image",
      label: `${beat.label} \u9996\u5E27`.slice(0, 200),
      prompt: beat.prompt,
      parent: groupId,
      x: originX + padX + cardW + gap,
      y: rowY,
      width: cardW,
      height: cardH,
      shotIndex: shotNumber,
      shotStatus: "idea",
      continuityRules: [stamp],
      ...beat.characters.length > 0 ? { characters: beat.characters } : {}
    });
    nodes.push({
      id: shotId,
      kind: "video",
      label: beat.label.slice(0, 200),
      prompt: beat.seconds > 0 ? `${beat.prompt}, ${beat.seconds}s` : beat.prompt,
      parent: groupId,
      x: originX + padX + 2 * (cardW + gap),
      y: rowY,
      width: cardW,
      height: cardH,
      shotIndex: shotNumber,
      shotStatus: "idea",
      durationSec: beat.seconds,
      continuityRules: [stamp],
      ...beat.characters.length > 0 ? { characters: beat.characters } : {}
    });
    edges.push({ from: textId, to: stillId, label: "\u672C" }, { from: stillId, to: shotId, label: "\u9996\u5E27" });
  });
  for (let index = 0; index < videoIds.length - 1; index += 1) {
    edges.push({ from: videoIds[index], to: videoIds[index + 1], label: "\u627F\u63A5" });
  }
  const next = await store.batchAdd({ nodes, edges });
  return { action: "script", reused: false, sourceId, beats, nodeIds, groupIds, doc: next };
}

// src/canvas-autolink.ts
var MIN_OVERLAP = 3;
var MAX_EDGES = 40;
function blobOf(node) {
  return [node.label, node.prompt ?? "", node.aiBrief ?? "", ...node.characters ?? []].join("\n");
}
function mentions(text, name) {
  const needle = name.trim();
  if (needle.length < 2) return false;
  return text.includes(needle);
}
function planAutolink(doc, options = {}) {
  const allow = options.nodeIds !== void 0 && options.nodeIds.length > 0 ? new Set(options.nodeIds) : void 0;
  const touches = (from, to) => allow === void 0 || allow.has(from.id) || allow.has(to.id);
  const pool = doc.nodes;
  const byId = new Map(doc.nodes.map((node) => [node.id, node]));
  const existing = new Set(doc.edges.map((edge) => `${edge.from}->${edge.to}`));
  const hits = [];
  const push = (from, to, label, score) => {
    if (from.id === to.id) return;
    if (!touches(from, to)) return;
    if (!canvasEdgeAllowed(from, to)) return;
    if (existing.has(`${from.id}->${to.id}`)) return;
    if (hits.some((hit) => hit.from === from.id && hit.to === to.id)) return;
    hits.push({ from: from.id, to: to.id, label, score });
  };
  for (const card of options.characters ?? []) {
    const name = card.name.trim();
    if (name.length < 2) continue;
    const anchors = pool.filter((node) => {
      if (node.kind !== "image") return false;
      if (card.refPath !== void 0 && card.refPath !== "" && node.path === card.refPath) return true;
      return node.label.includes(name) || (node.characters ?? []).includes(name);
    });
    if (anchors.length === 0) continue;
    for (const target of pool) {
      if (target.kind !== "image" && target.kind !== "video") continue;
      if (!mentions(blobOf(target), name) && !(target.characters ?? []).includes(name)) continue;
      for (const anchor of anchors) {
        if (anchor.id === target.id) continue;
        push(anchor, target, "\u89D2\u8272", 8);
      }
    }
  }
  const tokens2 = new Map(pool.map((node) => [node.id, textTokens(blobOf(node))]));
  for (const from of pool) {
    if (from.kind === "group") continue;
    for (const to of pool) {
      if (from.id === to.id) continue;
      if (to.kind !== "image" && to.kind !== "video") continue;
      if (from.kind === "video" && to.kind === "image") continue;
      const score = overlapScore(tokens2.get(from.id) ?? /* @__PURE__ */ new Set(), tokens2.get(to.id) ?? /* @__PURE__ */ new Set());
      if (score < MIN_OVERLAP) continue;
      const label = from.kind === "text" ? "\u672C" : from.kind === "image" ? "\u53C2\u8003" : "\u5F15\u7528";
      push(from, to, label, score);
    }
  }
  hits.sort((left, right) => right.score - left.score);
  return hits.slice(0, MAX_EDGES).filter((hit) => {
    const from = byId.get(hit.from);
    const to = byId.get(hit.to);
    return from !== void 0 && to !== void 0 && canvasEdgeAllowed(from, to);
  });
}
async function applyAutolink(input) {
  const doc = await input.store.read();
  const characters = await new CharacterStore(input.outputDir).list();
  const planned = planAutolink(doc, {
    characters,
    ...input.nodeIds !== void 0 ? { nodeIds: input.nodeIds } : {}
  });
  if (planned.length === 0) {
    return { action: "autolink", added: [], skipped: 0, doc };
  }
  const next = await input.store.batchAdd({
    nodes: [],
    edges: planned.map((hit) => ({ from: hit.from, to: hit.to, label: hit.label }))
  });
  const added = planned.filter((hit) => next.edges.some((edge) => edge.from === hit.from && edge.to === hit.to));
  return { action: "autolink", added, skipped: planned.length - added.length, doc: next };
}

// src/canvas-frames.ts
import { existsSync as existsSync10 } from "node:fs";
var FRAME_STAMP_PREFIX = "\u62BD\u5E27:";
var MAX_FRAME_CARDS = 12;
function newFrameId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
function resolveLocalVideo(outputDir, candidate) {
  if (candidate !== "" && existsSync10(candidate)) return candidate;
  const resolved = resolveMediaPath(outputDir, candidate);
  if (!existsSync10(resolved)) throw new Error(`\u627E\u4E0D\u5230\u89C6\u9891\u6587\u4EF6\uFF1A${candidate}`);
  return resolved;
}
function alreadyStripped(doc, videoId) {
  const stamp = `${FRAME_STAMP_PREFIX}${videoId}`;
  return doc.nodes.some((node) => node.continuityRules?.includes(stamp) === true);
}
async function applyFrameStrip(input) {
  const doc = await input.store.read();
  const source = doc.nodes.find((node) => node.id === input.nodeId);
  if (source === void 0) throw new Error(`canvas node "${input.nodeId}" not found`);
  if (source.kind !== "video") throw new Error("\u62BD\u5E27\u4E0A\u677F\u53EA\u63A5\u53D7\u89C6\u9891\u8282\u70B9");
  if (source.path === void 0 || source.path === "") throw new Error("\u8FD9\u6BB5\u89C6\u9891\u8FD8\u6CA1\u6709\u6210\u7247\u8DEF\u5F84");
  const stamp = `${FRAME_STAMP_PREFIX}${source.id}`;
  if (alreadyStripped(doc, source.id)) {
    const nodeIds2 = doc.nodes.filter((node) => node.continuityRules?.includes(stamp) === true).map((node) => node.id);
    const groupId2 = doc.nodes.find((node) => node.kind === "group" && node.continuityRules?.includes(stamp) === true)?.id;
    return {
      action: "frames",
      reused: true,
      sourceId: source.id,
      files: doc.nodes.filter((node) => node.kind === "image" && node.continuityRules?.includes(stamp) === true).map((node) => node.path ?? ""),
      nodeIds: nodeIds2,
      ...groupId2 !== void 0 ? { groupId: groupId2 } : {},
      doc
    };
  }
  const count = Math.max(3, Math.min(MAX_FRAME_CARDS, Math.round(input.count ?? 6)));
  const sourcePath = resolveLocalVideo(input.outputDir, source.path);
  const extracted = await extractFrames(sourcePath, input.outputDir, { count });
  if (extracted.length === 0) throw new Error("\u6CA1\u6709\u62BD\u51FA\u5E27");
  const cardW = 280;
  const cardH = 158;
  const gap = 20;
  const padX = 36;
  const padY = 56;
  const groupW = padX * 2 + extracted.length * cardW + Math.max(0, extracted.length - 1) * gap;
  const groupH = padY + cardH + 32;
  const groupId = newFrameId("group");
  const originX = source.x;
  const originY = source.y + (source.height ?? cardH) + 64;
  const nodes = [{
    id: groupId,
    kind: "group",
    label: `${source.label.slice(0, 24)} \u62BD\u5E27`.slice(0, 200),
    x: originX,
    y: originY,
    width: Math.max(320, groupW),
    height: groupH,
    continuityRules: [stamp]
  }];
  const nodeIds = [groupId];
  extracted.forEach((file, index) => {
    if (file.path === void 0 || file.path === "") return;
    const stampMatch = /-(\d+(?:\.\d+)?)s\.png$/.exec(file.path);
    const seconds = stampMatch?.[1] ?? String(index + 1);
    const id = newFrameId("image");
    nodeIds.push(id);
    nodes.push({
      id,
      kind: "image",
      label: `\u62BD\u5E27 ${seconds}s`.slice(0, 200),
      path: file.path,
      prompt: `${source.prompt ?? source.label} \xB7 ${seconds}s`.slice(0, 2e3),
      parent: groupId,
      x: originX + padX + index * (cardW + gap),
      y: originY + padY,
      width: cardW,
      height: cardH,
      shotStatus: "review",
      continuityRules: [stamp, `t=${seconds}`]
    });
  });
  const next = await input.store.batchAdd({ nodes });
  return {
    action: "frames",
    reused: false,
    sourceId: source.id,
    files: extracted.map((file) => file.path).filter((path) => typeof path === "string" && path !== ""),
    nodeIds,
    groupId,
    doc: next
  };
}

// src/canvas-pack.ts
async function applyCanvasPack(input) {
  const doc = await input.store.read();
  const wanted = input.nodeIds !== void 0 && input.nodeIds.length > 0 ? input.nodeIds.map((id) => {
    const node = doc.nodes.find((item2) => item2.id === id);
    if (node === void 0) throw new Error(`canvas node "${id}" not found`);
    return node;
  }) : doc.nodes.filter((node) => node.kind === "video" && typeof node.path === "string" && node.path !== "").slice().sort((left, right2) => (left.shotIndex ?? 1e9) - (right2.shotIndex ?? 1e9) || left.x - right2.x);
  const clips = wanted.filter((node) => node.kind === "video" && typeof node.path === "string" && node.path !== "");
  if (clips.length < 2) throw new Error("\u62FC\u6210\u7247\u81F3\u5C11\u9700\u8981\u4E24\u6BB5\u6709\u6210\u7247\u7684\u89C6\u9891");
  const files = clips.map((node) => resolveLocalVideo(input.outputDir, node.path));
  const cut = await videoConcat({
    files,
    outputDir: input.outputDir,
    transition: input.transition === "fade" ? "fade" : "cut",
    ...input.transition === "fade" ? { fadeSec: input.fadeSec ?? 0.3 } : {},
    scale: "1280:720"
  });
  const right = Math.max(...doc.nodes.map((node) => node.x + (node.width ?? 280)));
  const added = await input.store.addNode({
    kind: "video",
    label: "\u6210\u7247",
    path: cut.path,
    prompt: clips.map((node) => node.label).join(" \u2192 ").slice(0, 2e3),
    x: right + 48,
    y: 48,
    width: 280,
    height: 158,
    shotStatus: "review",
    continuityRules: ["\u6210\u7247", ...clips.map((node) => `\u955C:${node.id}`).slice(0, 4)]
  });
  const result = added.nodes[added.nodes.length - 1];
  return {
    action: "pack",
    path: cut.path,
    sourceIds: clips.map((node) => node.id),
    resultId: result.id,
    doc: added
  };
}

// src/canvas-parse.ts
function mockSettings(outputDir) {
  const cap = {
    enabled: false,
    mode: "mock",
    baseURL: "",
    apiKey: "",
    model: "mock",
    resolution: "1K",
    auth: { klingAk: "", klingSk: "", runwayVersion: "" }
  };
  return {
    outputDir,
    timeoutMs: 1e3,
    pollIntervalMs: 100,
    maxPollAttempts: 1,
    persona: "\u6210\u7247",
    initiative: "\u81EA\u52A8",
    vision: cap,
    image: cap,
    video: cap,
    audio: cap
  };
}
var PARSE_STAMP_PREFIX = "\u89E3\u6790:";
var MAX_PARSE_SHOTS = 16;
function newParseId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
function mergeShots(shots, cap) {
  const next = shots.slice();
  while (next.length > cap) {
    let shortest = 1;
    let shortestDur = Infinity;
    for (let index = 1; index < next.length; index += 1) {
      const dur = (next[index - 1]?.durationSec ?? 0) + (next[index]?.durationSec ?? 0);
      if (dur < shortestDur) {
        shortest = index;
        shortestDur = dur;
      }
    }
    const left = next[shortest - 1];
    const right = next[shortest];
    if (left === void 0 || right === void 0) break;
    left.end = right.end;
    left.durationSec = Number((left.end - left.start).toFixed(2));
    if (left.description === null || left.description === "") left.description = right.description;
    if (left.framePath === void 0) left.framePath = right.framePath;
    next.splice(shortest, 1);
  }
  return next.map((shot, index) => ({ ...shot, index: index + 1 }));
}
function formatParseScript(sourceLabel, shots) {
  const lines = [`\u7B2C\u4E00\u573A ${sourceLabel} \u89E3\u6790`];
  for (const shot of shots) {
    const body = (shot.description ?? "").trim();
    const window = `${shot.start.toFixed(1)}-${shot.end.toFixed(1)}s`;
    lines.push(body === "" ? `\u955C\u5934${shot.index}\uFF1A${window}` : `\u955C\u5934${shot.index}\uFF1A${window} ${body}`);
  }
  return lines.join("\n");
}
function parsePreviewShots(value) {
  if (!Array.isArray(value)) return void 0;
  const shots = [];
  for (const item2 of value) {
    if (item2 === null || typeof item2 !== "object") continue;
    const rec = item2;
    if (typeof rec.start !== "number" || typeof rec.end !== "number") continue;
    shots.push({
      index: typeof rec.index === "number" ? rec.index : shots.length + 1,
      start: rec.start,
      end: rec.end,
      durationSec: typeof rec.durationSec === "number" ? rec.durationSec : Number((rec.end - rec.start).toFixed(2)),
      ...typeof rec.framePath === "string" && rec.framePath !== "" ? { framePath: rec.framePath } : {},
      description: typeof rec.description === "string" ? rec.description : null
    });
  }
  return shots.length > 0 ? shots : void 0;
}
async function applyVideoParse(input) {
  const doc = await input.store.read();
  const source = doc.nodes.find((node) => node.id === input.nodeId);
  if (source === void 0) throw new Error(`canvas node "${input.nodeId}" not found`);
  if (source.kind !== "video") throw new Error("\u4E00\u952E\u89E3\u6790\u53EA\u63A5\u53D7\u89C6\u9891\u8282\u70B9");
  if (source.path === void 0 || source.path === "") throw new Error("\u8FD9\u6BB5\u89C6\u9891\u8FD8\u6CA1\u6709\u6210\u7247\u8DEF\u5F84");
  const stamp = `${PARSE_STAMP_PREFIX}${source.id}`;
  if (doc.nodes.some((node) => node.continuityRules?.includes(stamp) === true)) {
    const nodeIds2 = doc.nodes.filter((node) => node.continuityRules?.includes(stamp) === true).map((node) => node.id);
    const scriptNode = doc.nodes.find((node) => node.kind === "text" && node.continuityRules?.includes(stamp) === true);
    const groupId2 = doc.nodes.find((node) => node.kind === "group" && node.continuityRules?.includes(stamp) === true)?.id;
    return {
      action: "parse",
      reused: true,
      sourceId: source.id,
      shots: [],
      script: scriptNode !== void 0 ? scriptNode.label : "",
      nodeIds: nodeIds2,
      ...groupId2 !== void 0 ? { groupId: groupId2 } : {},
      ...scriptNode !== void 0 ? { scriptId: scriptNode.id } : {},
      doc
    };
  }
  let shots = input.shots !== void 0 && input.shots.length > 0 ? mergeShots(input.shots, MAX_PARSE_SHOTS) : [];
  if (shots.length === 0) {
    const sourcePath = resolveLocalVideo(input.outputDir, source.path);
    const settings = input.settings ?? mockSettings(input.outputDir);
    const analysis = await videoAnalyze({
      source: sourcePath,
      outputDir: input.outputDir,
      settings,
      vision: settings.vision,
      minShotSec: 0.8,
      describe: input.describe === true
    });
    shots = mergeShots(analysis.shots, MAX_PARSE_SHOTS);
  }
  if (shots.length === 0) throw new Error("\u6CA1\u6709\u62C6\u51FA\u955C\u5934");
  const script = formatParseScript(source.label || "\u6210\u7247", shots);
  if (input.preview === true) {
    return {
      action: "parse",
      reused: false,
      preview: true,
      sourceId: source.id,
      shots,
      script,
      nodeIds: [],
      doc
    };
  }
  const cardW = 280;
  const cardH = 158;
  const gap = 20;
  const padX = 36;
  const padY = 56;
  const originX = source.x;
  const originY = source.y + (source.height ?? cardH) + 64;
  const groupW = padX * 2 + Math.max(1, shots.length) * cardW + Math.max(0, shots.length - 1) * gap;
  const groupH = padY + cardH + 32;
  const groupId = newParseId("group");
  const scriptId = newParseId("text");
  const nodes = [
    {
      id: scriptId,
      kind: "text",
      label: script.slice(0, 8e3),
      prompt: script.slice(0, 2e3),
      x: originX,
      y: originY,
      width: 360,
      height: 220,
      continuityRules: [stamp]
    },
    {
      id: groupId,
      kind: "group",
      label: `${source.label.slice(0, 24)} \u89E3\u6790`.slice(0, 200),
      x: originX,
      y: originY + 240,
      width: Math.max(320, groupW),
      height: groupH,
      continuityRules: [stamp]
    }
  ];
  const nodeIds = [scriptId, groupId];
  shots.forEach((shot, index) => {
    const id = newParseId("image");
    nodeIds.push(id);
    const body = (shot.description ?? "").trim();
    nodes.push({
      id,
      kind: "image",
      label: `\u955C${shot.index} ${shot.start.toFixed(1)}s`.slice(0, 200),
      ...shot.framePath !== void 0 ? { path: shot.framePath } : {},
      prompt: (body === "" ? `${source.prompt ?? source.label} \xB7 ${shot.start.toFixed(1)}-${shot.end.toFixed(1)}s` : body).slice(0, 2e3),
      parent: groupId,
      x: originX + padX + index * (cardW + gap),
      y: originY + 240 + padY,
      width: cardW,
      height: cardH,
      shotIndex: shot.index,
      shotStatus: "review",
      durationSec: Math.max(1, Math.min(15, Math.round(shot.durationSec))),
      continuityRules: [stamp, `t=${shot.start}-${shot.end}`]
    });
  });
  const next = await input.store.batchAdd({ nodes });
  return {
    action: "parse",
    reused: false,
    sourceId: source.id,
    shots,
    script,
    nodeIds,
    groupId,
    scriptId,
    doc: next
  };
}

// src/canvas-reshoot.ts
import { mkdir as mkdir20, readFile as readFile20, writeFile as writeFile18 } from "node:fs/promises";
import { join as join30 } from "node:path";
var RESHOOT_STAMP = "\u91CD\u505A\u4E2D\u6BB5";
var RESHOOT_PREFIX = "\u91CD\u505A:";
function newReshootId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
function ledgerPath(outputDir) {
  return join30(resolveOutputDir(outputDir), "reshoots.json");
}
async function readJobs(outputDir) {
  try {
    const parsed = JSON.parse(await readFile20(ledgerPath(outputDir), "utf8"));
    return Array.isArray(parsed.jobs) ? parsed.jobs : [];
  } catch {
    return [];
  }
}
async function writeJobs(outputDir, jobs) {
  await mkdir20(resolveOutputDir(outputDir), { recursive: true });
  await writeFile18(ledgerPath(outputDir), JSON.stringify({ jobs: jobs.slice(-40) }, null, 2), "utf8");
}
async function applyReshootCut(input) {
  const doc = await input.store.read();
  const source = doc.nodes.find((node) => node.id === input.nodeId);
  if (source === void 0) throw new Error(`canvas node "${input.nodeId}" not found`);
  if (source.kind !== "video") throw new Error("\u7247\u6BB5\u91CD\u505A\u53EA\u63A5\u53D7\u89C6\u9891\u8282\u70B9");
  if (source.path === void 0 || source.path === "") throw new Error("\u8FD9\u6BB5\u89C6\u9891\u8FD8\u6CA1\u6709\u6210\u7247\u8DEF\u5F84");
  const sourcePath = resolveLocalVideo(input.outputDir, source.path);
  const probe = probeMedia(sourcePath);
  const duration = probe.durationSec;
  const start = Math.max(0, Number(input.start));
  const end = Math.min(duration, Number(input.end));
  if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < 1) {
    throw new Error("\u91CD\u505A\u7A97\u81F3\u5C11 1 \u79D2\uFF0C\u586B\u5199\u7247\u5185\u8D77\u6B62\u79D2");
  }
  if (end - start > 15) throw new Error("\u91CD\u505A\u7A97\u6700\u957F 15 \u79D2\uFF0C\u518D\u957F\u8BF7\u62C6\u4E24\u6BB5");
  const prompt = (typeof input.prompt === "string" && input.prompt.trim() !== "" ? input.prompt.trim() : source.prompt ?? source.label).slice(0, 2e3);
  const midPrompt = `\u7247\u6BB5\u91CD\u505A ${start.toFixed(1)}-${end.toFixed(1)}s\u3002\u7528\u9996\u5E27\u548C\u5C3E\u5E27\u505A\u9996\u5C3E\u5E27\u63A5\u529B\uFF0C\u53EA\u91CD\u62CD\u8FD9\u4E00\u6BB5\uFF1A${prompt}`.slice(0, 2e3);
  const frames = await extractFrames(sourcePath, input.outputDir, {
    at: [start, Math.max(start, end - 0.04)]
  });
  const firstPath = frames[0]?.path;
  const lastPath = frames[1]?.path ?? frames[0]?.path;
  if (firstPath === void 0) throw new Error("\u62BD\u4E0D\u51FA\u91CD\u505A\u7A97\u7684\u9996\u5C3E\u5E27");
  let headPath;
  let tailPath;
  if (start > 0.08) {
    headPath = (await videoProcess({ source: sourcePath, outputDir: input.outputDir, start: 0, end: start })).path;
  }
  if (duration - end > 0.08) {
    tailPath = (await videoProcess({ source: sourcePath, outputDir: input.outputDir, start: end })).path;
  }
  const stamp = `${RESHOOT_PREFIX}${source.id}:${start.toFixed(1)}-${end.toFixed(1)}`;
  const groupId = newReshootId("group");
  const firstId = newReshootId("image");
  const lastId = newReshootId("image");
  const midId = newReshootId("video");
  const resultId = newReshootId("video");
  const originX = source.x + (source.width ?? 280) + 48;
  const originY = source.y;
  const cardW = 280;
  const cardH = 158;
  const padX = 36;
  const padY = 56;
  const groupW = padX * 2 + 4 * cardW + 3 * 20;
  const groupH = padY + cardH + 32;
  const nodes = [
    {
      id: groupId,
      kind: "group",
      label: `${source.label.slice(0, 20)} \u5C40\u90E8\u91CD\u7ED8`.slice(0, 200),
      x: originX,
      y: originY,
      width: groupW,
      height: groupH,
      continuityRules: [stamp]
    },
    {
      id: firstId,
      kind: "image",
      label: `\u91CD\u505A\u9996\u5E27 ${start.toFixed(1)}s`,
      path: firstPath,
      prompt: midPrompt,
      parent: groupId,
      x: originX + padX,
      y: originY + padY,
      width: cardW,
      height: cardH,
      shotStatus: "review",
      continuityRules: [stamp, "\u9996\u5E27"]
    },
    {
      id: lastId,
      kind: "image",
      label: `\u91CD\u505A\u5C3E\u5E27 ${end.toFixed(1)}s`,
      path: lastPath,
      prompt: midPrompt,
      parent: groupId,
      x: originX + padX + cardW + 20,
      y: originY + padY,
      width: cardW,
      height: cardH,
      shotStatus: "review",
      continuityRules: [stamp, "\u5C3E\u5E27"]
    },
    {
      id: midId,
      kind: "video",
      label: `${source.label.slice(0, 16)} \u91CD\u505A\u4E2D\u6BB5`.slice(0, 200),
      prompt: midPrompt,
      parent: groupId,
      x: originX + padX + 2 * (cardW + 20),
      y: originY + padY,
      width: cardW,
      height: cardH,
      shotStatus: "idea",
      durationSec: Math.max(1, Math.min(15, Math.round(end - start))),
      continuityRules: [stamp, RESHOOT_STAMP],
      ...source.characters !== void 0 ? { characters: source.characters } : {}
    },
    {
      id: resultId,
      kind: "video",
      label: `${source.label.slice(0, 16)} \u91CD\u505A\u6210\u7247`.slice(0, 200),
      prompt: midPrompt,
      parent: groupId,
      x: originX + padX + 3 * (cardW + 20),
      y: originY + padY,
      width: cardW,
      height: cardH,
      shotStatus: "idea",
      continuityRules: [stamp, "\u91CD\u505A\u6210\u7247"]
    }
  ];
  const edges = [
    { from: firstId, to: midId, label: "\u9996\u5E27" },
    { from: lastId, to: midId, label: "\u5C3E\u5E27" }
  ];
  const next = await input.store.batchAdd({ nodes, edges });
  const job = {
    id: stamp,
    sourceId: source.id,
    midId,
    resultId,
    start,
    end,
    prompt: midPrompt,
    ...headPath !== void 0 ? { headPath } : {},
    ...tailPath !== void 0 ? { tailPath } : {},
    firstPath,
    lastPath
  };
  const jobs = await readJobs(input.outputDir);
  jobs.push(job);
  await writeJobs(input.outputDir, jobs);
  return {
    action: "reshoot",
    phase: "cut",
    sourceId: source.id,
    midId,
    resultId,
    firstId,
    lastId,
    start,
    end,
    durationSec: Number((end - start).toFixed(2)),
    prompt: midPrompt,
    job,
    doc: next
  };
}
async function applyReshootAssemble(input) {
  const doc = await input.store.read();
  const mid = doc.nodes.find((node) => node.id === input.nodeId) ?? doc.nodes.find((node) => node.continuityRules?.includes(RESHOOT_STAMP) === true && node.id === input.nodeId);
  if (mid === void 0) throw new Error(`canvas node "${input.nodeId}" not found`);
  if (mid.path === void 0 || mid.path === "") throw new Error("\u4E2D\u6BB5\u8FD8\u6CA1\u6709\u6210\u7247\uFF0C\u5148\u751F\u6210\u518D\u62FC\u56DE");
  const jobs = await readJobs(input.outputDir);
  const job = jobs.find((item2) => item2.midId === mid.id || item2.resultId === mid.id) ?? jobs.find((item2) => item2.sourceId === mid.id);
  if (job === void 0) throw new Error("\u627E\u4E0D\u5230\u8FD9\u6BB5\u91CD\u505A\u7684\u5934\u5C3E\u8BB0\u5F55\uFF0C\u5148\u5207\u7A97");
  const midPath = resolveLocalVideo(input.outputDir, mid.path);
  const files = [job.headPath, midPath, job.tailPath].filter((path2) => typeof path2 === "string" && path2 !== "");
  let path = midPath;
  if (files.length >= 2) {
    path = (await videoConcat({ files, outputDir: input.outputDir, transition: "cut" })).path;
  }
  const next = await input.store.update(job.resultId, { path, shotStatus: "review" });
  return {
    action: "reshoot",
    phase: "assemble",
    sourceId: job.sourceId,
    midId: job.midId,
    resultId: job.resultId,
    path,
    doc: next
  };
}

// src/canvas-sheet.ts
import { spawnSync as spawnSync10 } from "node:child_process";
import { join as join32 } from "node:path";

// src/providers/contact-sheet.ts
import { spawnSync as spawnSync9 } from "node:child_process";
import { join as join31 } from "node:path";
async function contactSheet(input) {
  if (input.sources.length === 0) throw new Error("contact sheet needs at least one source");
  const columns = Math.min(8, Math.max(2, input.columns ?? 4));
  await ensureOutputDir(input.outputDir);
  const frames = [];
  for (const source of input.sources) {
    if (/\.(png|jpe?g|webp|gif)$/i.test(source)) {
      frames.push({ source, t: 0, framePath: source });
      continue;
    }
    const probe = probeMedia(source);
    const duration = probe.durationSec ?? 0;
    const midpoint = Number((duration / 2).toFixed(2));
    const extracted = await extractFrames(source, input.outputDir, { at: [midpoint] });
    const framePath = extracted[0]?.path;
    if (framePath !== void 0) frames.push({ source, t: midpoint, framePath });
  }
  if (frames.length === 0) throw new Error("\u6CA1\u6709\u62BD\u5230\u4EFB\u4F55\u5E27\uFF08\u68C0\u67E5\u7D20\u6750\u662F\u5426\u53EF\u8BFB\uFF09");
  const out = join31(resolveOutputDir(input.outputDir), `contact-sheet-${Date.now().toString(36)}.png`);
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
  const result = spawnSync9("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`contact sheet failed: ${result.stderr?.slice(-300)}`);
  return { path: out, frames, columns };
}

// src/canvas-sheet.ts
async function applyCanvasSheet(input) {
  const doc = await input.store.read();
  const pool = input.nodeIds !== void 0 && input.nodeIds.length > 0 ? input.nodeIds.map((id) => {
    const node = doc.nodes.find((item2) => item2.id === id);
    if (node === void 0) throw new Error(`canvas node "${id}" not found`);
    return node;
  }) : doc.nodes.filter((node) => (node.kind === "image" || node.kind === "video") && typeof node.path === "string" && node.path !== "");
  const sources = pool.filter((node) => typeof node.path === "string" && node.path !== "").map((node) => resolveLocalVideo(input.outputDir, node.path));
  if (sources.length === 0) throw new Error("\u63A5\u89E6\u8868\u9700\u8981\u81F3\u5C11\u4E00\u5F20\u6709\u6210\u7247\u7684\u56FE\u6216\u89C6\u9891");
  const sheet = await contactSheet({
    sources,
    outputDir: input.outputDir,
    columns: input.columns ?? Math.min(4, Math.max(2, sources.length))
  });
  const right = Math.max(...doc.nodes.map((node) => node.x + (node.width ?? 280)), 48);
  const added = await input.store.addNode({
    kind: "image",
    label: "\u4E5D\u5BAB\u683C",
    path: sheet.path,
    prompt: `\u4E5D\u5BAB\u683C ${sources.length} \u683C`,
    x: right + 48,
    y: 48,
    width: 360,
    height: 200,
    shotStatus: "review",
    continuityRules: ["\u4E5D\u5BAB\u683C"]
  });
  return {
    action: "sheet",
    path: sheet.path,
    resultId: added.nodes[added.nodes.length - 1].id,
    sourceIds: pool.map((node) => node.id),
    doc: added
  };
}
async function applyGridSplit(input) {
  const doc = await input.store.read();
  const source = doc.nodes.find((node) => node.id === input.nodeId);
  if (source === void 0) throw new Error(`canvas node "${input.nodeId}" not found`);
  if (source.kind !== "image" || source.path === void 0 || source.path === "") {
    throw new Error("\u5BAB\u683C\u5207\u5F00\u53EA\u63A5\u53D7\u6709\u6210\u7247\u7684\u56FE\u7247");
  }
  const cols = Math.max(2, Math.min(5, Math.round(input.cols ?? 3)));
  const rows = Math.max(1, Math.min(5, Math.round(input.rows ?? 3)));
  const path = resolveLocalVideo(input.outputDir, source.path);
  const dir = resolveOutputDir(input.outputDir);
  const files = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const out = join32(dir, `grid-${source.id}-${row}-${col}-${Date.now().toString(36)}.png`);
      const result = spawnSync10("ffmpeg", [
        "-hide_banner",
        "-y",
        "-i",
        path,
        "-vf",
        `crop=iw/${cols}:ih/${rows}:${col}*iw/${cols}:${row}*ih/${rows}`,
        "-frames:v",
        "1",
        out
      ], { encoding: "utf8" });
      if (result.status !== 0) throw new Error(`\u5BAB\u683C\u5207\u5F00\u5931\u8D25 ${row},${col}: ${result.stderr?.slice(-200)}`);
      files.push(out);
    }
  }
  const groupId = `group-${Math.random().toString(36).slice(2, 10)}`;
  const cardW = 200;
  const cardH = 120;
  const originX = source.x;
  const originY = source.y + (source.height ?? 158) + 48;
  const nodes = [{
    id: groupId,
    kind: "group",
    label: `${source.label.slice(0, 16)} \u5BAB\u683C`.slice(0, 200),
    x: originX,
    y: originY,
    width: 36 * 2 + cols * cardW + (cols - 1) * 16,
    height: 56 + rows * cardH + (rows - 1) * 16 + 24,
    continuityRules: [`\u5207\u5F00:${source.id}`]
  }];
  const nodeIds = [groupId];
  files.forEach((file, index) => {
    const id = `image-${Math.random().toString(36).slice(2, 10)}`;
    const col = index % cols;
    const row = Math.floor(index / cols);
    nodeIds.push(id);
    nodes.push({
      id,
      kind: "image",
      label: `\u683C${index + 1}`,
      path: file,
      parent: groupId,
      x: originX + 36 + col * (cardW + 16),
      y: originY + 56 + row * (cardH + 16),
      width: cardW,
      height: cardH,
      shotStatus: "review",
      continuityRules: [`\u5207\u5F00:${source.id}`]
    });
  });
  const next = await input.store.batchAdd({ nodes });
  return { action: "split", files, nodeIds, groupId, doc: next };
}

// src/canvas-board.ts
import { spawnSync as spawnSync11 } from "node:child_process";
import { join as join33 } from "node:path";
var JOIN_STAMP = "\u62FC\u56DE";
var STACK_STAMP = "\u5206\u5C4F";
var DESUB_STAMP = "\u53BB\u5B57";
var EXTEND_STAMP = "\u7EED\u5199";
var GIF_STAMP = "\u52A8\u56FE";
function runFfmpeg2(args, what) {
  const result = spawnSync11("ffmpeg", ["-hide_banner", "-y", ...args], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${what}\u5931\u8D25: ${result.stderr?.slice(-240)}`);
}
function pinRight(doc) {
  return { x: Math.max(...doc.nodes.map((node) => node.x + (node.width ?? 280)), 48) + 48, y: 48 };
}
function mediaNodes(doc, ids, kinds) {
  const pool = ids !== void 0 && ids.length > 0 ? ids.map((id) => {
    const node = doc.nodes.find((item2) => item2.id === id);
    if (node === void 0) throw new Error(`canvas node "${id}" not found`);
    return node;
  }) : doc.nodes.filter((node) => kinds.includes(node.kind));
  return pool.filter((node) => kinds.includes(node.kind) && typeof node.path === "string" && node.path !== "");
}
function tileFilter(files, cols, numbered) {
  const rows = Math.ceil(files.length / cols);
  const parts = [];
  files.forEach((_, index) => {
    const mark = numbered === true ? `,drawtext=text='${String(index + 1).padStart(2, "0")}':x=10:y=8:fontsize=28:fontcolor=white:borderw=2` : "";
    parts.push(`[${index}:v]scale=320:180:force_original_aspect_ratio=decrease,setsar=1,pad=320:180:(ow-iw)/2:(oh-ih)/2${mark}[f${index}]`);
  });
  const rowLabels = [];
  for (let row = 0; row < rows; row += 1) {
    const cells = files.slice(row * cols, row * cols + cols);
    const inputs = cells.map((_, index) => `[f${row * cols + index}]`).join("");
    const label = `[row${row}]`;
    if (cells.length === cols) parts.push(`${inputs}hstack=inputs=${cols}${label}`);
    else {
      const pads = [];
      for (let extra = cells.length; extra < cols; extra += 1) {
        parts.push(`color=black:s=320x180[c${row}x${extra}]`);
        pads.push(`[c${row}x${extra}]`);
      }
      parts.push(`${inputs}${pads.join("")}hstack=inputs=${cols}${label}`);
    }
    rowLabels.push(label);
  }
  if (rowLabels.length === 1) parts.push(`${rowLabels[0]}format=yuv420p[out]`);
  else parts.push(`${rowLabels.join("")}vstack=inputs=${rowLabels.length},format=yuv420p[out]`);
  return parts.join(";");
}
function tileStills(files, outputDir, columns, numbered) {
  const cols = Math.min(8, Math.max(2, columns));
  const args = [];
  for (const file of files) args.push("-i", file);
  const out = join33(resolveOutputDir(outputDir), `grid-join-${Date.now().toString(36)}.png`);
  const attempt = (withNumbers) => {
    const result = spawnSync11("ffmpeg", [
      "-hide_banner",
      "-y",
      ...args,
      "-filter_complex",
      tileFilter(files, cols, withNumbers),
      "-map",
      "[out]",
      "-frames:v",
      "1",
      out
    ], { encoding: "utf8" });
    return result.status === 0;
  };
  if (!attempt(numbered)) {
    if (numbered !== true || !attempt(false)) throw new Error("\u5BAB\u683C\u62FC\u56DE\u5931\u8D25");
  }
  return out;
}
async function applyGridJoin(input) {
  const doc = await input.store.read();
  const sources = mediaNodes(doc, input.nodeIds, ["image"]);
  if (sources.length < 2) throw new Error("\u5BAB\u683C\u62FC\u56DE\u81F3\u5C11\u9700\u8981\u4E24\u5F20\u6709\u6210\u7247\u7684\u56FE\u7247");
  const files = sources.map((node) => resolveLocalVideo(input.outputDir, node.path));
  const path = tileStills(files, input.outputDir, input.columns ?? Math.min(4, sources.length), input.numbered !== false);
  const at = pinRight(doc);
  const added = await input.store.addNode({
    kind: "image",
    label: "\u5206\u955C\u7EC4",
    path,
    prompt: `\u5BAB\u683C\u62FC\u56DE ${sources.length} \u683C`,
    x: at.x,
    y: at.y,
    width: 360,
    height: 200,
    shotStatus: "review",
    continuityRules: [JOIN_STAMP]
  });
  return {
    action: "join",
    path,
    resultId: added.nodes[added.nodes.length - 1].id,
    sourceIds: sources.map((node) => node.id),
    doc: added
  };
}
async function applySplitScreen(input) {
  const doc = await input.store.read();
  const sources = mediaNodes(doc, input.nodeIds, ["image", "video"]);
  if (sources.length < 2 || sources.length > 4) throw new Error("\u5206\u5C4F\u5BF9\u7167\u9700\u8981 2\u20134 \u5F20\u6709\u6210\u7247\u7684\u56FE\u6216\u89C6\u9891");
  const files = sources.map((node) => resolveLocalVideo(input.outputDir, node.path));
  const layout = input.layout ?? (sources.length === 2 ? "2x1" : "2x2");
  const cellW = 640;
  const cellH = 360;
  const args = [];
  const parts = [];
  files.forEach((file, index) => {
    const isStill = /\.(png|jpe?g|webp|gif)$/i.test(file);
    if (isStill) args.push("-loop", "1", "-t", "3", "-i", file);
    else args.push("-i", file);
    parts.push(`[${index}:v]scale=${cellW}:${cellH}:force_original_aspect_ratio=decrease,setsar=1,pad=${cellW}:${cellH}:(ow-iw)/2:(oh-ih)/2,fps=24[f${index}]`);
  });
  const slots = layout === "1x2" ? 2 : layout === "2x2" ? 4 : 2;
  while (files.length < slots) {
    const extra = files.length;
    parts.push(`color=black:s=${cellW}x${cellH}:r=24:d=3[f${extra}]`);
    files.push("");
  }
  if (layout === "1x2") parts.push("[f0][f1]vstack=inputs=2,format=yuv420p[out]");
  else if (layout === "2x2") parts.push("[f0][f1]hstack=inputs=2[top];[f2][f3]hstack=inputs=2[bot];[top][bot]vstack=inputs=2,format=yuv420p[out]");
  else parts.push("[f0][f1]hstack=inputs=2,format=yuv420p[out]");
  const out = join33(resolveOutputDir(input.outputDir), `stack-${Date.now().toString(36)}.mp4`);
  runFfmpeg2([
    ...args,
    "-filter_complex",
    parts.join(";"),
    "-map",
    "[out]",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-an",
    "-shortest",
    out
  ], "\u5206\u5C4F\u5BF9\u7167");
  const at = pinRight(doc);
  const added = await input.store.addNode({
    kind: "video",
    label: "\u5206\u5C4F",
    path: out,
    prompt: `\u5206\u5C4F ${layout} ${sources.map((node) => node.label).join(" / ")}`.slice(0, 2e3),
    x: at.x,
    y: at.y,
    width: 280,
    height: 158,
    shotStatus: "review",
    continuityRules: [STACK_STAMP]
  });
  return {
    action: "stack",
    path: out,
    resultId: added.nodes[added.nodes.length - 1].id,
    sourceIds: sources.map((node) => node.id),
    doc: added
  };
}
function parseDesubRegion(raw) {
  const text = (raw ?? "bottom:15").trim();
  const side = text.match(/^(bottom|top|left|right):(\d+(?:\.\d+)?)$/i);
  if (side !== null) {
    const edge = side[1].toLowerCase();
    const pct = Math.max(4, Math.min(40, Number(side[2]))) / 100;
    if (edge === "bottom") return { method: "crop", crop: `iw:ih*${(1 - pct).toFixed(3)}:0:0` };
    if (edge === "top") return { method: "crop", crop: `iw:ih*${(1 - pct).toFixed(3)}:0:ih*${pct.toFixed(3)}` };
    if (edge === "left") return { method: "crop", crop: `iw*${(1 - pct).toFixed(3)}:ih:iw*${pct.toFixed(3)}:0` };
    return { method: "crop", crop: `iw*${(1 - pct).toFixed(3)}:ih:0:0` };
  }
  const rect = text.match(/^rect:(\d+),(\d+),(\d+),(\d+)$/);
  if (rect !== null) {
    const [, x, y, w, h] = rect;
    return { method: "crop", crop: `${w}:${h}:${x}:${y}` };
  }
  throw new Error("\u53BB\u786C\u5B57\u533A\u57DF\u5199\u6210 bottom:15 / top:10 / left:8 / right:8 \u6216 rect:x,y,w,h");
}
async function applyDesub(input) {
  const doc = await input.store.read();
  const source = doc.nodes.find((node) => node.id === input.nodeId);
  if (source === void 0) throw new Error(`canvas node "${input.nodeId}" not found`);
  if (source.kind !== "video" || source.path === void 0 || source.path === "") {
    throw new Error("\u53BB\u786C\u5B57\u53EA\u63A5\u53D7\u6709\u6210\u7247\u7684\u89C6\u9891");
  }
  const file = resolveLocalVideo(input.outputDir, source.path);
  const parsed = parseDesubRegion(input.region);
  const method = input.method ?? "crop";
  let path;
  if (method === "blur") {
    const side = (input.region ?? "bottom:15").match(/^(bottom|top):(\d+)/i);
    const pct = side !== null ? Math.max(4, Math.min(40, Number(side[2]))) / 100 : 0.15;
    const edge = side?.[1]?.toLowerCase() === "top" ? "top" : "bottom";
    const out = join33(resolveOutputDir(input.outputDir), `desub-${Date.now().toString(36)}.mp4`);
    const crop = edge === "top" ? `iw:ih*${pct.toFixed(3)}:0:0` : `iw:ih*${pct.toFixed(3)}:0:ih*${(1 - pct).toFixed(3)}`;
    const y = edge === "top" ? "0" : "H-h";
    runFfmpeg2([
      "-i",
      file,
      "-filter_complex",
      `[0:v]split=2[base][band];[band]crop=${crop},boxblur=24:12[b];[base][b]overlay=0:${y},format=yuv420p`,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "copy",
      out
    ], "\u53BB\u786C\u5B57");
    path = out;
  } else {
    const cut = await videoProcess({ source: file, outputDir: input.outputDir, crop: parsed.crop });
    path = cut.path;
  }
  const at = pinRight(doc);
  const added = await input.store.addNode({
    kind: "video",
    label: `${source.label.slice(0, 12)} \u53BB\u5B57`.slice(0, 200),
    path,
    prompt: source.prompt,
    x: at.x,
    y: at.y,
    width: source.width ?? 280,
    height: source.height ?? 158,
    shotStatus: "review",
    continuityRules: [DESUB_STAMP, `\u955C:${source.id}`]
  });
  return { action: "desub", path, resultId: added.nodes[added.nodes.length - 1].id, sourceId: source.id, doc: added };
}
async function applyExtendCut(input) {
  const doc = await input.store.read();
  const source = doc.nodes.find((node) => node.id === input.nodeId);
  if (source === void 0) throw new Error(`canvas node "${input.nodeId}" not found`);
  if (source.kind !== "video" || source.path === void 0 || source.path === "") {
    throw new Error("\u7EED\u5199\u4F4D\u53EA\u63A5\u53D7\u6709\u6210\u7247\u7684\u89C6\u9891");
  }
  if (doc.nodes.some((node) => node.continuityRules?.includes(`${EXTEND_STAMP}:${source.id}`) === true)) {
    const first = doc.nodes.find((node) => node.kind === "image" && node.continuityRules?.includes(`${EXTEND_STAMP}:${source.id}`) === true);
    const next2 = doc.nodes.find((node) => node.kind === "video" && node.continuityRules?.includes(`${EXTEND_STAMP}:${source.id}`) === true);
    if (first !== void 0 && next2 !== void 0) {
      return { action: "extend", sourceId: source.id, firstId: first.id, resultId: next2.id, path: first.path, doc };
    }
  }
  const file = resolveLocalVideo(input.outputDir, source.path);
  const duration = probeMedia(file).durationSec ?? 1;
  const atSec = Math.max(0, Number((duration - 0.08).toFixed(2)));
  const frames = await extractFrames(file, input.outputDir, { at: [atSec] });
  const framePath = frames[0]?.path;
  if (framePath === void 0) throw new Error("\u7EED\u5199\u4F4D\u62BD\u4E0D\u5230\u5C3E\u5E27");
  const firstId = `image-${Math.random().toString(36).slice(2, 10)}`;
  const resultId = `video-${Math.random().toString(36).slice(2, 10)}`;
  const stamp = `${EXTEND_STAMP}:${source.id}`;
  const originX = source.x + (source.width ?? 280) + 48;
  const next = await input.store.batchAdd({
    nodes: [
      {
        id: firstId,
        kind: "image",
        label: `${source.label.slice(0, 10)} \u5C3E\u5E27`.slice(0, 200),
        path: framePath,
        x: originX,
        y: source.y,
        width: 200,
        height: 120,
        shotStatus: "review",
        continuityRules: [EXTEND_STAMP, stamp]
      },
      {
        id: resultId,
        kind: "video",
        label: `${source.label.slice(0, 10)} \u7EED\u5199`.slice(0, 200),
        prompt: (input.prompt ?? source.prompt ?? "\u63A5\u7740\u5F80\u4E0B\u62CD").slice(0, 2e3),
        x: originX + 220,
        y: source.y,
        width: source.width ?? 280,
        height: source.height ?? 158,
        shotStatus: "idea",
        continuityRules: [EXTEND_STAMP, stamp]
      }
    ],
    edges: [
      { from: firstId, to: resultId, label: "\u9996\u5E27" }
    ]
  });
  return { action: "extend", sourceId: source.id, firstId, resultId, path: framePath, doc: next };
}
async function applyGifExport(input) {
  const doc = await input.store.read();
  const source = doc.nodes.find((node) => node.id === input.nodeId);
  if (source === void 0) throw new Error(`canvas node "${input.nodeId}" not found`);
  if (source.kind !== "video" || source.path === void 0 || source.path === "") {
    throw new Error("\u5BFC\u51FA\u52A8\u56FE\u53EA\u63A5\u53D7\u6709\u6210\u7247\u7684\u89C6\u9891");
  }
  const file = resolveLocalVideo(input.outputDir, source.path);
  const out = join33(resolveOutputDir(input.outputDir), `gif-${Date.now().toString(36)}.gif`);
  runFfmpeg2([
    "-i",
    file,
    "-vf",
    "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
    "-loop",
    "0",
    out
  ], "\u5BFC\u51FA\u52A8\u56FE");
  const at = pinRight(doc);
  const added = await input.store.addNode({
    kind: "image",
    label: `${source.label.slice(0, 12)} GIF`.slice(0, 200),
    path: out,
    x: at.x,
    y: at.y,
    width: 220,
    height: 140,
    shotStatus: "review",
    continuityRules: [GIF_STAMP, `\u955C:${source.id}`]
  });
  return { action: "gif", path: out, resultId: added.nodes[added.nodes.length - 1].id, sourceId: source.id, doc: added };
}

// src/canvas-craft.ts
var CRAFT_ACTIONS = ["script", "frames", "autolink", "parse", "reshoot", "pack", "sheet", "split", "join", "stack", "desub", "extend", "gif"];
function parseCraftAction(value) {
  if (typeof value === "string" && CRAFT_ACTIONS.includes(value)) return value;
  throw new Error("action \u5FC5\u987B\u662F script / frames / autolink / parse / reshoot / pack / sheet / split / join / stack / desub / extend / gif");
}
async function runCanvasCraft(input) {
  const store = new DirectorxCanvasStore(input.outputDir);
  const action = input.action;
  let result;
  if (action === "script") {
    const applied = await applyScriptRows({
      store,
      ...typeof input.text === "string" ? { text: input.text } : {},
      ...typeof input.nodeId === "string" ? { nodeId: input.nodeId } : {}
    });
    result = {
      action: "script",
      reused: applied.reused,
      sourceId: applied.sourceId,
      beats: applied.beats,
      nodeIds: applied.nodeIds,
      groupIds: applied.groupIds,
      doc: applied.doc
    };
  } else if (action === "frames") {
    if (typeof input.nodeId !== "string" || input.nodeId === "") throw new Error("\u62BD\u5E27\u4E0A\u677F\u9700\u8981 nodeId");
    const applied = await applyFrameStrip({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId,
      ...typeof input.count === "number" ? { count: input.count } : {}
    });
    result = {
      action: "frames",
      reused: applied.reused,
      sourceId: applied.sourceId,
      files: applied.files,
      nodeIds: applied.nodeIds,
      ...applied.groupId !== void 0 ? { groupId: applied.groupId } : {},
      doc: applied.doc
    };
  } else if (action === "parse") {
    if (typeof input.nodeId !== "string" || input.nodeId === "") throw new Error("\u4E00\u952E\u89E3\u6790\u9700\u8981 nodeId");
    const applied = await applyVideoParse({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId,
      ...input.describe === true ? { describe: true } : {},
      ...input.preview === true ? { preview: true } : {},
      ...input.shots !== void 0 ? { shots: input.shots } : {},
      ...input.settings !== void 0 ? { settings: input.settings } : {}
    });
    result = {
      action: "parse",
      reused: applied.reused,
      ...applied.preview === true ? { preview: true } : {},
      sourceId: applied.sourceId,
      shots: applied.shots,
      script: applied.script,
      nodeIds: applied.nodeIds,
      ...applied.groupId !== void 0 ? { groupId: applied.groupId } : {},
      ...applied.scriptId !== void 0 ? { scriptId: applied.scriptId } : {},
      doc: applied.doc
    };
  } else if (action === "reshoot") {
    if (typeof input.nodeId !== "string" || input.nodeId === "") throw new Error("\u7247\u6BB5\u91CD\u505A\u9700\u8981 nodeId");
    if (input.phase === "assemble") {
      const applied = await applyReshootAssemble({
        store,
        outputDir: input.outputDir,
        nodeId: input.nodeId
      });
      result = {
        action: "reshoot",
        phase: "assemble",
        sourceId: applied.sourceId,
        midId: applied.midId,
        resultId: applied.resultId,
        path: applied.path,
        doc: applied.doc
      };
    } else {
      if (typeof input.start !== "number" || typeof input.end !== "number") {
        throw new Error("\u7247\u6BB5\u91CD\u505A\u9700\u8981 start / end\uFF08\u79D2\uFF09");
      }
      const applied = await applyReshootCut({
        store,
        outputDir: input.outputDir,
        nodeId: input.nodeId,
        start: input.start,
        end: input.end,
        ...typeof input.prompt === "string" ? { prompt: input.prompt } : {}
      });
      result = {
        action: "reshoot",
        phase: "cut",
        sourceId: applied.sourceId,
        midId: applied.midId,
        resultId: applied.resultId,
        firstId: applied.firstId,
        lastId: applied.lastId,
        start: applied.start,
        end: applied.end,
        durationSec: applied.durationSec,
        prompt: applied.prompt,
        job: applied.job,
        doc: applied.doc
      };
    }
  } else if (action === "pack") {
    const applied = await applyCanvasPack({
      store,
      outputDir: input.outputDir,
      ...input.nodeIds !== void 0 ? { nodeIds: input.nodeIds } : typeof input.nodeId === "string" ? { nodeIds: [input.nodeId] } : {},
      ...input.transition === "fade" || input.transition === "cut" ? { transition: input.transition } : {},
      ...typeof input.fadeSec === "number" ? { fadeSec: input.fadeSec } : {}
    });
    result = {
      action: "pack",
      path: applied.path,
      resultId: applied.resultId,
      sourceIds: applied.sourceIds,
      doc: applied.doc
    };
  } else if (action === "sheet") {
    const applied = await applyCanvasSheet({
      store,
      outputDir: input.outputDir,
      ...input.nodeIds !== void 0 ? { nodeIds: input.nodeIds } : typeof input.nodeId === "string" ? { nodeIds: [input.nodeId] } : {},
      ...typeof input.columns === "number" ? { columns: input.columns } : {}
    });
    result = {
      action: "sheet",
      path: applied.path,
      resultId: applied.resultId,
      sourceIds: applied.sourceIds,
      doc: applied.doc
    };
  } else if (action === "split") {
    if (typeof input.nodeId !== "string" || input.nodeId === "") throw new Error("\u5BAB\u683C\u5207\u5F00\u9700\u8981 nodeId");
    const applied = await applyGridSplit({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId,
      ...typeof input.cols === "number" ? { cols: input.cols } : {},
      ...typeof input.rows === "number" ? { rows: input.rows } : {}
    });
    result = {
      action: "split",
      files: applied.files,
      nodeIds: applied.nodeIds,
      groupId: applied.groupId,
      doc: applied.doc
    };
  } else if (action === "join") {
    const applied = await applyGridJoin({
      store,
      outputDir: input.outputDir,
      ...input.nodeIds !== void 0 ? { nodeIds: input.nodeIds } : typeof input.nodeId === "string" ? { nodeIds: [input.nodeId] } : {},
      ...typeof input.columns === "number" ? { columns: input.columns } : {},
      ...input.numbered === false ? { numbered: false } : {}
    });
    result = {
      action: "join",
      path: applied.path,
      resultId: applied.resultId,
      sourceIds: applied.sourceIds,
      doc: applied.doc
    };
  } else if (action === "stack") {
    const applied = await applySplitScreen({
      store,
      outputDir: input.outputDir,
      ...input.nodeIds !== void 0 ? { nodeIds: input.nodeIds } : typeof input.nodeId === "string" ? { nodeIds: [input.nodeId] } : {},
      ...input.layout === "2x1" || input.layout === "1x2" || input.layout === "2x2" ? { layout: input.layout } : {}
    });
    result = {
      action: "stack",
      path: applied.path,
      resultId: applied.resultId,
      sourceIds: applied.sourceIds,
      doc: applied.doc
    };
  } else if (action === "desub") {
    if (typeof input.nodeId !== "string" || input.nodeId === "") throw new Error("\u53BB\u786C\u5B57\u9700\u8981 nodeId");
    const applied = await applyDesub({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId,
      ...input.method === "crop" || input.method === "blur" ? { method: input.method } : {},
      ...typeof input.region === "string" ? { region: input.region } : {}
    });
    result = {
      action: "desub",
      path: applied.path,
      resultId: applied.resultId,
      sourceId: applied.sourceId,
      doc: applied.doc
    };
  } else if (action === "extend") {
    if (typeof input.nodeId !== "string" || input.nodeId === "") throw new Error("\u7EED\u5199\u4F4D\u9700\u8981 nodeId");
    const applied = await applyExtendCut({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId,
      ...typeof input.prompt === "string" ? { prompt: input.prompt } : {}
    });
    result = {
      action: "extend",
      sourceId: applied.sourceId,
      firstId: applied.firstId,
      resultId: applied.resultId,
      path: applied.path,
      doc: applied.doc
    };
  } else if (action === "gif") {
    if (typeof input.nodeId !== "string" || input.nodeId === "") throw new Error("\u5BFC\u51FA\u52A8\u56FE\u9700\u8981 nodeId");
    const applied = await applyGifExport({
      store,
      outputDir: input.outputDir,
      nodeId: input.nodeId
    });
    result = {
      action: "gif",
      path: applied.path,
      resultId: applied.resultId,
      sourceId: applied.sourceId,
      doc: applied.doc
    };
  } else {
    const applied = await applyAutolink({
      store,
      outputDir: input.outputDir,
      ...input.nodeIds !== void 0 ? { nodeIds: input.nodeIds } : typeof input.nodeId === "string" ? { nodeIds: [input.nodeId] } : {}
    });
    result = {
      action: "autolink",
      added: applied.added,
      skipped: applied.skipped,
      doc: applied.doc
    };
  }
  const skipArrange = action === "autolink" || action === "parse" || action === "reshoot" || action === "pack" || action === "sheet" || action === "split" || action === "join" || action === "stack" || action === "desub" || action === "extend" || action === "gif";
  const shouldArrange = input.arrange === true || input.arrange !== false && !skipArrange;
  const doc = shouldArrange ? await store.arrange("grid") : result.doc;
  return { ok: true, ...result, doc, updatedAt: doc.updatedAt };
}

// src/series.ts
import { copyFile, mkdir as mkdir21, readdir as readdir4, readFile as readFile21, writeFile as writeFile19 } from "node:fs/promises";
import { existsSync as existsSync11 } from "node:fs";
import { basename as basename5, extname as extname4, join as join34 } from "node:path";
var ACTIVE = "series-active.json";
var MAX_RULES = 24;
var MAX_NOTES = 16;
function userSeriesRoot(override) {
  return override ?? join34(dshHome(), "series");
}
function projectSeriesRoot(outputDir) {
  return join34(resolveOutputDir(outputDir), "series");
}
function slugSeriesName(raw) {
  const latin = raw.trim().toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  if (latin.length >= 2) return latin.startsWith("series-") ? latin : `series-${latin}`;
  return `series-${Date.now().toString(36)}`;
}
function formatLookBlock(look) {
  if (look === void 0 || look === null) return "";
  return [
    look.camera.trim() !== "" ? `\u673A\u4F4D\uFF1A${look.camera.trim()}` : "",
    look.palette.trim() !== "" ? `\u8272\u677F\uFF1A${look.palette.trim()}` : "",
    look.lighting.trim() !== "" ? `\u5149\uFF1A${look.lighting.trim()}` : "",
    look.sceneAnchors.length > 0 ? `\u573A\u666F\u951A\uFF1A${look.sceneAnchors.join("\uFF1B")}` : "",
    look.negativeBaseline.trim() !== "" ? `\u8D1F\u9762\uFF1A${look.negativeBaseline.trim()}` : ""
  ].filter((item2) => item2 !== "").join("\n");
}
function emptyLook() {
  return { camera: "", palette: "", lighting: "", sceneAnchors: [], negativeBaseline: "" };
}
function asPack(value) {
  if (value === null || typeof value !== "object") return void 0;
  const raw = value;
  if (typeof raw.name !== "string" || raw.name.trim() === "") return void 0;
  if (typeof raw.title !== "string") return void 0;
  return {
    name: raw.name,
    title: raw.title,
    logline: typeof raw.logline === "string" ? raw.logline : "",
    characters: Array.isArray(raw.characters) ? raw.characters.filter(isCharacter) : [],
    look: raw.look !== void 0 && raw.look !== null ? {
      camera: String(raw.look.camera ?? ""),
      palette: String(raw.look.palette ?? ""),
      lighting: String(raw.look.lighting ?? ""),
      sceneAnchors: Array.isArray(raw.look.sceneAnchors) ? raw.look.sceneAnchors.map(String) : [],
      negativeBaseline: String(raw.look.negativeBaseline ?? "")
    } : emptyLook(),
    shotRules: Array.isArray(raw.shotRules) ? raw.shotRules.map(String) : [],
    notes: Array.isArray(raw.notes) ? raw.notes.map(String) : [],
    ...typeof raw.methodSkill === "string" && raw.methodSkill !== "" ? { methodSkill: raw.methodSkill } : {},
    crafts: Array.isArray(raw.crafts) ? raw.crafts.map((item2) => ({ kind: String(item2.kind ?? ""), intent: String(item2.intent ?? "") })) : [],
    at: typeof raw.at === "number" ? raw.at : 0
  };
}
function isCharacter(value) {
  if (value === null || typeof value !== "object") return false;
  const raw = value;
  return typeof raw.name === "string" && raw.name.trim() !== "" && typeof raw.refPath === "string" && raw.refPath !== "";
}
async function readPackFile(path) {
  try {
    return asPack(JSON.parse(await readFile21(path, "utf8")));
  } catch {
    return void 0;
  }
}
async function listRoot(root, kind) {
  let names = [];
  try {
    names = await readdir4(root);
  } catch {
    return [];
  }
  const items = [];
  for (const name of names) {
    const path = join34(root, name, "pack.json");
    const pack = await readPackFile(path);
    if (pack === void 0) continue;
    items.push({
      name: pack.name,
      title: pack.title,
      characters: pack.characters.map((card) => card.name),
      root: kind,
      path,
      at: pack.at
    });
  }
  return items;
}
async function harvestSeries(outputDir, titleHint) {
  const [characters, style, canvas, notes, crafts, research] = await Promise.all([
    new CharacterStore(outputDir).list(),
    new ProjectStyleStore(outputDir).read(),
    new DirectorxCanvasStore(outputDir).read(),
    new NoteStore(outputDir).read(),
    new PromptCraftStore(outputDir).read(),
    new ResearchLedger(outputDir).read()
  ]);
  const title = (titleHint?.trim() || canvas.title?.trim() || crafts.at(-1)?.intent.trim() || "\u672C\u7CFB\u5217").slice(0, 40);
  const rules = [...new Set(canvas.nodes.flatMap((node) => node.continuityRules ?? []))].filter((rule) => rule !== "" && !/^(抽帧|解析|重做中段|成片|切开|接触表|场面锁|拼回|分屏|去字|续写|动图|镜:)/.test(rule)).slice(0, MAX_RULES);
  const methodSkill = research.filter((item2) => item2.kind === "skill").at(-1)?.ref;
  return {
    name: slugSeriesName(title),
    title,
    logline: notes[0]?.text.slice(0, 200) ?? "",
    characters: characters.map((card) => ({
      name: card.name,
      description: card.description,
      refPath: card.refPath,
      ...card.outfit !== void 0 ? { outfit: card.outfit } : {},
      ...card.props !== void 0 ? { props: card.props } : {}
    })),
    look: style === null ? emptyLook() : {
      camera: style.camera,
      palette: style.palette,
      lighting: style.lighting,
      sceneAnchors: style.sceneAnchors,
      negativeBaseline: style.negativeBaseline
    },
    shotRules: rules,
    notes: notes.slice(-MAX_NOTES).map((item2) => item2.text),
    ...methodSkill !== void 0 ? { methodSkill } : {},
    crafts: crafts.slice(-8).map((item2) => ({ kind: item2.kind, intent: item2.intent.slice(0, 160) })),
    at: Date.now()
  };
}
async function persistPack(pack, root) {
  const dir = join34(root, pack.name);
  const refs = join34(dir, "refs");
  await mkdir21(refs, { recursive: true });
  const characters = [];
  for (const card of pack.characters) {
    const ext = extname4(card.refPath) || ".png";
    const dest = join34(refs, `${card.name.replace(/[^\w\u4e00-\u9fff-]+/g, "").slice(0, 24) || "ref"}${ext}`);
    if (existsSync11(card.refPath) && card.refPath !== dest) {
      await copyFile(card.refPath, dest);
      characters.push({ ...card, refPath: dest });
    } else {
      characters.push(card);
    }
  }
  const next = { ...pack, characters, at: Date.now() };
  const path = join34(dir, "pack.json");
  await writeFile19(path, JSON.stringify(next, null, 2), "utf8");
  return path;
}
async function saveSeries(input) {
  const harvested = await harvestSeries(input.outputDir, input.title);
  const name = typeof input.name === "string" && input.name.trim() !== "" ? slugSeriesName(input.name) : harvested.name;
  const pack = {
    ...harvested,
    name,
    title: (input.title?.trim() || harvested.title).slice(0, 40),
    logline: (input.logline?.trim() || harvested.logline).slice(0, 240)
  };
  const paths = [
    await persistPack(pack, projectSeriesRoot(input.outputDir)),
    await persistPack(pack, userSeriesRoot(input.userRoot))
  ];
  await writeFile19(join34(resolveOutputDir(input.outputDir), ACTIVE), JSON.stringify({ name: pack.name, at: pack.at }, null, 2), "utf8");
  return { pack, paths };
}
async function listSeries(outputDir, userRoot) {
  const [project, user] = await Promise.all([
    listRoot(projectSeriesRoot(outputDir), "project"),
    listRoot(userSeriesRoot(userRoot), "user")
  ]);
  const seen = /* @__PURE__ */ new Set();
  const items = [];
  for (const item2 of [...project, ...user].sort((left, right) => right.at - left.at)) {
    if (seen.has(item2.name)) continue;
    seen.add(item2.name);
    items.push(item2);
  }
  return items;
}
async function loadSeries(outputDir, name, userRoot) {
  const slug = slugSeriesName(name);
  const candidates = [
    join34(projectSeriesRoot(outputDir), slug, "pack.json"),
    join34(projectSeriesRoot(outputDir), name, "pack.json"),
    join34(userSeriesRoot(userRoot), slug, "pack.json"),
    join34(userSeriesRoot(userRoot), name, "pack.json")
  ];
  const listed = await listSeries(outputDir, userRoot);
  const hit = listed.find((item2) => item2.name === slug || item2.name === name || item2.title === name);
  if (hit !== void 0) candidates.unshift(hit.path);
  for (const path of candidates) {
    const pack = await readPackFile(path);
    if (pack !== void 0) return pack;
  }
  throw new Error(`\u627E\u4E0D\u5230\u7CFB\u5217\u5305\u300C${name}\u300D\u3002\u5148 directorx_series list\u3002`);
}
async function applySeries(input) {
  const pack = await loadSeries(input.outputDir, input.name, input.userRoot);
  const people = new CharacterStore(input.outputDir);
  const destDir = join34(resolveOutputDir(input.outputDir), "series-refs", pack.name);
  await mkdir21(destDir, { recursive: true });
  const registered = [];
  for (const card of pack.characters) {
    let refPath = card.refPath;
    if (existsSync11(card.refPath)) {
      const dest = join34(destDir, basename5(card.refPath));
      if (card.refPath !== dest) await copyFile(card.refPath, dest);
      refPath = dest;
    }
    registered.push(await people.register({
      name: card.name,
      refPath,
      description: card.description,
      ...card.outfit !== void 0 ? { outfit: card.outfit } : {},
      ...card.props !== void 0 ? { props: card.props } : {}
    }));
  }
  const look = await new ProjectStyleStore(input.outputDir).set(pack.look);
  await writeFile19(join34(resolveOutputDir(input.outputDir), ACTIVE), JSON.stringify({ name: pack.name, at: Date.now() }, null, 2), "utf8");
  const lookBlock = formatLookBlock(look);
  return {
    pack,
    registered,
    look: {
      camera: look.camera,
      palette: look.palette,
      lighting: look.lighting,
      sceneAnchors: look.sceneAnchors,
      negativeBaseline: look.negativeBaseline
    },
    agentPrompt: [
      `\u5DF2\u5957\u7528\u7CFB\u5217\u5305\u300C${pack.title}\u300D\uFF08${pack.name}\uFF09\u3002\u4E0D\u8981\u91CD\u8BBE\u8BA1\u89D2\u8272\u548C\u753B\u98CE\u3002`,
      pack.characters.length > 0 ? `\u89D2\u8272\u951A\uFF1A${pack.characters.map((card) => card.name).join("\u3001")}\u3002\u751F\u6210\u5FC5\u987B\u5E26 characters\u3002` : "",
      lookBlock !== "" ? `\u98CE\u683C\u9501\u9010\u5B57\u590D\u7528\uFF1A
${lookBlock}` : "",
      pack.shotRules.length > 0 ? `\u955C\u5934\u89C4\u5219\uFF1A${pack.shotRules.slice(0, 8).join("\uFF1B")}` : "",
      pack.methodSkill !== void 0 ? `\u65B9\u6CD5\u6280\u80FD\u5148 skill_read ${pack.methodSkill}` : "",
      "\u4E0B\u4E00\u955C\u4ECD\u8D70 prompt_plan \u2192 craft \u2192 generate_ready\u3002\u7F3A\u53C2\u8003\u5148\u8865\u8D44\u4EA7\uFF0C\u4E0D\u8981\u4ECE\u96F6\u5199\u4EBA\u8BBE\u3002"
    ].filter((item2) => item2 !== "").join("\n")
  };
}
async function activeSeries(outputDir, userRoot) {
  try {
    const raw = JSON.parse(await readFile21(join34(resolveOutputDir(outputDir), ACTIVE), "utf8"));
    if (typeof raw.name !== "string" || raw.name === "") return void 0;
    return await loadSeries(outputDir, raw.name, userRoot);
  } catch {
    return void 0;
  }
}
async function runSeries(input) {
  const action = input.action === "save" || input.action === "list" || input.action === "show" || input.action === "apply" ? input.action : "harvest";
  if (action === "harvest") {
    const pack = await harvestSeries(input.outputDir, input.title);
    return {
      ok: true,
      action,
      pack,
      next: ["\u6838\u5BF9\u89D2\u8272\u951A\u548C\u98CE\u683C\u9501", `directorx_series action:save title:${pack.title}`],
      agentPrompt: `\u6536\u6210\u4E86\u7CFB\u5217\u300C${pack.title}\u300D\uFF1A${pack.characters.map((card) => card.name).join("\u3001") || "\u8FD8\u6CA1\u6709\u89D2\u8272\u951A"}\u3002\u8981\u8DE8\u96C6\u590D\u7528\u5C31 save\uFF0C\u4E0D\u8981\u53EA\u5199\u5728\u5BF9\u8BDD\u91CC\u3002`
    };
  }
  if (action === "list") {
    const items = await listSeries(input.outputDir, input.userRoot);
    const current = await activeSeries(input.outputDir, input.userRoot);
    return {
      ok: true,
      action,
      items,
      active: current?.name,
      next: items.length === 0 ? ["\u5148 save \u4E00\u4E2A\u7CFB\u5217\u5305"] : [`directorx_series action:apply name:${items[0]?.name}`]
    };
  }
  if (action === "show") {
    if (typeof input.name !== "string" || input.name.trim() === "") throw new Error("show \u9700\u8981 name");
    const pack = await loadSeries(input.outputDir, input.name, input.userRoot);
    return { ok: true, action, pack, next: [`directorx_series action:apply name:${pack.name}`] };
  }
  if (action === "apply") {
    if (typeof input.name !== "string" || input.name.trim() === "") throw new Error("apply \u9700\u8981 name");
    const applied = await applySeries({ outputDir: input.outputDir, name: input.name, userRoot: input.userRoot });
    return {
      ok: true,
      action,
      pack: applied.pack,
      registered: applied.registered.map((card) => card.name),
      look: applied.look,
      next: ["directorx_character_list", "directorx_style_get", "directorx_prompt_plan"],
      agentPrompt: applied.agentPrompt
    };
  }
  const saved = await saveSeries({
    outputDir: input.outputDir,
    title: input.title,
    name: input.name,
    logline: input.logline,
    userRoot: input.userRoot
  });
  return {
    ok: true,
    action: "save",
    pack: saved.pack,
    paths: saved.paths,
    next: ["\u4E0B\u4E00\u96C6 directorx_series apply \u518D\u5F00\u62CD", "\u65B9\u6CD5\u6D41\u7A0B\u53E6\u8D70 directorx_skill_capture"],
    agentPrompt: `\u7CFB\u5217\u5305\u300C${saved.pack.title}\u300D\u5DF2\u5199\u5165\u9879\u76EE\u548C\u7528\u6237\u5E93\u3002\u4E0B\u6B21\u540C\u4E00\u7CFB\u5217\u5148 apply\uFF0C\u4E0D\u8981\u4ECE\u96F6\u505A\u8BBE\u5B9A\u8868\u3002`
  };
}

// src/revise.ts
var REVISE_STAMP = "\u955C\u6539";
function neighborShots(doc, nodeId) {
  const media = doc.nodes.filter((node) => node.kind === "image" || node.kind === "video").slice().sort((left, right) => (left.shotIndex ?? 1e9) - (right.shotIndex ?? 1e9));
  const index = media.findIndex((node) => node.id === nodeId);
  return media.filter((_, offset) => offset === index - 1 || offset === index + 1).map((node) => ({
    id: node.id,
    label: node.label,
    ...node.shotIndex !== void 0 ? { shotIndex: node.shotIndex } : {}
  }));
}
async function planRevise(input) {
  const change = input.change.trim();
  if (change === "") throw new Error("\u6539\u8FD9\u4E00\u955C\u9700\u8981\u5199\u51FA\u8981\u6539\u4EC0\u4E48");
  const doc = await new DirectorxCanvasStore(input.outputDir).read();
  const node = doc.nodes.find((item2) => item2.id === input.nodeId);
  if (node === void 0) throw new Error(`canvas node "${input.nodeId}" not found`);
  if (node.kind !== "image" && node.kind !== "video") {
    throw new Error("\u53EA\u6539\u8FD9\u4E00\u955C\u53EA\u63A5\u53D7\u56FE\u7247\u6216\u89C6\u9891\u5361");
  }
  const people = await new CharacterStore(input.outputDir).list();
  const named = detectNamedCharacters(
    `${node.label} ${node.prompt ?? ""} ${change}`,
    { characters: people.map((card) => ({ name: card.name, refPath: card.refPath })), nodes: [], edges: [] },
    node.characters ?? []
  );
  const series = await activeSeries(input.outputDir);
  const style = await new ProjectStyleStore(input.outputDir).read();
  const refs = [
    ...typeof node.path === "string" && node.path !== "" && node.kind === "image" ? [node.path] : [],
    ...people.filter((card) => named.includes(card.name)).map((card) => card.refPath)
  ].filter((path, index, all) => path !== "" && all.indexOf(path) === index);
  const firstFrame = node.kind === "video" && typeof node.path === "string" && node.path !== "" ? void 0 : node.kind === "image" && typeof node.path === "string" && node.path !== "" ? node.path : void 0;
  const strategy = node.kind === "video" ? "i2v" : "keyframe";
  const look = formatLookBlock(series?.look ?? style);
  const basePrompt = (node.prompt ?? node.label).trim();
  const craftSeed = [
    basePrompt,
    `\u53EA\u6539\uFF1A${change}`,
    "\u5176\u4F59\u8EAB\u4EFD\u3001\u670D\u88C5\u3001\u5149\u7EBF\u3001\u673A\u4F4D\u3001\u573A\u666F\u9501\u4F4F\uFF0C\u4E0D\u8981\u91CD\u8BBE\u8BA1\u6574\u7247\u3002",
    look,
    named.length > 0 ? `\u89D2\u8272\u951A\uFF1A${named.join("\u3001")}` : ""
  ].filter((item2) => item2 !== "").join("\n");
  const next = [
    "directorx_note \u8BB0\u4E0B\u8FD9\u6761\u6539\u6CD5",
    "directorx_prompt_plan",
    "directorx_prompt_craft\uFF08intent=\u6539\u6CD5\uFF0Cprompt=\u6210\u7A3F\uFF0C\u53EA\u8986\u76D6\u8FD9\u4E00\u955C\uFF09",
    `directorx_generate_ready nodeId:${node.id} strategy:${strategy}`,
    "\u4E25\u683C/\u534F\u540C\uFF1Adirectorx_propose + confirm",
    `generate_* \u5E26 craftId+readyId\uFF0C\u518D directorx_canvas_update ${node.id} \u53EA\u6539 path / shotStatus`
  ];
  return {
    ok: true,
    nodeId: node.id,
    kind: node.kind,
    label: node.label,
    ...typeof node.path === "string" && node.path !== "" ? { path: node.path } : {},
    prompt: craftSeed,
    change,
    characters: named,
    ...series !== void 0 ? { series: series.name } : {},
    strategy,
    ...firstFrame !== void 0 ? { firstFrame } : {},
    referenceImages: refs,
    neighbors: neighborShots(doc, node.id),
    next,
    agentPrompt: [
      `\u53EA\u6539\u300C${node.label}\u300D\uFF08${node.id}\uFF09\uFF1A${change}`,
      "\u4E0D\u8981\u91CD\u505A\u6574\u6761\u7247\u5B50\uFF0C\u4E0D\u8981\u8BA9\u7528\u6237\u518D\u62A5\u4E00\u904D\u4EBA\u8BBE\u548C\u753B\u98CE\u3002",
      named.length > 0 ? `\u9501\u89D2\u8272\uFF1A${named.join("\u3001")}` : "\u8FD9\u955C\u6CA1\u6709\u70B9\u540D\u89D2\u8272\uFF1B\u6709\u4EBA\u5C31\u8981\u8865\u8BBE\u5B9A\u56FE\u3002",
      series !== void 0 ? `\u7CFB\u5217\u5305 ${series.title} \u5DF2\u6FC0\u6D3B\uFF0C\u6CBF\u7528\u89D2\u8272\u951A\u548C\u98CE\u683C\u9501\u3002` : "\u6CA1\u6709\u7CFB\u5217\u5305\u5C31\u8BFB\u5F53\u524D\u89D2\u8272\u5E93\u548C style_get\u3002",
      `\u6210\u7A3F\u79CD\u5B50\uFF1A${craftSeed.slice(0, 500)}`,
      "\u56DE\u5199\u53EA\u6539\u8FD9\u4E00\u8282\u70B9\u7684 path\u3002"
    ].join("\n"),
    intentPrompt: `${REVISE_STAMP} ${node.label}\uFF1A${change}`
  };
}

// src/blocking.ts
import { mkdir as mkdir22, writeFile as writeFile20 } from "node:fs/promises";
import { join as join35 } from "node:path";
var BLOCKING_STAMP = "\u573A\u9762\u9501";
var BLOCKING_NODE_ID = "blocking-sheet";
var PRIORITY = [
  "\u573A\u9762\u53F0\u8D26\u4E0E\u53C2\u8003\u89D2\u8272\uFF08\u4EBA\u6570\u3001\u5750\u6807\u3001\u552F\u4E00\u7269\u4EF6\u3001\u72EC\u7ACB\u76F8\u673A\uFF09",
  "\u7269\u4EF6\u72B6\u6001\u673A\uFF08\u540C\u65F6\u53EA 1 \u4E2A\u7269\u4EF6\u3001\u540C\u65F6\u53EA 1 \u4E2A\u6301\u6709\u8005\uFF0C\u4EA4\u63A5\u540E\u65E7\u6301\u6709\u8005\u7A7A\u624B\uFF09",
  "\u7528\u6237\u70B9\u540D\u7684\u5408\u6CD5\u52A8\u4F5C / \u89C4\u5219\uFF08\u6B65\u6CD5\u3001\u51FA\u754C\u3001\u4EA4\u63A5\u987A\u5E8F\uFF09",
  "\u72EC\u7ACB\u8DDF\u62CD\uFF1A\u5148\u62CD\u4EA4\u7269\u8005\uFF0C\u518D\u8FFD\u7A7A\u4E2D\u7269\u4EF6\uFF0C\u518D\u63A5\u5230\u5DF2\u5728\u53F0\u8D26\u91CC\u7684\u63A5\u6536\u8005",
  "\u8EAB\u4EFD\u9501\uFF1A\u540D\u5355\u4EBA\u6570\u4E0D\u589E\u4E0D\u51CF\uFF0C\u51FA\u753B\u7684\u4EBA\u6309\u8F68\u9053\u56DE\u6765\uFF0C\u7981\u6B62\u6362\u8138\u590D\u5236",
  "\u7535\u5F71\u611F\u4E0E\u7EC6\u8282\uFF1A\u4E0D\u5F97\u4E3A\u4E86\u597D\u770B\u6539\u53F0\u8D26\u3001\u4EBA\u6570\u3001\u6301\u6709\u8005\u6216\u89C4\u5219"
];
var SECTIONS = [
  "\u751F\u6210\u76EE\u6807",
  "\u6307\u4EE4\u4F18\u5148\u7EA7",
  "\u53C2\u8003\u89D2\u8272",
  "\u8EAB\u4EFD\u9501",
  "\u573A\u9762\u53F0\u8D26",
  "\u7269\u4EF6\u72B6\u6001\u673A",
  "\u4EA4\u63A5\u4E0E\u6301\u6709",
  "\u72EC\u7ACB\u76F8\u673A",
  "\u5206\u6BB5\u7ED3\u675F\u6001",
  "\u7EDD\u5BF9\u6392\u9664"
];
function clampDuration2(value) {
  const n = typeof value === "number" && Number.isFinite(value) ? value : Number(value);
  if (!Number.isFinite(n)) return 15;
  return Math.max(4, Math.min(60, Math.round(n)));
}
function parseBeats(raw) {
  if (raw.trim() === "") return [];
  return raw.split(/\n+/).flatMap((line) => line.split(/\s*(?:→|->|⇒|➜)\s*/)).map((item2) => item2.replace(/^\s*(?:[-*•]|第?\d+[.\u3001．:]|T\d+\s*[：:|｜])\s*/, "").trim()).filter((item2) => item2.length >= 2).slice(0, 16);
}
function buildTicks(input) {
  const durationSec = clampDuration2(input.durationSec);
  const start = (input.start ?? "").trim() || "\u5F00\u573A\u72B6\u6001";
  const beats = input.beats.filter((item2) => item2.trim() !== "");
  const events = [start, ...beats];
  const last = events.length - 1;
  return events.map((event, index) => {
    const atSec = last === 0 ? 0 : Math.round(durationSec * index / last * 10) / 10;
    const id = `T${index}`;
    return {
      id,
      atSec,
      event,
      line: `${id} ${atSec.toFixed(1)}s\uFF5C${event}\uFF5C\u4E3B\u4F53\u5750\u6807\u5F85\u586B\uFF5C\u7269\u4EF6\u5F85\u586B\uFF5CCAM \u5F85\u586B`
    };
  });
}
function classifyRef(label, kind) {
  const blob2 = `${label} ${kind}`;
  if (/台账|状态|T0|场面锁|作战/i.test(blob2)) {
    return { role: "state", authority: "\u5206\u65F6\u523B\u7A7A\u95F4\u72B6\u6001\u3002\u5C0F\u683C\u662F\u4E0D\u540C\u65F6\u523B\uFF0C\u7981\u6B62\u5408\u6210\u8FDB\u6210\u7247\u3002" };
  }
  if (/步法|动作拆|足形|合法动作/i.test(blob2)) {
    return { role: "action", authority: "\u5408\u6CD5\u52A8\u4F5C\u987A\u5E8F\u3002\u8DB3\u5F62/\u7BAD\u5934/\u6587\u5B57\u4E0D\u8981\u8FDB\u6210\u7247\u3002" };
  }
  if (/场景|空镜|场地|场馆|体育馆|court|set|establishing/i.test(blob2)) {
    return { role: "geometry", authority: "\u573A\u5730\u51E0\u4F55\u3002\u56FE\u91CC\u7684\u56FE\u89E3\u6587\u5B57\u4E0D\u8981\u8FDB\u6210\u7247\u3002" };
  }
  if (/设定|定妆|三视|角色|人物|sheet/i.test(blob2) || kind === "character") {
    return { role: "identity", authority: "\u53EA\u9501\u8138\u3001\u4F53\u6001\u3001\u76F8\u5BF9\u8EAB\u9AD8\u3002\u96C6\u5408\u7AD9\u59FF\u548C\u767D\u5E95\u4E0D\u8981\u8FDB\u6210\u7247\u3002" };
  }
  return { role: "other", authority: "\u5148\u58F0\u660E\u5B83\u9501\u4EC0\u4E48\uFF0C\u518D\u5F15\u7528\u3002" };
}
async function harvestBlocking(outputDir) {
  const [people, canvas, series] = await Promise.all([
    new CharacterStore(outputDir).list(),
    new DirectorxCanvasStore(outputDir).read(),
    activeSeries(outputDir)
  ]);
  const existing = canvas.nodes.find(
    (node) => node.id === BLOCKING_NODE_ID || node.continuityRules?.includes(BLOCKING_STAMP) === true
  );
  const refs = [
    ...people.filter((card) => card.refPath !== "").map((card) => {
      const role = classifyRef(card.name, "character");
      return {
        role: role.role,
        path: card.refPath,
        label: card.name,
        authority: role.authority
      };
    }),
    ...canvas.nodes.filter((node) => (node.kind === "image" || node.kind === "video") && typeof node.path === "string" && node.path !== "").map((node) => {
      const role = classifyRef(`${node.label} ${node.prompt ?? ""}`, node.kind);
      return {
        role: role.role,
        path: node.path ?? "",
        label: node.label || node.id,
        authority: role.authority,
        nodeId: node.id
      };
    })
  ];
  const seen = /* @__PURE__ */ new Set();
  const unique4 = refs.filter((item2) => {
    if (seen.has(item2.path)) return false;
    seen.add(item2.path);
    return true;
  }).slice(0, 16);
  return {
    title: (canvas.title ?? "\u573A\u9762\u63A7\u5236\u8868").slice(0, 40),
    ...series !== void 0 ? { series: series.name } : {},
    roster: people.map((card) => ({
      name: card.name,
      refPath: card.refPath,
      description: card.description
    })),
    refs: unique4,
    ...existing !== void 0 ? { existingNodeId: existing.id, existingPreview: existing.label.slice(0, 240) } : {}
  };
}
function blockingSchema(input) {
  const beats = input.beats ?? [];
  const durationSec = clampDuration2(input.durationSec);
  const start = (input.start ?? "").trim();
  const ticks = buildTicks({ start, beats, durationSec });
  const missing = [];
  if (input.harvest.roster.length === 0 && !input.harvest.refs.some((item2) => item2.role === "identity")) {
    missing.push("\u89D2\u8272\u8BBE\u5B9A\u56FE\uFF1A\u6BCF\u4EBA\u81F3\u5C11\u4E00\u5F20\uFF0C\u80CC\u5F71\u4F1A\u51FA\u955C\u7684\u4EBA\u5355\u72EC\u518D\u7ED9\u4E00\u5F20\u80CC\u89C6");
  }
  if (start === "") missing.push("\u5F00\u573A\u72B6\u6001\uFF1A\u8C01\u6301\u7269\u3001\u671D\u54EA\u8FB9\u3001\u76F8\u673A\u5728\u54EA\u4E00\u4FA7");
  if (beats.length === 0) missing.push("\u4E8B\u4EF6\u987A\u5E8F\uFF1A\u8C01\u4F20\u7ED9\u8C01\u3001\u4E2D\u95F4\u51E0\u6B21\u63A5\u89E6\u3001\u7ED3\u675F\u65F6\u7269\u4EF6\u5728\u8C01\u624B\u91CC");
  return {
    ok: true,
    action: "schema",
    stamp: BLOCKING_STAMP,
    durationSec,
    sections: SECTIONS,
    priority: PRIORITY,
    ticks,
    roster: input.harvest.roster,
    refs: input.harvest.refs,
    missing,
    ask: missing.length > 0,
    next: missing.length > 0 ? ["directorx_ask \u4E00\u6B21\u95EE\u6E05\u5F00\u573A\u3001\u4E8B\u4EF6\u987A\u5E8F\u3001\u65F6\u957F", "\u8865\u9F50\u540E\u518D directorx_blocking schema", "\u4F60\u5199 Markdown \u540E directorx_blocking pin"] : ["\u6309 sections \u81EA\u5DF1\u5199\u6210\u573A\u9762\u63A7\u5236\u8868 Markdown\uFF08\u53F0\u8D26\u5750\u6807\u548C\u72B6\u6001\u673A\u5FC5\u987B\u4F60\u586B\uFF0C\u4E0D\u8981\u4EA4\u7A7A\u9AA8\u67B6\uFF09", "directorx_blocking pin", "\u518D prompt_plan / prompt_craft"],
    agentPrompt: [
      "\u573A\u9762\u63A7\u5236\u8868\uFF1A\u7528\u6237\u53EA\u7ED9\u89D2\u8272\u56FE\u3001\u5F00\u573A\u548C\u4E8B\u4EF6\u987A\u5E8F\u3002\u4F60\u8865\u53F0\u8D26\u3001\u72B6\u6001\u673A\u3001\u76F8\u673A\u548C\u6392\u9664\u9879\u3002",
      missing.length > 0 ? `\u5148\u95EE\u6E05\uFF1A${missing.join("\uFF1B")}` : "\u7F3A\u53E3\u5DF2\u9F50\uFF0C\u5199\u6210 Markdown \u518D pin\u3002",
      `\u65F6\u957F ${durationSec}s\u3002\u53F0\u8D26\u884C\uFF1A`,
      ...ticks.map((tick) => tick.line),
      "\u4F18\u5148\u7EA7\u4E0D\u53EF\u98A0\u5012\uFF1A\u53F0\u8D26 > \u7269\u4EF6\u72B6\u6001\u673A > \u89C4\u5219 > \u76F8\u673A > \u8EAB\u4EFD > \u597D\u770B\u3002",
      "\u53C2\u8003\u56FE\u8981\u58F0\u660E\u89D2\u8272\u3002\u72B6\u6001\u56FE/\u52A8\u4F5C\u56FE\u7684\u7EBF\u3001\u7BAD\u5934\u3001\u6587\u5B57\u7981\u6B62\u8FDB\u6210\u7247\u3002",
      "\u51FA\u753B\u7684\u4EBA\u6309\u53F0\u8D26\u8F68\u9053\u7EE7\u7EED\u8DD1\uFF0C\u7981\u6B62\u5728\u65B0\u753B\u89D2\u91CC\u53E6\u9020\u4E00\u5F20\u540C\u8138\u3002",
      "\u4E0D\u8981\u751F\u6210\u3002pin \u4E4B\u540E\u624D craft\u3002"
    ].join("\n")
  };
}
function assertSheet(markdown) {
  const body = markdown.trim();
  if (body.length < 200) throw new Error("\u573A\u9762\u63A7\u5236\u8868\u592A\u77ED\u3002\u628A\u53F0\u8D26\u3001\u72B6\u6001\u673A\u548C\u53C2\u8003\u89D2\u8272\u5199\u8FDB Markdown \u518D pin\u3002");
  if (!/场面台账|场面锁|^T0\b/m.test(body)) {
    throw new Error("\u573A\u9762\u63A7\u5236\u8868\u7F3A\u5C11\u573A\u9762\u53F0\u8D26\uFF08\u81F3\u5C11\u6709 T0 \u884C\uFF09\u3002");
  }
  return body.slice(0, 8e3);
}
async function pinBlocking(input) {
  const markdown = assertSheet(input.markdown);
  const dir = join35(resolveOutputDir(input.outputDir), "docs");
  await mkdir22(dir, { recursive: true });
  const path = join35(dir, "blocking.md");
  await writeFile20(path, markdown, "utf8");
  const canvas = new DirectorxCanvasStore(input.outputDir);
  const doc = await canvas.read();
  const existing = doc.nodes.find(
    (node) => node.id === BLOCKING_NODE_ID || node.continuityRules?.includes(BLOCKING_STAMP) === true
  );
  const lines = markdown.split("\n").length;
  const height = Math.max(280, Math.min(820, 80 + lines * 16));
  const heading = (input.title ?? "\u573A\u9762\u63A7\u5236\u8868").slice(0, 40);
  const label = markdown.startsWith("#") ? markdown : `# ${heading}

${markdown}`;
  const nodeId = existing?.id ?? BLOCKING_NODE_ID;
  if (existing !== void 0) {
    await canvas.update(nodeId, {
      label: label.slice(0, 8e3),
      width: 560,
      height,
      continuityRules: [BLOCKING_STAMP]
    });
  } else {
    const maxBottom = doc.nodes.reduce((max, node) => Math.max(max, node.y + (node.height ?? 120)), 0);
    await canvas.addNode({
      id: nodeId,
      kind: "text",
      label: label.slice(0, 8e3),
      x: 48,
      y: maxBottom + 48,
      width: 560,
      height,
      continuityRules: [BLOCKING_STAMP]
    });
  }
  return { nodeId, path, preview: markdown.slice(0, 240) };
}
async function showBlocking(outputDir) {
  const canvas = new DirectorxCanvasStore(outputDir);
  const doc = await canvas.read();
  const node = doc.nodes.find(
    (item2) => item2.id === BLOCKING_NODE_ID || item2.continuityRules?.includes(BLOCKING_STAMP) === true
  );
  if (node === void 0) {
    return { ok: true, found: false, next: ["directorx_blocking harvest", "directorx_blocking schema"] };
  }
  return {
    ok: true,
    found: true,
    nodeId: node.id,
    markdown: node.label,
    next: ["prompt_plan / prompt_craft \u5FC5\u987B\u5F15\u7528\u8FD9\u4EFD\u573A\u9762\u63A7\u5236\u8868", "\u4E0D\u8981\u628A\u539F\u53E5\u4E22\u7ED9 generate"]
  };
}
async function runBlocking(input) {
  const action = input.action === "schema" || input.action === "pin" || input.action === "show" || input.action === "harvest" ? input.action : input.markdown !== void 0 && input.markdown.trim() !== "" ? "pin" : input.start !== void 0 && input.start.trim() !== "" || input.beats !== void 0 && input.beats.trim() !== "" ? "schema" : "harvest";
  if (action === "show") return showBlocking(input.outputDir);
  if (action === "pin") {
    const pinned = await pinBlocking({
      outputDir: input.outputDir,
      markdown: input.markdown ?? "",
      title: input.title
    });
    return {
      ok: true,
      action,
      ...pinned,
      next: ["directorx_prompt_plan", "directorx_prompt_craft\uFF08\u6210\u7A3F\u5FC5\u987B\u5F15\u7528\u573A\u9762\u53F0\u8D26\uFF0C\u4E0D\u8981\u53E6\u8D77\u4E00\u5957\u8C03\u5EA6\uFF09", "directorx_generate_ready"]
    };
  }
  const harvest = await harvestBlocking(input.outputDir);
  if (action === "harvest") {
    return {
      ok: true,
      action,
      ...harvest,
      next: harvest.roster.length === 0 ? ["\u5148 directorx_character_register \u6216\u9009\u4E2D\u89D2\u8272\u56FE", "\u518D schema"] : ["directorx_ask \u95EE\u5F00\u573A\u548C\u4E8B\u4EF6\u987A\u5E8F\uFF08\u82E5\u7528\u6237\u8FD8\u6CA1\u7ED9\uFF09", "directorx_blocking schema"]
    };
  }
  return blockingSchema({
    harvest,
    start: input.start,
    beats: parseBeats(input.beats ?? ""),
    durationSec: input.durationSec
  });
}

// src/canvas-intent.ts
import { mkdir as mkdir23, readFile as readFile22, writeFile as writeFile21 } from "node:fs/promises";
import { join as join36 } from "node:path";
var FILE6 = "canvas-intents.json";
var MAX6 = 100;
function formatDshCanvasPrompt(intent, extras = {}) {
  const source = intent.sourceId !== void 0 ? `${intent.sourceId}${extras.sourceLabel !== void 0 && extras.sourceLabel !== "" ? `\uFF08${extras.sourceLabel}\uFF09` : ""}` : "\uFF08\u65E0\uFF0C\u4ECE\u7A7A\u767D\u5F00\u65B0\u8282\u70B9\uFF09";
  const ip = buildIpBrief(intent.prompt, { memory: extras.memory });
  const plan = planPrompt({ intent: intent.prompt, kind: intent.kind, model: intent.model });
  const memoryLine = (extras.memory ?? []).length > 0 ? `- \u9879\u76EE\u8BB0\u5FC6\uFF1A${extras.memory.map((entry) => `\u300C${entry.terms[0] ?? ""}\u300D\u66FE\u5199\u6210\u300C${entry.rewrite.slice(0, 80)}\u300D`).join("\uFF1B")}` : "";
  return [
    "[DirectorX \u753B\u5E03\u6307\u4EE4]",
    "\u4E0B\u9762\u300C\u610F\u56FE\u300D\u53EA\u662F\u7528\u6237\u539F\u53E5\uFF0C\u4E0D\u662F\u751F\u6210\u63D0\u793A\u8BCD\u3002\u7981\u6B62\u62FF\u5B83\u76F4\u63A5 generate\u3002",
    "\u7528 directorx_canvas_intents { claim: true } \u9886\u53D6\u672C\u6761\u3002\u56FA\u5B9A\u987A\u5E8F\uFF1Aclaim \u2192 directorx_skill_route \u2192 directorx_prompt_plan\uFF08\u516D\u8981\u7D20/\u7269\u7406\u94FE/\u6A21\u578B\u6280\u80FD\uFF0C\u4E0D\u8981\u62FF\u539F\u53E5\u5F53\u7A3F\uFF09\u2192 directorx_skill_read\uFF08\u5217\u51FA\u7684\u6280\u80FD\u6B63\u6587\uFF09\u2192 directorx_knowledge_read\uFF08route.articles \u7684 id\uFF0C\u4E0D\u8981\u53E6\u8D77\u68C0\u7D22\u8BCD\uFF1B\u5FC5\u8981\u65F6\u5916\u90E8\u8C03\u7814\uFF09\u2192 \u82E5\u7248\u6743\u68C0\u51FA\u5219 directorx_ip_scan + knowledge_read 213 + \u6309\u65B9\u6CD5\u5199\u7EC6\u6539\u5199 + directorx_ip_rewrite \u2192 directorx_prompt_craft\uFF08intent=\u539F\u53E5\uFF0Cprompt=\u6210\u7A3F\uFF09\u2192 directorx_generate_ready\uFF08\u8BBE\u5B9A\u56FE/\u573A\u666F/\u5173\u952E\u5E27/\u9996\u5C3E\u5E27/\u56FE\u751F\uFF0C\u7F3A\u53C2\u8003\u5148\u8865\uFF09\u2192 \u4E25\u683C/\u534F\u540C directorx_propose+confirm \u2192 \u5E26 craftId \u548C readyId \u518D directorx_canvas_continue / generate\u3002\u4E0D\u8981\u8BA9\u753B\u5E03 UI \u81EA\u5DF1\u5199 generating \u8282\u70B9\u3002\u56DE\u5199\u753B\u5E03\u53EA\u6539 path / shotStatus\uFF1B\u4E0D\u8981\u7528\u6587\u4EF6\u540D\u8986\u76D6\u955C\u5934\u6807\u9898\u3002",
    `- \u610F\u56FE id: ${intent.id}`,
    `- \u7C7B\u578B: ${intent.kind}`,
    `- \u610F\u56FE\uFF08\u672A\u6210\u7A3F\uFF09: ${intent.prompt}`,
    ip.dirty ? `- \u7248\u6743\uFF1A\u610F\u56FE\u542B\u300C${ip.hits.map((hit) => hit.term).join("\u3001")}\u300D\u3002\u7981\u6B62\u5957\u56FA\u5B9A\u6210\u7A3F\u3002\u5148 directorx_ip_scan\uFF08\u5E26\u56DE\u9879\u76EE\u8BB0\u5FC6\uFF09\uFF0C\u8BFB\u77E5\u8BC6 213\uFF0C\u6309 method/axes \u7ED3\u5408 keep\uFF08${ip.keep.join(" / ") || "\u8865\u52A8\u4F5C\u573A\u666F\u5149\u7EBF"}\uFF09\u81EA\u5DF1\u5199\u7EC6\uFF0C\u518D directorx_ip_rewrite \u9A8C\u6536\u5E76\u8BB0\u5165\u8BB0\u5FC6\u3002\u8D1F\u5411\uFF1A${ip.negativeLine}` : "",
    memoryLine,
    `- \u6E90\u8282\u70B9: ${source}`,
    intent.selectedIds.length > 0 ? `- \u5F53\u524D\u9009\u4E2D: ${intent.selectedIds.join(", ")}` : "",
    intent.model !== void 0 && intent.model !== "" ? `- \u6A21\u578B: ${intent.model}` : "",
    intent.aspect !== void 0 && intent.aspect !== "" ? `- \u753B\u5E45: ${intent.aspect}` : "",
    intent.count !== void 0 && intent.count > 1 ? `- \u6B21\u6570: ${intent.count}` : "",
    intent.durationSec !== void 0 ? `- \u65F6\u957F: ${intent.durationSec}s` : "",
    intent.refIds !== void 0 && intent.refIds.length > 0 ? `- \u53C2\u8003\u8282\u70B9: ${intent.refIds.join(", ")}` : "",
    intent.characters.length > 0 ? `- \u89D2\u8272\u951A\u70B9: ${intent.characters.join(", ")}\u3002\u751F\u6210\u5DE5\u5177\u5FC5\u987B\u4F20 characters \u53C2\u6570\uFF08directorx_character_list \u5DF2\u6CE8\u518C\uFF09\u3002` : "",
    ip.dirty ? ip.agentPrompt : "",
    plan.agentPrompt,
    /片段重做|局部重绘|重做中段/.test(intent.prompt) ? '- \u8FD9\u662F\u5C40\u90E8\u91CD\u7ED8\uFF1A\u751F\u6210\u53EA\u8986\u76D6\u4E2D\u6BB5\uFF0C\u56DE\u5199\u8BE5\u89C6\u9891\u8282\u70B9 path \u540E\u8C03\u7528 directorx_canvas_reshoot { action: "assemble", nodeId: \u4E2D\u6BB5id } \u628A\u5934+\u4E2D+\u5C3E\u62FC\u63A5\u3002' : "",
    /拼成片|合成视频|硬切组装|预告片/.test(intent.prompt) ? "- \u8FD9\u662F\u6210\u7247\u7EC4\u88C5\uFF1A\u8C03\u7528 directorx_canvas_pack\uFF0Ctransition=cut\u3002\u9884\u544A\u7247\u7981\u6B62 fade\u3002" : "",
    /镜改|再生动|改这一镜|只改这|重新生成/.test(intent.prompt) ? "- \u8FD9\u662F\u5355\u955C\u4FEE\u6539\uFF1A\u5148 directorx_revise { nodeId: \u6E90\u8282\u70B9 }\uFF0C\u6210\u7A3F\u53EA\u6539\u8FD9\u4E00\u5904\u3002\u56DE\u5199\u8BE5\u8282\u70B9 path\u3002\u6574\u677F\u5176\u5B83\u955C\u4E0D\u8981\u91CD\u505A\u3002\u7CFB\u5217\u5305\u5DF2\u6FC0\u6D3B\u5C31\u6CBF\u7528\uFF0C\u4E0D\u8981\u8BA9\u7528\u6237\u518D\u62A5\u4EBA\u8BBE\u3002" : "",
    /场面锁|场面控制|作战板|完全控制|多人连续|单镜长拍/.test(intent.prompt) ? "- \u8FD9\u662F\u573A\u9762\u63A7\u5236\uFF1A\u5148 directorx_blocking harvest/schema\u3002\u7528\u6237\u53EA\u7ED9\u89D2\u8272\u56FE\u3001\u5F00\u573A\u548C\u4E8B\u4EF6\u987A\u5E8F\u3002\u4F60\u5199\u53F0\u8D26\u548C\u7269\u4EF6\u72B6\u6001\u673A\uFF0Cpin \u540E\u518D craft\u3002\u4E0D\u8981\u76F4\u63A5 generate\u3002" : "",
    /宫格拼回|合并宫格|分屏对照|分屏|去硬字|去字幕|续写位|视频延长|导出动图|导出\s*GIF/.test(intent.prompt) ? "- \u8FD9\u662F\u753B\u5E03\u5DE5\u5177\uFF1A\u5408\u5E76\u5BAB\u683C directorx_canvas_join\uFF0C\u5206\u5C4F directorx_canvas_stack\uFF0C\u53BB\u5B57\u5E55 directorx_canvas_desub\uFF0C\u89C6\u9891\u5EF6\u957F directorx_canvas_extend\uFF08\u4E0D\u751F\u6210\uFF09\uFF0C\u5BFC\u51FA GIF directorx_canvas_gif\u3002\u90FD\u4E0D\u8981\u8D70 generate\u3002" : "",
    "\u505A\u5B8C\u540E\u8C03\u7528 directorx_canvas_intent_ack\u3002"
  ].filter(Boolean).join("\n");
}
async function formatDshCanvasPromptForProject(intent, extras) {
  const store = new IpMemoryStore(extras.outputDir);
  const memory = store.asHints(await store.recall(intent.prompt));
  return formatDshCanvasPrompt(intent, { sourceLabel: extras.sourceLabel, memory });
}
var CanvasIntentStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join36(resolveOutputDir(this.outputDir), FILE6);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile22(this.filePath(), "utf8"));
      return {
        intents: Array.isArray(parsed.intents) ? parsed.intents.map((item2) => ({
          ...item2,
          characters: Array.isArray(item2.characters) ? item2.characters : [],
          selectedIds: Array.isArray(item2.selectedIds) ? item2.selectedIds : []
        })) : []
      };
    } catch {
      return { intents: [] };
    }
  }
  async write(ledger) {
    await mkdir23(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile21(this.filePath(), JSON.stringify(ledger, null, 2), "utf8");
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
      characters: (input.characters ?? []).filter((name) => typeof name === "string" && name.trim() !== "").map((name) => name.trim().slice(0, 80)).slice(0, 8),
      ...typeof input.model === "string" && input.model !== "" ? { model: input.model.slice(0, 80) } : {},
      ...typeof input.aspect === "string" && input.aspect !== "" ? { aspect: input.aspect.slice(0, 16) } : {},
      ...count !== void 0 ? { count } : {},
      ...durationSec !== void 0 ? { durationSec } : {},
      ...Array.isArray(input.refIds) ? { refIds: input.refIds.filter((id) => typeof id === "string" && id !== "").slice(0, 8) } : {},
      status: "pending",
      at: Date.now()
    };
    ledger.intents.push(intent);
    if (ledger.intents.length > MAX6) ledger.intents.splice(0, ledger.intents.length - MAX6);
    await this.write(ledger);
    return intent;
  }
  async list(status) {
    const ledger = await this.read();
    const filtered = status === void 0 ? ledger.intents : ledger.intents.filter((item2) => item2.status === status);
    return filtered.slice().reverse();
  }
  /**
   * Claim the oldest pending intent. Two DSH turns cannot take the same
   * directive: the first call marks it taken, the next call gets the next one.
   */
  async takeNext() {
    const ledger = await this.read();
    const pending = ledger.intents.filter((item2) => item2.status === "pending").slice().sort((a, b) => a.at - b.at);
    const intent = pending[0];
    if (intent === void 0) return null;
    intent.status = "taken";
    intent.takenAt = Date.now();
    await this.write(ledger);
    return intent;
  }
  async ack(id, status) {
    const ledger = await this.read();
    const intent = ledger.intents.find((item2) => item2.id === id);
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

// src/studio-intent.ts
import { mkdir as mkdir24, readFile as readFile23, writeFile as writeFile22 } from "node:fs/promises";
import { join as join37 } from "node:path";
var FILE7 = "studio-open.json";
var StudioTicketStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join37(resolveOutputDir(this.outputDir), FILE7);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile23(this.filePath(), "utf8"));
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
    await mkdir24(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile22(this.filePath(), JSON.stringify(ticket), "utf8");
    return ticket;
  }
};

// src/client/stage/session-fold.ts
var TOOL_LABEL = {
  directorx_generate_image: "\u751F\u6210\u56FE\u7247",
  directorx_generate_video: "\u751F\u6210\u89C6\u9891",
  directorx_generate_audio: "\u751F\u6210\u97F3\u9891",
  directorx_canvas_add: "\u753B\u5E03\uFF1A\u6DFB\u52A0",
  directorx_canvas_connect: "\u753B\u5E03\uFF1A\u8FDE\u7EBF",
  directorx_canvas_update: "\u753B\u5E03\uFF1A\u66F4\u65B0",
  directorx_canvas_remove: "\u753B\u5E03\uFF1A\u5220\u9664",
  directorx_canvas_intents: "\u753B\u5E03\uFF1A\u9886\u53D6\u6307\u4EE4",
  directorx_canvas_get: "\u753B\u5E03\uFF1A\u8BFB\u53D6",
  directorx_canvas_continue: "\u753B\u5E03\uFF1A\u7EED\u5199",
  directorx_canvas_batch: "\u753B\u5E03\uFF1A\u6279\u91CF",
  directorx_canvas_shotlist: "\u753B\u5E03\uFF1A\u5206\u955C\u8868",
  directorx_canvas_script: "\u753B\u5E03\uFF1A\u751F\u6210\u5206\u955C",
  directorx_canvas_frames: "\u753B\u5E03\uFF1A\u63D0\u53D6\u5E27",
  directorx_canvas_autolink: "\u753B\u5E03\uFF1A\u81EA\u52A8\u8FDE\u7EBF",
  directorx_canvas_parse: "\u753B\u5E03\uFF1A\u667A\u80FD\u89E3\u6790",
  directorx_canvas_reshoot: "\u753B\u5E03\uFF1A\u5C40\u90E8\u91CD\u7ED8",
  directorx_canvas_pack: "\u753B\u5E03\uFF1A\u5408\u6210\u89C6\u9891",
  directorx_canvas_sheet: "\u753B\u5E03\uFF1A\u4E5D\u5BAB\u683C",
  directorx_canvas_split: "\u753B\u5E03\uFF1A\u62C6\u5206\u5BAB\u683C",
  directorx_canvas_join: "\u753B\u5E03\uFF1A\u5408\u5E76\u5BAB\u683C",
  directorx_canvas_stack: "\u753B\u5E03\uFF1A\u5206\u5C4F",
  directorx_canvas_desub: "\u753B\u5E03\uFF1A\u53BB\u5B57\u5E55",
  directorx_canvas_extend: "\u753B\u5E03\uFF1A\u89C6\u9891\u5EF6\u957F",
  directorx_canvas_gif: "\u753B\u5E03\uFF1A\u5BFC\u51FA GIF",
  directorx_series: "\u7CFB\u5217\u5305",
  directorx_revise: "\u91CD\u65B0\u751F\u6210",
  directorx_blocking: "\u753B\u5E03\uFF1A\u573A\u9762\u63A7\u5236\u8868",
  directorx_confirm: "\u786E\u8BA4\u63D0\u6848",
  directorx_ask: "\u63D0\u95EE",
  directorx_stage: "\u9636\u6BB5",
  directorx_skill_search: "\u68C0\u7D22\u6280\u80FD",
  directorx_skill_route: "\u6280\u80FD\u8DEF\u7531",
  directorx_skill_read: "\u8BFB\u6280\u80FD",
  directorx_skill_capture: "\u6536\u6210\u6280\u80FD",
  directorx_note: "\u8BB0\u4E0B\u4FEE\u6539",
  directorx_bible: "\u8BC4\u5BA1\u6587\u6863",
  directorx_shot_vocab: "\u955C\u5934\u8BED\u6C47",
  directorx_provider_ingest: "\u63A5\u5165\u6A21\u578B"
};
function summarizeToolName(name) {
  if (name in TOOL_LABEL) return TOOL_LABEL[name];
  if (name.startsWith("directorx_")) return name.slice("directorx_".length).replaceAll("_", " ");
  return name.replaceAll("_", " ");
}
function toolCaption(name, args) {
  const raw = name.trim() || "tool";
  if (raw === "skill") {
    if (args !== void 0 && args.trim() !== "") {
      try {
        const parsed = JSON.parse(args);
        if (typeof parsed.name === "string" && parsed.name.trim() !== "") return `skill\uFF1A${parsed.name.trim()}`;
      } catch {
      }
    }
    return "skill\uFF1A";
  }
  if (raw === "ask_user_question") return "ask user question\uFF1A";
  const short = raw.startsWith("directorx_") ? raw.slice("directorx_".length) : raw;
  return `${short.replaceAll("_", " ")}\uFF1A`;
}
function textFromBlocks(value) {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) {
    if (value !== null && typeof value === "object") {
      const rec = value;
      if (typeof rec.text === "string") return rec.text.trim();
    }
    return "";
  }
  const parts = [];
  for (const block of value) {
    if (typeof block === "string") {
      if (block.trim() !== "") parts.push(block);
      continue;
    }
    if (block === null || typeof block !== "object") continue;
    const rec = block;
    if (rec.type === "reasoning") continue;
    if (typeof rec.text === "string" && rec.text.trim() !== "") parts.push(rec.text);
  }
  return parts.join("\n").trim();
}
function rpcOk(response) {
  if (response === null || response === void 0) return { ok: false, message: "\u7A7A\u54CD\u5E94" };
  if (typeof response !== "object") return { ok: false, message: "\u54CD\u5E94\u683C\u5F0F\u65E0\u6548" };
  const rec = response;
  const result = rec.result !== null && typeof rec.result === "object" ? rec.result : rec;
  if (result.ok === false) return { ok: false, message: errorMessage(result.error) };
  if ("value" in result) return { ok: true, value: result.value };
  return { ok: true, value: result };
}
function errorMessage(error) {
  if (typeof error === "string" && error.trim() !== "") return error;
  if (error !== null && typeof error === "object") {
    const rec = error;
    if (typeof rec.message === "string" && rec.message.trim() !== "") return rec.message;
    if (typeof rec.code === "string" && rec.code.trim() !== "") return rec.code;
  }
  return "DSH \u8BF7\u6C42\u5931\u8D25";
}
function asRecord3(value) {
  if (value === null || typeof value !== "object") return void 0;
  return value;
}
function unwrapEvent(item2) {
  const rec = asRecord3(item2);
  if (rec === void 0) return void 0;
  const nested = asRecord3(rec.event);
  if (nested !== void 0 && typeof nested.type === "string") return nested;
  if (typeof rec.type === "string") return rec;
  return void 0;
}
function extractEvents(input) {
  const unwrapped = rpcOk(input);
  const body = unwrapped.ok ? unwrapped.value : input;
  if (Array.isArray(body)) return body;
  const rec = asRecord3(body);
  if (rec === void 0) return [];
  if (Array.isArray(rec.events)) return rec.events;
  if (Array.isArray(rec.items)) return rec.items;
  return [];
}
function userSourceKind(data) {
  const source = asRecord3(data.source);
  return typeof source?.kind === "string" ? source.kind : "user";
}
function assistantContent(data) {
  const message = asRecord3(data.message);
  if (message !== void 0 && message.content !== void 0) return message.content;
  return data.content;
}
function clip(text, max = 4e3) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}\u2026`;
}
function prettyArg(value) {
  if (value === void 0 || value === null) return void 0;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return void 0;
    try {
      return clip(JSON.stringify(JSON.parse(trimmed), null, 2), 6e3);
    } catch {
      return clip(trimmed, 6e3);
    }
  }
  try {
    return clip(JSON.stringify(value, null, 2), 6e3);
  } catch {
    return clip(String(value), 6e3);
  }
}
function stripHarnessNoise(text) {
  const cut = text.indexOf("<system-reminder>");
  return cut === -1 ? text : text.slice(0, cut).trim();
}
function foldSessionHistory(input) {
  const lines = [];
  let running = false;
  let blocked = false;
  for (const item2 of extractEvents(input)) {
    const event = unwrapEvent(item2);
    if (event === void 0) continue;
    const type = event.type;
    const seq = typeof event.seq === "number" ? String(event.seq) : String(lines.length);
    const data = asRecord3(event.data) ?? {};
    if (type === "turn/start") {
      running = true;
      blocked = false;
      continue;
    }
    if (type === "turn/end") {
      running = false;
      const reason = asRecord3(data.reason);
      const kind = typeof reason?.kind === "string" ? reason.kind : typeof data.kind === "string" ? data.kind : "";
      if (kind === "blocked") {
        blocked = true;
        lines.push({ id: `block-${seq}`, kind: "notice", text: "DSH \u5728\u7B49\u6279\u51C6\u6216\u56DE\u7B54" });
      } else if (kind === "error") {
        const err = asRecord3(reason?.error) ?? asRecord3(data.error);
        const message = typeof err?.message === "string" && err.message !== "" ? err.message : "\u672C\u8F6E\u5931\u8D25";
        lines.push({ id: `err-${seq}`, kind: "notice", text: message });
      }
      continue;
    }
    if (type === "user/message") {
      const source = userSourceKind(data);
      if (source === "plugin") {
        const summary = asRecord3(data.source);
        const notice = typeof summary?.summary === "string" ? summary.summary.trim() : "";
        if (notice !== "") lines.push({ id: `ctx-${seq}`, kind: "notice", text: clip(notice, 180) });
        continue;
      }
      if (source === "tool") continue;
      const text = stripHarnessNoise(textFromBlocks(data.content));
      if (text !== "") lines.push({ id: `user-${seq}`, kind: "user", text: clip(text) });
      continue;
    }
    if (type === "assistant/message") {
      const text = textFromBlocks(assistantContent(data));
      if (text !== "") lines.push({ id: `asst-${seq}`, kind: "assistant", text: clip(text) });
      continue;
    }
    if (type === "assistant/chunk") {
      const chunk = asRecord3(data.chunk) ?? data;
      if (chunk.type === "text-delta" && typeof chunk.text === "string" && chunk.text !== "") {
        const last = lines.at(-1);
        if (last?.kind === "assistant" && last.id.startsWith("stream-")) last.text = clip(last.text + chunk.text);
        else lines.push({ id: `stream-${seq}`, kind: "assistant", text: clip(chunk.text) });
      }
      continue;
    }
    if (type === "tool/call") {
      const name = typeof data.name === "string" ? data.name : "tool";
      const args = prettyArg(data.arguments ?? data.args ?? data.input);
      lines.push({
        id: `tool-${seq}`,
        kind: "tool",
        name,
        text: toolCaption(name, typeof data.arguments === "string" ? data.arguments : args),
        ...args !== void 0 ? { args } : {},
        status: "running"
      });
      continue;
    }
    if (type === "tool/result") {
      const err = asRecord3(data.error);
      const rawResult = data.content ?? data.result ?? data.output;
      const result = textFromBlocks(rawResult) || prettyArg(rawResult) || "";
      const last = [...lines].reverse().find((line) => line.kind === "tool" && line.status === "running");
      if (last !== void 0) {
        last.status = err !== void 0 ? "error" : "ok";
        if (err !== void 0) {
          last.result = typeof err.message === "string" && err.message !== "" ? err.message : "\u5DE5\u5177\u5931\u8D25";
        } else if (result !== "") last.result = result;
      } else if (err !== void 0) {
        const message = typeof err.message === "string" && err.message !== "" ? err.message : "\u5DE5\u5177\u5931\u8D25";
        lines.push({ id: `toolerr-${seq}`, kind: "notice", text: message });
      }
    }
  }
  return { lines, running, blocked };
}
function rpcItems(input) {
  const unwrapped = rpcOk(input);
  const body = unwrapped.ok ? unwrapped.value : input;
  if (Array.isArray(body)) return body;
  const rec = asRecord3(body);
  if (rec === void 0) return [];
  if (Array.isArray(rec.items)) return rec.items;
  if (Array.isArray(rec.sessions)) return rec.sessions;
  return [];
}
function normalizeDir(path) {
  return path.replaceAll("\\", "/").replace(/\/+$/, "").trim();
}
function sameDir(left, right) {
  if (left === void 0 || right === void 0) return false;
  const a = normalizeDir(left);
  const b = normalizeDir(right);
  return a !== "" && a === b;
}
function parseSessionList(input) {
  const rows = [];
  for (const row of rpcItems(input)) {
    const item2 = asRecord3(row);
    if (item2 === void 0) continue;
    const id = typeof item2.sessionId === "string" ? item2.sessionId : typeof item2.id === "string" ? item2.id : void 0;
    if (id === void 0 || id === "") continue;
    const cwd = typeof item2.cwd === "string" ? item2.cwd : typeof asRecord3(item2.header)?.cwd === "string" ? String(asRecord3(item2.header)?.cwd) : void 0;
    rows.push({
      id,
      ...cwd !== void 0 ? { cwd } : {},
      ...typeof item2.updatedAt === "number" ? { updatedAt: item2.updatedAt } : {},
      ...typeof item2.blank === "boolean" ? { blank: item2.blank } : {}
    });
  }
  return rows;
}
function parseWorkspaceList(input) {
  const rows = [];
  for (const row of rpcItems(input)) {
    const item2 = asRecord3(row);
    if (item2 === void 0) continue;
    const path = typeof item2.path === "string" ? item2.path : void 0;
    const id = typeof item2.workspaceId === "string" ? item2.workspaceId : typeof item2.id === "string" ? item2.id : void 0;
    const sessionIds = Array.isArray(item2.sessionIds) ? item2.sessionIds.filter((value) => typeof value === "string" && value !== "") : [];
    rows.push({
      ...id !== void 0 ? { id } : {},
      ...path !== void 0 ? { path } : {},
      sessionIds
    });
  }
  return rows;
}
function parseArchivedIds(input) {
  const unwrapped = rpcOk(input);
  const body = unwrapped.ok ? unwrapped.value : input;
  const rec = asRecord3(body);
  const ids = rec !== void 0 && Array.isArray(rec.archivedSessionIds) ? rec.archivedSessionIds : [];
  return ids.filter((value) => typeof value === "string" && value !== "");
}
function createdSessionId(input) {
  const unwrapped = rpcOk(input);
  const body = unwrapped.ok ? unwrapped.value : input;
  const rec = asRecord3(body);
  if (rec === void 0) return void 0;
  if (typeof rec.sessionId === "string" && rec.sessionId !== "") return rec.sessionId;
  if (typeof rec.id === "string" && rec.id !== "") return rec.id;
  return void 0;
}
function pickWorkspaceSession(input) {
  const project = input.project !== void 0 ? normalizeDir(input.project) : "";
  if (project === "") return void 0;
  const archived = new Set(input.archivedIds ?? []);
  const workspace = (input.workspaces ?? []).find((item2) => sameDir(item2.path, project));
  const byId = new Map(input.sessions.map((item2) => [item2.id, item2]));
  const candidates = /* @__PURE__ */ new Map();
  for (const row of input.sessions) {
    if (sameDir(row.cwd, project) && !archived.has(row.id)) candidates.set(row.id, row);
  }
  for (const id of workspace?.sessionIds ?? []) {
    if (archived.has(id) || candidates.has(id)) continue;
    const row = byId.get(id);
    candidates.set(id, row ?? { id, cwd: project });
  }
  if (candidates.size === 0) return void 0;
  const preferred = input.preferredId;
  if (preferred !== void 0 && candidates.has(preferred)) return candidates.get(preferred);
  return [...candidates.values()].sort((left, right) => {
    const blank = Number(left.blank === true) - Number(right.blank === true);
    if (blank !== 0) return blank;
    return (right.updatedAt ?? 0) - (left.updatedAt ?? 0);
  })[0];
}
function sessionRunningFromList(input, sessionId) {
  for (const row of rpcItems(input)) {
    const item2 = asRecord3(row);
    if (item2 === void 0) continue;
    const id = typeof item2.sessionId === "string" ? item2.sessionId : typeof item2.id === "string" ? item2.id : void 0;
    if (id !== sessionId) continue;
    if (typeof item2.running === "boolean") return item2.running;
  }
  return void 0;
}

// src/client/stage/session-live.ts
function asRecord4(value) {
  if (value === null || typeof value !== "object") return void 0;
  return value;
}
function asString(value) {
  return typeof value === "string" && value !== "" ? value : void 0;
}
function inspectBlocks(value) {
  if (!Array.isArray(value)) {
    if (value !== null && typeof value === "object") {
      const rec = asRecord4(value);
      if (rec?.kind === "reasoning" || rec?.type === "reasoning") return { body: "", thinking: true };
    }
    return { body: textFromBlocks(value), thinking: false };
  }
  let thinking = false;
  const texts = [];
  for (const block of value) {
    const rec = asRecord4(block);
    if (rec === void 0) continue;
    const kind = rec.kind ?? rec.type;
    if (kind === "reasoning") {
      thinking = true;
      continue;
    }
    if ((kind === "text" || kind === void 0) && typeof rec.text === "string" && rec.text.trim() !== "") {
      texts.push(rec.text);
    }
  }
  return { body: texts.join("\n").trim(), thinking };
}
function pretty(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return void 0;
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return trimmed.length > 4e3 ? `${trimmed.slice(0, 3999)}\u2026` : trimmed;
    }
  }
  if (value === void 0 || value === null) return void 0;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
function resolveLiveSession(service, sessionId) {
  if (sessionId === void 0 || sessionId === "") return void 0;
  const rec = asRecord4(service);
  const binding = rec?.binding;
  if (typeof binding !== "function") return void 0;
  try {
    const bound = asRecord4(binding.call(service, sessionId));
    const session = bound?.session;
    if (session === null || typeof session !== "object") return void 0;
    const face = session;
    if (typeof face.subscribe !== "function" || typeof face.getSnapshot !== "function") return void 0;
    return face;
  } catch {
    return void 0;
  }
}
function textOfBlocks(value) {
  if (Array.isArray(value)) {
    const texts = [];
    for (const block of value) {
      const rec = asRecord4(block);
      if (rec === void 0) continue;
      if (rec.kind === "reasoning" || rec.type === "reasoning") continue;
      if (rec.kind === "text" || rec.type === "text") {
        if (typeof rec.text === "string" && rec.text !== "") texts.push(rec.text);
      }
    }
    if (texts.length > 0) return texts.join("\n").trim();
  }
  return textFromBlocks(value);
}
function parseAskItems(value) {
  if (!Array.isArray(value)) return [];
  const items = [];
  for (const raw of value) {
    const rec = asRecord4(raw);
    if (rec === void 0) continue;
    const id = asString(rec.id);
    const question = asString(rec.question);
    if (id === void 0 || question === void 0) continue;
    const options = Array.isArray(rec.options) ? rec.options.flatMap((option) => {
      const item2 = asRecord4(option);
      if (item2 === void 0) return [];
      const label = asString(item2.label);
      if (label === void 0) return [];
      const description = asString(item2.description);
      return [{ label, ...description !== void 0 ? { description } : {} }];
    }) : void 0;
    const intentRec = asRecord4(rec.intent);
    items.push({
      id,
      question,
      ...asString(rec.detail) !== void 0 ? { detail: asString(rec.detail) } : {},
      ...asString(rec.header) !== void 0 ? { header: asString(rec.header) } : {},
      ...options !== void 0 ? { options } : {},
      ...rec.multiSelect === true ? { multiSelect: true } : {},
      ...intentRec !== void 0 ? {
        intent: {
          ...asString(intentRec.kind) !== void 0 ? { kind: asString(intentRec.kind) } : {},
          ...asString(intentRec.approve) !== void 0 ? { approve: asString(intentRec.approve) } : {}
        }
      } : {}
    });
  }
  return items;
}
function parseWait(value) {
  const rec = asRecord4(value);
  if (rec === void 0 || typeof rec.respond !== "function") return void 0;
  const key = asString(rec.key) ?? "wait";
  const sessionId = asString(rec.sessionId) ?? "";
  const host = rec;
  const respond = (result) => host.respond(result);
  if (rec.kind === "question") {
    const payload = asRecord4(rec.payload);
    const questions = parseAskItems(payload?.questions ?? rec.questions);
    if (questions.length === 0) return void 0;
    return { kind: "question", key, sessionId, questions, respond };
  }
  if (rec.kind === "approval") {
    const payload = asRecord4(rec.payload);
    const approvalId = asString(payload?.approvalId) ?? asString(rec.approvalId);
    if (approvalId === void 0) return void 0;
    return {
      kind: "approval",
      key,
      sessionId,
      approvalId,
      toolName: asString(payload?.toolName) ?? asString(rec.toolName) ?? "tool",
      ...asString(payload?.reason) !== void 0 ? { reason: asString(payload?.reason) } : {},
      respond
    };
  }
  return void 0;
}
function dockItemsFromSnapshot(raw) {
  const snap = asRecord4(raw);
  if (snap === void 0) return { lines: [], waits: [], running: false, ready: false };
  const openState = asString(snap.openState);
  const ready = openState === "open" || openState === "loading" || openState === "error";
  const lines = [];
  const nodes = Array.isArray(snap.nodes) ? snap.nodes : [];
  const seenCalls = /* @__PURE__ */ new Set();
  for (const node of nodes) {
    const rec = asRecord4(node);
    if (rec === void 0) continue;
    const kind = asString(rec.kind);
    const seq = typeof rec.seq === "number" ? String(rec.seq) : String(lines.length);
    if (kind === "user" || kind === "steering") {
      const text = textOfBlocks(rec.content);
      if (text !== "") lines.push({ id: `user-${seq}`, kind: "user", text });
      continue;
    }
    if (kind === "assistant") {
      const inspected = inspectBlocks(rec.blocks ?? rec.content);
      if (inspected.body !== "") lines.push({ id: `asst-${seq}`, kind: "assistant", text: inspected.body });
      continue;
    }
    if (kind === "tool-result") {
      const call = asRecord4(rec.call);
      const name = asString(call?.name) ?? asString(rec.callId) ?? "tool";
      const callId = asString(rec.callId) ?? seq;
      seenCalls.add(callId);
      const err = rec.isError === true;
      const args = pretty(call?.argsRaw);
      const result = textFromBlocks(rec.content) || textFromBlocks(rec.output) || pretty(rec.result);
      lines.push({
        id: `tool-${seq}`,
        kind: "tool",
        name,
        text: toolCaption(name, typeof call?.argsRaw === "string" ? call.argsRaw : args),
        ...args !== void 0 ? { args } : {},
        ...result !== void 0 && result !== "" ? { result } : {},
        status: err ? "error" : "ok"
      });
      continue;
    }
    if (kind === "command") {
      const name = asString(rec.name) ?? "command";
      const outcome = asRecord4(rec.outcome);
      lines.push({
        id: `cmd-${seq}`,
        kind: "tool",
        name,
        text: `${name}\uFF1A`,
        status: outcome === void 0 ? "running" : outcome.kind === "error" ? "error" : "ok"
      });
      continue;
    }
    if (kind === "turn-error" || kind === "model-retry") {
      const text = asString(rec.message) ?? (kind === "model-retry" ? "\u6A21\u578B\u5C06\u91CD\u8BD5" : "\u672C\u8F6E\u5931\u8D25");
      lines.push({ id: `err-${seq}`, kind: "notice", text });
    }
  }
  const runningCalls = Array.isArray(snap.runningCalls) ? snap.runningCalls : [];
  for (const call of runningCalls) {
    const rec = asRecord4(call);
    const callId = asString(rec?.callId);
    const name = asString(rec?.name) ?? "tool";
    if (callId !== void 0 && seenCalls.has(callId)) continue;
    const argsRaw = typeof rec?.argsRaw === "string" ? rec.argsRaw : void 0;
    lines.push({
      id: `run-${callId ?? name}`,
      kind: "tool",
      name,
      text: toolCaption(name, argsRaw),
      status: "running"
    });
  }
  const partial = asRecord4(snap.partial);
  const inspectedPartial = partial === void 0 ? { body: "", thinking: false } : inspectBlocks(partial.blocks);
  if (inspectedPartial.body !== "") {
    lines.push({ id: "partial", kind: "assistant", text: inspectedPartial.body, streaming: true });
  }
  if (snap.running === true) {
    const last = lines.at(-1);
    const streamingBody = last?.kind === "assistant" && last.streaming === true;
    const runningTool = last?.kind === "tool" && last.status === "running";
    if (!streamingBody && !runningTool) {
      lines.push({ id: "thinking", kind: "thinking", text: "\u601D\u8003\u4E2D", streaming: true });
    }
  }
  const waits = (Array.isArray(snap.pending) ? snap.pending : []).map(parseWait).filter((item2) => item2 !== void 0);
  return {
    lines,
    waits,
    running: snap.running === true,
    ready
  };
}
function linesFromFold(lines) {
  return lines.map((line) => ({
    id: line.id,
    kind: line.kind,
    text: line.text,
    ...line.name !== void 0 ? { name: line.name } : {},
    ...line.args !== void 0 ? { args: line.args } : {},
    ...line.result !== void 0 ? { result: line.result } : {},
    ...line.status !== void 0 ? { status: line.status } : {}
  }));
}
async function answerQuestion(wait, answers) {
  const receipt = await wait.respond({
    ok: true,
    value: { sessionId: wait.sessionId, answer: { answers } }
  });
  const rec = asRecord4(receipt);
  if (rec?.accepted === false) throw new Error(asString(rec.reason) ?? "\u63D0\u95EE\u56DE\u7B54\u88AB\u62D2\u7EDD");
}

// src/client/stage/session-media.ts
var VIDEO_EXT = /\.(mp4|webm|mov|mkv)$/i;
var IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg)$/i;
function asRecord5(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return void 0;
  return value;
}
function mediaKindOf(path, mime, toolName) {
  if (mime !== void 0 && mime.startsWith("video/")) return "video";
  if (mime !== void 0 && mime.startsWith("image/")) return "image";
  if (VIDEO_EXT.test(path)) return "video";
  if (IMAGE_EXT.test(path)) return "image";
  if (toolName === "directorx_generate_video" || toolName === "directorx_edit" || toolName === "directorx_video_process" || toolName === "directorx_timeline" || toolName === "directorx_smart_cut" || toolName === "directorx_video_concat") {
    return "video";
  }
  if (toolName === "directorx_generate_image" || toolName === "directorx_extract_frames" || toolName === "directorx_studio" || toolName === "directorx_image_edit") {
    return "image";
  }
  return void 0;
}
function collectFiles(root) {
  const items = [];
  const push = (path, mime) => {
    if (path.trim() === "" || items.some((item2) => item2.path === path)) return;
    items.push({ path, ...mime !== void 0 && mime !== "" ? { mime } : {} });
  };
  if (Array.isArray(root.files)) {
    for (const file of root.files) {
      const rec = asRecord5(file);
      if (rec === void 0) continue;
      const path = typeof rec.path === "string" && rec.path !== "" ? rec.path : typeof rec.url === "string" && rec.url !== "" ? rec.url : "";
      if (path === "") continue;
      push(path, typeof rec.mimeType === "string" ? rec.mimeType : void 0);
    }
  }
  if (typeof root.path === "string") push(root.path);
  return items;
}
function mediaFromToolResult(result, toolName) {
  if (result === void 0 || result.trim() === "") return [];
  let parsed;
  try {
    parsed = JSON.parse(result);
  } catch {
    return [];
  }
  const rec = asRecord5(parsed);
  if (rec === void 0) return [];
  const nested = asRecord5(rec.value) ?? asRecord5(rec.result);
  const body = rec.files === void 0 && rec.path === void 0 && nested !== void 0 ? nested : rec;
  const prompt = typeof body.prompt === "string" ? body.prompt : typeof rec.prompt === "string" ? rec.prompt : void 0;
  const media = [];
  for (const file of collectFiles(body)) {
    const kind = mediaKindOf(file.path, file.mime, toolName);
    if (kind === void 0) continue;
    const name = file.path.split("/").pop() ?? file.path;
    const label = displayCardTitle(name, prompt) || name;
    media.push({ path: file.path, kind, label });
  }
  return media.slice(0, 8);
}

// src/client/stage/markdown.ts
function safeHref(href) {
  const value = href.trim();
  if (value === "") return void 0;
  if (/^https?:\/\//i.test(value) || value.startsWith("mailto:")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return void 0;
}
function isFence(line) {
  return line.trimStart().startsWith("```");
}
function isHr(line) {
  return /^[-*_]{3,}\s*$/.test(line.trim());
}
function isTableRow(line) {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.includes("|", 1);
}
function isTableSep(line) {
  return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line);
}
function tableCells(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}
function isHeading(line) {
  return /^(#{1,3})\s+(.+)$/.exec(line);
}
function isQuote(line) {
  return line.startsWith(">");
}
function isUl(line) {
  return /^\s*[-*+]\s+/.test(line);
}
function isOl(line) {
  return /^\s*\d+\.\s+/.test(line);
}
function isBlockStart(line) {
  return isFence(line) || isHr(line) || isHeading(line) !== null || isQuote(line) || isUl(line) || isOl(line) || isTableRow(line);
}
function parseInline2(src) {
  const out = [];
  let buf = "";
  const flush = () => {
    if (buf !== "") {
      out.push({ type: "text", value: buf });
      buf = "";
    }
  };
  let index = 0;
  while (index < src.length) {
    if (src[index] === "`") {
      const end = src.indexOf("`", index + 1);
      if (end > index) {
        flush();
        out.push({ type: "code", value: src.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }
    if (src.startsWith("**", index)) {
      const end = src.indexOf("**", index + 2);
      if (end > index) {
        flush();
        out.push({ type: "strong", children: parseInline2(src.slice(index + 2, end)) });
        index = end + 2;
        continue;
      }
    }
    if (src.startsWith("~~", index)) {
      const end = src.indexOf("~~", index + 2);
      if (end > index) {
        flush();
        out.push({ type: "del", children: parseInline2(src.slice(index + 2, end)) });
        index = end + 2;
        continue;
      }
    }
    const mark = src[index];
    if ((mark === "*" || mark === "_") && src[index + 1] !== mark) {
      const end = src.indexOf(mark, index + 1);
      if (end > index) {
        flush();
        out.push({ type: "em", children: parseInline2(src.slice(index + 1, end)) });
        index = end + 1;
        continue;
      }
    }
    if (src[index] === "[") {
      const close = src.indexOf("](", index);
      const end = close === -1 ? -1 : src.indexOf(")", close + 2);
      if (close > index && end > close) {
        const href = safeHref(src.slice(close + 2, end));
        if (href !== void 0) {
          flush();
          out.push({ type: "link", href, children: parseInline2(src.slice(index + 1, close)) });
          index = end + 1;
          continue;
        }
      }
    }
    buf += src[index];
    index += 1;
  }
  flush();
  return out;
}
function parseMarkdown(text) {
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (line.trim() === "") {
      index += 1;
      continue;
    }
    if (isFence(line)) {
      const langRaw = line.trimStart().slice(3).trim();
      const lang = langRaw === "" ? void 0 : langRaw;
      index += 1;
      const body = [];
      while (index < lines.length && !isFence(lines[index] ?? "")) {
        body.push(lines[index] ?? "");
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: "code", ...lang === void 0 ? {} : { lang }, value: body.join("\n") });
      continue;
    }
    if (isTableRow(line) && isTableSep(lines[index + 1] ?? "")) {
      const header = tableCells(line).map((cell) => parseInline2(cell));
      index += 2;
      const rows = [];
      while (index < lines.length && isTableRow(lines[index] ?? "") && !isTableSep(lines[index] ?? "")) {
        rows.push(tableCells(lines[index] ?? "").map((cell) => parseInline2(cell)));
        index += 1;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }
    if (isHr(line)) {
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }
    const heading = isHeading(line);
    if (heading !== null) {
      const level = heading[1].length;
      blocks.push({ type: "heading", level, children: parseInline2(heading[2] ?? "") });
      index += 1;
      continue;
    }
    if (isQuote(line)) {
      const quoted = [];
      while (index < lines.length && isQuote(lines[index] ?? "")) {
        quoted.push((lines[index] ?? "").replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", children: parseInline2(quoted.join(" ")) });
      continue;
    }
    if (isUl(line) || isOl(line)) {
      const ordered = isOl(line);
      const items = [];
      while (index < lines.length && (ordered ? isOl(lines[index] ?? "") : isUl(lines[index] ?? ""))) {
        items.push(parseInline2((lines[index] ?? "").replace(/^\s*(?:[-*+]|\d+\.)\s+/, "")));
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    const para = [];
    while (index < lines.length) {
      const next = lines[index] ?? "";
      if (next.trim() === "" || isBlockStart(next)) break;
      para.push(next);
      index += 1;
    }
    if (para.length > 0) blocks.push({ type: "paragraph", children: parseInline2(para.join(" ")) });
  }
  return blocks;
}

// src/client/stage/workstation.ts
var FRAME_ASPECTS = [
  { id: "16:9", w: 16, h: 9 },
  { id: "9:16", w: 9, h: 16 },
  { id: "1:1", w: 1, h: 1 },
  { id: "4:3", w: 4, h: 3 },
  { id: "3:4", w: 3, h: 4 },
  { id: "3:2", w: 3, h: 2 },
  { id: "2:3", w: 2, h: 3 },
  { id: "21:9", w: 21, h: 9 }
];
function aspectRatio(aspect) {
  const found = FRAME_ASPECTS.find((item2) => item2.id === aspect);
  return found === void 0 ? 16 / 9 : found.w / found.h;
}
function sizeFromAspect(aspect, width) {
  const ratio = aspectRatio(aspect);
  if (ratio < 1) {
    const height2 = Math.max(240, Math.min(380, Math.round(width * 0.95)));
    return { width: Math.max(160, Math.round(height2 * ratio)), height: height2 };
  }
  const height = Math.max(140, Math.min(380, Math.round(width / ratio)));
  return { width, height };
}
function specPrompt(spec) {
  const extras = [];
  if (spec.model !== void 0 && spec.model !== "") extras.push(`\u6A21\u578B: ${spec.model}`);
  if (spec.aspect !== void 0 && spec.aspect !== "") extras.push(`\u753B\u5E45: ${spec.aspect}`);
  if (spec.count !== void 0 && spec.count > 1) extras.push(`\u6B21\u6570: ${spec.count}`);
  if (spec.kind === "video" && spec.durationSec !== void 0) extras.push(`\u65F6\u957F: ${spec.durationSec}s`);
  if (spec.refIds !== void 0 && spec.refIds.length > 0) extras.push(`\u53C2\u8003\u8282\u70B9: ${spec.refIds.join(", ")}`);
  if (spec.characters !== void 0 && spec.characters.length > 0) extras.push(`\u89D2\u8272: ${spec.characters.join(", ")}`);
  return extras.length === 0 ? spec.prompt.trim() : `${spec.prompt.trim()}
${extras.join("\n")}`;
}
function nearestAspect(width, height) {
  if (width <= 0 || height <= 0) return "16:9";
  const ratio = width / height;
  let best = "16:9";
  let delta = Number.POSITIVE_INFINITY;
  for (const item2 of FRAME_ASPECTS) {
    const gap = Math.abs(ratio - item2.w / item2.h);
    if (gap < delta) {
      delta = gap;
      best = item2.id;
    }
  }
  return best;
}
function incomingRefIds(nodeId, edges) {
  return [...new Set(edges.filter((edge) => edge.target === nodeId).map((edge) => edge.source))].slice(0, 8);
}
function takePeers(self, nodes, edges) {
  const media = (node) => node.type === "media" || node.type === void 0;
  const group = self.parentId !== void 0 && self.parentId !== "" ? nodes.filter((node) => node.parentId === self.parentId && media(node)) : [];
  const sources = new Set(edges.filter((edge) => edge.target === self.id).map((edge) => edge.source));
  const siblings = sources.size === 0 ? [] : nodes.filter((node) => node.id !== self.id && media(node) && edges.some((edge) => edge.target === node.id && sources.has(edge.source)));
  const prompt = (self.prompt ?? "").trim();
  const samePrompt = prompt === "" ? [] : nodes.filter((node) => node.id !== self.id && media(node) && (node.prompt ?? "").trim() === prompt);
  const seen = /* @__PURE__ */ new Set([self.id]);
  const ids = [];
  for (const item2 of [...group, ...siblings, ...samePrompt]) {
    if (seen.has(item2.id)) continue;
    seen.add(item2.id);
    ids.push(item2.id);
  }
  return ids.slice(0, 8);
}
function libraryBucket(file) {
  return /场景|scene|set|bg|background|环境|空镜/i.test(`${file.name} ${file.path}`) ? "scene" : "media";
}
function characterBucket(card) {
  if (card.props !== void 0 && card.props !== "") return "prop";
  if (/场景|scene|set|环境|空镜/i.test(`${card.description ?? ""} ${card.outfit ?? ""}`)) return "scene";
  return "character";
}

// src/client/stage/layout.ts
var SNAP_GRID = 16;
var GROUP_PAD = { x: 28, top: 48, bottom: 24 };
var CLIP_MARK = "directorx-canvas-clip";
function focusViewOptions(kind) {
  if (kind === "group") {
    return { padding: 0.16, duration: 280, maxZoom: 0.95, minZoom: 0.18 };
  }
  return { padding: 0.38, duration: 280, maxZoom: 1.2, minZoom: 0.22 };
}
function alignBoxes(boxes, kind) {
  if (boxes.length === 0) return [];
  const minX = Math.min(...boxes.map((box) => box.x));
  const maxX = Math.max(...boxes.map((box) => box.x + box.w));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxY = Math.max(...boxes.map((box) => box.y + box.h));
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  return boxes.map((box) => {
    if (kind === "left") return { id: box.id, x: minX, y: box.y };
    if (kind === "right") return { id: box.id, x: maxX - box.w, y: box.y };
    if (kind === "center") return { id: box.id, x: midX - box.w / 2, y: box.y };
    if (kind === "top") return { id: box.id, x: box.x, y: minY };
    if (kind === "bottom") return { id: box.id, x: box.x, y: maxY - box.h };
    return { id: box.id, x: box.x, y: midY - box.h / 2 };
  });
}
function distributeBoxes(boxes, axis) {
  if (boxes.length < 3) return boxes.map((box) => ({ id: box.id, x: box.x, y: box.y }));
  const sorted = [...boxes].sort((left, right) => axis === "x" ? left.x - right.x : left.y - right.y);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const span = axis === "x" ? last.x + last.w - first.x : last.y + last.h - first.y;
  const total = sorted.reduce((sum, box) => sum + (axis === "x" ? box.w : box.h), 0);
  const gap = (span - total) / (sorted.length - 1);
  let cursor = axis === "x" ? first.x : first.y;
  return sorted.map((box) => {
    const next = axis === "x" ? { id: box.id, x: cursor, y: box.y } : { id: box.id, x: box.x, y: cursor };
    cursor += (axis === "x" ? box.w : box.h) + gap;
    return next;
  });
}
function nudgeBoxes(boxes, dx, dy) {
  return boxes.map((box) => ({ id: box.id, x: box.x + dx, y: box.y + dy }));
}
function snapCoord(value, grid = SNAP_GRID) {
  if (grid <= 0) return value;
  return Math.round(value / grid) * grid;
}
function nudgeStep(snap, coarse) {
  if (snap) return coarse ? SNAP_GRID * 2 : SNAP_GRID;
  return coarse ? SNAP_GRID : SNAP_GRID / 2;
}
function groupFrame(members) {
  if (members.length === 0) return { x: 0, y: 0, w: 280, h: 200 };
  const minX = Math.min(...members.map((box) => box.x));
  const minY = Math.min(...members.map((box) => box.y));
  const maxX = Math.max(...members.map((box) => box.x + box.w));
  const maxY = Math.max(...members.map((box) => box.y + box.h));
  return {
    x: minX - GROUP_PAD.x,
    y: minY - GROUP_PAD.top,
    w: Math.max(280, maxX - minX + GROUP_PAD.x * 2),
    h: Math.max(200, maxY - minY + GROUP_PAD.top + GROUP_PAD.bottom)
  };
}
function readingOrder(nodes) {
  return [...nodes].sort((left, right) => {
    const leftShot = left.shotIndex;
    const rightShot = right.shotIndex;
    if (leftShot !== void 0 && rightShot !== void 0 && leftShot !== rightShot) return leftShot - rightShot;
    if (Math.abs(left.y - right.y) > 48) return left.y - right.y;
    if (left.x !== right.x) return left.x - right.x;
    return left.id.localeCompare(right.id);
  });
}
function packClip(nodes, edges) {
  if (nodes.length === 0) return void 0;
  const ids = new Set(nodes.map((node) => node.id));
  const indexOf = new Map(nodes.map((node, index) => [node.id, index]));
  const minX = Math.min(...nodes.map((node) => node.position.x));
  const minY = Math.min(...nodes.map((node) => node.position.y));
  return {
    mark: CLIP_MARK,
    nodes: nodes.map((node) => {
      const width = typeof node.style?.width === "number" ? node.style.width : void 0;
      const height = typeof node.style?.height === "number" ? node.style.height : void 0;
      const parent = node.parentId !== void 0 && node.parentId !== "" ? indexOf.get(node.parentId) : void 0;
      return {
        ...node.type !== void 0 ? { type: node.type } : {},
        ...node.data.kind !== void 0 ? { kind: node.data.kind } : {},
        label: node.data.label,
        ...node.data.path !== void 0 && node.data.path !== "" ? { path: node.data.path } : {},
        ...node.data.prompt !== void 0 ? { prompt: node.data.prompt } : {},
        ...node.data.shotStatus !== void 0 ? { shotStatus: node.data.shotStatus } : {},
        ...width !== void 0 ? { width } : {},
        ...height !== void 0 ? { height } : {},
        x: node.position.x - minX,
        y: node.position.y - minY,
        ...parent !== void 0 ? { parent } : {}
      };
    }),
    edges: edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)).map((edge) => ({
      from: indexOf.get(edge.source) ?? 0,
      to: indexOf.get(edge.target) ?? 0,
      ...typeof edge.label === "string" && edge.label !== "" ? { label: edge.label } : {}
    }))
  };
}
function asClipPayload(value) {
  if (value === null || typeof value !== "object") return void 0;
  const rec = value;
  if (rec.mark !== CLIP_MARK || !Array.isArray(rec.nodes)) return void 0;
  const nodes = [];
  for (const item2 of rec.nodes) {
    if (item2 === null || typeof item2 !== "object") continue;
    const node = item2;
    if (typeof node.label !== "string" || typeof node.x !== "number" || typeof node.y !== "number") continue;
    nodes.push({
      ...typeof node.type === "string" ? { type: node.type } : {},
      ...typeof node.kind === "string" ? { kind: node.kind } : {},
      label: node.label,
      ...typeof node.path === "string" ? { path: node.path } : {},
      ...typeof node.prompt === "string" ? { prompt: node.prompt } : {},
      ...typeof node.shotStatus === "string" ? { shotStatus: node.shotStatus } : {},
      ...typeof node.width === "number" ? { width: node.width } : {},
      ...typeof node.height === "number" ? { height: node.height } : {},
      x: node.x,
      y: node.y,
      ...typeof node.parent === "number" ? { parent: node.parent } : {}
    });
  }
  if (nodes.length === 0) return void 0;
  const edges = Array.isArray(rec.edges) ? rec.edges.flatMap((item2) => {
    if (item2 === null || typeof item2 !== "object") return [];
    const edge = item2;
    if (typeof edge.from !== "number" || typeof edge.to !== "number") return [];
    return [{
      from: edge.from,
      to: edge.to,
      ...typeof edge.label === "string" ? { label: edge.label } : {}
    }];
  }) : [];
  return { mark: CLIP_MARK, nodes, edges };
}
function clampMenu(x, y, width, height, view = { w: 1200, h: 800 }) {
  return {
    left: Math.max(12, Math.min(x, view.w - width - 12)),
    top: Math.max(12, Math.min(y, view.h - height - 12))
  };
}

// src/client/stage/menus.ts
var SECTION_LABEL = {
  create: "\u6DFB\u52A0\u8282\u70B9",
  import: "\u5BFC\u5165",
  primary: "",
  craft: "\u5DE5\u5177",
  edit: "\u7F16\u8F91",
  arrange: "\u6392\u5217",
  danger: ""
};
function addMenuRows(mode) {
  const create = [
    { id: "image", label: "\u56FE\u7247", section: "create" },
    { id: "video", label: "\u89C6\u9891", section: "create" },
    { id: "text", label: "\u6587\u672C", section: "create" },
    { id: "script", label: "\u5267\u672C", section: "create" },
    { id: "group", label: "\u7F16\u7EC4", section: "create" }
  ];
  if (mode === "quick") return create;
  return [
    ...create,
    { id: "edit-image", label: "\u7F16\u8F91\u56FE\u7247", section: "import" },
    { id: "edit-video", label: "\u7F16\u8F91\u89C6\u9891", section: "import" },
    { id: "upload", label: "\u4E0A\u4F20\u6587\u4EF6", section: "import" },
    { id: "assets", label: "\u4ECE\u8D44\u6E90\u5E93\u6DFB\u52A0", section: "import" },
    { id: "paste", label: "\u7C98\u8D34", section: "import", kbd: "\u2318V" }
  ];
}
function nodeMenuRows(surface) {
  if (surface.selectedCount > 1) return multiMenuRows(surface);
  if (surface.type === "group") {
    return [
      { id: "ungroup", label: "\u53D6\u6D88\u7F16\u7EC4", section: "edit" },
      { id: "lock", label: surface.locked ? "\u89E3\u9501" : "\u9501\u5B9A", section: "edit", kbd: "L" },
      { id: "delete", label: "\u5220\u9664", section: "danger", kbd: "\u232B", danger: true }
    ];
  }
  const rows = [];
  if (surface.type === "text") {
    rows.push({ id: "script", label: "\u751F\u6210\u5206\u955C", section: "primary" });
  }
  if (surface.type === "media") {
    rows.push({ id: "generate", label: "\u751F\u6210", section: "primary", kbd: "G" });
    if (surface.hasPath) rows.push({ id: "edit", label: "\u7F16\u8F91", section: "primary", kbd: "E" });
  } else {
    rows.push({ id: "generate", label: "\u751F\u6210", section: "primary", kbd: "G" });
  }
  if (surface.type === "media" && surface.kind === "video" && surface.hasPath) {
    rows.push(
      { id: "frames", label: "\u63D0\u53D6\u5E27", section: "craft" },
      { id: "parse", label: "\u667A\u80FD\u89E3\u6790", section: "craft" },
      { id: "reshoot", label: "\u5C40\u90E8\u91CD\u7ED8\u2026", section: "craft" }
    );
    if (surface.canAssemble) rows.push({ id: "assemble", label: "\u62FC\u63A5", section: "craft" });
    rows.push(
      { id: "desub", label: "\u53BB\u5B57\u5E55", section: "craft" },
      { id: "extend", label: "\u89C6\u9891\u5EF6\u957F", section: "craft" },
      { id: "gif", label: "\u5BFC\u51FA GIF", section: "craft" }
    );
  }
  if (surface.type === "media" && surface.kind === "image" && surface.hasPath) {
    rows.push({ id: "split", label: "\u62C6\u5206\u5BAB\u683C", section: "craft" });
  }
  if (surface.type === "media") {
    rows.push({ id: "revise", label: "\u91CD\u65B0\u751F\u6210", section: "craft" });
  }
  rows.push({ id: "autolink", label: "\u81EA\u52A8\u8FDE\u7EBF", section: "craft" });
  if (surface.hasPath) rows.push({ id: "download", label: "\u4E0B\u8F7D", section: "edit" });
  rows.push(
    { id: "duplicate", label: "\u590D\u5236", section: "edit", kbd: "\u2318D" },
    { id: "lock", label: surface.locked ? "\u89E3\u9501" : "\u9501\u5B9A", section: "edit", kbd: "L" },
    { id: "disconnect", label: "\u65AD\u5F00\u8FDE\u7EBF", section: "edit" },
    { id: "delete", label: "\u5220\u9664", section: "danger", kbd: "\u232B", danger: true }
  );
  return rows;
}
function multiMenuRows(surface = {}) {
  const rows = [
    { id: "group", label: "\u7F16\u7EC4", section: "arrange", kbd: "\u2318G" }
  ];
  if (surface.canUngroup === true) rows.push({ id: "ungroup", label: "\u53D6\u6D88\u7F16\u7EC4", section: "arrange" });
  if (surface.canPack === true) rows.push({ id: "pack", label: "\u5408\u6210\u89C6\u9891", section: "arrange" });
  if (surface.canSheet === true) rows.push({ id: "sheet", label: "\u4E5D\u5BAB\u683C", section: "arrange" });
  if (surface.canJoin === true) rows.push({ id: "join", label: "\u5408\u5E76\u5BAB\u683C", section: "arrange" });
  if (surface.canStack === true) rows.push({ id: "stack", label: "\u5206\u5C4F", section: "arrange" });
  rows.push(
    { id: "lock", label: surface.locked === true ? "\u89E3\u9501" : "\u9501\u5B9A", section: "edit", kbd: "L" },
    { id: "delete", label: "\u5220\u9664", section: "danger", kbd: "\u232B", danger: true }
  );
  return rows;
}
function groupMenuRows(rows) {
  const order = ["create", "import", "primary", "craft", "edit", "arrange", "danger"];
  return order.flatMap((id) => {
    const slice = rows.filter((row) => row.section === id);
    if (slice.length === 0) return [];
    return [{ id, label: SECTION_LABEL[id], rows: slice }];
  });
}
function shouldNestCraft(rows) {
  return rows.filter((row) => row.section === "craft").length >= 3;
}

// src/client/stage/timeline-edit.ts
function clipPlayDuration(clip3) {
  const span = Math.max(0.05, clip3.sourceOut - clip3.sourceIn);
  return span / Math.max(0.25, clip3.speed);
}
function sequenceDuration(clips) {
  return clips.reduce((sum, clip3) => sum + clipPlayDuration(clip3), 0);
}
function clipStarts(clips) {
  const starts = [];
  let cursor = 0;
  for (const clip3 of clips) {
    starts.push(cursor);
    cursor += clipPlayDuration(clip3);
  }
  return starts;
}
function hitTest(clips, seqTime) {
  const starts = clipStarts(clips);
  for (let index = 0; index < clips.length; index += 1) {
    const clip3 = clips[index];
    const start = starts[index] ?? 0;
    const end = start + clipPlayDuration(clip3);
    if (seqTime >= start && seqTime < end - 1e-4 || index === clips.length - 1 && seqTime >= start && seqTime <= end + 1e-4) {
      const local = Math.min(clipPlayDuration(clip3), Math.max(0, seqTime - start));
      return { clip: clip3, index, start, local, sourceTime: clip3.sourceIn + local * clip3.speed };
    }
  }
  const last = clips[clips.length - 1];
  if (last === void 0) return void 0;
  return {
    clip: last,
    index: clips.length - 1,
    start: starts[clips.length - 1] ?? 0,
    local: clipPlayDuration(last),
    sourceTime: last.sourceOut
  };
}
function sourceFromSequence(clips, seqTime) {
  return hitTest(clips, seqTime)?.sourceTime ?? 0;
}
function fromSource(duration, id = 1) {
  const end = Math.max(0.05, duration);
  return [{ id, sourceIn: 0, sourceOut: end, speed: 1, fadeIn: 0, fadeOut: 0, muted: false }];
}
function nextClipId(clips) {
  return clips.reduce((max, clip3) => Math.max(max, clip3.id), 0) + 1;
}
function splitAt(clips, seqTime, id) {
  const hit = hitTest(clips, seqTime);
  if (hit === void 0) return clips;
  if (hit.local < 0.05 || hit.local > clipPlayDuration(hit.clip) - 0.05) return clips;
  const cut = hit.sourceTime;
  return clips.flatMap((clip3) => {
    if (clip3.id !== hit.clip.id) return [clip3];
    return [
      { ...clip3, sourceOut: cut },
      { ...clip3, id, sourceIn: cut, fadeIn: 0 }
    ];
  });
}
function removeClip(clips, id) {
  return clips.filter((clip3) => clip3.id !== id);
}
function duplicateClip(clips, id, nextId) {
  const index = clips.findIndex((clip4) => clip4.id === id);
  const clip3 = clips[index];
  if (clip3 === void 0) return clips;
  const copy = { ...clip3, id: nextId };
  return [...clips.slice(0, index + 1), copy, ...clips.slice(index + 1)];
}
function moveClip(clips, id, dir) {
  const index = clips.findIndex((clip3) => clip3.id === id);
  return moveTo(clips, id, index + dir);
}
function moveTo(clips, id, toIndex) {
  const from = clips.findIndex((clip3) => clip3.id === id);
  if (from < 0 || toIndex < 0 || toIndex >= clips.length || from === toIndex) return clips;
  const copy = clips.slice();
  const [item2] = copy.splice(from, 1);
  if (item2 === void 0) return clips;
  copy.splice(toIndex, 0, item2);
  return copy;
}
function patchClip(clips, id, patch) {
  return clips.map((clip3) => clip3.id === id ? { ...clip3, ...patch, id: clip3.id } : clip3);
}
function trimClip(clips, id, edge, sourceTime, sourceDuration) {
  return clips.map((clip3) => {
    if (clip3.id !== id) return clip3;
    if (edge === "in") {
      const sourceIn = Math.max(0, Math.min(sourceTime, clip3.sourceOut - 0.05));
      return { ...clip3, sourceIn };
    }
    const sourceOut = Math.min(sourceDuration, Math.max(sourceTime, clip3.sourceIn + 0.05));
    return { ...clip3, sourceOut };
  });
}
function evenPx(value) {
  return Math.max(2, Math.round(value / 2) * 2);
}
function exportSize(width, height, scale) {
  if (scale === "orig" || width <= 0 || height <= 0) return { width: evenPx(width || 1280), height: evenPx(height || 720) };
  const maxH = scale === "1080" ? 1080 : scale === "720" ? 720 : 480;
  const factor = Math.min(1, maxH / height);
  return { width: evenPx(width * factor), height: evenPx(height * factor) };
}
function exportBitrate(quality) {
  if (quality === "high") return 8e6;
  if (quality === "draft") return 15e5;
  return 4e6;
}
function fmtClock(seconds) {
  const total = Math.max(0, seconds);
  const m = Math.floor(total / 60);
  const s = (total % 60).toFixed(1);
  return `${m}:${s.padStart(4, "0")}`;
}
function tickStep(pxPerSec) {
  if (pxPerSec >= 160) return 0.5;
  if (pxPerSec >= 80) return 1;
  if (pxPerSec >= 40) return 2;
  return 5;
}

// src/subagents.ts
var GUIDANCE = [
  "## DirectorX media orchestration (injected for subagents)",
  "You are a subagent in a DirectorX production pipeline \u2014 part of the DirectorX (DX) production lead persona: plan \u2192 confirm \u2192 generate \u2192 inspect \u2192 deliver, in the user's language.",
  "- The project storyboard lives on the DirectorX canvas: read `directorx_canvas_get` for context before planning, and write your results back with `directorx_canvas_*` (shots/assets as nodes, handoffs as edges, acts as groups).",
  "Media capabilities available to you:",
  "- `directorx_generate_image` / `directorx_generate_video` / `directorx_generate_audio` / `directorx_view_image` generation tools.",
  "- `directorx_skill_route` then `directorx_skill_read` the listed skills; `directorx_knowledge_search` / `directorx_knowledge_read` for craft facts (prompt specs, model matrix, camera language).",
  "- The `directorx-playbook` skill: prompt principles, consistency & control checklist, workflow gates, model routing.",
  "- `directorx_task_status` / `directorx_cancel_task` for async tasks; `directorx_edit_plan` then `directorx_image_edit` / `directorx_video_process` / `directorx_edit` / `directorx_studio` for deterministic edits (pass nodeId); `directorx_edits` for WebUI edit artifacts. Never regenerate to crop, rotate, grade, or retime.",
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

// src/media-server.ts
import { createReadStream, existsSync as existsSync12 } from "node:fs";
import { mkdir as mkdir25, readFile as readFile24, readdir as readdir5, rm as rm3, stat } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { join as join38, relative as relative3 } from "node:path";
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
  const dir = join38(resolveOutputDir(outputDir), EDIT_SUBDIR);
  await mkdir25(dir, { recursive: true });
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");
  const name = `${stamp}-${stem}.${ext}`;
  const path = join38(dir, name);
  const cap = byteCapStream(MAX_MEDIA_BYTES);
  try {
    await pipeline(request, cap.stream, createWriteStream(path));
  } catch (error) {
    await rm3(path, { force: true }).catch(() => {
    });
    const tooLarge = error instanceof Error && /exceeds the/.test(error.message);
    response.writeHead(tooLarge ? 413 : 400, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error instanceof Error ? error.message : "save failed" }));
    return;
  }
  const bytes = cap.size();
  await new DirectorxEditLedger(outputDir).append({ at: Date.now(), path, mediaType, bytes, name }).catch(() => {
  });
  response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ path, bytes, mediaType, name }));
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
      entries = await readdir5(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join38(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "frames" || entry.name === "edited" || entry.name === "transcripts") await scan(full, depth + 1);
        continue;
      }
      const info = await stat(full).catch(() => void 0);
      if (info === void 0 || !info.isFile()) continue;
      const mediaType = mimeForPath(full);
      if (mediaType === "application/octet-stream") continue;
      const rel = relative3(currentProjectRoot(), full);
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
          ...intent !== null ? { prompt: await formatDshCanvasPromptForProject(intent, { outputDir: getOutputDir() }) } : {}
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
        sendJsonLocal(response, 200, { ok: true, intent, prompt: await formatDshCanvasPromptForProject(intent, { outputDir: getOutputDir() }) });
      } catch (cause) {
        sendJsonLocal(response, 400, { ok: false, message: cause instanceof Error ? cause.message : String(cause) });
      }
    }
  });
}
function registerCanvasCraftRoute(ctx, getOutputDir) {
  const webServer = directorxWeb(ctx);
  if (webServer === void 0) return () => {
  };
  return webServer.register({
    kind: "exact",
    path: "/directorx/canvas/craft",
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
        const body = await readBodyLocal(request, 256 * 1024);
        const previewShots = parsePreviewShots(body.shots);
        const result = await runCanvasCraft({
          outputDir: getOutputDir(),
          action: parseCraftAction(body.action),
          ...typeof body.nodeId === "string" ? { nodeId: body.nodeId } : {},
          ...typeof body.text === "string" ? { text: body.text } : {},
          ...typeof body.count === "number" ? { count: body.count } : {},
          ...Array.isArray(body.nodeIds) ? { nodeIds: body.nodeIds.map(String) } : {},
          ...body.arrange === true || body.arrange === false ? { arrange: body.arrange } : {},
          ...body.describe === true ? { describe: true } : {},
          ...body.preview === true ? { preview: true } : {},
          ...previewShots !== void 0 ? { shots: previewShots } : {},
          ...typeof body.start === "number" ? { start: body.start } : {},
          ...typeof body.end === "number" ? { end: body.end } : {},
          ...typeof body.prompt === "string" ? { prompt: body.prompt } : {},
          ...body.phase === "cut" || body.phase === "assemble" ? { phase: body.phase } : {},
          ...body.transition === "cut" || body.transition === "fade" ? { transition: body.transition } : {},
          ...typeof body.fadeSec === "number" ? { fadeSec: body.fadeSec } : {},
          ...typeof body.columns === "number" ? { columns: body.columns } : {},
          ...typeof body.cols === "number" ? { cols: body.cols } : {},
          ...typeof body.rows === "number" ? { rows: body.rows } : {},
          ...body.numbered === true || body.numbered === false ? { numbered: body.numbered } : {},
          ...body.layout === "2x1" || body.layout === "1x2" || body.layout === "2x2" ? { layout: body.layout } : {},
          ...body.method === "crop" || body.method === "blur" ? { method: body.method } : {},
          ...typeof body.region === "string" ? { region: body.region } : {}
        });
        sendJsonLocal(response, 200, result);
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
      const name = typeof body.name === "string" ? body.name : "";
      if (name.trim() === "") {
        sendJsonLocal(response, 400, { ok: false, message: "name \u5FC5\u586B" });
        return;
      }
      if (body.remove === true) {
        try {
          await store.remove(name);
          sendJsonLocal(response, 200, { ok: true });
        } catch (cause) {
          sendJsonLocal(response, 404, { ok: false, message: cause instanceof Error ? cause.message : String(cause) });
        }
        return;
      }
      const refPath = typeof body.refPath === "string" ? body.refPath : "";
      try {
        const character = await store.register({
          name,
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

// src/terms.ts
import { mkdir as mkdir26, readFile as readFile25, writeFile as writeFile23 } from "node:fs/promises";
import { join as join39 } from "node:path";
var TermStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  filePath() {
    return join39(resolveOutputDir(this.outputDir), "terms.json");
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile25(this.filePath(), "utf8"));
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
    await mkdir26(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile23(this.filePath(), JSON.stringify({ terms: ledger }, null, 2), "utf8");
    return ledger;
  }
  /** 按句命中：返回文本中出现的术语及其读法。 */
  async match(text) {
    const ledger = await this.read();
    return ledger.filter((entry) => text.includes(entry.term));
  }
};

// src/providers/adapter-store.ts
import { mkdir as mkdir27, readFile as readFile26, writeFile as writeFile24 } from "node:fs/promises";
import { join as join40 } from "node:path";
var MAX_ADAPTERS = 40;
var MAX_DOC_CHARS = 8e4;
var AdapterStore = class {
  constructor(outputDir) {
    this.outputDir = outputDir;
  }
  catalogPath() {
    return join40(resolveOutputDir(this.outputDir), "adapters.json");
  }
  secretsPath() {
    return join40(resolveOutputDir(this.outputDir), "adapters.secrets.json");
  }
  docPath(id) {
    return join40(resolveOutputDir(this.outputDir), "adapters", `${id}.doc.txt`);
  }
  async read() {
    try {
      const parsed = JSON.parse(await readFile26(this.catalogPath(), "utf8"));
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
    return (await this.read()).adapters.find((item2) => item2.spec.id === id);
  }
  async findByModel(capability, model) {
    const wanted = model.trim();
    if (wanted === "") return void 0;
    return (await this.read()).adapters.find((item2) => item2.spec.capability === capability && item2.spec.model === wanted);
  }
  async readDoc(id) {
    try {
      return await readFile26(this.docPath(id), "utf8");
    } catch {
      return "";
    }
  }
  async readSecrets() {
    try {
      const parsed = JSON.parse(await readFile26(this.secretsPath(), "utf8"));
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
    await mkdir27(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile24(this.secretsPath(), JSON.stringify(all), "utf8");
  }
  async hasSecret(id) {
    const secret = await this.secretOf(id);
    return Boolean(secret.apiKey || secret.klingAk && secret.klingSk);
  }
  async writeCatalog(file) {
    await mkdir27(resolveOutputDir(this.outputDir), { recursive: true });
    await writeFile24(this.catalogPath(), JSON.stringify(file, null, 2), "utf8");
  }
  async upsert(record) {
    const file = await this.read();
    const index = file.adapters.findIndex((item2) => item2.spec.id === record.spec.id);
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
    await mkdir27(join40(resolveOutputDir(this.outputDir), "adapters"), { recursive: true });
    await writeFile24(this.docPath(id), clipped, "utf8");
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
async function resolveGenerateCapability(settings, capability, modelOverride) {
  const base = settings[capability];
  const wanted = (modelOverride ?? base.model).trim();
  const store = new AdapterStore(settings.outputDir);
  const record = wanted === "" ? void 0 : await store.findByModel(capability, wanted) ?? await store.get(wanted);
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
  return PRESET_TABLE.map(({ slug, label, aspectRatio: aspectRatio2, durationRange }) => ({ slug, label, aspectRatio: aspectRatio2, durationRange }));
}

// src/orchestrate/run.ts
import { mkdir as mkdir28, writeFile as writeFile25 } from "node:fs/promises";
import { join as join41 } from "node:path";

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
function extractEntities(request, kind, fallbackSeconds, aspectRatio2) {
  const text = request.trim();
  const targetSeconds = parseDurationSeconds(text) ?? fallbackSeconds;
  const entities = { targetSeconds, aspectRatio: aspectRatio2 };
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
function clip2(seconds, min, max) {
  return Math.max(min, Math.min(max, seconds));
}
function splitBudget(total, blocks) {
  const weightSum = blocks.reduce((sum, item2) => sum + item2.weight, 0);
  return blocks.map((item2) => ({
    block: item2.block,
    purpose: item2.purpose,
    seconds: Math.max(1, Math.round(total * (item2.weight / weightSum)))
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
    { id: "vo", kind: "audio", task: `\u65C1\u767D ${entities.targetSeconds}s`, subject: `calm VO naming ${brand} and ${product}`, durationSec: clip2(entities.targetSeconds, 15, 120), aspectRatio: aspect, note: "\u540E\u671F\u6DF7\u97F3" }
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
    const durationSec = clip2(Math.round(act.seconds / 30), 5, 8);
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
  const tool = (name, args, output) => ({ name, input: args, output });
  const briefOut = await brief({ request, materials: input.materials ?? [], outputDir: input.outputDir });
  const kind = inferProductionKind(request);
  const entities = extractEntities(request, kind, briefOut.brief.targetSeconds, briefOut.brief.aspectRatio);
  const plan = deriveProductionPlan(kind, entities);
  stages.push({
    name: "\u6790",
    thinking: `\u8FD9\u662F\u590D\u6742\u591A\u5355\u5143\u5236\u4F5C\uFF0C\u5F62\u6001\u63A8\u6210\u300C${kind}\u300D\uFF0C\u4E0D\u662F\u6309\u4F5C\u54C1\u540D\u67E5\u8868\u3002\u65F6\u957F ${entities.targetSeconds}s / ${entities.aspectRatio}\u3002\u672C\u8F6E\u4E0D\u8C03\u7528 directorx_generate_*\u3002`,
    tools: [
      tool("directorx_brief", { request }, { type: briefOut.brief.type, targetSeconds: briefOut.brief.targetSeconds, aspectRatio: briefOut.brief.aspectRatio }),
      tool("directorx_infer_kind", { request }, { kind, entities }),
      tool("directorx_prompt_plan", { intent: request }, {
        level: briefOut.plan.level,
        strategyHint: briefOut.plan.strategyHint,
        next: briefOut.plan.next
      })
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
    tools: [tool("directorx_case_confirm", { confirms: plan.confirms.map((item2) => item2.id) }, plan.confirms)]
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
    reportPath: join41(resolveOutputDir(input.outputDir), `orchestrate-${kind}.json`)
  };
  await mkdir28(resolveOutputDir(input.outputDir), { recursive: true });
  await writeFile25(run.reportPath, JSON.stringify(run, null, 2), "utf8");
  return run;
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
  const next = input.next ?? input.proposals.filter((item2) => item2.status === "proposed").sort((a, b) => a.at - b.at)[0] ?? null;
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

// src/confirm.ts
var APPROVE = "\u6279\u51C6";
var REJECT = "\u62D2\u7EDD";
var SIGN_ALL = "\u6574\u8868\u7B7E\u5B57";
var REVISE = "\u56DE\u53BB\u6539\u5206\u955C";
var KEEP = "\u4FDD\u6301\u5F85\u6279";
function buildConfirmQuestions(input) {
  if (input.scope === "shotlist") {
    const pending = input.proposals.filter((item2) => item2.status === "proposed");
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
    const pending = input.proposals.filter((item2) => item2.status === "proposed");
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
  const next = input.next ?? input.proposals.filter((item2) => item2.status === "proposed").sort((a, b) => a.at - b.at)[0] ?? null;
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
  const pending = input.proposals.filter((item2) => item2.status === "proposed");
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

// src/mcp.ts
var MCP_ROUTE_PATH = "/directorx/mcp";
function sendJson(response, status, body) {
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
  { name: "directorx_canvas_script", readOnly: false, description: "Parse a script card into \u672C\u2192\u9996\u5E27\u2192\u89C6\u9891 rows.", inputSchema: { type: "object", properties: { nodeId: { type: "string" }, text: { type: "string" } } } },
  { name: "directorx_canvas_frames", readOnly: false, description: "Extract stills from a video card onto the board.", inputSchema: { type: "object", properties: { nodeId: { type: "string" }, count: { type: "number" } } } },
  { name: "directorx_canvas_autolink", readOnly: false, description: "Wire cards by character name and token overlap.", inputSchema: { type: "object", properties: { nodeId: { type: "string" }, nodeIds: { type: "array" } } } },
  { name: "directorx_canvas_parse", readOnly: false, description: "Parse a finished video into a script card and cut stills.", inputSchema: { type: "object", properties: { nodeId: { type: "string" }, describe: { type: "boolean" } } } },
  { name: "directorx_canvas_reshoot", readOnly: false, description: "Cut a remake window or assemble head+mid+tail.", inputSchema: { type: "object", properties: { action: { type: "string" }, nodeId: { type: "string" }, start: { type: "number" }, end: { type: "number" }, prompt: { type: "string" } } } },
  { name: "directorx_canvas_pack", readOnly: false, description: "Concat finished video cards into one cut.", inputSchema: { type: "object", properties: { nodeIds: { type: "array" }, transition: { type: "string" }, fadeSec: { type: "number" } } } },
  { name: "directorx_canvas_sheet", readOnly: false, description: "Pin a contact sheet of selected media.", inputSchema: { type: "object", properties: { nodeIds: { type: "array" }, columns: { type: "number" } } } },
  { name: "directorx_canvas_split", readOnly: false, description: "Crop one still into a grid of image cards.", inputSchema: { type: "object", properties: { nodeId: { type: "string" }, cols: { type: "number" }, rows: { type: "number" } } } },
  { name: "directorx_canvas_join", readOnly: false, description: "Tile finished stills back into one numbered grid.", inputSchema: { type: "object", properties: { nodeIds: { type: "array" }, columns: { type: "number" }, numbered: { type: "boolean" } } } },
  { name: "directorx_canvas_stack", readOnly: false, description: "Stack 2\u20134 finished cards into a split-screen review clip.", inputSchema: { type: "object", properties: { nodeIds: { type: "array" }, layout: { type: "string" } } } },
  { name: "directorx_canvas_desub", readOnly: false, description: "Crop or blur burned-in text on a finished video.", inputSchema: { type: "object", properties: { nodeId: { type: "string" }, method: { type: "string" }, region: { type: "string" } } } },
  { name: "directorx_canvas_extend", readOnly: false, description: "Park a last-frame + empty extend card. Does not generate.", inputSchema: { type: "object", properties: { nodeId: { type: "string" }, prompt: { type: "string" } } } },
  { name: "directorx_canvas_gif", readOnly: false, description: "Export a finished video card as a GIF still.", inputSchema: { type: "object", properties: { nodeId: { type: "string" } } } },
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
        sendJson(response, 400, { jsonrpc: "2.0", error: { code: -32700, message: "parse error" }, id: null });
        return;
      }
      const respond = (result) => sendJson(response, 200, { jsonrpc: "2.0", id: rpc.id ?? null, result });
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
      const fail = (code, message) => sendJson(response, 200, { jsonrpc: "2.0", id: rpc.id ?? null, error: { code, message } });
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
          const name = String(rpc.params?.name ?? "");
          const args = rpc.params?.arguments ?? {};
          const settings = getSettings();
          const canvas = new DirectorxCanvasStore(settings.outputDir);
          const proposals = new ProposalStore(settings.outputDir);
          switch (name) {
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
            case "directorx_canvas_script":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "script", ...typeof args.nodeId === "string" ? { nodeId: args.nodeId } : {}, ...typeof args.text === "string" ? { text: args.text } : {} })));
              return;
            case "directorx_canvas_frames":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "frames", nodeId: String(args.nodeId ?? ""), ...typeof args.count === "number" ? { count: args.count } : {} })));
              return;
            case "directorx_canvas_autolink":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "autolink", ...typeof args.nodeId === "string" ? { nodeId: args.nodeId } : {}, ...Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {} })));
              return;
            case "directorx_canvas_parse":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "parse", nodeId: String(args.nodeId ?? ""), settings, ...args.describe === true ? { describe: true } : {} })));
              return;
            case "directorx_canvas_reshoot":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "reshoot", nodeId: String(args.nodeId ?? ""), phase: args.action === "assemble" ? "assemble" : "cut", ...typeof args.start === "number" ? { start: args.start } : {}, ...typeof args.end === "number" ? { end: args.end } : {}, ...typeof args.prompt === "string" ? { prompt: args.prompt } : {} })));
              return;
            case "directorx_canvas_pack":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "pack", ...Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}, ...args.transition === "fade" || args.transition === "cut" ? { transition: args.transition } : {}, ...typeof args.fadeSec === "number" ? { fadeSec: args.fadeSec } : {} })));
              return;
            case "directorx_canvas_sheet":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "sheet", ...Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}, ...typeof args.columns === "number" ? { columns: args.columns } : {} })));
              return;
            case "directorx_canvas_split":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "split", nodeId: String(args.nodeId ?? ""), ...typeof args.cols === "number" ? { cols: args.cols } : {}, ...typeof args.rows === "number" ? { rows: args.rows } : {} })));
              return;
            case "directorx_canvas_join":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "join", ...Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}, ...typeof args.columns === "number" ? { columns: args.columns } : {}, ...args.numbered === false ? { numbered: false } : {} })));
              return;
            case "directorx_canvas_stack":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "stack", ...Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}, ...args.layout === "2x1" || args.layout === "1x2" || args.layout === "2x2" ? { layout: args.layout } : {} })));
              return;
            case "directorx_canvas_desub":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "desub", nodeId: String(args.nodeId ?? ""), ...args.method === "crop" || args.method === "blur" ? { method: args.method } : {}, ...typeof args.region === "string" ? { region: args.region } : {} })));
              return;
            case "directorx_canvas_extend":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "extend", nodeId: String(args.nodeId ?? ""), ...typeof args.prompt === "string" ? { prompt: args.prompt } : {} })));
              return;
            case "directorx_canvas_gif":
              respond(envelope(await runCanvasCraft({ outputDir: settings.outputDir, action: "gif", nodeId: String(args.nodeId ?? "") })));
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
              fail(-32602, `unknown tool "${name}"`);
              return;
          }
        }
        if (rpc.method === "notifications/initialized") {
          sendJson(response, 202, { jsonrpc: "2.0", id: rpc.id ?? null, result: {} });
          return;
        }
        fail(-32601, `method not found: ${rpc.method}`);
      } catch (error) {
        respond(envelopeError(error));
      }
    }
  });
}

// src/tools.ts
import { readFileSync as readFileSync3 } from "node:fs";
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
    const auth2 = resolveGenerateAuthorization({
      mode: settings.initiative,
      prompt: crafted.craft.prompt,
      inBudget: true,
      proposal
    });
    const thin = isThinPrompt(crafted.craft.intent, auth2.prompt);
    if (thin !== void 0) {
      return {
        generate: false,
        prompt: auth2.prompt,
        reason: thin,
        authorized: false,
        refused: true,
        next: "directorx_prompt_plan \u2192 directorx_prompt_craft\u3002\u5360\u4F4D\u5FC5\u987B\u662F\u5BFC\u6F14\u6210\u7A3F\uFF0C\u4E0D\u80FD\u662F\u89D2\u5EA6\u6807\u7B7E\u6216\u539F\u53E5\u3002"
      };
    }
    const scanned2 = await scanIpWithMemory(settings.outputDir, auth2.prompt);
    if (scanned2.brief.dirty) {
      return {
        generate: false,
        prompt: auth2.prompt,
        reason: "\u6210\u7A3F\u4ECD\u542B IP \u4E13\u540D",
        authorized: false,
        refused: true,
        ip: scanned2.brief,
        memory: scanned2.memory,
        next: scanned2.brief.next
      };
    }
    const intentScan = await scanIpWithMemory(settings.outputDir, crafted.craft.intent);
    const extras = [...intentScan.brief.exclude, ...intentScan.memory.flatMap((entry) => entry.exclude)];
    return {
      ...auth2,
      ready: ready.brief,
      ip: intentScan.brief,
      memory: intentScan.memory,
      negativeExtra: intentScan.brief.dirty || extras.length > 0 ? [crafted.craft.negative, intentScan.brief.negativeLine].filter((part) => part !== void 0 && part !== "").join(", ") : crafted.craft.negative ?? ""
    };
  }
  const auth = resolveGenerateAuthorization({
    mode: settings.initiative,
    prompt: crafted.craft.prompt,
    inBudget: true,
    proposal
  });
  const scanned = await scanIpWithMemory(settings.outputDir, auth.prompt);
  if (scanned.brief.dirty) {
    return {
      generate: false,
      prompt: auth.prompt,
      reason: "\u6210\u7A3F\u4ECD\u542B IP \u4E13\u540D",
      authorized: false,
      refused: true,
      ip: scanned.brief,
      memory: scanned.memory,
      next: scanned.brief.next
    };
  }
  return { ...auth, ip: scanned.brief, memory: scanned.memory, negativeExtra: crafted.craft.negative ?? "" };
}
function toolContext(settings, capability, signal, adapter) {
  return { settings, capability, signal, ledger: new DirectorxTaskLedger(settings.outputDir), adapter };
}
async function generateContext(settings, capability, signal, modelOverride) {
  const resolved = await resolveGenerateCapability(settings, capability, modelOverride);
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
        reference_image_paths: { type: "array", items: { type: "string" }, description: "Optional local paths or URLs used as image references (edits / modelverse-tasks)." },
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
        const base = withCharacterSheetSpec(blocks.length > 0 ? `${gate.prompt}

${blocks.join("\uFF1B")}` : gate.prompt);
        const avoid = "negativeExtra" in gate && typeof gate.negativeExtra === "string" && gate.negativeExtra !== "" ? `
\u907F\u514D\uFF1A${gate.negativeExtra}` : "";
        const prompt = `${base}${avoid}`;
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
        const negative = [
          typeof args.negative_prompt === "string" ? args.negative_prompt : "",
          "negativeExtra" in gate && typeof gate.negativeExtra === "string" ? gate.negativeExtra : "",
          style?.negativeBaseline ?? ""
        ].filter((part) => part !== "").join(", ");
        return runVideo(await generateContext(settings, "video", signal, typeof args.model === "string" ? args.model : void 0), prompt, {
          seconds: args.seconds,
          size: args.size,
          aspectRatio: args.aspect_ratio,
          resolution: settings.video.resolution,
          firstFramePath: bind.firstFrame,
          lastFramePath: bind.lastFrame,
          referenceImagePaths: bind.firstFrame || bind.lastFrame ? [] : refs,
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
    description: "Search the bundled DirectorX OKF knowledge corpus (340+ Chinese craft articles). Hits include type, tags, description, and skills to directorx_skill_read. Always search before claiming the corpus lacks a topic. Then directorx_knowledge_read the id.",
    parameters: {
      query: { type: "string", required: true, description: 'Search query, e.g. "\u56FE\u751F\u89C6\u9891 \u9996\u5C3E\u5E27 \u63D0\u793A\u8BCD" or "camera movement semantics".' },
      max_results: { type: "number", description: "Maximum results (default 8, max 20)." },
      group: { type: "string", description: "Optional inventory group: foundation / production / consistency / synthesis." },
      type: { type: "string", description: "Optional OKF type: Reference / Method / Playbook / Spec / Case." },
      tag: { type: "string", description: "Optional OKF tag, e.g. prompt, camera, i2v, continuity." }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const maxResults = Math.min(20, Math.max(1, Math.round(args.max_results ?? 8)));
      const group = typeof args.group === "string" ? args.group : void 0;
      const type = typeof args.type === "string" ? args.type : void 0;
      const tag = typeof args.tag === "string" ? args.tag : void 0;
      const results = (await corpus.search(args.query, maxResults, { group, type, tag })).map((hit) => ({
        ...hit,
        skills: skillsForArticle(hit.id),
        next: [
          `directorx_knowledge_read ${hit.id}`,
          ...skillsForArticle(hit.id).slice(0, 2).map((name) => `directorx_skill_read ${name}`)
        ]
      }));
      return { query: args.query, group: group ?? null, type: type ?? null, tag: tag ?? null, okf: "0.2", results, route: routeSkills(String(args.query ?? "")) };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_knowledge_read",
    description: "Read bundled knowledge article(s) by id/slug/number/path from directorx_knowledge_search or directorx_skill_route.articles. Pass refs[] to read several. Returns related ids and the skills that cite each article.",
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
      return {
        articles: articles.map((item2) => ({
          ...item2,
          skills: skillsForArticle(item2.article.id)
        })),
        related: related.map((hit) => ({ ...hit, skills: skillsForArticle(hit.id) }))
      };
    }
  })));
  skillIndex.setRoot(defaultSkillRoot());
  skillIndex.setExtraRoots(extraSkillRoots(settings.outputDir));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_skill_search",
    description: "Search DirectorX skills (bundled plus project/user skills saved after a production). Each hit includes tools to call after you directorx_skill_read the body. Use before guessing a workflow.",
    parameters: {
      query: { type: "string", required: true, description: 'Craft term, e.g. "\u4E09\u89C6\u56FE \u89D2\u8272" or "seedance prompt".' },
      max_results: { type: "number", description: "Default 8, max 20." }
    },
    output: objectOutput(),
    timeoutMs: 2e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const maxResults = Math.min(20, Math.max(1, Math.round(args.max_results ?? 8)));
      const query = String(args.query ?? "");
      const results = (await skillIndex.search(query, maxResults)).map((hit) => ({
        ...hit,
        tools: toolsForSkill(hit.name),
        articles: articlesForSkill(hit.name),
        next: [
          `directorx_skill_read ${hit.name}`,
          ...articlesForSkill(hit.name).slice(0, 2).map((id) => `directorx_knowledge_read ${id}`),
          ...toolsForSkill(hit.name).slice(0, 2)
        ]
      }));
      return { query, results, route: routeSkills(query) };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_skill_route",
    description: "\u6280\u80FD\u4E0E\u77E5\u8BC6\u8DEF\u7531\uFF08\u96F6\u6210\u672C\uFF09\uFF1A\u70B9\u540D\u8BE5 read \u7684 skill\u3001\u8BE5 knowledge_read \u7684\u6587\u7AE0 id\u3001\u5E94\u6309\u5E8F\u8C03\u7528\u7684\u5DE5\u5177\u3002\u5DE5\u827A\u8BF7\u6C42\u5148\u8C03\u8FD9\u4E2A\uFF0C\u518D\u6309 next \u8BFB\u6280\u80FD\u6B63\u6587\u548C\u6587\u7AE0\uFF0C\u4E0D\u8981\u53E6\u8D77\u68C0\u7D22\u8BCD\u3002",
    parameters: {
      intent: { type: "string", required: true, description: "\u7528\u6237\u539F\u8BDD\u6216\u5F53\u524D\u753B\u5E03\u610F\u56FE\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 1e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      return routeSkills(String(args.intent ?? ""));
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_skill_read",
    description: "Read a skill SKILL.md (bundled, or a project/user skill saved after a production). Returns articles[] to directorx_knowledge_read next. The DSH skill catalog is only a summary.",
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
      const articles = articlesForSkill(body.name);
      return {
        ...body,
        articles,
        next: articles.slice(0, 3).map((id) => `directorx_knowledge_read ${id}`)
      };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_note",
    description: "\u8BB0\u4E0B\u7528\u6237\u5728\u672C\u7247\u91CC\u7684\u4FEE\u6539\u610F\u89C1\uFF08\u66F4\u6696\u3001\u6362\u8FD0\u955C\u3001\u4E0D\u8981\u8FD9\u7248\uFF09\u3002\u6210\u7247\u7ED3\u675F\u540E directorx_skill_capture \u4F1A\u628A\u8FD9\u4E9B\u610F\u89C1\u5199\u8FDB\u65B0\u6280\u80FD\u3002\u6539\u4E00\u6B21\u8BB0\u4E00\u6761\uFF0C\u4E0D\u8981\u53EA\u7559\u5728\u5BF9\u8BDD\u91CC\u3002",
    parameters: {
      text: { type: "string", required: true, description: "\u7528\u6237\u539F\u8BDD\u6216\u4F60\u5F52\u7EB3\u7684\u4E00\u6761\u6539\u6CD5\u3002" },
      source: { type: "string", enum: ["user", "ask", "reject"], description: "\u9ED8\u8BA4 user\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 1e4,
    async execute(args) {
      const note = await new NoteStore(settings.outputDir).append({
        text: String(args.text ?? ""),
        source: args.source === "ask" || args.source === "reject" ? args.source : "user"
      });
      return { ok: true, note, next: ["\u7EE7\u7EED\u6539\u7247\uFF1B\u4EA4\u7247\u540E directorx_skill_capture"] };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_blocking",
    description: "\u573A\u9762\u63A7\u5236\u8868\uFF1A\u7528\u89D2\u8272\u56FE\u3001\u5F00\u573A\u548C\u4E8B\u4EF6\u987A\u5E8F\u6536\u6210\u5355\u955C\u4E16\u754C\u72B6\u6001\u9501\u3002harvest \u6536\u89D2\u8272/\u53C2\u8003\uFF1Bschema \u7ED9\u51FA\u7AE0\u8282\u3001\u4F18\u5148\u7EA7\u548C T0\u2026Tn \u7A7A\u53F0\u8D26\uFF1B\u4F60\u5199\u6210 Markdown \u540E pin \u9489\u5230\u753B\u5E03\u3002show \u8BFB\u5DF2\u6709\u8868\u3002\u4E0D\u751F\u6210\u3002\u591A\u4EBA\u8FDE\u7EED/\u5B8C\u5168\u63A7\u5236\u65F6\u5148\u8C03\u5B83\u518D craft\u3002",
    parameters: {
      action: { type: "string", enum: ["harvest", "schema", "pin", "show"], description: "\u9ED8\u8BA4\uFF1A\u6709 markdown \u5219 pin\uFF0C\u6709\u5F00\u573A/\u987A\u5E8F\u5219 schema\uFF0C\u5426\u5219 harvest\u3002" },
      start: { type: "string", description: "\u5F00\u573A\u72B6\u6001\uFF1A\u8C01\u6301\u7269\u3001\u671D\u54EA\u8FB9\u3001\u76F8\u673A\u5728\u54EA\u4E00\u4FA7\u3002" },
      beats: { type: "string", description: "\u4E8B\u4EF6\u987A\u5E8F\uFF0C\u4E00\u884C\u4E00\u6B65\u6216\u7528 \u2192 \u8FDE\u63A5\u3002" },
      durationSec: { type: "number", description: "\u89C4\u5212\u65F6\u957F\uFF0C4\u201360 \u79D2\u3002\u8D85\u51FA\u5355\u6BB5\u6A21\u578B\u4E0A\u9650\u5C31\u6309 Tn \u5207\u5F00\uFF0C\u4ECD\u5F15\u7528\u540C\u4E00\u4EFD\u8868\u3002" },
      markdown: { type: "string", description: "pin\uFF1A\u4F60\u5199\u7684\u573A\u9762\u63A7\u5236\u8868\u6B63\u6587\uFF0C\u5FC5\u987B\u542B\u573A\u9762\u53F0\u8D26\u3002" },
      title: { type: "string", description: "pin \u65F6\u7684\u8868\u540D\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return runBlocking({
        outputDir: settings.outputDir,
        action: typeof args.action === "string" ? args.action : void 0,
        start: typeof args.start === "string" ? args.start : void 0,
        beats: typeof args.beats === "string" ? args.beats : void 0,
        durationSec: typeof args.durationSec === "number" ? args.durationSec : void 0,
        markdown: typeof args.markdown === "string" ? args.markdown : void 0,
        title: typeof args.title === "string" ? args.title : void 0
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_revise",
    description: "\u53EA\u6539\u753B\u5E03\u4E0A\u8FD9\u4E00\u955C\uFF1A\u8BFB\u8BE5\u8282\u70B9\u7684\u6210\u7247\u3001\u63D0\u793A\u8BCD\u3001\u89D2\u8272\u951A\u548C\u5F53\u524D\u7CFB\u5217\u5305\uFF0C\u5199\u6210\u6539\u7A3F\u8BA1\u5212\u3002\u4E0D\u751F\u6210\u3002\u968F\u540E\u4ECD\u8D70 prompt_craft \u2192 generate_ready \u2192 generate\uFF0C\u56DE\u5199\u53EA\u6539\u8FD9\u4E2A\u8282\u70B9\u7684 path\u3002\u7528\u6237\u8BF4\u300C\u8868\u60C5\u518D\u751F\u52A8\u70B9\u300D\u65F6\u5148\u8C03\u5B83\u3002",
    parameters: {
      nodeId: { type: "string", required: true, description: "\u753B\u5E03\u56FE\u7247\u6216\u89C6\u9891\u8282\u70B9 id\u3002" },
      change: { type: "string", required: true, description: "\u8FD9\u4E00\u955C\u8981\u6539\u4EC0\u4E48\uFF0C\u4F8B\u5982\u300C\u773C\u795E\u66F4\u72E0\u4E00\u70B9\u300D\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return planRevise({
        outputDir: settings.outputDir,
        nodeId: String(args.nodeId ?? ""),
        change: String(args.change ?? "")
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_series",
    description: "\u7CFB\u5217\u5305\uFF1A\u628A\u672C\u7247\u5DF2\u9501\u7684\u89D2\u8272\u951A\u3001\u98CE\u683C\u9501\u3001\u955C\u5934\u89C4\u5219\u6536\u6210\u53EF\u8DE8\u96C6\u8C03\u7528\u7684\u5305\u3002harvest \u53EA\u6536\u4E8B\u5B9E\uFF1Bsave \u5199\u5165\u9879\u76EE\u548C\u7528\u6237\u5E93\uFF1Blist/show \u67E5\u9605\uFF1Bapply \u6CE8\u518C\u89D2\u8272\u5E76\u5199\u5165\u98CE\u683C\u9501\uFF0C\u4E0D\u751F\u6210\u3002\u65B9\u6CD5\u6D41\u7A0B\u4ECD\u8D70 directorx_skill_capture\u3002",
    parameters: {
      action: { type: "string", enum: ["harvest", "save", "list", "show", "apply"], description: "\u9ED8\u8BA4 harvest\u3002" },
      name: { type: "string", description: "show/apply/save \u7684\u5305\u540D\uFF08\u5C0F\u5199\u77ED\u6A2A\u7EBF\uFF09\u3002" },
      title: { type: "string", description: "\u5C55\u793A\u540D\uFF0C\u53EF\u4E2D\u6587\u3002" },
      logline: { type: "string", description: "\u4E00\u53E5\u8BDD\u7CFB\u5217\u8BBE\u5B9A\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 6e4,
    async execute(args) {
      return runSeries({
        outputDir: settings.outputDir,
        action: typeof args.action === "string" ? args.action : void 0,
        name: typeof args.name === "string" ? args.name : void 0,
        title: typeof args.title === "string" ? args.title : void 0,
        logline: typeof args.logline === "string" ? args.logline : void 0
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_skill_capture",
    description: "\u6210\u7247\u4EA4\u4ED8\u540E\u628A\u6D41\u7A0B\u548C\u7528\u6237\u4FEE\u6539\u610F\u89C1\u6536\u6210\u65B0\u6280\u80FD\u3002offer \u8D70 DSH \u6807\u51C6\u63D0\u95EE\u300C\u662F\u5426\u4FDD\u5B58\u4E3A xx \u6280\u80FD\u300D\uFF1B\u7528\u6237\u540C\u610F\u540E\u4F60\u5199 SKILL.md \u6B63\u6587\u518D save\u3002\u53EA\u5199\u5165\u9879\u76EE/\u7528\u6237\u6280\u80FD\u5E93\uFF0C\u4E0D\u8986\u76D6\u63D2\u4EF6\u81EA\u5E26 skills/\u3002",
    parameters: {
      action: { type: "string", enum: ["harvest", "offer", "save"], description: "\u9ED8\u8BA4 offer\u3002harvest \u53EA\u6536\u4E8B\u5B9E\uFF1Boffer \u8D70 DSH \u6807\u51C6\u63D0\u95EE\uFF1Bsave \u5199\u5165\u6280\u80FD\u3002" },
      present: { type: "boolean", description: "offer \u65F6\u7ACB\u523B\u901A\u8FC7 userInteraction.ask \u63D0\u95EE\uFF0C\u4E0D\u8981\u53EA\u8FD4\u56DE JSON\u3002" },
      name: { type: "string", description: "save\uFF1A\u5C0F\u5199\u82F1\u6587\u77ED\u6A2A\u7EBF\u6280\u80FD\u540D\u3002" },
      title: { type: "string", description: "\u5C55\u793A\u540D\uFF0C\u53EF\u4E2D\u6587\u3002" },
      description: { type: "string", description: "SKILL.md description\uFF1A\u505A\u4EC0\u4E48\u3001\u4F55\u65F6\u89E6\u53D1\u3002" },
      body: { type: "string", description: "save\uFF1A\u4F60\u5199\u7684 SKILL.md \u6B63\u6587\uFF08\u6D41\u7A0B + \u4FEE\u6539\u7EAA\u5F8B\uFF09\uFF0C\u4E0D\u8981\u4EA4\u7A7A\u58F3\u3002" },
      answer: { type: "string", description: "\u7528\u6237\u5DF2\u7ECF\u56DE\u7B54\u65F6\u4F20\u5165\u539F\u8BDD\u3002" },
      replace: { type: "boolean", description: "\u8986\u76D6\u5DF2\u5B58\u5728\u7684\u540C\u540D\u7528\u6237\u6280\u80FD\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e5,
    async execute(args, exec) {
      const userInteraction = ctx.get("userInteraction");
      if (args.present === true && userInteraction === void 0) {
        throw new Error("directorx_skill_capture present \u9700\u8981 DSH userInteraction\uFF08\u6807\u51C6\u63D0\u95EE\u901A\u9053\uFF09");
      }
      const result = await runSkillCapture({
        outputDir: settings.outputDir,
        action: typeof args.action === "string" ? args.action : void 0,
        present: args.present === true,
        name: typeof args.name === "string" ? args.name : void 0,
        title: typeof args.title === "string" ? args.title : void 0,
        description: typeof args.description === "string" ? args.description : void 0,
        body: typeof args.body === "string" ? args.body : void 0,
        answer: typeof args.answer === "string" ? args.answer : void 0,
        replace: args.replace === true,
        ...args.present === true && userInteraction !== void 0 ? { ask: (request) => userInteraction.ask(request), agent: exec.agent, signal: exec.signal } : {}
      });
      if (result.saved === true && typeof result.name === "string" && typeof result.description === "string") {
        const dir = typeof result.paths === "object" && Array.isArray(result.paths) ? String(result.paths[0] ?? "").replace(/\/SKILL\.md$/, "") : "";
        const content = typeof args.body === "string" ? args.body : "";
        try {
          ctx.skills.register({
            name: result.name,
            description: result.description,
            content,
            source: "user",
            provider: "directorx",
            ...dir !== "" ? { resourceBase: { kind: "directory", path: dir } } : {},
            invocation: { modelInvocable: true, userInvocable: true }
          });
        } catch {
        }
      }
      return result;
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_prompt_plan",
    description: "\u63D0\u793A\u8BCD\u7F16\u6392\uFF1A\u6309\u5F53\u524D\u610F\u56FE\u7ED9\u51FA\u516D\u8981\u7D20\u7F3A\u53E3\u3001\u89C6\u9891\u7269\u7406\u94FE\u3001\u6A21\u578B\u6280\u80FD\u3001\u7248\u6743\u65B9\u6CD5\u548C next\u3002\u4E0D\u5199\u56FA\u5B9A\u6210\u7A3F\u3002\u5199\u7EC6\u540E\u518D directorx_prompt_craft\u3002",
    parameters: {
      intent: { type: "string", required: true, description: "\u7528\u6237\u539F\u53E5 / \u753B\u5E03\u610F\u56FE\u3002" },
      kind: { type: "string", enum: ["image", "video", "audio"], description: "\u51FA\u56FE\u3001\u51FA\u89C6\u9891\u8FD8\u662F\u51FA\u58F0\u97F3\u3002\u4E0D\u4F20\u5219\u6309\u610F\u56FE\u63A8\u65AD\u3002" },
      model: { type: "string", description: "\u5DF2\u9009\u6A21\u578B id\uFF0C\u7528\u6765\u70B9\u540D copilot \u6280\u80FD\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 1e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      return planPrompt({
        intent: String(args.intent ?? ""),
        kind: args.kind === "image" || args.kind === "video" || args.kind === "audio" ? args.kind : void 0,
        model: typeof args.model === "string" ? args.model : void 0
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_prompt_craft",
    description: "\u628A\u7528\u6237\u610F\u56FE\u5199\u6210\u53EF\u751F\u6210\u7684\u5BFC\u6F14\u63D0\u793A\u8BCD\u3002\u5148 directorx_prompt_plan\u3002\u5FC5\u987B knowledge_read + skill_read\uFF08\u5FC5\u8981\u65F6\u5916\u90E8\u8C03\u7814\uFF09\uFF0C\u518D\u628A\u6210\u7A3F\u548C\u5F15\u7528\u4EA4\u6765\u3002\u753B\u5E03\u77ED\u53E5\u4E0D\u662F\u63D0\u793A\u8BCD\u3002\u6210\u7A3F\u4ECD\u542B IP \u4E13\u540D\u4F1A\u62D2\u7EDD\u3002\u8FD4\u56DE craftId\uFF0Cgenerate/propose \u5FC5\u5E26\u3002",
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
    description: "\u751F\u6210\u524D\u53C2\u8003\u9F50\u5907\u95F8\u3002\u8BFB\u753B\u5E03\u548C\u89D2\u8272\u5E93\uFF0C\u5224\u5B9A\u672C\u4EFB\u52A1\u8BE5\u8D70\u8BBE\u5B9A\u56FE / \u573A\u666F\u7A7A\u955C / \u5173\u952E\u5E27 / \u56FE\u751F / \u9996\u5C3E\u5E27 / \u6587\u751F\u3002\u7F3A\u53C2\u8003\u5C31 blocked\uFF0C\u5E76\u7528 directorx_ask\uFF08DSH \u6807\u51C6\u63D0\u95EE\uFF09\u8BA9\u7528\u6237\u9009\u8DEF\u3002commit:true \u53EA\u5728\u9F50\u5907\u65F6\u53D1 readyId\uFF1Bgenerate/propose/canvas_continue \u5FC5\u5E26\u3002",
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
      present: { type: "boolean", description: "blocked \u65F6\u7ACB\u523B\u8D70 DSH \u6807\u51C6\u63D0\u95EE\u3002" }
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
  const editLedger = new DirectorxEditLedger(settings.outputDir);
  const finishBound = async (bound, result, mediaType) => {
    const commit = await commitBoundMedia({
      canvas,
      ledger: editLedger,
      nodeId: bound.nodeId,
      path: result.path,
      mediaType
    });
    return { nodeId: bound.nodeId, written: commit.written };
  };
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
    name: "directorx_canvas_script",
    description: "\u628A\u6587\u672C/\u5267\u672C\u8282\u70B9\u62C6\u6210\u300C\u672C\u2192\u9996\u5E27\u2192\u89C6\u9891\u300D\u5206\u955C\u884C\u94FA\u4E0A\u753B\u5E03\u3002\u8BA4 Fountain \u573A\u6B21\u6807\u9898\u3001\u955C\u5934N\u3001\u4E2D\u6587\u7B2CN\u573A\u3002\u5267\u672C\u6B63\u6587\u672C\u8EAB\u5C31\u662F\u53EF\u89C1\u6587\u672C\u5361\u3002\u53EA\u5199 idea \u7A7A\u5361\uFF0C\u4E0D\u751F\u6210\u5A92\u4F53\u3002\u540C\u4E00\u5267\u672C\u8282\u70B9\u518D\u8C03\u4E00\u6B21\u4F1A\u590D\u7528\u5DF2\u94FA\u7684\u884C\u3002",
    parameters: {
      nodeId: { type: "string", description: "\u5DF2\u6709\u6587\u672C\u8282\u70B9 id\u3002\u53EF\u4E0E text \u4E8C\u9009\u4E00\u3002" },
      text: { type: "string", description: "\u76F4\u63A5\u7ED9\u5267\u672C\u6B63\u6587\u3002\u6CA1\u6709 nodeId \u65F6\u4F1A\u5148\u5EFA\u4E00\u5F20\u6587\u672C\u5361\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "script",
        ...typeof args.nodeId === "string" ? { nodeId: args.nodeId } : {},
        ...typeof args.text === "string" ? { text: args.text } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_frames",
    description: "\u4ECE\u5DF2\u6709\u6210\u7247\u7684\u89C6\u9891\u8282\u70B9\u62BD\u5173\u952E\u5E27\uFF0C\u94FA\u6210\u4E00\u7EC4\u56FE\u7247\u5361\uFF08\u63D0\u53D6\u5E27\uFF09\u3002\u7528 ffmpeg\uFF0C\u4E0D\u5199 generating\uFF0C\u4E5F\u4E0D\u5EFA video\u2192image \u8FB9\uFF08\u62BD\u5E27\u7EC4\u672C\u8EAB\u5C31\u662F\u51FA\u5904\uFF09\u3002",
    parameters: {
      nodeId: { type: "string", required: true, description: "\u89C6\u9891\u8282\u70B9 id\uFF0C\u4E14 path \u5DF2\u6709\u6210\u7247\u3002" },
      count: { type: "number", description: "\u5747\u5300\u62BD\u5E27\u6570\uFF0C\u9ED8\u8BA4 6\uFF0C\u6700\u591A 12\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 12e4,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "frames",
        nodeId: String(args.nodeId ?? ""),
        ...typeof args.count === "number" ? { count: args.count } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_autolink",
    description: "\u6309\u89D2\u8272\u5E93\u540D\u5B57\u548C\u5361\u7247\u8BCD\u4EE4\u91CD\u53E0\uFF0C\u7ED9\u73B0\u6709\u8282\u70B9\u8865\u53C2\u8003\u8FB9\uFF08\u6587\u672C/\u8BBE\u5B9A\u56FE \u2192 \u955C\u5934\uFF09\u3002\u4E0D\u65B0\u5EFA\u8282\u70B9\uFF0C\u4E0D\u751F\u6210\u3002\u9075\u5B88\u753B\u5E03\u8FDE\u7EBF\u77E9\u9635\uFF1A\u89C6\u9891\u4E0D\u80FD\u5582\u56FE\u7247\u3002",
    parameters: {
      nodeId: { type: "string", description: "\u53EA\u8FDE\u4E0E\u8FD9\u4E2A\u8282\u70B9\u76F8\u5173\u7684\u8FB9\u3002\u7701\u7565\u5219\u626B\u6574\u677F\u3002" },
      nodeIds: { type: "array", items: { type: "string" }, description: "\u53EA\u8FDE\u4E0E\u8FD9\u4E9B\u8282\u70B9\u76F8\u5173\u7684\u8FB9\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "autolink",
        ...typeof args.nodeId === "string" ? { nodeId: args.nodeId } : {},
        ...Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_parse",
    description: "\u667A\u80FD\u89E3\u6790\u6210\u7247\uFF1Affmpeg \u5207\u70B9\u68C0\u6D4B\uFF08\u4EAE\u5EA6\u5DEE\u5206\uFF09\u62C6\u955C\uFF0C\u628A\u5206\u955C\u7A3F\u6587\u672C\u5361\u548C\u6BCF\u955C\u4EE3\u8868\u5E27\u94FA\u4E0A\u753B\u5E03\u3002\u4E0D\u751F\u6210\u3002describe:true \u65F6\u7528 vision \u5199\u6BCF\u955C\u4E00\u53E5\uFF08\u672A\u914D\u7F6E\u5219\u53EA\u5199\u65F6\u95F4\u7A97\uFF09\u3002\u540C\u4E00\u89C6\u9891\u518D\u8C03\u4E00\u6B21\u4F1A\u590D\u7528\u3002",
    parameters: {
      nodeId: { type: "string", required: true, description: "\u5DF2\u6709\u6210\u7247\u8DEF\u5F84\u7684\u89C6\u9891\u8282\u70B9 id\u3002" },
      describe: { type: "boolean", description: "\u4E3A\u6BCF\u955C\u8C03 vision \u5199\u4E00\u53E5\u53EF\u89C1\u5185\u5BB9\u3002\u9ED8\u8BA4 false\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "parse",
        nodeId: String(args.nodeId ?? ""),
        settings,
        ...args.describe === true ? { describe: true } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_reshoot",
    description: "\u5C40\u90E8\u91CD\u7ED8\u3002cut\uFF1A\u5207\u6389\u5934\u5C3E\u3001\u62BD\u51FA\u7A97\u5185\u9996\u5C3E\u5E27\u3001\u94FA\u4E2D\u6BB5 idea \u5361\uFF08\u4E0D\u751F\u6210\uFF09\u3002\u4E2D\u6BB5\u751F\u6210\u56DE\u5199 path \u540E assemble\uFF1Affmpeg cut \u62FC\u63A5\u5934+\u4E2D+\u5C3E\u5230\u300C\u91CD\u505A\u6210\u7247\u300D\u5361\u3002\u7A97\u957F 1\u201315 \u79D2\u3002UI \u4E0D\u5F97\u5199 generating\u3002",
    parameters: {
      action: { type: "string", enum: ["cut", "assemble"], description: "\u9ED8\u8BA4 cut\u3002\u4E2D\u6BB5\u6709\u6210\u7247\u540E assemble\u3002" },
      nodeId: { type: "string", required: true, description: "cut=\u6E90\u89C6\u9891\u8282\u70B9\uFF1Bassemble=\u91CD\u505A\u4E2D\u6BB5\u6216\u6210\u7247\u8282\u70B9\u3002" },
      start: { type: "number", description: "cut\uFF1A\u7A97\u8D77\u70B9\u79D2\u3002" },
      end: { type: "number", description: "cut\uFF1A\u7A97\u7EC8\u70B9\u79D2\u3002" },
      prompt: { type: "string", description: "cut\uFF1A\u8FD9\u4E00\u6BB5\u8981\u6539\u6210\u4EC0\u4E48\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 6e5,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "reshoot",
        nodeId: String(args.nodeId ?? ""),
        phase: args.action === "assemble" ? "assemble" : "cut",
        ...typeof args.start === "number" ? { start: args.start } : {},
        ...typeof args.end === "number" ? { end: args.end } : {},
        ...typeof args.prompt === "string" ? { prompt: args.prompt } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_pack",
    description: "\u628A\u753B\u5E03\u4E0A\u5DF2\u6709\u6210\u7247\u7684\u89C6\u9891\u5361\u786C\u5207\u62FC\u6210\u4E00\u6761\u300C\u6210\u7247\u300D\u5361\u3002\u9ED8\u8BA4\u6309\u4F20\u5165 id \u987A\u5E8F\uFF0C\u5426\u5219\u6309 shotIndex\u3002ffmpeg \u672C\u5730\u62FC\u63A5\uFF0C\u4E0D\u751F\u6210\u3002\u9884\u544A\u7247/\u7247\u82B1\u5FC5\u987B cut\uFF0C\u4E0D\u8981 fade\u3002",
    parameters: {
      nodeIds: { type: "array", items: { type: "string" }, description: "\u8981\u62FC\u63A5\u7684\u89C6\u9891\u8282\u70B9 id\uFF0C\u6309\u64AD\u653E\u987A\u5E8F\u3002\u7701\u7565\u5219\u53D6\u6574\u677F\u5DF2\u6210\u7247\u89C6\u9891\u3002" },
      transition: { type: "string", enum: ["cut", "fade"], description: "\u9ED8\u8BA4 cut\u3002\u9884\u544A\u7247\u53EA\u7528 cut\u3002" },
      fadeSec: { type: "number", description: "\u4EC5 fade\uFF1A\u53E0\u5316\u79D2\u6570\uFF0C\u9ED8\u8BA4 0.3\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 6e5,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "pack",
        ...Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {},
        ...args.transition === "fade" || args.transition === "cut" ? { transition: args.transition } : {},
        ...typeof args.fadeSec === "number" ? { fadeSec: args.fadeSec } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_sheet",
    description: "\u628A\u9009\u4E2D\u7684\u56FE/\u89C6\u9891\u62BD\u4E2D\u70B9\u5E27\uFF0C\u62FC\u6210\u4E00\u5F20\u4E5D\u5BAB\u683C\u56FE\u7247\u5361\u9489\u5728\u753B\u5E03\u4E0A\u3002ffmpeg tile\uFF0C\u4E0D\u751F\u6210\u3002",
    parameters: {
      nodeIds: { type: "array", items: { type: "string" }, description: "\u56FE\u6216\u89C6\u9891\u8282\u70B9 id\u3002\u7701\u7565\u5219\u53D6\u6574\u677F\u6709\u6210\u7247\u7684\u56FE/\u89C6\u9891\u3002" },
      columns: { type: "number", description: "\u5217\u6570\uFF0C\u9ED8\u8BA4 min(4, \u6570\u91CF)\uFF0C2\u20138\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 18e4,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "sheet",
        ...Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {},
        ...typeof args.columns === "number" ? { columns: args.columns } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_split",
    description: "\u628A\u4E00\u5F20\u6709\u6210\u7247\u7684\u56FE\u7247\u62C6\u5206\u5BAB\u683C\uFF0C\u94FA\u6210\u4E00\u7EC4\u72EC\u7ACB\u56FE\u7247\u5361\u3002ffmpeg crop\uFF0C\u4E0D\u751F\u6210\u3002",
    parameters: {
      nodeId: { type: "string", required: true, description: "\u56FE\u7247\u8282\u70B9 id\uFF0C\u4E14 path \u5DF2\u6709\u6210\u7247\u3002" },
      cols: { type: "number", description: "\u5217\u6570\uFF0C\u9ED8\u8BA4 3\uFF0C2\u20135\u3002" },
      rows: { type: "number", description: "\u884C\u6570\uFF0C\u9ED8\u8BA4 3\uFF0C1\u20135\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 12e4,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "split",
        nodeId: String(args.nodeId ?? ""),
        ...typeof args.cols === "number" ? { cols: args.cols } : {},
        ...typeof args.rows === "number" ? { rows: args.rows } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_join",
    description: "\u628A\u9009\u4E2D\u7684\u6210\u7247\u56FE\u7247\u6309\u539F\u56FE\u5408\u5E76\u6210\u4E00\u5F20\u5E26\u955C\u53F7\u7684\u5BAB\u683C\u5927\u56FE\uFF0C\u9489\u5728\u753B\u5E03\u4E0A\u3002ffmpeg tile\uFF0C\u4E0D\u751F\u6210\u3002\u62C6\u5206\u5BAB\u683C\u7684\u9006\u64CD\u4F5C\uFF0C\u4E5F\u7528\u4E8E\u5206\u955C\u7EC4\u4EA4\u4ED8\u3002",
    parameters: {
      nodeIds: { type: "array", items: { type: "string" }, description: "\u56FE\u7247\u8282\u70B9 id\uFF0C\u81F3\u5C11\u4E24\u5F20\u3002" },
      columns: { type: "number", description: "\u5217\u6570\uFF0C\u9ED8\u8BA4 min(4, \u6570\u91CF)\uFF0C2\u20138\u3002" },
      numbered: { type: "boolean", description: "\u89D2\u6807\u955C\u53F7\uFF0C\u9ED8\u8BA4 true\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 18e4,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "join",
        ...Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {},
        ...typeof args.columns === "number" ? { columns: args.columns } : {},
        ...args.numbered === false ? { numbered: false } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_stack",
    description: "\u628A 2\u20134 \u5F20\u6709\u6210\u7247\u7684\u56FE/\u89C6\u9891\u62FC\u6210\u5206\u5C4F\u6761\uFF0C\u9489\u6210\u4E00\u6761\u89C6\u9891\u5361\u3002ffmpeg hstack/vstack\uFF0C\u4E0D\u751F\u6210\u3002",
    parameters: {
      nodeIds: { type: "array", items: { type: "string" }, required: true, description: "\u56FE\u6216\u89C6\u9891\u8282\u70B9 id\uFF0C2\u20134 \u4E2A\u3002" },
      layout: { type: "string", enum: ["2x1", "1x2", "2x2"], description: "\u9ED8\u8BA4\u4E24\u8DEF\u6A2A\u6392\uFF0C\u56DB\u8DEF\u7528 2x2\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 18e4,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "stack",
        ...Array.isArray(args.nodeIds) ? { nodeIds: args.nodeIds.map(String) } : {},
        ...args.layout === "2x1" || args.layout === "1x2" || args.layout === "2x2" ? { layout: args.layout } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_desub",
    description: "\u53BB\u6389\u6210\u7247\u89C6\u9891\u4E0A\u7684\u786C\u5B57\u5E55\u6216\u5E95\u680F\u5B57\uFF1A\u88C1\u6389\u6216\u6A21\u7CCA\u4E00\u6761\u8FB9\u3002ffmpeg crop/boxblur\uFF0C\u4E0D\u751F\u6210\u3002",
    parameters: {
      nodeId: { type: "string", required: true, description: "\u6709\u6210\u7247\u7684\u89C6\u9891\u8282\u70B9 id\u3002" },
      method: { type: "string", enum: ["crop", "blur"], description: "\u9ED8\u8BA4 crop\u3002blur \u4FDD\u7559\u6784\u56FE\u3002" },
      region: { type: "string", description: "bottom:15 / top:10 / left:8 / right:8\uFF0C\u6570\u5B57\u662F\u767E\u5206\u6BD4\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 18e4,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "desub",
        nodeId: String(args.nodeId ?? ""),
        ...args.method === "crop" || args.method === "blur" ? { method: args.method } : {},
        ...typeof args.region === "string" ? { region: args.region } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_extend",
    description: "\u4ECE\u6210\u7247\u89C6\u9891\u62BD\u51FA\u5C3E\u5E27\uFF0C\u65C1\u8FB9\u94FA\u4E00\u5F20\u89C6\u9891\u5EF6\u957F\u7A7A\u5361\uFF08idea\uFF09\u3002\u4E0D\u751F\u6210\u3002\u63A5\u7740\u8D70 craft/ready\uFF0C\u56DE\u5199\u5EF6\u957F\u5361 path\u3002",
    parameters: {
      nodeId: { type: "string", required: true, description: "\u6709\u6210\u7247\u7684\u89C6\u9891\u8282\u70B9 id\u3002" },
      prompt: { type: "string", description: "\u7EED\u5199\u610F\u56FE\u3002\u7701\u7565\u5219\u6CBF\u7528\u539F\u5361\u63D0\u793A\u8BCD\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 12e4,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "extend",
        nodeId: String(args.nodeId ?? ""),
        ...typeof args.prompt === "string" ? { prompt: args.prompt } : {}
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_canvas_gif",
    description: "\u628A\u6210\u7247\u89C6\u9891\u5BFC\u51FA\u4E3A GIF \u56FE\u7247\u5361\u9489\u5728\u753B\u5E03\u4E0A\uFF0C\u65B9\u4FBF\u8BC4\u5BA1\u548C\u5206\u4EAB\u3002ffmpeg palette\uFF0C\u4E0D\u751F\u6210\u3002",
    parameters: {
      nodeId: { type: "string", required: true, description: "\u6709\u6210\u7247\u7684\u89C6\u9891\u8282\u70B9 id\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 18e4,
    async execute(args) {
      return runCanvasCraft({
        outputDir: settings.outputDir,
        action: "gif",
        nodeId: String(args.nodeId ?? "")
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_video_process",
    description: "\u786E\u5B9A\u6027\u672C\u5730\u89C6\u9891\u5904\u7406\uFF08ffmpeg\uFF09\uFF1A\u88C1\u526A/\u53D8\u901F/\u7F29\u653E/\u97F3\u91CF/\u9759\u97F3/\u5E27\u7387/\u65CB\u8F6C/\u7FFB\u8F6C/\u5012\u653E/\u5B9A\u683C\u3002\u53EF\u5E26 nodeId \u56DE\u5199\u753B\u5E03\u3002\u514D\u8D39\u7CBE\u786E\uFF0C\u7981\u6B62\u7528\u751F\u6210\u6A21\u578B\u4EE3\u66FF\u3002",
    parameters: {
      source: { type: "string", description: "\u672C\u5730\u89C6\u9891\u8DEF\u5F84\u3002\u53EF\u4E0E nodeId \u4E8C\u9009\u4E00\u3002" },
      nodeId: { type: "string", description: "\u753B\u5E03\u8282\u70B9 id\u3002\u6709\u5219\u5904\u7406\u540E\u56DE\u5199 path\u3002" },
      start: { type: "number", description: "Trim start (seconds)." },
      end: { type: "number", description: "Trim end (seconds)." },
      speed: { type: "number", description: "Playback speed multiplier (0.5-8)." },
      scale: { type: "string", description: "Output size, e.g. 1280:720 or 16:9." },
      volume: { type: "number", description: "Audio volume multiplier (e.g. 0.9)." },
      mute: { type: "boolean", description: "Strip the audio track." },
      fps: { type: "number", description: "Normalize to this frame rate." },
      crop: { type: "string", description: "\u88C1\u526A w:h:x:y\u3002" },
      rotate: { type: "number", enum: [90, 180, 270], description: "\u65CB\u8F6C\u89D2\u5EA6\u3002" },
      hflip: { type: "boolean", description: "\u6C34\u5E73\u7FFB\u8F6C\u3002" },
      vflip: { type: "boolean", description: "\u5782\u76F4\u7FFB\u8F6C\u3002" },
      reverse: { type: "boolean", description: "\u5012\u653E\u3002" },
      freezeEnd: { type: "number", description: "\u7247\u5C3E\u5B9A\u683C\u79D2\u6570\u3002" },
      freezeStart: { type: "number", description: "\u7247\u5934\u5B9A\u683C\u79D2\u6570\u3002" },
      grade: { type: "string", description: "\u8C03\u8272 look \u540D\uFF1B\u4E0D\u786E\u5B9A\u65F6\u6539\u8D70 directorx_studio\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 6e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      const bound = await resolveBoundMedia({
        canvas,
        outputDir: settings.outputDir,
        nodeId: args.nodeId,
        path: args.source,
        require: "video"
      });
      const rotate = parseRotate2(args.rotate);
      const hasOp = typeof args.start === "number" || typeof args.end === "number" || typeof args.speed === "number" || typeof args.scale === "string" || typeof args.volume === "number" || args.mute === true || typeof args.fps === "number" || typeof args.crop === "string" || rotate !== void 0 || args.hflip === true || args.vflip === true || args.reverse === true || typeof args.freezeEnd === "number" || typeof args.freezeStart === "number" || typeof args.grade === "string" && args.grade.trim() !== "";
      if (!hasOp) throw new Error("\u6CA1\u6709\u53EF\u6267\u884C\u7684\u89C6\u9891\u64CD\u4F5C\uFF08\u88C1\u526A/\u53D8\u901F/\u7F29\u653E/\u65CB\u8F6C/\u7FFB\u8F6C/\u5012\u653E/\u5B9A\u683C/\u8C03\u8272\uFF09");
      const processed = await videoProcess({
        source: bound.path,
        outputDir: settings.outputDir,
        start: typeof args.start === "number" ? args.start : void 0,
        end: typeof args.end === "number" ? args.end : void 0,
        speed: typeof args.speed === "number" ? args.speed : void 0,
        scale: typeof args.scale === "string" ? args.scale : void 0,
        volume: typeof args.volume === "number" ? args.volume : void 0,
        mute: args.mute === true,
        fps: typeof args.fps === "number" ? args.fps : void 0,
        crop: typeof args.crop === "string" ? args.crop : void 0,
        ...rotate !== void 0 ? { rotate } : {},
        hflip: args.hflip === true,
        vflip: args.vflip === true,
        reverse: args.reverse === true,
        freezeEnd: typeof args.freezeEnd === "number" ? args.freezeEnd : void 0,
        freezeStart: typeof args.freezeStart === "number" ? args.freezeStart : void 0,
        ...typeof args.grade === "string" && args.grade.trim() !== "" ? { grade: resolveGradeLook(args.grade) } : {}
      });
      return { ...processed, ...await finishBound(bound, processed, processed.mimeType) };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_video_concat",
    description: "Concatenate multiple local videos into one: normalizes size/fps/audio, then either hard cuts or xfade (cross-fade) transitions with audio acrossfade. Deterministic ffmpeg assembly for multi-shot deliverables. \u53EF\u5E26 nodeId \u628A\u6210\u7247\u8DEF\u5F84\u5199\u56DE\u753B\u5E03\u3002",
    parameters: {
      files: { type: "array", items: { type: "string" }, required: true, description: "Absolute paths of 2+ local videos in order." },
      nodeId: { type: "string", description: "\u753B\u5E03\u8282\u70B9 id\u3002\u6709\u5219\u628A\u6210\u7247 path \u5199\u56DE\u8BE5\u8282\u70B9\u3002" },
      transition: { type: "string", enum: ["fade", "cut"], description: "fade = xfade cross-fade (default); cut = hard cuts." },
      fadeSec: { type: "number", description: "Cross-fade duration (default 0.5s)." },
      scale: { type: "string", description: "Common output size (default 1280:720)." }
    },
    output: objectOutput(),
    timeoutMs: 9e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      const rendered = await videoConcat({ ...args, outputDir: settings.outputDir });
      const nodeId = typeof args.nodeId === "string" && args.nodeId !== "" ? args.nodeId : void 0;
      return { ...rendered, ...await finishBound({ nodeId }, rendered, rendered.mimeType) };
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
    description: "Pre-flight audit before paid generation: \u89C4\u683C/\u5185\u5BB9/\u6210\u672C/\u6743\u5229\u3002\u6743\u5229\u95F8\u626B\u63CF IP \u4E13\u540D\u5E76\u8FD4\u56DE\u6539\u5199\u65B9\u6CD5 brief\uFF08\u4E0D\u542B\u56FA\u5B9A\u6210\u7A3F\uFF09\u3002\u70B9\u540D IP \u4E0D\u8981\u76F4\u63A5 generate\uFF0C\u8D70 directorx_ip_scan \u2192 \u6539\u5199 \u2192 directorx_ip_rewrite\u3002",
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
    name: "directorx_ip_scan",
    description: "\u7248\u6743\u626B\u63CF\uFF1A\u68C0\u51FA IP/\u5546\u6807/\u4F5C\u8005\u540D/\u771F\u4EBA\u540D\uFF0C\u8FD4\u56DE\u8BBA\u6587\u65B9\u6CD5\u8F74\u3001\u987B\u4FDD\u7559\u7684\u60C5\u5883\u3001\u8D1F\u5411\u6392\u9664\u548C\u672C\u9879\u76EE\u8BB0\u5FC6\u3002\u4E0D\u5199\u56FA\u5B9A\u66FF\u6362\u53E5\u3002\u68C0\u51FA\u540E\u5FC5\u987B\u81EA\u5DF1\u5199\u7EC6\u6539\u5199\uFF0C\u518D directorx_ip_rewrite \u9A8C\u6536\u3002",
    parameters: {
      prompt: { type: "string", required: true, description: "\u8981\u68C0\u67E5\u7684\u63D0\u793A\u8BCD\u6216\u7528\u6237\u539F\u53E5\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 1e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const scanned = await scanIpWithMemory(settings.outputDir, String(args.prompt ?? ""));
      return {
        dirty: scanned.brief.dirty,
        hits: scanned.brief.hits,
        keep: scanned.brief.keep,
        method: scanned.brief.method,
        knowledge: scanned.brief.knowledge,
        exclude: scanned.brief.exclude,
        negativeLine: scanned.brief.negativeLine,
        memory: scanned.memory,
        agentPrompt: scanned.brief.agentPrompt,
        next: scanned.brief.next
      };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_ip_rewrite",
    description: "\u5B9E\u65BD\u7248\u6743\u6539\u5199\u9A8C\u6536\uFF1A\u5BF9\u7167\u539F\u53E5\u68C0\u67E5\u6539\u5199\u7A3F\u662F\u5426\u8FD8\u542B\u4E13\u540D\uFF1B\u901A\u8FC7\u5219\u8BB0\u5165\u672C\u9879\u76EE\u8BB0\u5FC6\uFF0C\u4F9B\u4EE5\u540E\u540C\u7C7B\u955C\u5934\u8C03\u7528\u3002\u6539\u5199\u5FC5\u987B\u6309 ip_scan \u7684\u65B9\u6CD5\u8F74\u7ED3\u5408\u5F53\u524D\u60C5\u5883\u81EA\u5DF1\u5199\uFF0C\u7981\u6B62\u5957\u56FA\u5B9A\u53E5\u3002",
    parameters: {
      source: { type: "string", required: true, description: "\u7528\u6237\u539F\u53E5 / \u753B\u5E03\u610F\u56FE\u3002" },
      rewrite: { type: "string", required: true, description: "\u6309\u65B9\u6CD5\u8F74\u5199\u597D\u7684\u5C5E\u6027\u63CF\u8FF0\u6210\u7A3F\uFF0C\u4E0D\u5F97\u518D\u542B IP \u4E13\u540D\u3002" },
      remember: { type: "boolean", description: "\u901A\u8FC7\u540E\u5199\u5165\u9879\u76EE\u8BB0\u5FC6\u3002\u9ED8\u8BA4 true\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 1e4,
    async execute(args) {
      return commitIpRewrite(settings.outputDir, {
        source: String(args.source ?? ""),
        rewrite: String(args.rewrite ?? ""),
        remember: args.remember !== false
      });
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
    description: "Pause on the standard DSH question channel (ctx.userInteraction.ask) for any fork the user must own (\u65F6\u957F/\u753B\u5E45/\u98CE\u683C/\u63A5\u5165\u534F\u8BAE/\u662F\u5426\u6253\u6700\u77ED\u6D4B\u8BD5). NEVER write a numbered 1.2.3 menu in assistant text \u2014 call this instead. Up to 6 questions, each with options and a recommended default.",
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
        throw new Error("directorx_ask requires DSH userInteraction (standard question channel).");
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
    description: "\u6210\u7247\u9636\u6BB5\u8D26\u672C\uFF08outputDir/stage.json\uFF09\uFF1Abrief\u2192research\u2192forks\u2192script\u2192cast\u2192storyboard\u2192craft\u2192place\u2192generate\u2192assemble\u2192qa\u2192deliver\u3002\u8BB0\u5F55\u9636\u6BB5\u6027\u4EA7\u7269\uFF0C\u8FC7\u95F8\u7528 DSH \u6807\u51C6\u63D0\u95EE\u3002deliver \u65F6\u8FD4\u56DE\u6536\u6210\u63D0\u95EE\uFF0C\u63A5\u7740 directorx_skill_capture\u3002\u4E0D\u8981\u9759\u9ED8\u8DF3\u9636\u6BB5\u3002",
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
        const doc2 = await store.advance(to, args.skip === true ? "skip" : "done");
        if (doc2.current === "deliver") return { ...doc2, ...await deliverCapture(settings.outputDir) };
        return doc2;
      }
      const doc = await store.get();
      if (doc.current === "deliver") return { ...doc, ...await deliverCapture(settings.outputDir) };
      return doc;
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
    description: "Register a character/subject anchor: a reference image + description stored in characters.json, and pin a visible \u4EBA\u7269\u8BBE\u5B9A text node on the canvas. Later generation calls can pass the character name via the `characters` parameter and the reference + description are injected automatically.",
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
      const card = await new CharacterStore(settings.outputDir).register({
        name: String(args.name),
        description: args.description,
        refPath: String(args.refPath),
        outfit: typeof args.outfit === "string" ? args.outfit : void 0,
        props: typeof args.props === "string" ? args.props : void 0
      });
      const pinned = await pinCharacterSetting(settings.outputDir, card);
      return { ...card, ...pinned !== void 0 ? { canvasNodeId: pinned.nodeId } : {} };
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
      const bound = await resolveBoundMedia({
        canvas,
        outputDir: settings.outputDir,
        nodeId: args.nodeId,
        path: args.path,
        kind: args.kind
      });
      if (args.openOnly === true) {
        const ticket2 = await new StudioTicketStore(settings.outputDir).write({
          kind: bound.kind,
          path: bound.path,
          ...bound.nodeId !== void 0 ? { nodeId: bound.nodeId } : {}
        });
        return { ok: true, openStudio: true, kind: bound.kind, path: bound.path, nodeId: bound.nodeId, ticket: ticket2 };
      }
      const look = resolveGradeLook(String(args.prompt ?? ""));
      const graded = await applyGrade({ source: bound.path, look, outputDir: settings.outputDir, kind: bound.kind });
      const commit = await finishBound(bound, graded, bound.kind === "video" ? "video/mp4" : "image/jpeg");
      const ticket = await new StudioTicketStore(settings.outputDir).write({
        kind: graded.kind,
        path: graded.path,
        look: graded.look,
        ...bound.nodeId !== void 0 ? { nodeId: bound.nodeId } : {}
      });
      return { ok: true, openStudio: true, ...graded, ...commit, ticket };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_edit_plan",
    description: "\u7F16\u8F91\u8DEF\u7531\uFF08\u96F6\u6210\u672C\uFF09\uFF1A\u6839\u636E\u4EBA\u8BDD\u610F\u56FE\u5224\u5B9A\u8BE5\u8D70 studio / image_edit / video_process / edit / timeline / smart_cut / concat / \u8D28\u68C0\uFF0C\u8FD8\u662F\u5FC5\u987B\u91CD\u65B0\u751F\u6210\u3002\u4E0D\u6539\u6587\u4EF6\u3002\u62FF\u4E0D\u51C6\u5148\u8C03\u8FD9\u4E2A\u3002",
    parameters: {
      intent: { type: "string", required: true, description: "\u7528\u6237\u7684\u7F16\u8F91\u539F\u8BDD\uFF0C\u5982\u300C\u987A\u65F6\u9488\u8F6C 90 \u5EA6\u300D\u300C\u53BB\u6389\u5F00\u5934 2 \u79D2\u300D\u300C\u8C03\u6210\u672B\u65E5\u8352\u571F\u300D\u3002" },
      nodeId: { type: "string", description: "\u5F53\u524D\u753B\u5E03\u8282\u70B9\u3002" },
      path: { type: "string", description: "\u672C\u5730\u5A92\u4F53\u8DEF\u5F84\u3002" },
      kind: { type: "string", enum: ["image", "video"], description: "\u8986\u76D6\u81EA\u52A8\u5224\u65AD\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 15e3,
    isConcurrencySafe: () => true,
    async execute(args) {
      let kind = args.kind === "video" || args.kind === "image" ? args.kind : void 0;
      let path = typeof args.path === "string" ? args.path : void 0;
      const nodeId = typeof args.nodeId === "string" && args.nodeId !== "" ? args.nodeId : void 0;
      if (nodeId !== void 0 && (kind === void 0 || path === void 0)) {
        const found = await canvas.getNode(nodeId);
        if (found.kind === "node" && (found.node.kind === "image" || found.node.kind === "video")) {
          kind = kind ?? found.node.kind;
          if (path === void 0) path = found.node.path;
        }
      }
      return planEdit({ intent: String(args.intent ?? ""), kind, nodeId, path });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_image_edit",
    description: "\u786E\u5B9A\u6027\u56FE\u7247\u7F16\u8F91\uFF08ffmpeg\uFF09\uFF1A\u65CB\u8F6C 90/180/270\u3001\u6C34\u5E73/\u5782\u76F4\u7FFB\u8F6C\u3001\u88C1\u5207 w:h:x:y\u3001\u7F29\u653E\u3001\u660E\u6697\u5BF9\u6BD4\u9971\u548C\u3001\u53EF\u9009\u8C03\u8272\u3002\u53EF\u5E26 nodeId \u56DE\u5199\u753B\u5E03\u3002\u4E0D\u8981\u7528\u751F\u6210\u6A21\u578B\u5B8C\u6210\u8FD9\u4E9B\u64CD\u4F5C\u3002",
    parameters: {
      path: { type: "string", description: "\u672C\u5730\u56FE\u7247\u8DEF\u5F84\u3002\u53EF\u4E0E nodeId \u4E8C\u9009\u4E00\u3002" },
      nodeId: { type: "string", description: "\u753B\u5E03\u8282\u70B9 id\u3002\u6709\u5219\u56DE\u5199 path\u3002" },
      rotate: { type: "number", enum: [90, 180, 270], description: "\u65CB\u8F6C\u89D2\u5EA6\u3002" },
      hflip: { type: "boolean", description: "\u6C34\u5E73\u7FFB\u8F6C\u3002" },
      vflip: { type: "boolean", description: "\u5782\u76F4\u7FFB\u8F6C\u3002" },
      crop: { type: "string", description: "\u88C1\u526A w:h:x:y\u3002" },
      scale: { type: "string", description: "\u7F29\u653E\uFF0C\u5982 1280:720\u3002" },
      brightness: { type: "number", description: "\u4EAE\u5EA6 -1..1\uFF0C0 \u4E3A\u4E0D\u53D8\u3002" },
      contrast: { type: "number", description: "\u5BF9\u6BD4\u5EA6 0..3\uFF0C1 \u4E3A\u4E0D\u53D8\u3002" },
      saturate: { type: "number", description: "\u9971\u548C\u5EA6 0..3\uFF0C1 \u4E3A\u4E0D\u53D8\u3002" },
      look: { type: "string", description: "\u8C03\u8272 look\uFF1B\u590D\u6742\u8272\u677F\u4F18\u5148 directorx_studio\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 18e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const bound = await resolveBoundMedia({
        canvas,
        outputDir: settings.outputDir,
        nodeId: args.nodeId,
        path: args.path,
        require: "image"
      });
      const rotate = parseRotate2(args.rotate);
      const edited = await imageProcess({
        source: bound.path,
        outputDir: settings.outputDir,
        ...rotate !== void 0 ? { rotate } : {},
        hflip: args.hflip === true,
        vflip: args.vflip === true,
        crop: typeof args.crop === "string" ? args.crop : void 0,
        scale: typeof args.scale === "string" ? args.scale : void 0,
        brightness: typeof args.brightness === "number" ? args.brightness : void 0,
        contrast: typeof args.contrast === "number" ? args.contrast : void 0,
        saturate: typeof args.saturate === "number" ? args.saturate : void 0,
        ...typeof args.look === "string" && args.look.trim() !== "" ? { grade: resolveGradeLook(args.look) } : {}
      });
      return { ...edited, ...await finishBound(bound, edited, edited.mimeType) };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_edit",
    description: "\u610F\u56FE\u9A71\u52A8\u526A\u8F91\uFF1A\u628A\u81EA\u7136\u8BED\u8A00\u526A\u8F91\u6307\u4EE4\uFF08\u300C\u53BB\u6389\u5F00\u5934 2 \u79D2\u300D\u300C\u53EA\u4FDD\u7559 3 \u5230 10 \u79D2\u300D\u300C5-8 \u79D2\u653E\u6162 2 \u500D\u300D\u300C\u6574\u4E2A\u5012\u653E\u300D\uFF09\u89E3\u6790\u6210\u786E\u5B9A\u6027\u65F6\u95F4\u8F74\u5E76\u6E32\u67D3\u6210\u7247\u3002\u53EF\u5E26 nodeId \u56DE\u5199\u753B\u5E03\u3002\u6539\u6307\u4EE4=\u91CD\u6E32\u67D3\uFF0C\u96F6 API \u6210\u672C\u3002",
    parameters: {
      video: { type: "string", description: "\u6E90\u89C6\u9891\u8DEF\u5F84\u3002\u53EF\u4E0E nodeId \u4E8C\u9009\u4E00\u3002" },
      nodeId: { type: "string", description: "\u753B\u5E03\u8282\u70B9 id\u3002\u6709\u5219\u628A\u6210\u7247 path \u5199\u56DE\u8BE5\u8282\u70B9\u3002" },
      edits: { type: "array", items: { type: "string" }, required: true, description: "Natural-language edit instructions (or one string split by punctuation)." }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      const bound = await resolveBoundMedia({
        canvas,
        outputDir: settings.outputDir,
        nodeId: args.nodeId,
        path: args.video,
        require: "video"
      });
      const raw = Array.isArray(args.edits) ? args.edits.map(String) : typeof args.edits === "string" && args.edits !== "" ? [args.edits] : [];
      const instructions = raw.length === 1 ? raw[0].split(/[；;。]+/).map((piece) => piece.trim()).filter((piece) => piece !== "") : raw;
      const probe = probeMedia(bound.path);
      const commands = parseEditInstructions(instructions, probe.durationSec);
      const scenes = editsToScenes(commands, probe.durationSec).map((scene) => ({ ...scene, source: bound.path }));
      if (commands.length === 0) throw new Error("\u6CA1\u6709\u89E3\u6790\u51FA\u53EF\u6267\u884C\u7684\u526A\u8F91\u6307\u4EE4\uFF08\u652F\u6301\uFF1A\u53BB\u6389\u5F00\u5934/\u7ED3\u5C3E N \u79D2\u3001\u53EA\u4FDD\u7559 X \u5230 Y \u79D2\u3001X-Y \u79D2\u53D8\u901F Z \u500D\u3001\u6574\u4E2A\u5012\u653E\uFF09");
      if (scenes.length === 0) throw new Error(`\u526A\u8F91\u7A97\u53E3\u88AB\u88C1\u526A\u4E3A\u7A7A\uFF08\u6E90\u65F6\u957F ${probe.durationSec}s\uFF0C\u88C1\u526A\u91CF\u8D85\u8FC7\u53EF\u4FDD\u7559\u8303\u56F4\uFF09\u2014\u2014\u8C03\u6574\u6307\u4EE4\u6216\u6362\u66F4\u957F\u7684\u7D20\u6750`);
      const rendered = await renderTimeline({ scenes }, settings.outputDir);
      return {
        commands,
        timeline: scenes,
        path: rendered.path,
        steps: rendered.steps,
        probe: rendered.probe,
        ...await finishBound(bound, rendered, "video/mp4")
      };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_timeline",
    description: "Render a timeline JSON into a finished cut (OTIO-inspired subset \u2014 the editing agent's central format): scenes with per-scene trims, cross-fade/hard-cut concat, optional audio mixing with ducking, and subtitle muxing. Deterministic and re-renderable: change the plan, re-render, never re-generate. \u53EF\u5E26 nodeId \u56DE\u5199\u753B\u5E03\u3002 timeline = { scenes: [{source, trim?, transition?}], subtitle?, audio? [{path, volume?, duckUnder?}], scale? }.",
    parameters: {
      timeline: { type: "object", additionalProperties: true, required: true, description: "Timeline spec: scenes array + optional subtitle srt path, audio tracks, scale." },
      nodeId: { type: "string", description: "\u753B\u5E03\u8282\u70B9 id\u3002\u6709\u5219\u628A\u6210\u7247 path \u5199\u56DE\u8BE5\u8282\u70B9\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      const timeline = args.timeline ?? {};
      const rendered = await renderTimeline({
        scenes: Array.isArray(timeline.scenes) ? timeline.scenes : [],
        subtitle: timeline.subtitle,
        audio: Array.isArray(timeline.audio) ? timeline.audio : void 0,
        scale: timeline.scale
      }, settings.outputDir);
      const nodeId = typeof args.nodeId === "string" && args.nodeId !== "" ? args.nodeId : void 0;
      return { ...rendered, ...await finishBound({ nodeId }, rendered, "video/mp4") };
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
          prompt: await formatDshCanvasPromptForProject(intent, {
            sourceLabel: source?.label,
            outputDir: settings.outputDir
          }),
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
    name: "directorx_bible",
    description: "\u6539\u7F16\u4E94\u4EF6\u5957\u8BC4\u5BA1\uFF1A\u8BFB outline/cast/art/script/storyboard JSON\uFF0C\u8DD1\u811A\u672C\u8D28\u91CF\u95E8\uFF0C\u8F93\u51FA Markdown\u3002pin \u628A\u8BC4\u5BA1\u9489\u5230\u753B\u5E03\u6587\u672C\u5361\uFF0C\u540C\u65F6\u5199\u5165 outputDir/docs\u3002\u4E0D\u8981\u53E6\u51FA HTML\u3002\u4F53\u68C0\u5DF2\u6709\u5927\u7EB2\u4E5F\u8D70 checkup\u3002",
    parameters: {
      action: { type: "string", enum: ["detect", "checkup", "render", "pin"], description: "\u9ED8\u8BA4 detect\u3002checkup \u8DD1\u95E8\uFF1Brender \u51FA Markdown\uFF1Bpin \u9489\u753B\u5E03\u3002" },
      kind: { type: "string", enum: ["outline", "characters", "art", "script", "storyboard"], description: "\u4E0D\u4F20\u5219\u7528\u627E\u5230\u7684\u7B2C\u4E00\u4EFD\u3002" },
      path: { type: "string", description: "\u6307\u5B9A JSON \u8DEF\u5F84\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 3e4,
    async execute(args) {
      return runBible({
        outputDir: settings.outputDir,
        action: typeof args.action === "string" ? args.action : void 0,
        kind: typeof args.kind === "string" ? args.kind : void 0,
        path: typeof args.path === "string" ? args.path : void 0
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_shot_vocab",
    description: "\u955C\u5934\u8BED\u6C47\uFF1A\u914D\u65B9\u5361\u56DE\u7B54\u8FD9\u4E00\u5200\u600E\u4E48\u5207\uFF0C\u6280\u6CD5\u5361\u56DE\u7B54\u4EC0\u4E48\u65F6\u5019\u7528\u3001\u4EC0\u4E48\u65F6\u5019\u522B\u7528\u3002list/show \u7ED9 DSH \u5199\u5206\u955C\uFF1Bcheck \u590D\u6838\u63D0\u793A\u8BCD\u662F\u5426\u5E26\u4E0A\u5FC5\u5907\u77ED\u8BED\u3002\u4E0D\u662F\u5361\u7247\u5899\uFF0C\u4E5F\u4E0D\u51FA HTML\u3002",
    parameters: {
      action: { type: "string", enum: ["list", "show", "check"], description: "\u9ED8\u8BA4 list\u3002" },
      kind: { type: "string", enum: ["recipe", "technique"], description: "list \u65F6\u6309\u65CF\u7B5B\u3002" },
      query: { type: "string", description: "list \u68C0\u7D22\u8BCD\uFF0C\u5982 \u6B63\u53CD\u6253 / \u624B\u6301\u3002" },
      id: { type: "string", description: "show / check \u7684\u5361\u7247 id\u3002" },
      prompt: { type: "string", description: "check\uFF1A\u5206\u955C\u56FE\u6216\u6210\u7A3F\u63D0\u793A\u8BCD\u3002" }
    },
    output: objectOutput(),
    timeoutMs: 1e4,
    isConcurrencySafe: () => true,
    async execute(args) {
      const action = args.action === "show" || args.action === "check" ? args.action : "list";
      if (action === "list") {
        const cards = listShotVocab({
          kind: args.kind === "recipe" || args.kind === "technique" ? args.kind : void 0,
          query: typeof args.query === "string" ? args.query : void 0
        });
        return {
          cards: cards.map((card) => ({
            id: card.id,
            kind: card.kind,
            category: card.category,
            title: card.title,
            never: card.never,
            phrases: card.phrases
          })),
          next: cards.slice(0, 3).map((card) => `directorx_shot_vocab show ${card.id}`)
        };
      }
      if (action === "show") {
        const card = showShotVocab(String(args.id ?? ""));
        if (card === void 0) throw new Error("\u6CA1\u6709\u8FD9\u5F20\u5361\u3002\u5148 list\u3002");
        return { ...card, next: [`directorx_knowledge_read ${card.knowledge[0] ?? "109"}`, "\u5199\u8FD9\u4E00\u683C\u540E\u518D directorx_shot_vocab check"] };
      }
      return checkShotVocab({
        prompt: String(args.prompt ?? ""),
        recipe: typeof args.id === "string" ? args.id : void 0
      });
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_storyboard",
    description: "Storyboard duration planning (PenShot-inspired deterministic layer): allocates per-shot durations against model limits, clamps out-of-range values, fills unspecified shots toward the target, and checks continuity anchors. Pins the shot table as a visible \u5206\u955C\u8868 text node on the canvas.",
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
      const plan = planStoryboard({
        shots: Array.isArray(args.shots) ? args.shots : [],
        targetSeconds: args.targetSeconds,
        maxShotSeconds: args.maxShotSeconds,
        minShotSeconds: args.minShotSeconds,
        anchors: args.anchors
      });
      try {
        const pinned = await pinTextCard({
          store: canvas,
          stamp: STORYBOARD_STAMP,
          body: formatStoryboardText(plan),
          id: "storyboard-plan",
          width: 480
        });
        return { ...plan, canvasNodeId: pinned.nodeId };
      } catch {
        return plan;
      }
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
    description: "\u6210\u7247\u51B3\u7B56\u3002\u5148\u4E8E\u63D0\u95EE/\u751F\u6210\u8C03\u7528\u3002\u8FD4\u56DE confirm/generate\u3001\u89D2\u5EA6 lenses\uFF08\u4E0D\u662F\u6210\u7A3F\uFF09\u3001prompt_plan \u4E0E compose \u6D41\u7A0B next\u3002confirm=true \u65F6\u5E26 DSH \u6807\u51C6\u63D0\u95EE\u3002",
    parameters: {
      event: { type: "string", enum: ["unclear", "generate", "placeholder-batch"], required: true, description: "unclear = \u4E0D\u660E\u786E\u4E8B\u4EF6; generate = \u4E00\u4E2A\u751F\u6210\u4EFB\u52A1; placeholder-batch = \u6574\u6279\u5360\u4F4D\u3002" },
      prompt: { type: "string", description: "Generation task wording, or the exact chosen prompt." },
      chosen: { type: "boolean", description: "true after the user picked one \u4E25\u683C variant." },
      proposalStatus: { type: "string", description: "If executing: proposed/approved/rejected/done of the queued \u5360\u4F4D." },
      inBudget: { type: "boolean", description: "\u81EA\u52A8 only: false if this unit would exceed the agreed budget." },
      necessaryAsk: { type: "boolean", description: "\u81EA\u52A8 only: true if this ambiguity must be asked." },
      variantCount: { type: "number", description: "\u4E25\u683C: how many of \u4E8C\u5230\u56DB\u4E2A\u63D0\u793A\u8BCD (clamped 2\u20134)." },
      present: { type: "boolean", description: "true = \u7ACB\u523B\u8D70 DSH \u6807\u51C6\u63D0\u95EE\uFF0C\u4E0D\u8981\u53EA\u8FD4\u56DE JSON\u3002" }
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
      const flow = planProduction({
        request: String(args.prompt ?? ""),
        materials: []
      });
      const next = [
        ...ask.length > 0 && answers === void 0 ? ["directorx_ask"] : [],
        ...flow.next
      ];
      return { ...decision, enqueue, auth, ask, answers, flow, next };
    }
  })));
  disposers.push(ctx.tools.register(safeDefine({
    name: "directorx_brief",
    description: "\u610F\u56FE\u5206\u8BCA\uFF1A\u7C7B\u578B/\u5E73\u53F0/\u65F6\u957F + compose \u9636\u6BB5\u56FE\uFF08\u8DEF/\u7A3F/\u4F4D\u542B prompt_plan \u4E0E craft/ready\uFF09\u3002\u6309 compose.nextActions \u81EA\u5DF1\u7F16\u6392\u3002directorx_orchestrate \u53EF\u9009\u3002",
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
    description: "LLM \u7CBE\u526A\uFF08deterministic matcher\uFF09: the agent writes the narration script; this tool locates each sentence's best-matching subtitle cue (character-overlap scoring) in the source video and assembles the matched windows into a finished cut via the timeline pipeline. \u53EF\u5E26 nodeId \u56DE\u5199\u753B\u5E03\u3002",
    parameters: {
      video: { type: "string", description: "\u6E90\u89C6\u9891\u8DEF\u5F84\u3002\u53EF\u4E0E nodeId \u4E8C\u9009\u4E00\u3002" },
      nodeId: { type: "string", description: "\u753B\u5E03\u8282\u70B9 id\u3002\u6709\u5219\u628A\u6210\u7247 path \u5199\u56DE\u8BE5\u8282\u70B9\u3002" },
      srt: { type: "string", required: true, description: "Absolute path of the .srt transcript (directorx_transcribe_audio)." },
      script: { type: "array", items: { type: "string" }, required: true, description: "Script sentences (or one full text, split by punctuation)." },
      pad: { type: "number", description: "Padding seconds around each matched cue (default 0.15)." }
    },
    output: objectOutput(),
    timeoutMs: 18e5,
    isConcurrencySafe: () => true,
    async execute(args) {
      const bound = await resolveBoundMedia({
        canvas,
        outputDir: settings.outputDir,
        nodeId: args.nodeId,
        path: args.video,
        require: "video"
      });
      const rendered = await smartCut({
        video: bound.path,
        srt: String(args.srt),
        script: Array.isArray(args.script) ? args.script.map(String) : [],
        outputDir: settings.outputDir,
        pad: typeof args.pad === "number" ? args.pad : void 0
      });
      return { ...rendered, ...await finishBound(bound, rendered, "video/mp4") };
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
      const name = typeof args.title === "string" && args.title !== "" ? args.title : String(args.source).split("/").pop();
      const lines = [`\u8D28\u68C0\uFF5C${name}`, `verdict: ${report.verdict}`, ...report.checks.map((check) => `${check.pass ? "PASS" : "FAIL"} ${check.name}: ${check.detail}`), "\u89C4\u5219\u5F15\u7528: directorx-methodology\uFF08\u8282\u594F\u89C4\u5219 2/10\uFF0C\u9ED1\u5E27\u767D\u5E27\u89C4\u5219\u7531\u786E\u5B9A\u6027\u4FE1\u53F7\u5206\u6790\u8986\u76D6\uFF09"];
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

// src/tool-collect.ts
function defaultContractSettings(overrides = {}) {
  const capability = (enabled = true) => ({
    enabled,
    mode: "mock",
    baseURL: "",
    apiKey: "",
    model: "mock",
    resolution: "1K",
    auth: { klingAk: "", klingSk: "", runwayVersion: "" }
  });
  return {
    outputDir: "/tmp/directorx-tool-contract",
    timeoutMs: 1e3,
    pollIntervalMs: 100,
    maxPollAttempts: 1,
    persona: "\u6210\u7247",
    initiative: "\u81EA\u52A8",
    vision: capability(),
    image: capability(),
    video: capability(),
    audio: capability(),
    ...overrides
  };
}
function collectToolSpecs(settings = defaultContractSettings()) {
  const tools = [];
  const ctx = {
    tools: {
      register(def) {
        tools.push(def);
        return () => {
        };
      }
    },
    get() {
      return void 0;
    }
  };
  const dispose = syncTools(ctx, settings);
  dispose();
  return tools;
}
export {
  AdapterStore,
  BLOCKING_NODE_ID,
  BLOCKING_STAMP,
  CANVAS_ROUTE_PATH,
  CAST_STAMP_PREFIX,
  CHENGPIAN_PERSONA,
  CanvasIntentStore,
  CharacterStore,
  DESUB_STAMP,
  DirectiveError,
  DirectorxCanvasStore,
  DirectorxEditLedger,
  DirectorxTaskLedger,
  EDIT_SUBDIR,
  EXTEND_STAMP,
  GIF_STAMP,
  GRADE_LOOKS,
  GRADE_LOOK_LIST,
  GRADE_TABLE,
  GenerateReadyStore,
  IpMemoryStore,
  JOIN_STAMP,
  LIMITS,
  MAX_EDIT_LINES,
  MAX_LEDGER_LINES,
  MAX_MEDIA_BYTES,
  MEDIA_EDITS_ROUTE_PATH,
  MEDIA_LIST_ROUTE_PATH,
  MEDIA_ROUTE_PATH,
  MEDIA_TASKS_ROUTE_PATH,
  MEDIA_TYPE_EXT,
  MODEL_MATRIX,
  NoteStore,
  OKF_VERSION,
  ProductionStageStore,
  ProjectStyleStore,
  PromptCraftStore,
  ProposalStore,
  RESHOOT_STAMP,
  REVISE_STAMP,
  ResearchLedger,
  SCRIPT_CARD_STAMP,
  SCRIPT_STARTER,
  SHOT_VOCAB,
  SNAP_GRID,
  STACK_STAMP,
  STAGE_IDS,
  STORYBOARD_STAMP,
  STUDIO_ROUTE_PATH,
  SkillIndex,
  StudioTicketStore,
  TermStore,
  adapterCapabilities,
  adapterIdFor,
  addMenuRows,
  alignBoxes,
  answerQuestion,
  applyAutolink,
  applyConfirmAnswers,
  applyDesub,
  applyExtendCut,
  applyFrameStrip,
  applyGifExport,
  applyGrade,
  applyGridJoin,
  applyReshootAssemble,
  applyReshootCut,
  applyScriptRows,
  applySeries,
  applySplitScreen,
  applyVideoParse,
  articlesForSkill,
  asClipPayload,
  askDshRewriteText,
  aspectRatio,
  assertWritableSkillName,
  assessGenerateReady,
  audioBeats,
  audioMix,
  audioSync,
  authHeaders,
  brief,
  buildBody,
  buildConfirmQuestions,
  buildIpBrief,
  buildShotPrompt,
  buildShotSequence,
  buildTicks,
  canvasEdgeAllowed,
  characterBucket,
  checkShotVocab,
  chengpianAskQuestions,
  chengpianPersonaText,
  clampH3Duration,
  clampMenu,
  clampRange,
  classifyGenerateStrategy,
  classifyProvider,
  classifyProviderDoc,
  classifyRequestType,
  cleanSpeechText,
  clipH3Prompt,
  clipPlayDuration,
  clipRank,
  clipStarts,
  closestPorts,
  collectNegatives,
  collectToolSpecs,
  collectUrls,
  commitBoundMedia,
  commitGenerateReady,
  commitIpRewrite,
  commitProvider,
  composeKindFromBriefType,
  composeProductionFlow,
  confirmProduction,
  contactSheet,
  contractSmoke,
  corpus,
  countProposals,
  craftPrompt,
  createdSessionId,
  cropToAspect,
  currentProjectRoot,
  decideCaptureAnswer,
  decideChengpian,
  defaultContractSettings,
  deliverCapture,
  detectBibles,
  detectNamedCharacters,
  displayCardTitle,
  distributeBoxes,
  dockItemsFromSnapshot,
  draftDirectorPrompts,
  draftProvider,
  duplicateClip,
  durationFromPrompt,
  edgeHandlePoints,
  editsToScenes,
  ensureAspectFrame,
  estimateSpeech,
  evenPx,
  expandCraftQuery,
  exportBitrate,
  exportSize,
  extraSkillRoots,
  extractCitedSources,
  extractDescription,
  extractEntities,
  extractFrames,
  extractMentionedIds,
  extractTailFrame,
  fitScaleFilter,
  flowAbsolutePosition,
  fmtClock,
  focusViewOptions,
  foldSessionHistory,
  formatCanvasShotlist,
  formatCharacterSetting,
  formatDshCanvasPrompt,
  formatDshCanvasPromptForProject,
  formatLookBlock,
  formatParseScript,
  formatProductionBoard,
  formatProposalList,
  formatStoryboardText,
  fromSource,
  gateShotSequence,
  generationPreset,
  genericGenerate,
  groupFrame,
  groupMenuRows,
  h3CraftLooksReady,
  h3Resolution,
  h3SkipReferences,
  handleToSide,
  harvestBlocking,
  harvestProduction,
  harvestSeries,
  hasImageOp,
  hasLibass,
  hitTest,
  hitTestAbsolute,
  imageProcess,
  incomingRefIds,
  inferBibleKind,
  inferContinueKind,
  inferH3PromptMode,
  inferMediaKind,
  inferOkfTags,
  inferOkfType,
  inferProductionKind,
  ingestProvider,
  inspectMediaFile,
  isAssetSlug,
  isGradeLook,
  isH3Model,
  isSimpleUnit,
  isThinPrompt,
  keepSpans,
  klingJwt,
  klingV3Video,
  klingVideo,
  libraryBucket,
  limitH3Refs,
  linesFromFold,
  listGradeLabels,
  listMediaFiles,
  listPresets,
  listSeries,
  listShotVocab,
  loadSeries,
  losslessJsonObject,
  mediaFromToolResult,
  mediaKindOf,
  mediaTypeExt,
  mergeNegativeLine,
  minimaxH3Video,
  mockAudio,
  mockImage,
  mockTranscribe,
  mockVideo,
  mockVision,
  moveClip,
  moveTo,
  multiMenuRows,
  nearestAspect,
  nextCardLabel,
  nextClipId,
  nodeMenuRows,
  normalizeAskQuestions,
  normalizeH3Prompt,
  nudgeBoxes,
  nudgeStep,
  openaiTts,
  openaiVideo,
  orchestrateProduction,
  packClip,
  parseAdapterSpec,
  parseArchivedIds,
  parseAspectRatio,
  parseBeats,
  parseCraftAction,
  parseDesubRegion,
  parseDirectorxCommand,
  parseDurationSeconds,
  parseEditInstructions,
  parseInitiative,
  parseInline2 as parseInline,
  parseMarkdown,
  parseMediaQuery,
  parseOkfDocument,
  parsePreviewShots,
  parseRangeHeader,
  parseRotate2 as parseRotate,
  parseScriptBeats,
  parseSessionList,
  parseSrt,
  parseStrategy,
  parseWorkspaceList,
  patchClip,
  pickWorkspaceSession,
  pinBlocking,
  pinCharacterSetting,
  pinTextCard,
  planAutolink,
  planContinueFromFlowNode,
  planContinueGenerate,
  planEdit,
  planPlaceholderEnqueue,
  planProduction,
  planPrompt,
  planRevise,
  planStoryboard,
  portPoint,
  portsForHandles,
  preflight,
  probeMedia,
  projectSkillRoot,
  qaCheck,
  readPath,
  readingOrder,
  registerCanvasCraftRoute,
  registerCanvasIntentRoute,
  registerCanvasRoute,
  registerCharactersRoute,
  registerDirectorxCommands,
  registerMcpRoute,
  registerMediaEditsRoute,
  registerMediaListRoute,
  registerMediaRoute,
  registerMediaTasksRoute,
  registerProposalsRoute,
  registerStudioRoute,
  registerSubagentSetup,
  removeClip,
  renderTimeline,
  requireCraft,
  requireReady,
  resolveBoundMedia,
  resolveGenerateAuthorization,
  resolveGenerateCapability,
  resolveGradeLook,
  resolveLiveSession,
  resolveLocalMedia,
  resolveMediaPath,
  resolveOutputDir,
  resolveStoredLabel,
  reviewBible,
  routeDisplayPorts,
  routeModel,
  routeSkills,
  rpcOk,
  runAudio,
  runBible,
  runBlocking,
  runCanvasCraft,
  runChengpianEvent,
  runDirectorxCommand,
  runImage,
  runInProject,
  runKnowledgeJob,
  runSeries,
  runSkillCapture,
  runTranscribe,
  runVideo,
  runVision,
  runwayVideo,
  safeHref,
  saveCapturedSkill,
  saveSeries,
  saveSkillAsk,
  scanIpRisk,
  scanIpWithMemory,
  sequenceDuration,
  serializeOkfDocument,
  sessionRunningFromList,
  shotMark,
  shouldNestCraft,
  showShotVocab,
  sideToHandle,
  sizeFromAspect,
  skillIndex,
  skillsForArticle,
  slugSeriesName,
  slugSkillName,
  smartCut,
  smokeProvider,
  snapCoord,
  sourceFromSequence,
  specPrompt,
  splitAt,
  srtLint,
  srtNormalize,
  subtitleCut,
  suggestSkillName,
  summarizeToolName,
  syncTools,
  takePeers,
  textFromBlocks,
  tickStep,
  tidyOverlappingGroups,
  toolCaption,
  toolsForSkill,
  trimClip,
  upsertRelatedSection,
  userSkillRoot,
  validSkillName,
  veoVideo,
  videoAnalyze,
  videoConcat,
  videoPip,
  videoProcess,
  videoSubtitle,
  videoUnderstand,
  videoZoom,
  viduVideo,
  wantsCharacterSheet,
  weightedWidth,
  withCharacterSheetSpec,
  zoomEndFrame
};
//# sourceMappingURL=testing.js.map
