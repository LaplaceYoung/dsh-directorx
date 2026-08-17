/** Shared grade catalog: ffmpeg recipes + CSS previews. No Node APIs. */

export const GRADE_LOOKS = [
  'wasteland',
  'teal-orange',
  'bleach-bypass',
  'cyber',
  'film-fade',
  'vintage',
  'kodachrome',
  'portra',
  'cross-process',
  'color-negative',
  'bw-contrast',
  'muted',
  'night',
  'cold',
  'warm',
  'golden',
] as const

export type GradeLook = (typeof GRADE_LOOKS)[number]
export type GradeFamily = 'cinema' | 'film' | 'tone'

export interface GradeLookSpec {
  id: GradeLook
  label: string
  family: GradeFamily
  vf: string
  css: string
  pattern: RegExp
  source: string
}

export const GRADE_FAMILIES: Array<{ id: GradeFamily; label: string }> = [
  { id: 'cinema', label: '电影' },
  { id: 'film', label: '胶片' },
  { id: 'tone', label: '影调' },
]

export const GRADE_TABLE: Record<GradeLook, GradeLookSpec> = {
  wasteland: {
    id: 'wasteland',
    label: '荒土',
    family: 'cinema',
    vf: "format=yuv420p10le,colorbalance=rs=0.16:gs=0.05:bs=-0.18:rh=0.14:gh=0.02:bh=-0.12,eq=contrast=1.16:saturation=0.68:brightness=-0.05:gamma=1.08,vignette=angle=PI/6,format=yuv420p",
    css: 'sepia(0.38) saturate(0.72) contrast(1.16) brightness(0.94) hue-rotate(-14deg)',
    pattern: /末日|荒土|废土|黄沙|沙尘|dust|wasteland|desert|apocalyp/i,
    source: 'DirectorX 36-color-luts 战争/末日条',
  },
  'teal-orange': {
    id: 'teal-orange',
    label: '青橙',
    family: 'cinema',
    vf: 'format=yuv420p10le,colorbalance=rs=-0.12:gs=0.06:bs=0.12:rh=0.12:gh=0.03:bh=-0.12:rm=0.03:bm=-0.03,eq=contrast=1.08:saturation=1.2,format=yuv420p',
    css: 'saturate(1.18) contrast(1.08) hue-rotate(8deg)',
    pattern: /青橙|teal|orange|好莱坞/i,
    source: '36-color-luts 青橙 + Pixflow 公开教程',
  },
  'bleach-bypass': {
    id: 'bleach-bypass',
    label: '漂白',
    family: 'cinema',
    vf: 'format=yuv420p10le,eq=saturation=0.42:contrast=1.38:brightness=-0.04:gamma=1.06,colorbalance=bs=0.06:rs=-0.04:bh=0.04,curves=preset=strong_contrast,format=yuv420p',
    css: 'grayscale(0.35) contrast(1.32) saturate(0.55) brightness(0.96)',
    pattern: /漂白|bypass|银盐|skip.?bleach/i,
    source: '36-color-luts 漂白旁路 + FFmpeg curves=strong_contrast',
  },
  cyber: {
    id: 'cyber',
    label: '霓虹',
    family: 'cinema',
    vf: 'format=yuv420p10le,colorbalance=bs=0.16:rs=-0.08:rh=0.14:bh=-0.06:gm=-0.04:bm=0.08,eq=contrast=1.18:saturation=1.35:gamma=0.98,format=yuv420p',
    css: 'saturate(1.42) contrast(1.18) hue-rotate(-12deg) brightness(1.02)',
    pattern: /赛博|霓虹|cyber|neon|品红青|品红/i,
    source: 'yeun/open-color MIT 青/粉锚 + chromotome MIT 霓虹板气质',
  },
  'film-fade': {
    id: 'film-fade',
    label: '胶片',
    family: 'film',
    vf: "format=yuv420p10le,curves=master='0/0.05 0.2/0.24 0.6/0.58 1/0.96':interp=pchip,eq=saturation=0.85:gamma=1.05,colorbalance=rh=0.06:bh=-0.05,vignette=angle=PI/7,noise=alls=5:allf=t+u,format=yuv420p",
    css: 'sepia(0.18) saturate(0.86) contrast(1.05) brightness(1.02)',
    pattern: /胶片|褪色|film.?fade|fade.?film/i,
    source: '36-color-luts 胶片模拟',
  },
  vintage: {
    id: 'vintage',
    label: '复古',
    family: 'film',
    vf: 'format=yuv420p10le,curves=preset=vintage,eq=saturation=0.82:gamma=1.06,vignette=angle=PI/6,noise=alls=6:allf=t+u,format=yuv420p',
    css: 'sepia(0.32) saturate(0.78) contrast(1.08) brightness(1.04)',
    pattern: /vintage|复古|怀旧|老照片/i,
    source: 'FFmpeg libavfilter curves=preset=vintage（运行时，不捆绑源码）',
  },
  kodachrome: {
    id: 'kodachrome',
    label: '克罗姆',
    family: 'film',
    vf: 'format=yuv420p10le,colorbalance=rs=0.1:rh=0.12:bs=-0.06:bh=0.08:gs=-0.02,eq=contrast=1.22:saturation=1.28:gamma=0.96,curves=preset=increase_contrast,format=yuv420p',
    css: 'saturate(1.28) contrast(1.2) brightness(0.98) hue-rotate(-6deg)',
    pattern: /kodachrome|克罗姆|柯达正片|velvia|正片/i,
    source: 'colour-science/colour BSD-3 正片特征近似，非商标胶片拷贝',
  },
  portra: {
    id: 'portra',
    label: '人像负片',
    family: 'film',
    vf: "format=yuv420p10le,curves=master='0/0.04 0.25/0.28 0.6/0.62 1/0.97':interp=pchip,colorbalance=rs=0.08:gs=0.04:bs=-0.04:rh=0.06:gh=0.02,eq=saturation=0.92:contrast=0.98:gamma=1.04,format=yuv420p",
    css: 'saturate(0.92) contrast(0.98) brightness(1.04) sepia(0.08)',
    pattern: /portra|波特拉|人像胶片|人像负片|肤色胶片/i,
    source: 'colour-science/colour BSD-3 负片肤色倾向近似；Film-Luts MIT 气质对照（未捆绑 .cube）',
  },
  'cross-process': {
    id: 'cross-process',
    label: '交叉冲印',
    family: 'film',
    vf: 'format=yuv420p10le,curves=preset=cross_process,eq=saturation=1.12:contrast=1.08,format=yuv420p',
    css: 'saturate(1.2) contrast(1.1) hue-rotate(-18deg)',
    pattern: /交叉冲印|cross.?process|冲印/i,
    source: 'FFmpeg curves=preset=cross_process + 36-color-luts 交叉冲印条',
  },
  'color-negative': {
    id: 'color-negative',
    label: '负片',
    family: 'film',
    vf: 'format=yuv420p10le,curves=preset=color_negative,eq=contrast=1.05,format=yuv420p',
    css: 'invert(1) hue-rotate(180deg) contrast(1.05)',
    pattern: /负片|color.?negative|invert|反相|底片/i,
    source: 'FFmpeg curves=preset=color_negative',
  },
  'bw-contrast': {
    id: 'bw-contrast',
    label: '黑白',
    family: 'film',
    vf: 'format=yuv420p10le,hue=s=0,curves=preset=strong_contrast,eq=contrast=1.15:brightness=-0.02,noise=alls=4:allf=t,format=yuv420p',
    css: 'grayscale(1) contrast(1.18) brightness(0.98)',
    pattern: /黑白|noir|mono|grayscale|b\s*[&\/]\s*w/i,
    source: 'FFmpeg curves=preset=strong_contrast + hue=s=0',
  },
  muted: {
    id: 'muted',
    label: '低饱和',
    family: 'tone',
    vf: 'format=yuv420p10le,eq=saturation=0.55:contrast=0.96:brightness=0.02:gamma=1.04,colorbalance=rs=0.03:bs=0.02,format=yuv420p',
    css: 'saturate(0.58) contrast(0.96) brightness(1.02)',
    pattern: /低饱和|muted|desat|去饱和|淡彩|北欧|冷淡/i,
    source: '36-color-luts 低饱和条 + d3 ColorBrewer 低彩序列气质',
  },
  night: {
    id: 'night',
    label: '夜色',
    family: 'tone',
    vf: 'format=yuv420p10le,colorbalance=bs=0.18:gs=0.04:rs=-0.14:bh=0.1:rh=-0.08,eq=contrast=1.12:saturation=0.78:brightness=-0.08:gamma=1.08,format=yuv420p',
    css: 'saturate(0.78) contrast(1.12) brightness(0.88) hue-rotate(196deg)',
    pattern: /夜色|月光|夜景|night|moonlight|深夜/i,
    source: 'yeun/open-color MIT indigo/blue 锚',
  },
  cold: {
    id: 'cold',
    label: '冷调',
    family: 'tone',
    vf: 'format=yuv420p10le,colorbalance=bs=0.14:gs=0.04:rs=-0.1:bh=0.08:rh=-0.06,eq=contrast=1.06:saturation=0.9:gamma=1.04,format=yuv420p',
    css: 'saturate(0.9) contrast(1.06) hue-rotate(168deg) brightness(1.02)',
    pattern: /冷调|冷色|青冷|steel|cyan|ice/i,
    source: '36-color-luts 冷科技条',
  },
  warm: {
    id: 'warm',
    label: '暖调',
    family: 'tone',
    vf: 'format=yuv420p10le,colorbalance=rs=0.12:gs=0.04:bs=-0.1:rh=0.1:bh=-0.06,eq=contrast=1.05:saturation=1.08:gamma=1.03,format=yuv420p',
    css: 'sepia(0.16) saturate(1.08) contrast(1.05) brightness(1.03) hue-rotate(-8deg)',
    pattern: /暖调|暖色|warm/i,
    source: '36-color-luts 暖记忆条',
  },
  golden: {
    id: 'golden',
    label: '金黄昏',
    family: 'tone',
    vf: 'format=yuv420p10le,colorbalance=rs=0.16:gs=0.08:bs=-0.14:rh=0.14:gh=0.04:bh=-0.1,eq=contrast=1.08:saturation=1.12:gamma=1.04:brightness=0.03,format=yuv420p',
    css: 'sepia(0.22) saturate(1.16) contrast(1.08) brightness(1.06) hue-rotate(-12deg)',
    pattern: /金色|黄昏|golden|sunset|magic.?hour|黄金时刻|日落/i,
    source: 'yeun/open-color MIT yellow/orange 锚 + 36-color-luts 暖记忆',
  },
}

