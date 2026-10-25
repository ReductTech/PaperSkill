import Icon from './Icon';
import RankVisualizer from './RankVisualizer';
import {rankExperiment} from '../data/rankAllocation';
import {transferBlocked,type useRank} from '../store/rankStore';
export default function BudgetAllocator({state:s,dispatch:d,reduced}:ReturnType<typeof useRank>&{reduced:boolean}){
  const blocked=transferBlocked(s);const last=s.transfers.at(-1);
  return <><div className="rank-budget" aria-label="固定预算"><div><span>总 Rank</span><strong>{s.ranks.reduce((a,b)=>a+b,0)} <small>/ 12</small></strong></div><div><span>支路参数预算</span><strong>{(s.ranks.reduce((a,b)=>a+b,0)*128).toLocaleString('en-US')} <small>/ 1,536</small></strong></div></div>
    <div className="rank-allocation-layout"><div><div className="rank-ledger"><div className="rank-ledger-head"><span>教学位置</span><span>Rank</span><span>支路参数</span></div>{rankExperiment.positions.map((p,i)=><div className="rank-ledger-row" key={p.id}><span><strong>{p.id}</strong>{p.name}<small>同尺寸 · 64 × 64</small></span><span className="rank-ledger-value">{s.ranks[i]}<small>{s.ranks[i]===3?'初始份额':`${s.ranks[i]>3?'+':''}${s.ranks[i]-3}`}</small></span><span className="rank-ledger-count">{(s.ranks[i]*128).toLocaleString('en-US')}</span></div>)}</div>
      <div className="transfer-controls rank-transfer"><label>转出位置<select aria-label="Rank 转出位置" value={s.from} onChange={e=>d({type:'from',value:Number(e.target.value)})}>{rankExperiment.positions.map((p,i)=><option key={p.id} value={i}>{p.id} · {p.name}</option>)}</select></label><Icon name="arrow"/><label>转入位置<select aria-label="Rank 转入位置" value={s.to} onChange={e=>d({type:'to',value:Number(e.target.value)})}>{rankExperiment.positions.map((p,i)=><option key={p.id} value={i}>{p.id} · {p.name}</option>)}</select></label></div>
      <div className="allocator-actions"><button className="primary-button compact" disabled={!!blocked} onClick={()=>d({type:'transfer'})}>转移 1 个 Rank <Icon name="arrow" size={16}/></button><button className="text-button" onClick={()=>d({type:'equal'})}>恢复平均配额</button></div>
      <p className="inline-note transfer-status" role="status">{blocked||`这次交换：${rankExperiment.positions[s.from].id} 减 1，${rankExperiment.positions[s.to].id} 加 1；总量保持不变。`}</p>
    </div><RankVisualizer ranks={s.ranks} reduced={reduced} lastTransfer={last} serial={s.transfers.length}/></div>
    <p className="feedback" aria-live="polite">{last?`已完成 ${s.transfers.length} 次交换。最近一次：${rankExperiment.positions[last.from].id} 的 Rank ${last.before[last.from]} → ${last.after[last.from]}；${rankExperiment.positions[last.to].id} 的 Rank ${last.before[last.to]} → ${last.after[last.to]}。`:'先选择两个不同位置，再实际转移一次。'}<span>这是份额调整记录。模型准确率：未测量。恢复平均配额会保留已尝试的交换记录。</span></p>
  </>;
}
