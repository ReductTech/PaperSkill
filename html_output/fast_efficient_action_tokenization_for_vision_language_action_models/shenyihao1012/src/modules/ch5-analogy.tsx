import React, { useEffect, useRef } from 'react';
import {
  setupCanvas,
  observeCanvas,
  clamp,
  lerp,
  easeOutCubic,
} from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawVacBag,
  drawSuitcase,
  drawRolled,
  drawPouch,
  drawSceneLabel,
} from './packKit';
import type { WidgetProps } from './registry';

// Ch5 analogy — 打包五步法: five packing props laid out on a mat light up one
// by one: 分堆 (sort into piles) → 压缩袋 (vac bag) → 抽气档位 (pump knob) →
// 大件打底 (big items first) → 收纳袋 (packing cube). Numbered 1–5, all reversible.
const W = 560;
const H = 140;
const LOOP = 3600;
const CXS = [78, 172, 266, 360, 454];
const ICON_Y = 88;

export const Ch5Analogy: React.FC<WidgetProps> = () => {
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

    const miniTee = (x: number, y: number) => {
      ctx.save();
      ctx.fillStyle = '#d9c7a7';
      ctx.strokeStyle = C.deep;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - 8, y - 4.5, 16, 9, 3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    const render = (ms: number) => {
      const t = (ms % LOOP) / LOOP;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // the packing mat
      ctx.save();
      ctx.fillStyle = 'rgba(184,201,167,0.28)';
      ctx.strokeStyle = C.ground;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(28, 64, 492, 48, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      const lit = Math.min(4, Math.floor(t * 6));

      for (let i = 0; i < 5; i++) {
        const cx = CXS[i];
        const on = i <= lit;
        const age = clamp(t * 6 - i, 0, 1);
        const pop = on ? 1 + 0.18 * Math.exp(-3 * age) : 1;

        // soft glow behind the active station
        if (i === lit) {
          ctx.save();
          ctx.globalAlpha = 0.15 + 0.06 * Math.sin(ms * 0.006);
          ctx.fillStyle = C.green;
          ctx.beginPath();
          ctx.arc(cx, ICON_Y, 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // the prop itself, with a small pop when it lights up
        ctx.save();
        ctx.translate(cx, ICON_Y);
        ctx.scale(pop, pop);
        ctx.translate(-cx, -ICON_Y);
        if (i === 0) {
          // 分堆: clothes sorted into two little piles
          miniTee(cx - 34, ICON_Y + 4);
          miniTee(cx - 22, ICON_Y - 4);
          miniTee(cx + 12, ICON_Y + 4);
          miniTee(cx + 24, ICON_Y - 4);
        } else if (i === 1) {
          // 压缩袋
          drawVacBag(ctx, cx - 21, ICON_Y - 10, 42, 20, on ? 0.55 : 0);
        } else if (i === 2) {
          // 抽气档位: a knob that turns when reached
          const ang = on ? lerp(-2.2, -0.55, easeOutCubic(age)) : -2.2;
          ctx.save();
          ctx.setLineDash([2, 3]);
          ctx.strokeStyle = on ? C.green : C.muted;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.arc(cx, ICON_Y, 14, -2.5, -0.3);
          ctx.stroke();
          ctx.restore();
          ctx.fillStyle = '#f2ecdf';
          ctx.strokeStyle = on ? C.green : C.muted;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, ICON_Y, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.lineCap = 'round';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx, ICON_Y);
          ctx.lineTo(cx + 8 * Math.cos(ang), ICON_Y + 8 * Math.sin(ang));
          ctx.stroke();
        } else if (i === 3) {
          // 大件打底: big case as the base, rolls on top
          drawSuitcase(ctx, cx - 23, ICON_Y - 10, 46, 20, {
            open: false,
            fill01: 0.35,
            color: on ? C.green : C.support,
          });
          drawRolled(ctx, cx - 15, ICON_Y - 14, 2, { size: 0.42 });
        } else {
          // 收纳袋: packing cube with small items merged inside
          drawPouch(ctx, cx - 22, ICON_Y, 44, on ? 4 : 3);
        }
        ctx.restore();

        // number chip under each station
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, 104, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = on ? C.green : C.white;
        ctx.fill();
        ctx.strokeStyle = on ? C.green : C.border;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = on ? C.white : C.muted;
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), cx, 104.5);
        ctx.restore();

        // arrow to the next station
        if (i < 4) {
          const ax = (cx + CXS[i + 1]) / 2;
          ctx.save();
          ctx.strokeStyle = i < lit ? C.green : C.border;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(ax - 3, ICON_Y - 4);
          ctx.lineTo(ax + 2, ICON_Y);
          ctx.lineTo(ax - 3, ICON_Y + 4);
          ctx.stroke();
          ctx.restore();
        }
      }

      drawSceneLabel(ctx, '打包五步法', 16, 18, { color: C.green });
      drawSceneLabel(ctx, '五步全可逆', 544, 18, { color: C.muted, align: 'right' });

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

export default Ch5Analogy;
