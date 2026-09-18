import {useState} from 'react';
import {Hint,Term} from './lab-ui';

// Orthogonal directions make every retained term and residual exactly inspectable.
const basis = [[1,1,1,1],[1,-1,1,-1],[1,1,-1,-1],[1,-1,-1,1]].map(row=>row.map(x=>x/2));
const presets = [
  {name:'重复结构', values:[4,0,0,0], note:'四行相同，只有一个独立方向。保留一项就能完整表达。'},
  {name:'两个方向', values:[4,2,0,0], note:'第二个方向增加了交替变化。只保留一项会漏掉这部分。'},
  {name:'四个方向', values:[4,2,1,.5], note:'每个方向都携带不同细节。逐项加入，观察哪些位置发生变化。'},
];
const valueAt=(values:number[],r:number,i:number,j:number)=>values.slice(0,r).reduce((sum,v,k)=>sum+basis[k][i]*v*basis[k][j],0);
const show=(value:number)=>Number(value.toFixed(3)).toString();

export function RankWorkbench(){
  const [preset,setPreset]=useState(2),[rank,setRank]=useState(1),[cell,setCell]=useState([0,0]);
  const values=presets[preset].values,[i,j]=cell;
  const error=Math.sqrt(values.slice(rank).reduce((s,v)=>s+v*v,0)/values.reduce((s,v)=>s+v*v,0));
  const stored=8*rank;
  const grid=(approx:boolean)=><div role="group" aria-label={approx?'低秩重建矩阵':'目标矩阵'} style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>{Array.from({length:16},(_,n)=>{const row=Math.floor(n/4),col=n%4,v=valueAt(values,approx?rank:4,row,col),selected=i===row&&j===col;return <button key={n} aria-label={`${approx?'重建':'目标'}第 ${row+1} 行第 ${col+1} 列：${show(v)}`} aria-pressed={selected} onClick={()=>setCell([row,col])} style={{padding:'13px 3px',fontVariantNumeric:'tabular-nums',background:selected?'#27446e':`rgba(66,114,165,${.06+Math.abs(v)/2*.4})`,color:selected?'white':'#27446e',borderColor:selected?'#27446e':'#ccdaeb',transition:'background .25s,color .25s'}}>{show(v)}</button>})}</div>;
  return <section data-experiment-state={JSON.stringify({实验:"低秩矩阵教学",保留方向:rank,目标结构:presets[preset].name,所选格子:[i+1,j+1],重建值:valueAt(values,rank,i,j),相对误差:error,实测:false})} className="lab-card rank-workbench" style={{marginTop:20,background:'#f7faff'}} aria-label="低秩矩阵动手实验">
    <span className="lab-eyebrow">动手拆矩阵 · 基础原理实验</span><h3 style={{margin:'7px 0'}}>保留多少个方向，才能还原这块图案？</h3>
    <p>这里用一个 4×4 小矩阵作修正量。每次增加一个方向，就是给 A 增加一列、给 B 增加一行；右边的结果由 A×B 重新计算。<Term name="秩与方向数" definition="矩阵的秩描述其中独立方向的数量；这里的 r 决定允许保留多少项。" detail="把 r 调大，会增加因子的存储量。若新增方向的系数为零，实际矩阵秩与重建结果不会改变。这个 4×4 实验帮助理解容量与成本，下方论文的 E/H 秩消融是另一组真实训练实验。"/></p>
    <div className="ctrl">{presets.map((p,n)=><Hint key={p.name} text={p.note}><button aria-pressed={preset===n} onClick={()=>setPreset(n)}>{p.name}</button></Hint>)}<button onClick={()=>{setPreset(2);setRank(1);setCell([0,0]);}}>重置矩阵实验</button></div>
    <label>保留的方向 r = {rank}<input aria-label="保留矩阵方向数" type="range" min={1} max={4} value={rank} onChange={e=>setRank(Number(e.target.value))}/></label>
    <div className="lab-grid"><div><strong>目标 · 4×4</strong>{grid(false)}</div><div><strong>重建 · A(4×{rank}) × B({rank}×4)</strong>{grid(true)}</div></div>
    <p className="lab-note">点击任意格子，下面会拆开这个位置的乘加过程。颜色深浅表示数值大小，不是识别准确率。</p>
    <div className="lab-grid"><div><div className="lab-note">重建相对误差 ‖目标−重建‖F / ‖目标‖F</div><output className="lab-metric" data-testid="matrix-error">{(error*100).toFixed(1)}%</output></div><div><div className="lab-note">两个因子保存的数 / 直接保存</div><output className="lab-metric" data-testid="matrix-storage">{stored} / 16</output></div></div>
    <div className="feedback" aria-live="polite">{error<1e-10?'这块目标已完整还原。继续增加零贡献方向，不会进一步降低误差。':`仍缺 ${values.slice(rank).filter(v=>v!==0).length} 个有效方向。增加 r 可以恢复更多细节。`} {stored<16?'当前因子表示更省。':stored===16?'这里已不节省存储：两个因子的数目与原矩阵相同。':'这里因子表示反而更大：低秩分解不是无条件节省参数。'}</div>
    <div className="lab-card" style={{marginTop:14}}><strong>追踪第 {i+1} 行、第 {j+1} 列</strong><div style={{display:'flex',flexWrap:'wrap',gap:8,alignItems:'center'}}>{values.slice(0,rank).map((v,k)=><span className="lab-token" key={k}>{k>0?'+ ':''}({show(basis[k][i]*v)}) × ({show(basis[k][j])})</span>)}<span>= <output data-testid="matrix-cell-result">{show(valueAt(values,rank,i,j))}</output></span></div><p className="lab-note">分别取 A 的第 {i+1} 行与 B 的第 {j+1} 列，对应相乘再相加；目标值为 {show(valueAt(values,4,i,j))}。</p></div>
    <p className="lab-note">这是正交方向构造的线性代数实验，不是 MiniMind-O 权重或训练结果。误差是矩阵重建误差，不是 audio loss；r=1…4 也不是论文的秩消融配置。F 表示 Frobenius 范数，即所有元素平方和的平方根。</p>
  </section>;
}
