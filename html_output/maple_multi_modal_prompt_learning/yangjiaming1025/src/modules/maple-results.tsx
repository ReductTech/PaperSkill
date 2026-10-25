import { useEffect, useRef, useState } from 'react';
import { Stage, C, box, line, label, Chips, Notice, Stat, Lab, Legend } from './maple-kit';

const methods = ['CLIP', 'CoOp', 'Co-CoOp', 'MaPLe'];
const colors = [C.muted, C.blue, C.orange, C.green];
const metrics = ['Base', 'New', 'HM'];
const datasets = [
  { name: '11 数据集汇总', source: 'Table 3(a)', rows: [[69.34,74.22,71.70],[82.69,63.22,71.66],[80.47,71.69,75.83],[82.28,75.14,78.55]], conclusion: 'MaPLe 相对 Co-CoOp：Base +1.81、New +3.45、HM +2.72 个百分点。但平均 Base 82.28 仍低于 CoOp 的 82.69。' },
  { name: 'ImageNet', source: 'Table 3(b)', rows: [[72.43,68.14,70.22],[76.47,67.88,71.92],[75.98,70.43,73.10],[76.66,70.54,73.47]], conclusion: '这里的 New 提升较小：MaPLe 70.54，Co-CoOp 70.43，相差 0.11 个百分点。总体平均收益不代表每个数据集都获得同样幅度的提升。' },
  { name: 'EuroSAT', source: 'Table 3(k)', rows: [[56.48,64.05,60.03],[92.19,54.74,68.69],[87.49,60.04,71.21],[94.07,73.23,82.35]], conclusion: '这个遥感数据集上的收益更大：New 从 Co-CoOp 的 60.04 提升至 73.23，增加 13.19 个百分点；HM 从 71.21 提升至 82.35。' },
  { name: 'FGVCAircraft', source: 'Table 3(h)', rows: [[27.19,36.29,31.09],[40.44,22.30,28.75],[33.41,23.71,27.74],[37.44,35.61,36.50]], conclusion: 'MaPLe 的 HM 最高，但 New 35.61 仍低于原始 CLIP 的 36.29。改善 Base 与 New 的平衡，不等于每项都胜过 CLIP。' },
];

