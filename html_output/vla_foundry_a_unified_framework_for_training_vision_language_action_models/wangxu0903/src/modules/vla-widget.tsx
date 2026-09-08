import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const COLORS = {
  bg: '#f5f8f0',
  envLight: '#b8c9a7',
  envDark: '#76906a',
  road: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea'
};

type Mode = 'fragmented' | 'unified' | 'llm' | 'vlm' | 'vla' | 'config' | 'registry' | 'data' | 'train' | 'images' | 'text' | 'prop' | 'actions' | 'absolute' | 'relative' | 'vision' | 'obs' | 'head' | 'scratch' | 'qwen' | 'st' | 'mt' | 'ft' | 'protocol' | 'dataset' | 'metric' | 'limit' | 'results' | 'value' | 'limitation';

const W = 560;
const H = 240;
const AW = 244;
const AH = 130;
const WIDE_W = 680;
const WIDE_H = 280;
const WIDE_AW = 350;
const WIDE_AH = 150;

const moduleConfig: Record<string, { title: string; modes: Mode[]; labels: string[]; feedback: Record<string, string>; defaultMode?: Mode }> = {
  old: {
    title: '割裂流程',
    modes: ['fragmented', 'unified'],
    labels: ['只调动作头', '统一训练栈'],
    defaultMode: 'fragmented',
    feedback: {
      fragmented: '上游选择被遮住，只能看到末端动作训练。',
      unified: '语言、图文和动作学习被放入同一条可控路线。'
    }
  },
  new: {
    title: '统一路线',
    modes: ['fragmented', 'unified'],
    labels: ['只调动作头', '统一训练栈'],
    defaultMode: 'unified',
    feedback: {
      fragmented: '只看最后一步会漏掉数据配方和 backbone 的影响。',
      unified: '统一框架让从零训练和预训练 backbone 路线可以比较。'
    }
  },
  ana: {
    title: '行程类比',
    modes: ['unified'],
    labels: ['演示'],
    feedback: { unified: '同一辆车、同一张地图、同一套仪表，对应统一训练栈。' }
  },
  '1.1': {
    title: '动机对比',
    modes: ['fragmented', 'unified'],
    labels: ['只调动作头', '统一训练栈'],
    feedback: {
      fragmented: '现有流程常只开放 action fine-tuning，上游 LLM/VLM 预训练和数据配方难以统一控制。',
      unified: 'VLA Foundry 把 backbone、data recipe、training stage 都变成可配置、可比较的实验变量。'
    }
  },
  '2.1': {
    title: '三段流程',
    modes: ['llm', 'vlm', 'vla'],
    labels: ['LLM', 'VLM', 'VLA'],
    feedback: {
      llm: 'LLM 阶段学习文本序列建模，是后续多模态能力的语言底座。',
      vlm: 'VLM 阶段把图像 token 与文本 token 对齐，形成视觉语言 backbone。',
      vla: 'VLA 阶段把观察、任务文本和动作监督连接起来，学习机器人动作策略。'
    }
  },
  '3.1': {
    title: '四层框架',
    modes: ['config', 'registry', 'data', 'train'],
    labels: ['配置', 'Registry', '数据', '训练'],
    feedback: {
      config: '配置层把模型、数据、训练超参写进 recipe，减少隐藏实验变量。',
      registry: 'Registry 把模型、dataset、batch handler 做成可替换插槽。',
      data: '数据层把 text、image-caption、robotics trajectories 放进统一 mixer。',
      train: '共享训练循环承接 DDP/FSDP、混合精度、梯度累积和 checkpoint restart。'
    }
  },
  '4.1': {
    title: '机器人样本',
    modes: ['images', 'text', 'prop', 'actions'],
    labels: ['图像', '文本', '本体', '动作'],
    feedback: {
      images: '多相机、多时间步图像提供场景观察。',
      text: '任务文本描述机器人应该完成什么。',
      prop: '本体状态只使用过去和当前信息，保持因果约束。',
      actions: '未来 action chunk 是训练监督，不是推理时可见输入。'
    }
  },
  '4.2': {
    title: '动作窗口',
    modes: ['unified'],
    labels: ['窗口'],
    feedback: { unified: '拖动 anchor：左侧过去作为上下文，右侧未来作为动作监督。' }
  },
  '5.2': {
    title: 'Figure 6 任务',
    modes: ['protocol', 'metric', 'limit'],
    labels: ['任务类型', '图像来源', '输入边界'],
    feedback: {
      protocol: 'Figure 6 覆盖 pick-and-place、非抓取操作和双臂协同等 seen simulation tasks。',
      metric: '论文说明这些图片是 rollout 中点附近的可视化，经 Blender Cycles 重渲染以便展示。',
      limit: 'Figure 6 不是模型真实推理输入；真实传感器输入应看 Figure 16。'
    }
  },
  '4.3': {
    title: 'VLA 架构',
    modes: ['vision', 'vlm', 'obs', 'head'],
    labels: ['ViT', 'VLM', 'Obs token', 'Action head'],
    feedback: {
      vision: 'ViT 编码多视角图像，pooling 后形成较短视觉 token。',
      vlm: 'VLM backbone 汇合图像 token、任务文本和 observation token。',
      obs: 'Observation token 对应的 hidden features 被送入动作头。',
      head: 'Flow transformer action head 对带噪动作序列预测去噪方向。'
    }
  },
  '5.1': {
    title: 'Table 3 模型规模',
    modes: ['scratch', 'qwen'],
    labels: ['From Scratch', 'Qwen3-VL'],
    feedback: {
      scratch: 'Foundry-VLA-1.7B 更强调全流程可控：LLM、VLM、VLA 都从头走通。',
      qwen: 'Foundry-Qwen3VLA-2.1B-MT 更强调 backbone 复用：把强 VLM 接进同一训练栈。'
    }
  },
  '6.1': {
    title: '实验结论选择器',
    modes: ['results', 'metric', 'limit'],
    labels: ['Baseline comparison', 'ST / MT / FT comparison', 'Data recipe comparison'],
    feedback: {
      results: 'Qwen3VLA-2.1B-MT 相对 prior LBM multi-task policy 平均高约 23 个百分点。',
      metric: 'Table 4：Qwen3VLA 的 ST、MT、FT 分别使用 2.0M/任务、100M、1.024M/任务样本；Figure 7 只报告 aggregate 的上升趋势。',
      limit: 'Table 5：real-only、sim-only、real+sim 分别对应 47,068、7,548、54,616 条 episodes；Figure 9 显示 real-only 在仿真中近乎 0%。'
    }
  },
  '7.2': {
    title: 'Table 5 / 6 协议',
    modes: ['protocol', 'dataset', 'limit'],
    labels: ['任务集', '数据集', '边界'],
    feedback: {
      protocol: 'Table 6 说明 seen tasks 用于多任务训练，unseen tasks 作为 held-out 评估。',
      dataset: 'Table 5 给出 Real / Sim 在 LBM 与 VLA Foundry 下的任务数和 episodes 数。',
      limit: '结论必须绑定 closed-loop simulation；论文没有真实硬件结果。'
    }
  },
  '7.1': {
    title: '价值与边界',
    modes: ['value', 'limitation'],
    labels: ['Value', 'Limitation'],
    feedback: {
      value: '论文的价值是研究基础设施：可复现、可替换、可比较。',
      limitation: '结论边界要讲清楚：没有真实硬件结果，评估主要集中在 LBM simulation。'
    }
  }
};

export const VlaWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAnalogy = moduleId === 'ana';
  const isHero = moduleId === 'old' || moduleId === 'new';
  const isWideAnalogy = isAnalogy && chapterId === 'chap-3';
  const isWideModule = !isAnalogy && (moduleId === '3.1' || moduleId === '4.3');
  const cfg = moduleConfig[moduleId] ?? moduleConfig['1.1'];
  const initial = cfg.defaultMode ?? cfg.modes[0];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode; anchor: number; running: boolean }>({ mode: initial, anchor: 4, running: false });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>(initial);
  const [anchor, setAnchor] = useState(4);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = isWideAnalogy ? WIDE_AW : isAnalogy ? AW : isWideModule ? WIDE_W : W;
    const height = isWideAnalogy ? WIDE_AH : isAnalogy ? AH : isWideModule ? WIDE_H : H;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, width, height);
    } catch {
      return;
    }
    const startedAt = performance.now();
    const render = (time: number) => {
      drawScene(ctx, width, height, chapterId, moduleId, stateRef.current, (time - startedAt) / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    start();
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [chapterId, isAnalogy, isWideAnalogy, isWideModule, moduleId]);

  const updateMode = (next: Mode) => {
    stateRef.current.mode = next;
    stateRef.current.running = next === 'results' ? true : stateRef.current.running;
    setMode(next);
    if (next === 'results') setRunning(true);
  };

  const updateAnchor = (value: number) => {
    const next = clamp(value, 2, 6);
    stateRef.current.anchor = next;
    setAnchor(next);
  };

  const fb = cfg.feedback[mode] ?? cfg.feedback[initial];
  const cls = mode === 'fragmented' || mode === 'limit' ? 'bad' : mode === 'unified' || mode === 'qwen' || mode === 'relative' || mode === 'results' ? 'good' : '';

  if (isAnalogy) {
    return <canvas id={'cv-' + chapterId + '-' + moduleId} ref={canvasRef} width={isWideAnalogy ? WIDE_AW : AW} height={isWideAnalogy ? WIDE_AH : AH} />;
  }

  if (isHero) {
    return <canvas id={'cv-' + chapterId + '-' + moduleId} ref={canvasRef} width={W} height={H} />;
  }

  return (
    <div>
      <canvas id={'cv-' + chapterId + '-' + moduleId} ref={canvasRef} width={isWideModule ? WIDE_W : W} height={isWideModule ? WIDE_H : H} />
      {moduleId === '4.2' ? (
        <div className="ctrl">
          <label>anchor timestep <span className="val">{anchor}</span></label>
          <input type="range" min={2} max={6} value={anchor} onChange={(event) => updateAnchor(Number(event.target.value))} />
        </div>
      ) : (
        <div className="ctrl">
          {cfg.modes.map((item, index) => (
            <button className={'chip ' + (mode === item ? 'active' : '')} key={item} onClick={() => updateMode(item)}>
              {cfg.labels[index] ?? item}
            </button>
          ))}
        </div>
      )}
      <div className={'feedback ' + cls}>{running && mode === 'results' ? cfg.feedback.results : fb}</div>
    </div>
  );
};

