import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { SCENE, drawKettle, drawSharePot, drawCounter } from './pots-kit';

// §8 分杯品鉴：同一只壶先停在左边一杯上方注满，再挪到右边一杯上方注满，最后两杯齐平。
// 注意：壶在移动途中不出水——否则水流会被从原位硬拉到远处的杯子。
const W = 560;
const H = 140;

export const TwoCupAna: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const CUP_Y = 62;
    const CUP_H = 52;
    const CUP1 = 150;
    const CUP2 = 386;
    const KETTLE_OFFSET = 44; // 壶身中心相对杯子中心的水平偏移，让壶嘴正对杯子

    const render = (time: number) => {
      const t = (time % 4200) / 4200;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = SCENE.bg;
      ctx.fillRect(0, 0, W, H);
      drawCounter(ctx, W, 124);

      // 三段式时间轴：注左杯 → 移动（不出水）→ 注右杯
      const T_POUR1_END = 0.38;
      const T_MOVE_END = 0.54;

      let kx: number;
      let pouring: boolean;
      let targetX: number;
      if (t < T_POUR1_END) {
        kx = CUP1 + KETTLE_OFFSET;
        pouring = true;
        targetX = CUP1;
      } else if (t < T_MOVE_END) {
        const m = (t - T_POUR1_END) / (T_MOVE_END - T_POUR1_END);
        const ease = m < 0.5 ? 2 * m * m : 1 - Math.pow(-2 * m + 2, 2) / 2;
        kx = CUP1 + KETTLE_OFFSET + ease * (CUP2 - CUP1);
        pouring = false;
        targetX = CUP1;
      } else {
        kx = CUP2 + KETTLE_OFFSET;
        pouring = true;
        targetX = CUP2;
      }

      // 两杯液面：左杯先满，右杯后满
      const p1 = t < T_MOVE_END ? Math.min(1, t / T_POUR1_END) : 1;
      const p2 = t <= T_MOVE_END ? 0 : Math.min(1, (t - T_MOVE_END) / (1 - T_MOVE_END));
      drawSharePot(ctx, CUP1, CUP_Y, 54, CUP_H, {
        ratio: p1 * 0.78,
        color: 'rgba(111,74,47,0.85)',
      });
      drawSharePot(ctx, CUP2, CUP_Y, 54, CUP_H, {
        ratio: p2 * 0.78,
        color: 'rgba(111,74,47,0.85)',
      });

      // 壶
      const tip = drawKettle(ctx, kx, 34, 18, -0.62, SCENE.blue);

      // 只有停稳时才出水，且水柱几乎垂直落进正下方那只杯
      if (pouring) {
        const wobble = pouring ? 1 : 0;
        ctx.strokeStyle = SCENE.bean;
        ctx.lineCap = 'round';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tip.tipX, tip.tipY);
        ctx.quadraticCurveTo((tip.tipX + targetX) / 2, tip.tipY + 8, targetX, CUP_Y - 4);
        ctx.stroke();
        // 液面涟漪
        ctx.strokeStyle = `rgba(111,74,47,${0.35 + 0.25 * Math.abs(Math.sin(t * Math.PI * 8)) * wobble})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(targetX, CUP_Y + 4, 20, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 齐平参考线
      ctx.strokeStyle = SCENE.green;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(CUP1 - 62, CUP_Y + 12);
      ctx.lineTo(CUP2 + 62, CUP_Y + 12);
      ctx.stroke();

      ctx.fillStyle = SCENE.green;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('两杯对照', 20, 24);
    };

    const tick = () => {
      render(performance.now());
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return <canvas id="cv-two-cup-ana" ref={canvasRef} width={W} height={H} />;
};

export default TwoCupAna;
