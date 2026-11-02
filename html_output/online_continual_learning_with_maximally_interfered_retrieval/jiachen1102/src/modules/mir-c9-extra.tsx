import React,{useState} from 'react';
import {C,useCanvas,roundRect,Feedback,Source} from './mir-kit';
const cases=[
 {name:'GEN-MIR 消融 · Table 6',labels:['完整 GEN-MIR','无生成器 MIR','无分类器 MIR','无 KL','无熵惩罚','无多样性','GEN'],values:[83,82.7,81.7,80.7,78.3,80.7,80],unit:'准确率（%，越高越好）',max:100,feedback:'移除熵项后的 78.3 低于 GEN 的 80.0；参考预测的确定性在这个实验中很重要。'},
 {name:'CIFAR 追加更新 · Table 3',labels:['ER：1 次','ER：5 次','ER-MIR：1 次','ER-MIR：5 次','iid online：1 次','iid online：5 次'],values:[41.3,42.4,47.6,49.3,60.8,62],unit:'准确率（%，越高越好）',max:100,feedback:'M=100／类；两法都从增加更新获益。MIR 的检索成本与更新次数都应计入计算预算。'},
 {name:'生成器损失 · Table 5',labels:['GEN：Split','GEN-MIR：Split','GEN：Permuted','GEN-MIR：Permuted'],values:[107.2,102.5,196.7,193.7],unit:'负 ELBO（越低越好）',max:220,feedback:'生成器负 ELBO 也降低，说明检索保护生成器具有直接测量依据；不同数据集的损失量级不能直接互比难度。'}
];
export function MirC9Extra(){
 const [index,setIndex]=useState(0),e=cases[index];
 const ref=useCanvas(ctx=>{ctx.fillStyle=C.bg;ctx.fillRect(0,0,1080,280);e.values.forEach((v,i)=>{const step=235/e.values.length,y=15+i*step;roundRect(ctx,140,y,850,Math.min(25,step-6),3,C.axis);roundRect(ctx,140,y,850*v/e.max,Math.min(25,step-6),3,e.labels[i].includes('MIR')?C.green:C.blue);});},[index]);
 return <div className="mir-widget"><canvas className="mir-canvas" ref={ref} aria-label="切换消融、更新次数与生成器损失的原文结果"/><div className="mir-controls">{cases.map((c,i)=><button key={c.name} aria-pressed={index===i} onClick={()=>setIndex(i)}>{c.name}</button>)}</div><Feedback tone={index===2?'purple':'blue'}>{e.feedback} 这些表是不同实验，不能把 Table 6 的 83.0 与 Table 1 的 82.1 当作同协议重复结果。</Feedback>
 <div className="mir-prose"><p>横轴为当前指标的原始数值，纵向顺序与下表相同；准确率上限为 100%，负 ELBO 图上限为 220。下表给出全部图中数据，颜色只区分包含 MIR 的条目与参照，不代表统计显著。</p>
 <div className="mir-table-wrap"><table><caption>{e.name}</caption><thead><tr><th>实验条目</th><th>{e.unit}</th></tr></thead><tbody>{e.labels.map((n,i)=><tr key={n}><td>{n}</td><td>{e.values[i].toFixed(1)}</td></tr>)}</tbody></table></div>
 <p>Table 3 报告的离散量依次为：ER 一次 1.9、五次 1.1；ER-MIR 一次 1.1、五次 0.1；iid online 一次 1.0、五次 0.9。Table 5 的 GEN / GEN-MIR，Split 为 107.2±0.2 / 102.5±0.2，Permuted 为 196.7±0.7 / 193.7±1.0。Table 6 未给上述消融数值的 ±，本页没有补造误差棒。</p>
 <h3>关键图如何读，能证明什么？</h3><div className="mir-table-wrap"><table><thead><tr><th>图</th><th>内容与坐标</th><th>证据与边界</th></tr></thead><tbody>
 <tr><th>Fig. 1</th><td>左侧随机回放与右侧依据虚拟更新干扰检索的机制图；不是准确率坐标图。</td><td>阐明选择位置，不能作为实验提升的独立数值证据。</td></tr>
 <tr><th>Fig. 2</th><td>MNIST 生成样本行列：上行为新任务 8/9，后续行为检索出的干扰样本。</td><td>样本可能形似新类却属于旧类，说明候选的直观意义；没有证明每类必然被保护。</td></tr>
 <tr><th>Fig. 3(a,b)</th><td>在线低数据下的生成图像；比较基线模糊／淡化样本、分类器干扰检索、生成器干扰检索。</td><td>生成质量与检索行为的定性解释，不能替代 Table 5 的生成损失或真实质量评估。</td></tr>
 <tr><th>Fig. 4</th><td>横轴压缩缓存规模，纵轴分别为准确率与遗忘；比较 AE-Random 与 AE-MIR。</td><td>准确率相近而遗忘改善；增加存储量有作用。不把未经核验的曲线点当作精确数据。</td></tr>
 <tr><th>Table 7 标注的曲线</th><td>正文 p.9 虽标为 Table 7，内容是 Permuted MNIST 随任务序列推进的已见任务测试准确率。</td><td>横轴任务进度、纵轴已见任务准确率，补充最终单点；不与不同协议分数混排。</td></tr>
 <tr><th>附录 C 的重建消融</th><td>对照训练／测试使用原图还是重建图。</td><td>统一重建处理有帮助，但 AE 每任务先离线五轮，额外开销不能忽略。</td></tr>
 </tbody></table></div>
 <h3>实验解释还缺哪些控制？</h3><p>固定回放样本数不等于固定总计算：MIR 有候选评分与虚拟前向，GEN 还要搜索潜空间。应比较固定墙钟／前向次数／更新次数的结果，报告真实字节、模型参数与缓存精度。样本噪声、重复候选、遗漏少数类与虚拟步长不合适都可能削弱它。</p>
 <p>CIFAR M=20、50、100 时 ER-MIR 相对 ER 准确率增益为 2.3、6.9、6.3 个百分点；大容量相较 M=20 更明显，但增益不随容量严格单调。本教程覆盖主 Tables 1–6 与关键图解释；附录 A 更多预算结果只作为补充来源，不把其不同运行次数、表值或低样本 CIFAR 设置混入主表。复现仍须逐套固定数据划分、种子、代码版本与搜索范围。</p>
 <Source>原文 pp. 7–9，Tables 3、5、6、Figures 1–4；附录 A–C。</Source></div></div>;
}
