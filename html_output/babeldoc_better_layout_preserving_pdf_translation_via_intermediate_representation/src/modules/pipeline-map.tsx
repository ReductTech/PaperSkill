import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  MUSEUM_COLORS,
  clearMuseumScene,
  drawExhibitFrame,
  drawMuseumLabel,
  drawMuseumWall,
} from './museum-hero';

const W = 1000;
const H = 500;

type Phase = 'problem' | 'solved';

interface CausalStage {
  id: string;
  navLabel: string;
  problem: string;
  failure: string;
  module: string;
  chainLabel: string;
  solution: string;
  nextProblem?: string;
}

const STAGES: readonly CausalStage[] = [
  {
    id: 'layout-loss',
    navLabel: '丢布局',
    problem: '只抽取文字，版面信息丢了',
    failure: '译文虽然存在，却不知道该放回哪个框、使用什么字体，也无法恢复原来的绘制关系。',
    module: '建立 IR',
    chainLabel: 'IR',
    solution: '同一份结构化状态同时保存文字内容与 bbox、字体、坐标和绘制信息。',
    nextProblem: '现在可以处理文字了，但公式不应该交给 LLM 随意改写。',
  },
  {
    id: 'formula-damage',
    navLabel: '公式被改',
    problem: '公式会被 LLM 改坏',
    failure: 'Attention(·) 中的转置、下标、分式和根号可能被改写；纯文本流程也会丢失它们的几何关系。',
    module: 'Placeholder 保护',
    chainLabel: '占位符保护',
    solution: '识别到的不可翻结构先换成 {v1}；翻译完成后，再按 IR 中保留的依据恢复。',
    nextProblem: '公式安全了，但 PDF 文本块可能只有半句话，同一术语的译法也会漂移。',
  },
  {
    id: 'semantic-fragment',
    navLabel: '半句 / 术语漂',
    problem: '边界段落缺上下文，术语也会漂移',
    failure: '跨栏或跨页边界的正文块若分开请求，LLM 看不到相邻内容；同一术语也可能前后出现不同译法。',
    module: 'Context + Glossary + LLM',
    chainLabel: '上下文 + 术语',
    solution: '把边界候选保留不同 ID 放进同一次请求，并把术语表作为提示级指导交给 LLM。',
    nextProblem: '文字翻好了，却可能比原文更长，无法放进原来的段落框。',
  },
  {
    id: 'overflow',
    navLabel: '译文溢出',
    problem: '译文溢出原 bounding box',
    failure: '语言长度变化使译文越过边界，可能遮挡相邻段落或破坏双栏结构。',
    module: 'Adaptive Typesetting',
    chainLabel: '排版搜索',
    solution: '从 γ=1.0 逐步减小局部缩放比例，找到首个可容纳结果，或停在预设下限。',
    nextProblem: '文字已经放进框里，但嵌套对象仍可能被画到错误位置。',
  },
  {
    id: 'reconstruction',
    navLabel: '坐标错位',
    problem: '嵌套坐标与图形状态错乱',
    failure: '若局部坐标、裁剪和图形状态没有成对恢复，当前对象与后续对象都可能错位。',
    module: 'CTM / XObject Reconstruction',
    chainLabel: '嵌套重建',
    solution: '成对维护状态栈，组合 CTM，并按绘制顺序生成稳定绘制单元；这不等于无损逆变换保证。',
  },
] as const;

const PROGRESS_X = [110, 305, 500, 695, 890] as const;
const MAIN_CARD = { x: 390, y: 122, width: 220, height: 174 } as const;

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8 * Math.cos(angle - Math.PI / 6), y2 - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 8 * Math.cos(angle + Math.PI / 6), y2 - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const char of text) {
    const candidate = line + char;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = char;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: {
    color?: string;
    fontSize?: number;
    lineHeight?: number;
    fontWeight?: number;
    align?: CanvasTextAlign;
    maxLines?: number;
  } = {}
) {
  const fontSize = options.fontSize ?? 14;
  const lineHeight = options.lineHeight ?? 22;
  const align = options.align ?? 'left';
  ctx.save();
  ctx.fillStyle = options.color ?? MUSEUM_COLORS.text;
  ctx.font = `${options.fontWeight ?? 600} ${fontSize}px system-ui, "PingFang SC", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  const allLines = wrapText(ctx, text, maxWidth);
  const limit = options.maxLines ?? allLines.length;
  const lines = allLines.slice(0, limit);
  if (allLines.length > limit && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[，。；：、,.!?！？]?$/, '')}…`;
  }
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  ctx.restore();
}

