type JsonRecord = Record<string, unknown>;

const same = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right);

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const hasStableIds = (value: unknown[]): value is JsonRecord[] =>
  value.every((item) => isRecord(item) && item.id !== undefined);

/**
 * Three-way merge used after an optimistic-lock conflict.
 * Local additions, edits and deletions are replayed over the newest server copy,
 * while server changes that the current browser did not touch are preserved.
 */
export function mergeWorkspaceValue(
  base: unknown,
  local: unknown,
  remote: unknown,
): unknown {
  if (same(local, base)) return remote;
  if (same(remote, base) || same(local, remote)) return local;

  if (Array.isArray(base) && Array.isArray(local) && Array.isArray(remote)) {
    if (!hasStableIds(base) || !hasStableIds(local) || !hasStableIds(remote)) {
      return local;
    }

    const baseById = new Map(base.map((item) => [String(item.id), item]));
    const localById = new Map(local.map((item) => [String(item.id), item]));
    const merged = remote
      .filter(
        (item) =>
          localById.has(String(item.id)) || !baseById.has(String(item.id)),
      )
      .map((remoteItem) => {
        const id = String(remoteItem.id);
        const localItem = localById.get(id);
        const baseItem = baseById.get(id);
        if (!localItem) return remoteItem;
        if (!baseItem) return localItem;
        return mergeWorkspaceValue(
          baseItem,
          localItem,
          remoteItem,
        ) as JsonRecord;
      });

    const remoteIds = new Set(remote.map((item) => String(item.id)));
    for (const localItem of local) {
      if (
        !remoteIds.has(String(localItem.id)) &&
        !baseById.has(String(localItem.id))
      ) {
        merged.push(localItem);
      }
    }
    return merged;
  }

  if (isRecord(base) && isRecord(local) && isRecord(remote)) {
    const result: JsonRecord = { ...remote };
    const keys = new Set([...Object.keys(base), ...Object.keys(local)]);
    for (const key of keys) {
      if (!(key in local)) {
        if (key in base) delete result[key];
        continue;
      }
      result[key] = mergeWorkspaceValue(base[key], local[key], remote[key]);
    }
    return result;
  }

  return local;
}

export function mergeWorkspace<T extends JsonRecord>(
  base: T,
  local: T,
  remote: T,
): T {
  return mergeWorkspaceValue(base, local, remote) as T;
}
