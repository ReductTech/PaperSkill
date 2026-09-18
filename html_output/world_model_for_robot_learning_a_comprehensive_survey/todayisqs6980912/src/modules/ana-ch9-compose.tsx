import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  PALETTE,
  drawScene,
  drawInkPath,
  drawBrush,
  drawSceneLabel,
  drawCopybook,
} from './theme-kit';
import type { WidgetProps } from './registry';

// 类比动画：集字——毛笔把字帖上学过的偏旁部件拼组，在空白格中写出新字；
// 已练部件淡棕，新组笔画深蓝。循环 3.0 s。

const W = 560;
const H = 140;
const DUR = 3000;

// 左侧字帖：两个已学部件（示意「氵」「青」各为一组笔画）
const PART_A = [
  [
    { x: 0.5, y: 0.05 },
    { x: 0.5, y: 0.95 },
  ],
];
const PART_B = [
  [
    { x: 0.1, y: 0.3 },
    { x: 0.9, y: 0.3 },
  ],
  [
    { x: 0.5, y: 0.3 },
    { x: 0.5, y: 0.95 },
  ],
];

// 右侧新字：部件 A 移到左侧，部件 B 移到右侧，中间一条新的连接笔画
const NEW_LINK = [
  { x: 248, y: 70 },
  { x: 292, y: 88 },
  { x: 340, y: 74 },
];

export const AnaCh9Compose: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawPart = (
      strokes: { x: number; y: number }[][],
      ox: number,
      oy: number,
      w: number,
      h: number,
      color: string,
      u: number
    ) => {
      ctx.save();
      ctx.globalAlpha = 0.85 * u;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (const st of strokes) {
        const n = Math.max(1, Math.round(st.length * u));
        const seg = st.slice(0, Math.max(2, n));
        ctx.beginPath();
        ctx.moveTo(ox + seg[0].x * w, oy + seg[0].y * h);
        for (let i = 1; i < seg.length; i++) {
          ctx.lineTo(ox + seg[i].x * w, oy + seg[i].y * h);
        }
        ctx.stroke();
      }
      ctx.restore();
    };

    const render = (ms: number) => {
      const cyc = (ms % DUR) / DUR;
      const fade = cyc > 0.9 ? 1 - (cyc - 0.9) / 0.1 : 1;
      // A 0–0.3 部件A淡入；B 0.3–0.6 部件B淡入；C 0.6–0.88 新连接笔画（毛笔）
      const uA = clamp(cyc / 0.3, 0, 1);
      const uB = clamp((cyc - 0.3) / 0.3, 0, 1);
      const uN = clamp((cyc - 0.6) / 0.28, 0, 1);

      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 8 });
      ctx.save();
      ctx.globalAlpha = fade;

      // 左侧字帖（两个部件卡片）
      drawCopybook(ctx, 28, 28, 72, 84, { glyph: PART_A });
      drawCopybook(ctx, 108, 28, 72, 84, { glyph: PART_B });
      drawSceneLabel(ctx, 104, 124, '学过的部件', { size: 11, align: 'center' });

      // 右侧空白格
      ctx.save();
      ctx.strokeStyle = PALETTE.grid;
      ctx.lineWidth = 1;
      ctx.strokeRect(220.5, 24.5, 300, 92);
      ctx.setLineDash([5, 5]);
      ctx.globalAlpha = 0.6 * fade;
      ctx.beginPath();
      ctx.moveTo(370, 24);
      ctx.lineTo(370, 116);
      ctx.moveTo(220, 70);
      ctx.lineTo(520, 70);
      ctx.stroke();
      ctx.restore();
      drawSceneLabel(ctx, 370, 126, '新组字', { size: 11, align: 'center' });

      // 已练部件淡棕落位
      if (uA > 0) drawPart(PART_A, 238, 30, 44, 80, PALETTE.guide, uA);
      if (uB > 0) drawPart(PART_B, 396, 30, 100, 80, PALETTE.guide, uB);

      // 新组笔画深蓝 + 毛笔
      if (uN > 0) {
        const n = Math.max(2, Math.round(uN * (NEW_LINK.length - 1)) + 1);
        const pts = NEW_LINK.slice(0, n);
        drawInkPath(ctx, pts, { color: PALETTE.blue, width: 4 });
        if (uN < 1) {
          const tip = pts[pts.length - 1];
          drawBrush(ctx, tip.x, tip.y, 0.16, 26);
        }
      }

      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    let raf: number | null = null;
    const tick = (ms: number) => {
      render(ms);
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-ana-ch9" ref={canvasRef} width={W} height={H} />;
};

export default AnaCh9Compose;
