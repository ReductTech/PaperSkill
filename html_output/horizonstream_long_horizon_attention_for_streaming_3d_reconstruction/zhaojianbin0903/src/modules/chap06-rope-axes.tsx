import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { setupCanvas } from '../lib/canvasKit';

type Axis = 'time' | 'height' | 'width' | 'all';
type Pair = 'repeat' | 'motion' | 'corner';

const axes: Array<{ key: Axis; label: string }> = [
  { key: 'time', label: '时间 t' },
  { key: 'height', label: '高度 y' },
  { key: 'width', label: '宽度 x' },
  { key: 'all', label: '三轴联合' },
];

const pairs: Record<Pair, { label: string; a: [number, number, number]; b: [number, number, number] }> = {
  repeat: { label: '跨帧重复窗格', a: [0, 2, 2], b: [2, 2, 4] },
  motion: { label: '同列移动边缘', a: [0, 1, 3], b: [1, 4, 3] },
  corner: { label: '同帧相似角点', a: [1, 1, 1], b: [1, 4, 5] },
};

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export const Chap06RopeAxes: React.FC<WidgetProps> = ({ moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [axis, setAxis] = useState<Axis>('all');
  const [pair, setPair] = useState<Pair>('repeat');
  const reducedMotion = useReducedMotion();
  const selected = pairs[pair];

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = () => setWidth(Math.max(260, Math.floor(host.getBoundingClientRect().width)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const height = 306;
    const ctx = setupCanvas(canvas, width, height);
    canvas.classList.add('is-ready');
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#e2e6eb';
    for (let x = 0; x <= width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const frameW = Math.min(330, width * 0.5);
    const frameH = 176;
    const baseX = Math.max(28, width * 0.08);
    const baseY = 72;
    for (let frame = 2; frame >= 0; frame -= 1) {
      const offset = frame * 15;
      const x = baseX + offset;
      const y = baseY - offset;
      ctx.fillStyle = frame === 0 ? '#eef3fb' : '#f2f4f6';
      ctx.fillRect(x, y, frameW, frameH);
      ctx.strokeStyle = frame === 0 ? '#1455d9' : '#9ca9ba';
      ctx.lineWidth = frame === 0 ? 2 : 1;
      ctx.strokeRect(x, y, frameW, frameH);
      ctx.fillStyle = '#5e6978';
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText(`t=${2 - frame}`, x + 8, y + 18);
      for (let gx = 1; gx < 6; gx += 1) {
        ctx.strokeStyle = '#d5dbe3';
        ctx.beginPath();
        ctx.moveTo(x + (gx / 6) * frameW, y + 26);
        ctx.lineTo(x + (gx / 6) * frameW, y + frameH);
        ctx.stroke();
      }
      for (let gy = 1; gy < 5; gy += 1) {
        ctx.beginPath();
        ctx.moveTo(x, y + 26 + (gy / 5) * (frameH - 26));
        ctx.lineTo(x + frameW, y + 26 + (gy / 5) * (frameH - 26));
        ctx.stroke();
      }
    }

    const patchPoint = (coord: [number, number, number]) => {
      const [t, yIndex, xIndex] = coord;
      const offset = (2 - t) * 15;
      const x = baseX + offset + (xIndex / 6) * frameW;
      const y = baseY - offset + 26 + (yIndex / 5) * (frameH - 26);
      return [x, y] as const;
    };
    const [ax, ay] = patchPoint(selected.a);
    const [bx, by] = patchPoint(selected.b);
    ctx.fillStyle = '#1455d9';
    ctx.fillRect(ax - 8, ay - 8, 16, 16);
    ctx.fillStyle = '#c66a16';
    ctx.fillRect(bx - 8, by - 8, 16, 16);
    ctx.strokeStyle = '#657286';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.setLineDash([]);

    const infoX = Math.min(width - 200, baseX + frameW + 78);
    const infoW = Math.max(170, width - infoX - 20);
    const activeAxes = axis === 'all' ? ['Δt', 'Δy', 'Δx'] : [axis === 'time' ? 'Δt' : axis === 'height' ? 'Δy' : 'Δx'];
    ctx.fillStyle = '#17202b';
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.fillText('相对坐标读数', infoX, 54);
    const deltas = [selected.b[0] - selected.a[0], selected.b[1] - selected.a[1], selected.b[2] - selected.a[2]];
    ['Δt', 'Δy', 'Δx'].forEach((label, index) => {
      const active = activeAxes.includes(label);
      const y = 78 + index * 52;
      ctx.fillStyle = active ? (index === 0 ? '#1455d9' : index === 1 ? '#16875b' : '#7357c8') : '#e1e5ea';
      ctx.fillRect(infoX, y, Math.min(infoW, 180), 34);
      ctx.fillStyle = active ? '#ffffff' : '#657286';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillText(`${label} = ${deltas[index]}`, infoX + 10, y + 22);
    });
    ctx.fillStyle = '#f0eefa';
    ctx.fillRect(infoX, 240, Math.min(infoW, 200), 42);
    ctx.fillStyle = '#5b439e';
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.fillText('MRT / 位姿 Token：π=(0,0,0)', infoX + 9, 265);

    ctx.fillStyle = '#5e6978';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('机制示意，不是模型输出', baseX, height - 13);
  }, [axis, selected, width]);

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? '#1455d9' : '#c9d0d9'}`,
    background: active ? '#eaf0fb' : '#ffffff',
    color: active ? '#123f9e' : '#344054',
    borderRadius: 6,
    padding: '8px 10px',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  });

  const delta = {
    time: selected.b[0] - selected.a[0],
    height: selected.b[1] - selected.a[1],
    width: selected.b[2] - selected.a[2],
  };
  const feedback = axis === 'all'
    ? `三轴联合得到完整相对位移 (Δt,Δy,Δx)=(${delta.time},${delta.height},${delta.width})，两块相似纹理拥有唯一的时空位置关系。`
    : `只使用${axis === 'time' ? '时间' : axis === 'height' ? '高度' : '宽度'}轴时，只知道一个偏移量，其他两个维度仍然存在歧义。`;

  return (
    <section aria-label={`交互模块 ${moduleId}：时空 RoPE 三轴定位`} style={{ display: 'grid', gap: 14 }}>
      <div ref={hostRef} style={{ width: '100%', height: 306, overflow: 'hidden', border: '1px solid #d5dbe3', borderRadius: 6 }}>
        <canvas ref={canvasRef} role="img" aria-label={`${selected.label}在${axes.find((item) => item.key === axis)?.label}编码下的相对位置示意`} />
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend style={{ marginBottom: 8, fontWeight: 700 }}>启用哪些相对坐标</legend>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {axes.map((item) => (
              <button key={item.key} type="button" aria-pressed={axis === item.key} onClick={() => setAxis(item.key)} style={buttonStyle(axis === item.key)}>
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
          <legend style={{ marginBottom: 8, fontWeight: 700 }}>选择相似 patch 对</legend>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {(Object.keys(pairs) as Pair[]).map((key) => (
              <button key={key} type="button" aria-pressed={pair === key} onClick={() => setPair(key)} style={buttonStyle(pair === key)}>
                {pairs[key].label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <output aria-live="polite" style={{ minHeight: 58, padding: '10px 12px', border: '1px solid #b9c8e8', borderRadius: 4, background: '#f4f6f8', color: '#243142' }}>
        {feedback} 图像 patch 使用 π=(t+1,y+1,x+1)，MRT 与位姿 Token 置于坐标原点 (0,0,0)。{reducedMotion ? ' 当前按减少动态效果偏好即时重绘。' : ''}
      </output>
    </section>
  );
};
