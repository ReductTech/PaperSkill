import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 210;
const SCENE_W = 660;
const SCENE_H = 178;
const c = {
  bg: '#f5f8f0', panel: '#ffffff', booth: '#b8c9a7', dark: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', text: '#21324a', muted: '#68778f', border: '#d7deea',
};

type Variant = 'demo' | 'production' | 'audition' | 'phoneme' | 'review' | 'distill' | 'routing' | 'cleaning' | 'finish';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = c.text, bold = false) {
  ctx.fillStyle = color; ctx.font = `${bold ? '700' : '500'} 14px system-ui, sans-serif`; ctx.fillText(text, x, y);
}

function microLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = c.muted) {
  ctx.fillStyle = color;
  ctx.font = '700 8px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.letterSpacing = '0.9px';
  ctx.fillText(text, x, y);
  ctx.letterSpacing = '0px';
}

function centeredLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = c.text, size = 11, bold = true) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700' : '500'} ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

function node(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  accent: string,
  surface = '#ffffff',
  textColor = c.text,
  fontSize = 10.5,
) {
  ctx.save();
  ctx.shadowColor = 'rgba(24, 50, 82, 0.08)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = surface;
  roundRect(ctx, x, y, w, h, 7);
  ctx.restore();
  ctx.strokeStyle = '#dbe3ee';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.stroke();
  ctx.fillStyle = accent;
  roundRect(ctx, x, y, 4, h, 3);
  centeredLabel(ctx, text, x + w / 2 + 2, y + h / 2, textColor, fontSize);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = '#9babc0', dashed = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 5 * Math.cos(angle - Math.PI / 6), y2 - 5 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 5 * Math.cos(angle + Math.PI / 6), y2 - 5 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeroPipeline(ctx: CanvasRenderingContext2D, variant: 'demo' | 'production', t: number) {
  const good = variant === 'production';
  const ink = good ? '#173c36' : '#33445c';
  const accent = good ? '#17825c' : '#bd4a5b';

  ctx.fillStyle = good ? '#f4faf7' : '#f7f8fb';
  ctx.fillRect(0, 0, W, H);

  // restrained scientific grid
  ctx.save();
  ctx.strokeStyle = good ? 'rgba(23,130,92,.055)' : 'rgba(51,68,92,.045)';
  ctx.lineWidth = 1;
  for (let x = 24; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 18; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 16, 14, 528, 182, 14);
  ctx.strokeStyle = good ? '#cbe3d8' : '#d9e0e9';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(16, 14, 528, 182, 14); ctx.stroke();
  ctx.fillStyle = accent;
  roundRect(ctx, 30, 28, 5, 23, 3);
  label(ctx, good ? 'LongCat-Video-Avatar 1.5' : 'v1.0 / 相关研究基线', 45, 46, ink, true);

  if (!good) {
    microLabel(ctx, 'INFERENCE / GENERATION', 34, 69);
    node(ctx, 'Reference + Audio', 34, 78, 94, 35, c.blue, '#fff', c.text, 9.5);
    node(ctx, 'Wav2Vec2 Encoder', 151, 78, 102, 35, c.red, '#fffafb', c.red, 9.2);
    node(ctx, 'Audio-conditioned DiT', 279, 78, 111, 35, c.blue, '#fff', c.blue, 8.7);
    node(ctx, 'Multi-step Diffusion', 416, 78, 110, 35, c.orange, '#fffaf2', c.orange, 8.5);
    arrow(ctx, 128, 95.5, 147, 95.5);
    arrow(ctx, 253, 95.5, 275, 95.5);
    arrow(ctx, 390, 95.5, 412, 95.5);

    const travel = (t % 4) / 4;
    const pulseX = 128 + travel * 288;
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(pulseX, 95.5, 3.4, 0, Math.PI * 2); ctx.fill();

    microLabel(ctx, 'TRAINING FEEDBACK', 34, 139);
    node(ctx, 'Video-level reward · 1 个总分', 151, 126, 178, 28, c.red, '#fffafb', c.red, 9.5);
    arrow(ctx, 329, 140, 341, 114, '#c57b88', true);
    centeredLabel(ctx, '难以定位时间局部错误', 420, 140, c.red, 10);

    const issues = [
      ['音频条件表达有限', 34, 111],
      ['局部错误难定位', 153, 105],
      ['背景缺少静音条件', 266, 117],
      ['高 NFE 成本', 391, 91],
    ] as const;
    issues.forEach(([text, x, w]) => {
      ctx.fillStyle = '#f9ecef';
      roundRect(ctx, x, 169, w, 17, 8);
      centeredLabel(ctx, text, x + w / 2, 177.5, '#a84050', 8.5);
    });
  } else {
    microLabel(ctx, 'UNIFIED MODEL / CONDITIONS', 34, 68, '#5d796f');
    node(ctx, '3D VAE Latent', 34, 77, 118, 27, c.blue, '#fff', c.blue, 9.5);
    node(ctx, 'Whisper-large Feature', 34, 110, 118, 27, c.green, '#f7fcf9', c.green, 8.9);
    node(ctx, 'Silent Condition†', 34, 143, 118, 27, c.purple, '#faf8ff', c.purple, 9.2);

    ctx.fillStyle = '#f7fafc';
    roundRect(ctx, 192, 74, 170, 70, 10);
    ctx.strokeStyle = '#9eb4cf'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect(192, 74, 170, 70, 10); ctx.stroke();
    microLabel(ctx, 'SHARED VIDEO BACKBONE', 206, 91, c.blue);
    centeredLabel(ctx, 'Shared 3D DiT Backbone', 277, 110, c.blue, 12.5);
    centeredLabel(ctx, '3D SA  ·  Text CA  ·  Audio CA  ·  FFN', 277, 130, c.muted, 8.2, false);
    arrow(ctx, 152, 90.5, 188, 97, '#8aa2bd');
    arrow(ctx, 152, 123.5, 188, 113, c.green);
    arrow(ctx, 152, 156.5, 188, 128, c.purple, true);

    node(ctx, 'Fast Avatar', 397, 78, 131, 27, c.green, '#f7fcf9', c.green, 10.2);
    node(ctx, '8 NFE Sampling', 397, 113, 131, 27, c.green, '#edf8f2', c.green, 9.5);
    arrow(ctx, 362, 109, 393, 91.5, c.green);
    arrow(ctx, 462.5, 105, 462.5, 109, c.green);

    const path = (t % 3.6) / 3.6;
    const pulseX = 362 + path * 35;
    ctx.fillStyle = c.green;
    ctx.beginPath(); ctx.arc(pulseX, 109, 3.5, 0, Math.PI * 2); ctx.fill();

    microLabel(ctx, 'PROGRESSIVE TRAINING', 176, 166, '#5d796f');
    const stages = [
      ['DATA', 34, 42, c.green, 8.2],
      ['BASE TRAINING', 88, 84, c.blue, 7.8],
      ['PER-FRAME GRPO', 184, 108, c.orange, 7.8],
      ['DMD2 DISTILLATION', 304, 112, c.purple, 7.2],
    ] as const;
    stages.forEach(([text, x, w, color, size], i) => {
      ctx.fillStyle = i === 0 ? '#eef6f2' : '#f3f6fa';
      roundRect(ctx, x, 174, w, 17, 8);
      centeredLabel(ctx, text, x + w / 2, 182.5, color, size);
      if (i < stages.length - 1) arrow(ctx, x + w + 3, 182.5, stages[i + 1][1] - 3, 182.5, '#9babc0');
    });
    arrow(ctx, 419, 174, 462, 142, c.green, true);
    centeredLabel(ctx, '† 仅用于多人背景区域', 284, 151, c.purple, 8, false);
  }
}

function drawSinger(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, mouth = 0.3) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - 7, y - 4, 2.6, 0, Math.PI * 2); ctx.arc(x + 7, y - 4, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y + 8, 8, 2 + mouth * 7, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = c.text; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y + 23); ctx.lineTo(x, y + 63); ctx.stroke();
}

