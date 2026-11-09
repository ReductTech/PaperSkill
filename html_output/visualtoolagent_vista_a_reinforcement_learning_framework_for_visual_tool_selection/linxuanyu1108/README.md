# VisTA：视觉工具如何按题选择 交互式教程

基于论文 *VisualToolAgent (VisTA): A Reinforcement Learning Framework for Visual Tool Selection*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、B 站、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。

## 第二轮精修记录

- 封面、训练双路径、工具依赖分别使用独立的 SVG 流程图。五步按钮高亮封面节点。
- 工具选择显示按点击顺序生成的编号和模拟证据。奖励矩阵联动分段公式，GRPO 显示优势分布及假设概率比值。
- 工具池完整显示 ChartQA 九行与 Geometry3K 四行。实验页默认显示当前协议柱图，完整 Table 1 可展开。
- 增量改动位于 `src/App.tsx`、`src/modules/Diagrams.tsx`、`src/modules/Exhibit.tsx` 和 `src/styles/paper.css`。
- 论文依据为 [arXiv v2](https://arxiv.org/html/2505.20289v2)。Figure 1–2 为教学重绘，Figure 3–5 用文中可核对数据或观察重述，Figure 6–7 链接原论文。模拟题与工具输出有独立标识。
- 验证使用 TypeScript/Vite 生产构建、PaperSkill 结构检查和 Edge 浏览器。桌面与窄屏共检查九页，重点回归跨章状态、奖励、GRPO 零方差、工具池、实验面板与收尾导航。

## 第三轮精修记录

- 封面与推理图使用独立调用轨道。训练时直接调用和增强调用共享同一套冻结参数，两个答案共同进入奖励比较。部署只保留增强调用。
- 工具选择页分开标注 Agent 索引和模拟回答，切换案例恢复默认工具。奖励公式显示四种情形，GRPO 第四步比较裁剪前后两项及 KL 惩罚。
- 实验页嵌入 arXiv v2 的原始 Figure 3–5，图片可在新标签页打开。Figure 5 保留三种策略的原始分布，按钮切换相应解读。表 1 与表 3 的数字分开呈现。
- 源码改动集中在 `src/modules/Diagrams.tsx`、`Exhibit.tsx`、`ScenarioContext.tsx`、`scenario.ts` 和 `src/styles/paper.css`。原始图位于 `public/images/figure-3.png` 至 `figure-5.png`。
- 原图来源：[论文 §4.3–4.5](https://arxiv.org/html/2505.20289v2#S4.SS3)。封面及方法图为教学重绘。
