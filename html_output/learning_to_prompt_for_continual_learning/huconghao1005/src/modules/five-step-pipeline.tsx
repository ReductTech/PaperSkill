import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  LP,
  LP_LW,
  LP_LW_EMPH,
  lpFont,
  lpRoundRect,
  drawField,
  drawTypeCase,
  drawTag,
  drawStick,
  drawPress,
  drawSheet,
  drawLabel,
  drawLink,
} from './letterpressKit';

// chap-6 / 6.1 五步流水线 — 主导操作 P3 步进（5 步）。
// 一条推理从原稿走到样张；第 5 步只留版头那 25 行，196 块 patch 行与 [class] 行一起退到 25%。
// 形状读数取自论文：L = 196、D = 768；版头 N·L_p = 5 × 5 = 25 行，池中 M = 10（§5.2，5-datasets 为 20）。
// 行序照 Eq.2：N·L_p 行 prompt 在最前，[class] 行紧随其后，196 行 patch 在最后 → 共 222 行。
// 右侧序列面板只画少量格子示意行序，不逐行画出这 222 行。

const WD = 1080;
const HD = 380;
const WA = 560;
const HA = 140;

const L = 196; // patch 数
const D = 768; // 嵌入维度
const LP_ = 5; // 单条 prompt 行数
const N = 5; // 本次挑中的 prompt 条数（top-N）
const M_POOL = 10; // 池中 prompt 总数（§5.2：CIFAR-100 系列 / CORe50 为 10，5-datasets 为 20）
const HEADROWS = N * LP_; // 25
const SEQ = HEADROWS + 1 + L; // 222 = 25 行版头 + 1 行 [class] + 196 行 patch
const XE = 1 + L; // 197 = 主干输入 x_e：[class] + 196 行 patch

const STEP_LABEL = ['备料', '取 q(x)', '选料', '调味', '翻炒', '出锅'];

const STAGE_X = 40;
const STAGE_W = 680;
const CARD_W = (STAGE_W - 4 * 12) / 5;
const CARD_H = 200;
const CARD_Y = 72;
const RX = 760;
const RW = 280;

interface St {
  step: number; // 0..5
  press: number; // 压板下压 0..1
}

