'use client';

import { useState } from 'react';
import { useIntakeStore } from '@/stores/intake-store';
import { STEP1_REQUIRED_FIELDS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { StepIntake } from '@/components/wizard/StepIntake';
import { StepUpload } from '@/components/wizard/StepUpload';
import { StepGenerate } from '@/components/wizard/StepGenerate';
import { SettingsPanel } from '@/components/wizard/SettingsPanel';
import { Check, ArrowLeft, ArrowRight, Settings, AlertTriangle } from 'lucide-react';
import type { IntakeFormState } from '@/types';

interface StepDef {
  number: 1 | 2 | 3;
  label: string;
}

const STEPS: StepDef[] = [
  { number: 1, label: 'Model Intake' },
  { number: 2, label: 'Upload Documents' },
  { number: 3, label: 'Generate Report' },
];

export function WizardShell() {
  const currentStep = useIntakeStore((s) => s.currentStep);
  const setStep = useIntakeStore((s) => s.setStep);
  const formData = useIntakeStore((s) => s.formData);
  const getCompletionPercentage = useIntakeStore((s) => s.getCompletionPercentage);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const handleBack = () => {
    setValidationWarning(null);
    if (currentStep > 1) {
      setStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  const handleContinue = () => {
    setValidationWarning(null);

    // Step 1 → 2: check required fields
    if (currentStep === 1) {
      const missing: string[] = [];
      for (const path of STEP1_REQUIRED_FIELDS) {
        const [section, field] = path.split('.');
        const sectionData = formData[section as keyof IntakeFormState] as unknown as Record<string, unknown>;
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

      // Soft warning if completion is very low
      const completion = getCompletionPercentage();
      if (completion < 5) {
        setValidationWarning(
          `Only ${completion}% of fields are filled. You can continue, but consider providing more information first.`,
        );
        // Allow proceeding on second click
        setTimeout(() => setValidationWarning(null), 5000);
        // Actually proceed — the warning is informational
      }
    }

    if (currentStep < 3) {
      setStep((currentStep + 1) as 1 | 2 | 3);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {STEPS.map((step, idx) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;

            return (
              <div key={step.number} className="flex items-center">
                {/* Step indicator */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      isCompleted
                        ? 'bg-[var(--color-crowe-indigo-dark)] text-white'
                        : isActive
                          ? 'bg-[var(--color-crowe-amber-core)] text-[var(--color-crowe-indigo-dark)]'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? 'text-foreground'
                        : isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line between steps */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={`mx-6 h-px w-20 ${
                      step.number < currentStep
                        ? 'bg-[var(--color-crowe-indigo-dark)]'
                        : 'bg-border'
                    }`}
                  />
                )}
              </div>
            );
          })}

          {/* Settings button */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setSettingsOpen(true)}
            className="ml-4 text-muted-foreground hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Validation warning */}
      {validationWarning && (
        <div className="shrink-0 border-b border-[var(--color-crowe-amber-core)]/30 bg-[var(--color-crowe-amber-core)]/5 px-6 py-2">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--color-crowe-amber-dark)]" />
            <p className="text-xs text-foreground">{validationWarning}</p>
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="min-h-0 flex-1">
        {currentStep === 1 && <StepIntake />}
        {currentStep === 2 && <StepUpload />}
        {currentStep === 3 && <StepGenerate />}
      </div>

      {/* Bottom navigation bar */}
      <div className="shrink-0 border-t border-border bg-card px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
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
            disabled={currentStep === 3}
            className="gap-2 bg-[var(--color-crowe-amber-core)] text-[var(--color-crowe-indigo-dark)] hover:bg-[var(--color-crowe-amber-bright)]"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings drawer */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
