import React, { useState } from 'react';
import { Feedback, INK, Meter, Sheet, Switch } from './kit';

type PackFile = { id: string; name: string; kind: string; risk: 'none' | 'source' | 'internal' };

const FILES: PackFile[] = [
  { id: 'cli', name: 'cli.js', kind: '成品页', risk: 'none' },
  { id: 'readme', name: 'README.md', kind: '说明页', risk: 'none' },
  { id: 'map', name: 'cli.js.map', kind: '校样附页', risk: 'source' },
  { id: 'draft', name: 'draft.txt', kind: '内部草稿', risk: 'internal' },
];

/* 两个独立开关就是原文里那次事故的两个条件：
   1) 包里有 sourcemap 附页；2) 发布范围没有用白名单收窄。
   组合出 2×2 四种结果，让学习者自己在台面上把"多一张附页"复原出来。 */
export function ReleaseManifest() {
  const [allowlist, setAllowlist] = useState(false);
  const [sourcemap, setSourcemap] = useState(true);

  const packed = FILES.filter(f => {
    if (f.id === 'map') return sourcemap;
    if (f.id === 'draft') return !allowlist;
    return true;
  });
  const leakedInternal = packed.some(f => f.risk === 'internal');
  const exposedSource = sourcemap;
  const tone = leakedInternal || exposedSource ? 'bad' : 'good';

  return (
    <div className="ps" style={{ gridTemplateColumns: 'minmax(0, 1.28fr) minmax(0, 1fr)' }}>
      <div className="ps-desk">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 10, height: '100%', paddingBottom: 40 }}>
          {FILES.map(file => {
            const on = packed.some(f => f.id === file.id);
            const risky = on && file.risk !== 'none';
            return (
              <button key={file.id} type="button" className="ps-file" data-on={on}
                data-state={on ? (risky ? 'risk' : 'safe') : 'idle'}
                aria-pressed={on} style={{ height: '100%', justifyContent: 'center' }}
                onClick={() => {
                  if (file.id === 'map') setSourcemap(v => !v);
                  if (file.id === 'draft') setAllowlist(v => !v);
                }}>
                <svg viewBox="0 0 180 190" aria-hidden="true">
                  <Sheet x={22} y={8} w={136} h={168} lines={4}
                    tone={on ? (risky ? INK.red : INK.green) : INK.edgeStrong}
                    dash={!on} />
                  {on && !risky && <path d="M62 120 l18 18 34-40" fill="none" stroke={INK.green} strokeWidth="8" strokeLinecap="round" />}
                  {risky && <>
                    <circle cx="90" cy="112" r="30" fill="none" stroke={INK.red} strokeWidth="6" />
                    <path d="M76 98 l28 28 M104 98 l-28 28" stroke={INK.red} strokeWidth="7" strokeLinecap="round" />
                  </>}
                </svg>
                <strong>{file.name}</strong>
                <span>{on ? file.kind : '留在仓库'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="ps-col" style={{ gap: 12 }}>
        <Switch checked={allowlist} onChange={setAllowlist}>只按 files 白名单打包</Switch>
        <Switch checked={sourcemap} onChange={setSourcemap}>构建时生成 sourcemap</Switch>

        <div className="ps-card ps-card--plain ps-grow" style={{ padding: '14px 20px' }}>
          <p className="ps-t ps-muted">进箱清单 · {packed.length} 件</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {packed.map(f => (
              <span key={f.id} className="ps-chip"
                data-tone={f.risk === 'none' ? 'green' : 'red'}>{f.name}</span>
            ))}
          </div>
        </div>

        <Meter label="可还原的源码" value={exposedSource ? 100 : 0} tone={exposedSource ? 'red' : 'blue'}
          readout={exposedSource ? '60 万行可读' : '不可还原'} />
        <Meter label="随包外泄的内部资料" value={leakedInternal ? 1 : 0} max={1}
          tone={leakedInternal ? 'red' : 'blue'} readout={leakedInternal ? '1 件' : '0 件'} />

        <Feedback tone={tone}>
          {exposedSource && leakedInternal && '附页和内部草稿一起进箱：源码可还原，草稿也公开。'}
          {exposedSource && !leakedInternal && '白名单挡住了草稿，但挡不住 sourcemap 附页。'}
          {!exposedSource && leakedInternal && '没有附页，但仓库里的一切都跟着发布了。'}
          {!exposedSource && !leakedInternal && '本样例只公开成品页与说明页。'}
        </Feedback>
      </div>
    </div>
  );
}
