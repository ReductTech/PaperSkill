import React, { useState } from 'react';
import { C, MiniConsole } from './ewcKit';

type Panel = 'a' | 'b';
const PANELS: Record<Panel, { src: string; alt: string; label: string }> = {
  a: { src: './images/fig2a.png', alt: '原论文 Figure 2A：三个排列任务依次训练时 EWC、L2 与 SGD 的正确率曲线', label: 'Fig. 2A　三个任务依次训练' },
  b: { src: './images/fig2b.png', alt: '原论文 Figure 2B：任务数从 2 增加到 10 时 EWC 与 SGD+dropout 的平均正确率', label: 'Fig. 2B　任务数增加到 10' },
};

export function EwcMnist() {
  const [panel, setPanel] = useState<Panel>('a');
  const p = PANELS[panel];
  return <div className="ewc-page">
    <div className="ewc-side" style={{ flex: '0 0 860px' }}>
      <figure className="ewc-fig" style={{ height: 452 }}>
        <img src={p.src} alt={p.alt} style={{ maxHeight: 430 }} />
      </figure>
      <div className="ewc-thumbs" role="group" aria-label="选择原图的子图">
        {(['a', 'b'] as Panel[]).map(k => <button key={k} className={`ewc-thumb ${panel === k ? 'is-on' : ''}`} aria-pressed={panel === k} onClick={() => setPanel(k)}>
          <img src={PANELS[k].src} alt="" />
        </button>)}
      </div>
    </div>
    <div className="ewc-side">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="ewc-head">{p.label}</h3>
        <svg width="150" height="100" viewBox="0 0 200 135" aria-hidden="true"><MiniConsole x={4} y={2} scale={1} /></svg>
      </div>
      {panel === 'a' ? <ul className="ewc-list">
        <li><b style={{ color: C.blue }}>SGD（蓝）</b>：学新任务时，旧任务的正确率不断下滑</li>
        <li><b style={{ color: C.green }}>L2（绿）</b>：旧任务保住了，但新任务学不好</li>
        <li><b style={{ color: C.red }}>EWC（红）</b>：旧任务保持高水平，新任务也学得好</li>
      </ul> : <ul className="ewc-list">
        <li><b style={{ color: C.blue }}>SGD + dropout（蓝）</b>：任务越多越差，从约 0.97 降到约 0.78</li>
        <li><b style={{ color: C.red }}>EWC（红）</b>：几乎持平，约 0.98 到约 0.97，接近单任务基线（虚线）</li>
      </ul>}
      <p className="ewc-muted">置换 MNIST；纵轴为测试正确率，越高越好。数值为读图估计。</p>
    </div>
  </div>;
}
