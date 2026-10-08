import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;
const AW = 560;
const AH = 140;

const C = {
  bg: '#f5f8f0',
  page: '#f8f4e8',
  light: '#b8c9a7',
  dark: '#76906a',
  route: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawAlbumPage(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tone = C.page) {
  ctx.save();
  ctx.shadowColor = 'rgba(33,50,74,.12)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = tone;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = C.light;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 12);
  ctx.stroke();
}

function drawPhotoCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = '#79aeda', alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.fillRect(x + 7, y + 7, Math.max(8, w - 14), Math.max(5, h * .18));
  ctx.restore();
}

function drawStamp(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color = C.orange) {
  ctx.save();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, size, size * .58, 8);
  ctx.fill();
  ctx.fillStyle = '#f4c17d';
  ctx.fillRect(x + size * .18, y + size * .58, size * .64, size * .18);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, size, size * .58, 8);
  ctx.stroke();
  ctx.restore();
}

function drawTab(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, active = false) {
  ctx.save();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = active ? C.ink : C.line;
  ctx.lineWidth = active ? 4 : 2;
  ctx.stroke();
  ctx.restore();
}

function drawCluster(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, count = 18, spread = 20, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const a = i * 2.399;
    const r = (i / count) * spread;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

function drawBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, color: string, baseline = 0) {
  ctx.fillStyle = C.line;
  roundRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x, y, Math.max(2, w * clamp((value - baseline) / (1 - baseline), 0, 1)), h, 7);
  ctx.fill();
}

function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, time: number) => void, width: number, height: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, width, height);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = (time: number) => {
      drawRef.current(ctx, time);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [width, height]);
  return canvasRef;
}

function Feedback({ text, cls = '' }: { text: string; cls?: string }) {
  return <div className={`feedback ${cls}`}>{text}</div>;
}

export const AnalogyScene: React.FC<WidgetProps> = ({ chapterId }) => {
  const ref = useCanvasLoop((ctx, time) => {
    const n = Number((chapterId.match(/chap-(\d+)/) || [])[1] || 0);
    const p = (time % 3200) / 3200;
    ctx.clearRect(0, 0, AW, AH);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, AW, AH);
    drawAlbumPage(ctx, 34, 18, 492, 104);
    if (n === 1) {
      const x = 70 + p * 320;
      drawPhotoCard(ctx, 74, 48, 72, 42, '#79aeda');
      drawPhotoCard(ctx, 414, 48, 72, 42, '#f0a35a', .75);
      drawStamp(ctx, x, 36 + Math.sin(p * Math.PI * 2) * 12, 54);
      ctx.globalAlpha = .18 + p * .45;
      ctx.fillStyle = C.red;
      roundRect(ctx, 88, 32, 384, 76, 14);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (n === 2) {
      const x = 126 + p * 280;
      drawAlbumPage(ctx, 72, 35, 184, 72, '#eef3fa');
      drawAlbumPage(ctx, 304, 35, 184, 72, '#fff5e8');
      drawPhotoCard(ctx, x, 52, 66, 40, '#79aeda');
    } else if (n === 3) {
      const order = Math.min(2, Math.floor(p * 3));
      for (let i = 0; i < 3; i++) drawTab(ctx, 84 + i * 142, 48, 92, 45, i <= order ? C.blue : C.line, i === order);
      drawPhotoCard(ctx, 98 + order * 142, 58, 62, 28, '#79aeda');
    } else if (n === 4) {
      const x = 110 + p * 300;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(118 + i * 160, 70, 26, 0, Math.PI * 2);
        ctx.strokeStyle = i < Math.floor(p * 3 + 1) ? C.green : C.light;
        ctx.lineWidth = 8;
        ctx.stroke();
      }
      ctx.fillStyle = C.orange;
      roundRect(ctx, x, 46, 42, 46, 8);
      ctx.fill();
    } else if (n === 5) {
      drawTab(ctx, 76, 34, 110, 38, C.light);
      drawTab(ctx, 226, 34, 110, 38, C.green, p > .65);
      drawTab(ctx, 376, 34, 110, 38, C.light);
      drawPhotoCard(ctx, 102 + p * 158, 70, 58, 34, '#79aeda');
    } else if (n === 6) {
      ctx.fillStyle = C.blue;
      roundRect(ctx, 86, 58, 116, 46, 10);
      ctx.fill();
      ctx.fillStyle = C.orange;
      roundRect(ctx, 358, 58, 116, 46, 10);
      ctx.fill();
      const x = 150 + p * 260;
      ctx.fillStyle = C.ink;
      roundRect(ctx, x, 42, 44, 76, 12);
      ctx.fill();
      ctx.fillStyle = C.page;
      roundRect(ctx, x + 5, 47, 34, 46, 8);
      ctx.fill();
    } else if (n === 7) {
      drawCluster(ctx, 146, 72, C.blue, 24, 34);
      drawCluster(ctx, 414, 72, C.orange, 24, 34);
      ctx.strokeStyle = p > .75 ? C.green : C.purple;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(280, 35 + (1 - p) * 75);
      ctx.lineTo(280, 35 + (1 - p) * 75 + 45);
      ctx.stroke();
    } else if (n === 8) {
      const w = 116 + p * 284;
      drawAlbumPage(ctx, 280 - w / 2, 35, w, 72, '#f4f7ff');
      for (let i = 1; i < 3; i++) {
        const x = 280 - w / 2 + (w / 3) * i;
        ctx.strokeStyle = i === Math.ceil(p * 3) ? C.green : C.line;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x, 35);
        ctx.lineTo(x, 107);
        ctx.stroke();
      }
    } else if (n === 9) {
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(280, 70, 44, 0, Math.PI * 2);
      ctx.stroke();
      const keep = p < .72 ? 8 : 5;
      for (let i = 0; i < keep; i++) {
        const a = (i / 8) * Math.PI * 2;
        drawPhotoCard(ctx, 274 + Math.cos(a) * 42, 64 + Math.sin(a) * 42, 15, 13, i % 2 ? C.blue : C.green, 1);
      }
      ctx.fillStyle = C.orange;
      roundRect(ctx, 86 + p * 320, 62, 54, 18, 8);
      ctx.fill();
    } else {
      const y1 = 54;
      const y2 = 86;
      ctx.fillStyle = C.light;
      ctx.fillRect(48, 114, 464, 7);
      ctx.fillStyle = C.red;
      roundRect(ctx, 62, y1, 90 + p * 310, 20, 8);
      ctx.fill();
      ctx.fillStyle = C.green;
      roundRect(ctx, 62, y2, 90 + p * 360, 20, 8);
      ctx.fill();
    }
  }, AW, AH);
  return <canvas ref={ref} width={AW} height={AH} />;
};

