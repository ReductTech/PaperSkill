import React from 'react';
type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'subtitle' | 'body' | 'small';
export function Typography({ variant = 'body', children, muted = false }: {
  variant?: Variant; children: React.ReactNode; muted?: boolean;
}) {
  const Tag = variant === 'h1' || variant === 'h2' || variant === 'h3' ? variant : 'p';
  return <Tag className={`ppt-type ppt-type-${variant}${muted ? ' ppt-muted' : ''}`}>{children}</Tag>;
}
