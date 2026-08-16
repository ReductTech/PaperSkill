import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, sceneLabel } from './scene-kit';

const W = 560;
const H = 280;

type Phase = 'infer' | 'train';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  trainOnly?: boolean;
  detail: string;
}

const NODES: Node[] = [
  {
    id: 'input',
    label: '参考视频+指令',
    x: 20,
    y: 44,
    w: 118,
    detail: '参考视频与实时交互指令是仅有的外部输入；不同于只吃文本或单图的世界模型，本文支持视频输入并将其变成可漫游场景。',
  },
  {
    id: 'depth',
    label: '深度估计 FFR',
    x: 20,
    y: 150,
    w: 118,
    detail: '前馈重建（FFR）从参考潜变量估计深度图 D_ref 与相机内参 K（§2、§5），为几何约束提供底座。',
  },
  {
    id: 'cache',
    label: 'ST-Cache 时空缓存',
    x: 176,
    y: 44,
    w: 140,
    detail: '滑窗历史 + 参考锚点装进恒定大小的 KV 缓存；位置索引重锚到固定原点，长序列不失稳（§3、§6）。',
  },
  {
    id: 'geo',
    label: '几何约束 warp+mask',
    x: 176,
    y: 150,
    w: 140,
    detail: '指令→6 自由度位姿→重投影特征与有效掩码，经通道拼接注入当前块；历史块的几何通道被零填充，防止过期指令污染（§5、§3.2.3）。',
  },
  {
    id: 'dit',
    label: 'DiT 主干 (Wan2.1)',
    x: 354,
    y: 96,
    w: 128,
    detail: '扩散 Transformer 主干基于开源 Wan2.1；1.3B 版本配合蒸馏与工程优化实现实时推理（§9）。',
  },
  {
    id: 'out',
    label: '输出视频流',
    x: 354,
    y: 24,
    w: 128,
    detail: '块级累积的潜变量经解码成连续视频流，支持实时 4D 漫游体验。',
  },
  {
    id: 'jdmd',
    label: 'JDMD 双评分器',
    x: 354,
    y: 208,
    w: 128,
    trainOnly: true,
    detail: '训练期挂载：动作评分器与画质评分器给出 fake score，配合双冻结教师完成蒸馏（§7）；推理期完全不在场，零开销。',
  },
];

// Wires as [fromId, toId] pairs; drawn orthogonally through midpoints.
const WIRES: Array<[string, string]> = [
  ['input', 'cache'],
  ['input', 'depth'],
  ['depth', 'geo'],
  ['cache', 'dit'],
  ['geo', 'dit'],
  ['dit', 'out'],
];

