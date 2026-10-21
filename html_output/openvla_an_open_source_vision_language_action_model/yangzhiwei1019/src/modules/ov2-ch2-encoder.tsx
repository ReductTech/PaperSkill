import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field, bench, plank, ink } from './ov2-analogy';

const W = 1080;
const H = 280;

const MODES = [
  { name: '只用 SigLIP', sharp: 0.25, spread: 0.85, note: '认得出「这是木板」，但墨线在哪条边上，定位是糊的。', cls: 'bad' },
  { name: '只用 DINOv2', sharp: 0.9, spread: 0.3, note: '边缘清楚、语义弱：知道有线，分不清那是桌面还是物件轮廓。', cls: '' },
  { name: '融合两路', sharp: 0.92, spread: 0.8, note: '空间细节与语义同时保留，这是本文的选型。', cls: 'good' },
];
/* Sec.3.4：以 IDEFICS-1 为 0，LLaVA +35，Prismatic 再 +10（5 个语言定位任务的平均绝对成功率，百分点） */
const DELTAS = [0, 35, 45];

export const Ov2Ch2Encoder: React.FC<WidgetProps> = () => {
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
      bench(ctx, W, H, 244);
      plank(ctx, 50, 92, 360, 116);
      ink(ctx, 50, 410, 150, V.orange);
      const cols = 8;
      const rows = 6;
      const pw = 360 / cols;
      const ph = 116 / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cy = 92 + r * ph + ph / 2;
          const d = Math.abs(cy - 150);
          const edge = Math.max(0, 1 - d / 26) * m.sharp;
          const broad = Math.max(0, 1 - d / 92) * m.spread * 0.5;
          const a = Math.min(0.85, edge + broad);
          if (a > 0.03) {
            ctx.fillStyle = `rgba(39,68,110,${a})`;
            ctx.fillRect(50 + c * pw + 1, 92 + r * ph + 1, pw - 2, ph - 2);
          }
          ctx.strokeStyle = 'rgba(33,50,74,0.16)';
          ctx.lineWidth = 1;
          ctx.strokeRect(50 + c * pw, 92 + r * ph, pw, ph);
        }
      }
      const bw = m.name === '只用 SigLIP' ? 150 : 62;
      ctx.strokeStyle = m.name === '只用 SigLIP' ? V.red : V.green;
      ctx.lineWidth = 2.6;
      ctx.strokeRect(210 - bw / 2, 136, bw, 28);
      const x0 = 500;
      DELTAS.forEach((v, i) => {
        const h = Math.max(4, (v / 50) * 170);
        ctx.fillStyle = i === 2 ? V.green : i === 1 ? V.blue : V.red;
        ctx.beginPath();
        ctx.roundRect(x0 + i * 172, 236 - h, 92, h, 4);
        ctx.fill();
        ctx.fillStyle = V.ink;
        ctx.font = '700 17px "Segoe UI", sans-serif';
        ctx.fillText('+' + v, x0 + i * 172 + 12, 236 - h - 8);
      });
      ctx.strokeStyle = V.line;
      ctx.beginPath();
      ctx.moveTo(470, 236.5);
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
      <div className={`feedback ${fb.cls}`}>
        {fb.text} 右侧三根条是相对 IDEFICS-1 的语言定位提升：LLaVA +35、Prismatic +45 个百分点。
      </div>
    </div>
  );
};

export default Ov2Ch2Encoder;
