import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';

export function GriffonCoverOld(_props: WidgetProps) {
  const { progress } = useCoverPlayback();
  const t = Math.min(1, Math.max(0, (progress - 0.05) / 0.8));
  const boxW = 70 + t * 20;
  const boxH = 110 + t * 10;
  const miss = t > 0.45;
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#f5f8f0' }}>
      <svg viewBox="0 0 640 300" width="100%" height="100%" role="img" aria-label="单目标模式只框一个人，其他人漏检">
        <rect x="20" y="20" width="600" height="220" rx="18" fill="#dfe8d6" stroke="#76906a" />
        <rect x="40" y="40" width="180" height="140" rx="8" fill="#c5d4b4" />
        <text x="50" y="62" fill="#68778f" fontSize="14">拍摄棚 · 旧法</text>
        {/* people silhouettes */}
        <ellipse cx="120" cy="150" rx="28" ry="50" fill="#68778f" />
        <circle cx="120" cy="95" r="18" fill="#21324a" />
        <ellipse cx="220" cy="155" rx="26" ry="46" fill="#8a97ab" opacity={miss ? 0.35 : 0.9} />
        <circle cx="220" cy="105" r="16" fill="#68778f" opacity={miss ? 0.35 : 0.9} />
        <ellipse cx="320" cy="158" rx="24" ry="44" fill="#8a97ab" opacity={miss ? 0.35 : 0.9} />
        <circle cx="320" cy="110" r="15" fill="#68778f" opacity={miss ? 0.35 : 0.9} />
        {/* single orange box */}
        <rect x={120 - boxW / 2} y={70} width={boxW} height={boxH} fill="none" stroke="#f07e47" strokeWidth="3" />
        <text x="90" y="195" fill="#f07e47" fontSize="13">person-[…]</text>
        {miss && (
          <>
            <text x="200" y="200" fill="#c43f52" fontSize="14" fontWeight="700">漏检</text>
            <text x="300" y="200" fill="#c43f52" fontSize="14" fontWeight="700">漏检</text>
          </>
        )}
        <rect x="40" y="250" width="560" height="36" rx="8" fill="#fff" stroke="#d7deea" />
        <text x="56" y="273" fill="#c43f52" fontSize="15">
          {miss ? '只能框一个已存在目标 · 多目标失败' : '正在尝试单目标 REC……'}
        </text>
      </svg>
    </div>
  );
}
