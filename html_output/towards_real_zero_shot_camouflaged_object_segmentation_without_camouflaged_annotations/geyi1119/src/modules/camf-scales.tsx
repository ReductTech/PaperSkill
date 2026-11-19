import { useState } from 'react';
import { Feedback, Term } from './camf-kit';
export function ScalesScene() {
  const [scale, setScale] = useState(16);
  const [multi, setMulti] = useState(true);
  const count = (384/scale)**2;
  const cells = 32/scale*3;
  return <div className="camf-page"><div className="camf-scale-body"><div className="camf-patch-sheet"><svg viewBox="0 0 720 420" role="img" aria-label={`空间分组示意，精确token数${count}`}><rect x="40" y="15" width="610" height="390" fill="#f4f7f5"/><path d="M190 340 Q85 145 495 55 Q595 280 190 340Z" fill="#dcebdd" stroke="#27446e" strokeWidth="5"/>{Array.from({length:cells+1},(_,index)=><g key={index} stroke="#76906a" strokeWidth="2"><path d={`M${40+610*index/cells} 15 V405`}/><path d={`M40 ${15+390*index/cells} H650`}/></g>)}</svg><p>观察速写的分格示意，网格已简化；数量以右侧精确计算为准。</p></div><section className="camf-stack"><h3>同一幅 384 × 384 输入</h3><label>下采样因子 n <select aria-label="下采样因子" value={scale} onChange={event=>setScale(Number(event.target.value))}>{[4,8,16,32].map(value=><option key={value}>{value}</option>)}</select></label><div className="camf-equation"><Term meaning="Lv：当前尺度的空间视觉token数量">Lᵥ</Term> = (384 / <Term meaning="n：空间下采样因子">n</Term>)²</div><div className="camf-big" data-testid="token-count">{count.toLocaleString()} tokens</div><label className="camf-check"><input type="checkbox" checked={multi} onChange={event=>setMulti(event.target.checked)}/>同时保留四个尺度</label><p>{multi?'4、8、16、32 四种粒度分别对齐，再交给解码器。':'这里只观察一个尺度；论文默认同时使用四个尺度。'}</p></section></div><Feedback>{384/scale} × {384/scale} 个位置，共享投影器映射到共同通道空间。粒度改变不等于已测得精度提升。</Feedback></div>;
}
