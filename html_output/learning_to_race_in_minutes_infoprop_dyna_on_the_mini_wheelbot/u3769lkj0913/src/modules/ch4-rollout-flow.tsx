import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

// Module 4.2: step through a chained imagined rollout — real data → prediction →
// prediction → ... Each next step feeds the previous prediction back in.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'Model-based rollouts aim to substitute environment interaction in MBRL.',
    zh: '模型 rollout 的目标是<b>替代真实环境交互</b>——想象链越长，省下的真实试错越多。',
    locator: '先前工作 [8] §2.4',
    highlights: ['substitute environment interaction'],
  },
  {
    en: 'using it to augment real experience with imagined rollouts',
    zh: '用<b>想象 rollout</b> 补充真实经验：先走一步真实数据，然后交给模型连续预测。',
    locator: '§I · p.1',
    highlights: ['imagined rollouts'],
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

const MAX_STEPS = 6;

function chainPoint(i: number) {
  const u = i / MAX_STEPS;
  const x = 100 + u * 680;
  const y = 200 - Math.pow(u, 1.25) * 78;
  return { x, y };
}

export const Ch4RolloutFlow: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '点击「下一步」：从一条真实数据出发，让模型一步步预测未来。',
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
      const s = stateRef.current.step;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // top flow strip: real data -> prediction -> prediction -> ...
      const labels = ['真实数据', '预测', '预测', '预测', '预测', '预测', '预测'];
      const bw = 118;
      const gap = 18;
      const x0 = (W - (labels.length * bw + (labels.length - 1) * gap)) / 2;
      labels.forEach((label, i) => {
        const bx = x0 + i * (bw + gap);
        const active = i === s;
        const isReal = i === 0;
        const revealed = i <= s;
        ctx.fillStyle = revealed ? '#ffffff' : '#f0f3f8';
        ctx.strokeStyle = active ? C.blue : revealed ? (isReal ? C.green : C.blue) : C.border;
        ctx.lineWidth = active ? 3 : 1.5;
        rr(ctx, bx, 22, bw, 40, 9);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? C.blue : revealed ? (isReal ? C.green : C.blue) : C.muted;
        ctx.font = (active ? 'bold ' : '') + '14px "Segoe UI", sans-serif';
        const tw = ctx.measureText(label).width;
        ctx.fillText(label, bx + (bw - tw) / 2, 47);
        if (i < labels.length - 1) {
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx + bw + 3, 42);
          ctx.lineTo(bx + bw + gap - 3, 42);
          ctx.stroke();
        }
      });

      // chain of points
      for (let i = 0; i <= MAX_STEPS; i++) {
        const p = chainPoint(i);
        if (i > s) {
          // beyond current step: faint dashed guide of the next hop only
          if (i === s + 1) {
            ctx.strokeStyle = C.border;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 5]);
            const prev = chainPoint(s);
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          continue;
        }
        if (i > 0) {
          const prev = chainPoint(i - 1);
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        ctx.fillStyle = i === 0 ? C.green : C.blue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, i === s ? 8 : 5.5, 0, Math.PI * 2);
        ctx.fill();
        if (i === s) {
          ctx.strokeStyle = i === 0 ? C.green : C.blue;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // caption under the chain
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('起点：一条真实采集的转移（绿）', 80, 236);
      ctx.fillText('之后每一步都是模型预测（蓝）', 560, 236);
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

  const go = () => {
    const s = stateRef.current;
    if (s.step >= MAX_STEPS) return;
    s.step += 1;
    setStep(s.step);
    if (s.step >= MAX_STEPS) {
      setFeedback({
        text: '这就是 imagined rollout：模型「想象」出的 6 步未来轨迹——不花真实数据就能练习。',
        cls: 'good',
      });
    } else {
      setFeedback({
        text: '第 ' + s.step + ' 步：把上一步的预测当作输入，模型继续预测下一步（链式预测）。',
        cls: '',
      });
    }
  };

  const reset = () => {
    stateRef.current.step = 0;
    setStep(0);
    setFeedback({ text: '重置完成：再从真实数据出发，一步步展开想象。', cls: '' });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="step-ctrl">
          <button onClick={go} disabled={step >= MAX_STEPS}>
            下一步
          </button>
          <span className="feedback" style={{ marginTop: 0, minHeight: 0 }}>
            第 {step} / {MAX_STEPS} 步预测
          </span>
          <button onClick={reset} disabled={step === 0}>
            重置
          </button>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch4RolloutFlow;
