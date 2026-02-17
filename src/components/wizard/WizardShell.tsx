'use client';

import { useEffect, useRef, useState } from 'react';
import anime from 'animejs/lib/anime.es.js';

import { useIntakeStore } from '@/stores/intake-store';
import { STEP1_REQUIRED_FIELDS } from '@/lib/constants';
import { animateSlideIn, prefersReducedMotion, useAnimeStagger } from '@/lib/anime-motion';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { StepIntake } from '@/components/wizard/StepIntake';
import { StepUpload } from '@/components/wizard/StepUpload';
import { StepGenerate } from '@/components/wizard/StepGenerate';
import { SettingsPanel } from '@/components/wizard/SettingsPanel';
import { Check, ArrowLeft, ArrowRight, Settings, AlertTriangle } from 'lucide-react';
import type { IntakeFormState } from '@/types';

interface StepDef {
  number: 1 | 2 | 3;
  label: string;
  subtitle: string;
}

const STEPS: StepDef[] = [
  { number: 1, label: 'Model Intake', subtitle: 'Interview + form capture' },
  { number: 2, label: 'Upload Documents', subtitle: 'Coverage and evidence map' },
  { number: 3, label: 'Generate Report', subtitle: 'Structured narrative output' },
];

export function WizardShell() {
  const currentStep = useIntakeStore((s) => s.currentStep);
  const setStep = useIntakeStore((s) => s.setStep);
  const formData = useIntakeStore((s) => s.formData);
  const getCompletionPercentage = useIntakeStore((s) => s.getCompletionPercentage);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const stepperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const warningRef = useRef<HTMLDivElement>(null);

  useAnimeStagger(stepperRef, [currentStep], '[data-step-node]', {
    delay: 55,
    duration: 420,
    y: 10,
  });

  useEffect(() => {
    animateSlideIn(contentRef.current, 'up');
  }, [currentStep]);

  useEffect(() => {
    if (!validationWarning || !warningRef.current || prefersReducedMotion()) return;
    anime.remove(warningRef.current);
    anime({
      targets: warningRef.current,
      opacity: [0, 1],
      translateY: [-10, 0],
      duration: 340,
      easing: 'easeOutExpo',
    });
  }, [validationWarning]);

  const handleBack = () => {
    setValidationWarning(null);
    if (currentStep > 1) {
      setStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  const handleContinue = () => {
    setValidationWarning(null);

    if (currentStep === 1) {
      const missing: string[] = [];
      for (const path of STEP1_REQUIRED_FIELDS) {
        const [section, field] = path.split('.');
        const sectionData = formData[section as keyof IntakeFormState] as unknown as Record<
          string,
          unknown
        >;
        const value = sectionData?.[field];
        const filled = Array.isArray(value)
          ? value.length > 0
          : typeof value === 'string' && value.trim() !== '';
        if (!filled) {
          missing.push(field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()));
        }
      }

      if (missing.length > 0) {
        setValidationWarning(
          `Please fill required fields before continuing: ${missing.join(', ')}`,
        );
        return;
      }

      const completion = getCompletionPercentage();
      if (completion < 5) {
        setValidationWarning(
          `Only ${completion}% of fields are filled. You can continue, but consider providing more information first.`,
        );
        setTimeout(() => setValidationWarning(null), 5000);
      }
    }

    if (currentStep < 3) {
      setStep((currentStep + 1) as 1 | 2 | 3);
    }
  };

  const isFinalStep = currentStep === 3;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-border/70" />

      <header className="shrink-0 border-b border-border/70 bg-[var(--surface-soft)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-4 px-6 py-4">
          <div ref={stepperRef} className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
            {STEPS.map((step, idx) => {
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;

              return (
                <div
                  key={step.number}
                  data-step-node
                  className="flex min-w-0 items-center gap-2.5 rounded-xl px-2 py-1"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-[transform,background-color,color,border-color] duration-300 ${
                      isCompleted
                        ? 'border-[var(--color-crowe-indigo-dark)] bg-[var(--color-crowe-indigo-dark)] text-white'
                        : isActive
                          ? 'border-[var(--color-crowe-amber-core)] bg-[var(--color-crowe-amber-core)] text-[var(--color-crowe-indigo-dark)]'
                          : 'border-border bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : step.number}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm font-semibold ${
                        isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="hidden truncate text-[11px] text-muted-foreground xl:block">
                      {step.subtitle}
                    </p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`ml-1 hidden h-px w-8 lg:block ${
                        step.number < currentStep
                          ? 'bg-[var(--color-crowe-indigo-dark)]'
                          : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSettingsOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {validationWarning && (
        <div
          ref={warningRef}
          className="shrink-0 border-b border-[var(--color-crowe-amber-core)]/25 bg-[var(--color-crowe-amber-core)]/10 px-6 py-2"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--color-crowe-amber-dark)]" />
            <p className="text-xs text-foreground">{validationWarning}</p>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1">
        <div ref={contentRef} key={currentStep} className="h-full">
          {currentStep === 1 && <StepIntake />}
          {currentStep === 2 && <StepUpload />}
          {currentStep === 3 && <StepGenerate />}
        </div>
      </div>

      <footer className="shrink-0 border-t border-border/70 bg-[var(--surface-soft)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleContinue}
            disabled={isFinalStep}
            className="gap-2 bg-[var(--color-crowe-amber-core)] text-[var(--color-crowe-indigo-dark)] hover:bg-[var(--color-crowe-amber-bright)]"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
