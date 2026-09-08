import { useState, type ReactNode } from 'react';
import { Button } from '../controls/Button';
import { Callout, type CalloutProps } from './Callout';

export interface ReplayableCalloutsProps {
  items: CalloutProps[];
  replayLabel?: ReactNode;
  className?: string;
}

export function ReplayableCallouts({
  items,
  replayLabel = '重新播放',
  className,
}: ReplayableCalloutsProps) {
  const [replay, setReplay] = useState(0);

  return (
    <div className={className}>
      {items.map((item, index) => <Callout {...item} key={`${replay}-${index}`} />)}
      <div className="edu-replayable-callout-actions">
        <Button onClick={() => setReplay((value) => value + 1)}>{replayLabel}</Button>
      </div>
    </div>
  );
}
