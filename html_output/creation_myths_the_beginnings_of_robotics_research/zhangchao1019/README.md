# 创世神话：机器人研究的开端

Matthew T. Mason，*Creation Myths: The Beginnings of Robotics Research*，2012，pp. 72–77 的中文交互式导读。使用 [PaperSkill](https://github.com/ReductTech/PaperSkill) 的 React + TypeScript + Vite 模板，参考本地 `prepare/10_19/交互式` 例程。

## 打开方式

Windows 双击 **启动导读.cmd**，启动本地服务并打开浏览器。本机依赖已准备好；关闭终端即停止服务。

或在本目录运行：

```powershell
npm.cmd ci                 # 复制到其他电脑后先安装依赖
npm.cmd run dev -- --open
```

不要直接双击 `index.html`，它是 Vite 的源码入口。

## 阅读与演示

共 **7 章、12 页（含封面）**，覆盖四种起源叙事、几何转向、曲柄与不确定性、结构化环境的三种定义及连续性、设计与感知权衡、长期进展和史料核验。

点击时间线、场景及定义，或拖动滑杆，观察图形和解释变化。顶部翻页，左侧缩略图定位；“讲稿”提供原文页码与边界，“放映”进入全屏。手机保持同一版式，支持双指缩放和放大后拖动。

原文是历史与概念论述，没有训练算法、实验基准或性能表。圆盘避碰、曲柄几何、夹爪尺寸、预算函数和技能格子均为标注过的教学示意，不是原文公式、控制器、实测数据或结构化评分。

PDF 第 1–6 页对应印刷页 72–77。详见 [SOURCES.md](SOURCES.md)。按页大纲位于 `outlines.json`，章节与讲稿位于 `src/data/tutorial.ts`，专属交互位于 `src/modules/Scenes.tsx`。

## 验证

已通过 TypeScript、Vite 生产构建、PaperSkill 语法与结构检查。浏览器 100 项交互及几何检查通过，涵盖全部页面、控件边界，以及 1366×768、1920×1080、390×844、844×390 视口。缩略图位于 `public/thumbnails/`，桌面预览为 `preview.png`。

```powershell
npm.cmd run build
npm.cmd run preview
```
