import React, { useState } from 'react';
import { S, Slider, Mixer, Speaker, Record, Feedback, fmt, useTween } from './le-kit';
import './le.css';
import './early.css';

const blue='#27446e', orange='#f07e47', green='#228d5c';
const number=(n:number)=>n.toLocaleString('en-US');
function Reset({onClick}:{onClick:()=>void}) { return <button type="button" className="le-btn le-early-reset" onClick={onClick}>重置</button>; }
function FormulaBase() { return <><S meaning="W：合并后的权重矩阵，形状为 m×n。">W</S> = <S meaning="W₀：冻结的预训练权重，形状 m×n。">W₀</S> + (<S meaning="α：适配器的缩放超参数。">α</S>/<S meaning="r：适配器的秩。">r</S>) <S meaning="B：可训练矩阵，形状 m×r。">B</S><S meaning="A：可训练矩阵，形状 r×n。">A</S></>; }

export function LeBudget() {
 const [rank,setRank]=useState(8); const p=1536*rank,ratio=p/589824*100;
 const animated=useTween(rank/64);
 return <div className="le-page le-early-budget">
  <div className="le-early-budget-studio">
   <div className="le-heading">冻结主干，增加适配通道</div>
   <div className="le-early-budget-mixer"><Mixer levels={Array.from({length:8},(_,i)=>6*Math.max(0,Math.min(1,animated*8-i)))} active={Math.min(7,Math.floor(rank/8))}/></div>
   <Slider label="适配秩 r" value={rank} min={1} max={64} step={1} onChange={setRank}/>
   <div className="le-early-budget-caption">单个 768 × 768 权重矩阵</div>
  </div>
  <div className="le-early-budget-math">
   <div className="le-equation"><FormulaBase/></div>
   <div className="le-early-factor-row">
    <div><S meaning="B：768 行、r 列的可训练矩阵。">B</S><strong>768 × {rank}</strong></div>
    <span>×</span>
    <div><S meaning="A：r 行、768 列的可训练矩阵。">A</S><strong>{rank} × 768</strong></div>
   </div>
   <div className="le-early-param"><span>全参数微调</span><b>{number(589824)}</b></div>
   <div className="le-early-param le-early-param-lora"><span>低秩适配</span><b>{number(p)}</b></div>
   <div className="le-early-budget-ratio"><div style={{width:`${ratio}%`}}/></div>
   <div className="le-value">{fmt(ratio)}%</div>
   <div>可训练参数占原矩阵参数的比例</div>
  </div>
  <div className="le-early-budget-end"><Feedback tone="blue">秩 {rank} 时，两个因子共有 {number(p)} 个参数；低秩约束作用于新增的权重更新。</Feedback><Reset onClick={()=>setRank(8)}/></div>
 </div>;
}

const tasks=['MNLI','SST-2','QQP','WinoGrande','SIQA','FEVER'];
const taskChinese=['文本蕴含','情感分类','重复问题','常识指代','社会常识','事实核验'];
const full=[87.45,94.38,91.52,65.82,64.99,68.92],lora=[87.04,94.72,90.93,63.46,66.07,69.28];
export function LeMatched() {
 const [task,setTask]=useState(0); const delta=lora[task]-full[task];
 return <div className="le-page le-early-matched">
  <div className="le-early-scorebook">
   <div className="le-early-score-art"><Record count={2}/></div>
   <div className="le-early-task-choices">{tasks.map((name,i)=><button type="button" key={name} className={`le-btn ${i===task?'is-selected':''}`} aria-pressed={task===i} onClick={()=>setTask(i)}>{name}</button>)}</div>
  </div>
  <div className="le-early-score-chart">
   <div className="le-early-chart-title"><strong>{tasks[task]} · {taskChinese[task]}</strong><span>准确率（%）↑</span></div>
   <div className="le-early-score-bars">
    {[{name:'全参数微调',value:full[task],color:blue},{name:'低秩适配 · r = 8',value:lora[task],color:orange}].map(row=><div className="le-early-score-row" key={row.name}><div className="le-early-score-label">{row.name}<strong>{fmt(row.value)}%</strong></div><div className="le-early-score-track"><div style={{width:`${row.value}%`,background:row.color}}/></div></div>)}
    <div className="le-early-score-axis">{[0,20,40,60,80,100].map(n=><span key={n}>{n}</span>)}</div>
   </div>
   <div className="le-early-score-delta"><span>低秩适配 − 全参数微调</span><b>{delta>0?'+':''}{fmt(delta)} 个百分点</b></div>
   <div className="le-early-score-source">论文表 2 · RoBERTa-base · α = 2r</div>
  </div>
  <div className="le-early-matched-end"><Feedback>相近的任务分数之后，还要比较权重方向与预训练知识的保持。</Feedback><Reset onClick={()=>setTask(0)}/></div>
 </div>;
}

