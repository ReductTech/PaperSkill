import React,{useState} from 'react';
import {palette as P,f,Feedback,Camera,Choice} from './restoration-kit';

const motion=[{name:'GoPro',old:32.66,now:32.92,kind:'训练数据集对应的测试集'},{name:'HIDE',old:30.96,now:31.22,kind:'不再训练，直接测试'},{name:'RealBlur-R',old:35.99,now:36.19,kind:'不再训练，直接测试'},{name:'RealBlur-J',old:28.70,now:28.96,kind:'不再训练，直接测试'}];
export function MotionResults(){
 const [selected,setSelected]=useState(0),active=motion[selected];
 return <div className="lab-page lab-motion"><div className="lab-evidence-caption"><span>表 2 · PSNR / dB，越高越好</span><span>Restormer 仅在 GoPro 训练</span><Camera size={64}/></div>
 <svg className="lab-motion-chart" viewBox="0 0 1472 430" aria-label="运动去模糊的PSNR对比和增益"><text x="20" y="32">数据集</text><text x="260" y="32" fill={P.blue}>MPRNet</text><text x="590" y="32">Restormer 的增益</text><text x="1200" y="32" fill={P.green}>Restormer</text>{motion.map((d,i)=>{const y=90+i*80,gain=d.now-d.old,w=gain/.4*500;return <g key={d.name} className="lab-chart-choice" role="button" tabIndex={0} aria-label={`查看${d.name}`} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i)}}}><rect x="0" y={y-34} width="1472" height="70" rx="10" fill={selected===i?'#edf3ef':'#f8f6f0'}/><text x="20" y={y+10}>{d.name}</text><text x="280" y={y+10} fill={P.blue}>{f(d.old,2)}</text><path d={`M570 ${y}H1070`} stroke="#e0e5e1" strokeWidth="19"/><path d={`M570 ${y}H${570+w}`} stroke={P.green} strokeWidth="19"/><text x={590+w} y={y+10} fill={P.green}>+{f(gain,2)}</text><text x="1220" y={y+10} fill={P.green}>{f(d.now,2)}</text></g>})}{[0,.1,.2,.3,.4].map(v=><g key={v}><path d={`M${570+v/.4*500} 378v8`} stroke="#8e9ca7"/><text x={570+v/.4*500} y="423" textAnchor="middle">{f(v,1)}</text></g>)}</svg>
 <Feedback tone="green">{active.name}：{active.kind}，提升 {f(active.now-active.old,2)} dB。其他数据集上的直接测试说明了该设置下的迁移表现，不代表所有真实退化。</Feedback></div>;
}

const taskGroups=[
 {title:'去雨',protocol:'Y 通道 · 五数据集平均',rows:[{label:'SPAIR → Restormer',old:32.91,now:33.96}]},
 {title:'真实去噪',protocol:'SIDD 训练 · DND 直接测试',rows:[{label:'SIDD / Uformer',old:39.77,now:40.02},{label:'DND / Uformer',old:39.96,now:40.03}]},
 {title:'散焦去模糊',protocol:'DPDD combined · 对照 IFAN',rows:[{label:'单图输入',old:25.37,now:25.98},{label:'双像素输入',old:25.99,now:26.66}]},
];
export function TaskResults(){
 return <div className="lab-page lab-task-results"><div className="lab-evidence-caption"><span>表 1、3、6 · PSNR / dB ↑</span><span>每一组独立训练、独立评测</span><Camera size={64}/></div><div className="lab-task-columns">{taskGroups.map((g,i)=><section key={g.title}><div className="lab-task-heading"><span>0{i+1}</span><h3>{g.title}</h3></div><p>{g.protocol}</p><div className="lab-task-chart">{g.rows.map(row=><div className="lab-task-row" key={row.label}><span>{row.label}</span><div className="lab-task-score"><strong>{f(row.old,2)}</strong><span>→</span><strong>{f(row.now,2)}</strong></div><div className="lab-task-delta"><div className="lab-gain-track"><i style={{width:`${(row.now-row.old)/1.2*100}%`}}/></div><div className="lab-task-gain">+{f(row.now-row.old,2)} dB</div></div></div>)}</div></section>)}</div><Feedback>条长表示同协议下的增益（统一 0–1.2 dB 刻度）。不同任务、数据集及单图/双像素输入不能混合排名。</Feedback></div>;
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
 return <div className="lab-page lab-ablation"><div className="lab-evidence-caption"><span>表 7、8 · Urban100 彩色去噪 · σ=50</span><span>100K 次消融训练</span><Camera size={64}/></div><div className="lab-ablation-main"><svg viewBox="0 0 1000 425" aria-label="各模型配置的PSNR和计算量">{[29,29.2,29.4,29.6,29.8].map(v=><g key={v}><path d={`M${x(v)} 8V368`} stroke="#d7deea"/><text x={x(v)} y="420" textAnchor="middle">{f(v,1)}</text></g>)}{ablation.map((d,i)=>{const y=32+i*52;return <g key={d.name} role="button" tabIndex={0} className="lab-chart-choice" aria-label={`查看${d.name}`} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i)}}}><rect x="0" y={y-25} width="1000" height="49" rx="8" fill={selected===i?'#e9f1ec':'transparent'}/><text x="8" y={y+9}>{d.name}</text><circle cx={x(d.score)} cy={y} r={selected===i?11:8} fill={selected===i?P.green:P.blue}/><text x="870" y={y+9}>{f(d.score,2)}</text></g>})}</svg><aside className="lab-ablation-detail"><h3>{active.name}</h3><span>PSNR / dB ↑</span><strong className="lab-focal">{f(active.score,2)}</strong><div><span>FLOPs / G</span><strong>{active.flops}</strong></div><div><span>参数 / M</span><strong>{f(active.params,2)}</strong></div></aside></div><Feedback>模块组合与顶层设计带来质量增益，也可能增加计算量。前五行是配置对照；后两行依次去掉顶层 1 × 1 降维、加入 refinement。</Feedback></div>;
}

