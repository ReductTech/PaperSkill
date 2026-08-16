import React, { useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { widgetRegistry } from './modules/registry';
import { BiliVideos } from './components/BiliVideos';
import { Formula } from './components/Formula';

const chapterLabels = ['问题', '定义', '汇合', '架构', '数据', '评价', '挑战', '收束'];

function ResearchHeader() {
  return <header className="research-header">
    <a className="brand" href="#top" aria-label="回到顶部"><span>W</span> 世界动作模型</a>
    <span className="header-framework">WORLD · FUTURE · ACTION</span>
    <span className="paper-link">PREDICT → ACT</span>
  </header>;
}

function Hero() {
  return <section className="research-hero" id="top">
    <div className="hero-copy">
      <h1>World Action Models:{' '}<span>The Next Frontier in Embodied AI</span></h1>
      <p className="hero-translation">世界动作模型：具身智能的下一个前沿</p>
      <p className="hero-summary">世界动作模型把未来状态建模与动作生成统一起来，让机器人先预见行动后果，再生成与未来一致的动作。</p>
      <ul className="hero-tags" aria-label="论文主题标签">
        {tutorial.meta.keywords.map((keyword) => <li key={keyword}>{keyword}</li>)}
      </ul>
      <div className="hero-actions"><a className="primary-action" href="#chap-1">进入正文 <span>↓</span></a></div>
    </div>
    <div className="hero-visual" aria-label="机械臂抓取红球并绕开障碍放入蓝色篮子">
      <img src={`${import.meta.env.BASE_URL}images/wam-robot-arm-lab.png`} alt="白色机械臂、红球、透明障碍与蓝色篮子" />
      <div className="future-rail"><b>预见</b><span>直线路径会碰撞</span></div>
      <div className="action-rail"><b>行动</b><span>选择安全的绕行轨迹</span></div>
    </div>
  </section>;
}

function ChapterRail({ active, unlocked }: { active: number; unlocked: number }) {
  return <aside className="chapter-rail" aria-label="演示路线">
    <p>内容导航</p>
    {chapterLabels.map((label, index) => index <= unlocked ? <a key={label} className={active === index ? 'is-active' : ''} href={`#chap-${index + 1}`}><span>{String(index + 1).padStart(2, '0')}</span>{label}</a> : <span className="rail-locked" key={label}><span>{String(index + 1).padStart(2, '0')}</span>{label}</span>)}
    <div className="rail-legend"><i className="future-dot" />预见未来<i className="action-dot" />决定动作</div>
  </aside>;
}

function ChapterSection({ chapter, index, onNext }: { chapter: (typeof tutorial.chapters)[number]; index: number; onNext: () => void }) {
  return <section className="research-chapter" id={chapter.id} data-chapter={index + 1}>
    <div className="chapter-heading"><p>{chapterLabels[index]}</p><h2>{chapter.title}</h2><div className="chapter-thesis" dangerouslySetInnerHTML={{ __html: chapter.bridge }} /></div>
    <div className="argument-grid">
      <div className="argument-copy"><p className="section-label">直觉</p><h3>{chapter.analogy.title}</h3><p dangerouslySetInnerHTML={{ __html: chapter.analogy.text }} />{chapter.formula ? <Formula formula={chapter.formula} /> : null}</div>
      <div className="interaction-column">{chapter.modules.map((module, moduleIndex) => { const Widget = widgetRegistry[module.componentId]; return <div className="interaction-unit" key={module.id}><div className="interaction-head"><b>{module.title}</b></div>{Widget ? <Widget chapterId={chapter.id} moduleId={module.id} /> : null}<p className="interaction-caption" dangerouslySetInnerHTML={{ __html: module.desc }} />{moduleIndex < chapter.modules.length - 1 ? <div className="interaction-divider" /> : null}</div>; })}</div>
    </div>
    <div className="chapter-takeaways">{chapter.takeaways.map((item, takeawayIndex) => <div key={item.title}><span>0{takeawayIndex + 1}</span><b>{item.title}</b><p>{item.desc}</p></div>)}</div>
    <div className="chapter-next">{index < tutorial.chapters.length - 1 ? <button type="button" onClick={onNext}><small>下一章</small><b>{tutorial.chapters[index + 1].title}</b><span>→</span></button> : <a href="#top"><small>演示结束</small><b>回到开场</b><span>↑</span></a>}</div>
  </section>;
}

export default function App() {
  const [active, setActive] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  useEffect(() => { const nodes = Array.from(document.querySelectorAll<HTMLElement>('.research-chapter')); const observer = new IntersectionObserver((entries) => { const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (visible) setActive(Number((visible.target as HTMLElement).dataset.chapter) - 1); }, { rootMargin: '-22% 0px -58% 0px', threshold: [0, .2, .5] }); nodes.forEach((node) => observer.observe(node)); return () => observer.disconnect(); }, [unlocked]);
  const openNext = (index: number) => { const next = index + 1; setUnlocked((value) => Math.max(value, next)); setActive(next); window.setTimeout(() => document.getElementById(`chap-${next + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40); };
  return <><ResearchHeader /><Hero /><main className="research-shell"><ChapterRail active={active} unlocked={unlocked} /><div className="chapter-stream">{tutorial.chapters.slice(0, unlocked + 1).map((chapter, index) => <ChapterSection key={chapter.id} chapter={chapter} index={index} onNext={() => openNext(index)} />)}{unlocked === tutorial.chapters.length - 1 && tutorial.bilibili?.length ? <BiliVideos items={tutorial.bilibili} /> : null}{unlocked === tutorial.chapters.length - 1 ? <footer className="research-footer"><p>WORLD → ACTION</p><h2>不是生成未来，<br />而是让未来改变行动。</h2><a href="#top">重新开始 ↑</a></footer> : null}</div></main></>;
}
