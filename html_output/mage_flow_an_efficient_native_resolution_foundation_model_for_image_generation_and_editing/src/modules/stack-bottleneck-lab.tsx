import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 680, H = 330;
const levels = [1024, 1536, 2048] as const;
const bars = [[35, 40, 38], [58, 62, 66], [84, 82, 94]] as const;
const feedback = [
  { text: '基础负载尚可，但分词器仍进入每次训练与编辑。', cls: '' },
  { text: '分辨率升高后，不能只盯着 Transformer。', cls: 'warn' },
  { text: '高分辨率把分词器、序列长度和内存流量一起放大。', cls: 'bad' },
] as const;

export const StackBottleneckLab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.maxWidth = '100%'; canvas.style.height = 'auto';
    ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#d8c9b0'; ctx.globalAlpha = .35;
    for (let x = 16; x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 16; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.globalAlpha = 1;
    const scale = [.50, .73, .96][index]; const pw = 265 * scale, ph = 205 * scale;
    ctx.setLineDash([6, 5]); ctx.strokeStyle = '#6c6a64'; ctx.strokeRect(35, 54, 270, 210); ctx.setLineDash([]);
    ctx.fillStyle = '#faf9f5'; ctx.strokeStyle = '#cc785c'; ctx.lineWidth = 2.5; ctx.fillRect(35, 54, pw, ph); ctx.strokeRect(35, 54, pw, ph);
    ctx.fillStyle = '#252523'; ctx.font = '600 15px "Segoe UI", sans-serif'; ctx.fillText(`${levels[index]} 相对档位`, 35, 35);
    const names = ['分词器', '生成骨干', '内存流量']; const colors = index === 2 ? ['#c64545', '#cc785c', '#c64545'] : index === 1 ? ['#e8a55a', '#cc785c', '#e8a55a'] : ['#cc785c', '#cc785c', '#cc785c'];
    names.forEach((name, i) => { const y = 78 + i * 62; ctx.fillStyle = '#e6dfd8'; ctx.fillRect(365, y, 250, 20); ctx.fillStyle = colors[i]; ctx.fillRect(365, y, bars[index][i] * 2.5, 20); ctx.fillStyle = '#252523'; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText(name, 365, y - 8); });
    ctx.fillStyle = '#6c6a64'; ctx.font = '12px "Segoe UI", sans-serif'; ctx.fillText('相对负载，不对应论文实测值', 345, 280);
    if (index === 2) { ctx.fillStyle = '#5db872'; ctx.font = '600 13px "Segoe UI", sans-serif'; ctx.fillText('✓ 已定位栈级瓶颈', 365, 308); }
    canvas.classList.add('is-ready');
  }, [index]);
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} aria-label={`当前 ${levels[index]} 相对档位，分词器、骨干和内存流量相对负载同步变化`} />
    <div className="ctrl"><label htmlFor={`resolution-${moduleId}`}>输出边长 <span className="val">{levels[index]}</span></label><input id={`resolution-${moduleId}`} type="range" min={0} max={2} step={1} value={index} onChange={(e) => setIndex(Number(e.target.value))} aria-valuetext={`${levels[index]} 相对档位`} /><div className="range-labels"><span>1024</span><span>1536</span><span>2048</span></div></div>
    <div className={`feedback ${feedback[index].cls}`} aria-live="polite">{feedback[index].text}</div>
    <p className="module-note">NR-MMDiT 骨干规模为 4B。论文的精确延迟基于单张 A100、1024×1024、四步 Turbo 协议，因此这里不把抽象档位直接换算成秒数。</p>
  </div>;
};

export default StackBottleneckLab;
