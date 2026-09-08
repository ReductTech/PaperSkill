import React, { useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

type Space = 'latent' | 'pixel';

const DIRECTIONS = Array.from({ length: 18 }, (_, index) => ({
  angle: -76 + index * (152 / 17),
  length: 74 + (index % 4) * 8,
}));

export const NoiseThroughNetwork: React.FC<WidgetProps> = () => {
  const [space, setSpace] = useState<Space>('latent');
  const pixel = space === 'pixel';
  const activeDirections = pixel ? 18 : 6;
  const controls = (
    <div className="af-segmented" role="group" aria-label="切换表示空间">
      <button className={!pixel ? 'active' : ''} onClick={() => setSpace('latent')}>Latent</button>
      <button className={pixel ? 'active' : ''} onClick={() => setSpace('pixel')}>Pixel</button>
    </div>
  );

  return (
    <div className="af-learning-block af-network-explorer">
      <InteractiveActivity
        instruction="切换 Latent / Pixel，比较需要预测的独立 Noise directions。"
        controls={controls}
        observationKey={space}
        observation={pixel ? 'Pixel：需要同时预测更多独立 Noise directions。' : 'Latent：需要预测的 Noise directions 更少。'}
      >
        <div className={`af-noise-burden ${pixel ? 'is-pixel' : 'is-latent'}`}>
          <div className="af-noise-burden-head">
            <strong>Noise Prediction Burden</strong>
            <span>概念示意，不代表真实维度比例</span>
          </div>
          <div className="af-noise-direction-stage" aria-label={pixel ? 'Pixel 空间需要预测更多独立噪声方向' : 'Latent 空间需要预测较少独立噪声方向'}>
            <div className="af-noise-direction-fan" aria-hidden="true">
              {DIRECTIONS.map((direction, index) => (
                <i
                  key={index}
                  className={index < activeDirections ? 'active' : ''}
                  style={{
                    '--angle': `${direction.angle}deg`,
                    '--length': `${direction.length}px`,
                    '--delay': `${index * 18}ms`,
                  } as React.CSSProperties}
                />
              ))}
              <b>ε</b>
            </div>
            <div className="af-noise-burden-copy">
              <strong>{pixel ? '更多' : '较少'}独立随机方向</strong>
              <span>{pixel ? '高维 Pixel Noise' : '压缩 Latent Noise'}</span>
            </div>
          </div>
        </div>
      </InteractiveActivity>
    </div>
  );
};
