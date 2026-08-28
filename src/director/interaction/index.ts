/**
 * 交互域还原模块 barrel。
 *
 * 本目录是从 formatted/index-Dp22JYcT.js 的 jt 引擎类中拆出的视口交互能力，
 * 与 src/engine.ts（DirectorEngine 参考实现）解耦：各控制器以宿主接口注入
 * scene/camera/gizmo/回调，可独立测试，也可由引擎组合使用。
 *
 * | 模块 | bundle 来源（行号） | 能力 |
 * |---|---|---|
 * | ground-tools | 8306-8589, 10928-10932 | 地面点选 reticle、地面绘制（高度/垂线/标签） |
 * | marquee | 8821-8941 | 屏幕框选（8 角点投影命中） |
 * | joint-handles | 3884-4190, 9180-9379 | 关节手柄、旋转 gizmo、CCD IK |
 * | multi-pivot | 9438-9526 | 多选枢轴（快照/recenter） |
 * | selection-ring | 10297-10317 | 选中指示环工厂 |
 * | theme | 7846-7863 | 主题色板（Ir/Es） |
 * | text-sprite | 2034-2067 | 画布文字 sprite 工厂 |
 */
export * from './theme';
export * from './text-sprite';
export * from './ground-tools';
export * from './marquee';
export * from './joint-handles';
export * from './multi-pivot';
export * from './selection-ring';
