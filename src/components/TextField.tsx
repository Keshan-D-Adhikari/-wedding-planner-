import { useId, type ComponentPropsWithRef } from 'react';
import { cx } from '@/utils/classNames';
import styles from './TextField.module.css';

type TextFieldProps = Omit<ComponentPropsWithRef<'input'>, 'id'> & {
  label: string;
  /** Helper text shown under the input */
  hint?: string;
  /** Error message — also marks the input invalid for screen readers */
  error?: string;
  /** Visually hide the label (it is still read by screen readers) */
  hideLabel?: boolean;
};

export function TextField({ label, hint, error, hideLabel, className, ...rest }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={cx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </label>
      <input
        id={id}
        className={cx(styles.input, error && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
