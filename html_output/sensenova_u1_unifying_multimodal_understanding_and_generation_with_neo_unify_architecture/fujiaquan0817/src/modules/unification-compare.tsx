import React, { useCallback, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  C,
  clearStudio,
  drawDesk,
  drawGuide,
  drawLabel,
  drawLegend,
  useObservedCanvas,
} from './studio-kit';

const W = 960;
const H = 540;

// Sections 1 and 2.2 describe a research progression rather than four equivalent
// architectures: each route advances one layer of unification while leaving a
// different bottleneck for the next route to address.
type Route = 'cascaded' | 'discrete' | 'continuous' | 'native';
type Tone = 'good' | 'partial' | 'bad';

type Criterion = {
  label: '视觉接口' | '表示空间' | '训练目标';
  value: string;
  tone: Tone;
};

type RouteSpec = {
  id: Route;
  order: string;
  chip: string;
  control: string;
  stage: string;
  headline: string;
  works: string;
  advance: string;
  unresolved: string;
  consequence: string;
  basis: string;
  cites: string;
  verdict: string;
  color: string;
  cls: '' | 'good' | 'bad';
  criteria: Criterion[];
};

const ROUTES: RouteSpec[] = [
  {
    id: 'cascaded',
    order: '01',
    chip: '系统共存',
    control: '系统共存',
    stage: '系统级统一',
    headline: '先让理解与生成进入同一个模型',
    works: 'Show-o · Janus · OmniGen · BAGEL',
    advance: '证明感知与图像生成可以共享模型外壳或主干，“统一模型”由此成为可行方向。',
    unresolved: '理解仍走 VE，生成仍走 VAE 或扩散头；tokenizer、潜空间与任务路径彼此分开。',
    consequence: '两类能力只是被连接起来，视觉表示与学习目标没有在同一系统内共同形成。',
    basis: '早期 UMM 虽让感知与生成共存，却仍由不同 tokenizer、潜空间或辅助模块连接，属于松散集成。',
    cites: '§1 [14, 18, 28, 75, 139, 140]；§2.2',
    verdict: '它解决了“能否共存”，但统一仍停在系统层。',
    color: C.failure,
    cls: 'bad',
    criteria: [
      { label: '视觉接口', value: 'VE / VAE 分开', tone: 'bad' },
      { label: '表示空间', value: '语义 / 潜空间分开', tone: 'bad' },
      { label: '训练目标', value: '目标与流程分开', tone: 'bad' },
    ],
  },
  {
    id: 'discrete',
    order: '02',
    chip: '离散 token',
    control: '离散编码',
    stage: '序列形式统一',
    headline: '把所有模态改写成同一种 token 序列',
    works: 'Chameleon · Emu3 · UniTok · DualToken',
    advance: '文本、图像等模态都映射为离散 token，可交给同一自回归框架建模与推理。',
    unresolved: '离散化会压缩非语言信号，连续的视觉细节只能由有限码本或视觉词表近似表达。',
    consequence: '架构和序列形式统一了，但高层语义、视觉保真度与表现力仍会受到有损表示限制。',
    basis: '论文肯定离散 token 带来的跨模态推理便利，同时指出有损离散化会限制语义与视觉保真度。',
    cites: '§1 [23, 73, 78, 90, 116, 122, 125, 135]；§2.2',
    verdict: '它统一了计算形式，但没有消除表示瓶颈。',
    color: C.control,
    cls: '',
    criteria: [
      { label: '视觉接口', value: '离散 tokenizer', tone: 'partial' },
      { label: '表示空间', value: '共享离散序列', tone: 'good' },
      { label: '训练目标', value: '统一自回归', tone: 'good' },
    ],
  },
  {
    id: 'continuous',
    order: '03',
    chip: '连续表示',
    control: '连续表示',
    stage: '视觉表示统一',
    headline: '用共享连续表示兼顾语义与重建',
    works: 'PRISM · TUNA · UniFlow · RAE / Transfusion',
    advance: '避免把视觉完全词表化，让理解与生成共享连续视觉接口和表示空间。',
    unresolved: '同一中间表示仍要同时承担语义抽象与像素细节；压缩率、重建和任务目标之间存在取舍。',
    consequence: '表示更连续，却仍未消除“抽象得足够好”与“重建得足够细”之间的根本张力。',
    basis: '连续接口试图在共享空间内协调概念结构和高保真重建，但论文判断这种协调往往伴随取舍。',
    cites: '§1 [35, 84, 127, 152, 168, 170]；§2.2',
    verdict: '它推进到表示层，但语义与像素仍需取舍。',
    color: C.control,
    cls: '',
    criteria: [
      { label: '视觉接口', value: '连续共享接口', tone: 'good' },
      { label: '表示空间', value: '共享中间表示', tone: 'partial' },
      { label: '训练目标', value: '方案各异 / 有取舍', tone: 'partial' },
    ],
  },
  {
    id: 'native',
    order: '04',
    chip: '本文路线',
    control: '本文路线',
    stage: '原生端到端统一',
    headline: '让表示从原生像素与词的联合训练中形成',
    works: 'SenseNova-U1-8B-MoT · SenseNova-U1-A3B-MoT',
    advance: '去掉预训练 VE、VAE 与深解码头，直接从像素和词出发，联合优化语言 CE 与像素流匹配。',
    unresolved: '模型仍保留两层卷积和类 MLP 的轻量接口；“原生统一”首先是结构与训练主张。',
    consequence: '问题从“选哪套预训练视觉表示”转为“让任务表示在统一模型内部端到端自组织”。',
    basis: '论文将 SenseNova-U1 定位为迈向真正端到端统一的第一步；性能结论仍需按具体实验协议检验。',
    cites: '§1；§2.2 NEO-unify [112]',
    verdict: '本文针对前三类瓶颈提出端到端路线，但不等于无条件全面领先。',
    color: C.success,
    cls: 'good',
    criteria: [
      { label: '视觉接口', value: '轻量原生像素接口', tone: 'good' },
      { label: '表示空间', value: '同序列共享注意力', tone: 'good' },
      { label: '训练目标', value: 'CE + 流匹配联合', tone: 'good' },
    ],
  },
];

