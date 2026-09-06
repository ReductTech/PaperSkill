import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 760;
const H = 235;
type Lifetime = 'short' | 'medium' | 'long';
type EvidenceId = 'local' | 'relation' | 'scale';

const zones: Array<{ id: Lifetime; label: string; note: string; color: string }> = [
  { id: 'short', label: '短寿命', note: '快速更新', color: '#1455d9' },
  { id: 'medium', label: '中寿命', note: '跨帧维持', color: '#16875b' },
  { id: 'long', label: '长寿命', note: '长期基准', color: '#7357c8' },
];

const evidence: Array<{ id: EvidenceId; label: string; detail: string; correct: Lifetime }> = [
  { id: 'local', label: '瞬时局部匹配', detail: '当前窗口中的纹理与对应', correct: 'short' },
  { id: 'relation', label: '跨帧几何关系', detail: '运动、方向与结构连续性', correct: 'medium' },
  { id: 'scale', label: '全局结构与尺度', detail: '长期一致的度量基准', correct: 'long' },
];

const initialAssignments: Record<EvidenceId, Lifetime | null> = {
  local: null,
  relation: null,
  scale: null,
};

function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#17202b';
  ctx.fillRect(x - 15, y - 10, 30, 20);
  ctx.fillRect(x - 9, y - 15, 11, 5);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + 4, y, 6, 0, Math.PI * 2);
  ctx.fill();
}

