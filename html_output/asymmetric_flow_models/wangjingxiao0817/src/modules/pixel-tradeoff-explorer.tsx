import React, { useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

const sigmaOptions = [0.1, 0.01, 0.001] as const;

const formatVelocityError = (value: number) => {
  if (value >= 1) return value.toFixed(1);
  return value.toString();
};

export const PixelTradeoffExplorer: React.FC<WidgetProps> = () => {
  const [bypass, setBypass] = useState(false);
  const [sigmaIndex, setSigmaIndex] = useState(0);
  const sigma = sigmaOptions[sigmaIndex];
  const velocityError = 0.001 / sigma;

  const sigmaObservation = sigmaIndex === 2
    ? 'σₜ→0，Velocity Error 被快速放大。'
    : '误差放大较弱。';

  return (
    <div className="af-learning-block af-tradeoff-explorer">
      <div className="af-route-grid">
        <section className="af-route architecture-route">
          <div className="af-route-subhead"><span>3.1</span><div><h3>旁路实验</h3></div></div>
          <InteractiveActivity
            instruction="切换 Bypass：看信息是否绕过 Transformer 主干。"
            controls={(
              <button className={`af-switch ${bypass ? 'on' : ''}`} onClick={() => setBypass((value) => !value)} aria-pressed={bypass}>
                <i /><span>Bypass</span><b>{bypass ? 'ON' : 'OFF'}</b>
              </button>
            )}
          >
            <div className={`af-bypass-network ${bypass ? 'has-bypass' : ''}`}>
              <span>Input</span><i>→</i><span className="af-bypass-bottleneck">Transformer</span><i>→</i><span>Output</span>
              <div className="af-bypass-line"><b>skip / bypass</b></div>
            </div>
            <p className="af-route-status">{bypass ? '部分信息绕过主干。' : '信息经过 Transformer 主干。'}</p>
          </InteractiveActivity>
          <p className="af-route-tradeoff">✓ 高维信息更易传递　△ 网络结构更复杂</p>
        </section>

        <section className="af-route prediction-route">
          <div className="af-route-subhead"><span>3.2</span><div><h3>Low-noise 实验</h3></div></div>
          <InteractiveActivity
            instruction="把 σₜ 向 0 拖：看同一个 x₀ 误差如何被放大。"
          >
            <div className="af-prediction-formula" aria-label="u hat 等于 x t 减 x zero hat 再除以 sigma t">
              <span>û = (xₜ − x̂₀) / <b>σₜ</b></span>
            </div>
            <small className="af-fixed-error-note">Δx₀ = 0.001</small>
            <label className="af-sigma-control">
              <span>σₜ</span>
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={sigmaIndex}
                onChange={(event) => setSigmaIndex(Number(event.target.value))}
              />
              <small><span>0.1</span><span>0.01</span><span>0.001</span></small>
            </label>
            <div className="af-error-metrics">
              <div><span>σₜ</span><strong>{sigma}</strong></div>
              <div className="result"><span>Velocity Error</span><strong>{formatVelocityError(velocityError)}</strong></div>
            </div>
            <p className="af-route-status">{sigmaObservation}</p>
          </InteractiveActivity>
          <p className="af-route-tradeoff">✓ 避开 Full-rank Noise　△ Low-noise 数值敏感</p>
        </section>
      </div>
      <button
        type="button"
        className="af-converge-question"
        onClick={() => document.getElementById('chap-4')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      >
        能否既保留 plain Transformer，又避免 full-rank noise prediction？ <span>→</span>
      </button>
    </div>
  );
};
