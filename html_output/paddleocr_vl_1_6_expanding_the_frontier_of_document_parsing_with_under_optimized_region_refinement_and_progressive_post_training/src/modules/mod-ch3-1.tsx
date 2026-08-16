import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Module 5.1 — 抬升阈值：浮现稀疏簇 (P1 threshold slider)
// A fixed 14-node similarity graph; union-find over edges sim >= tau derives the
// connected components on every slider change. Sparse outlier nodes stay visible
// (no forced cluster assignment, unlike K-Means).

const W = 560;
const H = 240;

// Fixed seeded node positions: dense A (0-5) ~ (95,85), dense B (6-10) ~ (330,80),
// outlier C (11-12) ~ (480,60)/(458,88), outlier D (13) ~ (215,200). Never move.
const NODES: Array<{ x: number; y: number }> = [
  { x: 62, y: 72 },
  { x: 84, y: 60 },
  { x: 108, y: 70 },
  { x: 70, y: 98 },
  { x: 94, y: 104 },
  { x: 118, y: 90 },
  { x: 300, y: 70 },
  { x: 322, y: 58 },
  { x: 344, y: 70 },
  { x: 312, y: 96 },
  { x: 340, y: 92 },
  { x: 480, y: 60 },
  { x: 458, y: 88 },
  { x: 215, y: 200 },
];

const OUTLIER = new Set([11, 12, 13]);

// Fixed symmetric 14x14 similarity matrix (deterministic, per the plan's bands:
// intra-A 0.82-0.95, intra-B 0.80-0.93, A<->B 0.46-0.55, C-internal 0.78,
// C<->A 0.47-0.53, C<->B 0.44-0.50, D<->all 0.40-0.45). Kept strictly below the
// band tops so tau=0.60 yields exactly 4 components {A},{B},{C},{D} and tau=0.95
// yields 14 singletons.
function buildSim(): number[][] {
  const m: number[][] = Array.from({ length: 14 }, () => Array<number>(14).fill(0));
  const set = (i: number, j: number, v: number): void => {
    m[i][j] = v;
    m[j][i] = v;
  };
  const pairs: Array<[number, number, number]> = [
    // intra-A (0.82-0.94)
    [0, 1, 0.9], [0, 2, 0.85], [0, 3, 0.88], [0, 4, 0.83], [0, 5, 0.86],
    [1, 2, 0.92], [1, 3, 0.87], [1, 4, 0.84], [1, 5, 0.89],
    [2, 3, 0.93], [2, 4, 0.82], [2, 5, 0.88],
    [3, 4, 0.86], [3, 5, 0.91], [4, 5, 0.84],
    // intra-B (0.80-0.93)
    [6, 7, 0.88], [6, 8, 0.85], [6, 9, 0.9], [6, 10, 0.83],
    [7, 8, 0.92], [7, 9, 0.86], [7, 10, 0.89],
    [8, 9, 0.84], [8, 10, 0.93], [9, 10, 0.81],
    // A<->B (0.46-0.54)
    [0, 6, 0.5], [0, 7, 0.47], [0, 8, 0.53], [0, 9, 0.49], [0, 10, 0.52],
    [1, 6, 0.48], [1, 7, 0.51], [1, 8, 0.46], [1, 9, 0.54], [1, 10, 0.49],
    [2, 6, 0.52], [2, 7, 0.49], [2, 8, 0.5], [2, 9, 0.47], [2, 10, 0.53],
    [3, 6, 0.47], [3, 7, 0.54], [3, 8, 0.48], [3, 9, 0.52], [3, 10, 0.46],
    [4, 6, 0.51], [4, 7, 0.46], [4, 8, 0.54], [4, 9, 0.48], [4, 10, 0.5],
    [5, 6, 0.49], [5, 7, 0.52], [5, 8, 0.47], [5, 9, 0.51], [5, 10, 0.54],
    // C<->A (0.47-0.53)
    [11, 0, 0.5], [11, 1, 0.48], [11, 2, 0.52], [11, 3, 0.47], [11, 4, 0.53], [11, 5, 0.49],
    [12, 0, 0.51], [12, 1, 0.53], [12, 2, 0.48], [12, 3, 0.52], [12, 4, 0.47], [12, 5, 0.5],
    // C<->B (0.44-0.50)
    [11, 6, 0.47], [11, 7, 0.45], [11, 8, 0.49], [11, 9, 0.44], [11, 10, 0.46],
    [12, 6, 0.48], [12, 7, 0.44], [12, 8, 0.5], [12, 9, 0.46], [12, 10, 0.45],
    // D<->all (0.40-0.44)
    [13, 0, 0.43], [13, 1, 0.41], [13, 2, 0.44], [13, 3, 0.42], [13, 4, 0.4], [13, 5, 0.43],
    [13, 6, 0.42], [13, 7, 0.44], [13, 8, 0.41], [13, 9, 0.43], [13, 10, 0.4],
    [13, 11, 0.42], [13, 12, 0.44],
  ];
  for (const [i, j, v] of pairs) set(i, j, v);
  return m;
}

const SIM = buildSim();

function find(parent: number[], x: number): number {
  while (parent[x] !== x) x = parent[x];
  return x;
}

// Union-find over edges e_ij = (sim >= tau). Components are computed, never
// hard-coded, so every tau in the band behaves consistently.
function componentsAt(tau: number): number[][] {
  const parent: number[] = Array.from({ length: 14 }, (_, i) => i);
  for (let i = 0; i < 14; i++) {
    for (let j = i + 1; j < 14; j++) {
      if (SIM[i][j] >= tau) {
        const ri = find(parent, i);
        const rj = find(parent, j);
        if (ri !== rj) parent[rj] = ri;
      }
    }
  }
  const groups = new Map<number, number[]>();
  for (let i = 0; i < 14; i++) {
    const r = find(parent, i);
    const g = groups.get(r);
    if (g) g.push(i);
    else groups.set(r, [i]);
  }
  return Array.from(groups.values());
}

