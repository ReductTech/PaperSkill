import type {
  ComponentPropsWithRef,
  ElementType,
  ReactNode,
} from 'react';
import { classNames } from '../utils';

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'subtitle'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'button'
  | 'numeric'
  | 'code'
  | 'inherit';

export type TypographyTone =
  | 'main'
  | 'muted'
  | 'light'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inherit';

export type TypographyAlign = 'start' | 'center' | 'end';
export type TypographyWrap = 'normal' | 'nowrap' | 'truncate' | 'balance';

type TypographyOwnProps<T extends ElementType> = {
  as?: T;
  variant?: TypographyVariant;
  tone?: TypographyTone;
  align?: TypographyAlign;
  wrap?: TypographyWrap;
  className?: string;
  children?: ReactNode;
};

export type TypographyProps<T extends ElementType = 'span'> =
  TypographyOwnProps<T>
  & Omit<ComponentPropsWithRef<T>, keyof TypographyOwnProps<T> | 'color'>;

export const typographyVariantMapping: Record<TypographyVariant, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  subtitle: 'p',
  body: 'p',
  bodySmall: 'p',
  label: 'span',
  caption: 'span',
  button: 'span',
  numeric: 'span',
  code: 'code',
  inherit: 'span',
};

export function Typography<T extends ElementType = 'span'>({
  as,
  variant = 'body',
  tone = 'main',
  align,
  wrap,
  className,
  children,
  ...props
}: TypographyProps<T>) {
  const Component = (as ?? typographyVariantMapping[variant]) as ElementType;

  return (
    <Component
      className={classNames(
        'ui-typography',
        `ui-typography--${variant}`,
        `ui-typography--tone-${tone}`,
        align && `ui-typography--align-${align}`,
        wrap && `ui-typography--wrap-${wrap}`,
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
