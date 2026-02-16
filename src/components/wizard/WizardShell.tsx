'use client';

import { useIntakeStore } from '@/stores/intake-store';
import { Button } from '@/components/ui/button';
import { StepIntake } from '@/components/wizard/StepIntake';
import { StepUpload } from '@/components/wizard/StepUpload';
import { StepGenerate } from '@/components/wizard/StepGenerate';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';

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

  const handleBack = () => {
    if (currentStep > 1) {
      setStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  const handleContinue = () => {
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
        </div>
      </div>

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
    </div>
  );
}
