import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 5.1：三分支共识：保留、替换、精炼（P4 芯片）。
// 选择「全部不一致」时自动播放 4 轮判定-修正循环（每轮约 1.5s，
// 依次高亮 ①渲染→②比对→③修正），结束后停住并高亮「转人工」；
// 可用「重新播放」再次播放。其余分支为静态呈现。

const W = 560;
const H = 240;

const RED = '#c43f52';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#d97706';
const INK = '#21324a';
const MUTED = '#68778f';
const AXIS = '#d7deea';

type Branch = 'keep' | 'replace' | 'refine';

const BRANCH_LABELS: Record<Branch, string> = {
  keep: '至少一位专家支持',
  replace: '至少两位专家一致',
  refine: '全部不一致',
};

const RULE_BAND: Record<Branch, string> = {
  keep: '规则：≥1 位专家支持 → 保留原标签',
  replace: '规则：原标签无支持，≥2 位专家一致 → 用共识结果替换',
  refine: '规则：无任何共识 → 送入渲染引导的判定-修正循环',
};

const CARDS = [
  { label: '原标签', x: 8 },
  { label: '千帆OCR', x: 138 },
  { label: 'GLM-OCR', x: 268 },
  { label: 'MinerU2.5-Pro', x: 398 },
];

const LOOP_STEPS = ['① 渲染成图', '② 比对找差异', '③ 按差异修正'];
const ROUND_MS = 1500;
const TOTAL_ROUNDS = 4;

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  label: string,
  state: 'neutral' | 'green' | 'red' | 'ring'
): void {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, 16, 118, 58);
  ctx.strokeStyle = state === 'green' ? GREEN : state === 'red' ? RED : state === 'ring' ? ORANGE : AXIS;
  ctx.lineWidth = state === 'neutral' ? 1 : 2;
  ctx.strokeRect(x + 0.5, 16.5, 117, 57);
  ctx.fillStyle = INK;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + 59, 48);
}

function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'tick' | 'cross'): void {
  ctx.strokeStyle = kind === 'tick' ? GREEN : RED;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (kind === 'tick') {
    ctx.moveTo(x - 5, y);
    ctx.lineTo(x - 1, y + 5);
    ctx.lineTo(x + 6, y - 6);
  } else {
    ctx.moveTo(x - 5, y - 5);
    ctx.lineTo(x + 5, y + 5);
    ctx.moveTo(x + 5, y - 5);
    ctx.lineTo(x - 5, y + 5);
  }
  ctx.stroke();
}

function drawLoopInset(
  ctx: CanvasRenderingContext2D,
  active: boolean,
  activeIdx: number,
  round: number,
  finished: boolean
): void {
  const x0 = 204;
  const y0 = 122;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x0, y0, 348, 98);
  ctx.strokeStyle = AXIS;
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 0.5, y0 + 0.5, 347, 97);

  if (!active) {
    ctx.fillStyle = MUTED;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('判定-修正循环（未激活）', x0 + 12, y0 + 26);
    return;
  }

  ctx.fillStyle = MUTED;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`判定轮次：第 ${Math.min(round, TOTAL_ROUNDS)} / 4 轮`, x0 + 12, y0 + 14);

  // 三个环节横向排列（全部内缩于内框），当前激活环节蓝底高亮
  const stepW = 104;
  const sx0 = x0 + 12;
  for (let i = 0; i < 3; i++) {
    const sx = sx0 + i * (stepW + 8);
    const isActive = activeIdx === i;
    ctx.fillStyle = isActive ? BLUE : '#f5f8f0';
    ctx.fillRect(sx, y0 + 24, stepW, 26);
    ctx.strokeStyle = isActive ? BLUE : AXIS;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, y0 + 24.5, stepW - 1, 25);
    ctx.fillStyle = isActive ? '#ffffff' : INK;
    ctx.font = '11px sans-serif';
    ctx.fillText(LOOP_STEPS[i], sx + 6, y0 + 40);
  }
  // 循环箭头（贴内框上缘，从第三步回绕到第一步）
  const rightEdge = sx0 + 3 * (stepW + 8) - 4;
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rightEdge, y0 + 20);
  ctx.lineTo(sx0 + 8, y0 + 20);
  ctx.stroke();
  // 两端小箭头
  ctx.beginPath();
  ctx.moveTo(rightEdge - 6, y0 + 16);
  ctx.lineTo(rightEdge, y0 + 20);
  ctx.lineTo(rightEdge - 6, y0 + 24);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx0 + 14, y0 + 16);
  ctx.lineTo(sx0 + 8, y0 + 20);
  ctx.lineTo(sx0 + 14, y0 + 24);
  ctx.stroke();

  // 转人工回退行：与步骤同款整行样式（4 轮后橙色高亮）
  ctx.fillStyle = finished ? '#fdf3ec' : '#f5f8f0';
  ctx.fillRect(sx0, y0 + 58, 3 * (stepW + 8) - 4, 24);
  ctx.strokeStyle = finished ? ORANGE : AXIS;
  ctx.lineWidth = 1;
  ctx.strokeRect(sx0 + 0.5, y0 + 58.5, 3 * (stepW + 8) - 5, 23);
  ctx.fillStyle = finished ? ORANGE : INK;
  ctx.font = '11px sans-serif';
  ctx.fillText('仍不一致 → 转人工预标注', sx0 + 8, y0 + 74);
}

