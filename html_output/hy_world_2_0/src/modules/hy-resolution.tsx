import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import { PaperTable } from './hy-paper-evidence';
import type { WidgetProps } from './registry';

const C = { bg:'#f5f8f0', line:'#d7deea', ink:'#21324a', muted:'#68778f', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#d97706', white:'#fff' };
const levels = [
  { name:'低 L', px:'189×259', width:6, old:80.55, now:83.43 },
  { name:'中 M', px:'378×518', width:10, old:86.13, now:86.48 },
  { name:'高 H', px:'756×1036', width:18, old:66.29, now:86.89 },
];

function label(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,color=C.ink,size=12,align:CanvasTextAlign='left'){ctx.fillStyle=color;ctx.font=`700 ${size}px Segoe UI, sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);ctx.textAlign='left';}

function ResolutionCanvas({level,ratio}:{level:number;ratio:number}){
  const ref=useRef<HTMLCanvasElement>(null); const state=useRef({level,ratio}); state.current={level,ratio};
  useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,620,330)}catch{return}
    const paint=()=>{const d=levels[state.current.level];const r=state.current.ratio;ctx.clearRect(0,0,620,330);ctx.fillStyle=C.bg;ctx.fillRect(0,0,620,330);
      label(ctx,'同一个物体始终位于画面宽度的 '+Math.round(r*100)+'%',310,28,C.ink,14,'center');
      const panels=[{x:28,title:'标准 RoPE：整数位置继续变大',color:C.red},{x:322,title:'Normalized RoPE：相对位置固定',color:C.green}];
      panels.forEach((panel,index)=>{ctx.fillStyle=C.white;ctx.strokeStyle=panel.color;ctx.lineWidth=2;ctx.fillRect(panel.x,54,270,182);ctx.strokeRect(panel.x,54,270,182);label(ctx,panel.title,panel.x+135,46,panel.color,11,'center');
        const innerX=panel.x+18,innerY=76,innerW=234,innerH=128;ctx.fillStyle='#d9e8f2';ctx.fillRect(innerX,innerY,innerW,innerH*.52);ctx.fillStyle='#9eb48d';ctx.fillRect(innerX,innerY+innerH*.52,innerW,innerH*.48);
        for(let i=0;i<d.width;i+=1){const x=innerX+i*innerW/(d.width-1);ctx.strokeStyle=index===0&&state.current.level===2&&i>=10?'rgba(196,63,82,.5)':C.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,innerY);ctx.lineTo(x,innerY+innerH);ctx.stroke();}
        const objectX=innerX+r*innerW;ctx.fillStyle=C.orange;ctx.fillRect(objectX-10,innerY+70,20,48);ctx.fillStyle=C.white;ctx.fillRect(objectX-6,innerY+82,12,5);
        const integerIndex=Math.round(r*(d.width-1));const normalized=2*r-1;label(ctx,index===0?'i = '+integerIndex+(state.current.level===2?'（训练外风险）':''):'x̂ = '+normalized.toFixed(2),panel.x+135,226,index===0?(state.current.level===2?C.red:C.blue):C.green,11,'center');
      });
      ctx.fillStyle=C.line;ctx.fillRect(58,270,210,13);ctx.fillRect(352,270,210,13);ctx.fillStyle=state.current.level===2?C.red:C.blue;ctx.fillRect(58,270,210*d.old/90,13);ctx.fillStyle=C.green;ctx.fillRect(352,270,210*d.now/90,13);
      label(ctx,'WM 1.0 AUC@30 '+d.old.toFixed(2),58,306,state.current.level===2?C.red:C.blue,11);label(ctx,'WM 2.0 AUC@30 '+d.now.toFixed(2),352,306,C.green,11);canvas.classList.add('is-ready');};
    const disconnect=observeCanvas(canvas,paint,()=>undefined);paint();return disconnect;},[]);
  useEffect(()=>{const canvas=ref.current;if(!canvas)return;let ctx=canvas.getContext('2d');if(!ctx)return;const d=levels[level];ctx.clearRect(0,0,620,330);ctx.fillStyle=C.bg;ctx.fillRect(0,0,620,330);
    label(ctx,'同一个物体始终位于画面宽度的 '+Math.round(ratio*100)+'%',310,28,C.ink,14,'center');
    [{x:28,title:'标准 RoPE：整数位置继续变大',color:C.red},{x:322,title:'Normalized RoPE：相对位置固定',color:C.green}].forEach((panel,index)=>{ctx.fillStyle=C.white;ctx.strokeStyle=panel.color;ctx.lineWidth=2;ctx.fillRect(panel.x,54,270,182);ctx.strokeRect(panel.x,54,270,182);label(ctx,panel.title,panel.x+135,46,panel.color,11,'center');const innerX=panel.x+18,innerY=76,innerW=234,innerH=128;ctx.fillStyle='#d9e8f2';ctx.fillRect(innerX,innerY,innerW,innerH*.52);ctx.fillStyle='#9eb48d';ctx.fillRect(innerX,innerY+innerH*.52,innerW,innerH*.48);for(let i=0;i<d.width;i+=1){const x=innerX+i*innerW/(d.width-1);ctx.strokeStyle=index===0&&level===2&&i>=10?'rgba(196,63,82,.5)':C.line;ctx.beginPath();ctx.moveTo(x,innerY);ctx.lineTo(x,innerY+innerH);ctx.stroke();}const objectX=innerX+ratio*innerW;ctx.fillStyle=C.orange;ctx.fillRect(objectX-10,innerY+70,20,48);ctx.fillStyle=C.white;ctx.fillRect(objectX-6,innerY+82,12,5);label(ctx,index===0?'i = '+Math.round(ratio*(d.width-1))+(level===2?'（训练外风险）':''):'x̂ = '+(2*ratio-1).toFixed(2),panel.x+135,226,index===0?(level===2?C.red:C.blue):C.green,11,'center');});ctx.fillStyle=C.line;ctx.fillRect(58,270,210,13);ctx.fillRect(352,270,210,13);ctx.fillStyle=level===2?C.red:C.blue;ctx.fillRect(58,270,210*d.old/90,13);ctx.fillStyle=C.green;ctx.fillRect(352,270,210*d.now/90,13);label(ctx,'WM 1.0 AUC@30 '+d.old.toFixed(2),58,306,level===2?C.red:C.blue,11);label(ctx,'WM 2.0 AUC@30 '+d.now.toFixed(2),352,306,C.green,11);},[level,ratio]);
  return <canvas ref={ref} width={620} height={330}/>;
}

export const HyResolution:React.FC<WidgetProps>=()=>{
  const[level,setLevel]=useState(0);const[ratio,setRatio]=useState(.05);const d=levels[level];
  return <div className="resolution-rebuild">
    <div className="learning-contract"><div><span>为什么学</span><p>WorldMirror 要接受不同分辨率和视图数；整数位置会让高分辨率推理进入训练外坐标。</p></div><div><span>本次操作</span><p>固定同一物体的相对位置，切换 L/M/H 或移动物体，比较整数索引与归一化坐标。</p></div><div><span>应得判断</span><p>Normalized RoPE 把“位置外推”改成固定区间内的重新采样，因此跨分辨率更稳定。</p></div></div>
    <div className="resolution-levels" role="tablist" aria-label="选择论文分辨率">{levels.map((item,index)=><button key={item.name} type="button" role="tab" aria-selected={level===index} className={level===index?'selected':''} onClick={()=>setLevel(index)}><strong>{item.name}</strong><span>{item.px}</span></button>)}</div>
    <ResolutionCanvas level={level} ratio={ratio}/>
    <label className="resolution-position-control"><span>物体相对横向位置</span><strong>{Math.round(ratio*100)}%</strong><input type="range" min={5} max={95} value={Math.round(ratio*100)} onChange={(event)=>setRatio(Number(event.target.value)/100)}/></label>
    <section className="resolution-causal-chain"><div><span>标准坐标</span><strong>索引随网格扩大：i={Math.round(ratio*(d.width-1))}</strong><small>{level===2?'进入训练外位置，旧模型高分辨率退化明显':'当前档位仍接近训练范围'}</small></div><i>→</i><div><span>归一化坐标</span><strong>x̂={(2*ratio-1).toFixed(2)}</strong><small>分辨率变化时，同一相对位置保持可比</small></div></section>
    <div className={`feedback ${level===2?'good':''}`}>{level===2?'高分辨率是最能看出因果的状态：WorldMirror 1.0 AUC@30 为 66.29，2.0 为 86.89。':'在 L/M 档两代差距较小；切到 H 才能看到位置外推问题被放大。'} 数字来自 Table 12，不由滑杆计算。</div>
    <div className="resolution-protocol-note"><strong>协议边界：</strong><span>相机姿态 AUC 使用 Table 12 的 L=189×259；Table 11 点图低档另为 182×252，不能混写。</span></div>
    <PaperTable tableId="table-12"/><PaperTable tableId="table-11"/>
  </div>;
};

export default HyResolution;
