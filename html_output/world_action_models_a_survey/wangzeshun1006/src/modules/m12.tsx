import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawSurveyor,
  drawTripod,
  drawSheetLabel,
  ROUTE,
  OK,
  EMPH,
  INK,
  MUTED,
  LINE,
  CONTOUR,
} from './chartkit';
import type { WidgetProps } from './registry';

// m12 — 未来进入行动路径的三种形式（P2，上一步 / 下一步）。
// 三种形式都属于 WAM，只是"未来"在动作之前、之后或与之同时进入系统。

const W = 1080;
const H = 280;

const BOX_Y = 150;
const BOX_H = 100;
const BOX_W = 290;
const BOX_X = [70, 395, 720];

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const POSES: Array<'sight' | 'draw' | 'walk'> = ['sight', 'draw', 'walk'];
const STAGE: string[] = ['先预测再行动', '先提动作再评分', '联合预测'];
const FEEDBACK: string[] = [
  '先画未来，再从未来里解出动作（如 UniPi 的级联）：未来是动作的输入。',
  '先提出动作，再预测它的后果并用后果来选动作：未来是动作的评委。',
  '未来与动作在同一骨干里联合生成：未来是动作的同伴——三种都算 WAM。',
];

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
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

function arrowHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ang: number,
  size: number
): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * Math.cos(ang - 0.42), y - size * Math.sin(ang - 0.42));
  ctx.lineTo(x - size * Math.cos(ang + 0.42), y - size * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();
}

function miniArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  alpha: number,
  both?: boolean
): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  arrowHead(ctx, x2, y2, ang, 9);
  if (both) arrowHead(ctx, x1, y1, ang + Math.PI, 9);
  ctx.restore();
}

function miniNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  sym: string,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '600 20px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sym, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}

export const M12: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stepRef = useRef(1);
  const selAtRef = useRef(0);
  const [formStep, setFormStep] = useState(1);
  const [feedback, setFeedback] = useState({ text: FEEDBACK[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    selAtRef.current = performance.now() - 1000;

    const render = (now: number): void => {
      const step = stepRef.current;
      const since = now - selAtRef.current;
      const reveal = clamp((since - 120) / 520, 0, 1);
      const pose = POSES[step - 1];

      clearField(ctx, W, H);

      // 上区：测绘场景
      drawSheet(ctx, 50, 34, 180, 66, { border: CONTOUR });
      drawTripod(ctx, 300, 106, 0.9, INK);
      drawSurveyor(ctx, 402, 106, 1, INK, pose);
      // 旅人便签
      ctx.save();
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 780, 44, 150, 54, 8);
      ctx.fill();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = ROUTE;
      ctx.font = '600 22px ' + FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('l', 812, 72);
      ctx.fillStyle = MUTED;
      ctx.font = '13px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('旅人需求', 832, 72);
      ctx.restore();

      // 下区：三格形式图
      for (let i = 0; i < 3; i++) {
        const bx = BOX_X[i];
        const current = i === step - 1;
        const visited = i < step - 1;
        const border = current ? EMPH : visited ? ROUTE : LINE;

        if (current) {
          ctx.save();
          ctx.globalAlpha = 0.14;
          ctx.fillStyle = EMPH;
          roundRect(ctx, bx, BOX_Y, BOX_W, BOX_H, 12);
          ctx.fill();
          ctx.restore();
        }
        ctx.save();
        ctx.strokeStyle = border;
        ctx.lineWidth = current ? 3 : 2;
        roundRect(ctx, bx, BOX_Y, BOX_W, BOX_H, 12);
        ctx.stroke();
        ctx.restore();

        // 序号记号（裸数字）
        ctx.save();
        ctx.fillStyle = current ? EMPH : MUTED;
        ctx.beginPath();
        ctx.arc(bx + 18, BOX_Y + 18, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 13px ' + FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), bx + 18, BOX_Y + 19);
        ctx.restore();

        const my = BOX_Y + 32;
        const mw = 92;
        const mh = 42;

        if (i === 0) {
          // 未来 → 动作（级联）
          miniNode(ctx, bx + 30, my, mw, mh, 'o′', ROUTE);
          miniNode(ctx, bx + BOX_W - 30 - mw, my, mw, mh, 'a', ROUTE);
          const a = current ? reveal : 1;
          miniArrow(ctx, bx + 30 + mw, my + mh / 2, bx + BOX_W - 30 - mw, my + mh / 2, ROUTE, a);
        } else if (i === 1) {
          // 动作 → 未来（评分）
          miniNode(ctx, bx + 30, my, mw, mh, 'a', ROUTE);
          miniNode(ctx, bx + BOX_W - 30 - mw, my, mw, mh, 'o′', ROUTE);
          const a = current ? reveal : 1;
          miniArrow(ctx, bx + 30 + mw, my + mh / 2, bx + BOX_W - 30 - mw, my + mh / 2, ROUTE, a);
        } else {
          // 联合：同框 + 双箭头
          ctx.save();
          ctx.globalAlpha = current ? 0.08 : 0.05;
          ctx.fillStyle = OK;
          roundRect(ctx, bx + 16, my - 10, BOX_W - 32, mh + 20, 10);
          ctx.fill();
          ctx.restore();
          miniNode(ctx, bx + 30, my, mw, mh, 'o′', current ? OK : ROUTE);
          miniNode(ctx, bx + BOX_W - 30 - mw, my, mw, mh, 'a', current ? OK : ROUTE);
          const a = current ? reveal : 1;
          miniArrow(ctx, bx + 30 + mw, my + mh / 2, bx + BOX_W - 30 - mw, my + mh / 2, OK, a, true);
        }
      }

      // 上区左侧：当前形式名（≤8 字）
      drawSheetLabel(ctx, STAGE[step - 1], 40, 24, step === 3 ? OK : ROUTE);
    };

    const tick = (): void => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (next: number): void => {
    const v = clamp(next, 1, 3);
    if (v === stepRef.current) return;
    stepRef.current = v;
    selAtRef.current = performance.now();
    setFormStep(v);
    setFeedback({ text: FEEDBACK[v - 1], cls: v === 3 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={() => go(formStep - 1)} disabled={formStep === 1}>
          上一步
        </button>
        <button className="chip" onClick={() => go(formStep + 1)} disabled={formStep === 3}>
          下一步
        </button>
        <button className="chip" onClick={() => go(1)}>
          重新开始
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M12;
