import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawPhotoCard, drawLabel, drawLegendDot, drawCheck } from './ana-scene';

const W = 560, H = 250;
type Method = 'gauss' | 'ntm';

/** Bimodal target density over u∈[0,1] (schematic). */
function target(u: number): number {
  const b = (c: number, s: number) => Math.exp(-((u - c) ** 2) / (2 * s * s));
  return 0.9 * b(0.3, 0.09) + 0.7 * b(0.72, 0.07);
}

/** Single wide Gaussian, the best a one-Gaussian step can do. */
function gaussFit(u: number): number {
  return 0.62 * Math.exp(-((u - 0.5) ** 2) / (2 * 0.2 * 0.2));
}

export const M1Method: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ method: Method }>({ method: 'gauss' });
  const rafRef = useRef<number | null>(null);
  const [method, setMethod] = useState<Method>('gauss');
  const [feedback, setFeedback] = useState({
    text: '4 步高斯：这一大步的分布盖不住多峰真值，输出只能发糊。试试切到 NTM。',
    cls: 'bad',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { method: Method }) => {
      ctx.fillStyle = K.bg;
      ctx.fillRect(0, 0, W, H);
      const isNtm = s.method === 'ntm';

      // left: the 4-step result
      drawPhotoCard(ctx, 36, 44, 160, 144, isNtm ? 0.05 : 0.6, 73);
      drawLabel(ctx, isNtm ? 'NTM · 4 步' : '高斯扩散 · 4 步', 42, 30, K.text, 13);
      if (isNtm) drawCheck(ctx, 188, 52);
      drawLabel(ctx, isNtm ? 'GenEval 0.82（4 步，从头训练）' : '模糊的平均值', 40, 204,
        isNtm ? K.green : K.red, 12);

      // right: what one big reverse step must fit
      const gx = 252, gy = 52, gw = 272, gh = 136;
      ctx.strokeStyle = K.border;
      ctx.strokeRect(gx, gy, gw, gh);
      drawLabel(ctx, '这一大步的真实反向分布', gx + 4, gy - 10, K.muted, 11);
      // target density (gray fill)
      ctx.fillStyle = 'rgba(104,119,143,0.25)';
      ctx.beginPath();
      ctx.moveTo(gx, gy + gh);
      for (let i = 0; i <= 100; i++) {
        const u = i / 100;
        ctx.lineTo(gx + u * gw, gy + gh - target(u) * gh * 0.9);
      }
      ctx.lineTo(gx + gw, gy + gh);
      ctx.closePath();
      ctx.fill();
      // the model's step distribution
      ctx.strokeStyle = isNtm ? K.green : K.red;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const u = i / 100;
        const y = isNtm ? target(u) : gaussFit(u);
        const py = gy + gh - y * gh * 0.9;
        if (i === 0) ctx.moveTo(gx + u * gw, py);
        else ctx.lineTo(gx + u * gw, py);
      }
      ctx.stroke();
      drawLegendDot(ctx, gx + 8, gy + gh + 16, '#68778f', '真实分布（多峰混合）');
      drawLegendDot(ctx, gx + 160, gy + gh + 16,
        isNtm ? K.green : K.red, isNtm ? 'NTM：归一化流贴合' : '单高斯：盖不住');
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

  const pick = (m: Method) => {
    stateRef.current.method = m;
    setMethod(m);
    setFeedback(
      m === 'gauss'
        ? { text: '4 步高斯：这一大步的分布盖不住多峰真值，输出只能发糊。试试切到 NTM。', cls: 'bad' }
        : { text: 'NTM 用一条归一化流表达这一大步的真实分布——同样 4 步，从头训练即达 GenEval 0.82。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${method === 'gauss' ? 'selected' : ''}`} onClick={() => pick('gauss')}>
          高斯扩散 · 4 步
        </button>
        <button className={`chip ${method === 'ntm' ? 'selected' : ''}`} onClick={() => pick('ntm')}>
          NTM · 4 步
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
