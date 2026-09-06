import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawCar, drawLighthouse, sceneLabel } from './scene-kit';

const W = 560;
const H = 270;

const STEP_TEXTS = [
  '起步块：参考锚点给出世界长相，几何约束给出取景位姿。',
  '从第 2 块起，上一块的潜变量作为历史条件，保证运动衔接。',
  '参考条件是按当前块实时检索的 z_refⁱ，不是整段视频。',
  '几何条件 [z_warp, m] 由你的指令驱动——下一章拆它。',
  '五块连乘，就是公式 (1) 的条件分解——长视频 = 可控的短块串联。',
];

// §4 M4.1 — P2 step-through: five blocks, three condition badges aimed at the
// active block; conditional-product pills fill as blocks complete (Eq.1/Eq.2).
export const M4Blocks: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ block: 1 });
  const rafRef = useRef<number | null>(null);
  const [block, setBlock] = useState(1);
  const [feedback, setFeedback] = useState({ text: STEP_TEXTS[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const badge = (
      x: number,
      y: number,
      w: number,
      text: string,
      stroke: string,
      fill: string,
      dim: boolean
    ) => {
      ctx.globalAlpha = dim ? 0.35 : 1;
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const r = 10;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + 26, r);
      ctx.arcTo(x + w, y + 26, x, y + 26, r);
      ctx.arcTo(x, y + 26, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillText(text, x + 10, y + 17);
      ctx.globalAlpha = 1;
    };

    const arrow = (x0: number, y0: number, x1: number, y1: number, color: string, dashed: boolean) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      if (dashed) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 14, x1, y1);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x1, y1, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    const render = (s: { block: number }) => {
      const b = s.block;
      clearScene(ctx, W, H);
      const roadY = 168;
      const x0 = 40;
      const segW = 88;
      for (let i = 0; i < 5; i++) {
        const sx = x0 + i * (segW + 8);
        const isDone = i + 1 < b;
        const isActive = i + 1 === b;
        ctx.fillStyle = isDone ? C.hill : isActive ? 'rgba(39,68,110,0.85)' : '#ffffff';
        ctx.fillRect(sx, roadY - 14, segW, 28);
        ctx.strokeStyle = isActive ? C.blue : isDone ? C.roadEdge : C.border;
        ctx.lineWidth = isActive ? 2.5 : 1.5;
        ctx.strokeRect(sx, roadY - 14, segW, 28);
        ctx.fillStyle = isActive ? '#ffffff' : C.muted;
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.fillText(`z${i + 1}`, sx + segW / 2 - 7, roadY + 4);
      }
      drawLighthouse(ctx, 532, roadY - 18, 0.9);
      const activeX = x0 + (b - 1) * (segW + 8) + segW / 2;
      drawCar(ctx, activeX, roadY - 16, 0.8, C.blue, 0);
      // condition badges
      const histDim = b === 1;
      badge(28, 34, 108, histDim ? '历史 · 暂无' : '历史 z₍<i₎', C.blue, '#ffffff', histDim);
      badge(200, 34, 112, '参考 z_refⁱ', C.green, '#ffffff', false);
      badge(376, 34, 150, '几何 [z_warp, m]', C.orange, '#ffffff', false);
      if (!histDim) arrow(82, 62, activeX - 16, roadY - 20, C.blue, false);
      else arrow(82, 62, activeX - 16, roadY - 20, 'rgba(39,68,110,0.25)', true);
      arrow(256, 62, activeX, roadY - 22, C.green, false);
      arrow(450, 62, activeX + 16, roadY - 20, C.orange, false);
      // conditional-product pills
      sceneLabel(ctx, '条件连乘：', 40, 218, true, 11);
      for (let i = 0; i < 5; i++) {
        const px = 112 + i * 86;
        const filled = i + 1 <= b;
        ctx.fillStyle = filled ? 'rgba(39,68,110,0.12)' : '#ffffff';
        ctx.strokeStyle = filled ? C.blue : C.border;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const r = 9;
        ctx.moveTo(px + r, 202);
        ctx.arcTo(px + 78, 202, px + 78, 224, r);
        ctx.arcTo(px + 78, 224, px, 224, r);
        ctx.arcTo(px, 224, px, 202, r);
        ctx.arcTo(px, 202, px + 78, 202, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = filled ? C.text : C.muted;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(`p(z${i + 1}|·)`, px + 14, 217);
        if (i < 4) {
          ctx.fillStyle = C.muted;
          ctx.fillText('×', px + 80, 217);
        }
      }
      sceneLabel(ctx, `块 ${b} / 5`, 486, 246, false, 12);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(stateRef.current);
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

  const setB = (b: number) => {
    stateRef.current.block = b;
    setBlock(b);
    setFeedback({ text: STEP_TEXTS[b - 1], cls: b === 5 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={() => setB(Math.max(1, block - 1))} disabled={block === 1}>
          上一块
        </button>
        <button className="chip" onClick={() => setB(Math.min(5, block + 1))} disabled={block === 5}>
          {block === 5 ? '已完成' : '下一块'}
        </button>
        <button className="chip" onClick={() => setB(1)}>
          重置
        </button>
        <label>
          进度 <span className="val">{block} / 5</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M4Blocks;
