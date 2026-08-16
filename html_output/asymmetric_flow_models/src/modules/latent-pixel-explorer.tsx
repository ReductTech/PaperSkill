import React, { useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

type Mode = 'latent' | 'pixel';

export const LatentPixelExplorer: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('latent');
  const latent = mode === 'latent';
  const controls = (
    <div className="af-segmented" role="group" aria-label="切换生成空间">
      <button className={latent ? 'active' : ''} onClick={() => setMode('latent')}>Latent</button>
      <button className={!latent ? 'active' : ''} onClick={() => setMode('pixel')}>Pixel</button>
    </div>
  );

  return (
    <div className="af-learning-block af-latent-pixel">
      <InteractiveActivity
        instruction="切换 Latent / Pixel：看最终像素细节由 Decoder 还是 Model 负责。"
        controls={controls}
        observationKey={mode}
        observation={latent
          ? 'Latent：生成模型输出压缩表示，最终像素由固定 Decoder 恢复。'
          : 'Pixel：生成模型直接输出最终像素。'}
      >
        <div className={`af-representation-stage ${latent ? 'is-latent' : 'is-pixel'}`}>
          <div className="af-flow-line">
            <span className="af-node noise">Noise</span><span className="af-arrow">→</span>
            <span className="af-node model">Generative Model</span><span className="af-arrow af-direct-arrow">→</span>
            {latent ? <><span className="af-node latent">Latent</span><span className="af-arrow">→</span></> : null}
            {latent ? <span className="af-node decoder is-highlighted">Fixed Decoder</span> : null}
            {latent ? <span className="af-arrow">→</span> : null}
            <span className="af-node data">RGB Pixels</span>
          </div>

          <div className={`af-detail-preview ${latent ? 'decoder-linked' : 'direct-linked'}`}>
            <div className="af-detail-image" aria-hidden="true">
              {Array.from({ length: 36 }).map((_, i) => (
                <i key={i} style={{ backgroundColor: `hsl(${26 + i * 1.1} 33% ${88 - (i % 7) * 3}%)` }} />
              ))}
            </div>
            <strong>{latent ? 'Decoder 恢复像素细节' : 'Model 直接生成像素细节'}</strong>
          </div>
        </div>
      </InteractiveActivity>
    </div>
  );
};
