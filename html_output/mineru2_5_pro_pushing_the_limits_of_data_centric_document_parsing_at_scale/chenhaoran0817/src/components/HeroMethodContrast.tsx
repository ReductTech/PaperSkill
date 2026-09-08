import React, { useEffect, useRef, useState } from 'react';
import { GlossaryText } from './Glossary';

export function HeroMethodContrast() {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(true);
      return undefined;
    }
    if (!('IntersectionObserver' in window)) {
      setActive(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setActive(true);
      observer.disconnect();
    }, { threshold: 0.32 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <figure
      ref={rootRef}
      className={`hero-method-contrast ${active ? 'is-active' : ''}`}
      aria-labelledby="hero-contrast-title"
    >
      <div className="hmc-control">
        <span>控制变量</span>
        <b id="hero-contrast-title">两边都是同一个 1.2B 模型，只改变数据与训练闭环</b>
        <i aria-hidden="true">🔒</i>
      </div>

      <div className="hmc-panels">
        <section className="hmc-panel hmc-panel--baseline" aria-label="只增加普通数据">
          <header><span>常见做法</span><b>继续堆普通页面</b></header>
          <div className="hmc-stage" aria-hidden="true">
            <div className="hmc-page-stack hmc-page-stack--same">
              {Array.from({ length: 6 }, (_, index) => <i key={index}><em /><em /><em /></i>)}
            </div>
            <span className="hmc-arrow">→</span>
            <div className="hmc-model"><small>LOCKED</small><b>1.2B</b></div>
            <span className="hmc-arrow">→</span>
            <div className="hmc-failure"><i>×</i><b>Hard</b><small>仍然共同失败</small></div>
          </div>
          <div className="hmc-panel-note"><span>样本数量 ↑</span><span>长尾覆盖 ≈</span></div>
        </section>

        <section className="hmc-panel hmc-panel--pro" aria-label="系统化数据工程与训练">
          <header><span>论文方案</span><b>把数据送到正确的位置</b></header>
          <div className="hmc-pipeline" aria-hidden="true">
            <div className="hmc-varied-pages"><i>∑</i><i>表</i><i>双栏</i><i>图</i></div>
            <div className="hmc-methods"><span>DDAS</span><span>CMCV</span><span>Verify</span><span>3-stage</span></div>
            <div className="hmc-score"><small>Full</small><span>92.98</span><i>→</i><b>95.69</b><strong>+2.71</strong></div>
          </div>
          <div className="hmc-panel-note"><span>覆盖长尾</span><span>校准难例</span><span>公平验证</span></div>
        </section>
      </div>

      <figcaption>
        <span className="source-tag paper">论文事实</span>
        <GlossaryText text="结论来自完整 Data Engine 与三阶段训练组合；论文没有证明某一个组件单独贡献全部增益。" />
      </figcaption>
    </figure>
  );
}
