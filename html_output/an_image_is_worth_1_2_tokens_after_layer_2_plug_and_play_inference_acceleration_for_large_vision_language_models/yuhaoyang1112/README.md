# FastV 交互式论文精读

本教程用 10 章、16 个交互模块讲解 ECCV 2024 论文 *An Image is Worth 1/2 Tokens After Layer 2*。封面用同一张热气球图对照 576 个视觉位置与剪枝后保留的 288 个位置。图中的分数只用于演示排序。第 5 章可以亲手改变剪枝起点 K 和丢弃比例 R，比较按注意力和随机选取得到的图块。

## 打开教程

在包含 `package.json` 的目录中，用 Node.js 22 和 npm 运行以下命令，然后打开终端显示的本地地址。

```sh
npm ci
npm run dev
```

首页的「开始学习 §1」从第一章开始。也可以在目录中选章节，或在页面地址后加上以下片段。窄屏可通过顶部「章节」打开目录。

| 地址片段 | 打开的内容 |
| --- | --- |
| `#chap-5` | 第 5 章，FastV 从哪一层开始剪 |
| `#module-5-1`、`#module-5-2` | 第 5 章的两个交互实验 |
| `#closing` | 按证据分级的结论和复述练习 |
| `#glossary`、`#sources`、`#videos` | 术语、论文与代码出处、两条 B 站视频 |
| `?all=1` | 一次展开全部章节及收束页 |

## 构建与修改

```sh
npm run build
npm run preview
```

构建先运行 TypeScript 检查，再将可部署的静态页面生成到 `dist/`。预览命令从本地提供这份成品。安装依赖和打开论文、代码或 B 站外链需要联网。

| 位置 | 对应内容 |
| --- | --- |
| `src/components/Hero.tsx` | 封面对照图、数字的口径和三条阅读路线 |
| `src/App.tsx`、`src/components/SeriesChapter.tsx` | 目录、逐章展开、章节阅读顺序和直达链接 |
| `src/data/tutorial.ts`、`src/modules/registry.tsx` | 各章教学内容及交互模块的注册关系 |
| `src/modules/ch*.tsx`、`src/modules/paperData.ts` | 交互实验及论文表格数据 |
| `src/modules/pruneState.ts`、`src/modules/stageKit.ts` | 剪枝演示状态、画布与计算量复算 |
| `src/components/SeriesClosing.tsx`、`src/modules/glossary.ts` | 结论分级、术语解释和来源 |
| `src/styles/` | 长页版式、章节和响应式样式 |

## 实验数字怎样读

- **表 1** 对比 LLaVA-1.5-13B 完整模型与 K=2、R=50% 的 FastV。理论 FLOPs 从 154.6B 降到 84.6B，四项任务均分同为 73.6；单项结果见原表。
- **表 4** 在单张 A40 上测量，13B 的 0.341 秒对应 K=0、R=50% 的随机剪枝。它与表 1 使用不同设置。
- **表 5** 在 K=0、R=50% 处列出 78.9B。按正文 §4.2 与教程所列预算复算得到 80.9B，页面分别标明这两个值的来源。

可查阅[正式论文](https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/10478.pdf)、[补充材料](https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/10478-supp.pdf)与[作者代码的固定版本](https://github.com/pkunlp-icler/FastV/blob/d1659729b5bf1be225e99ee15783deeea80f63b1/src/transformers/src/transformers/models/llama/modeling_llama.py#L736-L759)。

## PaperSkill 版本

`paper.json` 记录本版为 `yuhaoyang1112`，源自 `1wumian1 / yuhaoyang1012`。版本沿革由该文件中的 `ancestors` 字段保存。

### 阅读与动效

从目录、路线或「继续」跳转时，页面会短暂滚动到目标。滚轮、触摸或按键都可以随时接管。直接打开章节链接会定位到正文。主要分段控件支持方向键、Home 和 End，拖动滑块时读数与图示同步更新。

系统的「减少动态效果」设置会关闭转场，也可以在预览地址加 `?motion=reduce` 体验，例如 `?motion=reduce#chap-2`。

## 预览与素材

[桌面版第 5 章](docs/preview/chapter5-desktop.png) · [手机版第 5 章](docs/preview/chapter5-phone.png)。两张截图均来自本次提交的构建。教程末尾的视频卡片使用各自视频页的封面，点入后可查看原视频及作者。[FastV 论文报告](https://www.bilibili.com/video/BV16D1vYRE8b/) · [FastV 算法详解](https://www.bilibili.com/video/BV1A2VT6wE6J/)
