import React, { useEffect } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { FlowMini } from './components/FlowMini';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';
import { InnovationTwoBridge } from './components/InnovationTwoBridge';
import { PartHeader } from './components/PartHeader';
import { useProgressiveChapters } from './lib/useProgressiveChapters';

const PART_I_COUNT = 4;
const RELEASED_CHAPTER_COUNT = 8;

export default function App() {
  const chapters = tutorial.chapters.slice(0, RELEASED_CHAPTER_COUNT);
  const total = chapters.length;
  const { revealed, begin, revealNext, revealTo } = useProgressiveChapters(total, PART_I_COUNT);
  const bili = tutorial.bilibili || [];

  // Auto-scroll to the most recently revealed chapter so the "next chapter" button
  // lands the new section in view instead of leaving it below the fold.
  useEffect(() => {
    if (revealed < 1) return;
    const ch = revealed <= PART_I_COUNT ? tutorial.chapters[0] : tutorial.chapters[revealed - 1];
    if (!ch) return;
    const el = document.getElementById(ch.id);
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [revealed]);

  const handleStart = () => {
    if (revealed === 0) {
      begin();
      return;
    }
    document.getElementById('chap-1')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePartNavigate = (href: string) => {
    const chapterMatch = href.match(/^#chap-(\d+)$/);
    const moduleMatch = href.match(/^#module-(\d+)-(\d+)$/);
    const chapterNumber = chapterMatch ? Number(chapterMatch[1]) : moduleMatch ? Number(moduleMatch[1]) : 0;

    if (chapterNumber > 0) revealTo(chapterNumber);

    window.setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const partIItems = [
    { number: '01', label: '背景', href: '#chap-1' },
    { number: '02', label: '瓶颈', href: '#chap-2' },
    { number: '03', label: '折中', href: '#chap-3' },
    { number: '04', label: 'AsymFlow', href: '#chap-4' },
  ];
  const partIIItems = [
    { number: '05', label: '必要工具', href: '#chap-5' },
    { number: '06', label: 'Innovation I', href: '#chap-6' },
    { number: '07', label: 'Innovation II', href: '#chap-7' },
  ];
  const partIIIItems = [
    { number: '8.1', label: 'Innovation I', href: '#module-8-1' },
    { number: '8.2', label: 'Innovation II', href: '#module-8-2' },
    { number: '8.3', label: '最终结果', href: '#module-8-3' },
  ];

  return (
    <>
      <Hero meta={tutorial.meta} hero={tutorial.hero} onStart={handleStart} started={revealed > 0} />
      <main>
        {revealed > 0 ? (
          <PartHeader
            id="part-i"
            kicker="PART I · THEORY & MOTIVATION"
            title="从 Latent Generation 到 AsymFlow"
            items={partIItems}
            onNavigate={handlePartNavigate}
          />
        ) : null}
        {chapters.map((ch, idx) => {
          const isVisible = revealed >= idx + 1;
          if (!isVisible) return null;
          const nextNum = idx + 2;
          const isLast = idx === total - 1;
          const isPartOne = idx < PART_I_COUNT;
          const isMechanism = idx >= PART_I_COUNT;

          const partHeader = idx === 4 ? (
            <PartHeader
              id="part-ii"
              kicker="PART II · FROM INSIGHT TO MECHANISM"
              title="从核心思想到完整机制"
              items={partIIItems}
              onNavigate={handlePartNavigate}
            />
          ) : idx === 7 ? (
            <PartHeader
              id="part-iii"
              kicker="PART III · EVIDENCE"
              title="实验证据：从机制到最终生成"
              items={partIIIItems}
              onNavigate={handlePartNavigate}
            />
          ) : null;

          return (
            <React.Fragment key={ch.id}>
              {partHeader}
              <section className={`chap ${isPartOne ? 'part-one' : isMechanism ? 'part-mechanism' : ''} ${ch.id === 'chap-8' ? 'part-evidence' : ''}`} id={ch.id}>
                <h2 className="chap-title">
                  <span className="num">§{idx + 1}.</span>
                  <span className="chap-heading-text">{ch.title}</span>
                </h2>
                {isPartOne || isMechanism ? (
                  <div className="part-goal"><span>{isPartOne ? '学习目标' : '核心目标'}</span><p>{ch.bridge}</p></div>
                ) : (
                  <>
                    <FlowMini total={total} revealed={revealed} />
                    <ChapterBridge text={ch.bridge} />
                    <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
                  </>
                )}
                {ch.id === 'chap-7' ? <InnovationTwoBridge /> : null}
                {ch.modules.map((m) => (
                  <Module key={m.id} module={m} chapterId={ch.id} />
                ))}
                {!isMechanism && ch.insight ? <InsightBar text={ch.insight} /> : null}
                {!isPartOne && !isMechanism && ch.formula ? <Formula formula={ch.formula} /> : null}
                {!isPartOne && !isMechanism ? <Takeaway items={ch.takeaways} /> : null}
                {idx === revealed - 1 && !isLast ? (
                  <div className="chap-loader">
                    <div className="chap-loader-hint" />
                    <button className="chap-loader-btn" onClick={revealNext}>
                      继续学习 §{nextNum} <span className="chap-loader-arrow">→</span>
                    </button>
                  </div>
                ) : isLast && !isMechanism ? (
                  bili.length > 0 ? <BiliVideos items={bili} /> : null
                ) : null}
              </section>
            </React.Fragment>
          );
        })}
      </main>
    </>
  );
}
