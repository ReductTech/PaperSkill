import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearField, sceneLabel, roundRect } from './ddpm-common';

// Module 10.2 — strengths & limitations. Three capability views (kept from the original
// interaction) plus exact paper numbers, the LSUN Table 3 transcription, the explicit
// compute-budget caveat and the paper's own limitation statements.

const W = 1080;
const H = 280;

const RED = '#c43f52';
const GREEN = '#228d5c';
const ORANGE = '#d97706';
const AXIS = '#d7deea';
const TEXT = '#21324a';
const MUTED = '#68778f';

type View = 'quality' | 'likelihood' | 'speed';

const VIEWS: Record<View, { label: string; ratio: number; color: string; note: string }> = {
  quality: { label: '样本质量', ratio: 0.92, color: GREEN, note: 'CIFAR10 FID 3.17 / IS 9.46' },
  likelihood: { label: '对数似然', ratio: 0.45, color: ORANGE, note: 'NLL ≤3.70 / ≤3.75 bits/dim' },
  speed: { label: '采样速度', ratio: 0.18, color: RED, note: '约 1000 步；256²×128 张 ≈ 300s' },
};

const ORDER: View[] = ['quality', 'likelihood', 'speed'];

function viewFeedback(v: View): { text: string; cls: string } {
  if (v === 'quality') {
    return {
      text: '样本质量：无条件 CIFAR10 FID 3.17（相对训练集；相对测试集 5.24）/ IS 9.46 —— 2020 年时点的 SOTA；LSUN 256×256 接近 ProgressiveGAN（见下表）。',
      cls: 'good',
    };
  }
  if (v === 'likelihood') {
    return {
      text: '对数似然：码长优于能量模型与分数匹配的 AIS 估计，但不如其他似然类模型（NLL ≤3.70 / ≤3.75 bits/dim，分别对应 L 与 L_simple）。FID/IS 强 ≠ 似然强。',
      cls: '',
    };
  }
  return {
    text: '采样速度：生成每张图约需 1000 次串行网络前向；256×256 上采样 128 张约 300 秒（论文 Appendix B）。这是扩散模型当时的主要代价。',
    cls: 'bad',
  };
}

const LSUN_ROWS: Array<{ model: string; bedroom: string; church: string; cat: string; ours?: boolean }> = [
  { model: 'ProgressiveGAN [27]', bedroom: '8.34', church: '6.42', cat: '37.52' },
  { model: 'StyleGAN [28]', bedroom: '2.65', church: '4.21*', cat: '8.53*' },
  { model: 'StyleGAN2 [30]', bedroom: '—', church: '3.86', cat: '6.93' },
  { model: '本文（L_simple）', bedroom: '6.36', church: '7.89', cat: '19.75', ours: true },
  { model: '本文（L_simple，大模型）', bedroom: '4.90', church: '—', cat: '—', ours: true },
];

