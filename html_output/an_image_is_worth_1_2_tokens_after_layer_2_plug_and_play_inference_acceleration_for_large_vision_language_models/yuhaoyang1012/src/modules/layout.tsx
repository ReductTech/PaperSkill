import React, { useEffect, useRef, useState } from 'react';
import type { ChapterDef, FormulaDef, AnalogyCard as AnalogyDef } from '../types';
import { widgetRegistry } from './registry';
import { EVIDENCE } from './glossary';
import { prefersReduced } from './ui';

// ============================================================================
//  长卷版式组件：章节开场、公式块、证据面板容器、轻量章节导航、窄屏判断。
// ============================================================================

export { MOBILE_QUERY, useIsMobile, CanvasPan } from './ui';

// ---------------------------------------------------------------------------
//  章节开场：把“本节作用”与生活类比合并成一张卡（没有类比的章节只显示文字）
// ---------------------------------------------------------------------------
export function Intro({ bridge, analogy, chapterId }: { bridge: string; analogy?: AnalogyDef; chapterId: string }) {
  const Widget = analogy?.componentId ? widgetRegistry[analogy.componentId] : undefined;
  return (
    <div className={`intro ${analogy ? 'has-ana' : ''}`}>
      <div className="intro-text">
        <div className="intro-kicker">本节作用</div>
        <p dangerouslySetInnerHTML={{ __html: bridge }} />
        {analogy ? (
          <div className="intro-ana">
            <div className="intro-ana-title">{analogy.title}</div>
            <p dangerouslySetInnerHTML={{ __html: analogy.text }} />
          </div>
        ) : null}
      </div>
      {Widget ? (
        <div className="intro-visual">
          <Widget chapterId={chapterId} moduleId="ana" />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  公式块：公式 → 一句话串讲 → 逐个符号（悬停 / 聚焦 / 点按查看含义）
// ---------------------------------------------------------------------------
const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function annotate(html: string, symbols: { sym: string; desc: string }[]) {
  if (!symbols.length) return html;
  const sorted = [...symbols].sort((a, b) => b.sym.length - a.sym.length);
  const re = new RegExp(`(${sorted.map((s) => escRe(s.sym)).join('|')})`, 'g');
  const seen = new Set<string>();
  return html
    .split(/(<[^>]+>)/g)
    .map((tok) => {
      if (tok.startsWith('<')) return tok;
      return tok.replace(re, (m) => {
        const d = symbols.find((s) => s.sym === m);
        if (!d) return m;
        // 每个符号只有第一次出现可用 Tab 聚焦，避免键盘在同一符号上反复停留
        const tab = seen.has(m) ? '-1' : '0';
        seen.add(m);
        return `<span class="fx-sym" tabindex="${tab}" role="button" data-tip-title="${escAttr(m)}" data-tip-body="${escAttr(d.desc)}">${m}</span>`;
      });
    })
    .join('');
}

export function FormulaBlock({ f }: { f: FormulaDef }) {
  const html = annotate(f.unicode, f.symbols);
  const ev = f.eq ? EVIDENCE[f.eq] : undefined;
  return (
    <div className="fx">
      <div className="fx-top">
        <span className="fx-kicker">公式</span>
        {ev ? (
          <span className="ev" tabIndex={0} role="button" data-ev={f.eq}>
            {ev.label}
          </span>
        ) : null}
        <span className="fx-lead" dangerouslySetInnerHTML={{ __html: f.lead }} />
      </div>
      <div className="fx-eq" dangerouslySetInnerHTML={{ __html: html }} />
      {f.summary ? (
        <p className="fx-summary">
          <b>一句话串讲</b>
          <span dangerouslySetInnerHTML={{ __html: f.summary }} />
        </p>
      ) : null}
      <div className="fx-syms">
        {f.symbols.map((s) => (
          <span key={s.sym} className="fx-chip" tabIndex={-1} role="button" data-tip-title={s.sym} data-tip-body={s.desc}>
            <i dangerouslySetInnerHTML={{ __html: s.sym }} />
          </span>
        ))}
        <span className="fx-hint">悬停、聚焦或点按符号查看含义</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  证据 / 对比面板：按 componentId 渲染，直接嵌在章节里
// ---------------------------------------------------------------------------
export function Panel({ id, chapterId }: { id: string; chapterId: string }) {
  const W = widgetRegistry[id];
  if (!W) return null;
  return (
    <div className="panel-wrap">
      <W chapterId={chapterId} moduleId={id} />
    </div>
  );
}

// ---------------------------------------------------------------------------
//  轻量章节导航：滚过封面后出现的悬浮胶囊；点开是一张紧凑的章节清单
// ---------------------------------------------------------------------------
export function ChapterNav({ chapters }: { chapters: ChapterDef[] }) {
  const [cur, setCur] = useState(-1);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const secs = chapters.map((c) => document.getElementById(c.id)).filter(Boolean) as HTMLElement[];
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.35;
      let idx = -1;
      secs.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= mid) idx = i;
      });
      setCur(idx);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [chapters]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    const first = panelRef.current?.querySelector<HTMLElement>('a[aria-current="true"]') || panelRef.current?.querySelector<HTMLElement>('a');
    first?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const visible = cur >= 0;
  const c = chapters[Math.max(0, cur)];
  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth', block: 'start' });
  };
  const toTop = () => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });
  };

  return (
    <nav className={`cnav ${visible ? 'is-visible' : ''}`} aria-label="章节导航">
      <div ref={panelRef} className={`cnav-panel ${open ? 'is-open' : ''}`} id="cnav-panel" aria-hidden={!open}>
        <div className="cnav-panel-head">跳转到章节</div>
        <ol>
          {chapters.map((ch, i) => (
            <li key={ch.id}>
              <a
                href={`#${ch.id}`}
                tabIndex={open ? 0 : -1}
                aria-current={i === cur ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(ch.id);
                }}
              >
                <span className="cnav-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="cnav-t">{ch.nav || ch.title}</span>
              </a>
            </li>
          ))}
        </ol>
        <button className="cnav-top" tabIndex={open ? 0 : -1} onClick={toTop}>
          ↑ 回到封面
        </button>
      </div>
      <button
        ref={btnRef}
        className="cnav-pill"
        aria-expanded={open}
        aria-controls="cnav-panel"
        aria-label={`章节导航：当前第 ${Math.max(1, cur + 1)} 章，共 ${chapters.length} 章`}
        tabIndex={visible ? 0 : -1}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="cnav-pill-n">{String(Math.max(1, cur + 1)).padStart(2, '0')}</span>
        <span className="cnav-pill-t">{c ? c.nav || c.title : ''}</span>
        <span className="cnav-pill-of">/ {chapters.length}</span>
        <span className="cnav-pill-bar" aria-hidden="true">
          <i style={{ transform: `scaleX(${(Math.max(0, cur) + 1) / chapters.length})` }} />
        </span>
      </button>
    </nav>
  );
}
