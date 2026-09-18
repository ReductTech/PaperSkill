import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, text, roundedRect } from './river';
import type { WidgetProps } from './registry';

// 第 8 章（模块一）：动作条件 U-Net 架构（P5 可点击热点）。
const W = 1080;
const H = 300;

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  desc: string;
}

const NODES: Node[] = [
  { id: 'in', label: '输入', x: 36, y: 120, w: 128, h: 72, desc: '把高斯噪声与历史帧在通道维拼接，作为生成器的输入。' },
  { id: 'enc', label: '编码器', x: 220, y: 96, w: 150, h: 120, desc: '逐级下采样，提取从局部到全局的视觉特征。' },
  { id: 'bot', label: '瓶颈', x: 430, y: 110, w: 130, h: 92, desc: '最低分辨率的特征层，承载高层语义信息。' },
  { id: 'dec', label: '解码器', x: 620, y: 96, w: 150, h: 120, desc: '逐级上采样并恢复细节，通过跳跃连接融合编码器特征。' },
  { id: 'out', label: '输出', x: 830, y: 120, w: 128, h: 72, desc: '输出未来 T 帧；时空分解卷积独立处理空间与时间。' },
  { id: 'act', label: '动作', x: 620, y: 238, w: 150, h: 46, desc: '用 FiLM（或交叉注意力）按帧注入动作，让每个动作条件对应的一帧。' },
];

export const Ch8Arch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ selected: 'in' });
  const rafRef = useRef<number | null>(null);
  const [selected, setSelected] = useState('in');
  const [info, setInfo] = useState(NODES[0].desc);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { selected: string }) => {
      ctx.fillStyle = COLORS.sky;
      ctx.fillRect(0, 0, W, H);
      // 连线
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 3;
      const centers = NODES.slice(0, 5).map((n) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 }));
      for (let i = 0; i < centers.length - 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(centers[i].x + NODES[i].w / 2, centers[i].y);
        ctx.lineTo(centers[i + 1].x - NODES[i + 1].w / 2, centers[i + 1].y);
        ctx.stroke();
      }
      // 动作 -> 解码器
      ctx.strokeStyle = COLORS.purple;
      ctx.beginPath();
      ctx.moveTo(NODES[5].x + NODES[5].w / 2, NODES[5].y);
      ctx.lineTo(NODES[3].x + NODES[3].w / 2, NODES[3].y + NODES[3].h);
      ctx.stroke();
      // 节点
      for (const n of NODES) {
        const active = n.id === s.selected;
        ctx.fillStyle = active ? COLORS.blue : '#ffffff';
        ctx.strokeStyle = active ? COLORS.blue : COLORS.axis;
        ctx.lineWidth = active ? 4 : 2;
        roundedRect(ctx, n.x, n.y, n.w, n.h, 10);
        ctx.fill();
        ctx.stroke();
        text(ctx, n.label, n.x + n.w / 2, n.y + n.h / 2, active ? '#ffffff' : COLORS.ink, 20, 'center');
      }
    };
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: string) => {
    stateRef.current.selected = id;
    setSelected(id);
    setInfo(NODES.find((n) => n.id === id)?.desc || '');
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) * W) / r.width;
    const y = ((e.clientY - r.top) * H) / r.height;
    const hit = NODES.find((n) => x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h);
    if (hit) pick(hit.id);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} onClick={onCanvasClick} />
      <div className="ctrl">
        {NODES.map((n) => (
          <button key={n.id} className={`chip ${selected === n.id ? 'active' : ''}`} onClick={() => pick(n.id)}>
            {n.label}
          </button>
        ))}
      </div>
      <div className="feedback good">{info}</div>
    </div>
  );
};

export default Ch8Arch;
