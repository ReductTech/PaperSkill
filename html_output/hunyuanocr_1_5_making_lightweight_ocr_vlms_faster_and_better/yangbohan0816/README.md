# HunyuanOCR-1.5：让轻量 OCR 视觉语言模型更快、更强 交互式教程

基于论文 *HunyuanOCR-1.5: Making Lightweight OCR VLMs Faster and Better* 的完整 React + TypeScript + Vite 交互教程。网页围绕“更快、更强、仍有边界”组织故事线，并提供完整教程与 4 分钟展示两种入口。

论文来源：[arXiv:2607.04884](https://arxiv.org/abs/2607.04884)。

## 教学主线

1. 统一端到端 OCR 如何避免级联误差；
2. DFlash 如何并行草拟、由目标模型校验并接受最长有效前缀；
3. Agentic Data Flow 如何把模型弱点变成可执行的数据工程任务；
4. Stage3、SFT 与 IcePop RL 如何分别扩展能力边界、建立高质量基础和提升能力上限；
5. OmniDocBench 与 CHAOS-Bench 如何同时说明性能进步与可靠性边界。

首页的“4 分钟展示”模式提炼为 7 个关键场景，支持按钮和左右方向键切换；“完整教程”保留全部 10 章、13 个主动交互模块与 15 个已注册组件。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

最终提交应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。

## 目录结构

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 论文内容、章节、公式与实验数据 |
| `src/modules/*.tsx` | Canvas 教学交互与即时反馈 |
| `src/App.tsx` | 完整教程和 4 分钟展示模式 |
| `src/components/*` | 页面结构组件 |
| `src/styles/*` | 设计令牌、响应式布局和论文主题 |
| `public/images/*` | 教程使用的论文图示 |

## 素材来源

- `public/images/architecture.png`：原论文 Figure 1；
- `public/images/dflash-mask.png`：原论文 Figure 2；
- 其余示意图和动画均由项目中的 Canvas 代码绘制，不依赖外部图片或字体。

论文图仅用于对应论文的教学解读；公开发布时应同时遵守原论文页面标注的许可条件。
