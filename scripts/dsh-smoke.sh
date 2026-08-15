#!/usr/bin/env bash
# One-shot DSH smoke test for dsh-directorx.
#
# Creates a temporary profile, installs the plugin from the current checkout,
# asks DSH to exercise directorx_knowledge_search + directorx_knowledge_read,
# and removes the profile afterwards.
#
# Requires: a configured `dsh` on PATH and a working model/API credential.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v dsh >/dev/null 2>&1; then
  echo "dsh is not on PATH; install/configure DeepSeek Harness first." >&2
  exit 1
fi

PROFILE="directorx-smoke-$$"
cleanup() {
  rm -rf "$HOME/.video-agent/profiles/$PROFILE" 2>/dev/null || true
  rm -rf "$HOME/.dsh/profiles/$PROFILE" 2>/dev/null || true
}
trap cleanup EXIT

echo "==> creating temporary profile: $PROFILE"
dsh plugin --profile "$PROFILE" add . >/dev/null

echo "==> adding the headless runner to the temporary profile"
PROFILE_DIR="$HOME/.video-agent/profiles/$PROFILE"
if [ ! -d "$PROFILE_DIR" ]; then
  PROFILE_DIR="$HOME/.dsh/profiles/$PROFILE"
fi
node -e '
const fs = require("node:fs")
const path = process.argv[1]
const pkg = JSON.parse(fs.readFileSync(path, "utf8"))
const bundles = pkg.dsh.profile.bundles
if (!bundles.includes("@deepseek-ai/dsh-headless")) {
  bundles.splice(1, 0, "@deepseek-ai/dsh-headless")
}
fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n")
' "$PROFILE_DIR/package.json"

echo "==> running DSH against the plugin tools"
dsh run --profile "$PROFILE" \
  "Use directorx_knowledge_search for '图生视频 首尾帧'. Then read the best article and report its id/title plus one key fact."

echo "==> smoke test passed"