const tradeoff=[{width:48,score:29.71,time:.115,train:22.5},{width:64,score:29.63,time:.080,train:15.5},{width:80,score:29.56,time:.069,train:13.5}];
export function QualityCost(){
 const [selected,setSelected]=useState(0),active=tradeoff[selected],x=(time:number)=>140+(time-.06)/.06*700,y=(score:number)=>350-(score-29.5)/.3*290;
 return <div className="lab-page lab-tradeoff"><div className="lab-evidence-caption"><span>表 10 · 调整块数，保持参数与 FLOPs 相近</span><span>Urban100 · σ=50</span><Camera size={64}/></div><div className="lab-tradeoff-main"><svg viewBox="0 0 1000 430" aria-label="宽度与质量延迟权衡散点图">{[.06,.08,.10,.12].map(v=><g key={v}><path d={`M${x(v)} 45V350`} stroke="#e0e5e1"/><text x={x(v)} y="395" textAnchor="middle">{f(v,2)}</text></g>)}{[29.5,29.6,29.7,29.8].map(v=><g key={v}><path d={`M140 ${y(v)}H840`} stroke="#e0e5e1"/><text x="110" y={y(v)+9} textAnchor="end">{f(v,1)}</text></g>)}<text x="140" y="30">PSNR / dB ↑</text><text x="685" y="430">推理时间 / s →</text>{tradeoff.map((d,i)=><g key={d.width} role="button" tabIndex={0} className="lab-chart-choice" aria-label={`选择宽度${d.width}`} onClick={()=>setSelected(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(i)}}}><circle cx={x(d.time)} cy={y(d.score)} r="26" fill="transparent"/><circle cx={x(d.time)} cy={y(d.score)} r={selected===i?13:9} fill={selected===i?P.green:P.blue}/><text x={x(d.time)+(i===0?-25:20)} y={y(d.score)-23} textAnchor={i===0?'end':'start'}>宽 {d.width}</text></g>)}</svg><aside className="lab-tradeoff-detail"><h3>更准与更快，需要取舍</h3><div className="lab-width-choices">{tradeoff.map((d,i)=><Choice key={d.width} selected={selected===i} onClick={()=>setSelected(i)}>{d.width}</Choice>)}</div><strong className="lab-focal">{f(active.score,2)} dB</strong><p>{f(active.time,3)} s / 张<br/>训练 {active.train} h</p><p>{selected===0?'窄而深的模型质量更高，是论文采用的方案。':'宽而浅的模型推理更快，但该消融设置下 PSNR 较低。'}</p></aside></div><Feedback>这些延迟来自论文的 256 × 256 测试条件，不是本网页测速。FLOPs 相近不意味着设备上的实际延迟相同。</Feedback></div>;
}