const drawScene = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  chapterId: string,
  moduleId: string,
  state: { mode: Mode; anchor: number; running: boolean },
  time: number
) => {
  clear(ctx, width, height);
  if (moduleId === 'ana') drawPaperAnchor(ctx, width, height, chapterId, time);
  else if (moduleId === '2.1') drawPipeline(ctx, width, height, state.mode);
  else if (moduleId === '3.1') drawLayers(ctx, width, height, state.mode, time);
  else if (moduleId === '4.1') drawSample(ctx, width, height, state.mode);
  else if (moduleId === '4.2') drawWindow(ctx, width, height, state.anchor);
  else if (moduleId === '4.3') drawArchitecture(ctx, width, height, state.mode);
  else if (moduleId === '5.1') drawRoutes(ctx, width, height, state.mode);
  else if (moduleId === '5.2') drawTaskGallery(ctx, width, height, state.mode);
  else if (moduleId === '6.1') drawExperimentResults(ctx, width, height, state.mode, time);
  else if (moduleId === '7.1') drawValueBoundary(ctx, width, height, state.mode, time);
  else if (moduleId === '7.2') drawEvaluation(ctx, width, height, state.mode);
  else if (moduleId === 'old' || moduleId === 'new') drawHeroFlow(ctx, width, height, moduleId, time);
  else drawProblem(ctx, width, height, state.mode);
};

const clear = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLORS.bg;
  roundRect(ctx, 0, 0, width, height, 12, true);
  ctx.strokeStyle = COLORS.border;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
};

const drawRoad = (ctx: CanvasRenderingContext2D, y: number, x1: number, x2: number, color = COLORS.road) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.strokeStyle = '#fff7ed';
  ctx.lineWidth = 2;
  for (let x = x1 + 10; x < x2 - 10; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 16, y);
    ctx.stroke();
  }
};

const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, color = COLORS.blue) => {
  ctx.fillStyle = color;
  roundRect(ctx, x - 18, y - 14, 36, 20, 6, true);
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x - 6, y - 22, 18, 10, 4, true);
  ctx.fillStyle = COLORS.text;
  ctx.beginPath();
  ctx.arc(x - 10, y + 8, 4, 0, Math.PI * 2);
  ctx.arc(x + 12, y + 8, 4, 0, Math.PI * 2);
  ctx.fill();
};

const label = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = COLORS.text) => {
  ctx.fillStyle = color;
  ctx.font = '800 14px "Microsoft YaHei", "Noto Sans CJK SC", "Segoe UI", sans-serif';
  ctx.fillText(text, x, y);
};

const smallLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = COLORS.text) => {
  ctx.fillStyle = color;
  ctx.font = '750 12px "Microsoft YaHei", "Noto Sans CJK SC", "Segoe UI", sans-serif';
  ctx.fillText(text, x, y);
};

const arrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = COLORS.blue) => {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(angle - 0.45), y2 - 8 * Math.sin(angle - 0.45));
  ctx.lineTo(x2 - 8 * Math.cos(angle + 0.45), y2 - 8 * Math.sin(angle + 0.45));
  ctx.closePath();
  ctx.fill();
};

const growingArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, progress: number, color = COLORS.blue) => {
  const p = clamp(progress, 0, 1);
  if (p <= 0.02) return;
  const endX = x1 + (x2 - x1) * p;
  const endY = y1 + (y2 - y1) * p;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  if (p < 0.96) return;
  ctx.fillStyle = color;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(angle - 0.45), y2 - 8 * Math.sin(angle - 0.45));
  ctx.lineTo(x2 - 8 * Math.cos(angle + 0.45), y2 - 8 * Math.sin(angle + 0.45));
  ctx.closePath();
  ctx.fill();
};

const dashedLink = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, dash: number[]) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
};

const box = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  fill: string,
  stroke: string,
  color = COLORS.text
) => {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 8, true);
  roundRect(ctx, x, y, w, h, 8, false);
  const lines = text.split('\n');
  const lineHeight = 15;
  const firstY = y + h / 2 - ((lines.length - 1) * lineHeight) / 2 + 4;
  lines.forEach((line, index) => smallLabel(ctx, line, x + 10, firstY + index * lineHeight, color));
};

