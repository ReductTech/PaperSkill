import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import { WidgetProps } from './registry';
import { markCanvasReady } from './canvasReady';
import { getScene } from './uavScene';
import { readableBg } from './factorChips';

// 训练目标（论文 III-E 节）。
//
// 论文原文只有两阶段，没有第三阶段：
//   · Stage I：用式(7) L_P = λ_align·L_align + λ_cls·L_cls 训练感知模型 P，
//     收敛后在整个修复训练过程中一直冻结（"once converged, it is frozen for all
//     subsequent restoration training"）。
//   · Stage II：用式(16) L_R = ‖ŷ − y‖₁ + λ_f·L_freq + λ_p·L_base 训练修复网络，
//     (λ_f, λ_p) = (0.1, 0.1)。其中 L_freq 是「挖掉短边 0.2 的低频中心方块后」的
//     掩码 FFT 幅度损失，L_base 监督基座分支去逼近引导滤波平滑目标
//     y_base = GuidedFilter(y, y; r = 15, ε = 10⁻³)；论文只把 L_freq 明确写成 L1，
//     L_base 的范数形式没写，所以这里也不替它写。
//   · 超参：AdamW（lr 2×10⁻⁴，weight decay 0.02）、batch size 8、crop 256×256、
//     100 epochs、掩码过载概率 0.05、1× A100。
//
// 这个组件在第 7 章挂两处（类比卡与模块 7.1），两处刻意不同：
//   类比卡（moduleId === 'ana'）-> 两阶段分别是什么、各用哪个式子、超参有哪些，
//        静态时间线。回答「两阶段训练是什么」。
//   模块 7.1                     -> L_R 三项各自监督什么，三块面板 + 三个开关。
//        回答「三项损失为什么不能合成一项」。
//
// 旧版是全教程最严重的一处编造：一条损失曲线，六个步骤
// （「Stage I: 收敛」「Stage II: 中期」「Stage II: 后期」「完成」——论文只有两个
// stage），损失值 0.8 / 0.3 / 0.6 / 0.35 / 0.2 / 0.15 论文从未报告，y 轴没有标签，
// 而且 y = 60 + 100*(1 − loss) 让曲线随着损失变小反而往上走。整段已删除，改为
// 讲论文真写了的三项监督对象。
//
// 面板 ② 的频谱是现算的 64×64 FFT 幅度（log 标度），中心方块按论文的
// 「短边 0.2」比例挖掉 —— 不画示意图，免得又编一个论文里没有的图形。
// 面板 ③ 的缩略图是模糊后的景物，属于示意（引导滤波保留强边缘，模糊不保留），
// 图上标了「示意」二字。

const FONT = '"Segoe UI", "PingFang SC", "Hiragino Sans GB", Arial, sans-serif';
const MONO = 'ui-monospace, Consolas, "Courier New", monospace';

// ---- 类比卡：两阶段时间线 ----
const W_ANA = 560;
const H_ANA = 272;

// ---- 模块 7.1：三项损失各自监督什么 ----
const W_MOD = 560;
const H_MOD = 266;

const INK = '#21324a';
const SLATE = '#68778f';
const LINE = '#d7deea';
const BLUE = '#2f6fd0';
const GREEN = '#228d5c';
const ORANGE = '#f07e47';

/** 有选中态的开关项，与 FactorChips 同一套 .chip 写法。 */
const TERMS = [
  {
    id: 'spatial',
    label: '① 整图 L1',
    short: '整图 L1',
    color: BLUE,
    weight: '系数隐含为 1',
    off: '只按逐像素差值监督，中高频细节和低频光照都没有专门的约束'
  },
  {
    id: 'freq',
    label: '② 掩码频率 L1',
    short: '掩码频率 L1',
    color: ORANGE,
    weight: 'λ_f = 0.1',
    off: 'blur / noise / 伪影最明显的中高频失去直接监督'
  },
  {
    id: 'base',
    label: '③ 基座（引导滤波）',
    short: '基座',
    color: GREEN,
    weight: 'λ_p = 0.1',
    off: '基座分支失去目标，粗光照校正只能靠整图损失间接学'
  }
];

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
  const L = 6;
  ctx.beginPath();
  ctx.moveTo(x1 - L * Math.cos(a - 0.42), y1 - L * Math.sin(a - 0.42));
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - L * Math.cos(a + 0.42), y1 - L * Math.sin(a + 0.42));
  ctx.stroke();
}

