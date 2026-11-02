import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

const TOTAL = 24;
const ORDER = [3, 9, 15, 21, 6, 12, 18, 0, 7, 13, 19, 1, 10, 16, 22, 4, 8, 14, 20, 2, 5, 11, 17, 23];

function initialMask(): boolean[] {
  const on = new Array(TOTAL).fill(false);
  ORDER.slice(0, 14).forEach(i => { on[i] = true; });
  return on;
}

export function S6Mask(_props: WidgetProps) {
  const [mask, setMask] = useState<boolean[]>(initialMask);
  const kept = mask.filter(Boolean).length;
  const ratio = kept / TOTAL;

  const tone = kept <= 8 ? '#c43f52' : kept <= 18 ? '#228d5c' : '#b3572b';
  const feedback = kept <= 8
    ? '格子太少：柜子很轻，但新类可能装不下。'
    : kept <= 18
      ? '留下的格够分清新类，又没有白占地方。'
      : '几乎没剪：容量足，但格子几乎全留。';

  const toggle = (i: number) => {
    const next = [...mask];
    next[i] = !next[i];
    setMask(next);
  };

  return (
    <div className="der-page">
      <div className="der-grid" style={{ gridTemplateColumns: '1.06fr .94fr', gap: 22 }}>
        <div className="der-col" style={{ justifyContent: 'center' }}>
          <div className="der-cabinet" style={{ padding: 16 }}>
            <div className="der-drawer is-open" style={{ padding: '14px 18px 18px', gap: 12 }}>
              <div className="der-row der-spread" style={{ width: '100%' }}>
                <span className="der-drawer-label" style={{ background: '#e7f3e4', color: '#2f4a2a' }}>F(t) 新屉 · 通道掩码</span>
                <span className="der-note-sm" style={{ color: '#3c2a1c' }}>点格子开关该通道</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, width: '100%' }}>
                {mask.map((on, i) => (
                  <button key={i} className={`der-slot ${on ? '' : 'is-off'}`} onClick={() => toggle(i)}
                    style={{ width: '100%', height: 'auto', aspectRatio: '1' }}
                    aria-pressed={on} aria-label={`通道 ${i + 1} ${on ? '保留' : '剪掉'}`}>
                    <span className="der-herb" />
                  </button>
                ))}
              </div>
              <div className="der-handle" style={{ marginTop: 4 }} />
            </div>
          </div>
        </div>

        <div className="der-col" style={{ justifyContent: 'center', gap: 12 }}>
          <div className="der-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="der-row der-spread">
              <span className="der-h">保留通道</span>
              <span className="der-num" style={{ color: tone }}>{kept}<span className="der-p der-muted"> / {TOTAL}</span></span>
            </div>
            <div className="der-row der-spread">
              <span className="der-p">
                稀疏损失 <SymbolHint meaning="L_S：按已用权重占全部权重的比例惩罚冗余">L_S</SymbolHint>
              </span>
              <span className="der-p der-muted">∝（已用 / 全部）²</span>
            </div>
            <div className="der-meter is-orange"><span style={{ width: `${ratio * 100}%` }} /></div>
            <p className="der-p" style={{ color: tone }}>{feedback}</p>
          </div>

          <div className="der-row" style={{ gap: 10 }}>
            <button className="der-chip" onClick={() => setMask(new Array(TOTAL).fill(true))}>全部保留</button>
            <button className="der-chip" onClick={() => setMask(new Array(TOTAL).fill(false))}>全部剪除</button>
            <button className="der-chip" onClick={() => setMask(initialMask())}>恢复默认</button>
          </div>

          <div className="der-eq-block" style={{ fontSize: 26, lineHeight: 1.6 }}>
            f′<sub>l</sub> = f<sub>l</sub> ⊙ <SymbolHint meaning="第 l 层的通道掩码，取值 0–1">m<sub>l</sub></SymbolHint>，
            m<sub>l</sub> = σ(s·e<sub>l</sub>)<br />
            L_DER = L_Ht + λa·L_Ha + λs·L_S
          </div>
        </div>
      </div>
    </div>
  );
}
