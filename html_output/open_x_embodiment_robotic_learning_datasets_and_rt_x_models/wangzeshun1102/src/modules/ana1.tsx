import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  clearScene,
  drawDriver,
  drawLegend,
  drawLicense,
  drawSceneLabel,
  drawVehicle,
  GUIDE,
  MUTED,
  OK,
  PAINT,
} from './drivingKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const DURATION = 3200;

const PHASE_TEXT = [
  '过去，每种车型都要单独考证：一个司机、一本驾照，只能开一种车。',
  '把各家的考试科目与记分标准统一起来，成绩才能互认。',
  '一本通用驾照：一主体（司机）、一动作（上车驾驶）、一目标（把车开走）。',
];

export const Ana1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const t0 = performance.now();

    const render = (now: number) => {
      const elapsed = (now - t0) % DURATION;
      const t = elapsed / DURATION;
      const nextPhase = t < 0.4 ? 0 : t < 0.7 ? 1 : 2;
      if (nextPhase !== phaseRef.current) {
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
      }

      clearScene(ctx, W, H);

      // 地面
      ctx.strokeStyle = '#c9d4bd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, 118);
      ctx.lineTo(W - 20, 118);
      ctx.stroke();

      const stationX = [80, 180, 280];
      const kinds = ['sedan', 'truck', 'van'];
      const merge = clamp((t - 0.4) / 0.3, 0, 1);
      const stationFade = t < 0.55 ? 1 : clamp(1 - (t - 0.55) / 0.15, 0, 1);
      const finalAlpha = clamp((t - 0.7) / 0.12, 0, 1);

      // 三个独立考点：车、司机、各自的驾照
      for (let i = 0; i < stationX.length; i++) {
        const x = stationX[i];
        ctx.globalAlpha = stationFade;
        drawVehicle(ctx, x, 118, kinds[i], 0.7, PAINT);
        drawDriver(ctx, x, 92, 0.8, GUIDE);
        ctx.strokeStyle = MUTED;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(x - 40, 48, 80, 72);
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // 驾照向中央汇聚
        const cx = lerp(x - 20, 366, merge);
        const cy = lerp(56, 46, merge);
        const cw = lerp(40, 76, merge);
        const ch = lerp(24, 36, merge);
        ctx.globalAlpha = 1 - merge;
        drawLicense(ctx, cx, cy, cw, ch, OK);
        ctx.globalAlpha = 1;
      }

      // 合并后的一本通用驾照
      if (merge > 0) {
        ctx.globalAlpha = merge;
        drawLicense(ctx, 366, 46, 76, 36, OK);
        ctx.globalAlpha = 1;
      }

      // 一名司机 + 多种车型
      if (finalAlpha > 0) {
        ctx.globalAlpha = finalAlpha;
        drawDriver(ctx, 330, 116, 1, GUIDE);
        drawVehicle(ctx, 420, 118, 'sedan', 0.45, PAINT);
        drawVehicle(ctx, 465, 118, 'truck', 0.45, PAINT);
        drawVehicle(ctx, 510, 118, 'van', 0.45, PAINT);
        ctx.globalAlpha = 1;
      }

      // 标签（最多两个）
      ctx.globalAlpha = 1 - clamp(t / 0.45, 0, 1);
      drawSceneLabel(ctx, '各考各的', 20, 26, PAINT);
      ctx.globalAlpha = clamp((t - 0.6) / 0.15, 0, 1);
      drawSceneLabel(ctx, '一本通开', 440, 26, OK);
      ctx.globalAlpha = 1;

      // 图例（三项）
      drawLegend(
        ctx,
        [
          { color: PAINT, text: '车型' },
          { color: GUIDE, text: '司机' },
          { color: OK, text: '驾照' },
        ],
        200,
        24
      );
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className={'feedback ' + (phase === 2 ? 'good' : '')}>{PHASE_TEXT[phase]}</div>
    </div>
  );
};

export default Ana1;
