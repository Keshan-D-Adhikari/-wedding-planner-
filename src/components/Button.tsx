import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cx } from '@/utils/classNames';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Icon shown before the label */
  icon?: ReactNode;
}

function buttonClass({ variant = 'primary', size = 'md', fullWidth }: StyleProps, extra?: string) {
  return cx(styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, extra);
}

export type ButtonProps = StyleProps & ComponentPropsWithRef<'button'>;

export function Button({
  variant,
  size,
  fullWidth,
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClass({ variant, size, fullWidth }, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

export type LinkButtonProps = StyleProps & LinkProps;

/** Looks like a Button, behaves like a router link (use for navigation). */
export function LinkButton({
  variant,
  size,
  fullWidth,
  icon,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      className={buttonClass(
        { variant, size, fullWidth },
        typeof className === 'string' ? className : undefined,
      )}
      {...rest}
    >
      {icon}
      {children}
    </Link>
  );
}
