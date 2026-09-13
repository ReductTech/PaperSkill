import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, dist, easeSpring } from '../lib/canvasKit';
import type { WidgetProps } from '../modules/registry';

// 模块 8.1：点击因子图节点（或等价的 DOM 按钮），查看相邻边、闭环边与节点详情。

const W = 1080;
const H = 280;
const N = 9;
const NODE_Y = 138;
const INSET = { x: 716, y: 42, w: 344, h: 200 };

const nodeX = (i: number) => 92 + i * 70;

type Judge = { text: string; cls: string };

function judge(sel: number): Judge {
  if (sel === 6) {
    return {
      text: '检索分数超过阈值 ω_r、且有效匹配数超过 ω_l，才在这里加了一条双向闭环边——这是能纠正累积漂移的关键一步。',
      cls: 'good',
    };
  }
  if (sel === 2) {
    return { text: '这条边把它和更早的节点连起来，两个方向都算残差。', cls: 'good' };
  }
  return { text: '这是一个普通关键帧：它只通过相邻边约束前后两帧。', cls: '' };
}

function drawBackdrop(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 0.5;
  for (let x = 20; x < W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 20; y < H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

export const Ch8Graph: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ selectedNode: 6 });
  const animRef = useRef(
    Array.from({ length: N }, (_, i) => ({
      cur: i === 5 ? 1.6 : 1,
      from: i === 5 ? 1.6 : 1,
      target: i === 5 ? 1.6 : 1,
      t: 1,
    }))
  );
  const hoverRef = useRef(-1);
  const ringRef = useRef(1);
  const loopRef = useRef(1);
  const lastRef = useRef(0);
  const [selectedNode, setSelectedNode] = useState(6);
  const [feedback, setFeedback] = useState<Judge>(judge(6));

  const select = (n: number) => {
    stateRef.current.selectedNode = n;
    ringRef.current = 0;
    setSelectedNode(n);
    setFeedback(judge(n));
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

    const setTarget = (i: number, target: number) => {
      const a = animRef.current[i];
      if (a.target === target) return;
      a.from = a.cur;
      a.target = target;
      a.t = 0;
    };

    const render = (s: { selectedNode: number }, dt: number) => {
      const sel = s.selectedNode;
      const isLoop = sel === 6;
      const anchorCount = 40 + sel * 12;
      const edgeCount = 2 + (isLoop ? 1 : 0);
      const reproj = isLoop ? 0.021 : 0.034 + sel * 0.004;

      for (let i = 0; i < N; i += 1) {
        const n = i + 1;
        setTarget(i, n === sel ? 1.6 : i === hoverRef.current ? 1.15 : 1);
        const a = animRef.current[i];
        if (a.t < 1) {
          a.t = Math.min(1, a.t + dt / 0.5);
          a.cur = lerp(a.from, a.target, easeSpring(a.t));
        }
      }
      ringRef.current += (1 - ringRef.current) * 0.12;
      if (ringRef.current > 0.995) ringRef.current = 1;
      const loopTarget = isLoop ? 1 : 0;
      loopRef.current += (loopTarget - loopRef.current) * 0.15;
      if (Math.abs(loopTarget - loopRef.current) < 0.005) loopRef.current = loopTarget;

      drawBackdrop(ctx);

      // 相邻边：实线
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      for (let i = 0; i < N - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(nodeX(i), NODE_Y);
        ctx.lineTo(nodeX(i + 1), NODE_Y);
        ctx.stroke();
      }

      // 闭环边：节点 6 与节点 2 之间
      const x6 = nodeX(5);
      const x2 = nodeX(1);
      const ctlX = (x6 + x2) / 2;
      const ctlY = NODE_Y + 96;
      ctx.save();
      ctx.setLineDash(isLoop ? [7, 5] : [4, 6]);
      ctx.strokeStyle = isLoop ? '#228d5c' : '#76906a';
      ctx.lineWidth = lerp(1.5, 3.2, loopRef.current);
      ctx.beginPath();
      ctx.moveTo(x6, NODE_Y);
      ctx.quadraticCurveTo(ctlX, ctlY, x2, NODE_Y);
      ctx.stroke();
      ctx.restore();

      // 节点
      for (let i = 0; i < N; i++) {
        const n = i + 1;
        const r = 13 * animRef.current[i].cur;
        ctx.fillStyle = '#27446e';
        ctx.beginPath();
        ctx.arc(nodeX(i), NODE_Y, r, 0, Math.PI * 2);
        ctx.fill();
        if (n === sel) {
          ctx.save();
          ctx.globalAlpha = ringRef.current;
          ctx.strokeStyle = '#f07e47';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(nodeX(i), NODE_Y, r + 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f5f8f0';
      for (let i = 0; i < N; i++) {
        const n = i + 1;
        ctx.font = n === sel ? 'bold 15px "Segoe UI", sans-serif' : '13px "Segoe UI", sans-serif';
        ctx.fillText(String(n), nodeX(i), NODE_Y + 1);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // 标签与图例
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText('闭环', ctlX + 10, 204);

      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(92, 254);
      ctx.lineTo(116, 254);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.fillText('相邻边', 122, 259);
      ctx.save();
      ctx.setLineDash([7, 5]);
      ctx.strokeStyle = '#228d5c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(206, 254);
      ctx.lineTo(230, 254);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#68778f';
      ctx.fillText('闭环边', 236, 259);

      // 右侧插片
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(INSET.x, INSET.y, INSET.w, INSET.h);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.strokeRect(INSET.x, INSET.y, INSET.w, INSET.h);

      const tags = ['n', 'a_u', 'E', 'L', 'e'];
      const vals = [
        String(sel),
        String(anchorCount),
        String(edgeCount),
        isLoop ? '是' : '否',
        reproj.toFixed(3),
      ];
      const tagX = INSET.x + 22;
      const valX = INSET.x + INSET.w - 22;
      ctx.font = '15px "Segoe UI", sans-serif';
      for (let i = 0; i < tags.length; i++) {
        const ry = INSET.y + 44 + i * 32;
        ctx.fillStyle = i === 3 && isLoop ? '#228d5c' : '#68778f';
        ctx.fillText(tags[i], tagX, ry);
        ctx.fillStyle = '#21324a';
        ctx.textAlign = 'right';
        ctx.fillText(vals[i], valX, ry);
        ctx.textAlign = 'left';
      }
    };

    const tick = (ts: number) => {
      const dt = lastRef.current ? Math.min(0.06, (ts - lastRef.current) / 1000) : 0;
      lastRef.current = ts;
      render(stateRef.current, dt);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      let best = -1;
      let bd = Infinity;
      for (let i = 0; i < N; i++) {
        const d = dist(x, y, nodeX(i), NODE_Y);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      hoverRef.current = bd <= 34 ? best : -1;
      canvas.style.cursor = hoverRef.current >= 0 ? 'pointer' : 'default';
    };
    const onLeave = () => {
      hoverRef.current = -1;
      canvas.style.cursor = 'default';
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < N; i++) {
      const d = dist(x, y, nodeX(i), NODE_Y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    if (best >= 0 && bd <= 34) select(clamp(best + 1, 1, 9));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: '100%', height: 'auto' }}
        onClick={onCanvasClick}
      />
      <div className="chips">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            className={n === selectedNode ? 'chip is-active' : 'chip'}
            onClick={() => select(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Graph;
