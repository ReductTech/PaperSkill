import { useEffect, useRef, useState } from 'react';
import { emitTelemetry, getTelemetryState } from '../telemetry';
import { Typography } from '../typography/Typography';

export type PageRatingValue = 1 | 2 | 3 | 4 | 5;

export interface PageRatingProps {
  pageKey?: string;
}

/** A compact end-of-page signal. The submitted choice is also emitted as `page_rating`. */
export function PageRating({ pageKey }: PageRatingProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [rating, setRating] = useState<PageRatingValue | null>(null);
  const [preview, setPreview] = useState<PageRatingValue | null>(null);
  const stateKey = `page-rating:${pageKey || window.location.pathname}`;

  useEffect(() => {
    let active = true;
    void getTelemetryState<{ rating?: number }>(stateKey).then((entry) => {
      const restored = Number(entry?.state?.rating);
      if (active && restored >= 1 && restored <= 5) setRating(restored as PageRatingValue);
    });
    return () => { active = false; };
  }, [stateKey]);

  const submit = (value: PageRatingValue) => {
    if (rating) return;
    setRating(value);
    emitTelemetry('page_rating', rootRef.current, {
      state_key: stateKey,
      state: { rating: value },
      page_key: pageKey || window.location.pathname,
      rating: value,
    });
  };

  return (
    <section className="edu-page-rating" ref={rootRef} aria-label="当页评价">
      {rating ? (
        <Typography variant="caption" tone="muted">感谢你的评分。</Typography>
      ) : (
        <>
          <Typography variant="caption" tone="muted">这一页的学习体验如何？</Typography>
          <div className="edu-page-rating-stars" role="radiogroup" aria-label="学习体验评分">
            {([1, 2, 3, 4, 5] as const).map((value) => (
              <button
                className={value <= (preview ?? 0) ? 'is-previewed' : undefined}
                type="button"
                role="radio"
                aria-checked="false"
                aria-label={`${value} 星评分`}
                data-telemetry-manual
                key={value}
                onPointerEnter={() => setPreview(value)}
                onPointerLeave={() => setPreview(null)}
                onFocus={() => setPreview(value)}
                onBlur={() => setPreview(null)}
                onClick={() => submit(value)}
              >
                ★
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
