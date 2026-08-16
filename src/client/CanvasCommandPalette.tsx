import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk'
import { type ReactNode } from 'react'

/**
 * Canvas command palette — cmdk (pacocoursey/cmdk) instead of a hand-rolled
 * list + arrow-key state. Same ⌘K surface, grouped and filterable.
 */

export interface CanvasCommand {
  id: string
  label: string
  hint: string
  group: string
  run: () => void
}

export function CanvasCommandPalette({
  open,
  onOpenChange,
  commands,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  commands: CanvasCommand[]
}): ReactNode {
  if (!open) return null
  const groups = new Map<string, CanvasCommand[]>()
  for (const command of commands) {
    const list = groups.get(command.group) ?? []
    list.push(command)
    groups.set(command.group, list)
  }
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      label="画布命令"
      overlayClassName="dx-cmdk-overlay"
      contentClassName="dx-cmdk-dialog"
    >
      <style>{CMDK_CSS}</style>
      <CommandInput placeholder="输入命令…（生成 / 泳道 / 适配 / 导出）" />
      <CommandList>
        <CommandEmpty>没有匹配的命令。</CommandEmpty>
        {[...groups.entries()].map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map(command => (
              <CommandItem
                key={command.id}
                value={`${command.label} ${command.hint} ${command.group}`}
                onSelect={() => {
                  onOpenChange(false)
                  command.run()
                }}
              >
                <span>{command.label}</span>
                <span className="dx-cmdk-hint">{command.hint}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

const CMDK_CSS = `
.dx-cmdk-overlay{position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.45);backdrop-filter:blur(3px)}
.dx-cmdk-dialog{position:fixed;left:50%;top:16%;transform:translateX(-50%);z-index:41;width:min(420px,calc(100% - 24px));overflow:hidden;border-radius:16px;border:1px solid rgba(255,255,255,.10);background:#141414;box-shadow:0 18px 48px rgba(0,0,0,.6);font-family:"Inter","SF Pro Text","PingFang SC",system-ui,sans-serif;color:#f5f5f5}
.dx-cmdk-dialog [cmdk-input]{width:100%;box-sizing:border-box;padding:12px 14px;border:none;border-bottom:1px solid rgba(255,255,255,.1);background:transparent;color:#f0f0f0;font-size:13.5px;outline:none}
.dx-cmdk-dialog [cmdk-list]{max-height:320px;overflow-y:auto;padding:6px}
.dx-cmdk-dialog [cmdk-group-heading]{padding:8px 10px 4px;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#9b9b9b}
.dx-cmdk-dialog [cmdk-item]{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:8px;font-size:12.5px;cursor:pointer}
.dx-cmdk-dialog [cmdk-item][data-selected=true]{background:rgba(255,255,255,.1)}
.dx-cmdk-dialog [cmdk-empty]{padding:10px 12px;font-size:12px;color:#9b9b9b}
.dx-cmdk-hint{font-size:10.5px;color:#9b9b9b}
`
