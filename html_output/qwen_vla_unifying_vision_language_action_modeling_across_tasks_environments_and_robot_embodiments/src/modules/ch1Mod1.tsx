import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'old' | 'new'>('old');
  const [fb, setFb] = useState({ text: '先体验旧范式：每种任务/本体各训一个策略。', cls: 'bad' });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    if (mode === 'old') {
      ['操纵', '导航', '人形轨迹'].forEach((t, i) => {
        ctx.fillStyle = C.red;
        ctx.fillRect(40 + i * 170, 50, 140, 130);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText(t + ' 专用', 68 + i * 170, 100);
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText('独立模型', 78 + i * 170, 130);
      });
      ctx.fillStyle = C.red;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('✗ 碎片化：换任务需换模型', 40, 220);
    } else {
      ctx.fillStyle = C.green;
      ctx.fillRect(60, 50, 440, 130);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText('Qwen-VLA 统一动作-轨迹空间', 110, 100);
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('共享 VLM + DiT · 无需 per-embodiment 输出头', 90, 140);
      ctx.fillStyle = C.green;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('✓ 一个 generalist 跨任务族与本体', 40, 220);
    }
  }, [mode]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={mode === 'old' ? 'active' : ''} onClick={() => { setMode('old'); setFb({ text: '论文指出：专用系统难以跨任务、环境、本体迁移。', cls: 'bad' }); }}>旧范式：碎片化</button>
        <button type="button" className={mode === 'new' ? 'active' : ''} onClick={() => { setMode('new'); setFb({ text: 'Qwen-VLA 将操纵、导航、egocentric 轨迹统一为同一预测框架。', cls: 'good' }); }}>Qwen-VLA：统一</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch1Mod1;
