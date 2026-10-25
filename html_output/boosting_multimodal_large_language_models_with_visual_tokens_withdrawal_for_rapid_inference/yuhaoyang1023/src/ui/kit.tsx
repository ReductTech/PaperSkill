import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { Popover } from './Popover';
import { tutorial } from '../data/tutorial';
import type { ContentTag } from '../types';

// 共享 UI：证据芯片 / 术语 / 口径标记 / 富文本 / 分段切换 / 滑块 / 反馈 / 横向滚动容器 / 下拉。
// 只依赖 data 与 lib，不依赖 modules 或 registry，避免循环 import。

const SOURCE_NAME: Record<string, string> = {
  aaai: 'AAAI 2025 正式版论文',
  arxiv: 'arXiv v3（附录只见于此版）',
  code: '官方代码 · 固定 commit b9cb126',
  ext: '相关论文 / 外部资料',
};

export function EvChip({ id, label }: { id: string; label?: string }) {
  const ev = tutorial.evidence?.[id];
  if (!ev) return <span className="ev-missing">[{id}]</span>;
  return (
    <Popover
      trigger={
        <>
          <span className="ev-dot" aria-hidden="true" />
          {label ?? ev.label}
        </>
      }
      triggerClass={`ev-chip ev-${ev.source}`}
      triggerLabel={`证据：${label ?? ev.label}`}
      title={`证据定位：${ev.label}`}
    >
      <div className="pop-kicker">{SOURCE_NAME[ev.source]}</div>
      <div className="pop-title">{ev.label}</div>
      <dl className="pop-dl">
        <dt>位置</dt>
        <dd>{ev.loc}</dd>
        <dt>内容</dt>
        <dd>
          <Rich text={ev.content} plain />
        </dd>
      </dl>
      <a className="pop-link" href={ev.url} target="_blank" rel="noopener noreferrer">
        {ev.source === 'code' ? '打开代码（固定 commit 与行号）↗' : '打开原文 ↗'}
      </a>
    </Popover>
  );
}

export function Term({ id, label }: { id: string; label?: string }) {
  const g = tutorial.glossary?.[id];
  if (!g) return <>{label ?? id}</>;
  return (
    <Popover as="span" trigger={label ?? g.term} triggerClass="term" triggerLabel={`术语：${g.term}`} title={`术语：${g.term}`}>
      <div className="pop-kicker">术语</div>
      <div className="pop-title">
        {g.term}
        {g.en ? <span className="pop-en"> · {g.en}</span> : null}
      </div>
      <dl className="pop-dl">
        <dt>直觉解释</dt>
        <dd>{g.intuition}</dd>
        <dt>本文中的作用</dt>
        <dd>{g.role}</dd>
      </dl>
      <a className="pop-link" href="#glossary">
        查看完整术语表 ↓
      </a>
    </Popover>
  );
}

export const TAG_INFO: Record<ContentTag, { label: string; desc: string }> = {
  paper: { label: '论文实测', desc: '直接取自论文正文、表格或图（AAAI 正式版；arXiv 附录会单独注明），未经修改。' },
  code: { label: '代码事实', desc: '直接取自官方仓库固定 commit b9cb126 的代码或 README，附行号链接。' },
  extrap: { label: '公式外推', desc: '本页按论文公式或代码口径计算 / 反推得到，论文本身没有报告这个数字或配置。' },
  demo: { label: '教学示意', desc: '为讲解而绘制的示意数据或小模型，不是论文或真实模型的数据。' },
};

export function Tag({ kind }: { kind: ContentTag }) {
  const info = TAG_INFO[kind];
  return (
    <Popover as="span" trigger={info.label} triggerClass={`ctag ctag-${kind}`} triggerLabel={`内容口径：${info.label}`} title={`内容口径：${info.label}`}>
      <div className="pop-kicker">内容口径</div>
      <div className="pop-title">{info.label}</div>
      <p className="pop-p">{info.desc}</p>
    </Popover>
  );
}

export function Tags({ kinds }: { kinds: ContentTag[] }) {
  return (
    <span className="ctags">
      {kinds.map((k) => (
        <Tag key={k} kind={k} />
      ))}
    </span>
  );
}

