import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 模块 2.1「画布的四重身份」（1080×280，可点击热点 + 四个等价 chip）
// 命名区域：canvasArea（x 120–700，四个子区域）、detail（x 730–1060，固定信息区）。
// 选中区域：蓝色 4 px 描边 + rgba(39,68,110,0.10) 填充；未选中：2 px #d7deea。

const W = 1080;
const H = 280;

const BG = '#f5f8f0';
const GROUND = '#e6ead9';
const LINE = '#d7deea';
const HOVER = '#b8c9a7';
const GREEN = '#228d5c';
const BLUE = '#27446e';
const INK = '#21324a';
const SUB = '#68778f';

const AREA_X = 120;
const AREA_Y = 40;
const AREA_W = 580;
const AREA_H = 190;

const DETAIL_X = 730;
const DETAIL_W = 330;

const CELL_W = AREA_W / 2;
const CELL_H = AREA_H / 2;

type Region = 'workspace' | 'memory' | 'action' | 'state';

interface RegionDef {
  id: Region;
  name: string;
  entry: string;
  sentence: string;
  cls: string;
}

const REGIONS: RegionDef[] = [
  {
    id: 'workspace',
    name: '工作区',
    entry: '工作区',
    sentence: '工作区：用户在这里摆放、比较和编辑所有材料。',
    cls: '',
  },
  {
    id: 'memory',
    name: '外部记忆',
    entry: '外部记忆',
    sentence: '外部记忆：智能体把这里当成跨轮的上下文来源，而不是翻聊天记录。',
    cls: '',
  },
  {
    id: 'action',
    name: '动作空间',
    entry: '动作空间',
    sentence: '动作空间：智能体的每一次操作都必须落在这块画布上。',
    cls: '',
  },
  {
    id: 'state',
    name: '共享项目状态',
    entry: '共享项目状态',
    sentence: '共享项目状态：用户和智能体读写的，是同一份事实。',
    cls: 'good',
  },
];

interface RolesState {
  region: Region | null;
  hover: Region | null;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clearScene(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GROUND;
  ctx.fillRect(0, 186, W, H - 186);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 186);
  ctx.lineTo(W, 186);
  ctx.stroke();
}

function regionRect(id: Region): { x: number; y: number; w: number; h: number } {
  const i = REGIONS.findIndex((r) => r.id === id);
  const col = i % 2;
  const row = Math.floor(i / 2);
  return {
    x: AREA_X + col * CELL_W,
    y: AREA_Y + row * CELL_H,
    w: CELL_W,
    h: CELL_H,
  };
}

function regionAt(x: number, y: number): Region | null {
  for (const r of REGIONS) {
    const rect = regionRect(r.id);
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return r.id;
  }
  return null;
}

function drawKnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.5, cy - s * 0.46);
  ctx.quadraticCurveTo(cx - s * 0.18, cy + s * 0.34, cx, cy + s * 0.5);
  ctx.quadraticCurveTo(cx + s * 0.18, cy + s * 0.34, cx + s * 0.5, cy - s * 0.46);
  ctx.stroke();
  ctx.restore();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '20px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxChars: number,
  lineHeight: number,
  maxLines: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  let line = '';
  let row = 0;
  for (let i = 0; i < text.length; i++) {
    line += text[i];
    if (line.length >= maxChars || i === text.length - 1) {
      if (row >= maxLines) break;
      ctx.fillText(line, x, y + row * lineHeight);
      row += 1;
      line = '';
    }
  }
  ctx.restore();
}

function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const items: Array<{ color: string; text: string }> = [
    { color: BLUE, text: '用户可见' },
    { color: '#f07e47', text: '智能体可读' },
    { color: GREEN, text: '二者共享' },
  ];
  let cx = x;
  ctx.save();
  ctx.font = '16px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  items.forEach((it) => {
    ctx.fillStyle = it.color;
    ctx.fillRect(cx, y - 11, 16, 12);
    ctx.fillStyle = SUB;
    ctx.fillText(it.text, cx + 22, y);
    cx += 22 + it.text.length * 16 + 18;
  });
  ctx.restore();
}

