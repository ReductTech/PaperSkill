import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// §5 类比：属性对账单 —— ED 的三部分可视化
// ① 精确率 PA：说了的属性，画面里要有；② 召回率 RA：画面里的属性，单据要提到；
// ③ ED = F₀.₅(PA, RA) 加权合成（偏重精确率）。①②以箭头指向③，箭头标注大/小权重。
// 交互：点击属性芯片可切换「单据是否提到」。

const IMG_ATTRS = ['白鹭', '湖面', '水花', '芦苇', '倒影']; // 画面里实际有的属性
const EXTRA = '晚霞'; // 画面里没有、单据可能瞎提的属性

export const Ana5: React.FC<WidgetProps> = () => {
  const [mentioned, setMentioned] = useState<string[]>(['白鹭', '湖面', '水花', EXTRA]);

  const toggle = (a: string) =>
    setMentioned((m) => (m.includes(a) ? m.filter((x) => x !== a) : [...m, a]));

  const hits = IMG_ATTRS.filter((a) => mentioned.includes(a)); // 又说又真有
  const pa = mentioned.length === 0 ? 1 : hits.length / mentioned.length; // 精确率
  const ra = hits.length / IMG_ATTRS.length; // 召回率
  const ed = (1.25 * pa * ra) / (0.25 * pa + ra);

  return (
    <div className="ed-wrap">
      {/* ①② 两块账单 */}
      <div className="ed-col">
        <div className="ed-panel ed-panel-p">
          <div className="ed-panel-head">① 精确率 PA <small>说了的，画面里要有</small></div>
          <div className="ed-chips">
            {mentioned.length === 0 && <span className="ed-none">（单据什么都没提）</span>}
            {mentioned.map((a) => (
              <span key={a}
                className={'ed-chip ' + (IMG_ATTRS.includes(a) ? 'ed-chip-hit' : 'ed-chip-miss')}
                onClick={() => toggle(a)}>
                {a} {IMG_ATTRS.includes(a) ? '✓' : '✗'}
              </span>
            ))}
          </div>
          <div className="ed-val">PA = {pa.toFixed(2)}</div>
        </div>

        <div className="ed-panel ed-panel-r">
          <div className="ed-panel-head">② 召回率 RA <small>画面里的，单据要提到</small></div>
          <div className="ed-chips">
            {IMG_ATTRS.map((a) => (
              <span key={a}
                className={'ed-chip ' + (mentioned.includes(a) ? 'ed-chip-hit' : 'ed-chip-missed')}
                onClick={() => toggle(a)}>
                {a} {mentioned.includes(a) ? '✓' : '✗'}
              </span>
            ))}
          </div>
          <div className="ed-val">RA = {ra.toFixed(2)}</div>
        </div>
        <div className="ed-tip">提示：单据里的「{EXTRA}」画面里没有——它只拖累精确率。点击芯片可切换「提到 / 没提」。</div>
      </div>

      {/* 箭头：大权重 / 小权重 */}
      <div className="ed-arrows">
        <div className="ed-arrow ed-arrow-big">
          <span className="ed-w ed-w-big">大权重</span>
          <i />
        </div>
        <div className="ed-arrow ed-arrow-small">
          <span className="ed-w ed-w-small">小权重</span>
          <i />
        </div>
      </div>

      {/* ③ 合成 */}
      <div className="ed-panel ed-panel-ed">
        <div className="ed-panel-head">③ ED = F₀.₅ 加权合成 <small>β=0.5，偏重精确率</small></div>
        <div className="ed-formula">ED = 1.25·PA·RA ⁄ (0.25·PA + RA)</div>
        <div className="ed-ednum">{ed.toFixed(3)}</div>
        <div className="ed-bar"><div className="ed-bar-fill" style={{ width: `${ed * 100}%` }} /></div>
        <div className="ed-note">精确率错一个，ED 掉得比召回率漏一个更快——所以权重偏它。</div>
      </div>
    </div>
  );
};