export function LeSpectrum() {
 const [theta,setTheta]=useState(0),[sigma,setSigma]=useState(2);
 const radians=theta*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians),y=[sigma*c-.5*s,sigma*s+.5*c];
 const a=useTween(theta),gain=useTween(sigma),ac=Math.cos(a*Math.PI/180),as=Math.sin(a*Math.PI/180);
 const px=390+60*(gain*ac-.5*as),py=220-60*(gain*as+.5*ac);
 return <div className="le-page le-early-spectrum">
  <div className="le-early-spectrum-main">
   <div className="le-early-pan">
    <div className="le-heading">声像方向与分量强度</div>
    <div className="le-early-pan-instrument">
     <svg viewBox="0 0 430 250" aria-label={`方向${theta}度，第一分量强度${sigma}`} role="img"><rect x="15" y="20" width="400" height="215" rx="35" fill="#e5ded2" stroke="#b99c79" strokeWidth="5"/><circle cx="130" cy="125" r="73" fill="#faf8f3" stroke={blue} strokeWidth="7"/><g transform={`rotate(${-90+a} 130 125)`}><line x1="130" y1="125" x2="185" y2="125" stroke={orange} strokeWidth="12" strokeLinecap="round"/></g><line x1="315" y1="55" x2="315" y2="202" stroke="#a4a8ab" strokeWidth="7"/><rect x="282" y={194-(gain-1)/2*140-14} width="66" height="28" rx="7" fill={orange} stroke={blue} strokeWidth="3"/></svg>
    </div>
    <div className="le-early-example-label">二维教学例子</div>
    <div className="le-early-spectrum-input"><S meaning="x：输入向量，形状2×1。">x</S> = [1, 0.5]ᵀ</div>
    <p><S meaning="V：右奇异方向矩阵；此例固定为2×2单位矩阵。">V</S> = I，第二分量强度固定为 1。</p>
   </div>
   <div className="le-early-transform-plot">
    <svg viewBox="0 0 780 420" role="img" aria-label={`变换后向量为${fmt(y[0])},${fmt(y[1])}`}><defs><marker id="le-spectrum-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill={blue}/></marker></defs><path d="M80 220H720M390 405V25" stroke="#b5c0cd" strokeWidth="3"/><circle cx="390" cy="220" r="60" fill="none" stroke="#d7deea" strokeWidth="2" strokeDasharray="8 8"/><ellipse cx="390" cy="220" rx={60*gain} ry="60" transform={`rotate(${-a} 390 220)`} fill="#27446e0c" stroke={blue} strokeWidth="3"/><path d="M390 220L450 190" stroke="#a4afbe" strokeWidth="4" strokeDasharray="8 8"/><line x1="390" y1="220" x2={px} y2={py} stroke={blue} strokeWidth="7" markerEnd="url(#le-spectrum-arrow)"/><circle cx={px} cy={py} r="9" fill={orange}/></svg>
    <div className="le-early-coordinate-x">第二维 = {fmt(y[1])}</div><div className="le-early-coordinate-y">第一维 = {fmt(y[0])}</div>
    <div className="le-early-spectrum-result"><S meaning="y：输出向量，等于权重矩阵乘输入向量。">y</S> = [{fmt(y[0])}, {fmt(y[1])}]ᵀ</div>
   </div>
  </div>
  <div className="le-early-spectrum-controls"><Slider label="方向 θ" value={theta} min={0} max={90} step={1} unit="°" onChange={setTheta}/><Slider label="第一分量强度 σ₁" value={sigma} min={1} max={3} step={.1} onChange={setSigma}/><Reset onClick={()=>{setTheta(0);setSigma(2)}}/></div>
  <div className="le-early-spectrum-formula"><S meaning="W：2×2教学权重矩阵。">W</S> = <S meaning="R(θ)：旋转θ角的2×2矩阵，此例等于左奇异方向U。">R(θ)</S> <S meaning="diag(σ₁,1)：2×2对角矩阵，分别缩放两个分量。">diag(σ₁, 1)</S> <span>先缩放，再旋转；输出由同一个矩阵计算。</span></div>
 </div>;
}

