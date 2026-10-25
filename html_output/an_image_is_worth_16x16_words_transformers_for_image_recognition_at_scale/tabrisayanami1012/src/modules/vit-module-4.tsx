import React, { useId, useRef, useState } from 'react';
import { arrow, clearScene, drawLabel, drawPaper, Feedback, palette, roundRect, useDrawing } from './vit-kit';
import { computeQkv, PART_NAMES } from './vit-numbers';

export const KEYS = PART_NAMES.map((_, i) => computeQkv(i).k);
export const VALUES = PART_NAMES.map((_, i) => computeQkv(i).v);
const STAGES = ['准备Q、K、V', '点积：算匹配分数', '缩放：除以√2', 'softmax：分配份额', '乘V相加：取回信息'];
const fixed = (value: number, digits = 4) => value.toFixed(digits);
const vector = (value: number[], digits = 4) => `[${value.map((v) => fixed(v, digits)).join(', ')}]`;

export function computeAttentionExample(queryStrength: number) {
  const query = [queryStrength, 1];
  const dots = KEYS.map((key) => query.reduce((sum, value, j) => sum + value * key[j], 0));
  const scores = dots.map((value) => value / Math.sqrt(2));
  // Scores are bounded by ±√2, so the displayed exponentials are also safe to compute directly.
  const exponentials = scores.map(Math.exp);
  const denominator = exponentials.reduce((sum, value) => sum + value, 0);
  const weights = exponentials.map((value) => value / denominator);
  const contributions = VALUES.map((value, i) => value.map((v) => weights[i] * v));
  const output = [0, 1].map((j) => contributions.reduce((sum, value) => sum + value[j], 0));
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  return { query, dots, scores, exponentials, denominator, weights, contributions, output, weightSum };
}

