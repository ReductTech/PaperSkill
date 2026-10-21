import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, text } from './kit';

const W = 560;
const H = 240;
const OX = 280;
const AY = 170; // 轴线 y

// 4-bit 步长的像素比例：旧 s=6.2/7（刻度被离群值拉大），新 s=1.3/7（收窄 4.8 倍）
const S_OLD_PX = 21.4;
const S_NEW_PX = 4.5;

function drawAxis(ctx: CanvasRenderingContext2D, sPx: number) {
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, AY);
  ctx.lineTo(530, AY);
  ctx.stroke();
  // 16 级桶边界（-7..7）
  for (let b = -7; b <= 7; b++) {
    const bx = OX + b * sPx;
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, AY - 6);
    ctx.lineTo(bx, AY + 6);
    ctx.stroke();
  }
  text(ctx, '0', OX, AY + 22, C.muted, 12, 'center');
}

// 正常值画成 3 列 × 4 行的整齐点阵（白描边避免和刻度糊在一起）
function drawNormals(ctx: CanvasRenderingContext2D, absorbed: boolean) {
  const col = absorbed ? C.green : C.green;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const px = OX + (c - 1) * 13;
      const py = AY - 30 - r * 17;
      ctx.fillStyle = col;
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

// 离群值固定在数据位置 x=430。absorbed 时桶刻度收窄到 ±31px，它落在量化范围外。
function drawOutlier(ctx: CanvasRenderingContext2D, absorbed: boolean) {
  const px = OX + S_OLD_PX * 7;
  const py = AY - 26;
  ctx.fillStyle = C.red;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(px, py, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (absorbed) {
    // 绿色虚线圈 + 指向量化范围外的提示
    ctx.strokeStyle = C.green;
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px, py, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px, py + 15);
    ctx.lineTo(px, AY);
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, '离群值被拎走 → 刻度收窄', px, 112, C.green, 13, 'center');
  } else {
    text(ctx, '离群值顶住右端 → 刻度被拉大', px, 112, C.red, 13, 'center');
  }
}

export const HeroOld: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    drawAxis(ctx, S_OLD_PX);
    drawNormals(ctx, false);
    drawOutlier(ctx, false);
    text(ctx, 'INT4：s = max|Z| / 7 = 0.89，16 级粗刻度', W / 2, 38, C.red, 14, 'center');
    text(ctx, '正常值挤在零附近，可用层级没变多', W / 2, 210, C.muted, 12.5, 'center');
  });
  return <canvas ref={ref} width={W} height={H} />;
};

export const HeroNew: React.FC<WidgetProps> = () => {
  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    drawAxis(ctx, S_NEW_PX);
    drawNormals(ctx, true);
    drawOutlier(ctx, true);
    text(ctx, 'SVDQuant：s = 1.3 / 7 = 0.19，细 4.8×', W / 2, 38, C.green, 14, 'center');
    text(ctx, '离群值进 16-bit 低秩分支，残差随便量化', W / 2, 210, C.muted, 12.5, 'center');
  });
  return <canvas ref={ref} width={W} height={H} />;
};
