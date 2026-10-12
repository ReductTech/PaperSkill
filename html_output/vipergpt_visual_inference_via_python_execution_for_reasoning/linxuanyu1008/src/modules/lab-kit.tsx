import React, { useEffect, useState } from 'react';
import { C } from './viper-kit';

export const labCss = `
.vlab { color: #21324a; min-width: 0; font-size: 18px; line-height: 1.55; }
.vlab * { box-sizing: border-box; }
.vlab .hero-pipeline{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:16px;margin:4px 0 10px;color:#27446e}.vlab .lab-formula{display:grid;gap:8px;padding:14px 18px;background:#f5f8f0;margin-bottom:14px}.vlab .lab-formula strong{font-size:26px;color:#27446e}.vlab .lab-formula small{font-size:16px;color:#68778f}.vlab .source-tag{display:inline-block;padding:3px 8px;border-radius:4px;border:1px solid #d7deea;color:#27446e;background:#edf3f8;font-size:16px;margin-right:8px}
.vlab .lab-question { margin: 0 0 16px; padding: 14px 18px; border-left: 4px solid #27446e; background: #edf3f8; font-size: 20px; }
.vlab .lab-columns { display: grid; grid-template-columns: repeat(auto-fit,minmax(min(100%,300px),1fr)); gap: 18px; align-items: start; }
.vlab .lab-heading { margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #27446e; }
.vlab .lab-experiment { margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #d7deea; }
.vlab .lab-switch { display: flex; align-items: center; gap: 8px; min-height: 44px; cursor: pointer; }
.vlab .lab-switch input { width: 20px; height: 20px; accent-color: #27446e; flex-shrink: 0; }
.vlab .lab-range { display: block; width: 100%; margin: 12px 0 16px; accent-color: #27446e; }
.vlab .lab-stage .lab-primary { background: #27446e; color: white; border-color: #27446e; }
.vlab .lab-stage button:disabled { opacity: .5; cursor: default; }
.vlab .lab-verdict { padding: 12px 14px; border-left: 4px solid #c43f52; background: #fff2ec; }
.vlab .lab-verdict[data-correct=true] { border-color: #228d5c; background: #edf7f0; }
.vlab .lab-live-strip { display: flex; flex-wrap: wrap; gap: 8px 20px; padding: 12px 16px; background: #edf3f8; border-left: 4px solid #27446e; margin: 8px 0 12px; }
.vlab .lab-caption { margin: 8px 0 12px; font-size: 16px; color: #68778f; line-height: 1.5; }
.vlab .ctrl { margin: 8px 0; padding: 8px 10px; gap: 8px; }
.vlab .lab-stage { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
.vlab .lab-stage button { font: inherit; background: white; border: 1px solid #d7deea; border-radius: 6px; padding: 8px 12px; text-align: left; cursor: pointer; color: #21324a; }
.vlab .lab-stage button[aria-current=step], .vlab .lab-stage button[aria-pressed=true] { background: #27446e; color: white; border-color: #27446e; }
.vlab button:focus-visible, .vlab input:focus-visible, .vlab [tabindex]:focus-visible { outline: 3px solid #f07e47; outline-offset: 3px; }
.vlab .lab-output { margin: 12px 0; padding: 12px 16px; background: #f5f8f0; border-left: 4px solid #d7deea; min-width: 0; overflow-wrap: anywhere; }
.vlab .lab-output.is-active { border-color: #27446e; }
.vlab .lab-output.is-good { border-color: #228d5c; background: #edf7f0; }
.vlab .lab-value { display: block; margin: 5px 0; color: #27446e; font-size: 24px; font-weight: 700; }
.vlab .lab-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 14px 0; }
.vlab .lab-flow > span { border-bottom: 3px solid #d7deea; padding: 6px 10px; }
.vlab .lab-flow > span.current { border-color: #f07e47; background: #fff3e9; }
.vlab .lab-flow > span.complete { border-color: #228d5c; }
.vlab .lab-flow > b { color: #68778f; }
.vlab .lab-code { background: #f5f8f0; border: 1px solid #d7deea; border-radius: 8px; overflow: hidden; margin: 12px 0; }
.vlab .lab-code-title { padding: 10px 14px; font-size: 16px; color: #68778f; border-bottom: 1px solid #d7deea; }
.viper-tool .vlab .lab-code pre { font-family: Consolas, 'Cascadia Mono', 'Courier New', monospace; font-size: 18px; line-height: 1.6; background: transparent; margin: 0; padding: 6px 0; border-radius: 0; }
.vlab .lab-line { display: grid; grid-template-columns: 35px minmax(0,1fr); padding: 5px 12px; border-left: 4px solid transparent; }
.vlab .lab-line.is-active { border-left-color: #f07e47; background: #fff0df; }
.vlab .lab-line.is-muted { color: #68778f; }
.vlab .lab-line-no { color: #68778f; font-size: 15px; user-select: none; }
.vlab .lab-line code { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; }
.vlab .lab-photo { margin: 0; position: relative; overflow: hidden; border: 1px solid #d7deea; border-radius: 6px; background: #f5f8f0; }
.vlab .lab-photo img { display: block; width: 100%; height: auto; }
.vlab .lab-photo .region { position: absolute; border: 3px solid #27446e; pointer-events: none; }
.vlab .lab-photo .region.returned { border-color: #228d5c; border-width: 4px; }
.vlab .lab-photo .region > span { position: absolute; top: -1px; left: -1px; color: white; background: #27446e; padding: 0 5px; font-size: 15px; }
.vlab .lab-table-scroll { width: 100%; overflow-x: auto; }
.vlab table { border-collapse: collapse; width: 100%; font-size: 18px; }
.vlab td, .vlab th { border-bottom: 1px solid #d7deea; padding: 9px 10px; text-align: left; }
.vlab .lab-term { font-family: Consolas, monospace; font-weight: 700; }
@media (prefers-reduced-motion: reduce) { .vlab * { transition: none !important; animation: none !important; } }
`;
export function LabStyles() { return <style>{labCss}</style>; }
export function CodePane({ lines, active = [], title = '教学程序', revealed = lines.length, lineNumbers, highlightOperators=false }: { lines: string[]; active?: number[]; title?: string; revealed?: number; lineNumbers?:number[]; highlightOperators?:boolean }) {
 const category=title.includes('教学实验')?'教学实验':title.includes('教学坐标')||title.includes('接口用途')?'教学示意':'等价简化';
 return <div className="lab-code"><div className="lab-code-title"><span className="source-tag" data-source={category}>{category}</span>{title}</div><pre>{lines.slice(0,revealed).map((text,i)=><span key={i} className={`lab-line ${active.includes(i)?'is-active':''}`} data-active={active.includes(i)}><span className="lab-line-no" aria-hidden="true">{lineNumbers?.[i]??i+1}</span><code>{highlightOperators?text.split(/([<>])/).map((part,k)=>part==='<'||part==='>'?<mark key={k} className="condition-symbol">{part}</mark>:part):text}</code></span>)}</pre></div>;
}
export function Stepper({labels,step,onChange,compact=false}: {labels:string[];step:number;onChange:(step:number)=>void; compact?:boolean}) {
 return <>{compact?<ol className="lab-step-status" aria-label="推理进度">{labels.map((text,i)=><li key={text} aria-current={step===i?"step":undefined} data-complete={i<step}>{text}</li>)}</ol>:<div className="lab-stage" role="group" aria-label="选择推理步骤">{labels.map((text,i)=><button type="button" key={text} aria-current={step===i?'step':undefined} onClick={()=>onChange(i)}>{i+1}. {text}</button>)}</div>}<div className="ctrl"><button type="button" className="tiny" disabled={step===0} onClick={()=>onChange(step-1)}>上一步</button><button type="button" className="tiny" disabled={step===labels.length-1} onClick={()=>onChange(step+1)}>下一步</button><button type="button" className="tiny" onClick={()=>onChange(0)}>重置</button><span style={{fontSize:18,color:C.muted}}>步骤 {step+1} / {labels.length}</span></div></>;
}
export function usePaperImage(name: string) {
 const [image,setImage]=useState<HTMLImageElement|null>(null);
 useEffect(()=>{let alive=true;setImage(null);const item=new Image();item.onload=()=>{if(alive)setImage(item);};item.src=`./images/${name}.png`;return()=>{alive=false;};},[name]);return image;
}
export function drawPhoto(ctx: CanvasRenderingContext2D, image: HTMLImageElement|null, x:number,y:number,w:number,h:number) {
 ctx.fillStyle='#ffffff';ctx.fillRect(x,y,w,h);if(!image)return;const scale=Math.min(w/image.naturalWidth,h/image.naturalHeight);const iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;ctx.drawImage(image,x+(w-iw)/2,y+(h-ih)/2,iw,ih);
}
export function PaperPhoto({name,alt,children}: {name:string;alt:string;children?:React.ReactNode}) {return <figure className="lab-photo"><img src={`./images/${name}.png`} alt={alt}/>{children}</figure>;}
