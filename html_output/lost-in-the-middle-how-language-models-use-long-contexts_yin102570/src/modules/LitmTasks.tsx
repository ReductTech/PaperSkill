import React, { useState } from 'react';

// 模块 2.1 —— P4 芯片 + 技术
// 论文的两个评测任务：多文档问答 / 合成检索（needle-in-a-haystack）。
const TASKS = [
  {
    id: 'mdqa',
    name: '多文档问答',
    en: 'Multi-Document QA',
    text: '给模型 N 篇文档，其中只有 1 篇含答案。问一个需要综合信息的问题，看模型能否找到那篇并答对。',
    color: '#52e0a0',
  },
  {
    id: 'needle',
    name: '合成检索',
    en: 'Synthetic / Needle-in-a-Haystack',
    text: '输入是 JSON 序列化的 k 个随机 UUID 键值对，给定某个键，要求模型精确返回对应的值。用于隔离测试模型从上下文中"检索/匹配" token 的基本能力。',
    color: '#ffd166',
  },
];

export function LitmTasks({ chapterId, moduleId }: { chapterId: string; moduleId: string }) {
  const [sel, setSel] = useState('mdqa');
  const cur = TASKS.find((t) => t.id === sel)!;
  return (
    <div className="litm-widget">
      <div className="litm-chips">
        {TASKS.map((t) => (
          <button
            key={t.id}
            className={`litm-chip ${sel === t.id ? 'on' : ''}`}
            style={{ borderColor: t.color, color: sel === t.id ? '#0f1830' : t.color, background: sel === t.id ? t.color : 'transparent' }}
            onClick={() => setSel(t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="litm-card" style={{ borderColor: cur.color }}>
        <h5 style={{ color: cur.color }}>{cur.en}</h5>
        <p>{cur.text}</p>
      </div>
      <p className="litm-hint">
        论文用这两类任务系统"扫描"关键信息在上下文不同位置时模型的表现——位置效应在两种任务上都成立。
      </p>
    </div>
  );
}
