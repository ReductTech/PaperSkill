import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearStudio,
  drawConsole,
  drawLegend,
  drawMeter,
  drawPatchCable,
  drawStudioLabel,
  drawTargetBand,
} from './studio-kit';

const W = 560;
const H = 260;
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const MUTED = '#d7deea';

type RouterNode = 'admission' | 'demand' | 'risk' | 'match' | 'stateEncoder' | 'supplyEncoder' | 'predictionHead';
type Generation = 'g0' | 'learned';
type Deployment = 'twoTier' | 'allHeavy';
type ArchitectureState = {
  activeNode: RouterNode;
  generation: Generation;
  deployment: Deployment;
  pathProgress: number;
};

type NodeInfo = { id: RouterNode; label: string; x: number; y: number; w: number; h: number };

const G0_NODES: NodeInfo[] = [
  { id: 'admission', label: '准入筛选', x: 116, y: 56, w: 158, h: 30 },
  { id: 'demand', label: '需求构造', x: 116, y: 94, w: 158, h: 30 },
  { id: 'risk', label: '风险定价', x: 116, y: 132, w: 158, h: 30 },
  { id: 'match', label: '能力匹配 · LightGBM', x: 116, y: 170, w: 158, h: 30 },
];

const LEARNED_NODES: NodeInfo[] = [
  { id: 'stateEncoder', label: '状态编码器', x: 304, y: 64, w: 142, h: 36 },
  { id: 'supplyEncoder', label: '供应编码器', x: 304, y: 116, w: 142, h: 36 },
  { id: 'predictionHead', label: '损失—成本预测头', x: 304, y: 168, w: 142, h: 36 },
];

const INITIAL: ArchitectureState = {
  activeNode: 'admission',
  generation: 'g0',
  deployment: 'twoTier',
  pathProgress: 1,
};

const NODE_COPY: Record<RouterNode, { value: string; output: string; path: string }> = {
  admission: {
    value: '便宜确定性筛选',
    output: '显然简单/显然困难由门控处理；当前教学状态继续。',
    path: '执行状态 hₜ → 准入筛选',
  },
  demand: {
    value: '构造能力需求 κ̂ₜ',
    output: '教学类别：需要长上下文、工具可靠性与可验证输出。',
    path: 'hₜ → 准入筛选 → 需求构造',
  },
  risk: {
    value: '轨迹损失 + 后续恢复成本',
    output: '教学类别：高价值、弱可恢复，继续精细匹配。',
    path: 'hₜ → 准入 → 需求 → 风险定价',
  },
  match: {
    value: 'LightGBM 冷启动能力匹配',
    output: '生成路由动作 uₜ=(Sₜ,aₜ)，并开始记录 Arena 数据。',
    path: 'hₜ → 四个轻量步骤 → 路由动作 uₜ',
  },
  stateEncoder: {
    value: '任务、上下文、工具、验证、恢复 → 状态向量',
    output: '状态表征送入预测头；这是后续代次设计。',
    path: '完整执行状态 hₜ → 状态编码器 → 预测头',
  },
  supplyEncoder: {
    value: '价格、延迟、上下文、工具可靠性 → 供应画像',
    output: '新模型可先按画像评分，不扩充固定类别标签。',
    path: '候选池 Mₜ → 供应编码器 → 预测头',
  },
  predictionHead: {
    value: '预期任务损失 ℓ̂ 与预期成本 Ĉ',
    output: '按质量—成本规则选动作；晋级仍需实测前沿改善。',
    path: 'hₜ + Mₜ → 双编码 → 预测头 → 候选动作',
  },
};

