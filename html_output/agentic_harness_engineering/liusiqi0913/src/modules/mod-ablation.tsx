import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-ablation — 1080x280，P4 chips 四视图：
// ①组件消融（Table 3 完整 6×4 热力表）②跨模型迁移（Figure 3 六组配对柱）
// ③跨基准迁移（Table 2，仓库 chips 切换，成功率柱 + token 数值）④成本效率（Table 4 8×4 热力表）。

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

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

type View = 'ablation' | 'transfer' | 'bench' | 'cost';

// ---------- ① 组件消融（Table 3）：All / Easy / Medium / Hard ----------
const ABL_COLS = ['All', 'Easy', 'Medium', 'Hard'];
const ABL_ROWS: { label: string; v: number[]; kind: 'seed' | 'part' | 'neg' | 'ahe' }[] = [
  { label: 'NexAU0（种子）', v: [69.7, 87.5, 78.2, 51.7], kind: 'seed' },
  { label: '+memory', v: [75.3, 50.0, 83.6, 63.3], kind: 'part' },
  { label: '+tool', v: [73.0, 75.0, 87.3, 46.7], kind: 'part' },
  { label: '+middleware', v: [71.9, 100.0, 81.8, 50.0], kind: 'part' },
  { label: '+prompt', v: [67.4, 75.0, 78.2, 46.7], kind: 'neg' },
  { label: 'AHE', v: [77.0, 100.0, 88.2, 53.3], kind: 'ahe' },
];

// ---------- ② 跨模型迁移（Figure 3）：NexAU0 → AHE ----------
const TRANSFER = [
  { l1: 'GPT-5.4', l2: 'med', seed: 65.7, ahe: 68.0, gain: '+2.3' },
  { l1: 'GPT-5.4', l2: 'high', seed: 69.7, ahe: 77.0, gain: '+7.3' },
  { l1: 'GPT-5.4', l2: 'xhigh', seed: 72.5, ahe: 74.7, gain: '+2.3' },
  { l1: 'gemini-3.1', l2: 'flash-lite', seed: 36.5, ahe: 41.6, gain: '+5.1' },
  { l1: 'deepseek-v4', l2: 'flash', seed: 51.7, ahe: 61.8, gain: '+10.1' },
  { l1: 'qwen-3.6', l2: 'plus', seed: 56.2, ahe: 62.5, gain: '+6.3' },
];

// ---------- ③ 跨基准迁移（Table 2）：ACE / TF-GRPO / NexAU0 / AHE ----------
const BENCH_METHODS = [
  { name: 'ACE', color: C.blue },
  { name: 'TF-GRPO', color: C.purple },
  { name: 'NexAU0', color: C.steel },
  { name: 'AHE', color: C.orange },
];
const REPOS: { label: string; n: number; rate: number[]; tok: number[] }[] = [
  { label: 'All', n: 500, rate: [74.6, 74.2, 75.2, 75.6], tok: [679, 582, 526, 461] },
  { label: 'django', n: 231, rate: [79.2, 78.8, 79.2, 81.0], tok: [707, 583, 527, 484] },
  { label: 'sympy', n: 75, rate: [69.3, 68.0, 70.7, 70.7], tok: [602, 572, 494, 479] },
  { label: 'sphinx-doc', n: 44, rate: [61.4, 65.9, 68.2, 70.5], tok: [990, 848, 731, 656] },
  { label: 'matplotlib', n: 34, rate: [70.6, 70.6, 73.5, 73.5], tok: [622, 530, 486, 391] },
  { label: 'scikit-learn', n: 32, rate: [93.8, 93.8, 93.8, 87.5], tok: [451, 378, 307, 257] },
  { label: 'pydata', n: 22, rate: [77.3, 77.3, 77.3, 72.7], tok: [563, 516, 386, 338] },
  { label: 'astropy', n: 22, rate: [59.1, 59.1, 54.5, 50.0], tok: [546, 470, 667, 277] },
];

