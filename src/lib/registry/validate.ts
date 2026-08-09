import { isCanonicalId, REGISTRY_KINDS } from './namespaces';
import type {
  AnyRegistryRecord,
  ForeignKeyReference,
  RegistryByKind,
  RegistryKind,
  RegistryStore,
} from './types';

export interface RegistryIssue {
  code:
    | 'duplicate_id'
    | 'invalid_id'
    | 'wrong_record_kind'
    | 'invalid_fingerprint'
    | 'invalid_supersession'
    | 'unresolved_replacement'
    | 'self_replacement'
    | 'missing_registry'
    | 'unresolved_foreign_key'
    | 'semantic_mismatch';
  registryKind: RegistryKind;
  recordId: string;
  message: string;
}

export class RegistryValidationError extends Error {
  readonly issues: readonly RegistryIssue[];

  constructor(issues: readonly RegistryIssue[]) {
    super(issues.map((issue) => issue.message).join('\n'));
    this.name = 'RegistryValidationError';
    this.issues = issues;
  }
}

const fingerprintPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateRegistry<K extends RegistryKind>(
  kind: K,
  records: readonly RegistryByKind[K][],
): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const seen = new Set<string>();

  for (const record of records) {
    if (seen.has(record.id)) {
      issues.push({
        code: 'duplicate_id',
        registryKind: kind,
        recordId: record.id,
        message: `Duplicate ${kind} ID ${record.id}.`,
      });
    }
    seen.add(record.id);

    if (!isCanonicalId(kind, record.id)) {
      issues.push({
        code: 'invalid_id',
        registryKind: kind,
        recordId: record.id,
        message: `${kind} ID ${record.id} does not match its canonical namespace.`,
      });
    }

    if (record.registryKind !== kind) {
      issues.push({
        code: 'wrong_record_kind',
        registryKind: kind,
        recordId: record.id,
        message: `${record.id} declares ${record.registryKind} but is stored in the ${kind} registry.`,
      });
    }

    if (!fingerprintPattern.test(record.semanticFingerprint)) {
      issues.push({
        code: 'invalid_fingerprint',
        registryKind: kind,
        recordId: record.id,
        message: `${record.id} has an invalid semantic fingerprint.`,
      });
    }

    if (record.status === 'superseded') {
      if (!record.replacementId || !record.migrationNote?.trim()) {
        issues.push({
          code: 'invalid_supersession',
          registryKind: kind,
          recordId: record.id,
          message: `Superseded record ${record.id} requires a replacement ID and migration note.`,
        });
      } else if (record.replacementId === record.id) {
        issues.push({
          code: 'self_replacement',
          registryKind: kind,
          recordId: record.id,
          message: `Superseded record ${record.id} cannot replace itself.`,
        });
      } else if (!records.some((candidate) => candidate.id === record.replacementId)) {
        issues.push({
          code: 'unresolved_replacement',
          registryKind: kind,
          recordId: record.id,
          message: `Replacement ${record.replacementId} for ${record.id} does not exist in the ${kind} registry.`,
        });
      }
    } else if (record.replacementId || record.migrationNote) {
      issues.push({
        code: 'invalid_supersession',
        registryKind: kind,
        recordId: record.id,
        message: `Active record ${record.id} cannot declare supersession metadata.`,
      });
    }
  }

  return issues;
}

export function assertRegistry<K extends RegistryKind>(
  kind: K,
  records: readonly RegistryByKind[K][],
): void {
  const issues = validateRegistry(kind, records);
  if (issues.length > 0) {
    throw new RegistryValidationError(issues);
  }
}

export function assertRegistryStore(store: RegistryStore): void {
  const issues: RegistryIssue[] = [];
  for (const kind of REGISTRY_KINDS) {
    const records = store[kind];
    if (!records) {
      issues.push({
        code: 'missing_registry',
        registryKind: kind,
        recordId: kind,
        message: `Canonical registry ${kind} is missing from the registry store.`,
      });
      continue;
    }
    issues.push(...validateRegistry(kind, records as readonly RegistryByKind[typeof kind][]));
  }
  if (issues.length > 0) {
    throw new RegistryValidationError(issues);
  }
}

export function assertForeignKeys(
  references: readonly ForeignKeyReference[],
  store: RegistryStore,
): void {
  const issues: RegistryIssue[] = [];
  for (const reference of references) {
    const records = (store[reference.targetKind] ?? []) as readonly AnyRegistryRecord[];
    const matches = records.filter((record) => record.id === reference.targetId);
    if (matches.length !== 1) {
      issues.push({
        code: 'unresolved_foreign_key',
        registryKind: reference.targetKind,
        recordId: reference.sourceId,
        message: `${reference.sourceId}.${reference.field} must resolve ${reference.targetId} exactly once in ${reference.targetKind}; found ${matches.length}.`,
      });
      continue;
    }
    const target = matches[0];
    if (reference.expectedSemanticFingerprint && target?.semanticFingerprint !== reference.expectedSemanticFingerprint) {
      issues.push({
        code: 'semantic_mismatch',
        registryKind: reference.targetKind,
        recordId: reference.sourceId,
        message: `${reference.sourceId}.${reference.field} expected semantic fingerprint ${reference.expectedSemanticFingerprint} but found ${target?.semanticFingerprint}.`,
      });
    }
  }
  if (issues.length > 0) {
    throw new RegistryValidationError(issues);
  }
}
