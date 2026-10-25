// mod-2-1 (P6): drag a nail on/around the board; inside = positive, outside = negative.
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  palette, clearScene, drawBoard, drawNail, drawTapeLine, drawCenterMark,
} from './carpentry-kit';

const W = 1080, H = 280;
const BX = 330, BY = 40, BW = 420, BH = 200;

export const Mod21: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [pos, setPos] = useState({ x: BX + BW * 0.5, y: BY + BH * 0.5 });
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
    drawCenterMark(ctx, BX + BW / 2, BY + BH / 2, 0.5);
    const inside = x >= BX && x <= BX + BW && y >= BY && y <= BY + BH;
    const nearEdge =
      inside &&
      (x - BX < 24 || BX + BW - x < 24 || y - BY < 24 || BY + BH - y < 24);
    if (inside) {
      drawTapeLine(ctx, x, y, BX, y, true);
      drawTapeLine(ctx, x, y, BX + BW, y, true);
      drawTapeLine(ctx, x, y, x, BY, true);
      drawTapeLine(ctx, x, y, x, BY + BH, true);
    }
    drawNail(ctx, x, y, inside ? (nearEdge ? palette.emphasis : palette.nail) : palette.inkMuted, 9);
    // inset: coordinates + verdict
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = palette.techBorder;
    ctx.lineWidth = 2;
    ctx.fillRect(800, 60, 230, 130);
    ctx.strokeRect(800, 60, 230, 130);
    ctx.fillStyle = palette.ink;
    ctx.font = '15px sans-serif';
    ctx.fillText(`(x, y) = ${Math.round(x)}, ${Math.round(y)}`, 815, 95);
    ctx.fillStyle = inside ? palette.nail : palette.inkMuted;
    ctx.fillText(inside ? '正样本 · 类别=猫' : '负样本 · 背景', 815, 125);
    ctx.fillStyle = palette.inkMuted;
    ctx.font = '13px sans-serif';
    ctx.fillText(inside ? '落在目标框内，不用算 IoU' : '落在目标框外', 815, 155);
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
      x: clamp(((e.clientX - rect.left) / rect.width) * W, 0, W),
      y: clamp(((e.clientY - rect.top) / rect.height) * H, 0, H),
    };
  };

  const inside = pos.x >= BX && pos.x <= BX + BW && pos.y >= BY && pos.y <= BY + BH;
  const nearEdge =
    inside &&
    (pos.x - BX < 24 || BX + BW - pos.x < 24 || pos.y - BY < 24 || BY + BH - pos.y < 24);
  const tone = !inside ? 'mid' : nearEdge ? 'mid' : 'good';
  const text = !inside
    ? '负样本：背景。落在目标框外的位置不参与画框。'
    : nearEdge
      ? '正样本，但靠近边缘——这种钉位画出的框不太稳，第 6 章会专门处理它。'
      : '正样本：类别 = 目标框的类别。划分只看点在不在框里，简单到不需要 IoU。';

  return (
    <div>
      <canvas
        ref={ref}
        aria-label="拖动钉位"
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
          const step = 12;
          const p = { ...posRef.current };
          if (e.key === 'ArrowLeft') p.x = clamp(p.x - step, 0, W);
          else if (e.key === 'ArrowRight') p.x = clamp(p.x + step, 0, W);
          else if (e.key === 'ArrowUp') p.y = clamp(p.y - step, 0, H);
          else if (e.key === 'ArrowDown') p.y = clamp(p.y + step, 0, H);
          else return;
          e.preventDefault();
          setPos(p);
        }}
      />
      <div className={`feedback ${tone}`}>{text}</div>
    </div>
  );
};
