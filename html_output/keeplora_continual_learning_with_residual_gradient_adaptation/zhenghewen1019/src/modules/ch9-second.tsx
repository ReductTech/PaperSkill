import { useState } from 'react';
import { StudyCanvas,palette,drawLabel } from './studio-kit';

const names=['标准 LoRA','固定 A','梯度初始化','仅权重保护','仅旧任务保护','完整 KeepLoRA'];
const rows=[[58.3,61.5,59.4],[63.9,68.2,69.5],[65.0,70.2,75.4],[65.9,71.5,76.5],[68.1,77.2,86.1],[69.0,77.5,86.1]];
const cols=['未见迁移','全程平均','最终表现'];
export function Ch9Second(){
  const [selected,setSelected]=useState(0);
  return <div>
    <div className="chip-row">{names.map((name,i)=><button key={name} className={`chip ${i===selected?'selected':''}`} aria-pressed={i===selected} onClick={()=>setSelected(i)}>{name}</button>)}<button className="tiny ghost" onClick={()=>setSelected(0)}>重置</button></div>
    <StudyCanvas ariaLabel="论文六组消融实验，灰柱为标准低秩适配，蓝柱为当前方案，纵轴固定为零到一百分" draw={c=>{
      drawLabel(c,'标准方案',44,42,palette.muted);drawLabel(c,'当前方案',206,42,palette.blue);
      c.strokeStyle=palette.border;c.lineWidth=1;[0,25,50,75,100].forEach(v=>{const y=236-v*1.7;c.beginPath();c.moveTo(72,y);c.lineTo(1006,y);c.stroke();});
      for(let i=0;i<3;i++){const x=214+i*305;c.fillStyle=palette.light;c.fillRect(x,236-rows[0][i]*1.7,58,rows[0][i]*1.7);c.fillStyle=palette.blue;c.fillRect(x+70,236-rows[selected][i]*1.7,58,rows[selected][i]*1.7);}
    }}/>
    <div className="metrics">{cols.map((col,i)=><div className="metric" key={col}><div className="l">{col}（%）</div><div className="v">{rows[selected][i].toFixed(1)}</div><div>较标准 +{(rows[selected][i]-rows[0][i]).toFixed(1)}</div></div>)}</div>
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',textAlign:'center'}}><caption style={{textAlign:'left',margin:'10px 0'}}>论文表 5 · 分类任务增量 · 指标越高越好</caption><thead><tr><th style={{padding:10}}>方案</th>{cols.map(t=><th key={t} style={{padding:10}}>{t}（%）</th>)}</tr></thead><tbody>{names.map((n,i)=><tr key={n} style={{background:i===selected?'#e8eff7':'transparent',borderTop:`1px solid ${palette.border}`}}><th scope="row" style={{padding:10,fontWeight:i===selected?700:400}}>{n}</th>{rows[i].map((v,j)=><td key={j} style={{padding:10,fontVariantNumeric:'tabular-nums'}}>{v.toFixed(1)}</td>)}</tr>)}</tbody></table></div>
    <div className="feedback good" role="status">{selected===4||selected===5?'仅旧任务保护和完整方案的最终表现同为 86.1%；完整方案的未见迁移从 68.1% 增至 69.0%，全程平均从 77.2% 增至 77.5%。':`当前选择“${names[selected]}”，三项指标为 ${rows[selected].map(v=>v.toFixed(1)).join(' / ')}%。`}</div>
    <p>六组方案使用约 0.98M 的可训练参数预算；标准 LoRA 使用秩 8，固定 A 的方案使用秩 16。“仅权重保护”和“仅旧任务保护”分别启用对应保护项；完整方案同时启用两项。来源：论文表 5。</p>
  </div>;
}
