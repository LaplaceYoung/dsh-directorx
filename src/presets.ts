import { routeModel, type RouteResult } from './model-matrix.ts'

/**
 * 生成参数预设包：画幅 × 时长 × 运镜 × 风格的最佳匹配表，并与模型
 * 能力路由联动（每个预设给出该参数组合下 eligible 模型）。
 * 依据：规则 59（时长是参数）、62（画幅先定）、10/17（节奏）、
 * 30/36（运镜词表与反单调）。
 */

export interface GenerationPreset {
  slug: string
  label: string
  aspectRatio: string
  durationRange: [number, number]
  /** 推荐运镜（安全词表优先；数组顺序 = 轮换顺序防反单调）。 */
  cameraMoves: string[]
  /** 风格语法预设 slug（directorx_style 语法四件套）。 */
  styleSlug: string
  rules: string[]
  models: RouteResult
}

const PRESET_TABLE: Array<Omit<GenerationPreset, 'models'>> = [
  {
    slug: 'douyin-oral', label: '抖音口播', aspectRatio: '9:16', durationRange: [5, 10],
    cameraMoves: ['static', 'push_in', 'pan', 'static'],
    styleSlug: 'commercial',
    rules: ['规则 62 竖屏运镜：推拉/仰俯安全，横移跟拍禁用', '规则 59 时长写参数不写提示词', '规则 21 口播 4 字每秒预算'],
  },
  {
    slug: 'xiaohongshu-mix', label: '小红书混剪', aspectRatio: '3:4', durationRange: [2, 5],
    cameraMoves: ['static', 'tilt', 'parallax', 'element', 'static'],
    styleSlug: 'cyberpunk',
    rules: ['规则 10 卡点时长分配表：重音 0.5-1s', '规则 17 cut-on-beat/cut-on-breath 交替', '规则 85 小红书封面 1:1 安全区'],
  },
  {
    slug: 'bilibili-long', label: 'B站中长视频', aspectRatio: '16:9', durationRange: [8, 15],
    cameraMoves: ['static', 'pan', 'tilt', 'parallax', 'static'],
    styleSlug: 'documentary',
    rules: ['规则 50 三幕 20/60/20（中视频）', '规则 51 知识类热快启动开场', '规则 36 ASL 4-6s 日常节奏'],
  },
  {
    slug: 'ads-vertical', label: '广告竖屏', aspectRatio: '9:16', durationRange: [3, 8],
    cameraMoves: ['push_in', 'orbit', 'push_in'],
    styleSlug: 'commercial',
    rules: ['规则 70 广告开场给结果再倒叙', '规则 71 只变一个变量的 A/B 纪律', '规则 26 负面四类基线'],
  },
  {
    slug: 'drama-horizontal', label: '剧情横屏', aspectRatio: '16:9', durationRange: [5, 10],
    cameraMoves: ['parallax', 'tilt', 'push_in', 'pull_out', 'static'],
    styleSlug: 'cinematic',
    rules: ['规则 36 景别推进序列', '规则 37 运镜动机律', '规则 52 Setup-Payoff 配对表'],
  },
  {
    slug: 'mv', label: 'MV/音乐', aspectRatio: '9:16', durationRange: [2, 6],
    cameraMoves: ['parallax', 'push_in', 'element', 'tilt', 'static'],
    styleSlug: 'wong-kar-wai',
    rules: ['规则 10 卡点分配表', '规则 24 卡点层级表：鼓点=快切', '规则 57 音乐三支柱'],
  },
]

/** 预设解析：按 slug 取预设并联动模型路由（时长取区间中值、音频默认关）。 */
export function generationPreset(slug: string): GenerationPreset | null {
  const preset = PRESET_TABLE.find(entry => entry.slug === slug)
  if (preset === undefined) return null
  const mid = Math.round((preset.durationRange[0] + preset.durationRange[1]) / 2)
  const models = routeModel({ durationSec: mid, aspectRatio: preset.aspectRatio })
  return { ...preset, models }
}

export function listPresets(): Array<{ slug: string; label: string; aspectRatio: string; durationRange: [number, number] }> {
  return PRESET_TABLE.map(({ slug, label, aspectRatio, durationRange }) => ({ slug, label, aspectRatio, durationRange }))
}
