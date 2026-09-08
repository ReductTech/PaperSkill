import React, { useEffect, useRef, useState } from 'react';
import { InteractiveActivity } from '../components/InteractiveActivity';
import type { WidgetProps } from './registry';

export const VelocityRecoveryPath: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compactLayout = window.matchMedia('(max-width: 780px)').matches;
    if (reduceMotion || compactLayout) {
      setStage(4);
      return;
    }

    const updateStage = () => {
      const element = scrollRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const available = Math.max(1, element.offsetHeight - window.innerHeight * 0.82);
      const traveled = Math.min(available, Math.max(0, -rect.top + 88));
      setStage(Math.min(4, Math.floor(traveled / available * 5)));
    };

    updateStage();
    window.addEventListener('scroll', updateStage, { passive: true });
    window.addEventListener('resize', updateStage);
    return () => {
      window.removeEventListener('scroll', updateStage);
      window.removeEventListener('resize', updateStage);
    };
  }, []);

  return (
    <div className="af-mechanism-block af-recovery-lab">
      <InteractiveActivity instruction="向下滚动：P 分支直接保留，I−P 分支把 x₀-like 转回 Velocity。">
        <div className="af-recovery-scroll" ref={scrollRef}>
          <div className="af-recovery-sticky">
            <div className="af-recovery-graph">
              <div className="af-recovery-source active">
                <strong>û<sub>A</sub></strong>
              </div>

              <div className="af-recovery-split" aria-hidden="true"><i className={stage >= 1 ? 'active' : ''} /><i className={stage >= 2 ? 'active' : ''} /></div>

              <div className="af-recovery-branches">
                <section className={`lowrank ${stage >= 1 ? 'active' : ''}`}>
                  <span>P</span>
                  <div className="formula">Pû<sub>A</sub></div>
                  <small>直接保留</small>
                </section>
                <section className={`orthogonal ${stage >= 2 ? 'active' : ''}`}>
                  <span>I−P</span>
                  <small>x₀ → u</small>
                  <div className="converted">(I−P)(x<sub>t</sub> + û<sub>A</sub>) / σ<sub>t</sub></div>
                </section>
              </div>

              <div className={`af-recovery-merge ${stage >= 3 ? 'active' : ''}`}>
                <i>↘</i><i>↙</i><div><strong>û</strong></div>
              </div>
            </div>

            <div className={`af-recovery-formula ${stage >= 4 ? 'revealed' : ''}`} aria-hidden={stage < 4}>
              <div>u = Pu<sub>A</sub> + (I−P)<span className="fraction"><b>x<sub>t</sub> + u<sub>A</sub></b><i>σ<sub>t</sub></i></span></div>
            </div>
          </div>
        </div>
      </InteractiveActivity>

      <details className="af-exact-recovery">
        <summary>数学展开 · Exact Recovery</summary>
        <div className="af-proof-ladder">
          <div>Pu<sub>A</sub> = Pu</div><i>↓</i>
          <div>(I−P)u<sub>A</sub> = −(I−P)x₀</div><i>↓</i>
          <div>(I−P)u = (I−P)<span className="fraction"><b>x<sub>t</sub> + u<sub>A</sub></b><i>σ<sub>t</sub></i></span></div><i>↓</i>
          <div className="boxed">u = Pu<sub>A</sub> + (I−P)<span className="fraction"><b>x<sub>t</sub> + u<sub>A</sub></b><i>σ<sub>t</sub></i></span></div>
          <small title="Orthogonal projector identities">使用 P²=P 与 (I−P)P=0。</small>
        </div>
      </details>

    </div>
  );
};
