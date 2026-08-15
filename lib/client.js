var module = { exports: {} }; var exports = module.exports;
window.__ModuleLoader__.load({ id: "dsh-directorx", factory: (require) => {
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);

// src/client/DirectorxSettingsSection.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var DEFAULT_DRAFT = {
  vision: { enabled: true, mode: "openai-chat", baseURL: "https://api.openai.com/v1", model: "gpt-4o-mini", resolution: "1K", apiKey: "" },
  image: { enabled: true, mode: "openai-images", baseURL: "https://api.openai.com/v1", model: "gpt-image-1", resolution: "1K", apiKey: "" },
  video: { enabled: true, mode: "openai-videos", baseURL: "https://api.openai.com/v1", model: "sora-2", resolution: "2K", apiKey: "" },
  audio: { enabled: true, mode: "openai-tts", baseURL: "https://api.openai.com/v1", model: "gpt-4o-mini-tts", resolution: "1K", apiKey: "" }
};
var MODES = {
  vision: ["openai-chat", "mock"],
  image: ["openai-images", "modelverse-tasks", "mock"],
  video: ["openai-videos", "modelverse-tasks", "mock"],
  audio: ["openai-tts", "mock"]
};
var CAPABILITY_LABEL = {
  vision: "\u89C6\u89C9 / Vision",
  image: "\u56FE\u50CF\u751F\u6210 / Image",
  video: "\u89C6\u9891\u751F\u6210 / Video",
  audio: "\u97F3\u9891\u751F\u6210 / Audio"
};
function readDraft(value) {
  const next = { ...DEFAULT_DRAFT };
  for (const key of Object.keys(next)) {
    const raw = value?.[key];
    if (raw !== null && typeof raw === "object") {
      const record = raw;
      next[key] = {
        enabled: typeof record.enabled === "boolean" ? record.enabled : next[key].enabled,
        mode: typeof record.mode === "string" ? record.mode : next[key].mode,
        baseURL: typeof record.baseURL === "string" ? record.baseURL : next[key].baseURL,
        model: typeof record.model === "string" ? record.model : next[key].model,
        resolution: typeof record.resolution === "string" ? record.resolution : next[key].resolution,
        apiKey: ""
      };
    }
  }
  return next;
}
function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}
var card = { border: "1px solid rgba(128, 140, 160, .25)", borderRadius: 10, padding: 14, marginBottom: 12, background: "rgba(255,255,255,.02)" };
var row = { display: "grid", gridTemplateColumns: "minmax(90px, 140px) 1fr", gap: 10, marginBottom: 8, alignItems: "center" };
var label = { fontSize: 12, opacity: 0.72 };
var input = { width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(128,140,160,.35)", background: "rgba(0,0,0,.15)", color: "inherit" };
var button = { padding: "7px 12px", borderRadius: 7, border: "1px solid rgba(128,160,255,.55)", background: "rgba(80,130,255,.18)", color: "inherit", cursor: "pointer" };
var sectionTitle = { fontSize: 15, fontWeight: 600, margin: "0 0 2px" };
var hint = { fontSize: 12, opacity: 0.62, lineHeight: 1.5 };
function CapabilityCard(props) {
  const { draft } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: card, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: props.title }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { style: { fontSize: 12, display: "flex", gap: 6, alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: draft.enabled, onChange: (event) => props.onChange({ ...draft, enabled: event.target.checked }) }),
        "\u542F\u7528 / Enabled"
      ] })
    ] }),
    draft.enabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: row, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: label, children: "\u914D\u7F6E\u65B9\u5F0F / Mode" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", { style: input, value: draft.mode, onChange: (event) => props.onChange({ ...draft, mode: event.target.value }), children: props.modes.map((mode) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: mode, children: mode }, mode)) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: row, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: label, children: "Base URL" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: input, value: draft.baseURL, placeholder: "https://api.openai.com/v1", onChange: (event) => props.onChange({ ...draft, baseURL: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: row, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: label, children: "API Key" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: input, type: "password", value: draft.apiKey, autoComplete: "off", placeholder: draft.baseURL.startsWith("http://localhost") || draft.baseURL.includes("127.0.0.1") ? "\u672C\u5730\u7AEF\u70B9\u53EF\u7559\u7A7A" : "sk-...\uFF08\u7559\u7A7A\u5219\u4E0D\u4FEE\u6539\uFF09", onChange: (event) => props.onChange({ ...draft, apiKey: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: row, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: label, children: "Model" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: input, value: draft.model, placeholder: "model id", onChange: (event) => props.onChange({ ...draft, model: event.target.value }) })
      ] }),
      props.title === CAPABILITY_LABEL.video ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: row, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: label, children: "Resolution" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { style: input, value: draft.resolution, placeholder: "2K / 720p / 1080p", onChange: (event) => props.onChange({ ...draft, resolution: event.target.value }) })
      ] }) : null
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: hint, children: "\u5173\u95ED\u540E\uFF0CDirectorX \u4E0D\u4F1A\u6CE8\u518C\u6B64\u80FD\u529B\u5BF9\u5E94\u7684\u5DE5\u5177\u3002\u5176\u5B83\u80FD\u529B\u4E0D\u53D7\u5F71\u54CD\u3002" })
  ] });
}
function DirectorxSettingsSection(props) {
  const api = props.api;
  const [status, setStatus] = (0, import_react.useState)("idle");
  const [draft, setDraft] = (0, import_react.useState)(DEFAULT_DRAFT);
  const [view, setView] = (0, import_react.useState)(void 0);
  const [writable, setWritable] = (0, import_react.useState)(false);
  const [saving, setSaving] = (0, import_react.useState)(false);
  const [saved, setSaved] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(void 0);
  async function load() {
    if (api === void 0) return;
    setStatus((prev) => prev === "idle" ? "loading" : prev);
    setError(void 0);
    try {
      const response = await api.describe({});
      if (!response.result.ok) throw new Error(response.result.error?.message ?? "settings.describe failed");
      const target = response.result.value.namespaces.find((entry) => entry.ns === "directorx");
      if (target === void 0) {
        setStatus("ready");
        setWritable(response.result.value.writable);
        setError("\u672A\u627E\u5230 directorx \u8BBE\u7F6E\u547D\u540D\u7A7A\u95F4\u3002\u8BF7\u786E\u8BA4\u63D2\u4EF6\u5DF2\u5B89\u88C5\u5E76\u91CD\u542F DSH\u3002");
        return;
      }
      setView(target);
      setDraft(readDraft(target.value));
      setWritable(response.result.value.writable);
      setStatus("ready");
    } catch (loadError) {
      setStatus("error");
      setError(messageOf(loadError));
    }
  }
  (0, import_react.useEffect)(() => {
    void load();
  }, []);
  async function save() {
    if (api === void 0 || view === void 0 || saving) return;
    setSaving(true);
    setSaved(false);
    setError(void 0);
    try {
      const ops = [];
      for (const key of Object.keys(draft)) {
        const capability = draft[key];
        ops.push(
          { op: "set", path: [key, "enabled"], value: capability.enabled },
          { op: "set", path: [key, "mode"], value: capability.mode },
          { op: "set", path: [key, "baseURL"], value: capability.baseURL },
          { op: "set", path: [key, "model"], value: capability.model },
          { op: "set", path: [key, "resolution"], value: capability.resolution }
        );
        if (capability.apiKey.trim() !== "") {
          ops.push({ op: "set", path: [key, "apiKey"], value: capability.apiKey.trim() });
        }
      }
      const response = await api.mutate({ ns: "directorx", ops, expectedRevision: view.revision });
      if (!response.result.ok) throw new Error(response.result.error?.message ?? "settings.mutate failed");
      setView(response.result.value);
      setDraft(readDraft(response.result.value.value));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(messageOf(saveError));
    } finally {
      setSaving(false);
    }
  }
  if (api === void 0) return null;
  if (status === "loading" || status === "idle") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: 18, opacity: 0.7 }, children: "\u6B63\u5728\u52A0\u8F7D DirectorX \u6A21\u578B\u914D\u7F6E\u2026" });
  if (status === "error") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 18 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: button, onClick: () => void load(), children: "\u91CD\u8BD5" })
  ] });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: 18 }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { style: sectionTitle, children: "DirectorX \u6A21\u578B" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: hint, children: "\u4E3A\u89C6\u89C9\u3001\u56FE\u50CF\u751F\u6210\u3001\u89C6\u9891\u751F\u6210\u3001\u97F3\u9891\u751F\u6210\u5206\u522B\u914D\u7F6E Base URL\u3001API Key\u3001\u914D\u7F6E\u65B9\u5F0F\u4E0E\u80FD\u529B\u5F00\u5173\u3002\u914D\u7F6E\u4FDD\u5B58\u5230 DSH settings\uFF08`directorx` \u547D\u540D\u7A7A\u95F4\uFF09\uFF0C\u65E0\u9700\u91CD\u542F\u5373\u65F6\u751F\u6548\u3002" }),
    !writable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: hint, children: "\u5F53\u524D settings \u540E\u7AEF\u53EA\u8BFB\uFF0C\u65E0\u6CD5\u4FDD\u5B58\u4FEE\u6539\u3002" }) : null,
    error !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { role: "alert", style: { color: "#ff9b8f", fontSize: 12 }, children: error }) : null,
    saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { role: "status", style: { color: "#8fdc9f", fontSize: 12 }, children: "\u5DF2\u4FDD\u5B58\u5E76\u70ED\u66F4\u65B0\u5DE5\u5177\u6CE8\u518C\u3002" }) : null,
    Object.keys(draft).map((key) => {
      const capabilityKey = key;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        CapabilityCard,
        {
          title: CAPABILITY_LABEL[capabilityKey],
          draft: draft[capabilityKey],
          modes: MODES[capabilityKey],
          onChange: (next) => {
            setDraft((current) => ({ ...current, [capabilityKey]: next }));
          }
        },
        capabilityKey
      );
    }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { style: button, disabled: saving || !writable, onClick: () => void save(), children: saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58\u5168\u90E8\u914D\u7F6E" })
  ] });
}

// src/client/index.ts
var name = "directorx-client";
var inject = ["slots", "connection"];
function apply(ctx) {
  ctx.slots.inject("settings.section", () => {
    const connection = ctx.get("connection");
    if (connection === void 0) return () => {
    };
    return ctx.slots.register({
      name: "settings.section",
      id: "directorx",
      order: 30,
      label: "DirectorX",
      inject: () => ({ api: connection.api.settings })
    }, DirectorxSettingsSection);
  });
}
return module.exports; } });
//# sourceMappingURL=client.js.map
