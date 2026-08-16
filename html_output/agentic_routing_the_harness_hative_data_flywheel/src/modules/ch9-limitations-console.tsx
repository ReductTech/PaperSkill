import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearStudio,
  drawLegend,
  drawStudioLabel,
  roundedRect,
} from './studio-kit';

const W = 560;
const H = 260;
const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const TEXT = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';

type LimitationId = 'coverage' | 'route' | 'latency' | 'deployment';

type Limitation = {
  id: LimitationId;
  number: 1 | 2 | 3 | 4;
  short: string;
  title: string;
  source: string;
  shown: string;
  missing: string;
  judgment: string;
};

const LIMITATIONS: Limitation[] = [
  {
    id: 'coverage',
    number: 1,
    short: '任务覆盖',
    title: '只测两类任务',
    source: '论文 §4.1',
    shown: 'PinchBench v1.2.1 与 DRACO 两类端到端评估。',
    missing: '代码、多模态、高频工具、长周期自主与高风险 Agent 等不同任务分布。',
    judgment: '当前结果支持已测协议，不能直接外推为所有 Agent 与 Harness 都有效。',
  },
  {
    id: 'route',
    number: 2,
    short: '路由归因',
    title: '只看终局，没拆每次选择',
    source: '论文 §4.1、§4.2.3',
    shown: 'Score、实付成本、Token 与 Latency 的端到端前沿。',
    missing: '逐次 state→route 对应、router accuracy、oracle gap 与 aggregation success。',
    judgment: '知道整体操作点改善，尚不能解释每次选择为什么正确、错误或接近最优。',
  },
  {
    id: 'latency',
    number: 3,
    short: '推理延迟',
    title: '省钱，但可能很慢',
    source: '论文 Tables 3、7',
    shown: 'DRACO selected ensemble 为 60.82 / $0.3766，但 p50 535.5s、p95 3097.0s；动态路由 p50 为 837.1–1023.0s。',
    missing: '并行 proposer、early stopping 与严格预算在时延敏感任务上的实证结果。',
    judgment: '货币成本下降不等于墙钟延迟下降；多模型方案尚不适合直接外推到低时延场景。',
  },
  {
    id: 'deployment',
    number: 4,
    short: '部署迁移',
    title: '生产部署与跨 Harness 待验证',
    source: '论文 §6 Future Work',
    shown: '当前 benchmark、Harness、provider 与模型池中的操作点。',
    missing: '跨 Harness 迁移、自动模型画像、KV/cache-aware、边侧隐私—延迟与 token 级组合。',
    judgment: '实际收益还依赖模型池异质性、可靠 verifier/provenance，且路由开销必须低于节省。',
  },
];

const CARD_POSITIONS = [
  { x: 106, y: 38 }, { x: 286, y: 38 },
  { x: 106, y: 137 }, { x: 286, y: 137 },
];

const drawLine = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false,
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash(dashed ? [5, 4] : []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
};

const drawSmallBox = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  fill: string,
  dashed = false,
) => {
  ctx.save();
  roundedRect(ctx, x, y, w, h, 5);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dashed ? [4, 3] : []);
  ctx.stroke();
  ctx.restore();
};

const drawCardVisual = (
  ctx: CanvasRenderingContext2D,
  limitation: Limitation,
  x: number,
  y: number,
) => {
  const gx = x + 14;
  const gy = y + 39;

  if (limitation.id === 'coverage') {
    for (let index = 0; index < 6; index += 1) {
      const px = gx + (index % 3) * 21;
      const py = gy + (index >= 3 ? 19 : 0);
      const active = index < 2;
      drawSmallBox(ctx, px, py, 15, 15, active ? BLUE : RED, active ? '#e8eef8' : '#fff', !active);
      if (active) {
        ctx.fillStyle = GREEN;
        ctx.fillRect(px + 4, py + 4, 7, 7);
      }
    }
    ctx.fillStyle = TEXT;
    ctx.font = '800 13px "Segoe UI", sans-serif';
    ctx.fillText('2 已测', x + 96, gy + 22);
    return;
  }

  if (limitation.id === 'route') {
    drawSmallBox(ctx, gx, gy + 4, 31, 24, BLUE, '#eef3fa');
    drawSmallBox(ctx, gx + 53, gy, 45, 32, TEXT, '#f4f6f8');
    drawLine(ctx, gx + 31, gy + 16, gx + 53, gy + 16, BLUE);
    drawLine(ctx, gx + 98, gy + 16, gx + 125, gy + 16, RED, true);
    ctx.fillStyle = TEXT;
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('hₜ', gx + 15, gy + 20);
    ctx.fillText('Router', gx + 75, gy + 20);
    ctx.fillStyle = RED;
    ctx.font = '900 20px "Segoe UI", sans-serif';
    ctx.fillText('?', gx + 137, gy + 23);
    ctx.textAlign = 'left';
    return;
  }

  if (limitation.id === 'latency') {
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = GREEN;
    ctx.fillText('$', gx, gy + 11);
    ctx.fillStyle = RED;
    ctx.fillText('t', gx, gy + 31);
    ctx.fillStyle = '#e7ecf2';
    ctx.fillRect(gx + 16, gy + 2, 116, 10);
    ctx.fillRect(gx + 16, gy + 22, 116, 10);
    ctx.fillStyle = GREEN;
    ctx.fillRect(gx + 16, gy + 2, 58, 10);
    ctx.fillStyle = RED;
    ctx.fillRect(gx + 16, gy + 22, 111, 10);
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(gx + 127, gy + 18);
    ctx.lineTo(gx + 139, gy + 27);
    ctx.lineTo(gx + 127, gy + 36);
    ctx.closePath();
    ctx.fill();
    return;
  }

  drawSmallBox(ctx, gx, gy + 3, 42, 30, BLUE, '#eef3fa');
  ctx.fillStyle = BLUE;
  ctx.font = '700 10px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('当前', gx + 21, gy + 22);
  drawLine(ctx, gx + 42, gy + 18, gx + 70, gy + 18, RED, true);
  ctx.fillStyle = RED;
  ctx.font = '900 18px "Segoe UI", sans-serif';
  ctx.fillText('×', gx + 58, gy + 13);
  ['H₂', 'KV', 'E'].forEach((label, index) => {
    const px = gx + 76 + index * 25;
    drawSmallBox(ctx, px, gy + 7, 22, 22, PURPLE, '#fff', true);
    ctx.fillStyle = PURPLE;
    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.fillText(label, px + 11, gy + 21);
  });
  ctx.textAlign = 'left';
};

