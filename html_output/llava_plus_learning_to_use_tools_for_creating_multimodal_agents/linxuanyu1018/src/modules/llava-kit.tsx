import {useEffect,useRef,type ReactNode,type PointerEvent as ReactPointerEvent} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';

export const C={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',brown:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',text:'#21324a',muted:'#68778f',border:'#d7deea'};
const styles=[
'.ll-scene{display:block;max-width:100%;height:auto;border:1px solid #d7deea;border-radius:14px;opacity:0;transition:opacity .18s}.ll-scene.is-ready{opacity:1}',
'.ll-controls{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin:16px 0}.ll-chip{border:1px solid #ccd6e1;border-radius:999px;background:white;color:#27446e;padding:10px 17px;font:inherit;font-size:17px;line-height:1.4;cursor:pointer}.ll-chip[aria-pressed=true]{background:#27446e;color:white;border-color:#27446e}.ll-chip:disabled{opacity:.42;cursor:not-allowed}.ll-chip:focus-visible,.ll-scene:focus-visible{outline:3px solid #f07e47;outline-offset:3px}.ll-step{font-size:17px;color:#68778f;margin-left:4px}',
'.ll-feedback{font-size:18px;line-height:1.65;padding:12px 16px;border-left:4px solid #27446e;background:#eef3f8;margin-top:14px;min-height:56px;color:#21324a;border-radius:0 7px 7px 0}',
'.ll-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin:16px 0;padding:14px 0;border-top:1px solid #e4e9ef;border-bottom:1px solid #e4e9ef}.ll-kv dt{font-size:16px;color:#68778f;margin-bottom:4px}.ll-kv dd{font-size:18px;font-weight:650;color:#21324a;margin:0;overflow-wrap:anywhere}',
'.ll-code{font:16px/1.7 Consolas,monospace;background:#f5f8fb;border:1px solid #d7deea;border-radius:10px;padding:16px;white-space:pre-wrap;overflow-wrap:anywhere;margin:16px 0;color:#21324a}',
'.ll-table-wrap{max-width:100%;overflow:auto;margin-top:16px}.ll-table{border-collapse:collapse;width:100%;font-size:16px;line-height:1.5}.ll-table th,.ll-table td{text-align:left;padding:10px 12px;border-bottom:1px solid #e1e6ed;white-space:nowrap}.ll-table th{background:#f2f5f8;color:#27446e}.ll-table tr[data-paper=true]{background:#edf7f0}.ll-source{margin:18px 0 0;color:#27446e}.ll-source summary{cursor:pointer;font-weight:650;padding:8px 0}.ll-source img{display:block;max-width:100%;height:auto;margin:12px auto;border:1px solid #e1e6ed}.ll-source p{font-size:16px;line-height:1.6;color:#68778f}',
'@media(prefers-reduced-motion:reduce){.ll-scene{transition:none}}'].join('');

