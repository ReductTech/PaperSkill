import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawLabel, withAlpha, roundRect, pointerToCanvas, type Ctx } from './scene';

const W = 1080;
const H = 280;

type Task = 1 | 2 | 3;

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'book' | 'clue' | 'hop';
  prunedAt?: Task;
  onlyAt?: Task;
}

const NODES: Node[] = [
  { id: 'b1', label: '青花瓶·旧案', x: 50, y: 48, w: 150, h: 40, kind: 'book' },
  { id: 'b2', label: '粉彩瓶', x: 50, y: 120, w: 150, h: 40, kind: 'book' },
  { id: 'b3', label: '青花盘', x: 50, y: 192, w: 150, h: 40, kind: 'book' },
  { id: 'r2', label: '白底', x: 420, y: 52, w: 120, h: 32, kind: 'clue', prunedAt: 2 },
  { id: 'r1', label: '窑口', x: 420, y: 130, w: 120, h: 32, kind: 'clue' },
  { id: 'r3', label: '瓷 → 御窑', x: 700, y: 130, w: 150, h: 32, kind: 'hop', onlyAt: 3 },
];

const EDGES: [string, string, Task][] = [
  ['b1', 'r2', 1],
  ['b2', 'r2', 1],
  ['b1', 'r1', 1],
  ['b3', 'r1', 1],
  ['b3', 'r3', 3],
];

const TASK_DETAIL: Record<Task, string> = {
  1: '第一次归案：只有三件证物的通用线索，还没有任何剪枝。',
  2: '第二次归案：先加新实体，再剪掉旧案占过的实体。',
  3: '第三次归案：直接线索被占完了，只能顺着“瓷→御窑”再走一跳。',
};

const nodeById = (id: string) => NODES.filter((n) => n.id === id)[0];

const visibleAt = (n: Node, t: Task) => {
  if (n.onlyAt && n.onlyAt !== t) return false;
  return true;
};

const prunedAt = (n: Node, t: Task) => n.prunedAt !== undefined && t >= n.prunedAt;

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<{ task: Task; node: string }>({ task: 1, node: 'b1' });
  const [task, setTask] = useState<Task>(1);
  const [node, setNode] = useState('b1');
  viewRef.current = { task, node };
  const [feedback, setFeedback] = useState({ text: '这件证物的专属线是三条，旧案没占。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: Ctx;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      const { task: t, node: sel } = viewRef.current;
      clearScene(ctx, W, H);

      // box frame
      ctx.save();
      ctx.strokeStyle = withAlpha(C.envDark, 0.5);
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 5]);
      roundRect(ctx, 34, 30, 1010, 216, 8);
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, 40, 24, '档案盒', C.muted, 11);

      // edges
      for (const [a, b, at] of EDGES) {
        if (at > t) continue;
        const na = nodeById(a);
        const nb = nodeById(b);
        if (!visibleAt(na, t) || !visibleAt(nb, t)) continue;
        const pruned = prunedAt(nb, t) || prunedAt(na, t);
        const active = sel === a || sel === b;
        ctx.save();
        ctx.strokeStyle = pruned ? withAlpha(C.muted, 0.35) : active ? C.blue : withAlpha(C.route, 0.6);
        ctx.lineWidth = active ? 2.2 : 1.2;
        if (nb.kind === 'hop') ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(na.x + na.w, na.y + na.h / 2);
        ctx.lineTo(nb.x, nb.y + nb.h / 2);
        ctx.stroke();
        ctx.restore();
      }

      // nodes
      for (const n of NODES) {
        if (!visibleAt(n, t)) continue;
        const pruned = prunedAt(n, t);
        const active = sel === n.id;
        ctx.save();
        ctx.globalAlpha = pruned ? 0.42 : 1;
        ctx.fillStyle = C.card;
        roundRect(ctx, n.x, n.y, n.w, n.h, 5);
        ctx.fill();
        const stroke = n.kind === 'hop' ? C.purple : pruned ? C.muted : active ? C.blue : C.border;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = active ? 2.4 : 1.3;
        if (pruned || n.kind === 'hop') ctx.setLineDash(pruned ? [4, 4] : [3, 3]);
        roundRect(ctx, n.x, n.y, n.w, n.h, 5);
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, n.x + n.w / 2, n.y + n.h / 2, n.label, pruned ? C.muted : C.ink, 13, 'center');
        if (pruned) {
          ctx.save();
          ctx.strokeStyle = withAlpha(C.red, 0.7);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(n.x + 8, n.y + n.h - 8);
          ctx.lineTo(n.x + n.w - 8, n.y + 8);
          ctx.stroke();
          ctx.restore();
        }
      }
    };

    let raf = 0;
    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const clickCanvas = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = pointerToCanvas(e, canvas, W, H);
    const t = viewRef.current.task;
    for (const n of NODES) {
      if (!visibleAt(n, t)) continue;
      if (p.x >= n.x && p.x <= n.x + n.w && p.y >= n.y && p.y <= n.y + n.h) {
        setNode(n.id);
        if (n.kind === 'book') setFeedback({ text: '这件证物的专属线是三条，旧案没占。', cls: 'good' });
        else if (prunedAt(n, t)) setFeedback({ text: `“${n.label}”上一次任务用过了，留着会让两件证物互相认错。`, cls: 'bad' });
        else if (n.kind === 'hop') setFeedback({ text: '“瓷→御窑”不是直接线索，是顺着走一跳才够到的。', cls: '' });
        else setFeedback({ text: `“${n.label}”这条线索在本任务里还没有被旧案占用。`, cls: '' });
      }
    }
  };

  const switchTask = (t: Task) => {
    setTask(t);
    setFeedback({ text: TASK_DETAIL[t], cls: '' });
  };

  const visibleNodes = NODES.filter((n) => visibleAt(n, task)).length;
  const visibleEdges = EDGES.filter(([, b, at]) => at <= task && visibleAt(nodeById(b), task)).length;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={clickCanvas}
        style={{ cursor: 'pointer' }}
      />
      <div className="chip-row">
        {([1, 2, 3] as Task[]).map((t) => (
          <button
            key={t}
            className={`chip${task === t ? ' selected' : ''}`}
            aria-pressed={task === t}
            onClick={() => switchTask(t)}
          >
            第 {t} 次归案
          </button>
        ))}
      </div>
      <div className="note">
        当前档案盒：{visibleNodes} 个节点 / {visibleEdges} 条边
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod1;
