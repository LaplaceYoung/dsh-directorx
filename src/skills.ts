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

  ctx.skills.register({
    name: 'directorx-workflow',
    description: 'Orchestrate multi-shot DirectorX production with the workflow tool: script/storyboard → parallel prompt crafting → parallel generation → QA → assembly plan, run by fan-out subagents. Load when a project has more than one shot and should be produced as a pipeline instead of serial generation.',
    content: [
      '# DirectorX Workflow 编排（推导优先）',
      '',
      '**agentic 的含义是：根据目标自主推导并编排流程，而不是套固定模板。** 内置模板只是先例（prior art）——当目标、素材与模板不完全匹配时，自己推导阶段与并行度，现场写 workflow 脚本，而不是硬套模板。',
      '',
      '## 推导流程（每次多单元任务都走一遍）',
      '',
      '1. 盘点素材与目标（directorx_probe_media / extract_frames / view_image / canvas_get）；',
      '2. 推演流程形状：哪些阶段必须串行（剧本→分镜）、哪些可以并行（逐镜提示词/逐镜生成）、哪些是闸门（preflight 四道闸门、质检 verdict）；',
      '3. 写出 workflow 工具的 meta（阶段标题 = 你推导出的流程）+ script（按推导的并行度用 pipeline/parallel）；',
      '4. 每个子代理的职责写进它的 prompt（用哪个技能、哪个工具、产出什么 schema、写不写画布）；',
      '5. 先 dryRun 验证编排零成本成立，再决定是否进入真实生成。',
      '',
      '## 推导示例（非模板）',
      '',
      '- 拉片复盘：probe → extract_frames 抽帧 → 逐帧 view_image 描述 → canvas_batch 建分镜板（无生成阶段）。',
      '- 批量返工：canvas_search 找出质检 ✗ 镜头 → propose 排队返工规格 → 用户批准 → 并行生成 → 质检复核 → concat 重剪。',
      '- 素材治理：目录盘点 → 逐个 video_process 统一规格 → audio_beat 找 BGM 切点 → concat + audio_mix 出成片。',
      '',
      '## 内置模板（先例，按需裁剪）',
      '',
      '1. 读取插件内置模板（随插件发布，在工作区插件目录下）：',
      '   - `workflows/directorx-pipeline.js`：多镜头叙事（剧本分镜 → 提示词工坊 → 并行生成 → 质检 → 组装成片）；',
      '   - `workflows/directorx-talking-video.js`：口播/讲解/产品介绍短片（脚本 → 配音 tts → 素材 b-roll → concat 成片 → audio_mix 混音 → srt 字幕侧车）；',
      '   - `workflows/directorx-montage.js`：混剪卡点（素材盘点 → beat 检测 → 裁剪 → 拼接 → 混音成片）。',
      '2. 调用 workflow 工具：',
      '   - meta.name = `directorx-pipeline`；meta.phases 按模板注释声明（剧本与分镜/提示词工坊/并行生成/成片质检/组装方案）。',
      '   - script 用模板内容（按项目裁剪阶段与 schema，保持 JSON Schema 仅用 type/properties/required/additionalProperties/items/enum）。',
      '   - args：`{ brief, shots?, count?, dryRun? }`。dryRun=true 只产出剧本与提示词并做质检，不花生成配额——任何新流水线先 dryRun。',
      '3. 子代理会在其上下文里收到 DirectorX 编排纪律（directorx-subagent-orchestration），并拥有与主代理相同的生成工具与知识库。',
      '',
      '## 编排纪律',
      '',
      '- 每个子代理只做一件事并返回结构化报告（文件路径 / task id / status 原样引用）。',
      '- 锚点（主体/风格/光线/镜头）在「剧本与分镜」阶段一次性锁定，后续阶段引用而不新增设定。',
      '- 生成失败不重试第三次：记录错误，让质检阶段给出降级路径。',
      '- 编排只负责流程；付费生成前四道闸门（规格/内容/成本/权利）由生成执行员按 playbook 确认。',
      '- 风格锁定用 directorx_style（知识库实文注入提示词），镜头语言/景别运镜同源；不臆造风格。',
      '- 组装优先确定性：directorx_video_process（统一规格）+ directorx_video_concat（xfade 成片），产物路径写回画布。',
      '',
      '## 画布镜像（必须）',
      '',
      '流水线全程把项目镜像到无限画布，让用户在 WebUI 看到与 agent 一致的生产视图：',
      '- 剧本与分镜：`directorx_canvas_get` 读现状 → 建 group（项目名）→ 每镜一个节点 → 按顺序连线 → `directorx_canvas_arrange`；',
      '- 并行生成：产物路径用 `directorx_canvas_update` 写回对应节点（patch { path }，媒体节点）或替换为 image/video 节点；',
      '- 质检：结论写进节点 label（如「镜头2 ✓ / ✗ 重拍」），不要静默跳过。',
    ].join('\n'),
    source: 'runtime',
    provider: 'directorx',
    invocation: { modelInvocable: true, userInvocable: true },
  })
}