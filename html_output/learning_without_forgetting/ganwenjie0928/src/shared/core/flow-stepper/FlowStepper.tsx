import { useState } from "react";
import { useStickyStepSync } from "../../foundation/layout/StickySystemView";
import { Button } from "../../foundation/controls/Button";

export type FlowStep = { id: string; title: string; description?: string; statusText?: string; relatedIds?: string[] };

export function FlowStepper({ steps, initialStep = 0, step: controlledStep, onStepChange, label = "Process steps" }: {
  steps: FlowStep[];
  initialStep?: number;
  step?: number;
  onStepChange?: (step: FlowStep, index: number) => void;
  label?: string;
}) {
  const [internalStep, setInternalStep] = useState(initialStep);
  const stickySync = useStickyStepSync();
  if (!steps.length) return <div className="rk-flow-stepper" role="status">No steps are available.</div>;
  const stickyIndex = stickySync?.activeStepId ? steps.findIndex((item) => item.id === stickySync.activeStepId) : -1;
  const activeIndex = Math.max(0, Math.min(controlledStep ?? (stickyIndex >= 0 ? stickyIndex : internalStep), steps.length - 1));
  const current = steps[activeIndex];
  const choose = (index: number) => {
    const bounded = Math.max(0, Math.min(index, steps.length - 1));
    if (controlledStep === undefined) setInternalStep(bounded);
    stickySync?.setManualStep(steps[bounded].id);
    onStepChange?.(steps[bounded], bounded);
  };

  return (
    <section className="rk-flow-stepper" aria-label={label}>
      <ol className="rk-flow-stepper__list">
        {steps.map((item, index) => <li key={item.id}><button type="button" className={`rk-flow-step ${index === activeIndex ? "is-active" : ""} ${index < activeIndex ? "is-complete" : ""}`} aria-current={index === activeIndex ? "step" : undefined} onClick={() => choose(index)}><span className="rk-flow-step__number">{index + 1}</span><span>{item.title}</span></button></li>)}
      </ol>
      <div className="rk-flow-stepper__detail" aria-live="polite"><span>第 {activeIndex + 1} 步 · 共 {steps.length} 步</span><h3>{current.title}</h3>{current.description ? <p>{current.description}</p> : null}{current.statusText ? <p className="rk-flow-stepper__status">{current.statusText}</p> : null}</div>
      <div className="rk-flow-stepper__actions"><Button variant="secondary" onClick={() => choose(activeIndex - 1)} disabled={activeIndex === 0}>上一步</Button><Button variant="secondary" onClick={() => choose(activeIndex + 1)} disabled={activeIndex === steps.length - 1}>下一步</Button></div>
    </section>
  );
}
