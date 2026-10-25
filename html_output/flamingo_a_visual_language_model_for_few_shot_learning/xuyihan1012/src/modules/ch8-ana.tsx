import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawChannelStrip,
  drawLabel,
  drawLegend,
  useCanvas,
  clamp,
} from '../lib/consoleKit';

// §8 analogy — 生活隐喻（双盘混音台）：一只手把一条线缆插进通道条插口
//（目标：把视觉那一路接通到通道条），插入后链路上的指示灯从输入到输出依次亮起。
// 自动循环 2.8 秒。只有这只手与线缆头在动。

const W = 560;
const H = 140;
const LOOP = 2800;
const SOCKET_X = 286;
const PLUG_Y = 70;
const PLUG_IN_X = 272;
const PLUG_OUT_X = 168;
const HAND_Y = 108;
const LIGHT_X = [418, 468, 518];
const LIGHT_Y = 70;

type AnaState = { loop: number };

function smooth(x: number): number {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

/** A stylised hand pushing the cable head, coming in from the lower left. */
function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 14, y + 28);
  ctx.lineTo(x + 2, y + 14);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x - 8 + i * 6, y + 8);
    ctx.lineTo(x - 4 + i * 7, y - 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y + 4, 10, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.fader;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.ink;
  ctx.stroke();
  ctx.restore();
}

export const Ch8Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<AnaState>({ loop: 0 });

  const { ref } = useCanvas<AnaState>(
    (ctx, time) => {
      clearScene(ctx, W, H);

      const phase = (time % LOOP) / LOOP;
      // 0.00–0.24 hold out, 0.24–0.46 insert, 0.46–0.86 lights come on one by one, 0.86–1.00 hold
      let plug = 0;
      if (phase >= 0.24 && phase < 0.46) plug = smooth((phase - 0.24) / 0.22);
      else if (phase >= 0.46) plug = 1;
      const lit = plug >= 1 ? Math.min(3, Math.floor(smooth((phase - 0.46) / 0.34) * 3 + 0.0001)) : 0;

      const plugX = PLUG_OUT_X + (PLUG_IN_X - PLUG_OUT_X) * plug;

      // static prop: the channel strip being patched into
      drawChannelStrip(ctx, 300, 44, 56, 56, { count: 3, active: 3, color: COLORS.aux });

      // the socket on the left edge of the strip
      ctx.beginPath();
      ctx.rect(SOCKET_X - 8, PLUG_Y - 11, 18, 22);
      ctx.fillStyle = plug >= 1 ? COLORS.route : COLORS.axis;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.ink;
      ctx.stroke();

      // the cable + plug head (the single moving subject)
      ctx.beginPath();
      ctx.moveTo(40, 132);
      ctx.quadraticCurveTo(90, 126, plugX - 22, PLUG_Y + 4);
      ctx.strokeStyle = COLORS.aux;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.rect(plugX - 22, PLUG_Y - 9, 24, 18);
      ctx.fillStyle = COLORS.fader;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.ink;
      ctx.stroke();

      drawHand(ctx, plugX - 30, HAND_Y);

      // indicator chain lighting up from input to output
      LIGHT_X.forEach((lx, i) => {
        const on = i < lit;
        ctx.beginPath();
        ctx.arc(lx, LIGHT_Y, 9, 0, Math.PI * 2);
        ctx.fillStyle = on ? COLORS.good : COLORS.axis;
        ctx.fill();
        ctx.lineWidth = on ? 3 : 2;
        ctx.strokeStyle = on ? COLORS.good : COLORS.muted;
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(362, LIGHT_Y);
      ctx.lineTo(404, LIGHT_Y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = lit > 0 ? COLORS.good : COLORS.axis;
      ctx.stroke();

      drawLabel(ctx, '通道条', 328, 122, { color: COLORS.ink, size: 15, align: 'center' });
      drawLabel(ctx, '指示灯', 468, 30, { color: COLORS.ink, size: 15, align: 'center' });
      drawLegend(ctx, 18, 18, [
        { color: COLORS.good, text: '已接通' },
        { color: COLORS.axis, text: '未接通' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch8Ana;
