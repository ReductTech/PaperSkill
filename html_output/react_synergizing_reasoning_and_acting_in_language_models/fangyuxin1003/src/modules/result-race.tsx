import { useEffect, useState } from 'react';
import { C, CanvasScene, Controls, Chip, Feedback, line, label } from './scene-kit';

type Dataset = 'HotpotQA' | 'FEVER' | 'ALFWorld' | 'WebShop';
type Row = { name: string; values: number[]; protocol?: string };
const methods = ['Standard', 'CoT', 'CoT-SC', 'Act', 'ReAct', 'CoT-SC → ReAct', 'ReAct → CoT-SC'];
const knowledge = {
  HotpotQA: [28.7, 29.4, 33.4, 25.7, 27.4, 34.2, 35.1],
  FEVER: [57.1, 56.3, 60.4, 58.9, 60.9, 64.6, 62.0],
};
const alf: Row[] = [
  { name: 'Act', values: [45], protocol: '6 种提示中的最佳' },
  { name: 'ReAct', values: [71], protocol: '6 种提示中的最佳' },
  { name: 'ReAct-IM', values: [53], protocol: '6 种提示中的最佳' },
  { name: 'BUTLER', values: [37], protocol: '原研究 8 个设置中的最佳' },
];
const shop: Row[] = [
  { name: 'Act', values: [30.1, 62.3] },
  { name: 'ReAct', values: [40.0, 66.6] },
  { name: 'IL', values: [29.1, 59.9] },
  { name: 'IL+RL', values: [28.7, 62.4] },
  { name: '人类专家', values: [59.6, 82.1] },
];
const colors = [C.blue, C.green, C.purple, C.orange];

