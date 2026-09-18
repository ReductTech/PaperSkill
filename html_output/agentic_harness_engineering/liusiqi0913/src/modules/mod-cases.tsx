import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-cases — 1080x280，P2 step-through
// 「失败模式 → 组件修复 → 实测结果」：四个案例卡片，三栏流程面板逐栏错峰入场；
// 上一个/下一个（边界禁用）+ 4 个直选 chips。

const W = 1080;
const H = 280;

const C = {
  bg: '#f4f6f8',
  panel: '#ffffff',
  border: '#d7deea',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  purple: '#7c3aed',
};

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

interface CaseData {
  chip: string;
  task: string;
  failure: string[];
  fix: string[];
  fixTag: string;
  result: string[];
  badges: string[];
  fb: { text: string; cls: string };
}

const CASES: CaseData[] = [
  {
    chip: 'iter 2',
    task: 'db-wal-recovery',
    failure: ['用缓存 stdout 回放上次输出', '臆造 value = id × 100', '以行数自检冒充验证'],
    fix: ['提示词与工具层加入 8 条 contract-first 规则（chg-1）'],
    fixTag: '提示词 + 工具',
    result: ['自检不再替代评估器断言'],
    badges: ['稳定 2/2'],
    fb: {
      text: '自造代理指标替代评估器断言，是最典型的失败模式——规则要写进执行层才有效',
      cls: '',
    },
  },
  {
    chip: 'iter 5',
    task: 'path-tracing',
    failure: ['渲染验证成功后执行 rm -rf 清理', '毁掉已验证的交付物'],
    fix: ['publish-state guard 在 shell 层拦截破坏性命令'],
    fixTag: '工具（shell 层）',
    result: ['已验证交付物全程保留'],
    badges: ['0/2 → 2/2'],
    fb: {
      text: '验证通过后随手 rm -rf：破坏发生在交付之后，guard 必须守在 shell 层',
      cls: '',
    },
  },
  {
    chip: 'iter 6',
    task: 'mcmc-sampling-stan',
    failure: ['用网格积分代理值交付', '杀掉未完成的 MCMC 进程'],
    fix: ['工具层 publish-state guard', '中间件跨步风险监测（chg-1 + chg-2）'],
    fixTag: '工具 + 中间件',
    result: ['α ≈ 2.872，β ≈ 16.43'],
    badges: ['6/6 验证通过', '后续四轮保持 2/2'],
    fb: {
      text: '代理值冒充采样结果、中途杀掉 MCMC——工具层与中间件层各堵一处缺口',
      cls: '',
    },
  },
  {
    chip: 'iter 8',
    task: 'configure-git-webserver',
    failure: ['滥用 ALLOW_POST_SUCCESS_RESET 脚本', '删除已验证的部署'],
    fix: ['执行期硬阻塞该重置脚本', '提示词中将风险显著化'],
    fixTag: '工具 + 提示词',
    result: ['为十轮全程最高'],
    badges: ['当轮 76.97%'],
    fb: { text: '进化智能体回头修补了自己先前决策留下的漏洞', cls: 'good' },
  },
];

const PANEL = { w: 300, h: 196, y: 52 };
const GAP = 50;
const X0 = (W - (PANEL.w * 3 + GAP * 2)) / 2; // 40

