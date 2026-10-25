import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawShavings,
  drawSceneLabel,
  drawLegend,
  makeProfile,
  OK,
  BAD,
  EMPH,
  LINE,
  MUTED,
  AUX,
} from './woodKit';
import type { WidgetProps } from './registry';

// Module 6.1 — training uses 100 iterations, inference does not have to.
// P1 real-time slider: the inference step count drives both the board surface and
// the vertical marker on the quality / latency inset.
//
// HONESTY: the latency is a LINEAR EXTRAPOLATION of the paper's stated
// "10 inference steps ~ 0.1 s on an NVIDIA 3080" (p4 §3.4), not a measurement.
const W = 1080;
const H = 280;

// left region: the board on the bench
const BX = 60;
const BY = 190;
const BW = 520;
const BH = 45;
const PTS = 34;
const AMP0 = 26;

// right region: white technical inset
const IX = 640;
const IY = 38;
const IW = 400;
const IH = 177;
const PL = 680;
const PR = 1020;
const PT = 50;
const PB = 190;
const MAX_MS = 1000;

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

/** Paper value at 10 steps ≈ 0.1 s, extrapolated linearly. */
const latencyOf = (steps: number): number => steps * 10;
/** Teaching shape that saturates a little after 10 steps. */
const qualityOf = (steps: number): number => 1 - Math.exp(-steps / 7);
const stepX = (s: number): number => PL + ((s - 1) / 99) * (PR - PL);
const valY = (v: number): number => PB - clamp(v, 0, 1) * (PB - PT);

const FB_LOW = {
  text: '步数太少，动作还没收敛，轮廓明显不平。延迟为按论文 10 步约 0.1 秒线性外推的示意值。',
  cls: 'bad',
};
const FB_MID = {
  text: '论文真机配置用 16 步，10 步时 3080 上约 0.1 秒延迟，质量已经接近饱和。延迟为按论文 10 步约 0.1 秒线性外推的示意值，不是实测结果。',
  cls: 'good',
};
const FB_HIGH = {
  text: '再加步数几乎只增加延迟，质量曲线已经平了。延迟为按论文 10 步约 0.1 秒线性外推的示意值。',
  cls: '',
};

export const M51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ steps: 10 });
  const [inferSteps, setInferSteps] = useState(10);
  const [feedback, setFeedback] = useState(FB_MID);

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

    const render = (elapsed: number) => {
      const steps = stateRef.current.steps;
      const q = qualityOf(steps);
      const ms = latencyOf(steps);

      clearScene(ctx, W, H);

      // the board keeps only the residual error of the truncated schedule
      drawBoard(ctx, BX, BY, BW, BH, makeProfile(PTS, AMP0 * (1 - q), 5), {
        profileColor: lerpColor(BAD, OK, q),
      });

      // the plane keeps making gentle passes; shavings thin out as it flattens
      const px = BX + 40 + 440 * (0.5 - 0.5 * Math.cos((elapsed / 3000) * Math.PI * 2));
      drawShavings(ctx, px - 16, BY - 6, elapsed / 420, 1 + 2 * (1 - q));
      drawPlane(ctx, px, BY, { length: 108 });

      // white technical inset
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(IX, IY, IW, IH);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(IX + 0.75, IY + 0.75, IW - 1.5, IH - 1.5);

      // axes
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PL + 0.5, PT);
      ctx.lineTo(PL + 0.5, PB);
      ctx.moveTo(PL, PB + 0.5);
      ctx.lineTo(PR, PB + 0.5);
      ctx.stroke();

      // normalised range on the left of the plot
      ctx.fillStyle = MUTED;
      ctx.font = '15px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('1', PL - 20, PT + 5);
      ctx.fillText('0', PL - 20, PB + 1);

      // reference points: 10 (the paper's 0.1 s number) and 100 (training iterations)
      ctx.strokeStyle = LINE;
      ctx.beginPath();
      ctx.moveTo(stepX(10), PB);
      ctx.lineTo(stepX(10), PB + 5);
      ctx.moveTo(stepX(100), PB);
      ctx.lineTo(stepX(100), PB + 5);
      ctx.stroke();
      ctx.fillStyle = MUTED;
      ctx.fillText('10', stepX(10) - 8, PB + 21);
      ctx.fillText('100', stepX(100) - 12, PB + 21);

      // quality curve — saturates just after 10 steps
      ctx.strokeStyle = OK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let s = 1; s <= 100; s++) {
        const x = stepX(s);
        const y = valY(qualityOf(s));
        if (s === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // latency curve — rises linearly
      ctx.strokeStyle = EMPH;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let s = 1; s <= 100; s++) {
        const x = stepX(s);
        const y = valY(latencyOf(s) / MAX_MS);
        if (s === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // current step marker
      const cx = stepX(steps);
      const qy = valY(q);
      const ly = valY(ms / MAX_MS);
      ctx.strokeStyle = AUX;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, PT);
      ctx.lineTo(cx, PB);
      ctx.stroke();

      ctx.fillStyle = OK;
      ctx.beginPath();
      ctx.arc(cx, qy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = EMPH;
      ctx.beginPath();
      ctx.arc(cx, ly, 4, 0, Math.PI * 2);
      ctx.fill();

      // keep the bare values inside the inset even at the left end of the slider
      const right = cx > PL + 60;
      ctx.textAlign = right ? 'right' : 'left';
      const dx = right ? -8 : 8;
      ctx.fillStyle = OK;
      ctx.fillText(q.toFixed(2), cx + dx, qy - 7);
      ctx.fillStyle = EMPH;
      ctx.fillText(ms + ' ms', cx + dx, ly + 17);

      drawSceneLabel(ctx, '板面轮廓', BX, 26);
      drawSceneLabel(ctx, '推理步数', IX + 12, 26);
      drawLegend(
        ctx,
        [
          { color: OK, text: '质量' },
          { color: EMPH, text: '延迟' },
        ],
        IX + 20,
        229
      );
    };

    const tick = () => {
      render(performance.now() - t0);
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.round(Number(e.target.value));
    stateRef.current.steps = v;
    setInferSteps(v);
    setFeedback(v <= 2 ? FB_LOW : v <= 40 ? FB_MID : FB_HIGH);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          推理去噪步数{' '}
          <span className="val">
            {inferSteps} 步 · 约 {latencyOf(inferSteps)} ms
          </span>
        </label>
        <input type="range" min={1} max={100} step={1} value={inferSteps} onChange={onChange} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M51;
