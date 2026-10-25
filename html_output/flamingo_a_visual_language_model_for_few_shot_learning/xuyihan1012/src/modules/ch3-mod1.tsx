import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawDeck,
  drawFader,
  drawLabel,
  drawLegend,
  drawLevelMeter,
  drawSignalPath,
  useCanvas,
  clamp,
} from '../lib/consoleKit';

// §3 module 3.1 (1080×280) — "门控从 0 开始增长", patterns P1 (live slider) + P2 (compare).
// ONE dominant operation: drag the crossfader α (range 0–300 → α ∈ [0, 3]); a second
// switch turns the 0-initialised gate off to expose what happens without it.
// gate = gateOn ? tanh(α) : 1, mixRatio = gate / (1 + gate). Evidence E5 / E22.

const W = 1080;
const H = 280;
const MAX_ALPHA = 3;
const MIX_FULL = 0.5; // mixRatio = gate/(1+gate) tops out just below 0.5

type Line = { cls: string; text: string };

const feedbackFor = (alpha: number, gate: number, gateOn: boolean): Line => {
  if (!gateOn) {
    return {
      cls: 'bad',
      text: '没有 0 初始化的门控：新层一上来就改变输出，论文报告训练会变得不稳定。',
    };
  }
  if (gate < 0.1) {
    return {
      cls: '',
      text: `α ≈ ${alpha.toFixed(2)}，tanh(α) ≈ ${gate.toFixed(2)}：新通道几乎没接入，输出≈原模型。`,
    };
  }
  if (gate < 0.75) {
    return { cls: '', text: '门控正在打开：视觉信息开始影响输出，原能力仍被保留。' };
  }
  return { cls: 'good', text: '新通道已充分接入，输出被视觉信息显著改变。' };
};

export const Ch3Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef({ alpha: 0, gateOn: true });
  const [alpha, setAlpha] = useState(0);
  const [gateOn, setGateOn] = useState(true);

  const gate = gateOn ? Math.tanh(alpha) : 1;
  const mixRatio = gate / (1 + gate);
  const fb = feedbackFor(alpha, gate, gateOn);

  const onAlpha = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value) / 100;
    stateRef.current.alpha = value;
    setAlpha(value);
  };

  const setGate = (on: boolean) => {
    stateRef.current.gateOn = on;
    setGateOn(on);
  };

  const { ref } = useCanvas(
    (ctx, time, s) => {
      const g = s.gateOn ? Math.tanh(s.alpha) : 1;
      const mix = g / (1 + g);
      const knobT = s.gateOn ? s.alpha / MAX_ALPHA : 1;

      clearScene(ctx, W, H);

      // deckRow: the two frozen sources (original output + the new visual channel)
      drawDeck(ctx, 150, 88, 50, { spin: 0, frozen: true, accent: COLORS.route });
      drawDeck(ctx, 930, 88, 50, { spin: 0, frozen: true, accent: COLORS.aux });

      // the crossfader: gate position = α / 3, disabled while the gate is switched off
      drawFader(ctx, 300, 104, 480, knobT, { disabled: !s.gateOn });

      // ratioBar: how much of the new channel is blended in
      const barX = 40;
      const barY = 196;
      const barW = 480;
      const barH = 26;
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.restore();
      const fill = s.gateOn ? clamp(mix / MIX_FULL, 0, 1) : 1;
      ctx.fillStyle = s.gateOn ? COLORS.route : COLORS.bad;
      ctx.fillRect(barX + 1.5, barY + 1.5, Math.max(0, (barW - 3) * fill), barH - 3);
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, barY, barW, barH);

      // outMeter: the share of the original output that stays intact, plus the red
      // over-limit part that the ungated new layer would drive.
      drawSignalPath(
        ctx,
        [
          [560, 192],
          [1040, 192],
        ],
        { active: true, dashed: true }
      );
      const kept = clamp(1 - 0.35 * g, 0, 1);
      drawLevelMeter(ctx, 560, 200, 480, 26, kept, { direction: 'up', label: '输出保留' });
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = COLORS.bad;
      ctx.fillRect(560 + 480 * kept, 200, 480 * (1 - kept), 26);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = COLORS.good;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(1040, 192);
      ctx.lineTo(1040, 234);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1040, 192, 4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.good;
      ctx.fill();
      ctx.restore();

      // at most two short in-canvas labels plus one legend
      drawLabel(ctx, '混合比例', barX, 188, { color: COLORS.muted, size: 13, align: 'left' });
      drawLegend(ctx, 40, 262, [
        { color: COLORS.route, text: '原始输出' },
        { color: COLORS.aux, text: '视觉新通道' },
        { color: COLORS.bad, text: '超限部分' },
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
        <label>
          门控标量 α <span className="val">{alpha.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={300}
          value={Math.round(alpha * 100)}
          onChange={onAlpha}
          disabled={!gateOn}
        />
        <span className="val">
          tanh(α) = {gate.toFixed(2)} · 混合比例 = {(mixRatio * 100).toFixed(0)}%
        </span>
      </div>
      <div className="ctrl">
        <div className="chip-row">
          <button
            type="button"
            className={`chip${gateOn ? ' selected' : ''}`}
            onClick={() => setGate(true)}
          >
            门控开启
          </button>
          <button
            type="button"
            className={`chip${!gateOn ? ' selected' : ''}`}
            onClick={() => setGate(false)}
          >
            关闭门控
          </button>
        </div>
        {!gateOn ? <span className="val">门控已关闭：新通道一开始就满负荷</span> : null}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch3Mod1;
