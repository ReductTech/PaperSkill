import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-itercurve — 1080x280，里程碑 chips 高亮（默认全曲线）
// 「演化曲线：十轮迭代」复现论文 Figure 1：虚线=每轮 pass@1（示意形状），
// 实线阶梯=best-so-far，三条基线，四个里程碑注释；点击 chip 高亮该里程碑及之前曲线段。

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

// 中间轮次仅示意形状；有论文依据的数字：起点 69.7、iter8 峰值 76.97、最终 best 77.0
const AHE = [69.5, 74.2, 74.2, 73.0, 74.6, 75.9, 73.0, 77.0, 74.0, 75.4];
const BEST = [69.7, 74.2, 74.2, 74.2, 74.6, 75.9, 75.9, 77.0, 77.0, 77.0];
const BASELINES = [
  { name: 'TF-GRPO', v: 72.3 },
  { name: 'Codex', v: 71.9 },
  { name: 'ACE', v: 68.9 },
];

interface Milestone {
  iter: number;
  line1: string;
  tag: string;
  tagColor: string;
  fb: { text: string; cls: string };
}

const MILESTONES: Milestone[] = [
  {
    iter: 2,
    line1: 'contract-first 工作流+shell 超时',
    tag: '提示词+工具',
    tagColor: C.blue,
    fb: {
      text: 'iter 2 首轮修复即跃升：contract-first 工作流 + shell 超时写入提示词与工具层，起点 69.7% 被迅速越过',
      cls: '',
    },
  },
  {
    iter: 5,
    line1: 'publish-state guard',
    tag: '提示词+工具',
    tagColor: C.blue,
    fb: {
      text: 'iter 5 publish-state guard 拦截「成功后清理交付物」类破坏，best-so-far 第二次抬升',
      cls: '',
    },
  },
  {
    iter: 6,
    line1: '跨步风险监测',
    tag: '中间件',
    tagColor: C.purple,
    fb: {
      text: 'iter 6 中间件跨步风险监测上线，best-so-far 第三次抬升',
      cls: '',
    },
  },
  {
    iter: 8,
    line1: '成功后硬阻塞+风险显著化',
    tag: '工具+中间件',
    tagColor: C.orange,
    fb: {
      text: '当轮 76.97% 为全程最高；best-so-far 阶梯在此定格 77.0% 附近',
      cls: 'good',
    },
  },
];

const DEFAULT_FB = {
  text: '十轮迭代、四个里程碑；点击里程碑 chip 高亮该轮修复与到达该轮的曲线段',
  cls: '',
};

// 几何
const L = 64;
const R = 150;
const T = 90;
const B = 40;
const PW = W - L - R; // 866
const PH = H - T - B; // 150
const Y_MIN = 68;
const Y_MAX = 80;

const xOf = (iter: number) => L + ((iter - 1) / 9) * PW;
const yOf = (v: number) => T + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * PH;

// 里程碑注释药丸：两行，错行排布避免碰撞
const PILL_W = 270;
const PILL_H = 34;
const pillRow = (mi: number) => (mi === 0 || mi === 2 ? 0 : 1); // iter2/iter6 上行，iter5/iter8 下行
const pillY = (mi: number) => 6 + pillRow(mi) * 38;
const pillCx = (mi: number) =>
  clamp(xOf(MILESTONES[mi].iter), PILL_W / 2 + 6, W - PILL_W / 2 - 6);

