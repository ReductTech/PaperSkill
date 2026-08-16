import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type MemoryItem = { id: string; title: string; layer: 'L2' | 'L3'; steps: string[] };
type Category = { id: string; label: string; icon: string; items: MemoryItem[] };

const CATEGORIES: Category[] = [
  { id: 'research', label: 'Research', icon: '⌕', items: [
    { id: 'paper', title: 'Paper Search SOP', layer: 'L3', steps: ['Search broadly', 'Filter candidates', 'Verify primary sources', 'Extract evidence', 'Summarize with citations'] },
    { id: 'review', title: 'Literature Review', layer: 'L3', steps: ['Define scope', 'Cluster themes', 'Compare methods', 'Record gaps'] },
  ] },
  { id: 'coding', label: 'Coding', icon: '</>', items: [
    { id: 'debug', title: 'Debugging SOP', layer: 'L3', steps: ['Reproduce', 'Localize', 'Patch minimally', 'Run focused tests'] },
    { id: 'repo', title: 'Repository Facts', layer: 'L2', steps: ['Build command', 'Test command', 'Project conventions'] },
  ] },
  { id: 'browsing', label: 'Browsing', icon: '◎', items: [
    { id: 'source', title: 'Source Verification', layer: 'L3', steps: ['Prefer primary source', 'Check date', 'Cross-check claim', 'Capture provenance'] },
  ] },
  { id: 'data', label: 'Data Analysis', icon: '▥', items: [
    { id: 'clean', title: 'Dataset Cleaning', layer: 'L3', steps: ['Profile columns', 'Mark missingness', 'Normalize types', 'Validate output'] },
  ] },
];

export const ModIndex: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [categoryId, setCategoryId] = useState('research');
  const category = CATEGORIES.find((item) => item.id === categoryId)!;
  const [itemId, setItemId] = useState('paper');
  const selected = category.items.find((item) => item.id === itemId) ?? category.items[0];
  const [retrieved, setRetrieved] = useState<string | null>(null);

  const pickCategory = (id: string) => {
    const next = CATEGORIES.find((item) => item.id === id)!;
    setCategoryId(id);
    setItemId(next.items[0].id);
    setRetrieved(null);
  };

  return (
    <div className="memory-explorer">
      <div className="memory-layers" aria-label="论文记忆层级">
        <span><b>L1</b> 索引常驻</span><span><b>L2</b> 验证事实</span><span><b>L3</b> SOP</span><span><b>L4</b> 会话存档</span>
      </div>
      <div className="memory-demo-note">交互目录是说明性示例；L1–L4 的进入规则来自论文，Research / Coding 等不是论文规定的固定分类。</div>
      <div className="memory-workspace">
        <nav className="memory-categories" aria-label="记忆分类">
          <div className="memory-pane-title">Memory</div>
          {CATEGORIES.map((item) => (
            <button key={item.id} className={categoryId === item.id ? 'active' : ''} onClick={() => pickCategory(item.id)}>
              <i>{item.icon}</i><span>{item.label}</span><b>›</b>
            </button>
          ))}
        </nav>
        <div className="memory-items">
          <div className="memory-pane-title">{category.label}</div>
          {category.items.map((item) => (
            <button key={item.id} className={selected.id === item.id ? 'active' : ''} onClick={() => { setItemId(item.id); setRetrieved(null); }}>
              <span>{item.title}</span><small>{item.layer} · 按需</small>
            </button>
          ))}
        </div>
        <section className="memory-preview">
          <div className="memory-preview-head"><span>{selected.title}</span><b>{selected.layer}</b></div>
          <ol>{selected.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <div className="memory-off-context">默认状态：存储中，但未进入 Current Context</div>
          <button className="retrieve-button" onClick={() => setRetrieved(selected.id)} disabled={retrieved === selected.id}>
            {retrieved === selected.id ? 'Retrieved ✓' : 'Retrieve → Context'}
          </button>
        </section>
      </div>
      <div className={`current-context ${retrieved === selected.id ? 'has-memory' : ''}`} aria-live="polite">
        <div><b>Current Context</b><small>目标 · 约束 · 当前状态</small></div>
        <span className="context-entry">{retrieved === selected.id ? `${selected.title} 已按需注入` : '深层记忆尚未加载'}</span>
      </div>
      <div className={`feedback ${retrieved === selected.id ? 'good' : ''}`}>
        {retrieved === selected.id
          ? '检索完成：只有当前任务选中的知识进入活动上下文，其余目录仍留在外部存储。'
          : '浏览 Memory 不等于把内容全部塞进提示词。点击 Retrieve，观察一条 L2/L3 记忆如何按需进入 Current Context。'}
      </div>
    </div>
  );
};
