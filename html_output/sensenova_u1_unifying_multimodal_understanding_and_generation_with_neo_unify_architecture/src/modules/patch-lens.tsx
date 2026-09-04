import React, { useCallback, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearStudio, drawLabel, drawLegend, drawPhoto, useObservedCanvas } from './studio-kit';

const W = 960;
const H = 540;
const STAGES = ['选取 patch', '两层卷积', '位置编码', '视觉 token', '像素解码'];
type View = 'flow' | 'evidence';

const flowFeedback = [
  '输入是原生图像或噪声。此处只取一个 32×32 patch 作为追踪对象；整张图会以同样方式并行切分。',
  '两层卷积依次使用步幅 16 和 2，并配合 GELU；总步幅为 32，因此一个输出位置覆盖一个 32×32 patch。',
  '卷积结果加入二维正弦位置编码；<img> 与 </img> 用于标出整段视觉内容的边界。',
  '图像接口输出视觉 token。它随后投影并经过共享主干；主干内部如何交互留到第 4 节。',
  '生成侧使用 MLP 头把主干隐藏状态直接预测为像素 patch。理解侧输出文字，不属于这一图像解码放大图。',
];

function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tone: string,
  active: boolean,
  fill: string = C.white,
) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = active ? C.control : tone;
  ctx.lineWidth = active ? 4 : 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, tone: string, active: boolean) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.22;
  ctx.strokeStyle = tone;
  ctx.fillStyle = tone;
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - 9, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(angle - 0.48), y2 - 10 * Math.sin(angle - 0.48));
  ctx.lineTo(x2 - 10 * Math.cos(angle + 0.48), y2 - 10 * Math.sin(angle + 0.48));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function stageRail(ctx: CanvasRenderingContext2D, stage: number) {
  const startX = 62;
  const gap = 208;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(startX, 82);
  ctx.lineTo(startX + gap * 4, 82);
  ctx.stroke();
  ctx.strokeStyle = C.success;
  ctx.beginPath();
  ctx.moveTo(startX, 82);
  ctx.lineTo(startX + gap * stage, 82);
  ctx.stroke();
  STAGES.forEach((name, index) => {
    const x = startX + gap * index;
    ctx.fillStyle = index === stage ? C.control : index < stage ? C.success : C.white;
    ctx.strokeStyle = index <= stage ? C.success : C.border;
    ctx.lineWidth = index === stage ? 4 : 2;
    ctx.beginPath();
    ctx.arc(x, 82, index === stage ? 12 : 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawLabel(ctx, `${index + 1} ${name}`, x, 111, index === stage ? C.control : index < stage ? C.success : C.muted, 10.5, 'center');
  });
}

function drawFlow(ctx: CanvasRenderingContext2D, stage: number) {
  stageRail(ctx, stage);

  panel(ctx, 24, 132, 156, 286, C.current, stage === 0);
  drawLabel(ctx, '① 选取 patch', 102, 158, stage === 0 ? C.control : C.text, 13, 'center');
  drawPhoto(ctx, 44, 178, 116, 104, C.current);
  const cols = 4;
  const rows = 4;
  const cellW = 116 / cols;
  const cellH = 104 / rows;
  ctx.strokeStyle = C.contour;
  ctx.lineWidth = 1;
  for (let col = 1; col < cols; col += 1) {
    ctx.beginPath(); ctx.moveTo(44 + col * cellW, 178); ctx.lineTo(44 + col * cellW, 282); ctx.stroke();
  }
  for (let row = 1; row < rows; row += 1) {
    ctx.beginPath(); ctx.moveTo(44, 178 + row * cellH); ctx.lineTo(160, 178 + row * cellH); ctx.stroke();
  }
  ctx.strokeStyle = C.control;
  ctx.lineWidth = 4;
  ctx.strokeRect(44 + cellW * 2 + 2, 178 + cellH + 2, cellW - 4, cellH - 4);
  drawLabel(ctx, '选中一个 32×32 patch', 102, 312, C.current, 11.5, 'center');
  drawLabel(ctx, '整图按相同规则并行切分', 102, 338, C.muted, 10, 'center');
  drawLabel(ctx, '图像或噪声均可输入', 102, 386, C.muted, 10.5, 'center');

  panel(ctx, 204, 132, 194, 286, C.success, stage === 1);
  drawLabel(ctx, '② 两层卷积', 301, 158, stage === 1 ? C.control : C.text, 13, 'center');
  panel(ctx, 225, 180, 152, 66, C.aux, false, '#f6f2ff');
  drawLabel(ctx, 'Conv · 步幅 16', 301, 207, C.aux, 12.5, 'center');
  drawLabel(ctx, '+ GELU', 301, 230, C.muted, 10.5, 'center');
  drawLabel(ctx, '↓', 301, 268, C.control, 18, 'center');
  panel(ctx, 225, 286, 152, 66, C.aux, false, '#f6f2ff');
  drawLabel(ctx, 'Conv · 步幅 2', 301, 313, C.aux, 12.5, 'center');
  drawLabel(ctx, '总步幅 16×2=32', 301, 336, C.text, 10.5, 'center');
  drawLabel(ctx, '处理：聚合局部像素', 301, 386, C.muted, 10.5, 'center');

  panel(ctx, 422, 132, 132, 286, C.success, stage === 2);
  drawLabel(ctx, '③ 位置编码', 488, 158, stage === 2 ? C.control : C.text, 13, 'center');
  ctx.strokeStyle = C.current;
  ctx.lineWidth = 2;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#e7eef8' : '#f2faf6';
      ctx.fillRect(450 + col * 19, 196 + row * 19, 16, 16);
    }
  }
  drawLabel(ctx, '2D 正弦位置编码', 488, 300, C.current, 11.5, 'center');
  drawLabel(ctx, '保留 H / W 空间索引', 488, 325, C.muted, 10, 'center');
  drawLabel(ctx, '<img> … </img>', 488, 353, C.success, 10.5, 'center');
  drawLabel(ctx, '标出视觉内容边界', 488, 386, C.muted, 10, 'center');

  panel(ctx, 578, 132, 160, 286, C.current, stage === 3);
  drawLabel(ctx, '④ 接口输出', 658, 158, stage === 3 ? C.control : C.text, 12.5, 'center');
  ctx.fillStyle = '#e7f4ec';
  ctx.strokeStyle = C.success;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(626, 190, 64, 64, 10);
  ctx.fill();
  ctx.stroke();
  drawLabel(ctx, '图', 658, 230, C.success, 20, 'center');
  drawLabel(ctx, '1 个视觉 token', 658, 282, C.success, 11.5, 'center');
  ctx.fillStyle = '#edf2f8';
  ctx.fillRect(598, 306, 120, 48);
  drawLabel(ctx, '共享主干', 658, 327, C.current, 11, 'center');
  drawLabel(ctx, '内部见第 4 节', 658, 346, C.muted, 9.5, 'center');
  drawLabel(ctx, '这里只作为前后连接', 658, 386, C.muted, 10, 'center');

  panel(ctx, 762, 132, 174, 286, C.border, stage === 4);
  drawLabel(ctx, '⑤ 生成侧像素解码', 849, 158, stage === 4 ? C.control : C.text, 12.5, 'center');
  panel(ctx, 783, 188, 132, 72, C.success, stage === 4, '#f2faf6');
  drawLabel(ctx, 'MLP 头', 849, 215, C.success, 13, 'center');
  drawLabel(ctx, '隐藏状态 → 像素', 849, 240, C.text, 10.5, 'center');
  drawLabel(ctx, '↓', 849, 286, C.control, 18, 'center');
  panel(ctx, 797, 310, 104, 66, C.success, stage === 4, '#f2faf6');
  drawLabel(ctx, '预测 patch', 849, 337, C.success, 11.5, 'center');
  drawLabel(ctx, '32×32 像素', 849, 360, C.muted, 10, 'center');
  drawLabel(ctx, '理解侧不走像素解码', 849, 400, C.muted, 9.5, 'center');

  arrow(ctx, 180, 275, 204, 275, C.current, stage >= 1);
  arrow(ctx, 398, 275, 422, 275, C.success, stage >= 2);
  arrow(ctx, 554, 275, 578, 275, C.success, stage >= 3);
  arrow(ctx, 738, 275, 762, 275, C.success, stage >= 4);

  ctx.fillStyle = '#fff8eb';
  ctx.strokeStyle = C.control;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(24, 438, 912, 58, 10);
  ctx.fill();
  ctx.stroke();
  drawLabel(ctx, '逻辑关系', 45, 462, C.control, 11.5);
  drawLabel(ctx, '图像接口位于主干两端：左侧把像素编码为视觉 token，右侧仅在生成任务中把隐藏状态解码为像素。', 122, 462, C.text, 11);
  drawLabel(ctx, '共享主干只作为连接点出现，内部交互不在本节重复；重建实验用于检查这套像素接口的信息保留能力。', 122, 484, C.muted, 10.5);
  drawLegend(ctx, [
    { label: '当前步骤', color: C.control },
    { label: '图像接口', color: C.success },
    { label: '主干连接点', color: C.current },
  ], 246, 520, 190);
}