/**
 * 类比卡：两阶段训练。
 * 左边 Stage I 训感知模型，右边 Stage II 训修复网络，中间那条箭头就是「冻结」。
 */
function paintTimeline(ctx: CanvasRenderingContext2D) {
  // 画布保持透明，让卡片底色透出来（与第 1–6 章一致）
  ctx.clearRect(0, 0, W_ANA, H_ANA);
  ctx.textAlign = 'center';

  ctx.fillStyle = INK;
  ctx.font = `bold 13px ${FONT}`;
  ctx.fillText('两阶段训练：先训感知，冻结，再训修复', W_ANA / 2, 22);

  ctx.fillStyle = SLATE;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文 III-E：两个阶段各有一条损失（式 7 / 式 16），不是合成的一条', W_ANA / 2, 40);

  // ---- Stage I ----
  box(ctx, 28, 60, 240, 142, BLUE, 0.08);
  ctx.textAlign = 'left';
  ctx.fillStyle = BLUE;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('Stage I · 训练感知模型 P', 40, 82);
  ctx.fillStyle = INK;
  ctx.font = `8.5px ${MONO}`;
  ctx.fillText('L_P = λ_align·L_align + λ_cls·L_cls', 40, 100);
  ctx.font = `8.5px ${FONT}`;
  ctx.fillStyle = SLATE;
  ctx.fillText('式 (7)，λ_align = 0.1，λ_cls = 0.9', 40, 116);
  ctx.fillStyle = INK;
  ctx.fillText('CLIP ViT-B/32 双塔（d = 512）', 40, 136);
  ctx.fillText('多标签头：MLP + LayerNorm', 40, 152);
  ctx.fillText('对齐视图：22 个任务共用同一随机裁剪', 40, 168);
  ctx.fillStyle = SLATE;
  ctx.fillText('输出退化掩码 m̂ 与图像嵌入 p', 40, 184);

  // ---- 冻结 ----
  arrow(ctx, 270, 131, 290, 131, SLATE, 1.8);

  // ---- Stage II ----
  box(ctx, 292, 60, 240, 142, GREEN, 0.08);
  ctx.fillStyle = GREEN;
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('Stage II · 训练修复网络', 304, 82);
  ctx.fillStyle = INK;
  ctx.font = `8.5px ${MONO}`;
  ctx.fillText('L_R = ‖ŷ−y‖₁ + λ_f·L_freq + λ_p·L_base', 304, 100);
  ctx.font = `8.5px ${FONT}`;
  ctx.fillStyle = SLATE;
  ctx.fillText('式 (16)，λ_f = 0.1，λ_p = 0.1', 304, 116);
  ctx.fillStyle = INK;
  ctx.fillText('感知模型 P 全程冻结', 304, 136);
  ctx.fillText('整图 L1 + 掩码频率 L1 + 基座（引导滤波）', 304, 152);
  ctx.fillText('掩码过载增强 p = 0.05', 304, 168);
  ctx.fillStyle = SLATE;
  ctx.fillText('训练 100 epochs，crop 256×256', 304, 184);

  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `9.5px ${FONT}`;
  ctx.fillText('论文 III-E：感知模型 P 先用式(7) 训练，收敛后冻结，之后整个修复训练都不再更新它', W_ANA / 2, 224);

  ctx.fillStyle = SLATE;
  ctx.fillText('超参：AdamW（lr 2×10⁻⁴，weight decay 0.02）、batch size 8、1× A100', W_ANA / 2, 244);
}

// ---------------------------------------------------------------------------
// 面板 ② 的频谱：现算 64×64 的 FFT 幅度（log 标度），不做示意图
// ---------------------------------------------------------------------------

const N = 64;

