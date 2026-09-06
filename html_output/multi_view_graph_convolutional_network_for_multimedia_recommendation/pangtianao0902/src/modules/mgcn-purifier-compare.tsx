import React, { useEffect, useRef, useState } from 'react';
import { clamp, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560, H = 240;
const C = { bg: '#f5f8f0', paper: '#b8c9a7', blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706', text: '#21324a', muted: '#68778f', border: '#d7deea', white: '#ffffff' };
type Modality = 'visual' | 'text';
type Judgment = 'lower' | 'amplify' | 'copy' | null;
interface PurifierState { started: boolean; progress: number; isPlaying: boolean; modality: Modality; judgment: Judgment }
const initialState: PurifierState = { started: false, progress: 0, isPlaying: false, modality: 'visual', judgment: null };
const examples: Record<Modality, { transformed: number[]; gate: number[] }> = {
  visual: { transformed: [0.78, 0.68, 0.88, 0.57, 0.73], gate: [0.88, 0.20, 0.81, 0.62, 0.16] },
  text: { transformed: [0.62, 0.84, 0.55, 0.76, 0.67], gate: [0.76, 0.28, 0.70, 0.22, 0.86] }
};

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 9) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function feedbackFor(s: PurifierState) {
  if (s.judgment === 'lower') return { text: '判断正确：逐元素乘法会压低该维，但“接近 0”不等于数学上必为 0。', cls: 'good', color: C.green };
  if (s.judgment) return { text: '再看乘法桥：每一维只受对应门值缩放。', cls: 'bad', color: C.red };
  if (s.progress === 0) return { text: '尚未开始：左右两侧仍显示同一份变换后模态特征。', cls: '', color: C.blue };
  if (s.progress < 0.5) return { text: '正在生成逐维门控：行为侧 ID 表征开始控制保留比例。', cls: '', color: C.blue };
  if (s.progress < 1) return { text: '逐元素相乘进行中：红色噪声成分被较小门值压低。', cls: '', color: C.orange };
  return { text: '净化完成：偏好相关成分得到更多保留。', cls: 'good', color: C.green };
}

function bars(ctx: CanvasRenderingContext2D, values: number[], x: number, baseY: number, purified: boolean) {
  values.forEach((v, i) => {
    const h = v * 94; const nuisance = i === 1 || i === 4;
    ctx.fillStyle = purified ? (nuisance ? 'rgba(196,63,82,.62)' : C.green) : (nuisance ? C.red : C.blue);
    ctx.fillRect(x + i * 29, baseY - h, 17, h);
    ctx.fillStyle = C.muted; ctx.font = '9px sans-serif'; ctx.fillText(`${i + 1}`, x + 6 + i * 29, baseY + 13);
  });
}

function drawPurifier(ctx: CanvasRenderingContext2D, s: PurifierState) {
  const ex = examples[s.modality];
  const purified = ex.transformed.map((v, i) => v * ((1 - s.progress) + s.progress * ex.gate[i]));
  const active = Math.min(4, Math.floor(s.progress * 5));
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.white; rounded(ctx, 8, 12, 198, 190, 12); ctx.fill(); ctx.strokeStyle = C.border; ctx.stroke();
  ctx.fillStyle = C.white; rounded(ctx, 354, 12, 198, 190, 12); ctx.fill(); ctx.strokeStyle = C.border; ctx.stroke();
  ctx.fillStyle = C.text; ctx.font = '600 13px sans-serif'; ctx.fillText('原始模态', 22, 35); ctx.fillText('行为引导净化', 368, 35);
  ctx.fillStyle = C.muted; ctx.font = '10px sans-serif'; ctx.fillText(s.modality === 'visual' ? '视觉示意向量' : '文本示意向量', 22, 51); ctx.fillText('逐维缩放后的示意向量', 368, 51);
  ctx.strokeStyle = C.border; ctx.beginPath(); ctx.moveTo(24, 174); ctx.lineTo(190, 174); ctx.moveTo(370, 174); ctx.lineTo(536, 174); ctx.stroke();
  bars(ctx, ex.transformed, 28, 174, false); bars(ctx, purified, 374, 174, true);

  ctx.fillStyle = '#fff'; rounded(ctx, 214, 12, 132, 190, 12); ctx.fill(); ctx.strokeStyle = C.border; ctx.stroke();
  ctx.fillStyle = C.text; ctx.font = '600 12px sans-serif'; ctx.fillText('行为侧 ID → σ 门', 224, 35);
  ex.gate.forEach((g, i) => {
    const y = 54 + i * 27; const applied = s.progress > i / 5;
    ctx.fillStyle = applied ? 'rgba(39,68,110,.12)' : '#f6f7f9'; rounded(ctx, 226, y, 70, 20, 6); ctx.fill();
    ctx.strokeStyle = i === active ? C.blue : C.border; ctx.lineWidth = i === active ? 3 : 1; ctx.stroke();
    ctx.fillStyle = C.orange; ctx.font = '10px sans-serif'; ctx.fillText(`g${i + 1}=${g.toFixed(2)}`, 238, y + 14);
    ctx.fillStyle = C.text; ctx.font = '16px sans-serif'; ctx.fillText('⊙', 310, y + 16);
  });
  ctx.fillStyle = C.muted; ctx.font = '10px sans-serif'; ctx.fillText('门值均为教学示意', 226, 194);
  ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(202, 105); ctx.lineTo(214, 105); ctx.moveTo(346, 105); ctx.lineTo(358, 105); ctx.stroke();
  const smudge = 1 - s.progress;
  ctx.fillStyle = `rgba(196,63,82,${0.18 * smudge})`; ctx.beginPath(); ctx.ellipse(445, 100, 67, 37, -0.2, 0, Math.PI * 2); ctx.fill();
  if (s.progress === 1) { ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.strokeRect(386, 60, 132, 112); }
  ctx.fillStyle = C.border; rounded(ctx, 14, 213, 532, 12, 6); ctx.fill();
  ctx.fillStyle = C.orange; rounded(ctx, 14, 213, 532 * s.progress, 12, 6); ctx.fill();
  ctx.fillStyle = C.text; ctx.font = '10px sans-serif'; ctx.fillText(`净化进度 ${Math.round(s.progress * 100)}%`, 230, 238);
}

export const MgcnPurifierCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<PurifierState>(initialState);
  const feedback = feedbackFor(state);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '100%'; canvas.style.height = 'auto'; drawPurifier(ctx, state); canvas.classList.add('is-ready');
  }, [state]);

  useEffect(() => {
    if (!state.isPlaying) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState((s) => ({ ...s, started: true, progress: s.progress < 0.5 ? 0.5 : 1, isPlaying: false })); return;
    }
    let frame = 0; let previous = performance.now();
    const tick = (now: number) => {
      const delta = (now - previous) / 1800; previous = now;
      setState((s) => {
        const progress = clamp(s.progress + delta, 0, 1);
        return { ...s, started: true, progress, isPlaying: progress < 1, judgment: null };
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.isPlaying]);

  const setProgress = (value: number) => setState((s) => ({ ...s, started: value > 0, progress: clamp(value, 0, 1), isPlaying: false, judgment: null }));
  const togglePlay = () => setState((s) => s.progress >= 1 ? { ...s, started: true, progress: 0, isPlaying: true, judgment: null } : { ...s, started: true, isPlaying: !s.isPlaying, judgment: null });
  const buttonStyle = (active: boolean): React.CSSProperties => ({ minHeight: 44, border: `2px solid ${active ? C.blue : C.border}`, borderRadius: 10, background: active ? '#edf2f8' : C.white, color: C.text, padding: '8px 12px', cursor: 'pointer' });

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} tabIndex={0}
        aria-label="原始模态与行为引导净化的同步逐维对照"
        onKeyDown={(e) => {
          if (e.key === ' ') { e.preventDefault(); togglePlay(); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); setProgress(state.progress - (e.shiftKey ? 0.1 : 0.01)); }
          if (e.key === 'ArrowRight') { e.preventDefault(); setProgress(state.progress + (e.shiftKey ? 0.1 : 0.01)); }
          if (e.key === 'Home') { e.preventDefault(); setProgress(0); }
          if (e.key === 'End') { e.preventDefault(); setProgress(1); }
        }} />
      <div className="ctrl">
        <label htmlFor={`purify-${chapterId}`}>净化进度 <span className="val">{Math.round(state.progress * 100)}%</span></label>
        <input id={`purify-${chapterId}`} type="range" min={0} max={100} step={1} value={Math.round(state.progress * 100)}
          aria-valuetext={`净化进度 ${Math.round(state.progress * 100)}%`} onChange={(e) => setProgress(Number(e.target.value) / 100)} />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <button style={buttonStyle(state.isPlaying)} onClick={togglePlay}>{state.isPlaying ? '暂停' : state.progress >= 1 ? '重新擦拭' : '开始擦拭'}</button>
        <button style={buttonStyle(false)} onClick={() => setProgress(state.progress - 0.1)}>上一步</button>
        <button style={buttonStyle(false)} onClick={() => setProgress(state.progress + 0.1)}>下一步</button>
        <button style={buttonStyle(false)} onClick={() => setState(initialState)}>重置</button>
      </div>
      <div role="group" aria-label="示意模态" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button style={buttonStyle(state.modality === 'visual')} aria-pressed={state.modality === 'visual'} onClick={() => setState({ ...initialState, modality: 'visual' })}>视觉</button>
        <button style={buttonStyle(state.modality === 'text')} aria-pressed={state.modality === 'text'} onClick={() => setState({ ...initialState, modality: 'text' })}>文本</button>
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <strong>形状与机制：</strong>行为侧 ID 表征生成与模态向量兼容的 sigmoid 门 Gₘ；每一维执行 E′ₘ[j] = Gₘ[j] ⊙ transformed(Eᵢ,ₘ)[j]。画布门值仅用于教学示意，不是论文测得参数。
      </div>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <strong>学习判断：</strong>若某一维的门值接近 0，它在净化后会怎样？
        <div role="group" aria-label="门值判断" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <button style={buttonStyle(state.judgment === 'lower')} onClick={() => setState((s) => ({ ...s, isPlaying: false, judgment: 'lower' }))}>被明显压低</button>
          <button style={buttonStyle(state.judgment === 'amplify')} onClick={() => setState((s) => ({ ...s, isPlaying: false, judgment: 'amplify' }))}>必然放大</button>
          <button style={buttonStyle(state.judgment === 'copy')} onClick={() => setState((s) => ({ ...s, isPlaying: false, judgment: 'copy' }))}>自动复制到所有物品</button>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`} style={{ borderLeftColor: feedback.color }} aria-live="polite">{feedback.text}</div>
      <div style={{ marginTop: 10, color: C.muted, fontSize: 13 }}><strong style={{ color: C.text }}>机制证据：</strong>第 3 页，2.2 节，公式 (1)–(2)，图 2(b)；架构定义。门控不保证清除全部噪声，行为极少或有偏时依据也可能不足，冷启动仍未解决。</div>
    </div>
  );
};

export default MgcnPurifierCompare;
