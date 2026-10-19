import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field, bench } from './ov2-analogy';

const W = 1080;
const H = 280;

const LIMITS = [
  { name: '只吃单张图', note: '当前模型只支持单图像观测；真实机器人常有多相机，扩展多图输入是作者列出的后续工作。', cls: 'bad' },
  { name: '没有历史与本体感知', note: '没有观测历史、没有本体感受输入，遇到需要「刚才发生了什么」的场景就只能靠单帧猜。', cls: 'bad' },
  { name: '6Hz 撑不起 50Hz', note: 'bf16 单卡 4090 约 6Hz；ALOHA 这类 50Hz 双臂平台无法直接跑，需要动作分块或投机解码。', cls: '' },
  { name: '成功率普遍不到 90%', note: '作者自述：虽然超过此前通用策略，但在评测任务上通常仍低于 90%，离可靠还差一截。', cls: 'bad' },
];

export const Ov2Ch8Limits: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(0);
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState({ text: LIMITS[0].note, cls: 'bad' });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx, t) => {
      const s = stateRef.current;
      field(ctx, W, H);
      bench(ctx, W, H, 250);
      if (s === 0) {
        for (let i = 0; i < 3; i++) {
          const on = i === 0;
          ctx.fillStyle = on ? '#eef3fa' : '#ffffff';
          ctx.strokeStyle = on ? V.blue : V.line;
          ctx.lineWidth = on ? 2.6 : 1.6;
          if (!on) ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.roundRect(120 + i * 200, 100, 150, 100, 6);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          if (!on) {
            ctx.strokeStyle = V.red;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(140 + i * 200, 120);
            ctx.lineTo(250 + i * 200, 180);
            ctx.stroke();
          }
        }
      } else if (s === 1) {
        ctx.strokeStyle = V.line;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(120, 150);
        ctx.lineTo(960, 150);
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const on = i === 5;
          ctx.fillStyle = on ? V.blue : '#ffffff';
          ctx.strokeStyle = on ? V.blue : V.line;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(160 + i * 150, 150, on ? 16 : 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else if (s === 2) {
        for (let row = 0; row < 2; row++) {
          const n = row === 0 ? 6 : 50;
          for (let i = 0; i < n; i++) {
            ctx.fillStyle = row === 0 ? V.red : V.green;
            ctx.fillRect(140 + i * 16, 110 + row * 70, 8, 34);
          }
        }
      } else {
        const barW = 620;
        ctx.fillStyle = '#eef2e8';
        ctx.beginPath();
        ctx.roundRect(140, 130, barW, 46, 5);
        ctx.fill();
        ctx.fillStyle = V.blue;
        ctx.beginPath();
        ctx.roundRect(140, 130, barW * 0.9, 46, 5);
        ctx.fill();
        ctx.strokeStyle = V.orange;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(140 + barW * 0.9, 112);
        ctx.lineTo(140 + barW * 0.9, 194);
        ctx.stroke();
        ctx.fillStyle = V.ink;
        ctx.font = '700 20px "Segoe UI", sans-serif';
        ctx.fillText('90%', 140 + barW * 0.9 - 22, 104);
        const pulse = 0.5 + Math.abs(Math.sin(t * Math.PI)) * 0.45;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = V.blue;
        ctx.beginPath();
        ctx.arc(140 + barW * 0.78, 153, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }, 3200);
  }, []);

  const pick = (i: number) => {
    stateRef.current = i;
    setIdx(i);
    setFb({ text: LIMITS[i].note, cls: LIMITS[i].cls });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="chip-row">
        {LIMITS.map((l, i) => (
          <button key={l.name} className={`chip${idx === i ? ' selected' : ''}`} onClick={() => pick(i)}>
            {l.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ov2Ch8Limits;