export const Ch9LimitationsConsole: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef<LimitationId>('coverage');
  const drawRef = useRef<(() => void) | null>(null);
  const [selectedId, setSelectedId] = useState<LimitationId>('coverage');

  const selectLimitation = (next: LimitationId) => {
    selectedRef.current = next;
    setSelectedId(next);
    requestAnimationFrame(() => drawRef.current?.());
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      canvas.style.maxWidth = 'none';
    } catch {
      return;
    }

    const render = () => {
      const activeId = selectedRef.current;
      clearStudio(ctx, W, H);
      drawStudioLabel(ctx, '四路证据监听', 14, 20, 'left');
      drawLegend(ctx, [
        { label: 'A 作者明确', color: BLUE },
        { label: '尚缺证据', color: RED },
      ], 366, 20);

      LIMITATIONS.forEach((item, index) => {
        const { x, y } = CARD_POSITIONS[index];
        const active = item.id === activeId;
        roundedRect(ctx, x, y, 168, 90, 10);
        ctx.fillStyle = active ? '#fff8eb' : 'rgba(255,253,248,.94)';
        ctx.fill();
        ctx.strokeStyle = active ? ORANGE : BLUE;
        ctx.lineWidth = active ? 4 : 2;
        ctx.stroke();

        roundedRect(ctx, x + 8, y + 7, 23, 19, 5);
        ctx.fillStyle = BLUE;
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '800 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`A${item.number}`, x + 19.5, y + 16.5);

        ctx.fillStyle = TEXT;
        ctx.font = '700 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.short, x + 38, y + 17);
        drawCardVisual(ctx, item, x, y);

        if (active) {
          ctx.fillStyle = ORANGE;
          ctx.beginPath();
          ctx.moveTo(x + 150, y + 76);
          ctx.lineTo(x + 158, y + 80);
          ctx.lineTo(x + 150, y + 84);
          ctx.closePath();
          ctx.fill();
        }
      });

      ctx.fillStyle = MUTED;
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('A = 论文正文明确限定 / 表格直显 / 未来工作', 280, 244);
      ctx.textAlign = 'left';
      canvas.classList.add('is-ready');
    };

    drawRef.current = render;
    render();
    const disconnect = observeCanvas(canvas, render, () => {});
    return () => {
      drawRef.current = null;
      disconnect();
    };
  }, []);

  const selected = LIMITATIONS.find((item) => item.id === selectedId) ?? LIMITATIONS[0];

  return (
    <div className="ch9-limitations">
      <div className="ch9-limitations-grid" role="group" aria-label="选择要检查的论文局限">
        {LIMITATIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`ch9-limitation-card ${selected.id === item.id ? 'is-active' : ''}`}
            aria-pressed={selected.id === item.id}
            onClick={() => selectLimitation(item.id)}
          >
            <span className="ch9-limitation-index">{item.number}</span>
            <span className="ch9-limitation-copy">
              <b>{item.title}</b>
              <small>A · 作者明确 / 未来工作</small>
            </span>
          </button>
        ))}
      </div>

      <div className="ch9-limitations-scroll" role="region" aria-label="四路证据缺口图，可横向滚动" tabIndex={0}>
        <canvas
          id={`cv-${chapterId}-${moduleId}`}
          ref={canvasRef}
          width={W}
          height={H}
          role="img"
          aria-label={`四类论文明确的证据缺口同时展示。当前选中第 ${selected.number} 项：${selected.title}。`}
        />
      </div>

      <div className="studio-value-row">
        <div className="studio-value"><b>论文已经展示</b><br />{selected.shown}</div>
        <div className="studio-value"><b>仍缺什么证据</b><br />{selected.missing}</div>
      </div>
      <div className="ch9-evidence-source"><b>分类依据：</b>{selected.source}</div>
      <div className="feedback bad" aria-live="polite"><b>当前判断：</b>{selected.judgment}</div>
      <div className="hotspot-info">
        <b>证据边界：</b>这四点均来自论文正文明确限定、表格直接显示或作者列入未来工作的内容。“尚待更多证据”不等于论文方法已经失效。
      </div>
    </div>
  );
};

export default Ch9LimitationsConsole;
