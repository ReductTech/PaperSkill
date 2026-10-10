import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const COLORS = {
  field: '#f5f8f0',
  board: '#b8c9a7',
  deep: '#76906a',
  edge: '#d7deea',
  guide: '#27446e',
  ok: '#228d5c',
  pick: '#f07e47',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  face: '#ffffff',
};

const ACC = [22, 45, 52, 57, 60, 62, 63, 63.6, 64, 64.4, 64.8];
const F1V = [30, 52, 60, 65, 68, 70, 70.8, 71.2, 71.4, 71.5, 71.5];

const CHART = { x0: 660, x1: 1040, y0: 95, y1: 244 };
const QUERY = { x: 96, y: 112, w: 76, h: 58 };
const CARD_W = 56;
const CARD_H = 40;
const CARD_XS = [220, 282, 344, 406, 468];
const CARD_Y = 88;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.field;
  ctx.fillRect(0, 0, W, H);
}

function drawBoard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = COLORS.edge;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 12);
  ctx.stroke();
}

function drawSceneLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  muted?: boolean
): void {
  ctx.fillStyle = muted ? COLORS.muted : COLORS.text;
  ctx.font = muted
    ? '18px "Segoe UI", "Microsoft YaHei", sans-serif'
    : '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function drawLegend(ctx: CanvasRenderingContext2D, items: string[], x: number, y: number): void {
  const shown = items.slice(0, 3);
  let cx = x;
  shown.forEach((item, i) => {
    const color = i === 0 ? COLORS.guide : i === 1 ? COLORS.ok : COLORS.pick;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + 7, y - 6, 7, 0, Math.PI * 2);
    ctx.fill();
    drawSceneLabel(ctx, item, cx + 22, y, true);
    cx += 22 + item.length * 18 + 24;
  });
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: number,
  color: string
): void {
  ctx.fillStyle = COLORS.face;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 6);
  ctx.stroke();
  ctx.fillStyle = COLORS.edge;
  ctx.beginPath();
  ctx.moveTo(x + w - 12, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLORS.deep;
  ctx.lineWidth = 1;
  for (let k = 0; k < lines; k++) {
    const yy = y + 10 + k * 9;
    if (yy > y + h - 6) break;
    ctx.beginPath();
    ctx.moveTo(x + 7, yy);
    ctx.lineTo(x + w - 8, yy);
    ctx.stroke();
  }
}

export const M91: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const cardsRef = useRef(0);
  const [cards, setCards] = useState(0);
  const [acc, setAcc] = useState(ACC[0]);
  const [f1, setF1] = useState(F1V[0]);
  const [feedback, setFeedback] = useState({ text: '没有参照卡，只能凭描述猜。', cls: 'bad' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const cx = (i: number) => CHART.x0 + (CHART.x1 - CHART.x0) * (i / 10);
    const cy = (v: number) => CHART.y1 - (CHART.y1 - CHART.y0) * (v / 100);

    const render = (n: number) => {
      clearScene(ctx);
      drawBoard(ctx, 16, 30, W - 32, 222, 0.35);

      drawSceneLabel(ctx, '待查片', QUERY.x, 62, true);
      drawCard(ctx, QUERY.x, QUERY.y, QUERY.w, QUERY.h, 4, COLORS.guide);

      drawSceneLabel(ctx, '参考卡', 220, 62, true);
      const shown = Math.min(n, 5);
      for (let i = 0; i < shown; i++) {
        drawCard(ctx, CARD_XS[i], CARD_Y, CARD_W, CARD_H, 3, i < n ? COLORS.aux : COLORS.edge);
      }
      if (n > 5) {
        const bx = CARD_XS[4] + 4;
        const by = CARD_Y + 4;
        ctx.fillStyle = COLORS.deep;
        for (let k = 0; k < Math.min(n - 5, 3); k++) {
          const px = bx + k * 9;
          const py = by + k * 9;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = COLORS.text;
        ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('×' + n, 30, 232);
      }

      ctx.fillStyle = 'rgba(184, 201, 167, 0.28)';
      ctx.fillRect(cx(5), CHART.y0, CHART.x1 - cx(5), CHART.y1 - CHART.y0);

      ctx.strokeStyle = COLORS.edge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CHART.x0, CHART.y0 - 6);
      ctx.lineTo(CHART.x0, CHART.y1);
      ctx.lineTo(CHART.x1 + 6, CHART.y1);
      ctx.stroke();
      for (let i = 0; i <= 5; i++) {
        const gx = cx(i * 2);
        ctx.beginPath();
        ctx.moveTo(gx, CHART.y1);
        ctx.lineTo(gx, CHART.y1 + 5);
        ctx.stroke();
      }
      for (let v = 0; v <= 100; v += 25) {
        const gy = cy(v);
        ctx.beginPath();
        ctx.moveTo(CHART.x0 - 5, gy);
        ctx.lineTo(CHART.x0, gy);
        ctx.stroke();
      }
      drawSceneLabel(ctx, '0', CHART.x0 - 6, CHART.y1 + 22, true);
      drawSceneLabel(ctx, '10', CHART.x1 - 20, CHART.y1 + 22, true);
      drawSceneLabel(ctx, '分数', 620, 44, true);
      drawSceneLabel(ctx, '张数', 972, 268, true);

      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS.guide;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        if (i === 0) ctx.moveTo(cx(i), cy(ACC[i]));
        else ctx.lineTo(cx(i), cy(ACC[i]));
      }
      ctx.stroke();

      ctx.strokeStyle = COLORS.ok;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        if (i === 0) ctx.moveTo(cx(i), cy(F1V[i]));
        else ctx.lineTo(cx(i), cy(F1V[i]));
      }
      ctx.stroke();

      ctx.fillStyle = COLORS.face;
      ctx.beginPath();
      ctx.arc(cx(n), cy(ACC[n]), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.pick;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx(n), cy(ACC[n]), 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = COLORS.face;
      ctx.beginPath();
      ctx.arc(cx(n), cy(F1V[n]), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.pick;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx(n), cy(F1V[n]), 5, 0, Math.PI * 2);
      ctx.stroke();

      drawSceneLabel(ctx, '核分级', 668, 116, true);
      drawSceneLabel(ctx, '侵袭', 668, 146, true);
      ctx.fillStyle = COLORS.text;
      ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(ACC[n].toFixed(2), 764, 116);
      ctx.fillText(F1V[n].toFixed(2), 764, 146);

      drawLegend(ctx, ['核分级', '侵袭', '现状'], 252, 268);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(cardsRef.current);
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

  const onCards = (n: number) => {
    const v = clamp(Math.round(n), 0, 10);
    cardsRef.current = v;
    setCards(v);
    setAcc(ACC[v]);
    setF1(F1V[v]);
    if (v === 0) setFeedback({ text: '没有参照卡，只能凭描述猜。', cls: 'bad' });
    else if (v === 1) setFeedback({ text: '只加一张，两项指标就明显抬起来了。', cls: 'good' });
    else if (v < 5) setFeedback({ text: '继续加还有收益。', cls: '' });
    else
      setFeedback({
        text: '到五张左右就基本饱和了——再多给，画面没更清楚，上下文却更长。',
        cls: 'good',
      });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          参考卡张数 <span className="val">{cards}</span>
        </label>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={cards}
          onInput={(e) => onCards(Number((e.target as HTMLInputElement).value))}
          onChange={(e) => onCards(Number(e.target.value))}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M91;
