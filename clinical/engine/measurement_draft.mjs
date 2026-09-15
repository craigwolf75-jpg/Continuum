/* Continuum Prompt 39 criterion 13: a network failure at any point during entry
   loses no data. The unsigned working set lives in clinical.measurement_draft
   (migration 016). Each field write produces a new snapshot. A simulated partition
   after field N recovers the snapshot that contains fields 1 through N, never a
   later unpersisted field.

   Pure in memory store used by tests. The live adapter writes the same shape to
   measurement_draft.draft. No dashes anywhere. */

export function createDraftStore(seed) {
  let snapshot = {
    fields: Object.assign({}, (seed && seed.fields) || {}),
    saved_at: (seed && seed.saved_at) || null,
    writes: Number((seed && seed.writes) || 0),
  };
  return {
    writeField(key, value, at) {
      const fields = Object.assign({}, snapshot.fields);
      fields[key] = value;
      snapshot = { fields, saved_at: at || snapshot.saved_at, writes: snapshot.writes + 1 };
      return recover();
    },
    recover() {
      return recover();
    },
  };
  function recover() {
    return {
      fields: Object.assign({}, snapshot.fields),
      saved_at: snapshot.saved_at,
      writes: snapshot.writes,
    };
  }
}

// Simulate a partition after the write at index (0 based). Earlier writes are
// persisted; the write at the partition and after it are lost.
export function simulatePartition(fieldWrites, partitionAfterIndex) {
  const store = createDraftStore();
  const persisted = fieldWrites.slice(0, partitionAfterIndex + 1);
  for (const w of persisted) store.writeField(w.key, w.value, w.at);
  return store.recover();
}
