import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene, drawSceneLabel, insetBox, bar } from './birdKit';

// m2-1 (embed-space) — 嵌入空间探秘：拖拽“麻雀”词卡，实时读取与其他词的相似度。

const W = 1080;
const H = 280;
const REF = 420;

interface WordCard {
  name: string;
  en: string;
  x: number;
  y: number;
  base: number;
}
const CARDS: WordCard[] = [
  { name: '鹰', en: 'eagle', x: 260, y: 90, base: 0.85 },
  { name: '鸭', en: 'duck', x: 330, y: 180, base: 0.72 },
  { name: '狗', en: 'dog', x: 480, y: 100, base: 0.31 },
  { name: '汽车', en: 'car', x: 560, y: 200, base: 0.08 },
  { name: '树', en: 'tree', x: 600, y: 70, base: 0.15 },
];
const START = { x: 180, y: 120 };

export const M2_1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ pos: { ...START }, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState({ text: '拖动“麻雀”卡片：和谁靠得近，就和谁更像。', cls: '' });

  const simOf = (card: WordCard, pos: { x: number; y: number }) => {
    const d = Math.hypot(pos.x - card.x, pos.y - card.y);
    const prox = Math.max(0, 1 - d / REF);
    return clamp(0.55 * prox + 0.45 * card.base, 0, 1);
  };

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
      const s = stateRef.current;
      clearScene(ctx, W, H);

      // 淡网格底纹
      ctx.save();
      ctx.strokeStyle = '#e6ebdf';
      ctx.lineWidth = 1;
      for (let gx = 40; gx < 700; gx += 55) {
        ctx.beginPath();
        ctx.moveTo(gx, 24);
        ctx.lineTo(gx, 252);
        ctx.stroke();
      }
      for (let gy = 40; gy < 260; gy += 44) {
        ctx.beginPath();
        ctx.moveTo(24, gy);
        ctx.lineTo(700, gy);
        ctx.stroke();
      }
      ctx.restore();

      // 拖拽卡到各静态卡的虚线（最近者加粗）
      let nearest = 0;
      let nd = Infinity;
      CARDS.forEach((c, i) => {
        const d = Math.hypot(s.pos.x - c.x, s.pos.y - c.y);
        if (d < nd) {
          nd = d;
          nearest = i;
        }
      });
      CARDS.forEach((c, i) => {
        ctx.save();
        ctx.strokeStyle = i === nearest ? PALETTE.blue : PALETTE.muted;
        ctx.lineWidth = i === nearest ? 2.5 : 1.2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(s.pos.x, s.pos.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
        ctx.restore();
      });

      // 静态词卡
      const drawCardBox = (x: number, y: number, name: string, en: string, border: string, bold: boolean) => {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = border;
        ctx.lineWidth = bold ? 3 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x - 40, y - 20, 80, 40, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = PALETTE.ink;
        ctx.font = (bold ? 'bold ' : '') + '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, x, y - 2);
        ctx.fillStyle = PALETTE.muted;
        ctx.font = '10px sans-serif';
        ctx.fillText(en, x, y + 13);
        ctx.textAlign = 'left';
        ctx.restore();
      };
      CARDS.forEach((c) => drawCardBox(c.x, c.y, c.name, c.en, PALETTE.border, false));
      drawCardBox(s.pos.x, s.pos.y, '麻雀', 'sparrow', PALETTE.orange, true);

      // 右侧 inset：五行相似度横条
      insetBox(ctx, 730, 30, 310, 220);
      drawSceneLabel(ctx, '与“麻雀”的相似度', 754, 62, PALETTE.ink);
      CARDS.forEach((c, i) => {
        const sim = simOf(c, s.pos);
        const color = sim > 0.7 ? PALETTE.green : sim >= 0.3 ? PALETTE.blue : PALETTE.red;
        drawSceneLabel(ctx, c.name, 754, 96 + i * 34, PALETTE.muted);
        bar(ctx, 800, 84 + i * 34, 160, 16, sim, color, sim.toFixed(2));
      });
    };

    const tick = () => {
      render();
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

  const toLocal = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const judge = (pos: { x: number; y: number }) => {
    const dEagle = Math.hypot(pos.x - CARDS[0].x, pos.y - CARDS[0].y);
    const dCar = Math.hypot(pos.x - CARDS[3].x, pos.y - CARDS[3].y);
    if (dEagle < 120) setFeedback({ text: '靠近鹰：都是鸟，相似度自然高。', cls: 'good' });
    else if (dCar < 120) setFeedback({ text: '贴近汽车：语义上已经八竿子打不着。', cls: 'bad' });
    else setFeedback({ text: '拖动“麻雀”卡片：和谁靠得近，就和谁更像。', cls: '' });
  };

  const moveTo = (p: { x: number; y: number }) => {
    stateRef.current.pos = { x: clamp(p.x, 60, 660), y: clamp(p.y, 50, 230) };
    judge(stateRef.current.pos);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    const s = stateRef.current;
    if (Math.hypot(p.x - s.pos.x, p.y - s.pos.y) < 55) {
      s.dragging = true;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    moveTo(toLocal(e));
  };
  const onPointerUp = () => {
    stateRef.current.dragging = false;
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const step = 14;
    if (e.key === 'ArrowLeft') moveTo({ x: s.pos.x - step, y: s.pos.y });
    else if (e.key === 'ArrowRight') moveTo({ x: s.pos.x + step, y: s.pos.y });
    else if (e.key === 'ArrowUp') moveTo({ x: s.pos.x, y: s.pos.y - step });
    else if (e.key === 'ArrowDown') moveTo({ x: s.pos.x, y: s.pos.y + step });
    else return;
    e.preventDefault();
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      />
      <div className="ctrl">
        <label>拖拽橙色“麻雀”卡片，或用方向键微调位置</label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M2_1;
