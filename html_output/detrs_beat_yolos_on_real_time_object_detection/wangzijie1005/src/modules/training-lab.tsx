import { useState } from 'react';
import { C, Scene, clear, photo, frame, bar, text, Feedback, Source } from './shared-kit';

const stages = [
  { name: '预测', detail: '训练图像输入网络，先产生类别和框。真值供后续监督使用，不是网络在部署时的输入。' },
  { name: '匹配', detail: '训练时将预测与真实标注进行匹配，以确定哪些预测接受哪些目标的监督。虚线框表示训练可用的标注。' },
  { name: '监督', detail: '当前官方实现中，匹配框与真值框的 IoU 经 detach 后作为正类软目标，使用加权 BCE。detach 表示不经这个 IoU 目标计算路径向预测框坐标反传梯度；定位仍由框回归损失监督。部署时真值不可见，查询选择依靠预测分类分数。' },
  { name: '更新', detail: '损失通过反向传播更新参数，使模型学习更合适的分类与定位表示。图中连线表示监督与参数更新的关系。' },
  { name: '推理', detail: '真实标注不可见。根据预测分类分数选 Top-300 编码器特征，对应预测框初始化位置查询，再交给解码器。' },
];
const codeURL = 'https://github.com/lyuwenyu/RT-DETR/blob/29320b6fd828f8e0987a71426cf2d961b09dfed7/rtdetr_pytorch/src/zoo/rtdetr/rtdetr_criterion.py#L111-L136';

export function TrainingLab() {
  const [step, setStep] = useState(0);
  const inference = step === 4;
  return <div onKeyDown={e => { if (e.key.startsWith('Arrow')) e.stopPropagation(); }}>
    <div className="chip-row" style={{ flexWrap: 'wrap' }}>
      <button type="button" className="chip" disabled={step === 0} onClick={() => setStep(s => s - 1)}>上一步</button>
      <strong aria-live="polite">{step + 1} / 5 · {stages[step].name}</strong>
      <button type="button" className="chip" disabled={step === 4} onClick={() => setStep(s => s + 1)}>下一步</button>
      <button type="button" className="chip" onClick={() => setStep(0)}>重置</button>
    </div>
    <Scene height={240} label={inference ? '推理示意：真实框已经移除，预测分类分数通往Top-300选择。' : '训练示意：实线预测框与虚线真实框可比较，当前训练环节高亮。'}
      draw={ctx => {
        clear(ctx, 560, 240); photo(ctx, 20, 40, 260, 156);
        frame(ctx, 94, 84, 105, 78, C.orange);
        if (!inference) { ctx.save(); ctx.setLineDash([6, 5]); frame(ctx, 120, 70, 94, 96, C.blue); ctx.restore(); }
        for (let i = 0; i < 5; i++) {
          const x = 314 + i * 46;
          if (i < 4) { ctx.beginPath(); ctx.moveTo(x + 14, 74); ctx.lineTo(x + 32, 74); ctx.strokeStyle = i < step ? C.green : C.line; ctx.lineWidth = 2; ctx.stroke(); }
          ctx.beginPath(); ctx.arc(x, 74, 13, 0, Math.PI * 2); ctx.fillStyle = i === step ? C.blue : C.line; ctx.fill();
          text(ctx, String(i + 1), x - 4, 79, i === step ? '#ffffff' : C.ink);
        }
        if (inference) {
          [0.88, 0.66, 0.43].forEach((score, i) => bar(ctx, 320, 112 + i * 20, 165 * score, 12, i === 0 ? C.green : C.light));
          text(ctx, 'Top-300', 370, 205, C.green);
        } else {
          ctx.beginPath(); ctx.moveTo(302, 150); ctx.lineTo(520, 150); ctx.strokeStyle = step === 2 || step === 3 ? C.orange : C.line; ctx.lineWidth = 3; ctx.stroke();
          text(ctx, '训练监督', 361, 190, C.ink);
        }
      }} />
    <p style={{ fontSize: 16 }}>橙色实线：示意预测框；蓝色虚线：仅训练时可用的真值。图形和分数是教学构造。</p>
    <Feedback tone={inference ? 'good' : 'neutral'}><strong>{stages[step].name}：</strong>{stages[step].detail}</Feedback>
    <p style={{ fontSize: 16 }}>论文 Eq. (3) 概括监督关系；不能把其中的分布差异式直接当成两个不同形状概率张量相减的程序，也不能编造推理阶段的“真实 IoU 分数”。</p>
    <Source page={5} label="原文 P5 · Eq. (3)：训练监督的概括式" />
    <p><Source page={7} label="原文 P7 · §5.3：推理按分类得分选择 Top-300" /></p>
    <p style={{ fontSize: 14 }}><a href={codeURL} target="_blank" rel="noreferrer">官方代码快照：loss_labels_vfl</a>（提交 29320b6，2026-09-07）用于说明实现，不能当作 2024 年训练环境已锁定的证据。</p>
  </div>;
}
