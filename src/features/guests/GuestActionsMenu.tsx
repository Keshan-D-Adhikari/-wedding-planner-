import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Download, Ellipsis, FileSpreadsheet, ListPlus, Upload } from 'lucide-react';
import { Button } from '@/components/Button';
import styles from './GuestActionsMenu.module.css';

interface GuestActionsMenuProps {
  canExport: boolean;
  onBulkAdd: () => void;
  onImport: () => void;
  onExport: () => void;
  onTemplate: () => void;
}

/**
 * Secondary guest actions. `modal={false}` matters: a modal menu that opens a
 * dialog can leave the page unclickable in Radix, so the menu stays non-modal.
 */
export function GuestActionsMenu({
  canExport,
  onBulkAdd,
  onImport,
  onExport,
  onTemplate,
}: GuestActionsMenuProps) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary" icon={<Ellipsis aria-hidden />}>
          More
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.content} align="end" sideOffset={6}>
          <DropdownMenu.Item className={styles.item} onSelect={onBulkAdd}>
            <ListPlus aria-hidden size={18} />
            Add many at once
          </DropdownMenu.Item>
          <DropdownMenu.Item className={styles.item} onSelect={onImport}>
            <Upload aria-hidden size={18} />
            Import from CSV
          </DropdownMenu.Item>
          <DropdownMenu.Item className={styles.item} onSelect={onExport} disabled={!canExport}>
            <Download aria-hidden size={18} />
            Export to CSV
          </DropdownMenu.Item>
          <DropdownMenu.Separator className={styles.separator} />
          <DropdownMenu.Item className={styles.item} onSelect={onTemplate}>
            <FileSpreadsheet aria-hidden size={18} />
            Download CSV template
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
