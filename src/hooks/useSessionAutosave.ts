'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useIntakeStore } from '@/stores/intake-store';
import { saveSession } from '@/lib/supabase-service';

const SESSION_ID_KEY = 'intake_session_id';
const DEBOUNCE_MS = 2000;

export function useSessionAutosave(): void {
  const store = useIntakeStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable save function that reads the latest store state at call time
  const persistSession = useCallback(
    async (isComplete: boolean) => {
      const {
        sessionId,
        setSessionId,
        bankName,
        generatedReport,
        formData,
        messages,
        currentStep,
        getCompletionPercentage,
      } = useIntakeStore.getState();

      if (!bankName.trim()) return;

      const result = await saveSession({
        id: sessionId ?? undefined,
        bank_name: bankName,
        model_name: generatedReport?.modelName ?? null,
        form_data: formData,
        chat_history: messages,
        wizard_step: currentStep,
        completion_percentage: getCompletionPercentage(),
        report: isComplete ? (generatedReport ?? null) : null,
        status: isComplete ? 'complete' : 'in_progress',
      });

      if (result?.id && result.id !== sessionId) {
        setSessionId(result.id);
        try {
          localStorage.setItem(SESSION_ID_KEY, result.id);
        } catch {
          // localStorage may be unavailable in some environments
        }
      }
    },
    [],
  );

  // On mount: retrieve existing sessionId from localStorage into store
  useEffect(() => {
    try {
      const storedId = localStorage.getItem(SESSION_ID_KEY);
      if (storedId) {
        useIntakeStore.getState().setSessionId(storedId);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Debounced auto-save on relevant state changes
  useEffect(() => {
    const { reportStatus } = store;

    // Immediate save when report is complete
    if (reportStatus === 'complete') {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      void persistSession(true);
      return;
    }

    // Debounced save for in-progress changes
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void persistSession(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.messages, store.formData, store.currentStep, store.generatedReport, store.reportStatus]);
}
