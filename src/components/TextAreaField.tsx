import { useId, type ComponentPropsWithRef } from 'react';
import { cx } from '@/utils/classNames';
import styles from './TextField.module.css';

type TextAreaFieldProps = Omit<ComponentPropsWithRef<'textarea'>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
};

/** Multi-line version of TextField; shares its styles. */
export function TextAreaField({
  label,
  hint,
  error,
  className,
  rows = 3,
  ...rest
}: TextAreaFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className={cx(styles.input, styles.textarea, error && styles.invalid)}
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
