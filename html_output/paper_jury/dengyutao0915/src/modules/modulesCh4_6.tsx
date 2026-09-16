import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
//  第 4-6 章交互模块：确定性设置 / 审稿人数 / 可争议性路由
// ============================================================================

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const ENV_L = '#b8c9a7';
const ENV_D = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const TEXT = '#21324a';
const MUTED = '#68778f';
const BORDER = '#d7deea';

// 圆角矩形辅助（arcTo 实现，限 rr <= w/2, h/2）
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

// 横向箭头辅助
function arrow(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  ctx.strokeStyle = '#c3cad6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2 - 10, y);
  ctx.stroke();
  ctx.fillStyle = '#c3cad6';
  ctx.beginPath();
  ctx.moveTo(x2 - 14, y - 6);
  ctx.lineTo(x2, y);
  ctx.lineTo(x2 - 14, y + 6);
  ctx.closePath();
  ctx.fill();
}

// 竖向箭头辅助
function vArrow(ctx: CanvasRenderingContext2D, y1: number, y2: number, x: number) {
  ctx.strokeStyle = '#c3cad6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2 - 10);
  ctx.stroke();
  ctx.fillStyle = '#c3cad6';
  ctx.beginPath();
  ctx.moveTo(x - 6, y2 - 14);
  ctx.lineTo(x, y2);
  ctx.lineTo(x + 6, y2 - 14);
  ctx.closePath();
  ctx.fill();
}

