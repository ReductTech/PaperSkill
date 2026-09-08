import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import {
  PAL,
  clearPanel,
  drawInset,
  drawLegend,
  drawSceneLabel,
  wrapText,
  setupCrispCanvas,
} from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 340;

/**
 * MoBA self-attention mask, exactly as in the paper's Figure 4.
 * Nine tokens in THREE groups (3 frames each):
 *   cols/rows 0-2 : clean frames        x_0  x_1  x_2
 *   cols/rows 3-5 : noisy, AR branch    x_0^t x_1^t x_2^t
 *   cols/rows 6-8 : noisy, BID branch   x_0^t x_1^t x_2^t
 */
const N = 9;
const CELL = 28;
const GX = 132;
const GY = 52;
const G1 = 3;
const G2 = 6;

const LABELS = ['x₀', 'x₁', 'x₂', 'x₀ᵗ', 'x₁ᵗ', 'x₂ᵗ', 'x₀ᵗ', 'x₁ᵗ', 'x₂ᵗ'];
const SUB = '₀₁₂';

type MaskMode = 'tf' | 'bidir' | 'moba';

const MODE_LABEL: Record<MaskMode, string> = {
  tf: '纯 Teacher Forcing',
  bidir: '纯双向',
  moba: 'MoBA（本文）',
};

function grp(k: number): 0 | 1 | 2 {
  if (k < G1) return 0;
  if (k < G2) return 1;
  return 2;
}
function fidx(k: number): number {
  return k % 3;
}
function tag(k: number): string {
  return ['干净帧', '加噪·自回归', '加噪·双向'][grp(k)];
}

function mobaVisible(i: number, j: number): boolean {
  const gi = grp(i);
  if (gi === 0) return grp(j) === 0 && j <= i;
  if (gi === 1) {
    if (j === i) return true;
    return grp(j) === 0 && j < fidx(i);
  }
  return grp(j) === 2;
}

function visibleFor(mode: MaskMode, i: number, j: number): boolean {
  if (mode === 'moba') return mobaVisible(i, j);
  if (mode === 'tf') {
    if (grp(i) === 2 || grp(j) === 2) return false;
    return mobaVisible(i, j);
  }
  return true;
}

function cellColor(mode: MaskMode, i: number, j: number): string | null {
  if (!visibleFor(mode, i, j)) return null;
  if (mode === 'bidir') return j > i ? PAL.red : PAL.blue;
  if (grp(i) === 2 && grp(j) === 2) return PAL.green;
  return PAL.blue;
}

/** Why is cell (i, j) on or off? This is the teaching payload. */
function cellReason(mode: MaskMode, i: number, j: number): string {
  const gi = grp(i);
  const gj = grp(j);
  const fi = fidx(i);
  const fj = fidx(j);
  if (mode === 'bidir') {
    return j > i
      ? '纯双向下这一格也亮，但它在对角线右侧——等于看了未来，推理时不存在。'
      : '纯双向下整张全亮，这一格自然可见。';
  }
  if (mode === 'tf') {
    if (gi === 2 || gj === 2) return '纯 Teacher Forcing 没有双向分支，这一整块不存在。';
  }
  if (gi === 0) {
    if (gj !== 0) return '干净帧完全不看任何加噪帧——它们是已确定的上下文，不参与去噪。';
    return j <= i
      ? `干净帧之间走下三角：x${SUB[fi]} 可以看 x${SUB[fj]}（不晚于自己）。`
      : `x${SUB[fj]} 在 x${SUB[fi]} 之后，是未来，不可见。`;
  }
  if (gi === 1) {
    if (j === i) return `加噪帧必须看自己：这是对角格，x${SUB[fi]}ᵗ 要在自身上做去噪。`;
    if (gj === 1) return '自回归加噪帧之间互不可见——每一帧只依赖干净上下文，不依赖别的加噪帧。';
    if (gj === 2) return '自回归分支不看双向分支，两块是独立的分量。';
    if (fj < fi) return `x${SUB[fj]} 严格早于第 ${fi} 帧，属于「之前的干净上下文」，可见。`;
    if (fi === 0)
      return `x${SUB[fi]}ᵗ 是第一帧，它前面没有任何干净上下文，所以整行只剩对角那一格。`;
    return `x${SUB[fj]} 不早于第 ${fi} 帧，不属于「之前的干净上下文」，不可见。`;
  }
  if (gj === 2) return '右下角双向块内部前后全可见——这块是额外追加的正则项。';
  return '双向分支既不看干净帧、也不看自回归分支，它只在自己块内互看。';
}

