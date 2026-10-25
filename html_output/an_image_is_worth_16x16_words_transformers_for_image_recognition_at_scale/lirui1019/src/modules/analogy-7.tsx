import React from 'react';
import {C,Stage,clearScene,drawPhoto,line,pill} from './BirdKit';
import {initialParams,learningRound} from './learningMath';
const r=learningRound(initialParams);
export function Analogy7(){return <Stage width={560} height={380}
 label={`观鸟笔记类比：照片和线索不变，用正确答案修订可复用的评分规则。鸟嘴线索系数由0.30改成${r.updated.a1.toFixed(2)}，环境线索系数由-0.50改成${r.updated.a2.toFixed(2)}。再看同一张图，长嘴类概率从${(r.before.p*100).toFixed(1)}%变成${(r.after.p*100).toFixed(1)}%。这些是下方微型模型的示意数值。`}
 render={(c,w,h)=>{
  clearScene(c,w,h);c.fillStyle=C.ink;c.font='600 19px sans-serif';c.fillText('看错后，改的是下次还会用的评分规则',18,31);
  drawPhoto(c,24,90,154);pill(c,20,260,169,68,'#fffefa');
  c.fillStyle=C.green;c.font='600 17px sans-serif';c.fillText('答案：长嘴类',32,285);c.fillStyle=C.muted;c.font='16px sans-serif';c.fillText('照片与线索不改',32,311);
  line(c,194,164,222,164,C.orange,3);pill(c,225,57,316,273,'#fffefa');
  c.fillStyle=C.purple;c.font='600 18px sans-serif';c.fillText('修订辨鸟笔记中的规则',241,84);
  c.fillStyle=C.muted;c.font='17px sans-serif';c.fillText('线索的系数',241,118);c.fillText('旧值 → 新值',405,118);
  [['鸟嘴线索 a₁',initialParams.a1,r.updated.a1],['环境线索 a₂',initialParams.a2,r.updated.a2],['读出系数 v',initialParams.v,r.updated.v],['分数偏置 b',initialParams.b,r.updated.b]].forEach(([s,a,b],i)=>{
   c.fillStyle=C.ink;c.font='16px sans-serif';c.fillText(String(s),241,151+i*32);c.fillStyle=C.green;c.fillText(`${Number(a).toFixed(2)} → ${Number(b).toFixed(2)}`,399,151+i*32);
  });
  line(c,240,263,523,263,C.line,1);c.fillStyle=C.ink;c.font='600 17px sans-serif';c.fillText(`长嘴类：${(r.before.p*100).toFixed(1)}% → ${(r.after.p*100).toFixed(1)}%`,241,295);
  c.fillStyle=C.support;c.font='16px sans-serif';c.fillText('改规则中的数值，再用新规则观察；数值来自教学小模型',18,361);
 }}/>;}
