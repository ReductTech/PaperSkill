import { useEffect, useState } from 'react';
import { Scene, Feedback, C, drawLabel, line, bar } from './index-kit';
const scores={'MMLU':[43.75,51.21],'CMMLU':[42.35,49.79],'C-Eval':[43.61,52.41],'ARC-C':[42.75,59.57],'ARC-E':[61.61,78.86],'HellaSwag':[63.21,57.80],'GSM8K':[12.81,28.89],'HumanEval':[12.20,18.29]} as const;
type Metric=keyof typeof scores;
export function IndexInstructionAblation(){
 const metrics=Object.keys(scores) as Metric[];const [metric,setMetric]=useState<Metric>('MMLU');const [playing,setPlaying]=useState(true);const [pure,boost]=scores[metric];const delta=boost-pure;
 useEffect(()=>{if(!playing||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const timer=window.setInterval(()=>setMetric(current=>metrics[(metrics.indexOf(current)+1)%metrics.length]),2200);return()=>window.clearInterval(timer)},[playing]);
 const message=`${metric}：${pure.toFixed(2)} → ${boost.toFixed(2)}，${delta>0?'提高':'下降'}${Math.abs(delta).toFixed(2)}个百分点；${delta>0?'这里只代表这一项任务。':'加入指令数据并非处处提升。'}`;
 return <div onKeyDown={e=>{if(e.key.startsWith('Arrow'))e.stopPropagation();}}>
 <Scene label={`${metric}，Pure ${pure.toFixed(2)}，Boost ${boost.toFixed(2)}，共同零起点，满刻度100`} draw={ctx=>{
 [0,25,50,75,100].forEach(v=>line(ctx,190+8*v,60,190+8*v,240));line(ctx,190,240,990,240);bar(ctx,190,85,8*pure,40,C.blue);bar(ctx,190,160,8*boost,40,delta>0?C.green:C.red);drawLabel(ctx,'对照',60,112);drawLabel(ctx,'加指令',60,187);
 }}/>
 <div className="metrics"><div className="metric"><div className="l">Pure · 0—100</div><output className="v">{pure.toFixed(2)}</output></div><div className="metric"><div className="l">Boost · 0—100</div><output className="v">{boost.toFixed(2)}</output></div><div className="metric"><div className="l">差值 · 百分点</div><output className="v">{delta>0?'+':''}{delta.toFixed(2)}</output></div></div>
 <div className="chip-row" role="group" aria-label="选择消融任务">{metrics.map(m=><button key={m} className={`chip ${m===metric?'selected':''}`} style={{minHeight:44}} aria-pressed={m===metric} onClick={()=>{setPlaying(false);setMetric(m)}}>{m}</button>)}<button className="autoplay-toggle" aria-pressed={playing} onClick={()=>setPlaying(x=>!x)}><i/>{playing?'自动巡检八项任务 · 暂停':'继续自动巡检'}</button></div>
 <Feedback tone={delta>0?'good':'bad'}>{message}</Feedback>
 <details className="evidence-disclosure"><summary><span>Paper Evidence</span><b>§6.6 · Table 8</b><i>展开证据 ＋</i></summary><div className="evidence-grid"><div><small>SECTION</small><b>§6.6</b></div><div><small>FIGURE / TABLE</small><b>Figure 7 · Table 8</b></div><div><small>论文事实</small><p>同一 stable checkpoint 的两个 50K-step decay 分支只相差 7% instruction data；MMLU 43.75→51.21，但 HellaSwag 63.21→57.80，任务级变化不一致。</p></div><div><small>本页如何解释</small><p>逐项展示 Table 8 的 ablation checkpoint 数值；它们不是 released-model 分数，也不与 stable-phase surge 建立因果关系。</p></div></div></details>
 </div>;
}
