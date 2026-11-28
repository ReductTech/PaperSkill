# CoWorld Reasoner：以演进的视频世界模型驱动智能体式多模态推理 · 交互式教程

基于论文 **CoWorld Reasoner: Agentic Multimodal Reasoning with the Evolving Video World Model-Driven Harness** 生成的中文交互式教学网页（React + TypeScript + Vite）。

- 论文：Dongjie Cheng, Ruifeng Yuan, Ran Wei, Ning Song, Yongqi Li, Wenjie Li
- 机构：香港理工大学；杭州迪英加生物科技
- arXiv：[2610.21910](https://arxiv.org/abs/2610.21910)（2026-10-15）
- 生成工具：paper-skill 1.5.0（PPT 场景模式）

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

## 教程结构

统一生活主题为「一次外出拍照」：换机位＝视角改变，补中间帧＝插值，继续拍＝延续，挪动物件再拍＝干预；拍摄清单对应技能，回看挑片对应验证器，晚间复盘拍摄日志对应共演化。

| 章节 | 页面 | 学习者操作 |
| ---- | ---- | ---- |
| 01 观测之外的视觉证据 | 两张照片回答不了的问题 | 切换三种提问，看缺口落在画面外／时间缝隙／下一秒 |
| 02 Video World Model-Driven Harness | Harness 的四个部件 | 点选工具、技能、验证器、执行层，公式 H=(T,S,V,E) 同步高亮 |
| 02 | 按问题选择视觉操作 | 为四个问题各选一种视觉操作，判断生成的片段是否对题 |
| 02 | 请求构造：源图顺序与保持不变的条件 | 交换 Picture 1/2、开关保持条件，观察证据是否仍可用 |
| 03 四阶段执行与证据整合 | 四阶段执行：历史如何累积 | 推进阶段把手，交互历史逐条追加 |
| 03 | 证据整合：答案为什么被改写 | 在「只看原图」与「加上生成视频」之间切换，答案翻转 |
| 04 VLM-VWM Harness Co-Evolution | 共演化：该修订哪一部分 | 由失败轨迹判断该改工具接口、技能指令还是执行代码 |
| 04 | 修订预算与候选选择 | 拖动每阶段修订预算 B，观察收益饱和与提前停止 |
| 05 证据、边界与失败 | 七个基准上的整体结果 | 点选基准读取绝对/相对提升与评估协议 |
| 05 | 收益从哪里来：工具消融与技能使用 | 切换含/去掉 VWM 工具，看子类增益来源 |
| 05 | 边界：换引擎、换 VLM 与失败案例 | 切换面板，比较迁移实测与换引擎的定性结论 |

## 数据与素材来源

- **实验数字**：全部取自论文 Table 1（七个基准与平均值）、Figure 3a（八个子类相对无 VWM 变体的增益）、Figure 5（Grok-4.5 迁移前后按题加权准确率）。页面标注了数据集、方向（越高越好）与基线，未使用论文未报告的数字。
- **图片**：本项目不含论文原图。PDF 中可提取的位图仅为世界模型生成的示例帧，方法总览图为矢量合成无法导出，因此所有示意图、帧条带与图表均由 Canvas/SVG 重绘，不涉及第三方素材授权。
- **缩略图**：`public/thumbnails/*.jpg` 为本教程各页的本地截图（`?capture=1&slide=<scene-id>`），由项目自身渲染产生。
- **共演化页的通过率曲线**标注为「教学示意」：仅 R=3、B=5 两个数值来自论文。
- **外部链接**：仅 arXiv 摘要页（`paper.json` 的 `paperUrl`）。未接入 B 站视频，`src/lib/useBiliVideos.ts` 为框架自带的可选加载器，本项目 `bilibili` 字段为空。

## 目录说明

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 章节、模块、页面与元信息 |
| `src/modules/*.tsx` | 11 个页面组件与 2 个封面动画组件（Canvas/SVG），`sceneKit.tsx` 为共用绘制件 |
| `src/styles/paper.css` | 论文配色与场景样式 |
| `outlines.json` | 每页目标、交互与讲稿（派生文件） |
| `src/components/*`、`src/lib/*`、`src/styles/{tokens,components,presentation}.css` | 演示框架，未改动 |