export const Ch10Limits: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ view: View; t: number }>({ view: 'quality', t: 0 });
  const [view, setView] = useState<View>('quality');
  const [feedback, setFeedback] = useState(viewFeedback('quality'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { view: View; t: number }): void => {
      clearField(ctx, W, H);
      sceneLabel(ctx, '三项能力对比（相对强弱条为示意，数字为论文原值）', 40, 36, { size: 17 });

      const x0 = 240;
      const barMaxW = 660;
      const top = 66;
      const rowH = 62;

      ORDER.forEach((k, i) => {
        const v = VIEWS[k];
        const y = top + i * rowH;
        const selected = s.view === k;
        ctx.globalAlpha = selected ? 1 : 0.32;

        ctx.fillStyle = TEXT;
        ctx.font = '700 19px "Segoe UI","PingFang SC",sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(v.label, x0 - 16, y + 30);

        ctx.fillStyle = '#eef1f6';
        roundRect(ctx, x0, y + 6, barMaxW, 36, 8);
        ctx.fill();
        ctx.fillStyle = v.color;
        roundRect(ctx, x0, y + 6, barMaxW * v.ratio, 36, 8);
        ctx.fill();

        ctx.fillStyle = TEXT;
        ctx.textAlign = 'left';
        ctx.font = '700 15px "Segoe UI","PingFang SC",sans-serif';
        ctx.fillText(v.note, x0 + barMaxW + 14, y + 30);

        if (selected) {
          ctx.strokeStyle = '#27446e';
          ctx.lineWidth = 3;
          roundRect(ctx, x0 - 3, y + 3, barMaxW + 6, 42, 10);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });

      ctx.textAlign = 'left';
      let lx = 40;
      ctx.font = '15px "Segoe UI","PingFang SC",sans-serif';
      [
        { color: GREEN, text: '强项' },
        { color: ORANGE, text: '一般' },
        { color: RED, text: '短板' },
      ].forEach((it) => {
        ctx.fillStyle = it.color;
        ctx.fillRect(lx, H - 31, 14, 14);
        ctx.fillStyle = MUTED;
        ctx.fillText(it.text, lx + 20, H - 20);
        lx += 20 + ctx.measureText(it.text).width + 26;
      });
    };

    const tick = (): void => {
      stateRef.current.t += 1;
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const selectView = (v: View) => {
    stateRef.current.view = v;
    setView(v);
    setFeedback(viewFeedback(v));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {ORDER.map((k) => (
          <button
            key={k}
            type="button"
            className={`chip ${view === k ? 'selected' : ''}`}
            aria-pressed={view === k}
            onClick={() => selectView(k)}
          >
            {VIEWS[k].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>

      <table className="paper">
        <thead>
          <tr>
            <th>LSUN 256×256（论文 Table 3，FID ↓）</th>
            <th>Bedroom</th>
            <th>Church</th>
            <th>Cat</th>
          </tr>
        </thead>
        <tbody>
          {LSUN_ROWS.map((row) => (
            <tr key={row.model} className={row.ours ? 'row-active' : ''}>
              <td>{row.model}</td>
              <td>{row.bedroom}</td>
              <td>{row.church}</td>
              <td>{row.cat}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="source-note">
        数据来源：论文 Table 3（* 为 StyleGAN2 论文报告的基线数字；"—" 表示论文未报告）。结论口径同论文：LSUN 256×256 上样本质量「接近 ProgressiveGAN」。
      </div>

      <div className="explain-block">
        <b>论文明确写出的局限（不回避）：</b>
        <ul>
          <li><b>对数似然不具竞争力</b>：比部分似然类模型差；仅优于能量模型/分数匹配的 AIS 估计。</li>
          <li><b>采样慢</b>：T = 1000 步串行前向是主要计算代价（论文 Appendix B 给出实测时间）。</li>
          <li><b>渐进压缩只是概念验证</b>：论文明确说明 Algorithms 3/4 依赖 minimal random coding，目前还不是实用压缩系统。</li>
        </ul>
        <b>训练与硬件（论文 Appendix B 原值）：</b>
        <ul>
          <li>CIFAR10：800k 步、batch 128、约 10.6 小时；TPU v3-8（作者描述为“近似 8 张 V100”）。</li>
          <li>256×256 模型：CelebA-HQ 0.5M 步、LSUN Bedroom 2.4M / Cat 1.8M / Church 1.2M 步；大模型 1.15M 步。</li>
          <li>采样：CIFAR10 batch 256 约 17 秒；256² batch 128 约 300 秒。</li>
        </ul>
        <b>复现入口（P3）：</b>
        <ul>
          <li>论文：<a href="https://arxiv.org/abs/2006.11239" target="_blank" rel="noreferrer">arXiv:2006.11239</a>（NeurIPS 2020）。</li>
          <li>官方代码：<a href="https://github.com/hojonathanho/diffusion" target="_blank" rel="noreferrer">github.com/hojonathanho/diffusion</a>（论文摘要给出的原始实现）。</li>
          <li>最小实现思路：U-Net 预测 ε + L_simple 训练（第 7 章）+ Algorithm 2 采样（第 6 章）；关键超参 β 表、dropout、学习率、EMA 见第 9 章与本章列表。</li>
        </ul>
      </div>
    </div>
  );
};

export default Ch10Limits;
