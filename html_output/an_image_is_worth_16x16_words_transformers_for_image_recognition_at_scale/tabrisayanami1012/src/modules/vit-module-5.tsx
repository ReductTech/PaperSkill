import React, { useRef, useState } from 'react';
import { arrow, clearScene, drawLabel, Feedback, palette, roundRect, useDrawing } from './vit-kit';

export const INPUT = [1, 2, 3, 4];
export const ATTENTION_INCREMENT = [0.2, -0.1, 0.3, 0];
export const MLP_INCREMENT = [-0.1, 0.2, 0.1, -0.2];
const EPSILON = 1e-5;
const STAGES = ['输入标记', 'LN 与多头注意力', '第一次残差相加', 'LN 与 MLP', '第二次残差相加'];
const vec = (values: number[], digits = 4) => `[${values.map((value) => value.toFixed(digits)).join(', ')}]`;

export function layerNorm(values: number[]) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return { mean, variance, values: values.map((value) => (value - mean) / Math.sqrt(variance + EPSILON)) };
}

export function encoderExample() {
  const afterAttention = INPUT.map((value, i) => value + ATTENTION_INCREMENT[i]);
  const afterMlp = afterAttention.map((value, i) => value + MLP_INCREMENT[i]);
  return { input: INPUT, attentionIncrement: ATTENTION_INCREMENT, mlpIncrement: MLP_INCREMENT, afterAttention, afterMlp, firstNorm: layerNorm(INPUT), secondNorm: layerNorm(afterAttention) };
}

function vectorBars(ctx: CanvasRenderingContext2D, values: number[], x: number, y: number, width: number, color: string) {
  values.forEach((value, i) => roundRect(ctx, x, y + i * 12, Math.max(2, width * Math.abs(value) / 4), 7, 2, color));
}

function plusNode(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 7); ctx.stroke();
}

function normIcon(ctx: CanvasRenderingContext2D, x: number, color: string) {
  roundRect(ctx, x, 105, 55, 70, 8, '#ffffff', color);
  [0, 1, 2].forEach((i) => {
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 14, 125 + i * 13); ctx.lineTo(x + 41, 125 + i * 13); ctx.stroke();
  });
}

