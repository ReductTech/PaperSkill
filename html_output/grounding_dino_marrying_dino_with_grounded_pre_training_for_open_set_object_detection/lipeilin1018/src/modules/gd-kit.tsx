import React, {useEffect,useRef} from 'react';
import {setupCanvas,observeCanvas} from '../lib/canvasKit';
export const C={bg:'#f5f8f0',light:'#b8c9a7',dark:'#76906a',support:'#92400e',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',text:'#21324a',muted:'#68778f',border:'#d7deea'};
type Context=CanvasRenderingContext2D;
type SceneProps={draw:(ctx:Context,time:number)=>void;width?:number;height?:number;animate?:boolean;label:string;onPoint?:(x:number,y:number)=>void;onDrag?:(x:number,y:number)=>void};
export function Scene({draw,width=1080,height=280,animate=false,label,onPoint,onDrag}:SceneProps){
 const ref=useRef<HTMLCanvasElement>(null),drawRef=useRef(draw),paintRef=useRef<()=>void>(()=>{}),dragging=useRef(false);
 drawRef.current=draw;
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const ctx=setupCanvas(canvas,width,height);canvas.style.width='100%';canvas.style.height='auto';
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let raf=0,visible=false,disposed=false,time=0,previous=0;
  const paint=()=>{ctx.save();ctx.clearRect(0,0,width,height);ctx.fillStyle=C.bg;ctx.fillRect(0,0,width,height);drawRef.current(ctx,reduced.matches?1.5:time);ctx.restore();canvas.classList.add('is-ready');};
  // Use elapsed time so a throttled preview still completes a cycle on schedule.
  const tick=(now:number)=>{if(disposed||!visible||!animate||reduced.matches)return;time+=previous?Math.max(0,(now-previous)/1000):0;previous=now;paint();raf=requestAnimationFrame(tick);};
  const stop=()=>{cancelAnimationFrame(raf);raf=0;previous=0;};
  const start=()=>{visible=true;paint();if(animate&&!reduced.matches&&!raf)raf=requestAnimationFrame(tick);};
  const off=observeCanvas(canvas,start,()=>{visible=false;stop();});
  const preference=()=>{stop();if(visible)start();else paint();};
  reduced.addEventListener('change',preference);paintRef.current=paint;paint();
  return()=>{disposed=true;stop();off();reduced.removeEventListener('change',preference);paintRef.current=()=>{};};
 },[width,height,animate]);
 useEffect(()=>{paintRef.current();},[draw]);
 const point=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return [Math.max(0,Math.min(width,(e.clientX-r.left)*width/r.width)),Math.max(0,Math.min(height,(e.clientY-r.top)*height/r.height))] as const;};
 return <canvas ref={ref} role="img" aria-label={label} style={{width:'100%',height:'auto',touchAction:onDrag?'none':'auto',cursor:onDrag?'grab':onPoint?'pointer':'default'}}
 onPointerDown={e=>{const [x,y]=point(e);onPoint?.(x,y);if(onDrag){dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);onDrag(x,y);}}}
 onPointerMove={e=>{if(dragging.current&&onDrag){const [x,y]=point(e);onDrag(x,y);}}}
 onPointerUp={e=>{dragging.current=false;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}
 onPointerCancel={()=>{dragging.current=false;}}/>;
}
export function line(ctx:Context,x1:number,y1:number,x2:number,y2:number,color:string,width=2){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();}
export function number(ctx:Context,text:string|number,x:number,y:number,color:string=C.text){ctx.save();ctx.fillStyle=color;ctx.font='600 18px system-ui, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(text),x,y);ctx.restore();}
export function frame(ctx:Context,x:number,y:number,w:number,h:number,color:string,dashed=false){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.lineJoin='round';if(dashed)ctx.setLineDash([8,6]);ctx.strokeRect(x,y,w,h);ctx.setLineDash([]);if(!dashed){const s=Math.min(13,w/5,h/5);ctx.lineWidth=5;[[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(([a,b,dx,dy])=>{ctx.beginPath();ctx.moveTo(a,b+dy*s);ctx.lineTo(a,b);ctx.lineTo(a+dx*s,b);ctx.stroke();});}ctx.restore();}
// The illustration palette is independent of the instructional state colors in C.
export const ART={sky:'#eef1e6',hill:'#dce5d2',near:'#cedbc4',leaf:'#8fa88a',leafLight:'#a9bd98',leafDark:'#6e8b75',bark:'#947455',barkLight:'#b89971',ink:'#344d58',metal:'#b6c5be',cream:'#eee6d6',gold:'#c9a169'};
function shape(ctx:Context,color:string,draw:()=>void){ctx.beginPath();draw();ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function oval(ctx:Context,x:number,y:number,rx:number,ry:number,color:string,rotation=0){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.fill();}
/** Perched bird. The shared silhouette stays within the tutorial's detection boxes. */
export function bird(ctx:Context,x:number,y:number,s:number,color:string){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 // Two tapered tail feathers sit behind the rounded body.
 shape(ctx,color,()=>{ctx.moveTo(-.74,-.15);ctx.quadraticCurveTo(-1.22,-.25,-1.76,-.48);ctx.quadraticCurveTo(-1.66,.10,-1.09,.45);ctx.lineTo(-.67,.30);});
 shape(ctx,'rgba(35,45,57,.23)',()=>{ctx.moveTo(-.88,.04);ctx.lineTo(-1.71,-.27);ctx.quadraticCurveTo(-1.52,.25,-1.12,.38);});
 line(ctx,-.12,.57,-.22,1.01,ART.bark,.065);line(ctx,.39,.55,.36,1.01,ART.bark,.065);
 line(ctx,-.30,1.02,-.01,1.02,ART.bark,.06);line(ctx,.28,1.02,.56,1.02,ART.bark,.06);
 // Neck, head, breast and back form one continuous contour.
 shape(ctx,color,()=>{ctx.moveTo(-1.11,-.08);ctx.bezierCurveTo(-.91,-.55,-.26,-.64,.30,-.55);ctx.bezierCurveTo(.39,-1.08,1.03,-1.13,1.29,-.77);ctx.bezierCurveTo(1.51,-.42,1.16,-.22,1.10,.09);ctx.bezierCurveTo(.93,.63,.38,.83,-.18,.68);ctx.bezierCurveTo(-.70,.58,-.90,.28,-1.11,-.08);});
 shape(ctx,'rgba(247,230,201,.47)',()=>{ctx.moveTo(1.18,-.39);ctx.bezierCurveTo(.96,-.29,.81,-.35,.69,-.19);ctx.bezierCurveTo(.61,.10,.54,.47,.15,.65);ctx.bezierCurveTo(.68,.78,1.02,.37,1.10,.09);ctx.quadraticCurveTo(1.10,-.17,1.18,-.39);});
 // Broad folded wing, with just two feather accents legible in small crops.
 shape(ctx,'rgba(32,44,59,.23)',()=>{ctx.moveTo(.43,-.32);ctx.bezierCurveTo(-.05,-.66,-.76,-.41,-.86,-.02);ctx.quadraticCurveTo(-.51,.46,.09,.38);ctx.quadraticCurveTo(.51,.23,.43,-.32);});
 ctx.strokeStyle='rgba(248,236,215,.53)';ctx.lineWidth=.055;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-.64,-.13);ctx.quadraticCurveTo(-.27,.10,.21,-.12);ctx.stroke();
 ctx.strokeStyle='rgba(248,236,215,.30)';ctx.beginPath();ctx.moveTo(-.57,.05);ctx.quadraticCurveTo(-.29,.24,.06,.12);ctx.stroke();
 shape(ctx,ART.gold,()=>{ctx.moveTo(1.27,-.65);ctx.quadraticCurveTo(1.53,-.64,1.74,-.48);ctx.quadraticCurveTo(1.52,-.39,1.26,-.42);});
 line(ctx,1.30,-.49,1.64,-.49,'#96734d',.035);
 oval(ctx,1.02,-.72,.105,.115,ART.cream);oval(ctx,1.04,-.72,.061,.071,'#283943');oval(ctx,1.059,-.745,.017,.020,'#fffaf0');
 ctx.restore();
}
/** A tapered branch, shared by full scenes and enlarged bird studies. */
export function branch(ctx:Context,x1:number,y1:number,x2:number,y2:number,thickness=6){
 const dx=x2-x1,dy=y2-y1;
 ctx.save();
 shape(ctx,ART.bark,()=>{ctx.moveTo(x1,y1-thickness*.45);ctx.bezierCurveTo(x1+dx*.34,y1+dy*.74-thickness*.3,x1+dx*.72,y2-thickness*.15,x2,y2);ctx.bezierCurveTo(x1+dx*.72,y2+thickness*.35,x1+dx*.34,y1+dy*.74+thickness*.48,x1,y1+thickness*.65);});
 ctx.strokeStyle=ART.barkLight;ctx.lineWidth=thickness*.20;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1-thickness*.15);ctx.bezierCurveTo(x1+dx*.33,y1+dy*.74,x1+dx*.60,y2+thickness*.08,x1+dx*.86,y2);ctx.stroke();
 ctx.restore();
}
/** Tree anchor is the center of its roots. Height/width include the crown. */
export function tree(ctx:Context,x:number,y:number,height:number,width=height*.78){
 ctx.save();ctx.translate(x,y);ctx.scale(width/100,height/100);
 oval(ctx,0,-1,24,3,'rgba(67,89,66,.11)');
 shape(ctx,ART.leafDark,()=>{ctx.moveTo(-42,-43);ctx.bezierCurveTo(-60,-54,-46,-74,-33,-76);ctx.bezierCurveTo(-34,-94,-9,-106,5,-97);ctx.bezierCurveTo(23,-105,42,-88,39,-77);ctx.bezierCurveTo(58,-71,52,-50,39,-44);ctx.bezierCurveTo(19,-34,-19,-34,-42,-43);});
 shape(ctx,ART.bark,()=>{ctx.moveTo(-11,0);ctx.quadraticCurveTo(-4,-21,-5,-48);ctx.lineTo(-18,-64);ctx.lineTo(-15,-67);ctx.lineTo(-3,-56);ctx.lineTo(0,-76);ctx.lineTo(4,-76);ctx.lineTo(5,-48);ctx.lineTo(21,-63);ctx.lineTo(24,-59);ctx.lineTo(6,-37);ctx.quadraticCurveTo(5,-16,12,0);ctx.lineTo(3,-2);ctx.lineTo(-2,0);});
 shape(ctx,ART.barkLight,()=>{ctx.moveTo(-3,-48);ctx.lineTo(0,-49);ctx.quadraticCurveTo(-1,-23,3,-4);ctx.lineTo(-2,-3);ctx.quadraticCurveTo(-5,-25,-3,-48);});
 shape(ctx,ART.leaf,()=>{ctx.moveTo(-43,-51);ctx.bezierCurveTo(-59,-64,-39,-83,-28,-78);ctx.bezierCurveTo(-31,-95,-7,-101,3,-91);ctx.bezierCurveTo(16,-101,40,-87,36,-74);ctx.bezierCurveTo(53,-69,47,-50,34,-50);ctx.quadraticCurveTo(15,-40,5,-50);ctx.quadraticCurveTo(-18,-38,-28,-50);ctx.quadraticCurveTo(-38,-44,-43,-51);});
 shape(ctx,ART.leafLight,()=>{ctx.moveTo(-38,-65);ctx.bezierCurveTo(-43,-79,-25,-87,-16,-82);ctx.bezierCurveTo(-11,-96,10,-96,18,-84);ctx.bezierCurveTo(30,-84,34,-72,26,-67);ctx.quadraticCurveTo(12,-59,1,-66);ctx.quadraticCurveTo(-9,-53,-23,-62);ctx.quadraticCurveTo(-31,-57,-38,-65);});
 // Small paired leaves, without a noisy all-over texture.
 [[-29,-73],[-9,-83],[18,-75],[31,-58],[-17,-52]].forEach(([lx,ly])=>{oval(ctx,lx,ly,3.6,1.7,'rgba(240,241,216,.48)',-.5);oval(ctx,lx+4,ly+2,3.1,1.5,'rgba(65,103,77,.18)',.5);});
 line(ctx,6,-18,8,-8,'#796248',1);ctx.restore();
}
export function parkBackdrop(ctx:Context,x:number,y:number,w:number,h:number){
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle=ART.sky;ctx.fillRect(x,y,w,h);
 shape(ctx,ART.hill,()=>{ctx.moveTo(x,y+h*.83);ctx.bezierCurveTo(x+w*.23,y+h*.52,x+w*.59,y+h*.74,x+w,y+h*.57);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);});
 shape(ctx,ART.near,()=>{ctx.moveTo(x,y+h*.93);ctx.bezierCurveTo(x+w*.39,y+h*.71,x+w*.73,y+h*.90,x+w,y+h*.79);ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);});
 ctx.strokeStyle='rgba(110,139,117,.23)';ctx.lineWidth=Math.max(.8,h*.005);ctx.lineCap='round';
 [[.29,.89],[.56,.84],[.94,.94]].forEach(([gx,gy])=>{const a=x+w*gx,b=y+h*gy;ctx.beginPath();ctx.moveTo(a-h*.015,b);ctx.lineTo(a-h*.025,b-h*.017);ctx.moveTo(a,b);ctx.lineTo(a+h*.008,b-h*.027);ctx.stroke();});
 ctx.restore();
}
/** Shared park visitor. x is the body center; y is the hairline; height includes shoes. */
export function person(ctx:Context,x:number,y:number,height:number){
 ctx.save();ctx.translate(x,y);ctx.scale(height/100,height/100);
 const fill=(color:string,draw:()=>void)=>{ctx.beginPath();draw();ctx.closePath();ctx.fillStyle=color;ctx.fill();};
 // Ground contact and a small daypack keep the figure grounded in the park.
 ctx.fillStyle='rgba(49,70,60,.13)';ctx.beginPath();ctx.ellipse(2,100,23,3.3,0,0,Math.PI*2);ctx.fill();
 fill('#5d756a',()=>{ctx.moveTo(9,27);ctx.bezierCurveTo(16,23,21,28,20,36);ctx.lineTo(19,54);ctx.quadraticCurveTo(13,58,9,53);});
 fill('#84978a',()=>{ctx.moveTo(15,30);ctx.quadraticCurveTo(19,29,18,37);ctx.lineTo(17,50);ctx.lineTo(14,51);});
 // Trouser legs have filled silhouettes, distinct knees and a relaxed stance.
 fill('#2e4658',()=>{ctx.moveTo(-11,55);ctx.lineTo(3,56);ctx.lineTo(1,72);ctx.lineTo(-5,96);ctx.lineTo(-16,95);ctx.lineTo(-12,73);});
 fill('#3e5b6c',()=>{ctx.moveTo(-1,56);ctx.lineTo(12,55);ctx.lineTo(12,74);ctx.lineTo(16,95);ctx.lineTo(5,96);ctx.lineTo(0,76);ctx.lineTo(-4,65);});
 fill('#526f7b',()=>{ctx.moveTo(6,61);ctx.lineTo(9,61);ctx.lineTo(9,74);ctx.lineTo(13,91);ctx.lineTo(10,91);ctx.lineTo(6,75);});
 // Cream sneakers with darker uppers and soles remain legible at small sizes.
 fill('#f7f1e6',()=>{ctx.moveTo(-16,93);ctx.lineTo(-5,94);ctx.lineTo(-3,98);ctx.quadraticCurveTo(-4,101,-9,100);ctx.lineTo(-22,100);ctx.quadraticCurveTo(-24,96,-16,95);});
 fill('#f7f1e6',()=>{ctx.moveTo(5,94);ctx.lineTo(16,93);ctx.lineTo(18,96);ctx.quadraticCurveTo(26,97,24,100);ctx.lineTo(6,100);});
 line(ctx,-21,100,-4,100,'#334b58',1.5);line(ctx,6,100,23,100,'#334b58',1.5);
 line(ctx,-15,96,-9,96,'#8b999b',1);line(ctx,10,96,16,96,'#8b999b',1);
 // Neck and shirt sit behind the open, softly structured jacket.
 fill('#d5a17b',()=>{ctx.moveTo(-4,16);ctx.lineTo(5,16);ctx.lineTo(5,27);ctx.lineTo(-4,27);});
 fill('#f4e9d6',()=>{ctx.moveTo(-7,24);ctx.quadraticCurveTo(0,29,7,24);ctx.lineTo(10,57);ctx.lineTo(-10,57);});
 fill('#d3a064',()=>{ctx.moveTo(-6,23);ctx.lineTo(-13,26);ctx.quadraticCurveTo(-17,29,-16,37);ctx.lineTo(-12,58);ctx.quadraticCurveTo(-6,61,0,59);ctx.lineTo(-1,31);});
 fill('#ddb077',()=>{ctx.moveTo(5,23);ctx.lineTo(13,26);ctx.quadraticCurveTo(16,29,15,37);ctx.lineTo(13,59);ctx.quadraticCurveTo(8,61,3,59);ctx.lineTo(2,31);});
 fill('#b9804c',()=>{ctx.moveTo(-6,23);ctx.lineTo(-1,31);ctx.lineTo(-5,36);ctx.lineTo(-10,27);});
 fill('#be8955',()=>{ctx.moveTo(5,23);ctx.lineTo(10,27);ctx.lineTo(5,35);ctx.lineTo(2,31);});
 // Far arm hangs naturally; the near arm bends toward the camera.
 fill('#bd8956',()=>{ctx.moveTo(-13,27);ctx.quadraticCurveTo(-19,28,-19,36);ctx.lineTo(-20,49);ctx.lineTo(-16,55);ctx.lineTo(-11,52);ctx.lineTo(-13,46);ctx.lineTo(-11,34);});
 ctx.fillStyle='#e3b28b';ctx.beginPath();ctx.ellipse(-15.6,55,3.3,4.7,-.35,0,Math.PI*2);ctx.fill();
 fill('#dbab70',()=>{ctx.moveTo(12,27);ctx.quadraticCurveTo(17,28,18,35);ctx.lineTo(21,44);ctx.quadraticCurveTo(22,48,17,50);ctx.lineTo(6,54);ctx.lineTo(3,48);ctx.lineTo(13,43);ctx.lineTo(9,34);});
 line(ctx,14,42,17,44,'#c18b54',1.1);
 // A slender strap and simple lens establish the photography theme.
 line(ctx,-7,28,-3,46,'#665448',1.8);line(ctx,8,29,6,46,'#665448',1.8);
 camera(ctx,1,49.5,6.4);
 ctx.fillStyle='#e7b78e';ctx.beginPath();ctx.ellipse(7,51,3.7,2.5,-.4,0,Math.PI*2);ctx.fill();
 // Slightly turned face, swept hair and one eye; no oversized cartoon features.
 ctx.fillStyle='#e8ba94';ctx.beginPath();ctx.ellipse(0,11,7.5,9.7,-.1,0,Math.PI*2);ctx.fill();
 fill('#e8ba94',()=>{ctx.moveTo(-6,10);ctx.lineTo(-9,13);ctx.quadraticCurveTo(-9,14,-6,14);});
 ctx.fillStyle='#d49c76';ctx.beginPath();ctx.ellipse(6.2,12,2.1,2.8,0,0,Math.PI*2);ctx.fill();
 fill('#3f3937',()=>{ctx.moveTo(-7.6,9);ctx.bezierCurveTo(-11,1,-3,-2,3,.1);ctx.bezierCurveTo(11,0,12,7,8,15);ctx.lineTo(5,15);ctx.lineTo(4,7);ctx.quadraticCurveTo(-1,10,-3,5);ctx.quadraticCurveTo(-5,9,-7.6,9);});
 line(ctx,-5,3,1,2,'#62524a',1.3);
 ctx.fillStyle='#403936';ctx.beginPath();ctx.arc(-3.8,11.4,.75,0,Math.PI*2);ctx.fill();
 line(ctx,-4.1,16,-1.4,16.3,'#b57e65',.8);
 ctx.restore();
}
export function photo(ctx:Context,x:number,y:number,w:number,h:number){
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();parkBackdrop(ctx,x,y,w,h);
 tree(ctx,x+w*.12,y+h*.89,h*.98,Math.min(w*.28,h*.94));
 branch(ctx,x+w*.115,y+h*.60,x+w*.73,y+h*.48,Math.max(4,w*.011));
 bird(ctx,x+w*.30,y+h*.42,Math.min(w*.042,h*.11),C.red);
 bird(ctx,x+w*.62,y+h*.38,Math.min(w*.04,h*.105),C.blue);
 person(ctx,x+w*.80,y+h*.44,h*.48);
 ctx.restore();ctx.save();ctx.strokeStyle=C.border;ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);ctx.restore();
}
/** Compact film camera, including the miniature carried by the park visitor. */
export function camera(ctx:Context,x:number,y:number,s:number,angle=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(s,s);
 const rect=(x:number,y:number,w:number,h:number,r:number,color:string)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
 // Metal housing, curved leather grip and a warm top plate.
 rect(-1.25,-.65,2.5,1.34,.20,ART.ink);rect(-1.18,-.70,2.36,.35,.13,ART.metal);
 rect(-.54,-.89,.87,.25,.08,ART.metal);rect(-.43,-.84,.34,.16,.035,'#60766f');
 rect(.73,-.80,.29,.10,.04,ART.gold);rect(.67,-.34,.47,.88,.12,'#48616a');
 line(ctx,-1.14,.51,.55,.51,'#59747b',.035);rect(-1.30,-.31,.12,.22,.04,ART.gold);rect(1.18,-.31,.12,.22,.04,ART.gold);
 rect(-.99,-.58,.36,.17,.035,ART.cream);rect(-.94,-.55,.19,.11,.02,'#6c817d');
 // Nested lens rings, a glass crescent and one small specular highlight.
 oval(ctx,0,.02,.64,.64,'rgba(19,38,45,.25)');oval(ctx,0,0,.59,.59,ART.metal);oval(ctx,0,0,.51,.51,'#536d71');oval(ctx,0,0,.42,.42,'#263f4d');oval(ctx,0,0,.31,.31,'#3f626d');oval(ctx,.035,.035,.21,.21,'#243b49');
 ctx.strokeStyle='#99b3ad';ctx.lineWidth=.06;ctx.beginPath();ctx.arc(0,0,.34,Math.PI*1.05,Math.PI*1.52);ctx.stroke();oval(ctx,-.12,-.14,.07,.055,'#d7e2d5',-.5);oval(ctx,.16,.17,.035,.035,'#72908d');
 if(s>=10){for(let i=0;i<20;i++){const a=i*Math.PI/10;line(ctx,Math.cos(a)*.535,Math.sin(a)*.535,Math.cos(a)*.57,Math.sin(a)*.57,'#7c9691',.018);}line(ctx,.80,-.17,.80,.35,'#6b8185',.025);oval(ctx,.58,-.47,.035,.035,ART.gold);}
 ctx.restore();
}
export function Chips({items,value,onChange,label}:{items:string[];value:number;onChange:(value:number)=>void;label:string}){return <div role="group" aria-label={label} style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:8,margin:'12px 0'}}><span style={{color:C.muted,fontSize:14,marginRight:4}}>{label}</span>{items.map((item,i)=><button key={item} type="button" aria-pressed={value===i} onClick={()=>onChange(i)} style={{border:`1px solid ${value===i?C.blue:C.border}`,borderRadius:9,padding:'7px 12px',color:value===i?'white':C.text,background:value===i?C.blue:'white',fontWeight:value===i?650:400}}>{item}</button>)}</div>;}
export function Feedback({tone='info',children}:{tone?:'info'|'good'|'bad';children:React.ReactNode}){const c=tone==='good'?C.green:tone==='bad'?C.red:C.blue;return <div role="status" aria-live="polite" style={{borderLeft:`3px solid ${c}`,background:`${c}09`,color:C.text,padding:'12px 15px',marginTop:14,borderRadius:'0 8px 8px 0',minHeight:60,lineHeight:1.7}}>{children}</div>;}
export function Button({children,onClick,disabled=false}:{children:React.ReactNode;onClick:()=>void;disabled?:boolean}){return <button type="button" onClick={onClick} disabled={disabled} style={{background:disabled?'#eef1f4':C.blue,color:disabled?C.muted:'white',border:'1px solid transparent',borderRadius:9,padding:'8px 15px',cursor:disabled?'not-allowed':'pointer',marginRight:8,marginTop:5}}>{children}</button>;}
export function GdKit(){return null;}