export const HeroOldScene: React.FC<WidgetProps> = () => {
  const ref = useCanvasLoop((ctx, time) => {
    const p = (time % 3000) / 3000;
    ctx.clearRect(0, 0, 540, 170);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, 540, 170);
    drawAlbumPage(ctx, 28, 28, 484, 116);
    drawPhotoCard(ctx, 70, 60, 94, 54, '#79aeda');
    drawPhotoCard(ctx, 374, 60, 94, 54, '#f0a35a', .8);
    drawStamp(ctx, 88 + p * 300, 22 + Math.sin(p * Math.PI * 2) * 16, 72);
    ctx.globalAlpha = .28;
    ctx.fillStyle = C.red;
    roundRect(ctx, 58, 42, 424, 92, 14);
    ctx.fill();
    ctx.globalAlpha = 1;
  }, 540, 170);
  return <canvas ref={ref} width={540} height={170} />;
};

export const HeroNewScene: React.FC<WidgetProps> = () => {
  const ref = useCanvasLoop((ctx, time) => {
    const p = (time % 3000) / 3000;
    ctx.clearRect(0, 0, 540, 170);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, 540, 170);
    drawAlbumPage(ctx, 26, 26, 488, 118);
    for (let i = 0; i < 3; i++) {
      const active = p > i / 3;
      drawTab(ctx, 72 + i * 142, 46, 104, 72, active ? (i === 2 ? C.green : C.blue) : C.line, active);
    }
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(174, 118);
    ctx.bezierCurveTo(212, 84, 260, 152, 314, 118);
    ctx.bezierCurveTo(354, 92, 394, 92, 420, 118);
    ctx.stroke();
  }, 540, 170);
  return <canvas ref={ref} width={540} height={170} />;
};