export function round(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill:string,stroke?:string,radius=12){
  ctx.beginPath();ctx.roundRect(x,y,w,h,radius);ctx.fillStyle=fill;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
export function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,size=20,color:string=C.text,align:CanvasTextAlign='left'){
  ctx.fillStyle=color;ctx.font='600 '+size+'px "Microsoft YaHei",sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(text,x,y);
}
export function arrow(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string=C.blue,width=3){
  const angle=Math.atan2(y2-y1,x2-x1);
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-11*Math.cos(angle-.45),y2-11*Math.sin(angle-.45));ctx.lineTo(x2-11*Math.cos(angle+.45),y2-11*Math.sin(angle+.45));ctx.closePath();ctx.fill();ctx.restore();
}
export function clearScene(ctx:CanvasRenderingContext2D,w:number,h:number){
  ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#e8eddf';ctx.fillRect(0,h-25,w,25);ctx.strokeStyle='#cbd6bf';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,h-25);ctx.lineTo(w,h-25);ctx.stroke();
}
export function drawHand(ctx:CanvasRenderingContext2D,x:number,y:number,angle=0,color:string=C.blue){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  ctx.fillStyle='#d9b18a';ctx.strokeStyle='#a47a57';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-19,51);ctx.lineTo(-20,25);ctx.quadraticCurveTo(-33,9,-27,4);ctx.quadraticCurveTo(-22,-1,-13,13);
  ctx.lineTo(-9,17);ctx.lineTo(-7,-24);ctx.quadraticCurveTo(-7,-32,0,-32);ctx.quadraticCurveTo(7,-31,7,-24);ctx.lineTo(7,-1);
  ctx.quadraticCurveTo(13,-9,18,-2);ctx.lineTo(18,5);ctx.quadraticCurveTo(26,0,30,8);ctx.lineTo(31,26);ctx.quadraticCurveTo(29,42,16,51);ctx.closePath();ctx.fill();ctx.stroke();
  round(ctx,-24,46,47,17,color,undefined,4);ctx.restore();
}
export function drawTool(ctx:CanvasRenderingContext2D,kind:string,x:number,y:number,scale=1,selected=false){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  if(selected)round(ctx,-35,-36,70,72,'#e5f1e8',C.green,12);
  ctx.strokeStyle=C.blue;ctx.fillStyle=C.blue;ctx.lineWidth=5;ctx.lineCap='round';
  if(kind==='lens'){
    ctx.beginPath();ctx.arc(-5,-7,18,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#dce8e2';ctx.globalAlpha=.65;ctx.fill();ctx.globalAlpha=1;
    ctx.strokeStyle=C.brown;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(9,7);ctx.lineTo(26,25);ctx.stroke();
  }else if(kind==='scissors'){
    ctx.beginPath();ctx.arc(-12,17,8,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(12,17,8,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=C.muted;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,10);ctx.lineTo(15,-24);ctx.moveTo(8,10);ctx.lineTo(-15,-24);ctx.stroke();
  }else if(kind==='card'){
    round(ctx,-24,-28,48,58,'white',C.brown,4);ctx.strokeStyle=C.blue;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-13,-12);ctx.lineTo(12,-12);ctx.moveTo(-13,0);ctx.lineTo(9,0);ctx.moveTo(-13,12);ctx.lineTo(14,12);ctx.stroke();
  }else{
    ctx.rotate(.45);round(ctx,-6,-27,12,45,C.brown,undefined,3);ctx.fillStyle=kind==='brush'?C.green:C.blue;ctx.beginPath();ctx.moveTo(-7,15);ctx.lineTo(7,15);ctx.lineTo(0,34);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
const images=new Map<string,HTMLImageElement>();
export function drawPhoto(ctx:CanvasRenderingContext2D,key:string,x:number,y:number,w:number,h:number,alpha=1){
  let img=images.get(key);
  if(!img){
    img=new Image();img.onload=()=>window.dispatchEvent(new Event('llava-photo-ready'));
    img.src='./images/'+key+'.png';images.set(key,img);
  }
  ctx.save();ctx.globalAlpha=alpha;round(ctx,x,y,w,h,'#e7ecdf',C.border,8);
  if(img.complete&&img.naturalWidth){
    const ratio=Math.min((w-8)/img.naturalWidth,(h-8)/img.naturalHeight);
    const dw=img.naturalWidth*ratio,dh=img.naturalHeight*ratio;
    ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  }else{
    ctx.strokeStyle=C.light;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+10,y+h-12);ctx.lineTo(x+w*.4,y+h*.4);ctx.lineTo(x+w*.65,y+h*.7);ctx.lineTo(x+w-10,y+h*.2);ctx.stroke();
  }
  ctx.restore();
}

type SceneProps={draw:(ctx:CanvasRenderingContext2D,w:number,h:number,time:number)=>void;label:string;width?:number;height?:number;onPoint?:(x:number,y:number)=>void;drag?:boolean};
export function Scene({draw,label:description,width=1080,height=300,onPoint,drag=false}:SceneProps){
  const ref=useRef<HTMLCanvasElement>(null),paint=useRef(draw),refresh=useRef<()=>void>(()=>{});paint.current=draw;
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    refresh.current=()=>{paint.current(ctx,width,height,reduced?1.5:performance.now()/1000);canvas.classList.add('is-ready');};
    let frame=0,visible=false;
    const tick=()=>{paint.current(ctx,width,height,reduced?1.5:performance.now()/1000);canvas.classList.add('is-ready');if(visible&&!reduced)frame=requestAnimationFrame(tick);};
    const start=()=>{visible=true;cancelAnimationFrame(frame);tick();};
    const stop=()=>{visible=false;cancelAnimationFrame(frame);};
    const disconnect=observeCanvas(canvas,start,stop);
    const onImage=()=>{if(reduced||!visible){paint.current(ctx,width,height,1.5);canvas.classList.add('is-ready');}};
    window.addEventListener('llava-photo-ready',onImage);tick();
    return()=>{stop();disconnect();window.removeEventListener('llava-photo-ready',onImage);};
  },[width,height]);
  useEffect(()=>{refresh.current();},[draw]);
  const point=(e:ReactPointerEvent<HTMLCanvasElement>)=>{
    if(!onPoint)return;const box=e.currentTarget.getBoundingClientRect();
    onPoint(Math.max(0,Math.min(width,(e.clientX-box.left)/box.width*width)),Math.max(0,Math.min(height,(e.clientY-box.top)/box.height*height)));
  };
  return <><style>{styles}</style><canvas ref={ref} width={width} height={height} role="img" aria-label={description} className="ll-scene"
    style={{width:'100%',height:'auto',touchAction:drag?'none':'auto',cursor:onPoint?(drag?'grab':'pointer'):'default'}}
    onPointerDown={e=>{if(onPoint){e.currentTarget.setPointerCapture(e.pointerId);point(e);}}}
    onPointerMove={e=>{if(drag&&e.buttons>0)point(e);}}/></>;
}
export function Choices({items,value,onChange,label:description,disabled=[]}:{items:string[];value:number;onChange:(n:number)=>void;label:string;disabled?:number[]}){
  return <div className="ll-controls" role="group" aria-label={description}>{items.map((item,i)=><button className="ll-chip" type="button" key={item} aria-pressed={value===i} disabled={disabled.includes(i)} onClick={()=>onChange(i)}>{item}</button>)}</div>;
}
export function Steps({value,max,onChange,label:description='步骤'}:{value:number;max:number;onChange:(n:number)=>void;label?:string}){
  return <div className="ll-controls" role="group" aria-label={description}><button className="ll-chip" type="button" disabled={value===0} onClick={()=>onChange(value-1)}>上一步</button><button className="ll-chip" type="button" disabled={value===max} onClick={()=>onChange(value+1)}>下一步</button><button className="ll-chip" type="button" onClick={()=>onChange(0)}>重置</button><span className="ll-step">{value+1} / {max+1}</span></div>;
}
export function Feedback({children,tone='blue'}:{children:ReactNode;tone?:'blue'|'green'|'red'|'orange'}){
  const backgrounds={blue:'#eef3f8',green:'#edf6ef',red:'#fcf0f1',orange:'#fff5eb'};
  return <div className="ll-feedback" role="status" aria-live="polite" style={{borderLeftColor:C[tone],background:backgrounds[tone]}}>{children}</div>;
}
export function KV({items}:{items:{label:string;value:ReactNode}[]}){
  return <dl className="ll-kv">{items.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>;
}
export function SourceFigure({name,caption}:{name:string;caption:string}){
  return <details className="ll-source"><summary>查看论文原图</summary><img src={'./images/'+name+'.png'} alt={caption}/><p>{caption}</p></details>;
}

export function Analogy({index}:{index:number}){
  return <Scene width={560} height={140} label={'照片修整台：'+['按下工具','框住照片','挑选工具','填写操作卡','描出轮廓','揭开结果','临摹示范','放回工具','核对细节','并排比较'][index-1]} draw={(ctx,w,h,t)=>{
    clearScene(ctx,w,h);const u=(Math.sin(t*Math.PI*2/3)+1)/2;
    round(ctx,180,19,185,96,'white',C.border,7);
    drawPhoto(ctx,index===6?'girl-output':'girl-input',190,26,125,81);
    let x=350,y=48,a=-.2;
    if(index===1){drawTool(ctx,'pen',390,68,.65,true);x=392;y=46+u*12;}
    if(index===2){ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.strokeRect(213,40,45+u*35,48);x=258+u*35;y=57;}
    if(index===3){round(ctx,370,30,145,75,'#e4eadb',C.light,9);drawTool(ctx,'lens',400,67,.55);drawTool(ctx,'brush',460,67,.55);x=398+u*62;y=36;}
    if(index===4){round(ctx,329,27,135,70,'white',C.border,5);ctx.strokeStyle=C.green;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(340,53);ctx.lineTo(340+u*101,53);ctx.stroke();x=340+u*101;y=38;drawTool(ctx,'pen',x,y+20,.45);}
    if(index===5){ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(220,50);ctx.lineTo(220+u*62,50);ctx.stroke();x=220+u*62;y=30;}
    if(index===6){round(ctx,190+u*120,26,125*(1-u),81,'#e2e7dd',undefined,3);x=285+u*110;y=29-u*7;}
    if(index===7){round(ctx,334,25,115,78,'white',C.border,5);ctx.strokeStyle=C.border;ctx.setLineDash([5,4]);ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(350,43);ctx.lineTo(350,82);ctx.lineTo(428,82);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=C.green;ctx.beginPath();ctx.moveTo(350,43);ctx.lineTo(350,43+u*39);ctx.stroke();x=350;y=24+u*39;drawTool(ctx,'pen',x+4,y+22,.4);}
    if(index===8){round(ctx,380,65,112,44,'#e4eadb',C.light,9);x=423;y=5+u*35;drawTool(ctx,'brush',x,y+35,.5);}
    if(index===9){x=220+u*70;y=33;drawTool(ctx,'lens',x+3,y+30,.55);a=-.05;}
    if(index===10){drawPhoto(ctx,'girl-output',365-u*30,27,106,80);x=433-u*30;y=39;}
    drawHand(ctx,x,y,a,C.blue);
  }}/>;
}
export function HeroScene({improved}:{improved:boolean}){
  return <Scene width={560} height={220} label={improved?'修图工具提供可交付的视觉结果，概念示意':'只用文字描述的能力边界，概念示意'} draw={(ctx,w,h,t)=>{
    clearScene(ctx,w,h);drawPhoto(ctx,'girl-input',35,35,185,140);
    round(ctx,305,37,210,140,'white',improved?C.green:C.red,10);
    if(improved){drawPhoto(ctx,'girl-output',327,47,164,119);drawTool(ctx,'brush',260,95,.7,true);}
    else{ctx.strokeStyle=C.muted;ctx.lineWidth=5;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(329,68+i*23);ctx.lineTo(471-(i%2)*27,68+i*23);ctx.stroke();}drawTool(ctx,'card',260,95,.7);}
    drawHand(ctx,267+(Math.sin(t*2)+1)*11,128,-.2,improved?C.green:C.red);
  }}/>;
}
