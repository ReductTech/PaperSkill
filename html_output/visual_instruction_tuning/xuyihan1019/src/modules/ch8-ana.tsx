import React, { useRef } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawGuide,
  drawWalker,
  drawPage,
  drawSpeech,
  drawTrail,
  drawLabel,
  useCanvas,
  clamp,
  lerp,
} from '../lib/trailKit';

// 类比动画（第 8 章）：一只手把薄薄的翻译本塞进导盲链中间，灯从眼睛亮到嘴边。
// 560×140，无控件，一个动作主体（手）+ 一个目标（把「看见」接到「说出」）。

const W = 560;
const H = 140;
const LOOP = 3200;

const SLOT_X = 179;
const SLOT_Y = 44;
const EYE: [number, number] = [86, 58];
const BOOK: [number, number] = [196, 69];
const HEAD: [number, number] = [300, 58];
const MOUTH: [number, number] = [398, 44];

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function pointOnChain(t: number): [number, number] {
  const legs: Array<[[number, number], [number, number]]> = [
    [EYE, BOOK],
    [BOOK, HEAD],
    [HEAD, MOUTH],
  ];
  const total = legs.length;
  const pos = clamp(t, 0, 1) * total;
  const index = Math.min(total - 1, Math.floor(pos));
  const local = pos - index;
  const [a, b] = legs[index];
  return [lerp(a[0], b[0], local), lerp(a[1], b[1], local)];
}

function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 34, y + 40);
  ctx.lineTo(x + 8, y + 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, 9, 7, -0.35, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 3);
  ctx.lineTo(x - 19, y - 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 4);
  ctx.lineTo(x - 15, y + 1);
  ctx.stroke();
  ctx.restore();
}

const draw = (ctx: CanvasRenderingContext2D, time: number): void => {
  clearScene(ctx, W, H);

  const p = (time % LOOP) / LOOP;
  const insert = clamp(p / 0.42, 0, 1);
  const q = clamp((p - 0.46) / 0.54, 0, 1);
  const lift = easeOutCubic(insert);

  const bx = lerp(300, SLOT_X, lift);
  const by = lerp(112, SLOT_Y, lift);
  const slotted = insert > 0.995;

  // 链条：眼睛 → 翻译本 → 同伴 → 嘴边
  drawTrail(
    ctx,
    [
      [112, 84],
      [286, 84],
    ],
    { active: slotted }
  );

  drawGuide(ctx, 86, 66, { eye: true });
  drawWalker(ctx, 300, 66);

  // 薄薄的翻译本
  drawPage(ctx, bx, by, 34, 50, {
    lines: 3,
    highlight: q > 0.12 && q < 0.55 ? 1 : undefined,
  });

  // 手：先递本子，随后让开
  if (!slotted) {
    drawHand(ctx, bx + 44, by + 46);
  } else {
    drawHand(ctx, lerp(250, 350, easeInOut(q)), lerp(96, 120, easeInOut(q)));
  }

  drawSpeech(ctx, 348, 30, 100, '', { active: q > 0.86 });

  // 灯从眼睛跑向嘴边
  for (let i = 0; i < 3; i += 1) {
    const t = q - i * 0.07;
    if (t <= 0) continue;
    const [lx, ly] = pointOnChain(clamp(t, 0, 1));
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, 4.5 - i * 1.1, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.fader;
    ctx.fill();
    ctx.restore();
  }

  drawLabel(ctx, '翻译本', SLOT_X - 6, SLOT_Y - 12, { color: COLORS.muted, size: 13 });
};

export const Ch8Ana: React.FC<WidgetProps> = () => {
  const stateRef = useRef<number>(0);
  const { ref } = useCanvas<number>((ctx, time) => draw(ctx, time), W, H, stateRef);

  return <canvas ref={ref} width={W} height={H} />;
};

export default Ch8Ana;
