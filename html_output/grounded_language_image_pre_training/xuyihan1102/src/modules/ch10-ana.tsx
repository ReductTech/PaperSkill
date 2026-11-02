// Chapter 10 analogy (560x140, control-free): one hand presses the stopwatch and two
// light points race — the green one finishes first and stops. The chapter 10 race is
// the one place where two movers are allowed (contract.md §4).
import React, { useRef } from 'react';
import { COLORS, clearScene, drawLabel, drawLegend, useCanvas, clamp, lerp } from '../lib/roomKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;

const smooth = (u: number): number => {
  const t = clamp(u, 0, 1);
  return t * t * (3 - 2 * t);
};

export const Ch10Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ loop: 0 });

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    clearScene(ctx, W, H);
    const t = (time % 3000) / 3000;

    // the stopwatch the hand presses
    const watchX = 50;
    const watchY = 68;
    ctx.save();
    ctx.beginPath();
    ctx.arc(watchX, watchY, 17, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.paper;
    ctx.fill();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(watchX - 6, watchY - 26, 12, 7);
    ctx.fillStyle = COLORS.ink;
    ctx.fill();
    // hand of the watch
    const sweep = t < 0.22 ? 0 : smooth((t - 0.22) / 0.5) * Math.PI * 1.4;
    ctx.beginPath();
    ctx.moveTo(watchX, watchY);
    ctx.lineTo(watchX + Math.sin(sweep) * 11, watchY - Math.cos(sweep) * 11);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // the hand comes down on the button, then stays there
    const press = smooth(t / 0.16);
    const handY = lerp(26, 44, press);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(watchX, handY - 22);
    ctx.lineTo(watchX, handY);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(watchX, handY, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ink;
    ctx.fill();
    ctx.restore();
    if (t > 0.16 && t < 0.24) {
      ctx.beginPath();
      ctx.arc(watchX, 46, 6 + 10 * smooth((t - 0.16) / 0.08), 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // the race track
    const sx = 104;
    const ex = 500;
    const oursY = 60;
    const rivalY = 90;
    ctx.save();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, 46);
    ctx.lineTo(sx, 104);
    ctx.moveTo(ex, 44);
    ctx.lineTo(ex, 106);
    ctx.stroke();
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, oursY);
    ctx.lineTo(ex, oursY);
    ctx.moveTo(sx, rivalY);
    ctx.lineTo(ex, rivalY);
    ctx.stroke();
    ctx.restore();

    const startAt = 0.22;
    const oursU = clamp((t - startAt) / 0.5, 0, 1);
    const rivalU = clamp((t - startAt) / 0.78, 0, 1);
    const oursX = lerp(sx, ex, smooth(oursU));
    const rivalX = lerp(sx, ex - 52, smooth(rivalU));

    // light trails
    ctx.save();
    ctx.strokeStyle = COLORS.thread;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx, oursY);
    ctx.lineTo(oursX, oursY);
    ctx.stroke();
    ctx.strokeStyle = COLORS.muted;
    ctx.beginPath();
    ctx.moveTo(sx, rivalY);
    ctx.lineTo(rivalX, rivalY);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(rivalX, rivalY, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.muted;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(oursX, oursY, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.thread;
    ctx.fill();

    // the green point got there first and stopped
    if (oursU >= 1) {
      ctx.beginPath();
      ctx.arc(ex, oursY, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.accent;
      ctx.fill();
    }

    drawLabel(ctx, '终点', ex + 8, 82, { color: COLORS.muted, size: 13 });
    drawLegend(ctx, 300, 126, [
      { color: COLORS.thread, text: '本方法' },
      { color: COLORS.muted, text: '对照' },
    ]);
  };

  const { ref } = useCanvas(draw, W, H, stateRef);
  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch10Ana;
