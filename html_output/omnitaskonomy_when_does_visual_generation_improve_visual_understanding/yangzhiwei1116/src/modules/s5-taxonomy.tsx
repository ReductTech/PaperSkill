import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

// 论文 p.6 明确写出归属的 5 个 I2I 任务
type Task = { id: string; zh: string; en: string; answer: string; why: string };
const TASKS: Task[] = [
  { id: 'obj', zh: '物体编辑', en: 'Object editing', answer: 'Recognition', why: '直接监督物体身份，因此归入 Recognition。' },
  { id: 'attr', zh: '属性编辑', en: 'Attribute editing', answer: 'Recognition', why: '直接监督颜色、材质等外观属性，归入 Recognition。' },
  { id: 'zdepth', zh: 'Z 深度', en: 'Z-depth', answer: 'Reconstruction', why: '与“深度理解”同族，归入 Reconstruction。' },
  { id: 'euc', zh: '欧氏深度', en: 'Euclidean depth', answer: 'Reconstruction', why: '预测稠密几何距离，归入 Reconstruction。' },
  { id: 'kp2d', zh: '2D 关键点', en: '2D keypoints', answer: 'Reorganization', why: '论文把它放在 Reorganization，与关键点、对应、排序同族。' },
];
const FAMILIES = [
  { id: 'Recognition', zh: '认料', def: '语义内容：物体与部件身份、外观、状态、活动、文字与符号。' },
  { id: 'Reconstruction', zh: '量形', def: '几何与光度：空间关系、深度、度量距离、朝向、3D 形状、光照、遮挡。' },
  { id: 'Reorganization', zh: '摆位', def: '如何分组、定位、关联：分割、对应、排序、计数、关键点、连通性。' },
];

const CAP_EXAMPLES: Record<string, string[]> = {
  Recognition: ['类别识别', '外观理解', 'OCR / 文字'],
  Reconstruction: ['深度理解', '度量 3D 关系', '朝向理解'],
  Reorganization: ['计数', '2D 排序', '视觉对应'],
};

