import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const STOPS = [
  { t: 200, img: 'face-2', psnr: 29.61, qalign: 3.475 },
  { t: 400, img: 'face-3', psnr: 29.245, qalign: 3.5635 },
  { t: 500, img: 'face-4', psnr: 28.387, qalign: 3.7491 },
  { t: 600, img: 'face-5', psnr: 28.473, qalign: 3.7372 },
];
const FALLBACK = [
  '保真优先：结构最接近输入，细节仍偏软。',
  '开始补细节：PSNR 仍高，QALIGN 上升。',
  '论文主表档位：无参考指标最高，PSNR 已下降。',
  '更敢补语义：QALIGN 略回落，伪影风险上升。',
];
const TONE = ['is-paper', 'is-good', 'is-paper', 'is-warn'];

export function TadsrTPrior(_: WidgetProps) {
  const [i, setI] = useState(0);
  const p = STOPS[i];
  const angle = -120 + i * 80;
  const xs = [100, 240, 340, 470];
  const psnrY = (v: number) => 176 - (v - 28.2) / 1.6 * 132;
  const qY = (v: number) => 176 - (v - 3.42) / 0.36 * 132;

  return (
    <div className="studio-page tadsr-tprior">
      <div className="studio-frame tadsr-tprior-scene">
        <div className="tadsr-tprior-photo"><img src={`./images/${p.img}.png`} alt={`t_s=${p.t} 的人脸修复输出`} /></div>
        <div className="tadsr-tprior-gloves" aria-hidden="true">
          <svg viewBox="0 0 130 80"><path d="M8 60 Q18 22 48 24 L88 30 Q112 34 116 55 L114 66 Q74 72 36 68 Z" fill="#f3efe3" stroke="#cfc3ad" strokeWidth="3"/><path d="M34 34 Q44 14 56 22 M50 30 Q58 12 70 22" fill="none" stroke="#cfc3ad" strokeWidth="3" strokeLinecap="round"/></svg>
        </div>
        <div className="tadsr-tprior-dial">
          <div className="studio-brass">
            <div className="studio-needle" style={{ transform: `rotate(${angle}deg)` }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '42%', textAlign: 'center', fontSize: 30, fontWeight: 850, color: '#5d3e20' }}>{p.t}</div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '56%', textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#6b4a2c' }}>补全档位 tₛ</div>
          </div>
        </div>
        <div className="tadsr-tprior-scale"><span>保真</span><span>补语义</span></div>
      </div>
      <div className="tadsr-tprior-side">
        <p className="studio-muted">论文 Fig.8 的人脸裁剪；曲线是 Table 3 在 DrealSR 上的四个测量点。</p>
        <div className="tadsr-tprior-read">
          <div><span>PSNR ↑</span><b>{p.psnr.toFixed(3)}</b></div>
          <div><span>QALIGN ↑</span><b>{p.qalign.toFixed(4)}</b></div>
        </div>
        <div className="studio-card" style={{ padding: '12px 14px' }}>
          <svg viewBox="0 0 560 214" role="img" aria-label="PSNR 随档位总体下降，QALIGN 随档位总体上升">
            <line x1="54" y1="176" x2="530" y2="176" stroke="#d7deea" strokeWidth="2" />
            <line x1="54" y1="38" x2="54" y2="176" stroke="#d7deea" strokeWidth="2" />
            <polyline points={xs.map((x, k) => `${x},${psnrY(STOPS[k].psnr)}`).join(' ')} fill="none" stroke="#27446e" strokeWidth="4" strokeLinejoin="round" />
            <polyline points={xs.map((x, k) => `${x},${qY(STOPS[k].qalign)}`).join(' ')} fill="none" stroke="#228d5c" strokeWidth="4" strokeLinejoin="round" />
            {STOPS.map((s, k) => (
              <g key={s.t}>
                <text x={xs[k]} y="198" textAnchor="middle" className="studio-axis">{s.t}</text>
                <circle cx={xs[k]} cy={psnrY(s.psnr)} r={k === i ? 10 : 6} fill={k === i ? '#f07e47' : '#27446e'} />
                <circle cx={xs[k]} cy={qY(s.qalign)} r={k === i ? 10 : 6} fill={k === i ? '#f07e47' : '#228d5c'} />
              </g>
            ))}
          </svg>
        </div>
        <div>
          <label className="studio-slider" style={{ marginBottom: 8 }}>
            <span>补全档位 tₛ</span><b>{p.t}</b>
            <input type="range" min={0} max={3} step={1} value={i} aria-label="补全档位"
              onChange={e => setI(Number(e.target.value))} />
          </label>
          <div className="studio-row">
            {STOPS.map((s, k) => <button key={s.t} className={`studio-btn ${k === i ? 'is-orange' : ''}`} onClick={() => setI(k)}>{s.t}</button>)}
          </div>
        </div>
        <p className={`studio-feedback ${TONE[i]}`}>{FALLBACK[i]}</p>
      </div>
    </div>
  );
}