const drawPaperAnchor = (ctx: CanvasRenderingContext2D, width: number, height: number, chapterId: string, time: number) => {
  if (chapterId === 'chap-1') {
    const cycle = (time % 5.2) / 5.2;
    const wave = (Math.sin(time * 2.4) + 1) / 2;
    smallLabel(ctx, '生活类比：听懂 -> 看清 -> 动手', 12, 23, COLORS.orange);

    // Instruction sheet: LLM understands the task text.
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = cycle < 0.34 ? COLORS.red : COLORS.green;
    ctx.lineWidth = 2;
    roundRect(ctx, 14, 42, 58, 48, 8, true);
    roundRect(ctx, 14, 42, 58, 48, 8, false);
    ctx.fillStyle = COLORS.text;
    ctx.fillRect(26, 54, 34, 3);
    ctx.fillRect(26, 64, 28, 3);
    ctx.fillRect(26, 74, 22, 3);
    smallLabel(ctx, 'LLM', 28, 105, cycle < 0.34 ? COLORS.red : COLORS.green);

    // Eye / visual panel: VLM sees the scene.
    ctx.strokeStyle = cycle < 0.34 ? COLORS.red : COLORS.blue;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 94, 42, 58, 48, 8, true);
    roundRect(ctx, 94, 42, 58, 48, 8, false);
    ctx.fillStyle = cycle < 0.34 ? COLORS.muted : COLORS.blue;
    ctx.beginPath();
    ctx.ellipse(123, 64, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(123, 64, 5, 0, Math.PI * 2);
    ctx.fill();
    smallLabel(ctx, 'VLM', 108, 105, cycle < 0.34 ? COLORS.red : COLORS.blue);

    // Hand / action head: VLA performs the action.
    ctx.strokeStyle = COLORS.red;
    ctx.fillStyle = '#fff1f2';
    roundRect(ctx, 176, 42, 54, 48, 8, true);
    roundRect(ctx, 176, 42, 54, 48, 8, false);
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(202, 53);
    ctx.lineTo(202, 73);
    ctx.lineTo(192 + wave * 8, 81);
    ctx.moveTo(202, 73);
    ctx.lineTo(214 - wave * 8, 81);
    ctx.stroke();
    smallLabel(ctx, 'Action', 184, 105, COLORS.red);

    growingArrow(ctx, 74, 66, 92, 66, 1, cycle < 0.34 ? COLORS.border : COLORS.green);
    growingArrow(ctx, 154, 66, 174, 66, 1, cycle < 0.34 ? COLORS.border : COLORS.blue);

    if (cycle < 0.34) {
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = '#fff1f2';
      roundRect(ctx, 11, 39, 145, 54, 10, true);
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 2;
      roundRect(ctx, 11, 39, 145, 54, 10, false);
      ctx.restore();
      smallLabel(ctx, '理解和视觉是黑盒', 36, 72, COLORS.red);
    }

    smallLabel(ctx, cycle < 0.34 ? '只练动手，前面不可控' : '理解、视觉、动作一起可控', 38, 124, cycle < 0.34 ? COLORS.red : COLORS.green);
    return;
  }

  if (chapterId === 'chap-2') {
    const cycle = (time % 5.4) / 5.4;
    const active = cycle < 0.34 ? 0 : cycle < 0.67 ? 1 : 2;
    smallLabel(ctx, '学徒成长：说明书 -> 图纸 -> 工位', 12, 24, COLORS.orange);
    const steps = [
      { name: 'LLM', life: '读说明书', x: 14, color: COLORS.green },
      { name: 'VLM', life: '看图纸', x: 92, color: COLORS.blue },
      { name: 'VLA', life: '上工位', x: 170, color: COLORS.red }
    ] as const;
    steps.forEach((step, index) => {
      const on = index <= active;
      ctx.fillStyle = on ? '#ffffff' : '#f8fafc';
      ctx.strokeStyle = on ? step.color : COLORS.border;
      ctx.lineWidth = 2;
      roundRect(ctx, step.x, 42, 60, 48, 8, true);
      roundRect(ctx, step.x, 42, 60, 48, 8, false);
      smallLabel(ctx, step.name, step.x + 17, 58, on ? step.color : COLORS.muted);
      ctx.fillStyle = on ? step.color : COLORS.border;
      if (index === 0) {
        ctx.fillRect(step.x + 20, 68, 24, 3);
        ctx.fillRect(step.x + 20, 76, 20, 3);
      } else if (index === 1) {
        ctx.strokeStyle = on ? step.color : COLORS.border;
        ctx.lineWidth = 2;
        roundRect(ctx, step.x + 20, 63, 24, 20, 3, false);
        ctx.beginPath();
        ctx.moveTo(step.x + 23, 78);
        ctx.lineTo(step.x + 31, 70);
        ctx.lineTo(step.x + 39, 76);
        ctx.stroke();
      } else {
        ctx.strokeStyle = on ? step.color : COLORS.border;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(step.x + 30, 63);
        ctx.lineTo(step.x + 30, 81);
        ctx.moveTo(step.x + 22, 72);
        ctx.lineTo(step.x + 38, 72);
        ctx.stroke();
      }
      smallLabel(ctx, step.life, step.x + 5, 106, on ? step.color : COLORS.muted);
    });
    growingArrow(ctx, 76, 66, 90, 66, clamp(cycle / 0.34, 0, 1), COLORS.green);
    growingArrow(ctx, 154, 66, 168, 66, clamp((cycle - 0.34) / 0.33, 0, 1), COLORS.blue);
    smallLabel(ctx, active === 0 ? '先学语言' : active === 1 ? '再对齐图文' : '最后学习动作', 76, 124, steps[active].color);
    return;
  }

  if (chapterId === 'chap-4') {
    const wave = Math.floor((time * 2) % 5);
    smallLabel(ctx, '当前锚点 -> 未来动作片段', 14, 24, COLORS.blue);
    const x0 = 24;
    const gap = 22;
    for (let i = 0; i < 9; i++) {
      const x = x0 + i * gap;
      const isNow = i === 4;
      const isPast = i < 4;
      const isFuture = i > 4;
      ctx.fillStyle = isNow ? COLORS.orange : isPast ? COLORS.blue : isFuture && i - 5 <= wave ? COLORS.green : '#dcefe6';
      roundRect(ctx, x, 54, 16, 30, 4, true);
      if (isNow) smallLabel(ctx, 'now', x - 2, 100, COLORS.orange);
    }
    smallLabel(ctx, '已观察', 28, 112, COLORS.blue);
    smallLabel(ctx, '未来动作监督', 116, 112, COLORS.green);
    return;
  }

  if (chapterId === 'chap-5') {
    const cycle = (time % 5.8) / 5.8;
    const scratchOn = cycle < 0.5;
    smallLabel(ctx, '两种入场：从零培养 / 强骨干接入', 12, 24, COLORS.orange);
    drawRoad(ctx, 62, 24, 146, scratchOn ? COLORS.green : COLORS.border);
    drawRoad(ctx, 98, 24, 146, scratchOn ? COLORS.border : COLORS.blue);
    drawCar(ctx, scratchOn ? 56 + cycle * 120 : 128, 54, COLORS.green);
    drawCar(ctx, scratchOn ? 58 : 42 + (cycle - 0.5) * 210, 90, COLORS.blue);
    smallLabel(ctx, 'LLM -> VLM -> VLA', 28, 46, scratchOn ? COLORS.green : COLORS.muted);
    smallLabel(ctx, 'Qwen3-VL -> VLA', 28, 122, scratchOn ? COLORS.muted : COLORS.blue);
    box(ctx, 168, 66, 62, 36, '共享\n训练栈', '#ffffff', scratchOn ? COLORS.green : COLORS.blue, scratchOn ? COLORS.green : COLORS.blue);
    return;
  }

  if (chapterId === 'chap-6') {
    const active = Math.floor(time * 1.1) % 3;
    const recipes = [
      { name: 'ST', color: COLORS.blue, score: 52 },
      { name: 'MT', color: COLORS.green, score: 78 },
      { name: 'FT', color: COLORS.orange, score: 84 }
    ] as const;
    smallLabel(ctx, '固定 backbone + 评测，只切换 recipe', 12, 24, COLORS.orange);
    recipes.forEach((recipe, index) => {
      const y = 40 + index * 24;
      const on = active === index;
      ctx.fillStyle = on ? recipe.color === COLORS.green ? '#ecfdf5' : recipe.color === COLORS.blue ? '#eff6ff' : '#fff7ed' : '#ffffff';
      ctx.strokeStyle = on ? recipe.color : COLORS.border;
      ctx.lineWidth = on ? 2.4 : 1.5;
      roundRect(ctx, 14, y, 44, 18, 6, true);
      roundRect(ctx, 14, y, 44, 18, 6, false);
      smallLabel(ctx, recipe.name, 26, y + 13, on ? recipe.color : COLORS.muted);
    });
    arrow(ctx, 62, 64, 78, 64, recipes[active].color);
    box(ctx, 82, 46, 74, 38, 'same\nbackbone', '#eff6ff', COLORS.blue, COLORS.blue);
    arrow(ctx, 160, 64, 174, 64, COLORS.green);
    box(ctx, 178, 46, 54, 38, 'LBM\nsim', '#ffffff', COLORS.red, COLORS.red);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 70, 100, 150, 14, 7, true);
    roundRect(ctx, 70, 100, 150, 14, 7, false);
    ctx.fillStyle = recipes[active].color;
    roundRect(ctx, 70, 100, recipes[active].score, 14, 7, true);
    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = recipes[active].color;
    const scanX = 70 + ((Math.sin(time * 2.4) + 1) / 2) * Math.max(8, recipes[active].score - 10);
    roundRect(ctx, scanX, 96, 10, 22, 5, true);
    ctx.restore();
    smallLabel(ctx, '同一 success-rate 口径比较趋势', 64, 128, recipes[active].color);
    return;
  }

  if (chapterId === 'chap-7') {
    const pulse = (Math.sin(time * 2.5) + 1) / 2;
    const flow = (time * 0.24) % 1;
    const cards = [
      { x: 12, color: COLORS.blue, fill: '#eff6ff', title: 'recipe', sub: '配方' },
      { x: 88, color: COLORS.green, fill: '#ecfdf5', title: 'backbone', sub: '骨干' },
      { x: 170, color: COLORS.orange, fill: '#fff7ed', title: 'head', sub: '动作头' }
    ] as const;
    smallLabel(ctx, '研究底座：可换变量，也要守住结论边界', 12, 24, COLORS.orange);
    cards.forEach((card, index) => {
      const on = Math.floor(time * 1.1) % cards.length === index;
      ctx.fillStyle = on ? card.fill : '#ffffff';
      ctx.strokeStyle = card.color;
      ctx.lineWidth = 2;
      roundRect(ctx, card.x, 42, 62, 34, 8, true);
      roundRect(ctx, card.x, 42, 62, 34, 8, false);
      smallLabel(ctx, card.title, card.x + 8, 57, card.color);
      smallLabel(ctx, card.sub, card.x + 22, 70, card.color);
    });
    ctx.fillStyle = '#ecfdf5';
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 2;
    roundRect(ctx, 18, 84, 208, 20, 10, true);
    roundRect(ctx, 18, 84, 208, 20, 10, false);
    smallLabel(ctx, '可复现 -> 可对照 -> 可比较', 50, 98, COLORS.green);
    const dotX = 30 + flow * 180;
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = COLORS.green;
    ctx.beginPath();
    ctx.arc(dotX, 94, 3.5 + pulse * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.moveTo(20, 108);
    ctx.lineTo(224, 108);
    ctx.stroke();
    ctx.restore();
    box(ctx, 22, 112, 82, 16, 'LBM sim', '#fff1f2', COLORS.red, COLORS.red);
    box(ctx, 122, 112, 100, 16, 'no hardware', '#fff1f2', COLORS.red, COLORS.red);
    return;
  }

  if (chapterId === 'chap-3') {
    const active = Math.floor(time * 1.2) % 4;
    const pulse = (Math.sin(time * 3) + 1) / 2;
    smallLabel(ctx, '实验控制台：把变量写清楚，再统一执行', 16, 24, COLORS.orange);
    const stages = [
      { title: '配方单', tag: 'recipe', note: '写变量', color: COLORS.blue, fill: '#eff6ff', x: 18 },
      { title: '插槽', tag: 'registry', note: '按名接入', color: COLORS.green, fill: '#ecfdf5', x: 108 },
      { title: '混合台', tag: 'mixer', note: '合数据', color: COLORS.orange, fill: '#fff7ed', x: 198 },
      { title: '执行台', tag: 'train', note: '跑循环', color: COLORS.red, fill: '#fff1f2', x: 288 }
    ] as const;
    stages.forEach((stage, index) => {
      const on = index === active;
      if (on) {
        ctx.save();
        ctx.globalAlpha = 0.14 + pulse * 0.1;
        ctx.fillStyle = stage.color;
        roundRect(ctx, stage.x - 6, 40, 70, 72, 12, true);
        ctx.restore();
      }
      ctx.fillStyle = on ? stage.fill : '#ffffff';
      ctx.strokeStyle = on ? stage.color : COLORS.border;
      ctx.lineWidth = on ? 2.5 : 1.8;
      roundRect(ctx, stage.x, 46, 58, 56, 8, true);
      roundRect(ctx, stage.x, 46, 58, 56, 8, false);
      smallLabel(ctx, stage.title, stage.x + 10, 64, on ? stage.color : COLORS.text);
      smallLabel(ctx, stage.tag, stage.x + 8, 84, on ? stage.color : COLORS.muted);
      if (index < stages.length - 1) {
        growingArrow(ctx, stage.x + 60, 74, stage.x + 88, 74, on ? 1 : 0.45, on ? stage.color : COLORS.border);
      }
    });
    const current = stages[active];
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = current.color;
    ctx.lineWidth = 2;
    roundRect(ctx, 72, 118, 204, 20, 10, true);
    roundRect(ctx, 72, 118, 204, 20, 10, false);
    smallLabel(ctx, current.note, 146, 132, current.color);
    return;
  }

  const active = Math.floor(time * 1.4) % 4;
  smallLabel(ctx, '实验台：配方单 -> 插槽 -> 配料台 -> 执行', 12, 24, COLORS.orange);
  const columns = [
    { title: '配方单', label: 'recipe', sub: '写变量', color: COLORS.orange, fill: '#fff7ed', x: 10, w: 48 },
    { title: '插槽面板', label: 'registry', sub: '接组件', color: COLORS.green, fill: '#ecfdf5', x: 64, w: 48 },
    { title: '配料台', label: 'data', sub: '混数据', color: COLORS.blue, fill: '#eff6ff', x: 118, w: 48 },
    { title: '执行', label: 'train', sub: '跑循环', color: COLORS.red, fill: '#fff1f2', x: 172, w: 58 }
  ] as const;
  columns.forEach((col, index) => {
    const on = active === index;
    ctx.fillStyle = on ? col.fill : '#ffffff';
    ctx.strokeStyle = on ? col.color : COLORS.border;
    ctx.lineWidth = 2;
    roundRect(ctx, col.x, 42, col.w, 48, 8, true);
    roundRect(ctx, col.x, 42, col.w, 48, 8, false);
    smallLabel(ctx, col.label, col.x + 6, 58, on ? col.color : COLORS.muted);
    smallLabel(ctx, col.sub, col.x + 6, 76, on ? col.color : COLORS.muted);
    if (index < columns.length - 1) {
      arrow(ctx, col.x + col.w + 1, 66, col.x + col.w + 8, 66, on ? col.color : COLORS.border);
    }
  });
  ctx.save();
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = columns[active].color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, 114);
  ctx.lineTo(228, 114);
  ctx.stroke();
  ctx.restore();
  smallLabel(ctx, active === 0 ? '变量写进 recipe' : active === 1 ? '名字装配组件' : active === 2 ? '三类数据进入 mixer' : '共享训练循环执行', 44, 124, columns[active].color);
};

