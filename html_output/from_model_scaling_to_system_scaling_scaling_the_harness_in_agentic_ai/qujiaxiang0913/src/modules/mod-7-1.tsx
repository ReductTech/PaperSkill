import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  C,
  clearScene,
  drawBeam,
  drawBars,
  drawNode,
  drawArrow,
  drawLegend,
  drawSceneLabel,
  panelStroke,
} from './lighthouseKit';
import type { WidgetProps } from './registry';

// Module 7.1 — 关掉校验会怎样（P2 步进 + 校验开关 chip）。
// 四步：1 选择技能 → 2 派发执行 → 3 后置条件检查 → 4 写回记忆。
//
// Layout: step strip on top; below it a single dispatch scene panel —
// 𝒮 emits a beam rightwards, the 𝒢 gate sits mid-beam, the beam lands on
// 外部世界, and a result marker on the far right tells whether anyone
// actually confirmed it. Two evidence bars at the bottom.

const W = 1080;
const H = 340;
const STEPS = ['1 选择技能', '2 派发执行', '3 后置条件检查', '4 写回记忆'];

// dispatch scene geometry (inside panel 40..1040 / 84..234)
const AX = 190; // beam origin x
const AY = 160; // beam axis y
const REACH = 510; // beam length -> tip at 700, landing on the 外部世界 node
const SPREAD = 0.24; // narrow enough that the wedge stays inside the panel
const GX = 470; // 𝒢 gate position
const RX = 910; // result marker
const PHASE_AT_GATE = (GX - AX) / REACH;

