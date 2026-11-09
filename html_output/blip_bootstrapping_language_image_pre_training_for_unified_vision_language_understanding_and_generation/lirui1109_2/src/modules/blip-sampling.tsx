import React, { useState } from 'react';
import { Feedback, FormulaTerm, Photo, useTween } from './blip-kit';

const ink = '#21324a';
const words = [
  { word: '海边', value: .5 },
  { word: '海岸', value: .25 },
  { word: '港口', value: .15 },
  { word: '湖边', value: .1 },
];

export function BlipSampling() {
  const [p, setP] = useState(.9);
  let mass = 0;
  let count = 0;
  while (count < words.length && mass < p - 1e-9) mass += words[count++].value;
  const spread = useTween(count, 480);
  return <div className="blip-page" style={{ width: '100%', height: '100%', position: 'relative', color: ink }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1000, height: 508, borderRadius: 24, background: '#f5f1e6', padding: 24, boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', left: 24, top: 24, width: 952, display: 'flex', alignItems: 'center', gap: 22, height: 96 }}>
        <Photo kind="travel" width={140} height={94} />
        <div style={{ fontSize: 'var(--ppt-body-heading)', fontWeight: 700 }}>给照片写下一词：“旅行到了……”</div>
      </div>
      <div style={{ position: 'absolute', left: 24, top: 142, width: 952, height: 244 }} aria-label={`阈值${p.toFixed(2)}，选择${count}个词，累计概率${mass.toFixed(2)}`}>
        {words.map((item, index) => {
          const included = index < count;
          const shift = Math.max(0, Math.min(1, spread - index));
          return <div key={item.word} style={{ position: 'absolute', left: index * 238, top: 30 - shift * 24, width: 220, height: 214, padding: '18px 14px', boxSizing: 'border-box', background: included ? '#fff' : '#e8e6e0', border: `3px solid ${included ? '#228d5c' : '#c8cbd0'}`, borderRadius: 14, boxShadow: included ? '0 10px 18px #21324a12' : 'none', lineHeight: 1.25 }}>
            <div style={{ fontSize: 'var(--ppt-body-heading)', fontWeight: 700, marginBottom: 12 }}>{item.word}</div>
            <div style={{ fontSize: 'var(--ppt-body-text)' }}>原概率 {Math.round(item.value * 100)}%</div>
            <div style={{ height: 12, background: '#dfe4e7', borderRadius: 5, margin: '12px 0' }}><div style={{ width: `${item.value * 200}%`, height: '100%', borderRadius: 5, background: included ? '#228d5c' : '#9fa6ae' }} /></div>
            <div style={{ fontSize: 'var(--ppt-body-text)', color: included ? '#228d5c' : '#68778f', fontWeight: 700 }}>{included ? `采样 ${(item.value / mass * 100).toFixed(1)}%` : '未入选'}</div>
          </div>;
        })}
      </div>
      <div style={{ position: 'absolute', left: 24, top: 420, width: 952, height: 76, fontSize: 'var(--ppt-body-text)', lineHeight: 1.4 }}>先按概率排序，取累计概率达到阈值的最小集合。</div>
    </div>
    <div style={{ position: 'absolute', left: 1036, top: 0, width: 420, height: 508 }}>
      <strong style={{ position: 'absolute', left: 0, top: 8, fontSize: 'var(--ppt-body-heading)', lineHeight: 1.25 }}>候选词拨盘</strong>
      <label htmlFor="blip-top-p" style={{ position: 'absolute', left: 0, top: 80, fontSize: 'var(--ppt-body-text)', lineHeight: 1.4 }}>累计概率阈值 <FormulaTerm meaning="p：核采样保留候选词的累计概率阈值。">p</FormulaTerm></label>
      <div style={{ position: 'absolute', left: 0, top: 130, fontSize: 'var(--ppt-body-emphasis)', lineHeight: 1.2, fontWeight: 700, color: '#f07e47' }}>{p.toFixed(2)}</div>
      <input id="blip-top-p" aria-label="核采样累计概率阈值" type="range" min="0.5" max="0.99" step="0.01" value={p} onInput={event => setP(Number(event.currentTarget.value))} style={{ position: 'absolute', left: 0, top: 206, width: 392, accentColor: '#f07e47', height: 34, margin: 0 }} />
      <p style={{ position: 'absolute', left: 0, top: 268, width: 420, fontSize: 'var(--ppt-body-text)', lineHeight: 1.4, margin: 0 }}>入选 {count} 个词，累计 {Math.round(mass * 100)}%。<br />集合内概率重新归一化。</p>
      <p style={{ position: 'absolute', left: 0, top: 374, width: 420, fontSize: 'var(--ppt-body-text)', lineHeight: 1.4, margin: 0 }}>论文采用 <b><FormulaTerm meaning="p：核采样累计概率阈值；BLIP实验设置为0.9。">p</FormulaTerm> = 0.9</b>。<br />此页词表和概率仅作教学演示。</p>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 540 }}>
      <Feedback tone={count > 1 ? 'green' : 'blue'}>{count === 1 ? '只留下一个词时没有采样选择；增大阈值，观察候选词如何展开。' : `保留 ${count} 个候选，给生成更多选择；多样性也可能带来噪声，下一步仍要过滤。`}</Feedback>
    </div>
  </div>;
}
