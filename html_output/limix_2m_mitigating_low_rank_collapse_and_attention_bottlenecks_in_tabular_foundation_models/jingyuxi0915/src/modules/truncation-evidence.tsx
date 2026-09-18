import { useState } from 'react';
import { Canvas, MetricGuide, Controls, Button, Feedback, Source, Metric, Detail, WidgetFrame, fmt, palette } from './shared';
const records=[{r:5,auc:.7674},{r:10,auc:.8636},{r:20,auc:.8985},{r:30,auc:.9052},{r:40,auc:.9100},{r:50,auc:.9143},{r:75,auc:.9175},{r:100,auc:.9179},{r:192,auc:.9177}];

export function TruncationEvidence() {
  const [index,setIndex]=useState(8);
  const current=records[index];
  const difference=current.auc-records[8].auc;
  return <WidgetFrame id="M03-truncation">
    <Source kind="P" loc="p5 Table1；p3 §3">TabPFN-v2 模块输入的 SVD 截断实验。固定论文记录，不是在线训练。</Source>
    <MetricGuide metric="AUC"/>
    <p>在论文已经测过的 <strong>9 个设置</strong>之间选择。这里的 r 是保留奇异值的个数，与上一模块的教学矩阵相互独立。</p>
    <label style={{display:'block'}}>保留的奇异值个数（论文已测）：<strong>{current.r}</strong><input type="range" aria-label="保留的奇异值个数（论文已测）" aria-valuetext={`r = ${current.r}，AUC ${current.auc.toFixed(4)}`} min={0} max={8} step={1} value={index} onChange={event=>setIndex(Number(event.target.value))} style={{display:'block',width:'100%'}} /></label>
    <p>可选刻度：5、10、20、30、40、50、75、100、192；方向键每次切换一个已测设置。</p>
    <Canvas label="9个论文已报告的r与AUC散点，橙色外圈是当前设置；不对未报告设置插值" height={240} draw={(ctx,w,h)=>{
      const left=w*.09,right=w*.92,top=34,bottom=h-38;
      ctx.strokeStyle=palette.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,top);ctx.lineTo(left,bottom);ctx.lineTo(right,bottom);ctx.stroke();
      ctx.fillStyle=palette.ink;ctx.font='14px sans-serif';ctx.fillText('AUC',left-22,23);
      [0,.5,1].forEach(v=>{const y=bottom-v*(bottom-top);ctx.fillStyle=palette.muted;ctx.fillText(String(v),left-30,y+4);ctx.strokeStyle=palette.line;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();});
      records.forEach((record,i)=>{const x=left+record.r/192*(right-left),y=bottom-record.auc*(bottom-top);ctx.fillStyle=i===index?palette.orange:palette.blue;ctx.beginPath();ctx.arc(x,y,i===index?6:3.5,0,Math.PI*2);ctx.fill();if(i===index){ctx.strokeStyle=palette.ink;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.stroke();}});
      ctx.fillStyle=palette.muted;ctx.fillText('0',left-4,bottom+23);ctx.fillText('192',right-14,bottom+23);
    }} />
    <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}} aria-live="polite"><Metric label="保留个数 r" value={String(current.r)} /><Metric label="论文 AUC（越高越好）" value={current.auc.toFixed(4)} /><Metric label="与 r=192 的 AUC 绝对差" value={`${difference>0?'+':''}${difference.toFixed(4)}`} /></div>
    <p><code>Aᵣ = Σᵢ₌₁ʳ sᵢ uᵢ vᵢᵀ</code>：保留前 r 个奇异分量。网页没有真实隐藏矩阵，不能重新执行该实验。</p>
    <div aria-hidden="true" style={{height:12,borderRadius:6,background:palette.line,overflow:'hidden'}}><div style={{width:`${current.r/192*100}%`,height:'100%',background:palette.orange}} /></div><p>保留数量示意：{current.r}/192；不是实际谱能量比例。</p>
    <Feedback>{index===8?'原设置 r = 192 的 AUC 为 0.9177，用它作差值基准。':difference>0?`r = ${current.r} 报告 AUC ${current.auc.toFixed(4)}，比原设置高 ${fmt(difference,4)}。没有误差区间，不能据此声称显著改善。`:`r = ${current.r} 报告 AUC ${current.auc.toFixed(4)}，比原设置低 ${fmt(-difference,4)}。这支持检查冗余与退化程度，不支持“任意任务都能无损降秩”。`}</Feedback>
    <Controls><Button onClick={()=>setIndex(8)}>重置本模块</Button></Controls>
    <Detail title="全部原表记录与实验范围"><div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><caption>Table1 原值；AUC 使用 0～1 量级</caption><thead><tr><th>r</th><th>AUC ↑</th><th>与192绝对差</th></tr></thead><tbody>{[...records].reverse().map(row=><tr key={row.r} style={{fontWeight:row.r===current.r?700:400}}><td>{row.r}</td><td>{row.auc.toFixed(4)}</td><td>{(row.auc-.9177>0?'+':'')+(row.auc-.9177).toFixed(4)}</td></tr>)}</tbody></table></div><p>论文对 TabPFN-v2 的12层、36个模块输入进行 SVD 干预。r 不是模型参数量，也不是运行速度；这些记录没有给网页中任意 r 或任意数据集一个准确率公式。评估细节和原始隐藏表示不足以在此独立复现；不追加置信区间。</p><Source kind="I + T">差值是原表值的算术计算；短条只示意保留的分量数量。</Source></Detail>
  </WidgetFrame>;
}

