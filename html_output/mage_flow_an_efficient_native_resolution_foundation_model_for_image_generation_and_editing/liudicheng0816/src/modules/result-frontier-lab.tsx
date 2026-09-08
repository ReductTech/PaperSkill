import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Metric = 'latency' | 'generation' | 'editing' | 'vae';
type Row = { model: string; value: number; display: string; condition: string };
const W = 900;
const H = 410;
const colors = { bg: '#f5f0e8', paper: '#faf9f5', grid: '#d8c9b0', blue: '#cc785c', green: '#5db872', orange: '#e8a55a', purple: '#5db8a6', text: '#252523', muted: '#6c6a64', axis: '#e6dfd8' };
const configs: Record<Metric, { label: string; direction: 'lower' | 'higher'; protocol: string; rows: Row[] }> = {
  latency: { label: 'A100 端到端延迟 ↓', direction: 'lower', protocol: '单张 NVIDIA A100，1024×1024，端到端秒/图；越低越好，时间依赖硬件与实现。', rows: [
    { model: 'Mage-Flow', value: 4.37, display: '4.37s', condition: '对齐版' }, { model: 'Mage-Flow-Turbo', value: 0.59, display: '0.59s', condition: '四步' },
    { model: 'Mage-Flow-Edit', value: 10.55, display: '10.55s', condition: '对齐版' }, { model: 'Mage-Flow-Edit-Turbo', value: 1.02, display: '1.02s', condition: '四步' },
  ] },
  generation: { label: 'GenEval ↑', direction: 'higher', protocol: '官方 1024×1024 GenEval 协议；越高越好。', rows: [
    { model: 'Mage-Flow', value: 0.90, display: '0.90', condition: '20 步' }, { model: 'Mage-Flow-Turbo', value: 0.88, display: '0.88', condition: '4 步' },
  ] },
  editing: { label: 'GEdit-Bench ↑', direction: 'higher', protocol: 'GPT-4.1 评价，0–10；G_O 由语义一致性与感知质量的几何均值得到后按样本平均。', rows: [
    { model: 'Mage-Flow-Edit EN', value: 8.127, display: '8.127', condition: '30 步' }, { model: 'Mage-Flow-Edit-Turbo EN', value: 8.271, display: '8.271', condition: '4 步' },
    { model: 'Mage-Flow-Edit CN', value: 8.123, display: '8.123', condition: '30 步' }, { model: 'Mage-Flow-Edit-Turbo CN', value: 8.264, display: '8.264', condition: '4 步' },
  ] },
  vae: { label: '分词器计算 ↓', direction: 'lower', protocol: '每像素 kMACs；越低越好。重建质量接近而非完全相同。', rows: [
    { model: 'FLUX.2-VAE 编码', value: 2134, display: '2134', condition: 'kMACs/像素' }, { model: 'Mage-VAE 编码', value: 173, display: '173', condition: '约降 12.3×' },
    { model: 'FLUX.2-VAE 解码', value: 4798, display: '4798', condition: 'kMACs/像素' }, { model: 'Mage-VAE 解码', value: 215, display: '215', condition: '约降 22.3×' },
  ] },
};

