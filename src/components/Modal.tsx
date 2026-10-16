import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Accessible dialog built on Radix: focus is trapped inside, Esc closes it,
 * focus returns to the trigger, and the page behind can't scroll.
 * Shows as a bottom sheet on phones and a centred card on larger screens.
 */
export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.content}
          // Without a description Radix expects this to be explicitly undefined.
          {...(description ? {} : { 'aria-describedby': undefined })}
        >
          <div className={styles.header}>
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            <Dialog.Close className={styles.close} aria-label="Close">
              <X aria-hidden size={20} />
            </Dialog.Close>
          </div>
          {description && (
            <Dialog.Description className={styles.description}>{description}</Dialog.Description>
          )}
          <div className={styles.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
