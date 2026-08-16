import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { HeroWorldLoop } from '../modules/hero-world-loop';

export function Hero({
  hero,
  onStart,
  onPresentation,
  activeMode,
}: {
  meta: Meta;
  hero: HeroConfig;
  onStart: () => void;
  onPresentation: () => void;
  activeMode: 'landing' | 'tutorial' | 'presentation';
}) {
  return (
    <section className="hero interactive-cover">
      <div className="hero-inner">
        <header className="hero-cover-heading">
          <h1>ABot-World-0</h1>
          <p className="hero-cover-subtitle">让一个生成世界真正「持续跑起来」</p>
          <p className="hero-cover-opening">
            <span>生成一段漂亮视频不难。</span>
            <strong>难的是让这个世界一直生成、听你控制、记住角色，还能在一张显卡上实时运行。</strong>
          </p>
          <p className="hero-cover-detail">ABot-World-0 从动作与身份条件、长期自滚动训练和系统优化多个层面，把视频生成模型推进为可持续交互的世界模型。</p>
        </header>

        <HeroWorldLoop />

        <div className="hero-performance" aria-label="论文报告的单卡运行结果">
          <strong>≈16 FPS <i>·</i> 1.2 s <i>·</i> ≈19 GiB</strong>
          <div>
            {hero.metrics.map((metric) => <span key={metric.value}>{metric.label}</span>)}
          </div>
          <p>{hero.conditions}</p>
        </div>

        <div className="hero-cover-actions">
          <button hidden type="button" data-testid="presentation-entry" aria-pressed={activeMode === 'presentation'} className="hero-cover-primary" onClick={onPresentation}>▶ 4 分钟理解这篇论文</button>
          <button type="button" data-testid="tutorial-entry" aria-pressed={activeMode === 'tutorial'} className="hero-cover-primary" onClick={onStart}>进入完整教程 →</button>
        </div>
      </div>
    </section>
  );
}
