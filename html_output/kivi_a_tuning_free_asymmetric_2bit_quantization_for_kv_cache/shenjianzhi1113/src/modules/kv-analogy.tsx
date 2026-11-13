import React from 'react';
import {
  clearScene,
  drawShelf,
  drawFolder,
  drawCard,
  drawPage,
  drawStack,
  drawMagnifier,
  drawRuler,
  drawBar,
  drawTarget,
  drawSceneLabel,
  KV,
  useKvCanvas,
} from './kv-kit';

const W = 560;
const H = 140;

function drawChapter(ch: string, ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const p = (t % 3) / 3;
  switch (ch) {
    case 'chap-1': {
      clearScene(ctx, w, h);
      drawShelf(ctx, 40, 30, 260, 90, 2);
      for (let i = 0; i < 8; i++) drawFolder(ctx, 50 + i * 30, 36, 26, 34, { tone: i > 5 ? 'hot' : 'normal' });
      drawFolder(ctx, 210, 26, 40, 46, { tone: 'hot' });
      drawBar(ctx, 330, 44, 190, 12, 1, KV.red);
      drawSceneLabel(ctx, 330, 34, '架子满了', KV.red, 12);
      break;
    }
    case 'chap-2': {
      clearScene(ctx, w, h);
      drawCard(ctx, 50, 30, 160, 70, 6);
      drawPage(ctx, 260, 30, 140, 70);
      drawSceneLabel(ctx, 50, 122, '索引卡', KV.blue, 12);
      drawSceneLabel(ctx, 260, 122, '正文页', KV.blue, 12);
      break;
    }
    case 'chap-3': {
      clearScene(ctx, w, h);
      drawCard(ctx, 40, 30, 150, 70, 6);
      drawPage(ctx, 240, 30, 140, 70);
      ctx.fillStyle = 'rgba(47,93,138,0.18)';
      ctx.fillRect(70, 30, 22, 70);
      ctx.fillStyle = 'rgba(47,125,79,0.18)';
      ctx.fillRect(240, 55, 140, 20);
      drawSceneLabel(ctx, 40, 122, '按列', KV.blue, 12);
      drawSceneLabel(ctx, 240, 122, '按行', KV.green, 12);
      break;
    }
    case 'chap-4': {
      clearScene(ctx, w, h);
      drawRuler(ctx, 90, 24, 84, 0.6, { ok: true });
      drawCard(ctx, 140, 40, 180, 60, 6);
      drawFolder(ctx, 360, 40, 60, 60, { tone: 'old' });
      drawSceneLabel(ctx, 360, 122, '胶片', KV.green, 12);
      break;
    }
    case 'chap-5': {
      clearScene(ctx, w, h);
      drawStack(ctx, 60, 40, 110, 76, 5);
      drawShelf(ctx, 300, 30, 190, 80, 1);
      for (let i = 0; i < 5; i++) drawFolder(ctx, 312 + i * 34, 46, 28, 34, { tone: 'old' });
      drawSceneLabel(ctx, 60, 128, '桌面 R 份', KV.purple, 12);
      drawSceneLabel(ctx, 300, 128, '旧卷微缩', KV.green, 12);
      break;
    }
    case 'chap-6': {
      clearScene(ctx, w, h);
      drawFolder(ctx, 70, 40, 54, 54, { tone: 'old' });
      drawMagnifier(ctx, 150, 70, 26);
      drawSceneLabel(ctx, 210, 70, '边查边解压', KV.blue, 13);
      drawBar(ctx, 210, 92, 260, 8, p, KV.green);
      break;
    }
    case 'chap-7': {
      clearScene(ctx, w, h);
      drawFolder(ctx, 60, 40, 54, 54, {});
      drawSceneLabel(ctx, 60, 122, '直接上岗', KV.green, 12);
      ctx.strokeStyle = KV.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(300, 50);
      ctx.lineTo(380, 50);
      ctx.moveTo(340, 50);
      ctx.lineTo(340, 100);
      ctx.stroke();
      drawSceneLabel(ctx, 300, 122, '不用先培训', KV.muted, 12);
      break;
    }
    case 'chap-8': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i < 2 ? KV.blue : KV.green;
        ctx.beginPath();
        ctx.arc(70 + i * 120, 66, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      drawSceneLabel(ctx, 40, 120, '接案 → 整理 → 归档 → 调阅', KV.green, 12);
      break;
    }
    case 'chap-9': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 0 ? 'rgba(47,125,79,0.15)' : i === 1 ? 'rgba(47,93,138,0.15)' : 'rgba(123,75,183,0.15)';
        ctx.fillRect(50 + i * 150, 34, 120, 64);
        drawSceneLabel(ctx, 66 + i * 150, 74, i === 0 ? '2bit' : i === 1 ? '4bit' : 'MQA', KV.ink, 13);
      }
      drawSceneLabel(ctx, 50, 126, '按案卷选胶片', KV.ink, 12);
      break;
    }
    case 'chap-10':
    default: {
      clearScene(ctx, w, h);
      drawBar(ctx, 40, 40, 200, 10, p, KV.red);
      drawBar(ctx, 40, 78, 200, 10, Math.min(1, p * 1.3), KV.green);
      drawBar(ctx, 320, 40, 200, 10, p * 0.38, KV.purple);
      drawBar(ctx, 320, 78, 200, 10, Math.min(1, p * 1.2), KV.green);
      if (p > 0.85) drawTarget(ctx, 500, 108, 9);
      drawSceneLabel(ctx, 40, 122, '空间 / 速度 / 完整度', KV.muted, 12);
      break;
    }
  }
}

export const KvAnalogy: React.FC<{ chapterId: string; moduleId: string }> = ({ chapterId }) => {
  const ref = useKvCanvas((ctx, w, h, t) => drawChapter(chapterId, ctx, w, h, t), W, H);
  return <canvas id={`cv-ana-${chapterId}`} ref={ref} width={W} height={H} />;
};

export default KvAnalogy;
