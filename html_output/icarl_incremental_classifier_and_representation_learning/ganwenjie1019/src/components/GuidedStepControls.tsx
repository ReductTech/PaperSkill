export type GuidedStep = { title: string; short: string };

export function GuidedStepControls({
  steps,
  current,
  onChange,
  label,
  showStepButtons = true,
}: {
  steps: readonly GuidedStep[];
  current: number;
  onChange: (step: number) => void;
  label: string;
  showStepButtons?: boolean;
}) {
  const progress = ((current + 1) / steps.length) * 100;

  return (
    <section className="icarl-guided" aria-label={label}>
      <div className="icarl-guided__topline">
        <div>
          <span className="eyebrow">GUIDED WALKTHROUGH</span>
          <h2>{steps[current].title}</h2>
        </div>
        <span className="icarl-guided__count">{String(current + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</span>
      </div>
      <div className="icarl-guided__track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <nav className="icarl-guided__steps" aria-label={`${label}步骤`}>
        {steps.map((step, index) => (
          <button
            key={step.short}
            type="button"
            className={`icarl-guided__step${index === current ? " is-active" : index < current ? " is-complete" : ""}`}
            aria-current={index === current ? "step" : undefined}
            aria-label={`第 ${index + 1} 步：${step.title}`}
            onClick={() => onChange(index)}
          >
            <span className="icarl-guided__number">{String(index + 1).padStart(2, "0")}</span>
            <span className="icarl-guided__short">{step.short}</span>
          </button>
        ))}
      </nav>
      {showStepButtons ? <div className="icarl-guided__controls">
        <span>逐步查看 · 可直接选择任一阶段</span>
        <div>
          <button type="button" className="icarl-button icarl-button--quiet" onClick={() => onChange(Math.max(0, current - 1))} disabled={current === 0}>上一步</button>
          <button type="button" className="icarl-button icarl-button--primary" onClick={() => onChange(Math.min(steps.length - 1, current + 1))} disabled={current === steps.length - 1}>下一步</button>
        </div>
      </div> : null}
    </section>
  );
}
