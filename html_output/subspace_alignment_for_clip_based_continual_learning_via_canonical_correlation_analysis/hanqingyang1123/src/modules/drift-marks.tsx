import React, { useState } from 'react';

/** 逐批推移：画版落点比字版漂移得快，错位扩大、字画重合度下降。 */
export function DriftMarks({ moduleId }: { moduleId: string }) {
  const [t, setT] = useState(3); // 批次 1–10

  const dx = 14 + 30 * (t - 1);
  const dy = 6 + 9 * (t - 1);
  const cx = 420;
  const cy = 240;
  const dist = Math.sqrt(dx * dx + dy * dy) / 600;
  const overlap = Math.max(12, (1 - dist) * 100);

  const tone = dist < 0.25 ? 'good' : dist < 0.5 ? 'warn' : 'bad';
  const sentence =
    dist < 0.25
      ? '还压得住：两版十字基本套准，字画没有明显重影。'
      : dist < 0.5
      ? '开始走版：画版十字先偏，字版只小幅移动，错位在累积。'
      : '字画分离：画版已经偏出半格，再按旧法手挪也追不回来。';

  return (
    <div className="rs">
      <div className="rs-field rs-sheet-lines" style={{ left: 0, top: 0, width: 900, height: 496 }}>
        <svg viewBox="0 0 900 496" width="100%" height="100%" role="img" aria-label="套印十字随批次错位">
          <rect x="26" y="24" width="848" height="448" rx="10" fill="#fdfdf8" stroke="#d7deea" strokeWidth="2" />
          {Array.from({ length: 13 }, (_, i) => (
            <path key={`v${i}`} d={`M${26 + i * 70} 24V472`} stroke="#e8edf4" strokeWidth="1" />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <path key={`h${i}`} d={`M26 ${24 + i * 70}H874`} stroke="#e8edf4" strokeWidth="1" />
          ))}

          <text x="48" y="62" fontSize="28" fill="#68778f">第 {t} 批</text>
          <text x="48" y="98" fontSize="28" fill="#27446e" fontWeight="700">画版 A · 图像特征</text>
          <text x="852" y="98" textAnchor="end" fontSize="28" fill="#228d5c" fontWeight="700">字版 B · 文本特征</text>

          {/* 画出的画面块 */}
          <g transform={`translate(${cx + dx * 0.5} ${cy + dy * 0.5})`}>
            <rect x="-104" y="-56" width="208" height="112" rx="10" fill="rgba(39,68,110,0.06)" stroke="#27446e" strokeWidth="2" />
            <path d="M-70 20L-22 -22L16 14L48 -8L74 20" fill="none" stroke="#27446e" strokeWidth="2" opacity="0.45" />
          </g>

          <g transform={`translate(${cx} ${cy})`}>
            <circle r="24" fill="none" stroke="#228d5c" strokeWidth="2.5" />
            <path d="M-34 0H34M0 -34V34" stroke="#228d5c" strokeWidth="2.5" />
            <circle r="3.5" fill="#228d5c" />
          </g>
          <g transform={`translate(${cx + dx} ${cy + dy})`}>
            <circle r="24" fill="none" stroke="#27446e" strokeWidth="2.5" />
            <path d="M-34 0H34M0 -34V34" stroke="#27446e" strokeWidth="2.5" />
            <circle r="3.5" fill="#27446e" />
          </g>
          <path d={`M${cx} ${cy}L${cx + dx} ${cy + dy}`} stroke="#c43f52" strokeWidth="2" strokeDasharray="6 5" />
          <text x={cx + dx / 2} y={cy + Math.max(dy, 0) / 2 + 118} textAnchor="middle" fontSize="28" fill="#c43f52" fontWeight="700">
            错位 {dist.toFixed(2)}
          </text>
        </svg>
      </div>

      <div className="rs-panel" style={{ left: 0, top: 512, width: 900, height: 110 }}>
        <div className="rs-readout" style={{ justifyContent: 'space-between' }}>
          <span>批次 <b>{t}</b> / 10</span>
          <span className="rs-t muted">拖动看画版越走越远</span>
        </div>
        <input className="rs-range" style={{ marginTop: 10 }} type="range" min={1} max={10} step={1}
          value={t} onChange={(e) => setT(Number(e.target.value))} aria-label="批次" />
      </div>

      <div className="rs-panel" style={{ left: 924, top: 0, width: 548, height: 622 }}>
        <p className="rs-t muted">两版十字中心错位（示意）</p>
        <p className={`rs-num ${dist < 0.25 ? 'rs-green' : dist < 0.5 ? 'rs-orange' : 'rs-red'}`}>
          {dist.toFixed(2)}
        </p>
        <div style={{ marginTop: 14 }}>
          <p className="rs-t muted">字画重合度（示意）</p>
          <p className="rs-num">{overlap.toFixed(0)}%</p>
        </div>
        <div className={`rs-feedback ${tone}`} style={{ marginTop: 16 }}>{sentence}</div>
        <p className="rs-t muted" style={{ marginTop: 14 }}>
          画版随题材变化大，字版漂移较小；错位就是这样一批批攒出来的。
        </p>
        <p className="rs-t muted" style={{ marginTop: 10, opacity: 0.75 }}>
          十字位移是式(8)“图文对平均 L2 距离”的直观类比，两者不是同一个量。
        </p>
      </div>
    </div>
  );
}
