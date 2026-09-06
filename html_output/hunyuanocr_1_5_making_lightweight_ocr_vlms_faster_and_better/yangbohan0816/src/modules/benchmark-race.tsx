import React, { useEffect, useRef, useState } from 'react';
import { PaperCanvas, PaperWidgetProps, PALETTE, clearDesk, drawGuideLine, drawSceneLabel, drawTargetMark, Feedback, roundedRect } from './cascade-vs-unified';

const metrics = [
  { id: 'tf', title: 'Transformers · 延迟越低越好', unit: 's', baseLabel: 'AR', modelLabel: 'DFlash', base: 34.850, model: 5.474, max: 36, higherBetter: false, color: PALETTE.green, note: 'Table 2 · batch=1 · 34.850s → 5.474s · 6.37×', scope: 'OmniDocBench；Transformers 同框架单请求' },
  { id: 'vllm', title: 'vLLM · 延迟越低越好', unit: 's', baseLabel: 'AR', modelLabel: 'DFlash', base: 3.032, model: 1.408, max: 3.2, higherBetter: false, color: PALETTE.orange, note: 'Table 2 · 930 samples · 3.032s → 1.408s · 2.14×', scope: 'OmniDocBench；vLLM；930 样本；batch=1' },
  { id: 'omni', title: 'OmniDocBench v1.6 · Overall↑', unit: '', baseLabel: 'HunyuanOCR', modelLabel: 'HunyuanOCR‑1.5', base: 92.03, model: 94.74, max: 100, higherBetter: true, color: PALETTE.purple, note: 'Table 12 · 端到端文档解析 Overall：92.03 → 94.74', scope: '官方 v1.6 协议；多行公式匹配仍有协议差异' },
  { id: 'chaos', title: 'CHAOS-Bench · Page-avg Recall↑', unit: '', baseLabel: '次优基线', modelLabel: 'HunyuanOCR‑1.5', base: 6.33, model: 14.15, max: 16, higherBetter: true, color: PALETTE.red, note: 'Table 11 · 14.15 领先，但绝对召回仍低', scope: '扰动所见词的等页平均召回；不是通用准确率' }
];

