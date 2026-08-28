import { createRoot } from 'react-dom/client'
import { Stage } from '../../src/client/stage/Stage.tsx'

function params() {
  const url = new URL(window.location.href)
  return {
    sessionId: url.searchParams.get('sessionId') || undefined,
    node: url.searchParams.get('node') || undefined,
  }
}

const el = document.getElementById('root')
if (el) {
  const root = createRoot(el)
  const { sessionId } = params()
  root.render(<Stage sessionId={sessionId} />)
}
