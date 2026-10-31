import React,{useState} from 'react';
import {palette as P,f,Feedback,Camera,Choice} from './restoration-kit';

const motion=[{name:'GoPro',old:32.66,now:32.92,kind:'训练数据集对应的测试集'},{name:'HIDE',old:30.96,now:31.22,kind:'不再训练，直接测试'},{name:'RealBlur-R',old:35.99,now:36.19,kind:'不再训练，直接测试'},{name:'RealBlur-J',old:28.70,now:28.96,kind:'不再训练，直接测试'}];
export function MotionResults(){
 const [selected,setSelected]=useState(0),active=motion[selected];
 return <div className="lab-page lab-motion"><div className="lab-evidence-caption"><span>PSNR / dB ↑ · GoPro 训练</span><span>{active.name}：{active.kind}</span><Camera size={64}/></div>
 <svg className="lab-motion-chart" viewBox="0 0 1472 430" aria-label="运动去模糊的PSNR对比和增益"><text x="20" y="32">数据集</text><text x="260" y="32" fill={P.blue}>MPRNet</text><text x="590" y="32">Restormer 的增益</text><text x="1200" y="32" fill={P.green}>Restormer</text>{motion.map((d,i)=>{const y=90+i*80,gain=d.now-d.old,w=gain/.4*500;return <g key={d.name} className="lab-chart-choice" role="button" tabIndex={0} aria-label={`查看${d.name}`} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i)}}}><rect x="0" y={y-34} width="1472" height="70" rx="10" fill={selected===i?'#edf3ef':'#f8f6f0'}/><text x="20" y={y+10}>{d.name}</text><text x="280" y={y+10} fill={P.blue}>{f(d.old,2)}</text><path d={`M570 ${y}H1070`} stroke="#e0e5e1" strokeWidth="19"/><path d={`M570 ${y}H${570+w}`} stroke={P.green} strokeWidth="19"/><text x={590+w} y={y+10} fill={P.green}>+{f(gain,2)}</text><text x="1220" y={y+10} fill={P.green}>{f(d.now,2)}</text></g>})}{[0,.1,.2,.3,.4].map(v=><g key={v}><path d={`M${570+v/.4*500} 378v8`} stroke="#8e9ca7"/><text x={570+v/.4*500} y="423" textAnchor="middle">{f(v,1)}</text></g>)}</svg>
 </div>;
}

const taskGroups=[
 {title:'去雨',protocol:'Y 通道 · 五数据集平均',rows:[{label:'SPAIR → Restormer',old:32.91,now:33.96}]},
 {title:'真实去噪',protocol:'SIDD 训练 · DND 直接测试',rows:[{label:'SIDD / Uformer',old:39.77,now:40.02},{label:'DND / Uformer',old:39.96,now:40.03}]},
 {title:'散焦去模糊',protocol:'DPDD combined · 对照 IFAN',rows:[{label:'单图输入',old:25.37,now:25.98},{label:'双像素输入',old:25.99,now:26.66}]},
];
export function TaskResults(){
 return <div className="lab-page lab-task-results"><div className="lab-evidence-caption"><span>PSNR / dB ↑ · 每组单独比较</span><span>每一组独立训练、独立评测</span><Camera size={64}/></div><div className="lab-task-columns">{taskGroups.map((g,i)=><section key={g.title}><div className="lab-task-heading"><span>0{i+1}</span><h3>{g.title}</h3></div><p>{g.protocol}</p><div className="lab-task-chart">{g.rows.map(row=><div className="lab-task-row" key={row.label}><span>{row.label}</span><div className="lab-task-score"><strong>{f(row.old,2)}</strong><span>→</span><strong>{f(row.now,2)}</strong></div><div className="lab-task-delta"><div className="lab-gain-track"><i style={{width:`${(row.now-row.old)/1.2*100}%`}}/></div><div className="lab-task-gain">+{f(row.now-row.old,2)} dB</div></div></div>)}</div></section>)}</div></div>;
}

