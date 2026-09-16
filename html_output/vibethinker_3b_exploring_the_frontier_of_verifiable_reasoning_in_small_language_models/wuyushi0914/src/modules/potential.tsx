import React,{useState} from 'react';
import {Canvas,Chips,Stats,Feedback,C,notebook,rect,pencil,target,label} from './notebook-scene';
const scores=[.1,1.5,9,3,2];const notes=['正确但学生已熟悉，平均负对数似然低；相对学习潜力有限。','已验证正确、长度正常、分数位于桶内中高范围；作为教学例子，它更值得优先复习。','极端高分可能来自异常token、格式错误或分布偏移；不是越高越好。','极短轨迹的平均值可能被少数异常token支配，不参与基于分数的优选。','这条轨迹答案错误，在计算学习潜力前就应被验证器排除。'];
export function Potential(){const [sample,setSample]=useState(0);return <>
 <Canvas label="复习优先级与学习潜力分数" draw={c=>{notebook(c,35,27,325,180);rect(c,80,76,230,15,sample===1?'#fce8c0':sample===4?'#f9e5e8':'#edf0e9',2);pencil(c,195+sample*25,85,0);target(c,319,160,sample!==4);label(c,'教学分数',477,66);rect(c,476,92,310,43,'#e2e7df');rect(c,476,92,scores[sample]/10*310,43,sample===1?C.green:sample>1?C.red:C.blue);label(c,scores[sample].toFixed(1),477,182,39);}}/>
 <Chips options={['已熟练','中高潜力','异常高分','极短轨迹','答案错误']} value={sample} onChange={setSample}/>
 <Stats items={[["教学平均NLL",String(scores[sample])],["复习判断",sample===1?'优先候选':sample===0?'优先级较低':sample===3?'不参与分数优选':'排除']]}/>
 <Feedback tone={sample===1?'good':sample>1?'bad':''}>{notes[sample]} 数值只是说明性例子，论文没有公布这些分类的固定阈值；真实样本须在领域与长度桶内比较。</Feedback>
 </>;}
