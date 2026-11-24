import React, { useEffect, useState } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';

const tasks = ['T1', 'T2', 'T3', 'T4'] as const;
const classes = ['c1', 'c2', 'c3', 'c4'] as const;

export function HideCoverNew() {
  const { progress } = useCoverPlayback();
  const [settled, setSettled] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (progress >= 0.84) setSettled(true);
  }, [progress]);

  const p = settled ? 1 : Math.min(1, progress / 0.84);
  const taskFocus = p < 0.48 ? Math.min(3, Math.floor(p * 8)) : 2;
  const classFocus = p < 0.48 ? 0 : Math.min(3, Math.floor((p - 0.48) * 8));
  const recordReveal = Math.max(0, Math.min(1, (p - 0.7) / 0.24));

  return (
    <div className="hide-cover hide-cover-new">
      <svg viewBox="0 0 664 324" role="img" aria-label="层级显影台用任务提示选择曝光条，再由接触表定位任务与类别并保存三类记录">
        <rect width="664" height="324" className="hide-cover-bg" />
        <rect x="24" y="18" width="616" height="288" rx="8" className="hide-cover-desk" />

        <g>
          <rect x="40" y="55" width="118" height="171" rx="7" className="hide-cover-cabinet" />
          <text x="99" y="73" textAnchor="middle" className="hide-cover-small">冻结底片柜</text>
          {[0, 1, 2].map((rail) => (
            <g key={rail}>
              <path d={`M54 ${91 + rail * 42} H144`} className="hide-cover-rail" />
              <rect x="64" y={99 + rail * 42} width="66" height="27" rx="4" className="hide-cover-negative-small" />
              <path d={`M72 ${116 + rail * 42} l10 -8 l8 5 l9 -11 l12 14`} className="hide-cover-frame-mark" />
            </g>
          ))}
          <rect x="78" y="208" width="43" height="14" rx="4" className="hide-cover-locked-label" />
          <text x="99" y="218" textAnchor="middle" className="hide-cover-locked-text">锁定</text>
        </g>

        <g>
          <path d="M176 139 L218 190 H298 L340 139 Z" className="hide-cover-enlarger-beam" />
          <rect x="200" y="73" width="112" height="58" rx="6" className="hide-cover-enlarger" />
          <circle cx="256" cy="102" r="13" className="hide-cover-enlarger-lens" />
          <text x="256" y="63" textAnchor="middle" className="hide-cover-small">任务提示 eₜ</text>
          <rect x="206" y="205" width="100" height="22" rx="4" className="hide-cover-prompt-strip" />
          {['旧提示', '当前'].map((label, index) => (
            <g key={label}>
              <rect
                x={210 + index * 47}
                y="208"
                width="42"
                height="16"
                rx="3"
                className={index === 1 ? 'hide-cover-prompt-cell is-current' : 'hide-cover-prompt-cell'}
              />
              <text x={231 + index * 47} y="219" textAnchor="middle" className="hide-cover-tiny">{label}</text>
            </g>
          ))}
        </g>

        <g>
          <rect x="354" y="57" width="178" height="113" rx="6" className="hide-cover-contact-sheet" />
          <text x="443" y="45" textAnchor="middle" className="hide-cover-contact-title">接触表 · 已见任务</text>
          {tasks.map((task, row) => (
            <g key={task}>
              <rect
                x="366"
                y={68 + row * 24}
                width="154"
                height="18"
                rx="3"
                className={row === taskFocus ? 'hide-cover-task-row is-focus' : 'hide-cover-task-row'}
              />
              <text x="377" y={81 + row * 24} className="hide-cover-tiny">{task}</text>
              {classes.map((item, col) => (
                <rect
                  key={item}
                  x={400 + col * 28}
                  y={71 + row * 24}
                  width="20"
                  height="12"
                  rx="2"
                  className={
                    row === taskFocus && col === classFocus
                      ? 'hide-cover-class-cell is-focus'
                      : 'hide-cover-class-cell'
                  }
                />
              ))}
            </g>
          ))}
          <circle
            cx={410 + classFocus * 28}
            cy={77 + taskFocus * 24}
            r="13"
            className="hide-cover-loupe-glass"
          />
          <path
            d={`M${423 + classFocus * 28} ${88 + taskFocus * 24} l15 15`}
            className="hide-cover-loupe-handle"
          />
        </g>

        <g transform={`translate(${Math.min(1, p * 2) * (24 + taskFocus * 24)} ${Math.min(1, p * 2) * 10})`} opacity={Math.min(1, p * 2)}>
          <rect x="340" y="177" width="230" height="91" rx="6" className="hide-cover-record-tray" />
          <text x="455" y="194" textAnchor="middle" className="hide-cover-small">不回放旧底片，只保存记录</text>
          {[
            { label: 'WTP', note: '任务内预测' },
            { label: 'TII', note: '任务身份' },
            { label: 'TAP', note: '全类预测' },
          ].map((item, index) => (
            <g key={item.label} opacity={recordReveal}>
              <rect x={352 + index * 71} y="203" width="63" height="52" rx="5" className="hide-cover-record-card" />
              <text x={383 + index * 71} y="225" textAnchor="middle" className="hide-cover-record-label">{item.label}</text>
              <text x={383 + index * 71} y="242" textAnchor="middle" className="hide-cover-tiny">{item.note}</text>
            </g>
          ))}
        </g>

        <g opacity={Math.min(1, Math.max(0, (p - 0.78) / 0.22))}>
          <rect x="550" y="226" width="64" height="25" rx="5" className="hide-cover-success-label" />
          <text x="582" y="243" textAnchor="middle" className="hide-cover-success-text">三层闭环</text>
        </g>
        <text x="616" y="292" textAnchor="end" className="hide-cover-footnote">任务提示 · 统计档案 · 轻量输出</text>
      </svg>
    </div>
  );
}