export const GRADE_LOOK_LIST: GradeLookSpec[] = GRADE_LOOKS.map(id => GRADE_TABLE[id])

/** Longer / more specific phrases first so 「人像胶片」≠ 普通胶片. */
export const GRADE_ALIASES: Array<{ look: GradeLook; pattern: RegExp }> = [
  { look: 'bleach-bypass', pattern: GRADE_TABLE['bleach-bypass'].pattern },
  { look: 'cross-process', pattern: GRADE_TABLE['cross-process'].pattern },
  { look: 'portra', pattern: GRADE_TABLE.portra.pattern },
  { look: 'kodachrome', pattern: GRADE_TABLE.kodachrome.pattern },
  { look: 'color-negative', pattern: GRADE_TABLE['color-negative'].pattern },
  { look: 'teal-orange', pattern: GRADE_TABLE['teal-orange'].pattern },
  { look: 'wasteland', pattern: GRADE_TABLE.wasteland.pattern },
  { look: 'vintage', pattern: GRADE_TABLE.vintage.pattern },
  { look: 'cyber', pattern: GRADE_TABLE.cyber.pattern },
  { look: 'golden', pattern: GRADE_TABLE.golden.pattern },
  { look: 'night', pattern: GRADE_TABLE.night.pattern },
  { look: 'muted', pattern: GRADE_TABLE.muted.pattern },
  { look: 'bw-contrast', pattern: GRADE_TABLE['bw-contrast'].pattern },
  { look: 'film-fade', pattern: GRADE_TABLE['film-fade'].pattern },
  { look: 'cold', pattern: GRADE_TABLE.cold.pattern },
  { look: 'warm', pattern: GRADE_TABLE.warm.pattern },
]

export function isGradeLook(value: string): value is GradeLook {
  return (GRADE_LOOKS as readonly string[]).includes(value)
}

export function listGradeLabels(): string {
  return GRADE_LOOK_LIST.map(item => item.label).join(' / ')
}

export function looksByFamily(family: GradeFamily): GradeLookSpec[] {
  return GRADE_LOOK_LIST.filter(item => item.family === family)
}

export function gradeCss(look: GradeLook): string {
  return GRADE_TABLE[look].css
}