export function ResultRace() {
  const [dataset, setDataset] = useState<Dataset>('HotpotQA');
  const [metric, setMetric] = useState<0 | 1>(0);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!running) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setProgress(1); setRunning(false); return; }
    const start = performance.now(); let raf = 0;
    function tick(now: number) {
      const next = Math.min(1, (now - start) / 1600);
      setProgress(next);
      if (next < 1) raf = requestAnimationFrame(tick); else setRunning(false);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  const rows: Row[] = dataset === 'ALFWorld' ? alf : dataset === 'WebShop' ? shop : methods.map((name, i) => ({ name, values: [knowledge[dataset][i]] }));
  const indexes = dataset === 'ALFWorld' ? [0, 1, 2, 3] : dataset === 'WebShop' ? [0, 1, 3, 4] : [1, 4, 5, 6];
  const plotted = indexes.map(i => rows[i]);
  const column = dataset === 'WebShop' ? metric : 0;
  const metricName = dataset === 'HotpotQA' ? '精确匹配率 EM（%）' : dataset === 'FEVER' ? '准确率（%）' : dataset === 'WebShop' && metric === 1 ? '属性覆盖分数' : '成功率（%）';
  const protocol = dataset === 'ALFWorld' ? '134 个未见游戏；展示各方法最佳报告设置，候选数量不同。Act、ReAct 和 ReAct-IM 使用贪心解码；BUTLER 使用束搜索。' : dataset === 'WebShop' ? '500 条测试指令；成功率要求满足全部条件，分数衡量属性覆盖。' : 'PaLM-540B；只提供问题或待核验声明，不给支持段落；主实验设置。';
  const feedback = dataset === 'HotpotQA' ? 'ReAct 27.4 低于 CoT 29.4。ReAct → CoT-SC 达到 35.1；仅靠加入检索，并不保证每个任务都获益。' : dataset === 'FEVER' ? 'ReAct 60.9 高于 CoT 56.3；CoT-SC → ReAct 为 64.6。组合策略的收益依赖该任务与回退协议。' : dataset === 'ALFWorld' ? 'ReAct 最佳 71%，BUTLER 最佳 37%，相差 34 个百分点；这是各自最佳报告设置的差异。ReAct 平均为 57%，不能说平均提升 34 点。' : metric === 0 ? 'ReAct 成功率 40.0%，仍低于人类专家 59.6%。部分属性匹配不等于完成整条购买指令。' : 'ReAct 属性覆盖分数 66.6，人类专家 82.1。此处是分数，不应读成任务成功率。';
  function reset() { setRunning(false); setProgress(0); }
  return <div>
    <p><strong>{dataset} · {metricName} · 越高越好</strong><br />{protocol}</p>
    <CanvasScene label={`${dataset} ${metricName}，四行依次为${plotted.map(r => r.name).join('、')}；${progress === 0 ? '待启动' : progress < 1 ? '正在揭示' : '已显示原表数值'}`} draw={ctx => {
      const left = 270, width = 700;
      for (let i = 0; i <= 4; i++) line(ctx, left + i * width / 4, 32, left + i * width / 4, 245, C.border, 1);
      plotted.forEach((row, index) => {
        const y = 48 + index * 50;
        label(ctx,row.name,38,y+20,colors[index],18);
        if(progress===1)label(ctx,row.values[column].toFixed(1),left+width*row.values[column]/100+12,y+20,colors[index],18);
        ctx.fillStyle = C.light; ctx.globalAlpha = 0.2; ctx.fillRect(left, y, width, 25); ctx.globalAlpha = 1;
        const barWidth = width * row.values[column] / 100 * progress;
        ctx.fillStyle = colors[index]; ctx.fillRect(left, y, barWidth, 25);
        ctx.beginPath(); ctx.arc(20, y + 12, 5, 0, Math.PI * 2); ctx.fill();
      });
      label(ctx, '0', left - 5, 268, C.muted, 19);
      label(ctx, '100', left + width - 30, 268, C.muted, 19);
    }} />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', margin: '12px 0' }} aria-label="图例，按条形从上到下">
      {plotted.map((row, i) => <span key={row.name}><span aria-hidden="true" style={{ display: 'inline-block', width: 10, height: 10, marginRight: 6, background: colors[i] }} />{i + 1}. {row.name}</span>)}
    </div>
    <Controls>{(['HotpotQA', 'FEVER', 'ALFWorld', 'WebShop'] as Dataset[]).map(name => <Chip key={name} active={dataset === name} onClick={() => { reset(); setDataset(name); setMetric(0); }}>{name}</Chip>)}
      {dataset === 'WebShop' && <><Chip active={metric === 0} onClick={() => { reset(); setMetric(0); }}>成功率</Chip><Chip active={metric === 1} onClick={() => { reset(); setMetric(1); }}>属性覆盖分数</Chip></>}
      <button type="button" disabled={running} onClick={() => { setProgress(0); setRunning(true); }}>{running ? '正在比较…' : progress === 1 ? '重新比较' : '启动比较'}</button>
    </Controls>
    <Feedback>{feedback}</Feedback>
    <div className="react-result-grid" aria-label={`${dataset} 完整实验数据`}>
      {rows.map(row => <div key={row.name} className={`react-result-row ${row.name.includes('ReAct') ? 'is-react' : ''}`}>
        <strong>{row.name}</strong>
        <span className="react-result-value">{dataset === 'ALFWorld' ? row.values[column] : row.values[column].toFixed(1)}{dataset === 'WebShop' && metric === 1 ? '' : '%'}</span>
        <span className="react-result-note">{row.protocol || (dataset === 'WebShop' ? `成功率 ${row.values[0].toFixed(1)}% · 属性覆盖分数 ${row.values[1].toFixed(1)}` : metricName)}</span>
      </div>)}
    </div>
    {dataset === 'ALFWorld' && <p><strong>平均设置另列：</strong>ReAct 57%，ReAct-IM 48%。ReAct-IM 使用 IM 风格的密集思考，主要描述当前目标与待完成子目标；其最佳值 53% 低于 ReAct 的 71%，提示灵活的常识推理、完成判断和子目标切换有价值。比较各自最佳设置时，ReAct 在六类任务中有五类优于 ReAct-IM，并非每类都更强。</p>}
    <div style={{ minHeight: 56 }} aria-live="polite"><p>{progress === 0 ? '条形等待启动，下方数据已经列出完整数值。' : running ? '条形正在同步揭示，下方数据数值保持不变。' : '条形已显示固定数值。只在当前任务、指标和协议内比较。'}</p></div>
  </div>;
}
