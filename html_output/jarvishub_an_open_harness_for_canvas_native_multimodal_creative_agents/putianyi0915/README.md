# JarvisHub：面向画布原生多模态创意智能体的开放 Harness 交互式教程

基于论文 *JarvisHub: An Open Harness for Canvas-Native Multimodal Creative Agents*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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
| `public/images/*` | 论文原图 Figure 4–9（来源见下节） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 素材来源

### 论文原图（`public/images/`）

6 张图片均取自本教程所讲解论文的原图，由教程作者从论文 PDF 中裁切，未做内容修改：

| 文件 | 论文出处 | 内容 |
| ---- | ---- | ---- |
| `fig4.png` | Figure 4 | 叙事媒体生成案例的工作区轨迹 |
| `fig5.png` | Figure 5 | 叙事媒体生成案例的最终产物 |
| `fig6.png` | Figure 6 | 交互式网页开发案例的工作区轨迹 |
| `fig7.png` | Figure 7 | 交互式网页开发案例的最终产物 |
| `fig8.png` | Figure 8 | 演示文稿生成案例的工作区轨迹 |
| `fig9.png` | Figure 9 | 演示文稿生成案例的最终产物 |

- 论文：*JarvisHub: An Open Harness for Canvas-Native Multimodal Creative Agents*
- 链接：<https://arxiv.org/abs/2607.23588>
- 版权归论文原作者与出版方所有，此处仅用于教学讲解与评论引用。

### 延伸观看（Bilibili）

`src/data/tutorial.ts` 的 `bilibili` 字段内嵌 4 条 B 站视频的 `bvid`、真实标题、封面地址与播放量，均通过 Bilibili 公开接口读取；视频版权归各 UP 主所有，本站仅作跳转链接，不转载任何视频内容。

### 论文引用

- 论文信息与链接记录在 `paper.json`（`paperUrl`）。
- 页面内的公式、术语、实验设置与局限说明均标注了对应的论文出处章节。

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
