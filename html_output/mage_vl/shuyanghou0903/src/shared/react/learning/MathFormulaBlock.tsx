import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { classNames } from '../utils';

let mathliveRequest: Promise<void> | null = null;

type MathFieldElement = HTMLElement & {
  value: string;
  readOnly: boolean;
  virtualKeyboardMode: string;
};

export function preloadMathlive(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (customElements.get('math-field')) return Promise.resolve();
  mathliveRequest ??= import('../../vendor/mathlive/mathlive.min.mjs').then(() => undefined);
  return mathliveRequest;
}

export interface MathFormulaTermProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'title'> {
  latex: string;
  tooltip: ReactNode;
  ariaLabel?: string;
  tone?: 'default' | 'warm';
}

export interface MathFormulaBlockProps extends HTMLAttributes<HTMLDivElement> {
  ariaLabel?: string;
  children: ReactNode;
}

export function MathFormulaTerm({ latex, tooltip, ariaLabel, tone = 'default', className, ...props }: MathFormulaTermProps) {
  const tooltipText = typeof tooltip === 'string' ? tooltip : String(tooltip ?? '');
  const fieldRef = useRef<MathFieldElement | null>(null);

  useEffect(() => {
    let active = true;
    preloadMathlive()
      .then(() => {
        if (!active || !fieldRef.current) return;
        fieldRef.current.value = latex;
        fieldRef.current.readOnly = true;
        fieldRef.current.virtualKeyboardMode = 'manual';
      })
      .catch(() => {
        document.documentElement.classList.add('dl-mathlive-unavailable');
      });
    return () => { active = false; };
  }, [latex]);

  return (
    <span
      {...props}
      className={classNames('math-formula-term', tone === 'warm' && 'math-formula-term--warm', className)}
      tabIndex={props.tabIndex ?? 0}
      data-tooltip={tooltipText}
      aria-label={ariaLabel ?? tooltipText}
    >
      <math-field ref={fieldRef} read-only="true" virtual-keyboard-mode="manual" data-latex={latex} aria-hidden="true">
        {latex}
      </math-field>
    </span>
  );
}

export function MathFormulaStatic({ latex, className, ...props }: { latex: string; className?: string } & HTMLAttributes<HTMLSpanElement>) {
  const fieldRef = useRef<MathFieldElement | null>(null);

  useEffect(() => {
    let active = true;
    preloadMathlive()
      .then(() => {
        if (!active || !fieldRef.current) return;
        fieldRef.current.value = latex;
        fieldRef.current.readOnly = true;
        fieldRef.current.virtualKeyboardMode = 'manual';
      })
      .catch(() => {
        document.documentElement.classList.add('dl-mathlive-unavailable');
      });
    return () => { active = false; };
  }, [latex]);

  return (
    <span {...props} className={classNames('math-formula-static', className)}>
      <math-field ref={fieldRef} read-only="true" virtual-keyboard-mode="manual" data-latex={latex} aria-hidden="true">
        {latex}
      </math-field>
    </span>
  );
}

export function MathFormulaBlock({ ariaLabel, children, className, ...props }: MathFormulaBlockProps) {
  return (
    <div className={classNames('edu-formula-block', 'math-formula-block', className)} {...props}>
      <div className="math-formula" aria-label={ariaLabel}>{children}</div>
    </div>
  );
}
