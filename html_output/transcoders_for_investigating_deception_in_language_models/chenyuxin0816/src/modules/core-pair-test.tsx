import { useState } from 'react';
import type { WidgetProps } from './registry';
import '../styles/core-pair-test.css';

type Protocol = 'negative' | 'positive';

const RESULTS = {
  negative: {
    label: '负向削弱',
    direction: 'D → ND',
    topTen: 100,
    pair: 100,
    control: 45.8,
    headline: '两个核心节点保留了全部负向效果',
    detail: 'Top-10 整组与核心双 Feature 都达到 100%，普通双 Feature 平均为 45.8%。',
  },
  positive: {
    label: '正向增强',
    direction: 'ND → D',
    topTen: 21,
    pair: 17.3,
    control: 3.7,
    headline: '两个核心节点保留了大部分正向效果',
    detail: '核心双 Feature 达到 17.3%，接近 Top-10 的 21%，普通双 Feature 平均仅为 3.7%。',
  },
};

function ComparisonBar({ label, count, value, tone }: { label: string; count: string; value: number; tone: 'group' | 'core' | 'control' }) {
  return (
    <div className={'cpt-row is-' + tone}>
      <div className="cpt-row-label"><span>{count}</span><strong>{label}</strong></div>
      <div className="cpt-track"><i style={{ width: `${value}%` }} /></div>
      <b>{value.toFixed(value % 1 === 0 ? 0 : 1)}%</b>
    </div>
  );
}

function EffectMap({ topTen, pair, control, label }: { topTen: number; pair: number; control: number; label: string }) {
  const y = (value: number) => 140 - value * 1.08;
  const pairY = y(pair);
  const controlY = y(control);
  const topTenY = y(topTen);

  return (
    <div className="cpt-effect-map" aria-live="polite">
      <section className="cpt-effect-chart">
        <div className="cpt-effect-heading">
          <span>把干预规模和效果放在同一张图上</span>
          <strong>{label}：两个核心节点是否足以代表十个节点？</strong>
        </div>
        <svg viewBox="0 0 880 178" role="img" aria-label={`干预规模与${label}效果对比`}>
          <line className="cpt-axis" x1="64" y1="140" x2="840" y2="140" />
          <line className="cpt-axis" x1="64" y1="22" x2="64" y2="140" />
          {[0, 50, 100].map((value) => (
            <g className="cpt-grid-line" key={value}>
              <line x1="64" y1={y(value)} x2="840" y2={y(value)} />
              <text x="52" y={y(value) + 5}>{value}%</text>
            </g>
          ))}
          <rect className="cpt-two-feature-band" x="154" y="22" width="190" height="118" rx="8" />
          <line className="cpt-compression-link" x1="250" y1={pairY} x2="748" y2={topTenY} />

          <g className="cpt-effect-point is-control">
            <circle cx="218" cy={controlY} r="10" />
            <text x="205" y={Math.max(18, controlY - 15)}>普通双 {control}%</text>
          </g>
          <g className="cpt-effect-point is-core">
            <circle cx="282" cy={pairY} r="13" />
            <text x="300" y={Math.max(18, pairY - 17)}>核心双 {pair}%</text>
          </g>
          <g className="cpt-effect-point is-group">
            <circle cx="748" cy={topTenY} r="13" />
            <text x="748" y={Math.max(18, topTenY - 17)}>Top-10 {topTen}%</text>
          </g>

          <text className="cpt-x-label" x="250" y="166">2 个 Feature</text>
          <text className="cpt-x-label" x="748" y="166">10 个 Feature</text>
        </svg>
      </section>

      <section className="cpt-effect-reading">
        <span>联合两个核心 Feature 的检验逻辑</span>
        <div>
          <b>1</b>
          <p><strong>接近 Top-10：</strong>保留主要作用。</p>
        </div>
        <div>
          <b>2</b>
          <p><strong>高于普通双 Feature：</strong>并非任选两个。</p>
        </div>
        <em>{pair >= topTen * 0.8 ? '两个条件同时满足' : '核心组合仍明显优于同规模对照'}</em>
      </section>
    </div>
  );
}

export function CorePairTest(_props: WidgetProps) {
  const [protocol, setProtocol] = useState<Protocol>('negative');
  const result = RESULTS[protocol];

  return (
    <div className={'cpt-root is-' + protocol}>
      <div className="cpt-switch" role="group" aria-label="选择联合干预方向">
        <div><span>同一问题，比较三种干预规模</span><strong>两个核心 Feature 能否代表 Top-10 的主要作用？</strong></div>
        <button type="button" className={protocol === 'negative' ? 'is-active' : ''} onClick={() => setProtocol('negative')}>负向 · D → ND</button>
        <button type="button" className={protocol === 'positive' ? 'is-active' : ''} onClick={() => setProtocol('positive')}>正向 · ND → D</button>
      </div>

      <div className="cpt-compression">
        <section className="is-group"><span>第一步已经验证</span><strong>Top-10 整组</strong><b>10 个信号</b></section>
        <i aria-hidden="true">→ 电路定位 →</i>
        <section className="is-core">
          <span>两个 6/10 核心节点</span>
          <strong>Obscuring information</strong>
          <em>+</em>
          <strong>Secrets / confidentiality</strong>
        </section>
        <i aria-hidden="true">VS</i>
        <section className="is-control"><span>同规模对照</span><strong>其余 8 个 Feature 两两组合</strong><b>28 组平均</b></section>
      </div>

      <section className="cpt-results" aria-live="polite">
        <header>
          <div><span>论文实测 · {result.label}</span><strong>回答翻转 {result.direction}</strong></div>
          <b>核心组合 vs 对照：p &lt; 0.001</b>
        </header>
        <ComparisonBar label="Top-10 整组" count="10 个" value={result.topTen} tone="group" />
        <ComparisonBar label="核心双 Feature" count="2 个" value={result.pair} tone="core" />
        <ComparisonBar label="其他双 Feature 平均" count="2 个" value={result.control} tone="control" />
      </section>

      <div className="cpt-conclusion">
        <span>10 → 2</span>
        <div><strong>{result.headline}</strong><p>{result.detail}</p></div>
      </div>

      <EffectMap
        topTen={result.topTen}
        pair={result.pair}
        control={result.control}
        label={result.label}
      />
    </div>
  );
}

export default CorePairTest;
