# 真人+AI 混合制作工作流（Hybrid Live-Action & AI Production）

> 本页是 DirectorX 混合制作手册：实拍锚定原则、多机位一致性、AI 环境/角色生成、交互可信度、透视匹配、后期合成与"灯光修复"、插值转场、混合制作的平衡哲学。与 26 合成 / 34 模型 / 20 DaVinci / 40 分镜衔接。**已合并 163（管线框架/AI VFX 对比/镜头间画面）**——2026-08 去重整理。
> 来源：VP Land Denoised 实战拆解（Addy）、Google Cloud 韩国恐怖片案例（绿幕+AI 无实景）、DramaWave 首个 AI+真人混合短剧、影视飓风一年 200 部工作流。

## 概述

**混合制作（Hybrid Production）**：实拍真人 + AI 生成元素（环境/角色/道具/过渡）在同一画面中共存——"最好的 AI 视频工作所在的地方"（Bear Jam）。

**核心断言**（VP Land）：
1. **第一规则：用真实锚定现实**——围绕一个物理/触觉元素构建场景，让每个 AI 生成角度共享具体参照；
2. AI 是**创意探索加速器**，但"深思熟虑的置景、仔细的底板准备、专注的后期"仍是连贯场景与聪明实验之间的分界线；
3. 用 AI 生成迭代与想法，把**实拍锚点与手动修正留在管线里**——这个平衡产出可信结果。

## 第一步：多机位一致性（从真实开始）

- **物理锚点**：一个圆桌/实物成为所有 AI 生成的公共尺度与反射参照；
- **空板与有人板都拍**：每个剪辑需要的机位角度都拍同一 setup；
- **保留物理道具**：合成时反射与接触点指导生成时的光线决定与后期修正——桌子注册到所有合成里。

## 第二步：角色与环境生成（Nano Banana Pro 类）

- **角色快速迭代**：先测试多个概念（太抢戏的淘汰），再定稿——"求职中的蜥蜴"案例：多个环境情绪试错后选定木饰董事会室匹配情景喜剧质感；
- **环境一致性挑战**：图像模型会任意放置物体/改变视角间深度——**重建对侧视点**，在 PS 里手动调整桌子与裁切，让比例与机位高度匹配实拍底板；
- **皮肤增强**：每块图像底板过一遍皮肤增强器——真人皮肤细节提升 + AI 角色鳞片/纹理获得微细节，块状渲染变可信。

## 第三步：交互可信度（Veo / Wan）

- 交互（递纸/接触）是"两人同处一空间"的幻觉来源；
- **实测结论**：Wan 2.2 Animate 在不扭曲真人演员的情况下给出最有说服力的首帧生成（递纸手部动作）；其他模型出现动作迟缓或画面里多出一只手；
- **后处理兜底**：生成落后/有伪影时，后期修正运动速度 + 紧裁切移除多余元素。

## 第四步：透视与表面匹配（不可妥协）

- **OS/并排机位**：从实拍底板截图作为精确参考来提示新帧；
- 比例调整与座位位置迭代到角色"可信地坐在桌前"；
- 当前模型局限：**视点移动时对空间光线与机位透视的控制有限**——表现为阴影不一致、墙距错位、剪辑间背景亮度变化；对策=精心底板设计 + 多次迭代 + 规划后期校正调色。

## 第五步：合成与打磨（DaVinci Resolve）

| 工具 | 用途 |
|---|---|
| AI Magic Mask | 一键分离演员与背景底板 |
| 分层合成 | 真人肩/前臂叠在 AI 角色底板前 |
| 颜色/对比匹配 | 两元素色调统一 |
| 轻微失焦 | 实拍层加 defocus 让两元素处于可信焦段 |
| 深度图工具 | 背景微妙虚化 |

**AI VFX vs 传统 CGI（并入自 163）**：AI VFX 用提示词/参考图、迭代快（重生成）、可控精度中（靠参考锁定），适合环境/替换/清理；传统 CGI 需建模/贴图/绑定、迭代慢（重渲染）、可控精度高（全参数），适合硬表面/复杂动效。

**镜头间画面（In-between Shots，并入自 163）**：AI 补拍"转场镜头/缺失角度"——实拍锚点（首末帧锁定，→ 116）→ AI 生成衔接镜头，不重拍也能补全覆盖；锚点光效必须匹配（→ 170 光线匹配）。

**管线框架（并入自 163）**：实拍底板 → AI 推理扩展（环境/远景/画面延伸）→ Roto/遮罩生成（→ 128）→ 物体移除/清理（Inpainting）→ 合成（NLE）→ 调色/声音统一（→ 141/161）。

