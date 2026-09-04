# 归一化轨迹模型 交互式教程

基于论文 *Normalizing Trajectory Models*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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
| `src/lib/*` | 静态工具（canvasKit / 渐进加载 / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 论文原图来源

`public/images/paper/` 下的图片全部取自论文 arXiv HTML 版
（[arxiv.org/html/2605.08078](https://arxiv.org/html/2605.08078)），仅用于教学展示，版权归原作者所有：

| 文件 | 论文编号 | 内容 |
| ---- | ---- | ---- |
| `teaser_v1.jpeg` | 图 2 | 去噪轨迹对比：流匹配 50/4 步 vs NTM 4 步 |
| `ntm_comparison.png` | 图 8 | TarFlow / NTM / 扩散模型三者谱系 |
| `multi_traj.jpeg` | 图 6 | 同一 NTM 以 T=4/8/16 采样 vs FLUX 50 步 |
| `qualitative_2x2.png` | 图 7(a) | 微调不加均值对齐损失（发散） |
| `qualitative_2x2_2.png` | 图 7(b) | 微调加均值对齐损失（正常） |
| `shallow_denoiser.png` | 图 7(c) | 轨迹分数去噪 vs 学习去噪器 |
| `failure_1step.png` | 图 9 | T=1 单步生成的失败案例 |
| `qualitative_main.jpeg` | 图 1 | 4 步文生图样本（从头训练 + 微调） |

论文中的图 3（框架总览）、图 4（微调对齐）、图 5（去噪器训练）为矢量流程图，
已按原图语义在 `src/modules/m3-frame.tsx` 等交互组件中重绘。

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
