import {useEffect, useRef, useState} from 'react';

const wheelPixels = (event: WheelEvent) => event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
const isVertical = (event: WheelEvent) => !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX);
const controls = 'button,input,select,textarea,[contenteditable="true"],a';

export function useTimeline(max: number) {
  const [progress,setProgress]=useState(0);
  const target=useRef(0),value=useRef(0),raf=useRef(0);
  useEffect(()=>()=>cancelAnimationFrame(raf.current),[]);
  const seek=(next:number,immediate=false)=>{
    target.current=Math.max(0,Math.min(max,next));
    if(immediate||window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      cancelAnimationFrame(raf.current);raf.current=0;value.current=target.current;setProgress(value.current);return;
    }
    if(raf.current)return;
    let last=performance.now();
    const tick=(now:number)=>{
      value.current+=(target.current-value.current)*(1-Math.exp(-Math.min(40,now-last)/45));last=now;
      if(Math.abs(target.current-value.current)<.0002)value.current=target.current;
      setProgress(value.current);
      raf.current=value.current===target.current?0:requestAnimationFrame(tick);
    };
    raf.current=requestAnimationFrame(tick);
  };
  return {progress,target,seek};
}
export type Timeline=ReturnType<typeof useTimeline>;

/** Continuous wheel deltas share the same target as the slider and diagram. */
export function useDiagramWheel(timeline:Timeline, max:number) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({timeline,max});
  state.current = {timeline,max};
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let lastEvent = 0, endSince = 0;
    const wheel = (event: WheelEvent) => {
      const target=event.target as Element;
      if (!isVertical(event) || (target.closest(controls)&&!target.closest('[data-progress-control]'))) return;
      const now = performance.now(), delta = wheelPixels(event), sign = Math.sign(delta);
      const fresh=now-lastEvent>160;
      lastEvent = now;
      const {timeline:current,max:limit}=state.current;
      const atEnd=sign>0?current.progress>=limit-.00001:current.progress<=.00001;
      if(atEnd&&current.progress===current.target.current){
        if(!endSince)endSince=now;
        if(!fresh&&now-endSince<260)event.preventDefault();
        return;
      }
      endSince=0;
      event.preventDefault();
      current.seek(current.target.current+Math.max(-400,Math.min(400,delta))*limit/1500);
    };
    element.addEventListener('wheel', wheel, {passive: false});
    return () => element.removeEventListener('wheel', wheel);
  }, []);
  return ref;
}

/** Only downward reading at the chapter end can change chapters. */
export function useChapterWheel(enabled: boolean, chapter: number, next: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const openedAt = performance.now();
    let amount = 0, lastEvent = 0, navigated = false;
    const wheel = (event: WheelEvent) => {
      const target = event.target as Element;
      if (event.defaultPrevented || !isVertical(event) || event.deltaY <= 0 ||
          !target.closest('.slide-main') || target.closest(controls) || document.querySelector('.ai-panel')) {
        amount = 0;
        return;
      }
      // Nested reading areas retain their own scroll behavior.
      for (let node = target; node && node !== document.body; node = node.parentElement!) {
        if (/(auto|scroll)/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight + 2) return;
      }
      const page = document.scrollingElement;
      if (!page || page.scrollHeight - page.scrollTop - window.innerHeight > 4) {amount = 0; return;}
      event.preventDefault();
      const now = performance.now();
      if (navigated || now - openedAt < 1100) return;
      if (now - lastEvent > 200) amount = 0;
      lastEvent = now;
      amount += Math.min(wheelPixels(event), 120);
      if (amount >= 90) {navigated = true; next();}
    };
    window.addEventListener('wheel', wheel, {passive: false});
    return () => window.removeEventListener('wheel', wheel);
  }, [enabled, chapter, next]);
}

export const ReadingWheelWidget=()=>null;
