import { useId, useState } from 'react';
import type { WidgetProps } from './registry';
import './concept-labs.css';
import './evidence-responsive.css';
const datasets=[
 {name:'ImageNet',type:'标准评估',baseline:76.2,clip:76.2,note:'在 ImageNet 上，两种模型的准确率都是 76.2%。这个相同的起点帮助比较分布变化后的表现。'},
 {name:'ImageNetV2',type:'重新收集的自然图片',baseline:64.3,clip:70.1,note:'面对重新收集的图片，两种模型的表现都会变化；CLIP 在此数据集保留了更高的准确率。'},
 {name:'ImageNet-R',type:'艺术化呈现',baseline:37.7,clip:88.9,note:'面对艺术化呈现，论文中的最佳 CLIP 显著领先这个监督基线；结论只属于当前评估条件。'},
 {name:'ImageNet Sketch',type:'素描图像',baseline:25.2,clip:60.2,note:'面对素描图像，零样本 CLIP 的优势仍然存在；这不意味着计数或专业领域任务都能处理好。'}
];
export function Clip10(_props:WidgetProps){
 const [dataset,setDataset]=useState(0),[showAll,setShowAll]=useState(false),[claim,setClaim]=useState<number|null>(null);
 const tableId=useId(),tableHintId=useId();
 const selected=datasets[dataset],difference=selected.clip-selected.baseline;
 const selectDataset=(index:number)=>{setDataset(index);setClaim(null)};
 return <div className="concept-lab evidence-lab">
 <div className="evidence-selector"><label>评估数据集<select aria-label="切换评估数据集" value={dataset} onChange={event=>selectDataset(Number(event.target.value))}>{datasets.map((entry,i)=><option key={entry.name} value={i}>{entry.name} · {entry.type}</option>)}</select></label><div className="evidence-selector-feedback" aria-live="polite"><span>CLIP <b>{selected.clip.toFixed(1)}%</b></span><span>监督基线 <b>{selected.baseline.toFixed(1)}%</b></span><span>差值 <b>{difference>0?'+':''}{difference.toFixed(1)}</b> 个百分点</span></div></div>
 <div className="result-datasets">{datasets.map((entry,i)=><button key={entry.name} aria-pressed={dataset===i} onClick={()=>selectDataset(i)}><b>{entry.name}</b><span>{entry.type}</span></button>)}</div>
 <div className="evidence-dashboard"><div className="evidence-chart"><div className="chart-heading"><span>TOP-1 ACCURACY</span><span>同一数据集 · 越高越好</span></div>{[{name:'ResNet101',protocol:'监督学习',value:selected.baseline,color:'#a0a9bd'},{name:'CLIP',protocol:'零样本 · 论文最佳型号',value:selected.clip,color:'#5365ad'}].map(item=><div className="result-bar-row" key={item.name}><div><b>{item.name}</b><span>{item.protocol}</span><strong>{item.value.toFixed(1)}<small>%</small></strong></div><div className="result-track" role="meter" aria-label={item.name+'准确率'} aria-valuenow={item.value} aria-valuemin={0} aria-valuemax={100}><div style={{width:item.value+'%',background:item.color}}/></div></div>)}<div className="chart-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span></div></div><div className="evidence-delta"><span>CLIP 相对该基线</span><strong>{difference>0?'+':''}{difference.toFixed(1)}</strong><small>个百分点</small><p>{difference===0?'标准评估的起点相同':'当前数据集的报告差值'}</p></div></div>
 <div className="concept-response" aria-live="polite"><span>怎么读这张图</span><p>{selected.note}</p></div>
 <button type="button" className="table-toggle" aria-expanded={showAll} aria-controls={tableId} onClick={()=>setShowAll(!showAll)}>{showAll?'收起':'展开'}全部报告值 {showAll?'−':'＋'}</button>{showAll&&<><p className="evidence-table-hint" id={tableHintId}>窄屏可左右滑动表格；键盘聚焦后，可用 ← → 横向滚动。</p><div id={tableId} className="result-table-wrap" role="region" tabIndex={0} aria-label="论文报告值表格" aria-describedby={tableHintId}><table><caption>原论文 Figure 7 · Top-1 准确率（%）</caption><thead><tr><th scope="col">数据集</th><th scope="col">监督 ResNet101</th><th scope="col">零样本 CLIP</th><th scope="col">差值（百分点）</th></tr></thead><tbody>{datasets.map(row=><tr key={row.name}><th scope="row">{row.name}</th><td>{row.baseline.toFixed(1)}</td><td>{row.clip.toFixed(1)}</td><td>{(row.clip-row.baseline).toFixed(1)}</td></tr>)}</tbody></table></div></>}
 <section className="claim-check"><span className="micro-label">这组结果支持哪个结论？</span><div>{['CLIP 在所有任务上都强于监督学习。','在论文这些评估条件下，CLIP 对部分自然分布变化更稳健。'].map((text,i)=><button key={text} aria-pressed={claim===i} onClick={()=>setClaim(i)}><span>{String.fromCharCode(65+i)}</span>{text}</button>)}</div>{claim!==null&&<p className={'quiz-feedback '+(claim===1?'correct':'incorrect')} aria-live="polite">{claim===1?'✓ 证据支持有条件的结论。最佳型号、监督基线、数据集与评估协议，都不能省略。':'这会把局部证据推广过头。论文也报告了计数、专业任务和数据偏差等局限。'}</p>}</section>
 <p className="lab-disclaimer">来源：Radford et al., ICML 2021，原论文 PDF 第 8 页 Figure 7。只在同一数据集内比较；不同数据集有各自的类别协议。条形过渡仅用于呈现数据，不表示训练过程。</p>
 </div>;
}
