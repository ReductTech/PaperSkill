import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 250;

const LEVELS = [
  {
    id: 'state', name: 'Level 1 · 状态理解', color: C.blue,
    one: '看懂折痕与几何',
    groups: [
      { name: '物理与语义感知', items: '计数、指向、属性/状态识别、物体识别、深度与度量估计' },
      { name: '空间推理', items: '3D 关系、距离/朝向、视角与姿态、多视角对应、放置推理' },
      { name: '机器人中心理解', items: '机器人本体与视角、任务相关物体、功能部件、操作区域、可放置区域' },
    ],
    data: '数据锚点：深度推理、任务条件 grounding 与可供性定位',
    bench: '评测锚点：23 个基准 · 平均 68.6',
  },
  {
    id: 'transition', name: 'Level 2 · 动作转换', color: C.orange,
    one: '折一下，观察形状改变',
    groups: [
      { name: '交互理解', items: '人-物 / 人-机器人 / 物-物交互、参与者与语义、时序定位' },
      { name: '动作决策与 Grounding', items: '下一动作或技能、目标物体与部件、动作点、轨迹 / 视觉轨迹' },
      { name: '物理可行性与局部效果', items: '空间前提、可执行性、动作机制、后置条件、即时状态变化' },
    ],
    data: '数据锚点：社交交互、轨迹监督、物理因果推理',
    bench: '评测锚点：8 个基准 · 平均 64.1',
  },
  {
    id: 'sequential', name: 'Level 3 · 长程自适应', color: C.green,
    one: '多步折成纸飞机，折错重来',
    groups: [
      { name: '长程组合与规划', items: '目标分解、因果动作排序、进度感知续推、多步技能组合' },
      { name: '视觉语言导航', items: '语言目标跟随、自我运动与历史、地图/视角推理、多步导航、走错路恢复' },
      { name: '反思、修复与恢复', items: '失败检测与诊断、因果分析、反事实推理、计划修复与重规划' },
    ],
    data: '数据锚点：失败感知推理、VLN 专家演示 + DAgger',
    bench: '评测锚点：7 个基准 · 平均 57.4',
  },
];

function drawPaperState(ctx: CanvasRenderingContext2D, level: string, cx: number, cy: number, selected: boolean, color: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  if (selected) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
  }
  if (level === 'state') {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.strokeRect(-44, -44, 88, 88);
    ctx.fillRect(-44, -44, 88, 88);
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(0, 44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(44, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-44, -44); ctx.lineTo(44, 44); ctx.stroke();
    ctx.setLineDash([]);
  } else if (level === 'transition') {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-44, -30); ctx.lineTo(44, -30); ctx.lineTo(44, 58); ctx.lineTo(-44, 58); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#dbeafe';
    ctx.strokeStyle = C.orange;
    ctx.beginPath(); ctx.moveTo(-44, -30); ctx.lineTo(-2, -30); ctx.lineTo(-2, 58); ctx.lineTo(-44, 58); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.orange;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(-2, -40); ctx.lineTo(-2, 68); ctx.stroke();
    ctx.setLineDash([]);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-42, 40); ctx.lineTo(0, -52); ctx.lineTo(42, 40); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(0, 40); ctx.stroke();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(18, -6); ctx.stroke();
  }
  ctx.restore();
}

export const OrigamiLayers: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ level: 0 });
  const rafRef = useRef<number | null>(null);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { level: number }) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#eef3fb';
      ctx.fillRect(18, 18, W - 36, 184);
      ctx.strokeStyle = C.axis;
      ctx.strokeRect(18, 18, W - 36, 184);
      label(ctx, '同一张纸，三种能力状态', W / 2, 34, 12, C.ink);
      const xs = [110, 280, 450];
      LEVELS.forEach((lv, i) => {
        const selected = i === s.level;
        ctx.fillStyle = selected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)';
        ctx.fillRect(xs[i] - 78, 58, 156, 116);
        ctx.strokeStyle = selected ? lv.color : C.axis;
        ctx.lineWidth = selected ? 4 : 1.5;
        ctx.strokeRect(xs[i] - 78, 58, 156, 116);
        drawPaperState(ctx, lv.id, xs[i], 126, selected, lv.color);
        label(ctx, lv.name, xs[i], 78, 11, selected ? lv.color : C.muted);
        label(ctx, lv.one, xs[i], 156, 9, selected ? C.ink : C.muted);
      });
      label(ctx, '点击卡片或下方按钮查看完整能力清单', W / 2, 188, 10, C.muted);
    };
    const tick = () => { render(stateRef.current); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const choose = (i: number) => { stateRef.current.level = i; setLevel(i); };
  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const xs = [110, 280, 450];
    xs.forEach((cx, i) => {
      if (x > cx - 78 && x < cx + 78 && y > 58 && y < 174) choose(i);
    });
  };

  const sel = LEVELS[level];
  return (
    <div>
      <canvas ref={ref} width={W} height={H} style={{ cursor: 'pointer' }} onPointerDown={hit} />
      <div className="chip-row">
        {LEVELS.map((lv, i) => (
          <button key={lv.id} className={i === level ? 'chip selected' : 'chip'} onClick={() => choose(i)}>{lv.name}</button>
        ))}
      </div>
      <div className="feedback good">
        <b>{sel.one}：</b>{sel.data}；{sel.bench}
      </div>
      <div className="origami-grid" style={{ marginTop: 12 }}>
        {sel.groups.map((g) => (
          <div key={g.name} style={{ background: 'var(--paper-2)', borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.55 }}>
            <b style={{ color: 'var(--ink)' }}>{g.name}</b>
            <div style={{ color: 'var(--ink-2)' }}>{g.items}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrigamiLayers;
