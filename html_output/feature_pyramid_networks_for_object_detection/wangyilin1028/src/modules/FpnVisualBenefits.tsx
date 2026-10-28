import React,{useState} from 'react';
import {C,Choice,Feedback} from './FpnKit';
import {SymbolHint} from '../components/SymbolHint';
import {makeFeatureExample,upsampleFeature,addFeature,FeatureView} from './FpnFeatureView';
const cellStyle:React.CSSProperties={width:48,height:48,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${C.line}`,padding:0,fontSize:28,lineHeight:1,borderRadius:6,color:C.ink,fontFamily:'inherit'};
function Matrix({values,n,onEdit,selected=-1,tone=C.blue}:{values:number[];n:number;onEdit?:(i:number)=>void;selected?:number;tone?:string}){
 return <div style={{display:'grid',gridTemplateColumns:`repeat(${n},48px)`,gap:3}}>{values.map((v,i)=>onEdit?<button key={i} type="button" aria-label={`修改${n}乘${n}输入第${Math.floor(i/n)+1}行第${i%n+1}列，当前${v}`} onClick={()=>onEdit(i)} style={{...cellStyle,cursor:'pointer',background:v?`${tone}20`:'#fff',border:`${selected===i?3:1}px solid ${selected===i?C.orange:C.line}`}}>{v}</button>:<div key={i} style={{...cellStyle,background:v?`${tone}20`:'#fff',border:`${selected===i?3:1}px solid ${selected===i?C.orange:C.line}`}}>{v}</div>)}</div>;
}
export function FpnFusion(){
 const [model,setModel]=useState(makeFeatureExample);const [view,setView]=useState<'image'|'numbers'>('image');const [lateral,setLateral]=useState(true);const [selected,setSelected]=useState(5*16+6);
 const up=upsampleFeature(model.top),out=addFeature(model.detail,up,1,lateral);const row=Math.floor(selected/16),col=selected%16;const wr=Math.floor(row/4)*4,wc=Math.floor(col/4)*4;
 const indices=Array.from({length:16},(_,i)=>(wr+Math.floor(i/4))*16+wc+i%4);const topIndices=Array.from({length:4},(_,i)=>(wr/2+Math.floor(i/2))*8+wc/2+i%2);const local=(row-wr)*4+col-wc;
 const editDetail=(i:number)=>{const index=indices[i];setModel(m=>({...m,detail:m.detail.map((v,j)=>j===index?(v+1)%4:v)}));setSelected(index);};
 const editTop=(i:number)=>{const index=topIndices[i];setModel(m=>({...m,top:m.top.map((v,j)=>j===index?(v+1)%4:v)}));setSelected((wr+Math.floor(i/2)*2)*16+wc+i%2*2);};
 return <div className="fpn-scene" style={{gap:16}}>
   <div className="fpn-row" style={{height:76,gap:16,alignItems:'center'}}><Choice active={view==='image'} onClick={()=>setView('image')}>先看特征图</Choice><Choice active={view==='numbers'} onClick={()=>setView('numbers')}>再看局部计算</Choice><label style={{display:'flex',gap:14,alignItems:'center',marginLeft:'auto',cursor:'pointer'}}><input type="checkbox" aria-label="加入横向细节" checked={lateral} onChange={e=>setLateral(e.target.checked)} style={{width:28,height:28,accentColor:C.green}}/>加入横向细节</label></div>
   {view==='image'?<div className="fpn-row" style={{height:392,gap:64}}>
     <div className="fpn-col" style={{width:448,alignItems:'center',gap:12}}><h3>细节：边界多，提示少</h3><FeatureView values={model.detail} selected={selected} onPick={setSelected} windowStart={[wr,wc]} label="横向细节特征；点击选择同一位置，方向键移动观察点。"/><p>边界也可能来自背景</p></div>
     <div className="fpn-col" style={{width:448,alignItems:'center',gap:12}}><h3>上层：有提示，位置粗</h3><FeatureView values={up} tone="top" selected={selected} onPick={setSelected} windowStart={[wr,wc]} label="最近邻上采样后的上层提示；点击选择对应位置。"/><p>放大后仍是成块响应</p></div>
     <div className="fpn-col" style={{width:448,alignItems:'center',gap:12}}><h3>{lateral?'融合：提示与边界同在':'关闭横向：只有粗提示'}</h3><FeatureView values={out} tone="fused" selected={selected} onPick={setSelected} windowStart={[wr,wc]} label="融合特征；点击选中位置，比较输入贡献与输出，橙框对应可查看的4×4局部。"/><p>橙框局部与数值视图对应</p></div>
   </div>:<div className="fpn-col" style={{height:392,gap:10}}>
     <div className="fpn-formula" style={{height:60,lineHeight:'60px'}}><SymbolHint meaning="M_l：当前16×16中间融合特征，下面展开橙色4×4局部。">Mₗ</SymbolHint> = <SymbolHint meaning="Up(M_l+1)：8×8上层响应经最近邻上采样至16×16。">Up(Mₗ₊₁)</SymbolHint>{lateral?' ＋ ':'；未加入 '}<SymbolHint meaning="L_l：C_l经1×1卷积对齐后的横向响应。">Lₗ</SymbolHint></div>
     <div className="fpn-row" style={{height:260,justifyContent:'space-around',alignItems:'center',gap:16}}>
       <div className="fpn-col" style={{alignItems:'center',gap:10}}><h3>上层 2×2</h3><Matrix values={topIndices.map(i=>model.top[i])} n={2} onEdit={editTop} tone={C.purple}/></div><strong style={{fontSize:44}}>→</strong>
       <div className="fpn-col" style={{alignItems:'center',gap:10}}><h3>上采样 4×4</h3><Matrix values={indices.map(i=>up[i])} n={4} selected={local} tone={C.purple}/></div><strong style={{fontSize:44}}>{lateral?'＋':'　'}</strong>
       <div className="fpn-col" style={{alignItems:'center',gap:10,opacity:lateral?1:.45}}><h3>横向 4×4</h3><Matrix values={indices.map(i=>model.detail[i])} n={4} onEdit={editDetail} selected={local}/></div><strong style={{fontSize:44}}>＝</strong>
       <div className="fpn-col" style={{alignItems:'center',gap:10}}><h3>输出 4×4</h3><Matrix values={indices.map(i=>out[i])} n={4} selected={local} tone={C.green}/></div>
     </div><p style={{height:48,lineHeight:'40px'}}>这就是图中橙框的同一组数据；点击输入数字修改，再切回特征图观察。</p>
   </div>}
   <Feedback tone={lateral?'green':'orange'}>第{row+1}行、第{col+1}列：上层 {up[selected]} {lateral?`＋ 横向 ${model.detail[selected]}`:'（横向关闭）'} ＝ {out[selected]}。{lateral?'融合保留两路信息，但背景响应仍可能存在。':'关闭横向连接，精细边界不再从 Cₗ 补充。'}<br/>图与数值来自同一手工教学数组；不是网络实测激活，也不能据此推算检测精度。</Feedback>
 </div>;
}
