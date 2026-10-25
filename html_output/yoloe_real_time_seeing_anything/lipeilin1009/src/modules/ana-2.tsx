import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { PALETTE, clearScene } from './birdKit';

// ana-2 — 把描述抄成卡片：气泡逐行浮现特征词，笔在卡片上逐行抄写（3.0s 循环）。

const W = 560;
const H = 140;
const WORDS = ['白头顶', '红喙', '爱在水边'];
// 卡片几何
const CX = 400; // 卡片左缘
const CY = 34; // 卡片顶缘
const CW = 72;
const CH = 62;
const LINE_X = CX + 10;
const LINE_W = CW - 20;

export const Ana2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const drawPen = (tipX: number, tipY: number) => {
      ctx.save();
      ctx.translate(tipX, tipY);
      // 笔杆（棕色，斜向右上方）
      ctx.strokeStyle = PALETTE.wood;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(14, -18);
      ctx.stroke();
      // 笔尖（蓝色）
      ctx.fillStyle = PALETTE.blue;
      ctx.beginPath();
      ctx.moveTo(-1, 1);
      ctx.lineTo(4, -4);
      ctx.lineTo(1, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const render = (now: number) => {
      const t = (now / 1000) % 3.0;
      clearScene(ctx, W, H);

      // 对话气泡：三行特征词依次出现（0.2s 起，每 0.6s 一行）
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = PALETTE.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(30, 14, 140, 72, 10);
      ctx.fill();
      ctx.stroke();
      // 气泡尾巴（贴在气泡左下角，不触地平线）
      ctx.beginPath();
      ctx.moveTo(56, 86);
      ctx.lineTo(64, 98);
      ctx.lineTo(76, 86);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.font = '13px sans-serif';
      WORDS.forEach((w, i) => {
        const appear = t > 0.2 + i * 0.6;
        ctx.globalAlpha = appear ? 1 : 0.15;
        ctx.fillStyle = PALETTE.ink;
        ctx.fillText('· ' + w, 46, 38 + i * 22);
      });
      ctx.restore();

      // 气泡 → 卡片的虚线导引
      ctx.save();
      ctx.strokeStyle = PALETTE.muted;
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(176, 50);
      ctx.quadraticCurveTo(290, 30, CX - 8, 52);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 卡片：白底 + 边框；三行“字迹”随书写进度增长（0.5s 起，每 0.7s 一行）
      const done = t > 2.6;
      ctx.save();
      if (done) {
        ctx.strokeStyle = PALETTE.green;
        ctx.lineWidth = 3;
        ctx.strokeRect(CX - 3, CY - 3, CW + 6, CH + 6);
      }
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = PALETTE.border;
      ctx.lineWidth = 1.5;
      ctx.fillRect(CX, CY, CW, CH);
      ctx.strokeRect(CX, CY, CW, CH);
      ctx.restore();

      // 书写行与笔的位置
      let penX = -1;
      let penY = -1;
      for (let i = 0; i < 3; i++) {
        const start = 0.5 + i * 0.7;
        const prog = clamp((t - start) / 0.45, 0, 1);
        if (prog <= 0) continue;
        const ly = CY + 16 + i * 18;
        const len = (LINE_W - (i === 2 ? 16 : 0)) * prog;
        ctx.save();
        ctx.strokeStyle = PALETTE.blue;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(LINE_X, ly);
        ctx.lineTo(LINE_X + len, ly);
        ctx.stroke();
        ctx.restore();
        if (prog < 1) {
          penX = LINE_X + len;
          penY = ly;
        }
      }
      if (penX >= 0) drawPen(penX, penY);
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

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />;
};

export default Ana2;
