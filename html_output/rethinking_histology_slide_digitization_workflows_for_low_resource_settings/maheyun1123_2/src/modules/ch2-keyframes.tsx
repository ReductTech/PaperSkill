import React, { useState } from 'react';
import { Feedback } from './photo-kit';

const stops = [
  { at: 10, tag: '移动中', text: '镜头正在横移' },
  { at: 25, tag: '停顿', text: '稳定帧，保留' },
  { at: 40, tag: '重复', text: '与前一稳定帧重复' },
  { at: 56, tag: '移动中', text: '运动箭头仍明显' },
  { at: 73, tag: '停顿', text: '新角度稳定帧' },
  { at: 90, tag: '重复', text: '重复画面，丢弃' },
];

export function Ch2Keyframes() {
  const [time, setTime] = useState(25);
  const active = stops.reduce((best, stop) => Math.abs(stop.at - time) < Math.abs(best.at - time) ? stop : best, stops[0]);
  const paused = active.tag === '停顿';
  return <div className="photo-page" style={{ display: 'grid', gridTemplateRows: 'minmax(0,1fr) 156px', gap: 18 }}>
    <div className="photo-scene" style={{ padding: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10, height: '100%' }}>
        {stops.map((stop, index) => {
          const selected = Math.abs(stop.at - time) < 6;
          const duplicate = stop.tag === '重复';
          return <button key={stop.at} type="button" onClick={() => setTime(stop.at)}
            className={`photo-button ${selected ? 'is-selected' : ''}`}
            style={{ padding: 8, opacity: duplicate ? .55 : 1, display: 'grid', gridTemplateRows: '1fr auto', gap: 5 }}>
            <div style={{ borderRadius: 9, background: index % 2 ? '#e9e3ec' : '#e3efeb', overflow: 'hidden', padding: 7 }}>
              <svg viewBox="0 0 180 125" aria-hidden="true">
                <rect width="180" height="125" fill="#f7f4ed" />
                <path d="M14 92 C34 32 75 20 106 51 C131 77 146 41 168 67 L168 116 H14Z" fill="#b980a0" opacity={duplicate ? .38 : .72} />
                <path d="M25 35 C50 21 77 18 102 29" fill="none" stroke="#27446e" strokeWidth={paused ? 3 : 7} strokeDasharray={paused ? '' : '9 6'} />
              </svg>
            </div>
            <span style={{ fontSize: 'var(--ppt-body-text)', color: duplicate ? '#9d3d50' : paused ? '#176c45' : '#53697b' }}>{stop.tag}</span>
          </button>;
        })}
      </div>
    </div>
    <div className="photo-panel" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', alignItems: 'center' }}>
      <div>
        <div className="photo-range-label"><span>扫片时间</span><b>{time}%</b></div>
        <input className="photo-range" type="range" min="5" max="95" step="1" value={time}
          aria-label="扫片视频时间轴" onChange={event => setTime(Number(event.target.value))} />
        <div className="photo-legend"><span>光流 → 停顿识别</span><span>画面哈希 → 去重</span><span>稳定新帧 → 待拼接</span></div>
      </div>
      <Feedback tone={active.tag === '重复' ? 'orange' : paused ? 'green' : 'blue'}>
        {active.tag === '重复' ? '与前一稳定帧重复，去重后不重复参与拼接。' : paused ? '检测到停顿帧，进入去重队列。' : '画面仍在移动，保留时间点但不作为稳定停顿帧。'}
      </Feedback>
    </div>
  </div>;
}
