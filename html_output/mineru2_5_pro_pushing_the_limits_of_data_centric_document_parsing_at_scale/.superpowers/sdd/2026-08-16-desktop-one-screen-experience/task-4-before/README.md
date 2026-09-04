# MinerU2.5-Pro 交互式网页教程

这是一个基于 React、TypeScript 与 Vite 的 PaperSkill 教程。论文事实以 MinerU2.5-Pro arXiv v2 为准；教学重绘、合成输出、错误示例、路由和修复状态都与论文事实分开标注。

学习路径保留 6 个 chapter、11 个 active module 定义和全部显式 widget registry 映射，并以六种不同的主交互承载它们：

1. 数据瓶颈：在固定 1.2B 架构和相同预算下做“普通页 / 长尾页”反事实选择。
2. DDAS：用可移动采样镜头观察页面簇，再进入文本、公式和表格的元素级放大。
3. CMCV：通过拖放或等价按钮把样本分流到 Easy、Medium、Hard，并揭示“共识不等于真值”。
4. Render-then-Verify：拖动取证滑杆比较结构、渲染与原图，定位并修复差异热点。
5. 训练与 GRPO：播放、暂停、拖动、逐段和重播训练时间轴，再按任务指标重排候选。
6. MGAM 与证据：合并 held-out 预测块，观察匹配、评分与消融证据同步变化。

章节按顺序渐进解锁；hash 深链只能恢复已解锁章节中的稳定交互状态。术语表、论文图查看器和本地学习进度继续可用。Bilibili 只出现在第 6 步后的页尾延伸区，不参与章节解锁、完成进度或论文证据；只有用户确认并主动播放时才创建第三方 iframe，关闭后立即卸载。

## 本地媒体来源与边界

- `paper-figure-2-data-engine.png` 和 `paper-figure-3-ddas.png` 是 MinerU2.5-Pro arXiv v2 的 Figure 2/3 本地节选。
- `real-case-output-comparison.png`、`real-case-layout-diversity.png`、`real-case-table-structure.png` 来自 OmniDocBench 的 Figure S3、S7、S10。
- `document-parsing-concept.png` 是教程自制教学图，不是论文原图。

OmniDocBench 页面仅用于展示真实文档的输出规范、版式和表格结构难点，不能据此声称它们是 MinerU2.5-Pro 的训练样本、296 页 Hard 样本或性能证据。所有论文图片的发布许可状态仍须在发布前核验；页面保留来源直链和图片失败时的文字占位。

## 本地运行与验证

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

完整检查：

```powershell
npm test
npm run build
node ..\PaperSkill\paper-skill\scripts\validate-output.js .
```

生产构建输出到 `dist/`，Vite 使用相对路径 `base: './'`。

## 离线边界与非目标

断网后，六章正文交互、本地图片、术语与进度机制仍可使用；主动打开论文、代码仓库、延伸资源或 Bilibili 播放器需要网络，第三方 iframe 被阻止时可使用原站链接。

本项目没有四分钟展示版、极速演示版或独立视频模式，也不会保存视频完成状态。此次工作没有执行部署、Pull Request 或 Git 初始化。
