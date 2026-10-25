import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 340;
const LAMBDAS = [4, 8, 16, 32, 75, 150, 300, 450];

// P1 slider: sweep lambda and watch the operating point move on the RD curve.
export const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ idx: 5 });
  const rafRef = useRef<number | null>(null);
  const [idx, setIdx] = useState(5);
  const [feedback, setFeedback] = useState({ text: '拖动 λ，看率失真曲线上工作点如何移动。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { idx: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const ox = 120;
      const oy = 270;
      ctx.strokeStyle = '#b8c9a7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(820, oy);
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox, 60);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('码率 R', 810, oy + 26);
      ctx.fillText('失真 D', ox - 44, 74);

      const pts: [number, number][] = [];
      for (let i = 0; i < LAMBDAS.length; i++) {
        const t = i / (LAMBDAS.length - 1);
        const rx = 720 - t * 420;
        const dy = 250 - t * 180;
        pts.push([rx, dy]);
      }
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])));
      ctx.stroke();

      const [mx, my] = pts[s.idx];
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.arc(mx, my, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.font = '17px "Segoe UI", sans-serif';
      ctx.fillText('λ = ' + LAMBDAS[s.idx] + '×10⁻⁴', mx + 14, my - 6);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  const move = (v: number) => {
    stateRef.current.idx = v;
    setIdx(v);
    if (v <= 2) setFeedback({ text: 'λ 小：质量优先，码率大、失真小。', cls: 'good' });
    else if (v >= LAMBDAS.length - 3) setFeedback({ text: 'λ 大：压缩优先，码率小、失真大。', cls: 'bad' });
    else setFeedback({ text: 'λ 适中：码率与失真取得平衡。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="slider-ctrl">
        <label>
          λ（×10⁻⁴）
          <input type="range" min={0} max={LAMBDAS.length - 1} value={idx} onChange={(e) => move(Number(e.target.value))} />
        </label>
        <span className="slider-value">{LAMBDAS[idx]}×10⁻⁴</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
