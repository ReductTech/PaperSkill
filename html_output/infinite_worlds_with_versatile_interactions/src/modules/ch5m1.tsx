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
 * MoBA cross-attention mask, exactly as in the paper's Figure 4.
 * Rows: 9 frame tokens in three groups of three.
 *   0-2 clean frames        x_0  x_1  x_2
 *   3-5 noisy, AR branch    x_0^t x_1^t x_2^t
 *   6-8 noisy, BID branch   x_0^t x_1^t x_2^t
 * Columns: a_G (global), a_B (background), a_0, a_1, a_2 (chunk prompts).
 */
const ROWS = 9;
const COLS = 5;
const CELL_H = 30;
const CELL_W = 62;
const GX = 150;
const GY = 52;
const G1 = 3;
const G2 = 6;

const ROW_LABELS = ['x₀', 'x₁', 'x₂', 'x₀ᵗ', 'x₁ᵗ', 'x₂ᵗ', 'x₀ᵗ', 'x₁ᵗ', 'x₂ᵗ'];
const COL_LABELS = ['a_G', 'a_B', 'a₀', 'a₁', 'a₂'];
const COL_C = { G: 0, B: 1, A0: 2 } as const;
const SUB = '₀₁₂';

function grp(k: number): 0 | 1 | 2 {
  if (k < G1) return 0;
  if (k < G2) return 1;
  return 2;
}
function fidx(k: number): number {
  return k % 3;
}

/** Row i may read prompt column j. */
function visible(i: number, j: number): boolean {
  if (grp(i) === 2) {
    // bidirectional branch reads ONLY the global prompt
    return j === COL_C.G;
  }
  // clean and AR-noisy rows: background prompt always, chunk prompts a_0..a_f
  if (j === COL_C.G) return false;
  if (j === COL_C.B) return true;
  return j - COL_C.A0 <= fidx(i);
}

/** Why is cell (i, j) on or off? This is the teaching payload. */
function cellReason(i: number, j: number): string {
  const g = grp(i);
  const f = fidx(i);
  if (g === 2) {
    return j === COL_C.G
      ? '双向分支已经能看到全部帧，所以只给它一条描述整段事件的全局提示词。'
      : '双向分支不读背景词、也不读任何分块词——逐块的局部语义对它没有意义。';
  }
  if (j === COL_C.G) return '全局提示词只给双向分支；前六行读它就等于提前知道整段会发生什么。';
  if (j === COL_C.B) return '背景提示词描述整段的底色场景，对干净帧与自回归帧始终可见。';
  const k = j - COL_C.A0;
  return k <= f
    ? `分块提示词 a${SUB[k]} 属于「当前及之前」，可见。`
    : `分块提示词 a${SUB[k]} 属于未来的块，读了就是语义泄漏，因此不可见。`;
}

interface Cell {
  i: number;
  j: number;
}

function speakOf(r: number): { text: string; cls: string } {
  const g = grp(r);
  const f = fidx(r);
  const sub = SUB[f];
  if (g === 2) {
    return {
      text: `双向帧组 x${sub}ᵗ：<b>只读一条全局提示词 a_G</b>。它已经能看到全部帧，所以按标准做法给它一条描述整段事件的全局描述，背景词与分块词一律不给。`,
      cls: 'good',
    };
  }
  return {
    text: `${g === 0 ? '干净帧' : '自回归加噪帧'} x${sub}${g === 1 ? 'ᵗ' : ''}：读<b>背景提示词 a_B</b>，加上 a₀…a${sub} 这些当前及之前的分块提示词。再往右一律看不到——这正是防止未来语义泄漏；同时它<b>不读全局提示词 a_G</b>。`,
    cls: '',
  };
}

function cellSpeakOf(c: Cell): { text: string; cls: string } {
  const vis = visible(c.i, c.j);
  const gtag = ['干净帧', '加噪·自回归', '加噪·双向'][grp(c.i)];
  return {
    text: `<b>行 ${ROW_LABELS[c.i]}（${gtag}） → 列 ${COL_LABELS[c.j]}：${
      vis ? '可读' : '不可读'
    }</b>　${cellReason(c.i, c.j)}`,
    cls: vis ? (grp(c.i) === 2 ? 'good' : '') : 'bad',
  };
}

