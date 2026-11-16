import { useEffect, useRef, useState } from 'react';
import type { Chapter } from '../content';

type Props = {
  chapters: readonly Chapter[];
  revealed: number;
  onNavigate: (index: number) => void;
  visible: boolean;
};

// Structure and slide-* classes follow the locked InSpatio-World PptBars.
export function PptBars({ chapters, revealed, onNavigate, visible }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
  const [active, setActive] = useState(0);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const total = chapters.length;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => setMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('ppt-bars-on', visible);
    return () => document.documentElement.classList.remove('ppt-bars-on');
  }, [visible]);
  useEffect(() => {
    document.documentElement.classList.toggle('ppt-sidebar-collapsed', collapsed);
    return () => document.documentElement.classList.remove('ppt-sidebar-collapsed');
  }, [collapsed]);
  useEffect(() => {
    if (!mobile || !drawerOpen) return;
    sidebarRef.current?.querySelector<HTMLButtonElement>('.slide-sidebar-item')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawerOpen(false);
        menuRef.current?.focus();
      }
      if (event.key !== 'Tab') return;
      const focusables = [menuRef.current, ...Array.from(sidebarRef.current?.querySelectorAll<HTMLButtonElement>('.slide-sidebar-item') ?? [])].filter((item): item is HTMLButtonElement => !!item);
      const index = focusables.indexOf(document.activeElement as HTMLButtonElement);
      if (event.shiftKey && index <= 0) {
        event.preventDefault();
        focusables.at(-1)?.focus();
      } else if (!event.shiftKey && index === focusables.length - 1) {
        event.preventDefault();
        focusables[0]?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [mobile, drawerOpen]);
  useEffect(() => {
    if (!visible) setDrawerOpen(false);
  }, [visible]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('main section.chap'));
      const line = window.innerHeight * 0.3;
      let index = 0;
      nodes.forEach((node, position) => {
        if (node.getBoundingClientRect().top <= line) index = position;
      });
      setActive(index);
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [revealed]);

  function closeDrawer() {
    setDrawerOpen(false);
    menuRef.current?.focus();
  }
  function go(index: number) {
    if (index < 0 || index >= revealed) return;
    setDrawerOpen(false);
    onNavigate(index);
    // The chapter heading receives focus after the requested scroll in App.
  }

  return <div className={`slide-layout ppt-overlay ${drawerOpen ? 'sidebar-open' : ''} ${collapsed ? 'sidebar-collapsed' : ''} ${visible ? '' : 'ppt-hidden'}`}>
    <button ref={menuRef} className="slide-sidebar-toggle" onClick={() => drawerOpen ? closeDrawer() : setDrawerOpen(true)} aria-expanded={drawerOpen} aria-controls="slide-sidebar" aria-label={drawerOpen ? '关闭目录' : '打开目录'}>
      <span className="slide-sidebar-toggle-icon">{drawerOpen ? '✕' : '☰'}</span>目录
    </button>
    {drawerOpen && <div className="slide-sidebar-overlay" onClick={closeDrawer} aria-hidden="true" />}
    <aside ref={sidebarRef} id="slide-sidebar" className="slide-sidebar" inert={mobile ? !drawerOpen : collapsed}>
      <div className="slide-sidebar-header"><div className="slide-sidebar-venue">Interactive Tutorial</div><div className="slide-sidebar-title">Active Video Perception · 交互式教程</div></div>
      <nav className="slide-sidebar-nav" aria-label="章节目录">
        {chapters.map((chapter, index) => <button key={chapter.id} className={`slide-sidebar-item ${active === index ? 'active' : ''} ${index < revealed ? '' : 'is-locked'}`} onClick={() => go(index)} disabled={index >= revealed} aria-current={active === index ? 'step' : undefined} aria-label={`§${index + 1} ${chapter.title}${index < revealed ? '' : '，尚未揭示'}`}>
          <span className="slide-sidebar-num">§{index + 1}</span><span className="slide-sidebar-text">{chapter.title}</span>
        </button>)}
      </nav>
    </aside>
    <button className="slide-sidebar-collapse" onClick={() => setCollapsed(value => !value)} title={collapsed ? '展开目录' : '折叠目录'} aria-label={collapsed ? '展开目录' : '折叠目录'} aria-expanded={!collapsed} aria-controls="slide-sidebar">{collapsed ? '☰' : '◀'}</button>
    <div className="slide-nav" aria-label="章节导航">
      <button className="slide-nav-btn" onClick={() => go(active - 1)} disabled={active === 0}>← 上一章</button>
      <span className="slide-nav-counter">{active + 1} / {total}</span>
      <button className="slide-nav-btn slide-nav-btn-primary" onClick={() => go(active + 1)} disabled={active >= total - 1 || active + 1 >= revealed}>下一章 →</button>
    </div>
  </div>;
}
