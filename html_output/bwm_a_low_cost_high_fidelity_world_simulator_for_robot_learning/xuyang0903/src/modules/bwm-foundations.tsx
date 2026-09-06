import React, { useEffect, useMemo, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  ink: '#243128', muted: '#647068', line: '#cbd6c6', paper: '#ffffff', field: '#f8faf7',
  blue: '#27446e', blueSoft: '#dce8f4', green: '#228d5c', greenSoft: '#dff3e9',
  orange: '#d97706', orangeSoft: '#fff0d6', red: '#c43f52', redSoft: '#f9e1e5', purple: '#7553a6',
};

const sources = [
  {
    id: 'real', index: '01', title: '真实机器人轨迹', kicker: '最贴近部署分布', tone: 'red',
    summary: '直接记录真实机器人与环境的交互。',
    strengths: ['真实外观与传感噪声', '真实交互结果'],
    limits: ['采集与人工监督成本高', '失败、碰撞与纠错数据难以安全覆盖'],
    boundary: '论文将真实采集的成本与失败数据覆盖困难列为核心动机之一。',
  },
  {
    id: 'physics', index: '02', title: '物理模拟器', kicker: '动作可控、可扩展', tone: 'orange',
    summary: '在构建好的数字环境中执行精确动作。',
    strengths: ['动作接口明确', '可重复测试候选策略'],
    limits: ['资产构建与标定负担重', '外观、感知和动力学存在 Sim-to-Real 差距'],
    boundary: '动作响应强不代表生成观测与真实部署分布完全一致。',
  },
  {
    id: 'video', index: '03', title: '通用视频模型', kicker: '视觉先验强', tone: 'blue',
    summary: '可以生成连贯、逼真的未来画面。',
    strengths: ['可利用大规模视频先验', '外观生成能力强'],
    limits: ['缺少精确机器人动作接口', '难以让动作与观测逐帧对齐'],
    boundary: '画面发生变化，不等于变化由给定机器人动作引起。',
  },
] as const;

function SourceCards() {
  const [selected, setSelected] = useState<(typeof sources)[number]['id']>('real');
  const active = sources.find((item) => item.id === selected) ?? sources[0];
  return (
    <div className="bwm-foundations source-explorer">
      <div className="source-card-grid" role="list" aria-label="三种训练数据来源">
        {sources.map((item) => (
          <button
            key={item.id}
            type="button"
            role="listitem"
            aria-pressed={selected === item.id}
            className={`source-card tone-${item.tone} ${selected === item.id ? 'is-active' : ''}`}
            onClick={() => setSelected(item.id)}
          >
            <span className="source-card-index">{item.index}</span>
            <span className="source-card-kicker">{item.kicker}</span>
            <strong>{item.title}</strong>
            <span className="source-card-summary">{item.summary}</span>
            <span className="source-card-action">查看证据边界 <span aria-hidden="true">→</span></span>
          </button>
        ))}
      </div>
      <div className={`source-detail tone-${active.tone}`} key={active.id}>
        <div className="source-detail-heading">
          <span>{active.index}</span>
          <div><small>当前展开</small><h5>{active.title}</h5></div>
        </div>
        <div className="source-detail-column good">
          <b>能够提供</b>
          {active.strengths.map((value) => <span key={value}>✓ {value}</span>)}
        </div>
        <div className="source-detail-column risk">
          <b>结构性限制</b>
          {active.limits.map((value) => <span key={value}>— {value}</span>)}
        </div>
        <p>{active.boundary}</p>
      </div>
      <div className="source-comparison" aria-label="训练数据来源与 BWM 对比表">
        <div className="source-comparison-head">
          <div><small>同一把尺子</small><strong>动作响应、视觉先验与构建负担</strong></div>
          <span>定性边界 · 非论文量化排名</span>
        </div>
        <div className="source-comparison-scroll">
          <table>
            <thead><tr><th>方案</th><th>动作响应</th><th>视觉先验</th><th>构建 / 采集负担</th><th>主要边界</th></tr></thead>
            <tbody>
              <tr><th>真实机器人轨迹</th><td><span className="metric yes">✓ 真实执行</span></td><td><span className="metric yes">✓ 真实观测</span></td><td><span className="metric high">高</span></td><td>失败与纠错数据难以安全覆盖</td></tr>
              <tr><th>物理模拟器</th><td><span className="metric yes">✓ 明确接口</span></td><td><span className="metric partial">△ 依赖资产</span></td><td><span className="metric high">高</span></td><td>外观、感知、动力学与控制存在迁移差异</td></tr>
              <tr><th>通用视频模型</th><td><span className="metric no">× 非精细控制</span></td><td><span className="metric yes">✓ 通用先验</span></td><td><span className="metric low">低¹</span></td><td>画面变化不能证明由逐帧动作驱动</td></tr>
              <tr className="is-bwm"><th><span>BWM</span><small>本文方法</small></th><td><span className="metric yes">✓ 机器人动作</span></td><td><span className="metric yes">✓ 视频先验</span></td><td><span className="metric partial">中¹</span></td><td>以通用先验 + 领域后训练补足两类能力</td></tr>
            </tbody>
          </table>
        </div>
        <p>¹“低 / 中 / 高”仅用于展示论文提出的相对动机，不是论文测得的成本数值，也不表示 BWM 可以取代所有真实采集或物理仿真。</p>
      </div>
    </div>
  );
}

