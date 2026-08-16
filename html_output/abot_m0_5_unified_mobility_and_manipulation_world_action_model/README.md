# ABot-M0.5 · 4 分钟交互式论文演示

基于论文 **ABot-M0.5: Unified Mobility-and-Manipulation World Action Model** 重构的六屏 React + TypeScript 演示网页。

页面围绕一条主线展开：ABot-M0.5 通过 Intermediate Latent Action、Dual-Level MoT 与 Dream Forcing，分别修复时间粒度、动作空间和训练—部署条件的三种错配。

## 本地运行

```powershell
npm install
npm run dev
```

浏览器打开终端给出的地址，默认是 <http://localhost:5173>。

生产构建：

```powershell
npm run build
```

## 现场操作

- 鼠标滚轮或触控板：切换全屏段落
- `↑` / `←`：上一页
- `↓` / `→`：下一页
- 顶部六节点导航：直接跳转
- 每页只保留一个主要交互

## 结构

- `src/presentation/sections.tsx`：六屏内容与核心交互
- `src/presentation/Robot.tsx`：贯穿全场的移动操作机器人 SVG
- `src/presentation/ProgressNavigation.tsx`：固定六节点进度导航
- `src/presentation/useStoryNavigation.ts`：键盘与章节定位逻辑
- `src/styles/presentation.css`：完整视觉系统、动画与响应式布局
- `public/images/*-demo.webp`：由论文官方项目页真机 GIF 压缩得到的本地动画素材
- `PRESENTATION_NOTES.md`：六屏中文讲稿与过渡句

项目不依赖后台服务、CDN、外部字体或网络 API；Vite 的相对 `base` 配置兼容 GitHub Pages 子路径部署。

第一页动作标签是对官方演示中可观察动作阶段的教学化整理，不宣称为机器人传感器或控制器原始日志。真机素材来源：<https://amap-cvlab.github.io/ABot-Manipulation/>。
