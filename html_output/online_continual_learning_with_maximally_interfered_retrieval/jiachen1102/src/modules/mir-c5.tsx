import React,{useMemo,useState} from 'react';
import {C,useCanvas,drawInstrument,drawNote,roundRect,arrow,Feedback,MathBlock,Source} from './mir-kit';

const baseScores=[.05,.5,-.2,.3,-.1,.7,.15,-.4,.4,.1,.6,-.05];
function memoryAt(n:number){
 let seed=29;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const memory:number[]=[];let last='尚未收到样本。';
 for(let seen=1;seen<=n;seen++){
  if(seen<=6){memory.push(seen);last='样本 '+seen+' 填入空槽。';}
  else{const j=Math.floor(next()*seen);if(j<6){last='样本 '+seen+' 替换槽 '+j+' 中的样本 '+memory[j]+'。';memory[j]=seen;}else last='抽到 j='+j+'，本次不入库。';}
 }
 const shuffled=memory.slice();
 for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 return {memory,shuffled,last};
}
export function MirC5(){
 const [n,setN]=useState(0),[requestedC,setC]=useState(4),[requestedB,setB]=useState(2),[negative,setNegative]=useState(false);
 const run=useMemo(()=>memoryAt(n),[n]);
 const candidateCount=Math.min(requestedC,run.memory.length),budget=Math.min(requestedB,candidateCount);
 const score=(id:number)=>negative?-Math.abs(baseScores[id-1])-.05:baseScores[id-1];
 const candidates=run.shuffled.slice(0,candidateCount);
 const selected=candidates.slice().sort((a,b)=>score(b)-score(a)||a-b).slice(0,budget);
 const ref=useCanvas(ctx=>{
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);
  drawInstrument(ctx,155,142,.75,[0,1,2].map(i=>selected[i]?Math.min(1,Math.abs(score(selected[i]))):0));
  run.memory.forEach((id,i)=>{const x=385+i*103;drawNote(ctx,x,82,77,105,Math.abs(score(id)),selected.includes(id)?C.green:candidates.includes(id)?C.blue:C.env);if(selected.includes(id))roundRect(ctx,x-4,78,85,113,8,'transparent',C.green);});
  arrow(ctx,300,140,365,140,C.muted);
  ctx.font='18px sans-serif';ctx.fillStyle=C.ink;ctx.fillText('固定记忆',385,42);ctx.fillText('候选再筛选',785,42);
 },[n,requestedC,requestedB,negative]);
 return <div className="mir-widget" data-widget="mir-c5">
  <canvas ref={ref} className="mir-canvas" aria-label={'固定六个记忆槽，候选 '+candidates.join('、')+'；实际检索 '+selected.join('、')} />
  <div className="mir-controls">
   <button onClick={()=>setN(v=>Math.min(12,v+1))} disabled={n===12}>下一张参考卡</button><button onClick={()=>setN(0)} disabled={!n}>重置水库</button>
   <label>请求候选数 C <select aria-label="请求候选数 C" value={requestedC} onChange={e=>setC(Number(e.target.value))} disabled={!n}>{[2,4,6].map(v=><option key={v}>{v}</option>)}</select></label>
   <label>请求回放数 B <select aria-label="请求回放数 B" value={requestedB} onChange={e=>setB(Number(e.target.value))} disabled={!n}>{[1,2].map(v=><option key={v}>{v}</option>)}</select></label>
   <button aria-pressed={negative} onClick={()=>setNegative(v=>!v)}>全为负分</button>
  </div>
  <Feedback tone={!n?'blue':negative?'purple':'green'}>已见 n={n}，容量 K=6；实际 C={candidateCount}、B={budget}。{run.last} {n?'选中样本 '+selected.join('、')+'；分数 '+selected.map(id=>score(id).toFixed(2)).join('、')+'。':'空库只学习当前数据。'}{negative&&n>0?'原始 Top-B 仍选择较大的负值，不会自动变成“只回放正干扰”。':''}</Feedback>
  <div className="mir-prose">
   <p>右侧六个槽位属于同一个乐谱参考册：浅色未被抽为候选，蓝色为候选，绿色为候选中本轮选中的参考卡；从左到右与下表槽位一致。这里用固定种子的采样路径与预设损失增量解释机制，不执行分类训练。改变 C 不会修改水库里“存了谁”，只改变本轮检查多少候选。</p>
   <div className="mir-table-wrap"><table><caption>当前水库、候选与检索；教学分数</caption><thead><tr><th>槽位</th><th>样本 ID</th><th>干扰增量</th><th>本轮候选</th><th>检索结果</th></tr></thead><tbody>{run.memory.map((id,i)=><tr key={i}><td>{i}</td><td>{id}</td><td>{score(id).toFixed(2)}</td><td>{candidates.includes(id)?'是':'否'}</td><td>{selected.includes(id)?'回放':'不回放'}</td></tr>)}</tbody></table></div>
   <h3>存储策略和检索策略是两个独立环节</h3>
   <p>Reservoir Sampling（水库采样）负责决定历史流里哪些到达项留下，MIR 负责决定本轮从留下的记忆中回放谁。记全局容量 K、当前水库集合 𝓜、候选数量 C、最终回放数 B。论文实验表里的 M 则表示每类允许的记忆数，不能把 M=50 直接解释成全库只有 50 张图。</p>
   <MathBlock title="原文 §3.1 的两级检索"><p>候选集合 𝓒∼UniformSubset(𝓜,min(C,|𝓜|))；检索集合 𝓡=Top-Bᵢ∈𝓒 sᵢ，按干扰分数降序。</p><p>非空时 1≤B≤C≤|𝓜|；缓存尚小时按实际长度缩小 C、B。空库时不做排名或旧回放。</p></MathBlock>
   <p>先随机抽较大的候选池，再选受干扰最大的 B 项，可以控制搜索成本，也可能缓和始终挑相似样本的问题。但这只是促进多样性的启发式，不保证每类均衡、样本彼此不同或拿到全水库的真正 Top-B。若关键旧样本没有进入候选池，后续打分无法把它找回来。</p>
   <h3>水库为什么让历史到达项有相同保留概率？</h3>
   <p>令 n 包含本次刚到达的样本。n≤K 时依次填空位；n&gt;K 时均匀抽整数 j∈{'{0,…,n−1}'}，只有 j&lt;K 才用新样本替换槽位 j。无需预先知道数据流长度。</p>
   <MathBlock title="归纳证明 K/n"><p>基例 n=K：每项保留概率 1=K/K。对于 n&gt;K，新样本在 K 个可替换索引中被抽中时入库，概率 K/n。</p><p>假设任一旧项在第 n−1 步保留概率为 K/(n−1)。给定它仍在库中，它占某一个槽位，n 种 j 里恰好一种会替换它，条件存活概率 1−1/n。因此它在第 n 步的保留概率为 [K/(n−1)](1−1/n)=K/n。</p></MathBlock>
   <p>这个结论是历史到达项的边际概率相同，不是每类恰好 K/Q 个，也不是最近项更优先。类别不平衡的流仍可能让少数类缺席；对概念漂移，历史均匀本身也未必最适合近期预测。界面只有一条固定种子路径，不能用它代替概率证明。</p>
   <h3>计算预算怎样随候选数变化？</h3>
   <p>新批次先计算一次梯度构造虚拟参数。候选需要在 θ 与 θᵥ 下分别前向并计算逐样本损失，约检查 2C 个候选样本前向，再进行排名，完整排序为 O(C log C)，Top-B 也可使用部分选择。正式训练还需要对选中的 B 个旧样本重新前向和反向；候选阶段不必逐一计算、存储 p 维旧样本梯度。</p>
   <p>增大 C 提高检查覆盖，也增加评分时间；增大 B 则增加正式回放计算。二者与 K 的存储成本不同，不能用同一个“记忆大小”含糊代替。在固定内存之外，公平实验还需控制实际候选前向次数、回放次数与墙钟预算。</p>
   <details><summary>插入计数与边界的最小伪代码</summary><pre><code>{'def admit(memory, item, seen, capacity, rng):\n    # seen 是本次之前的样本数\n    if seen < capacity:\n        memory.append(item)\n    else:\n        j = rng.randrange(seen + 1)\n        if j < capacity:\n            memory[j] = item\n    return seen + 1\n\n# 对 batch 中每一项调用；检索应在当前 batch 写入之前完成。'}</code></pre></details>
   <Source>正文第 3–5 页 §3.1 与 Algorithm 1：水库存储、随机候选 C、回放预算 B；概率证明与固定数值演示为教程展开。</Source>
  </div>
 </div>;
}
