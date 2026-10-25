import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeInOutQuad } from '../lib/canvasKit';
import {
  clearScene,
  drawKeyboard,
  drawHand,
  drawPath,
  drawScore,
  drawNote,
  drawSceneLabel,
  drawLegend,
  OK,
  BAD,
  INK,
  MUTED,
} from './musicKit';
import type { WidgetProps } from './registry';

// P3 同步对比：左边只做预训练（会卡、需要恢复），右边预训练 + 后训练（流畅完成）。
// 按下「同时开始」后两条赛道共用同一段时间轴。

const W = 1080;
const H = 280;
const RUN_MS = 4200;

const LANE_W = 460;
const LEFT_X = 40;
const RIGHT_X = 580;
const BARS = 8;
const KB_N = 11;
const SCORE_Y = 46;
const KB_Y = 150;
const KB_H = 46;
const TKW = LANE_W / KB_N;
const kx = (lx: number, i: number): number => lx + i * TKW + (TKW - 2) / 2;

type Phase = 'idle' | 'run' | 'done';

const IDLE_TEXT = '按「同时开始」，让两条路线同步跑完同一段曲子，看看差别出在哪一步。';
const RUN_TEXT = '左边只做过预训练，右边在预训练之后又加了后训练，同步观察两条赛道。';
const DONE_TEXT =
  '只在高质量窄数据上训练，模型学不会从错误中恢复；只用大规模低质预训练数据，又学不会灵巧与鲁棒。两段式配方缺一不可。';

export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ phase: Phase; startedAt: number }>({ phase: 'idle', startedAt: 0 });
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState({ text: IDLE_TEXT, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    // 只预训练：冲到一半卡住、回退，再勉强恢复一点
    const leftProg = (p: number): number => {
      if (p < 0.42) return (p / 0.42) * 0.46;
      if (p < 0.66) return 0.46 + Math.sin(p * 90) * 0.012;
      if (p < 0.78) return 0.46 - ((p - 0.66) / 0.12) * 0.1;
      return 0.36 + ((p - 0.78) / 0.22) * 0.2;
    };
    // 预训练 + 后训练：一路平稳跑完
    const rightProg = (p: number): number => easeInOutQuad(clamp(p / 0.86, 0, 1));

    const render = (ts: number) => {
      clearScene(ctx, W, H);
      const s = stateRef.current;
      let p = 0;
      if (s.phase === 'run') {
        p = clamp((ts - s.startedAt) / RUN_MS, 0, 1);
        if (p >= 1) {
          s.phase = 'done';
          setPhase('done');
          setFeedback({ text: DONE_TEXT, cls: 'good' });
        }
      } else if (s.phase === 'done') {
        p = 1;
      }

      const lp = leftProg(p);
      const rp = rightProg(p);
      const stalled = s.phase === 'run' && p >= 0.42 && p < 0.8;

      const lane = (lx: number, prog: number, color: string, jitter: boolean): number => {
        const filled = Math.min(BARS, Math.round(prog * BARS));
        drawScore(ctx, lx, SCORE_Y, LANE_W, 16, BARS, filled, color);
        const k = clamp(Math.floor(prog * KB_N), 0, KB_N - 1);
        drawKeyboard(ctx, lx, KB_Y, LANE_W, KB_H, KB_N, prog > 0.01 ? [k] : [], color);
        const pts: number[][] = [];
        for (let i = 0; i <= k; i++) pts.push([kx(lx, i), 122]);
        if (pts.length > 1) drawPath(ctx, pts, color, 3);
        const hx = kx(lx, k) + (jitter ? 2.5 * Math.sin(ts / 90) : 0);
        drawHand(ctx, hx, 138, 0.9, color);
        return hx;
      };

      const lhx = lane(LEFT_X, lp, BAD, stalled);
      const rhx = lane(RIGHT_X, rp, OK, false);

      // 飘出的音符
      if (p > 0.03) {
        const fr = (p * 6) % 1;
        ctx.globalAlpha = 0.8;
        drawNote(ctx, rhx, 108 - 14 * fr, 6.5, OK);
        ctx.globalAlpha = 1;
      }
      if (p > 0.03 && p < 0.44) {
        const fr = (p * 6) % 1;
        ctx.globalAlpha = 0.7;
        drawNote(ctx, lhx, 108 - 14 * fr, 6.5, BAD);
        ctx.globalAlpha = 1;
      }

      // 卡住：手在原地打转，右侧明确标出停下的位置
      if (stalled) {
        for (let i = 0; i < 3; i++) {
          const a = ts / 300 + i * 2.1;
          ctx.fillStyle = MUTED;
          ctx.beginPath();
          ctx.arc(lhx + 16 * Math.cos(a), 112 + 7 * Math.sin(a), 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (s.phase === 'done') {
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(lhx, 122, 12, 0, Math.PI * 2);
        ctx.stroke();
        drawPath(ctx, [[lhx - 6, 116], [lhx + 6, 128]], BAD, 3);
        drawPath(ctx, [[lhx - 6, 128], [lhx + 6, 116]], BAD, 3);
      }

      drawSceneLabel(ctx, '只预训练', LEFT_X, 30, p >= 0.42 ? BAD : INK);
      drawSceneLabel(ctx, '预训练+后训练', RIGHT_X, 30, OK);
      drawLegend(
        ctx,
        [
          { color: BAD, text: '卡住' },
          { color: OK, text: '流畅' },
        ],
        LEFT_X,
        228
      );
    };

    const tick = (ts: number) => {
      render(ts);
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

  const onStart = () => {
    stateRef.current.startedAt = performance.now();
    stateRef.current.phase = 'run';
    setPhase('run');
    setFeedback({ text: RUN_TEXT, cls: '' });
  };
  const onReset = () => {
    stateRef.current.phase = 'idle';
    stateRef.current.startedAt = 0;
    setPhase('idle');
    setFeedback({ text: IDLE_TEXT, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={'chip' + (phase === 'run' ? ' selected' : '')} onClick={onStart}>
          同时开始
        </button>
        <button className={'chip' + (phase === 'idle' ? ' selected' : '')} onClick={onReset}>
          重置
        </button>
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M51;
