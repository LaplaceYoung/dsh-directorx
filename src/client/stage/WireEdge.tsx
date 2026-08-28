import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BaseEdge, ViewportPortal, getBezierPath, Position, useInternalNode, type ConnectionLineComponentProps, type EdgeProps } from '@xyflow/react'
import { handleToSide, portPoint, routeDisplayPorts, type PortSide } from '../../canvas-generate.ts'
import { dx } from '../canvas-theme.ts'

function sideToPosition(side: PortSide): Position {
  if (side === 'left') return Position.Left
  if (side === 'right') return Position.Right
  if (side === 'top') return Position.Top
  return Position.Bottom
}

function asSize(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return fallback
}

function nodeBox(node: NonNullable<ReturnType<typeof useInternalNode>>): { x: number; y: number; width: number; height: number } {
  return {
    x: node.internals.positionAbsolute.x,
    y: node.internals.positionAbsolute.y,
    width: asSize(node.width, asSize(node.style?.width, 400)),
    height: asSize(node.height, asSize(node.style?.height, 220)),
  }
}

function wirePath(
  sourceX: number, sourceY: number, sourceSide: PortSide,
  targetX: number, targetY: number, targetSide: PortSide,
) {
  return getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: sideToPosition(sourceSide),
    targetX,
    targetY,
    targetPosition: sideToPosition(targetSide),
  })
}

function wireArrow(x: number, y: number, side: PortSide, fill: string): ReactNode {
  const length = 8
  const half = 5
  const points = side === 'left'
    ? `${x},${y} ${x - length},${y - half} ${x - length},${y + half}`
    : side === 'right'
      ? `${x},${y} ${x + length},${y - half} ${x + length},${y + half}`
      : side === 'top'
        ? `${x},${y} ${x - half},${y - length} ${x + half},${y - length}`
        : `${x},${y} ${x - half},${y + length} ${x + half},${y + length}`
  return <polygon points={points} fill={fill} />
}

export function WireEdge(props: EdgeProps): ReactNode {
  const source = useInternalNode(props.source)
  const target = useInternalNode(props.target)
  const from = source !== undefined ? nodeBox(source) : undefined
  const to = target !== undefined ? nodeBox(target) : undefined
  const routed = from !== undefined && to !== undefined
    ? routeDisplayPorts(from, to, props.sourceHandleId, props.targetHandleId)
    : {
        sourceX: props.sourceX,
        sourceY: props.sourceY,
        targetX: props.targetX,
        targetY: props.targetY,
        sourceSide: handleToSide(props.sourceHandleId) ?? 'right',
        targetSide: handleToSide(props.targetHandleId) ?? 'left',
      }
  const [path, labelX, labelY] = wirePath(
    routed.sourceX, routed.sourceY, routed.sourceSide,
    routed.targetX, routed.targetY, routed.targetSide,
  )
  const selected = props.selected === true
  const stroke = selected ? 'rgba(255,255,255,.96)' : 'rgba(236,236,236,.92)'
  const label = typeof props.label === 'string' ? props.label.trim() : ''
  const showLabel = selected && label !== '' && label !== '承接'
  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        interactionWidth={36}
        style={{ ...props.style, stroke: 'transparent', strokeWidth: 2 }}
      />
      <ViewportPortal>
        <svg className="dx-wire-edge" width={1} height={1} style={{ position: 'absolute', overflow: 'visible', pointerEvents: 'none', left: 0, top: 0, zIndex: 3 }}>
          <path d={path} fill="none" stroke="rgba(0,0,0,.5)" strokeWidth={5} />
          <path d={path} fill="none" stroke={stroke} strokeWidth={selected ? 2.6 : 2.2} />
          {wireArrow(routed.targetX, routed.targetY, routed.targetSide, stroke)}
        </svg>
        {showLabel ? (
          <div
            className="dx-wire-label nodrag nopan"
            style={{
              position: 'absolute',
              left: labelX,
              top: labelY,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              padding: '2px 7px',
              borderRadius: 999,
              background: 'rgba(16,16,16,.86)',
              border: '1px solid rgba(255,255,255,.12)',
              color: dx.mute,
              fontSize: 10,
              fontFamily: dx.font,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        ) : null}
      </ViewportPortal>
    </>
  )
}
export function HiddenConnectionLine(_props: ConnectionLineComponentProps): null {
  return null
}

export function WirePreview(props: ConnectionLineComponentProps): ReactNode {
  const [path] = getBezierPath({
    sourceX: props.fromX,
    sourceY: props.fromY,
    sourcePosition: props.fromPosition,
    targetX: props.toX,
    targetY: props.toY,
    targetPosition: props.toPosition,
  })
  return (
    <g>
      <path d={path} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth={5} />
      <path d={path} fill="none" stroke="rgba(255,255,255,.92)" strokeWidth={2.2} />
      <circle cx={props.toX} cy={props.toY} r={4.5} fill="#f3f3f3" />
    </g>
  )
}

export function WireDragLayer(props: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  fromSide?: string | null
  valid?: boolean
}): ReactNode {
  const side = handleToSide(props.fromSide) ?? 'right'
  const [path] = getBezierPath({
    sourceX: props.from.x,
    sourceY: props.from.y,
    sourcePosition: sideToPosition(side),
    targetX: props.to.x,
    targetY: props.to.y,
    targetPosition: Position.Left,
  })
  if (typeof document === 'undefined') return null
  return createPortal(
    <svg
      className="dx-wire-drag"
      width="100%"
      height="100%"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2147483000, overflow: 'visible' }}
    >
      <path d={path} fill="none" stroke="rgba(0,0,0,.5)" strokeWidth={5} />
      <path d={path} fill="none" stroke={props.valid === true ? 'rgba(255,255,255,1)' : 'rgba(243,243,243,.92)'} strokeWidth={2.25} />
      <circle cx={props.to.x} cy={props.to.y} r={5} fill={props.valid === true ? '#fff' : '#f3f3f3'} />
    </svg>,
    document.body,
  )
}

export function boxPort(
  box: { x: number; y: number; width: number; height: number },
  handle?: string | null,
): { x: number; y: number; side: PortSide } {
  const side = handleToSide(handle) ?? 'right'
  return { ...portPoint(box, side), side }
}

export function closestHandleId(
  box: { x: number; y: number; width: number; height: number },
  point: { x: number; y: number },
): string {
  const ports: Array<{ id: string; x: number; y: number }> = [
    { id: 'in', ...portPoint(box, 'left') },
    { id: 'out', ...portPoint(box, 'right') },
    { id: 'top', ...portPoint(box, 'top') },
    { id: 'bottom', ...portPoint(box, 'bottom') },
  ]
  return ports.reduce((best, port) => {
    const distance = (port.x - point.x) ** 2 + (port.y - point.y) ** 2
    return distance < best.distance ? { id: port.id, distance } : best
  }, { id: 'in', distance: Number.POSITIVE_INFINITY }).id
}
