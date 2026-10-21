import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  clamp,
  drawChannelStrip,
  drawFader,
  drawLabel,
  drawLegend,
  drawSignalPath,
  useCanvas,
} from '../lib/consoleKit';

// §2 module 2.1 — a variable-length input feature grid collapsing into a fixed
// 64-token rail. One dominant operation: pick an input chip or drag the crop handle.
const W = 1080;
const H = 280;
const tokenCount = 64;

const CHIPS: Array<{ key: string; base: number }> = [
  { key: '1 帧', base: 1 * 196 },
  { key: '8 帧', base: 8 * 196 },
  { key: '30 帧', base: 30 * 196 },
  { key: '高分辨率', base: 1 * 784 },
];

interface Ch2State {
  picked: string;
  span: number;
  featCount: number;
}

function featureCount(picked: string, span: number): number {
  const chip = CHIPS.filter((c) => c.key === picked)[0] ?? CHIPS[1];
  return Math.max(1, Math.round(chip.base * span));
}

export const Ch2Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Ch2State>({ picked: '8 帧', span: 1, featCount: 8 * 196 });
  const [picked, setPicked] = useState('8 帧');
  const [span, setSpan] = useState(1);
  const [featCount, setFeatCount] = useState(8 * 196);
  const [feedback, setFeedback] = useState({
    text: '拖动或切换输入，看输出 token 数是否变化。',
    cls: '',
  });

  const apply = (nextPicked: string, nextSpan: number) => {
    const count = featureCount(nextPicked, nextSpan);
    stateRef.current.picked = nextPicked;
    stateRef.current.span = nextSpan;
    stateRef.current.featCount = count;
    setPicked(nextPicked);
    setSpan(nextSpan);
    setFeatCount(count);
    setFeedback(
      count > tokenCount
        ? { text: `输入特征 ${count} 个，输出仍然固定 64 个 token：这就是压缩。`, cls: 'good' }
        : { text: '输入不足 64 个特征时无需压缩，输出依然是 64 个刻度位置。', cls: '' }
    );
  };

  const { ref } = useCanvas<Ch2State>(
    (ctx, time, s) => {
      clearScene(ctx, W, H);

      // value strip (40–1040, top band)
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(40, 10, 1000, 22);
      ctx.restore();
      drawLabel(ctx, `输入 ${s.featCount}`, 48, 26, { color: COLORS.route, size: 13 });
      drawLabel(ctx, `输出 ${tokenCount}`, 700, 26, { color: COLORS.good, size: 13 });

      // crop rail on top of inputGrid
      drawFader(ctx, 40, 48, 320, s.span);

      // inputGrid: one small square per input feature, density set by the input
      const gx = 40;
      const gy = 64;
      const gw = 320;
      const gh = 172;
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(gx - 2, gy - 2, gw + 4, gh + 4);
      ctx.restore();
      const n = Math.max(1, s.featCount);
      const rows = clamp(Math.round(Math.sqrt((n * gh) / gw)), 1, 40);
      const cols = clamp(Math.ceil(n / rows), 1, 120);
      const cw = gw / cols;
      const ch = gh / rows;
      const drawn = Math.min(n, cols * rows);
      ctx.save();
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = COLORS.route;
      ctx.beginPath();
      for (let i = 0; i < drawn; i += 1) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        ctx.rect(gx + c * cw + 0.5, gy + r * ch + 0.5, Math.max(1, cw - 1), Math.max(1, ch - 1));
      }
      ctx.fill();
      ctx.restore();

      // resamplerBox: six purple strips + latent query squares
      ctx.save();
      ctx.globalAlpha = 0.26;
      ctx.fillStyle = COLORS.aux;
      ctx.fillRect(400, 70, 240, 150);
      ctx.restore();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.aux;
      ctx.strokeRect(400, 70, 240, 150);
      drawChannelStrip(ctx, 424, 98, 192, 46, { count: 6, active: 6 });
      for (let i = 0; i < 8; i += 1) {
        ctx.beginPath();
        ctx.rect(432 + i * 22, 166, 16, 14);
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = COLORS.aux;
        ctx.fill();
        ctx.restore();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = COLORS.aux;
        ctx.stroke();
      }

      // connectors: grid → resampler → token rail
      drawSignalPath(ctx, [
        [362, 150],
        [398, 150],
      ], { active: true });
      drawSignalPath(ctx, [
        [642, 150],
        [678, 150],
      ], { active: true });

      // tokenRail: always exactly 64 ticks, never renumbered
      const railX = 680;
      const railW = 360;
      const gap = 1.8;
      const tickW = railW / tokenCount - gap;
      for (let i = 0; i < tokenCount; i += 1) {
        const tx = railX + i * (tickW + gap);
        ctx.beginPath();
        ctx.rect(tx, 108, tickW, 58);
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = COLORS.route;
        ctx.fill();
        ctx.restore();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = COLORS.route;
        ctx.stroke();
      }
      // target marker: the fixed 64 output
      ctx.beginPath();
      ctx.arc(860, 98, 5, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.good;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(railX, 174);
      ctx.lineTo(railX + railW, 174);
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS.good;
      ctx.stroke();

      // at most two short labels + one legend
      drawLabel(ctx, '输入网格', 44, 254, { color: COLORS.ink, size: 15 });
      drawLabel(ctx, '64 刻度', 690, 254, { color: COLORS.ink, size: 15 });
      drawLegend(ctx, 200, 250, [
        { color: COLORS.aux, text: 'Resampler 6 层' },
        { color: COLORS.route, text: '可变输入' },
        { color: COLORS.good, text: '固定 64' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>输入类型</label>
        <div className="chip-row">
          {CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className={chip.key === picked ? 'chip selected' : 'chip'}
              onClick={() => apply(chip.key, span)}
            >
              {chip.key}
            </button>
          ))}
        </div>
      </div>
      <div className="ctrl">
        <label>
          裁切手柄 <span className="val">{span.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={30}
          max={100}
          step={1}
          value={Math.round(span * 100)}
          onChange={(e) => apply(picked, Number(e.target.value) / 100)}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;
