import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, gameField, drawScoreCell } from '../canvas-scene';

const W = 1080;
const H = 280;

// 8.1 三者互不可见。四框（名称由下方按钮与表格给出，画布内不画文字，避免连线穿过文字）：
//   上排：画面(左) 题库(右)      下排：讲解者(左) 蒙眼学生(右)
// 五条关系：
//   画面 → 讲解者      蓝实线（看得见）
//   题库 → 蒙眼学生    蓝实线（看得见，学生从题库取题）
//   讲解者 → 蒙眼学生  蓝实线（讲解稿这条通道）
//   题库 ⇢ 讲解者      红虚线（讲解者看不到题库）
//   画面 ⇢ 蒙眼学生    红虚线（学生看不到画面）
//   蒙眼学生 → 讲解者  绿线（分数回传，只有讲解者会更新）
const IMG = { x: 120, y: 40, w: 190, h: 52 };
const BANK = { x: 400, y: 40, w: 190, h: 52 };
const TEACH = { x: 120, y: 176, w: 190, h: 52 };
const STUD = { x: 400, y: 176, w: 190, h: 52 };

const ROWS = [
  { who: '讲解者', sees: '画面', blind: '题库', updates: '会更新（只有它被训练）' },
  { who: '蒙眼学生', sees: '题库', blind: '画面', updates: '训练期间固定不变' },
  { who: '题库', sees: '—', blind: '画面内容', updates: '训练期间固定不变' },
];

export const Mod81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ node: 'student' as string });
  const [node, setNode] = useState('student');
  const [fb, setFb] = useState({
    text: '默认选中「蒙眼学生」：它到「画面」的关系是红色虚线——学生根本看不到画面，这正是整套方法的关键。',
    cls: 'good',
  });

  const INFO: Record<string, { text: string; cls: string }> = {
    image: { text: '画面（左上）：只有讲解者能看见。学生看不到它，所以学生答对只可能来自讲解稿。', cls: '' },
    bank: { text: '题库（右上）：预先筛好、训练期间固定。讲解者拿不到它，也就无法针对具体题目去背答案。', cls: '' },
    teacher: { text: '讲解者（左下）：唯一被训练的对象。它看得见画面、看不到题库，靠学生的答对比例调整自己。', cls: '' },
    student: { text: '蒙眼学生（右下）：只看得到讲解稿和题目，看不到画面；参数在训练期间完全不变。', cls: 'good' },
  };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const arrow = (
      fx: number,
      fy: number,
      tx: number,
      ty: number,
      color: string,
      width: number,
      dashed: boolean
    ) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dashed ? [7, 5] : []);
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      const horizontal = Math.abs(ty - fy) < 1;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      if (horizontal) {
        const d = tx > fx ? 1 : -1;
        ctx.lineTo(tx - 10 * d, ty - 6);
        ctx.lineTo(tx - 10 * d, ty + 6);
      } else {
        const d = ty > fy ? 1 : -1;
        ctx.lineTo(tx - 6, ty - 10 * d);
        ctx.lineTo(tx + 6, ty - 10 * d);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const render = (s: { node: string }) => {
      gameField(ctx, W, H);
      const sel = (k: string) => s.node === k;

      // 蓝实线：看得见的三条（高亮色 #27446e，非高亮 #68778f）
      const hotIT = sel('image') || sel('teacher');
      arrow(IMG.x + IMG.w / 2, IMG.y + IMG.h, TEACH.x + TEACH.w / 2, TEACH.y,
        hotIT ? C.blue : C.muted, hotIT ? 3 : 2, false);

      const hotBS = sel('bank') || sel('student');
      arrow(BANK.x + BANK.w / 2, BANK.y + BANK.h, STUD.x + STUD.w / 2, STUD.y,
        hotBS ? C.blue : C.muted, hotBS ? 3 : 2, false);

      const hotTS = sel('teacher') || sel('student');
      arrow(TEACH.x + TEACH.w, TEACH.y + TEACH.h / 2, STUD.x, STUD.y + STUD.h / 2,
        hotTS ? C.blue : C.muted, hotTS ? 3 : 2, false);

      // 红虚线：看不到的两条（斜穿中间空隙，不经过任何方框内部）
      const hotBT = sel('bank') || sel('teacher');
      arrow(BANK.x + 34, BANK.y + BANK.h, TEACH.x + TEACH.w - 34, TEACH.y,
        hotBT ? C.red : C.axis, hotBT ? 3 : 2, true);

      const hotIS = sel('image') || sel('student');
      arrow(IMG.x + IMG.w - 34, IMG.y + IMG.h, STUD.x + 34, STUD.y,
        hotIS ? C.red : C.axis, hotIS ? 3 : 2, true);

      // 绿线：分数回传，走两排之间的空隙（y=136），从下方绕回讲解者
      const hotBack = sel('student') || sel('teacher');
      ctx.save();
      ctx.strokeStyle = hotBack ? C.green : C.axis;
      ctx.lineWidth = hotBack ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(STUD.x + STUD.w / 2, STUD.y + STUD.h);
      ctx.lineTo(STUD.x + STUD.w / 2, 136);
      ctx.lineTo(620, 136);
      ctx.lineTo(620, 274);
      ctx.lineTo(TEACH.x + TEACH.w / 2, 274);
      ctx.lineTo(TEACH.x + TEACH.w / 2, TEACH.y + TEACH.h);
      ctx.stroke();
      ctx.restore();

      // 四框
      for (const b of [IMG, BANK, TEACH, STUD]) {
        const on =
          (b === IMG && sel('image')) ||
          (b === BANK && sel('bank')) ||
          (b === TEACH && sel('teacher')) ||
          (b === STUD && sel('student'));
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = on ? C.blue : C.axis;
        ctx.lineWidth = on ? 3 : 2;
        ctx.beginPath();
        ctx.rect(b.x, b.y, b.w, b.h);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      // 讲解者身上的「会更新」小格
      for (let i = 0; i < 3; i++) {
        drawScoreCell(ctx, TEACH.x + TEACH.w - 54 + i * 15, TEACH.y + 20, 11, hotBack, C.green);
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    raf = requestAnimationFrame(() => render(stateRef.current));
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(() => render(stateRef.current));
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: string) => {
    stateRef.current.node = id;
    setNode(id);
    setFb(INFO[id]);
  };

  const LABEL: Record<string, string> = {
    image: '画面',
    bank: '题库',
    teacher: '讲解者',
    student: '蒙眼学生',
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          选择部件 <span className="val">{LABEL[node]}</span>
        </label>
        {(['image', 'bank', 'teacher', 'student'] as const).map((k) => (
          <button key={k} className={`chip ${node === k ? 'selected' : ''}`} onClick={() => pick(k)}>
            {LABEL[k]}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>蓝实线 = 看得见 · 红虚线 = 看不到 · 绿线 = 分数回传（只有讲解者会更新）</label>
      </div>
      <table className="paper">
        <thead>
          <tr>
            <th>谁</th>
            <th>看得到</th>
            <th>看不到（红色虚线）</th>
            <th>训练期间</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.who}>
              <td>{r.who}</td>
              <td>{r.sees}</td>
              <td style={{ color: 'var(--red)' }}>{r.blind}</td>
              <td>{r.updates}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod81;