export const ResultFrontierLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metric, setMetric] = useState<Metric>('latency');
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const config = configs[metric];

  useEffect(() => {
    if (!started) { setProgress(0); return; }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setProgress(1); return; }
    let raf = 0; const start = performance.now();
    const tick = (now: number) => { const p = Math.min(1, (now - start) / 760); setProgress(p); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [started, metric]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = colors.grid; ctx.globalAlpha = 0.22;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.fillStyle = colors.text; ctx.font = '700 16px "Segoe UI", sans-serif'; ctx.fillText(config.label, 34, 34);
    ctx.fillStyle = colors.muted; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText(config.protocol, 34, 60);
    const max = Math.max(...config.rows.map((row) => row.value)); const min = Math.min(...config.rows.map((row) => row.value));
    config.rows.forEach((row, i) => {
      const y = 98 + i * 62; const normalized = config.direction === 'higher' ? row.value / max : min / row.value;
      const width = 80 + normalized * 520 * progress;
      ctx.fillStyle = colors.axis; ctx.fillRect(210, y, 600, 20);
      const turbo = row.model.includes('Turbo') || row.model.startsWith('Mage-VAE');
      ctx.fillStyle = turbo ? colors.orange : colors.blue; ctx.fillRect(210, y, width, 20);
      ctx.fillStyle = colors.text; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(row.model, 34, y + 10);
      if (progress >= 0.98) { ctx.fillStyle = colors.green; ctx.font = '700 13px "Segoe UI", sans-serif'; ctx.fillText(`${row.display} · ${row.condition}`, 220 + width, y + 10); }
    });
    ctx.strokeStyle = colors.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(814, 84); ctx.lineTo(814, 340); ctx.stroke();
    ctx.fillStyle = colors.green; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText('同一协议完成线', 748, 365);
    ctx.fillStyle = colors.purple; ctx.fillRect(34, 370, 620, 24); ctx.fillStyle = '#fff'; ctx.fillText('限制始终保留：文字布局 / 复杂替换 / 多图编辑 / 多语言长文本', 48, 387);
    canvas.classList.add('is-ready');
  }, [config, progress]);

  const chooseMetric = (value: Metric) => { setMetric(value); setStarted(false); setProgress(0); };
  const feedback: Record<Metric, string> = {
    latency: '在单张 A100、1024×1024 的端到端测试中，四步 Turbo 为文生图 0.59s、编辑 1.02s；对齐版分别为 4.37s 与 10.55s。',
    generation: '在官方 1024×1024 GenEval 协议中，20 步 Mage-Flow 为 0.90，四步 Turbo 为 0.88；低延迟伴随质量取舍。',
    editing: '在 GPT-4.1 的 GEdit 0–10 协议中，四步编辑器为 EN 8.271 / CN 8.264；该结论只属于这一基准协议。',
    vae: '按每像素 kMACs，Mage-VAE 编码/解码为 173/215，FLUX.2-VAE 为 2134/4798；计算约降 12.3×/22.3×。',
  };

  return (
    <div>
      <div className="chip-row" role="group" aria-label="结果指标">
        {([['latency', 'A100 延迟'], ['generation', '文生图质量'], ['editing', '编辑质量'], ['vae', 'VAE 计算']] as Array<[Metric, string]>).map(([id, label]) =>
          <button key={id} className={`chip ${metric === id ? 'selected' : ''}`} aria-pressed={metric === id} onClick={() => chooseMetric(id)}>{label}</button>)}
        <button className="tiny" onClick={() => { setProgress(0); setStarted(true); }}>{started ? '重新开始' : '开始比较'}</button>
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} aria-describedby={`res-${chapterId}-${moduleId}`} />
      <div className={`feedback ${started ? 'good' : ''}`} id={`res-${chapterId}-${moduleId}`} aria-live="polite">
        {started ? `${feedback[metric]} 当前比较只回答一个轴；查看另一个轴前必须重置协议。` : '选择指标并开始；切换指标会重置比赛。'}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="paper"><caption style={{ textAlign: 'left', padding: '10px 0', color: colors.muted }}>{config.protocol}</caption>
          <thead><tr><th>模型 / 项目</th><th>值</th><th>步数或条件</th><th>方向</th></tr></thead>
          <tbody>{config.rows.map((row) => <tr key={row.model}><td>{row.model}</td><td>{row.display}</td><td>{row.condition}</td><td>{config.direction === 'lower' ? '越低越好' : '越高越好'}</td></tr>)}</tbody>
        </table>
      </div>
      <aside style={{ border: `2px solid ${colors.purple}`, borderRadius: 10, padding: 14, background: '#eef6f2' }}>
        <strong>前沿之外，论文仍承认这些缺口</strong>
        <ul style={{ paddingLeft: 24 }}><li>精确文字布局保持与复杂文字替换仍需改进。</li><li>多图编辑训练占比很低，更稳健的多图编辑仍是未来方向。</li><li>多语言长文本，尤其更强的跨语言长文本渲染，仍需扩展。</li></ul>
        <p>因此不能把某一列领先改写成“模型在所有生成与编辑任务上普遍最好”。</p>
      </aside>
    </div>
  );
};

export default ResultFrontierLab;
