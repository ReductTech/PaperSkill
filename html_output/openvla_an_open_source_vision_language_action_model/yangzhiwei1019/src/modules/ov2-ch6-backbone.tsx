import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field, bench, plank, ink } from './ov2-analogy';

const W = 1080;
const H = 280;

const MODES = [
  { name: 'IDEFICS-1', gain: 0, right: false, note: '单物件还行；两件相似木料并排，就常对错那一块。', cls: 'bad' },
  { name: 'LLaVA', gain: 35, right: true, note: '语言定位明显改善：平均绝对成功率比 IDEFICS-1 高 35 个百分点。', cls: '' },
  { name: 'Prismatic', gain: 45, right: true, note: '在 LLaVA 基础上再高约 10 个百分点，作者归因于融合编码器带来的空间推理。', cls: 'good' },
];

export const Ov2Ch6Backbone: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(2);
  const [mode, setMode] = useState(2);
  const [fb, setFb] = useState({ text: MODES[2].note, cls: 'good' });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx) => {
      const m = MODES[stateRef.current];
      field(ctx, W, H);
      bench(ctx, W, H, 240);
      plank(ctx, 40, 128, 420, 106);
      ink(ctx, 60, 440, 170, V.orange);
      ctx.fillStyle = '#dcc7a4';
      ctx.strokeStyle = V.ink;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(84, 176, 96, 44, 4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(244, 176, 96, 44, 4);
      ctx.fill();
      ctx.stroke();
      const tx = m.right ? 244 : 84;
      ctx.strokeStyle = m.right ? V.green : V.red;
      ctx.lineWidth = m.gain > 40 ? 3.6 : 2.6;
      ctx.beginPath();
      ctx.roundRect(tx - 9, 168, 114, 60, 5);
      ctx.stroke();
      const x0 = 520;
      MODES.forEach((mm, i) => {
        const h = Math.max(5, (mm.gain / 50) * 170);
        ctx.fillStyle = i === 2 ? V.green : i === 1 ? V.blue : V.red;
        ctx.beginPath();
        ctx.roundRect(x0 + i * 168, 236 - h, 92, h, 4);
        ctx.fill();
        ctx.fillStyle = V.ink;
        ctx.font = '700 17px "Segoe UI", sans-serif';
        ctx.fillText('+' + mm.gain, x0 + i * 168 + 12, 236 - h - 8);
      });
      ctx.strokeStyle = V.line;
      ctx.beginPath();
      ctx.moveTo(496, 236.5);
      ctx.lineTo(1040, 236.5);
      ctx.stroke();
    });
  }, []);

  const pick = (i: number) => {
    stateRef.current = i;
    setMode(i);
    setFb({ text: MODES[i].note, cls: MODES[i].cls });
  };

  return (
    <div>
      <div className="chip-row">
        {MODES.map((m, i) => (
          <button key={m.name} className={`chip${mode === i ? ' selected' : ''}`} onClick={() => pick(i)}>
            {m.name}
          </button>
        ))}
      </div>
      <canvas ref={ref} width={W} height={H} />
      <div className={`feedback ${fb.cls}`}>{fb.text} 条高以 IDEFICS-1 为基准，单位百分点。</div>
    </div>
  );
};

export default Ov2Ch6Backbone;