const drawHeroFlow = (ctx: CanvasRenderingContext2D, width: number, height: number, moduleId: string, time: number) => {
  const pulse = (Math.sin(time * 2.2) + 1) / 2;
  const flow = (time * 0.38) % 1;
  const topY = 58;
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = moduleId === 'old' ? COLORS.red : COLORS.green;
  ctx.lineWidth = 1;
  for (let x = 24; x < width - 20; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 52);
    ctx.lineTo(x, 214);
    ctx.stroke();
  }
  for (let y = 54; y < 214; y += 28) {
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(width - 24, y);
    ctx.stroke();
  }
  ctx.restore();

  if (moduleId === 'old') {
    label(ctx, '传统开源流程：三座孤岛，只照亮末端', 34, 36, COLORS.red);
    const islands = [
      { name: 'LLM', tool: 'Megatron', x: 42, color: COLORS.muted },
      { name: 'VLM', tool: 'Prismatic', x: 212, color: COLORS.muted },
      { name: 'Action', tool: 'OpenVLA', x: 378, color: COLORS.red }
    ] as const;
    islands.forEach((item, index) => {
      const y = 70;
      const active = index === 2;
      if (active) {
        ctx.save();
        ctx.globalAlpha = 0.18 + pulse * 0.18;
        ctx.fillStyle = COLORS.red;
        ctx.beginPath();
        ctx.ellipse(item.x + 52, y + 36, 66 + pulse * 12, 48 + pulse * 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = active ? '#fff1f2' : '#ffffff';
      ctx.strokeStyle = active ? COLORS.red : COLORS.border;
      ctx.lineWidth = active ? 3 : 2;
      roundRect(ctx, item.x, y, 104, 72, 10, true);
      roundRect(ctx, item.x, y, 104, 72, 10, false);
      label(ctx, item.name, item.x + 18, y + 30, active ? COLORS.red : COLORS.muted);
      smallLabel(ctx, item.tool, item.x + 18, y + 54, active ? COLORS.red : COLORS.muted);
      if (!active) {
        ctx.strokeStyle = COLORS.muted;
        ctx.lineWidth = 2;
        roundRect(ctx, item.x + 72, y + 16, 18, 16, 4, false);
        ctx.beginPath();
        ctx.arc(item.x + 81, y + 16, 6, Math.PI, 0);
        ctx.stroke();
      }
    });
    dashedLink(ctx, 150, 106, 208, 106, COLORS.border, [8, 8]);
    dashedLink(ctx, 320, 106, 374, 106, COLORS.red, [8, 8]);
    const dotX = 320 + 54 * flow;
    ctx.fillStyle = COLORS.red;
    ctx.beginPath();
    ctx.arc(dotX, 106, 3.5 + pulse * 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 2;
    const scanY = 78 + 52 * pulse;
    ctx.beginPath();
    ctx.moveTo(388, scanY);
    ctx.lineTo(472, scanY);
    ctx.stroke();
    ctx.restore();
    box(ctx, 58, 164, 120, 34, 'recipe hidden', '#ffffff', COLORS.border, COLORS.muted);
    box(ctx, 220, 164, 120, 34, 'format gap', '#ffffff', COLORS.border, COLORS.muted);
    box(ctx, 382, 164, 120, 34, 'action only', '#fff1f2', COLORS.red, COLORS.red);
    label(ctx, '上游黑盒，跨阶段变量难以对照', 122, 224, COLORS.red);
    return;
  }

  label(ctx, 'VLA Foundry：两入口，共享训练栈', 34, 36, COLORS.green);
  box(ctx, 30, 62, 70, 36, 'LLM', '#ecfdf5', COLORS.green, COLORS.green);
  box(ctx, 124, 62, 70, 36, 'VLM', '#eff6ff', COLORS.blue, COLORS.blue);
  box(ctx, 30, 126, 92, 36, 'Qwen3-VL', '#eff6ff', COLORS.blue, COLORS.blue);
  ctx.save();
  ctx.globalAlpha = 0.16 + pulse * 0.16;
  ctx.fillStyle = COLORS.green;
  ctx.beginPath();
  ctx.ellipse(266, 111, 54 + pulse * 10, 40 + pulse * 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  box(ctx, 230, 90, 70, 42, 'VLA', '#fff1f2', COLORS.red, COLORS.red);
  growingArrow(ctx, 102, 80, 122, 80, clamp(flow * 2.6, 0, 1), COLORS.green);
  growingArrow(ctx, 196, 80, 230, 106, clamp(flow * 2.6 - 0.35, 0, 1), COLORS.green);
  growingArrow(ctx, 124, 144, 230, 118, clamp(flow * 2.6 - 0.65, 0, 1), COLORS.blue);

  const stackX = 334;
  const stack = [
    ['recipe', COLORS.blue],
    ['registry', COLORS.green],
    ['data mixer', COLORS.orange],
    ['train loop', COLORS.red]
  ] as const;
  stack.forEach(([name, color], index) => {
    const y = 54 + index * 32;
    const active = Math.floor(time * 1.5) % 4 === index;
    if (active) {
      ctx.save();
      ctx.globalAlpha = 0.12 + pulse * 0.12;
      ctx.fillStyle = color;
      roundRect(ctx, stackX - 8, y - 5, 162, 34, 12, true);
      ctx.restore();
    }
    box(ctx, stackX, y, 146, 24, name, active ? '#ffffff' : '#f8fafc', active ? color : COLORS.border, active ? color : COLORS.text);
  });
  arrow(ctx, 302, 111, stackX - 8, 111, COLORS.green);
  const scanY = 61 + (Math.floor(time * 1.5) % 4) * 32 + 12;
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(stackX + 8, scanY);
  ctx.lineTo(stackX + 132, scanY);
  ctx.stroke();
  ctx.restore();
  const knobs = [
    ['backbone', 78],
    ['data recipe', 206],
    ['stage', 352]
  ] as const;
  const activeKnob = Math.floor(time * 1.8) % knobs.length;
  knobs.forEach(([name, x], index) => {
    const active = index === activeKnob;
    box(ctx, x, 188, index === 1 ? 116 : 92, 22, name, active ? '#ecfdf5' : '#ffffff', active ? COLORS.green : COLORS.border, active ? COLORS.green : COLORS.text);
  });
};

const drawProblem = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode) => {
  const unified = mode === 'unified';
  label(ctx, unified ? '统一训练栈：整条 recipe 都可实验' : '只调动作头：上游原因被遮住', 30, 34, unified ? COLORS.green : COLORS.red);
  box(ctx, 38, 70, 96, 48, 'LLM\npretrain', unified ? '#ecfdf5' : '#ffffff', unified ? COLORS.green : COLORS.border, unified ? COLORS.green : COLORS.muted);
  box(ctx, 164, 70, 96, 48, 'VLM\npretrain', unified ? '#eff6ff' : '#ffffff', unified ? COLORS.blue : COLORS.border, unified ? COLORS.blue : COLORS.muted);
  box(ctx, 290, 70, 96, 48, 'Robot\ndata', unified ? '#fff7ed' : '#ffffff', unified ? COLORS.orange : COLORS.border, unified ? COLORS.orange : COLORS.muted);
  box(ctx, 416, 70, 96, 48, 'Action\nhead', '#fff1f2', COLORS.red, COLORS.red);
  [136, 262, 388].forEach((x) => arrow(ctx, x, 94, x + 26, 94, unified ? COLORS.green : COLORS.border));
  const checks = [
    ['换 backbone', unified],
    ['改数据配方', unified],
    ['控训练阶段', unified],
    ['调动作头', true]
  ] as const;
  checks.forEach(([name, enabled], index) => {
    const x = 70 + index * 118;
    ctx.fillStyle = enabled ? COLORS.green : '#ffffff';
    ctx.strokeStyle = enabled ? COLORS.green : COLORS.border;
    roundRect(ctx, x, 156, 18, 18, 4, true);
    roundRect(ctx, x, 156, 18, 18, 4, false);
    smallLabel(ctx, enabled ? 'on' : 'off', x - 2, 190, enabled ? COLORS.green : COLORS.muted);
    smallLabel(ctx, name, x + 24, 170, enabled ? COLORS.text : COLORS.muted);
  });
  smallLabel(ctx, unified ? '目标：把跨阶段问题变成可复现实验' : '痛点：拼接痛苦，研究变量不可控', 152, 222, unified ? COLORS.green : COLORS.red);
};

const drawPipeline = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode) => {
  const active = (key: Mode) => mode === key;
  smallLabel(ctx, '三段训练路线：语言 -> 图文 -> 动作', 28, 28, COLORS.blue);
  const stageCard = (x: number, y: number, w: number, title: string, sub: string, color: string, on: boolean) => {
    if (on) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = color;
      roundRect(ctx, x - 8, y - 8, w + 16, 68, 16, true);
      ctx.restore();
    }
    ctx.fillStyle = on ? '#ffffff' : '#f8fafc';
    ctx.strokeStyle = on ? color : COLORS.border;
    ctx.lineWidth = on ? 3 : 2;
    roundRect(ctx, x, y, w, 54, 12, true);
    roundRect(ctx, x, y, w, 54, 12, false);
    ctx.fillStyle = color;
    roundRect(ctx, x + 12, y + 12, 10, 30, 5, true);
    label(ctx, title, x + 32, y + 24, on ? color : COLORS.text);
    smallLabel(ctx, sub, x + 32, y + 42, on ? color : COLORS.muted);
  };
  stageCard(38, 58, 104, 'LLM', 'text pretrain', COLORS.green, active('llm'));
  arrow(ctx, 146, 84, 174, 84, COLORS.green);
  stageCard(178, 58, 104, 'VLM', 'image-text', COLORS.blue, active('vlm'));
  arrow(ctx, 286, 84, 314, 84, COLORS.green);
  stageCard(318, 58, 104, 'VLA', 'robot action', COLORS.red, active('vla'));
  stageCard(64, 150, 126, 'Qwen3-VL', 'pretrained', COLORS.blue, active('vlm'));
  arrow(ctx, 194, 177, 318, 177, active('vla') ? COLORS.blue : COLORS.border);
  stageCard(318, 150, 148, 'Qwen3VLA', '2.1B-MT route', COLORS.red, active('vla'));
  smallLabel(ctx, active('llm') ? 'text completion data' : active('vlm') ? 'image-caption data' : 'robot trajectories + action chunks', 168, 224, active('vla') ? COLORS.red : active('vlm') ? COLORS.blue : COLORS.green);
};

