import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import {
  STUDIO,
  clearStudio,
  drawMic,
  drawPatchCable,
  drawStudioLabel,
  roundedRect,
} from './studio-kit';

type WidgetProps = { chapterId: string; moduleId: string };
type RouteMode = 'rule' | 'llm' | 'agentic';

type ModeSpec = {
  chip: string;
  shortLabel: string;
  inputTitle: string;
  inputLines: [string, string];
  routerTitle: string;
  routerLines: [string, string];
  micTitle: string;
  micSubtitle: string;
  sees: string;
  timing: string;
  feedbackClass: '' | 'bad' | 'good';
  feedback: string;
  color: string;
};

const W = 560;
const H = 260;

const MODES: Record<RouteMode, ModeSpec> = {
  rule: {
    chip: '规则路由',
    shortLabel: '歌曲标签 → 固定规则',
    inputTitle: '只看歌曲标签',
    inputLines: ['标签：流行人声', '关键词命中匹配'],
    routerTitle: '硬编码规则表',
    routerLines: ['如果“流行”', '就使用预设音色'],
    micTitle: '预设电声麦克风',
    micSubtitle: '整个任务保持不变',
    sees: '标签、关键词',
    timing: '请求进入时检查',
    feedbackClass: 'bad',
    feedback: '规则路由：看到“流行人声”就直接套用预设麦克风；副歌已经爆音，静态规则仍看不见现场变化。',
    color: STUDIO.red,
  },
  llm: {
    chip: 'LLM 请求级路由',
    shortLabel: '当前请求 → 语义判断',
    inputTitle: '理解当前请求',
    inputLines: ['“录一首温暖、', '贴近的流行人声”'],
    routerTitle: 'LLM 语义调音师',
    routerLines: ['像先读制作说明的调音师', '理解意图后动态选麦'],
    micTitle: '语义匹配麦克风',
    micSubtitle: '按当前请求推荐',
    sees: '自然语言请求与当前请求上下文',
    timing: '每个请求到达时判断',
    feedbackClass: '',
    feedback: 'LLM 路由就像先读制作说明的调音师：能理解用户想要的风格与意图，并动态推荐麦克风；但论文的对照设定中，它没有接入录音实时控制台。',
    color: STUDIO.purple,
  },
  agentic: {
    chip: '本文 Agentic 路由',
    shortLabel: '任务 + 当前状态 → 步骤级判断',
    inputTitle: '读取任务执行现场',
    inputLines: ['当前：副歌爆音', '验证未过 → 恢复中'],
    routerTitle: 'Harness 原生路由',
    routerLines: ['联合任务 q 与 hₜ', '每个步骤重新判断'],
    micTitle: '高声压动圈麦克风',
    micSubtitle: '只服务当前步骤',
    sees: '任务、工具、验证、恢复与历史',
    timing: '每个 Harness 执行步骤',
    feedbackClass: 'good',
    feedback: 'Agentic 路由：任务没有变，但当前步骤已经爆音且验证未过，因此根据执行状态为下一步重新选择。',
    color: STUDIO.green,
  },
};

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  active: boolean,
  color: string,
) {
  ctx.save();
  roundedRect(ctx, x, y, w, h, 11);
  ctx.fillStyle = STUDIO.paper;
  ctx.fill();
  ctx.strokeStyle = active ? color : STUDIO.line;
  ctx.lineWidth = active ? 2.5 : 1.5;
  ctx.stroke();

  roundedRect(ctx, x + 6, y + 6, w - 12, 24, 6);
  ctx.fillStyle = active ? `${color}18` : 'rgba(118,144,106,.10)';
  ctx.fill();
  ctx.fillStyle = active ? color : STUDIO.muted;
  ctx.font = '600 12px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 14, y + 18);
  ctx.restore();
}

function drawRuleGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundedRect(ctx, x - 24, y - 18, 48, 36, 6);
  ctx.stroke();
  for (let row = 0; row < 2; row += 1) {
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 8 + row * 14);
    ctx.lineTo(x + 16, y - 8 + row * 14);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLlmGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  roundedRect(ctx, x - 28, y - 18, 56, 36, 18);
  ctx.fillStyle = `${color}16`;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LLM', x, y + 1);
  ctx.restore();
}

function drawAgenticGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = `${color}16`;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.lineTo(30, 0);
  ctx.lineTo(0, 25);
  ctx.lineTo(-30, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('hₜ', 0, 1);
  ctx.restore();
}

function drawInputContent(ctx: CanvasRenderingContext2D, spec: ModeSpec) {
  ctx.save();
  ctx.fillStyle = STUDIO.text;
  ctx.font = '600 14px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(spec.inputTitle, 31, 96);
  ctx.fillStyle = STUDIO.muted;
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText(spec.inputLines[0], 31, 126);
  ctx.fillText(spec.inputLines[1], 31, 147);

  ctx.strokeStyle = spec.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 174);
  ctx.bezierCurveTo(58, 158, 84, 186, 112, 168);
  ctx.bezierCurveTo(126, 160, 144, 169, 164, 161);
  ctx.stroke();
  ctx.restore();
}

