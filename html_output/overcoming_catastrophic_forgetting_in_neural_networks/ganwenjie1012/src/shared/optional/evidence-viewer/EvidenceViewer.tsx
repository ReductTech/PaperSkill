import { useState } from "react";

export type EvidenceVerdict = "supported" | "too-strong" | "unsupported";
export type EvidenceViewerData = { claim: string; experiment: string; evidence: string[]; interpretation: string; boundary: string; correctVerdict?: EvidenceVerdict; verdictExplanation?: string };
const verdicts = [{ value: "supported" as const, label: "Supported" }, { value: "too-strong" as const, label: "Too strong" }, { value: "unsupported" as const, label: "Unsupported" }];

export function EvidenceViewer({ data, mode = "read" }: { data: EvidenceViewerData; mode?: "read" | "judge" }) {
  const [verdict, setVerdict] = useState<EvidenceVerdict | null>(null);
  return <section className="rk-evidence" aria-label="Evidence review"><div className="rk-evidence__claim"><span>Claim</span><blockquote>{data.claim}</blockquote></div><div className="rk-evidence__protocol"><h3>Experiment</h3><p>{data.experiment}</p></div><div className="rk-evidence__observations"><h3>Observed evidence</h3><ul>{data.evidence.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="rk-evidence__reading"><div><h3>Interpretation</h3><p>{data.interpretation}</p></div><div><h3>Boundary</h3><p>{data.boundary}</p></div></div>{mode === "judge" ? <div className="rk-evidence__judge"><h3>How strongly does the evidence support the claim?</h3><div className="rk-evidence__choices" role="group" aria-label="Evidence verdict">{verdicts.map((option) => <button key={option.value} type="button" aria-pressed={verdict === option.value} onClick={() => setVerdict(option.value)}>{option.label}</button>)}</div>{verdict ? <p className={`rk-evidence__verdict ${data.correctVerdict === verdict ? "is-correct" : "is-review"}`} aria-live="polite">{data.correctVerdict === verdict ? "Your reading matches the evidence boundary." : "Review the conditions and limits before deciding."} {data.verdictExplanation}</p> : null}</div> : null}</section>;
}
