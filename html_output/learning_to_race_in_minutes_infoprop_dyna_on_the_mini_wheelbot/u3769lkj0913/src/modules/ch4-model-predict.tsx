import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

// Module 4.1: from real data to a predictive model. Gray dots are collected real
// transitions; the blue model curve approaches the green true curve as data grows.
// This is a data-driven predictive model — not a physics simulator.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'Model-based reinforcement learning (MBRL) addresses this limitation by learning a model of the system dynamics and using it to augment real experience with imagined rollouts [5], [6], [7].',
    zh: 'MBRL 通过<b>学习系统动力学的模型</b>、并用它生成<b>想象 rollout</b> 来补充真实经验。',
    locator: '§I · p.1',
    highlights: ['learning a model of the system dynamics', 'imagined rollouts'],
  },
  {
    en: 'we only learn a transition model of the Wheelbot’s physics state.',
    zh: '论文只学习车身物理状态的<b>转移模型</b>——它是从真实数据中学出来的预测模型，不是物理仿真。',
    locator: '§III · p.2',
    highlights: ['only learn a transition model'],
  },
];

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const GX = 60;
const GY = 40;
const GW = 720;
const GH = 190;
const MID = GY + GH / 2;

const trueCurve = (u: number) => MID - 38 * Math.sin(u * 3.1 + 0.6) - 14 * Math.sin(u * 6.3);
const jitter = (i: number) => Math.sin(i * 37.7) * 6;

export const Ch4ModelPredict: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ progress: 0.15 });
  const [progress, setProgress] = useState(0.15);
  const [feedback, setFeedback] = useState({
    text: '拖动滑块增加真实数据量，观察模型预测（蓝）如何逐步贴合真实（绿）。',
    cls: '',
  });

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

    const render = () => {
      const p = stateRef.current.progress;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // chart panel
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, GX - 16, GY - 20, GW + 32, GH + 62, 8);
      ctx.fill();
      ctx.stroke();

      const xAt = (u: number) => GX + u * GW;
      const errAmp = 95 * Math.pow(1 - p, 1.35);
      const modelCurve = (u: number) => trueCurve(u) + errAmp * Math.sin(u * 2.7 + 1.4);

      // error shading between model and truth
      ctx.fillStyle = 'rgba(196,63,82,0.10)';
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        const x = xAt(u);
        if (i === 0) ctx.moveTo(x, trueCurve(u));
        else ctx.lineTo(x, trueCurve(u));
      }
      for (let i = 80; i >= 0; i--) {
        const u = i / 80;
        ctx.lineTo(xAt(u), modelCurve(u));
      }
      ctx.closePath();
      ctx.fill();

      // data points (real transitions collected so far)
      const n = Math.round(4 + p * 46);
      ctx.fillStyle = C.muted;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / 50;
        const x = xAt(u) + jitter(i) * 0.8;
        const y = trueCurve(u) + jitter(i);
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // true curve (green)
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        if (i === 0) ctx.moveTo(xAt(u), trueCurve(u));
        else ctx.lineTo(xAt(u), trueCurve(u));
      }
      ctx.stroke();

      // model prediction (blue)
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        if (i === 0) ctx.moveTo(xAt(u), modelCurve(u));
        else ctx.lineTo(xAt(u), modelCurve(u));
      }
      ctx.stroke();

      // labels
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillStyle = C.green;
      ctx.fillText('真实', GX + GW - 100, GY - 4);
      ctx.fillStyle = C.blue;
      ctx.fillText('模型预测', GX + GW - 100, GY + 14);
      ctx.fillStyle = C.muted;
      ctx.fillText('数据量 ' + n + ' 条真实转移', GX, GY + GH + 30);
      ctx.fillText('「状态 / 场景」', GX + GW - 130, GY + GH + 30);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.progress = v;
    setProgress(v);
    if (v < 0.3)
      setFeedback({ text: '数据少：模型预测（蓝）明显偏离真实（绿）——预测还不够可信。', cls: 'bad' });
    else if (v <= 0.75)
      setFeedback({
        text: '数据增多：预测逐步贴合。注意：这不是物理仿真，而是从真实数据里学出的预测模型。',
        cls: '',
      });
    else setFeedback({ text: '数据充足：预测已贴合真实。接下来用它「想象」未来的每一步。', cls: 'good' });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="ctrl">
          <label>
            数据量 / 训练进度 <span className="val">{Math.round(progress * 100)}%</span>
          </label>
          <input type="range" min={0} max={100} value={Math.round(progress * 100)} onChange={onChange} />
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch4ModelPredict;
