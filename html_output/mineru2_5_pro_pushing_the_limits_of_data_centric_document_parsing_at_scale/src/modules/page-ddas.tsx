import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type Mode = 'random' | 'cluster' | 'ddas';

const C = {
  text: '#21324a', muted: '#68778f', border: '#d7deea', blue: '#27446e',
  green: '#228d5c', orange: '#d97706', purple: '#7c3aed', paper: '#ffffff', quiet: '#f5f8f0',
};

const MODES: Record<Mode, { label: string; answer: string; activeStep: number }> = {
  random: { label: '随机 / 原始频率', answer: '高频页更容易反复入选，长尾覆盖仍然稀疏。', activeStep: 0 },
  cluster: { label: '仅聚类', answer: '聚类让多种版式可见，但同簇内还没有区分难度。', activeStep: 2 },
  ddas: { label: 'DDAS', answer: 'DDAS 同时考虑多样性与难度，形成约 60M 页级候选。', activeStep: 3 },
};

const PAGES = [
  { id: 'regular-a', label: '规则文本', family: 'regular', hard: false },
  { id: 'regular-b', label: '规则文本', family: 'regular', hard: false },
  { id: 'regular-c', label: '双栏文本', family: 'regular', hard: false },
  { id: 'formula-a', label: '多行公式', family: 'formula', hard: true },
  { id: 'formula-b', label: '公式混排', family: 'formula', hard: true },
  { id: 'table', label: '复杂表格', family: 'table', hard: true },
  { id: 'layout', label: '稀有版式', family: 'layout', hard: true },
  { id: 'scan', label: '噪声扫描', family: 'scan', hard: true },
] as const;

function parseGuided(value?: string): Mode | undefined {
  const key = value?.toLowerCase();
  if (!key) return undefined;
  if (key.includes('ddas') || key.includes('difficulty')) return 'ddas';
  if (key.includes('cluster') || key.includes('kmeans')) return 'cluster';
  if (key.includes('random') || key.includes('raw') || key.includes('frequency')) return 'random';
  return undefined;
}

function selected(page: typeof PAGES[number], mode: Mode) {
  if (mode === 'random') return page.family === 'regular';
  if (mode === 'cluster') return ['regular-a', 'formula-a', 'table', 'layout', 'scan'].includes(page.id);
  return page.hard;
}

function PageThumbnail({ pageId }: { pageId: typeof PAGES[number]['id'] }) {
  if (pageId === 'formula-a' || pageId === 'formula-b') {
    return (
      <span className="ddas-page__thumbnail ddas-page__thumbnail--formula" aria-hidden="true">
        <i />
        <b>Σ xᵢ</b>
        <b>y = Ax</b>
        <i />
      </span>
    );
  }

  if (pageId === 'table') {
    return (
      <span className="ddas-page__thumbnail ddas-page__thumbnail--table" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => <i key={index} />)}
      </span>
    );
  }

  if (pageId === 'layout') {
    return (
      <span className="ddas-page__thumbnail ddas-page__thumbnail--layout" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
    );
  }

  if (pageId === 'scan') {
    return (
      <span className="ddas-page__thumbnail ddas-page__thumbnail--scan" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </span>
    );
  }

  return (
    <span
      className={`ddas-page__thumbnail ${pageId === 'regular-c' ? 'ddas-page__thumbnail--columns' : 'ddas-page__thumbnail--text'}`}
      aria-hidden="true"
    >
      <i /><i /><i /><i /><i /><i />
    </span>
  );
}