function txt(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, color = C.ink, size = 12, weight = 600) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Microsoft YaHei", "Noto Sans SC", sans-serif`;
  ctx.fillText(value, x, y);
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = C.line, r = 10) {
  ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); ctx.stroke();
}

function pill(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, ok: boolean) {
  round(ctx, x, y, 70, 20, ok ? C.greenSoft : C.redSoft, ok ? C.green : C.red, 10);
  txt(ctx, `${ok ? '✓' : '×'} ${value}`, x + 10, y + 14, ok ? C.green : C.red, 9, 750);
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, color: string) {
  const end = x + dx;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(end, y); ctx.stroke();
  const sign = Math.sign(dx) || 1;
  ctx.beginPath(); ctx.moveTo(end, y); ctx.lineTo(end - sign * 7, y - 4); ctx.lineTo(end - sign * 7, y + 4); ctx.closePath(); ctx.fill();
}

function object(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, identity = 'A', square = false) {
  ctx.fillStyle = color; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (square) ctx.roundRect(x - 13, y - 13, 26, 26, 4); else ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  txt(ctx, identity, x - 4, y + 4, C.paper, 10, 800);
}

function useStaticCanvas(draw: (ctx: CanvasRenderingContext2D) => void, deps: React.DependencyList) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 820, 300);
    draw(ctx);
    canvas.classList.add('is-ready');
    // draw is intentionally state-bound through deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

