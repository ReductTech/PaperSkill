import { useState } from 'react';
import { C, Scene, Panel, Chips, Feedback, DataTable, text, line } from './nusa-kit';

const values:Record<string,number[][]>={
  '10':[[74.51,80.25],[73.65,82.15],[65.92,74.47]],
  '20':[[73.84,81.03],[69.58,80.39],[65.74,75.20]],
  '50':[[71.85,80.19],[67.36,79.92],[65.94,75.67]]
};
const names=['NuSA-CL','ZSCL','CLIP'];

export function NusaHorizon() {
  const [steps,setSteps]=useState('50');
  const [metric,setMetric]=useState('last');
  const m=metric==='last'?0:1,rows=values[steps],gap=rows[0][m]-rows[1][m];
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <p>CIFAR-100 类增量实验，CLIP ViT-B/16。任务步数分别为 10、20、50；每步逐批引入新类别。</p>
    <Chips label="类增量步数" value={steps} options={['10','20','50'].map(value=>({value,label:value+' 步'}))} onChange={setSteps}/>
    <Chips label="指标" value={metric} options={[{value:'last',label:'Last'},{value:'avg',label:'Avg'}]} onChange={setMetric}/>
    <Scene label={`CIFAR-100 ${steps} 步类增量的${metric==='last'?'Last':'Avg'}结果`} draw={(ctx)=>{
      line(ctx,100,235,970,235,C.axis);line(ctx,100,40,100,235,C.axis);text(ctx,'准确率 (%)',105,27,18);
      [0,25,50,75,100].forEach(v=>{const y=235-v*1.7;line(ctx,100,y,960,y,C.axis,1);text(ctx,String(v),62,y+5,15,C.muted);});
      rows.forEach((row,i)=>{const x=230+i*250,h=row[m]*1.7;ctx.fillStyle=[C.green,C.blue,C.light][i];ctx.fillRect(x,235-h,115,h);text(ctx,row[m].toFixed(2),x+22,223-h,18);});
    }}/>
    <Panel>{rows.map((row,i)=><span key={names[i]}>{names[i]} {row[m].toFixed(2)}%</span>)}<span>NuSA − ZSCL：{gap>=0?'+':''}{gap.toFixed(2)} pp</span></Panel>
    <Feedback tone={gap>=0?'good':'bad'}>{steps} 步 {metric==='last'?'Last':'Avg'} 中，NuSA-CL 为 {rows[0][m].toFixed(2)}%，ZSCL 为 {rows[1][m].toFixed(2)}%。{gap>=0?`NuSA-CL 高 ${gap.toFixed(2)} 个百分点。`:`NuSA-CL 低 ${(-gap).toFixed(2)} 个百分点。`}</Feedback>
    <DataTable headers={['方法','Last (%)','Avg (%)']} rows={names.map((name,i)=>[name,...rows[i].map(n=>n.toFixed(2))])} caption={`论文 Table 3，CIFAR-100 CIL，${steps} 步`}/>
    <details><summary>长期容量与后续研究</summary><p>Table 11 中，11 个 MTIL 任务后视觉输出投影的平均剩余维数为 313.58，配置秩上限为 128。Table 12 中，50 步 CIFAR-100 CIL 后视觉输出投影的平均 95% 能量秩为 447.67，初始值为 447.42。</p><p>论文讨论了更长任务序列中的容量饱和、对更大模型执行 SVD 的成本，以及任务相关性对空间利用的影响。跟踪各层剩余维数与最小奇异值变化，可以进一步分析尾部容量何时成为学习瓶颈。</p></details>
    <button className="tiny ghost" onClick={()=>{setSteps('50');setMetric('last');}}>重置</button>
  </div>;
}
