export type ResponsibilityActor = { id: string; name: string; description?: string; can: string; cannot?: string };
export type ResponsibilityStep = { id: string; label: string; owners: string[]; note?: string };
export type ResponsibilityMapSpec = { actors: ResponsibilityActor[]; steps: ResponsibilityStep[]; conclusion?: string; gapActor?: { id: string; name: string; description: string } };

export function ownersForStep(spec: ResponsibilityMapSpec, stepId: string): ResponsibilityActor[] {
  const step = spec.steps.find((item) => item.id === stepId);
  return spec.actors.filter((actor) => step?.owners.includes(actor.id));
}

export function stepsForActor(spec: ResponsibilityMapSpec, actorId: string): ResponsibilityStep[] {
  return spec.steps.filter((step) => step.owners.includes(actorId));
}

export function validateResponsibilityMap(spec: ResponsibilityMapSpec): string[] {
  const actorIds = new Set(spec.actors.map((actor) => actor.id));
  const errors: string[] = [];
  for (const step of spec.steps) for (const owner of step.owners) if (!actorIds.has(owner)) errors.push(`Step '${step.id}' refers to unknown owner '${owner}'.`);
  return errors;
}
