import React, { useEffect, useRef } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 210;
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
  centeredLabel(ctx, text, x + w / 2 + 2, y + h / 2, textColor, 10.5);
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
  label(ctx, good ? 'LongCat 1.5 · 系统路径' : '研究型基线 · 概念对照', 45, 46, ink, true);

  if (!good) {
    microLabel(ctx, 'INFERENCE / GENERATION', 34, 69);
    node(ctx, '参考图 + 语音', 34, 78, 91, 35, c.blue);
    node(ctx, 'Wav2Vec2', 151, 78, 85, 35, c.red);
    node(ctx, 'Audio-DiT', 276, 78, 82, 35, c.blue);
    node(ctx, '多步扩散', 403, 78, 88, 35, c.orange);
    arrow(ctx, 125, 95.5, 147, 95.5);
    arrow(ctx, 236, 95.5, 272, 95.5);
    arrow(ctx, 358, 95.5, 399, 95.5);

    const travel = (t % 4) / 4;
    const pulseX = 125 + travel * 278;
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(pulseX, 95.5, 3.4, 0, Math.PI * 2); ctx.fill();

    microLabel(ctx, 'TRAINING FEEDBACK', 34, 139);
    node(ctx, '整段视频 → 1 个总分', 151, 126, 154, 28, c.red, '#fffafb', c.red);
    arrow(ctx, 305, 140, 330, 114, '#c57b88', true);
    centeredLabel(ctx, '定位不到短时局部错误', 391, 140, c.red, 10.5);

    const issues = [
      ['声学表征有限', 34, 94],
      ['局部归因粗', 138, 82],
      ['背景无静音条件', 230, 112],
      ['服务成本高', 352, 86],
    ] as const;
    issues.forEach(([text, x, w]) => {
      ctx.fillStyle = '#f9ecef';
      roundRect(ctx, x, 169, w, 17, 8);
      centeredLabel(ctx, text, x + w / 2, 177.5, '#a84050', 8.5);
    });
  } else {
    microLabel(ctx, 'UNIFIED MODEL / CONDITIONS', 34, 68, '#5d796f');
    node(ctx, '3D VAE latent', 34, 77, 86, 27, c.blue);
    node(ctx, 'Whisper-large', 34, 110, 86, 27, c.green, '#f7fcf9', c.green);
    node(ctx, 'Silent†', 34, 143, 86, 27, c.purple, '#faf8ff', c.purple);

    ctx.fillStyle = '#f7fafc';
    roundRect(ctx, 175, 74, 171, 70, 10);
    ctx.strokeStyle = '#9eb4cf'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect(175, 74, 171, 70, 10); ctx.stroke();
    microLabel(ctx, 'SHARED BACKBONE', 190, 91, c.blue);
    centeredLabel(ctx, 'Unified 3D DiT', 260.5, 110, c.blue, 15);
    centeredLabel(ctx, '3D SA  ·  Text CA  ·  Audio CA  ·  FFN', 260.5, 130, c.muted, 8.5, false);
    arrow(ctx, 120, 90.5, 171, 97, '#8aa2bd');
    arrow(ctx, 120, 123.5, 171, 113, c.green);
    arrow(ctx, 120, 156.5, 171, 128, c.purple, true);

    node(ctx, '视频', 389, 88, 57, 39, c.green, '#f7fcf9', c.green);
    node(ctx, '8 NFE', 466, 88, 59, 39, c.green, '#edf8f2', c.green);
    arrow(ctx, 346, 109, 385, 109, c.green);
    arrow(ctx, 446, 107.5, 462, 107.5, c.green);

    const path = (t % 3.6) / 3.6;
    const pulseX = 346 + path * 120;
    ctx.fillStyle = c.green;
    ctx.beginPath(); ctx.arc(pulseX, 109, 3.5, 0, Math.PI * 2); ctx.fill();

    microLabel(ctx, 'PROGRESSIVE TRAINING', 175, 160, '#5d796f');
    ctx.fillStyle = '#eef6f2';
    roundRect(ctx, 128, 169, 36, 17, 8);
    centeredLabel(ctx, 'DATA', 146, 177.5, c.green, 8.5);
    arrow(ctx, 167, 177.5, 172, 177.5, '#9babc0');
    const stages = [
      ['BASE', 175, 54, c.blue],
      ['PER-FRAME GRPO', 245, 108, c.orange],
      ['DMD2', 369, 57, c.purple],
      ['FAST', 442, 58, c.green],
    ] as const;
    stages.forEach(([text, x, w, color], i) => {
      ctx.fillStyle = i === 3 ? '#e9f6ef' : '#f3f6fa';
      roundRect(ctx, x, 169, w, 17, 8);
      centeredLabel(ctx, text, x + w / 2, 177.5, color, i === 1 ? 7.8 : 8.5);
      if (i < stages.length - 1) arrow(ctx, x + w + 3, 177.5, stages[i + 1][1] - 3, 177.5, '#9babc0');
    });
    arrow(ctx, 471, 169, 494, 131, c.green, true);
    centeredLabel(ctx, '† 多人背景专用条件', 388, 151, c.purple, 8, false);
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
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H); let raf = 0; let running = false;
    const draw = (now: number) => {
      const t = now / 1000; const p = (Math.sin(t * 1.8) + 1) / 2;
      if (variant === 'demo' || variant === 'production') {
        drawHeroPipeline(ctx, variant, t);
        if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
        if (running) raf = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = c.panel; roundRect(ctx, 18, 18, 524, 174, 14);
      ctx.strokeStyle = c.border; ctx.lineWidth = 2; ctx.strokeRect(28, 30, 504, 150);

      if (variant === 'audition') {
        const items = [['嘴型', c.blue], ['肢体', c.red], ['成本', c.orange], ['多人', c.purple], ['长时', c.green]] as const;
        items.forEach(([name, color], i) => {
          const x = 62 + i * 98; ctx.fillStyle = color; ctx.globalAlpha = 0.25 + 0.65 * ((p + i * .19) % 1); roundRect(ctx, x, 72, 72, 58, 10); ctx.globalAlpha = 1;
          label(ctx, name, x + 20, 106, color, true);
        });
        label(ctx, '五项同时过关，才是产品验收', 158, 158, c.text, true);
      } else if (variant === 'phoneme') {
        drawSinger(ctx, 102, 96, c.blue, p); drawMic(ctx, 148, 98); drawWave(ctx, 202, 90, 290, 18 + p * 12, t * 5, c.green);
        ['起音', '爆破', '收尾'].forEach((x, i) => label(ctx, x, 220 + i * 105, 145, i === Math.floor(p * 2.99) ? c.orange : c.muted, true));
      } else if (variant === 'review') {
        const bad = Math.floor(p * 7.99); for (let i = 0; i < 8; i++) { const x = 48 + i * 61; ctx.fillStyle = i === bad ? c.red : c.booth; roundRect(ctx, x, 73, 46, 62, 8); label(ctx, String(i + 1), x + 18, 108, i === bad ? '#fff' : c.text, true); }
        ctx.strokeStyle = c.orange; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(71 + bad * 61, 104, 31, 0, Math.PI * 2); ctx.stroke(); label(ctx, '逐帧定位', 235, 159, c.orange, true);
      } else if (variant === 'distill') {
        const phase=(t%4)/4; const teacherX=58+phase*444; const anchors=8;
        label(ctx,'教师模型给出完整分布方向',58,53,c.blue,true);
        ctx.strokeStyle=c.blue;ctx.lineWidth=2;ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(58,81);ctx.bezierCurveTo(178,35,322,130,502,74);ctx.stroke();ctx.setLineDash([]);
        for(let i=0;i<30;i++){const x=58+i*(444/29);ctx.fillStyle=c.blue;ctx.globalAlpha=.25+.5*(i/29);ctx.beginPath();ctx.arc(x,81+Math.sin(i*.55)*18,2.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
        ctx.fillStyle=c.blue;ctx.beginPath();ctx.arc(teacherX,81+Math.sin(phase*29*.55)*18,7,0,Math.PI*2);ctx.fill();
        label(ctx,'学生模型学习 8 个关键校正点',58,129,c.green,true);
        ctx.strokeStyle=c.border;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(58,154);ctx.lineTo(502,154);ctx.stroke();
        for(let i=0;i<anchors;i++){const x=58+i*(444/(anchors-1));const active=i<=Math.floor(phase*anchors);ctx.fillStyle=active?c.green:'#fff';ctx.strokeStyle=c.green;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,154,active?8:6,0,Math.PI*2);ctx.fill();ctx.stroke();}
        label(ctx,'DMD2：让短链生成分布靠近教师分布',139,184,c.orange,true);
      } else if (variant === 'routing') {
        [110, 280, 450].forEach((x, i) => drawSinger(ctx, x, 83, i === 2 ? c.purple : c.blue, i === 2 ? .05 : p));
        ctx.strokeStyle = c.green; ctx.lineWidth = 4; [[92,154,110,108],[258,154,280,108]].forEach(v=>{ctx.beginPath();ctx.moveTo(v[0],v[1]);ctx.lineTo(v[2],v[3]);ctx.stroke();});
        ctx.strokeStyle = c.purple; ctx.beginPath(); ctx.moveTo(468,154); ctx.lineTo(450,108); ctx.stroke();
        label(ctx, 'Audio A', 65, 171, c.green, true); label(ctx, 'Audio B', 232, 171, c.green, true); label(ctx, 'Silent', 438, 171, c.purple, true);
      } else if (variant === 'cleaning') {
        drawWave(ctx, 54, 105, 450, 24, t * 2, c.blue); const x = 70 + p * 410;
        ctx.fillStyle = c.green; ctx.globalAlpha = .18; roundRect(ctx, 54, 60, Math.max(15, x - 54), 90, 8); ctx.globalAlpha = 1;
        ctx.strokeStyle = c.orange; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 53); ctx.lineTo(x, 157); ctx.stroke(); label(ctx, '窗口级质检', x - 38, 177, c.orange, true);
      } else {
        ctx.fillStyle='#f7f9fc';roundRect(ctx,48,49,216,112,12);ctx.fillStyle=c.blue;roundRect(ctx,48,49,216,8,8);
        label(ctx,'BASE',68,80,c.blue,true);label(ctx,'150 NFE',174,80,c.orange,true);
        label(ctx,'动作与镜头更丰富',68,111,c.text,true);label(ctx,'细腻表情 · 口型细节',68,137,c.muted);
        ctx.fillStyle='#f4fbf7';roundRect(ctx,296,49,216,112,12);ctx.fillStyle=c.green;roundRect(ctx,296,49,216,8,8);
        label(ctx,'FAST',316,80,c.green,true);label(ctx,'8 NFE',430,80,c.green,true);
        label(ctx,'稳定性与合理性更强',316,111,c.text,true);label(ctx,'低畸变 · 适合部署',316,137,c.muted);
        ctx.strokeStyle=c.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(264,105);ctx.lineTo(296,105);ctx.stroke();
        label(ctx,'表现力与部署效率的权衡',177,184,c.orange,true);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      if (running) raf = requestAnimationFrame(draw);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(draw); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const disconnect = observeCanvas(canvas, start, stop); return () => { stop(); disconnect(); };
  }, [variant]);
  return <canvas ref={ref} width={W} height={H} aria-label="LongCat 论文概念动画" />;
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