export function S5Taxonomy(_props: WidgetProps) {
  const [placed, setPlaced] = useState<Record<string, string | null>>({});
  const [selected, setSelected] = useState<string | null>('obj');
  const [last, setLast] = useState<{ ok: boolean; text: string } | null>(null);

  const task = TASKS.find((item) => item.id === selected) ?? null;
  const placedCount = Object.values(placed).filter(Boolean).length;
  const correctCount = TASKS.filter((item) => placed[item.id] === item.answer).length;

  const drop = (family: string) => {
    if (!task) return;
    const ok = task.answer === family;
    setPlaced((prev) => ({ ...prev, [task.id]: family }));
    setLast({
      ok,
      text: ok
        ? `${task.en} 属于 ${family}：${task.why}`
        : `${task.en} 不在 ${family}。${task.why}`,
    });
    const next = TASKS.find((item) => !placed[item.id] && item.id !== task.id && task.id !== item.id);
    setSelected(next ? next.id : null);
  };

  return (
    <div style={{ display: 'flex', gap: 22, width: 1472, height: 622 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 21, color: C.muted }}>
          先点一个 I2I 任务，再点它该挂的那块板（论文按“目标直接监督的视觉能力”归位）
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {FAMILIES.map((family) => {
            const here = TASKS.filter((item) => placed[item.id] === family.id);
            const wrong = here.filter((item) => item.answer !== family.id).length;
            return (
              <button key={family.id} type="button" onClick={() => drop(family.id)}
                disabled={!task}
                style={{
                  flex: 1, textAlign: 'left', padding: '12px 14px', borderRadius: 14, fontFamily: 'inherit',
                  cursor: task ? 'pointer' : 'default',
                  background: '#fff',
                  border: `2px dashed ${task ? C.blue : C.line}`,
                  minHeight: 300,
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                <span style={{ fontSize: 25, fontWeight: 700, color: C.ink }}>{family.zh}</span>
                <span style={{ fontSize: 17, color: C.muted }}>{family.id}</span>
                <span style={{ fontSize: 18, color: C.muted, lineHeight: 1.4 }}>{family.def}</span>
                <span style={{ marginTop: 8, fontSize: 17, color: C.muted }}>能力示例（另一列）</span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CAP_EXAMPLES[family.id].map((name) => (
                    <span key={name} style={{
                      fontSize: 17, padding: '4px 9px', borderRadius: 12, background: C.woodSoft,
                      border: `1.5px solid ${C.line}`, color: C.ink,
                    }}>{name}</span>
                  ))}
                </span>
                <span style={{ marginTop: 'auto', fontSize: 17, color: C.muted }}>已挂任务</span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {here.map((item) => (
                    <span key={item.id} style={{
                      fontSize: 18, padding: '5px 10px', borderRadius: 14,
                      background: item.answer === family.id ? 'rgba(34,141,92,.12)' : 'rgba(196,63,82,.12)',
                      color: item.answer === family.id ? C.green : C.red,
                      border: `1.5px solid ${item.answer === family.id ? C.green : C.red}`,
                    }}>{item.en}</span>
                  ))}
                  {here.length === 0 && <span style={{ fontSize: 17, color: C.line }}>　</span>}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ background: C.bg, border: `2px solid ${C.line}`, borderRadius: 14, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 19, color: C.muted }}>任务池</span>
            {TASKS.map((item) => {
              const done = Boolean(placed[item.id]);
              const active = selected === item.id;
              return (
                <button key={item.id} type="button" onClick={() => setSelected(item.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 20,
                    color: done ? C.muted : C.ink, background: active ? 'rgba(240,126,71,.12)' : '#fff',
                    border: `2px solid ${active ? C.orange : C.line}`,
                    textDecoration: done ? 'line-through' : 'none',
                  }}>{item.zh}</button>
              );
            })}
            <span style={{ fontSize: 19, color: C.green, marginLeft: 'auto' }}>
              已挂 {placedCount}/5 · 正确 {correctCount}
            </span>
          </div>
          {last && (
            <div style={{ marginTop: 8, fontSize: 20, lineHeight: 1.45, color: last.ok ? C.green : C.red }}>{last.text}</div>
          )}
          {!last && task && (
            <div style={{ marginTop: 8, fontSize: 20, color: C.muted }}>已选「{task.zh}」，点上方任一块挂板完成归位。</div>
          )}
        </div>
      </div>

      <div style={{ width: 430, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: '#fff', border: `2px solid ${C.blue}`, borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink }}>{task ? task.zh : '全部挂完'}</div>
          <div style={{ fontSize: 19, color: C.muted }}>{task ? task.en : '19 个 I2I 任务只展示了 5 个'}</div>
          <div style={{ fontSize: 21, color: C.ink, lineHeight: 1.5, marginTop: 8 }}>
            {task ? task.why : '论文的 3R 层级下：25 个理解能力与 19 个 I2I 任务是分离的叶子。'}
          </div>
        </div>
        <div style={{ background: '#fff', border: `2px solid ${C.green}`, borderRadius: 14, padding: '14px 18px', flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>为什么两列要分开</div>
          <div style={{ fontSize: 21, color: C.ink, lineHeight: 1.55, marginTop: 8 }}>
            能力回答“要会什么”，任务回答“用什么监督去练”。同一块挂板里的两者共享视觉能力，但不是同一条叶子——所以 19 个任务能对着 25 个能力逐一测迁移。
          </div>
          <div style={{ fontSize: 19, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>
            另有 6 个能力评估样本不足 100（部件识别、符号识别、区域语义、遮挡理解、3D 形状推理、2D 关键点），不出现在主文迁移图中。
          </div>
        </div>
      </div>
    </div>
  );
}
