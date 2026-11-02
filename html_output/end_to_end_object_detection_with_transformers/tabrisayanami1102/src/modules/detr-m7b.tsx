import React, { useState } from 'react';
import { C, Canvas, clear, rect, text, line } from './detr-kit';

export function classUpdateTrace(count = 8) {
  let z = 0;
  return Array.from({ length: count + 1 }, (_, step) => {
    const p = 1 / (1 + Math.exp(-z));
    const loss = -Math.log(p);
    const gradient = p - 1;
    const next = z - 0.5 * gradient;
    const result = { step, z, p, loss, gradient, next };
    z = next;
    return result;
  });
}
export const classTrace = classUpdateTrace();

function D7BContent() {
  const [step, setStep] = useState(0);
  const now = classTrace[step];
  const feedback = step === 0
    ? '当前正确类别概率是0.5，分类损失约0.693。梯度是−0.5，按学习率0.5更新后，分数z会从0升到0.25。'
    : step < 4
      ? `第${step}次更新后，z为${now.z.toFixed(3)}，正确类别概率升到${now.p.toFixed(3)}。梯度仍为负，减去它会继续提高正确类别的分数。`
      : `经过${step}次更新，正确类别概率从0.500升到${now.p.toFixed(3)}，损失从0.693降到${now.loss.toFixed(3)}。当前梯度的绝对值也变小了。`;
  return <div>
    <Canvas ariaLabel="正确类别的概率与分类损失随参数更新改变" draw={(ctx) => {
      clear(ctx);
      text(ctx, '正确类别', 48, 45, 22, C.ink);
      rect(ctx, 48, 105, 390, 58, '#dce5d2', true);
      rect(ctx, 48, 105, 390 * now.p, 58, step ? C.green : C.blue, true);
      text(ctx, now.p.toFixed(3), 48 + 390 * now.p - 28, 93, 25, step ? C.green : C.blue);
      text(ctx, (1 - now.p).toFixed(3), 370, 197, 21, C.ink);
      text(ctx, '分类损失', 585, 45, 22, C.ink);
      const x0 = 590, y0 = 244, w = 425, h = 158;
      line(ctx, x0, y0, x0 + w, y0, '#d7deea');
      line(ctx, x0, y0, x0, y0 - h, '#d7deea');
      [0, 4, 8].forEach((i) => text(ctx, String(i), x0 + i / 8 * w - 6, y0 + 26, 18, C.ink));
      text(ctx, '0', x0 - 24, y0 + 5, 18, C.ink);
      text(ctx, '0.7', x0 - 42, y0 - h + 6, 18, C.ink);
      ctx.beginPath();
      classTrace.slice(0, step + 1).forEach((v, i) => {
        const x = x0 + v.step / 8 * w, y = y0 - v.loss / 0.7 * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.stroke();
      classTrace.slice(0, step + 1).forEach((v) => {
        ctx.beginPath(); ctx.arc(x0 + v.step / 8 * w, y0 - v.loss / 0.7 * h, 6, 0, Math.PI * 2);
        ctx.fillStyle = v.step === step ? C.orange : C.green; ctx.fill();
      });
      text(ctx, now.loss.toFixed(3), Math.min(965, x0 + step / 8 * w + 10), y0 - now.loss / 0.7 * h - 13, 23, C.green);
    }} />
    <div className="step-ctrl">
      <button type="button" className="tiny ghost" onClick={() => setStep(0)} disabled={step === 0}>重置</button>
      <button type="button" className="tiny ghost" onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step === 0}>上一次更新</button>
      <span className="step-label"><b>{step}</b> / 8 次更新</span>
      <button type="button" className="tiny" onClick={() => setStep((n) => Math.min(8, n + 1))} disabled={step === 8}>下一次更新</button>
    </div>
    <div style={{ overflowX: 'auto' }}><table className="paper" aria-label="一个类别分数的计算记录">
      <thead><tr><th>当前分数 z</th><th>正确类别概率 p</th><th>损失 −log(p)</th><th>梯度 p−1</th><th>下一步 z−0.5(p−1)</th></tr></thead>
      <tbody><tr><td>{now.z.toFixed(4)}</td><td>{now.p.toFixed(4)}</td><td>{now.loss.toFixed(4)}</td><td>{now.gradient.toFixed(4)}</td><td>{now.next.toFixed(4)}</td></tr></tbody>
    </table></div>
    <div className={`feedback ${step ? 'good' : ''}`} role="status" aria-live="polite">{feedback}</div>
  </div>;
}

export function D7B(){return <div data-scope="WidgetKeyScope" onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();}}><D7BContent/></div>;}
