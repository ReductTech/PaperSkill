import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic, lerpColor } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawTarget,
  drawLegend,
  makeProfile,
  seeded,
  GUIDE,
  OK,
  BAD,
  EMPH,
  LINE,
} from './woodKit';
import type { WidgetProps } from './registry';

// Module 3.1 — 从噪声板到平整板：逐步去噪
// Pattern P2 (step-through): 上一步 / 下一步 / 重置, or click the iteration strip.

const W = 1080;
const H = 280;
const K = 8;
const N = 44;
const SEED = 19;
const BX = 100;
const BY = 150;
const BW = 560;
const BH = 85;
const AMP = 62;
const PASS_MS = 420;
const TX0 = 120;
const TX1 = 1000;

interface Feedback {
  text: string;
  cls: string;
}

function pickFeedback(step: number): Feedback {
  if (step >= 6) return { text: '这一步的动作还是纯噪声，不能执行。', cls: 'bad' };
  if (step <= 1) return { text: '轮廓贴住目标线，这一步的动作可以直接执行。', cls: 'good' };
  return { text: '轮廓在收敛，已经能看出大致走向。', cls: '' };
}

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ step: K, passAt: -1e9 });
  const [step, setStep] = useState(K);
  const [feedback, setFeedback] = useState<Feedback>(pickFeedback(K));

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
    const rnd = seeded(5);
    const cloud: Array<[number, number]> = [];
    for (let i = 0; i < 60; i++) cloud.push([rnd() * 2 - 1, rnd() * 2 - 1]);

    const render = (s: { step: number; passAt: number }, now: number) => {
      const noise = s.step / K;
      clearScene(ctx, W, H);

      // board + current profile
      const col = lerpColor(BAD, OK, 1 - noise);
      drawBoard(
        ctx,
        BX,
        BY,
        BW,
        BH,
        shape.map((v) => v * AMP * noise),
        { profileColor: col }
      );

      // flat target line the profile is converging to
      ctx.strokeStyle = OK;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(BX, BY);
      ctx.lineTo(BX + BW, BY);
      ctx.stroke();

      // one 0.4 s planing pass right after a step change
      const dt = now - s.passAt;
      if (s.step < K && dt >= 0 && dt <= PASS_MS) {
        const px = lerp(BX + 16, BX + BW - 16, easeOutCubic(dt / PASS_MS));
        drawPlane(ctx, px, BY, { length: 54 });
        drawShavings(ctx, px - 18, BY - 13, now / 1000, 3);
      }

      // technical inset: the 2-D sketch of A^k collapsing onto the target
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(700, 40, 320, 165);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.strokeRect(700.5, 40.5, 319, 164);
      const spread = 12 + 46 * noise;
      ctx.fillStyle = GUIDE;
      for (const d of cloud) {
        ctx.beginPath();
        ctx.arc(860 + d[0] * spread, 130 + d[1] * spread, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      drawTarget(ctx, 860, 130, noise < 0.12 ? 'reached' : 'pending');

      // iteration strip (left = most noisy, right = flat)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(100, 246, 920, 26);
      ctx.strokeStyle = LINE;
      ctx.strokeRect(100.5, 246.5, 919, 25);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(TX0, 259);
      ctx.lineTo(TX1, 259);
      ctx.stroke();
      const mx = lerp(TX1, TX0, s.step / K);
      ctx.strokeStyle = OK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(TX0, 259);
      ctx.lineTo(mx, 259);
      ctx.stroke();
      for (let i = 0; i <= K; i++) {
        const tx = lerp(TX1, TX0, i / K);
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx, 253);
        ctx.lineTo(tx, 265);
        ctx.stroke();
      }
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.arc(mx, 259, 5, 0, Math.PI * 2);
      ctx.fill();

      drawLegend(
        ctx,
        [
          { color: col, text: '当前轮廓' },
          { color: OK, text: '目标平整线' },
        ],
        712,
        30
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

  const apply = (next: number) => {
    const s = clamp(Math.round(next), 0, K);
    stateRef.current.step = s;
    stateRef.current.passAt = performance.now();
    setStep(s);
    setFeedback(pickFeedback(s));
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const t = clamp((x - TX0) / (TX1 - TX0), 0, 1);
    apply(K * (1 - t));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onClick}
      />
      <div className="ctrl">
        <label>
          剩余去噪步 k <span className="val">{step}</span>
        </label>
      </div>
      <div className="chip-row">
        <button className="chip" onClick={() => apply(stateRef.current.step + 1)}>
          上一步
        </button>
        <button className="chip" onClick={() => apply(stateRef.current.step - 1)}>
          下一步
        </button>
        <button className="chip" onClick={() => apply(K)}>
          重置
        </button>
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M21;
