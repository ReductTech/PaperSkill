import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { KIT, dHand, dLabel, dLegend, dTileGround, dTimeline } from './ditron-theme-kit';

// §6 module 1 — 编译流水线单步.
// Six fixed stages from the user program to the resident MegaKernel; the step
// buttons (or ArrowLeft / ArrowRight on the container) advance one stage at a time.
// Only the last stage fuses the communication and compute lanes into one band,
// which is the whole point of the module.

const W = 1080;
const H = 280;

type FeedbackCls = '' | 'good' | 'bad';

interface Feedback {
  text: string;
  cls: FeedbackCls;
}

const STEPS: string[] = [
  '三级接口',
  '前端分流',
  '中端重排',
  '后端降级',
  '任务注册',
  'MegaKernel 融合',
];

// Full artifact names for the DOM line; the canvas shows the short form only.
const ARTIFACTS: string[] = [
  'Triton 程序',
  'TTIR / TTGIR · 分布式中间表示',
  'new_pid',
  'LLVM IR',
  'wait_deps / release_tile',
  'MegaKernel',
];

const ARTIFACT_SHORT: string[] = [
  'Triton 程序',
  '分布式 IR',
  'new_pid',
  'LLVM IR',
  'wait_deps',
  'MegaKernel',
];

const STEP_FEEDBACK: string[] = [
  '第 1 步：用户用 Triton 风格的三级接口描述算子，核级、设备级、任务级各管一层。',
  '第 2 步：单设备语义（dot、load/store）下沉到 TTIR 与 TTGIR，分布式语义下沉到遵循 OpenSHMEM 的分布式中间表示。',
  '第 3 步：中端注入 swizzle，把 old_pid 换成 new_pid，起铺点取 rank mod local_world_size。',
  '第 4 步：分布式中间表示降到 LLVM IR，通过 CallExtern 链接 NVSHMEM（NVIDIA）或 rocSHMEM（AMD）。',
  '第 5 步：Triton 核注册为任务，依赖被记录，编译期由软件记分板用 wait_deps 与 release_tile 调度。',
  '第 6 步：通信核与计算核融合成一个常驻 MegaKernel，消除重复启动开销。',
];

// The finished pipeline is the only state that carries an evidence-backed result.
const DONE_FEEDBACK: Feedback = {
  text:
    '单 batch 推理下分布式 MegaKernel 相对 Torch Eager 几何加速 6.28×、相对 Mirage 1.73×、相对 vLLM 1.10×（8×H800，Qwen3-8B/32B 与 LLaMA-70B，延迟越低越好）。',
  cls: 'good',
};

const LAST_STEP = STEPS.length - 1;

const BLOCK_X = 48;
const BLOCK_W = 145;
const BLOCK_H = 72;
const BLOCK_Y = 56;
const BLOCK_GAP = 22;
const PITCH = BLOCK_W + BLOCK_GAP;
const CENTER_Y = BLOCK_Y + BLOCK_H / 2;

const LANE_X = 636;
const LANE_Y = 176;
const LANE_W = 396;
const LANE_H = 84;

