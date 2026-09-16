import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, COLORS, drawDrop, drawFeedbackBox } from './aiflow-shared';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const Ch6Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const [q, setQ] = useState(8);
  const [k, setK] = useState(3);
  const qRef = useRef(q); qRef.current = q;
  const kRef = useRef(k); kRef.current = k;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Node Guardian 运行时', 540, 20);
      const qv = qRef.current;
      const kv = kRef.current;
      ctx.fillStyle = COLORS.lightEnv; ctx.fillRect(150, 40, 120, qv * 8 + 20);
      ctx.strokeStyle = COLORS.darkEnv; ctx.lineWidth = 2; ctx.strokeRect(150, 40, 120, qv * 8 + 20);
      ctx.fillStyle = COLORS.textMuted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`队列 q=${qv}`, 210, 35);
      const arrival = Math.floor(t / 8) % (qv + 2);
      for (let i = 0; i < Math.min(arrival, qv); i++) {
        ctx.fillStyle = i >= qv ? COLORS.red : COLORS.blue;
        drawDrop(ctx, 210, 55 + i * 8, 4, i >= qv ? COLORS.red : COLORS.blue);
      }
      const backlog = Math.max(0, arrival - kv);
      ctx.fillStyle = backlog > qv * 0.8 ? COLORS.red : COLORS.orange;
      ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`积压: ${backlog}`, 300, 50);
      for (let i = 0; i < kv; i++) {
        const wx = 350 + i * 80;
        ctx.fillStyle = COLORS.green;
        ctx.beginPath(); ctx.arc(wx, 80, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLORS.bg; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`W${i + 1}`, wx, 83);
        ctx.strokeStyle = COLORS.lightEnv; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(270, 60); ctx.lineTo(wx, 68); ctx.stroke();
        const p = ((t * 0.02 + i * 0.3) % 1);
        if (p < 0.9) drawDrop(ctx, 270 + (wx - 270) * p, 60 + (68 - 60) * p, 3, COLORS.green);
        ctx.strokeStyle = COLORS.border; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(wx, 92); ctx.lineTo(wx + 60, 120); ctx.stroke();
        drawDrop(ctx, wx + 30, 105, 3, COLORS.green);
      }
      ctx.fillStyle = COLORS.textMuted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`工作者数 k=${kv}`, 350, 130);
      ctx.fillText(`吞吐: ${kv} token/cycle`, 350, 145);
      const throughput = kv;
      const saturation = arrival > qv;
      drawFeedbackBox(ctx, 500, 200, 300,
        saturation ? '队列饱和！背压传播中...' : `吞吐 ${throughput}/cycle，队列稳定`,
        saturation ? COLORS.red : COLORS.green);
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
        <label>队列容量 q = <span className="val">{q}</span></label>
        <input type="range" min={2} max={16} value={q} onChange={e => setQ(Number(e.target.value))} />
        <label>工作者数 k = <span className="val">{k}</span></label>
        <input type="range" min={1} max={5} value={k} onChange={e => setK(Number(e.target.value))} />
      </div>
      <div className={`feedback ${q < 4 ? 'bad' : 'good'}`}>
        {q < 4 ? '队列过小可能导致丢包' : k >= 3 ? '工作者充足，吞吐稳定' : '工作者不足，积压增长'}
      </div>
    </div>
  );
};

const Ch6Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('实时队列深度与背压监控', 20, 20);
      const bars = 20;
      const barW = (W - 60) / bars;
      for (let i = 0; i < bars; i++) {
        const v = (Math.sin(t * 0.05 + i * 0.5) * 0.4 + 0.5) * 100;
        const h = clamp(v, 5, 100);
        const bounded = i % 5 === 4;
        ctx.fillStyle = bounded ? COLORS.green : COLORS.orange;
        ctx.fillRect(30 + i * barW, 200 - h, barW - 4, h);
        if (bounded) {
          ctx.strokeStyle = COLORS.green; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(30 + i * barW, 195); ctx.lineTo(30 + (i + 1) * barW - 4, 195); ctx.stroke();
        }
      }
      ctx.strokeStyle = COLORS.red; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(20, 100); ctx.lineTo(W - 20, 100); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.red; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('受控消融：无界策略 MaxQ=131', W - 20, 95);
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(20, 160); ctx.lineTo(W - 20, 160); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COLORS.green;
      ctx.fillText('AiFlow MaxQ=8 (有界)', W - 20, 155);
      const legend = [
        { color: COLORS.green, label: 'AiFlow（有界）' },
        { color: COLORS.orange, label: '无背压（无界）' },
      ];
      legend.forEach((l, i) => {
        ctx.fillStyle = l.color;
        ctx.fillRect(20, 230 + i * 20, 12, 12);
        ctx.fillStyle = COLORS.textMain; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(l.label, 40, 240 + i * 20);
      });
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
        <label>实时监控：队列深度随时间变化</label>
      </div>
      <div className="feedback good">
        受控消融（Table 7）：AiFlow将队列深度控制在声明边界内（MaxQ=8），无界策略 MaxQ=131
      </div>
    </div>
  );
};