export const UniversalStamp: React.FC<WidgetProps> = () => {
  const [strength, setStrength] = useState(62);
  const ref = useCanvasLoop((ctx, time) => {
    const s = strength / 100;
    const p = (time % 2600) / 2600;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    drawAlbumPage(ctx, 90, 50, 360, 190);
    drawAlbumPage(ctx, 620, 50, 360, 190);
    const mix = Math.round(80 - s * 55);
    drawPhotoCard(ctx, 150 + s * mix, 105, 120, 76, '#79aeda', 1 - s * .32);
    drawPhotoCard(ctx, 680 + s * mix, 105, 120, 76, '#f0a35a', 1 - s * .32);
    ctx.globalAlpha = s * .72;
    ctx.fillStyle = C.red;
    roundRect(ctx, 120, 72, 840, 150, 24);
    ctx.fill();
    ctx.globalAlpha = 1;
    drawStamp(ctx, 455 + Math.sin(p * Math.PI * 2) * 22, 20 + p * 190, 82);
    drawBar(ctx, 130, 264, 370, 15, 1 - s * .35, s > .7 ? C.red : s > .3 ? C.blue : C.green);
    drawBar(ctx, 650, 264, 300, 15, .45 + s * .5, s > .7 ? C.red : s > .3 ? C.blue : C.green);
  }, W, H);
  const cka = (0.74 + strength / 100 * .22).toFixed(2);
  const identity = Math.round(59 - strength / 100 * 20);
  const text = strength > 70 ? '颜色和任务身份都被抹平：这是被遮蔽的次优性。' : strength < 30 ? '这里的“统一”不是目标：任务仍需要被区分。' : '印章开始抹平两页差异，继续观察任务身份。';
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>通用印章强度 <span className="val">{strength}</span></label>
        <input type="range" min={0} max={100} value={strength} onChange={(e) => setStrength(Number(e.target.value))} />
        <span className="val">CKA {cka} · TII {identity}%</span>
      </div>
      <Feedback text={text} cls={strength > 70 ? 'bad' : strength < 30 ? 'good' : ''} />
    </div>
  );
};

export const RepresentationMap: React.FC<WidgetProps> = () => {
  const [x, setX] = useState(50);
  const [y, setY] = useState(42);
  const dragging = useRef(false);
  const ref = useCanvasLoop((ctx) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 250);
    ctx.lineTo(980, 250);
    ctx.moveTo(100, 40);
    ctx.lineTo(100, 250);
    ctx.stroke();
    drawAlbumPage(ctx, 130, 62, 360, 160, '#eef3fa');
    drawAlbumPage(ctx, 600, 62, 350, 160, '#fff5e8');
    const sim = x / 100;
    const cx1 = 310 + sim * 225;
    const cx2 = 700 - sim * 225;
    drawCluster(ctx, cx1, 140, C.blue, 32, 56, 1 - sim * .35);
    drawCluster(ctx, cx2, 140, C.green, 32, 56, 1 - sim * .35);
    if (sim > .72) {
      ctx.globalAlpha = .55;
      drawCluster(ctx, 540, 140, C.red, 34, 48);
      ctx.globalAlpha = 1;
    }
    const px = 120 + (x / 100) * 850;
    const py = 55 + (y / 100) * 180;
    drawPhotoCard(ctx, px - 32, py - 22, 64, 44, '#d89b46');
    ctx.strokeStyle = '#21324a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.stroke();
  }, W, H);
  const update = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setX(Math.round(clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100)));
    setY(Math.round(clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100)));
  };
  const cka = (0.49 + x / 100 * .47).toFixed(2);
  const specificity = (1 - y / 100).toFixed(2);
  const text = x > 72 ? '表示高度相似，prompt 很难只写入当前任务的知识。' : x < 35 && y < 50 ? '两种表示明显分开，任务知识更容易被写入。' : '两种表示仍可分开，但还没达到理想的任务区分。';
  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); update(e); }}
        onPointerMove={(e) => { if (dragging.current) update(e); }}
        onPointerUp={(e) => { dragging.current = false; e.currentTarget.releasePointerCapture(e.pointerId); }}
      />
      <div className="ctrl">
        <label>表示距离 <span className="val">CKA {cka} · 特异性 {specificity}</span></label>
      </div>
      <div className="chip-row">
        {[
          [10, 20, '左上'], [90, 20, '右上'], [10, 80, '左下'], [90, 80, '右下'],
        ].map(([bx, by, label]) => <button key={String(label)} className="chip" onClick={() => { setX(Number(bx)); setY(Number(by)); }}>{label}</button>)}
      </div>
      <Feedback text={text} cls={x > 72 ? 'bad' : x < 35 && y < 50 ? 'good' : ''} />
    </div>
  );
};

