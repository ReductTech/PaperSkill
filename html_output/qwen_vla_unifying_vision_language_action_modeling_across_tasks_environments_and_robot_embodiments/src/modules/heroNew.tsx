import React, { useRef, useState } from 'react';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 520;
const H = 200;
const EMB = [
  { label: 'WidowX 单臂', dims: 'Δxyz + 旋转 + 夹爪', color: C.blue },
  { label: 'ALOHA 双臂', dims: '双 6-DoF 关节 + 夹爪', color: C.green },
  { label: 'VLN 移动基座', dims: '(Δx, Δy, Δθ) 航点', color: C.orange },
];

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [emb, setEmb] = useState(0);
  const [fb, setFb] = useState({ text: '切换本体提示，同一 Qwen-VLA 输出不同控制语义。', cls: 'good' });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    const e = EMB[emb];
    ctx.fillStyle = C.blue;
    ctx.fillRect(16, 16, 488, 44);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillText('Qwen3.5-4B VLM  +  1.15B DiT 流匹配动作解码器', 28, 44);
    ctx.fillStyle = e.color;
    ctx.fillRect(16, 72, 488, 72);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText(`本体提示：${e.label}`, 28, 100);
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(`动作通道：${e.dims}`, 28, 124);
    for (let k = 0; k < 12; k++) {
      ctx.fillStyle = k < (emb === 2 ? 3 : emb === 1 ? 8 : 5) ? C.green : C.border;
      ctx.fillRect(28 + k * 38, 158, 32, 28);
    }
    ctx.fillStyle = C.text;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('共享 DiT 参数 · 无需 per-embodiment 输出头', 28, H - 8);
  }, [emb]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {EMB.map((e, i) => (
          <button key={e.label} type="button" className={emb === i ? 'active' : ''} onClick={() => {
            setEmb(i);
            setFb({ text: `通过 embodiment-aware 文本提示指定「${e.label}」，无需更换模型结构。`, cls: 'good' });
          }}>{e.label}</button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default HeroNew;
