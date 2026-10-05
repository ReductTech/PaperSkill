import { useEffect, useRef, useState } from 'react';
import { C, Scene, Chips, Feedback, Readout, Source, line, roundRect, text } from './lada-kit';

type Shot = '16' | 'full';
type Order = 'I' | 'II';
type Scores = [number | null, number | null, number | null];
const names = ['ZSCL', 'MoE', 'Primal-RAIL', 'Dual-RAIL', 'LADA'];
const metrics = ['Transfer', 'Average', 'Last'];
const results: Record<Shot, Record<Order, Scores[]>> = {
  '16': {
    I: [[59.0, 60.0, 63.4], [56.0, 63.0, 70.5], [null, 71.1, 81.4], [null, 71.3, 82.3], [61.5, 72.7, 83.1]],
    II: [[56.9, 63.6, 69.4], [50.2, 61.8, 71.7], [null, 67.3, 81.8], [null, 67.5, 82.5], [56.7, 68.9, 83.3]],
  },
  full: {
    I: [[59.0, 64.5, 72.1], [56.4, 67.2, 77.3], [null, 72.8, 84.0], [null, null, null], [61.9, 75.2, 86.9]],
    II: [[54.2, 65.1, 70.1], [52.7, 65.1, 73.5], [null, 68.4, 84.1], [null, null, null], [55.4, 69.2, 86.9]],
  },
};

