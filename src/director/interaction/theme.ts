/**
 * 视口主题色板 — 还原自 formatted/index-Dp22JYcT.js:7846-7863（Ir / Tf / Es）。
 *
 * jt 引擎以 `Es[theme]` 取辅助件强调色、`Ir[theme]` 取天空/地面/网格配色。
 * dark.ground=0x141414、gridMajor=0x3a3a3a、gridMinor=0x202020；
 * light.ground=0xe6e6e6、gridMajor=0xb4b4b4、gridMinor=0xdedede。
 */

export type ThemeName = 'dark' | 'light';

export interface ThemePalette {
  /** 场景背景天空色（无全景时 scene.background） */
  sky: string;
  /** 地面网格底盘色 */
  ground: number;
  /** GridHelper 主线色 */
  gridMajor: number;
  /** GridHelper 次线色 */
  gridMinor: number;
}

export const DEFAULT_THEME: ThemeName = 'dark';

export const THEME_PALETTES: Record<ThemeName, ThemePalette> = {
  dark: { sky: '#000000', ground: 0x141414, gridMajor: 0x3a3a3a, gridMinor: 0x202020 },
  light: { sky: '#fafafa', ground: 0xe6e6e6, gridMajor: 0xb4b4b4, gridMinor: 0xdedede },
};

/** 辅助件（reticle/绘制线/点）强调色：暗色主题用白，亮色主题用黑（Es） */
export const ACCENT_COLOR: Record<ThemeName, number> = { dark: 0xffffff, light: 0x000000 };
