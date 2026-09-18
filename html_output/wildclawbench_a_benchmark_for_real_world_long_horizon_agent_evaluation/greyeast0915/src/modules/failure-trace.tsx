import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { drawHikerSprite, drawMountainSprite, onClimbSpritesReady } from './climb-sprites';

const W = 1080;
const H = 320;
const steps = ['计划', '工具调用', '调试循环', '时间耗尽', '产物验收'] as const;

export const FailureTrace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
      drawMountainSprite(ctx, 0, 28, 410, 256, 0.24);
      const climberY = 248 - step * 38;
      ctx.fillStyle = step >= 2 ? 'rgba(196,63,82,.14)' : 'rgba(39,68,110,.12)';
      ctx.beginPath(); ctx.arc(205, climberY + 2, 48, 0, Math.PI * 2); ctx.fill();
      drawHikerSprite(ctx, 205, climberY + 54, 78, 98);
      ctx.fillStyle = '#228d5c'; ctx.beginPath(); ctx.arc(292, 58, 15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#21324a'; ctx.font = '700 21px "Segoe UI", sans-serif'; ctx.fillText('失败轨迹', 470, 48);
      const startX = 470; const gap = 118;
      steps.forEach((label, i) => {
        const x = startX + i * gap;
        ctx.strokeStyle = i <= step ? '#27446e' : '#d7deea'; ctx.lineWidth = 4;
        if (i < steps.length - 1) { ctx.beginPath(); ctx.moveTo(x + 18, 110); ctx.lineTo(x + gap - 18, 110); ctx.stroke(); }
        ctx.fillStyle = i < step ? '#228d5c' : i === step ? (step >= 2 ? '#c43f52' : '#27446e') : '#d7deea';
        ctx.beginPath(); ctx.arc(x, 110, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#21324a'; ctx.font = '15px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x, 150);
      });
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff'; ctx.fillRect(470, 186, 544, 94);
      ctx.strokeStyle = '#d7deea'; ctx.strokeRect(470, 186, 544, 94);
      ctx.fillStyle = '#68778f'; ctx.font = '16px "Segoe UI", sans-serif'; ctx.fillText('论文抽检', 494, 216);
      ctx.fillStyle = '#21324a'; ctx.font = '700 30px "Segoe UI", sans-serif'; ctx.fillText('300 条轨迹', 494, 256);
      ctx.fillStyle = '#c43f52'; ctx.fillText('169 条低于 0.5', 728, 256);
      canvas.classList.add('is-ready');
    };
    render();
    const removeSpriteListener = onClimbSpritesReady(render);
    return removeSpriteListener;
  }, [step]);

  const feedback = [
    '先检查计划是否把任务拆成可验证的动作。',
    '工具链故障会中断原本正确的计划。',
    '反复调试会消耗预算，并把局部错误放大。',
    '工具故障与时间压力经常共同出现。',
    '最危险的结果不是空白，而是看起来合理却错误或不完整。',
  ][step];

  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
    <div className="chip-row" aria-label="失败轨迹步骤">
      {steps.map((label, i) => <button key={label} className={`chip ${i === step ? 'active' : ''}`} aria-pressed={i === step} onClick={() => setStep(i)}>{i + 1}. {label}</button>)}
    </div>
    <div className={`feedback ${step >= 2 ? 'bad' : ''}`}>{feedback}</div>
  </div>;
};

export default FailureTrace;
