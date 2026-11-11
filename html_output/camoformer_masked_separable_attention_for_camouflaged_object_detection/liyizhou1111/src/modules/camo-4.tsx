import { useRef, useState, type PointerEvent } from 'react';
import { C, PaintCanvas, clearScene, drawPaper, drawLeaf, drawStencil } from './camo-kit';

type Matrix = number[][];
function matrix(ctx: CanvasRenderingContext2D, a: Matrix, x: number, y: number, color: string, size = 52) {
  ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  a.forEach((row, i) => row.forEach((v, j) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + j * size, y + i * size, size - 4, size - 4);
    ctx.globalAlpha = Math.min(.8, .1 + Math.abs(v) * .55); ctx.fillStyle = color;
    ctx.fillRect(x + j * size, y + i * size, size - 4, size - 4); ctx.globalAlpha = 1;
    ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.strokeRect(x + j * size, y + i * size, size - 4, size - 4);
    ctx.fillStyle = C.text; ctx.fillText(v.toFixed(2), x + j * size + (size - 4) / 2, y + i * size + (size - 4) / 2);
  }));
}
function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, end: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(end, y); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(end, y); ctx.lineTo(end - 10, y - 6); ctx.lineTo(end - 10, y + 6); ctx.closePath(); ctx.fill();
}

export function CamoMaskMath() {
  const [p, setP] = useState(.5);
  const q = [[.9, 0], [.6 * p, .8 * p], [0, .1]];
  const v = [[1, .2], [.6, .8], [.1, 1]];
  const scores = [0, 1].map(i => [0, 1].map(j => q.reduce((sum, row) => sum + row[i] * row[j], 0)));
  const attention = scores.map(row => { const exps = row.map(Math.exp); const total = exps.reduce((a, b) => a + b, 0); return exps.map(x => x / total); });
  const output = v.map(row => [0, 1].map(j => row.reduce((sum, x, k) => sum + x * attention[k][j], 0)));
  const color = p < .3 ? C.red : p > .7 ? C.green : C.blue;
  const feedback = p < .3 ? '前景置信较低，该位置对前景相关性的贡献减弱；V 没有被遮住。' : p > .7 ? '前景置信升高，该位置对前景相关性的贡献增强；输出仍来自完整 V。' : '不确定的位置保留部分贡献，软掩码没有硬切断；完整 V 始终保留。';
  return <>
    <PaintCanvas draw={(ctx, w, h) => {
      clearScene(ctx, w, h);
      matrix(ctx, q, 40, 65, color); matrix(ctx, attention, 315, 90, C.blue);
      matrix(ctx, v, 580, 65, C.dark); matrix(ctx, output, 850, 65, C.green);
      arrow(ctx, 164, 140, 290, C.blue); arrow(ctx, 710, 140, 825, C.green);
      ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.strokeRect(36, 113, 108, 54);
      ctx.strokeStyle = C.dark; ctx.strokeRect(572, 57, 112, 160);
      ctx.textAlign = 'center'; ctx.font = '20px sans-serif'; ctx.fillStyle = C.text;
      ctx.fillText('掩码取证', 95, 32); ctx.fillText('完整内容', 628, 32);
    }} />
    <div className="ctrl"><label htmlFor="camo-mask-prob">位置 2 的前景概率　{p.toFixed(2)}</label><input id="camo-mask-prob" type="range" min="0.05" max="0.95" step="0.05" value={p} onChange={e => setP(Number(e.target.value))} /></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '12px 0' }}>
      <div><b>Qᶠ = Kᶠ</b><div>3 × 2，按位置加权</div></div><div><b>Softmax(QᶠᵀKᶠ)</b><div>2 × 2，每行和为 1</div></div><div><b>Vᶠ</b><div>3 × 2，数值固定</div></div><div><b>Vᶠ · A</b><div>3 × 2，随关系改变</div></div>
    </div>
    <div className="feedback" style={{ borderLeftColor: color }} aria-live="polite">{feedback}</div>
  </>;
}

