import React from 'react';
import { useCoverPlayback } from '../components/CoverPlayback';
import type { WidgetProps } from './registry';
import { AllBirds, BIRDS, BoxRect, C, LakeScene, boxTokens, useReducedMotion, type Box } from './rex-kit';

// Same lake, same prompt "检测白鹭", same decoding speed (tokens per tick).
// Old: absolute coordinates spelled digit by digit; ends with one flock-wide box,
// one egret box and a duplicate (the failure modes named in the paper, p.2–3).
// New: one special token per coordinate value; five separate boxes, then the end token.
const OLD_BOXES: Box[] = [[420, 212, 880, 392], [117, 167, 205, 334], [121, 171, 209, 338]];
const NEW_BOXES: Box[] = BIRDS.filter(b => b.kind === 'egret').map(b => b.box);
const OLD_PIXEL_SCALE = 2.24; // the photo is shown as if it were 2240 px wide

function oldTokens(box: Box) {
  const digits = box.map(v => String(Math.round(v * OLD_PIXEL_SCALE)));
  return ['[', ...digits.flatMap((d, i) => [...d.split(''), ...(i < 3 ? [','] : [])]), ']'];
}
const OLD_SEQ = OLD_BOXES.map(oldTokens);
const NEW_SEQ = NEW_BOXES.map(b => boxTokens(b).map(k => `<${k}>`));
const OLD_TOTAL = OLD_SEQ.reduce((s, t) => s + t.length, 0);
const NEW_TOTAL = NEW_SEQ.reduce((s, t) => s + t.length, 0) + 1;

export function CoverCompare({ moduleId }: WidgetProps) {
  const { progress, playing } = useCoverPlayback();
  const reduced = useReducedMotion();
  const isNew = moduleId === 'newMethod';
  const t = reduced && !playing ? 1 : Math.max(0, Math.min(1, (progress - 0.04) / 0.8));
  const written = Math.floor(t * OLD_TOTAL); // identical token rate on both sides
  const seq = isNew ? NEW_SEQ : OLD_SEQ;
  const boxes = isNew ? NEW_BOXES : OLD_BOXES;
  let left = written, done = 0;
  const shown: string[] = [];
  for (const toks of seq) {
    if (left >= toks.length) { done++; left -= toks.length; shown.push(...toks, isNew ? '' : ' '); }
    else { shown.push(...toks.slice(0, left)); left = 0; break; }
  }
  const finished = written >= (isNew ? NEW_TOTAL : OLD_TOTAL);
  const tail = shown.filter(Boolean).slice(isNew ? -6 : -16);
  return <div className="rx-cover">
    <svg viewBox="70 140 880 290" width="664" height="219" role="img"
      aria-label={isNew ? '每个坐标写成一个专用词元，五只白鹭各得到一个框' : '坐标被拆成数字逐个写出，最后得到一个大框和一个重复框'}>
      <LakeScene view={[72, 142, 876, 286]}><AllBirds view={[72, 142, 876, 286]} /></LakeScene>
      {boxes.slice(0, done).map((b, i) => {
        const bad = !isNew && i !== 1;
        return <BoxRect key={i} box={b} color={bad ? C.red : isNew ? C.green : C.blue} width={5} dashed={!isNew && i === 2} />;
      })}
    </svg>
    <div className="rx-cover-stream" aria-hidden="true">
      {tail.map((tok, i) => <span key={i} className={isNew ? 'is-coord' : ''}>{tok}</span>)}
      {!finished && <span className="rx-caret">▍</span>}
    </div>
    <div className={`rx-cover-result ${finished ? (isNew ? 'is-good' : 'is-bad') : ''}`}>
      {!finished ? `已写 ${Math.min(written, isNew ? NEW_TOTAL : OLD_TOTAL)} 个输出词元……`
        : isNew ? `5/5 只白鹭各一个框 · 共 ${NEW_TOTAL} 个词元（含结束符）`
          : `漏 1 只 · 1 个大框罩住 3 只 · 1 个重复框 · ${OLD_TOTAL} 个词元`}
    </div>
  </div>;
}
