export type ChapterContentKey = 'energy-system' | 'energy-demand' | 'generation-choices' | 'grid-delivery' | 'climate-cause' | 'climate-risks' | 'coasts-communities' | 'freshwater-security' | 'industry-water' | 'plastics-materials';

const RELEASED_CHAPTERS: Readonly<Record<string, ChapterContentKey>> = {
  'RTE-000002': 'energy-system',
  'RTE-000003': 'energy-demand',
  'RTE-000004': 'generation-choices',
  'RTE-000005': 'grid-delivery',
  'RTE-000007': 'climate-cause',
  'RTE-000008': 'climate-risks',
  'RTE-000009': 'coasts-communities',
  'RTE-000011': 'freshwater-security',
  'RTE-000013': 'industry-water',
  'RTE-000014': 'plastics-materials',
};

export function chapterContentFor(routeId: string): ChapterContentKey | null {
  return RELEASED_CHAPTERS[routeId] ?? null;
}

export function releaseStatusFor(routeId: string): 'chapter' | 'shell' {
  return chapterContentFor(routeId) ? 'chapter' : 'shell';
}
