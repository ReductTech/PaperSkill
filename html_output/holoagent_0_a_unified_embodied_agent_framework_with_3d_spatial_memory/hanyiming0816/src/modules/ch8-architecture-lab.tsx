import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import './sailing-kit';

const W = 560;
const H = 250;
const COLORS = {
  sea: '#f5f8f0',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

type LayerId = 'agentos' | 'memory' | 'skill' | 'monitoring';
type RouteStep = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Point = { x: number; y: number };

const LAYERS: Record<LayerId, { label: string; rect: [number, number, number, number]; detail: string }> = {
  agentos: {
    label: 'AgentOS',
    rect: [128, 30, 154, 44],
    detail: '理解与规划 · 取回上下文 · 调度与重规划',
  },
  memory: {
    label: '空间—时序记忆',
    rect: [24, 104, 160, 48],
    detail: '地点与对象 · HMSG · 位姿与执行历史',
  },
  skill: {
    label: '技能层',
    rect: [218, 104, 160, 48],
    detail: '类型化调用 · 专用后端 · 运行时状态事件',
  },
  monitoring: {
    label: '监控与验证',
    rect: [128, 184, 154, 44],
    detail: '验证效果 · 判断故障 · 形成恢复证据',
  },
};

const LAYER_FEEDBACK: Record<LayerId, string> = {
  agentos: 'AgentOS 负责理解、取回上下文、规划、调度和重规划；它不替代身体专用的低层控制器。',
  memory: '空间—时序记忆提供地点、对象、位姿、HMSG 上下文和执行历史，并在执行后接收相关更新。',
  skill: '技能层把类型化调用落实到 HoloNavi、HoloBrain、HoloMotion 等专用后端，并持续发布运行时状态事件。',
  monitoring: '监控与验证把原始执行证据变成成功、失败和恢复判断，并把结果送回 AgentOS。',
};

const STEPS: Array<{
  short: string;
  transfer: string;
  use: string;
  decision: string;
  feedback: string;
  source: LayerId;
  target: LayerId;
  points: Point[];
}> = [
  {
    short: '用户指令进入 AgentOS',
    transfer: '语音或文字任务意图',
    use: '形成可执行、可监控的任务',
    decision: '开始取回任务上下文',
    feedback: '第 1 段：用户意图先进入 AgentOS，系统开始形成可执行、可监控的任务。',
    source: 'agentos', target: 'agentos', points: [{ x: 205, y: 22 }, { x: 205, y: 30 }],
  },
  {
    short: 'AgentOS 查询记忆',
    transfer: '地点、对象与近期执行证据查询',
    use: '把语言目标落到世界状态',
    decision: '等待空间与历史证据',
    feedback: '第 2 段：AgentOS 先查询记忆，而不是只凭当前画面或对话猜测世界状态。',
    source: 'agentos', target: 'memory', points: [{ x: 160, y: 74 }, { x: 104, y: 104 }],
  },
  {
    short: '记忆返回上下文',
    transfer: '候选目标、位姿、HMSG 与历史',
    use: '为技能图提供空间落点',
    decision: '选择满足条件的技能节点',
    feedback: '第 3 段：记忆返回候选目标、空间上下文和近期执行证据，为计划提供落点。',
    source: 'memory', target: 'agentos', points: [{ x: 184, y: 116 }, { x: 206, y: 90 }, { x: 248, y: 74 }],
  },
  {
    short: '命令主题发送调用',
    transfer: '类型化参数、目标引用与预期效果',
    use: '让技能层收到可检查的调用',
    decision: '交给身体专用后端执行',
    feedback: '第 4 段：AgentOS 通过 ROS2 命令主题发送类型化技能调用，命令路径此时才真正进入技能层。',
    source: 'agentos', target: 'skill', points: [{ x: 250, y: 74 }, { x: 298, y: 104 }],
  },
  {
    short: '专用后端持续执行',
    transfer: '具体身体上的动作目标',
    use: '由后端处理感知、驱动与控制',
    decision: '持续发布执行状态',
    feedback: '第 5 段：专用后端在具体身体上持续执行；高层契约稳定，低层实现仍然因身体而异。',
    source: 'skill', target: 'skill', points: [{ x: 300, y: 152 }, { x: 300, y: 176 }],
  },
  {
    short: '状态主题返回证据',
    transfer: '进度、故障、置信度、延迟、可恢复性',
    use: '把执行从隐藏结果变成可观察状态',
    decision: '交给监控与验证判断',
    feedback: '第 6 段：状态主题带回进度、失败模式、置信度、延迟和可恢复性，执行不再是隐藏的成功标志。',
    source: 'skill', target: 'monitoring', points: [{ x: 250, y: 152 }, { x: 250, y: 168 }, { x: 238, y: 184 }],
  },
  {
    short: '验证结果返回 AgentOS',
    transfer: '是否达成意图与是否可恢复',
    use: '把原始状态变成决策证据',
    decision: '继续、重试、澄清或重规划',
    feedback: '第 7 段：监控与验证把状态证据整理成“是否达到意图、是否还能恢复”的判断。',
    source: 'monitoring', target: 'agentos', points: [{ x: 158, y: 184 }, { x: 104, y: 164 }, { x: 104, y: 88 }, { x: 144, y: 66 }],
  },
  {
    short: '更新相关记忆与计划',
    transfer: '验证结果、技能结果与恢复决定',
    use: '写回相关记录并修正下一轮上下文',
    decision: '闭合本轮执行路径',
    feedback: '第 8 段：AgentOS 用验证结果更新相关记忆和计划，并选择继续、重试、澄清或重规划；闭环已经接通。',
    source: 'agentos', target: 'memory', points: [{ x: 128, y: 54 }, { x: 82, y: 78 }, { x: 82, y: 104 }],
  },
];

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 8) {
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

function drawPolyline(ctx: CanvasRenderingContext2D, points: Point[], color: string, width: number, dashed = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(dashed ? [5, 4] : []);
  ctx.beginPath();
  points.forEach((point, index) => index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
  ctx.stroke();
  const end = points[points.length - 1];
  const before = points[points.length - 2] ?? end;
  const angle = Math.atan2(end.y - before.y, end.x - before.x);
  ctx.translate(end.x, end.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-7, -4);
  ctx.lineTo(-7, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) {
  const chars = Array.from(text);
  let line = '';
  let lineNo = 0;
  for (let i = 0; i < chars.length; i += 1) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineNo * lineHeight);
      line = chars[i];
      lineNo += 1;
      if (lineNo >= maxLines - 1) {
        const rest = line + chars.slice(i + 1).join('');
        let clipped = rest;
        while (ctx.measureText(`${clipped}…`).width > maxWidth && clipped.length > 1) clipped = clipped.slice(0, -1);
        ctx.fillText(`${clipped}…`, x, y + lineNo * lineHeight);
        return;
      }
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y + lineNo * lineHeight);
}

function drawLayerNode(ctx: CanvasRenderingContext2D, id: LayerId, activeLayer: LayerId, routeStep: RouteStep) {
  const layer = LAYERS[id];
  const [x, y, w, h] = layer.rect;
  const currentStep = routeStep >= 0 ? STEPS[routeStep] : null;
  const isActive = id === activeLayer;
  const isTarget = currentStep?.target === id;
  ctx.fillStyle = id === 'skill' ? '#faf5ff' : '#ffffff';
  ctx.strokeStyle = isTarget ? COLORS.green : isActive ? COLORS.blue : COLORS.line;
  ctx.lineWidth = isTarget ? 3 : isActive ? 2.5 : 1.5;
  roundedRect(ctx, x, y, w, h, 9);
  ctx.fill();
  ctx.stroke();
  if (isTarget && isActive) {
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = 1;
    roundedRect(ctx, x + 4, y + 4, w - 8, h - 8, 6);
    ctx.stroke();
  }
  ctx.fillStyle = id === 'skill' ? COLORS.purple : COLORS.ink;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(layer.label, x + w / 2, y + 19);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '10px system-ui, sans-serif';
  const short = id === 'agentos' ? '理解 · 规划 · 调度' : id === 'memory' ? '空间 · HMSG · 历史' : id === 'skill' ? '调用 · 后端 · 状态' : '验证 · 判断 · 反馈';
  ctx.fillText(short, x + w / 2, y + 36);
}

function drawScene(ctx: CanvasRenderingContext2D, activeLayer: LayerId, routeStep: RouteStep) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.sea;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,255,255,.78)';
  ctx.strokeStyle = COLORS.line;
  roundedRect(ctx, 12, 8, 386, 232, 10);
  ctx.fill();
  ctx.stroke();
  roundedRect(ctx, 408, 8, 140, 232, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.muted;
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('用户指令', 205, 17);
  ctx.fillText('物理执行', 300, 176);

  STEPS.forEach((step, index) => {
    const visited = routeStep >= index && routeStep >= 0;
    const current = routeStep === index;
    drawPolyline(ctx, step.points, current ? COLORS.green : visited ? COLORS.blue : COLORS.line, current ? 3 : visited ? 2 : 1, !visited);
  });

  (Object.keys(LAYERS) as LayerId[]).forEach((id) => drawLayerNode(ctx, id, activeLayer, routeStep));

  ctx.fillStyle = routeStep >= 0 ? COLORS.orange : COLORS.blue;
  ctx.font = '800 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(routeStep >= 0 ? `第 ${routeStep + 1}/8 段` : '层职责检查', 420, 28);

  const detail = routeStep >= 0
    ? { heading: STEPS[routeStep].short, rows: [STEPS[routeStep].transfer, STEPS[routeStep].use, STEPS[routeStep].decision] }
    : { heading: LAYERS[activeLayer].label, rows: [LAYERS[activeLayer].detail, '点击路径按钮后，信息会逐段流动。', '层边界不等于低层能力相同。'] };
  ctx.fillStyle = COLORS.ink;
  ctx.font = '700 11px system-ui, sans-serif';
  wrapText(ctx, detail.heading, 420, 48, 116, 14, 2);
  const labels = ['传递', '使用', '决定'];
  detail.rows.forEach((row, index) => {
    const y = 80 + index * 50;
    ctx.fillStyle = index === 2 && routeStep === 7 ? COLORS.green : COLORS.blue;
    ctx.font = '700 10px system-ui, sans-serif';
    ctx.fillText(labels[index], 420, y);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '10px system-ui, sans-serif';
    wrapText(ctx, row, 420, y + 14, 116, 13, 2);
  });

  ctx.fillStyle = COLORS.muted;
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('蓝：已走路径', 22, 236);
  ctx.fillStyle = COLORS.green;
  ctx.fillText('绿：当前传递', 112, 236);
  ctx.fillStyle = COLORS.orange;
  ctx.fillText('橙：学习进度', 208, 236);
}

