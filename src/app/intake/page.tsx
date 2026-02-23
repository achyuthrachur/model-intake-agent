'use client';

import { WizardShell } from '@/components/wizard/WizardShell';
import { useSessionAutosave } from '@/hooks/useSessionAutosave';

export default function IntakePage() {
  useSessionAutosave();
  return <WizardShell />;
}