function smallestComponent(comps: number[][]): number[] {
  let best = comps[0];
  for (const c of comps) {
    if (c.length < best.length) best = c;
  }
  return best;
}

// True when the tau change crosses at least one pairwise similarity (edge set changes).
function edgesChanged(a: number, b: number): boolean {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  for (let i = 0; i < 14; i++) {
    for (let j = i + 1; j < 14; j++) {
      if (SIM[i][j] >= lo && SIM[i][j] < hi) return true;
    }
  }
  return false;
}

interface Feedback {
  text: string;
  cls: string;
}

function bands(t: number): Feedback {
  if (t < 0.55) {
    return { text: '阈值太松，稀疏样本被大簇“吸收”了——这正是均匀采样看不到它们的原因。', cls: 'bad' };
  }
  if (t <= 0.7) {
    return { text: '阈值升高，孤立的<b>小簇</b>浮现出来——这些就是覆盖稀疏区域。', cls: 'good' };
  }
  return { text: '阈值过紧，连正常样本也被切散了——实际使用时会选取合适的簇数上限。', cls: '' };
}

export const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ tau: 0.6, prevTau: 0.6, fadeStart: 0 });
  const rafRef = useRef<number | null>(null);
  const [tau, setTau] = useState(0.6);
  const [compCount, setCompCount] = useState(() => componentsAt(0.6).length);
  const [feedback, setFeedback] = useState<Feedback>(() => bands(0.6));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const rr = (x: number, y: number, w: number, h: number, r: number): void => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const render = (s: { tau: number; prevTau: number; fadeStart: number }): void => {
      const now = performance.now();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const comps = componentsAt(s.tau);
      const smallest = smallestComponent(comps);
      const smallestSet = new Set(smallest);
      const fading = !reduced && now - s.fadeStart < 150;

      // active edges (1px #d7deea); removed edges fade out over ~150 ms
      for (let i = 0; i < 14; i++) {
        for (let j = i + 1; j < 14; j++) {
          const sim = SIM[i][j];
          if (sim >= s.tau) {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = '#d7deea';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(NODES[i].x, NODES[i].y);
            ctx.lineTo(NODES[j].x, NODES[j].y);
            ctx.stroke();
          } else if (fading && sim >= s.prevTau) {
            const alpha = clamp(1 - (now - s.fadeStart) / 150, 0, 1);
            if (alpha > 0) {
              ctx.globalAlpha = alpha;
              ctx.strokeStyle = '#d7deea';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(NODES[i].x, NODES[i].y);
              ctx.lineTo(NODES[j].x, NODES[j].y);
              ctx.stroke();
            }
          }
        }
      }
      ctx.globalAlpha = 1;

      // node tiles: dense = env fill + envDark stroke, outlier = blue fill;
      // blue nodes of the smallest component get a subtle alpha pulse (0.6-1.0)
      const pulse = reduced ? 1 : 0.8 + 0.2 * Math.sin(now / 300);
      for (let i = 0; i < 14; i++) {
        const n = NODES[i];
        const outlier = OUTLIER.has(i);
        ctx.globalAlpha = outlier && smallestSet.has(i) ? pulse : 1;
        if (outlier) {
          ctx.fillStyle = '#27446e';
          rr(n.x - 6, n.y - 6, 12, 12, 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#b8c9a7';
          ctx.strokeStyle = '#76906a';
          ctx.lineWidth = 1;
          rr(n.x - 6, n.y - 6, 12, 12, 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // 2px orange ring around every node of the smallest component
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      for (const i of smallest) {
        const n = NODES[i];
        rr(n.x - 8, n.y - 8, 16, 16, 3);
        ctx.stroke();
      }

      // legend row at bottom-right (y ~ 218)
      const legend: Array<[string, string]> = [
        ['普通样本', '#b8c9a7'],
        ['长尾稀疏簇', '#27446e'],
        ['当前候选', '#d97706'],
      ];
      ctx.font = '11px sans-serif';
      ctx.textBaseline = 'middle';
      let lx = 343;
      for (const [text, color] of legend) {
        rr(lx, 212, 10, 10, 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = '#68778f';
        ctx.fillText(text, lx + 14, 218);
        lx += 14 + ctx.measureText(text).width + 14;
      }
    };

    const tick = (): void => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    const start = (): void => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const v = Number(e.target.value);
    const prev = stateRef.current.tau;
    stateRef.current.prevTau = prev;
    stateRef.current.tau = v;
    if (edgesChanged(prev, v)) stateRef.current.fadeStart = performance.now();
    setTau(v);
    setCompCount(componentsAt(v).length);
    setFeedback(bands(v));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>相似度阈值 τ</label>
        <input
          type="range"
          min={0.4}
          max={0.95}
          step={0.01}
          value={tau}
          onChange={onChange}
          aria-label="相似度阈值 τ"
        />
        <span className="val" style={{ color: '#d97706' }}>
          当前阈值 τ = {tau.toFixed(2)}
        </span>
        <span className="val" style={{ color: '#21324a' }}>
          连通分量数 = {compCount}
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
      <p style={{ color: '#68778f', fontSize: 12, marginTop: 6 }}>
        与 K-Means 不同，这里不强制每个样本进簇——稀疏区保持可见。
      </p>
    </div>
  );
};

export default Ch3Mod1;
