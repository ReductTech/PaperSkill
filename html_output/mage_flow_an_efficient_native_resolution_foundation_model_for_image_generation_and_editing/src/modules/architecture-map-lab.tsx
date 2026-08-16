import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type NodeId = 'text' | 'vae-enc' | 'packing' | 'mmdit' | 'vae-dec';
const W = 960;
const H = 430;
const nodes: Array<{ id: NodeId; short: string; title: string; detail: string }> = [
  { id: 'text', short: 'Qwen3-VL 条件', title: '冻结的上下文条件编码器', detail: '文生图时编码文本提示为 τ；编辑时联合编码源图与编辑指令。文本编码器是独立栈组件，不计入 4B NR-MMDiT 骨干。' },
  { id: 'vae-enc', short: 'Mage-VAE 编码', title: '一步卷积式潜变量编码', detail: 'Mage-VAE 直接产生 16× 空间下采样、128 通道的 Transformer 就绪潜变量；编辑源图和目标图使用同一编码器。' },
  { id: 'packing', short: '原生打包', title: '变长 token 的原生分辨率打包', detail: '原生图像网格和变长文本装入固定 token 预算，累计偏移隔离样本注意力；打包不减少单张图的 token 数。' },
  { id: 'mmdit', short: 'NR-MMDiT', title: '模态专属投影，联合自注意力', detail: '文本与图像保留各自归一化和投影，再在拼接序列上通过联合自注意力交互；NR-MMDiT 生成骨干规模为 4B。' },
  { id: 'vae-dec', short: 'Mage-VAE 解码', title: '一步还原像素', detail: '共享的 Mage-VAE 解码器把目标潜变量一次解码回像素；源/目标角色已在骨干输入和位置编码中处理。' },
];
const colors = { bg: '#f5f0e8', paper: '#faf9f5', grid: '#d8c9b0', brown: '#8a5a33', blue: '#cc785c', green: '#5db872', purple: '#5db8a6', orange: '#e8a55a', text: '#252523', muted: '#6c6a64', axis: '#e6dfd8' };

