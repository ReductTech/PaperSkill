import React, { useEffect, useRef, useState } from 'react';
import type { FormulaX as FormulaXDef } from '../../types';
import { EvChip, Rich } from '../../ui/kit';
import { canHover } from '../../lib/hooks';

/** 把符号说明里的 a_b / a_{bc} / a^b 写法转成上下标 HTML（内容均为本工程自写的静态文本） */
function symHtml(s: string): string {
  const esc = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc
    .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
    .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
    // 单字符下标（可带组合附加符号，如 N̂）；后面紧跟字母的视为代码标识符，不处理
    .replace(/_([^\s_{&](?:\p{M})?)(?![A-Za-z])/gu, '<sub>$1</sub>');
}

// 紧凑公式块：公式 → 一句话串讲 → 符号芯片。
// 公式里的符号和下方芯片都可以悬停（精细指针）、点按或用键盘聚焦，含义显示在提示条里。
export function FormulaX({ f }: { f: FormulaXDef }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const seen = new Set<string>();
    root.querySelectorAll<HTMLElement>('[data-s]').forEach((n) => {
      const key = n.getAttribute('data-s') || '';
      const sym = f.symbols.find((s) => s.key === key);
      // 同一个符号只让第一次出现进入 Tab 顺序
      n.setAttribute('tabindex', seen.has(key) ? '-1' : '0');
      seen.add(key);
      n.setAttribute('role', 'button');
      n.setAttribute('aria-label', sym ? `符号 ${sym.sym}：${sym.desc}` : key);
    });
  }, [f]);

  useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>('[data-s]').forEach((n) => {
      n.classList.toggle('is-on', n.getAttribute('data-s') === active);
    });
  }, [active]);

  const keyOf = (e: React.SyntheticEvent) => (e.target as HTMLElement).closest('[data-s]')?.getAttribute('data-s') ?? null;
  const activeSym = f.symbols.find((s) => s.key === active);

  return (
    <figure className="fx">
      <figcaption className="fx-head">
        <span className="fx-kicker">公式</span>
        <span className="fx-label">{f.label}</span>
        {!f.numbered ? <span className="fx-flag">非论文编号</span> : null}
        <EvChip id={f.evidence} />
      </figcaption>
      <div className="fx-scroll" tabIndex={-1}>
        <div
          ref={ref}
          className="fx-eq"
          onClick={(e) => {
            const k = keyOf(e);
            if (k) setActive((p) => (p === k ? null : k));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              const k = keyOf(e);
              if (k) {
                e.preventDefault();
                setActive((p) => (p === k ? null : k));
              }
            } else if (e.key === 'Escape') setActive(null);
          }}
          onFocus={(e) => {
            const k = keyOf(e);
            if (k) setActive(k);
          }}
          onPointerOver={(e) => {
            if (e.pointerType !== 'mouse' || !canHover()) return;
            const k = keyOf(e);
            if (k) setActive(k);
          }}
          dangerouslySetInnerHTML={{ __html: f.html }}
        />
      </div>
      <p className="fx-plain">
        <b>一句话串讲</b>
        <span>
          <Rich text={f.plain} />
        </span>
      </p>
      <div className="fx-chips" role="group" aria-label="符号说明">
        {f.symbols.map((s) => (
          <button
            type="button"
            key={s.key + s.sym}
            className={`fx-chip ${active === s.key ? 'is-on' : ''}`}
            aria-pressed={active === s.key}
            aria-label={`符号 ${s.sym}`}
            onClick={() => setActive((p) => (p === s.key ? null : s.key))}
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse' && canHover()) setActive(s.key);
            }}
          >
            <span dangerouslySetInnerHTML={{ __html: symHtml(s.sym) }} />
          </button>
        ))}
      </div>
      <div className={`fx-tip ${activeSym ? 'is-on' : ''}`} aria-live="polite">
        {activeSym ? (
          <>
            <b dangerouslySetInnerHTML={{ __html: symHtml(activeSym.sym) }} />
            <span>{activeSym.desc}</span>
          </>
        ) : (
          <span className="fx-tip-hint">悬停、点按或用 Tab 聚焦符号，查看含义</span>
        )}
      </div>
      {f.note ? (
        <p className="fx-note">
          <Rich text={f.note} />
        </p>
      ) : null}
    </figure>
  );
}
