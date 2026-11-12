# VisionZip 中文交互精读

本项目使用 React、TypeScript 和 Vite。封面、七章正文、结论分级、术语表和视频卡片共用一个长滚动页面。

## 启动

安装 Node.js 22.12 或更高版本，在解压目录运行以下命令。

```sh
npm ci
npm run dev
```

打开终端显示的本地地址。`/#chap-2` 进入灯塔实验，`/#table-5` 直达候选池对照，`/#module-4-3` 查看投影层微调。`/#chap-5` 和 `/#chap-6` 分别进入高分辨率图像和视频理解，`/#chap-7` 进入五种方法对照。`/?all=1` 一次展开全文。

## 构建与检查

```sh
npm run build
node scripts/check-lab.mjs
```

双击 `dist/index.html` 即可离线阅读。页面代码、插画和视频封面均已内嵌。访问论文、作者代码或视频原页需要网络。

如已安装 PaperSkill，可从其仓库运行 `node paper-skill/scripts/syntax-check.js <项目目录> --require-parser` 与 `node paper-skill/scripts/validate-output.js <项目目录>`。

## 对照阅读

- `src/App.tsx` 与 `src/styles/series.css` 负责目录、逐章展开、章节定位和响应式版式。
- `src/modules/Lab.tsx` 与 `labModel.ts` 实现 4 × 6 的教学实验。点击固定 A1–D6 中的一个坐标，悬停或键盘聚焦可临时查看其他位置。G1 等表示上下文组。小矩阵、注意力和特征来自确定性的教学数据。
- `src/modules/ChapterReading.tsx` 提供七章的开篇问题、向量手算和延伸读表。
- `src/data/glossary.ts` 维护正文与术语表共用的定义。
- `src/components/Hint.tsx` 为图格、术语和公式提供同一套就地释义。`src/modules/TableFive.tsx` 使用 CVPR 正文图 5、图 6(b) 节选及表 5 的 TextVQA 分数。
- `src/data/table1.ts` 按正式版表 1 的列次序保存原始分、论文刊载的单项保留率和 Avg.。
- `src/modules/Budget.tsx` 对照作者提交 `8f86b55` 的固定分辨率 LLaVA/CLIP 路径。
- `src/modules/Results.tsx` 记录论文实验值及表号。B 站视频信息在 `src/data/tutorial.ts`，本地封面来自各视频的原始页面。
- `src/modules/HighResolution.tsx` 对照正文表 2 和补充表 7，`src/modules/VideoUnderstanding.tsx` 对照正文表 3 和补充图 8。

### 阅读与动效

从目录、路线或「继续」跳转时，页面会短暂滚动到目标。滚轮、触摸或按键都可以随时接管。直接打开章节链接会定位到正文。主要分段控件支持方向键、Home 和 End，拖动滑块时读数与图示同步更新。

系统的「减少动态效果」设置会关闭转场，也可以在预览地址加 `?motion=reduce` 体验，例如 `?motion=reduce#chap-2`。

## 插图与数据来源

- 灯塔、帆船及四行六列实验网格是本教程绘制的教学示意。实验中的注意力和向量取自教学数据。
- 第 1 章的分层街景注意力图和人物示例分别节选自论文图 5 和图 6(b)。图像下方链接至对应原页。表 1–5 的数据来自正文，高分辨率预算及长视频案例另见补充表 7 和补充图 8。[CVPR 2025 论文](https://openaccess.thecvf.com/content/CVPR2025/papers/Yang_VisionZip_Longer_is_Better_but_Not_Necessary_in_Vision_Language_CVPR_2025_paper.pdf) · [补充材料](https://openaccess.thecvf.com/content/CVPR2025/supplemental/Yang_VisionZip_Longer_is_CVPR_2025_supplemental.pdf)
- 两张延伸视频卡使用对应视频页的封面，卡片标明视频作者并链接原页。[图明讲算法的 VisionZip 讲解](https://www.bilibili.com/video/BV1wLGU66EWm/) · [跟李沐学AI的 ViT 精读](https://www.bilibili.com/video/BV15P4y137jb/)
