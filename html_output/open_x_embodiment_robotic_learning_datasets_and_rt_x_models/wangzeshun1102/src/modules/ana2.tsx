import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import {
  AUX,
  BAD,
  clearScene,
  drawLegend,
  drawSceneLabel,
  GUIDE,
  LINE,
  MUTED,
  OK,
  PAINT,
} from './drivingKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 140;
const DURATION = 3400;

const PHASE_TEXT = [
  '60 个数据集来自 34 个实验室，各家的动作空间和传感器配置都不一样。',
  '先把动作空间对齐，再把 RGB、深度相机、点云等观测模态对齐。',
  '统一成 RLDS 后，成绩（数据）才能互认，放进同一条训练管线。',
];

export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const drawCard = (
      x: number,
      y: number,
      w: number,
      h: number,
      band: string,
      lines: number,
      mark: string,
      alpha: number
    ) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
      ctx.fillStyle = band;
      ctx.fillRect(x + 4, y + 4, w - 8, 12);
      ctx.fillStyle = LINE;
      for (let i = 0; i < lines; i++) ctx.fillRect(x + 6, y + 26 + i * 9, w - 16, 3);
      ctx.strokeStyle = mark;
      ctx.lineWidth = 2.5;
      if (mark === BAD) {
        ctx.beginPath();
        ctx.moveTo(x + w - 20, y + h - 20);
        ctx.lineTo(x + w - 8, y + h - 8);
        ctx.moveTo(x + w - 8, y + h - 20);
        ctx.lineTo(x + w - 20, y + h - 8);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x + w - 22, y + h - 14);
        ctx.lineTo(x + w - 16, y + h - 8);
        ctx.lineTo(x + w - 6, y + h - 20);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const render = (now: number) => {
      const t = ((now - t0) % DURATION) / DURATION;
      const nextPhase = t < 0.4 ? 0 : t < 0.7 ? 1 : 2;
      if (nextPhase !== phaseRef.current) {
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
      }

      clearScene(ctx, W, H);

      const leftX = [28, 90, 152];
      const bands = [PAINT, AUX, MUTED];
      const lineCounts = [3, 4, 3];
      const templateX = 246;
      const templateY = 32;
      const rightX = [364, 426, 488];
      const pB = clamp((t - 0.4) / 0.3, 0, 1);
      const pC = clamp((t - 0.7) / 0.3, 0, 1);

      // 各地格式不一的原始成绩单
      for (let i = 0; i < leftX.length; i++) {
        const alpha = clamp((t - i * 0.06) / 0.15, 0, 1);
        drawCard(leftX[i], 38, 54, 72, bands[i], lineCounts[i], BAD, alpha);
      }

      // 左边成绩单向统一模板汇聚
      if (pB > 0) {
        ctx.globalAlpha = pB;
        ctx.strokeStyle = MUTED;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        for (let i = 0; i < leftX.length; i++) {
          const y = 74 + (i - 1) * 8;
          ctx.beginPath();
          ctx.moveTo(leftX[i] + 56, y);
          ctx.lineTo(templateX - 6, 74);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        drawCard(templateX, templateY, 68, 84, GUIDE, 4, OK, pB);
        const stampR = lerp(0, 17, pB);
        ctx.globalAlpha = pB;
        ctx.strokeStyle = OK;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(templateX + 34, templateY + 44, stampR, 0, Math.PI * 2);
        ctx.stroke();
        if (stampR > 10) {
          ctx.beginPath();
          ctx.moveTo(templateX + 26, templateY + 44);
          ctx.lineTo(templateX + 32, templateY + 51);
          ctx.lineTo(templateX + 43, templateY + 37);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // 统一后互相认可的成绩单
      if (pC > 0) {
        ctx.globalAlpha = pC;
        ctx.strokeStyle = MUTED;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        for (let i = 0; i < rightX.length; i++) {
          ctx.beginPath();
          ctx.moveTo(templateX + 72, 74);
          ctx.lineTo(rightX[i] - 6, 74 + (i - 1) * 8);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        for (let i = 0; i < rightX.length; i++) {
          const alpha = clamp((pC - i * 0.12) / 0.4, 0, 1);
          drawCard(rightX[i], 38, 54, 72, GUIDE, 3, OK, alpha);
        }
      }

      // 标签（最多两个）
      ctx.globalAlpha = 1 - clamp((t - 0.45) / 0.2, 0, 1);
      drawSceneLabel(ctx, '科目各异', 20, 22, PAINT);
      ctx.globalAlpha = clamp((t - 0.65) / 0.2, 0, 1);
      drawSceneLabel(ctx, '成绩互认', 424, 22, OK);
      ctx.globalAlpha = 1;

      // 图例（三项）
      drawLegend(
        ctx,
        [
          { color: PAINT, text: '原始' },
          { color: GUIDE, text: '统一' },
          { color: OK, text: '认可' },
        ],
        210,
        20
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

export default Ana2;
