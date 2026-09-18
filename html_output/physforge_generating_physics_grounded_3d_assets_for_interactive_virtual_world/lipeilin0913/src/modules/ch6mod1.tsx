import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 Module 6.1 (P2 step-through, technical): 4 steps of joint denoising (geometry + KineVoxel).
const W = 1080;
const H = 280;

const STEPS = [
  { t: 't = 1.00', noise: 1, fb: '噪声毛坯：几何与关节都未成形。', cls: 'bad' },
  { t: 't = 0.75', noise: 0.66, fb: '柜体轮廓显现，关节读数仍然散乱。', cls: '' },
  { t: 't = 0.25', noise: 0.3, fb: '零件边界清晰，铰链位置开始稳定。', cls: '' },
  { t: 't = 0.00', noise: 0, fb: 'Z₀ 到达：几何与 KineVoxel 同时就绪。', cls: 'good' },
];

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  // displayed noise level eases toward the selected step so stepping is a
  // continuous denoise instead of a pop; dt-based, stable at any refresh rate
  const dispRef = useRef({ n: STEPS[0].noise, lastT: -1 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: STEPS[0].fb, cls: STEPS[0].cls });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    // deterministic pseudo-random speckles
    const rnd = (i: number) => {
      const x = Math.sin(i * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };

    const render = (time: number) => {
      const st = STEPS[stateRef.current.step];
      const d = dispRef.current;
      const dt = d.lastT < 0 ? 0 : clamp((time - d.lastT) / 1000, 0, 0.05);
      d.lastT = time;
      d.n += (st.noise - d.n) * (1 - Math.exp(-dt * 5));
      if (Math.abs(st.noise - d.n) < 0.001) d.n = st.noise;
      const n = d.n;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 248, W, 6);
      // cabinet emerges from noise
      const alpha = 1 - n;
      ctx.globalAlpha = Math.max(alpha, 0.15);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(150, 60, 240, 160);
      ctx.fillStyle = '#a0522d';
      ctx.fillRect(164, 72, 212, 60);
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(164, 142, 212, 62);
      ctx.globalAlpha = 1;
      // noise speckles thin out smoothly, with a faint live shimmer
      const count = Math.round(n * 260);
      ctx.fillStyle = '#76906a';
      for (let i = 0; i < count; i++) {
        const jx = Math.sin(time * 0.004 + i * 1.7) * 1.4;
        const jy = Math.cos(time * 0.005 + i * 2.3) * 1.4;
        ctx.fillRect(130 + rnd(i) * 300 + jx, 40 + rnd(i + 999) * 200 + jy, 3, 3);
      }
      // hinge markers grow in once the noise level settles low enough
      const hg = clamp((0.36 - n) / 0.06, 0, 1);
      if (hg > 0) {
        ctx.save();
        ctx.globalAlpha = hg;
        ctx.fillStyle = '#228d5c';
        ctx.beginPath();
        ctx.arc(164, 84, 5 * hg, 0, Math.PI * 2);
        ctx.arc(164, 122, 5 * hg, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // right: O/A/L readout converges, grouped by role so each number's
      // meaning is obvious (same grouping as §4.1)
      const groups = [
        { title: 'O · 原点：铰链中心位置', items: [0.12, 0.5, 0.0], names: ['O.x', 'O.y', 'O.z'] },
        { title: 'A · 轴向：绕哪根线转', items: [0.0, 1.0, 0.0], names: ['A.x', 'A.y', 'A.z'] },
        { title: 'L · 范围：最小 ~ 最大角度', items: [0.0, 90.0], names: ['L.0', 'L.1'] },
      ];
      let itemIdx = 0;
      groups.forEach((g, gi) => {
        const gy = 40 + gi * 58;
        ctx.fillStyle = '#68778f';
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillText(g.title, 560, gy);
        g.items.forEach((target, j) => {
          const idx = itemIdx++;
          const jitter = n * (rnd(idx * 7) - 0.5) * 1.4;
          const v = target + jitter * (idx === 7 ? 40 : 1);
          const bx = 560 + j * 130;
          ctx.fillStyle = '#68778f';
          ctx.font = '13px "Segoe UI", sans-serif';
          ctx.fillText(g.names[j], bx, gy + 20);
          ctx.fillStyle = '#d7deea';
          ctx.fillRect(bx, gy + 26, 95, 9);
          const w = Math.max(Math.min(Math.abs(v) * 95, 95), 2);
          ctx.fillStyle = n < 0.35 ? '#228d5c' : '#27446e';
          ctx.fillRect(bx, gy + 26, w, 9);
          ctx.fillStyle = '#21324a';
          ctx.fillText(v.toFixed(2), bx + 101, gy + 34);
        });
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (d: number) => {
    const ns = Math.min(Math.max(stateRef.current.step + d, 0), 3);
    stateRef.current.step = ns;
    setStep(ns);
    setFeedback({ text: STEPS[ns].fb, cls: STEPS[ns].cls });
  };
  const reset = () => {
    stateRef.current.step = 0;
    setStep(0);
    setFeedback({ text: STEPS[0].fb, cls: STEPS[0].cls });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl chip-row">
        <button className="chip" onClick={() => go(-1)} disabled={step === 0}>
          上一步
        </button>
        <span className="chip" aria-live="polite">
          {STEPS[step].t} · 第 {step + 1}/4 步
        </span>
        <button className="chip" onClick={() => go(1)} disabled={step === 3}>
          下一步
        </button>
        <button className="chip" onClick={reset}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;
