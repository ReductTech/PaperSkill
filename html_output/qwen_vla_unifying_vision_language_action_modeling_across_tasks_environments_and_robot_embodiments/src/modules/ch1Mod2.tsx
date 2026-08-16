import React, { useRef, useState } from 'react';
import { clamp } from '../lib/canvasKit';
import { C, fillBg } from './sharedDraw';
import { usePaperCanvas } from './usePaperCanvas';
import type { WidgetProps } from './registry';

const W = 560;
const H = 240;

export const Ch1Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [v, setV] = useState(30);
  const [fb, setFb] = useState({ text: '拖动对比：专用模型数量 vs 统一模型的任务覆盖范围。', cls: '' });

  usePaperCanvas(canvasRef, W, H, (ctx) => {
    fillBg(ctx, W, H);
    const spec = clamp(v, 0, 100);
    const gen = 100 - spec * 0.35;
    const specH = spec * 1.5;
    const genH = gen * 1.5;
    ctx.fillStyle = C.red;
    ctx.fillRect(80, H - 50 - specH, 100, specH);
    ctx.fillStyle = C.green;
    ctx.fillRect(280, H - 50 - genH, 100, genH);
    ctx.fillStyle = C.text;
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText(`专用模型 ~${Math.round(spec / 10)} 个`, 70, 36);
    ctx.fillText(`统一覆盖 ${Math.round(gen)}%`, 260, 36);
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = C.muted;
    ctx.fillText('左：碎片化专用策略数量', 70, H - 20);
    ctx.fillText('右：单模型任务族覆盖', 260, H - 20);
  }, [v]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    setV(n);
    setFb(n > 60
      ? { text: '专用模型越多，维护与跨场景迁移成本越高。', cls: 'bad' }
      : { text: '统一模型用共享表征同时服务多任务族。', cls: 'good' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>专用策略数量 <span className="val">{Math.round(v / 10)}</span></label>
        <input type="range" min={0} max={100} value={v} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch1Mod2;