export const Ch5M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ row: number; pin: Cell | null; hover: Cell | null }>({
    row: 5,
    pin: null,
    hover: null,
  });
  const rafRef = useRef<number | null>(null);
  const [row, setRow] = useState(5);
  const [feedback, setFeedback] = useState({ text: '', cls: '' });

  const speak = (r: number) => speakOf(r);
  const cellSpeak = (c: Cell) => cellSpeakOf(c);

  useEffect(() => {
    setFeedback(speak(5));
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
      ctx.fillRect(GX - 4, GY + s.row * CELL_H - 1, COLS * CELL_W + 8, CELL_H + 2);
      ctx.fillStyle = PAL.orange;
      ctx.fillRect(GX - 9, GY + s.row * CELL_H + 2, 3, CELL_H - 4);

      if (focus) {
        ctx.fillStyle = 'rgba(39,68,110,0.10)';
        ctx.fillRect(GX + focus.j * CELL_W - 1, GY, CELL_W + 1, ROWS * CELL_H);
        ctx.fillRect(GX, GY + focus.i * CELL_H - 1, COLS * CELL_W, CELL_H + 1);
      }

      for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
          const x = GX + j * CELL_W;
          const y = GY + i * CELL_H;
          ctx.fillStyle = PAL.paper;
          ctx.strokeStyle = PAL.axis;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.rect(x, y, CELL_W - 1, CELL_H - 1);
          ctx.fill();
          ctx.stroke();
          if (visible(i, j)) {
            ctx.fillStyle = grp(i) === 2 ? PAL.purple : PAL.blue;
            ctx.globalAlpha = 0.72;
            ctx.fillRect(x + 1, y + 1, CELL_W - 3, CELL_H - 3);
            ctx.globalAlpha = 1;
          }
        }
      }

      // group separators
      ctx.strokeStyle = PAL.muted;
      ctx.lineWidth = 1.6;
      for (const k of [G1, G2]) {
        ctx.beginPath();
        ctx.moveTo(GX, GY + k * CELL_H - 0.5);
        ctx.lineTo(GX + COLS * CELL_W, GY + k * CELL_H - 0.5);
        ctx.stroke();
      }
      // separator between a_G / a_B and the chunk prompts
      ctx.beginPath();
      ctx.moveTo(GX + 2 * CELL_W - 0.5, GY);
      ctx.lineTo(GX + 2 * CELL_W - 0.5, GY + ROWS * CELL_H);
      ctx.stroke();

      if (focus) {
        const fx = GX + focus.j * CELL_W;
        const fy = GY + focus.i * CELL_H;
        ctx.save();
        if (s.pin) {
          ctx.strokeStyle = PAL.orange;
          ctx.lineWidth = 2.5;
        } else {
          ctx.strokeStyle = PAL.orange;
          ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(time / 420));
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 2]);
        }
        ctx.beginPath();
        ctx.rect(fx - 1, fy - 1, CELL_W + 1, CELL_H + 1);
        ctx.stroke();
        ctx.restore();
      }

      // column labels, emphasised when visible for the selected row
      for (let j = 0; j < COLS; j++) {
        const vis = visible(s.row, j);
        ctx.fillStyle = vis ? PAL.ink : PAL.muted;
        ctx.font = vis ? '600 14px "Segoe UI", sans-serif' : '13px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(COL_LABELS[j], GX + j * CELL_W + CELL_W / 2 - 1, GY - 12);
        ctx.textAlign = 'left';
      }

      // row labels plus branch tags
      for (let i = 0; i < ROWS; i++) {
        const sel = i === s.row;
        ctx.fillStyle = sel ? PAL.ink : PAL.muted;
        ctx.font = sel ? '600 14px "Segoe UI", sans-serif' : '13px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(ROW_LABELS[i], GX - 14, GY + i * CELL_H + CELL_H / 2 + 5);
        ctx.textAlign = 'left';
      }
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = PAL.muted;
      ctx.fillText('干净帧', GX - 52, GY + 1.5 * CELL_H + 5);
      ctx.fillStyle = PAL.blue;
      ctx.fillText('自回归', GX - 52, GY + 4.5 * CELL_H + 5);
      ctx.fillStyle = PAL.purple;
      ctx.fillText('双向', GX - 52, GY + 7.5 * CELL_H + 5);
      ctx.textAlign = 'left';

      // detail inset
      drawInset(ctx, 476, 52, 224, 252, focus ? '这一格为什么' : '这一组读到的');
      let ty = 92;
      ctx.font = '14px "Segoe UI", sans-serif';
      if (focus) {
        const fvis = visible(focus.i, focus.j);
        ctx.fillStyle = PAL.ink;
        ctx.fillText(`${ROW_LABELS[focus.i]} → ${COL_LABELS[focus.j]}`, 490, ty);
        ty += 26;
        ctx.fillStyle = fvis ? PAL.green : PAL.red;
        ctx.font = '600 14px "Segoe UI", sans-serif';
        ctx.fillText(fvis ? '可读' : '不可读', 490, ty);
        ty += 26;
        ctx.fillStyle = PAL.ink;
        ctx.font = '13px "Segoe UI", sans-serif';
        wrapText(ctx, cellReason(focus.i, focus.j), 490, ty, 198, 19);
      } else {
        const vis: string[] = [];
        for (let j = 0; j < COLS; j++) if (visible(s.row, j)) vis.push(COL_LABELS[j]);
        ctx.fillStyle = grp(s.row) === 2 ? PAL.purple : PAL.blue;
        ctx.font = '600 14px "Segoe UI", sans-serif';
        ty = wrapText(ctx, vis.join('  '), 490, ty, 198, 20);
        ty += 12;
        ctx.fillStyle = PAL.ink;
        ctx.font = '13px "Segoe UI", sans-serif';
        ty = wrapText(
          ctx,
          grp(s.row) === 2
            ? '双向分支只读全局提示词。'
            : '背景词常亮，分块词按下三角只到当前块。',
          490,
          ty,
          198,
          19
        );
        ty += 10;
        ctx.fillStyle = PAL.orange;
        ctx.font = '12px "Segoe UI", sans-serif';
        wrapText(ctx, '鼠标移到任意一格看原因', 490, ty, 198, 17);
      }

      drawSceneLabel(ctx, 34, 30, '交叉注意力掩码');
      drawLegend(ctx, 476, 322, [
        { color: PAL.blue, label: '自回归可见' },
        { color: PAL.purple, label: '全局提示词' },
      ]);
    };

    // Mirror the focused cell into React state so the feedback bar tracks hover.
    let lastKey = '';
    const tick = (t: number) => {
      const st = stateRef.current;
      render(st, t);
      const focus = st.pin ?? st.hover;
      const key = focus ? `c${focus.i},${focus.j}` : `r${st.row}`;
      if (key !== lastKey) {
        lastKey = key;
        setFeedback(focus ? cellSpeakOf(focus) : speakOf(st.row));
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

  const select = (r: number) => {
    const v = Math.max(0, Math.min(ROWS - 1, r));
    stateRef.current.row = v;
    stateRef.current.pin = null;
    setRow(v);
    setFeedback(speak(v));
  };

  const cellAt = (clientX: number, clientY: number): Cell | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    const j = Math.floor((x - GX) / CELL_W);
    const i = Math.floor((y - GY) / CELL_H);
    if (i < 0 || i >= ROWS || j < 0 || j >= COLS) return null;
    return { i, j };
  };

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    stateRef.current.hover = cellAt(e.clientX, e.clientY);
  };
  const onLeave = () => {
    stateRef.current.hover = null;
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = cellAt(e.clientX, e.clientY);
    if (c) {
      const pinned = stateRef.current.pin;
      if (pinned && pinned.i === c.i && pinned.j === c.j) {
        stateRef.current.pin = null;
        setFeedback(speak(stateRef.current.row));
        return;
      }
      stateRef.current.pin = c;
      stateRef.current.row = c.i;
      setRow(c.i);
      setFeedback(cellSpeak(c));
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const r = Math.floor((y - GY) / CELL_H);
    if (r >= 0 && r < ROWS) select(r);
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
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        {ROW_LABELS.map((lab, i) => (
          <button
            key={`${lab}-${i}`}
            className={`chip${row === i ? ' selected' : ''}`}
            onClick={() => select(i)}
          >
            {lab}
            {i >= G2 ? '′' : ''}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} dangerouslySetInnerHTML={{ __html: feedback.text }} />
    </div>
  );
};

export default Ch5M1;
