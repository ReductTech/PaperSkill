/* Codex initial draft, 2026-10-21. Non-rendered handoff marker; see sibling MODEL_HANDOFF.md. */
import React from 'react';
import type { WidgetProps } from './registry';
export const VtimeHero: React.FC<WidgetProps> = ({moduleId}) => {
  const fresh = moduleId === 'new';
  return <div className="vt-stage"><svg className="vt-hero-svg" viewBox="0 0 560 150" role="img" aria-label={fresh ? '进度条和高亮区间' : '未标注时间的视频帧'}>
    <rect x="20" y="20" width="520" height="82" rx="16" fill={fresh ? '#e9f3ea' : '#f4e9e9'} stroke="#d7deea"/>
    <rect x="45" y="36" width="112" height="52" rx="9" fill="#dce5d5"/><rect x="224" y="36" width="112" height="52" rx="9" fill="#dce5d5"/><rect x="403" y="36" width="112" height="52" rx="9" fill="#dce5d5"/>
    <circle cx="100" cy="62" r="12" fill="#76906a"/><circle cx="280" cy="62" r="12" fill="#76906a"/><circle cx="459" cy="62" r="12" fill="#76906a"/>
    {fresh ? <><rect x="45" y="112" width="470" height="12" rx="6" fill="#d7deea"/><rect x="259" y="112" width="112" height="12" rx="6" fill="#f07e47"/><circle cx="320" cy="118" r="9" fill="#27446e" stroke="white" strokeWidth="3"/><text x="45" y="145">时间尺</text><text x="430" y="145">高亮区间</text></> : <><text x="45" y="127">画面帧</text><text x="403" y="127">文字答案</text></>}
  </svg></div>;
};