export function Widget4() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputId = useId();
  const tableId = useId();
  const [queryStrength, setQueryStrength] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [stage, setStage] = useState(0);
  const { query, dots, scores, exponentials, denominator, weights, contributions, output, weightSum } = computeAttentionExample(queryStrength);
  const feedback = [
    `现在屋顶的q=${vector(query, 1)}。每个候选块另有k和v，完整列在下表。先用q和k比较，v暂时放着不动；屋顶也可以参考自己。`,
    `q与屋顶k的点积是${fixed(queryStrength, 1)}×1+1×0=${fixed(dots[0], 1)}；窗户是${fixed(queryStrength, 1)}×0+1×1=${fixed(dots[1], 1)}；墙壁是${fixed(queryStrength, 1)}×(−1)+1×0=${fixed(dots[2], 1)}。分数可为负，还不能拿它当百分比。`,
    `每个q和k有2个数，所以每项都除以√2≈1.4142，变成${vector(scores)}。顺序没有被改变；尺度变小，会影响下一步份额有多集中。`,
    `先取指数得到${vector(exponentials)}，相加为${fixed(denominator)}。每项再除以同一总和，得${vector(weights)}，总和${fixed(weightSum)}。屋顶、窗户、墙壁分别贡献约${weights.map(w => (w * 100).toFixed(2) + '%').join('、')}的信息，不是三个类别的概率。`,
    `用份额乘各块的v再相加：第1个输出=${fixed(weights[0])}×1+${fixed(weights[1])}×0+${fixed(weights[2])}×1=${fixed(output[0])}；第2个输出=${fixed(weights[0])}×0+${fixed(weights[1])}×1+${fixed(weights[2])}×1=${fixed(output[1])}。得到${vector(output)}，是一行汇总信息，不是“房屋”的概率。`,
  ];

  useDrawing(canvasRef, (ctx) => {
    clearScene(ctx, 1080, 280);
    drawPaper(ctx, 28, 40, 400, 192);
    const centers = [105, 235, 365];
    centers.forEach((x) => roundRect(ctx, x - 43, 87, 86, 119, 9, '#ffffff', palette.border));
    weights.forEach((weight, i) => {
      roundRect(ctx, 585, 65 + i * 57, 360, 30, 8, '#e6ede0', palette.border);
      ctx.save();
      ctx.globalAlpha = stage >= 3 ? weight : 0;
      ctx.fillStyle = palette.orange;
      ctx.beginPath();
      ctx.moveTo(centers[i], 50);
      ctx.lineTo(centers[i] - 43, 198);
      ctx.lineTo(centers[i] + 43, 198);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      if (stage >= 3) roundRect(ctx, 585, 65 + i * 57, 360 * weight, 30, 8, palette.green);
      else if (stage === 1 || stage === 2) {
        const value = stage === 1 ? dots[i] : scores[i];
        const barWidth = Math.abs(value) / 2 * 175;
        roundRect(ctx, value < 0 ? 765 - barWidth : 765, 65 + i * 57, barWidth, 30, 3, palette.blue);
        ctx.strokeStyle = palette.text;
        ctx.beginPath(); ctx.moveTo(765, 61 + i * 57); ctx.lineTo(765, 99 + i * 57); ctx.stroke();
      }
    });
    ctx.fillStyle = palette.blue;
    ctx.beginPath();
    ctx.moveTo(105, 124);
    ctx.lineTo(83, 164);
    ctx.lineTo(127, 164);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(235, 145, 23, 0, Math.PI * 2);
    ctx.fill();
    roundRect(ctx, 342, 122, 46, 46, 4, palette.blue);
    arrow(ctx, 453, 144, 548, 144, palette.blue);
    drawLabel(ctx, '三个候选块', 175, 26, palette.blue);
    drawLabel(ctx, stage >= 3 ? '参考份额' : stage >= 1 ? '匹配分数' : '还没开始算', 710, 26, palette.blue);
    ctx.save();
    ctx.font = '600 22px sans-serif'; ctx.fillStyle = palette.blue;
    ctx.fillText(vector(query, 1), 165, 263);
    ctx.restore();
  });

  return (
    <div onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation(); }}>
      <canvas
        ref={canvasRef}
        width={1080}
        height={280}
        role="img"
        style={{ width: '100%', height: 'auto' }}
        aria-label={`左起屋顶、窗户、墙壁，对应右侧上到下三条。当前${STAGES[stage]}；${stage >= 3 ? '条形份额使用0到1统一尺度' : '匹配分数使用−2到2统一尺度，零点在中间'}。`}
      />
      <div className="step-ctrl">
        <button type="button" className="chip" disabled={stage === 0} onClick={() => setStage(s => s - 1)}>上一步</button>
        <span className="step-label">第 {stage + 1}/5 步 · {STAGES[stage]}</span>
        <button type="button" className="chip" disabled={stage === 4} onClick={() => setStage(s => s + 1)}>下一步</button>
      </div>
      <div className="ctrl">
        <label htmlFor={inputId}>试着改变屋顶q的第1个数 <span className="val">{fixed(queryStrength, 1)}</span></label>
        <input
          id={inputId}
          type="range"
          min={-2}
          max={2}
          step={0.1}
          value={queryStrength}
          onChange={(event) => setQueryStrength(Math.max(-2, Math.min(2, Number(event.target.value))))}
          aria-valuetext={`${fixed(queryStrength, 1)}，查询向量为${vector(query, 1)}`}
        />
      </div>
      <div className="step-ctrl">
        <button type="button" className="chip" aria-expanded={detailsOpen} aria-controls={tableId} onClick={() => setDetailsOpen((open) => !open)}>
          {detailsOpen ? '收起逐项计算' : '展开逐项计算'}
        </button>
        <button type="button" className="chip" onClick={() => { setQueryStrength(1); setStage(0); setDetailsOpen(true); }}>从默认QKV重新算</button>
      </div>
      <div className="step-desc">
        查询 q=[{fixed(queryStrength, 1)}, 1]。左起三块代表屋顶、窗户、墙壁，对应右侧从上到下的三条。前两步看匹配分数（中间为0），得到份额后才改用0–1的比例尺。
      </div>
      <Feedback tone={stage === 4 ? 'good' : 'neutral'}>{feedback[stage]}</Feedback>
      <div id={tableId} hidden={!detailsOpen}>
        <div style={{ maxWidth: '100%', overflowX: 'auto' }} tabIndex={detailsOpen ? 0 : -1} role="region" aria-label="逐项注意力计算表，可横向滚动">
          <table className="paper" style={{ minWidth: 700 }}>
            <caption>每一行都是同一块：用它的K匹配，再按份额取它的V；后续数字按步骤揭示</caption>
            <thead><tr><th scope="col">候选块、K和V</th><th scope="col">点积 → 缩放分数</th><th scope="col">指数</th><th scope="col">参考份额</th><th scope="col">本块带回的信息</th></tr></thead>
            <tbody>{VALUES.map((value, i) => (
              <tr key={i}>
                <th scope="row">{PART_NAMES[i]}<br/>k={vector(KEYS[i], 0)}<br/>v={vector(value, 0)}</th>
                <td>{stage >= 1 ? fixed(dots[i]) : '还没算'} → {stage >= 2 ? fixed(scores[i]) : '还没算'}</td>
                <td>{stage >= 3 ? fixed(exponentials[i]) : '还没算'}</td>
                <td>{stage >= 3 ? fixed(weights[i]) : '还没算'}</td>
                <td>{stage >= 4 ? vector(contributions[i]) : '还没取'}</td>
              </tr>
            ))}</tbody>
            <tfoot><tr><th scope="row">总计</th><td>{stage >= 2 ? '每项除以√2' : '—'}</td><td>{stage >= 3 ? '相加=' + fixed(denominator) : '—'}</td><td>{stage >= 3 ? '相加=' + fixed(weightSum) : '—'}</td><td>{stage >= 4 ? '输出' + vector(output) : '—'}</td></tr></tfoot>
          </table>
        </div>
        <div className="step-desc">这些是指定的教学数据，不是训练后ViT的注意力图。计算使用完整精度，显示保留四位小数；因此手加显示值可能有末位舍入差异。</div>
      </div>
    </div>
  );
}
