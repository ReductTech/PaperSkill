import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-race — 1080x280，P8 结果竞赛 + P4 难度 chips
// 「主结果：Terminal-Bench 2 全对比」复现论文 Table 1：七种方法 × 四个难度档。
// 条形错峰增长；并列第一同列 🏆（Easy 档 TF-GRPO 与 AHE 并列 100.0；Hard 档 Codex 领先）。

const W = 1080;
const H = 280;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
};

type Tier = 'all' | 'easy' | 'medium' | 'hard';
type Kind = 'human' | 'seed' | 'self' | 'ahe';

const TIERS: { k: Tier; label: string }[] = [
  { k: 'all', label: '总体' },
  { k: 'easy', label: 'Easy (4)' },
  { k: 'medium', label: 'Medium (55)' },
  { k: 'hard', label: 'Hard (30)' },
];

const METHODS: { name: string; kind: Kind }[] = [
  { name: 'opencode', kind: 'human' },
  { name: 'terminus-2', kind: 'human' },
  { name: 'Codex', kind: 'human' },
  { name: 'NexAU0', kind: 'seed' },
  { name: 'ACE', kind: 'self' },
  { name: 'TF-GRPO', kind: 'self' },
  { name: 'AHE', kind: 'ahe' },
];

// 顺序与 METHODS 对齐：All / Easy / Medium / Hard
const DATA: Record<Tier, number[]> = {
  all: [47.2, 62.9, 71.9, 69.7, 68.9, 72.3, 77.0],
  easy: [75.0, 75.0, 75.0, 87.5, 91.7, 100.0, 100.0],
  medium: [52.7, 74.5, 80.0, 78.2, 78.2, 79.4, 88.2],
  hard: [33.3, 40.0, 56.7, 51.7, 48.9, 55.6, 53.3],
};

const FEEDBACK: Record<Tier, { text: string; cls: string }> = {
  all: {
    text: 'AHE 77.0% 领跑：比种子 +7.3pp，比最强人工设计 Codex +5.1pp',
    cls: 'good',
  },
  easy: { text: 'Easy 档 TF-GRPO 与 AHE 并列 100.0%', cls: 'good' },
  medium: { text: 'AHE 88.2% 第一，比 Codex +8.2pp', cls: 'good' },
  hard: {
    text: 'Hard 档 Codex 56.7% 最高，AHE 53.3% 居后——论文归因于长任务上的组件间干扰，而非能力缺失（memory-only 在 Hard 达 63.3%）',
    cls: '',
  },
};

const X0 = 170;
const TRACK = 790; // 100% 对应轨道长度
const ROW_Y = 42;
const ROW_STEP = 31;
const BAR_H = 18;

function winners(tier: Tier): number[] {
  const vals = DATA[tier];
  const max = Math.max(...vals);
  return vals.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0);
}

