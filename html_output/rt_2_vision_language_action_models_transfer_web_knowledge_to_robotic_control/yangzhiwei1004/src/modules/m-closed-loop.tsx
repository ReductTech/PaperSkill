import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
// Presentation mode: life metaphor + one technical timing bar.
// m-closed-loop — chapter 6 active module (P1 slider + P2 start button + P7
// supporting autoplay with hover-pause). Learner sets the inference frequency
// 0.2–5.0 Hz and starts one closed-loop window; the hand corrects a drifting
// trajectory more often as f rises. Orange = too sparse, blue = improving,
// green = tight. Evidence: page 6 §3.3 (1–3 Hz / 5 Hz), page 11 §5.
// The P7 autoplay below is a SUPPORTING animation; the slider is the primary
// active operation, so this chapter is never P7-only.
// ============================================================================

const W = 720;
const H = 300;
const C = {
  bg: '#f5f8f0', counter: '#e7e3d8', counterEdge: '#cfc8b6', envLight: '#b8c9a7',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', axis: '#d7deea',
};

function label(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.muted) {
  ctx.fillStyle = color;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(text, x, y);
}

export const MClosedLoop: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const freq = useRef(1.0);
  const running = useRef(false);
  const runStart = useRef(0);
  const hover = useRef(false);
  const [freqUi, setFreqUi] = useState(1.0);
  const [fb, setFb] = useState({ text: '拖动频率，看 12 秒里能纠正几次。', cls: 'bad' });

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 720;
    const h = 300;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.envLight;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(0, 0, w, 30);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.counter;
    ctx.fillRect(0, 190, w, h - 190);
    ctx.strokeStyle = C.counterEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 190);
    ctx.lineTo(w, 190);
    ctx.stroke();

    // pan + spoon
    ctx.fillStyle = '#5a5f66';
    ctx.beginPath();
    ctx.ellipse(240, 196, 96, 33, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3f444b';
    ctx.lineWidth = 2;
    ctx.stroke();

    const f = freq.current;
    const now = running.current ? (performance.now() - runStart.current) / 1000 : 0;
    const ticks = running.current ? Math.min(12, Math.floor((now % 12) * f)) : 0;

    // taste spoon lifts on each tick
    const liftPhase = running.current ? Math.abs(Math.sin(now * f * Math.PI)) : 0.2;
    ctx.strokeStyle = '#9aa4b4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(300, 150 - liftPhase * 16);
    ctx.lineTo(252, 186 - liftPhase * 12);
    ctx.stroke();
    ctx.fillStyle = '#c7ccd4';
    ctx.beginPath();
    ctx.ellipse(248, 186 - liftPhase * 12, 8, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // hand
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath();
    ctx.ellipse(312, 144 - liftPhase * 16, 15, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a075';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // trajectory line target vs actual
    const targetY = 70;
    ctx.strokeStyle = C.axis;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(400, targetY);
    ctx.lineTo(700, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, 400, targetY - 8, '目标轨迹', C.muted);
    ctx.strokeStyle = f >= 3 ? C.green : f >= 1 ? C.blue : C.orange;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let x = 0; x <= 300; x += 6) {
      const phase = x / 300;
      const wob = Math.sin(phase * Math.PI * (2 + 10 * (1 - clamp(f / 5, 0, 1))));
      const damp = f >= 1 ? 1 - 0.6 * f / 5 : 1;
      const y = targetY + wob * 18 * damp * (running.current ? Math.max(0.15, 1 - now / 12) : 1);
      if (x === 0) ctx.moveTo(400 + x, y);
      else ctx.lineTo(400 + x, y);
    }
    ctx.stroke();

    // tick row
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i < ticks ? C.blue : '#c3c9d3';
      ctx.beginPath();
      ctx.arc(400 + i * 25, 262, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    label(ctx, 400, 244, `纠正次数 ${ticks}`);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    canvas.classList.add('is-ready');
    const loop = () => {
      if (!hover.current) render();
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recompute = (f: number) => {
    setFb(
      f >= 3
        ? { text: '频率够密，轨迹贴着目标走。', cls: 'good' }
        : f >= 1
        ? { text: '有了闭环，偏差开始被压住。', cls: '' }
        : { text: '纠正太稀疏，动作还没跟上来就又偏了。', cls: 'bad' }
    );
  };

  const onFreq = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Number(e.target.value) / 10;
    freq.current = f;
    setFreqUi(f);
    recompute(f);
  };
  const startRun = () => {
    running.current = true;
    runStart.current = performance.now();
    recompute(freq.current);
  };
  const resetRun = () => {
    running.current = false;
    recompute(freq.current);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-m-closed-loop`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="控制频率如何影响闭环纠正"
        onPointerEnter={() => (hover.current = true)}
        onPointerLeave={() => (hover.current = false)}
      />
      <div className="ctrl">
        <label>
          推理频率 <span className="val">{freqUi.toFixed(1)} Hz</span>
        </label>
        <input type="range" min={2} max={50} value={Math.round(freqUi * 10)} onChange={onFreq} aria-label="推理频率 赫兹" />
        <button type="button" className="chip" onClick={running.current ? resetRun : startRun}>
          {running.current ? '停止' : '开始一次闭环'}
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default MClosedLoop;
