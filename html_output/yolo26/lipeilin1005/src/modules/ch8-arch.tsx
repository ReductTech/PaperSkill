import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch8 Module 8.1 (P5): clickable YOLO26 architecture map — five hotspots
// (backbone / neck / one-to-many head / one-to-one head / task heads) with a
// detail region; selection highlights the part and its downstream path.
const W = 700;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

type PartId = 'backbone' | 'neck' | 'o2m' | 'o2o' | 'tasks';

const PARTS: Record<PartId, { label: string; x: number; y: number; w: number; h: number }> = {
  backbone: { label: '骨干', x: 200, y: 122, w: 96, h: 56 },
  neck: { label: '颈部', x: 352, y: 122, w: 96, h: 56 },
  o2m: { label: '一对多头', x: 516, y: 46, w: 110, h: 44 },
  o2o: { label: '一对一头', x: 516, y: 176, w: 110, h: 44 },
  tasks: { label: '多任务头', x: 560, y: 100, w: 110, h: 44 },
};

const EDGES: [PartId | 'input', PartId][] = [
  ['input', 'backbone'],
  ['backbone', 'neck'],
  ['neck', 'o2m'],
  ['neck', 'o2o'],
  ['neck', 'tasks'],
  ['backbone', 'tasks'],
];

const DOWN: Record<PartId, PartId[]> = {
  backbone: ['neck', 'tasks'],
  neck: ['o2m', 'o2o', 'tasks'],
  o2m: [],
  o2o: [],
  tasks: [],
};

const DETAIL: Record<PartId, { title: string; duty: string; facts: string; why: string; fb: string; cls: string }> = {
  backbone: {
    title: '共享骨干',
    duty: '提取 P3/P4/P5 三级特征，所有任务共用同一副"车架"。',
    facts: 'CSP 结构；Objects365 上 150-epoch 预训练。',
    why: '承力部件：表示质量决定后续一切的上限。',
    fb: '骨干负责提特征：所有任务共享同一副"车架"。',
    cls: '',
  },
  neck: {
    title: '颈部',
    duty: '多尺度特征融合，并新增一层注意力。',
    facts: 'P3/P4/P5 融合 + 一层注意力；延迟基本不变。',
    why: '让大小物体各得其所——相当于高效传动系统。',
    fb: '多尺度融合 + 一层注意力：精度提升几乎零延迟代价。',
    cls: '',
  },
  o2m: {
    title: '一对多头',
    duty: 'topk=10 的密集监督，推理需 NMS。',
    facts: '精度上限更高；保留为可选路径。',
    why: '极限精度场景的后备轮组。',
    fb: '密集监督、需 NMS：精度优先时的选择。',
    cls: '',
  },
  o2o: {
    title: '一对一头',
    duty: 'topk=7→1 唯一匹配，推理免 NMS。',
    facts: '输出固定 ≤300 框，形状 (N,300,6)；默认路径。',
    why: '部署最简单：零后处理、确定性输出。',
    fb: '默认路径：免 NMS、输出固定，只比 NMS 低 0.6–0.8 AP。',
    cls: 'good',
  },
  tasks: {
    title: '多任务头',
    duty: '分割 / 姿态 / OBB / 分类共用底座。',
    facts: '原型掩膜 + RLE 关键点 + 长边角度。',
    why: '换轮组不换车架：增益跨尺度一致。',
    fb: '同一副车架换不同轮组：分割 +2.4~+3.7 mask AP、姿态最高 +7.2、OBB +3.4。',
    cls: 'good',
  },
};

const center = (p: { x: number; y: number; w: number; h: number }) => ({ x: p.x + p.w / 2, y: p.y + p.h / 2 });