function hitLayer(x: number, y: number): LayerId | null {
  for (const id of Object.keys(LAYERS) as LayerId[]) {
    const [rx, ry, rw, rh] = LAYERS[id].rect;
    if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) return id;
  }
  return null;
}

export const Ch8ArchitectureLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const visibleRef = useRef(false);
  const stateRef = useRef<{ activeLayer: LayerId; routeStep: RouteStep }>({ activeLayer: 'agentos', routeStep: -1 });
  const [activeLayer, setActiveLayer] = useState<LayerId>('agentos');
  const [routeStep, setRouteStep] = useState<RouteStep>(-1);
  const [feedback, setFeedback] = useState(LAYER_FEEDBACK.agentos);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.maxWidth = `${W}px`;
    canvas.style.height = 'auto';
    const render = () => drawScene(ctx, stateRef.current.activeLayer, stateRef.current.routeStep);
    renderRef.current = render;
    const start = () => {
      visibleRef.current = true;
      render();
      canvas.classList.add('is-ready');
    };
    const stop = () => { visibleRef.current = false; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      renderRef.current = null;
      disconnect();
    };
  }, []);

  useEffect(() => {
    stateRef.current = { activeLayer, routeStep };
    if (visibleRef.current) renderRef.current?.();
  }, [activeLayer, routeStep]);

  const inspectLayer = (id: LayerId) => {
    setActiveLayer(id);
    setRouteStep(-1);
    setFeedback(LAYER_FEEDBACK[id]);
  };

  const cycleLayer = (current: LayerId, direction: number) => {
    const ids: LayerId[] = ['agentos', 'memory', 'skill', 'monitoring'];
    inspectLayer(ids[(ids.indexOf(current) + direction + ids.length) % ids.length]);
  };

  const advance = () => {
    if (routeStep >= 7) return;
    const next = (routeStep + 1) as RouteStep;
    setRouteStep(next);
    setActiveLayer(STEPS[next].target);
    setFeedback(STEPS[next].feedback);
  };

  const previous = () => {
    if (routeStep <= 0) return;
    const next = (routeStep - 1) as RouteStep;
    setRouteStep(next);
    setActiveLayer(STEPS[next].target);
    setFeedback(STEPS[next].feedback);
  };

  const currentDetail = routeStep >= 0
    ? STEPS[routeStep]
    : {
        transfer: LAYERS[activeLayer].detail,
        use: '点击“沿路径前进”后检查信息怎样跨层流动。',
        decision: '当前只检查职责，不把层节点当作静态装饰。',
      };

  return (
    <div>
      <div className="chip-row" role="group" aria-label="选择系统层">
        {(Object.keys(LAYERS) as LayerId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`chip ${routeStep === -1 && activeLayer === id ? 'selected' : ''}`}
            aria-pressed={routeStep === -1 && activeLayer === id}
            onClick={() => inspectLayer(id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                cycleLayer(id, 1);
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                cycleLayer(id, -1);
              }
            }}
          >
            {LAYERS[id].label}
          </button>
        ))}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={routeStep >= 0 ? `当前为第${routeStep + 1}段：${STEPS[routeStep].short}` : `当前检查${LAYERS[activeLayer].label}`}
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const id = hitLayer((event.clientX - rect.left) * W / rect.width, (event.clientY - rect.top) * H / rect.height);
          if (id) inspectLayer(id);
        }}
      />
      <div className="step-ctrl" aria-label="闭环路径控制">
        <button type="button" className="tiny ghost" onClick={previous} disabled={routeStep <= 0}>查看上一段</button>
        <span className="step-label"><b>{routeStep < 0 ? '层检查' : `${routeStep + 1}/8`}</b></span>
        <button type="button" className="tiny" onClick={advance} disabled={routeStep >= 7}>
          {routeStep >= 7 ? '闭环已完成' : '沿路径前进'}
        </button>
      </div>
      <div className="metrics" aria-label="当前路径证据">
        <div className="metric"><div className="l">传递</div><div>{currentDetail.transfer}</div></div>
        <div className="metric"><div className="l">使用</div><div>{currentDetail.use}</div></div>
        <div className="metric"><div className="l">决定</div><div>{currentDetail.decision}</div></div>
      </div>
      <div className={`feedback ${routeStep === 7 ? 'good' : ''}`} role="status" aria-live="polite">{feedback}</div>
      {routeStep === 7 && <p className="step-desc">命令与状态已经闭合为一次可验证执行。</p>}
    </div>
  );
};

export default Ch8ArchitectureLab;
