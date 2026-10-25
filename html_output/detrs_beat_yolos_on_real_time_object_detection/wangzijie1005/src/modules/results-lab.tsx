import { useEffect, useState } from 'react';
import { C, Scene, clear, bar, text, Feedback, Source } from './shared-kit';

type Metric = 'AP' | 'FPS' | 'APS';
const rows = [
  { name: 'YOLOv8-L', AP:52.9, FPS:71, APS:35.3, color:C.blue },
  { name: 'YOLOv8-X', AP:53.9, FPS:50, APS:35.7, color:C.blue },
  { name: 'YOLOv7-X', AP:52.9, FPS:45, APS:36.9, color:C.blue },
  { name: 'RT-DETR-R50', AP:53.1, FPS:108, APS:34.8, color:C.green },
  { name: 'RT-DETR-R101', AP:54.3, FPS:74, APS:36.0, color:C.green },
];
const domains: Record<Metric, number> = { AP:60, FPS:120, APS:40 };
const messages: Record<Metric, string> = {
  AP: '在 Table 2 的作者设置下，RT-DETR-R50/R101 分别为 53.1/54.3 AP；R50 比 YOLOv8-L 高 0.2 个 AP 点。本文没有多次种子或置信区间，不能把微小点差称为统计显著。',
  FPS: '速度限定 NVIDIA T4、TensorRT FP16、batch size 1；YOLO 计入对应 NMS，排除 I/O 与 MemoryCopy。108/71−1≈52.1% 是表中 FPS 的算术比较，不是新的测速或整套视频系统速度。',
  APS: '小目标指标改变了排名：YOLOv7-X 为 36.9 APs，RT-DETR-R101 为 36.0；R50 也低于 YOLOv8-L。标题不能理解成在所有指标与场景里全面领先。',
};

export function ResultsLab() {
  const [metric, setMetric] = useState<Metric>('AP');
  const [running, setRunning] = useState(false);
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setRunning(false), 1450);
    return () => window.clearTimeout(timer);
  }, [running, run]);
  function start() {
    setRun(r => r + 1);
    setRunning(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function choose(next: Metric) { setMetric(next); setRunning(false); }
  const best = Math.max(...rows.map(r => r[metric]));
  return <div onKeyDown={e => { if (e.key.startsWith('Arrow')) e.stopPropagation(); }}>
    <div className="chip-row" role="group" aria-label="比较指标" style={{ flexWrap: 'wrap' }}>
      {(['AP','FPS','APS'] as Metric[]).map(m => <button type="button" key={m} className="chip" aria-pressed={metric === m}
        style={metric === m ? { background:'#eaf3e6', borderColor:C.green } : undefined} onClick={() => choose(m)}>{m === 'APS' ? 'APs · 小目标' : m}</button>)}
      <button className="chip" type="button" onClick={start}>{running ? '重新开始比较' : '开始比较'}</button>
    </div>
    <p style={{ fontSize:16 }}>同一指标共享零基线，当前范围 0–{domains[metric]} {metric === 'APS' ? 'APs' : metric}；下表保留精确值。条长动画只展示论文数据。</p>
    <Scene key={`${metric}-${run}`} height={260} animate={running}
      label={`作者Table 2五模型${metric}比较，图中行号与下表一致；所有精确数值可从表格读取。`}
      draw={(ctx,t) => {
        clear(ctx,560,260);
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const progress = running && !reduce ? Math.min(1,Math.max(0,t/1.4)) : 1;
        const eased = 1-Math.pow(1-progress,3);
        ctx.beginPath(); ctx.moveTo(44,19); ctx.lineTo(44,239); ctx.lineTo(536,239); ctx.strokeStyle=C.line; ctx.stroke();
        rows.forEach((r,i) => {
          text(ctx,String(i+1),20,47+i*43,C.ink);
          bar(ctx,45,28+i*43,486,25,'#e8ece5');
          bar(ctx,45,28+i*43,486*r[metric]/domains[metric]*eased,25,r.color);
          if (r[metric] === best) { ctx.beginPath(); ctx.arc(545,40+i*43,4,0,Math.PI*2); ctx.fillStyle=C.orange; ctx.fill(); }
        });
        text(ctx,'0',40,257,C.ink); text(ctx,String(domains[metric]),505,257,C.ink);
      }} />
    <p style={{ fontSize:14 }}>蓝色：论文测试的 YOLO；绿色：RT-DETR；橙点：当前五个模型中该指标最高值。越大越好。</p>
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%',borderCollapse:'collapse',fontSize:16 }}>
        <caption style={{ textAlign:'left',padding:'8px 0' }}>原文 Table 2 · COCO val2017 · 输入 640×640</caption>
        <thead><tr><th scope="col">模型</th><th scope="col">AP</th><th scope="col">FPS</th><th scope="col">APs</th></tr></thead>
        <tbody>{rows.map((r,i)=><tr key={r.name} style={{ background:r[metric]===best?'#eaf3e6':'transparent' }}>
          <th scope="row" style={{ textAlign:'left',padding:'5px 3px' }}>{i+1}. {r.name}</th>
          {(['AP','FPS','APS'] as Metric[]).map(m=><td key={m} style={{ textAlign:'center',fontWeight:m===metric?700:400 }}>{m==='FPS'?r[m]:r[m].toFixed(1)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <Feedback><strong>{running ? '比较进行中：' : '比较结果：'}</strong>{messages[metric]}</Feedback>
    <Source page={7} label="原文 P7 · Table 2；测速边界见 P3 §3.2" />
    <p style={{ fontSize:16 }}>结论只覆盖论文当年测试的模型与协议。页面没有运行模型；图表不能代替你在目标硬件、数据和完整应用链路上的验证。</p>
  </div>;
}
