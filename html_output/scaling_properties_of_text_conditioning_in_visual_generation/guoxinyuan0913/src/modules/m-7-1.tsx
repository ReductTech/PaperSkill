import React, { useState } from 'react';
import { C } from './studioKit';
import type { WidgetProps } from './registry';

// §7 模块 7.1：字段阶梯步进（P2；混合视图）——Table 1 实测数值
const LEVELS = [
  { lv: 'L5', tokens: 447, added: '基础字段', gm: 46.79, gsb: null as number | null },
  { lv: 'L6', tokens: 542, added: '包围盒', gm: 48.65, gsb: 8.0 },
  { lv: 'L7', tokens: 647, added: '场景上下文', gm: 49.72, gsb: 17.3 },
  { lv: 'L8', tokens: 803, added: '动态属性', gm: 52.94, gsb: 22.7 },
  { lv: 'L9', tokens: 1062, added: '深度与关系', gm: 55.16, gsb: 24.7 },
  { lv: 'L10', tokens: 1374, added: '摄影', gm: 57.70, gsb: 26.0 },
];

export const M711: React.FC<WidgetProps> = () => {
  const [i, setI] = useState(0);
  const cur = LEVELS[i];
  return (
    <div className="widget">
      <div className="ladder-row">
        <div className="ladder-fields">
          {LEVELS.map((l, k) => (
            <div key={l.lv} className={'field-row' + (k <= i ? ' field-on' : '')}>
              <span className="field-lv">{l.lv}</span>
              <span className="field-added">{l.added}</span>
              <span className="field-tok">{l.tokens} tok</span>
            </div>
          ))}
        </div>
        <div className="ladder-bars">
          <div className="bar-item">
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${((cur.gm - 44) / (60 - 44)) * 100}%`, background: C.green }} />
              <span className="bar-num">{cur.gm.toFixed(2)}</span>
            </div>
            <div className="bar-label">GenEval2 GM（越高越好）</div>
          </div>
          <div className="bar-item">
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${cur.gsb === null ? 0 : (cur.gsb / 30) * 100}%`, background: C.orange }} />
              <span className="bar-num">{cur.gsb === null ? '—' : '+' + cur.gsb.toFixed(1) + '%'}</span>
            </div>
            <div className="bar-label">GSB vs L5（净偏好，N=150）</div>
          </div>
          <div className="fb-hint">每级由对应级别的 BAGEL 扩散器渲染；与第 10 章 Qwen-Image 数值不可比</div>
        </div>
      </div>
      <div className="ctrl-row">
        <button className="chip" disabled={i === 0} onClick={() => setI(i - 1)}>← 上一步</button>
        <button className="chip" disabled={i === LEVELS.length - 1} onClick={() => setI(i + 1)}>下一步 →</button>
        <button className="chip" onClick={() => setI(0)}>重置</button>
      </div>
      <div className={`feedback ${i === LEVELS.length - 1 ? 'fb-green' : 'fb-blue'}`}>
        {i === 0
          ? 'L5：只保留基础字段，GenEval2 GM 46.79——这是所有级别的共同起点。'
          : i === LEVELS.length - 1
            ? '全 schema：GM 57.70、GSB +26.0——更高可扩散性落到生成图像上'
            : `${cur.lv}：恢复「${cur.added}」，GenEval2 GM ${cur.gm.toFixed(2)}，GSB vs L5 +${cur.gsb}%`}
      </div>
    </div>
  );
};
