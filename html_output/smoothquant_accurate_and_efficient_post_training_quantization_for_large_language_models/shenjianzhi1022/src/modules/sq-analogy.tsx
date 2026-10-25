import React from 'react';
import {
  clearScene,
  drawPole,
  drawPerson,
  drawBasket,
  drawRock,
  drawBalance,
  drawGrid,
  drawBar,
  drawTarget,
  drawSceneLabel,
  SQ,
  useSqCanvas,
} from './sq-kit';

const W = 560;
const H = 140;

function drawChapter(ch: string, ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const p = (t % 3) / 3;
  switch (ch) {
    case 'chap-1': {
      clearScene(ctx, w, h);
      const tilt = 0.16 + Math.sin(t * 2.4) * 0.02;
      drawPerson(ctx, 280, 60, 48, tilt);
      drawPole(ctx, 130, 34, 300, tilt, { leftRocks: 3, rightRocks: 2, leftOutlier: true });
      drawBar(ctx, 30, 16, 500, 8, 1, SQ.red);
      drawSceneLabel(ctx, 30, 12, '挑不稳', SQ.red, 11);
      break;
    }
    case 'chap-2': {
      clearScene(ctx, w, h);
      drawBasket(ctx, 90, 56, 120, 52, { highlight: true });
      drawBasket(ctx, 350, 56, 120, 52, {});
      for (let i = 0; i < 5; i++) drawRock(ctx, 120 + i * 16, 66 + (i % 2) * 10, 5, {});
      drawRock(ctx, 150, 58, 15, { outlier: true });
      drawRock(ctx, 178, 62, 13, { outlier: true });
      drawSceneLabel(ctx, 120, 124, '固定通道', SQ.red, 12);
      break;
    }
    case 'chap-3': {
      clearScene(ctx, w, h);
      const move = Math.min(1, p * 1.6);
      drawPerson(ctx, 280, 60, 48, 0.16 * (1 - move));
      drawPole(ctx, 130, 34, 300, 0.16 * (1 - move), {
        leftRocks: Math.max(1, 4 - Math.floor(move * 3)),
        rightRocks: 2 + Math.floor(move * 3),
        leftOutlier: move < 0.5,
      });
      drawSceneLabel(ctx, 30, 120, '搬到后筐', SQ.orange, 12);
      break;
    }
    case 'chap-4': {
      clearScene(ctx, w, h);
      drawPole(ctx, 130, 34, 300, 0, { leftRocks: 4, rightRocks: 4, leftHighlight: true, rightHighlight: true });
      ctx.strokeStyle = SQ.orange;
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const x = 190 + i * 20 + Math.sin(t * 2 + i) * 6;
        ctx.beginPath();
        ctx.moveTo(x, 44);
        ctx.lineTo(x + 60, 44);
        ctx.stroke();
      }
      drawSceneLabel(ctx, 190, 120, '等价交换', SQ.orange, 12);
      break;
    }
    case 'chap-5': {
      clearScene(ctx, w, h);
      const alpha = 0.5 + Math.sin(t * 1.4) * 0.35;
      drawPerson(ctx, 280, 60, 48, (alpha - 0.5) * 0.6);
      drawPole(ctx, 130, 34, 300, (alpha - 0.5) * 0.6, { leftRocks: 4, rightRocks: 4 });
      drawBalance(ctx, 280, 116, 160, (alpha - 0.5) * 0.6, Math.abs(alpha - 0.5) < 0.12);
      break;
    }
    case 'chap-6': {
      clearScene(ctx, w, h);
      drawBasket(ctx, 140, 56, 120, 52, { highlight: true });
      drawBasket(ctx, 300, 56, 120, 52, {});
      drawGrid(ctx, 142, 58, 116, 48, 2, 3);
      drawGrid(ctx, 302, 58, 116, 48, 1, 4);
      drawSceneLabel(ctx, 140, 124, '分格', SQ.purple, 12);
      break;
    }
    case 'chap-7': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 6; i++) {
        drawRock(ctx, 150 + i * 22, 60 + Math.sin(i) * 4, 6, {});
      }
      ctx.strokeStyle = SQ.green;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(140, 90);
      ctx.lineTo(300, 90);
      ctx.stroke();
      drawPerson(ctx, 380, 60, 44, 0);
      drawSceneLabel(ctx, 150, 124, '出发前分好', SQ.green, 12);
      break;
    }
    case 'chap-8': {
      clearScene(ctx, w, h);
      drawBasket(ctx, 80, 56, 110, 50, { highlight: true });
      drawBasket(ctx, 360, 56, 110, 50, {});
      drawRock(ctx, 110, 64, 12, { outlier: true });
      drawRock(ctx, 390, 66, 6, {});
      drawGrid(ctx, 240, 50, 80, 60, 3, 3);
      drawSceneLabel(ctx, 240, 124, '重活 INT8', SQ.purple, 12);
      break;
    }
    case 'chap-9': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 4; i++) {
        drawBasket(ctx, 40 + i * 70, 70, 54, 34, {});
      }
      drawPole(ctx, 40, 52, 250, 0, { leftRocks: 2, rightRocks: 2 });
      drawBar(ctx, 320, 60, 190, 12, 0.5, SQ.green);
      drawSceneLabel(ctx, 320, 50, '530B', SQ.green, 12);
      break;
    }
    case 'chap-10':
    default: {
      clearScene(ctx, w, h);
      const prog = p;
      const x1 = 30 + prog * 200;
      const x2 = 30 + Math.min(1, prog * 1.35) * 200;
      drawPole(ctx, 30, 34, 120, 0.16, { leftRocks: 3, rightRocks: 2, leftOutlier: true });
      drawPole(ctx, 300, 34, 120, 0, { leftRocks: 3, rightRocks: 3 });
      drawBar(ctx, 30, 92, 200, 8, (x1 - 30) / 200, SQ.red);
      drawBar(ctx, 300, 92, 200, 8, (x2 - 30) / 200, SQ.green);
      if (prog > 0.85) drawTarget(ctx, 500, 40, 9);
      break;
    }
  }
}

export const SqAnalogy: React.FC<{ chapterId: string; moduleId: string }> = ({ chapterId }) => {
  const ref = useSqCanvas((ctx, w, h, t) => drawChapter(chapterId, ctx, w, h, t), W, H);
  return <canvas id={`cv-ana-${chapterId}`} ref={ref} width={W} height={H} />;
};

export default SqAnalogy;
