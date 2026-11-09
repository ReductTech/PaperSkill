import { useEffect, useRef, useState } from "react";

/** The slide-* markup follows InSpatio-World's PptBars at a94f608. */
export function PptBars({
  chapters,
  revealed,
  visible,
  venue,
  title,
  onNavigate,
}: {
  chapters: readonly { id: string; title: string }[];
  revealed: number;
  visible: boolean;
  venue: string;
  title: string;
  onNavigate: (chapter: number) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState(0);
  const [mobile, setMobile] = useState(() => matchMedia("(max-width: 768px)").matches);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const total = chapters.length;

  // The reference uses a marker 30% down the viewport to identify the chapter.
  const currentIndex = () => {
    const line = window.innerHeight * 0.3;
    let index = 0;
    chapters.forEach((chapter, i) => {
      const node = document.getElementById(chapter.id);
      if (node && node.getBoundingClientRect().top <= line) index = i;
    });
    return index;
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("ppt-bars-on", visible);
    return () => root.classList.remove("ppt-bars-on");
  }, [visible]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("ppt-sidebar-collapsed", collapsed);
    return () => root.classList.remove("ppt-sidebar-collapsed");
  }, [collapsed]);
  useEffect(() => {
    const query = matchMedia("(max-width: 768px)");
    const update = () => setMobile(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setActive(currentIndex());
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [revealed, chapters]);
  useEffect(() => {
    if (!drawerOpen || !mobile) return;
    sidebarRef.current?.querySelector<HTMLElement>(".slide-sidebar-item:not(:disabled)")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        toggleRef.current?.focus();
      } else if (event.key === "Tab") {
        const items = Array.from(sidebarRef.current?.querySelectorAll<HTMLButtonElement>(".slide-sidebar-item:not(:disabled)") ?? []);
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, mobile]);
  const closeDrawer = () => {
    setDrawerOpen(false);
    toggleRef.current?.focus();
  };
  const go = (index: number) => {
    if (index < 0 || index >= revealed) return;
    setDrawerOpen(false);
    onNavigate(index + 1);
  };
  const prev = () => go(currentIndex() - 1);
  const next = () => go(currentIndex() + 1);
  const sidebarHidden = !visible || collapsed && !mobile || mobile && !drawerOpen;

  return (
    <div className={`slide-layout ppt-overlay ${drawerOpen ? "sidebar-open" : ""} ${collapsed ? "sidebar-collapsed" : ""} ${visible ? "" : "ppt-hidden"}`}>
      <button ref={toggleRef} className="slide-sidebar-toggle" onClick={() => drawerOpen ? closeDrawer() : setDrawerOpen(true)} aria-expanded={drawerOpen} aria-controls="paper-chapter-sidebar">
        <span className="slide-sidebar-toggle-icon">{drawerOpen ? "✕" : "☰"}</span>
        目录
      </button>
      {drawerOpen && <div className="slide-sidebar-overlay" onClick={closeDrawer} aria-hidden="true" />}
      <aside ref={sidebarRef} id="paper-chapter-sidebar" className="slide-sidebar" aria-label="章节目录" aria-hidden={sidebarHidden} inert={sidebarHidden}>
        <div className="slide-sidebar-header">
          <div className="slide-sidebar-venue">{venue}</div>
          <div className="slide-sidebar-title">{title}</div>
        </div>
        <nav className="slide-sidebar-nav" aria-label="章节">
          {chapters.map((chapter, index) => (
            <button key={chapter.id} className={`slide-sidebar-item ${active === index ? "active" : ""} ${index < revealed ? "" : "is-locked"}`} onClick={() => go(index)} disabled={index >= revealed} aria-current={active === index ? "step" : undefined}>
              <span className="slide-sidebar-num">§{index + 1}</span>
              <span className="slide-sidebar-text">{chapter.title}</span>
            </button>
          ))}
        </nav>
      </aside>
      <button className="slide-sidebar-collapse" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "展开目录" : "折叠目录"} aria-label={collapsed ? "展开目录" : "折叠目录"} aria-expanded={!collapsed}>
        {collapsed ? "☰" : "◀"}
      </button>
      <div className="slide-nav" aria-label="章节翻页">
        <button className="slide-nav-btn" onClick={prev} disabled={active === 0}>← 上一章</button>
        <span className="slide-nav-counter">{active + 1} / {total}</span>
        <button className="slide-nav-btn slide-nav-btn-primary" onClick={next} disabled={active + 1 >= revealed || active + 1 >= total}>下一章 →</button>
      </div>
    </div>
  );
}
