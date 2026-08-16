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

function useCanvas(draw: (ctx: CanvasRenderingContext2D, t: number) => void) {
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

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = INK, size = 15, weight = 500) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "PingFang SC", sans-serif`;
  ctx.fillText(text, x, y);
}

function chip(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 28, 14);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '700 13px "Segoe UI", sans-serif';
  ctx.fillText(text, x + 12, y + 19);
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = LINE, width = 2) {
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const chars = text.split('');
  let line = '';
  let curY = y;
  for (const ch of chars) {
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

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  body: string,
  accent: string,
  active: boolean,
) {
  ctx.fillStyle = active ? '#f8fbff' : '#fff';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = active ? accent : LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  chip(ctx, title, x + 12, y + 12, Math.min(120, w - 24), accent);
  ctx.fillStyle = MUTED;
  ctx.font = '14px "Segoe UI", sans-serif';
  wrapText(ctx, body, x + 14, y + 58, w - 28, 18);
}

function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, body: string, color: string, active: boolean) {
  ctx.fillStyle = active ? `${color}1f` : '#edf2f7';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y, w / 2 - 6, h / 2 - 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = active ? color : LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  label(ctx, title, x + 44, y - 6, color, 18, 700);
  label(ctx, body, x + 32, y + 24, MUTED, 13, 500);
}

function drawNode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, body: string, color: string, active: boolean) {
  ctx.fillStyle = active ? '#f8fbff' : '#fff';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = active ? color : LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  chip(ctx, title, x + 12, y + 12, Math.min(w - 24, 136), color);
  ctx.fillStyle = MUTED;
  ctx.font = '14px "Segoe UI", sans-serif';
  wrapText(ctx, body, x + 14, y + 56, w - 28, 18);
}

function drawToken(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, body: string, color: string, active: boolean) {
  ctx.fillStyle = active ? '#f7fbff' : '#fff';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = active ? color : LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  chip(ctx, title, x + 12, y + 12, Math.min(124, w - 24), color);
  ctx.fillStyle = MUTED;
  ctx.font = '14px "Segoe UI", sans-serif';
  wrapText(ctx, body, x + 14, y + 56, w - 28, 18);
}

function drawAttentionPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, body: string, color: string, active: boolean) {
  ctx.fillStyle = active ? '#f8fbff' : '#fff';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = active ? color : LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  chip(ctx, title, x + 12, y + 12, 90, color);
  label(ctx, body, x + 14, y + 58, INK, 14, 700);
  const base = y + 102;
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      if (title === '因果注意力' && j > i) continue;
      if (title === '全注意力' || title === '混合注意力') {
        if (i === 0 && title === '混合注意力' && j > i) continue;
      }
      if (title === '混合注意力' && i < 2 && j > i) continue;
      const x1 = x + 22 + i * 32;
      const x2 = x + 22 + j * 32;
      if (j > i) {
        ctx.strokeStyle = active ? `${color}55` : '#cfd7e3';
        ctx.beginPath();
        ctx.moveTo(x1, base);
        ctx.lineTo(x2, base);
        ctx.stroke();
      }
    }
  }
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = active ? color : '#b6c2d2';
    ctx.beginPath();
    ctx.arc(x + 22 + i * 32, base, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRadar(ctx: CanvasRenderingContext2D) {
  const labels = ['单图', '计数', '颜色', '位置', '属性', '理解'];
  const a = [1.0, 0.96, 0.89, 0.93, 0.87, 0.91];
  const b = [0.98, 0.88, 0.84, 0.78, 0.73, 0.79];
  const cx = 186;
  const cy = 130;
  const r = 72;
  ctx.strokeStyle = '#dde5ef';
  for (let i = 1; i <= 4; i += 1) {
    ctx.beginPath();
    for (let j = 0; j < labels.length; j += 1) {
      const ang = -Math.PI / 2 + (j / labels.length) * Math.PI * 2;
      const x = cx + Math.cos(ang) * ((r * i) / 4);
      const y = cy + Math.sin(ang) * ((r * i) / 4);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  const drawPoly = (vals: number[], color: string, alpha: number) => {
    ctx.fillStyle = color === BLUE ? `rgba(39,68,110,${alpha})` : `rgba(34,141,92,${alpha})`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    vals.forEach((v, j) => {
      const ang = -Math.PI / 2 + (j / vals.length) * Math.PI * 2;
      const x = cx + Math.cos(ang) * r * v;
      const y = cy + Math.sin(ang) * r * v;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  drawPoly(a, BLUE, 0.14);
  drawPoly(b, GREEN, 0.14);
  labels.forEach((l, j) => {
    const ang = -Math.PI / 2 + (j / labels.length) * Math.PI * 2;
    const x = cx + Math.cos(ang) * (r + 18);
    const y = cy + Math.sin(ang) * (r + 18);
    label(ctx, l, x - 14, y + 4, MUTED, 12, 700);
  });
  chip(ctx, 'HiDream 8B', 404, 76, 104, BLUE);
  chip(ctx, 'Qwen-Image 27B', 404, 114, 132, GREEN);
  label(ctx, 'GenEval 维度对比', 404, 160, INK, 15, 700);
  label(ctx, 'HiDream 综合更均衡', 404, 188, BLUE, 14, 700);
  label(ctx, '8B 打赢更大模型', 404, 212, GREEN, 14, 700);
}

function drawEfficiency(ctx: CanvasRenderingContext2D) {
  const items = [
    { name: 'HiDream 8B', params: 8, score: 0.9, color: BLUE },
    { name: 'Qwen 27B', params: 27, score: 0.87, color: GREEN },
  ];
  const baseX = 86;
  const baseY = 176;
  items.forEach((it, i) => {
    const h = 86 * it.score;
    const x = baseX + i * 186;
    ctx.fillStyle = '#e8eef7';
    ctx.fillRect(x, baseY - 88, 62, 88);
    ctx.fillStyle = it.color;
    ctx.fillRect(x, baseY - h, 62, h);
    label(ctx, it.name, x - 4, 204, INK, 13, 700);
    label(ctx, `${it.params}B`, x + 10, baseY - h - 8, it.color, 14, 700);
  });
  label(ctx, '更少参数，也能拿到更强结果', 278, 52, ORANGE, 14, 700);
}

function drawTextRendering(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f7f9fc';
  ctx.fillRect(36, 64, 568, 148);
  ctx.fillStyle = '#fff';
  ctx.fillRect(50, 78, 248, 118);
  ctx.fillRect(330, 78, 248, 118);
  ctx.strokeStyle = LINE;
  ctx.strokeRect(50, 78, 248, 118);
  ctx.strokeRect(330, 78, 248, 118);
  label(ctx, 'CVTG-2K 对比示意', 50, 56, BLUE, 14, 700);
  label(ctx, '左：更糊、更断裂', 66, 102, RED, 15, 700);
  label(ctx, '右：更稳、更可读', 346, 102, GREEN, 15, 700);
  ctx.fillStyle = '#3a4d69';
  ctx.fillRect(66, 126, 216, 18);
  ctx.fillRect(66, 154, 132, 18);
  ctx.fillStyle = '#27446e';
  ctx.fillRect(346, 126, 208, 18);
  ctx.fillRect(346, 154, 178, 18);
  label(ctx, '多区域文字渲染 / 版式控制 / 细节保真', 346, 190, INK, 13, 700);
}

export const ProblemIntro: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const canvasRef = useCanvas((ctx, t) => {
    clear(ctx);
    label(ctx, '问题引入：为什么传统流程总是卡在这两处', 22, 32, BLUE, 16, 700);
    drawPanel(
      ctx,
      30,
      58,
      274,
      154,
      'VAE 压缩痛点',
      '压缩前细节完整，压缩后文字变糊，高频纹理和边缘一起掉。',
      RED,
      stage === 0,
    );
    drawPanel(
      ctx,
      336,
      58,
      274,
      154,
      '分离文本编码器痛点',
      '文本和图像像两个气泡，各说各话，语义难以对齐。',
      ORANGE,
      stage === 1,
    );
    drawArrow(ctx, 304, 134, 334, 134, LINE, 2);
    label(ctx, '所以我们要问：能不能把所有信息放到同一个语言里？', 88, 238, BLUE, 16, 700);
    const pulse = 0.5 + 0.5 * Math.sin(t * 2);
    ctx.fillStyle = `rgba(39,68,110,${0.05 + pulse * 0.08})`;
    ctx.beginPath();
    ctx.roundRect(486, 214, 92, 22, 11);
    ctx.fill();
    label(ctx, '统一语言', 502, 230, BLUE, 12, 700);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${stage === 0 ? 'sel' : ''}`} onClick={() => setStage(0)}>VAE 痛点</button>
        <button className={`chip ${stage === 1 ? 'sel' : ''}`} onClick={() => setStage(1)}>语义错位</button>
      </div>
      <div className={`feedback ${stage === 0 ? 'bad' : 'warn'}`}>
        {stage === 0 ? '压缩会先伤到文字和细节。' : '分离式表示很容易各说各话。'}
      </div>
    </div>
  );
};

