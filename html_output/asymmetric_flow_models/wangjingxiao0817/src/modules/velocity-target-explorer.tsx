import React, { useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

type Target = 'data' | 'noise';

const createNoiseValues = () => Array.from({ length: 36 }, () => 0.05 + Math.random() * 0.9);

export const VelocityTargetExplorer: React.FC<WidgetProps> = () => {
  const [target, setTarget] = useState<Target>('data');
  const [visited, setVisited] = useState<Target[]>(['data']);
  const [noiseValues, setNoiseValues] = useState(createNoiseValues);
  const isNoise = target === 'noise';
  const comparedBoth = visited.includes('data') && visited.includes('noise');

  const chooseTarget = (next: Target) => {
    setTarget(next);
    setVisited((current) => current.includes(next) ? current : [...current, next]);
    if (next === 'noise') setNoiseValues(createNoiseValues());
  };

  return (
    <div className="af-learning-block af-target-explorer">
      <InteractiveActivity
        instruction="先看 x₀ 的结构，再点 ε 比较随机性。"
        observationKey={target}
        observation={isNoise
          ? 'ε：包含大量独立随机自由度。'
          : 'x₀：高维，但包含大量相关结构。'}
      >
        <div className="af-target-formula" aria-label="Velocity target u 等于 epsilon 减 x0">
          <span>u =</span>
          <button className={isNoise ? 'noise active' : 'noise'} onClick={() => chooseTarget('noise')}>ε</button>
          <span>−</span>
          <button className={!isNoise ? 'data active' : 'data'} onClick={() => chooseTarget('data')}>x₀</button>
        </div>

        <div className={`af-target-detail ${isNoise ? 'show-noise' : 'show-data'}`}>
          <div className="af-patch" aria-label={isNoise ? '高维随机噪声像素格' : '具有相关结构的数据像素格'}>
            {Array.from({ length: 36 }).map((_, i) => {
              const structured = Math.max(0.08, 1 - Math.abs((i % 6) - 2.5) * 0.22 - Math.abs(Math.floor(i / 6) - 2.5) * 0.13);
              const value = isNoise ? noiseValues[i] : structured;
              return <i key={`${target}-${i}`} style={{ '--value': value, '--delay': `${(i % 7) * 40}ms` } as React.CSSProperties} />;
            })}
          </div>
          <div className="af-target-copy">
            <span className={`af-concept-tag ${isNoise ? 'noise' : 'data'}`}>{isNoise ? 'Gaussian Noise' : 'Clean Data'}</span>
            <div className="af-keyword-row left">
              {(isNoise
                ? ['随机', '独立', '弱结构']
                : ['结构化', '相关', '可压缩模式']
              ).map((word) => <span key={word}>{word}</span>)}
            </div>
          </div>
        </div>
      </InteractiveActivity>
      {comparedBoth ? <div className="af-compare-conclusion">同样高维，不代表同样难表示。</div> : null}
    </div>
  );
};
