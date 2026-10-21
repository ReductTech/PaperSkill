import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawFreqBars,
  drawArm,
  drawSceneLabel,
  drawLegend,
  drawCheckMark,
  drawValueChip,
} from './packKit';
import type { WidgetProps } from './registry';

// Module 7.1 (P5 hotspots) — the FAST+ universal tokenizer as a big shorthand
// book. Three clickable tab regions on the canvas are hit-tested through the
// bounding-rect ratio (canvas may be CSS-scaled) and mirrored by DOM chips.
// A fixed .hotspot-info area spells out the three verbatim detail blocks.
const W = 1080;
const H = 320;

type HotId = 'recipe' | 'code' | 'record';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Hotspot {
  id: HotId;
  chip: string;
  region: Rect;
  feedback: string;
}

const TAB_X = 612;
const TAB_W = 168;
const TAB_H = 50;

const HOTSPOTS: Hotspot[] = [
  {
    id: 'recipe',
    chip: '训练食谱',
    region: { x: TAB_X - 14, y: 64 - 8, w: TAB_W + 56, h: TAB_H + 14 },
    feedback:
      '1M 段真实 1 秒动作块练成一本：单臂/双臂/移动、关节与 EEF 控制、多种频率——全装进同一个 tokenizer。',
  },
  {
    id: 'code',
    chip: '三行代码',
    region: { x: TAB_X - 14, y: 135 - 8, w: TAB_W + 56, h: TAB_H + 14 },
    feedback:
      'AutoProcessor 黑盒即用：三行代码拿到 token 串；换了数据域，tokenizer.fit() 几分钟重训一本。',
  },
  {
    id: 'record',
    chip: '通用战绩',
    region: { x: TAB_X - 14, y: 206 - 8, w: TAB_W + 56, h: TAB_H + 14 },
    feedback:
      '评测集全部未见过：SERL、T-DROID、UMI、NYU Hand、Humanplus 人形、Waymo 导航……一律 ≥2× 压缩。',
  },
];

const WALL_TINT: Record<HotId, string> = {
  recipe: C.blue,
  code: C.purple,
  record: C.green,
};

const CODE_LINES: { no: string; text: string; accent: boolean }[] = [
  { no: '1', text: 'from transformers import AutoProcessor', accent: false },
  { no: '2', text: 'tokenizer = AutoProcessor.from_pretrained(', accent: false },
  { no: '3', text: '  "physical-intelligence/fast", trust_remote_code=True)', accent: true },
  { no: '4', text: 'tokens = tokenizer(action_chunk)', accent: false },
];

const RECORD_ITEMS = ['SERL', 'T-DROID', 'UMI', 'NYU Hand', 'Humanplus 人形', 'Waymo 导航'];

const inRect = (r: Rect, x: number, y: number): boolean =>
  x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

const codeStyle: React.CSSProperties = {
  fontFamily: 'var(--ui-font-mono, monospace)',
  fontSize: '0.86em',
  background: 'var(--paper-2, #eef1f6)',
  padding: '1px 5px',
  borderRadius: 4,
  color: 'var(--orange, #f07e07)',
};

