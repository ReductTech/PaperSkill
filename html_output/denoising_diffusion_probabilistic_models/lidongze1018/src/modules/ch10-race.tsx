import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearField, sceneLabel } from './ddpm-common';
import { ZoomImg } from './zoom-img';

// Module 10.1 — CIFAR10 sample-quality comparison, built on the FULL transcription of
// the paper's Table 1. The animated race shows a 5-row subset; the table below is the
// exact transcription (values only, from the respective papers as compiled by Table 1);
// the disclosure text makes the "different compute budgets" caveat explicit.

const W = 1080;
const H = 280;

const GREEN = '#228d5c';
const BLUE = '#27446e';
const MUTED = '#68778f';
const AXIS = '#d7deea';
const TEXT = '#21324a';

type Metric = 'fid' | 'is';

const ROWS: Array<{ name: string; fid: number; isScore: number }> = [
  { name: 'StyleGAN2+ADA', fid: 3.26, isScore: 9.74 },
  { name: '本文 L_simple', fid: 3.17, isScore: 9.46 },
  { name: '本文 L（完整目标）', fid: 13.51, isScore: 7.67 },
  { name: 'NCSN', fid: 25.32, isScore: 8.87 },
  { name: 'SNGAN', fid: 21.7, isScore: 8.22 },
];

const TABLE1: Array<{
  group?: string;
  model?: string;
  is?: string;
  fid?: string;
  nll?: string;
  ours?: boolean;
}> = [
  { group: '有条件（Conditional）' },
  { model: 'EBM [11]', is: '8.30', fid: '37.9', nll: '—' },
  { model: 'JEM [17]', is: '8.76', fid: '38.4', nll: '—' },
  { model: 'BigGAN [3]', is: '9.22', fid: '14.73', nll: '—' },
  { model: 'StyleGAN2 + ADA (v1) [29]', is: '10.06', fid: '2.67', nll: '—' },
  { group: '无条件（Unconditional）' },
  { model: 'Diffusion (original) [53]', is: '—', fid: '—', nll: '≤ 5.40' },
  { model: 'Gated PixelCNN [59]', is: '4.60', fid: '65.93', nll: '3.03 (2.90)' },
  { model: 'Sparse Transformer [7]', is: '—', fid: '—', nll: '2.80' },
  { model: 'PixelIQN [43]', is: '5.29', fid: '49.46', nll: '—' },
  { model: 'EBM [11]', is: '6.78', fid: '38.2', nll: '—' },
  { model: 'NCSNv2 [56]', is: '—', fid: '31.75', nll: '—' },
  { model: 'NCSN [55]', is: '8.87±0.12', fid: '25.32', nll: '—' },
  { model: 'SNGAN [39]', is: '8.22±0.05', fid: '21.7', nll: '—' },
  { model: 'SNGAN-DDLS [4]', is: '9.09±0.10', fid: '15.42', nll: '—' },
  { model: 'StyleGAN2 + ADA (v1) [29]', is: '9.74±0.05', fid: '3.26', nll: '—' },
  { model: '本文（L，固定各向同性 Σ）', is: '7.67±0.13', fid: '13.51', nll: '≤ 3.70 (3.69)', ours: true },
  { model: '本文（L_simple）', is: '9.46±0.11', fid: '3.17', nll: '≤ 3.75 (3.72)', ours: true },
];

const FID_MAX = 25.32;
const IS_MAX = 9.74;
const DUR = 1600;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function metricFeedback(m: Metric): { text: string; cls: string } {
  if (m === 'fid') {
    return { text: 'FID 越低越好：本文 3.17 优于无条件 StyleGAN2+ADA 的 3.26（注：有条件版 StyleGAN2+ADA 为 2.67，见下表）。', cls: '' };
  }
  return { text: 'IS 越高越好：本文 9.46，接近无条件 StyleGAN2+ADA 的 9.74。', cls: '' };
}

function bestIndex(metric: Metric): number {
  let best = 0;
  ROWS.forEach((r, i) => {
    if (metric === 'fid' ? r.fid < ROWS[best].fid : r.isScore > ROWS[best].isScore) best = i;
  });
  return best;
}

