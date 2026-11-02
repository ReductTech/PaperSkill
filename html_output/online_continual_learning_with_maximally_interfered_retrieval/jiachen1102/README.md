# MIR：最大干扰检索的在线持续学习 交互式教程

基于论文 *Online Continual Learning with Maximally Interfered Retrieval*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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


## 论文、源码与教学边界

- 论文：Online Continual Learning with Maximally Interfered Retrieval，NeurIPS 2019。会议元信息及 BibTeX 将标题写作 Maximal Interfered Retrieval，指同一篇论文。
- [官方论文页面](https://proceedings.neurips.cc/paper/2019/hash/15825aee15eb335cc13f9b559f166ee8-Abstract.html)
- [官方补充材料](https://proceedings.neurips.cc/paper_files/paper/2019/file/15825aee15eb335cc13f9b559f166ee8-Supplemental.zip)
- [官方代码](https://github.com/optimass/Maximally_Interfered_Retrieval)，当前主分支不等同于已经固定版本的 2019 随文实现。

页面采用连续滚动、目录定位与手机抽屉。共 10 章、12 个主动交互模块，包含完整评分与梯度推导、ER-MIR / GEN-MIR / AE-MIR、主实验与消融、四遍阅读路径和十二项精读记录。

所有乐器、示意图与图形均由本项目代码绘制，未复制论文原图。教学向量、二次函数与候选点明确标记为教学构造；论文结果使用正文 Tables 1–6 数据及已说明的条件。Fig. 1–4 与学习曲线通过文字解释目的、坐标和结论边界，不伪造数字化曲线。教学数值检查不等于完整神经网络基准复现。

特别区分：每类记忆量与全局容量、单次数据遍历与优化步数、当前难度与损失增量、虚拟参数与正式参数起点、原始公式与条件近似、生成式与混合方法的任务边界和离线训练要求。研究延伸是待验证方案，未声称已确认新颖性。
