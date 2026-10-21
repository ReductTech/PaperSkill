import React, { useState } from 'react';

type Props = { chapterId: string; moduleId: string };
const panel: React.CSSProperties = { border:'1px solid #c9d8e7', borderRadius:18, padding:20, background:'#f8fbff', color:'#17314a' };
const button = (active=false): React.CSSProperties => ({border:'1px solid #7fa4bc',borderRadius:10,padding:'8px 12px',background:active?'#145f79':'#fff',color:active?'#fff':'#17314a',cursor:'pointer',fontWeight:650});
const note: React.CSSProperties = {fontSize:13,color:'#556c80',marginTop:14};
const clamp=(n:number)=>Math.max(0,Math.min(100,n));

function Space() {
  const [trained,setTrained]=useState(false);
  const [x,setX]=useState(68);
  const [y,setY]=useState(35);
  const videos=[{name:'取牛奶',x:25,y:25},{name:'切面包',x:70,y:70},{name:'开门',x:25,y:74}];
  const others=trained?[{name:'“切面包”',x:74,y:68},{name:'“开门”',x:29,y:72}]:[{name:'“切面包”',x:30,y:68},{name:'“开门”',x:76,y:28}];
  const textPoint=trained?{x,y}:{x:68,y:35};
  const distances=videos.map(v=>({name:v.name,d:Math.hypot(v.x-textPoint.x,v.y-textPoint.y)}));
  const nearest=[...distances].sort((a,b)=>a.d-b.d)[0];
  const move=(e:React.PointerEvent<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect();setX(clamp(Math.round((e.clientX-r.left)/r.width*100)));setY(clamp(Math.round((e.clientY-r.top)/r.height*100)))};
  return <div style={panel}>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button style={button(!trained)} aria-pressed={!trained} onClick={()=>setTrained(false)}>训练前示意</button><button style={button(trained)} aria-pressed={trained} onClick={()=>{setTrained(true);setX(28);setY(28)}}>对比训练后示意</button></div>
    <p>蓝色圆点是视频，紫色方块是文字。切到训练后，点击画布或用滑杆移动“取牛奶”文字点。</p>
    <div onPointerDown={trained?move:undefined} role="img" aria-label="视频与文字的二维示意嵌入空间" style={{position:'relative',height:260,borderRadius:12,background:'linear-gradient(90deg,#e5edf5 1px,transparent 1px),linear-gradient(#e5edf5 1px,transparent 1px),#fff',backgroundSize:'25% 25%',border:'1px solid #d4e2eb',touchAction:'none',cursor:trained?'crosshair':'default'}}>
      {videos.map(v=><div key={v.name} style={{position:'absolute',left:`${v.x}%`,top:`${v.y}%`,transform:'translate(-50%,-50%)',background:'#146c91',color:'#fff',borderRadius:24,padding:'5px 9px',fontSize:12,whiteSpace:'nowrap'}}>▶ {v.name}</div>)}
      {others.map(v=><div key={v.name} style={{position:'absolute',left:`${v.x}%`,top:`${v.y}%`,transform:'translate(-50%,-50%)',background:'#7957a0',color:'#fff',borderRadius:6,padding:'5px 8px',fontSize:12,whiteSpace:'nowrap'}}>{v.name}</div>)}
      <div style={{position:'absolute',left:`${textPoint.x}%`,top:`${textPoint.y}%`,transform:'translate(-50%,-50%)',background:'#a04486',color:'#fff',borderRadius:6,padding:'7px 9px',boxShadow:'0 0 0 3px #f2d3e7',fontSize:12,whiteSpace:'nowrap'}}>“取牛奶” ↔</div>
    </div>
    {trained&&<div style={{display:'flex',gap:16,marginTop:14,flexWrap:'wrap'}}>
      <label>X <input aria-label="移动文字点水平位置" type="range" min="0" max="100" value={x} onChange={e=>setX(Number(e.target.value))}/></label>
      <label>Y <input aria-label="移动文字点垂直位置" type="range" min="0" max="100" value={y} onChange={e=>setY(Number(e.target.value))}/></label>
    </div>}
    <div role="status" style={{background:'#e8f5f1',padding:12,borderRadius:10,marginTop:14}}>离“取牛奶”文字最近的视频：<strong>{nearest.name}</strong>。{nearest.name==='取牛奶'?'真实配对被放在一起。':'当前最近邻错了；对比学习要拉近正确配对并推开错误配对。'}</div>
    <p style={note}>二维坐标与距离都是教学示意；论文第 3 页 §3 的表示并非二维。</p>
  </div>;
}

