import { useState } from 'react';
import '../styles/attribution-path-lab.css';

type SeedKey = 'hidden' | 'private' | 'confidential';

type FeatureNode = {
  id: string;
  label: string;
  identity: string;
  semantic: 'negation' | 'concealment' | 'secrecy';
};

type FeatureBranch = {
  early: FeatureNode;
  late: FeatureNode[];
};

type SeedFlow = {
  label: string;
  branches: FeatureBranch[];
};

const SEED_FLOWS: Record<SeedKey, SeedFlow> = {
  hidden: {
    label: 'hidden',
    branches: [
      {
        early: {
          id: 'hidden-revealed',
          label: 'Hidden or revealed',
          identity: 'L6 / Feature #78043',
          semantic: 'concealment',
        },
        late: [
          {
            id: 'obscuring-information',
            label: 'Obscuring information',
            identity: 'L23 / Feature #119106',
            semantic: 'concealment',
          },
          {
            id: 'hide-hidden',
            label: 'Hide / hidden',
            identity: 'L26 / Feature #9414',
            semantic: 'concealment',
          },
        ],
      },
      {
        early: {
          id: 'negation-l6',
          label: 'Negation',
          identity: 'L6 / Feature #53713',
          semantic: 'negation',
        },
        late: [
          {
            id: 'negation-inability',
            label: 'Negation and inability',
            identity: 'L23 / Feature #158577',
            semantic: 'negation',
          },
          {
            id: 'negation-l24',
            label: 'Negation',
            identity: 'L24 / Feature #139896',
            semantic: 'negation',
          },
        ],
      },
    ],
  },
  private: {
    label: 'private',
    branches: [
      {
        early: {
          id: 'private-l3',
          label: 'Private',
          identity: 'L3 / Feature #62250',
          semantic: 'secrecy',
        },
        late: [
          {
            id: 'privacy-l6',
            label: 'Privacy',
            identity: 'L6 / Feature #27093',
            semantic: 'secrecy',
          },
          {
            id: 'password-management',
            label: 'Password / secret management',
            identity: 'L9 / Feature #50902',
            semantic: 'secrecy',
          },
        ],
      },
      {
        early: {
          id: 'private-l4',
          label: 'Private',
          identity: 'L4 / Feature #8759',
          semantic: 'secrecy',
        },
        late: [
          {
            id: 'security-privacy',
            label: 'Security and privacy',
            identity: 'L29 / Feature #112276',
            semantic: 'secrecy',
          },
          {
            id: 'data-privacy',
            label: 'Data privacy',
            identity: 'L29 / Feature #131614',
            semantic: 'secrecy',
          },
        ],
      },
    ],
  },
  confidential: {
    label: 'confidential',
    branches: [
      {
        early: {
          id: 'secrets-confidentiality',
          label: 'Secrets / confidentiality',
          identity: 'L8 / Feature #95840',
          semantic: 'secrecy',
        },
        late: [
          {
            id: 'secrets-privacy',
            label: 'Secrets and privacy',
            identity: 'L24 / Feature #7134',
            semantic: 'secrecy',
          },
          {
            id: 'data-privacy-secrets',
            label: 'Data privacy / secrets',
            identity: 'L31 / Feature #33231',
            semantic: 'secrecy',
          },
        ],
      },
      {
        early: {
          id: 'confidentiality-privacy',
          label: 'Confidentiality / privacy',
          identity: 'L9 / Feature #2955',
          semantic: 'secrecy',
        },
        late: [
          {
            id: 'confidentiality-secrecy',
            label: 'Confidentiality and secrecy',
            identity: 'L28 / Feature #102546',
            semantic: 'secrecy',
          },
          {
            id: 'sensitive-information',
            label: 'Sensitive information',
            identity: 'L31 / Feature #106342',
            semantic: 'secrecy',
          },
        ],
      },
    ],
  },
};

const INITIAL_FEEDBACK = '选择一个 seed token，观察它可以展开出哪些候选分支。';

