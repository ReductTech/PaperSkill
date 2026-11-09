/* Initial draft, 2026-10-21. Non-rendered handoff marker; see sibling MODEL_HANDOFF.md. */
import React from 'react';

type ChipProps = { active?: boolean; onClick: () => void; children: React.ReactNode };
export const Chip: React.FC<ChipProps> = ({ active=false, onClick, children }) => <button type="button" className={'ts-chip'+(active?' is-active':'')} aria-pressed={active} onClick={onClick}>{children}</button>;
export const Tag: React.FC<{kind?:'paper'|'demo'|'method';children:React.ReactNode}> = ({kind='paper',children}) => <span className={'ts-tag ts-tag-'+kind}>{children}</span>;
export const Feedback: React.FC<{children:React.ReactNode}> = ({children}) => <div className="ts-feedback" aria-live="polite">{children}</div>;
export const INTERVALS = [[8,17],[16,22],[13.9,22.4]] as const;
export const intervalIoU = (interval:readonly number[]) => {
 const overlap=Math.max(0,Math.min(interval[1],22.4)-Math.max(interval[0],13.9));
 return overlap/(Math.max(interval[1],22.4)-Math.min(interval[0],13.9));
};
export const Timeline: React.FC<{target?:boolean; candidate?:number; second?:boolean}> = ({target=true,candidate=0}) => {
 const interval=INTERVALS[candidate] || INTERVALS[0];
 const position=(a:number,b:number)=>({left:(6+a/30*88)+'%',width:((b-a)/30*88)+'%'});
 return <div className="ts-timeline" role="img" aria-label={`真值 13.9 至 22.4 秒；当前区间 ${interval[0]} 至 ${interval[1]} 秒`}><div className="ts-axis"/><span className="ts-tick t0">0 秒</span><span className="ts-tick t1">30 秒</span>{target&&<span className="ts-segment ts-target" style={position(13.9,22.4)}/>}<span className="ts-segment ts-candidate" style={position(interval[0],interval[1])}/><span className="ts-playhead" style={{left:(6+interval[0]/30*88)+'%'}}/><span className="ts-legend"><i className="target-dot"/>真值 <i className="policy-dot"/>{candidate===2?'外部参考':'策略候选'}</span></div>;
};
export const Metric: React.FC<{label:string;value:string;hint?:string}> = ({label,value,hint}) => <div className="ts-metric"><span>{label}</span><strong>{value}</strong>{hint&&<small>{hint}</small>}</div>;
export const SHAPE=(r:number)=>r>=0.8?0.8+0.01*Math.log(1+(r-0.8)):0.8-(Math.exp(0.8-r)-1)/(Math.E-1);
export const stopRangeNav=(e:React.KeyboardEvent<HTMLInputElement>)=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.stopPropagation();};

export const groupStats=(rewards:number[])=>{
 const mean=rewards.reduce((a,b)=>a+b,0)/rewards.length;
 const sigma=Math.sqrt(rewards.reduce((a,b)=>a+(b-mean)**2,0)/rewards.length);
 return {mean,sigma,advantages:rewards.map(r=>sigma>1e-8?(r-mean)/sigma:0)};
};
export const AdvantageBars:React.FC<{values:number[];labels?:string[]}> = ({values,labels})=><div className="ts-signed-bars">{values.map((value,i)=><div className="ts-signed-row" key={i}><span>{labels?.[i] || (i===3?'真值 GT':'候选 '+(i+1))}</span><div className="ts-signed-track"><i className={value>=0?'pos':'neg'} style={{left:(value>=0?50:50-Math.min(Math.abs(value)/2*46,46))+'%',width:Math.min(Math.abs(value)/2*46,46)+'%'}}/></div><b className={value>=0?'positive':'negative'}>{value>=0?'+':''}{value.toFixed(2)}</b></div>)}</div>;
