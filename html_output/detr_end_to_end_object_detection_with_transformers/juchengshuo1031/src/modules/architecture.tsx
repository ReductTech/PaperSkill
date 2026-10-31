import React,{useState} from 'react';
import {useCoverPlayback} from '../components/CoverPlayback';
const blue='#27446e',green='#228d5c',red='#c43f52',orange='#f07e47';
const base:React.CSSProperties={height:'100%',fontSize:28,color:'#21324a',display:'flex',gap:32,alignItems:'stretch'};
const button:React.CSSProperties={fontSize:28,padding:'14px 24px',border:'2px solid #d7deea',borderRadius:12,background:'white',color:blue,cursor:'pointer'};
function Person({x,y,color=blue}:{x:number,y:number,color?:string}){return <g transform={`translate(${x},${y})`}><circle cy={-46} r={20} fill='#e8b38b'/><path d='M-30 6 Q-34 -25 0 -25 Q34 -25 30 6 L24 58 H-24Z' fill={color}/><path d='M-15 58V100 M15 58V100' stroke={blue} strokeWidth={15} strokeLinecap='round'/></g>}
function Photo({unique=false,progress=1}:{unique?:boolean,progress?:number}){return <svg viewBox='0 0 664 324' width='100%' height='100%' aria-label='合影登记的示意动画'><rect width='664' height='324' rx='20' fill='#f5f8f0'/><path d='M0 265H664' stroke='#b8c9a7' strokeWidth='8'/>{[135,330,525].map((x,i)=><Person key={x} x={x} y={160} color={i===1?green:blue}/>)}{[135,330,525].map((x,i)=><g key={x} opacity={Math.min(1,progress*3-i*.4)}><rect x={x-49} y={81} width={98} height={185} fill='none' stroke={unique?green:red} strokeWidth='5' rx='10'/>{!unique&&<rect x={x-35} y={90} width={98} height={185} fill='none' stroke={red} strokeWidth='4' strokeDasharray='9 6' rx='10'/>}</g>)}</svg>}
export function CoverOld(){const {progress}=useCoverPlayback();return <Photo progress={progress} />}
export function CoverNew(){const {progress}=useCoverPlayback();return <Photo unique progress={progress}/>}
export function Motivation(){const [unique,setUnique]=useState(false);return <div style={base}><div style={{width:850,display:'flex',flexDirection:'column',gap:20}}><Photo unique={unique}/><button style={{...button,borderColor:unique?green:red}} onClick={()=>setUnique(!unique)}>{unique?'已采用唯一登记：查看重复候选':'将重复候选改为唯一登记'}</button></div><div style={{flex:1,padding:'20px 0'}}><h3 style={{fontSize:34,marginTop:0}}>从候选框到预测集合</h3><p style={{lineHeight:1.65}}>传统检测流程依赖候选框或锚点，并通过非极大值抑制（NMS）合并近似重复预测。</p><p style={{lineHeight:1.65,color:unique?green:blue}}>{unique?'DETR 在训练中以一对一匹配约束集合预测，直接输出类别和框，不需要 NMS。':'合影被重复圈选，说明独立候选需要处理冗余。点击左侧，将登记规则改为唯一对应。'}</p><p style={{lineHeight:1.55}}>合影仅是概念示意；切换规则并不是一次模型推理或训练。</p></div></div>}
export function Architecture(){
 return <div style={{height:622,width:1472,display:'flex',flexDirection:'column',gap:22,color:'#21324a',fontSize:28}}>
  <img src="./images/detr-architecture-original.svg" alt="自绘 DETR 结构示意：CNN 主干提取图像特征，与位置编码一起进入编码器；object queries 和编码器输出进入解码器，各槽位经共享预测头输出类别与框或 no object。" style={{display:'block',width:1472,height:366,objectFit:'contain',flexShrink:0}} />
  <div style={{background:'#eef3f8',padding:'22px 28px',borderRadius:14,fontSize:28,lineHeight:1.65}}>
   CNN 与编码器提取图像信息，解码器结合 object queries 并行预测目标。<br/>
   每个预测槽位输出类别与边界框，或标记为“无目标”（∅）。
  </div>
 </div>
}
export function Queries(){
 const [selected,setSelected]=useState(0);
 const examples=[{label:'示例槽位 A',cell:7,person:0},{label:'示例槽位 B',cell:41,person:2},{label:'示例槽位 C',cell:75,person:-1}];
 const active=examples[selected];
 return <div style={{height:622,width:1472,display:'flex',flexDirection:'column',gap:24,color:'#21324a',fontSize:28}}>
  <div style={{display:'grid',gridTemplateColumns:'370px 44px 420px 44px 498px',gap:24,height:480}}>
   <section><h3 style={{fontSize:34,margin:'0 0 24px'}}>输入图像</h3><svg viewBox="0 0 370 290" width="370" height="290" role="img" aria-label="合成合影示意，选中目标槽位时显示相应的示意边界框"><rect width="370" height="290" rx="16" fill="#f5f8f0"/><path d="M0 260 H370" stroke="#b8c9a7" strokeWidth="6"/>{[65,185,305].map((x,i)=><g key={i}><Person x={x} y={140} color={blue}/>{active.person===i&&<rect x={x-44} y={65} width={88} height={185} fill="none" stroke={green} strokeWidth="4" rx="5"/>}</g>)}</svg><p style={{margin:'18px 0',lineHeight:1.5}}>经 CNN 与编码器提取图像信息，供解码器读取。</p></section>
   <div style={{alignSelf:'center',fontSize:44,color:blue}}>→</div>
   <section><h3 style={{fontSize:34,margin:'0 0 24px'}}>100 个预测槽位</h3><div style={{display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:7,height:290}} aria-label="100个槽位；只突出展示任意三个示例，其余输出未展开">{Array.from({length:100},(_,i)=>{const e=examples.findIndex(x=>x.cell===i);return <div key={i} style={{borderRadius:4,background:e===selected?orange:e>=0?blue:'#e7ecf1',color:'white',display:'grid',placeItems:'center',fontSize:28}}>{e>=0?['A','B','C'][e]:''}</div>})}</div><p style={{margin:'18px 0',lineHeight:1.5}}>每个槽位由一个可学习 query 区分；每层并行处理全部槽位。</p></section>
   <div style={{alignSelf:'center',fontSize:44,color:blue}}>→</div>
   <section><h3 style={{fontSize:34,margin:'0 0 24px'}}>展开一个槽位的输出</h3><div style={{display:'flex',gap:12,marginBottom:22}}>{examples.map((e,i)=><button key={e.label} aria-pressed={i===selected} onClick={()=>setSelected(i)} style={{...button,padding:'12px 18px',background:i===selected?blue:'white',color:i===selected?'white':blue}}>{['槽位 A','槽位 B','槽位 C'][i]}</button>)}</div><div style={{background:'#eef3f8',borderRadius:16,padding:26,minHeight:220,boxSizing:'border-box'}}><div style={{fontSize:44,color:active.person<0?blue:green,marginBottom:20}}>{active.person<0?'∅ 无目标':'类别：人'}</div><p style={{lineHeight:1.55,margin:0}}>{active.person<0?'该槽位的类别输出为“无目标”，不对应一个有效目标检测。':'边界框：见左侧绿色框。类别与框由该槽位的输出表示经共享预测头得到。'}</p></div><p style={{margin:'18px 0',lineHeight:1.5}}>点击 A、B、C 比较输出；其余槽位未展开。</p></section>
  </div>
  <div style={{borderTop:'2px solid #d7deea',paddingTop:20,lineHeight:1.6}}>100 是槽位数，不是图中目标数；槽位并不固定绑定某个人或某一类别。<br/>此图与 A／B／C 的对应关系均为教学示意，不是模型推理结果。</div>
 </div>
}
