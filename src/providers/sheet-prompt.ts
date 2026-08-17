const SHEET_HINT = /三视图|设定图|设定表|角色卡|角色设定|turnaround|character sheet|正侧背|正视.*侧视/i

const SHEET_SPEC = [
  '【必须是一张角色设定表，不是单张剧照】16:9，纯白底。',
  '左栏约 34%：半身证件照，面部基准，肩膀完整，底边齐平直切。',
  '右上：正视、侧视、背视三个全身像，等高、不拉伸、不透视压缩。',
  '右下：材质/配饰细节条。',
  '左右必须是同一个人、同一发型、同一表情；左栏柔和方向光，右栏平光正交。',
].join('')

export function wantsCharacterSheet(prompt: string): boolean {
  return SHEET_HINT.test(prompt)
}

export function withCharacterSheetSpec(prompt: string): string {
  if (!wantsCharacterSheet(prompt)) return prompt
  if (prompt.includes('【必须是一张角色设定表')) return prompt
  return `${prompt.trim()}\n\n${SHEET_SPEC}`
}
