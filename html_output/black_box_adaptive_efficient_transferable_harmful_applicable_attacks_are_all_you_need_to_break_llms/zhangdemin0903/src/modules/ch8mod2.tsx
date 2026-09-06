import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type View = 'table' | 'xfer' | 'eff';

const ATTACKS = ['GCG+', 'Ample+', 'PAIR', 'PAIR+', 'BON', 'JR1+', 'INP.', 'IHO'] as const;
type Attack = (typeof ATTACKS)[number];
const TARGETS = ['Qwen-32B', 'Qwen-7B', 'Qwen-7B+D', 'LLaMA-8B', 'CB', 'CB+D', 'LAT', 'CAT'] as const;
type Target = (typeof TARGETS)[number];
type Row = Record<Attack, number | null>;

const TRAIN: Record<Target, Row> = {
  'Qwen-32B': { 'GCG+': 0.84, 'Ample+': 0.31, PAIR: 0.71, 'PAIR+': 0.87, BON: 0.71, 'JR1+': 0.87, 'INP.': 0.78, IHO: 0.91 },
  'Qwen-7B': { 'GCG+': 0.87, 'Ample+': 0.52, PAIR: 0.77, 'PAIR+': 0.91, BON: 0.73, 'JR1+': 0.88, 'INP.': 0.82, IHO: 0.93 },
  'Qwen-7B+D': { 'GCG+': null, 'Ample+': 0.06, PAIR: 0.41, 'PAIR+': 0.71, BON: 0.57, 'JR1+': 0.66, 'INP.': 0.66, IHO: 0.8 },
  'LLaMA-8B': { 'GCG+': 0.76, 'Ample+': 0.08, PAIR: 0.49, 'PAIR+': 0.77, BON: 0.79, 'JR1+': 0.82, 'INP.': 0.75, IHO: 0.84 },
  CB: { 'GCG+': 0.14, 'Ample+': 0.11, PAIR: 0.25, 'PAIR+': 0.58, BON: 0.45, 'JR1+': 0.47, 'INP.': 0.63, IHO: 0.82 },
  'CB+D': { 'GCG+': null, 'Ample+': 0.02, PAIR: 0.17, 'PAIR+': 0.46, BON: 0.37, 'JR1+': 0.38, 'INP.': 0.55, IHO: 0.77 },
  LAT: { 'GCG+': 0.46, 'Ample+': 0.0, PAIR: 0.31, 'PAIR+': 0.63, BON: 0.02, 'JR1+': 0.62, 'INP.': 0.61, IHO: 0.78 },
  CAT: { 'GCG+': 0.04, 'Ample+': 0.0, PAIR: 0.35, 'PAIR+': 0.67, BON: 0.01, 'JR1+': 0.7, 'INP.': 0.54, IHO: 0.79 },
};

const HOLD: Record<Target, Row> = {
  'Qwen-32B': { 'GCG+': 0.85, 'Ample+': 0.36, PAIR: 0.75, 'PAIR+': 0.87, BON: 0.75, 'JR1+': 0.88, 'INP.': 0.8, IHO: 0.92 },
  'Qwen-7B': { 'GCG+': 0.89, 'Ample+': 0.53, PAIR: 0.78, 'PAIR+': 0.9, BON: 0.77, 'JR1+': 0.89, 'INP.': 0.85, IHO: 0.94 },
  'Qwen-7B+D': { 'GCG+': null, 'Ample+': 0.09, PAIR: 0.43, 'PAIR+': 0.7, BON: 0.61, 'JR1+': 0.72, 'INP.': 0.69, IHO: 0.82 },
  'LLaMA-8B': { 'GCG+': 0.78, 'Ample+': 0.13, PAIR: 0.56, 'PAIR+': 0.76, BON: 0.81, 'JR1+': 0.83, 'INP.': 0.74, IHO: 0.85 },
  CB: { 'GCG+': 0.17, 'Ample+': 0.09, PAIR: 0.27, 'PAIR+': 0.62, BON: 0.49, 'JR1+': 0.54, 'INP.': 0.64, IHO: 0.82 },
  'CB+D': { 'GCG+': null, 'Ample+': 0.01, PAIR: 0.21, 'PAIR+': 0.52, BON: 0.37, 'JR1+': 0.44, 'INP.': 0.57, IHO: 0.79 },
  LAT: { 'GCG+': 0.48, 'Ample+': 0.01, PAIR: 0.38, 'PAIR+': 0.65, BON: 0.03, 'JR1+': 0.67, 'INP.': 0.62, IHO: 0.78 },
  CAT: { 'GCG+': 0.07, 'Ample+': 0.0, PAIR: 0.41, 'PAIR+': 0.67, BON: 0.01, 'JR1+': 0.72, 'INP.': 0.58, IHO: 0.78 },
};

