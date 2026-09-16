import React,{useState} from 'react';
import type {WidgetProps} from './registry';
import {Choices,Source} from '../components/Evidence';
const models={
 M16:{label:'M · 16 kHz',joint:4,fused:8,params:'624M',c:640,ms:12.5,fd:'62.64',ds:'0.47'},
 L16:{label:'L · 16 kHz',joint:7,fused:14,params:'1.03B',c:640,ms:12.5,fd:'59.98',ds:'0.44'},
 L44:{label:'L · 44.1 kHz',joint:7,fused:14,params:'1.03B',c:1764,ms:4.54,fd:'55.82',ds:'0.46'},
};
export const Ch8MmditBlocks:React.FC<WidgetProps>=()=>{
 const [model,setModel]=useState<keyof typeof models>('L16'); const m=models[model];
 return <div className="widget-container">
 <Choices label="模型规格" value={model} onChange={setModel} options={(Object.keys(models) as (keyof typeof models)[]).map(k=>({value:k,label:models[k].label}))}/>
 <div className="evidence-grid">
 <div className="evidence-panel"><h4>输入与联合处理</h4>
 <p>波形与 CLIP 视觉特征：卷积输入块。CLIP 文本特征：线性投影。</p>
 <p><strong>{m.joint} 个联合块</strong>，隐藏维度 d=896，14 个注意力头。</p>
 <p>音频与视觉使用 RoPE，文本不使用该时序 RoPE。</p></div>
 <div className="evidence-panel"><h4>音频细化与输出</h4>
 <p><strong>{m.fused} 个音频块</strong> → AdaLN + Conv1D（kernel=7）→ 每 token 的 D=200 个采样点。</p>
 <p>Unpatchify → 除以 3 → −23 LUFS 响度归一化。</p></div>
 </div>
 <div className="evidence-panel" aria-live="polite">
 <p>8 秒：C={m.c}，每 token 约 {m.ms} ms；参数 {m.params}。</p>
 <p className="evidence-formula">视觉 RoPE 频率乘子 = C / Nclip = {m.c} / 64 = {m.c/64}</p>
 <p>Table 1 / VGGSound-Test：FDPaSST {m.fd}；DeSync {m.ds}。</p>
 </div>
 <Source>第 5–6 页 §3.2；第 8 页 Table 1。16 kHz VT2A 主训练为 5M Media + 200K VGGSound；44.1 kHz 继承 L-16kHz 检查点，在 200K VGGSound 上微调 650 epochs，batch 1536（第 15 页 Table 6）。</Source>
 </div>;
};
export default Ch8MmditBlocks;
