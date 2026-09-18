import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, clearScene, drawPaperSheet, drawArrow } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const NODES = [
  {
    id: 't', name: '翻译', x: 110, color: COLORS.orange,
    does: '换语言往返，制造语义损失，打乱原作者的用词习惯。',
    why: '排在第一位：它只需要原文，输出会变得生硬，随后由模仿修复。',
    tool: 'translateLocally（English → Spanish → German → English）',
  },
  {
    id: 'o', name: '混淆', x: 320, color: COLORS.orange,
    does: '逐行释义，磨掉作者原有的节奏与句式。',
    why: '与翻译同级：进一步破坏风格，同样会把可读性压低。',
    tool: 'PEGASUS',
  },
  {
    id: 'i', name: '模仿', x: 530, color: COLORS.blue,
    does: '换一个人设重写，把前两步弄崩的可读性补回来。',
    why: '必须排在翻译与混淆之后：它的职责就是修补这两步造成的可读性崩塌。',
    tool: '自托管 Ollama + Negentropy-claude-opus-4.7-9B-GGUF',
  },
  {
    id: 'in', name: '注入', x: 740, color: COLORS.green,
    does: '插入零宽字符、替换同形字、替换拼写变体，直接污染文体特征。',
    why: '必须排在最后：注入会破坏它之前的所有文本处理，所以只能收尾。',
    tool: 'pyUnicodeSteganography → SilverSpeak → eng',
  },
];

export const Ch8Mod1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const [node, setNode] = useState('in');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (id: string) => {
      clearScene(ctx, W, H);
      drawPaperSheet(ctx, 60, 40, 960, 150);
      const activeIndex = NODES.findIndex((x) => x.id === id);
      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        const active = i === activeIndex;
        const passed = i <= activeIndex;
        ctx.fillStyle = active ? 'rgba(39,68,110,0.14)' : '#ffffff';
        ctx.fillRect(n.x, 74, 150, 62);
        ctx.strokeStyle = active ? n.color : COLORS.line;
        ctx.lineWidth = active ? 5 : 2;
        ctx.strokeRect(n.x, 74, 150, 62);
        ctx.fillStyle = passed ? n.color : COLORS.muted;
        ctx.font = '30px "PingFang SC", sans-serif';
        ctx.fillText(String(i + 1), n.x + 18, 118);
        if (i < NODES.length - 1) {
          drawArrow(ctx, n.x + 150, 105, NODES[i + 1].x, 105, passed ? n.color : COLORS.line);
        }
      }
    };

    const tick = () => {
      render(node);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [node]);

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const hit = NODES.find((n) => x >= n.x && x <= n.x + 150 && y >= 74 && y <= 136);
    if (hit) setNode(hit.id);
  };

  const current = NODES.find((n) => n.id === node) || NODES[3];
  const index = NODES.findIndex((n) => n.id === current.id) + 1;

  return (
    <div>
      <canvas ref={ref} width={W} height={H} onClick={onCanvasClick} style={{ cursor: 'pointer' }} />
      <div className="ctrl chips">
        {NODES.map((n, i) => (
          <button key={n.id} className={'chip' + (node === n.id ? ' selected' : '')} onClick={() => setNode(n.id)}>
            {i + 1}. {n.name}
          </button>
        ))}
      </div>
      <div className="detail-panel" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>第 {index} 层：{current.name}</div>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>{current.does}</li>
          <li>{current.why}</li>
          <li>工具：{current.tool}</li>
        </ul>
      </div>
      <div className={'feedback' + (current.id === 'in' ? ' good' : '')}>
        第 {index} 层「{current.name}」：{current.why}
        论文把这套结构称为纵深防御式的冗余——任何一层被平台清洗掉，下一层仍然有效。
      </div>
    </div>
  );
};

export default Ch8Mod1;
