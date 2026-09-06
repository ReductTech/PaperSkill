import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const H = 250;
type Kind = 'slider' | 'chips' | 'step' | 'compare' | 'hotspot' | 'race';

const configs: Record<string, {kind: Kind; label: string; options?: string[]; steps?: string[]}> = {
  '1.1': { kind: 'slider', label: '任务复杂度' },
  '1.2': { kind: 'chips', label: '结构形态', options: ['单 prompt', '链式', '图式'] },
  '2.1': { kind: 'hotspot', label: '节点类型', options: ['检索', '计划', '路由', '聚合', '验证'] },
  '3.1': { kind: 'step', label: 'G 条件', steps: ['G1 显式结构', 'G2 内容分离', 'G3 可执行语义', 'G4 一等制品'] },
  '4.1': { kind: 'slider', label: '结构/内容分离度' },
  '5.1': { kind: 'chips', label: '执行语义', options: ['线性', '分支', '并行', '循环'] },
  '6.1': { kind: 'compare', label: '复盘能力' },
  '7.1': { kind: 'step', label: '谱系迁移', steps: ['prompt chaining', 'thought topology', 'workflow graph', 'optimizable artifact'] },
  '8.1': { kind: 'hotspot', label: '边界案例', options: ['单提示', '架构图', 'Graph-of-Thoughts', 'LangGraph', 'DSPy'] },
  '9.1': { kind: 'chips', label: '系统案例', options: ['LangGraph', 'DSPy', 'Prompt Flow', 'AutoGen', 'CrewAI'] },
  '10.1': { kind: 'race', label: '四条件赛跑' },
};

function feedback(moduleId: string, value: number, option: string, step: number) {
  if (moduleId === '1.1') return value > 0.65 ? ['bad', '复杂度升高后，单句提示把路由、并行和校验都藏起来了。'] : ['', '低复杂度任务中，单 prompt 仍然可用。'];
  if (moduleId === '1.2') return option === '图式' ? ['good', '图式结构能同时表达分支、汇合、循环和工程制品。'] : option === '链式' ? ['', '链式能表达顺序依赖，但很难自然表达汇合与循环。'] : ['bad', '单 prompt 把结构压进文字，调试对象不清楚。'];
  if (moduleId === '2.1') return ['good', `当前节点：${option}。节点是作者化的计算单元，不只是画布上的装饰框。`];
  if (moduleId === '3.1') return step >= 3 ? ['good', '四项都满足时，定义测试通过。'] : ['', '继续检查：少一项就还不是完整的 prompt graph engineering。'];
  if (moduleId === '4.1') return value > 0.68 ? ['good', '结构固定、提示可调，优化器和人工修改都有抓手。'] : value < 0.35 ? ['bad', '结构与提示紧耦合，改一个节点可能牵动整段脚本。'] : ['', '部分分离能改善复用，但还不够稳定。'];
  if (moduleId === '5.1') return option === '循环' ? ['good', '循环不是被排除的；只要有运行语义和退出条件，它就是可执行图的一部分。'] : ['', `${option}语义说明运行时如何调度和路由节点。`];
  if (moduleId === '6.1') return value > 0.5 ? ['good', '有一等图对象后，可以版本化、校验和优化结构本身。'] : ['bad', '只有运行痕迹时，复盘和自动搜索都缺少稳定对象。'];
  if (moduleId === '7.1') return step >= 3 ? ['good', 'graph 的主导含义迁移到工程 artifact：可执行、可检查、可优化。'] : ['', '这一步仍更接近推理或链式编排，工程对象尚未完全成形。'];
  if (moduleId === '8.1') return ['good', `${option} 的判断要看 G1-G4 是否全满足，而不是看名字里有没有 graph。`];
  if (moduleId === '9.1') return option === 'LangGraph' || option === 'DSPy' || option === 'Prompt Flow' ? ['good', `${option} 更容易展示显式结构或结构/内容分离。`] : ['', `${option} 需要仔细区分“对话形状”和“一等图 artifact”。`];
  return value > 0.5 ? ['good', 'PGE 在四项条件上同时抵达终点；相邻概念通常只满足其中一部分。'] : ['', '点击开始，把定义的四个条件作为最后记忆点。'];
}

