import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = { bg: '#f5f8f0', ink: '#21324a', muted: '#68778f', line: '#d7deea', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706', purple: '#7c3aed', pale: '#e9eff0' };
const W = 1080, H = 280;
const font = '17px "Microsoft YaHei", sans-serif';
function round(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
  c.beginPath(); c.roundRect(x,y,w,h,r); c.fillStyle=fill; c.fill(); if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}
}
function txt(c: CanvasRenderingContext2D, s: string, x: number, y: number, color=C.ink, size=17, bold=false){c.fillStyle=color;c.font=`${bold?'700 ':''}${size}px "Microsoft YaHei", sans-serif`;c.fillText(s,x,y);}
function line(c: CanvasRenderingContext2D, x:number,y:number,x2:number,y2:number,color=C.line,width=3){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function base(c:CanvasRenderingContext2D,w=W,h=H){c.fillStyle=C.bg;c.fillRect(0,0,w,h);round(c,18,14,w-36,h-28,16,'#fff',C.line);}
function flashlight(c:CanvasRenderingContext2D,x:number,y:number,beam=1,length=620){
  c.save();c.translate(x,y);c.rotate(-.16);
  c.fillStyle='rgba(217,119,6,.13)';c.beginPath();c.moveTo(32,-14);c.lineTo(length,-75*beam);c.lineTo(length,75*beam);c.lineTo(32,14);c.fill();
  round(c,-52,-17,90,34,12,C.blue);round(c,26,-22,18,44,6,C.orange);c.restore();
}
function cat(c:CanvasRenderingContext2D,x:number,y:number,visible=1){
  c.save();c.globalAlpha=Math.max(.12,visible);c.fillStyle=C.ink;
  c.beginPath();c.ellipse(x,y,35,44,0,0,Math.PI*2);c.fill();
  c.beginPath();c.moveTo(x-28,y-25);c.lineTo(x-28,y-65);c.lineTo(x-5,y-43);c.lineTo(x+6,y-42);c.lineTo(x+30,y-65);c.lineTo(x+28,y-22);c.fill();
  c.strokeStyle=C.ink;c.lineWidth=11;c.beginPath();c.moveTo(x+30,y+28);c.bezierCurveTo(x+72,y+28,x+68,y-17,x+56,y-19);c.stroke();
  c.fillStyle='#f7d86a';c.beginPath();c.arc(x-13,y-10,4,0,7);c.arc(x+14,y-10,4,0,7);c.fill();c.restore();
}
function searchScene(c:CanvasRenderingContext2D,bright:number,success:boolean,w=W,h=H,shift=0){
  c.fillStyle=C.bg;c.fillRect(0,0,w,h);c.fillStyle='#dfe7da';c.fillRect(0,h*.72,w,h*.28);
  const x=w*.21+shift;flashlight(c,x,h*.53,.82,w*.58);cat(c,w*.75,h*.59,bright);
  c.strokeStyle=success?C.green:C.red;c.lineWidth=4;c.strokeRect(w*.7,h*.25,w*.12,h*.49);
}
function bar(c:CanvasRenderingContext2D,x:number,y:number,value:number,max:number,color:string,width=360){round(c,x,y,Math.max(4,width*value/max),22,11,color);}
function cardCanvas(c:CanvasRenderingContext2D,id:string,q:number,choice:number,step:number,played:boolean,progress:number){
  base(c);
  if(id==='1.1'||id==='1.2'){
    const good=id==='1.2'?choice===1:choice===1;
    searchScene(c,Math.max(.18,1-q/105)+(good?.32:0),good,W,H);
    return;
  }
  if(id==='2.1'){
    const cols=['#d47a70','#81a88a','#7290bd','#7ead85'];
    for(let i=0;i<4;i++){round(c,90+i*220,76,175,112,14,i===choice?cols[i]:'#eef2f1',i===choice?C.orange:C.line);txt(c,['R','Gᵣ','B','Gᵦ'][i],157+i*220,143,i===choice?'#fff':C.ink,30,true);}
    return;
  }
  if(id==='3.1'){
    const names=['W','B','C'];
    names.forEach((n,i)=>{round(c,95+i*315,77,220,100,16,i===step?'#e7f4ec':'#f0f3f2',i===step?C.green:C.line);txt(c,n,185+i*315,142,i===step?C.green:C.blue,38,true);if(i<2)line(c,320+i*315,129,402+i*315,129,i<step?C.green:C.line,5);});
    txt(c,['4 通道 → 增益校正','双绿平均 → 3 通道','RGB 颜色校正'][step],78,229,C.muted,18);
    return;
  }
  if(id==='4.1'){
    const names=['基础 P','局部 Pₗ','全局 Pᵍ'];
    names.forEach((n,i)=>{round(c,95+i*315,69,228,115,16,i===choice?'#e7f4ec':'#f0f3f2',i===choice?C.green:C.line);txt(c,n,142+i*315,136,i===choice?C.green:C.blue,25,true);});
    txt(c,'P′ = P + Pₗ + Pᵍ',365,231,C.ink,24,true);return;
  }
  if(id==='5.1'){
    line(c,115,218,885,218,C.line,3);line(c,115,218,115,42,C.line,3);
    c.beginPath();c.moveTo(115,218);for(let i=1;i<=100;i++){let x=i/100;let y=Math.pow(x,1-q/150);c.lineTo(115+770*x,218-175*y);}c.strokeStyle=C.green;c.lineWidth=5;c.stroke();
    line(c,115,218,885,43,C.line,2);txt(c,'暗部',114,252,C.muted);txt(c,'亮部',825,252,C.muted);txt(c,`示意曲率 ${q.toFixed(0)}`,676,76,C.orange,19,true);return;
  }
  if(id==='6.1'){
    const a=q*Math.PI/180;line(c,230,206,660,206,C.blue,6);line(c,230,206,230+420*Math.cos(a),206-145*Math.sin(a),choice===1?C.green:C.orange,7);
    c.beginPath();c.arc(230,206,70,0,-a,true);c.strokeStyle=C.purple;c.lineWidth=3;c.stroke();
    txt(c,`${q.toFixed(0)}°`,635,82,C.orange,33,true);txt(c,'目标方向',640,211,C.blue,18);return;
  }
  if(id==='7.1'){
    const s=['检测损失','预热期','Self-Boost'];s.forEach((name,i)=>{round(c,70+i*325,75,255,115,16,i===step?'#e7f4ec':'#f1f4f3',i===step?C.green:C.line);txt(c,name,104+i*325,137,i===step?C.green:C.blue,23,true);});
    txt(c,step===2?'L = Ldet + 0.01 Lsb':'训练 15 epoch · RetinaNet / ResNet',78,236,C.muted,20);return;
  }
  if(id==='8.1'){
    const s=['RAW','动态线性','多项式','检测器'];s.forEach((name,i)=>{const x=50+i*255;round(c,x,80,218,96,14,i===choice?'#e7f4ec':'#f1f4f3',i===choice?C.green:C.line);txt(c,name,x+24,138,i===choice?C.green:C.blue,22,true);if(i<3)line(c,x+221,129,x+251,129,i<choice?C.green:C.line,4);});
    round(c,55,206,970,39,10,choice===4?'#f0e9ff':'#f5f4f9',choice===4?C.purple:C.line);
    txt(c,'训练约束：Self-Boost → 动态线性',75,232,choice===4?C.purple:C.muted,19,choice===4);return;
  }
  if(id==='9.1'){
    const vals=[66.6,67.1,68.7,70.4], names=['仅线性','仅非线性','线性+非线性','再加 Self-Boost'];
    names.forEach((name,i)=>{txt(c,name,58,62+i*51,C.ink,18);round(c,286,42+i*51,610,24,12,'#eff3f2');bar(c,286,42+i*51,vals[i],75,i===choice?C.green:C.blue,590);txt(c,vals[i].toFixed(1),930,61+i*51,i===choice?C.green:C.ink,21,true);});return;
  }
  if(id==='10.1'){
    const datasets=[{a:[['默认 ISP',67.3],['FeatEnHancer',67],['Dark-ISP',70.4]],m:75},{a:[['FeatEnHancer',30.3],['RAW-Adapter',28.9],['Dark-ISP',31.5]],m:35},{a:[['FeatEnHancer',28.8],['RAW-Adapter',28.3],['Dark-ISP',29.9]],m:35},{a:[['FeatEnHancer',22.4],['RAW-Adapter',21.7],['Dark-ISP',23.1]],m:26}];
    const d=datasets[choice];d.a.forEach(([name,val],i)=>{txt(c,String(name),66,82+i*61,C.ink,18);round(c,280,63+i*61,630,27,12,'#eef2f1');bar(c,280,63+i*61,played?Number(val)*progress:0,d.m,i===2?C.green:C.blue,620);txt(c,Number(val).toFixed(1),933,84+i*61,i===2?C.green:C.ink,23,true);});return;
  }
  if(id==='10.2'){
    const icons=['RAW','跨相机','能耗','伪目标'];
    icons.forEach((name,i)=>{round(c,75+i*245,85,210,105,16,i===choice?'#fff2df':'#eff3f2',i===choice?C.orange:C.line);txt(c,name,108+i*245,146,i===choice?C.orange:C.blue,23,true);});return;
  }
}
function useDraw(draw:(c:CanvasRenderingContext2D)=>void,deps:unknown[],w=W,h=H){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{const el=ref.current;if(!el)return;const c=setupCanvas(el,w,h);draw(c);el.classList.add('is-ready');},deps);return ref;}
const canvasStyle:React.CSSProperties={display:'block',width:'100%',height:'auto',maxWidth:'100%'};
const controlStyle:React.CSSProperties={display:'flex',flexWrap:'wrap',gap:9,alignItems:'center',margin:'14px 0'};
const buttonStyle:React.CSSProperties={font:'inherit',padding:'8px 14px',border:'1px solid #cbd6df',borderRadius:10,cursor:'pointer',background:'#fff',color:C.ink};
function Chips({values,value,onChange}:{values:string[],value:number,onChange:(i:number)=>void}){return <div style={controlStyle}>{values.map((s,i)=><button type="button" key={s} aria-pressed={value===i} onClick={()=>onChange(i)} style={{...buttonStyle,background:i===value?C.blue:'#fff',color:i===value?'#fff':C.ink}}>{s}</button>)}</div>}
function Feedback({text,good}:{text:string,good?:boolean}){return <div className={`feedback ${good===true?'good':good===false?'bad':''}`} role="status">{text}</div>}

