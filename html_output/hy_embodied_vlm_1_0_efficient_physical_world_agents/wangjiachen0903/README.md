# Hy-Embodied-VLM-1.0：高效物理世界智能体 交互式教程

基于论文 *Hy-Embodied-VLM-1.0: Efficient Physical-World Agents*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。当前为 7 章、21 个交互模块。

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

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。

## 论文来源

- 标题：Hy-Embodied-VLM-1.0: Efficient Physical-World Agents
- 论文链接：https://arxiv.org/pdf/2607.12894
- 作者机构：Tencent Robotics X / Hy Vision Team / Futian Laboratory
- 本教程页面仅供学习与课程展示，论文版权归原作者所有。

## 章节结构

1. 这篇论文在解决什么问题？
2. 核心贡献 1：以动作中心的三级能力分类法
3. 核心贡献 2：围绕分类法构建的系统化数据管线
4. 核心贡献 3：高效的模型架构
5. 核心贡献 4：自演化训练管线
6. 核心贡献 5：大规模评测与闭环验证
7. 总结：五条贡献合成一个完整答案
