import React, { useState } from 'react';
import { C, Choices, Feedback, Scene } from './shared-visual';

const stages = [
  { n:'Warmup', steps:'10k', crop:384, mix:'PDB 70%', purpose:'先让优化稳定，并学习可靠局部几何', action:'以高比例实验结构进行短程预热', output:'可继续训练的稳定起点' },
  { n:'I', steps:'60k', crop:384, mix:'PDB 50% · MGnify长单体28%', purpose:'在稳定基础上扩大结构空间覆盖', action:'降低PDB占比，增加长单体等蒸馏数据', output:'更广的折叠与几何先验' },
  { n:'II', steps:'15k', crop:544, mix:'PDB 35% · SAbDab 3%', purpose:'开始适应更长输入与抗体数据', action:'crop由384增至544，并加入SAbDab', output:'更长程、更多任务类型的表示' },
  { n:'III', steps:'15k', crop:544, mix:'SAbDab 8% · de novo 10%', purpose:'加强界面拟合与条件设计能力', action:'提高任务数据比例，并首次训练de novo设计', output:'共享的Stage III检查点' },
  { n:'IV(a)', steps:'10k', crop:544, mix:'冻结主要模块 · 只训置信度头', purpose:'让候选排序分更可靠', action:'从III分叉，冻结主模型并校准置信度', output:'用于排名的置信度模型' },
  { n:'IV(b)', steps:'10k', crop:768, mix:'SAbDab 13% · de novo 20%', purpose:'让完整模型适应更大的复合体', action:'从III分叉，在Hopper GPU上继续训练完整模型', output:'支持更长输入的生成模型' },
];
const positions:[number,number][]=[[112,178],[280,178],[448,178],[616,178],[850,102],[850,252]];

function line(c:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string,width=2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
function dot(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,stroke=C.white){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}
function label(c:CanvasRenderingContext2D,s:string,x:number,y:number,color=C.ink,size=14){c.fillStyle=color;c.font=`600 ${size}px "Segoe UI","Microsoft YaHei",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y);}
function panel(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill='rgba(255,255,255,.84)'){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,12);c.fill();c.strokeStyle=C.line;c.lineWidth=1.5;c.stroke();}
function LogicStrip({purpose,action,output}:{purpose:string;action:string;output:string}){return <div className="logic-strip"><div><b>为什么做</b><span>{purpose}</span></div><div><b>怎么做</b><span>{action}</span></div><div><b>得到什么</b><span>{output}</span></div></div>}

export function TrainingTimelineWidget(){
  const [selected,setSelected]=useState(0);
  const stage=stages[selected];
  return <div>
    <Scene label={`训练课程${stage.n}：${stage.purpose}`} draw={(c,w,h)=>{
      c.fillStyle=C.bg;c.fillRect(0,0,w,h);
      panel(c,40,20,528,70,'rgba(39,68,110,.06)');
      [['精确起步',C.blue],['扩大覆盖',C.purple],['任务精化',C.orange]].forEach(([name,color],i)=>{const x=124+i*176;label(c,name as string,x,42,color as string,14);label(c,['可靠实验结构','更多结构空间','界面·设计·排序'][i],x,67,C.muted,11);if(i<2)label(c,'→',x+88,53,C.muted,16);});
      const edges=[[0,1],[1,2],[2,3],[3,4],[3,5]];edges.forEach(([a,b])=>{const active=(b<=3&&selected>=b)||(b>3&&selected===b);line(c,positions[a][0],positions[a][1],positions[b][0],positions[b][1],active?C.green:C.line,active?7:4);});
      positions.forEach(([x,y],i)=>{const active=i===selected,passed=i<Math.min(selected,4);dot(c,x,y,active?25:20,active?C.orange:passed?C.green:C.light,active?C.blue:C.white);label(c,String(i+1),x,y,C.white,12);label(c,stages[i].n,x,y+37,active?C.orange:C.muted,14);});
      label(c,'共同训练主干',364,135,C.blue,12);label(c,'从III分成两个不同终点',782,178,C.purple,13);
      panel(c,900,34,145,110,'rgba(124,58,237,.07)');label(c,'IV(a)',972,55,C.purple,14);label(c,'只校准排名',972,81,C.ink,12);label(c,'主模型冻结',972,108,C.muted,11);
      panel(c,900,198,145,110,'rgba(240,126,71,.08)');label(c,'IV(b)',972,219,C.orange,14);label(c,'继续训练生成',972,245,C.ink,12);label(c,'crop 768',972,272,C.muted,11);
      panel(c,222,259,520,60,'rgba(255,255,255,.9)');label(c,`${stage.n} · ${stage.steps} steps · crop ${stage.crop}`,482,278,C.blue,17);label(c,stage.mix,482,303,C.ink,12);
    }}/>
    <Choices label="选择训练阶段" options={stages.map(item=>item.n)} value={selected} onChange={setSelected}/>
    <LogicStrip purpose={stage.purpose} action={stage.action} output={stage.output}/>
    <Feedback tone={selected>=4?'good':'neutral'}><strong>{stage.n}：</strong>{stage.steps} steps，crop {stage.crop}。{stage.mix}。{selected===3?' 这是两个Stage IV共同继承的检查点。':selected===4?' IV(a)不继续训练生成主干，只让置信度头学会更好地排序候选。':selected===5?' IV(b)不经过IV(a)，而是从III直接继续训练完整模型。':''}</Feedback>
  </div>;
}
