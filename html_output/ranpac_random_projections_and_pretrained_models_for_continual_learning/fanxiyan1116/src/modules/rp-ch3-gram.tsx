import React, { useMemo, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const components = [
  { id: 'shared', label: '共享方向', vector: [1.0, 0.92], covariance: 0.34 },
  { id: 'residual', label: '类别残差', vector: [0.45, -0.72], covariance: -0.08 },
  { id: 'noise', label: '噪声方向', vector: [-0.28, 0.36], covariance: 0.61 },
] as const;

const g = [[1.8, 1.5], [1.5, 1.6]];
const determinant = g[0][0] * g[1][1] - g[0][1] * g[1][0];
const inverse = [
  [g[1][1] / determinant, -g[0][1] / determinant],
  [-g[1][0] / determinant, g[0][0] / determinant],
];
const test = [1.1, 0.6];

function mapped(component: readonly [number, number]) {
  const gx = inverse[0][0] * component[0] + inverse[0][1] * component[1];
  const gy = inverse[1][0] * component[0] + inverse[1][1] * component[1];
  return test[0] * gx + test[1] * gy;
}

export function RpCh3Gram() {
  const [enabled, setEnabled] = useState<string[]>(components.map((item) => item.id));
  const [selected, setSelected] = useState(0);
  const active = components[selected];
  const scores = components.map((component) => enabled.includes(component.id) ? mapped(component.vector) : 0);
  const score = scores.reduce((sum, value) => sum + value, 0);
  const residual = useMemo(() => {
    const selectedComponents = components.filter((item) => enabled.includes(item.id));
    const xs = selectedComponents.map((item) => item.vector[0]);
    const ys = selectedComponents.map((item) => item.vector[1]);
    const meanX = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    const meanY = ys.reduce((a, b) => a + b, 0) / Math.max(1, ys.length);
    const cov = xs.reduce((sum, x, index) => sum + (x - meanX) * (ys[index] - meanY), 0);
    const vx = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
    const vy = ys.reduce((sum, y) => sum + (y - meanY) ** 2, 0);
    return cov / Math.max(0.0001, Math.sqrt(vx * vy));
  }, [enabled]);
  const heat = Array.from({ length: 16 }, (_, index) => {
    const row = Math.floor(index / 4);
    const col = index % 4;
    return 0.15 + ((row * 7 + col * 5 + 3) % 9) / 10;
  });
  heat[5] = 0.92;
  heat[9] = 0.92;
  const highlighted = selected === 0 ? [0, 5] : selected === 1 ? [1, 4] : [2, 7];

  return (
    <div className="rp-widget rp-gram-widget">
      <div className="rp-gram-top">
        <section className="rp-panel rp-heat-panel">
          <div className="rp-panel-heading">
            <span>教学 Gram 热图</span>
            <strong>非对角项强</strong>
          </div>
          <div className="rp-gram-heat" role="grid" aria-label="四乘四教学 Gram 热图">
            {heat.map((value, index) => (
              <button
                key={index}
                type="button"
                role="gridcell"
                aria-label={`Gram 矩阵第 ${Math.floor(index / 4) + 1} 行第 ${index % 4 + 1} 列`}
                className={highlighted.includes(index) ? 'is-highlighted' : ''}
                style={{
                  background: value > 0.68 ? '#92400e' : value > 0.38 ? '#c47a42' : '#e7cfb9',
                }}
                onClick={() => {
                  const row = Math.floor(index / 4);
                  setSelected(row < 2 ? 0 : row === 2 ? 1 : 2);
                }}
              />
            ))}
          </div>
          <div className="rp-gram-legend">
            <span>弱相关</span><i /><span>强相关</span>
          </div>
        </section>

        <section className="rp-panel rp-gram-vector-panel">
          <div className="rp-panel-heading">
            <span>向量分解</span>
            <strong>{active.label}</strong>
          </div>
          <svg viewBox="0 0 560 280" role="img" aria-label="测试向量和三个教学方向">
            <line x1="70" y1="230" x2="500" y2="230" className="rp-plane-axis" />
            <line x1="280" y1="245" x2="280" y2="25" className="rp-plane-axis" />
            {components.map((component, index) => (
              <g key={component.id} className={index === selected ? 'is-selected' : enabled.includes(component.id) ? '' : 'is-off'}>
                <line
                  x1="280"
                  y1="230"
                  x2={280 + component.vector[0] * 125}
                  y2={230 - component.vector[1] * 105}
                  className={`rp-component-line is-${component.id}`}
                />
                <circle
                  cx={280 + component.vector[0] * 125}
                  cy={230 - component.vector[1] * 105}
                  r={index === selected ? 17 : 12}
                  className={`rp-component-dot is-${component.id}`}
                />
              </g>
            ))}
            <line x1="280" y1="230" x2={280 + test[0] * 130} y2={230 - test[1] * 110} className="rp-test-vector" />
            <text x={280 + test[0] * 130 + 14} y={230 - test[1] * 110 - 12} className="rp-svg-label">f测试</text>
          </svg>
        </section>
      </div>

      <div className="rp-gram-bottom">
        <div className="rp-component-selector" role="group" aria-label="选择向量分量">
          {components.map((component, index) => (
            <button
              key={component.id}
              type="button"
              className={`${index === selected ? 'is-active' : ''} ${enabled.includes(component.id) ? '' : 'is-off'}`}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
              onDoubleClick={() => setEnabled((items) =>
                items.includes(component.id) ? items.filter((id) => id !== component.id) : [...items, component.id])}
            >
              {component.label}
            </button>
          ))}
          <span>单击查看，双击启用或关闭</span>
        </div>
        <div className="rp-gram-score-strip">
          <span>{`s_y=${score.toFixed(3)}`}</span>
          <span>{`残差相关 ${residual.toFixed(2)}`}</span>
          <span>原始 Gram 分数，不是余弦</span>
        </div>
        <div className="rp-formula-strip">
          <SymbolHint meaning="测试特征的原始 Gram 映射分数">s_y=f_testᵀG⁻¹c_y</SymbolHint>
          {' · '}
          <SymbolHint meaning="原始特征的累计二阶统计">G=Σffᵀ</SymbolHint>
        </div>
        <div className="rp-feedback rp-feedback-wide">
          <strong>{active.label}</strong>
          <span>
            去掉共享方向后分数更多由类别残差决定；近奇异方向会被 G⁻¹ 放大。矩阵与协方差为教学小例。
          </span>
        </div>
      </div>
    </div>
  );
}
