import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import './sailing-kit';

const W = 560;
const H = 250;
const COLORS = {
  sea: '#f5f8f0',
  coast: '#76906a',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

type Backend = 'humanoid' | 'wheeledBase' | 'mobileManipulator';
type FieldId = 'command' | 'parameters' | 'preconditions' | 'target' | 'effect' | 'status';

const BACKENDS: Record<Backend, {
  label: string;
  backend: string[];
  constraints: string[];
  status: string;
  feedback: string;
}> = {
  humanoid: {
    label: '人形机器人',
    backend: ['HoloNavi 目标', 'HoloMotion 行走 / 转向'],
    constraints: ['平衡与接触风险', '速度误差', '恢复可用性'],
    status: '平衡稳定，可继续',
    feedback: '契约仍可由 AgentOS 检查；人形身体要额外报告平衡、接触风险、速度误差与恢复可用性。',
  },
  wheeledBase: {
    label: '轮式底盘',
    backend: ['HoloNavi', '轮式定位 / 转向 / 避障'],
    constraints: ['路线可通行性', '定位置信度', '传感器健康'],
    status: '路线受阻，可重新选路',
    feedback: '契约字段没有消失，但执行已经换成轮式定位、转向与避障；阻塞路线和定位置信度必须由这个后端报告。',
  },
  mobileManipulator: {
    label: '轮式双臂平台',
    backend: ['HoloNavi 底盘移动', 'HoloBrain 局部操作'],
    constraints: ['停靠位姿', '机械臂可达性', '碰撞与抓取风险'],
    status: '目标不可达，需要调整停靠位',
    feedback: '契约仍可由 AgentOS 检查；轮式双臂平台还要满足停靠位姿、机械臂可达性与碰撞约束。',
  },
};

const FIELDS: Array<{ id: FieldId; label: string }> = [
  { id: 'command', label: '命令名' },
  { id: 'parameters', label: '类型化参数' },
  { id: 'preconditions', label: '前置条件' },
  { id: 'target', label: '目标引用' },
  { id: 'effect', label: '预期效果' },
  { id: 'status', label: '状态事件' },
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

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 6, y2 - 4);
  ctx.lineTo(x2 - 6, y2 + 4);
  ctx.closePath();
  ctx.fill();
}