export const ArchitectureEvolution: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const steps = useMemo(
    () => [
      {
        title: '传统 LDM',
        body: 'VAE + 分离文本编码器 + U-Net，先压缩再生成。',
        fix: '解决了图像生成的扩展性，但仍有压缩损失和语义割裂。',
        color: RED,
      },
      {
        title: '像素空间 DiT',
        body: '去掉 VAE，直接处理像素，但文本仍然是外部编码器。',
        fix: '解决了压缩瓶颈，却还没统一输入空间。',
        color: ORANGE,
      },
      {
        title: 'HiDream-O1-Image',
        body: '把文本、条件和生成全部放进同一个 token 空间。',
        fix: '真正把“理解”和“生成”放到同一条主干里。',
        color: GREEN,
      },
    ],
    [],
  );
  const canvasRef = useCanvas((ctx) => {
    clear(ctx);
    label(ctx, '架构演进：每一步都在解决一个明确问题', 22, 32, BLUE, 16, 700);
    const xs = [28, 228, 428];
    steps.forEach((s, i) => {
      drawNode(ctx, xs[i], 70, 174, 130, s.title, s.body, s.color, i <= stage);
      label(ctx, s.fix, xs[i], 220, i <= stage ? s.color : MUTED, 13, 700);
      if (i < 2) {
        drawArrow(ctx, xs[i] + 174, 136, xs[i + 1] - 12, 136, i <= stage ? BLUE : LINE, 3);
        label(ctx, i === 0 ? '去掉 VAE' : '统一 token 空间', xs[i] + 120, 114, i <= stage ? BLUE : MUTED, 12, 700);
      }
    });
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {steps.map((s, i) => (
          <button key={s.title} className={`chip ${i === stage ? 'sel' : ''}`} onClick={() => setStage(i)}>
            {s.title}
          </button>
        ))}
      </div>
      <div className={`feedback ${stage === 2 ? 'good' : ''}`}>{steps[stage].fix}</div>
    </div>
  );
};