export const HierarchyStepper: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const ref = useCanvasLoop((ctx) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    const labels = [0, 1, 2];
    labels.forEach((i) => {
      const active = step === i + 1 || step === 3;
      drawTab(ctx, 150 + i * 270, 84, 190, 112, active ? (step === 3 ? C.green : C.blue) : C.line, active);
      ctx.fillStyle = active ? '#fff' : C.muted;
      ctx.font = 'bold 42px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), 245 + i * 270, 153);
    });
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(340, 140);
    ctx.lineTo(420, 140);
    ctx.moveTo(610, 140);
    ctx.lineTo(690, 140);
    ctx.stroke();
  }, W, H);
  const texts = ['先看任务内部的类别区分。', '再判断照片属于哪次旅行。', '最后在整个相册中预测全局类别。', '三层都完成后，才形成完整目标。'];
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="step-ctrl">
        <button className="chip" onClick={() => setStep((v) => Math.max(0, v - 1))} disabled={step === 0}>上一步</button>
        <span className="val">第 {step} / 3 层</span>
        <button className="chip" onClick={() => setStep((v) => Math.min(3, v + 1))} disabled={step === 3}>下一步</button>
        <button className="chip" onClick={() => setStep(0)}>重置</button>
      </div>
      <Feedback text={texts[step]} cls={step === 3 ? 'good' : ''} />
    </div>
  );
};

export const ObjectiveBalance: React.FC<WidgetProps> = () => {
  const [choice, setChoice] = useState(0);
  const options = [
    { label: '只看 WTP', beta: .52, eta: .78, text: '只看任务内预测，全局上界仍受 TAP 限制。', cls: 'bad' },
    { label: 'WTP + TII', beta: .40, eta: .78, text: '两层已经改善，但 TAP 仍是独立目标。', cls: '' },
    { label: '加入 TAP', beta: .34, eta: .48, text: '两层已经改善，但 TAP 仍是独立目标。', cls: '' },
    { label: '三层协同', beta: .20, eta: .22, text: '三层协同收紧上界，装订环全部闭合。', cls: 'good' },
  ];
  const current = options[choice];
  const bound = Math.max(current.beta, current.eta);
  const ref = useCanvasLoop((ctx, time) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    drawBar(ctx, 100, 70, 760, 44, current.beta, current.beta > .45 ? C.red : current.beta > .28 ? C.blue : C.green);
    drawBar(ctx, 100, 174, 760, 44, current.eta, current.eta > .60 ? C.red : current.eta > .35 ? C.blue : C.green);
    const capX = 100 + 760 * bound;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(capX, 40);
    ctx.lineTo(capX, 250);
    ctx.stroke();
    const p = (time % 2200) / 2200;
    ctx.beginPath();
    ctx.arc(capX, 40 + p * 210, 10, 0, Math.PI * 2);
    ctx.fillStyle = C.orange;
    ctx.fill();
  }, W, H);
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="chip-row">
        {options.map((o, i) => <button key={o.label} className={`chip ${choice === i ? 'selected' : ''}`} onClick={() => setChoice(i)}>{o.label}</button>)}
      </div>
      <div className="ctrl"><span className="val">示意误差界 · δ+ε {current.beta.toFixed(2)} · η {current.eta.toFixed(2)} · max {bound.toFixed(2)}</span></div>
      <Feedback text={current.text} cls={current.cls} />
    </div>
  );
};

export const IdentityHotspots: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState(-1);
  const [tiiOn, setTiiOn] = useState(false);
  const correct = [0, 1, 2, 0];
  const weak = [0, 0, 2, 1];
  const pred = selected >= 0 ? (tiiOn ? correct[selected] : weak[selected]) : -1;
  const hit = selected >= 0 && pred === correct[selected];
  const ref = useCanvasLoop((ctx) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) drawTab(ctx, 120 + i * 220, 42, 140, 64, pred === i ? (hit ? C.green : C.red) : C.line, pred === i);
    for (let i = 0; i < 4; i++) {
      const x = 122 + i * 220;
      const y = 168;
      drawPhotoCard(ctx, x, y, 136, 84, i === selected ? '#d89b46' : '#79aeda', i === selected ? 1 : .72);
    }
    if (selected >= 0 && pred >= 0) {
      const sx = 190 + selected * 220;
      const ex = 190 + pred * 220;
      ctx.strokeStyle = hit ? C.green : C.red;
      ctx.lineWidth = 6;
      ctx.setLineDash(hit ? [] : [10, 8]);
      ctx.beginPath();
      ctx.moveTo(sx, 168);
      ctx.bezierCurveTo(sx, 110, ex, 110, ex, 106);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, W, H);
  const selectFromCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * W;
    const cy = ((e.clientY - rect.top) / rect.height) * H;
    if (cy < 150) return;
    const idx = Math.floor((cx - 100) / 220);
    if (idx >= 0 && idx < 4) setSelected(idx);
  };
  const text = selected < 0 ? '点击一张照片，观察无指令表示会把它归到哪个任务。' : hit ? '任务身份命中，接下来才能安全调用对应的 prompt。' : '无指令表示把这张照片归到了错误任务，TII 不能省略。';
  return (
    <div>
      <canvas ref={ref} width={W} height={H} onPointerDown={selectFromCanvas} />
      <div className="chip-row">
        {['照片 A', '照片 B', '照片 C', '照片 D'].map((label, i) => <button key={label} className={`chip ${selected === i ? 'selected' : ''}`} onClick={() => setSelected(i)}>{label}</button>)}
        <button className="chip" disabled={selected < 0} onClick={() => setTiiOn(true)}>启用 TII</button>
      </div>
      <div className="ctrl"><span className="val">诊断任务身份准确率 {tiiOn ? '67.74%' : '39.59%'}</span></div>
      <Feedback text={text} cls={selected < 0 ? '' : hit ? 'good' : 'bad'} />
    </div>
  );
};

