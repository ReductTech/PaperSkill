import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  clamp,
  drawFader,
  drawLabel,
  drawLegend,
  drawLevelMeter,
  drawSignalPath,
  useCanvas,
} from '../lib/consoleKit';

// §7 module (1080x280): drag the four dataset weights of Eq (2) or apply the reported
// ablations of Table 3. The loss bar is a relative indication computed from the weight
// coverage; the score bar only shows paper-reported Overall values (E10, E20, E21).

const W = 1080;
const H = 280;
const POSITION_SCALE = 1.5; // plan: knob height = weights[k] / 1.5

type Preset = 'paper' | 'no-m3w' | 'no-itp' | 'no-vtp' | 'custom';
type ReportedPreset = Exclude<Preset, 'custom'>;

interface Weights {
  m3w: number;
  align: number;
  ltip: number;
  vtp: number;
}

const PAPER_WEIGHTS: Weights = { m3w: 1.0, align: 0.2, ltip: 0.2, vtp: 0.03 };

const PRESET_WEIGHTS: Record<ReportedPreset, Weights> = {
  paper: PAPER_WEIGHTS,
  'no-m3w': { m3w: 0, align: 0.2, ltip: 0.2, vtp: 0.03 },
  'no-itp': { m3w: 1.0, align: 0, ltip: 0, vtp: 0.03 },
  'no-vtp': { m3w: 1.0, align: 0.2, ltip: 0.2, vtp: 0 },
};

const PRESET_LABELS: Array<{ id: ReportedPreset; label: string }> = [
  { id: 'paper', label: '论文权重' },
  { id: 'no-m3w', label: '去掉 M3W' },
  { id: 'no-itp', label: '去掉图文对' },
  { id: 'no-vtp', label: '去掉视频文本对' },
];

/** Overall score reported for each ablation row of Table 3 (E21). */
const PRESET_SCORE: Record<ReportedPreset, number> = {
  paper: 70.7,
  'no-m3w': 53.4,
  'no-itp': 60.9,
  'no-vtp': 67.3,
};

const FEEDBACK: Record<Preset, { text: string; cls: string }> = {
  paper: {
    text: '论文报告的组合：M3W 权重最高，说明交错图文数据是能力的主要来源。',
    cls: 'good',
  },
  'no-m3w': { text: '去掉 M3W：总体得分从 70.7 掉到 53.4，下降超过 17%。', cls: 'bad' },
  'no-itp': {
    text: '去掉图文对：总体得分降到 60.9，下降 9.8%；视频文本对则主要影响视频任务。',
    cls: 'bad',
  },
  'no-vtp': { text: '去掉视频文本对：总体得分 67.3，对视频任务伤害最明显。', cls: '' },
  custom: { text: '这是自定义组合，论文没有报告它的得分，因此这里不给出结论。', cls: '' },
};

const FADERS: Array<{ key: keyof Weights; label: string; max: number }> = [
  { key: 'm3w', label: 'M3W', max: 1.5 },
  { key: 'align', label: 'ALIGN', max: 1.5 },
  { key: 'ltip', label: 'LTIP', max: 1.5 },
  { key: 'vtp', label: 'VTP', max: 0.5 },
];

/** Relative coverage of the paper's own mixture; M3W carries the largest share. */
function coverage(w: Weights): number {
  return (
    0.7 * Math.min(w.m3w / 1.0, 1) +
    0.1 * Math.min(w.align / 0.2, 1) +
    0.1 * Math.min(w.ltip / 0.2, 1) +
    0.1 * Math.min(w.vtp / 0.03, 1)
  );
}

export const Ch7Mod1: React.FC<WidgetProps> = () => {
  const [weights, setWeights] = useState<Weights>(PAPER_WEIGHTS);
  const [preset, setPreset] = useState<Preset>('paper');
  const stateRef = useRef<{ weights: Weights; preset: Preset }>({
    weights: PAPER_WEIGHTS,
    preset: 'paper',
  });
  const feedback = FEEDBACK[preset];
  const reported = preset === 'custom' ? null : PRESET_SCORE[preset];

  const { ref } = useCanvas<typeof stateRef.current>(
    (ctx, _time, s) => {
      clearScene(ctx, W, H);
      const totalWeight = Math.max(
        s.weights.m3w + s.weights.align + s.weights.ltip + s.weights.vtp,
        0.01
      );
      const lossIndex =
        totalWeight <= 0.011 ? 1 : clamp(1.25 - coverage(s.weights), 0, 1);
      const score = s.preset === 'custom' ? null : PRESET_SCORE[s.preset];

      // ---- four dataset faders (40-620) ----
      FADERS.forEach((f, i) => {
        const x = 120 + i * 120;
        const t = clamp(s.weights[f.key] / POSITION_SCALE, 0, 1);
        drawSignalPath(ctx, [[x, 56], [x, 40]], { active: s.weights[f.key] > 0 });
        drawFader(ctx, x, 56, 120, t, { vertical: true, label: f.label });
      });
      // the four channels accumulate into one bus, then split to the two result bars
      drawSignalPath(ctx, [[120, 40], [614, 40]], { active: true });
      drawSignalPath(ctx, [[614, 40], [614, 83], [660, 83]], { active: true });
      drawSignalPath(ctx, [[614, 40], [614, 200], [660, 200]], { active: true });

      // ---- weighted loss bar (E9, E10) ----
      drawLevelMeter(ctx, 660, 66, 380, 34, lossIndex, { direction: 'down', label: '加权损失' });
      drawLabel(ctx, `相对 ${lossIndex.toFixed(2)}`, 660, 58, { color: COLORS.muted, size: 13 });

      // ---- Overall score bar: paper values only, grey when the combination is unreported ----
      drawLevelMeter(ctx, 660, 183, 380, 34, score === null ? 1 : score / 100, {
        direction: 'up',
        muted: score === null,
        label: '总体得分',
        axisMax: 100,
      });
      if (score === null) {
        drawLabel(ctx, '论文未报告该组合', 760, 235, { color: COLORS.muted, size: 13 });
      } else {
        drawLabel(ctx, score.toFixed(1), 1034, 205, { color: COLORS.ink, size: 13, align: 'right' });
      }

      drawLegend(ctx, 48, 266, [
        { color: COLORS.good, text: '损失低/得分好' },
        { color: COLORS.bad, text: '损失高' },
        { color: COLORS.muted, text: '论文未报告' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const applyPreset = (id: ReportedPreset) => {
    const next = { ...PRESET_WEIGHTS[id] };
    stateRef.current = { weights: next, preset: id };
    setWeights(next);
    setPreset(id);
  };

  const changeWeight = (key: keyof Weights, raw: string) => {
    const next = { ...weights, [key]: Number(raw) };
    stateRef.current = { weights: next, preset: 'custom' };
    setWeights(next);
    setPreset('custom');
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {PRESET_LABELS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`chip${preset === p.id ? ' selected' : ''}`}
              onClick={() => applyPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="val">
          {reported === null ? '论文未报告该组合的总体得分' : `总体得分 ${reported.toFixed(1)}`}
        </span>
      </div>
      {FADERS.map((f) => (
        <div className="ctrl" key={f.key}>
          <label>
            {f.label} <span className="val">{weights[f.key].toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={f.max}
            step={0.01}
            value={weights[f.key]}
            onChange={(e) => changeWeight(f.key, e.target.value)}
          />
        </div>
      ))}
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod1;