export const ArchitectureMapLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [node, setNode] = useState<NodeId>('packing');
  const [editing, setEditing] = useState(false);
  const currentIndex = nodes.findIndex((item) => item.id === node);
  const current = nodes[currentIndex];
  const supportsEditing = node === 'text' || node === 'packing' || node === 'mmdit';

  const chooseNode = (id: NodeId) => {
    setNode(id);
    if (!(id === 'text' || id === 'packing' || id === 'mmdit')) setEditing(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = colors.grid; ctx.globalAlpha = 0.25;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    const xs = [70, 244, 418, 592, 766];
    const y = 112;
    ctx.strokeStyle = colors.axis; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(xs[0] + 60, y + 40); ctx.lineTo(xs[4] + 60, y + 40); ctx.stroke();
    ctx.strokeStyle = colors.brown; ctx.beginPath(); ctx.moveTo(xs[0] + 60, y + 40); ctx.lineTo(xs[currentIndex] + 60, y + 40); ctx.stroke();
    nodes.forEach((item, i) => {
      const active = i === currentIndex;
      ctx.fillStyle = colors.paper; ctx.strokeStyle = active ? colors.blue : colors.axis; ctx.lineWidth = active ? 3 : 2;
      ctx.beginPath(); ctx.roundRect(xs[i], y, 120, 80, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = active ? colors.blue : colors.text; ctx.font = `${active ? '700' : '600'} 12px "Segoe UI", sans-serif`; ctx.textAlign = 'center';
      const label = item.short.replace(' ', '\n');
      const lines = label.split('\n'); lines.forEach((line, lineIndex) => ctx.fillText(line, xs[i] + 60, y + 34 + lineIndex * 18));
      ctx.fillStyle = colors.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText(String(i + 1), xs[i] + 60, y + 67);
      if (editing && (item.id === 'text' || item.id === 'packing' || item.id === 'mmdit')) {
        ctx.fillStyle = colors.purple; ctx.beginPath(); ctx.arc(xs[i] + 104, y + 14, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '700 10px "Segoe UI", sans-serif'; ctx.fillText('f', xs[i] + 104, y + 17);
      }
    });
    ctx.strokeStyle = colors.green; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(898, 92); ctx.lineTo(912, 106); ctx.lineTo(934, 76); ctx.stroke();
    ctx.fillStyle = colors.orange; ctx.beginPath(); ctx.moveTo(xs[currentIndex] + 54, 70); ctx.lineTo(xs[currentIndex] + 66, 70); ctx.lineTo(xs[currentIndex] + 60, 100); ctx.closePath(); ctx.fill();

    ctx.fillStyle = colors.paper; ctx.strokeStyle = colors.axis; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(42, 244, 876, 148, 12); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'left'; ctx.fillStyle = colors.blue; ctx.font = '700 16px "Segoe UI", sans-serif'; ctx.fillText(current.title, 66, 276);
    ctx.fillStyle = colors.text; ctx.font = '13px "Segoe UI", sans-serif';
    const chunks = current.detail.match(/.{1,46}(?:[，；。]|$)/g) ?? [current.detail];
    chunks.slice(0, 3).forEach((line, i) => ctx.fillText(line, 66, 310 + i * 24));
    ctx.fillStyle = editing ? colors.purple : colors.muted;
    ctx.fillText(editing ? '编辑条件：τ + z_src + 带噪 z_tgt，位置 (h,w,f)，损失仅在目标 token' : '文生图条件：τ + 带噪目标，位置 (h,w)', 66, 374);
    canvas.classList.add('is-ready');
  }, [node, editing, currentIndex, current]);

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * W / rect.width;
    const index = Math.max(0, Math.min(4, Math.round((x - 130) / 174)));
    if (x >= 50 && x <= 930 && (event.clientY - rect.top) * H / rect.height < 220) chooseNode(nodes[index].id);
  };

  const feedback = editing
    ? '额外帧坐标 f 标注源/目标角色，损失只监督目标 token。'
    : node === 'packing'
      ? '变长文本与原生图像网格共享 token 预算，但每个样本仍由累计偏移隔离。'
      : node === 'mmdit'
        ? '多模态不是共用同一投影：模态专属层之后才进入联合自注意力。'
        : node === 'vae-dec'
          ? '编辑能力不来自专用解码器；解码器结构共享。'
          : current.detail;

  return (
    <div>
      <div className="chip-row" role="group" aria-label="架构节点">
        {nodes.map((item) => <button key={item.id} className={`chip ${node === item.id ? 'selected' : ''}`} aria-pressed={node === item.id} onClick={() => chooseNode(item.id)}>{item.short}</button>)}
      </div>
      <div className="chip-row">
        <button className={`chip ${editing ? 'selected' : ''}`} aria-pressed={editing} disabled={!supportsEditing} onClick={() => setEditing((value) => !value)}>查看编辑条件</button>
        {!supportsEditing ? <span className="step-desc">{node === 'vae-dec' ? '解码器结构共享，不承担源/目标角色标记.' : '该节点使用共享编码结构，编辑角色在条件与骨干路径中标记。'}</span> : null}
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onCanvasClick}
        aria-label="可点击的五节点架构图；下方按钮提供等价操作" />
      <div className="metrics">
        <div className="metric"><div className="l">当前节点</div><div className="v" style={{ fontSize: 17 }}>{current.short}</div></div>
        <div className="metric"><div className="l">关键规格</div><div className="v" style={{ fontSize: 17 }}>{node === 'vae-enc' ? '16× / 128 通道' : node === 'packing' ? '变长 token' : node === 'mmdit' ? '4B 骨干' : node === 'vae-dec' ? '一步像素解码' : '冻结条件编码'}</div></div>
        <div className="metric"><div className="l">条件视图</div><div className="v" style={{ fontSize: 17 }}>{editing ? '(h,w,f)' : '(h,w)'}</div></div>
      </div>
      <div className="feedback good" aria-live="polite">{feedback}</div>
    </div>
  );
};

export default ArchitectureMapLab;
