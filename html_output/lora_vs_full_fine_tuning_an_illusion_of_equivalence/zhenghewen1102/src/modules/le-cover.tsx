import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { Mixer, Speaker } from './le-kit';
import type { WidgetProps } from './registry';
import './le.css';
export function LECover({moduleId}:WidgetProps){
 const {progress}=useCoverPlayback();const improved=moduleId==='newMethod';
 const factor=improved?1-.55*Math.min(1,progress*1.7):1;
 const pulse=.3*Math.sin(progress*Math.PI*2);const levels=[(4+pulse)*factor,3-pulse,2,1];
 return <div style={{height:'100%',position:'relative',display:'grid',gridTemplateColumns:'1fr 110px',gridTemplateRows:'238px 78px',gap:8,padding:'0 6px'}}>
   <div><Mixer levels={levels} active={improved?0:-1}/></div><div><Speaker level={factor}/></div>
   <div style={{gridColumn:'1 / -1',fontSize:28,lineHeight:1.3,textAlign:'center',color:improved?'#228d5c':'#27446e'}}>{improved?'减弱新分量，检查保留能力':'相近总分，不同内部变化'}<div style={{color:'#68778f'}}>教学示意</div></div>
 </div>;
}
