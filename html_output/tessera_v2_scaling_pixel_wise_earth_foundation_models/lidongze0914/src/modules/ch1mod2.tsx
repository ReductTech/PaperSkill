import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 1.2「按预算选型」：P6 沿性能–存储前沿拖动（吸附到最近的 d），
// 配合学生尺寸 chip，右侧 4×4 存储架联动。数值全部来自论文测评协议。

const W = 1080;
const H = 280;

interface Pt {
  d: number;
  tib: number;
  score: number;
  ret: number;
}

const POINTS: Pt[] = [
  { d: 16, tib: 22, score: 0.546, ret: 92.1 },
  { d: 32, tib: 44, score: 0.574, ret: 96.8 },
  { d: 64, tib: 89, score: 0.588, ret: 99.2 },
  { d: 128, tib: 178, score: 0.593, ret: 100 },
];

type StudentKey = 'N' | 'S' | 'M' | 'L';

interface Stu {
  params: number;
  gpu: string | null;
  regime: string;
  rec: number[];
}

const STUDENTS: Record<StudentKey, Stu> = {
  N: { params: 1.1, gpu: null, regime: '端侧与设备内', rec: [16, 32] },
  S: { params: 7.1, gpu: '0.3', regime: '存储受限', rec: [16, 32, 64] },
  M: { params: 21.0, gpu: '0.9', regime: '均衡', rec: [32, 64, 128] },
  L: { params: 43.8, gpu: '2', regime: '均衡', rec: [64, 128] },
};

const STUDENT_ORDER: StudentKey[] = ['N', 'S', 'M', 'L'];

function xOf(tib: number): number {
  return map(Math.log10(tib), Math.log10(22), Math.log10(178), 96, 636);
}

function yOf(score: number): number {
  return map(score, 0.54, 0.6, 202, 68);
}

function cxOf(d: number): number {
  return xOf(POINTS.find((p) => p.d === d)!.tib);
}

function buildFeedback(d: number, s: StudentKey): { text: string; cls: string } {
  const p = POINTS.find((q) => q.d === d)!;
  const st = STUDENTS[s];
  const edge16 = d === 16 && (s === 'N' || s === 'S');
  if (d === 16 && !edge16) {
    return { text: 'd=16 在细粒度分类与回归上退化最明显，论文建议这类任务用 d=64', cls: 'bad' };
  }
  if (st.rec.indexOf(d) >= 0) {
    const regimeText = edge16 ? '端侧与边缘' : st.regime;
    const gpu = st.gpu ? `、一次全球年度推理约 ${st.gpu} GPU·年` : '';
    return {
      text: `学生 ${s} 配 ${d} 维命中${regimeText}建议：${st.params}M 编码器、约 ${p.tib} TiB${gpu}`,
      cls: 'good',
    };
  }
  return {
    text: `${d} 维：复合得分 ${p.score}（下游任务性能保留率 ${p.ret}%），全局年度存储约 ${p.tib} TiB；细粒度任务建议 d=64（0.588，99.2%）`,
    cls: '',
  };
}

