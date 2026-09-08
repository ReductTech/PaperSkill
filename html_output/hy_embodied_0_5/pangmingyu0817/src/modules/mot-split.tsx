import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Arch = 'shared' | 'mot';
type Token = 'visual' | 'language';

export const MotSplit: React.FC<WidgetProps> = () => {
  const [arch, setArch] = useState<Arch>('shared');
  const [token, setToken] = useState<Token>('visual');
  const [load, setLoad] = useState(65);
  const shared = arch === 'shared';
  const visual = token === 'visual';
  const languagePreservation = shared ? Math.max(28, 100 - load * .68) : 94;
  const visionCapacity = shared ? Math.min(68, 30 + load * .42) : 96;
  return <div className="mot-demo">
    <div className="mot-token-row" role="group" aria-label="选择路由标记"><button className={`token token-image ${visual ? 'active' : ''}`} onClick={() => setToken('visual')}>视觉 token · 杯柄</button><button className={`token token-text ${!visual ? 'active' : ''}`} onClick={() => setToken('language')}>文本 token · 不要碰倒</button></div>
    <div className={`mot-architecture ${arch}`}>
      <div className="mot-source">{visual ? '视觉 token' : '文本 token'}</div><div className="route-arrow">↓</div>
      {shared ? <div className="shared-block"><b>Shared Transformer</b><span>共享 QKV</span><span>共享 Attention</span><span>共享 FFN</span><i>视觉与语言更新争用同一组参数</i></div> : <div className="branch-grid">
        <div className={`branch vision ${visual ? 'active' : ''}`}><b>Vision Branch</b><span>复制并初始化自原 LLM 的 QKV</span><span>Local Full Attention</span><span>Vision FFN</span></div>
        <div className={`branch language ${!visual ? 'active' : ''}`}><b>Language Branch</b><span>原有 Language QKV</span><span>Causal Attention</span><span>Language FFN</span></div>
      </div>}
    </div>
    <div className="chip-row" role="group" aria-label="切换 Transformer 架构"><button className={`chip ${shared ? 'selected' : ''}`} onClick={() => setArch('shared')}>共享 Transformer</button><button className={`chip ${!shared ? 'selected' : ''}`} onClick={() => setArch('mot')}>启用 MoT</button></div>
    <div className="ctrl"><label>视觉密集训练 <span className="val">{load}%</span><input type="range" min="0" max="100" value={load} onChange={e => setLoad(Number(e.target.value))} /></label></div>
    <div className="meter-pair"><label>视觉容量 <progress max="100" value={visionCapacity} /> {Math.round(visionCapacity)}</label><label>语言保留 <progress max="100" value={languagePreservation} /> {Math.round(languagePreservation)}</label></div>
    <div className={`feedback ${shared ? 'bad' : 'good'}`} aria-live="polite">{shared ? '共享参数对照：视觉训练越强，视觉容量仍受共享小模型限制，语言能力也可能被持续改写。' : `${visual ? '视觉' : '文本'}标记只激活自己的模态分支。MoT-2B 总参数约 4B、激活约 2B；MoT 是按模态确定性路由，不等同于 MoE。`}</div>
  </div>;
};

export default MotSplit;