**灯光修复（Lighting Fixes）**——比调色更多：
- 色页里用简单形状/渐变（"magic windows"）控制区域性亮度与色偏（如蜥蜴躯干 AI 黄调→色选器+降温修正）；
- 压暗桌下与演员背后"光线到不了"的区域；
- 隔离角色局部修正；
- **原因**：视频生成常带来混合分辨率与跨剪辑不一致光线。

## 第六步：插值转场（创意运镜）

- **子弹时间式过渡**：提供起始帧+结束帧→插值模型生成中间运动；
- 生成 5 秒片段后**在 NLE 里修速度与运动模糊**——别期待生成器直接交付剪辑级成品；
- 模式：AI 产出概念性过渡镜头，NLE 精修时机/模糊/缓动。

## 工业案例

| 案例 | 做法 |
|---|---|
| Google Cloud 韩国恐怖片 | 全演员+绿幕+AI 环境——四天完成，**无实景无传统 CGI**；AI 生成场景底板，绿幕实拍表演合成 |
| DramaWave 首个 AI+真人混合短剧 | 真人表演 + AI 场景/特效混合流水线 |
| 影视飓风（MediaStorm） | 一年 200 部影片：AI 工作流公开——混合制作是量产核心 |
| 竖屏短剧 Overdrive to My Heart | 实拍 + AI 增强（F1 题材视觉） |

## 平衡哲学（记住的教训）

- AI 工具加速创意探索、降低混合叙事门槛；
- 但**人的手艺仍在关键处**：置景选择、底板准备、专注后期 = 聪明实验 vs 单一连贯场景的区别；
- 制作基础（传统摄影/合成纪律）+ AI 实验 = 今天就能出可信结果。

## 常见错误

1. 无物理锚点：每个 AI 角度各自为政，比例/反射全乱。
2. 环境生成不重建对侧视点：空间一致性崩。
3. 交互交给模型一次成功：多模型实测+后处理兜底才是流程。
4. 透视不匹配就合成：OS 镜头一眼假。
5. 跳过灯光修复：AI 黄调/区域亮度不一致暴露合成痕迹。
6. 期待生成器交付剪辑级成品：插值/过渡都要 NLE 精修。
7. 混合不标记：AI 生成内容合规标注（→ 31/55 文档）。

## 术语表（中英对照）

| 中文 | English | 一句话定义 |
|---|---|---|
| 混合制作 | Hybrid Production | 实拍+AI 共存 |
| 物理锚点 | Physical Anchor | 公共尺度参照 |
| 底板 | Plate | 合成基础素材 |
| 接触点 | Contact Point | 交互真实感 |
| 透视匹配 | Perspective Match | 视点一致 |
| 皮肤增强 | Skin Enhancer | 微细节提升 |
| 灯光修复 | Lighting Fix | 区域亮度修正 |
| 魔法窗 | Magic Window | 色页形状遮罩 |
| 插值转场 | Interpolation Transition | 首尾帧补间 |
| 深度图 | Depth Map | 背景虚化 |
| 空间一致性 | Spatial Consistency | 跨视角统一 |
| 合成痕迹 | Composite Tell | 一眼假信号 |

## 来源

- VP Land: How To — Hybrid AI and Live Action Filmmaking（Nano Banana Pro, Kling, Wan, Resolve） — https://www.vp-land.com/p/how-to-hybrid-ai-and-live-action-filmmaking-nano-banana-pro-kling-wan-resolve
- Google Cloud: Four Days, a Green Screen, and AI — Making a Korean Horror Film with No Set or CGI — https://cloud.google.com/transform/apartment-ai-generated-media-korean-horror-film-behind-the-screen
- High on Films: Anqi Chen — Behind DramaWave's First AI-Live Action Hybrid Production — https://www.highonfilms.com/anqi-chen-behind-dramawaves-first-ai-live-action-hybrid-production/
- Bear Jam: What is Hybrid Production? And Why It's Where the Best AI Video Work Lives — https://www.bearjam.co.uk/insights/what-is-hybrid-production
- Computer Graphics World: Compositing in the Age of AI-Enabled VFX — https://www.cgw.com/Press-Center/Web-Exclusives/2026/Compositing-in-the-Age-of-AI-Enabled-VFX.aspx
- 科技翰林院: 影視颶風 AI 工作流大公開——一年 200 部影片的製作流程 — https://www.techhanlin.tw/mediastorm-film-production-ai-workflow/
- 今日头条: AI 与真人微短剧实拍混合制作成为探索方向 — https://www.toutiao.com/article/7656841204612514338/