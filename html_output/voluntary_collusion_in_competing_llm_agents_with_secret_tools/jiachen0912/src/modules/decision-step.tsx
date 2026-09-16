import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P2 step-through — walk the voluntary decision chain: accept/refuse -> partner -> invite -> response.
const W = 1080;
const H = 280;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#f07e47';
const TEXT = '#21324a';

const nodes = [
  { label: '准备', color: BLUE },
  { label: '接受 / 拒绝', color: GREEN },
  { label: '选定同伙', color: ORANGE },
  { label: '发出邀请', color: BLUE },
  { label: '对方回应', color: BLUE },
];

export const DecisionStep: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      const n = nodes.length;
      const y = H * 0.4;
      for (let i = 0; i < n; i++) {
        const x = W * 0.12 + (i * W * 0.76) / (n - 1);
        if (i < n - 1) {
          ctx.strokeStyle = '#d7deea';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + W * 0.76 / (n - 1), y);
          ctx.stroke();
        }
        const active = i <= s;
        ctx.beginPath();
        ctx.arc(x, y, active ? 16 : 11, 0, Math.PI * 2);
        ctx.fillStyle = active ? nodes[i].color : '#e5e9f0';
        ctx.fill();
        if (i === s) {
          ctx.strokeStyle = nodes[i].color;
          ctx.lineWidth = 4;
          ctx.stroke();
        }
        ctx.textAlign = 'center';
        ctx.fillStyle = TEXT;
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText(String(i + 1), x, y + 5);
        ctx.textAlign = 'left';
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = nodes[s].color;
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(nodes[s].label, W / 2, H * 0.76);
      ctx.textAlign = 'left';
    };
    let rafId = 0;
    const tick = () => {
      render(stepRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafId = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    const start = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    start();
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (v: number) => {
    const n = Math.max(0, Math.min(v, nodes.length - 1));
    stepRef.current = n;
    setStep(n);
  };

  const msg = [
    '点击“下一步”，走一遍自愿决策链。',
    '第一步：接受还是拒绝？多数模型选择接受（Claude/Qwen 在 V0 拒绝）。',
    '第二步：选定一名同伙——模型有稳定偏好（如 LLaMA 互相选择）。',
    '第三步：向同伙发出秘密结盟邀请。',
    '第四步：对方回应——接受则合谋成立，拒绝则落空。',
  ][step];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#228d5c' }} />绿＝接受</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#f07e47' }} />橙＝选定同伙</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#27446e' }} />蓝＝邀请/回应</span>
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(0)} disabled={step === 0}>重置</button>
        <button className="tiny ghost" onClick={() => go(step - 1)} disabled={step === 0}>上一步</button>
        <span className="step-label">
          <b>{step + 1}</b> / {nodes.length}
        </span>
        <button className="tiny" onClick={() => go(step + 1)} disabled={step === nodes.length - 1}>下一步</button>
      </div>
      <div className={`feedback ${step === nodes.length - 1 ? 'good' : ''}`}>{msg}</div>
    </div>
  );
};

export default DecisionStep;
