import React, { useState } from 'react';

export type ReadingMapItem = { id: string; label: string };

export function ReadingMap({ section, items, interactive = true }: { section: string; items: ReadingMapItem[]; interactive?: boolean }) {
  const [active, setActive] = useState(0);
  return (
    <nav className="learning-reading-map" aria-label={`${section} 阅读顺序`}>
      <div className="reading-map-header"><span>READING MAP</span><b>{section}</b><small>阅读顺序</small></div>
      <div className="reading-map-steps">
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <button
              type="button"
              className={`reading-map-step ${index === active ? 'active' : ''} ${index < active ? 'read' : ''}`}
              aria-pressed={index === active}
              onClick={interactive ? () => setActive(index) : undefined}
              disabled={!interactive}
            >
              <span>Step {index + 1}</span><b>{item.id}</b><small>{item.label}</small>
            </button>
            {index < items.length - 1 ? <i className="reading-map-arrow" aria-hidden="true" /> : null}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}

export function ChapterFrame({
  section,
  paperSection,
  title,
  subtitle,
  purpose,
  map,
  showReadingMap = true,
  mapInteractive = true,
  afterMapHeading,
  children,
}: {
  section: string;
  paperSection: string;
  title: string;
  subtitle: string;
  purpose: React.ReactNode;
  map: ReadingMapItem[];
  showReadingMap?: boolean;
  mapInteractive?: boolean;
  afterMapHeading?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="learning-chapter">
      <div className="learning-chapter-header">
        <span className="paper-section-tag">{paperSection}</span>
        <div className="learning-section-number">{section}</div><h1>{title}</h1><p>{subtitle}</p>
      </div>
      <aside className="chapter-purpose" aria-label="本节作用">
        <div className="chapter-purpose-label">本节作用</div>
        <div>{purpose}</div>
      </aside>
      {showReadingMap ? <ReadingMap section={section} items={map} interactive={mapInteractive} /> : null}
      {afterMapHeading ? <div className="learning-after-map-heading"><h1>{afterMapHeading}</h1></div> : null}
      {children}
    </section>
  );
}

export function TeachingSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="teaching-section">
      <div className="teaching-section-heading"><span>{number}</span><h2>{title}</h2></div>
      {children}
    </section>
  );
}
