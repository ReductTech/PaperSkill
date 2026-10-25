import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 第6章 模块2：掩码解码器分步（嵌入 → 双向注意力 → 动态掩码头 → 掩码+分数）
const W = 1080;
const H = 300;
const STAGES = ['图像+提示嵌入', '输出 token', '双向注意力', '动态掩码头', '掩码 + 分数'];

const STEP_FB = [
  { text: '输入：图像嵌入 + 提示嵌入 + 输出 token。', cls: '' },
  { text: '引入可学习的输出 token，汇聚目标信息。', cls: '' },
  { text: 'Transformer 解码块做提示-图像双向往返注意力。', cls: 'good' },
  { text: '上采样图像嵌入，MLP 映射输出 token 为动态分类器。', cls: '' },
  { text: '逐位置算前景概率 → 掩码，并给出置信度分数。', cls: 'good' },
];

export const Ch6Decoder: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { step: number }) => {
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createLinearGradient(40, 20, W - 40, H - 20);
      bgGrad.addColorStop(0, '#f8fbf4');
      bgGrad.addColorStop(1, '#eef3fb');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(40, 30, W - 80, H - 80);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 30, W - 80, H - 80);
      const n = STAGES.length;
      const bw = (W - 160) / n;
      const y = 90;
      for (let i = 0; i < n; i++) {
        const x = 70 + i * bw;
        const active = i <= s.step;
        ctx.fillStyle = active ? '#27446e' : '#eef3fb';
        ctx.strokeStyle = active ? '#27446e' : '#d7deea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, bw - 22, 70, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        const label = STAGES[i];
        if (label.length <= 4) ctx.fillText(label, x + (bw - 22) / 2, y + 40);
        else {
          ctx.fillText(label.slice(0, 4), x + (bw - 22) / 2, y + 30);
          ctx.fillText(label.slice(4), x + (bw - 22) / 2, y + 52);
        }
        ctx.textAlign = 'left';
        if (i < n - 1) {
          ctx.fillStyle = i <= s.step ? '#f07e47' : '#d7deea';
          ctx.beginPath();
          ctx.moveTo(x + bw - 14, y + 35);
          ctx.lineTo(x + bw - 4, y + 35);
          ctx.lineTo(x + bw - 10, y + 28);
          ctx.lineTo(x + bw - 10, y + 42);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.fillStyle = '#21324a';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText('掩码解码器：轻量、实时（~50ms）', 260, 60);
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
    };
  }, []);

  const stepTo = (v: number) => {
    const n = Math.max(0, Math.min(STAGES.length - 1, v));
    stateRef.current.step = n;
    setStep(n);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="btn" onClick={() => stepTo(step - 1)} disabled={step === 0}>
          ← 上一步
        </button>
        <span className="val">
          步骤 {step + 1} / {STAGES.length}
        </span>
        <button
          className="btn on"
          onClick={() => stepTo(step + 1)}
          disabled={step === STAGES.length - 1}
        >
          下一步 →
        </button>
      </div>
      <div className={`feedback ${STEP_FB[step].cls}`}>{STEP_FB[step].text}</div>
    </div>
  );
};

export default Ch6Decoder;
