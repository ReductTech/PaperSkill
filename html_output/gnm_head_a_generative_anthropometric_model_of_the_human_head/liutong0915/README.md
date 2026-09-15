# GNM Head 交互式论文教程

> 作业编号：101　学生：刘通  
> 论文：*GNM Head: A Generative aNthropometric Model of the human head*  
> 技术栈：React 18 + TypeScript + Vite + Canvas

## 项目说明

本项目把论文的核心问题组织成一条“数字雕塑工作室”学习路径：为什么只有外表的头模不够，GNM 如何通过高分辨率数据、身份/表情线性基、四关节 LBS、局部表情子空间、牙齿/舌头/眼球子模型与双 CVAE 语义采样器，构成完整、可控的显式三维头部先验。

教程含 10 章、13 个论文专属 Canvas 模块、11 个章节主动交互，并保留两项关键边界：几何完整不等于照片级外观；实验结论只适用于论文给出的共同区域和拟合协议。

## 快速运行

建议使用 Node.js 20 或更高版本。

### 最简单的方法

首选直接双击根目录的 `GNM_Head_双击直接打开.html`：它已经内嵌脚本、样式和全部图片，不需要 Node.js 或本地服务器。若被安全软件拦截，再使用 `一键打开网页.cmd`。完整图文步骤见 `请先打开-使用与提交教程.html`。

> 不要直接双击根目录的 `index.html`；React 项目需要本地服务器。

### 开发方式

```bash
pnpm install
pnpm run dev
```

浏览器打开终端显示的本地地址（通常为 `http://localhost:5173`）。如使用 npm，可改为 `npm install` 和 `npm run dev`。

生产构建：

```bash
pnpm run build
pnpm run preview
```

## 演示路线

1. 首页对比“外壳”与“完整解剖”，建立论文问题。
2. 第 1 章点击“传统外壳 / GNM 完整”，再同步张嘴。
3. 第 3 章拖动 β/φ 参数平面，区分身份与表情。
4. 第 5、6 章体验局部表达和内部解剖子模型。
5. 第 8 章逐步点亮双 CVAE 的条件、潜变量、解码器和输出。
6. 第 10 章切换两套评测协议，强调“同一尺子下比较”。

## 资料与交付

- `docs/视频1-论文与网页演示稿.md`：约 4 分 40 秒，含操作提示。
- `docs/视频2-AI协作与导演设计稿.md`：约 4 分 35 秒，说明协作过程与设计取舍。
- `docs/论文事实核对与演示清单.md`：关键数字、论文页码、演示前检查项。
- `public/images/`：从论文 PDF 裁取并本地化的原图/表格，不依赖外链。

论文与代码来源：

- 论文：https://arxiv.org/abs/2607.23687
- 官方代码：https://github.com/google/GNM
- 作业框架：https://github.com/ReductTech/PaperSkill

## 提交注意

- GitHub 目录名建议：`gnm_head_a_generative_anthropometric_model_of_the_human_head/liutong0914/`。
- 提交 PaperSkill 仓库时保留完整源码与本 README，不提交 `node_modules/` 和 `dist/`。
- 公共 PR 前先确认 GitHub 用户名、目录命名和网页逐章显示，再按 PaperSkill README 的 fork → branch → PR 流程操作。

## 内容边界

身份语义条件沿用论文的 2 个性别类别和 4 个宽泛族群类别。它们是训练数据标签，不是完整的人类身份分类；网页将其作为论文局限呈现。头颅和部分遮挡的内部结构也依赖艺术家资产与近似初始化，不能表述为全部由真实扫描直接测得。
