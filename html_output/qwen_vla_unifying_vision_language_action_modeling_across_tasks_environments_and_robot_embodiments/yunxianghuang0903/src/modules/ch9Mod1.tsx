import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560; const H = 240;
const MODES = [
  { name: '操纵 ΔEE', channels: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0] },
  { name: '导航 Δx,Δy,Δθ', channels: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0] },
];

export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState(0);
  const [fb, setFb] = useState({ text: '切换控制模式，观察掩码 M 如何屏蔽零填充通道。', cls: '' });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    const ch = MODES[mode].channels;
    const activeCount = ch.filter(Boolean).length;
    ctx.fillStyle = C.text;
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText(`Y ∈ R^{H×K}  ·  ${MODES[mode].name}  ·  c=${activeCount}`, 36, 32);
    ch.forEach((on, i) => {
      ctx.fillStyle = on ? C.green : '#e8ecf0';
      ctx.fillRect(40 + i * 50, 60, 42, 110);
      ctx.strokeStyle = on ? C.green : C.border;
      ctx.strokeRect(40 + i * 50, 60, 42, 110);
      ctx.fillStyle = on ? '#fff' : C.muted;
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`k${i}`, 61 + i * 50, 82);
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText(on ? 'M=1' : 'M=0', 61 + i * 50, 140);
    });
    ctx.textAlign = 'left';
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('前 c 维有效 · 其余 K−c 维零填充且梯度被掩码屏蔽', 36, 210);
  }, [mode]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {MODES.map((m, i) => (
          <button key={m.name} type="button" className={mode === i ? 'active' : ''} onClick={() => {
            setMode(i);
            setFb({ text: '§2.4：各数据集保留原生控制约定，共享 DiT 参数，掩码排除 padding 梯度。', cls: 'good' });
          }}>{m.name}</button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch9Mod1;
