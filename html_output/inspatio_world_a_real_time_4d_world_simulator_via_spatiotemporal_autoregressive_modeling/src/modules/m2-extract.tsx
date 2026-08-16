import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C } from './scene-kit';

const W = 560;
const H = 300;

interface Stage {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  w: number;
  kind: 'data' | 'op' | 'out';
  flow: string;
  detail: string;
}

// Extraction pipeline, per paper §3.2.2 / §3.4:
// reference video -> VAE latents z_ref -> (a) reference anchor into the ST-Cache,
// (b) feed-forward reconstruction -> depth D_ref + intrinsics K for warping.
const STAGES: Stage[] = [
  {
    id: 'video',
    label: '参考视频',
    sub: '单目 RGB 帧',
    x: 16,
    y: 44,
    w: 108,
    kind: 'data',
    flow: '输入：一段普通的单目视频',
    detail:
      '整个世界的唯一外部素材。不需要多视角同步拍摄，也不需要逐场景重建——一段手机拍的视频就能起步。训练时的数据来自 RealEstate10K、Unreal Engine 渲染序列与 ReCamMaster 数据集。',
  },
  {
    id: 'vae',
    label: 'VAE 编码器',
    sub: '像素 → 潜变量',
    x: 152,
    y: 44,
    w: 108,
    kind: 'op',
    flow: '像素帧 → 压缩潜变量（扩散主干在潜空间里工作）',
    detail:
      '把像素帧压成低维潜变量，后面的扩散主干全部在潜空间里计算。为了压低延迟，推理时用轻量的 Tiny-VAE 替换原本的 Wan-VAE：牺牲一点画质，换来实时所需的速度。',
  },
  {
    id: 'zref',
    label: '潜变量 z_ref',
    sub: '参考表示序列',
    x: 288,
    y: 44,
    w: 116,
    kind: 'data',
    flow: '参考潜变量序列，可按块检索出 z_refⁱ',
    detail:
      '压缩后的参考表示。生成第 i 块时并不是把整段视频塞进模型，而是实时检索出对应的一小段 z_refⁱ。它同时是两条下游支线的原料：一条做记忆，一条做几何。',
  },
  {
    id: 'anchor',
    label: '参考锚点',
    sub: '存入 ST-Cache',
    x: 428,
    y: 44,
    w: 116,
    kind: 'out',
    flow: 'z_refⁱ 与滑窗历史一起进入恒定大小的 KV 缓存',
    detail:
      '出口一：z_refⁱ 作为全局空间锚点进入时空缓存，和短期滑窗历史一起约束当前块，并把位置索引重锚到固定原点。对应第 4、5 章，解决难题一「记住已生成的空间」。',
  },
  {
    id: 'ffr',
    label: 'FFR 前馈重建',
    sub: '一次前馈出几何',
    x: 288,
    y: 176,
    w: 116,
    kind: 'op',
    flow: '潜变量 → 几何先验（无需逐场景优化）',
    detail:
      '前馈重建模型从参考潜变量里直接估出几何先验。和 NeRF、3DGS 那类需要多视角输入并逐场景优化的经典方法不同，这里一次前馈就出结果，才跟得上实时的节奏。',
  },
  {
    id: 'geo',
    label: '深度 ＋ 内参',
    sub: 'D_ref, K',
    x: 428,
    y: 176,
    w: 116,
    kind: 'out',
    flow: '深度图与相机内参，供重投影 Proj 使用',
    detail:
      '出口二：有了深度和内参，就能把参考视图按任意 6 自由度位姿重投影到新视角，并给出一张标明哪里真正可见的有效掩码。对应第 6 章，解决难题二「操作对不上相机」。',
  },
];

const WIRES: Array<[string, string]> = [
  ['video', 'vae'],
  ['vae', 'zref'],
  ['zref', 'anchor'],
  ['zref', 'ffr'],
  ['ffr', 'geo'],
];

// Nodes that lie on the path feeding the selected node (so the active route reads
// left-to-right from the raw video).
const UPSTREAM: Record<string, string[]> = {
  video: [],
  vae: ['video'],
  zref: ['video', 'vae'],
  anchor: ['video', 'vae', 'zref'],
  ffr: ['video', 'vae', 'zref'],
  geo: ['video', 'vae', 'zref', 'ffr'],
};

