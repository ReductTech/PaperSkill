import React, { useEffect, useRef, useState } from 'react';
import { clamp, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const C = { bg: '#f5f8f0', paper: '#b8c9a7', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706', text: '#21324a', muted: '#68778f', border: '#d7deea', white: '#ffffff' };
type Cue = 'visual' | 'text' | 'behavior';
interface MapState { x: number; y: number; selectedCue: Cue; isDragging: boolean; judgment: Cue | null; showShape: boolean }
const anchors: Record<Cue, { x: number; y: number; label: string }> = {
  visual: { x: 250, y: 66, label: '视觉细节' }, text: { x: 380, y: 78, label: '文字描述' }, behavior: { x: 300, y: 182, label: '收藏历史' }
};
const initialState: MapState = { x: 280, y: 116, selectedCue: 'visual', isDragging: false, judgment: null, showShape: true };

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 9) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function nearestCue(x: number, y: number): Cue {
  const order: Cue[] = ['behavior', 'visual', 'text']; let best = order[0]; let bestD = Number.POSITIVE_INFINITY;
  order.forEach((cue) => { const a = anchors[cue]; const d = Math.hypot(x - a.x, y - a.y); if (d < bestD) { bestD = d; best = cue; } });
  return best;
}

const copy: Record<Cue, { detail: string; short: string; color: string; shape: string }> = {
  visual: { detail: '视觉线索：来自商品图像；实验输入为 4096 维预提取特征。', short: '图像向量', color: C.blue, shape: 'Eᵢ,visual ∈ ℝ⁴⁰⁹⁶' },
  text: { detail: '文本线索：来自商品文字描述；实验输入为 384 维预提取特征。', short: '文本向量', color: C.blue, shape: 'Eᵢ,text ∈ ℝ³⁸⁴' },
  behavior: { detail: '行为线索：来自用户—物品交互矩阵 R，并形成 ID 表征。', short: '交互矩阵', color: C.orange, shape: 'R ∈ {0,1}^|U|×|I|' }
};

function feedbackFor(s: MapState) {
  if (s.judgment === 'behavior') return { text: '分类正确：模态描述内容，行为记录交互关系。', cls: 'good', color: C.green };
  if (s.judgment) return { text: '来源混淆：收藏历史不是视觉或文本模态。', cls: 'bad', color: C.red };
  return { text: copy[s.selectedCue].detail, cls: '', color: copy[s.selectedCue].color };
}

function drawMap(ctx: CanvasRenderingContext2D, s: MapState) {
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.white; rounded(ctx, 10, 12, 150, 214, 12); ctx.fill(); ctx.strokeStyle = C.border; ctx.stroke();
  ctx.fillStyle = C.text; ctx.font = '600 13px sans-serif'; ctx.fillText('商品来源', 24, 34);
  ctx.fillStyle = C.paper; rounded(ctx, 38, 55, 88, 122, 7); ctx.fill();
  ctx.fillStyle = '#eef4e8'; ctx.fillRect(48, 68, 68, 72); ctx.fillStyle = '#ead8b4'; ctx.fillRect(68, 86, 28, 48);
  ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.strokeRect(62, 80, 40, 59);
  ctx.fillStyle = C.muted; ctx.font = '11px sans-serif'; ctx.fillText('同一件商品', 50, 198);

  ctx.fillStyle = 'rgba(255,255,255,.82)'; rounded(ctx, 170, 12, 238, 214, 12); ctx.fill(); ctx.strokeStyle = C.border; ctx.stroke();
  ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
  (Object.keys(anchors) as Cue[]).forEach((cue) => { const a = anchors[cue]; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(a.x, a.y); ctx.stroke(); }); ctx.setLineDash([]);
  (Object.keys(anchors) as Cue[]).forEach((cue) => {
    const a = anchors[cue]; const active = cue === s.selectedCue; ctx.fillStyle = active ? `${copy[cue].color}22` : C.white;
    rounded(ctx, a.x - 42, a.y - 19, 84, 38, 10); ctx.fill(); ctx.strokeStyle = active ? copy[cue].color : C.border; ctx.lineWidth = active ? 3 : 1; ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(a.label, a.x, a.y + 4); ctx.textAlign = 'start';
  });
  const a = anchors[s.selectedCue]; ctx.strokeStyle = copy[s.selectedCue].color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(a.x, a.y); ctx.stroke();
  ctx.fillStyle = C.paper; rounded(ctx, s.x - 20, s.y - 15, 40, 30, 5); ctx.fill(); ctx.strokeStyle = s.isDragging ? C.orange : C.blue; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = C.text; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('照片', s.x, s.y + 4); ctx.textAlign = 'start';

  ctx.fillStyle = C.white; rounded(ctx, 418, 12, 132, 214, 12); ctx.fill(); ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = C.text; ctx.font = '600 13px sans-serif'; ctx.fillText('形状检查', 432, 34);
  ctx.fillStyle = copy[s.selectedCue].color; rounded(ctx, 432, 51, 104, 28, 8); ctx.fill(); ctx.fillStyle = C.white; ctx.font = '11px sans-serif'; ctx.fillText(copy[s.selectedCue].short, 449, 69);
  ctx.fillStyle = C.text; ctx.font = '12px sans-serif';
  const shape = copy[s.selectedCue].shape; ctx.fillText(shape, 432, 103);
  if (s.selectedCue === 'behavior') {
    for (let r = 0; r < 4; r += 1) for (let col = 0; col < 4; col += 1) {
      ctx.fillStyle = (r + col) % 3 === 0 ? C.orange : '#edf0f4'; ctx.fillRect(436 + col * 18, 122 + r * 18, 12, 12);
    }
  } else {
    for (let i = 0; i < 6; i += 1) { ctx.fillStyle = i % 2 ? C.paper : copy[s.selectedCue].color; ctx.fillRect(434, 122 + i * 12, 62 + i * 5, 7); }
  }
  ctx.fillStyle = C.muted; ctx.font = '10px sans-serif'; ctx.fillText('维度 ≠ 重要性', 432, 210);
}

export const MgcnModalityMap: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<MapState>(initialState);
  const feedback = feedbackFor(state);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '100%'; canvas.style.height = 'auto'; drawMap(ctx, state); canvas.classList.add('is-ready');
  }, [state]);

  const move = (x: number, y: number, dragging = state.isDragging) => {
    const nx = clamp(x, 180, 398), ny = clamp(y, 35, 207);
    setState((s) => ({ ...s, x: nx, y: ny, selectedCue: nearestCue(nx, ny), isDragging: dragging, judgment: null }));
  };
  const selectCue = (cue: Cue) => { const a = anchors[cue]; setState((s) => ({ ...s, x: a.x, y: a.y, selectedCue: cue, isDragging: false, judgment: null })); };
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => { const rect = e.currentTarget.getBoundingClientRect(); return { x: (e.clientX - rect.left) * W / rect.width, y: (e.clientY - rect.top) * H / rect.height }; };
  const buttonStyle = (active: boolean): React.CSSProperties => ({ minHeight: 44, border: `2px solid ${active ? C.blue : C.border}`, borderRadius: 10, background: active ? '#edf2f8' : C.white, color: C.text, padding: '8px 12px', cursor: 'pointer' });

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} tabIndex={0}
        aria-label="可拖动照片的视觉、文本与行为输入地图"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); const p = point(e); move(p.x, p.y, true); }}
        onPointerMove={(e) => { if (!state.isDragging) return; const p = point(e); move(p.x, p.y, true); }}
        onPointerUp={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); setState((s) => ({ ...s, isDragging: false })); }}
        onPointerCancel={() => setState((s) => ({ ...s, isDragging: false }))}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 24 : 8;
          if (e.key === 'ArrowLeft') { e.preventDefault(); move(state.x - step, state.y, false); }
          if (e.key === 'ArrowRight') { e.preventDefault(); move(state.x + step, state.y, false); }
          if (e.key === 'ArrowUp') { e.preventDefault(); move(state.x, state.y - step, false); }
          if (e.key === 'ArrowDown') { e.preventDefault(); move(state.x, state.y + step, false); }
          if (e.key === '1') selectCue('visual'); if (e.key === '2') selectCue('text'); if (e.key === '3') selectCue('behavior');
        }} />
      <div role="group" aria-label="线索锚点" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <button style={buttonStyle(state.selectedCue === 'visual')} aria-pressed={state.selectedCue === 'visual'} onClick={() => selectCue('visual')}>视觉细节 · 4096 维</button>
        <button style={buttonStyle(state.selectedCue === 'text')} aria-pressed={state.selectedCue === 'text'} onClick={() => selectCue('text')}>文字描述 · 384 维</button>
        <button style={buttonStyle(state.selectedCue === 'behavior')} aria-pressed={state.selectedCue === 'behavior'} onClick={() => selectCue('behavior')}>收藏历史 · R</button>
        <button style={buttonStyle(false)} onClick={() => setState({ ...initialState })}>回到中心</button>
        <button style={buttonStyle(state.showShape)} aria-pressed={state.showShape} onClick={() => setState((s) => ({ ...s, showShape: !s.showShape }))}>{state.showShape ? '隐藏形状说明' : '查看形状'}</button>
      </div>
      {state.showShape ? <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 10 }}><strong>{copy[state.selectedCue].short}：</strong>{copy[state.selectedCue].shape}。4096 与 384 只描述论文实验输入形状，不是重要性分数。</div> : null}
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <strong>学习判断：</strong>“用户收藏了商品 i”应该放进哪一类输入？
        <div role="group" aria-label="输入分类判断" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <button style={buttonStyle(state.judgment === 'visual')} onClick={() => setState((s) => ({ ...s, judgment: 'visual' }))}>视觉特征</button>
          <button style={buttonStyle(state.judgment === 'text')} onClick={() => setState((s) => ({ ...s, judgment: 'text' }))}>文本特征</button>
          <button style={buttonStyle(state.judgment === 'behavior')} onClick={() => setState((s) => ({ ...s, judgment: 'behavior' }))}>交互矩阵 R</button>
        </div>
        <p style={{ margin: '10px 0 0', color: C.muted }}>4096 维一定比 384 维更重要吗？不能这样判断：维度描述形状，不直接代表推荐贡献。</p>
      </div>
      <div className={`feedback ${feedback.cls}`} style={{ borderLeftColor: feedback.color }} aria-live="polite">{feedback.text}</div>
      <div style={{ marginTop: 10, color: C.muted, fontSize: 13 }}><strong style={{ color: C.text }}>输入证据：</strong>第 5 页，3.1.1–3.1.3 节与表 1；Baby、Sports、Clothing，8:1:1 随机划分与全量排序协议。输入维度与协议不可外推为通用标准。</div>
    </div>
  );
};

export default MgcnModalityMap;
