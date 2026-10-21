import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  clamp,
  lerp,
  drawChannelStrip,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/consoleKit';

// §2 analogy (560×140) — one hand pushes a long track through the compressor and a
// fixed row of cue dots lands on the right. Automatic 3.0 s loop, no controls.
const W = 560;
const H = 140;
const LOOP = 3000;

/** The operator's hand: palm plus three finger strokes. */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, 26, 15);
  ctx.fillStyle = COLORS.deckB;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.ink;
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 3; i += 1) {
    const fx = x + 6 + i * 7;
    ctx.moveTo(fx, y);
    ctx.lineTo(fx, y - 7);
  }
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.ink;
  ctx.stroke();
  ctx.restore();
}

export const Ch2Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Record<string, never>>({});

  const { ref } = useCanvas<Record<string, never>>(
    (ctx, time) => {
      clearScene(ctx, W, H);
      const t = (time % LOOP) / LOOP;
      const push = clamp(t / 0.62, 0, 1);
      const press = clamp((t - 0.52) / 0.48, 0, 1);

      const bx = 236;
      const by = 40;
      const bw = 120;
      const bh = 60;
      const midY = 70;
      const barH = 34;
      const right = bx + 24;
      const left = lerp(18, bx - 74, push);

      // moving: the long track being pushed right, its waveform still running
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = COLORS.deckB;
      ctx.fillRect(left, midY - barH / 2, Math.max(8, right - left), barH);
      ctx.restore();
      ctx.beginPath();
      const steps = 44;
      for (let i = 0; i <= steps; i += 1) {
        const px = left + ((right - left) * i) / steps;
        const py = midY + Math.sin(i * 0.72 + time * 0.006) * (barH * 0.3);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.route;
      ctx.stroke();

      // static prop: the compressor shell with its six trainable strips
      ctx.save();
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(bx, by, bw, bh);
      ctx.restore();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLORS.platter;
      ctx.strokeRect(bx, by, bw, bh);
      drawChannelStrip(ctx, bx + 13, by + 11, bw - 26, bh - 22, { count: 6, active: 6 });
      drawLabel(ctx, '压缩器', bx + 30, by + bh + 20, { color: COLORS.muted, size: 13 });

      // goal: a fixed row of cue dots, landing one after another
      const tickN = 12;
      const lit = Math.round(press * tickN);
      for (let i = 0; i < tickN; i += 1) {
        const on = i < lit;
        const tx = 392 + i * 11;
        ctx.save();
        ctx.globalAlpha = on ? 0.85 : 0.32;
        ctx.beginPath();
        ctx.rect(tx, 56, 8, 28);
        ctx.fillStyle = on ? COLORS.fader : COLORS.axis;
        ctx.fill();
        ctx.restore();
        ctx.beginPath();
        ctx.rect(tx, 56, 8, 28);
        ctx.lineWidth = on ? 2 : 1.5;
        ctx.strokeStyle = on ? COLORS.fader : COLORS.axis;
        ctx.stroke();
      }
      drawLabel(ctx, '有限提示点', 396, 104, { color: COLORS.muted, size: 13 });

      // the hand pushes the track in; it is the only moving subject
      drawHand(ctx, left + 12, midY + 22);

      drawLegend(ctx, 36, 126, [
        { color: COLORS.route, text: '长曲输入' },
        { color: COLORS.fader, text: '提示点' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch2Ana;