const drawLayers = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode, time: number) => {
  const active = (key: Mode) => mode === key;
  const pulse = (Math.sin(time * 3.2) + 1) / 2;
  const flow = (time * 0.8) % 1;
  smallLabel(ctx, 'Section 3.2 Framework：recipe -> registry -> data mixer -> train loop', 34, 28, COLORS.blue);
  const stageWidth = width > 600 ? 142 : 112;
  const stageGap = width > 600 ? 22 : 20;
  const startX = (width - stageWidth * 4 - stageGap * 3) / 2;
  const stages: Array<{
    key: Mode;
    title: string;
    tag: string;
    lines: string[];
    x: number;
    w: number;
    color: string;
    fill: string;
  }> = [
    { key: 'config', title: 'YAML 配置', tag: 'recipe', lines: ['backbone', 'data mix', 'stage'], x: startX, w: stageWidth, color: COLORS.blue, fill: '#eff6ff' },
    { key: 'registry', title: '注册表', tag: 'registry', lines: ['model', 'dataset', 'handler'], x: startX + (stageWidth + stageGap), w: stageWidth, color: COLORS.green, fill: '#ecfdf5' },
    { key: 'data', title: '数据混合', tag: 'data mixer', lines: ['text', 'image-text', 'robotics'], x: startX + (stageWidth + stageGap) * 2, w: stageWidth, color: COLORS.orange, fill: '#fff7ed' },
    { key: 'train', title: '训练循环', tag: 'train loop', lines: ['batch', 'loss', 'ckpt'], x: startX + (stageWidth + stageGap) * 3, w: stageWidth, color: COLORS.red, fill: '#fff1f2' }
  ];
  stages.forEach((stage, index) => {
    const on = active(stage.key);
    if (on) {
      ctx.save();
      ctx.globalAlpha = 0.12 + pulse * 0.1;
      ctx.fillStyle = stage.color;
      roundRect(ctx, stage.x - 8, 52, stage.w + 16, 138, 14, true);
      ctx.restore();
    }
    ctx.fillStyle = on ? stage.fill : '#ffffff';
    ctx.strokeStyle = on ? stage.color : COLORS.border;
    ctx.lineWidth = on ? 3 : 2;
    roundRect(ctx, stage.x, 58, stage.w, 118, 10, true);
    roundRect(ctx, stage.x, 58, stage.w, 118, 10, false);
    smallLabel(ctx, stage.title, stage.x + 14, 80, on ? stage.color : COLORS.text);
    label(ctx, stage.tag, stage.x + 14, 108, on ? stage.color : COLORS.text);
    ctx.strokeStyle = on ? stage.color : COLORS.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(stage.x + 14, 122);
    ctx.lineTo(stage.x + stage.w - 14, 122);
    ctx.stroke();
    if (stage.key === 'config') {
      stage.lines.forEach((line, lineIndex) => {
        const y = 140 + lineIndex * 18;
        ctx.fillStyle = on ? '#ffffff' : '#f8fafc';
        ctx.strokeStyle = on ? stage.color : COLORS.border;
        roundRect(ctx, stage.x + 14, y - 10, stage.w - 28, 14, 4, true);
        roundRect(ctx, stage.x + 14, y - 10, stage.w - 28, 14, 4, false);
        smallLabel(ctx, line, stage.x + 22, y + 1, on ? stage.color : COLORS.muted);
      });
    } else if (stage.key === 'registry') {
      stage.lines.forEach((line, lineIndex) => {
        const y = 137 + lineIndex * 18;
        ctx.fillStyle = on ? COLORS.green : COLORS.border;
        roundRect(ctx, stage.x + 18, y - 7, 9, 9, 2, true);
        smallLabel(ctx, line, stage.x + 36, y + 1, on ? COLORS.green : COLORS.muted);
      });
    } else if (stage.key === 'data') {
      const streamColors = [COLORS.green, COLORS.blue, COLORS.orange];
      stage.lines.forEach((line, lineIndex) => {
        const y = 136 + lineIndex * 17;
        ctx.strokeStyle = on ? streamColors[lineIndex] : COLORS.border;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(stage.x + 18, y);
        ctx.lineTo(stage.x + 42 + lineIndex * 12, y);
        ctx.stroke();
        smallLabel(ctx, line, stage.x + 56, y + 4, on ? streamColors[lineIndex] : COLORS.muted);
      });
    } else {
      stage.lines.forEach((line, lineIndex) => {
        const y = 136 + lineIndex * 18;
        ctx.fillStyle = on ? COLORS.red : COLORS.border;
        roundRect(ctx, stage.x + 18, y - 8, 26 + lineIndex * 8, 9, 4, true);
        smallLabel(ctx, line, stage.x + 58, y + 1, on ? COLORS.red : COLORS.muted);
      });
    }
    if (index < stages.length - 1) {
      const nextX = stages[index + 1].x - 10;
      arrow(ctx, stage.x + stage.w + 4, 118, nextX, 118, on ? stage.color : COLORS.border);
      const dotX = stage.x + stage.w + 8 + (nextX - stage.x - stage.w - 12) * flow;
      ctx.fillStyle = on ? stage.color : COLORS.border;
      ctx.beginPath();
      ctx.arc(dotX, 118, on ? 3.2 : 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const current = stages.find((stage) => active(stage.key)) ?? stages[0];
  const feedback = active('config')
    ? '显式配置：实验变量不藏在脚本里'
    : active('registry')
      ? '按名装配：模型、数据、batch handler 可替换'
      : active('data')
        ? '统一数据：文本、图文、机器人轨迹进入同一加载体系'
        : '共享执行：同一训练循环处理分布式、精度和 checkpoint';
  const feedbackW = Math.min(470, width - 96);
  const feedbackX = (width - feedbackW) / 2;
  const feedbackY = height > 250 ? 224 : 204;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = current.color;
  ctx.lineWidth = 2;
  roundRect(ctx, feedbackX, feedbackY, feedbackW, 24, 12, true);
  roundRect(ctx, feedbackX, feedbackY, feedbackW, 24, 12, false);
  smallLabel(ctx, feedback, feedbackX + 20, feedbackY + 17, current.color);
};

const drawTaskGallery = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode) => {
  if (mode === 'protocol') {
    label(ctx, 'Figure 6: seen simulation tasks', 34, 34, COLORS.blue);
    const tasks = [
      ['pick', 'place', COLORS.green],
      ['flip', 'cup', COLORS.orange],
      ['push', 'coaster', COLORS.blue],
      ['two-arm', 'coordination', COLORS.red]
    ] as const;
    tasks.forEach(([name, detail, color], index) => {
      const x = 42 + index * 124;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      roundRect(ctx, x, 72, 92, 74, 10, true);
      roundRect(ctx, x, 72, 92, 74, 10, false);
      label(ctx, name, x + 16, 104, color);
      smallLabel(ctx, detail, x + 14, 128, color);
    });
    smallLabel(ctx, '16 seen tasks cover different manipulation qualities.', 126, 208, COLORS.muted);
    return;
  }
  if (mode === 'metric') {
    label(ctx, 'Figure 6 is a rendered rollout overview', 34, 34, COLORS.orange);
    box(ctx, 60, 72, 116, 70, 'rollout\nmidpoint\nsnapshot', '#fff7ed', COLORS.orange, COLORS.orange);
    arrow(ctx, 184, 108, 238, 108, COLORS.orange);
    box(ctx, 246, 72, 116, 70, 'Meshcat\nscene', '#ffffff', COLORS.border, COLORS.text);
    arrow(ctx, 370, 108, 424, 108, COLORS.orange);
    box(ctx, 432, 72, 86, 70, 'Blender\nCycles', '#fff7ed', COLORS.orange, COLORS.orange);
    smallLabel(ctx, 'The paper says these images are re-lit and re-rendered for visual clarity.', 72, 208, COLORS.muted);
    return;
  }
  label(ctx, 'Do not confuse display images with model input', 34, 34, COLORS.red);
  box(ctx, 58, 76, 132, 76, 'Figure 6\npretty task\nrender', '#fff7ed', COLORS.orange, COLORS.orange);
  arrow(ctx, 204, 114, 258, 114, COLORS.red);
  box(ctx, 272, 76, 132, 76, 'Figure 16\nraw sensor\nmeasurements', '#eff6ff', COLORS.blue, COLORS.blue);
  box(ctx, 430, 76, 80, 76, 'model\ninput', '#fff1f2', COLORS.red, COLORS.red);
  smallLabel(ctx, 'Speech point: Figure 6 explains evaluation tasks; Figure 16 explains inference input.', 58, 210, COLORS.muted);
};

const drawSample = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode) => {
  const active = (key: Mode) => mode === key;
  smallLabel(ctx, 'robotics sample = observations + language + action supervision', 34, 28, COLORS.blue);
  for (let cam = 0; cam < 4; cam++) {
    const x = 34 + cam * 42;
    ctx.fillStyle = active('images') ? '#eff6ff' : '#ffffff';
    ctx.strokeStyle = active('images') ? COLORS.blue : COLORS.border;
    roundRect(ctx, x, 54, 34, 26, 4, true);
    roundRect(ctx, x, 54, 34, 26, 4, false);
    smallLabel(ctx, 'cam' + (cam + 1), x + 3, 100, active('images') ? COLORS.blue : COLORS.muted);
  }
  if (active('images')) {
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = COLORS.blue;
    roundRect(ctx, 24, 44, 182, 72, 14, true);
    ctx.restore();
  }
  box(ctx, 232, 48, 138, 48, 'task text\npick red block', active('text') ? '#ecfdf5' : '#ffffff', active('text') ? COLORS.green : COLORS.border, active('text') ? COLORS.green : COLORS.text);
  box(ctx, 408, 44, 112, 58, 'proprio\npast + now\nfuture locked', active('prop') ? '#fff7ed' : '#ffffff', active('prop') ? COLORS.orange : COLORS.border, active('prop') ? COLORS.orange : COLORS.text);
  const x0 = 58;
  for (let i = 0; i < 10; i++) {
    const future = i > 4;
    const x = x0 + i * 42;
    ctx.fillStyle = future ? (active('actions') ? COLORS.green : '#ecfdf5') : (active('prop') ? COLORS.orange : '#ffffff');
    ctx.strokeStyle = future ? COLORS.green : COLORS.border;
    roundRect(ctx, x, 150, 28, 30, 5, true);
    roundRect(ctx, x, 150, 28, 30, 5, false);
    smallLabel(ctx, future ? 'a' : 'o', x + 10, 170, future ? '#ffffff' : COLORS.muted);
  }
  smallLabel(ctx, 'observed context', 72, 214, COLORS.orange);
  smallLabel(ctx, 'future action chunk used as supervision', 278, 214, COLORS.green);
};

const drawWindow = (ctx: CanvasRenderingContext2D, width: number, height: number, anchor: number) => {
  const startX = 80;
  const gap = 50;
  for (let i = 0; i < 9; i++) {
    const x = startX + i * gap;
    const isAnchor = i === anchor;
    const isPast = i < anchor;
    ctx.fillStyle = isAnchor ? COLORS.orange : isPast ? COLORS.blue : COLORS.green;
    roundRect(ctx, x - 18, 94, 36, 36, 8, true);
    label(ctx, String(i - anchor), x - 8, 118, '#ffffff');
  }
  label(ctx, 'observed past', 80, 68, COLORS.blue);
  label(ctx, 'now', startX + anchor * gap - 12, 68, COLORS.orange);
  label(ctx, 'future supervision', 350, 68, COLORS.green);
  smallLabel(ctx, 'future proprioception is unavailable at inference', 176, 180, COLORS.red);
};

const drawActionMode = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode) => {
  drawRoad(ctx, 148, 80, 480);
  drawCar(ctx, 230, 140, COLORS.blue);
  const targetX = mode === 'absolute' ? 430 : 330;
  ctx.strokeStyle = mode === 'relative' ? COLORS.green : COLORS.orange;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(230, 140);
  ctx.lineTo(targetX, 92);
  ctx.stroke();
  label(ctx, mode === 'relative' ? '相对当前车位的变化' : '世界坐标中的目标位姿', 150, 50, mode === 'relative' ? COLORS.green : COLORS.orange);
};

const drawArchitecture = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode) => {
  const active = (key: Mode) => mode === key;
  smallLabel(ctx, '4 cameras x 2 timesteps = 8 images', 28, 28, active('vision') ? COLORS.purple : COLORS.text);
  for (let i = 0; i < 8; i++) {
    const x = 32 + (i % 4) * 32;
    const y = 50 + Math.floor(i / 4) * 32;
    ctx.fillStyle = active('vision') ? '#ede9fe' : '#ffffff';
    ctx.strokeStyle = active('vision') ? COLORS.purple : COLORS.border;
    roundRect(ctx, x, y, 26, 26, 5, true);
    roundRect(ctx, x, y, 26, 26, 5, false);
  }
  arrow(ctx, 166, 82, 190, 82, active('vision') ? COLORS.purple : COLORS.blue);
  box(ctx, 194, 50, 104, 58, 'ViT\nencoder', active('vision') ? '#ede9fe' : '#ffffff', active('vision') ? COLORS.purple : COLORS.border, active('vision') ? COLORS.purple : COLORS.text);
  arrow(ctx, 302, 80, 326, 80, active('vision') ? COLORS.purple : COLORS.blue);
  box(ctx, 330, 50, 132, 58, 'pixel\nshuffle pool', active('vision') ? '#ede9fe' : '#ffffff', active('vision') ? COLORS.purple : COLORS.border, active('vision') ? COLORS.purple : COLORS.text);

  box(ctx, 34, 152, 134, 40, 'task text', active('vlm') ? '#eff6ff' : '#ffffff', active('vlm') ? COLORS.blue : COLORS.border, active('vlm') ? COLORS.blue : COLORS.text);
  box(ctx, 204, 152, 134, 40, 'observation token', active('obs') ? '#fff7ed' : '#ffffff', active('obs') ? COLORS.orange : COLORS.border, active('obs') ? COLORS.orange : COLORS.text);
  arrow(ctx, 466, 80, 486, 92, active('vision') ? COLORS.purple : COLORS.blue);
  arrow(ctx, 170, 172, 486, 122, active('vlm') ? COLORS.blue : COLORS.border);
  arrow(ctx, 340, 172, 486, 148, active('obs') ? COLORS.orange : COLORS.border);
  box(ctx, 490, 82, 100, 88, 'LLM /\nVLM\nlayers', active('vlm') || active('obs') ? '#eff6ff' : '#ffffff', active('vlm') || active('obs') ? COLORS.blue : COLORS.border, active('vlm') || active('obs') ? COLORS.blue : COLORS.text);
  arrow(ctx, 594, 126, 612, 126, active('head') ? COLORS.red : COLORS.blue);
  box(ctx, 616, 88, 58, 78, 'Flow\naction\nhead', active('head') ? '#fff1f2' : '#ffffff', active('head') ? COLORS.red : COLORS.border, active('head') ? COLORS.red : COLORS.text);

  box(ctx, 430, 210, 140, 38, 'noisy action sequence', active('head') ? '#fff1f2' : '#ffffff', active('head') ? COLORS.red : COLORS.border, active('head') ? COLORS.red : COLORS.text);
  arrow(ctx, 572, 228, 622, 164, active('head') ? COLORS.red : COLORS.border);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = COLORS.red;
  ctx.lineWidth = 2;
  roundRect(ctx, 164, 254, 350, 20, 10, true);
  roundRect(ctx, 164, 254, 350, 20, 10, false);
  smallLabel(ctx, 'output: denoising direction -> future action chunk', 196, 268, COLORS.red);
};

