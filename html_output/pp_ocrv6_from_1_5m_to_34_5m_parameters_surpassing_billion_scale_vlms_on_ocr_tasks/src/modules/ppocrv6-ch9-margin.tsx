import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0',
  desk: '#b8c9a7',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#d97706',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

function useCanvas(
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void,
  deps: React.DependencyList,
) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let context: CanvasRenderingContext2D;
    try {
      context = setupCanvas(canvas, width, height);
    } catch {
      return;
    }

    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const render = () => {
      draw(context);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, render, () => undefined);
    return disconnect;
  }, deps);

  return ref;
}

function clear(context: CanvasRenderingContext2D, width: number, height: number) {
  context.clearRect(0, 0, width, height);
  context.fillStyle = C.bg;
  context.fillRect(0, 0, width, height);
  context.fillStyle = C.desk;
  context.fillRect(0, height - 20, width, 20);
}

function label(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = C.ink,
  align: CanvasTextAlign = 'left',
) {
  context.fillStyle = color;
  context.font = '600 12px Segoe UI, sans-serif';
  context.textAlign = align;
  context.fillText(text, x, y);
  context.textAlign = 'left';
}

function receipt(context: CanvasRenderingContext2D) {
  context.fillStyle = '#fff';
  context.strokeStyle = C.line;
  context.lineWidth = 1.5;
  context.fillRect(42, 24, 300, 102);
  context.strokeRect(42, 24, 300, 102);
  context.fillStyle = C.ink;
  context.font = '700 13px Segoe UI, sans-serif';
  context.fillText('C0DE  TEH', 58, 61);
  context.strokeStyle = '#dfe5ec';
  context.beginPath();
  context.moveTo(56, 76);
  context.lineTo(328, 76);
  context.stroke();
}

function describeMargin(margin: number) {
  if (margin < 0.18) return '裁剪过紧';
  if (margin > 0.82) return '背景范围偏大';
  return '边界适中';
}

const table8Rows = [
  { model: 'PP-OCRv5_server', value: 54.82, color: C.blue },
  { model: 'PP-OCRv6_medium', value: 75.32, color: C.green },
] as const;

export const Ch9Margin: React.FC<WidgetProps> = () => {
  const [margin, setMargin] = useState(0.45);
  const dragging = useRef(false);
  const percent = Math.round(margin * 100);
  const demoState = describeMargin(margin);
  const canvasRef = useCanvas(560, 290, (context) => {
    clear(context, 560, 290);
    receipt(context);

    const expand = margin * 62;
    context.strokeStyle = C.orange;
    context.lineWidth = 3;
    context.strokeRect(90 - expand, 48 - expand * 0.25, 172 + expand * 2, 42 + expand * 0.5);
    label(context, `教学示意：${demoState}`, 42, 148, C.orange);

    label(context, '论文结果：Table 8 聚合一致性', 42, 174, C.ink);
    table8Rows.forEach((row, index) => {
      const y = 188 + index * 38;
      label(context, row.model, 42, y + 17, C.ink);
      context.fillStyle = C.line;
      context.fillRect(190, y, 300, 20);
      context.fillStyle = row.color;
      context.fillRect(190, y, 300 * row.value / 100, 20);
      label(context, `${row.value.toFixed(2)}%`, 518, y + 16, row.color, 'right');
    });
    label(context, '示意滑块不对应论文采样阈值', 518, 261, C.muted, 'right');
  }, [margin]);

  const updateFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setMargin(clamp((event.clientX - bounds.left) / bounds.width, 0, 1));
  };

  const updateFromKeyboard = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setMargin((value) => clamp(value - 0.05, 0, 1));
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setMargin((value) => clamp(value + 0.05, 0, 1));
    }
  };

  return (
    <div>
      <div className="technical-canvas-viewport">
        <canvas
          ref={canvasRef}
          width={560}
          height={290}
          tabIndex={0}
          role="slider"
          aria-label="教学示意裁剪松紧"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent}%：${demoState}。该状态阈值不是论文实测。`}
          aria-describedby="margin-demo-note margin-table8"
          onPointerDown={(event) => {
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            updateFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (dragging.current) updateFromPointer(event);
          }}
          onPointerUp={() => { dragging.current = false; }}
          onPointerCancel={() => { dragging.current = false; }}
          onKeyDown={updateFromKeyboard}
        />
      </div>
      <div className="ctrl">
        <label>
          裁剪松紧 <span className="val">{percent}%</span>
        </label>
        <input
          aria-label="裁剪松紧"
          type="range"
          min="0"
          max="100"
          value={percent}
          onChange={(event) => setMargin(Number(event.target.value) / 100)}
        />
      </div>
      <table id="margin-table8" className="paper-result-table">
        <caption>论文 Table 8：裁剪扰动下的聚合一致性</caption>
        <thead>
          <tr><th scope="col">模型</th><th scope="col">一致性</th></tr>
        </thead>
        <tbody>
          {table8Rows.map((row) => (
            <tr key={row.model}><th scope="row">{row.model}</th><td>{row.value.toFixed(2)}%</td></tr>
          ))}
        </tbody>
      </table>
      <div id="margin-demo-note" className="feedback" role="status" aria-live="polite">
        教学示意：{demoState}。示意阈值非论文实测；表中百分比来自 Table 8。
      </div>
    </div>
  );
};
