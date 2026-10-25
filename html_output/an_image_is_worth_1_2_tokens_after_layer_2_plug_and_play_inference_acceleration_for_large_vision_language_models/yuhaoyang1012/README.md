# FastV 剧场精读：图像在第 2 层后只值一半 Token

基于论文 *An Image is Worth 1/2 Tokens After Layer 2: Plug-and-Play Inference Acceleration for Large Vision-Language Models*（Chen et al., ECCV 2024）的交互式中文教程。以 PaperSkill 的 React + TypeScript + Vite 模板为基础，共 10 章、16 个交互模块。

## 本地运行

需要 Node.js 18+（开发时用 Node 24 验证）。

```bash
npm ci            # 按 package-lock.json 安装（也可用 npm install）
npm run dev       # 开发预览 http://localhost:5173
npm run build     # tsc 类型检查 + vite build，产出 dist/
npm run preview   # 预览构建结果
```

本压缩包不含 `node_modules/` 和 `dist/`，首次运行前需要先安装依赖。项目不使用任何密钥或环境变量。

## 目录结构

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 论文内容：10 章的章节、模块、公式、深读、易错点 |
| `src/modules/registry.tsx` | 交互组件注册表（componentId → 组件） |
| `src/modules/ch*.tsx`、`heroStage.tsx`、`analogies.tsx` | Canvas 交互组件 |
| `src/modules/stageKit.ts` | 绘图工具 + 13B 论文口径 FLOPs 复算（`paperFlopsB`） |
| `src/modules/paperData.ts` | 从论文表格/图中摘录的数据 |
| `src/modules/glossary.ts` | 论文/补充材料/代码链接（代码固定到具体 commit）、术语表、证据定位表 |
| `src/modules/popover.ts` | 术语 / 证据 / 公式符号弹注（悬停、点按、键盘、Esc） |
| `src/modules/panels.tsx` | 论文 vs 代码、FLOPs 核对、评测协议、实现方式、结论分级等静态面板 |
| `src/modules/layout.tsx`、`ui.tsx` | 页面版式组件、移动端检测、Canvas 横向平移容器、章节导航 |
| `src/styles/paper.css` | 本教程的全部视觉样式（暗色电影感主题） |
| `src/components/*`、`src/lib/*`、`src/styles/{tokens,components}.css` | PaperSkill 模板原有文件，未改动 |

## 与 PaperSkill 官方模板的差异（提交前请审阅）

模板约定只修改数据文件、`paper.css` 和 `src/modules/*`。本项目为实现长滚动叙事和移动端适配，**超出了这一范围**，官方校验时可能需要调整：

1. **`src/App.tsx` 被重写**：改为单页长滚动（章节导航浮钮、滚动进度条、渐显动画），不再使用模板的翻页结构和侧边索引。
2. **`src/types.ts` 有扩展**：`FormulaDef` 增加 `eq`、`summary`；`ChapterDef` 增加 `nav`、`panels`、`deepDive`、`pitfalls`，`analogy` 改为可选。
3. **`index.html` 视口**改为 `width=device-width, initial-scale=1, viewport-fit=cover`，用于手机端重排。
4. `src/modules/` 下新增了非 Canvas 的辅助文件（`glossary.ts`、`popover.ts`、`panels.tsx`、`layout.tsx`、`ui.tsx`、`cinema.ts`）。
5. 未使用 B 站推荐：`tutorial.ts` 不提供视频数据，模板的 `BiliVideos` 组件保留但不渲染。

已通过 PaperSkill 的 `syntax-check.js` 与 `validate-output.js`（10 章、16 模块）。

## 关于在线 Artifact 版本

在线 Artifact 是本项目 `npm run build` 的产物（一个 HTML 外壳 + 构建出的 CSS/JS），与本源码同一版本，不能替代本工程。修改请在源码中进行并重新构建。

## 内容口径说明

- “理论 FLOPs”为按论文 §4.2 / Eq. 5 的公式复算（13B：d=5120、m=13824、T=40，576 个图像 token + 36 个文本 token），能复现 Table 1 各配置；K=0、R=50% 复算为 80.9B，与 Table 5 的 78.9B 不一致，原因未知，页面已注明。
- 理论 FLOPs、首 token 延迟、单样本/端到端延迟、显存是不同指标，页面分别标注；Table 4 为 K=0 随机剪枝。
- 教学示意、公式外推和论文实测在页面中分开标记。

## 论文与素材来源

- 正式论文：https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/10478.pdf
- 补充材料：https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/10478-supp.pdf
- 官方实现：https://github.com/pkunlp-icler/FastV/blob/d1659729b5bf1be225e99ee15783deeea80f63b1/src/transformers/src/transformers/models/llama/modeling_llama.py#L738-L746
- 页面插图与动画由项目自身的 Canvas 代码绘制；未打包论文 PDF、原论文图片、第三方字体、视频或其他外部媒体素材。数值、读图近似值和教学示意的来源与口径在正文及证据弹注中标明。
- 导入官方仓库时，仅调整了 Figure.tsx 与 types.ts 中两处图片路径示例注释，避免资源路径扫描器将反例误判为实际引用；未改变这两个文件的运行逻辑。
