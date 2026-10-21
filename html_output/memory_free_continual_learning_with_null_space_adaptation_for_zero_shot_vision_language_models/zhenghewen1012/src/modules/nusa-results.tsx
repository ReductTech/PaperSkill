import { useEffect, useRef, useState } from 'react';
import { C, Scene, Panel, Chips, Feedback, DataTable, text, line } from './nusa-kit';

type Result = { name:string; values:number[] };
const full:Result[]=[{name:'NuSA-CL',values:[68.6,75.1,82.8]},{name:'LoRA',values:[63.9,70.1,79.9]},{name:'ZSCL',values:[68.1,75.4,83.6]},{name:'DIKI',values:[68.7,76.3,85.1]}];
const few:Result[]=[{name:'NuSA-CL',values:[68.1,70.3,75.4]},{name:'LoRA',values:[60.4,66.8,72.2]},{name:'MiLoRA',values:[59.4,66.0,71.0]},{name:'InfLoRA',values:[66.8,68.9,74.8]}];
const metrics=['Transfer','Avg','Last'];

export function NusaResults() {
  const [protocol,setProtocol]=useState('full');
  const [metric,setMetric]=useState('1');
  const [running,setRunning]=useState(false);
  const [replay,setReplay]=useState(0);
  const [progress,setProgress]=useState(1);
  const chartRef = useRef<HTMLDivElement>(null);
  const rows=protocol==='full'?full:few, m=Number(metric);
  const begin=()=>{const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;setProgress(reduce?1:0);setRunning(!reduce);setReplay(x=>x+1);};
  useEffect(()=>{
    if(!running)return;
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0, elapsed=0, last:number|null=null, visible=true, finished=false;
    const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0;last=null;};
    const finish=()=>{finished=true;stop();setProgress(1);setRunning(false);};
    const tick=(time:number)=>{
      frame=0;
      if(!visible||finished)return;
      if(last!==null)elapsed+=Math.max(0,time-last);
      last=time;
      const next=Math.min(1,elapsed/1400);
      setProgress(next);
      if(next===1)finish();else frame=requestAnimationFrame(tick);
    };
    const resume=()=>{if(!frame&&!finished&&visible)frame=requestAnimationFrame(tick);};
    const onMotion=()=>{if(reduce.matches)finish();};
    const observer=new IntersectionObserver(entries=>{
      visible=entries[0]?.isIntersecting??true;
      if(visible)resume();else stop();
    });
    if(chartRef.current)observer.observe(chartRef.current);
    reduce.addEventListener('change',onMotion);
    if(reduce.matches)finish();else resume();
    return()=>{finished=true;stop();observer.disconnect();reduce.removeEventListener('change',onMotion);};
  },[running,replay]);
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <Chips label="MTIL 协议" value={protocol} options={[{value:'full',label:'Full-shot'},{value:'few',label:'5-shot'}]} onChange={value=>{setProtocol(value);begin();}}/>
    <Chips label="准确率指标" value={metric} options={metrics.map((label,i)=>({value:String(i),label}))} onChange={value=>{setMetric(value);begin();}}/>
    <div className="ctrl"><button className="tiny" onClick={begin}>{running?'重新对比':'重播对比'}</button><span>CLIP ViT-B/16 · 11 个任务 · 准确率 (%)</span></div>
    <div ref={chartRef} style={{display:'grid',gridTemplateColumns:'110px minmax(0,1fr)',alignItems:'stretch',gap:6}}>
      <div style={{display:'flex',flexDirection:'column',justifyContent:'space-evenly',padding:'12px 0 30px',fontSize:15,fontWeight:700}}>{rows.map(row=><span key={row.name} style={{color:row.name==='NuSA-CL'?C.green:C.blue}}>{row.name}</span>)}</div>
      <Scene label={`${protocol==='full'?'Full-shot':'5-shot'} MTIL ${metrics[m]} 实测准确率比较`} draw={(ctx)=>{
        const eased=1-Math.pow(1-progress,3);
        [0,25,50,75,100].forEach(v=>{const x=40+v*9;line(ctx,x,20,x,240,C.axis,1);text(ctx,String(v),x-9,267,15,C.muted);});
        rows.forEach((row,i)=>{const y=28+i*55;ctx.fillStyle=C.light;ctx.fillRect(40,y,900,28);ctx.fillStyle=i===0?C.green:C.blue;ctx.fillRect(40,y,row.values[m]*9*eased,28);text(ctx,(row.values[m]*eased).toFixed(1),55+row.values[m]*9*eased,y+21,18,i===0?C.green:C.blue);});
      }}/>
    </div>
    <Panel><span>NuSA-CL {rows[0].values[m].toFixed(1)}%</span><span>相对 LoRA +{(rows[0].values[m]-rows[1].values[m]).toFixed(1)} pp</span><span>{rows[3].name} {rows[3].values[m].toFixed(1)}%</span></Panel>
    <Feedback tone="good">{protocol==='full'?'Full-shot':'5-shot'} 的 {metrics[m]}：NuSA-CL 为 {rows[0].values[m].toFixed(1)}%，LoRA 为 {rows[1].values[m].toFixed(1)}%，差值为 {(rows[0].values[m]-rows[1].values[m]).toFixed(1)} 个百分点。{protocol==='full'?`DIKI 为 ${rows[3].values[m].toFixed(1)}%，比 NuSA-CL 高 ${(rows[3].values[m]-rows[0].values[m]).toFixed(1)} 个百分点。`:`InfLoRA 为 ${rows[3].values[m].toFixed(1)}%。`}</Feedback>
    <DataTable headers={['方法','Transfer (%)','Avg (%)','Last (%)']} rows={rows.map(row=>[row.name,...row.values.map(n=>n.toFixed(1))])} caption={`论文 ${protocol==='full'?'Table 1，Full-shot':'Table 2，5-shot'} MTIL`}/>
    <details open><summary>Full-shot 训练成本与额外存储</summary><DataTable headers={['方法','训练参数 (M)','额外保存','峰值显存 (GB)','训练 (GPU h)']} rows={[["NuSA-CL",1.5,"无",6.6,1.21],["LoRA",15.7,"无",6.7,1.21],["ZSCL",149.6,"数据与参考模型 10.5 GB",43.1,47.24],["DIKI",1.8,"任务统计量 159 MB",10.2,4.40]]} caption="论文 Table 1；CLIP ViT-B/16，11 个任务，Full-shot"/><p>NuSA-CL 的训练参数约为 LoRA 的 9.6%，两者训练时间均为 1.21 GPU h。NuSA-CL 以 SVD 因子和当前任务优化状态完成训练，任务结束后把更新合并到骨干。</p></details>
    <details><summary>三个 MTIL 指标</summary><p>Transfer 衡量尚未训练任务的零样本表现；Avg 对持续学习各步的多任务准确率取平均；Last 衡量最后一步对全部任务的表现。三者分别对应未见任务保留、学习全过程表现与最终综合能力。</p></details>
    <button className="tiny ghost" onClick={()=>{setProtocol('full');setMetric('1');setRunning(false);setProgress(1);setReplay(x=>x+1);}}>重置</button>
  </div>;
}
