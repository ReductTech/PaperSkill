import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 module: 七类组件——workspace 文件树布局。点击文件卡片（或下方 chip）查看该组件档案。
const W = 1080;
const H = 280;

const COL = {
  red: '#c43f52',
  green: '#228d5c',
  blue: '#27446e',
  bg: '#f4f6f8',
  panel: '#ffffff',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  border: '#d7deea',
};

interface CompDef {
  key: string;
  name: string;
  file: string;
  duty: string;
  when: string;
  fb: string;
  cls: string;
}

const COMPS: CompDef[] = [
  {
    key: 'system_prompt',
    name: '系统提示词',
    file: 'workspace/prompt/system.md',
    duty: '智能体的行为总则与策略',
    when: '整体行为风格或策略偏离预期时',
    fb: '系统提示词：行为总则与策略写在这一层——风格与策略类失败在此修复。',
    cls: '',
  },
  {
    key: 'tool_desc',
    name: '工具描述',
    file: 'workspace/tools/descriptions.md',
    duty: '告诉模型每个工具能做什么、如何调用',
    when: '模型选错工具或漏用工具时',
    fb: '工具描述：模型选择工具的依据——选错工具、漏用工具时修改此层。',
    cls: '',
  },
  {
    key: 'tool_impl',
    name: '工具实现',
    file: 'workspace/tools/impl/',
    duty: '工具真正执行的代码',
    when: '需要在执行期强制某个行为时',
    fb: '工具实现：直接控制工具行为，需要执行期强制时修改此层',
    cls: 'good',
  },
  {
    key: 'middleware',
    name: '中间件',
    file: 'workspace/middleware/hooks.ts',
    duty: '挂在智能体循环上的钩子',
    when: '跨多步的行为问题需要拦截时',
    fb: '中间件：挂在智能体循环上的钩子，在执行层拦截与改写——跨步行为问题在此层修复',
    cls: '',
  },
  {
    key: 'skill',
    name: '技能',
    file: 'workspace/skills/',
    duty: '可复用的任务流程与经验片段',
    when: '同类任务反复从头摸索时',
    fb: '技能：沉淀可复用流程——同类任务反复从头摸索时，在此层补一条技能。',
    cls: '',
  },
  {
    key: 'sub_agent',
    name: '子智能体配置',
    file: 'workspace/agents/subagents.yaml',
    duty: '定义分工与隔离上下文的子智能体',
    when: '主循环被子任务拖住、需要分工时',
    fb: '子智能体配置：定义分工与上下文隔离——主循环被子任务拖住时调整此层。',
    cls: '',
  },
  {
    key: 'memory',
    name: '长期记忆',
    file: 'workspace/memory/long_term.md',
    duty: '跨任务积累的长期经验',
    when: '同样的失败反复出现时',
    fb: '长期记忆：跨任务的经验仓库——同样的坑反复踩时，把教训写入此层。',
    cls: 'good',
  },
];

const ROOT = { x: 24, y: 10, w: 130, h: 26 };
const TRUNK_X = 60;
const CARD_W = 210;
const CARD_H = 56;
const CARD_GAP = 10;
const CARD_X0 = 180;
const ROW_Y = [52, 124];
const ARCH = { x: 24, y: 192, w: W - 48, h: 80 };

// 卡片排布：第一行 4 张，第二行 3 张
function cardRect(i: number) {
  const row = i < 4 ? 0 : 1;
  const col = i < 4 ? i : i - 4;
  return { x: CARD_X0 + col * (CARD_W + CARD_GAP), y: ROW_Y[row], midY: ROW_Y[row] + CARD_H / 2 };
}