function drawEvidence(ctx: CanvasRenderingContext2D) {
  drawLabel(ctx, '重建证据与结构流程是什么关系？', 32, 88, C.text, 16);
  drawLabel(ctx, '它不是新的网络步骤，而是对“视觉 token 是否保留足够像素信息”的独立实验检查。', 32, 114, C.muted, 11.5);

  panel(ctx, 30, 145, 268, 280, C.current, true, '#f2f5fa');
  drawLabel(ctx, '① 实验协议', 164, 176, C.current, 13.5, 'center');
  drawLabel(ctx, '模型：NEO-unify 2B', 54, 218, C.text, 12);
  drawLabel(ctx, '数据：MS-COCO 2017', 54, 250, C.text, 12);
  drawLabel(ctx, '训练：冻结理解分支', 54, 282, C.text, 12);
  drawLabel(ctx, '步数：90K 预训练步', 54, 314, C.text, 12);
  drawLabel(ctx, '问题：能否从 token 恢复像素？', 54, 366, C.control, 11.5);
  drawLabel(ctx, '只测试图像接口', 54, 396, C.muted, 10.5);

  panel(ctx, 346, 145, 280, 280, C.success, true, '#f2faf6');
  drawLabel(ctx, '② 同表结果', 486, 176, C.success, 13.5, 'center');
  drawLabel(ctx, '模型 / 压缩 / 分辨率', 370, 211, C.muted, 10.5);
  drawLabel(ctx, 'PSNR / SSIM', 596, 211, C.muted, 10.5, 'right');
  drawLabel(ctx, 'NEO 2B · 32× · 512', 370, 249, C.success, 11.5);
  drawLabel(ctx, '31.56 / 0.85', 596, 249, C.success, 11.5, 'right');
  drawLabel(ctx, 'FLUX VAE · 8× · 512', 370, 293, C.text, 11.5);
  drawLabel(ctx, '31.56 / 0.93', 596, 293, C.text, 11.5, 'right');
  drawLabel(ctx, 'UAE DINO-L · 14× · 256', 370, 337, C.text, 11.5);
  drawLabel(ctx, '32.74 / 0.94', 596, 337, C.text, 11.5, 'right');
  drawLabel(ctx, '指标越高越好', 370, 390, C.muted, 10.5);

  panel(ctx, 674, 145, 256, 280, C.control, true, '#fff8eb');
  drawLabel(ctx, '③ 可以得出的结论', 802, 176, C.control, 13.5, 'center');
  drawLabel(ctx, '✓ 32× 压缩下仍能重建', 698, 222, C.success, 11.5);
  drawLabel(ctx, '✓ PSNR 接近 FLUX VAE', 698, 258, C.success, 11.5);
  drawLabel(ctx, '× SSIM 并未持平', 698, 306, C.failure, 11.5);
  drawLabel(ctx, '× 不同倍率不可直接排名', 698, 342, C.failure, 11.5);
  drawLabel(ctx, '论文结论：接近，而非最优', 698, 390, C.control, 11.5);

  arrow(ctx, 298, 285, 346, 285, C.current, true);
  arrow(ctx, 626, 285, 674, 285, C.success, true);
  ctx.fillStyle = '#edf2f8';
  ctx.fillRect(30, 452, 900, 52);
  drawLabel(ctx, '结构假设', 54, 477, C.current, 11.5);
  drawLabel(ctx, '轻量接口尽量保留像素信息', 124, 477, C.text, 11);
  drawLabel(ctx, '→', 342, 477, C.control, 16, 'center');
  drawLabel(ctx, '实验检验', 382, 477, C.success, 11.5);
  drawLabel(ctx, '用重建指标检查信息保留程度', 452, 477, C.text, 11);
  drawLabel(ctx, '→', 690, 477, C.control, 16, 'center');
  drawLabel(ctx, '有限结论', 724, 477, C.control, 11.5);
  drawLabel(ctx, '接近，不等于无损或最优', 794, 477, C.text, 11);
}

