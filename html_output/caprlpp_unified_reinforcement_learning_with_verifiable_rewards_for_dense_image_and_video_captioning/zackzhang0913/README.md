# CapRL++：面向密集图像与视频描述的统一可验证奖励强化学习 · 交互式教程

本目录是论文 **CapRL++: Unified Reinforcement Learning with Verifiable Rewards for Dense Image and Video Captioning** 的中文交互式教程，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

## 论文原始信息

| 项 | 内容 |
| -- | ---- |
| 论文标题 | CapRL++: Unified Reinforcement Learning with Verifiable Rewards for Dense Image and Video Captioning |
| arXiv ID | arXiv:2606.09393（v1，2026-06-08 提交） |
| 论文页面 | <https://arxiv.org/abs/2606.09393> |
| HTML 版 | <https://arxiv.org/html/2606.09393> |
| 全部作者 | Penghui Yang, Long Xing, Xiaoyi Dong, Yuhang Zang, Yuhang Cao, Yibin Wang, Yujie Zhou, Jiazi Bu, Jianze Liang, Qidong Huang, Jiaqi Wang, Feng Wu, Dahua Lin |
| 发布许可 | arXiv 非独占分发许可（arXiv.org perpetual, non-exclusive license）：<https://arxiv.org/licenses/nonexclusive-distrib/1.0/> |

## 教程结构

10 章、19 个交互模块、30 个 Canvas 组件。全篇使用同一个日常隐喻——**讲解者 / 蒙眼学生 / 题库**：看得见画面的一方写讲解稿，看不见画面的一方只读稿子答题，答对几题就是讲解者的分数。该隐喻对应论文 §3.1 的解耦两阶段流程与 §3.2 的效用奖励。

## 图片来源与权利声明

`public/images/` 中的 9 张图是论文正文插图的原始文件，直接取自 arXiv 官方 HTML 版的嵌入式图片（未从 PDF 自行重绘或裁切）：

| 本地文件 | 论文图号 | 抓取来源 |
| -------- | -------- | -------- |
| `caprl-fig1.webp` | Figure 1 | `https://arxiv.org/html/2606.09393v1/imgs_mine/teaser2_04.png` |
| `caprl-fig2.webp` | Figure 2 | `https://arxiv.org/html/2606.09393v1/imgs_mine/enhance_clarity_case_new_v3_02.png` |
| `caprl-fig3.webp` | Figure 3 | `https://arxiv.org/html/2606.09393v1/pipeline_2_1_new_v3.png` |
| `caprl-fig4.webp` | Figure 4 | `https://arxiv.org/html/2606.09393v1/imgs_mine/S2D_bootstrapping_02.png` |
| `caprl-fig5.webp` | Figure 5 | `https://arxiv.org/html/2606.09393v1/imgs_mine/curriclum_case.png` |
| `caprl-fig7.webp` | Figure 7 | `https://arxiv.org/html/2606.09393v1/img_data_source_new_v2.png` |
| `caprl-fig8.webp` | Figure 8 | `https://arxiv.org/html/2606.09393v1/R_len_all_new_v4_m.png` |
| `caprl-fig9.webp` | Figure 9 | `https://arxiv.org/html/2606.09393v1/data_scaling_v3.png` |
| `caprl-fig10.webp` | Figure 10 | `https://arxiv.org/html/2606.09393v1/imgs_mine/CapRL-T2I_01.png` |

**改动说明**：图片内容未作任何修改，仅等比缩放到不超过 1400 px 宽并转为 WebP 以控制体积，9 张合计约 1.2 MB。论文 Figure 6（数据来源示意）在 arXiv HTML 版中没有独立的图片文件，因此本项目未收录该图。教程中其余全部示意图与动画均为项目自绘 Canvas，不含第三方素材。

**权利归属与使用范围**：上述图片的版权归论文作者所有，本项目仅作**非商业的教学演示**用途、并在上表中完整标注原始出处与论文元信息。需要明确：**本仓库并非经论文作者或 arXiv 授权的正式转载**——arXiv 非独占分发许可授予的是 arXiv 分发该论文的权利，并未明确授权第三方再次分发其插图；本项目的使用依据是学术教学场景下的有限引用与完整署名。**如作者或权利人认为不妥，请提出，我们会立即移除相关图片。**

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 目录结构

| 路径 | 说明 | 是否生成器（Agent）修改 |
| ---- | ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容（章节、模块、公式、B 站、元信息） | ✅ 唯一数据文件 |
| `src/styles/paper.css` | 论文专属 `:root` 配色覆盖 | ✅ 仅此 CSS |
| `src/modules/*.tsx` + `registry.tsx` | 论文专属 Canvas 交互组件 | ✅ 在 registry 注册 |
| `public/images/*` | 论文原始插图（来源见上） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
