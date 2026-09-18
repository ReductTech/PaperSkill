import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 320;

// Four agents × (origin + 3 variants) on LastStand, reported as best-skill gain.
const AGENTS = [
  { name: 'Claude Opus 4.6', color: '#27446e', data: [0.641, 0.279, -0.168, 0.011] },
  { name: 'Claude Opus 4.7', color: '#7c3aed', data: [0.620, -0.097, -0.266, -0.044] },
  { name: 'GPT-5.5', color: '#228d5c', data: [0.540, 0.292, 0.422, 0.012] },
  { name: 'Gemini 3.1 Pro', color: '#f07e47', data: [0.701, 0.266, -0.062, 0.017] },
];
const VARIANTS = ['origin', 'VAR1 同机制换种子', 'VAR2 簇状塌方', 'VAR3 跟随玩家的塌方'];

export const TransferBars: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ a: number; v: number; val: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (h: { a: number; v: number; val: number } | null) => {
      ctx.clearRect(0, 0, W, H);
      const left = 220;
      const right = W - 40;
      const top = 40;
      const bottom = H - 50;
      // axis
      ctx.strokeStyle = '#d7deea';
      ctx.beginPath();
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.stroke();
      // zero line
      const midY = (top + bottom) / 2;
      const maxAbs = 0.8;
      const toY = (v: number) => lerp(bottom, top, (v + maxAbs) / (2 * maxAbs));
      ctx.strokeStyle = '#68778f';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(left, midY);
      ctx.lineTo(right, midY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#21324a';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('+0.5', left - 30, toY(0.5) + 4);
      ctx.fillText('0.0', left - 30, midY + 4);
      ctx.fillText('-0.5', left - 30, toY(-0.5) + 4);
      // bars
      const groupH = (bottom - top) / AGENTS.length;
      AGENTS.forEach((a, ai) => {
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.fillText(a.name, 20, top + ai * groupH + groupH / 2 + 4);
        a.data.forEach((v, vi) => {
          const x = lerp(left, right, vi / VARIANTS.length) + 16;
          const cellW = (right - left) / VARIANTS.length - 24;
          const zeroY = midY;
          const barY = v >= 0 ? toY(v) : zeroY;
          const barH = Math.abs(toY(v) - zeroY);
          ctx.fillStyle = v >= 0 ? a.color : '#c43f52';
          ctx.fillRect(x, barY, cellW, barH);
          ctx.fillStyle = '#21324a';
          ctx.font = '12px "Segoe UI", sans-serif';
          ctx.fillText((v >= 0 ? '+' : '') + v.toFixed(2), x + 4, v >= 0 ? barY - 4 : barY + 14);
          if (h && h.a === ai && h.v === vi) {
            ctx.strokeStyle = '#f07e47';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 2, Math.min(barY, zeroY) - 2, cellW + 4, barH + 4);
          }
        });
      });
      // variant labels
      VARIANTS.forEach((v, i) => {
        const x = lerp(left, right, i / VARIANTS.length) + 16 + (right - left) / VARIANTS.length / 2 - 30;
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText(v, x, bottom + 22);
      });
      // title
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('IDC 最佳技能增益 (LastStand: origin + 3 held-out variants)', 60, 24);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const rafRef = { current: 0 };
    const tick = () => {
      render(hover);
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
  }, [hover]);

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
          const left = 220;
          const right = W - 40;
          const top = 40;
          const bottom = H - 50;
          const col = Math.floor(((x - left) / (right - left)) * VARIANTS.length);
          if (col < 0 || col >= VARIANTS.length) {
            setHover(null);
            return;
          }
          const y = ((e.clientY - rect.top) / rect.height) * H;
          const ai = Math.floor(((y - top) / (bottom - top)) * AGENTS.length);
          if (ai < 0 || ai >= AGENTS.length) {
            setHover(null);
            return;
          }
          setHover({ a: ai, v: col, val: AGENTS[ai].data[col] });
        }}
        onMouseLeave={() => setHover(null)}
      />
      <div className="feedback">
        关键观察：Origin 增益大（+0.54~+0.70）并不保证迁移。Opus 4.7 在 origin 上 +0.620，但在 VAR1/VAR2/VAR3
        上全部为负。GPT-5.5 是唯一在所有变体上都非负的模型。技能风格（"原地不动"vs"短促移动再评估"）
        决定了它在新机制下是否还成立。
      </div>
    </div>
  );
};

export default TransferBars;