export const PageDdas: React.FC<WidgetProps> = ({ guidedState, onInteract, onStateChange }) => {
  const [view, setView] = useState<Mode>('random');
  const current = MODES[view];

  useEffect(() => {
    const next = parseGuided(guidedState);
    if (next) setView(next);
  }, [guidedState]);

  const choose = (next: Mode) => {
    setView(next);
    onInteract?.();
    onStateChange?.(next);
  };

  const steps = ['文档页', '512 维 ViT-base', 'K-Means', '难度重加权'];

  return (
    <section
      className="ddas-page motion-ddas-page"
      data-state={view}
      aria-label="页级 DDAS 采样实验"
      style={{ display: 'grid', gap: 15, color: C.text }}
    >
      <div className="ddas-page__controls" role="group" aria-label="切换页级采样策略" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 9 }}>
        {(Object.keys(MODES) as Mode[]).map((mode) => {
          const active = view === mode;
          return (
            <button
              key={mode}
              type="button"
              className={`ddas-page__mode ${active ? 'is-active' : ''}`}
              aria-pressed={active}
              onClick={() => choose(mode)}
              style={{
                minHeight: 48,
                border: `2px solid ${active ? (mode === 'ddas' ? C.green : C.blue) : C.border}`,
                borderRadius: 11,
                background: active ? (mode === 'ddas' ? '#edf8f2' : '#eef3f8') : C.paper,
                color: active ? (mode === 'ddas' ? C.green : C.blue) : C.text,
                padding: '9px 10px',
                cursor: 'pointer',
                font: 'inherit',
                fontWeight: 800,
              }}
            >
              {MODES[mode].label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <div
          className="ddas-page__field"
          role="img"
          aria-label={`${current.label}：${current.answer}`}
          style={{ border: `1px solid ${C.border}`, borderRadius: 15, background: C.quiet, padding: 14 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <strong>候选覆盖</strong>
            <span style={{ color: C.muted, fontSize: 12 }}>教学示意 · 数量与位置不是论文统计</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(108px, 1fr))', gap: 8 }}>
            {PAGES.map((page) => {
              const isSelected = selected(page, view);
              const accent = view === 'ddas' && isSelected ? C.green : isSelected ? C.blue : C.border;
              return (
                <div
                  key={page.id}
                  className={`ddas-page__card ${isSelected ? 'is-selected' : 'is-muted'} ${page.hard ? 'is-hard' : 'is-frequent'}`}
                  data-family={page.family}
                  style={{ '--page-accent': accent } as React.CSSProperties}
                >
                  <PageThumbnail pageId={page.id} />
                  <span className="ddas-page__card-label">{page.label}</span>
                  <small>
                    {isSelected ? (view === 'ddas' && page.hard ? '长尾 / 较难 ✓' : '入选') : '未突出'}
                  </small>
                </div>
              );
            })}
          </div>
        </div>

        <aside className={`ddas-page__output ddas-page__output--${view}`} style={{ display: 'grid', alignContent: 'center', gap: 9, border: `1px solid ${view === 'ddas' ? C.green : C.border}`, borderRadius: 15, background: C.paper, padding: 16 }}>
          <span style={{ color: C.muted, fontSize: 12, fontWeight: 800 }}>当前输出</span>
          <strong style={{ color: view === 'ddas' ? C.green : C.blue, fontSize: 22 }}>
            {view === 'random' ? '频率偏置' : view === 'cluster' ? '版式多样性' : '约 60M 页级候选'}
          </strong>
          <span style={{ color: C.muted, fontSize: 13, lineHeight: 1.55 }}>{current.answer}</span>
          {view === 'ddas' ? <b style={{ color: C.orange, fontSize: 12 }}>不等于 65.5M 跨任务训练样本</b> : null}
        </aside>
      </div>

      <ol className="ddas-page__pipeline" aria-label="DDAS 页级路径" style={{ listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))', gap: 7, margin: 0, padding: 0 }}>
        {steps.map((step, index) => {
          const active = index <= current.activeStep;
          return (
            <li
              key={step}
              className={active ? 'is-active' : 'is-pending'}
              style={{
                minHeight: 48,
                display: 'grid',
                placeItems: 'center',
                borderBottom: `3px solid ${active ? (view === 'ddas' ? C.green : C.blue) : C.border}`,
                color: active ? C.text : C.muted,
                padding: '7px 4px',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: active ? 800 : 600,
                '--motion-order': index,
              } as React.CSSProperties}
            >
              {index + 1}. {step}
            </li>
          );
        })}
      </ol>

      <div style={{ color: C.muted, fontSize: 12 }}>
        事实边界：论文披露 512 维 ViT-base 页表征和 K-Means，但未披露 K、难度阈值或采样权重。
      </div>
      <div className="ddas-page__feedback" role="status" aria-live="polite" style={{ borderLeft: `4px solid ${view === 'ddas' ? C.green : C.blue}`, borderRadius: '0 10px 10px 0', background: view === 'ddas' ? '#edf8f2' : '#eef3f8', color: view === 'ddas' ? C.green : C.blue, padding: '11px 13px', fontWeight: 700, lineHeight: 1.55 }}>
        {current.answer}
      </div>
    </section>
  );
};

export default PageDdas;
