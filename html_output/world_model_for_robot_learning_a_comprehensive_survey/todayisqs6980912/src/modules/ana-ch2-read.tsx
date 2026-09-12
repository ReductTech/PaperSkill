import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { PALETTE, drawScene, drawCopybook, drawGhostPath, drawBrush, DEFAULT_GLYPH } from './theme-kit';
import type { WidgetProps } from './registry';

// 类比动画：毛笔悬在字帖上方，一支虚线幽灵笔沿范字骨架匀速描画，
// 毛笔本体跟随幽灵笔上方 20 px 平移，不落墨。循环 3.0 s。

const W = 560;
const H = 140;
const DUR = 3000;

export const AnaCh2Read: React.FC<WidgetProps> = () => {
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

    const CX = 280;
    const CY = 70;
    const CW = 150;
    const CH = 108;
    const bx = CX - CW / 2;
    const by = CY - CH / 2;
    const pad = 16;
    const gw = CW - pad * 2;
    const gh = CH - pad * 2;

    const glyphPt = (strokeIdx: number, u: number) => {
      const stroke = DEFAULT_GLYPH[strokeIdx];
      const total = stroke.length - 1;
      const segf = clamp(u, 0, 1) * total;
      const i = Math.min(Math.floor(segf), total - 1);
      const f = segf - i;
      const a = stroke[i];
      const b = stroke[i + 1];
      return {
        x: bx + pad + (a.x + (b.x - a.x) * f) * gw,
        y: by + pad + (a.y + (b.y - a.y) * f) * gh,
      };
    };

    const render = (ms: number) => {
      const cyc = (ms % DUR) / DUR;
      ctx.clearRect(0, 0, W, H);
      drawScene(ctx, W, H, { margin: 8 });
      drawCopybook(ctx, bx, by, CW, CH);

      // 幽灵笔逐笔描画范字骨架（每笔占循环的一段）
      const nStrokes = DEFAULT_GLYPH.length;
      const sp = (cyc * nStrokes) % nStrokes;
      const strokeIdx = Math.floor(sp);
      const u = sp - strokeIdx;

      // 已描过的笔段（淡虚线）
      for (let sIdx = 0; sIdx < strokeIdx; sIdx++) {
        const pts = [0.05, 0.25, 0.5, 0.75, 0.95].map((f) => glyphPt(sIdx, f));
        drawGhostPath(ctx, pts, { color: PALETTE.muted, width: 2, alpha: 0.45 });
      }
      // 当前笔：进度虚线
      const steps = Math.max(2, Math.round(u * 24));
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i++) pts.push(glyphPt(strokeIdx, (i / 24) * u));
      drawGhostPath(ctx, pts, { color: PALETTE.blue, width: 2 });

      // 毛笔悬在幽灵笔迹上方 20px，跟随移动
      if (pts.length > 0) {
        const tip = pts[pts.length - 1];
        drawBrush(ctx, tip.x, tip.y - 20, 0.12, 30);
      }

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

  return <canvas id="cv-ana-ch2" ref={canvasRef} width={W} height={H} />;
};

export default AnaCh2Read;