const Ch7Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [nodes, setNodes] = useState(3);
  const [q, setQ] = useState(8);
  const [k, setK] = useState(3);
  const nodesRef = useRef(nodes); nodesRef.current = nodes;
  const qRef = useRef(q); qRef.current = q;
  const kRef = useRef(k); kRef.current = k;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('有界内存计算器', 20, 20);
      const nv = nodesRef.current;
      const qv = qRef.current;
      const kv = kRef.current;
      const rho = 4;
      const queueTotal = nv * qv;
      const workerTotal = nv * kv;
      const orderTotal = nv * rho;
      const nodeSum = queueTotal + workerTotal + orderTotal;
      const edgeBuf = (nv - 1) * 4;
      const stateBuf = nv * 2;
      const total = nodeSum + edgeBuf + stateBuf;
      const components = [
        { label: `Σ qₙ = ${nv}×${qv} = ${queueTotal}`, val: queueTotal, color: COLORS.blue },
        { label: `Σ kₙ = ${nv}×${kv} = ${workerTotal}`, val: workerTotal, color: COLORS.green },
        { label: `Σ ρₙ = ${nv}×${rho} = ${orderTotal}`, val: orderTotal, color: COLORS.purple },
        { label: `Σ bₑ = ${nv - 1}×4 = ${edgeBuf}`, val: edgeBuf, color: COLORS.orange },
        { label: `Σ mₛ = ${nv}×2 = ${stateBuf}`, val: stateBuf, color: COLORS.red },
      ];
      let yOff = 45;
      const maxVal = Math.max(queueTotal, workerTotal, orderTotal, edgeBuf, stateBuf, 1);
      components.forEach(c => {
        ctx.fillStyle = c.color; ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(c.label, 20, yOff);
        const barW = (c.val / maxVal) * 300;
        ctx.fillStyle = c.color;
        ctx.fillRect(250, yOff - 12, barW, 16);
        ctx.fillStyle = COLORS.textMuted;
        ctx.fillText(`${c.val}`, 250 + barW + 10, yOff);
        yOff += 28;
      });
      ctx.fillStyle = COLORS.green; ctx.font = '13px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`B_runtime ≤ ${nodeSum} + ${edgeBuf} + ${stateBuf} = ${total}`, 20, yOff + 10);
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 2;
      ctx.strokeRect(15, yOff - 10, 500, 25);
      drawFeedbackBox(ctx, 600, yOff, 300, '总缓冲区有界且编译时可计算', COLORS.green);
      ctx.fillStyle = COLORS.textMuted; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('Proposition 1: 声明式队列+工作者+排序+边+状态保证运行时总缓冲区有界', 20, yOff + 40);
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
        <label>节点数 N = <span className="val">{nodes}</span></label>
        <input type="range" min={1} max={6} value={nodes} onChange={e => setNodes(Number(e.target.value))} />
        <label>队列容量 q = <span className="val">{q}</span></label>
        <input type="range" min={2} max={16} value={q} onChange={e => setQ(Number(e.target.value))} />
        <label>工作者数 k = <span className="val">{k}</span></label>
        <input type="range" min={1} max={5} value={k} onChange={e => setK(Number(e.target.value))} />
      </div>
      <div className="feedback good">
        B_runtime ≤ Σ(qₙ + kₙ + ρₙ) + Σ bₑ + Σ mₛ = {(() => { const rho = 4; const ns = nodes * (q + k + rho); const eb = (nodes - 1) * 4; const ms = nodes * 2; return ns + eb + ms; })()}（有界）
      </div>
    </div>
  );
};

