import React, { useEffect, useState } from "react";

/**
 * PPT 模式叠加层：最左侧目录栏 + 底部上一章/下一章。
 *
 * 纯新增组件——不参与正文渲染，只把目录栏与底栏以固定浮层叠在页面上，
 * 正文让位由 ppt-mode.css 负责。markup / class 与 paper-skill 的 PPT 模式一致。
 *
 * 本篇是「按 Part 揭示」结构（不是按 chapter）：`tutorial.parts` 共 7 节，
 * 揭示状态由父组件的 `revealedPart` 持有，所以：
 * - 目录列的是 parts（7 项），不是全部 chapters；
 * - 点击目录项 / 上下一章一律调用 `onSelect(index)`，由父组件决定
 *   「已经揭示过 → 滚过去」还是「还没揭示 → 揭示到这一节」（父组件有 setter，可直接跳）；
 * - 「当前节」一律按**滚动位置实测**（视口上方 30% 参考线），不读 state、
 *   也不用 IntersectionObserver 的可见比例——长章节的可见比例永远到不了阈值，
 *   会让高亮与翻页跟真实位置对不上。
 */
export function PptBars({
  sections,
  active,
  onSelect,
  visible,
  venue,
  title,
}: {
  sections: readonly { id: string; label: string; text: string }[];
  /** 已揭示到的节下标（-1 = 还没开始） */
  active: number;
  onSelect: (index: number) => void;
  visible: boolean;
  venue: string;
  title: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [current, setCurrent] = useState(0);
  const total = sections.length;
  const last = total - 1;
  const revealed = active + 1; // 已揭示的节数

  // 节节点一律按 sections[i].id 取，不依赖对方的 class 命名
  const sectionNodes = () =>
    sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));

  // 视口上方 30% 处作参考线，取最后一个顶部越过该线的节
  const currentIndex = () => {
    const nodes = sectionNodes();
    if (nodes.length === 0) return 0;
    const line = window.innerHeight * 0.3;
    let index = 0;
    nodes.forEach((node, i) => {
      if (node.getBoundingClientRect().top <= line) index = i;
    });
    return index;
  };

  // 标记「PPT 模式已开启」/「目录已折叠」，供 CSS 决定正文让位宽度。
  // 用 visible 驱动：还没开始时整组导航隐藏，且不占正文空间。
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("ppt-bars-on", visible);
    return () => root.classList.remove("ppt-bars-on");
  }, [visible]);

  useEffect(() => {
    document.documentElement.classList.toggle("ppt-sidebar-collapsed", collapsed);
  }, [collapsed]);

  // 高亮跟随滚动（rAF 节流，实测滚动位置）
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setCurrent(currentIndex());
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
    // 节是逐步挂载的，每揭示一节重新绑定并重算一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const go = (index: number) => {
    setDrawerOpen(false);
    if (index < 0 || index > last) return;
    onSelect(index);
  };

  // 翻页时现算当前节（不用 state，避免平滑滚动途中 state 还没跟上而点错）
  const prev = () => go(currentIndex() - 1);
  const next = () => go(currentIndex() + 1);
  const shown = Math.min(Math.max(current, 0), last) + 1;

  return (
    <div
      className={`slide-layout ppt-overlay ${drawerOpen ? "sidebar-open" : ""} ${
        collapsed ? "sidebar-collapsed" : ""
      } ${visible ? "" : "ppt-hidden"}`}
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
          {sections.map((section, index) => {
            const isActive = current === index;
            const locked = index >= revealed;
            return (
              <button
                key={section.id}
                className={`slide-sidebar-item ${isActive ? "active" : ""} ${locked ? "is-locked" : ""}`}
                onClick={() => go(index)}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="slide-sidebar-num">{section.label}</span>
                <span className="slide-sidebar-text">{section.text}</span>
              </button>
            );
          })}
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
        <button className="slide-nav-btn" onClick={prev} disabled={current <= 0}>
          ← 上一章
        </button>
        <span className="slide-nav-counter">
          {shown} / {total}
        </span>
        <button
          className="slide-nav-btn slide-nav-btn-primary"
          onClick={next}
          disabled={current >= last}
        >
          下一章 →
        </button>
      </div>
    </div>
  );
}
