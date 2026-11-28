import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { Camera, FrameStrip, Person, PhotoCard, Room, clamp } from './sceneKit';

export function CoverAdaptive(_props: WidgetProps) {
  const { progress } = useCoverPlayback();
  const readList = progress > 0.16;
  const filled = clamp((progress - 0.34) / 0.46, 0, 1);
  const done = filled > 0.92;
  return (
    <div className="ps-cover">
      <svg viewBox="0 0 700 320" role="img" aria-label="摄影师先看清单，再补拍中间两帧，两张照片之间的空白被填上">
        <Room />
        <g transform="scale(.78 .57)">
          <PhotoCard x={54} y={104} label="照片 1" rotation={-3} variant="a" />
          <PhotoCard x={612} y={104} label="照片 2" rotation={3} variant="b" />
          {done ? (
            <FrameStrip x={306} y={104} labels={['中间 1', '中间 2', '中间 3']} states={['ok', 'ok', 'ok']} width={86} height={120} />
          ) : (
            <g>
              <rect x="306" y="104" width="268" height="166" rx="10" fill="#f2f6fb" stroke="#27446e" strokeWidth="3" strokeDasharray="12 9" />
              <rect x="306" y={104 + 150 * (1 - filled)} width="268" height={150 * filled + 16} rx="8" fill="#dfe8f6" opacity=".85" />
              <text x="440" y="196" textAnchor="middle" fontSize="26" fontWeight="700" fill="#27446e">补拍中…</text>
            </g>
          )}
          <Person x={470} y={520} scale={0.7} tone="#27446e" />
          <Camera x={560} y={452} scale={0.8} />
          {readList ? (
            <g transform="translate(40 392)">
              <rect x="0" y="0" width="250" height="120" rx="10" fill="#f7f4fb" stroke="#7c3aed" strokeWidth="3" />
              <text x="18" y="36" fontSize="24" fontWeight="700" fill="#7c3aed">拍摄清单</text>
              <text x="18" y="72" fontSize="22" fill="#21324a">① 判断要不要补拍</text>
              <text x="18" y="102" fontSize="22" fill="#21324a">② 选「补中间帧」</text>
            </g>
          ) : null}
        </g>
      </svg>
      <div className={`ps-cover-note ${done ? 'is-success' : 'is-info'}`}>{done ? '缺口补上了，可以比较' : '先判断，再决定补拍什么'}</div>
    </div>
  );
}
