'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import anime from 'animejs/lib/anime.es.js';

import { useIntakeStore } from '@/stores/intake-store';
import { prefersReducedMotion } from '@/lib/anime-motion';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, FileText, Shield, ArrowRight, Sparkles } from 'lucide-react';
import type { AIModel } from '@/types';

export default function LandingPage() {
  const router = useRouter();
  const store = useIntakeStore();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const root = heroRef.current;
    if (!root) return;

    const panels = root.querySelectorAll('[data-hero-panel]');
    const chips = root.querySelectorAll('[data-hero-chip]');
    const stats = root.querySelectorAll('[data-hero-stat]');
    const cta = root.querySelectorAll('[data-hero-cta]');

    anime.remove([panels, chips, stats, cta]);
    anime
      .timeline({
        easing: 'cubicBezier(0.22, 1, 0.36, 1)',
        duration: 620,
      })
      .add({
        targets: panels,
        opacity: [0, 1],
        translateY: [24, 0],
        delay: anime.stagger(120),
      })
      .add(
        {
          targets: chips,
          opacity: [0, 1],
          translateY: [12, 0],
          delay: anime.stagger(70),
          duration: 460,
        },
        '-=360',
      )
      .add(
        {
          targets: stats,
          opacity: [0, 1],
          translateY: [14, 0],
          delay: anime.stagger(85),
          duration: 500,
        },
        '-=300',
      )
      .add(
        {
          targets: cta,
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 420,
        },
        '-=260',
      );
  }, []);

  const handleStart = () => {
    if (!store.bankName.trim()) return;
    router.push('/intake');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-24 h-40 w-40 rounded-full border border-[var(--color-crowe-indigo-bright)]/35 bg-[var(--color-crowe-indigo-bright)]/8 blur-2xl" />
        <div className="absolute -right-20 bottom-20 h-52 w-52 rounded-full border border-[var(--color-crowe-amber-core)]/35 bg-[var(--color-crowe-amber-core)]/12 blur-2xl" />
        <div className="absolute inset-x-6 top-10 h-px bg-border/55" />
        <div className="absolute inset-y-14 left-10 w-px bg-border/45" />
      </div>

      <div className="absolute right-6 top-6 z-40">
        <ThemeToggle />
      </div>

      <main
        ref={heroRef}
        className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 lg:grid-cols-[1.08fr_0.92fr]"
      >
        <section data-hero-panel className="flex flex-col gap-8">
          <div className="space-y-5">
            <Badge
              data-hero-chip
              className="w-fit border-[var(--color-crowe-indigo-bright)]/25 bg-[var(--color-crowe-indigo-bright)]/10 px-3 py-1 text-[var(--color-crowe-indigo-bright)] dark:text-[var(--color-crowe-cyan-bright)]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              MRM Intake Assistant
            </Badge>

            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              Build model documentation with guided intelligence and polished controls.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Run structured intake interviews, map vendor evidence to required template
              sections, and generate regulator-ready drafts in one branded workflow.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Badge
              data-hero-chip
              variant="outline"
              className="gap-1.5 border-[var(--color-crowe-indigo-bright)]/30 bg-[var(--color-crowe-indigo-bright)]/8 px-3 py-1 text-[var(--color-crowe-indigo-core)] dark:text-[var(--color-crowe-cyan-bright)]"
            >
              <Brain className="h-3.5 w-3.5" />
              AI-guided interview
            </Badge>
            <Badge
              data-hero-chip
              variant="outline"
              className="gap-1.5 border-[var(--color-crowe-amber-core)]/30 bg-[var(--color-crowe-amber-core)]/12 px-3 py-1 text-[var(--color-crowe-indigo-dark)] dark:text-[var(--color-crowe-amber-bright)]"
            >
              <FileText className="h-3.5 w-3.5" />
              Document gap analysis
            </Badge>
            <Badge
              data-hero-chip
              variant="outline"
              className="gap-1.5 border-[var(--color-crowe-teal)]/30 bg-[var(--color-crowe-teal)]/12 px-3 py-1 text-[var(--color-crowe-teal-dark)] dark:text-[var(--color-crowe-teal-bright)]"
            >
              <Shield className="h-3.5 w-3.5" />
              Governance-ready output
            </Badge>
          </div>

          <div className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-3">
            <div
              data-hero-stat
              className="surface-panel interactive-lift rounded-xl px-4 py-3"
            >
              <p className="text-xl font-bold text-foreground">3</p>
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Workflow Phases
              </p>
            </div>
            <div
              data-hero-stat
              className="surface-panel interactive-lift rounded-xl px-4 py-3"
            >
              <p className="text-xl font-bold text-foreground">24+</p>
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Template Sections
              </p>
            </div>
            <div
              data-hero-stat
              className="surface-panel interactive-lift rounded-xl px-4 py-3"
            >
              <p className="text-xl font-bold text-foreground">DOCX/PDF</p>
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Export Formats
              </p>
            </div>
          </div>
        </section>

        <section
          data-hero-panel
          className="surface-card mx-auto w-full max-w-xl rounded-2xl border px-6 py-7 lg:mx-0 lg:px-7"
        >
          <div className="mb-5 space-y-1">
            <h2 className="text-xl font-bold text-foreground">Start A New Intake</h2>
            <p className="text-sm text-muted-foreground">
              Configure your session and launch the guided wizard.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">
                Bank Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., First National Bank"
                value={store.bankName}
                onChange={(e) => store.setBankName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used in report headers and generated metadata.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Model</label>
                <Select
                  value={store.selectedModel}
                  onValueChange={(v) => store.setSelectedModel(v as AIModel)}
                  disabled={store.useMockData}
                >
                  <SelectTrigger className={store.useMockData ? 'opacity-60' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="surface-muted rounded-xl px-3 py-2.5">
                <button
                  type="button"
                  aria-label="Toggle mock mode"
                  onClick={() => store.setUseMockData(!store.useMockData)}
                  className="group flex items-center gap-2"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Mock
                  </span>
                  <span
                    className={`relative h-6 w-11 rounded-full border transition-colors duration-200 ${
                      store.useMockData
                        ? 'border-[var(--color-crowe-teal)] bg-[var(--color-crowe-teal)]'
                        : 'border-border bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200 ${
                        store.useMockData ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>

            {store.useMockData && (
              <p className="rounded-lg border border-[var(--color-crowe-teal)]/25 bg-[var(--color-crowe-teal)]/12 px-3 py-2 text-xs text-[var(--color-crowe-teal-dark)] dark:text-[var(--color-crowe-teal-bright)]">
                Mock mode is enabled. API calls are bypassed and deterministic sample
                data is returned.
              </p>
            )}
          </div>

          <div data-hero-cta className="mt-7">
            <Button
              size="lg"
              onClick={handleStart}
              disabled={!store.bankName.trim()}
              className="w-full gap-2 bg-[var(--color-crowe-amber-core)] text-[var(--color-crowe-indigo-dark)] hover:bg-[var(--color-crowe-amber-bright)] disabled:opacity-45"
            >
              Start Intake
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
