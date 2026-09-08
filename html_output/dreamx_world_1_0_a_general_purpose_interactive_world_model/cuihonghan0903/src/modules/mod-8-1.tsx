import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import * as K from './roadKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 260;

type NodeId = 'retrieval' | 'zm' | 'zh' | 'zc' | 'dit';

const NODES: Record<NodeId, { x: number; y: number; w: number; h: number; label: string; labelHtml: string; color: string; detail: string }> = {
  retrieval: { x: 20, y: 96, w: 96, h: 56, label: '几何检索', labelHtml: '几何检索', color: '#7c3aed', detail: '按相机位姿与视角重叠，从更早的历史里挑出与目标视角最相关的帧——而不是按时间远近（§3.2.2）。' },
  zm: { x: 150, y: 30, w: 118, h: 48, label: '记忆帧 z_M', labelHtml: '记忆帧 z<sub>M</sub>', color: '#7c3aed', detail: '检索到的早期干净潜变量帧，打包时用其原始时间位置的 RoPE 重新编码，避免被当成相邻帧。' },
  zh: { x: 150, y: 100, w: 118, h: 48, label: '历史帧 z_H', labelHtml: '历史帧 z<sub>H</sub>', color: '#27446e', detail: '目标窗口之前刚去噪的最近帧，提供局部上下文。' },
  zc: { x: 150, y: 170, w: 118, h: 48, label: '目标帧 z_C^τ', labelHtml: '目标帧 z<sub>C</sub><sup>τ</sup>', color: '#d97706', detail: '加噪的目标潜变量帧（噪声水平 τ），rectified flow 损失只计算在它上面。' },
  dit: { x: 320, y: 88, w: 128, h: 72, label: 'DiT 自注意力', labelHtml: 'DiT 自注意力', color: '#27446e', detail: 'z<sub>pack</sub> = [ z<sub>M</sub> | z<sub>H</sub> | z<sub>C</sub><sup>τ</sup> ] 沿 token 维拼接进同一条自注意力流（式 1）；残差回收只扰动条件 token，让模型对不完美的记忆保持鲁棒（§3.2.3）。' },
};

const ORDER: NodeId[] = ['retrieval', 'zm', 'zh', 'zc', 'dit'];

export const Mod81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<NodeId>('retrieval');
  const selRef = useRef<NodeId>('retrieval');
  selRef.current = selected;

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
    const t0 = performance.now();

    const edge = (x1: number, y1: number, x2: number, y2: number, color: string, active: boolean, dash = false) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = active ? 3 : 1.5;
      if (dash) ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const frame = (now: number) => {
      const sel = selRef.current;
      const pulse = 0.5 + 0.5 * Math.sin((now - t0) / 260);
      K.clearScene(ctx, W, H);
      const R = NODES.retrieval, ZM = NODES.zm, ZH = NODES.zh, ZC = NODES.zc, D = NODES.dit;
      // edges
      edge(R.x + R.w, R.y + 16, ZM.x, ZM.y + ZM.h / 2, K.C.aux, sel === 'retrieval' || sel === 'zm');
      edge(ZM.x + ZM.w, ZM.y + ZM.h / 2, D.x, D.y + 16, K.C.aux, sel === 'zm' || sel === 'dit');
      edge(ZH.x + ZH.w, ZH.y + ZH.h / 2, D.x, D.y + D.h / 2, K.C.guide, sel === 'zh' || sel === 'dit');
      edge(ZC.x + ZC.w, ZC.y + ZC.h / 2, D.x, D.y + D.h - 16, K.C.emph, sel === 'zc' || sel === 'dit');
      // residual recycling dashed note
      edge(ZC.x + 30, ZC.y + ZC.h, ZC.x + 30, 244, K.C.aux, sel === 'dit', true);
      K.drawLabel(ctx, '残差回收：只扰动条件 token', ZC.x - 60, 254, K.C.aux, 10);
      // output
      K.drawLabel(ctx, '→ 去噪后的目标帧', D.x + D.w + 6, D.y + D.h / 2 + 4, K.C.good, 11);
      // nodes
      (Object.keys(NODES) as NodeId[]).forEach((id) => {
        const n = NODES[id];
        const isSel = id === sel;
        ctx.fillStyle = isSel ? `rgba(39,68,110,${0.12 + 0.1 * pulse})` : '#fff';
        ctx.strokeStyle = isSel ? K.C.guide : n.color;
        ctx.lineWidth = isSel ? 3 : 1.8;
        ctx.beginPath();
        ctx.roundRect(n.x, n.y, n.w, n.h, 7);
        ctx.fill();
        ctx.stroke();
        K.drawRichLabel(ctx, n.label, n.x + 8, n.y + n.h / 2 + 4, K.C.ink, 11);
      });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const disconnect = observeCanvas(canvas, start, stop);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      for (const id of ORDER) {
        const n = NODES[id];
        if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) {
          setSelected(id);
          return;
        }
      }
    };
    canvas.addEventListener('click', onClick);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        {ORDER.map((id) => (
          <button
            key={id}
            className={`chip ${selected === id ? 'active' : ''}`}
            onClick={() => setSelected(id)}
            dangerouslySetInnerHTML={{ __html: NODES[id].labelHtml }}
          />
        ))}
      </div>
      <div className="feedback" dangerouslySetInnerHTML={{ __html: NODES[selected].detail }} />
    </div>
  );
};

export default Mod81;
