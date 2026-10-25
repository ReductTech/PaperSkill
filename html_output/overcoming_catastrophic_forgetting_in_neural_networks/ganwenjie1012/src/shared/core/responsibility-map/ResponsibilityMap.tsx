import { useMemo, useState } from "react";
import { Feedback } from "../../foundation/feedback/Feedback";
import { validateResponsibilityMap } from "./types";
import type { ResponsibilityMapSpec } from "./types";

export function ResponsibilityMap({ spec, highlightMode = "step-first", showConclusion = true, onSelectionChange }: { spec: ResponsibilityMapSpec; highlightMode?: "step-first" | "actor-first"; showConclusion?: boolean; onSelectionChange?: (selection: { stepId: string | null; actorId: string | null }) => void }) {
  const errors = useMemo(() => validateResponsibilityMap(spec), [spec]);
  const [stepId, setStepId] = useState<string | null>(null);
  const [actorId, setActorId] = useState<string | null>(null);
  const selectedStep = spec.steps.find((step) => step.id === stepId);
  const selectedActor = spec.actors.find((actor) => actor.id === actorId);
  if (errors.length) return <div role="alert" className="rk-error"><strong>ResponsibilityMap data needs attention</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>;
  const chooseStep = (id: string) => { setStepId(id); setActorId(null); onSelectionChange?.({ stepId: id, actorId: null }); };
  const chooseActor = (id: string) => { setActorId(id); setStepId(null); onSelectionChange?.({ stepId: null, actorId: id }); };
  const ownedBySelected = (id: string) => highlightMode === "actor-first" && selectedActor ? selectedActor.id === id : selectedStep?.owners.includes(id) ?? false;
  const selectedOwnerSteps = selectedActor ? spec.steps.filter((step) => step.owners.includes(selectedActor.id)) : [];

  return (
    <section className="rk-responsibility" aria-label="Responsibility map">
      <div className="rk-responsibility__columns">
        <div><h3>Process steps</h3><div className="rk-responsibility__steps" role="group" aria-label="Process steps">
          {spec.steps.map((step) => { const owners = spec.actors.filter((actor) => step.owners.includes(actor.id)); const active = highlightMode === "actor-first" && selectedActor ? step.owners.includes(selectedActor.id) : selectedStep?.id === step.id; return <button key={step.id} type="button" className={`rk-responsibility__step ${active ? "is-active" : ""} ${!owners.length ? "is-unowned" : ""}`} aria-pressed={active} onClick={() => chooseStep(step.id)}><b>{step.label}</b><small>{owners.length ? owners.map((actor) => actor.name).join(" · ") : "No owner assigned"}</small></button>; })}
        </div></div>
        <div><h3>Actors</h3><div className="rk-responsibility__actors" role="group" aria-label="Responsible actors">
          {spec.actors.map((actor) => <button key={actor.id} type="button" className={`rk-responsibility__actor ${ownedBySelected(actor.id) ? "is-owner" : ""} ${actorId === actor.id ? "is-selected" : ""}`} aria-pressed={actorId === actor.id} onClick={() => chooseActor(actor.id)}><b>{actor.name}</b>{actor.description ? <small>{actor.description}</small> : null}<span><b>Can:</b> {actor.can}</span>{actor.cannot ? <span><b>Cannot:</b> {actor.cannot}</span> : null}</button>)}
          {spec.gapActor ? <article className={`rk-responsibility__gap ${selectedStep && !selectedStep.owners.length ? "is-active" : ""}`}><b>{spec.gapActor.name}</b><p>{spec.gapActor.description}</p></article> : null}
        </div></div>
      </div>
      <Feedback tone={selectedStep ? selectedStep.owners.length ? "good" : "warn" : "info"}>{selectedStep ? selectedStep.note ?? (selectedStep.owners.length ? `Owned by ${spec.actors.filter((actor) => selectedStep.owners.includes(actor.id)).map((actor) => actor.name).join(", ")}.` : "No actor is assigned to this step.") : selectedActor ? `${selectedActor.name} is responsible for ${selectedOwnerSteps.length} step${selectedOwnerSteps.length === 1 ? "" : "s"}.` : "Choose a step to see its owner, or an actor to see the steps it covers."}</Feedback>
      {showConclusion && spec.conclusion ? <p className="rk-responsibility__conclusion">{spec.conclusion}</p> : null}
    </section>
  );
}

export type { ResponsibilityActor, ResponsibilityMapSpec, ResponsibilityStep } from "./types";
