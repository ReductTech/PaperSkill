import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

// 表 1 原值：I2I 准确率、I2T 准确率、P(I2T✓|I2I✓)、P(I2T✓|I2I✗)
type Task = { id: string; name: string; zh: string; i2i: number; i2t: number; pRight: number; pWrong: number; note: string };
const TASKS: Task[] = [
  { id: 'jigsaw', name: 'Jigsaw', zh: '拼图', i2i: 70.9, i2t: 81.3, pRight: 88.2, pWrong: 64.3, note: '拼图任务里，拼错往往意味着整体空间结构读错，口述也跟着错——两种输出绑得紧。' },
  { id: 'zoomin', name: 'Zoom-In', zh: '缩放排序', i2i: 91.8, i2t: 90.6, pRight: 90.9, pWrong: 86.7, note: 'Zoom-In 本身容易，拼错时口述仍有 86.7%，两种输出的绑定比 Jigsaw 松。' },
];

function quadrants(task: Task) {
  const n = 1000;
  const i2iRight = (task.i2i / 100) * n;
  const both = (task.pRight / 100) * i2iRight;
  const i2iWrong = n - i2iRight;
  const textOnly = (task.pWrong / 100) * i2iWrong;
  return {
    n,
    both: Math.round(both),
    imageOnly: Math.round(i2iRight - both),
    textOnly: Math.round(textOnly),
    neither: Math.round(n - i2iRight - textOnly),
    i2iRight: Math.round(i2iRight),
  };
}

type CellId = 'both' | 'imageOnly' | 'textOnly' | 'neither';
const CELL_TEXT: Record<CellId, { read: string; color: string }> = {
  both: { read: '多数样本落在这里：同一个视觉问题被两种输出同时答对。', color: '#228d5c' },
  imageOnly: { read: '拼出来了却报错顺序：图像输出成功，不代表文本输出必然成功。', color: '#27446e' },
  textOnly: { read: '可能是猜对了顺序，也可能口述只需要部分线索。', color: '#f07e47' },
  neither: { read: '两种输出同时失败，通常对应同一批难样本。', color: '#c43f52' },
};
const ORDER: CellId[] = ['both', 'imageOnly', 'textOnly', 'neither'];

export function S4Instance(_props: WidgetProps) {
  const [taskId, setId] = useState('jigsaw');
  const [picked, setPicked] = useState<CellId>('both');
  const task = TASKS.find((item) => item.id === taskId)!;
  const q = quadrants(task);
  const values: Record<CellId, number> = { both: q.both, imageOnly: q.imageOnly, textOnly: q.textOnly, neither: q.neither };
  const imageRight = picked === 'both' || picked === 'imageOnly';
  const cond = imageRight ? task.pRight : task.pWrong;
  const tone = CELL_TEXT[picked].color;

  let offset = 0;
  const segs = ORDER.map((id) => {
    const width = (values[id] / q.n) * 880;
    const node = (
      <g key={id} transform={`translate(${offset} 0)`} role="button" tabIndex={0}
        aria-label={`${id} ${values[id]} 例`} style={{ cursor: 'pointer' }}
        onClick={() => setPicked(id)}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setPicked(id); } }}>
        <rect width={width} height="62" fill={CELL_TEXT[id].color} opacity={picked === id ? 0.95 : 0.5} />
        <text x={width / 2} y="38" fontSize={width > 90 ? 21 : 15} fill="#fff" textAnchor="middle">{values[id]}</text>
      </g>
    );
    offset += width;
    return node;
  });

  return (
    <div style={{ display: 'flex', gap: 24, width: 1472, height: 622 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {TASKS.map((item) => (
            <button key={item.id} type="button" onClick={() => setId(item.id)}
              style={{
                flex: 1, padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 24,
                color: C.ink, background: item.id === taskId ? 'rgba(39,68,110,.10)' : '#fff',
                border: `2px solid ${item.id === taskId ? C.blue : C.line}`,
              }}>{item.name} · {item.zh}</button>
          ))}
        </div>

        <div style={{ background: C.bg, border: `2px solid ${C.line}`, borderRadius: 16, padding: '12px 18px' }}>
          <div style={{ fontSize: 21, color: C.muted }}>把 1000 个评估样本按「拼图对错 × 口述对错」铺开（由表 1 的四个比例换算）</div>
          <svg viewBox="0 0 880 62" width="880" height="62" role="group" aria-label="四格样本条，可点选" style={{ marginTop: 6 }}>{segs}</svg>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 10 }}>
            {ORDER.map((id) => (
              <button key={id} type="button" onClick={() => setPicked(id)}
                style={{
                  textAlign: 'left', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  background: picked === id ? 'rgba(240,126,71,.10)' : '#fff',
                  border: `2px solid ${picked === id ? C.orange : C.line}`,
                }}>
                <span style={{ display: 'block', fontSize: 18, color: C.muted }}>
                  {id === 'both' ? '拼对 + 说对' : id === 'imageOnly' ? '拼对 + 说错' : id === 'textOnly' ? '拼错 + 说对' : '拼错 + 说错'}
                </span>
                <span style={{ display: 'block', fontSize: 25, fontWeight: 700, color: CELL_TEXT[id].color }}>{values[id]} 例</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, background: '#fff', border: `2px solid ${tone}`, borderRadius: 14, padding: '12px 16px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: tone }}>
              P(I2T✓ | I2I{imageRight ? '✓' : '×'}) = {cond.toFixed(1)}%
            </div>
            <div style={{ fontSize: 20, color: C.muted, marginTop: 4 }}>
              {imageRight
                ? `${q.i2iRight} 个拼图正确的样本里有 ${q.both} 个口述也正确。`
                : `${q.n - q.i2iRight} 个拼图错误的样本里有 ${q.textOnly} 个口述仍正确。`}
            </div>
          </div>
          <div style={{ flex: 1, background: '#fff', border: `2px solid ${C.line}`, borderRadius: 14, padding: '12px 16px' }}>
            <div style={{ fontSize: 20, color: C.muted }}>所选那一格说明什么</div>
            <div style={{ fontSize: 21, color: C.ink, marginTop: 4, lineHeight: 1.45 }}>{CELL_TEXT[picked].read}</div>
          </div>
        </div>
      </div>

      <div style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: '#fff', border: `2px solid ${C.line}`, borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 20, color: C.muted }}>表 1 原值（30k I2I + 1k I2T，3 seeds）</div>
          <div style={{ fontSize: 21, color: C.ink, lineHeight: 1.7, marginTop: 6 }}>
            I2I 准确率 <b>{task.i2i.toFixed(1)}%</b><br />
            I2T 准确率 <b>{task.i2t.toFixed(1)}%</b><br />
            P(I2T✓|I2I✓) <b>{task.pRight.toFixed(1)}%</b><br />
            P(I2T✓|I2I×) <b>{task.pWrong.toFixed(1)}%</b>
          </div>
        </div>
        <div style={{ background: '#fff', border: `2px solid ${C.line}`, borderRadius: 14, padding: '14px 18px', flex: 1 }}>
          <div style={{ fontSize: 22, color: C.ink, lineHeight: 1.5 }}>{task.note}</div>
          <div style={{ fontSize: 19, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>
            四格计数是把表 1 的四个比例按 1000 例换算并取整（±1 例误差）；条件正确率仍以表中百分数为准。
          </div>
        </div>
      </div>
    </div>
  );
}
