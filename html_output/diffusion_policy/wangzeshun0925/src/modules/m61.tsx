import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { clearScene, drawSceneLabel, drawLegend, OK, BAD, LINE } from './woodKit';
import type { WidgetProps } from './registry';

// Module 7.1 — P3 synchronised start: one button starts both training curves.
//
// HONESTY: the two curves are ILLUSTRATIVE TREND SHAPES echoing the paper's Fig 6
// (IBC's training error spikes and its evaluated success rate oscillates). They are
// teaching illustrations, not measured data.
const W = 1080;
const H = 280;
const RUN_MS = 2400;

const PL = 80;
const PR = 1010;
const LT = 26;
const LB = 160;
const ST = 190;
const SB = 230;
const N = 160;

type Phase = 'idle' | 'running' | 'done';

/** Monotone descent: the diffusion loss settles onto a plateau. */
const diffLoss = (t: number): number => 0.12 + 0.86 * Math.exp(-3.4 * t);
/** Same start, then a stagnating level with periodic rebounds. */
const ebmLoss = (t: number): number =>
  0.3 + 0.68 * Math.exp(-2.6 * t) + 0.16 * Math.sin(Math.PI * 6.4 * t) * Math.exp(-0.25 * t);
/** Evaluated success rate of the diffusion policy: rises and holds. */
const diffSucc = (t: number): number => 0.45 + 0.5 * (1 - Math.exp(-3 * t));
/** Evaluated success rate of the energy-based policy: oscillates around a level. */
const ebmSucc = (t: number): number =>
  clamp(0.45 + 0.1 * (1 - Math.exp(-2 * t)) + 0.22 * Math.sin(Math.PI * 5.2 * t) * Math.exp(-0.15 * t), 0, 1);

const lossY = (v: number): number => LB - clamp(v, 0, 1) * (LB - LT);
const succY = (v: number): number => SB - clamp(v, 0, 1) * (SB - ST);
const curveX = (u: number): number => PL + clamp(u, 0, 1) * (PR - PL);

const FB_IDLE = {
  text: '两种方法的目标函数不同：扩散只做「加噪—预测噪声」的回归，能量模型要靠负采样估计配分函数。按下按钮，让两条曲线从同一个起点出发。',
  cls: '',
};
const FB_RUN = {
  text: '两条曲线从同一个起点出发，关注它们是否单调。曲线为教学示意，趋势来自论文 Fig 6。',
  cls: '',
};
const FB_DONE = {
  text: '能量模型的目标在震荡，对应的评估成功率也在震荡，导致必须逐个检查点评估。扩散目标单调下降，检查点选择容易得多。曲线为教学示意，趋势来自论文 Fig 6，不是实测数据。',
  cls: 'bad',
};

export const M61: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef(0);
  const phaseRef = useRef<Phase>('idle');
  const startRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState(FB_IDLE);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const t0 = performance.now();

    const polyline = (fn: (t: number) => number, toY: (v: number) => number, upTo: number) => {
      ctx.beginPath();
      let first = true;
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        if (u > upTo) break;
        const x = curveX(u);
        const y = toY(fn(u));
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    const render = (elapsed: number) => {
      const t = tRef.current;

      clearScene(ctx, W, H);

      // axes of the loss panel and of the success panel
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PL + 0.5, LT);
      ctx.lineTo(PL + 0.5, LB);
      ctx.moveTo(PL, LB + 0.5);
      ctx.lineTo(PR, LB + 0.5);
      ctx.moveTo(PL + 0.5, ST);
      ctx.lineTo(PL + 0.5, SB);
      ctx.moveTo(PL, SB + 0.5);
      ctx.lineTo(PR, SB + 0.5);
      ctx.stroke();

      // the level each loss settles onto
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(PL, lossY(0.12) + 0.5);
      ctx.lineTo(PR, lossY(0.12) + 0.5);
      ctx.moveTo(PL, lossY(0.4) + 0.5);
      ctx.lineTo(PR, lossY(0.4) + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);

      // losses, revealed up to the current progress
      ctx.strokeStyle = OK;
      ctx.lineWidth = 3;
      polyline(diffLoss, lossY, t);
      ctx.strokeStyle = BAD;
      ctx.lineWidth = 3;
      polyline(ebmLoss, lossY, t);

      // evaluated success rates, same time base
      ctx.strokeStyle = OK;
      ctx.lineWidth = 2;
      polyline(diffSucc, succY, t);
      ctx.strokeStyle = BAD;
      ctx.lineWidth = 2;
      polyline(ebmSucc, succY, t);

      // both curves start on this marker
      const pulse = 4 + 2 * (0.5 + 0.5 * Math.sin(elapsed / 240));
      const oy = lossY(diffLoss(0));
      ctx.fillStyle = OK;
      ctx.beginPath();
      ctx.arc(PL, oy, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = BAD;
      ctx.beginPath();
      ctx.arc(PL, oy, pulse * 0.5, 0, Math.PI * 2);
      ctx.fill();

      drawSceneLabel(ctx, '训练损失', PL, 20);
      drawSceneLabel(ctx, '评估成功率', PL, 186);
      drawLegend(
        ctx,
        [
          { color: OK, text: '扩散策略' },
          { color: BAD, text: '能量模型 IBC' },
        ],
        770,
        20
      );
    };

    const tick = () => {
      const now = performance.now();
      if (phaseRef.current === 'running') {
        if (startRef.current === null) startRef.current = now;
        const tt = clamp((now - startRef.current) / RUN_MS, 0, 1);
        tRef.current = tt;
        if (tt >= 1) {
          phaseRef.current = 'done';
          setPhase('done');
          setFeedback(FB_DONE);
        }
      }
      render(now - t0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onStart = () => {
    tRef.current = 0;
    startRef.current = null;
    phaseRef.current = 'running';
    setPhase('running');
    setFeedback(FB_RUN);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={'chip' + (phase === 'running' ? ' selected' : '')} onClick={onStart}>
          同时开始训练
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M61;
