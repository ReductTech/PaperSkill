import React, { useState } from 'react';

// 可折叠块：默认只显示一行概括，点击展开详细内容。

export function Collapsible({ summary, children }: { summary: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`collapsible ${open ? 'open' : ''}`}>
      <button type="button" className="collapsible-head" onClick={() => setOpen(!open)}>
        <span className="collapsible-arrow">{open ? '▾' : '▸'}</span>
        <span className="collapsible-summary">{summary}</span>
      </button>
      {open ? <div className="collapsible-body">{children}</div> : null}
    </div>
  );
}
