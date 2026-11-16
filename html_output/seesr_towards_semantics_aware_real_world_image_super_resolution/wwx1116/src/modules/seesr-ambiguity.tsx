import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { BoatGlyph, BirdGlyph, C, SeaCliffScene, clamp, pct } from './seesr-cover';

/** S1 — why a heavily degraded fragment no longer fixes its own semantics. */
export function SeesrAmbiguity(_props: WidgetProps) {
  const [damage, setDamage] = useState(0.15);

  const boatScore = clamp(0.92 - 0.98 * damage, 0.02, 0.98);
  const birdScore = clamp(0.12 + 0.86 * damage, 0.02, 0.98);
  const ambiguity = 1 - Math.abs(boatScore - birdScore);
  const interpretation = damage < 0.62 ? 'boat' : 'blur';
  const detail = clamp(1 - damage / 0.62, 0, 1);

  const verdict = damage < 0.3 ? '清晰' : damage < 0.7 ? '含糊' : '无法辨认';
  const feedback = damage < 0.3
    ? '细节笔画还在：船与鸟很容易区分。'
    : damage < 0.7
      ? '细节开始消失：船和鸟的轮廓都还成立，歧义在上升。'
      : '像素已经无法区分：不先认定“这是什么”，补绘只能靠猜。';
  const tone = damage < 0.3 ? 'is-good' : damage < 0.7 ? 'is-mid' : 'is-bad';

  const rows = [
    { key: 'boat', name: '船', score: boatScore },
    { key: 'bird', name: '鸟', score: birdScore },
  ];

  return (
    <div className="seesr-scene">
      <div className="seesr-frame" style={{ left: 0, top: 0, width: 800, height: 622 }}>
        <SeaCliffScene interpretation={interpretation} damage={damage} detail={detail}
          lensAt={{ x: 206, y: 258 }} />
      </div>

      <div className="seesr-panel" style={{ left: 812, top: 0, width: 660, height: 316 }}>
        <div className="seesr-h">修复台上的残卷</div>
        <label className="seesr-slider">
          <span>退化强度</span>
          <input type="range" min={0} max={1} step={0.01} value={damage}
            onChange={(event) => setDamage(Number(event.target.value))} />
          <b>{pct(damage)}</b>
        </label>
        <div className="seesr-row">
          <span className="seesr-muted">当前判定</span>
          <b className="seesr-emph" style={{ color: damage < 0.3 ? C.green : damage < 0.7 ? C.blue : C.red }}>{verdict}</b>
          <span className="seesr-muted">歧义度 {pct(ambiguity)}</span>
        </div>
        <p className="seesr-lead">放大镜下的船形色块，正在从“船”退化成“说不清”。</p>
      </div>

      <div className="seesr-panel" style={{ left: 812, top: 336, width: 660, height: 286 }}>
        <div className="seesr-h">两个都说得通的候选</div>
        {rows.map((row) => (
          <div className="seesr-candrow" key={row.key}>
            <svg viewBox="-95 -70 190 140" className="seesr-candglyph" aria-hidden="true" opacity={row.score}>
              {row.key === 'boat' ? <BoatGlyph detail={0.9} /> : <BirdGlyph />}
            </svg>
            <span className="seesr-candname">{row.name}</span>
            <span className="seesr-bar">
              <i style={{ width: pct(row.score), background: row.score > 0.5 ? C.blue : C.line }} />
            </span>
            <b className="seesr-muted">{pct(row.score)}</b>
          </div>
        ))}
        <p className={`seesr-feedback ${tone}`} aria-live="polite">{feedback}</p>
      </div>
    </div>
  );
}
