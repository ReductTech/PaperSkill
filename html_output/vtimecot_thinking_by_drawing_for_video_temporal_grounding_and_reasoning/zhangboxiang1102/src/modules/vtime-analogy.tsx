/* Codex initial draft, 2026-10-21. Non-rendered handoff marker; see sibling MODEL_HANDOFF.md. */
import React from 'react';
import type { WidgetProps } from './registry';
export const VtimeAnalogy: React.FC<WidgetProps> = ({chapterId}) => {
  const mark = 322 + (Number(chapterId.replace('chap-',''))%3)*8;
  return <svg className="vt-analogy-svg" viewBox="0 0 560 140" role="img" aria-label="观众沿视频进度条定位目标片段">
    <rect x="18" y="14" width="524" height="112" rx="18" fill="#f5f8f0" stroke="#d7deea"/>
    <rect x="64" y="34" width="128" height="50" rx="10" fill="#e4ebdf" stroke="#b8c9a7"/>
    <circle cx="126" cy="57" r="12" fill="#76906a"/>
    <text x="92" y="105">视频帧</text><text x="388" y="105">时间尺</text>
    <line x1="250" y1="68" x2="488" y2="68" stroke="#92400e" strokeWidth="5" strokeLinecap="round"/>
    <rect x={mark} y="59" width="62" height="18" rx="9" fill="#f07e47" opacity=".75"/>
    <circle className="vt-analogy-marker" cx="264" cy="68" r="10" fill="#27446e" stroke="#fff" strokeWidth="3"/>
  </svg>;
};
