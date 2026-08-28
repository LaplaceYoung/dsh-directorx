/** Node kinds stored in canvas.json and reconstructed from the flow graph. */
export type CanvasNodeKind = 'image' | 'video' | 'audio' | 'text' | 'group' | 'director-stage' | 'edit'

const KINDS = new Set<CanvasNodeKind>(['image', 'video', 'audio', 'text', 'group', 'director-stage', 'edit'])

function asKind(value: unknown): CanvasNodeKind | undefined {
  return typeof value === 'string' && KINDS.has(value as CanvasNodeKind) ? value as CanvasNodeKind : undefined
}

/**
 * Recover a canvas node kind after a flow save that dropped `type`.
 * Prefer an explicit non-text kind, then `data.kind`, then the `newId` prefix.
 */
export function canvasNodeKind(input: {
  kind?: unknown
  id?: unknown
  dataKind?: unknown
}): CanvasNodeKind {
  const kind = asKind(input.kind)
  if (kind !== undefined && kind !== 'text') return kind
  const dataKind = asKind(input.dataKind)
  if (dataKind !== undefined && dataKind !== 'text') return dataKind
  const id = typeof input.id === 'string' ? input.id : ''
  if (id.startsWith('director-stage-')) return 'director-stage'
  if (id.startsWith('edit-')) return 'edit'
  if (id.startsWith('group-')) return 'group'
  return kind ?? 'text'
}
