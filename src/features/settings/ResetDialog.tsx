import { useState } from 'react';
import { CloudDownload, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { Modal } from '@/components/Modal';
import { TextField } from '@/components/TextField';
import { resetAllData } from '@/db/wedding';
import { downloadBackup } from '@/features/export/backupActions';

const CONFIRM_WORD = 'DELETE';

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Deleting everything can't be undone, so it needs two deliberate steps:
 * typing a word, then pressing a red button. A backup is one tap away.
 */
export function ResetDialog({ open, onOpenChange }: ResetDialogProps) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD;

  async function handleReset() {
    if (!confirmed) return;
    setBusy(true);
    try {
      await resetAllData();
      onOpenChange(false);
      void navigate('/welcome', { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Delete all your plans?"
      description="Your checklist, budget, guests, seating chart and wedding details will be permanently deleted from this device. This can't be undone."
    >
      <div className={form.form}>
        <Button
          variant="secondary"
          icon={<CloudDownload aria-hidden />}
          onClick={() => void downloadBackup()}
        >
          Download a backup first
        </Button>
        <TextField
          label={`Type ${CONFIRM_WORD} to confirm`}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
        <div className={form.actions}>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Keep my plans
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 aria-hidden />}
            disabled={!confirmed || busy}
            onClick={() => void handleReset()}
          >
            Delete everything
          </Button>
        </div>
      </div>
    </Modal>
  );
}
