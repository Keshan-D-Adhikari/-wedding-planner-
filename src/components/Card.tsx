import type { ComponentPropsWithRef, ElementType } from 'react';
import { cx } from '@/utils/classNames';
import styles from './Card.module.css';

type CardProps = ComponentPropsWithRef<'div'> & {
  /** Render as a different element, e.g. "section" or "article" */
  as?: ElementType;
  padding?: 'sm' | 'md' | 'lg';
  /** Adds hover lift — use when the whole card is clickable */
  interactive?: boolean;
};

export function Card({
  as: Element = 'div',
  padding = 'md',
  interactive = false,
  className,
  ...rest
}: CardProps) {
  return (
    <Element
      className={cx(styles.card, styles[padding], interactive && styles.interactive, className)}
      {...rest}
    />
  );
}
