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
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = c.panel; roundRect(ctx, 18, 18, 524, 174, 14);
      ctx.strokeStyle = c.border; ctx.lineWidth = 2; ctx.strokeRect(28, 30, 504, 150);

      if (variant === 'demo' || variant === 'production') {
        const good = variant === 'production'; const beat = 90 + p * 350; const drift = good ? Math.sin(t * 5) * 3 : p * 42;
        ctx.setLineDash([6, 6]); ctx.strokeStyle = c.blue; ctx.beginPath(); ctx.moveTo(beat, 52); ctx.lineTo(beat, 162); ctx.stroke(); ctx.setLineDash([]);
        drawSinger(ctx, beat - 24 + drift, 92, good ? c.green : c.red, p);
        drawMic(ctx, beat + 20, 94); label(ctx, good ? '8 NFE · 稳定对齐' : '误差随时间累积', 42, 48, good ? c.green : c.red, true);
      } else if (variant === 'audition') {
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
        const values = [78, 92, 88, 96]; const names = ['合理', '协调', '稳定', '一致']; values.forEach((v, i) => { const x = 76 + i * 118; ctx.fillStyle = c.border; roundRect(ctx, x, 54, 52, 102, 8); ctx.fillStyle = i === 1 ? c.orange : c.green; roundRect(ctx, x, 156 - v, 52, v, 8); label(ctx, names[i], x + 8, 176, c.text, true); });
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
