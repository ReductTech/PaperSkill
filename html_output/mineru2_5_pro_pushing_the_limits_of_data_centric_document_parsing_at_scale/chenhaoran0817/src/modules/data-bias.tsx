import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type Choice = 'ordinary' | 'tail';

const COLORS = {
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  green: '#228d5c',
  orange: '#d97706',
  red: '#c43f52',
  paper: '#ffffff',
  quiet: '#f5f8f0',
};

const PAGE_KINDS = [
  { id: 'regular-1', label: '普通文本', kind: 'ordinary' },
  { id: 'regular-2', label: '普通文本', kind: 'ordinary' },
  { id: 'regular-3', label: '普通文本', kind: 'ordinary' },
  { id: 'formula', label: '多行公式', kind: 'tail' },
  { id: 'table', label: '复杂表格', kind: 'tail' },
  { id: 'layout', label: '稀有版式', kind: 'tail' },
] as const;

function guidedChoice(value?: string): Choice | undefined {
  const key = value?.toLowerCase();
  if (!key) return undefined;
  if (key.includes('tail') || key.includes('long') || key.includes('rare')) return 'tail';
  if (key.includes('ordinary') || key.includes('normal') || key.includes('frequent')) return 'ordinary';
  return undefined;
}

export const DataBias: React.FC<WidgetProps> = ({ guidedState, onInteract, onStateChange }) => {
  const [choice, setChoice] = useState<Choice>('ordinary');

  useEffect(() => {
    const next = guidedChoice(guidedState);
    if (next) setChoice(next);
  }, [guidedState]);

  const choose = (next: Choice) => {
    setChoice(next);
    onInteract?.();
    onStateChange?.(next);
  };

  const tailSelected = choice === 'tail';
  const feedback = tailSelected
    ? '结论：补充长尾页是在扩展覆盖边界，让公式、表格和稀有版式真正进入后续筛选。'
    : '结论：再加普通页会增加数量，却可能只是重复模型已经见过的高频模式。';

  return (
    <section
      className={`lab-data-bias is-${choice}`}
      data-choice={choice}
      aria-label="数据覆盖偏差对比实验"
      style={{ display: 'grid', gap: 16, color: COLORS.text }}
    >
      <div
        className="lab-data-bias__controls"
        role="group"
        aria-label="选择数据补充方式"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}
      >
        {([
          ['ordinary', '再加普通页', '增加高频重复'],
          ['tail', '补长尾页', '扩展稀有覆盖'],
        ] as const).map(([id, title, note]) => {
          const selected = choice === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => choose(id)}
              style={{
                minHeight: 52,
                border: `2px solid ${selected ? (id === 'tail' ? COLORS.green : COLORS.orange) : COLORS.border}`,
                borderRadius: 12,
                background: selected ? (id === 'tail' ? '#edf8f2' : '#fff7e9') : COLORS.paper,
                color: COLORS.text,
                padding: '9px 13px',
                cursor: 'pointer',
                textAlign: 'left',
                font: 'inherit',
              }}
            >
              <strong style={{ display: 'block', fontSize: 15 }}>{title}</strong>
              <span style={{ display: 'block', marginTop: 3, color: COLORS.muted, fontSize: 13 }}>{note}</span>
            </button>
          );
        })}
      </div>

      <div
        className="lab-data-bias__field"
        role="img"
        aria-label={tailSelected ? '补充长尾页后，稀有文档类型被覆盖' : '继续增加普通页后，长尾类型仍未被覆盖'}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
          padding: 16,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          background: COLORS.quiet,
        }}
      >
        <div className="lab-data-bias__covered" style={{ display: 'grid', alignContent: 'start', gap: 10 }}>
          <strong>已经密集的区域</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PAGE_KINDS.filter((item) => item.kind === 'ordinary').map((item, index) => (
              <span
                key={item.id}
                className="bias-page bias-page--ordinary"
                style={{
                  '--bias-delay': `${index * 85}ms`,
                  minWidth: 92,
                  padding: '12px 10px',
                  border: `2px solid ${choice === 'ordinary' ? COLORS.orange : COLORS.border}`,
                  borderRadius: 9,
                  background: COLORS.paper,
                  textAlign: 'center',
                  fontWeight: 750,
                  transform: choice === 'ordinary' ? `translateY(${index * 2}px)` : undefined,
                } as React.CSSProperties}
              >
                {item.label}
              </span>
            ))}
            {choice === 'ordinary' ? (
              <span className="bias-page bias-page--extra" style={{ padding: '12px 10px', border: `2px solid ${COLORS.orange}`, borderRadius: 9, background: '#fff7e9', fontWeight: 800 }}>
                + 同类页
              </span>
            ) : null}
          </div>
          <span style={{ color: COLORS.muted, fontSize: 13 }}>再加同类样本，覆盖边界不会自动外移。</span>
        </div>

        <div className="lab-data-bias__tail" style={{ display: 'grid', alignContent: 'start', gap: 10 }}>
          <strong>仍然稀疏的长尾</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
            {PAGE_KINDS.filter((item) => item.kind === 'tail').map((item, index) => (
              <span
                key={item.id}
                className={`bias-tail-card bias-tail-card--${item.id}`}
                style={{
                  '--bias-delay': `${index * 85}ms`,
                  minHeight: 62,
                  display: 'grid',
                  placeItems: 'center',
                  padding: 8,
                  border: `2px ${tailSelected ? 'solid' : 'dashed'} ${tailSelected ? COLORS.green : COLORS.border}`,
                  borderRadius: 9,
                  background: tailSelected ? '#edf8f2' : COLORS.paper,
                  color: tailSelected ? COLORS.green : COLORS.muted,
                  textAlign: 'center',
                  fontWeight: 800,
                } as React.CSSProperties}
              >
                <i aria-hidden="true">{tailSelected ? '✓' : '·'}</i>
                <b>{item.label}</b>
              </span>
            ))}
          </div>
          <span style={{ color: tailSelected ? COLORS.green : COLORS.red, fontSize: 13, fontWeight: 750 }}>
            {tailSelected ? '长尾页进入 TRAIN CANDIDATE' : '缺口仍在：更多不等于更全'}
          </span>
        </div>
      </div>

      <div style={{ color: COLORS.muted, fontSize: 12 }}>
        教学示意：方块数量、大小和密度不代表论文统计；论文也未披露“共同失败”的数量或比例。
      </div>

      <div
        className="lab-data-bias__feedback"
        role="status"
        aria-live="polite"
        style={{
          borderLeft: `4px solid ${tailSelected ? COLORS.green : COLORS.orange}`,
          borderRadius: '0 10px 10px 0',
          background: tailSelected ? '#edf8f2' : '#fff7e9',
          color: tailSelected ? COLORS.green : '#92400e',
          padding: '11px 13px',
          fontWeight: 700,
          lineHeight: 1.55,
        }}
      >
        {feedback}
      </div>
    </section>
  );
};

export default DataBias;
