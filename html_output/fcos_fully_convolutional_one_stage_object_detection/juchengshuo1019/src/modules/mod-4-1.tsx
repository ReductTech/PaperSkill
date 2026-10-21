// mod-4-1 (P6): drag the nail; four distance readouts update live per Eq(1).
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  palette, clearScene, drawBoard, drawNail, drawTapeLine, drawCenterMark,
} from './carpentry-kit';

const W = 1080, H = 280;
const BX = 80, BY = 40, BW = 560, BH = 200;

export const Mod41: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [pos, setPos] = useState({ x: BX + BW * 0.45, y: BY + BH * 0.5 });
  const [drag, setDrag] = useState(false);
  const posRef = useRef(pos);
  posRef.current = pos;

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = posRef.current;
    clearScene(ctx, W, H);
    drawBoard(ctx, BX, BY, BW, BH);
    drawCenterMark(ctx, BX + BW / 2, BY + BH / 2, 0.4);
    const l = Math.max(0, x - BX);
    const t = Math.max(0, y - BY);
    const r = Math.max(0, BX + BW - x);
    const b = Math.max(0, BY + BH - y);
    drawTapeLine(ctx, x, y, BX, y);
    drawTapeLine(ctx, x, y, x, BY);
    drawTapeLine(ctx, x, y, BX + BW, y);
    drawTapeLine(ctx, x, y, x, BY + BH);
    const nearEdge = Math.min(l, t, r, b) < 30;
    drawNail(ctx, x, y, nearEdge ? palette.emphasis : palette.nail, 9);
    // readout panel
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = palette.techBorder;
    ctx.lineWidth = 2;
    ctx.fillRect(700, 30, 330, 220);
    ctx.strokeRect(700, 30, 330, 220);
    const rows: Array<[string, number, string]> = [
      ['l* = x − x₀', l, '#27446e'],
      ['t* = y − y₀', t, '#27446e'],
      ['r* = x₁ − x', r, '#27446e'],
      ['b* = y₁ − y', b, '#27446e'],
    ];
    ctx.font = '16px sans-serif';
    rows.forEach(([label, v, color], i) => {
      const ry = 70 + i * 48;
      ctx.fillStyle = color;
      ctx.fillText(label, 720, ry);
      ctx.fillStyle = palette.ink;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(String(Math.round(v)), 880, ry);
      ctx.font = '16px sans-serif';
      // mini bar
      ctx.fillStyle = palette.techBorder;
      ctx.fillRect(720, ry + 8, 290, 8);
      ctx.fillStyle = palette.nail;
      ctx.fillRect(720, ry + 8, Math.min(290, (v / 300) * 290), 8);
    });
    if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    setupCanvas(canvas, W, H);
    draw();
    const disconnect = observeCanvas(canvas, draw, () => {});
    return () => disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [pos, draw]);

  const toLocal = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * W, BX, BX + BW),
      y: clamp(((e.clientY - rect.top) / rect.height) * H, BY, BY + BH),
    };
  };

  const l = pos.x - BX, t = pos.y - BY, r = BX + BW - pos.x, b = BY + BH - pos.y;
  const nearEdge = Math.min(l, t, r, b) < 30;
  const tone = nearEdge ? 'mid' : 'good';
  const text = nearEdge
    ? `钉位靠近边缘：最小读数只有 ${Math.round(Math.min(l, t, r, b))}——四个数仍是正数，但这个钉位不太稳。`
    : `四个读数 ${Math.round(l)} / ${Math.round(t)} / ${Math.round(r)} / ${Math.round(b)}：全是正数——这就是 Eq(1) 量出来的样子。`;

  return (
    <div>
      <canvas
        ref={ref}
        aria-label="拖动钉位看四个距离读数"
        style={{ cursor: drag ? 'grabbing' : 'grab', touchAction: 'none' }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setDrag(true);
          setPos(toLocal(e));
        }}
        onPointerMove={(e) => {
          if (drag) setPos(toLocal(e));
        }}
        onPointerUp={() => setDrag(false)}
        onPointerCancel={() => setDrag(false)}
        tabIndex={0}
        onKeyDown={(e) => {
          const step = 14;
          const p = { ...posRef.current };
          if (e.key === 'ArrowLeft') p.x = clamp(p.x - step, BX, BX + BW);
          else if (e.key === 'ArrowRight') p.x = clamp(p.x + step, BX, BX + BW);
          else if (e.key === 'ArrowUp') p.y = clamp(p.y - step, BY, BY + BH);
          else if (e.key === 'ArrowDown') p.y = clamp(p.y + step, BY, BY + BH);
          else return;
          e.preventDefault();
          setPos(p);
        }}
      />
      <div className={`feedback ${tone}`}>{text}</div>
    </div>
  );
};