export const EnsembleMixer: React.FC<WidgetProps> = () => {
  const [alpha, setAlpha] = useState(10);
  const a = alpha / 100;
  const ref = useCanvasLoop((ctx, time) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    drawAlbumPage(ctx, 300, 45, 480, 200);
    ctx.fillStyle = C.blue;
    roundRect(ctx, 92, 78, 132, 78, 12);
    ctx.fill();
    ctx.fillStyle = C.orange;
    roundRect(ctx, 856, 78, 132, 78, 12);
    ctx.fill();
    const y = 64 + Math.sin((time % 2600) / 2600 * Math.PI * 2) * 24;
    drawStamp(ctx, 226 + a * 520, y + 90, 90, '#d89b46');
    const currentW = 320 * (1 - a);
    const oldW = 320 * a;
    drawBar(ctx, 320, 90, 440, 24, 1, C.line);
    ctx.fillStyle = C.blue;
    roundRect(ctx, 320, 90, currentW, 24, 8);
    ctx.fill();
    ctx.fillStyle = C.orange;
    roundRect(ctx, 320 + currentW, 90, oldW, 24, 8);
    ctx.fill();
    ctx.globalAlpha = .18 + a * .22;
    ctx.fillStyle = C.orange;
    roundRect(ctx, 320, 140, 440, 76, 12);
    ctx.fill();
    ctx.globalAlpha = 1;
  }, W, H);
  const text = a < .05 ? '旧知识传得太少，当前任务仍然困难。' : a <= .25 ? '0.10 附近保留旧知识，同时让当前任务主导。' : a <= .55 ? '开始混合更多旧知识，注意当前任务是否仍占主导。' : '旧 prompt 权重过高，可能压住新任务。';
  const cls = a >= .05 && a <= .25 ? 'good' : a > .55 || a < .05 ? 'bad' : '';
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>旧知识权重 α <span className="val">{a.toFixed(2)}</span></label>
        <input type="range" min={0} max={100} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} />
        <button className="chip" onClick={() => setAlpha(10)}>回到论文默认</button>
      </div>
      <Feedback text={text} cls={cls} />
    </div>
  );
};

export const ContrastiveModes: React.FC<WidgetProps> = () => {
  const [index, setIndex] = useState(0);
  const lambdas = [0, .001, .01, .1];
  const wtp = [75.13, 72.75, 72.53, 71.53];
  const full = [90.15, 91.18, 91.60, 93.35];
  const ref = useCanvasLoop((ctx) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 250);
    ctx.lineTo(980, 250);
    ctx.moveTo(100, 40);
    ctx.lineTo(100, 250);
    ctx.stroke();
    const drawCurve = (vals: number[], color: string, offset: number) => {
      ctx.beginPath();
      vals.forEach((v, i) => {
        const x = 130 + i * 270;
        const y = offset + (95 - v) * 20;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.stroke();
    };
    drawCurve(wtp, C.red, 20);
    drawCurve(full, C.green, 20);
    const x = 130 + index * 270;
    const y1 = 20 + (95 - wtp[index]) * 20;
    const y2 = 20 + (95 - full[index]) * 20;
    ctx.fillStyle = C.orange;
    ctx.beginPath(); ctx.arc(x, y1, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y2, 10, 0, Math.PI * 2); ctx.fill();
  }, W, H);
  const text = index === 0 ? '没有 CR 时，旧类与新类表示更容易互相挤压。' : index < 3 ? 'CR 开始改善兼容性，但还不是完整协同。' : 'CR 让完整模型更稳定，代价是 WTP 单独指标下降。';
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>对比正则强度 λ <span className="val">{lambdas[index]}</span></label>
        <input type="range" min={0} max={3} step={1} value={index} onChange={(e) => setIndex(Number(e.target.value))} />
        <span className="val">WTP {wtp[index].toFixed(2)} · 完整模型 {full[index].toFixed(2)}</span>
      </div>
      <Feedback text={text} cls={index === 3 ? 'good' : index === 0 ? 'bad' : ''} />
    </div>
  );
};

