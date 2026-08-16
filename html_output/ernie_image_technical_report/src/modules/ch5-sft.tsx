import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import * as PosterKit from './poster-kit';

const W = 800;
const H = 300;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const MUTED = '#68778f';
const BORDER = '#d7deea';
const TEXT = '#21324a';

type Domain = 'poster' | 'game' | 'portrait' | 'product' | 'anime';
type PromptForm = 'caption' | 'keyword' | 'natural' | 'instruction' | 'detailed';

const DOMAINS: Record<Domain, string> = {
  poster: '海报设计',
  game: '游戏截图',
  portrait: '人像摄影',
  product: '物体摄影',
  anime: '动漫内容',
};

const FORMS: Record<PromptForm, { label: string; copy: string; lines: number }> = {
  caption: {
    label: '原始描述',
    copy: '一张包含主体和文字的图片。',
    lines: 2,
  },
  keyword: {
    label: '关键词式',
    copy: '海报、主标题、蓝绿配色、主体居中。',
    lines: 3,
  },
  natural: {
    label: '自然语言请求',
    copy: '请帮我做一张主题清楚、文字可读的海报。',
    lines: 4,
  },
  instruction: {
    label: '指令式提示',
    copy: '生成海报：保留主标题，并把人物放在文字下方。',
    lines: 4,
  },
  detailed: {
    label: '详细构图说明',
    copy: '竖版构图，主标题置顶，主体居中，底部保留说明区域。',
    lines: 6,
  },
};

const kit = PosterKit as unknown as {
  clearDesk: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  drawPoster: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    detail?: number
  ) => void;
  drawBriefCard: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    lineCount: number,
    color: string
  ) => void;
  drawProofFrame: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
  ) => void;
  drawSceneLabel: (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string
  ) => void;
};

export const Ch5SftWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ domain: Domain; promptForm: PromptForm }>({
    domain: 'poster',
    promptForm: 'caption',
  });
  const rafRef = useRef<number | null>(null);
  const [domain, setDomain] = useState<Domain>('poster');
  const [promptForm, setPromptForm] = useState<PromptForm>('caption');

  stateRef.current = { domain, promptForm };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const draw = () => {
      const state = stateRef.current;
      const userFacing = state.promptForm !== 'caption';
      const form = FORMS[state.promptForm];
      kit.clearDesk(ctx, W, H);
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.fillRect(25, 24, 744, 224);
      ctx.strokeRect(25, 24, 744, 224);
      kit.drawPoster(ctx, 62, 54, 245, 162, userFacing ? GREEN : MUTED, userFacing ? 0.88 : 0.55);
      if (userFacing) kit.drawProofFrame(ctx, 55, 47, 259, 176, GREEN);
      kit.drawBriefCard(
        ctx,
        370,
        52,
        344,
        154,
        form.lines,
        userFacing ? BLUE : MUTED
      );

      ctx.fillStyle = userFacing ? ORANGE : MUTED;
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText(DOMAINS[state.domain], 390, 82);
      ctx.fillStyle = TEXT;
      ctx.font = '13px "Segoe UI", sans-serif';
      const words = form.copy;
      const split = words.length > 23 ? [words.slice(0, 23), words.slice(23)] : [words];
      split.forEach((line, index) => ctx.fillText(line, 390, 128 + index * 24));
      ctx.fillStyle = PURPLE;
      ctx.fillText(userFacing ? 'K2.5 改写后的用户表达示意' : '图像描述式输入：与真实请求仍有差距', 390, 190);
      kit.drawSceneLabel(ctx, 'SFT训练时', 41, 25, PURPLE);
      kit.drawSceneLabel(ctx, form.label, 620, 25, userFacing ? GREEN : MUTED);
      ctx.restore();
      canvas.classList.add('is-ready');
    };

    const tick = () => {
      draw();
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

  const domainOrder = Object.keys(DOMAINS) as Domain[];
  const formOrder: PromptForm[] = ['keyword', 'natural', 'instruction', 'detailed'];
  const userFacing = promptForm !== 'caption';

  return (
    <div>
      <canvas
        id={'cv-' + chapterId + '-' + moduleId}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="监督微调中重点领域与多样用户表达的教学示意"
      />
      <div
        className="chip-row"
        role="radiogroup"
        aria-label="SFT重点领域"
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const delta = event.key === 'ArrowRight' ? 1 : -1;
          setDomain(domainOrder[(domainOrder.indexOf(domain) + delta + domainOrder.length) % domainOrder.length]);
        }}
      >
        {domainOrder.map((item) => (
          <button
            key={item}
            type="button"
            className={'chip ' + (domain === item ? 'selected' : '')}
            aria-pressed={domain === item}
            onClick={() => setDomain(item)}
          >
            {DOMAINS[item]}
          </button>
        ))}
      </div>
      <div
        className="chip-row"
        role="radiogroup"
        aria-label="用户表达形式"
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          const current = promptForm === 'caption' ? -1 : formOrder.indexOf(promptForm);
          const delta = event.key === 'ArrowRight' ? 1 : -1;
          setPromptForm(formOrder[(current + delta + formOrder.length) % formOrder.length]);
        }}
      >
        {formOrder.map((item) => (
          <button
            key={item}
            type="button"
            className={'chip ' + (promptForm === item ? 'selected' : '')}
            aria-pressed={promptForm === item}
            onClick={() => setPromptForm(item)}
          >
            {FORMS[item].label}
          </button>
        ))}
        <button type="button" className="chip" onClick={() => setPromptForm('caption')}>
          回到原始描述
        </button>
      </div>
      <div className="hotspot-info">
        <b>SFT训练时</b> · 当前领域：{DOMAINS[domain]} · 当前表达：{FORMS[promptForm].label}
        <br />
        <b>论文事实</b>：SFT 采用自上而下的重点领域筛选，并用 K2.5 把描述改写为多种用户表达。
      </div>
      <div className={'feedback ' + (userFacing ? 'good' : 'bad')} aria-live="polite">
        {userFacing
          ? '表达已经切换为用户可能采用的形式；这是训练期 SFT 数据构建。'
          : '当前仍是图像描述式输入，与真实用户请求的表达方式存在差距。'}
      </div>
      <div className="feedback">
        判断：SFT 在训练时增加表达鲁棒性；它不等于推理前的提示增强器（Prompt Enhancer, PE）。
      </div>
    </div>
  );
};

export default Ch5SftWidget;
