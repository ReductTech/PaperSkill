import {DomainScene} from './VisualLessons';
import { useState } from 'react';
import { SceneCanvas, drawGarden, drawRobot, drawPrompt, drawTarget, C } from './GardenKit';

const domains = [
  { name:'SQuAD', m:94.9, ms:0.2, p:94.8, ps:0.1 },
  { name:'TextbookQA', m:54.3, ms:3.7, p:66.8, ps:2.9 },
  { name:'BioASQ', m:77.9, ms:0.4, p:79.1, ps:0.3 },
  { name:'RACE', m:59.8, ms:0.6, p:60.7, ps:0.5 },
  { name:'RE', m:88.4, ms:0.1, p:88.8, ps:0.2 },
  { name:'DuoRC', m:68.9, ms:0.7, p:67.7, ps:1.1 },
  { name:'DROP', m:68.9, ms:1.7, p:67.1, ps:1.9 },
];
const transfers = [
  { name:'QQP → MRPC', accM:73.1, accMs:0.9, accP:76.3, accPs:0.1, fM:81.2, fMs:2.1, fP:84.3, fPs:0.3 },
  { name:'MRPC → QQP', accM:74.9, accMs:1.3, accP:75.4, accPs:0.8, fM:70.9, fMs:1.2, fP:69.7, fPs:0.3 },
];
const fmt = (n:number,s:number) => `${n.toFixed(1)} ± ${s.toFixed(1)}`;

export function DomainWidget() {
  const [index,setIndex] = useState(1);
  const [direction,setDirection] = useState(0);
  const d = domains[index]; const delta = d.p-d.m; const transfer=transfers[direction];
  return <div className="experiment">
    <p>同样的阅读任务，换一处花园。训练和选取检查点都在 SQuAD 内域完成，迁移时不再用目标域训练。</p>
    <div className="trainer-controls" aria-label="选择问答评估数据集">{domains.map((item,i) => <button key={item.name} className={`trainer-button ${index===i?'is-selected':''}`} aria-pressed={index===i} onClick={()=>setIndex(i)}>{item.name}{i===0?' · 内域':''}</button>)}</div>
    <DomainScene name={d.name} m={d.m} p={d.p} ms={d.ms} ps={d.ps}/>
    <p className="metric-line">{d.name} · F1 ↑：模型调优 {fmt(d.m,d.ms)} / 提示调优 {fmt(d.p,d.ps)}</p>
    <p className="trainer-feedback" role="status">提示调优相差 {delta>=0?'+':''}{delta.toFixed(1)} 个 F1 点。{index===0?'这是内域参照，不是跨域结果。':delta>0?'这个目的地有改善，但不能推广到所有领域。':'这是反例：冻结底座与轻量提示并不保证更好泛化。'}</p>
    <p className="evidence-note">Table 1，p7；3 次运行的均值 ± 标准差。跨域列为 MRQA 开发集；模型和提示采用同一 SQuAD 训练/内域选择协议。图柱从 0 起，误差线表示标准差。</p>
    <div style={{overflowX:'auto'}}><table><caption>论文 Table 1 · 全部问答结果 · F1 ↑</caption><thead><tr><th scope="col">数据集</th><th scope="col">模型调优</th><th scope="col">提示调优</th><th scope="col">提示 − 模型</th></tr></thead><tbody>{domains.map(item=><tr key={item.name}><th scope="row">{item.name}</th><td>{fmt(item.m,item.ms)}</td><td>{fmt(item.p,item.ps)}</td><td>{item.p-item.m>=0?'+':''}{(item.p-item.m).toFixed(1)}</td></tr>)}</tbody></table></div>
    <h4>另一项任务：同义判断的双向迁移</h4>
    <p>下面属于 Table 2 的独立协议：在 QQP 或 MRPC 训练并按训练域选择，在另一域零样本评估。它不与上面的问答 F1 混合排名。</p>
    <div className="trainer-controls">{transfers.map((t,i)=><button key={t.name} className={`trainer-button ${direction===i?'is-selected':''}`} aria-pressed={direction===i} onClick={()=>setDirection(i)}>{t.name}</button>)}</div>
    <p className="trainer-output" role="status">{transfer.name}：Accuracy ↑ 模型 {fmt(transfer.accM,transfer.accMs)} / 提示 {fmt(transfer.accP,transfer.accPs)}；F1 ↑ 模型 {fmt(transfer.fM,transfer.fMs)} / 提示 {fmt(transfer.fP,transfer.fPs)}。</p>
    <p className="evidence-note">Table 2，p8；均值 ± 标准差。MRPC → QQP 的 Accuracy 略增，但 F1 降低，收益依赖方向与指标。减少过拟合是论文对冻结底座的解释，不能当作因果证明。</p>
  </div>;
}
