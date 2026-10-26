# 暗经验回放：面向通用持续学习的简单强基线 交互式教程

基于论文 *Dark Experience for General Continual Learning: a Strong, Simple Baseline*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 内容与来源

- [NeurIPS 2020 论文与摘要](https://proceedings.neurips.cc/paper/2020/hash/b704ea2c39778f07c617f6b7ce480e9e-Abstract.html)
- [原始补充材料与 2020 随文代码](https://proceedings.neurips.cc/paper_files/paper/2020/file/b704ea2c39778f07c617f6b7ce480e9e-Supplemental.zip)
- [官方 Mammoth 仓库](https://github.com/aimagelab/mammoth)：当前主分支可能与原始随文代码不同。

教程采用连续滚动与目录定位，共 10 章、12 个主动交互模块，覆盖 DER、DER++、水库采样、数学推导、训练时序、实验协议、结果反例与研究延伸。

Canvas 图形和相机 SVG 图标均为本项目代码绘制，未复制论文原图或外部图片。图中教学向量、局部二次函数与采样演示明确标为教学构造；结果表使用论文 Table 2、Table 3 和补充材料 Table 5 的数据摘录。Fig. 1、Fig. 2(a–f) 与补充材料 Fig. 3–4 通过文字说明坐标、实验目的及结论边界，未伪造原图的数值曲线。

网页中的数值演示不是完整神经网络基准复现。原文公式、教程补充推导和待验证研究方案在正文中分别说明；原始配置及复现时的损失归一化、目标保存时刻和数据流约束见第 7–9 章。

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