const hadamard=[[.5,.5,.5,.5],[.5,-.5,.5,-.5],[.5,.5,-.5,-.5],[.5,-.5,-.5,.5]];
const permutation=[[0,0,-1,0],[-1,0,0,0],[0,0,0,1],[0,1,0,0]];
export function LeDetect() {
 const [mode,setMode]=useState<'mix'|'perm'>('mix'),[epsilon,setEpsilon]=useState(.6),[k,setK]=useState(2),[selected,setSelected]=useState(0);
 const matrix=mode==='mix'?hadamard:permutation;
 const maxima=matrix[0].map((_,j)=>Math.max(...matrix.map(row=>Math.abs(row[j]))));
 const count=maxima.slice(0,k).filter(v=>v<epsilon-1e-10).length;
 const intruder=maxima[selected]<epsilon-1e-10;
 return <div className="le-page le-early-detect">
  <div className="le-early-detect-top">
   <div className="le-early-match-table">
    <div className="le-early-match-caption">原始参考方向 × 微调后方向</div>
    <div className="le-early-match-grid"><div/>{[0,1,2,3].map(j=><button className={`le-btn ${selected===j?'is-selected':''}`} type="button" key={`h${j}`} onClick={()=>setSelected(j)} aria-pressed={selected===j}>u{j+1}</button>)}{matrix.map((row,i)=><React.Fragment key={i}><span className="le-early-match-label">e{i+1}</span>{row.map((v,j)=><button type="button" aria-label={`原始方向${i+1}与微调方向${j+1}绝对相似度${Math.abs(v)}`} key={`${i}-${j}`} onClick={()=>setSelected(j)} className={`le-early-match-cell ${j===selected?'is-column':''} ${j>=k?'is-outside':''}`} style={{background:Math.abs(v)===1?'#27446e':Math.abs(v)===0?'#f0f2f4':'#afc0d4',color:Math.abs(v)===1?'white':blue}}>{Math.abs(v).toFixed(1)}</button>)}</React.Fragment>)}</div>
    <div className="le-early-max-row"><span>最大值</span>{maxima.map((v,j)=><strong className={j===selected?'is-column':''} key={j}>{v.toFixed(1)}</strong>)}</div>
    <div className="le-early-match-caption">4 个参考方向全部参与比较</div>
   </div>
   <div className="le-early-detector">
    <div className="le-early-detect-modes"><button type="button" className={`le-btn ${mode==='mix'?'is-selected':''}`} onClick={()=>setMode('mix')} aria-pressed={mode==='mix'}>混合方向</button><button type="button" className={`le-btn ${mode==='perm'?'is-selected':''}`} onClick={()=>setMode('perm')} aria-pressed={mode==='perm'}>排列与符号翻转</button></div>
    <div className="le-early-detection-rule"><S meaning="sⱼ：第j个微调后左奇异向量，与全部原始左奇异向量的最大绝对内积。">sⱼ</S> = <S meaning="maxᵢ：遍历全部原始参考方向，取最大匹配。">maxᵢ</S> |<S meaning="uᵢ⁰：原模型的第i条单位左奇异向量，此例为标准基eᵢ。">uᵢ⁰</S>ᵀ<S meaning="uⱼ：微调后按奇异值排序的第j条单位左奇异向量。">uⱼ</S>|</div>
    <div className="le-early-selected-match">所选方向 u{selected+1}：<strong>{maxima[selected].toFixed(1)} {intruder?'<':'≥'} {fmt(epsilon)}</strong></div>
    <div className={`le-early-classification ${intruder?'is-intruder':''}`}>{intruder?'满足入侵阈值':'保留原方向匹配'}{selected>=k?'，但超出本次前 k 项':''}</div>
    <div className="le-early-intruder-total"><span>前 {k} 项的入侵数量</span><strong>{count}</strong></div>
    <div className="le-early-detect-tape"><Record count={count}/><span>四维教学基；按绝对相似度识别。</span></div>
   </div>
  </div>
  <div className="le-early-detect-controls"><Slider label="相似度阈值 ε" value={epsilon} min={.2} max={1} step={.05} onChange={setEpsilon}/><Slider label="检查前 k 个方向" value={k} min={1} max={4} step={1} onChange={setK}/><Reset onClick={()=>{setMode('mix');setEpsilon(.6);setK(2);setSelected(0)}}/></div>
  <Feedback tone={count?'orange':'blue'}>{mode==='mix'?`每列最大匹配均为 0.5；严格低于 ${fmt(epsilon)} 的前 ${k} 项共有 ${count} 个。`:'方向顺序和正负号变化后，最大绝对匹配仍为 1，入侵数量为 0。'}</Feedback>
 </div>;
}