export const HierarchicalArchitecture: React.FC<WidgetProps> = () => {
  const [node, setNode] = useState('uninstructed');
  const nodes: Record<string, { x: number; y: number; color: string }> = {
    photo: { x: 90, y: 150, color: '#79aeda' },
    uninstructed: { x: 260, y: 150, color: C.blue },
    tii: { x: 430, y: 76, color: C.purple },
    prompt: { x: 580, y: 150, color: C.orange },
    instructed: { x: 750, y: 150, color: C.blue },
    tap: { x: 940, y: 150, color: C.green },
    stats: { x: 580, y: 252, color: C.purple },
  };
  const edges = [['photo','uninstructed'],['uninstructed','tii'],['uninstructed','stats'],['tii','prompt'],['prompt','instructed'],['instructed','tap'],['stats','tii'],['stats','tap']] as const;
  const paths: Record<string, string[]> = {
    photo: ['photo','uninstructed'],
    uninstructed: ['photo','uninstructed','tii','stats'],
    tii: ['uninstructed','tii','prompt'],
    prompt: ['tii','prompt','instructed'],
    instructed: ['prompt','instructed','tap','stats'],
    tap: ['instructed','tap'],
    stats: ['stats','tii','tap'],
  };
  const active = new Set(paths[node] || []);
  const ref = useCanvasLoop((ctx, time) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    (edges as readonly (readonly [string,string])[]).forEach(([a, b]) => {
      const na = nodes[a]; const nb = nodes[b];
      ctx.strokeStyle = active.has(a) && active.has(b) ? C.green : C.line;
      ctx.lineWidth = active.has(a) && active.has(b) ? 7 : 3;
      ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
    });
    Object.entries(nodes).forEach(([key, n]) => {
      const selected = key === node;
      ctx.fillStyle = selected ? n.color : C.line;
      roundRect(ctx, n.x - 48, n.y - 26, 96, 52, 12);
      ctx.fill();
      ctx.strokeStyle = selected ? C.ink : C.muted;
      ctx.lineWidth = selected ? 5 : 2;
      ctx.stroke();
    });
    ctx.fillStyle = active.has(node) ? C.green : C.blue;
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TII', 430, 38);
    ctx.fillText('TAP', 940, 38);
    const pulse = 3 + Math.sin(time / 180) * 2;
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(nodes[node].x, nodes[node].y, 58 + pulse, 0, Math.PI * 2); ctx.stroke();
  }, W, H);
  const details: Record<string, string> = {
    photo: '输入照片 x',
    uninstructed: '无指令表示 ĥ = fθ(x)',
    tii: 'TII 辅助层决策 i',
    prompt: '任务专属 prompt 与历史 prompt 集成',
    instructed: '有指令表示 h = fθ(x;p_i)',
    tap: 'TAP 全局输出层',
    stats: '无指令与有指令类统计',
  };
  const feedback: Record<string, string> = {
    photo: '从同一张照片出发，主干表示会进入两条路径。',
    uninstructed: '无指令表示先进入 TII，也保留给统计建模。',
    tii: 'TII 直接预测任务身份，不再依赖任务专属 key。',
    prompt: 'Prompt 集成把冻结的历史 prompt 与当前 prompt 组合。',
    instructed: '有指令表示进入 WTP，同时用于更新 TAP 的统计。',
    tap: 'TAP 在全部已见类别上训练全局输出层。',
    stats: '统计库同时服务任务身份推断和任务自适应预测。',
  };
  const clickNode = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    let best = ''; let d = 80;
    Object.entries(nodes).forEach(([key, n]) => { const nd = Math.hypot(x - n.x, y - n.y); if (nd < d) { d = nd; best = key; } });
    if (best) setNode(best);
  };
  return (
    <div>
      <canvas ref={ref} width={W} height={H} onPointerDown={clickNode} />
      <div className="chip-row">
        {[
          ['photo','输入'],['uninstructed','无指令表示'],['tii','TII'],['prompt','Prompt 集成'],['instructed','有指令表示'],['tap','TAP'],['stats','统计库'],
        ].map(([key,label]) => <button key={key} className={`chip ${node === key ? 'selected' : ''}`} onClick={() => setNode(key)}>{label}</button>)}
      </div>
      <div className="ctrl"><span className="val">{details[node]}</span></div>
      <Feedback text={feedback[node]} cls={node === 'tap' ? 'good' : ''} />
    </div>
  );
};

