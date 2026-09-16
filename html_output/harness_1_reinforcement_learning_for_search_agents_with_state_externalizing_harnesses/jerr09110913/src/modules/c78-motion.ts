import {useEffect,useRef,useState} from 'react';
export function useC78Motion(duration:number){
 const ref=useRef<HTMLDivElement>(null),[progress,setProgress]=useState(1),[running,setRunning]=useState(false),[paused,setPaused]=useState(false),[visible,setVisible]=useState(true),[documentVisible,setDocumentVisible]=useState(()=>!document.hidden);
 const start=()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setProgress(1);setRunning(false)}else{setProgress(0);setRunning(true)}setPaused(false)};
 useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));observer.observe(node);return()=>observer.disconnect()},[]);
 useEffect(()=>{const changed=()=>setDocumentVisible(!document.hidden);document.addEventListener('visibilitychange',changed);const media=window.matchMedia('(prefers-reduced-motion: reduce)');const reduced=()=>{if(media.matches){setProgress(1);setRunning(false);setPaused(false)}};media.addEventListener('change',reduced);return()=>{document.removeEventListener('visibilitychange',changed);media.removeEventListener('change',reduced)}},[]);
 useEffect(()=>{if(!running||paused||!visible||!documentVisible)return;let frame=0,last=performance.now();const tick=(now:number)=>{const delta=now-last;last=now;setProgress(p=>Math.min(1,p+delta/duration));frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[running,paused,visible,documentVisible,duration]);
 useEffect(()=>{if(progress>=1)setRunning(false)},[progress]);
 return {ref,progress,running,paused,start,pause:()=>setPaused(v=>!v),finish:()=>{setProgress(1);setRunning(false);setPaused(false)}};
}
