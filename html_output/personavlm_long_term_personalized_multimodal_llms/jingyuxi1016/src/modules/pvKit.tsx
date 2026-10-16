import React, { useEffect, useRef } from 'react';
import type { WidgetProps } from './registry';

export const C = { blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea', field: '#f5f8f0', pale: '#e7edf4' };

const css = `
.pv-tool{min-width:0;color:var(--ink);font-size:16px;line-height:1.7}
.pv-source{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;color:#68778f;font-size:14px}
.pv-label{display:inline-block;border:1px solid #d7deea;padding:2px 9px;color:#27446e;background:#f3f6fa;border-radius:4px;font-weight:600;white-space:nowrap}
.pv-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:16px 0}
.pv-tool button{min-height:42px;max-width:100%;white-space:normal;line-height:1.5}
.pv-tool .chip{font-size:15px;padding:8px 13px}
.pv-tool select{max-width:100%;min-height:44px;padding:8px 12px;border:1px solid #d7deea;background:#fff;color:#21324a;border-radius:6px}
.pv-tool label{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
.pv-tool input[type=range]{accent-color:#27446e;width:100%;min-width:0;min-height:32px}
.pv-split{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;align-items:start;margin:14px 0}
.pv-tool h5{font-size:17px;line-height:1.55;margin:0 0 10px;color:#27446e}
.pv-tool p{margin:8px 0;overflow-wrap:anywhere}
.pv-tool strong{font-weight:650}
.pv-tool svg{display:block;width:100%;height:auto;overflow:visible}
.pv-plot{background:#f5f8f0;border:1px solid #d7deea;border-radius:6px;padding:12px;margin:12px 0}
.pv-detail{padding:15px 0;border-top:1px solid #d7deea;border-bottom:1px solid #d7deea;margin:14px 0}
.pv-line{display:flex;gap:12px;align-items:baseline;justify-content:space-between;flex-wrap:wrap;margin:7px 0}
.pv-line b{color:#27446e;font-variant-numeric:tabular-nums}
.pv-reading{font-size:20px;font-weight:650;color:#27446e;font-variant-numeric:tabular-nums}
.pv-muted{color:#68778f}.pv-positive{color:#228d5c}.pv-negative{color:#c43f52}
.pv-bar-row{margin:15px 0}.pv-bar-label{display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin-bottom:5px;font-size:15px;overflow-wrap:anywhere}
.pv-bar-track{height:12px;background:#edf0f3;border-radius:2px;overflow:hidden}.pv-bar-fill{height:100%;transition:width .25s ease;border-radius:2px}
.pv-axis{display:flex;justify-content:space-between;color:#68778f;font-size:13px;margin:6px 0}
.pv-table-wrap{overflow-x:auto;max-width:100%;margin:16px 0}.pv-table{width:100%;border-collapse:collapse;font-size:15px;text-align:left}.pv-table th,.pv-table td{padding:10px 12px;border-bottom:1px solid #d7deea;vertical-align:top}.pv-table th{color:#27446e;background:#f3f6fa}.pv-table td:not(:first-child){font-variant-numeric:tabular-nums}
.pv-evidence{display:flex;align-items:flex-start;gap:12px;border-left:3px solid #d7deea;padding:10px 14px;margin:12px 0}.pv-evidence.active{border-left-color:#27446e;background:#f3f6fa}.pv-evidence.inactive{opacity:.58}.pv-evidence .pv-dot{margin-top:8px}
.pv-dot{display:inline-block;flex:none;width:9px;height:9px;border-radius:50%;background:#b6c5d5}
.pv-steps{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.pv-step{font-size:14px;border-bottom:3px solid #d7deea;padding:5px 8px;color:#68778f}.pv-step.active{border-color:#27446e;color:#27446e;font-weight:650}
.pv-note{padding:12px 16px;border-left:3px solid #f07e47;background:#fff8f2;margin:14px 0}
.pv-tool .feedback{font-size:16px;min-height:62px;margin-top:18px;overflow-wrap:anywhere}
.pv-tool a{overflow-wrap:anywhere}.pv-tool button:disabled{opacity:.45;cursor:not-allowed}
@media(max-width:620px){.pv-split{grid-template-columns:1fr;gap:16px}.pv-source{font-size:13px}.pv-tool .chip{font-size:14px;padding:8px 10px}.pv-plot{padding:8px}.pv-table th,.pv-table td{padding:8px}.pv-table{font-size:14px}.pv-line{gap:6px}.pv-tool .feedback{font-size:15px}.pv-reading{font-size:18px}}
@media(prefers-reduced-motion:reduce){.pv-bar-fill{transition:none}}
`;

export function Frame({ children, kind = 'teaching', evidence, id }: { children: React.ReactNode; kind?: 'teaching' | 'paper'; evidence: string; id?: string }) {
  return <div className="pv-tool" data-widget={id} onKeyDownCapture={e => {
    if (e.key.startsWith('Arrow') && (e.target as HTMLElement).closest('input,select,textarea,[role=slider]')) e.stopPropagation();
  }}><style>{css}</style><div className="pv-source"><span className="pv-label">{kind === 'paper' ? '论文实测数据' : '教学示意'}</span><span>{evidence}</span></div>{children}</div>;
}

export function Chip({ active, onClick, children, disabled = false }: { active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return <button type="button" className={`chip ${active ? 'selected' : ''}`} aria-pressed={active} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Feedback({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'good' | 'bad' | 'info' }) {
  return <div className={`feedback ${tone === 'info' ? '' : tone}`} aria-live="polite">{children}</div>;
}

export function Plot({ children, label, viewBox = '0 0 800 260' }: { children: React.ReactNode; label: string; viewBox?: string }) {
  return <div className="pv-plot"><svg viewBox={viewBox} role="img" aria-label={label}><title>{label}</title>{children}</svg></div>;
}

export function Bars({ rows, max = 100, unit = '%' }: { rows: { label: string; value: number; color?: string; detail?: string }[]; max?: number; unit?: string }) {
  return <div role="img" aria-label={`比较图，单位${unit}，横轴0至${max}`}><div className="pv-axis"><span>0</span><span>{max}{unit}</span></div>{rows.map(r => <div className="pv-bar-row" key={r.label}><div className="pv-bar-label"><span>{r.label}{r.detail ? ` · ${r.detail}` : ''}</span><strong style={{ color: r.color || C.blue, whiteSpace: 'nowrap' }}>{r.value.toFixed(2)}{unit}</strong></div><div className="pv-bar-track"><div className="pv-bar-fill" style={{ width: `${Math.min(100, Math.max(0, r.value / max * 100))}%`, background: r.color || C.blue }} /></div></div>)}</div>;
}

export function NotebookScene({ chapterId, moduleId }: WidgetProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 1120; canvas.height = 280; ctx.scale(2, 2);
    ctx.fillStyle = C.field; ctx.fillRect(0, 0, 560, 140);
    const old = moduleId === 'old';
    const n = Number(chapterId.replace('chap-', '')) || 1;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = C.line; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(106, 20, 346, 102, 6); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(279, 23); ctx.lineTo(279, 119); ctx.stroke();
    for (let y = 44; y < 104; y += 16) {
      ctx.strokeStyle = '#e2e8e3'; ctx.beginPath(); ctx.moveTo(128, y); ctx.lineTo(255, y); ctx.moveTo(302, y); ctx.lineTo(426, y); ctx.stroke();
    }
    const selectedY = old ? 44 : 44 + ((n + 1) % 4) * 16;
    ctx.strokeStyle = old ? C.red : C.blue; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(old ? 132 : 306, selectedY); ctx.lineTo(old ? 227 : 402, selectedY); ctx.stroke();
    ctx.fillStyle = old ? C.red : C.green; ctx.beginPath(); ctx.moveTo(393, 19); ctx.lineTo(407, 19); ctx.lineTo(407, 48); ctx.lineTo(400, 42); ctx.lineTo(393, 48); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(328, 89); ctx.rotate(-.42); ctx.fillStyle = C.orange; ctx.fillRect(0, -4, 62, 8); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(0, -4); ctx.lineTo(0, 4); ctx.fill(); ctx.restore();
    canvas.classList.add('is-ready');
  }, [chapterId, moduleId]);
  return <><style>{`
    .analogy-card:has(.pv-notebook){flex-direction:row;flex-wrap:wrap}
    .analogy-card:has(.pv-notebook) .analogy-visual{flex:1 1 400px;min-width:0;width:auto}
    .analogy-card:has(.pv-notebook) .analogy-body{flex:1 1 280px;min-width:0}
  `}</style><canvas ref={ref} className="pv-notebook" aria-label="自制教学图：一本带日期索引和修订标记的图文手记" style={{ width: '100%', height: 'auto', aspectRatio: '4 / 1', border: 0, margin: 0 }} /></>;
}