export const PathSwitcher: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'CIL'|'DIL'|'TIL'>('CIL');
  const ref = useCanvasLoop((ctx) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    const lanes = ['WTP','TII','TAP'];
    lanes.forEach((lane, i) => {
      const disabled = mode === 'TIL' && lane === 'TAP';
      const color = disabled ? C.line : lane === 'WTP' ? C.blue : lane === 'TII' ? C.purple : C.green;
      drawTab(ctx, 140 + i * 280, 76, 220, 142, color, !disabled);
      if (disabled) {
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 7;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(180 + i * 280, 110);
        ctx.lineTo(320 + i * 280, 184);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    if (mode === 'DIL') {
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(920, 146, 44, 0, Math.PI * 2); ctx.stroke();
    }
    if (mode === 'TIL') {
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(420, 146, 74, 0, Math.PI * 2); ctx.stroke();
    }
  }, W, H);
  const bound = mode === 'CIL' ? 'L ∈ [0, max{δ+ε, η}]' : mode === 'DIL' ? 'L ∈ [0, max{δ+ε+log t, η}]' : 'L ≤ δ';
  const text = mode === 'CIL' ? 'CIL 没有测试时任务身份，三层都需要显式建模。' : mode === 'DIL' ? 'DIL 的类别跨任务重复，误差界增加 log t。' : 'TIL 直接给出任务身份，只需保证任务内预测。';
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="chip-row">
        {(['CIL','DIL','TIL'] as const).map((m) => <button key={m} className={`chip ${mode === m ? 'selected' : ''}`} onClick={() => setMode(m)}>{m}</button>)}
      </div>
      <div className="ctrl"><span className="val">{bound}</span>{mode === 'TIL' ? <span className="val">TAP 已退化为 WTP，协同开关不可用</span> : null}</div>
      <Feedback text={text} cls={mode === 'TIL' ? 'good' : ''} />
    </div>
  );
};

export const StatisticsBudget: React.FC<WidgetProps> = () => {
  const [centroids, setCentroids] = useState(1);
  const [split, setSplit] = useState(0);
  const dragging = useRef(false);
  const data = split === 0
    ? { name: 'iBOT-1K / Split CIFAR-100', gaussian: 93.48, multi: 91.78, gffm: 1.00, mffm: 1.45 }
    : { name: 'iBOT-1K / Split ImageNet-R', gaussian: 71.33, multi: 71.33, gffm: 2.79, mffm: 1.73 };
  const ref = useCanvasLoop((ctx, time) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(260, 140, 78, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < centroids; i++) {
      const a = (i / Math.max(1, centroids)) * Math.PI * 2 + time / 1600;
      drawPhotoCard(ctx, 247 + Math.cos(a) * 70, 127 + Math.sin(a) * 70, 26, 26, i % 2 ? C.blue : C.green, 1);
    }
    ctx.fillStyle = C.orange;
    roundRect(ctx, 550 + (centroids - 1) * 42, 118, 38, 45, 8);
    ctx.fill();
    ctx.fillStyle = C.line;
    roundRect(ctx, 520, 174, 430, 10, 5);
    ctx.fill();
    const best = centroids === 1 ? data.gaussian : data.multi;
    drawBar(ctx, 600, 52, 330, 28, best / 100, split === 0 ? C.green : C.blue, 0.5);
  }, W, H);
  const update = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    setCentroids(Math.round(clamp((x - 520) / 430 * 9 + 1, 1, 10)));
  };
  const text = centroids === 1 ? '单个高斯更省空间，但某些分布可能不够细。' : centroids <= 5 ? '约 5 个质心已接近单个高斯，并保留更少的样本。' : '继续增加样本不会自动带来一致收益，需以表格中的对应协议为准。';
  const cls = centroids <= 5 ? 'good' : '';
  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); update(e); }}
        onPointerMove={(e) => { if (dragging.current) update(e); }}
        onPointerUp={(e) => { dragging.current = false; e.currentTarget.releasePointerCapture(e.pointerId); }}
      />
      <div className="chip-row">
        <button className={`chip ${split === 0 ? 'selected' : ''}`} onClick={() => setSplit(0)}>Split CIFAR-100</button>
        <button className={`chip ${split === 1 ? 'selected' : ''}`} onClick={() => setSplit(1)}>Split ImageNet-R</button>
        <button className="chip" onClick={() => setCentroids((v) => Math.max(1, v - 1))}>−</button>
        <span className="val">质心 {centroids}</span>
        <button className="chip" onClick={() => setCentroids((v) => Math.min(10, v + 1))}>＋</button>
        <button className="chip" onClick={() => setCentroids(5)}>设为 5</button>
      </div>
      <table className="paper">
        <thead><tr><th>协议</th><th>单高斯 FAA</th><th>多质心 FAA</th><th>FFM</th></tr></thead>
        <tbody><tr><td>{data.name}</td><td>{data.gaussian}</td><td>{data.multi}</td><td>{centroids === 1 ? data.gffm : data.mffm} ↓</td></tr></tbody>
      </table>
      <Feedback text={text} cls={cls} />
    </div>
  );
};

