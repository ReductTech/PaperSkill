import React, { useEffect, useRef } from 'react';
import { setupCanvas, runLoop, clearScene, drawApprentice, drawSceneLabel, C } from './studioKit';
import type { WidgetProps } from './registry';

const W = 560, H = 140;

// §9 类比：三段修行 + 师父批改
export const Ana9: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const stop = runLoop(canvas, ctx, (t) => {
      clearScene(ctx, W, H);
      const phase = Math.floor(t * 0.8) % 3;
      const labels = ['临摹（SFT）', '听讲（冷启动）', '自练（RFT）'];
      drawApprentice(ctx, 120, 112, phase === 0 ? -1.1 : phase === 1 ? -0.2 : -0.7);
      // 师父在第三段出现
      if (phase === 2) {
        ctx.fillStyle = C.green;
        ctx.beginPath(); ctx.arc(300, 70, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.green; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(300, 78); ctx.lineTo(300, 108); ctx.stroke();
        drawSceneLabel(ctx, '师父批改：只收对的', 260, 128);
      }
      drawSceneLabel(ctx, labels[phase], 60, 24);
      drawSceneLabel(ctx, '被接受的轨迹 → 逐字蒸馏', 300, 24, true);
    });
    return stop;
  }, []);
  return <canvas ref={ref} className="ana-canvas" style={{ maxWidth: '100%' }} />;
};
