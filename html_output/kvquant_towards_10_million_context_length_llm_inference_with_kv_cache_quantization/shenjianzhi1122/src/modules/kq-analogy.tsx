import React from 'react';
import {
  clearScene,
  drawCase,
  drawCube,
  drawHardBox,
  drawPouch,
  drawItem,
  drawScale,
  drawArrow,
  drawBar,
  drawTarget,
  drawSceneLabel,
  KQ,
  useKqCanvas,
} from './kq-kit';

const W = 560;
const H = 140;

function drawChapter(ch: string, ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const p = (t % 3) / 3;
  switch (ch) {
    case 'chap-1': {
      clearScene(ctx, w, h);
      drawCase(ctx, 40, 30, 180, 80, 1);
      for (let i = 0; i < 4; i++) drawItem(ctx, 55 + i * 40, 40, 34, 26, { big: i > 2 });
      drawItem(ctx, 120, 20, 70, 40, { big: true });
      drawBar(ctx, 260, 44, 250, 12, 1, KQ.red);
      drawSceneLabel(ctx, 260, 34, '箱盖合不上', KQ.red, 12);
      break;
    }
    case 'chap-2': {
      clearScene(ctx, w, h);
      drawCube(ctx, 50, 30, 180, 70, {});
      for (let i = 0; i < 4; i++) drawItem(ctx, 300 + i * 45, 40, 36, 40, {});
      drawSceneLabel(ctx, 50, 122, '分类清单', KQ.blue, 12);
      drawSceneLabel(ctx, 300, 122, '单件物品', KQ.blue, 12);
      break;
    }
    case 'chap-3': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 3; i++) drawCube(ctx, 50 + i * 60, 34, 48, 50, {});
      for (let i = 0; i < 3; i++) drawItem(ctx, 320 + i * 55, 40, 40, 40, {});
      drawSceneLabel(ctx, 50, 122, '按类别', KQ.green, 12);
      drawSceneLabel(ctx, 320, 122, '按件', KQ.green, 12);
      break;
    }
    case 'chap-4': {
      clearScene(ctx, w, h);
      drawItem(ctx, 60, 40, 60, 46, { big: true });
      drawArrow(ctx, 130, 62, 210, 62, KQ.orange);
      drawCube(ctx, 220, 34, 90, 58, {});
      drawArrow(ctx, 320, 62, 390, 62, KQ.green);
      drawCase(ctx, 400, 40, 80, 56, 0.6);
      drawSceneLabel(ctx, 60, 122, '先压缩', KQ.orange, 12);
      drawSceneLabel(ctx, 400, 122, '再混装', KQ.green, 12);
      break;
    }
    case 'chap-5': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 3; i++) drawCube(ctx, 50 + i * 70, 40, 56, 50, {});
      drawHardBox(ctx, 280, 44, 70, 46);
      drawPouch(ctx, 380, 44, 60, 46);
      drawSceneLabel(ctx, 50, 122, '不同规格', KQ.green, 12);
      drawSceneLabel(ctx, 280, 122, '硬盒', KQ.red, 12);
      drawSceneLabel(ctx, 380, 122, '随身', KQ.purple, 12);
      break;
    }
    case 'chap-6': {
      clearScene(ctx, w, h);
      drawCube(ctx, 50, 34, 70, 56, {});
      drawArrow(ctx, 130, 62, 210, 62, KQ.green);
      ctx.strokeStyle = KQ.green;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(220, 34, 120, 56);
      drawBar(ctx, 360, 58, 160, 10, p, KQ.green);
      drawSceneLabel(ctx, 220, 122, '快速打包台', KQ.green, 12);
      break;
    }
    case 'chap-7': {
      clearScene(ctx, w, h);
      drawScale(ctx, 60, 60, 160, 14, 0.5);
      drawItem(ctx, 260, 38, 50, 44, {});
      drawScale(ctx, 340, 60, 160, 14, 0.7);
      drawSceneLabel(ctx, 60, 122, '出发前试装', KQ.blue, 12);
      drawSceneLabel(ctx, 340, 122, '现场称重', KQ.green, 12);
      break;
    }
    case 'chap-8': {
      clearScene(ctx, w, h);
      drawCase(ctx, 40, 40, 90, 60, 0.5);
      drawArrow(ctx, 140, 70, 210, 70, KQ.muted);
      ctx.fillStyle = KQ.floorDark;
      ctx.fillRect(230, 50, 150, 46);
      ctx.fillStyle = KQ.card;
      ctx.fillRect(245, 62, 40, 22);
      ctx.fillRect(295, 62, 40, 22);
      drawArrow(ctx, 390, 70, 450, 70, KQ.green);
      drawCube(ctx, 460, 44, 60, 50, {});
      drawSceneLabel(ctx, 40, 122, '装车 → 旅途 → 取用', KQ.green, 12);
      break;
    }
    case 'chap-9': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 0 ? 'rgba(47,125,79,0.15)' : i === 1 ? 'rgba(47,93,138,0.15)' : 'rgba(123,75,183,0.15)';
        ctx.fillRect(50 + i * 150, 34, 120, 64);
        drawSceneLabel(ctx, 66 + i * 150, 74, i === 0 ? '2bit' : i === 1 ? '3bit' : '4bit', KQ.ink, 13);
      }
      drawSceneLabel(ctx, 50, 126, '按旅途长度选箱子', KQ.ink, 12);
      break;
    }
    case 'chap-10':
    default: {
      clearScene(ctx, w, h);
      drawCase(ctx, 40, 40, 110, 62, 1);
      drawItem(ctx, 60, 20, 60, 40, { big: true });
      drawCase(ctx, 320, 40, 110, 62, 0.5);
      drawBar(ctx, 40, 112, 180, 8, p, KQ.red);
      drawBar(ctx, 320, 112, 180, 8, Math.min(1, p * 1.3), KQ.green);
      if (p > 0.85) drawTarget(ctx, 500, 50, 9);
      drawSceneLabel(ctx, 40, 132, '空间 / 速度 / 完整度', KQ.muted, 11);
      break;
    }
  }
}

export const KqAnalogy: React.FC<{ chapterId: string; moduleId: string }> = ({ chapterId }) => {
  const ref = useKqCanvas((ctx, w, h, t) => drawChapter(chapterId, ctx, w, h, t), W, H);
  return <canvas id={`cv-ana-${chapterId}`} ref={ref} width={W} height={H} />;
};

export default KqAnalogy;
