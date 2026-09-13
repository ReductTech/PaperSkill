import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { field, trace, label, GUIDE, OK, EMPH, MUTED, LINE, INK } from './clayKit';

// 模块 8.1：可点击的简化结构图（冻结编码器 → 共享权重网络 → 反嵌入矩阵）。
// 画布内只保留两处短文字，节点名称放在下方的键盘可达芯片里。
const W = 1080;
const H = 300;
const NODES = [
  { x: 190, name: '冻结编码器', detail: '只在训练时把词元编码成连续嵌入；推理不引入额外模块。' },
  { x: 540, name: '共享权重网络', detail: '同一套权重同时承担去噪与解码，用 mode 标记切换。' },
  { x: 890, name: '反嵌入矩阵', detail: '只在 t=1 使用，把干净嵌入映射成词元 logits。' },
];

export const Ch8ArchMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uiRef = useRef({ node: 1, mode: 'denoise' as 'denoise' | 'decode' });
  const [node, setNode] = useState(1);
  const [mode, setMode] = useState<'denoise' | 'decode'>('denoise');
  const [fb, setFb] = useState({ text: '点击画布节点或下方按钮，切换模式看激活路径如何变化。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const tick = (now: number) => {
      const ui = uiRef.current;
      field(ctx, W, H);
      NODES.forEach((n, i) => {
        const active = i <= ui.node;
        const selected = i === ui.node;
        const w = 190;
        const h = 62;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = selected ? EMPH : active ? GUIDE : LINE;
        ctx.lineWidth = selected ? 3 : 2;
        ctx.fillRect(n.x - w / 2, 140, w, h);
        ctx.strokeRect(n.x - w / 2, 140, w, h);
        ctx.fillStyle = selected ? EMPH : active ? GUIDE : MUTED;
        ctx.beginPath();
        ctx.arc(n.x, 171, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText(String(i + 1), n.x - 4, 176);
        ctx.restore();
        if (i < NODES.length - 1) {
          trace(ctx, [[n.x + w / 2 + 6, 171], [NODES[i + 1].x - w / 2 - 6, 171]], i < ui.node ? GUIDE : LINE, i >= ui.node);
        }
      });
      const pulse = 0.5 + 0.5 * Math.sin(now / 320);
      ctx.save();
      ctx.strokeStyle = EMPH;
      ctx.globalAlpha = 0.35 + 0.45 * pulse;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(NODES[ui.node].x, 171, 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      label(ctx, ui.mode === 'denoise' ? '去噪模式' : '解码模式', 30, 40, ui.mode === 'denoise' ? GUIDE : OK);
      label(ctx, ui.mode === 'denoise' ? '输出嵌入' : '输出词元', 900, 250, ui.mode === 'denoise' ? GUIDE : OK);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pickNode = (i: number) => {
    uiRef.current.node = i;
    setNode(i);
    setFb({ text: NODES[i].detail, cls: i === 1 ? 'good' : '' });
  };

  const pickMode = (m: 'denoise' | 'decode') => {
    uiRef.current.mode = m;
    setMode(m);
    setFb(
      m === 'denoise'
        ? { text: '去噪模式下网络输出干净嵌入，用均方误差训练。', cls: '' }
        : { text: '解码模式下网络输出词元 logits，用交叉熵训练。', cls: 'good' }
    );
  };

  const onClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    let best = -1;
    let bestDist = 200;
    NODES.forEach((n, i) => {
      const d = Math.abs(n.x - x);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    if (best >= 0) pickNode(best);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onClick} style={{ cursor: 'pointer' }} />
      <div className="chip-row">
        {NODES.map((n, i) => (
          <button key={n.name} className={`chip ${node === i ? 'selected' : ''}`} onClick={() => pickNode(i)}>
            {i + 1} {n.name}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button className={`chip ${mode === 'denoise' ? 'selected' : ''}`} onClick={() => pickMode('denoise')}>
          去噪模式
        </button>
        <button className={`chip ${mode === 'decode' ? 'selected' : ''}`} onClick={() => pickMode('decode')}>
          解码模式
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch8ArchMap;
