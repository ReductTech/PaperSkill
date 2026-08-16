import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type MetricKey = 'strict' | 'aesthetic' | 'memory';

type BenchmarkRow = {
  model: string;
  size: string;
  strict: number;
  partial: number;
  trajectory: number;
  aesthetic: number;
  imaging: number;
  mechanics: number;
  memory: number;
};

const rows: BenchmarkRow[] = [
  { model: 'Genie 3', size: '—', strict: 0.4700, partial: 0.6608, trajectory: 0.6719, aesthetic: 0.4711, imaging: 0.4757, mechanics: 0.5454, memory: 0.6073 },
  { model: 'HappyOyster', size: '—', strict: 0.5317, partial: 0.7631, trajectory: 0.7737, aesthetic: 0.5235, imaging: 0.4377, mechanics: 0.5395, memory: 0.6309 },
  { model: 'LingBot-World', size: '14B', strict: 0.3235, partial: 0.4198, trajectory: 0.4094, aesthetic: 0.2898, imaging: 0.2875, mechanics: 0.2777, memory: 0.3006 },
  { model: 'HY-World 1.5', size: '8.3B', strict: 0.1640, partial: 0.2088, trajectory: 0.2015, aesthetic: 0.1400, imaging: 0.1236, mechanics: 0.1115, memory: 0.1562 },
  { model: 'ABot-World-0', size: '5B', strict: 0.5266, partial: 0.7290, trajectory: 0.6752, aesthetic: 0.5039, imaging: 0.4651, mechanics: 0.5223, memory: 0.5041 },
];

const metrics: Array<{ id: MetricKey; label: string; dimension: string }> = [
  { id: 'strict', label: 'Strict Acc.', dimension: '动作严格准确率' },
  { id: 'aesthetic', label: 'Aesthetic', dimension: '视觉美学质量' },
  { id: 'memory', label: 'Memory', dimension: '时间记忆保持' },
];

const evidenceItems = [
  'ABot-World-0 在控制、画质、记忆等方面表现有竞争力。',
  'LongForcing 让长时间 rollout 的后段更稳。',
  '在论文指定 RTX 5090 配置下，可以实现单卡流式运行。',
];

const boundaryItems = [
  '不是所有 benchmark 指标第一。',
  'LongForcing 缓解长时错位，但不等于永远不漂。',
  '单卡实时结果依赖论文给定硬件与优化配置。',
];

const finalLines = [
  { id: 'data', label: '数据基础', text: 'Game + Simulation + Internet Video' },
  { id: 'conditions', label: '可控条件', text: 'Action + Identity Memory' },
  { id: 'training', label: '长时训练', text: 'Teacher → Student → LongForcing' },
  { id: 'deployment', label: '部署优化', text: 'Streaming Optimization' },
];

function fullTableCell(value: number, key: MetricKey, model: string) {
  const values = rows.map((row) => row[key]);
  const sorted = [...values].sort((a, b) => b - a);
  const isBest = value === sorted[0];
  const isSecond = value === sorted[1];
  const content = value.toFixed(4);
  if (isBest) return <strong className="chap10-table-best">{content}</strong>;
  if (isSecond) return <u>{content}</u>;
  return model === 'ABot-World-0' ? <b>{content}</b> : content;
}

export const BenchmarkRace: React.FC<WidgetProps> = () => {
  const [metric, setMetric] = useState<MetricKey>('strict');
  const activeMetric = metrics.find((item) => item.id === metric)!;

  const comparison = useMemo(() => {
    const ranked = rows.map((row) => ({ ...row, value: row[metric] })).sort((a, b) => b.value - a.value);
    return { best: ranked[0], max: ranked[0].value };
  }, [metric]);

  return (
    <div className="chapter-ten-results">
      <div className="chap10-metric-switch" role="tablist" aria-label="WorldRoamBench 代表指标">
        {metrics.map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={metric === item.id}
            className={metric === item.id ? 'active' : ''}
            onClick={() => setMetric(item.id)}
            key={item.id}
          >
            <strong>{item.label}</strong>
            <span>{item.dimension}</span>
          </button>
        ))}
      </div>

      <section className="chap10-benchmark-panel" aria-live="polite">
        <header>
          <strong>WorldRoamBench · {activeMetric.label} ↑ 越高越好</strong>
        </header>
        <div className="chap10-race">
          {rows.map((row) => {
            const value = row[metric];
            const isBest = row.model === comparison.best.model;
            const isAbot = row.model === 'ABot-World-0';
            return (
              <div className={`chap10-race-row${isBest ? ' is-best' : ''}${isAbot ? ' is-abot' : ''}`} key={row.model}>
                <div className="chap10-model-name">
                  <strong>{row.model}</strong>
                  {isBest ? <span>当前 best</span> : null}
                  {isAbot ? <span>论文模型</span> : null}
                </div>
                <div className="chap10-track" aria-label={`${row.model} ${activeMetric.label} ${value.toFixed(4)}`}>
                  <i style={{ width: `${(value / comparison.max) * 100}%` }} />
                </div>
                <b>{value.toFixed(4)}</b>
              </div>
            );
          })}
        </div>
        <div className="chap10-result-one-line">
          <strong>ABot-World-0 在多项指标上有竞争力，但不是所有指标都第一。</strong>
          <span>当前示例指标用于快速理解，完整结果以 Table 3 为准。</span>
        </div>
      </section>

      <details className="deep-reading chap10-table-details">
        <summary>深入阅读：Table 3 完整指标</summary>
        <div className="table-scroll">
          <table className="paper">
            <thead>
              <tr>
                <th>模型</th><th>Size</th><th>Strict Acc.</th><th>Partial Acc.</th><th>Traj. Score</th><th>Aesthetic</th><th>Imaging</th><th>Mechanics</th><th>Memory</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.model} className={row.model === 'ABot-World-0' ? 'chap10-table-abot' : ''}>
                  <td>{row.model}</td><td>{row.size}</td>
                  <td>{fullTableCell(row.strict, 'strict', row.model)}</td>
                  <td>{row.partial.toFixed(4)}</td><td>{row.trajectory.toFixed(4)}</td>
                  <td>{fullTableCell(row.aesthetic, 'aesthetic', row.model)}</td>
                  <td>{row.imaging.toFixed(4)}</td><td>{row.mechanics.toFixed(4)}</td>
                  <td>{fullTableCell(row.memory, 'memory', row.model)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="chap10-table-note">Table 3 报告 WorldRoamBench 所列子维度；最佳值加粗、第二名加下划线，所有列均为越高越好。</p>
      </details>

      <section className="chap10-evidence-compact" aria-label="这些证据支持什么和不支持什么">
        <h3>10.2 这些证据支持什么 / 不支持什么</h3>
        <div>
          <section className="supports">
            <strong>这些证据说明了什么</strong>
            <ul>{evidenceItems.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="limits">
            <strong>这些证据没有保证什么</strong>
            <ul>{boundaryItems.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        </div>
      </section>

      <section className="chap10-four-lines" aria-label="最后用四句话收尾">
        <h3>10.3 最后用四句话收尾</h3>
        <div>
          {finalLines.map((item) => (
            <p className={item.id} key={item.id}>
              <strong>{item.label}</strong>
              <span>{item.text}</span>
            </p>
          ))}
        </div>
      </section>
    </div>
  );
};
