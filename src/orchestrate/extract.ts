import type { ProductionEntities, ProductionKind } from './types.ts'

export function parseDurationSeconds(request: string): number | undefined {
  if (/半\s*个?\s*小时/.test(request)) return 1800
  const hour = request.match(/(\d+(?:\.\d+)?)\s*小时/)
  if (hour) return Math.round(Number(hour[1]) * 3600)
  const minute = request.match(/([一二三四五六七八九十两\d]+)\s*分钟/)
  if (minute) return chineseOrArabic(minute[1]) * 60
  const second = request.match(/(\d+)\s*秒/)
  if (second) return Number(second[1])
  return undefined
}

function chineseOrArabic(raw: string): number {
  if (/^\d+$/.test(raw)) return Number(raw)
  const digits: Record<string, number> = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }
  if (raw === '十') return 10
  if (raw.startsWith('十')) return 10 + (digits[raw.slice(1)] ?? 0)
  if (raw.endsWith('十') && raw.length === 2) return (digits[raw[0] ?? ''] ?? 0) * 10
  if (raw.includes('十')) {
    const [tens, ones] = raw.split('十')
    return (digits[tens ?? ''] ?? 1) * 10 + (digits[ones ?? ''] ?? 0)
  }
  return digits[raw] ?? 0
}

export function inferProductionKind(request: string): ProductionKind {
  const text = request.trim()
  const score = (keywords: string[]): number => keywords.reduce((sum, word) => sum + (text.includes(word) ? 1 : 0), 0)
  const remake = score(['拉片', '复刻', '对帧', '替换', '换成', '主体替换'])
  const literary = score(['改编', '小说', '名著', '网文', '电视剧', '剧本'])
  const promo = score(['宣传片', '广告', '品牌', '推广', 'promo'])
  const narrative = score(['短剧', '分镜', '成片', '故事', '剧情'])
  const ranked: Array<{ kind: ProductionKind; hits: number }> = [
    { kind: 'remake', hits: remake },
    { kind: 'literary', hits: literary },
    { kind: 'promo', hits: promo },
    { kind: 'narrative', hits: narrative },
  ]
  ranked.sort((a, b) => b.hits - a.hits)
  if ((ranked[0]?.hits ?? 0) === 0) return 'narrative'
  return ranked[0]!.kind
}

export function extractEntities(request: string, kind: ProductionKind, fallbackSeconds: number, aspectRatio: string): ProductionEntities {
  const text = request.trim()
  const targetSeconds = parseDurationSeconds(text) ?? fallbackSeconds
  const entities: ProductionEntities = { targetSeconds, aspectRatio }

  const brandProduct = text.match(/[为给](.+?)的(.+?)制作/) ?? text.match(/[为给](.+?)做(.+?)宣传/)
  if (brandProduct) {
    entities.brand = brandProduct[1]?.trim()
    entities.product = brandProduct[2]?.replace(/品牌|宣传片|广告片/g, '').trim()
  }

  const novel = text.match(/改编(.+?)的小说(.+?)为/) ?? text.match(/改编(.+?)的(.+?)为/)
  if (novel) {
    entities.author = novel[1]?.replace(/小说/g, '').trim()
    entities.sourceTitle = novel[2]?.replace(/为.+$/, '').trim()
  }
  const titled = text.match(/[《「](.+?)[》」]/)
  if (titled && !entities.sourceTitle) entities.sourceTitle = titled[1]

  const sourceClip = text.match(/拉片分析(.+?)(?:并且|并把|，|。|$)/)
  if (sourceClip) entities.sourceClip = sourceClip[1]?.trim()
  const swapped = text.match(/主体替换为(.+?)进行/)
    ?? text.match(/替换为(.+?)进行/)
    ?? text.match(/替换成(.{1,24}?)(?:进行|复刻|$)/)
    ?? text.match(/换成(.{1,16}?)(?:进行|复刻|$)/)
  if (swapped) entities.replaceSubject = swapped[1]?.trim()

  if (text.includes('电视剧')) entities.format = '电视剧'
  else if (text.includes('短剧')) entities.format = '短剧'
  else if (text.includes('宣传片')) entities.format = '宣传片'
  else if (kind === 'remake') entities.format = '复刻片'
  else if (kind === 'literary') entities.format = '改编剧'
  else if (kind === 'promo') entities.format = '宣传片'

  return entities
}

export function slugify(value: string): string {
  const compact = value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')
  return compact.slice(0, 40) || 'subject'
}
