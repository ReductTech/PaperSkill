# SpinQuant：用学习到的旋转矩阵做 LLM 量化 交互式教程

基于论文 *SpinQuant: LLM Quantization with Learned Rotations*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 图片来源

| 文件 | 来源 |
| ---- | ---- |
| `public/images/S1_F1.png` | 论文 Figure 1：Overall diagram of rotation（arXiv:2405.16406） |
| `public/images/S2_F2.png` | 论文 Figure 2：Activation distribution before/after rotation（arXiv:2405.16406） |
| `public/images/S3_F5.png` | 论文 Figure 5：Rotation equivalence in Multi-Head Self-Attention（arXiv:2405.16406） |
| `public/images/S4_F6.png` | 论文 Figure 6：How rotation helps reduce outliers and maximize quantization（arXiv:2405.16406） |

以上图片均提取自 SpinQuant 论文原文（arXiv:2405.16406，ICLR 2025），仅用于该论文的交互式教学教程。