const TIMELINE = { x: 28, y: 58, w: 904, h: 94 };

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  color: string,
  fontSize = 12,
  weight = 600,
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${weight} ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const lines: string[] = [];
  let line = '';
  Array.from(text).forEach((char) => {
    const candidate = line + char;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = char;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  lines.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
  ctx.restore();
}

function toneColor(tone: Tone) {
  if (tone === 'good') return C.success;
  if (tone === 'bad') return C.failure;
  return C.control;
}

export const UnificationCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [route, setRoute] = useState<Route>('cascaded');
  const spec = ROUTES.find((item) => item.id === route) as RouteSpec;

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    clearStudio(ctx, W, H);
    drawDesk(ctx, W, H, 500);
    drawLabel(ctx, '研究演进：每条路线都推进了一层，也留下了新的瓶颈', 28, 30, C.text, 17);
    drawLabel(ctx, '点击阶段，查看“推进 → 未解 → 后果”', 932, 30, C.muted, 11, 'right');

    const segmentW = TIMELINE.w / ROUTES.length;
    ROUTES.forEach((item, index) => {
      const x = TIMELINE.x + index * segmentW;
      const selected = item.id === route;
      const centerX = x + segmentW / 2;

      if (index < ROUTES.length - 1) {
        drawGuide(ctx, centerX + 46, 89, centerX + segmentW - 46, 89, C.border);
      }

      ctx.fillStyle = selected ? '#eef2f8' : C.white;
      ctx.strokeStyle = selected ? item.color : C.border;
      ctx.lineWidth = selected ? 3 : 1.5;
      ctx.beginPath();
      ctx.roundRect(x + 6, TIMELINE.y, segmentW - 12, TIMELINE.h, 8);
      ctx.fill();
      ctx.stroke();

      drawLabel(ctx, item.order, x + 22, 78, selected ? item.color : C.muted, 11);
      drawLabel(ctx, item.chip, centerX, 98, selected ? item.color : C.text, 14, 'center');
      drawLabel(ctx, item.stage, centerX, 124, C.muted, 11, 'center');
      if (selected) {
        ctx.fillStyle = item.color;
        ctx.fillRect(x + 20, 143, segmentW - 40, 3);
      }
    });

    // Selected route: what it solved, what remains split, and why the next route arose.
    ctx.fillStyle = C.white;
    ctx.strokeStyle = spec.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(28, 172, 568, 310, 8);
    ctx.fill();
    ctx.stroke();
    drawLabel(ctx, `${spec.order} · ${spec.stage}`, 48, 196, spec.color, 13);
    drawLabel(ctx, spec.headline, 48, 220, C.text, 16);
    drawLabel(ctx, spec.works, 48, 242, C.muted, 11);

    const bands = [
      { label: '推进', text: spec.advance, y: 260, h: 62, color: C.success, fill: '#eef8f2' },
      { label: route === 'native' ? '边界' : '未解', text: spec.unresolved, y: 330, h: 68, color: route === 'native' ? C.control : C.failure, fill: route === 'native' ? '#fff7e8' : '#fff1f3' },
      { label: '后果', text: spec.consequence, y: 406, h: 60, color: C.control, fill: '#fff7e8' },
    ];
    bands.forEach((band) => {
      ctx.fillStyle = band.fill;
      ctx.strokeStyle = band.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(46, band.y, 532, band.h, 7);
      ctx.fill();
      ctx.stroke();
      drawLabel(ctx, band.label, 62, band.y + 21, band.color, 12);
      drawWrappedText(ctx, band.text, 112, band.y + 12, 448, 19, C.text, 11.5, 600);
    });

    // A stable three-layer diagnosis lets the learner compare routes without
    // reducing their distinct limitations to a single unified/not-unified score.
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(614, 172, 318, 310, 8);
    ctx.fill();
    ctx.stroke();
    drawLabel(ctx, '三层诊断', 634, 198, C.text, 15);
    drawLabel(ctx, '同一标准，结论并不相同', 912, 198, C.muted, 10.5, 'right');

    spec.criteria.forEach((criterion, index) => {
      const y = 226 + index * 62;
      const color = toneColor(criterion.tone);
      ctx.fillStyle = index % 2 === 0 ? '#f8fafc' : C.white;
      ctx.fillRect(632, y, 282, 50);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(646, y + 25, 5, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, criterion.label, 660, y + 17, C.muted, 11);
      drawLabel(ctx, criterion.value, 898, y + 32, color, 12, 'right');
    });

    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(634, 420);
    ctx.lineTo(912, 420);
    ctx.stroke();
    drawLabel(ctx, '关键判断', 634, 442, spec.color, 12);
    drawWrappedText(ctx, spec.verdict, 704, 432, 204, 18, C.text, 11.5, 700);

    drawLegend(ctx, [
      { label: '已有推进', color: C.success },
      { label: '仍未解决', color: C.failure },
      { label: '取舍 / 证据边界', color: C.control },
    ], 112, 516, 242);
  }, [route, spec]);

  useObservedCanvas(canvasRef, W, H, draw);

  const onKeyDown = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const index = ROUTES.findIndex((item) => item.id === route);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      setRoute(ROUTES[(index + 1) % ROUTES.length].id);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      setRoute(ROUTES[(index - 1 + ROUTES.length) % ROUTES.length].id);
    } else if (event.key === 'Home') {
      setRoute(ROUTES[0].id);
    } else if (event.key === 'End') {
      setRoute(ROUTES[ROUTES.length - 1].id);
    } else {
      return;
    }
    event.preventDefault();
  };

  const onCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) * W / rect.width;
    const y = (event.clientY - rect.top) * H / rect.height;
    if (x < TIMELINE.x || x > TIMELINE.x + TIMELINE.w || y < TIMELINE.y || y > TIMELINE.y + TIMELINE.h) return;
    const index = Math.min(ROUTES.length - 1, Math.floor((x - TIMELINE.x) / (TIMELINE.w / ROUTES.length)));
    setRoute(ROUTES[index].id);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        role="group"
        aria-label={`四类统一路线的研究演进，当前为${spec.stage}：${spec.verdict}`}
        onClick={onCanvasClick}
        onKeyDown={onKeyDown}
      />
      <div className="ctrl unification-route-controls" role="radiogroup" aria-label="选择一条统一路线">
        {ROUTES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={route === item.id}
            className={route === item.id ? 'chip active' : 'chip'}
            onClick={() => setRoute(item.id)}
          >
            {item.control}
          </button>
        ))}
      </div>
      <div className={`feedback ${spec.cls}`} aria-live="polite">{spec.verdict}</div>
      <blockquote className="paper-quote" aria-live="polite">
        {spec.basis}
        <cite>论文依据（中文释义）：SenseNova-U1 {spec.cites}</cite>
      </blockquote>
      <p className="note">
        证据边界：这里归纳的是论文 Introduction 与 Related Work 的结构性判断，不是跨论文的实验排名。本文路线仍保留轻量编码与解码接口，其效果需在第 9 章按具体模型和评测协议判断。
      </p>
    </div>
  );
};

export default UnificationCompare;
