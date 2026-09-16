import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// mod-harness-intro — Harness 是什么、为什么难更新（第一章 1.1，三区合并）
// A 进展来源：语言模型 ‖ 外围工程组件（三子板块）‖ 最右解释面板，共 5 个可点击板块；
// B 更新之困：人工/自动两条路径，流程图居中，点击「下一步」手动步进（无自动播放）；
// C 中心洞察突出句（模块最底部）。无循环动画。

const W = 1080;
const H = 540;

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
};

// ---------- A 区：进展来源 ----------
type SelA = 'lm' | 'grp' | 0 | 1 | 2;

const A = { y: 44, h: 166 };
const LM = { x: 30, y: A.y, w: 190, h: A.h };
const GRP = { x: 240, y: A.y, w: 430, h: A.h };
const SUB_A = { y: 82, w: 130, h: 64, xs: [250, 390, 530] };
const PANEL = { x: 700, y: A.y, w: 350, h: A.h };

const INTROS: Record<string, { title: string; color: string; lines: string[] }> = {
  lm: {
    title: '语言模型',
    color: C.blue,
    lines: ['进展的底层引擎——决定智能体的推理与代码能力。', '论文保持基座模型固定，只演化外围组件。'],
  },
  grp: {
    title: '外围工程组件',
    color: C.green,
    lines: ['模型之外、可编辑组件的集合，', '与语言模型同等重要，是 AHE 的优化对象。'],
  },
  '0': { title: '系统提示词', color: C.green, lines: ['塑造智能体的工作方式与风格。'] },
  '1': { title: '工具', color: C.green, lines: ['向智能体开放文件系统与 shell。'] },
  '2': { title: '中间件', color: C.green, lines: ['控制上下文、执行与故障恢复。'] },
};

const SUB_LABELS = ['系统提示词', '工具', '中间件'];

// ---------- B 区：更新之困 ----------
type PathKey = 'manual' | 'auto';

const FLOW = { y: 268, h: 52, w: 150, gap: 40 };
const flowXs = (n: number) => {
  const total = n * FLOW.w + (n - 1) * FLOW.gap;
  const x0 = (W - total) / 2;
  return Array.from({ length: n }, (_, i) => x0 + i * (FLOW.w + FLOW.gap));
};

interface PathCfg {
  boxes: string[];
  bottleneck: number[]; // 激活后变红的步骤
  introFb: string;
  stepFb: string[];
  doneFb: string;
}

const MANUAL: PathCfg = {
  boxes: ['运行', '轨迹', '人工分析', '人工修改', '重测'],
  bottleneck: [2, 3],
  introFb: '点击「下一步」逐步推演：注意瓶颈出现在哪两步。',
  stepFb: [
    '第 1 步：运行——用当前 harness 跑任务。',
    '第 2 步：轨迹——得到冗长的运行记录。',
    '第 3 步：人工分析——瓶颈：人逐条阅读轨迹、寻找失败模式。',
    '第 4 步：人工修改——瓶颈：凭经验手工编辑组件。',
    '第 5 步：重测——人工重跑评估，循环往复。',
  ],
  doneFb: '瓶颈在"人"：模型演进越快，人工循环越跟不上。',
};

const AUTO: PathCfg = {
  boxes: ['轨迹', 'Agent 分析', '修改组件'],
  bottleneck: [2],
  introFb: '点击「下一步」逐步推演：两个问题会标在发生位置。',
  stepFb: [
    '第 1 步：轨迹——长而杂乱，可执行的信号被淹没（问题①）。',
    '第 2 步：Agent 分析——自动分析难以从原始轨迹得到可执行信号。',
    '第 3 步：修改组件——框架紧耦合，提示词之外的编辑易错（问题②）。',
  ],
  doneFb: '两个问题叠加，自动更新也会退化为盲目试错。',
};

