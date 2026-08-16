import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import {
  PAL,
  clearPanel,
  drawInset,
  drawLegend,
  drawSceneLabel,
  rampSteps,
  wrapText,
  setupCrispCanvas,
  useAutoplay,
} from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 300;
const AX0 = 48;
const AX1 = 452;
const AY = 208;
const BH = 104;

const DATA_MU = 0.4;

export const Ch7M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ noiseT: number }>({ noiseT: 0.15 });
  const rafRef = useRef<number | null>(null);
  const [noiseT, setNoiseT] = useState(0.15);
  const [feedback, setFeedback] = useState({
    text: 't = 0.15：两个加噪分布还明显错开，s_real − s_fake 给出的梯度指向数据分布那一侧。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let detachCrisp: () => void;
    try {
      const crisp = setupCrispCanvas(canvas, W, H);
      ctx = crisp.ctx;
      detachCrisp = crisp.detach;
    } catch {
      return;
    }

    const bell = (u: number, mu: number, sd: number) =>
      Math.exp(-((u - mu) * (u - mu)) / (2 * sd * sd));
    const px = (u: number) => AX0 + u * (AX1 - AX0);

    const render = (s: { noiseT: number }) => {
      const t = s.noiseT;
      const studMu = DATA_MU + 0.2 * (1 - t);
      const sd = 0.1 + 0.16 * t;
      const gap = Math.abs(studMu - DATA_MU);
      const aligned = gap <= 0.06;
      const studColor = aligned ? PAL.green : PAL.red;

      clearPanel(ctx, W, H);

      // shared axis
      ctx.strokeStyle = PAL.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(AX0, AY);
      ctx.lineTo(AX1, AY);
      ctx.stroke();

      // overlap fill first
      ctx.fillStyle = 'rgba(34,141,92,0.20)';
      ctx.beginPath();
      ctx.moveTo(px(0), AY);
      for (let i = 0; i <= 90; i++) {
        const u = i / 90;
        const v = Math.min(bell(u, DATA_MU, sd), bell(u, studMu, sd));
        ctx.lineTo(px(u), AY - v * BH);
      }
      ctx.lineTo(px(1), AY);
      ctx.closePath();
      ctx.fill();

      const curve = (mu: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 90; i++) {
          const u = i / 90;
          const y = AY - bell(u, mu, sd) * BH;
          if (i === 0) ctx.moveTo(px(u), y);
          else ctx.lineTo(px(u), y);
        }
        ctx.stroke();
      };
      curve(DATA_MU, PAL.blue);
      curve(studMu, studColor);

      // centre ticks and labels
      ctx.strokeStyle = PAL.blue;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px(DATA_MU), AY);
      ctx.lineTo(px(DATA_MU), AY - BH - 6);
      ctx.stroke();
      ctx.fillStyle = PAL.blue;
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillText('p_data,t', px(DATA_MU) - 22, AY - BH - 12);
      ctx.strokeStyle = studColor;
      ctx.beginPath();
      ctx.moveTo(px(studMu), AY);
      ctx.lineTo(px(studMu), AY - BH - 6);
      ctx.stroke();
      ctx.fillStyle = studColor;
      ctx.fillText('p_θ,t', px(studMu) - 12, AY - BH - 26);

      // the score-difference gradient arrow, student -> data
      const gy = 250;
      const gx0 = px(studMu);
      const gx1 = px(DATA_MU);
      ctx.strokeStyle = PAL.orange;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(gx0, gy);
      ctx.lineTo(gx1, gy);
      ctx.stroke();
      const dir = gx1 < gx0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(gx1, gy);
      ctx.lineTo(gx1 - dir * 8, gy - 5);
      ctx.moveTo(gx1, gy);
      ctx.lineTo(gx1 - dir * 8, gy + 5);
      ctx.stroke();
      ctx.fillStyle = PAL.orange;
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillText('s_real − s_fake', Math.min(gx0, gx1), gy - 10);

      // inset
      drawInset(ctx, 486, 56, 210, 200, '加噪后分布（示意）');
      let ty = 100;
      ctx.fillStyle = PAL.ink;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(`噪声水平 t = ${t.toFixed(2)}`, 500, ty);
      ty += 26;
      ctx.fillStyle = aligned ? PAL.green : PAL.red;
      ctx.fillText(`两分布中心距 ≈ ${gap.toFixed(2)}`, 500, ty);
      ty += 28;
      ctx.fillStyle = PAL.muted;
      wrapText(ctx, 't 越大，两个分布都被同一个高斯抹平，差异随之缩小。', 500, ty, 182, 19);

      drawSceneLabel(ctx, AX0, 36, '两个加噪分布');
      drawLegend(ctx, AX0, 288, [
        { color: PAL.blue, label: '真实数据加噪' },
        { color: PAL.green, label: '学生加噪' },
        { color: PAL.orange, label: '梯度方向' },
      ]);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      detachCrisp();
    };
  }, []);

  const apply = (t: number) => {
    stateRef.current.noiseT = t;
    setNoiseT(t);
    const gap = Math.abs(DATA_MU + 0.2 * (1 - t) - DATA_MU);
    const v = t.toFixed(2);
    if (gap > 0.13) {
      setFeedback({
        text: `t = ${v}：两个加噪分布还明显错开，s_real − s_fake 给出的梯度指向数据分布那一侧。`,
        cls: '',
      });
    } else if (gap > 0.06) {
      setFeedback({ text: `t = ${v}：重叠区在变大，梯度也随之变小。`, cls: '' });
    } else {
      setFeedback({
        text: `t = ${v}：两个加噪分布基本贴合——这正是 DMD 的目标：让学生生成的数据加噪之后的分布，贴近真实数据加噪之后的分布。`,
        cls: 'good',
      });
    }
  };

  // Autoplay raises t so the two noised distributions slide into each other, then
  // stops where they overlap — the state DMD is actually optimizing for.
  const demo = useAutoplay({ steps: rampSteps(0.05, 0.95, 20), intervalMs: 320 }, (t: number) =>
    apply(t)
  );

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    demo.stop();
    apply(Number(e.target.value) / 100);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          加噪程度 t <span className="val">{noiseT.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={5}
          max={95}
          step={1}
          value={Math.round(noiseT * 100)}
          onChange={onChange}
        />
        <button className={demo.btnClass} onClick={demo.toggle}>
          {demo.label}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7M1;
