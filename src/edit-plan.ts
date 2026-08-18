export type EditRoute =
  | 'studio'
  | 'image-edit'
  | 'video-process'
  | 'nl-cut'
  | 'timeline'
  | 'smart-cut'
  | 'concat'
  | 'qc'
  | 'ask'
  | 'regenerate-blocked'

export interface EditPlan {
  route: EditRoute
  tool: string
  reason: string
  args: Record<string, unknown>
  warnings: string[]
  next: string[]
}

const GRADE = /调色|色调|配色|滤镜|grade|look|lut|末日荒土|漂白|交叉冲印|夜色|金黄昏|打开编辑台|编辑台|精修台/
const IMAGE_GEOM = /旋转|翻转|镜像|裁切|裁剪|缩放|放大|缩小|hflip|vflip|rotate|crop|resize/
const VIDEO_PROC = /去掉开头|去掉结尾|只保留|变速|放慢|加快|静音|倒放|定格|freeze|trim|speed|mute|reverse|裁掉前|裁掉后/
const NL_CUT = /剪辑指令|按这些剪|多条指令|cut list/
const CONCAT = /拼接|接上|串起来|concat|叠化|硬切成片|多镜组装/
const SMART = /精剪|按脚本剪|口播剪|对字幕剪|smart.?cut/
const QC = /质检|抽帧看|看看成片|检查成片|\bqa\b|对照提示词/
const REGEN = /重绘|重新生成|再生成一张|换个画面|重新出图|重新出片|regen/
const STUDIO_OPEN = /打开编辑台|打开编辑器|打开工作室|open.?studio/

function parseRotate(text: string): 90 | 180 | 270 | undefined {
  if (/270|逆时针/.test(text)) return 270
  if (/180|倒过来|上下颠倒/.test(text)) return 180
  if (/90|顺时针|右转/.test(text)) return 90
  if (/旋转/.test(text)) return 90
  return undefined
}

function parseGeomArgs(text: string): Record<string, unknown> {
  const args: Record<string, unknown> = {}
  const rotate = parseRotate(text)
  if (rotate !== undefined && /旋转|倒过来|颠倒|顺时针|逆时针/.test(text)) args.rotate = rotate
  if (/水平翻转|左右翻转|镜像|hflip/.test(text)) args.hflip = true
  if (/垂直翻转|上下翻转|vflip/.test(text) && args.rotate === undefined) args.vflip = true
  const crop = text.match(/(\d+)\s*[:x×]\s*(\d+)\s*[@＋+]\s*(\d+)\s*[,，]\s*(\d+)/)
  if (crop !== null) args.crop = `${crop[1]}:${crop[2]}:${crop[3]}:${crop[4]}`
  const scale = text.match(/缩[放到]\s*(\d+)\s*[:x×]\s*(\d+)/)
  if (scale !== null) args.scale = `${scale[1]}:${scale[2]}`
  return args
}

function parseVideoArgs(text: string): Record<string, unknown> {
  const args = parseGeomArgs(text)
  const head = text.match(/(?:去掉|裁掉|剪掉).*?(?:开头|前面|前)\s*(\d+(?:\.\d+)?)\s*秒/)
    ?? text.match(/(?:开头|前面|前)\s*(\d+(?:\.\d+)?)\s*秒.*(?:去掉|裁掉|剪掉)/)
  if (head !== null) args.start = Number(head[1])
  const keep = text.match(/(?:只保留|只留|保留)\s*(\d+(?:\.\d+)?)\s*(?:到|至|-|~)\s*(\d+(?:\.\d+)?)\s*秒/)
  if (keep !== null) {
    args.start = Number(keep[1])
    args.end = Number(keep[2])
  }
  if (/静音|mute/.test(text)) args.mute = true
  if (/倒放|反向播放|reverse/.test(text)) args.reverse = true
  const freeze = text.match(/定格\s*(\d+(?:\.\d+)?)\s*秒/)
  if (freeze !== null) args.freezeEnd = Number(freeze[1])
  const speed = text.match(/(?:放慢|减速)\s*(\d+(?:\.\d+)?)/)
  if (speed !== null) {
    const value = Number(speed[1])
    args.speed = value > 1 ? 1 / value : value
  }
  const faster = text.match(/(?:加快|加速|变速)\s*(\d+(?:\.\d+)?)/)
  if (faster !== null && args.speed === undefined) args.speed = Number(faster[1])
  return args
}

