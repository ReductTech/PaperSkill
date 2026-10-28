import React, { useState } from 'react';
import { C, Feedback, MiniStreet } from './FpnKit';

const variants = [
  { name: '单层 C4', value: 48.3, lateral: false, topdown: false, levels: '仅 C4', explanation: '单层基线有较强语义，但只有一种特征分辨率。' },
  { name: '完整 FPN', value: 56.3, lateral: true, topdown: true, levels: '多层预测', explanation: '自顶向下、横向连接与多层预测共同构成完整方案。' },
  { name: '无自顶向下', value: 49.5, lateral: true, topdown: false, levels: '多层预测', explanation: '保留多个尺度，还不足以消除不同层的语义差距。' },
  { name: '无横向连接', value: 46.1, lateral: false, topdown: true, levels: '多层预测', explanation: '只把深层特征放大，缺少浅层传来的精细位置线索。' },
  { name: '只在 P2 预测', value: 51.3, lateral: true, topdown: true, levels: '仅 P2', explanation: '最精细的一层也有局限，多层预测仍带来额外收益。' },
];

export function FpnAblation() {
  const [selected, setSelected] = useState(1);
  const current = variants[selected];
  return <div className="fpn-scene">
    <p>论文表 1 · ResNet-50 · COCO minival · AR@1000，越高越好</p>
    <div className="fpn-row" style={{ height: 422 }}>
      <div style={{ width: 956, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: 244, width: 588, color: C.muted }}>
          {[0,20,40,60].map(v => <span key={v}>{v}</span>)}
        </div>
        {variants.map((variant, index) => <button type="button" key={variant.name}
          aria-label={`比较${variant.name}，AR ${variant.value}`} aria-pressed={selected === index}
          onClick={() => setSelected(index)} style={{ width: '100%', height: 62, display: 'grid', gridTemplateColumns: '228px 588px 86px', alignItems: 'center', gap: 14, padding: '4px 10px', borderRadius: 12, border: `2px solid ${selected === index ? C.blue : 'transparent'}`, background: selected === index ? '#edf2f8' : 'white', color: C.ink, fontFamily: 'inherit', fontSize: 28, cursor: 'pointer', textAlign: 'left' }}>
          <span>{variant.name}</span>
          <span style={{ height: 34, background: '#edf0f4', borderRadius: 5, position: 'relative', display: 'block' }}>
            <span style={{ display: 'block', height: '100%', width: `${variant.value/60*100}%`, borderRadius: 5, background: index === 1 ? C.green : selected === index ? C.blue : '#acbac8', transition: 'background .2s' }} />
          </span>
          <strong style={{ color: index === 1 ? C.green : C.ink }}>{variant.value.toFixed(1)}</strong>
        </button>)}
      </div>
      <aside className="fpn-panel fpn-col" style={{ width: 488, gap: 12 }}>
        <MiniStreet height={126}/>
        <h3>{current.name}</h3>
        <p>自顶向下：{current.topdown ? '保留' : '不使用'}</p>
        <p>横向连接：{current.lateral ? '保留' : '不使用'}</p>
        <p>预测位置：{current.levels}</p>
      </aside>
    </div>
    <Feedback tone={selected === 1 ? 'green' : 'blue'}>
      {current.explanation} AR 衡量候选覆盖情况，还不是最终检测 AP。
    </Feedback>
  </div>;
}
