# PaddleOCR-VL-1.6 交互教程

基于论文 **PaddleOCR-VL-1.6: Expanding the Frontier of Document Parsing with Under-Optimized Region Refinement and Progressive Post-Training**（arXiv:2606.03264v1，百度 PaddlePaddle 团队）制作的简体中文交互式教程，React 18 + TypeScript + Vite 实现。

论文链接：https://arxiv.org/abs/2606.03264

页面中的论文原图取自论文本体（arXiv:2606.03264v1），仅用于本教程的教学展示。

## 本地运行

```bash
npm install
npm run dev       # 开发预览 http://localhost:5173
npm run build     # 产出 dist/ 静态站点
npm run preview   # 预览构建结果
```

## 教程内容

共 7 章、11 个交互模块，覆盖论文的核心链路：

1. 引言与总览：论文的路线与系统（数据引擎原图 → 欠优化区域 → 两条路由）
2. 边界脆弱分数：小扰动为何带来大漂移
3. 覆盖稀疏：长尾数据如何被发现
4. 监督不可靠：标签也可能出错
5. 高潜力样本挖掘与奖励设计
6. 分阶段后训练：CPT → SFT → RL
7. 成绩单：96.33 与真实的局限

## 目录结构

| 路径 | 说明 |
| ---- | ---- |
| `src/data/tutorial.ts` | 教程数据（章节、模块、公式、元信息） |
| `src/styles/paper.css` | 教程配色覆盖 |
| `src/modules/*.tsx` + `registry.tsx` | 交互组件与注册表 |
| `public/images/*` | 论文原图 |
| `src/components/*`、`src/lib/*` | 展示组件与工具库 |
| `src/styles/{tokens,components}.css` | 设计令牌与组件样式 |

## 配色语义

- 蓝色：指导 / 当前状态
- 绿色：成功 / 本文方法
- 红色：失败 / 传统方法
- 橙色：用户强调
- 紫色：辅助机制