function drawBookBody(ctx: CanvasRenderingContext2D): void {
  // back cover + spine + inner page
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(60, 44, 560, 236, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.deep;
  ctx.beginPath();
  ctx.roundRect(46, 39, 17, 246, 6);
  ctx.fill();
  ctx.fillStyle = '#fbfcf9';
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.roundRect(78, 60, 528, 204, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawRecipePage(ctx: CanvasRenderingContext2D, grow: number): void {
  drawFreqBars(ctx, 100, 104, 250, 68, [0.9, 0.62, 0.42, 0.26, 0.16, 0.1, 0.06, 0.04], C.purple);
  ctx.save();
  ctx.fillStyle = C.muted;
  ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('多种频率', 225, 188);
  ctx.fillText('关节 / EEF 控制', 470, 170);
  ctx.fillStyle = C.text;
  ctx.fillText('单臂 · 双臂 · 移动', 470, 256);
  ctx.restore();
  const a = 0.35 + 0.65 * grow;
  drawArm(ctx, 430, 246, { scale: 1.7, angle: 0.15 + 0.35 * a, color: C.blue });
  drawArm(ctx, 530, 246, { scale: 1.7, angle: -0.1 - 0.3 * (1 - a), color: C.green });
}

function drawCodePage(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  // terminal dots
  ['#e0637a', '#e8b04b', '#7cc49a'].forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(102 + i * 18, 86, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.font = '11.5px "Consolas", "Menlo", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  CODE_LINES.forEach((line, i) => {
    const ly = 122 + i * 26;
    ctx.fillStyle = C.muted;
    ctx.fillText(line.no, 102, ly);
    ctx.fillStyle = line.accent ? C.green : C.text;
    ctx.fillText(line.text, 124, ly);
  });
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(96, 214);
  ctx.lineTo(588, 214);
  ctx.stroke();
  ctx.fillStyle = C.muted;
  ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('tokenizer.fit() → 新数据域几分钟重训', 102, 236);
  ctx.restore();
}

function drawRecordPage(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.font = '13px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  RECORD_ITEMS.forEach((item, i) => {
    const col = Math.floor(i / 3);
    const row = i % 3;
    const ix = 150 + col * 265;
    const iy = 130 + row * 48;
    drawCheckMark(ctx, ix - 22, iy, 7);
    ctx.fillStyle = C.text;
    ctx.fillText(item, ix, iy + 1);
  });
  ctx.fillStyle = C.muted;
  ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('未见数据', 452, 96);
  ctx.restore();
  drawValueChip(ctx, 548, 96, '≥2×', C.green);
}

function drawWall(ctx: CanvasRenderingContext2D, sel: HotId, ms: number): void {
  const tint = WALL_TINT[sel];
  ctx.save();
  for (let r = 0; r < 7; r++) {
    for (let cIdx = 0; cIdx < 10; cIdx++) {
      const shimmer = 0.5 + 0.5 * Math.sin(ms / 640 + r * 1.7 + cIdx * 0.9);
      ctx.globalAlpha = 0.18 + 0.3 * shimmer;
      ctx.fillStyle = tint;
      ctx.beginPath();
      ctx.roundRect(836 + cIdx * 22, 88 + r * 22, 16, 16, 3);
      ctx.fill();
    }
  }
  ctx.restore();
  drawValueChip(ctx, 944, 64, '1M', C.blue);
  ctx.save();
  ctx.fillStyle = C.muted;
  ctx.font = '11px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('段真实 1 秒动作块', 944, 256);
  ctx.restore();
}

