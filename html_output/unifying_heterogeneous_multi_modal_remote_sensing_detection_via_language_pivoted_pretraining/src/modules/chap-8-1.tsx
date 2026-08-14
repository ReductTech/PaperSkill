import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chap8Mod1 — Interactive architecture map (P5 hotspots).
// 4 nodes: ViT, Projector, Qwen2 LLM, LVSA. Click each → highlight + info panel.

const W = 560;
const H = 260;

type NodeId = 'vit' | 'projector' | 'llm' | 'lvsa';
const NODES: Record<NodeId, { x: number; y: number; w: number; h: number; label: string; sub: string; info: { title: string; rows: { key: string; value: string }[] } }> = {
  vit: {
    x: 30, y: 50, w: 110, h: 70,
    label: 'ViT-Large', sub: '24 层', info: {
      title: '视觉编码器 E_M',
      rows: [
        { key: '骨干', value: 'ViT-Large (24 层)' },
        { key: '权重', value: 'RGB / SAR / IR 共享' },
        { key: '参与层 S', value: '{3, 9, 18, 24}' },
        { key: '初始化', value: 'InternVL-2.5 1B' },
      ],
    },
  },
  projector: {
    x: 165, y: 50, w: 110, h: 70,
    label: '共享投影头 P', sub: 'Linear', info: {
      title: '共享投影头',
      rows: [
        { key: '类型', value: '共享 Linear 层' },
        { key: '输入', value: 'LVSA 融合后的 F̃' },
        { key: '输出', value: 'LLM 输入嵌入空间的 token' },
        { key: '训练', value: '与 LLM 一起微调' },
      ],
    },
  },
  llm: {
    x: 300, y: 50, w: 110, h: 70,
    label: 'Qwen2 LLM', sub: '1B', info: {
      title: '预训练大语言模型 Φ',
      rows: [
        { key: '模型', value: 'Qwen2 (来自 InternVL-2.5 1B)' },
        { key: '角色', value: '跨模态<b>语义枢轴</b>' },
        { key: '训练', value: '通常冻结' },
        { key: '损失', value: 'L_align 作用在响应 token' },
      ],
    },
  },
  lvsa: {
    x: 435, y: 50, w: 100, h: 70,
    label: 'LVSA', sub: 'τ = 6k', info: {
      title: '层间视觉-语义退火',
      rows: [
        { key: 'α(t)', value: 'min(t/τ, 1)' },
        { key: 'τ', value: '6k 步 (论文默认)' },
        { key: '作用', value: '平滑融合中间层' },
        { key: '输出', value: '多尺度融合特征 F̃' },
      ],
    },
  },
};

const FLOW: Array<[NodeId, NodeId]> = [
  ['vit', 'lvsa'],
  ['lvsa', 'projector'],
  ['projector', 'llm'],
];

export const Chap8Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ active: 'vit' as NodeId, anim: 0 });
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState<NodeId>('vit');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const findHit = (mx: number, my: number): NodeId | null => {
      for (const id of Object.keys(NODES) as NodeId[]) {
        const n = NODES[id];
        if (mx >= n.x && mx <= n.x + n.w && my >= n.y && my <= n.y + n.h) {
          return id;
        }
      }
      return null;
    };

    let pulseT = 0;
    const render = () => {
      const s = stateRef.current;
      s.anim = Math.min(1, s.anim + 0.06);
      pulseT += 0.04;
      const ease = easeOutCubic(s.anim);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 24, W, 24);

      // flow edges
      FLOW.forEach(([a, b]) => {
        const na = NODES[a], nb = NODES[b];
        const isActive = s.active === a || s.active === b;
        ctx.strokeStyle = isActive ? '#27446e' : '#d7deea';
        ctx.lineWidth = isActive ? 2.2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(na.x + na.w, na.y + na.h / 2);
        ctx.lineTo(nb.x, nb.y + nb.h / 2);
        ctx.stroke();
        if (isActive) {
          // arrowhead
          const ax = nb.x;
          const ay = nb.y + nb.h / 2;
          ctx.fillStyle = '#27446e';
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax - 8, ay - 5);
          ctx.lineTo(ax - 8, ay + 5);
          ctx.closePath();
          ctx.fill();
        }
      });

      // nodes
      (Object.keys(NODES) as NodeId[]).forEach((id) => {
        const n = NODES[id];
        const isActive = id === s.active;
        // pulse
        if (isActive) {
          const pulse = (Math.sin(pulseT) + 1) * 0.5;
          ctx.strokeStyle = `rgba(39, 68, 110, ${0.3 + pulse * 0.4})`;
          ctx.lineWidth = 3 + pulse * 2;
          ctx.strokeRect(n.x - 4, n.y - 4, n.w + 8, n.h + 8);
        }
        ctx.fillStyle = isActive ? '#27446e' : '#fff7d6';
        ctx.strokeStyle = isActive ? '#27446e' : '#21324a';
        ctx.lineWidth = 1.4;
        ctx.fillRect(n.x, n.y, n.w, n.h);
        ctx.strokeRect(n.x, n.y, n.w, n.h);
        ctx.fillStyle = isActive ? '#fff' : '#21324a';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.label, n.x + n.w / 2, n.y + n.h / 2 - 6);
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillText(n.sub, n.x + n.w / 2, n.y + n.h / 2 + 10);
      });

      // input label
      ctx.fillStyle = '#68778f';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('← 异构图像 x (RGB / SAR / IR)', 20, 32);
      ctx.textAlign = 'right';
      ctx.fillText('响应 r →', W - 20, 32);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const onClickNative = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (W / rect.width);
      const sy = (e.clientY - rect.top) * (H / rect.height);
      const hit = findHit(sx, sy);
      if (hit) {
        stateRef.current.active = hit;
        stateRef.current.anim = 0;
        setActive(hit);
      }
    };
    canvas.addEventListener('click', onClickNative);

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); canvas.removeEventListener('click', onClickNative); };
  }, []);

  const info = NODES[active].info;

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl" style={{ marginTop: 4, fontSize: 13 }}>
        <label>当前节点</label>
        <div className="chip-row" style={{ margin: 0 }}>
          {(['vit', 'projector', 'llm', 'lvsa'] as NodeId[]).map((id) => (
            <button key={id} className={`chip ${active === id ? 'selected' : ''}`} onClick={() => { stateRef.current.active = id; stateRef.current.anim = 0; setActive(id); }}>
              {NODES[id].label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 10, padding: 12, background: '#fff7d6', border: '1px solid #d7deea', borderRadius: 8 }}>
        <div style={{ fontWeight: 800, color: '#27446e', marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: info.title }} />
        <table style={{ width: '100%', fontSize: 13, color: '#21324a' }}>
          <tbody>
            {info.rows.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: '2px 6px', color: '#68778f', width: 90 }}>{r.key}</td>
                <td style={{ padding: '2px 6px' }} dangerouslySetInnerHTML={{ __html: r.value }} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="feedback">
        <b>关键事实</b>：BabelRS 在微调阶段<b>不再有对齐模块</b>——所有对齐都发生在 CSIA+LVSA 预训练里。
      </div>
    </div>
  );
};

export default Chap8Mod1;
