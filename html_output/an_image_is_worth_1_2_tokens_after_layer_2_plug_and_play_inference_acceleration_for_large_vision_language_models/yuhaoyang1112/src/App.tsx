import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { positionReader } from './readerScroll';
import { tutorial } from './data/tutorial';
import { Hero } from './components/Hero';
import { SeriesChapter } from './components/SeriesChapter';
import SeriesClosing from './components/SeriesClosing';

const chapters = tutorial.chapters;
const total = chapters.length;
const closingSections = [
  { id: 'closing', label: '收束：结论分级', icon: '✦' },
  { id: 'glossary', label: '术语表', icon: '✦' },
  { id: 'sources', label: '来源与证据边界', icon: '✦' },
  { id: 'videos', label: '延伸学习 · B 站视频', icon: '▶' },
];
const navigation = [
  ...chapters.map((chapter, index) => ({ id: chapter.id, label: chapter.title, icon: '§' + (index + 1) })),
  ...closingSections,
];
const narrowWindow = '(max-width: 1279px)';
const moduleAnchors = new Map<string, number>(
  chapters.flatMap((ch, i) => ch.modules.map((m) => [`module-${m.id.replace('.', '-')}`, i + 1] as const)),
);
function required(id: string) {
  if (closingSections.some((section) => section.id === id)) return total + 1;
  if (moduleAnchors.has(id)) return moduleAnchors.get(id)!;
  return chapters.findIndex((c) => c.id === id) + 1;
}
const currentHash = () => location.hash.slice(1) || 'top';
export default function App() {
  const [shown, setShown] = useState(() =>
    new URLSearchParams(location.search).get('all') === '1' ? total + 1 : required(currentHash()),
  );
  const [target, setTarget] = useState(() => ({ id: currentHash(), fromClick: false }));
  const [active, setActive] = useState(currentHash());
  const [drawer, setDrawer] = useState(false);
  const menu = useRef<HTMLButtonElement>(null);
  const side = useRef<HTMLElement>(null);
  const main = useRef<HTMLElement>(null);
  const go = useCallback((id: string) => {
    setShown((n) => Math.max(n, required(id)));
    setTarget({ id, fromClick: true });
    setActive(chapters[(moduleAnchors.get(id) ?? 0) - 1]?.id ?? id);
    setDrawer(false);
    if (id !== currentHash()) history.pushState(null, '', location.pathname + location.search + '#' + id);
  }, []);
  useEffect(() => {
    const restore = () => {
      const id = currentHash();
      setShown((n) => Math.max(n, required(id)));
      setTarget((previous) => previous.id === id && !previous.fromClick ? previous : { id, fromClick: false });
      setDrawer(false);
    };
    const followLink = (event: globalThis.MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
      const id = anchor.hash.slice(1);
      if (id !== 'top' && required(id) === 0) return;
      event.preventDefault();
      go(id);
    };
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    document.addEventListener('click', followLink);
    window.addEventListener('hashchange', restore);
    window.addEventListener('popstate', restore);
    return () => {
      history.scrollRestoration = previousRestoration;
      document.removeEventListener('click', followLink);
      window.removeEventListener('hashchange', restore);
      window.removeEventListener('popstate', restore);
    };
  }, [go]);
  useLayoutEffect(() => {
    const el = document.getElementById(target.id);
    if (el && main.current) return positionReader(el, main.current, target.fromClick);
  }, [target]);
  useEffect(() => {
    const els = ['top', ...chapters.slice(0, shown).map((c) => c.id), ...closingSections.map((section) => section.id)]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    let frame = 0;
    const update = () => {
      frame = 0;
      if (document.documentElement.classList.contains('reader-travelling')) return;
      const line = Math.min(170, window.innerHeight * 0.23);
      let current = 'top';
      for (const el of els) {
        if (el.getBoundingClientRect().top > line) break;
        current = el.id;
      }
      if (shown > total && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2)
        current = 'videos';
      setActive(current);
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', scroll);
    };
  }, [shown]);
  useLayoutEffect(() => {
    const query = matchMedia(narrowWindow);
    const setAvailability = () => {
      if (side.current) side.current.inert = query.matches && !drawer;
    };
    setAvailability();
    query.addEventListener('change', setAvailability);
    return () => query.removeEventListener('change', setAvailability);
  }, [drawer]);
  useLayoutEffect(() => {
    if (!drawer) return;
    const panel = side.current!,
      content = main.current!;
    content.inert = true;
    document.body.classList.add('drawer-open');
    const items = Array.from(panel.querySelectorAll<HTMLElement>('button,a'));
    const close = () => {
      setDrawer(false);
      menu.current?.focus({ preventScroll: true });
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault();
          items[items.length - 1]?.focus();
        } else if (!e.shiftKey && document.activeElement === items[items.length - 1]) {
          e.preventDefault();
          items[0]?.focus();
        }
      }
    };
    (panel.querySelector<HTMLElement>('[aria-current]') || items[0])?.focus({ preventScroll: true });
    const wide = matchMedia('(min-width: 1280px)');
    const onWide = () => {
      if (wide.matches) setDrawer(false);
    };
    document.addEventListener('keydown', key);
    wide.addEventListener('change', onWide);
    return () => {
      content.inert = false;
      document.body.classList.remove('drawer-open');
      document.removeEventListener('keydown', key);
      wide.removeEventListener('change', onWide);
    };
  }, [drawer]);
  const navigate = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    go(id);
    if (drawer) menu.current?.focus({ preventScroll: true });
  };
  const closeDrawer = () => {
    setDrawer(false);
    menu.current?.focus({ preventScroll: true });
  };
  return (
    <>
      <header className="v9-topbar">
        <button type="button" className="v9-menu" ref={menu} aria-controls="v9-side"
          aria-expanded={drawer} onClick={() => setDrawer(!drawer)}>章节</button>
        <span>FastV 精读</span>
      </header>
      <aside ref={side} className={'slide-sidebar' + (drawer ? ' is-open' : '')}
        id="v9-side" aria-label="章节目录">
        <a className="side-brand" href="#top" onClick={(e) => navigate(e, 'top')}>
          <span className="side-kicker">INTERACTIVE TUTORIAL</span>
          <span className="side-title">FastV：图像在第 2 层后只值一半 Token</span>
        </a>
        <nav className="side-list" aria-label="阅读导航">
          {navigation.map(({ id, icon, label }) => (
            <a href={'#' + id} key={id} onClick={(e) => navigate(e, id)}
              className={'side-item' + (active === id ? ' is-on' : '') + (shown >= required(id) ? ' is-open' : '')}
              aria-current={active === id ? 'location' : undefined}>
              <span className="side-num">{icon}</span>
              <span className="side-name">{label}</span>
            </a>
          ))}
        </nav>
        <div className="side-foot">ECCV 2024 · 作者代码版本 d1659729</div>
        <button type="button" className="v9-side-close" onClick={closeDrawer}>关闭目录 ×</button>
      </aside>
      <div className={'reader-scrim' + (drawer ? ' is-shown' : '')} aria-hidden="true" onClick={closeDrawer} />
      <main className={'v9-main' + (shown > 0 && shown <= total ? ' is-partial' : '')} ref={main}>
        <Hero go={go} />
        {chapters.slice(0, shown).map((ch, index) => <SeriesChapter key={ch.id} ch={ch} index={index} go={go} />)}
        {shown > total && <SeriesClosing />}
      </main>
    </>
  );
}
