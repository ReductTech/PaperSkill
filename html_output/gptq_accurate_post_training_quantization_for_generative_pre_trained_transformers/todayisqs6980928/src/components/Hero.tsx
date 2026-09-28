import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { HeroGptqLoop } from '../modules/heroGptqLoop';

// 首页封面：对标参考范例的开篇句式 + 闭环流程图 + 三大机制 + 实验指标块 + 跳转按钮。
export function Hero({
  meta,
  hero,
  onStart,
}: {
  meta: Meta;
  hero: HeroConfig;
  onStart: () => void;
}) {
  return (
    <section className="hero interactive-cover">
      <div className="hero-inner">
        <header className="hero-cover-heading">
          <h1>GPTQ · 大模型高精度后训练量化交互式导读</h1>
          <p className="hero-cover-subtitle">基于近似二阶信息的后训练量化：3–4bit 下的单卡部署</p>
          <p className="hero-cover-opening">
            <span>模型量化压缩本身并非难题。</span>
            <strong>核心挑战在于：将千亿参数模型量化至 3–4bit 并保持精度近乎无损，同时仅依赖后训练、无需重训，且在单卡上完成量化与推理。</strong>
          </p>
          <p className="hero-cover-detail">
            {meta.coreInsight}
          </p>
        </header>

        <HeroGptqLoop />

        <div className="hero-performance" aria-label="论文报告的单卡量化与推理结果">
          <strong>
            4.2 GPU 小时 <i>·</i> 8.34 → 8.37 <i>·</i> 4.5×
          </strong>
          <div>
            {hero.metrics.map((m) => (
              <span key={m.value}>{m.label}</span>
            ))}
          </div>
          <p>{hero.conditions}</p>
        </div>

        <div className="hero-cover-actions">
          <button type="button" data-testid="tutorial-entry" className="hero-cover-primary" onClick={onStart}>
            ▶ 4分钟理解这篇论文 → 进入完整交互式教程
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
