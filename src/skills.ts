import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from 'cordis'

const CN_NAME_TO_SLUG: Record<string, string> = {
  '导演风格致敬': 'director-style',
  '动画与二次元': 'animation',
  '短剧与叙事': 'short-drama',
  '音乐MV与舞台': 'music-stage',
  '广告与电商': 'ads-ecommerce',
  '纪录片与纪实': 'documentary',
  'POV与运动': 'pov-motion',
  '特效与视觉实验': 'vfx-experiments',
  '视频制作技能库': 'video-production-cn',
}

interface SkillFrontmatter {
  name?: string
  description?: string
  whenToUse?: string
  userInvocable?: boolean
}

interface ParsedSkill {
  frontmatter: SkillFrontmatter
  content: string
}

function validSkillName(name: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)
}

function blockScalar(lines: string[], startIndex: number): { value: string; next: number } {
  const parts: string[] = []
  let index = startIndex
  while (index < lines.length) {
    const line = lines[index] ?? ''
    if (line.trim() === '') {
      parts.push('')
      index += 1
      continue
    }
    // A non-indented key starts the next YAML field.
    if (!line.startsWith(' ') && !line.startsWith('\t') && /^[A-Za-z0-9_-]+:/.test(line)) break
    parts.push(line.replace(/^\s+/, '').replace(/^>\s?/, ''))
    index += 1
  }
  return { value: parts.join(' ').replace(/\s+/g, ' ').trim(), next: index }
}

function parseFrontmatter(source: string): ParsedSkill {
  if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) {
    return { frontmatter: {}, content: source }
  }
  const end = source.indexOf('\n---', 3)
  const raw = end >= 0 ? source.slice(4, end) : source.slice(4)
  const content = end >= 0 ? source.slice(end + 4).replace(/^\r?\n/, '') : ''
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const frontmatter: SkillFrontmatter = {}
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? ''
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (match === null) continue
    const key = match[1] as string
    let value = (match[2] ?? '').trim()
    const scalarStart = value.startsWith('|') || value.startsWith('>')
    if (value === '' || scalarStart) {
      const folded = blockScalar(lines, i + 1)
      value = folded.value
      i = folded.next - 1
    } else {
      value = value.replace(/^["']|["']$/g, '')
    }
    if (key === 'name') frontmatter.name = value
    if (key === 'description') frontmatter.description = value
    if (key === 'whenToUse') frontmatter.whenToUse = value
    if (key === 'user-invocable') frontmatter.userInvocable = value === 'true'
  }
  return { frontmatter, content }
}

async function readSkillFile(path: string): Promise<ParsedSkill | undefined> {
  try {
    return parseFrontmatter(await readFile(path, 'utf8'))
  } catch {
    return undefined
  }
}

async function firstLevelSkillDirs(root: string): Promise<Array<{ dir: string; safeName: string }>> {
  const entries = await readdir(root, { withFileTypes: true })
  const out: Array<{ dir: string; safeName: string }> = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name.startsWith('.')) continue
    const dir = join(root, entry.name)
    let safeName = entry.name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
    if (!validSkillName(safeName)) safeName = CN_NAME_TO_SLUG[entry.name] ?? `cn-${Buffer.from(entry.name).toString('hex').slice(0, 12)}`
    out.push({ dir, safeName })
  }
  return out
}

function normalizedSkillName(dirName: string, frontmatter: SkillFrontmatter): string {
  const fromFrontmatter = frontmatter.name?.trim() ?? ''
  if (fromFrontmatter !== '' && validSkillName(fromFrontmatter)) return fromFrontmatter
  const fallback = CN_NAME_TO_SLUG[dirName] ?? dirName.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
  return validSkillName(fallback) ? `directorx-${fallback}` : `directorx-cn-${Buffer.from(dirName).toString('hex').slice(0, 12)}`
}

function defaultDescription(title: string): string {
  return `DirectorX bundled skill "${title}". Load it when the task matches this craft domain.`
}

