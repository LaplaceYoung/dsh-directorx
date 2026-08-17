import type { ReactNode } from 'react'
import { parseMarkdown, type MdBlock, type MdInline } from './markdown.ts'

function InlineView(props: { nodes: MdInline[] }): ReactNode {
  return props.nodes.map((node, index) => {
    if (node.type === 'text') return <span key={index}>{node.value}</span>
    if (node.type === 'code') return <code key={index}>{node.value}</code>
    if (node.type === 'strong') return <strong key={index}><InlineView nodes={node.children} /></strong>
    if (node.type === 'em') return <em key={index}><InlineView nodes={node.children} /></em>
    if (node.type === 'del') return <del key={index}><InlineView nodes={node.children} /></del>
    return <a key={index} href={node.href} target="_blank" rel="noreferrer noopener"><InlineView nodes={node.children} /></a>
  })
}

function BlockView(props: { block: MdBlock; index: number }): ReactNode {
  const { block, index } = props
  if (block.type === 'heading') {
    if (block.level === 1) return <h1 key={index}><InlineView nodes={block.children} /></h1>
    if (block.level === 2) return <h2 key={index}><InlineView nodes={block.children} /></h2>
    return <h3 key={index}><InlineView nodes={block.children} /></h3>
  }
  if (block.type === 'paragraph') return <p key={index}><InlineView nodes={block.children} /></p>
  if (block.type === 'quote') return <blockquote key={index}><InlineView nodes={block.children} /></blockquote>
  if (block.type === 'hr') return <hr key={index} />
  if (block.type === 'table') {
    return (
      <div key={index} className="dx-md-table-wrap">
        <table className="dx-md-table">
          <thead>
            <tr>
              {block.header.map((cell, cellIndex) => (
                <th key={cellIndex}><InlineView nodes={cell} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}><InlineView nodes={cell} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  if (block.type === 'code') {
    return (
      <pre key={index} data-lang={block.lang}>
        <code>{block.value}</code>
      </pre>
    )
  }
  const Tag = block.ordered ? 'ol' : 'ul'
  return (
    <Tag key={index}>
      {block.items.map((item, itemIndex) => (
        <li key={itemIndex}><InlineView nodes={item} /></li>
      ))}
    </Tag>
  )
}

export function MarkdownView(props: { text: string; className?: string }): ReactNode {
  const blocks = parseMarkdown(props.text)
  if (blocks.length === 0) return null
  return (
    <div className={props.className ?? 'dx-md'} data-dx-md="">
      {blocks.map((block, index) => <BlockView key={index} block={block} index={index} />)}
    </div>
  )
}
