import React from 'react';
import type { ProseBlock } from '../types';

// 章节正文段落：真正的教学文本（对照论文人工核验后写入）。
export function Prose({ blocks }: { blocks: ProseBlock[] }) {
  if (!blocks?.length) return null;
  return (
    <div className="chap-prose">
      {blocks.map((b, i) => (
        <div className="prose-block" key={i}>
          <h4 className="prose-heading">
            <span className="prose-index">{String(i + 1).padStart(2, '0')}</span>
            {b.heading}
          </h4>
          <p className="prose-body" dangerouslySetInnerHTML={{ __html: b.body }} />
        </div>
      ))}
    </div>
  );
}
