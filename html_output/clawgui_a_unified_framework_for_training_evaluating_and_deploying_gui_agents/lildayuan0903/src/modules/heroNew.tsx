import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, car, road, text } from './kit';

/* ============================================================================
   Hero · 新方法：三处断口被接成一条
   与 heroOld 同样的四段划分（研究 / 训练 / 评测 / 部署），
   但三处接缝已经打通（绿色焊点）。一辆车从左到右一次跑完全程，抵达���点旗。
   自动播放，无控件、无反馈。
   ============================================================================ */

const RX = 14; // 路面左端（与 heroOld 的 X0 对齐）
const SEG_W = 92;
const GAP_W = 20;
const RW = SEG_W * 4 + GAP_W * 3; // 连成一条：368 + 60 = 428 → 14 → 442，收��点到 424
const JOINTS = [
  RX + SEG_W + GAP_W / 2,
  RX + (SEG_W + GAP_W) + SEG_W + GAP_W / 2,
  RX + (SEG_W + GAP_W) * 2 + SEG_W + GAP_W / 2,
]; // 三处接缝，位置与 heroOld 的三处断口一一对应
const LABELS = ['研究', '训练', '评测', '部署'];

const FLAG_X = 424;
const CYCLE = 4600;
const X_IN = -20; // 从画面外驶入
const X_END = 398; // 终点旗前停车位

const RY = 60;
const RH = 26;

function easeInOut(p: number): number {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

export const HeroNew: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useCanvasScene(440, 150, (ctx, t) => {
    const p = (t % CYCLE) / CYCLE;

    /* —— 安静的地面带 —— */
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = C.envLight;
    ctx.fillRect(0, RY + RH, 440, 9);
    ctx.restore();

    /* —— 一条连续的路面（车道虚线随时间滚动，示意「通了」） —— */
    road(ctx, RX, RY, RW, RH, (t / 26) % 22);

    /* —— 接缝：绿色焊点，标出原来断开、现在接上的位置 —— */
    JOINTS.forEach((jx) => {
      ctx.save();
      ctx.strokeStyle = C.pass;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(jx, RY - 4);
      ctx.lineTo(jx, RY + RH + 4);
      ctx.stroke();
      ctx.fillStyle = C.pass;
      ctx.beginPath();
      ctx.arc(jx, RY - 9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    /* —— 四段的名字保持不变（与 heroOld 一一对应） —— */
    LABELS.forEach((s, i) => {
      text(ctx, s, RX + (SEG_W + GAP_W) * i + SEG_W / 2, RY + RH + 21, {
        size: 12,
        color: C.ink,
        weight: '600',
        align: 'center',
      });
    });

    /* —— 终点旗 —— */
    const arrived = p >= 0.7;
    const wave = Math.sin(t / (arrived ? 120 : 240)) * (arrived ? 3 : 1.6);
    ctx.save();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(FLAG_X, RY + RH + 2);
    ctx.lineTo(FLAG_X, RY - 26);
    ctx.stroke();
    ctx.fillStyle = C.pass;
    ctx.beginPath();
    ctx.moveTo(FLAG_X, RY - 26);
    ctx.lineTo(FLAG_X + 15 + wave, RY - 20);
    ctx.lineTo(FLAG_X, RY - 13);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    /* —— 唯一的运动主体：一辆车，一口气跑完三段 —— */
    let cx: number;
    let alpha = 1;
    if (p < 0.7) {
      cx = X_IN + easeInOut(p / 0.7) * (X_END - X_IN);
    } else if (p < 0.92) {
      cx = X_END;
    } else {
      cx = X_END;
      alpha = 1 - (p - 0.92) / 0.08;
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    car(ctx, cx, RY + RH / 2, 0.62, C.guide, 0);
    ctx.restore();
  });

  return (
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={440} height={150} />
  );
};

export default HeroNew;
