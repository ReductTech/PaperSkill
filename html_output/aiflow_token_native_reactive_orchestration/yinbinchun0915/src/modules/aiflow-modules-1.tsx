import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, COLORS, drawDrop, drawPlant, drawLabel, drawFeedbackBox } from './aiflow-shared';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const [mode, setMode] = useState<'aggregate' | 'streaming'>('aggregate');
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const t = tRef.current;
      const m = modeRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('模型输出', 80, 30);
      for (let i = 0; i < 8; i++) {
        const dropT = t * 1.5 + i * 25;
        const dy = dropT % 80;
        drawDrop(ctx, 80, 35 + dy, 4, COLORS.blue);
      }
      const downstream = 600;
      if (m === 'aggregate') {
        const drops = Math.floor(t / 10) % 8;
        ctx.fillStyle = COLORS.lightEnv; ctx.fillRect(160, 60, 80, 60);
        ctx.fillStyle = COLORS.blue;
        for (let i = 0; i < drops; i++) { drawDrop(ctx, 200, 75 + i * 6, 3, COLORS.blue); }
        ctx.fillStyle = COLORS.red; ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('等待全部令牌...', 200, 55);
        if (drops >= 7) {
          for (let i = 0; i < 5; i++) {
            const p = ((t - 70) * 0.05 + i * 0.2) % 1;
            if (p > 0 && p < 1) drawDrop(ctx, 240 + (downstream - 240) * p, 90, 4, COLORS.red);
          }
          drawPlant(ctx, downstream, 100, 40, 50, clamp((t - 70) * 0.01, 0, 1));
        }
        drawFeedbackBox(ctx, 400, 200, 280, 'TTFPT ≈ 10,940ms（52倍退化）', COLORS.red);
      } else {
        const branches = [
          { y: 90, color: COLORS.green, label: '推理日志' },
          { y: 130, color: COLORS.orange, label: '脱敏+TTS' },
          { y: 170, color: COLORS.purple, label: '安全过滤' },
        ];
        branches.forEach(b => {
          ctx.strokeStyle = COLORS.lightEnv; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(80, 50); ctx.lineTo(150, b.y); ctx.lineTo(downstream, b.y); ctx.stroke();
          for (let i = 0; i < 3; i++) {
            const p = ((t * 0.02 + i * 0.33) % 1);
            drawDrop(ctx, 150 + (downstream - 150) * p, b.y, 4, b.color);
          }
          ctx.fillStyle = b.color; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(b.label, downstream + 50, b.y + 4);
          drawPlant(ctx, downstream + 120, b.y - 20, 30, 40, clamp(t * 0.005, 0, 1));
        });
        drawFeedbackBox(ctx, 400, 220, 280, 'TTFPT ≈ 210ms（首令牌即处理）', COLORS.green);
      }
      tRef.current += 1;
    };

    const tick = () => { render(); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>处理模式</label>
        <button className={mode === 'aggregate' ? 'active' : ''} onClick={() => setMode('aggregate')}>聚合基线</button>
        <button className={mode === 'streaming' ? 'active' : ''} onClick={() => setMode('streaming')}>AiFlow流式</button>
      </div>
      <div className={`feedback ${mode === 'streaming' ? 'good' : 'bad'}`}>
        {mode === 'streaming' ? '首令牌到达即开始下游处理，TTFPT大幅降低' : '必须等待完整响应才处理，TTFPT高52倍'}
      </div>
    </div>
  );
};

