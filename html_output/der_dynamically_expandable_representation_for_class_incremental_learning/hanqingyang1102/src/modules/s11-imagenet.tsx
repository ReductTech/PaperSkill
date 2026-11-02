import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Row = { name: string; avg: number | null; last: number | null };
type Metric = 'top1' | 'top5';

const IMG: Record<string, Record<Metric, Row[]>> = {
  'ImageNet100-B0': {
    top1: [{ name: 'DER（本文）', avg: 76.12, last: 66.06 }],
    top5: [
      { name: 'iCaRL', avg: 83.6, last: 63.8 },
      { name: 'BiC', avg: 90.6, last: 84.4 },
      { name: 'WA', avg: 91.0, last: 84.1 },
      { name: 'RPSNet', avg: 87.9, last: 74.0 },
      { name: 'DER（本文）', avg: 92.79, last: 88.38 },
    ],
  },
  'ImageNet1000-B0': {
    top1: [
      { name: 'iCaRL', avg: 38.4, last: 22.7 },
      { name: 'WA', avg: 65.67, last: 55.6 },
      { name: 'DER（本文）', avg: 66.73, last: 58.62 },
    ],
    top5: [
      { name: 'iCaRL', avg: 63.7, last: 44.0 },
      { name: 'BiC', avg: 84.0, last: 73.2 },
      { name: 'WA', avg: 86.6, last: 81.1 },
      { name: 'DER（本文）', avg: 87.08, last: 81.89 },
    ],
  },
  'ImageNet100-B50': {
    top1: [
      { name: 'UCIR', avg: 68.09, last: 57.3 },
      { name: 'PODNet', avg: 74.33, last: null },
      { name: 'TPCIL', avg: 74.81, last: 66.91 },
      { name: 'DER（本文）', avg: 77.73, last: 72.06 },
    ],
    top5: [],
  },
};

/** 缺失组合的就地说明：不补零、不插值，而是说清「缺的是哪一列」。 */
const HINT: Record<string, string> = {
  'ImageNet100-B0|top1': '该协议下只有本文报告 top-1；其余方法在 Table 3 里只有 top-5。',
  'ImageNet100-B50|top1': '该协议只有 top-1 一列；top-5 在论文中为「-」，所以置灰、不补数。',
  'ImageNet100-B50|top5': '该协议论文只报 top-1，top-5 一列全是「-」，因此不补零、不插值。',
};

const SETS = Object.keys(IMG);
const METRICS: Metric[] = ['top1', 'top5'];

export function S11Imagenet(_props: WidgetProps) {
  const [set, setSet] = useState(SETS[0]);
  const [metric, setMetric] = useState<Metric>('top5');

  const available = (m: Metric) => IMG[set][m].length > 0;
  const shown: Metric = available(metric) ? metric : (metric === 'top1' ? 'top5' : 'top1');
  const rows = IMG[set][shown];
  const hint = HINT[`${set}|${shown}`];

  const X0 = 300, X1 = 1340, lo = 20, hi = 100;
  const x = (v: number) => X0 + ((v - lo) / (hi - lo)) * (X1 - X0);
  const h = Math.min(64, 300 / Math.max(1, rows.length));

  return (
    <div className="der-page">
      <div className="der-col" style={{ height: '100%', padding: '16px 28px', boxSizing: 'border-box', gap: 6 }}>
        <div className="der-row der-spread">
          <div className="der-row" style={{ gap: 10 }}>
            {SETS.map(s => (
              <button key={s} className={`der-chip ${set === s ? 'is-on' : ''}`}
                onClick={() => {
                  setSet(s);
                  if (IMG[s][metric].length === 0) setMetric(metric === 'top1' ? 'top5' : 'top1');
                }}
                aria-pressed={set === s}>
                {s}
              </button>
            ))}
          </div>
          <div className="der-row" style={{ gap: 10 }}>
            {METRICS.map(m => {
              const ok = available(m);
              const on = shown === m;
              return (
                <button key={m} className={`der-chip ${on ? 'is-accent is-on' : ''}`}
                  disabled={!ok}
                  title={ok ? undefined : '论文未报告该指标'}
                  style={ok ? undefined : { opacity: .38, cursor: 'not-allowed', textDecoration: 'line-through' }}
                  onClick={() => ok && setMetric(m)} aria-pressed={on} aria-disabled={!ok}>
                  {m === 'top1' ? 'top-1' : 'top-5'}
                </button>
              );
            })}
          </div>
        </div>

        {hint && <p className="der-note-sm">{hint}</p>}

        <svg viewBox="0 0 1450 400" style={{ width: '100%', flex: 1 }} role="img"
          aria-label={`${set} 的 ${shown === 'top1' ? 'top-1' : 'top-5'} 平均与末步准确率`}>
          {[20, 40, 60, 80, 100].map(v => (
            <g key={v}>
              <line x1={x(v)} y1="20" x2={x(v)} y2="356" stroke="#ece2d1" strokeWidth="1.2" />
              <text x={x(v)} y="382" textAnchor="middle" fontSize="20" fill="#68778f">{v}%</text>
            </g>
          ))}

          {rows.map((r, i) => {
            const y = 32 + i * h;
            const ours = r.name.startsWith('DER');
            return (
              <g key={r.name}>
                <text x="280" y={y + h * 0.62} textAnchor="end" fontSize="22"
                  fontWeight={ours ? 750 : 500} fill={ours ? '#1b6b47' : '#3b4a61'}>{r.name}</text>
                {r.avg != null && (
                  <g>
                    <rect x={x(lo)} y={y + 4} width={x(r.avg) - x(lo)} height={h * 0.34} rx="5"
                      fill={ours ? '#228d5c' : '#9fb6d4'} opacity={ours ? 1 : .75} />
                    <text x={x(r.avg) + 10} y={y + 4 + h * 0.28} fontSize="19" fontWeight="700"
                      fill={ours ? '#1b6b47' : '#3b4a61'}>{r.avg.toFixed(2)}</text>
                  </g>
                )}
                {r.last != null ? (
                  <g>
                    <rect x={x(lo)} y={y + 6 + h * 0.38} width={x(r.last) - x(lo)} height={h * 0.34} rx="5"
                      fill={ours ? '#7cc39b' : '#cbd8e8'} />
                    <text x={x(r.last) + 10} y={y + 6 + h * 0.38 + h * 0.28} fontSize="19"
                      fill={ours ? '#1b6b47' : '#68778f'}>{r.last.toFixed(2)}</text>
                  </g>
                ) : (
                  <text x={X0 + 8} y={y + 6 + h * 0.66} fontSize="18" fill="#a9a292">末步未报告</text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="der-row der-spread" style={{ borderTop: '1px solid #ece2d1', paddingTop: 8 }}>
          <div className="der-legend">
            <span className="der-p">ResNet-18</span>
            <span><i className="der-dot" style={{ background: '#9fb6d4' }} />平均</span>
            <span><i className="der-dot" style={{ background: '#cbd8e8' }} />末步</span>
            <span><i className="der-dot" style={{ background: '#228d5c' }} />DER 用绿色</span>
          </div>
          <span className="der-p">末步指标比平均更敏感于遗忘；top-5 对轻微错误更宽容，增益自然更小。</span>
        </div>
      </div>
    </div>
  );
}