export const M2Extract: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'zref' });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState('zref');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const nodeById = (id: string) => STAGES.find((s) => s.id === id) as Stage;
    const NODE_H = 56;

    const render = (s: { sel: string }, time: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.text;
      ctx.font = '13px "Microsoft YaHei", "PingFang SC", sans-serif';
      ctx.fillText('参考视频信息提取流水线', 16, 26);

      const active = new Set([s.sel, ...UPSTREAM[s.sel]]);

      // wires
      for (const [a, b] of WIRES) {
        const na = nodeById(a);
        const nb = nodeById(b);
        const on = active.has(a) && active.has(b);
        ctx.strokeStyle = on ? C.blue : C.border;
        ctx.lineWidth = on ? 2.8 : 1.4;
        ctx.beginPath();
        if (na.y === nb.y) {
          const y = na.y + NODE_H / 2;
          ctx.moveTo(na.x + na.w, y);
          ctx.lineTo(nb.x, y);
          // arrow head
          ctx.lineTo(nb.x - 6, y - 4);
          ctx.moveTo(nb.x, y);
          ctx.lineTo(nb.x - 6, y + 4);
        } else {
          // vertical drop then across (zref -> ffr sits directly below)
          const x = na.x + na.w / 2;
          ctx.moveTo(x, na.y + NODE_H);
          ctx.lineTo(x, nb.y);
          ctx.lineTo(x - 4, nb.y - 6);
          ctx.moveTo(x, nb.y);
          ctx.lineTo(x + 4, nb.y - 6);
        }
        ctx.stroke();
      }

      // nodes
      for (const n of STAGES) {
        const isSel = n.id === s.sel;
        const on = active.has(n.id);
        const pulse = isSel ? 1 + Math.sin(time * 0.005) * 0.04 : 1;
        ctx.save();
        ctx.translate(n.x + n.w / 2, n.y + NODE_H / 2);
        ctx.scale(pulse, pulse);
        ctx.translate(-(n.x + n.w / 2), -(n.y + NODE_H / 2));
        const accent = n.kind === 'op' ? C.orange : n.kind === 'out' ? C.green : C.blue;
        ctx.fillStyle = isSel ? accent : '#ffffff';
        ctx.strokeStyle = isSel ? accent : on ? C.blue : C.border;
        ctx.lineWidth = isSel ? 3 : on ? 2 : 1.4;
        const r = 10;
        ctx.beginPath();
        ctx.moveTo(n.x + r, n.y);
        ctx.arcTo(n.x + n.w, n.y, n.x + n.w, n.y + NODE_H, r);
        ctx.arcTo(n.x + n.w, n.y + NODE_H, n.x, n.y + NODE_H, r);
        ctx.arcTo(n.x, n.y + NODE_H, n.x, n.y, r);
        ctx.arcTo(n.x, n.y, n.x + n.w, n.y, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Centre each line and shrink it if it would spill past the rounded box.
        const fitText = (text: string, size: number, baseline: number) => {
          let s = size;
          ctx.font = `${s}px "Microsoft YaHei", "PingFang SC", sans-serif`;
          while (ctx.measureText(text).width > n.w - 12 && s > 8) {
            s -= 0.5;
            ctx.font = `${s}px "Microsoft YaHei", "PingFang SC", sans-serif`;
          }
          const tw = ctx.measureText(text).width;
          ctx.fillText(text, n.x + (n.w - tw) / 2, baseline);
        };
        ctx.fillStyle = isSel ? '#ffffff' : C.text;
        fitText(n.label, 12.5, n.y + 24);
        ctx.fillStyle = isSel ? 'rgba(255,255,255,0.85)' : C.muted;
        fitText(n.sub, 11, n.y + 42);
        ctx.restore();
      }

      // legend + flow line
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('蓝＝数据　橙＝算子　绿＝出口', 16, 274);
      const cur = nodeById(s.sel);
      ctx.fillStyle = C.text;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillText(cur.flow, 16, 252);

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
      for (const n of STAGES) {
        if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + NODE_H) {
          stateRef.current.sel = n.id;
          setSel(n.id);
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
  }, []);

  const pick = (id: string) => {
    stateRef.current.sel = id;
    setSel(id);
  };

  const cur = STAGES.find((s) => s.id === sel) as Stage;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {STAGES.map((s) => (
          <button
            key={s.id}
            className={`chip ${sel === s.id ? 'selected' : ''}`}
            onClick={() => pick(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="detail-panel">{cur.detail}</div>
      <div className="feedback">
        当前环节：<b>{cur.label}</b>。蓝色高亮的是从原始视频流到这一步的完整路径。
      </div>
    </div>
  );
};

export default M2Extract;