export function Lada10() {
  const [shot, setShot] = useState<Shot>('16');
  const [order, setOrder] = useState<Order>('I');
  const [metric, setMetric] = useState('2');
  const [progress, setProgress] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const rows = results[shot][order], mi = Number(metric), values = rows.map(r => r[mi]);
  const ranked = values.map((v, i) => ({ v, i })).filter((r): r is { v: number; i: number } => r.v !== null).sort((a, b) => b.v - a.v);
  const winner = ranked[0], runner = ranked[1];
  const setting = `${shot === '16' ? '16-shot' : 'Full-shot'} · Order ${order} · ${metrics[mi]}`;
  const table = order === 'I' ? (shot === '16' ? 1 : 2) : (shot === '16' ? 5 : 6);
  const page = order === 'I' ? (shot === '16' ? 5 : 6) : 13;
  const change = (action: () => void) => { setPlaying(false); setProgress(1); action(); };
  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setProgress(1); setPlaying(false); return; }
    let frame = 0, elapsed = 0, previous = performance.now(), visible = true;
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; });
    if (rootRef.current) observer.observe(rootRef.current);
    const tick = (now: number) => {
      if (visible && !document.hidden) elapsed += now - previous;
      previous = now;
      const fraction = Math.min(1, elapsed / 1400);
      setProgress(1 - Math.pow(1 - fraction, 3));
      if (fraction < 1) frame = requestAnimationFrame(tick);
      else { setProgress(1); setPlaying(false); }
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [playing, run]);
  return <div className="lada-race" ref={rootRef} onKeyDown={e => e.stopPropagation()}>
    <style>{`.lada-race .lada-race-start{margin:10px 0 12px;border:1px solid #228d5c;border-radius:9px;padding:10px 18px;background:#228d5c;color:#fff;font:inherit;cursor:pointer}.lada-race .lada-race-chart{position:relative;margin:8px 0}.lada-race .lada-race-row-label{position:absolute;left:3%;width:28%;font-size:clamp(10px,2.4vw,13px);line-height:1.25;transform:translateY(-50%);pointer-events:none;color:#586354}.lada-race .lada-race-row-label strong{display:block;font-variant-numeric:tabular-nums;color:#27446e}.lada-race .lada-race-row-label[data-winner=true] strong{color:#195f3e}.lada-race .lada-race-status{font-size:13px;line-height:1.7;color:#586354;margin:4px 0 12px}.lada-race .lada-race-table{max-width:100%;overflow-x:auto;margin:12px 0}.lada-race table{border-collapse:collapse;font-size:13px;min-width:400px;width:100%;font-variant-numeric:tabular-nums}.lada-race th,.lada-race td{padding:8px 10px;border-bottom:1px solid #d7dfd0;text-align:right;white-space:nowrap}.lada-race th:first-child{text-align:left}.lada-race td[data-selected=true]{background:#edf2e8}.lada-race td[data-best=true]{font-weight:700;color:#195f3e;box-shadow:inset 0 -2px #228d5c}.lada-race details{margin-top:16px}.lada-race summary{cursor:pointer;color:#27446e}.lada-race p{line-height:1.8}`}</style>
    <Chips label="训练样本" value={shot} onChange={v => change(() => setShot(v as Shot))} options={[{ value: '16', label: '16-shot' }, { value: 'full', label: 'Full-shot' }]} />
    <Chips label="任务顺序" value={order} onChange={v => change(() => setOrder(v as Order))} options={[{ value: 'I', label: 'Order I' }, { value: 'II', label: 'Order II' }]} />
    <Chips label="评价指标" value={metric} onChange={v => change(() => setMetric(v))} options={metrics.map((label, i) => ({ value: String(i), label }))} />
    <button className="lada-race-start" onClick={() => { setProgress(0); setPlaying(true); setRun(v => v + 1); }}>{playing ? '重新开始比较' : '开始比较'}</button>
    <p className="lada-race-status">{setting} · 准确率 % · {playing ? '比较动画进行中' : '显示实测终值'}</p>
    <div className="lada-race-chart">
      <Scene label={`${setting} 比较，最高为 ${names[winner.i]} ${winner.v.toFixed(1)}%，所有柱使用0到100的完整刻度`} draw={(ctx, w, h) => {
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
        const x = w * .34, width = w * .60;
        [0, 25, 50, 75, 100].forEach(v => line(ctx, x + width * v / 100, h * .13, x + width * v / 100, h * .90, '#dce4d4', 1));
        values.forEach((v, i) => {
          const y = h * (.22 + i * .145) - 9;
          if (v === null) return;
          roundRect(ctx, x, y, width, 18, 3, '#e3e9db');
          roundRect(ctx, x, y, width * v / 100 * progress, 18, 3, i === 4 ? C.green : i === winner.i ? C.blue : '#8195b0');
          if (v === winner.v) { ctx.strokeStyle = i === 4 ? C.green : C.blue; ctx.lineWidth = 2; ctx.strokeRect(x - 3, y - 4, width * v / 100 * progress + 6, 26); }
        });
        text(ctx, '0%', x, h * .08, 12, C.muted, 'left');
        text(ctx, '100%', x + width, h * .08, 12, C.muted, 'right');
      }} />
      {names.map((name, i) => <div key={name} className="lada-race-row-label" data-winner={values[i] === winner.v} style={{ top: `${( .22 + i * .145) * 100}%` }}>{name}<strong>{values[i] === null ? '—' : `${values[i]!.toFixed(1)}%`}{values[i] === winner.v ? ' 最高' : ''}</strong></div>)}
    </div>
    <Readout items={[{ label: '当前最高', value: `${names[winner.i]} ${winner.v.toFixed(1)}%` }, { label: '与次高的差值', value: `${(winner.v - runner.v).toFixed(1)} 个百分点` }, { label: 'LADA', value: `${values[4]!.toFixed(1)}%` }]} />
    <Feedback tone={winner.i === 4 ? 'good' : 'neutral'}>{setting}：{names[winner.i]} {winner.v.toFixed(1)}%，{names[runner.i]} {runner.v.toFixed(1)}%，前者高 {(winner.v - runner.v).toFixed(1)} 个百分点。</Feedback>
    <div className="lada-race-table" tabIndex={0} role="region" aria-label={`${setting}精确结果表，可横向滚动`}><table><caption>Table {table} · {shot === '16' ? '16-shot' : 'Full-shot'} · Order {order} · 准确率 %</caption><thead><tr><th scope="col">方法</th>{metrics.map(m => <th key={m} scope="col">{m}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={names[i]}><th scope="row">{names[i]}</th>{r.map((v, k) => <td key={k} data-selected={k === mi} data-best={v !== null && v === Math.max(...rows.map(s => s[k] ?? -Infinity))}>{v === null ? '—' : v.toFixed(1)}</td>)}</tr>)}</tbody></table></div>
    <details><summary>查看任务顺序、实验条件与缺测项</summary><p>CLIP ViT-B/16，10 个任务、共 1100 类。16-shot 每类使用 16 个训练样本；Full-shot 使用各任务全部训练样本。Primal-RAIL 与 Dual-RAIL 的 Transfer 列未报告，Dual-RAIL 的 Full-shot 结果未报告，表中记作“—”。</p><p>Order I：Aircraft → Caltech101 → DTD → EuroSAT → Flowers → Food → MNIST → Pets → Cars → SUN397。</p><p>Order II：Cars → Aircraft → Pets → Food → SUN397 → MNIST → Flowers → DTD → Caltech101 → EuroSAT。</p><p>Order I 的 16-shot Last：LADA 83.1%，Dual-RAIL 82.3%。Order I 的 Full-shot Last：LADA 86.9%，Primal-RAIL 84.0%。Order II 的 16-shot Transfer：ZSCL 56.9%，LADA 56.7%。</p></details>
    <Source page={page} label={`Table ${table} · ${shot === '16' ? '16-shot' : 'Full-shot'} · Order ${order}`} />
  </div>;
}
