import { SvgText } from './dfa-kit';
import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { C, Camera, Photo, clamp } from './dfa-kit';
import './dfa.css';
export function DfaCover({moduleId}:WidgetProps){
 const {progress}=useCoverPlayback();const good=moduleId==='newMethod';
 const t=clamp((progress-.12)/.66,0,1),drift=good?t*.12:t;
 return <div className="dfa-cover-art"><svg viewBox="0 0 664 324" role="img" aria-label={good?'独立校准与题材学习共同完成摄影练习':'新题材练习同时牵动原有校准'}>
 <rect width="664" height="324" rx="18" fill={C.paper}/>
 <path d="M0 271H664V324H0Z" fill="#d8c4a6"/>
 <g transform={`translate(28 ${24+drift*22}) rotate(${drift*11} 75 80)`}><Photo w={148} h={150} kind="landscape" color={good?C.blue:C.red}/><SvgText x="74" y="187" textAnchor="middle" fill={drift>.5?C.red:C.blue} fontSize="28">原有能力</SvgText></g>
 <Camera x={325} y={164} scale={1.03} color={good?C.green:C.blue} angle={t*100}/>
 <path d={`M419 157L${510} ${70+t*20}`} stroke={good?C.green:C.orange} strokeWidth="4" strokeDasharray="8 8" opacity=".55"/>
 <g transform={`translate(${520-40*t} ${40+15*t})`}><Photo w={146} h={151} kind="flower" color={C.orange}/><SvgText x="73" y="187" textAnchor="middle" fill={C.blue} fontSize="28">新题材</SvgText></g>
 {good?<g><path d="M220 79Q276 23 370 65" fill="none" stroke={C.green} strokeWidth="6"/><rect x="278" y="32" width="95" height="47" rx="8" fill="#e7f1e9" stroke={C.green} strokeWidth="3"/><SvgText x="325" y="64" textAnchor="middle" fill={C.green} fontSize="28">对齐</SvgText></g>:<path d={`M216 78Q${268+drift*24} ${25+drift*60} 371 65`} fill="none" stroke={C.red} strokeWidth="6"/>}
 </svg><div className="dfa-cover-label">机制示意 · {good?'校准与适应分工':'两类目标相互牵动'}</div></div>;
}