function drawBodyGlyph(ctx: CanvasRenderingContext2D, backend: Backend) {
  ctx.save();
  ctx.translate(88, 184);
  ctx.strokeStyle = COLORS.purple;
  ctx.fillStyle = '#f3e8ff';
  ctx.lineWidth = 2;
  if (backend === 'humanoid') {
    ctx.beginPath();
    ctx.arc(0, -24, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 16);
    ctx.moveTo(-20, -2);
    ctx.lineTo(20, -2);
    ctx.moveTo(0, 16);
    ctx.lineTo(-14, 34);
    ctx.moveTo(0, 16);
    ctx.lineTo(14, 34);
    ctx.stroke();
  } else {
    roundedRect(ctx, -34, -12, 68, 34, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.purple;
    ctx.beginPath();
    ctx.arc(-22, 26, 7, 0, Math.PI * 2);
    ctx.arc(22, 26, 7, 0, Math.PI * 2);
    ctx.fill();
    if (backend === 'mobileManipulator') {
      ctx.strokeStyle = COLORS.purple;
      ctx.beginPath();
      ctx.moveTo(-16, -12);
      ctx.lineTo(-25, -30);
      ctx.lineTo(-10, -42);
      ctx.moveTo(16, -12);
      ctx.lineTo(25, -30);
      ctx.lineTo(10, -42);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, backend: Backend, activeField: FieldId) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = COLORS.sea;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,255,255,.86)';
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  roundedRect(ctx, 18, 18, 524, 88, 10);
  ctx.fill();
  ctx.stroke();
  roundedRect(ctx, 18, 128, 524, 102, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.blue;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText('稳定的高层契约', 30, 39);
  ctx.fillStyle = COLORS.purple;
  ctx.fillText('随身体变化的实现与约束', 30, 149);

  FIELDS.forEach((field, index) => {
    const x = 29 + index * 84;
    const selected = field.id === activeField;
    ctx.fillStyle = selected ? '#e8eef8' : '#ffffff';
    ctx.strokeStyle = COLORS.blue;
    ctx.lineWidth = selected ? 3 : 2;
    roundedRect(ctx, x, 52, 74, 38, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.font = `${selected ? '700' : '600'} 11px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(field.label, x + 37, 75);
    drawArrow(ctx, x + 37, 92, 280, 150, selected ? COLORS.orange : COLORS.line);
  });

  drawBodyGlyph(ctx, backend);
  const spec = BACKENDS[backend];
  ctx.fillStyle = '#f3e8ff';
  ctx.strokeStyle = COLORS.purple;
  ctx.lineWidth = 2;
  roundedRect(ctx, 186, 151, 188, 48, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.purple;
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  spec.backend.forEach((line, i) => ctx.fillText(line, 280, 169 + i * 16));

  ctx.fillStyle = '#fff7ed';
  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 2;
  roundedRect(ctx, 390, 140, 138, 76, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.orange;
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('专用约束', 400, 157);
  ctx.fillStyle = COLORS.ink;
  ctx.font = '11px system-ui, sans-serif';
  spec.constraints.forEach((line, i) => ctx.fillText(`• ${line}`, 400, 174 + i * 14));

  const statusGood = backend === 'humanoid';
  ctx.fillStyle = statusGood ? '#eaf7ef' : '#eef3fb';
  ctx.strokeStyle = statusGood ? COLORS.green : COLORS.blue;
  ctx.lineWidth = 1.5;
  roundedRect(ctx, 174, 207, 204, 18, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = statusGood ? COLORS.green : COLORS.blue;
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(spec.status, 276, 220);

  ctx.fillStyle = COLORS.muted;
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(spec.label, 88, 226);
}

export const Ch7BackendLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef<(() => void) | null>(null);
  const visibleRef = useRef(false);
  const stateRef = useRef<{ backend: Backend; activeField: FieldId }>({ backend: 'humanoid', activeField: 'command' });
  const [backend, setBackend] = useState<Backend>('humanoid');
  const [activeField, setActiveField] = useState<FieldId>('command');
  const [feedback, setFeedback] = useState('同一个高层 move_to 契约正在绑定人形身体；HoloNavi 提供导航目标，HoloMotion 负责行走、转向、平衡与恢复。');

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
    const render = () => drawScene(ctx, stateRef.current.backend, stateRef.current.activeField);
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
    stateRef.current = { backend, activeField };
    if (visibleRef.current) renderRef.current?.();
  }, [backend, activeField]);

  const chooseBackend = (next: Backend) => {
    if (next === backend) {
      setFeedback('你没有更换身体：稳定的是接口结构，当前专用后端与安全约束也没有改变。');
      return;
    }
    setBackend(next);
    setFeedback(BACKENDS[next].feedback);
  };

  const cycleBackend = (current: Backend, direction: number) => {
    const ids: Backend[] = ['humanoid', 'wheeledBase', 'mobileManipulator'];
    const next = ids[(ids.indexOf(current) + direction + ids.length) % ids.length];
    chooseBackend(next);
  };

  const chooseField = (field: { id: FieldId; label: string }) => {
    setActiveField(field.id);
    setFeedback(`你正在检查「${field.label}」；这个字段属于共享契约，但字段里的具体值和执行方式仍由当前技能与身体决定。`);
  };

  return (
    <div>
      <div className="chip-row" role="group" aria-label="选择机器人身体">
        {(Object.keys(BACKENDS) as Backend[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`chip ${backend === id ? 'selected' : ''}`}
            aria-pressed={backend === id}
            onClick={() => chooseBackend(id)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                cycleBackend(id, 1);
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                cycleBackend(id, -1);
              }
            }}
          >
            {BACKENDS[id].label}
          </button>
        ))}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`当前选择${BACKENDS[backend].label}。上层契约字段保持稳定，下层显示${BACKENDS[backend].backend.join('和')}以及身体专用约束。`}
      />
      <div className="chip-row" role="group" aria-label="检查共享契约字段">
        {FIELDS.map((field) => (
          <button
            key={field.id}
            type="button"
            className={`chip ${activeField === field.id ? 'selected' : ''}`}
            aria-pressed={activeField === field.id}
            onClick={() => chooseField(field)}
          >
            {field.label}
          </button>
        ))}
      </div>
      <div className="metrics" aria-label="当前身体实现摘要">
        <div className="metric"><div className="l">专用后端</div><div>{BACKENDS[backend].backend.join(' · ')}</div></div>
        <div className="metric"><div className="l">身体约束</div><div>{BACKENDS[backend].constraints.join(' · ')}</div></div>
        <div className="metric"><div className="l">状态样例</div><div>{BACKENDS[backend].status}</div></div>
      </div>
      <div className="feedback" role="status" aria-live="polite">{feedback}</div>
    </div>
  );
};

export default Ch7BackendLab;
