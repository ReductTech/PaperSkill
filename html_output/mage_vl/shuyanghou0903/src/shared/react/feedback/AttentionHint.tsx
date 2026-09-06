import { useState, type HTMLAttributes, type ReactNode, type FocusEvent, type MouseEvent, type PointerEvent } from 'react';
import { classNames } from '../utils';

export interface AttentionHintProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** 默认在第一次有效交互后自动移除提示。 */
  dismissOnInteract?: boolean;
}

/** 为任意 HTML 内容添加首次交互提示；视觉样式统一使用 edu-attention-hint。 */
export function AttentionHint({
  children,
  dismissOnInteract = true,
  className,
  onPointerEnter,
  onFocus,
  onClick,
  ...props
}: AttentionHintProps) {
  const [active, setActive] = useState(true);
  const dismiss = () => { if (dismissOnInteract) setActive(false); };
  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => { dismiss(); onPointerEnter?.(event); };
  const handleFocus = (event: FocusEvent<HTMLDivElement>) => { dismiss(); onFocus?.(event); };
  const handleClick = (event: MouseEvent<HTMLDivElement>) => { dismiss(); onClick?.(event); };

  return <div {...props} className={classNames(active && 'edu-attention-hint', className)} onPointerEnter={handlePointerEnter} onFocus={handleFocus} onClick={handleClick}>{children}</div>;
}