const drawRoutes = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode) => {
  const active = mode === 'scratch' ? 0 : 1;
  const rows = [
    {
      title1: 'Foundry-VLA',
      title2: '1.7B',
      note: '从零训练',
      hint: '全链路可控',
      color: COLORS.green,
      parts: [
        ['Embedding', 0.20],
        ['LLM', 1.23],
        ['Vision', 0.09],
        ['Action head', 0.33]
      ],
      total: '1.85B',
      non: '1.65B'
    },
    {
      title1: 'Foundry-Qwen3VLA',
      title2: '2.1B-MT',
      note: '接入预训练骨干',
      hint: '强 backbone',
      color: COLORS.blue,
      parts: [
        ['Embedding', 0.62],
        ['LLM', 1.41],
        ['Vision', 0.41],
        ['Action head', 0.31]
      ],
      total: '2.75B',
      non: '2.13B'
    }
  ] as const;
  const palette = [COLORS.orange, COLORS.green, COLORS.blue, COLORS.red];
  const activeRow = rows[active];
  smallLabel(ctx, 'Table 3: 交互式参数分解', 30, 26, COLORS.orange);
  rows.forEach((row, index) => {
    const x = 30 + index * 176;
    const on = index === active;
    ctx.save();
    ctx.globalAlpha = on ? 1 : 0.62;
    ctx.fillStyle = on ? row.color === COLORS.green ? '#ecfdf5' : '#eff6ff' : '#ffffff';
    ctx.strokeStyle = on ? row.color : COLORS.border;
    ctx.lineWidth = on ? 2.8 : 1.8;
    roundRect(ctx, x, 46, 154, 66, 12, true);
    roundRect(ctx, x, 46, 154, 66, 12, false);
    smallLabel(ctx, row.note, x + 16, 68, on ? row.color : COLORS.muted);
    label(ctx, row.title1, x + 16, 90, on ? row.color : COLORS.text);
    smallLabel(ctx, row.title2 + ' / ' + row.hint, x + 16, 104, on ? row.color : COLORS.muted);
    ctx.restore();
  });

  const panelX = 382;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = activeRow.color;
  ctx.lineWidth = 2.5;
  roundRect(ctx, panelX, 46, 148, 66, 12, true);
  roundRect(ctx, panelX, 46, 148, 66, 12, false);
  smallLabel(ctx, '论文报告参数', panelX + 18, 68, activeRow.color);
  label(ctx, activeRow.total, panelX + 18, 92, activeRow.color);
  smallLabel(ctx, 'non-embed ' + activeRow.non, panelX + 18, 106, COLORS.muted);

  const stackX = 46;
  const stackY = 144;
  const stackW = 468;
  const totalValue = activeRow.parts.reduce((sum, item) => sum + item[1], 0);
  let cursor = stackX;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = COLORS.border;
  roundRect(ctx, stackX - 10, stackY - 22, stackW + 20, 58, 14, true);
  roundRect(ctx, stackX - 10, stackY - 22, stackW + 20, 58, 14, false);
  activeRow.parts.forEach(([part, value], index) => {
    const w = Math.max(34, (value / totalValue) * stackW);
    ctx.fillStyle = palette[index];
    roundRect(ctx, cursor, stackY, w - 4, 18, 9, true);
    smallLabel(ctx, value.toFixed(2) + 'B', cursor + 8, stackY - 6, palette[index]);
    cursor += w;
  });
  activeRow.parts.forEach(([part], index) => {
    const x = 64 + index * 118;
    ctx.fillStyle = palette[index];
    roundRect(ctx, x, stackY + 30, 10, 10, 3, true);
    smallLabel(ctx, part, x + 16, stackY + 40, COLORS.muted);
  });
  const scanX = stackX + ((Math.sin(Date.now() / 460) + 1) / 2) * (stackW - 16);
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = activeRow.color;
  roundRect(ctx, scanX, stackY - 8, 16, 34, 8, true);
  ctx.restore();
  const fb = active === 0 ? '从零路线：证明 LLM -> VLM -> VLA 全流程可控。' : 'Qwen3 路线：把强 VLM backbone 接入同一 VLA 训练栈。';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = activeRow.color;
  roundRect(ctx, 30, 214, 500, 18, 9, true);
  roundRect(ctx, 30, 214, 500, 18, 9, false);
  smallLabel(ctx, fb, 42, 227, activeRow.color);
};

