import React, { useLayoutEffect, useRef, useState } from 'react';
import { Popover } from './Popover';
import { tutorial } from '../data/tutorial';
import { useReducedMotion } from '../lib/hooks';
import type { ContentTag } from '../types';

// 共享 UI 小部件：富文本（证据芯片 / 术语 / 口径标记）、分段切换、滑块、反馈条、横向滚动容器。
// 只依赖 data 与 lib，不依赖 modules/registry，避免循环 import。

const SOURCE_NAME: Record<string, string> = {
  main: '正式版论文（CVPR 2025 Open Access）',
  supp: '补充材料（CVF supplemental）',
  code: '官方代码（固定到 commit 799e2d9）',
  ext: '外部资料',
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
        打开原文 ↗
      </a>
    </Popover>
  );
}

export function Term({ id, label }: { id: string; label?: string }) {
  const g = tutorial.glossary?.[id];
  if (!g) return <>{label ?? id}</>;
  return (
    <Popover
      as="span"
      trigger={label ?? g.term}
      triggerClass="term"
      triggerLabel={`术语：${g.term}`}
      title={`术语：${g.term}`}
    >
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
  demo: { label: '教学示意', desc: '为讲解而绘制或生成的示意数据，不是论文或模型的真实数据。' },
  extrap: { label: '公式外推', desc: '按论文公式或官方代码计算得到，论文本身没有报告这个数字或配置。' },
  paper: { label: '论文实测', desc: '直接取自论文正文、表格或图（正式版或补充材料），未经修改。' },
  code: { label: '代码事实', desc: '直接取自官方仓库固定 commit 中的代码，附行号链接。' },
};

export function Tag({ kind }: { kind: ContentTag }) {
  const info = TAG_INFO[kind];
  return (
    <Popover
      as="span"
      trigger={info.label}
      triggerClass={`ctag ctag-${kind}`}
      triggerLabel={`内容口径：${info.label}`}
      title={`内容口径：${info.label}`}
    >
      <div className="pop-kicker">内容口径</div>
      <div className="pop-title">{info.label}</div>
      <p className="pop-p">{info.desc}</p>
    </Popover>
  );
}

const RE = /\[\[(ev|t|tag):([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|`([^`]+)`/g;

/** 轻量富文本：[[ev:键|标签]] 证据芯片、[[t:键|文字]] 术语、[[tag:demo]] 口径标记、**粗体**、`代码`。 */
export function Rich({ text, plain }: { text: string; plain?: boolean }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  RE.lastIndex = 0;
  while ((m = RE.exec(text)) !== null) {
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
    last = RE.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

export function P({ text, className }: { text: string; className?: string }) {
  return (
    <p className={className}>
      <Rich text={text} />
    </p>
  );
}

// ---------------------------------------------------------------------------
// 分段切换：选中指示器用 clip-path 过渡（复制一层“选中样式”的按钮行，裁剪到当前项）。
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
    const b = btnRefs.current[idx];
    if (!row || !b) return;
    const update = () => {
      const W = row.scrollWidth;
      const H = row.scrollHeight;
      const l = b.offsetLeft;
      const t = b.offsetTop;
      const r = W - (l + b.offsetWidth);
      const bt = H - (t + b.offsetHeight);
      setClip(`inset(${t}px ${r}px ${bt}px ${l}px round 999px)`);
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(update);
    ro.observe(row);
    return () => ro.disconnect();
  }, [idx, options.length]);

  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = options.length;
    const j = e.key === 'ArrowRight' ? (i + 1) % n : (i - 1 + n) % n;
    onChange(options[j].value);
    btnRefs.current[j]?.focus();
  };

  return (
    <div className={`seg ${small ? 'seg-sm' : ''}`} role="radiogroup" aria-label={label}>
      <div className="seg-scroll">
        <div className="seg-row" ref={rowRef}>
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
          <div className="seg-row seg-active" aria-hidden="true" style={{ clipPath: clip }}>
            {options.map((o) => (
              <span key={String(o.value)} className="seg-btn">
                {o.label}
              </span>
            ))}
          </div>
        </div>
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
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="sl">
      <span className="sl-top">
        <span className="sl-label">{label}</span>
        <span className="sl-val">{display ?? value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display ?? String(value)}
        style={{ ['--p' as string]: `${pct}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint ? <span className="sl-hint">{hint}</span> : null}
    </label>
  );
}

export function Feedback({ tone = 'info', children }: { tone?: 'info' | 'good' | 'warn' | 'bad'; children: React.ReactNode }) {
  // 文字变化时轻微淡入（不重新挂载，保持 aria-live 区域稳定）
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef('');
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const txt = el.textContent || '';
    if (prev.current && prev.current !== txt && !reduced && typeof el.animate === 'function') {
      el.animate(
        [
          { opacity: 0.35, transform: 'translateY(3px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 340, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
      );
    }
    prev.current = txt;
  });
  return (
    <div ref={ref} className={`fb fb-${tone}`} role="status" aria-live="polite">
      {children}
    </div>
  );
}

/** 横向滚动容器：内容溢出时显示“← 左右滑动查看完整画面 →” */
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
    return () => ro.disconnect();
  }, []);
  return (
    <div className="sx-wrap">
      {over ? <div className="sx-hint">← 左右滑动查看完整画面 →</div> : null}
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button type="button" className={`btn ${primary ? 'btn-primary' : ''}`} onClick={onClick} disabled={disabled} aria-label={label}>
      {children}
    </button>
  );
}

/** 模块内的小型“口径”标记行 */
export function Tags({ kinds }: { kinds: ContentTag[] }) {
  return (
    <span className="ctags">
      {kinds.map((k) => (
        <Tag key={k} kind={k} />
      ))}
    </span>
  );
}
