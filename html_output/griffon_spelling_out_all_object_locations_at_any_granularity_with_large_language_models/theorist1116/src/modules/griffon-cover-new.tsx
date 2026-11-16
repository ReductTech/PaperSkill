import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

export function GriffonCoverNew(_props: WidgetProps) {
  const { progress } = useCoverPlayback();
  const t = Math.min(1, Math.max(0, (progress - 0.05) / 0.8));
  const show2 = t > 0.25;
  const show3 = t > 0.45;
  const showStr = t > 0.6;
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#f5f8f0' }}>
      <svg viewBox="0 0 640 300" width="100%" height="100%" role="img" aria-label="Griffon 在接触印样上标出全部目标">
        <rect x="20" y="20" width="600" height="220" rx="18" fill="#dfe8d6" stroke="#76906a" />
        <text x="50" y="52" fill="#27446e" fontSize="15" fontWeight="700">接触印样 · Griffon</text>
        <ellipse cx="140" cy="150" rx="28" ry="50" fill="#68778f" />
        <circle cx="140" cy="95" r="18" fill="#21324a" />
        <ellipse cx="260" cy="155" rx="26" ry="46" fill="#68778f" />
        <circle cx="260" cy="105" r="16" fill="#21324a" />
        <rect x="360" y="100" width="90" height="70" rx="6" fill="#92400e" opacity="0.55" />
        <rect x="105" y="70" width="70" height="120" fill="none" stroke="#228d5c" strokeWidth="3" opacity={t > 0.1 ? 1 : 0} />
        {show2 && <rect x="230" y="78" width="64" height="112" fill="none" stroke="#228d5c" strokeWidth="3" />}
        {show3 && <rect x="350" y="92" width="110" height="90" fill="none" stroke="#228d5c" strokeWidth="3" />}
        <text x="105" y="205" fill="#228d5c" fontSize="12" opacity={showStr ? 1 : 0}>
          person-[0.12,0.22,0.28,0.78]&person-[0.34,0.24,0.48,0.76]&bus-[0.55,0.30,0.88,0.70]
        </text>
        <rect x="40" y="250" width="560" height="36" rx="8" fill="#fff" stroke="#d7deea" />
        <text x="56" y="273" fill="#228d5c" fontSize="15">
          {showStr ? '任意粒度 · 拼写出全部目标位置' : '按简报在印样上书写坐标……'}
        </text>
      </svg>
    </div>
  );
}
