 import React,{createContext,useCallback,useContext,useEffect,useId,useRef,useState} from 'react';
 import type {Kind} from '../data/lessons';
 type RewardKind='task-reward'|'sample-reward';
 type RewardDemo={value:number;clock:number;playing:boolean;manual:boolean;change:(value:number)=>void;toggle:()=>void;replay:()=>void;seek:(clock:number)=>void;trackVisibility:(id:string,visible:boolean)=>void};
 const RewardContext=createContext<RewardDemo|null>(null);
 const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
 function RewardDemoState({kind,children}:{kind:RewardKind;children:React.ReactNode}){
  const [clock,setClock]=useState(0),[playing,setPlaying]=useState(true),[manualValue,setManualValue]=useState<number|null>(null),[visibleCount,setVisibleCount]=useState(0);
  const views=useRef(new Set<string>());
  const trackVisibility=useCallback((id:string,visible:boolean)=>{if(visible)views.current.add(id);else views.current.delete(id);setVisibleCount(views.current.size);},[]);
  useEffect(()=>{if(!playing||visibleCount===0)return;let id=0,last=performance.now();const tick=(now:number)=>{if(now-last>=40){const dt=now-last;last=now;if(document.visibilityState==='visible')setClock(v=>v+Math.min(dt,100));}id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[playing,visibleCount]);
  const phase=(clock%4000)/4000,progress=clamp((phase-.08)/.7);
  const value=manualValue??(kind==='sample-reward'?1.5:Math.round((.1+.75*progress)*100)/100);
  const change=(n:number)=>setManualValue(Math.round(clamp(n,0,kind==='sample-reward'?2:1)*100)/100);
  const replay=()=>{setClock(0);setManualValue(null);setPlaying(true);};
  const seek=(n:number)=>{setClock(n);setPlaying(false);};
  return <RewardContext.Provider value={{value,clock,playing,manual:manualValue!==null,change,replay,seek,toggle:()=>setPlaying(v=>!v),trackVisibility}}>{children}</RewardContext.Provider>;
 }
 export function RewardDemoProvider({kind,children}:{kind:Kind;children:React.ReactNode}){
  return kind==='task-reward'||kind==='sample-reward'?<RewardDemoState kind={kind}>{children}</RewardDemoState>:<>{children}</>;
 }
 export function useRewardDemo(visible:boolean){
  const demo=useContext(RewardContext),id=useId(),track=demo?.trackVisibility;
  useEffect(()=>{if(!track)return;track(id,visible);return()=>track(id,false);},[track,id,visible]);
  return demo;
 }
