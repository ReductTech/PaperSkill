import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface ExplainPanelButtonProps {
  children: ReactNode;
  label?: string;
  closeDelay?: number;
}

export function ExplainPanelButton({
  children,
  label = '查看说明',
  closeDelay = 140,
}: ExplainPanelButtonProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (closeTimer.current !== undefined) window.clearTimeout(closeTimer.current);
  }, []);

  const showPanel = () => {
    if (closeTimer.current !== undefined) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hidePanel = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), closeDelay);
  };

  return (
    <span className="explain-panel-wrap" onMouseLeave={hidePanel} onMouseEnter={showPanel}>
      <button
        className="explain-panel-trigger"
        type="button"
        aria-label={label}
        aria-expanded={open}
        onMouseEnter={showPanel}
        onFocus={showPanel}
        onBlur={hidePanel}
        onClick={() => setOpen((value) => !value)}
      >
        ?
      </button>
      <div className="explain-panel" role="dialog" hidden={!open} onMouseEnter={showPanel}>
        {children}
      </div>
    </span>
  );
}
