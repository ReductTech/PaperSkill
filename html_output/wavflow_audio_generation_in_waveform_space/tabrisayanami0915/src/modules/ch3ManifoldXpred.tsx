import React,{useState} from 'react';
import type {WidgetProps} from './registry';
import {Choices,Source} from '../components/Evidence';
export const Ch3ManifoldXpred:React.FC<WidgetProps>=()=>{
 const [strategy,setStrategy]=useState<'xpred'|'vpred'>('xpred');
 const [t,setT]=useState(.5);
 const x0=[100,45],x1=[540,150],xt=[x0[0]*(1-t)+x1[0]*t,x0[1]*(1-t)+x1[1]*t];
 return <div className="widget-container">
 <Choices label="预测对象" value={strategy} onChange={setStrategy} options={[
 {value:'xpred',label:'x-pred：估计干净波形'},{value:'vpred',label:'v-pred：估计速度'}]}/>
 <label className="evidence-slider">生成时间 t={t.toFixed(2)}<input aria-label="流形示意生成时间" type="range" min="0" max="100" value={t*100} onChange={e=>setT(Number(e.target.value)/100)}/></label>
 <svg className="wave-plot" viewBox="0 0 800 250" role="img" aria-label="数据流形与训练样本对概念示意">
 <title>二维教学示意：真实数据流形不一定是线性子空间，图中坐标不对应真实音频</title>
 <path d="M60 215 Q300 85 540 150 T740 180" fill="none" stroke="#228d5c" strokeWidth="4"/>
 <path d="M100 45 L540 150" fill="none" stroke="#68778f" strokeDasharray="5 5"/>
 <circle cx="100" cy="45" r="6" fill="#c43f52"/><text x="115" y="40">x₀ 噪声</text>
 <circle cx="540" cy="150" r="6" fill="#228d5c"/><text x="550" y="135">x₁ 训练端点</text>
 <circle cx={xt[0]} cy={xt[1]} r="7" fill="#27446e"/><text x={xt[0]} y={xt[1]+28}>x_t</text>
 <text x="60" y="240">曲线：数据流形示意；虚线：固定样本对的训练插值</text>
 </svg>
 <div className="evidence-panel" aria-live="polite"><p className="evidence-formula">{strategy==='xpred'?'x̂1=fθ(x_t,t,c) → vθ=(x̂1−x_t)/(1−t), t<1':'vθ=fθ(x_t,t,c)'}</p>
 <p>{strategy==='xpred'?'直接估计干净波形；网络输出并未被硬性限制在曲线上。':'直接估计生成速度。论文指出该框架下速度预测同样可行。'}</p></div>
 <div className="widget-feedback good">流形假设是作者解释 x-pred 优势的依据。Table 4 中 x-pred + v-loss 的 FDPaSST 63.05、IS 15.58 优于 v-pred + v-loss 的 77.19、13.48；KL 则为 1.76 与 1.75，并非全指标领先。</div>
 <Source>第 3–4 页 §2.2、§3.1；第 9–10 页 §4.4、Table 4，M-16k，1M Media 与 VGGSound 混合设置，VGGSound-Test。</Source>
 </div>;
};
export default Ch3ManifoldXpred;
