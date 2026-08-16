import type { ReactNode } from 'react';
import { Button } from '../controls/Button';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';
import { RelatedVideos, type RelatedVideo } from './RelatedVideos';
import { PageRating } from './PageRating';

export interface LessonFooterLink {
  href: string;
  label: ReactNode;
}

export interface LessonFooterProps {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  videos?: RelatedVideo[];
  videosLabel?: ReactNode;
  back?: LessonFooterLink;
  next?: LessonFooterLink;
  className?: string;
}

/**
 * A module-ending composition: completion context, the next action, and optional
 * related resources.  It deliberately keeps the resource rail secondary so a
 * lesson does not end as a second catalogue page.
 */
export function LessonFooter({
  title,
  description,
  eyebrow = '本节完成',
  videos = [],
  videosLabel = '延伸观看',
  back,
  next,
  className,
}: LessonFooterProps) {
  return (
    <footer className={classNames('edu-lesson-footer', className)}>
      <div className="edu-lesson-footer-main">
        <div className="edu-lesson-footer-copy">
          <Typography as="span" variant="label" tone="accent" className="edu-kicker">{eyebrow}</Typography>
          <Typography as="h3" variant="display">{title}</Typography>
          {description && <Typography variant="body" tone="muted">{description}</Typography>}
        </div>
        {(back || next) && (
          <nav className="edu-lesson-footer-actions" aria-label="课程结尾操作">
            {back && <Button href={back.href}>{back.label}</Button>}
            {next && <Button href={next.href} variant="primary">{next.label}</Button>}
          </nav>
        )}
      </div>
      {videos.length > 0 && (
        <div className="edu-lesson-footer-resources">
          <Typography as="span" variant="label" tone="muted">{videosLabel}</Typography>
          <RelatedVideos videos={videos} showHeader={false} ariaLabel="延伸观看资源" />
        </div>
      )}
      <PageRating />
    </footer>
  );
}
