import React from 'react';

// 原文依据浮窗：在模块旁展示论文原文引用（英文原句 + 关键词高亮 + 中文解读 + 出处）。
// 该组件只被本教程的模块 widget 使用，数据全部来自论文与其引用的先前工作 [8]。

export interface EvidenceQuote {
  en: string;
  zh: string;
  locator: string;
  highlights?: string[];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedEn({ text, highlights }: { text: string; highlights?: string[] }) {
  if (!highlights || highlights.length === 0) return <>{text}</>;
  const pattern = highlights
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  const parts = text.split(new RegExp(`(${pattern})`, 'gi'));
  const wanted = new Set(highlights.map((h) => h.toLowerCase()));
  return (
    <>
      {parts.map((p, i) =>
        wanted.has(p.toLowerCase()) ? <mark key={i}>{p}</mark> : <React.Fragment key={i}>{p}</React.Fragment>
      )}
    </>
  );
}

export function EvidencePanel({ quotes, title = '原文依据' }: { quotes: EvidenceQuote[]; title?: string }) {
  return (
    <aside className="evidence-panel" aria-label="论文原文依据">
      <div className="evidence-head">{title}</div>
      {quotes.map((q, i) => (
        <blockquote className="evidence-quote" key={i}>
          <div className="evidence-en">
            <HighlightedEn text={q.en} highlights={q.highlights} />
          </div>
          <div className="evidence-zh" dangerouslySetInnerHTML={{ __html: q.zh }} />
          <div className="evidence-loc">{q.locator}</div>
        </blockquote>
      ))}
    </aside>
  );
}

export default EvidencePanel;