export const ModHarnessIntro: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    sel: 0 as SelA,
    path: 'manual' as PathKey,
    step: 0,
  });
  const [path, setPath] = useState<PathKey>('manual');
  const [step, setStep] = useState(0);
  const [fb, setFb] = useState(MANUAL.introFb);

  const applyStep = (s: number, p: PathKey) => {
    const cfg = p === 'manual' ? MANUAL : AUTO;
    stateRef.current.step = s;
    setStep(s);
    setFb(s <= 0 ? cfg.introFb : s >= cfg.boxes.length ? cfg.doneFb : cfg.stepFb[s - 1]);
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
    let mountTs = 0;

    const drawArrowHead = (
      x: number,
      y: number,
      angle: number,
      size: number,
      color: string
    ) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - size * Math.cos(angle - 0.42), y - size * Math.sin(angle - 0.42));
      ctx.lineTo(x - size * Math.cos(angle + 0.42), y - size * Math.sin(angle + 0.42));
      ctx.closePath();
      ctx.fill();
    };

    const render = (now: number) => {
      if (!mountTs) mountTs = now;
      const enter = now - mountTs;
      const aIn = (order: number) => clamp((enter - order * 150) / 300, 0, 1);
      const st = stateRef.current;

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ===== A 区：进展来源 =====
      ctx.save();
      ctx.globalAlpha = aIn(0);
      ctx.fillStyle = C.muted;
      ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('进展来源', 30, 24);

      // 列 1：语言模型板块
      {
        const selected = st.sel === 'lm';
        ctx.beginPath();
        ctx.roundRect(LM.x, LM.y, LM.w, LM.h, 10);
        ctx.fillStyle = selected ? lerpColor(C.blue, '#ffffff', 0.86) : C.panel;
        ctx.fill();
        ctx.lineWidth = selected ? 3 : 2;
        ctx.strokeStyle = C.blue;
        ctx.stroke();
        ctx.fillStyle = C.text;
        ctx.font = 'bold 16px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('语言模型', LM.x + LM.w / 2, LM.y + LM.h / 2 + 5);
      }

      // 列 2：外围工程组件容器（含三子板块）
      {
        const grpSel = st.sel === 'grp';
        ctx.beginPath();
        ctx.roundRect(GRP.x, GRP.y, GRP.w, GRP.h, 10);
        ctx.fillStyle = lerpColor(C.green, '#ffffff', grpSel ? 0.82 : 0.93);
        ctx.fill();
        ctx.lineWidth = grpSel ? 3 : 1.5;
        ctx.strokeStyle = C.green;
        ctx.stroke();
        ctx.fillStyle = C.green;
        ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('外围工程组件（模型之外 · 可编辑）', GRP.x + GRP.w / 2, GRP.y + 22);
        SUB_LABELS.forEach((label, i) => {
          const sx = SUB_A.xs[i];
          const selected = st.sel === i;
          ctx.beginPath();
          ctx.roundRect(sx, SUB_A.y, SUB_A.w, SUB_A.h, 8);
          ctx.fillStyle = selected ? lerpColor(C.green, '#ffffff', 0.78) : C.panel;
          ctx.fill();
          ctx.lineWidth = selected ? 3 : 1.8;
          ctx.strokeStyle = C.green;
          ctx.stroke();
          ctx.fillStyle = C.text;
          ctx.font = 'bold 13px "Segoe UI", "PingFang SC", sans-serif';
          ctx.fillText(label, sx + SUB_A.w / 2, SUB_A.y + SUB_A.h / 2 + 4);
        });
      }

      // 列 3：解释面板（最右侧）
      {
        const intro = INTROS[String(st.sel)];
        ctx.beginPath();
        ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 10);
        ctx.fillStyle = C.panel;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = C.border;
        ctx.stroke();
        ctx.fillStyle = intro.color;
        ctx.font = 'bold 15px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(intro.title, PANEL.x + 20, PANEL.y + 28);
        ctx.fillStyle = C.text;
        ctx.font = '13px "Segoe UI", "PingFang SC", sans-serif';
        intro.lines.forEach((line, i) => {
          ctx.fillText(line, PANEL.x + 20, PANEL.y + 52 + i * 22);
        });
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PANEL.x + 16, PANEL.y + 96);
        ctx.lineTo(PANEL.x + PANEL.w - 16, PANEL.y + 96);
        ctx.stroke();
        // 结论行（两行，harness 蓝色加粗）
        ctx.fillStyle = C.text;
        ctx.font = '12.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText('这些模型之外、可编辑的组件统称为', PANEL.x + 20, PANEL.y + 118);
        const t1 = 'agent 的 ';
        const t2 = 'harness';
        const t3 = ' —— 与语言模型同等重要。';
        ctx.fillText(t1, PANEL.x + 20, PANEL.y + 140);
        const w1 = ctx.measureText(t1).width;
        ctx.fillStyle = C.blue;
        ctx.font = 'bold 12.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(t2, PANEL.x + 20 + w1, PANEL.y + 140);
        const w2 = ctx.measureText(t2).width;
        ctx.fillStyle = C.text;
        ctx.font = '12.5px "Segoe UI", "PingFang SC", sans-serif';
        ctx.fillText(t3, PANEL.x + 20 + w1 + w2, PANEL.y + 140);
      }
      ctx.restore();

      // A/B 分隔线
      ctx.save();
      ctx.globalAlpha = aIn(1) * 0.7;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 228);
      ctx.lineTo(1050, 228);
      ctx.stroke();
      ctx.restore();

      // ===== B 区：更新之困（手动步进） =====
      const cfg = st.path === 'manual' ? MANUAL : AUTO;
      const n = cfg.boxes.length;
      const xs = flowXs(n);
      const stepNow = st.step;

      ctx.save();
      ctx.globalAlpha = aIn(1);
      ctx.fillStyle = C.muted;
      ctx.font = 'bold 12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('更新之困 · 点击「下一步」逐步推演', 30, 250);

      for (let i = 0; i < n; i++) {
        const bx = xs[i];
        const active = i < stepNow;
        const isBott = cfg.bottleneck.includes(i);
        const color = !active ? C.steel : isBott ? C.red : C.blue;
        ctx.beginPath();
        ctx.roundRect(bx, FLOW.y, FLOW.w, FLOW.h, 8);
        ctx.fillStyle = active ? lerpColor(color, '#ffffff', 0.88) : C.panel;
        ctx.fill();
        ctx.lineWidth = i === stepNow - 1 ? 3 : 2;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.fillStyle = active ? C.text : C.muted;
        ctx.font = `${active ? 'bold ' : ''}13px "Segoe UI", "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(cfg.boxes[i], bx + FLOW.w / 2, FLOW.y + 31);
        // 箭头
        if (i < n - 1) {
          const ax1 = bx + FLOW.w + 5;
          const ax2 = xs[i + 1] - 5;
          const aColor = i + 1 <= stepNow - 1 ? C.blue : C.border;
          ctx.strokeStyle = aColor;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(ax1, FLOW.y + FLOW.h / 2);
          ctx.lineTo(ax2 - 2, FLOW.y + FLOW.h / 2);
          ctx.stroke();
          drawArrowHead(ax2, FLOW.y + FLOW.h / 2, 0, 6, aColor);
        }
        // 瓶颈标注
        if (active && isBott) {
          if (st.path === 'manual') {
            ctx.fillStyle = C.red;
            ctx.font = 'bold 11px "Segoe UI", "PingFang SC", sans-serif';
            ctx.fillText('瓶颈', bx + FLOW.w / 2, FLOW.y + FLOW.h + 16);
          } else {
            ctx.fillStyle = C.red;
            ctx.beginPath();
            ctx.arc(bx + FLOW.w - 4, FLOW.y - 4, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px "Segoe UI", "PingFang SC", sans-serif';
            ctx.fillText('②', bx + FLOW.w - 4, FLOW.y);
          }
        }
      }

      // 人工：顶部回环小弧（重测 → 运行）
      if (st.path === 'manual') {
        const done = stepNow >= n;
        const arcColor = done ? C.blue : C.border;
        ctx.strokeStyle = arcColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(xs[4] + FLOW.w / 2, FLOW.y - 5);
        ctx.quadraticCurveTo(W / 2, FLOW.y - 32, xs[0] + FLOW.w / 2, FLOW.y - 5);
        ctx.stroke();
        drawArrowHead(xs[0] + FLOW.w / 2, FLOW.y - 3, Math.PI / 2, 6, arcColor);
      }

      // 自动：问题①标记在"轨迹→Agent 分析"边上
      if (st.path === 'auto' && stepNow >= 2) {
        const mx = (xs[0] + FLOW.w + xs[1]) / 2;
        ctx.fillStyle = C.red;
        ctx.beginPath();
        ctx.arc(mx, FLOW.y + FLOW.h / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('①', mx, FLOW.y + FLOW.h / 2 + 4);
      }

      // 问题卡（推演完成时出现，一行大字）
      if (stepNow >= n) {
        ctx.font = '15px "Segoe UI", "PingFang SC", sans-serif';
        if (st.path === 'manual') {
          ctx.beginPath();
          ctx.roundRect(30, 352, 1020, 40, 8);
          ctx.fillStyle = C.panel;
          ctx.fill();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = C.red;
          ctx.stroke();
          ctx.fillStyle = C.text;
          ctx.textAlign = 'center';
          ctx.fillText(
            '基座模型演进越快，人工循环越跟不上——模型能力与 harness 之间的缺口不断扩大。',
            W / 2,
            378
          );
        } else {
          const cards = [
            '① 长而杂乱的轨迹中，可执行的信号被淹没。',
            '② harness 框架紧耦合，提示词之外的编辑容易出错。',
          ];
          cards.forEach((text, i) => {
            const cx = 30 + i * 520;
            ctx.beginPath();
            ctx.roundRect(cx, 352, 500, 40, 8);
            ctx.fillStyle = C.panel;
            ctx.fill();
            ctx.lineWidth = 1.8;
            ctx.strokeStyle = C.red;
            ctx.stroke();
            ctx.fillStyle = C.text;
            ctx.textAlign = 'center';
            ctx.fillText(text, cx + 250, 378);
          });
        }
      }
      ctx.restore();

      // B/C 分隔线
      ctx.save();
      ctx.globalAlpha = aIn(2) * 0.7;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 412);
      ctx.lineTo(1050, 412);
      ctx.stroke();
      ctx.restore();

      // ===== C 区：中心洞察（模块最底部） =====
      ctx.save();
      ctx.globalAlpha = aIn(2);
      ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
      const label = '中心洞察';
      const lw = ctx.measureText(label).width + 24;
      ctx.beginPath();
      ctx.roundRect((W - lw) / 2, 424, lw, 24, 12);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.blue;
      ctx.stroke();
      ctx.fillStyle = C.blue;
      ctx.textAlign = 'center';
      ctx.fillText(label, W / 2, 440);

      const f1 = '22px "Segoe UI", "PingFang SC", sans-serif';
      const f2 = 'bold 26px "Segoe UI", "PingFang SC", sans-serif';
      const s1 = 'Harness 自动演化的瓶颈在于 ';
      const s2 = '可观测性';
      const s3 = '，而非智能体能力。';
      ctx.font = f1;
      const sw1 = ctx.measureText(s1).width;
      const sw3 = ctx.measureText(s3).width;
      ctx.font = f2;
      const sw2 = ctx.measureText(s2).width;
      const sx = (W - sw1 - sw2 - sw3) / 2;
      ctx.textAlign = 'left';
      ctx.font = f1;
      ctx.fillStyle = C.text;
      ctx.fillText(s1, sx, 484);
      ctx.font = f2;
      ctx.fillStyle = C.blue;
      ctx.fillText(s2, sx + sw1, 484);
      ctx.font = f1;
      ctx.fillStyle = C.text;
      ctx.fillText(s3, sx + sw1 + sw2, 484);

      ctx.fillStyle = C.muted;
      ctx.font = '14px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        '只要给演化智能体清晰动作空间上的结构化上下文，它就能可靠收敛到更好的 harness 设计。',
        W / 2,
        514
      );
      ctx.restore();
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

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    // A 区：子板块优先，再语言模型，再容器
    for (let i = 0; i < 3; i++) {
      const sx = SUB_A.xs[i];
      if (x >= sx && x <= sx + SUB_A.w && y >= SUB_A.y && y <= SUB_A.y + SUB_A.h) {
        stateRef.current.sel = i as SelA;
        return;
      }
    }
    if (x >= LM.x && x <= LM.x + LM.w && y >= LM.y && y <= LM.y + LM.h) {
      stateRef.current.sel = 'lm';
      return;
    }
    if (x >= GRP.x && x <= GRP.x + GRP.w && y >= GRP.y && y <= GRP.y + GRP.h) {
      stateRef.current.sel = 'grp';
      return;
    }
    // B 区流程框：点击跳到对应步
    const cfg = stateRef.current.path === 'manual' ? MANUAL : AUTO;
    const xs = flowXs(cfg.boxes.length);
    for (let i = 0; i < cfg.boxes.length; i++) {
      if (x >= xs[i] && x <= xs[i] + FLOW.w && y >= FLOW.y && y <= FLOW.y + FLOW.h) {
        applyStep(i + 1, stateRef.current.path);
        return;
      }
    }
  };

  const selectPath = (p: PathKey) => {
    stateRef.current.path = p;
    setPath(p);
    applyStep(0, p);
  };

  const nextStep = () => {
    const p = stateRef.current.path;
    const cfg = p === 'manual' ? MANUAL : AUTO;
    applyStep(Math.min(stateRef.current.step + 1, cfg.boxes.length), p);
  };

  const replay = () => {
    applyStep(0, stateRef.current.path);
  };

  const nBoxes = path === 'manual' ? MANUAL.boxes.length : AUTO.boxes.length;

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
          <button
            type="button"
            className={`chip${path === 'manual' ? ' selected' : ''}`}
            onClick={() => selectPath('manual')}
          >
            人工 Harness 更新
          </button>
          <button
            type="button"
            className={`chip${path === 'auto' ? ' selected' : ''}`}
            onClick={() => selectPath('auto')}
          >
            自动更新
          </button>
        </div>
        <div className="step-ctrl">
          <button type="button" className="tiny" onClick={nextStep} disabled={step >= nBoxes}>
            下一步
          </button>
          <button type="button" className="tiny ghost" onClick={replay}>
            重新推演
          </button>
        </div>
      </div>
      <div className="feedback">{fb}</div>
    </div>
  );
};

export default ModHarnessIntro;
