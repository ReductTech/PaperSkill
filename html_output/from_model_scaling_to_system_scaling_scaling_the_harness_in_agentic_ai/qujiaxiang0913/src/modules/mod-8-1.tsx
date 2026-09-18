import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawNode,
  drawArrow,
  panelStroke,
  drawLegend,
  drawSceneLabel,
} from './lighthouseKit';

// Module 8.1 — walk the orchestration loop 𝒪.
// P5 click hotspots (six component nodes) + P4 mode chips (single / parallel).
//
// Layout: a clean rectangular loop 𝒞 → ℛ → 𝒮 → 环境 → 𝒢 → ℳ → 𝒞 on the left,
// 𝒪 sitting at the centre (dashed links up to ℛ and down to 𝒢), the governance
// gate right of 𝒢, and — in parallel mode — a sub-agent bypass on the right.

const W = 1080;
const H = 340;
const NW = 84;
const NH = 44;

type Mode = 'single' | 'parallel';

// rectangular ring + 𝒪 in the middle
const NODES: { key: string; label: string; x: number; y: number }[] = [
  { key: '𝒞', label: '𝒞 上下文', x: 140, y: 92 },
  { key: 'ℛ', label: 'ℛ 推理', x: 360, y: 92 },
  { key: '𝒮', label: '𝒮 信号', x: 580, y: 92 },
  { key: '𝒢', label: '𝒢 门控', x: 360, y: 248 },
  { key: 'ℳ', label: 'ℳ 记忆', x: 140, y: 248 },
  { key: '𝒪', label: '𝒪 编排', x: 360, y: 170 },
];
const ENV = { x: 580, y: 248 }; // environment waypoint (not clickable)
const SUBS = [
  { x: 730, y: 140, l: '子①' },
  { x: 730, y: 212, l: '子②' },
];

const DETAIL: Record<string, { role: string; out: string; skip: string }> = {
  '𝒞': { role: '把记忆检索结果、环境状态与任务拼成这一轮的输入', out: '本轮喂给 ℛ 的上下文', skip: '模型拿不到相关材料：曝光多，访问少' },
  'ℛ': { role: '在给定上下文上做推理，产出候选动作', out: '推理步骤与候选动作', skip: '没有推理基座，其余五个组件无处附着' },
  '𝒮': { role: '按子任务规格选择并调用工具 / 子智能体', out: '工具或子智能体调用', skip: '只能靠 ℛ 硬做，用不上专门能力' },
  '𝒢': { role: '同时门控中间推理与外部动作，通过后才写回记忆', out: '许可的动作、验证过的记忆写回', skip: '未校验结果进入记忆与外部世界，污染下游' },
  'ℳ': { role: '保存过去回合里验证过的记录', out: '可复用的经验与偏好', skip: '每轮从零开始，无法积累，反复踩同一个坑' },
  '𝒪': { role: '决定上面这些步骤怎么排序、何时重试', out: '一整夜可重复的执行序列', skip: '步骤无序、无重试，长任务容易中途崩掉' },
};