const COL = {
  IHO: '#228d5c',
  JR1: '#27446e',
  PAIR: '#d97706',
  INP: '#7c3aed',
  GCG: '#c43f52',
  muted: '#68778f',
  line: '#d7deea',
  text: '#21324a',
  bg: '#fbfcfe',
};

function rowMax(row: Row): number {
  return Math.max(...ATTACKS.map((a) => row[a] ?? -1));
}

function EvusTable({ title, data }: { title: string; data: Record<Target, Row> }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#27446e', marginBottom: 6 }}>{title}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 6, borderBottom: '2px solid #d7deea', color: '#27446e' }}>目标</th>
              {ATTACKS.map((a) => (
                <th
                  key={a}
                  style={{
                    textAlign: 'center',
                    padding: 6,
                    borderBottom: '2px solid #d7deea',
                    color: a === 'IHO' ? COL.IHO : '#27446e',
                    fontWeight: a === 'IHO' ? 800 : 700,
                    background: a === 'IHO' ? '#e8f6ee' : undefined,
                  }}
                >
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TARGETS.map((t) => {
              const row = data[t];
              const best = rowMax(row);
              return (
                <tr key={t}>
                  <td style={{ textAlign: 'left', padding: 6, fontWeight: 700, borderBottom: '1px solid #eef1f6' }}>{t}</td>
                  {ATTACKS.map((a) => {
                    const v = row[a];
                    const isBest = v !== null && Math.abs(v - best) < 1e-9;
                    return (
                      <td
                        key={a}
                        style={{
                          textAlign: 'center',
                          padding: 6,
                          borderBottom: '1px solid #eef1f6',
                          fontWeight: isBest ? 800 : 500,
                          color: isBest ? COL.IHO : COL.text,
                          background: a === 'IHO' ? '#e8f6ee' : undefined,
                        }}
                      >
                        {v === null ? '—' : isBest ? `★ ${v.toFixed(2)}` : v.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const FIG3_BASE: Record<Target, [number, number, number]> = {
  'Qwen-32B': [0.87, 0.88, 0.8],
  'Qwen-7B': [0.9, 0.89, 0.85],
  'Qwen-7B+D': [0.7, 0.72, 0.69],
  'LLaMA-8B': [0.76, 0.83, 0.74],
  CB: [0.62, 0.54, 0.64],
  'CB+D': [0.52, 0.44, 0.57],
  LAT: [0.65, 0.67, 0.62],
  CAT: [0.67, 0.72, 0.58],
};

/** Rows = evaluated target; columns = IHO trained on the same 8 models. Paper Fig. 3. */
const FIG3_IHO: Record<Target, number[]> = {
  'Qwen-32B': [0.92, 0.92, 0.81, 0.86, 0.79, 0.77, 0.81, 0.79],
  'Qwen-7B': [0.95, 0.94, 0.85, 0.89, 0.82, 0.81, 0.83, 0.82],
  'Qwen-7B+D': [0.83, 0.8, 0.82, 0.81, 0.78, 0.79, 0.78, 0.78],
  'LLaMA-8B': [0.89, 0.87, 0.8, 0.85, 0.82, 0.79, 0.8, 0.78],
  CB: [0.75, 0.71, 0.76, 0.79, 0.82, 0.8, 0.77, 0.78],
  'CB+D': [0.6, 0.55, 0.72, 0.71, 0.78, 0.79, 0.72, 0.74],
  LAT: [0.75, 0.69, 0.75, 0.78, 0.79, 0.78, 0.78, 0.77],
  CAT: [0.61, 0.55, 0.71, 0.68, 0.74, 0.74, 0.72, 0.78],
};

const SHORT: Record<Target, string> = {
  'Qwen-32B': 'Q32',
  'Qwen-7B': 'Q7',
  'Qwen-7B+D': 'Q7+D',
  'LLaMA-8B': 'L8',
  CB: 'CB',
  'CB+D': 'CB+D',
  LAT: 'LAT',
  CAT: 'CAT',
};

const VIRIDIS: [number, number, number, number][] = [
  [0, 68, 1, 84],
  [0.25, 59, 82, 139],
  [0.5, 33, 145, 140],
  [0.75, 94, 201, 98],
  [1, 253, 231, 37],
];

function evusColor(v: number): { bg: string; fg: string } {
  const t = Math.max(0, Math.min(1, (v - 0.4) / 0.6));
  let i = 0;
  while (i < VIRIDIS.length - 2 && t > VIRIDIS[i + 1][0]) i += 1;
  const a = VIRIDIS[i];
  const b = VIRIDIS[i + 1];
  const u = (t - a[0]) / (b[0] - a[0]);
  const r = Math.round(a[1] + (b[1] - a[1]) * u);
  const g = Math.round(a[2] + (b[2] - a[2]) * u);
  const bl = Math.round(a[3] + (b[3] - a[3]) * u);
  const luma = 0.299 * r + 0.587 * g + 0.114 * bl;
  return { bg: `rgb(${r},${g},${bl})`, fg: luma > 165 ? '#1a1a1a' : '#fff' };
}

function HeatCell({ v, emphasize }: { v: number; emphasize?: boolean }) {
  const { bg, fg } = evusColor(v);
  return (
    <td
      style={{
        textAlign: 'center',
        padding: '7px 4px',
        background: bg,
        color: fg,
        fontWeight: emphasize ? 800 : 600,
        fontSize: 11,
        border: emphasize ? '2px solid #21324a' : '1px solid rgba(255,255,255,0.35)',
      }}
    >
      {v.toFixed(2)}
    </td>
  );
}

function TransferHeatmap() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: 640, fontSize: 11 }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ textAlign: 'left', padding: '4px 8px', color: COL.muted, fontWeight: 600 }}>
              评估目标
            </th>
            <th colSpan={3} style={{ textAlign: 'center', padding: 6, borderBottom: '1px solid #d7deea', color: '#27446e' }}>
              基线
            </th>
            <th
              colSpan={8}
              style={{ textAlign: 'center', padding: 6, borderBottom: '1px solid #d7deea', color: COL.IHO, background: '#e8f6ee' }}
            >
              IHO 训练源
            </th>
          </tr>
          <tr>
            {['PAIR+', 'JR1+', 'INP.'].map((h) => (
              <th key={h} style={{ textAlign: 'center', padding: '6px 4px', color: '#27446e', fontWeight: 700 }}>
                {h}
              </th>
            ))}
            {TARGETS.map((s) => (
              <th key={s} style={{ textAlign: 'center', padding: '6px 4px', color: COL.IHO, background: '#e8f6ee', fontWeight: 700 }}>
                {SHORT[s]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TARGETS.map((t) => (
            <tr key={t}>
              <td style={{ textAlign: 'left', padding: '4px 8px', fontWeight: 700, whiteSpace: 'nowrap' }}>{t}</td>
              {FIG3_BASE[t].map((v, i) => (
                <HeatCell key={i} v={v} />
              ))}
              {FIG3_IHO[t].map((v, i) => (
                <HeatCell key={TARGETS[i]} v={v} emphasize={TARGETS[i] === t} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 11, color: COL.muted }}>
        <span>EVUS</span>
        <span>0.40</span>
        <div style={{ display: 'flex', height: 10, flex: 1, maxWidth: 220, borderRadius: 4, overflow: 'hidden' }}>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} style={{ flex: 1, background: evusColor(0.4 + (i / 23) * 0.6).bg }} />
          ))}
        </div>
        <span>1.00</span>
        <span>黑框 = 源与目标相同</span>
      </div>
    </div>
  );
}

function LineChart({
  series,
}: {
  series: { xs: number[]; ys: number[]; color: string; label: string; width?: number }[];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, 560, 220);
    } catch {
      return;
    }
    const w = 560;
    const h = 220;
    const L = 42;
    const T = 18;
    const W = w - L - 12;
    const H = h - T - 36;
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = COL.line;
    ctx.beginPath();
    ctx.moveTo(L, T);
    ctx.lineTo(L, T + H);
    ctx.lineTo(L + W, T + H);
    ctx.stroke();
    const mx = (x: number) => L + (x / 500) * W;
    const my = (y: number) => T + H - y * H;
    ctx.fillStyle = COL.muted;
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('纵轴 EASR', 6, 12);
    ctx.fillText('100', mx(100) - 8, T + H + 16);
    ctx.fillText('500', mx(500) - 16, T + H + 16);
    ctx.fillText('横轴：尝试次数', L + W - 92, T + H + 28);
    series.forEach((s, si) => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width ?? 2;
      ctx.beginPath();
      s.xs.forEach((x, i) => {
        const px = mx(x);
        const py = my(s.ys[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.fillStyle = s.color;
      ctx.fillText(s.label, L + 96 + si * 72, 14);
    });
    canvas.classList.add('is-ready');
  }, [series]);
  return <canvas ref={ref} width={560} height={220} style={{ width: '100%', maxWidth: 560 }} />;
}

const EFF_SERIES = [
  { xs: [0, 40, 100, 200, 500], ys: [0, 0.72, 0.9, 0.93, 0.94], color: COL.IHO, label: 'IHO', width: 3 },
  { xs: [0, 40, 100, 200, 500], ys: [0, 0.45, 0.68, 0.78, 0.84], color: COL.JR1, label: 'JR1+' },
  { xs: [0, 40, 100, 200, 500], ys: [0, 0.28, 0.42, 0.5, 0.55], color: COL.PAIR, label: 'PAIR+' },
  { xs: [0, 40, 100, 200, 500], ys: [0, 0.22, 0.35, 0.42, 0.48], color: COL.GCG, label: 'GCG+' },
];

export const Ch8Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [view, setView] = useState<View>('table');

  return (
    <div id={`cv-${chapterId}-${moduleId}`}>
      <div className="chip-row">
        <button type="button" className={`chip${view === 'table' ? ' selected' : ''}`} onClick={() => setView('table')}>
          固定目标：训练与留出
        </button>
        <button type="button" className={`chip${view === 'xfer' ? ' selected' : ''}`} onClick={() => setView('xfer')}>
          跨模型 source–target
        </button>
        <button type="button" className={`chip${view === 'eff' ? ' selected' : ''}`} onClick={() => setView('eff')}>
          样本效率：100 vs 500
        </button>
      </div>

      {view === 'table' ? (
        <>
          <p style={{ margin: '10px 0 0', fontSize: 13, color: COL.muted }}>
            绿色列与 ★ 为该行最优：每一行都是 IHO。— 表示该攻击不适用。
          </p>
          <EvusTable title="训练行为（60）" data={TRAIN} />
          <EvusTable title="留出行为（40）" data={HOLD} />
          <div className="feedback good">
            固定目标上，训练与未见留出两边 IHO 均为最强。有防御时差距最大：CB 0.82 vs ≤0.63，CB+D 0.77 vs &lt;0.55。
          </div>
        </>
      ) : null}

      {view === 'xfer' ? (
        <>
          <p style={{ margin: '10px 0 8px', fontSize: 14, lineHeight: 1.55 }}>
            行是评估目标，列是 IHO 的训练源。对角线（黑框）为源=目标；非对角是迁到未见模型。颜色越亮 EVUS 越高。
          </p>
          <TransferHeatmap />
          <div className="feedback good">
            源与目标鲁棒性相当（例如都弱对齐，或都带防御）时，IHO 是有效的跨模型攻击。错配则双向变差：弱源打强目标会被拒，强源打弱目标又会高估对方防御——说明策略会按需深度适配某一种防御。
          </div>
        </>
      ) : null}

      {view === 'eff' ? (
        <>
          <p style={{ margin: '10px 0 8px', fontSize: 14, lineHeight: 1.55 }}>
            横轴是尝试次数：对同一有害行为，发一次提示、拿一次回答计 1 次；100 / 500 是允许试的次数，试得越少越省查询。
            纵轴是 EASR(n, 0.8)：评判危害分超过 0.8 时，试 n 次后「至少成功一次」的期望概率。越高、升得越快，说明同样查询预算下攻击越强。
          </p>
          <LineChart series={EFF_SERIES} />
          <div style={{ overflowX: 'auto', marginTop: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 6, borderBottom: '2px solid #d7deea' }}>方法</th>
                  <th style={{ textAlign: 'center', padding: 6, borderBottom: '2px solid #d7deea' }}>试 100 次</th>
                  <th style={{ textAlign: 'center', padding: 6, borderBottom: '2px solid #d7deea' }}>试 500 次</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 6, fontWeight: 800, color: COL.IHO, background: '#e8f6ee' }}>IHO</td>
                  <td style={{ textAlign: 'center', padding: 6, fontWeight: 800, color: COL.IHO, background: '#e8f6ee' }}>
                    ★ 接近天花板
                  </td>
                  <td style={{ textAlign: 'center', padding: 6, background: '#e8f6ee' }}>已饱和</td>
                </tr>
                <tr>
                  <td style={{ padding: 6, fontWeight: 700 }}>JR1+</td>
                  <td style={{ textAlign: 'center', padding: 6 }}>仍落后</td>
                  <td style={{ textAlign: 'center', padding: 6 }}>仍低于 IHO@100</td>
                </tr>
                <tr>
                  <td style={{ padding: 6, fontWeight: 700 }}>PAIR+ / GCG+</td>
                  <td style={{ textAlign: 'center', padding: 6 }}>平台更低</td>
                  <td style={{ textAlign: 'center', padding: 6 }}>仍低于 IHO@100</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="feedback good">
            IHO 大约试 100 次就接近上限；JR1+ 最接近但仍全程落后，GCG+ 与 PAIR+ 更低。IHO 在 100 次后的表现，优于其他方法试满 500 次。训练是一次性成本，之后可跨模型复用；相对同骨干 INPAINTING，每样本推理 FLOPs 约降 76%。
          </div>
        </>
      ) : null}

      <div className="feedback good" style={{ marginTop: 16 }}>
        <strong>实验结论。</strong>
        固定目标上，训练与未见留出行为 IHO 均为最强，有防御时差距最大（CB 0.82 vs ≤0.63，CB+D 0.77 vs &lt;0.55）。
        跨模型需源与目标鲁棒性匹配，错配会双向变差。
        约 100 次查询即接近上限，优于基线试满 500 次。
        综合无防御、对抗训练与分层流水线上的表现，IHO 有望成为标准化越狱评估攻击。
      </div>
    </div>
  );
};

export default Ch8Mod2;
