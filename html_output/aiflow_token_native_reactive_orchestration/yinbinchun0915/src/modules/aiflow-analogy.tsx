import React, { useEffect, useRef } from 'react';
import { setupCanvas, observeCanvas, COLORS, drawDrop, drawPlant } from './aiflow-shared';
import type { WidgetProps } from './registry';

const AW = 560;
const AH = 140;

function useAnalogyCanvas(drawFn: (ctx: CanvasRenderingContext2D, t: number) => void) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, AW, AH); } catch { return; }
    const tick = () => {
      drawFn(ctx, tRef.current);
      tRef.current += 1;
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [drawFn]);

  return canvasRef;
}

export const Ch1Analogy: React.FC<WidgetProps> = () => {
  const canvasRef = useAnalogyCanvas((ctx, t) => {
    ctx.clearRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, AW, AH);
    const half = AW / 2;
    ctx.fillStyle = COLORS.textMuted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('聚合模式', half / 2, 15);
    ctx.fillText('流式模式', half + half / 2, 15);
    const drops = Math.floor(t / 20) % 6;
    const jugH = 50 + drops * 8;
    ctx.fillStyle = COLORS.lightEnv; ctx.fillRect(20, AH - jugH - 10, 40, jugH);
    ctx.fillStyle = COLORS.blue; ctx.fillRect(22, AH - jugH - 8, 36, jugH - 4);
    if (drops >= 5) {
      drawDrop(ctx, 40, AH - 10, 5, COLORS.red);
      ctx.fillStyle = COLORS.red; ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText('才倒出', half / 2, AH - 5);
    }
    ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(half, 5); ctx.lineTo(half, AH); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const dy = ((t * 2 + i * 35) % 60);
      drawDrop(ctx, half + half / 2, 20 + dy, 3, COLORS.green);
    }
    drawPlant(ctx, half + half / 2 - 15, AH - 40, 30, 40, (t % 200) / 200);
    ctx.fillStyle = COLORS.green; ctx.font = '9px "Segoe UI", sans-serif';
    ctx.fillText('即时浇灌', half + half / 2, AH - 5);
  });
  return <canvas ref={canvasRef} width={AW} height={AH} />;
};

export const Ch2Analogy: React.FC<WidgetProps> = () => {
  const canvasRef = useAnalogyCanvas((ctx, t) => {
    ctx.clearRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, AW, AH);
    const types = [
      { color: COLORS.green, label: '推理', x: 120 },
      { color: COLORS.orange, label: '回答', x: 280 },
      { color: COLORS.purple, label: '安全标签', x: 440 },
    ];
    types.forEach(tp => {
      ctx.fillStyle = tp.color; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(tp.label, tp.x, 130);
      for (let i = 0; i < 3; i++) {
        const phase = ((t * 1.5 + i * 50 + tp.x) % 100) / 100;
        drawDrop(ctx, 30 + (tp.x - 30) * phase, 30 + 70 * phase, 4, tp.color);
      }
    });
    ctx.fillStyle = COLORS.darkEnv; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('水龙头', 30, 130);
    drawDrop(ctx, 30, 30, 6, COLORS.blue);
  });
  return <canvas ref={canvasRef} width={AW} height={AH} />;
};

export const Ch3Analogy: React.FC<WidgetProps> = () => {
  const canvasRef = useAnalogyCanvas((ctx, t) => {
    ctx.clearRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, AW, AH);
    const phase = (t * 0.01) % 1;
    drawDrop(ctx, 30, 30, 5, COLORS.blue);
    const targets = [
      { x: 200, y: 100, color: COLORS.green },
      { x: 380, y: 80, color: COLORS.orange },
      { x: 500, y: 110, color: COLORS.purple },
    ];
    targets.forEach((tg, i) => {
      const p = (phase + i * 0.33) % 1;
      const dx = 30 + (tg.x - 30) * p;
      const dy = 30 + (tg.y - 30) * p;
      if (p < 0.95) drawDrop(ctx, dx, dy, 4, tg.color);
      drawPlant(ctx, tg.x - 12, tg.y + 5, 24, 30, (t % 300) / 300 * (i + 1) / 3);
    });
    ctx.fillStyle = COLORS.textMuted; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('水滴到达即分流', 10, 15);
  });
  return <canvas ref={canvasRef} width={AW} height={AH} />;
};

