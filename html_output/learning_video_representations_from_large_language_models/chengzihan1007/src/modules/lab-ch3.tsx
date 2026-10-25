import React, { useState } from 'react';

type Props = { chapterId: string; moduleId: string };
const panel: React.CSSProperties = {border:'1px solid #c9d8e7',borderRadius:18,padding:20,background:'#f8fbff',color:'#17314a'};
const button=(active=false):React.CSSProperties=>({border:'1px solid #80a2bd',borderRadius:10,padding:'8px 12px',background:active?'#145f79':'#fff',color:active?'#fff':'#17314a',cursor:'pointer',fontWeight:650});
const note:React.CSSProperties={fontSize:13,color:'#556c80',marginTop:14};

function FigureTour(){
  const spots=[
    {key:'Narrator',color:'#e39a40',input:'视频片段 x′（视觉特征）',output:'为已标注片段重述，或给空白片段生成伪叙述 y′',path:'视觉 → 语言生成 → 新视频—文本对',question:'这一步补的是“看见却没写下”的内容。'},
    {key:'Rephraser',color:'#8a70b0',input:'已有叙述 y（文字）',output:'语义相近的另一种说法 y″',path:'文字 → 文字改写 → 更丰富的视频—文本对',question:'这一步补的是“同一个动作还能怎样说”。'},
    {key:'Dual Encoder',color:'#168e79',input:'原始与生成的配对集合',output:'可用于跨模态检索、识别等任务的视频与文本表征',path:'配对数据 → 对比训练 → 共享空间',question:'这一步最终学习表示，而不是继续产生字幕。'},
  ];
  const [index,setIndex]=useState(0);
  const s=spots[index];
  return <div style={panel}>
    <p>点击论文 Figure 2 的三个功能节点，追踪输入与输出。原图展示在本模块下方。</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{spots.map((sp,i)=><button key={sp.key} style={{...button(index===i),borderColor:sp.color}} aria-pressed={index===i} onClick={()=>setIndex(i)}>{i+1}. {sp.key}</button>)}</div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'stretch',marginTop:18}}>
      <div style={{flex:'1 1 150px',padding:14,borderRadius:12,background:'#e7eef6'}}><small>输入</small><div style={{fontWeight:700,marginTop:6}}>{s.input}</div></div>
      <div aria-hidden style={{alignSelf:'center',fontSize:26,color:s.color}}>→</div>
      <div style={{flex:'1 1 150px',padding:14,borderRadius:12,background:'#e7f4ee'}}><small>输出</small><div style={{fontWeight:700,marginTop:6}}>{s.output}</div></div>
    </div>
    <div role="status" style={{padding:13,marginTop:14,borderLeft:`4px solid ${s.color}`,background:'#fff',borderRadius:8}}><strong>{s.path}</strong><div>{s.question}</div></div>
    <p style={note}>论文第 2 页 Figure 2；第 3 页 §4。图内绘制结构以原图为准，本区为交互式拆解。</p>
  </div>;
}

function RoleMatch(){
  const roles=['Narrator','Rephraser','Dual Encoder'];
  const jobs=['从已有文字生成不同说法','从视频生成动作描述','从视频—文字配对学习表征'];
  const correct=[1,0,2];
  const explains=['Narrator 以视频为条件生成句子。','Rephraser 只接收文字，改写语言表达。','Dual Encoder 使用配对监督学习共享表示。'];
  const [role,setRole]=useState(0);
  const [choice,setChoice]=useState<number|null>(null);
  const [solved,setSolved]=useState<boolean[]>([false,false,false]);
  const choose=(j:number)=>{setChoice(j);if(j===correct[role])setSolved(solved.map((v,i)=>i===role?true:v))};
  return <div style={panel}>
    <p>先选角色，再点它的职责。配错也可继续尝试。</p>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{roles.map((r,i)=><button key={r} style={button(role===i)} aria-pressed={role===i} onClick={()=>{setRole(i);setChoice(null)}}>{solved[i]?'✓ ':''}{r}</button>)}</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginTop:16}}>{jobs.map((j,i)=><button key={j} style={{...button(choice===i),minHeight:68,textAlign:'left'}} onClick={()=>choose(i)}>{j}</button>)}</div>
    <div role="status" style={{minHeight:55,padding:12,borderRadius:10,marginTop:14,background:choice===null?'#e8eef4':choice===correct[role]?'#e1f3e8':'#fae9e7'}}>{choice===null?'请选择一个职责。':`${choice===correct[role]?'✓ 配对正确。':'还不是这个角色。'}${explains[role]}`}</div>
    <p style={note}>角色划分：论文第 2 页 Figure 2 与第 3 页 §4。</p>
  </div>;
}

