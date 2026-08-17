const STORAGE_KEY = 'directorx-project'

let activeProject: string | undefined

export function getClientProject(): string | undefined {
  if (activeProject !== undefined && activeProject !== '') return activeProject
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== null && stored !== '' ? stored : undefined
  } catch {
    return undefined
  }
}

export function setClientProject(path: string): void {
  activeProject = path
  try {
    localStorage.setItem(STORAGE_KEY, path)
  } catch {
    // storage unavailable
  }
}

export function withProject(url: string): string {
  const project = getClientProject()
  if (project === undefined) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}project=${encodeURIComponent(project)}`
}

export function projectHeaders(): Record<string, string> {
  const project = getClientProject()
  return project === undefined ? {} : { 'x-directorx-project': project }
}

export interface ProjectInfo {
  path: string
  title: string
}

function inferProjectFromWorkspaceUi(projects: ProjectInfo[]): string | undefined {
  const byTitle = (title: string): string | undefined =>
    projects.find(item => item.title === title)?.path
  const afterLabel = (document.body?.innerText ?? '').split('工作区\n')[1] ?? ''
  const currentTitle = afterLabel.split('\n').map(line => line.trim()).find(line => line !== '')
  if (currentTitle !== undefined) {
    const matched = byTitle(currentTitle)
    if (matched !== undefined) return matched
  }
  const selected = document.querySelector('[role="tree"] [aria-current="true"], [role="tree"] [aria-selected="true"]')
  const selectedTitle = selected?.textContent?.trim().split('\n')[0] ?? ''
  return selectedTitle !== '' ? byTitle(selectedTitle) : undefined
}

export function pickDefaultProject(projects: ProjectInfo[], preferred?: string): string | undefined {
  if (projects.length === 0) return undefined
  if (preferred !== undefined && preferred !== '' && projects.some(item => item.path === preferred)) return preferred
  const fromUi = inferProjectFromWorkspaceUi(projects)
  if (fromUi !== undefined) return fromUi
  const stored = getClientProject()
  if (stored !== undefined && projects.some(item => item.path === stored)) return stored
  return projects[0]?.path
}
