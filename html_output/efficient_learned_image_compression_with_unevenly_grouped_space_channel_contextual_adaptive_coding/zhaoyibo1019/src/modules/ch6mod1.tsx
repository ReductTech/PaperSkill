import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 340;

type Hot = { id: string; x: number; y: number; w: number; h: number; label: string };

const HOTS: Hot[] = [
  { id: 'sp', x: 60, y: 50, w: 220, h: 80, label: '空间上下文 Φsp' },
  { id: 'ch', x: 360, y: 50, w: 220, h: 80, label: '通道上下文 Φch' },
  { id: 'psi', x: 660, y: 50, w: 220, h: 80, label: '超先验 Ψ' },
];

const INFO: Record<string, string> = {
  sp: '空间上下文：靠已解码邻居符号预测当前符号，捕捉局部纹理。',
  ch: '通道上下文：靠前几个通道组预测当前组，捕捉通道间结构。',
  psi: '超先验：侧信息 ẑ 提供全局先验，稳定 μ 与 σ。',
};

// P5 hotspots: click a branch to see how it contributes to (mu, sigma).
export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: -1 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(-1);
  const [feedback, setFeedback] = useState({ text: '点击任一分支，看它如何参与 (μ, σ) 的预测。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 10 * Math.cos(ang - 0.4), y2 - 10 * Math.sin(ang - 0.4));
      ctx.lineTo(x2 - 10 * Math.cos(ang + 0.4), y2 - 10 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    };

    const render = (s: { sel: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const ax = 360;
      const ay = 210;
      const aw = 280;
      const ah = 70;
      ctx.fillStyle = '#27446e';
      ctx.fillRect(ax, ay, aw, ah);
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px "Segoe UI", sans-serif';
      ctx.fillText('聚合 →  (μ, σ)', ax + 24, ay + 42);

      const targets: [number, number][] = [[370, 220], [500, 220], [630, 220]];
      HOTS.forEach((h, i) => {
        const col = s.sel === i ? '#f07e47' : '#b8c9a7';
        drawArrow(h.x + h.w / 2, h.y + h.h, targets[i][0], targets[i][1], col);
      });

      HOTS.forEach((h, i) => {
        ctx.fillStyle = s.sel === i ? '#eaf3e8' : '#ffffff';
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.strokeStyle = s.sel === i ? '#f07e47' : '#d7deea';
        ctx.lineWidth = s.sel === i ? 3 : 1.5;
        ctx.strokeRect(h.x, h.y, h.w, h.h);
        ctx.fillStyle = '#21324a';
        ctx.font = '18px "Segoe UI", sans-serif';
        ctx.fillText(h.label, h.x + 16, h.y + 46);
      });
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

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    let hit = -1;
    HOTS.forEach((h, i) => {
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) hit = i;
    });
    stateRef.current.sel = hit;
    setSel(hit);
    setFeedback({
      text: hit >= 0 ? INFO[HOTS[hit].id] : '点击任一分支，看它如何参与 (μ, σ) 的预测。',
      cls: hit >= 0 ? 'good' : '',
    });
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      />
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Mod1;