function Matrix() {
  const labels=['取牛奶','切面包','开门'];
  const values=[[0.86,0.22,0.31],[0.18,0.91,0.27],[0.35,0.24,0.83]];
  const [selected,setSelected]=useState<[number,number]>([0,0]);
  const [i,j]=selected;
  return <div style={panel}>
    <p>每一行选一个视频，每一列选一个文字。点击格子，判断是否为同一个训练对。</p>
    <div style={{overflowX:'auto'}}><table style={{borderCollapse:'separate',borderSpacing:5,width:'100%',minWidth:440,textAlign:'center'}}>
      <thead><tr><th>视频 ↓ / 文字 →</th>{labels.map(l=><th key={l}>{l}</th>)}</tr></thead>
      <tbody>{labels.map((label,r)=><tr key={label}><th>{label}</th>{labels.map((_,c)=><td key={c}><button aria-label={`${label} 视频与${labels[c]}文字，示意相似度 ${values[r][c]}`} aria-pressed={r===i&&c===j} onClick={()=>setSelected([r,c])} style={{...button(r===i&&c===j),width:'100%',minHeight:45,borderColor:r===c?'#168e79':'#b6c8d6',background:r===i&&c===j?'#145f79':r===c?'#e2f5ed':'#fff'}}>{values[r][c].toFixed(2)}</button></td>)}</tr>)}</tbody>
    </table></div>
    <div role="status" style={{background:i===j?'#e1f3e8':'#fae9e7',borderRadius:10,padding:12,marginTop:12}}><strong>{labels[i]} 视频 × {labels[j]} 文字：</strong>{i===j?'正例，对角线；训练希望提高它的相似度。':'批内负例；训练希望它低于同一行的真实文字。'}</div>
    <p style={note}>矩阵中的数值为教学示意。论文第 3 页 §3、式(1) 定义批内双向对比目标。</p>
  </div>;
}

function Temperature() {
  const [temp,setTemp]=useState(0.7);
  const scores=[2.2,1.4,0.8];
  const names=['真实配对','错配 A','错配 B'];
  const exps=scores.map(s=>Math.exp((s-Math.max(...scores))/temp));
  const sum=exps.reduce((a,b)=>a+b,0);
  const probs=exps.map(v=>v/sum);
  return <div style={panel}>
    <p>同一视频对三条文字的示意相似度固定为 2.2、1.4、0.8。只调“温度”，观察概率如何集中。</p>
    <label>温度 τ = <strong>{temp.toFixed(1)}</strong><input type="range" aria-label="对比学习温度" min="0.2" max="2" step="0.1" value={temp} onChange={e=>setTemp(Number(e.target.value))} style={{display:'block',width:'100%',accentColor:'#1c7595',margin:'10px 0 18px'}} /></label>
    {probs.map((p,i)=><div key={names[i]} style={{display:'grid',gridTemplateColumns:'100px 1fr 50px',gap:10,alignItems:'center',marginBottom:12}}><span>{names[i]}</span><div style={{height:24,background:'#e2ebf2',borderRadius:10,overflow:'hidden'}}><div style={{width:`${p*100}%`,height:'100%',background:i===0?'#168e79':'#bb7a78',transition:'width .2s'}} /></div><strong>{(p*100).toFixed(1)}%</strong></div>)}
    <div role="status" style={{padding:12,background:'#e8f5f1',borderRadius:10}}>正例概率为 <strong>{(probs[0]*100).toFixed(1)}%</strong>。{temp<0.7?'较低温度让模型更强调最高分与其他分数的差距。':temp>1.3?'较高温度让分布更平缓，差距不那么尖锐。':'温度改变分布形状，不改变哪一条是原始正确配对。'}</div>
    <p style={note}>概率、相似度与可选 τ 范围均为教学示意，不是论文报告的超参数或实测结果。机制见第 3 页式(1)。</p>
  </div>;
}

export const Ch2Lab: React.FC<Props> = ({moduleId}) => {
  if(moduleId==='2.1') return <Space />;
  if(moduleId==='2.2') return <Matrix />;
  if(moduleId==='2.3') return <Temperature />;
  return null;
};
