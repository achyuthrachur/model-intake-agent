'use client';

import { useEffect, type DependencyList, type RefObject } from 'react';
import anime from 'animejs/lib/anime.es.js';

interface StaggerConfig {
  delay?: number;
  duration?: number;
  y?: number;
  opacityFrom?: number;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useAnimeStagger(
  rootRef: RefObject<HTMLElement | null>,
  deps: DependencyList,
  selector = '[data-reveal]',
  config: StaggerConfig = {},
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const targets = root.querySelectorAll(selector);
    if (!targets.length) return;

    const delay = config.delay ?? 65;
    const duration = config.duration ?? 560;
    const y = config.y ?? 18;
    const opacityFrom = config.opacityFrom ?? 0;

    anime.remove(targets);
    anime({
      targets,
      opacity: [opacityFrom, 1],
      translateY: [y, 0],
      easing: 'cubicBezier(0.22, 1, 0.36, 1)',
      duration,
      delay: anime.stagger(delay),
    });

    return () => anime.remove(targets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function animateSlideIn(
  target: HTMLElement | null,
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
) {
  if (!target || prefersReducedMotion()) return;

  const axis = direction === 'left' || direction === 'right' ? 'translateX' : 'translateY';
  const amount =
    direction === 'up' || direction === 'left'
      ? 22
      : direction === 'down' || direction === 'right'
        ? -22
        : 16;

  anime.remove(target);
  anime({
    targets: target,
    opacity: [0, 1],
    [axis]: [amount, 0],
    duration: 520,
    easing: 'cubicBezier(0.22, 1, 0.36, 1)',
  });
}
