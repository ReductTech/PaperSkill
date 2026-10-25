import React,{useRef,useState} from 'react';
import {Lab,Stage,Chips,Notice,Legend,Stat,C,book,changingPhoto,photo,box,line,label,arrow} from './maple-kit';
export function MapleMethods(){const cardMotion=useRef({kind:0,previous:0,at:-10});const motion=useRef([1,0,0,0]);const [mode,setMode]=useState(1);const [input,setInput]=useState(0);const names=['CLIP','CoOp','CoCoOp','MaPLe'];const notes=['CLIP 用人工写好的模板编码类别名，两条分支都保持预训练时的形式。','CoOp 学习文字侧的提示向量；视觉分支仍按原来的方式编码图片。','CoCoOp 用图像特征生成条件偏移，调整文字提示。它仍然只在文字侧加提示。','MaPLe 同时给文字、视觉分支加提示，并用映射 F 将两侧提示关联起来。'];return <Lab><div className="maple-tag">结构对照 · 同一张图片，同一个候选类别</div><Chips items={names} value={mode} onChange={setMode} label="选择方法"/><button className="maple-action-button" onClick={()=>setInput(n=>1-n)}>换一张图片：{input===0?'叶片 → 小鸟':'小鸟 → 叶片'}</button><Stage height={320} label="比较四种方法中哪些分支拥有提示" draw={(c,w,h,t)=>{
  const targets=[mode>0?1:0,mode===3?1:0,mode===3?1:0,mode===2?1:0];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  motion.current=motion.current.map((v,i)=>v+(targets[i]-v)*(reduced?1:.16));
  const [textOn,visionOn,coupled,conditioned]=motion.current;
  box(c,30,37,438,246,'#fff',C.border,22);box(c,612,37,438,246,'#fff',C.border,22);
  label(c,'视觉分支',56,63,14,C.muted);label(c,'文字分支',1022,63,14,C.muted,'right');
  changingPhoto(c,57,91,127,145,input,cardMotion.current,t);box(c,866,107,153,111,'#fff5f8',C.border,15);label(c,'叶片',942,148,27,C.blue,'center');line(c,893,181,991,181,C.light,3);
  [260,650].forEach((x)=>{box(c,x,116,170,104,'#fff5f8',C.border,16);for(let j=0;j<4;j++)box(c,x+25+j*31,140,18,50,'#e8d9e1',undefined,5);label(c,'冻结',x+85,205,11,C.muted,'center');});
  arrow(c,193,164,250,164,C.blue,2);arrow(c,856,164,830,164,C.blue,2);
  for(let j=0;j<2;j++){
    box(c,285+j*55,87,42,17,'#f3e9ee',C.border,5);box(c,675+j*55,87,42,17,'#f3e9ee',C.border,5);
    c.save();c.globalAlpha=visionOn;box(c,285+j*55,87,42,17,C.green,undefined,5);c.restore();
    c.save();c.globalAlpha=textOn;box(c,675+j*55,87,mode===2?(input===0?[25,42][j]:[42,22][j]):42,17,C.green,undefined,5);c.restore();
  }
  c.save();c.globalAlpha=coupled;arrow(c,666,95,401,95,C.purple,2);box(c,516,76,48,38,'#faf3fd',C.purple,10);label(c,'F',540,95,21,C.purple,'center');
  const q=(t*.34)%1;box(c,654-q*247,91,8,8,C.purple,undefined,4);c.restore();
  c.save();c.globalAlpha=conditioned;line(c,433,176,540,176,C.purple,2,[4,5]);line(c,540,176,540,127,C.purple,2,[4,5]);arrow(c,540,127,667,97,C.purple,2);box(c,499,156,82,34,'#faf3fd',C.purple,10);label(c,'条件偏移',540,173,12,C.purple,'center');c.restore();
  [345,735].forEach((x,k)=>{arrow(c,x,226,x,244,C.blue,1.5);for(let j=0;j<5;j++)box(c,x-40+j*18,251,10,11+[4,8,1,6,3][(j+((k===0||mode===2)?input*2:0))%5],C.blue,undefined,3);});
  label(c,names[mode],540,258,16,C.blue,'center');
}}/><Legend items={[{label:'可学习的提示',color:C.green},{label:'冻结的编码器',color:C.muted},{label:'条件或映射关系',color:C.purple}]}/><div className="maple-grid"><Stat label="视觉侧提示" value={mode===3?'由 F(P) 得到':'未加入'}/><Stat label="文字侧提示" value={mode===0?'人工模板':mode===2?'随图像变化':'训练后固定'}/><Stat label="两侧提示的关系" value={mode===3?'显式耦合':'无此映射'}/></div><Notice tone={mode===3?'green':'blue'}><b>{names[mode]}：</b>{notes[mode]}<br/>{mode===2?'换图片时，条件偏移和文字提示随之变化。':'换图片会改变图像输出；这里的文字模板或学到的提示保持不变。'} 色条仅作结构示意。</Notice><details><summary>这里的“适应”到底改了什么？</summary><p>改的是编码器如何利用额外输入向量形成特征。视觉提示不是修改图片像素，文字提示也未必能翻译成可读的句子。本图比较结构，不表示切换到某个方法就一定识别正确。</p><p className="maple-source">依据：MaPLe §1、§3；CLIP → CoOp → CoCoOp → MaPLe 的方法关系。</p></details></Lab>}
