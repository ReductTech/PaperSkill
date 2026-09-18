# 论文一致性修订记录

依据：[WavFlow v1](https://arxiv.org/abs/2605.18749v1)，WavFlow v1。保留十章结构及原有配色。

## 内容修订

- 删除未报告的单条件消融成绩；Patchify 统一使用 Table 3 的 3M / Test 数据。
- 修正 16 kHz 与 44.1 kHz 指标混用，补齐 Table 1 的 IB 和 Table 2 全部基线。
- Table 1、2、3、4、5、10、11 的展示注明页码、评测划分及适用训练设置，逐列标记最优值（含并列）。
- 将 CFG 与步数拆成 Table 10 的两组单变量实验，不生成论文未报告的组合。
- 解释 v-loss 为生成时间加权的波形平方误差，区分生成时间与音频播放时间；明确 x-loss 的优势指标。
- 区分训练线性插值与未知终点的模型推理；不宣称轨迹、质量或积分误差有绝对保证。
- 区分无损分块和非可逆预处理。振幅示例的 RMS、直方图由同一合成波形实际计算；示意不冒充真实模型输出。
- 修正 Synchformer 序列长度、cg/ce 依赖关系与 RoPE 随采样率变化的比例。
- 修正过滤后 50M、平衡后 5M，以及 VT2A/T2A 最终混合数量。
- 依据 Appendix A / Table 6 明确 T2A 单独训练，44.1 kHz 使用 200K VGGSound 微调 650 epochs、batch 1536。
- 清理绝对化宣传，保留语音、歌唱能力的局限与 MovieGen 无参考评测背景。

## 展示与操作

- 实验数据改用可横向滚动的 HTML 表格；示例波形改用响应式 SVG。
- 类比只保留文字，避免重复展示同一组交互控件。
- 封面两侧分别初始化为潜空间与波形空间；区分训练、推理流程。
- 公式定义使用可键盘操作的按钮，公式按纯文本渲染。
- 操作滑块、按钮或滚动表格时，方向键不再触发翻章。

## 验证

- `npm run build` 通过（TypeScript + Vite）。
- 浏览器验证十章、全部模块选项、两组 CFG/步数扫描、滑块端点和键盘操作。
- 检查桌面与手机窄屏，宽表在自身区域滚动；十章没有页面级横向溢出。
- 浏览器检查未发现 console error/warning。
- 本次没有运行 WavFlow 训练或音频推理；数值来自指定论文，动画为明确标注的教学示意。

主要文件：`src/data/tutorial.ts`、`src/modules/ch*.tsx`；展示辅助为 `src/components/Evidence.tsx`、`WavePlot.tsx`、`Formula.tsx`、`AnalogyCard.tsx`、`src/App.tsx` 和 `src/styles/paper.css`。
