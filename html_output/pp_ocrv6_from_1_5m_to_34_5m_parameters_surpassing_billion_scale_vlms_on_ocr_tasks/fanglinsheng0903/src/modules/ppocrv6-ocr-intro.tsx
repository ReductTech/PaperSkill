import React, { useEffect, useRef, useState } from 'react';
import { LineIcon } from '../components/LineIcon';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0',
  desk: '#b8c9a7',
  blue: '#27446e',
  green: '#228d5c',
  orange: '#d97706',
  purple: '#7c3aed',
  ink: '#21324a',
  muted: '#68778f',
  line: '#d7deea',
};

type Sample = {
  id: string;
  label: string;
  source: string;
  text: string;
  output: string;
};

const SAMPLES: Sample[] = [
  { id: 'receipt', label: '票据编号', source: '票据图像', text: 'TEH 2026', output: 'TEH 2026' },
  { id: 'sign', label: '门店招牌', source: '街景图像', text: '新华书店', output: '新华书店' },
  { id: 'package', label: '包装批次', source: '包装图像', text: 'B7-A091', output: 'B7-A091' },
];

const STUDIES = [
  {
    year: '2024',
    route: '统一端到端 OCR',
    title: 'General OCR Theory: Towards OCR-2.0 via a Unified End-to-end Model',
    summary: '以统一端到端模型组织多种 OCR 输入与输出形式，代表从单项识别走向通用 OCR-2.0 的研究路线。',
    href: 'https://arxiv.org/abs/2409.01704',
  },
  {
    year: '2025',
    route: '生产级 OCR 系统',
    title: 'PaddleOCR 3.0 Technical Report',
    summary: '系统化覆盖文字识别、复杂文档解析与信息抽取，展示 OCR 从单模型走向完整工具链的工程路线。',
    href: 'https://arxiv.org/abs/2507.05595',
  },
  {
    year: '2025',
    route: '紧凑文档 VLM',
    title: 'PaddleOCR-VL: Boosting Multilingual Document Parsing via a 0.9B Ultra-Compact Vision-Language Model',
    summary: '用 0.9B 视觉语言模型处理多语种文档解析，代表紧凑型文档 VLM 路线。',
    href: 'https://arxiv.org/abs/2510.14528',
  },
  {
    year: '2025',
    route: '视觉上下文压缩',
    title: 'DeepSeek-OCR: Contexts Optical Compression',
    summary: '探索用光学信息压缩语言模型上下文，让 OCR 同时成为文档读取与高密度视觉信息编码接口。',
    href: 'https://arxiv.org/abs/2510.18234',
  },
  {
    year: '2026',
    route: '轻量专用 OCR',
    title: 'PP-OCRv6: From 1.5M to 34.5M Parameters, Surpassing Billion-Scale VLMs on OCR Tasks',
    summary: '以 1.5M–34.5M 参数覆盖检测与识别，强调专用 OCR 在精度、忠实度与部署成本之间的平衡。',
    href: 'https://arxiv.org/abs/2606.13108',
  },
] as const;

function useCanvas(
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D, time: number) => void,
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
    let frame = 0;
    const render = (time: number) => {
      draw(context, time / 1000);
      canvas.classList.add('is-ready');
      frame = requestAnimationFrame(render);
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
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
  font = '600 12px Segoe UI, sans-serif',
) {
  context.fillStyle = color;
  context.font = font;
  context.textAlign = align;
  context.fillText(text, x, y);
  context.textAlign = 'left';
}