export const Mod81: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ selected: '', mode: 'single' as Mode, t: 0 });
  const rafRef = useRef<number | null>(null);
  const [selected, setSelectedState] = useState('');
  const [mode, setModeState] = useState<Mode>('single');
  const [feedback, setFeedback] = useState({
    text: '点击任意组件，看它在编排循环里的位置；切换执行模式看门控变化。',
    cls: '' as '' | 'good' | 'bad',
  });

  const setSelected = (k: string) => {
    stateRef.current.selected = k;
    setSelectedState(k);
    if (k === '𝒞') setFeedback({ text: '它决定这一轮把什么拼进输入。', cls: '' });
    else if (k === '𝒢') setFeedback({ text: '中间推理和外部动作都要过这道门。', cls: 'good' });
    else if (k === '𝒪') setFeedback({ text: '编排决定上面这些步骤怎么排序、何时重试。', cls: '' });
    else setFeedback({ text: `${k} 是循环里的一环：点开看它的职责、输出与被跳过会怎样。`, cls: '' });
  };

  const setMode = (m: Mode) => {
    stateRef.current.mode = m;
    setModeState(m);
    if (m === 'parallel')
      setFeedback({ text: '并行换来了更多上下文窗口，也带来了协调失败的新风险。', cls: '' });
    else setFeedback({ text: '单智能体直连：一条串行路径，𝒢 处统一门控。', cls: '' });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const node = (k: string) => NODES.find((n) => n.key === k)!;

    const render = (s: { selected: string; mode: Mode; t: number }) => {
      clearScene(ctx, W, H);

      // orchestration frame
      panelStroke(ctx, 66, 40, 588, 258, C.aux);
      // 注：drawSceneLabel 最多 6 个 UTF-16 单元，𝒪 占 2 个，标题里别再带它
      drawSceneLabel(ctx, 66, 24, '编排循环');

      // 𝒪 governs the loop: dashed links up to ℛ and down to 𝒢
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.globalAlpha = 0.75;
      drawArrow(ctx, node('𝒪').x, node('𝒪').y - NH / 2, node('ℛ').x, node('ℛ').y + NH / 2, C.aux);
      drawArrow(ctx, node('𝒪').x, node('𝒪').y + NH / 2, node('𝒢').x, node('𝒢').y - NH / 2, C.aux);
      ctx.restore();

      // main loop: 𝒞 → ℛ → 𝒮 → 环境 → 𝒢 → ℳ → 𝒞
      drawArrow(ctx, node('𝒞').x + NW / 2, node('𝒞').y, node('ℛ').x - NW / 2, node('ℛ').y);
      drawArrow(ctx, node('ℛ').x + NW / 2, node('ℛ').y, node('𝒮').x - NW / 2, node('𝒮').y);
      drawArrow(ctx, node('𝒮').x, node('𝒮').y + NH / 2, ENV.x, ENV.y - NH / 2);
      drawArrow(ctx, ENV.x - NW / 2, ENV.y, node('𝒢').x + NW / 2, node('𝒢').y);
      drawArrow(ctx, node('𝒢').x - NW / 2, node('𝒢').y, node('ℳ').x + NW / 2, node('ℳ').y);
      drawArrow(ctx, node('ℳ').x, node('ℳ').y - NH / 2, node('𝒞').x, node('𝒞').y + NH / 2);

      // parallel bypass on the right
      if (s.mode === 'parallel') {
        drawSceneLabel(ctx, 700, 96, '并行支线');
        SUBS.forEach((sb, i) => {
          drawArrow(ctx, node('𝒮').x + NW / 2, node('𝒮').y + 6, sb.x - 32, sb.y - 4, C.aux);
          drawArrow(ctx, sb.x - 32, sb.y + 14, ENV.x + NW / 2, ENV.y - 12 + i * 16, C.aux);
          drawNode(ctx, sb.x - 32, sb.y - 17, 64, 34, sb.l, 'done');
        });
      }

      // environment waypoint (non-clickable)
      drawNode(ctx, ENV.x - NW / 2, ENV.y - NH / 2, NW, NH, '环境', 'todo');

      // six component nodes
      NODES.forEach((nd) => {
        const sel = s.selected === nd.key;
        drawNode(ctx, nd.x - NW / 2, nd.y - NH / 2, NW, NH, nd.label, sel ? 'active' : 'todo');
        if (sel) {
          const p = 4 + 3 * Math.sin(s.t / 200);
          ctx.strokeStyle = C.beam;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, NW / 2 + p, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      // governance gate right of 𝒢 — kept clear of the annotation text
      const gx = 432;
      ctx.strokeStyle = C.hit;
      ctx.lineWidth = 3;
      ctx.strokeRect(gx, 226, 12, 44);
      ctx.beginPath();
      ctx.moveTo(gx, 270);
      ctx.lineTo(gx + 12, 226);
      ctx.stroke();
      drawSceneLabel(ctx, gx - 6, 290, '动作门');

      // notes column on the far right
      ctx.font = '14px "Segoe UI","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      drawLegend(ctx, 850, 84, [
        { color: C.hit, label: '门开 · 许可' },
        { color: C.miss, label: '门闭 · 拦截' },
        { color: C.aux, label: '编排 / 支线' },
      ]);
      if (s.mode === 'parallel') {
        ctx.fillStyle = C.mark;
        ctx.fillText('支线合流处', 850, 160);
        ctx.fillStyle = C.inkMuted;
        ctx.fillText('需协调', 850, 182);
        ctx.fillText('需去重', 850, 202);
      } else {
        ctx.fillStyle = C.inkMuted;
        ctx.fillText('串行：一条路径', 850, 160);
        ctx.fillText('𝒢 处统一门控', 850, 182);
      }
    };

    const tick = () => {
      stateRef.current.t += 16;
      render(stateRef.current);
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

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (const nd of NODES) {
      if (x >= nd.x - NW / 2 && x <= nd.x + NW / 2 && y >= nd.y - NH / 2 && y <= nd.y + NH / 2) {
        setSelected(nd.key);
        return;
      }
    }
  };

  const detail = selected ? DETAIL[selected] : null;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="ctrl">
        <span style={{ marginRight: 6 }}>执行模式：</span>
        <button className={`chip ${mode === 'single' ? 'on' : ''}`} onClick={() => setMode('single')}>
          单智能体直连
        </button>
        <button className={`chip ${mode === 'parallel' ? 'on' : ''}`} onClick={() => setMode('parallel')}>
          子智能体并行
        </button>
      </div>
      <div className="ctrl">
        <span style={{ marginRight: 6 }}>组件：</span>
        {NODES.map((nd) => (
          <button
            key={nd.key}
            className={`chip ${selected === nd.key ? 'on' : ''}`}
            onClick={() => setSelected(nd.key)}
          >
            {nd.label}
          </button>
        ))}
      </div>
      {detail && (
        <div
          style={{
            margin: '10px 0',
            padding: '10px 14px',
            borderLeft: `3px solid ${C.beam}`,
            background: 'rgba(39,68,110,0.06)',
            borderRadius: 6,
            fontSize: 14,
            lineHeight: 1.75,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4, color: C.ink }}>
            {selected} · 在编排循环里的位置
          </div>
          <div style={{ color: C.inkMuted }}>
            职责：{detail.role}
          </div>
          <div style={{ color: C.inkMuted }}>
            输出：{detail.out}
          </div>
          <div style={{ color: C.miss }}>
            被跳过会怎样：{detail.skip}
          </div>
        </div>
      )}
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod81;
