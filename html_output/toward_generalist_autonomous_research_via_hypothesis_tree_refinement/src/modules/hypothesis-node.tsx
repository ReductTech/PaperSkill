import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type FieldKey = 'hypothesis' | 'insight' | 'metadata';

const FIELDS: Record<
  FieldKey,
  { symbol: string; label: string; title: string; value: string; purpose: string; color: string }
> = {
  hypothesis: {
    symbol: 'hₙ',
    label: 'hypothesis',
    title: '可验证假设',
    value: 'N3.1：运行 K=5 条独立 ReAct 轨迹，用证据档案按约束覆盖度聚合候选，而不是多数投票。',
    purpose: '说明为什么进行这次尝试，并给执行器一个固定、可证伪的方向。',
    color: '#27446e',
  },
  insight: {
    symbol: 'ιₙ',
    label: 'insight',
    title: '可复用洞见',
    value: '正确答案可能只出现在少数轨迹中；保留候选及其证据档案，才能从独立轨迹中找回它。',
    purpose: '把局部实验事实抽象成祖先节点和后续侧枝都能使用的约束。',
    color: '#228d5c',
  },
  metadata: {
    symbol: 'μₙ',
    label: 'metadata',
    title: '制品与评估元数据',
    value: 'node=N3.1 · dev accuracy=65.0% · status=merged · effect=drives shift · artifact=branch reference',
    purpose: '保存制品引用、节点状态、开发分数和事实记录，使过程可追溯；父子关系由树的边 E 表示。',
    color: '#7c3aed',
  },
};

export const HypothesisNode: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [selectedField, setSelectedField] = useState<FieldKey>('hypothesis');
  const [visited, setVisited] = useState<FieldKey[]>(['hypothesis']);
  const field = FIELDS[selectedField];
  const complete = visited.length === 3;

  const selectField = (key: FieldKey) => {
    setSelectedField(key);
    setVisited((current) => (current.includes(key) ? current : [...current, key]));
  };

  return (
    <div data-widget={`${chapterId}-${moduleId}`}>
      <p style={{ color: '#21324a', fontFamily: 'monospace' }}>
        state = selectedField: "{selectedField}"
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          alignItems: 'stretch',
        }}
      >
        <div role="listbox" aria-label="选择假设节点字段" style={{ display: 'grid', gap: 8 }}>
          {(Object.keys(FIELDS) as FieldKey[]).map((key) => {
            const item = FIELDS[key];
            const active = selectedField === key;
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => selectField(key)}
                style={{
                  border: `${active ? 3 : 1}px solid ${item.color}`,
                  background: active ? item.color : '#ffffff',
                  color: active ? '#ffffff' : '#21324a',
                  padding: 12,
                  textAlign: 'left',
                  fontWeight: active ? 700 : 600,
                }}
              >
                <span style={{ display: 'block', fontSize: 18 }}>{item.symbol}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            border: `3px solid ${field.color}`,
            background: '#f5f8f0',
            padding: 16,
            minHeight: 210,
          }}
        >
          <div style={{ color: field.color, fontWeight: 700, fontSize: 18 }}>
            {field.symbol} · {field.title}
          </div>
          <p style={{ fontWeight: 700 }}>{field.value}</p>
          <p>{field.purpose}</p>
          <div style={{ color: field.color, fontWeight: 700 }}>
            已查看：{visited.map((key) => FIELDS[key].symbol).join('、')}
          </div>
        </div>
      </div>

      <div className="feedback bad">
        只有分数：无法解释为什么尝试、失败说明了什么，也找不到对应制品版本。
      </div>
      <div className={`feedback ${complete ? 'good' : ''}`} role="status" aria-live="polite">
        {complete
          ? '完整节点可审计：假设、洞见和制品引用已经绑定；失败节点也值得保留。'
          : `正在检查 ${field.symbol}。还需查看 ${3 - visited.length} 类信息，才能还原完整节点。`}
      </div>
      <p style={{ color: '#21324a', marginBottom: 0 }}>
        N3.1 的机制、开发分数和状态来自 Figure 6；字段结构来自 Section 4.2。树边表示精炼关系，而非时间顺序；制品本体留在外部版本状态中，节点只保存引用。
      </p>
    </div>
  );
};

export default HypothesisNode;
