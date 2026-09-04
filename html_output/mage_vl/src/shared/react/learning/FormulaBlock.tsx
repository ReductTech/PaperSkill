import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from '../utils';

export interface FormulaBlockProps extends HTMLAttributes<HTMLDivElement> {
  formula?: ReactNode;
  fraction?: { numerator: ReactNode; denominator: ReactNode; prefix?: ReactNode };
  ariaLabel?: string;
}

export interface FormulaTermProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title'> {
  tooltip: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
}

/** A focusable variable/operator that exposes the formula explanation on hover or focus. */
export function FormulaTerm({ tooltip, children, ariaLabel, className, ...props }: FormulaTermProps) {
  const tooltipText = typeof tooltip === 'string' ? tooltip : String(tooltip ?? '');
  return (
    <span
      {...props}
      className={classNames('edu-formula-term', className)}
      tabIndex={props.tabIndex ?? 0}
      data-tooltip={tooltipText}
      aria-label={ariaLabel ?? tooltipText}
    >
      {children}
    </span>
  );
}

export function FormulaBlock({ formula, fraction, ariaLabel, className, children, ...props }: FormulaBlockProps) {
  return (
    <div className={classNames('edu-formula-block', className)} {...props}>
      <div className={classNames('edu-formula', fraction && 'edu-formula--fraction')} aria-label={ariaLabel}>
        {fraction ? (
          <>
            {fraction.prefix !== undefined && <span className="edu-formula-prefix">{fraction.prefix}</span>}
            <span className="edu-fraction">
              <span className="edu-fraction-numerator">{fraction.numerator}</span>
              <span className="edu-fraction-denominator">{fraction.denominator}</span>
            </span>
          </>
        ) : formula ?? children}
      </div>
    </div>
  );
}
