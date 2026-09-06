import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0',
  desk: '#b8c9a7',
  green: '#228d5c',
  red: '#c43f52',
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
    return observeCanvas(canvas, render, () => undefined);
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

function receipt(
  context: CanvasRenderingContext2D,
  x: number,
  text: string,
) {
  context.fillStyle = '#fff';
  context.strokeStyle = C.line;
  context.lineWidth = 1.5;
  context.fillRect(x, 55, 218, 98);
  context.strokeRect(x, 55, 218, 98);
  context.fillStyle = C.ink;
  context.font = '700 13px Segoe UI, sans-serif';
  context.fillText(text, x + 16, 92);
  context.strokeStyle = '#dfe5ec';
  context.beginPath();
  context.moveTo(x + 14, 107);
  context.lineTo(x + 204, 107);
  context.stroke();
}

type FaithMode = 'prior' | 'visual';

const samples = [
  { label: '故意拼错', input: 'TEH', corrected: 'THE' },
  { label: '重复字符', input: 'goood', corrected: 'good' },
  { label: '特殊字符', input: 'A@@A', corrected: 'A@A' },
] as const;

const hallucinationRows = [
  { model: 'Qwen3-VL-235B', value: 80.56 },
  { model: 'PP-OCRv6_medium', value: 93.20 },
] as const;

export const Ch9Faithfulness: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<FaithMode>('prior');
  const [sampleIndex, setSampleIndex] = useState(0);
  const sample = samples[sampleIndex];
  const output = mode === 'visual' ? sample.input : sample.corrected;
  const message = mode === 'visual'
    ? '输出保留了图像中的非标准写法。'
    : '句子更顺，但已经不是原图文字。';

  const canvasRef = useCanvas(560, 260, (context) => {
    clear(context, 560, 260);
    label(context, '图像文字', 42, 38);
    label(context, '模型输出', 322, 38);
    receipt(context, 36, sample.input);
    receipt(context, 306, output);
    context.strokeStyle = mode === 'visual' ? C.green : C.red;
    context.lineWidth = 3;
    context.strokeRect(326, 73, 100, 38);
    label(
      context,
      mode === 'visual' ? '逐字符一致' : '语言更顺，但改字',
      415,
      175,
      mode === 'visual' ? C.green : C.red,
      'center',
    );
    label(context, '论文幻觉集准确率（越高越好）', 280, 207, C.muted, 'center');
    context.fillStyle = C.line;
    context.fillRect(82, 220, 396, 14);
    context.fillStyle = C.red;
    context.fillRect(82, 220, 396 * 0.8056, 14);
    context.fillStyle = C.green;
    context.fillRect(82, 238, 396 * 0.932, 14);
    label(context, 'Qwen3-VL 80.56', 78, 231, C.red, 'right');
    label(context, 'PP-OCRv6 93.20', 78, 249, C.green, 'right');
  }, [mode, sampleIndex]);

  const canvasLabel = [
    '忠实度对比图。',
    `图像文字 ${sample.input}。`,
    `当前策略为${mode === 'visual' ? '视觉证据优先' : '语言先验改写'}，输出 ${output}。`,
    '论文幻觉集准确率：Qwen3-VL-235B 为 80.56%，PP-OCRv6 medium 为 93.20%。',
  ].join('');

  return (
    <div>
      <div className="technical-canvas-viewport">
        <canvas
          ref={canvasRef}
          width={560}
          height={260}
          role="img"
          aria-label={canvasLabel}
          aria-describedby="faithfulness-results faithfulness-status"
        />
      </div>
      <div className="chip-row" role="group" aria-label="转录策略">
        <button
          className={`chip ${mode === 'prior' ? 'selected' : ''}`}
          aria-pressed={mode === 'prior'}
          onClick={() => setMode('prior')}
        >
          语言先验改写
        </button>
        <button
          className={`chip ${mode === 'visual' ? 'selected' : ''}`}
          aria-pressed={mode === 'visual'}
          onClick={() => setMode('visual')}
        >
          视觉证据优先
        </button>
      </div>
      <div className="chip-row" role="group" aria-label="非标准文本样本">
        {samples.map((item, index) => (
          <button
            key={item.label}
            className={`chip ${sampleIndex === index ? 'selected' : ''}`}
            aria-pressed={sampleIndex === index}
            onClick={() => setSampleIndex(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <table id="faithfulness-results" className="paper-result-table">
        <caption>论文 Table 7：OCR 幻觉集准确率，越高表示幻觉越少</caption>
        <thead>
          <tr><th scope="col">模型</th><th scope="col">准确率</th></tr>
        </thead>
        <tbody>
          {hallucinationRows.map((row) => (
            <tr key={row.model}><th scope="row">{row.model}</th><td>{row.value.toFixed(2)}%</td></tr>
          ))}
        </tbody>
      </table>
      <div
        id="faithfulness-status"
        className={`feedback ${mode === 'visual' ? 'good' : 'bad'}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </div>
  );
};
