 import React from 'react';
 import {Film} from './AnimatedLesson';
 const C={blue:'#27446e',green:'#228d5c',orange:'#ed8651',ink:'#21324a',muted:'#697b8c',line:'#d5dfdf'};
 const cap=(n:number)=>Math.max(0,Math.min(1,n)),lerp=(a:number,b:number,t:number)=>a+(b-a)*cap(t);
 function Label({x,y,children,size=22,color=C.ink}:{x:number;y:number;children:React.ReactNode;size?:number;color?:string}){return <text x={x} y={y} fontSize={size} fill={color} textAnchor="middle" dominantBaseline="middle" fontWeight="600">{children}</text>;}
 export function VisualReturnScene({phase}:{phase:number}){
  const request=cap((phase-.04)/.15),extract=cap((phase-.25)/.16),encode=cap((phase-.5)/.12),project=cap((phase-.62)/.12),insert=cap((phase-.74)/.13);
  return <g data-visual-return="true" data-return-progress={insert}>
   <Label x={113} y={20} size={21}>原录像 · 0–120秒</Label>
   <Film x={28} y={37} w={170} h={111} time={42+24*phase}/>
   <g data-return-stage="request">
    <rect x="236" y="45" width="239" height="91" rx="12" fill="#fff" stroke={C.line}/>
    <Label x={355} y={71} size={19} color={C.muted}>模型请求，经解析后执行</Label>
    <Label x={355} y={110} size={27} color={C.blue}>回看42–66秒</Label>
    <path d="M234 102H205m8-6-8 6 8 6" stroke={C.green} strokeWidth="2.5" fill="none"/>
    <rect x={lerp(223,202,request)} y="96" width="10" height="12" rx="3" fill={C.orange} opacity={1-request*.7}/>
   </g>
   <Label x={591} y={60} size={21} color={C.green}>新证据再次走过</Label>
   <Label x={591} y={94} size={21} color={C.green}>视觉处理路径</Label>
   <Label x={202} y={161} size={20} color={C.muted}>裁剪返回的示例新帧</Label>
   <g data-return-stage="new-frames" opacity={extract}>
    {[52,55,58].map((time,i)=><g key={time} transform={'translate('+(28+i*117)+' '+lerp(194,179,extract)+')'}><Film x={0} y={0} w={106} h={102} time={time}/></g>)}
   </g>
   <g data-return-stage="encoder">
    <rect x="407" y="176" width="116" height="101" rx="11" fill={encode>0?'#e6edf6':'#edf0ea'} stroke={encode>0?C.blue:C.line}/>
    <Label x={465} y={158} size={20}>视觉编码</Label>
   </g>
   <path d="M376 226H398m-8-6 8 6-8 6M528 226H550m-8-6 8 6-8 6" stroke={C.line} strokeWidth="2.5" fill="none"/>
   <g data-return-stage="projection">
    <rect x="556" y="176" width="135" height="101" rx="11" fill={project>0?'#e7f2e9':'#edf0ea'} stroke={project>0?C.green:C.line}/>
    <Label x={623} y={158} size={20}>合并投影</Label>
   </g>
   <path d="M624 279V290H575V305" fill="none" stroke={insert>0?C.green:C.line} strokeWidth="2.5"/>
   <g data-return-stage="context">
    <rect x="26" y="304" width="668" height="55" rx="12" fill="#fff" stroke={C.line}/>
    <Label x={74} y={332} size={21}>上下文</Label>
    {[{label:'问题',x:122,w:65},{label:'历史',x:195,w:65},{label:'原视觉',x:268,w:100},{label:'请求',x:378,w:85}].map((entry,i)=><g key={entry.label} opacity={i===3?request:1}><rect x={entry.x} y="314" width={entry.w} height="35" rx="7" fill={i===2?'#e6f0e8':'#edf1f7'}/><Label x={entry.x+entry.w/2} y={332} size={20}>{entry.label}</Label></g>)}
    <rect x="476" y="311" width="205" height="41" rx="8" fill={insert>0?'#fdf0e5':'#f5f7f3'} stroke={insert===1?C.green:C.line}/><Label x={649} y={332} size={17} color={C.green}>新视觉</Label>
   </g>
   <g data-return-stage="visual-tokens" opacity={cap((phase-.46)/.04)}>
    {Array.from({length:9},(_,i)=>{const lane=i%3,frame=Math.floor(i/3);
     const sx=36+frame*117+lane*29,sy=217;
     const ex=420+lane*29,ey=192+frame*25;
     const px=576+lane*33,py=215;
     const tx=491+lane*43,ty=319;
     const x=lerp(lerp(lerp(sx,ex,encode),px,project),tx,insert),y=lerp(lerp(lerp(sy,ey,encode),py,project),ty,insert);
     const size=lerp(lerp(21,25,project),26,insert);
     return <rect key={i} data-token={i} x={x} y={y} width={size} height={size} rx="4" fill={[C.blue,C.green,C.orange][lane]} stroke="#fff" strokeWidth="1.5"/>;
    })}
   </g>
  </g>;
 }
