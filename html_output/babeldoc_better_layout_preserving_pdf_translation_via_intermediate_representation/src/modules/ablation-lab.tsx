import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';
import { MUSEUM_COLORS } from './museum-hero';

type Variant = 'full' | 'noTypeset' | 'noGlossaryContext';
type MetricKey = 'lf' | 'va' | 'tc';

interface AblationRecord {
  label: string;
  note: string;
  lf: number;
  va: number;
  tc: number;
}

const ABLATIONS: Readonly<Record<Variant, AblationRecord>> = {
  full: {
    label: '完整 BabelDOC',
    note: '参照配置',
    lf: 4.5,
    va: 4.5,
    tc: 5,
  },
  noTypeset: {
    label: '移除自适应排版',
    note: 'w/o adaptive typesetting',
    lf: 3,
    va: 2.5,
    tc: 4,
  },
  noGlossaryContext: {
    label: '联合移除术语表 / 上下文控制',
    note: 'w/o glossary/context control',
    lf: 4.5,
    va: 4.5,
    tc: 3,
  },
};

const VARIANT_ORDER: readonly Variant[] = ['full', 'noTypeset', 'noGlossaryContext'];
const METRICS: readonly { key: MetricKey; short: string; label: string }[] = [
  { key: 'lf', short: 'LF', label: '布局保真度' },
  { key: 'va', short: 'VA', label: '视觉美观度' },
  { key: 'tc', short: 'TC', label: '术语一致性' },
];

function delta(value: number, key: MetricKey): number {
  return value - ABLATIONS.full[key];
}

function deltaLabel(change: number): string {
  if (change === 0) return '0.00';
  return `${change < 0 ? '−' : '+'}${Math.abs(change).toFixed(2)}`;
}

function deltaPalette(change: number): { background: string; border: string; color: string } {
  if (change <= -1.5) {
    return {
      background: '#fff1f2',
      border: '#fecdd3',
      color: MUSEUM_COLORS.failure,
    };
  }
  if (change < 0) {
    return {
      background: '#fff7ed',
      border: '#fed7aa',
      color: MUSEUM_COLORS.emphasis,
    };
  }
  return {
    background: '#f6f8fb',
    border: MUSEUM_COLORS.border,
    color: MUSEUM_COLORS.muted,
  };
}

function ScoreCell({ value, metric }: { value: number; metric: MetricKey }) {
  const change = delta(value, metric);
  const palette = deltaPalette(change);
  return (
    <td style={{ padding: 8, minWidth: 152 }}>
      <div
        style={{
          minHeight: 72,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          padding: '9px 10px',
          background: palette.background,
          border: `1px solid ${palette.border}`,
          borderRadius: 10,
        }}
      >
        <strong style={{ color: MUSEUM_COLORS.text, fontSize: 20, lineHeight: 1 }}>
          {value.toFixed(2)}
        </strong>
        <span style={{ color: palette.color, fontSize: 12.5, fontWeight: 750, whiteSpace: 'nowrap' }}>
          相对 Full：{change < 0 ? '↓ ' : ''}{deltaLabel(change)}
        </span>
      </div>
    </td>
  );
}

