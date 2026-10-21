import React from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { Module } from './components/Module';
import { InsightBar } from './components/InsightBar';
import { BiliVideos } from './components/BiliVideos';
import { Reveal, ChapterCard, DeepDiveBlock, Recap, ScrollProgress } from './modules/ui';
import { Intro, FormulaBlock, Panel, ChapterNav } from './modules/layout';
import { LINKS } from './modules/glossary';

// 单页长卷：封面 + 全部章节连续滚动；右下角是轻量章节导航（不是固定侧栏）。
// 每章顺序：片头卡 → 开场（本节作用 + 类比）→ 交互模块 → 要点 → 证据面板 → 公式 → 精读（折叠）→ 要点与误区。
// 各部分都是可选的，章节按内容取舍，不强行套同一结构。
export default function App() {
  const chapters = tutorial.chapters;
  const bili = (tutorial.bilibili || []).filter((b) => b.bvid && b.bvid.startsWith('BV'));
  const m = tutorial.meta;

  return (
    <div className="cine-page">
      <ScrollProgress />
      <ChapterNav chapters={chapters} />
      <main className="cine-main">
        <Hero meta={m} hero={tutorial.hero} />
        <div className="scroll-cue" aria-hidden="true">
          <span>向下滚动 · 开场</span>
          <i />
        </div>

        {chapters.map((ch, i) => (
          <Reveal key={ch.id} id={ch.id} className="chap cine-chap">
            <ChapterCard index={i + 1} total={chapters.length} chapter={ch} />
            <Intro bridge={ch.bridge} analogy={ch.analogy} chapterId={ch.id} />
            {ch.modules.map((mod) => (
              <Module key={mod.id} module={mod} chapterId={ch.id} />
            ))}
            {ch.insight ? <InsightBar text={ch.insight} /> : null}
            {(ch.panels || []).map((p) => (
              <Panel key={p} id={p} chapterId={ch.id} />
            ))}
            {ch.formula ? <FormulaBlock f={ch.formula} /> : null}
            {ch.deepDive ? <DeepDiveBlock dd={ch.deepDive} chapterId={ch.id} /> : null}
            <Recap takeaways={ch.takeaways} pitfalls={ch.pitfalls} />
          </Reveal>
        ))}

        {bili.length ? <BiliVideos items={bili} /> : null}

        <Reveal as="footer" className="credits">
          <div className="credits-the-end">全剧终</div>
          <div className="credits-title">{m.titleEn}</div>
          <div className="credits-role">作者</div>
          <div className="credits-names">{m.authors}</div>
          <div className="credits-role">单位</div>
          <div className="credits-names">{m.affiliation}</div>
          <div className="credits-role">发表</div>
          <div className="credits-names">{m.venue}</div>
          <div className="credits-links">
            <a href={LINKS.paper} target="_blank" rel="noopener">
              ECCV 论文 PDF ↗
            </a>
            <a href={LINKS.supp} target="_blank" rel="noopener">
              补充材料 ↗
            </a>
            <a href={LINKS.arxiv} target="_blank" rel="noopener">
              arXiv:2403.06764 ↗
            </a>
            <a href={LINKS.code} target="_blank" rel="noopener">
              官方代码 L738–746 ↗
            </a>
          </div>
          <div className="credits-note">
            本教程由 PaperSkill 生成 · 图表编号采用 ECCV 2024 正式版 · 标注“示意”的数据为合成，“公式外推”为本页计算，其余数值均来自论文
          </div>
        </Reveal>
      </main>
    </div>
  );
}
