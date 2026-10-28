import './experiment-step-navigation.css';

interface ExperimentStepNavigationProps {
  steps: readonly string[];
  current: number;
  onChange: (step: number) => void;
  label: string;
}

/** Stable controls stay mounted while the current experiment stage changes. */
export function ExperimentStepNavigation({ steps, current, onChange, label }: ExperimentStepNavigationProps) {
  const last = current === steps.length - 1;
  return <nav className="experiment-step-nav" aria-label={label}>
    <div className="esn-position">
      <button type="button" className="esn-previous" disabled={current === 0} onClick={() => onChange(current - 1)}>← 上一步</button>
      <span className="esn-count" aria-label={'第 ' + (current + 1) + ' 步，共 ' + steps.length + ' 步'}><b>{current + 1}</b> / {steps.length}</span>
    </div>
    <button type="button" className={'esn-next' + (last ? ' is-return' : '')} onClick={() => onChange(last ? 0 : current + 1)}>
      <span>{last ? '回到输入' : '下一步 · ' + steps[current + 1]}</span><span aria-hidden="true">{last ? '↶' : '→'}</span>
    </button>
  </nav>;
}