export const Mod71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 1, verify: true, t: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(1);
  const [verify, setVerify] = useState(true);
  const [feedback, setFeedback] = useState({ text: '点击"下一步"，走完一次技能调用。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { step: number; verify: boolean; t: number }) => {
      clearScene(ctx, W, H);

      // ---- top: four step chips -------------------------------------------
      const nx = 40,
        ny = 16,
        nw = 240,
        nh = 42,
        gap = 20;
      STEPS.forEach((label, i) => {
        const idx = i + 1;
        let st: 'done' | 'active' | 'todo' | 'skipped' = 'todo';
        if (idx < s.step) st = 'done';
        else if (idx === s.step) st = s.verify || idx !== 3 ? 'active' : 'skipped';
        drawNode(ctx, nx + i * (nw + gap), ny, nw, nh, label, st);
      });

      // ---- middle: one dispatch, from 𝒮 to the outside world ---------------
      panelStroke(ctx, 40, 84, 1000, 150, C.line);
      drawSceneLabel(ctx, 40, 68, '信号派发');

      const dispatched = s.step >= 2;

      // 𝒮 — the sender
      drawNode(ctx, 60, 138, 120, 44, '𝒮 发出', dispatched ? 'done' : 'active');

      // the beam itself
      ctx.save();
      ctx.globalAlpha = dispatched ? 1 : 0.22;
      drawBeam(ctx, AX, AY, 0, SPREAD, REACH, C.beam);
      ctx.restore();

      // 𝒢 — post-condition gate, sitting on the beam
      const gateOn = s.step >= 3 && s.verify;
      const gateOff = s.step >= 3 && !s.verify;
      const gateColor = gateOn ? C.hit : gateOff ? C.miss : C.line;
      ctx.save();
      ctx.strokeStyle = gateColor;
      ctx.lineWidth = gateOn || gateOff ? 2.6 : 1.6;
      if (!gateOn && !gateOff) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(GX, AY, 19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (gateOn) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(GX - 8, AY);
        ctx.lineTo(GX - 2, AY + 6);
        ctx.lineTo(GX + 8, AY - 6);
        ctx.stroke();
      } else if (gateOff) {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(GX - 9, AY + 9);
        ctx.lineTo(GX + 9, AY - 9);
        ctx.stroke();
      }
      ctx.restore();
      drawSceneLabel(ctx, GX - 30, 210, gateOff ? '𝒢 已关闭' : '𝒢 校验中');

      // travelling pulse — only while the action is in flight
      if (dispatched) {
        const phase = s.step >= 4 ? 1 : (s.t % 1800) / 1800;
        const px = AX + REACH * phase;
        const confirmed = s.verify && phase >= PHASE_AT_GATE;
        ctx.fillStyle = confirmed ? C.hit : C.beam;
        ctx.beginPath();
        ctx.arc(px, AY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // the outside world — what the action actually touched
      const targetState: 'done' | 'active' | 'todo' | 'skipped' =
        s.step >= 4 ? (s.verify ? 'done' : 'skipped') : s.step >= 2 ? 'active' : 'todo';
      drawNode(ctx, 700, 138, 140, 44, '外部世界', targetState);
      drawArrow(ctx, 846, AY, 882, AY, C.inkMuted);

      // result marker — did anyone confirm it?
      ctx.save();
      if (s.step >= 4) {
        ctx.strokeStyle = s.verify ? C.hit : C.miss;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(RX, AY, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (s.verify) {
          ctx.moveTo(RX - 8, AY);
          ctx.lineTo(RX - 2, AY + 6);
          ctx.lineTo(RX + 8, AY - 6);
        } else {
          ctx.moveTo(RX - 7, AY - 7);
          ctx.lineTo(RX + 7, AY + 7);
          ctx.moveTo(RX + 7, AY - 7);
          ctx.lineTo(RX - 7, AY + 7);
        }
        ctx.stroke();
      } else {
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(RX, AY, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
      drawSceneLabel(ctx, RX - 44, 210, s.step >= 4 ? (s.verify ? '已确认' : '无人核对') : '等待结果');

      // ---- bottom: evidence bars + legend ---------------------------------
      drawBars(ctx, 380, 268, 660, [
        { label: '推进速度', value: s.verify ? 0.55 : 0.72, color: C.mark },
        { label: '结果可靠性', value: s.verify ? 0.85 : 0.32, color: C.hit },
      ]);
      drawLegend(ctx, 40, 274, [
        { color: C.hit, label: '已校验' },
        { color: C.miss, label: '未校验' },
        { color: C.beam, label: '𝒮 信号' },
      ]);

      ctx.font = '12px "Segoe UI","Microsoft YaHei",sans-serif';
      ctx.fillStyle = C.inkMuted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('条形为示意值，非论文实测', 380, 248);
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

  const setFb = (s: number, v: boolean) => {
    if (s === 1) setFeedback({ text: '先选一个技能：选错和没校验是两种不同的失败。', cls: '' });
    else if (s === 2)
      setFeedback({
        text: v ? '已派发，脉冲正穿过 𝒢 门控，等待后置条件检查。' : '已派发——𝒢 门控是关的，脉冲直接穿过去了。',
        cls: v ? '' : 'bad',
      });
    else if (s === 3)
      setFeedback({
        text: v ? '检查通过，才允许写回。' : '这一步被跳过——看起来推进得更快，但没人知道它对不对。',
        cls: v ? 'good' : 'bad',
      });
    else
      setFeedback({
        text: v ? '检查通过，结果已写回可信记忆。' : '未经验证的结果被写进了记忆，污染会在后面几轮才暴露。',
        cls: v ? 'good' : 'bad',
      });
  };

  const onNext = () => {
    const s = Math.min(4, step + 1);
    stateRef.current.step = s;
    setStep(s);
    setFb(s, verify);
  };
  const onReset = () => {
    stateRef.current.step = 1;
    setStep(1);
    setFeedback({ text: '点击"下一步"，走完一次技能调用。', cls: '' });
  };
  const onToggle = () => {
    const v = !verify;
    stateRef.current.verify = v;
    setVerify(v);
    setFb(step, v);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <span className="step">
          第 {step} 步 / 共 4 步{!verify && step === 3 ? '：跳过检查（未开启校验）' : ''}
        </span>
        <button type="button" onClick={onNext} disabled={step >= 4}>
          下一步
        </button>
        <button type="button" onClick={onReset}>
          重置
        </button>
        <span className={`chip ${verify ? 'on' : 'off'}`} onClick={onToggle} role="button">
          校验开关：{verify ? '开启' : '关闭'}
        </span>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod71;
