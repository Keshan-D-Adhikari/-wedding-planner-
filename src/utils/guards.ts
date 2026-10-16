/** Type-safe check that a string is one of a fixed list, e.g. a <select> value. */
export function isOneOf<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value);
}