interface Cell {
  i: number;
  j: number;
}

function rowSpeakOf(m: MaskMode, r: number): { text: string; cls: string } {
  const g = grp(r);
  const f = fidx(r);
  if (m === 'bidir') {
    return {
      text: `纯双向：第 ${r + 1} 行整行都亮，连它右边的列也能看到——那是未来，推理时还不存在，没法逐步生成。`,
      cls: 'bad',
    };
  }
  if (m === 'tf') {
    if (g === 2) {
      return {
        text: '纯 Teacher Forcing 下没有双向分支，这三行整行为空。论文观察到：只有 Teacher Forcing 时上下文越长，模型越只依赖上下文、不去预测未来，于是过拟合、画质退化。',
        cls: 'bad',
      };
    }
    return { text: '纯 Teacher Forcing：合法但会退化——把鼠标移到任意一格看它为什么亮或不亮。', cls: 'bad' };
  }
  if (g === 0) {
    return {
      text: `干净帧 x${SUB[f]}：在干净帧之间是下三角，看 x₀…x${SUB[f]}；<b>完全不看任何加噪帧</b>。`,
      cls: '',
    };
  }
  if (g === 1) {
    return {
      text: `自回归加噪帧 x${SUB[f]}ᵗ：只看<b>自己</b>${
        f === 0
          ? '——它前面没有干净上下文，所以整行只有对角那一格'
          : `，加上严格在它之前的干净上下文 x₀…x${SUB[f - 1]}`
      }。注意它<b>不看其它加噪帧</b>。`,
      cls: '',
    };
  }
  return {
    text: `双向加噪帧 x${SUB[f]}ᵗ（右下角那一块）：在<b>本块内部前后全可见</b>，但完全不看干净帧、也不看自回归分支。这块是额外追加的正则项。`,
    cls: 'good',
  };
}

function cellSpeakOf(m: MaskMode, c: Cell): { text: string; cls: string } {
  const vis = visibleFor(m, c.i, c.j);
  return {
    text: `<b>行 ${LABELS[c.i]}（${tag(c.i)}） → 列 ${LABELS[c.j]}（${tag(c.j)}）：${
      vis ? '可见' : '不可见'
    }</b>　${cellReason(m, c.i, c.j)}`,
    cls: vis ? (grp(c.i) === 2 && grp(c.j) === 2 ? 'good' : '') : 'bad',
  };
}

