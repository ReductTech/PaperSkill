import React, { useState } from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import { SymbolHint as S } from '../components/SymbolHint';
import './rabbit.css';

const C={blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',skin:'#dfb99c',quiet:'#f1f5f0',line:'#d7deea'};
const tasks=['洗涤','冲洗','拍干'];
function Arm({y=190,offset=0}:{y?:number;offset?:number}) {return <g transform={`translate(${offset} ${y})`}><rect x="50" y="-50" width="720" height="155" rx="72" fill="#e1e7e2"/><path d="M100 25 Q135 -25 265 -10 L610 0 Q660 -26 705 4 L744 25 Q771 57 735 73 L640 79 L265 100 Q145 100 100 60Z" fill={C.skin} stroke="#b78e76" strokeWidth="3"/><path d="M648 21 L720 34 M646 39 L725 50 M643 57 L713 66" stroke="#bc977e" strokeWidth="3"/></g>}
function Tool({x,y=150,w=85,angle=0,color=C.green}:{x:number;y?:number;w?:number;angle?:number;color?:string}) {return <g className="rb-move" transform={`translate(${x} ${y}) rotate(${angle})`}><path d="M0 -90 V-48" stroke="#92400e" strokeWidth="18" strokeLinecap="round"/><rect x={-w/2} y="-49" width={w} height="20" rx="5" fill={C.blue}/><path d={`M${-w*.32} -29 v25 M${w*.32} -29 v25`} stroke={color} strokeWidth="5" strokeDasharray="5 4"/><rect x={-w/2} y="-4" width={w} height="22" rx="7" fill={color}/></g>}
function Art({children,label='前臂护理教学示意'}:{children:React.ReactNode;label?:string}) {return <svg className="rb-art" viewBox="0 0 860 400" role="img" aria-label={label}><rect width="860" height="400" rx="24" fill={C.quiet}/>{children}</svg>}
function Note({children,good=false}:{children:React.ReactNode;good?:boolean}) {return <div className={`rb-feedback ${good?'good':''}`} aria-live="polite">{children}</div>}
function Slider({label,value,min=0,max=1,step=.01,onChange,display}:{label:string;value:number;min?:number;max?:number;step?:number;onChange:(n:number)=>void;display?:string}) {return <label className="rb-slider"><span>{label}<b>{display??value}</b></span><input aria-label={label} type="range" value={value} min={min} max={max} step={step} onChange={e=>onChange(+e.target.value)}/></label>}
function Choice({items,value,onChange}:{items:string[];value:number;onChange:(n:number)=>void}) {return <div className="rb-choices">{items.map((s,i)=><button key={s} aria-pressed={i===value} onClick={()=>onChange(i)}>{s}</button>)}</div>}
function Explain({title,children}:{title:string;children:React.ReactNode}) {return <aside className="rb-explain"><h3>{title}</h3>{children}</aside>}

export function Cover({good}:{good:boolean}) {
  const {progress}=useCoverPlayback();const p=Math.max(0,Math.min(1,progress));
  return <div className="rb-cover"><Art label={good?'多模态识别薄水区域，工具柔顺贴合前臂':'单模态示意遗漏薄水区域'}><Arm/><path d="M300 202 Q390 175 510 204 L510 264 L300 277Z" fill={good?'#b3d6e7':'#d7b395'}/><path d="M315 219 Q400 196 490 220" stroke={good?C.blue:'#cfac90'} strokeWidth="7" fill="none"/><Tool x={good?290+230*p:160+90*p} y={good?202:170} color={good?C.green:C.red}/><text x="55" y="355" fill={good?C.green:C.red}>{good?'看清湿区，再柔顺接触':'颜色相近，薄水膜容易漏看'}</text></Art></div>
}

export function Task() {
  const [task,setTask]=useState(0);const names=['干皮肤','肥皂','水'];
  return <div className="rb-page rb-immersive"><div className="rb-topline"><Choice items={tasks} value={task} onChange={setTask}/><strong>当前处理：{names[task]}</strong></div><Art><Arm/><rect x="160" y="196" width="145" height="80" rx="25" fill={task===0?C.green:'#d8ac8d'} opacity=".75"/><g fill={task===1?C.green:'#fffdf4'}>{[0,1,2,3,4].map(i=><circle key={i} cx={350+i*24} cy={227+(i%2)*15} r="24"/>)}</g><path d="M520 207 Q580 190 620 221 L612 263 L520 276Z" fill={task===2?C.green:'#9bc6d7'} opacity=".8"/><Tool x={[230,400,565][task]} y={task===2?150:202}/><text x="175" y="340">干皮肤</text><text x="365" y="340">肥皂</text><text x="550" y="340">水</text></Art><Note good>{tasks[task]}选择{names[task]}掩膜。背景始终排除；动作类型由护理阶段决定。</Note></div>
}

export function Thermal() {
  const [delta,setDelta]=useState(12);const visible=delta>=3;
  return <div className="rb-page rb-two"><div><div className="rb-pair"><div><h3>RGB：薄水膜颜色接近皮肤</h3><Art><Arm/><path d="M340 205 Q420 188 500 214 L500 271 L340 280Z" fill="#d8b79c"/><text x="265" y="350">视觉线索很弱</text></Art></div><div><h3>热图：比较局部温差</h3><Art><Arm/><path className="rb-move" d="M340 205 Q420 188 500 214 L500 271 L340 280Z" fill={C.blue} opacity={delta/16}/><text x="240" y="350">{visible?'可区分的凉水区域':'温差减弱，区域趋同'}</text></Art></div></div><Slider label="皮肤与水的温差" value={delta} min={0} max={16} step={1} onChange={setDelta} display={`${delta} °C`}/><Note good={visible}>{visible?'热信息提供额外区域线索。':'接近热平衡时，热成像的区分优势减弱。'}</Note></div><Explain title="为什么需要两种模态？"><p>水在RGB里近乎透明，肥皂泡沫却有明显视觉特征。</p><p>RGB保留外观，热成像补充温差信息；二者各有所长。</p><p>图中3°C判定仅为教学设定，未运行分割网络。</p></Explain></div>
}

export function Fusion() {
 const [c,setC]=useState(.8);const score=.3*(1-c)+.9*c;const detected=score>=.6;
 return <div className="rb-page rb-two"><div className="rb-fusion"><div className="rb-feature-row">{['RGB局部特征','热局部特征','融合后特征'].map((x,i)=><div key={x}><h3>{x}</h3><svg viewBox="0 0 240 190" role="img" aria-label={x}><rect x="5" y="5" width="230" height="180" rx="18" fill="#eef2ed"/>{Array.from({length:12},(_,j)=><rect key={j} x={25+j%4*48} y={25+Math.floor(j/4)*48} width="39" height="39" rx="7" fill={j===5||j===6||j===9?C.blue:C.skin} opacity={j===5||j===6||j===9?[.3,.9,score][i]:.65}/>)}</svg><strong>{[.3,.9,score][i].toFixed(2)}</strong></div>)}</div><Slider label="热特征的相对权重（示意）" value={c} onChange={setC} display={`${Math.round(c*100)}%`}/><div className="rb-equation"><S meaning="s：示意融合分数，不是CMX输出或论文性能。">s</S> = 0.30 × (1 − <S meaning="c：教学中调节的热特征权重，范围0至1；CMX实际使用学习到的校正和融合模块。">c</S>) + 0.90 × <S meaning="c：同一个热特征权重。">c</S></div><Note good={detected}>{detected?'融合示意判为水区域。':'融合示意尚未判为水区域。'} 阈值0.60为教学设定。</Note></div><Explain title="CMX的实际结构"><p>跨模态特征校正模块利用互补信息调整特征。</p><p>特征融合模块进一步整合RGB与热特征，再用于分割。</p><p>这里的加权计算只解释“如何利用互补线索”，不复现CMX网络。</p></Explain></div>
}

export function Dataset() {
 return <div className="rb-page rb-data"><div className="rb-data-main"><h3>SBP：物理采集的RGB—热图像对</h3><div className="rb-count">1,389 对</div>{[{name:'低分辨率热相机',a:392,b:397,total:789},{name:'高分辨率热相机',a:360,b:240,total:600}].map(r=><div className="rb-data-row" key={r.name}><p>{r.name} · {r.total} 对</p><div className="rb-stack"><span style={{flex:r.a}}>假人 {r.a}</span><span style={{flex:r.b}}>真人 {r.b}</span></div></div>)}<p>ImageNet预训练初始化；SBP按 8 : 1 : 1 划分训练、验证、测试。</p></div><Explain title="增强假人提供可控变化"><p>六种肤色、两种毛发条件、五种覆盖状态、六个相机视角。</p><p>加热假人以近似人体热特征；同时采集4名真人的数据。</p><p>保留局部热伪影。论文未说明按受试者独立划分，跨人泛化仍需谨慎评估。</p></Explain></div>
}

export function Sra() {
 const [r,setR]=useState(0);const n=r?32:8;const h=r?16:4;
 return <div className="rb-page rb-two"><div><svg className="rb-heat" viewBox="0 0 860 350" role="img" aria-label="同一湿区域的不同空间采样示意"><rect width="860" height="350" rx="24" fill={C.quiet}/>{Array.from({length:n*h},(_,i)=>{const x=i%n,y=Math.floor(i/n);const wet=Math.pow((x/n-.52)*2,2)+Math.pow((y/h-.5)*2,2)<.35;return <rect key={`${r}-${i}`} x={35+x*790/n} y={25+y*300/h} width={790/n-2} height={300/h-2} rx="2" fill={wet?C.blue:C.skin}/>})}</svg><Choice items={['低分辨率训练','高分辨率微调']} value={r} onChange={setR}/><Note good>{r?'高分辨率数据细化边界。':'先用低分辨率数据学习全局特征。'} 网格仅示意采样差异。</Note></div><Explain title="Sequential Resolution Adaptation"><div className="rb-big">{r?'256 × 192':'24 × 32'}</div><p>{r?'P2Pro高分辨率热相机':'MLX90640低分辨率热相机'}</p><p>顺序固定为“先低、后高”。同一个CMX模型经过后续微调，形成CMX-SRA。</p><p>这是训练策略；并非推理时并联两个热相机，也不意味着低分辨率一定更好。</p></Explain></div>
}

export function Waypoints() {
 const [w,setW]=useState(60);const n=Math.ceil(240/w);
 return <div className="rb-page rb-workbench"><div className="rb-pathwork"><svg viewBox="0 0 900 420" role="img" aria-label={`${n}条覆盖条带`}><rect width="900" height="420" rx="24" fill={C.quiet}/><path d="M120 75 Q80 210 120 345 H780 Q820 210 780 75Z" fill={C.skin}/><rect x="160" y="90" width="570" height="240" rx="20" fill="#d9e9d9" stroke={C.green} strokeWidth="4"/>{Array.from({length:n},(_,i)=>{const y=90+(i+.5)*240/n;return <g key={i}><path d={`M175 ${y} H715`} stroke={C.blue} strokeWidth="4" strokeDasharray="10 8"/><circle cx="175" cy={y} r="8" fill={C.orange}/><circle cx="715" cy={y} r="8" fill={C.orange}/></g>})}<g className="rb-move" transform={`translate(380 ${90+120/n})`}><rect x="-38" y={-w/2} width="76" height={w} rx="9" fill={C.green}/><path d="M0 0 L0 -85 L-90 -85" fill="none" stroke="#92400e" strokeWidth="12"/></g></svg></div><Explain title="从区域到轨迹"><div className="rb-big">{n} 条覆盖条带</div><p>目标区宽240个示意单位，工具宽{w}；无重叠简化下向上取整。</p><Slider label="工具宽度（示意单位）" value={w} min={40} max={100} step={10} onChange={setW}/><p>论文根据掩膜边界和工具尺寸选择2D路点，再利用深度映射到3D。</p><Note good>调窄工具，需增加覆盖条带；真实路径还受轮廓和任务约束。</Note></Explain></div>
}

export function Motion() {
 const [mode,setMode]=useState(0),[p,setP]=useState(.35);let x=150,y=200;
 if(mode===0){const t=p*3,seg=Math.min(2,Math.floor(t));x=150+(seg%2?t-seg:1-(t-seg))*530;y=175+seg*38;}
 if(mode===1){const t=p*2;x=150+(t%1)*530;y=195;}
 if(mode===2){const t=p*5,seg=Math.min(4,Math.floor(t)),a=t-seg;x=170+seg*105+Math.min(1,a*2)*105;y=200-75*Math.sin(a*Math.PI);}
 return <div className="rb-page rb-motion"><div className="rb-topline"><Choice items={tasks} value={mode} onChange={setMode}/><div className="rb-equation"><S meaning="p_t：时刻t的期望位姿与期望力组合。">pₜ</S> = [ <S meaning="ξ_d,t：期望末端6自由度位姿，包含位置与姿态。">ξd,ₜ</S> ; <S meaning="f_d,t：期望末端3自由度力。">fd,ₜ</S> ]</div></div><Art><Arm/><path d={mode===0?'M150 175 H680 V213 H150 V251 H680':mode===1?'M150 195 H680 M150 235 H680':'M170 200 Q220 50 275 200 Q325 50 380 200 Q430 50 485 200 Q535 50 590 200 Q640 50 695 200'} fill="none" stroke={C.blue} strokeWidth="5" strokeDasharray="10 7"/><Tool x={x} y={y}/><text x="60" y="355">{['连续上下擦拭，保持期望接触力','同向长擦并重复两次，回程示意省略','路点间抬起，再下降拍干'][mode]}</text></Art><div className="rb-motion-bottom"><Slider label="轨迹进度" value={p} onChange={setP} display={`${Math.round(p*100)}%`}/><p>位姿和力共同参数化；轨迹是教学示意，未给出临床力值。</p></div></div>
}

export function Controller() {
 const [d,setD]=useState(0),[mode,setMode]=useState(1);const contact=d>=30;const penetration=mode?0:Math.max(0,d-30);const y=150+Math.min(d,mode?30:60);
 return <div className="rb-page rb-two"><div><Art><path d="M80 230 Q400 170 780 230 L780 320 H80Z" fill={C.skin}/><path d="M90 230 Q420 169 770 230" fill="none" stroke="#b98f77" strokeWidth="4"/><path d={`M480 80 V${150+d}`} stroke={C.orange} strokeWidth="4" strokeDasharray="8 8"/><circle cx="480" cy={150+d} r="8" fill={C.orange}/><Tool x={420} y={y} color={mode?C.green:C.red}/><text x="65" y="365">{contact?mode?'接触后：法向力优先':'刚性追踪：继续压入表面':'接近阶段：位姿追踪'}</text></Art><Slider label="向下移动目标（示意单位）" value={d} max={60} step={1} onChange={setD}/><Note good={!!mode}>{contact?mode?'法向接触交由力反馈调节。':`示意压入量 ${penetration}：位置误差减小，接触风险却增加。`:'工具尚未接触，先跟踪接近位姿。'}</Note></div><Explain title="反馈控制与增益调度"><Choice items={['刚性位置追踪','柔顺接触']} value={mode} onChange={setMode}/><p>接触后，z轴力控制优先于位置控制；其余方向继续服务于擦拭轨迹。</p><p>论文以PID跟踪位姿、PD跟踪力，并补偿摩擦和重力。</p><p>洗涤、冲洗采用较高刚度；拍干减小刚度。图形仅演示状态切换，不求解真实控制方程。</p></Explain></div>
}

export function Scrubby() {
 const [a,setA]=useState(0);const slope=Math.tan(a*Math.PI/180);const spring=(x:number)=>{const bottom=230+(x-430)*slope;return `M${x} 120 L${x-10} 135 L${x+10} 150 L${x-10} 165 L${x+10} 180 L${x-10} ${(bottom+180)/2} L${x} ${bottom}`};
 return <div className="rb-page rb-spring"><div><Art label="Scrubby四角弹簧压缩和倾斜的二维投影示意"><path d={`M130 ${270-270*slope} L730 ${270+330*slope} L730 350 H130Z`} fill={C.skin}/><rect x="245" y="100" width="370" height="22" rx="8" fill={C.blue}/><path d="M430 100 V35" stroke="#92400e" strokeWidth="20"/>{[280,340,520,580].map(x=><path key={x} className="rb-move" d={spring(x)} fill="none" stroke={C.green} strokeWidth="5"/>)}<g className="rb-move" transform={`rotate(${a} 430 245)`}><rect x="245" y="225" width="370" height="23" rx="6" fill={C.blue}/><rect x="240" y="248" width="380" height="30" rx="12" fill={C.green}/></g><path d="M245 120 L245 230 M615 120 L615 230" stroke="#8b9494" strokeDasharray="6 5" strokeWidth="4"/></Art><Slider label="局部表面倾角" value={a} min={-12} max={12} step={1} onChange={setA} display={`${a}°`}/></div><Explain title="被动机械适应"><div className="rb-big">四角弹簧 + 软海绵</div><p>顶板由夹爪保持，底板可压缩和倾斜；编织钢丝限制过大剪切位移。</p><p>DIGIT的力读数可能有噪声，硬件柔顺为软件反馈补充剩余适应能力。</p><Note good>改变倾角，弹簧长度与底板姿态一起变化；没有模拟真实弹簧刚度。</Note></Explain></div>
}

const results=[['SegFormer',86.86,75.16],['RTFNet',87.49,77.84],['MFNet',87.25,77.56],['CMX',88.23,78.55],['CMX-SRA',94.20,89.43]] as const;
export function Benchmark() {
 const [m,setM]=useState(0);return <div className="rb-page rb-results"><div className="rb-topline"><Choice items={['平均IoU','水类IoU']} value={m} onChange={setM}/><p>SBP测试集 · IoU（%）· 越高越好 · 论文表1</p></div><div className="rb-barplot">{results.map((r,i)=><div className="rb-bar-row" key={r[0]}><span>{r[0]}</span><div className="rb-bar-track"><div className="rb-bar" style={{width:`${r[m+1]}%`,background:i===4?C.green:C.blue}}/></div><b>{Number(r[m+1]).toFixed(2)}</b></div>)}<div className="rb-axis"><span>0</span><span>50</span><span>100%</span></div></div><Note good>CMX-SRA相比CMX提高 {m?'10.88':'5.97'} 个百分点。RGB-T基础模型并非在所有类别均优于RGB：肥皂类是反例。</Note></div>
}

export function Study() {
 return <div className="rb-page rb-study"><div className="rb-study-pop"><h3>12名参与者 · 仅前臂任务</h3><svg viewBox="0 0 650 200" role="img" aria-label="11名无行动障碍参与者和1名多发性硬化症参与者">{Array.from({length:12},(_,i)=><g key={i} transform={`translate(${28+i*51} 35)`}><circle cx="12" cy="12" r="12" fill={i===11?C.orange:C.blue}/><rect x="0" y="30" width="25" height="55" rx="10" fill={i===11?C.orange:C.blue}/><path d="M6 80 V122 M20 80 V122" stroke={i===11?C.orange:C.blue} strokeWidth="8"/></g>)}</svg><p>11名无行动障碍；1名严重行动障碍的MS参与者。</p><p>每人：三项任务各3次 + 完整序列1次，共10次试验。</p><p>评分为主观1–5分；5代表更舒适或表现更好。</p></div><div className="rb-study-score"><h3>完整序列的总体评价</h3><div className="rb-score"><span>舒适度</span><strong>4.83 ± 0.58</strong></div><div className="rb-score"><span>表现</span><strong>4.33 ± 0.78</strong></div><p>论文 §4.2 原样报告均值及±项；这里不将±解释为置信区间。</p><Note>专家5分是解释结果的假设基准，研究没有设置真实护理者对照组。</Note><p>拍干力一致性较低；1名MS参与者的结果只是初步可行性证据。</p></div></div>
}

export function Limits() {
 const [o,setO]=useState(0);const miss=Math.abs(o)>30;
 return <div className="rb-page rb-two"><div><Art><Arm offset={o}/><path d="M180 235 H650" stroke={C.blue} strokeWidth="6" strokeDasharray="14 10"/><path d={`M${180+o} 225 H${650+o}`} stroke={miss?C.red:C.green} strokeWidth="16" opacity=".4"/><Tool x={190} y={215}/><text x="55" y="355">蓝线：冻结的计划　彩带：当前目标区域</text></Art><Slider label="计划生成后手臂偏移（示意单位）" value={o} min={-80} max={80} step={10} onChange={setO}/><Note good={!miss}>{miss?'原计划与移动后的目标错位，需要感知与反应式重规划。':'目标与计划大致重合；继续移动手臂观察偏差。'}</Note></div><Explain title="从演示走向长期护理"><p>当前规划是开环；低层力反馈闭环不能自动跟随身体运动或重新处理残留水、肥皂。</p><p>全身触达、隐藏部位、手指缝与敏感区域，仍需移动、肢体与灵巧操作能力。</p><p>论文仅做初始力偏好校准；在线偏好适应和更广泛人群研究尚待开展。</p><p>偏移判定阈值30为教学设定。</p></Explain></div>
}
