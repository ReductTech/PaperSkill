import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// P2 step-through — follow Claude (refuse) or GPT-4.1 (accept) reasoning trace.
// moduleId "3.1" = Claude, "3.2" = GPT-4.1.
const W = 1080;
const H = 280;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const MUTED = '#68778f';
const TEXT = '#21324a';

type Step = { label: string; color: string };

const claude: Step[] = [
  { label: '准备', color: BLUE },
  { label: '识别：不公平优势', color: BLUE },
  { label: '权衡：公正 vs 获胜', color: BLUE },
  { label: '引用原则/愿意输', color: GREEN },
  { label: '决定：拒绝', color: GREEN },
];
const gpt: Step[] = [
  { label: '准备', color: BLUE },
  { label: '识别：不公平优势', color: BLUE },
  { label: '权衡：获胜/生存', color: BLUE },
  { label: '以获胜为目标', color: RED },
  { label: '决定：接受', color: RED },
];

export const TraceStep: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const steps = moduleId === '3.2' ? gpt : claude;
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
      const n = steps.length;
      const y = H * 0.42;
      for (let i = 0; i < n; i++) {
        const x = W * 0.12 + (i * W * 0.76) / (n - 1);
        ctx.strokeStyle = i < n - 1 ? '#d7deea' : 'transparent';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + W * 0.76 / (n - 1), y);
        ctx.stroke();
        const active = i <= s;
        ctx.beginPath();
        ctx.arc(x, y, active ? 16 : 11, 0, Math.PI * 2);
        ctx.fillStyle = active ? steps[i].color : '#e5e9f0';
        ctx.fill();
        if (i === s) {
          ctx.strokeStyle = steps[i].color;
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
      ctx.fillStyle = steps[s].color;
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(steps[s].label, W / 2, H * 0.78);
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
  }, [steps]);

  const go = (next: number) => {
    const v = Math.max(0, Math.min(next, steps.length - 1));
    stepRef.current = v;
    setStep(v);
  };

  const cls = step === steps.length - 1 ? (moduleId === '3.2' ? 'bad' : 'good') : '';
  const msg =
    step === steps.length - 1
      ? moduleId === '3.2'
        ? 'GPT-4.1 同样识别“不公平”，却以获胜为由接受——差距在权衡，不在识别。'
        : 'Claude 同样识别“不公平”，却以原则为由拒绝——原则优先。'
      : `第 ${step + 1}/${steps.length} 步：${steps[step].label}（点击“下一步”继续）`;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#27446e' }} />蓝色＝推理步骤</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#228d5c' }} />绿色＝结局「拒绝」</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#c43f52' }} />红色＝结局「接受」</span>
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(0)} disabled={step === 0}>重置</button>
        <button className="tiny ghost" onClick={() => go(step - 1)} disabled={step === 0}>上一步</button>
        <span className="step-label">
          <b>{step + 1}</b> / {steps.length}
        </span>
        <button className="tiny" onClick={() => go(step + 1)} disabled={step === steps.length - 1}>下一步</button>
      </div>
      <div className={`feedback ${cls}`}>{msg}</div>
    </div>
  );
};

export default TraceStep;
