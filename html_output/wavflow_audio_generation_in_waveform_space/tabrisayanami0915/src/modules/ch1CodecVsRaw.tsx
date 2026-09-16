import React, {useState} from 'react';
import type {WidgetProps} from './registry';
import {Choices,Source} from '../components/Evidence';
export const Ch1CodecVsRaw: React.FC<WidgetProps> = ({moduleId})=>{
 const [mode,setMode]=useState<'old'|'wavflow'>(moduleId==='old'?'old':'wavflow');
 return <div className="widget-container">
 <Choices label="生成范式" value={mode} onChange={setMode} options={[
 {value:'old',label:'潜空间方法'},{value:'wavflow',label:'WavFlow'}]}/>
 <div className="evidence-panel" aria-live="polite">
 <h4>{mode==='old'?'潜空间生成流程':'WavFlow 波形空间生成流程'}</h4>
 <p className="evidence-source">结构示意 · 非真实音频或频谱</p>
 <h5>训练数据路径</h5>
 <p className="evidence-flow">{mode==='old'?'原始音频 → 音频编码器 → 潜表示 → 加噪与生成模型训练':'原始音频 → 单声道与振幅预处理 → Patchify → 加噪与流匹配训练'}</p>
 <h5>推理路径</h5>
 <p className="evidence-flow">{mode==='old'?'潜空间噪声 + 条件 → 潜表示生成 → 音频解码器 → 波形':'波形 token 空间噪声 + 条件 → Euler 积分 → Unpatchify → 尺度与响度后处理'}</p>
 </div>
 <div className="widget-feedback good">{mode==='old'?
 '潜空间路线包括连续 VAE 与离散 Codec，不是所有方案都额外接 HiFi-GAN。编码与重构可能限制保真度，但不存在由本文证明的固定 FD 下限。':
 '省去预训练音频编码器与声码器；CLIP 和 Synchformer 仍是预训练条件编码器。分块重排无损不等于生成过程没有误差。'}</div>
 <Source>第 2 页 Figure 1，第 3 页 §2.1，第 4–6 页 §3。</Source>
 </div>;
};
export default Ch1CodecVsRaw;