export const Ch4Analogy: React.FC<WidgetProps> = () => {
  const canvasRef = useAnalogyCanvas((ctx, t) => {
    ctx.clearRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, AW, AH);
    ctx.strokeStyle = COLORS.lightEnv; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(50, 20); ctx.lineTo(50, 60); ctx.lineTo(200, 60);
    ctx.moveTo(200, 60); ctx.lineTo(350, 60); ctx.lineTo(350, 110);
    ctx.moveTo(200, 60); ctx.lineTo(200, 110);
    ctx.moveTo(350, 60); ctx.lineTo(500, 60); ctx.lineTo(500, 110);
    ctx.stroke();
    ctx.strokeStyle = COLORS.darkEnv; ctx.lineWidth = 3; ctx.stroke();
    const nodes = [
      { x: 50, y: 20, label: '源' }, { x: 200, y: 60, label: '分类' },
      { x: 200, y: 110, label: '推理' }, { x: 350, y: 110, label: '安全' },
      { x: 500, y: 110, label: 'TTS' },
    ];
    nodes.forEach(n => {
      ctx.fillStyle = COLORS.darkEnv;
      ctx.beginPath(); ctx.arc(n.x, n.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COLORS.bg; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + 3);
    });
    ctx.fillStyle = COLORS.textMuted; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('花园规划图', 10, 12);
  });
  return <canvas ref={canvasRef} width={AW} height={AH} />;
};

export const Ch5Analogy: React.FC<WidgetProps> = () => {
  const canvasRef = useAnalogyCanvas((ctx, t) => {
    ctx.clearRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.textMuted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('浇水计划', 10, 15);
    ctx.fillStyle = COLORS.border;
    ctx.fillRect(10, 22, 180, 50);
    ctx.fillStyle = COLORS.darkEnv; ctx.font = '9px monospace';
    ctx.fillText('node 分类 {', 15, 35);
    ctx.fillText('  q:8 k:3', 15, 47);
    ctx.fillText('  o:block', 15, 59);
    ctx.fillText('}', 15, 65);
    ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(190, 47); ctx.lineTo(230, 47);
    ctx.moveTo(225, 42); ctx.lineTo(230, 47); ctx.lineTo(225, 52);
    ctx.stroke();
    ctx.fillStyle = COLORS.green; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('编译', 210, 42);
    ctx.fillStyle = COLORS.lightEnv; ctx.fillRect(240, 22, 120, 50);
    ctx.fillStyle = COLORS.darkEnv; ctx.font = '9px "Segoe UI", sans-serif';
    ctx.fillText('分类节点', 270, 38);
    ctx.fillStyle = COLORS.blue; ctx.beginPath(); ctx.arc(270, 55, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.orange; ctx.beginPath(); ctx.arc(290, 55, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.purple; ctx.beginPath(); ctx.arc(310, 55, 4, 0, Math.PI * 2); ctx.fill();
    const p = (t % 100) / 100;
    ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(240, 80 + p * 40); ctx.lineTo(360, 80 + p * 40); ctx.stroke();
    ctx.setLineDash([]);
  });
  return <canvas ref={canvasRef} width={AW} height={AH} />;
};

export const Ch6Analogy: React.FC<WidgetProps> = () => {
  const canvasRef = useAnalogyCanvas((ctx, t) => {
    ctx.clearRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.darkEnv;
    ctx.beginPath(); ctx.arc(80, 30, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.bg; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('园丁', 80, 33);
    ctx.strokeStyle = COLORS.lightEnv; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(80, 45); ctx.lineTo(80, 90); ctx.stroke();
    ctx.fillStyle = COLORS.lightEnv; ctx.fillRect(65, 90, 30, 30);
    const fillH = (Math.sin(t * 0.05) * 0.5 + 0.5) * 25;
    ctx.fillStyle = COLORS.blue; ctx.fillRect(67, 120 - fillH, 26, fillH);
    for (let i = 0; i < 3; i++) {
      const outlets = [140, 220, 300];
      const ox = outlets[i];
      ctx.strokeStyle = COLORS.lightEnv; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(95, 105); ctx.lineTo(ox - 15, 105); ctx.stroke();
      const p = ((t * 1.5 + i * 40) % 80) / 80;
      drawDrop(ctx, 95 + (ox - 110) * p, 105, 3, COLORS.green);
      drawPlant(ctx, ox - 12, 115, 24, 20, (t % 200) / 200);
    }
    ctx.fillStyle = COLORS.textMuted; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('园丁管理阀门', 10, 12);
  });
  return <canvas ref={canvasRef} width={AW} height={AH} />;
};

export const Ch7Analogy: React.FC<WidgetProps> = () => {
  const canvasRef = useAnalogyCanvas((ctx, t) => {
    ctx.clearRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, AW, AH);
    const tanks = [
      { x: 30, cap: 30, label: 'q=8' }, { x: 160, cap: 50, label: 'q=16' },
      { x: 290, cap: 40, label: 'q=12' }, { x: 420, cap: 25, label: 'q=6' },
    ];
    let total = 0;
    tanks.forEach(tk => {
      ctx.strokeStyle = COLORS.darkEnv; ctx.lineWidth = 2;
      ctx.strokeRect(tk.x, 40, 80, tk.cap + 10);
      const fill = (Math.sin(t * 0.03 + tk.x) * 0.5 + 0.5) * tk.cap;
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(tk.x + 2, 50 + tk.cap - fill, 76, fill);
      ctx.fillStyle = COLORS.textMuted; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(tk.label, tk.x + 40, 105);
      total += tk.cap;
    });
    ctx.fillStyle = COLORS.green; ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`总容量 = ${total}（有界且可计算）`, AW / 2, 130);
    ctx.fillStyle = COLORS.textMuted; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('水壶容量有限', 10, 15);
  });
  return <canvas ref={canvasRef} width={AW} height={AH} />;
};

export const Ch8Analogy: React.FC<WidgetProps> = () => {
  const canvasRef = useAnalogyCanvas((ctx, t) => {
    ctx.clearRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, AW, AH);
    const parts = [
      { x: 40, y: 30, label: '水源', color: COLORS.blue },
      { x: 160, y: 30, label: '主管', color: COLORS.darkEnv },
      { x: 280, y: 70, label: '阀门', color: COLORS.green },
      { x: 400, y: 70, label: '支管', color: COLORS.orange },
      { x: 490, y: 110, label: '植物', color: COLORS.green },
    ];
    ctx.strokeStyle = COLORS.lightEnv; ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(parts[0].x, parts[0].y); ctx.lineTo(parts[1].x, parts[1].y);
    ctx.lineTo(parts[2].x, parts[2].y); ctx.lineTo(parts[3].x, parts[3].y);
    ctx.lineTo(parts[4].x, parts[4].y); ctx.stroke();
    const p = (t * 0.01) % 1;
    let prev = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const cur = parts[i];
      if (p > i / parts.length) {
        drawDrop(ctx, prev.x + (cur.x - prev.x) * 0.5, prev.y + (cur.y - prev.y) * 0.5, 4, cur.color);
      }
      prev = cur;
    }
    parts.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COLORS.bg; ctx.font = '8px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(pt.label, pt.x, pt.y + 3);
    });
    ctx.fillStyle = COLORS.textMuted; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('完整灌溉系统', 10, 12);
  });
  return <canvas ref={canvasRef} width={AW} height={AH} />;
};