const drawExperimentResults = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode, time: number) => {
  const pulse = (Math.sin(time * 2.6) + 1) / 2;
  if (mode === 'results') {
    label(ctx, 'Baseline comparison: aggregate success rate', 30, 34, COLORS.green);
    const bars = [
      { name: 'prior LBM MT', value: 63, color: COLORS.border, note: 'baseline' },
      { name: 'Foundry-VLA\n1.7B-MT-sim', value: 64, color: COLORS.blue, note: 'stat. on par' },
      { name: 'Qwen3VLA\n2.1B-MT', value: 86, color: COLORS.green, note: '+23 pp' }
    ] as const;
    bars.forEach((bar, index) => {
      const x = 66 + index * 152;
      const h = bar.value * 0.86;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = bar.color;
      ctx.lineWidth = 2;
      roundRect(ctx, x, 68, 116, 128, 12, true);
      roundRect(ctx, x, 68, 116, 128, 12, false);
      ctx.fillStyle = bar.color === COLORS.border ? '#cfd6e6' : bar.color;
      roundRect(ctx, x + 36, 160 - h, 44, h, 10, true);
      label(ctx, String(bar.value) + '%', x + 34, 52, bar.color === COLORS.border ? COLORS.muted : bar.color);
      smallLabel(ctx, bar.name.split('\n')[0], x + 14, 208, bar.color === COLORS.border ? COLORS.muted : bar.color);
      smallLabel(ctx, bar.name.split('\n')[1] ?? '', x + 14, 224, bar.color === COLORS.border ? COLORS.muted : bar.color);
      smallLabel(ctx, bar.note, x + 26, 184, bar.color === COLORS.border ? COLORS.muted : bar.color);
    });
    ctx.save();
    ctx.globalAlpha = 0.16 + pulse * 0.08;
    ctx.fillStyle = COLORS.green;
    roundRect(ctx, 88 + ((Math.sin(time * 2.1) + 1) / 2) * 340, 74, 12, 108, 6, true);
    ctx.restore();
    return;
  }

  if (mode === 'metric') {
    label(ctx, 'ST / MT / FT: Table 4 训练预算 + Figure 7 成功率趋势', 30, 34, COLORS.blue);
    const stages = [
      { name: 'ST', budget: '2.0M / task', detail: 'batch 512', x: 38, color: COLORS.blue },
      { name: 'MT', budget: '100M total', detail: 'batch 1,024', x: 208, color: COLORS.green },
      { name: 'FT', budget: '1.024M / task', detail: 'from MT, 1/10 LR', x: 378, color: COLORS.orange }
    ] as const;
    stages.forEach((stage, index) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = stage.color;
      ctx.lineWidth = 2.2;
      roundRect(ctx, stage.x, 58, 144, 72, 10, true);
      roundRect(ctx, stage.x, 58, 144, 72, 10, false);
      ctx.fillStyle = stage.color;
      roundRect(ctx, stage.x + 12, 72, 8, 42, 4, true);
      label(ctx, stage.name, stage.x + 32, 82, stage.color);
      smallLabel(ctx, stage.budget, stage.x + 32, 102, COLORS.text);
      smallLabel(ctx, stage.detail, stage.x + 32, 120, COLORS.muted);
      if (index < stages.length - 1) {
        arrow(ctx, stage.x + 148, 94, stage.x + 164, 94, COLORS.border);
      }
    });
    const points = [
      { x: 110, y: 182, color: COLORS.blue },
      { x: 280, y: 164, color: COLORS.green },
      { x: 450, y: 154, color: COLORS.orange }
    ] as const;
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    points.forEach((point, index) => {
      ctx.save();
      ctx.globalAlpha = index > 0 ? 0.18 + pulse * 0.1 : 0.08;
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = point.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    smallLabel(ctx, 'Figure 7: Qwen3VLA 的 aggregate 从 ST -> MT -> FT 上升；论文未单列精确小数值。', 46, 216, COLORS.green);
    smallLabel(ctx, 'Foundry-VLA-1.7B 则更复杂：MT / FT 在 aggregate 上低于 ST。', 78, 234, COLORS.muted);
    return;
  }

  label(ctx, 'Data recipe: Table 5 数据量 + Figure 9 评测结论', 30, 34, COLORS.red);
  const recipes = [
    { name: 'real-only', episodes: 47068, color: COLORS.red, note: 'sim success ≈ 0%' },
    { name: 'sim-only', episodes: 7548, color: COLORS.green, note: 'best aggregate' },
    { name: 'real + sim', episodes: 54616, color: COLORS.blue, note: 'below sim-only' }
  ] as const;
  recipes.forEach((item, index) => {
    const y = 58 + index * 46;
    const barWidth = Math.max(26, Math.round((item.episodes / 54616) * 212));
    label(ctx, item.name, 30, y + 15, item.color);
    smallLabel(ctx, item.episodes.toLocaleString() + ' eps', 30, y + 31, COLORS.muted);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = COLORS.border;
    roundRect(ctx, 154, y, 220, 24, 12, true);
    roundRect(ctx, 154, y, 220, 24, 12, false);
    ctx.fillStyle = item.color;
    roundRect(ctx, 154, y, barWidth, 24, 12, true);
    smallLabel(ctx, item.note, 392, y + 16, item.color);
  });
  ctx.save();
  ctx.globalAlpha = 0.16 + pulse * 0.12;
  ctx.fillStyle = COLORS.red;
  roundRect(ctx, 154 + ((Math.sin(time * 2.2) + 1) / 2) * 208, 54, 12, 124, 6, true);
  ctx.restore();
  smallLabel(ctx, '条形长度 = 训练 episodes（Table 5），不是 success rate；结论来自 Figure 9。', 62, 214, COLORS.muted);
  smallLabel(ctx, '三种模型计算量相同，但使用的数据量与分布不同。', 116, 232, COLORS.muted);
};

const drawValueBoundary = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode, time: number) => {
  const valueMode = mode === 'value';
  const pulse = (Math.sin(time * 2.4) + 1) / 2;
  label(ctx, valueMode ? 'Value: research infrastructure' : 'Limitation: do not over-claim', 30, 34, valueMode ? COLORS.green : COLORS.red);
  const items = valueMode
    ? [
      ['可复现', 'config / ckpt / seed', COLORS.green],
      ['易对照', 'backbone / data', COLORS.blue],
      ['同框架比较', 'scratch / pretrained', COLORS.orange]
    ]
    : [
      ['无真实硬件', 'no hardware result', COLORS.red],
      ['评估范围', 'LBM sim / tabletop', COLORS.orange],
      ['开放问题', 'recipe / safety', COLORS.blue]
    ] as const;
  items.forEach(([title, detail, color], index) => {
    const x = 42 + index * 166;
    const y = index === 1 ? 66 : 80;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    roundRect(ctx, x, y, 130, 86, 14, true);
    roundRect(ctx, x, y, 130, 86, 14, false);
    ctx.save();
    ctx.globalAlpha = 0.12 + pulse * 0.08;
    ctx.fillStyle = color;
    roundRect(ctx, x + 8, y + 8, 114, 14, 7, true);
    ctx.restore();
    label(ctx, title, x + 18, y + 40, color);
    smallLabel(ctx, detail, x + 14, y + 68, COLORS.muted);
  });
  const lineY = 194;
  ctx.strokeStyle = valueMode ? COLORS.green : COLORS.red;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(70, lineY);
  ctx.lineTo(490, lineY);
  ctx.stroke();
  const dotX = 70 + ((Math.sin(time * 2) + 1) / 2) * 420;
  ctx.fillStyle = valueMode ? COLORS.green : COLORS.red;
  ctx.beginPath();
  ctx.arc(dotX, lineY, 5 + pulse * 1.4, 0, Math.PI * 2);
  ctx.fill();
  smallLabel(ctx, valueMode ? '定位：统一、可配置、可比较的 VLA 实验底座。' : '边界：结论绑定仿真评估和论文报告设置。', 112, 224, valueMode ? COLORS.green : COLORS.red);
};