// ---------- ④ 成本效率（Table 4）：Succ/Mtok ----------
const COST_ROWS: { label: string; v: number[] }[] = [
  { label: 'All 500', v: [1.1, 1.27, 1.43, 1.64] },
  { label: 'django 231', v: [1.12, 1.35, 1.5, 1.67] },
  { label: 'sympy 75', v: [1.15, 1.19, 1.43, 1.48] },
  { label: 'sphinx-doc 44', v: [0.62, 0.78, 0.93, 1.07] },
  { label: 'matplotlib 34', v: [1.14, 1.33, 1.51, 1.88] },
  { label: 'scikit-learn 32', v: [2.08, 2.48, 3.06, 3.4] },
  { label: 'pydata 22', v: [1.37, 1.5, 2.0, 2.15] },
  { label: 'astropy 22', v: [1.08, 1.26, 0.82, 1.81] },
];

const FEEDBACK: Record<View, { text: string; cls: string }> = {
  ablation: {
    text: '三项正增益、+prompt 唯一回退（−2.3pp）；三正项之和 +11.1pp 超过整体 +7.3pp——组件间存在非加性干扰；memory-only 在 Hard 达 63.3%，反超完整 AHE',
    cls: '',
  },
  transfer: {
    text: '六组全部正增益；跨家族更大（deepseek +10.1、qwen +6.3、gemini +5.1），同家族 GPT-5.4 非单调——与超时预算耦合的风险',
    cls: 'good',
  },
  bench: {
    text: '增益集中在 django 与 sphinx-doc 两个大仓库；三个最小仓库出现边际回退；token 总量比 ACE 省 32%、比种子省 12%',
    cls: '',
  },
  cost: {
    text: 'AHE 在全部八行取得最高 Succ/Mtok：同等 token 预算办成更多事（matplotlib 1.88 vs ACE 1.14）',
    cls: 'good',
  },
};

const BASE_Y = 206;
const MAX_H = 140;

