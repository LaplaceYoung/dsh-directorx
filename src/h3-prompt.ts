/**
 * Normalize video crafts toward the official H3 prompt shape.
 * Source: MiniMax H3 使用手册 ch.4 + 视频扩写 Prompt 写作全能指南.
 * Other models may call the same helpers for structure; field names stay H3.
 */

const I2VA_ALIGN = 'For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.'
const HAS_OFFICIAL_FIELDS = /integrated_multimodal_description\s*:/i
const HAS_SOUNDSCAPE = /overall_soundscape\s*:/i
const HAS_MUSIC = /non_diegetic_music\s*:/i
const CN_BEAT = /【\s*(\d{1,2})\s*[:：]\s*(\d{2})\s*[-–~到至]\s*(\d{1,2})\s*[:：]\s*(\d{2})\s*】/g

export type H3PromptMode = 't2v' | 'i2v' | 'fl2v' | 'l2v' | 'ref2v'

export function inferH3PromptMode(input: {
  firstFrame?: string
  lastFrame?: string
  referenceImages?: string[]
  strategy?: string
}): H3PromptMode {
  if (input.strategy === 'fl2v' || (has(input.firstFrame) && has(input.lastFrame))) return 'fl2v'
  if (input.strategy === 'ref2v') return 'ref2v'
  if (input.strategy === 'i2v' && has(input.lastFrame) && !has(input.firstFrame)) return 'l2v'
  if (has(input.firstFrame)) return 'i2v'
  if (has(input.lastFrame)) return 'l2v'
  return 't2v'
}

export function normalizeH3Prompt(prompt: string, input: {
  mode?: H3PromptMode
  seconds?: number
  firstFrame?: string
  lastFrame?: string
}): { prompt: string; notes: string[] } {
  const notes: string[] = []
  let body = rewriteChineseBeats(prompt.trim())
  const mode = input.mode ?? inferH3PromptMode(input)
  const seconds = Math.min(15, Math.max(4, Math.round(input.seconds ?? 5)))

  if (mode === 'i2v' && !/fully referenced/i.test(body)) {
    body = `${I2VA_ALIGN}\n\n${body}`
    notes.push('补 I2VA 对齐句')
  }
  if (mode === 'fl2v' && !/Picture 1 \(from Shot/i.test(body)) {
    body = [
      `How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot 1) aligns with the ${seconds.toFixed(2)}-second mark of the target video.`,
      '',
      body,
    ].join('\n')
    notes.push('补 FL2VA 对齐句')
  }
  if (mode === 'l2v' && !/aligns with the .+second mark/i.test(body)) {
    body = [
      `How the reference pictures align with the target video — <Picture 1> (from [Shot 1]) aligns with the ${seconds.toFixed(2)}-second mark of the target video.`,
      '',
      body,
    ].join('\n')
    notes.push('补 L2VA 对齐句')
  }

  if (mode === 'fl2v' && /the camera cuts to|【镜头|Shot 2/i.test(body) && !/不要切镜|no cut|single shot|单镜/i.test(body)) {
    body = `${body.trim()}\n\nKeep a single continuous shot. Do not add extra cuts between Picture 1 and Picture 2.`
    notes.push('FL2VA 钉单镜插值')
  }

  if (!HAS_OFFICIAL_FIELDS.test(body) && !/【核心创意】|核心创意：/.test(body)) {
    body = promoteThreePart(body)
    notes.push('补三段公式外壳')
  }

  if (HAS_OFFICIAL_FIELDS.test(body) && !HAS_SOUNDSCAPE.test(body)) {
    body = `${body.trim()}\n\noverall_soundscape: Physical action sounds and room tone only. No extra dialogue.`
    notes.push('补 overall_soundscape')
  }
  if ((HAS_OFFICIAL_FIELDS.test(body) || /【画面过程/.test(body)) && !HAS_MUSIC.test(body) && !/非叙事性音乐/.test(body)) {
    body = `${body.trim()}\n\nnon_diegetic_music: N/A`
    notes.push('无配乐时钉 N/A')
  }

  return { prompt: body, notes }
}

export function h3CraftLooksReady(prompt: string): string | undefined {
  const body = prompt.trim()
  if (body.length < 80) return 'H3 成稿太短。按参考说明 + 核心创意 + 画面过程写，或写成官方三字段。'
  const hasTimeline = /\[Shot\s*1\]|Shot 1|0-3|0〜|【画面过程|integrated_multimodal_description/i.test(body)
  if (!hasTimeline) return 'H3 成稿缺少时间线（[Shot 1] 或按秒分段的画面过程）。不要只写一句氛围。'
  return undefined
}

function has(value?: string): boolean {
  return typeof value === 'string' && value !== ''
}

function rewriteChineseBeats(text: string): string {
  let shot = 0
  return text.replace(CN_BEAT, (_match, mm, ss) => {
    shot += 1
    const mark = `${String(Number(mm)).padStart(2, '0')}:${ss}.000`
    return shot === 1 ? `[Shot 1]` : `[Shot ${shot}] At ${mark},`
  })
}

function promoteThreePart(body: string): string {
  if (/【参考素材说明】/.test(body)) return body
  return [
    '【参考素材说明】按上传顺序写清每张图/每段视频的用途（人物/场景/风格/首帧/尾帧/动作）。没有素材则整段跳过。',
    '【核心创意】一句话锁主体、地点、事件、题材/风格、是否一镜到底。',
    `【画面过程说明】${body}`,
    '【不想要】不要新增人物、不要乱码文字、不要水印。不要背景音乐时写：非叙事性音乐：N/A',
  ].join('\n')
}