const drawStages = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode) => {
  const rows = [
    { name: 'ST', detail: '2 - 5.12M samples', color: COLORS.blue, bar: 88, batch: '512' },
    { name: 'MT', 'detail': '∼100M samples', color: COLORS.green, bar: 252, batch: '1024' },
    { name: 'FT', detail: '1.024M samples', color: COLORS.orange, bar: 54, batch: '512' }
  ] as const;
  const active = mode.toUpperCase();
  smallLabel(ctx, 'Table 4: 训练样本量与 batch 口径', 36, 28, COLORS.blue);
  rows.forEach((row, index) => {
    const y = 58 + index * 52;
    const on = row.name === active;
    label(ctx, row.name, 52, y + 18, on ? row.color : COLORS.text);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = on ? row.color : COLORS.border;
    roundRect(ctx, 118, y, 320, 24, 12, true);
    roundRect(ctx, 118, y, 320, 24, 12, false);
    ctx.fillStyle = row.color;
    roundRect(ctx, 118, y, row.bar, 24, 12, true);
    smallLabel(ctx, row.detail, 456, y + 16, on ? row.color : COLORS.muted);
    box(ctx, 500, y, 42, 24, row.batch, on ? '#eff6ff' : '#ffffff', on ? row.color : COLORS.border, on ? row.color : COLORS.text);
  });
  const fb =
    active === 'ST'
      ? 'ST 只针对单个任务，样本量较小。'
      : active === 'MT'
        ? 'MT 的训练规模最大，是统一多任务学习的主力。'
        : 'FT 从 MT checkpoint 出发，用更小数据做专项适配。';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = active === 'MT' ? COLORS.green : active === 'ST' ? COLORS.blue : COLORS.orange;
  roundRect(ctx, 44, 206, 468, 22, 11, true);
  roundRect(ctx, 44, 206, 468, 22, 11, false);
  smallLabel(ctx, fb, 58, 222, active === 'MT' ? COLORS.green : active === 'ST' ? COLORS.blue : COLORS.orange);
};

const drawEvaluation = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode) => {
  if (mode === 'protocol') {
    label(ctx, 'Table 6: evaluation task split', 34, 36, COLORS.blue);
    box(ctx, 30, 68, 140, 128, 'Seen\n16 tasks\nused in MT', '#ecfdf5', COLORS.green, COLORS.green);
    box(ctx, 200, 68, 140, 128, 'Held-out\n3 tasks\nfor eval only', '#fff7ed', COLORS.orange, COLORS.orange);
    box(ctx, 370, 68, 140, 128, 'Budget\n200 rollouts /\ntask', '#eff6ff', COLORS.blue, COLORS.blue);
    const scanY = 76 + ((Math.sin(Date.now() / 500) + 1) / 2) * 110;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = COLORS.green;
    roundRect(ctx, 30, scanY, 480, 10, 5, true);
    ctx.restore();
    smallLabel(ctx, 'seen tasks 参与训练，held-out tasks 只用于评估。', 82, 214, COLORS.muted);
    return;
  }
  if (mode === 'dataset') {
    label(ctx, 'Table 5: dataset overview', 34, 36, COLORS.green);
    const rows = [
      { name: 'Real', tasks: 361, eps: 47068, color: COLORS.green },
      { name: 'Sim', tasks: 42, eps: 7548, color: COLORS.blue },
      { name: 'Total', tasks: 403, eps: 54616, color: COLORS.orange }
    ] as const;
    rows.forEach((row, index) => {
      const y = 64 + index * 44;
      box(ctx, 28, y, 92, 28, row.name, row.color === COLORS.green ? '#ecfdf5' : row.color === COLORS.blue ? '#eff6ff' : '#fff7ed', row.color, row.color);
      label(ctx, row.tasks.toString(), 138, y + 18, COLORS.text);
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 212, y + 4, 220, 18, 9, true);
      ctx.strokeStyle = COLORS.border;
      roundRect(ctx, 212, y + 4, 220, 18, 9, false);
      ctx.fillStyle = row.color;
      roundRect(ctx, 212, y + 4, Math.max(54, Math.min(220, row.eps / 250)), 18, 9, true);
      smallLabel(ctx, row.eps.toLocaleString('en-US') + ' eps', 444, y + 18, row.color);
    });
    smallLabel(ctx, 'Table 5 记录 Real / Sim 的任务数和 episodes。', 72, 214, COLORS.muted);
    return;
  }
  label(ctx, 'Boundary: report the setting, not just the score', 34, 36, COLORS.red);
  box(ctx, 40, 72, 146, 82, 'CS\nclosed-source\nbenchmark', '#fff7ed', COLORS.orange, COLORS.orange);
  box(ctx, 218, 72, 146, 82, 'OSS\nopen-source\nshifted version', '#fff1f2', COLORS.red, COLORS.red);
  box(ctx, 396, 72, 118, 82, 'No real\nhardware\nnumbers', '#ffffff', COLORS.border, COLORS.muted);
  smallLabel(ctx, '论文只在 closed-loop simulation 中报告结论。', 118, 212, COLORS.muted);
};

const drawResults = (ctx: CanvasRenderingContext2D, width: number, height: number, mode: Mode, time: number) => {
  if (mode === 'metric') {
    label(ctx, 'Table 7: training samples', 34, 34, COLORS.orange);
    const rows = [
      ['Real', 17_156_497, COLORS.green],
      ['Sim', 1_647_049, COLORS.blue],
      ['Total', 18_803_546, COLORS.orange]
    ] as const;
    rows.forEach(([name, samples, color], index) => {
      const y = 66 + index * 48;
      label(ctx, name, 42, y + 18, COLORS.text);
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 140, y + 6, 300, 18, 9, true);
      ctx.strokeStyle = COLORS.border;
      roundRect(ctx, 140, y + 6, 300, 18, 9, false);
      ctx.fillStyle = color;
      roundRect(ctx, 140, y + 6, Math.min(300, samples / 62000), 18, 9, true);
      smallLabel(ctx, samples.toLocaleString('en-US'), 458, y + 18, color);
    });
    smallLabel(ctx, 'Real + Sim = 18,803,546 samples.', 144, 224, COLORS.muted);
    return;
  }
  if (mode === 'limit') {
    label(ctx, 'Boundary note', 34, 34, COLORS.red);
    box(ctx, 36, 74, 140, 84, 'CS\nclosed-source\nbenchmark', '#fff7ed', COLORS.orange, COLORS.orange);
    box(ctx, 210, 74, 140, 84, 'OS S / shift\nvariant\nnot identical', '#fff1f2', COLORS.red, COLORS.red);
    box(ctx, 384, 74, 140, 84, 'No real\nhardware\nnumbers', '#ffffff', COLORS.border, COLORS.muted);
    smallLabel(ctx, '结论必须绑定到 closed-loop simulation 和论文报告设置。', 92, 214, COLORS.muted);
    return;
  }

  const pulse = 0.45 + Math.sin(time * 2.3) * 0.08;
  label(ctx, 'Figure 5: aggregate success rate', 34, 34, COLORS.green);
  const pts = [
    { name: 'LBM-MT', v: 0.62, color: COLORS.border, note: 'ref' },
    { name: 'VLA-1.7B', v: 0.61, color: COLORS.blue, note: 'on par' },
    { name: 'Qwen3VLA', v: 0.86, color: COLORS.green, note: 'higher' }
  ] as const;
  const left = 92;
  const baseY = 166;
  const scale = 92;
  ctx.strokeStyle = '#cfd6e6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, baseY);
  ctx.lineTo(470, baseY);
  ctx.stroke();
  ctx.fillStyle = '#eef2f7';
  for (let i = 0; i < 4; i++) {
    const x = left + i * 126;
    ctx.beginPath();
    ctx.moveTo(x, 62);
    ctx.lineTo(x, baseY);
    ctx.stroke();
  }
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 3;
  ctx.beginPath();
  pts.forEach((pt, index) => {
    const x = left + index * 126;
    const y = baseY - pt.v * scale;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  pts.forEach((pt, index) => {
    const x = left + index * 126;
    const y = baseY - pt.v * scale;
    ctx.strokeStyle = pt.color;
    ctx.fillStyle = pt.color === COLORS.green ? `rgba(34, 141, 92, ${pulse})` : pt.color;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    smallLabel(ctx, pt.name, x - 28, 192, pt.color === COLORS.border ? COLORS.muted : pt.color);
    smallLabel(ctx, pt.note, x - 18, y - 14, pt.color === COLORS.border ? COLORS.muted : pt.color);
  });
  const scanX = left + ((Math.sin(time * 2.4) + 1) / 2) * 378;
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = COLORS.green;
  roundRect(ctx, scanX - 14, 58, 28, 110, 14, true);
  ctx.restore();
  smallLabel(ctx, 'Qwen3-VL backbone is the clearest gain in the reported setting.', 86, 224, COLORS.muted);
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: boolean) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  if (fill) ctx.fill();
  else ctx.stroke();
};

export default VlaWidget;
