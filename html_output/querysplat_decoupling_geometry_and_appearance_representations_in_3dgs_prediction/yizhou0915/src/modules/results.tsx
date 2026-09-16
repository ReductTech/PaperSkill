import React, { useState, useRef, useEffect } from 'react';
import type { WidgetProps } from './registry';
import { Tool, Craft, Choices, Feedback, Source, colors, Bars } from './kit';
type MainRow=[string,string,([number,number,number]|null)[]];
const main:MainRow[]=[["DepthSplat","需要位姿",[[20.5357,0.6721,0.2592],[22.9079,0.7683,0.1853],[21.6785,0.7549,0.205]]],["TokenGS","需要位姿",[[20.4258,0.6736,0.3783],[23.2704,0.7565,0.3026],[21.8094,0.696,0.3696]]],["YoNoSplat (posed)","需要位姿",[[19.8356,0.6296,0.2909],[22.8488,0.7469,0.1987],[22.7326,0.7608,0.1958]]],["AnySplat","无需外部位姿",[[14.0742,0.4447,0.4475],[17.3938,0.5483,0.3418],[19.6253,0.6334,0.2989]]],["NoPoSplat","无需外部位姿",[[19.065,0.5997,0.3164],null,null]],["SPFSplat","无需外部位姿",[[19.1163,0.5874,0.3046],null,null]],["SplatWeaver","无需外部位姿",[[15.6953,0.4991,0.3666],[19.2413,0.6294,0.2715],[20.4047,0.6683,0.2515]]],["YoNoSplat (pose-free)","无需外部位姿",[[19.1675,0.5908,0.3081],[21.9644,0.6983,0.2167],[21.6323,0.6953,0.2184]]],["QuerySplat","无需外部位姿",[[21.3888,0.699,0.2585],[24.5765,0.8002,0.1843],[23.7005,0.7685,0.2297]]],["QuerySplat + TTO-20","额外优化20步",[[22.0094,0.7168,0.2478],[26.2524,0.8304,0.1591],[27.0003,0.8472,0.1667]]],["QuerySplat + TTO-50","额外优化50步",[[21.9437,0.7149,0.2463],[26.3779,0.8321,0.1537],[27.7199,0.8615,0.1464]]]];
const ablations:{title:string;rows:[string,number,number,number][];note:string}[]=[{"title":"表 2 · 特征聚合","rows":[["双分支",22.8963,0.7381,0.2682],["单分支融合",20.9161,0.6593,0.344],["去掉外观",18.6447,0.5782,0.4254]],"note":"匹配层数和参数量，并启用早期正则。说明正确分配证据比简单加入外观特征更关键。"},{"title":"表 3 · 早期正则","rows":[["启用早期正则",22.8963,0.7381,0.2682],["没有早期正则",22.609,0.7228,0.2877]],"note":"检验两项早期正则的组合。论文未单独列出 Chamfer 和 opacity 下限各自的数字，不能据此分摊贡献。"},{"title":"表 4 · VGM 主干","rows":[["VGGT-Ω",22.8963,0.7381,0.2682],["VGGT",23.0723,0.7388,0.2749]],"note":"VGGT 的 PSNR/SSIM 略高，VGGT-Ω 的 LPIPS 较低。支持主干兼容性，不能说 Ω 每个指标都更好。"}];

