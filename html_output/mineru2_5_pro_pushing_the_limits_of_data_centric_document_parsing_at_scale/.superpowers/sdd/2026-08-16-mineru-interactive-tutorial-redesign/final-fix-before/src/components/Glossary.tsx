import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  GLOSSARY,
  getGlossaryEntry,
  type GlossaryEntry,
} from '../data/glossary';

type GlossaryPanelState =
  | { kind: 'term'; id: string; anchor: HTMLElement | null }
  | { kind: 'index'; anchor: HTMLElement | null }
  | null;

interface AnchorRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface GlossaryContextValue {
  activePanel: GlossaryPanelState;
  panelId: string;
  openTerm: (id: string, trigger?: HTMLElement | null) => void;
  openIndex: (trigger?: HTMLElement | null) => void;
  close: () => void;
}

export interface GlossaryProviderProps {
  children: ReactNode;
}

export interface TermProps {
  id: string;
  children?: ReactNode;
  className?: string;
}

export interface GlossaryTextProps {
  text: string;
  className?: string;
  /** Keep long paragraphs readable by linking only the first occurrence of each term. */
  oncePerTerm?: boolean;
}

export interface GlossaryButtonProps {
  children?: ReactNode;
  className?: string;
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null);

interface GlossaryMatcher {
  id: string;
  label: string;
  normalized: string;
  needsWordBoundary: boolean;
}

const GLOSSARY_MATCHERS: readonly GlossaryMatcher[] = GLOSSARY
  .flatMap((entry) => [entry.term, ...(entry.aliases ?? [])].map((label) => ({
    id: entry.id,
    label,
    normalized: label.toLocaleLowerCase('en-US'),
    needsWordBoundary: /^[a-z0-9_.-]+$/i.test(label),
  })))
  .filter((matcher, index, all) => all.findIndex(
    (candidate) => candidate.id === matcher.id && candidate.normalized === matcher.normalized,
  ) === index)
  .sort((left, right) => right.label.length - left.label.length);

function hasAsciiWordBoundary(text: string, index: number, length: number) {
  const before = index > 0 ? text[index - 1] : '';
  const after = index + length < text.length ? text[index + length] : '';
  return !/[a-z0-9_]/i.test(before) && !/[a-z0-9_]/i.test(after);
}

