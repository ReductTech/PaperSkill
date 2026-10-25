import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { C, W, H, scene, txt, line, dot, legend, type WidgetProps } from './kit';

// Chapter 5.1 — distillation strength pulls the old-class output back to its stored target q.
const TARGET = 0.85;
const FLOOR = 0.12;

function curveEnd(lam: number): number {
  return FLOOR + (TARGET - FLOOR) * lam;
}
function valueAt(t: number, lam: number): number {
  const end = curveEnd(lam);
  const k = Math.pow(t / 10, 1.15);
  return TARGET - (TARGET - end) * k;
}

export const C5Distill: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [lam, setLam] = useState(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = setupCanvas(c, W, H);
    scene(ctx);

    const left = 110;
    const right = 980;
    const top = 56;
    const bottom = 224;

    line(ctx, left, bottom, right, bottom, C.border, 2);
    line(ctx, left, top, left, bottom, C.border, 2);

    // stored target q
    const qy = bottom - TARGET * (bottom - top);
    line(ctx, left, qy, right, qy, C.muted, 2, [7, 6]);
    txt(ctx, 'q', left - 16, qy, C.muted, 20, 'right', '700');

    const plot = (f: (t: number) => number, color: string, width: number, dash: number[] = []) => {
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = (i / 80) * 10;
        const x = left + (i / 80) * (right - left);
        const y = bottom - f(t) * (bottom - top);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.save();
      ctx.setLineDash(dash);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.restore();
    };

    plot((t) => valueAt(t, 0), C.red, 2, [6, 5]);
    plot((t) => valueAt(t, lam), lam > 0.55 ? C.green : C.blue, 4);

    const end = valueAt(10, lam);
    dot(ctx, right, bottom - end * (bottom - top), 9, lam > 0.55 ? C.green : C.blue, C.white, 3);

    legend(ctx, [
      { label: '无蒸馏', color: C.red },
      { label: '当前设置', color: lam > 0.55 ? C.green : C.blue },
    ], 690, 44);
    c.classList.add('is-ready');
  }, [lam]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          蒸馏权重 λ <span className="val">{lam.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(lam * 100)} onChange={(e) => setLam(Number(e.target.value) / 100)} />
        <span className="val">旧类输出 {valueAt(10, lam).toFixed(2)}</span>
      </div>
      <div className={`feedback ${lam < 0.25 ? 'bad' : lam > 0.6 ? 'good' : ''}`}>
        {lam < 0.25
          ? '没有蒸馏约束时，旧类输出随新数据一路下滑到 0.3 以下，判别信息基本丢失。'
          : lam > 0.6
          ? '旧类输出被拉回训练前的目标 q，特征可以继续学新类，旧类的相对判断不被改写。'
          : 'λ 居中时旧类输出只被部分保留：蒸馏是“拉回”，不是“冻结”。'}
      </div>
    </div>
  );
};

export default C5Distill;
