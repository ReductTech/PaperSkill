import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, clearScene, drawPaperSheet } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const MODES = [
  {
    id: 't', label: '翻译', color: COLORS.orange,
    does: '多语言往返翻译，靠语义损失打乱风格。',
    tool: 'translateLocally，链路 English → Spanish → German → English。',
    cost: '明显压低可读性，并连带损伤语义；换来一定的安全度。',
    note: '翻译：换语言往返，靠语义损失打乱风格。',
  },
  {
    id: 'o', label: '混淆', color: COLORS.orange,
    does: '逐行释义，磨掉作者的节奏。',
    tool: 'PEGASUS。作者记录到部分句子出现退化输出（例如重复 888-353-1299），未追查原因并保留了这些输出。',
    cost: '同样明显压低可读性并损伤语义；换来一定的安全度。',
    note: '混淆：逐行释义，磨掉作者的节奏，代价与翻译相近。',
  },
  {
    id: 'i', label: '模仿', color: COLORS.blue,
    does: '用本地大模型以“另一个人设”重写，让文本读起来像别人写的。',
    tool: '自托管 Ollama + Negentropy-claude-opus-4.7-9B-GGUF，随机人设，输出前会移除人设前言。',
    cost: '修复前两步弄崩的可读性；但单独使用时不足以造成误判。',
    note: '模仿：换人设重写，把前两步弄崩的可读性补回来。',
  },
  {
    id: 'in', label: '注入', color: COLORS.green,
    does: '植入不可见或形近的字符，直接污染特征提取。',
    tool: 'pyUnicodeSteganography（零宽字符）、SilverSpeak（同形字）、eng（英式/美式拼写）。',
    cost: '正常渲染下几乎不影响语义与可读，却是唯一能翻转归属的模块。',
    note: '注入：隐形字符与形近字收尾，单独即可翻转归属。',
  },
];

export const Ch3Mod2: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const [mode, setMode] = useState('in');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (id: string) => {
      clearScene(ctx, W, H);
      const m = MODES.find((x) => x.id === id) || MODES[3];
      drawPaperSheet(ctx, 60, 40, 620, 200);
      ctx.lineWidth = 4;
      ctx.strokeStyle = m.color;
      for (let i = 0; i < 4; i++) {
        const y = 78 + i * 40;
        ctx.beginPath();
        if (m.id === 't') {
          ctx.moveTo(100, y);
          ctx.bezierCurveTo(220, y - 22, 400, y + 22, 640, y);
        } else if (m.id === 'o') {
          ctx.moveTo(100, y);
          ctx.lineTo(240, y);
          ctx.moveTo(280, y);
          ctx.lineTo(640, y + (i % 2 === 0 ? 4 : -4));
        } else if (m.id === 'i') {
          ctx.moveTo(100, y);
          ctx.bezierCurveTo(260, y + (i % 2 === 0 ? -10 : 10), 420, y + (i % 2 === 0 ? 10 : -10), 640, y);
        } else {
          ctx.moveTo(100, y);
          ctx.lineTo(640, y);
        }
        ctx.stroke();
      }
      if (m.id === 'in') {
        ctx.fillStyle = COLORS.purple;
        for (let i = 0; i < 4; i++) {
          const y = 78 + i * 40;
          for (let x = 120; x < 640; x += 24) {
            ctx.beginPath();
            ctx.arc(x, y - 5, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    };

    const tick = () => {
      render(mode);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [mode]);

  const current = MODES.find((m) => m.id === mode) || MODES[3];

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl chips">
        {MODES.map((m) => (
          <button key={m.id} className={'chip' + (mode === m.id ? ' selected' : '')} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="detail-panel" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{current.label}做什么</div>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>{current.does}</li>
          <li>工具：{current.tool}</li>
          <li>代价：{current.cost}</li>
        </ul>
      </div>
      <div className="feedback">{current.note}</div>
    </div>
  );
};

export default Ch3Mod2;
