import React, { useMemo } from 'react';
import { SymbolGlossary } from '../components/SymbolHint';
import { Tag, type ContentTag } from '../modules/sv-kit';
import { EVIDENCE } from './evidence';
import { GLOSSARY } from './glossary';

// 长滚动版的轻量富文本（取自 VTW v7.3 的 vtw9/Rich.tsx）：
// [[ev:键]] 证据芯片（链接到正式版页码 / 代码固定行号）、[[t:键|文字]] 术语（悬停 / 聚焦 / 点按看释义）、
// [[tag:paper|code|extrap|demo]] 内容口径、**粗体**、`代码`。

export function EvChip({ id }: { id: string }) {
  const ev = EVIDENCE[id];
  if (!ev) return null;
  return (
    <a className={`sv-ev is-${ev.source}`} href={ev.url} target="_blank" rel="noopener noreferrer" title={`${ev.loc}：${ev.content}`}>
      {ev.label}
    </a>
  );
}

function Term({ id, label }: { id: string; label?: string }) {
  const g = GLOSSARY[id];
  const text = label ?? g?.term ?? id;
  if (!g) return <>{text}</>;
  const meaning = `${g.term}${g.en ? `（${g.en}）` : ''}：${g.intuition}${g.role}`;
  return (
    <SymbolGlossary>
      <span className="formula-symbol sv-term" tabIndex={0} role="button" aria-label={meaning} data-formula-symbol="" data-formula-meaning={meaning}>
        {text}
      </span>
    </SymbolGlossary>
  );
}

const RE = /\[\[(ev|t|tag):([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|`([^`]+)`/g;

export function Rich({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] === 'ev') out.push(<EvChip key={key++} id={m[2]} />);
    else if (m[1] === 't') out.push(<Term key={key++} id={m[2]} label={m[3]} />);
    else if (m[1] === 'tag') out.push(<Tag key={key++} kind={m[2] as ContentTag} />);
    else if (m[4])
      out.push(
        <strong key={key++}>
          <Rich text={m[4]} />
        </strong>
      );
    else if (m[5]) out.push(<code key={key++}>{m[5]}</code>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

/** 公式 HTML：<i data-s="键">…</i> 换成可悬停 / 聚焦 / 点按的符号，释义取自符号表。 */
export function FormulaHtml({ html, symbols }: { html: string; symbols: { key: string; desc: string }[] }) {
  const out = useMemo(() => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const body = html.replace(/<i data-s="([^"]+)">([\s\S]*?)<\/i>/g, (_all, k: string, inner: string) => {
      const d = symbols.find((s) => s.key === k)?.desc ?? '';
      return `<i class="formula-symbol" tabindex="0" role="button" aria-label="${esc(d)}" data-formula-symbol="" data-formula-meaning="${esc(d)}">${inner}</i>`;
    });
    // 用全角空格分隔的几段公式各自保持整体，换行只发生在段与段之间
    return body
      .split('　')
      .map((seg) => `<span class="fx-seg">${seg}</span>`)
      .join(' ');
  }, [html, symbols]);
  return (
    <SymbolGlossary>
      <span className="sv-formula" dangerouslySetInnerHTML={{ __html: out }} />
    </SymbolGlossary>
  );
}