const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const [selected, setSelected] = useState<'reasoning' | 'answer' | 'safety'>('reasoning');
  const selRef = useRef(selected);
  selRef.current = selected;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const types = [
      { key: 'reasoning', color: COLORS.green, label: '推理', route: 200 },
      { key: 'answer', color: COLORS.orange, label: '回答', route: 400 },
      { key: 'safety', color: COLORS.purple, label: '安全标签', route: 600 },
    ];

    const render = () => {
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Context<T> 事件流', 80, 20);
      types.forEach(tp => {
        const active = selRef.current === tp.key;
        ctx.fillStyle = active ? tp.color : COLORS.lightEnv;
        ctx.fillRect(20 + types.indexOf(tp) * 120, 140, 100, 30);
        ctx.fillStyle = active ? COLORS.bg : COLORS.textMain;
        ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(tp.label, 70 + types.indexOf(tp) * 120, 158);
        if (active) {
          ctx.strokeStyle = COLORS.border; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(80, 50); ctx.lineTo(tp.route, 100);
          ctx.lineTo(tp.route + 150, 100); ctx.stroke();
          for (let i = 0; i < 4; i++) {
            const p = ((t * 0.02 + i * 0.25) % 1);
            const dx = 80 + (tp.route - 80) * p;
            const dy = 50 + (100 - 50) * p;
            drawDrop(ctx, dx, dy, 4, tp.color);
          }
          ctx.fillStyle = tp.color; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(`路由至: ${tp.label}节点`, tp.route + 75, 90);
          drawPlant(ctx, tp.route + 130, 110, 40, 50, clamp(t * 0.003, 0, 1));
        }
      });
      ctx.fillStyle = COLORS.textMuted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('点击下方按钮选择令牌类型', 20, 195);
      tRef.current += 1;
    };

    const tick = () => { render(); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>令牌类型</label>
        <button className={selected === 'reasoning' ? 'active' : ''} onClick={() => setSelected('reasoning')}>推理</button>
        <button className={selected === 'answer' ? 'active' : ''} onClick={() => setSelected('answer')}>回答</button>
        <button className={selected === 'safety' ? 'active' : ''} onClick={() => setSelected('safety')}>安全标签</button>
      </div>
      <div className="feedback good">
        {selected === 'reasoning' ? '推理令牌 → 链式思维日志器' : selected === 'answer' ? '回答令牌 → 脱敏过滤器 + TTS' : '安全标签 → 安全检查节点'}
      </div>
    </div>
  );
};

const Ch3Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      const s = stepRef.current;
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('令牌到达序列', 540, 20);
      ctx.strokeStyle = COLORS.border; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(100, 50); ctx.lineTo(900, 50);
      for (let i = 0; i < 8; i++) {
        ctx.beginPath(); ctx.arc(100 + i * 100, 50, 6, 0, Math.PI * 2);
        ctx.fillStyle = i < s ? COLORS.green : COLORS.lightEnv;
        ctx.fill();
        ctx.strokeStyle = COLORS.border; ctx.stroke();
        ctx.fillStyle = COLORS.textMuted; ctx.font = '9px "Segoe UI", sans-serif';
        ctx.fillText(`T${i + 1}`, 100 + i * 100, 70);
      }
      const branches = [
        { y: 130, color: COLORS.green, label: '推理' },
        { y: 170, color: COLORS.orange, label: '脱敏' },
        { y: 210, color: COLORS.purple, label: '安全标签' },
      ];
      branches.forEach(b => {
        ctx.strokeStyle = COLORS.lightEnv; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(100, 80); ctx.lineTo(100, b.y); ctx.lineTo(900, b.y); ctx.stroke();
        for (let i = 0; i < s; i++) {
          const p = clamp((s - i) / 3, 0, 1);
          drawDrop(ctx, 100 + i * 100, b.y, 4, b.color);
        }
        ctx.fillStyle = b.color; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(b.label, 95, b.y + 4);
      });
      if (s > 0) {
        drawFeedbackBox(ctx, 350, 245, 380, `令牌${s}已到达，下游分支已激活`, COLORS.green);
      } else {
        drawFeedbackBox(ctx, 350, 245, 380, '点击"下一步"逐步推进令牌到达', COLORS.blue);
      }
    };

    const tick = () => { render(); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => setStep(Math.max(0, step - 1))}>上一步</button>
        <button onClick={() => setStep(Math.min(8, step + 1))}>下一步</button>
        <label>步骤: {step}/8</label>
      </div>
      <div className="feedback good">
        {step > 0 ? `令牌T${step}到达时，下游分支在生成完成前就开始处理` : '准备开始令牌级路由演示'}
      </div>
    </div>
  );
};

