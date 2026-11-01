# π0.5：面向开放世界泛化的视觉-语言-动作模型 交互式教程

基于论文 *π0.5: a Vision-Language-Action Model with Open-World Generalization*（Physical Intelligence，arXiv:2504.16054，2025）制作的简体中文交互式教程，由 **paper-skill** 生成，React + TypeScript + Vite 项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 内容结构

共 7 章、13 页（1 页封面 + 12 页教学页）：

| 章 | 主题 | 页 |
| --- | --- | --- |
| 一 | 为什么只练目标机器人数据不够 | 陌生厨房的抓握 · 六类训练数据各供养哪一层 |
| 二 | 层级推理：先报下一步，再动手 | 子任务决定手往哪走 · 高层报多快才不掉队 |
| 三 | 两阶段训练：离散 token → 流匹配 | 连续动作怎么从噪声里出来 · 两种动作表示如何共存 |
| 四 | 场景数量 | 训练环境数与泛化 |
| 五 | 配比与对手 | 少一段经历会退步多少 · 与 π0 相比、语言跟得上吗 |
| 六 | 谁来报下一步 | 七种高层方案的排序 |
| 七 | 失败与边界 | 反复开合的抽屉 · 这套配方在什么条件下成立 |

教学比喻为「家常菜师徒档」：师傅报的下一步对应高层子任务 ℓ̂，学徒手臂的 50 步动作串对应低层动作块。**比喻只解释直觉**；页面上凡属教学用的玩具计算或示意动画，均已就地标注，不作为论文的测量结果。

## 素材来源

- `public/images/fig8.png`、`fig9.png`、`fig10.png`、`fig11.png`、`fig12.png`、`fig13.png`：裁自论文 PDF（arXiv:2504.16054）的原始插图，版权归原作者 Physical Intelligence 所有，此处仅用于介绍与评述该论文。
- `public/thumbnails/*.jpg`：本项目页面的本地截图，由生成过程自动产出。
- 论文引用：*π0.5: a Vision-Language-Action Model with Open-World Generalization*, Physical Intelligence, arXiv:2504.16054, 2025.

## 目录结构

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、场景、元信息） |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属交互组件与注册表 |
| `src/styles/paper.css` | 论文专属配色与版式覆盖 |
| `public/images/*` | 论文原图 |
| `public/thumbnails/*` | 幻灯片截图 |
| `outlines.json` | 每页目标、交互与讲稿（由章节组装器派生） |
| `src/components/*`、`src/lib/*` | 模板框架，未作修改 |

## 演示与交互

顶部翻页、左侧预览选页，「讲稿」打开演讲者备注，「放映」进入全屏。页面固定 1600×900，手机端保持同一排版并支持双指缩放与放大后拖动。正文的滑块、拖拽、点选都会即时改变画面与反馈文字。

## 配色语义

`--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法，`--orange` 用户强调，`--purple` 辅助机制。
