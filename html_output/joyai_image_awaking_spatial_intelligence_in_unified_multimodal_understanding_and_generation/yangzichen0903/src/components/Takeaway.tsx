import React from 'react';
import type { Takeaway as TakeawayDef } from '../types';

const variants: Record<string, { className: string; label: string }> = {
  'chap-1': { className: 'takeaway-assembly', label: '架构拼合 · ARCHITECTURE LOCKED' },
  'chap-2': { className: 'takeaway-spatial', label: '空间检查点 · SPATIAL CHECKPOINTS' },
  'chap-3': { className: 'takeaway-generation', label: '生成路径 · GENERATION RECIPE' },
  'chap-4': { className: 'takeaway-editing', label: '编辑规则 · EDITING RULES' },
  'chap-5': { className: 'takeaway-evidence-file', label: '证据归档 · EVIDENCE FILES' },
  'chap-6': { className: 'takeaway-finale', label: '最终结论 · WHAT TO TAKE AWAY' }
};

export function Takeaway({ items, chapterId }: { items: TakeawayDef[]; chapterId: string }) {
  const variant = variants[chapterId] ?? variants['chap-1'];
  return (
    <div className={`takeaway-wrap ${variant.className}`}>
      <div className="takeaway-label">{variant.label}</div>
      <div className="embed-takeaway">
        {items.map((it, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <div className="et-arrow" aria-hidden="true">→</div> : null}
            <div className="et-item">
              <div className="et-index">{String(i + 1).padStart(2, '0')}</div>
              <div className="et-icon">{it.icon}</div>
              <div className="et-copy">
                <div className="et-title">{it.title}</div>
                <div className="et-desc">{it.desc}</div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
