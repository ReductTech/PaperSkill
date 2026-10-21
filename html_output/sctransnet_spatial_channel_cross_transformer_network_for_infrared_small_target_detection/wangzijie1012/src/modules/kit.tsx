import React, { useEffect, useRef } from 'react';
import { observeCanvas } from '../lib/canvasKit';

// 共享的交互组件与绘图常量。所有模块从这里取颜色与控件，保证全篇视觉一致。
// 颜色语义（contract §5）：蓝 = 当前状态 / 引导；绿 = 本文方法 / 正确；红 = 旧方法 / 错误；
// 橙 = 学习者控制的强调（阈值、选中项）；紫 = 辅助机制。深色底板上使用对应的提亮色。

export const C = {
  ink: '#1b222c',
  ink2: '#3d4754',
  muted: '#6a7480',
  faint: '#9aa2ab',
  line: '#e2ded4',
  line2: '#cbc5b8',
  paper: '#fffefa',
  paper2: '#f5f3ed',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#e8743b',
  purple: '#6d4fc2',
  // 深色底板（红外图像、类比场景）
  plate: '#0f141b',
  plate2: '#161d26',
  plateLine: '#2a3440',
  plateText: '#d4dbe3',
  plateMuted: '#808c99',
  blueD: '#8db4e6',
  greenD: '#4fc690',
  redD: '#ff7486',
  orangeD: '#ffa06a',
  purpleD: '#b39cf2',
};

export const FONT_SANS =
  '"Segoe UI", "PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans SC", sans-serif';
export const FONT_SERIF = 'Georgia, "Cambria", "Times New Roman", "Songti SC", "SimSun", serif';
export const FONT_MONO = '"Cascadia Code", "JetBrains Mono", "SFMono-Regular", Consolas, monospace';

export type Tone = 'info' | 'good' | 'bad' | 'warn';

export function Feedback({ tone = 'info', children }: { tone?: Tone; children: React.ReactNode }) {
  const cls = tone === 'good' ? 'feedback good' : tone === 'bad' ? 'feedback bad' : `feedback sx-fb-${tone}`;
  return (
    <div className={cls} role="status" aria-live="polite">
      {children}
    </div>
  );
}

export interface ChipOption<T> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
  title?: string;
}

export function Chips<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="sx-chips" role="group" aria-label={label}>
      {label ? <span className="sx-chips-label">{label}</span> : null}
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={`chip ${o.value === value ? 'selected' : ''}`}
          aria-pressed={o.value === value}
          disabled={o.disabled}
          title={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export interface ReadoutItem {
  k: React.ReactNode;
  v: React.ReactNode;
  unit?: string;
  tone?: 'blue' | 'green' | 'red' | 'orange' | 'muted';
}

export function Readouts({ items, cols }: { items: ReadoutItem[]; cols?: number }) {
  return (
    <div className="sx-readouts" style={{ gridTemplateColumns: `repeat(${cols ?? items.length}, minmax(0, 1fr))` }}>
      {items.map((it, i) => (
        <div className={`sx-readout ${it.tone ? 'tone-' + it.tone : ''}`} key={i}>
          <div className="sx-readout-k">{it.k}</div>
          <div className="sx-readout-v">
            {it.v}
            {it.unit ? <span className="sx-unit">{it.unit}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/** 页脚出处：说明数字或图来自原文的哪里，或说明这是示意。 */
export function Source({ children }: { children: React.ReactNode }) {
  return <div className="sx-source">{children}</div>;
}

export function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  display,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  display: React.ReactNode;
}) {
  return (
    <div className="ctrl sx-ctrl">
      <label>
        <span>{label}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="val">{display}</span>
    </div>
  );
}

export function Stepper({
  step,
  total,
  onStep,
  labels,
}: {
  step: number;
  total: number;
  onStep: (s: number) => void;
  labels?: string[];
}) {
  return (
    <div className="sx-stepper">
      <button type="button" className="tiny ghost" onClick={() => onStep(Math.max(0, step - 1))} disabled={step === 0}>
        ← 上一步
      </button>
      <div className="sx-stepper-track" role="tablist">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === step}
            className={`sx-dot ${i === step ? 'on' : i < step ? 'done' : ''}`}
            onClick={() => onStep(i)}
            title={labels ? labels[i] : `第 ${i + 1} 步`}
          >
            <span>{i + 1}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="tiny"
        onClick={() => onStep(Math.min(total - 1, step + 1))}
        disabled={step === total - 1}
      >
        {step === total - 1 ? '已到最后' : '下一步 →'}
      </button>
    </div>
  );
}

/** 原文图片的框架：图片 + 图注 + 出处。 */
export function PaperImage({
  src,
  alt,
  caption,
  maxWidth,
}: {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <figure className="sx-figure" style={maxWidth ? { maxWidth } : undefined}>
      <img src={src} alt={alt} loading="lazy" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

/**
 * HiDPI Canvas 钩子。draw 在依赖变化时调用；若 animate=true，则在可见时以 rAF 循环调用 draw(t)。
 * 返回 ref，挂在 <canvas> 上。
 */
export function useCanvas(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, t: number) => void,
  deps: React.DependencyList,
  animate = false
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxRef.current = ctx;
    canvas.classList.add('is-ready');
    if (!animate) {
      drawRef.current(ctx, 0);
      return;
    }
    let raf = 0;
    let running = false;
    const t0 = performance.now();
    const loop = (now: number) => {
      if (!running) return;
      drawRef.current(ctx, (now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      drawRef.current(ctx, 2.5);
      return;
    }
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, animate]);

  useEffect(() => {
    if (!animate && ctxRef.current) drawRef.current(ctxRef.current, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

export function fmt(n: number, d = 2) {
  if (!isFinite(n)) return '—';
  return n.toFixed(d);
}

/** 1234567 → "1,234,567" */
export function group(n: number) {
  return Math.round(n).toLocaleString('en-US');
}

/** 用于 SVG 的箭头标记定义。 */
export function ArrowDefs({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,1 L9,5 L0,9 z" fill={color} />
    </marker>
  );
}

/** 小号“依据”标签，用在正文句尾。 */
export function Ref({ children }: { children: React.ReactNode }) {
  return <span className="sx-ref">{children}</span>;
}
