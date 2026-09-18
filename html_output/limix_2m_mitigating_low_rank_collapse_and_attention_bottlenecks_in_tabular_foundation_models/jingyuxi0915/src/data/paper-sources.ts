// IDs verified against the fixed v2 HTML on 2026-09-14; no source-cache regeneration.
export const PAPER_V2 = 'https://arxiv.org/html/2606.04485v2';
const tables: Record<string,string> = { '1':'S3.T1','3':'S5.T3','4':'S5.T4','5':'S5.T5','6':'S5.T6','15':'A3.T15','16':'A3.T16','26':'A3.T26' };
export function paperSourceUrl(location: string): string {
 const table = /Table\s*(\d+)/i.exec(location)?.[1];
 if (table && tables[table]) return PAPER_V2+'#'+tables[table];
 if (/Fig\.?\s*3/i.test(location)) return PAPER_V2+'#S5.F3';
 if (location.includes('§4.3')) return PAPER_V2+'#S4.SS3';
 if (location.includes('附录A')) return PAPER_V2+'#A1';
 if (location.includes('B.2')) return PAPER_V2+'#A2.SS2';
 if (location.includes('§3') || location.includes('命题3.1')) return PAPER_V2+'#S3';
 if (location.includes('式')) return PAPER_V2+'#S4.SS2';
 if (location.includes('§2')) return PAPER_V2+'#S2';
 return PAPER_V2;
}
