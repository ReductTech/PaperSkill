# MiniMax Sparse Attention 交互学习网页

作者公开名：zhenghewen；GitHub：yuzhe-428。

基于 [PaperSkill](https://github.com/ReductTech/PaperSkill) 1.3.0 官方模板生成，底层 React 18 + TypeScript + Vite。主题为“在厚资料册中找到证据”，包含 10 章、11 个主动交互模块、生活类比动画、可点击公式解释、实验数据与边界判断。

## 运行

需要 Node.js 20+ 与 npm。建议 Node.js 22 LTS 或更新受支持版本。

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

终端会显示实际本地地址，默认端口 5173。若端口已占用，以终端输出为准。

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

构建产物位于 `dist/`。直接用文件管理器打开源目录的 `index.html` 不会启动 React 工程；请使用上面的 HTTP 预览方式。

## 内容与交互

1. 长上下文的二次配对成本。
2. 可拖动的 query、GQA 共享结构与因果遮罩。
3. token 分数 → block max → Top-k → 主分支支持集。
4. 预算与 Eq.12 FLOPs 计算器。
5. GQA 组间独立选块。
6. 真正计算完整/稀疏 softmax 的数值对照。
7. 固定老师下的 KL 概率优化。
8. 可点选的双分支结构与张量维度。
9. warmup、detach、exp-free、KV-outer 的机制解释。
10. 同协议实测结果对比与结论边界检查。

核心文本在 `src/data/tutorial.ts`；定制交互在 `src/modules/`。保留 PaperSkill 框架文件和默认页面风格。Canvas 支持设备像素比、离屏暂停和减少动态效果设置；主要控件提供键盘访问。

## 来源与事实边界

- 论文：[MiniMax Sparse Attention，arXiv:2606.13392v2](https://arxiv.org/abs/2606.13392v2)，2026-06-12。
- 作者实现：[MiniMax-AI/MSA](https://github.com/MiniMax-AI/MSA)。
- Eqs.5–8：索引与主分支；Eqs.9–11：KL 与停止梯度；Eq.12：复杂度；Tables2–6：实验与消融；Fig.4：注意力效率。
- 教学示例不代表真实模型激活；浏览器没有重训 109B 模型，也没有重新执行 H800 基准测试。
- 2048 是每个 query 每组的选中 token 上限，不是整个 KV 缓存的容量。
- 1M 注意力效率与 128K 质量评测的实验条件分开展示。

页面中的 Canvas 图由本项目代码绘制；没有打包论文 PDF、课堂照片或课堂视频。延伸视频使用 Bilibili 的公开链接与元数据，只作为应用背景，不作为论文结论的来源；网络不可用时不影响核心学习模块。

## 提交说明

使用官方仓库导入脚本生成 `paper.json`，实际待提交目录为 `html_output/minimax_sparse_attention/zhenghewen0914/`。如果同名版本已存在，应以导入脚本返回的新版本目录为准，不覆盖他人内容。

不得提交 `node_modules/`、`dist/`、构建预览 HTML、课程脚本、临时文件、论文 PDF 或自动生成的总目录索引。只提交完整教程源码版本目录；Pull Request 合并与正式发布状态由仓库维护者审核决定。
