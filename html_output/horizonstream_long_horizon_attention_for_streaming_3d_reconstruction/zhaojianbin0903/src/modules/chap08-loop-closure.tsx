import React, { useState } from 'react';
import { clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { assetPath } from '../lib/assetPath';

export const Chap08LoopClosure: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'base' | 'lc'>('base');
  const [showRegion, setShowRegion] = useState(true);
  const borderAlpha = clamp(showRegion ? 1 : 0, 0, 1);

  return (
    <div className="hs-lc-lab">
      <div className="chip-row" role="group" aria-label="回环闭合设置">
        <button
          type="button"
          className={`chip ${mode === 'base' ? 'selected' : ''}`}
          aria-pressed={mode === 'base'}
          onClick={() => setMode('base')}
        >
          核心模型
        </button>
        <button
          type="button"
          className={`chip ${mode === 'lc' ? 'selected' : ''}`}
          aria-pressed={mode === 'lc'}
          onClick={() => setMode('lc')}
        >
          核心模型 + 可选 LC
        </button>
      </div>

      <label className="hs-check">
        <input
          type="checkbox"
          checked={showRegion}
          onChange={(event) => setShowRegion(event.target.checked)}
        />
        显示论文图中的重访观察区
      </label>

      <div className="hs-lc-figure">
        <img src={assetPath('images/fig-9-loop-closure.png')} alt="原论文 Figure 9 回环闭合效果" />
        <div
          className={`hs-lc-region ${mode === 'lc' ? 'is-lc' : ''}`}
          style={{ opacity: borderAlpha }}
          aria-hidden="true"
        />
      </div>

      <div className={`feedback ${mode === 'lc' ? 'good' : ''}`} aria-live="polite">
        {mode === 'base'
          ? '核心模型用固定状态支持长时在线重建，但精细重访信息仍可能不足。'
          : '加入独立的可选回环模块后，论文报告重访区域的轨迹可进一步优化。'}
      </div>
      <div className="hs-lc-boundary">
        <strong>结论边界：</strong>LC 是可选独立模块，不改变 HorizonStream 核心注意力机制的归属，也不保证解决所有重定位失败。
      </div>

      <style>{`
        .hs-lc-lab{display:grid;gap:12px}.hs-check{display:flex;align-items:center;gap:9px;min-height:44px;color:var(--ink-2);font-size:14px;font-weight:700}.hs-check input{width:20px;height:20px;accent-color:var(--purple)}.hs-lc-figure{position:relative;overflow:hidden;border:1px solid var(--line);border-radius:8px;background:#fff}.hs-lc-figure img{display:block;width:100%;height:auto}.hs-lc-region{position:absolute;left:20%;top:19%;width:59%;height:63%;border:2px solid var(--orange);border-radius:8px;background:rgba(198,106,22,.06);pointer-events:none;transition:opacity 180ms var(--ease-out),border-color 180ms var(--ease-out),background-color 180ms var(--ease-out)}.hs-lc-region.is-lc{border-color:var(--purple);background:rgba(115,87,200,.08)}.hs-lc-boundary{padding:11px 13px;border:1px solid var(--line);border-radius:8px;background:var(--purple-soft);color:var(--ink-2);font-size:14px;line-height:1.55}.hs-lc-boundary strong{color:var(--purple)}@media(prefers-reduced-motion:reduce){.hs-lc-region{transition:none}}
      `}</style>
    </div>
  );
};

export default Chap08LoopClosure;