const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [selPart, setSelPart] = useState(0);
  const selRef = useRef(selPart); selRef.current = selPart;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const parts = [
      { x: 100, y: 100, label: 'DSL/JSON', desc: '声明式图定义，描述节点策略和边类型' },
      { x: 260, y: 100, label: '编译器', desc: '六类静态校验：未知节点ID、边类型不兼容、非流式算子、无反馈环、共享状态冲突、注入类型不匹配' },
      { x: 420, y: 100, label: '流图', desc: 'G=(N,E,π,τ)，类型化Context<T>事件传播' },
      { x: 580, y: 100, label: 'Node Guardian', desc: '运行时管理器：队列、工作者、排序、溢出、取消' },
      { x: 740, y: 100, label: '工作者池', desc: 'k个并发工作者处理Context事件' },
      { x: 900, y: 100, label: '下游节点', desc: '推理、脱敏、TTS、安全等应用节点' },
    ];

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('AiFlow 系统架构', 540, 20);
      for (let i = 0; i < parts.length - 1; i++) {
        ctx.strokeStyle = COLORS.lightEnv; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(parts[i].x + 20, parts[i].y); ctx.lineTo(parts[i + 1].x - 20, parts[i + 1].y); ctx.stroke();
        drawDrop(ctx, (parts[i].x + parts[i + 1].x) / 2, parts[i].y, 4, COLORS.green);
      }
      parts.forEach((p, i) => {
        const active = selRef.current === i;
        ctx.fillStyle = active ? COLORS.orange : COLORS.darkEnv;
        ctx.beginPath(); ctx.arc(p.x, p.y, active ? 22 : 18, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = active ? COLORS.orange : COLORS.border; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = COLORS.bg; ctx.font = '9px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(p.label, p.x, p.y + 3);
      });
      const sel = parts[selRef.current];
      ctx.fillStyle = COLORS.textMain; ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`▶ ${sel.label}`, 20, 200);
      ctx.fillStyle = COLORS.textMuted; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText(sel.desc, 20, 220);
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
        <label>系统组件</label>
        {['DSL/JSON', '编译器', '流图', 'Node Guardian', '工作者池', '下游节点'].map((label, i) => (
          <button key={i} className={selPart === i ? 'active' : ''} onClick={() => setSelPart(i)}>{label}</button>
        ))}
      </div>
      <div className="feedback">
        {['声明式图定义', '六类静态校验', '类型化事件传播', '队列与工作者管理', '并发处理', '应用节点'][selPart]}
      </div>
    </div>
  );
};

const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const tRef = useRef(0);
  const [policy, setPolicy] = useState<'block' | 'drop-newest' | 'drop-oldest' | 'error'>('block');
  const polRef = useRef(policy); polRef.current = policy;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('溢出策略对比', 20, 20);
      const qCap = 6;
      const fill = Math.floor((t / 10) % (qCap + 4));
      ctx.fillStyle = COLORS.lightEnv; ctx.fillRect(150, 40, 80, qCap * 16 + 10);
      ctx.strokeStyle = COLORS.darkEnv; ctx.lineWidth = 2; ctx.strokeRect(150, 40, 80, qCap * 16 + 10);
      ctx.fillStyle = COLORS.textMuted; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`q=${qCap}`, 190, 35);
      for (let i = 0; i < Math.min(fill, qCap); i++) {
        ctx.fillStyle = COLORS.blue;
        ctx.fillRect(152, 40 + (qCap - 1 - i) * 16 + 5, 76, 12);
      }
      const p = polRef.current;
      if (fill > qCap) {
        const overflow = fill - qCap;
        if (p === 'block') {
          ctx.fillStyle = COLORS.orange;
          ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('阻塞上游（背压）', 190, 160);
          for (let i = 0; i < 5; i++) {
            const dy = ((t * 2 + i * 20) % 40);
            drawDrop(ctx, 190, 20 + dy, 3, COLORS.orange);
          }
          ctx.fillStyle = COLORS.orange; ctx.font = '9px "Segoe UI", sans-serif';
          ctx.fillText('上游等待', 190, 175);
        } else if (p === 'drop-newest') {
          for (let i = 0; i < overflow; i++) {
            ctx.fillStyle = COLORS.red;
            ctx.beginPath(); ctx.arc(260, 50 + i * 16, 5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = COLORS.red; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(260, 50 + i * 16); ctx.lineTo(290, 40 + i * 16); ctx.stroke();
          }
          ctx.fillStyle = COLORS.red; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
          ctx.fillText('丢弃最新', 300, 50);
        } else if (p === 'drop-oldest') {
          for (let i = 0; i < overflow; i++) {
            ctx.fillStyle = COLORS.red;
            ctx.beginPath(); ctx.arc(120, 120 + i * 16, 5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = COLORS.red; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(120, 120 + i * 16); ctx.lineTo(90, 130 + i * 16); ctx.stroke();
          }
          ctx.fillStyle = COLORS.red; ctx.font = '10px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
          ctx.fillText('丢弃最旧', 30, 120);
        } else {
          ctx.fillStyle = COLORS.red;
          ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('⚠ 报错！', 190, 160);
        }
      }
      const labels: Record<string, string> = {
        'block': '上游被阻塞，等待消费者处理',
        'drop-newest': '新到达的事件被丢弃',
        'drop-oldest': '最旧的队列项被移除',
        'error': '抛出异常，停止处理',
      };
      drawFeedbackBox(ctx, 450, 200, 350, labels[p], p === 'error' ? COLORS.red : p === 'block' ? COLORS.orange : COLORS.red);
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
        <label>溢出策略</label>
        <button className={policy === 'block' ? 'active' : ''} onClick={() => setPolicy('block')}>block</button>
        <button className={policy === 'drop-newest' ? 'active' : ''} onClick={() => setPolicy('drop-newest')}>drop-newest</button>
        <button className={policy === 'drop-oldest' ? 'active' : ''} onClick={() => setPolicy('drop-oldest')}>drop-oldest</button>
        <button className={policy === 'error' ? 'active' : ''} onClick={() => setPolicy('error')}>error</button>
      </div>
      <div className={`feedback ${policy === 'error' ? 'bad' : 'good'}`}>
        {policy === 'block' ? '阻塞策略：上游暂停发送，形成背压传播'
        : policy === 'drop-newest' ? '丢弃最新：新到达事件被丢弃，旧事件保留'
        : policy === 'drop-oldest' ? '丢弃最旧：队列头部移除，新事件入队'
        : '错误策略：抛出异常，适用于不允许丢失的场景'}
      </div>
    </div>
  );
};

