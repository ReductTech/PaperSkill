import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawDog,
  drawTracker,
  drawTrail,
  drawLegend,
  drawSceneLabel,
  drawTimeCard,
  drawValueChip,
} from './dogKit';
import type { WidgetProps } from './registry';

// Ch9 module 9.1 「接力 vs 锚定」 (P3 synchronized compare, hybrid).
// One 1080x280 canvas, two stacked halves animated from the same timestamp:
// top = chained hand-off (red trail deviates further at every segment tick,
// drift amplitude is illustrative only), bottom = anchored look-up (green
// trail hugs the dashed true path regardless of L). s = (L-1)/11 rounded.
const W = 1080;
const H = 280;
const RUN_MS = 1500;
const X0 = 80;
const X1 = 1000;

const SEG_S: Record<number, number> = { 24: 2, 60: 6, 120: 10 };

// the dog leaps once mid-way (a physical hop, not a teleport). A hop NECESSARILY
// has a rise and fall: the anchored estimate rides the full arc and settles back,
// while the chained estimate undershoots it, inherits extra error, and keeps drifting.
// Drift amplitude is scaled so even L=120 stays inside the drawing band (never a
// flattened straight line).
const JUMP_U = 0.5;
const hopBump = (u: number) => {
  const w = 0.07;
  return Math.exp(-((u - JUMP_U) ** 2) / (2 * w * w));
};
const segNoise = (k: number) => Math.sin(k * 12.9898) * 4.4 + Math.sin(k * 78.233) * 1.6;
const chainedDev = (u: number, s: number) => {
  let acc = 0;
  for (let k = 0; k < s; k++) {
    acc += segNoise(k) * clamp(u * s - k, 0, 1);
  }
  const dev = acc * (0.35 + s * 0.08) + (u >= JUMP_U ? 2 + s * 0.5 : 0) + 9 * hopBump(u);
  return clamp(dev, -50, 50);
};
const anchoredDev = (u: number) => 3.5 * Math.sin(u * 9.2) + 28 * hopBump(u);
const hopLift = (u: number) => -30 * hopBump(u); // the dog's ground y lifts while airborne

const xAt = (u: number) => X0 + u * (X1 - X0);

const DONE_FB =
  '狗中途向上跳一下：锚定轨迹跟着跳起又落回（跳起必然有起伏）；链式只跟上一小截、起跳瞬间丢准，之后还带着这份误差继续漂——论文图 5：序列 12→120、步长 1→12 时 TrackCraft3R 降幅远小于 DELTAv2。';

type Phase = 'idle' | 'running' | 'done';

export const Ch9Longvideo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ L: 24, phase: 'idle' as Phase, startAt: 0 });
  const [L, setL] = useState(24);
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState({ text: '选长度，按开始对比两种策略。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = () => {
      const st = stateRef.current;
      if (st.phase === 'running' && performance.now() - st.startAt >= RUN_MS) {
        st.phase = 'done';
        setPhase('done');
        setFeedback({ text: DONE_FB, cls: 'good' });
      }
      const s = SEG_S[st.L];
      const p =
        st.phase === 'idle'
          ? 0
          : st.phase === 'done'
            ? 1
            : easeOutCubic(clamp((performance.now() - st.startAt) / RUN_MS, 0, 1));

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 140);
      ctx.lineTo(W, 140);
      ctx.stroke();

      const halves: {
        top: number;
        ground: number;
        label: string;
        color: string;
        mark: 'tracker' | 'dot';
        dev: (u: number) => number;
      }[] = [
        { top: 6, ground: 106, label: '链式', color: C.red, mark: 'dot', dev: (u) => chainedDev(u, s) },
        { top: 148, ground: 248, label: '锚定', color: C.green, mark: 'tracker', dev: anchoredDev },
      ];

      halves.forEach((hf) => {
        const noseY = hf.ground - 22;
        // ground line
        ctx.strokeStyle = C.ground;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, hf.ground);
        ctx.lineTo(W, hf.ground);
        ctx.stroke();
        // true path (dashed grey)
        drawTrail(ctx, [{ x: X0, y: noseY }, { x: X1, y: noseY }], C.muted, true);
        // segment boundary ticks
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.25;
        for (let k = 1; k <= s; k++) {
          const tx = X0 + (k / s) * (X1 - X0);
          ctx.beginPath();
          ctx.moveTo(tx, noseY - 24);
          ctx.lineTo(tx, hf.ground - 2);
          ctx.stroke();
        }
        // hop marker: dashed vertical line where the dog leaps
        const jx = xAt(JUMP_U);
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(jx, hf.top + 6);
        ctx.lineTo(jx, hf.ground - 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // estimated trail up to the shared progress
        if (p > 0) {
          const pts: { x: number; y: number }[] = [];
          const N = 48;
          for (let i = 0; i <= N; i++) {
            const u = (i / N) * p;
            pts.push({
              x: xAt(u),
              y: clamp(noseY - hf.dev(u), hf.top + 22, hf.ground - 2),
            });
          }
          drawTrail(ctx, pts, hf.color, false);
        }
        // the dog itself always walks the true path and leaps once mid-way
        const dogX = xAt(p);
        drawDog(ctx, dogX, hf.ground + hopLift(p), 0.9, { mood: p > 0 && p < 1 ? 'walk' : 'idle', t: p * 3 });
        if (hf.mark === 'tracker') {
          drawTracker(ctx, dogX + 20.7, noseY, 4);
        } else {
          ctx.fillStyle = C.red;
          ctx.beginPath();
          ctx.arc(dogX, clamp(noseY - hf.dev(p), hf.top + 22, hf.ground - 2), 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        drawSceneLabel(ctx, hf.label, 14, hf.top + 10, { color: hf.color });
      });

      drawValueChip(ctx, W - 44, 22, String(s), C.blue);
      if (p >= JUMP_U) drawTimeCard(ctx, xAt(JUMP_U), 16, '跳跃');
      drawLegend(ctx, [['真实轨迹', C.muted], ['链式', C.red], ['锚定', C.green]], 14, H - 10);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const chooseL = (v: number) => {
    stateRef.current.L = v;
    stateRef.current.phase = 'idle';
    setL(v);
    setPhase('idle');
    setFeedback({ text: '选长度，按开始对比两种策略。', cls: '' });
  };

  const startRace = () => {
    stateRef.current.phase = 'running';
    stateRef.current.startAt = performance.now();
    setPhase('running');
    setFeedback({ text: '同一时间轴播放中：狗会在中途向上跳一下——看红色轨迹起跳时丢准、之后继续漂移。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>片段长度</label>
        {[24, 60, 120].map((v) => (
          <button
            key={v}
            type="button"
            className={`chip ${L === v ? 'selected' : ''}`}
            onClick={() => chooseL(v)}
          >
            L={v}
          </button>
        ))}
        <label>
          段数 s <span className="val">{SEG_S[L]}</span>
        </label>
        <button type="button" className="tiny" onClick={startRace}>
          {phase === 'idle' ? '开始' : '重放'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Longvideo;
