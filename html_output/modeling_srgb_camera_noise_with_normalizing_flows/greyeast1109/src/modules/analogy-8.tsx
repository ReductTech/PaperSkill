import React, {useState} from 'react';
import {Canvas,C,StampScene,line,text,clearScene} from './stamp-kit';
const feedback=["CL：由 c,g 决定缩放和平移；输出仍为 32×32×3，默认整网有 4 个 CL。","1×1 卷积：对颜色通道做可逆线性混合；det W 必须非零，默认整网有 8 层。","耦合：A 组不变，用 A、I、c、g 预测 B 组的缩放和平移。参数子网自身无须可逆。"];
const nodes=[0,1,2,1,2];
const labels=['条件线性','1×1 卷积','条件耦合'];
const ablations=[['仅 CL',3.678,.079],['仅 ISO：CCS×2',3.726,.154],['仅相机：CCS×2',3.609,.216],['仅干净图：CCS×2',3.882,.295],['完整条件：CCS×2',3.530,.104],['CL + CCS×2',3.398,.075],['两块：CL + CCS×2',3.254,.067],['四块：CL + CCS×2',3.072,.044]] as const;
export function Analogy8(){return <StampScene action="rotate"/>;}
export function Lab8(){
 const [selected,setSelected]=useState(0);
 const draw=(ctx:CanvasRenderingContext2D,w:number,h:number)=>{
  clearScene(ctx,w,h);
  const active=nodes.indexOf(selected);
  for(let i=0;i<6;i++)line(ctx,40+i*170,140,120+i*170,140,i>=active?C.blue:C.border,i>=active?4:2);
  for(let i=0;i<5;i++){
   const x=125+i*170,y=82,chosen=nodes[i]===selected;
   ctx.fillStyle=chosen?'#e7eef7':'#ffffff';ctx.strokeStyle=chosen?C.blue:C.border;ctx.lineWidth=chosen?4:2;ctx.beginPath();ctx.roundRect(x,y,115,115,12);ctx.fill();ctx.stroke();
   ctx.save();ctx.translate(x+57,y+57);
   if(nodes[i]===0){for(let j=-1;j<=1;j++)line(ctx,-33,j*17,33,j*17,chosen?C.blue:C.dark,j===0?5:2);line(ctx,0,-37,0,37,C.orange,3);}
   if(nodes[i]===1){for(let a=0;a<3;a++)for(let b=0;b<3;b++){ctx.fillStyle=a===b?C.blue:C.light;ctx.fillRect(-30+a*23,-30+b*23,16,16);}line(ctx,-35,39,37,-39,C.orange,3);}
   if(nodes[i]===2){ctx.fillStyle=C.light;ctx.fillRect(-34,-31,26,64);ctx.fillStyle=chosen?C.green:C.dark;ctx.fillRect(6,-31,32,64);line(ctx,-8,0,6,0,C.blue,4);}
   ctx.restore();
  }
  text(ctx,'输入',30,55,C.muted,18);text(ctx,'输出',1000,55,C.muted,18);
  ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(182+active*170,228,7,0,Math.PI*2);ctx.fill();
 };
 return <><Canvas draw={draw} label="一个流块：条件线性、两次卷积与条件耦合，选择组件查看活动路径" onPointerDown={e=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*1080/r.width;const i=Math.floor((x-125)/170);if(i>=0&&i<5&&x<=125+i*170+115)setSelected(nodes[i]);}}/>
 <div className="chip-row" style={{flexWrap:'wrap'}}>{labels.map((s,i)=><button key={s} className={'chip '+(selected===i?'selected':'')} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{s}</button>)}</div>
 <div className="ctrl" style={{justifyContent:'center',flexWrap:'wrap'}}><span>输出形状：32×32×3</span><span>整网数量：{selected===0?4:8} 层</span></div>
 <div className="feedback" aria-live="polite">{feedback[selected]}</div>
 <table className="paper"><caption>原文第 7 页表 2：相同测试协议；NLL（每维 nats）与边际 KL 均越低越好</caption><thead><tr><th>配置</th><th>NLL ↓</th><th>边际 KL ↓</th></tr></thead><tbody>{ablations.map((r,i)=><tr key={r[0]} style={i===7?{fontWeight:700,color:C.green}:undefined}><td>{r[0]}</td><td>{r[1].toFixed(3)}</td><td>{r[2].toFixed(3)}</td></tr>)}</tbody></table>
 </>;
}
