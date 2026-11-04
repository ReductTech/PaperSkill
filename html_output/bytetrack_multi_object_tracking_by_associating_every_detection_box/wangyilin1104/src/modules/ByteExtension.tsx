import {useState} from 'react';
import {Button, Feedback, Frames, Layout, Slider, Street} from './ByteGuide';
import {associate, iou, simulate} from './model';
import type {Box, Detection, Track} from './model';

const frames=simulate();
const round=(n:number)=>n.toFixed(2);

export function PipelineLab(){
  const [frame,setFrame]=useState(3);
  const [step,setStep]=useState(0);
  const row=frames[frame];
  const stages=['检测输入','运动预测','高分关联','低分关联','状态更新'];
  const matches=row.matches.filter(m=>m.pass<=step-1);
  const shown=step===4?row:{...row,matches,tracks:row.tracks.filter(t=>matches.some(m=>m.id===t.id))};
  const details=[
    [row.highBoxes.length+' 个高分框',row.lowBoxes.length+' 个低分框','置信度将候选分流。'],
    [row.before.length+' 条旧轨迹参与预测','紫色虚线给出 ID 1 的预测框。','预测用到上一段运动历史。'],
    [row.matches.filter(m=>m.pass===1).length+' 对第一轮匹配','优先将高分框分配给旧轨迹。','已匹配的轨迹退出第二轮。'],
    [row.matches.filter(m=>m.pass===2).length+' 对第二轮匹配','剩余活跃轨迹与低分框匹配。','低分框需要旧轨迹接续。'],
    [row.tracks.filter(t=>t.state==='active').length+' 条活跃轨迹',row.tracks.filter(t=>t.state==='lost').length+' 条暂存轨迹','未匹配高分框可建立新轨迹。'],
  ];
  return <Layout scene={<Street frame={shown} ghosts={step>=1} output={step>=2}/>}
    side={<><h3>{step+1} / 5 · {stages[step]}</h3><ul className="bt-detail-list">{details[step].map(x=><li key={x}>{x}</li>)}</ul></>}
    controls={<div className="bt-extension-controls"><div className="bt-pills">{stages.map((label,i)=><Button key={label} active={i===step} onClick={()=>setStep(i)}>{label}</Button>)}</div><Frames frame={frame} set={setFrame}/></div>}
    feedback="在同一帧中切换处理步骤。绿色标记来自第二轮的成功关联。"/>;
}

const assignmentTracks=[300,270].map((x,i):Track=>({id:i+1,box:{x,y:102,w:100,h:115},vx:0,vy:0,last:0,state:'active',points:[]}));
const assignmentGate=.30;
export function AssignmentLab(){
  const [bx,setBx]=useState(327);
  const [global,setGlobal]=useState(true);
  const boxes:Detection[]=[{x:286,y:102,w:100,h:115,key:'A',score:.9},{x:bx,y:102,w:100,h:115,key:'B',score:.9}];
  const candidates=assignmentTracks.flatMap(t=>boxes.map(b=>({t,b,overlap:iou(t.box,b)})));
  const greedy:typeof candidates=[];
  for(const pair of candidates.sort((a,b)=>b.overlap-a.overlap)){
    if(pair.overlap>=assignmentGate&&!greedy.some(p=>p.t.id===pair.t.id||p.b.key===pair.b.key))greedy.push(pair);
  }
  const optimal=associate(assignmentTracks,boxes,1,assignmentGate);
  const selected=global?optimal:greedy;
  const sum=(pairs:typeof candidates)=>pairs.reduce((a,b)=>a+b.overlap,0);
  const rect=(b:Box,color:string,dashed:boolean)=><rect x={b.x} y={b.y} width={b.w} height={b.h} fill={color} fillOpacity=".09" stroke={color} strokeWidth="4" strokeDasharray={dashed?'8 5':undefined}/>;
  return <Layout scene={<svg className="bt-street" viewBox="0 0 800 332" role="img" aria-label="两个轨迹预测框与两个检测框的局部重叠">
    <rect width="800" height="332" fill="#eef5f8"/>
    <g transform="translate(-195 -74) scale(1.55)">
      {assignmentTracks.map((t,i)=><g key={t.id}>{rect(t.box,'#7858a0',true)}<text x={t.box.x+(i===0?80:-12)} y={i===0?88:74} fontSize="14" fill="#7858a0">ID {t.id} 预测</text></g>)}
      {boxes.map((b,i)=><g key={b.key}>{rect(b,'#2866a0',false)}<text x={b.x+(i===0?3:76)} y={i===0?235:249} fontSize="15" fill="#2866a0">检测 {b.key}</text></g>)}
    </g>
    </svg>} side={<><h3>IoU 矩阵</h3><table className="bt-table"><thead><tr><th>轨迹</th>{boxes.map(b=><th key={b.key}>{b.key}</th>)}</tr></thead><tbody>{assignmentTracks.map(t=><tr key={t.id}><th>ID {t.id}</th>{boxes.map(b=><td key={b.key} className={selected.some(p=>p.t.id===t.id&&p.b.key===b.key)?'bt-cell-selected':''}>{round(iou(t.box,b))}</td>)}</tr>)}</tbody></table>
      <p>总 IoU <b>{round(sum(selected))}</b> · {selected.length} 对</p><p>候选门槛 0.30。绿色单元格是本次分配。</p></>}
    controls={<div className="bt-controls"><Button active={!global} onClick={()=>setGlobal(false)}>逐对贪心</Button><Button active={global} onClick={()=>setGlobal(true)}>整体分配</Button><Slider label="移动 B 的横坐标" value={bx} min={300} max={365} set={setBx}/></div>}
    feedback={sum(optimal)>sum(greedy)+.001?'当前几何下，整体分配让出局部最高 IoU，取得更高的总 IoU。每行、每列最多选一个。':'当前位置下，两种方案的总 IoU 相同。移动 B 看何时会出现差异。'}/>;
}

