import React, { useEffect, useRef, useState } from "react";

/**
 * PPT 模式叠加层：最左侧目录栏 + 底部上一章/下一章。
 *
 * 纯新增组件——不参与正文渲染，只把目录栏与底栏以固定浮层叠在页面上，
 * 正文让位由 ppt-mode.css 负责。markup / class 与 paper-skill 的 PPT 模式一致。
 *
 * 本篇（ELF）的正文是**预渲染 HTML + 原生 JS 引擎**（lib/elf-engine.js）：
 * 章节的渐进解锁由引擎负责 —— 它给所有 `section.chap` 加 `.chap-hidden`，
 * 并在每章末尾插入一个 `.chap-loader`（含 `.chap-loader-btn`），
 * 点按钮才展开下一章。所以这里**不改也不持有任何揭示状态**，只做三件事：
 *
 * 1. 章节列表由 props 传入（= `ELF_CHAPTERS` 的 id/title，与 DOM 顺序一致）；
 * 2. 「是否已开始 / 已展开到第几章」靠读 DOM 的 `.chap-hidden`，并用
 *    MutationObserver 跟随引擎的每次展开（引擎也会重新插入/移除 loader）；
 * 3. 「下一章」= 点一下当前**唯一可见**的 `.chap-loader .chap-loader-btn`
 *    —— 那正是引擎自己的解锁按钮，点它会展开下一章并滚过去，视觉与交互 100% 不变。
 *
 * 「当前章」一律按滚动位置实测（视口上方 30% 参考线），不用可见比例。
 */

const CHAPTER_HIDDEN = "chap-hidden";

/** "§1 噪声：扩散的起点" → { label: "§1", text: "噪声：扩散的起点" } */
function splitTitle(raw: string): { label: string; text: string } {
  const matched = raw.match(/^(§\d+)\s*(.*)$/);
  return matched ? { label: matched[1], text: matched[2] || raw } : { label: "", text: raw };
}