function FeatureButton({
  node,
  selected,
  multi = false,
  onClick,
}: {
  node: FeatureNode;
  selected: boolean;
  multi?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`apl-feature-option${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span>{node.identity}</span>
      <strong>{node.label}</strong>
      <small>
        <i>{node.semantic}</i>
        {multi ? (selected ? '已记录，点击可撤销' : '点击加入候选') : '选择这条分支'}
      </small>
    </button>
  );
}

function FlowArrow({ active }: { active: boolean }) {
  return (
    <div className={`apl-flow-arrow${active ? ' is-active' : ''}`} aria-hidden="true">
      <span />
    </div>
  );
}

export function AttributionPathLab() {
  const [selectedSeed, setSelectedSeed] = useState<SeedKey | null>(null);
  const [selectedEarlyId, setSelectedEarlyId] = useState<string | null>(null);
  const [selectedLateIds, setSelectedLateIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState(INITIAL_FEEDBACK);

  const flow = selectedSeed ? SEED_FLOWS[selectedSeed] : null;
  const selectedBranch = flow?.branches.find((branch) => branch.early.id === selectedEarlyId) ?? null;
  const selectedLateNodes = selectedBranch?.late.filter((node) => selectedLateIds.includes(node.id)) ?? [];
  const complete = selectedLateNodes.length > 0;

  const selectSeed = (seed: SeedKey) => {
    setSelectedSeed(seed);
    setSelectedEarlyId(null);
    setSelectedLateIds([]);
    setFeedback(`seed 已切换为 “${SEED_FLOWS[seed].label}”：较早层的可选分支已经更新。`);
  };

  const selectEarly = (branch: FeatureBranch) => {
    setSelectedEarlyId(branch.early.id);
    setSelectedLateIds([]);
    setFeedback(`已选择 “${branch.early.label}”：后续节点随这条分支重新展开，可以记录其中一个或多个候选。`);
  };

  const toggleLate = (node: FeatureNode) => {
    const wasSelected = selectedLateIds.includes(node.id);
    const next = wasSelected
      ? selectedLateIds.filter((id) => id !== node.id)
      : [...selectedLateIds, node.id];
    setSelectedLateIds(next);
    setFeedback(
      wasSelected
        ? `已撤销 “${node.label}”；候选集合和通向输出的路径同步减少。`
        : `已记录 “${node.label}”；候选集合和通向输出的路径同步增加。`
    );
  };

  const reset = () => {
    setSelectedSeed(null);
    setSelectedEarlyId(null);
    setSelectedLateIds([]);
    setFeedback(INITIAL_FEEDBACK);
  };

  const selectedCandidates = [
    ...(selectedBranch ? [selectedBranch.early] : []),
    ...selectedLateNodes,
  ];

  const nodeState = selectedBranch
    ? `当前：${selectedCandidates.length} 个 Feature Node 已进入路径。`
    : flow
      ? `当前：“${flow.label}” 已成为起点，等待选择 Feature Node。`
      : '当前：尚未选择起点。';

  const edgeState = complete && selectedBranch
    ? `当前：${1 + selectedLateNodes.length * 2} 条 Edge 连接 seed、Feature 和输出。`
    : selectedBranch && selectedSeed
      ? `当前：${selectedSeed} → ${selectedBranch.early.label}。`
      : '当前：等待相邻节点形成 Edge。';

  const pathState = complete && selectedSeed && selectedBranch
    ? `当前：${selectedLateNodes.length} 条 Path 已连接到模型输出。`
    : '当前：尚未形成完整 Path。';

  return (
    <div className={`attribution-path-lab${complete ? ' is-complete' : ''}`}>
      <div className="apl-taskbar">
        <div className="apl-task-copy">
          <span>人工路径追踪</span>
          <strong>改变追踪起点和分支，观察候选集合如何随路径变化</strong>
        </div>
        <div className="apl-task-actions">
          <div className="apl-seed-switcher" role="group" aria-label="选择归因图的 seed token">
            <span>1 · 选择 seed token</span>
            {(Object.keys(SEED_FLOWS) as SeedKey[]).map((seed) => (
              <button
                key={seed}
                type="button"
                className={selectedSeed === seed ? 'is-selected' : ''}
                aria-pressed={selectedSeed === seed}
                onClick={() => selectSeed(seed)}
              >
                {SEED_FLOWS[seed].label}
              </button>
            ))}
          </div>
          <button className="apl-reset" type="button" onClick={reset} title="重新追踪" aria-label="重新追踪">
            ↺
          </button>
        </div>
      </div>

      <div className="apl-workbench" aria-label="可切换分支的归因路径教学示意">
        <section className="apl-stage apl-source-stage">
          <header>
            <span>追踪起点</span>
            <small>研究者按任务语义选择</small>
          </header>
          <div className={selectedSeed ? 'is-ready' : ''}>
            <span>seed token</span>
            <strong>{selectedSeed ?? '尚未选择'}</strong>
          </div>
        </section>

        <FlowArrow active={Boolean(selectedSeed)} />

        <section className={`apl-stage apl-feature-stage${flow ? '' : ' is-placeholder'}`}>
          <header>
            <span>2 · 选择早层分支</span>
            <small>{flow ? '两条都符合论文的人工语义标准' : '等待选择 seed token'}</small>
          </header>
          {flow ? (
            <div className="apl-options">
              {flow.branches.map((branch) => (
                <FeatureButton
                  key={branch.early.id}
                  node={branch.early}
                  selected={selectedEarlyId === branch.early.id}
                  onClick={() => selectEarly(branch)}
                />
              ))}
            </div>
          ) : (
            <p>切换 seed 后，这里的候选分支会发生变化。</p>
          )}
        </section>

        <FlowArrow active={Boolean(selectedBranch)} />

        <section className={`apl-stage apl-feature-stage${selectedBranch ? '' : ' is-placeholder'}`}>
          <header>
            <span>3 · 记录后续 Feature</span>
            <small>{selectedBranch ? '支持多选，也可以撤销' : '等待选择早层分支'}</small>
          </header>
          {selectedBranch ? (
            <div className="apl-options">
              {selectedBranch.late.map((node) => (
                <FeatureButton
                  key={node.id}
                  node={node}
                  selected={selectedLateIds.includes(node.id)}
                  multi
                  onClick={() => toggleLate(node)}
                />
              ))}
            </div>
          ) : (
            <p>选择不同早层 Feature，会展开不同的后续节点。</p>
          )}
        </section>

        <FlowArrow active={complete} />

        <section className={`apl-stage apl-output-stage${complete ? ' is-reached' : ''}`}>
          <header>
            <span>4 · 形成候选路径</span>
            <small>{complete ? '候选仍需 Steering' : '等待记录后续 Feature'}</small>
          </header>
          <div>
            <span>通向模型输出</span>
            <strong>{complete ? `${selectedLateNodes.length} 条候选路径` : '尚未形成路径'}</strong>
          </div>
        </section>
      </div>

      <section className="apl-graph-language" aria-label="归因图的三个组成部分">
        <header>
          <span>归因图的三个组成部分</span>
          <strong>Node 是点，Edge 是有方向的连接，Path 是从起点到输出的一整条路线。</strong>
        </header>
        <div className="apl-graph-terms">
          <article className={selectedBranch ? 'is-active' : ''}>
            <div>
              <b>Node</b>
              <span>节点</span>
            </div>
            <p>每个 Feature 方框都是一个节点，代表模型内部识别到的一种信息模式。</p>
            <small>{nodeState}</small>
          </article>
          <article className={selectedBranch ? 'is-active' : ''}>
            <div>
              <b>Edge</b>
              <span>有向边</span>
            </div>
            <p>两个节点间的箭头是一条边，方向表示归因贡献如何向后传递。</p>
            <small>{edgeState}</small>
          </article>
          <article className={complete ? 'is-active is-complete' : ''}>
            <div>
              <b>Path</b>
              <span>路径</span>
            </div>
            <p>一串首尾相连的节点和边组成路径，用来追踪可能影响输出的 Feature。</p>
            <small>{pathState}</small>
          </article>
        </div>
      </section>

      <div className="apl-readout" aria-live="polite">
        <section>
          <span>人工记录的候选 Feature</span>
          <div className="apl-candidates">
            {selectedCandidates.length > 0 ? (
              selectedCandidates.map((candidate) => (
                <b key={candidate.id}>{candidate.identity} · {candidate.label}</b>
              ))
            ) : (
              <em>候选集合为空</em>
            )}
          </div>
        </section>
        <section>
          <span>候选路径 · 教学示意连边</span>
          <div className="apl-paths">
            {selectedSeed && selectedBranch && selectedLateNodes.length > 0 ? (
              selectedLateNodes.map((node) => (
                <b key={node.id}>{selectedSeed} → {selectedBranch.early.label} → {node.label} → 输出</b>
              ))
            ) : (
              <em>选择分支并记录至少一个后续 Feature</em>
            )}
          </div>
        </section>
        <section className={complete ? 'is-success' : ''}>
          <span>{complete ? '当前判断' : '操作反馈'}</span>
          <strong>{feedback}</strong>
          {complete ? <small>归因图只提出候选，仍需 Steering 验证。</small> : null}
        </section>
      </div>

      <p className="apl-boundary">
        流程教学示意：Feature 名称、层号和编号取自论文附录；论文没有公布这些单 Prompt 的完整实测连边，因此分支连接只用于解释人工追踪如何产生不同候选集合。
      </p>
    </div>
  );
}
