import React from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, car, road, text } from './kit';

/* ============================================================================
   Hero · 旧方法：一条断了三处的路
   研究 → 训练 → 评测 → 部署，三处断口分别对应训练基建、评测配置、部署缺失。
   一辆车卡在第一个断口前，只能反复往前蹭一下再退回来。
   自动播放，无控件、无反馈（hero 侧栏画布 440×150）。
   ============================================================================ */

const RY = 60; // 路面顶边
const RH = 26; // 路面厚度

/* 四段路面 + 三处断口：与 an2 / an11 的「三处断口」保持一致 */
const SEG_W = 92;
const GAP_W = 20;
const X0 = 14;
const SEGS = [
  { x: X0, w: SEG_W, label: '研究' },
  { x: X0 + SEG_W + GAP_W, w: SEG_W, label: '训练' },
  { x: X0 + (SEG_W + GAP_W) * 2, w: SEG_W, label: '评测' },
  { x: X0 + (SEG_W + GAP_W) * 3, w: SEG_W, label: '部署' },
];

const GAPS = [
  { x: X0 + SEG_W, w: GAP_W },
  { x: X0 + SEG_W * 2 + GAP_W, w: GAP_W },
  { x: X0 + SEG_W * 3 + GAP_W * 2, w: GAP_W },
];

const CYCLE = 3600;
const X_REST = 34; // 起步位置
const X_STUCK = 92; // 第一处断口前刹停位置

function easeOut(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}
function easeInOut(p: number): number {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

export const HeroOld: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useCanvasScene(440, 150, (ctx, t) => {
    /* —— 安静的地面带 —— */
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = C.envLight;
    ctx.fillRect(0, RY + RH, 440, 9);
    ctx.restore();

    /* —— 三段互不相连的路面 —— */
    SEGS.forEach((s) => {
      road(ctx, s.x, RY, s.w, RH, 0);
      // 断裂端面：颜色更深，示意「这里是被切开的」
      ctx.fillStyle = 'rgba(43,39,36,0.35)';
      ctx.fillRect(s.x, RY, 2, RH);
      ctx.fillRect(s.x + s.w - 2, RY, 2, RH);
      text(ctx, s.label, s.x + s.w / 2, RY + RH + 21, {
        size: 12,
        color: C.ink,
        weight: '600',
        align: 'center',
      });
    });

    /* —— 断口：红色 —— */
    GAPS.forEach((g) => {
      ctx.save();
      ctx.fillStyle = 'rgba(179,55,47,0.15)';
      ctx.fillRect(g.x, RY - 7, g.w, RH + 14);
      // 斜纹
      ctx.beginPath();
      ctx.rect(g.x, RY - 7, g.w, RH + 14);
      ctx.clip();
      ctx.strokeStyle = 'rgba(179,55,47,0.5)';
      ctx.lineWidth = 1.2;
      for (let d = -RH - 14; d < g.w + RH + 14; d += 7) {
        ctx.beginPath();
        ctx.moveTo(g.x + d, RY - 7);
        ctx.lineTo(g.x + d + RH + 14, RY + RH + 7);
        ctx.stroke();
      }
      ctx.restore();
      // 两侧断面竖线
      ctx.save();
      ctx.strokeStyle = C.fail;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(g.x + 1.2, RY - 5);
      ctx.lineTo(g.x + 1.2, RY + RH + 5);
      ctx.moveTo(g.x + g.w - 1.2, RY - 5);
      ctx.lineTo(g.x + g.w - 1.2, RY + RH + 5);
      ctx.stroke();
      ctx.restore();
    });

    /* —— 唯一的运动主体：一辆车，往前蹭到断口就刹住 —— */
    const p = (t % CYCLE) / CYCLE;
    let cx: number;
    let braking = false;
    if (p < 0.4) {
      cx = X_REST + easeOut(p / 0.4) * (X_STUCK - X_REST);
    } else if (p < 0.78) {
      // 停在断口前，只有极轻微的怠速抖动
      cx = X_STUCK + Math.sin(t / 110) * 0.6;
      braking = true;
    } else {
      cx = X_STUCK - easeInOut((p - 0.78) / 0.22) * (X_STUCK - X_REST);
    }

    // 刹车尾灯：停住时亮红
    if (braking) {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(t / 180) * 0.18;
      ctx.fillStyle = C.fail;
      ctx.fillRect(cx - 11, RY + RH / 2 - 4, 2.4, 8);
      ctx.restore();
    }
    car(ctx, cx, RY + RH / 2, 0.62, C.guide, 0);
  });

  return (
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={440} height={150} />
  );
};

export default HeroOld;