// §8 M8.1 — P5 hotspots + phase chips: full STAR pipeline map (paper Fig.2).
export const M8Arch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ node: 'cache', phase: 'infer' as Phase });
  const rafRef = useRef<number | null>(null);
  const [node, setNode] = useState('cache');
  const [phase, setPhase] = useState<Phase>('infer');
  const [feedback, setFeedback] = useState({
    text: '当前查看：ST-Cache 时空缓存。数据沿蓝色高亮路径流向输出。',
    cls: '',
  });

  const activeIds = (sel: string): Set<string> => {
    // path from inputs through the selected node to the output
    const on = new Set<string>([sel]);
    if (sel === 'input') ['cache', 'depth', 'geo', 'dit', 'out'].forEach((i) => on.add(i));
    if (sel === 'depth') ['input', 'geo', 'dit', 'out'].forEach((i) => on.add(i));
    if (sel === 'cache') ['input', 'dit', 'out'].forEach((i) => on.add(i));
    if (sel === 'geo') ['input', 'depth', 'dit', 'out'].forEach((i) => on.add(i));
    if (sel === 'dit') ['input', 'depth', 'cache', 'geo', 'out'].forEach((i) => on.add(i));
    if (sel === 'out') ['input', 'depth', 'cache', 'geo', 'dit'].forEach((i) => on.add(i));
    if (sel === 'jdmd') ['dit'].forEach((i) => on.add(i));
    return on;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const center = (n: Node) => ({ cx: n.x + n.w / 2, cy: n.y + 22 });

    const render = (s: { node: string; phase: Phase }, time: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      const on = activeIds(s.node);
      const visible = NODES.filter((n) => !n.trainOnly || s.phase === 'train');
      // wires
      const drawWire = (a: Node, b: Node, active: boolean, dashed: boolean, color: string) => {
        const pa = center(a);
        const pb = center(b);
        ctx.strokeStyle = active ? color : C.border;
        ctx.lineWidth = active ? 2.6 : 1.4;
        if (dashed) ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(pa.cx + a.w / 2 - a.w / 2 + (pb.cx > pa.cx ? a.w / 2 : -a.w / 2), pa.cy);
        const midX = (pa.cx + pb.cx) / 2;
        ctx.moveTo(pa.cx, pa.cy);
        ctx.lineTo(midX, pa.cy);
        ctx.lineTo(midX, pb.cy);
        ctx.lineTo(pb.cx, pb.cy);
        ctx.stroke();
        ctx.setLineDash([]);
      };
      for (const [fa, fb] of WIRES) {
        const a = NODES.find((n) => n.id === fa)!;
        const b = NODES.find((n) => n.id === fb)!;
        const act = on.has(fa) && on.has(fb) && s.node !== 'jdmd';
        drawWire(a, b, act, false, C.blue);
      }
      if (s.phase === 'train') {
        const dit = NODES.find((n) => n.id === 'dit')!;
        const jd = NODES.find((n) => n.id === 'jdmd')!;
        drawWire(dit, jd, s.node === 'jdmd', true, C.purple);
      }
      // nodes
      for (const n of visible) {
        const sel = n.id === s.node;
        const act = on.has(n.id);
        const pulse = sel ? 1 + Math.sin(time * 0.005) * 0.05 : 1;
        ctx.save();
        ctx.translate(n.x + n.w / 2, n.y + 22);
        ctx.scale(pulse, pulse);
        ctx.translate(-(n.x + n.w / 2), -(n.y + 22));
        ctx.fillStyle = sel ? C.blue : n.trainOnly ? 'rgba(124,58,237,0.08)' : '#ffffff';
        ctx.strokeStyle = sel ? C.blue : act ? C.blue : n.trainOnly ? C.purple : C.border;
        ctx.lineWidth = sel ? 3 : act ? 2 : 1.4;
        ctx.beginPath();
        const r = 10;
        ctx.moveTo(n.x + r, n.y);
        ctx.arcTo(n.x + n.w, n.y, n.x + n.w, n.y + 44, r);
        ctx.arcTo(n.x + n.w, n.y + 44, n.x, n.y + 44, r);
        ctx.arcTo(n.x, n.y + 44, n.x, n.y, r);
        ctx.arcTo(n.x, n.y, n.x + n.w, n.y, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = sel ? '#ffffff' : C.text;
        // Shrink the label rather than letting it spill past the node box.
        let fs = 12;
        ctx.font = `${fs}px "Microsoft YaHei", "PingFang SC", sans-serif`;
        while (ctx.measureText(n.label).width > n.w - 12 && fs > 8) {
          fs -= 0.5;
          ctx.font = `${fs}px "Microsoft YaHei", "PingFang SC", sans-serif`;
        }
        const tw = ctx.measureText(n.label).width;
        ctx.fillText(n.label, n.x + (n.w - tw) / 2, n.y + 27);
        ctx.restore();
      }
      sceneLabel(
        ctx,
        s.phase === 'infer' ? '推理阶段：评分器不在场' : '训练阶段：JDMD 评分器挂载（紫色虚线）',
        20,
        270,
        true,
        11
      );
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
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

    const onClick = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      const y = ((e.clientY - r.top) / r.height) * H;
      for (const n of NODES) {
        if (n.trainOnly && stateRef.current.phase !== 'train') continue;
        if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + 44) {
          selectNode(n.id);
          return;
        }
      }
    };
    canvas.addEventListener('click', onClick);
    canvas.style.cursor = 'pointer';
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('click', onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectNode = (id: string) => {
    stateRef.current.node = id;
    setNode(id);
    const n = NODES.find((nn) => nn.id === id)!;
    let extra = '';
    if (id === 'geo' && stateRef.current.phase === 'train') {
      extra = ' 注意：历史块的几何通道被零填充，防止过期指令污染当前块。';
    }
    setFeedback({ text: `当前查看：${n.label}。数据沿蓝色高亮路径流向输出。${extra}`, cls: '' });
  };

  const pickPhase = (p: Phase) => {
    stateRef.current.phase = p;
    setPhase(p);
    if (p === 'infer' && stateRef.current.node === 'jdmd') {
      selectNode('dit');
    }
    setFeedback({
      text:
        p === 'train'
          ? '训练阶段：JDMD 的动作/画质评分器（紫色）挂载到主干上。'
          : '推理阶段：评分器不在场，主干轻装上阵。',
      cls: '',
    });
  };

  const detail = NODES.find((n) => n.id === node)!.detail;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${phase === 'infer' ? 'selected' : ''}`} onClick={() => pickPhase('infer')}>
          推理
        </button>
        <button className={`chip ${phase === 'train' ? 'selected' : ''}`} onClick={() => pickPhase('train')}>
          训练
        </button>
      </div>
      <div className="chip-row">
        {NODES.map((n) => {
          const disabled = n.trainOnly && phase !== 'train';
          return (
            <button
              key={n.id}
              className={`chip ${node === n.id ? 'selected' : ''}`}
              onClick={() => selectNode(n.id)}
              disabled={disabled}
              title={disabled ? '该部件只存在于训练阶段' : undefined}
            >
              {n.label}
            </button>
          );
        })}
      </div>
      <div className="detail-panel">
        {phase !== 'train' && node === 'jdmd' ? '该部件只存在于训练阶段。' : detail}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M8Arch;
