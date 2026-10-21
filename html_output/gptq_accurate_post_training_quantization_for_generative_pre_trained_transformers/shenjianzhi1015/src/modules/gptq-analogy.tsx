import React from 'react';
import {
  clearScene,
  drawTile,
  drawPath,
  drawHand,
  drawTrowel,
  drawLevel,
  drawSample,
  drawFlag,
  drawBar,
  drawTarget,
  drawSceneLabel,
  GQ,
  useGptqCanvas,
} from './gptq-kit';

const W = 560;
const H = 140;

function drawChapter(ch: string, ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const p = (t % 3) / 3;
  const y = 62;
  switch (ch) {
    case 'chap-1': {
      clearScene(ctx, w, h);
      const filled = Math.floor(p * 10);
      drawPath(ctx, 30, y, 10, 40, 10, (i) =>
        i < filled ? (i % 3 === 0 ? { filled: true, cracked: true } : { filled: true }) : {}
      );
      drawBar(ctx, 30, 24, 480, 10, Math.min(1, p * 3), GQ.red);
      drawSceneLabel(ctx, 30, 18, '铺不平', GQ.red, 12);
      break;
    }
    case 'chap-2': {
      clearScene(ctx, w, h);
      drawPath(ctx, 30, y, 10, 40, 10, (i) => ({ filled: i < 6, highlight: i === 6 }));
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? GQ.orange : GQ.stoneEdge;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(30 + i * 50, y + 44, 40, 6);
        ctx.globalAlpha = 1;
      }
      drawSample(ctx, 30 + p * 480, 20, 44, 24);
      break;
    }
    case 'chap-3': {
      clearScene(ctx, w, h);
      drawPath(ctx, 30, 30, 10, 32, 8, (i) => (i === Math.floor(p * 10) ? { highlight: true } : { filled: i < p * 10 }));
      drawPath(ctx, 30, 90, 10, 32, 8, (i) => ({ filled: i < p * 10, snap: i === Math.floor(p * 10) }));
      break;
    }
    case 'chap-4': {
      clearScene(ctx, w, h);
      drawPath(ctx, 30, y, 10, 40, 10, (i) => ({ filled: true, highlight: i === 5 }));
      ctx.strokeStyle = GQ.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 60; i++) {
        const xx = 30 + (i / 59) * 480;
        const yy = 120 - Math.abs(Math.sin(i * 0.35)) * 16;
        if (i === 0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      drawHand(ctx, 280, 40, 14, 0);
      break;
    }
    case 'chap-5': {
      clearScene(ctx, w, h);
      const drop = Math.min(1, p * 2);
      for (let i = 0; i < 8; i++) {
        const dy = i === 0 ? 0 : Math.sin(p * Math.PI) * (i % 2 === 0 ? -6 : 6);
        drawTile(ctx, 60 + i * 52, y + dy, 42, { filled: i > 0, highlight: i === 0 });
      }
      drawTile(ctx, 90 + 0, y + (1 - drop) * -40, 42, { snap: true });
      break;
    }
    case 'chap-6': {
      clearScene(ctx, w, h);
      const seg = Math.floor(p * 3);
      drawPath(ctx, 30, y, 10, 40, 10, (i) => {
        const s = Math.floor(i / 4);
        return { filled: s < seg, highlight: s === seg };
      });
      drawSceneLabel(ctx, 30, 24, '一次一段', GQ.purple, 12);
      break;
    }
    case 'chap-7': {
      clearScene(ctx, w, h);
      const tilt = Math.sin(t * 1.2) * 0.12;
      drawPath(ctx, 30, y, 10, 40, 10, (i) => ({ filled: true }));
      drawLevel(ctx, 280, 118, 220, tilt, Math.abs(tilt) < 0.05);
      break;
    }
    case 'chap-8': {
      clearScene(ctx, w, h);
      const st = Math.floor(p * 4);
      for (let i = 0; i < 4; i++) {
        const cx = 90 + i * 120;
        ctx.fillStyle = i <= st ? GQ.green : GQ.card;
        ctx.strokeStyle = i === st ? GQ.orange : GQ.blue;
        ctx.lineWidth = i === st ? 3 : 2;
        ctx.beginPath();
        ctx.arc(cx, 60, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (i < 3) {
          ctx.strokeStyle = i < st ? GQ.green : GQ.border;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx + 24, 60);
          ctx.lineTo(cx + 96, 60);
          ctx.stroke();
        }
      }
      drawSceneLabel(ctx, 90, 110, '按工序推进', GQ.ink, 12);
      break;
    }
    case 'chap-9': {
      clearScene(ctx, w, h);
      const widths = [40, 30, 22, 16, 12];
      let x = 40;
      widths.forEach((wd, i) => {
        drawTile(ctx, x, y + (40 - wd) / 2, wd, { filled: true, snap: i >= 3 });
        x += wd + 12;
      });
      drawSceneLabel(ctx, 340, 80, '更窄的砖', GQ.purple, 13);
      break;
    }
    case 'chap-10':
    default: {
      clearScene(ctx, w, h);
      const prog = p;
      drawPath(ctx, 30, 30, 8, 30, 8, (i) => (i / 8 < prog ? { filled: true, cracked: i % 2 === 0 } : {}));
      drawPath(ctx, 30, 92, 8, 30, 8, (i) => (i / 8 < prog ? { filled: true } : {}));
      if (prog > 0.9) drawTarget(ctx, 320, 108, 10);
      drawSceneLabel(ctx, 30, 22, '慢且坑洼', GQ.red, 11);
      drawSceneLabel(ctx, 30, 84, '快且平整', GQ.green, 11);
      break;
    }
  }
}

export const GptqAnalogy: React.FC<{ chapterId: string; moduleId: string }> = ({ chapterId }) => {
  const ref = useGptqCanvas((ctx, w, h, t) => drawChapter(chapterId, ctx, w, h, t), W, H);
  return <canvas id={`cv-ana-${chapterId}`} ref={ref} width={W} height={H} />;
};

export default GptqAnalogy;
