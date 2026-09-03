import React, { useEffect, useMemo, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 390;

type ConstraintKey = 'coverage' | 'independence' | 'robustness';
type Candidate = {
  id: string;
  title: string;
  dev: number;
  status: 'merged' | 'pruned';
  matches: Record<ConstraintKey, boolean | null>;
  finding: string;
};

const CONSTRAINTS: Record<ConstraintKey, { label: string; short: string }> = {
  coverage: { label: '扩大候选与证据覆盖', short: '覆盖' },
  independence: { label: '保持搜索轨迹独立', short: '独立' },
  robustness: { label: '不引入已知的开发集过拟合', short: '过拟合' },
};

const CANDIDATES: Candidate[] = [
  {
    id: 'N5.1',
    title: 'Persona rollouts',
    dev: 70,
    status: 'pruned',
    matches: { coverage: false, independence: null, robustness: null },
    finding: '不同 persona 主要在同一检索前沿内重排，未解决候选覆盖瓶颈。',
  },
  {
    id: 'N6.2',
    title: 'Search-augmented judge',
    dev: 75,
    status: 'pruned',
    matches: { coverage: null, independence: null, robustness: false },
    finding: '开发准确率最高，但论文指出它会过拟合开发问题，因此被剪枝。',
  },
  {
    id: 'N7.1',
    title: 'Shared decomposition',
    dev: 60,
    status: 'pruned',
    matches: { coverage: null, independence: false, robustness: null },
    finding: '共享 decomposition 会降低轨迹独立性，节点被剪枝。',
  },
  {
    id: 'N8.1',
    title: 'Two-round sharing',
    dev: 72.5,
    status: 'merged',
    matches: { coverage: true, independence: true, robustness: null },
    finding: '第一轮保持独立，第二轮只共享候选与证据档案；该设计被合并并推动最终转变。',
  },
];

const CONSTRAINT_KEYS = Object.keys(CONSTRAINTS) as ConstraintKey[];

export const FrontierLeafPicker: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeConstraints, setActiveConstraints] = useState<ConstraintKey[]>(CONSTRAINT_KEYS);
  const [selectedId, setSelectedId] = useState('N8.1');
  const [revealed, setRevealed] = useState(false);

  const ranked = useMemo(
    () => CANDIDATES.map((candidate) => {
      const selectedEvidence = activeConstraints.map((key) => candidate.matches[key]);
      return {
        ...candidate,
        supported: selectedEvidence.filter((value) => value === true).length,
        contradicted: selectedEvidence.filter((value) => value === false).length,
        unknown: selectedEvidence.filter((value) => value === null).length,
      };
    }).sort((a, b) => (b.supported - b.contradicted) - (a.supported - a.contradicted) || b.supported - a.supported),
    [activeConstraints]
  );
  const recommended = ranked[0];
  const selected = CANDIDATES.find((candidate) => candidate.id === selectedId) ?? CANDIDATES[0];

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

    ctx.fillStyle = '#27446e';
    ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('祖先洞见形成的选择约束', 28, 32);
    CONSTRAINT_KEYS.forEach((key, index) => {
      const active = activeConstraints.includes(key);
      const x = 28 + index * 224;
      ctx.fillStyle = active ? '#27446e' : '#ffffff';
      ctx.strokeStyle = active ? '#27446e' : '#b8c9a7';
      ctx.lineWidth = active ? 3 : 1;
      ctx.fillRect(x, 50, 204, 40);
      ctx.strokeRect(x, 50, 204, 40);
      ctx.fillStyle = active ? '#ffffff' : '#66745e';
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${active ? '✓' : '○'} ${CONSTRAINTS[key].label}`, x + 102, 75);
    });

    CANDIDATES.forEach((candidate, index) => {
      const x = 28 + (index % 2) * 346;
      const y = 126 + Math.floor(index / 2) * 108;
      const selectedEvidence = activeConstraints.map((key) => candidate.matches[key]);
      const supported = selectedEvidence.filter((value) => value === true).length;
      const contradicted = selectedEvidence.filter((value) => value === false).length;
      const unknown = selectedEvidence.filter((value) => value === null).length;
      const isRecommended = candidate.id === recommended.id;
      const isSelected = candidate.id === selected.id;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isRecommended ? '#228d5c' : isSelected ? '#27446e' : '#b8c9a7';
      ctx.lineWidth = isRecommended || isSelected ? 4 : 2;
      ctx.fillRect(x, y, 318, 88);
      ctx.strokeRect(x, y, 318, 88);
      ctx.fillStyle = '#21324a';
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${candidate.id} · ${candidate.title}`, x + 14, y + 24);
      ctx.font = '12px "Segoe UI", sans-serif';
      CONSTRAINT_KEYS.forEach((key, keyIndex) => {
        const match = candidate.matches[key];
        ctx.fillStyle = match === true ? '#228d5c' : match === false ? '#c43f52' : '#7b8794';
        ctx.fillText(`${match === true ? '✓' : match === false ? '×' : '?'} ${CONSTRAINTS[key].short}`, x + 14 + keyIndex * 78, y + 51);
      });
      ctx.fillStyle = isRecommended ? '#228d5c' : '#66745e';
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillText(`支持 ${supported} · 冲突 ${contradicted} · 未报告 ${unknown}${isRecommended ? ' · 教学推荐' : ''}`, x + 14, y + 75);
      if (revealed) {
        ctx.fillStyle = candidate.status === 'merged' ? '#228d5c' : '#c43f52';
        ctx.textAlign = 'right';
        ctx.fillText(`${candidate.dev.toFixed(1)}% · ${candidate.status}`, x + 304, y + 75);
      }
    });

    ctx.fillStyle = '#21324a';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('✓/× 只表示论文明确支持或冲突；? 表示论文未报告。推荐排序是教学启发式，不是论文指标。', 28, 366);
    canvas.classList.add('is-ready');
  }, [activeConstraints, recommended.id, revealed, selected.id]);

  const toggleConstraint = (key: ConstraintKey) => {
    setRevealed(false);
    setActiveConstraints((current) => {
      if (current.includes(key)) return current.length === 1 ? current : current.filter((item) => item !== key);
      return [...current, key];
    });
  };

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
          aria-label={`BrowseComp 前沿选择教学回放，当前推荐 ${recommended.id} ${recommended.title}`}
        />
      </div>
      <div className="ctrl" style={{ display: 'grid', gap: 10 }}>
        <div role="group" aria-label="选择祖先证据约束">
          {CONSTRAINT_KEYS.map((key) => (
            <label key={key} style={{ display: 'block', marginTop: 6 }}>
              <input type="checkbox" checked={activeConstraints.includes(key)} onChange={() => toggleConstraint(key)} />{' '}
              {CONSTRAINTS[key].label}
            </label>
          ))}
        </div>
        <div role="group" aria-label="查看候选节点">
          {CANDIDATES.map((candidate) => (
            <button key={candidate.id} type="button" aria-pressed={selectedId === candidate.id} onClick={() => setSelectedId(candidate.id)}>
              {candidate.id}
            </button>
          ))}
          <button type="button" onClick={() => setRevealed((current) => !current)}>
            {revealed ? '隐藏论文结果' : '揭示论文结果'}
          </button>
        </div>
      </div>
      <div className={`feedback ${revealed && selected.status === 'merged' ? 'good' : revealed ? 'bad' : ''}`} aria-live="polite">
        {revealed
          ? <><strong>{selected.id} · {selected.dev.toFixed(1)}% · {selected.status}：</strong>{selected.finding}</>
          : <><strong>先按已报告证据判断：</strong>当前教学推荐 {recommended.id}，因为它获得的明确支持更多、明确冲突更少；“?” 不会被当成满足。揭示结果前，不用最终状态倒推机制。</>}
      </div>
    </div>
  );
};

export default FrontierLeafPicker;
