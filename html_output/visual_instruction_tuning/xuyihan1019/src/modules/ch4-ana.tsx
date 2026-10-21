import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawPage,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/trailKit';

const W = 560;
const H = 140;
const LOOP = 3000;
const DRAW_SPAN = 0.88;

const PAGE = { x: 150, y: 26, w: 260, h: 88 };
const ROW_H = (PAGE.h - 14) / 2;

// A hand circles the answer line of a small dialogue page; the question line above
// it is never circled. One moving subject, one visible goal.
export const Ch4Ana: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const stateRef = useRef({ tick: 0 });

  const { ref } = useCanvas<{ tick: number }>(
    (ctx, time) => {
      clearScene(ctx, W, H);

      drawPage(ctx, PAGE.x, PAGE.y, PAGE.w, PAGE.h, { lines: 2, rows: 2 });

      const questionY = PAGE.y + 8 + ROW_H * 0.45;
      const answerY = PAGE.y + 8 + ROW_H + ROW_H * 0.45;

      // question (blue prompt) vs answer (green target)
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(PAGE.x + 12, questionY);
      ctx.lineTo(PAGE.x + PAGE.w - 14, questionY);
      ctx.strokeStyle = COLORS.route;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PAGE.x + 12, answerY);
      ctx.lineTo(PAGE.x + PAGE.w - 14, answerY);
      ctx.strokeStyle = COLORS.good;
      ctx.stroke();
      ctx.restore();

      // the pencil hand traces a loop around only the answer row
      const progress = Math.min(1, (time % LOOP) / (LOOP * DRAW_SPAN));
      const cx = PAGE.x + PAGE.w / 2;
      const cy = PAGE.y + 8 + ROW_H + ROW_H / 2;
      const rx = PAGE.w / 2 - 5;
      const ry = ROW_H / 2 - 0.5;
      const start = -Math.PI / 2;
      const end = start + progress * Math.PI * 2;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, start, end);
      ctx.strokeStyle = COLORS.good;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();

      const hx = cx + Math.cos(end) * rx;
      const hy = cy + Math.sin(end) * ry;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + 11, hy - 13);
      ctx.strokeStyle = COLORS.fader;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.fader;
      ctx.fill();
      ctx.restore();

      drawLabel(ctx, '只圈回答', PAGE.x, PAGE.y - 8, { color: COLORS.muted, size: 13 });
      drawLegend(ctx, PAGE.x, 132, [
        { color: COLORS.route, text: '问题' },
        { color: COLORS.good, text: '回答' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />;
};

export default Ch4Ana;
