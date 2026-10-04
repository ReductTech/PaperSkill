import React from 'react';
import {
  clearScene,
  drawAlbumFrame,
  drawPhotoTile,
  drawHand,
  drawTrash,
  drawTag,
  drawSceneLabel,
  drawTarget,
  drawBar,
  DC,
  useDcCanvas,
} from './dc-kit';

const W = 560;
const H = 140;

function tileRow(
  ctx: CanvasRenderingContext2D,
  n: number,
  y: number,
  x0: number,
  gap: number,
  opts: (i: number) => { blur?: boolean; emphasis?: boolean; tag?: string } = () => ({})
): void {
  for (let i = 0; i < n; i++) {
    drawPhotoTile(ctx, x0 + i * gap, y, 34, 32, opts(i));
  }
}

function drawChapter(ch: string, ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const p = (t % 3) / 3;
  switch (ch) {
    case 'chap-1': {
      clearScene(ctx, w, h);
      drawAlbumFrame(ctx, 30, 22, 210, 96, p > 0.82);
      const shown = Math.floor(p * 10);
      for (let i = 0; i < 10; i++) {
        if (i < shown) drawPhotoTile(ctx, 40 + (i % 5) * 38, 30 + Math.floor(i / 5) * 38, 32, 32, {});
      }
      const bounce = Math.abs(Math.sin(p * Math.PI * 6)) * 18;
      drawPhotoTile(ctx, 250 + bounce, 55, 34, 34, { blur: true });
      if (p > 0.85) {
        ctx.strokeStyle = DC.green;
        ctx.lineWidth = 2;
        ctx.strokeRect(300, 40, 90, 60);
        drawTarget(ctx, 345, 70, 14);
        drawSceneLabel(ctx, 345, 124, '装得下', DC.green, 13, 'center');
      }
      break;
    }
    case 'chap-2': {
      clearScene(ctx, w, h);
      tileRow(ctx, 11, 50, 30, 46, (i) => ({ blur: i % 3 !== 0, emphasis: i === 5 }));
      const fx = 40 + p * 480;
      drawHand(ctx, fx, 108, 18, -0.5);
      break;
    }
    case 'chap-3': {
      clearScene(ctx, w, h);
      tileRow(ctx, 11, 50, 30, 46, (i) => (i < Math.floor(p * 11) ? { blur: true } : { emphasis: i === 8 }));
      drawTrash(ctx, 495, 96, 30);
      drawHand(ctx, 120 + p * 330, 100, 18, 0.2);
      break;
    }
    case 'chap-4': {
      clearScene(ctx, w, h);
      drawPhotoTile(ctx, 60, 30, 90, 80, { blur: p > 0.5 });
      ctx.strokeStyle = DC.orange;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(180, 40);
      ctx.lineTo(180, 108);
      ctx.stroke();
      drawSceneLabel(ctx, 186, 46, '阈值', DC.orange, 12);
      ctx.beginPath();
      ctx.arc(105, 70, 34, 0, Math.PI * 2);
      ctx.strokeStyle = DC.deskDark;
      ctx.lineWidth = 2;
      ctx.stroke();
      drawHand(ctx, 320, 96, 20, 0);
      break;
    }
    case 'chap-5': {
      clearScene(ctx, w, h);
      const cx = 300;
      for (let i = 0; i < 5; i++) {
        const x = 120 + i * 60 + (cx - (120 + i * 60)) * p;
        const y = 40 + i * 4 + (56 - (40 + i * 4)) * p;
        drawPhotoTile(ctx, x, y, 38, 36, { emphasis: i === 4 && p > 0.8 });
      }
      drawSceneLabel(ctx, 440, 80, '一叠代表', DC.blue, 13);
      break;
    }
    case 'chap-6': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 4; i++) drawPhotoTile(ctx, 150 + i * 42, 60, 40, 40, { emphasis: i === 3 });
      const ty = 20 + Math.abs(Math.sin(t * 2)) * 18;
      drawTag(ctx, 244, ty, '#1', DC.purple);
      drawSceneLabel(ctx, 320, 84, '只存编号', DC.purple, 13);
      break;
    }
    case 'chap-7': {
      clearScene(ctx, w, h);
      tileRow(ctx, 7, 54, 60, 48, (i) => (i === 3 ? { emphasis: true } : {}));
      const offset = Math.sin(t * 2.5) * 6;
      drawPhotoTile(ctx, 60 + 3 * 48 + offset, 54 + offset * 0.5, 34, 32, { emphasis: true });
      const ok = Math.abs(offset) < 2;
      drawSceneLabel(ctx, 430, 70, ok ? '对齐' : '微调', ok ? DC.green : DC.red, 14);
      break;
    }
    case 'chap-8': {
      clearScene(ctx, w, h);
      ctx.strokeStyle = DC.deskDark;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(200, 40 + (1 - p) * 0, 120, 60 - p * 20);
      for (let i = 0; i < 4; i++) {
        const x = 260 + (i - 1.5) * 30 * (1 - p) + (i - 1.5) * 6;
        drawPhotoTile(ctx, x - 15, 50 + (1 - p) * 8, 30, 28, { tag: p > 0.7 ? '#' + (i + 1) : undefined });
      }
      if (p > 0.8) drawTarget(ctx, 260, 70, 12);
      drawSceneLabel(ctx, 380, 80, '薄盒', DC.green, 13);
      break;
    }
    case 'chap-9': {
      clearScene(ctx, w, h);
      const freqs = [0.4, 0.25, 0.15, 0.1, 0.06, 0.04];
      const lens = [1, 2, 3, 4, 5, 5];
      for (let i = 0; i < 6; i++) {
        const y = 24 + i * 18;
        drawBar(ctx, 30, y, 120, 10, freqs[i] / 0.4, DC.blue);
        drawTag(ctx, 170, y - 6, '码' + lens[i], i < 2 ? DC.green : DC.purple);
      }
      drawSceneLabel(ctx, 300, 70, '高频短码', DC.green, 14);
      break;
    }
    case 'chap-10':
    default: {
      clearScene(ctx, w, h);
      const tilt = Math.sin(t * 1.5) * 0.18;
      ctx.save();
      ctx.translate(280, 70);
      ctx.rotate(tilt);
      ctx.strokeStyle = DC.route;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-120, 0);
      ctx.lineTo(120, 0);
      ctx.stroke();
      drawPhotoTile(ctx, -110, -50, 80, 46, { blur: true });
      drawPhotoTile(ctx, 30, -50, 60, 40, { emphasis: true });
      ctx.restore();
      drawSceneLabel(ctx, 280, 128, '压缩前 / 后', DC.muted, 12, 'center');
      break;
    }
  }
}

export const DcAnalogy: React.FC<{ chapterId: string; moduleId: string }> = ({ chapterId }) => {
  const ref = useDcCanvas((ctx, w, h, t) => drawChapter(chapterId, ctx, w, h, t), W, H);
  return <canvas id={`cv-ana-${chapterId}`} ref={ref} width={W} height={H} />;
};

export default DcAnalogy;
