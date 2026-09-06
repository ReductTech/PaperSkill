import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type ContractKey = 'M0' | 'O' | 'Edev' | 'Etest';

const CONTRACT: Record<
  ContractKey,
  { symbol: string; name: string; definition: string; allowed: string; risk: string; color: string }
> = {
  M0: {
    symbol: 'M₀',
    name: '初始制品',
    definition: '所有候选共同出发的代码、提示词、数据管线或其他可执行制品。',
    allowed: '作为整次 AO 任务的初始基线；运行过程中，新执行器从当前最佳制品 Mbest 创建隔离工作树。',
    risk: '若起点不一致，方法间的提升无法公平归因。',
    color: '#27446e',
  },
  O: {
    symbol: 'O',
    name: '目标与方向',
    definition: '规定优化指标，以及数值应当增大还是减小。',
    allowed: '在搜索开始前固定，并把原生指标统一解释为是否改善。',
    risk: '搜索中途更换目标，会把指标漂移误认为进步。',
    color: '#27446e',
  },
  Edev: {
    symbol: 'Edev',
    name: '开发评估器',
    definition: '为探索提供频繁、可观察反馈的评估接口。',
    allowed: '可反复调用，用于提出、筛选和细化假设。',
    risk: '长期搜索会逐渐适配开发反馈，因此它不能独自决定合并。',
    color: '#d97706',
  },
  Etest: {
    symbol: 'Etest',
    name: '留出评估器',
    definition: '独立检查候选是否从开发反馈迁移到未参与搜索的评估。',
    allowed: '仅用于准入或最终验证，严格改善时才允许合并。',
    risk: '若把留出结果泄漏给探索过程，它会退化成另一个开发集。',
    color: '#228d5c',
  },
};

export const AoContract: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [selected, setSelected] = useState<ContractKey>('M0');
  const item = CONTRACT[selected];

  return (
    <div data-widget={`${chapterId}-${moduleId}`}>
      <div
        role="group"
        aria-label="自主优化问题的四项契约"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}
      >
        {(Object.keys(CONTRACT) as ContractKey[]).map((key) => {
          const contract = CONTRACT[key];
          const active = selected === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(key)}
              style={{
                minHeight: 72,
                border: `${active ? 3 : 1}px solid ${contract.color}`,
                background: active ? contract.color : '#ffffff',
                color: active ? '#ffffff' : '#21324a',
                fontWeight: active ? 700 : 600,
              }}
            >
              <span style={{ display: 'block', fontSize: 18 }}>{contract.symbol}</span>
              <span style={{ display: 'block', fontSize: 13 }}>{contract.name}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 14,
          padding: 16,
          borderLeft: `6px solid ${item.color}`,
          background: '#f5f8f0',
        }}
      >
        <strong style={{ color: item.color }}>{item.symbol} · {item.name}</strong>
        <p>{item.definition}</p>
        <p><strong>允许动作：</strong>{item.allowed}</p>
        <p><strong>泄漏风险：</strong>{item.risk}</p>
      </div>

      <div className="feedback" role="status" aria-live="polite">
        当前边界：{item.symbol}。完整契约为 P = (M₀, O, Edev, Etest)。
      </div>
      <div className="feedback bad">
        禁止动作：用 Etest 反复指导搜索。这样会泄漏留出信号，破坏迁移验证。
      </div>
    </div>
  );
};

export default AoContract;
