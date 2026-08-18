/** Shared craft synonyms + skill ↔ knowledge article ids. */

export const CRAFT_SYNONYMS: Array<[RegExp, string]> = [
  [/首尾帧|首帧|尾帧|first.?frame|last.?frame/i, '图生视频 image-to-video i2v 首帧 尾帧 116'],
  [/图生视频|i2v|image.to.video/i, '首尾帧 首帧 参考图 116 continuous-video'],
  [/三视图|设定图|正侧背|定妆|turnaround|character sheet/i, 'novel-characters 角色 设定 正视 侧视 背视 04 117'],
  [/分镜|storyboard|镜号|排片/i, 'storyboard-craft novel-storyboard 景别 运镜 172 01'],
  [/调色|lut|grade|色板|配色/i, '调色 色彩 胶片 青橙 141 editing-workflow'],
  [/剪辑|精剪|裁剪|编辑台|转场/i, 'editing-workflow directorx-methodology 剪辑 02 127'],
  [/一致性|continuity|锚点/i, '角色一致性 跨镜 参考图 117 123 novel-characters'],
  [/口播|配音|tts|旁白/i, '音频 语音 口播 字幕 06 144 ai-audio'],
  [/质检|qa|黑场|响度|抽帧/i, 'frame-qa directorx-methodology 成片质检 时长 画幅 174'],
  [/可灵|kling/i, 'kling-prompt-copilot 114 115'],
  [/即梦|seedance/i, 'seedance-2-prompt-copilot 114 115'],
  [/minimax|海螺|\bh3\b/i, 'minimax-h3-prompt-copilot 114 115'],
  [/王家卫|韦斯|安德森|赛博朋克|风格/i, 'cinematic-style 126 01 09'],
  [/接入模型|新模型|apidoc|provider/i, 'directorx-provider-onboard'],
  [/同一系列|系列包|沿用设定|下一集/i, 'directorx-series-craft 角色锚 风格锁 117 123'],
  [/场面控制|场面锁|作战板|完全控制|单镜长拍|空间台账/i, 'directorx-blocking-craft 连续性 空间 117 123'],
  [/改这一镜|再生动|只改这/i, 'directorx-series-craft directorx-chengpian 117'],
  [/预告片|片花|热血漫|日漫/i, 'trailer-craft cinematic-style 151 205 钩子 硬切'],
  [/成片|开拍|导演/i, 'directorx-chengpian directorx-production-lead directorx-methodology 07 115'],
  [/提示词|prompt/i, 'video-prompt-builder 115 130 01'],
  [/版权|专名|商标|肖像权|改写提示词/i, '213 copyright-safe-prompting 泛化 负向排除'],
  [/编排|成片流程|制片/i, 'directorx-chengpian directorx-production-lead 07 115 213'],
  [/追逐|追车|飞车|追捕|chase/i, '追逐 追车 速度感 401'],
  [/悬疑|推理|谜案|解谜|mystery|whodunit/i, '悬疑 推理 悬念 402 268 289'],
  [/浪漫|爱情|情感戏|亲密|romance|love scene/i, '浪漫 爱情 情感 亲密 403'],
  [/史诗|宏大|大场面|千军万马|战争|epic|scale/i, '史诗 宏大 大场面 战争 404 201'],
  [/视觉引导|视线引导|画面层次|depth|leading.?eye/i, '视觉引导 视线 层次 405 216'],
  [/镜头情绪|情绪镜头|camera.?emotion|镜头语言情绪/i, '镜头 情绪 景别 406 231'],
]

export const SKILL_ARTICLES: Record<string, string[]> = {
  'directorx-methodology': ['01', '02', '07', '123', '127', '213', '401', '402', '403', '404', '405', '406', '409', '410'],
  'directorx-production-lead': ['114', '115', '121'],
  'directorx-chengpian': ['115', '07', '01'],
  'directorx-playbook': ['114', '115', '158'],
  'novel-characters': ['04', '117', '123', '226'],
  'novel-outline': ['03', '101', '150'],
  'novel-script': ['03', '101', '159'],
  'novel-storyboard': ['172', '01', '109', '401', '404'],
  'novel-art': ['126', '228', '226'],
  'storyboard-craft': ['172', '01', '109', '401', '404', '405'],
  'trailer-craft': ['151', '205', '188', '01'],
  'directorx-series-craft': ['117', '123', '01', '408'],
  'directorx-blocking-craft': ['117', '123', '116', '408'],
  'editing-workflow': ['02', '127', '15'],
  'frame-qa': ['174', '118', '111'],
  'video-prompt-builder': ['115', '130', '158', '01', '213', '407'],
  'video-prompt-reverse': ['159', '115', '103'],
  'kling-prompt-copilot': ['114', '115'],
  'seedance-2-prompt-copilot': ['114', '115'],
  'seedance-2-5-prompt-copilot': ['114', '115'],
  'minimax-h3-prompt-copilot': ['114', '115'],
  'gpt-image2-prompt-copilot': ['115', '221'],
  'banana-prompt-copilot': ['115', '223'],
  'cinematic-style': ['126', '01', '09', '405', '406'],
  'continuous-video': ['116', '117', '123', '407', '408'],
  'caption-localization': ['63', '06'],
  'ai-audio': ['06', '144', '119'],
  'audio-sound': ['06', '144', '23'],
  'platform-specs': ['112', '142'],
  'thumbnail-cover': ['205', '16'],
  'script-writing': ['03', '101'],
  'short-video': ['05', '142', '188'],
  'vfx-compositing': ['128', '110'],
  'shot-recipes': ['01', '02', '07', '124', '401', '402', '403', '404', '405', '406', '409', '410'],
}

const MODE_ARTICLES: Record<string, string[]> = {
  onboard: ['114'],
  edit: ['02', '127', '141'],
  character: ['04', '117', '123'],
  script: ['03', '101', '172'],
  canvas: ['172', '01', '109'],
  qa: ['174', '118'],
  style: ['126', '01', '09'],
  generate: ['115', '01', '116', '213'],
  research: ['07', '115'],
}

let articleSkills: Map<string, string[]> | undefined

function unique(items: string[]): string[] {
  return [...new Set(items.filter(item => item !== ''))]
}

export function expandCraftQuery(query: string): string {
  let extra = ''
  for (const [pattern, words] of CRAFT_SYNONYMS) {
    if (pattern.test(query)) extra += ` ${words}`
  }
  return `${query} ${extra}`.trim()
}

export function articlesForSkill(name: string): string[] {
  return SKILL_ARTICLES[name] ?? []
}

export function skillsForArticle(id: string): string[] {
  if (articleSkills === undefined) {
    articleSkills = new Map()
    for (const [skill, ids] of Object.entries(SKILL_ARTICLES)) {
      for (const article of ids) {
        const list = articleSkills.get(article) ?? []
        list.push(skill)
        articleSkills.set(article, list)
      }
    }
  }
  return articleSkills.get(id) ?? []
}

export function articlesForSkills(names: string[]): string[] {
  return unique(names.flatMap(name => articlesForSkill(name)))
}

export function articlesForMode(mode: string): string[] {
  return MODE_ARTICLES[mode] ?? []
}