export const ModRace: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ tier: Tier; raceStart: number }>({ tier: 'all', raceStart: 0 });
  const rafRef = useRef<number | null>(null);
  const [tier, setTier] = useState<Tier>('all');
  const [feedback, setFeedback] = useState(FEEDBACK.all);

  useEffect(() => {
    stateRef.current.raceStart = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (now: number) => {
      const s = stateRef.current;
      const vals = DATA[s.tier];
      const win = winners(s.tier);
      const elapsed = now - s.raceStart;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 图例
      const legend: { label: string; swatch: () => void; width: number }[] = [
        {
          label: '人工设计',
          swatch: () => {
            ctx.fillStyle = 'rgba(124,58,237,0.16)';
            ctx.fillRect(0, 0, 14, 14);
            ctx.strokeStyle = C.purple;
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, 12, 12);
          },
          width: 4,
        },
        {
          label: '种子 NexAU0',
          swatch: () => {
            ctx.fillStyle = C.steel;
            ctx.fillRect(0, 0, 14, 14);
          },
          width: 7,
        },
        {
          label: '自进化基线',
          swatch: () => {
            ctx.fillStyle = C.blue;
            ctx.fillRect(0, 0, 14, 14);
          },
          width: 5,
        },
        {
          label: 'AHE',
          swatch: () => {
            ctx.fillStyle = C.orange;
            ctx.fillRect(0, 0, 14, 14);
          },
          width: 3,
        },
      ];
      ctx.font = '12px "Segoe UI", sans-serif';
      let lx = W - 20 - legend.reduce((acc, it) => acc + it.width * 12 + 42, 0);
      legend.forEach((item) => {
        ctx.save();
        ctx.translate(lx, 12);
        item.swatch();
        ctx.restore();
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'left';
        ctx.fillText(item.label, lx + 20, 24);
        lx += item.width * 12 + 42;
      });

      // 分组标签与分隔线
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('人工设计', 8, ROW_Y + ROW_STEP + BAR_H / 2 + 4);
      ctx.fillText('自进化', 8, ROW_Y + ROW_STEP * 4.5 + BAR_H / 2 + 4);
      const divY = ROW_Y + ROW_STEP * 3 - 6;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(8, divY);
      ctx.lineTo(X0 + TRACK, divY);
      ctx.stroke();
      ctx.setLineDash([]);

      METHODS.forEach((m, i) => {
        const y = ROW_Y + i * ROW_STEP;
        const v = vals[i];
        const p = easeOutCubic(clamp((elapsed - i * 120) / 900, 0, 1));
        const cur = v * p;
        const w = (cur / 100) * TRACK;

        // 名称
        ctx.fillStyle = m.kind === 'ahe' ? C.orange : C.text;
        ctx.font = `${m.kind === 'ahe' ? 'bold ' : ''}13px "Segoe UI", sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(m.name, X0 - 10, y + BAR_H / 2 + 5);
        ctx.textAlign = 'left';

        // 轨道
        ctx.fillStyle = '#e9edf3';
        ctx.fillRect(X0, y, TRACK, BAR_H);
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.strokeRect(X0, y, TRACK, BAR_H);

        // 进度条
        if (w > 0) {
          if (m.kind === 'human') {
            ctx.fillStyle = 'rgba(124,58,237,0.16)';
            ctx.fillRect(X0, y, w, BAR_H);
            ctx.strokeStyle = C.purple;
            ctx.lineWidth = 2;
            ctx.strokeRect(X0 + 1, y + 1, Math.max(w - 2, 2), BAR_H - 2);
          } else {
            ctx.fillStyle =
              m.kind === 'ahe' ? C.orange : m.kind === 'seed' ? C.steel : C.blue;
            ctx.fillRect(X0, y, w, BAR_H);
          }
        }

        // 裸数字
        if (p > 0) {
          ctx.fillStyle = C.text;
          ctx.font = 'bold 13px "Segoe UI", sans-serif';
          ctx.fillText(cur.toFixed(1), X0 + w + 8, y + BAR_H / 2 + 5);
        }

        // 奖杯：该档所有并列第一，跑完后出现
        if (win.includes(i) && p >= 1) {
          ctx.font = '17px "Segoe UI", sans-serif';
          ctx.fillText('🏆', X0 + w + 56, y + BAR_H / 2 + 6);
        }
      });
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const replay = () => {
    stateRef.current.raceStart = performance.now();
  };

  const pickTier = (nt: Tier) => {
    stateRef.current.tier = nt;
    stateRef.current.raceStart = performance.now(); // 换档自动重播
    setTier(nt);
    setFeedback(FEEDBACK[nt]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {TIERS.map((t) => (
          <button
            key={t.k}
            className={`chip ${tier === t.k ? 'selected' : ''}`}
            onClick={() => pickTier(t.k)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={replay}>
          重播
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      <div className="mod-note">
        <p>
          <b>差距住在哪一层？</b>ACE 把经验写成提示词 playbook、TF-GRPO
          强化已有工具序列——它们从未把工具、中间件、记忆这些层开放给编辑；而 AHE
          的增益恰好住在这些层里（第 6 章逐层量化）。
        </p>
        <p>
          <b>唯一例外是 Hard 档：</b>论文归因于长任务上的组件间干扰，而非能力缺失——只换 memory
          的变体在 Hard 达 63.3%，反超完整 AHE。
        </p>
      </div>
    </div>
  );
};

export default ModRace;