export const AblationLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const figureCaptionId = `figure-2-caption-${chapterId}-${moduleId}`;

  useEffect(() => {
    const image = rootRef.current
      ?.closest('.module')
      ?.querySelector<HTMLImageElement>('.paper-figure img');
    if (!image) return;
    const previousAlt = image.getAttribute('alt');
    const previousDescription = image.getAttribute('aria-describedby');
    image.alt = 'BabelDOC Figure 2：复杂文档翻译的定性对比，包含公式与表格重建、局部缩放及术语一致性案例。';
    image.setAttribute('aria-describedby', figureCaptionId);
    return () => {
      if (previousAlt === null) image.removeAttribute('alt');
      else image.setAttribute('alt', previousAlt);
      if (previousDescription === null) image.removeAttribute('aria-describedby');
      else image.setAttribute('aria-describedby', previousDescription);
    };
  }, [figureCaptionId]);

  return (
    <div ref={rootRef}>
      <div
        id={figureCaptionId}
        className="feedback"
        style={{ marginBottom: 14, borderLeftColor: MUSEUM_COLORS.support }}
      >
        Figure 2 是定性案例：它展示公式与表格重建、局部 γ=0.85 和术语一致性，不是 Table 4 的聚合统计；γ=0.85 也不是默认值。
      </div>

      <div
        style={{
          border: `1px solid ${MUSEUM_COLORS.border}`,
          borderRadius: 14,
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            padding: '14px 18px',
            background: '#eef3f8',
            borderBottom: `1px solid ${MUSEUM_COLORS.border}`,
          }}
        >
          <strong style={{ color: MUSEUM_COLORS.text, fontSize: 16 }}>Table 4 · 组件消融</strong>
          <span style={{ color: MUSEUM_COLORS.current, fontSize: 14, fontWeight: 750 }}>
            80 个代表页｜1–5 主观评分｜三项均 ↑
          </span>
        </div>

        <div style={{ overflowX: 'auto', padding: '6px 10px 12px' }}>
          <table
            className="paper"
            style={{ width: '100%', minWidth: 720, tableLayout: 'fixed', margin: 0 }}
          >
            <caption style={{ textAlign: 'left', padding: '8px 6px', color: MUSEUM_COLORS.muted }}>
              每个单元格同时给出论文报告的绝对分数，以及相对完整 BabelDOC 的变化量。
            </caption>
            <colgroup>
              <col style={{ width: '34%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '22%' }} />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left', padding: '10px 12px' }}>配置</th>
                {METRICS.map((metric) => (
                  <th scope="col" key={metric.key} style={{ textAlign: 'center', padding: '10px 8px' }}>
                    <strong style={{ color: MUSEUM_COLORS.current }}>{metric.short} ↑</strong>
                    <span style={{ display: 'block', marginTop: 3, color: MUSEUM_COLORS.muted, fontSize: 12 }}>
                      {metric.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VARIANT_ORDER.map((id) => {
                const row = ABLATIONS[id];
                return (
                  <tr key={id} style={id === 'full' ? { background: '#fbfcfe' } : undefined}>
                    <th scope="row" style={{ textAlign: 'left', padding: '12px' }}>
                      <strong style={{ display: 'block', color: MUSEUM_COLORS.text, fontSize: 15 }}>
                        {row.label}
                      </strong>
                      <span style={{ display: 'block', marginTop: 5, color: MUSEUM_COLORS.muted, fontSize: 12 }}>
                        {row.note}
                      </span>
                    </th>
                    {METRICS.map((metric) => (
                      <ScoreCell key={metric.key} value={row[metric.key]} metric={metric.key} />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 10,
          marginTop: 12,
        }}
      >
        <div className="feedback" style={{ marginTop: 0, borderLeftColor: MUSEUM_COLORS.emphasis }}>
          <strong>移除自适应排版：</strong>报告中 VA 下降 2.00、LF 下降 1.50，TC 也下降 1.00；它主要关联布局与观感，不是只影响这两项。
        </div>
        <div className="feedback" style={{ marginTop: 0, borderLeftColor: MUSEUM_COLORS.auxiliary }}>
          <strong>联合移除术语表 / 上下文控制：</strong>报告中只有 TC 下降 2.00；两个控制被一起移除，不能拆分归因。
        </div>
      </div>

      <div className="feedback" style={{ borderLeftColor: MUSEUM_COLORS.support }}>
        证据边界：论文未报告该消融的方差、置信区间或显著性检验，也没有 IR-only 消融。80 页是代表性子集；表中未变化只表示论文报告精度下未变化，不能外推到所有 PDF。
      </div>
    </div>
  );
};

export default AblationLab;