const RE = /\[\[(ev|t|tag):([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|`([^`]+)`/g;

/** 轻量富文本：[[ev:键|标签]] 证据芯片、[[t:键|文字]] 术语、[[tag:demo]] 口径、**粗体**、`代码`。 */
export function Rich({ text, plain }: { text: string; plain?: boolean }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  const re = new RegExp(RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] === 'ev') {
      out.push(plain ? <b key={key++}>{m[3] ?? tutorial.evidence?.[m[2]]?.label ?? m[2]}</b> : <EvChip key={key++} id={m[2]} label={m[3]} />);
    } else if (m[1] === 't') {
      out.push(plain ? <span key={key++}>{m[3] ?? tutorial.glossary?.[m[2]]?.term ?? m[2]}</span> : <Term key={key++} id={m[2]} label={m[3]} />);
    } else if (m[1] === 'tag') {
      out.push(plain ? <span key={key++}>（{TAG_INFO[m[2] as ContentTag]?.label}）</span> : <Tag key={key++} kind={m[2] as ContentTag} />);
    } else if (m[4]) {
      out.push(<strong key={key++}>{m[4]}</strong>);
    } else if (m[5]) {
      out.push(<code key={key++}>{m[5]}</code>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

// ---------------------------------------------------------------------------
// 分段切换：选中指示器用 clip-path 过渡（复制一层“选中样式”的按钮行，裁剪到当前项）。
// 方向键切换，Tab 只停在当前项。
// ---------------------------------------------------------------------------

export interface SegOption<T extends string | number> {
  value: T;
  label: string;
}

export function Seg<T extends string | number>({
  options,
  value,
  onChange,
  label,
  small,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  small?: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [clip, setClip] = useState('inset(0 100% 0 0 round 999px)');
  const idx = Math.max(0, options.findIndex((o) => o.value === value));

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const update = () => {
      const b = btnRefs.current[idx];
      if (!b) return;
      const W = row.clientWidth;
      const H = row.clientHeight;
      const l = b.offsetLeft;
      const t = b.offsetTop;
      const r = Math.max(0, W - (l + b.offsetWidth));
      const bt = Math.max(0, H - (t + b.offsetHeight));
      setClip(`inset(${t}px ${r}px ${bt}px ${l}px round 999px)`);
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(row);
    return () => ro.disconnect();
  }, [idx, options.length]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    let j = -1;
    const n = options.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = n - 1;
    if (j < 0) return;
    e.preventDefault();
    onChange(options[j].value);
    btnRefs.current[j]?.focus();
  };

  return (
    <div className={`seg ${small ? 'seg-sm' : ''}`} role="radiogroup" aria-label={label}>
      <div className="seg-row" ref={rowRef}>
        <div className="seg-active" aria-hidden="true" style={{ clipPath: clip }} />
        {options.map((o, i) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={i === idx}
            tabIndex={i === idx ? 0 : -1}
            className="seg-btn"
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  display?: string;
  hint?: string;
}) {
  const v = Math.max(min, Math.min(max, value));
  const pct = max > min ? ((v - min) / (max - min)) * 100 : 0;
  const shown = display ?? String(v);
  return (
    <label className="sl">
      <span className="sl-top">
        <span className="sl-label">{label}</span>
        <span className="sl-val">{shown}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        aria-valuetext={shown}
        style={{ ['--p' as string]: `${pct}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint ? <span className="sl-hint">{hint}</span> : null}
    </label>
  );
}

export type Tone = 'info' | 'ok' | 'warn' | 'bad';

/**
 * 反馈：先给一句结论；长解释可展开。
 * aria-live 区域本身保持挂载，只有内部文字换 key 时轻微淡入。
 */
export function Feedback({ tone = 'info', lead, more, k }: { tone?: Tone; lead: React.ReactNode; more?: React.ReactNode; k?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const key = k ?? (typeof lead === 'string' ? lead : undefined);
  return (
    <div className={`fb fb-${tone}`}>
      <div className="fb-live" role="status" aria-live="polite" aria-atomic="true">
        <span key={key} className="fb-lead">
          {lead}
        </span>
      </div>
      {more ? (
        <>
          <button type="button" className="fb-more-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
            {open ? '收起解释' : '展开解释'}
            <i aria-hidden="true" />
          </button>
          <div className="fb-more" id={id} hidden={!open}>
            {more}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** 横向滚动容器：内容溢出时显示“← 左右滑动 →”提示；不裁切内容。 */
export function ScrollX({ children, minWidth, label }: { children: React.ReactNode; minWidth?: number; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOver(el.scrollWidth > el.clientWidth + 2);
    check();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="sx-wrap">
      {over ? (
        <div className="sx-hint" aria-hidden="true">
          ← 左右滑动 →
        </div>
      ) : null}
      <div className="sx" ref={ref} tabIndex={over ? 0 : -1} role={over ? 'region' : undefined} aria-label={over ? label ?? '可横向滚动的内容' : undefined}>
        <div style={minWidth ? { minWidth } : undefined}>{children}</div>
      </div>
    </div>
  );
}

export function Btn({
  children,
  onClick,
  primary,
  disabled,
  label,
  pressed,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  label?: string;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      className={`btn ${primary ? 'btn-primary' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
    >
      {children}
    </button>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string;
  value: T | '';
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  placeholder?: string;
}) {
  return (
    <label className="sel">
      <span className="sel-label">{label}</span>
      <select value={value} onChange={(e) => e.target.value && onChange(e.target.value as T)}>
        {placeholder !== undefined ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** 一组控件 */
export function Controls({ children }: { children: React.ReactNode }) {
  return <div className="ctrls">{children}</div>;
}
