import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from './registry';

type ModelId = 'brainomni' | 'cbramod' | 'biot';

interface ModelSpec {
  id: ModelId;
  name: string;
  index: number;
  color: string;
  soft: string;
  cells: number;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DiagramLayout {
  width: number;
  height: number;
  source: Box;
  head: Box;
  output: Box;
  inputPath: string;
  outputPath: string;
  inputLabel: { x: number; y: number; anchor: 'start' | 'middle' | 'end' };
  outputLabel: { x: number; y: number; anchor: 'start' | 'middle' | 'end' };
}

const MODELS: ModelSpec[] = [
  { id: 'brainomni', name: 'BrainOmni', index: 1, color: '#2876a3', soft: '#eaf4f9', cells: 8 },
  { id: 'cbramod', name: 'CBraMod', index: 2, color: '#278879', soft: '#e9f5f2', cells: 5 },
  { id: 'biot', name: 'BIOT', index: 3, color: '#c98624', soft: '#fbf2e2', cells: 4 },
];

const DESKTOP_LAYOUT: DiagramLayout = {
  width: 900,
  height: 330,
  source: { x: 46, y: 100, width: 250, height: 126 },
  head: { x: 374, y: 72, width: 230, height: 182 },
  output: { x: 720, y: 100, width: 136, height: 126 },
  inputPath: 'M296 163 C328 132 346 132 374 163',
  outputPath: 'M604 163 C644 194 681 194 720 163',
  inputLabel: { x: 335, y: 121, anchor: 'middle' },
  outputLabel: { x: 662, y: 211, anchor: 'middle' },
};

const COMPACT_LAYOUT: DiagramLayout = {
  width: 420,
  height: 560,
  source: { x: 42, y: 50, width: 336, height: 112 },
  head: { x: 90, y: 225, width: 240, height: 174 },
  output: { x: 105, y: 445, width: 210, height: 100 },
  inputPath: 'M210 162 C180 184 180 204 210 225',
  outputPath: 'M210 399 C240 418 240 432 210 445',
  inputLabel: { x: 228, y: 195, anchor: 'start' },
  outputLabel: { x: 228, y: 438, anchor: 'start' },
};

function selectedModel(id: ModelId): ModelSpec {
  return MODELS.find((model) => model.id === id) ?? MODELS[0];
}

function vectorCells(model: ModelSpec, box: Box) {
  const gap = 5;
  const cellWidth = 15;
  const totalWidth = model.cells * cellWidth + (model.cells - 1) * gap;
  const startX = box.x + (box.width - totalWidth) / 2;
  const y = box.y + box.height - 38;

  return Array.from({ length: model.cells }, (_, index) => (
    <g key={`z-${index}`} className="orr-z-cell" style={{ '--cell-index': index } as React.CSSProperties}>
      <rect x={startX + index * (cellWidth + gap)} y={y} width={cellWidth} height="22" rx="2" />
      <line
        x1={startX + index * (cellWidth + gap) + 3}
        y1={y + 8 + (index % 3) * 2}
        x2={startX + index * (cellWidth + gap) + cellWidth - 3}
        y2={y + 14 - (index % 2) * 3}
      />
    </g>
  ));
}

function matrixCells(model: ModelSpec, box: Box) {
  const rows = 3;
  const gap = 4;
  const cellWidth = 13;
  const cellHeight = 14;
  const totalWidth = model.cells * cellWidth + (model.cells - 1) * gap;
  const totalHeight = rows * cellHeight + (rows - 1) * gap;
  const startX = box.x + (box.width - totalWidth) / 2;
  const startY = box.y + 79;

  return Array.from({ length: rows }, (_, row) => (
    <g key={`row-${row}`}>
      {Array.from({ length: model.cells }, (_, column) => (
        <rect
          key={`w-${row}-${column}`}
          className="orr-matrix-cell"
          x={startX + column * (cellWidth + gap)}
          y={startY + row * (cellHeight + gap)}
          width={cellWidth}
          height={cellHeight}
          rx="2"
          style={{ '--matrix-index': row * model.cells + column } as React.CSSProperties}
        />
      ))}
    </g>
  ));
}

function outputCells(box: Box) {
  const labels = ['A', 'B', 'C'];
  const size = 27;
  const gap = 8;
  const totalWidth = labels.length * size + (labels.length - 1) * gap;
  const startX = box.x + (box.width - totalWidth) / 2;
  const y = box.y + box.height - 42;

  return labels.map((label, index) => (
    <g key={label} className="orr-output-cell" style={{ '--output-index': index } as React.CSSProperties}>
      <rect x={startX + index * (size + gap)} y={y} width={size} height={size} rx="3" />
      <text x={startX + index * (size + gap) + size / 2} y={y + 18} textAnchor="middle">{label}</text>
    </g>
  ));
}

function ReadoutDiagram({ model, compact, run }: { model: ModelSpec; compact: boolean; run: number }) {
  const layout = compact ? COMPACT_LAYOUT : DESKTOP_LAYOUT;
  const source = layout.source;
  const head = layout.head;
  const output = layout.output;

  return (
    <svg
      className="orr-diagram"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-label={`${model.name} 输出 z${model.index}[d${model.index}]，匹配任务头矩阵 K 乘 d${model.index}，再映射为固定 K 维任务输出`}
      key={`${model.id}-${compact}-${run}`}
    >
      <defs>
        <pattern id="orr-grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0V22" className="orr-grid-line" />
        </pattern>
        <marker id="orr-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0 0L7 3.5L0 7Z" fill={model.color} />
        </marker>
      </defs>

      <rect width={layout.width} height={layout.height} className="orr-field" />
      <rect width={layout.width} height={layout.height} fill="url(#orr-grid)" />

      <text x={source.x} y={source.y - 18} className="orr-column-kicker">MODEL OUTPUT</text>
      <text x={head.x} y={head.y - 18} className="orr-column-kicker">MODEL × TASK HEAD</text>
      <text x={output.x} y={output.y - 18} className="orr-column-kicker">SHARED TASK OUTPUT</text>

      <rect x={source.x} y={source.y} width={source.width} height={source.height} rx="5" className="orr-node-frame source" />
      <rect x={source.x} y={source.y} width="4" height={source.height} rx="2" fill={model.color} />
      <text x={source.x + 18} y={source.y + 28} className="orr-node-title">z{model.index}[d{model.index}]</text>
      <text x={source.x + 18} y={source.y + 48} className="orr-node-note">{model.name} 的冻结表征</text>
      <text x={source.x + source.width - 18} y={source.y + 28} textAnchor="end" className="orr-dimension-note">宽度 d{model.index}</text>
      <g style={{ color: model.color }}>{vectorCells(model, source)}</g>

      <rect x={head.x} y={head.y} width={head.width} height={head.height} rx="5" className="orr-node-frame head" />
      <text x={head.x + 18} y={head.y + 29} className="orr-node-title">g{model.index},t</text>
      <text x={head.x + 18} y={head.y + 50} className="orr-node-note">任务 t 的轻量读出头</text>
      <text x={head.x + head.width - 18} y={head.y + 29} textAnchor="end" className="orr-matrix-shape">W{model.index},t : K × d{model.index}</text>
      <g style={{ color: model.color }}>{matrixCells(model, head)}</g>
      <text x={head.x + head.width / 2} y={head.y + head.height - 17} textAnchor="middle" className="orr-matrix-caption">列数跟随 d{model.index} · 行数固定为 K</text>

      <rect x={output.x} y={output.y} width={output.width} height={output.height} rx="5" className="orr-node-frame output" />
      <text x={output.x + output.width / 2} y={output.y + 29} textAnchor="middle" className="orr-node-title">ŷ{model.index},t[K]</text>
      <text x={output.x + output.width / 2} y={output.y + 48} textAnchor="middle" className="orr-node-note">同一标签集合</text>
      {outputCells(output)}

      <path d={layout.inputPath} className="orr-route-base" markerEnd="url(#orr-arrow)" />
      <path d={layout.outputPath} className="orr-route-base" markerEnd="url(#orr-arrow)" />
      <path d={layout.inputPath} pathLength="100" className="orr-route-signal input" style={{ stroke: model.color }} />
      <path d={layout.outputPath} pathLength="100" className="orr-route-signal output" style={{ stroke: model.color }} />
      <text x={layout.inputLabel.x} y={layout.inputLabel.y} textAnchor={layout.inputLabel.anchor} className="orr-route-label">输入 d{model.index} 个特征</text>
      <text x={layout.outputLabel.x} y={layout.outputLabel.y} textAnchor={layout.outputLabel.anchor} className="orr-route-label">输出固定 K 个分数</text>
    </svg>
  );
}

export const OmniOutputReadout: React.FC<WidgetProps> = () => {
  const [modelId, setModelId] = useState<ModelId>('brainomni');
  const [run, setRun] = useState(0);
  const [compact, setCompact] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const model = useMemo(() => selectedModel(modelId), [modelId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const update = () => setCompact(host.clientWidth < 600);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const chooseModel = (next: ModelId) => {
    setModelId(next);
    setRun((value) => value + 1);
  };

  return (
    <section className="orr-lab" aria-label="选择模型，观察不同宽度表征如何通过匹配任务头进入同一标签空间">
      <div className="orr-toolbar">
        <div className="orr-toolbar-copy">
          <span>SELECT A BACKBONE OUTPUT</span>
          <b>选择一种 zᵢ，观察任务头哪一维随之改变</b>
        </div>
        <div className="orr-model-switch" role="group" aria-label="选择模型表征">
          {MODELS.map((item) => (
            <button
              type="button"
              className={item.id === modelId ? 'selected' : ''}
              aria-pressed={item.id === modelId}
              onClick={() => chooseModel(item.id)}
              key={item.id}
            >
              <i style={{ background: item.color }} />
              <span>{item.name}</span>
              <code>d{item.index}</code>
            </button>
          ))}
        </div>
        <button className="orr-replay" type="button" title="重播接口动画" aria-label="重播接口动画" onClick={() => setRun((value) => value + 1)}>↻</button>
      </div>

      <div className="orr-diagram-wrap" ref={hostRef}>
        <ReadoutDiagram model={model} compact={compact} run={run} />
      </div>

      <div className="orr-invariant" aria-live="polite">
        <div><span>随模型改变</span><b>z{model.index} 的宽度 d{model.index}</b><b>W{model.index},t 的列数 d{model.index}</b></div>
        <i aria-hidden="true" />
        <div><span>由任务固定</span><b>矩阵行数 K</b><b>输出标签空间 K</b></div>
      </div>
      <p className="orr-source">任务头参数按“模型 i × 任务 t”分别训练。图中的格数只表示 dᵢ 可以不同，不对应论文报告的实际表征维度；线性探测时骨干 fθᵢ 保持冻结。</p>
    </section>
  );
};