export const ResultRace: React.FC<WidgetProps> = () => {
  const [protocol, setProtocol] = useState(0);
  const [runId, setRunId] = useState(0);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const records = protocol === 0
    ? [
        { name: 'HiDe-Prompt', faa: 93.48, ffm: 1.00, color: C.green },
        { name: 'CODA-Prompt', faa: 79.11, ffm: 7.69, color: C.blue },
        { name: 'S-Prompt++', faa: 77.53, ffm: 8.07, color: C.orange },
      ]
    : [
        { name: 'HiDe-Prompt', faa: 71.33, ffm: 2.79, color: C.green },
        { name: 'CODA-Prompt', faa: 66.56, ffm: 7.22, color: C.blue },
        { name: 'S-Prompt++', faa: 60.82, ffm: 4.16, color: C.orange },
      ];
  useEffect(() => {
    if (!started) return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 1) { window.clearInterval(id); return 1; }
        return Math.min(1, p + .035);
      });
    }, 55);
    return () => window.clearInterval(id);
  }, [started, runId]);
  const baseline = protocol === 0 ? 55 : 50;
  const maxVal = protocol === 0 ? 100 : 80;
  const ref = useCanvasLoop((ctx, time) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.light;
    ctx.fillRect(120, 230, 820, 12);
    records.forEach((r, i) => {
      const full = (r.faa - baseline) / (maxVal - baseline);
      const shown = full * progress;
      drawBar(ctx, 150, 48 + i * 62, 760, 34, shown, r.color, 0);
      ctx.fillStyle = r.color;
      ctx.beginPath(); ctx.arc(132, 65 + i * 62, 7, 0, Math.PI * 2); ctx.fill();
    });
    const pulse = 3 + Math.sin(time / 200) * 3;
    ctx.strokeStyle = started && progress >= 1 ? C.green : C.orange;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(960, 174, 26 + pulse, 0, Math.PI * 2); ctx.stroke();
  }, W, H);
  const text = !started ? '先选择匹配的预训练模型与基准，再开始比较。' : progress < 1 ? '结果来自同一协议，动画只表达已报告数值。' : 'HiDe-Prompt 的最终平均准确率更高，最终遗忘指标更低；这不等于所有任务或所有预训练模型的普适结论。';
  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${protocol === 0 ? 'selected' : ''}`} onClick={() => { setProtocol(0); setStarted(false); setProgress(0); }}>iBOT-1K / CIFAR-100</button>
        <button className={`chip ${protocol === 1 ? 'selected' : ''}`} onClick={() => { setProtocol(1); setStarted(false); setProgress(0); }}>iBOT-1K / ImageNet-R</button>
        <button className="chip" onClick={() => { setRunId((v) => v + 1); setProgress(0); setStarted(true); }}>{started ? '重新比较' : '开始比较'}</button>
      </div>
      <table className="paper">
        <thead><tr><th>方法</th><th>FAA ↑</th><th>FFM ↓</th></tr></thead>
        <tbody>{records.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.faa}</td><td>{r.ffm}</td></tr>)}</tbody>
      </table>
      <Feedback text={text} cls={started && progress >= 1 ? 'good' : ''} />
    </div>
  );
};