export const Ch7Fastplus: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ sel: HotId; hover: HotId | null; start: number }>({
    sel: 'recipe',
    hover: null,
    start: 0,
  });
  const [sel, setSel] = useState<HotId>('recipe');
  const [hover, setHover] = useState<HotId | null>(null);

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
      const s = stateRef.current;
      const grow = easeOutCubic(clamp((ms - s.start) / 420, 0, 1));
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      drawBookBody(ctx);

      // book page content follows the active hotspot
      if (s.sel === 'recipe') drawRecipePage(ctx, grow);
      else if (s.sel === 'code') drawCodePage(ctx);
      else drawRecordPage(ctx);

      // three hotspot tabs on the book's right edge
      HOTSPOTS.forEach((h, i) => {
        const ty = 64 + i * 71;
        const isSel = s.sel === h.id;
        const isHover = s.hover === h.id;
        ctx.save();
        ctx.fillStyle = isSel ? C.blue : isHover ? '#e7eef8' : C.white;
        ctx.strokeStyle = isSel || isHover ? C.blue : C.border;
        ctx.lineWidth = isSel ? 2.25 : 1.5;
        ctx.beginPath();
        ctx.roundRect(TAB_X, ty, TAB_W, TAB_H, 8);
        ctx.fill();
        ctx.stroke();
        // connector into the book
        ctx.strokeStyle = isSel || isHover ? C.blue : C.border;
        ctx.lineWidth = isSel ? 2.25 : 1.5;
        ctx.beginPath();
        ctx.moveTo(TAB_X, ty + 8);
        ctx.lineTo(TAB_X - 16, ty + 8);
        ctx.moveTo(TAB_X, ty + TAB_H - 8);
        ctx.lineTo(TAB_X - 16, ty + TAB_H - 8);
        ctx.stroke();
        ctx.fillStyle = isSel ? C.white : isHover ? C.blue : C.text;
        ctx.font = '15px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(h.chip, TAB_X + 16, ty + TAB_H / 2);
        if (isSel) {
          ctx.fillStyle = C.white;
          ctx.beginPath();
          ctx.arc(TAB_X + TAB_W - 20, ty + TAB_H / 2, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(TAB_X + TAB_W - 25, ty + TAB_H / 2);
          ctx.lineTo(TAB_X + TAB_W - 21, ty + TAB_H / 2 + 4);
          ctx.lineTo(TAB_X + TAB_W - 14, ty + TAB_H / 2 - 4);
          ctx.stroke();
        }
        ctx.restore();
      });

      drawWall(ctx, s.sel, ms);

      drawSceneLabel(ctx, '万能收纳术 FAST+', 16, 22, { color: C.green });
      drawSceneLabel(ctx, '点击书本右侧的标签切换详情', 16, 42, { color: C.muted });
      drawLegend(ctx, [['衣物卷', C.purple], ['可点击热点', C.blue]], 16, H - 14);

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

  const toCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const select = (id: HotId) => {
    stateRef.current.sel = id;
    stateRef.current.start = performance.now();
    setSel(id);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = toCanvasPoint(e);
    if (!p) return;
    const hit = HOTSPOTS.find((h) => inRect(h.region, p.x, p.y));
    if (hit) select(hit.id);
  };

  const onCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const p = toCanvasPoint(e);
    if (!p) return;
    const hit = HOTSPOTS.find((h) => inRect(h.region, p.x, p.y));
    const id = hit ? hit.id : null;
    if (id !== stateRef.current.hover) {
      stateRef.current.hover = id;
      setHover(id);
    }
  };

  const onCanvasLeave = () => {
    stateRef.current.hover = null;
    setHover(null);
  };

  const activeFeedback = HOTSPOTS.find((h) => h.id === sel);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        onMouseMove={onCanvasMove}
        onMouseLeave={onCanvasLeave}
        style={{ cursor: hover ? 'pointer' : 'default' }}
      />
      <div className="chip-row">
        {HOTSPOTS.map((h) => (
          <button
            key={h.id}
            className={`chip${sel === h.id ? ' selected' : ''}`}
            onClick={() => select(h.id)}
          >
            {h.chip}
          </button>
        ))}
      </div>
      <div className="hotspot-info" style={{ minHeight: 64 }}>
        {HOTSPOTS.map((h, i) => (
          <div
            key={h.id}
            style={{
              marginBottom: i < HOTSPOTS.length - 1 ? 10 : 0,
              opacity: sel === h.id ? 1 : 0.55,
              borderLeft: `3px solid ${sel === h.id ? C.green : C.border}`,
              paddingLeft: 10,
            }}
          >
            <strong style={{ color: sel === h.id ? C.green : C.muted }}>{h.chip}</strong>
            {h.id === 'code' ? (
              <div>
                <div style={{ marginTop: 4, lineHeight: 1.9 }}>
                  <code style={codeStyle}>from transformers import AutoProcessor</code>
                  <br />
                  <code style={codeStyle}>
                    tokenizer = AutoProcessor.from_pretrained("physical-intelligence/fast",
                    trust_remote_code=True)
                  </code>
                  <br />
                  <code style={codeStyle}>tokens = tokenizer(action_chunk)</code>
                </div>
                <div style={{ marginTop: 4 }}>tokenizer.fit()：新数据域几分钟重训。</div>
              </div>
            ) : (
              <div style={{ marginTop: 4 }}>
                {h.id === 'recipe'
                  ? '「1M 段 1 秒块；单臂/双臂/移动；关节与 EEF 控制；多种频率」'
                  : '「未见数据一律 ≥2× 压缩：SERL · T-DROID · UMI · NYU Hand · Humanplus 人形 · Waymo 导航…」'}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="feedback good">{activeFeedback ? activeFeedback.feedback : ''}</div>
    </div>
  );
};

export default Ch7Fastplus;
