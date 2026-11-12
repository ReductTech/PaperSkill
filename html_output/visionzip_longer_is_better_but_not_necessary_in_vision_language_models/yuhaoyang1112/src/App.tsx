import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { positionReader } from './readerScroll';
import { chapters, endSections } from './data/tutorial';
import { widgetRegistry } from './modules/registry';
import Hero from './modules/Hero';
import { Closing } from './modules/Closing';
import { ChapterQuestion, ChapterReading } from './modules/ChapterReading';
import { HintLayer } from './components/Hint';

const order = ['top', ...chapters.map(c => c.id), ...endSections.map(e => e[0])];
const lessonTargets: Record<string,string> = {
  'table-5': 'chap-1',
  'module-1-1': 'chap-1', 'module-2-1': 'chap-2', 'module-2-2': 'chap-2',
  'module-3-1': 'chap-3', 'module-3-2': 'chap-3',
  'module-4-1': 'chap-4', 'module-4-2': 'chap-4', 'module-4-3': 'chap-4',
  'module-5-1': 'chap-5', 'module-5-2': 'chap-5',
  'module-6-1': 'chap-6', 'module-6-2': 'chap-6', 'module-7-1': 'chap-7',
};
function chapterOf(id: string) {
  return lessonTargets[id] ?? id;
}
function hashTarget() {
  const id = window.location.hash.slice(1);
  return order.includes(chapterOf(id)) ? id : 'top';
}
function need(id: string) {
  return Math.min(order.indexOf(chapterOf(id)), chapters.length + 1);
}
export default function App() {
  const [target, setTarget] = useState({ id: hashTarget(), fromClick: false });
  const [shown, setShown] = useState(() => new URLSearchParams(location.search).get('all')==='1' ? chapters.length+1 : need(hashTarget()));
  const [active, setActive] = useState(() => chapterOf(hashTarget()));
  const [drawer, setDrawer] = useState(false);
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 1279px)').matches);
  const side = useRef<HTMLElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  const openUntil = (id: string, fromClick: boolean) => {
    setDrawer(false);
    setShown(prev => Math.max(prev, need(id)));
    setTarget(prev => !fromClick && prev.id === id && !prev.fromClick ? prev : { id, fromClick });
    setActive(chapterOf(id));
  };
  useEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const hashChanged = () => openUntil(hashTarget(), false);
    const localLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button!==0) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || !order.includes(chapterOf(link.hash.slice(1)))) return;
      event.preventDefault();
      if (location.hash!==link.hash) history.pushState(null,'',link.hash);
      if (side.current?.contains(link) && window.matchMedia('(max-width: 1279px)').matches) menu.current?.focus({preventScroll:true});
      openUntil(link.hash.slice(1), true);
    };
    const media=window.matchMedia('(max-width: 1279px)');
    const resize=()=>{setCompact(media.matches);if(!media.matches)setDrawer(false);};
    media.addEventListener('change',resize);
    document.addEventListener('click',localLink);
    window.addEventListener('hashchange', hashChanged);
    window.addEventListener('popstate', hashChanged);
    return () => {history.scrollRestoration = previousRestoration;media.removeEventListener('change',resize);document.removeEventListener('click',localLink);window.removeEventListener('hashchange',hashChanged);window.removeEventListener('popstate',hashChanged);};
  }, []);
  useEffect(() => {
    let frame=0;
    const track = () => {
      frame=0;
      if (document.documentElement.classList.contains('reader-travelling')) return;
      const visible=order.map(id=>document.getElementById(id)).filter((el): el is HTMLElement => !!el);
      const past=visible.filter(el=>el.getBoundingClientRect().top<=Math.min(180,innerHeight/3));
      const last = visible[visible.length-1];
      const atEnd=last && window.scrollY>0 && window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-3;
      setActive(atEnd ? last.id : past.length ? past[past.length-1].id : 'top');
    };
    const onScroll=()=>{if(!frame) frame=requestAnimationFrame(track);};
    window.addEventListener('scroll',onScroll,{passive:true});
    return ()=>{window.removeEventListener('scroll',onScroll);cancelAnimationFrame(frame);};
  },[shown]);
  useLayoutEffect(() => {
    if(side.current) side.current.inert=compact&&!drawer;
    if(main.current) main.current.inert=compact&&drawer;
    if(!drawer || !compact) return;
    const closeButton=side.current?.querySelector<HTMLButtonElement>('.drawer-close');
    closeButton?.focus();
    const old=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const onKey=(e: KeyboardEvent) => {
      if (e.key==='Escape') { setDrawer(false); menu.current?.focus(); }
      else if(e.key==='Tab'){
        const items=side.current?.querySelectorAll<HTMLElement>('a,button');
        if(!items?.length) return;
        const first=items[0],last=items[items.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    };
    document.addEventListener('keydown',onKey);
    return ()=>{document.body.style.overflow=old;document.removeEventListener('keydown',onKey);};
  },[drawer,compact]);
  useLayoutEffect(() => {
    const el = document.getElementById(target.id);
    if (el && main.current) return positionReader(el, main.current, target.fromClick);
  },[target]);
  function navItem(id: string, label: string, marker: string) {
    return <a key={id} href={'#' + id} className="vzs-side-item"
      aria-current={active === id ? 'location' : undefined}>
      <span className="vzs-side-num">{marker}</span><span>{label}</span>
    </a>;
  }
  const closeDrawer = () => {
    setDrawer(false);
    menu.current?.focus({preventScroll: true});
  };
  return <div className="reader">
    <HintLayer/>
    <header className="mobile-bar">
      <button type="button" ref={menu} aria-controls="contents" aria-expanded={drawer}
        onClick={() => setDrawer(true)}>章节</button><strong>VisionZip 精读</strong>
    </header>
    <div className={'reader-scrim' + (drawer && compact ? ' is-shown' : '')} aria-hidden="true" onClick={closeDrawer}/>
    <aside id="contents" ref={side} className={'vzs-sidebar' + (drawer ? ' open' : '')}
      role={drawer && compact ? 'dialog' : undefined} aria-modal={drawer && compact ? true : undefined}
      aria-label="章节目录">
      <a className="vzs-side-brand" href="#top"><span>INTERACTIVE TUTORIAL</span>
        <b>VisionZip：让更少的视觉 token 进入语言模型</b></a>
      <nav aria-label="阅读导航" className="vzs-side-list">
        {chapters.map((c,i) => navItem(c.id,c.short,'§' + (i + 1)))}
        {endSections.map(([id,label],i) => navItem(id,label,['✦','✦','✦','▶'][i]))}
      </nav>
      <div className="vzs-side-foot">CVPR 2025 · 作者代码版本 8f86b55</div>
      <button type="button" className="drawer-close" aria-label="关闭目录" onClick={closeDrawer}>关闭目录 ×</button>
    </aside>
    <main ref={main} className="vzs-main">
      <Hero/>
      {chapters.slice(0,shown).map((c,i) => {
        const Widget = widgetRegistry[c.module.componentId];
        const next = chapters[i + 1];
        return <section className="chapter-card vzs-chapter" id={c.id} key={c.id} aria-labelledby={c.id+'-title'}>
          <h2 className="vzs-title" id={c.id+'-title'}><em>§{i+1}.</em> {c.short}
            <span>{c.theme}</span></h2>
          <nav className="vzs-progress" aria-label="章节进度">{chapters.map((item,j) =>
            <span key={item.id}>{j > 0 && <i aria-hidden="true">→</i>}
              <a href={'#' + item.id} title={item.short} aria-label={'第 ' + (j + 1) + ' 章，' + item.short}
                aria-current={item.id === c.id ? 'step' : undefined} className={i > j ? 'read' : ''}>§{j+1}</a>
            </span>)}</nav>
          <ChapterQuestion id={c.id}/>
          <Widget/>
          <ChapterReading id={c.id}/>
          <div className="vzs-next"><a href={next ? '#'+next.id : '#closing'}>
            {next ? '继续 §'+(i+2)+' · '+next.short : '查看结论分级、术语与来源'} <span aria-hidden="true">→</span>
          </a></div>
        </section>;
      })}
      {shown>chapters.length && <div className="endmatter"><Closing/></div>}
    </main>
  </div>;
}
