import { useMemo, useState } from 'react';
import { Canvas, Controls, Button, Chips, Feedback, Source, MatrixTable, Metric, Detail, WidgetFrame, fmt, palette, drawBars } from './shared';
import { X0, affine, center, readM02, spectrum } from './math';
const diagonal = (items:number[]) => items.map((value,i)=>items.map((_,j)=>i===j?value:0));

export function SpectrumExplorer() {
  const [choice,setChoice]=useState('affine');
  const [values,setValues]=useState<number[]>([...X0]);
  const [imported,setImported]=useState(false);
  const [notice,setNotice]=useState('');
  const matrix=useMemo(()=>choice==='concentrated'?diagonal([10,1,1,1]):choice==='uniform'?diagonal(Array(4).fill(Math.sqrt(103)/2)):choice==='centered'?center(affine(values)):affine(values),[choice,values]);
  const data=useMemo(()=>spectrum(matrix),[matrix]);
  const toy=choice==='concentrated'||choice==='uniform';
  const source=toy?'人工构造的 4×4 对角矩阵；与同列数据是不同案例':`${imported?'读者沿用的第2章最新有效数值':'本模块默认 X₀ = [−2, −1, 0, 1, 2]'}；${choice==='centered'?'仿射后按样本中心化':'仿射、未中心化'}；LN 前`;
  const undefinedLabel='未定义（全零）';
  const reset=()=>{setChoice('affine');setValues([...X0]);setImported(false);setNotice('');};
  return <WidgetFrame id="M03-spectrum">
    <Source kind="I + T" loc="p3 §3；p12 式16">以下矩阵与谱指标是实际公式计算的教学案例。</Source>
    <Chips label="选择谱案例" value={choice} onChange={value=>{setChoice(value);setNotice('');}} options={[{value:'affine',label:'同列仿射'},{value:'centered',label:'同列中心化'},{value:'concentrated',label:'能量集中'},{value:'uniform',label:'能量均匀'}]} />
    <Controls><Button onClick={()=>{const saved=readM02();if(!saved){setNotice('还没有第2章的有效记录；请先在上一章操作一次。本模块保留默认数据。');return;}setValues([...saved]);setImported(true);setChoice('centered');setNotice('已沿用第2章输入，并切到按样本中心化。常数列在此应得到零谱。');}}>沿用第2章数值</Button><Button onClick={reset}>重置本模块</Button></Controls>
    <p><strong>矩阵来源：</strong>{source}</p>
    {imported&&!toy&&<p>导入输入：[{values.map(v=>fmt(v,2)).join(', ')}]</p>}
    {notice&&<Feedback>{notice}</Feedback>}
    <Canvas label="左侧为奇异值，右侧为累计平方能量；全部精确数值可在下方表格阅读" height={240} draw={(ctx,w,h)=>{
      const padding=w*.065, top=44, bottom=h-36;
      ctx.fillStyle=palette.ink;ctx.font='14px sans-serif';ctx.fillText('累计能量',w*.565,24);
      ctx.strokeStyle=palette.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(padding,top);ctx.lineTo(padding,bottom);ctx.lineTo(w*.46,bottom);ctx.moveTo(w*.565,top);ctx.lineTo(w*.565,bottom);ctx.lineTo(w*.94,bottom);ctx.stroke();
      drawBars(ctx,data.s,padding+6,top,w*.37,bottom-top,palette.blue);
      if(data.energy>0){
        const left=w*.58,right=w*.94;
        ctx.strokeStyle=palette.orange;ctx.lineWidth=2.5;ctx.beginPath();
        data.cumulative.forEach((v,i)=>{const x=left+i/Math.max(1,data.s.length-1)*(right-left),y=bottom-v*(bottom-top);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
        data.cumulative.forEach((v,i)=>{ctx.fillStyle=palette.orange;ctx.beginPath();ctx.arc(left+i/Math.max(1,data.s.length-1)*(right-left),bottom-v*(bottom-top),4,0,Math.PI*2);ctx.fill();});
        [.95,.99].forEach(target=>{ctx.strokeStyle=palette.line;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(w*.565,bottom-target*(bottom-top));ctx.lineTo(w*.95,bottom-target*(bottom-top));ctx.stroke();ctx.setLineDash([]);});
      }
    }} />
    <div style={{display:'flex',gap:'0.8rem',flexWrap:'wrap'}} aria-live="polite">
      <Metric label="数值秩" value={String(data.rank)} />
      <Metric label="平方能量 Σs²" value={fmt(data.energy)} />
      <Metric label="教学 k95" value={data.k95===null?undefinedLabel:String(data.k95)} />
      <Metric label="教学 k99" value={data.k99===null?undefinedLabel:String(data.k99)} />
      <Metric label="熵有效秩" value={data.effective===null?undefinedLabel:fmt(data.effective)} />
    </div>
    {!data.converged&&<Feedback tone="bad">数值分解未收敛，当前谱结果不可用于结论；请重置本模块。</Feedback>}
    <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}><caption>奇异值与累计平方能量（按奇异值降序）</caption><thead><tr><th>序号</th><th>奇异值 s</th><th>累计平方能量</th></tr></thead><tbody>{data.s.map((s,i)=><tr key={i}><td>{i+1}</td><td>{fmt(s,6)}</td><td>{data.energy===0?undefinedLabel:`${fmt(data.cumulative[i]*100,2)}%`}</td></tr>)}</tbody></table></div>
    <Feedback>{data.energy===0?'这里没有非零谱：数值秩为 0；累计能量比例和熵有效秩都未定义，不能显示成 100% 或 1。':choice==='concentrated'?'4 个非零方向，但第一项承担约 97.09% 的平方能量。教学 k95 = 1 不代表矩阵的数值秩变成 1。':choice==='uniform'?'总平方能量仍为 103，数值秩仍为 4；现在四个方向均匀分担，教学 k95 和 k99 都需要 4 项。':choice==='centered'?'按样本中心化去掉共同偏置方向；这是 LN 之前、固定列共享映射的条件性结论。':'奇异值有 4 个槽位，但只有超过容差的项计入数值秩。默认仿射案例有 2 个非零方向。'}</Feedback>
    <p><strong>本图指标：</strong>数值秩 = #{'{'}sᵢ &gt; τ{'}'}，τ = 10⁻¹⁰ smax = {data.threshold.toExponential(2)}；k95/k99 按 <strong>Σs²</strong> 覆盖率计算；熵有效秩用 <strong>pᵢ = sᵢ / Σs</strong>。</p>
    <Detail title="查看完整矩阵与公式边界"><MatrixTable matrix={matrix} label="用于本次 SVD 的完整矩阵" /><p>A = UΣVᵀ；累计平方能量 Cₖ = (Σᵢ₌₁ᵏ sᵢ²) / (Σᵢ sᵢ²)。熵有效秩 r_eff = exp(−Σᵢ pᵢ log pᵢ)，零 p 项贡献按 0 处理。</p><p>“能量集中”采用 diag(10,1,1,1)；“能量均匀”采用 diag(√103/2, √103/2, √103/2, √103/2)。两例总平方能量相同，便于只比较分布。</p><p>论文的 Rank@95/99 未明确说明采用 Σs 还是 Σs²，数值秩容差也未给出。本页使用明确的教学约定，不能宣称重现论文指标；这些值与真实预测准确率没有联动。</p></Detail>
  </WidgetFrame>;
}