export async function registerBundledSkills(ctx: Context): Promise<void> {
  const skillsRoot = fileURLToPath(new URL('../skills/', import.meta.url))
  const root = resolve(skillsRoot)

  // Top-level skills: one DSH runtime skill per SKILL.md bundle.
  for (const { dir, safeName } of await firstLevelSkillDirs(root)) {
    const parsed = await readSkillFile(join(dir, 'SKILL.md'))
    if (parsed === undefined) continue
    const name = parsed.frontmatter.name !== undefined && validSkillName(parsed.frontmatter.name)
      ? parsed.frontmatter.name
      : safeName
    const description = parsed.frontmatter.description?.trim() !== ''
      ? parsed.frontmatter.description ?? defaultDescription(name)
      : defaultDescription(name)
    ctx.skills.register({
      name,
      description,
      ...(parsed.frontmatter.whenToUse === undefined ? {} : { whenToUse: parsed.frontmatter.whenToUse }),
      content: parsed.content,
      source: 'bundled',
      provider: 'directorx',
      resourceBase: { kind: 'directory', path: dir },
      invocation: {
        modelInvocable: true,
        userInvocable: parsed.frontmatter.userInvocable ?? true,
      },
    })
  }

  // Nested Chinese production categories become individually addressable skills.
  const cnRoot = join(root, 'video-production-cn')
  const cnEntries = await firstLevelSkillDirs(cnRoot).catch(() => [])
  for (const { dir, safeName } of cnEntries) {
    const parsed = await readSkillFile(join(dir, 'SKILL.md'))
    if (parsed === undefined) continue
    const name = `directorx-${safeName}`
    ctx.skills.register({
      name,
      description: parsed.frontmatter.description?.trim() !== '' ? parsed.frontmatter.description ?? defaultDescription(name) : defaultDescription(name),
      content: parsed.content,
      source: 'bundled',
      provider: 'directorx',
      resourceBase: { kind: 'directory', path: dir },
      invocation: { modelInvocable: true, userInvocable: true },
    })
  }

  ctx.skills.register({
    name: 'directorx-knowledge',
    description: 'Search and read the bundled DirectorX film/AI-video knowledge corpus (350+ Chinese craft articles, model matrixes, prompt engineering, workflows). Use directorx_knowledge_search and directorx_knowledge_read instead of guessing domain facts.',
    content: [
      '# DirectorX Knowledge Corpus',
      '',
      'Use the `directorx_knowledge_search` tool with a focused Chinese or English query before making a filmmaking, prompting, model-selection, or workflow decision. Inspect the returned `id` / `slug` / `path`, then call `directorx_knowledge_read` for the full article.',
      'The corpus covers: camera language, editing, screenplay, AI video/image prompting, model matrix, first/last-frame control, consistency systems, sound design, vertical drama, ad/e-commerce workflows, platform delivery specs, and copyright-safe prompting.',
      'Prefer corpus facts over guessed model capabilities. Cite the article id when you use its guidance.',
    ].join('\n'),
    source: 'runtime',
    provider: 'directorx',
    invocation: { modelInvocable: true, userInvocable: true },
  })

  ctx.skills.register({
    name: 'directorx-recipes',
    description: 'Reusable DirectorX production recipes (ad video, clip recut, tutorial, documentary, novel adaptation, unit production, promo, one-line ad). Load when the user asks for an end-to-end AI-video workflow and a recipe matches the format.',
    content: [
      '# DirectorX Recipes',
      '',
      'Recipes are step plans, not agents. DSH owns planning and execution; treat recipes as checklists and stage contracts.',
      'Recipe files ship in the plugin `recipes/` directory. Read the matching markdown file when a production format matches (e.g. `recipes/ad-video.md`, `recipes/tutorial-video.md`, `recipes/short-drama.md`).',
      'Every recipe assumes the DirectorX generation tools are configured in Settings; before queuing media, verify the matching capability is enabled and its Base URL / API Key / model are set.',
    ].join('\n'),
    source: 'runtime',
    provider: 'directorx',
    invocation: { modelInvocable: true, userInvocable: true },
  })
}