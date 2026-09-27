import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, easeInOutQuad, lerpColor } from '../lib/canvasKit';
import { C, drawSceneBg, drawSceneLabel } from './flatKit';
import type { WidgetProps } from './registry';

// 类比动画（§4）：刻度尺上的货物分布直方图；一个巨大离群箱滚入——
// min-max 刻度瞬间被拉长糊掉（红），分位刻度纹丝不动（绿）。
const W = 560;
const H = 140;
const LOOP = 3400;
const DOT_X = [0, 0.09, 0.15, 0.22, 0.31, 0.38, 0.44, 0.52, 0.61, 0.68, 0.77, 0.85];
const DOT_Y = [0, 1, 2, 1, 0, 2, 0, 1, 2, 0, 1, 2];

export const Ch4Analogy: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      // dot-cluster histogram (normal goods)
      ctx.save();
      ctx.fillStyle = C.text;
      ctx.globalAlpha = 0.7;
      DOT_X.forEach((dx, i) => {
        ctx.beginPath();
        ctx.arc(88 + dx * 118, 24 + DOT_Y[i] * 5, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      // ---- TOP ruler: min-max, stretches red on impact ----
      const impact = t > 0.45 ? easeOutCubic(clamp((t - 0.45) / 0.15, 0, 1)) : 0;
      const lenT = 130 + impact * 370;
      const redness = clamp((t - 0.45) / 0.12, 0, 1);
      const tcol = lerpColor(C.blue, C.red, redness);
      const wob =
        t < 0.45 ? 0 : t < 0.6 ? 2.4 * impact : 2.4 * (1 - clamp((t - 0.6) / 0.3, 0, 1));
      ctx.save();
      ctx.strokeStyle = tcol;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = redness > 0 ? 0.55 + 0.45 * (1 - wob / 2.4) : 1;
      ctx.beginPath();
      ctx.moveTo(80, 46);
      ctx.lineTo(80 + lenT, 46);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= 10; i++) {
        const tx = 80 + (lenT * i) / 10 + Math.sin(i * 1.3 + ms / 50) * wob * 0.5;
        ctx.beginPath();
        ctx.moveTo(tx, 46);
        ctx.lineTo(tx, 46 - (i % 5 === 0 ? 10 : 6));
        ctx.stroke();
      }
      ctx.restore();
      // ---- rolling outlier box (the moving subject) ----
      const rollP = clamp((t - 0.22) / 0.23, 0, 1);
      const bx = 600 - easeInOutQuad(rollP) * 100;
      if (t > 0.22) {
        ctx.save();
        ctx.translate(bx, 34);
        ctx.rotate(bx / 14);
        ctx.fillStyle = '#d9c7a7';
        ctx.strokeStyle = C.support;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-8, -8, 16, 16, 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(8, 8);
        ctx.stroke();
        ctx.restore();
      }
      // ---- BOTTOM ruler: quantile, rock stable green + gate ----
      ctx.save();
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(80, 100);
      ctx.lineTo(210, 100);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      for (let i = 0; i <= 10; i++) {
        const tx = 80 + 13 * i;
        ctx.beginPath();
        ctx.moveTo(tx, 100);
        ctx.lineTo(tx, 100 - (i % 5 === 0 ? 10 : 6));
        ctx.stroke();
      }
      ctx.restore();
      // 分位门 gate (torii-like)
      ctx.save();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(214, 90);
      ctx.lineTo(214, 114);
      ctx.moveTo(232, 90);
      ctx.lineTo(232, 114);
      ctx.moveTo(208, 90);
      ctx.lineTo(238, 90);
      ctx.stroke();
      ctx.restore();
      // outlier clipped outside the gate (after impact)
      if (t > 0.45) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.roundRect(248, 92, 13, 13, 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(246, 107);
        ctx.lineTo(263, 90);
        ctx.stroke();
        ctx.restore();
      }
      drawSceneLabel(ctx, 'min-max', 16, 46, { color: redness > 0.5 ? C.red : C.blue });
      drawSceneLabel(ctx, '分位', 16, 100, { color: C.green });
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

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch4Analogy;
