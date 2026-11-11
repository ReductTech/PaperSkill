# CamoFormer：把伪装目标与背景分开看 交互式教程

基于论文 *CamoFormer: Masked Separable Attention for Camouflaged Object Detection*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 论文版本与素材来源

本教程的公式、模型结构、实验数值和图示均依据作者公开的 TPAMI 2024 稿件。元数据中的 arXiv 链接指向同一工作的早期预印本；两版的作者列表和实验内容可能不同，应以本教程引用的期刊稿件为准。

- 教程依据：[TPAMI 2024 作者公开稿件](https://mftp.mmcheng.net/Papers/24PAMI-CamoFormer.pdf)。
- 早期预印本：[arXiv:2212.06570](https://arxiv.org/abs/2212.06570)。
- 作者代码：[HVision-NKU/CamoFormer](https://github.com/HVision-NKU/CamoFormer)。
- `public/images/fig2.png`：原论文 Figure 2，网络结构图。
- `public/images/fig3.png`：原论文 Figure 3，前景注意力示意图。
- `public/images/fig4.png`：原论文 Figure 4，边界区域评价示意图。

上述论文图示为帮助解释论文的学术引用，权利归原作者或相应权利人所有；本项目不对这些图示另行授予许可。其余 Canvas 动画为教学示意，不代表模型真实推理输出；页面对简化公式及假设数据作了说明。
