import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Pack = { x: number; y: number; rot: number; label: string };

const OLD: Pack[] = [
  { x: 150, y: 190, rot: -8, label: '旧类 A' },
  { x: 320, y: 172, rot: 6, label: '旧类 B' },
  { x: 500, y: 188, rot: -3, label: '旧类 C' },
  { x: 230, y: 262, rot: 9, label: '旧类 D' },
  { x: 420, y: 268, rot: -7, label: '旧类 E' },
];
const NEW: Pack[] = [
  { x: 140, y: 330, rot: 5, label: '新类 1' },
  { x: 280, y: 345, rot: -6, label: '新类 2' },
  { x: 420, y: 332, rot: 8, label: '新类 3' },
  { x: 540, y: 348, rot: -4, label: '新类 4' },
  { x: 220, y: 386, rot: 3, label: '新类 5' },
  { x: 380, y: 388, rot: -9, label: '新类 6' },
];

export function S1MixedDrawer(_props: WidgetProps) {
  const [inflow, setInflow] = useState(45);
  const t = inflow / 100;
  const kept = 1 - t * 0.86;
  const state = t < 0.3 ? 'ok' : t < 0.7 ? 'warn' : 'bad';
  const feedback = state === 'ok'
    ? '旧药还找得到：新药只占了一角。'
    : state === 'warn'
      ? '旧药被压到下层，标签开始被盖住。'
      : '旧药的签已经看不见了：同一个抽屉装不下两批药。';

  return (
    <div className="der-page">
      <div className="der-grid" style={{ gridTemplateColumns: '1.12fr .88fr' }}>
        <div className="der-col" style={{ justifyContent: 'center' }}>
          <svg viewBox="0 0 760 470" role="img" aria-label={`抽屉内部：新药涌入 ${inflow}%，旧药包被推向后层，可辨识度约 ${kept * 100}%`}>
            <defs>
              <linearGradient id="drawerFloor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#7a4f33" />
                <stop offset="1" stopColor="#9a6743" />
              </linearGradient>
              <linearGradient id="cabinetFace" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#c08b60" />
                <stop offset="1" stopColor="#8f5c3b" />
              </linearGradient>
            </defs>
            <rect x="14" y="18" width="732" height="72" rx="12" fill="url(#cabinetFace)" stroke="#6d432a" strokeWidth="2" />
            <text x="34" y="64" fontSize="26" fontWeight="700" fill="#3d2718">一个抽屉</text>
            <text x="728" y="64" textAnchor="end" fontSize="24" fill="#4a3121">新旧药共用同一组参数</text>

            <rect x="40" y="96" width="680" height="330" rx="14" fill="url(#drawerFloor)" stroke="#5f3a24" strokeWidth="4" />
            <g opacity=".22" stroke="#3c2415" strokeWidth="2">
              {Array.from({ length: 7 }, (_, i) => (
                <line key={i} x1={56 + i * 94} y1="104" x2={56 + i * 94} y2="418" />
              ))}
            </g>

            {OLD.map((p, i) => {
              const push = t * (86 + i * 7);
              const opacity = Math.max(0.08, 1 - t * 0.92);
              const covered = NEW.slice(0, Math.round(t * 6)).some(n => Math.abs(n.x - p.x) < 110);
              return (
                <g key={p.label} transform={`translate(${p.x} ${p.y - push}) rotate(${p.rot})`} opacity={opacity}>
                  <rect x="-50" y="-27" width="100" height="54" rx="6" fill="#f6ead2" stroke="#c8a984" strokeWidth="2" />
                  <path d="M-50 -9 h100" stroke="#c8a984" strokeWidth="1.6" />
                  <text x="0" y="11" textAnchor="middle" fontSize="19" fontWeight="700" fill="#5b4a36">{p.label}</text>
                  {covered && <rect x="-50" y="-27" width="100" height="54" rx="6" fill="#3c2415" opacity=".35" />}
                </g>
              );
            })}

            {NEW.slice(0, Math.round(t * 6)).map((p, i) => (
              <g key={p.label} transform={`translate(${p.x} ${p.y - (1 - t) * 90}) rotate(${p.rot})`}>
                <rect x="-50" y="-27" width="100" height="54" rx="6" fill="#e7f3e4" stroke="#93bb8d" strokeWidth="2" />
                <path d="M-50 -9 h100" stroke="#93bb8d" strokeWidth="1.6" />
                <text x="0" y="11" textAnchor="middle" fontSize="19" fontWeight="700" fill="#3e5a38">{p.label}</text>
              </g>
            ))}

            <rect x="40" y="426" width="680" height="30" rx="8" fill="#a9704a" stroke="#5f3a24" strokeWidth="2" />
            <rect x="330" y="434" width="100" height="12" rx="6" fill="#e0b34e" />
          </svg>
        </div>

        <div className="der-col" style={{ justifyContent: 'center' }}>
          <div className="der-panel" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="der-row der-spread">
              <span className="der-h">旧药可辨识度</span>
              <span className="der-num" style={{ color: state === 'bad' ? '#c43f52' : state === 'warn' ? '#b3572b' : '#228d5c' }}>
                {Math.round(kept * 100)}%
              </span>
            </div>
            <div className={`der-meter ${state === 'bad' ? 'is-bad' : state === 'warn' ? 'is-orange' : 'is-good'}`}>
              <span style={{ width: `${kept * 100}%` }} />
            </div>
            <p className="der-p" style={{ color: state === 'bad' ? '#c43f52' : '#3b2c1f', minHeight: 84 }}>{feedback}</p>

            <div className="der-col" style={{ gap: 6 }}>
              <div className="der-row der-spread">
                <label className="der-p" htmlFor="der-inflow">新药涌入量</label>
                <span className="der-p der-em" style={{ fontVariantNumeric: 'tabular-nums' }}>{inflow}%</span>
              </div>
              <input id="der-inflow" className="der-slider" type="range" min={0} max={100} step={5}
                value={inflow} onChange={e => setInflow(Number(e.target.value))}
                aria-valuetext={`新药涌入 ${inflow}%，旧药可辨识度约 ${Math.round(kept * 100)}%`} />
            </div>

            <p className="der-note-sm">
              同一个抽屉 = 同一组参数同时拟合新旧分布。旧类精度下降叫灾难性遗忘，但药本身并没有被删掉。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
