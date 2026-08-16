# VideoCoCo 交互式论文教程

本项目围绕论文 **VideoCoCo: Code-as-CoT for Physically-Consistent Video Generation via an Agentic Dual-Engine System**，以中文交互网页讲解 Causal Opacity、Code-as-CoT、双引擎框架、VideoCoCo-3K、实验结果与论文局限。

- 论文：[arXiv:2607.27380](https://arxiv.org/abs/2607.27380)
- 官方项目：[micky-li-hd/VideoCoCo](https://github.com/micky-li-hd/VideoCoCo)
- 技术栈：React 18 + TypeScript + Vite

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

本项目是完整的 Vite 源码工程，提交时应保留 `src/`、`public/`、`package.json`、`package-lock.json`、`index.html`、`vite.config.ts` 和 `tsconfig.json`，不能只提交 `index.html` 或 `dist/`。

## 教学内容与交互

- 通过案例解释文本到视频中的 Causal Opacity。
- 展示 Prompt → Code → Draft → Final Video 的双引擎工作流。
- 交互比较 Planning CoT、Test-Time Search CoT、Visual-State CoT 与 Code-as-CoT。
- 通过可操作画布讲解草稿与编辑指令的职责分工。
- 展示 PhyGenBench、VBench-2.0 与编辑器适配消融结果。
- 明确说明额外推理延迟、Blender 表达能力和复杂湍流等适用边界。

## 素材来源与性质

为避免将教学演示误认为论文实验结果，素材来源说明如下：

| 素材 | 来源与用途 |
| --- | --- |
| `figure-1.png`、`figure-2.png`、`figure-3.png` | 摘自论文原图，用于学术讲解并保留 Figure 编号与论文链接。 |
| `figure3-*.png` | 从论文 Figure 3 裁切的案例区域，用于切换展示真空坍缩、升华、冲击和浮力案例。 |
| `video.mp4`、`seedance.mp4`、`edit_prompt.txt` | 来自 VideoCoCo 官方仓库公开的 toy dataset，用于说明 draft–instruction–target 三元组；使用时遵循官方仓库的研究用途与许可证说明。 |
| `problem-*.mp4`、`problem-root-video.mp4` | 为本教程制作/提供的教学演示视频，不是论文官方实验结果。 |
| `butter-draft-frames.png`、`butter-final-video.mp4` | 根据论文 Figure 2 黄油案例制作/整理的教学重构素材，不作为论文报告结果。 |

论文与官方仓库的著作权、数据及模型许可证归原作者和相应权利人所有。本项目仅用于论文学习、课堂展示与学术交流。

## PaperSkill 仓库提交

正式提交目录名应使用论文英文全称的小写下划线形式：

```text
videococo_code_as_cot_for_physically_consistent_video_generation_via_an_agentic_dual_engine_system
```

在 PaperSkill 仓库根目录使用官方 `npm run import` 命令导入本目录，并填写提交者的真实姓名与 GitHub 用户名。导入脚本会在 `html_output/<paper-name>/` 生成 `paper.json`，并自动排除 `node_modules/` 与 `dist/`。随后运行：

```bash
npm run validate
npm run catalog
npm run validate:pr -- main
npm run build:paper -- videococo_code_as_cot_for_physically_consistent_video_generation_via_an_agentic_dual_engine_system
```

检查全部通过后，再从个人 fork 的 `paper/<paper-name>` 分支创建 Pull Request，并在 PR 中附关键页面截图、主要交互说明和需要审核者重点确认的问题。
