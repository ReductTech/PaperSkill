import React, { useState } from 'react';

type Props={chapterId:string;moduleId:string};
const panel:React.CSSProperties={padding:'1rem',border:'1px solid #dce4ec',borderRadius:16,background:'#fbfdff'};
const row:React.CSSProperties={display:'flex',gap:'.6rem',alignItems:'center',flexWrap:'wrap'};
const btn=(on:boolean):React.CSSProperties=>({border:'1px solid '+(on?'#4267ac':'#cbd7e4'),background:on?'#e9f1ff':'#fff',color:'#213d61',padding:'.5rem .7rem',borderRadius:9,fontWeight:on?700:500,cursor:'pointer'});
const feedback:React.CSSProperties={marginTop:'.85rem',padding:'.7rem .8rem',borderLeft:'4px solid #43a989',borderRadius:8,background:'#edf8f4',lineHeight:1.65};
const muted:React.CSSProperties={fontSize:'.83rem',color:'#61768c'};
const panels=[
  {name:'(a) EK-100 MIR · mAP',task:'视频—文字检索',metric:'mAP'},
  {name:'(b) EK-100 MIR · nDCG',task:'视频—文字检索',metric:'nDCG'},
  {name:'(c) EGTEA · mean accuracy',task:'动作分类',metric:'mean accuracy'},
  {name:'(d) EgoMCQ · intra-video accuracy',task:'同视频候选问答',metric:'intra-video accuracy'},
];
const budgets=[10,20,50,100] as const;
function BudgetSlider(){
  const [budget,setBudget]=useState<number>(50);
  const [metric,setMetric]=useState(0);
  const index=budgets.indexOf(budget as typeof budgets[number]);
  return <div style={panel}>
    <strong>把目光移到 Figure 5 的一个坐标</strong>
    <p style={muted}>选择面板与人工标注比例。下方竖线只标示横轴位置，不数字化论文曲线；完整曲线见本模块附的原图。</p>
    <div style={row}>{panels.map((p,i)=><button key={p.name} type="button" style={btn(i===metric)} onClick={()=>setMetric(i)}>{p.name}</button>)}</div>
    <label style={{display:'block',marginTop:'.8rem'}}>人工 narration 比例：<strong>{budget}%</strong>
      <input type="range" min="0" max="3" step="1" value={index} aria-label="人工标注预算" onChange={e=>setBudget(budgets[Number(e.target.value)])} style={{display:'block',width:'100%',accentColor:'#2e9c78',marginTop:'.5rem'}} />
    </label>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'.3rem'}}>{budgets.map((b,i)=><button type="button" key={b} onClick={()=>setBudget(b)} style={{...btn(b===budget),textAlign:'center',borderTop:b===budget?'4px solid #2e9c78':'4px solid #dfe6ee'}}>{b}%</button>)}</div>
    <div role="status" style={feedback}>查看 <strong>{panels[metric].name}</strong>，人工标注 <strong>{budget}%</strong>。这是{panels[metric].task}的 {panels[metric].metric}；论文 Figure 5 中 LaViLa 曲线在这一面板高于仅用人工标注的基线。请在原图对应横轴位置读实际曲线。</div>
  </div>;
}

const comparisons=[
  {label:'同为 50% 标注',desc:'固定训练标注预算，看 LaViLa 与只用人工标注的基线。',message:'Figure 5 的四项指标中，LaViLa 曲线高于相同标注比例的 GT-only 曲线。这是方法比较，预算固定。'},
  {label:'50% 与 100%',desc:'切换标注预算，再确认比较的是哪条方法曲线。',message:'从 50% 移到 100% 时，方法与指标也要固定；Figure 5 允许在同一面板沿同一曲线观察变化。此处不把视觉读出的近似值当精确测量。'},
  {label:'与外部已有方法',desc:'先查 Figure 5 的图例与协议，再讨论已有方法。',message:'外部已有方法不是 GT-only，也不必共享同一人工标注预算。若未确认实验设置，不把它与 50% 或 100% 曲线直接写成通用胜负。'},
];
function FiftyVsHundred(){
  const [selected,setSelected]=useState(0);
  return <div style={panel}>
    <strong>“50% 对 100%”究竟在比谁？</strong>
    <div style={{...row,marginTop:'.75rem'}}>{comparisons.map((c,i)=><button type="button" key={c.label} style={btn(selected===i)} onClick={()=>setSelected(i)}>{c.label}</button>)}</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'.6rem',marginTop:'.8rem'}}>
      {['方法','标注预算','指标'].map((k,i)=><div key={k} style={{padding:'.65rem',border:'1px solid #dfe7ee',borderRadius:10,background:'#fff'}}><small style={muted}>{k}</small><div style={{fontWeight:700}}>{selected===0?['LaViLa / GT-only','都为 50%','同一个 Figure 5 面板'][i]:selected===1?['固定同一方法','50% / 100%','固定同一面板'][i]:['LaViLa / 外部方法','需核对图例','需核对任务与协议'][i]}</div></div>)}
    </div>
    <div role="status" style={feedback}>{comparisons[selected].message} 来源：第7页 §5.3、Figure 5。</div>
  </div>;
}

