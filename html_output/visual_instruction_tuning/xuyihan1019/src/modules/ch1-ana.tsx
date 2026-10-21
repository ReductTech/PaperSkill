import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clamp,
  clearScene,
  drawGuide,
  drawLandmark,
  drawSpeech,
  drawTrail,
  drawWalker,
  useCanvas,
} from '../lib/trailKit';

const W = 560;
const H = 140;

const smooth = (v: number): number => {
  const u = clamp(v, 0, 1);
  return u * u * (3 - 2 * u);
};

// 旧办法：没有翻译本。向导只能用嘴把整段路说完（唯一动作主体：那只比划的手），
// 同伴停在原地，白杖却已经指向路外。终点长椅是唯一可见目标。
export const Ch1Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef({});
  const { ref } = useCanvas<typeof stateRef.current>(
    (ctx, time) => {
      clearScene(ctx, W, H, '只能靠嘴');

      // 说的路线：一条蓝色引导线通向前方的长椅
      drawTrail(ctx, [[40, 112], [300, 109], [500, 104]], { active: true });

      // 可见目标：长椅与终点标记
      drawLandmark(ctx, 505, 100, 'bench');
      ctx.beginPath();
      ctx.arc(500, 112, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.good;
      ctx.fill();

      // 同伴静止等待，白杖已经偏到路外，红圈和灌木标出旧办法的代价
      drawWalker(ctx, 250, 92, { blocked: true });

      drawGuide(ctx, 92, 84, { eye: true });
      drawSpeech(ctx, 96, 42, 88, '一直走');

      // 唯一动作主体：向导的手向前比划，3.0 秒一个来回
      const p = (time % 3000) / 3000;
      const reach = 34 * (p < 0.55 ? smooth(p / 0.55) : 1 - smooth((p - 0.55) / 0.45));
      const hx = 112 + reach;
      const hy = 86 - reach * 0.22;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(112, 86);
      ctx.lineTo(hx, hy);
      ctx.strokeStyle = COLORS.route;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(-0.34);
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 3.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.fader;
      ctx.fill();
      ctx.fillRect(3, -1.6, 9, 3.2);
      ctx.restore();
      ctx.restore();
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch1Ana;
