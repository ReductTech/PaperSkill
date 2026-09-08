import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.scene; ctx.fillRect(0, 0, w, h);
}
function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(ang - 0.35), y2 - 9 * Math.sin(ang - 0.35));
  ctx.lineTo(x2 - 9 * Math.cos(ang + 0.35), y2 - 9 * Math.sin(ang + 0.35));
  ctx.closePath(); ctx.fill();
}
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke: string, lw: number) {
  ctx.fillStyle = fill; rr(ctx, x, y, w, h, 7); ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
}

const W = 560, H = 240;

const STEPS = [
  {
    key: 'input',
    title: '输入：一整段特征进入块',
    desc: 'C3k2 块的输入是一个 C×H×W 特征图，携带当前层已经提取到的信息。',
    tensor: '输入 x：C×H×W',
  },
  {
    key: 'split',
    title: '按通道拆成两半',
    desc: '先做一次 1×1 卷积，把 C 个通道平均拆成两半 A 和 B，各 C/2。',
    tensor: 'A、B：各 (C/2)×H×W',
  },
  {
    key: 'branch',
    title: '一半精修，一半原样',
    desc: 'A 走 Bottleneck 卷积继续精炼特征（内部结构见下一模块）；B 走恒等路径，原样保留、直接传下去。',
    tensor: 'A → 卷积精修；(C/2)×H×W · B → 恒等；(C/2)×H×W',
  },
  {
    key: 'merge',
    title: '两半并回，拼成输出',
    desc: '把 A、B 沿通道方向拼接，再做一次 1×1 投影回 C 通道。信息一条不丢，计算却省了。',
    tensor: 'Concat → 1×1 → 输出：C×H×W',
  },
] as const;

export const Yolo26M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({
    text: 'C3k2 是 CSP 类块：拆两半、一半精修一半原样、再并回。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = (s: { step: number }) => {
      clearScene(ctx, W, H);
      // block schematic: input -> split -> two branches -> concat -> output
      const active = STEPS[s.step];
      ctx.textAlign = 'center';
      // input
      box(ctx, 14, 92, 76, 56, active.key === 'input' ? 'rgba(39,68,110,0.14)' : '#fff', active.key === 'input' ? C.blue : C.line, active.key === 'input' ? 2.2 : 1.2);
      ctx.fillStyle = C.ink; ctx.font = 'bold 13px "Segoe UI", sans-serif'; ctx.fillText('输入 x', 52, 118);
      ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText('C×H×W', 52, 134);
      ctx.textAlign = 'left';
      arrow(ctx, 90, 120, 118, 120, C.line);
      // 1x1 split
      box(ctx, 118, 100, 70, 40, active.key === 'split' ? 'rgba(39,68,110,0.14)' : '#fff', active.key === 'split' ? C.blue : C.line, active.key === 'split' ? 2.2 : 1.2);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink; ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.fillText('1×1 拆分', 153, 124);
      ctx.textAlign = 'left';
      // two branches
      arrow(ctx, 188, 104, 222, 76, C.line);
      arrow(ctx, 188, 136, 222, 168, C.line);
      // branch A (bottleneck)
      box(ctx, 222, 52, 128, 48, active.key === 'branch' ? 'rgba(39,68,110,0.16)' : '#fff', C.blue, active.key === 'branch' ? 2.2 : 1.4);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink; ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.fillText('A · Bottleneck 卷积', 286, 74);
      ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.fillText('(C/2)×H×W', 286, 92);
      ctx.textAlign = 'left';
      // branch B (identity)
      box(ctx, 222, 144, 128, 40, active.key === 'branch' ? 'rgba(34,141,92,0.12)' : '#fff', C.green, active.key === 'branch' ? 2.2 : 1.4);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink; ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.fillText('B · 恒等', 286, 168);
      ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.fillText('原样保留', 286, 182);
      ctx.textAlign = 'left';
      arrow(ctx, 350, 76, 384, 110, C.line);
      arrow(ctx, 350, 164, 384, 130, C.line);
      // concat + 1x1
      box(ctx, 384, 100, 76, 40, active.key === 'merge' ? 'rgba(39,68,110,0.14)' : '#fff', active.key === 'merge' ? C.blue : C.line, active.key === 'merge' ? 2.2 : 1.2);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink; ctx.font = 'bold 12px "Segoe UI", sans-serif'; ctx.fillText('拼接+1×1', 422, 124);
      ctx.textAlign = 'left';
      arrow(ctx, 460, 120, 488, 120, C.line);
      // output
      box(ctx, 488, 92, 58, 56, active.key === 'merge' ? 'rgba(34,141,92,0.14)' : '#fff', active.key === 'merge' ? C.green : C.line, active.key === 'merge' ? 2.2 : 1.2);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink; ctx.font = 'bold 13px "Segoe UI", sans-serif'; ctx.fillText('输出', 517, 118);
      ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.fillText('C×H×W', 517, 134);
      ctx.textAlign = 'left';
      // detail strip at bottom
      ctx.fillStyle = '#ffffff'; rr(ctx, 14, 196, W - 28, 34, 8); ctx.fill();
      ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = C.muted; ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(active.tensor, 28, 218);
    };
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const go = (i: number) => {
    const s = Math.max(0, Math.min(STEPS.length - 1, i));
    stateRef.current.step = s; setStep(s);
    const st = STEPS[s];
    setFeedback(
      s === STEPS.length - 1
        ? { text: `拼接投影回 C 通道，信息不丢、计算省一半。这就是 CSP（跨阶段部分连接）的核心。`, cls: 'good' }
        : { text: st.desc, cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" disabled={step === 0} onClick={() => go(step - 1)}>上一步</button>
        <div className="step-label">
          第 <b>{step + 1}</b> / {STEPS.length} 步
        </div>
        <button className="tiny" disabled={step === STEPS.length - 1} onClick={() => go(step + 1)}>下一步</button>
      </div>
      <div className="step-desc">{STEPS[step].title}</div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