function drawProgress(ctx: CanvasRenderingContext2D, step: number, phase: Phase, reveal: number) {
  const currentCompletion = phase === 'solved' ? reveal : 0;
  for (let index = 0; index < STAGES.length - 1; index += 1) {
    const completed = index < step || (index === step && currentCompletion > 0.55);
    ctx.save();
    ctx.strokeStyle = completed ? MUSEUM_COLORS.success : MUSEUM_COLORS.border;
    ctx.lineWidth = completed ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(PROGRESS_X[index] + 15, 77);
    ctx.lineTo(PROGRESS_X[index + 1] - 15, 77);
    ctx.stroke();
    ctx.restore();
  }

  STAGES.forEach((stage, index) => {
    const completed = index < step || (index === step && phase === 'solved' && reveal > 0.55);
    const current = index === step;
    const fill = completed
      ? MUSEUM_COLORS.success
      : current
        ? MUSEUM_COLORS.failure
        : '#ffffff';
    const stroke = completed
      ? MUSEUM_COLORS.success
      : current
        ? MUSEUM_COLORS.failure
        : MUSEUM_COLORS.border;

    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = current ? 3 : 2;
    ctx.beginPath();
    ctx.arc(PROGRESS_X[index], 77, current ? 14 : 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = completed || current ? '#ffffff' : MUSEUM_COLORS.muted;
    ctx.font = `800 12px system-ui, "PingFang SC", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(completed ? '✓' : String(index + 1), PROGRESS_X[index], 77.5);
    ctx.restore();

    drawMuseumLabel(ctx, stage.navLabel, PROGRESS_X[index], 107, {
      color: current ? MUSEUM_COLORS.text : MUSEUM_COLORS.muted,
      fontSize: 12,
      align: 'center',
      fontWeight: current ? 800 : 650,
    });
  });
}

function drawPipelineStrip(ctx: CanvasRenderingContext2D, step: number, phase: Phase, reveal: number) {
  const y = 398;
  const nodeWidth = 125;
  const nodeHeight = 44;
  const nodeXs = STAGES.map((_, index) => 105 + index * 145);
  const completionThreshold = phase === 'solved' && reveal > 0.55 ? step + 1 : step;

  drawExhibitFrame(ctx, 25, y, 55, nodeHeight, {
    fill: '#ffffff',
    stroke: MUSEUM_COLORS.border,
    radius: 8,
    lineWidth: 1.5,
  });
  drawMuseumLabel(ctx, 'PDF', 52.5, y + nodeHeight / 2, {
    color: MUSEUM_COLORS.muted,
    fontSize: 12,
    align: 'center',
    baseline: 'middle',
    fontWeight: 750,
  });

  arrow(
    ctx,
    80,
    y + nodeHeight / 2,
    nodeXs[0],
    y + nodeHeight / 2,
    completionThreshold > 0 ? MUSEUM_COLORS.success : MUSEUM_COLORS.border,
    completionThreshold > 0 ? 2.2 : 1.5
  );

  STAGES.forEach((stage, index) => {
    const completed = index < completionThreshold;
    const currentProblem = index === step && phase === 'problem';
    drawExhibitFrame(ctx, nodeXs[index], y, nodeWidth, nodeHeight, {
      fill: completed ? '#eaf6ef' : '#ffffff',
      stroke: completed
        ? MUSEUM_COLORS.success
        : currentProblem
          ? MUSEUM_COLORS.failure
          : MUSEUM_COLORS.border,
      radius: 8,
      lineWidth: completed || currentProblem ? 2.2 : 1.4,
      dashed: !completed,
    });
    drawMuseumLabel(ctx, stage.chainLabel, nodeXs[index] + nodeWidth / 2, y + nodeHeight / 2, {
      color: completed
        ? MUSEUM_COLORS.success
        : currentProblem
          ? MUSEUM_COLORS.failure
          : MUSEUM_COLORS.muted,
      fontSize: 11.5,
      align: 'center',
      baseline: 'middle',
      fontWeight: completed || currentProblem ? 750 : 600,
    });
    if (index < STAGES.length - 1) {
      arrow(
        ctx,
        nodeXs[index] + nodeWidth,
        y + nodeHeight / 2,
        nodeXs[index + 1],
        y + nodeHeight / 2,
        index < completionThreshold - 1 ? MUSEUM_COLORS.success : MUSEUM_COLORS.border,
        index < completionThreshold - 1 ? 2.2 : 1.4
      );
    }
  });

  arrow(
    ctx,
    nodeXs[4] + nodeWidth,
    y + nodeHeight / 2,
    850,
    y + nodeHeight / 2,
    completionThreshold === STAGES.length ? MUSEUM_COLORS.success : MUSEUM_COLORS.border,
    completionThreshold === STAGES.length ? 2.2 : 1.5
  );
  drawExhibitFrame(ctx, 850, y, 125, nodeHeight, {
    fill: completionThreshold === STAGES.length ? '#eaf6ef' : '#ffffff',
    stroke: completionThreshold === STAGES.length ? MUSEUM_COLORS.success : MUSEUM_COLORS.border,
    radius: 8,
    lineWidth: completionThreshold === STAGES.length ? 2.2 : 1.5,
  });
  drawMuseumLabel(ctx, '译文 PDF', 912.5, y + nodeHeight / 2, {
    color: completionThreshold === STAGES.length ? MUSEUM_COLORS.success : MUSEUM_COLORS.muted,
    fontSize: 12,
    align: 'center',
    baseline: 'middle',
    fontWeight: 750,
  });

  const busStart = nodeXs[0] + nodeWidth / 2;
  const busEnd = nodeXs[4] + nodeWidth / 2;
  ctx.save();
  ctx.strokeStyle = step > 0 || phase === 'solved' ? MUSEUM_COLORS.auxiliary : MUSEUM_COLORS.border;
  ctx.lineWidth = 2;
  ctx.setLineDash(step > 0 || phase === 'solved' ? [] : [5, 4]);
  ctx.beginPath();
  ctx.moveTo(busStart, 460);
  ctx.lineTo(busEnd, 460);
  ctx.stroke();
  STAGES.forEach((_, index) => {
    ctx.beginPath();
    ctx.moveTo(nodeXs[index] + nodeWidth / 2, y + nodeHeight);
    ctx.lineTo(nodeXs[index] + nodeWidth / 2, 460);
    ctx.stroke();
  });
  ctx.restore();
  drawMuseumLabel(ctx, 'IR 贯穿后续：每一步读取并更新同一份“内容 + 布局”文档状态', W / 2, 487, {
    color: step > 0 || phase === 'solved' ? MUSEUM_COLORS.auxiliary : MUSEUM_COLORS.muted,
    fontSize: 12,
    align: 'center',
    fontWeight: 700,
  });
}

export const PipelineMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('problem');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(() => void) | null>(null);
  const animateRef = useRef<(() => void) | null>(null);
  const frameRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const revealRef = useRef(0);
  const stateRef = useRef({ step, phase });

  const active = STAGES[step] ?? STAGES[0];

  useEffect(() => {
    stateRef.current = { step, phase };
    if (phase === 'solved') {
      animateRef.current?.();
    } else {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      revealRef.current = 0;
      drawRef.current?.();
    }
  }, [step, phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    const draw = () => {
      const { step: currentStep, phase: currentPhase } = stateRef.current;
      const record = STAGES[currentStep] ?? STAGES[0];
      const reveal = currentPhase === 'solved' ? revealRef.current : 0;

      clearMuseumScene(ctx, W, H);
      drawMuseumWall(ctx, W, H, { pedestalY: 386 });

      drawExhibitFrame(ctx, 40, 12, 920, 42, {
        fill: '#ffffff',
        stroke: MUSEUM_COLORS.dark,
        radius: 10,
        lineWidth: 1.5,
      });
      drawMuseumLabel(ctx, '目标：翻译文字，同时把它带回原页面', W / 2, 33, {
        color: MUSEUM_COLORS.text,
        fontSize: 16,
        align: 'center',
        baseline: 'middle',
        fontWeight: 800,
      });

      drawProgress(ctx, currentStep, currentPhase, reveal);

      drawExhibitFrame(ctx, 35, 122, 285, 174, {
        fill: '#fff4f5',
        stroke: MUSEUM_COLORS.failure,
        radius: 12,
        lineWidth: 2,
      });
      drawMuseumLabel(ctx, `问题 ${currentStep + 1} · 现在卡住`, 55, 151, {
        color: MUSEUM_COLORS.failure,
        fontSize: 13,
        fontWeight: 800,
      });
      drawWrappedText(ctx, record.problem, 55, 169, 245, {
        color: MUSEUM_COLORS.text,
        fontSize: 18,
        lineHeight: 25,
        fontWeight: 800,
        maxLines: 2,
      });
      drawWrappedText(ctx, record.failure, 55, 225, 245, {
        color: MUSEUM_COLORS.muted,
        fontSize: 13.5,
        lineHeight: 21,
        fontWeight: 600,
        maxLines: 3,
      });

      drawMuseumLabel(ctx, '因此加入', 355, 200, {
        color: currentPhase === 'solved' ? MUSEUM_COLORS.current : MUSEUM_COLORS.muted,
        fontSize: 11.5,
        align: 'center',
        fontWeight: 750,
      });
      arrow(
        ctx,
        320,
        215,
        MAIN_CARD.x,
        215,
        currentPhase === 'solved' ? MUSEUM_COLORS.current : MUSEUM_COLORS.border,
        currentPhase === 'solved' ? 2.8 : 1.6
      );

      ctx.save();
      if (currentPhase === 'solved') {
        const eased = 1 - Math.pow(1 - reveal, 3);
        const scale = 0.93 + 0.07 * eased;
        ctx.globalAlpha = 0.35 + 0.65 * eased;
        ctx.translate(MAIN_CARD.x + MAIN_CARD.width / 2, MAIN_CARD.y + MAIN_CARD.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-(MAIN_CARD.x + MAIN_CARD.width / 2), -(MAIN_CARD.y + MAIN_CARD.height / 2));
        drawExhibitFrame(ctx, MAIN_CARD.x, MAIN_CARD.y, MAIN_CARD.width, MAIN_CARD.height, {
          fill: '#eef3f8',
          stroke: MUSEUM_COLORS.current,
          radius: 14,
          lineWidth: 3,
        });
        drawMuseumLabel(ctx, '已加入流水线', W / 2, 157, {
          color: MUSEUM_COLORS.current,
          fontSize: 12,
          align: 'center',
          fontWeight: 800,
        });
        drawWrappedText(ctx, record.module, W / 2, 181, 180, {
          color: MUSEUM_COLORS.current,
          fontSize: 18,
          lineHeight: 26,
          fontWeight: 850,
          align: 'center',
          maxLines: 3,
        });
        drawMuseumLabel(ctx, '✓ 解决当前故障', W / 2, 269, {
          color: MUSEUM_COLORS.success,
          fontSize: 12,
          align: 'center',
          fontWeight: 800,
        });
      } else {
        drawExhibitFrame(ctx, MAIN_CARD.x, MAIN_CARD.y, MAIN_CARD.width, MAIN_CARD.height, {
          fill: '#ffffff',
          stroke: MUSEUM_COLORS.border,
          radius: 14,
          lineWidth: 2,
          dashed: true,
        });
        drawMuseumLabel(ctx, '尚未接入', W / 2, 157, {
          color: MUSEUM_COLORS.muted,
          fontSize: 12,
          align: 'center',
          fontWeight: 700,
        });
        drawWrappedText(ctx, record.module, W / 2, 181, 180, {
          color: MUSEUM_COLORS.muted,
          fontSize: 18,
          lineHeight: 26,
          fontWeight: 800,
          align: 'center',
          maxLines: 3,
        });
        drawMuseumLabel(ctx, '当前缺口：还没有这个职责', W / 2, 269, {
          color: MUSEUM_COLORS.emphasis,
          fontSize: 12,
          align: 'center',
          fontWeight: 800,
        });
      }
      ctx.restore();

      drawMuseumLabel(ctx, '于是得到', 645, 200, {
        color: currentPhase === 'solved' ? MUSEUM_COLORS.success : MUSEUM_COLORS.muted,
        fontSize: 11.5,
        align: 'center',
        fontWeight: 750,
      });
      arrow(
        ctx,
        MAIN_CARD.x + MAIN_CARD.width,
        215,
        680,
        215,
        currentPhase === 'solved' ? MUSEUM_COLORS.success : MUSEUM_COLORS.border,
        currentPhase === 'solved' ? Math.max(1.6, 2.8 * reveal) : 1.6
      );

      ctx.save();
      ctx.globalAlpha = currentPhase === 'solved' ? 0.38 + 0.62 * reveal : 0.55;
      drawExhibitFrame(ctx, 680, 122, 285, 174, {
        fill: currentPhase === 'solved' ? '#edf8f2' : '#ffffff',
        stroke: currentPhase === 'solved' ? MUSEUM_COLORS.success : MUSEUM_COLORS.border,
        radius: 12,
        lineWidth: currentPhase === 'solved' ? 2.4 : 1.5,
        dashed: currentPhase !== 'solved',
      });
      drawMuseumLabel(ctx, currentPhase === 'solved' ? '这一关解决' : '等待解决', 700, 151, {
        color: currentPhase === 'solved' ? MUSEUM_COLORS.success : MUSEUM_COLORS.muted,
        fontSize: 13,
        fontWeight: 800,
      });
      drawWrappedText(
        ctx,
        currentPhase === 'solved' ? record.solution : '加入中间的模块后，这里会显示它究竟解决了什么。',
        700,
        178,
        245,
        {
          color: currentPhase === 'solved' ? MUSEUM_COLORS.text : MUSEUM_COLORS.muted,
          fontSize: currentPhase === 'solved' ? 14.5 : 14,
          lineHeight: 23,
          fontWeight: currentPhase === 'solved' ? 700 : 600,
          maxLines: 4,
        }
      );
      ctx.restore();

      const hookText =
        currentPhase === 'problem'
          ? `因果关系：因为“${record.problem}”，所以必须加入“${record.module}”。`
          : record.nextProblem
            ? `这一处解决，但紧接着又暴露：${record.nextProblem}`
            : '五个问题闭环：得到译文 PDF，并尽量保留原页面的布局与绘制关系。';
      drawExhibitFrame(ctx, 35, 316, 930, 58, {
        fill: currentPhase === 'problem' ? '#fff8eb' : record.nextProblem ? '#f4efff' : '#edf8f2',
        stroke:
          currentPhase === 'problem'
            ? MUSEUM_COLORS.emphasis
            : record.nextProblem
              ? MUSEUM_COLORS.auxiliary
              : MUSEUM_COLORS.success,
        radius: 10,
        lineWidth: 1.8,
      });
      drawWrappedText(ctx, hookText, W / 2, 328, 870, {
        color:
          currentPhase === 'problem'
            ? MUSEUM_COLORS.support
            : record.nextProblem
              ? MUSEUM_COLORS.auxiliary
              : MUSEUM_COLORS.success,
        fontSize: 14,
        lineHeight: 21,
        fontWeight: 800,
        align: 'center',
        maxLines: 2,
      });

      drawPipelineStrip(ctx, currentStep, currentPhase, reveal);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const animateReveal = () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      revealRef.current = 0;
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion || !visibleRef.current) {
        revealRef.current = 1;
        draw();
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        revealRef.current = Math.min(1, (now - start) / 360);
        draw();
        if (revealRef.current < 1 && visibleRef.current) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          frameRef.current = null;
        }
      };
      frameRef.current = requestAnimationFrame(tick);
    };

    drawRef.current = draw;
    animateRef.current = animateReveal;
    const disconnect = observeCanvas(
      canvas,
      () => {
        visibleRef.current = true;
        draw();
      },
      () => {
        visibleRef.current = false;
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    );
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      drawRef.current = null;
      animateRef.current = null;
      disconnect();
    };
  }, []);

  const chooseStage = (index: number) => {
    setStep(index);
    setPhase('problem');
  };

  const advance = () => {
    if (phase === 'problem') {
      setPhase('solved');
      return;
    }
    if (step < STAGES.length - 1) {
      setStep(step + 1);
      setPhase('problem');
      return;
    }
    setStep(0);
    setPhase('problem');
  };

  const goBack = () => {
    if (phase === 'solved') {
      setPhase('problem');
      return;
    }
    if (step > 0) {
      setStep(step - 1);
      setPhase('solved');
    }
  };

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * W) / rect.width;
    const y = ((event.clientY - rect.top) * H) / rect.height;
    const progressIndex = PROGRESS_X.findIndex((progressX) => Math.abs(x - progressX) <= 72 && y >= 57 && y <= 113);
    if (progressIndex >= 0) {
      chooseStage(progressIndex);
      return;
    }
    if (
      x >= MAIN_CARD.x &&
      x <= MAIN_CARD.x + MAIN_CARD.width &&
      y >= MAIN_CARD.y &&
      y <= MAIN_CARD.y + MAIN_CARD.height
    ) {
      advance();
    }
  };

  const liveMessage =
    phase === 'problem'
      ? `第 ${step + 1} 个问题：${active.problem}。加入“${active.module}”查看如何解决。`
      : active.nextProblem
        ? `第 ${step + 1} 个问题已解决：${active.solution} 下一处失败是：${active.nextProblem}`
        : `五个问题已闭环：${active.solution}`;

  const primaryLabel =
    phase === 'problem'
      ? `加入“${active.module}”解决`
      : active.nextProblem
        ? `继续：${STAGES[step + 1].navLabel} →`
        : '回到问题 1';

  return (
    <div>
      <div className="chip-row" role="group" aria-label="选择五个连续问题中的一个">
        {STAGES.map((stage, index) => (
          <button
            type="button"
            className={`chip ${step === index ? 'selected' : ''}`}
            aria-pressed={step === index}
            key={stage.id}
            onClick={() => chooseStage(index)}
          >
            {index + 1}. {stage.navLabel}
          </button>
        ))}
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        className="paper-canvas"
        style={{ width: '100%', height: 'auto' }}
        onClick={onCanvasClick}
        role="img"
        aria-label="BabelDOC 五个问题逐步逼出五个模块的因果演示；下方按钮支持完整键盘操作"
      />
      <div className="step-ctrl" role="group" aria-label="推进因果演示">
        {(step > 0 || phase === 'solved') && (
          <button type="button" className="tiny ghost" onClick={goBack}>
            上一步
          </button>
        )}
        <button type="button" className="tiny" onClick={advance}>
          {primaryLabel}
        </button>
      </div>
      <div
        className={`feedback ${phase === 'solved' && !active.nextProblem ? 'good' : ''}`}
        aria-live="polite"
        style={{
          borderLeftColor:
            phase === 'problem'
              ? MUSEUM_COLORS.failure
              : active.nextProblem
                ? MUSEUM_COLORS.auxiliary
                : MUSEUM_COLORS.success,
        }}
      >
        {liveMessage}
      </div>
    </div>
  );
};

export default PipelineMap;
