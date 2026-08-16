import React, { useRef, useState } from 'react';
import { clamp } from '../lib/canvasKit';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560; const H = 240;
const STEPS = ['τ=1.0 噪声', 'τ=0.75', 'τ=0.5', 'τ=0.25', 'τ=0 动作块'];

export const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '点击「下一步积分」：模拟欧拉积分从 τ=1 到 τ=0。', cls: '' });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    const noise = clamp(1 - step / (STEPS.length - 1), 0, 1);
    ctx.fillStyle = C.text;
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText(STEPS[step], 40, 36);
    for (let i = 0; i < 36; i++) {
      const x = 40 + i * 14;
      const y = 130 + Math.sin(i * 0.5 + step) * 35 * noise;
      ctx.fillStyle = noise > 0.25 ? `rgba(196,63,82,${0.4 + noise * 0.5})` : C.green;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = C.green; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 36; i++) {
      const x = 40 + i * 14;
      const y = 130 + Math.sin(i * 0.5) * 8 * (1 - noise);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(`噪声强度 ${(noise * 100).toFixed(0)}% → 收敛为连续动作块`, 40, 210);
  }, [step]);

  const next = () => {
    const n = Math.min(step + 1, STEPS.length - 1);
    setStep(n);
    if (n === STEPS.length - 1) setFb({ text: '低延迟实时控制：DiT 经少量欧拉步生成连续动作块。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => { setStep(0); setFb({ text: '从纯噪声 τ=1 出发。', cls: '' }); }}>重置</button>
        <button type="button" onClick={next}>下一步积分</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch6Mod1;
