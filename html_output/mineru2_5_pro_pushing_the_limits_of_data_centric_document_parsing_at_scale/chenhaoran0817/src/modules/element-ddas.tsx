import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type ElementKind = 'text' | 'formula' | 'table';

const C = {
  text: '#21324a', muted: '#68778f', border: '#d7deea', blue: '#27446e',
  green: '#228d5c', orange: '#d97706', purple: '#7c3aed', paper: '#ffffff', quiet: '#f5f8f0',
};

const ELEMENTS: Record<ElementKind, { label: string; color: string; soft: string; answer: string }> = {
  text: { label: '文本', color: C.blue, soft: '#eef3f8', answer: '文本在自己的特征空间中独立聚类，再与难度联合平衡。' },
  formula: { label: '公式', color: C.purple, soft: '#f3effe', answer: '公式结构不再被整页文本相似性掩盖，稀有多行排版会单独可见。' },
  table: { label: '表格', color: C.orange, soft: '#fff7e9', answer: '表格在表格空间中聚类，联合难度后保留复杂结构而不只是高频模板。' },
};

function parseGuided(value?: string): ElementKind | undefined {
  const key = value?.toLowerCase();
  if (!key) return undefined;
  if (key.includes('formula') || key.includes('math')) return 'formula';
  if (key.includes('table')) return 'table';
  if (key.includes('text')) return 'text';
  return undefined;
}

const line = (width: string, key: string) => (
  <span key={key} style={{ display: 'block', width, height: 5, borderRadius: 4, background: '#cbd5e1' }} />
);