export const PatchLens: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState<View>('flow');
  const [stage, setStage] = useState(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    clearStudio(ctx, W, H);
    ctx.fillStyle = '#edf2f8';
    ctx.fillRect(0, 0, W, 58);
    drawLabel(ctx, view === 'flow' ? '图像接口内部：编码在主干之前，像素解码在主干之后' : '重建实验：验证接口，而不是新增流程', 28, 35, C.text, 17);
    drawLabel(ctx, view === 'flow' ? `当前：${stage + 1}/5 ${STAGES[stage]}` : 'Table 23 · p.30', 932, 35, C.control, 12.5, 'right');
    if (view === 'flow') drawFlow(ctx, stage);
    else drawEvidence(ctx);
  }, [stage, view]);

  useObservedCanvas(canvasRef, W, H, draw);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label={view === 'flow' ? `图像分支因果链，第 ${stage + 1} 步${STAGES[stage]}` : '图像接口重建证据及结论边界'}
      />
      <div className="ctrl" role="radiogroup" aria-label="切换结构流程与重建证据">
        <button type="button" role="radio" aria-checked={view === 'flow'} onClick={() => setView('flow')}>结构流程</button>
        <button type="button" role="radio" aria-checked={view === 'evidence'} onClick={() => setView('evidence')}>重建证据</button>
      </div>
      {view === 'flow' ? (
        <div className="ctrl" role="group" aria-label="逐步查看图像分支">
          {STAGES.map((name, index) => (
            <button key={name} type="button" aria-pressed={stage === index} onClick={() => setStage(index)}>{index + 1} · {name}</button>
          ))}
          <button type="button" disabled={stage === 4} onClick={() => setStage((value) => Math.min(4, value + 1))}>下一步</button>
        </div>
      ) : null}
      <div className={`feedback ${view === 'evidence' || stage === 4 ? 'good' : ''}`} aria-live="polite">
        {view === 'flow'
          ? flowFeedback[stage]
          : '重建实验检验的是“视觉 token 能否恢复像素”。它支持接口接近 VAE 的报告性结论，但不是文本路径、理解输出或全面最优的证据。'}
      </div>
      <blockquote className="paper-quote">
        “生成流通过多层感知机（MLP）头直接预测像素 patch，绕开深扩散头与 VAE 解码器，使表示空间能够端到端学习。”
        <cite>论文依据（中文释义）：SenseNova-U1, §3.1 Patch Decoding Layer, p.7</cite>
      </blockquote>
      <p className="note">证据边界（Table 23，p.30）：MS-COCO 2017、冻结理解分支、90K 预训练步；被测模型为 NEO-unify 2B。不同压缩倍率与分辨率不可直接排名，论文主张是 32× 压缩下仍接近 FLUX.1-dev VAE，而非表内最优。</p>
    </div>
  );
};

export default PatchLens;
