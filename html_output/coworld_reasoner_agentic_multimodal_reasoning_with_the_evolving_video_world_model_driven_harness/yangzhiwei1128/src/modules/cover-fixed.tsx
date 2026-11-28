import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { Camera, FrameStrip, Person, PhotoCard, Room, clamp } from './sceneKit';

export function CoverFixed(_props: WidgetProps) {
  const { progress } = useCoverPlayback();
  const shoot = clamp((progress - 0.18) / 0.5, 0, 1);
  const showing = shoot > 0.55;
  return (
    <div className="ps-cover">
      <svg viewBox="0 0 700 320" role="img" aria-label="摄影师只会换机位，两张照片之间的空白始终没有补上">
        <Room />
        <g transform="scale(.78 .57)">
          <PhotoCard x={54} y={104} label="照片 1" rotation={-3} variant="a" />
          <PhotoCard x={612} y={104} label="照片 2" rotation={3} variant="b" />
          <rect x="306" y="104" width="268" height="166" rx="10" fill="#fdf0f2" stroke="#c43f52" strokeWidth="4" strokeDasharray="12 9" />
          <text x="440" y="196" textAnchor="middle" fontSize="34" fontWeight="800" fill="#c43f52">?</text>
          <Person x={470} y={520} scale={0.7} tone="#7a4a3c" />
          <Camera x={560} y={452} scale={0.8} />
          {showing ? <FrameStrip x={300} y={336} labels={['新视角', '新视角', '新视角']} states={['bad', 'bad', 'bad']} width={96} height={64} /> : null}
        </g>
      </svg>
      <div className="ps-cover-note is-fail">{showing ? '换了个机位，还是没拍到两张之间' : '只会一种想象方式'}</div>
    </div>
  );
}
