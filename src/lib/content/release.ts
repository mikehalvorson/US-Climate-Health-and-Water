export type ChapterContentKey = 'energy-system' | 'energy-demand' | 'generation-choices' | 'grid-delivery' | 'energy-plan' | 'climate-cause' | 'climate-risks' | 'coasts-communities' | 'climate-plan' | 'freshwater-security' | 'food-agriculture' | 'industry-water' | 'plastics-materials' | 'food-water-plan';

const RELEASED_CHAPTERS: Readonly<Record<string, ChapterContentKey>> = {
  'RTE-000002': 'energy-system',
  'RTE-000003': 'energy-demand',
  'RTE-000004': 'generation-choices',
  'RTE-000005': 'grid-delivery',
  'RTE-000006': 'energy-plan',
  'RTE-000007': 'climate-cause',
  'RTE-000008': 'climate-risks',
  'RTE-000009': 'coasts-communities',
  'RTE-000010': 'climate-plan',
  'RTE-000011': 'freshwater-security',
  'RTE-000012': 'food-agriculture',
  'RTE-000013': 'industry-water',
  'RTE-000014': 'plastics-materials',
  'RTE-000015': 'food-water-plan',
};

export function chapterContentFor(routeId: string): ChapterContentKey | null {
  return RELEASED_CHAPTERS[routeId] ?? null;
}

export function releaseStatusFor(routeId: string): 'chapter' | 'shell' {
  return chapterContentFor(routeId) ? 'chapter' : 'shell';
}