export function CamoShapeSteps() {
  const [step, setStep] = useState(0);
  const feedback = ['Q 和 K 都为 N×C，掩码按空间位置广播。此算例 N=3、C=2。', 'QᵀK 得到 C×C 的通道相关矩阵，这里是 2×2，不是空间位置之间的 N×N。', '完整 V 乘归一化后的通道关系，输出仍为 N×C。多头时应在各头的通道子空间理解这一过程。'];
  return <><PaintCanvas draw={(ctx, w, h) => {
    clearScene(ctx, w, h);
    [0, 1, 2].forEach(i => {
      const x = 100 + i * 330; const rows = i === 1 ? 2 : 3;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 20, 30, 180, 220);
      ctx.strokeStyle = i === step ? (step === 2 ? C.green : C.blue) : C.border; ctx.lineWidth = i === step ? 4 : 1; ctx.strokeRect(x - 20, 30, 180, 220);
      for (let r = 0; r < rows; r++) for (let c = 0; c < 2; c++) { ctx.fillStyle = i === step ? C.blue : C.light; ctx.fillRect(x + c * 55, 58 + r * 46, 45, 36); }
      ctx.fillStyle = C.text; ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(rows + ' × 2', x + 50, 224);
      if (i < 2) arrow(ctx, x + 165, 140, x + 295, i < step ? C.green : C.border);
    });
  }} />
  <div className="ctrl"><button className="tiny" onClick={() => setStep(s => s - 1)} disabled={step === 0}>上一步</button><strong>{['掩码 Q、K', '通道关系', '聚合完整 V'][step]}　{step + 1}/3</strong><button className="tiny" onClick={() => setStep(s => s + 1)} disabled={step === 2}>下一步</button></div>
  <div className="feedback" aria-live="polite">{feedback[step]}</div></>;
}

