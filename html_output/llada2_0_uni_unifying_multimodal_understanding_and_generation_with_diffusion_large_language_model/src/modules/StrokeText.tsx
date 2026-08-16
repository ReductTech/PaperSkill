import React, { useId } from 'react';

export function StrokeText({ text }: { text: string }) {
  const clipId = `stroke-title-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const characters = Array.from(text);

  return (
    <span className="stroke-title" role="img" aria-label={text}>
      <svg
        className="stroke-title__svg"
        viewBox="0 0 920 150"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <rect className="stroke-title__wipe" x="28" y="12" width="864" height="126" />
          </clipPath>
        </defs>
        <text
          className="stroke-title__stroke"
          x="460"
          y="112"
          textAnchor="middle"
          fill="none"
          stroke="#9c7cff"
          strokeWidth="1.65"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {characters.map((character, index) => (
            <tspan
              key={`stroke-${index}`}
              className="stroke-title__char"
              style={{ animationDelay: `${index * 55}ms` }}
            >
              {character}
            </tspan>
          ))}
        </text>
        <text
          className="stroke-title__fill"
          x="460"
          y="112"
          textAnchor="middle"
          fill="#f7f5ff"
          clipPath={`url(#${clipId})`}
        >
          {characters.map((character, index) => (
            <tspan key={`fill-${index}`}>{character}</tspan>
          ))}
        </text>
      </svg>
    </span>
  );
}
