import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  COL,
  clearScene,
  drawPhoto,
  drawAxisBox,
  drawArrow,
  roundRect,
  label,
  legend,
} from './sceneKit';
import type { WidgetProps } from './registry';

// 模块 2.1（P5 热点）：点击同一句发言的四个成分，看两套提示各取走什么。
// 指针命中区在 Canvas 上按 1080×280 内在坐标换算；四个热点同时是真实 button，键盘可操作。

const W = 1080;
const H = 280;

type HotspotId = 'p-fact' | 'p-rel' | 'phi' | 'psi';
type FeedbackCls = '' | 'good' | 'bad';

const UTTERANCE = '上周五我和妈妈去了海边，她说下次想带上爸爸。';
const FACT = ['上周五去了海边', '妈妈提到下次想带上爸爸'];
const REL = ['我和妈妈一起出行', '关系从两人扩展到三人'];

const HOT_ORDER: HotspotId[] = ['p-fact', 'p-rel', 'phi', 'psi'];

const HOT_BOX: Record<HotspotId, { x0: number; y0: number; x1: number; y1: number }> = {
  'p-fact': { x0: 400, y0: 60, x1: 620, y1: 140 },
  'p-rel': { x0: 400, y0: 140, x1: 620, y1: 220 },
  phi: { x0: 660, y0: 40, x1: 1040, y1: 150 },
  psi: { x0: 660, y0: 150, x1: 1040, y1: 240 },
};

const HOT_ARIA: Record<HotspotId, string> = {
  'p-fact': '热点：事实提示 P_fact',
  'p-rel': '热点：关系提示 P_rel',
  phi: '热点：事实条目集合 Φi',
  psi: '热点：关系条目集合 Ψi',
};

const INFO: Record<HotspotId | 'none', string> = {
  none: '未选中任何成分：中区两套提示与右区条目都停在非激活灰态。',
  'p-fact': '事实提示 P_fact ｜ 状态：已选中 ｜ 产出条目数 2',
  'p-rel': '关系提示 P_rel ｜ 状态：已选中 ｜ 产出条目数 2',
  phi: '事实条目集合 Φi ｜ 状态：已收下 ｜ 条目数 2',
  psi: '关系条目集合 Ψi ｜ 状态：已收下 ｜ 条目数 2',
};

const FEEDBACK: Record<HotspotId | 'none', { text: string; cls: FeedbackCls }> = {
  none: { text: '点击任意成分，看看两套提示各取走什么。', cls: '' },
  'p-fact': {
    text: '事实提示 P_fact 只问“发生了什么”：抽出的内容说明成为事实条目。',
    cls: '',
  },
  'p-rel': {
    text: '关系提示 P_rel 只问“和谁、影响到谁”：抽出的关系说明成为关系条目。',
    cls: '',
  },
  phi: { text: 'Φi 收下 2 条事实条目，用自然语言写成，因此不需要实体消解。', cls: 'good' },
  psi: { text: 'Ψi 收下 2 条关系条目，记录人际动态与时间依赖。', cls: 'good' },
};

function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = h;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

// 激活路径：先铺 3 px 底线，再用 drawArrow 画出箭头
function activePath(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
  drawArrow(ctx, x1, y1, x2, y2, color, 9);
}

const PATHS: Record<HotspotId, { x1: number; y1: number; x2: number; y2: number }> = {
  'p-fact': { x1: 616, y1: 102, x2: 676, y2: 84 },
  'p-rel': { x1: 616, y1: 182, x2: 676, y2: 184 },
  phi: { x1: 364, y1: 140, x2: 676, y2: 116 },
  psi: { x1: 364, y1: 140, x2: 676, y2: 216 },
};

