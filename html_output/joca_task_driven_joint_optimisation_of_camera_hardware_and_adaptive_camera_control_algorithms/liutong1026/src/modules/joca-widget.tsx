import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080, H = 280;
const C = { bg:'#f5f8f0', road:'#76906a', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', ink:'#21324a', line:'#d7deea' };
const cell = (c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string,stroke=C.line) => {
  c.beginPath();c.roundRect(x,y,w,h,14);c.fillStyle=color;c.fill();c.lineWidth=2;c.strokeStyle=stroke;c.stroke();
};
const mark = (c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string) => {
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();
};
function road(c:CanvasRenderingContext2D,soft:boolean) {
  c.fillStyle='#e2eade';c.fillRect(0,193,W,87);
  c.fillStyle=C.road;c.fillRect(0,240,W,5);
  cell(c,190,148,166,57,C.blue,C.blue);cell(c,222,119,94,44,'#e7f3ef',C.blue);
  mark(c,225,207,17,C.ink);mark(c,326,207,17,C.ink);
  c.fillStyle=C.road;c.fillRect(832,93,8,105);
  cell(c,761,46,147,73,soft?'#e7eade':'#fff4d2',soft?C.red:C.orange);
  c.fillStyle=soft?C.red:C.blue;c.fillRect(781,80,108,7);
}
function glyph(c:CanvasRenderingContext2D,id:string,index:number,x:number,y:number,color:string) {
  c.strokeStyle=color;c.lineWidth=5;c.lineCap='round';c.lineJoin='round';
  if(id==='2.1'&&index===1){
    cell(c,x-24,y-24,48,48,'#fff',color);
    [-12,0,12].forEach(a=>[-12,0,12].forEach(b=>mark(c,x+a,y+b,3,color)));
  } else if(id==='4.1'&&index===1 || id==='7.1'){
    c.beginPath();c.arc(x,y,29,0,Math.PI*2);c.stroke();
    c.beginPath();c.moveTo(x,y);c.lineTo(x,y-19);c.moveTo(x,y);c.lineTo(x+15,y+9);c.stroke();
  } else if(id==='5.1'&&index===2 || id==='8.1'&&index===3){
    c.beginPath();c.arc(x,y,30,0,Math.PI*2);c.stroke();
    c.beginPath();c.arc(x,y,13,0,Math.PI*2);c.stroke();
  } else if(id==='4.1'&&index===2 || id==='5.1'&&index===1 || id==='8.1'&&index===2){
    for(let i=-1;i<=1;i++){const yy=y+i*17;c.beginPath();c.moveTo(x-28,yy);c.lineTo(x+28,yy);c.stroke();mark(c,x+i*16,yy,6,color);}
  } else {
    cell(c,x-31,y-18,62,39,'#fff',color);
    c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.stroke();
    c.fillStyle=color;c.fillRect(x-23,y-25,18,8);
  }
}
function bars(c:CanvasRenderingContext2D,values:number[],picked:number) {
  values.forEach((v,i)=>{
    const y=30+i*(values.length===4?59:78);
    cell(c,228,y,690,30,'#eef3ef','#eef3ef');
    cell(c,228,y,Math.max(5,690*v),30,i===picked?C.green:C.blue,i===picked?C.green:C.blue);
  });
}
function draw(c:CanvasRenderingContext2D,id:string,choice:number,value:number,gain:number,step:number) {
  c.fillStyle=C.bg;c.fillRect(0,0,W,H);
  if(id==='old'||id==='new'||id==='ana'||id==='1.1'||id==='1.2'||id==='3.1'||id==='10.1'){
    road(c,id==='old'||(id==='1.1'&&choice===1&&value>60)||(id==='1.2'&&choice===0));
    if(id==='1.1'&&value<35){c.fillStyle='rgba(25,40,60,'+((35-value)/90)+')';c.fillRect(0,0,W,H);}
    if(id==='1.1'||id==='3.1'){
      c.fillStyle='rgba(255,232,150,'+Math.min(.7,value/120)+')';
      c.beginPath();c.moveTo(355,150);c.lineTo(759,59);c.lineTo(759,178);c.fill();
    }
    if(id==='3.1')bars(c,[Math.min(1,(value+gain*.5)/130),Math.min(1,gain/100),Math.min(1,value/100)],-1);
    if(id==='10.1')cell(c,490+choice*56,27,155,28,choice===0?C.green:C.orange,choice===0?C.green:C.orange);
    return;
  }
  if(id==='9.1'){
    const vals=[[.318,.289,.303,.325],[.316,.297,.331],[.303,.308,.322],[.272,.289,.319]][choice];
    bars(c,vals.map(v=>v/.36),vals.length-1);return;
  }
  if(id==='9.2'){bars(c,[.310,.302,.233,.325].map(v=>v/.36),step);return;}
  const count=id==='2.1'?6:id==='4.1'||id==='6.1'?4:id==='8.1'?5:3;
  const w=(980-(count-1)*18)/count;
  for(let i=0;i<count;i++){
    const active=i===(id==='6.1'?step:choice);
    cell(c,50+i*(w+18),70,w,133,active?'#e5f3ea':'#fff',active?C.green:C.line);
    glyph(c,id,i,50+i*(w+18)+w/2,136,active?C.green:C.blue);
  }
  if(id==='8.1')cell(c,80,231,920,18,choice===4?'#eee8ff':'#e7ede8',choice===4?C.purple:C.line);
}
const row:React.CSSProperties={display:'flex',alignItems:'center',gap:9,flexWrap:'wrap',margin:'14px 0'};
const button:React.CSSProperties={border:'1px solid #d7deea',borderRadius:9,padding:'8px 13px',font:'inherit',background:'#fff',color:C.ink,cursor:'pointer'};
function Choices({items,selected,onSelect}:{items:string[],selected:number,onSelect:(n:number)=>void}){
  return <div style={row}>{items.map((x,i)=><button type="button" key={x} aria-pressed={selected===i} onClick={()=>onSelect(i)} style={{...button,background:selected===i?C.blue:'#fff',color:selected===i?'#fff':C.ink}}>{x}</button>)}</div>;
}
const r9=[
  {label:'CARLA · 标定条件',names:['FLIR + NeuralAE','Basler + NeuralAE','TaCOS + AverageAE','JOCA'],values:[.318,.289,.303,.325]},
  {label:'Waymo · 标定条件',names:['Basler + NeuralAE','TaCOS + AverageAE','JOCA'],values:[.316,.297,.331]},
  {label:'Waymo · 噪声 ×10',names:['Basler + NeuralAE','TaCOS + AverageAE','JOCA'],values:[.303,.308,.322]},
  {label:'Waymo · 噪声 ×20',names:['Basler + NeuralAE','TaCOS + AverageAE','JOCA'],values:[.272,.289,.319]},
];
const questions=[
  ['跨相机泛化','用未参与设计的新传感器做测试；同数据比较各方案 mAP 降幅。Waymo 相机效果是模拟的，不能替代真实新硬件验证。'],
  ['突发照明','设计隧道出口等场景；比较恢复所需帧数、误检和漏检，不能只报平均 mAP。'],
  ['成本与时延','在同一设备上量控制器耗时、功耗和检测时延；论文未完成新硬件的实际部署成本评估。'],
  ['主动视觉','增加可选择视角或拍摄时刻的策略，对照仅调曝光与增益；这是个人延伸，不是论文已完成的实验。'],
];
export const JocaWidget:React.FC<WidgetProps>=({chapterId,moduleId})=>{
  const [choice,setChoice]=useState(0),[value,setValue]=useState(44),[gain,setGain]=useState(25),[step,setStep]=useState(0);
  const ref=useRef<HTMLCanvasElement>(null);
  const isHero=chapterId==='hero',isAnalogy=moduleId==='ana';
  const id=isHero?(moduleId==='new'?'new':'old'):isAnalogy?'ana':moduleId;
  useEffect(()=>{const el=ref.current;if(!el)return;const c=setupCanvas(el,W,H);draw(c,id,choice,value,gain,step);el.classList.add('is-ready');},[id,choice,value,gain,step]);
  const canvas=<canvas ref={ref} width={W} height={H} style={{display:'block',width:'100%',height:'auto'}} aria-label={'JOCA '+id+' 教学示意'} />;
  if(isHero||isAnalogy)return canvas;
  let controls:React.ReactNode=null,feedback='',good:boolean|undefined,detail:React.ReactNode=null;
  if(id==='1.1'){
    controls=<><Choices items={['暗光','快速运动']} selected={choice} onSelect={setChoice}/><label>曝光示意 {value}% <input type="range" min="10" max="90" value={value} onChange={e=>setValue(+e.target.value)}/></label></>;
    feedback=value>67?'长曝光可能让快速运动的目标拖影。':value<25?'曝光太短，暗处信号可能不足。':'亮度与清晰度要一起考虑；这里不是实际相机成像。';good=value>=25&&value<=67;
  } else if(id==='1.2'){
    controls=<Choices items={['分开设计','JOCA 联合设计']} selected={choice} onSelect={setChoice}/>;
    feedback=choice?'硬件、控制器和检测器围绕同一任务优化；提升还要看实验条件。':'先固定硬件再单独调曝光，可能错过更匹配任务的组合。';good=!!choice;
  } else if(id==='2.1'){
    const names=['传感器','像素尺寸','焦距','安装位置','曝光时间','增益'];
    controls=<Choices items={names} selected={choice} onSelect={setChoice}/>;
    feedback=choice<4?names[choice]+'属于硬件选型；Waymo 实验对视场和位置作了限制。':names[choice]+'属于运行时参数，可根据当前图像为下一帧调整。';
  } else if(id==='3.1'){
    controls=<div style={row}><label>曝光 E {value}% <input type="range" min="10" max="90" value={value} onChange={e=>setValue(+e.target.value)}/></label><label>增益 G {gain}% <input type="range" min="10" max="90" value={gain} onChange={e=>setGain(+e.target.value)}/></label></div>;
    feedback=value>70?'长曝光会增加运动拖影风险。':gain>65?'增益可提亮，但噪声也可能加重。':'尝试分别提高 E 和 G：强度都会变化，副作用不同。';
    detail=<p style={{fontSize:14,color:C.ink}}>三条示意量依次为亮度、噪声、拖影；并非论文测量或物理仿真。</p>;
  } else if(id==='4.1'){
    controls=<Choices items={['本帧图像','先前 E/G','预测下一帧','取得下一帧']} selected={choice} onSelect={setChoice}/>;
    feedback=['提取当前图像的全局与语义特征。','论文在语义分支接入先前动态参数。','多层感知机预测下一帧曝光与增益。','相机按新参数采集下一帧，再反馈给检测与控制。'][choice];
  } else if(id==='5.1'){
    controls=<Choices items={['硬件','ACC 控制器','检测器']} selected={choice} onSelect={setChoice}/>;
    feedback=['硬件含离散候选，用遗传算法按任务适应度搜索。','DF-Grad 用扰动候选为控制器提供监督，绕过不可微渲染。','检测器使用任务损失梯度；实验采用 Faster R-CNN/ResNet-50。'][choice];
  } else if(id==='6.1'){
    controls=<div style={row}><button type="button" style={button} disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))}>上一步</button><span>{step+1} / 4</span><button type="button" style={button} disabled={step===3} onClick={()=>setStep(Math.min(3,step+1))}>下一步</button></div>;
    feedback=['控制器先预测 E、G。','围绕预测值采样四个扰动候选。','以检测适应度比较候选，选较好的一组。','以选中参数做 L1 监督，连同任务损失训练控制器。'][step];good=step===3;
  } else if(id==='7.1'){
    controls=<Choices items={['硬件搜索','ACC 扰动','检测器梯度']} selected={choice} onSelect={setChoice}/>;
    feedback=['论文实验硬件每 45 步优化一次；遗传搜索为 10 个候选、35 代。','DF-Grad 的扰动优化每 4 步进行一次；ACC 推理仍逐帧给出设置。','检测器在任务损失下训练；不是所有参数每帧同时更新。'][choice];
  } else if(id==='8.1'){
    controls=<Choices items={['虚拟相机','成像效果','ACC 控制器','目标检测器','DF-Grad']} selected={choice} onSelect={setChoice}/>;
    feedback=['硬件参数决定相机配置，在设计时搜索。','曝光与增益影响图像，还需模拟噪声和运动模糊。','控制器用当前图像预测下一帧 E/G。','检测器的任务损失提供“图像是否有用”的信号。','训练分支用扰动和监督更新 ACC；不是推理时多做一次图像处理。'][choice];
  } else if(id==='9.1'){
    const d=r9[choice];controls=<Choices items={r9.map(x=>x.label)} selected={choice} onSelect={setChoice}/>;
    feedback=d.label+'：JOCA '+d.values[d.values.length-1].toFixed(3)+'，最佳所列基线 '+Math.max(...d.values.slice(0,-1)).toFixed(3)+' mAP。';
    detail=<><div>{d.names.map((n,i)=><div key={n} style={{fontSize:15,fontWeight:i===d.names.length-1?700:400}}>{n}：{d.values[i].toFixed(3)}</div>)}</div><p style={{fontSize:14}}>论文表 {choice===0?'1':'2'}；{choice===0?'CARLA 合成图像':'Waymo 预录图像经相机效果模拟'}；目标检测 mAP ↑。不同条件不直接相减。</p></>;good=true;
  } else if(id==='9.2'){
    const names=['去 GA 监督','固定扰动','冻结检测器','完整 JOCA'],vals=[.310,.302,.233,.325];
    controls=<Choices items={names} selected={step} onSelect={setStep}/>;
    feedback=names[step]+'：'+vals[step].toFixed(3)+' mAP。消融差值只说明这组实验配置下的影响。';
    detail=<p style={{fontSize:14}}>论文表 3；CARLA 合成图像、标定条件、目标检测 mAP ↑。</p>;good=step===3;
  } else if(id==='10.1'){
    controls=<Choices items={questions.map(x=>x[0])} selected={choice} onSelect={setChoice}/>;
    feedback=questions[choice][1];detail=<p style={{fontSize:14}}>个人提出的验证方案，不是论文已报告的结果。</p>;
  }
  return <div onKeyDown={e=>{if((e.target as HTMLElement).tagName==='INPUT')e.stopPropagation()}}>{canvas}{controls}<div className={'feedback '+(good===true?'good':good===false?'bad':'')} role="status">{feedback}</div>{detail}</div>;
};
