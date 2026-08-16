/**
 * 中央限制清单：全部工具共享的单一边界注册表。
 * 每个工具的 schema 与 clamp 逻辑都从这一处取值——边界只维护一份
 * （schema = clamp = 文档三处同源）。
 */

export const LIMITS = {
  /** 输入文件上限。 */
  maxFileBytes: 4 * 1024 * 1024 * 1024,
  /** 素材时长上限。 */
  maxDurationSec: 4 * 3600,
  /** 最大分辨率（宽）。 */
  maxWidth: 7680,
  /** probe 超时。 */
  probeTimeoutMs: 30_000,
  /** 批量操作条目上限。 */
  maxBatch: 50,
  /** 生成并发上限。 */
  maxConcurrency: 16,
  /** workflow 步骤上限。 */
  maxWorkflowSteps: 64,
  /** 编码质量区间。 */
  crfRange: [0, 51] as const,
  /** 变速区间。 */
  speedRange: [0.01, 100] as const,
  /** 音量区间。 */
  volumeRange: [0, 4] as const,
  /** 音频频率区间（Hz）。 */
  audioFreqRange: [20, 20_000] as const,
  /** 提案预检区间。 */
  proposalDurationRange: [1, 300] as const,
  proposalCountRange: [1, 50] as const,
  /** 转场时长区间（秒）。 */
  transitionRange: [0.05, 8] as const,
} as const

/** 越界钳制：value 落到 [min, max]，越界时返回钳制值。 */
export function clampRange(value: number, range: readonly [number, number]): number {
  return Math.min(range[1], Math.max(range[0], value))
}
