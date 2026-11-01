import { useEffect, useRef, useState } from 'react';
import { chapters } from '../content';
import type { TutorialProgress } from '../tutorialProgress';

type Props = {
  progress: TutorialProgress;
  onNavigate: (index: number) => void;
};

// DOM and slide-* classes follow the locked InSpatio-World PptBars component.
// Chapter position and reveal state come from the shared v2 progress protocol.
export function PptBars({ progress, onNavigate }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 768px)').matches);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const visible = progress.unlocked > 0;
  const active = chapters.findIndex(chapter => chapter.id === progress.activeId);
  const displayIndex = Math.max(0, active);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('ppt-bars-on', visible);
    return () => root.classList.remove('ppt-bars-on');
  }, [visible]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('ppt-sidebar-collapsed', collapsed);
    return () => root.classList.remove('ppt-sidebar-collapsed');
  }, [collapsed]);
  useEffect(() => {
    const query = matchMedia('(max-width: 768px)');
    const update = () => setMobile(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!drawerOpen || !mobile || !visible) return;
    sidebarRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawerOpen(false);
        menuRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const buttons = Array.from(sidebarRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
      if (!buttons.length) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || !sidebarRef.current?.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sidebarRef.current?.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [drawerOpen, mobile, visible]);

  const closeDrawer = () => { setDrawerOpen(false); menuRef.current?.focus(); };
  const go = (index: number) => {
    if (index < 0 || index >= chapters.length) return;
    if (drawerOpen) closeDrawer();
    onNavigate(index);
  };

  return <div className={`slide-layout ppt-overlay ${drawerOpen ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''} ${visible ? '' : 'ppt-hidden'}`}>
    <button ref={menuRef} className="slide-sidebar-toggle" onClick={() => drawerOpen ? closeDrawer() : setDrawerOpen(true)} aria-label={drawerOpen ? '关闭章节目录' : '打开章节目录'} aria-expanded={drawerOpen} aria-controls="chapter-sidebar">
      <span className="slide-sidebar-toggle-icon" aria-hidden="true">{drawerOpen ? '✕' : '☰'}</span>目录
    </button>
    {drawerOpen && <div className="slide-sidebar-overlay" onClick={closeDrawer} aria-hidden="true"/>}
    <aside ref={sidebarRef} id="chapter-sidebar" className="slide-sidebar" aria-label="章节目录" aria-hidden={mobile && !drawerOpen || !mobile && collapsed} inert={mobile && !drawerOpen || !mobile && collapsed}>
      <div className="slide-sidebar-header"><div className="slide-sidebar-venue">Interactive Tutorial</div><div className="slide-sidebar-title">Act2See: Emergent Active Visual Perception for Video Reasoning</div></div>
      <nav className="slide-sidebar-nav" aria-label="九章导航">
        {chapters.map((chapter, index) => <button key={chapter.id} className={`slide-sidebar-item ${active === index ? 'active' : ''} ${index < progress.unlocked ? '' : 'is-locked'}`} onClick={() => go(index)} aria-current={active === index ? 'step' : undefined} aria-label={`第 ${index + 1} 章：${chapter.title}${index < progress.unlocked ? '' : '，点击后解锁'}`}>
          <span className="slide-sidebar-num">§{index + 1}</span><span className="slide-sidebar-text">{chapter.title}</span>
        </button>)}
      </nav>
    </aside>
    <button className="slide-sidebar-collapse" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? '展开章节目录' : '折叠章节目录'} aria-expanded={!collapsed} aria-controls="chapter-sidebar">{collapsed ? '☰' : '◀'}</button>
    <div className="slide-nav" aria-label="章节翻页">
      <button className="slide-nav-btn" onClick={() => go(displayIndex - 1)} disabled={active <= 0} aria-label="上一章">← 上一章</button>
      <span className="slide-nav-counter" aria-label={`第 ${displayIndex + 1} 章，共 ${chapters.length} 章`}>{displayIndex + 1} / {chapters.length}</span>
      <button className="slide-nav-btn slide-nav-btn-primary" onClick={() => go(displayIndex + 1)} disabled={displayIndex >= chapters.length - 1} aria-label="下一章">下一章 →</button>
    </div>
  </div>;
}
