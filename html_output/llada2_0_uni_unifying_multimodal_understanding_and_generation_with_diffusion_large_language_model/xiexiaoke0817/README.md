# LLaDA2.0-Uni：统一多模态理解与生成 

基于论文 *LLaDA2.0-Uni: Unifying Multimodal Understanding and Generation with Diffusion Large Language Model*，借助 **Paper Skill** 生成并重新导演的完整 React + TypeScript + Vite 教学项目。4.1 采用五幕主讲加证据尾声，页面内容为中文。

## 4.1 核心交互

- 统一 Token 扩散实验台：切换图片问答、图像生成、图像编辑与交错推理，拖动时间轴观察块级并行解掩码。
- 可点击架构路径：检查 SigLIP-VQ、16B MoE dLLM、文本输出与 6B Diffusion Decoder 的有效连接。
- 原论文图对照：展示 Figures 1–9，并将定性案例、基准结果与局限分开呈现。
- 双加速实验：分别讲解 SPRINT 与 50/8 步 Diffusion Decoder 对照，不混淆两套速度协议。
- 固定目录：可从首页直接跳转到任意 Step；手机端目录自动变为底部导航。

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
| `src/data/tutorial.ts` | 六段中文教学内容、公式、元信息 | ✅ |
| `src/styles/paper.css` | Distill 风格排版、暗房色调、响应式交互样式 | ✅ |
| `src/modules/*.tsx` + `registry.tsx` | 12 个主要交互及 Hero / 暗房类比组件 | ✅ |
| `src/App.tsx` | 渐进学习、固定目录与直接章节定位 | ✅ |
| `public/images/*` | 从论文抽取的 Figures 1–9 与解码器对照图 | ✅ |

## 配色语义（contract.md §5，保持稳定）

- `--blue` 指导/当前状态，`--green` 成功/本文方法，`--red` 失败/传统方法
- `--orange` 用户强调，`--purple` 辅助机制

切勿把 `--accent` 重新定义成别的语义角色。
