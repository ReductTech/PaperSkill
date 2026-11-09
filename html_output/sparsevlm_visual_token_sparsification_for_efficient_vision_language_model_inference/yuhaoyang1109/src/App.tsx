import React, { useEffect, useRef, useState } from 'react';
import { tutorial } from './data/tutorial';
import { CHAPTERS } from './sv/content';
import { ChapterView } from './sv/Chapter';
import { Closing, Hero } from './sv/Parts';
import { Videos } from './sv/Videos';
import { useReducedMotion } from './modules/sv-kit';

// 长滚动版（外壳取自 VTW v7.3 / DivPrune v9.5）：左侧固定章节栏，主区一列卡片；
// 章节按“开始学习 / 继续下一章”逐章展开，侧栏或章内进度条可直接跳到任一章（会展开到该章为止）。
// 窗口不足 1280px 时章节栏收为抽屉（顶栏“章节”按钮打开；点遮罩、按 Esc、点章节或拉宽到 1280 以上关闭）。
// ?all=1 一次展开全部；#chap-N / #closing / #glossary / #sources / #videos 打开时直接定位。

const N = CHAPTERS.length;
const CLOSING_IDS = ['closing', 'glossary', 'sources', 'videos'];
// 读者主动操作（滚轮、触摸、按键、点击）时停止跳转后的自动对齐
const USER_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

function initialShown(): number {
  if (new URLSearchParams(location.search).get('all') === '1') return N + 1;
  const h = location.hash.replace('#', '');
  const m = /^chap-(\d+)$/.exec(h);
  if (m) return Math.min(N, Number(m[1]));
  if (CLOSING_IDS.includes(h)) return N + 1;
  return 0;
}

