/** Context-menu catalogs for the canvas. One open menu, kind-specific rows. */

export type AddMode = 'quick' | 'full'
export type AddKind = 'image' | 'video' | 'text' | 'script' | 'group' | 'upload' | 'assets' | 'edit-image' | 'edit-video' | 'paste'

export type MenuSectionId = 'create' | 'import' | 'primary' | 'craft' | 'edit' | 'arrange' | 'danger'

export interface MenuRow {
  id: string
  label: string
  section: MenuSectionId
  kbd?: string
  danger?: boolean
}

export interface NodeMenuSurface {
  type: 'media' | 'text' | 'group'
  kind?: 'image' | 'video'
  hasPath: boolean
  locked: boolean
  canAssemble: boolean
  selectedCount: number
  canPack?: boolean
  canSheet?: boolean
  canJoin?: boolean
  canStack?: boolean
  canUngroup?: boolean
}

export const SECTION_LABEL: Record<MenuSectionId, string> = {
  create: '添加节点',
  import: '导入',
  primary: '',
  craft: '工具',
  edit: '编辑',
  arrange: '排列',
  danger: '',
}

export function addMenuRows(mode: AddMode): MenuRow[] {
  const create: MenuRow[] = [
    { id: 'image', label: '图片', section: 'create' },
    { id: 'video', label: '视频', section: 'create' },
    { id: 'text', label: '文本', section: 'create' },
    { id: 'script', label: '剧本', section: 'create' },
    { id: 'group', label: '编组', section: 'create' },
  ]
  if (mode === 'quick') return create
  return [
    ...create,
    { id: 'edit-image', label: '编辑图片', section: 'import' },
    { id: 'edit-video', label: '编辑视频', section: 'import' },
    { id: 'upload', label: '上传文件', section: 'import' },
    { id: 'assets', label: '从资源库添加', section: 'import' },
    { id: 'paste', label: '粘贴', section: 'import', kbd: '⌘V' },
  ]
}

export function nodeMenuRows(surface: NodeMenuSurface): MenuRow[] {
  if (surface.selectedCount > 1) return multiMenuRows(surface)
  if (surface.type === 'group') {
    return [
      { id: 'ungroup', label: '取消编组', section: 'edit' },
      { id: 'lock', label: surface.locked ? '解锁' : '锁定', section: 'edit', kbd: 'L' },
      { id: 'delete', label: '删除', section: 'danger', kbd: '⌫', danger: true },
    ]
  }
  const rows: MenuRow[] = []
  if (surface.type === 'text') {
    rows.push({ id: 'script', label: '生成分镜', section: 'primary' })
  }
  if (surface.type === 'media') {
    rows.push({ id: 'generate', label: '生成', section: 'primary', kbd: 'G' })
    if (surface.hasPath) rows.push({ id: 'edit', label: '编辑', section: 'primary', kbd: 'E' })
  } else {
    rows.push({ id: 'generate', label: '生成', section: 'primary', kbd: 'G' })
  }
  if (surface.type === 'media' && surface.kind === 'video' && surface.hasPath) {
    rows.push(
      { id: 'frames', label: '提取帧', section: 'craft' },
      { id: 'parse', label: '智能解析', section: 'craft' },
      { id: 'reshoot', label: '局部重绘…', section: 'craft' },
    )
    if (surface.canAssemble) rows.push({ id: 'assemble', label: '拼接', section: 'craft' })
    rows.push(
      { id: 'desub', label: '去字幕', section: 'craft' },
      { id: 'extend', label: '视频延长', section: 'craft' },
      { id: 'gif', label: '导出 GIF', section: 'craft' },
    )
  }
  if (surface.type === 'media' && surface.kind === 'image' && surface.hasPath) {
    rows.push({ id: 'split', label: '拆分宫格', section: 'craft' })
  }
  if (surface.type === 'media') {
    rows.push({ id: 'revise', label: '重新生成…', section: 'craft' })
  }
  rows.push({ id: 'autolink', label: '自动连线', section: 'craft' })
  if (surface.hasPath) rows.push({ id: 'download', label: '下载', section: 'edit' })
  rows.push(
    { id: 'duplicate', label: '复制', section: 'edit', kbd: '⌘D' },
    { id: 'lock', label: surface.locked ? '解锁' : '锁定', section: 'edit', kbd: 'L' },
    { id: 'disconnect', label: '断开连线', section: 'edit' },
    { id: 'delete', label: '删除', section: 'danger', kbd: '⌫', danger: true },
  )
  return rows
}

export function multiMenuRows(surface: Partial<Pick<NodeMenuSurface, 'canPack' | 'canSheet' | 'canJoin' | 'canStack' | 'canUngroup' | 'locked'>> = {}): MenuRow[] {
  const rows: MenuRow[] = [
    { id: 'group', label: '编组', section: 'arrange', kbd: '⌘G' },
  ]
  if (surface.canUngroup === true) rows.push({ id: 'ungroup', label: '取消编组', section: 'arrange' })
  if (surface.canPack === true) rows.push({ id: 'pack', label: '合成视频', section: 'arrange' })
  if (surface.canSheet === true) rows.push({ id: 'sheet', label: '九宫格', section: 'arrange' })
  if (surface.canJoin === true) rows.push({ id: 'join', label: '合并宫格', section: 'arrange' })
  if (surface.canStack === true) rows.push({ id: 'stack', label: '分屏', section: 'arrange' })
  rows.push(
    { id: 'lock', label: surface.locked === true ? '解锁' : '锁定', section: 'edit', kbd: 'L' },
    { id: 'delete', label: '删除', section: 'danger', kbd: '⌫', danger: true },
  )
  return rows
}

export function groupMenuRows(rows: MenuRow[]): Array<{ id: MenuSectionId; label: string; rows: MenuRow[] }> {
  const order: MenuSectionId[] = ['create', 'import', 'primary', 'craft', 'edit', 'arrange', 'danger']
  return order.flatMap(id => {
    const slice = rows.filter(row => row.section === id)
    if (slice.length === 0) return []
    return [{ id, label: SECTION_LABEL[id], rows: slice }]
  })
}

export function shouldNestCraft(rows: MenuRow[]): boolean {
  return rows.filter(row => row.section === 'craft').length >= 3
}