export const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    branch: 'keep' as Branch,
    round: 0,
    activeIdx: -1,
    finished: false,
    runStart: 0,
    playing: false,
    reduce: false,
  });
  const rafRef = useRef<number | null>(null);
  const [branch, setBranch] = useState<Branch>('keep');
  const [feedback, setFeedback] = useState({
    text: '原标签得到至少一位专家支持——标签保留，样本照常使用。',
    cls: 'good',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    stateRef.current.reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(10, 10, W - 20, H - 20);

      const s = stateRef.current;
      const b = s.branch;

      // 四张答案卡
      drawCard(ctx, CARDS[0].x, CARDS[0].label, b === 'replace' ? 'red' : b === 'refine' ? 'ring' : 'neutral');
      drawCard(ctx, CARDS[1].x, CARDS[1].label, b === 'keep' ? 'green' : b === 'replace' ? 'green' : 'red');
      drawCard(ctx, CARDS[2].x, CARDS[2].label, b === 'replace' ? 'green' : 'neutral');
      drawCard(ctx, CARDS[3].x, CARDS[3].label, 'neutral');

      if (b === 'keep') {
        drawMark(ctx, CARDS[0].x + 59, 62, 'tick');
        drawMark(ctx, CARDS[1].x + 104, 30, 'tick');
      } else if (b === 'replace') {
        drawMark(ctx, CARDS[0].x + 59, 62, 'cross');
        drawMark(ctx, CARDS[1].x + 104, 30, 'tick');
        drawMark(ctx, CARDS[2].x + 104, 30, 'tick');
      } else {
        for (let i = 0; i < 4; i++) drawMark(ctx, CARDS[i].x + 59, 62, 'cross');
      }

      // 规则带
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 122, 188, 98);
      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 1;
      ctx.strokeRect(8.5, 122.5, 187, 97);
      ctx.fillStyle = INK;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('规则', 20, 142);
      ctx.fillStyle = MUTED;
      ctx.font = '11px sans-serif';
      // 手动换行
      const rest = RULE_BAND[b].slice(3);
      const lines: string[] = [];
      let cur = '';
      for (const ch of rest) {
        const t = cur + ch;
        if (cur && ctx.measureText(t).width > 168) {
          lines.push(cur);
          cur = ch;
        } else {
          cur = t;
        }
      }
      if (cur) lines.push(cur);
      lines.forEach((ln, i) => ctx.fillText(ln, 20, 160 + i * 16));

      drawLoopInset(ctx, b === 'refine', s.activeIdx, s.round, s.finished);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const tick = () => render();
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

  const startRefineRun = () => {
    const s = stateRef.current;
    s.round = 0;
    s.finished = false;
    s.activeIdx = -1;
    s.runStart = performance.now();
    s.playing = true;
    setFeedback({ text: '全都不一致——自动判定-修正循环…', cls: '' });
  };

  const onChip = (b: Branch) => {
    stateRef.current.branch = b;
    stateRef.current.playing = false;
    stateRef.current.round = 0;
    stateRef.current.finished = false;
    stateRef.current.activeIdx = -1;
    setBranch(b);
    if (b === 'keep') {
      setFeedback({ text: '原标签得到至少一位专家支持——标签保留，样本照常使用。', cls: 'good' });
    } else if (b === 'replace') {
      setFeedback({ text: '原标签与所有专家都不一致，但至少两位专家彼此一致——用共识结果替换原标签。', cls: 'good' });
    } else {
      startRefineRun();
    }
  };

  // 播放时钟：refine 分支下推进轮次与环节高亮
  const advance = (now: number) => {
    const s = stateRef.current;
    if (s.branch !== 'refine' || !s.playing) return;
    if (!s.reduce) {
      const elapsed = now - s.runStart;
      const idx = clamp(Math.floor(elapsed / (ROUND_MS / 3)), 0, TOTAL_ROUNDS * 3 - 1);
      s.round = Math.floor(idx / 3) + 1;
      s.activeIdx = idx % 3;
      if (idx >= TOTAL_ROUNDS * 3 - 1) {
        s.playing = false;
        s.finished = true;
        s.activeIdx = -1;
        setFeedback({
          text: 'T 轮后仍不一致——转人工预标注。',
          cls: '',
        });
      }
    } else {
      s.playing = false;
      s.finished = true;
      s.round = TOTAL_ROUNDS;
      s.activeIdx = -1;
      setFeedback({
        text: 'T 轮后仍不一致——转人工预标注。',
        cls: '',
      });
    }
  };

  useEffect(() => {
    const id = setInterval(() => advance(performance.now()), 60);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {(Object.keys(BRANCH_LABELS) as Branch[]).map((b) => (
          <button
            key={b}
            type="button"
            className={'chip' + (branch === b ? ' selected' : '')}
            onClick={() => onChip(b)}
            aria-pressed={branch === b}
          >
            {BRANCH_LABELS[b]}
          </button>
        ))}
      </div>
      <div className="ctrl">
        {branch === 'refine' ? (
          <button type="button" className="chip" onClick={startRefineRun}>
            重新播放
          </button>
        ) : null}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch4Mod1;