/* ---------------- Ch4：三步建立确定性基础（P2 步进，竖版流程图） ---------------- */
const CH4_STEPS = [
  {
    title: '第 1 步：确定性分解 D(x)',
    desc: '确定性代码把论文切成章节、段落、锚点与交叉引用——创建稳定可寻址单元，全程不调用语言模型。',
    draw: (ctx: CanvasRenderingContext2D, s: number) => {
      // 论文卡（顶部居中）
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1.5;
      roundRect(ctx, 165, 100, 210, 76, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = TEXT;
      ctx.font = '700 18px "Microsoft YaHei", sans-serif';
      ctx.fillText('论文 LaTeX', 193, 128);
      ctx.fillStyle = MUTED;
      ctx.font = '13px sans-serif';
      ctx.fillText('原稿', 255, 156);
      // 向下箭头
      vArrow(ctx, 190, 250, 270);
      // 三个单元卡（横排一行）
      const units = ['章节', '段落', '锚点'];
      units.forEach((u, i) => {
        const x = 35 + i * 160;
        const done = s > i * 0.33;
        ctx.fillStyle = done ? 'rgba(39,68,110,0.08)' : '#f2f4f8';
        roundRect(ctx, x, 260, 150, 96, 12);
        ctx.fill();
        ctx.strokeStyle = done ? 'rgba(39,68,110,0.5)' : '#e2e6ee';
        ctx.lineWidth = 1.5;
        roundRect(ctx, x, 260, 150, 96, 12);
        ctx.stroke();
        // 序号
        ctx.fillStyle = done ? BLUE : '#c3cad6';
        ctx.beginPath();
        ctx.arc(x + 28, 286, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), x + 28, 291);
        ctx.textAlign = 'left';
        // 名称 + 状态
        ctx.fillStyle = done ? TEXT : MUTED;
        ctx.font = '700 17px "Microsoft YaHei", sans-serif';
        ctx.fillText(u, x + 50, 291);
        ctx.fillStyle = MUTED;
        ctx.font = '12px sans-serif';
        ctx.fillText(done ? '已建立 ✓' : '待建立', x + 50, 320);
        // 内部进度条
        ctx.fillStyle = done ? 'rgba(39,68,110,0.15)' : '#e2e6ee';
        roundRect(ctx, x + 20, 330, 110, 8, 4);
        ctx.fill();
        if (done) {
          ctx.fillStyle = BLUE;
          roundRect(ctx, x + 20, 330, 110, 8, 4);
          ctx.fill();
        }
      });
    },
  },
  {
    title: '第 2 步：冻结主张主线 S',
    desc: '提取核心主张形成冻结主线：编辑可修措辞，但不可悄悄改写主张——这是后续守卫决策的语义主干。',
    draw: (ctx: CanvasRenderingContext2D, s: number) => {
      // 论文单元卡（顶部居中）
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1.5;
      roundRect(ctx, 165, 100, 210, 76, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = TEXT;
      ctx.font = '700 18px "Microsoft YaHei", sans-serif';
      ctx.fillText('论文单元', 193, 128);
      ctx.fillStyle = MUTED;
      ctx.font = '13px sans-serif';
      ctx.fillText('编辑前', 255, 156);
      // 向下箭头
      vArrow(ctx, 190, 250, 270);
      // 菱形主线卡（居中）
      const done = s > 0.5;
      ctx.save();
      ctx.translate(270, 330);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = done ? 'rgba(217,119,6,0.12)' : '#f2f4f8';
      ctx.fillRect(-58, -58, 116, 116);
      ctx.strokeStyle = done ? 'rgba(217,119,6,0.6)' : '#e2e6ee';
      ctx.lineWidth = 2;
      ctx.strokeRect(-58, -58, 116, 116);
      ctx.restore();
      ctx.fillStyle = done ? '#b45309' : MUTED;
      ctx.font = '700 16px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('主张主线', 270, 328);
      ctx.font = '13px sans-serif';
      ctx.fillText(done ? '已冻结' : '待冻结', 270, 348);
      ctx.textAlign = 'left';
      // 锁（菱形下方）
      if (done) {
        ctx.fillStyle = GREEN;
        roundRect(ctx, 212, 420, 46, 36, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(235, 410, 12, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = GREEN;
        ctx.fillRect(230, 408, 10, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 12px "Microsoft YaHei", sans-serif';
        ctx.fillText('冻结', 274, 440);
      } else {
        ctx.fillStyle = MUTED;
        ctx.font = '13px sans-serif';
        ctx.fillText('未冻结', 244, 440);
      }
    },
  },
  {
    title: '第 3 步：持久账本 L',
    desc: '建立持久账本：每个问题获得稳定身份，跨轮次记录证据、裁决与补丁历史——支撑路由、关闭与精确一次修订。',
    draw: (ctx: CanvasRenderingContext2D, s: number) => {
      // 问题卡（顶部居中）
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1.5;
      roundRect(ctx, 165, 100, 210, 76, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = TEXT;
      ctx.font = '700 18px "Microsoft YaHei", sans-serif';
      ctx.fillText('问题 i', 193, 128);
      ctx.fillStyle = MUTED;
      ctx.font = '13px sans-serif';
      ctx.fillText('身份化', 255, 156);
      // 向下箭头
      vArrow(ctx, 190, 250, 270);
      // 账本卡（居中）
      const done = s > 0.5;
      ctx.fillStyle = done ? 'rgba(124,58,237,0.08)' : '#f2f4f8';
      roundRect(ctx, 100, 260, 340, 180, 14);
      ctx.fill();
      ctx.strokeStyle = done ? 'rgba(124,58,237,0.55)' : '#e2e6ee';
      ctx.lineWidth = 1.5;
      roundRect(ctx, 100, 260, 340, 180, 14);
      ctx.stroke();
      ctx.fillStyle = PURPLE;
      ctx.font = '700 17px "Microsoft YaHei", sans-serif';
      ctx.fillText('持久账本 L', 122, 286);
      if (done) {
        const rows = ['身份 #i', '证据 eᵢ', '裁决 vᵢ'];
        rows.forEach((r, i) => {
          ctx.fillStyle = '#ffffff';
          roundRect(ctx, 118, 298 + i * 34, 304, 26, 6);
          ctx.fill();
          ctx.strokeStyle = 'rgba(124,58,237,0.25)';
          ctx.lineWidth = 1;
          roundRect(ctx, 118, 298 + i * 34, 304, 26, 6);
          ctx.stroke();
          ctx.fillStyle = MUTED;
          ctx.font = '14px "Microsoft YaHei", sans-serif';
          ctx.fillText(r, 130, 316 + i * 34);
        });
        // 跨轮次持久徽章（右上）
        ctx.fillStyle = 'rgba(124,58,237,0.12)';
        roundRect(ctx, 330, 268, 96, 30, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(124,58,237,0.4)';
        ctx.lineWidth = 1;
        roundRect(ctx, 330, 268, 96, 30, 15);
        ctx.stroke();
        ctx.fillStyle = PURPLE;
        ctx.font = '600 12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('跨轮次持久', 378, 288);
        ctx.textAlign = 'left';
      } else {
        ctx.fillStyle = MUTED;
        ctx.font = '14px sans-serif';
        ctx.fillText('等待问题写入…', 260, 340);
      }
    },
  },
];

export const Ch4SetupSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, 540, 560);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (s: { step: number }) => {
      ctx.clearRect(0, 0, 540, 560);

      // 背景：柔和纵向渐变
      const grad = ctx.createLinearGradient(0, 0, 0, 560);
      grad.addColorStop(0, '#fbfdf9');
      grad.addColorStop(1, BG);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 540, 560);

      // 顶部步骤胶囊（当前高亮）
      const names = ['分解', '冻结主线', '持久账本'];
      names.forEach((n, i) => {
        const x = 30 + i * 170;
        const active = i === s.step;
        const done = i < s.step;
        ctx.fillStyle = active ? ORANGE : done ? 'rgba(34,141,92,0.12)' : '#eef1f6';
        roundRect(ctx, x, 24, 160, 34, 17);
        ctx.fill();
        if (active) {
          ctx.strokeStyle = 'rgba(217,119,6,0.4)';
          ctx.lineWidth = 1;
          roundRect(ctx, x, 24, 160, 34, 17);
          ctx.stroke();
        }
        ctx.fillStyle = active ? '#ffffff' : done ? GREEN : MUTED;
        ctx.font = '600 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1} ${n}`, x + 80, 46);
        ctx.textAlign = 'left';
      });

      // 当前步骤图（竖版：源卡 → 向下箭头 → 结果）
      CH4_STEPS[s.step].draw(ctx, s.step);

      // 底部进度条
      ctx.fillStyle = '#eef1f6';
      roundRect(ctx, 30, 524, 480, 6, 3);
      ctx.fill();
      ctx.fillStyle = ORANGE;
      roundRect(ctx, 30, 524, 160 * (s.step + 1), 6, 3);
      ctx.fill();
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const next = () => {
    const ns = Math.min(2, stateRef.current.step + 1);
    stateRef.current.step = ns;
    setStep(ns);
  };
  const prev = () => {
    const ns = Math.max(0, stateRef.current.step - 1);
    stateRef.current.step = ns;
    setStep(ns);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={540}
        height={560}
        className="canvas-portrait"
      />
      <div className="ch3-ctrl">
        <button type="button" className="ch3-btn ch3-btn-ghost" onClick={prev} disabled={step === 0}>
          ← 上一步
        </button>
        <button type="button" className="ch3-btn ch3-btn-primary" onClick={next} disabled={step === 2}>
          {step === 2 ? '全部建立 ✓' : '下一步 →'}
        </button>
      </div>
      <div className="feedback">{CH4_STEPS[step].desc}</div>
    </div>
  );
};

/* ---------------- Ch5：审稿人数调节器（P1 滑块，双画布） ---------------- */
export const Ch5ReviewerN: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const seatsRef = useRef<HTMLCanvasElement>(null);
  const metRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ n: 3 });
  const [n, setN] = useState(3);
  const [feedback, setFeedback] = useState({
    text: '默认 N=3：整体审稿人数被限定在 [2,4]，以控制精确-召回-成本三难。',
    cls: '',
  });

  useEffect(() => {
    const c1 = seatsRef.current;
    const c2 = metRef.current;
    if (!c1 || !c2) return;
    let ctx1: CanvasRenderingContext2D;
    let ctx2: CanvasRenderingContext2D;
    try {
      ctx1 = setupCanvas(c1, 540, H);
      ctx2 = setupCanvas(c2, 540, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    // 左图：审稿人席位（圆桌会议）
    const drawSeats = (s: { n: number }, ctx: CanvasRenderingContext2D) => {
      const nn = s.n;
      const W2 = 540;
      ctx.clearRect(0, 0, W2, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdf9');
      grad.addColorStop(1, BG);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W2, H);

      ctx.fillStyle = MUTED;
      ctx.font = '600 14px "Microsoft YaHei", sans-serif';
      ctx.fillText('审稿人席位', 40, 32);

      // N 徽章（右上）
      ctx.fillStyle = 'rgba(217,119,6,0.12)';
      roundRect(ctx, 428, 24, 82, 46, 23);
      ctx.fill();
      ctx.strokeStyle = 'rgba(217,119,6,0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, 428, 24, 82, 46, 23);
      ctx.stroke();
      ctx.fillStyle = '#b45309';
      ctx.font = '700 20px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('N=' + nn, 469, 54);
      ctx.textAlign = 'left';

      // 评审桌（圆桌）
      const tx = 225;
      const ty = 148;
      ctx.beginPath();
      ctx.arc(tx, ty, 60, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(39,68,110,0.07)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(39,68,110,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tx, ty, 40, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(39,68,110,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(39,68,110,0.6)';
      ctx.font = '600 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('评审桌', tx, ty + 5);
      ctx.textAlign = 'left';

      // 4 个座席（上/右/下/左：蓝色在席 / 灰色空缺，与桌相切不重叠）
      const seats = [
        { x: tx, y: ty - 86 },
        { x: tx + 86, y: ty },
        { x: tx, y: ty + 86 },
        { x: tx - 86, y: ty },
      ];
      for (let i = 0; i < 4; i++) {
        const active = i < nn;
        const sx = seats[i].x;
        const sy = seats[i].y;
        ctx.beginPath();
        ctx.arc(sx, sy, 26, 0, Math.PI * 2);
        ctx.fillStyle = active ? BLUE : '#e4e8ef';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = active ? 'rgba(255,255,255,0.9)' : '#d7deea';
        ctx.stroke();
        ctx.fillStyle = active ? '#ffffff' : '#9aa4b5';
        ctx.font = '700 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('R' + (i + 1), sx, sy + 6);
        ctx.textAlign = 'left';
      }

      // 图例（右下）
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, 404, 240, 118, 26, 13);
      ctx.fill();
      ctx.strokeStyle = '#e2e6ee';
      ctx.lineWidth = 1;
      roundRect(ctx, 404, 240, 118, 26, 13);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(418, 253, 6, 0, Math.PI * 2);
      ctx.fillStyle = BLUE;
      ctx.fill();
      ctx.fillStyle = MUTED;
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText('在席', 430, 257);
      ctx.beginPath();
      ctx.arc(462, 253, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#c3cad6';
      ctx.fill();
      ctx.fillText('空缺', 474, 257);

      // 底部说明
      ctx.fillStyle = MUTED;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillText('在席蓝 / 空缺灰', 40, 266);
    };

    // 右图：整体质量指标（图标 + 渐变条 + 数值）
    const drawMetrics = (s: { n: number }, ctx: CanvasRenderingContext2D) => {
      const nn = s.n;
      const coverage = 0.55 + (nn - 2) * 0.18; // 覆盖度 0.73/0.91/1.09(归一)
      const cost = 1 + (nn - 2) * 0.6; // 成本 1.0/1.6/2.2
      const miss = nn === 2 ? 0.27 : nn === 3 ? 0.12 : 0.05; // 漏检风险
      const W2 = 540;
      ctx.clearRect(0, 0, W2, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdf9');
      grad.addColorStop(1, BG);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W2, H);

      ctx.fillStyle = MUTED;
      ctx.font = '600 14px "Microsoft YaHei", sans-serif';
      ctx.fillText('整体质量指标', 40, 32);

      const rows = [
        { label: '整体覆盖', v: coverage, max: 1.2, color: GREEN, icon: '✓', fmt: (v: number) => v.toFixed(2) },
        { label: '审稿成本', v: cost, max: 2.4, color: PURPLE, icon: '¥', fmt: (v: number) => v.toFixed(1) },
        { label: '漏检风险', v: miss, max: 0.3, color: RED, icon: '!', fmt: (v: number) => v.toFixed(2) },
      ];
      rows.forEach((r, i) => {
        const y = 58 + i * 66;
        // 图标圆
        ctx.beginPath();
        ctx.arc(60, y + 15, 15, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(r.icon, 60, y + 20);
        ctx.textAlign = 'left';
        // 标签
        ctx.fillStyle = TEXT;
        ctx.font = '600 14px "Microsoft YaHei", sans-serif';
        ctx.fillText(r.label, 86, y + 20);
        // 底槽
        ctx.fillStyle = '#eef1f6';
        roundRect(ctx, 86, y, 320, 26, 13);
        ctx.fill();
        // 值条（渐变）
        const bw = Math.max(0, Math.min(1, r.v / r.max)) * 320;
        if (bw > 0) {
          const g2 = ctx.createLinearGradient(86, 0, 86 + bw, 0);
          g2.addColorStop(0, r.color);
          g2.addColorStop(1, r.color + 'cc');
          ctx.fillStyle = g2;
          roundRect(ctx, 86, y, bw, 26, 13);
          ctx.fill();
        }
        // 数值
        ctx.fillStyle = r.color;
        ctx.font = '700 17px "Microsoft YaHei", sans-serif';
        ctx.fillText(r.fmt(r.v), 436, y + 21);
      });

      // 底部说明
      ctx.strokeStyle = 'rgba(215,222,234,0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 250);
      ctx.lineTo(500, 250);
      ctx.stroke();
      ctx.fillStyle = MUTED;
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('N 增大：覆盖↑、成本↑、漏检风险↓（论文 §3.3）', 270, 268);
      ctx.textAlign = 'left';
    };

    const tick = () => {
      drawSeats(stateRef.current, ctx1);
      drawMetrics(stateRef.current, ctx2);
      if (!c1.classList.contains('is-ready')) c1.classList.add('is-ready');
      if (!c2.classList.contains('is-ready')) c2.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c1, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nn = Number(e.target.value);
    stateRef.current.n = nn;
    setN(nn);
    if (nn === 2) setFeedback({ text: 'N=2：成本最低，但整体覆盖下降、漏检风险升至 0.27——审稿盲区变大。', cls: 'bad' });
    else if (nn === 3) setFeedback({ text: 'N=3（默认）：覆盖与成本取得平衡，反 skim 三层检查防浅读。', cls: 'good' });
    else setFeedback({ text: 'N=4：覆盖度最高，但成本升至 2.2×——三难困境要求有界，不能无限加人。', cls: '' });
  };

  return (
    <div>
      <div className="dual-canvas">
        <canvas id={`cv-${chapterId}-${moduleId}-seats`} ref={seatsRef} width={540} height={H} />
        <canvas id={`cv-${chapterId}-${moduleId}-met`} ref={metRef} width={540} height={H} />
      </div>
      <div className="ch5-ctrl">
        <span className="ch5-label">审稿人数 N</span>
        <input type="range" min={2} max={4} value={n} onChange={onChange} />
        <span className="ch5-val">{n}</span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

/* ---------------- Ch6：问题路由模拟器（P5 热点） ---------------- */
const CH6_ISSUES = [
  {
    key: 'spell',
    label: '拼写错误',
    type: 'mechanical',
    color: MUTED,
    route: 'polish',
    routeLabel: 'Polish 快速通道',
    routeColor: BLUE,
    reason: '机械性问题：确定性规则直接走低成本 polish 路径。',
  },
  {
    key: 'wording',
    label: '措辞争议',
    type: 'minor-substantive',
    color: ORANGE,
    route: 'polish',
    routeLabel: 'Polish 快速通道',
    routeColor: BLUE,
    reason: '次要实质性问题：不触及主张，走低成本处理。',
  },
  {
    key: 'contradiction',
    label: '跨章节矛盾',
    type: 'contestable substantive-major',
    color: RED,
    route: 'trial',
    routeLabel: '正当程序审判',
    routeColor: PURPLE,
    reason: '可争议的实质性重大问题：进入 due-process trial，由辩护与陪审团裁决。',
  },
];

export const Ch6Routing: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ selected: -1 });
  const [selected, setSelected] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (s: { selected: number }) => {
      ctx.clearRect(0, 0, W, H);

      // 背景：柔和纵向渐变
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdf9');
      grad.addColorStop(1, BG);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 顶部小标题
      ctx.fillStyle = MUTED;
      ctx.font = '600 13px "Microsoft YaHei", sans-serif';
      ctx.fillText('候选问题', 40, 30);

      // 问题卡片（圆角 + 类型色点 + 路由徽标）
      CH6_ISSUES.forEach((iss, i) => {
        const x = 40 + i * 290;
        const y = 46;
        const w = 270;
        const h = 96;
        const isSel = s.selected === i;
        ctx.fillStyle = isSel ? '#ffffff' : '#f6f8fb';
        roundRect(ctx, x, y, w, h, 12);
        ctx.fill();
        ctx.strokeStyle = isSel ? iss.color : '#e2e6ee';
        ctx.lineWidth = isSel ? 2 : 1;
        roundRect(ctx, x, y, w, h, 12);
        ctx.stroke();
        // 类型色点 + 选中光晕
        ctx.fillStyle = iss.color;
        ctx.beginPath();
        ctx.arc(x + 28, y + 30, 10, 0, Math.PI * 2);
        ctx.fill();
        if (isSel) {
          ctx.strokeStyle = iss.color + '44';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(x + 28, y + 30, 16, 0, Math.PI * 2);
          ctx.stroke();
        }
        // 标签与类型
        ctx.fillStyle = TEXT;
        ctx.font = '700 18px "Microsoft YaHei", sans-serif';
        ctx.fillText(iss.label, x + 50, y + 36);
        ctx.fillStyle = MUTED;
        ctx.font = '13px sans-serif';
        ctx.fillText(iss.type, x + 50, y + 64);
        // 路由徽标
        ctx.fillStyle = iss.routeColor + '18';
        roundRect(ctx, x + w - 92, y + h - 30, 80, 20, 10);
        ctx.fill();
        ctx.fillStyle = iss.routeColor;
        ctx.font = '600 11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(iss.route === 'polish' ? '快速通道' : '正当程序', x + w - 52, y + h - 15);
        ctx.textAlign = 'left';
      });

      // 路由目标（圆角卡）
      const dests = [
        { label: 'Polish 快速通道', x: 200, color: BLUE },
        { label: '正当程序审判', x: 600, color: PURPLE },
      ];
      dests.forEach((d) => {
        ctx.fillStyle = d.color;
        roundRect(ctx, d.x, 210, 280, 48, 12);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 17px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, d.x + 140, 241);
        ctx.textAlign = 'left';
      });

      // 选中路径（虚线 + 箭头）
      if (s.selected >= 0) {
        const iss = CH6_ISSUES[s.selected];
        const sx = 40 + s.selected * 290 + 135;
        const dest = iss.route === 'polish' ? { x: 340, y: 210 } : { x: 740, y: 210 };
        ctx.strokeStyle = iss.routeColor;
        ctx.lineWidth = 3.5;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.moveTo(sx, 142);
        ctx.lineTo(dest.x, dest.y);
        ctx.stroke();
        ctx.setLineDash([]);
        // 箭头（指向目标卡上沿）
        ctx.fillStyle = iss.routeColor;
        ctx.beginPath();
        ctx.moveTo(dest.x - 12, dest.y + 12);
        ctx.lineTo(dest.x, dest.y);
        ctx.lineTo(dest.x + 12, dest.y + 12);
        ctx.closePath();
        ctx.fill();
      }
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (i: number) => {
    stateRef.current.selected = i;
    setSelected(i);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {CH6_ISSUES.map((iss, i) => (
          <button
            key={iss.key}
            type="button"
            className={`chip ${selected === i ? 'selected' : ''}`}
            onClick={() => select(i)}
          >
            {iss.label}
          </button>
        ))}
      </div>
      <div className="feedback">
        {selected >= 0 ? CH6_ISSUES[selected].reason : '点击一个候选问题，观察确定性路由的判定。'}
      </div>
    </div>
  );
};
