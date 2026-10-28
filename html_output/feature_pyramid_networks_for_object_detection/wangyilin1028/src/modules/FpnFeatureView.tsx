import React from 'react';
import { C, clamp } from './FpnKit';

export const featureSide = 16;
// 手工构造的单通道响应，用于解释操作；不是训练所得激活或类别概率。
export function makeFeatureExample():{detail:number[];top:number[]} {
  const person = (r:number,c:number) =>
    ((r===2||r===3)&&(c===7||c===8)) ||
    (r>=5&&r<=9&&c>=6&&c<=9) ||
    (r>=6&&r<=8&&(c===5||c===10)) ||
    (r>=10&&r<=13&&(c===6||c===9));
  const detail = Array.from({length:256},(_,i)=>{
    const r=Math.floor(i/16),c=i%16;
    const outline=person(r,c)&&[[r-1,c],[r+1,c],[r,c-1],[r,c+1]].some(([y,x])=>!person(y,x));
    const background=(c===1||c===3||c===12||c===14)&&r>=3&&r<=11;
    const windows=(r===5||r===8)&&(c<=3||c>=12);
    return outline?2:background||windows?1:0;
  });
  const top=Array.from({length:64},(_,i)=>{
    const r=Math.floor(i/8),c=i%8;
    return [0,1].some(y=>[0,1].some(x=>person(r*2+y,c*2+x)))?2:0;
  });
  return {detail,top};
}
export function upsampleFeature(top:number[]) {
  return Array.from({length:256},(_,i)=>top[Math.floor(Math.floor(i/16)/2)*8+Math.floor((i%16)/2)]);
}
export function addFeature(detail:number[],up:number[],amount=1,lateral=true) {
  return up.map((v,i)=>v*amount+(lateral?detail[i]:0));
}
export function FeatureView({values,n=16,size=276,tone='detail',selected,onPick,windowStart,label}:{values:number[];n?:number;size?:number;tone?:'detail'|'top'|'fused';selected?:number;onPick?:(index:number)=>void;windowStart?:[number,number];label:string}) {
 const pad=8,cell=256/n;
 const pick=(e:React.MouseEvent<SVGSVGElement>)=>{
   if(!onPick)return;
   const b=e.currentTarget.getBoundingClientRect();
   const col=clamp(Math.floor(((e.clientX-b.left)/b.width*272-pad)/cell),0,n-1);
   const row=clamp(Math.floor(((e.clientY-b.top)/b.height*272-pad)/cell),0,n-1);
   onPick(n===16?row*16+col:row*2*16+col*2);
 };
 return <svg viewBox="0 0 272 272" width={size} height={size} role="img" aria-label={label} tabIndex={onPick?0:undefined} onClick={pick} style={{borderRadius:16,cursor:onPick?'crosshair':'default',outlineOffset:5}}
   onKeyDown={e=>{if(!onPick)return;const offsets:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-16,ArrowDown:16};if(e.key in offsets){e.preventDefault();e.stopPropagation();onPick(clamp((selected??118)+offsets[e.key],0,255));}}}>
   <rect x="0" y="0" width="272" height="272" rx="16" fill="#f4f6f8" stroke={C.line}/>
   {values.map((v,i)=>{const level=clamp(v/6,0,1);const color=tone==='detail'?C.blue:tone==='top'?C.purple:C.green;return <rect key={i} x={pad+i%n*cell} y={pad+Math.floor(i/n)*cell} width={cell} height={cell} fill={v>0?color:'#fff'} fillOpacity={v>0?.17+.83*level:1} stroke="#dce3e9" strokeWidth=".45"/>;})}
   {windowStart&&<rect x={pad+windowStart[1]*16} y={pad+windowStart[0]*16} width="64" height="64" fill="none" stroke={C.orange} strokeWidth="2.5"/>}
   {selected!==undefined&&n===16&&<rect x={pad+selected%16*16} y={pad+Math.floor(selected/16)*16} width="16" height="16" fill="none" stroke={C.orange} strokeWidth="3"/>}
 </svg>;
}
