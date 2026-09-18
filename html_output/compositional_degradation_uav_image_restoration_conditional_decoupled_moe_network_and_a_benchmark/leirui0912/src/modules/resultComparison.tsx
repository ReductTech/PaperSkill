import React, { useState, useRef, useEffect, useMemo } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { WidgetProps } from './registry';
import { markCanvasReady } from './canvasReady';
import { DEGRADATIONS } from './uavScene';
import { readableBg } from './factorChips';

// 数值全部取自论文表 I（Table I，MDUR 上的平均结果，PSNR/SSIM），没有任何估计值。
//
// 表 I 有九个分组行（已见单/双/三因子 + Overall Seen；未见双/三/四因子 + Overall
// Unseen，以及首行的 Seen / Zero-Shot Settings 小标题行），每一行六个方法都报齐。
// 本模块取的是两组口径各自的总体平均：
//   seen   = Overall Seen   21 个已见任务
//   unseen = Overall Unseen 22 个未见任务（zero-shot）
// 取这两行的理由不是「别的行缺数」，而是它们各自是所在口径唯一的总平均 —— 一张图
// 里只放两组同样的口径，不把分复杂度的小组平均混进来。纸面上也出现过 23.04 dB / 0.7410 这个数（表 III 的
// Full model 行，即 43 个任务的总平均），但基线没有同口径的数字，拿它去比基线
// 的分组平均会得出相反的名次，所以这里不用。
// 正文可互验：「improves the overall seen average from 27.43 dB / 0.8544 to
// 27.67 dB / 0.8602」「an overall unseen average of 18.62 dB / 0.6271」。
//
// 这个组件在第 10 章挂两处（类比卡与模块 10.1），两处刻意不同：
//   类比卡（moduleId === 'ana'）-> 数据集本身：8 种原子因子 → 43 种有效配置 →
//        21 训练 / 22 留出，以及留出集偏向哪几类组合。回答「MDUR 是什么」。
//   模块 10.1                   -> 表 I 的分组平均条形图。回答「好在哪」。
// 旧版两处挂同一个组件、画同一张图。
//
// 基建修正（与第 5–9 章同批）：走 setupCanvas 适配高分屏；markCanvasReady 取代
// 手工 canvas.classList.add('is-ready')；去掉 #f5f8f0 背景填充让卡片底色透出来；
// 换掉框架里不存在的类名（widget-canvas / controls / metric-selector / metric-btn /
// animate-btn / widget-feedback）；反馈行改 JSX 渲染。

type Row = { name: string; psnr: number; ssim: number };
type Setting = { label: string; btn: string; rows: Row[] };

const SETTINGS: Record<'seen' | 'unseen', Setting> = {
  seen: {
    label: '已见 21 个任务',
    btn: '已见',
    rows: [
      { name: 'DAME-Net (Ours)', psnr: 27.67, ssim: 0.8602 },
      { name: 'PromptIR', psnr: 27.43, ssim: 0.8544 },
      { name: 'Restormer', psnr: 27.25, ssim: 0.8504 },
      { name: 'DehazeFormer', psnr: 27.01, ssim: 0.8433 },
      { name: 'AdaIR', psnr: 26.57, ssim: 0.8338 },
      { name: 'AirNet', psnr: 25.82, ssim: 0.7717 }
    ]
  },
  unseen: {
    label: '未见 22 个任务（zero-shot）',
    btn: '未见 zero-shot',
    rows: [
      { name: 'DAME-Net (Ours)', psnr: 18.62, ssim: 0.6271 },
      { name: 'PromptIR', psnr: 16.46, ssim: 0.5826 },
      { name: 'Restormer', psnr: 16.45, ssim: 0.5776 },
      { name: 'DehazeFormer', psnr: 16.33, ssim: 0.5630 },
      { name: 'AdaIR', psnr: 16.28, ssim: 0.5647 },
      { name: 'AirNet', psnr: 16.03, ssim: 0.5255 }
    ]
  }
};

type SettingKey = keyof typeof SETTINGS;
type MetricKey = 'psnr' | 'ssim';

const OURS = 'DAME-Net (Ours)';

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';
const MONO = 'ui-monospace, Consolas, "Courier New", monospace';

// ---- 类比卡：MDUR 数据集本身（静态） ----
const W_ANA = 560;
const H_ANA = 278;

// ---- 模块 10.1：表 I 的分组平均 ----
const W_MOD = 560;
const H_MOD = 306;

const INK = '#21324a';
const SLATE = '#68778f';
const LINE = '#d7deea';
const GREEN = '#228d5c';
const BLUE = '#2f6fd0';
const GREY = '#94a3b8';

const valueOf = (row: Row, metric: MetricKey) => (metric === 'psnr' ? row.psnr : row.ssim);

/** 描边 + 浅底的方框。 */
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, alpha = 0.1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

/** 带箭头的直线。 */
function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color = SLATE, width = 1.4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();

  const a = Math.atan2(y1 - y0, x1 - x0);
  const L = 5.5;
  ctx.beginPath();
  ctx.moveTo(x1 - L * Math.cos(a - 0.42), y1 - L * Math.sin(a - 0.42));
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - L * Math.cos(a + 0.42), y1 - L * Math.sin(a + 0.42));
  ctx.stroke();
}