export const Ch1Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ d: 128, student: 'L' as StudentKey, dragging: false, pulse: 0 });
  const [prefixD, setPrefixD] = useState(128);
  const [student, setStudent] = useState<StudentKey>('L');
  const [feedback, setFeedback] = useState(buildFeedback(128, 'L'));

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
    const startAt = performance.now();

    const star = (x: number, y: number, r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = (Math.PI / 4) * i - Math.PI / 2;
        const rr = i % 2 === 0 ? r : r * 0.42;
        const px = x + Math.cos(ang) * rr;
        const py = y + Math.sin(ang) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    };

    const render = (time: number) => {
      const s = stateRef.current;
      const t = (time - startAt) / 1000;
      s.pulse = (Math.sin(t * 2) + 1) / 2;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, H - 30, W, 30);

      // 技术视图：白底 + 技术边框
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(64, 40, 600, 190);
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.strokeRect(64, 40, 600, 190);

      // 前沿曲线
      ctx.strokeStyle = '#27446e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < POINTS.length; i++) {
        const px = xOf(POINTS[i].tib);
        const py = yOf(POINTS[i].score);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 数据点 + 裸数字
      ctx.font = '15px "Segoe UI", sans-serif';
      for (let i = 0; i < POINTS.length; i++) {
        const p = POINTS[i];
        const px = xOf(p.tib);
        const py = yOf(p.score);
        star(px, py, s.d === p.d ? 11 : 8, s.d === p.d ? '#228d5c' : '#68778f');
        ctx.fillStyle = '#21324a';
        ctx.fillText(String(p.score), px - 16, py - 16);
      }

      // 轴刻度（裸数字）
      ctx.fillStyle = '#68778f';
      for (let i = 0; i < POINTS.length; i++) {
        ctx.fillText(String(POINTS[i].tib), xOf(POINTS[i].tib) - 10, 226);
      }
      ctx.fillText('0.55', 30, yOf(0.55) + 5);
      ctx.fillText('0.60', 30, yOf(0.6) + 5);

      // 瞄准点（橙色，脉冲）
      const ax = cxOf(s.d);
      const ap = POINTS.find((p) => p.d === s.d)!;
      const ay = yOf(ap.score);
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.5 + 0.5 * s.pulse;
      ctx.beginPath();
      ctx.arc(ax, ay, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // 存储架 4×4
      const sx = 720;
      const sy = 52;
      const cw = 72;
      const rh = 46;
      for (let r = 0; r < 4; r++) {
        const key = STUDENT_ORDER[r];
        const st = STUDENTS[key];
        const cellW = map(st.params, 1, 44, 18, 60);
        for (let c = 0; c < 4; c++) {
          const d = POINTS[c].d;
          const x = sx + c * cw + (cw - cellW) / 2;
          const y = sy + r * rh;
          const active = key === s.student && d === s.d;
          const rowSel = key === s.student;
          const colSel = d === s.d;
          ctx.fillStyle = active ? 'rgba(34,141,92,0.85)' : rowSel || colSel ? 'rgba(39,68,110,0.16)' : '#ffffff';
          ctx.strokeStyle = active ? '#228d5c' : '#d7deea';
          ctx.lineWidth = active ? 3 : 2;
          ctx.fillRect(x, y, cellW, 30);
          ctx.strokeRect(x, y, cellW, 30);
        }
      }
      // 画布内两个标签
      ctx.fillStyle = '#21324a';
      ctx.font = '20px "Segoe UI", sans-serif';
      ctx.fillText('性能–存储', 80, 30);
      ctx.fillText('学生规格', 720, 30);

      // 图例（三项）
      const lx = 720;
      const ly = 236;
      const legend = [
        { c: '#27446e', label: '前沿' },
        { c: '#f07e47', label: '当前选点' },
        { c: '#228d5c', label: '性能保留率' },
      ];
      ctx.font = '15px "Segoe UI", sans-serif';
      for (let i = 0; i < legend.length; i++) {
        ctx.fillStyle = legend[i].c;
        ctx.fillRect(lx + i * 112, ly, 14, 14);
        ctx.fillStyle = '#68778f';
        ctx.fillText(legend[i].label, lx + i * 112 + 20, ly + 12);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const applyD = (d: number, s: StudentKey) => {
    stateRef.current.d = d;
    setPrefixD(d);
    setFeedback(buildFeedback(d, s));
  };

  const pickNearest = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return 128;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) * W) / rect.width;
    let best = POINTS[0].d;
    let bestDist = Infinity;
    for (let i = 0; i < POINTS.length; i++) {
      const dist = Math.abs(cxOf(POINTS[i].d) - x);
      if (dist < bestDist) {
        bestDist = dist;
        best = POINTS[i].d;
      }
    }
    return best;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    stateRef.current.dragging = true;
    const d = pickNearest(e.clientX);
    applyD(d, stateRef.current.student);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.dragging) return;
    const d = pickNearest(e.clientX);
    applyD(d, stateRef.current.student);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    stateRef.current.dragging = false;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const idx = POINTS.findIndex((p) => p.d === prefixD);
    if (e.key === 'ArrowRight' && idx < POINTS.length - 1) {
      applyD(POINTS[idx + 1].d, student);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      applyD(POINTS[idx - 1].d, student);
      e.preventDefault();
    }
  };

  const chooseStudent = (k: StudentKey) => {
    stateRef.current.student = k;
    setStudent(k);
    setFeedback(buildFeedback(stateRef.current.d, k));
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
        role="slider"
        aria-label="下游任务性能与存储前沿选择"
        aria-valuenow={prefixD}
      />
      <div className="chip-row">
        {STUDENT_ORDER.map((k) => (
          <button
            key={k}
            className={`chip${k === student ? ' selected' : ''}`}
            onClick={() => chooseStudent(k)}
          >
            {k} · {STUDENTS[k].params}M
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod2;
