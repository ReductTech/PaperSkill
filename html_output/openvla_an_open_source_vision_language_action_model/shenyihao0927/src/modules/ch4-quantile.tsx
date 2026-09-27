import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import { C, drawSceneLabel, drawLegend, drawValueChip } from './flatKit';
import type { WidgetProps } from './registry';

// 模块 4.1（P1 slider）：刻度标定器——拖动离群值倍率（×1..×20），
// 上尺 min-max 被撑爆变红（有效档宽 ×m、有效精度骤降），
// 下尺 1%-99% 分位被门神拦住离群点，刻度稳定绿色。两尺各 256 tick。
const W = 1080;
const H = 280;
const X0 = 70;
const SPAN = 910;
const MIN_N = 0.35;
const MAX_N = 0.65;
const Q1 = 0.4;
const Q99 = 0.6;

// deterministic pseudo-normal cluster of action values
const DOTS: number[] = [];
for (let i = 0; i < 46; i++) {
  const s = (Math.sin(i * 2.7) + Math.sin(i * 1.31 + 2) + Math.sin(i * 0.93 + 4)) / 3;
  DOTS.push(0.5 + s * 0.15);
}

export const Ch4Quantile: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(1);
  const [mult, setMult] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = () => {
      const m = stateRef.current;
      const vOut = MAX_N + (m - 1) * 0.3; // outlier action value
      const domMax = Math.max(MAX_N, vOut);
      const xTop = (v: number) => X0 + ((clamp(v, MIN_N, domMax) - MIN_N) / (domMax - MIN_N)) * SPAN;
      const xBot = (v: number) => X0 + ((clamp(v, Q1, Q99) - Q1) / (Q99 - Q1)) * SPAN;
      const eff = Math.round(100 / m);
      const topColor = m > 1 ? lerpColor(C.blue, C.red, clamp((m - 1) / 4, 0, 1)) : C.blue;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ---- TOP ruler: min-max ----
      drawSceneLabel(ctx, 'min-max', X0, 34, { color: m > 1 ? C.red : C.blue });
      DOTS.forEach((v, i) => {
        ctx.save();
        ctx.fillStyle = C.text;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(xTop(v), 50 + (i % 5) * 5, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // outlier dot + growing distance bracket
      ctx.save();
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(xTop(vOut), 60, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(xTop(vOut), 60, 10, 0, Math.PI * 2);
      ctx.stroke();
      if (m > 1) {
        const bx = xTop(MAX_N);
        ctx.beginPath();
        ctx.moveTo(bx, 76);
        ctx.lineTo(xTop(vOut), 76);
        ctx.moveTo(bx, 72);
        ctx.lineTo(bx, 80);
        ctx.moveTo(xTop(vOut), 72);
        ctx.lineTo(xTop(vOut), 80);
        ctx.stroke();
      }
      // ruler + 256 compressed ticks
      ctx.strokeStyle = topColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(X0, 92);
      ctx.lineTo(X0 + SPAN, 92);
      ctx.stroke();
      ctx.lineWidth = 1;
      for (let i = 0; i < 256; i++) {
        const tx = X0 + (i * SPAN) / 255;
        ctx.beginPath();
        ctx.moveTo(tx, 92);
        ctx.lineTo(tx, 92 - (i % 32 === 0 ? 10 : 5));
        ctx.stroke();
      }
      ctx.restore();
      // badges: stretch factor + effective precision
      drawValueChip(ctx, 872, 36, '×' + m.toFixed(1), m > 1 ? C.red : C.blue);
      drawValueChip(ctx, 928, 36, eff + '%', m > 1 ? C.red : C.blue);

      // ---- BOTTOM ruler: quantile 1%-99% ----
      drawSceneLabel(ctx, '1%-99%', X0, 140, { color: C.green });
      DOTS.forEach((v, i) => {
        const clipped = v < Q1 || v > Q99;
        ctx.save();
        ctx.fillStyle = C.text;
        ctx.globalAlpha = clipped ? 0.35 : 0.7;
        ctx.beginPath();
        ctx.arc(xBot(v), 158 + (i % 5) * 5, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // outlier stopped at the quantile gate, clipped outside
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = C.red;
      ctx.beginPath();
      ctx.arc(X0 + SPAN + 16, 168, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X0 + SPAN + 8, 178);
      ctx.lineTo(X0 + SPAN + 24, 160);
      ctx.stroke();
      ctx.restore();
      // ruler + 256 compressed ticks (stable green)
      ctx.save();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(X0, 200);
      ctx.lineTo(X0 + SPAN, 200);
      ctx.stroke();
      ctx.lineWidth = 1;
      for (let i = 0; i < 256; i++) {
        const tx = X0 + (i * SPAN) / 255;
        ctx.beginPath();
        ctx.moveTo(tx, 200);
        ctx.lineTo(tx, 200 - (i % 32 === 0 ? 10 : 5));
        ctx.stroke();
      }
      ctx.restore();
      // 分位门 gate posts at q99
      ctx.save();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(X0 + SPAN - 10, 188);
      ctx.lineTo(X0 + SPAN - 10, 214);
      ctx.moveTo(X0 + SPAN + 4, 188);
      ctx.lineTo(X0 + SPAN + 4, 214);
      ctx.moveTo(X0 + SPAN - 16, 188);
      ctx.lineTo(X0 + SPAN + 10, 188);
      ctx.stroke();
      ctx.restore();

      // legend + bare-number comparison (right-bottom)
      drawLegend(
        ctx,
        [
          ['正常动作', C.text],
          ['离群动作', C.red],
        ],
        X0,
        254
      );
      drawSceneLabel(ctx, '档宽', 828, 254, { color: C.muted, align: 'right' });
      drawValueChip(ctx, 884, 254, '×' + m.toFixed(1), C.red);
      drawValueChip(ctx, 940, 254, '×1.0', C.green);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const m = Number(e.target.value);
    stateRef.current = m;
    setMult(m);
  };

  const eff = Math.round(100 / mult);
  const fb1 =
    mult > 1
      ? { text: `min-max 档宽被拉大 ${mult.toFixed(1)}×，256 档的有效精度只剩 ${eff}%`, cls: 'bad' }
      : { text: 'min-max：离群值 ×1，刻度尚未被撑爆。', cls: '' };
  const fb2 =
    mult > 1
      ? { text: '分位刻度不变，离群动作被截断在门外', cls: 'good' }
      : { text: '分位刻度：稳定覆盖 1%-99%，档宽 ×1。', cls: '' };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          离群值倍率 <span className="val">×{mult.toFixed(1)}</span>
        </label>
        <input type="range" min={1} max={20} step={0.5} value={mult} onChange={onSlide} />
      </div>
      <div className={`feedback ${fb1.cls}`}>{fb1.text}</div>
      <div className={`feedback ${fb2.cls}`}>{fb2.text}</div>
    </div>
  );
};

export default Ch4Quantile;
