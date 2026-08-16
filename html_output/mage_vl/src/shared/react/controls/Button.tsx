import { useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode, type FocusEvent, type MouseEvent, type PointerEvent } from 'react';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

export type ButtonVariant = 'default' | 'primary' | 'warn' | 'danger' | 'explain';

interface SharedButtonProps {
  variant?: ButtonVariant;
  active?: boolean;
  loading?: boolean;
  hint?: boolean;
  explain?: string;
  children?: ReactNode;
  className?: string;
}

export type ButtonProps = SharedButtonProps & (
  | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
);

export function Button(props: ButtonProps) {
  const {
    variant = 'default',
    active = false,
    loading = false,
    hint = false,
    explain,
    className,
    children,
  } = props;
  const [hintActive, setHintActive] = useState(hint);
  const [explainOpen, setExplainOpen] = useState(false);
  const dismissHint = () => setHintActive(false);
  const explainHandlers = explain ? {
    onMouseEnter: () => setExplainOpen(true),
    onMouseLeave: () => setExplainOpen(false),
    onFocus: () => setExplainOpen(true),
    onBlur: () => setExplainOpen(false),
  } : {};
  const classes = classNames(
    'edu-btn',
    variant !== 'default' && `edu-btn--${variant}`,
    active && 'is-active',
    loading && 'is-loading',
    hint && hintActive && 'edu-attention-hint',
    className,
  );

  if ('href' in props && props.href !== undefined) {
    const { href, variant: _variant, active: _active, loading: _loading, hint: _hint, explain: _explain, onPointerEnter, onFocus, onClick, ...anchorProps } = props;
    const handlePointerEnter = (event: PointerEvent<HTMLAnchorElement>) => { dismissHint(); onPointerEnter?.(event); };
    const handleFocus = (event: FocusEvent<HTMLAnchorElement>) => { dismissHint(); onFocus?.(event); };
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => { dismissHint(); onClick?.(event); };
    const link = (
      <a {...anchorProps} {...explainHandlers} className={classes} href={href} data-dl-button-hint={hint && hintActive ? '' : undefined} data-dl-explain={explain} onPointerEnter={handlePointerEnter} onFocus={handleFocus} onClick={handleClick}>
        <Typography as="span" variant="inherit" tone="inherit">{children}</Typography>
      </a>
    );
    return explain ? <span className="shared-button-wrap">{link}<Typography as="span" variant="caption" tone="inherit" className="dl-explain-tooltip" role="tooltip" hidden={!explainOpen}>{explain}</Typography></span> : link;
  }

  const { variant: _variant, active: _active, loading: _loading, hint: _hint, explain: _explain, onPointerEnter, onFocus, onClick, ...buttonProps } = props;
  const handlePointerEnter = (event: PointerEvent<HTMLButtonElement>) => { dismissHint(); onPointerEnter?.(event); };
  const handleFocus = (event: FocusEvent<HTMLButtonElement>) => { dismissHint(); onFocus?.(event); };
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => { dismissHint(); onClick?.(event); };
  const button = (
    <button {...buttonProps} {...explainHandlers} className={classes} type={buttonProps.type ?? 'button'} disabled={loading || buttonProps.disabled} aria-busy={loading || buttonProps['aria-busy']} data-dl-button-hint={hint && hintActive ? '' : undefined} data-dl-explain={explain} onPointerEnter={handlePointerEnter} onFocus={handleFocus} onClick={handleClick}>
      <Typography as="span" variant="inherit" tone="inherit">{children}</Typography>
    </button>
  );
  return explain ? <span className="shared-button-wrap">{button}<Typography as="span" variant="caption" tone="inherit" className="dl-explain-tooltip" role="tooltip" hidden={!explainOpen}>{explain}</Typography></span> : button;
}
