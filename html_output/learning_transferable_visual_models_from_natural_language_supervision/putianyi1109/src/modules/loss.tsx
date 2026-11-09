import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 400;
const n = 4;
const diag = [0.88, 0.85, 0.9, 0.87];
const off = [0.12, 0.2, 0.31, 0.18];

type Mode = 'row' | 'col' | 'both' | 'why';

export const LossWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [dir, setDir] = useState<Mode>('row');
  const [fb, setFb] = useState({ text: '只算行方向：每行做一次 4 类分类。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H); c.classList.add('is-ready'); } catch { return; }
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);

    if (dir === 'why') {
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillText('为什么要两个方向：单侧训练会让另一模态缺少区分压力', 40, 36);
      const panel = (x: number, title: string, lines: string[], color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, 60, 320, 280);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 17px "Segoe UI", sans-serif';
        ctx.fillText(title, x + 16, 88);
        ctx.font = '15px "Segoe UI", sans-serif';
        lines.forEach((line, i) => ctx.fillText(line, x + 16, 120 + i * 26));
      };
      panel(40, '只算图找文', [
        '图像被拉向自己的文本。',
        '文本只作为目标，未被要求',
        '彼此区分，文本侧约束弱。',
        '结果：行方向对角占优，',
        '列方向不一定。',
      ], '#c43f52');
      panel(380, '只算文找图', [
        '文本被拉向自己的图像。',
        '图像只作为目标，未被要求',
        '彼此区分，图像侧约束弱。',
        '结果：列方向对角占优，',
        '行方向不一定。',
      ], '#c43f52');
      panel(720, '对称（两个方向）', [
        '行方向要求图像在 N 段',
        '文本中选中自己；列方向',
        '要求文本在 N 张图中选中',
        '自己。矩阵从行、列看都',
        '对角占优，两模态同受约束。',
      ], '#228d5c');
      ctx.fillStyle = '#68778f';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('取平均而非求和：两个方向权重相同，损失量级不随方向数翻倍', 40, 376);
      return;
    }

    const rowsOn = dir !== 'col';
    const colsOn = dir !== 'row';

    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText('对称交叉熵：行、列两个方向各做一次 4 类分类', 40, 34);

    ctx.font = '15px "Segoe UI", sans-serif';
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = 50 + j * 48;
        const y = 80 + i * 48;
        ctx.fillStyle = i === j ? '#228d5c' : '#27446e';
        ctx.fillRect(x, y, 42, 42);
        ctx.fillStyle = '#ffffff';
        const v = i === j ? diag[i] : off[(i + j) % off.length];
        ctx.fillText(v.toFixed(2), x + 6, y + 26);
      }
    }
    ctx.fillStyle = '#68778f';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('4×4 相似度矩阵，对角线为正样本', 50, 300);
    ctx.fillText('行 i：图 i 在 4 段文本上的分类；列 j：文本 j 在 4 张图上的分类', 50, 324);

    const panel = (x: number, y: number, on: boolean, title: string, body: string, value: string) => {
      ctx.fillStyle = on ? '#228d5c' : '#b8c9a7';
      ctx.fillRect(x, y, 300, 84);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText(title, x + 14, y + 26);
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText(body, x + 14, y + 50);
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillText(value, x + 14, y + 76);
    };
    panel(330, 70, rowsOn, '行方向 L_i：每行做 4 类分类', '标签为对角线位置，softmax 跨列', 'L_i = 1.20（示意）');
    panel(330, 190, colsOn, '列方向 L_t：每列做 4 类分类', '标签为对角线位置，softmax 跨行', 'L_t = 1.35（示意）');

    ctx.strokeStyle = rowsOn ? '#92400e' : '#d7deea';
    ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(250, 101 + i * 48);
      ctx.lineTo(330, 101 + i * 48);
      ctx.stroke();
    }
    ctx.strokeStyle = colsOn ? '#92400e' : '#d7deea';
    for (let j = 0; j < n; j++) {
      ctx.beginPath();
      ctx.moveTo(71 + j * 48, 272);
      ctx.lineTo(71 + j * 48, 320);
      ctx.stroke();
    }

    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 18px "Segoe UI", sans-serif';
    ctx.fillText('L = (L_i + L_t) / 2', 690, 150);
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText(dir === 'both' ? '= 1.28（示意）' : '单侧模式：只保留一条损失', 690, 180);
    ctx.fillStyle = '#68778f';
    ctx.fillText('两个方向都算时，两模态嵌入同时受约束', 690, 220);
  }, [dir]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => { setDir('row'); setFb({ text: '只算行方向：文本只作为目标，未被要求彼此区分。', cls: 'bad' }); }}>只算图找文</button>
        <button onClick={() => { setDir('col'); setFb({ text: '只算列方向：图像只作为目标，约束相应减弱。', cls: 'bad' }); }}>只算文找图</button>
        <button onClick={() => { setDir('both'); setFb({ text: '对称损失：两个方向各算一次交叉熵再平均。', cls: 'good' }); }}>对称（两个方向）</button>
        <button onClick={() => { setDir('why'); setFb({ text: '单侧训练只约束一个模态，对称训练让矩阵从行、列看都对角占优。', cls: '' }); }}>为什么两个方向</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default LossWidget;
