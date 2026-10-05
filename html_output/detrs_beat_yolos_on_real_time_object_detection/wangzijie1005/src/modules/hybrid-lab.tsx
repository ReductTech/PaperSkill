import { useState } from 'react';
import { C, Scene, clear, frame, text, Feedback, Source } from './shared-kit';

const stages = [
  { title: 'S5 展开', shape: '20×20×256 → 400×256', detail: '把投影至 256 维后的 S5 网格展成 token 序列。Q = K = V 表示三者来自同一组 S5 特征；论文简写省略了位置编码、投影等实现细节。' },
  { title: 'AIFI 交互', shape: '400×256 → 400×256', detail: '在最高层 S5 对应的 token 间做尺度内注意力交互。标准配置 AIFI 为 1 层；S3、S4 此时仍在旁路中。' },
  { title: '恢复二维', shape: '400×256 → 20×20×256', detail: '将交互后的序列恢复成二维特征 F5，为后续跨尺度融合提供高层信息。' },
  { title: 'CCFF 融合', shape: '{S3, S4, F5} → 三尺度输出 O', detail: '用 CNN 进行跨尺度融合。简图中的双向连接概括上采样和下采样路径；S3、S4 的局部信息始终保留。' },
];
function arrow(ctx: CanvasRenderingContext2D, points: number[][], color: string) {
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2; ctx.beginPath(); points.forEach((point, index) => index ? ctx.lineTo(point[0], point[1]) : ctx.moveTo(point[0], point[1])); ctx.stroke();
  const end = points[points.length - 1], previous = points[points.length - 2];
  const angle = Math.atan2(end[1] - previous[1], end[0] - previous[0]);
  ctx.translate(end[0], end[1]); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -4); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill(); ctx.restore();
}
export function HybridLab() {
  const [step, setStep] = useState(0);
  const stage = stages[step];
  return <div onKeyDown={event => event.stopPropagation()}>
    <div className="chip-row"><button className="chip" disabled={step === 0} onClick={() => setStep(value => value - 1)}>上一步</button><strong>{step + 1} / 4 · {stage.title}</strong><button className="chip" disabled={step === 3} onClick={() => setStep(value => value + 1)}>下一步</button><button className="chip" onClick={() => setStep(0)}>重置</button></div>
    <Scene height={260} label={`当前 ${stage.title}。结构从 S5 经 Flatten、AIFI、Reshape 得到 F5，再与始终保留的 S3、S4 一起进入 CCFF。`} draw={ctx => {
      clear(ctx, 560, 260);
      const nodes = [{ x: 24, label: 'S5' }, { x: 133, label: 'Flatten' }, { x: 248, label: 'AIFI' }, { x: 358, label: 'F5' }];
      arrow(ctx, [[104, 60], [133, 60]], step === 0 ? C.blue : C.line);
      arrow(ctx, [[221, 60], [248, 60]], step === 1 ? C.blue : C.line);
      arrow(ctx, [[328, 60], [358, 60]], step === 2 ? C.blue : C.line);
      arrow(ctx, [[420, 60], [429, 60], [429, 139], [441, 139]], step === 3 ? C.green : C.line);
      arrow(ctx, [[104, 157], [441, 157]], step === 3 ? C.green : C.line);
      arrow(ctx, [[104, 218], [409, 218], [409, 208], [441, 208]], step === 3 ? C.green : C.line);
      nodes.forEach((node, index) => { const width = index === 1 ? 88 : index === 3 ? 62 : 80; ctx.fillStyle = index === step + 1 ? C.light : C.white; ctx.fillRect(node.x, 39, width, 42); frame(ctx, node.x, 39, width, 42, index === step + 1 ? C.blue : C.line); text(ctx, node.label, node.x + 8, 65, C.ink); });
      text(ctx, 'Reshape', 344, 29, step === 2 ? C.blue : C.muted);
      for (const [name, y] of [['S3', 137], ['S4', 198]] as const) { ctx.fillStyle = C.white; ctx.fillRect(24, y, 80, 40); frame(ctx, 24, y, 80, 40, C.line); text(ctx, name, 43, y + 26, C.ink); }
      ctx.fillStyle = step === 3 ? C.light : C.white; ctx.fillRect(442, 118, 99, 113); frame(ctx, 442, 118, 99, 113, step === 3 ? C.green : C.line); text(ctx, 'CCFF', 464, 144, C.ink);
      ctx.strokeStyle = C.dark; ctx.strokeRect(468, 157, 43, 13); ctx.strokeRect(468, 182, 43, 13); ctx.strokeRect(468, 207, 43, 13);
      arrow(ctx, [[456, 212], [456, 166]], C.green); arrow(ctx, [[525, 166], [525, 211]], C.green);
      arrow(ctx, [[492, 118], [492, 88]], step === 3 ? C.green : C.line); text(ctx, 'O', 486, 79, C.ink);
    }} />
    <div aria-live="polite" style={{ margin: '10px 0' }}><strong>示例形状：{stage.shape}</strong></div>
    <Feedback>{stage.title}：{stage.detail}</Feedback>
    <p style={{ fontSize: 16 }}>图为按论文重绘的结构示意；形状省略 batch，256 维指编码器通道投影后的 embedding，并非原始骨干 S5 通道。256 维、AIFI 1 层、RepBlock 3 个来自补充材料标准配置。CCFF 融合块有两个 1×1 卷积分支及 RepBlock，最后逐元素相加；这里没有执行卷积或 attention。</p>
    <Source page={5} label="原文第 5 页 Eq. (1)、Fig. 4–5；标准配置见补充 Table A" />
  </div>;
}