export const DarkWidget:React.FC<WidgetProps>=({chapterId,moduleId})=>{
  const [q,setQ]=useState(moduleId==='5.1'?55:moduleId==='6.1'?60:72);
  const [choice,setChoice]=useState(0),[step,setStep]=useState(0),[played,setPlayed]=useState(false),[progress,setProgress]=useState(0),[runKey,setRunKey]=useState(0);
  const analogy=moduleId==='ana', hero=chapterId==='hero';
  const n=Number(chapterId.replace('chap-',''))||1;
  const heroRef=useDraw(c=>searchScene(c,moduleId==='new'?.92:.25,moduleId==='new'),[moduleId],W,H);
  const autoRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{if(!analogy||!autoRef.current)return;const el=autoRef.current,c=setupCanvas(el,560,140);let raf=0,active=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint=(t:number)=>{searchScene(c,.62+(n/10)*.25,n>2,560,140,reduced?0:Math.sin(t/650+n)*6);el.classList.add('is-ready');if(active&&!reduced)raf=requestAnimationFrame(paint)};
    const stop=observeCanvas(el,()=>{active=true;raf=requestAnimationFrame(paint)},()=>{active=false;cancelAnimationFrame(raf)});paint(0);return()=>{active=false;cancelAnimationFrame(raf);stop()};
  },[analogy,n]);
  useEffect(()=>{if(moduleId!=='10.1'||runKey===0)return;let raf=0;const begin=performance.now();const tick=(t:number)=>{const p=Math.min(1,(t-begin)/1300);setProgress(p);if(p<1)raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[moduleId,runKey,choice]);
  const ref=useDraw(c=>cardCanvas(c,moduleId,q,choice,step,played,progress),[moduleId,q,choice,step,played,progress]);
  if(hero)return <canvas ref={heroRef} width={W} height={H} style={canvasStyle} aria-label={moduleId==='new'?'Dark-ISP 思路下猫的轮廓清晰可辨':'固定处理下暗光中的猫容易漏检'}/>;
  if(analogy)return <canvas ref={autoRef} width={560} height={140} style={canvasStyle} aria-label={`夜间寻物场景，第 ${n} 章`} />;
  let controls:React.ReactNode=null,feedback='',good: boolean|undefined=undefined;
  if(moduleId==='1.1'){controls=<><label>暗度 {q}% <input type="range" min="15" max="95" value={q} onChange={e=>setQ(+e.target.value)}/></label><Chips values={['传统处理','Dark-ISP 示意']} value={choice} onChange={setChoice}/></>;feedback=choice?'同一暗度下，任务驱动 RAW 处理可能保留更多可用线索；画面为机制示意。':'暗度越高，固定处理越可能让暗部轮廓难以区分；这不是实时检测结果。';good=choice===1;}
  if(moduleId==='1.2'){controls=<Chips values={['固定 RGB','Dark-ISP']} value={choice} onChange={setChoice}/>;feedback=choice?'论文图 1(e)：直接处理 Bayer RAW，让 ISP 与目标检测任务联合优化。':'论文图 1(d)：传统暗 RGB 流程可能引入信息损失与噪声。';good=choice===1;}
  if(moduleId==='2.1'){controls=<Chips values={['R','Gᵣ','B','Gᵦ']} value={choice} onChange={setChoice}/>;feedback=['红色采样通道；Bayer RAW 仍保存传感器采样信息。','第一路绿色采样，后续与 Gᵦ 合并。','蓝色采样通道。','第二路绿色采样，Binning 对两路绿色取平均。'][choice];}
  if(moduleId==='3.1'){controls=<div style={controlStyle}><button type="button" style={buttonStyle} disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))}>上一步</button><span>{step+1} / 3</span><button type="button" style={buttonStyle} disabled={step===2} onClick={()=>setStep(Math.min(2,step+1))}>下一步</button></div>;feedback=['W：四通道白平衡增益，尺寸 4×4。','B：将四通道合为三通道，尺寸 3×4。','C：RGB 颜色空间校正，尺寸 3×3；合成 P=C·B·W。'][step];}
  if(moduleId==='4.1'){controls=<Chips values={['基础 P','局部 Pₗ','全局 Pᵍ']} value={choice} onChange={setChoice}/>;feedback=['P 保留相机白平衡、双绿合并与颜色校正先验。','Pₗ 随像素位置变化，来自局部特征注意力。','Pᵍ 汇聚整幅图像上下文，并广播到各位置。'][choice];}
  if(moduleId==='5.1'){controls=<label style={controlStyle}>曲率示意 {q} <input type="range" min="0" max="95" value={q} onChange={e=>setQ(+e.target.value)}/></label>;feedback=q<20?'曲率太弱，暗部提升有限。':q>82?'曲率过强可能挤压亮部层次；这只是教学示意。':'曲线让暗部获得更大的增益；论文用逐像素系数混合多项式基。';good=q>=20&&q<=82;}
  if(moduleId==='6.1'){const loss=1-Math.cos(q*Math.PI/180);controls=<label style={controlStyle}>夹角 {q}° <input type="range" min="0" max="180" value={q} onChange={e=>setQ(+e.target.value)}/></label>;feedback=`示意余弦距离 ${(loss).toFixed(2)}。${q<25?'方向接近，但不要求矩阵完全相等。':'方向偏差较大；Self-Boost 在预热后鼓励线性映射靠近伪目标方向。'}`;good=q<25;}
  if(moduleId==='7.1'){controls=<Chips values={['检测监督','预热阶段','Self-Boost 启用']} value={step} onChange={setStep}/>;feedback=['RetinaNet 检测损失为主任务信号；所有图像统一 400×600。','先训练 N 个预热 epoch；主文未给出 N 的具体值，不能编造。','随后加入 λLsb，论文实验 λ=0.01；推理不需计算此正则项。'][step];}
  if(moduleId==='8.1'){controls=<Chips values={['Bayer RAW','动态线性','非线性映射','检测器','Self-Boost']} value={choice} onChange={setChoice}/>;feedback=['输入为四通道 Bayer RAW；不要与量化 RAW-RGB 混称。','白平衡、Binning、颜色校正先验叠加局部/全局注意力。','逐像素系数混合多项式基，输出增强图像 U。','RetinaNet 使用处理后的三通道图像做目标检测。','Self-Boost 是训练时连接后级与前级的方向正则，不是推理主路径。'][choice];}
  if(moduleId==='9.1'){controls=<Chips values={['仅线性','仅非线性','两者结合','再加 Self-Boost']} value={choice} onChange={setChoice}/>;feedback=`LOD 消融表 4：当前组合为 ${[66.6,67.1,68.7,70.4][choice].toFixed(1)} VOC-style mAP；仅在该实验配置下比较。`;good=choice===3;}
  if(moduleId==='10.1'){const names=['LOD · R50 · VOC mAP','NOD Sony · COCO mAP','NOD Nikon · COCO mAP','SynCOCO · COCO mAP'];controls=<><Chips values={names} value={choice} onChange={i=>{setChoice(i);setPlayed(false);setProgress(0)}}/><button type="button" style={buttonStyle} onClick={()=>{setProgress(0);setPlayed(true);setRunKey(k=>k+1)}}>{played?'重新比较':'开始比较'}</button></>;feedback=played?['LOD R50：Dark-ISP 70.4，高于默认 Bayer ISP 67.3，差 3.1 点。','NOD Sony：Dark-ISP 31.5，高于 FeatEnHancer 30.3，差 1.2 点。','NOD Nikon：Dark-ISP 29.9，高于 FeatEnHancer 28.8，差 1.1 点。','SynCOCO：Dark-ISP 23.1，高于 FeatEnHancer 22.4，差 0.7 点。'][choice]:'选定数据集后，在相同评测协议内启动比较；不同数据集的 mAP 不可直接相减。';good=played;}
  if(moduleId==='10.2'){controls=<Chips values={['仅 RGB 可用','新相机零样本','端侧能耗','伪目标偏差']} value={choice} onChange={setChoice}/>;feedback=['需要 Bayer RAW 输入；如果只有压缩 RGB，论文的直接 RAW 处理优势不一定可复现。','论文在 NOD 的 Sony/Nikon 上分别训练和测试；不能据此宣称新相机零样本泛化。','主文强调少参数，但未给出完整端侧延迟/能耗评测；“轻量”不等于已验证实时部署。','我的疑问：用模型自身输出作伪目标，错误色调是否会自我强化？可加入跨曝光或跨相机一致性验证。'][choice];good=false;}
  return <div onKeyDown={e=>{if((e.target as HTMLElement).tagName==='INPUT')e.stopPropagation()}}><canvas ref={ref} width={W} height={H} style={{...canvasStyle,cursor:moduleId==='6.1'?'grab':'default'}} aria-label={`Dark-ISP 第 ${moduleId} 个交互图`} onPointerMove={e=>{if(moduleId!=='6.1'||e.buttons!==1)return;const box=e.currentTarget.getBoundingClientRect();const x=(e.clientX-box.left)/box.width*W;setQ(Math.max(0,Math.min(180,Math.round((x-230)/3))))}}/>{controls}<Feedback text={feedback} good={good}/>{moduleId==='9.1'&&<p style={{color:C.muted,fontSize:14}}>来源：Guo 等，ICCV 2025，表 4；LOD，VOC-style mAP，越高越好。</p>}{moduleId==='10.1'&&<p style={{color:C.muted,fontSize:14}}>来源：原论文表 1–3。LOD 用 VOC-style mAP；NOD/SynCOCO 用 COCO-style mAP。全部数值为原论文报告，并非网页实时推理。</p>}</div>;
};
