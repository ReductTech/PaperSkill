import React, { useState } from "react";
import { ReferenceHub, type HubRequest } from "../components/ReferenceHub";
import type { WidgetProps } from "./registry";
import { CoverageBoundaryView } from "../v3/components/CoverageBoundaryView";
import { LwfEvidenceExplorer } from "../v3/components/LwfEvidenceExplorer";
import { LwfGrandTrail } from "../v3/components/LwfGrandTrail";
import { LwfTaskHandoffView } from "../v3/components/LwfTaskHandoffView";
import { ObjectiveBalanceView } from "../v3/components/ObjectiveBalanceView";
import { PreservationCompare } from "../v3/components/PreservationCompare";
import { v3ReferenceIds, v3ReferencePriority } from "../v3/data/references";
import "../styles/reference-hub.css";
import "../shared/foundation/styles/kit.css";
import "../v3/styles/module-host.css";
import "../v3/styles/scrollytelling.css";
import "../v3/styles/mechanism.css";
import "../v3/styles/sequential.css";
import "../v3/styles/evidence.css";
import "../v3/styles/replay.css";
import "../v3/styles/grand-trail.css";

function ModuleFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`lwf-v3-module-root ${className}`}>{children}</div>;
}

function ReferenceBoundModule({ children }: { children: (openReference: (termId: string) => void) => React.ReactNode }) {
  const [request, setRequest] = useState<HubRequest | null>(null);
  const openReference = (termId: string) => {
    const cardId = v3ReferenceIds[termId];
    setRequest(cardId ? { cardId } : {});
  };

  return <ModuleFrame>
    {children(openReference)}
    {request ? <ReferenceHub request={request} onClose={() => setRequest(null)} priorityIds={v3ReferencePriority} /> : null}
  </ModuleFrame>;
}

const PreservationWidget: React.FC<WidgetProps> = () => <ModuleFrame className="v3-mechanism-chapter"><PreservationCompare /></ModuleFrame>;
const ObjectiveWidget: React.FC<WidgetProps> = () => <ModuleFrame className="v3-mechanism-chapter"><ObjectiveBalanceView /></ModuleFrame>;
const CoverageWidget: React.FC<WidgetProps> = () => <ModuleFrame className="v3-mechanism-chapter"><CoverageBoundaryView /></ModuleFrame>;
const TaskHandoffWidget: React.FC<WidgetProps> = () => <ReferenceBoundModule>{(openReference) => <LwfTaskHandoffView onOpenReference={openReference} onNavigateChapter={(chapterId) => { window.location.hash = `chapter-${chapterId}`; }} />}</ReferenceBoundModule>;
const EvidenceWidget: React.FC<WidgetProps> = () => <ReferenceBoundModule>{(openReference) => <LwfEvidenceExplorer onOpenReference={openReference} />}</ReferenceBoundModule>;
const GrandTrailWidget: React.FC<WidgetProps> = () => <ReferenceBoundModule>{(openReference) => <LwfGrandTrail onOpenReference={openReference} />}</ReferenceBoundModule>;

export const v3WidgetRegistry: Record<string, React.FC<WidgetProps>> = {
  "lwf-preservation-compare": PreservationWidget,
  "lwf-objective-balance": ObjectiveWidget,
  "lwf-coverage-boundary": CoverageWidget,
  "lwf-task-handoff": TaskHandoffWidget,
  "lwf-evidence-explorer": EvidenceWidget,
  "lwf-grand-trail": GrandTrailWidget,
};
