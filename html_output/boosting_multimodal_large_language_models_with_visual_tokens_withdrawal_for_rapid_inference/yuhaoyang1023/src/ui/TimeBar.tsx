import React from 'react';
import type { Timeline } from '../lib/timeline';

// 时间轴控制条：播放 / 暂停、重播、拖动。下方的阶段按钮可点，直接跳到该阶段（按钮换行排列，手机不重叠）。
// 减少动态效果时隐藏播放按钮，只保留拖动（静态表达）。

export interface Phase {
  at: number;
  label: string;
}

export function TimeBar({ tl, phases, label = '动画进度' }: { tl: Timeline; phases?: Phase[]; label?: string }) {
  const cur = phases ? [...phases].reverse().find((ph) => tl.p >= ph.at - 1e-6) : undefined;
  return (
    <div className="tbar">
      {!tl.reduced ? (
        <div className="tbar-btns">
          <button type="button" className="tbar-btn" onClick={tl.playing ? tl.pause : tl.play} aria-label={tl.playing ? '暂停' : '播放'}>
            <span className={`tbar-ic ${tl.playing ? 'is-pause' : 'is-play'}`} aria-hidden="true" />
          </button>
          <button type="button" className="tbar-btn" onClick={tl.replay} aria-label="重播">
            <span className="tbar-ic is-replay" aria-hidden="true">
              ↺
            </span>
          </button>
        </div>
      ) : null}
      <div className="tbar-track">
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={Math.round(tl.p * 1000)}
          aria-label={label}
          aria-valuetext={cur ? `${cur.label}（${Math.round(tl.p * 100)}%）` : `${Math.round(tl.p * 100)}%`}
          style={{ ['--p' as string]: `${tl.p * 100}%` } as React.CSSProperties}
          onChange={(e) => tl.scrub(Number(e.target.value) / 1000)}
        />
        {phases ? (
          <div className="tbar-phases">
            {phases.map((ph) => (
              <button
                type="button"
                key={ph.label}
                className={`tbar-ph ${cur?.label === ph.label ? 'is-cur' : ''}`}
                onClick={() => tl.scrub(Math.min(1, ph.at + 0.001))}
              >
                {ph.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
