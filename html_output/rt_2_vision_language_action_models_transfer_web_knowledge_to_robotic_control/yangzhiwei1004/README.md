# RT-2：视觉-语言-动作模型将网络知识迁移到机器人控制 交互式教程

基于论文 *RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control*，由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

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
| `public/images/*` | 论文原图（可选） | ✅ 仅放图 |
| `src/components/*` | 静态展示组件（Hero/Chapter/Module…） | ❌ 模板框架默认 |
| `src/lib/*` | 静态工具（canvasKit / B 站） | ❌ 模板框架默认 |
| `src/styles/{tokens,components}.css` | 静态设计令牌与组件样式 | ❌ 模板框架默认 |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。

## 素材来源（可追溯）

### 论文原图

本教程使用的 6 张配图全部取自所解读论文的公开版本，用于学术内容解读与教学说明：

| 文件 | 对应论文图 | 来源 |
| ---- | ---- | ---- |
| `public/images/fig1_robot_kitchen.jpg` | Figure 1（RT-2 在厨房场景执行指令） | [RT-2 论文, arXiv:2307.15818](https://arxiv.org/abs/2307.15818) |
| `public/images/fig2_emergent_grid.png` | Figure 2（涌现能力评估网格） | 同上 |
| `public/images/fig4_generalization.png` | Figure 4（泛化能力对比） | 同上 |
| `public/images/fig5_langtable.png` | Figure 5（Language-Table 评测） | 同上 |
| `public/images/fig6a_emergent_bars.png` | Figure 6(a)（涌现能力柱状对比） | 同上 |
| `public/images/fig6b_ablation.png` | Figure 6(b)（消融实验） | 同上 |

论文标题：*RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control*（Google DeepMind，2023）。

### B 站参考视频

教程内嵌的 4 个 B 站视频均为公开可访问的第三方解读视频，仅作延伸学习参考，版权归原作者所有：

| BVID | 标题 | 链接 |
| ---- | ---- | ---- |
| `BV1UktR6gExP` | 【全20集】目前B站最全最细的具身智能 VLA教程… | https://www.bilibili.com/video/BV1UktR6gExP |
| `BV1pa4bzMEQx` | 从SayCan到VLA模型 VLA的来时路 RT-1 PalmE RT-2… | https://www.bilibili.com/video/BV1pa4bzMEQx |
| `BV1UBtezaE1t` | 谷歌DeepMind的RT-2通用机器人模型… | https://www.bilibili.com/video/BV1UBtezaE1t |
| `BV1rTihB1ECj` | 具身智能：RT-2视觉-语言-动作（VLA）模型… | https://www.bilibili.com/video/BV1rTihB1ECj |

### 其他素材

动画、图表与示意图均由教程代码（Canvas / CSS / SVG）在本地实时绘制，不依赖任何外部 CDN 或第三方资源。