function drawMic(ctx: CanvasRenderingContext2D, x: number, y: number, color = c.orange) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = c.text; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x, y + 54); ctx.stroke();
}

function drawWave(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, amp: number, phase: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
  for (let i = 0; i <= w; i += 4) {
    const yy = y + Math.sin(i * 0.11 + phase) * amp * (0.45 + 0.55 * Math.sin(i * 0.025) ** 2);
    if (i === 0) ctx.moveTo(x + i, yy); else ctx.lineTo(x + i, yy);
  }
  ctx.stroke();
}

const StudioScene: React.FC<WidgetProps & { variant: Variant }> = ({ variant }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const isHero = variant === 'demo' || variant === 'production';
  const width = isHero ? W : SCENE_W;
  const height = isHero ? H : SCENE_H;
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, width, height); let raf = 0; let running = false;
    const draw = (now: number) => {
      const t = now / 1000; const p = (Math.sin(t * 1.8) + 1) / 2;
      if (isHero) {
        drawHeroPipeline(ctx, variant, t);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        if (running) raf = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, width, height); ctx.fillStyle = c.bg; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = c.panel; roundRect(ctx, 3, 3, 654, 172, 10);
      ctx.strokeStyle = c.border; ctx.lineWidth = 1.5; ctx.strokeRect(9, 9, 642, 160);

      if (variant === 'audition') {
        const progress = (t % 6) / 6;
        microLabel(ctx, 'RESEARCH READINESS', 28, 28, c.muted);
        microLabel(ctx, 'PRODUCTION READINESS', 508, 28, c.green);

        ctx.fillStyle = '#f3f6fb'; roundRect(ctx, 26, 38, 128, 76, 10);
        ctx.fillStyle = c.blue; roundRect(ctx, 26, 38, 5, 76, 3);
        centeredLabel(ctx, '研究 Demo', 91, 61, c.blue, 13);
        centeredLabel(ctx, '固定输入 · 短片', 91, 85, c.muted, 9, false);
        centeredLabel(ctx, '一次成功', 91, 101, c.muted, 9, false);

        ctx.fillStyle = '#eef8f3'; roundRect(ctx, 506, 38, 128, 76, 10);
        ctx.fillStyle = c.green; roundRect(ctx, 629, 38, 5, 76, 3);
        centeredLabel(ctx, '商业系统', 570, 61, c.green, 13);
        centeredLabel(ctx, '开放输入 · 长时', 570, 85, c.muted, 9, false);
        centeredLabel(ctx, '持续交付', 570, 101, c.muted, 9, false);

        const gates = ['口型', '结构', '成本', '归因', '长时'];
        const startX = 205; const gap = 64;
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(155, 77); ctx.lineTo(505, 77); ctx.stroke();
        gates.forEach((name, i) => {
          const x = startX + i * gap;
          const passed = progress * 5 >= i + 0.5;
          ctx.fillStyle = passed ? c.green : '#fff';
          ctx.strokeStyle = passed ? c.green : '#b7c3d3';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, 77, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          if (passed) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(x - 4, 77); ctx.lineTo(x - 1, 81); ctx.lineTo(x + 5, 73); ctx.stroke();
          }
          centeredLabel(ctx, name, x, 103, passed ? c.green : c.muted, 8.5, true);
        });
        const pulseX = 155 + progress * 350;
        ctx.fillStyle = c.orange; ctx.beginPath(); ctx.arc(pulseX, 77, 4.5, 0, Math.PI * 2); ctx.fill();
        centeredLabel(ctx, '五项可靠性同时成立，研究能力才具备产品形态', 330, 148, c.text, 11.5, true);
      } else if (variant === 'phoneme') {
        drawSinger(ctx, 96, 69, c.blue, p); drawMic(ctx, 150, 71); drawWave(ctx, 215, 70, 385, 16 + p * 10, t * 5, c.green);
        ['起音', '爆破', '收尾'].forEach((x, i) => label(ctx, x, 230 + i * 145, 132, i === Math.floor(p * 2.99) ? c.orange : c.muted, true));
      } else if (variant === 'review') {
        microLabel(ctx, 'VIDEO-LEVEL REWARD', 43, 29, c.muted);
        microLabel(ctx, 'PER-FRAME REWARD', 512, 29, c.orange);
        const bad = Math.floor(p * 7.99); for (let i = 0; i < 8; i++) { const x = 43 + i * 72; ctx.fillStyle = i === bad ? c.red : c.booth; roundRect(ctx, x, 49, 52, 61, 8); centeredLabel(ctx, String(i + 1), x + 26, 79, i === bad ? '#fff' : c.text, 13, true); }
        ctx.strokeStyle = c.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(69 + bad * 72, 79, 34, 0, Math.PI * 2); ctx.stroke(); centeredLabel(ctx, '整段总分找不到坏帧；逐帧奖励能圈出具体位置', 330, 145, c.orange, 11.5, true);
      } else if (variant === 'distill') {
        const phase=(t%4)/4; const teacherX=45+phase*570; const anchors=8;
        label(ctx,'教师：多步采样刻画完整分布',45,28,c.blue,true);
        ctx.strokeStyle=c.blue;ctx.lineWidth=2;ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(45,56);ctx.bezierCurveTo(205,15,398,104,615,50);ctx.stroke();ctx.setLineDash([]);
        for(let i=0;i<34;i++){const x=45+i*(570/33);ctx.fillStyle=c.blue;ctx.globalAlpha=.25+.5*(i/33);ctx.beginPath();ctx.arc(x,56+Math.sin(i*.55)*15,2.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
        ctx.fillStyle=c.blue;ctx.beginPath();ctx.arc(teacherX,56+Math.sin(phase*33*.55)*15,7,0,Math.PI*2);ctx.fill();
        label(ctx,'学生：8 个关键校正点逼近教师分布',45,104,c.green,true);
        ctx.strokeStyle=c.border;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(45,128);ctx.lineTo(615,128);ctx.stroke();
        for(let i=0;i<anchors;i++){const x=45+i*(570/(anchors-1));const active=i<=Math.floor(phase*anchors);ctx.fillStyle=active?c.green:'#fff';ctx.strokeStyle=c.green;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,128,active?7:5.5,0,Math.PI*2);ctx.fill();ctx.stroke();}
        centeredLabel(ctx,'DMD2：让短链生成分布靠近教师分布',330,158,c.orange,11.5,true);
      } else if (variant === 'routing') {
        centeredLabel(ctx, '目标说话人 A', 115, 22, c.blue, 10, true);
        centeredLabel(ctx, '目标说话人 B', 330, 22, c.blue, 10, true);
        centeredLabel(ctx, '背景人物', 545, 22, c.purple, 10, true);
        [115, 330, 545].forEach((x, i) => drawSinger(ctx, x, 57, i === 2 ? c.purple : c.blue, i === 2 ? .05 : p));
        ctx.strokeStyle = c.green; ctx.lineWidth = 4; [[98,126,115,82],[313,126,330,82]].forEach(v=>{ctx.beginPath();ctx.moveTo(v[0],v[1]);ctx.lineTo(v[2],v[3]);ctx.stroke();});
        ctx.strokeStyle = c.purple; ctx.beginPath(); ctx.moveTo(562,126); ctx.lineTo(545,82); ctx.stroke();
        ctx.fillStyle='#eef8f3';roundRect(ctx,57,130,116,31,8);centeredLabel(ctx,'Audio A',115,146,c.green,12,true);
        ctx.fillStyle='#eef8f3';roundRect(ctx,272,130,116,31,8);centeredLabel(ctx,'Audio B',330,146,c.green,12,true);
        ctx.fillStyle='#f5f0ff';roundRect(ctx,487,130,116,31,8);centeredLabel(ctx,'Silent Condition',545,146,c.purple,10.5,true);
      } else if (variant === 'cleaning') {
        drawWave(ctx, 45, 79, 570, 22, t * 2, c.blue); const x = 62 + p * 535;
        ctx.fillStyle = c.green; ctx.globalAlpha = .18; roundRect(ctx, 45, 36, Math.max(15, x - 45), 86, 8); ctx.globalAlpha = 1;
        ctx.strokeStyle = c.orange; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 29); ctx.lineTo(x, 131); ctx.stroke(); centeredLabel(ctx, '在线窗口级质检', x, 154, c.orange, 11, true);
      } else {
        microLabel(ctx,'QUALITY / EXPRESSIVENESS',53,24,c.blue);microLabel(ctx,'STABILITY / DEPLOYMENT',432,24,c.green);
        ctx.fillStyle='#f7f9fc';roundRect(ctx,33,31,282,105,12);ctx.fillStyle=c.blue;roundRect(ctx,33,31,282,7,8);
        label(ctx,'BASE',53,61,c.blue,true);label(ctx,'150 NFE',224,61,c.orange,true);
        label(ctx,'动作与镜头更丰富',53,91,c.text,true);label(ctx,'细腻表情 · 口型细节',53,116,c.muted);
        ctx.fillStyle='#f4fbf7';roundRect(ctx,345,31,282,105,12);ctx.fillStyle=c.green;roundRect(ctx,345,31,282,7,8);
        label(ctx,'FAST',365,61,c.green,true);label(ctx,'8 NFE',550,61,c.green,true);
        label(ctx,'稳定性与合理性更强',365,91,c.text,true);label(ctx,'低畸变 · 适合部署',365,116,c.muted);
        ctx.strokeStyle=c.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(315,83);ctx.lineTo(345,83);ctx.stroke();
        centeredLabel(ctx,'表现力与部署效率的权衡',330,158,c.orange,11.5,true);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (running) raf = requestAnimationFrame(draw);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(draw); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const disconnect = observeCanvas(canvas, start, stop); return () => { stop(); disconnect(); };
  }, [variant, width, height, isHero]);
  return <canvas ref={ref} width={width} height={height} aria-label="LongCat 论文概念动画" />;
};

export const HeroDemo: React.FC<WidgetProps> = p => <StudioScene {...p} variant="demo" />;
export const HeroProduction: React.FC<WidgetProps> = p => <StudioScene {...p} variant="production" />;
export const SceneAudition: React.FC<WidgetProps> = p => <StudioScene {...p} variant="audition" />;
export const ScenePhoneme: React.FC<WidgetProps> = p => <StudioScene {...p} variant="phoneme" />;
export const SceneFrameReview: React.FC<WidgetProps> = p => <StudioScene {...p} variant="review" />;
export const SceneDistill: React.FC<WidgetProps> = p => <StudioScene {...p} variant="distill" />;
export const SceneRouting: React.FC<WidgetProps> = p => <StudioScene {...p} variant="routing" />;
export const SceneCleaning: React.FC<WidgetProps> = p => <StudioScene {...p} variant="cleaning" />;
export const SceneFinish: React.FC<WidgetProps> = p => <StudioScene {...p} variant="finish" />;