export const UnifiedTokenSpace: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'text' | 'cond' | 'gen'>('text');
  const canvasRef = useCanvas((ctx, t) => {
    clear(ctx);
    label(ctx, '统一 Token 空间：三种输入先变成同一种语言', 22, 32, BLUE, 16, 700);
    drawToken(
      ctx,
      44,
      76,
      156,
      120,
      '文本 Token',
      '用户提示先经 Prompt Agent 整理，再进入共享空间。',
      RED,
      mode === 'text',
    );
    drawToken(
      ctx,
      242,
      76,
      156,
      120,
      '条件 Token',
      '参考图像经 SigLip-2 编码后，投进同一空间。',
      ORANGE,
      mode === 'cond',
    );
    drawToken(
      ctx,
      440,
      76,
      156,
      120,
      '生成 Token',
      '噪声图像块也被映射到共享空间里，等待重建。',
      GREEN,
      mode === 'gen',
    );
    drawArrow(ctx, 200, 136, 240, 136, LINE, 2);
    drawArrow(ctx, 398, 136, 438, 136, LINE, 2);
    ctx.fillStyle = 'rgba(39,68,110,0.06)';
    ctx.beginPath();
    ctx.roundRect(222, 210, 192, 28, 14);
    ctx.fill();
    label(ctx, '三类 token 拼接后输入 Transformer', 238, 229, BLUE, 13, 700);
    const float = 0.5 + 0.2 * Math.sin(t * 2.2);
    ctx.fillStyle = `rgba(34,141,92,${0.2 + float * 0.2})`;
    ctx.beginPath();
    ctx.roundRect(262, 244, 116, 18, 9);
    ctx.fill();
    label(ctx, 'fusion', 298, 258, PAPER, 11, 700);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'text' ? 'sel' : ''}`} onClick={() => setMode('text')}>文本 Token</button>
        <button className={`chip ${mode === 'cond' ? 'sel' : ''}`} onClick={() => setMode('cond')}>条件 Token</button>
        <button className={`chip ${mode === 'gen' ? 'sel' : ''}`} onClick={() => setMode('gen')}>生成 Token</button>
      </div>
      <div className="feedback good">
        {mode === 'text'
          ? '提示词先被组织成共享语言。'
          : mode === 'cond'
            ? '参考图像通过 SigLip-2 进入共享空间。'
            : '噪声块也要先变成统一 token。'}
      </div>
    </div>
  );
};

export const MixedAttention: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'causal' | 'full' | 'mixed'>('mixed');
  const canvasRef = useCanvas((ctx) => {
    clear(ctx);
    label(ctx, '混合注意力：不同 token 用不同看法', 22, 32, BLUE, 16, 700);
    drawAttentionPanel(ctx, 26, 62, 182, 154, '因果注意力', '文本 / 条件 token', RED, mode === 'causal');
    drawAttentionPanel(ctx, 228, 62, 182, 154, '全注意力', '生成 token', GREEN, mode === 'full');
    drawAttentionPanel(ctx, 430, 62, 182, 154, '混合注意力', '前两类因果，生成类全连接', BLUE, mode === 'mixed');
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'causal' ? 'sel' : ''}`} onClick={() => setMode('causal')}>
          因果注意力
        </button>
        <button className={`chip ${mode === 'full' ? 'sel' : ''}`} onClick={() => setMode('full')}>
          全注意力
        </button>
        <button className={`chip ${mode === 'mixed' ? 'sel' : ''}`} onClick={() => setMode('mixed')}>
          混合设计
        </button>
      </div>
      <div className={`feedback ${mode === 'mixed' ? 'good' : ''}`}>
        {mode === 'causal'
          ? '语言更适合只看前文。'
          : mode === 'full'
            ? '图像生成更需要全局连通。'
            : 'HiDream 把规则分给了不同 token。'}
      </div>
    </div>
  );
};