export const ModIterCurve: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ sel: number | null; animStart: number }>({
    sel: null,
    animStart: 0,
  });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [feedback, setFeedback] = useState(DEFAULT_FB);

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

    const drawAheLine = (color: string, width: number, dashed: boolean) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dashed ? [6, 5] : []);
      ctx.beginPath();
      AHE.forEach((v, i) => {
        const x = xOf(i + 1);
        const y = yOf(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawAheDots = (color: string, r: number) => {
      ctx.fillStyle = color;
      AHE.forEach((v, i) => {
        ctx.beginPath();
        ctx.arc(xOf(i + 1), yOf(v), r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawStepLine = (color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(xOf(1), yOf(BEST[0]));
      for (let i = 1; i < BEST.length; i++) {
        ctx.lineTo(xOf(i + 1), yOf(BEST[i - 1]));
        ctx.lineTo(xOf(i + 1), yOf(BEST[i]));
      }
      ctx.stroke();
    };

    const render = (now: number) => {
      const s = stateRef.current;
      const elapsed = now - s.animStart;
      const reveal = easeOutCubic(clamp(elapsed / 1500, 0, 1));

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // 网格与 y 轴刻度
      ctx.font = '11px "Segoe UI", sans-serif';
      [68, 72, 76, 80].forEach((v) => {
        const y = yOf(v);
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L, y);
        ctx.lineTo(L + PW, y);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'right';
        ctx.fillText(String(v), L - 8, y + 4);
      });
      // x 轴
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(L, yOf(Y_MIN));
      ctx.lineTo(L + PW, yOf(Y_MIN));
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'center';
      for (let i = 1; i <= 10; i++) ctx.fillText(String(i), xOf(i), yOf(Y_MIN) + 16);

      // 三条基线（muted 虚线 + 右侧标签）
      BASELINES.forEach((b, bi) => {
        const y = yOf(b.v);
        ctx.strokeStyle = rgba(C.steel, 0.55);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.moveTo(L, y);
        ctx.lineTo(L + PW, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.muted;
        ctx.textAlign = 'left';
        const ly = bi === 1 ? y + 14 : y - 5; // Codex 标签下移避免与 TF-GRPO 重叠
        ctx.fillText(`${b.name} ${b.v.toFixed(1)}`, L + PW + 10, ly);
      });

      // 主曲线区（随 reveal 从左向右揭示）
      ctx.save();
      ctx.beginPath();
      ctx.rect(L - 6, 0, PW * reveal + 12, H);
      ctx.clip();
      if (s.sel === null) {
        drawStepLine(C.green, 2.5);
        drawAheLine(C.blue, 2, true);
        drawAheDots(C.blue, 3.5);
      } else {
        // 未选段淡显
        drawStepLine(rgba(C.green, 0.25), 2);
        drawAheLine(rgba(C.blue, 0.2), 2, true);
        drawAheDots(rgba(C.blue, 0.2), 3);
        // 到达里程碑的高亮段
        const mx = xOf(MILESTONES[s.sel].iter);
        ctx.save();
        ctx.beginPath();
        ctx.rect(L - 6, 0, mx - L + 12, H);
        ctx.clip();
        drawStepLine(C.orange, 3);
        drawAheLine(C.orange, 3, false);
        drawAheDots(C.orange, 4);
        ctx.restore();
      }
      // 数字标签（仅有论文依据的三个）
      if (reveal > 0.05) {
        ctx.fillStyle = C.text;
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('起点 69.7', xOf(1) + 8, yOf(AHE[0]) + 18);
      }
      if (reveal > 0.8) {
        ctx.fillStyle = C.text;
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('76.97', xOf(8), yOf(77.0) - 10);
        ctx.fillStyle = C.green;
        ctx.fillText('best 77.0', (xOf(9) + xOf(10)) / 2, yOf(77.0) - 10);
      }
      ctx.restore();

      // 里程碑注释药丸 + 连接线
      MILESTONES.forEach((m, mi) => {
        const cx = pillCx(mi);
        const py = pillY(mi);
        const isSel = s.sel === mi;
        const dim = s.sel !== null && !isSel;
        const pa = easeOutCubic(clamp((elapsed - 300 - mi * 160) / 400, 0, 1));
        ctx.save();
        ctx.globalAlpha = pa * (dim ? 0.3 : 1);
        // 连接线：药丸底边 → best-so-far 阶梯上的对应点
        ctx.strokeStyle = isSel ? m.tagColor : rgba(C.steel, 0.6);
        ctx.lineWidth = isSel ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, py + PILL_H);
        ctx.lineTo(xOf(m.iter), yOf(BEST[m.iter - 1]) - 6);
        ctx.stroke();
        // 药丸
        ctx.beginPath();
        ctx.roundRect(cx - PILL_W / 2, py, PILL_W, PILL_H, 8);
        ctx.fillStyle = isSel ? rgba(m.tagColor, 0.12) : C.panel;
        ctx.fill();
        ctx.lineWidth = isSel ? 2.5 : 1.5;
        ctx.strokeStyle = isSel ? m.tagColor : C.border;
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillStyle = C.text;
        ctx.fillText(`iter ${m.iter} · ${m.line1}`, cx, py + 14);
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.fillStyle = m.tagColor;
        ctx.fillText(`[${m.tag}]`, cx, py + 28);
        ctx.restore();
      });

      // 注释
      ctx.textAlign = 'left';
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText(
        '注：中间轮次数值为示意形状；仅 69.7（起点）、76.97（iter 8 峰值）、77.0（最终 best）有论文依据',
        L,
        H - 8
      );
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

  const pick = (mi: number | null) => {
    stateRef.current.sel = mi;
    setSel(mi);
    setFeedback(mi === null ? DEFAULT_FB : MILESTONES[mi].fb);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {MILESTONES.map((m, mi) => (
          <button
            key={m.iter}
            className={`chip ${sel === mi ? 'selected' : ''}`}
            onClick={() => pick(mi)}
          >
            iter {m.iter}
          </button>
        ))}
        <button className={`chip ${sel === null ? 'selected' : ''}`} onClick={() => pick(null)}>
          全部
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModIterCurve;
