import React, { useEffect, useState } from 'react';

type StageId = 'backbone' | 'W' | 'phi' | 'ledger' | 'weights';

interface Stage {
  id: StageId;
  number: number;
  label: string;
  owner: string;
  detail: string;
  feedback: string;
  tone: 'frozen' | 'computed' | 'ledger';
}

const stages: Stage[] = [
  {
    id: 'backbone',
    number: 1,
    label: '预训练主干',
    owner: '冻结',
    detail: 'ViT 主干提供通用原始特征 f。',
    feedback: '预训练主干在 RanPAC 流程中冻结，提供通用 f。',
    tone: 'frozen',
  },
  {
    id: 'W',
    number: 2,
    label: '固定 W',
    owner: '一次采样',
    detail: 'L×M 随机板在开始时形成，随后保持不变。',
    feedback: '随机投影矩阵一次采样后固定；它不随新任务更新。',
    tone: 'frozen',
  },
  {
    id: 'phi',
    number: 3,
    label: '非线性 φ',
    owner: '无训练参数',
    detail: '逐元素作用后得到 h=φ(fᵀW)。',
    feedback: '非线性逐元素作用，没有自己的可训练参数。',
    tone: 'frozen',
  },
  {
    id: 'ledger',
    number: 4,
    label: 'G,C 账本',
    owner: '逐任务累计',
    detail: 'G=Σhhᵀ，C=Σhyᵀ；它们才是 Phase 2 状态。',
    feedback: 'G 和 C 随任务累计，是 Phase 2 的状态。',
    tone: 'ledger',
  },
  {
    id: 'weights',
    number: 5,
    label: '输出权重',
    owner: '闭式计算',
    detail: 'W_o=(G+λI)⁻¹C，没有 SGD 更新。',
    feedback: 'W_o 由累计统计和岭参数闭式计算，不经过 SGD。',
    tone: 'computed',
  },
];

const nodeX = [72, 290, 508, 726, 944];
const nodeY = 112;

export function RpCh8Architecture() {
  const [stageId, setStageId] = useState<StageId>('W');
  const index = stages.findIndex((stage) => stage.id === stageId);
  const stage = stages[index];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const next = Number(event.key);
      if (next >= 1 && next <= stages.length) {
        event.preventDefault();
        setStageId(stages[next - 1].id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="rp-widget rp-architecture-widget">
      <div className="rp-arch-layout">
        <section className="rp-panel rp-arch-canvas-panel" aria-label="RanPAC 参数所有权拓扑">
          <div className="rp-panel-heading">
            <span>两阶段参数所有权</span>
            <strong>数字键 1-5 可切换</strong>
          </div>
          <svg
            className="rp-arch-svg"
            viewBox="0 0 1080 280"
            role="img"
            aria-label="从冻结主干到闭式输出权重的五段数据通路"
          >
            <defs>
              <marker id="rp-arch-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 Z" fill="#68778f" />
              </marker>
              <marker id="rp-arch-arrow-active" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 Z" fill="#f07e47" />
              </marker>
            </defs>

            <rect x="18" y="22" width="1044" height="188" rx="16" className="rp-arch-field" />
            {nodeX.slice(0, -1).map((x, edgeIndex) => {
              const active = edgeIndex === index - 1 || edgeIndex === index;
              return (
                <line
                  key={edgeIndex}
                  x1={x + 60}
                  y1={nodeY}
                  x2={nodeX[edgeIndex + 1] - 60}
                  y2={nodeY}
                  className={`rp-arch-edge ${active ? 'is-active' : ''}`}
                  markerEnd={active ? 'url(#rp-arch-arrow-active)' : 'url(#rp-arch-arrow)'}
                />
              );
            })}

            {stages.map((item, itemIndex) => {
              const selected = item.id === stageId;
              const x = nodeX[itemIndex];
              return (
                <g
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${item.number}. ${item.label}，${item.owner}`}
                  className={`rp-arch-node is-${item.tone} ${selected ? 'is-selected' : ''}`}
                  onClick={() => setStageId(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setStageId(item.id);
                    }
                  }}
                >
                  <rect x={x - 62} y={nodeY - 46} width="124" height="92" rx="14" />
                  <circle cx={x - 48} cy={nodeY - 31} r="13" className="rp-arch-number" />
                  <text x={x - 48} y={nodeY - 28} textAnchor="middle" className="rp-arch-number-text">
                    {item.number}
                  </text>
                  <text x={x} y={nodeY - 2} textAnchor="middle" className="rp-arch-node-label">
                    {item.label}
                  </text>
                  <text x={x} y={nodeY + 25} textAnchor="middle" className="rp-arch-node-owner">
                    {item.owner}
                  </text>
                  {item.tone !== 'computed' && (
                    <g className="rp-arch-lock" transform={`translate(${x + 42} ${nodeY - 37})`}>
                      <rect x="-8" y="0" width="16" height="13" rx="3" />
                      <path d="M-5,0 V-5 A5,5 0 0 1 5,-5 V0" />
                    </g>
                  )}
                </g>
              );
            })}

            <path d="M72,205 V238 H290" className="rp-arch-petl-branch" />
            <rect x="118" y="222" width="152" height="32" rx="8" className="rp-arch-petl-label" />
            <text x="194" y="243" textAnchor="middle" className="rp-arch-petl-text">
              可选首任务 PETL
            </text>
            <path d="M290,238 H382" className="rp-arch-discard" />
            <text x="390" y="243" className="rp-arch-note-text">临时头丢弃</text>

            <path d="M944,165 V203 H726" className="rp-arch-ridge-link" />
            <rect x="805" y="187" width="132" height="32" rx="8" className="rp-arch-ridge-label" />
            <text x="871" y="208" textAnchor="middle" className="rp-arch-ridge-text">
              岭求解 (G+λI)⁻¹
            </text>
          </svg>

        </section>

        <aside className={`rp-panel rp-arch-inspector is-${stage.tone}`} aria-live="polite">
          <div className="rp-inspector-kicker">{`部件 ${stage.number} / 5`}</div>
          <h3>{stage.label}</h3>
          <div className="rp-owner-pill">{stage.owner}</div>
          <p>{stage.detail}</p>
          <div className="rp-state-list">
            <span><b>主干与 W</b> Phase 2 冻结</span>
            <span><b>G、C</b> 随任务累计</span>
            <span><b>Wₒ</b> 闭式计算，无 SGD</span>
          </div>
        </aside>
      </div>

      <div className="rp-arch-legend" aria-label="参数状态图例">
        <span className="is-frozen">蓝色锁：冻结</span>
        <span className="is-ledger">绿色账本：累计</span>
        <span className="is-optional">红色虚线：可选首任务</span>
        <span className="is-auxiliary">紫色：岭求解辅助</span>
      </div>
      <div className="rp-feedback rp-feedback-wide">
        <strong>{stage.label}</strong>
        <span>{stage.feedback}</span>
      </div>
    </div>
  );
}