export const Ch4M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: MaskMode; row: number; pin: Cell | null; hover: Cell | null }>({
    mode: 'moba',
    row: 5,
    pin: null,
    hover: null,
  });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<MaskMode>('moba');
  const [row, setRow] = useState(5);
  const [feedback, setFeedback] = useState({ text: '', cls: '' });

  const rowSpeak = (m: MaskMode, r: number) => rowSpeakOf(m, r);
  const cellSpeak = (m: MaskMode, c: Cell) => cellSpeakOf(m, c);

  useEffect(() => {
    setFeedback(rowSpeak('moba', 5));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let detachCrisp: () => void;
    try {
      const crisp = setupCrispCanvas(canvas, W, H);
      ctx = crisp.ctx;
      detachCrisp = crisp.detach;
    } catch {
      return;
    }

    const render = (s: typeof stateRef.current, time: number) => {
      clearPanel(ctx, W, H);
      const focus = s.pin ?? s.hover;

      // selected row band
      ctx.fillStyle = 'rgba(217,119,6,0.16)';
      ctx.fillRect(GX - 4, GY + s.row * CELL - 1, N * CELL + 8, CELL + 2);
      ctx.fillStyle = PAL.orange;
      ctx.fillRect(GX - 9, GY + s.row * CELL + 2, 3, CELL - 4);

      // crosshair for the focused cell: makes row/col pairing readable
      if (focus) {
        ctx.fillStyle = 'rgba(39,68,110,0.10)';
        ctx.fillRect(GX + focus.j * CELL - 1, GY, CELL + 1, N * CELL);
        ctx.fillRect(GX, GY + focus.i * CELL - 1, N * CELL, CELL + 1);
      }

      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const x = GX + j * CELL;
          const y = GY + i * CELL;
          ctx.fillStyle = PAL.paper;
          ctx.strokeStyle = PAL.axis;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.rect(x, y, CELL - 1, CELL - 1);
          ctx.fill();
          ctx.stroke();
          const c = cellColor(s.mode, i, j);
          if (c) {
            ctx.fillStyle = c;
            ctx.globalAlpha = 0.72;
            ctx.fillRect(x + 1, y + 1, CELL - 3, CELL - 3);
            ctx.globalAlpha = 1;
          }
        }
      }

      // group separators
      ctx.strokeStyle = PAL.muted;
      ctx.lineWidth = 1.6;
      for (const k of [G1, G2]) {
        ctx.beginPath();
        ctx.moveTo(GX + k * CELL - 0.5, GY);
        ctx.lineTo(GX + k * CELL - 0.5, GY + N * CELL);
        ctx.moveTo(GX, GY + k * CELL - 0.5);
        ctx.lineTo(GX + N * CELL, GY + k * CELL - 0.5);
        ctx.stroke();
      }

      if (s.mode === 'moba') {
        ctx.strokeStyle = PAL.green;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(GX + G2 * CELL, GY + G2 * CELL, 3 * CELL - 1, 3 * CELL - 1);
        ctx.stroke();
      }

      // focused cell ring: pinned is solid, hover is dashed and pulses
      if (focus) {
        const fx = GX + focus.j * CELL;
        const fy = GY + focus.i * CELL;
        ctx.save();
        if (s.pin) {
          ctx.strokeStyle = PAL.orange;
          ctx.lineWidth = 2.5;
        } else {
          const pulse = 0.55 + 0.45 * Math.abs(Math.sin(time / 420));
          ctx.strokeStyle = PAL.orange;
          ctx.globalAlpha = pulse;
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 2]);
        }
        ctx.beginPath();
        ctx.rect(fx - 1, fy - 1, CELL + 1, CELL + 1);
        ctx.stroke();
        ctx.restore();
      }

      // row labels
      for (let i = 0; i < N; i++) {
        const sel = i === s.row;
        const inFocus = focus && focus.i === i;
        ctx.fillStyle = inFocus ? PAL.orange : sel ? PAL.ink : PAL.muted;
        ctx.font = inFocus || sel ? '600 14px "Segoe UI", sans-serif' : '13px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(LABELS[i], GX - 14, GY + i * CELL + CELL / 2 + 5);
        ctx.textAlign = 'left';
      }
      // column labels
      for (let j = 0; j < N; j++) {
        const inFocus = focus && focus.j === j;
        const vis = visibleFor(s.mode, s.row, j);
        ctx.fillStyle = inFocus ? PAL.orange : vis ? PAL.ink : PAL.muted;
        ctx.font = inFocus || vis ? '600 13px "Segoe UI", sans-serif' : '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(LABELS[j], GX + j * CELL + CELL / 2, GY - 10);
        ctx.textAlign = 'left';
      }

      // group captions
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = PAL.muted;
      ctx.fillText('干净帧', GX + 1.5 * CELL, GY + N * CELL + 22);
      ctx.fillStyle = PAL.blue;
      ctx.fillText('加噪 · 自回归', GX + 4.5 * CELL, GY + N * CELL + 22);
      ctx.fillStyle = PAL.green;
      ctx.fillText('加噪 · 双向', GX + 7.5 * CELL, GY + N * CELL + 22);
      ctx.textAlign = 'left';

      // inset: focused cell detail, else the row summary
      drawInset(ctx, 400, 52, 300, 252, focus ? '这一格为什么这样' : '这一行能注意到谁');
      let ty = 92;
      ctx.font = '14px "Segoe UI", sans-serif';
      if (focus) {
        const vis = visibleFor(s.mode, focus.i, focus.j);
        ctx.fillStyle = PAL.ink;
        ctx.fillText(`${LABELS[focus.i]} → ${LABELS[focus.j]}`, 414, ty);
        ctx.fillStyle = vis ? PAL.green : PAL.red;
        ctx.font = '600 14px "Segoe UI", sans-serif';
        ctx.fillText(vis ? '可见' : '不可见', 560, ty);
        ty += 28;
        ctx.fillStyle = PAL.ink;
        ctx.font = '13px "Segoe UI", sans-serif';
        ty = wrapText(ctx, cellReason(s.mode, focus.i, focus.j), 414, ty, 274, 19);
        ty += 12;
        ctx.fillStyle = PAL.muted;
        ctx.font = '12px "Segoe UI", sans-serif';
        wrapText(ctx, s.pin ? '已固定，点同一格取消' : '移开鼠标恢复行视图', 414, ty, 274, 17);
      } else {
        const g = grp(s.row);
        ctx.fillStyle = PAL.ink;
        ctx.fillText(`第 ${s.row + 1} 行：${LABELS[s.row]}（${tag(s.row)}）`, 414, ty);
        ty += 28;
        const vis: string[] = [];
        for (let j = 0; j < N; j++) if (visibleFor(s.mode, s.row, j)) vis.push(LABELS[j]);
        ctx.fillStyle = g === 2 && s.mode === 'moba' ? PAL.green : PAL.blue;
        ctx.font = '600 14px "Segoe UI", sans-serif';
        ty = wrapText(ctx, vis.length ? `可见：${vis.join('  ')}` : '可见：（整行为空）', 414, ty, 274, 20);
        ty += 10;
        ctx.fillStyle = PAL.muted;
        ctx.font = '13px "Segoe UI", sans-serif';
        ty = wrapText(
          ctx,
          s.mode === 'moba'
            ? g === 0
              ? '干净帧之间下三角；不看任何加噪帧。'
              : g === 1
              ? '只看自己 + 严格在前的干净上下文。'
              : '块内前后全可见；不看其它两组。'
            : s.mode === 'tf'
            ? '没有双向分支，右下角三行三列全空。'
            : '整张全亮：包含未来，无法逐步生成。',
          414,
          ty,
          274,
          19
        );
        ty += 10;
        ctx.fillStyle = PAL.orange;
        ctx.font = '12px "Segoe UI", sans-serif';
        wrapText(ctx, '把鼠标移到任意一格，看它为什么亮或不亮', 414, ty, 274, 17);
      }

      drawSceneLabel(ctx, 34, 30, MODE_LABEL[s.mode]);
      drawLegend(ctx, 400, 322, [
        { color: PAL.blue, label: '因果可见' },
        { color: PAL.green, label: '双向块' },
        { color: PAL.red, label: '看到未来' },
      ]);
    };

    // Hover lives in stateRef so the canvas can repaint every frame; mirror the
    // focused cell into React state too, so the feedback bar explains whatever
    // the pointer is currently over.
    let lastKey = '';
    const tick = (t: number) => {
      const st = stateRef.current;
      render(st, t);
      const focus = st.pin ?? st.hover;
      const key = focus ? `c${st.mode}:${focus.i},${focus.j}` : `r${st.mode}:${st.row}`;
      if (key !== lastKey) {
        lastKey = key;
        setFeedback(focus ? cellSpeakOf(st.mode, focus) : rowSpeakOf(st.mode, st.row));
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      detachCrisp();
    };
  }, []);

  const selectMode = (m: MaskMode) => {
    stateRef.current.mode = m;
    setMode(m);
    const pin = stateRef.current.pin;
    setFeedback(pin ? cellSpeak(m, pin) : rowSpeak(m, stateRef.current.row));
  };
  const selectRow = (r: number) => {
    const v = Math.max(0, Math.min(N - 1, r));
    stateRef.current.row = v;
    stateRef.current.pin = null;
    setRow(v);
    setFeedback(rowSpeak(stateRef.current.mode, v));
  };

  /** Map a pointer event to a grid cell, or null when outside. */
  const cellAt = (clientX: number, clientY: number): Cell | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    const j = Math.floor((x - GX) / CELL);
    const i = Math.floor((y - GY) / CELL);
    if (i < 0 || i >= N || j < 0 || j >= N) return null;
    return { i, j };
  };

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    stateRef.current.hover = cellAt(e.clientX, e.clientY);
  };
  const onLeave = () => {
    stateRef.current.hover = null;
  };
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = cellAt(e.clientX, e.clientY);
    if (c) {
      const p = stateRef.current.pin;
      if (p && p.i === c.i && p.j === c.j) {
        stateRef.current.pin = null;
        setFeedback(rowSpeak(stateRef.current.mode, stateRef.current.row));
        return;
      }
      stateRef.current.pin = c;
      stateRef.current.row = c.i;
      setRow(c.i);
      setFeedback(cellSpeak(stateRef.current.mode, c));
      return;
    }
    // clicked the label gutter: select just the row
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const r = Math.floor((y - GY) / CELL);
    if (r >= 0 && r < N) selectRow(r);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'crosshair' }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
      />
      <div className="chip-row">
        {(['tf', 'bidir', 'moba'] as MaskMode[]).map((m) => (
          <button
            key={m}
            className={`chip${mode === m ? ' selected' : ''}`}
            onClick={() => selectMode(m)}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => selectRow(row - 1)} disabled={row === 0}>
          上一行
        </button>
        <span className="step-label">
          当前行 <b>{LABELS[row]}</b>（{row + 1} / {N}）
        </span>
        <button
          className="tiny ghost"
          onClick={() => selectRow(row + 1)}
          disabled={row === N - 1}
        >
          下一行
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default Ch4M1;