export function planEdit(input: {
  intent: string
  kind?: 'image' | 'video'
  nodeId?: string
  path?: string
}): EditPlan {
  const intent = input.intent.trim()
  let kind = input.kind
  if (kind === undefined) {
    if (/照片|图片|这张图|静帧|设定图/.test(intent) && !/视频|片子/.test(intent)) kind = 'image'
    else if (/视频|片子|这镜|成片/.test(intent) && !/照片|图片|设定图/.test(intent)) kind = 'video'
  }
  const nodeId = input.nodeId
  const path = input.path
  const bind = {
    ...(nodeId !== undefined && nodeId !== '' ? { nodeId } : {}),
    ...(path !== undefined && path !== '' ? { path } : {}),
  }
  const warnings: string[] = []
  const next: string[] = []

  if (intent === '') {
    return {
      route: 'ask',
      tool: 'directorx_ask',
      reason: '没有编辑意图，先问要调色、裁切、旋转还是剪辑。',
      args: {},
      warnings,
      next: ['directorx_ask'],
    }
  }

  if (REGEN.test(intent) && !GRADE.test(intent) && !IMAGE_GEOM.test(intent) && !VIDEO_PROC.test(intent)) {
    return {
      route: 'regenerate-blocked',
      tool: '',
      reason: '这是改画面内容，不是确定性编辑。必须走 knowledge/skill → prompt_craft → generate_ready → generate，不能用剪辑工具冒充重绘。',
      args: {},
      warnings: ['不要用 studio / image_edit / video_process 完成「换个画面」。'],
      next: ['directorx_knowledge_search', 'directorx_prompt_craft', 'directorx_generate_ready'],
    }
  }

  if (QC.test(intent)) {
    return {
      route: 'qc',
      tool: 'directorx_extract_frames',
      reason: '先抽帧再看图像素，对照提示词和连续性。',
      args: { ...bind, ...(path !== undefined ? { source: path } : {}) },
      warnings,
      next: ['directorx_view_image', 'directorx_qa'],
    }
  }

  if (SMART.test(intent)) {
    return {
      route: 'smart-cut',
      tool: 'directorx_smart_cut',
      reason: '口播/按脚本精剪：转写字幕后按句子匹配窗口。',
      args: { ...bind, ...(path !== undefined ? { video: path } : {}) },
      warnings: kind === 'image' ? ['当前节点是图片，精剪需要视频。'] : [],
      next: ['directorx_transcribe_audio', 'directorx_smart_cut'],
    }
  }

  if (CONCAT.test(intent)) {
    return {
      route: 'concat',
      tool: 'directorx_video_concat',
      reason: '多段素材组装成片，优先硬切或叠化，不重新生成。',
      args: { ...bind },
      warnings,
      next: ['directorx_canvas_shot_order', 'directorx_video_concat', 'directorx_qa'],
    }
  }

  if (GRADE.test(intent) || STUDIO_OPEN.test(intent)) {
    const openOnly = STUDIO_OPEN.test(intent) && !/调色|色调|配色|滤镜|荒土|漂白|冲印|夜色|黄昏/.test(intent)
    return {
      route: 'studio',
      tool: 'directorx_studio',
      reason: openOnly ? '只打开编辑台，不改像素。' : '自然语言调色走 ffmpeg 配方，回写节点并打开编辑台。',
      args: { prompt: intent, ...bind, ...(openOnly ? { openOnly: true } : {}) },
      warnings,
      next: openOnly ? [] : ['directorx_extract_frames', 'directorx_view_image'],
    }
  }

  if (kind === 'image' && (IMAGE_GEOM.test(intent) || VIDEO_PROC.test(intent))) {
    const args = parseGeomArgs(intent)
    return {
      route: 'image-edit',
      tool: 'directorx_image_edit',
      reason: '图片几何/明暗用 ffmpeg 本地处理，不重绘。',
      args: { ...bind, ...args },
      warnings: Object.keys(args).length === 0 ? ['意图里没解析出具体参数，调用前补 rotate/hflip/crop/scale。'] : [],
      next: ['directorx_view_image'],
    }
  }

  if (NL_CUT.test(intent) || (kind !== 'image' && /去掉|只保留|放慢|加快|倒放/.test(intent) && /秒|倍/.test(intent) && /；|;|。|,|，/.test(intent))) {
    const edits = intent.split(/[；;。]+/).map(part => part.trim()).filter(part => part !== '')
    return {
      route: 'nl-cut',
      tool: 'directorx_edit',
      reason: '多条人话剪辑指令解析成 cut list 再渲染。',
      args: { ...bind, ...(path !== undefined ? { video: path } : {}), edits },
      warnings: kind === 'image' ? ['当前节点是图片，剪辑需要视频。'] : [],
      next: ['directorx_extract_frames', 'directorx_view_image'],
    }
  }

  if (kind === 'video' || (kind === undefined && (VIDEO_PROC.test(intent) || IMAGE_GEOM.test(intent)))) {
    const args = parseVideoArgs(intent)
    return {
      route: 'video-process',
      tool: 'directorx_video_process',
      reason: '单段视频用 video_process 精确裁剪/变速/翻转/定格。',
      args: { ...bind, ...(path !== undefined ? { source: path } : {}), ...args },
      warnings: Object.keys(args).length === 0 ? ['没解析出参数，调用前补 start/end/speed/rotate。'] : [],
      next: ['directorx_probe_media', 'directorx_extract_frames'],
    }
  }

  if (/时间线|timeline|转场|混音成片/.test(intent)) {
    return {
      route: 'timeline',
      tool: 'directorx_timeline',
      reason: '多场景时间线渲染（裁剪/转场/混音/字幕）。',
      args: { ...bind },
      warnings,
      next: ['directorx_timeline', 'directorx_qa'],
    }
  }

  warnings.push('意图不够具体，先用提问卡确认要调色、裁切还是剪辑。')
  next.push('directorx_ask')
  return {
    route: 'ask',
    tool: 'directorx_ask',
    reason: '无法从这句话判定编辑路线。',
    args: bind,
    warnings,
    next,
  }
}
