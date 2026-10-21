import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawNotebook, drawSceneLabel, drawLegend } from './movingKit';
import type { WidgetProps } from './registry';

// Ch.3 module 3.1 — 五路功课热点 (P5): six notebooks in a 3×2 grid
// (MM/ME/CE/HL/WD pre-training + VI post-training). Click a notebook on the
// canvas (bounding-rect ratio hit test) or a DOM chip; a fixed .hotspot-info
// region shows the verbatim per-source detail; one green feedback per source.
const W = 1080;
const H = 280;
const BASE_S = 1.7;

interface Source {
  key: string;
  chip: string;
  color: string;
  info: string;
  fb: string;
}

const SOURCES: Source[] = [
  {
    key: 'MM',
    chip: 'MM 移动操作',
    color: C.blue,
    info:
      '内容缩略：<b>~400h · ~100 家</b>移动操作数据（双臂移动车）。配方角色：最贴近任务的主力——自家车队跑过的百家真实保洁单。',
    fb: '~400 小时 · ~100 家——最贴近真实任务的主力数据。',
  },
  {
    key: 'ME',
    chip: 'ME 多环境固定臂',
    color: C.blue,
    info:
      '内容缩略：<b>轻便臂带进更多家</b>。配方角色：别家机器的固定臂经验——跨本体迁移的重要一路。',
    fb: '轻便臂进过更多家：别家机器的经验也能迁移。',
  },
  {
    key: 'CE',
    chip: 'CE 实验室跨本体',
    color: C.blue,
    info:
      '内容缩略：<b>实验室跨本体 + OXE</b>。配方角色：练习房打底 + 网络级数据规模，跨本体迁移双向有价值。',
    fb: '实验室 + OXE：跨本体迁移双向有价值。',
  },
  {
    key: 'HL',
    chip: 'HL 拆单示范',
    color: C.blue,
    info:
      '内容缩略：<b>人工标注子任务 + 边界框先于子任务</b>。配方角色：拆单示范——教模型"先想一步再动手"。',
    fb: '子任务与边界框都来自人工标注：拆单能力从数据学来。',
  },
  {
    key: 'WD',
    chip: 'WD 网页图鉴',
    color: C.blue,
    info:
      '内容缩略：<b>Captioning / VQA / 定位</b>。配方角色：万物图鉴——OOD 语言跟随的功臣。',
    fb: '网页图鉴撑起对没见过的物体与指令的理解。',
  },
  {
    key: 'VI',
    chip: 'VI 口令演练',
    color: C.orange,
    info:
      '内容缩略：<b>后训练才加</b>——专家用语言"遥控"机器人的实录，只占高层 MM 例的 <b>~11%</b>。配方角色：口令演练——教高层说正确的下一句。',
    fb: '只占高层例子的 ~11%，后面实验将证明它<b>关键到不能删</b>。',
  },
];

const CENTERS: [number, number][] = [
  [250, 84],
  [540, 84],
  [830, 84],
  [250, 204],
  [540, 204],
  [830, 204],
];

export const Ch3Sources: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selRef = useRef(0);
  const selAtRef = useRef(0);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (ms: number) => {
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false, grid: true });
      const cur = Math.max(0, Math.min(SOURCES.length - 1, selRef.current));
      for (let i = 0; i < SOURCES.length; i++) {
        const [cx, cy] = CENTERS[i];
        const active = i === cur;
        // pop right after selection, decaying
        const dt = Math.max(0, ms - selAtRef.current);
        const extra = active ? 0.16 * Math.exp(-dt / 180) : 0;
        const s = BASE_S * (1 + extra);
        ctx.save();
        if (!active) ctx.globalAlpha = 0.5;
        drawNotebook(ctx, cx, cy, s, SOURCES[i].key, { color: SOURCES[i].color });
        if (active) {
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([7, 5]);
          ctx.lineDashOffset = -(ms / 40) % 12;
          ctx.beginPath();
          ctx.roundRect(cx - 19 * s, cy - 25 * s, 38 * s, 52 * s, 6);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      }
      drawLegend(ctx, [['预训练 5 路', C.blue], ['后训练 VI', C.orange]], 16, 22);
      drawSceneLabel(ctx, '点击翻开任一本', 16, 204, { color: C.muted });
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (i: number) => {
    const idx = Math.max(0, Math.min(SOURCES.length - 1, i));
    selRef.current = idx;
    selAtRef.current = performance.now();
    setSel(idx);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (let i = 0; i < CENTERS.length; i++) {
      const [cx, cy] = CENTERS[i];
      if (Math.abs(x - cx) <= BASE_S * 16 + 16 && Math.abs(y - cy) <= BASE_S * 22 + 14) {
        select(i);
        return;
      }
    }
  };

  const safeSel = Math.max(0, Math.min(SOURCES.length - 1, sel));
  const src = SOURCES[safeSel];

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
      />
      <div className="ctrl">
        <div className="chip-row" role="group">
          {SOURCES.map((s, i) => (
            <button
              key={s.key}
              className={`chip${i === safeSel ? ' selected' : ''}`}
              onClick={() => select(i)}
            >
              {s.chip}
            </button>
          ))}
        </div>
      </div>
      <div className="hotspot-info" style={{ minHeight: 64 }} dangerouslySetInnerHTML={{ __html: src.info }} />
      <div className="feedback good" dangerouslySetInnerHTML={{ __html: src.fb }} />
    </div>
  );
};

export default Ch3Sources;