export function LeDimension() {
 const [n,setN]=useState(4),coefficient=1/Math.sqrt(n),intruder=coefficient<.5;
 const smooth=useTween(coefficient);
 return <div className="le-page le-early-dimension">
  <div className="le-early-dimension-copy"><div className="le-heading">总能量相同，分散到更多坐标</div><div className="le-early-dimension-formula"><S meaning="v：n维单位向量，每个坐标相同。">v</S> = (<S meaning="1/√n：均匀单位向量的每个坐标值。">1/√n</S>)[1, …, 1]ᵀ</div><p>每一条标准基只取出一个坐标。所有坐标仍共同组成这个向量。</p></div>
  <div className="le-early-dimension-choices">{[2,4,16,64].map(value=><button type="button" key={value} className={`le-btn ${n===value?'is-selected':''}`} aria-pressed={n===value} onClick={()=>setN(value)}>{value} 维</button>)}<Reset onClick={()=>setN(4)}/></div>
  <div className="le-early-dimension-plot"><div className="le-early-coefficient-bars" role="img" aria-label={`${n}个分量，每个为${coefficient}，平方和为1`}>{Array.from({length:n},(_,i)=><div className="le-early-coefficient-track" key={i}><span style={{height:`${smooth*100}%`}}/></div>)}</div><div className="le-early-dimension-axis"><span>每个分量：{fmt(coefficient,3)}</span><span>共 {n} 个坐标</span></div></div>
  <div className="le-early-dimension-studio"><div className="le-early-energy-speaker"><Speaker level={1}/></div><div className="le-early-energy-value"><strong>1</strong><span>总平方和</span></div><div className="le-early-energy-formula"><S meaning="n：向量维数，同时是相同分量的数量。">n</S> × (<S meaning="1/√n：每个分量的幅度；平方后为每个分量的能量占比。">1/√n</S>)² = 1</div></div>
  <div className="le-early-dimension-end"><div><S meaning="maxᵢ |eᵢᵀv|：与全部标准基比较的最大绝对余弦相似度，等于1/√n。">最大相似度</S><strong>{fmt(coefficient,3)}</strong></div><Feedback tone={intruder?'orange':'blue'}>阈值 ε = 0.5：{intruder?'满足严格小于条件。':n===4?'等于阈值，不计为入侵。':'高于阈值，不计为入侵。'} 各方向的匹配会随维数变化。</Feedback></div>
 </div>;
}
