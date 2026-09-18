import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawOrderSheet, drawTargetMark, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 560, H = 140;

// §10 类比：评选会四幅同题画作，Ours 居首
export const Ana10: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const k = (Math.sin(t * 1.3) + 1) / 2;
      const vals = [0.45, 0.62, 0.66, 0.95];
      vals.forEach((v, i) => {
        const x = 40 + i * 128;
        ctx.strokeStyle = i === 3 ? C.orange : C.border;
        ctx.lineWidth = i === 3 ? 3 : 1.5;
        ctx.strokeRect(x, 30, 90, 70);
        ctx.fillStyle = i === 3 ? C.orange : C.muted;
        const hh = v * 56 * (0.8 + 0.2 * k);
        ctx.fillRect(x + 20, 94 - hh, 50, hh);
      });
      drawTargetMark(ctx, 470, 22, true);
      drawSceneLabel(ctx, '基版 / 官方PE / 匹配NL / Ours', 40, 120, true);
      drawSceneLabel(ctx, '画室评选会', 24, 14);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" style={{ maxWidth: '100%' }} />;
};
