import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, Share } from 'lucide-react';
import { Button } from '@/components/Button';
import { SegmentedControl } from '@/components/SegmentedControl';
import { ToggleField } from '@/components/ToggleField';
import { db } from '@/db/db';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { ToastTone } from '@/hooks/useToast';
import type { Wedding } from '@/types';
import { APP_NAME } from '@/utils/constants';
import { downloadFile } from '@/utils/download';
import { BudgetCard } from './cards/BudgetCard';
import { ChecklistCard } from './cards/ChecklistCard';
import { CountdownCard } from './cards/CountdownCard';
import styles from './ExportPage.module.css';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  canShareFiles,
  prepareCardFonts,
  renderCardPng,
} from './renderPng';

type CardType = 'countdown' | 'checklist' | 'budget';

const CARD_OPTIONS: readonly { value: CardType; label: string }[] = [
  { value: 'countdown', label: 'Countdown' },
  { value: 'checklist', label: 'Progress' },
  { value: 'budget', label: 'Budget' },
];

interface PinterestSectionProps {
  wedding: Wedding;
  notify: (text: string, tone?: ToastTone) => void;
}

export function PinterestSection({ wedding, notify }: PinterestSectionProps) {
  const stats = useDashboardStats();
  const items = useLiveQuery(() => db.budgetItems.toArray());
  const [type, setType] = useState<CardType>('countdown');
  const [hideAmounts, setHideAmounts] = useState(true);
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const [shareSupported] = useState(canShareFiles);

  // The card is a real 1000×1500 element; the preview just scales it down to fit.
  const frameRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / CARD_WIDTH);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Start preparing the fonts now, so the first "Download" is quick.
  useEffect(() => {
    void prepareCardFonts();
  }, []);

  const filename = `${wedding.partner1Name}-${wedding.partner2Name}-${type}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  async function makePng(): Promise<Blob | null> {
    if (!cardRef.current) return null;
    try {
      return await renderCardPng(cardRef.current);
    } catch (error) {
      console.error('Card export failed:', error);
      notify("Sorry, we couldn't create the image. Please try again.", 'error');
      return null;
    }
  }

  async function handleDownload() {
    setBusy('download');
    const blob = await makePng();
    if (blob) {
      downloadFile(blob, `${filename}.png`, 'image/png');
      notify('Image saved — pin it from your downloads or photos.');
    }
    setBusy(null);
  }

  async function handleShare() {
    setBusy('share');
    const blob = await makePng();
    if (blob) {
      const file = new File([blob], `${filename}.png`, { type: 'image/png' });
      try {
        await navigator.share({ files: [file], title: `Our wedding · ${APP_NAME}` });
      } catch (error) {
        // Closing the share sheet isn't an error worth showing.
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          notify("Sharing didn't work here — try Download instead.", 'error');
        }
      }
    }
    setBusy(null);
  }

  const ready = stats !== undefined && items !== undefined;

  return (
    <section className={styles.section} aria-labelledby="pinterest-heading">
      <div className={styles.sectionHeader}>
        <h2 id="pinterest-heading" className={styles.sectionTitle}>
          Pinterest cards
        </h2>
        <p className={styles.sectionText}>
          Beautiful 1000 × 1500 images in your colours — perfect for Pinterest, Instagram stories or
          WhatsApp.
        </p>
      </div>

      <div className={styles.cardLayout}>
        <div className={styles.cardControls}>
          <SegmentedControl
            label="Choose a card"
            options={CARD_OPTIONS}
            value={type}
            onChange={setType}
            className={styles.fullWidth}
          />
          {type === 'budget' && (
            <ToggleField
              label="Hide amounts"
              description="Show percentages instead of real numbers."
              checked={hideAmounts}
              onChange={(e) => setHideAmounts(e.target.checked)}
            />
          )}
          <div className={styles.buttons}>
            <Button
              icon={<Download aria-hidden />}
              onClick={() => void handleDownload()}
              disabled={!ready || busy !== null}
            >
              {busy === 'download' ? 'Creating…' : 'Download PNG'}
            </Button>
            {shareSupported && (
              <Button
                variant="secondary"
                icon={<Share aria-hidden />}
                onClick={() => void handleShare()}
                disabled={!ready || busy !== null}
              >
                {busy === 'share' ? 'Creating…' : 'Share'}
              </Button>
            )}
          </div>
          <p className={styles.hint}>
            Tip: change your theme in Settings to change the card colours.
          </p>
        </div>

        <div ref={frameRef} className={styles.preview} style={{ height: CARD_HEIGHT * scale }}>
          <div
            className={styles.previewScaler}
            style={{ transform: `scale(${scale})` }}
            aria-label="Card preview"
            role="img"
          >
            {ready &&
              (type === 'countdown' ? (
                <CountdownCard wedding={wedding} ref={cardRef} />
              ) : type === 'checklist' ? (
                <ChecklistCard wedding={wedding} stats={stats} ref={cardRef} />
              ) : (
                <BudgetCard
                  wedding={wedding}
                  items={items}
                  hideAmounts={hideAmounts}
                  ref={cardRef}
                />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}
