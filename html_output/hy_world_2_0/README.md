# HY-World 2.0：多模态三维世界模型 交互式教程

基于论文 *HY-World 2.0: A Multi-Modal World Model for Reconstructing, Generating, and Simulating 3D Worlds*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 论文与素材来源

- 论文：[HY-World 2.0: A Multi-Modal World Model for Reconstructing, Generating, and Simulating 3D Worlds](https://arxiv.org/abs/2604.14268)
- `public/images/figure-2-architecture.png`：摘自论文 Figure 2，用于讲解整体系统架构。
- `public/images/figure-12-worldmirror.png`：摘自论文 Figure 12，用于讲解 WorldMirror 2.0 的多模态重建流程。

上述论文图片仅用于本教程的论文解读和教学展示，版权归原论文作者及其所属机构所有。

## 审查资料

- [参考资料导航](REFERENCES.md)：官方论文、项目主页、GitHub 开放进度、模型平台、许可证、体验页及已核验中文解读。
- [教程修改记录](TUTORIAL_CHANGELOG.md)：按版本记录每次人工优化、依据和验证结果。

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
