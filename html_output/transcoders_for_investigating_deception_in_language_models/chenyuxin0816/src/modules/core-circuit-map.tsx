import { useState } from 'react';
import type { WidgetProps } from './registry';
import '../styles/core-circuit-map.css';

type FeatureId = 'obscuring' | 'negation' | 'secrets';

interface FeatureEvidence {
  id: FeatureId;
  name: string;
  frequency: number;
  connections: number;
  layer: number;
  index: number;
  conclusion: string;
  role: 'core' | 'peripheral';
}

const FEATURES: FeatureEvidence[] = [
  {
    id: 'obscuring',
    name: 'Obscuring information',
    frequency: 95,
    connections: 6,
    layer: 23,
    index: 119106,
    conclusion: '它既频繁出现，又指向 6/10 个 Top-10 Feature，因此被论文识别为核心节点之一。',
    role: 'core',
  },
  {
    id: 'negation',
    name: 'Negation and inability',
    frequency: 91,
    connections: 0,
    layer: 23,
    index: 158577,
    conclusion: '它在 91/100 张图中出现，却没有指向其他 Top-10 Feature：高频并不自动等于电路核心。',
    role: 'peripheral',
  },
  {
    id: 'secrets',
    name: 'Secrets / confidentiality',
    frequency: 86,
    connections: 6,
    layer: 8,
    index: 95840,
    conclusion: '它的出现频率略低，但同样指向 6/10 个 Top-10 Feature，因此也是核心节点。',
    role: 'core',
  },
];

const NEIGHBOR_POSITIONS = [
  { x: 92, y: 31 },
  { x: 180, y: 20 },
  { x: 276, y: 20 },
  { x: 366, y: 34 },
  { x: 416, y: 83 },
  { x: 372, y: 137 },
  { x: 281, y: 151 },
  { x: 181, y: 151 },
  { x: 88, y: 135 },
  { x: 42, y: 82 },
];

const SHORT_NAMES: Record<FeatureId, string> = {
  obscuring: '隐藏信息',
  negation: '否定与不能',
  secrets: '秘密与保密',
};

export function CoreCircuitMap(_props: WidgetProps) {
  const [featureId, setFeatureId] = useState<FeatureId>('obscuring');
  const feature = FEATURES.find((item) => item.id === featureId) ?? FEATURES[0];

  return (
    <div className={'ccm-root is-' + feature.role}>
      <div className="ccm-selector" role="group" aria-label="选择要检查的Feature">
        <span>选择要检查的 Feature</span>
        <div>
          {FEATURES.map((item) => (
            <button
              type="button"
              className={featureId === item.id ? 'is-active' : ''}
              aria-pressed={featureId === item.id}
              onClick={() => setFeatureId(item.id)}
              key={item.id}
            >
              <strong>{item.name}</strong>
              <small>{item.frequency}/100 · {item.connections}/10</small>
            </button>
          ))}
        </div>
      </div>

      <div className="ccm-workbench" aria-live="polite">
        <section className="ccm-selected-feature">
          <span>当前检查对象</span>
          <strong>{feature.name}</strong>
          <small>Layer {feature.layer} · Feature #{feature.index}</small>
          <div className={'ccm-role-badge is-' + feature.role}>
            {feature.role === 'core' ? '核心节点' : '高频，但处在电路边缘'}
          </div>
        </section>

        <section className="ccm-observation is-frequency">
          <header>
            <div><span>观察 1</span><strong>跨 Prompt 出现频率</strong></div>
            <b>{feature.frequency}<small>/100</small></b>
          </header>
          <div className="ccm-prompt-grid" aria-label={`该Feature在100张归因图中的${feature.frequency}张出现`}>
            {Array.from({ length: 100 }, (_, index) => (
              <i className={index < feature.frequency ? 'is-active' : ''} key={index} aria-hidden="true" />
            ))}
          </div>
          <p>这个指标决定它是否属于高频 Feature。</p>
        </section>

        <section className="ccm-observation is-connectivity">
          <header>
            <div><span>观察 2</span><strong>向外连接数</strong></div>
            <b>{feature.connections}<small>/10</small></b>
          </header>
          <div className="ccm-node-grid" aria-label={`该Feature指向${feature.connections}个Top-10 Feature`}>
            {Array.from({ length: 10 }, (_, index) => (
              <i className={index < feature.connections ? 'is-active' : ''} key={index} aria-hidden="true">
                {index + 1}
              </i>
            ))}
          </div>
          <p>论文用这个指标判断它是否位于候选电路中心；Top-10 平均为 1.6/10。</p>
        </section>
      </div>

      <div className="ccm-conclusion" aria-live="polite">
        <span>频率决定入围，连接数决定核心</span>
        <strong>{feature.conclusion}</strong>
      </div>

      <div className="ccm-neighborhood" aria-live="polite">
        <section className="ccm-neighborhood-map">
          <div className="ccm-neighborhood-title">
            <span>把连接数放回电路中</span>
            <strong>当前 Feature 的向外邻域</strong>
          </div>
          <svg viewBox="0 0 460 172" role="img" aria-label={`${feature.name} 指向 ${feature.connections} 个 Top-10 Feature`}>
            {NEIGHBOR_POSITIONS.map((position, index) => (
              <line
                className={index < feature.connections ? 'is-connected' : ''}
                x1="230"
                y1="86"
                x2={position.x}
                y2={position.y}
                key={`line-${index}`}
              />
            ))}
            {NEIGHBOR_POSITIONS.map((position, index) => (
              <g className={index < feature.connections ? 'is-connected' : ''} key={`node-${index}`}>
                <circle cx={position.x} cy={position.y} r="16" />
                <text x={position.x} y={position.y + 5}>{index + 1}</text>
              </g>
            ))}
            <circle className="ccm-neighborhood-center" cx="230" cy="86" r="30" />
            <text className="ccm-neighborhood-center-label" x="230" y="82">当前</text>
            <text className="ccm-neighborhood-center-value" x="230" y="103">{feature.connections}/10</text>
          </svg>
        </section>

        <section className="ccm-neighborhood-reading">
          <span>{feature.connections > 0 ? '连接广度' : '电路位置'}</span>
          <strong>
            {feature.connections > 0
              ? `从当前节点伸出 ${feature.connections} 条稳定连接`
              : '高频出现，但没有向外连接'}
          </strong>
          <p>
            {feature.connections > 0
              ? '它把信号送往多个节点，因此更像电路枢纽。'
              : '它经常激活，却没有向其他 Top-10 节点传出信号。'}
          </p>
          <div className="ccm-three-way" aria-label="三个Feature的向外连接数对照">
            {FEATURES.map((item) => (
              <div className={item.id === featureId ? 'is-current' : ''} key={item.id}>
                <span>{SHORT_NAMES[item.id]}</span>
                <i><b style={{ width: `${item.connections * 10}%` }} /></i>
                <strong>{item.connections}/10</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CoreCircuitMap;
