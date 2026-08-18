/** Shared tokenizer for knowledge + skill search. */

export function textTokens(value: string): Set<string> {
  const tokens = new Set<string>()
  for (const word of value.toLowerCase().match(/[a-z0-9][a-z0-9_-]{1,}/g) ?? []) {
    tokens.add(word)
    if (word.length > 3) tokens.add(word.slice(0, 4))
  }
  const han = value.replace(/[^\u4e00-\u9fff]/g, '')
  for (let i = 0; i < han.length; i += 1) {
    tokens.add(han[i] ?? '')
    if (i + 1 < han.length) tokens.add(han.slice(i, i + 2))
  }
  return tokens
}

export function overlapScore(left: Set<string>, right: Set<string>): number {
  let hit = 0
  for (const token of left) if (right.has(token)) hit += 1
  return hit
}
