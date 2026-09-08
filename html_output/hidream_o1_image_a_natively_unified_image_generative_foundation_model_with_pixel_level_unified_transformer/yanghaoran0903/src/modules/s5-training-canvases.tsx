import { useEffect, useRef, type ReactNode } from 'react';

function useResponsiveCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let t = 0;

    const resize = () => {
      const w = canvas.clientWidth || 1;
      const h = canvas.clientHeight || 1;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    resize();
    ro.observe(canvas);

    const frame = () => {
      draw(ctx, canvas.clientWidth || 1, canvas.clientHeight || 1, t);
      t += 0.016;
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frame);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [draw]);

  return ref;
}

const drawFlame = (
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
  flicker: number,
) => {
  const h = 26 * scale * (0.82 + 0.18 * Math.sin(flicker));
  const w = 12 * scale;
  const g = ctx.createLinearGradient(x, baseY, x, baseY - h);
  g.addColorStop(0, '#f59e0b');
  g.addColorStop(0.55, '#fb923c');
  g.addColorStop(1, 'rgba(251,191,36,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, baseY);
  ctx.quadraticCurveTo(x - w * 0.4, baseY - h * 0.6, x, baseY - h);
  ctx.quadraticCurveTo(x + w * 0.4, baseY - h * 0.6, x + w / 2, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.22, baseY);
  ctx.quadraticCurveTo(x - w * 0.15, baseY - h * 0.42, x, baseY - h * 0.62);
  ctx.quadraticCurveTo(x + w * 0.15, baseY - h * 0.42, x + w * 0.22, baseY);
  ctx.closePath();
  ctx.fill();
};

export function CookingCanvas() {
  const ref = useResponsiveCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const panW = Math.min(w * 0.66, 168);
    const panY = h * 0.66;
    const flameBaseY = panY + 20;
    const veggies = [
      { c: '#3daa7d', r: 5.5, ph: 0 },
      { c: '#e8903a', r: 6.5, ph: 1.1 },
      { c: '#7c6bdb', r: 5, ph: 2.1 },
      { c: '#e05a5a', r: 6, ph: 3 },
      { c: '#3daa7d', r: 4.5, ph: 4 },
      { c: '#e8903a', r: 5, ph: 5 },
    ];

    drawFlame(ctx, cx - panW * 0.32, flameBaseY, 0.72, t * 9);
    drawFlame(ctx, cx, flameBaseY + 2, 1.05, t * 9 + 2);
    drawFlame(ctx, cx + panW * 0.32, flameBaseY, 0.9, t * 9 + 4);

    ctx.save();
    ctx.translate(cx, panY);
    ctx.rotate(Math.sin(t * 2.2) * 0.06);
    ctx.beginPath();
    ctx.moveTo(-panW / 2, -6);
    ctx.quadraticCurveTo(0, 40, panW / 2, -6);
    ctx.lineTo(panW / 2, -8);
    ctx.quadraticCurveTo(0, 34, -panW / 2, -8);
    ctx.closePath();
    const pg = ctx.createLinearGradient(0, -8, 0, 36);
    pg.addColorStop(0, '#4b5563');
    pg.addColorStop(1, '#1f2937');
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-panW / 2, -7);
    ctx.quadraticCurveTo(0, 22, panW / 2, -7);
    ctx.stroke();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-panW / 2, -6);
    ctx.lineTo(-panW / 2 - 34, -18);
    ctx.stroke();
    ctx.restore();

    veggies.forEach((v, i) => {
      const p = t * 1.5 + v.ph;
      const lift = Math.max(0, Math.sin(p));
      const sway = Math.sin(p * 0.5 + i) * panW * 0.24;
      ctx.beginPath();
      ctx.arc(cx + sway, panY - 4 - lift * 42 - Math.abs(sway) * 0.04, v.r, 0, Math.PI * 2);
      ctx.fillStyle = v.c;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    for (let s = 0; s < 3; s += 1) {
      const sx = cx + (s - 1) * panW * 0.26;
      ctx.strokeStyle = `rgba(148,163,184,${0.35 + 0.25 * Math.sin(t * 2 + s)})`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let k = 0; k <= 6; k += 1) {
        const yy = panY - 30 - k * 9;
        const xx = sx + Math.sin(t * 2.5 + k * 0.7 + s) * 5;
        if (k === 0) ctx.moveTo(xx, yy);
        else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    }
  });

  return <canvas ref={ref} className="s5-canvas" role="img" aria-label="炒菜动画：小火到中火再到大火，食材在锅里翻炒" />;
}