export function Widget5() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState(0);
  const { afterAttention, afterMlp, firstNorm, secondNorm } = encoderExample();
  const stageInputs = [INPUT, INPUT, INPUT, afterAttention, afterAttention];
  const stageOutputs = [INPUT, ATTENTION_INCREMENT, afterAttention, MLP_INCREMENT, afterMlp];
  const operations = ['查看输入', '层归一化 → 多头注意力（固定教学增量）', '输入 + 注意力增量', '层归一化 → 逐标记 MLP（固定教学增量）', '第一次残差结果 + MLP增量'];
  const feedback = [
    `输入的整段序列是 S×D；这里只取一个标记的四维向量 z=${vec(INPUT, 0)} 看运算。标记数和特征宽度是两回事。`,
    `先在这一个标记的特征维上做 LN：均值${firstNorm.mean.toFixed(1)}，方差${firstNorm.variance.toFixed(2)}；当 γ=1、β=0、ε=10⁻⁵ 时，得到约${vec(firstNorm.values)}。多头注意力让不同标记交流；每头宽d_h，h头拼接成D维，再经输出投影。本页先指定教学增量 Δ_attn=${vec(ATTENTION_INCREMENT, 1)}，它不是由训练好的权重生成的。`,
    `残差做逐元素相加：z′=z+Δ_attn=${vec(afterAttention, 1)}。这是相加，不是拼接，所以仍然是四维；整段序列仍是 S×D。`,
    `对 z′再次做 LN，约为${vec(secondNorm.values)}。随后同一套 MLP 分别加工每个标记，常见宽度为 D→4D→D，内含 GELU 非线性；这一步本身不混合不同标记。本页指定教学增量 Δ_mlp=${vec(MLP_INCREMENT, 1)}，不是实际模型计算结果。`,
    `第二次残差相加得到 z_next=z′+Δ_mlp=${vec(afterMlp, 1)}。一层结束，S×D的形状保持，内容已经改变。下一层会继续交流与加工，不是在这里直接平均全部图块。`,
  ];

  useDrawing(canvasRef, (ctx) => {
    clearScene(ctx, 1080, 280);
    const colorFor = (index: number) => stage === index ? palette.orange : stage > index ? palette.green : palette.border;
    const inputColor = colorFor(0);
    const attentionColor = colorFor(1);
    const firstColor = colorFor(2);
    const mlpColor = colorFor(3);
    const finalColor = colorFor(4);
    roundRect(ctx, 25, 105, 110, 70, 8, '#ffffff', inputColor);
    roundRect(ctx, 235, 92, 160, 95, 9, '#ffffff', attentionColor);
    roundRect(ctx, 580, 92, 165, 95, 9, '#ffffff', mlpColor);
    roundRect(ctx, 865, 105, 180, 70, 8, '#ffffff', finalColor);
    const links = [[135, 160, 1], [215, 235, 1], [395, 423, 2], [456, 505, 3], [560, 580, 3], [745, 778, 4], [811, 865, 4]];
    links.forEach(([x1, x2, index]) => arrow(ctx, x1, 140, x2, 140, stage >= index ? palette.blue : palette.border));
    [[80, 440, 2], [440, 795, 4]].forEach(([from, to, index]) => {
      const color = stage >= index ? palette.blue : palette.border;
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(from, from === 80 ? 176 : 158); ctx.lineTo(from, 231); ctx.lineTo(to, 231); ctx.lineTo(to, 166); ctx.stroke();
      arrow(ctx, to, 184, to, 158, color);
    });
    normIcon(ctx, 160, attentionColor);
    normIcon(ctx, 505, mlpColor);
    // Several input positions connect across the attention branch.
    [0, 1, 2].forEach((i) => {
      [0, 1, 2].forEach((j) => {
        ctx.strokeStyle = stage >= 1 ? palette.light : palette.border; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(257, 116 + i * 24); ctx.lineTo(373, 116 + j * 24); ctx.stroke();
      });
      roundRect(ctx, 248, 108 + i * 24, 18, 16, 4, attentionColor);
      roundRect(ctx, 365, 108 + i * 24, 18, 16, 4, attentionColor);
    });
    // Each row goes through its own feature transform; no cross-row MLP links.
    [0, 1, 2].forEach((i) => {
      const y = 116 + i * 24;
      ctx.strokeStyle = mlpColor; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(598, y); ctx.lineTo(646, y - 7); ctx.lineTo(686, y - 7); ctx.lineTo(729, y); ctx.moveTo(598, y); ctx.lineTo(646, y + 7); ctx.lineTo(686, y + 7); ctx.lineTo(729, y); ctx.stroke();
      roundRect(ctx, 594, y - 6, 12, 12, 3, mlpColor);
      roundRect(ctx, 722, y - 6, 12, 12, 3, mlpColor);
    });
    plusNode(ctx, 440, 140, firstColor);
    plusNode(ctx, 795, 140, finalColor);
    vectorBars(ctx, INPUT, 41, 116, 77, inputColor);
    if (stage === 4) vectorBars(ctx, afterMlp, 884, 116, 139, finalColor);
    else vectorBars(ctx, [1, 1, 1, 1], 884, 116, 139, palette.border);
    drawLabel(ctx, '跨标记', 285, 62, palette.blue);
    drawLabel(ctx, '逐标记', 635, 62, palette.blue);
  });

  return (
    <div onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation(); }}>
      <canvas ref={canvasRef} width={1080} height={280} role="img" style={{ width: '100%', height: 'auto' }} aria-label={`编码器层两条残差支路，当前第${stage + 1}步：${STAGES[stage]}；注意力跨标记交流，MLP逐标记加工`} />
      <div className="step-desc">从左至右：输入 → 层归一化（LN）→ 多头注意力（MSA）→ 相加 → LN → 多层感知机（MLP）→ 相加 → 输出。下方两条跳接是残差路径；整段形状始终为 S×D。</div>
      <div className="step-ctrl">
        <button type="button" className="chip" disabled={stage === 0} onClick={() => setStage((value) => Math.max(0, value - 1))}>上一步</button>
        <span className="step-label">第 <b>{stage + 1}</b>/5 步：{STAGES[stage]}</span>
        <button type="button" className="chip" disabled={stage === 4} onClick={() => setStage((value) => Math.min(4, value + 1))}>下一步</button>
        <button type="button" className="chip" onClick={() => setStage(0)}>重置本层</button>
      </div>
      <div style={{ maxWidth: '100%', overflowX: 'auto' }} role="region" aria-label="当前阶段四维教学数值" tabIndex={0}>
        <table className="paper" style={{ minWidth: 460 }}>
          <tbody>
            <tr><th scope="row">输入</th><td>{vec(stageInputs[stage], 1)}</td></tr>
            <tr><th scope="row">本步操作</th><td>{operations[stage]}</td></tr>
            <tr><th scope="row">本步输出</th><td>{vec(stageOutputs[stage], 1)}{stage === 1 || stage === 3 ? '（指定增量，尚未相加）' : ''}</td></tr>
            {(stage === 1 || stage === 3) && <tr><th scope="row">LN完整结果</th><td>{vec(stage === 1 ? firstNorm.values : secondNorm.values)}</td></tr>}
          </tbody>
        </table>
      </div>
      <Feedback>{feedback[stage]}</Feedback>
      <div className="step-desc">教学边界：LN与残差加法由上面的数字实际计算；注意力和MLP支路增量事先指定，没有在此运行已训练模型。LN按每个标记的D个特征求均值与方差（除以D），不是跨标记归一，也不是softmax。GELU是一种平滑的非线性激活函数，使MLP不只是把两次线性变换叠在一起。</div>
    </div>
  );
}
