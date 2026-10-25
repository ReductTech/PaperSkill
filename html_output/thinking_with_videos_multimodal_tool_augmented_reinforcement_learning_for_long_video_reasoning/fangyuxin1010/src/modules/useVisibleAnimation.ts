import {useEffect,useRef,useState} from 'react';
export function useVisibleAnimation<T extends Element>(){
 const ref=useRef<T>(null);
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  const node=ref.current;if(!node)return;
  const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{rootMargin:'50px 0px',threshold:0});
  observer.observe(node);return()=>observer.disconnect();
 },[]);
 return {ref,visible};
}
