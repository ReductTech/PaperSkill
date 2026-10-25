import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  clearField,
  drawSheet,
  drawContours,
  drawSurveyor,
  drawPin,
  drawSheetLabel,
  ROUTE,
  EMPH,
  AUX,
  INK,
  MUTED,
  LINE,
  CONTOUR,
} from './chartkit';
import type { WidgetProps } from './registry';

// m62 — 交付节奏：四种部署。用「上一步 / 下一步 / 重新开始」走一遍开环、分块、单步、交互，
// 看调用节奏、延迟与成本如何变化。时间轴只出现符号，不写具体数值。

const W = 1080;
const H = 280;
const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

interface Regime {
  name: string;
  pose: 'plant' | 'walk' | 'check';
  traveler: number;
}

const REGIMES: Regime[] = [
  { name: '开环', pose: 'plant', traveler: 470 },
  { name: '分块', pose: 'plant', traveler: 360 },
  { name: '单步', pose: 'walk', traveler: 300 },
  { name: '交互', pose: 'check', traveler: 300 },
];

const FEEDBACK: string[] = [
  '只调用一次（成本 C = N_fwd(T)）：便宜，但中途不能纠偏，偏差全由执行器吸收。',
  '每 K 步调用一次（C = ⌈T/K⌉·N_fwd(K)）：把大骨干摊到多个控制格上；块越长越易过期。',
  '每一步都调用（C = T·N_fwd(1)）：反应最快，前提是单次前向能塞进控制周期。',
  '边生成边被输入塑形（C = N_fwd^cached(M(t))）：记忆随时间增长，压力落在内存而不是单步算力。',
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

function block(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  alpha: number
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.restore();
}

function token(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size: number,
  bold: boolean
): void {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

export const M62: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const regRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const [regime, setRegime] = useState(1);
  const [feedback, setFeedback] = useState(FEEDBACK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();

    const render = (now: number): void => {
      const reg = regRef.current;
      const r = REGIMES[reg - 1];
      const prog = ((now - t0) % 3000) / 3000;
      clearField(ctx, W, H);

      // 上区：交付场景
      drawSheet(ctx, 40, 26, 210, 84);
      drawContours(ctx, 40, 26, 210, 84, 9, CONTOUR, 3);
      drawSurveyor(ctx, 96, 116, 0.9, INK, r.pose);
      ctx.save();
      ctx.setLineDash([7, 6]);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(160, 92);
      ctx.lineTo(r.traveler - 16, 92);
      ctx.stroke();
      ctx.restore();
      drawPin(ctx, r.traveler, 96, reg >= 3 ? EMPH : ROUTE, true);
      // 交互式：旅人的口述小注回流
      if (reg === 4) {
        ctx.strokeStyle = AUX;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(r.traveler - 40 - prog * 60, 118, 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 下区：时间轴
      const AX = 80;
      const AW = 920;
      const AY = 214;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(AX, AY);
      ctx.lineTo(AX + AW, AY);
      ctx.stroke();

      if (reg === 1) {
        block(ctx, AX, 190, 150, 44, ROUTE, 1);
      } else if (reg === 2) {
        for (let i = 0; i < 4; i++) block(ctx, AX + i * 230, 196, 130, 36, ROUTE, 1);
        token(ctx, 'K', AX + 210, 182, MUTED, 15, true);
      } else if (reg === 3) {
        const step = AW / 12;
        for (let i = 0; i < 12; i++) block(ctx, AX + i * step, 198, step - 8, 30, EMPH, i === 0 ? 1 : 0.9);
      } else {
        const step = AW / 12;
        for (let i = 0; i < 12; i++) block(ctx, AX + i * step, 198, step - 8, 30, EMPH, 0.9);
        // 记忆条：随 t 线性变长
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = AUX;
        roundRect(ctx, AX, 170, clamp(prog, 0.02, 1) * AW, 10, 5);
        ctx.fill();
        ctx.restore();
      }

      // 当前步橙色标记
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.arc(AX, AY, 6, 0, Math.PI * 2);
      ctx.fill();

      drawSheetLabel(ctx, r.name, 40, 20, EMPH);
      drawSheetLabel(ctx, '节奏', 80, 148, MUTED);
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

  const goto = (n: number): void => {
    const v = Math.round(clamp(n, 1, 4));
    regRef.current = v;
    setRegime(v);
    setFeedback(FEEDBACK[v - 1]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={'chip' + (regime > 1 ? ' selected on' : '')} disabled={regime <= 1} onClick={() => goto(regime - 1)}>
          上一步
        </button>
        <button className={'chip' + (regime < 4 ? ' selected on' : '')} disabled={regime >= 4} onClick={() => goto(regime + 1)}>
          下一步
        </button>
        <button className="chip" onClick={() => goto(1)}>
          重新开始
        </button>
      </div>
      <div className="feedback">{feedback}</div>
    </div>
  );
};

export default M62;
