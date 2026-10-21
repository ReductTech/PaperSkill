import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { V, startScene, field } from './ov2-analogy';

const W = 1080;
const H = 280;

const NODES = [
  { x: 50, y: 104, w: 130, h: 72, name: '图像输入', detail: '224×224 第三人称相机图，切成 patch；本文实验中 384 没有更好，只多 3 倍训练开销。' },
  { x: 220, y: 44, w: 190, h: 84, name: '视觉编码器', detail: 'SigLIP 与 DINOv2 双路编码后按通道拼接，合计约 600M 参数；补的是精确的空间位置。' },
  { x: 220, y: 164, w: 190, h: 72, name: '语言指令', detail: '一句任务描述，被 tokenize 后与图像 token 拼成同一段前缀。' },
  { x: 450, y: 104, w: 150, h: 72, name: '投影器', detail: '2 层 MLP，把视觉特征搬进 Llama 的嵌入空间；少了它，图像和文字无法拼在一起。' },
  { x: 640, y: 104, w: 180, h: 72, name: 'Llama 2 7B', detail: '7B 语言主干，接收前缀、逐位吐出动作 token；动作头就是词表里的 256 个 token。' },
];

export const Ov2Ch6Arch: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(0);
  const [sel, setSel] = useState(0);
  const [fb, setFb] = useState({ text: NODES[0].detail, cls: '' });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    return startScene(cv, W, H, (ctx) => {
      const s = stateRef.current;
      field(ctx, W, H);
      const arrow = (x1: number, y1: number, x2: number, y2: number, on: boolean) => {
        ctx.strokeStyle = on ? V.blue : V.line;
        ctx.lineWidth = on ? 3 : 1.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const a = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 9 * Math.cos(a - 0.4), y2 - 9 * Math.sin(a - 0.4));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 9 * Math.cos(a + 0.4), y2 - 9 * Math.sin(a + 0.4));
        ctx.stroke();
      };
      arrow(180, 140, 220, 96, s >= 1);
      arrow(180, 140, 220, 196, s >= 1);
      arrow(410, 96, 450, 128, s >= 3);
      arrow(410, 196, 450, 152, s >= 3);
      arrow(600, 140, 640, 140, s >= 4);
      NODES.forEach((n, i) => {
        const active = i === s;
        ctx.fillStyle = active ? '#f3eefc' : '#ffffff';
        ctx.strokeStyle = active ? V.purple : i < s ? V.blue : V.line;
        ctx.lineWidth = active ? 3 : 1.5;
        ctx.beginPath();
        ctx.roundRect(n.x, n.y, n.w, n.h, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? V.purple : V.ink;
        ctx.font = '700 24px "Segoe UI", sans-serif';
        ctx.fillText(String(i + 1), n.x + n.w / 2 - 8, n.y + n.h / 2 + 8);
      });
      // 动作 token 输出
      const on = s === 4;
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = on ? V.green : '#ffffff';
        ctx.strokeStyle = on ? V.green : V.line;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(860 + i * 28, 126, 22, 28, 3);
        ctx.fill();
        ctx.stroke();
      }
      arrow(820, 140, 856, 140, on);
    });
  }, []);

  const pick = (i: number) => {
    stateRef.current = i;
    setSel(i);
    setFb({ text: NODES[i].detail, cls: i === 4 ? 'good' : '' });
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="chip-row">
        {NODES.map((n, i) => (
          <button key={n.name} className={`chip${sel === i ? ' selected' : ''}`} onClick={() => pick(i)}>
            {i + 1}. {n.name}
          </button>
        ))}
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ov2Ch6Arch;
