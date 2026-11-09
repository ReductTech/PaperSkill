import React, { useCallback, useEffect, useRef, useState } from 'react';
import { tutorial } from './data/tutorial';
import { PresentationCover } from './components/PresentationCover';
import { ScenePage } from './components/ScenePage';
import { SlideStage } from './components/SlideStage';
import { BiliVideos } from './components/BiliVideos';
import { buildDeck } from './lib/scenes';
import './styles/presentation.css';

const pages = buildDeck(tutorial);
const query = new URLSearchParams(location.search);
const initialIndex = Math.max(0, pages.findIndex(page => page.id === query.get('slide')));
export default function App() {
  const [active, setActive] = useState(initialIndex);
  const [directory, setDirectory] = useState(() => innerWidth > 768);
  const [compact, setCompact] = useState(() => innerWidth <= 768);
  const [notes, setNotes] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [notice, setNotice] = useState('');
  const viewport = useRef<HTMLElement>(null);
  const selected = useRef<HTMLButtonElement>(null);
  const page = pages[active];
  useEffect(() => { document.title = `${tutorial.meta.titleZh} · 交互式教程`; }, []);
  const goTo = useCallback((index: number) => {
    const next = Math.max(0, Math.min(pages.length - 1, index));
    setActive(next);
    const url = new URL(location.href);
    url.searchParams.set('slide', pages[next].id);
    history.replaceState(null, '', url);
    if (innerWidth <= 768) setDirectory(false);
  }, []);
  useEffect(() => { selected.current?.scrollIntoView({ block: 'nearest' }); }, [active, directory]);
  useEffect(() => {
    const media = matchMedia('(max-width: 768px)');
    const change = () => { setCompact(media.matches); setDirectory(!media.matches); };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const onFullscreen = () => setPresenting(Boolean(document.fullscreenElement));
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === 'Escape') { setDirectory(innerWidth > 768); setNotes(false); }
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
        target.closest('input, textarea, select, button, a, [contenteditable], [role=slider], [role=tab], [role=button], [data-slide-keys]')) return;
      if (['ArrowRight', 'ArrowDown', 'PageDown', 'ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
        event.preventDefault(); goTo(active + (['ArrowRight', 'ArrowDown', 'PageDown'].includes(event.key) ? 1 : -1));
      }
    };
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('fullscreenchange', onFullscreen); window.removeEventListener('keydown', onKey); };
  }, [active, goTo]);
  const content = page.special === 'cover' ? <PresentationCover meta={tutorial.meta} hero={tutorial.hero} /> :
    page.special === 'videos' ? <BiliVideos items={tutorial.bilibili || []} /> : <ScenePage page={page} />;
  if (query.get('capture') === '1') return <div className="ppt-capture" data-slide-canvas>{content}</div>;
  return <div className="ppt-app">
    <header className="ppt-toolbar">
      <div className="ppt-toolbar-group"><button aria-label="切换目录" aria-expanded={directory} onClick={() => setDirectory(!directory)}>☰</button>
        <span className="ppt-brand" title={tutorial.meta.titleZh}>{tutorial.meta.titleZh}</span></div>
      <nav className="ppt-pager" aria-label="幻灯片翻页">
        <button aria-label="上一页" disabled={active === 0} onClick={() => goTo(active - 1)}>‹</button>
        <span aria-live="polite"><b>{active + 1}</b><span> / {pages.length}</span></span>
        <button aria-label="下一页" disabled={active === pages.length - 1} onClick={() => goTo(active + 1)}>›</button>
      </nav>
      <div className="ppt-toolbar-group ppt-tools"><button aria-pressed={notes} onClick={() => setNotes(!notes)}>讲稿</button>
        <button className="ppt-present" onClick={async () => {
          try { await viewport.current?.requestFullscreen(); setNotice(''); }
          catch { setNotice('当前浏览器无法进入全屏，可继续在窗口中演示。'); }
        }}>放映</button></div>
    </header>
    <div className="ppt-workspace">
      {directory && <><button className="ppt-scrim" aria-label="关闭目录" onClick={() => setDirectory(false)} />
        <aside className="ppt-directory" aria-label="页面目录"><div className="ppt-directory-label">幻灯片 <span>{pages.length} 页</span></div>
          <nav>{pages.map((item, index) => <button key={item.id} ref={index === active ? selected : undefined}
            className={`ppt-thumb ${index === active ? 'is-active' : ''}`} aria-current={index === active ? 'page' : undefined}
            aria-label={`第 ${index + 1} 页：${item.title}`} onClick={() => goTo(index)}>
            <span className="ppt-thumb-preview">{item.thumbnail ? <img src={item.thumbnail} alt="" loading="lazy" /> :
              <span className="ppt-thumb-summary"><strong>{item.title}</strong><span>{item.summary}</span><i /></span>}
              <span className="ppt-thumb-number">{index + 1}</span></span>
            <span className="ppt-thumb-title">{item.title}</span>
          </button>)}</nav></aside></>}
      <main className={`ppt-stage-area ${presenting ? 'is-presenting' : ''}`} ref={viewport}>
        <SlideStage fitFactor={presenting || compact ? 1 : .88}><React.Fragment key={page.id}>{content}</React.Fragment></SlideStage>
        {presenting && <nav className="ppt-fullscreen-nav" aria-label="放映翻页">
          <button disabled={active === 0} aria-label="上一页" onClick={() => goTo(active - 1)}>‹</button><span>{active + 1} / {pages.length}</span>
          <button disabled={active === pages.length - 1} aria-label="下一页" onClick={() => goTo(active + 1)}>›</button>
          <button onClick={() => document.exitFullscreen()}>退出</button></nav>}
        {notice && <p className="ppt-notice" role="status">{notice}</p>}
      </main>
      {notes && <aside className="ppt-notes"><div className="ppt-directory-label">演讲者备注<button aria-label="关闭讲稿" onClick={() => setNotes(false)}>×</button></div>
        <h2>{page.title}</h2><p>{page.notes || page.summary}</p>{page.next && <p className="ppt-notes-next">接下来：{page.next}</p>}</aside>}
    </div>
  </div>;
}
