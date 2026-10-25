import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useTween } from '../lib/hooks';
import { Feedback, Seg } from '../ui/kit';
import { RESULT_TABLES } from '../data/tutorial';
import { METHOD_COLOR } from '../lib/palette';

// 10.1 结果浏览器：只报告论文表格中的数值与差值。
// 论文为单次运行，没有逐样本结果或置信区间，本页不估算误差带、不做显著性判断。

function Bar({ v, max }: { v: number; max: number }) {
  const t = useTween(v, 380);
  return <div className="rb-fill" style={{ transform: `scaleX(${Math.max(0, t / max)})` }} />;
}

export const Ch10Results: React.FC<WidgetProps> = () => {
  const [tid, setTid] = useState('l15-7b');
  const [col, setCol] = useState(8);
  const [mode, setMode] = useState<'pp' | 'rel'>('pp');
  const [showAll, setShowAll] = useState(false);
  const tbl = RESULT_TABLES.find((t) => t.id === tid)!;
  const c = Math.min(col, tbl.cols.length - 1);
  const rows = tbl.rows.filter((r) => showAll || r.group === 'orig' || r.group === 'pnp');
  const vals = rows.map((r) => r.values[c] ?? 0);
  const max = Math.max(...vals) * 1.08 || 1;
  const orig = tbl.rows[0].values[c] ?? 0;
  const ours = tbl.rows.find((r) => r.method === 'DivPrune')!.values[c] ?? 0;
  const pnp = tbl.rows.filter((r) => r.group === 'pnp' && !r.ours);
  const bestBase = pnp.reduce((a, r) => Math.max(a, r.values[c] ?? -Infinity), -Infinity);
  const metric = tbl.metrics[c];
  const colName = tbl.cols[c];
  const isFrac = !['CIDEr', 'P-score', 'GPT 分', 'WUPS'].includes(metric);

  const diff = (a: number, b: number) => (mode === 'pp' ? a - b : ((a - b) / b) * 100);
  const unit = mode === 'pp' ? (isFrac ? ' 个百分点' : '（原单位）') : '%';
  const dOrig = diff(ours, orig);
  const dBase = diff(ours, bestBase);

  // 颜色语义固定：info = 论文事实；warn = 证据边界（差值很小、无法判断方向）
  let tone: 'info' | 'warn' = 'info';
  let fb = `${tbl.label} · ${colName}（${metric}）：DivPrune ${ours}，原模型 ${orig}，最好的即插即用基线 ${bestBase}。相对原模型 ${dOrig >= 0 ? '+' : ''}${dOrig.toFixed(2)}${unit}；相对基线 ${dBase >= 0 ? '+' : ''}${dBase.toFixed(2)}${unit}。`;
  const small = isFrac && Math.abs(ours - orig) < 1;
  if (small) {
    fb += ` 与原模型只差 ${(ours - orig).toFixed(2)} 分：论文为单次运行，没有逐样本结果或置信区间，无法判断这个差值是否超出评测波动，不宜解读为提升或下降。`;
    tone = 'warn';
  } else {
    fb += ' 论文为单次运行，未提供不确定性信息；这里只报告表中差值，不判断显著性。';
  }

  return (
    <div className="w">
      <div className="ctl-stack">
        <Seg label="结果表" options={RESULT_TABLES.map((t) => ({ value: t.id, label: t.label }))} value={tid} onChange={(v) => { setTid(v); setCol(0); }} />
        <Seg small label="数据集" options={tbl.cols.map((x, i) => ({ value: i, label: x }))} value={c} onChange={setCol} />
        <div className="ctl-row">
          <Seg small label="差值口径" options={[{ value: 'pp', label: '差值（原单位 / 百分点）' }, { value: 'rel', label: '相对百分比' }]} value={mode} onChange={setMode} />
          <label className="sw">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            <span className="sw-track" aria-hidden="true" />
            <span>显示需校准 / 微调 / 可变比例的方法</span>
          </label>
        </div>
      </div>
      <div className="rb" role="img" aria-label={`${tbl.label} ${colName}：${rows.map((r) => `${r.method} ${r.values[c]}`).join('，')}`}>
        {rows.map((r) => (
          <div className={`rb-row ${r.ours ? 'is-ours' : ''}`} key={r.method}>
            <span className="rb-k">
              <i className="dot" style={{ background: METHOD_COLOR[r.method] ?? '#888' }} />
              {r.method}
              <small>{r.tflop}</small>
            </span>
            <div className="rb-track" style={{ ['--c' as string]: METHOD_COLOR[r.method] ?? '#888' } as React.CSSProperties}>
              <Bar v={r.values[c] ?? 0} max={max} />
            </div>
            <span className="rb-v">{r.values[c]}</span>
          </div>
        ))}
      </div>
      <Feedback tone={tone}>{fb}</Feedback>
      <p className="w-note">
        表格数值逐格转录自 {tbl.where}。TFLOP 一列中 “Variable” 表示保留数随样本变化。△ = 使用校准集，• = 使用微调；DivPrune* = 对齐 PruMerge 保留比例的 DivPrune。
      </p>
    </div>
  );
};

export default Ch10Results;
