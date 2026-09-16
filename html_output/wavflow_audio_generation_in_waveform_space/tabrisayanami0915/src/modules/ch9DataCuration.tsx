import React,{useState} from 'react';
import type {WidgetProps} from './registry';
import {Choices,Source} from '../components/Evidence';
const stages=[
 {title:'质量过滤',flow:'原始 Media → 质量过滤 → 约 50M 片段',items:[
 '排除不足 8 秒、静音占比超过 80%、PQ<6.0 的样本。',
 '使用 PANNs 排除每类置信度最低 10% 的样本。',
 '公开数据过滤后：VGGSound 100K；AudioCaps + Freesound 150K。']},
 {title:'类别平衡与时移增广',flow:'50M Media → 按 VGGSound 类别分布平衡 → 5M Media 池',items:[
 '5M 是平衡后的池，不是质量过滤阶段的直接产出。',
 '公开数据分别提取从 0 秒和 1 秒起始的重叠 8 秒片段。',
 '增广后 VGGSound 200K；公开 T2A 300K。']},
 {title:'最终训练混合',flow:'VT2A：5M + 200K ≈ 5.2M；T2A：1M + 300K ≈ 1.3M',items:[
 'VT2A：均衡 Media 池 + 增广 VGGSound；论文简写为约 5M。',
 'T2A：同一高质量媒体语料随机采样 1M + 增广公开 T2A；论文简写为约 1M。',
 'T2A 模型按该混合单独训练（Appendix A）；16 kHz 主设置 400 epochs，VT2A batch 10,752、T2A batch 8,192。',
 '44.1 kHz 从 L-16kHz 检查点出发，在 200K VGGSound 上微调 650 epochs，batch 1536。']},
];
export const Ch9DataCuration:React.FC<WidgetProps>=()=>{
 const [stage,setStage]=useState(0); const s=stages[stage];
 return <div className="widget-container">
 <Choices label="数据流程" value={stage} onChange={setStage} options={stages.map((s,i)=>({value:i,label:(i+1)+'. '+s.title}))}/>
 <div className="evidence-panel" aria-live="polite"><h4>{s.title}</h4><p className="evidence-flow">{s.flow}</p>
 <ul>{s.items.map(x=><li key={x}>{x}</li>)}</ul></div>
 <div className="widget-feedback good">Appendix C 比较不同混合：稀疏 VGGSound + 公开 T2A 发散；密集描述 VGGSound + 公开 T2A 可稳定训练但部分指标较差。稀疏 VGGSound + Media 稳定，作者以视觉共同语义锚点解释这一结果。这不是给原混合加入 1M 视频即可修复的实验。</div>
 <Source>第 6–7 页 §4.1、Figure 3；第 15–16 页 Appendix A；第 17–18 页 Appendix C、Table 7（M-16k，1M 规模，VGGSound-Val）。</Source>
 </div>;
};
export default Ch9DataCuration;
