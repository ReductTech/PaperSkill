import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 640;
const H = 280;
const BG = '#f6f8fb';
const PAPER = '#ffffff';
const INK = '#1f2d42';
const MUTED = '#67768d';
const LINE = '#d7dfeb';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';

function useStoryCanvas(draw: (ctx: CanvasRenderingContext2D, t: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const tick = (time: number) => {
      draw(ctx, time / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf.current === null) raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, [draw]);
  return ref;
}

function clear(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAPER;
  ctx.fillRect(16, 14, W - 32, H - 28);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(16, 14, W - 32, H - 28);
}

function text(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, color = INK, size = 15, weight = 500) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillText(t, x, y);
}

function chip(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, w: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 12px "Segoe UI", sans-serif';
  ctx.fillText(t, x + 10, y + 17);
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, body: string, color: string, active: boolean) {
  ctx.fillStyle = active ? '#f8fbff' : '#fff';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = active ? color : LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  chip(ctx, title, x + 12, y + 12, Math.min(130, w - 24), color);
  ctx.fillStyle = MUTED;
  ctx.font = '14px "Segoe UI", "PingFang SC", sans-serif';
  wrap(ctx, body, x + 14, y + 56, w - 28, 18);
}

function wrap(ctx: CanvasRenderingContext2D, t: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  let line = '';
  let curY = y;
  for (const ch of t.split('')) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = ch;
      curY += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) ctx.fillText(line, x, curY);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = LINE, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(a - 0.3), y2 - 10 * Math.sin(a - 0.3));
  ctx.lineTo(x2 - 10 * Math.cos(a + 0.3), y2 - 10 * Math.sin(a + 0.3));
  ctx.closePath();
  ctx.fill();
}

function node(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, body: string, color: string, active: boolean) {
  ctx.fillStyle = active ? '#f8fbff' : '#fff';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = active ? color : LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  chip(ctx, title, x + 12, y + 12, Math.min(128, w - 24), color);
  ctx.fillStyle = MUTED;
  ctx.font = '14px "Segoe UI", "PingFang SC", sans-serif';
  wrap(ctx, body, x + 14, y + 54, w - 28, 18);
}

function tokenDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, r = 5) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function ProblemIntroBoard() {
  const [mode, setMode] = useState<'vae' | 'split' | 'unified'>('vae');
  const canvasRef = useStoryCanvas((ctx, t) => {
    clear(ctx);
    text(ctx, '问题引入：先看传统方案为什么卡住', 22, 32, BLUE, 16, 700);

    panel(
      ctx,
      30,
      58,
      276,
      156,
      'VAE 压缩',
      '图像先被压进更小的潜空间，文字边缘和高频细节很容易变糊。',
      RED,
      mode === 'vae',
    );
    panel(
      ctx,
      334,
      58,
      276,
      156,
      '文本 / 图像分离',
      '文本和图像各有各的编码器，语义常常对不齐。',
      ORANGE,
      mode === 'split',
    );
    arrow(ctx, 306, 136, 332, 136, LINE, 2);

    const pulse = 0.5 + 0.5 * Math.sin(t * 2);
    ctx.fillStyle = `rgba(39,68,110,${0.06 + pulse * 0.1})`;
    ctx.beginPath();
    ctx.roundRect(458, 220, 118, 24, 12);
    ctx.fill();
    text(ctx, '能不能统一成一种语言？', 472, 237, BLUE, 12, 700);

    if (mode === 'unified') {
      const x = 86 + pulse * 140;
      tokenDot(ctx, x, 252, BLUE, 5);
      tokenDot(ctx, x + 92, 252, GREEN, 5);
      tokenDot(ctx, x + 184, 252, ORANGE, 5);
      text(ctx, '统一 Token 空间：把不同输入翻译成同一种数学语言。', 62, 252, GREEN, 13, 700);
    } else {
      const blur = mode === 'vae' ? 0.78 : 0.22;
      ctx.fillStyle = `rgba(196,63,82,${0.10 + blur * 0.12})`;
      ctx.fillRect(74, 100, 110, 62);
      ctx.fillStyle = `rgba(216,121,6,${0.10 + (1 - blur) * 0.12})`;
      ctx.fillRect(406, 100, 110, 62);
      text(ctx, mode === 'vae' ? '文字变糊' : '各说各话', 84, 134, mode === 'vae' ? RED : ORANGE, 15, 700);
    }
  });

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'vae' ? 'selected' : ''}`} onClick={() => setMode('vae')}>VAE 压缩</button>
        <button className={`chip ${mode === 'split' ? 'selected' : ''}`} onClick={() => setMode('split')}>分离编码</button>
        <button className={`chip ${mode === 'unified' ? 'selected' : ''}`} onClick={() => setMode('unified')}>统一空间</button>
      </div>
    </div>
  );
}

export function ApplicationScenesShowcase() {
  const [scene, setScene] = useState(0);
  const items = [
    { title: '电影镜头控制', desc: '把镜头和角度也当成可控 token。', color: BLUE },
    { title: '多面板故事板', desc: '让角色、场景和动作在多张图里持续一致。', color: GREEN },
    { title: '电商产品编辑', desc: '换背景、调构图，同时保留商品主体。', color: ORANGE },
    { title: '个性化头像', desc: '换风格、换场景，但身份特征保持住。', color: PURPLE },
  ];

  const canvasRef = useStoryCanvas((ctx, t) => {
    clear(ctx);
    text(ctx, '应用场景：同一套能力，落到四类真实任务里', 22, 32, BLUE, 16, 700);
    items.forEach((it, i) => {
      const x = 28 + i * 148;
      const active = i === scene;
      panel(ctx, x, 72, 128, 132, it.title, it.desc, it.color, active);
      if (active) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
        ctx.fillStyle = `rgba(39,68,110,${0.05 + pulse * 0.08})`;
        ctx.beginPath();
        ctx.roundRect(x + 18, 214, 92, 16, 8);
        ctx.fill();
        text(ctx, '当前示例', x + 33, 226, it.color, 11, 700);
      }
    });
    tokenDot(ctx, 92 + scene * 148, 56, items[scene].color, 5);
  });

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {items.map((it, i) => (
          <button key={it.title} className={`chip ${i === scene ? 'selected' : ''}`} onClick={() => setScene(i)}>
            {it.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LossStackIllustrator() {
  const [mode, setMode] = useState(0);
  const canvasRef = useStoryCanvas((ctx, t) => {
    clear(ctx);
    text(ctx, '总体目标函数：三层损失一起推动模型收敛', 22, 32, BLUE, 16, 700);
    const cards = [
      { title: 'L_DMD', body: '蒸馏项：让学生更快学到老师的能力。', color: BLUE, value: 0.52 },
      { title: 'L_diff', body: '扩散项：负责标准去噪和结构重建。', color: GREEN, value: 0.31 },
      { title: 'L_adv', body: '对抗项：让输出更锐、更像真实图像。', color: ORANGE, value: 0.17 },
    ];
    cards.forEach((c, i) => {
      const x = 28 + i * 194;
      const active = i === mode;
      panel(ctx, x, 76, 168, 126, c.title, c.body, c.color, active);
      ctx.fillStyle = c.color;
      ctx.fillRect(x + 16, 174, 136 * c.value, 10);
      ctx.strokeStyle = LINE;
      ctx.strokeRect(x + 16, 174, 136, 10);
      text(ctx, `${Math.round(c.value * 100)}%`, x + 16, 204, c.color, 13, 700);
    });
    const pulse = 0.5 + 0.5 * Math.sin(t * 2);
    ctx.fillStyle = `rgba(39,68,110,${0.05 + pulse * 0.08})`;
    ctx.beginPath();
    ctx.roundRect(186, 220, 268, 22, 11);
    ctx.fill();
    text(ctx, 'L_total = L_DMD + λ_diff · L_diff + λ_adv · L_adv', 204, 235, BLUE, 12, 700);
  });

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 0 ? 'selected' : ''}`} onClick={() => setMode(0)}>蒸馏</button>
        <button className={`chip ${mode === 1 ? 'selected' : ''}`} onClick={() => setMode(1)}>扩散</button>
        <button className={`chip ${mode === 2 ? 'selected' : ''}`} onClick={() => setMode(2)}>对抗</button>
      </div>
    </div>
  );
}

