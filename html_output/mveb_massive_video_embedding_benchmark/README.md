# MVEB：大规模视频嵌入基准 交互式教程

基于论文 *MVEB: Massive Video Embedding Benchmark*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 资料来源

- 论文：[*MVEB: Massive Video Embedding Benchmark*](https://arxiv.org/abs/2606.14958)
- 官方实现与榜单：[embeddings-benchmark/mteb](https://github.com/embeddings-benchmark/mteb)
- 页面末尾的补充视频均以 Bilibili 链接形式引用：[`BV1obiLeREDh`](https://www.bilibili.com/video/BV1obiLeREDh)、[`BV1JxbczxEYW`](https://www.bilibili.com/video/BV1JxbczxEYW)、[`BV17h41177ey`](https://www.bilibili.com/video/BV17h41177ey)

本项目没有打包论文原文或外部图片；图表与动画均由页面代码绘制。若后续加入第三方素材，应在此补充来源与授权信息。

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
