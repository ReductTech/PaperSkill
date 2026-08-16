import React from 'react';

type PartHeaderItem = {
  number: string;
  label: string;
  href: string;
};

type PartHeaderProps = {
  id: string;
  kicker: string;
  title: string;
  items: PartHeaderItem[];
  onNavigate?: (href: string) => void;
};

export function PartHeader({ id, kicker, title, items, onNavigate }: PartHeaderProps) {
  return (
    <header className="part-header" id={id}>
      <span className="part-kicker">{kicker}</span>
      <h2>{title}</h2>
      <nav className="part-progress" aria-label={`${kicker} 章节目录`}>
        {items.map((item, index) => (
          <React.Fragment key={item.href}>
            <a
              href={item.href}
              onClick={(event) => {
                if (!onNavigate) return;
                event.preventDefault();
                onNavigate(item.href);
              }}
            >
              <b>{item.number}</b> {item.label}
            </a>
            {index < items.length - 1 ? <i aria-hidden="true">→</i> : null}
          </React.Fragment>
        ))}
      </nav>
    </header>
  );
}
