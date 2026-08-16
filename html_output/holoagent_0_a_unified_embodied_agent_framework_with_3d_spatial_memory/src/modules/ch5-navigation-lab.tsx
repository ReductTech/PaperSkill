import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type QuantTab = 'navigation' | 'memory';

type NavMetric = {
  metric: string;
  hint: string;
  baseline: number;
  current: number;
  max: number;
  unit: string;
};

type MemoryMetric = {
  dataset: string;
  miou: number;
  note: string;
};

const navMetrics: NavMetric[] = [
  {
    metric: 'SR',
    hint: '找到目标了吗？',
    baseline: 80.8,
    current: 82.6,
    max: 90,
    unit: '%',
  },
  {
    metric: 'SPL',
    hint: '找到目标的同时，有没有少走冤枉路？',
    baseline: 41.0,
    current: 42.8,
    max: 48,
    unit: '',
  },
];

const memoryMetrics: MemoryMetric[] = [
  {
    dataset: 'ScanNet',
    miou: 31.58,
    note: 'zero-shot semantic mapping',
  },
  {
    dataset: 'Replica',
    miou: 29.93,
    note: 'online mapping setting',
  },
];

function formatValue(value: number, unit: string) {
  return `${value.toFixed(value % 1 === 0 ? 1 : 2)}${unit}`;
}

function MetricBar({ item, enabled }: { item: NavMetric; enabled: boolean }) {
  const baselineWidth = `${Math.min(100, (item.baseline / item.max) * 100)}%`;
  const currentWidth = `${Math.min(100, (item.current / item.max) * 100)}%`;
  const gain = item.current - item.baseline;

  return (
    <div className="exp-metric-row">
      <div className="exp-metric-label">
        <b>{item.metric}</b>
        <span>{item.hint}</span>
      </div>
      <div className="exp-bars" aria-label={`${item.metric}: FSR-VLN slow ${item.baseline}, HoloAgent-Nav ${item.current}`}>
        <div className="exp-bar-line baseline" style={{ width: baselineWidth }}>
          <span>FSR-VLN slow</span>
          <strong>{formatValue(item.baseline, item.unit)}</strong>
        </div>
        <div className={`exp-bar-line current ${enabled ? 'show' : ''}`} style={{ width: currentWidth }}>
          <span>HoloAgent-Nav</span>
          <strong>{formatValue(item.current, item.unit)}</strong>
        </div>
      </div>
      <div className={enabled ? 'exp-gain show' : 'exp-gain'}>
        +{gain.toFixed(1)}
      </div>
    </div>
  );
}

export const Ch5NavigationLab: React.FC<WidgetProps> = () => {
  const [quantTab, setQuantTab] = useState<QuantTab>('navigation');
  const [loopOn, setLoopOn] = useState(false);

  return (
    <div className="experiments-lab">
      <div className="exp-hero">
        <div>
          <small>EXPERIMENTS</small>
          <b>Does It Actually Work?</b>
          <span>这页只保留关键数字：Navigation 是否更稳，3D Memory 是否可在线使用。</span>
        </div>
        <div className="exp-mini-tabs" role="tablist" aria-label="选择定量证据">
          <button
            type="button"
            className={quantTab === 'navigation' ? 'selected' : ''}
            aria-selected={quantTab === 'navigation'}
            onClick={() => setQuantTab('navigation')}
          >
            Navigation
          </button>
          <button
            type="button"
            className={quantTab === 'memory' ? 'selected' : ''}
            aria-selected={quantTab === 'memory'}
            onClick={() => setQuantTab('memory')}
          >
            3D Memory
          </button>
        </div>
      </div>

      {quantTab === 'navigation' ? (
        <div className="exp-quant-grid">
          <section className="exp-evidence-panel wide">
            <div className="exp-panel-title">
              <b>Does the AgentOS loop help navigation?</b>
              <span>HM3D-ObjNav · same protocol</span>
            </div>
            <div className="exp-loop-switch">
              <button type="button" onClick={() => setLoopOn((value) => !value)}>
                {loopOn ? 'Hide AgentOS Loop' : 'Add AgentOS Loop'}
              </button>
              <span className={loopOn ? 'on' : ''}>Memory Retrieval · Verification · Runtime Feedback</span>
            </div>
            <div className="exp-metric-stack">
              {navMetrics.map((item) => (
                <MetricBar key={item.metric} item={item} enabled={loopOn} />
              ))}
            </div>
            <p>原本的导航系统已经很强；加入完整 AgentOS 闭环后，成功率和路径效率仍有进一步提升。</p>
          </section>

          <section className="exp-evidence-panel">
            <div className="exp-panel-title">
              <b>Real Robot Navigation</b>
              <span>strict 1 m threshold</span>
            </div>
            <div className="exp-big-numbers">
              <div>
                <strong>97.70%</strong>
                <b>Top-1 @ 1m</b>
                <span>第一候选就选对，并真正走到目标 1m 内。</span>
              </div>
              <div>
                <strong>98.90%</strong>
                <b>Top-5 @ 1m</b>
                <span>前五个候选包含正确目标，并完成实际到达。</span>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="exp-memory-grid">
          <section className="exp-evidence-panel wide">
            <div className="exp-panel-title">
              <b>Is the 3D Memory itself reliable?</b>
              <span>semantic mapping · mIoU</span>
            </div>
            <div className="exp-memory-scores">
              {memoryMetrics.map((item) => (
                <div key={item.dataset} className="exp-memory-score">
                  <small>{item.dataset}</small>
                  <strong>{item.miou.toFixed(2)}</strong>
                  <span>{item.note}</span>
                </div>
              ))}
            </div>
            <div className="exp-online-note">
              <b>Competitive Accuracy + Online Deployment</b>
              <span>它不是等整栋房子扫描完再离线处理，而是随着机器人运动持续构建和更新。</span>
            </div>
          </section>

          <section className="exp-evidence-panel">
            <div className="exp-miou-card">
              <b>mIoU</b>
              <span>机器人建立的 3D 语义区域，与真实标注重合得有多好。</span>
            </div>
            <div className="exp-boundary-card">
              <b>不要读成 SOTA on everything</b>
              <span>论文更准确的结论是：在线语义建图结果有竞争力，但并非所有指标都第一。</span>
            </div>
          </section>
        </div>
      )}

      <div className="exp-evidence-strip">
        <span><b>Navigation</b> 82.6 SR / 42.8 SPL</span>
        <span><b>Memory</b> competitive online mapping</span>
        <span><b>Real World</b> 97.70 Top-1@1m</span>
      </div>

      <div className="exp-limitation">
        <b>Demo 只口头带过</b>
        <span>官方 real-robot demos 可以作为定性补充，但这份 4 分钟汇报不再展示截图；复杂端到端任务仍缺少统一的大规模量化评测。</span>
      </div>
    </div>
  );
};

export default Ch5NavigationLab;
