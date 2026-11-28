import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { PhotoCard, Person, Room } from './sceneKit';

type Question = 'view' | 'between' | 'after';

const TABS: { key: Question; label: string }[] = [
  { key: 'view', label: '换个视角看会怎样' },
  { key: 'between', label: '两张之间发生了什么' },
  { key: 'after', label: '接下来会怎样' },
];

const FEEDBACK: Record<Question, string> = {
  view: '画面外的一切都没有被记录：相机背后长什么样，只能猜。',
  between: '两张照片之间没有留下任何一帧，中间发生了什么，只能猜。',
  after: '照片停在松手前一刻，之后的结果，只能猜。',
};

export function S1Unseen(_props: WidgetProps) {
  const [active, setActive] = useState<Question>('between');
  const [seen, setSeen] = useState<Record<Question, boolean>>({ view: false, between: true, after: false });
  const pick = (key: Question) => {
    setActive(key);
    setSeen(prev => ({ ...prev, [key]: true }));
  };
  const allSeen = seen.view && seen.between && seen.after;
  const slot = (key: Question, x: number, y: number, w: number, h: number, label: string) => {
    const on = active === key;
    return (
      <g key={key} opacity={on ? 1 : 0.42}>
        <rect x={x} y={y} width={w} height={h} rx="10" fill={on ? '#fdf0f2' : '#f4f5f7'} stroke="#c43f52" strokeWidth={on ? 4 : 2} strokeDasharray="12 9" />
        <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle" fontSize={on ? 28 : 24} fontWeight="700" fill="#c43f52">{label}</text>
      </g>
    );
  };
  return (
    <div className="ps-page s1-page">
      <div className="ps-scene">
        <svg viewBox="0 0 900 560" role="img" aria-label="桌面上放着两张照片，照片外、两张之间、照片之后各有一块没有记录的区域">
          <Room />
          <PhotoCard x={54} y={104} label="照片 1" rotation={-3} variant="a" />
          <PhotoCard x={612} y={104} label="照片 2" rotation={3} variant="b" />
          {slot('between', 306, 104, 268, 166, '两张之间')}
          {slot('view', 54, 330, 210, 132, '画面之外')}
          {slot('after', 612, 330, 210, 132, '下一秒')}
          <Person x={470} y={524} scale={0.78} />
          <g transform="translate(300 330)">
            <rect x="0" y="0" width="250" height="96" rx="16" fill="#fdf0f2" stroke="#c43f52" strokeWidth="3" />
            <text x="125" y="38" textAnchor="middle" fontSize="24" fontWeight="700" fill="#c43f52">只靠两张照片</text>
            <text x="125" y="74" textAnchor="middle" fontSize="24" fontWeight="700" fill="#c43f52">这里只能猜</text>
          </g>
        </svg>
      </div>
      <aside className="ps-aside">
        <strong className="ps-aside-title">问题落在没拍到的地方</strong>
        <p className="ps-copy">照片只记录已观测的像素。换一个问题问，缺的就是另一种证据。</p>
        <div className="ps-tabs" role="tablist" aria-label="三种提问方式">
          {TABS.map(tab => (
            <button key={tab.key} role="tab" aria-selected={active === tab.key}
              className={`ps-tab ${active === tab.key ? 'is-on' : ''}`} onClick={() => pick(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className={`ps-feedback ${allSeen ? 'is-success' : 'is-fail'}`} aria-live="polite">
          {allSeen ? '三个问题，缺的是三种不同的证据：视角、中间状态、后续结果。' : FEEDBACK[active]}
        </div>
      </aside>
    </div>
  );
}
