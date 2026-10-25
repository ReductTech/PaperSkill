import React, { useMemo, useState } from 'react';

type Props = { chapterId: string; moduleId: string };
type Bench = { name: string; family: '检索'|'问答'|'动作识别'; view: string; task: string; metric: string; protocol: string; anchor: string };
const benches: Bench[] = [
  { name:'EK-100 MIR', family:'检索', view:'第一人称', task:'视频—文字检索', metric:'avg mAP / avg nDCG', protocol:'零样本检索等，按表列读取', anchor:'第5–6页 Table 1' },
  { name:'EgoMCQ', family:'问答', view:'第一人称', task:'多项选择视频—文字匹配', metric:'inter / intra-video accuracy', protocol:'零样本选择等，按表列读取', anchor:'第6页对应实验表' },
  { name:'EGTEA', family:'动作识别', view:'第一人称', task:'动作分类', metric:'mean / top-1 accuracy', protocol:'ZS、FT 需分开', anchor:'第6–7页对应实验表' },
  { name:'CharadesEgo', family:'动作识别', view:'第一与第三人称', task:'动作识别', metric:'mAP', protocol:'ZS 或 FT', anchor:'第7页 Table 5' },
  { name:'UCF-101', family:'动作识别', view:'第三人称', task:'动作分类', metric:'mean accuracy', protocol:'线性探测 LP', anchor:'第7页 Table 6' },
  { name:'HMDB-51', family:'动作识别', view:'第三人称', task:'动作分类', metric:'mean accuracy', protocol:'线性探测 LP', anchor:'第7页 Table 6' },
];
const panel: React.CSSProperties={padding:'1rem',border:'1px solid #dce4ec',borderRadius:16,background:'#fbfdff'};
const row:React.CSSProperties={display:'flex',gap:'.6rem',flexWrap:'wrap',alignItems:'center'};
const btn=(on:boolean):React.CSSProperties=>({border:'1px solid '+(on?'#4267ac':'#cad6e3'),background:on?'#e9f1ff':'#fff',color:'#223d61',borderRadius:10,padding:'.5rem .75rem',cursor:'pointer',fontWeight:on?700:500});
const feedback:React.CSSProperties={marginTop:'.8rem',padding:'.7rem .8rem',borderLeft:'4px solid #43a989',borderRadius:8,background:'#edf8f4',lineHeight:1.6};
const muted:React.CSSProperties={color:'#62748a',fontSize:'.83rem'};

function Overview() {
  const [selected,setSelected]=useState(3);
  const bench=benches[selected];
  return <div style={panel}>
    <strong>先给成绩卡写上比较条件</strong>
    <p style={muted}>Figure 1 是论文原图；它把多项任务画在一张雷达图上，轴上的指标不相同。下方只展示所选基准的条件。</p>
    <div style={row}>{benches.map((b,i)=><button key={b.name} type="button" onClick={()=>setSelected(i)} style={btn(i===selected)}>{b.name}</button>)}</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'.5rem',marginTop:'.85rem'}}>
      {([['视角',bench.view],['任务',bench.task],['指标',bench.metric],['协议',bench.protocol]] as [string,string][]).map(([label,value])=><div key={label} style={{border:'1px solid #dfe6ef',borderRadius:10,padding:'.65rem',background:'#fff'}}><small style={muted}>{label}</small><div style={{fontWeight:700,marginTop:'.2rem'}}>{value}</div></div>)}
    </div>
    <div role="status" style={feedback}>已选择 <strong>{bench.name}</strong>（{bench.family}）。论文锚点：{bench.anchor}。读取原图时请按当前卡片核对轴名，不能将不同指标直接排总名次。</div>
  </div>;
}

function TaskMap() {
  const [family,setFamily]=useState<Bench['family']>('动作识别');
  const [active,setActive]=useState('CharadesEgo');
  const filtered=benches.filter(b=>b.family===family);
  const chosen=benches.find(b=>b.name===active&&b.family===family)??filtered[0];
  return <div style={panel}>
    <strong>让数据集回到各自的任务</strong>
    <div style={{...row,margin:'.7rem 0'}}>{(['检索','问答','动作识别'] as Bench['family'][]).map(f=><button key={f} type="button" onClick={()=>{setFamily(f);setActive(benches.find(b=>b.family===f)!.name)}} style={btn(family===f)}>{f} <span style={muted}>({benches.filter(b=>b.family===f).length})</span></button>)}</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:'.55rem'}}>{filtered.map(b=><button type="button" key={b.name} onClick={()=>setActive(b.name)} style={{...btn(chosen.name===b.name),minHeight:64,textAlign:'left'}}>{b.name}<br /><small style={muted}>{b.view}</small></button>)}</div>
    <div role="status" style={feedback}><strong>{chosen.name}</strong> 属于{chosen.family}：{chosen.task}。主要读数：{chosen.metric}。{chosen.protocol}。不要拿它与另一任务的百分数直接比高低。</div>
  </div>;
}