export const ModComponents: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ selected: string | null }>({ selected: null });
  const rafRef = useRef<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState({ text: '点击一张文件卡片，查看这类组件管什么。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const drawFileIcon = (x: number, y: number, stroke: string) => {
      const w = 22;
      const h = 28;
      const f = 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w - f, y);
      ctx.lineTo(x + w, y + f);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fillStyle = COL.panel;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w - f, y);
      ctx.lineTo(x + w - f, y + f);
      ctx.lineTo(x + w, y + f);
      ctx.stroke();
    };

    const render = (now: number) => {
      const s = stateRef.current;
      ctx.fillStyle = COL.bg;
      ctx.fillRect(0, 0, W, H);

      // ---- 根节点 workspace/ ----
      ctx.fillStyle = COL.panel;
      ctx.beginPath();
      ctx.roundRect(ROOT.x, ROOT.y, ROOT.w, ROOT.h, 6);
      ctx.fill();
      ctx.strokeStyle = COL.steel;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillStyle = COL.text;
      ctx.fillText('workspace/', ROOT.x + 14, ROOT.y + 18);

      // ---- 树连接线：根 → 竖干 → 各卡片 ----
      ctx.strokeStyle = COL.border;
      ctx.lineWidth = 2;
      const rootCx = ROOT.x + ROOT.w / 2;
      const firstMid = cardRect(0).midY;
      const lastMid = cardRect(COMPS.length - 1).midY;
      ctx.beginPath();
      ctx.moveTo(rootCx, ROOT.y + ROOT.h);
      ctx.lineTo(rootCx, ROOT.y + ROOT.h + 8);
      ctx.lineTo(TRUNK_X, ROOT.y + ROOT.h + 8);
      ctx.lineTo(TRUNK_X, firstMid);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(TRUNK_X, firstMid);
      ctx.lineTo(TRUNK_X, lastMid);
      ctx.stroke();
      COMPS.forEach((_, i) => {
        const r = cardRect(i);
        ctx.beginPath();
        ctx.moveTo(TRUNK_X, r.midY);
        ctx.lineTo(r.x - 6, r.midY);
        ctx.stroke();
        // 小箭头指向卡片
        ctx.fillStyle = COL.border;
        ctx.beginPath();
        ctx.moveTo(r.x - 6, r.midY - 4);
        ctx.lineTo(r.x - 6, r.midY + 4);
        ctx.lineTo(r.x - 1, r.midY);
        ctx.closePath();
        ctx.fill();
      });

      // ---- 七张文件卡片 ----
      COMPS.forEach((c, i) => {
        const r = cardRect(i);
        const sel = s.selected === c.key;
        ctx.fillStyle = sel ? 'rgba(39,68,110,0.10)' : COL.panel;
        ctx.beginPath();
        ctx.roundRect(r.x, r.y, CARD_W, CARD_H, 8);
        ctx.fill();
        ctx.strokeStyle = sel ? COL.blue : COL.border;
        ctx.lineWidth = sel ? 3 : 2;
        ctx.stroke();
        if (sel) {
          const pulse = 0.5 + 0.5 * Math.sin(now / 200);
          ctx.strokeStyle = `rgba(39,68,110,${0.25 + 0.3 * pulse})`;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.roundRect(r.x - 3, r.y - 3, CARD_W + 6, CARD_H + 6, 10);
          ctx.stroke();
        }
        drawFileIcon(r.x + 12, r.y + (CARD_H - 28) / 2, sel ? COL.blue : COL.steel);
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillStyle = sel ? COL.blue : COL.text;
        ctx.fillText(c.name, r.x + 44, r.y + CARD_H / 2 + 5);
      });

      // ---- 档案区 ----
      ctx.fillStyle = COL.panel;
      ctx.beginPath();
      ctx.roundRect(ARCH.x, ARCH.y, ARCH.w, ARCH.h, 8);
      ctx.fill();
      ctx.strokeStyle = COL.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      const cur = COMPS.find((c) => c.key === s.selected) || null;
      if (!cur) {
        ctx.font = '15px "Segoe UI", sans-serif';
        ctx.fillStyle = COL.muted;
        ctx.fillText('档案区：选中一个组件后，这里显示它的位置、职责与修改时机', ARCH.x + 22, ARCH.y + 30);
      } else {
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillStyle = COL.text;
        ctx.fillText(cur.name, ARCH.x + 22, ARCH.y + 26);
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillStyle = COL.blue;
        ctx.fillText(cur.file, ARCH.x + 150, ARCH.y + 26);
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillStyle = COL.text;
        ctx.fillText('职责：' + cur.duty, ARCH.x + 22, ARCH.y + 50);
        ctx.fillStyle = COL.muted;
        ctx.fillText('何时修改它：' + cur.when, ARCH.x + 22, ARCH.y + 70);
      }
      // 反模式提示（常驻页脚）
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillStyle = COL.muted;
      ctx.textAlign = 'right';
      ctx.fillText('反模式：同一失败类在同一层修复两次仍复发，应换一层。', ARCH.x + ARCH.w - 18, ARCH.y + ARCH.h - 10);
      ctx.textAlign = 'left';
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (key: string) => {
    stateRef.current.selected = key;
    setSelected(key);
    const cur = COMPS.find((c) => c.key === key);
    if (cur) setFeedback({ text: cur.fb, cls: cur.cls });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (let i = 0; i < COMPS.length; i++) {
      const r = cardRect(i);
      if (x >= r.x && x <= r.x + CARD_W && y >= r.y && y <= r.y + CARD_H) {
        pick(COMPS[i].key);
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
      />
      <div className="ctrl">
        <div className="chip-row" style={{ marginBottom: 0 }}>
          {COMPS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`chip${selected === c.key ? ' selected' : ''}`}
              onClick={() => pick(c.key)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModComponents;