function drawResponse(ctx: CanvasRenderingContext2D, command: number) {
  ctx.fillStyle = C.field; ctx.fillRect(0, 0, 820, 300);
  txt(ctx, '同一条动作指令', 22, 26, C.ink, 13, 800);
  const direction = command === 0 ? '保持' : command > 0 ? '向右' : '向左';
  txt(ctx, `${direction} · 幅度 ${Math.abs(command)}`, 140, 26, C.orange, 12, 750);
  arrow(ctx, 306, 21, command * 5.5, C.orange);
  const commandedX = 430 + command * 8;
  const rows = [
    { title: '物理模拟器', note: '随指令左右移动；真实迁移仍受资产与标定限制', color: C.orange, x: commandedX, action: true, state: true, scripted: false },
    { title: '通用视频模型', note: '始终播放同一镜头变化；左右指令不会让结果反向', color: C.blue, x: 430, action: false, state: false, scripted: true },
    { title: 'BWM', note: '方向与幅度随动作变化，并以初始观察约束场景身份', color: C.green, x: commandedX, action: true, state: true, scripted: false },
  ];
  rows.forEach((row, i) => {
    const y = 47 + i * 80;
    round(ctx, 20, y, 780, 68, C.paper, i === 2 ? C.green : C.line, 9);
    ctx.fillStyle = row.color; ctx.fillRect(20, y, 5, 68);
    txt(ctx, row.title, 39, y + 25, C.ink, 12, 800);
    txt(ctx, row.note, 39, y + 47, C.muted, 9, 550);
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(350, y + 39); ctx.lineTo(570, y + 39); ctx.stroke();
    ctx.fillStyle = C.line; ctx.fillRect(426, y + 30, 8, 18);
    if (row.scripted) {
      ctx.fillStyle = C.blueSoft; ctx.beginPath(); ctx.arc(535, y + 20, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.blueSoft; ctx.fillRect(350, y + 51, 82, 4);
      txt(ctx, '固定镜头脚本', 478, y + 55, C.blue, 8, 750);
      ctx.strokeStyle = C.red; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(commandedX, y + 25); ctx.lineTo(commandedX, y + 53); ctx.stroke(); ctx.setLineDash([]);
      txt(ctx, '指令目标', Math.min(530, Math.max(350, commandedX - 18)), y + 20, C.red, 8, 700);
    } else {
      ctx.strokeStyle = C.orange; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(commandedX, y + 24); ctx.lineTo(commandedX, y + 54); ctx.stroke(); ctx.setLineDash([]);
    }
    object(ctx, row.x, y + 39, row.color);
    pill(ctx, '动作响应', 598, y + 13, row.action);
    pill(ctx, '身份保持', 682, y + 13, row.state);
  });
  txt(ctx, '判读方法：从负值拖到正值。物理模拟器与 BWM 随符号反向；视频模型保持同一预设镜头。', 22, 290, C.muted, 10, 650);
}

function ActionResponse() {
  const [command, setCommand] = useState(5);
  const ref = useStaticCanvas((ctx) => drawResponse(ctx, command), [command]);
  const presets = [-8, -4, 0, 4, 8];
  return (
    <div className="bwm-foundations response-lab">
      <canvas ref={ref} className="bwm-response-canvas" width={820} height={300} aria-label="三类模型对同一动作的响应对照" />
      <div className="action-console">
        <div className="action-readout"><span>动作 aₜ</span><strong>{command > 0 ? '+' : ''}{command}</strong><small>{command < 0 ? '向左' : command > 0 ? '向右' : '保持'}</small></div>
        <div className="action-slider-wrap">
          <div className="action-slider-labels"><span>向左</span><b>拖动同一动作</b><span>向右</span></div>
          <input aria-label="动作指令" type="range" min="-10" max="10" step="1" value={command} onChange={(event) => setCommand(Number(event.target.value))} />
          <div className="action-presets">{presets.map((value) => <button type="button" key={value} className={value === command ? 'is-active' : ''} onClick={() => setCommand(value)}>{value > 0 ? '+' : ''}{value}</button>)}</div>
        </div>
      </div>
      <div className="module-footnote">交互为机制示意，不是论文报告的定量轨迹误差。</div>
    </div>
  );
}

function drawOneAction(ctx: CanvasRenderingContext2D, p: number) {
  ctx.fillStyle = C.field; ctx.fillRect(0, 0, 820, 310);
  txt(ctx, '测试动作：将物体 A 向右推动', 22, 27, C.ink, 13, 800);
  arrow(ctx, 280, 22, 58, C.orange);
  const cards = [
    { x: 20, title: '只追求视觉变化', subtitle: '变化与动作无关', action: false, state: true, tone: C.red },
    { x: 286, title: '响应动作但丢状态', subtitle: '位置对，身份漂移', action: true, state: false, tone: C.orange },
    { x: 552, title: 'BWM 条件预测', subtitle: '响应动作并保持状态', action: true, state: true, tone: C.green },
  ];
  cards.forEach((card, index) => {
    round(ctx, card.x, 48, 248, 238, C.paper, card.tone, 10);
    ctx.fillStyle = card.tone; ctx.fillRect(card.x, 48, 248, 5);
    txt(ctx, card.title, card.x + 16, 76, C.ink, 12, 800);
    txt(ctx, card.subtitle, card.x + 16, 95, C.muted, 9, 600);
    round(ctx, card.x + 15, 108, 218, 108, index === 1 && p > 0.65 ? '#f4eff9' : '#f7f9f5', C.line, 7);
    ctx.strokeStyle = '#aeb9ab'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(card.x + 35, 193); ctx.lineTo(card.x + 213, 193); ctx.stroke();
    ctx.fillStyle = C.blueSoft; ctx.fillRect(card.x + 37, 127, 35, 24);
    txt(ctx, '台', card.x + 48, 144, C.blue, 9, 700);
    let ox = card.x + 96;
    let oy = 177;
    let color = C.blue;
    let identity = 'A';
    let square = false;
    if (index === 0) { ox += 10 * Math.sin(p * Math.PI * 2); oy -= 24 * Math.sin(p * Math.PI); }
    if (index === 1) { ox += 86 * p; if (p > 0.58) { color = C.purple; identity = 'B'; square = true; } }
    if (index === 2) ox += 86 * p;
    object(ctx, ox, oy, color, identity, square);
    if (p > 0 && index === 0) txt(ctx, '镜头有变化', card.x + 129, 135, C.red, 9, 700);
    if (p > 0.58 && index === 1) txt(ctx, 'A → B', card.x + 157, 135, C.purple, 10, 800);
    pill(ctx, '动作响应', card.x + 33, 232, card.action);
    pill(ctx, '状态保持', card.x + 131, 232, card.state);
    txt(ctx, card.action && card.state ? '通过双重门槛' : '未通过世界模拟器门槛', card.x + 48, 273, card.action && card.state ? C.green : C.red, 9, 750);
  });
  txt(ctx, p >= 1 ? '一次动作结束：只有第三列同时满足 responsiveness 与 task-state preservation。' : '观察位置、物体身份和背景是否由同一动作一致地推进。', 22, 305, p >= 1 ? C.green : C.muted, 10, 700);
}

function OneActionTest() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [run, setRun] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, 820, 310);
    canvas.classList.add('is-ready');
    if (run === 0) { drawOneAction(ctx, 0); return; }
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / 1500);
      drawOneAction(ctx, p * p * (3 - 2 * p));
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [run]);
  return (
    <div className="bwm-foundations one-action-lab">
      <canvas ref={ref} className="bwm-action-test-canvas" width={820} height={310} aria-label="三种预测方式的一次动作测试" />
      <div className="one-action-controls">
        <button type="button" onClick={() => { setProgress(0); setRun((value) => value + 1); }}>{run === 0 ? '执行一次动作' : '重新执行'}</button>
        <div className="action-progress" aria-label={`执行进度 ${Math.round(progress * 100)}%`}><span style={{ width: `${progress * 100}%` }} /></div>
        <b>{progress < 1 ? '同步观察三种预测' : '检查完成'}</b>
      </div>
      <div className="module-footnote">位置正确只说明动作响应；物体身份与场景一致才说明任务状态被保留。</div>
    </div>
  );
}

export const BwmFoundations: React.FC<WidgetProps> = ({ moduleId }) => {
  const view = useMemo(() => {
    if (moduleId === '1.1') return <SourceCards />;
    if (moduleId === '1.2') return <ActionResponse />;
    return <OneActionTest />;
  }, [moduleId]);
  return view;
};

export default BwmFoundations;
