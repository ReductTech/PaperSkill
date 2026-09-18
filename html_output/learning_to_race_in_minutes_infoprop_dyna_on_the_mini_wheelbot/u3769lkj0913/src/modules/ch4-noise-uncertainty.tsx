import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'Treating the model predictions as noisy observations of a ground truth signal, Infoprop Dyna leverages information theory to recover the estimated ground truth signal, while simultaneously keeping track of the accumulated corruption due to noise.',
    zh: '把模型预测视为<b>真实信号的带噪观测</b>，用信息论<b>还原真实信号估计</b>，同时<b>跟踪噪声造成的累积污染</b>。',
    locator: '§I · p.1',
    highlights: [
      'noisy observations',
      'recover the estimated ground truth signal',
      'accumulated corruption due to noise',
    ],
  },
];

// Module 4.1: noise slider drives both a foggy visor (life side) and the technical
// signal view: gray observations scatter, red corruption band widens, green
// Infoprop estimate keeps tracking the blue true signal.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function flag(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 20);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x + 14, y - 14);
  ctx.lineTo(x, y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// deterministic pseudo-noise
const jitter = (i: number, seed: number) => Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453 % 1;

export const Ch4NoiseUncertainty: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ noise: 0.4 });
  const [noise, setNoise] = useState(0.4);
  const [feedback, setFeedback] = useState({ text: '拖动滑块：噪声越大，观测越散、污染带越宽。', cls: '' });

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

    const render = (time: number) => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // Left: visor with fog amount driven by noise
      const vx = 30;
      const vy = 40;
      const vw = 360;
      const vh = 200;
      ctx.fillStyle = '#e9eef5';
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 3;
      rr(ctx, vx, vy, vw, vh, 34);
      ctx.fill();
      ctx.stroke();
      flag(ctx, vx + 200, vy + 160, C.green);
      ctx.save();
      ctx.beginPath();
      rr(ctx, vx + 4, vy + 4, vw - 8, vh - 8, 30);
      ctx.clip();
      ctx.fillStyle = `rgba(214,222,234,${0.15 + 0.75 * s.noise})`;
      ctx.fillRect(vx, vy, vw, vh);
      ctx.restore();

      // Right: signal view
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 440, 26, 616, 228, 8);
      ctx.fill();
      ctx.stroke();
      const x0 = 480;
      const x1 = 1020;
      const yMid = 150;
      // axes
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, yMid + 70);
      ctx.lineTo(x1, yMid + 70);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('想象步数', x1 - 70, yMid + 90);
      ctx.fillText('信号', x0 - 34, 60);

      // true signal (blue): gentle curve
      const truth = (u: number) => yMid - 26 * Math.sin(u * Math.PI * 1.6);
      // corruption band (red translucent) width grows with noise and step
      ctx.fillStyle = 'rgba(196,63,82,0.16)';
      ctx.beginPath();
      ctx.moveTo(x0, truth(0));
      for (let i = 0; i <= 60; i++) {
        const u = i / 60;
        ctx.lineTo(x0 + (x1 - x0) * u, truth(u) - (2 + 30 * s.noise * u));
      }
      for (let i = 60; i >= 0; i--) {
        const u = i / 60;
        ctx.lineTo(x0 + (x1 - x0) * u, truth(u) + (2 + 30 * s.noise * u));
      }
      ctx.closePath();
      ctx.fill();
      // observations (gray dots)
      ctx.fillStyle = C.muted;
      for (let i = 0; i <= 30; i++) {
        const u = i / 30;
        const px = x0 + (x1 - x0) * u;
        const j = jitter(i, 1) * 2 - 1;
        const py = truth(u) + j * 26 * s.noise + Math.sin(time * 1.2 + i) * 1.2;
        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // true line (blue)
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const u = i / 60;
        const px = x0 + (x1 - x0) * u;
        if (i === 0) ctx.moveTo(px, truth(u));
        else ctx.lineTo(px, truth(u));
      }
      ctx.stroke();
      // estimate (green) stays close to truth
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const u = i / 60;
        const px = x0 + (x1 - x0) * u;
        const py = truth(u) + 4 * Math.sin(u * 6) * Math.min(1, s.noise + 0.2);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const tick = (now: number) => {
      render(now / 1000);
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
    stateRef.current.noise = v;
    setNoise(v);
    if (v < 0.3) setFeedback({ text: '噪声小：观测接近真值，模型预测可信。', cls: '' });
    else if (v <= 0.7)
      setFeedback({ text: '噪声增大：预测逐渐不可信——Infoprop 仍能还原真值并跟踪累积污染。', cls: '' });
    else
      setFeedback({
        text: '噪声很大：普通模型会被带偏；显式的不确定跟踪让 Infoprop 不至于过度自信。',
        cls: 'bad',
      });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="ctrl">
          <label>
            噪声强度 <span className="val">{Math.round(noise * 100)}%</span>
          </label>
          <input type="range" min={0} max={100} value={Math.round(noise * 100)} onChange={onChange} />
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch4NoiseUncertainty;
