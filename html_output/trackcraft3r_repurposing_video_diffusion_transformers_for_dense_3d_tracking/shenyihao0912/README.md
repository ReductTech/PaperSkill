# TrackCraft3R：把视频扩散 Transformer 改造成稠密 3D 跟踪器 交互式教程

基于论文 *TrackCraft3R: Repurposing Video Diffusion Transformers for Dense 3D Tracking*（arXiv 2605.12587，KAIST AI / Google DeepMind），由 **paper-skill** 生成的完整 React + TypeScript + Vite 网页项目。

统一生活主题：**家庭录像跟拍一只小狗**——狗鼻上的绿点贯穿全部 10 章，从"画面在动、狗没动"一路讲到"单步前向的稠密 3D 轨迹"。

## 章节一览

| 章 | 内容 | 核心交互 |
| --- | --- | --- |
| §1 | 画面在动，狗没动（相机自运动 vs 真实运动） | 拖相机 / 相机位置滑条，双坐标读数 |
| §2 | 一个像素的 3D 地址（深度 + 内外参） | 点像素 + 深度滑条 + 位姿旋转 |
| §3 | 知道每帧 3D 还不会跟踪（对应难题） | 连线配对游戏 + 重建/跟踪双点图步进 |
| §4 | 残差 Δⱼ 与可见性 oⱼ | 静态 / 运动 / 遮挡三情形 |
| §5 | 帧锚定 vs 参考锚定 + 时间 RoPE | 同屏双面板（含狗跳跃）+ RoPE 开关 |
| §6 | 双潜变量 gⱼ 与 rⱼ=g₀ | 拼接-复印四步动画 |
| §7 | 一步到位的 LoRA 微调 | 秩 64/256/1024 + VAE 微调训练台 |
| §8 | 一次前向的完整架构 | 8 节点热点图 + Layer 14→16 逐层注意力 |
| §9 | 更长的视频更大的动作 | 100 帧取块对比（3R 步长 vs v2 逐窗）+ 接力/锚定 |
| §10 | 证据与边界 | 五指标柱状图 + 官方真实演示（大位移/遮挡/相机运动） |

演示素材来自[官方项目页](https://cvlab-kaist.github.io/TrackCraft3r/)；论文原图（Fig.1/3/4/5）置于 `public/images/`。

## 配套文档（`docs/`）

- `design-log.md` —— 与 AI 协作、逐轮导演的完整决策日志（视频 2 素材）
- `narration-script.md` —— 视频 1 详尽讲述稿（含 5 分钟压缩方案与数字速查）

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
