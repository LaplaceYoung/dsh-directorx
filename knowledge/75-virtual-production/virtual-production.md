# 虚拟制作与 LED 影棚（Virtual Production & LED Volumes）

> 本页是 DirectorX 虚拟制作手册：ICVFX 方法论（内/外视锥）、LED 影棚设计（像素间距/摩尔纹对策/包围度）、硬件网络布局、摄影机跟踪三法、时码与 Genlock、实时合成与绿屏混合、色彩一致性、拍摄实操要点。与 26 合成 / 57 混合制作 / 67 色彩管理衔接。
> 来源：Epic Games 官方 ICVFX 文档（UE 5.8）、Disguise LED 影棚指南、尊正 LED 影棚操作指南、fxguide StEM3。

## 概述

**ICVFX（机内 VFX）**：实拍时直接拍摄实时视觉特效的方法论——混合 LED 灯光、实时摄影机跟踪、带离轴投影的实时渲染，让前景演员与虚拟背景无缝整合。**核心目标是去掉绿幕合成，在摄影机内产出最终像素（Final Pixels）**。

**两大视锥概念**：
- **内视锥（Inner Frustum）**：摄影机视野内的渲染——按当前镜头焦距渲染、随实拍机位移动（视差效果=真实地点拍摄感）；
- **外视锥（Outer Frustum）**：摄影机 FOV 外的 LED 内容——把 LED 面板变成实景的动态光源与反射源，**模拟现实世界"光与反射不随摄影机移动"**。

## LED 影棚设计决策

| 要素 | 要点 |
|---|---|
| 包围度 | 全虚拟环境 ≥270° 包围（+顶棚提供环境光与反射）；局部虚拟（如窗口）可用单面/弧形墙 |
| 柜体 Cabinet | 每柜固定分辨率（92×92 户外级 → 400×450 超高清室内）；大舞台 10+ 处理器驱动无缝墙 |
| 像素间距 Pixel Pitch | 间距越小密度越高=分辨率与成本越高；**低间距不必然对**——需评估视角/色偏/色彩一致性/散热 |
| 摩尔纹 Moiré | 显示系统与传感器像素微偏移时出现；对策：**焦点置于 LED 面前或后**（轻微失焦）、尽量垂直角度拍摄、控制拍摄距离 |

## 硬件网络布局（设备角色表）

| 设备 | 角色 |
|---|---|
| 主时钟 Master Clock | 系统心跳——所有录制/接收设备同步 |
| nDisplay 渲染节点 | 每节点驱动部分 LED 墙（NVIDIA GPU + Quadro Sync） |
| UE 主工作站 | 舞台配置、启动 nDisplay 集群/远程控制/Multi-User 服务器 |
| UE 技术美术站 | Multi-User 会话中实时创作调整 |
| UE 录制站 | Take Recorder 记录摄影机/灯光/道具变化 |
| UE 合成站（可选） | Composure 实时合成 |
| UE VR 侦察站 | VR 头显现场侦察环境 |
| 摄影机跟踪 | 光学/特征/惯性跟踪系统 |
| 视频村 Video Village | 回放与审查中心 |

**网络**：高吞吐受保护 LAN——必须。

## 摄影机跟踪（实时视差的关键）

- **光学跟踪**：IR 敏感摄影机跟踪反光/主动 IR 标记；
- **特征跟踪**：识别真实物体图像特征（无自定义标记）；
- **惯性跟踪（IMU）**：陀螺仪+加速度计——常与光学/特征组合；
- **推荐多源融合**（光学+惯性）增强数据可靠性；
- **Live Link**：分发跟踪数据到 nDisplay 集群；支持 Vicon/Stype/Mo-Sys/Ncam 等。

**摄影机校准（Camera Calibration）**：虚拟摄影机必须精确模拟物理摄影机——位置/姿态匹配+视频流精确时序同步；Lens File 资产封装校准数据+**镜头失真模型**——失真后处理应用到 CG 渲染（实拍与虚拟同镜头特性）。

## 时码与 Genlock（设备同步）

- 每设备内时钟不同步 → 画面撕裂；**Genlock 统一显示**（nDisplay）；
- 引擎时码/帧生成必须匹配摄影机输入；
- **屏幕空间效果禁用**：SSGI/SSAO/SSR/晕影/自适应曝光/Bloom——节点边框会出现问题。

## 实时合成与绿幕混合（无法机内定稿的兜底）

