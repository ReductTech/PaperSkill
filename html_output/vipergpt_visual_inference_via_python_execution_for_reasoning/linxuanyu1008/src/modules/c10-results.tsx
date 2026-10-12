import React, { useCallback, useEffect, useState } from 'react';
import { ViperCanvas, C, clearScene, box, line, label } from './viper-kit';

type Result = { task: string; protocol: string; metric: string; training: '零样本' | '监督'; method: string; value: number; source: string };
const records: Result[] = [];
function append(task: string, protocol: string, metric: string, training: Result['training'], source: string, values: readonly (readonly [string, number])[]) {
  for (const [method, value] of values) records.push({ task, protocol, metric, training, method, value, source });
}
append('RefCOCO', 'testA', 'IoU (%) ↑', '零样本', 'PDF 第4页 表1', [['ViperGPT',72.0], ['ReCLIP',58.6], ['GLIP',55.0], ['OWL-ViT',30.3]]);
append('RefCOCO+', 'testA', 'IoU (%) ↑', '零样本', 'PDF 第4页 表1', [['ViperGPT',67.0], ['ReCLIP',60.5], ['GLIP',52.2], ['OWL-ViT',29.4]]);
append('RefCOCO', 'testA', 'IoU (%) ↑', '监督', 'PDF 第4页 表1', [['MDETR',90.4], ['OFA',94.0]]);
append('RefCOCO+', 'testA', 'IoU (%) ↑', '监督', 'PDF 第4页 表1', [['MDETR',85.5], ['OFA',91.7]]);
append('GQA', 'test-dev', '准确率 (%) ↑', '零样本', 'PDF 第5页 表2', [['ViperGPT',48.1], ['BLIP-2',44.7]]);
append('GQA', 'test-dev', '准确率 (%) ↑', '监督', 'PDF 第5页 表2', [['LGCN',55.8], ['LXMERT',60.0], ['NSM',63.0], ['CRF',72.1]]);
append('OK-VQA', '正文未注明拆分', '准确率 (%) ↑', '零样本', 'PDF 第6页 表3', [['ViperGPT',51.9], ['Flamingo',50.6], ['BLIP-2',45.9], ['PICa',43.3], ['PNP-VQA',35.9]]);
append('OK-VQA', '正文未注明拆分', '准确率 (%) ↑', '监督', 'PDF 第6页 表3', [['TRiG',50.5], ['KAT',54.4], ['RA-VQA',54.5], ['REVIVE',58.0], ['PromptCap',58.8]]);
append('NExT-QA', 'hard-T / 多选', '准确率 (%) ↑', '零样本', 'PDF 第7页 表4', [['ViperGPT',49.8]]);
append('NExT-QA', 'hard-T / 多选', '准确率 (%) ↑', '监督', 'PDF 第7页 表4', [['HiTeA',48.6], ['ATP',45.3]]);
append('NExT-QA', 'hard-C / 多选', '准确率 (%) ↑', '零样本', 'PDF 第7页 表4', [['ViperGPT',56.4]]);
append('NExT-QA', 'hard-C / 多选', '准确率 (%) ↑', '监督', 'PDF 第7页 表4', [['HiTeA',47.8], ['ATP',43.3]]);
append('NExT-QA', '完整集 / 多选', '准确率 (%) ↑', '零样本', 'PDF 第7页 表4', [['ViperGPT',60.0]]);
append('NExT-QA', '完整集 / 多选', '准确率 (%) ↑', '监督', 'PDF 第7页 表4', [['HiTeA',63.1], ['VGT',56.9], ['ATP',54.3]]);

