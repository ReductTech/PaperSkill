import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

export const Scene1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'specialist' | 'unified'>('specialist');
  const [fb, setFb] = useState({
    text: 'A. Specialist fragmentation：Manipulation / Navigation / 不同 embodiment 往往各自独立模型。',
    cls: 'bad',
  });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    if (mode === 'specialist') {
      const labels = ['Manipulation', 'Navigation', 'Embodiment A/B'];
      labels.forEach((l, i) => {
        const x = 24 + i * 178;
        ctx.fillStyle = C.red;
        ctx.globalAlpha = 0.15;
        ctx.fillRect(x, 40, 160, 120);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.red;
        ctx.strokeRect(x, 40, 160, 120);
        ctx.fillStyle = C.text;
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText(l, x + 12, 68);
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillStyle = C.muted;
        ctx.fillText('独立 checkpoint', x + 12, 92);
        ctx.fillText('换任务/本体 → 换模型', x + 12, 112);
      });
      ctx.fillStyle = C.red;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('× 能力碎片化', 24, 200);
    } else {
      ctx.fillStyle = C.blue;
      ctx.fillRect(40, 50, 480, 100);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText('B. Shared computational structure', 56, 82);
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('visual o_t  +  instruction x  +  embodiment e  (+ optional z)', 56, 108);
      ctx.fillText('→  future action / trajectory y_{t:t+H-1}', 56, 132);
      ctx.fillStyle = C.green;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('p_θ(y | o_t, x, e, z)', 56, 200);
    }
  }, [mode]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" className={mode === 'specialist' ? 'active' : ''} onClick={() => {
          setMode('specialist');
          setFb({ text: 'A. Specialist fragmentation：各任务族/本体往往需要独立模型。', cls: 'bad' });
        }}>A · 专用碎片化</button>
        <button type="button" className={mode === 'unified' ? 'active' : ''} onClick={() => {
          setMode('unified');
          setFb({ text: 'B. 共享条件预测结构 — 视觉 + 语言 + 本体 → 未来动作/轨迹。', cls: 'good' });
        }}>B · 共享结构</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Scene1Mod1;
