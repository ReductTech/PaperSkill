# 时间感知的一步扩散真实图像超分网络 交互式教程

基于论文 *Time-Aware One Step Diffusion Network for Real-World Image Super-Resolution*（Tianyi Zhang, Zheng-Peng Duan, Peng-Tao Jiang, Bo Li, Ming-Ming Cheng, Chun-Le Guo, Chongyi Li；CVPR 2026；[arXiv:2508.16557](https://arxiv.org/abs/2508.16557)），由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 素材来源

`public/images/` 中的图片来自论文 Fig.2（结构总览）、Fig.3（TAE latent PCA）、Fig.4（VSD 输出与梯度）、Fig.7（消融视觉对比）、Fig.8（不同 tₛ 的结果）的裁剪，仅用于教学引用，页面对应位置与讲稿中标注了图号。可交互的 6×6 latent 网格、噪声强度条与修复台场景为示教示意，不声称是论文原始数据；可点击/拖动的读数均取自论文 Table 1、Table 2、Table 3、Table 4、Table 7。

## 本地运行

这套教程用“老照片修复工作室”作为统一生活隐喻，讲清 TADSR 的三个核心问题：
为什么一步扩散需要可变时间步、TAE 如何让同一张图写出不同的 latent、TAVSD 如何把
学生档位映射给老师。教程共 4 章 12 页，包含可拖动的补全档位、普通 VAE / TAE 对照、
tᵥ=λtₛ+γ 映射、模糊 MSE、主结果点图与消融点图。

论文：Tianyi Zhang 等，*Time-Aware One Step Diffusion Network for Real-World Image
Super-Resolution*，CVPR 2026，arXiv:2508.16557v3。原论文图片仅作教学引用，页面中已标注
对应图号；可交互的 latent 网格与噪声条为示教示意。

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 页面结构

| 章节 | 页面 | 主要交互 |
| --- | --- | --- |
| 封面 | 固定档位 vs 时间感知档位 | 共享时钟的两侧修复台 |
| 01 | 同一张照片，换档位就换先验 | 拖动 tₛ，看照片、PSNR、QALIGN |
| 01 | 为什么固定学生档位不够 | 固定 / 时间感知模式对照 |
| 02 | TAE：档位先改工作底稿 | 普通 VAE / TAE 与 latent 读数 |
| 02 | 单步结构：一次成片，两路老师给方向 | 点击学生 / 老师 / LoRA / TAVSD |
| 02 | TAVSD：把学生档位映射给老师 | 联动 tₛ, λ, γ |
| 02 | 残差：老师比学徒多出的那一层 | 选择 tᵥ=100/300/600 |
| 03 | 模糊 MSE：高档位只监督低频 | 拖动 tₛ，看核尺寸与频带 |
| 04 | 主结果：无参考指标领先，PSNR 保持可比 | 切换指标 / 数据集 |
| 04 | 消融：TAE 与 TAVSD 都不能少 | 切换数据集 / 指标 |
| 04 | 一步与可控性能否同时成立 | 点击模型点 |
| 04 | 档位推过头：补全变编造 | 推到 500 / 600，看伪影与回落 |

## PPT 演示模式

每章包含多张独立幻灯片，每页固定为 1600×900。顶部翻页，左侧预览选页，
“讲稿”打开演讲者备注，“放映”进入全屏。方向键翻页时不会抢占输入控件。
手机保持原有排版，支持双指缩放、放大后拖动以及缩放复位。

首页的两种方法通过 `useCoverPlayback()` 同步播放同一生活场景，并用一句话引出
核心方法。正文可以直接点击或拖动画布里的物体，也可以用少量关联滑块组成
一个完整实验；不同页面应选择主题内不同的生活动作，而不是重复同一动画。
不同页面按教学问题安排生活场景、交互、论文公式或实验结果；同页并置的画面与
形式化表示由同一状态驱动，其他依据可放在独立页面或讲稿中。
不需要为动画添加播放、暂停、单步、重置或标签切换控件。

通过 `chapters[].scenes` 指定每页目标、讲稿和专属 `componentId`；正文通过统一组件注册表注册，版面按内容自由设计。
正文在固定画布内自由构图；生成器应按教学问题安排视觉重点，不能让每页都成为左图右卡。
新项目不再提供固定的“左图右文”引入页或“三列文字”总结页。结论应融入大幅动画、
交互结果或充分可读的论文证据图。
正文使用 `--ppt-body-text`、`--ppt-body-heading`、`--ppt-body-emphasis` 三种字号；删掉重复的小标签，给公式、机制和结果留足可读空间。生活动画用于引入和解释合适的概念，其他页面可以直接操作论文变量、结构或证据。详细出处与类比边界放入讲稿，密集内容拆成新页。
`outlines.json` 由章节组装器生成。页面截图存入 `public/thumbnails/`；
`?capture=1&slide=页面ID` 可在 1600×900 窗口中单独捕获页面。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、B 站、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `public/thumbnails/*` | 幻灯片截图 | ✅ 生成后截图 |
| `outlines.json` | 每页目标、交互与讲稿 | 由组装器派生 |
| `src/components/*` | 演示框架与场景展示组件 | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components,presentation}.css` | 设计令牌、组件与演示样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
