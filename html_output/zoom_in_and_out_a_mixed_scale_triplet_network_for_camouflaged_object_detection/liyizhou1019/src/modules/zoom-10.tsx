import { useRef, useState } from 'react';
import { C, SceneCanvas, Feedback, clearScene, drawSceneLabel } from './kit-anchor';

const datasets=['CAMO','CHAMELEON','COD10K','NC4K'];
const counts=[250,76,2026,4121];
const c2f=[[.796,.719,.080,.762,.864],[.888,.828,.032,.844,.946],[.813,.686,.036,.723,.900],[.838,.762,.049,.795,.904]];
const zoom=[[.820,.752,.066,.794,.892],[.902,.845,.023,.864,.958],[.838,.729,.029,.766,.911],[.853,.784,.043,.818,.912]];
const ablations=[['基线','.637'],['基线 + HMU','.654'],['基线 + SIU','.682'],['基线 + SIU + HMU','.694'],['基线 + SIU + HMU + UAL','.729']];
const cellStyle={padding:'8px 16px',textAlign:'left' as const,borderBottom:`1px solid ${C.border}`};
const selectStyle={padding:'8px 12px',border:`1px solid ${C.border}`,borderRadius:8,color:C.text,background:'#fff',font:'inherit'};

export function Zoom10(){
  const [dataset,setDataset]=useState(2),[metric,setMetric]=useState(0);
  const [running,setRunning]=useState(false),[done,setDone]=useState(false);
  const elapsed=useRef(0),lastFrame=useRef<number|null>(null),finishing=useRef(false);
  const col=metric===0?1:2, max=metric===0?1:.1;
  const reset=()=>{setRunning(false);setDone(false);elapsed.current=0;lastFrame.current=null;finishing.current=false;};
  const start=()=>{
    elapsed.current=0;lastFrame.current=null;finishing.current=false;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){elapsed.current=1500;setDone(true);setRunning(false);}
    else {setDone(false);setRunning(true);}
  };
  const name=metric===0?'Fωβ':'MAE';
  return <div>
    <SceneCanvas animate={running} aria-label={`${datasets[dataset]}：C2FNet ${name} ${c2f[dataset][col].toFixed(3)}，ZoomNet ${name} ${zoom[dataset][col].toFixed(3)}。${metric===0?'越高越好':'越低越好'}。`}
      draw={(ctx,time)=>{
        if(running){
          if(lastFrame.current!==null)elapsed.current+=Math.max(0,Math.min(100,time-lastFrame.current));
          lastFrame.current=time;
          if(elapsed.current>=1500&&!finishing.current){
            finishing.current=true;queueMicrotask(()=>{setDone(true);setRunning(false);});
          }
        }
        const progress=done?1:Math.min(1,elapsed.current/1500);
        clearScene(ctx,1080,280);
        ctx.lineWidth=1;ctx.strokeStyle=C.border;
        for(let i=0;i<=10;i++){
          ctx.beginPath();ctx.moveTo(150+i*76,45);ctx.lineTo(150+i*76,227);ctx.stroke();
        }
        [c2f[dataset][col],zoom[dataset][col]].forEach((value,index)=>{
          ctx.fillStyle=index===0?C.blue:C.green;
          const width=760*value/max*progress;
          if(width>0){ctx.beginPath();ctx.roundRect(150,74+index*88,Math.max(width,1),46,Math.min(8,width/2));ctx.fill();}
        });
        drawSceneLabel(ctx,'C2FNet',30,103,C.blue);drawSceneLabel(ctx,'ZoomNet',30,191,C.green);
      }}/>
    <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',padding:'14px 0'}}>
      <label>测试集 <select aria-label="测试集" value={dataset} style={selectStyle} onChange={e=>{reset();setDataset(Number(e.target.value));}}>{datasets.map((d,i)=><option value={i} key={d}>{d}（{counts[i]}张）</option>)}</select></label>
      <label>指标 <select aria-label="比较指标" value={metric} style={selectStyle} onChange={e=>{reset();setMetric(Number(e.target.value));}}><option value={0}>Fωβ ↑</option><option value={1}>MAE ↓</option></select></label>
      <button type="button" onClick={start} disabled={running} style={{...selectStyle,background:running?C.border:C.blue,color:'#fff',cursor:running?'wait':'pointer'}}>{running?'比较中…':done?'重新比较':'开始比较'}</button>
      <span style={{color:C.muted}}>固定坐标：0–{max}，{metric===0?'越高越好':'越低越好'}</span>
    </div>
    <table style={{width:'100%',borderCollapse:'collapse',marginBottom:14,fontVariantNumeric:'tabular-nums'}}>
      <caption style={{textAlign:'left',fontSize:16,color:C.muted,padding:'4px 16px'}}><a href="https://openaccess.thecvf.com/content/CVPR2022/papers/Pang_Zoom_in_and_Out_A_Mixed-Scale_Triplet_Network_for_Camouflaged_CVPR_2022_paper.pdf" target="_blank" rel="noreferrer">原文 Table 1</a> · {datasets[dataset]} · 条形增长仅用于展示，数值来自论文</caption>
      <thead><tr><th style={cellStyle}>方法</th><th style={{...cellStyle,color:metric===0?C.blue:C.muted}}>Fωβ ↑</th><th style={{...cellStyle,color:metric===1?C.blue:C.muted}}>MAE ↓</th></tr></thead>
      <tbody>{[['C2FNet',c2f[dataset]],['ZoomNet',zoom[dataset]]].map(([method,row])=><tr key={String(method)}><th style={cellStyle}>{String(method)}</th><td style={cellStyle}>{(row as number[])[1].toFixed(3)}</td><td style={cellStyle}>{(row as number[])[2].toFixed(3)}</td></tr>)}</tbody>
    </table>
    <Feedback tone={done?'good':'neutral'}>{done?`在论文的${datasets[dataset]}测试协议下，ZoomNet的${name}为${zoom[dataset][col].toFixed(3)}，C2FNet为${c2f[dataset][col].toFixed(3)}；${metric===0?'越高':'越低'}越好。`:'选择数据集与指标，再用同一坐标比较；请先确认指标方向。'} 这是2022年论文中的对比，不代表当前最优，也不是本机复现成绩。</Feedback>
    <table style={{width:'100%',borderCollapse:'collapse',marginTop:18,fontSize:16}}>
      <caption style={{textAlign:'left',padding:'8px 16px',color:C.muted}}>组件消融 · COD10K-Test · Table 2</caption>
      <thead><tr><th style={cellStyle}>设置</th><th style={cellStyle}>Fωβ ↑</th></tr></thead>
      <tbody>{ablations.map(([label,value])=><tr key={label}><th style={{...cellStyle,fontWeight:400}}>{label}</th><td style={cellStyle}>{value}</td></tr>)}</tbody>
      <tfoot><tr><td colSpan={2} style={{...cellStyle,color:C.muted}}>UAL：Fωβ .694→.729，但 Sₘ .843→.838。计算量：41.885→203.496 GFLOPs（约4.86倍），不是运行时延。</td></tr></tfoot>
    </table>
  </div>;
}
