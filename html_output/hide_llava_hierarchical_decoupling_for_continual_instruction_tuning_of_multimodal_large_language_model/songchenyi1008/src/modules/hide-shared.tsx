import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';

const AW = 560;
const AH = 140;
const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', support: '#92400e', blue: '#27446e',
  green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', ink: '#21324a',
  muted: '#68778f', line: '#d7deea', white: '#ffffff',
};

function background(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e9efe2';
  ctx.fillRect(0, h - 30, w, 30);
  ctx.strokeStyle = '#cfdac7';
  ctx.lineWidth = 1;
  for (let x = 18; x < w; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, h - 30); ctx.lineTo(x + 14, h); ctx.stroke();
  }
}

function board(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = C.light, radius = 6) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.strokeStyle = C.support;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.62)';
  ctx.lineWidth = 1;
  for (let xx = x + 14; xx < x + w - 5; xx += 30) {
    ctx.beginPath(); ctx.moveTo(xx, y + 3); ctx.quadraticCurveTo(xx + 8, y + h / 2, xx, y + h - 3); ctx.stroke();
  }
}

function clampShape(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = C.dark;
  ctx.fillStyle = '#8fa57f';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(-32, -16, 64, 32, 8);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.support;
  ctx.fillRect(-6, 14, 12, 42);
  ctx.fillRect(-29, -25, 14, 14);
  ctx.fillRect(15, -25, 14, 14);
  ctx.restore();
}

function key(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.orange) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(6, -3, 18, 6);
  ctx.fillRect(18, 3, 5, 8);
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 3) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2); ctx.lineTo(x2 - 10 * Math.cos(a - 0.45), y2 - 10 * Math.sin(a - 0.45));
  ctx.lineTo(x2 - 10 * Math.cos(a + 0.45), y2 - 10 * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frac: number, color: string, value: string) {
  ctx.fillStyle = C.white; ctx.strokeStyle = C.line; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(x + 2, y + 2, Math.max(2, (w - 4) * clamp(frac, 0, 1)), h - 4, 4); ctx.fill();
  ctx.fillStyle = C.ink; ctx.font = '600 14px "Segoe UI", sans-serif'; ctx.textAlign = 'right';
  ctx.fillText(value, x + w - 8, y + h - 7); ctx.textAlign = 'left';
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color; ctx.font = '600 14px "Segoe UI", sans-serif'; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.textAlign = 'left';
}

function useAnimation(drawFn: (ctx: CanvasRenderingContext2D, time: number) => void, width = W, height = H) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(drawFn);
  drawRef.current = drawFn;
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let raf = 0;
    const ctx = setupCanvas(canvas, width, height);
    const tick = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      drawRef.current(ctx, time);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [width, height]);
  return ref;
}

function useDraw(drawFn: (ctx: CanvasRenderingContext2D) => void, deps: React.DependencyList, width = W, height = H) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height);
    ctx.clearRect(0, 0, width, height);
    drawFn(ctx);
    canvas.classList.add('is-ready');
  }, deps);
  return ref;
}


function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return <div className="metric"><div className="l">{label}</div><div className="v" style={color ? { color } : undefined}>{value}</div></div>;
}

