import termsSource from './reference-terms.yaml?raw';
import evidenceSource from './reference-evidence.yaml?raw';

export type TermRecord = {
  id: string;
  label: string;
  full_name: string;
  definition: string;
  paper_role: string;
  confusion: string;
  prerequisites: string[];
  source_category: string;
  source_ref?: string;
};

export type EvidenceRecord = {
  id: string;
  group: string;
  text: string;
  type: string;
  location: string;
};

function scalar(value: string): string | string[] {
  const trimmed = value.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const body = trimmed.slice(1, -1).trim();
    return body ? body.split(',').map((item) => scalar(item.trim()) as string) : [];
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return trimmed;
}

function parseTerms(source: string): TermRecord[] {
  const terms = new Map<string, Partial<TermRecord>>();
  let currentId: string | null = null;
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const record = line.match(/^([a-z][a-z0-9_-]*):\s*$/);
    if (record) {
      currentId = record[1];
      terms.set(currentId, { id: currentId, prerequisites: [] });
      continue;
    }
    if (!currentId) continue;
    const field = line.match(/^\s{2}([a-z_]+):\s*(.*?)\s*$/);
    if (!field) continue;
    const [key, value] = [field[1] as keyof TermRecord, scalar(field[2])];
    const entry = terms.get(currentId)!;
    if (key === 'prerequisites') entry.prerequisites = Array.isArray(value) ? value : [];
    else if (key === 'id') continue;
    else (entry as Record<string, unknown>)[key] = value;
  }
  return [...terms.values()].filter((entry) => entry.id && entry.label && entry.definition) as TermRecord[];
}

function unquote(value: string): string {
  const parsed = scalar(value);
  return Array.isArray(parsed) ? parsed.join(', ') : parsed;
}

function parseEvidence(source: string): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];
  let group = '';
  let current: EvidenceRecord | null = null;
  const save = () => {
    if (current) records.push(current);
    current = null;
  };
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const section = line.match(/^([a-z][a-z0-9_-]*):\s*$/);
    if (section) {
      save();
      group = section[1];
      continue;
    }
    const entry = line.match(/^\s{2}([A-Za-z][A-Za-z0-9_-]*):\s*$/);
    if (entry) {
      save();
      current = { id: entry[1], group, text: '', type: '', location: '' };
      continue;
    }
    if (!current) continue;
    const field = line.match(/^\s{4}(text|type|source):\s*(.*?)\s*$/);
    if (!field) continue;
    if (field[1] === 'text') current.text = unquote(field[2]);
    if (field[1] === 'type') current.type = unquote(field[2]);
    if (field[1] === 'source') {
      const location = field[2].match(/location:\s*("(?:\\.|[^"])*"|'(?:''|[^'])*'|[^,}]+)/);
      if (location) current.location = unquote(location[1]);
    }
  }
  save();
  return records.filter((entry) => entry.text);
}

export const terms = parseTerms(termsSource);
export const termById = new Map(terms.map((term) => [term.id, term]));
export const evidence = parseEvidence(evidenceSource);
export const evidenceById = new Map(evidence.map((item) => [item.id, item]));