/** 就地基-2 FFT，实部虚部分开存；N 必须是 2 的幂。 */
function fft1d(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i];
      re[i] = re[j];
      re[j] = t;
      t = im[i];
      im[i] = im[j];
      im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len >> 1; k++) {
        const a = i + k;
        const b = a + (len >> 1);
        const vr = re[b] * cr - im[b] * ci;
        const vi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - vr;
        im[b] = im[a] - vi;
        re[a] += vr;
        im[a] += vi;
        const nr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = nr;
      }
    }
  }
}

let spectrumCv: HTMLCanvasElement | null = null;

/**
 * 景物的 64×64 log 频谱（已 fftshift，中心是零频）。
 * 只用论文里那张图，所以算一次就缓存。
 */
function getSpectrum(): HTMLCanvasElement {
  if (spectrumCv) return spectrumCv;

  const small = document.createElement('canvas');
  small.width = N;
  small.height = N;
  const sg = small.getContext('2d');
  const out = document.createElement('canvas');
  out.width = N;
  out.height = N;
  const og = out.getContext('2d');
  if (!sg || !og) return small;

  // 缩到 64×64 之前先模糊一下：canvas 的缩放不抗锯齿，直接缩会留下折叠进来的
  // 高频，频谱会变成一片均匀的雪花，看不出低频集中的样子
  sg.filter = 'blur(1.5px)';
  sg.drawImage(getScene(), 0, 0, N, N);
  sg.filter = 'none';
  const px = sg.getImageData(0, 0, N, N).data;

  const re = new Float64Array(N * N);
  const im = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) {
    // 灰度。不去均值：零频项留着，画面上才有中心亮、往外衰减的样子
    re[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  }

  const rowRe = new Float64Array(N);
  const rowIm = new Float64Array(N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      rowRe[x] = re[y * N + x];
      rowIm[x] = im[y * N + x];
    }
    fft1d(rowRe, rowIm);
    for (let x = 0; x < N; x++) {
      re[y * N + x] = rowRe[x];
      im[y * N + x] = rowIm[x];
    }
  }
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      rowRe[y] = re[y * N + x];
      rowIm[y] = im[y * N + x];
    }
    fft1d(rowRe, rowIm);
    for (let y = 0; y < N; y++) {
      re[y * N + x] = rowRe[y];
      im[y * N + x] = rowIm[y];
    }
  }

  const mag = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) mag[i] = Math.log1p(Math.hypot(re[i], im[i]));

  // 按 90 分位归一，而不是按最大值 —— 零频那一点远大于其它所有点，
  // 按最大值归一的话中高频全被压成一片均匀的灰。
  const ref = Float64Array.from(mag).sort()[Math.floor(N * N * 0.9)] || 1e-9;

  const img = og.createImageData(N, N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      // fftshift：把零频挪到中心
      const sy = (y + N / 2) % N;
      const sx = (x + N / 2) % N;
      const v = Math.pow(Math.min(1, mag[sy * N + sx] / ref), 0.85) * 255;
      const o = (y * N + x) * 4;
      img.data[o] = v;
      img.data[o + 1] = v;
      img.data[o + 2] = v;
      img.data[o + 3] = 255;
    }
  }
  og.putImageData(img, 0, 0);
  spectrumCv = out;
  return out;
}

/**
 * 模块 7.1 的一块面板：标题 + 监督目标图 + 三行说明。
 * @param on 该损失项是否启用；关掉时整块压白
 */
