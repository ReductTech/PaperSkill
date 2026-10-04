import { useCallback, useEffect, useState } from 'react';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { ChapterBridge } from './components/ChapterBridge';
import { AnalogyCard } from './components/AnalogyCard';
import { Module } from './components/Module';
import { Formula } from './components/Formula';
import { InsightBar } from './components/InsightBar';
import { Takeaway } from './components/Takeaway';
import { BiliVideos } from './components/BiliVideos';

export default function App() {
  const chapters = tutorial.chapters;
  const bili = tutorial.bilibili || [];
  const items = [
    { id: 'cover', num: '序', title: '让语言连接视觉' },
    ...chapters.map((ch, i) => ({ id: ch.id, num: String(i + 1).padStart(2, '0'), title: ch.title })),
    ...(bili.length ? [{ id: 'videos', num: '延伸', title: '视频讲解' }] : []),
  ];
  const [active, setActive] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const goTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    history.replaceState(null, '', `#${id}`);
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
    setSidebarOpen(false);
  }, []);
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-reading-section]'));
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const marker = Math.min(window.innerHeight * .25, 200);
      let current = 0;
      sections.forEach((el, i) => { if (el.getBoundingClientRect().top <= marker) current = i; });
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) current = sections.length - 1;
      setActive(current);
    };
    const onScroll = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
    update();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);
  const continueButton = (index: number) => <div className="chapter-continue">
    <button type="button" className="slide-nav-btn slide-nav-btn-primary" onClick={() => goTo(items[index + 1]?.id || 'cover')}>
      {index === 0 ? '开始学习第一章' : index < chapters.length ? '继续学习下一章' : bili.length ? '继续观看延伸视频' : '返回封面'} <span aria-hidden="true">→</span>
    </button>
  </div>;
  return <div className={`slide-layout reading-layout ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <button type="button" className="slide-sidebar-toggle" aria-expanded={sidebarOpen} aria-controls="reading-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>☰ 目录</button>
    {sidebarOpen && <div className="slide-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
    <aside className="slide-sidebar" id="reading-sidebar">
      <div className="slide-sidebar-header"><div className="reading-brand">VISUAL CHATGPT</div><div className="slide-sidebar-title">让语言连接视觉</div></div>
      <nav className="slide-sidebar-nav" aria-label="章节目录">{items.map((item, i) => <button type="button" key={item.id} className={`slide-sidebar-item ${active === i ? 'active' : ''}`} aria-current={active === i ? 'location' : undefined} onClick={() => goTo(item.id)}><span className="slide-sidebar-num">{item.num}</span><span className="slide-sidebar-text">{item.title}</span></button>)}</nav>
      <div className="reading-sidebar-note">可上下滚动阅读全文<br />也可通过目录直接跳转</div>
    </aside>
    <button type="button" className="slide-sidebar-collapse" aria-label={sidebarCollapsed ? '展开目录' : '折叠目录'} aria-expanded={!sidebarCollapsed} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>{sidebarCollapsed ? '☰' : '◀'}</button>
    <main className="slide-main"><div className="slide-content reading-content">
      <div id="cover" data-reading-section tabIndex={-1} className="reading-section"><Hero meta={tutorial.meta} hero={tutorial.hero} />{continueButton(0)}</div>
      {chapters.map((ch, i) => <section key={ch.id} id={ch.id} data-reading-section tabIndex={-1} className="chap slide-chap reading-section">
        <h2 className="chap-title"><span className="num">{String(i + 1).padStart(2, '0')}.</span>{ch.title}<span className={`badge-tag ${ch.badge}`}>{ch.badgeLabel}</span></h2>
        <ChapterBridge text={ch.bridge} />
        <AnalogyCard analogy={ch.analogy} chapterId={ch.id} />
        {ch.modules.map(m => <Module key={m.id} module={m} chapterId={ch.id} />)}
        {ch.insight && <InsightBar text={ch.insight} />}
        {ch.formula && <Formula formula={ch.formula} />}
        <Takeaway items={ch.takeaways} />{continueButton(i + 1)}
      </section>)}
      {bili.length > 0 && <div id="videos" data-reading-section tabIndex={-1} className="reading-section"><BiliVideos items={bili} /><div className="chapter-continue"><button type="button" className="slide-nav-btn" onClick={() => goTo('cover')}>返回封面 ↑</button></div></div>}
    </div></main>
  </div>;
}
