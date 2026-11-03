# DER / DER++ 交互教程

独立 React / TypeScript / Vite 项目。S1–S8、7 个阅读单元、9 个实际模块。W9 人工终审待确认，未执行 W10 发布。

```powershell
npm ci
npm test
npm run build
# 若缺 Playwright，先在仓库 reusable-kit/demo 中 npm ci
$env:PAPERWORK_PLAYWRIGHT_EXECUTABLE='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm run test:browser
npm run preview -- --host 127.0.0.1 --port 5195 --strictPort
# 需保持生产预览运行：真实时钟播放 D1 九阶段和四轮工作台
npm run test:playback
```

本机若 npm ci 因已有预览占用原生二进制报 EPERM，应先关闭自己启动的旧服务；不要结束来源不明的进程。本轮用 npm install --ignore-scripts --no-audit --no-fund 恢复依赖，未更改锁定版本。

| 入口 | 内容 |
| --- | --- |
| /#U1-replay-entry | S1 普通训练→GCL→有限 ER；S2 直接展示同一 x₁ 的完整响应 |
| /#U2-probability | S3 单一概率/logits 三态实验台，含正文定义与输出梯度 |
| /#logit-matching | S3 原始 logits 的数学解释（保留原深链） |
| /#U3-logit-memory | ER/蒸馏/DER 桥接、冻结时间轴、完整两轮预讲解、居中 D1 |
| ?review=1&focus=lifecycle#lifecycle-player | 独立无侧栏专注播放器，首次暂停 |
| ?focus=reservoir | 在线追加、替换、拒收 |
| ?focus=der-step | 当前与回放联合更新后写入 |
| ?focus=augmentation | 不同视图与同一冻结目标 |
| ?focus=der-plus | 错误历史、独立标签监督与两次采样 |
| ?focus=workbench | 四轮训练及只读预测 |
| ?focus=evidence | 协议、结果、反例与局限 |

前半程先读正文与局部关系图，再自主播放 D1。S2/S3 共用 x₁、z=(2,1,0)、a=(2,0,1)，类别顺序 Claude/GPT/DeepSeek；同一计算模型派生 softmax、KL、平方距离和梯度。三态为完全一致、类别偏好变化、共同平移 +1。Reference 的独立两类概率曲线保留为深入数学背景。

D1 继续使用已认可的主 SVG、九段时序和运动。其未来回放指定 aⱼ=(1,2,0)、L_dark=2，与前节比较时刻区别；x₂ 快照用符号表示，不执行真实训练。普通与专注播放共用同一舞台和时钟，切换保留进度。所有类别和像素图案都是合成教学对象。

后续 training-model.ts 是单步/四轮唯一训练计算源：2→3 无偏置线性模型、η=.1、α=β=.5。它可复算，是教学算例。实验值另由 W3 源表核对；原文 arXiv:2004.07211v2 / NeurIPS 2020。17 项原论文图像仅作内部参考，不公开 PDF 或原表截图。

复用本地 ResponseMeter、SampleToken、Reference/TermRef、MathNotation、SceneTransport/useSceneTimeline；生产运行时自包含，Playwright 仅为开发工具，无 iframe 或跨论文服务依赖。未自动批准任何 Kit 资产。

```powershell
# 可选定向诊断，整篇验收仍运行未过滤版本
npm run test:browser -- --lifecycle-only
npm run test:browser -- --formula-only
npm run test:browser -- --review-feedback
npm run test:browser -- --w8-only
npm run test:browser -- --reservoir-only
npm run test:workbench-layout
# 仓库根运行公共视觉 QA
node tools/visual-qa/cli.mjs --config papers/der/web/enhanced/visual-qa.json
```

DER_REVIEW_DIR / DER_PLAYBACK_DIR 可指定截图或真实播放证据输出，DER_PREVIEW_URL 可指定生产预览。公共 QA 运行目录在阅读报告、实看截图并记录结果后按精确路径清理。最终命令结果、受保护区域和人工待审项统一见 ../../design/implementation-plan.md、../../audit/final-check.md。1920×1080 为布局模拟；真实 F11 单独记录，不能互相替代。

2026-10-30 本轮验证：构建、25项单元测试、2658项完整浏览器回归、公共全篇56状态及截图返修后28状态通过；D1/工作台均完成真实时钟播放。截图返修 commit c6cf540 统一前半程正文和控件字体、对齐与留白。最新证据和微调后的定向复核见唯一 audit/final-check.md；W9人审、真实F11及当前官方输出检查仍待完成。
