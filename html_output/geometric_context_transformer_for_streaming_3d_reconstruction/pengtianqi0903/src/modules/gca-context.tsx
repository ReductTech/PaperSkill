import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CanvasViewport } from '../components/CanvasViewport';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 560;
const C = {
  bg: '#f5f8f0',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#d97706',
  purple: '#7c3aed',
  text: '#21324a',
  muted: '#68778f',
  border: '#d7deea',
  white: '#ffffff',
  redSoft: '#fff1f2',
};

type CanvasDraw = (ctx: CanvasRenderingContext2D) => void;
type ContextKey = 'anchor' | 'window' | 'memory';

const CONTEXT_ORDER: ContextKey[] = ['anchor', 'window', 'memory'];
const CONTEXTS: Record<
  ContextKey,
  {
    name: string;
    chip: string;
    color: string;
    coverage: string;
    retained: string;
    responsibility: [string, string];
    lifetime: [string, string];
    lostInformation: [string, string];
    lostSummary: string;
    consequence: [string, string];
  }
> = {
  anchor: {
    name: 'Anchor Context',
    chip: 'Anchor',
    color: C.blue,
    coverage: '最初 n 帧',
    retained: '完整 M + c + a + 4r',
    responsibility: ['固定坐标系', '提供规范尺度参照'],
    lifetime: ['序列最初 n 帧', '进入后始终保留'],
    lostInformation: ['固定坐标系', '规范尺度参照'],
    lostSummary: '固定坐标系与规范尺度参照',
    consequence: ['当前预测缺少固定的', '坐标与尺度参考'],
  },
  window: {
    name: 'Pose-reference Window',
    chip: 'Window',
    color: C.green,
    coverage: '最近 k 帧',
    retained: '完整 M + c + a + 4r',
    responsibility: ['保留近期稠密重叠', '支持局部位姿注册'],
    lifetime: ['窗口随当前帧滑动', '普通帧离窗后转入 Memory'],
    lostInformation: ['最近 k 帧的', '稠密视觉重叠'],
    lostSummary: '最近 k 帧的稠密视觉重叠',
    consequence: ['当前帧的局部配准', '线索直接变弱'],
  },
  memory: {
    name: 'Trajectory Memory',
    chip: 'Memory',
    color: C.purple,
    coverage: '中间旧帧',
    retained: '仅 c + a + 4r = 6',
    responsibility: ['保留按时间排列的', '轻量轨迹线索'],
    lifetime: ['普通帧离开窗口后', '以每帧 6 token 持续保留'],
    lostInformation: ['Anchor 与窗口之间的', '中间轨迹线索'],
    lostSummary: 'Anchor 与窗口之间的中间轨迹线索',
    consequence: ['长程一致性约束', '直接变弱'],
  },
};

function useDrawCanvas(draw: CanvasDraw, height: number) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    try {
      const ctx = setupCanvas(canvas, W, height);
      draw(ctx);
      canvas.style.width = `${W}px`;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.classList.add('is-ready');
    } catch {
      // Text feedback remains available if Canvas is unavailable.
    }
  }, [draw, height]);
  return ref;
}

function label(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  color = C.text,
  size = 13,
  weight = 600,
) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.fillText(value, x, y);
}

