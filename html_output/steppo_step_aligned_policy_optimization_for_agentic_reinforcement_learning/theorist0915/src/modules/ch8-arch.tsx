import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLabel } from './roadKit';

const W = 1080, H = 300;
const nodes = [
  { id: 'repr', x: 60, y: 110, label: '步记录', desc: '保存 s、a、r，对齐 MDP 转移' },
  { id: 'gae', x: 280, y: 60, label: '步级GAE', desc: '在步状态估 V，跨步传播优势' },
  { id: 'is', x: 280, y: 170, label: '步级比率', desc: 'token 比率连乘得到步级 w_t' },
  { id: 'actor', x: 520, y: 110, label: 'PPO更新', desc: '裁剪目标作用在步级优势上' },
  { id: 'sys', x: 760, y: 70, label: 'Gateway', desc: '异构智能体接入与标准化' },
  { id: 'pool', x: 760, y: 160, label: 'DataPool', desc: '异步收步、版本与策展元数据' },
  { id: 'agent', x: 980, y: 70, label: 'Agent-R1', desc: '训练抽象：token 一致 + 步级 MDP' },
  { id: 'claw', x: 980, y: 160, label: 'Claw-R1', desc: '数据抽象：网关与数据池' },
];

const flowOrder = ['repr', 'gae', 'is', 'actor', 'sys', 'pool'];

export const Ch8Arch: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sel, setSel] = useState('repr');
  const [fb, setFb] = useState({ text: '点击节点查看角色；或投放一条轨迹看数据如何流过。', cls: '' });
  const selRef = useRef(sel);
  const flowRef = useRef(false);
  const progRef = useRef(0);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => { selRef.current = sel; }, [sel]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const p = progRef.current;
      const selected = selRef.current;
      clearScene(ctx, W, H);
      drawLabel(ctx, 'StepPO 管线 · 算法核 + 系统底座', 40, 32, C.text);
      const edges: [string, string][] = [
        ['repr', 'gae'], ['repr', 'is'], ['gae', 'actor'], ['is', 'actor'],
        ['actor', 'sys'], ['actor', 'pool'], ['sys', 'agent'], ['pool', 'claw'],
      ];
      edges.forEach(([a, b]) => {
        const A = nodes.find((n) => n.id === a)!;
        const B = nodes.find((n) => n.id === b)!;
        const active = selected === a || selected === b;
        ctx.strokeStyle = active ? C.blue : C.axis;
        ctx.lineWidth = active ? 3 : 1;
        ctx.beginPath();
        ctx.moveTo(A.x + 55, A.y + 20);
        ctx.lineTo(B.x, B.y + 20);
        ctx.stroke();
      });
      if (p > 0) {
        const idx = Math.min(flowOrder.length - 1, Math.floor(p * (flowOrder.length - 0.001)));
        const local = (p * (flowOrder.length - 1)) % 1;
        const a = nodes.find((n) => n.id === flowOrder[idx])!;
        const b = nodes.find((n) => n.id === flowOrder[Math.min(flowOrder.length - 1, idx + 1)])!;
        const x = a.x + 55 + (b.x - (a.x + 55)) * local;
        const y = a.y + 20 + (b.y - a.y) * local;
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        drawLabel(ctx, '一条步轨迹', x - 20, y - 12, C.orange);
      }
      nodes.forEach((n) => {
        const on = n.id === selected;
        const passed = p > 0 && flowOrder.includes(n.id) && flowOrder.indexOf(n.id) <= p * (flowOrder.length - 1);
        ctx.fillStyle = on ? C.purple : passed ? '#e8f7ef' : '#fff';
        ctx.strokeStyle = on ? C.orange : C.axis;
        ctx.lineWidth = on ? 3 : 1;
        ctx.fillRect(n.x, n.y, 110, 44);
        ctx.strokeRect(n.x, n.y, 110, 44);
        drawLabel(ctx, n.label, n.x + 12, n.y + 28, on ? '#fff' : C.text);
      });
      const cur = nodes.find((n) => n.id === selected)!;
      drawLabel(ctx, cur.desc, 40, 270, C.muted);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      if (flowRef.current) {
        const p = clamp((now - startRef.current) / 3200, 0, 1);
        progRef.current = p;
        if (p >= 1) {
          flowRef.current = false;
          setFb({ text: '轨迹流过：记录→信用/比率→更新→系统回写。Agent-R1 偏训练，Claw-R1 偏数据。', cls: 'good' });
        }
      }
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const hit = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      const hitNode = nodes.find((n) => x >= n.x && x <= n.x + 110 && y >= n.y && y <= n.y + 44);
      if (hitNode) {
        setSel(hitNode.id);
        setFb({ text: hitNode.desc, cls: 'good' });
      }
    };
    canvas.addEventListener('pointerdown', hit);
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); canvas.removeEventListener('pointerdown', hit); };
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ cursor: 'pointer' }} />
      <div className="ctrl">
        {nodes.slice(0, 6).map((n) => (
          <button key={n.id} type="button" className={sel === n.id ? 'chip on' : 'chip'} onClick={() => {
            setSel(n.id); setFb({ text: n.desc, cls: 'good' });
          }}>{n.label}</button>
        ))}
        <button type="button" onClick={() => {
          progRef.current = 0;
          startRef.current = performance.now();
          flowRef.current = true;
          setFb({ text: '正在投放一条步轨迹…', cls: '' });
        }}>投放一条轨迹</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Ch8Arch;
