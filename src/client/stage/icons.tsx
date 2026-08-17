import type { CSSProperties, ReactNode, SVGProps } from 'react'

type IconProps = {
  size?: number
  className?: string
}

const base: CSSProperties = { display: 'block', flexShrink: 0 }

function Svg(props: IconProps & { children: ReactNode; filled?: boolean }): ReactNode {
  const size = props.size ?? 16
  const rest: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: props.filled === true ? 'currentColor' : 'none',
    stroke: props.filled === true ? 'none' : 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: base,
    className: props.className,
    'aria-hidden': true,
  }
  return <svg {...rest}>{props.children}</svg>
}

export function IconPlus(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M8 3v10M3 8h10" /></Svg>
}
export function IconMinus(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M3.5 8h9" /></Svg>
}
export function IconSearch(props: IconProps = {}): ReactNode {
  return <Svg {...props}><circle cx="7" cy="7" r="3.5" /><path d="M12.5 12.5 10 10" /></Svg>
}
export function IconGrid(props: IconProps = {}): ReactNode {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="4" height="4" rx="0.8" />
      <rect x="9" y="3" width="4" height="4" rx="0.8" />
      <rect x="3" y="9" width="4" height="4" rx="0.8" />
      <rect x="9" y="9" width="4" height="4" rx="0.8" />
    </Svg>
  )
}
export function IconUpload(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M8 11V4M5 6.5 8 3.5 11 6.5" /><path d="M3.5 13h9" /></Svg>
}
export function IconImage(props: IconProps = {}): ReactNode {
  return (
    <Svg {...props}>
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.4" />
      <circle cx="6" cy="7" r="1.1" />
      <path d="M4 11.5 7 8.5l2 2 1.5-1.5 2.5 2.5" />
    </Svg>
  )
}
export function IconVideo(props: IconProps = {}): ReactNode {
  return <Svg {...props}><rect x="2.5" y="4" width="8" height="8" rx="1.4" /><path d="M11 6.5 14 4.8v6.4L11 9.5Z" /></Svg>
}
export function IconText(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4 4.5h8M8 4.5v7M6 12h4" /></Svg>
}
export function IconGroup(props: IconProps = {}): ReactNode {
  return <Svg {...props}><rect x="3" y="3" width="10" height="10" rx="2" strokeDasharray="2.2 2" /></Svg>
}
export function IconClose(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4 4l8 8M12 4l-8 8" /></Svg>
}
export function IconSpark(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M8 2.5 9.2 6.2 13 7.5 9.2 8.8 8 12.5 6.8 8.8 3 7.5 6.8 6.2Z" /></Svg>
}
export function IconSend(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M3 8h9M8.5 4.5 13 8l-4.5 3.5" /></Svg>
}
export function IconStop(props: IconProps = {}): ReactNode {
  return <Svg {...props} filled><rect x="4.2" y="4.2" width="7.6" height="7.6" rx="1.2" /></Svg>
}
export function IconLeave(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M6 3.5H3.8A1.2 1.2 0 0 0 2.6 4.7v6.6A1.2 1.2 0 0 0 3.8 12.5H6M8.5 8h5M11.2 5.6 13.5 8l-2.3 2.4" /></Svg>
}
export function IconEdit(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M9.2 3.6 12.4 6.8M3.5 12.5l1.1-4.2L10.6 2.3a1.4 1.4 0 0 1 2 0l1.1 1.1a1.4 1.4 0 0 1 0 2L7.5 11.6Z" /></Svg>
}
export function IconCopy(props: IconProps = {}): ReactNode {
  return <Svg {...props}><rect x="5.5" y="5.5" width="7" height="7" rx="1.3" /><path d="M3.5 10.2V4.2A1.2 1.2 0 0 1 4.7 3h6" /></Svg>
}
export function IconTrash(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M3.5 5h9M6 5V3.7A.7.7 0 0 1 6.7 3h2.6a.7.7 0 0 1 .7.7V5M5.2 5l.4 7.2A1 1 0 0 0 6.6 13h2.8a1 1 0 0 0 1-.8L10.8 5" /></Svg>
}
export function IconCompare(props: IconProps = {}): ReactNode {
  return <Svg {...props}><rect x="2.5" y="3.5" width="5" height="9" rx="1.1" /><rect x="8.5" y="3.5" width="5" height="9" rx="1.1" /></Svg>
}
export function IconFit(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M3.5 6.5V3.5H6.5M9.5 3.5h3v3M12.5 9.5v3h-3M6.5 12.5h-3v-3" /></Svg>
}
export function IconChevron(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4.5 6.5 8 10l3.5-3.5" /></Svg>
}
export function IconFolder(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M3 4.5h3.2l1.3 1.4H13A1.2 1.2 0 0 1 14.2 7v4.4A1.2 1.2 0 0 1 13 12.6H3A1.2 1.2 0 0 1 1.8 11.4V5.7A1.2 1.2 0 0 1 3 4.5Z" /></Svg>
}
export function IconLock(props: IconProps = {}): ReactNode {
  return <Svg {...props}><rect x="3.5" y="7" width="9" height="6.2" rx="1.3" /><path d="M5.4 7V5.2a2.6 2.6 0 0 1 5.2 0V7" /></Svg>
}
export function IconUnlock(props: IconProps = {}): ReactNode {
  return <Svg {...props}><rect x="3.5" y="7" width="9" height="6.2" rx="1.3" /><path d="M5.4 7V5.2a2.6 2.6 0 0 1 5.2 0" /></Svg>
}
export function IconDownload(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M8 3.2v7.2M5.2 8.2 8 11l2.8-2.8" /><path d="M3.5 13h9" /></Svg>
}
export function IconHelp(props: IconProps = {}): ReactNode {
  return <Svg {...props}><circle cx="8" cy="8" r="5.2" /><path d="M6.4 6.3a1.6 1.6 0 1 1 1.9 2.1V9.4" /><path d="M8 11.3h.01" /></Svg>
}
export function IconAlign(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M3 4.2h10M3 8h7M3 11.8h10" /></Svg>
}
export function IconCheck(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M3.5 8.4 6.4 11.4 12.5 4.6" /></Svg>
}
export function IconUnlink(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M6.2 9.8 4.8 11.2a2.2 2.2 0 1 1-3-3L3.2 6.8M9.8 6.2 11.2 4.8a2.2 2.2 0 1 1 3 3L12.8 9.2M6.8 9.2l2.4-2.4" /></Svg>
}
export function IconPlay(props: IconProps = {}): ReactNode {
  return <Svg {...props} filled><path d="M5.2 3.6 13 8 5.2 12.4Z" /></Svg>
}
export function IconPause(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M5.2 3.8h2.2v8.4H5.2ZM8.6 3.8h2.2v8.4H8.6Z" /></Svg>
}
export function IconUndo(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4 7.2h5.2a3.2 3.2 0 1 1 0 6.4H7.2" /><path d="M6.2 4.6 3.6 7.2 6.2 9.8" /></Svg>
}
export function IconRedo(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M12 7.2H6.8a3.2 3.2 0 1 0 0 6.4h2" /><path d="M9.8 4.6 12.4 7.2 9.8 9.8" /></Svg>
}
export function IconRotate(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M13 8a5 5 0 1 1-1.4-3.4" /><path d="M13 3.4V6.6H9.8" /></Svg>
}
export function IconCrop(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4 2.5v9.2h9.2M12 13.5V4.3H2.8" /></Svg>
}
export function IconBrush(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M9.6 3.2 12.8 6.4 7 12.2H3.8v-3.2Z" /><path d="M8.2 4.6 11.4 7.8" /></Svg>
}
export function IconSliders(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M3 4.5h10M3 8h10M3 11.5h10" /><circle cx="6" cy="4.5" r="1.2" /><circle cx="10" cy="8" r="1.2" /><circle cx="7.5" cy="11.5" r="1.2" /></Svg>
}
export function IconScissors(props: IconProps = {}): ReactNode {
  return <Svg {...props}><circle cx="4.2" cy="4.4" r="1.6" /><circle cx="4.2" cy="11.6" r="1.6" /><path d="M5.5 5.4 13 12.2M5.5 10.6 13 3.8" /></Svg>
}
export function IconSkipBack(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4 4v8M12.2 4.2 7 8l5.2 3.8Z" /></Svg>
}
export function IconSkipFwd(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M12 4v8M3.8 4.2 9 8l-5.2 3.8Z" /></Svg>
}

export function KindGlyph(props: { kind: string; size?: number }): ReactNode {
  if (props.kind === 'video') return <IconVideo size={props.size} />
  if (props.kind === 'image') return <IconImage size={props.size} />
  if (props.kind === 'group') return <IconGroup size={props.size} />
  return <IconText size={props.size} />
}
