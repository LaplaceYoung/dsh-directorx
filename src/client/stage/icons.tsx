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
    viewBox: '0 0 24 24',
    fill: props.filled === true ? 'currentColor' : 'none',
    stroke: props.filled === true ? 'none' : 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: base,
    className: props.className,
    'aria-hidden': true,
  }
  return <svg {...rest}>{props.children}</svg>
}

export function IconPlus(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M5 12h14M12 5v14" /></Svg>
}
export function IconMinus(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M5 12h14" /></Svg>
}
export function IconSearch(props: IconProps = {}): ReactNode {
  return <Svg {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
}
export function IconGrid(props: IconProps = {}): ReactNode {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <rect x="14" y="14" width="7" height="7" rx="1.2" />
    </Svg>
  )
}
export function IconUpload(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M12 16V5M7 9l5-5 5 5" /><path d="M5 19h14" /></Svg>
}
export function IconImage(props: IconProps = {}): ReactNode {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.4" />
      <path d="m21 16-5.2-5.2L5 21" />
    </Svg>
  )
}
export function IconVideo(props: IconProps = {}): ReactNode {
  return (
    <Svg {...props}>
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="m15 10 5-2.5v9L15 14Z" />
    </Svg>
  )
}
export function IconText(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M5 6h14M12 6v12M8 18h8" /></Svg>
}
export function IconGroup(props: IconProps = {}): ReactNode {
  return <Svg {...props}><rect x="4" y="4" width="16" height="16" rx="3" strokeDasharray="3.2 2.4" /></Svg>
}
export function IconClose(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M6 6l12 12M18 6 6 18" /></Svg>
}
export function IconSpark(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M12 3 13.6 8.4 19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6Z" /></Svg>
}
export function IconSend(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4 12h13M13 7l6 5-6 5" /></Svg>
}
export function IconStop(props: IconProps = {}): ReactNode {
  return <Svg {...props} filled><rect x="6.5" y="6.5" width="11" height="11" rx="2" /></Svg>
}
export function IconLeave(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M9 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3M12 12h9M17 8l4 4-4 4" /></Svg>
}
export function IconEdit(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M13 5.5 18.5 11M4 20l1.6-6.2L15.2 4.2a1.8 1.8 0 0 1 2.6 0l1.9 1.9a1.8 1.8 0 0 1 0 2.6L10.2 18.4Z" /></Svg>
}
export function IconCopy(props: IconProps = {}): ReactNode {
  return (
    <Svg {...props}>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 16V6a2 2 0 0 1 2-2h10" />
    </Svg>
  )
}
export function IconTrash(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l.8 12a2 2 0 0 0 2 1.8h4.4a2 2 0 0 0 2-1.8L17 7" /></Svg>
}
export function IconCompare(props: IconProps = {}): ReactNode {
  return (
    <Svg {...props}>
      <rect x="3" y="5" width="8" height="14" rx="1.6" />
      <rect x="13" y="5" width="8" height="14" rx="1.6" />
    </Svg>
  )
}
export function IconFit(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></Svg>
}
export function IconChevron(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="m7 10 5 5 5-5" /></Svg>
}
export function IconFolder(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M3 7h5l2 2h11v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></Svg>
}
export function IconLock(props: IconProps = {}): ReactNode {
  return <Svg {...props}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>
}
export function IconUnlock(props: IconProps = {}): ReactNode {
  return <Svg {...props}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0" /></Svg>
}
export function IconDownload(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M12 4v11M7 11l5 5 5-5" /><path d="M5 20h14" /></Svg>
}
export function IconHelp(props: IconProps = {}): ReactNode {
  return <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.6 2.6 0 1 1 3.2 3.4V14" /><path d="M12 17.2h.01" /></Svg>
}
export function IconAlign(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4 6h16M4 12h11M4 18h16" /></Svg>
}
export function IconCheck(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="m5 12.5 4.2 4.3L19 7" /></Svg>
}
export function IconUnlink(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="m9 15-2 2a3.2 3.2 0 0 1-4.5-4.5l2-2M15 9l2-2a3.2 3.2 0 0 1 4.5 4.5l-2 2M10 14l4-4" /></Svg>
}
export function IconLink(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="m10 14 4-4M8 12l-2 2a3.2 3.2 0 0 0 4.5 4.5l2-2M16 12l2-2A3.2 3.2 0 0 0 13.5 5.5l-2 2" /></Svg>
}
export function IconPlay(props: IconProps = {}): ReactNode {
  return <Svg {...props} filled><path d="M8 5.5 19 12 8 18.5Z" /></Svg>
}
export function IconPause(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M8 5h3v14H8ZM13 5h3v14h-3Z" /></Svg>
}
export function IconUndo(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M5 10h8.5a4.5 4.5 0 1 1 0 9H11" /><path d="M9 6 5 10l4 4" /></Svg>
}
export function IconRedo(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M19 10H10.5a4.5 4.5 0 1 0 0 9H13" /><path d="m15 6 4 4-4 4" /></Svg>
}
export function IconRotate(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M20 12a8 8 0 1 1-2.2-5.5" /><path d="M20 5v5h-5" /></Svg>
}
export function IconCrop(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M6 3v14h14M18 21V7H4" /></Svg>
}
export function IconBrush(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="m15 4 5 5-9 9H6v-5Z" /><path d="m13 6 5 5" /></Svg>
}
export function IconSliders(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4 7h16M4 12h16M4 17h16" /><circle cx="8" cy="7" r="1.6" /><circle cx="16" cy="12" r="1.6" /><circle cx="11" cy="17" r="1.6" /></Svg>
}
export function IconScissors(props: IconProps = {}): ReactNode {
  return (
    <Svg {...props}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <path d="m8 8 12 11M8 16 20 5" />
    </Svg>
  )
}
export function IconSkipBack(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M6 5v14M19 6 10 12l9 6Z" /></Svg>
}
export function IconSkipFwd(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M18 5v14M5 6l9 6-9 6Z" /></Svg>
}
export function IconBox(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M12 3 20 7.5v9L12 21 4 16.5v-9Z" /><path d="M12 21V12M4 7.5 12 12l8-4.5" /></Svg>
}
export function IconAudio(props: IconProps = {}): ReactNode {
  return <Svg {...props}><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" /></Svg>
}

export function KindGlyph(props: { kind: string; size?: number }): ReactNode {
  if (props.kind === 'video') return <IconVideo size={props.size} />
  if (props.kind === 'image') return <IconImage size={props.size} />
  if (props.kind === 'audio') return <IconAudio size={props.size} />
  if (props.kind === 'group') return <IconGroup size={props.size} />
  if (props.kind === 'director-stage') return <IconBox size={props.size} />
  if (props.kind === 'edit') return <IconScissors size={props.size} />
  return <IconText size={props.size} />
}
