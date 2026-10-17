import { useEffect, useRef, useState, type ComponentType, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router';
import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { PrivacyBadges } from '@/components/PrivacyBadges';
import { PageLoader } from '@/components/PageLoader';
import { createWedding } from '@/db/wedding';
import { useTheme } from '@/hooks/useTheme';
import { useWedding } from '@/hooks/useWedding';
import { APP_NAME } from '@/utils/constants';
import { guessCurrency } from '@/utils/currency';
import styles from './OnboardingPage.module.css';
import { StepDate } from './StepDate';
import { ImportPartnerPlan } from './ImportPartnerPlan';
import { StepIndicator } from './StepIndicator';
import { StepNames } from './StepNames';
import { StepStyle } from './StepStyle';
import type { DraftErrors, StepProps, WeddingDraft } from './types';
import { draftToWedding, hasErrors, STEP_COUNT, validateStep } from './validation';

const STEPS: { title: string; subtitle: string; Component: ComponentType<StepProps> }[] = [
  {
    title: "Let's start with you two",
    subtitle: 'Your names appear on your dashboard and your shareable cards.',
    Component: StepNames,
  },
  {
    title: 'When is the big day?',
    subtitle: 'We use it to build a checklist timed perfectly for your wedding.',
    Component: StepDate,
  },
  {
    title: 'Budget & style',
    subtitle: 'Set a budget to track spending, then pick colours you love.',
    Component: StepStyle,
  },
];

export default function OnboardingPage() {
  const { wedding, isLoading } = useWedding();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<WeddingDraft>(() => ({
    partner1Name: '',
    partner2Name: '',
    weddingDate: '',
    venue: '',
    totalBudget: '',
    currency: guessCurrency(),
    theme,
  }));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Move keyboard/screen-reader focus to the new heading when the step changes.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasMounted = useRef(false);
  useEffect(() => {
    if (hasMounted.current) headingRef.current?.focus();
    hasMounted.current = true;
  }, [step]);

  useEffect(() => {
    document.title = `Welcome · ${APP_NAME}`;
  }, []);

  if (isLoading) return <PageLoader fullScreen />;
  // Already set up (or just finished) → go to the dashboard.
  if (wedding) return <Navigate to="/" replace />;

  const current = STEPS[step] ?? STEPS[0]!;
  const isLastStep = step === STEP_COUNT - 1;

  function handleChange(patch: Partial<WeddingDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    // Clear errors for the fields being edited.
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch) as (keyof WeddingDraft)[]) delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const stepErrors = validateStep(step, draft);
    setErrors(stepErrors);
    if (hasErrors(stepErrors)) return;

    if (!isLastStep) {
      setStep((s) => s + 1);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await createWedding(draftToWedding(draft));
      void navigate('/', { replace: true });
    } catch (error) {
      console.error('Could not save wedding:', error);
      setSaveError('Sorry, we could not save your plans. Please try again.');
      setIsSaving(false);
    }
  }

  const { Component } = current;

  return (
    <main className={styles.page}>
      <div className={styles.brand}>
        <BrandMark />
      </div>

      <form className={styles.card} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <StepIndicator current={step} total={STEP_COUNT} />

        <header key={step} className={styles.header}>
          <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
            {current.title}
          </h1>
          <p className={styles.subtitle}>{current.subtitle}</p>
        </header>

        <div key={`step-${step}`} className={styles.step}>
          <Component draft={draft} errors={errors} onChange={handleChange} />
        </div>

        {saveError && (
          <p className={styles.saveError} role="alert">
            {saveError}
          </p>
        )}

        <div className={styles.actions}>
          {step > 0 ? (
            <Button
              variant="ghost"
              icon={<ArrowLeft aria-hidden />}
              onClick={() => setStep((s) => s - 1)}
              disabled={isSaving}
            >
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" size="lg" disabled={isSaving}>
            {isLastStep ? (
              <>
                <Sparkles aria-hidden />
                {isSaving ? 'Creating your planner…' : 'Create my planner'}
              </>
            ) : (
              <>
                Continue
                <ArrowRight aria-hidden />
              </>
            )}
          </Button>
        </div>
      </form>

      <ImportPartnerPlan onError={setSaveError} />

      <PrivacyBadges />
    </main>
  );
}