export const Chap03LifetimeSorter: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assignments, setAssignments] = useState<Record<EvidenceId, Lifetime | null>>(initialAssignments);
  const [dragging, setDragging] = useState<EvidenceId | null>(null);
  const [feedback, setFeedback] = useState('请选择一条证据，再把它放入短、中或长寿命区。');

  const placedCount = Object.values(assignments).filter(Boolean).length;
  const allCorrect = evidence.every((item) => assignments[item.id] === item.correct);

  const place = (evidenceId: EvidenceId, lifetime: Lifetime) => {
    setAssignments((current) => ({ ...current, [evidenceId]: lifetime }));
    const item = evidence.find((candidate) => candidate.id === evidenceId)!;
    if (item.correct === lifetime) {
      setFeedback(`${item.label} → ${zones.find((zone) => zone.id === lifetime)!.label}：分配合理。`);
    } else if (evidenceId === 'local' && lifetime === 'long') {
      setFeedback('过时局部对应可能污染当前匹配：局部纹理不应被长期无差别保留。');
    } else if (evidenceId === 'scale' && lifetime === 'short') {
      setFeedback('长期几何基准会被过早丢失：尺度与全局结构需要更长寿命。');
    } else if (evidenceId === 'relation') {
      setFeedback(lifetime === 'short' ? '跨帧关系过早消失，会破坏运动与结构连续性。' : '跨帧关系需要延续，但不必像全局尺度一样保留到最久。');
    } else {
      setFeedback('这条证据与所选寿命不匹配；可继续调整，答案不会锁死。');
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(94,105,120,0.12)';
    for (let x = 20; x < W; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 20; y < H; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const lengths: Record<Lifetime, number> = { short: 145, medium: 325, long: 520 };
    const lanes: Array<{ id: EvidenceId; y: number; label: string }> = [
      { id: 'local', y: 62, label: '局部匹配' },
      { id: 'relation', y: 116, label: '跨帧关系' },
      { id: 'scale', y: 170, label: '全局尺度' },
    ];
    drawCamera(ctx, 690, 116);
    ctx.fillStyle = '#17202b';
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillText('当前 t', 674, 145);

    lanes.forEach((lane) => {
      const assigned = assignments[lane.id];
      const item = evidence.find((candidate) => candidate.id === lane.id)!;
      const length = assigned ? lengths[assigned] : 70;
      const correct = assigned === item.correct;
      const color = !assigned ? '#9ca9ba' : correct ? '#16875b' : '#c66a16';
      ctx.strokeStyle = color;
      ctx.lineWidth = assigned ? 5 : 2;
      ctx.setLineDash(assigned ? [] : [5, 5]);
      ctx.beginPath();
      ctx.moveTo(674, lane.y);
      ctx.lineTo(674 - length, lane.y);
      ctx.stroke();
      ctx.setLineDash([]);
      const markers = Math.max(2, Math.floor(length / 34));
      for (let index = 0; index < markers; index += 1) {
        const alpha = 0.22 + 0.72 * (index / Math.max(1, markers - 1));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(674 - length + index * (length / markers), lane.y - 5, 7, 10);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#17202b';
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillText(lane.label, 22, lane.y + 4);
      ctx.fillStyle = color;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText(
        assigned ? zones.find((zone) => zone.id === assigned)!.label : '尚未分配',
        102,
        lane.y + 4
      );
    });

    ctx.fillStyle = '#758195';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('轨迹长度由你的寿命分配决定；颜色绿色表示符合本节目标。', 22, 216);
    ctx.fillText('机制示意，不是模型输出', 594, 216);
    canvas.classList.add('is-ready');
  }, [assignments]);

  const onDrop = (event: React.DragEvent<HTMLDivElement>, lifetime: Lifetime) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('text/plain') || dragging;
    if (raw === 'local' || raw === 'relation' || raw === 'scale') place(raw, lifetime);
    setDragging(null);
  };

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
          gap: 10,
          marginBottom: 14,
        }}
      >
        {evidence.map((item) => {
          const current = assignments[item.id];
          const correct = current === item.correct;
          return (
            <div
              key={item.id}
              draggable
              tabIndex={0}
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', item.id);
                event.dataTransfer.effectAllowed = 'move';
                setDragging(item.id);
              }}
              onDragEnd={() => setDragging(null)}
              style={{
                padding: 12,
                border: `2px solid ${current ? (correct ? '#16875b' : '#c66a16') : '#d5dbe3'}`,
                borderRadius: 6,
                background: '#ffffff',
                minHeight: 142,
              }}
              aria-label={`${item.label}，当前${current ? `分配到${zones.find((zone) => zone.id === current)!.label}` : '尚未分配'}`}
            >
              <strong style={{ display: 'block', color: '#17202b', fontSize: 15 }}>{item.label}</strong>
              <span style={{ display: 'block', minHeight: 42, marginTop: 4, color: '#5e6978', fontSize: 13 }}>{item.detail}</span>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 9 }} role="group" aria-label={`为${item.label}选择寿命`}>
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    className={`chip ${current === zone.id ? 'selected' : ''}`}
                    aria-pressed={current === zone.id}
                    onClick={() => place(item.id, zone.id)}
                    style={{ padding: '5px 9px', fontSize: 13 }}
                  >
                    {zone.label.slice(0, 1)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 9,
          marginBottom: 8,
        }}
      >
        {zones.map((zone) => (
          <div
            key={zone.id}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
            onDrop={(event) => onDrop(event, zone.id)}
            style={{
              padding: '11px 8px',
              textAlign: 'center',
              border: `2px dashed ${dragging ? zone.color : '#d5dbe3'}`,
              borderRadius: 6,
              background: `${zone.color}0d`,
              color: '#17202b',
              minHeight: 64,
            }}
            role="group"
            aria-label={`${zone.label}放置区，${zone.note}`}
          >
            <strong style={{ color: zone.color }}>{zone.label}</strong>
            <span style={{ display: 'block', color: '#758195', fontSize: 12 }}>{zone.note}</span>
          </div>
        ))}
      </div>

      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label="三类几何证据在当前分配下形成的短、中、长期历史轨迹"
      />
      <div className="ctrl">
        <span style={{ color: '#5e6978', fontWeight: 700 }}>已分配 {placedCount} / 3</span>
        <button
          type="button"
          className="tiny ghost"
          onClick={() => {
            setAssignments(initialAssignments);
            setFeedback('已清空分配；可以重新尝试。');
          }}
        >
          重置
        </button>
      </div>
      <div className={`feedback ${allCorrect ? 'good' : feedback.includes('污染') || feedback.includes('过早') ? 'bad' : ''}`} aria-live="polite">
        {allCorrect ? '三类证据已形成短、中、长的寿命分工：目标不是记得更多，而是以合适速度遗忘。' : feedback}
      </div>
    </div>
  );
};

export default Chap03LifetimeSorter;