function findNextGlossaryMatch(text: string, start: number, used: ReadonlySet<string>) {
  const normalizedText = text.toLocaleLowerCase('en-US');
  let best: (GlossaryMatcher & { index: number }) | null = null;

  for (const matcher of GLOSSARY_MATCHERS) {
    if (used.has(matcher.id)) continue;
    let index = normalizedText.indexOf(matcher.normalized, start);
    while (index >= 0 && matcher.needsWordBoundary && !hasAsciiWordBoundary(text, index, matcher.label.length)) {
      index = normalizedText.indexOf(matcher.normalized, index + 1);
    }
    if (index < 0) continue;
    if (!best || index < best.index || (index === best.index && matcher.label.length > best.label.length)) {
      best = { ...matcher, index };
    }
  }
  return best;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function joinClassNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function parseGlossaryHash(hash: string): { kind: 'index' } | { kind: 'term'; id: string } | null {
  if (hash === '#glossary' || hash === '#glossary/') return { kind: 'index' };
  if (!hash.startsWith('#glossary/')) return null;

  try {
    const id = decodeURIComponent(hash.slice('#glossary/'.length)).trim().toLowerCase();
    return getGlossaryEntry(id) ? { kind: 'term', id } : null;
  } catch {
    return null;
  }
}

function setLocationHash(hash: string): void {
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

function normalizeSearchText(value: string): string {
  return value
    .toLocaleLowerCase('zh-CN')
    .replace(/[\s\-–—_/()（）·]+/g, '');
}

function matchesSearch(entry: GlossaryEntry, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const searchable = [
    entry.id,
    entry.term,
    entry.english,
    ...(entry.aliases ?? []),
    entry.category,
    entry.summary,
    entry.explanation,
  ]
    .filter(Boolean)
    .join(' ');

  return normalizeSearchText(searchable).includes(normalizedQuery);
}

function useGlossary(): GlossaryContextValue {
  const value = useContext(GlossaryContext);
  if (!value) {
    throw new Error('Term 和 GlossaryButton 必须放在 GlossaryProvider 内。');
  }
  return value;
}

function TermDetail({
  entry,
  headingId,
  close,
  openTerm,
  openIndex,
}: {
  entry: GlossaryEntry;
  headingId: string;
  close: () => void;
  openTerm: (id: string) => void;
  openIndex: () => void;
}) {
  const relatedEntries = (entry.related ?? [])
    .map((id) => getGlossaryEntry(id))
    .filter((item): item is GlossaryEntry => Boolean(item));

  return (
    <>
      <header className="glossary-panel__header">
        <div className="glossary-panel__heading-group">
          <span className="glossary-panel__category">{entry.category}</span>
          <h2 className="glossary-panel__title" id={headingId}>{entry.term}</h2>
          {entry.english ? <p className="glossary-panel__english">{entry.english}</p> : null}
        </div>
        <button
          type="button"
          className="glossary-panel__close"
          onClick={close}
          aria-label="关闭术语讲解"
          data-glossary-autofocus
        >
          关闭
        </button>
      </header>

      <div className="glossary-panel__body">
        <p className="glossary-panel__summary">{entry.summary}</p>

        <section className="glossary-panel__section" aria-labelledby={`${headingId}-explanation`}>
          <h3 id={`${headingId}-explanation`}>通俗解释</h3>
          <p>{entry.explanation}</p>
        </section>

        {entry.example ? (
          <section className="glossary-panel__section glossary-panel__section--example" aria-labelledby={`${headingId}-example`}>
            <h3 id={`${headingId}-example`}>在这篇论文里</h3>
            <p>{entry.example}</p>
          </section>
        ) : null}

        {entry.caution ? (
          <section className="glossary-panel__section glossary-panel__section--caution" aria-labelledby={`${headingId}-caution`}>
            <h3 id={`${headingId}-caution`}>注意边界</h3>
            <p>{entry.caution}</p>
          </section>
        ) : null}

        {entry.aliases?.length ? (
          <p className="glossary-panel__aliases">
            <strong>也常写作：</strong>{entry.aliases.join('、')}
          </p>
        ) : null}

        {relatedEntries.length ? (
          <section className="glossary-panel__related" aria-labelledby={`${headingId}-related`}>
            <h3 id={`${headingId}-related`}>相关术语</h3>
            <div className="glossary-panel__related-list">
              {relatedEntries.map((related) => (
                <button
                  type="button"
                  className="glossary-panel__related-button"
                  key={related.id}
                  onClick={() => openTerm(related.id)}
                  aria-label={`查看术语：${related.term}`}
                >
                  {related.term}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="glossary-panel__sources" aria-labelledby={`${headingId}-sources`}>
          <h3 id={`${headingId}-sources`}>论文依据</h3>
          <ul>
            {entry.sources.map((source) => (
              <li key={`${entry.id}-${source.href}`}>
                <a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="glossary-panel__footer">
        <button type="button" className="glossary-panel__index-button" onClick={openIndex}>
          打开完整术语表
        </button>
      </footer>
    </>
  );
}

function GlossaryIndex({
  headingId,
  query,
  setQuery,
  close,
  openTerm,
}: {
  headingId: string;
  query: string;
  setQuery: (value: string) => void;
  close: () => void;
  openTerm: (id: string) => void;
}) {
  const filteredEntries = useMemo(
    () => GLOSSARY.filter((entry) => matchesSearch(entry, query)),
    [query]
  );
  const searchId = `${headingId}-search`;
  const resultId = `${headingId}-results`;

  return (
    <>
      <header className="glossary-panel__header glossary-index__header">
        <div className="glossary-panel__heading-group">
          <span className="glossary-panel__category">阅读辅助</span>
          <h2 className="glossary-panel__title" id={headingId}>论文术语表</h2>
          <p className="glossary-panel__english">点击任一术语查看通俗解释与论文依据</p>
        </div>
        <button
          type="button"
          className="glossary-panel__close"
          onClick={close}
          aria-label="关闭术语表"
        >
          关闭
        </button>
      </header>

      <div className="glossary-index__search">
        <label htmlFor={searchId}>搜索术语</label>
        <div className="glossary-index__search-control">
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例如：CMCV、评测、伪标签"
            aria-describedby={resultId}
            autoComplete="off"
            data-glossary-autofocus
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label="清空术语搜索">
              清空
            </button>
          ) : null}
        </div>
        <p className="glossary-index__result-count" id={resultId} aria-live="polite">
          找到 {filteredEntries.length} 个术语
        </p>
      </div>

      <div className="glossary-index__body">
        {filteredEntries.length ? (
          <ul className="glossary-index__list">
            {filteredEntries.map((entry) => (
              <li className="glossary-index__item" key={entry.id}>
                <button
                  type="button"
                  className="glossary-index__entry-button"
                  onClick={() => openTerm(entry.id)}
                  aria-label={`查看术语：${entry.term}`}
                >
                  <span className="glossary-index__entry-heading">
                    <strong>{entry.term}</strong>
                    <small>{entry.category}</small>
                  </span>
                  {entry.english ? <span className="glossary-index__entry-english">{entry.english}</span> : null}
                  <span className="glossary-index__entry-summary">{entry.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="glossary-index__empty" role="status">
            <strong>暂未找到匹配术语</strong>
            <p>可以尝试搜索中文名称、英文缩写或所属主题。</p>
            <button type="button" onClick={() => setQuery('')}>显示全部术语</button>
          </div>
        )}
      </div>
    </>
  );
}

export function GlossaryProvider({ children }: GlossaryProviderProps) {
  const generatedId = useId().replace(/:/g, '');
  const panelId = `glossary-panel-${generatedId}`;
  const headingId = `${panelId}-heading`;
  const [activePanel, setActivePanel] = useState<GlossaryPanelState>(null);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const [query, setQuery] = useState('');
  const activePanelRef = useRef<GlossaryPanelState>(null);
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const previousHashRef = useRef('');
  const lastNonGlossaryHashRef = useRef('');

  const commitPanel = useCallback((next: GlossaryPanelState) => {
    activePanelRef.current = next;
    setActivePanel(next);
  }, []);

  const finishClose = useCallback((options?: { restoreHash?: boolean; restoreFocus?: boolean }) => {
    if (!activePanelRef.current) return;
    const restoreHash = options?.restoreHash ?? true;
    const restoreFocus = options?.restoreFocus ?? true;
    const focusTarget = returnFocusRef.current;

    commitPanel(null);
    setAnchorRect(null);
    setQuery('');

    if (restoreHash && typeof window !== 'undefined' && parseGlossaryHash(window.location.hash)) {
      setLocationHash(previousHashRef.current);
    }

    returnFocusRef.current = null;
    previousHashRef.current = '';

    if (restoreFocus && focusTarget) {
      window.requestAnimationFrame(() => focusTarget.focus());
    }
  }, [commitPanel]);

  const close = useCallback(() => finishClose(), [finishClose]);

  const beginSession = useCallback((trigger?: HTMLElement | null) => {
    if (activePanelRef.current || typeof window === 'undefined') return;
    previousHashRef.current = window.location.hash;
    const currentFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    returnFocusRef.current = trigger ?? currentFocus;
  }, []);

  const openTerm = useCallback((id: string, trigger?: HTMLElement | null) => {
    const entry = getGlossaryEntry(id);
    if (!entry) return;

    const current = activePanelRef.current;
    if (current?.kind === 'term' && current.id === entry.id && current.anchor === trigger) {
      finishClose();
      return;
    }

    beginSession(trigger);
    const anchor = trigger ?? current?.anchor ?? null;
    commitPanel({ kind: 'term', id: entry.id, anchor });
    if (typeof window !== 'undefined') setLocationHash(`#glossary/${encodeURIComponent(entry.id)}`);
  }, [beginSession, commitPanel, finishClose]);

  const openIndex = useCallback((trigger?: HTMLElement | null) => {
    const current = activePanelRef.current;
    if (current?.kind === 'index' && current.anchor === trigger) {
      finishClose();
      return;
    }

    beginSession(trigger);
    const anchor = trigger ?? current?.anchor ?? null;
    commitPanel({ kind: 'index', anchor });
    if (typeof window !== 'undefined') setLocationHash('#glossary');
  }, [beginSession, commitPanel, finishClose]);

  useEffect(() => {
    const syncFromHash = () => {
      const target = parseGlossaryHash(window.location.hash);
      if (!target) {
        lastNonGlossaryHashRef.current = window.location.hash;
        if (activePanelRef.current) {
          finishClose({ restoreHash: false });
        }
        return;
      }

      if (!activePanelRef.current) {
        previousHashRef.current = lastNonGlossaryHashRef.current;
        returnFocusRef.current = null;
      }

      if (target.kind === 'index') {
        commitPanel({ kind: 'index', anchor: activePanelRef.current?.anchor ?? null });
      } else {
        commitPanel({ kind: 'term', id: target.id, anchor: activePanelRef.current?.anchor ?? null });
      }
    };

    if (!parseGlossaryHash(window.location.hash)) {
      lastNonGlossaryHashRef.current = window.location.hash;
    }
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    window.addEventListener('popstate', syncFromHash);
    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('popstate', syncFromHash);
    };
  }, [commitPanel, finishClose]);

  useLayoutEffect(() => {
    if (!activePanel?.anchor) {
      setAnchorRect(null);
      return;
    }

    const updateAnchorRect = () => {
      const rect = activePanel.anchor?.getBoundingClientRect();
      if (!rect) return;
      setAnchorRect({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      });
    };

    updateAnchorRect();
    window.addEventListener('resize', updateAnchorRect);
    window.addEventListener('scroll', updateAnchorRect, true);
    return () => {
      window.removeEventListener('resize', updateAnchorRect);
      window.removeEventListener('scroll', updateAnchorRect, true);
    };
  }, [activePanel]);

  useEffect(() => {
    if (!activePanel) return;
    const frame = window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>('[data-glossary-autofocus]')
        ?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activePanel]);

  useEffect(() => {
    if (!activePanel) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (activePanel.anchor?.contains(target)) return;
      if (target instanceof Element && target.closest('.glossary-term, .glossary-button')) return;
      finishClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finishClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (!focusable.length) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [activePanel, finishClose]);

  const contextValue = useMemo<GlossaryContextValue>(() => ({
    activePanel,
    panelId,
    openTerm,
    openIndex,
    close,
  }), [activePanel, close, openIndex, openTerm, panelId]);

  const entry = activePanel?.kind === 'term' ? getGlossaryEntry(activePanel.id) : undefined;
  const layerStyle = anchorRect
    ? ({
        '--glossary-anchor-left': `${anchorRect.left}px`,
        '--glossary-anchor-top': `${anchorRect.top}px`,
        '--glossary-anchor-right': `${anchorRect.right}px`,
        '--glossary-anchor-bottom': `${anchorRect.bottom}px`,
        '--glossary-anchor-width': `${anchorRect.width}px`,
        '--glossary-anchor-height': `${anchorRect.height}px`,
      } as CSSProperties)
    : undefined;

  const panel = activePanel && (activePanel.kind === 'index' || entry) ? (
    <div
      className={joinClassNames(
        'glossary-layer',
        activePanel.anchor ? 'glossary-layer--anchored' : 'glossary-layer--detached'
      )}
      style={layerStyle}
      data-glossary-panel={activePanel.kind}
    >
      <div className="glossary-backdrop" aria-hidden="true" />
      <section
        ref={panelRef}
        id={panelId}
        className={joinClassNames(
          'glossary-panel',
          'glossary-panel--desktop-popover',
          'glossary-panel--mobile-sheet',
          activePanel.kind === 'term' ? 'glossary-panel--term' : 'glossary-panel--index'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
      >
        {activePanel.kind === 'term' && entry ? (
          <TermDetail
            entry={entry}
            headingId={headingId}
            close={close}
            openTerm={(id) => openTerm(id)}
            openIndex={() => openIndex()}
          />
        ) : (
          <GlossaryIndex
            headingId={headingId}
            query={query}
            setQuery={setQuery}
            close={close}
            openTerm={(id) => openTerm(id)}
          />
        )}
      </section>
    </div>
  ) : null;

  return (
    <GlossaryContext.Provider value={contextValue}>
      {children}
      {panel && typeof document !== 'undefined' ? createPortal(panel, document.body) : null}
    </GlossaryContext.Provider>
  );
}

export function Term({ id, children, className }: TermProps) {
  const { activePanel, panelId, openTerm, close } = useGlossary();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const entry = getGlossaryEntry(id);

  if (!entry) {
    return (
      <span className={joinClassNames('glossary-term-missing', className)} data-glossary-missing={id}>
        {children ?? id}
      </span>
    );
  }

  const expanded = activePanel?.kind === 'term'
    && activePanel.id === entry.id
    && activePanel.anchor === buttonRef.current;

  const onClick = () => {
    if (expanded) close();
    else openTerm(entry.id, buttonRef.current);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className={joinClassNames('glossary-term', expanded && 'glossary-term--active', className)}
      onClick={onClick}
      aria-label={`解释术语：${entry.term}`}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-controls={panelId}
      data-glossary-id={entry.id}
    >
      <span className="glossary-term__label">{children ?? entry.term}</span>
      <span className="glossary-term__mark" aria-hidden="true">?</span>
    </button>
  );
}

/**
 * Turns the glossary terms that appear inside learner-facing prose into the
 * same accessible click-to-explain buttons used by <Term />. This keeps the
 * explanation at the exact point where a reader first meets the term.
 */
export function GlossaryText({ text, className, oncePerTerm = true }: GlossaryTextProps) {
  const parts: ReactNode[] = [];
  const used = new Set<string>();
  let cursor = 0;
  let key = 0;

  while (cursor < text.length) {
    const match = findNextGlossaryMatch(text, cursor, oncePerTerm ? used : new Set());
    if (!match) {
      parts.push(text.slice(cursor));
      break;
    }
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    const label = text.slice(match.index, match.index + match.label.length);
    parts.push(<Term id={match.id} key={`${match.id}-${key++}`}>{label}</Term>);
    used.add(match.id);
    cursor = match.index + match.label.length;
  }

  const content = parts.length ? parts : text;
  return className ? <span className={className}>{content}</span> : <>{content}</>;
}

export function GlossaryButton({ children = '术语表', className }: GlossaryButtonProps) {
  const { activePanel, panelId, openIndex, close } = useGlossary();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const expanded = activePanel?.kind === 'index' && activePanel.anchor === buttonRef.current;

  const onClick = () => {
    if (expanded) close();
    else openIndex(buttonRef.current);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className={joinClassNames('glossary-button', expanded && 'glossary-button--active', className)}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      aria-controls={panelId}
    >
      {children}
    </button>
  );
}
