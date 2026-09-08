import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 250;

const JARS = [
  { id: 'depth', name: '深度推理', short: '深', color: '#27446e', level: 'Level 1', source: 'Argoverse 2 · Matterport3D · nuScenes · ScanNet++ · Taskonomy', build: 'RGB-D 取有效深度像素；驾驶数据把 LiDAR 投影到相机平面；焦距归一化到 1000px；目标至少离边界 60px，红色箭头指向绿色锚点；再由多线索合成 CoT 推理样本。' },
  { id: 'ground', name: '任务条件接地/可供性', short: '接', color: '#d97706', level: 'Level 1–2', source: '机器人操作数据与语言指令', build: '定位任务相关物体、功能部件、可抓握部位、可拉表面、吸盘吸附点，以及满足任务与物理约束的可行交互和放置区域。' },
  { id: 'social', name: '社会交互', short: '社', color: '#7c3aed', level: 'Level 2', source: '公开网络视频与内部录制的第一视角视频 + AVA v2.2 + HICO-DET', build: '第一视角数据重点标注与佩戴者交互的人：交互者身份、视线/头部朝向、手势目标、身体姿态与朝向、情绪；AVA/HICO-DET 扩展人体动作、社会行为、物体操作与人-物交互覆盖；坐标统一到 0–1000，并给结构化 JSON 与问答两种监督。' },
  { id: 'traj', name: '物体/机器人轨迹监督', short: '轨', color: '#228d5c', level: 'Level 2', source: '物体、机器人末端与人类操作演示', build: '用有序点序列监督物体运动、末端执行器运动、人类操作轨迹与关节部件运动；2D 轨迹看图像平面，3D 轨迹要求深度感知，训练方向、连续性、中间路点与局部变化。' },
  { id: 'causal', name: '因果推理', short: '因', color: '#92400e', level: 'Level 2', source: 'Ego4D 等自我中心与机器人操作视频', build: '识别任务目标，把过程分解为有序步骤并标注前置条件、效果与步骤依赖；用关键帧锚定转移；复杂动作拆成带时间戳的原子交互；转换为可执行性、效果预测、步骤组合与因果稳健性 QA；过滤视觉依据不足的样本。' },
  { id: 'failure', name: '失败感知机器人推理', short: '败', color: '#c43f52', level: 'Level 3', source: '机器人执行视频、扰动任务计划与失败案例', build: '判断执行状态、验证子任务计划是否合理、定位错误动作或阶段、分析失败原因、给出可执行的恢复建议；训练“发现失败 → 诊断 → 修复”。' },
  { id: 'vln', name: '视觉-语言导航', short: '航', color: '#0f766e', level: 'Level 3', source: 'Habitat 中的 R2R-CE 训练集', build: '先由最短路径 oracle 生成专家演示；第二阶段 DAgger，β_t=1−αt/T、α=0.5 让学生逐步接管；每个访问状态都保存未来 4 步 oracle 动作块作为训练监督（不一定实际执行）；剔除畸形与终止后样本，重新平衡转弯/停止。' },
];

export const DataJars: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 0 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { sel: number }, t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      label(ctx, '七类新增 SFT 数据 · 点击数据瓶查看配方', W / 2, 20, 13, C.ink);
      const xs = [46, 116, 186, 256, 326, 396, 466];
      const yTop = 52;
      const jarW = 44;
      const jarH = 104;
      JARS.forEach((j, i) => {
        const x = xs[i];
        const selected = i === s.sel;
        // jar body
        ctx.fillStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.72)';
        ctx.fillRect(x, yTop, jarW, jarH);
        ctx.strokeStyle = selected ? j.color : C.axis;
        ctx.lineWidth = selected ? 4 : 2;
        ctx.strokeRect(x, yTop, jarW, jarH);
        // liquid
        const level = 0.62 + 0.3 * Math.sin(i * 1.7);
        ctx.fillStyle = j.color;
        ctx.globalAlpha = selected ? 0.9 : 0.55;
        ctx.fillRect(x + 5, yTop + jarH - level * (jarH - 14), jarW - 10, level * (jarH - 14) - 5);
        ctx.globalAlpha = 1;
        // shine
        if (selected) {
          ctx.strokeStyle = j.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x + jarW / 2, yTop + jarH + 14 + Math.sin(t * 3) * 2, 5, 0, Math.PI * 2);
          ctx.stroke();
        }
        label(ctx, j.short, x + jarW / 2, yTop + jarH - 12, 12, selected ? '#ffffff' : C.muted);
        label(ctx, j.name, x + jarW / 2, yTop + jarH + 24, 9, selected ? j.color : C.muted);
      });
    };
    const tick = (now: number) => { render(stateRef.current, now / 1000); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const choose = (i: number) => { stateRef.current.sel = i; setSel(i); };
  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const xs = [46, 116, 186, 256, 326, 396, 466];
    xs.forEach((jx, i) => {
      if (x > jx - 8 && x < jx + 52 && y > 44 && y < 164) choose(i);
    });
  };

  const j = JARS[sel];
  return (
    <div>
      <canvas ref={ref} width={W} height={H} style={{ cursor: 'pointer' }} onPointerDown={hit} />
      <div className="chip-row">
        {JARS.map((x, i) => (
          <button key={x.id} className={i === sel ? 'chip selected' : 'chip'} onClick={() => choose(i)}>{x.name}</button>
        ))}
      </div>
      <div className={`feedback ${j.id === 'failure' ? 'bad' : 'good'}`}>
        <b>{j.name} · {j.level}：</b>来源 {j.source}。
      </div>
      <div style={{ marginTop: 10, background: 'var(--paper-2)', borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
        <b style={{ color: 'var(--ink)' }}>构造方式：</b>{j.build}
      </div>
    </div>
  );
};

export default DataJars;
