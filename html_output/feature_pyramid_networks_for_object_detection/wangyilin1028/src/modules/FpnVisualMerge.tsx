import React,{useState} from 'react';
import {C,Range,Choice,Feedback} from './FpnKit';
import {SymbolHint} from '../components/SymbolHint';
import {makeFeatureExample,upsampleFeature,addFeature,FeatureView} from './FpnFeatureView';

const example=makeFeatureExample();
const up=upsampleFeature(example.top);
export function FpnStrategies(){
 const [progress,setProgress]=useState(100);
 const fused=addFeature(example.detail,up,progress/100);
 return <div className="fpn-scene" style={{gap:16}}>
   <div className="fpn-row" style={{height:382,gap:64,position:'relative'}}>
     <div className="fpn-col" style={{width:448,alignItems:'center',gap:10}}><h3>横向细节 <SymbolHint meaning="L_l：当前骨干特征C_l经1×1卷积，统一通道后的横向特征。">Lₗ</SymbolHint></h3><FeatureView values={example.detail} label="细节特征示意：行人边界与街景线条都可能产生响应。"/><p>Cₗ 经 1×1 卷积对齐通道</p></div>
     <strong style={{position:'absolute',left:470,top:170,fontSize:44,color:C.blue}}>＋</strong>
     <div className="fpn-col" style={{width:448,alignItems:'center',gap:10}}><h3>上层信息 <SymbolHint meaning="Up(M_l+1)：上层中间融合特征经2倍最近邻上采样；增加空间位置，不产生新的细节。">Up(Mₗ₊₁)</SymbolHint></h3><FeatureView values={up.map(v=>v*progress/100)} tone="top" label="上层提示示意：原8×8响应复制到16×16，仍较粗糙。"/><p>8×8 → 16×16，位置对齐</p></div>
     <strong style={{position:'absolute',left:982,top:170,fontSize:44,color:C.blue}}>＝</strong>
     <div className="fpn-col" style={{width:448,alignItems:'center',gap:10}}><h3>中间融合特征 <SymbolHint meaning="M_l：横向特征L_l与上层上采样特征逐元素相加后的中间量；尚未经过输出端3×3卷积。">Mₗ</SymbolHint></h3><FeatureView values={fused} tone="fused" label={`叠合进度${progress}%，同位置细节响应加上层提示，背景响应仍可能保留。`}/><p>同一个位置，保留两路信息</p></div>
   </div>
   <div className="fpn-row" style={{height:86,alignItems:'center',gap:24}}><div style={{width:892}}><Range label="上层信息叠合进度（演示）" value={progress} min={0} max={100} step={5} onChange={setProgress}/></div><Choice active={progress===0} onClick={()=>setProgress(0)}>只看横向细节</Choice><Choice active={progress===100} onClick={()=>setProgress(100)}>完整相加</Choice></div>
   <Feedback tone={progress===100?'green':'blue'}>{progress===100?'完整相加后，粗尺度提示与精细边界同时保留；Mₗ 再经 3×3 卷积得到输出 Pₗ。':'拖动进度观察上层信息怎样加入；100%时才对应完整相加，进度不是FPN的可学习权重。'}<br/>手工构造的特征示意，不是照片修复、真实网络激活或检测概率。</Feedback>
 </div>;
}