function draw(ctx: CanvasRenderingContext2D, moduleId: string, value: number, option: string, step: number, time: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 1;
  for (let x = 36; x < W; x += 52) { ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x + 8, H - 28); ctx.stroke(); }
  const nodes = [[62,178],[150,104],[244,164],[340,86],[452,148]];
  ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); nodes.forEach(([x,y],i)=> i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
  if (moduleId === '5.1' && (option === '并行' || option === '循环')) {
    ctx.strokeStyle = option === '循环' ? '#7c3aed' : '#27446e';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(150,104); ctx.lineTo(246,72); ctx.lineTo(340,86); ctx.stroke();
    if (option === '循环') { ctx.beginPath(); ctx.arc(294,126,36,0.2,5.2); ctx.stroke(); }
  }
  const activeCount = moduleId === '3.1' || moduleId === '7.1' ? step + 1 : Math.max(1, Math.round(value * nodes.length));
  ctx.strokeStyle = moduleId === '1.1' && value > 0.65 ? '#c43f52' : '#228d5c';
  ctx.lineWidth = 4;
  ctx.beginPath(); nodes.forEach(([x,y],i)=> { if (i === 0) ctx.moveTo(x,y); else if (i < activeCount) ctx.lineTo(x,y); }); ctx.stroke();
  nodes.forEach(([x,y],i)=> {
    const on = i < activeCount;
    ctx.fillStyle = on ? (i === step ? '#d97706' : '#27446e') : '#fff';
    ctx.strokeStyle = on ? '#27446e' : '#d7deea';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x,y,13,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = on ? '#fff' : '#68778f'; ctx.font = '12px Segoe UI, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(i+1), x, y+4);
  });
  if (moduleId === '10.1') {
    const racers = [['单提示', 0.34, '#c43f52'], ['链式', 0.55, '#d97706'], ['PGE', 0.96, '#228d5c']];
    racers.forEach(([name, score, color], i) => {
      const y = 52 + i * 36; const x = 150 + Number(score) * value * 300;
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(150, y); ctx.lineTo(460, y); ctx.stroke();
      ctx.fillStyle = String(color); ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#21324a'; ctx.textAlign = 'right'; ctx.fillText(String(name), 134, y+4);
    });
  }
  if (moduleId === '8.1' || moduleId === '9.1' || moduleId === '2.1') {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 1.5; ctx.fillRect(336, 28, 182, 62); ctx.strokeRect(336,28,182,62);
    ctx.fillStyle = '#21324a'; ctx.textAlign = 'left'; ctx.font = '14px Segoe UI, sans-serif'; ctx.fillText(option, 350, 54);
    ctx.fillStyle = '#68778f'; ctx.font = '12px Segoe UI, sans-serif'; ctx.fillText('查看四条件边界', 350, 76);
  }
  if (moduleId === '6.1') {
    const p = Math.min(1, value);
    ctx.fillStyle = p > 0.5 ? '#228d5c' : '#c43f52';
    ctx.fillRect(70, 38, 360 * p, 16);
    ctx.fillStyle = '#21324a'; ctx.textAlign = 'left'; ctx.fillText(p > 0.5 ? '版本化图对象' : '运行痕迹', 70, 30);
  }
  ctx.fillStyle = '#21324a'; ctx.textAlign = 'left'; ctx.font = '14px Segoe UI, sans-serif';
  ctx.fillText(moduleId + ' · ' + option, 24, 24);
}

export const PromptGraphLab: React.FC<WidgetProps> = ({ moduleId }) => {
  const cfg = configs[moduleId] || configs['1.1'];
  const ref = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState(cfg.kind === 'race' ? 0 : 0.45);
  const [option, setOption] = useState((cfg.options && cfg.options[0]) || cfg.label);
  const [step, setStep] = useState(0);
  const stateRef = useRef({ value, option, step });
  stateRef.current = { value, option, step };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    let raf = 0;
    const tick = (t: number) => {
      draw(ctx, moduleId, stateRef.current.value, stateRef.current.option, stateRef.current.step, t);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [moduleId]);

  const [cls, text] = feedback(moduleId, value, option, step);
  const startRace = () => setValue(1);

  return (
    <div className="pg-widget">
      <canvas ref={ref} width={W} height={H} />
      {cfg.kind === 'slider' ? (
        <div className="ctrl pg-ctrl">
          <label>{cfg.label} <span className="val">{value.toFixed(2)}</span></label>
          <input type="range" min={0} max={100} value={Math.round(value * 100)} onChange={(e) => setValue(Number(e.target.value) / 100)} />
        </div>
      ) : null}
      {cfg.kind === 'chips' || cfg.kind === 'hotspot' ? (
        <div className="pg-chip-row">
          {(cfg.options || []).map((o) => <button key={o} className={'chip ' + (o === option ? 'is-active' : '')} onClick={() => { setOption(o); setValue(0.8); }}>{o}</button>)}
        </div>
      ) : null}
      {cfg.kind === 'step' ? (
        <div className="pg-chip-row">
          <button className="chip" onClick={() => setStep(0)}>重置</button>
          <button className="chip is-active" onClick={() => setStep((s) => clamp(s + 1, 0, (cfg.steps || []).length - 1))}>下一步</button>
          <span className="pg-value">{(cfg.steps || [])[step]}</span>
        </div>
      ) : null}
      {cfg.kind === 'compare' ? (
        <div className="pg-chip-row">
          <button className="chip" onClick={() => setValue(0.2)}>只有日志</button>
          <button className="chip is-active" onClick={() => setValue(0.85)}>一等图对象</button>
        </div>
      ) : null}
      {cfg.kind === 'race' ? (
        <div className="pg-chip-row">
          <button className="chip is-active" onClick={startRace}>开始比较</button>
          <button className="chip" onClick={() => setValue(0)}>归零</button>
        </div>
      ) : null}
      <div className={`feedback ${cls}`}>{text}</div>
    </div>
  );
};
