import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { clamp, usePanelWidth } from './omni-interaction-kit';

type ModelId = 'brainomni' | 'cbramod' | 'biot';
type Box = { x: number; y: number; w: number; h: number };

type ModelSpec = {
  id: ModelId;
  name: string;
  color: string;
  soft: string;
  rate: string;
  contract: string;
  adapter: string;
  output: string;
};

const INK = '#17263b';
const MUTED = '#68788b';
const LINE = '#ccd7e1';
const GREEN = '#27815f';

const MODELS: ModelSpec[] = [
  {
    id: 'brainomni',
    name: 'BrainOmni',
    color: '#245d87',
    soft: '#e8f3fa',
    rate: '256 Hz',
    contract: '电极三维坐标',
    adapter: '坐标对齐 + 重采样',
    output: 'z₁[d₁]',
  },
  {
    id: 'cbramod',
    name: 'CBraMod',
    color: '#6756a3',
    soft: '#f0edf8',
    rate: '200 Hz',
    contract: '任意通道 + ACPE',
    adapter: '保留通道 + 时间分块',
    output: 'z₂[d₂]',
  },
  {
    id: 'biot',
    name: 'BIOT',
    color: '#c47719',
    soft: '#fff3e4',
    rate: '200 Hz',
    contract: 'BIOT-18 导联',
    adapter: '成对作差 + 导联重组',
    output: 'z₃[d₃]',
  },
];

const MODEL_MAP = new Map(MODELS.map((model) => [model.id, model]));

function modelOf(id: ModelId | null): ModelSpec | null {
  return id ? MODEL_MAP.get(id) ?? null : null;
}

function wavePath(x: number, y: number, width: number, amp: number, phase = 0): string {
  const points = Array.from({ length: 41 }, (_, index) => {
    const t = index / 40;
    const value = Math.sin(t * Math.PI * 5 + phase) * .52
      + Math.sin(t * Math.PI * 13 + phase * .6) * .22;
    return `${x + t * width},${y + value * amp}`;
  });
  return `M ${points.join(' L ')}`;
}

function layoutFor(mobile: boolean) {
  if (mobile) {
    return {
      width: 360,
      height: 602,
      source: { x: 18, y: 48, w: 324, h: 112 },
      targets: {
        brainomni: { x: 18, y: 184, w: 324, h: 72 },
        cbramod: { x: 18, y: 270, w: 324, h: 72 },
        biot: { x: 18, y: 356, w: 324, h: 72 },
      } as Record<ModelId, Box>,
      wrapper: { x: 18, y: 456, w: 324, h: 128 },
    };
  }
  return {
    width: 920,
    height: 420,
    source: { x: 28, y: 74, w: 198, h: 274 },
    targets: {
      brainomni: { x: 278, y: 60, w: 184, h: 84 },
      cbramod: { x: 482, y: 60, w: 184, h: 84 },
      biot: { x: 686, y: 60, w: 184, h: 84 },
    } as Record<ModelId, Box>,
    wrapper: { x: 278, y: 184, w: 592, h: 164 },
  };
}

function SignalSource({ box, mobile }: { box: Box; mobile: boolean }) {
  const waveX = box.x + (mobile ? 18 : 20);
  const waveWidth = mobile ? 205 : box.w - 40;
  const waveTop = box.y + (mobile ? 50 : 76);
  return (
    <g>
      <rect className="oi-source-frame" x={box.x} y={box.y} width={box.w} height={box.h} rx="6" fill="#fff" stroke="#245d87" strokeWidth="1.8" />
      <text x={box.x + 16} y={box.y + 25} fill={INK} fontSize="11" fontWeight="900">同一段 EEG</text>
      <text x={box.x + box.w - 16} y={box.y + 25} textAnchor="end" fill="#245d87" fontSize="8" fontWeight="800">x ∈ R^(C×T)</text>
      {[0, 1, 2, 3].map((row) => (
        <path
          key={row}
          d={wavePath(waveX, waveTop + row * (mobile ? 11 : 29), waveWidth, mobile ? 4 : 7, row * .7)}
          fill="none"
          stroke={row === 2 ? '#6756a3' : '#245d87'}
          strokeWidth="1.4"
          opacity={mobile ? .78 : .72}
        />
      ))}
      {!mobile && (
        <>
          <text x={box.x + 20} y={box.y + 214} fill={MUTED} fontSize="8">通道位置 metadata</text>
          {Array.from({ length: 10 }, (_, index) => {
            const angle = index / 10 * Math.PI * 2;
            return <circle key={index} cx={box.x + box.w / 2 + Math.cos(angle) * 34} cy={box.y + 244 + Math.sin(angle) * 17} r="3" fill="#fff" stroke="#118a95" />;
          })}
        </>
      )}
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="6" fill="transparent" />
    </g>
  );
}

