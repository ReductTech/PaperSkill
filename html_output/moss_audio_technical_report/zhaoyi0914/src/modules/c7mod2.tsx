import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch7.2 — two-stage pretraining (P2 step-through, paper §4).
// Stage 1: only the adapter + DeepStack are trained (encoder & LM stay stable,
// no text-only data). Stage 2: the full model is trained end to end with the
// complete mixture including text-only data.
const W = 1080;
const H = 280;
const MAX_STEP = 2;
const STAGE = ['第一阶段', '第二阶段'];

export const C7Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '点击下一步，比较预训练两个阶段分别训练哪些模块。', cls: '' });

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

      const trainAll = k === 2;
      const comps = [
        { x: 60, w: 220, label: '音频编码器', on: trainAll },
        { x: 330, w: 240, label: '适配器 + DeepStack', on: k >= 1 },
        { x: 620, w: 200, label: '语言模型', on: trainAll },
      ];
      comps.forEach((c) => {
        ctx.fillStyle = c.on ? '#27446e' : '#d7deea';
        ctx.fillRect(c.x, 100, c.w, 60);
        ctx.fillStyle = c.on ? '#ffffff' : '#68778f';
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillText(c.label, c.x + 14, 136);
      });
      // arrows
      ctx.strokeStyle = '#21324a';
      ctx.lineWidth = 2;
      [280, 570].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 130);
        ctx.lineTo(x + 45, 130);
        ctx.stroke();
      });
      // legend
      ctx.fillStyle = '#27446e';
      ctx.fillRect(850, 104, 16, 16);
      ctx.fillStyle = '#21324a';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('训练', 872, 117);
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(850, 130, 16, 16);
      ctx.fillStyle = '#21324a';
      ctx.fillText('冻结', 872, 143);

      // data mixture
      const data = [
        { label: 'ASR 相关', on: k >= 1 },
        { label: '音频描述', on: k >= 1 },
        { label: '纯文本', on: trainAll },
      ];
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('训练数据', 60, 205);
      data.forEach((d, i) => {
        const x = 160 + i * 150;
        ctx.fillStyle = d.on ? '#228d5c' : '#d7deea';
        ctx.fillRect(x, 188, 130, 34);
        ctx.fillStyle = d.on ? '#ffffff' : '#68778f';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText(d.label + (d.on ? ' ✓' : ' ✗'), x + 16, 210);
      });

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(k === 0 ? '选择阶段查看' : STAGE[k - 1] + (k === 1 ? '：只训适配器与 DeepStack' : '：全参数端到端'), 60, 60);
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
    const msgs = [
      '点击下一步，比较预训练两个阶段分别训练哪些模块。',
      '第一阶段：只训练适配器与 DeepStack 注入模块，编码器与语言模型保持稳定；不含纯文本数据。',
      '第二阶段：全模型端到端联合更新，并启用纯文本数据。',
    ];
    setFb({ text: msgs[s], cls: s === 2 ? 'good' : '' });
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
        <span className="val">
          {step === 0 ? '未开始' : STAGE[step - 1]} · 第 {step} 步 / {MAX_STEP}
        </span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default C7Mod2;
