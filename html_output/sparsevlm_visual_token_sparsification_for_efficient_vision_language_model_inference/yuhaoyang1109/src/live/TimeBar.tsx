import React from 'react';
import type { Timeline } from './timeline';

// 时间轴控制条：播放 / 暂停、重播、拖动；阶段按钮可点，直接跳到该阶段的开头。
// 减少动态效果时隐藏播放按钮，只保留拖动和阶段按钮（静态查看各阶段）。extra 放速度选择等附加控件。

export interface Phase {
  at: number;
  label: string;
}

export function TimeBar({ tl, phases, label, valueText, extra }: { tl: Timeline; phases?: Phase[]; label: string; valueText?: string; extra?: React.ReactNode }) {
  const cur = phases ? [...phases].reverse().find((ph) => tl.p >= ph.at - 1e-6) : undefined;
  return (
    <div className="lv-tbar">
      <div className="lv-tbar-row">
        {!tl.reduced ? (
          <>
            <button type="button" className="lv-tbar-btn" onClick={tl.playing ? tl.pause : tl.play} aria-label={tl.playing ? '暂停' : '播放'}>
              <span className={`lv-ic ${tl.playing ? 'is-pause' : 'is-play'}`} aria-hidden="true" />
            </button>
            <button type="button" className="lv-tbar-btn" onClick={tl.replay} aria-label="重播">
              <span aria-hidden="true">↺</span>
            </button>
          </>
        ) : null}
        <input
          type="range"
          className="lv-tbar-range"
          min={0}
          max={1000}
          step={1}
          value={Math.round(tl.p * 1000)}
          aria-label={label}
          aria-valuetext={valueText ?? (cur ? `${cur.label}（${Math.round(tl.p * 100)}%）` : `${Math.round(tl.p * 100)}%`)}
          style={{ ['--p' as string]: `${tl.p * 100}%` } as React.CSSProperties}
          onChange={(e) => tl.scrub(Number(e.target.value) / 1000)}
        />
        {extra}
      </div>
      {phases ? (
        <div className="lv-tbar-phases">
          {phases.map((ph) => (
            <button type="button" key={ph.label} className={`lv-ph ${cur?.label === ph.label ? 'is-cur' : ''}`} aria-pressed={cur?.label === ph.label} onClick={() => tl.scrub(Math.min(1, ph.at + 0.001))}>
              {ph.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** 画布容器：宽度由容器决定；画布设 touch-action: pan-y，点按不和纵向滚动冲突。 */
export function StageCanvas({ s, label }: { s: { wrapRef: React.RefObject<HTMLDivElement>; canvasRef: React.RefObject<HTMLCanvasElement> }; label: string }) {
  return (
    <div className="lv-stage" ref={s.wrapRef}>
      <canvas ref={s.canvasRef} role="img" aria-label={label} />
    </div>
  );
}
