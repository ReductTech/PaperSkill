# HY-Embodied-0.5 交互式教程

基于论文 *HY-Embodied-0.5: Embodied Foundation Models for Real-World Agents*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

页面以“家庭服务机器人在杂乱厨房收拾红色马克杯”为统一场景，用 10 章、11 个主动模块解释从细粒度视觉、Mixture-of-Transformers、视觉潜变量，到 RL → RFT → OPD 和真实机器人评测的完整路径。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 4 分钟汇报

演示路线、逐段操作、口播与时间预算见 [PRESENTATION.md](./PRESENTATION.md)。主路线为：Hero → 第 1 章 → 第 3 章 → 第 6 章 → 第 9 章 → 第 10 章。

## 内容与素材来源

- 论文内容与实验数据来源：[HY-Embodied-0.5: Embodied Foundation Models for Real-World Agents](https://arxiv.org/abs/2604.07430)。
- `public/images/kitchen-baseline.png`、`public/images/kitchen-hy-embodied.png` 与 `public/assets/red-mug-patch.png` 是本教程自制的教学示意素材，不是论文原始图片，仅用于解释页面中的红杯任务场景。
- 页面中的论文结论均通过章节、图表或实验部分标注来源；明确标为“教学示意”的数值与场景不应视为论文实测结果。

## GitHub 提交

课程仓库地址和上级 `nku` README 当前未随工作区提供。获得目标仓库后，在项目根目录执行：

```bash
git init
git add .
git commit -m "feat: add HY-Embodied-0.5 interactive tutorial"
git branch -M main
git remote add origin <课程仓库地址>
git push -u origin main
```

若课程要求把 `paper/` 作为现有仓库的子目录提交，请不要在本目录再次执行 `git init`；应从课程仓库根目录统一提交。

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

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