function Pool(){
  const stages=[
    {name:'① 原始人工对',count:2,explain:'两段有人类 narration 的视频，构成原始训练对 (X,Y)。',color:'#477b9a'},
    {name:'② Recaption',count:4,explain:'Narrator 给已经有人类文字的片段写新叙述。',color:'#d5903f'},
    {name:'③ Pseudo-caption',count:7,explain:'Narrator 在无文字时间段生成新配对，随后要筛选。',color:'#168e79'},
    {name:'④ Rephrase',count:10,explain:'Rephraser 为原有叙述添加不同说法，不直接读取视频。',color:'#8360a8'},
  ];
  const [stage,setStage]=useState(0);
  const s=stages[stage];
  return <div style={panel}>
    <p>沿论文的数据流程逐步扩充训练对。下面的卡片数量只是教学示意。</p>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{stages.map((v,i)=><button key={v.name} style={button(stage===i)} aria-pressed={stage===i} onClick={()=>setStage(i)}>{v.name}</button>)}</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(78px,1fr))',gap:8,marginTop:18}}>{Array.from({length:s.count},(_,i)=><div key={i} style={{border:`1px solid ${i<2?'#477b9a':i<4?'#d5903f':i<7?'#168e79':'#8360a8'}`,borderRadius:9,padding:'10px 5px',textAlign:'center',background:'#fff'}}><div style={{fontSize:21}}>▣</div><small>{i<2?'原始':i<4?'重述':i<7?'新片段':'改写'}</small></div>)}</div>
    <div role="status" style={{padding:12,background:'#e8f5f1',borderRadius:10,marginTop:16}}><strong>第 {stage+1} 步 · {s.count} 对（示意）</strong><div>{s.explain}</div></div>
    <p style={note}>示意计数不是论文报告的数据规模。真实三类配对来源见第 3 页 §4；Narrator 的 recaption / pseudo-caption 细节见第 4–5 页 §4.1。</p>
  </div>;
}

function SourceFilter(){
  const sources=[
    {name:'原始人工配对',formula:'(X,Y)',desc:'人类描述的片段，作为原始监督。',color:'#477b9a'},
    {name:'Narrator 生成配对',formula:'(X′,Y′)',desc:'包括 recaption 与筛选后的 pseudo-caption。',color:'#d5903f'},
    {name:'Rephraser 改写配对',formula:'(X,Y″)',desc:'同一视频可对应不同语言表达。',color:'#8360a8'},
  ];
  const [on,setOn]=useState([true,true,true]);
  const toggle=(i:number)=>setOn(on.map((v,j)=>i===j?!v:v));
  return <div style={panel}>
    <p>开关来源，观察进入双编码器训练的配对集合。</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>{sources.map((s,i)=><label key={s.name} style={{padding:14,border:`2px solid ${on[i]?s.color:'#c9d3dc'}`,borderRadius:12,background:on[i]?'#fff':'#eef2f5',cursor:'pointer',opacity:on[i]?1:.7}}>
      <input type="checkbox" checked={on[i]} onChange={()=>toggle(i)} style={{accentColor:s.color,marginRight:8}}/><strong>{s.name}</strong><div style={{fontSize:20,color:s.color,margin:'8px 0'}}>{s.formula}</div><small>{s.desc}</small>
    </label>)}</div>
    <div role="status" style={{padding:13,background:'#e8f5f1',borderRadius:10,marginTop:16}}>
      <strong>当前训练集合：{on.some(Boolean)?sources.filter((_,i)=>on[i]).map(s=>s.formula).join(' ∪ '):'空集合'}</strong>
      <div>{on.some(Boolean)?`有 ${on.filter(Boolean).length} 类来源可供双编码器学习。`:'请至少打开一类配对，否则本示意中没有对比训练数据。'}</div>
    </div>
    <p style={note}>论文第 3 页 §4、第 5 页 §4.3。开关只用于理解数据来源，不代表论文做过对应的所有组合实验。</p>
  </div>;
}

export const Ch3Lab: React.FC<Props> = ({moduleId}) => {
  if(moduleId==='3.1') return <FigureTour />;
  if(moduleId==='3.2') return <RoleMatch />;
  if(moduleId==='3.3') return <Pool />;
  if(moduleId==='3.4') return <SourceFilter />;
  return null;
};
