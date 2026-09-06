import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 250;
const AW = 244;
const AH = 130;

type TaskKey = 'semantic' | 'instance' | 'referring' | 'depth' | 'normal';
type Phase = 'prompt' | 'model' | 'rgb' | 'decoded';

interface ArchitectureState {
  selectedTask: TaskKey;
  phase: Phase;
  isPlaying: boolean;
  isReady: boolean;
  reducedMotion: boolean;
}

const TASKS: Record<TaskKey, {
  label: string;
  prompt: string;
  rgb: string;
  decoder: string;
  result: string;
  feedback: string;
}> = {
  semantic: {
    label: '语义分割',
    prompt: '类别—颜色表',
    rgb: '语义 RGB 图',
    decoder: '最近目标色',
    result: '每像素类别',
    feedback: '语义分割：提示词给出类别—颜色映射；生成 RGB 后，按最近目标色逐像素归类。',
  },
  instance: {
    label: '实例分割',
    prompt: '目标类＋背景色',
    rgb: '动态实例色',
    decoder: '多阶段聚类',
    result: '离散实例掩码',
    feedback: '实例分割：提示词给出目标类别与背景色；模型为未知数量的实例动态分色，外部解码器再做多阶段聚类。',
  },
  referring: {
    label: '指代表达分割',
    prompt: '目标描述＋颜色',
    rgb: '二值前景图',
    decoder: '前景色匹配',
    result: '二值掩码',
    feedback: '指代表达分割：提示词描述要找的对象；指定前景与背景颜色后，RGB 输出可还原为二值掩码。',
  },
  depth: {
    label: '度量深度估计',
    prompt: '深度颜色约定',
    rgb: '可逆深度色',
    decoder: '颜色路径逆变换',
    result: '米制距离',
    feedback: '度量深度估计：RGB 通过可逆颜色映射还原为米制距离；深度训练与预测本身不使用相机内参。',
  },
  normal: {
    label: '表面法线估计',
    prompt: '相机空间约定',
    rgb: '方向通道色',
    decoder: '通道反缩放',
    result: '(x,y,z)',
    feedback: '表面法线估计：相机空间单位法线 (x,y,z) 按通道编码为 (R,G,B)，再逐像素反解方向。',
  },
};

const phaseIndex = (phase: Phase) => ({ prompt: 0, model: 1, rgb: 2, decoded: 3 }[phase]);

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = '#21324a', size = 12, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${size}px "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(value, x, y);
}

function drawSeal(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  ctx.strokeStyle = '#228d5c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.stroke();
  text(ctx, '✓', x, y + 5, '#228d5c', 16, 'center');
  text(ctx, label, x, y + 32, '#228d5c', 11, 'center');
}

const ArchitectureAnalogy: React.FC<{ chapterId: string; moduleId: string }> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, AW, AH);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let origin = 0;
    const draw = (elapsed: number) => {
      ctx.clearRect(0, 0, AW, AH);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, AW, AH);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#76906a';
      ctx.lineWidth = 2;
      roundRect(ctx, 15, 25, 148, 82, 8);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#d7deea';
      ctx.beginPath(); ctx.moveTo(28, 44); ctx.lineTo(148, 44); ctx.moveTo(28, 64); ctx.lineTo(148, 64); ctx.stroke();
      const p = reduced ? 2.7 : elapsed % 3.2;
      const depthT = clamp(p / 1.0, 0, 1);
      const colors = depthT > .65 ? ['#c43f52', '#d97706', '#228d5c', '#27446e'] : ['#27446e', '#228d5c', '#d97706', '#7c3aed'];
      colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(30 + i * 29, 72, 22, 18); });
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#d7deea';
      roundRect(ctx, 174, 30, 55, 68, 8); ctx.fill(); ctx.stroke();
      ['语', '例', '深', '法'].forEach((v, i) => text(ctx, v, 188 + (i % 2) * 25, 49 + Math.floor(i / 2) * 28, '#68778f', 11, 'center'));
      const angle = -1.25 + depthT * 1.55;
      ctx.save(); ctx.translate(201, 64); ctx.rotate(angle);
      ctx.strokeStyle = '#27446e'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(22, 0); ctx.stroke();
      ctx.fillStyle = '#27446e'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (p >= 2.2) drawSeal(ctx, 151, 22, '');
      text(ctx, '选图层', 18, 17, '#27446e', 11);
      text(ctx, '可解码', 224, 118, '#228d5c', 11, 'right');
      canvas.classList.add('is-ready');
    };
    const tick = (now: number) => {
      if (!origin) origin = now;
      draw((now - origin) / 1000);
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current !== null) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (reduced) draw(2.7); else if (raf.current === null) raf.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={AW} height={AH} aria-label="图层拨盘从语义分割转向度量深度估计，同一张地图得到可解码图层" style={{ width: '100%', maxWidth: AW, height: 'auto' }} />;
};

