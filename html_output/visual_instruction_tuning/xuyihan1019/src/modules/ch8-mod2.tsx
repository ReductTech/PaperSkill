import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawLabel,
  drawLegend,
  useCanvas,
} from '../lib/trailKit';

// 第 8 章模块：两个阶段各训练什么。
// 左：可训练参数占比 + 训练时长；右：小时刻度与 epoch 刻度。阶段芯片同时改动三处。

const W = 1080;
const H = 280;

type Stage = 'one' | 'two';

interface StageState {
  stage: Stage;
}

const CFG: Record<Stage, { train: string; hours: number; epochs: number; share: number }> = {
  one: { train: 'W', hours: 4, epochs: 1, share: 0.03 },
  two: { train: 'W + LLM', hours: 10, epochs: 3, share: 0.72 },
};

const FB: Record<Stage, { text: string; cls: string }> = {
  one: {
    text: '第一阶段：只有投影可训练，4 小时内完成。',
    cls: '',
  },
  two: {
    text: '第二阶段：投影 + 语言模型，10 小时内完成，3 个 epoch。',
    cls: 'good',
  },
};

function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: number,
  color: string,
  mutedColor: string
): void {
  ctx.save();
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = tint(COLORS.bg, 0.88);
  ctx.fill();
  ctx.fillStyle = tint(mutedColor, 0.16);
  ctx.fill();
  ctx.strokeStyle = mutedColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  const filled = Math.max(0, Math.min(1, value));
  if (filled > 0.01) {
    roundRect(ctx, x + 1.5, y + 1.5, (w - 3) * filled, h - 3, (h - 3) / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

const draw = (ctx: CanvasRenderingContext2D, time: number, s: StageState): void => {
  clearScene(ctx, W, H);
  const cfg = CFG[s.stage];

  drawLabel(ctx, '参数占比', 60, 74, { color: COLORS.ink, size: 14, bold: true });
  bar(ctx, 60, 88, 540, 32, cfg.share, COLORS.aux, COLORS.muted);

  // 冻结的那部分始终占大头，锁片提示它不参与训练
  ctx.save();
  ctx.strokeStyle = COLORS.muted;
  ctx.fillStyle = COLORS.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(578, 100, 3.5, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.rect(573, 100, 10, 8);
  ctx.fill();
  ctx.restore();

  drawLabel(ctx, '训练时长', 60, 176, { color: COLORS.ink, size: 14, bold: true });
  bar(ctx, 60, 190, 540, 32, cfg.hours / 10, COLORS.route, COLORS.axis);

  // 右：小时刻度（每格 1 小时）
  const hoursMax = 10;
  for (let i = 0; i < hoursMax; i += 1) {
    const x = 690 + i * 28;
    const on = i < cfg.hours;
    ctx.save();
    roundRect(ctx, x, 96, 20, 20, 4);
    ctx.fillStyle = on ? tint(COLORS.route, 0.85) : tint(COLORS.axis, 0.35);
    ctx.fill();
    ctx.strokeStyle = on ? COLORS.route : COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // 右：epoch 刻度
  for (let i = 0; i < 3; i += 1) {
    const on = i < cfg.epochs;
    const cx = 706 + i * 40;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, 196, 12, 0, Math.PI * 2);
    ctx.fillStyle = on ? tint(COLORS.good, 0.85) : tint(COLORS.axis, 0.35);
    ctx.fill();
    ctx.strokeStyle = on ? COLORS.good : COLORS.axis;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawLegend(ctx, 40, 258, [
    { color: COLORS.aux, text: '可训练' },
    { color: COLORS.muted, text: '冻结' },
    { color: COLORS.route, text: '时长' },
  ]);
};

export const Ch8Mod2: React.FC<WidgetProps> = () => {
  const stateRef = useRef<StageState>({ stage: 'one' });
  const [stage, setStage] = useState<Stage>('one');
  const [fb, setFb] = useState<{ text: string; cls: string }>(FB.one);
  const { ref } = useCanvas<StageState>(draw, W, H, stateRef);

  const pick = (next: Stage): void => {
    stateRef.current.stage = next;
    setStage(next);
    setFb(FB[next]);
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button
          type="button"
          className={`chip ${stage === 'one' ? 'selected' : ''}`}
          aria-pressed={stage === 'one'}
          onClick={() => pick('one')}
        >
          第一阶段
        </button>
        <button
          type="button"
          className={`chip ${stage === 'two' ? 'selected' : ''}`}
          aria-pressed={stage === 'two'}
          onClick={() => pick('two')}
        >
          第二阶段
        </button>
        <label>
          可训练 <span className="val">{CFG[stage].train}</span>
        </label>
        <label>
          成本{' '}
          <span className="val">
            {CFG[stage].hours}h · {CFG[stage].epochs} epoch
          </span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch8Mod2;
