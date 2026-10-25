import React from 'react';
import type { Meta, HeroConfig } from '../types';
import { MapleCoverScene } from '../modules/maple-cover-scene';
import '../styles/maple-cover.css';

export function Hero({ meta, hero: _hero, onStart }: { meta: Meta; hero: HeroConfig; onStart?: () => void }) {
  return (
    <section className="maple-cover" aria-labelledby="maple-cover-title">
      <div className="maple-cover-topline"><span><i /> INTERACTIVE PAPER / 04</span><span>{meta.venue}</span></div>
      <div className="maple-cover-layout">
        <div className="maple-cover-copy">
          <div className="maple-cover-kicker">A FIELD GUIDE TO MULTI-MODAL PROMPT LEARNING</div>
          <h1 id="maple-cover-title" aria-label={meta.titleEn}>MaP<span>Le</span><i aria-hidden="true">✳</i></h1>
          <h2>让图像与文字，<br />一起适应新任务。</h2>
          <p className="maple-cover-intro">给冻结的图文模型一组相连的提示。<br className="maple-cover-desktop-break" />从一个小小的改动，看懂 MaPLe 的完整设计。</p>
          <div className="maple-cover-actions">
            <button className="maple-cover-start" type="button" onClick={onStart}>开始探索 <span aria-hidden="true">↗</span></button>
            <a href="https://arxiv.org/abs/2210.03117" target="_blank" rel="noreferrer">阅读原论文 <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <MapleCoverScene />
      </div>
    </section>
  );
}
