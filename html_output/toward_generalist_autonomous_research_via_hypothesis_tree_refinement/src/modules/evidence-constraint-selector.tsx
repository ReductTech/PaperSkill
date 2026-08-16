import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 700;
const H = 440;

type StageKey = 'verification' | 'coverage' | 'sharing';
type TraceNode = {
  id: string;
  name: string;
  dev: number;
  status: 'merged' | 'pruned';
  effect: 'drives shift' | 'informative' | 'uninformative';
};

const STAGES: Record<
  StageKey,
  {
    label: string;
    framing: string;
    attempted: string;
    finding: string;
    constraint: string;
    nodes: TraceNode[];
  }
> = {
  verification: {
    label: '1. 验证问题',
    framing: '近似答案抓住显眼线索，却漏掉细粒度约束。',
    attempted: '逐约束验证与 hostile contradiction checking。',
    finding: '细粒度检查确实有用，但验证器无法找回从未被检索到的候选。',
    constraint: '保留细粒度验证，同时把下一轮重点转向候选覆盖。',
    nodes: [
      { id: 'N1.1', name: 'Constraint verifier', dev: 60, status: 'pruned', effect: 'informative' },
      { id: 'N2.1', name: 'Hostile verifier', dev: 60, status: 'pruned', effect: 'informative' },
    ],
  },
  coverage: {
    label: '2. 候选问题',
    framing: '验证器不能修复搜索过程从未提出的答案。',
    attempted: 'K=5 条独立 ReAct 轨迹，加 evidence dossier 聚合。',
    finding: '正确答案会出现在少数轨迹中；多数投票会丢掉它，证据档案可以找回。',
    constraint: '扩大覆盖，并保留每个候选对应的支持证据。',
    nodes: [
      { id: 'N3.1', name: 'Dossier aggregator', dev: 65, status: 'merged', effect: 'drives shift' },
    ],
  },
  sharing: {
    label: '3. 证据共享',
    framing: '多样 persona 并不等于新的检索前沿，错误仍会在轨迹间重复。',
    attempted: '比较 persona、judge 侧搜索、共享分解与两轮证据共享。',
    finding: '共享分解会降低轨迹独立性，judge 侧搜索会过拟合开发问题；两轮流程先独立搜索，再读取既有答案与证据档案。',
    constraint: '第一轮独立搜索，第二轮再读取前序答案与证据档案。',
    nodes: [
      { id: 'N5.1', name: 'Persona rollouts', dev: 70, status: 'pruned', effect: 'informative' },
      { id: 'N7.1', name: 'Decompose-execute', dev: 60, status: 'pruned', effect: 'uninformative' },
      { id: 'N6.2', name: 'Search-augmented judge', dev: 75, status: 'pruned', effect: 'informative' },
      { id: 'N8.1', name: 'Two-round sharing', dev: 72.5, status: 'merged', effect: 'drives shift' },
    ],
  },
};

const STAGE_KEYS = Object.keys(STAGES) as StageKey[];

function drawWrappedLabel(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number
) {
  const words = value.split(/[ -]/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || current.length === 0) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  lines.slice(0, 2).forEach((line, index) => ctx.fillText(line, x, y + index * 13));
}

