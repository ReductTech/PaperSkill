import { useEffect, useState } from 'react';
import { C, Scene, line, number, Chips, Button, Feedback } from './gd-kit';

const datasets = [
  { title: 'COCO 同设置', metric: 'COCO zero-shot AP ↑', condition: 'Swin-T · O365 预训练 · Table 2, p.8', names: ['GLIP-T(B)', 'DINO（类别映射）', 'Grounding DINO-T'], values: [44.9, 46.2, 46.7], note: '在同一骨干与预训练数据条件下比较。DINO 采用类别映射评估；结论仅适用于该设置。' },
  { title: 'LVIS 整体', metric: 'LVIS MiniVal zero-shot AP ↑', condition: 'Swin-T · O365 + GoldG + Cap4M · Table 3, p.10', names: ['GLIP-T', 'Grounding DINO-T'], values: [26.0, 27.4], note: '整体 AP 提升 1.4；继续切换到“LVIS 稀有”，检查平均成绩是否掩盖了子集差异。' },
  { title: 'LVIS 稀有', metric: 'LVIS MiniVal zero-shot APr ↑', condition: 'Swin-T · O365 + GoldG + Cap4M · Table 3, p.10', names: ['GLIP-T', 'Grounding DINO-T'], values: [20.8, 18.1], note: '稀有类 AP 上 GLIP-T 更高：20.8 对 18.1。整体指标更好，并不保证每一个类别子集都更好。' },
  { title: 'ODinW 均值', metric: 'ODinW35 zero-shot mean AP ↑', condition: 'Swin-T · O365 + GoldG + Cap4M · Table 4, p.11', names: ['GLIP-T', 'Grounding DINO-T'], values: [19.6, 22.3], note: '这是 35 个域外任务的 AP 均值，不代表任意单个任务的分数；中位数提供另一种整体观察。' },
  { title: 'ODinW 中位数', metric: 'ODinW35 zero-shot median AP ↑', condition: 'Swin-T · O365 + GoldG + Cap4M · Table 4, p.11', names: ['GLIP-T', 'Grounding DINO-T'], values: [5.1, 11.9], note: '同组任务的 AP 中位数从 5.1 到 11.9；较低中位数也提示许多域外任务仍然困难。' },
];

export function Results() {
  const [mode, setMode] = useState(0), [running, setRunning] = useState(false), [progress, setProgress] = useState(0);
  const data = datasets[mode], best = Math.max(...data.values);
  useEffect(() => {
    if (!running) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setProgress(1); setRunning(false); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => { const p = Math.min(1, (now - start) / 1500); setProgress(p); if (p < 1) raf = requestAnimationFrame(tick); else setRunning(false); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
  const select = (index: number) => { setMode(index); setRunning(false); setProgress(0); };
  return <div>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
      <Chips label="选择同协议结果" items={datasets.map(d => d.title)} value={mode} onChange={select} />
      <Button disabled={running} onClick={() => { setProgress(0); setRunning(true); }}>{running ? '比较中…' : progress === 1 ? '重播比较' : '开始比较'}</Button>
    </div>
    <Scene label={`${data.metric}。点击开始比较播放论文数据，动画并非实验运行。`} draw={ctx => {
      const left = 70, width = 900, ease = 1 - Math.pow(1 - progress, 3);
      for (let t = 0; t <= 60; t += 10) { const x = left + t / 60 * width; line(ctx, x, 26, x, 228, C.border, 1); number(ctx, String(t), x - 6, 255, C.muted); }
      data.values.forEach((value, i) => {
        const y = data.values.length === 3 ? 42 + i * 64 : 63 + i * 90;
        const color = value === best ? C.green : C.red;
        number(ctx, String(i + 1), 30, y + 26, C.muted);
        const w = value / 60 * width * ease;
        ctx.fillStyle = color; if (w > 0) { ctx.beginPath(); ctx.roundRect(left, y, w, 34, Math.min(5, w / 2)); ctx.fill(); }
        number(ctx, (value * ease).toFixed(1), left + w + 40, y + 25, color);
      });
      line(ctx, left, 228, left + width, 228, C.muted, 2);
    }} />
    <div style={{ fontSize: 14, margin: '8px 0' }}><strong>{data.metric}</strong><span style={{ color: C.muted }}> · {data.condition}</span></div>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <caption style={{ textAlign: 'left', color: C.muted, fontSize: 13, marginBottom: 6 }}>论文原始结果；画布编号与下表对应。绿色为当前协议最高分，动画仅用于展示。</caption>
      <thead><tr><th style={{ textAlign: 'left', padding: 8 }}>编号 · 模型</th><th style={{ textAlign: 'right', padding: 8 }}>报告值 ↑</th></tr></thead>
      <tbody>{data.names.map((name, i) => <tr key={name} style={{ borderTop: `1px solid ${C.border}`, background: data.values[i] === best ? '#edf7ef' : 'transparent' }}>
        <th scope="row" style={{ textAlign: 'left', padding: 8, fontWeight: 500 }}>{i + 1} · {name}</th><td style={{ textAlign: 'right', padding: 8, fontWeight: 700, color: data.values[i] === best ? C.green : C.text }}>{data.values[i].toFixed(1)}</td>
      </tr>)}</tbody>
    </table>
    <Feedback tone={mode === 2 ? 'bad' : 'info'}>{progress === 0 ? '点击“开始比较”展开条形；精确报告值已列在表中。' : running ? '正在展开已有论文数据，未在网页中执行模型评测。' : '比较结束，条形保持最终值。'} {data.note}</Feedback>
    <p style={{ color: C.muted, fontSize: 13, marginBottom: 0 }}>本文“零样本”指未使用目标数据集的训练划分，不保证相关类别从未出现在其他训练数据中。摘要里的 52.5 AP 来自 Swin-L / O365 + OI + GoldG；63.0 AP 还包含 COCO 微调与放大输入，均不等于本图 Tiny 设置。</p>
  </div>;
}