function Scaling(){
  const [data,setData]=useState<'标注比例'|'自动叙述'>('自动叙述');
  const [model,setModel]=useState<'论文已报告设置'|'更大视觉骨干'|'更强语言模型'>('论文已报告设置');
  const future=model!=='论文已报告设置';
  return <div style={panel}>
    <strong>把“论文结果”与“未来方向”分开</strong>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:'.7rem',marginTop:'.75rem'}}>
      <label>数据侧选择<select value={data} onChange={e=>setData(e.target.value as typeof data)} style={{display:'block',width:'100%',padding:'.5rem',borderRadius:8,marginTop:'.3rem'}}><option>标注比例</option><option>自动叙述</option></select></label>
      <label>模型侧选择<select value={model} onChange={e=>setModel(e.target.value as typeof model)} style={{display:'block',width:'100%',padding:'.5rem',borderRadius:8,marginTop:'.3rem'}}><option>论文已报告设置</option><option>更大视觉骨干</option><option>更强语言模型</option></select></label>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'.5rem',marginTop:'.75rem'}}>
      <div style={{padding:'.7rem',borderRadius:9,background:'#e9f1ff'}}>数据维度<br/><strong>{data}</strong></div>
      <div style={{padding:'.7rem',borderRadius:9,background:future?'#fff0dd':'#e5f5ec'}}>模型维度<br/><strong>{model}</strong></div>
      <div style={{padding:'.7rem',borderRadius:9,background:future?'#fff0dd':'#e5f5ec'}}>证据级别<br/><strong>{future?'作者后续方向':'论文实验/消融'}</strong></div>
    </div>
    <div role="status" style={feedback}>{future ? <>你选的<strong>{model}</strong>是作者在结论中提出的继续探索方向。与{data}联动的结果尚未由这个控件验证，因此不显示预测分数。</> : data==='标注比例' ? '论文 Figure 5 实际检查了不同人工标注比例下的四项指标；这里不外推到未测预算。' : '论文通过 Narrator 与 Rephraser 扩充文字监督；更多自动叙述是否总能继续带来收益，取决于质量和训练设置。'} 依据：第7页 Figure 5、第8页 Conclusion。</div>
  </div>;
}

type Bucket='人工标注'|'生成叙述'|'编码器训练';
const bucketInfo:Record<Bucket,{color:string;description:string}>={
  '人工标注':{color:'#4267ac',description:'提供可靠初始视频—文字对'},
  '生成叙述':{color:'#43a989',description:'扩充覆盖与表达，但需质量控制'},
  '编码器训练':{color:'#d9903d',description:'将扩充数据转成可迁移表征'},
};
function ComputeGame(){
  const [allocation,setAllocation]=useState<Record<Bucket,number>>({'人工标注':4,'生成叙述':4,'编码器训练':4});
  const [focus,setFocus]=useState<Bucket>('生成叙述');
  const total=Object.values(allocation).reduce((a,b)=>a+b,0);
  const remaining=12-total;
  const adjust=(name:Bucket,delta:number)=>setAllocation(prev=>{
    const next=prev[name]+delta;
    const used=Object.values(prev).reduce((a,b)=>a+b,0);
    if(next<0||(delta>0&&used>=12))return prev;
    return {...prev,[name]:next};
  });
  const issue=Object.entries(allocation).filter(([,value])=>value===0).map(([name])=>name);
  return <div style={panel}>
    <div style={row}><strong>12 枚预算筹码，自己分配</strong><span style={muted}>纯教学示意；不代表论文算力单位或最优值</span></div>
    <div style={{...row,marginTop:'.65rem'}}><span>已分配 {total}/12</span><span>未分配 {remaining}</span><button type="button" style={btn(false)} onClick={()=>setAllocation({'人工标注':4,'生成叙述':4,'编码器训练':4})}>重置为均衡</button></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'.6rem',marginTop:'.75rem'}}>
      {(Object.keys(bucketInfo) as Bucket[]).map(name=><div key={name} style={{padding:'.75rem',background:'#fff',border:'1px solid #dfe7ee',borderRadius:11}}>
        <strong style={{color:bucketInfo[name].color}}>{name}</strong><p style={{...muted,minHeight:38,margin:'.4rem 0'}}>{bucketInfo[name].description}</p>
        <div style={row}><button type="button" aria-label={'减少'+name} onClick={()=>{adjust(name,-1);setFocus(name)}} disabled={allocation[name]===0} style={btn(false)}>−</button><strong aria-live="polite" style={{minWidth:24,textAlign:'center'}}>{allocation[name]}</strong><button type="button" aria-label={'增加'+name} onClick={()=>{adjust(name,1);setFocus(name)}} disabled={remaining===0} style={btn(false)}>＋</button></div>
        <div style={{display:'flex',gap:2,marginTop:'.6rem'}}>{Array.from({length:12},(_,i)=><div key={i} style={{height:8,flex:1,borderRadius:4,background:i<allocation[name]?bucketInfo[name].color:'#e5eaf0'}}/>)}</div>
      </div>)}
    </div>
    <div role="status" style={feedback}>刚调整的是<strong>{focus}</strong>。{issue.length ? '当前「'+issue.join('、')+'」为 0：演示流程会缺少对应环节。' : remaining ? '还有未分配筹码；你可以保留余量或继续分配。' : '预算已全部分配。'} 论文没有报告这 12 枚筹码的真实对应成本，也没有给出最优分配。</div>
  </div>;
}

export const Ch9Lab:React.FC<Props>=({moduleId})=>{
  if(moduleId==='9.1')return <BudgetSlider/>;
  if(moduleId==='9.2')return <FiftyVsHundred/>;
  if(moduleId==='9.3')return <Scaling/>;
  if(moduleId==='9.4')return <ComputeGame/>;
  return null;
};
