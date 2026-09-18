import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-transfer — 第五章 5.1「迁移实验：换基准、换模型」（1080x300）
// 两个视图：①跨模型迁移（Figure 3 六组配对柱）②跨基准迁移（Table 2，仓库 chips 切换）。
// 下方为简明解释（不堆数字）。数据复自已核实的 mod-ablation。

const W = 1080;
const H = 300;

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

type View = 'transfer' | 'bench';

// ---------- ① 跨模型迁移（Figure 3）：NexAU0 → AHE ----------
const TRANSFER = [
  { l1: 'GPT-5.4', l2: 'med', seed: 65.7, ahe: 68.0, gain: '+2.3' },
  { l1: 'GPT-5.4', l2: 'high', seed: 69.7, ahe: 77.0, gain: '+7.3' },
  { l1: 'GPT-5.4', l2: 'xhigh', seed: 72.5, ahe: 74.7, gain: '+2.3' },
  { l1: 'gemini-3.1', l2: 'flash-lite', seed: 36.5, ahe: 41.6, gain: '+5.1' },
  { l1: 'deepseek-v4', l2: 'flash', seed: 51.7, ahe: 61.8, gain: '+10.1' },
  { l1: 'qwen-3.6', l2: 'plus', seed: 56.2, ahe: 62.5, gain: '+6.3' },
];

// ---------- ② 跨基准迁移（Table 2）：ACE / TF-GRPO / NexAU0 / AHE ----------
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

const FEEDBACK: Record<View, string> = {
  transfer: '五个没参与演化的底座全部正收益；离 GPT-5.4 越远的家族增益越大，同家族三个推理档位则非单调',
  bench: 'AHE 成功率最高且 token 最省；两个自进化基线低于种子还多耗 token；增益集中在大仓库',
};

const BASE_Y = 216;
const MAX_H = 150;

export const ModTransfer: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ view: View; repo: number; animStart: number }>({
    view: 'transfer',
    repo: 0,
    animStart: 0,
  });
  const rafRef = useRef<number | null>(null);
  const [view, setView] = useState<View>('transfer');
  const [repo, setRepo] = useState(0);
  const [feedback, setFeedback] = useState(FEEDBACK.transfer);

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

    const renderTransfer = (elapsed: number) => {
      drawLegend([
        { label: 'NexAU0 种子', color: C.steel },
        { label: 'AHE', color: C.orange },
      ]);
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('在 GPT-5.4 high 上演化好的 harness，原样换到各底座上复测（不再演化）', 40, 26);
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
      // 同家族/跨家族分组标注
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      const divX = 40 + slot * 3;
      ctx.beginPath();
      ctx.moveTo(divX, 46);
      ctx.lineTo(divX, BASE_Y + 34);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('同家族（非单调）', 40 + slot * 1.5, 60);
      ctx.fillText('跨家族（增益更大）', 40 + slot * 4.5, 60);
    };

    const renderBench = (elapsed: number) => {
      const repoData = REPOS[stateRef.current.repo];
      drawLegend(BENCH_METHODS.map((m) => ({ label: m.name, color: m.color })));
      // 仓库标题
      ctx.fillStyle = C.text;
      ctx.font = 'bold 15px "Segoe UI", "PingFang SC", sans-serif';
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
          ctx.font = 'bold 11px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText('▼ 回退', cx, BASE_Y - bh - 28);
        }
        ctx.textAlign = 'left';
      });
    };

    const render = (now: number) => {
      const s = stateRef.current;
      const elapsed = now - s.animStart;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      if (s.view === 'transfer') renderTransfer(elapsed);
      else renderBench(elapsed);
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
    { k: 'transfer', label: '跨模型迁移（Figure 3）' },
    { k: 'bench', label: '跨基准迁移（Table 2）' },
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
      <div className="feedback">{feedback}</div>
      <div className="mod-note">
        <p>
          <b>换基准：</b>把 harness 原样搬到没见过的 SWE-bench-verified——两个自进化基线反而低于种子、还更费
          token：经验写在提示词里，换了任务面就失效。AHE 成功率最高且 token
          最省，因为经验固化在工具、中间件和记忆里，不随任务面失效。增益集中在大仓库，三个最小仓库的边际回退与样本量太小有关。
        </p>
        <p>
          <b>换模型：</b>五个没参与演化的底座全部正收益，且离 GPT-5.4
          越远的家族收益越大——更弱的底座更依赖 AHE 固化下来的协作模式。同家族三个档位的收益不是单调的：步数预算和超时是按
          GPT-5.4 high 拟合的，论文在局限中明确讨论了这一点。
        </p>
      </div>
    </div>
  );
};

export default ModTransfer;