function paintTerm(ctx: CanvasRenderingContext2D, i: number, on: boolean) {
  const x = 30 + i * 175;
  const y = 58;
  const w = 150;
  const h = 140;
  const cx = x + w / 2;
  const color = TERMS[i].color;
  const imgY = 80;
  const imgH = 54;

  box(ctx, x, y, w, h, on ? color : SLATE, on ? 0.07 : 0.04);

  ctx.textAlign = 'center';
  ctx.fillStyle = on ? INK : SLATE;
  ctx.font = `bold 10.5px ${FONT}`;
  ctx.fillText(TERMS[i].label, cx, 72);

  if (i === 0) {
    // ① 整图：整幅都算
    ctx.drawImage(getScene(), x + 8, imgY, w - 16, imgH);
    ctx.strokeStyle = on ? color : LINE;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 8.5, imgY + 0.5, w - 17, imgH - 1);
  } else if (i === 1) {
    // ② 频谱：中心那个方块按「短边 0.2」挖掉
    ctx.fillStyle = '#0f1720';
    ctx.fillRect(x + 8, imgY, w - 16, imgH);
    const side = imgH; // 频谱画成正方形，边长取图片区高度
    const sx = cx - side / 2;
    ctx.drawImage(getSpectrum(), sx, imgY, side, side);

    // 挖掉 ≠ 删掉：低频那一块还在画面上，只是不参与损失，所以压暗而不是涂白
    const cut = side * 0.2; // 论文：ratio 0.2 of the shorter side
    const midY = imgY + side / 2;
    ctx.fillStyle = 'rgba(10,16,26,0.74)';
    ctx.fillRect(cx - cut / 2, midY - cut / 2, cut, cut);
    ctx.setLineDash([3, 2]);
    ctx.strokeStyle = '#ff5d5d';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - cut / 2, midY - cut / 2, cut, cut);
    ctx.setLineDash([]);

    // 引出线 + 白底标签，免得红字压在半调频谱上看不清
    ctx.strokeStyle = '#ff5d5d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + cut / 2 + 1, midY);
    ctx.lineTo(x + w - 44, midY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(x + w - 42, midY - 6, 31, 12);
    ctx.fillStyle = '#ff5d5d';
    ctx.font = `7.5px ${FONT}`;
    ctx.fillText('挖掉', x + w - 26, midY + 3);

    ctx.fillStyle = '#8c9bb5';
    ctx.font = `7px ${MONO}`;
    ctx.fillText('log|FFT|', x + w - 11, imgY + imgH - 4);
    ctx.textAlign = 'center';
  } else {
    // ③ 基座：引导滤波平滑目标（这里只能用模糊示意，图上标出来）
    ctx.save();
    ctx.filter = 'blur(3px)';
    ctx.drawImage(getScene(), x + 8, imgY, w - 16, imgH);
    ctx.restore();
    ctx.strokeStyle = on ? color : LINE;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 8.5, imgY + 0.5, w - 17, imgH - 1);
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.fillRect(x + w - 40, imgY + imgH - 14, 32, 12);
    ctx.fillStyle = SLATE;
    ctx.font = `7.5px ${FONT}`;
    ctx.fillText('示意', x + w - 24, imgY + imgH - 5);
  }

  // 三行说明
  const cap = [
    [`‖ŷ − y‖₁`, '整幅图的每个像素', '都算进去（系数 1）'],
    ['掩码 FFT 幅度 L1', '先挖掉中心低频方块', '边长 = 短边 × 0.2'],
    ['基座分支 → y_base', 'GuidedFilter(y, y)', 'r = 15，ε = 10⁻³']
  ][i];

  ctx.textAlign = 'left';
  // 字体简写里字号必须写在族名前面
  ctx.font = `8px ${i === 0 || i === 1 ? MONO : FONT}`;
  ctx.fillStyle = on ? INK : SLATE;
  ctx.fillText(cap[0], x + 8, 156);
  ctx.font = `8px ${FONT}`;
  ctx.fillText(cap[1], x + 8, 170);
  ctx.fillText(cap[2], x + 8, 184);

  if (!on) {
    // 关掉的项整块压白，一眼看出这一项没在监督
    ctx.fillStyle = 'rgba(255,255,255,0.66)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = SLATE;
    ctx.font = `9px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('未启用', cx, y + h / 2 + 3);
  }
}

export const TrainingMonitor: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [on, setOn] = useState<string[]>(TERMS.map((t) => t.id));

  // 类比卡看两阶段，模块 7.1 看三项损失各自的监督对象
  const analogy = moduleId === 'ana';
  const W = analogy ? W_ANA : W_MOD;
  const H = analogy ? H_ANA : H_MOD;

  // 按 TERMS 顺序存放，开关顺序不影响反馈文案的读法
  const toggle = (id: string) =>
    setOn((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : TERMS.filter((t) => t.id === id || prev.includes(t.id)).map((t) => t.id)
    );

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

    if (analogy) {
      paintTimeline(ctx);
    } else {
      ctx.clearRect(0, 0, W_MOD, H_MOD);
      ctx.textAlign = 'center';
      ctx.fillStyle = INK;
      ctx.font = `bold 13px ${FONT}`;
      ctx.fillText('L_R 的三项分别监督什么', W_MOD / 2, 22);
      ctx.fillStyle = SLATE;
      ctx.font = `9.5px ${FONT}`;
      ctx.fillText('论文式(16)：L_R = ‖ŷ − y‖₁ + λ_f·L_freq + λ_p·L_base，(λ_f, λ_p) = (0.1, 0.1)', W_MOD / 2, 40);

      for (let i = 0; i < TERMS.length; i++) paintTerm(ctx, i, on.includes(TERMS[i].id));

      ctx.fillStyle = INK;
      ctx.font = `9.5px ${FONT}`;
      ctx.fillText('三项管的不是同一批像素：整图 L1 保整体，掩码频率 L1 管中高频，基座项管粗光照', W_MOD / 2, 220);

      ctx.fillStyle = SLATE;
      ctx.font = `9px ${FONT}`;
      ctx.fillText('表 V：去掉频率损失 22.32 dB（掉 0.72；quad 任务掉 2.49，最大一项）；去掉引导滤波损失 22.91 dB（掉 0.13）', W_MOD / 2, 240);
      ctx.fillText('去掉引导滤波损失这项 SSIM 反而升 0.0043，论文称之为温和的权衡；论文只把 L_freq 明确写成 L1', W_MOD / 2, 256);
    }

    // components.css 里 canvas 默认 opacity:0，靠 .is-ready 淡入
    markCanvasReady(canvas);
  }, [on, analogy, W, H]);

  // 反馈讲的是「少掉的那几项会丢什么」，所以取被关掉的那几项，不是剩下的那几项
  const missing = TERMS.filter((t) => !on.includes(t.id));
  const feedback = analogy
    ? {
        text: 'Stage I 用式(7) 训感知模型、收敛后冻结，Stage II 用式(16) 训修复网络 —— 两个阶段两条损失，不是合成的一条',
        cls: ''
      }
    : missing.length === TERMS.length
      ? { text: '三项全关：L_R 里一项监督都没有了', cls: 'bad' }
      : missing.length === 0
        ? {
            text: '三项同时生效：整图 L1（系数隐含为 1）+ 0.1·L_freq + 0.1·L_base；论文同时用它们监督整图、中高频与低频基座',
            cls: 'good'
          }
        : {
            text: `少了${missing.map((t) => t.short).join('、')}：${missing.map((t) => t.off).join('；')}`,
            cls: ''
          };

  return (
    <div className="widget-container">
      <h3 className="widget-title">{analogy ? '两阶段训练的时间线' : '损失分解器'}</h3>
      <p className="widget-description">
        {analogy
          ? '感知模型先用式(7) 单独训练，收敛后冻结，再用式(16) 训练修复网络；两个阶段各有一条损失'
          : '三项损失各管一块监督区域：整图逐像素、掩码后的中高频频谱、引导滤波平滑出来的低频基座。关掉任意一项，看缺的是哪一块'}
      </p>

      <div className="widget-content">
        <canvas ref={canvasRef} width={W} height={H} />

        {!analogy && (
          <div className="chip-row">
            {TERMS.map((t) => {
              const lit = on.includes(t.id);
              const bg = readableBg(t.color);
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`chip${lit ? ' selected' : ''}`}
                  aria-pressed={lit}
                  onClick={() => toggle(t.id)}
                  style={lit ? { background: bg, borderColor: bg, color: '#fff' } : undefined}
                >
                  {t.label}
                  <span style={{ opacity: 0.72, marginLeft: 4 }}>{t.weight}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div id={`feedback-${chapterId}-${moduleId}`} className={`feedback${feedback.cls ? ` ${feedback.cls}` : ''}`}>
        {feedback.text}
      </div>
    </div>
  );
};

export default TrainingMonitor;