function arrow(
  context: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(toX, toY);
  context.stroke();
  context.beginPath();
  context.moveTo(toX, toY);
  context.lineTo(toX - 8 * Math.cos(angle - Math.PI / 6), toY - 8 * Math.sin(angle - Math.PI / 6));
  context.lineTo(toX - 8 * Math.cos(angle + Math.PI / 6), toY - 8 * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
}

function magnifier(context: CanvasRenderingContext2D, x: number, y: number, color: string, scale = 1) {
  context.strokeStyle = color;
  context.lineWidth = 4 * scale;
  context.lineCap = 'round';
  context.beginPath();
  context.arc(x, y, 18 * scale, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.moveTo(x + 13 * scale, y + 13 * scale);
  context.lineTo(x + 31 * scale, y + 31 * scale);
  context.stroke();
  context.lineCap = 'butt';
}

function drawDocument(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.fillStyle = '#fff';
  context.strokeStyle = C.line;
  context.lineWidth = 1.5;
  context.fillRect(x, y, width, height);
  context.strokeRect(x, y, width, height);
  context.strokeStyle = '#dfe5ec';
  context.lineWidth = 1;
  [24, 48, 88].forEach((offset) => {
    context.beginPath();
    context.moveTo(x + 16, y + offset);
    context.lineTo(x + width - 16, y + offset);
    context.stroke();
  });
}

export const OcrIntroAnalogy: React.FC<WidgetProps> = () => {
  const canvasRef = useCanvas(244, 130, (context, time) => {
    clear(context, 244, 130);
    drawDocument(context, 16, 18, 150, 86);
    label(context, 'TEH 2026', 34, 64, C.ink, 'left', '700 15px Segoe UI, sans-serif');
    const progress = (Math.sin(time * 2.1 - Math.PI / 2) + 1) / 2;
    const scanX = 34 + progress * 88;
    context.fillStyle = 'rgba(39,68,110,.12)';
    context.fillRect(30, 45, Math.max(4, scanX - 30), 27);
    context.strokeStyle = C.blue;
    context.lineWidth = 2;
    context.strokeRect(29, 43, 96, 31);
    magnifier(context, scanX, 57, C.green, .55);
    label(context, 'TEH 2026', 202, 59, C.green, 'center', '700 12px Segoe UI, sans-serif');
  }, []);
  return (
    <canvas
      ref={canvasRef}
      width={244}
      height={130}
      role="img"
      aria-label="OCR 类比动画：扫描票据中的 TEH 2026，并输出相同文本"
    />
  );
};

export const OcrScanDemo: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState(0);
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  const started = useRef(0);
  const doneRef = useRef(false);
  const sample = SAMPLES[selected];

  useEffect(() => {
    started.current = performance.now();
    doneRef.current = false;
    setDone(false);
  }, [selected, run]);

  const canvasRef = useCanvas(560, 260, (context, time) => {
    clear(context, 560, 260);
    const progress = easeInOutQuad(clamp((time * 1000 - started.current) / 1800, 0, 1));

    label(context, sample.source, 34, 34, C.blue, 'left', '700 13px Segoe UI, sans-serif');
    drawDocument(context, 30, 48, 278, 158);
    label(context, sample.text, 67, 127, C.ink, 'left', '700 26px Segoe UI, sans-serif');
    context.font = '700 26px Segoe UI, sans-serif';
    const metrics = context.measureText(sample.text);
    const box = {
      x: 60,
      y: 96,
      width: metrics.width + 16,
      height: 42,
    };
    context.fillStyle = 'rgba(34,141,92,.08)';
    context.fillRect(box.x, box.y, box.width * progress, box.height);
    context.strokeStyle = C.green;
    context.lineWidth = 2.5;
    context.strokeRect(box.x, box.y, box.width, box.height);
    const scanX = box.x + 8 + (box.width - 16) * progress;
    context.strokeStyle = C.orange;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(scanX, box.y + 3);
    context.lineTo(scanX, box.y + box.height - 3);
    context.stroke();
    magnifier(context, scanX, box.y + box.height / 2, C.green, .62);

    arrow(context, 318, 126, 352, 126, C.orange);
    label(context, 'OCR 输出', 372, 67, C.blue, 'left', '700 13px Segoe UI, sans-serif');
    context.fillStyle = '#fff';
    context.strokeStyle = C.line;
    context.lineWidth = 1.5;
    context.fillRect(352, 80, 176, 104);
    context.strokeRect(352, 80, 176, 104);
    const outputChars = Array.from(sample.output);
    const visibleCount = Math.min(outputChars.length, Math.floor(progress * (outputChars.length + 1)));
    const visibleOutput = outputChars.slice(0, visibleCount).join('');
    label(context, visibleOutput || '…', 440, 132, visibleOutput ? C.green : C.muted, 'center', '700 21px Segoe UI, sans-serif');
    label(context, '可检索 · 可复制 · 可校验', 440, 160, C.muted, 'center');

    context.fillStyle = 'rgba(124,58,237,.10)';
    context.strokeStyle = C.purple;
    context.lineWidth = 1.5;
    context.fillRect(92, 218, 132, 22);
    context.strokeRect(92, 218, 132, 22);
    label(context, '检测：文字在哪里', 158, 233, C.purple, 'center');
    context.fillStyle = 'rgba(34,141,92,.10)';
    context.strokeStyle = C.green;
    context.fillRect(336, 218, 132, 22);
    context.strokeRect(336, 218, 132, 22);
    label(context, '识别：文字是什么', 402, 233, C.green, 'center');

    if (progress >= 1 && !doneRef.current) {
      doneRef.current = true;
      setDone(true);
    }
  }, [selected, run]);

  const choose = (index: number) => {
    setSelected(index);
    setRun((value) => value + 1);
  };

  return (
    <div>
      <div className="technical-canvas-viewport">
        <canvas
          ref={canvasRef}
          width={560}
          height={260}
          role="img"
          aria-label={`当前选择${sample.label}，图像文字为${sample.text}，OCR 输出为${sample.output}`}
        />
      </div>
      <div className="chip-row" role="group" aria-label="选择要扫描的文字内容">
        {SAMPLES.map((item, index) => (
          <button
            key={item.id}
            className={`chip ${selected === index ? 'selected' : ''}`}
            aria-pressed={selected === index}
            onClick={() => choose(index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost ui-replay" onClick={() => setRun((value) => value + 1)}>
          <LineIcon name="rotate" />重新扫描
        </button>
      </div>
      <div className={`feedback ${done ? 'good' : ''}`} role="status" aria-live="polite">
        {done
          ? `扫描完成：检测到“${sample.text}”，识别输出保持为“${sample.output}”。`
          : `正在读取${sample.label}中的视觉字符…`}
      </div>
    </div>
  );
};

export const OcrResearchTimeline: React.FC<WidgetProps> = () => {
  const [selected, setSelected] = useState(STUDIES.length - 1);
  const study = STUDIES[selected];
  return (
    <div>
      <ul className="ocr-study-list" aria-label="近期 OCR 代表性研究">
        {STUDIES.map((item, index) => (
          <li key={item.href}>
            <button
              type="button"
              className={`ocr-study-row ${selected === index ? 'selected' : ''}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <span className="ocr-study-year">{item.year}</span>
              <span className="ocr-study-route">{item.route}</span>
              <span className="ocr-study-title">{item.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="ocr-study-detail" role="status" aria-live="polite">
        <div>
          <strong>{study.route}</strong>
          <p>{study.summary}</p>
        </div>
        <a href={study.href} target="_blank" rel="noreferrer">
          查看 arXiv
        </a>
      </div>
      <p className="ocr-study-note">
        这些工作覆盖的输入、输出和评测协议并不相同；这里按研究路线罗列，不表示同一榜单上的性能排序。
      </p>
    </div>
  );
};
