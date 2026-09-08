import { useId, useState, type ChangeEventHandler, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Typography } from '../typography/Typography';
import { classNames } from '../utils';

interface SharedTextInputProps {
  label?: ReactNode;
  multiline?: boolean;
  hint?: boolean;
  controlClassName?: string;
  className?: string;
}

export type TextInputProps = SharedTextInputProps & Omit<
  InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>,
  'children'
> & {
  onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

export function TextInput({
  label,
  multiline = false,
  hint = false,
  controlClassName,
  className,
  id,
  rows = 5,
  ...props
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [hintActive, setHintActive] = useState(hint);
  const dismissHint = () => setHintActive(false);

  return (
    <label className={classNames('edu-control', controlClassName)} htmlFor={inputId}>
      {label !== undefined && <Typography as="span" variant="label" tone="muted" className="edu-label">{label}</Typography>}
      {multiline ? (
        <textarea
          {...props}
          id={inputId}
          rows={rows}
          className={classNames('edu-textarea', hint && hintActive && 'edu-attention-hint', className)}
          data-dl-input-hint={hint && hintActive ? '' : undefined}
          onPointerEnter={dismissHint}
          onFocus={dismissHint}
          onChange={(event) => { dismissHint(); props.onChange?.(event); }}
        />
      ) : (
        <input
          {...props}
          id={inputId}
          className={classNames('edu-input', hint && hintActive && 'edu-attention-hint', className)}
          data-dl-input-hint={hint && hintActive ? '' : undefined}
          onPointerEnter={dismissHint}
          onFocus={dismissHint}
          onChange={(event) => { dismissHint(); props.onChange?.(event); }}
        />
      )}
    </label>
  );
}
