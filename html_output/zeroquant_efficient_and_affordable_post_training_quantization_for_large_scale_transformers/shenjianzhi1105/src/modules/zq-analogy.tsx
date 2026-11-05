import React from 'react';
import {
  clearScene,
  drawRack,
  drawGarment,
  drawCustomer,
  drawTape,
  drawPattern,
  drawMaster,
  drawArrow,
  drawBar,
  drawTarget,
  drawSceneLabel,
  ZQ,
  useZqCanvas,
} from './zq-kit';

const W = 560;
const H = 140;

function drawChapter(ch: string, ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  const p = (t % 3) / 3;
  switch (ch) {
    case 'chap-1': {
      clearScene(ctx, w, h);
      drawTape(ctx, 300, 22, 88, 0.8, { ok: false });
      for (let i = 0; i < 4; i++) drawCustomer(ctx, 50 + i * 55, 112, 26, { range: 10 });
      drawGarment(ctx, 380, 34, 54, 76, { fit: 'bad' });
      drawSceneLabel(ctx, 380, 128, '不合身', ZQ.red, 12);
      break;
    }
    case 'chap-2': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 5; i++) drawCustomer(ctx, 50 + i * 62, 112, 26, { range: 8 + ((i * 7) % 27), highlight: i === 2 });
      drawTape(ctx, 360, 24, 84, 0.45, { ok: true });
      drawSceneLabel(ctx, 390, 70, '逐人量', ZQ.blue, 12);
      break;
    }
    case 'chap-3': {
      clearScene(ctx, w, h);
      drawPattern(ctx, 40, 36, 300, 78, 4);
      for (let i = 0; i < 4; i++) drawGarment(ctx, 55 + i * 72, 48, 44, 54, { fit: 'good' });
      drawSceneLabel(ctx, 380, 70, '按组打样', ZQ.blue, 13);
      break;
    }
    case 'chap-4': {
      clearScene(ctx, w, h);
      drawPattern(ctx, 40, 30, 220, 80, 3);
      drawTape(ctx, 300, 24, 86, 0.6, { ok: true });
      drawSceneLabel(ctx, 330, 70, '缩放→取整', ZQ.orange, 12);
      drawSceneLabel(ctx, 330, 92, '→截断', ZQ.orange, 12);
      break;
    }
    case 'chap-5': {
      clearScene(ctx, w, h);
      drawCustomer(ctx, 70, 112, 26, { range: 10, highlight: false });
      drawCustomer(ctx, 150, 112, 26, { range: 32, highlight: true });
      drawGarment(ctx, 60, 34, 48, 62, { fit: 'bad' });
      drawGarment(ctx, 230, 34, 48, 62, { fit: 'good' });
      drawSceneLabel(ctx, 60, 128, '静态', ZQ.red, 12);
      drawSceneLabel(ctx, 230, 128, '动态', ZQ.green, 12);
      break;
    }
    case 'chap-6': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = i < 2 ? ZQ.red : ZQ.green;
        ctx.lineWidth = 2;
        ctx.strokeRect(40 + i * 160, 50, 120, 44);
      }
      drawBar(ctx, 40, 110, 460, 8, p, ZQ.green);
      drawSceneLabel(ctx, 40, 132, '合并工位', ZQ.green, 12);
      break;
    }
    case 'chap-7': {
      clearScene(ctx, w, h);
      drawMaster(ctx, 90, 112, 34);
      drawCustomer(ctx, 210, 112, 30, { range: 18, highlight: true });
      drawGarment(ctx, 300, 40, 60, 70, { fit: 'good' });
      drawArrow(ctx, 130, 80, 190, 86, ZQ.purple);
      drawSceneLabel(ctx, 340, 128, '徒弟改衣', ZQ.purple, 12);
      break;
    }
    case 'chap-8': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i < 3 ? ZQ.blue : ZQ.green;
        ctx.beginPath();
        ctx.arc(70 + i * 130, 70, 22, 0, Math.PI * 2);
        ctx.fill();
        if (i < 3) drawArrow(ctx, 94 + i * 130, 70, 120 + i * 130, 70, ZQ.muted);
      }
      drawSceneLabel(ctx, 40, 120, '接单 → 量化 → 部署', ZQ.green, 12);
      break;
    }
    case 'chap-9': {
      clearScene(ctx, w, h);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 0 ? 'rgba(47,125,79,0.15)' : i === 1 ? 'rgba(224,122,63,0.15)' : 'rgba(123,75,183,0.15)';
        ctx.fillRect(40 + i * 160, 34, 120, 70);
        drawSceneLabel(ctx, 58 + i * 160, 76, i === 0 ? 'INT8' : i === 1 ? 'W4/8' : 'W4/8+FP16', ZQ.ink, 13);
      }
      drawSceneLabel(ctx, 40, 128, '按订单选料', ZQ.ink, 12);
      break;
    }
    case 'chap-10':
    default: {
      clearScene(ctx, w, h);
      drawBar(ctx, 40, 40, 200, 10, p, ZQ.red);
      drawBar(ctx, 40, 76, 200, 10, Math.min(1, p * 1.25), ZQ.green);
      drawBar(ctx, 320, 40, 200, 10, p * 0.9, ZQ.purple);
      drawBar(ctx, 320, 76, 200, 10, Math.min(1, p * 1.4), ZQ.green);
      if (p > 0.85) drawTarget(ctx, 500, 108, 9);
      drawSceneLabel(ctx, 40, 120, '合身 / 交期 / 仓库', ZQ.muted, 12);
      break;
    }
  }
}

export const ZqAnalogy: React.FC<{ chapterId: string; moduleId: string }> = ({ chapterId }) => {
  const ref = useZqCanvas((ctx, w, h, t) => drawChapter(chapterId, ctx, w, h, t), W, H);
  return <canvas id={`cv-ana-${chapterId}`} ref={ref} width={W} height={H} />;
};

export default ZqAnalogy;