export const FiveStepPipeline: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const isAna = moduleId === 'ana';
  const W = isAna ? WA : WD;
  const H = isAna ? HA : HD;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<St>({ step: 0, press: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '点“下一步”推进五个阶段。',
    cls: '',
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

    const renderAna = (s: St, t: number) => {
      const phase = (t / 2000) % 1;
      const stepLabels = ['备料', '选料', '调味', '翻炒', '出锅'];
      const currentStep = Math.floor(phase * 5);
      drawField(ctx, 0, 0, W, H);
      // 五个步骤卡片
      for (let i = 0; i < 5; i++) {
        const x = 30 + i * 102;
        const on = i === currentStep;
        ctx.fillStyle = on ? '#fffdf8' : LP.light;
        ctx.strokeStyle = on ? LP.accent : LP.dark;
        ctx.lineWidth = on ? 2.5 : 1.5;
        lpRoundRect(ctx, x, 30, 88, 60, 6, true, true);
        // 步骤图标（简单的厨房元素）
        ctx.save();
        ctx.fillStyle = on ? LP.accent : LP.muted;
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = ['🥬', '🧂', '✨', '🍳', '🍽️'];
        ctx.fillText(icons[i], x + 44, 52);
        ctx.restore();
        // 步骤名
        drawLabel(ctx, stepLabels[i], x + 22, 78, {
          size: 11,
          weight: 600,
          color: on ? LP.accent : LP.muted,
        });
      }
      // 箭头连接
      ctx.save();
      ctx.strokeStyle = LP.dark;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const x = 118 + i * 102;
        ctx.beginPath();
        ctx.moveTo(x, 60);
        ctx.lineTo(x + 12, 60);
        ctx.stroke();
        // 箭头
        ctx.beginPath();
        ctx.moveTo(x + 12, 60);
        ctx.lineTo(x + 8, 56);
        ctx.moveTo(x + 12, 60);
        ctx.lineTo(x + 8, 64);
        ctx.stroke();
      }
      ctx.restore();
      drawLabel(ctx, `第 ${currentStep + 1} 步：${stepLabels[currentStep]}`, 200, 115, {
        size: 13,
        color: LP.accent,
      });
    };

    const renderNormal = (s: St) => {
      drawField(ctx, 0, 0, W, H);

      // ---- 原稿（手上那叠稿子）
      drawLabel(ctx, '食材', 46, 44, { size: 12, color: LP.muted });
      drawSheet(ctx, 120, 26, 46, 34, { lines: 3, blank: false });

      // ---- 五个阶段卡
      for (let k = 0; k < 5; k++) {
        const x = STAGE_X + k * (CARD_W + 12);
        const stageNo = k + 1;
        const done = stageNo < s.step;
        const active = stageNo === s.step;
        ctx.save();
        ctx.globalAlpha = done ? 0.6 : 1;
        ctx.fillStyle = '#fffefb';
        ctx.strokeStyle = active ? LP.guide : LP.dark;
        ctx.lineWidth = active ? LP_LW_EMPH : LP_LW;
        lpRoundRect(ctx, x, CARD_Y, CARD_W, CARD_H, 8, true, true);
        ctx.restore();

        // 卡片里的对象
        const ix = x + 10;
        const iy = CARD_Y + 30;
        const iw = CARD_W - 20;

        if (k === 0) {
          drawSheet(ctx, ix + 8, iy, iw - 16, 96, { lines: 4, blank: false });
          drawLabel(ctx, `${L}×${D}`, ix + 8, iy + 118, { size: 11, color: LP.muted });
        } else if (k === 1) {
          drawTypeCase(ctx, ix, iy, iw, 44, {
            cols: 1,
            rows: 1,
            fill: LP.aux,
            cellText: 'q(x)',
            gap: 0,
          });
          drawLabel(ctx, `1×${D}`, ix, iy + 118, { size: 11, color: LP.muted });
        } else if (k === 2) {
          for (let j = 0; j < 4; j++) {
            drawTag(ctx, ix, iy + j * 26, iw, 20, {
              text: `k${j + 1}`,
              hit: j < 2,
              fill: j < 2 ? LP.light : LP.bg,
            });
          }
          drawLabel(ctx, `M${M_POOL}→N${N}`, ix, iy + 118, { size: 11, color: LP.muted });
        } else if (k === 3) {
          drawStick(ctx, ix, iy + 20, iw, 56, {
            slots: N,
            faces: ['P1', 'P2', 'P3', 'P4', 'P5'],
            lit: [0, 1, 2, 3, 4],
          });
          drawLabel(ctx, `共 ${SEQ} 行`, ix, iy + 118, { size: 11, color: LP.muted });
        } else {
          const p = clamp(s.press, 0, 1);
          drawPress(ctx, ix, iy + 8, iw, 26, { press: p, active: active });
          drawSheet(ctx, ix + 10, iy + 46 + p * 10, iw - 20, 56, {
            result: s.step >= 5 ? '出锅 0.87' : undefined,
            tone: 'good',
            lines: 3,
            blank: s.step < 5,
          });
          drawLabel(ctx, s.step >= 5 ? '1×12' : '—', ix, iy + 118, {
            size: 11,
            color: s.step >= 5 ? LP.ink : LP.muted,
          });
        }

        drawLabel(ctx, STEP_LABEL[stageNo], x + 10, CARD_Y + 20, {
          size: 12,
          weight: active ? 700 : 500,
          color: active ? LP.guide : done ? LP.muted : LP.ink,
        });
      }

      // ---- 右：形状读数（每步一张序列示意）
      lpRoundRect(ctx, RX, CARD_Y, RW, CARD_H, 8, false, true);
      drawLabel(ctx, '序列示意', RX + 12, CARD_Y + 20, { size: 12, color: LP.muted });
      const rw = RW - 24;
      const rh = 26;
      if (s.step < 3) {
        drawTypeCase(ctx, RX + 12, CARD_Y + 34, rw, rh, {
          cols: 8,
          rows: 1,
          gap: 3,
          fill: LP.dark,
          cellText: (r, c) => (c === 0 ? 'C' : ''),
        });
        drawLabel(ctx, `0..${XE - 1}`, RX + 12, CARD_Y + 78, { size: 11, color: LP.muted });
        drawLabel(ctx, `序列 ${XE}`, RX + 12, CARD_Y + 104, { size: 13, color: LP.ink });
      } else {
        // 行序照 Eq.2：版头 N·L_p 行在最前，[class] 行紧随其后，196 行 patch 在最后。
        // 格子只是示意，不逐行画出这 222 行。
        const headCount = 5;
        const patchCount = 5;
        const cellCount = headCount + 1 + patchCount;
        const headEndX = RX + 12 + headCount * (rw / cellCount);
        for (let i = 0; i < cellCount; i++) {
          const isHead = i < headCount;
          const isClass = i === headCount;
          const x = RX + 12 + i * (rw / cellCount);
          const w = rw / cellCount - 3;
          // 池化只取版头那段 x_p[0:N·L_p, :]：[class] 行与 patch 行一起淡出
          const fade = s.step >= 5 && !isHead;
          ctx.save();
          ctx.globalAlpha = fade ? 0.25 : 1;
          ctx.fillStyle = isHead ? LP.accent : LP.dark;
          ctx.strokeStyle = LP.dark;
          ctx.lineWidth = 1;
          lpRoundRect(ctx, x, CARD_Y + 34, w, rh, 2, true, true);
          ctx.restore();
          if (isClass) {
            drawLabel(ctx, 'C', x + 2, CARD_Y + 50, { size: 10, color: LP.ink });
          }
        }
        drawLabel(ctx, `0..${SEQ - 1}`, RX + 12, CARD_Y + 78, {
          size: 11,
          color: LP.muted,
        });
        drawLabel(ctx, `序列 ${SEQ}`, RX + 12, CARD_Y + 104, {
          size: 13,
          color: LP.ink,
        });
        if (s.step >= 5) {
          drawLink(ctx, headEndX + 6, CARD_Y + 128, RX + rw - 20, CARD_Y + 128, {
            color: LP.accent,
            width: LP_LW_EMPH,
            arrow: true,
          });
          drawLabel(ctx, `池化 ${HEADROWS}`, RX + 70, CARD_Y + 150, {
            size: 12,
            color: LP.accent,
          });
          drawLabel(ctx, `1×${D}`, RX + rw - 34, CARD_Y + 150, {
            size: 12,
            color: LP.ink,
          });
        } else {
          drawLabel(ctx, '未池化', RX + 12, CARD_Y + 150, { size: 12, color: LP.muted });
        }
      }

      // ---- 底部：这一步发生了什么
      const stripY = 286;
      ctx.save();
      ctx.fillStyle = '#efece2';
      ctx.strokeStyle = LP.dark;
      ctx.lineWidth = LP_LW;
      lpRoundRect(ctx, 40, stripY, 1000, 42, 6, true, true);
      ctx.font = lpFont(14, 500);
      ctx.fillStyle = LP.ink;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const line = [
        `第 ${s.step} 步 · ${STEP_LABEL[s.step]}：食材整块进机，${L} 行 patch。`,
        `第 ${s.step} 步 · ${STEP_LABEL[s.step]}：主干第 0 行就是 q(x)，一行 ${D} 维。`,
        `第 ${s.step} 步 · ${STEP_LABEL[s.step]}：q(x) 与池中 M = ${M_POOL} 种调料比距离，只取最近 ${N} 种。`,
        `第 ${s.step} 步 · ${STEP_LABEL[s.step]}：调料 ${HEADROWS} 行插到最前，序列 ${XE} → ${SEQ}。`,
        `第 ${s.step} 步 · ${STEP_LABEL[s.step]}：冻结主干做一次前向，菜出锅了。`,
        `第 ${s.step} 步 · ${STEP_LABEL[s.step]}：只品菜调料 ${HEADROWS} 行 → 出锅。`,
      ][clamp(s.step, 0, 5)];
      ctx.fillText(line, 54, stripY + 22);
      ctx.restore();
    };

    const tick = (t: number) => {
      const s = stateRef.current;
      if (s.step >= 4) s.press = clamp(s.press + 0.06, 0, 1);
      else s.press = 0;
      if (isAna) renderAna(s, t);
      else renderNormal(s);
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
  }, [W, H, isAna]);

  const setTo = (next: number) => {
    const v = clamp(next, 0, 5);
    stateRef.current = { ...stateRef.current, step: v, press: v >= 4 ? stateRef.current.press : 0 };
    setStep(v);
    if (v === 0) {
      setFeedback({ text: '点“下一步”推进五个阶段。', cls: '' });
    } else if (v === 1) {
      setFeedback({ text: '记录员交出一行 768 维的自我描述。', cls: 'good' });
    } else if (v === 3) {
      setFeedback({
        text: `调料 ${HEADROWS} 行插到最前，[class] 行紧随其后：序列从 ${XE}（[class] + 196 patch）变成 ${SEQ}。`,
        cls: 'good',
      });
    } else if (v === 5) {
      setFeedback({
        text: `只品菜调料 ${HEADROWS} 行（x_p[0:N·L_p,:]）→ 出锅。`,
        cls: 'good',
      });
    } else if (v === 2) {
      setFeedback({
        text: `q(x) 跟池中 M = ${M_POOL} 条 key 比距离，挑出最近的 N = ${N} 条（CIFAR-100 系列；5-datasets 是 M = 20、N = 4）。`,
        cls: '',
      });
    } else {
      setFeedback({ text: '冻结的主干做一次前向，墨压到纸上。', cls: '' });
    }
  };

  if (isAna) {
    return (
      <div>
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      </div>
    );
  }

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" onClick={() => setTo(step - 1)} disabled={step <= 0}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{step}</b> / 5 步 · {STEP_LABEL[step]}
        </span>
        <button className="tiny" onClick={() => setTo(step + 1)} disabled={step >= 5}>
          下一步
        </button>
        <button className="tiny ghost" onClick={() => setTo(0)}>
          重置
        </button>
      </div>
      <div className="step-desc">
        调料行数读的是 x_p 最前面那 {HEADROWS} 行（[class] 行接在调料后面）：出锅只尝这几行，不看 196 行
        patch，也不看 [class] 行。
      </div>
      <div className="metrics">
        <div className="metric">
          <span className="l">patch 行数</span>
          <span className="v">{L}</span>
        </div>
        <div className="metric">
          <span className="l">调料行数</span>
          <span className="v">{step >= 3 ? HEADROWS : 0}</span>
        </div>
        <div className="metric">
          <span className="l">出锅尝的维度</span>
          <span className="v">{step >= 5 ? D : '—'}</span>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default FiveStepPipeline;