export function CoreSummaryBoard() {
  const [step, setStep] = useState(0);
  const canvasRef = useStoryCanvas((ctx, t) => {
    clear(ctx);
    text(ctx, '核心洞察：把所有信息收进同一个 token 空间', 22, 32, BLUE, 16, 700);
    const items = [
      { title: 'LDM', desc: '先压缩再生成', color: RED },
      { title: 'Pixel DiT', desc: '去掉 VAE', color: ORANGE },
      { title: 'HiDream', desc: '统一 token', color: GREEN },
    ];
    items.forEach((it, i) => {
      const x = 38 + i * 190;
      const active = i <= step;
      node(ctx, x, 74, 160, 114, it.title, it.desc, it.color, active);
      if (i < 2) arrow(ctx, x + 160, 126, x + 188, 126, active ? BLUE : LINE, 3);
    });
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
    ctx.fillStyle = `rgba(39,68,110,${0.06 + pulse * 0.08})`;
    ctx.beginPath();
    ctx.roundRect(122, 206, 396, 28, 14);
    ctx.fill();
    text(ctx, 'Native Unification · In-Context Reasoning · Scaling Law', 142, 224, BLUE, 12, 700);
    text(ctx, 'Transformer 像理解语言一样理解图像生成。', 180, 248, step === 2 ? GREEN : MUTED, 13, 700);
  });

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${step === 0 ? 'selected' : ''}`} onClick={() => setStep(0)}>LDM</button>
        <button className={`chip ${step === 1 ? 'selected' : ''}`} onClick={() => setStep(1)}>Pixel DiT</button>
        <button className={`chip ${step === 2 ? 'selected' : ''}`} onClick={() => setStep(2)}>HiDream</button>
      </div>
    </div>
  );
}

export function UnifiedTokenSpaceVisualizer() {
  const [mode, setMode] = useState<'all' | 'text' | 'cond' | 'gen'>('all');
  const canvasRef = useStoryCanvas((ctx, t) => {
    clear(ctx);
    text(ctx, '统一 Token 空间：先翻译，再拼接', 22, 32, BLUE, 16, 700);
    const rows = [
      { title: '文本 token', body: '字符拆开后飞向共享空间', color: BLUE, y: 72 },
      { title: '条件 token', body: '参考图像切块后进入共享空间', color: GREEN, y: 128 },
      { title: '生成 token', body: '噪声 patch 也进入同一空间', color: ORANGE, y: 184 },
    ];
    rows.forEach((r, i) => {
      const active = mode === 'all' || mode === (i === 0 ? 'text' : i === 1 ? 'cond' : 'gen');
      panel(ctx, 28, r.y, 154, 42, r.title, r.body, r.color, active);
      tokenDot(ctx, 56 + 24 * i + 120 * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2 + i))), r.y + 21, r.color, 4);
      arrow(ctx, 182, r.y + 21, 230, 140, r.color, 2);
    });
    ctx.fillStyle = '#f8fbff';
    ctx.beginPath();
    ctx.roundRect(248, 70, 360, 162, 18);
    ctx.fill();
    ctx.strokeStyle = LINE;
    ctx.stroke();
    text(ctx, '共享 Token 序列', 270, 94, INK, 15, 700);
    for (let i = 0; i < 12; i += 1) {
      const color = i < 4 ? BLUE : i < 8 ? GREEN : ORANGE;
      const x = 270 + (i % 4) * 82;
      const y = 118 + Math.floor(i / 4) * 30;
      ctx.fillStyle = color === BLUE ? 'rgba(39,68,110,0.16)' : color === GREEN ? 'rgba(34,141,92,0.16)' : 'rgba(216,121,6,0.16)';
      ctx.beginPath();
      ctx.roundRect(x, y, 52, 18, 9);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, 52, 18);
    }
    text(ctx, mode === 'all' ? '三类 token 已拼接成一条长序列' : '点按钮切换来源', 270, 214, GREEN, 12, 700);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'text' ? 'selected' : ''}`} onClick={() => setMode('text')}>文本</button>
        <button className={`chip ${mode === 'cond' ? 'selected' : ''}`} onClick={() => setMode('cond')}>条件</button>
        <button className={`chip ${mode === 'gen' ? 'selected' : ''}`} onClick={() => setMode('gen')}>生成</button>
        <button className={`chip ${mode === 'all' ? 'selected' : ''}`} onClick={() => setMode('all')}>全部</button>
      </div>
    </div>
  );
}

