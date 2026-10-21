import React from 'react';
import {
  clearScene,
  drawFader,
  drawMeter,
  drawTape,
  drawKnob,
  drawHand,
  drawBar,
  drawTarget,
  drawSceneLabel,
  AQ,
  useAwqCanvas,
} from './awq-kit';

const W = 560;
const H = 140;

function faderRow(
  ctx: CanvasRenderingContext2D,
  n: number,
  y: number,
  h: number,
  x0: number,
  gap: number,
  opts: (i: number) => { salient?: boolean; clipped?: boolean; level?: number } = () => ({})
): void {
  for (let i = 0; i < n; i++) {
    const o = opts(i);
    drawFader(ctx, x0 + i * gap, y, h, o.level ?? 0.4 + ((i * 7) % 10) / 20, o);
  }
}

function drawChapter(ch: string, ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const p = (t % 3) / 3;
  switch (ch) {
    case 'chap-1': {
      clearScene(ctx, w, h);
      faderRow(ctx, 12, 26, 82, 40, 38, (i) => (i < Math.floor(p * 12) ? { level: 0.8 } : { level: 0.2 }));
      const bounce = Math.abs(Math.sin(p * Math.PI * 6)) * 14;
      drawFader(ctx, 500 + bounce, 26, 82, 0.6, { clipped: true });
      if (p > 0.85) {
        drawTarget(ctx, 505, 40, 10);
        drawSceneLabel(ctx, 460, 130, '装得下', AQ.green, 13);
      }
      break;
    }
    case 'chap-2': {
      clearScene(ctx, w, h);
      faderRow(ctx, 12, 30, 78, 40, 38, (i) => ({ salient: i === 3 || i === 8, level: i === 3 || i === 8 ? 0.9 : 0.3 }));
      const fx = 40 + p * 420;
      drawHand(ctx, fx, 124, 16, -0.5);
      drawMeter(ctx, 380, 26, 150, 12, 0.2 + Math.abs(Math.sin(t * 4)) * 0.7, {});
      break;
    }
    case 'chap-3': {
      clearScene(ctx, w, h);
      faderRow(ctx, 12, 30, 78, 40, 38, (i) => ({ salient: i === 2 || i === 6, level: 0.85 }));
      for (const i of [2, 6]) {
        const y = 20 + Math.abs(Math.sin(t * 2)) * 10;
        ctx.fillStyle = AQ.orange;
        ctx.beginPath();
        ctx.arc(40 + i * 38, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      drawSceneLabel(ctx, 440, 70, '保护 1%', AQ.orange, 14);
      break;
    }
    case 'chap-4': {
      clearScene(ctx, w, h);
      const n = 8;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = AQ.border;
        ctx.fillRect(60 + i * 50, 40, 4, 70);
        ctx.fillStyle = AQ.orange;
        ctx.fillRect(60 + i * 50, 100 + (i % 3) * 3, 26, 6);
      }
      const step = Math.floor(p * n);
      drawKnob(ctx, 470, 70, 30, (step / n) * Math.PI * 1.5 - Math.PI * 0.75);
      drawSceneLabel(ctx, 60, 130, '档位', AQ.muted, 12);
      break;
    }
    case 'chap-5': {
      clearScene(ctx, w, h);
      drawFader(ctx, 150, 26, 86, 0.35 + p * 0.5, { salient: true });
      drawFader(ctx, 230, 26, 86, 0.7 - p * 0.5, {});
      drawMeter(ctx, 330, 40, 180, 14, 0.7, {});
      drawSceneLabel(ctx, 330, 78, '输出不变', AQ.green, 13);
      break;
    }
    case 'chap-6': {
      clearScene(ctx, w, h);
      const k = 6;
      for (let i = 0; i < k; i++) {
        const on = i === Math.floor(p * k);
        drawFader(ctx, 90 + i * 60, 34, 74, 0.3 + i * 0.12, { salient: on });
      }
      if (p > 0.6) drawTarget(ctx, 270, 28, 10);
      drawSceneLabel(ctx, 90, 130, '试几档', AQ.muted, 12);
      break;
    }
    case 'chap-7': {
      clearScene(ctx, w, h);
      drawTape(ctx, 60, 40, 130, 70, { levels: 4, fill: 0.5 });
      const x = 230 + p * 160;
      drawTape(ctx, x, 40, 130, 70, { levels: 4, fill: 0.5 });
      ctx.strokeStyle = AQ.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(200, 75);
      ctx.lineTo(225, 75);
      ctx.stroke();
      drawMeter(ctx, 400, 60, 130, 12, 0.75, {});
      break;
    }
    case 'chap-8': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 5; i++) {
        drawBar(ctx, 40 + i * 6, 34 + i * 14, 150 - i * 10, 8, 0.8, AQ.blue);
      }
      ctx.strokeStyle = AQ.tape;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(200, 70);
      ctx.lineTo(300, 70);
      ctx.stroke();
      drawTape(ctx, 310, 40, 200, 70, { levels: 4, fill: 0.6 });
      ctx.fillStyle = AQ.orange;
      ctx.beginPath();
      ctx.arc(350 + (p * 120) % 120, 60, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'chap-9': {
      clearScene(ctx, w, h);
      drawTape(ctx, 60, 45, 140, 64, { levels: 2, fill: 0.4 });
      drawTape(ctx, 250, 55, 110, 50, { levels: 2, fill: 0.6 });
      drawBar(ctx, 400, 50, 120, 12, 0.3, AQ.purple);
      drawSceneLabel(ctx, 400, 88, '再压一档', AQ.purple, 13);
      break;
    }
    case 'chap-10':
    default: {
      clearScene(ctx, w, h);
      const tilt = Math.sin(t * 1.4) * 0.16;
      ctx.save();
      ctx.translate(280, 66);
      ctx.rotate(tilt);
      ctx.strokeStyle = AQ.tape;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-130, 0);
      ctx.lineTo(130, 0);
      ctx.stroke();
      drawTape(ctx, -128, -54, 110, 48, { levels: 6, fill: 1, color: AQ.red });
      drawTape(ctx, 24, -54, 96, 44, { levels: 3, fill: 0.4, color: AQ.green });
      ctx.restore();
      drawSceneLabel(ctx, 280, 128, '大而慢 / 小而快', AQ.muted, 12, 'center');
      break;
    }
  }
}

export const AwqAnalogy: React.FC<{ chapterId: string; moduleId: string }> = ({ chapterId }) => {
  const ref = useAwqCanvas((ctx, w, h, t) => drawChapter(chapterId, ctx, w, h, t), W, H);
  return <canvas id={`cv-ana-${chapterId}`} ref={ref} width={W} height={H} />;
};

export default AwqAnalogy;
