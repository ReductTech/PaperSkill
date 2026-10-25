import { useEffect, useState } from 'react';
import { CanvasPlot, COLORS as C, clearScene, box, line, text } from './vdsr-kit';
const data=[{name:'Set5',srcnn:[36.66,32.75,30.48],vdsr:[37.53,33.66,31.35]},{name:'Set14',srcnn:[32.42,29.28,27.49],vdsr:[33.03,29.77,28.01]},{name:'B100',srcnn:[31.36,28.41,26.90],vdsr:[31.90,28.82,27.29]},{name:'Urban100',srcnn:[29.50,26.24,24.52],vdsr:[30.76,27.14,25.18]}];
const evidence=[
 {srcnnSSIM:[.9542,.9090,.8628],vdsrSSIM:[.9587,.9213,.8838],other:[[33.66,36.54,36.54,36.49],[30.39,32.58,32.43,32.58],[28.42,30.28,30.14,30.31]]},
 {srcnnSSIM:[.9063,.8209,.7503],vdsrSSIM:[.9124,.8314,.7674],other:[[30.24,32.28,32.26,32.22],[27.55,29.13,29.05,29.16],[26.00,27.32,27.24,27.40]]},
 {srcnnSSIM:[.8879,.7863,.7101],vdsrSSIM:[.8960,.7976,.7251],other:[[29.56,31.21,31.16,31.18],[27.21,28.29,28.22,28.29],[25.96,26.82,26.75,26.84]]},
 {srcnnSSIM:[.8946,.7989,.7221],vdsrSSIM:[.9140,.8279,.7524],other:[[26.88,29.20,29.11,29.54],[24.46,26.03,25.86,26.44],[23.14,24.32,24.19,24.79]]},
];
export function VdsrResults(){
 const [dataset,setDataset]=useState(0);const [scale,setScale]=useState(2); const [progress,setProgress]=useState(0); const [running,setRunning]=useState(false);
 const row=data[dataset],s=row.srcnn[scale-2],v=row.vdsr[scale-2];
 useEffect(()=>{if(!running)return; if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setProgress(1);setRunning(false);return;}let frame=0;const start=performance.now();const tick=(now:number)=>{const p=Math.min(1,(now-start)/1800);setProgress(p);if(p<1)frame=requestAnimationFrame(tick);else setRunning(false);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[running]);
 const reset=()=>{setRunning(false);setProgress(0);};
 return <div className="vdsr-widget" onKeyDown={e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))e.stopPropagation();}}>
 <div className="vdsr-controls" aria-label="测试数据集">{data.map((d,i)=><button key={d.name} aria-pressed={dataset===i} className={dataset===i?'is-active':''} onClick={()=>{reset();setDataset(i);}}>{d.name}</button>)}</div>
 <div className="vdsr-controls" aria-label="测试倍率">{[2,3,4].map(n=><button key={n} aria-pressed={scale===n} className={scale===n?'is-active':''} onClick={()=>{reset();setScale(n);}}>×{n}</button>)}<button disabled={running} onClick={()=>{setProgress(0);setRunning(true);}}>开始结果对照</button></div>
 <div className="vdsr-metrics"><span>SRCNN {s.toFixed(2)} dB</span><span>VDSR {v.toFixed(2)} dB</span><span>提升 {(v-s).toFixed(2)} dB</span><span>{running?'展示中':progress===1?'展示完成':'等待开始'}</span></div>
 <CanvasPlot label={`结果条形图，从真实零基线至40dB。${row.name}乘${scale}，SRCNN ${s}，VDSR ${v}；动画进度${Math.round(progress*100)}%。`} draw={(ctx,w,h)=>{clearScene(ctx,w,h);const left=150,right=w-55,p=1-Math.pow(1-progress,3);line(ctx,left,30,left,h-25,C.axis,2);line(ctx,left,h-25,right,h-25,C.axis,2);box(ctx,left,60,(right-left)*s/40*p,54,C.red);box(ctx,left,150,(right-left)*v/40*p,54,C.green);text(ctx,'SRCNN',30,96,C.red,20);text(ctx,'VDSR',30,186,C.green,20);}}/>
 <div className="vdsr-metrics"><span>横轴：0 至 40 dB，从零开始</span><span>两条共用 1.8 秒展示；动画速度不代表训练或推理速度</span></div>
 <p className="vdsr-feedback" aria-live="polite">{row.name} ×{scale}：VDSR {v.toFixed(2)} dB，SRCNN {s.toFixed(2)} dB，差值 {(v-s).toFixed(2)} dB。改变数据集或倍率会清空图形；再次点击开始后展示该组结果。</p>
 <div className="vdsr-table-wrap"><table><caption>论文表 3：291 张训练图、20 层 VDSR；亮度通道、统一裁边，PSNR（dB）与 SSIM 越高越好</caption><thead><tr><th>数据集</th><th>倍率</th><th>SRCNN PSNR</th><th>VDSR PSNR</th><th>PSNR 差值</th><th>SRCNN SSIM</th><th>VDSR SSIM</th></tr></thead><tbody>{data.flatMap((d,di)=>[2,3,4].map((n,ni)=><tr key={`${d.name}-${n}`} aria-current={dataset===di&&scale===n?'true':undefined}><th>{d.name}</th><th>×{n}</th><td>{d.srcnn[ni].toFixed(2)}</td><td>{d.vdsr[ni].toFixed(2)}</td><td>{(d.vdsr[ni]-d.srcnn[ni]).toFixed(2)}</td><td>{evidence[di].srcnnSSIM[ni].toFixed(4)}</td><td>{evidence[di].vdsrSSIM[ni].toFixed(4)}</td></tr>))}</tbody></table></div>
 <div className="vdsr-table-wrap"><table><caption>表 3 其余对照方法的 PSNR（dB）；与上表采用相同测试协议</caption><thead><tr><th>数据集</th><th>倍率</th><th>双三次</th><th>A+</th><th>RFL</th><th>SelfEx</th></tr></thead><tbody>{data.flatMap((d,di)=>[2,3,4].map((n,ni)=><tr key={`${d.name}-other-${n}`}><th>{d.name}</th><th>×{n}</th>{evidence[di].other[ni].map((v,i)=><td key={i}>{v.toFixed(2)}</td>)}</tr>))}</tbody></table></div>
 <p>来源：<a href="https://arxiv.org/abs/1511.04587" target="_blank" rel="noreferrer">VDSR 原论文（arXiv:1511.04587v2）</a>，表 3、第 5.1–5.4 节。其余方法的 SSIM 与运行时间见原表；本教程不把异硬件时间换算为架构加速比。</p>
 <p className="vdsr-feedback">论文时间比较涉及公开 SRCNN CPU 实现与 VDSR 的不同实现和硬件，不能视为同硬件优化后的纯架构加速比。这些指标支持指定评测协议内的改善；迁移到去噪、伪影去除是作者展望，本文未给出相应验证。</p>
 </div>;
}