- 内视锥可一键切换为**绿幕+可调跟踪标记**；外视锥继续显示渲染用于照明反射；
- **只绿摄影机 FOV**：绿幕面积最小化 → 绿色溢出最少；外视锥照明反射保留（摩托车/眼镜上的真实反射）→ 绿幕元素合成质量提升；
- 实时合成让表演者看到接近成片的效果（告别"绿色海洋"）——也是剪辑预览素材；
- **Composure**：实时视频输入/AR 合成/绿幕抠像/垃圾遮罩/校色/镜头失真。

## 现场控制与多用户

- **远程控制 Web App**：平板/浏览器改校色/灯光/虚拟演员位置——"换天空"现场即改；
- **Multi-User 编辑**：主操作员改场景实时推送到渲染节点；所有可撤销操作都作为事务同步；
- **Level Snapshots**：条与条之间一键恢复场景起点；追踪拍摄中变化——配合 Source Control 双重版本管理。

## 色彩一致性（跨镜头关键）

1. **全片同一机型**：不同摄影机输出不同——LED 影棚内换机型=颜色漂移；
2. **实景资产上舞台测试**：LED 光对舞台元素的影响不同于其他灯；
3. **禁用 Tonemapper**（`ShowFlag.Tonemapper 0`）：引擎内容以线性 sRGB 输入 LED 面板（无色调曲线）；
4. **OpenColorIO**：保证从摄影机采集→合成应用→最终渲染全程色彩一致（→ 67 色彩管理衔接）。

## 拍摄实操要点（摄影指导视角）

- **机位纪律**：尽量垂直面对 LED 墙、焦点放墙前/后避免摩尔纹；
- **外视锥当灯光用**：环境内容=动态光源与反射——设计场景时把"LED 照到演员脸上"纳入布光（→ 50 混合光同理：动机光原则）；
- **跟踪校准先于开拍**：每换镜头重新校准（Lens File）；
- **绿幕混合时**：绿幕只放镜头内，外视锥继续照明——溢出最小化；
- **预算决策**：全虚拟 270°+ vs 局部弧形墙——按场景虚实比例决定（→ 57 混合制作衔接）。

## 常见错误

1. 忽略 Genlock：撕裂/掉帧毁掉所有镜头。
2. 屏幕空间效果不关：节点边框接缝。
3. 镜头不校准就拍：失真不匹配，合成穿帮。
4. 摩尔纹硬怼：焦点贴墙+大角度——必现。
5. 换机型不换全线：色彩漂移。
6. Tonemapper 未禁用：LED 颜色发灰。
7. 全虚拟用小墙：照明反射不足。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 机内特效 | ICVFX | 摄影机内最终像素 |
| 内视锥 | Inner Frustum | 机位视野渲染 |
| 外视锥 | Outer Frustum | 照明反射源 |
| 像素间距 | Pixel Pitch | LED 密度 |
| 摩尔纹 | Moiré | 传感器错位伪影 |
| 帧锁定 | Genlock | 显示同步 |
| 镜头文件 | Lens File | 校准数据资产 |
| 实时合成 | Live Compositing | Composure |
| 离轴投影 | Off-Axis Projection | 视差渲染 |
| 主时钟 | Master Clock | 系统心跳 |
| 特征跟踪 | Feature Tracking | 无标记跟踪 |
| 垃圾遮罩 | Garbage Matte | 排除区 |

## 来源

- Epic Games: In-Camera VFX Overview in Unreal Engine（UE 5.8 官方文档） — https://dev.epicgames.com/documentation/unreal-engine/in-camera-vfx-overview-in-unreal-engine?lang=en-US
- Disguise: LED 虚拟制作影棚终极指南 — https://www.disguise.one/cn/insights/e-book/ultimate-guide-led-volumes
- 尊正资讯: 摄影师在 LED 虚拟影棚中的操作指南 — https://zunzheng.com/news/archives/64840
- 尊正资讯: Netflix 虚拟制作指南——片场基础设施 — https://zunzheng.com/news/archives/60298
- fxguide: StEM3 — Know Your LED Volume Before You Shoot — https://www.fxguide.com/quicktakes/stem3-know-your-led-volume-before-you-shoot/
- InfiLED: LED Volume Setup for Virtual Production — https://www.infiled.com/blog/led-volume-setup-what-it-takes-to-build-a-virtual-production-stage/
- 尊正资讯: 探讨 LED 虚拟影棚的布光问题 — https://zunzheng.com/news/archives/59228
- Christie: 探索虚拟制作系统与工作流程 — https://www.christiedigital.cn/spotlight/exploring-virtual-production/