export const BenchmarkRace: React.FC<PaperWidgetProps> = ({ chapterId, moduleId }) => {
  const [metricIndex, setMetricIndex] = useState(0); const [progress, setProgress] = useState(1); const timer = useRef<number | undefined>(undefined); const metric = metrics[metricIndex];
  const [lengthBand, setLengthBand] = useState<'reported'|'short'|'long'>('reported');
  const [concurrency, setConcurrency] = useState<'c1'|'c32'>('c1');
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);
  const start = () => { if (timer.current) window.clearInterval(timer.current); setProgress(0); let value = 0; timer.current = window.setInterval(() => { value += .04; setProgress(Math.min(1, value)); if (value >= 1 && timer.current) window.clearInterval(timer.current); }, 28); };
  const choose = (i: number) => { setMetricIndex(i); setProgress(1); setLengthBand('reported'); setConcurrency('c1'); if (timer.current) window.clearInterval(timer.current); };
  const speedMetric = metric.id === 'tf' || metric.id === 'vllm';
  const conclusion = (() => {
    if (!speedMetric) return metric.id === 'omni'
      ? '可说：在 OmniDocBench v1.6 官方协议下，Overall 从 92.03 提升到 94.74；不能说所有公式场景都已完美解决。'
      : '可说：CHAOS 的 14.15 高于对比模型；必须同时说绝对召回仍低，不能宣称幻觉已解决。';
    if (concurrency === 'c32' && lengthBand !== 'reported') return '不能把“2048+ token”与“并发 32”两个分表结果直接组合；论文没有报告这个联合条件。';
    if (concurrency === 'c32') return metric.id === 'vllm'
      ? 'Table 6：vLLM 在并发 32 时仍为 1.80×；高并发 GPU 更饱和，所以相对收益低于部分低并发设置。'
      : '并发扫描只在 vLLM 中报告，不能把并发 32 的结论移植到 Transformers。';
    if (lengthBand === 'short') return `Table 4：0–256 token 时 ${metric.id === 'tf' ? 'Transformers 4.56×' : 'vLLM 1.31×'}；短输出固定开销占比更高。`;
    if (lengthBand === 'long') return `Table 4：2048+ token 时 ${metric.id === 'tf' ? 'Transformers 6.67×' : 'vLLM 2.30×'}；长输出更能摊薄草拟—校验开销。`;
    return metric.id === 'tf'
      ? 'Table 2：同一 Transformers 协议、batch=1 下为 6.37×；不能推广成所有框架固定 6.37×。'
      : 'Table 2：vLLM、930 样本、batch=1 下为 2.14×；不能与 Transformers 原始延迟交叉比较。';
  })();
  const invalidClaim = speedMetric && concurrency === 'c32' && (lengthBand !== 'reported' || metric.id === 'tf');
  const draw = (ctx: CanvasRenderingContext2D) => {
    clearDesk(ctx, 560, 390); drawSceneLabel(ctx, `锁定协议：${metric.title}`, 280, 25, PALETTE.ink, 'center'); const left = 142, width = 338;
    const rows = [{ label: metric.baseLabel, value: metric.base, color: metric.higherBetter ? PALETTE.axis : PALETTE.red }, { label: metric.modelLabel, value: metric.model, color: metric.color }];
    rows.forEach((row, i) => { const y = 76 + i * 92; drawSceneLabel(ctx, row.label, 126, y + 24, PALETTE.ink, 'right'); roundedRect(ctx, left, y, width, 44, 7); ctx.fillStyle = '#edf1f6'; ctx.fill(); const bar = Math.max(5, width * row.value / metric.max * progress); roundedRect(ctx, left, y, bar, 44, 7); ctx.fillStyle = row.color; ctx.fill(); drawSceneLabel(ctx, `${(row.value * progress).toFixed(metric.id === 'tf' ? 3 : metric.id === 'vllm' ? 3 : 2)}${metric.unit}`, Math.min(left + bar + 38, 526), y + 27, row.color === PALETTE.axis ? PALETTE.muted : row.color, 'center'); });
    drawGuideLine(ctx, left, 249, left + width, 249, PALETTE.axis, 2); drawTargetMark(ctx, left + width * metric.model / metric.max * progress, 249, metric.color); drawSceneLabel(ctx, metric.note, 280, 279, metric.color, 'center'); drawSceneLabel(ctx, `${metric.higherBetter ? '↑ 越高越好' : '↓ 延迟越低越好'} · ${metric.scope}`, 280, 304, PALETTE.muted, 'center');
    roundedRect(ctx, 32, 326, 496, 46, 9); ctx.fillStyle = invalidClaim ? '#fde8ec' : '#fff'; ctx.fill(); ctx.strokeStyle = invalidClaim ? PALETTE.red : PALETTE.green; ctx.lineWidth = 2; ctx.stroke();
    drawSceneLabel(ctx, invalidClaim ? '证据未覆盖这个联合条件' : '结论已限定在当前实验协议', 280, 354, invalidClaim ? PALETTE.red : PALETTE.ink, 'center');
  };
  return <div className="paper-widget benchmark-widget">
    <PaperCanvas height={390} draw={draw} ariaLabel={`${chapterId}-${moduleId} 实验协议与适用条件对照`} />
    <div className="ctrl" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{metrics.map((item, i) => <button key={item.id} className={i === metricIndex ? 'active' : ''} onClick={() => choose(i)}>{item.id === 'tf' ? 'Transformers 延迟' : item.id === 'vllm' ? 'vLLM 延迟' : item.id === 'omni' ? 'OmniDoc' : 'CHAOS'}</button>)}<button onClick={start}>重播</button></div>
    <div className="ctrl" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button className={lengthBand === 'reported' ? 'active' : ''} onClick={() => setLengthBand('reported')} disabled={!speedMetric}>总体分组</button>
      <button className={lengthBand === 'short' ? 'active' : ''} onClick={() => setLengthBand('short')} disabled={!speedMetric}>0–256 token</button>
      <button className={lengthBand === 'long' ? 'active' : ''} onClick={() => setLengthBand('long')} disabled={!speedMetric}>2048+ token</button>
      <button className={concurrency === 'c1' ? 'active' : ''} onClick={() => setConcurrency('c1')} disabled={!speedMetric}>并发 1</button>
      <button className={concurrency === 'c32' ? 'active' : ''} onClick={() => setConcurrency('c32')} disabled={!speedMetric}>并发 32</button>
    </div>
    <Feedback tone={invalidClaim ? 'red' : 'green'}>{conclusion}</Feedback>
  </div>;
};

export default BenchmarkRace;
