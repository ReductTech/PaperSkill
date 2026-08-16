# 守住 Agent：多租户 RAG 的授权边界

基于论文 *Securing the Agent: Vendor-Neutral, Multitenant Enterprise Retrieval and Tool Use* 的中文交互式教程。项目使用 React、TypeScript、Canvas 2D 与 Vite，面向四分钟现场讲解，而不是按论文目录复刻正文。

## 论文与参与者

| 项目 | 信息 |
| --- | --- |
| 论文 | *Securing the Agent: Vendor-Neutral, Multitenant Enterprise Retrieval and Tool Use* |
| 作者 | Francisco Javier Arceo；Varsha Prasad Narsing |
| 会议 | ACM CAIS '26 |
| 论文链接 | [arXiv:2605.05287](https://arxiv.org/abs/2605.05287) · [DOI:10.1145/3786335.3813145](https://doi.org/10.1145/3786335.3813145) |
| 教程参与者 | 祝铭堃（GitHub：[@EricEvans-e](https://github.com/EricEvans-e)） |

## 当前实现

- 7 章、10 个活动模块；
- 7 个完整因果动画、3 个短过渡，以及 1 个 Hero 同步对照；
- 每个不相关模块拥有独立时间轴，只有同一事件的对照视图共享进度；
- 论文实测值和教学示意数据分开管理；
- 桌面投屏是主要展示目标，控件仍保留键盘操作、无障碍说明和 reduced-motion 行为。

核心讲解链为：

```text
相关性泄漏
  -> 安全结果 = 相关集合 ∩ 授权集合
  -> 两级 ABAC 与规模下的谓词下推
  -> 隔离上下文可以共享模型端点
  -> 工具、状态和客户端绕过仍需服务端控制
  -> 一次请求的数据路径与控制路径闭环
  -> 安全、质量和代价证据
```

## 本地运行

要求 Node.js 20+、npm 和 Git。推荐使用名为 `paperskill` 的 Conda 环境：

```powershell
conda activate paperskill
npm install
npm test
npm run build
npm run dev
```

生产构建预览：

```powershell
npm run preview -- --host 127.0.0.1 --port 4174
```

## 七章讲解顺序

| 章节 | 核心问题 | 活动模块 |
| --- | --- | --- |
| 1 | 最相关，为什么仍然会泄密？ | `1.1` 相关性泄漏 |
| 2 | 安全结果从哪里来？ | `2.1` 安全集合；`2.2` 可信 owner 传播 |
| 3 | 门控怎样兼顾安全与检索质量？ | `3.1` 两级 ABAC；`3.2` 后过滤与谓词下推 |
| 4 | 租户需要隔离，为什么模型还能共享？ | `4.1` Shared Inference |
| 5 | 检索之外，Agent 还会从哪里泄密？ | `5.1` 工具/状态回流；`5.2` 三类编排绕过 |
| 6 | 完整架构如何落到 OGX？ | `6.1` 一次 Finance 请求的安全闭环 |
| 7 | 实验究竟证明了什么，代价是什么？ | `7.1` 安全、质量、代价三问 |

## 动画与时间轴

完整动画为 `1.1 / 2.1 / 3.1 / 3.2 / 4.1 / 5.2 / 6.1`；短过渡为 `2.2 / 5.1 / 7.1`。Hero 的传统 RAG 与论文方法共享 4.5 秒进度，因为两栏展示同一个 Finance 查询。

所有完整时间轴支持播放、暂停、重播、`0.001` 精度拖动和 `0.5× / 1× / 1.5×` 切换。`4.1` 默认 `1.5×`，便于快速展示模型收束；`6.1` 默认 `0.5×`，便于讲解完整请求闭环。其他完整动画默认 `1×`。

## 证据边界

- 论文测量值集中在 `src/modules/evidence/paperEvidence.ts`；
- Finance、Engineering、Legal 教学语料集中在 `src/modules/evidence/scenarios.ts`，并标记为示意数据；
- §3 的四个规模锚点是论文实测值，锚点之间只做明确标注的视觉插值；
- 谓词下推时延没有统一论文数字，页面不会推造；
- Shared Inference 只保证授权上下文隔离，不保证模型参数记忆隔离；
- 约 19 ms、约 3 s 和并发 25 QPS 来自不同协议，不共享定量轴。

## 素材来源

`public/images/figure-1.png` 与 `public/images/figure-4.png` 提取自上述论文的 Figure 1 和 Figure 4，用于带出处的学术教学与评论。图片版权仍归论文作者或出版方；公开发布时应遵守论文和目标仓库的素材审核要求。

扩展材料中的 B 站封面来自其对应视频页面，默认折叠且只有展开时才加载。

## 代码结构

| 路径 | 职责 |
| --- | --- |
| `src/data/tutorial.ts` | 七章内容、模块、公式和论文元信息 |
| `src/animation/` | 独立时间轴、连续输入和 Canvas 生命周期 |
| `src/modules/*.tsx` | 论文专属交互模块与纯场景模型 |
| `src/modules/evidence/` | 论文证据与教学场景 |
| `src/modules/shared/` | Canvas 绘制与实验模块外壳 |
| `src/styles/paper.css` | 页面及动画样式 |
| `public/images/` | 带来源说明的论文图像 |

实现说明见 [`docs/architecture.md`](docs/architecture.md)，最新验收记录见 [`docs/verification.md`](docs/verification.md)，PaperSkill 提交交接见 [`docs/submission.md`](docs/submission.md)。

## 提交边界

最终成果必须作为完整 React + TypeScript 项目导入 PaperSkill 的 `html_output/<paper-name>/`，不能只提交单个 HTML 或 `dist/`。不得提交 `node_modules/`、构建产物、浏览器临时文件、密钥、个人隐私或本机绝对路径。
