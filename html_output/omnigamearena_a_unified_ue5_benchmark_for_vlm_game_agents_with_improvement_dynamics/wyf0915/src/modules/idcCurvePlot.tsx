import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 320;

// 10-round IDC for one agent on LastStand (synthetic illustrative data matching the paper's pattern).
const ROUNDS = 10;
const CURVES: Record<string, { name: string; color: string; data: number[] }> = {
  claude46: {
    name: 'Claude Opus 4.6',
    color: '#27446e',
    data: [0.15, 0.18, 0.32, 0.50, 0.62, 0.79, 0.65, 0.50, 0.42, 0.39],
  },
  claude47: {
    name: 'Claude Opus 4.7',
    color: '#7c3aed',
    data: [0.31, 0.35, 0.45, 0.58, 0.66, 0.74, 0.62, 0.50, 0.45, 0.42],
  },
  gpt55: {
    name: 'GPT-5.5',
    color: '#228d5c',
    data: [0.42, 0.48, 0.58, 0.65, 0.72, 0.80, 0.78, 0.78, 0.78, 0.78],
  },
  gemini31: {
    name: 'Gemini 3.1 Pro',
    color: '#f07e47',
    data: [0.23, 0.30, 0.45, 0.62, 0.75, 0.93, 0.88, 0.78, 0.70, 0.65],
  },
};

export const IDCCurvePlot: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({
    claude46: true,
    claude47: false,
    gpt55: true,
    gemini31: false,
  });
  const [hover, setHover] = useState<{ key: string; r: number; v: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      ctx.clearRect(0, 0, W, H);
      // axes
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      const left = 60;
      const right = W - 40;
      const top = 40;
      const bottom = H - 60;
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();
      // y ticks
      ctx.fillStyle = '#68778f';
      ctx.font = '14px "Segoe UI", sans-serif';
      for (let i = 0; i <= 4; i++) {
        const y = lerp(bottom, top, i / 4);
        ctx.fillText((1 - i / 4).toFixed(2), 12, y + 4);
        ctx.beginPath();
        ctx.moveTo(left - 4, y);
        ctx.lineTo(left, y);
        ctx.stroke();
      }
      // x ticks (R0..R9)
      for (let r = 0; r < ROUNDS; r++) {
        const x = lerp(left, right, r / (ROUNDS - 1));
        ctx.fillText('R' + r, x - 8, bottom + 18);
      }
      // curves
      (Object.keys(CURVES) as Array<keyof typeof CURVES>).forEach((k) => {
        if (!visible[k]) return;
        const c = CURVES[k];
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        c.data.forEach((v, i) => {
          const x = lerp(left, right, i / (ROUNDS - 1));
          const y = lerp(bottom, top, clamp(v, 0, 1));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.fillStyle = c.color;
        c.data.forEach((v, i) => {
          const x = lerp(left, right, i / (ROUNDS - 1));
          const y = lerp(bottom, top, clamp(v, 0, 1));
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      // hover
      if (hover) {
        const c = CURVES[hover.key as keyof typeof CURVES];
        if (c) {
          const x = lerp(left, right, hover.r / (ROUNDS - 1));
          const y = lerp(bottom, top, clamp(hover.v, 0, 1));
          ctx.fillStyle = '#21324a';
          ctx.font = 'bold 14px "Segoe UI", sans-serif';
          ctx.fillText(`${c.name}  R${hover.r}  ${hover.v.toFixed(2)}`, x + 8, y - 10);
        }
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const rafRef = { current: 0 };
    const tick = () => {
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [visible, hover]);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * W;
          const left = 60;
          const right = W - 40;
          const r = Math.round(((x - left) / (right - left)) * (ROUNDS - 1));
          if (r >= 0 && r < ROUNDS) {
            const v = Object.keys(visible)
              .filter((k) => visible[k as keyof typeof visible])
              .map((k) => CURVES[k as keyof typeof CURVES].data[r]);
            setHover({ key: 'gpt55', r, v: v[0] ?? 0 });
          }
        }}
        onMouseLeave={() => setHover(null)}
      />
      <div className="ctrl">
        {(Object.keys(CURVES) as Array<keyof typeof CURVES>).map((k) => (
          <button
            key={k}
            className={visible[k] ? 'on' : ''}
            style={{ borderColor: CURVES[k].color }}
            onClick={() => setVisible((v) => ({ ...v, [k]: !v[k] }))}
          >
            <span style={{ color: CURVES[k].color }}>●</span> {CURVES[k].name}
          </button>
        ))}
      </div>
      <div className="feedback">
        点击曲线名称切换显隐；将鼠标移到画布上可读取某一轮的分数。中段峰值 ≠ 最终轮次，是 IDC 的核心观察之一。
      </div>
    </div>
  );
};

export default IDCCurvePlot;