function drawRouterContent(ctx: CanvasRenderingContext2D, mode: RouteMode, spec: ModeSpec, active: boolean) {
  const color = active ? spec.color : STUDIO.line;
  if (mode === 'rule') drawRuleGlyph(ctx, 280, 106, color);
  if (mode === 'llm') drawLlmGlyph(ctx, 280, 106, color);
  if (mode === 'agentic') drawAgenticGlyph(ctx, 280, 106, color);

  ctx.save();
  ctx.fillStyle = active ? STUDIO.text : STUDIO.muted;
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(spec.routerTitle, 280, 153);
  ctx.fillStyle = STUDIO.muted;
  ctx.font = '11.5px "Segoe UI", sans-serif';
  ctx.fillText(spec.routerLines[0], 280, 174);
  ctx.fillText(spec.routerLines[1], 280, 190);
  ctx.restore();
}

function drawOutputContent(ctx: CanvasRenderingContext2D, spec: ModeSpec, active: boolean) {
  drawMic(ctx, 460, 112, active ? spec.color : STUDIO.line);
  ctx.save();
  ctx.fillStyle = active ? STUDIO.text : STUDIO.muted;
  ctx.font = '600 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(spec.micTitle, 460, 161);
  ctx.fillStyle = STUDIO.muted;
  ctx.font = '11.5px "Segoe UI", sans-serif';
  ctx.fillText(spec.micSubtitle, 460, 182);
  ctx.restore();
}

export const Ch1RouteRepair: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const modeRef = useRef<RouteMode>('rule');
  const progressRef = useRef(1);
  const startedAtRef = useRef(0);
  const [mode, setMode] = useState<RouteMode>('rule');

  const chooseMode = (nextMode: RouteMode) => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    modeRef.current = nextMode;
    progressRef.current = reduced ? 1 : 0;
    startedAtRef.current = performance.now();
    setMode(nextMode);
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
    canvas.style.width = 'min(100%, 560px)';
    canvas.style.height = 'auto';

    const render = (activeMode: RouteMode, progress: number) => {
      const spec = MODES[activeMode];
      clearStudio(ctx, W, H);
      drawStudioLabel(ctx, '同一任务：录制温暖的流行人声', 18, 23, 'left');
      drawStudioLabel(ctx, spec.shortLabel, 542, 23, 'right');

      drawPanel(ctx, 18, 46, 164, 164, '路由看见什么', true, spec.color);
      drawPanel(ctx, 202, 46, 156, 164, '怎样做决定', progress >= 0.34, spec.color);
      drawPanel(ctx, 378, 46, 164, 164, '麦克风类比输出', progress >= 0.72, spec.color);

      ctx.save();
      drawPatchCable(ctx, { x: 181, y: 128 }, { x: 203, y: 128 }, progress >= 0.34 ? spec.color : STUDIO.line);
      drawPatchCable(ctx, { x: 357, y: 128 }, { x: 379, y: 128 }, progress >= 0.72 ? spec.color : STUDIO.line);
      ctx.restore();

      drawInputContent(ctx, spec);
      drawRouterContent(ctx, activeMode, spec, progress >= 0.34);
      drawOutputContent(ctx, spec, progress >= 0.72);

      if (progress < 1) {
        const firstLeg = progress < 0.55;
        const local = firstLeg ? progress / 0.55 : (progress - 0.55) / 0.45;
        const fromX = firstLeg ? 182 : 358;
        const toX = firstLeg ? 202 : 378;
        ctx.save();
        ctx.fillStyle = STUDIO.orange;
        ctx.beginPath();
        ctx.arc(fromX + (toX - fromX) * local, 128, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = STUDIO.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('教学类比：麦克风代表候选模型，不构成声学设备推荐', W / 2, 239);
      ctx.restore();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (now: number) => {
      if (progressRef.current < 1) {
        progressRef.current = Math.min(1, (now - startedAtRef.current) / 720);
      }
      render(modeRef.current, progressRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const spec = MODES[mode];

  return (
    <div>
      <div className="chip-row" role="group" aria-label="选择麦克风路由方式">
        {(Object.keys(MODES) as RouteMode[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`chip ${mode === key ? 'selected' : ''}`}
            aria-pressed={mode === key}
            onClick={() => chooseMode(key)}
          >
            {MODES[key].chip}
          </button>
        ))}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={`${spec.chip}：看到${spec.sees}，${spec.timing}，类比选择${spec.micTitle}`}
      />
      <div className="ctrl">
        <span>看到：{spec.sees}</span>
        <span className="val">{spec.timing}</span>
      </div>
      <div className={`feedback ${spec.feedbackClass}`} aria-live="polite">
        {spec.feedback}
      </div>
      <div className="feedback">
        边界：这里复现的是论文 Figure 2 的信息范围。若一个 LLM 路由器持续接入完整 Harness 状态，它就会趋近本文的 Agentic 定义；读取完整状态也不等于总选更贵模型。
      </div>
    </div>
  );
};

export default Ch1RouteRepair;
