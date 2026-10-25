import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  clamp,
  drawCuePads,
  drawLabel,
  drawLegend,
  drawLevelMeter,
  useCanvas,
} from '../lib/consoleKit';

// §9 module 9.1 — pick a selection strategy and drag the similarity threshold.
// One dominant operation: strategy chips + threshold slider; both redraw the
// pad grid, the prompt order bar and the relative score bar at once.
const W = 1080;
const H = 280;

// 24 schematic similarities, already sorted from most to least similar.
const sims = [
  0.96, 0.91, 0.86, 0.8, 0.74, 0.67, 0.6, 0.55, 0.5, 0.45, 0.41, 0.37,
  0.33, 0.3, 0.27, 0.24, 0.21, 0.18, 0.15, 0.13, 0.11, 0.09, 0.07, 0.05,
];
// A fixed arbitrary order used by the "random" strategy.
const SHUFFLE = [4, 19, 1, 13, 7, 22, 10, 2, 16, 5, 20, 8, 0, 14, 23, 6, 11, 17, 3, 21, 9, 15, 18, 12];

const STRATEGIES: Array<{ key: string; label: string }> = [
  { key: 'random', label: '随机' },
  { key: 'rices', label: '检索选例' },
  { key: 'rices-ens', label: '检索+排列平均' },
];

const SCORES: Record<string, number> = { random: 0.25, rices: 0.6, 'rices-ens': 0.9 };

interface Ch9State {
  strategy: string;
  threshold: number;
}

function pickedOf(strategy: string, threshold: number): number[] {
  if (strategy === 'random') {
    const n = sims.filter((s) => s >= threshold).length;
    return SHUFFLE.slice(0, n).slice().sort((a, b) => a - b);
  }
  const out: number[] = [];
  for (let i = 0; i < sims.length; i += 1) {
    if (sims[i] >= threshold) out.push(i);
  }
  return out;
}

function orderOf(strategy: string, picked: number[]): number[] {
  if (strategy === 'random') {
    const set = picked.slice();
    return SHUFFLE.filter((i) => set.indexOf(i) >= 0);
  }
  // increasing similarity, so the most similar block sits right before the query
  return picked.slice().reverse();
}

export const Ch9Mod1: React.FC<WidgetProps> = () => {
  const stateRef = useRef<Ch9State>({ strategy: 'random', threshold: 0.6 });
  const [strategy, setStrategy] = useState('random');
  const [threshold, setThreshold] = useState(0.6);
  const [feedback, setFeedback] = useState({
    text: '随机选例：示例之间没有按相似度排序，最近的位置可能放着一个不相关的示例。',
    cls: '',
  });

  const apply = (nextStrategy: string, nextThreshold: number) => {
    const picked = pickedOf(nextStrategy, nextThreshold);
    stateRef.current.strategy = nextStrategy;
    stateRef.current.threshold = nextThreshold;
    setStrategy(nextStrategy);
    setThreshold(nextThreshold);
    if (picked.length === 0) {
      setFeedback({ text: '当前阈值下没有示例入选，提示里只剩下查询本身。', cls: 'bad' });
    } else if (nextStrategy === 'random') {
      setFeedback({
        text: '随机选例：最相似的位置不保证靠近查询，论文采用检索正是为了修正这一点。',
        cls: 'bad',
      });
    } else if (nextStrategy === 'rices') {
      setFeedback({
        text: '检索选例：按视觉相似度取前若干示例，并按相似度递增排序，让最相似的紧挨查询。',
        cls: '',
      });
    } else {
      setFeedback({
        text: '检索 + 排列平均：对 6 个排列的似然取平均，封闭式任务的排序更稳定。',
        cls: 'good',
      });
    }
  };

  const { ref } = useCanvas<Ch9State>(
    (ctx, time, s) => {
      clearScene(ctx, W, H);
      const picked = pickedOf(s.strategy, s.threshold);
      const order = orderOf(s.strategy, picked);
      const shown = order.slice(0, 8);

      // padGrid: 24 candidate pads; retrieved ones fill orange, random ones are marked
      drawCuePads(ctx, 48, 128, 6, 4, s.strategy === 'random' ? 0 : picked.length, {
        total: 24,
        selected: s.strategy === 'random' ? picked : [],
      });

      // orderBar: the prompt order, query fixed at the right end
      ctx.save();
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = COLORS.axis;
      ctx.fillRect(440, 96, 320, 48);
      ctx.restore();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COLORS.axis;
      ctx.strokeRect(440, 96, 320, 48);
      for (let i = 0; i < shown.length; i += 1) {
        const bx = 448 + i * 34;
        ctx.save();
        ctx.globalAlpha = 0.34;
        ctx.fillStyle = COLORS.fader;
        ctx.fillRect(bx, 100, 28, 30);
        ctx.restore();
        ctx.lineWidth = 2;
        ctx.strokeStyle = COLORS.fader;
        ctx.strokeRect(bx, 100, 28, 30);
        // inner bar height = similarity of that block; in 检索 mode it grows toward the query
        const barH = clamp(sims[shown[i]], 0, 1) * 26;
        ctx.beginPath();
        ctx.rect(bx + 5, 128 - barH, 18, barH);
        ctx.fillStyle = COLORS.fader;
        ctx.fill();
      }
      ctx.save();
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = COLORS.route;
      ctx.fillRect(722, 100, 34, 30);
      ctx.restore();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.route;
      ctx.strokeRect(722, 100, 34, 30);

      // scoreBar: relative only, never an absolute number
      drawLevelMeter(ctx, 800, 92, 220, 26, SCORES[s.strategy], { direction: 'up', label: '相对示意' });

      drawLabel(ctx, `入选 ${picked.length}`, 800, 168, { color: COLORS.route, size: 15 });
      // note: a compact echo of the prompt order (no extra text, feedback explains it)
      for (let i = 0; i < Math.min(shown.length, 4); i += 1) {
        const nx = 800 + i * 40;
        const nh = clamp(sims[shown[i]], 0, 1) * 44;
        ctx.beginPath();
        ctx.rect(nx, 240 - nh, 28, nh);
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = s.strategy === 'random' ? COLORS.aux : COLORS.fader;
        ctx.fill();
        ctx.restore();
        ctx.lineWidth = 2;
        ctx.strokeStyle = s.strategy === 'random' ? COLORS.aux : COLORS.fader;
        ctx.strokeRect(nx, 240 - nh, 28, nh);
      }
      drawLegend(ctx, 48, 264, [
        { color: COLORS.fader, text: '检索入选' },
        { color: COLORS.route, text: '查询' },
        { color: COLORS.aux, text: '随机选区' },
      ]);
    },
    W,
    H,
    stateRef
  );

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="chip-row">
        {STRATEGIES.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.key === strategy ? 'chip selected' : 'chip'}
            onClick={() => apply(item.key, threshold)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>
          相似度阈值 <span className="val">{threshold.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(threshold * 100)}
          onChange={(e) => apply(strategy, Number(e.target.value) / 100)}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