const protocols = [
  { name: 'RefCOCO', task: 'RefCOCO', protocol: 'testA', methods: ['ViperGPT','ReCLIP','GLIP'] },
  { name: 'GQA', task: 'GQA', protocol: 'test-dev', methods: ['ViperGPT','BLIP-2'] },
  { name: 'OK-VQA', task: 'OK-VQA', protocol: '正文未注明拆分', methods: ['ViperGPT','Flamingo','BLIP-2'] },
  { name: '困难时间', task: 'NExT-QA', protocol: 'hard-T / 多选', methods: ['ViperGPT','HiTeA','ATP'] },
  { name: '困难因果', task: 'NExT-QA', protocol: 'hard-C / 多选', methods: ['ViperGPT','HiTeA','ATP'] },
  { name: '完整集', task: 'NExT-QA', protocol: '完整集 / 多选', methods: ['ViperGPT','HiTeA','VGT'] },
  { name: 'RefCOCO+', task: 'RefCOCO+', protocol: 'testA', methods: ['ViperGPT','ReCLIP','GLIP'] },
];
const colors = [C.green, C.blue, "#98a6b8"];
function EvidenceTable({ training, dataRows = records, current = false }: { training: Result['training']; dataRows?: Result[]; current?: boolean }) {
  return <div style={{ overflowX: 'auto' }}><table className="paper" style={{fontSize:18}}><caption style={{ textAlign: 'left', fontWeight: 600, paddingTop: 10 }}>{current ? '当前评测 · ' : '原论文完整结果 · '}{training}记录 · ICCV 2023</caption>
    <thead><tr><th scope="col">任务</th><th scope="col">协议</th><th scope="col">方法</th><th scope="col">训练方式</th><th scope="col">指标</th><th scope="col">分数</th><th scope="col">来源</th></tr></thead>
    <tbody>{dataRows.filter(r => r.training === training).map(r => <tr data-viper={r.method==='ViperGPT'} key={`${r.task}-${r.protocol}-${r.method}`}>
      <td>{r.task}</td><td>{r.protocol}</td><td>{r.method}</td><td>{r.training}</td><td>{r.metric}</td><td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: r.method === 'ViperGPT' ? 700 : 400 }}>{r.value.toFixed(1)}</td><td>{r.source}</td>
    </tr>)}</tbody>
  </table></div>;
}
export function ViperBenchmarkRace() {
  const [protocol, setProtocol] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const selected = protocols[protocol];
  const currentRows = records.filter(r => r.task === selected.task && r.protocol === selected.protocol);
  const isFullSet = selected.task === 'NExT-QA' && selected.protocol === '完整集 / 多选';
  const rows = selected.methods.map(method => records.find(r => r.task === selected.task && r.protocol === selected.protocol && r.method === method)!);
  const baseline = rows[1];
  const delta = rows[0].value - baseline.value;
  const deltaText = `在 ${selected.task} · ${selected.protocol} 的相同指标上，ViperGPT ${rows[0].value.toFixed(1)} 对比 ${baseline.method} ${baseline.value.toFixed(1)}，${delta >= 0 ? '高' : '低'} ${Math.abs(delta).toFixed(1)} 个百分点；训练方式分别为${rows[0].training}和${baseline.training}。`;
  useEffect(() => {
    if (phase !== 'running') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhase('done'); return; }
    const timer = window.setTimeout(() => setPhase('done'), 1500);
    return () => window.clearTimeout(timer);
  }, [phase, protocol]);
  const draw = useCallback((ctx: CanvasRenderingContext2D, timeMs: number) => {
    clearScene(ctx, 1080, 280);
    const progress = phase === 'idle' ? 0 : phase === 'done' ? 1 : Math.max(0, Math.min(1, timeMs / 1500));
    const axisX = 250, axisW = 740;
    line(ctx, axisX, 248, axisX + axisW, 248, C.muted, 2.5);
    line(ctx, axisX, 30, axisX, 248, C.muted, 2.5);
    label(ctx, '0', axisX - 5, 265, C.muted, 18); label(ctx, '100', axisX + axisW - 18, 265, C.muted, 18);
    for (let i = 1; i < 5; i++) line(ctx, axisX + axisW * i / 5, 32, axisX + axisW * i / 5, 245, C.border, 1);
    rows.forEach((row, i) => {
      const y = 48 + i * 68;
      box(ctx, axisX, y, axisW, 36, '#ffffff', C.border, 4);
      const w = axisW * row.value / 100 * progress;
      if(phase==='idle')box(ctx,axisX,y,axisW*.12,36,'#dfe5eb','#dfe5eb',4);else if (w > 0) box(ctx, axisX, y, w, 36, colors[i], colors[i], 4);

    });
  }, [phase, protocol]);
  const feedback = phase === 'idle' ? '先选择评测，再比较；每条记录都保留训练方式与指标方向。'
    : phase === 'running' ? '正在重放论文报告值；动画时长不代表模型运行速度。'
    : isFullSet ? `${deltaText} 完整集未超过 HiTeA，不能宣称总体第一。`
    : selected.task === 'NExT-QA' ? `${deltaText} 这个结论只适用于所选困难子集。`
    : selected.task === 'GQA' ? `${deltaText} 表2中监督CRF为72.1；本方法领先所列零样本方法，没有超过监督方法。`
    : `${deltaText} 所列零样本比较中得分更高；监督结果在完整表格中，不能混称全面超越。`;
  return <div style={{fontSize:18,lineHeight:1.55}}>
    <div className="viper-protocol" aria-label="当前评测条件"><strong>{selected.task} · {selected.protocol}</strong><span>{rows[0].metric}</span><span>{rows[0].source}</span></div>
    <div className="benchmark-controls" role="group" aria-label="选择数据集">{['RefCOCO','RefCOCO+','GQA','OK-VQA','NExT-QA'].map(task=><button type="button" className={`chip ${selected.task===task?'selected':''}`} key={task} aria-pressed={selected.task===task} onClick={()=>{setProtocol(protocols.findIndex(p=>p.task===task));setPhase('idle');}}>{task}</button>)}</div>
    {selected.task==='NExT-QA'&&<div className="benchmark-controls benchmark-splits" role="group" aria-label="选择NExT-QA切片">{[3,4,5].map((p,i)=><button type="button" key={p} className={`chip ${protocol===p?'selected':''}`} aria-pressed={protocol===p} onClick={()=>{setProtocol(p);setPhase('idle');}}>{['Hard-T','Hard-C','Full'][i]}</button>)}</div>}
    <button type="button" className="tiny" disabled={phase==='running'} onClick={()=>setPhase('running')}>{phase==='running'?'正在比较':phase==='done'?'重新比较':'开始比较'}</button>
    <div className="viper-legend" aria-label="条形顺序与训练方式">{rows.map((row, i) => <span key={row.method} style={{ borderLeft: `5px solid ${colors[i]}`, paddingLeft: 8 }}>{i + 1} · {row.method} · {row.training}</span>)}</div>
    <div style={{position:'relative'}}><p style={{margin:'0 0 8px',textAlign:'right',color:C.muted}}>↑ 分数越高越好 · {phase==='idle'?'点击「开始比较」播放结果':'重放论文报告值'}</p><div style={{position:'relative'}}><ViperCanvas draw={draw} animate={phase === 'running'} ariaLabel={`${selected.name}，统一 0 至 100 分刻度，分数越高越好；${rows.map(r => `${r.method} ${r.value.toFixed(1)}，${r.training}`).join('；')}`} />{rows.map((r,i)=><React.Fragment key={r.method}><span style={{position:'absolute',left:'1%',top:`${(66+i*68)/280*100}%`,transform:'translateY(-50%)',fontSize:'clamp(12px,1.3vw,18px)',fontWeight:600,color:colors[i]}}>{r.method}</span><span style={{position:'absolute',left:phase==='done'?`${(250+740*r.value/100+10)/1080*100}%`:'95%',top:`${(66+i*68)/280*100}%`,transform:'translateY(-50%)',fontSize:16,color:colors[i]}}>{phase==='done'?r.value.toFixed(1):'—'}</span></React.Fragment>)}</div></div>
    <div className={`feedback ${phase === 'done' && !isFullSet ? 'good' : ''}`} aria-live="polite">{feedback}</div>
    <p style={{color:C.muted}}>zero-shot：没有针对该 benchmark 进行额外任务训练；底层模型已经预训练。</p><EvidenceTable training="零样本" dataRows={currentRows.filter(r=>r.method==='ViperGPT'||r.method===baseline.method)} current />
    {baseline.training==='监督'&&<EvidenceTable training="监督" dataRows={[baseline]} current />}
    <details style={{ marginTop: 18 }}><summary style={{ cursor: 'pointer', color: C.blue, fontSize: 18, fontWeight: 600 }}>展开原论文四张结果表的全部 38 条分数记录</summary>
      <p>表1：12 条；表2：6 条；表3：10 条；表4：10 条。NExT-QA 的 VGT 在困难子集未报告值，以缺失处理，不补造。表1指标标为 IoU (%)，正文描述 REC accuracy；原文未注明阈值。本页数值为 ICCV 2023 论文报告值，不代表当前排名。</p>
      <EvidenceTable training="零样本" /><EvidenceTable training="监督" />
    </details>
  </div>;
}