export const SharedModelArchitecture: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  if (moduleId === 'ana' || moduleId.toLowerCase().includes('analogy')) {
    return <ArchitectureAnalogy chapterId={chapterId} moduleId={moduleId} />;
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timers = useRef<number[]>([]);
  const [state, setState] = useState<ArchitectureState>(() => ({
    selectedTask: 'semantic',
    phase: 'prompt',
    isPlaying: false,
    isReady: false,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  }));

  const clearTimers = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };

  const play = (task: TaskKey) => {
    clearTimers();
    setState((s) => ({
      ...s,
      selectedTask: task,
      phase: s.reducedMotion ? 'decoded' : 'prompt',
      isPlaying: !s.reducedMotion,
    }));
    if (state.reducedMotion) return;
    const schedule = (delay: number, phase: Phase, done = false) => {
      timers.current.push(window.setTimeout(() => setState((s) => ({ ...s, phase, isPlaying: !done })), delay));
    };
    schedule(250, 'model'); schedule(650, 'rgb'); schedule(1000, 'decoded', true);
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const draw = () => {
      const task = TASKS[state.selectedTask];
      const active = phaseIndex(state.phase);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
      const boxes = [
        { x: 16, w: 116, label: task.prompt, color: '#d97706' },
        { x: 156, w: 130, label: 'Vision Banana', color: '#27446e' },
        { x: 310, w: 98, label: task.rgb, color: '#27446e' },
        { x: 432, w: 112, label: task.decoder, color: '#7c3aed' },
      ];
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2;
      boxes.forEach((b, i) => {
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, b.x, 58, b.w, 122, 12); ctx.fill();
        ctx.strokeStyle = i <= active ? b.color : '#d7deea'; ctx.lineWidth = i <= active ? 3 : 1; ctx.stroke();
      });
      for (let i = 0; i < boxes.length - 1; i += 1) {
        const x1 = boxes[i].x + boxes[i].w;
        const x2 = boxes[i + 1].x;
        ctx.strokeStyle = i < active ? '#27446e' : '#b8c9a7'; ctx.lineWidth = i < active ? 3 : 1;
        ctx.beginPath(); ctx.moveTo(x1 + 4, 118); ctx.lineTo(x2 - 8, 118); ctx.stroke();
        ctx.fillStyle = i < active ? '#27446e' : '#b8c9a7';
        ctx.beginPath(); ctx.moveTo(x2 - 8, 113); ctx.lineTo(x2, 118); ctx.lineTo(x2 - 8, 123); ctx.fill();
      }
      text(ctx, '提示卡', 74, 78, '#d97706', 12, 'center');
      text(ctx, task.prompt, 74, 106, '#21324a', 11, 'center');
      ctx.fillStyle = '#eef3fb'; roundRect(ctx, 28, 122, 92, 42, 7); ctx.fill();
      ctx.strokeStyle = '#76906a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(36, 151); ctx.lineTo(62, 132); ctx.lineTo(88, 148); ctx.lineTo(112, 130); ctx.stroke();
      ctx.fillStyle = '#27446e'; roundRect(ctx, 167, 84, 108, 70, 12); ctx.fill();
      text(ctx, 'Vision Banana', 221, 111, '#ffffff', 13, 'center');
      text(ctx, '共享权重', 221, 135, '#ffffff', 11, 'center');
      ctx.setLineDash([5, 4]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; roundRect(ctx, 174, 91, 94, 56, 9); ctx.stroke(); ctx.setLineDash([]);
      if (active >= 2) {
        if (state.selectedTask === 'depth') {
          ['#c43f52', '#d97706', '#228d5c', '#27446e'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(323 + i * 18, 103, 18, 40); });
        } else if (state.selectedTask === 'normal') {
          ctx.fillStyle = '#7c3aed'; ctx.fillRect(325, 100, 68, 48);
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(338, 137); ctx.lineTo(380, 111); ctx.stroke();
        } else {
          ['#27446e', '#d97706', '#7c3aed'].forEach((c, i) => { ctx.fillStyle = c; roundRect(ctx, 322 + i * 20, 101 + (i % 2) * 23, 34, 28, 4); ctx.fill(); });
        }
        text(ctx, task.rgb, 359, 165, '#21324a', 10, 'center');
      }
      if (active >= 3) {
        ctx.fillStyle = '#f4edff'; roundRect(ctx, 443, 82, 90, 43, 8); ctx.fill();
        text(ctx, task.decoder, 488, 108, '#7c3aed', 10, 'center');
        ctx.fillStyle = '#e7f6ee'; roundRect(ctx, 443, 135, 90, 33, 8); ctx.fill();
        text(ctx, task.result, 488, 157, '#228d5c', 11, 'center');
        drawSeal(ctx, 530, 51, '');
      }
      text(ctx, '提示 → 共享模型 → RGB → 解码', 280, 232, '#27446e', 12, 'center');
      canvas.classList.add('is-ready');
      if (!state.isReady) setState((s) => ({ ...s, isReady: true }));
    };
    draw();
    const disconnect = observeCanvas(canvas, draw, () => {});
    return disconnect;
  }, [state]);

  return (
    <div>
      <div className="paper-choice-group" role="radiogroup" aria-label="选择视觉任务">
        {(Object.keys(TASKS) as TaskKey[]).map((key) => (
          <button key={key} type="button" aria-pressed={state.selectedTask === key} onClick={() => play(key)}>{TASKS[key].label}</button>
        ))}
      </div>
      <div className="paper-action-group" aria-label="接口流操作">
        <button type="button" onClick={() => play(state.selectedTask)} disabled={state.isPlaying}>重播接口流</button>
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="论文仅披露 Vision Banana 的输入输出接口，未披露完整内部架构"
        style={{ width: '100%', maxWidth: W, height: 'auto' }}
      />
      <div className="feedback good" role="status" aria-live="polite">{TASKS[state.selectedTask].feedback}</div>
      <div className="paper-table-scroll" role="region" aria-label="五种任务接口对照表，可横向滚动" tabIndex={0}>
        <table className="paper">
          <caption>五种任务的提示、RGB 输出与解码结果</caption>
          <thead><tr><th>任务</th><th>提示约定</th><th>RGB 输出</th><th>外部解码</th><th>结果</th></tr></thead>
          <tbody>{(Object.keys(TASKS) as TaskKey[]).map((key) => <tr key={key}><td>{TASKS[key].label}</td><td>{TASKS[key].prompt}</td><td>{TASKS[key].rgb}</td><td>{TASKS[key].decoder}</td><td>{TASKS[key].result}</td></tr>)}</tbody>
        </table>
      </div>
      <p><strong>接口说明：</strong>这里聚焦系统边界与任务路由。不同任务各有对应的公式和解码规则；表格只对照每类输出的单位与解码名称，避免把“接口共享”误解成“所有任务共用同一个数值编码”。</p>
      <ul>
        <li>不能把蓝色封闭框展开成自造的编码器、扩散主干、任务头或参数流程，也不能声称某个内部模块专门负责几何。</li>
        <li>“只改变提示”描述模型侧任务选择；整个可评测系统仍需任务特定的 RGB 约定和外部解码后处理。</li>
        <li>本文实验覆盖的是所评估的分割、深度、法线以及保留的生成/编辑能力，不足以证明任意图像生成器天然掌握任意视觉任务。</li>
      </ul>
    </div>
  );
};

export default SharedModelArchitecture;