export function PptBars({
  chapters,
  venue,
  title,
}: {
  chapters: readonly { id: string; title: string }[];
  venue: string;
  title: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [canNext, setCanNext] = useState(false);
  const revealedRef = useRef(0);
  const total = chapters.length;
  const last = total - 1;

  // 章节点一律按 chapters[i].id 取，不依赖对方的 class 命名
  const chapterNodes = () =>
    chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((node): node is HTMLElement => Boolean(node));

  // 已展开的章节数（引擎按顺序展开，所以从第 1 章起连续计数）
  const countRevealed = () => {
    let count = 0;
    for (const node of chapterNodes()) {
      if (node.classList.contains(CHAPTER_HIDDEN)) break;
      count += 1;
    }
    return count;
  };

  // 视口上方 30% 处作参考线，只在「已展开的章节」里取最后一个顶部越过该线的
  const currentIndex = () => {
    const list = chapterNodes().slice(0, Math.max(revealedRef.current, 1));
    if (list.length === 0) return 0;
    const line = window.innerHeight * 0.3;
    let index = 0;
    list.forEach((node, i) => {
      if (node.getBoundingClientRect().top <= line) index = i;
    });
    return index;
  };

  // 页面还能往下滚多少 px（判"能不能再前进"用，与视口高度无关）
  const scrollRoom = () =>
    Math.max(
      0,
      Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) -
        window.innerHeight -
        window.scrollY,
    );

  // 是否还有「下一章」可去 —— 决定按钮是否置灰，避免"点了没反应"。
  // ⚠️ 不能用「该章是否完整显示在视口里」判断：手机端固定 width=1600 整体缩放后，
  // 布局视口高度被放大到 3000+px，几乎所有章节都算「完整显示」，判据失效。
  const canGoNext = () => {
    const target = currentIndex() + 1;
    if (target > last) return false;
    if (target >= revealedRef.current) return true;
    const node = chapterNodes()[target];
    if (node && node.getBoundingClientRect().top > 8 && scrollRoom() > 8) return true;
    return revealedRef.current < total;
  };

  const sync = () => {
    const count = countRevealed();
    revealedRef.current = count;
    setRevealed(count);
    setCurrent(currentIndex());
    setCanNext(canGoNext());
  };

  // 当前唯一可见的解锁按钮（未开始时是引擎塞进 hero 的「开始学习 §1」）
  const visibleLoaderButton = () =>
    document.querySelector<HTMLElement>(".chap-loader:not(.chap-hidden) .chap-loader-btn");

  // 标记「PPT 模式已开启」：还没开始学习时整组导航隐藏，且不占正文空间
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("ppt-bars-on", revealed > 0);
    return () => root.classList.remove("ppt-bars-on");
  }, [revealed]);

  useEffect(() => {
    document.documentElement.classList.toggle("ppt-sidebar-collapsed", collapsed);
  }, [collapsed]);

  // 高亮跟随滚动（rAF 节流，实测滚动位置）
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setCurrent(currentIndex());
      setCanNext(canGoNext());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 跟随原生引擎的展开状态：
  // 引擎在挂载后的 effect 里才跑（子组件 effect 先于父组件），所以这里既做首帧扫描，
  // 也用 MutationObserver 监听 `.chap-hidden` 开关与 loader 的增删。
  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sync();
      });
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
    });
    const initial = requestAnimationFrame(sync);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
      cancelAnimationFrame(initial);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 点一下引擎自己的解锁按钮（点完立刻同步，避免连点错位）
  const unlockNext = () => {
    const button = visibleLoaderButton();
    if (!button) return false;
    button.click();
    sync();
    return true;
  };

  const go = (index: number) => {
    setDrawerOpen(false);
    if (index < 0 || index > last) return;
    let guard = 0;
    while (index >= revealedRef.current && guard <= total) {
      if (!unlockNext()) break;
      guard += 1;
    }
    const target = chapters[index];
    if (!target) return;
    requestAnimationFrame(() => {
      document.getElementById(target.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // 翻页时现算当前章（不用 state，避免平滑滚动途中 state 还没跟上而点错）
  const prev = () => go(currentIndex() - 1);
  const next = () => {
    const index = currentIndex();
    const target = index + 1;
    if (target > last) return;

    // 下一章还没展开 → 走引擎自己的解锁按钮（一定产生可见变化）
    if (target >= revealedRef.current) {
      go(target);
      return;
    }

    // 已展开：只有「还没贴到视口顶部」且「页面还能下滚」时才滚动 ——
    // 否则就是一次没有位移的空动作（竖屏下标尺被放大，整章常常都在视口里）。
    const node = chapterNodes()[target];
    if (node && node.getBoundingClientRect().top > 8 && scrollRoom() > 8) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // 已贴顶或已到底 → 看后面还有没有未展开的章，直接解锁到它
    for (let i = target + 1; i <= last; i += 1) {
      if (i >= revealedRef.current) {
        go(i);
        return;
      }
    }
  };

  const shown = Math.min(Math.max(current, 0), last) + 1;

  return (
    <div
      className={`slide-layout ppt-overlay ${drawerOpen ? "sidebar-open" : ""} ${
        collapsed ? "sidebar-collapsed" : ""
      } ${revealed > 0 ? "" : "ppt-hidden"}`}
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
          {chapters.map((chapter, index) => {
            const { label, text } = splitTitle(chapter.title);
            const isActive = current === index;
            const locked = index >= revealed;
            return (
              <button
                key={chapter.id}
                className={`slide-sidebar-item ${isActive ? "active" : ""} ${locked ? "is-locked" : ""}`}
                onClick={() => go(index)}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="slide-sidebar-num">{label}</span>
                <span className="slide-sidebar-text">{text}</span>
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
          disabled={!canNext}
        >
          下一章 →
        </button>
      </div>
    </div>
  );
}