export const Ch9Analogy: React.FC<WidgetProps> = () => {
  const canvasRef = useAnalogyCanvas((ctx, t) => {
    ctx.clearRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, AW, AH);
    const phase = (t * 0.02) % 1;
    ctx.fillStyle = COLORS.lightEnv; ctx.fillRect(100, 40, 60, 60);
    const fill = phase < 0.7 ? phase / 0.7 * 60 : 60;
    ctx.fillStyle = COLORS.blue; ctx.fillRect(102, 100 - fill, 56, fill);
    for (let i = 0; i < 5; i++) {
      const dy = ((t * 2 + i * 20) % 40);
      drawDrop(ctx, 130, 20 + dy, 3, COLORS.blue);
    }
    if (phase > 0.7) {
      const overP = (phase - 0.7) / 0.3;
      ctx.fillStyle = COLORS.red;
      ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('溢出!', 130, 130);
      for (let i = 0; i < 3; i++) {
        drawDrop(ctx, 130 + (i - 1) * 15, 100 + overP * 25 + i * 5, 3, COLORS.red);
      }
    }
    ctx.strokeStyle = COLORS.darkEnv; ctx.lineWidth = 2;
    ctx.strokeRect(100, 40, 60, 60);
    ctx.fillStyle = COLORS.textMuted; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('水满时如何处理', 10, 12);
    ctx.fillStyle = COLORS.green; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('block / drop / error', 350, 70);
    ctx.fillStyle = COLORS.textMuted; ctx.font = '9px "Segoe UI", sans-serif';
    ctx.fillText('策略决定行为', 350, 85);
  });
  return <canvas ref={canvasRef} width={AW} height={AH} />;
};

export const Ch10Analogy: React.FC<WidgetProps> = () => {
  const canvasRef = useAnalogyCanvas((ctx, t) => {
    ctx.clearRect(0, 0, AW, AH);
    ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, AW, AH);
    const oldP = Math.min(t / 150, 1);
    const newP = Math.min(t / 40, 1);
    ctx.fillStyle = COLORS.red; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('聚合基线', 10, 20);
    ctx.fillRect(10, 25, oldP * 200, 8);
    ctx.fillStyle = COLORS.green;
    ctx.fillText('AiFlow', 10, 55);
    ctx.fillRect(10, 60, newP * 200, 8);
    drawPlant(ctx, 260, 25, 30, 40, newP);
    drawPlant(ctx, 310, 25, 30, 40, oldP * 0.5);
    ctx.fillStyle = COLORS.textMuted; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('浇水速度对比', 10, 12);
    if (newP >= 1 && oldP < 1) {
      ctx.fillStyle = COLORS.green; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('AiFlow更快到达!', 200, 110);
    }
  });
  return <canvas ref={canvasRef} width={AW} height={AH} />;
};

