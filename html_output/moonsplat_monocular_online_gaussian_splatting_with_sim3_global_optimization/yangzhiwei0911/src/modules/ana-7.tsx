import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad, easeSpring } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 类比动画：手捏住缝线末端收紧，布面由松垮起皱变平整，再收紧则起新褶，
// 随后弹性松回初始松垮状态，首尾无缝，自动循环。

const W = 560;
const H = 140;
const CYCLE = 4.0;
const TOP = 44;
const BOT = 96;
const LEFT = 40;
const RIGHT = 520;
const MID_Y = (TOP + BOT) / 2;

function drawBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 20; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 20; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
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

    const t0 = performance.now();

    const render = (t: number) => {
      const ph = (t / CYCLE) % 1;
      let tight: number;
      if (ph < 0.32) {
        tight = easeInOutQuad(ph / 0.32);
      } else if (ph < 0.46) {
        tight = 1;
      } else if (ph < 0.78) {
        tight = lerp(1, 1.7, easeInOutQuad((ph - 0.46) / 0.32));
      } else {
        tight = lerp(1.7, 0, easeSpring((ph - 0.78) / 0.22));
      }

      const sag = clamp(1 - tight, 0, 1);
      const pinch = clamp(tight - 1, 0, 1);

      drawBackdrop(ctx);

      // 布带
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(LEFT, TOP, RIGHT - LEFT, BOT - TOP);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(LEFT, BOT - 4, RIGHT - LEFT, 4);

      // 布面纹理：稀疏短划线，极低对比度
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 1;
      for (let x = LEFT + 20; x <= RIGHT - 20; x += 38) {
        ctx.beginPath();
        ctx.moveTo(x, TOP + 8);
        ctx.lineTo(x + 7, TOP + 8);
        ctx.moveTo(x + 15, BOT - 10);
        ctx.lineTo(x + 22, BOT - 10);
        ctx.stroke();
      }
      ctx.restore();

      // 松垮时的斜纹：固定数量、透明度随松垮度平滑变化
      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#76906a';
      for (let i = 0; i < 12; i += 1) {
        const x = LEFT + 18 + ((RIGHT - LEFT - 36) * (i + 0.5)) / 12;
        ctx.globalAlpha = sag * (0.5 + 0.4 * Math.abs(Math.sin(i * 1.6)));
        ctx.beginPath();
        ctx.moveTo(x - 6, TOP + 7);
        ctx.lineTo(x + 6, BOT - 7);
        ctx.stroke();
      }
      ctx.restore();

      // 过紧时的新褶
      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#f07e47';
      for (let i = 0; i < 10; i += 1) {
        const x = LEFT + 26 + ((RIGHT - LEFT - 52) * (i + 0.5)) / 10;
        ctx.globalAlpha = pinch * (0.5 + 0.4 * Math.abs(Math.sin(i * 2.2)));
        ctx.beginPath();
        ctx.moveTo(x, TOP + 5);
        ctx.lineTo(x - 3, BOT - 5);
        ctx.stroke();
      }
      ctx.restore();

      // 缝线：越松越弯，收紧后趋于平直，针脚为小斜线
      const wav = sag * 5 + pinch * 2.5;
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = LEFT + 8; x <= RIGHT - 8; x += 4) {
        const y = MID_Y + wav * Math.sin(x * 0.06 + t * 2.2);
        if (x === LEFT + 8) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.save();
      ctx.lineWidth = 1.5;
      for (let x = LEFT + 26; x <= RIGHT - 26; x += 26) {
        const y = MID_Y + wav * Math.sin(x * 0.06 + t * 2.2);
        ctx.globalAlpha = 0.5 + 0.35 * Math.abs(Math.sin(x * 0.11));
        ctx.beginPath();
        ctx.moveTo(x - 2, y - 5);
        ctx.lineTo(x + 2, y + 5);
        ctx.stroke();
      }
      ctx.restore();

      // 手：捏住线端随张力右移，带呼吸浮动
      const handX = 468 + tight * 30;
      const handY = MID_Y + Math.sin(t * 4.2) * 1.3;
      ctx.fillStyle = '#d7deea';
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(handX + 14, handY, 20, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(handX + 2, handY - 8);
      ctx.lineTo(handX - 12, handY - 3);
      ctx.moveTo(handX + 2, handY + 8);
      ctx.lineTo(handX - 12, handY + 3);
      ctx.stroke();

      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('布面', LEFT + 4, TOP - 12);
      ctx.fillText('缝线', RIGHT - 46, TOP - 12);
    };

    const tick = () => {
      render((performance.now() - t0) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
};

export default Ana7;