export const ModAblation: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ view: View; repo: number; animStart: number }>({
    view: 'ablation',
    repo: 0,
    animStart: 0,
  });
  const rafRef = useRef<number | null>(null);
  const [view, setView] = useState<View>('ablation');
  const [repo, setRepo] = useState(0);
  const [feedback, setFeedback] = useState(FEEDBACK.ablation);

  useEffect(() => {
    stateRef.current.animStart = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawLegend = (items: { label: string; color: string }[]) => {
      ctx.font = '12px "Segoe UI", sans-serif';
      let lx = W - 24 - items.reduce((acc, it) => acc + it.label.length * 12 + 40, 0);
      items.forEach((item) => {
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, 14, 14, 14);
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'left';
        ctx.fillText(item.label, lx + 20, 26);
        lx += item.label.length * 12 + 40;
      });
    };

    // 热力表单元格：按列内归一化着色
    const heatCell = (
      cx: number,
      cy: number,
      w: number,
      h: number,
      t: number,
      baseColor: string,
      text: string,
      bold: boolean
    ) => {
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 5);
      ctx.fillStyle = rgba(baseColor, 0.06 + t * 0.55);
      ctx.fill();
      ctx.fillStyle = C.text;
      ctx.font = `${bold ? 'bold ' : ''}13px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(text, cx, cy + 5);
    };

    const renderAblation = (elapsed: number) => {
      const colX = [340, 540, 740, 940];
      const rowY0 = 60;
      const rowH = 34;
      // 表头
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'center';
      ABL_COLS.forEach((c, j) => ctx.fillText(c, colX[j], 40));
      ctx.textAlign = 'left';
      ctx.fillText('配置', 40, 40);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(36, 50);
      ctx.lineTo(W - 36, 50);
      ctx.stroke();
      // 列内归一化范围
      const ranges = ABL_COLS.map((_, j) => {
        const col = ABL_ROWS.map((r) => r.v[j]);
        return { min: Math.min(...col), max: Math.max(...col) };
      });
      ABL_ROWS.forEach((row, i) => {
        const p = easeOutCubic(clamp((elapsed - i * 100) / 420, 0, 1));
        const cy = rowY0 + i * rowH + rowH / 2;
        ctx.save();
        ctx.globalAlpha = p;
        ctx.translate(0, (1 - p) * 8);
        // 行标签
        ctx.fillStyle = row.kind === 'ahe' ? C.orange : C.text;
        ctx.font = `${row.kind === 'ahe' ? 'bold ' : ''}13px "Segoe UI", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(row.label, 40, cy + 5);
        // 单元格
        row.v.forEach((v, j) => {
          const rg = ranges[j];
          const t = rg.max === rg.min ? 0.5 : (v - rg.min) / (rg.max - rg.min);
          const base =
            row.kind === 'ahe' ? C.orange : row.kind === 'seed' ? C.steel : C.blue;
          heatCell(colX[j], cy, 176, 26, t, base, v.toFixed(1), row.kind === 'ahe');
        });
        // 标记：+prompt All 回退（红框）；+memory Hard 反超 AHE（绿框）
        if (row.kind === 'neg') {
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(colX[0] - 88, cy - 13, 176, 26, 5);
          ctx.stroke();
          ctx.fillStyle = C.red;
          ctx.font = 'bold 11px "Segoe UI", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('−2.3pp', colX[0] + 94, cy + 4);
        }
        if (row.label === '+memory') {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(colX[3] - 88, cy - 13, 176, 26, 5);
          ctx.stroke();
          ctx.fillStyle = C.green;
          ctx.font = 'bold 11px "Segoe UI", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('超 AHE', colX[3] + 94, cy + 4);
        }
        ctx.restore();
      });
      // 注释
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('红框＝相对种子回退（唯一）；绿框＝单项配置在该档反超完整 AHE', 40, H - 10);
    };

    const renderTransfer = (elapsed: number) => {
      drawLegend([
        { label: 'NexAU0', color: C.steel },
        { label: 'AHE', color: C.orange },
      ]);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(36, BASE_Y);
      ctx.lineTo(W - 36, BASE_Y);
      ctx.stroke();
      const slot = (W - 80) / TRANSFER.length;
      TRANSFER.forEach((g, i) => {
        const p = easeOutCubic(clamp((elapsed - i * 90) / 560, 0, 1));
        const bw = 50;
        const gap = 10;
        const gx = 40 + slot * i + (slot - (bw * 2 + gap)) / 2;
        const h1 = (g.seed / 85) * MAX_H * p;
        const h2 = (g.ahe / 85) * MAX_H * p;
        ctx.fillStyle = C.steel;
        ctx.fillRect(gx, BASE_Y - h1, bw, h1);
        ctx.fillStyle = C.orange;
        ctx.fillRect(gx + bw + gap, BASE_Y - h2, bw, h2);
        ctx.textAlign = 'center';
        if (p > 0) {
          ctx.fillStyle = C.text;
          ctx.font = '12px "Segoe UI", sans-serif';
          ctx.fillText(g.seed.toFixed(1), gx + bw / 2, BASE_Y - h1 - 6);
          ctx.fillText(g.ahe.toFixed(1), gx + bw + gap + bw / 2, BASE_Y - h2 - 6);
        }
        if (p >= 1) {
          ctx.fillStyle = C.green;
          ctx.font = 'bold 13px "Segoe UI", sans-serif';
          ctx.fillText(g.gain, gx + bw + gap / 2, BASE_Y - Math.max(h1, h2) - 24);
        }
        ctx.fillStyle = C.muted;
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(g.l1, gx + bw + gap / 2, BASE_Y + 16);
        ctx.fillText(g.l2, gx + bw + gap / 2, BASE_Y + 30);
        ctx.textAlign = 'left';
      });
    };

    const renderBench = (elapsed: number) => {
      const repoData = REPOS[stateRef.current.repo];
      drawLegend(BENCH_METHODS.map((m) => ({ label: m.name, color: m.color })));
      // 仓库标题
      ctx.fillStyle = C.text;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${repoData.label} · ${repoData.n} 任务`, 40, 30);
      // 基线
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, BASE_Y);
      ctx.lineTo(W - 80, BASE_Y);
      ctx.stroke();
      const baseMax = Math.max(...repoData.rate.slice(0, 3));
      BENCH_METHODS.forEach((m, i) => {
        const p = easeOutCubic(clamp((elapsed - i * 110) / 560, 0, 1));
        const cx = 235 + i * 230;
        const bw = 120;
        const bh = (repoData.rate[i] / 100) * MAX_H * p;
        ctx.fillStyle = m.color;
        ctx.fillRect(cx - bw / 2, BASE_Y - bh, bw, bh);
        ctx.textAlign = 'center';
        if (p > 0) {
          ctx.fillStyle = C.text;
          ctx.font = 'bold 15px "Segoe UI", sans-serif';
          ctx.fillText(repoData.rate[i].toFixed(1), cx, BASE_Y - bh - 10);
        }
        // token 数值 + 方法名
        ctx.fillStyle = C.muted;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(`${repoData.tok[i]}k tokens`, cx, BASE_Y + 18);
        ctx.fillStyle = i === 3 ? C.orange : C.text;
        ctx.font = `${i === 3 ? 'bold ' : ''}13px "Segoe UI", sans-serif`;
        ctx.fillText(m.name, cx, BASE_Y + 38);
        // 回退标记：AHE 低于最佳基线时如实标出
        if (i === 3 && repoData.rate[3] < baseMax && p >= 1) {
          ctx.fillStyle = C.red;
          ctx.font = 'bold 11px "Segoe UI", sans-serif';
          ctx.fillText('▼ 回退', cx, BASE_Y - bh - 28);
        }
        ctx.textAlign = 'left';
      });
    };

    const renderCost = (elapsed: number) => {
      const colX = [340, 540, 740, 940];
      const rowY0 = 52;
      const rowH = 26;
      // 表头（按方法着色）
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      BENCH_METHODS.forEach((m, j) => {
        ctx.fillStyle = m.color;
        ctx.fillText(m.name, colX[j], 34);
      });
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'left';
      ctx.fillText('Succ/Mtok', 40, 34);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(36, 44);
      ctx.lineTo(W - 36, 44);
      ctx.stroke();
      // 列内归一化范围
      const ranges = BENCH_METHODS.map((_, j) => {
        const col = COST_ROWS.map((r) => r.v[j]);
        return { min: Math.min(...col), max: Math.max(...col) };
      });
      COST_ROWS.forEach((row, i) => {
        const p = easeOutCubic(clamp((elapsed - i * 70) / 360, 0, 1));
        const cy = rowY0 + i * rowH + rowH / 2;
        ctx.save();
        ctx.globalAlpha = p;
        ctx.translate(0, (1 - p) * 6);
        ctx.fillStyle = C.text;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(row.label, 40, cy + 4);
        row.v.forEach((v, j) => {
          const rg = ranges[j];
          const t = rg.max === rg.min ? 0.5 : (v - rg.min) / (rg.max - rg.min);
          heatCell(colX[j], cy, 176, 20, t, BENCH_METHODS[j].color, v.toFixed(2), j === 3);
          // 低于该行 ACE 值的单元格红字标出（如 astropy 上 NexAU0 的 0.82）
          if (v < row.v[0]) {
            ctx.fillStyle = C.red;
            ctx.font = 'bold 12px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(v.toFixed(2), colX[j], cy + 4);
          }
        });
        ctx.restore();
      });
    };

    const render = (now: number) => {
      const s = stateRef.current;
      const elapsed = now - s.animStart;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      if (s.view === 'ablation') renderAblation(elapsed);
      else if (s.view === 'transfer') renderTransfer(elapsed);
      else if (s.view === 'bench') renderBench(elapsed);
      else renderCost(elapsed);
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

  const pickView = (nv: View) => {
    stateRef.current.view = nv;
    stateRef.current.animStart = performance.now();
    setView(nv);
    setFeedback(FEEDBACK[nv]);
  };

  const pickRepo = (ri: number) => {
    stateRef.current.repo = ri;
    stateRef.current.animStart = performance.now();
    setRepo(ri);
  };

  const VIEW_CHIPS: { k: View; label: string }[] = [
    { k: 'ablation', label: '组件消融' },
    { k: 'transfer', label: '跨模型迁移' },
    { k: 'bench', label: '跨基准迁移' },
    { k: 'cost', label: '成本效率' },
  ];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {VIEW_CHIPS.map((c) => (
          <button
            key={c.k}
            className={`chip ${view === c.k ? 'selected' : ''}`}
            onClick={() => pickView(c.k)}
          >
            {c.label}
          </button>
        ))}
      </div>
      {view === 'bench' && (
        <div className="chip-row">
          {REPOS.map((r, ri) => (
            <button
              key={r.label}
              className={`chip ${repo === ri ? 'selected' : ''}`}
              onClick={() => pickRepo(ri)}
            >
              {r.label} {r.n}
            </button>
          ))}
        </div>
      )}
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModAblation;