export function CamoSoftMask() {
  const [offset, setOffset] = useState(45);
  const drag = useRef<{ x: number; offset: number } | null>(null);
  const clamp = (n: number) => Math.max(-100, Math.min(100, n));
  const localX = (e: PointerEvent<HTMLCanvasElement>) => (e.clientX - e.currentTarget.getBoundingClientRect().left) * 1080 / e.currentTarget.getBoundingClientRect().width;
  const foreground = [-70, 0, 70].map(x => 1 / (1 + Math.exp((Math.abs(x - offset) - 65) / 18)));
  const distance = Math.abs(offset); const color = distance > 60 ? C.red : distance > 20 ? C.blue : C.green;
  return <><PaintCanvas onPointerDown={(e: PointerEvent<HTMLCanvasElement>) => { drag.current = { x: localX(e), offset }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={(e: PointerEvent<HTMLCanvasElement>) => { if (drag.current) setOffset(clamp(Math.round(drag.current.offset + localX(e) - drag.current.x))); }} onPointerUp={(e: PointerEvent<HTMLCanvasElement>) => { drag.current = null; if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }} draw={(ctx, w, h) => {
    clearScene(ctx, w, h); drawPaper(ctx, 30, 20, 490, 240); drawLeaf(ctx, 275, 140, 1.25, C.dark);
    drawStencil(ctx, 275 + offset, 140, 1.25, .5);
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.moveTo(275, 34); ctx.lineTo(275, 245); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(275 + offset, 48, 11, 0, Math.PI * 2); ctx.fill();
    foreground.forEach((f, i) => {
      const x = 610 + 140 * i; ctx.fillStyle = C.light; ctx.fillRect(x, 60, 65, 150);
      ctx.fillStyle = C.blue; ctx.fillRect(x, 60, 65, 150 * f); ctx.fillStyle = C.purple; ctx.globalAlpha = .5; ctx.fillRect(x, 60 + 150 * f, 65, 150 * (1 - f)); ctx.globalAlpha = 1;
      ctx.fillStyle = C.text; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(f.toFixed(2), x + 32, 40); ctx.fillText((1 - f).toFixed(2), x + 32, 238);
    });
    ctx.fillStyle = C.blue; ctx.textAlign = 'left'; ctx.fillText('前景', 535, 42); ctx.fillStyle = C.purple; ctx.fillText('背景', 535, 240);
  }} />
  <div className="ctrl"><button className="tiny" onClick={() => setOffset(x => clamp(x - 10))} disabled={offset <= -100}>向左对齐</button><button className="tiny" onClick={() => setOffset(0)}>居中</button><button className="tiny" onClick={() => setOffset(x => clamp(x + 10))} disabled={offset >= 100}>向右对齐</button><span>遮版偏移　{offset}</span></div>
  <div className="feedback" style={{ borderLeftColor: color }} aria-live="polite">{distance > 60 ? '预测遮版偏移可能把错误区域当成前景；这是误差传播的概念示意，并非论文测得的错误率。' : distance > 20 ? '遮版逐渐对齐，边界附近仍保留连续置信度；每个位置的前景与背景概率之和始终为 1。' : '当前示意已对齐；实际模型使用 3×3 卷积加 Sigmoid 生成预测掩码，不需要推理时的真值。'}</div></>;
}

export function CamoRefinement() {
  const [step, setStep] = useState(0);
  const sizes = [24, 24, 24, 48, 96]; const names = ['E5 → P5', 'D4 → P4', 'D3 → P3', 'D2 → P2', 'D1 → P1'];
  const feedback = ['E5 的 24×24 聚合特征生成粗预测 P5，为第一次 MSA 提供软掩码。', 'MSA(E5) 与对齐后的 E4 逐元素相乘，再加回 E4，形成 D4；输出仍为 24×24。', 'D3 继续在 24×24 尺度融合当前层线索；尺寸匹配不意味着每一级都翻倍。', 'D2 到 48×48，将 MSA 输出对齐后与当前层特征相乘并相加，继续生成 P2。', 'D1 到 96×96，产生 P1，再恢复到输入分辨率 384×384，作为最终分割预测。'];
  return <><PaintCanvas draw={(ctx, w, h) => {
    clearScene(ctx, w, h); drawPaper(ctx, 25, 20, 400, 240); drawLeaf(ctx, 225, 140, 1.4, C.light);
    ctx.save(); ctx.translate(225, 140); ctx.scale(1.4, 1.4); ctx.strokeStyle = step === 4 ? C.green : C.blue; ctx.lineWidth = 3; ctx.beginPath();
    const deviation = (4 - step) * 5;
    ctx.moveTo(-65 + deviation, 22 + deviation * .3);
    ctx.bezierCurveTo(-75 + deviation, -23 + deviation, -18, -54 + deviation, 65 - deviation, -27 + deviation * .2);
    ctx.bezierCurveTo(55 - deviation, 27 - deviation, -6, 49 - deviation, -65 + deviation, 22 + deviation * .3);
    ctx.closePath(); ctx.stroke(); ctx.restore();
    sizes.forEach((size, i) => {
      const x = 470 + i * 115; const side = 22 + size * .6;
      if (i < 4) arrow(ctx, x + 40, 140, x + 84, i < step ? C.green : C.border);
      ctx.fillStyle = i <= step ? C.blue : C.light; ctx.globalAlpha = i === step ? 1 : .35; ctx.fillRect(x - side / 2, 140 - side / 2, side, side); ctx.globalAlpha = 1;
      ctx.strokeStyle = i === step ? C.orange : C.border; ctx.lineWidth = i === step ? 4 : 1; ctx.strokeRect(x - side / 2, 140 - side / 2, side, side);
      ctx.fillStyle = C.text; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(size), x, 218);
    });
  }} />
  <div className="ctrl"><button className="tiny" onClick={() => setStep(s => s - 1)} disabled={step === 0}>上一步</button><strong>{names[step]}　{sizes[step]}×{sizes[step]}</strong><button className="tiny" onClick={() => setStep(s => s + 1)} disabled={step === 4}>下一步</button><button className="tiny" onClick={() => setStep(0)}>重置</button></div>
  <div className="feedback" aria-live="polite">{feedback[step]}</div></>;
}
