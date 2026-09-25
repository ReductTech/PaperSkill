import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeOutCubic, lerpColor } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawSceneLabel,
  drawLegend,
  makeProfile,
  GUIDE,
  OK,
  BAD,
  EMPH,
  LINE,
} from './woodKit';
import type { WidgetProps } from './registry';

// Module 5.1 — 条件注入：FiLM 与交叉注意力
// Pattern P4 (mode chips) + shared-seed sampling. One fixed seed, three modes.

const W = 1080;
const H = 280;
const BX = 60;
const BY = 150;
const BW = 500;
const BH = 85;
const AMP = 30;
const N = 40;
const SWEEP_MS = 900;

type Cond = 'none' | 'film' | 'cross';

interface Feedback {
  text: string;
  cls: string;
}

const MODES: Array<{ id: Cond; label: string }> = [
  { id: 'none', label: '无条件' },
  { id: 'film', label: 'FiLM 条件化' },
  { id: 'cross', label: '交叉注意力' },
];

const FEEDBACK: Record<Cond, Feedback> = {
  none: { text: '没有条件，同一颗噪声只会得到一个与当前观测无关的动作。', cls: 'bad' },
  film: { text: '观测只编码一次，再逐通道调制每一层卷积——这是 CNN 主干的做法。', cls: 'good' },
  cross: { text: '观测作为被动 token 进入每一步的交叉注意力——这是 Transformer 主干的做法。', cls: 'good' },
};

export const M31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ cond: Cond; sampled: boolean; at: number }>({
    cond: 'none',
    sampled: false,
    at: 0,
  });
  const [seed] = useState(2023);
  const [cond, setCond] = useState<Cond>('none');
  const [feedback, setFeedback] = useState<Feedback>(FEEDBACK.none);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const observed = makeProfile(N, 1, seed).map((v) => Math.abs(v));
    const unrelated = makeProfile(N, 1, seed + 91).map((v) => Math.abs(v));

    const arrow = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 10, y - 5);
      ctx.lineTo(x - 10, y + 5);
      ctx.closePath();
      ctx.fill();
    };

    const render = (s: { cond: Cond; sampled: boolean; at: number }, now: number) => {
      clearScene(ctx, W, H);

      const p = s.sampled ? easeOutCubic(clamp((now - s.at) / SWEEP_MS, 0, 1)) : 0;
      const staysWrong = s.cond === 'none';
      const profile = observed.map((v, i) =>
        lerp(v, staysWrong ? unrelated[i] : 0, p) * AMP
      );

      drawBoard(ctx, BX, BY, BW, BH, profile, {
        profileColor: staysWrong ? BAD : lerpColor(BAD, OK, p),
      });

      // wood grain: the observation the policy has to read
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.45;
      for (let r = 0; r < 4; r++) {
        const gy = BY + 16 + r * 18;
        ctx.beginPath();
        for (let x = BX + 6; x <= BX + BW - 6; x += 12) {
          const yy = gy + Math.sin((x - BX) / 38 + r * 1.3) * 2.5;
          if (x === BX + 6) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // torn grain: what an unconditional sample produces
      if (staysWrong && p > 0.5) {
        ctx.globalAlpha = clamp((p - 0.5) * 2, 0, 1);
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 2;
        for (const bx of [210, 330, 450]) {
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            ctx.lineTo(bx + (j % 2 === 0 ? -3 : 3), BY + 4 + j * 4);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      const planeX = s.sampled ? lerp(BX + 24, BX + BW - 24, clamp(p / 0.6, 0, 1)) : BX + 24;
      drawPlane(ctx, planeX, BY, { length: 54 });
      if (s.sampled && p < 0.6) {
        drawShavings(ctx, planeX - 18, BY - 13, now / 1000, 3);
      }

      // right inset: two ways of getting the observation into the network
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(632, 30, 408, 182);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.strokeRect(632.5, 30.5, 407, 181);

      // the shared starting point: To frames, encoded once
      ctx.fillStyle = GUIDE;
      ctx.fillRect(650, 116, 12, 12);
      drawSceneLabel(ctx, '只编码一次', 690, 128);

      ctx.lineWidth = 2;
      ctx.strokeStyle = BAD;
      ctx.beginPath();
      ctx.moveTo(656, 122);
      ctx.lineTo(672, 86);
      ctx.lineTo(1004, 86);
      ctx.stroke();
      arrow(1012, 86, BAD);

      ctx.strokeStyle = OK;
      ctx.beginPath();
      ctx.moveTo(656, 122);
      ctx.lineTo(672, 170);
      ctx.lineTo(1004, 170);
      ctx.stroke();
      arrow(1012, 170, OK);

      ctx.fillStyle = BAD;
      ctx.beginPath();
      ctx.arc(856, 86, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = OK;
      ctx.beginPath();
      ctx.arc(856, 170, 7, 0, Math.PI * 2);
      ctx.fill();

      if (s.cond !== 'none') {
        ctx.fillStyle = EMPH;
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(856, 170, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = EMPH;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(856, 170, 13, 0, Math.PI * 2);
        ctx.stroke();
        drawSceneLabel(ctx, s.cond === 'film' ? '逐通道调制' : '交叉注意力', 872, 148);
      }

      drawLegend(
        ctx,
        [
          { color: BAD, text: '直接拼接联合分布' },
          { color: OK, text: '条件注入' },
        ],
        656,
        46
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
  }, [seed]);

  const select = (id: Cond) => {
    stateRef.current.cond = id;
    stateRef.current.sampled = false;
    setCond(id);
    setFeedback(FEEDBACK[id]);
  };

  const sample = () => {
    stateRef.current.sampled = true;
    stateRef.current.at = performance.now();
    setFeedback(FEEDBACK[stateRef.current.cond]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={'chip' + (cond === m.id ? ' selected' : '')}
            onClick={() => select(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button className="chip" onClick={sample}>
          用同一个噪声采样
        </button>
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M31;
