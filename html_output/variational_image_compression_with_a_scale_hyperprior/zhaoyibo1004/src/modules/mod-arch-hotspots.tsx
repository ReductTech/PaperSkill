import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;

const NODES = [
  { id: 'ga', label: 'g_a', x: 300, y: 90, title: '分析变换 g_a', desc: '卷积 + GDN + 下采样：把像素 x 压成隐变量 y。' },
  { id: 'gs', label: 'g_s', x: 780, y: 90, title: '合成变换 g_s', desc: '卷积 + IGDN + 上采样：把 ŷ 重建回图像 x̂。' },
  { id: 'ha', label: 'h_a', x: 430, y: 220, title: '超先验分析 h_a', desc: '卷积下采样：把 y 压成边信息 z。' },
  { id: 'hs', label: 'h_s', x: 650, y: 220, title: '超先验合成 h_s', desc: '卷积上采样：把 z 解成逐元素尺度 σ。' },
];

export const ModArchHotspots: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'ga' });
  const raf = useRef<number | null>(null);
  const [sel, setSel] = useState('ga');
  const [fb, setFb] = useState({ text: `已选中 ${NODES[0].title}：${NODES[0].desc}`, cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(c, W, H);
    } catch {
      return;
    }

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // passive nodes
      const drawNode = (id: string, x: number, y: number) => {
        const active = s.sel === id;
        ctx.fillStyle = active ? '#27446e' : '#e6ede2';
        ctx.strokeStyle = active ? '#27446e' : '#d7deea';
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(NODES.find((n) => n.id === id)?.label || '', x, y + 6);
      };

      // main path: x -> ga -> y -> round -> yhat -> gs -> xhat
      const yY = 90;
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(120, yY);
      ctx.lineTo(300 - 34, yY);
      ctx.moveTo(300 + 34, yY);
      ctx.lineTo(780 - 34, yY);
      ctx.moveTo(780 + 34, yY);
      ctx.lineTo(960, yY);
      ctx.stroke();

      drawNode('ga', 300, yY);
      drawNode('gs', 780, yY);

      // side nodes y/xhat
      ctx.fillStyle = '#b8c9a7';
      ctx.beginPath();
      ctx.arc(120, yY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.fillText('x', 120, yY + 5);
      ctx.fillStyle = '#b8c9a7';
      ctx.beginPath();
      ctx.arc(960, yY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.fillText('x̂', 960, yY + 5);

      // y and yhat labels
      ctx.fillStyle = '#21324a';
      ctx.fillText('y', 540, yY - 40);
      ctx.fillText('ŷ', 540, yY + 46);

      // hyper branch: y -> ha -> z -> hs -> sigma
      ctx.strokeStyle = '#d7deea';
      ctx.beginPath();
      ctx.moveTo(300, yY + 34);
      ctx.lineTo(430, 220 - 34);
      ctx.moveTo(430 + 34, 220);
      ctx.lineTo(650 - 34, 220);
      ctx.moveTo(650 + 34, 220);
      ctx.lineTo(780, 220);
      ctx.stroke();

      drawNode('ha', 430, 220);
      drawNode('hs', 650, 220);

      ctx.fillStyle = '#b8c9a7';
      ctx.beginPath();
      ctx.arc(540, 220, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#21324a';
      ctx.fillText('z', 540, 220 + 5);
      ctx.fillStyle = '#21324a';
      ctx.fillText('σ', 820, 220 + 5);
    };

    const tick = () => {
      render();
      if (!c.classList.contains('is-ready')) c.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf.current) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
    };
    const start = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(c, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: string) => {
    const n = NODES.find((x) => x.id === id);
    if (!n) return;
    stateRef.current.sel = id;
    setSel(id);
    setFb({ text: `已选中 ${n.title}：${n.desc}`, cls: '' });
  };

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = ref.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    for (const n of NODES) {
      const dx = x - n.x;
      const dy = y - n.y;
      if (dx * dx + dy * dy <= 46 * 46) {
        pick(n.id);
        return;
      }
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} onClick={onClick} style={{ cursor: 'pointer' }} />
      <div className="chip-row">
        {NODES.map((n) => (
          <button key={n.id} className={`chip ${sel === n.id ? 'selected' : ''}`} onClick={() => pick(n.id)}>
            {n.title}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default ModArchHotspots;
