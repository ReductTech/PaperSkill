/* Tutorial illustration refined 2026-10-22; all scenes below are synthetic. */
import React from 'react';

export function keepRangeKeysLocal(event: React.KeyboardEvent<HTMLElement>) {
  if (event.target instanceof HTMLInputElement && event.target.type === 'range' && event.key.startsWith('Arrow')) {
    event.stopPropagation();
  }
}

export const eventAt = (seconds: number) => seconds < 20
  ? '走向关闭的门'
  : seconds <= 38 ? '握住把手，向外打开门' : '穿过门口，门保持打开';

export function VtimeFrame({ seconds = 24, annotated = false, highlighted = false }: {
  seconds?: number; annotated?: boolean; highlighted?: boolean;
}) {
  const opening = seconds >= 20;
  const x = seconds < 20 ? 105 + seconds * 3 : seconds > 38 ? 245 : 180;
  return <div className="vt-evidence-frame">
    <svg viewBox="0 0 420 172" role="img" aria-label={`教学示意：${eventAt(seconds)}`}>
      <rect width="420" height="172" rx="12" fill="#f5f8f0" />
      <path d="M24 146H396" stroke="#b8c9a7" strokeWidth="2" />
      <path d="M246 146V24H322V146" fill="#e5eddf" stroke="#76906a" strokeWidth="3" />
      <path d={opening ? 'M248 28L288 45V146H248Z' : 'M248 28H319V146H248Z'} fill={opening ? '#c1d5bd' : '#d8e3ce'} stroke="#76906a" strokeWidth="2" />
      <circle cx={opening ? 279 : 307} cy="93" r="3" fill="#92400e" />
      <circle cx={x} cy="67" r="12" fill="#e6bc98" />
      <path d={`M${x} 81V117M${x} 88L${x + 28} 102L${opening ? 248 : x + 42} ${opening ? 93 : 105}M${x} 89L${x - 18} 106M${x} 117L${x - 17} 145M${x} 117L${x + 16} 145`} fill="none" stroke="#27446e" strokeWidth="5" strokeLinecap="round" />
      <rect x="20" y="16" width="92" height="24" rx="12" fill="#fff" />
      <text x="66" y="33" textAnchor="middle" fill="#68778f" fontSize="12">教学场景</text>
      {annotated && <><rect x="20" y="151" width="380" height="7" rx="3.5" fill="#d7deea" />
        <rect x="20" y="151" width={380 * seconds / 60} height="7" rx="3.5" fill="#27446e" />
        {highlighted && <rect x={20 + 380 / 3} y="149" width="114" height="11" rx="5" fill="#f07e47" />}
        <circle cx={20 + 380 * seconds / 60} cy="154.5" r="5.5" fill="#27446e" stroke="#fff" strokeWidth="2" />
        <text x="390" y="33" textAnchor="end" fill="#27446e" fontWeight="700" fontSize="13">{seconds.toFixed(0)}s / 60s</text></>}
    </svg>
  </div>;
}
