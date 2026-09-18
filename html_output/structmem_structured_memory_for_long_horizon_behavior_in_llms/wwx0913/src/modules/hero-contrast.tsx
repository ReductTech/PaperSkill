import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  COL,
  clearScene,
  drawPhoto,
  drawPage,
  drawTag,
  drawArrow,
  label,
} from './sceneKit';
import type { WidgetProps } from './registry';

// Hero 两栏对照画布。
// 左栏（moduleId === 'old'）：传统记忆——照片各自成条，彼此之间没有任何连接。
// 右栏（moduleId === 'new'）：StructMem——每张照片盖上时间戳、连成一串，
//   再由一次「通过 llm 调用」的跨事件合成，把这一块归纳成下面的一页小结。

const W = 460;
const H = 200;

const SCATTER: { x: number; y: number; tilt: number }[] = [
  { x: 34, y: 44, tilt: -0.1 },
  { x: 128, y: 88, tilt: 0.07 },
  { x: 214, y: 40, tilt: -0.04 },
  { x: 300, y: 96, tilt: 0.11 },
  { x: 358, y: 46, tilt: -0.08 },
];

// 右栏：三张带文字时间戳的照片
const ROW_X0 = 32;
const ROW_STEP = 156;
const ROW_Y = 10;
const CARD_W = 84;
const CARD_H = 52;
const DATES = ['2026-09-02', '2026-09-07', '2026-09-11'];

// 这一块的分组托架 → 垂直连线 → 下面的一页小结
const BRACKET_Y = 92;
const CONNECT_X = 230;
const SUMMARY_Y = 118;

export const HeroContrast: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isNew = moduleId === 'new';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (t: number) => {
      clearScene(ctx, W, H, true);
      const phase = (Math.sin(t / 1600) + 1) / 2;

      if (!isNew) {
        // 传统记忆：散落的单张，彼此之间没有任何连接。
        SCATTER.forEach((s, i) => {
          const drift = i === 4 ? Math.sin(t / 900) * 5 : 0;
          drawPhoto(ctx, s.x, s.y + drift, 70, 52, s.tilt, COL.red, COL.white);
        });
        drawTag(ctx, 150, 152, 160, 22, COL.red, false);
        label(ctx, '各自成条', 230, 168, COL.red, 'center', 18);
      } else {
        // 1) 三张照片：每张旁边写一个文字时间戳，相邻之间连起来
        for (let i = 0; i < 3; i += 1) {
          const px = ROW_X0 + i * ROW_STEP;
          const py = ROW_Y;
          drawPhoto(ctx, px, py, CARD_W, CARD_H, -0.03 + i * 0.014, COL.axis, COL.white);
          // 内容行（蓝）与关系行（紫）
          ctx.fillStyle = COL.blue;
          ctx.fillRect(px + 10, py + 22, 44, 3);
          ctx.fillStyle = COL.purple;
          ctx.fillRect(px + 10, py + 30, 30, 3);
          // 时间戳：文字写在照片正下方，橙色
          label(ctx, DATES[i], px + CARD_W / 2, py + CARD_H + 17, COL.orange, 'center', 14);
          // 相邻照片连起来（绿）
          if (i > 0) {
            const prevRight = ROW_X0 + (i - 1) * ROW_STEP + CARD_W;
            ctx.strokeStyle = COL.green;
            ctx.lineWidth = 2 + phase;
            ctx.beginPath();
            ctx.moveTo(prevRight, py + CARD_H / 2);
            ctx.lineTo(px - 2, py + CARD_H / 2);
            ctx.stroke();
          }
        }

        // 2) 分组托架：表示「这一块」将一起被归纳
        ctx.save();
        ctx.strokeStyle = COL.dark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ROW_X0, BRACKET_Y - 7);
        ctx.lineTo(ROW_X0, BRACKET_Y);
        ctx.lineTo(ROW_X0 + 2 * ROW_STEP + CARD_W, BRACKET_Y);
        ctx.lineTo(ROW_X0 + 2 * ROW_STEP + CARD_W, BRACKET_Y - 7);
        ctx.stroke();
        ctx.restore();

        // 3) 跨事件合成的调用连线：标出「通过 llm 调用」
        const pulse = 2 + phase * 1.5;
        drawArrow(ctx, CONNECT_X, BRACKET_Y + 4, CONNECT_X, SUMMARY_Y - 6, COL.purple, 8);
        ctx.save();
        ctx.strokeStyle = COL.purple;
        ctx.lineWidth = pulse;
        ctx.beginPath();
        ctx.arc(CONNECT_X, BRACKET_Y + 4, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        label(ctx, '通过llm调用', CONNECT_X + 12, (BRACKET_Y + SUMMARY_Y) / 2 + 5, COL.purple, 'left', 15);

        // 4) 下面的一页小结
        drawPage(ctx, 118, SUMMARY_Y, 224, 62, COL.route, 3);
        ctx.fillStyle = COL.green;
        ctx.fillRect(118, SUMMARY_Y, 5, 62);
        label(ctx, '小结', 126, SUMMARY_Y - 6, COL.green, 'left', 15);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(performance.now());
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
  }, [isNew]);

  return (
    <canvas id={`cv-hero-${moduleId}`} ref={canvasRef} width={W} height={H} aria-label="记忆范式对照" />
  );
};

export default HeroContrast;
