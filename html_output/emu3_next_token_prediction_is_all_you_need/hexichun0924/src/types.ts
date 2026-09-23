export type SourceKind = 'paper' | 'derived' | 'teaching-demo'

export interface EvidenceNote {
  claim: string
  source: string
  kind: SourceKind
}
