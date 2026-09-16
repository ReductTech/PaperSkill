import React, { useEffect, useState } from "react";

/**
 * PPT 模式叠加层：最左侧目录栏 + 底部上一章/下一章。
 *
 * 纯新增组件——不参与原有正文渲染，只把目录栏与底栏以固定浮层叠在页面上，
 * 并让正文让出对应空间（见 ppt-mode.css）。markup / class 与
 * paper-skill/assets/react-template 的 PPT 模式保持一致。
 */
export function PptBars({
  sections,
  active,
  onSelect,
  venue,
  title,
}: {
  sections: readonly (readonly [string, string])[];
  active: number;
  onSelect: (index: number) => void;
  venue: string;
  title: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const last = sections.length - 1;

  const go = (index: number) => {
    onSelect(Math.max(0, Math.min(last, index)));
    setDrawerOpen(false);
  };

  // 当前章按**滚动位置实测**：平滑滚动途中 active 还没跟上时，
  // 直接用它算「上一章/下一章」会点错章，所以翻页时现算一次。
  const currentIndex = () => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".story-screen"));
    if (nodes.length === 0) return active;
    const line = window.innerHeight * 0.35;
    let index = 0;
    nodes.forEach((node, i) => {
      if (node.getBoundingClientRect().top <= line) index = i;
    });
    return index;
  };

  // 一屏同时显示多屏时：要滚的那一屏可能已经贴在屏幕里，而页面其实已经到底、
  // 滚不动 —— 那样点「下一章」会毫无反应。这两个函数用来避免这种情况。
  const scrollRoom = () =>
    Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) -
    window.innerHeight -
    window.scrollY;

  // 下一屏该去哪：跳过"已经完整露在屏幕里"的屏，取第一个还没完整显示的；
  // 若后面的屏都已完整可见且滚不动，则返回当前屏（不动），避免假动作。
  const nextIndex = () => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".story-screen"));
    const viewport = window.innerHeight;
    for (let i = currentIndex() + 1; i < nodes.length; i += 1) {
      if (nodes[i].getBoundingClientRect().bottom > viewport - 8) return i;
    }
    return scrollRoom() > 8 ? Math.min(last, currentIndex() + 1) : currentIndex();
  };

  // 标记「PPT 模式已开启」/「目录已折叠」，供 CSS 决定正文让位宽度。
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("ppt-bars-on");
    return () => root.classList.remove("ppt-bars-on");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("ppt-sidebar-collapsed", collapsed);
  }, [collapsed]);

  return (
    <div
      className={`slide-layout ppt-overlay ${drawerOpen ? "sidebar-open" : ""} ${
        collapsed ? "sidebar-collapsed" : ""
      }`}
    >
      <button className="slide-sidebar-toggle" onClick={() => setDrawerOpen(!drawerOpen)}>
        <span className="slide-sidebar-toggle-icon">{drawerOpen ? "✕" : "☰"}</span>
        目录
      </button>

      {drawerOpen ? (
        <div className="slide-sidebar-overlay" onClick={() => setDrawerOpen(false)} />
      ) : null}

      <aside className="slide-sidebar">
        <div className="slide-sidebar-header">
          <div className="slide-sidebar-venue">{venue}</div>
          <div className="slide-sidebar-title">{title}</div>
        </div>
        <nav className="slide-sidebar-nav">
          {sections.map(([num, label], index) => (
            <button
              key={num}
              className={`slide-sidebar-item ${active === index ? "active" : ""}`}
              onClick={() => go(index)}
              aria-current={active === index ? "step" : undefined}
            >
              <span className="slide-sidebar-num">{num}</span>
              <span className="slide-sidebar-text">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <button
        className="slide-sidebar-collapse"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "展开目录" : "折叠目录"}
      >
        {collapsed ? "☰" : "◀"}
      </button>

      <div className="slide-nav">
        <button className="slide-nav-btn" onClick={() => go(currentIndex() - 1)} disabled={active === 0}>
          ← 上一章
        </button>
        <span className="slide-nav-counter">
          {active + 1} / {sections.length}
        </span>
        <button
          className="slide-nav-btn slide-nav-btn-primary"
          onClick={() => go(nextIndex())}
          disabled={active === last}
        >
          下一章 →
        </button>
      </div>
    </div>
  );
}