export const ElementDdas: React.FC<WidgetProps> = ({ guidedState, onInteract, onStateChange }) => {
  const [kind, setKind] = useState<ElementKind>('text');
  const current = ELEMENTS[kind];

  useEffect(() => {
    const next = parseGuided(guidedState);
    if (next) setKind(next);
  }, [guidedState]);

  const choose = (next: ElementKind) => {
    setKind(next);
    onInteract?.();
    onStateChange?.(next);
  };

  return (
    <section
      className="ddas-element motion-ddas-element"
      data-element={kind}
      aria-label="元素级 DDAS 实验"
      style={{
        display: 'grid',
        gap: 15,
        color: C.text,
        '--element-accent': current.color,
        '--element-soft': current.soft,
      } as React.CSSProperties}
    >
      <div className="ddas-element__controls" role="group" aria-label="选择页内元素" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 9 }}>
        {(Object.keys(ELEMENTS) as ElementKind[]).map((id) => {
          const selected = kind === id;
          const item = ELEMENTS[id];
          return (
            <button
              key={id}
              type="button"
              className={`ddas-element__mode ${selected ? 'is-active' : ''}`}
              aria-pressed={selected}
              onClick={() => choose(id)}
              style={{
                minHeight: 48,
                border: `2px solid ${selected ? item.color : C.border}`,
                borderRadius: 11,
                background: selected ? item.soft : C.paper,
                color: selected ? item.color : C.text,
                padding: '9px 12px',
                cursor: 'pointer',
                font: 'inherit',
                fontWeight: 800,
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="ddas-element__journey">
        <article className="ddas-element__document" style={{ border: `1px solid ${C.border}`, borderRadius: 15, background: C.quiet, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <strong>1. 同一文档页</strong>
            <span style={{ color: current.color, fontSize: 12, fontWeight: 800 }}>正在看：{current.label}</span>
          </div>
          <div
            role="img"
            aria-label={`页内${current.label}元素被高亮`}
            style={{ width: 'min(230px, 100%)', margin: '0 auto', display: 'grid', gap: 9, border: `1px solid ${C.border}`, borderRadius: 8, background: C.paper, padding: 14 }}
          >
            <div className={`ddas-element__region ddas-element__region--text ${kind === 'text' ? 'is-focused' : ''}`} style={{ display: 'grid', gap: 5, border: `2px solid ${kind === 'text' ? current.color : 'transparent'}`, borderRadius: 7, background: kind === 'text' ? current.soft : 'transparent', padding: 8 }}>
              {line('100%', 'a')}{line('86%', 'b')}{line('68%', 'c')}
            </div>
            <div className={`ddas-element__region ddas-element__region--formula ${kind === 'formula' ? 'is-focused' : ''}`} style={{ border: `2px solid ${kind === 'formula' ? current.color : 'transparent'}`, borderRadius: 7, background: kind === 'formula' ? current.soft : 'transparent', padding: '12px 7px', textAlign: 'center', fontFamily: 'Georgia, serif', fontWeight: 700 }}>
              S = Σᵢ xᵢ &nbsp; | &nbsp; y = Ax + b
            </div>
            <div className={`ddas-element__region ddas-element__region--table ${kind === 'table' ? 'is-focused' : ''}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, border: `2px solid ${kind === 'table' ? current.color : 'transparent'}`, borderRadius: 7, background: kind === 'table' ? current.soft : 'transparent', padding: 7 }}>
              {Array.from({ length: 9 }, (_, index) => <span key={index} style={{ height: 15, border: '1px solid #b8c4d2', background: C.paper }} />)}
            </div>
          </div>
        </article>

        <span className="ddas-element__transfer ddas-element__transfer--cluster" aria-hidden="true">
          <i style={{ '--particle-order': 0 } as React.CSSProperties} />
          <i style={{ '--particle-order': 1 } as React.CSSProperties} />
          <i style={{ '--particle-order': 2 } as React.CSSProperties} />
        </span>

        <article className="ddas-element__clusters" style={{ border: `1px solid ${C.border}`, borderRadius: 15, background: C.paper, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
            <strong>2. {current.label}独立聚类</strong>
            <span style={{ color: C.muted, fontSize: 12 }}>K 未披露</span>
          </div>
          <div role="img" aria-label={`${current.label}元素在独立特征空间形成多个簇`} style={{ minHeight: 156, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, placeItems: 'center', border: `1px dashed ${C.border}`, borderRadius: 11, background: C.quiet, padding: 14 }}>
            <div style={{ width: 90, minHeight: 92, display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 7, border: `2px dashed ${current.color}`, borderRadius: '48% 52% 45% 55%', background: current.soft }}>
              {[0, 1, 2, 3].map((n) => <span className="ddas-element__cluster-dot" key={n} style={{ width: 13, height: 13, borderRadius: '50%', background: current.color, '--dot-order': n } as React.CSSProperties} />)}
            </div>
            <div style={{ width: 86, minHeight: 88, display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 7, border: `2px dashed ${current.color}`, borderRadius: '55% 45% 52% 48%', background: current.soft }}>
              {[0, 1, 2].map((n) => <span className="ddas-element__cluster-dot" key={n} style={{ width: 13, height: 13, borderRadius: '50%', background: current.color, '--dot-order': n + 4 } as React.CSSProperties} />)}
            </div>
          </div>
          <div style={{ marginTop: 9, color: C.muted, fontSize: 12, textAlign: 'center' }}>教学示意 · 点与簇的数量不是论文统计</div>
        </article>

        <span className="ddas-element__transfer ddas-element__transfer--balance" aria-hidden="true">
          <i style={{ '--particle-order': 0 } as React.CSSProperties} />
          <i style={{ '--particle-order': 1 } as React.CSSProperties} />
          <i style={{ '--particle-order': 2 } as React.CSSProperties} />
        </span>

        <article className="ddas-element__balance" style={{ border: `1px solid ${current.color}`, borderRadius: 15, background: current.soft, padding: 14 }}>
          <strong>3. 元素簇 × 难度</strong>
          <div role="img" aria-label={`${current.label}簇与难度联合平衡`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginTop: 14 }}>
            {['常见 · 较易', '长尾 · 较易', '常见 · 较难', '长尾 · 较难'].map((label, index) => {
              const target = index === 3;
              return (
                <span className={`ddas-element__quadrant ${target ? 'is-target' : ''}`} key={label} style={{ minHeight: 62, display: 'grid', placeItems: 'center', border: `2px solid ${target ? C.green : C.border}`, borderRadius: 9, background: target ? '#edf8f2' : C.paper, color: target ? C.green : C.muted, padding: 7, textAlign: 'center', fontSize: 13, fontWeight: target ? 850 : 650 }}>
                  {label}{target ? ' ✓' : ''}
                </span>
              );
            })}
          </div>
          <div style={{ marginTop: 12, color: C.green, fontWeight: 800, textAlign: 'center' }}>{current.label}独立分布 → 联合平衡</div>
        </article>
      </div>

      <div className="ddas-element__feedback" role="status" aria-live="polite" style={{ borderLeft: `4px solid ${current.color}`, borderRadius: '0 10px 10px 0', background: current.soft, color: current.color, padding: '11px 13px', fontWeight: 700, lineHeight: 1.55 }}>
        {current.answer}
      </div>
    </section>
  );
};

export default ElementDdas;
