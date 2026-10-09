import {EnsembleScene, EnsembleResults} from './VisualLessons';
import { useEffect, useRef, useState } from 'react';
import { SceneCanvas, drawGarden, drawRobot, drawPrompt, drawTarget, C } from './GardenKit';

const results = { SuperGLUE: [90.5,91.0,91.3], BoolQ: [91.1,91.3,91.7] };
const labels = ['五提示平均','单提示最好','五提示集成'];
const votes = ['是','是','否','是','否'];

export function EnsembleWidget() {
  const [task,setTask] = useState<'SuperGLUE'|'BoolQ'>('SuperGLUE');
  const [voteCount,setVoteCount] = useState(0);
  const [progress,setProgress] = useState(0);
  const [running,setRunning] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const isVisible = useRef(true);
  useEffect(()=>{ const observer = new IntersectionObserver(entries=>{isVisible.current=entries[0].isIntersecting;}); if(holder.current)observer.observe(holder.current);return()=>observer.disconnect(); },[]);
  useEffect(()=>{
    if(!running)return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setProgress(1);setRunning(false);return;}
    let frame=0,last=performance.now(),elapsed=0;
    const animate=(now:number)=>{ const dt=Math.min(now-last,50);last=now;if(isVisible.current&&!document.hidden){elapsed+=dt;setProgress(Math.min(elapsed/1800,1));}if(elapsed<1800)frame=requestAnimationFrame(animate);else setRunning(false);};
    frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame);
  },[running,task]);
  const changeTask = (next:'SuperGLUE'|'BoolQ')=>{setTask(next);setProgress(0);setRunning(false);setVoteCount(0);};
  const scores=results[task];
  const yes=votes.slice(0,voteCount).filter(x=>x==='是').length;
  return <div className="experiment" ref={holder}>
    <p>一颗冻结的 XXL 大脑，五份针对同一个任务独立训练的提示。每份提示条件下，输入都要经过底座，再多数投票。</p>
    <div className="trainer-controls" aria-label="选择论文指标">{(['SuperGLUE','BoolQ'] as const).map(item=><button key={item} className={`trainer-button ${task===item?'is-selected':''}`} aria-pressed={task===item} onClick={()=>changeTask(item)}>{item}</button>)}</div>
    <EnsembleScene voteCount={voteCount}/>
    <p>理解投票的脚本演示：同一阅读题“花园的大门今天开放了吗？”五份提示给出预设答案。它与论文评测数据无关，也不调用真实模型。</p>
    <div className="trainer-controls"><button className="trainer-button" disabled={voteCount===5} onClick={()=>setVoteCount(v=>Math.min(5,v+1))}>{voteCount===5?'五份提示已完成':'运行下一份提示'}</button><button className="trainer-button" onClick={()=>setVoteCount(0)}>重置投票</button></div>
    <p className="trainer-output" role="status">{voteCount===0?'尚未运行提示。':votes.slice(0,voteCount).map((v,i)=>`提示 ${i+1}：${v}`).join(' · ')}{voteCount===5?` → 多数答案“是”（${yes}∶${voteCount-yes}）`:` · 已完成 ${voteCount}/5`}</p>
    <h4>让论文结果到达终点</h4>
    <EnsembleResults scores={scores} progress={progress}/>
    <p>点击启动，三条结果从同一个 0 基线展开。动画只是展示最终测量值；中间长度不是训练轨迹。</p>
    <div className="trainer-controls"><button className="trainer-button" disabled={running} onClick={()=>{setProgress(0);setRunning(true);}}>{running?'结果正在展开':'展开论文对比'}</button><button className="trainer-button" onClick={()=>{setProgress(0);setRunning(false);}}>重置结果</button></div>
    <div className="trainer-output" aria-label={`${task}精确论文结果`}>{scores.map((score,i)=><p className="metric-line" key={labels[i]}><span style={{color:[C.blue,C.purple,C.green][i]}}>●</span> {labels[i]}：<strong>{score.toFixed(1)}</strong> {task==='BoolQ'?'Accuracy ↑':'SuperGLUE 聚合分 ↑'}</p>)}</div>
    <p className="trainer-feedback" role="status">{running?'动画正在展开，精确终点已列在上方。':progress===1?`集成到达 ${scores[2].toFixed(1)}；比单提示最好高 ${(scores[2]-scores[1]).toFixed(1)} 点。`:'点击按钮查看同一基线上的结果比较。'} 五提示集成针对同一任务，不是把五个不同任务的答案相加。</p>
    <p className="evidence-note">Table 3，p8，§6：冻结 XXL，5 份独立提示，多数投票，开发集结果。SuperGLUE 90.5 / 91.0 / 91.3；BoolQ 91.1 / 91.3 / 91.7。同一输入配上5份提示，形成5个条件实例，可组成 batch size=5 的一次批量前向。共享底座节省模型副本存储，但仍计算5个实例。</p>
    <p>训练师的最终判断：在本文设置中，底座越强，任务适配越可能转向学习引导。软提示不一定能翻译成人类可读指令；计算、监督数据与任务差异仍限制它，本文没有证明所有任务都可以放弃完整微调。</p>
  </div>;
}
