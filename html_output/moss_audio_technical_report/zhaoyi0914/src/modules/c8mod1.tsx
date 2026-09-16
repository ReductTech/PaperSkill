import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeInOutQuad } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch9.2 — staged post-training (P2 step-through) with DAPO reward evidence.
// Stages: SFT -> reasoning cold start -> DAPO RL (paper §5). The reward curve
// uses the paper's reported rollout raw reward (~0.69 -> >0.82, max 0.847).
const W = 1080;
const H = 280;
const STAGES = ['监督微调 SFT', '推理冷启动', 'DAPO 强化学习'];
const MAX_STEP = 3;

export const C8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '逐步前进，观察后训练的三个阶段如何依次推进。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (k: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // stage boxes
      STAGES.forEach((s, i) => {
        const y = 50 + i * 66;
        const on = i + 1 === k;
        const done = i + 1 < k;
        ctx.fillStyle = on ? '#27446e' : done ? '#228d5c' : '#d7deea';
        ctx.fillRect(70, y, 250, 46);
        ctx.fillStyle = on || done ? '#ffffff' : '#21324a';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText(s, 95, y + 29);
      });
      ctx.fillStyle = '#21324a';
      ctx.fillText('后训练阶段', 70, 36);

      // reward curve region (DAPO)
      const rx0 = 420;
      const rx1 = W - 60;
      const ry0 = 60;
      const ry1 = 230;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx0, ry0, rx1 - rx0, ry1 - ry0);
      ctx.fillStyle = '#68778f';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('0.85', rx0 - 40, ry0 + 6);
      ctx.fillText('0.65', rx0 - 40, ry1);
      ctx.fillText('DAPO rollout 奖励', rx0, ry0 - 8);

      const valToY = (v: number) => ry1 - ((v - 0.65) / 0.2) * (ry1 - ry0);
      // reveal the curve only when DAPO is reached
      const reveal = k >= 3 ? 1 : 0;
      const t = easeInOutQuad(reveal);
      if (reveal > 0) {
        ctx.strokeStyle = '#228d5c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const N = 60;
        for (let i = 0; i <= N * t; i++) {
          const frac = i / N;
          const v = 0.69 + (0.82 - 0.69) * frac;
          const x = rx0 + frac * (rx1 - rx0);
          ctx.lineTo(x, valToY(v));
        }
        ctx.stroke();
        // start and end markers
        ctx.fillStyle = '#f07e47';
        ctx.beginPath();
        ctx.arc(rx0, valToY(0.69), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#228d5c';
        ctx.beginPath();
        ctx.arc(rx1, valToY(0.82), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#21324a';
        ctx.fillText('0.69', rx0 + 4, valToY(0.69) - 8);
        ctx.fillText('0.82', rx1 - 34, valToY(0.82) - 8);
      } else {
        ctx.fillStyle = '#b8c9a7';
        ctx.fillText('到达 DAPO 阶段后显示奖励曲线', rx0 + 40, (ry0 + ry1) / 2);
      }
    };
    const tick = () => {
      render(stateRef.current.step);
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
    };
  }, []);

  const go = (d: number) => {
    const s = Math.max(0, Math.min(MAX_STEP, step + d));
    stateRef.current.step = s;
    setStep(s);
    const msg = [
      '逐步前进，观察后训练的三个阶段如何依次推进。',
      '监督微调：适配指令格式与多样化音频任务。',
      '推理冷启动：用音频与文本推理数据初始化思维模式。',
      'DAPO 强化学习：在线采样 + 奖励优化，rollout 奖励从约 0.69 升到 0.82。',
    ][s];
    setFb({ text: msg, cls: s === 3 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => go(1)} disabled={step === MAX_STEP}>
          下一步
        </button>
        <button type="button" onClick={() => go(-step)} disabled={step === 0}>
          重置
        </button>
        <span className="val">第 {step} 步 / {MAX_STEP}</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C8Mod1;
