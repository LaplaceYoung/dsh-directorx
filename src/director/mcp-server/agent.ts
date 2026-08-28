import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DirectorService } from './service.js';

const WRITABLE_COMMANDS = new Set([
  'director_select', 'director_add_element', 'director_update_element', 'director_apply_action',
  'director_set_motion_keyframe', 'director_apply_camera', 'director_set_camera_keyframe',
  'director_manage_shot', 'director_set_lock', 'director_delete', 'director_undo', 'director_redo',
  'director_validate',
]);

export interface AgentChatMessage { role: 'user' | 'assistant'; content: string }
export interface AgentCommand { name: string; arguments?: Record<string, unknown> }

interface AgentDecision {
  message: string;
  commands: AgentCommand[];
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

async function findCodex(): Promise<string> {
  const candidates = [
    process.env.CODEX_CLI_PATH,
    '/Applications/ChatGPT.app/Contents/Resources/codex',
    '/opt/homebrew/bin/codex',
    '/usr/local/bin/codex',
  ].filter((item): item is string => Boolean(item));
  for (const candidate of candidates) if (await exists(candidate)) return candidate;
  throw new Error('未找到 Codex CLI。请先安装或打开 Codex 桌面版。');
}

function run(command: string, args: string[], input: string, timeoutMs = 180_000): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], env: process.env });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on('data', (chunk) => stderr.push(Buffer.from(chunk)));
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error('导演助手响应超时')); }, timeoutMs);
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('close', (code) => {
      clearTimeout(timer);
      const output = Buffer.concat(stdout).toString('utf8');
      const errors = Buffer.concat(stderr).toString('utf8');
      if (code === 0) resolve({ stdout: output, stderr: errors });
      else reject(new Error(errors.trim() || output.trim() || `Codex exited with ${code}`));
    });
    child.stdin.end(input);
  });
}

function safeDecision(value: unknown): AgentDecision {
  if (!value || typeof value !== 'object') throw new Error('导演助手返回了无效结果');
  const item = value as Record<string, unknown>;
  const message = typeof item.message === 'string' && item.message.trim() ? item.message.trim() : '已完成。';
  const commands = Array.isArray(item.commands) ? item.commands.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const command = entry as Record<string, unknown>;
    if (typeof command.name !== 'string' || !WRITABLE_COMMANDS.has(command.name)) return [];
    let argumentsValue: Record<string, unknown> = {};
    if (typeof command.arguments_json === 'string' && command.arguments_json.trim()) {
      try {
        const parsed = JSON.parse(command.arguments_json) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) argumentsValue = parsed as Record<string, unknown>;
      } catch { return []; }
    }
    return [{ name: command.name, arguments: argumentsValue }];
  }) : [];
  return { message, commands };
}

export async function runDirectorAgent(service: DirectorService, messages: AgentChatMessage[]): Promise<{
  message: string;
  commands: Array<{ name: string; ok: boolean; error?: string }>;
  state: unknown;
}> {
  const codex = await findCodex();
  const state = await service.execute('director_get_state');
  const root = await mkdtemp(join(tmpdir(), 'director-stage-agent-'));
  const schemaPath = join(root, 'response.schema.json');
  const outputPath = join(root, 'response.json');
  const schema = {
    type: 'object', additionalProperties: false, required: ['message', 'commands'],
    properties: {
      message: { type: 'string' },
      commands: {
        type: 'array', items: {
          type: 'object', additionalProperties: false, required: ['name', 'arguments_json'],
          properties: { name: { type: 'string' }, arguments_json: { type: 'string', description: 'A JSON object encoded as a string' } },
        },
      },
    },
  };
  await writeFile(schemaPath, JSON.stringify(schema), 'utf8');
  const conversation = messages.slice(-12).map((item) => `${item.role === 'user' ? '用户' : '导演助手'}：${item.content}`).join('\n');
  const prompt = `你是导演台内的专业电影预演助手。你只输出符合 schema 的 JSON。\n\n工作规则：\n1. 根据工程状态中的精确 ID 操作，绝不编造人物或临时角色。\n2. 用户需求明确时，输出可执行 commands；需求含糊时先在 message 中提出一个清楚问题，commands 留空。\n3. 所有时间都是 24fps 的整数帧。动作和运镜要落在当前分镜时长内。\n4. locked=true 是人工决定，除非用户明确要求覆盖，否则绝不使用 override_locked。\n5. 人物添加优先使用 director_add_element 的 preset。角色、动物、群众和道具必须有稳定 ID。\n6. 多步修改最后添加 director_validate。不要重置工程。\n7. 不执行导出，导出必须由用户在界面手动确认。\n8. 回答用简洁中文，说明将做什么或已经做了什么。\n\n允许的命令：${[...WRITABLE_COMMANDS].join(', ')}\n\n当前完整工程状态：\n${JSON.stringify(state)}\n\n最近对话：\n${conversation}`;
  try {
    await run(codex, [
      'exec', '--ephemeral', '--skip-git-repo-check', '--ignore-user-config', '--ignore-rules',
      '-s', 'read-only', '-c', 'approval_policy="never"', '--output-schema', schemaPath,
      '--output-last-message', outputPath, '-',
    ], prompt);
    const decision = safeDecision(JSON.parse(await readFile(outputPath, 'utf8')));
    const commandResults: Array<{ name: string; ok: boolean; error?: string }> = [];
    for (const command of decision.commands) {
      try {
        const argumentsValue = { ...(command.arguments ?? {}) };
        if (command.name === 'director_apply_action' || command.name === 'director_set_motion_keyframe' || command.name === 'director_set_camera_keyframe') argumentsValue.source = 'agent';
        await service.execute(command.name, argumentsValue);
        commandResults.push({ name: command.name, ok: true });
      } catch (error) {
        commandResults.push({ name: command.name, ok: false, error: error instanceof Error ? error.message : String(error) });
        break;
      }
    }
    return { message: decision.message, commands: commandResults, state: await service.execute('director_get_state') };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