export const M61PipelineSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef(0);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>({ text: STEP_FEEDBACK[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const blockPath = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, 4);
      else ctx.rect(x, y, w, h);
    };

    const render = (current: number, time: number) => {
      const t = time / 1000;
      const accent = current === LAST_STEP ? KIT.success : KIT.guidance;
      dTileGround(ctx, W, H);

      // six stage blocks: passed stages stay quiet, the current one is tinted
      for (let i = 0; i < STEPS.length; i += 1) {
        const x = BLOCK_X + i * PITCH;
        blockPath(x, BLOCK_Y, BLOCK_W, BLOCK_H);
        ctx.fillStyle = KIT.quiet;
        ctx.fill();
        ctx.strokeStyle = i === current ? accent : KIT.border;
        ctx.lineWidth = i === current ? 3 : 2;
        ctx.stroke();
        if (i === current) {
          ctx.save();
          ctx.globalAlpha = 0.06;
          blockPath(x, BLOCK_Y, BLOCK_W, BLOCK_H);
          ctx.fillStyle = accent;
          ctx.fill();
          ctx.restore();
        }
        // one 1.6 s pulse on the current stage; it never changes the layout
        if (i === current) {
          ctx.save();
          ctx.globalAlpha = 0.35 + 0.3 * Math.sin((t / 1.6) * Math.PI * 2);
          blockPath(x - 6, BLOCK_Y - 6, BLOCK_W + 12, BLOCK_H + 12);
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
      }

      // arrows: an already walked edge is thicker and blue
      for (let i = 0; i < LAST_STEP; i += 1) {
        const from = BLOCK_X + i * PITCH + BLOCK_W + 4;
        const to = BLOCK_X + (i + 1) * PITCH - 4;
        const walked = i < current;
        ctx.strokeStyle = walked ? KIT.guidance : KIT.support;
        ctx.lineWidth = walked ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(from, CENTER_Y);
        ctx.lineTo(to - 6, CENTER_Y);
        ctx.stroke();
        ctx.fillStyle = walked ? KIT.guidance : KIT.support;
        ctx.beginPath();
        ctx.moveTo(to, CENTER_Y);
        ctx.lineTo(to - 7, CENTER_Y - 4);
        ctx.lineTo(to - 7, CENTER_Y + 4);
        ctx.closePath();
        ctx.fill();
      }

      // the hand keeps laying tiles while the pipeline advances
      dHand(ctx, BLOCK_X + current * PITCH + BLOCK_W / 2, 150, t, KIT.text);

      // artifact produced by the current stage
      ctx.strokeStyle = KIT.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(48, 176, 560, 84);
      dLabel(ctx, '产物', 60, 200, KIT.muted);
      dLabel(ctx, ARTIFACT_SHORT[current], 328, 236, KIT.text, 'center');

      // two independent lanes until the fusion stage
      const rowH = dTimeline(ctx, LANE_X, LANE_Y, LANE_W, LANE_H, 2);
      if (current === LAST_STEP) {
        ctx.fillStyle = KIT.success;
        ctx.fillRect(LANE_X + 8, LANE_Y + 6, LANE_W - 16, LANE_H - 12);
      } else {
        const segs = STEPS.length;
        const segW = (LANE_W - 16 - (segs - 1) * 6) / segs;
        const lit = current + 1;
        for (let i = 0; i < segs; i += 1) {
          const sx = LANE_X + 8 + i * (segW + 6);
          ctx.fillStyle = i < lit ? KIT.muted : KIT.border;
          ctx.fillRect(sx, LANE_Y + 4, segW, rowH / 2 - 8);
          ctx.fillStyle = i < lit ? KIT.guidance : KIT.border;
          ctx.fillRect(sx, LANE_Y + rowH / 2 + 4, segW, rowH / 2 - 8);
        }
      }

      dLabel(ctx, `步骤 ${current + 1}/${STEPS.length}`, 48, 40, KIT.muted);
      dLegend(
        ctx,
        [
          { color: KIT.muted, text: '通信' },
          { color: KIT.guidance, text: '计算' },
        ],
        700,
        40
      );
    };

    // first frame at mount: never a blank box while off-screen
    render(stepRef.current, 0);
    canvas.classList.add('is-ready');

    const tick = (now: number) => {
      if (!t0Ref.current) t0Ref.current = now;
      render(stepRef.current, now - t0Ref.current);
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

  const goto = (next: number) => {
    const value = Math.max(0, Math.min(LAST_STEP, next));
    stepRef.current = value;
    setStep(value);
    setFeedback(value === LAST_STEP ? DONE_FEEDBACK : { text: STEP_FEEDBACK[value], cls: '' });
  };

  const onPrev = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    goto(stepRef.current - 1);
  };

  const onNext = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    goto(stepRef.current + 1);
  };

  const onReset = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    goto(0);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goto(stepRef.current + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goto(stepRef.current - 1);
    }
  };

  return (
    <div tabIndex={0} role="group" aria-label="编译流水线单步" onKeyDown={onKeyDown}>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="chip" onClick={onPrev} disabled={step === 0}>
          上一步
        </button>
        <button className="chip" onClick={onNext} disabled={step === LAST_STEP}>
          {step === LAST_STEP ? '已完成' : '下一步'}
        </button>
        <button className="chip" onClick={onReset}>
          重置
        </button>
      </div>
      <div className="step-label">
        第 {step + 1}/{STEPS.length} 步 · <b>{STEPS[step]}</b>
      </div>
      <div className="step-desc">
        产物：{ARTIFACTS[step]}
        {step === LAST_STEP ? ` · ${STEP_FEEDBACK[LAST_STEP]}` : ''}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M61PipelineSteps;