/**
 * 类比卡：MDUR 这个基准长什么样。
 * 8 种原子因子 → 单图最多叠 4 个 → 43 种有效配置 → 21 训练 / 22 留出。
 */
function paintDataset(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W_ANA, H_ANA);
  ctx.textAlign = 'center';

  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('MDUR 是什么', W_ANA / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文贡献一：首个面向组合退化的无人机图像修复基准，自带标准化的已见 / 未见划分', W_ANA / 2, 40);

  // ---- 8 种原子因子 ----
  ctx.fillStyle = INK;
  ctx.font = `bold 10px ${FONT}`;
  ctx.fillText('8 种原子退化因子', W_ANA / 2, 62);

  const sq = 40;
  const pitch = 44;
  const x0 = (W_ANA - (8 * pitch - 4)) / 2;
  DEGRADATIONS.forEach((d, i) => {
    const x = x0 + i * pitch;
    const bg = readableBg(d.color); // 保证白字对比度，与全站的因子开关一致
    ctx.fillStyle = bg;
    ctx.fillRect(x, 72, sq, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = `9.5px ${FONT}`;
    ctx.fillText(d.name, x + sq / 2, 88);
  });

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('一张图里最多同时叠 4 个因子（单因子 → 四因子组合）', W_ANA / 2, 112);

  arrow(ctx, W_ANA / 2, 118, W_ANA / 2, 130, SLATE, 1.3);

  // ---- 有效配置 ----
  box(ctx, 106, 132, 348, 32, BLUE, 0.08);
  ctx.fillStyle = INK;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('43 种有效配置，每种一个 multi-hot 标注', W_ANA / 2, 153);

  // ---- 划分 ----
  ctx.strokeStyle = SLATE;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(140, 170);
  ctx.lineTo(420, 170);
  ctx.stroke();
  arrow(ctx, 140, 170, 140, 180, GREEN, 1.3);
  arrow(ctx, 420, 170, 420, 180, BLUE, 1.3);

  box(ctx, 40, 182, 200, 60, GREEN, 0.08);
  ctx.fillStyle = GREEN;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('21 种：训练（已见）', 140, 202);
  ctx.fillStyle = INK;
  ctx.font = `9.5px ${MONO}`;
  ctx.fillText('27.67 dB / 0.8602', 140, 222);
  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('总体已见平均（表 I）', 140, 236);

  box(ctx, 320, 182, 200, 60, BLUE, 0.08);
  ctx.fillStyle = BLUE;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('22 种：留出（zero-shot）', 420, 202);
  ctx.fillStyle = INK;
  ctx.font = `9.5px ${MONO}`;
  ctx.fillText('18.62 dB / 0.6271', 420, 222);
  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('总体未见平均（表 I）', 420, 236);

  ctx.fillStyle = INK;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('留出集集中在 low-light+blur 与 low-light+artifact，以及它们的高阶扩展', W_ANA / 2, 260);

  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText('指标：YCbCr 空间里亮度（Y）通道上的 PSNR 与 SSIM', W_ANA / 2, 274);
}

/**
 * 模块 10.1：表 I 的分组平均条形图。
 * @param progress 0→1 的动画进度，只影响条长，不参与任何数值计算
 */
function paintChart(
  ctx: CanvasRenderingContext2D,
  setting: SettingKey,
  metric: MetricKey,
  progress: number,
  ranked: Row[]
) {
  ctx.clearRect(0, 0, W_MOD, H_MOD);
  ctx.textAlign = 'center';

  // 标题写明口径：分组平均只有一个前提，就是「比的是哪一组」
  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText(`MDUR 基准结果对比 · ${SETTINGS[setting].label}`, W_MOD / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文表 I：按评测口径分组（已见 / 未见 zero-shot），每次都取该口径的总平均', W_MOD / 2, 40);

  const chartX = 104;
  const chartY = 52;
  const chartW = W_MOD - chartX - 26;
  const chartH = 196;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(chartX, chartY, chartW, chartH);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(chartX + 0.5, chartY + 0.5, chartW - 1, chartH - 1);

  const barHeight = 22;
  const barGap = 9;
  // 纵轴自 0 起算、顶端只留 12% 余量：条形长度彼此可比，
  // 不靠截断坐标轴去放大那零点几 dB 的差距
  const maxVal = valueOf(ranked[0], metric) * 1.12;

  ranked.forEach((method, i) => {
    const y = chartY + 12 + i * (barHeight + barGap);
    const value = valueOf(method, metric);
    const barWidth = (chartW - 34) * (value / maxVal) * progress;

    ctx.fillStyle = method.name === OURS ? GREEN : GREY;
    ctx.fillRect(chartX + 6, y, barWidth, barHeight);

    // 方法名靠左侧留白处右对齐，条形从 chartX 起画，两者不重叠
    ctx.fillStyle = INK;
    ctx.font = `9.5px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(method.name, chartX - 6, y + 15);

    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.font = `9.5px ${MONO}`;
    ctx.fillText(metric === 'psnr' ? value.toFixed(2) : value.toFixed(4), chartX + barWidth + 6, y + 15);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = SLATE;
  ctx.font = `9px ${FONT}`;
  ctx.fillText(metric === 'psnr' ? 'PSNR (dB)，越高越好' : 'SSIM，越高越好', W_MOD / 2, chartY + chartH + 18);
  // 出处写在图上，免得读者把「分组平均」当成别的口径
  ctx.fillText(
    '总体未见 18.62 dB 与最强基线 16.46 dB 差 2.16 dB；总体已见 27.67 dB 与最强基线 27.43 dB 差 0.24 dB',
    W_MOD / 2,
    chartY + chartH + 34
  );
}

export const ResultComparison: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [metric, setMetric] = useState<MetricKey>('psnr');
  const [setting, setSetting] = useState<SettingKey>('seen');
  const [animate, setAnimate] = useState(false);
  // 初始即 1：进到这一章就先看到完整柱状图，而不是一排零长度的空轴。
  // 只有切指标/切口径/重播时才归零重跑动画。
  const [progress, setProgress] = useState(1);

  // 类比卡讲数据集，模块 10.1 看结果
  const analogy = moduleId === 'ana';
  const W = analogy ? W_ANA : W_MOD;
  const H = analogy ? H_ANA : H_MOD;

  const rows = SETTINGS[setting].rows;
  const ours = rows[0];
  const ranked = useMemo(
    () => [...rows].sort((a, b) => valueOf(b, metric) - valueOf(a, metric)),
    [rows, metric]
  );
  // 领先幅度按当前指标算；最强的“别人”也从数据里取，不写死名字
  const bestOther = useMemo(
    () => [...rows.slice(1)].sort((a, b) => valueOf(b, metric) - valueOf(a, metric))[0],
    [rows, metric]
  );
  const lead = valueOf(ours, metric) - valueOf(bestOther, metric);
  const fmt = (v: number) => (metric === 'psnr' ? `${v.toFixed(2)} dB` : v.toFixed(4));

  useEffect(() => {
    if (!animate) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          setAnimate(false);
          return 1;
        }
        return prev + 0.02;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx = ctxRef.current;
    if (!ctx) {
      try {
        ctx = setupCanvas(canvas, W, H);
      } catch {
        // 退化路径：拿不到 2D 上下文时按 1x 画，至少不留空白
        const fallback = canvas.getContext('2d');
        if (!fallback) return;
        canvas.width = W;
        canvas.height = H;
        ctx = fallback;
      }
      ctxRef.current = ctx;
      // 跟随栏宽并限高：窄列不被裁切，宽列不被放大糊掉
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.maxWidth = W + 'px';
      canvas.style.margin = '0 auto';
      canvas.style.display = 'block';
    }

    if (analogy) paintDataset(ctx);
    else paintChart(ctx, setting, metric, progress, ranked);

    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入
    markCanvasReady(canvas);
  }, [analogy, setting, metric, progress, ranked, W, H]);

  const feedback = analogy
    ? {
        text: '8 种原子因子、单图最多叠 4 个 → 43 种有效配置；21 种进训练（已见）、22 种留出做 zero-shot（未见），留出集偏向 low-light+blur 与 low-light+artifact',
        cls: ''
      }
    : {
        text: `DAME-Net ${fmt(valueOf(ours, metric))} —— ${SETTINGS[setting].label}上六种方法里最高，领先最强基线 ${bestOther.name} ${fmt(lead)}`,
        cls: 'good'
      };

  return (
    <div className="widget-container">
      <h3 className="widget-title">{analogy ? 'MDUR：43 种配置，21 训 22 留出' : '六个方法，两组口径'}</h3>
      <p className="widget-description">
        {analogy
          ? '从 8 个原子因子，到 43 种配置，再到 21 / 22 的划分 —— 这一条流水线就是论文的第一个贡献'
          : '切指标与口径看重排后的条形；纵轴自 0 起算，条形长度彼此可比，不做截断放大'}
      </p>

      <div className="widget-content">
        <canvas ref={canvasRef} width={W} height={H} />

        {!analogy && (
          <>
            <div className="chip-row">
              {(['psnr', 'ssim'] as MetricKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`chip${metric === k ? ' selected' : ''}`}
                  aria-pressed={metric === k}
                  onClick={() => {
                    setMetric(k);
                    setProgress(0);
                    setAnimate(true);
                  }}
                >
                  {k.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="chip-row">
              {(Object.keys(SETTINGS) as SettingKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`chip${setting === k ? ' selected' : ''}`}
                  aria-pressed={setting === k}
                  onClick={() => {
                    setSetting(k);
                    setProgress(0);
                    setAnimate(true);
                  }}
                >
                  {SETTINGS[k].btn}
                </button>
              ))}

              <button
                type="button"
                className="chip"
                onClick={() => {
                  setProgress(0);
                  setAnimate(true);
                }}
                style={{ borderStyle: 'dashed' }}
              >
                重新播放
              </button>
            </div>
          </>
        )}
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className={`feedback${feedback.cls ? ` ${feedback.cls}` : ''}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default ResultComparison;
