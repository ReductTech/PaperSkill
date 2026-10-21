import { useState } from 'react';
import { CanvasPlot, COLORS as C, clearScene, line, dot } from './vdsr-kit';
const epochs=[10,20,40,80];
const rates=[0.1,0.01,0.001];
const residual=[[36.90,36.64,37.12,37.05],[36.74,36.87,36.91,36.93],[36.31,36.46,36.52,36.52]];
const direct=[[27.42,19.59,31.38,35.66],[30.33,33.59,36.26,36.42],[33.97,35.08,36.11,36.11]];
export function VdsrTrainingEvidence(){
 const [epochIndex,setEpoch]=useState(0); const [rateIndex,setRate]=useState(0);
 return <div className="vdsr-widget" onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))e.stopPropagation();}}>
 <div className="vdsr-controls" aria-label="选择初始学习率">{rates.map((rate,i)=><button key={rate} aria-pressed={rateIndex===i} className={rateIndex===i?'is-active':''} onClick={()=>setRate(i)}>初始学习率 {rate}</button>)}</div>
 <div className="vdsr-controls"><button disabled={epochIndex===0} onClick={()=>setEpoch(i=>i-1)}>上一检查点</button><strong>第 {epochs[epochIndex]} 轮</strong><button disabled={epochIndex===3} onClick={()=>setEpoch(i=>i+1)}>下一检查点</button></div>
 <div className="vdsr-metrics"><span>残差：{residual[rateIndex][epochIndex].toFixed(2)} dB</span><span>非残差：{direct[rateIndex][epochIndex].toFixed(2)} dB</span><span>差值：{(residual[rateIndex][epochIndex]-direct[rateIndex][epochIndex]).toFixed(2)} dB</span></div>
 <CanvasPlot label="表1实测PSNR检查点散点图，绿色为残差、蓝色为非残差。纵轴18到38dB，横轴四个等距类别，并非等间距时间。" draw={(ctx,w,h)=>{
 clearScene(ctx,w,h); const left=90,right=w-80,top=25,bottom=h-40; line(ctx,left,top,left,bottom,C.axis,2); line(ctx,left,bottom,right,bottom,C.axis,2);
 [residual[rateIndex],direct[rateIndex]].forEach((values,series)=>values.forEach((v,i)=>{const x=left+((right-left)*i/3); const y=bottom-(v-18)/20*(bottom-top); ctx.save(); ctx.globalAlpha=i>epochIndex?.25:1; dot(ctx,x,y,i===epochIndex?11:6,series===0?C.green:C.blue); if(i===epochIndex){ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.stroke();}ctx.restore();}));
 }}/>
 <div className="vdsr-metrics"><span>纵轴 18–38 dB</span><span>横轴类别：10 ｜ 20 ｜ 40 ｜ 80 轮（等距类别）</span></div>
 <p className="vdsr-feedback" aria-live="polite">初始学习率 {rates[rateIndex]}、第 {epochs[epochIndex]} 轮：残差 {residual[rateIndex][epochIndex].toFixed(2)} dB，非残差 {direct[rateIndex][epochIndex].toFixed(2)} dB。点位来自表 1，不补画未测量的中间曲线，也不要求检查点单调。</p>
 <div className="vdsr-table-wrap"><table><caption>论文表 1 全部检查点：10 层网络、91 张训练图、Set5 ×2，单位 dB</caption><thead><tr><th>初始学习率</th><th>目标</th>{epochs.map(e=><th key={e}>{e} 轮</th>)}</tr></thead><tbody>{rates.flatMap((rate,ri)=>[0,1].map(si=><tr key={`${rate}-${si}`}><th>{rate}</th><th>{si===0?'残差':'非残差'}</th>{(si===0?residual[ri]:direct[ri]).map((v,ei)=><td key={ei} aria-current={ri===rateIndex&&ei===epochIndex?'true':undefined}>{v.toFixed(2)}</td>)}</tr>))}</tbody></table></div>
 </div>;
}
