import type { ReactNode } from "react";
import { ICARL_TERMS, requestReferenceOpen } from "../data/icarl-reference-content";
import { TermRef } from "../shared/core/reference";

export function PaperTerm({ termId, children }: { termId: string; children?: ReactNode }) {
  const term = ICARL_TERMS[termId];
  if (!term) return <>{children}</>;
  return <TermRef term={term} onOpenReference={requestReferenceOpen}>{typeof children === "string" ? children : undefined}</TermRef>;
}
