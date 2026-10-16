/** Joins class names, skipping falsy values: cx(styles.a, isActive && styles.b) */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