function drawAnalogy(ctx: CanvasRenderingContext2D, variant: string, time: number) {
  background(ctx, AW, AH);
  const p = 0.5 - 0.5 * Math.cos((time / 2800) * Math.PI * 2);
  ctx.strokeStyle = C.support; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(34, 118); ctx.lineTo(526, 118); ctx.stroke();
  if (variant === 'wood-01') {
    board(ctx, 110, 64, 330, 40, '#c7d5b9');
    ctx.fillStyle = 'rgba(196,63,82,.55)';
    ctx.fillRect(126, 72, 40 + 180 * p, 24);
    ctx.fillStyle = C.support; ctx.fillRect(205 + 170 * p, 20, 34, 36);
    ctx.strokeStyle = C.orange; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(222 + 170 * p, 20); ctx.lineTo(222 + 170 * p, 104); ctx.stroke();
  } else if (variant === 'wood-02') {
    board(ctx, 110, 72, 300, 14, '#b8c9a7'); board(ctx, 110, 92, 300, 14, '#b8c9a7'); board(ctx, 110, 112, 300, 14, '#c7d5b9');
    ctx.strokeStyle = C.green; ctx.lineWidth = 2;
    for (let x = 130; x < 390; x += 22) { ctx.beginPath(); ctx.moveTo(x, 74); ctx.lineTo(x + 5, 84); ctx.stroke(); }
    ctx.strokeStyle = C.red;
    for (let x = 130; x < 390; x += 26) { ctx.beginPath(); ctx.moveTo(x, 114); ctx.lineTo(x + 8, 124); ctx.stroke(); }
    ctx.strokeStyle = C.blue; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(155 + 270 * p, 77, 22, 0, Math.PI * 2); ctx.stroke();
  } else if (variant === 'wood-03') {
    const x = 72 + 300 * p;
    board(ctx, 70, 106, 420, 18, C.blue, 7);
    key(ctx, 160, 96, C.orange); key(ctx, 400, 96, C.green);
    ctx.strokeStyle = 'rgba(39,68,110,.28)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(272, 48); ctx.lineTo(272, 102); ctx.stroke(); ctx.setLineDash([]);
    const locked = p > .82;
    board(ctx, x, 42, 220, 36, locked ? '#a9d1b6' : C.light, 7);
    ctx.fillStyle = C.orange; ctx.fillRect(x + 18, 57, 24, 16); ctx.fillStyle = C.green; ctx.fillRect(x + 176, 57, 24, 16);
    if (locked) { ctx.strokeStyle = C.green; ctx.lineWidth = 5; ctx.strokeRect(x - 3, 39, 226, 42); }
  } else if (variant === 'wood-04') {
    board(ctx, 150, 82, 260, 24, C.light);
    const y = 20 + 40 * p;
    ctx.fillStyle = C.purple; ctx.fillRect(258, y, 44, 28);
    ctx.fillStyle = C.support; ctx.fillRect(270, y + 28, 20, 36);
    if (p > .55) { ctx.fillStyle = C.purple; ctx.beginPath(); ctx.arc(230, 96, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(330, 96, 6, 0, Math.PI * 2); ctx.fill(); }
  } else if (variant === 'wood-05') {
    board(ctx, 120, 68, 320, 42, '#c7d5b9');
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(190, 88, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(370, 88, 8, 0, Math.PI * 2); ctx.fill();
    const cx = 210 + 120 * p;
    ctx.strokeStyle = C.orange; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx - 20, 42); ctx.lineTo(cx - 20, 112); ctx.moveTo(cx + 20, 42); ctx.lineTo(cx + 20, 112); ctx.moveTo(cx - 20, 112); ctx.lineTo(cx + 20, 112); ctx.stroke();
    ctx.strokeStyle = C.support; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, 36); ctx.lineTo(cx, 18); ctx.stroke();
    ctx.fillStyle = C.blue; ctx.fillRect(150, 122, 40, 8 + 16 * (1 - p)); ctx.fillStyle = C.green; ctx.fillRect(370, 122, 40, 8 + 16 * p);
  } else if (variant === 'wood-06') {
    const merged = p > .62;
    if (merged) {
      board(ctx, 120, 94 + (1 - p) * 12, 320, 14 + 20 * p, C.blue, 6);
    } else {
      board(ctx, 120, 78 + 7 * p, 320, 12, C.blue); board(ctx, 120, 98, 320, 12, C.blue); board(ctx, 120, 118 - 7 * p, 320, 12, C.blue);
    }
    clampShape(ctx, 275, 48 + 24 * p, 1.05);
    if (merged) { ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(114, 92, 332, 40, 8); ctx.stroke(); }
  } else if (variant === 'wood-07') {
    board(ctx, 120, 76, 320, 34, '#c7d5b9');
    ctx.fillStyle = C.orange; ctx.fillRect(145 + 210 * p, 44, 42, 22);
    ctx.strokeStyle = C.support; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(166 + 210 * p, 66); ctx.lineTo(166 + 210 * p, 92); ctx.stroke();
  } else if (variant === 'wood-08') {
    board(ctx, 120, 104, 320, 18, C.blue); key(ctx, 190, 94, C.purple); key(ctx, 370, 94, C.green);
    board(ctx, 155 + 90 * p, 48, 250, 38, '#c7d5b9');
    if (p > .75) { ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.strokeRect(155 + 90 * p, 48, 250, 38); }
  } else if (variant === 'wood-09') {
    for (let i = 0; i < 7; i++) board(ctx, 180, 106 - i * 12, 220, 8, i === 6 ? '#c7d5b9' : C.blue, 2);
    clampShape(ctx, 290, 40 + 78 * p, .85);
  } else {
    const idx = Math.min(2, Math.floor(p * 3));
    board(ctx, 105 + idx * 120, 110, 100, 16, '#c7d5b9', 4);
    ctx.fillStyle = C.support; ctx.fillRect(145 + idx * 120, 38, 30, 38);
  }
}

export const HiDeAnalogy: React.FC<WidgetProps & { variant: string }> = ({ variant }) => {
  const ref = useAnimation((ctx, time) => drawAnalogy(ctx, variant, time), AW, AH);
  return <canvas ref={ref} width={AW} height={AH} />;
};

const LeakBenchmark: React.FC<WidgetProps> = () => {
  const [overlap, setOverlap] = useState(0);
  const oldScore = 52 + 22 * overlap;
  const validGap = 43 - 22 * overlap;
  const ref = useDraw((ctx) => {
    background(ctx, W, H);
    board(ctx, 80, 70, 320, 60, overlap > .65 ? '#d8a6a1' : '#c7d5b9');
    ctx.fillStyle = 'rgba(196,63,82,.55)';
    ctx.fillRect(100, 82, 40 + 240 * overlap, 36);
    clampShape(ctx, 350, 60, .8);
    arrow(ctx, 420, 100, 650, 100, C.blue, 3);
    bar(ctx, 700, 52, 300, 30, oldScore / 80, overlap > .65 ? C.red : C.blue, oldScore.toFixed(1));
    bar(ctx, 700, 116, 300, 30, validGap / 50, validGap < 20 ? C.red : C.green, validGap.toFixed(1));
    label(ctx, overlap.toFixed(0) + '%', 939, 30, C.ink, 'right');
  }, [overlap]);
  const fb = overlap <= .25 ? { cls: 'good', text: '材料陌生，成绩更能反映持续学习能力。' } : overlap <= .65 ? { cls: '', text: '部分内容已见过，比较开始失真。' } : { cls: 'bad', text: '重叠过高，旧基准可能把熟悉度误当成抗遗忘能力。' };
  return <><canvas ref={ref} width={W} height={H} /><div className="ctrl"><label>预训练重合度 <span className="val">{Math.round(overlap * 100)}%</span></label><input type="range" min={0} max={100} value={Math.round(overlap * 100)} onChange={(e) => setOverlap(Number(e.target.value) / 100)} /></div><div className={`feedback ${fb.cls}`}>{fb.text}</div></>;
};

