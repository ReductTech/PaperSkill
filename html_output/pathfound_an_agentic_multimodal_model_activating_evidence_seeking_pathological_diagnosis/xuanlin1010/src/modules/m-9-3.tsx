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
  bad: '#c43f52',
  pick: '#f07e47',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  face: '#ffffff',
};

const QUERY = { x: 140, y: 100, w: 96, h: 68 };
const CARD_Y = 98;
const CARD_W = 88;
const CARD_H = 68;
const X_MIN = 240;
const X_MAX = 640;

const LEGEND_ITEMS = ['待查片', '参考卡', '同类'];

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
    const color = i === 0 ? COLORS.guide : i === 1 ? COLORS.aux : COLORS.ok;
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
    const yy = y + 12 + k * 12;
    if (yy > y + h - 6) break;
    ctx.beginPath();
    ctx.moveTo(x + 8, yy);
    ctx.lineTo(x + w - 8, yy);
    ctx.stroke();
  }
}

export const M93: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const nearRef = useRef(20);
  const [near, setNear] = useState(20);
  const [feedback, setFeedback] = useState({
    text: '两张卡差得太远，模型会说「不是同一类」。',
    cls: 'bad',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (v: number) => {
      clearScene(ctx);
      drawBoard(ctx, 16, 30, W - 32, 222, 0.35);

      const cardX = X_MIN + ((X_MAX - X_MIN) * clamp(v, 0, 100)) / 100;
      const same = v >= 60;
      const conf = clamp(v / 100, 0, 1);

      drawSceneLabel(ctx, '待查片', QUERY.x, 62, true);
      drawCard(ctx, QUERY.x, QUERY.y, QUERY.w, QUERY.h, 4, COLORS.guide);

      drawSceneLabel(ctx, '参考卡', cardX - 27, 62, true);
      drawCard(ctx, cardX, CARD_Y, CARD_W, CARD_H, 4, same ? COLORS.ok : COLORS.aux);

      ctx.strokeStyle = same ? COLORS.ok : COLORS.bad;
      ctx.lineWidth = 3;
      if (!same) ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(QUERY.x + QUERY.w + 4, QUERY.y + QUERY.h / 2);
      ctx.lineTo(cardX - 4, CARD_Y + CARD_H / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      if (same) {
        ctx.strokeStyle = COLORS.ok;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cardX + 14, CARD_Y + CARD_H / 2);
        ctx.lineTo(cardX + 28, CARD_Y + CARD_H / 2 + 14);
        ctx.lineTo(cardX + 56, CARD_Y + CARD_H / 2 - 18);
        ctx.stroke();
      } else {
        ctx.strokeStyle = COLORS.bad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cardX + 16, CARD_Y + CARD_H / 2 - 14);
        ctx.lineTo(cardX + 46, CARD_Y + CARD_H / 2 + 14);
        ctx.moveTo(cardX + 46, CARD_Y + CARD_H / 2 - 14);
        ctx.lineTo(cardX + 16, CARD_Y + CARD_H / 2 + 14);
        ctx.stroke();
      }

      ctx.strokeStyle = COLORS.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(740, 62);
      ctx.lineTo(740, 250);
      ctx.stroke();

      drawSceneLabel(ctx, '接近程度', 772, 84);
      ctx.fillStyle = COLORS.edge;
      roundRect(ctx, 772, 100, 236, 30, 6);
      ctx.fill();
      ctx.fillStyle = conf >= 0.6 ? COLORS.ok : conf >= 0.4 ? COLORS.guide : COLORS.bad;
      roundRect(ctx, 772, 100, 236 * conf, 30, 6);
      ctx.fill();
      ctx.strokeStyle = COLORS.edge;
      ctx.lineWidth = 2;
      roundRect(ctx, 772, 100, 236, 30, 6);
      ctx.stroke();

      ctx.fillStyle = COLORS.text;
      ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(v.toFixed(2), 772, 158);

      drawSceneLabel(ctx, '判定结果', 772, 196);
      if (same) {
        ctx.strokeStyle = COLORS.ok;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(792, 226, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(785, 226);
        ctx.lineTo(791, 233);
        ctx.lineTo(800, 219);
        ctx.stroke();
      } else {
        ctx.strokeStyle = COLORS.bad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(792, 226, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(786, 220);
        ctx.lineTo(798, 232);
        ctx.moveTo(798, 220);
        ctx.lineTo(786, 232);
        ctx.stroke();
      }
      drawSceneLabel(ctx, same ? '同一类' : '不是同一类', 814, 234);

      drawLegend(ctx, LEGEND_ITEMS, 40, 262);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(nearRef.current);
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

  const onNear = (v0: number) => {
    const v = clamp(Math.round(v0), 0, 100);
    nearRef.current = v;
    setNear(v);
    if (v < 40) setFeedback({ text: '两张卡差得太远，模型会说「不是同一类」。', cls: 'bad' });
    else if (v < 60) setFeedback({ text: '接近了，但还不足以判定为同类。', cls: '' });
    else setFeedback({ text: '形态够接近了，模型判定为同一类，参照才起作用。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          接近程度 <span className="val">{near}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={near}
          onInput={(e) => onNear(Number((e.target as HTMLInputElement).value))}
          onChange={(e) => onNear(Number(e.target.value))}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M93;