function TargetCard({ box, model, active, onSelect }: { box: Box; model: ModelSpec; active: boolean; onSelect: () => void }) {
  return (
    <g
      className="oi-model-entry"
      role="button"
      tabIndex={0}
      aria-label={`选择 ${model.name} 输入契约`}
      aria-pressed={active}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx="6"
        fill={active ? model.soft : '#fff'}
        stroke={active ? model.color : LINE}
        strokeWidth={active ? 2 : 1.2}
      />
      <circle cx={box.x + 18} cy={box.y + 20} r="7" fill={model.color} />
      <text x={box.x + 32} y={box.y + 24} fill={INK} fontSize="10" fontWeight="900">{model.name}</text>
      <text x={box.x + box.w - 12} y={box.y + 23} textAnchor="end" fill={model.color} fontSize="8" fontWeight="850">{model.rate}</text>
      <text x={box.x + 14} y={box.y + 48} fill={MUTED} fontSize="8">{model.contract}</text>
      <text x={box.x + 14} y={box.y + 64} fill={active ? model.color : '#8b98a7'} fontSize="7.5" fontWeight="750">{active ? '正在演示该入口' : '点选查看适配过程'}</text>
    </g>
  );
}

function AlignmentDetail({ box, model, progress, mobile }: { box: Box; model: ModelSpec | null; progress: number; mobile: boolean }) {
  const activeColor = model?.color ?? '#9aa8b5';
  const activeSoft = model?.soft ?? '#f4f7f9';
  const names = mobile
    ? ['Sample', model ? 'Aᵢ' : 'Adapter', model ? 'fθᵢ' : 'Backbone', model?.output ?? 'zᵢ']
    : ['Sample(x, meta)', model ? `Aᵢ · ${model.adapter}` : 'AdapterSlot', model ? `fθᵢ · ${model.name}` : 'BackboneSlot', model?.output ?? 'zᵢ[dᵢ]'];
  const ratios = mobile ? [.04, .30, .58, .82] : [.03, .27, .62, .84];
  const widths = mobile ? [62, 70, 64, 48] : [126, 190, 126, 72];
  const y = box.y + (mobile ? 34 : 42);
  const steps = names.map((name, index) => ({
    name,
    x: box.x + ratios[index] * box.w,
    w: widths[index],
  }));

  return (
    <g>
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx="6" fill="#fff" stroke={model ? activeColor : LINE} strokeWidth={model ? 1.8 : 1.2} />
      <text x={box.x + 14} y={box.y + 20} fill={INK} fontSize="9" fontWeight="900">共同接口 W</text>
      <text x={box.x + box.w - 14} y={box.y + 20} textAnchor="end" fill={MUTED} fontSize="7.5">固定槽位；Aᵢ 与 fθᵢ 随模型变化</text>
      {steps.map(({ name, x, w }, index) => {
        const previous = steps[index - 1];
        return (
          <g key={name}>
            {previous && (
              <line
                x1={previous.x + previous.w}
                y1={y + (mobile ? 15 : 17)}
                x2={x}
                y2={y + (mobile ? 15 : 17)}
                stroke={model ? activeColor : '#b8c4ce'}
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            )}
            <rect x={x} y={y} width={w} height={mobile ? 30 : 34} rx="4" fill={model && index > 0 ? activeSoft : '#f4f7f9'} stroke={model && index > 0 ? activeColor : '#d7e0e7'} />
            <text x={x + w / 2} y={y + (mobile ? 19 : 22)} textAnchor="middle" fill={model && index > 0 ? activeColor : MUTED} fontSize={mobile ? '7.2' : '8'} fontWeight="850">{name}</text>
          </g>
        );
      })}
      {!mobile && model && (
        <g opacity={.35 + progress * .65}>
          <text x={box.x + 18} y={box.y + 112} fill={model.color} fontSize="8" fontWeight="850">{model.adapter}</text>
          <path d={wavePath(box.x + 146, box.y + 110, 110, 8, progress * 2)} fill="none" stroke={model.color} strokeWidth="1.7" />
          {model.id === 'brainomni' && Array.from({ length: 8 }, (_, index) => {
            const angle = index / 8 * Math.PI * 2;
            const startX = box.x + 295 + index * 11;
            const startY = box.y + 112 + (index % 2) * 9;
            const endX = box.x + 340 + Math.cos(angle) * 32;
            const endY = box.y + 113 + Math.sin(angle) * 18;
            return <circle key={index} cx={startX + (endX - startX) * progress} cy={startY + (endY - startY) * progress} r="3" fill="#fff" stroke={model.color} />;
          })}
          {model.id === 'cbramod' && [0, 1, 2, 3].map((index) => <rect key={index} x={box.x + 292 + index * 27} y={box.y + 98} width="22" height="27" rx="3" fill={index % 2 ? '#fff' : model.soft} stroke={model.color} />)}
          {model.id === 'biot' && [0, 1, 2, 3].map((index) => <g key={index}><circle cx={box.x + 294 + index * 34} cy={box.y + 103} r="3" fill={model.color} /><circle cx={box.x + 304 + index * 34} cy={box.y + 121} r="3" fill={model.color} /><path d={`M ${box.x + 298 + index * 34} ${box.y + 106} l 8 10`} stroke={model.color} /></g>)}
          <text x={box.x + box.w - 18} y={box.y + 116} textAnchor="end" fill={GREEN} fontSize="8" fontWeight="850">输出形状由模型决定</text>
        </g>
      )}
      {mobile && model && (
        <g opacity={.4 + progress * .6}>
          {model.id === 'brainomni' && Array.from({ length: 7 }, (_, index) => {
            const angle = index / 7 * Math.PI * 2;
            const startX = box.x + 94 + index * 20;
            const startY = box.y + 88 + (index % 2) * 8;
            const endX = box.x + box.w / 2 + Math.cos(angle) * 38;
            const endY = box.y + 91 + Math.sin(angle) * 14;
            return <circle key={index} cx={startX + (endX - startX) * progress} cy={startY + (endY - startY) * progress} r="3" fill="#fff" stroke={model.color} />;
          })}
          {model.id === 'cbramod' && [0, 1, 2, 3].map((index) => <rect key={index} x={box.x + 105 + index * 30} y={box.y + 78} width="24" height="27" rx="3" fill={index % 2 ? '#fff' : model.soft} stroke={model.color} />)}
          {model.id === 'biot' && [0, 1, 2, 3].map((index) => <g key={index}><circle cx={box.x + 100 + index * 38} cy={box.y + 82} r="3" fill={model.color} /><circle cx={box.x + 111 + index * 38} cy={box.y + 101} r="3" fill={model.color} /><path d={`M ${box.x + 103 + index * 38} ${box.y + 85} l 9 12`} stroke={model.color} strokeWidth="1.4" /></g>)}
          <text x={box.x + box.w / 2} y={box.y + 119} textAnchor="middle" fill={activeColor} fontSize="7.5" fontWeight="850">{model.adapter} → {model.output}</text>
        </g>
      )}
    </g>
  );
}

