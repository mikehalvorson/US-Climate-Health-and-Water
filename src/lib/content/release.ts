export type ChapterContentKey = 'energy-system' | 'energy-demand';

const RELEASED_CHAPTERS: Readonly<Record<string, ChapterContentKey>> = {
  'RTE-000002': 'energy-system',
  'RTE-000003': 'energy-demand',
};

export function chapterContentFor(routeId: string): ChapterContentKey | null {
  return RELEASED_CHAPTERS[routeId] ?? null;
}

export function releaseStatusFor(routeId: string): 'chapter' | 'shell' {
  return chapterContentFor(routeId) ? 'chapter' : 'shell';
}
