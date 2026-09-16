# MoonSplat：带 Sim(3) 全局优化的单目在线高斯泼溅 交互式教程

基于论文 *MoonSplat: Monocular Online Gaussian Splatting with Sim(3) Global Optimization*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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

## 素材来源与许可

- 论文：*MoonSplat: Monocular Online Gaussian Splatting with Sim(3) Global Optimization*（Guo Pu、Yixuan Han、Haofeng Li、Yao Zhang、Hui Zhou、Zhouhui Lian），arXiv:2606.17935v1，SIGGRAPH Conference Papers '26。
- 论文链接：<https://arxiv.org/abs/2606.17935>
- 本教程内嵌的两张原图均取自该论文，按论文声明的许可协议使用：**CC BY 4.0**（<https://creativecommons.org/licenses/by/4.0/>）。
  - `public/images/figure-1.jpg` — 论文 Figure 1（无人机主动重建系统总览）
  - `public/images/figure-2.jpg` — 论文 Figure 2（方法整体管线）
- 除上述两张论文原图外，本项目未使用任何外部素材；运行时不加载 CDN、外部字体或第三方脚本，唯一可选的联网能力是 B 站视频元信息加载器（本教程未启用）。

## 内容准确性说明

教程正文中的公式、实验数值、评测协议与局限均按论文原文标注；第 1、2、7、9 章中的曲线与收敛条为按论文结论绘制的**示意数据**，已在对应模块说明中注明，不代表论文原始数值。

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