function base(ctx: CanvasRenderingContext2D, height: number) {
  ctx.clearRect(0, 0, W, height);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, height);
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(12.5, 12.5, W - 25, height - 25);
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 8,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawToken(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  value: string,
  color: string,
  retained: boolean,
) {
  roundedRectPath(ctx, x, y, width, 36, 6);
  ctx.fillStyle = retained ? color : '#f8fafc';
  ctx.strokeStyle = retained ? color : C.border;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'center';
  label(ctx, value, x + width / 2, y + 23, retained ? C.white : C.muted, 10, 800);
  ctx.textAlign = 'left';
  if (!retained) {
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 7);
    ctx.lineTo(x + width - 8, y + 29);
    ctx.moveTo(x + width - 8, y + 7);
    ctx.lineTo(x + 8, y + 29);
    ctx.stroke();
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  active: boolean,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.setLineDash(active ? [6, 4] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 8, y2 - 5);
  ctx.lineTo(x2 - 8, y2 + 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const GcaTimeline: React.FC<WidgetProps> = ({ moduleId }) => {
  const [selected, setSelected] = useState<ContextKey>('memory');
  const feedbackId = `${moduleId}-timeline-feedback`;
  const tokenInfoId = `${moduleId}-token-info`;
  const selectedContext = CONTEXTS[selected];

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const h = 510;
      base(ctx, h);

      label(ctx, '① 帧内 token 组成', 26, 34, C.text, 14, 800);
      label(ctx, 'Context 是时间分区；token 是帧内表示', 304, 34, C.orange, 10, 750);

      roundedRectPath(ctx, 24, 46, 512, 108, 10);
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      drawToken(ctx, 40, 69, 96, 'M image', C.blue, true);
      label(ctx, '+', 145, 93, C.muted, 12, 800);
      drawToken(ctx, 161, 69, 30, 'c', C.blue, true);
      label(ctx, '+', 199, 93, C.muted, 12, 800);
      drawToken(ctx, 215, 69, 30, 'a', C.blue, true);
      label(ctx, '+', 253, 93, C.muted, 12, 800);
      drawToken(ctx, 269, 69, 42, '4r', C.blue, true);
      label(ctx, 'M：image tokens', 40, 126, C.text, 10, 700);
      label(ctx, 'c + a + 4r = 6 个 context tokens', 142, 143, C.blue, 10, 750);

      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(327.5, 58);
      ctx.lineTo(327.5, 143);
      ctx.stroke();
      label(ctx, 'c：camera token', 344, 75, C.text, 10, 700);
      label(ctx, 'a：learnable anchor token', 344, 97, C.text, 10, 700);
      label(ctx, 'a ≠ Anchor frames', 344, 118, C.red, 10, 800);
      label(ctx, '4r：论文未指定逐个手工语义', 344, 140, C.muted, 9, 650);

      label(ctx, '② 三类 Context 的时间覆盖', 26, 180, C.text, 14, 800);
      label(ctx, '示例：T=40，n=3，k=16', 385, 180, C.muted, 10, 650);

      const axisX = 30;
      const axisY = 198;
      const axisWidth = 500;
      const cellWidth = axisWidth / 40;
      const segmentBounds: Record<ContextKey, { x: number; width: number }> = {
        anchor: { x: axisX, width: cellWidth * 3 },
        memory: { x: axisX + cellWidth * 3, width: cellWidth * 21 },
        window: { x: axisX + cellWidth * 24, width: cellWidth * 16 },
      };

      for (let index = 0; index < 40; index += 1) {
        const context: ContextKey = index < 3 ? 'anchor' : index < 24 ? 'memory' : 'window';
        const spec = CONTEXTS[context];
        const isMemory = context === 'memory';
        const y = isMemory ? axisY + 9 : axisY;
        const height = isMemory ? 14 : 32;
        ctx.save();
        ctx.globalAlpha = selected === context ? 1 : 0.34;
        ctx.fillStyle = spec.color;
        ctx.fillRect(axisX + index * cellWidth + 1, y, Math.max(2, cellWidth - 2), height);
        ctx.restore();
      }

      const activeBounds = segmentBounds[selected];
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 3;
      ctx.strokeRect(activeBounds.x - 2, axisY - 4, activeBounds.width + 4, 40);

      label(ctx, 'Anchor · F1–F3 full', 25, 250, selected === 'anchor' ? C.orange : C.muted, 10, 700);
      label(ctx, 'Memory · F4–F24 每帧 6', 184, 250, selected === 'memory' ? C.orange : C.muted, 10, 700);
      label(ctx, 'Window · F25–F40 full', 388, 250, selected === 'window' ? C.orange : C.muted, 10, 700);

      label(ctx, `③ 所选 Context：${selectedContext.name}`, 26, 282, selectedContext.color, 14, 800);
      ctx.textAlign = 'right';
      label(ctx, selectedContext.coverage, 531, 282, C.orange, 11, 800);
      ctx.textAlign = 'left';

      roundedRectPath(ctx, 24, 294, 512, 198, 10);
      ctx.fillStyle = C.white;
      ctx.strokeStyle = selectedContext.color;
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(327.5, 307);
      ctx.lineTo(327.5, 479);
      ctx.stroke();

      label(ctx, '保留形态', 40, 318, C.muted, 10, 800);
      const retainsImage = selected !== 'memory';
      drawToken(ctx, 40, 330, 88, 'M image', selectedContext.color, retainsImage);
      label(ctx, '+', 136, 354, C.muted, 12, 800);
      drawToken(ctx, 151, 330, 30, 'c', selectedContext.color, true);
      label(ctx, '+', 189, 354, C.muted, 12, 800);
      drawToken(ctx, 204, 330, 30, 'a', selectedContext.color, true);
      label(ctx, '+', 242, 354, C.muted, 12, 800);
      drawToken(ctx, 257, 330, 43, '4r', selectedContext.color, true);

      label(ctx, selectedContext.retained, 40, 389, selectedContext.color, 11, 800);
      if (selected === 'memory') {
        label(ctx, 'M 直接丢弃，不是池化成 6', 40, 412, C.red, 10, 750);
      } else {
        label(ctx, '图像 token 与 6 个 context token 均保留', 40, 412, C.muted, 9, 650);
      }

      label(ctx, '负责信息', 345, 318, C.muted, 10, 800);
      label(ctx, selectedContext.responsibility[0], 345, 339, C.text, 10, 700);
      label(ctx, selectedContext.responsibility[1], 345, 358, C.text, 10, 700);
      label(ctx, '时效', 345, 384, C.muted, 10, 800);
      label(ctx, selectedContext.lifetime[0], 345, 404, C.text, 9, 700);
      label(ctx, selectedContext.lifetime[1], 345, 422, C.text, 9, 700);
      label(ctx, '若缺失（教学推演）', 345, 449, C.red, 10, 800);
      label(ctx, selectedContext.consequence[0], 345, 469, C.red, 9, 700);
      label(ctx, selectedContext.consequence[1], 345, 486, C.red, 9, 700);
    },
    [selected, selectedContext],
  );

  const canvasRef = useDrawCanvas(draw, 510);
  const feedback: Record<ContextKey, string> = {
    anchor:
      '观察：时间轴突出最初 n 个完整帧。机制：Anchor Context 长期保留 M+c+a+4r，用作固定坐标与规范尺度参照；若缺失，这两类参照会变弱。边界：这里的 Anchor Context 是帧集合，不是帧内的 learnable anchor token a。',
    window:
      '观察：时间轴突出最近 k 个完整帧。机制：Window 随当前帧滑动，以 M+c+a+4r 提供近期稠密重叠和局部位姿注册；若缺失，当前帧的局部配准线索会变弱。边界：普通帧离开 Window 后不是全部删除，而是转成 Memory 形态。',
    memory:
      '观察：中间旧帧在时间轴上变成窄条，保留区中的 M 被划掉。机制：Memory 直接丢弃 M 个 image tokens，只留 c+a+4r=6 来延续轻量轨迹线索；若缺失，长程一致性线索会变弱。边界：这不是把 M 池化成 6，4r 也没有论文指定的逐个手工语义。',
  };

  return (
    <div>
      <CanvasViewport label="GCA 帧内 token、时间覆盖与所选上下文详情，可横向滚动查看" mobileMinWidth={560}>
        <canvas
          ref={canvasRef}
          width={W}
          height={510}
          role="img"
          aria-label={`三层 GCA 图。第一层：一帧由 M 个 image tokens 与 c、a、4r 六个 context tokens 组成；a 是 learnable anchor token，不等于 Anchor frames，四个 register tokens 没有论文指定的逐个手工语义。第二层：示例 T=40、n=3、k=16，最初 3 帧是完整 Anchor，中间第 4 到 24 帧每帧只留 6 token，最近第 25 到 40 帧完整留在 Window。第三层：当前选择 ${selectedContext.name}，保留${selectedContext.retained}，负责${selectedContext.responsibility.join('，')}，时效为${selectedContext.lifetime.join('，')}；若缺失，${selectedContext.consequence.join('，')}。缺失后果是教学推演。`}
          aria-describedby={`${feedbackId} ${tokenInfoId}`}
        />
      </CanvasViewport>
      <div className="ctrl" role="group" aria-label="选择一类几何上下文查看详情">
        {CONTEXT_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={`chip ${selected === key ? 'selected' : ''}`}
            aria-pressed={selected === key}
            onClick={() => setSelected(key)}
          >
            {CONTEXTS[key].chip}
          </button>
        ))}
      </div>
      <div id={feedbackId} className="feedback" role="status" aria-live="polite">
        {feedback[selected]}
      </div>
      <div id={tokenInfoId} className="hotspot-info">
        <b>先分清两个层级：</b>三类 Context 决定“哪些时间位置以什么形态可见”；M、c、a、4r 描述“一帧内部有哪些 token”。其中 <b>a 不等于 Anchor frames</b>；论文也没有给四个 register token 分别指定手工语义。
      </div>
    </div>
  );
};

