# StarVLA 交互讲解页

基于论文 *StarVLA: A Lego-like Codebase for Vision-Language-Action Model Developing*（arXiv:2604.05014）制作的交互式网页讲解，React + TypeScript + Vite，KaTeX 本地打包，可完全离线演示。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

## 演示方式（PPT 模式）

- 页面按「节」组织成 12 页幻灯片（9 幕，长幕拆子节：03A/03B、07A/07B），**一次只展示一节**。
- 翻页：左侧竖向目录条点击 / 节底部「上一节 · 下一节」按钮 / 键盘 `←` `→`（`↑` `↓` `空格` `PageUp/PageDown` 同效）。
- 每次切节整节重挂载：入场动画、积木拼装、自动演示**每次都重新播放**，回到封面也会重演。
- URL hash 与当前节同步（`#act-02b-build` 等），可直接分享某一节的深链。
- 移动端（≤960px）：目录收成左下角「☰ 目录」抽屉，双栏自动折单栏，表格在卡片内横滑。

## 叙事结构（9 幕 / 12 节）

顺序按「先框架、后结论」组织：痛点 → 能力总览 → 框架实现 → 框架内的结论 → 评测架构 → 训练配方 → 实验结论 → 收束。

1. **巴比塔之痛** —— 进场自动演示：π0 与 OpenVLA 积木拼不上（附具体失败原因）→ 装上统一接口 → 咔哒通电；也可亲手选阵营组合。
2. **能力总览** —— Table 1 能力矩阵（StarVLA 行逐格打勾）：先看清这盒乐高里有什么。
3. **乐高式解法** —— 03A 契约数据流动画（观测流入 → hidden states 流过对内契约 → 动作块蹦出，自动循环）；03B 拼装台自动轮插四种动作头并显示论文实测成绩。
4. **一个公式** —— KaTeX 排版的 π(a_{t:t+k}, y_aux | x_t, ℓ) 与 L = L_action + L_aux；三种范式自动轮播，符号筹码可点。
5. **动作头剧场** —— 四种动作头自动轮流上演：FAST 逐 token、OFT 并行回归、π 去噪显影、GR00T 双系统。
6. **评测部署** —— Server-Client 自动循环推理，每轮转一个考场（LIBERO / SimplerEnv / RoboTwin 2.0 / 真机）；换动作头评测代码 0 行改动。
7. **训练配方** —— 07A 四张配方卡 + YAML 配方调台（拨开关实时生成训练配置，打字机写出）；07B 遗忘实验滑块自动走 0→50K 步，「只练动作 vs 多模态共训」来回演示，拖滑块即接管。
8. **数据说话** —— 30K vs 175K 步效率、专才 vs 通才、8→256 卡扩展曲线。
9. **收束** —— 三块总结积木 + GitHub / 项目主页链接。

## 设计与工程约定

- **积木质感**：砖块带凸点（studs）、立体渐变与 inset 棱边，红=问题/失败、绿=解决/收益、紫=可替换模块、蓝=中性、黄=类比。
- **排版尺度**：正文 18px / 行高 1.8，段落限宽 740px，H2 `clamp(34px,4.4vw,54px)`，演示场景可读性优先。
- **来源标注**：关键数字旁 ⓘ（`Src` 组件）标注出处、类型（论文真实值/换算/教学示意）与可比性；教学动画带「机制示意」角标。
- **自动播放**：BabelLab / LegoBuilder / FormulaSwitch / HeadTheater / ForgettingLab / ServerClient 均无需点击自动演示，用户交互即接管；`prefers-reduced-motion` 下全部停用。

## 数据来源

- 全部实验数字引自论文 Table 1 / 2 / 8 / 9 / 11 与 Figure 4，并在页面就地标注。
- 论文正文 §7.2 的 RoboCasa specialist 数字（48.8）与 Table 9（53.8）不一致，页面采用表格值 53.8。
- LIBERO 组合矩阵中「Cosmos + FAST」论文未报告，页面如实标注为空白格。

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `src/App.tsx` | PPT 分节调度：节状态、键盘/hash 导航、节底部翻页条 |
| `src/data/content.ts` | 全部文案、论文真实数据、`ACTS` 目录与 `DECK_ORDER` 播放顺序 |
| `src/components/SideNav.tsx` | 左侧竖向目录条（移动端抽屉） |
| `src/components/Act.tsx` | 节骨架：封面条 / 一句话 / 收束卡 |
| `src/components/Math.tsx` | KaTeX 封装 |
| `src/components/Src.tsx` | 来源标注 ⓘ tooltip |
| `src/widgets/` | 8 个交互组件（均支持自动演示） |
| `src/lib/hooks.ts` | `useRevealAll`（切节重触发）、`useInView`、`usePrefersReducedMotion` |
| `src/styles.css` | 单一设计系统（乐高积木母题，暖纸底 + 语义色 + PPT 布局） |
