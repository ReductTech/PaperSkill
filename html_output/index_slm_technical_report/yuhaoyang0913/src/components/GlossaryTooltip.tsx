import { useEffect, useRef, useState } from 'react';

type TipState = { text:string; x:number; y:number; below:boolean } | null;

export function GlossaryTooltip(){
  const [tip,setTip]=useState<TipState>(null);
  const activeTarget=useRef<Element|null>(null);
  const visible=useRef(false);
  useEffect(()=>{
    let touchPrimed=false;
    const locate=(target:Element)=>{
      const rect=target.getBoundingClientRect();
      const width=Math.min(360,window.innerWidth-24);
      const x=Math.max(width/2+12,Math.min(window.innerWidth-width/2-12,rect.left+rect.width/2));
      const below=rect.top<150;
      activeTarget.current=target;visible.current=true;setTip({text:target.getAttribute('data-tip')||'',x,y:below?rect.bottom+10:rect.top-10,below});
    };
    const hide=()=>{activeTarget.current=null;visible.current=false;setTip(null)};
    const down=(event:PointerEvent)=>{touchPrimed=event.pointerType!=='mouse'};
    const over=(event:PointerEvent)=>{if(event.pointerType!=='mouse')return;const target=(event.target as Element)?.closest?.('.term');if(target)locate(target)};
    const out=(event:PointerEvent)=>{if(event.pointerType!=='mouse')return;const target=(event.target as Element)?.closest?.('.term');if(target)hide()};
    const focus=(event:FocusEvent)=>{if(touchPrimed)return;const target=(event.target as Element)?.closest?.('.term');if(target)locate(target)};
    const blur=(event:FocusEvent)=>{if(touchPrimed)return;const target=(event.target as Element)?.closest?.('.term');if(target)hide()};
    const click=(event:Event)=>{const target=(event.target as Element)?.closest?.('.term');if(target){event.preventDefault();if(activeTarget.current===target&&visible.current)hide();else locate(target)}else hide();touchPrimed=false};
    document.addEventListener('pointerdown',down);document.addEventListener('pointerover',over);document.addEventListener('pointerout',out);document.addEventListener('focusin',focus);document.addEventListener('focusout',blur);document.addEventListener('click',click);
    return()=>{document.removeEventListener('pointerdown',down);document.removeEventListener('pointerover',over);document.removeEventListener('pointerout',out);document.removeEventListener('focusin',focus);document.removeEventListener('focusout',blur);document.removeEventListener('click',click)};
  },[]);
  if(!tip)return null;
  const parts=tip.text.split('｜');const names=(parts[0]||'').split(' / ');const intuition=(parts[1]||'').replace(/^直觉：/,'');const role=(parts[2]||'').replace(/^本文：/,'');
  return <div className={`global-glossary-tooltip ${tip.below?'below':''}`} style={{left:tip.x,top:tip.y}} role="tooltip"><header><b>{names[0]}</b><span>{names.slice(1).join(' / ')}</span></header><p><small>一句话直觉</small>{intuition}</p><p><small>在 Index SLM 中的作用</small>{role}</p><i>再次点击术语或点击空白处关闭</i></div>;
}
