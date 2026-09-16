import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Choices, MetricsTable, Source } from '../components/Evidence';
const stages=[
 ['训练插值','x_t=(1−t)x₀+t x₁','从 logit-normal 分布采样生成时间 t，在噪声与干净波形间插值。'],
 ['预测波形','x̂1=fθ(x_t,t,c)','网络估计干净波形，输出没有被硬性限制在低维流形上。'],
 ['恢复速度','vθ=(x̂1−x_t)/(1−t), t<1','此速度对应流匹配生成时间，不是音频播放时间导数。'],
 ['计算损失','L_v=E[||x̂1−x₁||²/(1−t)²]','由 Eq. (3) 代数推导：波形平方误差按生成时间加权，没有显式频率权重。'],
];
export const Ch7VlossStepper: React.FC<WidgetProps> = () => {
 const [step,setStep]=useState(0);
 return <div className="widget-container">
 <Choices label="训练步骤" value={step} onChange={setStep} options={stages.map((s,i)=>({value:i,label:(i+1)+'. '+s[0]}))}/>
 <div className="evidence-panel" aria-live="polite"><h4>{stages[step][0]}</h4>
 <p className="evidence-formula">{stages[step][1]}</p><p>{stages[step][2]}</p></div>
 <MetricsTable caption="Table 4：预测目标与损失的权衡"
 headers={['设置','FDPaSST ↓','FDPANNs ↓','KL ↓','IS ↑','IB ↑','DeSync ↓']}
 rows={[
 ['v-pred + v-loss','77.19','6.38','1.75','13.48','0.27','0.53'],
 ['x-pred + x-loss','72.70','4.86','1.72','13.99','0.29','0.50'],
 ['x-pred + v-loss','63.05','6.21','1.76','15.58','0.28','0.50'],
 ]}/>
 <div className="widget-feedback good">作者采用 x-pred + v-loss，以 FDPaSST 与 IS 的优势取得总体折中。x-loss 的 FDPANNs、KL 和 IB 更好，两者 DeSync 相同。</div>
 <Source>第 4 页 Eq. (1)–(3)，第 9–10 页 §4.4、Table 4；WavFlow-M-16k，1M Media 与 VGGSound 混合设置，VGGSound-Test。</Source>
 </div>;
};
export default Ch7VlossStepper;
