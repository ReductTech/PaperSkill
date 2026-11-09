import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;

export const CategoryWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'fixed' | 'text'>('fixed');
  const [added, setAdded] = useState(false);
  const [fb, setFb] = useState({ text: '先点“加入新概念”，比较两种监督方式。', cls: '' });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(c, W, H); c.classList.add('is-ready'); } catch { return; }
    ctx.fillStyle = '#f5f8f0';
    ctx.fillRect(0, 0, W, H);

    const col = (x: number, title: string, color: string, rows: string[], active: boolean) => {
      ctx.fillStyle = active ? color : '#b8c9a7';
      ctx.fillRect(x, 56, 460, 44);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillText(title, x + 20, 85);
      ctx.font = '18px "Segoe UI", sans-serif';
      rows.forEach((r, i) => {
        ctx.fillStyle = active ? '#21324a' : '#68778f';
        ctx.fillText(r, x + 20, 135 + i * 38);
      });
    };

    const fixedRows = [
      '输出单元：3 个，已满',
      added ? '新概念：无槽位' : '新概念：未加入',
      '新增代价：补标注并重训',
      '监督来源：人工类别标签',
    ];
    const textRows = [
      '输出单元：文本嵌入空间',
      added ? '新概念：可由描述表达' : '新概念：未加入',
      '新增代价：改一句描述',
      '监督来源：图文配对文本',
    ];
    col(60, '固定类别分类器', '#c43f52', fixedRows, mode === 'fixed');
    col(560, '文本监督（CLIP）', '#228d5c', textRows, mode === 'text');

    ctx.fillStyle = '#21324a';
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillText(added ? '同一张“望远镜”图片，两种系统的处理结果' : '两种系统的能力对比', 60, 36);

    if (added) {
      ctx.fillStyle = mode === 'fixed' ? '#c43f52' : '#228d5c';
      ctx.font = 'bold 19px "Segoe UI", sans-serif';
      ctx.fillText(mode === 'fixed' ? '结果：没有对应输出位置，须新增类别并重训' : '结果：用“望远镜”这一描述即可参与匹配', 60, 292);
    }
  }, [mode, added]);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <button onClick={() => {
          setAdded(true);
          setFb({ text: '新概念已加入。固定类别缺少槽位，文本监督可由描述表达。', cls: mode === 'fixed' ? 'bad' : 'good' });
        }}>
          加入新概念
        </button>
        <button onClick={() => {
          const next = mode === 'fixed' ? 'text' : 'fixed';
          setMode(next);
          setFb(next === 'text'
            ? { text: '切到文本监督：类别名与描述都可作为查询，新增概念无须改输出层。', cls: 'good' }
            : { text: '切回固定类别：输出单元固定，新增概念须补标注并重训。', cls: 'bad' });
        }}>
          切换监督方式
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default CategoryWidget;
