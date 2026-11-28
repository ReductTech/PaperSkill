import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { FrameStrip, PhotoCard, Room } from './sceneKit';

const PHOTOS = [
  { key: 'p1', label: '照片 1', variant: 'a' as const },
  { key: 'p2', label: '照片 2', variant: 'b' as const },
];

export function S4Request(_props: WidgetProps) {
  const [first, setFirst] = useState(1);
  const [keepAnchor, setKeepAnchor] = useState(false);
  const [keepIdentity, setKeepIdentity] = useState(true);
  const orderCorrect = first === 0;
  const second = first === 0 ? 1 : 0;
  const usable = orderCorrect && keepAnchor && keepIdentity;
  const frames = ['第 1 帧', '第 2 帧', '第 3 帧'];
  const states: ('ok' | 'bad' | 'idle')[] = usable
    ? ['ok', 'ok', 'ok']
    : orderCorrect ? ['ok', 'ok', 'idle'] : ['ok', 'bad', 'bad'];
  const feedback = !orderCorrect
    ? '请求绑错了源图：生成的片段换了房间角落，和输入对不上。'
    : !keepAnchor ? '没声明保持背景锚点：背景被改写，无法与原图比较。'
      : !keepIdentity ? '没声明保持物体身份：主体被替换成了另一个物体。'
        : '顺序与条件都对：三段画面可以拿来比较。';
  const tone = usable ? 'is-success' : orderCorrect ? 'is-warn' : 'is-fail';
  return (
    <div className="ps-page s4-page">
      <div className="ps-scene">
        <svg viewBox="0 0 520 470" role="img" aria-label="两张源照片，点击可交换顺序">
          <Room />
          <g role="button" tabIndex={0} aria-label="把照片 1 设为第一张" className="ps-card-btn"
            onClick={() => setFirst(0)} onKeyDown={event => { if (event.key === 'Enter') setFirst(0); }}>
            <PhotoCard x={54} y={70} label="照片 1" rotation={-2} variant="a" />
            {first === 0 ? <circle cx="70" cy="86" r="17" fill="#27446e" /> : null}
            {first === 0 ? <text x="70" y="94" textAnchor="middle" fontSize="20" fontWeight="700" fill="#ffffff">1</text> : null}
          </g>
          <g role="button" tabIndex={0} aria-label="把照片 2 设为第一张" className="ps-card-btn"
            onClick={() => setFirst(1)} onKeyDown={event => { if (event.key === 'Enter') setFirst(1); }}>
            <PhotoCard x={256} y={240} label="照片 2" rotation={2} variant="b" />
            {first === 1 ? <circle cx="272" cy="256" r="17" fill="#27446e" /> : null}
            {first === 1 ? <text x="272" y="264" textAnchor="middle" fontSize="20" fontWeight="700" fill="#ffffff">1</text> : null}
          </g>
          <text x="250" y="450" textAnchor="middle" fontSize="22" fill="#68778f">点一张照片设为 Picture 1</text>
        </svg>
      </div>
      <div className="ps-right">
        <div className="ps-note">
          <div className="ps-note-line">先参考：{PHOTOS[first].label}</div>
          <div className="ps-note-line">再参考：{PHOTOS[second].label}</div>
          <label className="ps-toggle">
            <input type="checkbox" checked={keepAnchor} onChange={event => setKeepAnchor(event.target.checked)} />
            <span>保持背景锚点</span>
          </label>
          <label className="ps-toggle">
            <input type="checkbox" checked={keepIdentity} onChange={event => setKeepIdentity(event.target.checked)} />
            <span>保持物体身份</span>
          </label>
        </div>
        <div className="ps-strip">
          <svg viewBox="0 0 520 170" role="img" aria-label="请求生成的片段">
            <FrameStrip x={6} y={6} labels={frames} states={states} width={156} height={100} dashed={!usable} />
          </svg>
        </div>
        <div className={`ps-feedback ${tone}`} aria-live="polite">{feedback}</div>
      </div>
    </div>
  );
}
