import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type RouteKey = 'reg' | 'distill' | 'struct';

const ROUTES: Record<RouteKey, {
  name: string; sub: string; example: string;
  plasticity: number; fidelity: number; dataNeed: number;
  verdict: string;
}> = {
  reg: {
    name: '改旧屉',
    sub: '正则化：罚住重要权重',
    example: 'EWC 等',
    plasticity: 0.22,
    fidelity: 0.55,
    dataNeed: 0.2,
    verdict: '旧屉不敢动，新药也塞不进去：可塑性被牺牲。',
  },
  distill: {
    name: '钉住旧方',
    sub: '蒸馏：用旧数据约束输出',
    example: 'iCaRL / UCIR / PODNet',
    plasticity: 0.5,
    fidelity: 0.6,
    dataNeed: 0.86,
    verdict: '输出被钉住，但钉子牢不牢取决于留下多少旧数据。',
  },
  struct: {
    name: '加新屉',
    sub: '结构化：加参数，改写旧特征',
    example: 'RPSNet / CCGN · 同族：本文',
    plasticity: 0.76,
    fidelity: 0.34,
    dataNeed: 0.3,
    verdict: '同族里 RPSNet 相加特征、CCGN 只冻部分层，旧表示都会退化；本文整体冻结。',
  },
};

const BARS: { key: 'plasticity' | 'fidelity' | 'dataNeed'; label: string; good: string; bad: string }[] = [
  { key: 'plasticity', label: '学新类的可塑性', good: '充足', bad: '被压住' },
  { key: 'fidelity', label: '旧类特征的保真度', good: '保持完好', bad: '被改写' },
  { key: 'dataNeed', label: '对旧数据的依赖', good: '低', bad: '高' },
];

function level(v: number) {
  return v > 0.66 ? '高' : v > 0.4 ? '中' : '低';
}

export function S2ThreeRoutes(_props: WidgetProps) {
  const [route, setRoute] = useState<RouteKey>('reg');
  const active = ROUTES[route];

  return (
    <div className="der-page">
      <div className="der-col" style={{ height: '100%', padding: '22px 30px 20px', boxSizing: 'border-box', gap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {(Object.keys(ROUTES) as RouteKey[]).map(key => {
            const r = ROUTES[key];
            const on = key === route;
            return (
              <button key={key} onClick={() => setRoute(key)} aria-pressed={on}
                style={{
                  textAlign: 'left', font: 'inherit', cursor: 'pointer', padding: '16px 18px',
                  borderRadius: 18, background: on ? '#fff' : '#fdfaf3',
                  border: `2px solid ${on ? '#27446e' : '#e3d8c6'}`,
                  boxShadow: on ? '0 10px 24px rgba(39,68,110,.16)' : 'none',
                  transform: on ? 'translateY(-3px)' : 'none', transition: 'all .2s ease',
                }}>
                <div className="der-h" style={{ color: on ? '#27446e' : '#3b2c1f' }}>{r.name}</div>
                <div className="der-p" style={{ marginTop: 6, color: '#5b4a36' }}>{r.sub}</div>
                <div className="der-note-sm" style={{ marginTop: 8 }}>{r.example}</div>
              </button>
            );
          })}
        </div>

        <div className="der-panel" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 26 }}>
          <div className="der-col" style={{ justifyContent: 'center', gap: 18 }}>
            <p className="der-note-sm" style={{ marginBottom: -4 }}>
              {route === 'struct' ? '下列为 RPSNet / CCGN 的代价' : '下列为该路线付出的代价'}
            </p>
            {BARS.map(bar => {
              const v = active[bar.key];
              const isBadHigh = bar.key !== 'plasticity' ? v > 0.6 : v < 0.4;
              return (
                <div key={bar.key} className="der-col" style={{ gap: 6 }}>
                  <div className="der-row der-spread">
                    <span className="der-p">{bar.label}</span>
                    <span className={`der-p ${isBadHigh ? 'der-bad' : 'der-good'}`}>{level(v)}</span>
                  </div>
                  <div className={`der-meter ${isBadHigh ? 'is-bad' : 'is-good'}`}>
                    <span style={{ width: `${v * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="der-col" style={{ justifyContent: 'center', gap: 18, borderLeft: '1px solid #ece2d1', paddingLeft: 26 }}>
            <p className="der-num" style={{ fontSize: 34, lineHeight: 1.32, color: '#3b2c1f' }}>{active.verdict}</p>
            <p className="der-p der-soft">
              三种改法分别在「不敢动」「靠旧数据钉住」「边加边改」上付代价；共同点是旧表示仍在被改动。
              （定性归纳，非论文实测）
            </p>
            <div className="der-eq-block" style={{ borderLeftColor: '#228d5c' }}>
              本文也在「加新屉」这一族：旧屉<span className="der-good">整体冻结</span>、新屉单独成段拼接后再判断。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