export const Ch8Arch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ selected: PartId | null }>({ selected: null });
  const [selected, setSelected] = useState<PartId | null>(null);
  const [fb, setFb] = useState({ text: '点击一个部件开始。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const inputBox = { x: 40, y: 128, w: 72, h: 44 };

    const render = (time: number) => {
      const sel = stateRef.current.selected;
      const activeDown = sel ? new Set([sel, ...DOWN[sel]]) : null;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // edges
      EDGES.forEach(([a, b]) => {
        const pa = a === 'input' ? center(inputBox) : center(PARTS[a]);
        const pb = center(PARTS[b]);
        const hot = activeDown
          ? a === 'input'
            ? activeDown.has(b)
            : activeDown.has(a) && activeDown.has(b)
          : false;
        ctx.strokeStyle = hot ? C.green : '#c3cdcf';
        ctx.lineWidth = hot ? 4 : 2;
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
      });
      // input
      ctx.fillStyle = '#e8edf5';
      ctx.fillRect(inputBox.x, inputBox.y, inputBox.w, inputBox.h);
      ctx.strokeStyle = C.muted; ctx.lineWidth = 2; ctx.strokeRect(inputBox.x, inputBox.y, inputBox.w, inputBox.h);
      ctx.fillStyle = C.text; ctx.font = '13px sans-serif';
      ctx.fillText('输入', inputBox.x + 20, inputBox.y + 27);
      // parts
      (Object.keys(PARTS) as PartId[]).forEach((id) => {
        const p = PARTS[id];
        const isSel = sel === id;
        const isDown = activeDown ? activeDown.has(id) && !isSel : false;
        ctx.fillStyle = isSel ? C.blue : isDown ? '#e3f2ea' : '#fff';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = isSel ? C.blue : isDown ? C.green : C.muted;
        ctx.lineWidth = isSel ? 4 : isDown ? 3 : 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = isSel ? '#fff' : C.text; ctx.font = '14px sans-serif';
        ctx.fillText(p.label, p.x + p.w / 2 - ctx.measureText(p.label).width / 2, p.y + p.h / 2 + 5);
        // pulsing hint ring when nothing selected
        if (!sel) {
          const pulse = 4 + Math.sin(time / 300 + p.x) * 2;
          ctx.strokeStyle = `rgba(39,68,110,${0.35 + 0.2 * Math.sin(time / 300 + p.x)})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(p.x - pulse, p.y - pulse, p.w + pulse * 2, p.h + pulse * 2);
        }
      });
    };

    const tick = (time: number) => {
      render(time);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (id: PartId | null) => {
    stateRef.current.selected = id;
    setSelected(id);
    if (id) setFb({ text: DETAIL[id].fb, cls: DETAIL[id].cls });
    else setFb({ text: '点击一个部件开始。', cls: '' });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    for (const id of Object.keys(PARTS) as PartId[]) {
      const p = PARTS[id];
      if (x >= p.x - 6 && x <= p.x + p.w + 6 && y >= p.y - 6 && y <= p.y + p.h + 6) {
        pick(id);
        return;
      }
    }
  };

  const d = selected ? DETAIL[selected] : null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <canvas
          id={`cv-${chapterId}-${moduleId}`}
          ref={canvasRef}
          width={W}
          height={H}
          onClick={onCanvasClick}
          style={{ cursor: 'pointer', maxWidth: '100%' }}
        />
        <div style={{ flex: '1 1 280px', minWidth: 260, background: '#fff', border: '1px solid #d7deea', borderRadius: 8, padding: '14px 16px' }}>
          {d ? (
            <>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>{d.title}</div>
              <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>职责：{d.duty}</div>
              <div style={{ fontSize: 13, color: '#68778f', marginBottom: 8 }}>关键事实：{d.facts}</div>
              <div style={{ fontSize: 13, color: '#68778f' }}>为什么存在：{d.why}</div>
            </>
          ) : (
            <div style={{ fontSize: 14, color: '#68778f' }}>点击一个部件开始</div>
          )}
        </div>
      </div>
      <div className="ctrl">
        <div className="chip-row">
          {(Object.keys(PARTS) as PartId[]).map((id) => (
            <button key={id} className={`chip ${selected === id ? 'selected' : ''}`} onClick={() => pick(id)}>{PARTS[id].label}</button>
          ))}
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch8Arch;
