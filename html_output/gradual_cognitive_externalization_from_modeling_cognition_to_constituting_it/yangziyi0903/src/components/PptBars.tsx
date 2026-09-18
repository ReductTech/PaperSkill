import React, { useEffect, useRef, useState } from "react";

/**
 * PPT 模式叠加层：最左侧目录栏 + 底部上一章/下一章。
 *
 * 纯新增组件——不参与原有正文渲染，只把目录栏与底栏以固定浮层叠在页面上，
 * 并让正文让出对应空间（见 ppt-mode.css）。markup / class 与
 * paper-skill/assets/react-template 的 PPT 模式保持一致。
 *
 * 适配「渐进揭示」型论文（useProgressiveChapters）：
 * - 已揭示的章节：点了直接滚过去；
 * - 还没揭示的章节：逐章揭示到目标章（模板本身只支持一章一章地出现）。
 *
 * 「当前章」一律按**滚动位置实测**（取视口上方参考线所在的那一章），
 * 不用 IntersectionObserver 的可见比例：这套模板的章节常常高过一整屏，
 * 可见比例永远到不了阈值，高亮与翻页因此会和真实章节对不上。
 *
 * 「下一章」严格推进一章（当前章 + 1）：已揭示就把它对准到视口顶部，未揭示就揭示它；
 * 判定"能不能再前进"只用两个与视口高度无关的判据（顶部是否贴顶、页面还能否下滚），
 * 因为手机竖屏（固定 width=1600 缩放）下布局视口高度被放大到 3000+px，
 * 用「章节是否完整显示」判断会失效（会跳过整章，或按钮空转）。
 */
export function PptBars({
  chapters,
  revealed,
  onRevealNext,
  visible,
  venue,
  title,
}: {
  chapters: readonly { id: string; title: string }[];
  revealed: number;
  onRevealNext: () => void;
  visible: boolean;
  venue: string;
  title: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState(0);
  const [canNext, setCanNext] = useState(false);
  const total = chapters.length;
  const last = total - 1;

  // 章节节点一律按 chapters[i].id 取，**不要写死 `main section.chap`**。
  // 本篇的章节由 SceneShell 渲染成 <section class="chapter-scene" id="chap-N">，
  // 用 .chap 选择器会取到 0 个节点 → 「当前章」恒为 0（计数停在 1/N、上一章永远
  // 不动）、下一章也只会一直揭示而不滚动，看起来就是「按钮不好使」。
  const chapterNodes = () =>
    chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((node): node is HTMLElement => Boolean(node));

  // 视口上方 30% 处作为「当前章」参考线，取最后一个顶部越过该线的章节。
  const currentIndex = () => {
    const nodes = chapterNodes();
    if (nodes.length === 0) return 0;
    const line = window.innerHeight * 0.3;
    let index = 0;
    nodes.forEach((node, i) => {
      if (node.getBoundingClientRect().top <= line) index = i;
    });
    return index;
  };

  // 页面还能往下滚多少 px。
  // 一屏同时显示多章时，"下一章"要滚过去的那一章可能已经贴在屏幕里了 ——
  // 此时页面其实已经到底、滚不动，按钮就会像失灵一样毫无反应。
  const scrollRoom = () =>
    Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) -
    window.innerHeight -
    window.scrollY;

  // 是否还有「下一章」可去 —— 决定按钮是否置灰，避免"点了没反应"。
  // ⚠️ 不能用「该章是否完整显示在视口里」判断：手机端用固定 width=1600 的 viewport
  // 整体缩放，布局视口高度被放大到 3000+px，几乎所有章节都算「完整显示」，
  // 判据失效 → 会一次跳过整章，或按钮干脆空转。
  // 改用两个与视口高度无关的判据：① 目标章顶部还没贴到视口顶部；② 页面还能下滚。
  const canGoNext = () => {
    const index = currentIndex();
    const target = index + 1;
    if (target > last) return false;
    if (target >= revealed) return true;
    const node = chapterNodes()[target];
    if (node && node.getBoundingClientRect().top > 8 && scrollRoom() > 8) return true;
    return revealed < total;
  };

  // 点「下一章」触发揭示后，等新章节挂载完把它滚到视口顶部。
  // 否则新章节只是被追加在屏幕下方，用户会觉得"点了没反应"。
  const followRef = useRef<number | null>(null);

  // 标记「PPT 模式已开启」/「目录已折叠」 —— CSS 依据它们决定正文让位宽度。
  // 注意：用 visible 驱动，未开始时（只有封面）不占用正文空间。
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("ppt-bars-on", visible);
    return () => root.classList.remove("ppt-bars-on");
  }, [visible]);

  useEffect(() => {
    document.documentElement.classList.toggle("ppt-sidebar-collapsed", collapsed);
  }, [collapsed]);

  // 高亮跟随滚动（rAF 节流，实测滚动位置，避免长章节判定不出来）
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setActive(currentIndex());
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
    // 章节是逐步挂载的，每揭示一章重新绑定并重算一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  const scrollToChapter = (index: number) => {
    const chapter = chapters[index];
    if (!chapter) return;
    document.getElementById(chapter.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 揭示新章节后跟随滚动（等 DOM 挂载完再滚，章节是逐步挂载的）
  useEffect(() => {
    if (followRef.current === null) return undefined;
    const target = followRef.current;
    followRef.current = null;
    const raf = requestAnimationFrame(() => scrollToChapter(target));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  const go = (index: number) => {
    setDrawerOpen(false);
    if (index < 0 || index > last) return;
    if (index < revealed) {
      scrollToChapter(index);
      return;
    }
    followRef.current = index;
    for (let i = revealed; i <= index; i += 1) onRevealNext();
  };

  // 翻页时现算当前章（不用 state，避免平滑滚动途中 state 还没跟上而点错章）
  const next = () => {
    const target = currentIndex() + 1;
    // 目标章已揭示：只要它还没贴到视口顶部、且页面还能下滚，就把它对准到视口顶部。
    // 严格推进一章，不再"跳过若干章" —— 竖屏下标尺被放大，跳过会一次跳好几章。
    if (target <= last && target < revealed) {
      const node = chapterNodes()[target];
      if (node && node.getBoundingClientRect().top > 8 && scrollRoom() > 8) {
        scrollToChapter(target);
        return;
      }
    }
    // 目标章未揭示（或已经无处可滚）→ 揭示下一章，并把它滚到视口顶部
    if (revealed < total) {
      followRef.current = revealed;
      onRevealNext();
    }
  };

  const prev = () => {
    const index = currentIndex();
    if (index > 0) scrollToChapter(index - 1);
  };

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
          {chapters.map((chapter, index) => (
            <button
              key={chapter.id}
              className={`slide-sidebar-item ${active === index ? "active" : ""} ${
                index < revealed ? "" : "is-locked"
              }`}
              onClick={() => go(index)}
              aria-current={active === index ? "step" : undefined}
            >
              <span className="slide-sidebar-num">§{index + 1}</span>
              <span className="slide-sidebar-text">{chapter.title}</span>
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
        <button className="slide-nav-btn" onClick={prev} disabled={active === 0}>
          ← 上一章
        </button>
        <span className="slide-nav-counter">
          {active + 1} / {total}
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