const STAGES = [
  { label: 'Stage I', res: '512', hint: '基础关联', grid: 2, color: '#93b4e0' },
  { label: 'Stage II', res: '1024', hint: '上下文推理', grid: 4, color: '#5a86c9' },
  { label: 'Stage III', res: '2048', hint: '高保真', grid: 8, color: '#2e5aac' },
];

export function StageProgressCanvas() {
  const ref = useResponsiveCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const padX = Math.max(56, w * 0.12);
    const nodes = STAGES.map((stage, i) => ({
      ...stage,
      x: padX + ((w - padX * 2) * i) / (STAGES.length - 1),
      y: h * 0.72 - (h * 0.42 * i) / (STAGES.length - 1),
    }));
    const prog = Math.max(0, Math.min(1, (t % 6) / 4.2));
    const posX = nodes[0].x + (nodes[2].x - nodes[0].x) * prog;
    const yAt = (x: number) => {
      const i = x <= nodes[1].x ? 0 : 1;
      const a = nodes[i];
      const b = nodes[i + 1];
      const r = Math.min(1, Math.max(0, (x - a.x) / (b.x - a.x)));
      return a.y + (b.y - a.y) * r;
    };
    const posY = yAt(posX);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    nodes.forEach((n, i) => (i === 0 ? ctx.moveTo(n.x, n.y) : ctx.lineTo(n.x, n.y)));
    ctx.stroke();

    const grad = ctx.createLinearGradient(nodes[0].x, 0, nodes[2].x, 0);
    grad.addColorStop(0, '#93b4e0');
    grad.addColorStop(1, '#2e5aac');
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let x = nodes[0].x; x <= posX; x += 4) ctx.lineTo(x, yAt(x));
    ctx.lineTo(posX, posY);
    ctx.save();
    ctx.lineTo(posX, h * 0.88);
    ctx.lineTo(nodes[0].x, h * 0.88);
    ctx.closePath();
    ctx.fillStyle = 'rgba(46,90,172,0.08)';
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 6;
    ctx.stroke();

    nodes.forEach((n) => {
      const reached = posX >= n.x - 1;
      const gw = 30;
      const gx = n.x - gw / 2;
      const gy = n.y - 58;
      ctx.globalAlpha = reached ? 1 : 0.28;
      for (let r = 0; r < n.grid; r += 1) {
        for (let c = 0; c < n.grid; c += 1) {
          const cell = gw / n.grid;
          ctx.fillStyle = (r + c) % 2 === 0 ? n.color : '#dbe4f2';
          ctx.fillRect(gx + c * cell + 0.5, gy + r * cell + 0.5, cell - 1, cell - 1);
        }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(46,90,172,0.25)';
      ctx.strokeRect(gx, gy, gw, gw);
      ctx.beginPath();
      ctx.arc(n.x, n.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = reached ? n.color : '#fff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = reached ? n.color : '#cbd5e1';
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1f2937';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText(n.label, n.x, n.y + 26);
      ctx.fillStyle = reached ? '#2e5aac' : '#6b7280';
      ctx.font = '700 12px Inter, sans-serif';
      ctx.fillText(`${n.res}x${n.res}`, n.x, n.y + 43);
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillText(n.hint, n.x, n.y + 59);
    });

    ctx.beginPath();
    ctx.arc(posX, posY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#2e5aac';
    ctx.fill();
    ctx.strokeStyle = 'rgba(46,90,172,0.25)';
    ctx.lineWidth = 6;
    ctx.stroke();
  });

  return <canvas ref={ref} className="s5-canvas" role="img" aria-label="三阶段训练进度条：分辨率从 512 到 1024 再到 2048" />;
}

