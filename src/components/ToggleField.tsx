import { useId, type ComponentPropsWithRef } from 'react';
import { cx } from '@/utils/classNames';
import styles from './ToggleField.module.css';

type ToggleFieldProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'id'> & {
  label: string;
  description?: string;
};

/** An on/off switch. A real checkbox with role="switch", so it's announced correctly. */
export function ToggleField({ label, description, className, ...rest }: ToggleFieldProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className={cx(styles.field, className)}>
      <span className={styles.text}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {description && (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        )}
      </span>
      <span className={styles.control}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          className={styles.input}
          aria-describedby={descriptionId}
          {...rest}
        />
        <span className={styles.track} aria-hidden>
          <span className={styles.thumb} />
        </span>
      </span>
    </div>
  );
}