function render(ctx: CanvasRenderingContext2D, s: RolesState, time: number): void {
  clearScene(ctx);

  // 画布底板与浅网格
  ctx.save();
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, AREA_X - 10, AREA_Y - 10, AREA_W + 20, AREA_H + 20, 8);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(215,222,234,0.55)';
  ctx.lineWidth = 1;
  for (let x = AREA_X + 40; x < AREA_X + AREA_W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, AREA_Y);
    ctx.lineTo(x, AREA_Y + AREA_H);
    ctx.stroke();
  }
  for (let y = AREA_Y + 40; y < AREA_Y + AREA_H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(AREA_X, y);
    ctx.lineTo(AREA_X + AREA_W, y);
    ctx.stroke();
  }
  ctx.restore();

  // 四个区域
  REGIONS.forEach((r, i) => {
    const rect = regionRect(r.id);
    const selected = s.region === r.id;
    const hovered = s.hover === r.id;
    ctx.save();
    if (selected) {
      ctx.fillStyle = 'rgba(39,68,110,0.10)';
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 4;
    } else if (hovered) {
      ctx.fillStyle = 'rgba(184,201,167,0.24)';
      ctx.strokeStyle = HOVER;
      ctx.lineWidth = 3;
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
    }
    roundRectPath(ctx, rect.x + 6, rect.y + 6, rect.w - 12, rect.h - 12, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 区域内的微型线圈符号
    const knitColor = selected ? BLUE : '#b8c9a7';
    const cx = rect.x + rect.w - 46;
    const cy = rect.y + rect.h - 34;
    const breathe = selected ? Math.sin(time / 320) * 1.6 : 0;
    drawKnit(ctx, cx - 18, cy + breathe, 26, knitColor, 3);
    drawKnit(ctx, cx + 14, cy - breathe, 26, knitColor, 3);

    // 区域名称
    ctx.save();
    ctx.fillStyle = selected ? BLUE : INK;
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(r.name, rect.x + 22, rect.y + 40);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = selected ? 'rgba(39,68,110,' + (0.1 + 0.06 * Math.sin(time / 400 + i)) + ')' : 'rgba(215,222,234,0.6)';
    ctx.fillRect(rect.x + 22, rect.y + 52, 46, 6);
    ctx.restore();
  });

  // 固定信息区
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  roundRectPath(ctx, DETAIL_X - 10, AREA_Y - 10, DETAIL_W + 20, AREA_H + 20, 8);
  ctx.fill();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 指示条：四格，点亮格数 = agentVisible
  const activeIndex = s.region ? REGIONS.findIndex((r) => r.id === s.region) : -1;
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.fillStyle = i <= activeIndex ? BLUE : '#edf1f6';
    roundRectPath(ctx, DETAIL_X + 8 + i * 78, AREA_Y + 12, 66, 12, 6);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(DETAIL_X + 8, AREA_Y + 42);
  ctx.lineTo(DETAIL_X + DETAIL_W - 18, AREA_Y + 42);
  ctx.stroke();
  ctx.restore();

  const current = s.region ? REGIONS.find((r) => r.id === s.region) ?? null : null;
  if (!current) {
    wrapText(ctx, '点击任意区域查看它的职责', DETAIL_X + 8, AREA_Y + 84, 16, 28, 3, SUB);
  } else {
    ctx.save();
    ctx.fillStyle = current.cls === 'good' ? GREEN : BLUE;
    ctx.font = '22px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(current.name, DETAIL_X + 8, AREA_Y + 82);
    ctx.restore();
    wrapText(ctx, current.sentence.replace(current.entry + '：', ''), DETAIL_X + 8, AREA_Y + 118, 16, 28, 4, INK);
  }

  drawLabel(ctx, '画布', AREA_X - 10, 30, INK);
  drawLabel(ctx, '职责', DETAIL_X - 10, 30, INK);
  drawLegend(ctx, 140, 262);
}

export const Ch2Roles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<RolesState>({ region: null, hover: null });
  const rafRef = useRef<number | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [feedback, setFeedback] = useState({
    text: '点击任意区域查看它在一次创作里负责什么。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const tick = () => {
      render(ctx, stateRef.current, performance.now());
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

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: -1, y: -1 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * W) / rect.width,
      y: ((e.clientY - rect.top) * H) / rect.height,
    };
  };

  const select = (id: Region) => {
    const def = REGIONS.find((r) => r.id === id);
    if (!def) return;
    stateRef.current.region = id;
    setRegion(id);
    setFeedback({ text: def.sentence, cls: def.cls });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    const id = regionAt(p.x, p.y);
    if (id) select(id);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = toLocal(e);
    const id = regionAt(p.x, p.y);
    stateRef.current.hover = id;
  };

  const onPointerLeave = () => {
    stateRef.current.hover = null;
  };

  const agentVisible = region ? REGIONS.findIndex((r) => r.id === region) + 1 : 0;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      />
      <div className="chip-row">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`chip${region === r.id ? ' selected' : ''}`}
            onClick={() => select(r.id)}
          >
            {r.name}
          </button>
        ))}
      </div>
      <div className="metrics">
        <div className="metric">
          <div className="l">当前区域</div>
          <div className="v">{region ? REGIONS.find((r) => r.id === region)?.name : '未选中'}</div>
        </div>
        <div className="metric">
          <div className="l">智能体可见信息量</div>
          <div className="v">{agentVisible} / 4</div>
        </div>
        <div className="metric">
          <div className="l">事实来源</div>
          <div className="v">画布</div>
        </div>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Roles;
