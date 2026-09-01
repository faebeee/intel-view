/**
 * Builds a randomized parent/child relation graph over a flat list of note
 * IDs: a directed acyclic graph (DAG) rather than a strict tree, since a
 * note may have more than one parent. Shared by `seed.ts` (to nest a
 * freshly-created batch of demo notes) and `nest-notes.ts` (to re-nest an
 * arbitrary existing project's notes on demand).
 */

export type NoteRelationPair = { parentId: number; childId: number };

export type BuildNoteRelationsOptions = {
  /** Maximum nesting depth: depths `0` (root) .. `maxDepth - 1` (deepest). */
  maxDepth?: number;
  /** Chance a note gets at least one parent rather than being a root note. */
  nestProbability?: number;
  /** Chance a nested note gets a second parent, in addition to its first. */
  extraParentProbability?: number;
};

const DEFAULT_MAX_DEPTH = 4;
const DEFAULT_NEST_PROBABILITY = 0.45;
const DEFAULT_EXTRA_PARENT_PROBABILITY = 0.2;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Randomly assigns parent/child relations across `noteIds`, capped at
 * `maxDepth` levels of nesting, with an optional chance of a second parent
 * per nested note. Returns the resulting `{ parentId, childId }` pairs (not
 * yet persisted) along with the resolved depth of each note, so callers can
 * log a depth distribution if desired.
 */
export function buildNoteRelations(
  noteIds: number[],
  options: BuildNoteRelationsOptions = {},
): { relations: NoteRelationPair[]; depthById: Map<number, number> } {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const nestProbability = options.nestProbability ?? DEFAULT_NEST_PROBABILITY;
  const extraParentProbability =
    options.extraParentProbability ?? DEFAULT_EXTRA_PARENT_PROBABILITY;

  const shuffled = shuffle(noteIds);

  // Pool of candidate parents, each entry tracks its assigned depth so we can
  // cap the maximum nesting depth.
  const depthById = new Map<number, number>();
  const pool: number[] = [];
  const relations: NoteRelationPair[] = [];

  for (const id of shuffled) {
    const parentIds: number[] = [];
    let depth = 0;

    if (pool.length > 0 && Math.random() < nestProbability) {
      // Try a few times to find an eligible parent below the max depth.
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = pool[randomInt(0, pool.length - 1)];
        const candidateDepth = depthById.get(candidate) ?? 0;
        if (candidateDepth < maxDepth - 1 && !parentIds.includes(candidate)) {
          parentIds.push(candidate);
          depth = Math.max(depth, candidateDepth + 1);
          break;
        }
      }

      // Occasionally give the note a second parent, to exercise the
      // multi-parent DAG shape rather than a strict tree.
      if (parentIds.length > 0 && Math.random() < extraParentProbability) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate = pool[randomInt(0, pool.length - 1)];
          const candidateDepth = depthById.get(candidate) ?? 0;
          if (candidateDepth < maxDepth - 1 && !parentIds.includes(candidate)) {
            parentIds.push(candidate);
            depth = Math.max(depth, candidateDepth + 1);
            break;
          }
        }
      }
    }

    depthById.set(id, depth);
    pool.push(id);
    for (const parentId of parentIds) {
      relations.push({ parentId, childId: id });
    }
  }

  return { relations, depthById };
}
