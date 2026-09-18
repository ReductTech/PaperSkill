import {useState} from 'react';

type Props={task:'t2a'|'i2t'|'a2a';mode:'all'|'projector'};
type Weights={a:number;b:number};
const fmt=(n:number)=>n.toFixed(3);
const calculate=({a,b}:Weights,x:number)=>{const mid=a*x,y=b*mid,error=y-3;return {mid,y,error,loss:error*error/2,da:error*b*x,db:error*a*x};};

export function GradientWorkbench({task,mode}:Props){
  const [weights,setWeights]=useState<Weights>({a:1,b:2}),[before,setBefore]=useState<Weights>({a:1,b:2});
  const [phase,setPhase]=useState(0),[round,setRound]=useState(0),[x,setX]=useState(1),[rate,setRate]=useState(.1);
  const frozen=mode==='projector';
  const names=task==='t2a'?['Thinker','Talker']:task==='i2t'?['vision projector','Thinker']:['audio projector','后续 Thinker / Talker'];
  const old=phase===4?before:weights,s=calculate(old,x),after=calculate(weights,x);
  const oneStep=(freeze:boolean)=>calculate({a:old.a-rate*s.da,b:freeze?old.b:old.b-rate*s.db},x);
  const phases=['准备一条样本','前向：计算预测','损失：与目标比较','反向：传递导数','更新：改变允许训练的参数'];
  const reset=()=>{setWeights({a:1,b:2});setBefore({a:1,b:2});setPhase(0);setRound(0);};
  const advance=()=>{if(phase===3){setBefore(weights);setWeights({a:weights.a-rate*s.da,b:frozen?weights.b:weights.b-rate*s.db});setRound(n=>n+1);setPhase(4);}else setPhase(phase===4?1:phase+1);};
  return <section data-experiment-state={JSON.stringify({实验:"标量训练教学",任务:task,模式:mode,阶段:phase,输入:x,学习率:rate,当前参数:weights,已更新:round,实测:false})} className="lab-card gradient-workbench" style={{marginTop:20,background:'#f7faff'}} aria-label="一次训练的数值实验">
    <style>{`.gradient-layout{display:grid;grid-template-columns:1fr 1.05fr;gap:16px;align-items:start}.gradient-detail{height:400px;overflow:auto;overscroll-behavior:contain}.gradient-layout .lab-card{padding:12px}.gradient-layout .lab-metric{font-size:20px}.gradient-wire{display:flex;align-items:center;justify-content:center;color:#a5b6cc;font-size:25px}.gradient-wire.on{color:#258162;animation:gradientPulse 1.1s ease-in-out infinite alternate}.gradient-wire.on.back{color:#8761ae;animation-direction:alternate-reverse}@keyframes gradientPulse{from{opacity:.45;transform:translateX(-3px)}to{opacity:1;transform:translateX(3px)}}@media(prefers-reduced-motion:reduce){.gradient-wire.on{animation:none}}`}</style>
    <span className="lab-eyebrow">看见一次更新 · 可计算的缩小例子</span><h3 style={{margin:'7px 0'}}>冻结参数，为什么误差信号还能传过去？</h3>
    <p>把当前路径缩成两个标量乘法：预测 ŷ = b·(a·x)，目标固定为 3。a 代表 {names[0]}，b 代表 {names[1]}。{frozen?'上方选择了仅投影器训练，因此 b 保持不变。':'上方选择了 all，因此 a、b 都允许更新。'}</p>
    <div className="ctrl"><label>输入 x<input type="range" min={.5} max={1.5} step={.25} aria-label="训练实验输入" value={x} onChange={e=>{setX(Number(e.target.value));reset();}}/>{x}</label><label>学习率 η<select aria-label="训练实验学习率" value={rate} onChange={e=>{setRate(Number(e.target.value));reset();}}><option value={.02}>0.02</option><option value={.1}>0.10</option></select></label><button onClick={()=>{setX(1);setRate(.1);reset();}}>重置训练实验</button></div>
    <div className="gradient-layout"><div><div style={{display:'grid',gridTemplateColumns:'1fr 25px 1fr 25px 1fr',gap:7,alignItems:'stretch',margin:'16px 0'}}>
      <div className="lab-card"><strong>输入 x</strong><div className="lab-metric">{x}</div><span className="lab-note">教学数值</span></div><div aria-hidden className={`gradient-wire ${phase===1||phase===3?'on':''} ${phase===3?'back':''}`}>{phase===3?'←':'→'}</div>
      <div className="lab-card"><strong>a · {names[0]}</strong><div className="lab-metric">{phase>=1?fmt(s.mid):'待计算'}</div><span className="lab-note">中间值 a×x</span></div><div aria-hidden className={`gradient-wire ${phase===1||phase===3?'on':''} ${phase===3?'back':''}`}>{phase===3?'←':'→'}</div>
      <div className="lab-card"><strong>b · {names[1]}</strong><div className="lab-metric" data-testid="training-prediction">{phase>=1?fmt(s.y):'待计算'}</div><span className="lab-note">预测 ŷ = b×中间值</span></div>
    </div>
    <div className="ctrl"><button onClick={advance}>{['计算前向 →','比较目标 →','追踪导数 ←','执行参数更新 →','再训练一步 →'][phase]}</button><strong>{phases[phase]}</strong><span>已完成 {round} 次更新</span></div>
    </div><div className="gradient-detail">{phase<2&&<div className="lab-card"><strong>在这里跟踪损失、导数与更新</strong><p>左侧先计算预测，再比较目标 3。图与结果固定在两侧，切换阶段时可以一直对照。</p></div>}{phase===2&&<div className="lab-card"><strong>损失 = ½(ŷ−3)²</strong><p>误差 e = {fmt(s.y)} − 3 = {fmt(s.error)}；本次更新前的损失 = <output data-testid="training-loss">{fmt(s.loss)}</output>。</p></div>}
    {phase===3&&<div className="lab-card" style={{marginTop:12}}><strong>从误差回到 a：∂L/∂a = e × b × x</strong><p>{fmt(s.error)} × {fmt(old.b)} × {x} = <output data-testid="training-gradient">{fmt(s.da)}</output></p><div className="feedback">{frozen?'b 虽然冻结，仍出现在传回 a 的乘法链里。把 b 从计算图删掉或切断这条路径，得到的训练过程就不同了。':'这里两处都允许更新。a 的导数包含后续乘数 b；b 的导数为 e × a × x。'}</div></div>}
    {phase===4&&<div className="lab-card" style={{marginTop:12}}><strong>更新结果 · θ新 = θ旧 − η × 导数</strong><table style={{width:'100%'}}><thead><tr><th>参数</th><th>更新前</th><th>更新后</th><th>原因</th></tr></thead><tbody><tr><td>a</td><td>{fmt(before.a)}</td><td data-testid="training-a">{fmt(weights.a)}</td><td>允许更新</td></tr><tr><td>b</td><td>{fmt(before.b)}</td><td data-testid="training-b">{fmt(weights.b)}</td><td>{frozen?'冻结，保持不变':'允许更新'}</td></tr></tbody></table><p>用新参数重新前向：预测 {fmt(after.y)}，损失 <output data-testid="training-new-loss">{fmt(after.loss)}</output>。{after.loss<s.loss?'这一步更接近目标。':after.loss===s.loss?'已没有变化。':'这一步损失增加，不能把一次更新等同于必然改善。'}</p>{task!=='t2a'&&<p className="lab-note">同一初值、输入和学习率：本步仅更新 a 的损失为 {fmt(oneStep(true).loss)}，同时更新 a/b 为 {fmt(oneStep(false).loss)}。这是当前数值下的一次对照，不说明哪种训练模式普遍更优。</p>}</div>}
    </div></div><p className="lab-note">这里的 a、b、输入与目标都是人为数值，两个乘法不表示真实网络层数；平方损失与普通梯度下降仅用于解释链式法则。论文实际使用的 token 损失、训练参数与优化器仍以上文及原文为准。本实验不运行模型训练。</p>
  </section>;
}

export const GradientWorkbenchWidget=()=>null;
