# 别重训，做对齐：通过表示对齐将自回归语言模型适配为扩散语言模型 交互式教程

基于论文 *Don't Retrain—Align: Adapting Autoregressive LMs to Diffusion LMs via Representation Alignment*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

本版本进一步加入 causal/bidirectional attention mask 矩阵实验室、Table 2 精确消融图、论文 Figure 2/3 证据透镜、可见上下文联动、差异化章节动画，以及键盘和移动端交互修复。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 图片来源与许可

- `public/images/figure-2-method.png`：论文 Figure 2。
- `public/images/figure-3-results.png`：论文 Figure 3。

两张图片均来自 Fred Zhangzhi Peng、Alexis Fox、Anru R. Zhang 与 Alexander Tong 的论文 [*Don't Retrain—Align: Adapting Autoregressive LMs to Diffusion LMs via Representation Alignment*（arXiv:2605.06885v1）](https://arxiv.org/abs/2605.06885v1)，按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。图片从论文 PDF 裁切并转换为 PNG，未改动图内内容。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、B 站、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/App.tsx` | 幻灯片导航；含避免方向键抢占滑块/交互控件的焦点保护 | ✅ 小型可访问性修复 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
