import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawLabel, drawLegendDot, roundRect } from './ana-scene';

const W = 560, H = 280;
const DUR = 2.4;

type Phase = 'idle' | 'running' | 'done';

function bump(u: number, c: number, s: number) {
  return Math.exp(-((u - c) ** 2) / (2 * s * s));
}
/** True reverse conditional in x-space: mixture, multimodal. */
function pX(u: number) {
  return 0.95 * bump(u, 0.28, 0.07) + 0.75 * bump(u, 0.72, 0.06);
}
/** Gaussian predictor in u-space. */
function pU(u: number) {
  return bump(u, 0.5, 0.13);
}
/** Invertible warp: squeezes the two modes toward the center as α→1. */
function warp(u: number, a: number) {
  return lerp(u, 0.5 + Math.tanh((u - 0.5) * 2.8) / 2.8, a);
}

export const M3Transport: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ phase: Phase; t0: number }>({ phase: 'idle', t0: 0 });
  const rafRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState({
    text: '点“做一次换元”：左边是现有高斯轨迹的反向步（单高斯套多峰）；右边把同一条高斯经 f_T 拉回 x 空间。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const plot = (
      x: number, y: number, w: number, h: number,
      dens: (u: number) => number, color: string, fill: boolean
    ) => {
      if (fill) {
        ctx.fillStyle = 'rgba(104,119,143,0.18)';
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        for (let i = 0; i <= 80; i++) {
          const u = i / 80;
          ctx.lineTo(x + u * w, y + h - dens(u) * h * 0.9);
        }
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        const py = y + h - dens(u) * h * 0.9;
        if (i === 0) ctx.moveTo(x + u * w, py);
        else ctx.lineTo(x + u * w, py);
      }
      ctx.stroke();
    };

    const render = () => {
      const s = stateRef.current;
      let p = 0;
      if (s.phase === 'running') {
        p = clamp((performance.now() / 1000 - s.t0) / DUR, 0, 1);
        if (p >= 1) {
          s.phase = 'done';
          setPhase('done');
          setFeedback({
            text: '换元公式：p(x) = p_u(f_T(x)) · |det J_T(x)|。u 空间里仍是高斯，拉回 x 空间就变成能盖住多峰的流。f_T 保维、可逆，不是压缩编码器。',
            cls: 'good',
          });
        }
      } else if (s.phase === 'done') p = 1;
      const a = easeInOutQuad(p);

      ctx.fillStyle = K.bg;
      ctx.fillRect(0, 0, W, H);

      // left: Gaussian reverse as-is
      drawLabel(ctx, '现有高斯轨迹：p(x_s|x_t) ≈ N(μ, σ²)', 28, 22, K.text, 13);
      roundRect(ctx, 20, 36, 250, 178, 5);
      ctx.strokeStyle = K.border;
      ctx.stroke();
      plot(36, 52, 218, 128, pX, '#68778f', true);
      plot(36, 52, 218, 128, (u) => 0.85 * pU(u), K.red, false);
      drawLegendDot(ctx, 36, 198, '#68778f', '真实反向（多峰混合）');
      drawLegendDot(ctx, 36, 214, K.red, '单高斯：盖不住');

      // right: same Gaussian pulled back through f_T
      drawLabel(ctx, 'NTM：高斯经 f_T 拉回 x 空间', 300, 22, K.text, 13);
      roundRect(ctx, 290, 36, 250, 178, 5);
      ctx.strokeStyle = K.border;
      ctx.stroke();
      plot(306, 52, 218, 128, pX, '#68778f', true);
      const pulled = (u: number) => {
        const uu = warp(u, a);
        return 0.85 * pU(uu) * (0.55 + 0.9 * a * (pX(u) / (pU(u) + 0.15)));
      };
      plot(306, 52, 218, 128, pulled, a > 0.7 ? K.green : K.blue, false);
      drawLegendDot(ctx, 306, 198, '#68778f', '同一条真实反向');
      drawLegendDot(ctx, 306, 214, a > 0.7 ? K.green : K.blue,
        a < 0.05 ? '尚未换元' : a < 1 ? 'f_T 正在弯曲坐标' : '拉回后贴合 · |det J| 可算');

      ctx.fillStyle = K.border;
      ctx.fillRect(20, 258, 520, 4);
      ctx.fillStyle = K.blue;
      ctx.fillRect(20, 258, 520 * p, 4);
      drawLabel(ctx, '同一条高斯，只多了一个可逆坐标变换', 20, 272, K.muted, 10);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const run = () => {
    stateRef.current = { phase: 'running', t0: performance.now() / 1000 };
    setPhase('running');
    setFeedback({ text: 'f_T 把坐标轴弯曲：高斯的形状没变，被它度量的集合变了——这就是换元。', cls: '' });
  };
  const reset = () => {
    stateRef.current = { phase: 'idle', t0: 0 };
    setPhase('idle');
    setFeedback({
      text: '点“做一次换元”：左边是现有高斯轨迹的反向步（单高斯套多峰）；右边把同一条高斯经 f_T 拉回 x 空间。',
      cls: '',
    });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={run} disabled={phase === 'running'}>
          {phase === 'done' ? '再看一遍换元' : '做一次换元 f_T'}
        </button>
        <button className="tiny ghost" onClick={reset} disabled={phase === 'idle'}>重置</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
