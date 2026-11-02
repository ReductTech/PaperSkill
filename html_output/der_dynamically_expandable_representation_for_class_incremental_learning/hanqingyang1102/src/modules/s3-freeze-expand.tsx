import React, { useState } from 'react';
import type { WidgetProps } from './registry';

export function S3FreezeExpand(_props: WidgetProps) {
  const [frozen, setFrozen] = useState(true);
  const shift = frozen ? 0 : 26;

  return (
    <div className="der-page">
      <div className="der-grid" style={{ gridTemplateColumns: '.86fr 1.14fr', gap: 22 }}>
        <div className="der-col" style={{ gap: 12 }}>
          <div className="der-row der-spread">
            <span className="der-h">旧屉要不要封</span>
            <button className={`der-chip ${frozen ? 'is-on' : 'is-accent is-on'}`}
              onClick={() => setFrozen(f => !f)} aria-pressed={frozen}>
              {frozen ? '冻结：开' : '冻结：关'}
            </button>
          </div>

          <div className="der-cabinet" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: 14, minHeight: 0 }}>
            <div className={`der-drawer ${frozen ? 'is-sealed' : ''}`} style={{ flex: 1, justifyContent: 'flex-start', paddingTop: 12 }}>
              <span className="der-drawer-label">Φ(t−1) 旧屉</span>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} className="der-tag" style={{
                    transform: `translateX(${frozen ? 0 : (i - 1) * shift}px) rotate(${frozen ? 0 : (i - 1) * 10}deg)`,
                    color: frozen ? '#5b4a36' : '#c43f52',
                    borderColor: frozen ? '#ddd0b6' : '#e3b3ba',
                    transition: 'all .45s ease',
                  }}>旧类 {String.fromCharCode(65 + i)}</span>
                ))}
              </div>
              <div className="der-handle" style={{ marginTop: 'auto', marginBottom: 6 }} />
              {frozen && <span className="der-seal" style={{ left: 'auto', right: 10, top: 8, transform: 'rotate(-8deg)' }}>封存</span>}
            </div>

            <div className="der-drawer is-open" style={{ flex: 1, justifyContent: 'flex-start', paddingTop: 12 }}>
              <span className="der-drawer-label" style={{ background: '#e7f3e4', color: '#2f4a2a' }}>F(t) 新屉</span>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                {['新类 A', '新类 B', '新类 C'].map(t => (
                  <span key={t} className="der-tag" style={{ background: '#e7f3e4', borderColor: '#a9c9a3', color: '#2f4a2a' }}>{t}</span>
                ))}
              </div>
              <div className="der-handle" style={{ marginTop: 'auto', marginBottom: 6 }} />
            </div>
          </div>
        </div>

        <div className="der-col" style={{ justifyContent: 'center', gap: 14 }}>
          <svg viewBox="0 0 780 360" style={{ width: '100%' }} role="img"
            aria-label="结构：旧提取器冻结、新提取器训练，两段特征拼接后送入分类器">
            <rect x="8" y="96" width="112" height="150" rx="12" fill="#eef3fb" stroke="#9fb6d4" strokeWidth="2" />
            <text x="64" y="164" textAnchor="middle" fontSize="21" fontWeight="700" fill="#27446e">图像 x</text>
            <text x="64" y="192" textAnchor="middle" fontSize="18" fill="#68778f">输入</text>

            <rect x="152" y="38" width="286" height="92" rx="12"
              fill={frozen ? '#eef3fb' : '#fbecef'} stroke={frozen ? '#27446e' : '#c43f52'} strokeWidth="2.5" />
            <text x="295" y="74" textAnchor="middle" fontSize="22" fontWeight="700" fill={frozen ? '#27446e' : '#c43f52'}>Φ(t−1) 旧提取器</text>
            <text x="295" y="104" textAnchor="middle" fontSize="19" fill="#5b6b80">
              {frozen ? '参数与 BN 统计量都冻结' : '仍在更新，旧类特征漂移'}
            </text>

            <rect x="152" y="212" width="286" height="92" rx="12" fill="#eaf5ec" stroke="#228d5c" strokeWidth="2.5" />
            <text x="295" y="248" textAnchor="middle" fontSize="22" fontWeight="700" fill="#228d5c">F(t) 新提取器</text>
            <text x="295" y="278" textAnchor="middle" fontSize="19" fill="#5b6b80">由 F(t−1) 初始化，可训练</text>

            <path d="M120 140 H152" stroke="#27446e" strokeWidth="3" />
            <path d="M120 232 H152" stroke="#228d5c" strokeWidth="3" strokeDasharray="8 6" />

            <rect x="470" y="38" width="92" height="92" rx="8" fill={frozen ? '#cfdcf0' : '#f0c9cf'} stroke={frozen ? '#27446e' : '#c43f52'} strokeWidth="2" />
            <text x="516" y="78" textAnchor="middle" fontSize="19" fontWeight="700" fill="#27446e">旧特征段</text>
            <text x="516" y="104" textAnchor="middle" fontSize="18" fill="#5b6b80">512 维</text>

            <rect x="470" y="212" width="92" height="92" rx="8" fill="#c9e6cf" stroke="#228d5c" strokeWidth="2" />
            <text x="516" y="252" textAnchor="middle" fontSize="19" fontWeight="700" fill="#1b6b47">新特征段</text>
            <text x="516" y="278" textAnchor="middle" fontSize="18" fill="#5b6b80">512 维</text>

            <path d="M562 84 C586 84 588 150 596 158" stroke="#5a7fae" strokeWidth="2.5" fill="none" />
            <path d="M562 258 C586 258 588 192 596 184" stroke="#5a7fae" strokeWidth="2.5" fill="none" />

            <rect x="596" y="96" width="104" height="148" rx="10" fill="#fff6ec" stroke="#f07e47" strokeWidth="2.5" />
            <text x="648" y="158" textAnchor="middle" fontSize="24" fontWeight="800" fill="#b3572b">H(t)</text>
            <text x="648" y="186" textAnchor="middle" fontSize="18" fill="#5b6b80">分类器</text>
            <path d="M700 170 H726" stroke="#f07e47" strokeWidth="3" />
            <text x="736" y="178" fontSize="20" fill="#68778f">ŷ</text>
            <text x="516" y="344" textAnchor="middle" fontSize="19" fill="#68778f">两段特征拼接后一起送入分类器</text>
          </svg>

          <div className="der-panel" style={{ padding: '14px 20px' }}>
            <p className="der-p" style={{ color: frozen ? '#228d5c' : '#c43f52' }}>
              {frozen
                ? '封条贴上：旧屉原样保留，只训练新屉和分类器接口。'
                : '旧屉被重新分装：旧类特征跟着漂移，旧方开始抓错药。'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
