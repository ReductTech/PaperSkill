import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { ZoomImg } from './zoom-img';

// Module 6.3 — REAL paper figures with two viewing modes.
//  * Figure 14 (appendix, page 20): unconditional CIFAR10 progressive generation,
//    20 time columns × 20 sample rows. (Main-text Figure 6 on page 7 is the 4-row
//    version; its caption points to the appendix for extended samples.)
//  * Figure 7 (page 7): CelebA-HQ samples sharing intermediate latents.
// Mode "grid": full grid + time-column cursor + click-to-zoom (original view).
// Mode "single": pick one sample row and view its 20 time cells enlarged — the crops
// are taken from the SAME original raster via CSS background-position with
// nearest-neighbour scaling (image-rendering: pixelated). No upscaling model, no
// synthetic detail. The paper does not label the t value of each column, so we label
// columns only ("第 k 列 / 20") and never invent t values.

const COLS = 20;
const ROWS = 20;
const IMG_W = 678;
const CELL = 32;
const PITCH = 34;

function colLeftPct(c: number): number {
  return ((PITCH * c) / IMG_W) * 100;
}

function colWidthPct(): number {
  return (CELL / IMG_W) * 100;
}

function cropStyle(row: number, col: number, size: number): React.CSSProperties {
  const scale = size / CELL;
  return {
    backgroundImage: 'url(./images/fig6-progressive.jpg)',
    backgroundSize: `${IMG_W * scale}px ${IMG_W * scale}px`,
    backgroundPosition: `-${PITCH * col * scale}px -${PITCH * row * scale}px`,
  };
}

