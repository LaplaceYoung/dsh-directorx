/** Context-menu catalogs for the canvas. One open menu, kind-specific rows. */

export type AddMode = 'quick' | 'full'
export type AddKind = 'image' | 'video' | 'audio' | 'text' | 'director-stage' | 'edit' | 'upload' | 'paste'

export type MenuSectionId = 'create' | 'import' | 'primary' | 'craft' | 'edit' | 'arrange' | 'danger'

export interface MenuRow {
  id: string
  label: string
  section: MenuSectionId
  kbd?: string
  danger?: boolean
}

export interface NodeMenuSurface {
  type: 'media' | 'text' | 'group' | 'director-stage' | 'edit'
  kind?: 'image' | 'video' | 'audio'
  hasPath: boolean
  locked: boolean
  selectedCount: number
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
    { id: 'text', label: '文本', section: 'create' },
    { id: 'image', label: '图片', section: 'create' },
    { id: 'video', label: '视频', section: 'create' },
    { id: 'audio', label: '音频', section: 'create' },
    { id: 'director-stage', label: '3D 导演台', section: 'create' },
    { id: 'edit', label: '剪辑台', section: 'create' },
  ]
  if (mode === 'quick') return create
  return [
    ...create,
    { id: 'upload', label: '上传', section: 'import' },
    { id: 'paste', label: '粘贴', section: 'import', kbd: '⌘V' },
  ]
}

export function nodeMenuRows(surface: NodeMenuSurface): MenuRow[] {
  if (surface.selectedCount > 1) return multiMenuRows(surface)
  if (surface.type === 'group') {
    return [
      { id: 'ungroup', label: '取消编组', section: 'edit' },
      { id: 'delete', label: '删除', section: 'danger', kbd: '⌫', danger: true },
    ]
  }
  const rows: MenuRow[] = []
  if (surface.type === 'media' && surface.hasPath && surface.kind === 'image') {
    rows.push(
      { id: 'crop', label: '裁剪', section: 'primary' },
      { id: 'redraw', label: '局部重绘', section: 'primary' },
      { id: 'split', label: '快速切分', section: 'craft' },
    )
  }
  if (surface.type === 'media' && surface.hasPath && surface.kind === 'video') {
    rows.push(
      { id: 'edit', label: '剪辑', section: 'primary' },
      { id: 'frames', label: '截帧', section: 'primary' },
      { id: 'extend', label: '延长镜头', section: 'craft' },
      { id: 'reshoot', label: '视频重拍', section: 'craft' },
    )
  }
  if (surface.type === 'director-stage' || surface.type === 'edit') {
    rows.push({ id: 'edit', label: surface.type === 'edit' ? '打开剪辑' : '进入片场', section: 'primary' })
  }
  if (surface.hasPath) rows.push({ id: 'download', label: '下载', section: 'edit' })
  if (surface.hasPath) rows.push({ id: 'preview', label: '全屏', section: 'edit' })
  rows.push(
    { id: 'duplicate', label: '复制', section: 'edit', kbd: '⌘D' },
    { id: 'delete', label: '删除', section: 'danger', kbd: '⌫', danger: true },
  )
  return rows
}

export function multiMenuRows(surface: Partial<Pick<NodeMenuSurface, 'canUngroup' | 'locked'>> = {}): MenuRow[] {
  const rows: MenuRow[] = [
    { id: 'group', label: '编组', section: 'arrange', kbd: '⌘G' },
  ]
  if (surface.canUngroup === true) rows.push({ id: 'ungroup', label: '取消编组', section: 'arrange' })
  rows.push({ id: 'delete', label: '删除', section: 'danger', kbd: '⌫', danger: true })
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