export const ModCases: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ idx: 0, animStart: 0 });
  const rafRef = useRef<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(CASES[0].fb);

  useEffect(() => {
    stateRef.current.animStart = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const wrapLines = (text: string, maxWidth: number): string[] => {
      const lines: string[] = [];
      let cur = '';
      for (const ch of text) {
        if (ctx.measureText(cur + ch).width > maxWidth && cur) {
          lines.push(cur);
          cur = ch;
        } else {
          cur += ch;
        }
      }
      if (cur) lines.push(cur);
      return lines;
    };

    const drawPanel = (
      x: number,
      color: string,
      title: string,
      p: number,
      body: (px: number, py: number) => void
    ) => {
      const dy = (1 - p) * 14;
      ctx.save();
      ctx.globalAlpha = p;
      ctx.translate(0, dy);
      const y = PANEL.y;
      // 卡体
      ctx.beginPath();
      ctx.roundRect(x, y, PANEL.w, PANEL.h, 10);
      ctx.fillStyle = C.panel;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();
      // 标题带
      ctx.beginPath();
      ctx.roundRect(x, y, PANEL.w, 32, [10, 10, 0, 0]);
      ctx.fillStyle = rgba(color, 0.1);
      ctx.fill();
      ctx.strokeStyle = rgba(color, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + 32);
      ctx.lineTo(x + PANEL.w, y + 32);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, x + 14, y + 21);
      body(x, y);
      ctx.restore();
    };

    const drawArrow = (x1: number, x2: number, p: number) => {
      const cy = PANEL.y + PANEL.h / 2;
      ctx.save();
      ctx.globalAlpha = p;
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, cy);
      ctx.lineTo(x2 - 8, cy);
      ctx.stroke();
      ctx.fillStyle = C.steel;
      ctx.beginPath();
      ctx.moveTo(x2 - 9, cy - 7);
      ctx.lineTo(x2 - 9, cy + 7);
      ctx.lineTo(x2, cy);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const render = (now: number) => {
      const s = stateRef.current;
      const cs = CASES[s.idx];
      const elapsed = now - s.animStart;
      const p = [0, 1, 2].map((i) => easeOutCubic(clamp((elapsed - i * 170) / 420, 0, 1)));

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 头部：案例标题
      ctx.textAlign = 'left';
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(`案例 ${s.idx + 1} / ${CASES.length}`, X0, 22);
      ctx.fillStyle = C.text;
      ctx.font = 'bold 17px "Segoe UI", sans-serif';
      ctx.fillText(`${cs.chip} · ${cs.task}`, X0, 42);

      // 栏间箭头
      drawArrow(X0 + PANEL.w + 10, X0 + PANEL.w + GAP - 10, Math.min(p[0], p[1]));
      drawArrow(
        X0 + PANEL.w * 2 + GAP + 10,
        X0 + PANEL.w * 2 + GAP * 2 - 10,
        Math.min(p[1], p[2])
      );

      // 栏 1：失败模式
      drawPanel(X0, C.red, '失败模式', p[0], (px, py) => {
        let ly = py + 54;
        ctx.font = '13px "Segoe UI", sans-serif';
        cs.failure.forEach((f) => {
          const lines = wrapLines(f, PANEL.w - 52);
          lines.forEach((ln, li) => {
            if (li === 0) {
              ctx.fillStyle = C.red;
              ctx.beginPath();
              ctx.arc(px + 20, ly - 4, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = C.text;
            ctx.fillText(ln, px + 32, ly);
            ly += 19;
          });
          ly += 4;
        });
      });

      // 栏 2：组件修复
      drawPanel(X0 + PANEL.w + GAP, C.green, '组件修复', p[1], (px, py) => {
        let ly = py + 54;
        ctx.font = '13px "Segoe UI", sans-serif';
        cs.fix.forEach((f) => {
          wrapLines(f, PANEL.w - 52).forEach((ln, li) => {
            if (li === 0) {
              ctx.fillStyle = C.green;
              ctx.beginPath();
              ctx.arc(px + 20, ly - 4, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = C.text;
            ctx.fillText(ln, px + 32, ly);
            ly += 19;
          });
          ly += 4;
        });
        // 组件层标签
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        const tag = `[ ${cs.fixTag} ]`;
        const tw = ctx.measureText(tag).width + 20;
        const ty = py + PANEL.h - 36;
        ctx.beginPath();
        ctx.roundRect(px + 14, ty, tw, 24, 12);
        ctx.fillStyle = rgba(C.green, 0.12);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = C.green;
        ctx.stroke();
        ctx.fillStyle = C.green;
        ctx.fillText(tag, px + 24, ty + 16);
      });

      // 栏 3：实测结果
      drawPanel(X0 + (PANEL.w + GAP) * 2, C.blue, '实测结果', p[2], (px, py) => {
        let by = py + 46;
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        cs.badges.forEach((b) => {
          const bw = ctx.measureText(b).width + 26;
          ctx.beginPath();
          ctx.roundRect(px + 14, by, bw, 28, 14);
          ctx.fillStyle = rgba(C.blue, 0.1);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = C.blue;
          ctx.stroke();
          ctx.fillStyle = C.blue;
          ctx.fillText(b, px + 27, by + 19);
          by += 36;
        });
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillStyle = C.text;
        cs.result.forEach((r) => {
          wrapLines(r, PANEL.w - 40).forEach((ln) => {
            ctx.fillText(ln, px + 16, by + 10);
            by += 19;
          });
        });
      });
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

  const go = (next: number) => {
    const v = clamp(next, 0, CASES.length - 1);
    stateRef.current.idx = v;
    stateRef.current.animStart = performance.now();
    setIdx(v);
    setFeedback(CASES[v].fb);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {CASES.map((cs, i) => (
          <button
            key={cs.chip}
            className={`chip ${idx === i ? 'selected' : ''}`}
            onClick={() => go(i)}
          >
            {cs.chip}
          </button>
        ))}
      </div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" disabled={idx === 0} onClick={() => go(idx - 1)}>
          上一个
        </button>
        <span className="step-label">
          案例 <b>{idx + 1}</b> / {CASES.length}
        </span>
        <button
          type="button"
          className="tiny"
          disabled={idx === CASES.length - 1}
          onClick={() => go(idx + 1)}
        >
          下一个
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModCases;