const Ch4Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [selNode, setSelNode] = useState(0);
  const selRef = useRef(selNode);
  selRef.current = selNode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const nodes = [
      { x: 150, y: 80, label: '分类', policy: 'q=8, k=3, o=block, σ=serialized' },
      { x: 350, y: 60, label: '推理日志', policy: 'q=4, k=1, o=drop-oldest, σ=stateless' },
      { x: 350, y: 120, label: '脱敏', policy: 'q=8, k=3, o=block, σ=partitioned' },
      { x: 550, y: 120, label: 'TTS', policy: 'q=16, k=2, o=drop-newest, σ=stateless' },
      { x: 350, y: 180, label: '安全', policy: 'q=4, k=1, o=error, σ=transactional' },
    ];
    const edges = [[0, 1], [0, 2], [0, 4], [2, 3]];

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('流图 G = (N, E, π, τ)', 300, 20);
      edges.forEach(([a, b]) => {
        ctx.strokeStyle = COLORS.lightEnv; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
      });
      nodes.forEach((n, i) => {
        const active = selRef.current === i;
        ctx.fillStyle = active ? COLORS.orange : COLORS.darkEnv;
        ctx.beginPath(); ctx.arc(n.x, n.y, active ? 18 : 14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = active ? COLORS.orange : COLORS.border; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = COLORS.bg; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + 3);
      });
      const sel = nodes[selRef.current];
      ctx.fillStyle = COLORS.textMain; ctx.font = '11px monospace'; ctx.textAlign = 'left';
      ctx.fillText(`节点: ${sel.label}`, 700, 80);
      ctx.fillText(`策略 P:`, 700, 100);
      sel.policy.split(',').forEach((part, i) => {
        ctx.fillText(`  ${part.trim()}`, 700, 120 + i * 20);
      });
      ctx.fillStyle = COLORS.textMuted; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('点击节点查看策略元组', 700, 220);
    };

    const tick = () => { render(); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>选择节点</label>
        {['分类', '推理日志', '脱敏', 'TTS', '安全'].map((label, i) => (
          <button key={i} className={selNode === i ? 'active' : ''} onClick={() => setSelNode(i)}>{label}</button>
        ))}
      </div>
      <div className="feedback">
        策略元组 P = (q, k, ρ, σ, o, c, r) 定义了每个节点的资源与行为约束
      </div>
    </div>
  );
};

const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [dsl, setDsl] = useState('node 分类 { q:8 k:3 o:block }');
  const dslRef = useRef(dsl);
  dslRef.current = dsl;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('DSL 声明', 20, 20);
      ctx.fillStyle = COLORS.border; ctx.fillRect(20, 28, 380, 120);
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '11px monospace';
      dslRef.current.split('\n').forEach((line, i) => {
        ctx.fillText(line, 28, 48 + i * 16);
      });
      ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(400, 80); ctx.lineTo(450, 80);
      ctx.moveTo(445, 75); ctx.lineTo(450, 80); ctx.lineTo(445, 85); ctx.stroke();
      ctx.fillStyle = COLORS.orange; ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('编译', 425, 70);
      ctx.fillStyle = COLORS.green; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('编译后的流图', 470, 20);
      const q = (dslRef.current.match(/q:(\d+)/) || [, '8'])[1];
      const k = (dslRef.current.match(/k:(\d+)/) || [, '3'])[1];
      const o = (dslRef.current.match(/o:(\w+)/) || [, 'block'])[1];
      ctx.fillStyle = COLORS.darkEnv;
      ctx.beginPath(); ctx.arc(530, 80, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COLORS.bg; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('分类', 530, 83);
      ctx.fillStyle = COLORS.orange; ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`q=${q}`, 560, 55);
      ctx.fillText(`k=${k}`, 560, 72);
      ctx.fillText(`o=${o}`, 560, 89);
      ctx.strokeStyle = COLORS.lightEnv; ctx.lineWidth = 4;
      for (let i = 0; i < parseInt(k); i++) {
        ctx.beginPath();
        ctx.moveTo(555, 95 + i * 12); ctx.lineTo(700, 95 + i * 12); ctx.stroke();
        drawDrop(ctx, 620, 95 + i * 12, 3, COLORS.green);
      }
      ctx.fillStyle = COLORS.green; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('工作者', 720, 100);
      drawFeedbackBox(ctx, 470, 160, 500, 'DSL编译为类型化流图，静态校验通过', COLORS.green);
    };

    const tick = () => { render(); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const updateField = (field: string, val: string) => {
    const re = new RegExp(`${field}:\\w+`);
    setDsl(dsl.replace(re, `${field}:${val}`));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>队列容量 q</label>
        <button onClick={() => updateField('q', '4')}>4</button>
        <button onClick={() => updateField('q', '8')}>8</button>
        <button onClick={() => updateField('q', '16')}>16</button>
        <label>工作者 k</label>
        <button onClick={() => updateField('k', '1')}>1</button>
        <button onClick={() => updateField('k', '3')}>3</button>
        <label>溢出 o</label>
        <button onClick={() => updateField('o', 'block')}>block</button>
        <button onClick={() => updateField('o', 'drop-newest')}>drop</button>
      </div>
      <div className="feedback good">
        修改DSL参数，观察编译后流图中队列容量、工作者数和溢出策略的变化
      </div>
    </div>
  );
};

export { Ch1Mod1, Ch2Mod1, Ch3Mod1, Ch4Mod1, Ch5Mod1 };
