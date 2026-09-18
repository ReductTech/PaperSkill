import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawSea,
  drawTower,
  drawLamp,
  drawBeam,
  drawShip,
  drawSceneLabel,
  drawLegend,
  C,
} from './lighthouseKit';

// §3 Module 3.1 — 一步步扫过更长的上下文（P2 步进）。
// 共 5 步，spread = 0.20 + 0.14*(step-1)，右侧 inset 画“已曝光”与“实际命中”两条折线。

const W = 1080;
const H = 300;
const LAMP_X = 150;
const LAMP_Y = 150;
const SEA_Y = 200;
const SHIP_REACH = 360;
const TOTAL = 5;

function computeFeedback(step: number): { text: string; cls: '' | 'good' | 'bad' } {
  if (step <= 2) return { text: '上下文变长，命中也跟着上升。', cls: '' };
  if (step === 3) return { text: '曝光继续增长，命中开始放缓。', cls: '' };
  return { text: '曝光很多，命中却几乎不涨——这就是**看得见却取不到**。', cls: 'bad' };
}

export const Mod31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(1);
  const stepRef = useRef(1);
  const [feedback, setFeedback] = useState(computeFeedback(1));

  const update = (n: number) => {
    stepRef.current = n;
    setStep(n);
    setFeedback(computeFeedback(n));
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

    const exposed = [0.2, 0.4, 0.6, 0.8, 1.0];
    const hitv = [0.3, 0.55, 0.6, 0.58, 0.5];

    const render = (s: number) => {
      clearScene(ctx, W, H);
      drawSea(ctx, W, H, SEA_Y);
      drawTower(ctx, LAMP_X, H, 150);
      drawLamp(ctx, LAMP_X, LAMP_Y, 0.6);

      const spread = 0.2 + 0.14 * (s - 1);
      const reach = 200 + s * 70;
      drawBeam(ctx, LAMP_X, LAMP_Y, 0.18, spread, reach, C.beam);

      const sx = LAMP_X + Math.cos(0.18) * SHIP_REACH;
      const sy = LAMP_Y + Math.sin(0.18) * SHIP_REACH;
      drawShip(ctx, sx, sy, 'lit');

      // inset 技术插图 320x240
      const ix = 740;
      const iy = 30;
      const iw = 320;
      const ih = 240;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ix, iy, iw, ih);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ix, iy, iw, ih);

      const padL = 40;
      const padB = 30;
      const padT = 14;
      const padR = 14;
      const gx0 = ix + padL;
      const gy0 = iy + ih - padB;
      const gx1 = ix + iw - padR;
      const gy1 = iy + padT;
      ctx.strokeStyle = C.inkMuted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx0, gy1);
      ctx.lineTo(gx0, gy0);
      ctx.lineTo(gx1, gy0);
      ctx.stroke();

      const X = (i: number) => gx0 + (gx1 - gx0) * ((i - 1) / (TOTAL - 1));
      const Y = (v: number) => gy0 + (gy1 - gy0) * v;

      ctx.strokeStyle = C.beam;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      exposed.forEach((v, i) => (i === 0 ? ctx.moveTo(X(i + 1), Y(v)) : ctx.lineTo(X(i + 1), Y(v))));
      ctx.stroke();

      ctx.strokeStyle = C.hit;
      ctx.beginPath();
      hitv.forEach((v, i) => (i === 0 ? ctx.moveTo(X(i + 1), Y(v)) : ctx.lineTo(X(i + 1), Y(v))));
      ctx.stroke();

      drawLegend(ctx, ix + padL, iy + 6, [
        { color: C.beam, label: '已曝光' },
        { color: C.hit, label: '命中' },
      ]);
      drawSceneLabel(ctx, X(TOTAL) - 30, Y(exposed[TOTAL - 1]) - 10, '已曝光');
      drawSceneLabel(ctx, X(TOTAL) - 30, Y(hitv[TOTAL - 1]) - 10, '命中');
    };

    const rafRef = { current: 0 as number };
    const tick = () => {
      render(stepRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
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

  const atLast = step >= TOTAL;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span>第 {step} 步 / 共 {TOTAL} 步</span>
        <div>
          <button type="button" disabled={step <= 1} onClick={() => update(step - 1)}>
            上一步
          </button>
          <button type="button" disabled={atLast} onClick={() => update(step + 1)}>
            {atLast ? '已到最后一步' : '下一步'}
          </button>
          <button type="button" onClick={() => update(1)}>
            重置
          </button>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod31;