export const TrainingTimeline: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const stages = [
    { title: 'Stage I', res: '512×512', task: 'T2I + 语言 + 多模态理解', target: '先学基础关联' },
    { title: 'Stage II', res: '1024×1024', task: '编辑 + 个性化 + 上下文推理', target: '开始学组合推理' },
    { title: 'Stage III', res: '2048×2048', task: '超高清精炼 + 高保真生成', target: '最后冲高质量' },
  ];
  const canvasRef = useCanvas((ctx, t) => {
    clear(ctx);
    label(ctx, '三阶段训练：分辨率逐级抬升', 22, 32, BLUE, 16, 700);
    stages.forEach((s, i) => {
      const x = 36 + i * 190;
      const active = i <= stage;
      const colors = [GREEN, BLUE, ORANGE];
      ctx.fillStyle = active ? ['#edf8f1', '#eef5ff', '#fdf4e8'][i] : '#f4f6f9';
      ctx.beginPath();
      ctx.roundRect(x, 70, 164, 136, 16);
      ctx.fill();
      ctx.strokeStyle = active ? colors[i] : LINE;
      ctx.lineWidth = 2;
      ctx.stroke();
      chip(ctx, s.title, x + 12, 84, 86, colors[i]);
      label(ctx, s.res, x + 14, 132, INK, 24, 800);
      label(ctx, s.task, x + 14, 162, MUTED, 13, 600);
      label(ctx, s.target, x + 14, 188, active ? INK : MUTED, 13, 700);
      const width = 132 * ((i + 1) / 3);
      ctx.fillStyle = active ? colors[i] : LINE;
      ctx.fillRect(x + 14, 212, width, 6);
    });
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
    ctx.fillStyle = `rgba(39,68,110,${0.05 + pulse * 0.08})`;
    ctx.beginPath();
    ctx.roundRect(248, 228, 124, 20, 10);
    ctx.fill();
    label(ctx, '从粗到细，从低分辨率到高保真', 260, 242, BLUE, 12, 700);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {stages.map((s, i) => (
          <button key={s.title} className={`chip ${i === stage ? 'sel' : ''}`} onClick={() => setStage(i)}>
            {s.title}
          </button>
        ))}
      </div>
      <div className={`feedback ${stage === 2 ? 'good' : ''}`}>{stages[stage].target}</div>
    </div>
  );
};

