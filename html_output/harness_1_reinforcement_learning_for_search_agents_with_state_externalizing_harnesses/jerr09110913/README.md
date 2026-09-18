# Harness-1 交互论文教程

本轮从 paper-skill 原生 React + TypeScript + Vite 模板独立搭建，九章、十个主动模块。论文版本为 [arXiv:2606.02373v1](https://arxiv.org/html/2606.02373v1)。

## 启动

在本文件所在文件夹打开终端，运行：

```bash
npm install
npm run dev
```

打开终端打印的本地网址。`index.html` 是 Vite 入口，不能靠双击启动。

```bash
npm run build
npm run preview
node src/modules/model-audit.cjs
```

前两条分别检查生产构建、预览构建；最后一条复算确定性教学状态与数据。交付以源项目为准，不包含预先构建的 `dist/` 或模型权重。

## 本轮依据

教学方向与数据来自用户的《Harness-1_最终构建导演本》v0.5.1、《11_逐章主交互落地规范》《12_交互材料与确定性数据》及逐章科学来源。

最新用户决定：第一章按最新决定使用网上搜索场景、A/B/C八段动画，Agent自称“我”、称提问者“用户”；各章类比卡在技术模块之前独立展示，封面允许结合。第3章另保留与主交互共享状态的辅助类比；不将独立自动类比卡计入主动模块。全部章节仍能脱离类比理解。

正文区分三类材料：虚构的确定性教学例子、附录Q.5公开案例节选、论文实测结果。网页不运行真实检索模型、核验模型或训练优化器。作者未公开的轮次、核验返回、完整最终集合保持未知。

## 章节与操作

| 章 | 主题 | 主操作 |
|---|---|---|
| 1 | 传统搜索 | 用户任务→历史累积→遗漏定位→回查，八段动画 P2 |
| 2 | 框架构成 | 选择搜索/回看路径 P5 |
| 3 | 过程对比 | 同事件同步推进 P3 |
| 4 | 工作记忆与重要性 | 拖动标签预览/提交 P6 |
| 5 | 证据关联与核验 | 实体—文档热点与逐句支持 P5 |
| 6 | 上下文管理 | 预算滑杆改变实际输入 P1 |
| 7 | SFT与RL | 示范样本、终局情形切换 P4，两个模块 |
| 8 | 完整运行 | 公开轨迹与可修订教学分支 P2 |
| 9 | 结果与局限 | 用户启动同协议实测比较 P8 |

## 修改范围

论文内容在 `src/data/tutorial.ts`，交互和确定性计算在 `src/modules/`，场景颜色在 `src/styles/paper.css`。共享组件、导航、字体、布局样式和工程配置沿用模板。图5以完整本地SVG保留原曲线与坐标，其余必要位置提供精确原文链接；交互图形是注明来源的教学改编。

实际检查记录见 `QA.md`。源项目就绪与正式发布、课程提交、视频录制是不同完成状态；本轮不自动发布或提交到课程仓库。

## 2026-09-14 全文文案修订

九个章节标题不变；第一章明确A公司、B项目。第三章改为B项目两个日期的七段同步动画，一次点击只播放一段。全文小标题和重要说明按论文重新审查，详见上级策划目录的13号文档。


## 2026-09-15 模板与交互修正

恢复原版App.tsx与components.css，各章独立类比卡置于技术模块之前。专用样式在src/modules/module-ui.css，未改共享字体、间距和导航。奖励公式定义在tutorial.ts，InteractiveFormula复用原版Formula，并提供键盘操作和局部窄屏适配。

第4章筛选、第5章核验、第6章预算、第7章奖励反馈按状态显示颜色与文字标记。压缩重复操作说明，保留任务材料、工具返回、来源和适用范围。生活／混合模块配额沿用用户正文隔离例外，不补造四个混合模块；当前第3章保留额外联动类比，自动类比卡不算主动模块。


## 图片与外部素材来源及许可

核对日期：2026-09-15。论文作者：Pengcheng Jiang、Zhiyi Shi、Kelly Hong、Xueqiang Xu、Jiashuo Sun、Jimeng Sun、Hammad Bashir、Jiawei Han。
论文标题：*Harness-1: Reinforcement Learning for Search Agents with State-Externalizing Harnesses*。

[arXiv 论文页面](https://arxiv.org/abs/2606.02373v1)的“view license”链接指向 [Creative Commons Attribution 4.0 International（CC BY 4.0）](https://creativecommons.org/licenses/by/4.0/)。下列论文图片按该许可保留作者署名、原始来源和许可链接；未发现这些图单独标注不同的第三方许可。本教程为独立教学作品，不表示论文作者认可或背书。

| 本地文件（均在 `public/images/`） | 原文位置与原文件 | 修改情况 |
|---|---|---|
| `teaser_recall_barchart.png` | [Figure 1](https://arxiv.org/html/2606.02373v1#S0.F1) · [原文件](https://arxiv.org/html/2606.02373v1/teaser_recall_barchart.png) | 原样复制 |
| `method_figure.png` | [Figure 2](https://arxiv.org/html/2606.02373v1#S1.F2) · [原文件](https://arxiv.org/html/2606.02373v1/method_figure.png) | 原样复制 |
| `ood_asymmetry.svg` | [Figure 3](https://arxiv.org/html/2606.02373v1#S3.F3) · [原文件](https://arxiv.org/html/2606.02373v1/ood_asymmetry.svg) | 原样复制 |
| `training-dynamics.svg` | [Figure 5](https://arxiv.org/html/2606.02373v1#S3.F5) · [原文件](https://arxiv.org/html/2606.02373v1/training_dynamics_combined.svg) | 仅重命名；图片内容不变。页面的焦点框是单独的界面叠层 |
| `answer_accuracy.svg` | [Figure 6](https://arxiv.org/html/2606.02373v1#A15.F6) · [原文件](https://arxiv.org/html/2606.02373v1/answer_accuracy.svg) | 原样复制 |
| `harness_comparison.png` | [Figure 7](https://arxiv.org/html/2606.02373v1#A16.F7) · [原文件](https://arxiv.org/html/2606.02373v1/harness_comparison.png) | 原样复制 |

上述六个本地文件与原始下载文件的 SHA-256 全部一致。网页按视口缩放显示图片，不重画原图曲线或插值生成实验数据。论文表格的交互重排、中文说明和代码绘制的教学示意为本教程的改编，相关章节保留论文出处；虚构机构、文档及交互状态明确属于教学例子。

### 延伸视频

以下卡片链接到 B 站公开视频页面，不下载或重新分发视频文件。卡片封面通过 B 站图片 CDN 外链加载，图片未打包进本项目；标题、播放量及运行时补充信息来自推荐数据和平台接口。下列名称是教程中的推荐标签，原始标题、上传者与许可信息以链接页面为准。

- [AI Agent 原理背景课程](https://www.bilibili.com/video/BV1VJsuzZE4Z)
- [上下文工程背景课程](https://www.bilibili.com/video/BV1DjLF6xEXM)
- [网络搜索、TFIDF/BM25 背景课程](https://www.bilibili.com/video/BV1zp4y1e7iN)
- [强化学习与 GRPO 背景讲解](https://www.bilibili.com/video/BV1s16UB7Eop)；仅作背景，论文使用 CISPO，不能混同。

视频及其封面不适用上述论文的 CC BY 4.0 许可；目前未核实单独的封面转载授权，也不主张拥有这些素材的版权。保留封面作为指向原视频的推荐入口；外链加载方式不等于取得授权。

封面来源（顺序与以上视频一致）：

- BV1VJsuzZE4Z：https://i0.hdslb.com/bfs/archive/b8c1c1dff121608e127f413d83a44c47917b593b.jpg
- BV1DjLF6xEXM：https://i2.hdslb.com/bfs/archive/5379f17bbda7c7ba680fe72527554a67d9ead629.jpg
- BV1zp4y1e7iN：https://i2.hdslb.com/bfs/archive/29cd3136fb0f179a296c515316ee37ab5959a437.jpg
- BV1s16UB7Eop：https://i1.hdslb.com/bfs/archive/59fdd72a0bd45137462592d27cd28cd97087f5f6.jpg

论文案例中的 Wikipedia URL 作为原文来源引用保留，项目未打包 Wikipedia 页面或其媒体文件。

### 项目界面与截图

交互图形由 React、SVG、Canvas 与 CSS 代码绘制，使用系统字体；未打包第三方字体文件。React、Vite 等软件依赖由锁文件记录，遵循各自许可证，不将论文 CC BY 4.0 许可扩展到这些软件依赖。

`docs/screenshots/` 为本项目实际浏览器截图，由本次提交准备过程生成，展示本教程界面及上述已注明来源的内容。


## 封面与第8、9章更新（2026-09-15）

在已收录版本基础上更新，不更换版本目录或正式教程地址。

- 封面改为同步事件演示：同一资料与动作，比较历史累积和当前精选视图；保留传统方法与本文方法的文字说明。
- 第8章采用七个公开轨迹节点、可查看的证据原文和独立选证练习。练习选择与公开轨迹状态相互独立，不补造作者未公开的核验返回。
- 第9章以统一零基线的竖向柱状图呈现实验比较，保留方法、指标、基准、固定模型与消融切换；未修改对应实验数值。
- 第1—7章交互模块保持原样；视频封面仍按既有方式通过外链加载，来源与许可说明沿用上文。
