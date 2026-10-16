/**
 * Categorical chart colours, in a FIXED order.
 *
 * Chosen to feel soft and wedding-like while staying readable, and checked with a
 * colour-vision validator: every neighbouring pair stays distinguishable for
 * red-green and blue-yellow colour blindness. Don't reorder or add colours without
 * re-validating — the order is part of what makes it accessible.
 *
 * Gold is slightly under 3:1 contrast on white, so charts using it always show
 * labelled values next to the chart (the legend list), never colour alone.
 */
export const CATEGORY_COLORS = [
  '#c2457a', // rose
  '#2f6fbf', // blue
  '#d0603a', // terracotta
  '#1f9a73', // teal
  '#6d4fc4', // violet
  '#c98a00', // gold
] as const;

/** Neutral for the folded "Other" slice — never a categorical hue. */
export const OTHER_COLOR = '#a39d98';

/** Max named slices before the rest fold into "Other". */
export const MAX_SLICES = CATEGORY_COLORS.length - 1;
