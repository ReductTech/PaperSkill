import React, { useEffect, useRef, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import './dfa.css';

export const C={blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',ink:'#21324a',muted:'#68778f',line:'#d7deea',paper:'#fbfaf6',pale:'#edf1f4',wood:'#d8c4a6'};
export const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
export const fmt=(n:number,digits=2)=>Number(n.toFixed(digits)).toString();
export const sigmoid=(n:number)=>1/(1+Math.exp(-n));
export function softmax(values:number[]){const max=Math.max(...values);const ex=values.map(v=>Math.exp(v-max));const sum=ex.reduce((a,b)=>a+b,0);return ex.map(x=>x/sum);}
export function S({children,meaning}:{children:React.ReactNode;meaning:string}){return <SymbolHint meaning={meaning}>{children}</SymbolHint>;}
let measureContext:CanvasRenderingContext2D|null=null;
export function SvgText({x=0,y=0,textAnchor='start',fill=C.ink,fontSize=28,fontWeight=500,className='',children,...rest}:{x?:number|string;y?:number|string;textAnchor?:string;fill?:string;fontSize?:number|string;fontWeight?:number|string;className?:string;children?:React.ReactNode;[key:string]:unknown}){
 const text=React.Children.toArray(children).join('');if(!text)return null;
 const size=className.includes('heading')?34:Number(fontSize);
 const weight=className.includes('heading')?750:fontWeight;
 const family=getComputedStyle(document.body).fontFamily;
 measureContext??=document.createElement('canvas').getContext('2d');
 if(measureContext)measureContext.font=`${weight} ${size}px ${family}`;
 const width=Math.ceil(measureContext?.measureText(text).width??text.length*size)+6;
 const left=Number(x)-(textAnchor==='middle'?width/2:textAnchor==='end'?width:0);
 return <foreignObject x={left} y={Number(y)-size*1.05} width={width} height={Math.ceil(size*1.45)}>
 <div className={className} style={{fontFamily:family,fontSize:size,fontWeight:weight,color:fill,lineHeight:1.4,whiteSpace:'nowrap',margin:0,padding:0,width:'100%'}} {...rest}>{text}</div>
 </foreignObject>;
}
export function useTween(value:number,duration=450){
 const [shown,setShown]=useState(value);const current=useRef(value);
 useEffect(()=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches){current.current=value;setShown(value);return;}
 const initial=current.current,start=performance.now();let frame=0;
 const tick=(now:number)=>{const t=clamp((now-start)/duration,0,1);const next=initial+(value-initial)*(1-(1-t)**3);current.current=next;setShown(next);if(t<1)frame=requestAnimationFrame(tick);};
 frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[value,duration]);return shown;
}
export function Photo({x=0,y=0,w=180,h=130,kind='flower',color=C.blue,label}:{x?:number;y?:number;w?:number;h?:number;kind?:'flower'|'city'|'face'|'landscape';color?:string;label?:string}){
 const ih=h-(label?42:16),iw=w-16;
 return <g transform={`translate(${x} ${y})`} aria-hidden="true">
 <rect width={w} height={h} rx="5" fill="white" stroke={C.line} strokeWidth="2"/>
 <svg x="8" y="8" width={iw} height={ih} viewBox="0 0 180 120" preserveAspectRatio="xMidYMid slice">
 <rect width="180" height="120" fill="#e4eced"/>
 {kind==='flower'?<g><path d="M90 120 Q95 85 90 55" stroke="#76906a" strokeWidth="8" fill="none"/><path d="M91 102 Q48 72 61 111Z M91 87 Q139 64 126 100Z" fill="#a8be99"/>{[0,60,120,180,240,300].map(a=><ellipse key={a} cx="90" cy="35" rx="15" ry="24" fill={color} opacity=".75" transform={`rotate(${a} 90 56)`}/>)}<circle cx="90" cy="56" r="15" fill="#efc371"/></g>:
 kind==='city'?<g><rect x="20" y="40" width="48" height="90" fill={color} opacity=".7"/><rect x="79" y="12" width="42" height="108" fill={color}/><rect x="133" y="59" width="36" height="61" fill="#879da4"/>{[0,1,2].map(i=><path key={i} d={`M31 ${54+i*23}h25 M90 ${31+i*28}h19`} stroke="#e9dfbb" strokeWidth="8"/>)}<path d="M0 112H180" stroke="#d5c0a5" strokeWidth="16"/></g>:
 kind==='face'?<g><ellipse cx="90" cy="121" rx="56" ry="46" fill={color}/><ellipse cx="90" cy="58" rx="35" ry="44" fill="#dfb89b"/><path d="M55 48 Q52 -4 102 16 Q131 18 124 58L112 34Q92 50 65 36Z" fill="#5f5553"/><circle cx="78" cy="59" r="3" fill={C.ink}/><circle cx="103" cy="59" r="3" fill={C.ink}/><path d="M77 78Q90 88 104 77" stroke="#9a605d" strokeWidth="3" fill="none"/></g>:
 <g><circle cx="143" cy="29" r="17" fill="#e3c08a"/><path d="M0 94L57 34L121 117H0Z" fill={color} opacity=".7"/><path d="M74 120L133 50L180 99V120Z" fill="#94aa98"/><path d="M0 111Q80 80 180 108V120H0Z" fill="#b4c7cb"/></g>}
 </svg>{label&&<SvgText x={w/2} y={h-10} textAnchor="middle" fill={C.ink} fontSize="28">{label}</SvgText>}</g>;
}
export function Camera({x=0,y=0,scale=1,color=C.blue,angle=0}:{x?:number;y?:number;scale?:number;color?:string;angle?:number}){return <g transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden="true"><path d="M-80-34h31l12-20h48l12 20h42q15 0 15 15v76q0 15-15 15H-80q-15 0-15-15v-76q0-15 15-15" fill={color}/><rect x="-70" y="-22" width="31" height="17" rx="4" fill="#c1d0d7"/><circle cy="15" r="48" fill="#b4c2c8" stroke="#1b344d" strokeWidth="8"/><circle cy="15" r="32" fill="#385a6b"/><circle cy="15" r="21" fill="#142f44"/><path d="M-15-1Q5-14 19 6" stroke="#acc6cf" strokeWidth="7" fill="none"/><g transform={`rotate(${angle} 0 15)`}><path d="M0-29v10" stroke={C.orange} strokeWidth="7"/></g><circle cx="63" cy="-18" r="5" fill="#d5dfe3"/></g>;}
export function Film({x=0,y=0,w=180,label,color=C.blue}:{x?:number;y?:number;w?:number;label?:string;color?:string}){return <g transform={`translate(${x} ${y})`} aria-hidden="true"><rect width={w} height="110" rx="6" fill={color}/>{Array.from({length:Math.floor(w/24)},(_,i)=><g key={i}><rect x={8+i*24} y="5" width="12" height="8" rx="2" fill={C.paper}/><rect x={8+i*24} y="97" width="12" height="8" rx="2" fill={C.paper}/></g>)}<rect x="12" y="23" width={w-24} height="64" rx="2" fill="#eff3ef"/><SvgText x={w/2} y="65" textAnchor="middle" fill={C.ink} fontSize="28">{label??'特征记录'}</SvgText></g>;}
export function Range({label,value,min,max,step=.1,onChange,unit=''}:{label:string;value:number;min:number;max:number;step?:number;onChange:(n:number)=>void;unit?:string}){return <label className="dfa-range"><span>{label}<b>{fmt(value)}{unit}</b></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;}
export function Feedback({children,tone='blue'}:{children:React.ReactNode;tone?:'blue'|'green'|'red'|'orange'|'neutral'}){return <div className={`dfa-feedback dfa-tone-${tone}`} aria-live="polite">{children}</div>;}