export function MapleResults() {
  const [dataset, setDataset] = useState(0);
  const [metric, setMetric] = useState(2);
  const [toyBase, setToyBase] = useState(80);
  const d = datasets[dataset];
  const values = d.rows.map(row => row[metric]);
  const winner = values.indexOf(Math.max(...values));
  const rendered = useRef(values);
  const anim = useRef({ from: values, to: values, start: 0 });
  useEffect(() => { anim.current = { from: rendered.current.slice(), to: datasets[dataset].rows.map(row => row[metric]), start: performance.now() }; }, [dataset, metric]);
  const toyDisplay = useRef(80);
  const toyNew = 160 - toyBase;
  const toyHM = 2 * toyBase * toyNew / 160;
  return <Lab>
    <div className="maple-tag">论文真实数据 · Base-to-new · 准确率单位 %</div>
    <Chips items={datasets.map(x => x.name)} value={dataset} onChange={setDataset} label="选择数据集" />
    <Chips items={metrics} value={metric} onChange={setMetric} label="选择指标" />
    <Stage width={1080} height={330} label={d.name + '的' + metrics[metric] + '准确率。' + methods.map((m, i) => m + ' ' + values[i].toFixed(2)).join('；')} draw={(ctx,w,h)=>{
      ctx.save();ctx.scale(w/1080,h/330);box(ctx,24,24,1032,282,'#fff',C.border,20);
      const left=207,width=722;
      for(let tick=0;tick<=100;tick+=20){const x=left+width*tick/100;line(ctx,x,51,x,277,C.border,1);label(ctx,String(tick),x,293,12,C.muted,'center');}
      const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const progress=reduce?1:Math.min(1,Math.max(0,(performance.now()-anim.current.start)/520)),eased=1-Math.pow(1-progress,3);
      const display=anim.current.to.map((v,i)=>anim.current.from[i]+(v-anim.current.from[i])*eased);rendered.current=display;
      methods.forEach((method,i)=>{const y=61+i*53;
        if(i===winner)box(ctx,36,y-9,1005,48,'#fff5f8',undefined,12);
        label(ctx,method,185,y+15,17,i===winner?C.blue:C.ink,'right');
        box(ctx,left,y,width,29,'#f7eff3',undefined,7);box(ctx,left,y,width*display[i]/100,29,colors[i],undefined,7);
        const end=left+width*display[i]/100;ctx.beginPath();ctx.arc(end,y+14.5,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
        label(ctx,values[i].toFixed(2),1007,y+15,18,i===winner?C.blue:C.ink,'right');
      });
      ctx.restore();
    }} />
    <p className="maple-source">指标说明：Base 为已见类别；New 为新类别（原文 Novel）；HM 为两者的调和平均。</p>
    <Notice tone={dataset === 3 ? 'orange' : 'green'}>{d.conclusion}</Notice>
    <div style={{ overflowX: 'auto' }}><table>
      <caption style={{ textAlign: 'left', margin: '12px 0' }}>{d.source} · {d.name} · 完整数值（%）</caption>
      <thead><tr><th scope="col">方法</th>{metrics.map((m,i) => <th scope="col" key={m} style={{ color: i === metric ? C.green : undefined }}>{m}</th>)}</tr></thead>
      <tbody>{methods.map((m,i) => <tr key={m} style={{ background: i === winner ? '#fff5f8' : undefined }}><th scope="row">{m}</th>{d.rows[i].map((value,j) => <td key={j} style={{ fontWeight: j === metric ? 700 : 400 }}>{value.toFixed(2)}</td>)}</tr>)}</tbody>
    </table></div>
    <p className="maple-source">来源：{d.source}。学习方法采用论文的 16-shot Base-to-new 设置；CLIP 为 zero-shot 基线。柱形使用固定 0–100 刻度，动画只用于切换已报告数据。</p>
    {dataset === 0 && <Notice tone="blue"><strong>汇总口径：</strong>先平均 11 个数据集的 Base 与 New，再计算 HM。H(82.28, 75.14)≈78.55；它不是 11 个单数据集 HM 的算术平均。</Notice>}
    <details><summary>这些结果不能说明什么？</summary><p>MaPLe 的 New 准确率超过 Co-CoOp 的 11/11 个数据集，但只超过原始 CLIP 的 6/11 个数据集。三次运行的报告均值也不能单独告诉我们一个微小分差是否具有统计显著性。</p></details>
    <div style={{ marginTop: 26, borderTop: '1px dashed ' + C.border, paddingTop: 12 }}>
      <div className="maple-tag">独立数学练习 · 人为设定 · 不是论文实验</div>
      <p><strong>固定算术平均值 80：</strong>令 B+N=160，观察两项分数越来越不均衡时，HM 如何改变。这个约束只是数学练习，不表示真实训练中 Base 与 New 必须此消彼长。</p>
      <label htmlFor="maple-hm-base">练习分数 B：{toyBase}；N 自动取 160−B={toyNew}<input id="maple-hm-base" type="range" min="60" max="100" step="1" value={toyBase} onChange={e => setToyBase(Number(e.target.value))} style={{ display: 'block', width: '100%', margin: '12px 0' }} /></label>
      <div style={{display:'flex',gap:10,margin:'12px 0',flexWrap:'wrap'}}><button className="maple-action-button" onClick={()=>setToyBase(80)}>回到均衡：80 / 80</button><button className="maple-action-button" onClick={()=>setToyBase(100)}>拉开差距：100 / 60</button></div>
      <Stage width={1080} height={210} label={'数学练习，B=' + toyBase + '，N=' + toyNew + '，算术平均固定80，HM=' + toyHM.toFixed(2)} draw={(ctx,w,h)=>{
        ctx.save();ctx.scale(w/1080,h/210);box(ctx,25,24,815,161,'#fff',C.border,18);box(ctx,861,24,194,161,'#fff',C.border,18);
        const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;toyDisplay.current+=(toyBase-toyDisplay.current)*(reduce?1:.16);const shownBase=toyDisplay.current,shownNew=160-shownBase;
        const left=134,scale=6.55;label(ctx,'B',83,72,18,C.blue,'center');label(ctx,'N',83,129,18,C.orange,'center');
        box(ctx,left,57,100*scale,28,'#f7eff3',undefined,7);box(ctx,left,114,100*scale,28,'#f7eff3',undefined,7);
        box(ctx,left,57,shownBase*scale,28,C.blue,undefined,7);box(ctx,left,114,shownNew*scale,28,C.orange,undefined,7);
        [shownBase,shownNew].forEach((v,i)=>{ctx.beginPath();ctx.arc(left+v*scale,71+i*57,5,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();});
        line(ctx,left+80*scale,42,left+80*scale,155,C.purple,1.5,[3,5]);label(ctx,'平均 80',left+80*scale,169,12,C.purple,'center');
        label(ctx,'HM',958,64,13,C.muted,'center');label(ctx,toyHM.toFixed(2),958,105,33,C.green,'center');label(ctx,'固定平均的数学练习',958,151,11,C.muted,'center');ctx.restore();
      }} />
      <div className="maple-grid"><Stat label="固定算术平均" value="80" note="(B+N)÷2"/><Stat label="当前调和平均" value={toyHM.toFixed(2)} note="2BN÷(B+N)"/><Stat label="与 80 的差" value={(80-toyHM).toFixed(2)} note="仅在固定算术平均条件下比较"/></div>
      <Notice tone="orange">{toyBase === 80 ? '80 与 80 时，HM 也等于 80。' : '两端不均衡，HM 降到 ' + toyHM.toFixed(2) + '。'} “越平衡越好”只适用于这里固定算术平均的比较；真实结果仍需同时查看两项分数。</Notice>
    </div>
  </Lab>;
}
