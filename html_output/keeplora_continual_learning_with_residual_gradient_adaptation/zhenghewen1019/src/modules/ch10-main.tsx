import { useEffect, useState } from 'react';
import { StudyCanvas,palette,drawLabel } from './studio-kit';

const metricNames=['未见迁移','全程平均','最终表现'];
const data=[
  {name:'分类顺序一',source:'表 2 · CLIP ViT-B/16 · 11 个数据集按名称顺序学习',names:['KeepLoRA','InfLoRA','ZSCL','KeepLoRA+'],rows:[[69,77.5,86.1],[67.4,76.3,85.2],[68.1,75.4,83.6],[69.9,79,88.2]],decimals:1,observation:'KeepLoRA 的三项总体指标为 69.0 / 77.5 / 86.1%。Aircraft 在刚学完时为 59.0%，最后为 53.2%，下降 5.8 个百分点。'},
  {name:'分类顺序二',source:'表 6 · CLIP ViT-B/16 · 调整后的 11 任务顺序',names:['KeepLoRA','InfLoRA','IAP','KeepLoRA+'],rows:[[65,75.6,85.9],[64,74.5,84.7],[64.9,75.1,85.9],[65.5,76.9,88.2]],decimals:1,observation:'KeepLoRA 的最终表现为 85.9%，与 IAP 相同。两个任务顺序下的表现支持检验顺序敏感性。'},
  {name:'五领域问答',source:'表 3 · LLaVA-1.5-7B · MLLM-DCL 五领域',names:['KeepLoRA','SEFE','LoRA-FT'],rows:[[33.71,54.19,64.41],[33.49,51.86,59.91],[32.44,49.26,54.52]],decimals:2,observation:'KeepLoRA 的最终表现为 64.41%，SEFE 为 59.91%。Driving 的未见迁移为 16.63%，低于 SEFE 的 19.63%。'},
  {name:'六任务问答',source:'表 4 · LLaVA-1.5-7B · UCIT 六任务',names:['KeepLoRA','SEFE','LoRA-FT'],rows:[[28.4,55.37,67.84],[27.48,54.29,66.48],[26.84,51.99,61.35]],decimals:2,observation:'KeepLoRA 的最终表现为 67.84%，SEFE 为 66.48%。Flickr30k 的最终表现分别为 57.18% 和 57.33%。'}
];
const colors=[palette.blue,palette.dark,palette.orange,palette.purple];
export function Ch10Main(){
  const [benchmark,setBenchmark]=useState(0),[metric,setMetric]=useState(0),[running,setRunning]=useState(false),[progress,setProgress]=useState(0);
  const current=data[benchmark];
  useEffect(()=>{
    if(!running)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){setProgress(1);setRunning(false);return;}
    const start=performance.now();let frame=0;
    const tick=(now:number)=>{const p=Math.min(1,(now-start)/1200);setProgress(p);if(p<1)frame=requestAnimationFrame(tick);else setRunning(false);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[running]);
  const stop=()=>{setRunning(false);setProgress(0);};
  return <div>
    <div className="chip-row" aria-label="实验基准">{data.map((d,i)=><button key={d.name} aria-pressed={benchmark===i} className={`chip ${benchmark===i?'selected':''}`} onClick={()=>{stop();setBenchmark(i);}}>{d.name}</button>)}</div>
    <div className="ctrl">{metricNames.map((m,i)=><button key={m} className={`chip ${metric===i?'selected':''}`} aria-pressed={metric===i} onClick={()=>{stop();setMetric(i);}}>{m}</button>)}<button className="tiny" disabled={running} onClick={()=>{setProgress(0);setRunning(true);}}>{running?'对比中…':'开始对比'}</button><button className="tiny ghost" onClick={()=>{stop();setBenchmark(0);setMetric(0);}}>重置</button></div>
    <p><strong>{current.source}</strong>。所选指标：{metricNames[metric]}，单位 %，范围 0–100。</p>
    <StudyCanvas ariaLabel={`${current.name}的${metricNames[metric]}柱形比较，显示论文表中固定结果`} draw={c=>{
      drawLabel(c,'论文结果',43,39);drawLabel(c,progress===1?'对比完成':'点击开始',888,39,progress===1?palette.green:palette.muted);
      c.strokeStyle=palette.border;c.lineWidth=1;[0,25,50,75,100].forEach(v=>{const y=239-v*1.75;c.beginPath();c.moveTo(72,y);c.lineTo(1013,y);c.stroke();});
      const gap=900/current.names.length;
      current.rows.forEach((row,i)=>{const h=row[metric]*1.75*(1-(1-progress)**3),x=100+i*gap+(gap-106)/2;c.fillStyle=colors[i];c.beginPath();c.roundRect(x,239-h,106,h,6);c.fill();});
    }}/>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${current.names.length},1fr)`,gap:8}}>{current.names.map((name,i)=><div className="metric" style={{borderTop:`4px solid ${colors[i]}`}} key={name}><div className="l">{name}</div><div className="v">{current.rows[i][metric].toFixed(current.decimals)}%</div></div>)}</div>
    <div className="feedback good" role="status">{current.observation}</div>
    <details><summary>实验设置与完整三指标</summary>
      <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',textAlign:'center'}}><thead><tr><th style={{padding:10}}>方法</th>{metricNames.map(m=><th key={m} style={{padding:10}}>{m}（%）</th>)}</tr></thead><tbody>{current.names.map((name,i)=><tr key={name} style={{borderTop:`1px solid ${palette.border}`}}><th scope="row" style={{padding:10}}>{name}</th>{current.rows[i].map((v,j)=><td key={j} style={{padding:10,background:j===metric?'#e8eff7':'transparent'}}>{v.toFixed(current.decimals)}</td>)}</tr>)}</tbody></table></div>
      {benchmark<2?<p>图文分类配置：AdamW，学习率 10⁻³，批量 64，最多 10 轮；图像侧权重阈值 0.85，文本侧 0.2，特征阈值 0.99。KeepLoRA+ 额外使用类别原型。顺序二为 Cars、Food、MNIST、OxfordPet、Flowers、SUN397、Aircraft、Caltech101、DTD、EuroSAT、CIFAR100。</p>:<p>多模态问答配置：LLaVA-1.5-7B，4 张 H100，AdamW，权重阈值 0.6，特征阈值 0.99。五领域学习率为 2×10⁻⁵、最多 3 轮；六任务学习率为 2×10⁻⁴，Flickr 为 10⁻⁴，训练 1 轮。来源：附录 B.4。</p>}
    </details>
  </div>;
}
