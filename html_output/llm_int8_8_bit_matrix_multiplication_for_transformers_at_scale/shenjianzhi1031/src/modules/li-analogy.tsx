import React from 'react';
import {
  clearScene,
  drawBasin,
  drawGarment,
  drawHand,
  drawBottle,
  drawRuler,
  drawBar,
  drawTarget,
  drawSceneLabel,
  LI,
  useLiCanvas,
} from './li-kit';

const W = 560;
const H = 140;

function drawChapter(ch: string, ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const p = (t % 3) / 3;
  switch (ch) {
    case 'chap-1': {
      clearScene(ctx, w, h);
      drawBasin(ctx, 60, 44, 200, 76, { fill: 1 });
      for (let i = 0; i < 5; i++) drawGarment(ctx, 80 + (i % 3) * 50, 56 + Math.floor(i / 3) * 30, 36, 26, {});
      drawGarment(ctx, 120, 36 + Math.sin(t * 2) * 2, 70, 50, { big: true });
      drawBar(ctx, 290, 54, 220, 10, 1, LI.red);
      drawSceneLabel(ctx, 290, 44, '溢出', LI.red, 12);
      break;
    }
    case 'chap-2': {
      clearScene(ctx, w, h);
      drawBasin(ctx, 80, 50, 200, 70, { fill: 0.5 });
      for (let i = 0; i < 4; i++) drawGarment(ctx, 100 + i * 45, 62, 34, 26, {});
      drawHand(ctx, 330, 40, 14, -0.4);
      drawBottle(ctx, 360, 40, 20);
      for (let i = 0; i < 3; i++) drawSceneLabel(ctx, 320 + i * 30, 110, '量', LI.water, 12);
      break;
    }
    case 'chap-3': {
      clearScene(ctx, w, h);
      drawBottle(ctx, 30, 50, 24);
      for (let i = 0; i < 5; i++) drawGarment(ctx, 90 + i * 34, 64, 30, 24, {});
      drawGarment(ctx, 170, 50, 64, 46, { big: true });
      drawGarment(ctx, 245, 54, 56, 42, { big: true });
      drawHand(ctx, 330, 70, 14, 0);
      drawSceneLabel(ctx, 90, 124, '几件超大件', LI.red, 12);
      break;
    }
    case 'chap-4': {
      clearScene(ctx, w, h);
      drawBasin(ctx, 60, 48, 260, 80, { fill: 1 });
      for (let i = 0; i < 6; i++) drawGarment(ctx, 85 + (i % 3) * 55, 60 + Math.floor(i / 3) * 30, 38, 26, {});
      drawGarment(ctx, 150, 40, 80, 55, { big: true });
      drawSceneLabel(ctx, 380, 70, '还是露出来', LI.red, 13);
      break;
    }
    case 'chap-5': {
      clearScene(ctx, w, h);
      drawBasin(ctx, 40, 56, 180, 70, { fill: 0.5 });
      drawBasin(ctx, 330, 60, 120, 64, { fill: 0.4, highlight: true });
      drawRuler(ctx, 250, 40, 70, 0.5, { ok: true });
      drawGarment(ctx, 120, 44, 70, 50, { big: true });
      drawGarment(ctx, 370, 66, 50, 44, { big: true });
      drawSceneLabel(ctx, 40, 132, '主盆', LI.ink, 12);
      drawSceneLabel(ctx, 330, 132, '轻柔盆', LI.purple, 12);
      break;
    }
    case 'chap-6': {
      clearScene(ctx, w, h);
      drawBasin(ctx, 50, 56, 180, 70, { fill: 0.6 });
      drawBasin(ctx, 320, 60, 160, 66, { fill: 0.5, highlight: true });
      for (let i = 0; i < 4; i++) drawGarment(ctx, 70 + i * 38, 68, 30, 24, {});
      drawSceneLabel(ctx, 50, 132, '标准洗', LI.green, 12);
      drawSceneLabel(ctx, 320, 132, '轻柔洗', LI.purple, 12);
      break;
    }
    case 'chap-7': {
      clearScene(ctx, w, h);
      const hard = Math.sin(t * 2) > 0.3;
      drawBasin(ctx, 80, 56, 180, 70, { fill: 0.5 });
      drawGarment(ctx, 130, 62, 70, 50, { big: true });
      drawHand(ctx, 180, 40, 14, hard ? 0.25 : 0.0);
      drawSceneLabel(ctx, 300, 70, hard ? '力度过大' : '轻揉', hard ? LI.red : LI.green, 13);
      break;
    }
    case 'chap-8': {
      clearScene(ctx, w, h);
      drawBasin(ctx, 40, 56, 160, 68, { fill: 0.6 });
      drawBasin(ctx, 240, 56, 140, 68, { fill: 0.5, highlight: true });
      ctx.strokeStyle = LI.green;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(210, 90);
      ctx.lineTo(235, 90);
      ctx.stroke();
      drawHand(ctx, 400, 60, 13, 0);
      drawSceneLabel(ctx, 240, 132, '合在一起', LI.green, 12);
      break;
    }
    case 'chap-9': {
      clearScene(ctx, w, h);
      drawBasin(ctx, 30, 60, 150, 64, { fill: 0.5 });
      drawBasin(ctx, 210, 64, 110, 58, { fill: 0.4, highlight: true });
      drawGarment(ctx, 60, 70, 80, 46, { big: true });
      drawSceneLabel(ctx, 350, 80, '更小的房', LI.green, 12);
      break;
    }
    case 'chap-10':
    default: {
      clearScene(ctx, w, h);
      const prog = p;
      drawBasin(ctx, 40, 44, 130, 60, { fill: 0.5 });
      drawGarment(ctx, 60, 44, 80, 50, { big: true });
      drawBasin(ctx, 320, 44, 130, 60, { fill: 0.5, highlight: true });
      drawBar(ctx, 40, 112, 180, 8, prog, LI.red);
      drawBar(ctx, 320, 112, 180, 8, Math.min(1, prog * 1.3), LI.green);
      if (prog > 0.85) drawTarget(ctx, 500, 50, 9);
      break;
    }
  }
}

export const LiAnalogy: React.FC<{ chapterId: string; moduleId: string }> = ({ chapterId }) => {
  const ref = useLiCanvas((ctx, w, h, t) => drawChapter(chapterId, ctx, w, h, t), W, H);
  return <canvas id={`cv-ana-${chapterId}`} ref={ref} width={W} height={H} />;
};

export default LiAnalogy;