export const EvidenceConstraintSelector: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<StageKey>('verification');
  const current = STAGES[stage];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.maxWidth = '100%';
    canvas.style.height = 'auto';
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);

    STAGE_KEYS.forEach((key, index) => {
      const x = 30 + index * 222;
      const active = key === stage;
      ctx.fillStyle = active ? '#27446e' : '#ffffff';
      ctx.strokeStyle = active ? '#27446e' : '#b8c9a7';
      ctx.lineWidth = active ? 4 : 2;
      ctx.fillRect(x, 24, 190, 42);
      ctx.strokeRect(x, 24, 190, 42);
      ctx.fillStyle = active ? '#ffffff' : '#21324a';
      ctx.font = `${active ? 700 : 600} 13px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(STAGES[key].label, x + 95, 50);
      if (index < STAGE_KEYS.length - 1) {
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 194, 45);
        ctx.lineTo(x + 216, 45);
        ctx.stroke();
      }
    });

    ctx.fillStyle = '#21324a';
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Figure 6 实验节点 · 按论文顺序连接', 30, 98);

    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#228d5c';
    ctx.beginPath();
    ctx.arc(528, 94, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#52657a';
    ctx.fillText('合并', 538, 98);
    ctx.fillStyle = '#c43f52';
    ctx.beginPath();
    ctx.arc(592, 94, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#52657a';
    ctx.fillText('剪枝', 602, 98);

    const plotLeft = 72;
    const plotRight = 654;
    const plotTop = 120;
    const plotBottom = 246;
    const minDev = 50;
    const maxDev = 80;
    const mapY = (value: number) =>
      plotBottom - ((value - minDev) / (maxDev - minDev)) * (plotBottom - plotTop);

    [50, 60, 70, 80].forEach((tick) => {
      const y = mapY(tick);
      ctx.strokeStyle = tick === 50 ? '#b9c6d3' : '#dde5ec';
      ctx.lineWidth = tick === 50 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, y);
      ctx.lineTo(plotRight, y);
      ctx.stroke();
      ctx.fillStyle = '#718196';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${tick}%`, plotLeft - 8, y + 3);
    });

    const xFor = (index: number) =>
      current.nodes.length === 1
        ? (plotLeft + plotRight) / 2
        : plotLeft + (index / (current.nodes.length - 1)) * (plotRight - plotLeft);

    if (current.nodes.length > 1) {
      ctx.strokeStyle = '#315886';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      current.nodes.forEach((node, index) => {
        const x = xFor(index);
        const y = mapY(node.dev);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    const effectLabel: Record<TraceNode['effect'], string> = {
      'drives shift': '推动方向转变',
      informative: '提供有效证据',
      uninformative: '信息增益不足',
    };

    current.nodes.forEach((node, index) => {
      const x = xFor(index);
      const y = mapY(node.dev);
      const statusColor = node.status === 'merged' ? '#228d5c' : '#c43f52';

      ctx.strokeStyle = '#cbd6e1';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, y + 7);
      ctx.lineTo(x, plotBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = statusColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#21324a';
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${node.dev.toFixed(1)}%`, x, y - 15);
      ctx.fillText(node.id, x, 268);

      ctx.fillStyle = '#52657a';
      ctx.font = '10.5px "Segoe UI", sans-serif';
      drawWrappedLabel(ctx, node.name, x, 285, 126);

      ctx.fillStyle = statusColor;
      ctx.font = '700 10px "Segoe UI", sans-serif';
      ctx.fillText(
        `${node.status === 'merged' ? '合并' : '剪枝'} · ${effectLabel[node.effect]}`,
        x,
        318
      );
    });

    const noteY = 344;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.fillRect(30, noteY, 640, 76);
    ctx.strokeRect(30, noteY, 640, 76);
    ctx.fillStyle = '#92400e';
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('写入下一轮的约束', 48, noteY + 24);
    ctx.fillStyle = '#21324a';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(current.constraint, 48, noteY + 52);
    canvas.classList.add('is-ready');
  }, [current, stage]);

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <canvas
          id={`cv-${chapterId}-${moduleId}`}
          ref={canvasRef}
          className="paper-wide-canvas"
          width={W}
          height={H}
          role="img"
          aria-label={`${current.label}：${current.finding}`}
        />
      </div>
      <div className="ctrl" role="group" aria-label="切换 BrowseComp 假设精炼阶段">
        {STAGE_KEYS.map((key) => (
          <button key={key} type="button" aria-pressed={stage === key} onClick={() => setStage(key)}>
            {STAGES[key].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${stage === 'coverage' ? 'good' : ''}`} aria-live="polite">
        <strong>当前问题：</strong>{current.framing}<br />
        <strong>尝试：</strong>{current.attempted}<br />
        <strong>发现：</strong>{current.finding}
      </div>
      <p style={{ color: '#21324a', marginBottom: 0 }}>节点、开发准确率和 merged/pruned 状态均来自论文 Figure 6；折线只连接从 Earlier 到 Later 的离散实验节点，不代表连续训练曲线。</p>
    </div>
  );
};

export default EvidenceConstraintSelector;