export default function App() {
  // shown = 已展开的章数；N + 1 表示收束也已展开
  const [shown, setShown] = useState(initialShown);
  const [target, setTarget] = useState<string | null>(() => (location.hash ? location.hash.slice(1) : null));
  const [active, setActive] = useState('top');
  const [drawer, setDrawer] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    document.title = 'SparseVLM 精读';
  }, []);
  useEffect(() => {
    document.documentElement.style.scrollBehavior = reduced ? 'auto' : '';
    // ?motion=reduce 与系统“减少动态效果”一致：CSS 过渡与入场动画也一起关闭
    document.documentElement.classList.toggle('is-reduced-motion', reduced);
  }, [reduced]);

  // 章节抽屉：Esc 关闭；窗口拉宽到侧栏常驻时也收起
  useEffect(() => {
    if (!drawer) return;
    const mq = window.matchMedia('(min-width: 1280px)');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawer(false);
    };
    const onWide = () => {
      if (mq.matches) setDrawer(false);
    };
    window.addEventListener('keydown', onKey);
    mq.addEventListener('change', onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onWide);
    };
  }, [drawer]);

  const go = (id: string, need: number) => {
    setShown((s) => Math.max(s, need));
    setTarget(id);
    setDrawer(false);
  };
  const jumpChapter = (n: number) => go(`chap-${n}`, n);
  // 模块里的“去 §N 细看”（10.1、结论分级）派发 sv-jump 事件
  useEffect(() => {
    const on = (e: Event) => {
      const n = Number((e as CustomEvent).detail);
      if (n >= 1 && n <= N) go(`chap-${n}`, n);
    };
    window.addEventListener('sv-jump', on);
    return () => window.removeEventListener('sv-jump', on);
  }, []);

  // 展开后再滚动到目标：先对齐一次；主区尺寸还在变化时（模块首帧后测量宽度、画布定高）跟着重新对齐，
  // 连续 300ms 没有变化或满 3 秒即停止；读者自己滚动、按键或点击时立即停止。对齐用 'instant'。
  // 停止函数存在 ref 里：effect 里的 setTarget(null) 会让 effect 重跑，若把 stop 当作清理函数返回，
  // ResizeObserver 刚挂上就会被断开（VTW v7.3 外壳的旧写法即如此）。只在开始新的跳转或卸载时停止。
  const mainRef = useRef<HTMLElement>(null);
  const stopAlign = useRef<(() => void) | null>(null);
  useEffect(() => () => stopAlign.current?.(), []);
  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(target);
    if (!el) return;
    history.replaceState(null, '', `${location.search}#${target}`);
    setTarget(null);
    stopAlign.current?.();
    const align = () => el.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
    align();
    const main = mainRef.current;
    if (!main) return;
    let quiet = 0;
    const stop = () => {
      ro?.disconnect();
      window.clearInterval(poll);
      window.clearTimeout(quiet);
      window.clearTimeout(cap);
      USER_EVENTS.forEach((ev) => window.removeEventListener(ev, stop, true));
      if (stopAlign.current === stop) stopAlign.current = null;
    };
    const realign = () => {
      align();
      window.clearTimeout(quiet);
      quiet = window.setTimeout(stop, 300);
    };
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(realign);
    ro?.observe(main);
    // 兜底：ResizeObserver 不触发的环境（后台标签页、部分 WebView）里每 100ms 看一次目标是否偏离
    const want = el.getBoundingClientRect().top;
    const poll = window.setInterval(() => {
      if (Math.abs(el.getBoundingClientRect().top - want) > 1) realign();
    }, 100);
    quiet = window.setTimeout(stop, 300);
    const cap = window.setTimeout(stop, 3000);
    USER_EVENTS.forEach((ev) => window.addEventListener(ev, stop, { capture: true, passive: true }));
    stopAlign.current = stop;
  }, [target, shown]);

  // 侧栏高亮当前所在的章
  useEffect(() => {
    const ids = ['top', ...CHAPTERS.slice(0, shown).map((c) => c.id), ...(shown > N ? CLOSING_IDS : [])];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shown]);

  const items = [
    ...CHAPTERS.map((c) => ({ id: c.id, num: `§${c.num}`, title: c.title, need: c.num })),
    { id: 'closing', num: '✦', title: '收束：结论分级', need: N + 1 },
    { id: 'glossary', num: '✦', title: '术语表', need: N + 1 },
    { id: 'sources', num: '✦', title: '来源与证据边界', need: N + 1 },
    { id: 'videos', num: '▶', title: '延伸学习 · B 站视频', need: N + 1 },
  ];

  return (
    <>
      <header className="v9-topbar">
        <button type="button" className="v9-menu" aria-expanded={drawer} aria-controls="v9-side" onClick={() => setDrawer((d) => !d)}>
          章节
        </button>
        <span>SparseVLM 精读</span>
      </header>
      <aside className={`slide-sidebar ${drawer ? 'is-open' : ''}`} id="v9-side" aria-label="章节目录">
        <a
          className="side-brand"
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            go('top', 0);
          }}
        >
          <span className="side-kicker">INTERACTIVE TUTORIAL</span>
          <span className="side-title">SparseVLM：{tutorial.meta.titleZh}</span>
        </a>
        <nav className="side-list">
          {items.map((it) => (
            <button key={it.id} type="button" className={`side-item ${active === it.id ? 'is-on' : ''} ${shown >= it.need ? 'is-open' : ''}`} aria-current={active === it.id ? 'location' : undefined} onClick={() => go(it.id, it.need)}>
              <span className="side-num">{it.num}</span>
              <span className="side-name">{it.title}</span>
            </button>
          ))}
        </nav>
        <div className="side-foot">ICML 2025 · 代码固定到 commit 734d900</div>
      </aside>
      {drawer ? <div className="v9-scrim" onClick={() => setDrawer(false)} /> : null}

      <main className={`v9-main ${shown > 0 && shown <= N ? 'is-partial' : ''}`} ref={mainRef}>
        <Hero onStart={() => jumpChapter(1)} onRoute={jumpChapter} />
        {CHAPTERS.slice(0, Math.min(shown, N)).map((c) => (
          <ChapterView
            key={c.id}
            ch={c}
            all={CHAPTERS}
            onJump={jumpChapter}
            next={c.num < N ? { label: `继续 §${c.num + 1}：${CHAPTERS[c.num].title}`, go: () => jumpChapter(c.num + 1) } : { label: '看结论分级、术语与来源', go: () => go('closing', N + 1) }}
          />
        ))}
        {shown > N ? (
          <>
            <Closing />
            <Videos />
          </>
        ) : null}
      </main>
    </>
  );
}
