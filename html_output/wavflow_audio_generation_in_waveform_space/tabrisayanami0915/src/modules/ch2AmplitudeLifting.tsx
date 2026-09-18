import React,{useState} from 'react';
import type {WidgetProps} from './registry';
import {Choices,MetricsTable,Source} from '../components/Evidence';
import {WavePlot} from '../components/WavePlot';
const raw=Array.from({length:480},(_,i)=>(Math.sin(i*.05)*.15+Math.cos(i*.18)*.08)*(i%50<10?.3:1));
const rms=(xs:number[])=>Math.sqrt(xs.reduce((s,v)=>s+v*v,0)/xs.length);
const lifted=raw.map(v=>3*Math.max(-1,Math.min(1,v*.33/rms(raw))));
export const Ch2AmplitudeLifting:React.FC<WidgetProps>=()=>{
 const [stage,setStage]=useState<'raw'|'lifted'>('lifted');
 const samples=stage==='raw'?raw:lifted;
 const counts=Array.from({length:30},()=>0);
 samples.forEach(v=>counts[Math.max(0,Math.min(29,Math.floor((v+3)/.2)))]++);
 const ymax=Math.max(...counts.map(n=>n/(samples.length*.2)),.4);
 return <div className="widget-container">
 <Choices label="振幅预处理" value={stage} onChange={setStage} options={[
 {value:'raw',label:'示例原波形'},{value:'lifted',label:'RMS → clamp → ×3'}]}/>
 <p className="evidence-source">教学合成波形，非论文样本。直方图由上方同一波形实际计算，两个状态的波形振幅轴一致。</p>
 <WavePlot samples={samples} label={stage==='raw'?'预处理前示例波形':'预处理后示例波形'}/>
 <p aria-live="polite">实际 RMS：{rms(samples).toFixed(3)}；实际振幅范围：[{Math.min(...samples).toFixed(3)}, {Math.max(...samples).toFixed(3)}]。</p>
 <svg className="wave-plot" viewBox="0 0 800 230" role="img" aria-label="示例波形振幅概率密度直方图与标准高斯密度">
 <title>示例波形的实际直方图；虚线为标准高斯概率密度</title>
 <rect width="800" height="230" fill="#f5f8f0"/>
 {counts.map((n,i)=><rect key={i} x={40+i*24} y={190-n/(samples.length*.2)/ymax*145} width="22" height={n/(samples.length*.2)/ymax*145} fill="#228d5c" opacity=".6"/>)}
 <path d={Array.from({length:121},(_,i)=>{const z=-3+i*.05;return (i?'L':'M')+(40+i*6)+','+(190-Math.exp(-z*z/2)/Math.sqrt(2*Math.PI)/ymax*145);}).join(' ')} stroke="#27446e" strokeWidth="2" strokeDasharray="5 4" fill="none"/>
 <text x="40" y="24">概率密度 · 纵轴上限 {ymax.toFixed(2)}（随状态变化）</text>
 <text x="40" y="216">−3</text><text x="400" y="216">0</text><text x="730" y="216">+3 振幅</text>
 </svg>
 <div className="widget-feedback good">绿色是实算直方图，蓝色虚线是 N(0,1) 密度。处理后尺度更接近先验，分布并不等于高斯。clamp 与响度归一化不可视为原始录音的无损逆变换。</div>
 <MetricsTable caption="Table 5：预处理消融" headers={['设置','FDPaSST ↓','FDPANNs ↓','KL ↓','IS ↑','IB ↑','DeSync ↓']}
 rows={[
 ['RMS + 1×','65.83','6.03','1.73','13.32','0.28','0.49'],
 ['无 RMS + 1×','81.26','8.69','1.91','11.64','0.24','0.57'],
 ['RMS + 3×','63.05','6.21','1.76','15.58','0.28','0.50'],
 ['无 RMS + 3×','64.23','6.93','1.79','13.84','0.26','0.52'],
 ]}/>
 <Source>第 4 页 Eq. (4)，第 10 页 Table 5（M-16k，1M Media 与 VGGSound 混合设置，VGGSound-Test）；第 16–17 页 Appendix B、Figure 6。</Source>
 </div>;
};
export default Ch2AmplitudeLifting;
