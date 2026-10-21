import { useRef, useState } from 'react';
import { arrow, clearScene, drawLabel, Feedback, palette, roundRect, useDrawing } from './vit-kit';
import { computePatchProjection } from './vit-numbers';

const steps = ['看2×2像素', '把4个数排成一行', '算第1个输出', '算第2个输出', '得到新的记录卡'];

export function Widget2b() {
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLCanvasElement>(null);
  const { input, rules, output } = computePatchProjection();
  const feedback = [
    '这是一块缩小的黑白教学图：上排亮度1、2，下排3、4。数字只表示人为给定的亮度，不表示房屋概率。',
    '从上到下、每行从左到右，把1、2、3、4排成[1,2,3,4]。4个数一个没少，只是排列形状从2行2列变为1行4列。',
    `先看系数表第1列[0.5,0.5,0,0]：1×0.5+2×0.5+3×0+4×0=${output[0]}。这一列决定第1个输出怎样组合所有输入。`,
    `再看第2列[0,0,0.5,0.5]：1×0+2×0+3×0.5+4×0.5=${output[1]}。用同一行输入，换一列系数，就算出另一个输出。`,
    `结果是[${output.join(', ')}]。4个数变成2个数，叫从4维投影到2维。这里的规则恰好取上下排均值；真实ViT会训练这些系数，输出不必是平均值，也不必更短。`,
  ];
  useDrawing(ref, ctx => {
    clearScene(ctx, 1080, 280);
    input.forEach((value, i) => {
      const x = step === 0 ? 55 + i % 2 * 78 : 35 + i * 74;
      const y = step === 0 ? 62 + Math.floor(i / 2) * 78 : 100;
      roundRect(ctx, x, y, 64, 64, 5, '#fff', palette.blue);
      drawLabel(ctx, String(value), x + 25, y + 34, palette.text);
    });
    if (step >= 2) {
      arrow(ctx, 345, 135, 410, 135);
      rules.forEach((row, i) => row.forEach((value, j) => {
        const active = step === 4 || j === step - 2;
        roundRect(ctx, 440 + j * 100, 38 + i * 50, 85, 43, 4, active ? '#e6edf7' : '#fff', active ? palette.orange : palette.border);
        drawLabel(ctx, String(value), 464 + j * 100, 61 + i * 50, active ? palette.blue : palette.muted);
      }));
      arrow(ctx, 652, 135, 752, 135);
      output.forEach((value, i) => {
        const visible = i === 0 || step >= 3;
        roundRect(ctx, 792 + i * 104, 96, 88, 74, 6, '#fff', visible ? palette.green : palette.border);
        if (visible) drawLabel(ctx, String(value), 815 + i * 104, 135, palette.green);
      });
    }
    drawLabel(ctx, step === 0 ? '原来的小块' : '同一行输入', 35, 24);
    if (step >= 2) drawLabel(ctx, '投影后的数', 789, 65);
  });
  return <div>
    <canvas ref={ref} role="img" aria-label={`第${step + 1}步：${steps[step]}。${feedback[step]}`} />
    <div className="step-ctrl">
      <button type="button" className="chip" disabled={step === 0} onClick={() => setStep(s => s - 1)}>上一步</button>
      <span className="step-label">{step + 1}/5 · {steps[step]}</span>
      <button type="button" className="chip" disabled={step === 4} onClick={() => setStep(s => s + 1)}>下一步</button>
      <button type="button" className="chip" onClick={() => setStep(0)}>从像素重新看</button>
    </div>
    <Feedback tone={step === 4 ? 'good' : 'neutral'}>{feedback[step]}</Feedback>
    {step >= 2 && <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
      <table className="paper">
        <caption>一列系数负责一个输出；先相乘，再把该列贡献相加</caption>
        <thead><tr><th>输入</th><th>第1列系数</th><th>对输出1的贡献</th><th>第2列系数</th><th>对输出2的贡献</th></tr></thead>
        <tbody>{input.map((value, i) => <tr key={i}><th scope="row">{value}</th><td>{rules[i][0]}</td><td>{value * rules[i][0]}</td><td>{rules[i][1]}</td><td>{step >= 3 ? value * rules[i][1] : '还没算'}</td></tr>)}</tbody>
        <tfoot><tr><th scope="row">相加</th><td>—</td><td>{output[0]}</td><td>—</td><td>{step >= 3 ? output[1] : '还没算'}</td></tr></tfoot>
      </table>
    </div>}
  </div>;
}
