import React,{createContext,useContext,useMemo,useState} from 'react';

export type DirectorIntent='cinematic'|'tutorial'|'social';
export type TimelineClip={id:string;label:string;start:number;end:number;role:string};
type Session={intent:DirectorIntent;setIntent:(v:DirectorIntent)=>void;shot:string;setShot:(v:string)=>void;start:number;setStart:(v:number)=>void;end:number;setEnd:(v:number)=>void;clips:TimelineClip[];setClips:React.Dispatch<React.SetStateAction<TimelineClip[]>>;reset:()=>void};
const EditingContext=createContext<Session|null>(null);
const defaults:TimelineClip[]=[{id:'opening',label:'开场',start:0,end:2.2,role:'全局理解'},{id:'seasoning',label:'调味',start:4,end:10,role:'检索 + 裁剪'},{id:'finish',label:'收尾镜头',start:12,end:14.8,role:'分镜结果'}];

export function EditingSessionProvider({children}:{children:React.ReactNode}){const [intent,setIntent]=useState<DirectorIntent>('cinematic');const [shot,setShot]=useState('');const [start,setStart]=useState(4);const [end,setEnd]=useState(10);const [clips,setClips]=useState<TimelineClip[]>(defaults);const reset=()=>{setIntent('cinematic');setShot('');setStart(4);setEnd(10);setClips(defaults)};const value=useMemo(()=>({intent,setIntent,shot,setShot,start,setStart,end,setEnd,clips,setClips,reset}),[intent,shot,start,end,clips]);return <EditingContext.Provider value={value}>{children}</EditingContext.Provider>}
export function useEditingSession(){const v=useContext(EditingContext);if(!v)throw new Error('useEditingSession must be used inside EditingSessionProvider');return v}
