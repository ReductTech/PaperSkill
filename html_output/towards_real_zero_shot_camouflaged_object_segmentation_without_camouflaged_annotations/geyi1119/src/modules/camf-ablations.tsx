import {useState} from 'react';
import {Feedback,fmt} from './camf-kit';
const channels=[64,128,256,512],scores=[.678,.710,.729,.517],params=[.072,.204,.664,2.37];
export function AblationScene(){
  const [selected,setSelected]=useState(2);
  const [codebook,setCodebook]=useState(true);
  return <div className="camf-page"><div className="camf-controls"><h3>MFA 通道数消融</h3><label>通道数 <select aria-label="MFA通道数" value={selected} onChange={event=>setSelected(Number(event.target.value))}>{channels.map((value,index)=><option key={value} value={index}>{value}</option>)}</select></label><span>DUTS · CAMO · Fᵂβ ↑</span></div><div className="camf-ablation-chart">{channels.map((channel,index)=><div key={channel} className={selected===index?'chosen':''}><div className="camf-vertical-track"><span style={{height:`${scores[index]*100}%`}}/><b>{fmt(scores[index])}</b></div><strong>{channel} 通道</strong><span>{params[index]} M 参数</span></div>)}</div><div className="camf-evidence-band"><label className="camf-check"><input type="checkbox" checked={codebook} onChange={event=>setCodebook(event.target.checked)}/>码本替代推理 caption</label><strong>CAMO：{codebook?'.729':'.720'}</strong><p>0.055 s / 图：RTX 4060Ti，Table I；不是任意设备的速度保证。</p></div><Feedback tone={selected===3?'red':'blue'}>{channels[selected]} 通道：参数为默认的 {(params[selected]/params[2]).toFixed(2)} 倍，Fᵂβ 差值 {fmt(scores[selected]-scores[2])}。Table III 不支持“越大越好”，也未确定下降原因。</Feedback></div>;
}
