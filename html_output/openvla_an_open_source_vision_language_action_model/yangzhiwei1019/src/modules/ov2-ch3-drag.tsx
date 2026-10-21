import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field, bench, plank, ink } from './ov2-analogy';
import { clamp } from '../lib/canvasKit';

const W = 1080;
const H = 280;
const DIMS = ['Δx', 'Δy', 'Δz', 'Δroll', 'Δpitch', 'Δyaw', '夹爪'];
const TARGET = { x: 300, y: 158 };
const binOf = (v: number) => Math.round(((v + 1) / 2) * 255);

export const Ov2Ch3Drag: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ hx: 300, hy: 158, drag: false });
  const [bx, setBx] = useState(128);
  const [by, setBy] = useState(128);
  const [fb, setFb] = useState({ text: '拖动黄色手柄，看七个动作维度各自落到哪一档。', cls: '' });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx) => {
      const s = stateRef.current;
      field(ctx, W, H);
      bench(ctx, W, H, 244);
      plank(ctx, 60, 118, 340, 92);
      ink(ctx, 60, 400, TARGET.y, V.orange);
      ctx.strokeStyle = V.green;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(TARGET.x, TARGET.y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = V.line;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(s.hx, s.hy);
      ctx.lineTo(TARGET.x, TARGET.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = s.drag ? V.orange : '#f4b183';
      ctx.strokeStyle = V.wood;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.hx, s.hy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 七条档位尺
      const dx = clamp((s.hx - TARGET.x) / 170, -1, 1);
      const dy = clamp((s.hy - TARGET.y) / 70, -1, 1);
      const vals = [
        dx,
        dy,
        0,
        clamp(dx * 0.8, -1, 1),
        clamp(dy * 0.8, -1, 1),
        clamp((dx - dy) * 0.5, -1, 1),
        clamp(1 - Math.abs(dx) * 0.6, 0, 1),
      ];
      const x0 = 520;
      const gap = 74;
      const top = 58;
      const bot = 228;
      vals.forEach((val, i) => {
        const x = x0 + i * gap;
        ctx.strokeStyle = V.line;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bot);
        ctx.stroke();
        for (let k = 0; k <= 8; k++) {
          const yy = top + ((bot - top) * k) / 8;
          ctx.beginPath();
          ctx.moveTo(x - 5, yy);
          ctx.lineTo(x + 5, yy);
          ctx.stroke();
        }
        const b = binOf(val);
        const y = bot - ((bot - top) * b) / 255;
        const edge = b < 12 || b > 243;
        ctx.fillStyle = edge ? V.red : V.blue;
        ctx.beginPath();
        ctx.roundRect(x - 22, y - 6, 44, 12, 3);
        ctx.fill();
        ctx.fillStyle = V.ink;
        ctx.font = '600 13px "Segoe UI", sans-serif';
        ctx.fillText(DIMS[i], x - 16, bot + 22);
        ctx.font = '600 12px "Segoe UI", sans-serif';
        ctx.fillText(String(b), x - 10, top - 12);
      });
    });
  }, []);

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.drag) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = clamp(((e.clientX - r.left) * W) / r.width, 60, 400);
    const y = clamp(((e.clientY - r.top) * H) / r.height, 80, 228);
    s.hx = x;
    s.hy = y;
    const dx = clamp((x - TARGET.x) / 170, -1, 1);
    const dy = clamp((y - TARGET.y) / 70, -1, 1);
    setBx(binOf(dx));
    setBy(binOf(dy));
    const dev = Math.max(Math.abs(dx), Math.abs(dy));
    if (dev < 0.15) setFb({ text: '手柄贴着墨线：七个档位都靠近中位，这一刨很轻。', cls: 'good' });
    else if (dev < 0.6) setFb({ text: '偏了一点：Δx 与 Δroll 一起变大，说明平移和姿态是一起被编码的。', cls: '' });
    else setFb({ text: '偏太多：Δx 已经顶到 255 档边界，再远也表达不出来，只能重来一刨。', cls: 'bad' });
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        style={{ cursor: 'grab' }}
        onPointerDown={(e) => {
          stateRef.current.drag = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={move}
        onPointerUp={() => {
          stateRef.current.drag = false;
        }}
      />
      <div className="ctrl">
        <label>
          Δx 档位 <span className="val">{bx}</span>
        </label>
        <label>
          Δy 档位 <span className="val">{by}</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ov2Ch3Drag;