const charades=[
  {name:'EgoVLP TSF-B',zs:25.0,ft:32.1,color:'#9caabc'},
  {name:'LaViLa TSF-B',zs:26.8,ft:33.7,color:'#4db18b'},
  {name:'LaViLa TSF-L',zs:28.9,ft:36.1,color:'#2a8d70'},
];
function ProtocolBars() {
  const [protocol,setProtocol]=useState<'zs'|'ft'>('zs');
  const label=protocol==='zs'?'零样本 ZS':'微调 FT';
  const highest=Math.max(...charades.map(r=>r[protocol]));
  return <div style={panel}>
    <strong>同一任务、同一 mAP，分协议读数</strong>
    <p style={muted}>CharadesEgo 动作识别 · mAP · 论文第7页 Table 5。切换协议后整组条形同步更新。</p>
    <div style={row}><button type="button" onClick={()=>setProtocol('zs')} style={btn(protocol==='zs')}>零样本 ZS</button><button type="button" onClick={()=>setProtocol('ft')} style={btn(protocol==='ft')}>微调 FT</button></div>
    <div style={{display:'grid',gap:'.7rem',marginTop:'.9rem'}}>{charades.map(r=><div key={r.name}><div style={{...row,justifyContent:'space-between',marginBottom:'.25rem'}}><span>{r.name}</span><strong>{r[protocol].toFixed(1)} mAP</strong></div><div style={{background:'#edf1f5',borderRadius:8,height:21,overflow:'hidden'}}><div style={{width:(r[protocol]/highest*100)+'%',height:'100%',background:r.color,transition:'width .2s'}} /></div></div>)}</div>
    <div role="status" style={feedback}>现在只看 <strong>{label}</strong> 的 CharadesEgo mAP。LaViLa TSF-L 为 {charades[2][protocol].toFixed(1)}；另一协议单独列出，不能把 ZS 和 FT 混作同一设置的排名。</div>
  </div>;
}

type Result={method:string;value:number};
const resultSets:Record<string,{protocol:string;metric:string;anchor:string;rows:Result[]}>={
  'CharadesEgo · ZS':{protocol:'ZS',metric:'动作识别 mAP',anchor:'Table 5',rows:charades.map(r=>({method:r.name,value:r.zs}))},
  'CharadesEgo · FT':{protocol:'FT',metric:'动作识别 mAP',anchor:'Table 5',rows:charades.map(r=>({method:r.name,value:r.ft}))},
  'UCF-101 · LP':{protocol:'LP',metric:'动作分类 mean accuracy',anchor:'Table 6（HowTo100M 预训练后线性探测）',rows:[{method:'基线 TSF-B',value:86.5},{method:'LaViLa TSF-B',value:87.4},{method:'LaViLa TSF-L',value:88.1}]},
  'HMDB-51 · LP':{protocol:'LP',metric:'动作分类 mean accuracy',anchor:'Table 6（HowTo100M 预训练后线性探测）',rows:[{method:'基线 TSF-B',value:59.4},{method:'LaViLa TSF-B',value:57.2},{method:'LaViLa TSF-L',value:61.5}]},
};
function ResultLens() {
  const [setName,setSetName]=useState('CharadesEgo · ZS');
  const [sort,setSort]=useState<'high'|'low'|'name'>('high');
  const set=resultSets[setName];
  const rows=useMemo(()=>[...set.rows].sort((a,b)=>sort==='high'?b.value-a.value:sort==='low'?a.value-b.value:a.method.localeCompare(b.method)),[set,sort]);
  return <div style={panel}>
    <strong>只在同一列里排序</strong>
    <div style={{...row,margin:'.7rem 0'}}>{Object.keys(resultSets).map(name=><button key={name} type="button" onClick={()=>setSetName(name)} style={btn(setName===name)}>{name}</button>)}</div>
    <label>排序方式 <select aria-label="结果排序方式" value={sort} onChange={e=>setSort(e.target.value as 'high'|'low'|'name')} style={{padding:'.4rem',borderRadius:8,marginLeft:'.4rem'}}><option value="high">数值从高到低</option><option value="low">数值从低到高</option><option value="name">方法名称</option></select></label>
    <div style={{overflowX:'auto',marginTop:'.75rem'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:340}}>
      <thead><tr style={{background:'#edf3fa'}}><th style={{textAlign:'left',padding:'.55rem'}}>方法</th><th style={{textAlign:'left',padding:'.55rem'}}>数据集 / 协议</th><th style={{textAlign:'right',padding:'.55rem'}}>{set.metric}</th></tr></thead>
      <tbody>{rows.map((r,i)=><tr key={r.method} style={{background:i%2?'#fff':'#f8fafc',borderBottom:'1px solid #e3e9f0'}}><td style={{padding:'.55rem'}}>{r.method}</td><td style={{padding:'.55rem'}}>{setName}</td><td style={{padding:'.55rem',textAlign:'right',fontVariantNumeric:'tabular-nums',fontWeight:700}}>{r.value.toFixed(1)}</td></tr>)}</tbody>
    </table></div>
    <div role="status" style={feedback}>{setName}：当前按{sort==='high'?'数值降序':sort==='low'?'数值升序':'方法名'}展示。来源：论文第7页 {set.anchor}。表内每行共享同一数据集、指标和 {set.protocol} 协议。</div>
  </div>;
}

export const Ch8Lab:React.FC<Props>=({moduleId})=>{
  if(moduleId==='8.1')return <Overview/>;
  if(moduleId==='8.2')return <TaskMap/>;
  if(moduleId==='8.3')return <ProtocolBars/>;
  if(moduleId==='8.4')return <ResultLens/>;
  return null;
};
