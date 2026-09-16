import { useState } from 'react';

export interface EvidenceHotspot {
  id: string;
  label: string;
  detail: string;
  box: { left: number; top: number; width: number; height: number };
}

export function EvidenceLens({
  src,
  title,
  caption,
  hotspots,
}: {
  src: string;
  title: string;
  caption: string;
  hotspots: EvidenceHotspot[];
}) {
  const [selected, setSelected] = useState(hotspots[0]?.id ?? '');
  const active = hotspots.find((item) => item.id === selected) ?? hotspots[0];
  return (
    <details className="evidence-lens">
      <summary>查看论文证据 · {title}</summary>
      <div className="evidence-lens-stage">
        <img src={src} alt={`${title} 原图`} loading="lazy" />
        {hotspots.map((spot) => (
          <button
            type="button"
            key={spot.id}
            aria-label={`查看${spot.label}`}
            title={spot.label}
            className={`evidence-hotspot ${selected === spot.id ? 'selected' : ''}`}
            style={{
              left: `${spot.box.left}%`,
              top: `${spot.box.top}%`,
              width: `${spot.box.width}%`,
              height: `${spot.box.height}%`,
            }}
            onClick={() => setSelected(spot.id)}
          />
        ))}
      </div>
      <div className="chip-row evidence-lens-chips">
        {hotspots.map((spot) => (
          <button
            type="button"
            key={spot.id}
            className={`chip ${selected === spot.id ? 'selected' : ''}`}
            onClick={() => setSelected(spot.id)}
          >
            {spot.label}
          </button>
        ))}
      </div>
      <div className="feedback good"><b>{active?.label}：</b>{active?.detail}</div>
      <p className="evidence-caption">{caption}</p>
    </details>
  );
}