export const Ch8RouterArchitecture: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ArchitectureState>(INITIAL);
  const [state, setState] = useState<ArchitectureState>(INITIAL);

  const commit = (next: ArchitectureState) => {
    stateRef.current = next;
    setState(next);
  };

  const selectG0 = (node: RouterNode) => commit({ ...stateRef.current, generation: 'g0', activeNode: node, pathProgress: 0 });
  const upgrade = () => commit({ ...stateRef.current, generation: 'learned', activeNode: 'stateEncoder', pathProgress: 0 });
  const selectLearned = (node: RouterNode) => {
    if (stateRef.current.generation !== 'learned') return;
    commit({ ...stateRef.current, activeNode: node, pathProgress: 0 });
  };
  const setDeployment = (deployment: Deployment) => commit({ ...stateRef.current, deployment, pathProgress: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    canvas.style.width = 'min(100%, 560px)';
    canvas.style.height = 'auto';
    let raf: number | null = null;
    let last = performance.now();

    const nodeCenter = (node: NodeInfo) => ({ x: node.x + node.w / 2, y: node.y + node.h / 2 });
    const drawNode = (node: NodeInfo, active: boolean, enabled: boolean) => {
      ctx.fillStyle = enabled ? '#fff' : '#f1f4f7';
      ctx.fillRect(node.x, node.y, node.w, node.h);
      ctx.strokeStyle = active ? ORANGE : enabled ? BLUE : MUTED;
      ctx.lineWidth = active ? 4 : 2;
      ctx.strokeRect(node.x, node.y, node.w, node.h);
      ctx.fillStyle = enabled ? '#21324a' : '#8c98aa';
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x + node.w / 2, node.y + node.h / 2 + 4);
      ctx.textAlign = 'left';
    };

    const drawLearnedBypass = (color: string) => {
      const from = { x: 446, y: 82 };
      const to = { x: 446, y: 186 };
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.bezierCurveTo(458, from.y, 458, to.y, to.x, to.y);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      [from, to].forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.restore();
    };

    const render = (s: ArchitectureState) => {
      clearStudio(ctx, W, H);
      drawConsole(ctx, 8, 32, 544, 190);
      drawStudioLabel(ctx, '输入 hₜ', 16, 22, 'left');
      drawStudioLabel(ctx, 'g⁽⁰⁾ 冷启动', 116, 45, 'left');
      drawStudioLabel(ctx, '学习型升级', 304, 45, 'left');
      drawLegend(ctx, [{ label: '活动路径', color: BLUE }, { label: '当前节点', color: ORANGE }], 350, 20);

      const outColor = s.deployment === 'allHeavy' ? RED : (s.activeNode === 'match' || s.activeNode === 'predictionHead') ? GREEN : BLUE;

      // Route layer: every cable is laid behind the input, nodes and output console.
      G0_NODES.slice(0, -1).forEach((node, index) => {
        drawPatchCable(ctx, { x: node.x + node.w / 2, y: node.y + node.h }, { x: G0_NODES[index + 1].x + G0_NODES[index + 1].w / 2, y: G0_NODES[index + 1].y }, MUTED);
      });
      drawPatchCable(ctx, { x: 98, y: 106 }, { x: 116, y: 71 }, MUTED);
      drawPatchCable(ctx, { x: 274, y: 185 }, { x: 466, y: 132 }, MUTED);
      drawPatchCable(ctx, { x: 98, y: 106 }, { x: 304, y: 82 }, MUTED);
      drawPatchCable(ctx, { x: 98, y: 158 }, { x: 304, y: 134 }, PURPLE);
      drawLearnedBypass(MUTED);
      drawPatchCable(ctx, { x: 375, y: 152 }, { x: 375, y: 168 }, MUTED);
      drawPatchCable(ctx, { x: 446, y: 186 }, { x: 466, y: 132 }, MUTED);

      if (s.generation === 'g0') {
        const activeIndex = G0_NODES.findIndex((node) => node.id === s.activeNode);
        drawPatchCable(ctx, { x: 98, y: 106 }, { x: 116, y: 71 }, BLUE);
        for (let index = 0; index < activeIndex; index += 1) {
          const from = G0_NODES[index];
          const to = G0_NODES[index + 1];
          drawPatchCable(ctx, { x: from.x + from.w / 2, y: from.y + from.h }, { x: to.x + to.w / 2, y: to.y }, BLUE);
        }
        if (s.activeNode === 'match') drawPatchCable(ctx, { x: 274, y: 185 }, { x: 466, y: 132 }, outColor);
      } else {
        const active = LEARNED_NODES.find((node) => node.id === s.activeNode) ?? LEARNED_NODES[0];
        if (s.activeNode === 'supplyEncoder') {
          drawPatchCable(ctx, { x: 98, y: 158 }, { x: active.x, y: active.y + active.h / 2 }, PURPLE);
        } else {
          drawPatchCable(ctx, { x: 98, y: 106 }, { x: LEARNED_NODES[0].x, y: LEARNED_NODES[0].y + 18 }, BLUE);
        }
        if (s.activeNode === 'predictionHead') {
          drawLearnedBypass(BLUE);
          drawPatchCable(ctx, { x: 375, y: 152 }, { x: 375, y: 168 }, PURPLE);
          drawPatchCable(ctx, { x: 446, y: 186 }, { x: 466, y: 132 }, outColor);
        }
      }

      const activeInfo = [...G0_NODES, ...LEARNED_NODES].find((node) => node.id === s.activeNode) ?? G0_NODES[0];
      const center = nodeCenter(activeInfo);
      const plugStart = s.generation === 'learned' && s.activeNode === 'supplyEncoder'
        ? { x: 100, y: 158 }
        : { x: 100, y: 106 };
      const plugTarget = (s.generation === 'g0' && s.activeNode !== 'admission') || s.activeNode === 'predictionHead'
        ? { x: center.x, y: activeInfo.y }
        : { x: activeInfo.x, y: center.y };
      const plugX = plugStart.x + (plugTarget.x - plugStart.x) * s.pathProgress;
      const plugY = plugStart.y + (plugTarget.y - plugStart.y) * s.pathProgress;
      ctx.fillStyle = ORANGE;
      ctx.fillRect(plugX - 7, plugY - 5, 14, 10);

      // Foreground equipment hides cable interiors and keeps labels unobstructed.
      ctx.fillStyle = '#fff';
      ctx.fillRect(16, 64, 82, 136);
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(16, 64, 82, 136);
      ['上下文', '工具', '验证', '恢复'].forEach((label, index) => {
        ctx.fillStyle = BLUE;
        ctx.font = '600 12px "Segoe UI", sans-serif';
        ctx.fillText(label, 29, 91 + index * 26);
      });

      G0_NODES.forEach((node) => drawNode(node, s.generation === 'g0' && s.activeNode === node.id, true));
      LEARNED_NODES.forEach((node) => drawNode(node, s.generation === 'learned' && s.activeNode === node.id, s.generation === 'learned'));

      ctx.fillStyle = '#fff';
      ctx.fillRect(466, 64, 78, 136);
      ctx.strokeStyle = outColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(466, 64, 78, 136);
      drawMeter(ctx, 487, 86, s.deployment === 'allHeavy' ? 0.92 : 0.4, outColor, 82);
      ctx.fillStyle = outColor;
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.deployment === 'allHeavy' ? '每步重型' : '两级门控', 505, 187);
      ctx.textAlign = 'left';

      if (s.deployment === 'twoTier' && (s.activeNode === 'match' || s.activeNode === 'predictionHead')) drawTargetBand(ctx, 472, 202, 66, 16);
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('教学类别：不确定 · 高价值 · 弱可恢复', 16, 244);
    };

    const tick = (now: number) => {
      const current = stateRef.current;
      if (current.pathProgress < 1) {
        const next = { ...current, pathProgress: clamp(current.pathProgress + (now - last) / 650, 0, 1) };
        stateRef.current = next;
        setState(next);
      }
      last = now;
      render(stateRef.current);
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      last = performance.now();
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * W / rect.width;
    const y = (event.clientY - rect.top) * H / rect.height;
    const g0 = G0_NODES.find((node) => x >= node.x && x <= node.x + node.w && y >= node.y && y <= node.y + node.h);
    if (g0) {
      selectG0(g0.id);
      return;
    }
    if (x >= 294 && x <= 454 && y >= 30 && y <= 57) {
      upgrade();
      return;
    }
    if (stateRef.current.generation === 'learned') {
      const learned = LEARNED_NODES.find((node) => x >= node.x && x <= node.x + node.w && y >= node.y && y <= node.y + node.h);
      if (learned) selectLearned(learned.id);
    }
  };

  const copy = NODE_COPY[state.activeNode];
  const isGood = state.deployment === 'twoTier' && (state.activeNode === 'match' || state.activeNode === 'predictionHead');
  const feedback = state.deployment === 'allHeavy'
    ? { cls: 'bad', text: '把所有状态都送进重型路由器，会让路由本身失去成本优势。' }
    : isGood
      ? { cls: 'good', text: '便宜门控处理显然状态，学习型路由器只在不确定、高价值或弱可恢复步骤介入。' }
      : { cls: '', text: '当前节点把 Harness 信号压成可比较的能力需求或供应画像。' };

  return (
    <div onKeyDown={(event) => { if (event.key === 'Escape') commit(INITIAL); }}>
      <div className="chip-row" role="group" aria-label="路由器代次">
        <button type="button" className={`chip ${state.generation === 'g0' ? 'selected' : ''}`} aria-pressed={state.generation === 'g0'} onClick={() => selectG0('admission')}>g⁽⁰⁾ 冷启动</button>
        <button type="button" className={`chip ${state.generation === 'learned' ? 'selected' : ''}`} aria-pressed={state.generation === 'learned'} onClick={upgrade}>学习型升级</button>
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        aria-label="可点击路由架构图；活动路径、当前值和输出随节点共同更新"
      />
      <div className="chip-row" role="group" aria-label="冷启动四步">
        {G0_NODES.map((node) => (
          <button key={node.id} type="button" className={`chip ${state.generation === 'g0' && state.activeNode === node.id ? 'selected' : ''}`} aria-pressed={state.generation === 'g0' && state.activeNode === node.id} onClick={() => selectG0(node.id)}>{node.label}</button>
        ))}
      </div>
      <div className="chip-row" role="group" aria-label="学习型三组件">
        {LEARNED_NODES.map((node) => (
          <button key={node.id} type="button" className={`chip ${state.generation === 'learned' && state.activeNode === node.id ? 'selected' : ''}`} aria-pressed={state.generation === 'learned' && state.activeNode === node.id} disabled={state.generation !== 'learned'} title={state.generation !== 'learned' ? '先选择学习型升级' : undefined} onClick={() => selectLearned(node.id)}>{node.label}</button>
        ))}
      </div>
      <div className="metrics">
        <div className="metric"><div className="l">活动路径</div><div style={{ fontSize: 14 }}>{copy.path}</div></div>
        <div className="metric"><div className="l">当前值</div><div style={{ fontSize: 14, color: ORANGE }}>{copy.value}</div></div>
        <div className="metric"><div className="l">输出 / 状态</div><div style={{ fontSize: 14 }}>{state.deployment === 'allHeavy' ? '重型路由器覆盖所有步骤：开销可能吞掉分配收益。' : copy.output}</div></div>
      </div>
      <div className="chip-row" role="group" aria-label="部署门控诊断">
        <button type="button" className={`chip ${state.deployment === 'twoTier' ? 'selected' : ''}`} aria-pressed={state.deployment === 'twoTier'} onClick={() => setDeployment('twoTier')}>两级门控</button>
        <button type="button" className={`chip ${state.deployment === 'allHeavy' ? 'selected' : ''}`} aria-pressed={state.deployment === 'allHeavy'} onClick={() => setDeployment('allHeavy')}>每步重型（诊断反例）</button>
      </div>
      <div className={`feedback ${feedback.cls}`} aria-live="polite">{feedback.text}</div>
      <div className="hotspot-info">
        <b>边界：</b>LightGBM 是开放冷启动种子；状态编码器、供应编码器与预测头是后续代次设计，不是每一代都已完成基准验证。候选代次只有在同等奖励下降低实付成本或固定预算下提高奖励时才晋级，否则回滚。
      </div>
      <figure className="paper-figure">
        <img src="/images/agentic-routing-overview.png" alt="论文 Figure 1：Harness 状态进入单模型或多模型路由，执行结果回流为 Arena 数据的总体结构" />
        <figcaption>Figure 1 只帮助核对全局数据流；上方可点击架构才负责展示节点输入、当前值、输出与部署反馈。</figcaption>
      </figure>
      <div className="hotspot-info"><b>适用性判断：</b>候选能力异质、供应画像可更新且路由开销低于分配节省时，学习型升级才有价值；候选近乎同质或路由延迟吞掉收益时，应停留在便宜门控或回滚。</div>
    </div>
  );
};