const metricLabels=['PSNR ↑ (dB)','SSIM ↑','LPIPS ↓'];
export const Analogy10:React.FC<WidgetProps>=()=> <Craft action={9}/>;
export const Results:React.FC<WidgetProps>=()=>{
 const [view,setView]=useState(1),[metric,setMetric]=useState(0),[tto,setTto]=useState(false),[started,setStarted]=useState(true);
 const timer=useRef<ReturnType<typeof setTimeout>>();useEffect(()=>()=>clearTimeout(timer.current),[]);
 const rows=main.filter((_,i)=>i<9||tto);
 const values=main.slice(0,9).map(r=>r[2][view]?.[metric]).filter((v):v is number=>v!==undefined);
 const best=metric===2?Math.min(...values):Math.max(...values);
 const winner=main.slice(0,9).filter(r=>r[2][view]?.[metric]===best).map(r=>r[0]).join('、');
 const max=Math.max(...rows.map(r=>r[2][view]?.[metric]??0))*1.05;
 function compare(){setStarted(false);clearTimeout(timer.current);timer.current=setTimeout(()=>setStarted(true),100)}
 return <Tool><Choices label="实验视图数" labels={['2 视图','4 视图','12 视图']} value={view} onChange={setView}/>
 <div className="qs-controls"><label>指标<select aria-label="主实验指标" value={metric} onChange={e=>setMetric(+e.target.value)}>{metricLabels.map((m,i)=><option value={i} key={m}>{m}</option>)}</select></label><label><input type="checkbox" checked={tto} onChange={e=>setTto(e.target.checked)}/>显示 TTO（不计排名）</label><button onClick={compare}>开始比较</button></div>
 <Bars max={max} started={started} rows={rows.map(r=>({label:r[0],value:r[2][view]?.[metric]??null,color:r[0]==='QuerySplat'?colors.green:r[0].includes('TTO')?colors.purple:colors.dark}))}/>
 <Feedback tone={winner==='QuerySplat'?'good':''}>无 TTO 最优：{winner}，{metricLabels[metric]} = {best.toFixed(4)}。{view===2&&metric===2?'QuerySplat 的 LPIPS 为 0.2297，弱于多个基线，表明高 PSNR 并不保证感知指标同步领先。':'比较限定于相同视图数、插值视图及三种图像间隔 split 的均值。'}{tto?' 紫色为额外特征优化结果，不进入纯前馈最优计算。':''}</Feedback>
 <div className="qs-table-wrap"><table><caption>表 1 · {[2,4,12][view]} 视图插值 · 完整数值</caption><thead><tr><th>方法</th><th>相机条件</th>{metricLabels.map(m=><th key={m}>{m}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r[0]} className={r[0]==='QuerySplat'?'ours':''}><td>{r[0]}</td><td>{r[1]}</td>{[0,1,2].map(m=><td key={m}>{r[2][view]?.[m].toFixed(4)??'—'}</td>)}</tr>)}</tbody></table></div>
 <div className="qs-source"><Source anchor="Sx3.T1" label="原文表 1"/> · <Source anchor="Sx4.SSx2" label="评估协议"/> · <Source anchor="A1" label="附录 A：各 split 的输入、插值与外推结果"/>。large / medium / small 指采样图像间隔，不是场景体积。</div>
 <details><summary>如何理解摘要里的平均 PSNR 增益？</summary><p>摘要报告相对最佳 pose-free 和 pose-required 基线的平均增益约为 2.30 dB 与 1.04 dB。它是跨视图设置的平均结论，不是每个案例或每项指标的固定增益。</p><p>本页图表保留表 1 原始值；未把定性的野外重建、视频生成转三维或修复示例编成新的量化基准。</p></details></Tool>;
};
export const Ablations:React.FC<WidgetProps>=()=>{
 const [table,setTable]=useState(0),[metric,setMetric]=useState(0);const t=ablations[table];
 const nums=t.rows.map(r=>r[metric+1] as number);const best=metric===2?Math.min(...nums):Math.max(...nums);
 return <Tool><Choices label="消融主题" labels={ablations.map(a=>a.title)} value={table} onChange={setTable}/><label className="qs-controls">指标<select aria-label="消融指标" value={metric} onChange={e=>setMetric(+e.target.value)}>{metricLabels.map((m,i)=><option value={i} key={m}>{m}</option>)}</select></label>
 <Bars max={Math.max(...nums)*1.08} rows={t.rows.map(r=>({label:r[0],value:r[metric+1] as number,color:r[metric+1]===best?colors.green:colors.dark}))}/>
 <Feedback>{t.note} 本组最优：{t.rows.filter(r=>r[metric+1]===best).map(r=>r[0]).join('、')}。</Feedback>
 <div className="qs-table-wrap"><table><caption>{t.title} · 150K 基础训练 · 4 视图插值</caption><thead><tr><th>变体</th>{metricLabels.map(m=><th key={m}>{m}</th>)}</tr></thead><tbody>{t.rows.map(r=><tr key={r[0]}><td>{r[0]}</td>{r.slice(1).map((v,i)=><td key={i}>{Number(v).toFixed(4)}</td>)}</tr>)}</tbody></table></div>
 <div className="qs-source"><Source anchor={'Sx4.T'+(table+2)} label={'原文表 '+(table+2)}/> · <Source anchor="A4" label="附录 D：缩短训练的消融协议"/>。各变体只完成 150K 基础训练，未进行查询扩容；large/medium/small 平均。不要与上方完整模型的分数混算增益。</div>
 </Tool>;
};
