# ARIS：基于对抗式多智能体协作的自主科研交互式教程

本项目基于论文 *ARIS: Autonomous Research via Adversarial Multi-Agent Collaboration* 制作，是一个 PaperSkill 风格的 React + TypeScript + Vite 网页项目。

## 本地运行

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run preview
```

如果本机使用 npm，也可以改用：

```bash
npm install
npm run dev
npm run build
npm run preview
```

开发预览默认地址通常是 `http://localhost:5173/`。

## 内容结构

网页采用 6 页主线，适合 4 分钟学术汇报：

1. AI 写论文，是救星还是宿敌？
2. ARIS 做的不是更强模型，而是更难自说自话的系统
3. 静态骨架：三层架构先把责任分清
4. 由静到动：从 idea 到 rebuttal 的自动科研主线
5. 动静之间的核心：证据到主张三道闸门
6. 一次真实运行与理性反思

## 主要文件

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 论文专属内容、章节、模块和元信息 |
| `src/modules/arisWidgets.tsx` | ARIS 专属交互组件 |
| `src/modules/registry.tsx` | 组件注册入口 |
| `src/styles/paper.css` | 本项目专属视觉样式 |
| `src/styles/tokens.css` | 模板设计令牌 |
| `src/styles/components.css` | 模板通用组件样式 |

## 汇报重点

页面强调一个直白故事线：AI 已经能生成科研文本，但完整文本不等于可靠科研。ARIS 的价值不是造一个更强的单模型，而是用异构互审、模块化 workflow 和 evidence-to-claim 审计，把自动科研变成更可检查的系统。

最终提交时应保留整个项目目录，不要只复制 `index.html` 或 `dist/`。