function shade(hex: string, amt: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

export function PostTrainingCanvas() {
  const particles = useRef<{ x: number; y: number; vy: number; life: number; kind: number }[]>([]);
  const lastSpawn = useRef(0);
  const ref = useResponsiveCanvas((ctx, w, h, t) => {
    ctx.clearRect(0, 0, w, h);
    const cycle = (t % 8) / 8;
    const sftActive = cycle < 0.5;
    const quality = Math.min(1, cycle * 1.05);
    const size = Math.min(h * 0.62, w * 0.34);
    const ix = w * 0.26 - size / 2;
    const iy = (h - size) / 2 - 6;
    const grid = Math.round(3 + quality * 13);
    const sceneColor = (u: number, v: number) => {
      if (v < 0.55) return Math.hypot(u - 0.72, v - 0.28) < 0.14 ? '#f6c453' : '#bbd6f2';
      return '#8fcb9b';
    };

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(ix, iy, size, size, 12);
    ctx.clip();
    const cell = size / grid;
    for (let row = 0; row < grid; row += 1) {
      for (let col = 0; col < grid; col += 1) {
        const u = (col + 0.5) / grid;
        const v = (row + 0.5) / grid;
        const jitter = (Math.sin((row * 12.9 + col * 78.2) * 43758.5) % 1) * (1 - cycle) * 30;
        ctx.fillStyle = shade(sceneColor(u, v), jitter);
        ctx.fillRect(ix + col * cell, iy + row * cell, cell + 0.6, cell + 0.6);
      }
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(46,90,172,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(ix, iy, size, size, 12);
    ctx.stroke();

    if (!sftActive && t - lastSpawn.current > 0.28) {
      lastSpawn.current = t;
      particles.current.push({ x: ix + size * (0.2 + Math.random() * 0.6), y: iy + size * 0.2, vy: 22 + Math.random() * 14, life: 1, kind: Math.random() < 0.5 ? 0 : 1 });
    }
    particles.current = particles.current.filter((p) => p.life > 0);
    particles.current.forEach((p) => {
      p.y -= p.vy * 0.016;
      p.life -= 0.012;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.kind === 0 ? '#e8903a' : '#3daa7d';
      ctx.font = '700 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.kind === 0 ? '★' : '+1', p.x, p.y);
      ctx.globalAlpha = 1;
    });

    const rx = w * 0.52;
    const pill = (x: number, y: number, label: string, active: boolean, color: string) => {
      ctx.beginPath();
      ctx.roundRect(x, y, 118, 30, 15);
      ctx.fillStyle = active ? color : '#f1f5f9';
      ctx.fill();
      ctx.fillStyle = active ? '#fff' : '#64748b';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + 59, y + 15);
      ctx.textBaseline = 'alphabetic';
    };
    pill(rx, iy + 6, 'SFT 精修', sftActive, '#5a86c9');
    pill(rx + 130, iy + 6, 'RLHF 对齐', !sftActive, '#2e5aac');
    ctx.fillStyle = '#4b5563';
    ctx.textAlign = 'left';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(sftActive ? '美学 / 真实感 / Prompt Agent 微调' : 'OCR / 审美 / 指令遵循 / 推理质量', rx, iy + 66);

    const barX = rx;
    const barY = iy + size - 26;
    const barW = w * 0.4;
    ctx.fillStyle = '#eaecef';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, 14, 7);
    ctx.fill();
    const qg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    qg.addColorStop(0, '#93b4e0');
    qg.addColorStop(1, '#2e5aac');
    ctx.fillStyle = qg;
    ctx.beginPath();
    ctx.roundRect(barX, barY, Math.max(14, barW * quality), 14, 7);
    ctx.fill();
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('感知质量', barX, barY - 8);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2e5aac';
    ctx.font = '700 12px Inter, sans-serif';
    ctx.fillText(`${Math.round(quality * 100)}%`, barX + barW, barY - 8);
  });

  return <canvas ref={ref} className="s5-canvas" role="img" aria-label="后训练精修动画：SFT 提升画面细节，RLHF 用奖励信号对齐质量" />;
}

export function S5CanvasFrame({ children }: { children: ReactNode }) {
  return <div className="s5-canvas-frame">{children}</div>;
}
