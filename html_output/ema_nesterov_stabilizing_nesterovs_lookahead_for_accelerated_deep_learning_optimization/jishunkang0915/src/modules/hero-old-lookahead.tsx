import React, { useEffect, useRef } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRiver, drawCurrent, drawWaves, drawCanoe, drawLookaheadArrow, drawLabel, runLoop } from './river-kit';

// Hero contrast: old NAG lookahead (moduleId 'old') vs EMA lookahead ('new').
// Both panels animate on the same time basis from the same start state.

const W = 540;
const H = 280;

export const HeroLookahead: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isOld = moduleId !== 'new';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const stop = runLoop(canvas, (time) => {
      clearScene(ctx, W, H);
      const bend = 0.4;
      drawRiver(ctx, W, H, 0.35, bend);
      drawCurrent(ctx, W, H, time, 0.35, bend);
      const px = 120 + 30 * Math.sin(time * 2.2);
      const py = 150 + 26 * Math.sin(time * 4.5); // waves toss the hull
      const cyy = 158 + 4 * Math.sin(time * 2.2);
      if (isOld) {
        // arrow follows the latest wave, grows and points at the high bank
        const len = 60 + 55 * (0.5 + 0.5 * Math.sin(time * 2.2));
        drawLookaheadArrow(ctx, px, py, len, -Math.abs(0.35 * len), C.red, 4);
        drawWaves(ctx, px, py, time, C.red);
        drawCanoe(ctx, px, py, -0.12, C.red);
        drawLabel(ctx, '标准前瞻', 24, 40, C.red);
      } else {
        drawLookaheadArrow(ctx, px, cyy, 110, 6, C.green, 4);
        drawWaves(ctx, px, cyy, time, C.waterDeep);
        drawCanoe(ctx, px, cyy, 0.02, C.green);
        drawLabel(ctx, 'EMA 前瞻', 24, 40, C.green);
      }
    });
    return stop;
  }, [isOld]);

  return <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />;
};

export default HeroLookahead;

export const HeroOldLookahead: React.FC<WidgetProps> = (props) => <HeroLookahead {...props} moduleId="old" />;
export const HeroNewEma: React.FC<WidgetProps> = (props) => <HeroLookahead {...props} moduleId="new" />;
