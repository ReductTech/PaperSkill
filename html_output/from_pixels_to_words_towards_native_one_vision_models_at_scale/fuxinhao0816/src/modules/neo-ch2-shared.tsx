import React from 'react';

export type PipelineNode = 'image' | 'encoder' | 'projector' | 'llm' | 'answer';
export type EvidenceFocus = 'none' | 'where' | 'color' | 'nearby';

export function StreetThumbnail({ detailed = false, focus = 'none' }: { detailed?: boolean; focus?: EvidenceFocus }) {
  const showCar = detailed || focus !== 'none';
  const showWhere = focus === 'where';
  const showNearby = focus === 'nearby';

  return (
    <svg className={`ch2-street-thumb is-focus-${focus} ${detailed ? 'is-detailed' : ''}`} viewBox="0 0 180 112" role="img" aria-label="红色汽车停在道路右侧、靠近路口与建筑的街景示意">
      <rect width="180" height="112" rx="10" fill="#e7f0f7" />
      <g className={showNearby ? 'is-evidence' : ''}>
        <rect x="9" y="16" width="42" height="39" rx="4" fill="#d8c9b5" stroke="#8d7b66" strokeWidth="2" />
        <rect x="17" y="26" width="9" height="12" fill="#fbf3dc" />
        <rect x="34" y="26" width="9" height="12" fill="#fbf3dc" />
      </g>
      <rect x="134" y="20" width="37" height="35" rx="4" fill="#c9d4df" stroke="#768da2" strokeWidth="2" />
      <rect y="58" width="180" height="45" fill="#657180" />
      <rect x="68" y="39" width="42" height="73" fill="#657180" />
      <line x1="0" y1="81" x2="60" y2="81" stroke="#f4df7b" strokeWidth="2" strokeDasharray="9 7" />
      <line x1="118" y1="81" x2="180" y2="81" stroke="#f4df7b" strokeWidth="2" strokeDasharray="9 7" />
      <rect x="70" y="60" width="38" height="41" rx="4" fill="none" stroke="#d7deea" strokeWidth="2" strokeDasharray="5 4" />
      <g className={showCar ? 'is-evidence' : ''}>
        <path d="M119 77 L126 68 H146 L154 77 Z" fill="#c43f52" stroke="#762638" strokeWidth="1.5" />
        <rect x="114" y="76" width="47" height="18" rx="6" fill="#cf3d52" stroke="#762638" strokeWidth="1.5" />
        <circle cx="125" cy="94" r="5" fill="#273545" />
        <circle cx="150" cy="94" r="5" fill="#273545" />
      </g>
      {showCar ? <circle cx="138" cy="82" r="26" fill="none" stroke={focus === 'color' ? '#dc2626' : '#d97706'} strokeWidth="2.5" /> : null}
      {showWhere ? (
        <g className="ch2-spatial-evidence">
          <path d="M119 68 C109 57 102 59 96 68" fill="none" stroke="#27446e" strokeWidth="2" strokeDasharray="4 3" />
          <path d="M138 105 L102 105" stroke="#27446e" strokeWidth="2" markerEnd="url(#ch2-arrow)" />
          <defs><marker id="ch2-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#27446e" /></marker></defs>
        </g>
      ) : null}
      {showNearby ? <path d="M112 73 C86 45 57 36 48 36" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeDasharray="5 3" /> : null}
    </svg>
  );
}

export function FeatureGrid({ compressed = false }: { compressed?: boolean }) {
  return <span className={`ch2-feature-grid ${compressed ? 'is-compressed' : ''}`} aria-hidden="true">{Array.from({ length: compressed ? 6 : 12 }, (_, index) => <i key={index} />)}</span>;
}

export function AlignedTokens() {
  return <span className="ch21-aligned-tokens" aria-hidden="true"><i /><i /><i /><i /><i /></span>;
}

export function ProjectorMark() {
  return <span className="ch21-projector-mark" aria-hidden="true"><FeatureGrid compressed /><b>→</b><AlignedTokens /></span>;
}

const nodeDefs: Array<{ id: PipelineNode; title: string; subtitle: string }> = [
  { id: 'image', title: '图片', subtitle: '视觉输入' },
  { id: 'encoder', title: 'Vision Encoder', subtitle: '提取视觉表示' },
  { id: 'projector', title: 'Projector / Adapter', subtitle: '映射到可接收形式' },
  { id: 'llm', title: 'LLM', subtitle: '理解 · 推理 · 生成' },
  { id: 'answer', title: '回答', subtitle: '语言输出' },
];

function NodeVisual({ node }: { node: PipelineNode }) {
  if (node === 'image') return <StreetThumbnail />;
  if (node === 'encoder') return <FeatureGrid />;
  if (node === 'projector') return <ProjectorMark />;
  if (node === 'answer') return <span className="ch2-answer-icon" aria-hidden="true">•••</span>;
  return null;
}

export function ModularPipeline({ question, active, onSelect }: { question: string; active?: PipelineNode; onSelect?: (node: PipelineNode) => void }) {
  return (
    <div className="ch21-pipeline" aria-label="图片沿视觉支路经过 Vision Encoder 与 Projector 进入 LLM，用户问题从另一支路进入 LLM，随后生成回答">
      <div className="ch21-pipeline-main">
        {nodeDefs.map((node) => {
          const content = <><NodeVisual node={node.id} /><strong>{node.title}</strong><small>{node.subtitle}</small></>;
          return (
            <div className={`ch21-pipeline-node is-${node.id} ${active === node.id ? 'is-active' : ''}`} key={node.id}>
              {onSelect ? <button type="button" aria-pressed={active === node.id} onClick={() => onSelect(node.id)}>{content}</button> : <div className="ch21-pipeline-node-static">{content}</div>}
              {node.id === 'llm' ? (
                <div className="ch21-question-branch">
                  <i aria-hidden="true">↑</i><span>用户问题支路</span><b>{question}</b><small>不经过 Vision Encoder / Projector</small>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
