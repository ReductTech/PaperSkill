import type { CSSProperties, ReactNode } from 'react';

type CanvasViewportProps = {
  children: ReactNode;
  label?: string;
  mobileMinWidth?: number;
};

/**
 * Keeps dense Canvas diagrams at a readable scale on narrow screens. The
 * overflow is local to this focusable region, so the document itself never
 * acquires a horizontal scrollbar and keyboard users can pan with arrow keys.
 */
export function CanvasViewport({
  children,
  label = '交互图示，可横向滚动查看完整内容',
  mobileMinWidth = 560,
}: CanvasViewportProps) {
  const style = {
    '--canvas-mobile-min': `${mobileMinWidth}px`,
  } as CSSProperties;

  return (
    <div
      className="canvas-viewport"
      role="region"
      aria-label={label}
      tabIndex={0}
      style={style}
    >
      {children}
    </div>
  );
}
