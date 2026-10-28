import React from 'react';
import {useCoverPlayback} from '../components/CoverPlayback';
import type {WidgetProps} from './registry';
import {C,Street,Person} from './FpnKit';
export function FpnCover({moduleId}:WidgetProps){
 const {progress}=useCoverPlayback();const improved=moduleId==='newMethod';const sweep=80+progress*760;
 return <div className="fpn-cover-art" style={{display:"flex",flexDirection:"column"}}><svg style={{height:280,flex:"0 0 280px"}} viewBox="0 0 664 300" role="img" aria-label={improved?'相同街景上叠加多尺度特征网格的原理示意':'相同街景只使用粗特征网格的原理示意'}><g transform="scale(.737 .64)"><Street/><Person x={350} y={425} height={180}/><Person x={520} y={295} height={48} color={C.blue}/><rect x={sweep} y="58" width="30" height="365" fill={C.blue} opacity=".08"/>{Array.from({length:improved?25:9},(_,i)=><path key={i} d={`M${i*(improved?38:112)} 55V445`} stroke={improved?C.green:C.red} opacity=".3"/>)}{Array.from({length:improved?11:5},(_,i)=><path key={i} d={`M0 ${60+i*(improved?38:90)}H900`} stroke={improved?C.green:C.red} opacity=".3"/>)}<rect x="302" y="225" width="98" height="206" fill="none" stroke={improved?C.green:C.blue} strokeWidth="5"/>{improved&&progress>.4&&<rect x="502" y="240" width="36" height="60" fill="none" stroke={C.green} strokeWidth="5"/>}</g></svg><div style={{fontSize:28,lineHeight:"40px",color:improved?C.green:C.red,padding:"0 16px"}}>{improved?"多层：结合细节与深层语义":"粗层：小目标可用位置更少"}</div></div>
}
