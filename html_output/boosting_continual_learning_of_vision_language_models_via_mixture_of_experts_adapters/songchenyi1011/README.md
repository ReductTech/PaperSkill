# 借助专家混合适配器提升视觉-语言模型的持续学习 交互式教程

基于论文 *Boosting Continual Learning of Vision-Language Models via Mixture-of-Experts Adapters*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 教程地图（10 章 / 13 个交互模块 / 10 段生活类比动画）

统一生活主题：**水彩调色与上色**（一支画笔、一个调色盘、一排颜料管）。每一章的类比动画只含
一个移动主体、一个动作、一个可见目标。

| 章 | 标题 | 交互模块（交互模式） |
| -- | ---- | ------------------- |
| §1 | 同一支笔反复覆盖：持续学习的两难 | 1.1 微调幅度与旧任务褪色（P1 滑块） |
| §2 | 图文对照：CLIP 的双塔表示 | 2.1 点开双塔结构（P5 可点击热点 + 键盘） |
| §3 | 别在原画上覆盖：贴上可揭下的色片 | 3.1 同一时间轴上的两种改法（P3 同步前后对比） |
| §4 | 按配方取两格颜料：MoE 的加权聚合 | 4.1 top-k 门控（P4 芯片）、4.2 Top-k 掩码与 Softmax（P1 滑块） |
| §5 | 每张画稿配一张配方卡：任务专属路由器 | 5.1 切换任务看专家组合（P4 芯片） |
| §6 | 先试色，再决定去哪个本子 | 6.1 DDAS 判别阈值（P1 滑块） |
| §7 | 调好的罐子要封盖：增量激活—冻结 | 7.1 三种激活组合（P4 芯片）、7.2 冻结演化（P2 分步） |
| §8 | 把适配器装进每一个 Transformer 块 | 8.1 点开数据通路（P5 可点击热点 + 键盘） |
| §9 | 用两格颜料调出同样的色 | 9.1 专家数量与参数量（P1 滑块） |
| §10 | 挂上作品：结果、边界与结论 | 10.1 与 SOTA 同场对比（P8 结果赛跑）、10.2 单一阈值的边界（P2 分步） |

数值均取自论文正文：Table 1（MTIL 的 Transfer / Average / Last）、Table 2（5-shot）、
Table 3–4（CIL）、Table 5（计算开销）、Table 6（消融），以及 DDAS 阈值 0.065 / 0.06。
凡论文未给出的曲线形状或中间取值，画布上均以「示意」标注，仅端点使用论文原值。

## 资源路径与素材来源

- 教程部署在仓库子路径 `papers/<paper-name>/<version>/` 下，因此 `src/data/tutorial.ts`
  中的图片一律写成**相对路径**（`./images/figure-1-ours.png`）。写成 `/images/...` 的根绝对
  路径不会被 Vite 改写，浏览器会去站点根查找而 404。
- `public/images/` 中的图片取自论文原文（Figure 1、Figure 2，CVPR 2024，
  DOI 10.1109/CVPR52733.2024.02191），仅用于教学演示，版权归原作者与 IEEE 所有；
  页面中的论文链接见 `paper.json` 的 `paperUrl`。

## 预留的落点

- 章节内容集中在 `src/data/tutorial.ts`，改文案不需要动组件。
- 新增交互模块：在 `src/modules/` 下实现组件，然后在 `src/modules/registry.tsx` 注册，
  并在 `tutorial.ts` 的 `componentId` 里引用。
- 生活类比的绘图基元在 `src/modules/wcKit.ts`；类比动画工厂在 `src/modules/analogies.tsx`。
