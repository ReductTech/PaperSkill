import React from 'react';

// 画布容器：宽度由容器决定；可选的点按回调把坐标换算为画布内 CSS 像素。
// 画布设置 touch-action: pan-y，点按不会和页面纵向滚动打架。
export function StageBox({
  s,
  label,
  onTap,
  className,
  cursor,
}: {
  s: { wrapRef: React.RefObject<HTMLDivElement>; canvasRef: React.RefObject<HTMLCanvasElement> };
  label: string;
  onTap?: (x: number, y: number) => void;
  className?: string;
  cursor?: boolean;
}) {
  return (
    <div className={`stage-box ${className ?? ''}`} ref={s.wrapRef}>
      <canvas
        ref={s.canvasRef}
        role="img"
        aria-label={label}
        className={cursor || onTap ? 'is-tappable' : undefined}
        onPointerUp={
          onTap
            ? (e) => {
                if (e.pointerType === 'mouse' && e.button !== 0) return;
                const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
                onTap(e.clientX - r.left, e.clientY - r.top);
              }
            : undefined
        }
      />
    </div>
  );
}
