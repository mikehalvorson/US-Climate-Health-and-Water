import type { AnyRegistryRecord, ForeignKeyReference, RegistryKind, RegistryStore } from './types';

const KIND_BY_PREFIX: Readonly<Record<string, RegistryKind>> = {
  SRC: 'source', CLM: 'claim', DAT: 'dataset', MET: 'metric', PAR: 'parameter',
  SCN: 'scenario', CHT: 'chart', TRN: 'transformation', MOD: 'model', RTE: 'route',
  VOC: 'vocabulary', DEN: 'denominator', OPN: 'open_item', TST: 'integrity_test',
};

function inferredReference(sourceId: string, field: string, targetId: string): ForeignKeyReference | null {
  const targetKind = KIND_BY_PREFIX[targetId.slice(0, 3)];
  return targetKind ? { sourceId, field, targetKind, targetId } : null;
}

function addMany(
  references: ForeignKeyReference[],
  sourceId: string,
  field: string,
  targetKind: RegistryKind,
  targetIds: readonly string[],
): void {
  targetIds.forEach((targetId) => references.push({ sourceId, field, targetKind, targetId }));
}

export function collectForeignKeyReferences(store: RegistryStore): ForeignKeyReference[] {
  const references: ForeignKeyReference[] = [];
  const records = Object.values(store).flat() as AnyRegistryRecord[];

  for (const record of records) {
    if (record.replacementId) {
      references.push({ sourceId: record.id, field: 'replacementId', targetKind: record.registryKind, targetId: record.replacementId });
    }
    switch (record.registryKind) {
      case 'claim':
        addMany(references, record.id, 'sourceIds', 'source', record.sourceIds);
        break;
      case 'dataset':
        addMany(references, record.id, 'sourceIds', 'source', record.sourceIds);
        break;
      case 'metric':
        addMany(references, record.id, 'sourceIds', 'source', record.sourceIds);
        addMany(references, record.id, 'claimIds', 'claim', record.claimIds);
        if (record.datasetId) references.push({ sourceId: record.id, field: 'datasetId', targetKind: 'dataset', targetId: record.datasetId });
        if (record.denominatorId) references.push({ sourceId: record.id, field: 'denominatorId', targetKind: 'denominator', targetId: record.denominatorId });
        break;
      case 'parameter':
        addMany(references, record.id, 'sourceIds', 'source', record.sourceIds);
        break;
      case 'scenario':
        references.push({ sourceId: record.id, field: 'modelId', targetKind: 'model', targetId: record.modelId });
        addMany(references, record.id, 'overrides.parameterId', 'parameter', record.overrides.map((override) => override.parameterId));
        break;
      case 'chart':
        addMany(references, record.id, 'metricIds', 'metric', record.metricIds);
        addMany(references, record.id, 'sourceIds', 'source', record.sourceIds);
        break;
      case 'transformation':
        record.inputIds.forEach((targetId) => {
          const reference = inferredReference(record.id, 'inputIds', targetId);
          if (reference) references.push(reference);
        });
        addMany(references, record.id, 'outputMetricIds', 'metric', record.outputMetricIds);
        break;
      case 'model':
        addMany(references, record.id, 'sourceIds', 'source', record.sourceIds ?? []);
        record.inputIds.forEach((targetId) => {
          const reference = inferredReference(record.id, 'inputIds', targetId);
          if (reference) references.push(reference);
        });
        addMany(references, record.id, 'outputMetricIds', 'metric', record.outputMetricIds);
        break;
      case 'denominator':
        addMany(references, record.id, 'sourceIds', 'source', record.sourceIds);
        break;
      case 'open_item':
        record.affectedIds.forEach((targetId) => {
          const reference = inferredReference(record.id, 'affectedIds', targetId);
          if (reference) references.push(reference);
        });
        (record.closedByEvidenceIds ?? []).forEach((targetId) => {
          const reference = inferredReference(record.id, 'closedByEvidenceIds', targetId);
          if (reference) references.push(reference);
        });
        break;
      default:
        break;
    }
  }
  return references;
}
