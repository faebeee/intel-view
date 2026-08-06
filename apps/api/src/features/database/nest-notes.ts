import { AppDataSource } from './datasource';
import { Note } from '../note/entities/note.entity';

/**
 * Alters a subset of an existing project's notes to introduce multiple
 * levels of nesting (parent/child relationships), simulating a realistic
 * mix of top-level and nested notes.
 *
 * Run with: npm run nest-notes --workspace=api -- <projectId>
 * Defaults to project id 6 if not provided.
 */

const PROJECT_ID = Number(process.argv[2] ?? 6);
const MAX_DEPTH = 4; // depths 0 (root) .. 3 (deepest nested level)
const NEST_PROBABILITY = 0.45; // chance a note becomes a child rather than root

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

async function nestNotes(): Promise<void> {
  await AppDataSource.initialize();

  const noteRepo = AppDataSource.getRepository(Note);

  const notes = await noteRepo.find({
    where: { projectId: PROJECT_ID },
    select: { id: true },
    order: { id: 'ASC' },
  });

  if (notes.length === 0) {
    console.log(`No notes found for project ${PROJECT_ID}. Nothing to do.`);
    await AppDataSource.destroy();
    return;
  }

  console.log(
    `Nesting notes for project ${PROJECT_ID} (${notes.length} notes found)...`,
  );

  const shuffled = shuffle(notes.map((n) => n.id));

  // Pool of candidate parents, each entry tracks its assigned depth so we can
  // cap the maximum nesting depth.
  const depthById = new Map<number, number>();
  const pool: number[] = [];
  const updates: { id: number; parentId: number | null }[] = [];

  for (const id of shuffled) {
    let parentId: number | null = null;
    let depth = 0;

    if (pool.length > 0 && Math.random() < NEST_PROBABILITY) {
      // Try a few times to find an eligible parent below the max depth.
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = pool[randomInt(0, pool.length - 1)];
        const candidateDepth = depthById.get(candidate) ?? 0;
        if (candidateDepth < MAX_DEPTH - 1) {
          parentId = candidate;
          depth = candidateDepth + 1;
          break;
        }
      }
    }

    depthById.set(id, depth);
    pool.push(id);
    updates.push({ id, parentId });
  }

  const nestedCount = updates.filter((u) => u.parentId !== null).length;
  const depthCounts = new Map<number, number>();
  for (const id of shuffled) {
    const d = depthById.get(id) ?? 0;
    depthCounts.set(d, (depthCounts.get(d) ?? 0) + 1);
  }

  console.log(
    `Assigning ${nestedCount} of ${notes.length} notes as nested children...`,
  );

  for (const update of updates) {
    if (update.parentId !== null) {
      await noteRepo.update({ id: update.id }, { parentId: update.parentId });
    }
  }

  console.log('Depth distribution:');
  for (const [depth, count] of [...depthCounts.entries()].sort(
    (a, b) => a[0] - b[0],
  )) {
    console.log(`  depth ${depth}: ${count} notes`);
  }

  console.log('Done.');
  await AppDataSource.destroy();
}

nestNotes().catch((error: unknown) => {
  console.error('Nesting notes failed:', error);
  process.exit(1);
});