export const ContextAblation: React.FC<WidgetProps> = ({ moduleId }) => {
  const [missing, setMissing] = useState<ContextKey>('anchor');
  const feedbackId = `${moduleId}-context-feedback`;
  const activeContext = CONTEXTS[missing];

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const h = 310;
      base(ctx, h);
      label(ctx, '少了哪类信息', 27, 35, C.text, 14, 800);
      label(ctx, '→', 270, 35, C.orange, 16, 800);
      label(ctx, '当前帧的直接后果', 324, 35, C.text, 14, 800);
      label(ctx, '教学推演 · 不是论文定量消融', 350, 55, C.muted, 10, 650);

      CONTEXT_ORDER.forEach((key, index) => {
        const spec = CONTEXTS[key];
        const selected = key === missing;
        const y = 70 + index * 67;

        roundedRectPath(ctx, 25, y, 208, 52, 8);
        ctx.fillStyle = selected ? C.redSoft : C.white;
        ctx.strokeStyle = selected ? C.red : C.border;
        ctx.lineWidth = selected ? 3 : 1.5;
        ctx.fill();
        ctx.stroke();
        label(ctx, spec.chip, 38, y + 20, selected ? C.red : spec.color, 11, 800);
        label(ctx, spec.lostInformation[0], 96, y + 19, selected ? C.red : C.muted, 9, 650);
        label(ctx, spec.lostInformation[1], 96, y + 36, selected ? C.red : C.muted, 9, 650);

        if (selected) {
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(211, y + 15);
          ctx.lineTo(222, y + 37);
          ctx.moveTo(222, y + 15);
          ctx.lineTo(211, y + 37);
          ctx.stroke();
        }

        drawArrow(ctx, 244, y + 26, 309, y + 26, selected ? C.red : C.border, selected);
        if (selected) {
          label(ctx, '缺失', 260, y + 17, C.red, 9, 800);
        }

        roundedRectPath(ctx, 321, y, 214, 52, 8);
        ctx.fillStyle = selected ? C.redSoft : '#f8fafc';
        ctx.strokeStyle = selected ? C.red : C.border;
        ctx.lineWidth = selected ? 3 : 1.5;
        ctx.fill();
        ctx.stroke();
        label(ctx, spec.consequence[0], 336, y + 21, selected ? C.red : C.muted, 10, selected ? 800 : 650);
        label(ctx, spec.consequence[1], 336, y + 39, selected ? C.red : C.muted, 10, selected ? 800 : 650);
      });

      label(ctx, '红色链路只表示由结构职责推出的直接影响', 151, 289, C.muted, 10, 650);
    },
    [missing],
  );

  const canvasRef = useDrawCanvas(draw, 310);
  const feedback = `教学推演：移除 ${activeContext.name}，少了${activeContext.lostSummary}，因此${activeContext.consequence.join('')}；这不是论文报告的定量消融值。`;

  return (
    <div>
      <CanvasViewport label="三类上下文缺失与直接后果对照图，可横向滚动查看" mobileMinWidth={560}>
        <canvas
          ref={canvasRef}
          width={W}
          height={310}
          role="img"
          aria-label={`教学推演：当前移除 ${activeContext.name}。缺失的信息是${activeContext.lostSummary}；直接后果是${activeContext.consequence.join('，')}。其余两条因果链作为未选参考。`}
          aria-describedby={feedbackId}
        />
      </CanvasViewport>
      <div className="ctrl" role="group" aria-label="选择要移除的一类上下文">
        {CONTEXT_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={`chip ${missing === key ? 'selected' : ''}`}
            aria-pressed={missing === key}
            onClick={() => setMissing(key)}
          >
            移除 {CONTEXTS[key].chip}
          </button>
        ))}
      </div>
      <div id={feedbackId} className="feedback bad" role="status" aria-live="polite">
        {feedback}
      </div>
      <div className="hotspot-info">
        <b>阅读方式：</b>一次只移除一类信息，沿红色箭头读取“缺失信息 → 直接后果”。完整 GCA 同时使用三类上下文；这里用于解释结构职责，不代表论文逐项测得了这些误差变化。
      </div>
    </div>
  );
};