export function MixedAttentionDemonstrator() {
  const [mode, setMode] = useState<'causal' | 'full' | 'mixed'>('mixed');
  const nodes = ['条件1', '条件2', '文本1', '文本2', '生成1', '生成2'];
  const canvasRef = useStoryCanvas((ctx, t) => {
    clear(ctx);
    text(ctx, '混合注意力：文字像 GPT，图像像 ViT', 22, 32, BLUE, 16, 700);
    const y = 134;
    nodes.forEach((n, i) => {
      const x = 46 + i * 95;
      const color = i < 2 ? GREEN : i < 4 ? BLUE : ORANGE;
      const active = mode === 'full' || (mode === 'mixed' && i >= 4) || (mode === 'causal' && i < 4);
      ctx.fillStyle = active ? '#f8fbff' : '#fff';
      ctx.beginPath();
      ctx.roundRect(x, y, 66, 34, 10);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.stroke();
      text(ctx, n, x + 10, y + 21, color, 12, 700);
      if (i < nodes.length - 1) {
        const stroke = mode === 'full' ? BLUE : mode === 'mixed' && i < 4 ? BLUE : GREEN;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2 + 2 * (0.5 + 0.5 * Math.sin(t * 2 + i));
        ctx.beginPath();
        ctx.moveTo(x + 66, y + 17);
        ctx.lineTo(x + 84, y + 17);
        ctx.stroke();
      }
    });
    text(ctx, mode === 'causal' ? '前面的 token 才能看见后文' : mode === 'full' ? '所有 token 全互看' : '前两类因果，生成类全局', 172, 196, mode === 'full' ? GREEN : BLUE, 13, 700);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'causal' ? 'selected' : ''}`} onClick={() => setMode('causal')}>因果</button>
        <button className={`chip ${mode === 'full' ? 'selected' : ''}`} onClick={() => setMode('full')}>全注意力</button>
        <button className={`chip ${mode === 'mixed' ? 'selected' : ''}`} onClick={() => setMode('mixed')}>混合</button>
      </div>
    </div>
  );
}

export function DiffusionTimeStepper() {
  const [tValue, setTValue] = useState(0.55);
  const canvasRef = useStoryCanvas((ctx) => {
    clear(ctx);
    text(ctx, '扩散时间步：在干净图像和噪声之间滑动', 22, 32, BLUE, 16, 700);
    panel(ctx, 30, 68, 156, 142, '干净 x', '保留纹理和文字细节', BLUE, true);
    panel(ctx, 226, 68, 184, 142, '中间态 x_t', 'x_t = t · x + (1 - t) · ε', GREEN, true);
    panel(ctx, 450, 68, 156, 142, '噪声 ε', '完全随机的起点', RED, true);
    const mix = clamp(tValue, 0, 1);
    ctx.fillStyle = `rgba(39,68,110,${0.14 * mix})`;
    ctx.beginPath();
    ctx.roundRect(252, 118, 132, 46, 16);
    ctx.fill();
    text(ctx, `t = ${mix.toFixed(2)}`, 296, 146, BLUE, 18, 700);
    ctx.fillStyle = `rgba(34,141,92,${0.08 + 0.22 * mix})`;
    ctx.fillRect(260, 170, 116 * mix, 14);
    ctx.fillStyle = `rgba(196,63,82,${0.08 + 0.22 * (1 - mix)})`;
    ctx.fillRect(260 + 116 * mix, 170, 116 * (1 - mix), 14);
    text(ctx, '左边越多越像干净图像，右边越多越像噪声', 214, 224, MUTED, 12, 700);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>t <span className="val">{tValue.toFixed(2)}</span></label>
        <input type="range" min={0} max={1} step={0.01} value={tValue} onChange={(e) => setTValue(Number(e.target.value))} />
      </div>
    </div>
  );
}

export function TrainingProgressTimeline() {
  const [stage, setStage] = useState(0);
  const stages = [
    { title: 'Stage I', res: '512×512', task: 'T2I / LM / MMU', desc: '学基础关联', color: BLUE },
    { title: 'Stage II', res: '1024×1024', task: 'Editing / Personalization', desc: '学上下文推理', color: GREEN },
    { title: 'Stage III', res: '2048×2048', task: '高保真精炼', desc: '学超高清输出', color: ORANGE },
  ];
  const canvasRef = useStoryCanvas((ctx, t) => {
    clear(ctx);
    text(ctx, '三阶段训练：分辨率和任务一起升级', 22, 32, BLUE, 16, 700);
    stages.forEach((s, i) => {
      const x = 34 + i * 190;
      const active = i <= stage;
      node(ctx, x, 72, 160, 128, s.title, `${s.res} · ${s.task}`, s.color, active);
      text(ctx, s.desc, x + 14, 220, active ? s.color : MUTED, 13, 700);
      ctx.fillStyle = active ? s.color : LINE;
      ctx.fillRect(x + 14, 196, 118 * ((i + 1) / 3), 8);
      if (i < 2) arrow(ctx, x + 160, 136, x + 188, 136, active ? BLUE : LINE, 3);
    });
    ctx.fillStyle = `rgba(39,68,110,${0.05 + 0.08 * (0.5 + 0.5 * Math.sin(t * 2))})`;
    ctx.beginPath();
    ctx.roundRect(164, 242, 310, 20, 10);
    ctx.fill();
    text(ctx, 'Stage I → Stage II → Stage III', 218, 256, BLUE, 12, 700);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {stages.map((s, i) => (
          <button key={s.title} className={`chip ${i === stage ? 'selected' : ''}`} onClick={() => setStage(i)}>{s.title}</button>
        ))}
      </div>
    </div>
  );
}

export function PromptAgentChain() {
  const steps = [
    '识别主体：女孩',
    '识别属性：红色连衣裙、草帽',
    '识别场景：向日葵田',
    '识别空间关系：站在…里',
    '输出精炼提示',
  ];
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || step >= steps.length - 1) return;
    const id = window.setTimeout(() => setStep((v) => Math.min(v + 1, steps.length - 1)), 780);
    return () => window.clearTimeout(id);
  }, [running, step]);
  const canvasRef = useStoryCanvas((ctx, t) => {
    clear(ctx);
    text(ctx, 'Prompt Agent：先拆解，再精炼', 22, 32, BLUE, 16, 700);
    panel(ctx, 30, 64, 246, 132, '用户输入', '画一个穿着红色连衣裙、戴着草帽、站在向日葵田里的女孩', BLUE, true);
    steps.forEach((s, i) => {
      const active = i <= step;
      node(ctx, 308, 54 + i * 40, 282, 30, `步骤 ${i + 1}`, s, active ? GREEN : LINE, active);
    });
    ctx.fillStyle = `rgba(34,141,92,${0.06 + 0.12 * (0.5 + 0.5 * Math.sin(t * 2))})`;
    ctx.beginPath();
    ctx.roundRect(314, 238, 260, 22, 11);
    ctx.fill();
    text(ctx, step < 4 ? '逐步提纯中...' : '精炼提示已完成', 370, 253, step < 4 ? MUTED : GREEN, 12, 700);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="chip" onClick={() => { setStep(0); setRunning(true); }}>开始</button>
        {steps.map((s, i) => <button key={s} className={`chip ${i === step ? 'selected' : ''}`} onClick={() => setStep(i)}>{i + 1}</button>)}
      </div>
    </div>
  );
}

export function PerformanceRadarChart() {
  const [mode, setMode] = useState<'radar' | 'bars' | 'text'>('radar');
  const canvasRef = useStoryCanvas((ctx) => {
    clear(ctx);
    text(ctx, '性能对比：8B 也能跑赢更大模型的部分维度', 22, 32, BLUE, 16, 700);
    if (mode === 'radar') {
      const labels = ['单图', '计数', '颜色', '位置', '属性', '理解'];
      const valsA = [1.0, 0.96, 0.89, 0.93, 0.87, 0.91];
      const valsB = [0.98, 0.88, 0.84, 0.78, 0.73, 0.79];
      const drawPoly = (vals: number[], color: string, alpha: number, cx = 184, cy = 136, r = 74) => {
        ctx.fillStyle = color === BLUE ? `rgba(39,68,110,${alpha})` : `rgba(34,141,92,${alpha})`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        vals.forEach((v, i) => {
          const ang = -Math.PI / 2 + (i / vals.length) * Math.PI * 2;
          const x = cx + Math.cos(ang) * r * v;
          const y = cy + Math.sin(ang) * r * v;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };
      for (let r = 1; r <= 4; r += 1) {
        ctx.strokeStyle = LINE;
        ctx.beginPath();
        labels.forEach((_, i) => {
          const ang = -Math.PI / 2 + (i / labels.length) * Math.PI * 2;
          const x = 184 + Math.cos(ang) * (74 * r / 4);
          const y = 136 + Math.sin(ang) * (74 * r / 4);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
      }
      drawPoly(valsA, BLUE, 0.14);
      drawPoly(valsB, GREEN, 0.12);
      labels.forEach((l, i) => {
        const ang = -Math.PI / 2 + (i / labels.length) * Math.PI * 2;
        const x = 184 + Math.cos(ang) * 96;
        const y = 136 + Math.sin(ang) * 96;
        text(ctx, l, x - 10, y + 4, MUTED, 11, 700);
      });
      chip(ctx, 'HiDream 8B', 402, 78, 104, BLUE);
      chip(ctx, 'Qwen-Image 27B', 402, 114, 132, GREEN);
    } else if (mode === 'bars') {
      const bars = [
        { name: 'HiDream 8B', value: 0.9, color: BLUE },
        { name: 'Qwen 27B', value: 0.87, color: GREEN },
      ];
      bars.forEach((b, i) => {
        const x = 80 + i * 180;
        ctx.fillStyle = '#e7edf5';
        ctx.fillRect(x, 120, 62, 92);
        ctx.fillStyle = b.color;
        ctx.fillRect(x, 212 - 92 * b.value, 62, 92 * b.value);
        text(ctx, b.name, x - 4, 230, INK, 13, 700);
        text(ctx, `${Math.round(b.value * 100)}`, x + 16, 102, b.color, 14, 700);
      });
      text(ctx, '参数效率：更小的模型也能拿到更好的综合分数', 278, 78, ORANGE, 13, 700);
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillRect(48, 70, 232, 132);
      ctx.fillRect(350, 70, 232, 132);
      ctx.strokeStyle = LINE;
      ctx.strokeRect(48, 70, 232, 132);
      ctx.strokeRect(350, 70, 232, 132);
      text(ctx, 'CVTG-2K', 56, 94, BLUE, 14, 700);
      text(ctx, '更清晰的文字渲染', 66, 124, GREEN, 15, 700);
      text(ctx, '更稳定的布局', 66, 152, GREEN, 15, 700);
      text(ctx, '更少的断字', 66, 180, GREEN, 15, 700);
      text(ctx, '对比图', 358, 94, ORANGE, 14, 700);
      text(ctx, '原始图中的文本更糊', 368, 124, RED, 15, 700);
      text(ctx, 'HiDream 输出更可读', 368, 152, BLUE, 15, 700);
    }
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'radar' ? 'selected' : ''}`} onClick={() => setMode('radar')}>雷达图</button>
        <button className={`chip ${mode === 'bars' ? 'selected' : ''}`} onClick={() => setMode('bars')}>参数效率</button>
        <button className={`chip ${mode === 'text' ? 'selected' : ''}`} onClick={() => setMode('text')}>文本渲染</button>
      </div>
    </div>
  );
}
