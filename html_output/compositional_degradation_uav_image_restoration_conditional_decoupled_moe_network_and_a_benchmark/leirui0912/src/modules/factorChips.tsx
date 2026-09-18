import React from 'react';
import { DEGRADATIONS } from './uavScene';

// 退化因子开关组：封面两侧与第 1 章的退化识别器共用同一个组件，
// 保证「同一个控件在页面上任何位置长得一样」。
//
// 样式沿用框架 components.css 的 .chip / .chip.selected，只补两处内联样式：
//   · 选中底色不能直接用因子本色；
//   · 近白色色块在白卡片上要描边才看得见。
// 两处都是框架样式覆盖不到的，理由见下面各自的注释。

/**
 * 选中态底色：把因子色按比例压暗到相对亮度 ≤ 0.18，保证白字对比度 ≥ 4.5:1。
 * 直接拿因子本色当选中底色时，「雪」(#e2e8f0) 这类近白色在白卡片上等于没有选中反馈。
 */
export function readableBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const rel = (k: number) => 0.2126 * lin(r * k) + 0.7152 * lin(g * k) + 0.0722 * lin(b * k);
  let k = 1;
  while (k > 0.3 && rel(k) > 0.18) k -= 0.02;
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v * k)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

export const FactorChips: React.FC<{
  active: string[];
  onToggle: (id: string) => void;
  /**
   * 是否给按钮加选中态。关掉后按钮外观完全不变，反馈只由照片本身承担
   * （`aria-pressed` 照旧更新，读屏软件仍能播报当前选中的因子）。
   */
  showSelection?: boolean;
  /** 传入则在末尾附一个「清除」按钮，一次清空全部已选退化。 */
  onClear?: () => void;
}> = ({ active, onToggle, showSelection = true, onClear }) => (
  <div className="chip-row">
    {DEGRADATIONS.map((d) => {
      const on = active.includes(d.id);
      const bg = readableBg(d.color);
      const lit = on && showSelection;
      return (
        <button
          key={d.id}
          type="button"
          className={`chip${lit ? ' selected' : ''}`}
          aria-pressed={on}
          onClick={() => onToggle(d.id)}
          style={lit ? { background: bg, borderColor: bg, color: '#fff' } : undefined}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 3,
              background: d.color,
              // 「雪」这类近白色块在白底上几乎看不见，描一圈边保证可辨
              boxShadow: 'inset 0 0 0 1px rgba(33,50,74,0.35)',
              display: 'inline-block',
            }}
          />
          {d.name}
        </button>
      );
    })}

    {onClear && (
      // 不带色块，读起来就是个动作而不是第 9 个退化因子
      <button
        type="button"
        className="chip"
        onClick={onClear}
        disabled={active.length === 0}
        title={active.length ? '清除全部退化' : '当前没有选中的退化'}
        style={{
          borderStyle: 'dashed',
          // .chip 没有定义 :disabled 样式，不自己压暗的话禁用态与可点态一模一样
          opacity: active.length ? 1 : 0.4,
          cursor: active.length ? 'pointer' : 'not-allowed',
        }}
      >
        清除
      </button>
    )}
  </div>
);

export default FactorChips;
