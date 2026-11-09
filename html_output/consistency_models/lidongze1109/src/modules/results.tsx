import { useEffect, useRef, useState } from 'react';
import { C, SceneCanvas, clearScene, drawLine, drawText } from './cm-kit';
const records=[
  {name:'CIFAR-10 32×32',pd:[8.34,5.58],cd:[3.55,2.93],ct:[8.70,5.83],edm:2.04,nfe:35,max:10},
  {name:'ImageNet 64×64',pd:[15.39,8.95],cd:[6.20,4.70],ct:[13.0,11.1],edm:2.44,nfe:79,max:20},
  {name:'LSUN Bedroom 256×256',pd:[16.92,8.47],cd:[7.80,5.22],ct:[16.0,7.85],edm:3.57,nfe:79,max:20},
  {name:'LSUN Cat 256×256',pd:[29.6,15.5],cd:[11.0,8.84],ct:[20.7,11.7],edm:6.69,nfe:79,max:30},
];
const colors=[C.red,C.green,C.blue,C.purple];
const methods=['PD','CD','CT','EDM'];
export function Results(){
  const [dataset,setDataset]=useState(0),[progress,setProgress]=useState(0),[running,setRunning]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const data=records[dataset],values=[data.pd[0],data.cd[0],data.ct[0],data.edm];
  useEffect(()=>{
    if(!running)return;
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(media.matches){setProgress(1);setRunning(false);return;}
    let id=0,previous=0,elapsed=0,visible=false,done=false;
    const tick=(time:number)=>{
      if(done||!visible||document.hidden)return;
      if(previous)elapsed+=Math.min(time-previous,50);setProgress(Math.min(1,elapsed/1100));
      previous=time;
      if(elapsed>=1100){done=true;setRunning(false);return;}id=requestAnimationFrame(tick);
    };
    const resume=()=>{cancelAnimationFrame(id);previous=0;if(visible&&!document.hidden&&!done)id=requestAnimationFrame(tick);};
    const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;resume();});
    if(root.current)observer.observe(root.current);
    document.addEventListener('visibilitychange',resume);
    return()=>{done=true;cancelAnimationFrame(id);observer.disconnect();document.removeEventListener('visibilitychange',resume);};
  },[running,dataset]);
  const reset=()=>{setRunning(false);setProgress(0);};
  return <div ref={root}><div style={{display:'grid',gridTemplateColumns:'5rem 1fr',alignItems:'stretch'}}>
    <div aria-hidden="true" style={{position:'relative'}}>{methods.map((m,i)=><span key={m} style={{position:'absolute',top:`${(48.5+i*54)/280*100}%`,transform:'translateY(-50%)',color:colors[i],fontWeight:700}}>{m}</span>)}</div>
    <SceneCanvas ariaLabel={`${data.name} 内对比：PD、CD、CT为一次评估，EDM为${data.nfe}次评估；FID越低越好。`} draw={ctx=>{
      clearScene(ctx);const left=25,right=965,baseline=249;
      for(let i=0;i<=4;i++){const v=data.max*i/4,x=left+(right-left)*i/4;drawLine(ctx,x,25,x,baseline,C.border,1);drawText(ctx,String(v),x,273,C.muted,14,'center');}
      values.forEach((v,i)=>{const y=35+i*54,w=(right-left)*(v/data.max)*progress;ctx.fillStyle=colors[i];ctx.beginPath();ctx.roundRect(left,y,Math.max(w,.1),27,5);ctx.fill();drawText(ctx,(v*progress).toFixed(2),Math.min(left+w+12,1030),y+20,C.text,17);});
      drawLine(ctx,left,baseline,right,baseline,C.muted,2);
    }}/>
    </div><div className="controls" style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:12}}>{records.map((r,i)=><button key={r.name} className={`chip${dataset===i?' selected':''}`} aria-pressed={dataset===i} onClick={()=>{reset();setDataset(i);}}>{r.name}</button>)}<button className="chip" disabled={running||progress===1} onClick={()=>{setProgress(0);setRunning(true);}}>开始对比</button><button className="chip" onClick={reset}>重置</button></div>
    <p>当前数据集：{data.name}　展示进度：{Math.round(progress*100)}%　柱图：PD / CD / CT 的1步结果；EDM为多步参考。横轴从0起，柱越短越好。</p>
    <div style={{overflowX:'auto'}}><table className="paper" aria-label={`${data.name} 论文精确FID及网络评估次数`} style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}><caption>{data.name} · FID↓；NFE为网络评估次数</caption><thead><tr><th scope="col">方法</th><th scope="col">NFE</th><th scope="col">FID↓</th></tr></thead><tbody>{(['pd','cd','ct'] as const).flatMap((key,i)=>data[key].map((v,j)=><tr key={`${key}${j}`}><th scope="row">{methods[i]}</th><td>{j+1}</td><td>{v.toFixed(2)}</td></tr>))}<tr><th scope="row">EDM</th><td>{data.nfe}</td><td>{data.edm.toFixed(2)}</td></tr></tbody></table></div>
    <p className="feedback" role="status" style={{color:progress===1?C.green:C.blue}}>{running?'正在从共同零点展示 FID；柱更短代表更好。':progress===1?'CD 在少步设置明显改善，但多步 EDM 仍有更低 FID；NFE 不是墙钟时间。':'选择同一数据集内的记录；FID 越低越好，NFE 只统计网络评估。'}</p>
    <p>FID衡量生成样本与真实样本在特征分布上的差异，是样本集合的统计指标，不是单张图像的质量评分。本页逐项转录v2第8页表1—2的FID与NFE；原表另有IS↑或Precision↑、Recall↑。附录图注个别值与主表不同，本页统一以主表为准。</p>
    <p>定性消融：CIFAR-10 的 CD 实验中，LPIPS、Heun 和 N=18 表现最好；不能把 N=18 推广为所有任务的最优值。CT 不调用 Heun，其自适应 N 与 μ 调度改善收敛。</p>
    <p>比较边界：表1与表2的 PD 使用 ℓ2，CD/CT 使用 LPIPS，差距不能全部归因于方法本身；文献汇总并非统一训练预算。图4采用相同的自训练EDM教师，并显示PD改用LPIPS后更好；其中Bedroom一步CD(ℓ2)略差于PD(ℓ2)，不能说CD在所有设置都胜过PD。本文也不证明胜过所有 GAN。不同数据集必须分别比较。</p>
  </div>;
}