export const PerformanceStory: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<'radar' | 'efficiency' | 'text'>('radar');
  const canvasRef = useCanvas((ctx) => {
    clear(ctx);
    label(ctx, '性能故事：不是堆更大，而是更会用参数', 22, 32, BLUE, 16, 700);
    if (mode === 'radar') drawRadar(ctx);
    if (mode === 'efficiency') drawEfficiency(ctx);
    if (mode === 'text') drawTextRendering(ctx);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className={`chip ${mode === 'radar' ? 'sel' : ''}`} onClick={() => setMode('radar')}>
          雷达图
        </button>
        <button className={`chip ${mode === 'efficiency' ? 'sel' : ''}`} onClick={() => setMode('efficiency')}>
          参数效率
        </button>
        <button className={`chip ${mode === 'text' ? 'sel' : ''}`} onClick={() => setMode('text')}>
          文本渲染
        </button>
      </div>
      <div className="feedback good">
        {mode === 'radar'
          ? 'HiDream 8B 的综合维度很均衡。'
          : mode === 'efficiency'
            ? '8B 也能打出很高的参数效率。'
            : '长文本渲染是它的强项之一。'}
      </div>
    </div>
  );
};

export const SummaryEvolution: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const stages = ['LDM', 'Pixel DiT', 'HiDream'];
  const canvasRef = useCanvas((ctx, t) => {
    clear(ctx);
    label(ctx, '核心洞察回顾：架构演进最后收束到一个 token 空间', 22, 32, BLUE, 16, 700);
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.1);
    drawNode(ctx, 28, 74, 156, 118, 'LDM', 'VAE + 分离文本编码器', RED, step >= 0);
    drawNode(ctx, 242, 74, 156, 118, 'Pixel DiT', '去掉 VAE，但没统一语言', ORANGE, step >= 1);
    drawNode(ctx, 456, 74, 156, 118, 'HiDream', '所有信息统一成 token', GREEN, step >= 2);
    drawArrow(ctx, 184, 132, 240, 132, step >= 1 ? BLUE : LINE, 3);
    drawArrow(ctx, 398, 132, 454, 132, step >= 2 ? BLUE : LINE, 3);
    ctx.fillStyle = `rgba(39,68,110,${0.06 + pulse * 0.08})`;
    ctx.beginPath();
    ctx.roundRect(176, 216, 288, 24, 12);
    ctx.fill();
    label(ctx, 'Native Unification · In-Context Reasoning · Scaling Law', 196, 233, BLUE, 12, 700);
  });
  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {stages.map((s, i) => (
          <button key={s} className={`chip ${i === step ? 'sel' : ''}`} onClick={() => setStep(i)}>
            {s}
          </button>
        ))}
      </div>
      <div className={`feedback ${step === 2 ? 'good' : ''}`}>
        {step === 0
          ? '先看到 VAE 和分离编码器的瓶颈。'
          : step === 1
            ? '再看到像素空间 DiT 还差统一语言。'
            : '最后所有信息都回到同一个 token 空间。'}
      </div>
    </div>
  );
};

