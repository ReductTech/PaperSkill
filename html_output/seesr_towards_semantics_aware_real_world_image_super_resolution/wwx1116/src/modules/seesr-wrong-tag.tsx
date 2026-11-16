import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, SeaCliffScene } from './seesr-cover';

type TagKey = 'boat' | 'sea' | 'cliff' | 'lighthouse' | 'bird' | 'plane';
const LABELS: Record<TagKey, string> = { boat: '船', sea: '海', cliff: '崖', lighthouse: '灯塔', bird: '鸟', plane: '飞机' };
const ORDER: TagKey[] = ['boat', 'sea', 'cliff', 'lighthouse', 'bird', 'plane'];

/** S11 — the paper's own failure mode, as a rework on the restoration desk. */
export function SeesrWrongTag(_props: WidgetProps) {
  const [on, setOn] = useState<Set<TagKey>>(new Set<TagKey>(['boat', 'sea', 'cliff', 'lighthouse']));

  const toggle = (key: TagKey) => {
    const next = new Set(on);
    if (next.has(key)) next.delete(key); else next.add(key);
    setOn(next);
  };

  const interpretation = on.has('bird') ? 'bird' : on.has('plane') ? 'plane' : on.has('boat') ? 'boat' : 'blur';
  const missingBackground = ['sea', 'cliff', 'lighthouse'].filter((key) => !on.has(key as TagKey)).length;
  const detail = on.has('boat') ? 0.4 + 0.6 * (1 - missingBackground / 3) : 0.2;

  const feedback = on.has('bird')
    ? '清单里写了“鸟”：修复师照单作画，船被画成了鸟。'
    : on.has('plane')
      ? '清单里写了“飞机”：船被画成了飞机。'
      : !on.has('boat')
        ? '清单漏了“船”：那个位置没有名字，只能留白或糊过去。'
        : missingBackground > 0
          ? '主体有了名字，但背景词缺失：海、崖、灯塔的细节跟着变少。'
          : '清单与残卷一致：船体、窗、栏杆都补回来了。';
  const tone = on.has('bird') || on.has('plane') ? 'is-bad' : !on.has('boat') ? 'is-warn' : missingBackground > 0 ? 'is-mid' : 'is-good';

  return (
    <div className="seesr-scene">
      <div className="seesr-frame" style={{ left: 0, top: 0, width: 660, height: 622 }}>
        <SeaCliffScene interpretation={interpretation} damage={0.9} detail={detail} showLighthouse={on.has('lighthouse')} />
        <div className="seesr-frame-note">返工原因：{on.has('bird') ? '鉴定成鸟' : on.has('plane') ? '鉴定成飞机' : !on.has('boat') ? '清单缺主体' : missingBackground ? '背景词缺失' : '无需返工'}</div>
      </div>

      <div className="seesr-panel" style={{ left: 676, top: 0, width: 796, height: 372 }}>
        <div className="seesr-h">本页标签清单</div>
        <div className="seesr-tagchips">
          {ORDER.map((key) => (
            <button key={key} type="button" className={`seesr-chip ${on.has(key) ? 'is-on' : ''}`}
              onClick={() => toggle(key)} aria-pressed={on.has(key)}>
              <b>{LABELS[key]}</b>
              <span>{on.has(key) ? '✓ 在清单里' : '✗ 未采纳'}</span>
            </button>
          ))}
        </div>
        <p className="seesr-muted">退化 90%：即使 DAPE，也可能给出错误标签；标签与区域的对应也可能不准。</p>
      </div>

      <div className="seesr-panel seesr-plain" style={{ left: 676, top: 388, width: 796, height: 234 }}>
        <p className={`seesr-feedback ${tone}`} aria-live="polite">{feedback}</p>
        <p className="seesr-muted">论文自述的第一项局限：重退化下 DAPE 仍可能预测错误标签，导致物体被错误重建。</p>
        <p className="seesr-muted">第二项局限：退化严重时标签与区域的对应会失准，作者提出引入额外 mask 可能缓解——论文没有给出定量验证。</p>
      </div>
    </div>
  );
}
