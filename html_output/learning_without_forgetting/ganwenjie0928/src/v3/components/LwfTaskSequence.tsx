import { useState } from "react";
import { taskSequence } from "../data/sequential";

export function LwfTaskSequence({ selectedStateId, onSelectState }: { selectedStateId?: string; onSelectState?: (stateId: string) => void }) {
  const [localSelectedId, setLocalSelectedId] = useState(taskSequence.initialState);
  const selectedId = selectedStateId ?? localSelectedId;
  const selectedState = taskSequence.states.find((state) => state.id === selectedId)!;
  const nextTransition = taskSequence.transitions.find((transition) => transition.from === selectedId);
  const nextState = nextTransition && taskSequence.states.find((state) => state.id === nextTransition.to);

  return <div className="v3-task-sequence" aria-label="LwF task-level sequence">
    <p className="v3-task-sequence-hint">按顺序查看八个任务阶段；选择任意阶段可阅读它的作用和下一步。</p>
    <ol className="v3-task-sequence-list" aria-label="任务阶段顺序">
      {taskSequence.states.map((state, index) => <li key={state.id}>
        <button type="button" data-state-id={state.id} aria-pressed={state.id === selectedId} onClick={() => { if (!selectedStateId) setLocalSelectedId(state.id); onSelectState?.(state.id); }}>
          <span className="v3-task-sequence-number">{String(index + 1).padStart(2, "0")}</span>
          <span className="v3-task-sequence-label"><strong>{state.label}</strong><small>{state.owner}</small></span>
        </button>
      </li>)}
    </ol>
    <aside className="v3-task-sequence-inspector" aria-live="polite">
      <div>
        <span className="v3-task-sequence-current-label">正在查看</span>
        <h4>{selectedState.label}</h4>
        <p>{selectedState.description}</p>
        {selectedState.effect ? <p><strong>作用：</strong>{selectedState.effect}</p> : null}
      </div>
      {nextState && nextTransition ? <div className="v3-task-sequence-next"><span>下一步</span><strong>{nextState.label}</strong><p>{nextTransition.explanation}</p></div> : null}
    </aside>
    <div className="v3-task-sequence-loopback" aria-label="进入下一任务阶段">
      <span>NEXT TASK STAGE</span>
      <strong>Modelₜ₊₁ → Freeze as Teacherₜ₊₁</strong>
      <small>当 Task t+2 到来时，当前模型成为新阶段的固定 Teacher，并在新输入上重算旧任务响应。</small>
    </div>
    <p className="v3-task-sequence-footnote">概念性任务生命周期。“Adapt Student”包含第 03 章展示的 minibatch 训练步骤；这里没有额外增加一层训练循环。</p>
  </div>;
}
