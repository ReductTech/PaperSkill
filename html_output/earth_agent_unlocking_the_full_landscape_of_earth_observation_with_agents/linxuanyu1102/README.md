# Earth-Agent 中文交互教程

对应论文：**Earth-Agent: Unlocking the Full Landscape of Earth Observation with Agents**。

- 原文：https://arxiv.org/abs/2509.23141 （教学依据为 arXiv v3，2026-03-03）
- 官方仓库：https://github.com/opendatalab/Earth-Agent
- 官方仓库标注 ICLR 2026；原始预印本发表于 2025 年。

## 运行

需要 Node.js 20+。在本目录运行：

```sh
npm install
npm run dev
```

生产构建使用 `npm run build`，本地预览使用 `npm run preview`。

## 教学内容

教程以社区河岸巡查串联论文主线：研究动机、Earth-Bench 的三类数据、MCP 专业工具包、ReAct/POMDP 决策闭环、AP/IF 查询、双层评测、实验结果与失败边界。第 3 页展示工具调用—观测—记忆更新—下一步决策的完整回路。采用固定 1600×900 的幻灯片画幅，手机可通过舞台缩放查看细节，讲者笔记包含原文定位与教学边界。

## 数据与图形边界

NDVI、温度时间序列、文件校验及调用流程均为透明的合成教学计算，不连接真实地理服务，也不调用在线模型。本文没有提出新的 NDVI 公式。TAO、TIO、TEM、参数前缀与 Efficiency 的定义依据附录 B.2；TIO 衡量专家工具序列的最长前缀能否作为子序列按序出现在预测序列中，预测轨迹中间允许夹有额外工具调用。

实验页分别呈现 Table 1 的完整 Earth-Bench、Table 2 的 Earth-Bench-Lite，以及 Table 3 的分类、检测和 Grounding 基准，不能跨表混排模型。Accuracy 为答案正确率、越高越好；Efficiency 是预测与专家工具调用数之比，不是执行时间，应与正确性一起判断，低于 1 不等于成功。

原文摘要报告 13,729 张图，附录表 4 和表 5 合计 13,737；教程保留差异并采用三类任务数 100/88/60、248 个任务、平均 5.42 步等无冲突统计。论文附录 D 报告五类错误：未识别终止条件、工具幻觉、文件幻觉、无效参数和系统错误。官方仓库后续提及的 training-free evolution 不在 arXiv v3 论文正文中，因此未作为论文贡献呈现。

全部插图为本教程原创 SVG 机制示意，无论文 PDF、原始遥感数据、外部字体或转载图像。论文准确性已由使用者对照原文核验；工程检查不替代人工核验。
