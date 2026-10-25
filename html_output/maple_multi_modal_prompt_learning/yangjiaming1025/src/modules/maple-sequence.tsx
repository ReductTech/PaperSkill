import {useEffect,useRef,useState} from 'react';
import './maple-motion.css';
export function Sequence({steps,value,onChange,caption='逐步观察',duration=3200}:{steps:string[];value:number;onChange:(n:number)=>void;caption?:string;duration?:number}){
 const [playing,setPlaying]=useState(false);const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!playing)return;if(value===steps.length-1){setPlaying(false);return;}const timer=window.setTimeout(()=>onChange(value+1),duration);return()=>window.clearTimeout(timer)},[playing,value,steps.length,duration,onChange]);
 useEffect(()=>{const el=ref.current;if(!el)return;const watcher=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting)setPlaying(false)},{threshold:0});watcher.observe(el);const hide=()=>{if(document.hidden)setPlaying(false)};document.addEventListener('visibilitychange',hide);return()=>{watcher.disconnect();document.removeEventListener('visibilitychange',hide)}},[]);
 return <div className="maple-sequence" ref={ref}>
  <div className="sequence-heading"><span>{caption}</span><button type="button" className="sequence-play" aria-pressed={playing} onClick={()=>{if(!playing&&value===steps.length-1)onChange(0);setPlaying(p=>!p)}}>{playing?'Ⅱ 暂停':'▷ 自动走一遍'}</button></div>
  <div className="sequence-track" role="group" aria-label={caption} style={{'--step-count':steps.length} as React.CSSProperties}>{steps.map((name,i)=><button type="button" key={name} className={'sequence-step '+(i===value?'is-current':i<value?'is-complete':'')} aria-pressed={value===i} onClick={()=>{setPlaying(false);onChange(i)}}><span className="sequence-number">{String(i+1).padStart(2,'0')}</span><span>{name}</span>{i===value&&playing&&<i key={value} style={{animationDuration:duration+'ms'}}/>}</button>)}</div>
 </div>;
}
export function ActionCaption({label,action,result}:{label:string;action:string;result:string}){return <div className="maple-action-caption" key={label}><span className="action-index">{label}</span><div><strong>{action}</strong><p>{result}</p></div></div>}