export const Ch6Real: React.FC<WidgetProps> = ({ chapterId }) => {
  const [mode, setMode] = useState<'grid' | 'single'>('grid');
  const [col, setCol] = useState(COLS - 1);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [row, setRow] = useState(0);
  const [step, setStep] = useState(0);
  const timerRef = useRef<number | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      setCol((c) => (c + 1) % COLS);
    }, 420);
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playing]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  // Auto-scroll the strip to the active cell when the step changes.
  useEffect(() => {
    if (mode !== 'single') return;
    const strip = stripRef.current;
    if (!strip) return;
    const cell = strip.querySelector<HTMLElement>(`[data-cell="${step}"]`);
    if (!cell) return;
    const target = cell.offsetLeft - strip.clientWidth / 2 + cell.clientWidth / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [step, mode]);

  const left = colLeftPct(col);
  const width = colWidthPct();

  return (
    <div key={`${chapterId}-ch6real`}>
      <div className="chip-row">
        <button
          type="button"
          className={`chip ${mode === 'grid' ? 'selected' : ''}`}
          onClick={() => { setPlaying(false); setMode('grid'); }}
        >
          完整网格（原图）
        </button>
        <button
          type="button"
          className={`chip ${mode === 'single' ? 'selected' : ''}`}
          onClick={() => { setPlaying(false); setMode('single'); }}
        >
          单样本放大（逐阶段）
        </button>
      </div>

      {mode === 'grid' ? (
        <>
          <div
            className="fig6-stage"
            role="img"
            aria-label="论文 Figure 14：CIFAR10 渐进生成网格"
            title="点击放大查看"
            onClick={() => setZoom(true)}
          >
            <img src="./images/fig6-progressive.jpg" alt="原论文 Figure 14 CIFAR10 渐进生成网格" />
            <div className="fig6-dim" style={{ left: 0, width: `${left}%` }} />
            <div className="fig6-dim" style={{ left: `${left + width}%`, right: 0 }} />
            <div className="fig6-window" style={{ left: `${left}%`, width: `${width}%` }} />
          </div>
          <div className="fig6-caption">
            来源：原论文 <b>Figure 14</b>（附录第 20 页；正文 Figure 6 为其 4 行小版本，原图注说明附录为「extended samples」扩展展示）。
            图像自 PDF 提取、保持原始像素尺寸（678×678）。纵向 20 行 = 20 个不同样本；横向 20 列 = 时间推进方向。
            <b>图中每一格是对最终样本 x̂₀ 的预测</b>（原图注：x̂₀ over time），而不是中间采样状态 x_t 本身；越靠右，对 x̂₀ 的预测越清晰。
            因原图未标注每列对应的具体 t 值，本页面不做推测。
          </div>
          <div className="ctrl">
            <label>
              时间列 <span className="val">{col + 1} / {COLS}</span>
            </label>
            <input
              type="range"
              min={0}
              max={COLS - 1}
              value={col}
              onChange={(e) => {
                setPlaying(false);
                setCol(Number(e.target.value));
              }}
            />
          </div>
          <div className="step-ctrl">
            <button type="button" className="tiny ghost" onClick={() => { setPlaying(false); setCol((c) => Math.max(0, c - 1)); }} disabled={col === 0}>
              ← 前一列
            </button>
            <button type="button" className="tiny" onClick={() => { setPlaying(false); setCol((c) => Math.min(COLS - 1, c + 1)); }} disabled={col === COLS - 1}>
              后一列 →
            </button>
            <button type="button" className="tiny ghost" onClick={() => setPlaying((p) => !p)}>
              {playing ? '暂停播放' : '自动播放'}
            </button>
            <button type="button" className="tiny ghost" onClick={() => { setPlaying(false); setCol(COLS - 1); }}>
              回到最终列
            </button>
          </div>
          <div className="feedback">
            {col === COLS - 1
              ? '最后一列：对 x̂₀ 的最终预测（近似生成结果）—— 对应论文 §4.3「大尺度特征先出现，细节最后出现」。'
              : col <= 2
                ? '最早阶段：对最终样本 x̂₀ 的预测仍包含大量噪声与不确定结构；该图展示的是生成过程中的预测，不是 x_T 本身。'
                : '继续向右：对 x̂₀ 的预测逐步确定 —— 轮廓先固定、细节随后补齐（论文 §4.3）。'}
          </div>
        </>
      ) : (
        <>
          <div className="ctrl">
            <label>
              样本行 <span className="val">{row + 1} / {ROWS}</span>
            </label>
            <input
              type="range"
              min={0}
              max={ROWS - 1}
              value={row}
              onChange={(e) => setRow(Number(e.target.value))}
            />
          </div>
          <div className="step-ctrl">
            <button type="button" className="tiny ghost" onClick={() => setRow((r) => Math.max(0, r - 1))} disabled={row === 0}>
              上一样本
            </button>
            <button type="button" className="tiny" onClick={() => setRow((r) => Math.min(ROWS - 1, r + 1))} disabled={row === ROWS - 1}>
              下一样本
            </button>
          </div>
          <div className="fig14-preview" style={cropStyle(row, step, 224)} role="img" aria-label={`第 ${row + 1} 行样本、第 ${step + 1} 列`} />
          <div className="source-note" style={{ textAlign: 'center' }}>
            当前：第 <b>{row + 1}</b> 行样本 × 第 <b>{step + 1}</b> / {COLS} 列（对 x̂₀ 的预测随时间推进）。
            裁剪自同一张原论文 Figure 14，最近邻放大（不生成新细节）；原图未标注每列对应的 t 值。
          </div>
          <div className="ctrl">
            <label>
              阶段（列） <span className="val">{step + 1} / {COLS}</span>
            </label>
            <input
              type="range"
              min={0}
              max={COLS - 1}
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
            />
          </div>
          <div className="fig14-strip" ref={stripRef} aria-label="该样本的 20 个时间阶段（点击选择）">
            {Array.from({ length: COLS }, (_v, c) => (
              <button
                key={c}
                type="button"
                data-cell={c}
                className={`fig14-cell ${c === step ? 'active' : ''}`}
                style={cropStyle(row, c, 88)}
                aria-label={`第 ${c + 1} 列`}
                title={`第 ${c + 1} 列（时间推进方向）`}
                onClick={() => setStep(c)}
              />
            ))}
          </div>
          <div className="feedback">
            {step === COLS - 1
              ? '最后一列：该样本 x̂₀ 的最终预测（近似生成结果）。'
              : step <= 1
                ? '最早阶段：对 x̂₀ 的预测仍以噪声为主、结构不确定（该图展示预测 x̂₀，而非 x_T 或 x_t 本身）。'
                : '沿横向向右：该样本的 x̂₀ 预测逐步确定（论文 §4.3）。'}
          </div>
        </>
      )}

      <figure className="fig-embed">
        <ZoomImg
          src="./images/fig7-share-latent.jpg"
          alt="原论文 Figure 7 CelebA-HQ 共享潜变量的采样"
          caption="原论文 Figure 7（CelebA-HQ 256×256）：链条在共享的中间潜变量 xₜ 处拆分，越晚拆分结果越相似。"
        />
        <figcaption>
          来源：原论文 Figure 7（CelebA-HQ 256×256；自 PDF 提取并缩放至 2000px 宽，内容未修改）。
          链条在共享的中间潜变量 xₜ 处拆分：越晚拆分（共享的 xₜ 越接近 x₀，图中从左到右），多次采样结果越相似 ——
          说明中间潜变量已经编码了姿态、发型、墨镜等高层属性（论文 Appendix D）。这也说明反向采样本身是随机的（Langevin 式噪声 σₜ·z）。
        </figcaption>
      </figure>

      {zoom ? (
        <div className="zoom-overlay" role="dialog" aria-modal="true" onClick={() => setZoom(false)}>
          <img src="./images/fig6-progressive.jpg" alt="原论文 Figure 14 CIFAR10 渐进生成网格（放大）" />
          <div className="zoom-caption">
            原论文 Figure 14（附录）：20 行样本 × 20 列时间；点击任意处或按 Esc 关闭。
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Ch6Real;