const CkaLayers: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'bottom' | 'middle' | 'top'>('bottom');
  const rows = { bottom: [.82, .78, .74, .70, .76, .80], middle: [.70, .66, .72, .64, .69, .67], top: [.42, .38, .51, .35, .46, .40] };
  const info = mode === 'bottom'
    ? { avg: '0.77', bias: '共享较强', text: '多个任务在底层保持较高相似度，可以共享。', cls: 'good', color: C.green }
    : mode === 'middle'
    ? { avg: '0.68', bias: '共享为主', text: '中层仍有共享结构，但任务差异开始积累。', cls: '', color: C.blue }
    : { avg: '0.42', bias: '任务特异', text: '顶层相似度明显下降，任务特异信息更集中。', cls: 'bad', color: C.red };
  const ref = useDraw((ctx) => {
    background(ctx, W, H);
    ctx.fillStyle = '#e7eee1'; ctx.fillRect(60, 40, 300, 200);
    for (let r = 0; r < 3; r++) {
      const row = r === 0 ? rows.bottom : r === 1 ? rows.middle : rows.top;
      const selected = (mode === 'bottom' && r === 0) || (mode === 'middle' && r === 1) || (mode === 'top' && r === 2);
      if (selected) { ctx.fillStyle = 'rgba(39,68,110,.10)'; ctx.fillRect(50, 48 + r * 62, 320, 54); }
      for (let c = 0; c < 6; c++) {
        const v = row[c];
        ctx.globalAlpha = .25 + v * .75;
        ctx.fillStyle = v > .65 ? C.green : v > .47 ? C.blue : C.red;
        ctx.beginPath(); ctx.roundRect(82 + c * 42, 58 + r * 62, 32, 34, 4); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(500, 42); ctx.lineTo(500, 238); ctx.stroke();
    const active = rows[mode];
    active.forEach((v, i) => { ctx.fillStyle = v > .65 ? C.green : v > .47 ? C.blue : C.red; const h = v * 170; ctx.fillRect(570 + i * 72, 220 - h, 42, h); ctx.fillStyle = C.ink; ctx.font = '600 13px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(v.toFixed(2), 591 + i * 72, 240); });
    ctx.textAlign = 'left';
  }, [mode]);
  return <><canvas ref={ref} width={W} height={H} /><div className="chip-row"><button className={`chip ${mode === 'bottom' ? 'selected' : ''}`} onClick={() => setMode('bottom')}>底层</button><button className={`chip ${mode === 'middle' ? 'selected' : ''}`} onClick={() => setMode('middle')}>中层</button><button className={`chip ${mode === 'top' ? 'selected' : ''}`} onClick={() => setMode('top')}>顶层</button></div><div className="metrics"><Metric label="观察层" value={mode === 'bottom' ? '底层' : mode === 'middle' ? '中层' : '顶层'} /><Metric label="示意均值" value={info.avg} color={info.color} /><Metric label="知识倾向" value={info.bias} color={info.color} /></div><div className={`feedback ${info.cls}`}>{info.text}</div></>;
};

const DecoupleDrag: React.FC<WidgetProps> = () => {
  const [position, setPosition] = useState(0);
  const [dragging, setDragging] = useState(false);
  const target = 1;
  const selection = Math.round(position);
  const imageMatch = selection === target ? 0.86 : 0.48 + selection * 0.03;
  const textMatch = selection === target ? 0.81 : 0.52 - selection * 0.02;
  const ref = useDraw((ctx) => {
    background(ctx, W, H);
    board(ctx, 70, 178, 940, 42, C.blue, 8);
    [150, 430, 710].forEach((x, i) => {
      ctx.strokeStyle = i === target ? C.green : C.line; ctx.lineWidth = i === target ? 4 : 2; ctx.setLineDash([7, 6]);
      ctx.beginPath(); ctx.roundRect(x - 85, 150, 170, 70, 9); ctx.stroke(); ctx.setLineDash([]);
      key(ctx, x - 28, 162, i === target ? C.green : C.orange); key(ctx, x + 28, 162, C.blue);
    });
    const x = 80 + position * 280;
    const correct = selection === target;
    board(ctx, x, 76, 250, 62, correct ? '#a9d1b6' : '#d8a6a1', 8);
    ctx.fillStyle = C.orange; ctx.fillRect(x + 25, 96, 48, 22); ctx.fillStyle = C.green; ctx.fillRect(x + 177, 96, 48, 22);
    ctx.strokeStyle = correct ? C.green : C.red; ctx.lineWidth = correct ? 5 : 3; ctx.strokeRect(x - 2, 74, 254, 66);
    arrow(ctx, x + 125, 144, 150 + target * 280, 150, correct ? C.green : C.red, 3);
  }, [position]);
  const selectFromX = (clientX: number, rect: DOMRect) => { const x = clamp((clientX - rect.left) * W / rect.width, 0, W - 1); setPosition(clamp((x - 205) / 280, 0, 2)); };
  return <><canvas ref={ref} width={W} height={H} tabIndex={0} onPointerDown={(e) => { setDragging(true); selectFromX(e.clientX, e.currentTarget.getBoundingClientRect()); e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={(e) => { if (dragging) selectFromX(e.clientX, e.currentTarget.getBoundingClientRect()); }} onPointerUp={(e) => { setDragging(false); selectFromX(e.clientX, e.currentTarget.getBoundingClientRect()); setPosition(Math.round(clamp((((e.clientX - e.currentTarget.getBoundingClientRect().left) * W / e.currentTarget.getBoundingClientRect().width) - 205) / 280, 0, 2))); }} onKeyDown={(e) => { if (e.key === 'ArrowLeft') setPosition((v) => Math.max(0, Math.round(v) - 1)); if (e.key === 'ArrowRight') setPosition((v) => Math.min(2, Math.round(v) + 1)); }} /><div className="chip-row"><button className={`chip ${selection === 0 ? 'selected' : ''}`} onClick={() => setPosition(0)}>任务 A</button><button className={`chip ${selection === 1 ? 'selected' : ''}`} onClick={() => setPosition(1)}>任务 B</button><button className={`chip ${selection === 2 ? 'selected' : ''}`} onClick={() => setPosition(2)}>任务 C</button></div><div className="metrics"><Metric label="图像匹配" value={imageMatch.toFixed(2)} color={selection === target ? C.green : C.red} /><Metric label="文本匹配" value={textMatch.toFixed(2)} color={selection === target ? C.green : C.red} /><Metric label="组合判断" value={selection === target ? '正确锁扣' : '错位'} color={selection === target ? C.green : C.red} /></div><div className={`feedback ${selection === target ? 'good' : 'bad'}`}>{selection === target ? '下层共享底座 + 顶层正确面板，两部分形成完整解耦。' : '顶板与任务不匹配，下层再共享也会破坏当前适配。'}</div></>;
};

const AnchorSteps: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const stages = [
    { name: '提取图像特征', desc: 'CLIP 图像编码器把输入画面变成视觉特征。', asset: '视觉特征向量' },
    { name: '提取文本特征', desc: 'CLIP 文本编码器把指令变成文本特征。', asset: '文本特征向量' },
    { name: '平均形成锚点', desc: '每个任务的样本特征取均值，形成一对紧凑锚点。', asset: '图像锚点 + 文本锚点' },
    { name: '等待推理匹配', desc: '测试输入将与这些锚点比较，不需要任务编号。', asset: '可检索的任务原型' },
  ];
  const ref = useDraw((ctx) => {
    background(ctx, W, H);
    ctx.fillStyle = C.white; ctx.strokeStyle = C.blue; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(70, 70, 220, 120, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.blue; ctx.fillRect(105, 96, 150, 68);
    ctx.fillStyle = C.white; ctx.fillRect(130, 116, 45, 28); ctx.beginPath(); ctx.moveTo(210, 118); ctx.lineTo(242, 100); ctx.lineTo(242, 160); ctx.lineTo(210, 142); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.white; ctx.strokeStyle = step >= 1 ? C.purple : C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(790, 70, 220, 120, 14); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = step >= 1 ? C.purple : C.line; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(825, 98 + i * 30); ctx.lineTo(970 - i * 12, 98 + i * 30); ctx.stroke(); }
    if (step >= 1) { ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(510, 104, 22, 0, Math.PI * 2); ctx.fill(); arrow(ctx, 300, 130, 484, 112, C.blue, 4); }
    if (step >= 2) { ctx.fillStyle = C.purple; ctx.beginPath(); ctx.arc(560, 172, 22, 0, Math.PI * 2); ctx.fill(); arrow(ctx, 780, 130, 586, 166, C.purple, 4); }
    if (step >= 3) { ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(535, 138, 45, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.white; ctx.beginPath(); ctx.moveTo(512, 138); ctx.lineTo(530, 122); ctx.lineTo(530, 154); ctx.closePath(); ctx.fill(); }
  }, [step]);
  return <><canvas ref={ref} width={W} height={H} /><div className="step-ctrl"><button className="tiny ghost" onClick={() => setStep(0)}>重置</button><button className="tiny ghost" disabled={step === 0} onClick={() => setStep((v) => Math.max(0, v - 1))}>上一步</button><span className="step-label">步骤 <b>{step + 1}</b> / 4</span><button className="tiny" disabled={step === 3} onClick={() => setStep((v) => Math.min(3, v + 1))}>下一步</button></div><div className="step-desc">{stages[step].desc}</div><div className="metrics"><Metric label="当前阶段" value={stages[step].name} /><Metric label="生成内容" value={stages[step].asset} color={C.purple} /><Metric label="匹配依据" value="图像 + 文本" color={C.green} /></div><div className={`feedback ${step >= 3 ? 'good' : ''}`}>{step >= 3 ? '推理时测试输入将与这些锚点匹配。' : '按步骤观察两类特征如何汇入同一任务原型。'}</div></>;
};

const RoutingWeights: React.FC<WidgetProps> = () => {
  const [alpha, setAlpha] = useState(0.5);
  const [beta, setBeta] = useState(0.5);
  const [temperature, setTemperature] = useState(0.1);
  const s1 = alpha * 0.78 + beta * 0.62;
  const s2 = alpha * 0.55 + beta * 0.48;
  const e1 = Math.exp(s1 / temperature); const e2 = Math.exp(s2 / temperature); const d1 = e1 / (e1 + e2); const d2 = e2 / (e1 + e2);
  const ref = useDraw((ctx) => {
    background(ctx, W, H);
    board(ctx, 90, 82, 300, 28, '#c7d5b9'); board(ctx, 90, 150, 300, 28, '#c7d5b9');
    ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(170, 96, 9, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(170, 164, 9, 0, Math.PI * 2); ctx.fill();
    arrow(ctx, 400, 96, 560, 96, C.blue, 4); arrow(ctx, 400, 164, 560, 164, C.purple, 4);
    bar(ctx, 580, 66, 380, 44, d1, C.blue, d1.toFixed(3)); bar(ctx, 580, 154, 380, 44, d2, C.purple, d2.toFixed(3));
  }, [alpha, beta, temperature]);
  const fb = temperature <= .2 ? { cls: 'good', text: '低温让更相似的专家权重更集中。' } : temperature <= .6 ? { cls: '', text: '中等温度保留区分度，也保留一定平滑。' } : { cls: 'bad', text: '温度过高会让权重趋近平均，任务区分变弱。' };
  return <><canvas ref={ref} width={W} height={H} /><div className="ctrl"><label>图像权重 α <span className="val">{alpha.toFixed(2)}</span></label><input type="range" min={0} max={100} value={Math.round(alpha * 100)} onChange={(e) => setAlpha(Number(e.target.value) / 100)} /><label>文本权重 β <span className="val">{beta.toFixed(2)}</span></label><input type="range" min={0} max={100} value={Math.round(beta * 100)} onChange={(e) => setBeta(Number(e.target.value) / 100)} /><label>温度 T <span className="val">{temperature.toFixed(2)}</span></label><input type="range" min={5} max={100} value={Math.round(temperature * 100)} onChange={(e) => setTemperature(Number(e.target.value) / 100)} /></div><div className={`feedback ${fb.cls}`}>{fb.text}</div></>;
};

const FusionModes: React.FC<WidgetProps> = () => {
  const [strategy, setStrategy] = useState<'merge-all' | 'merge-lower' | 'paper'>('paper');
  const data = strategy === 'merge-all'
    ? { title: '全层融合', avg: '65.43', params: '38.27M', text: '所有层都融合后更省参数，但顶层任务专属能力不足。', cls: 'bad', color: C.red, top: 'merged', lower: 'merged' }
    : strategy === 'merge-lower'
    ? { title: '下层融合', avg: '63.28', params: '44.27M', text: '只融合下层时顶层适配不足，论文消融中的 Avg 低于主方法。', cls: '', color: C.orange, top: 'empty', lower: 'merged' }
    : { title: 'HiDe-LoRA', avg: '68.94', params: '44.27M', text: '顶层扩展加下层融合，在论文设定中取得性能与成本的折中。', cls: 'good', color: C.green, top: 'expanded', lower: 'merged' };
  const ref = useDraw((ctx) => {
    background(ctx, W, H);
    ctx.fillStyle = '#e7eee1'; ctx.fillRect(55, 38, 500, 204);
    if (data.lower === 'merged') board(ctx, 95, 154, 330, 34, C.blue, 6);
    if (data.top === 'expanded') { board(ctx, 115, 92, 285, 34, C.green, 6); arrow(ctx, 257, 128, 257, 150, C.green, 3); }
    if (data.top === 'empty') { ctx.strokeStyle = C.orange; ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.roundRect(115, 92, 285, 34, 6); ctx.stroke(); ctx.setLineDash([]); }
    if (data.top === 'merged' && data.lower === 'merged') board(ctx, 95, 114, 330, 74, C.red, 7);
    clampShape(ctx, 260, 70, 1.0);
    arrow(ctx, 575, 140, 680, 140, C.blue, 4);
    ctx.fillStyle = data.color; ctx.beginPath(); ctx.roundRect(700, 72, 300, 46, 7); ctx.fill();
    ctx.fillStyle = C.white; ctx.font = '700 22px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(data.avg, 850, 103);
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.roundRect(700, 148, 300, 46, 7); ctx.fill();
    ctx.fillStyle = C.white; ctx.fillText(data.params, 850, 179); ctx.textAlign = 'left';
  }, [strategy]);
  return <><canvas ref={ref} width={W} height={H} /><div className="chip-row"><button className={`chip ${strategy === 'merge-all' ? 'selected' : ''}`} onClick={() => setStrategy('merge-all')}>全层融合</button><button className={`chip ${strategy === 'merge-lower' ? 'selected' : ''}`} onClick={() => setStrategy('merge-lower')}>下层融合</button><button className={`chip ${strategy === 'paper' ? 'selected' : ''}`} onClick={() => setStrategy('paper')}>HiDe-LoRA</button></div><div className="metrics"><Metric label="策略" value={data.title} color={data.color} /><Metric label="UCIT Avg" value={data.avg} color={data.color} /><Metric label="参数载入" value={data.params} color={C.blue} /></div><div className={`feedback ${data.cls}`}>{data.text}</div></>;
};

const TrainingSteps: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const stages = [
    { name: '前向回答', update: '模型前向', output: '预测答案', desc: '当前图文输入进入模型并生成回答。' },
    { name: '计算损失', update: '自回归损失', output: '误差信号', desc: '自回归损失衡量答案与目标的差距。' },
    { name: '更新适配器', update: 'LoRA + projector', output: '适配参数', desc: '只更新 LoRA 模块与 projector，不重训整个底座。' },
    { name: '保存双锚点', update: 'CLIP 编码器', output: '图像 + 文本锚点', desc: '从 CLIP 编码器提取图像和文本特征，并保存任务锚点。' },
    { name: '进入下一任务', update: '参数与锚点已就绪', output: '可推理资产', desc: '锚点与适配参数都准备好，等待下一任务到来。' },
  ];
  const ref = useDraw((ctx) => {
    background(ctx, W, H);
    ctx.strokeStyle = C.line; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(90, 242); ctx.lineTo(990, 242); ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.fillStyle = i <= step ? C.blue : C.line; ctx.beginPath(); ctx.arc(120 + i * 210, 242, 9, 0, Math.PI * 2); ctx.fill(); }
    board(ctx, 105, 136, 350, 58, '#c7d5b9'); board(ctx, 150, 96, 260, 34, step >= 2 ? C.green : C.light, 5);
    if (step >= 1) { ctx.fillStyle = '#fff'; ctx.strokeStyle = C.blue; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(530, 72, 180, 92, 12); ctx.fill(); ctx.stroke(); ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.moveTo(560, 138); ctx.quadraticCurveTo(600, 84, 640, 122); ctx.quadraticCurveTo(665, 140, 690, 96); ctx.stroke(); }
    if (step >= 2) { ctx.fillStyle = C.orange; ctx.fillRect(255, 142, 115, 45); arrow(ctx, 480, 118, 520, 118, C.orange, 4); }
    if (step >= 3) { ctx.fillStyle = C.purple; ctx.beginPath(); ctx.arc(810, 104, 26, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(870, 104, 17, 0, Math.PI * 2); ctx.fill(); }
    if (step >= 4) { ctx.strokeStyle = C.green; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(840, 104, 62, 0, Math.PI * 2); ctx.stroke(); }
  }, [step]);
  return <><canvas ref={ref} width={W} height={H} /><div className="step-ctrl"><button className="tiny ghost" onClick={() => setStep(0)}>重置</button><button className="tiny ghost" disabled={step === 0} onClick={() => setStep((v) => Math.max(0, v - 1))}>上一步</button><span className="step-label">步骤 <b>{step + 1}</b> / 5</span><button className="tiny" disabled={step === 4} onClick={() => setStep((v) => Math.min(4, v + 1))}>下一步</button></div><div className="step-desc">{stages[step].desc}</div><div className="metrics"><Metric label="当前阶段" value={stages[step].name} /><Metric label="更新对象" value={stages[step].update} color={C.orange} /><Metric label="阶段产出" value={stages[step].output} color={step >= 4 ? C.green : C.blue} /></div><div className={`feedback ${step >= 4 ? 'good' : ''}`}>{step >= 4 ? '训练完成：参数与锚点都已保存。' : '训练只改当前适配器，并逐步生成推理所需资产。'}</div></>;
};

const ArchitectureMap: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'train' | 'infer'>('infer');
  const [selected, setSelected] = useState('vision');
  const nodes: Record<string, { x: number; y: number; color: string; text: string }> = {
    vision: { x: 150, y: 150, color: C.blue, text: '图像编码器' }, text: { x: 150, y: 230, color: C.purple, text: '文本编码器' },
    anchor: { x: 390, y: 190, color: C.purple, text: '锚点库' }, top: { x: 650, y: 100, color: C.green, text: '顶层专家' },
    lower: { x: 650, y: 200, color: C.blue, text: '其余层融合' }, output: { x: 900, y: 150, color: C.ink, text: '输出' },
  };
  const ref = useDraw((ctx) => {
    background(ctx, W, H);
    ctx.fillStyle = '#e7eee1'; ctx.fillRect(270, 40, 280, 210);
    Object.entries(nodes).forEach(([id, n]) => { ctx.fillStyle = selected === id ? n.color : C.white; ctx.strokeStyle = n.color; ctx.lineWidth = selected === id ? 5 : 3; ctx.beginPath(); ctx.roundRect(n.x - 48, n.y - 24, 96, 48, 8); ctx.fill(); ctx.stroke(); if (id === 'vision') { ctx.fillStyle = selected === id ? C.white : C.blue; ctx.fillRect(n.x - 25, n.y - 13, 50, 26); } else if (id === 'text') { ctx.strokeStyle = selected === id ? C.white : C.purple; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(n.x - 25, n.y + i * 9); ctx.lineTo(n.x + 25 - Math.abs(i) * 8, n.y + i * 9); ctx.stroke(); } } else if (id === 'anchor') { ctx.fillStyle = selected === id ? C.white : C.purple; ctx.beginPath(); ctx.arc(n.x - 16, n.y, 8, 0, Math.PI * 2); ctx.arc(n.x + 16, n.y, 8, 0, Math.PI * 2); ctx.fill(); } else if (id === 'top') { ctx.fillStyle = selected === id ? C.white : C.green; ctx.beginPath(); ctx.moveTo(n.x - 24, n.y + 14); ctx.lineTo(n.x, n.y - 18); ctx.lineTo(n.x + 24, n.y + 14); ctx.closePath(); ctx.fill(); } else if (id === 'lower') { ctx.fillStyle = selected === id ? C.white : C.blue; ctx.fillRect(n.x - 28, n.y - 14, 56, 9); ctx.fillRect(n.x - 28, n.y + 4, 56, 9); } else { ctx.fillStyle = selected === id ? C.white : C.ink; ctx.fillRect(n.x - 28, n.y - 10, 56, 20); } });
    const active = mode === 'train' ? ['vision','text','anchor'] : ['vision','text','anchor','top','lower','output'];
    for (let i = 0; i < active.length - 1; i++) { const a = nodes[active[i]], b = nodes[active[i + 1]]; arrow(ctx, a.x + 50, a.y, b.x - 50, b.y, mode === 'train' ? C.orange : C.green, 3); }
    ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(95, 34, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(190, 34, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(285, 34, 7, 0, Math.PI * 2); ctx.fill();
  }, [mode, selected]);
  const details: Record<string, string> = { vision: '图像编码器：提取输入画面的特征。', text: '文本编码器：提取指令文本特征。', anchor: '锚点库：保存每个已学任务的图像和文本均值特征。', top: '顶层专家：按双模态相似度分配各任务 LoRA 的输出权重。', lower: '其余层融合：所有任务共享一个融合后的 LoRA 分支。', output: '输出：顶层专家结果与下层共享结果共同完成前向计算。' };
  const hit = (clientX: number, clientY: number, rect: DOMRect) => { const x = (clientX - rect.left) * W / rect.width, y = (clientY - rect.top) * H / rect.height; let best = 'vision', d = Infinity; Object.entries(nodes).forEach(([id, n]) => { const dd = Math.hypot(x - n.x, y - n.y); if (dd < d) { d = dd; best = id; } }); setSelected(best); };
  return <><canvas ref={ref} width={W} height={H} onPointerDown={(e) => hit(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())} /><div className="chip-row"><button className={`chip ${mode === 'train' ? 'selected' : ''}`} onClick={() => setMode('train')}>训练</button><button className={`chip ${mode === 'infer' ? 'selected' : ''}`} onClick={() => setMode('infer')}>推理</button></div><div className="chip-row">{Object.entries(nodes).map(([id, n]) => <button key={id} className={`chip ${selected === id ? 'selected' : ''}`} onClick={() => setSelected(id)}>{n.text}</button>)}</div><div className="feedback good">{details[selected]}</div></>;
};

const TrainInferSync: React.FC<WidgetProps> = () => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = (time: number) => { const p = clamp((time - startRef.current) / 3000, 0, 1); setProgress(p); if (p < 1) raf = requestAnimationFrame(tick); else setPlaying(false); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  const checkpoint = Math.min(3, Math.floor(progress * 4));
  const stageText = ['准备输入', '提取特征并保存锚点', '匹配顶层专家', '融合下层并输出'][checkpoint];
  const ref = useDraw((ctx) => {
    background(ctx, W, H);
    ctx.fillStyle = C.white; ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(45, 38, 480, 200, 12); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(555, 38, 480, 200, 12); ctx.fill(); ctx.stroke();
    const p = easeOutCubic(progress);
    board(ctx, 105, 166, 350, 42, '#c7d5b9'); board(ctx, 135, 122, 290, 30, p > .25 ? C.orange : C.light, 5);
    if (p > .25) { ctx.fillStyle = C.orange; ctx.fillRect(190, 130, 90, 14); }
    if (p > .52) { ctx.fillStyle = C.purple; ctx.beginPath(); ctx.arc(350, 136, 21, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(390, 136, 15, 0, Math.PI * 2); ctx.fill(); }
    if (p > .78) { ctx.strokeStyle = C.green; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(370, 137, 43, 0, Math.PI * 2); ctx.stroke(); }
    if (p > .18) { ctx.fillStyle = C.blue; ctx.fillRect(610, 152, 90, 45); arrow(ctx, 710, 174, 770, 174, C.blue, 4); }
    if (p > .42) { ctx.fillStyle = C.purple; ctx.beginPath(); ctx.arc(810, 116, 20, 0, Math.PI * 2); ctx.fill(); arrow(ctx, 770, 174, 795, 132, C.purple, 4); }
    if (p > .66) { board(ctx, 730, 86, 150, 34, C.green, 5); board(ctx, 730, 162, 150, 34, C.blue, 5); arrow(ctx, 805, 126, 805, 154, C.green, 4); }
    if (p > .86) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.roundRect(915, 118, 65, 48, 8); ctx.fill(); arrow(ctx, 890, 140, 910, 140, C.green, 4); }
    ctx.fillStyle = C.line; ctx.fillRect(350, 262, 380, 8); ctx.fillStyle = C.green; ctx.fillRect(350, 262, 380 * progress, 8);
  }, [progress]);
  return <><div className="compare-row"><div className="compare-label">训练阶段：生成并保留资产</div><div className="compare-label">推理阶段：匹配、选择并融合</div></div><canvas ref={ref} width={W} height={H} /><div className="step-ctrl"><button className="tiny" onClick={() => { startRef.current = performance.now(); setProgress(0); setPlaying(true); }} disabled={playing}>开始对照</button><button className="tiny ghost" onClick={() => { setPlaying(false); setProgress(0); }}>重置</button></div><div className="step-desc">{stageText}</div><div className="metrics"><Metric label="训练资产" value={progress > .45 ? '参数 + 锚点' : '生成中'} color={C.orange} /><Metric label="推理动作" value={progress > .65 ? '顶层选择' : progress > .25 ? '相似度匹配' : '等待输入'} color={C.purple} /><Metric label="共享分支" value={progress > .85 ? '参与输出' : '待融合'} color={C.blue} /></div><div className={`feedback ${progress >= .95 ? 'good' : ''}`}>{progress >= .95 ? '训练留下适配参数与锚点；推理用它们完成分层执行。' : '从同一时间轴观察：训练生成资产，推理消费资产。'}</div></>;
};

const ExpansionDepth: React.FC<WidgetProps> = () => {
  const [depth, setDepth] = useState(1);
  const [mergeView, setMergeView] = useState(false);
  const shownDepth = mergeView ? 0 : depth;
  const exact = shownDepth === 1 ? { avg: 68.94, params: 44.27, cls: 'good', text: '只扩展顶层：论文主方法的性能与参数折中。' } : shownDepth === 32 ? { avg: 70.91, params: 229.62, cls: 'bad', text: '全层扩展分数更高，但参数约增至 5.2 倍。' } : shownDepth === 0 ? { avg: 65.43, params: 38.27, cls: '', text: '全层融合更省参数，但顶层适配不足。' } : { avg: NaN, params: NaN, cls: '', text: '论文只报告了可验证的端点，中间深度保持未报告。' };
  const ref = useDraw((ctx) => {
    background(ctx, W, H);
    for (let i = 0; i < 32; i++) { const y = 222 - i * 5; ctx.fillStyle = i === 31 ? C.green : shownDepth === 32 ? C.red : C.blue; ctx.fillRect(180, y, 300, 3); }
    const clampY = mergeView ? 224 : 226 - (depth - 1) * 5;
    clampShape(ctx, 330, clampY, .85);
    arrow(ctx, 560, 150, 720, 150, C.blue, 4);
    if (!Number.isNaN(exact.avg)) { bar(ctx, 760, 84, 250, 42, (exact.avg - 55) / 25, exact.cls === 'bad' ? C.red : C.green, exact.avg.toFixed(2)); bar(ctx, 760, 166, 250, 42, exact.params / 240, exact.cls === 'bad' ? C.red : C.green, exact.params.toFixed(2)); }
  }, [depth, mergeView]);
  return <><canvas ref={ref} width={W} height={H} /><div className="chip-row"><button className={`chip ${!mergeView ? 'selected' : ''}`} onClick={() => setMergeView(false)}>按层扩展</button><button className={`chip ${mergeView ? 'selected' : ''}`} onClick={() => { setMergeView(true); setDepth(1); }}>全层融合</button></div><div className="ctrl"><label>扩展层数 <span className="val">{mergeView ? '融合' : shownDepth}</span></label><input type="range" min={1} max={32} value={depth} disabled={mergeView} onChange={(e) => setDepth(Number(e.target.value))} /></div><div className={`feedback ${exact.cls}`}>{exact.text}</div></>;
};

const ResultRace: React.FC<WidgetProps> = () => {
  const [benchmark, setBenchmark] = useState<'ucit' | 'coin'>('ucit');
  const [metric, setMetric] = useState<'avg' | 'last'>('avg');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(0);
  const values = benchmark === 'ucit'
    ? { o: metric === 'avg' ? 64.54 : 58.36, m: metric === 'avg' ? 61.33 : 52.06, h: metric === 'avg' ? 68.94 : 64.19 }
    : { o: metric === 'avg' ? 62.60 : 60.77, m: metric === 'avg' ? 55.24 : 50.58, h: metric === 'avg' ? 64.70 : 63.95 };
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = (time: number) => { const p = clamp((time - startRef.current) / 1800, 0, 1); setProgress(easeOutCubic(p)); if (p < 1) raf = requestAnimationFrame(tick); else setPlaying(false); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  const ref = useDraw((ctx) => {
    background(ctx, W, H);
    const base = 48;
    const scale = (v: number) => base + ((v - 45) / 30) * 180 * progress;
    bar(ctx, 120, 62, 720, 34, scale(values.o) / 240, C.blue, values.o.toFixed(2));
    bar(ctx, 120, 126, 720, 34, scale(values.m) / 240, C.purple, values.m.toFixed(2));
    bar(ctx, 120, 190, 720, 34, scale(values.h) / 240, C.green, values.h.toFixed(2));
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(930, 72, 7, 0, Math.PI * 2); ctx.fill(); label(ctx, 'O-LoRA', 946, 77, C.muted);
    ctx.fillStyle = C.purple; ctx.beginPath(); ctx.arc(930, 136, 7, 0, Math.PI * 2); ctx.fill(); label(ctx, 'MoELoRA', 946, 141, C.muted);
    ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(930, 200, 7, 0, Math.PI * 2); ctx.fill(); label(ctx, 'HiDe', 946, 205, C.muted);
  }, [benchmark, metric, progress]);
  const fb = benchmark === 'ucit' ? 'HiDe-LLaVA 在 UCIT 上 Avg / Last 分别比此前最佳高 4.4 / 5.8 个百分点。' : 'HiDe-LLaVA 在 CoIN 上 Avg / Last 分别高 2.1 / 3.2 个百分点，但该基准存在作者指出的泄漏限制。';
  return <><canvas ref={ref} width={W} height={H} /><div className="chip-row"><button className={`chip ${benchmark === 'ucit' ? 'selected' : ''}`} onClick={() => { setBenchmark('ucit'); setProgress(0); }}>UCIT</button><button className={`chip ${benchmark === 'coin' ? 'selected' : ''}`} onClick={() => { setBenchmark('coin'); setProgress(0); }}>CoIN</button></div><div className="chip-row"><button className={`chip ${metric === 'avg' ? 'selected' : ''}`} onClick={() => { setMetric('avg'); setProgress(0); }}>Avg</button><button className={`chip ${metric === 'last' ? 'selected' : ''}`} onClick={() => { setMetric('last'); setProgress(0); }}>Last</button></div><div className="step-ctrl"><button className="tiny" onClick={() => { startRef.current = performance.now(); setProgress(0); setPlaying(true); }} disabled={playing}>开始比较</button></div><div className={`feedback ${progress >= .95 ? 'good' : ''}`}>{progress >= .95 ? fb : '先选择基准与指标，再从同一基线启动比较。'}</div></>;
};

const HeroOld: React.FC<WidgetProps> = () => {
  const ref = useAnimation((ctx, time) => {
    background(ctx, 560, 140);
    const pulse = 0.5 + 0.5 * Math.sin(time / 260);
    for (let i = 0; i < 7; i++) board(ctx, 120, 104 - i * 12, 260, 8, i === 6 ? C.red : i % 2 ? C.orange : '#b8c9a7', 2);
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? C.red : C.orange; ctx.fillRect(400 + i * 17, 104 - i * 12, 13, 8 + pulse * 6); }
  }, 560, 140);
  return <canvas ref={ref} width={560} height={140} />;
};

const HeroNew: React.FC<WidgetProps> = () => {
  const ref = useAnimation((ctx, time) => {
    background(ctx, 560, 140);
    const pulse = 0.5 + 0.5 * Math.sin(time / 800);
    for (let i = 0; i < 3; i++) board(ctx, 120, 106 - i * 12, 260, 8, C.blue, 2);
    board(ctx, 150, 52 + pulse * 6, 200, 26, C.green, 5);
    key(ctx, 215, 44 + pulse * 6, C.purple); key(ctx, 300, 44 + pulse * 6, C.orange);
  }, 560, 140);
  return <canvas ref={ref} width={560} height={140} />;
};

export const HiDeModule: React.FC<WidgetProps & { variant: string }> = (props) => {
  switch (props.variant) {
    case 'leak': return <LeakBenchmark {...props} />;
    case 'cka': return <CkaLayers {...props} />;
    case 'decouple': return <DecoupleDrag {...props} />;
    case 'anchors': return <AnchorSteps {...props} />;
    case 'routing': return <RoutingWeights {...props} />;
    case 'fusion': return <FusionModes {...props} />;
    case 'training': return <TrainingSteps {...props} />;
    case 'architecture': return <ArchitectureMap {...props} />;
    case 'sync': return <TrainInferSync {...props} />;
    case 'depth': return <ExpansionDepth {...props} />;
    case 'race': return <ResultRace {...props} />;
    case 'hero-old': return <HeroOld {...props} />;
    case 'hero-new': return <HeroNew {...props} />;
    default: return <div className="feedback bad">交互组件未配置。</div>;
  }
};
