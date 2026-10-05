import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawLegend,
  makeProfile,
  GUIDE,
  OK,
  BAD,
  LINE,
} from './woodKit';
import type { WidgetProps } from './registry';

// Module 4.1 — 刨削深度就是去噪步长 (pattern P1: real-time slider).
// Left: board + profile + plane. Right: gap decay per iteration + overshoot marks.

const W = 1080;
const H = 280;
const BX = 60;
const BY = 170;
const BW = 520;
const BH = 65;
const AMP = 62;
const SEED = 31;
const N = 40;
const MAX_ITER = 16;
const CX0 = 664;
const CX1 = 1004;
const CY = 134;
const VH = 50;
const NOTE = '（曲线是按迭代式推算的示意，不是实测数据。）';

interface Feedback {
  text: string;
  cls: string;
}

function pickFeedback(gamma: number): Feedback {
  if (gamma > 0.55) return { text: '步长太大：轮廓在目标线两侧来回跳，收敛不了。' + NOTE, cls: 'bad' };
  if (gamma < 0.12) return { text: '步长偏小：方向是对的，但需要很多次迭代。' + NOTE, cls: '' };
  return { text: '步长合适：单调收敛，这也是论文用平方余弦调度的原因。' + NOTE, cls: 'good' };
}

/** Residual gap shrinks by 1 - γ per pass; past γ = 0.55 the pass overshoots. */
function contraction(gamma: number): number {
  if (gamma <= 0.55) return 1 - gamma;
  return Math.max(Math.abs(1 - gamma), 0.72 + 0.28 * ((gamma - 0.55) / 0.45));
}

export const M22: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ gamma: 0.3 });
  const [gamma, setGamma] = useState(0.3);
  const [feedback, setFeedback] = useState<Feedback>(pickFeedback(0.3));

  const convergeSteps = Math.ceil(Math.log(0.02) / Math.log(1 - gamma));
  const passesText = gamma <= 0.55 && Number.isFinite(convergeSteps) ? String(convergeSteps) : '—';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const shape = makeProfile(N, 1, SEED).map((v) => Math.abs(v));
    let t0: number | null = null;

    const render = (s: { gamma: number }, now: number) => {
      if (t0 === null) t0 = now;
      clearScene(ctx, W, H);

      const r = contraction(s.gamma);
      const over = s.gamma > 0.55;
      const raw = Math.ceil(Math.log(0.02) / Math.log(1 - s.gamma));
      const passes = clamp(Number.isFinite(raw) ? raw : 1, 1, 3);
      const amp = AMP * Math.pow(r, passes);
      const zone = over ? BAD : s.gamma < 0.12 ? GUIDE : OK;

      drawBoard(
        ctx,
        BX,
        BY,
        BW,
        BH,
        shape.map((v) => v * amp),
        { profileColor: zone }
      );

      // the plane keeps taking passes over the board
      const u = easeInOutQuad(((now - t0) % 2400) / 2400);
      const px = lerp(BX + 20, BX + BW - 20, u);
      const back = u > 0.5;
      drawPlane(ctx, px, BY - amp - 3, { length: 54, flip: back });
      drawShavings(ctx, px + (back ? -18 : 18), BY - amp - 14, now / 1000, 3);

      // right inset: how the measured gap decays over iterations
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(640, 60, 380, 150);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.strokeRect(640.5, 60.5, 379, 149);

      ctx.strokeStyle = LINE;
      ctx.beginPath();
      ctx.moveTo(CX0, 76);
      ctx.lineTo(CX0, 200);
      ctx.stroke();

      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let n = 0; n <= MAX_ITER; n++) {
        const x = lerp(CX0, CX1, n / MAX_ITER);
        const v = Math.pow(r, n) * (over && n % 2 === 1 ? -1 : 1);
        const y = CY - v * VH;
        if (n === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (over) {
        ctx.fillStyle = BAD;
        for (let n = 1; n <= MAX_ITER; n += 2) {
          const x = lerp(CX0, CX1, n / MAX_ITER);
          const y = CY + Math.pow(r, n) * VH;
          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.strokeStyle = OK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CX0, CY);
      ctx.lineTo(CX1, CY);
      ctx.stroke();

      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '缝隙衰减' },
          { color: OK, text: '目标线' },
          { color: BAD, text: '过冲' },
        ],
        640,
        36
      );
    };

    const tick = (now: number) => {
      render(stateRef.current, now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const g = Number(e.target.value) / 100;
    stateRef.current.gamma = g;
    setGamma(g);
    setFeedback(pickFeedback(g));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          刨削深度 γ（去噪步长） <span className="val">{gamma.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={2}
          max={100}
          value={Math.round(gamma * 100)}
          onChange={onChange}
        />
      </div>
      <div className="ctrl">
        <label>
          预计收敛刀数 <span className="val">{passesText}</span>
        </label>
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M22;
