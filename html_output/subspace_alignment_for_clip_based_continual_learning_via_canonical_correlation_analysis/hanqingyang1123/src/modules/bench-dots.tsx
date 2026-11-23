import React, { useState } from 'react';

type Row = { name: string; avg: number | null; last: number | null };

const DATA: Record<string, Row[]> = {
  'CIFAR-100': [
    { name: 'Continual-CLIP', avg: 75.2, last: 66.7 },
    { name: 'SLCA', avg: 80.5, last: 67.5 },
    { name: 'MagMax', avg: 85.6, last: 79.0 },
    { name: 'CLAP', avg: 78.0, last: 67.5 },
    { name: 'RAPF', avg: 86.1, last: 79.0 },
    { name: 'ENGINE', avg: 86.9, last: 79.2 },
    { name: 'PROOF', avg: 84.8, last: 76.2 },
    { name: 'CCA-CL', avg: 87.2, last: 83.0 },
    { name: 'CCA-CL 无 FTT', avg: 85.4, last: 81.0 },
  ],
  'ImageNet-R': [
    { name: 'Continual-CLIP', avg: 79.1, last: 72.0 },
    { name: 'SLCA', avg: 75.9, last: 70.3 },
    { name: 'MagMax', avg: 87.1, last: 80.8 },
    { name: 'CLAP', avg: 86.3, last: 80.6 },
    { name: 'RAPF', avg: 85.5, last: 80.2 },
    { name: 'ENGINE', avg: 86.2, last: 80.3 },
    { name: 'PROOF', avg: 82.8, last: 77.0 },
    { name: 'CCA-CL', avg: 86.8, last: 81.3 },
    { name: 'CCA-CL 无 FTT', avg: 84.7, last: 79.4 },
  ],
  'ImageNet-100': [
    { name: 'Continual-CLIP', avg: 85.0, last: 75.4 },
    { name: 'SLCA', avg: 78.6, last: 59.9 },
    { name: 'MagMax', avg: 86.3, last: 75.9 },
    { name: 'CLAP', avg: 87.3, last: 79.3 },
    { name: 'RAPF', avg: 87.5, last: 80.2 },
    { name: 'ENGINE', avg: null, last: null },
    { name: 'PROOF', avg: 84.7, last: 72.4 },
    { name: 'CCA-CL', avg: 86.9, last: 80.2 },
    { name: 'CCA-CL 无 FTT', avg: 86.0, last: 78.0 },
  ],
  'CUB-200': [
    { name: 'Continual-CLIP', avg: 76.3, last: 71.3 },
    { name: 'SLCA', avg: 79.1, last: 68.2 },
    { name: 'MagMax', avg: 70.8, last: 62.1 },
    { name: 'CLAP', avg: 83.7, last: 79.0 },
    { name: 'RAPF', avg: 83.0, last: 76.3 },
    { name: 'ENGINE', avg: 85.3, last: 79.2 },
    { name: 'PROOF', avg: 83.9, last: 79.3 },
    { name: 'CCA-CL', avg: 86.3, last: 79.7 },
    { name: 'CCA-CL 无 FTT', avg: 85.9, last: 79.2 },
  ],
};
const KEYS = Object.keys(DATA);

/** 主结果：四个基准上各方法的 Avg / Last（论文表 1 真值）。 */
export function BenchDots({ moduleId }: { moduleId: string }) {
  const [ds, setDs] = useState(0);
  const rows = DATA[KEYS[ds]];

  const x = (v: number) => 560 + ((v - 55) / 35) * 380;

  return (
    <div className="rs">
      <div className="rs-panel" style={{ left: 0, top: 0, width: 1000, height: 622 }}>
        <svg viewBox="0 0 1000 590" width="100%" height="590" role="img" aria-label={`${KEYS[ds]} 上各方法 Avg 与 Last`}>
          <text x="70" y="34" fontSize="26" fill="#68778f">方法</text>
          <text x="404" y="34" textAnchor="end" fontSize="26" fill="#27446e">Avg</text>
          <text x="508" y="34" textAnchor="end" fontSize="26" fill="#228d5c">Last</text>
          <text x="560" y="34" fontSize="26" fill="#68778f">准确率（%）</text>

          {[55, 60, 65, 70, 75, 80, 85, 90].map((v) => (
            <g key={v}>
              <path d={`M${x(v)} 52V520`} stroke="#eef2f8" strokeWidth="1.5" />
              <text x={x(v)} y="556" textAnchor="middle" className="rs-tick">{v}</text>
            </g>
          ))}
          <path d={`M${x(55)} 520H${x(90)}`} stroke="#b9c4d4" strokeWidth="2" />

          {rows.map((r, i) => {
            const y = 80 + i * 52;
            const hot = r.name === 'CCA-CL';
            return (
              <g key={r.name}>
                {hot && <rect x="58" y={y - 26} width="900" height="44" rx="8" fill="rgba(34,141,92,0.09)" />}
                <text x="70" y={y + 8} fontSize="26" fontWeight={hot ? 700 : 400} fill={hot ? '#175f3d' : '#21324a'}>
                  {r.name}
                </text>
                {r.avg !== null && r.last !== null ? (
                  <>
                    <text x="404" y={y + 8} textAnchor="end" fontSize="26" fill="#27446e">{r.avg.toFixed(1)}</text>
                    <text x="508" y={y + 8} textAnchor="end" fontSize="26" fill="#228d5c">{r.last.toFixed(1)}</text>
                    <path d={`M${x(r.avg)} ${y}H${x(r.last)}`} stroke="#c9d3e2" strokeWidth="2" />
                    <circle cx={x(r.avg)} cy={y} r="8" fill="#27446e" />
                    <circle cx={x(r.last)} cy={y} r="8" fill="#228d5c" />
                  </>
                ) : (
                  <text x="560" y={y + 8} fontSize="26" fill="#8b97ab">未复现（缺 GPT 提示词）</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rs-panel" style={{ left: 1024, top: 0, width: 448, height: 622 }}>
        <div className="rs-choices">
          {KEYS.map((k, i) => (
            <button key={k} className={`rs-choice ${i === ds ? 'is-on' : ''}`} onClick={() => setDs(i)}>
              {k.replace('ImageNet', 'IN')}
            </button>
          ))}
        </div>
        <p className="rs-t" style={{ marginTop: 16 }}>
          {KEYS[ds]} · 10 个不重叠任务 · CLIP ViT-B/16
        </p>
        <div className={`rs-feedback ${ds === 0 || ds === 3 ? 'good' : 'warn'}`} style={{ marginTop: 12 }}>
          {ds === 0 && 'Avg 87.2 与 Last 83.0 都是本表最高；领先不靠 replay。'}
          {ds === 1 && 'Last 81.3 最高；Avg 86.8 低于 MagMax 87.1（正文说法与表 1 此行不符）。'}
          {ds === 2 && 'Last 与 RAPF 并列 80.2 最高；Avg 上 CLAP 87.3、RAPF 87.5 更高（均用 replay）。'}
          {ds === 3 && 'Avg 86.3 与 Last 79.7 都是本表最高。'}
        </div>
        <p className="rs-t muted" style={{ marginTop: 12 }}>
          Avg = 各任务后已见类准确率的均值；Last = 末任务准确率；均越高越好。
        </p>
        <p className="rs-t muted" style={{ marginTop: 8 }}>
          仅列 9 个代表方法；表 1 另有 L2P、DualPrompt、CODAPrompt、GCL-B。
        </p>
      </div>
    </div>
  );
}
