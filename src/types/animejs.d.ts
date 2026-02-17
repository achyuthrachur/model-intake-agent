declare module 'animejs/lib/anime.es.js' {
  interface AnimeTimeline {
    add: (params: Record<string, unknown>, offset?: number | string) => AnimeTimeline;
  }

  interface AnimeApi {
    (params: Record<string, unknown>): unknown;
    remove: (targets: unknown) => void;
    stagger: (value: number, options?: Record<string, unknown>) => unknown;
    timeline: (params?: Record<string, unknown>) => AnimeTimeline;
  }

  const anime: AnimeApi;
  export default anime;
}
