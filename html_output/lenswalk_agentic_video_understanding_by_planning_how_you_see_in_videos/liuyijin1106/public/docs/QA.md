# 本地 QA 记录

日期：2026-10-04。

- `npm install`：完成；依赖独立于 Vista4D、V*、Act2See。
- `npm run typecheck`：通过。
- `npm run build`：通过，Vite 8.3.2；Rolldown 对 lucide-react 的 `use client` 指令给出非阻断提示。
- `npm audit --json`：0 个已报告漏洞。初始 Vite 8.0.13 被审计标高危，已升至 8.3.2。
- 浏览器逐章操作：从首页开始，完成 15 个章节的核心交互并到达 Final；最终测验 5/5 正确时显示完成状态。刷新后解锁进度仍在。
- 移动侧边栏“重新开始”将解锁进度清零；刷新后仍保持首页初始状态。
- 视口宽度 1440、1280、1024、768、430、375px：完整 15 章可见时 `documentElement.scrollWidth <= innerWidth`。375px 移动导航打开、选章后关闭正常；实验结果卡可读。
- 作者原图 1 和图 2 分别加载，浏览器自然宽度为 2934 与 6816px；点击可单独放大。
- `public/docs/CLAIM_MATRIX.md` 本地服务 HTTP 200，构建产物含原图与溯源文档。

限制：网页是静态教学交互，未运行作者模型或 benchmark；CVF 论文 PDF 在本次在线读取中返回 403，内容细读采用作者 arXiv 版本。尚未检查屏幕阅读器的实际语音输出。
