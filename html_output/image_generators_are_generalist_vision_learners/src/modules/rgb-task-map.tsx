import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, lerp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Task = 'semantic' | 'instance' | 'depth' | 'normal';
type Region = 'park' | 'buildingA' | 'buildingB' | 'road';
type QuizChoice = 'A' | 'B' | 'C' | null;

interface RgbMapState {
  task: Task;
  focusedRegion: Region;
  legendOpen: boolean;
  legendMessage: 'opened' | 'closed' | null;
  transitionStart: number;
  reducedMotion: boolean;
  isReady: boolean;
  quizChoice: QuizChoice;
}

const COLORS = {
  desk: '#f5f8f0',
  paper: '#ffffff',
  shadow: '#b8c9a7',
  contour: '#76906a',
  current: '#27446e',
  success: '#228d5c',
  failure: '#c43f52',
  emphasis: '#d97706',
  aux: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
};

const TASK_NAMES: Record<Task, string> = {
  semantic: '语义分割',
  instance: '实例分割',
  depth: '度量深度',
  normal: '表面法线',
};

const REGION_NAMES: Record<Region, string> = {
  park: '公园',
  buildingA: '建筑 A',
  buildingB: '建筑 B',
  road: '道路',
};

const REGION_INFO: Record<Region, { category: string; instance: string; depth: string; normal: string }> = {
  park: { category: '公园', instance: '3', depth: '中', normal: '朝上' },
  buildingA: { category: '建筑', instance: '1', depth: '远', normal: '朝左' },
  buildingB: { category: '建筑', instance: '2', depth: '中', normal: '朝右' },
  road: { category: '道路', instance: '4', depth: '近', normal: '朝向相机' },
};

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawPencil(ctx: CanvasRenderingContext2D, x: number, y: number, angle = -0.3) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = COLORS.current;
  roundedRect(ctx, -17, -4, 31, 8, 3);
  ctx.fill();
  ctx.fillStyle = '#efc58f';
  ctx.beginPath();
  ctx.moveTo(14, -4);
  ctx.lineTo(23, 0);
  ctx.lineTo(14, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.beginPath();
  ctx.moveTo(20, -1.5);
  ctx.lineTo(24, 0);
  ctx.lineTo(20, 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCompact(ctx: CanvasRenderingContext2D, now: number, reduced: boolean) {
  const W = 244;
  const H = 130;
  const raw = reduced ? 0.94 : (now % 3200) / 3200;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.shadow;
  roundedRect(ctx, 18, 18, 142, 96, 9);
  ctx.fill();
  ctx.fillStyle = COLORS.paper;
  roundedRect(ctx, 14, 14, 142, 96, 9);
  ctx.fill();

  ctx.strokeStyle = COLORS.contour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(22, 78);
  ctx.lineTo(148, 45);
  ctx.stroke();
  ctx.fillStyle = raw > 0.18 ? '#b9e3cc' : '#edf2e9';
  roundedRect(ctx, 30, 28, 48, 30, 5);
  ctx.fill();
  ctx.fillStyle = raw > 0.46 ? '#c8d8ef' : '#edf2e9';
  roundedRect(ctx, 92, 64, 46, 30, 5);
  ctx.fill();
  ctx.fillStyle = raw > 0.7 ? '#f3c984' : '#edf2e9';
  roundedRect(ctx, 80, 24, 48, 27, 5);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = COLORS.border;
  roundedRect(ctx, 170, 24, 60, 76, 8);
  ctx.fill();
  ctx.stroke();
  ['#228d5c', '#27446e', '#d97706'].forEach((color, index) => {
    ctx.fillStyle = raw > 0.18 + index * 0.28 ? color : '#e5e7eb';
    ctx.beginPath();
    ctx.arc(184, 42 + index * 20, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  const move = easeInOutQuad(clamp(raw / 0.78, 0, 1));
  const px = lerp(40, 190, move);
  const py = 92 - Math.sin(move * Math.PI) * 42;
  drawPencil(ctx, px, py);

  ctx.fillStyle = COLORS.text;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText('同一张图', 26, 124);
  ctx.fillText('不同图例', 172, 116);
  if (raw > 0.82) {
    ctx.strokeStyle = COLORS.success;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(222, 16, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.success;
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.fillText('可读', 212, 19);
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.lineTo(x + dx - Math.sign(dx || 1) * 6, y + dy - 2);
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - Math.sign(dx || 1) * 3, y + dy + 6);
  ctx.stroke();
}

function regionPath(ctx: CanvasRenderingContext2D, region: Region) {
  ctx.beginPath();
  if (region === 'park') {
    roundedRect(ctx, 46, 44, 98, 58, 12);
  } else if (region === 'buildingA') {
    ctx.rect(220, 38, 60, 62);
  } else if (region === 'buildingB') {
    ctx.rect(286, 56, 58, 68);
  } else {
    ctx.moveTo(28, 150);
    ctx.lineTo(358, 86);
    ctx.lineTo(368, 123);
    ctx.lineTo(36, 187);
    ctx.closePath();
  }
}

function fillRegion(ctx: CanvasRenderingContext2D, region: Region, color: string) {
  regionPath(ctx, region);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawMapLayer(ctx: CanvasRenderingContext2D, state: RgbMapState) {
  const semanticColors: Record<Region, string> = {
    park: '#9bd2b2',
    buildingA: '#a8bddf',
    buildingB: '#a8bddf',
    road: '#e4b87c',
  };
  const instanceColors: Record<Region, string> = {
    park: '#a6d7bd',
    buildingA: '#93b4df',
    buildingB: '#b49ce5',
    road: '#efb66e',
  };
  const depthColors: Record<Region, string> = {
    park: '#2d8f75',
    buildingA: '#e3c64f',
    buildingB: '#6bb26c',
    road: '#27446e',
  };
  const normalColors: Record<Region, string> = {
    park: '#86dd9d',
    buildingA: '#e994a7',
    buildingB: '#9aaef0',
    road: '#a8b9ef',
  };
  const palette = state.task === 'semantic'
    ? semanticColors
    : state.task === 'instance'
      ? instanceColors
      : state.task === 'depth'
        ? depthColors
        : normalColors;
  (['park', 'buildingA', 'buildingB', 'road'] as Region[]).forEach((region) => fillRegion(ctx, region, palette[region]));

  ctx.strokeStyle = 'rgba(33,50,74,.45)';
  ctx.lineWidth = 1;
  if (state.task === 'semantic') {
    for (let y = 50; y < 100; y += 9) {
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(140, y);
      ctx.stroke();
    }
  } else if (state.task === 'instance') {
    ctx.fillStyle = COLORS.text;
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.fillText('①', 239, 70);
    ctx.fillText('②', 304, 90);
  } else if (state.task === 'depth') {
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.fillText('近', 70, 164);
    ctx.fillText('中', 98, 76);
    ctx.fillText('远', 240, 68);
  } else {
    ctx.strokeStyle = COLORS.text;
    ctx.lineWidth = 2;
    drawArrow(ctx, 94, 83, 0, -22);
    drawArrow(ctx, 248, 75, -20, 0);
    drawArrow(ctx, 308, 94, 20, 0);
    drawArrow(ctx, 170, 143, 0, -20);
  }
}

function drawLegend(ctx: CanvasRenderingContext2D, state: RgbMapState) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  roundedRect(ctx, 390, 32, 152, 160, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText(state.legendOpen ? '当前图例' : '图例已收起', 412, 56);
  if (!state.legendOpen) {
    ctx.strokeStyle = COLORS.failure;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(420, 92);
    ctx.lineTo(512, 148);
    ctx.moveTo(512, 92);
    ctx.lineTo(420, 148);
    ctx.stroke();
    return;
  }
  const rows = state.task === 'semantic'
    ? [['公园', '#9bd2b2', '叶片纹'], ['建筑', '#a8bddf', '方块'], ['道路', '#e4b87c', '平行线']]
    : state.task === 'instance'
      ? [['建筑①', '#93b4df', '编号 1'], ['建筑②', '#b49ce5', '编号 2'], ['其他', '#efb66e', '独立编号']]
      : state.task === 'depth'
        ? [['近', '#27446e', '近端'], ['中', '#2d8f75', '中段'], ['远', '#e3c64f', '远端']]
        : [['朝左', '#e994a7', '←'], ['朝上', '#86dd9d', '↑'], ['朝向相机', '#a8b9ef', '⊙']];
  rows.forEach(([label, color, cue], index) => {
    const y = 82 + index * 34;
    ctx.fillStyle = color;
    roundedRect(ctx, 408, y - 12, 22, 18, 4);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillText(label, 438, y);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(cue, 486, y);
  });
}

function drawMain(ctx: CanvasRenderingContext2D, state: RgbMapState, now: number) {
  const W = 560;
  const H = 250;
  const elapsed = state.transitionStart ? now - state.transitionStart : 300;
  const alpha = state.reducedMotion ? 1 : easeInOutQuad(clamp(elapsed / 260, 0, 1));
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.desk;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.shadow;
  roundedRect(ctx, 22, 26, 350, 174, 11);
  ctx.fill();
  ctx.fillStyle = COLORS.paper;
  roundedRect(ctx, 18, 22, 350, 174, 11);
  ctx.fill();
  ctx.save();
  ctx.globalAlpha = alpha;
  drawMapLayer(ctx, state);
  ctx.restore();

  ctx.strokeStyle = COLORS.emphasis;
  ctx.lineWidth = 4;
  ctx.setLineDash([7, 4]);
  regionPath(ctx, state.focusedRegion);
  ctx.stroke();
  ctx.setLineDash([]);
  drawPencil(ctx, state.focusedRegion === 'road' ? 196 : state.focusedRegion === 'park' ? 146 : state.focusedRegion === 'buildingA' ? 278 : 342, state.focusedRegion === 'road' ? 148 : 43, -0.18);

  drawLegend(ctx, state);
  ctx.fillStyle = COLORS.current;
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('载体：RGB 图像', 221, 230);
  ctx.strokeStyle = COLORS.success;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(522, 216, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.success;
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.fillText('可读', 511, 219);
}

function feedbackFor(state: RgbMapState) {
  if (!state.legendOpen) return '图层还在，但读法被藏起来了：颜色本身不会自动说明任务含义。';
  if (state.legendMessage === 'opened') return '图例已恢复；同一张 RGB 图现在有了明确读法。';
  const name = REGION_NAMES[state.focusedRegion];
  const info = REGION_INFO[state.focusedRegion];
  if (state.task === 'semantic') return `同一类别共用一种目标色；解码后得到每个像素的类别。当前区域：${name} → ${info.category}。`;
  if (state.task === 'instance') return `同类中的不同个体也使用不同颜色；解码后得到彼此分开的实例掩码。当前区域：${name} → 实例 ${info.instance}。`;
  if (state.task === 'depth') return `颜色沿约定的连续路径表示远近；解码后目标是物理距离，而不是一个好看的热图。当前区域位于${info.depth}段。`;
  return `RGB 通道按约定携带表面朝向；解码后目标是相机坐标系中的方向。当前区域朝向：${info.normal}。`;
}

export const RgbTaskMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const compact = moduleId === 'ana';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<RgbMapState>({
    task: 'semantic',
    focusedRegion: 'park',
    legendOpen: true,
    legendMessage: null,
    transitionStart: 0,
    reducedMotion: false,
    isReady: false,
    quizChoice: null,
  });
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setState((current) => ({ ...current, reducedMotion: media.matches }));
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = compact ? 244 : 560;
    const H = compact ? 130 : 250;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = `${W}px`;
    const tick = (now: number) => {
      if (compact) drawCompact(ctx, now, stateRef.current.reducedMotion);
      else drawMain(ctx, stateRef.current, now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [compact]);

  if (compact) {
    return (
      <div>
        <canvas
          ref={canvasRef}
          width={244}
          height={130}
          role="img"
          aria-label="一支制图铅笔按不同图例为同一张 RGB 地图上色"
        />
        <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
          RGB 是载体，图例决定语义
        </span>
      </div>
    );
  }

  const feedback = feedbackFor(state);
  const quizFeedback = state.quizChoice === null
    ? ''
    : state.quizChoice === 'B'
      ? '正确。统一的是输出载体和生成接口，任务语义仍由各自约定决定。'
      : '请重新打开图例：任务一换，同一块颜色的读法也可能改变；没有约定就无法可靠解析。';
  const tasks: Task[] = ['semantic', 'instance', 'depth', 'normal'];
  const moveTaskFocus = (event: React.KeyboardEvent<HTMLButtonElement>, task: Task) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = tasks.indexOf(task);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tasks.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tasks.length) % tasks.length;
    const nextTask = tasks[nextIndex];
    setState((current) => ({ ...current, task: nextTask, legendMessage: null, transitionStart: performance.now() }));
    const group = event.currentTarget.parentElement;
    window.requestAnimationFrame(() => (group?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex])?.focus());
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="paper-control-block">
        <div className="paper-choice-group" role="tablist" aria-label="选择 RGB 图层任务">
          {tasks.map((task) => (
            <button
              key={task}
              type="button"
              role="tab"
              aria-selected={state.task === task}
              tabIndex={state.task === task ? 0 : -1}
              onKeyDown={(event) => moveTaskFocus(event, task)}
              onClick={() => setState((current) => ({ ...current, task, legendMessage: null, transitionStart: performance.now() }))}
            >
              {TASK_NAMES[task]}
            </button>
          ))}
        </div>
        <div className="paper-choice-group" role="group" aria-label="选择地图区域">
          {(['park', 'road', 'buildingA', 'buildingB'] as Region[]).map((region) => (
            <button
              key={region}
              type="button"
              aria-pressed={state.focusedRegion === region}
              onClick={() => setState((current) => ({ ...current, focusedRegion: region, legendMessage: null }))}
            >
              {REGION_NAMES[region]}
            </button>
          ))}
        </div>
        <div className="paper-action-group" aria-label="图例操作">
          <button
            type="button"
            className="paper-secondary-action"
            aria-expanded={state.legendOpen}
            onClick={() => setState((current) => ({
              ...current,
              legendOpen: !current.legendOpen,
              legendMessage: current.legendOpen ? 'closed' : 'opened',
            }))}
          >
            {state.legendOpen ? '收起图例' : '显示图例'}
          </button>
        </div>
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={560}
        height={250}
        role="img"
        aria-label={`同一张城市地图当前显示${TASK_NAMES[state.task]}图层，焦点区域是${REGION_NAMES[state.focusedRegion]}。`}
      />

      <div className={`feedback ${state.legendOpen ? 'good' : 'bad'}`} role="status" aria-live="polite">
        {feedback}
      </div>

      <dl className="paper-stat-grid">
        <div><dt>语义分割</dt><dd>同类同色，并用叶片或线纹补充。</dd></div>
        <div><dt>实例分割</dt><dd>同类个体分色，并保留编号。</dd></div>
        <div><dt>度量深度</dt><dd>连续色序承载远近，具体公式留到第 4 章。</dd></div>
        <div><dt>表面法线</dt><dd>颜色承载方向，同时显示箭头。</dd></div>
      </dl>

      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700 }}>“RGB 是统一接口”最准确的含义是什么？</p>
        <div className="paper-choice-group paper-choice-stack" role="group" aria-label="RGB 接口判断题">
          {[
            ['A', '所有任务中同一种颜色永远表示同一含义'],
            ['B', '不同任务共用图像输出载体，但各自有明确提示、颜色约定和解码规则'],
            ['C', '只要图片足够漂亮，就能直接计算任意视觉指标'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={state.quizChoice === key}
              onClick={() => setState((current) => ({ ...current, quizChoice: key as QuizChoice }))}
            >
              {label}
            </button>
          ))}
        </div>
        {quizFeedback ? (
          <div className={`feedback ${state.quizChoice === 'B' ? 'good' : 'bad'}`} role="status" style={{ marginTop: 8 }}>
            {quizFeedback}
          </div>
        ) : null}
      </div>

      <p style={{ margin: 0, color: COLORS.muted, fontSize: 14 }}>
        本章不引入深度变换或法线通道公式。RGB 统一接口只覆盖论文实际设计了可解析约定的任务。
      </p>
    </div>
  );
};

export default RgbTaskMap;
