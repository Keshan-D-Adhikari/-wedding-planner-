import { useMemo, useState } from 'react';
import { Check, MessageCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { Modal } from '@/components/Modal';
import { TextAreaField } from '@/components/TextAreaField';
import { TextField } from '@/components/TextField';
import { ToggleField } from '@/components/ToggleField';
import { markInvitesSent } from '@/db/guests';
import type { Guest, Wedding } from '@/types';
import { toWhatsAppNumber, defaultCountryCode, whatsAppLink } from '@/utils/whatsapp';
import styles from './WhatsAppInviteDialog.module.css';
import {
  DEFAULT_TEMPLATE,
  fillTemplate,
  loadCountryCode,
  loadTemplate,
  MAX_TEMPLATE_LENGTH,
  PLACEHOLDERS,
  saveCountryCode,
  saveTemplate,
} from './inviteMessage';

interface WhatsAppInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wedding: Wedding;
  guests: Guest[];
}

/**
 * Sends each guest a personal WhatsApp invite. Nothing is sent automatically: every
 * button opens WhatsApp with the message filled in, and you press Send yourself.
 */
export function WhatsAppInviteDialog({
  open,
  onOpenChange,
  wedding,
  guests,
}: WhatsAppInviteDialogProps) {
  const [template, setTemplate] = useState(loadTemplate);
  const [countryCode, setCountryCode] = useState(() =>
    loadCountryCode(defaultCountryCode(wedding.currency)),
  );
  const [hideSent, setHideSent] = useState(true);

  // Guests who said no don't need an invitation.
  const invitable = useMemo(
    () => guests.filter((g) => g.rsvp !== 'declined').sort((a, b) => a.name.localeCompare(b.name)),
    [guests],
  );
  const sentCount = invitable.filter((g) => g.inviteSentAt).length;
  const visible = hideSent ? invitable.filter((g) => !g.inviteSentAt) : invitable;
  const activeTemplate = template.trim() ? template : DEFAULT_TEMPLATE;

  function changeTemplate(value: string) {
    setTemplate(value);
    saveTemplate(value.trim() ? value : DEFAULT_TEMPLATE);
  }

  function changeCountryCode(value: string) {
    const cleaned = value.replace(/[^\d+]/g, '').replace(/^\+/, '');
    setCountryCode(cleaned);
    saveCountryCode(cleaned);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Invite on WhatsApp"
      description="Each button opens WhatsApp with a personal message ready — you just press Send."
    >
      <div className={form.form}>
        <TextAreaField
          label="Your message"
          rows={7}
          maxLength={MAX_TEMPLATE_LENGTH}
          value={template}
          onChange={(e) => changeTemplate(e.target.value)}
          hint={`You can use ${PLACEHOLDERS.map((p) => p.token).join(', ')}. Guests are asked to reply YES or NO so their answers are easy to read back in.`}
        />
        <div className={styles.messageActions}>
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw aria-hidden />}
            onClick={() => changeTemplate(DEFAULT_TEMPLATE)}
            disabled={activeTemplate === DEFAULT_TEMPLATE}
          >
            Use the standard message
          </Button>
        </div>

        <TextField
          label="Country code for phone numbers"
          inputMode="numeric"
          placeholder="e.g. 94"
          value={countryCode}
          maxLength={4}
          onChange={(e) => changeCountryCode(e.target.value)}
          hint="Used for numbers saved like 077 123 4567. Numbers starting with + are used as they are."
        />

        <div className={styles.progress} role="status">
          <strong>
            {sentCount} of {invitable.length}
          </strong>{' '}
          invited
        </div>
        <ToggleField
          label="Hide guests already invited"
          checked={hideSent}
          onChange={(e) => setHideSent(e.target.checked)}
        />

        {visible.length === 0 ? (
          <p className={form.note}>
            {invitable.length === 0
              ? 'Add some guests first, then come back to invite them.'
              : 'Everyone has been invited. 🎉'}
          </p>
        ) : (
          <ul role="list" className={styles.list}>
            {visible.map((guest) => {
              const number = guest.phone ? toWhatsAppNumber(guest.phone, countryCode) : null;
              const href = whatsAppLink(number, fillTemplate(activeTemplate, guest.name, wedding));
              const sent = Boolean(guest.inviteSentAt);
              return (
                <li key={guest.id} className={styles.row}>
                  <div className={styles.who}>
                    <span className={styles.name}>{guest.name}</span>
                    <span className={styles.phone}>
                      {guest.phone && !number
                        ? 'Check the phone number — add a country code above'
                        : number
                          ? `+${number}`
                          : 'No phone saved — you’ll choose the contact in WhatsApp'}
                    </span>
                  </div>
                  <a
                    className={styles.send}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => void markInvitesSent([guest.id])}
                    aria-label={`${sent ? 'Send again to' : 'Send invite to'} ${guest.name} on WhatsApp`}
                  >
                    {sent ? (
                      <Check aria-hidden size={16} />
                    ) : (
                      <MessageCircle aria-hidden size={16} />
                    )}
                    {sent ? 'Sent · again' : 'Send'}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
