import { Check } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeName } from '@/types';
import { THEMES } from '@/utils/themes';
import styles from './ThemePicker.module.css';

interface ThemePickerProps {
  /** Optional controlled mode (used by onboarding before the wedding is saved). */
  value?: ThemeName;
  onChange?: (theme: ThemeName) => void;
}

/**
 * Built with native radio inputs, so arrow keys, screen readers and forms
 * all work for free; the swatch cards are just styling on top.
 */
export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const { theme, setTheme } = useTheme();
  const selected = value ?? theme;

  function handleChange(next: ThemeName) {
    void setTheme(next);
    onChange?.(next);
  }

  return (
    <fieldset className={styles.picker}>
      <legend className="visually-hidden">Colour theme</legend>
      {THEMES.map((option) => {
        const [primary, soft, accent] = option.swatch;
        return (
          <label key={option.name} className={styles.option}>
            <input
              type="radio"
              name="theme"
              value={option.name}
              checked={selected === option.name}
              onChange={() => handleChange(option.name)}
              className={styles.input}
            />
            <span className={styles.card}>
              <span className={styles.swatch} aria-hidden>
                <span style={{ background: primary }} />
                <span style={{ background: soft }} />
                <span style={{ background: accent }} />
              </span>
              <span className={styles.label}>{option.label}</span>
              <Check aria-hidden size={16} className={styles.check} />
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
