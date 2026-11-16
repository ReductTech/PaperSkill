import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, SeaCliffScene, clamp, pct } from './seesr-cover';

type Device = 'ram' | 'dape';
type TagName = '船' | '海' | '崖' | '灯塔' | '鸟' | '飞机';

const TAGS: TagName[] = ['船', '海', '崖', '灯塔', '鸟', '飞机'];
const RAM: Record<TagName, (d: number) => number> = {
  船: (d) => 0.93 - 0.62 * d,
  海: (d) => 0.9 - 0.14 * d,
  崖: (d) => 0.84 - 0.22 * d,
  灯塔: (d) => 0.76 - 0.4 * d,
  鸟: (d) => 0.1 + 0.52 * d,
  飞机: (d) => 0.07 + 0.4 * d,
};
const DAPE: Record<TagName, (d: number) => number> = {
  船: (d) => 0.93 - 0.1 * d,
  海: (d) => 0.9 - 0.04 * d,
  崖: (d) => 0.84 - 0.06 * d,
  灯塔: (d) => 0.76 - 0.12 * d,
  鸟: (d) => 0.1 + 0.07 * d,
  飞机: (d) => 0.07 + 0.05 * d,
};

/** S4 — the same fragment, two "eyes": off-the-shelf tagger vs DAPE. */
export function SeesrDegradeTag(_props: WidgetProps) {
  const [damage, setDamage] = useState(0.85);
  const [device, setDevice] = useState<Device>('ram');

  const table = device === 'ram' ? RAM : DAPE;
  const scores = TAGS.map((name) => ({ name, score: clamp(table[name](damage), 0.01, 0.99) }));
  const by = (name: TagName) => scores.find((item) => item.name === name)!.score;
  const pass = (name: TagName) => by(name) >= 0.5;

  const boat = by('船');
  const wrong = Math.max(by('鸟'), by('飞机'));
  const wrongName: TagName = by('鸟') >= by('飞机') ? '鸟' : '飞机';
  const interpretation = wrong >= 0.5 && wrong > boat
    ? (wrongName === '鸟' ? 'bird' : 'plane')
    : pass('船') ? 'boat' : 'blur';
  const used = interpretation === 'boat' ? '船' : interpretation === 'blur' ? '没有可用标签' : wrongName;

  const feedback = device === 'ram'
    ? damage < 0.4
      ? '退化轻：原始标签模型给出的清单基本正确。'
      : '退化把置信度排序改写了：船被压下去，鸟被抬上来。'
    : damage >= 0.7
      ? 'DAPE 把排序拉回干净摹本：清单仍然可用。'
      : '两者差别不大：退化越重，DAPE 的作用越明显。';
  const tone = device === 'ram' ? (damage < 0.4 ? 'is-mid' : 'is-bad') : damage >= 0.7 ? 'is-good' : 'is-mid';

  return (
    <div className="seesr-scene">
      <div className="seesr-frame" style={{ left: 0, top: 0, width: 620, height: 622 }}>
        <SeaCliffScene interpretation={interpretation} damage={damage} detail={interpretation === 'boat' ? 1 : 0.6} />
        <div className="seesr-frame-note">按清单补绘：{used}</div>
      </div>

      <div className="seesr-panel" style={{ left: 636, top: 0, width: 836, height: 148 }}>
        <label className="seesr-slider">
          <span>退化强度</span>
          <input type="range" min={0} max={1} step={0.01} value={damage}
            onChange={(event) => setDamage(Number(event.target.value))} />
          <b>{pct(damage)}</b>
        </label>
        <div className="seesr-switch" role="group" aria-label="选择鉴定器">
          <button type="button" className={device === 'ram' ? 'is-on' : ''} onClick={() => setDevice('ram')}>原始标签模型 RAM</button>
          <button type="button" className={device === 'dape' ? 'is-on' : ''} onClick={() => setDevice('dape')}>DAPE</button>
        </div>
      </div>

      <div className="seesr-panel" style={{ left: 636, top: 164, width: 836, height: 320 }}>
        <div className="seesr-h">标签置信度（阈值 0.50 · 示意数值）</div>
        <div className="seesr-taglist">
          {scores.map((item) => (
            <div key={item.name} className={`seesr-tagitem ${item.score >= 0.5 ? 'is-pass' : 'is-fail'}`}>
              <b>{item.name}</b>
              <span className="seesr-bar">
                <i style={{ width: pct(item.score), background: item.score >= 0.5 ? C.blue : C.line }} />
                <u style={{ left: '50%' }} />
              </span>
              <b className="seesr-muted">{item.score.toFixed(2)}</b>
              <em className={item.score >= 0.5 ? 'is-pass' : 'is-fail'}>{item.score >= 0.5 ? '通过' : '未通过'}</em>
            </div>
          ))}
        </div>
      </div>

      <div className="seesr-panel seesr-plain" style={{ left: 636, top: 496, width: 836, height: 126 }}>
        <p className={`seesr-feedback ${tone}`} aria-live="polite">{feedback}</p>
      </div>
    </div>
  );
}
