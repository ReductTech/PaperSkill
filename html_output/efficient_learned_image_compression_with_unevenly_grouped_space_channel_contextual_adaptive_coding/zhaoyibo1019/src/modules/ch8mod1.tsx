import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 400;

type Hot = { id: string; x: number; y: number; w: number; h: number; label: string };

const HOTS: Hot[] = [
  { id: 'ga', x: 60, y: 40, w: 170, h: 56, label: 'ga 主编码器' },
  { id: 'scctx', x: 430, y: 40, w: 230, h: 56, label: 'SCCTX 熵模型 μ,σ' },
  { id: 'codec', x: 700, y: 40, w: 150, h: 56, label: '算术编解码' },
  { id: 'gs', x: 880, y: 40, w: 170, h: 56, label: 'gs 主解码器' },
  { id: 'hyper', x: 330, y: 250, w: 260, h: 56, label: '超先验 ẑ → Ψ' },
];

const PASSIVE = { x: 260, y: 40, w: 140, h: 56, label: 'y → Q → ŷ' };

const INFO: Record<string, string> = {
  ga: '主编码器 ga：图像 x → 潜变量 y，N=192 通道。',
  scctx: 'SCCTX 熵模型：空间+通道上下文 → (μ,σ)，通道按 16/16/32/64/192 非均匀分组。',
  codec: '算术编解码：用 (μ,σ) 对 ŷ 做熵编解码，得到比特流。',
  gs: '主解码器 gs：由重建的 ŷ 恢复图像 x̂。',
  hyper: '超先验：y → 侧信息 ẑ → 全局先验 Ψ，M=320 通道。',
};

// P5 hotspots: click a module to see its role and channel counts.
export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: -1 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(-1);
  const [feedback, setFeedback] = useState({ text: '点击架构中的模块，看它的职责与通道数。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string, dash?: boolean) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      if (dash) ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      const ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4));
      ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    };

    const render = (s: { sel: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      drawArrow(48, 68, 60, 68, '#b8c9a7');
      drawArrow(230, 68, 260, 68, '#b8c9a7');
      drawArrow(400, 68, 430, 68, '#b8c9a7');
      drawArrow(660, 68, 700, 68, '#b8c9a7');
      drawArrow(850, 68, 880, 68, '#b8c9a7');
      drawArrow(330, 96, 460, 250, '#b8c9a7', true);
      drawArrow(460, 250, 545, 96, '#b8c9a7', true);

      ctx.fillStyle = '#21324a';
      ctx.font = '17px "Segoe UI", sans-serif';
      ctx.fillText('x', 20, 72);
      ctx.fillText('x̂', 1054, 72);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(PASSIVE.x, PASSIVE.y, PASSIVE.w, PASSIVE.h);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(PASSIVE.x, PASSIVE.y, PASSIVE.w, PASSIVE.h);
      ctx.fillStyle = '#68778f';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(PASSIVE.label, PASSIVE.x + 14, PASSIVE.y + 34);

      HOTS.forEach((h, i) => {
        ctx.fillStyle = s.sel === i ? '#eaf3e8' : '#ffffff';
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.strokeStyle = s.sel === i ? '#f07e47' : '#d7deea';
        ctx.lineWidth = s.sel === i ? 3 : 1.5;
        ctx.strokeRect(h.x, h.y, h.w, h.h);
        ctx.fillStyle = '#21324a';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillText(h.label, h.x + 12, h.y + 34);
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
      text: hit >= 0 ? INFO[HOTS[hit].id] : '点击架构中的模块，看它的职责与通道数。',
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

export default Ch8Mod1;
