import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawGuide,
  drawPage,
  drawTrail,
  drawWalker,
  lerp,
  useCanvas,
} from '../lib/trailKit';

const W = 560;
const H = 140;

const smooth = (v: number): number => {
  const u = clamp(v, 0, 1);
  return u * u * (3 - 2 * u);
};

// 翻译本：一只手翻过薄薄的一页，词条就落在新页上——看到的被译成读得懂的。
// 唯一动作主体是那只翻页的手；词条随翻页落下，不表达任何学习状态。
export const Ch3Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef({});
  const { ref } = useCanvas<typeof stateRef.current>(
    (ctx, time) => {
      clearScene(ctx, W, H, '翻译本');

      // 读的人（同伴）在右端等着，翻译本到他的这一段是蓝色的词流
      drawGuide(ctx, 76, 84, { eye: true });
      drawTrail(ctx, [[352, 96], [458, 96]], { active: true });
      ctx.beginPath();
      ctx.arc(458, 96, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.good;
      ctx.fill();
      drawWalker(ctx, 486, 84, {});

      // 薄薄的一本：两页、中缝、橙色书脊
      drawPage(ctx, 210, 52, 132, 64, { lines: 3, rows: 3, highlight: 2 });
      ctx.strokeStyle = COLORS.fader;
      ctx.lineWidth = 2;
      ctx.strokeRect(206, 48, 140, 72);
      ctx.beginPath();
      ctx.moveTo(276, 50);
      ctx.lineTo(276, 118);
      ctx.strokeStyle = COLORS.trailDark;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3.2 秒一个循环：一只手把右页翻到左边，新页上落下词条
      const p = (time % 3200) / 3200;
      const turn = smooth((p - 0.06) / 0.46);
      const ang = turn * Math.PI * 0.94;
      const edgeX = 276 + 66 * Math.cos(ang);
      const lift = Math.sin(ang) * 16;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(276, 52);
      ctx.lineTo(edgeX, 52 + lift);
      ctx.lineTo(edgeX, 116 + lift);
      ctx.lineTo(276, 116);
      ctx.closePath();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = COLORS.bg;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 词条落在刚翻开的左页上
      for (let i = 0; i < 4; i += 1) {
        const wp = smooth((p - (0.34 + i * 0.05)) / 0.14);
        if (wp <= 0) continue;
        const wy = lerp(44, 66 + i * 12, wp);
        const wx = 224 + (i % 2) * 8;
        ctx.globalAlpha = wp;
        ctx.fillStyle = COLORS.good;
        ctx.fillRect(wx, wy, 34 - i * 3, 3);
        ctx.globalAlpha = 1;
      }

      // 唯一动作主体：捏着页角的手
      const hx = edgeX + 6;
      const hy = 84 + lift * 0.4;
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(0.22);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 5.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.fader;
      ctx.fill();
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-3, -3 + i * 3);
        ctx.lineTo(-10, -3.5 + i * 3);
        ctx.strokeStyle = COLORS.fader;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch3Ana;
