import React,{useId} from 'react';
import {Stage,Panel,T,C,ramp,ease,Street} from './art';
import type {Props} from './art';

export function Dog({x=0,y=0,s=1}:{x?:number;y?:number;s?:number}){
 return <g data-dog-drawing="true" transform={`translate(${x} ${y}) scale(${s})`} stroke="#805e46" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
  <path d="M52 57L58 78H65Q70 79 68 85H50L45 61Z" fill="#a47752"/>
  <path d="M87 54L92 78H99Q104 80 101 85H84L79 59Z" fill="#a47752"/>
  <path d="M34 45C19 39 14 29 17 17" stroke="#bd946a" strokeWidth="11" fill="none"/>
  <path d="M31 40C40 26 72 26 86 33L96 28C112 34 115 52 106 65L103 78H112Q119 79 117 86H97Q92 85 94 73L97 56L85 62C71 69 56 67 47 63L40 78H47Q54 80 51 86H30Q25 84 29 77L34 61C25 55 25 46 31 40Z" fill="#c69d70"/>
  <ellipse cx="110" cy="28" rx="22" ry="22" fill="#d4ad7f"/>
  <path d="M117 31C125 30 132 32 141 34Q149 36 144 44Q137 51 122 46L114 40Z" fill="#e7c8a2"/>
  <path d="M98 10C90 6 83 12 86 25L89 43Q93 53 100 47Q105 42 105 30L107 14Z" fill="#956d4e"/>
  <circle cx="120" cy="25" r="2.6" fill="#28303b" stroke="none"/>
  <ellipse cx="143" cy="35" rx="5" ry="3.8" fill="#353333" stroke="none"/>
  <path d="M132 45Q137 46 141 42" stroke="#805e46" strokeWidth="1.5" fill="none"/>
  <path d="M95 50L111 53" stroke="#bd5a50" strokeWidth="5"/>
  <circle cx="106" cy="58" r="3" fill="#e0b76e" stroke="#ad8951" strokeWidth="1"/>
 </g>;
}
function Car({x,y,s=1}:{x:number;y:number;s?:number}){return <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M5 34L23 7H72L97 34H110V60H0V38Z" fill="#cc6c54"/><path d="M29 14H68L84 34H16Z" fill="#c9e4ef"/><circle cx="24" cy="60" r="12" fill="#34475f"/><circle cx="86" cy="60" r="12" fill="#34475f"/><circle cx="24" cy="60" r="5" fill="#d4dbe3"/><circle cx="86" cy="60" r="5" fill="#d4dbe3"/></g>;}
export function Review({mode,p}:Props){const verify=mode===1,check=verify?ease(ramp(p,.18,.5)):0,remove=verify?ease(ramp(p,.55,.85)):0;const drop=ease(ramp(remove,0,.35)),across=ease(ramp(remove,.28,.82)),fade=ramp(remove,.8,1),id='road-lens'+useId().replace(/:/g,'');
return <Stage kind="visible-dog-candidate-rejection" height={450} label="工具先提出汽车和狗两个候选，核对原图空路面后撤销狗候选，原图不发生修改">
 <T x={20} y={29} size={21} weight={650}>工具说有狗，图像是否支持这个候选？</T>
 {(verify?['查看工具候选','核对原图区域','撤销误检，保留汽车']:['接受工具候选','跳过图像核对','错误候选进入回答']).map((v,i)=><g key={v}><rect x={20+i*330} y="43" width="319" height="31" rx="6" fill={(p<.18?0:p<.55?1:2)===i?'#dce8f6':'#ecf0f5'}/><T x={34+i*330} y={64} size={16}>{v}</T></g>)}
 <Panel x={20} y={90} w={320} h={319} title="原始图像 · 全程不修改"><g data-original-evidence="true"><Street x={30} y={135}/></g>
 <rect x="85" y="210" width="130" height="91" rx="6" fill="none" stroke={C.green} strokeWidth="2.5"/>
 <g data-motion="false-box" opacity={1-remove}><rect x="247" y="255" width="60" height="65" rx="5" fill="#c43f520b" stroke={C.red} strokeWidth="2.5" strokeDasharray="5 4"/><T x={244} y={246} size={16} fill={C.red}>狗？</T></g>
 <g data-motion="evidence-lens" opacity={verify?ramp(p,.15,.22):0} transform={`translate(276 282) scale(${.6+.4*check})`}><defs><clipPath id={id}><circle r="33"/></clipPath></defs><g clipPath={`url(#${id})`}><rect x="-34" y="-34" width="68" height="68" fill="#929baa"/><rect x="-34" y="-17" width="68" height="51" fill="#929baa"/></g><circle r="33" stroke={C.blue} strokeWidth="5" fill="none"/><path d="M24 24L42 44" stroke={C.blue} strokeWidth="8"/></g>
 <T x={37} y={357} size={17}>汽车有对应物体</T><T x={37} y={389} size={17}>狗候选框内只有空路面</T>
 </Panel>
 <Panel x={370} y={90} w={288} h={319} title="工具候选 · 图标表示类别"/>
 <rect x="387" y="135" width="253" height="88" rx="8" fill="#e8f1ea" stroke="#95b49d"/><Car x={402} y={155} s={.73}/><T x={516} y={169} size={19} weight={650}>汽车</T><T x={516} y={204} size={16} fill={C.green}>保留候选</T>
 <rect data-motion="dog-card" x="387" y="240" width="253" height={138-50*remove} rx="8" fill={verify&&p>.5?'#f8e9eb':'#fff2e3'} stroke={C.red}/>
 <T x={517} y={274} size={19} weight={650}>狗</T><T x={517} y={308} size={16} fill={C.red}>{verify&&p>.55?'证据不支持':'工具提出候选'}</T>
 <g data-motion="dog-candidate" data-rejected={remove===1?'true':'false'} opacity={1-fade} transform={`translate(${405+405*across} ${281+72*drop}) rotate(${18*remove}) scale(${.73*(1-.75*fade)})`}><Dog/></g>
 {verify&&<path data-motion="rejection-stroke" d="M417 284L488 341M488 284L417 341" stroke={C.red} strokeWidth="4" pathLength="1" strokeDasharray="1" strokeDashoffset={1-ramp(p,.49,.55)} opacity={1-remove}/>}
 <T x={388} y={393} size={15} fill={C.muted}>{verify&&p>.86?'狗候选已从结果集合移除':'候选图标不是原图中的物体'}</T>
 <Panel x={713} y={90} w={287} h={319} title={verify?'整合视觉证据后的回答':'直接复述工具候选'} active={p>.85}/>
 <Car x={742} y={150} s={.82}/><T x={855} y={180} size={20} weight={650}>汽车</T>
 {verify?<><T x={734} y={250} size={18}>{p<.55?'检查汽车与狗的候选区域':p<.86?'撤销没有图像依据的狗候选':'图中有汽车，没有狗。'}</T><g transform="translate(856 345)"><path d="M-26 0H26L21 45H-21Z" fill="#f3dce0" stroke={C.red} strokeWidth="2"/><path d="M-31-5H31M-11-12H11" stroke={C.red} strokeWidth="4" strokeLinecap="round"/><path d="M-9 8V31M9 8V31" stroke={C.red} strokeWidth="2"/></g><T x={729} y={390} size={15} fill={C.red}>{remove===1?'已撤销误检':'撤销区'}</T></>:<><Dog x={746} y={253} s={.8}/><T x={733} y={372} size={18} fill={C.red}>“图中有汽车和狗。”</T></>}
 <T x={20} y={437} size={16} fill={C.muted}>撤销的是错误检测候选；原图没有被修补或擦除。这个例子展示视觉复核的作用。</T>
 </Stage>;
}
