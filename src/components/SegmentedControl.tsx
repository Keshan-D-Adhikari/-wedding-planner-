import { useId } from 'react';
import { cx } from '@/utils/classNames';
import styles from './SegmentedControl.module.css';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Show the label above the pills (in forms). Otherwise it's for screen readers only. */
  showLabel?: boolean;
  className?: string;
}

/** A pill-shaped single choice (e.g. All / To do / Done) built on native radios. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  showLabel = false,
  className,
}: SegmentedControlProps<T>) {
  const name = useId();

  return (
    <fieldset className={cx(styles.root, className)}>
      <legend className={showLabel ? styles.legend : 'visually-hidden'}>{label}</legend>
      <div className={styles.group}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={styles.input}
            />
            <span className={styles.pill}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
