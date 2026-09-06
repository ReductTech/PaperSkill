import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560; const H = 240;
const STEPS = ['观测 o_t', '指令 x', '本体 e', '预测 y'];

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState({ text: '逐步揭示统一预测：操纵/导航/轨迹只是 y 的不同语义。', cls: '' });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    STEPS.forEach((label, i) => {
      const x = 50 + i * 125;
      ctx.fillStyle = i <= step ? C.green : '#e8ecf0';
      ctx.beginPath(); ctx.arc(x, 100, 32, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = i <= step ? C.green : C.border;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = i <= step ? '#fff' : C.muted;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), x, 106);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(label, x, 158);
    });
    ctx.textAlign = 'left';
    if (step > 0) {
      ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(82, 100);
      for (let i = 1; i <= step; i++) ctx.lineTo(50 + i * 125, 100);
      ctx.stroke();
    }
  }, [step]);

  const next = () => {
    const n = Math.min(step + 1, STEPS.length - 1);
    setStep(n);
    if (n === STEPS.length - 1) setFb({ text: '关键洞察：不同任务共享「视觉 grounding + 语言 + 连续动作/轨迹」。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={() => { setStep(0); setFb({ text: '从现象开始：智能体看到什么、听到什么？', cls: '' }); }}>重置</button>
        <button type="button" onClick={next}>下一步</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch3Mod1;