const Ch10Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState<'ttfpt' | 'maxq'>('ttfpt');
  const metRef = useRef(metric); metRef.current = metric;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const data = {
      ttfpt: [
        { label: 'AiFlow', val: 1151.9, max: 6500, color: COLORS.green, unit: 'ms' },
        { label: '聚合基线', val: 5495.0, max: 6500, color: COLORS.red, unit: 'ms' },
        { label: 'LangGraph', val: 6336.4, max: 6500, color: COLORS.orange, unit: 'ms' },
        { label: 'RAG-AiFlow', val: 991.5, max: 6500, color: COLORS.green, unit: 'ms' },
        { label: 'RAG-聚合', val: 3401.5, max: 6500, color: COLORS.red, unit: 'ms' },
      ],
      maxq: [
        { label: 'AiFlow', val: 8.0, max: 240, color: COLORS.green, unit: '' },
        { label: '无界策略', val: 231.2, max: 240, color: COLORS.red, unit: '' },
        { label: 'Ollama-AiFlow', val: 8.0, max: 240, color: COLORS.green, unit: '' },
        { label: 'Ollama-聚合', val: 127.1, max: 240, color: COLORS.red, unit: '' },
      ],
    };

    const render = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H);
      const m = metRef.current;
      const rows = data[m];
      ctx.fillStyle = COLORS.darkEnv; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(m === 'ttfpt' ? '应用首令牌处理时间 (TTFPT) — DeepSeek 30轮配对重放 + Ollama本地检查' : '最大队列深度 (MaxQ) — DeepSeek 30轮回放：无界策略 MaxQ=231.2', 20, 20);
      const barW = 500;
      const barH = 28;
      rows.forEach((r, i) => {
        const y = 50 + i * 42;
        ctx.fillStyle = COLORS.textMain; ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(r.label, 150, y + 18);
        const w = (r.val / r.max) * barW;
        ctx.fillStyle = r.color;
        ctx.fillRect(160, y, w, barH);
        ctx.fillStyle = COLORS.bg; ctx.font = '11px "Segoe UI", sans-serif'; ctx.textAlign = 'right';
        ctx.fillText(`${r.val}${r.unit}`, 160 + w - 5, y + 18);
        if (w > 30) {
          ctx.fillStyle = COLORS.bg;
          ctx.fillText(`${r.val}${r.unit}`, 160 + w - 5, y + 18);
        } else {
          ctx.fillStyle = r.color;
          ctx.textAlign = 'left';
          ctx.fillText(`${r.val}${r.unit}`, 160 + w + 5, y + 18);
        }
      });
      const improvement = m === 'ttfpt' ? '70.9%-94.7%' : '93.7%-96.5%';
      drawFeedbackBox(ctx, 700, 200, 320, `AiFlow改善: ${improvement}`, COLORS.green);
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
        <label>指标</label>
        <button className={metric === 'ttfpt' ? 'active' : ''} onClick={() => setMetric('ttfpt')}>TTFPT</button>
        <button className={metric === 'maxq' ? 'active' : ''} onClick={() => setMetric('maxq')}>MaxQ</button>
      </div>
      <div className="feedback good">
        {metric === 'ttfpt'
          ? 'TTFPT降低70.9%-94.7%（DeepSeek 30轮配对重放 + Ollama本地检查，Wilcoxon p<0.001）'
          : 'MaxQ降低93.7%-96.5%（DeepSeek 30轮回放：无界策略 MaxQ=231.2 vs AiFlow MaxQ=8）'}
      </div>
    </div>
  );
};

export { Ch6Mod1, Ch6Mod2, Ch7Mod1, Ch8Mod1, Ch9Mod1, Ch10Mod1 };
