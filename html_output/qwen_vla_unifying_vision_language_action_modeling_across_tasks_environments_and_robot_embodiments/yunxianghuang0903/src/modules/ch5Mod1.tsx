import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560; const H = 240;
const PROMPTS = [
  { label: 'WidowX 单臂', dims: 7, fps: '10Hz', text: 'single arm · chunk=16' },
  { label: 'ALOHA 双臂', dims: 14, fps: '50Hz', text: 'dual arms · chunk=16' },
  { label: 'VLN 航点', dims: 3, fps: 'nav', text: '(Δx,Δy,Δθ) waypoints' },
];

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState({ text: '选择本体提示，观察有效动作通道数 c 如何变化。', cls: 'good' });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    const p = PROMPTS[idx];
    ctx.fillStyle = C.blue;
    ctx.fillRect(30, 24, 500, 44);
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(`Embodiment prompt: ${p.label} · ${p.text} · ${p.fps}`, 44, 52);
    for (let k = 0; k < 16; k++) {
      const active = k < p.dims;
      ctx.fillStyle = active ? C.green : C.border;
      ctx.fillRect(36 + k * 32, 90, 26, 100);
      if (!active) {
        ctx.fillStyle = C.muted;
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('M=0', 49 + k * 32, 145);
      }
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = C.text;
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(`有效通道 c=${p.dims}，其余 K−c 维零填充 + 掩码屏蔽`, 36, 210);
  }, [idx]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {PROMPTS.map((p, i) => (
          <button key={p.label} type="button" className={idx === i ? 'active' : ''} onClick={() => {
            setIdx(i);
            setFb({ text: '§2.3：文本描述平台、臂型、FPS 与 chunk_size，无需 per-embodiment 输出头。', cls: 'good' });
          }}>{p.label}</button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch5Mod1;