export const C2DualExtract: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ hot: HotspotId | null }>({ hot: null });
  const [hot, setHot] = useState<HotspotId | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; cls: FeedbackCls }>(FEEDBACK.none);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = () => {
      const cur = stateRef.current.hot;
      clearScene(ctx, W, H, true);

      // 左区 speechCard：发言卡内嵌 3 条文字线
      drawPhoto(ctx, 60, 60, 300, 160, -0.035, COL.axis);
      [
        { w: 250, y: 108 },
        { w: 214, y: 132 },
        { w: 168, y: 156 },
      ].forEach((ln) => bar(ctx, 86, ln.y, ln.w, 5, COL.muted));

      // 中区 promptPair：两套提示模板
      drawAxisBox(ctx, 400, 60, 220, 160);
      const blocks: { id: HotspotId; x: number; y: number; w: number; h: number; c: string }[] = [
        { id: 'p-fact', x: 408, y: 68, w: 204, h: 68, c: COL.blue },
        { id: 'p-rel', x: 408, y: 148, w: 204, h: 68, c: COL.purple },
      ];
      blocks.forEach((b) => {
        const on = cur === b.id;
        ctx.save();
        ctx.fillStyle = on ? 'rgba(217, 119, 6, 0.10)' : COL.white;
        roundRect(ctx, b.x, b.y, b.w, b.h, 6);
        ctx.fill();
        ctx.strokeStyle = on ? COL.orange : COL.axis;
        ctx.lineWidth = on ? 3 : 2;
        ctx.stroke();
        ctx.restore();
        bar(ctx, b.x + 18, b.y + 24, 128, 5, on ? b.c : COL.axis);
        bar(ctx, b.x + 18, b.y + 46, 92, 5, on ? b.c : COL.axis);
      });

      // 激活路径
      if (cur !== null) {
        const p = PATHS[cur];
        activePath(ctx, p.x1, p.y1, p.x2, p.y2, COL.blue);
      }

      // 右区 entriesPanel：上半 Φ、下半 Ψ
      drawAxisBox(ctx, 660, 40, 380, 200);
      ctx.save();
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(676, 150);
      ctx.lineTo(1024, 150);
      ctx.stroke();
      ctx.restore();

      const phiOn = cur === 'phi' || cur === 'p-fact';
      const psiOn = cur === 'psi' || cur === 'p-rel';
      FACT.forEach((s, i) => bar(ctx, 680, 84 + i * 32, 24 + s.length * 22, phiOn ? 8 : 5, phiOn ? COL.blue : COL.axis));
      REL.forEach((s, i) => bar(ctx, 680, 184 + i * 32, 24 + s.length * 22, psiOn ? 8 : 5, psiOn ? COL.purple : COL.axis));

      // 选中热点的橙色描边
      if (cur === 'phi') {
        ctx.save();
        ctx.strokeStyle = COL.orange;
        ctx.lineWidth = 3;
        roundRect(ctx, 672, 70, 348, 68, 6);
        ctx.stroke();
        ctx.restore();
      }
      if (cur === 'psi') {
        ctx.save();
        ctx.strokeStyle = COL.orange;
        ctx.lineWidth = 3;
        roundRect(ctx, 672, 170, 348, 68, 6);
        ctx.stroke();
        ctx.restore();
      }

      // 2 个短标签 + 1 个图例
      label(ctx, '发言', 60, 246, COL.ink, 'left', 20);
      label(ctx, '两条条目', 664, 30, COL.ink, 'left', 20);
      legend(
        ctx,
        [
          { c: COL.blue, t: '事实条目' },
          { c: COL.purple, t: '关系条目' },
          { c: COL.axis, t: '非激活' },
        ],
        44,
        14
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (id: HotspotId | null) => {
    stateRef.current.hot = id;
    setHot(id);
    setFeedback(FEEDBACK[id ?? 'none']);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) * W) / r.width;
    const y = ((e.clientY - r.top) * H) / r.height;
    const hit = HOT_ORDER.find(
      (id) => x >= HOT_BOX[id].x0 && x <= HOT_BOX[id].x1 && y >= HOT_BOX[id].y0 && y <= HOT_BOX[id].y1
    );
    select(hit ?? null);
  };

  const boxStyle = (id: HotspotId): React.CSSProperties => {
    const b = HOT_BOX[id];
    return {
      position: 'absolute',
      left: `${(b.x0 / W) * 100}%`,
      top: `${(b.y0 / H) * 100}%`,
      width: `${((b.x1 - b.x0) / W) * 100}%`,
      height: `${((b.y1 - b.y0) / H) * 100}%`,
      background: 'transparent',
      border: 'none',
      padding: 0,
      pointerEvents: 'none',
    };
  };

  return (
    <div>
      <div style={{ position: 'relative', width: 'min(100%, 1080px)', margin: '8px auto' }}>
        <canvas
          id={`cv-${chapterId}-${moduleId}`}
          ref={canvasRef}
          width={W}
          height={H}
          style={{ margin: 0 }}
          onClick={onCanvasClick}
          aria-label={`示例发言：${UTTERANCE}`}
        />
        {HOT_ORDER.map((id) => (
          <button key={id} type="button" style={boxStyle(id)} aria-label={HOT_ARIA[id]} onClick={() => select(id)} />
        ))}
      </div>
      <div className="hotspot-info">
        <div>示例发言 mi：{UTTERANCE}</div>
        <div>{INFO[hot ?? 'none']}</div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default C2DualExtract;
