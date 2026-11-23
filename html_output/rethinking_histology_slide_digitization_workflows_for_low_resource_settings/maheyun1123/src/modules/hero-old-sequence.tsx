import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { CameraGlyph, clamp } from './photo-kit';

export function HeroOldSequence() {
  const { progress } = useCoverPlayback();
  const p = clamp(progress, 0, 1);
  const x = 124 + p * 170;
  const cost = 70 + p * 55;
  return <div className="photo-cover">
    <svg viewBox="0 0 640 300" role="img" aria-label="昂贵的自动扫描设备缓慢完成切片扫描">
      <rect width="640" height="300" fill="#edf1f2" />
      <path d="M0 236 Q170 212 340 238 T640 226 V300 H0Z" fill="#b8c9a7" />
      <rect x="76" y="59" width="468" height="158" rx="23" fill="#dce3e7" stroke="#8297a5" strokeWidth="4" />
      <rect x="111" y="86" width="398" height="88" rx="12" fill="#fffdf7" />
      <g transform={`translate(${x} 122) scale(.58)`}><CameraGlyph mode="scanner" /></g>
      <path d="M126 90 H460" stroke="#27446e" strokeWidth="7" strokeLinecap="round" opacity={.35 + p * .3} />
      <g transform="translate(108 250)">
        <rect width="273" height="25" rx="12" fill="#fffdf7" />
        <rect width={Math.round(36 + p * 226)} height="25" rx="12" fill="#c43f52" />
      </g>
      <g transform="translate(476 226)">
        <circle r="28" fill="#fffdf7" stroke="#c43f52" strokeWidth="4" />
        <path d="M0 -13 V14 M-8 -6 Q0 -15 9 -6 M-8 5 Q0 14 9 4" fill="none" stroke="#a33a49" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
    <span className="photo-cover-mini-label is-cost">成本</span>
    <span className="photo-cover-mini-label is-price">{Math.round(cost)}k+</span>
    <div className="photo-cover-outcome">{p < .78 ? '精确扫描，设备与运维成本持续上升' : '可获得高质量扫描，但基层部署困难'}</div>
  </div>;
}
