import type { EvidenceRef } from '../types';
import { EvidencePanel } from './EvidencePanel';

export interface ChapterEvidenceProps {
  items: readonly EvidenceRef[];
  title?: string;
}

export function ChapterEvidence({ items, title = '查看论文证据与边界' }: ChapterEvidenceProps) {
  return <EvidencePanel items={items} title={title} />;
}
