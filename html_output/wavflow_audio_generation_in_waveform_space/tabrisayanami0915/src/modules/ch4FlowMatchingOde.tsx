import React,{useEffect,useState} from 'react';
import type {WidgetProps} from './registry';
import {Source} from '../components/Evidence';
import {WavePlot} from '../components/WavePlot';
// Fixed seeded Gaussian samples keep the endpoint pair unchanged while t moves.
let seed=421;
function uniform(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return (seed+.5)/4294967296;}
const noise=Array.from({length:480},()=>Math.sqrt(-2*Math.log(uniform()))*Math.cos(2*Math.PI*uniform()));
const clean=Array.from({length:480},(_,i)=>(Math.sin(i*.05)+.4*Math.sin(i*.15))*(i%90<25?1.4:.6));
export const Ch4FlowMatchingOde:React.FC<WidgetProps>=()=>{
 const [t,setT]=useState(.6),[playing,setPlaying]=useState(false);
 useEffect(()=>{
  if(!playing)return;
  const timer=window.setInterval(()=>setT(t=>t>=1?0:Math.min(1,t+.01)),60);
  return ()=>window.clearInterval(timer);
 },[playing]);
 const samples=noise.map((v,i)=>(1-t)*v+t*clean[i]);
 return <div className="widget-container">
 <p className="evidence-source">训练插值概念示意，非 WavFlow 推理。噪声来自固定种子的高斯样本，终点为教学合成波形。</p>
 <WavePlot samples={samples} label="固定噪声与合成波形之间的训练插值"/>
 <div className="widget-controls"><button className={playing?'btn-toggle active':'btn-toggle'} aria-pressed={playing} onClick={()=>setPlaying(!playing)}>{playing?'暂停插值':'播放插值'}</button>
 <label className="evidence-slider">生成时间 t={t.toFixed(2)}<input aria-label="训练插值生成时间" type="range" min="0" max="100" value={Math.round(t*100)} onChange={e=>{setPlaying(false);setT(Number(e.target.value)/100);}}/></label></div>
 <div className="evidence-grid">
 <div className="evidence-panel"><h4>训练：端点已知</h4><p className="evidence-formula">x_t=(1−t)x₀+t x₁</p><p>目标速度 x₁−x₀ 对此固定样本对不变。滑块没有调用网络。</p></div>
 <div className="evidence-panel"><h4>推理：端点未知</h4><p className="evidence-formula">x_(k+1)=x_k+Δt · v̂θ(x_k,t_k,c)</p><p>用 CFG 修正后的预测速度做 Euler 积分。学习误差、轨迹曲率和离散积分误差仍可能存在。</p></div>
 </div>
 <div className="widget-feedback good">论文默认采用 50 步 Euler。训练的线性插值并不保证每条生成轨迹严格笔直，也不证明采样无误差或普遍快于扩散模型。</div>
 <Source>第 4 页 §3.1 Eq. (1)–(3)，第 6 页 §3.3，第 19–20 页 Appendix F、Table 10。</Source>
 </div>;
};
export default Ch4FlowMatchingOde;