export function LifecycleLab(){
  const [frame,setFrame]=useState(4);
  const [buffer,setBuffer]=useState(4);
  const sequence=simulate({noBox:true,buffer});
  const row=sequence[frame];
  const original=row.tracks.find(t=>t.id===1);
  const stages=['新建','活跃','暂存','找回','移除'];
  const current=frame===0?'新建':original?.state==='lost'?'暂存':!original?'移除':frame===6?'找回':'活跃';
  const captions=['未分配的高分框','本帧匹配到观测','失配且尚未超时','高分框接续旧 ID','等待超过缓存期'];
  return <div className="bt-scene"><div className="bt-lifecycle">{stages.map((label,i)=><section key={label} className={current===label?'is-current':''}><strong>{label}</strong><p>{captions[i]}</p></section>)}</div>
    <div className="bt-life-visual"><Street frame={row} output ghosts/><div><h3>第 {frame+1} 帧 · ID 1 {current}</h3><p>第 3–6 帧没有 A 检测框。把缓存设为 2 或 4，再定位第 7 帧比较结果。</p><Slider label="失配缓存（帧）" value={buffer} min={0} max={6} set={setBuffer}/></div></div>
    <Frames frame={frame} set={setFrame}/>
    <Feedback>{original?.state==='lost'?'暂存的轨迹仍可外推位置，等待后续高分观测。':current==='移除'?'原 ID 已超时。行人再出现时，当前高分框可建立新 ID。':'高分框可建立新轨迹，也可接续尚未超时的旧轨迹。'}</Feedback></div>;
}

const configs=[
  {second:'Re-ID',mot:[75.8,77.5,231],bdd:[39.2,48.3,29172]},
  {second:'IoU',mot:[76.6,79.3,159],bdd:[39.4,48.9,27902]},
];
export function AblationLab(){
  const [bdd,setBdd]=useState(false);
  const [metric,setMetric]=useState(1);
  const labels=bdd?['mMOTA','mIDF1','IDs']:['MOTA','IDF1','IDs'];
  const values=configs.map(c=>(bdd?c.bdd:c.mot)[metric]);
  const diff=+(values[1]-values[0]).toFixed(1);
  const sign=diff>0?'+':'';
  return <div className="bt-scene"><div className="bt-evidence bt-ablation"><section><h3>第一轮固定使用 IoU</h3><p>{bdd?'BDD100K':'MOT17'} 验证集 · 第二轮相似度</p>
    {configs.map((c,i)=><div key={c.second} className="bt-bar"><strong>{c.second}</strong><span><i style={{width:`${values[i]/(metric===2?Math.max(...values)*1.12:100)*100}%`}}/></span><b>{values[i]}</b></div>)}
    </section><div className="bt-panel"><h3>{labels[metric]} {sign}{diff}</h3><p>第二轮由 Re-ID 改为 IoU。{metric===2?'IDs 越低越好。':'分数越高越好。'}</p><p>论文表 1 · 同一数据集内比较</p><a href="https://arxiv.org/html/2110.06864#S4.T1" target="_blank" rel="noreferrer">查看表 1 ↗</a></div></div>
    <div className="bt-controls"><Button active={!bdd} onClick={()=>setBdd(false)}>MOT17</Button><Button active={bdd} onClick={()=>setBdd(true)}>BDD100K</Button>{labels.map((label,i)=><Button key={i} active={i===metric} onClick={()=>setMetric(i)}>{label}</Button>)}</div>
    <Feedback>论文将改善与遮挡、模糊时外观特征的可靠性联系起来。此对照固定第一轮相似度。</Feedback></div>;
}

export function ThresholdLab(){
  const [high,setHigh]=useState(.6);
  const summaries=[false,true].map(two=>{
    const data=simulate({two,high});
    const window=data.slice(2,6);
    return {two,window,count:window.filter(r=>r.matches.some(m=>m.id===1&&m.key==='A')).length,
      falseOutputs:window.filter(r=>r.tracks.some(t=>t.state==='active'&&t.box===r.input.find(b=>b.key==='C'))).length};
  });
  return <div className="bt-scene"><div className="bt-threshold"><Slider label="两组共用的高分阈值" value={high} min={.2} max={.85} step={.01} set={setHigh}/>
    <table className="bt-table"><thead><tr><th>遮挡期</th>{summaries[0].window.map(r=><th key={r.frame}>第 {r.frame+1} 帧</th>)}<th>正确接续</th><th>误检输出帧</th></tr></thead><tbody>
    <tr><th>A 的检测分</th>{summaries[0].window.map(r=><td key={r.frame}>{round(r.input.find(b=>b.key==='A')!.score)}</td>)}<td>—</td><td>—</td></tr>
    {summaries.map(({two,window,count,falseOutputs})=><tr key={String(two)}><th>{two?'两阶段关联':'仅高分关联'}</th>{window.map(r=>{const m=r.matches.find(x=>x.id===1&&x.key==='A');return <td key={r.frame} className={m?'bt-cell-selected':''}>{m?`第 ${m.pass} 轮`:'缺口'}</td>;})}<td>{count} / 4</td><td>{falseOutputs} / 4</td></tr>)}</tbody></table></div>
    <Feedback>固定检测和运动模型，只移动高分阈值。阈值太低时，背景框 C 进入高分池，也可能被建立为轨迹。</Feedback>
    <p>本页统计教学街景的 4 帧。论文图 3 在 MOT17 验证集上报告 MOTA 和 IDF1。</p></div>;
}
