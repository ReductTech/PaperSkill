import {useState} from 'react';
import {Feedback,fmt,Sheet} from './camf-kit';
const prompts=['The object.','The salient object.','Which object is salient?','Describe the image.','Describe the object.','Describe the salient object.'];
const scores=[[.697,.693],[.693,.694],[.697,.692],[.729,.717],[.716,.710],[.717,.710]];
export function CaptionScene(){
  const [prompt,setPrompt]=useState(3);
  return <div className="camf-page"><div className="camf-caption-top"><section className="camf-stack"><h3>训练时借助描述，不是测试时问答</h3><p>图像与提示交给离线 BLIP2-opt，提供 caption embeddings；MFA 学习更细粒度的语义对应。</p><label>训练提示 <select aria-label="训练提示" value={prompt} onChange={event=>setPrompt(Number(event.target.value))}>{prompts.map((text,index)=><option key={text} value={index}>{text}</option>)}</select></label><p>以下为 Table IV 的 DUTS 零样本消融，不是在浏览器里重新训练。</p></section><Sheet detail={.7}/></div><div className="camf-bars">{['CAMO','COD10K'].map((name,index)=><div className="camf-bar-row" key={name}><b>{name}</b><div className="camf-bar-track"><div style={{width:`${scores[prompt][index]*100}%`}}/></div><strong>{fmt(scores[prompt][index])}</strong></div>)}</div><Feedback>Fᵂβ ↑，横轴 0–1。「Describe the image.」在本组零样本提示消融中取得最高值，不是所有任务通用的提示定理。</Feedback></div>;
}
