import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type PanelId = 'evidence' | 'boundary' | 'future';

const PANELS: Array<{
  id: PanelId;
  label: string;
  title: string;
  body: string;
  proof: string;
  note: string;
}> = [
  {
    id: 'evidence',
    label: '论文结论',
    title: '短训练片段可以外推到超长序列',
    body: '论文在 48 帧片段上训练，报告了超过 10K 帧序列上的稳定推理。固定大小的递归状态让每一帧复用同一条更新规则。',
    proof: '证据：48 帧训练 · 10K+ 帧评测 · 近似恒定持久状态',
    note: '这是论文报告的实验范围，不是对任意场景和任意长度的绝对保证。',
  },
  {
    id: 'boundary',
    label: '局限边界',
    title: '固定状态换来可扩展，也会压缩细节',
    body: '重复访问、视觉歧义和动态前景仍可能把错误几何写入状态。可选 Loop Closure 能改善部分重访一致性，但不等于核心前向模型永不漂移。',
    proof: '边界：容量瓶颈 · 重复纹理 · 动态物体 · 可选回环后处理',
    note: '因此页面把基础模型与可选 LC 的结果分开报告。',
  },
  {
    id: 'future',
    label: '未来方向',
    title: '让状态在需要时访问少量外部证据',
    body: '一个自然的延伸是把固定状态与稀疏关键帧检索结合：普通帧保持常数状态，重访或高不确定性时再读取少量历史证据。',
    proof: '推断：稀疏重访检索 · 动静态分解 · 不确定性感知写入',
    note: '这些是基于论文失败边界提出的研究方向，不是本文已经实现的模块。',
  },
];

export const Chap10BoundaryCheck: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState(0);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const panel = PANELS[selected];

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.08 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !visible || reducedMotion) return;
    const timer = window.setInterval(() => setSelected((value) => (value + 1) % PANELS.length), 3200);
    return () => window.clearInterval(timer);
  }, [auto, visible, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 720, 128);
    canvas.classList.add('is-ready');
    ctx.clearRect(0, 0, 720, 128);
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, 720, 128);
    const colors = ['#1455d9', '#c66a16', '#16875b'];
    const labels = ['论文结论', '边界', '未来'];
    labels.forEach((label, index) => {
      const x = 36 + index * 228;
      const active = index === selected;
      ctx.fillStyle = active ? `${colors[index]}18` : '#ffffff';
      ctx.strokeStyle = active ? colors[index] : '#cbd2db';
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.fillRect(x, 34, 168, 54);
      ctx.strokeRect(x, 34, 168, 54);
      ctx.fillStyle = active ? colors[index] : '#5e6978';
      ctx.font = '700 15px "Segoe UI", sans-serif';
      ctx.fillText(label, x + 14, 66);
      if (index < labels.length - 1) {
        ctx.strokeStyle = '#9ca9ba';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 174, 61);
        ctx.lineTo(x + 218, 61);
        ctx.stroke();
        ctx.fillStyle = '#9ca9ba';
        ctx.beginPath();
        ctx.moveTo(x + 218, 61);
        ctx.lineTo(x + 211, 56);
        ctx.lineTo(x + 211, 66);
        ctx.closePath();
        ctx.fill();
      }
    });
    ctx.fillStyle = '#758195';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('从证据到边界，再到可检验的下一步', 36, 112);
  }, [selected]);

  const choose = (index: number) => {
    setSelected(index);
    setAuto(false);
  };

  return (
    <div ref={rootRef} className="hs-boundary-lab">
      <div className="hs-boundary-tabs" role="tablist" aria-label="论文结论与边界">
        {PANELS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected === index}
            className={selected === index ? 'is-active' : ''}
            onClick={() => choose(index)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={`hs-boundary-panel is-${panel.id}`} role="tabpanel" aria-live="polite">
        <div className="hs-boundary-kicker">{panel.label}</div>
        <h3>{panel.title}</h3>
        <p>{panel.body}</p>
        <div className="hs-boundary-proof">{panel.proof}</div>
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={720}
        height={128}
        role="img"
        aria-label={`论文结论、局限边界与未来方向：${panel.label}`}
      />

      <div className="hs-boundary-controls">
        <button type="button" className="tiny ghost" aria-pressed={auto} onClick={() => setAuto((value) => !value)}>
          {auto ? '暂停轮播' : '自动演示'}
        </button>
        <span>{panel.note}</span>
      </div>

      <style>{`
        .hs-boundary-lab{display:grid;gap:14px}.hs-boundary-tabs{display:flex;flex-wrap:wrap;gap:8px}.hs-boundary-tabs button{padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink-2);font-size:14px;font-weight:700}.hs-boundary-tabs button:hover,.hs-boundary-tabs button:focus-visible{border-color:var(--blue);color:var(--blue)}.hs-boundary-tabs button.is-active{border-color:var(--blue);background:var(--blue-soft);color:var(--blue)}.hs-boundary-panel{padding:18px 20px;border:1px solid var(--line);border-radius:10px;background:var(--paper-2)}.hs-boundary-panel.is-boundary{background:#fff8f2;border-color:#edc9aa}.hs-boundary-panel.is-future{background:#f1f8f4;border-color:#b9d9c8}.hs-boundary-kicker{margin-bottom:5px;color:var(--slate);font-size:12px;font-weight:800;letter-spacing:.04em}.hs-boundary-panel h3{margin:0 0 8px;color:var(--ink);font-size:21px;line-height:1.35}.hs-boundary-panel p{margin:0;color:var(--ink-2);font-size:15px;line-height:1.7}.hs-boundary-proof{margin-top:13px;padding-top:11px;border-top:1px solid var(--line);color:var(--blue);font-size:13px;font-weight:700}.hs-boundary-lab canvas{width:100%!important;height:auto!important;aspect-ratio:720/128;margin:0}.hs-boundary-controls{display:flex;align-items:center;gap:12px;color:var(--slate);font-size:13px}.hs-boundary-controls span{line-height:1.5}@media(max-width:720px){.hs-boundary-controls{align-items:flex-start;flex-direction:column;gap:8px}}
      `}</style>
    </div>
  );
};

export default Chap10BoundaryCheck;
