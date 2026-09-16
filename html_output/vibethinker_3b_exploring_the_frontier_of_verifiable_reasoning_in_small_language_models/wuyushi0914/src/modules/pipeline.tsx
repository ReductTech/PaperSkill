import React,{useState} from 'react';
import {Canvas,Chips,Stats,Feedback,C,rect,line,label} from './notebook-scene';
const stages=['底座','课程SFT','数学RL','代码RL','STEM RL','自蒸馏','指令RL','部署'];
const signals=['预训练模型','教师完整轨迹','数学答案验证','沙箱与测试','答案/选项验证','已验证的离线轨迹','规则+rubric奖励','直接生成 / 可选CLR'];
const notes=['以Qwen2.5-Coder-3B稠密底座开始；这里没有引入新注意力结构。','先广覆盖，再难长题；通过Pass@K选择各域专家并进行参数合并。','先用MGPO追求数学准确率，再用Long2Short在正确集合内优化简洁；保存数学检查点。','以可执行测试为反馈，练习边界情况和程序约束；保存代码检查点。','将推理能力扩展到科学领域；保存STEM检查点。三个域按顺序训练。','来自数学、代码、STEM检查点的正确轨迹，经学习潜力过滤后作为监督数据，蒸馏回统一学生。','显式规则与rubric奖励强化指令遵从；这一步不等于所有开放问题都有客观答案。','产出一个3B模型。直接推理与可选CLR测试时增强共享参数，后者需要额外生成与自验证预算。'];
export function Pipeline(){const [stage,setStage]=useState(0);return <>
 <Canvas h={280} label="点击训练阶段查看监督来源与回流路径" style={{cursor:'pointer'}} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*840,y=(e.clientY-r.top)/r.height*280;const row=y>140?1:0,col=Math.floor((x-20)/205);if(col>=0&&col<4)setStage(row*4+col);}} draw={c=>{for(let i=0;i<8;i++){const x=35+(i%4)*205,y=55+Math.floor(i/4)*142;if(i<7){const nx=35+((i+1)%4)*205,ny=55+Math.floor((i+1)/4)*142;line(c,[[x+73,y],[nx+73,ny]],i<stage?C.blue:C.line,2);} }for(let i=2;i<=4;i++){const x=108+(i%4)*205,y=55+Math.floor(i/4)*142;c.strokeStyle=stage===i||stage===5?C.purple:C.line;c.lineWidth=2;c.beginPath();c.moveTo(x,y+15);c.quadraticCurveTo(420,135,313,182);c.stroke();}for(let i=0;i<8;i++){const x=35+(i%4)*205,y=30+Math.floor(i/4)*142;rect(c,x,y,145,62,i===stage?C.blue:'#fff');if(i===stage){c.strokeStyle=C.orange;c.lineWidth=3;c.strokeRect(x-3,y-3,151,68);}label(c,String(i+1),x+59,y+41,28,i===stage?'#fff':C.muted);} }}/>
 <Chips options={stages.map((s,i)=>`${i+1} ${s}`)} value={stage} onChange={setStage}/>
 <Stats items={[["阶段",stages[stage]],["监督/使用方式",signals[stage]]]}/>
 <Feedback tone={stage===7?'good':''}>{notes[stage]}</Feedback>
 </>;}
