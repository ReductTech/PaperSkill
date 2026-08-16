import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

type RunState = 'ready' | 'running' | 'paused';
type Cluster = { id: number; x: number; y: number; radius: number; baseRadius: number; color: string };
type Particle = {
  x: number;
  y: number;
  size: number;
  stage: 0 | 1 | 2;
  isDuplicate: boolean;
  color: string;
  vx: number;
  vy: number;
  life: number;
  target: Cluster | null;
};

const COLORS = {
  bg: '#f8fafc',
  grid: '#e8edf3',
  image: '#3b82f6',
  match: '#ef4444',
  keep: '#22c55e',
  cluster: ['#2563eb', '#4f46e5', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'],
};

export function DedupSimulation(_props: WidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [threshold, setThreshold] = useState(0.8);
  const [clusterCount, setClusterCount] = useState(8);
  const [runState, setRunState] = useState<RunState>('ready');
  const [hud, setHud] = useState({ processed: 0, gpu: 0 });

  const sizeRef = useRef({ w: 0, h: 0 });
  const clustersRef = useRef<Cluster[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const statsRef = useRef({ gpu: 0, processed: 0 });
  const runRef = useRef<RunState>('ready');
  const cfgRef = useRef({ threshold: 0.8, clusterCount: 8 });

  runRef.current = runState;
  cfgRef.current = { threshold, clusterCount };

  const initClusters = () => {
    const { w, h } = sizeRef.current;
    const count = cfgRef.current.clusterCount;
    const cols = Math.ceil(Math.sqrt(count));
    const gridW = Math.max(180, Math.min(w, h) - 100);
    const startX = (w - gridW) / 2 + gridW * 0.12;
    const startY = (h - gridW) / 2 + gridW * 0.12;
    const cell = gridW / (cols + 1);

    clustersRef.current = Array.from({ length: count }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const base = cell * 0.4;
      return {
        id: i,
        x: startX + col * cell + cell / 2,
        y: startY + row * cell + cell / 2,
        baseRadius: base,
        radius: base * ((cfgRef.current.threshold - 0.5) / 0.5),
        color: COLORS.cluster[i % COLORS.cluster.length],
      };
    });
  };

  const spawnParticle = () => {
    const { h } = sizeRef.current;
    const clusters = clustersRef.current;
    const isDuplicate = Math.random() > 0.7;
    particlesRef.current.push({
      x: -20,
      y: Math.random() * h,
      size: 14,
      stage: 0,
      isDuplicate,
      color: isDuplicate ? COLORS.match : COLORS.keep,
      vx: 0,
      vy: 0,
      life: 30,
      target: clusters.length ? clusters[Math.floor(Math.random() * clusters.length)] : null,
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      sizeRef.current = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initClusters();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let raf = 0;
    let hudTick = 0;
    const update = () => {
      const { w, h } = sizeRef.current;
      const particles = particlesRef.current;
      if (particles.length < 60 && Math.random() < 0.06) spawnParticle();
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        if (p.stage === 0 && p.target) {
          const dx = p.target.x - p.x;
          const dy = p.target.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 5) {
            p.x += (dx / dist) * 3;
            p.y += (dy / dist) * 3;
          } else {
            p.stage = 1;
            statsRef.current.gpu = Math.min(100, statsRef.current.gpu + 18);
          }
        } else if (p.stage === 1) {
          p.stage = 2;
          statsRef.current.processed += 1;
          const angle = Math.random() * Math.PI * 2;
          p.vx = Math.cos(angle) * 3.5;
          p.vy = Math.sin(angle) * 3.5;
          p.life = 34;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 1;
          if (p.life <= 0) particles.splice(i, 1);
        }
        if (p.x > w + 60 || p.x < -60 || p.y > h + 60 || p.y < -60) particles.splice(i, 1);
      }
      statsRef.current.gpu = Math.max(0, statsRef.current.gpu - 0.8);
    };

    const loop = () => {
      const { w, h } = sizeRef.current;
      if (runRef.current === 'running') update();

      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 38) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += 38) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      clustersRef.current.forEach((c, index) => {
        const grad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, Math.max(4, c.radius));
        grad.addColorStop(0, c.color);
        grad.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(4, c.radius), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#64748b';
        ctx.font = '10px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`GPU${index}`, c.x, c.y + Math.max(4, c.radius) + 14);
      });
      ctx.textAlign = 'left';

      particlesRef.current.forEach((p) => {
        if (p.stage === 0 && p.target) {
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = 0.22;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.target.x, p.target.y);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = p.stage === 2 ? p.color : COLORS.image;
        ctx.shadowColor = p.stage === 2 ? p.color : COLORS.image;
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(p.x - p.size / 2, p.y + p.size / 3);
        ctx.lineTo(p.x, p.y - p.size / 4);
        ctx.lineTo(p.x + p.size / 2, p.y + p.size / 3);
        ctx.fill();
        if (p.stage === 2) {
          ctx.fillStyle = p.color;
          ctx.font = 'bold 11px ui-sans-serif, sans-serif';
          ctx.fillText(p.isDuplicate ? 'DUP' : 'KEEP', p.x + 10, p.y - 8);
        }
      });

      hudTick += 1;
      if (hudTick % 10 === 0) setHud({ processed: statsRef.current.processed, gpu: Math.floor(statsRef.current.gpu) });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    clustersRef.current.forEach((c) => {
      c.radius = c.baseRadius * ((threshold - 0.5) / 0.5);
    });
  }, [threshold]);

  useEffect(() => {
    if (runRef.current !== 'running') initClusters();
  }, [clusterCount]);

  const reset = () => {
    particlesRef.current = [];
    statsRef.current = { gpu: 0, processed: 0 };
    setHud({ processed: 0, gpu: 0 });
    initClusters();
    setRunState('ready');
  };

  const applyPreset = (type: 'conservative' | 'aggressive' | 'massive') => {
    particlesRef.current = [];
    statsRef.current = { gpu: 0, processed: 0 };
    setHud({ processed: 0, gpu: 0 });
    if (type === 'conservative') {
      setThreshold(0.95);
      setClusterCount(4);
    } else if (type === 'aggressive') {
      setThreshold(0.65);
      setClusterCount(32);
    } else {
      setThreshold(0.8);
      setClusterCount(16);
    }
    setRunState('running');
  };

  const statusLabel = runState === 'running' ? '运行中' : runState === 'paused' ? '已暂停' : '就绪';

  return (
    <div className="dedup-sim">
      <div className="dedup-control-panel">
        <div>
          <h4>工业级图片去重</h4>
          <p>模拟 SSCD 特征提取与 Faiss GPU 搜索流程。</p>
        </div>
        <label className="dedup-field">
          <span>
            相似度阈值 <b>{threshold.toFixed(2)}</b>
          </span>
          <input type="range" min={0.5} max={0.99} step={0.01} value={threshold} onChange={(e) => setThreshold(Number.parseFloat(e.target.value))} />
          <small>越严格，去重越多，也可能误杀相似图。</small>
        </label>
        <label className="dedup-field">
          <span>
            Faiss 分簇数 <b>{clusterCount}</b>
          </span>
          <input type="range" min={2} max={32} step={1} value={clusterCount} onChange={(e) => setClusterCount(Number.parseInt(e.target.value, 10))} />
          <small>预聚类数量决定搜索并行度。</small>
        </label>
        <div className="dedup-presets">
          <button onClick={() => applyPreset('conservative')}>保守去重</button>
          <button onClick={() => applyPreset('aggressive')}>激进去重</button>
          <button onClick={() => applyPreset('massive')}>海量数据</button>
        </div>
        <div className="dedup-actions">
          <button onClick={() => setRunState((s) => (s === 'running' ? 'paused' : 'running'))}>{runState === 'running' ? '暂停' : runState === 'paused' ? '继续' : '启动仿真'}</button>
          <button onClick={reset}>重置</button>
        </div>
      </div>
      <div ref={containerRef} className="dedup-stage">
        <div className="dedup-hud">
          <span>状态: {statusLabel}</span>
          <span>已处理: {hud.processed}</span>
          <span>GPU Load: {hud.gpu}%</span>
        </div>
        <canvas ref={canvasRef} aria-label="SSCD 与 Faiss 图像去重仿真" />
      </div>
    </div>
  );
}
