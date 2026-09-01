import { AppDataSource } from './datasource';
import { Note } from '../note/entities/note.entity';
import { NoteRelation } from '../note/entities/note-relation.entity';
import { In } from 'typeorm';
import { buildNoteRelations } from './note-relations.util';

/**
 * Alters a subset of an existing project's notes to introduce multiple
 * levels of parent/child relations (a directed acyclic graph, allowing a
 * note to have more than one parent), simulating a realistic mix of
 * top-level and nested notes.
 *
 * Run with: npm run nest-notes --workspace=api -- <projectId>
 * Defaults to project id 6 if not provided.
 */

const PROJECT_ID = Number(process.argv[2] ?? 6);

async function nestNotes(): Promise<void> {
  await AppDataSource.initialize();

  const noteRepo = AppDataSource.getRepository(Note);
  const noteRelationRepo = AppDataSource.getRepository(NoteRelation);

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
    `Linking notes for project ${PROJECT_ID} (${notes.length} notes found)...`,
  );

  // Clear any existing relations among these notes so re-running the script
  // produces a fresh, consistent graph rather than accumulating relations.
  const noteIds = notes.map((n) => n.id);
  await noteRelationRepo.delete({ childId: In(noteIds) });

  const { relations, depthById } = buildNoteRelations(noteIds);

  console.log(
    `Assigning ${relations.length} parent/child relations across ${notes.length} notes...`,
  );

  if (relations.length > 0) {
    await noteRelationRepo.save(
      relations.map((r) => noteRelationRepo.create(r)),
    );
  }

  const depthCounts = new Map<number, number>();
  for (const id of noteIds) {
    const d = depthById.get(id) ?? 0;
    depthCounts.set(d, (depthCounts.get(d) ?? 0) + 1);
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