const ablation=[
 {name:'UNet / Resblocks',score:29.11,flops:83.4,params:24.53},
 {name:'MTA + FN',score:29.28,flops:83.7,params:24.84},
 {name:'MDTA + FN',score:29.43,flops:85.3,params:25.02},
 {name:'MTA + GDFN',score:29.54,flops:86.2,params:25.12},
 {name:'MDTA + GDFN',score:29.62,flops:87.7,params:25.31},
 {name:'顶层保留 2C',score:29.66,flops:110,params:25.65},
 {name:'再加 refinement',score:29.71,flops:141,params:26.12},
];
export function Ablations(){
 const [selected,setSelected]=useState(4),active=ablation[selected],x=(score:number)=>350+(score-29)/.8*480;
 return <div className="lab-page lab-ablation"><div className="lab-evidence-caption"><span>Urban100 彩色去噪 · σ=50</span><span>100K 次消融训练</span><Camera size={64}/></div><div className="lab-ablation-main"><svg viewBox="0 0 1000 425" aria-label="各模型配置的PSNR和计算量">{[29,29.2,29.4,29.6,29.8].map(v=><g key={v}><path d={`M${x(v)} 8V368`} stroke="#d7deea"/><text x={x(v)} y="420" textAnchor="middle">{f(v,1)}</text></g>)}{ablation.map((d,i)=>{const y=32+i*52;return <g key={d.name} role="button" tabIndex={0} className="lab-chart-choice" aria-label={`查看${d.name}`} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i)}}}><rect x="0" y={y-25} width="1000" height="49" rx="8" fill={selected===i?'#e9f1ec':'transparent'}/><text x="8" y={y+9}>{d.name}</text><circle cx={x(d.score)} cy={y} r={selected===i?11:8} fill={selected===i?P.green:P.blue}/><text x="870" y={y+9}>{f(d.score,2)}</text></g>})}</svg><aside className="lab-ablation-detail"><h3>{active.name}</h3><span>PSNR / dB ↑</span><strong className="lab-focal">{f(active.score,2)}</strong><div><span>FLOPs / G</span><strong>{active.flops}</strong></div><div><span>参数 / M</span><strong>{f(active.params,2)}</strong></div></aside></div></div>;
}

const tradeoff=[{width:48,score:29.71,time:.115,train:22.5},{width:64,score:29.63,time:.080,train:15.5},{width:80,score:29.56,time:.069,train:13.5}];
export function QualityCost(){
 const [selected,setSelected]=useState(0),active=tradeoff[selected];
 const lines=5+selected*2,blocks=4-selected;
 return <div className="lab-page width-depth-page">
 <div className="wd-controls"><span>Urban100 · σ=50</span>{tradeoff.map((d,i)=><Choice key={d.width} selected={selected===i} onClick={()=>setSelected(i)}>C={d.width}</Choice>)}<span>结构示意 · 非实际数量</span></div>
 <div className="wd-pair"><section><h3>宽度：一个块处理多少通道</h3><svg viewBox="0 0 704 220" role="img" aria-label={`宽度示意：基础通道数${active.width}，线条示意通道`}><rect x="120" y="10" width="464" height="144" rx="16" fill="#edf2f7" stroke={P.blue} strokeWidth="3"/>{Array.from({length:lines},(_,i)=><path key={i} d={`M165 ${30+i*113/(lines-1)}H539`} stroke={P.blue} strokeWidth="8" opacity={.35+i/lines*.5}/>)}<text x="352" y="209" textAnchor="middle">基础通道数 C = {active.width}</text></svg><p>C ↑ → 通道更多</p></section>
 <section><h3>深度：同类块前后重复多少次</h3><svg viewBox="0 0 704 220" role="img" aria-label={`深度示意：当前配置重复块${selected===0?'相对较多':selected===1?'适中':'相对较少'}，不是实际块数`}>
 {Array.from({length:blocks},(_,i)=>{const width=110,start=(704-(blocks*width+(blocks-1)*52))/2,x=start+i*(width+52);return <g key={i}><rect x={x} y="30" width={width} height="110" rx="12" fill="#e7f1ec" stroke={P.green} strokeWidth="3"/><text x={x+width/2} y="95" textAnchor="middle">块</text>{i<blocks-1&&<text x={x+width+26} y="95" textAnchor="middle">…</text>}</g>})}
 <text x="352" y="209" textAnchor="middle">{['通道较少 · 重复块较多','通道增加 · 重复块减少','通道更多 · 重复块更少'][selected]}</text></svg><p>块 = MDTA → GDFN</p></section></div>
 <div className="wd-results"><div><span>当前基础通道数</span><strong>C = {active.width}</strong></div><div><span>复原质量 · PSNR ↑</span><strong>{f(active.score,2)} dB</strong></div><div><span>256² 图像用时 ↓</span><strong>{f(active.time,3)} s</strong></div><p>{selected===0?'窄深：质量较高':'宽浅：推理较快'}<br/>参数量、FLOPs 相近</p></div>
 </div>;
}
