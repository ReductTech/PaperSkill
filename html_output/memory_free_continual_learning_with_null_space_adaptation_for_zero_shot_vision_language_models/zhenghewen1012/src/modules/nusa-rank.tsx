import { useState } from 'react';
import { C, Scene, Panel, Chips, Feedback, DataTable, text, line, dot } from './nusa-kit';

const ranks=[32,64,128,196,256];
const series:Record<string,number[][]>={tail:[[1.46,78.05],[1.91,81.99],[2.57,85.22],[3.85,86.46],[5.11,87.34]],top:[[3.30,79.66],[3.69,82.96],[4.44,85.50],[4.65,86.76],[5.36,87.46]],random:[[2.08,78.70],[3.08,82.77],[4.57,85.49],[6.15,86.67],[6.23,87.44]]};
const names:Record<string,string>={tail:'尾部',top:'顶部',random:'随机'};

export function NusaRank() {
  const [rankIndex,setRankIndex]=useState(2);
  const [space,setSpace]=useState('tail');
  const current=series[space][rankIndex], top=series.top[rankIndex];
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <label style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>更新秩 r = <strong>{ranks[rankIndex]}</strong><input aria-label="更新秩" type="range" min={0} max={4} step={1} value={rankIndex} onChange={event=>setRankIndex(Number(event.target.value))} style={{width:350,minHeight:44}}/><span>32 / 64 / 128 / 196 / 256</span></label>
    <Chips label="子空间" value={space} options={Object.entries(names).map(([value,label])=>({value,label}))} onChange={setSpace}/>
    <Scene label="论文表10离散实测点：遗忘率和目标任务准确率，切换更新秩和子空间" draw={(ctx)=>{
      const colors:Record<string,string>={tail:C.green,top:C.blue,random:C.purple};
      [0,1].forEach(metric=>{
        const x0=metric===0?75:605, y0=235, span=375;
        line(ctx,x0,45,x0,y0,C.axis);line(ctx,x0,y0,x0+span,y0,C.axis);
        text(ctx,metric===0?'遗忘率 ↓':'目标精度 ↑',x0,28,18);
        [0,1,2,3,4].forEach(i=>{const x=x0+span*i/4;text(ctx,String(ranks[i]),x-14,262,15,C.muted);});
        Object.keys(series).forEach(key=>{const data=series[key];ctx.beginPath();ctx.strokeStyle=colors[key];ctx.lineWidth=key===space?3:1.5;ctx.globalAlpha=key===space?1:.35;data.forEach((pair,i)=>{const x=x0+i*span/4,y=y0-(metric===0?pair[0]/7:(pair[1]-70)/20)*175;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();ctx.globalAlpha=1;data.forEach((pair,i)=>{const x=x0+i*span/4,y=y0-(metric===0?pair[0]/7:(pair[1]-70)/20)*175;dot(ctx,x,y,key===space&&i===rankIndex?8:3,colors[key]);if(key===space&&i===rankIndex){ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,13,0,Math.PI*2);ctx.stroke();text(ctx,pair[metric].toFixed(2),x-20,y-20,17,colors[key]);}});});
        text(ctx,metric===0?'0':'70',x0-25,y0+5,14,C.muted);text(ctx,metric===0?'7':'90',x0-25,60,14,C.muted);
      });
    }}/>
    <Panel><span>{names[space]} · r = {ranks[rankIndex]}</span><span>遗忘率 {current[0].toFixed(2)}%</span><span>目标精度 {current[1].toFixed(2)}%</span><span>相对顶部遗忘 {(current[0]-top[0]).toFixed(2)} pp</span></Panel>
    <Feedback tone={space==='tail'?'good':''}>{names[space]}空间在 r = {ranks[rankIndex]} 时，遗忘率为 {current[0].toFixed(2)}%，目标准确率为 {current[1].toFixed(2)}%。{space==='tail'?`相对同秩顶部，遗忘减少 ${(top[0]-current[0]).toFixed(2)} 个百分点，目标准确率低 ${(top[1]-current[1]).toFixed(2)} 个百分点。`:`同秩尾部的遗忘率为 ${series.tail[rankIndex][0].toFixed(2)}%。`}</Feedback>
    <DataTable headers={['空间','遗忘率 (%) ↓','目标准确率 (%) ↑']} rows={Object.keys(series).map(key=>[names[key],series[key][rankIndex][0].toFixed(2),series[key][rankIndex][1].toFixed(2)])} caption={`论文 Table 10，更新秩 r = ${ranks[rankIndex]}`}/>
    <details><summary>比较全部五个秩</summary><DataTable headers={['r','尾部：遗忘 / 目标','顶部：遗忘 / 目标','随机：遗忘 / 目标']} rows={ranks.map((rank,i)=>[rank,...Object.keys(series).map(key=>series[key][i].map(n=>n.toFixed(2)).join(' / '))])} caption="论文 Table 10，所有数值单位为 %"/><p>尾部空间从 r = 32 增至 256，目标准确率由 78.05% 增至 87.34%，遗忘率由 1.46% 增至 5.11%。扩大更新空间增加了新任务适应能力，也提高了旧任务遗忘。</p></details>
    <button className="tiny ghost" onClick={()=>{setRankIndex(2);setSpace('tail');}}>重置</button>
  </div>;
}