export const OmniDragAlignment: React.FC<WidgetProps> = () => {
  const { ref, mobile } = usePanelWidth<HTMLDivElement>();
  const layout = useMemo(() => layoutFor(mobile), [mobile]);
  const [selected, setSelected] = useState<ModelId>('brainomni');
  const [progress, setProgress] = useState(0);
  const selectedModel = modelOf(selected);

  useEffect(() => {
    if (!selected) return undefined;
    let frame = 0;
    const start = performance.now();
    const animate = (now: number) => {
      setProgress(clamp((now - start) / 850, 0, 1));
      if (now - start < 850) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [selected]);

  const selectModel = (id: ModelId) => {
    setSelected(id);
    setProgress(0);
  };

  return (
    <div className="oi-unit" ref={ref}>
      <div className="oi-caption">
        <span>点选一个模型入口，重放同一段 EEG 的适配过程</span>
        <strong>{selectedModel ? `${selectedModel.name} · ${selectedModel.adapter}` : '公共接口 W 保持不变'}</strong>
      </div>
      <svg
        className="oi-stage is-static"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label={`同一段 EEG 接入 ${selectedModel?.name}，经过模型专属输入适配后进入自带骨干`}
      >
        <rect x=".5" y=".5" width={layout.width - 1} height={layout.height - 1} rx="6" fill="#f7f9fb" stroke="#d6e0e8" />
        <text x={mobile ? 18 : 28} y="28" fill={MUTED} fontSize="8" fontWeight="800">同一测量不改动；接入规则按模型契约变化</text>
        <g>
          <SignalSource box={layout.source} mobile={mobile} />
        </g>
        {MODELS.map((model) => <TargetCard key={model.id} box={layout.targets[model.id]} model={model} active={selected === model.id} onSelect={() => selectModel(model.id)} />)}
        {selectedModel && !mobile && (() => {
          const target = layout.targets[selectedModel.id];
          const startX = target.x + target.w / 2;
          const startY = target.y + target.h;
          const endX = mobile ? layout.wrapper.x + layout.wrapper.w / 2 : startX;
          const endY = layout.wrapper.y;
          const particleY = startY + (endY - startY) * progress;
          const particleX = startX + (endX - startX) * progress;
          return <g pointerEvents="none"><line x1={startX} y1={startY} x2={endX} y2={endY} stroke={selectedModel.color} strokeWidth="1.5" strokeDasharray="4 4" /><circle cx={particleX} cy={particleY} r="5" fill={selectedModel.color} stroke="#fff" strokeWidth="2" /></g>;
        })()}
        <AlignmentDetail box={layout.wrapper} model={selectedModel} progress={progress} mobile={mobile} />
      </svg>
      {selectedModel && <div className="oi-feedback good"><b>Aᵢ 承担 {selectedModel.name} 的输入差异；fθᵢ 是该模型自带骨干。</b></div>}
    </div>
  );
};
