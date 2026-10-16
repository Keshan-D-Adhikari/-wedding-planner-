import { useId, type ComponentPropsWithRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/utils/classNames';
import styles from './SelectField.module.css';

type SelectFieldProps = Omit<ComponentPropsWithRef<'select'>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
  /** Visually hide the label (it is still read by screen readers) */
  hideLabel?: boolean;
};

/**
 * A styled native <select>. Native is the right choice for simple lists:
 * phones show their own picker, and keyboard/screen-reader support is built in.
 */
export function SelectField({
  label,
  hint,
  error,
  hideLabel,
  className,
  children,
  ...rest
}: SelectFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={cx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </label>
      <div className={styles.control}>
        <select
          id={id}
          className={cx(styles.select, error && styles.invalid)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown aria-hidden size={18} className={styles.chevron} />
      </div>
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
