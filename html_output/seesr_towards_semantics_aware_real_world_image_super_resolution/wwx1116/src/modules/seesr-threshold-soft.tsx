import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, SeaCliffScene, clamp, pct } from './seesr-cover';

type TagName = '船' | '海' | '崖' | '灯塔' | '鸟' | '飞机';
const TAGS: TagName[] = ['船', '海', '崖', '灯塔', '鸟', '飞机'];
const SCORE: Record<TagName, number> = { 船: 0.403, 海: 0.781, 崖: 0.653, 灯塔: 0.42, 鸟: 0.542, 飞机: 0.41 };
const REAL: TagName[] = ['船', '海', '崖', '灯塔'];
const WRONG: TagName[] = ['鸟', '飞机'];

/** S5 — a threshold can trade misses for false tags, but cannot repair the ranking. */
export function SeesrThresholdSoft(_props: WidgetProps) {
  const [threshold, setThreshold] = useState(0.35);

  const pass = (name: TagName) => SCORE[name] >= threshold;
  const hits = REAL.filter(pass).length;
  const fp = WRONG.filter(pass).length;
  const boat = pass('船');
  const lighthouse = pass('灯塔');
  const wrongName: TagName = SCORE['鸟'] >= SCORE['飞机'] ? '鸟' : '飞机';
  const wrongPass = pass(wrongName) && SCORE[wrongName] > SCORE['船'];
  const interpretation = wrongPass ? (wrongName === '鸟' ? 'bird' : 'plane') : boat ? 'boat' : 'blur';
  const detail = boat ? (lighthouse ? 1 : 0.55) : 0.2;

  const feedback = fp > 0 && hits >= 3
    ? '标签放得太松：清单里混进了鸟和飞机，补绘对象被带偏。'
    : fp > 0
      ? '船被筛掉了，鸟却还在：阈值改不了错误的排序。'
      : fp === 0 && boat && hits >= 2
        ? '清单干净且覆盖主要物体：船的细节回来了。'
        : fp === 0 && !boat && hits >= 2
          ? '画面干净了，但船的细节也没了：只剩海和崖。'
          : '几乎没有可用标签：只剩软提示在支撑。';
  const tone = fp > 0 ? 'is-bad' : boat ? 'is-good' : 'is-warn';

  return (
    <div className="seesr-scene">
      <div className="seesr-panel seesr-clipboard" style={{ left: 0, top: 0, width: 560, height: 622 }}>
        <div className="seesr-h">修复工作单</div>
        <p className="seesr-muted">退化 85% · 原始标签模型 · 阈值 {threshold.toFixed(2)}</p>
        <div className="seesr-taglist is-tall">
          {TAGS.map((name) => (
            <div key={name} className={`seesr-tagitem ${pass(name) ? 'is-pass' : 'is-fail'}`}>
              <b>{name}</b>
              <span className="seesr-bar">
                <i style={{ width: pct(SCORE[name]), background: pass(name) ? C.blue : C.line }} />
                <u style={{ left: pct(threshold) }} />
              </span>
              <b className="seesr-muted">{SCORE[name].toFixed(2)}</b>
            </div>
          ))}
        </div>
        <p className="seesr-muted">橙色刻线就是阈值：它在置信度上平移，不改变排序。</p>
      </div>

      <div className="seesr-panel" style={{ left: 576, top: 0, width: 896, height: 250 }}>
        <label className="seesr-slider">
          <span>标签阈值</span>
          <input type="range" min={0.3} max={0.9} step={0.01} value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))} />
          <b>{threshold.toFixed(2)}</b>
        </label>
        <div className="seesr-numbers">
          <span>清单命中 <b>{hits}/4</b></span>
          <span>误检 <b>{fp}</b></span>
        </div>
        <div className="seesr-softband">
          <span className="seesr-softband-label">软提示（表示嵌入）</span>
          <i />
          <p>不参与阈值筛选：阈值再高，它仍把整幅图的表示信息送进 RCA。</p>
        </div>
      </div>

      <div className="seesr-panel seesr-plain" style={{ left: 576, top: 266, width: 896, height: 220 }}>
        <div className="seesr-detailrow">
          <div className="seesr-mini-frame">
            <SeaCliffScene interpretation={interpretation} damage={0.85} detail={detail} />
          </div>
          <div>
            <div className="seesr-h">局部细节</div>
            <p className="seesr-emph" style={{ color: wrongPass ? C.red : boat ? (lighthouse ? C.green : C.orange) : C.red }}>
              {wrongPass ? '错误替换' : boat ? (lighthouse ? '完整' : '部分') : '无'}
            </p>
            <p className="seesr-muted">图像分支仍然给出结构，但没有名字的位置只能靠先验。</p>
          </div>
        </div>
      </div>

      <div className="seesr-panel seesr-plain" style={{ left: 576, top: 502, width: 896, height: 120 }}>
        <p className={`seesr-feedback ${tone}`} aria-live="polite">{feedback}</p>
      </div>
    </div>
  );
}
