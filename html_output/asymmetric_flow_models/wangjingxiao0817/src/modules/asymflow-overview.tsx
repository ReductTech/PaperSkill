import React, { useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

type View = 'standard' | 'asymmetric';

export const AsymflowOverview: React.FC<WidgetProps> = () => {
  const [view, setView] = useState<View>('standard');
  const asymmetric = view === 'asymmetric';
  const controls = (
    <div className="af-segmented" role="group" aria-label="比较标准目标与 AsymFlow 目标">
      <button className={!asymmetric ? 'active' : ''} onClick={() => setView('standard')}>Standard</button>
      <button className={asymmetric ? 'active' : ''} onClick={() => setView('asymmetric')}>AsymFlow</button>
    </div>
  );

  return (
    <div className="af-learning-block af-overview">
      <InteractiveActivity
        instruction="切换 Standard / AsymFlow：只看 Prediction Target 的哪一项变了。"
        controls={controls}
        observationKey={view}
        observation={asymmetric ? '只限制 Noise；Network 与 Flow process 不变。' : 'Standard 直接承担 Full-rank Noise。'}
      >
        <div className={`af-target-layers ${asymmetric ? 'is-asymmetric' : 'is-standard'}`}>
          <div className="af-fixed-layer"><span>NETWORK</span><strong>Plain Transformer</strong><em>不变</em></div>
          <div className="af-fixed-layer"><span>FLOW</span><strong>Noise ↔ Data</strong><em>不变</em></div>
          <div className="af-changing-layer">
            <div className="af-layer-label"><span>Prediction Target</span><em>改变</em></div>
            <div className="af-target-equation" key={view}>
              <span>{asymmetric ? <>u<sub>A</sub></> : 'u'}</span><b>=</b>
              <span className={asymmetric ? 'lowrank-term' : 'noise-term'}>{asymmetric ? 'Pε' : 'ε'}</span>
              <b>−</b><span className="data-term">x₀</span>
            </div>
            <div className="af-target-dimensions">
              <div><span>Data</span><strong>Full-rank</strong></div>
              <div><span>Noise</span><strong>{asymmetric ? 'Low-rank' : 'Full-rank'}</strong></div>
            </div>
          </div>
        </div>
      </InteractiveActivity>
      <p className="af-projection-note">P 的构造在 Part II 展开。</p>
    </div>
  );
};
