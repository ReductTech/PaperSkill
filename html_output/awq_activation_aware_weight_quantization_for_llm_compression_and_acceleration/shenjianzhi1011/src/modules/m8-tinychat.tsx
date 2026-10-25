import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { clearScene, drawBar, drawSceneLabel, AQ, useAwqCanvas } from './awq-kit';

const W = 1080;
const H = 280;

type Comp = 'dequant' | 'pack' | 'fuse' | 'attn' | 'kv';
const NODES: { id: Comp; label: string; note: string }[] = [
  { id: 'dequant', label: '即时反量化', note: '反量化融进 GEMM，避免写回 DRAM。' },
  { id: 'pack', label: 'SIMD 打包', note: '按 SIMD 位宽打包权重，减少解包指令。' },
  { id: 'fuse', label: '算子融合', note: '层归一化等合并为单内核，减少启动开销。' },
  { id: 'attn', label: '注意力融合', note: 'QKV 合并、位置编码即时计算。' },
  { id: 'kv', label: 'KV 缓存', note: '预分配并在注意力内核内更新。' },
];

export const M8TinyChat: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState<Comp | null>(null);
  const [opt, setOpt] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  const ref = useAwqCanvas((ctx, w, h) => {
    clearScene(ctx, w, h);
    const n = NODES.length;
    const x0 = 90;
    const gap = 190;
    NODES.forEach((nd, i) => {
      const cx = x0 + i * gap;
      const active = sel === nd.id;
      ctx.fillStyle = active ? AQ.orange : AQ.card;
      ctx.strokeStyle = active ? AQ.orange : AQ.blue;
      ctx.lineWidth = active ? 3 : 2;
      ctx.beginPath();
      ctx.arc(cx, 90, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawSceneLabel(ctx, cx - 26, 146, nd.label, active ? AQ.orange : AQ.ink, 12);
      if (i < n - 1) {
        ctx.strokeStyle = opt ? AQ.green : AQ.border;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + 30, 90);
        ctx.lineTo(cx + gap - 30, 90);
        ctx.stroke();
      }
    });
    drawSceneLabel(ctx, 90, 40, 'INT4 权重 → 输出', AQ.ink, 13);
    drawBar(ctx, 90, 210, 900, 24, opt ? 0.35 : 1, opt ? AQ.green : AQ.red);
    drawSceneLabel(ctx, 90, 200, opt ? '开销已下降' : '开销（含中间访存/启动）', opt ? AQ.green : AQ.muted, 13);
  }, W, H);

  const onCanvasClick = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round((cx - 90) / 190);
    if (i >= 0 && i < NODES.length) setSel(NODES[i].id);
  };

  const cur = NODES.find((n) => n.id === sel) || null;
  const text = cur
    ? `${cur.label}：${cur.note}`
    : opt
    ? '开启融合后，理论省下的内存开始变成实测速度。'
    : '点一个组件，看看它省下了什么。';

  return (
    <div>
      <div ref={areaRef} style={{ cursor: 'pointer' }} onClick={(e) => onCanvasClick(e.clientX)}>
        <canvas id="cv-m8-tinychat" ref={ref} width={W} height={H} />
      </div>
      <div className="chip-row">
        {NODES.map((n) => (
          <button key={n.id} className={`chip ${sel === n.id ? 'selected' : ''}`} onClick={() => setSel(n.id)}>
            {n.label}
          </button>
        ))}
        <button className={`chip ${opt ? 'selected' : ''}`} onClick={() => setOpt((v) => !v)}>
          优化开关
        </button>
      </div>
      <div className={`feedback ${opt || sel ? 'good' : ''}`}>{text}</div>
    </div>
  );
};

export default M8TinyChat;