export const Ch10Race: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ metric: Metric; p: number; start: number; running: boolean; done: boolean }>({
    metric: 'fid',
    p: 0,
    start: 0,
    running: false,
    done: false,
  });
  const rafRef = useRef<number | null>(null);
  const [metric, setMetric] = useState<Metric>('fid');
  const [running, setRunning] = useState(false);
  const [feedback, setFeedback] = useState(metricFeedback('fid'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { metric: Metric; p: number }): void => {
      clearField(ctx, W, H);
      const isFid = s.metric === 'fid';
      const x0 = 240;
      const barMaxW = 700;
      const top = 58;
      const rowH = 40;
      const best = bestIndex(s.metric);

      sceneLabel(ctx, isFid ? 'FID（越低越好，条越长越优）' : 'IS（越高越好，条越长越优）', 30, 30, { size: 17 });
      sceneLabel(ctx, '节选 5 行用于动画；完整 Table 1 见下方表格', 30, 52, { size: 13, color: '#8b97ab' });

      ROWS.forEach((r, i) => {
        const y = top + i * rowH;
        const targetLen = isFid ? clamp(1 - r.fid / FID_MAX, 0, 1) : clamp(r.isScore / IS_MAX, 0, 1);
        const rowP = clamp((s.p - i * 0.05) / 0.8, 0, 1);
        const len = barMaxW * targetLen * easeOut(rowP);
        const isOurs = r.name.indexOf('本文') === 0;
        const isBest = i === best;

        ctx.fillStyle = isBest ? GREEN : isOurs ? BLUE : MUTED;
        ctx.font = '700 17px "Segoe UI","PingFang SC",sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(r.name, x0 - 14, y + 22);

        ctx.fillStyle = '#eef1f6';
        ctx.fillRect(x0, y + 2, barMaxW, 26);
        ctx.fillStyle = isBest ? GREEN : isOurs ? BLUE : '#9fb0c9';
        ctx.fillRect(x0, y + 2, len, 26);

        ctx.fillStyle = TEXT;
        ctx.textAlign = 'left';
        ctx.fillText(isFid ? r.fid.toFixed(2) : r.isScore.toFixed(2), x0 + barMaxW + 12, y + 22);
      });

      ctx.textAlign = 'left';
      let lx = 30;
      ctx.font = '15px "Segoe UI","PingFang SC",sans-serif';
      [
        { color: GREEN, text: '该指标最优' },
        { color: BLUE, text: '本文' },
      ].forEach((it) => {
        ctx.fillStyle = it.color;
        ctx.fillRect(lx, H - 31, 14, 14);
        ctx.fillStyle = MUTED;
        ctx.fillText(it.text, lx + 20, H - 20);
        lx += 20 + ctx.measureText(it.text).width + 26;
      });
    };

    const tick = () => {
      const s = stateRef.current;
      if (s.running) {
        s.p = clamp((performance.now() - s.start) / DUR, 0, 1);
        if (s.p >= 1 && !s.done) {
          s.done = true;
          s.running = false;
          setRunning(false);
          setFeedback({ text: '结论：无条件 CIFAR10 上达到当时（2020）SOTA 水平，FID 3.17 / IS 9.46。', cls: 'good' });
        }
      }
      render(s);
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
    };
  }, []);

  const onStart = () => {
    const s = stateRef.current;
    s.metric = metric;
    s.p = 0;
    s.start = performance.now();
    s.running = true;
    s.done = false;
    setRunning(true);
    setFeedback(metricFeedback(metric));
  };

  const selectMetric = (m: Metric) => {
    const s = stateRef.current;
    s.metric = m;
    s.p = 0;
    s.running = false;
    s.done = false;
    setMetric(m);
    setRunning(false);
    setFeedback(metricFeedback(m));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button type="button" className={`chip ${metric === 'fid' ? 'selected' : ''}`} onClick={() => selectMetric('fid')}>
          FID（越低越好）
        </button>
        <button type="button" className={`chip ${metric === 'is' ? 'selected' : ''}`} onClick={() => selectMetric('is')}>
          IS（越高越好）
        </button>
      </div>
      <div className="step-ctrl">
        <button className="tiny" type="button" onClick={onStart} disabled={running}>
          {running ? '比较中…' : '开始比较'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>

      <table className="paper table1-table">
        <thead>
          <tr>
            <th>模型（论文 Table 1 逐值转写）</th>
            <th>IS ↑</th>
            <th>FID ↓</th>
            <th>NLL（bits/dim，测试 (训练)）</th>
          </tr>
        </thead>
        <tbody>
          {TABLE1.map((row, i) =>
            row.group ? (
              <tr key={`g-${i}`} className="group-row">
                <td colSpan={4}>{row.group}</td>
              </tr>
            ) : (
              <tr key={`r-${i}`} className={row.ours ? 'row-active' : ''}>
                <td>{row.model}</td>
                <td>{row.is}</td>
                <td>{row.fid}</td>
                <td>{row.nll}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
      <div className="source-note">
        数据来源：论文 Table 1（对照模型数字来自各自论文的转引）。训练数据、模型规模与计算预算不尽相同，不能解读为同等预算下的直接对比。
        本文 FID 3.17 为相对训练集计算；相对测试集的 FID 为 5.24（论文 §4.1）。
      </div>

      <figure className="fig-embed fig-pair">
        <ZoomImg
          src="./images/fig1-celeba-hq.jpg"
          alt="原论文 Figure 1 左：CelebA-HQ 256×256 生成样本"
          caption="原论文 Figure 1（左）：CelebA-HQ 256×256 生成样本。"
        />
        <ZoomImg
          src="./images/fig1-cifar10.jpg"
          alt="原论文 Figure 1 右：无条件 CIFAR10 生成样本"
          caption="原论文 Figure 1（右）：无条件 CIFAR10 生成样本（该样本网格亦是附录 Figure 13 的内容）。"
        />
        <figcaption>
          来源：原论文 Figure 1（左：CelebA-HQ 256×256；右：无条件 CIFAR10），自 PDF 提取的完整面板、内容未修改。
          这些是论文报告的真实模型输出 —— 与页面中的教学示意图性质不同。点击图片可放大查看。
        </figcaption>
      </figure>
    </div>
  );
};

export default Ch10Race;
