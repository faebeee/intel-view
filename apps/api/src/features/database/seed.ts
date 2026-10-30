import { AppDataSource } from './datasource';
import { Project } from '../project/entities/project.entity';
import { ProjectFolder } from '../project-folder/entities/project-folder.entity';
import { Tag } from '../tag/entities/tag.entity';
import { DEFAULT_TAGS } from '../tag/default-tags';
import { Note } from '../note/entities/note.entity';
import { NoteLogEntry } from '../note/entities/note-log-entry.entity';
import { NoteRelation } from '../note/entities/note-relation.entity';
import { buildNoteRelations } from './note-relations.util';

/**
 * Seeds a "Switzerland Field Ops" demo project (assigned to a demo project
 * folder, with a non-default color theme) with tags and ~200 notes. Exercises
 * every note type except `'file'` (which requires a reachable object storage
 * instance to seed real bytes into, so is left out of this offline-friendly
 * script): most notes are `'standard'` notes, plus a handful of `'log'` notes
 * (each with several append-only log entries). Notes are also nested into a
 * parent/child DAG and scattered across the canvas view.
 *
 * Run with: npm run seed --workspace=api
 */

const TOTAL_STANDARD_NOTES = 185;
const TOTAL_LOG_NOTES = 15;

const DEMO_PROJECT_FOLDER = {
  name: 'Field Operations',
  description: 'Active field intelligence operations across Europe.',
  color: '#0ea5e9',
};

const DEMO_PROJECT = {
  name: 'Switzerland Field Ops',
  description:
    'Demo project tracking field reports, checkpoints, and points of interest across Switzerland.',
  color: 'crimson' as const,
};

const TAG_DEFINITIONS: { name: string; color: string }[] = [...DEFAULT_TAGS];

// A small palette of custom note colors, distinct from the tag palette
// above, used to exercise a note's optional custom color override.
const CUSTOM_NOTE_COLORS = [
  '#22d3ee',
  '#f472b6',
  '#a3e635',
  '#fb923c',
  '#c084fc',
  '#facc15',
];
const CUSTOM_COLOR_PROBABILITY = 0.18;

// Swiss places (plus a few nearby cross-border cities) used to build
// plausible-looking note titles for the demo data.
const PLACE_NAMES: string[] = [
  'Zurich',
  'Geneva',
  'Basel',
  'Bern',
  'Lausanne',
  'Lucerne',
  'St. Gallen',
  'Lugano',
  'Winterthur',
  'Biel/Bienne',
  'Thun',
  'Fribourg',
  'Schaffhausen',
  'Chur',
  'Neuchatel',
  'Sion',
  'Zug',
  'Solothurn',
  'Aarau',
  'Davos',
  'Interlaken',
  'Montreux',
  'Zermatt',
  'Bellinzona',
  'Locarno',
  'Milan, Italy',
  'Lyon, France',
  'Freiburg, Germany',
  'Innsbruck, Austria',
  'Annecy, France',
  'Vaduz, Liechtenstein',
];

const REPORT_SUBJECTS = [
  'Checkpoint activity observed',
  'Routine patrol log',
  'Unusual vehicle movement',
  'Scheduled contact meeting',
  'Supply drop coordination',
  'Signal intercept summary',
  'Financial transfer flagged',
  'Border crossing report',
  'Safehouse status check',
  'Infrastructure inspection',
  'Personnel sighting',
  'Communications relay test',
  'Transport hub monitoring',
  'Surveillance sweep results',
  'Local informant briefing',
];

const REPORT_BODIES = [
  'Team confirmed the location matches prior satellite imagery. No immediate anomalies detected during the visit.',
  'Contact was brief and conducted without incident. Follow-up scheduled within the next reporting cycle.',
  'Local conditions were consistent with previous reports. Recommend continued low-frequency monitoring.',
  'Minor discrepancies noted between expected and observed activity levels; flagged for analyst review.',
  'Asset confirmed the handoff occurred as planned. Package logged and forwarded to the next waypoint.',
  'Weather conditions limited visibility during the observation window; a follow-up pass is recommended.',
  'Increased foot traffic noted in the area compared to baseline. Possible correlation with local event.',
  'No further action required at this time. Site remains stable and consistent with prior assessments.',
  'Communication equipment tested nominal. Relay confirmed operational for the current rotation.',
  'Financial activity at this location exceeded the expected threshold and has been forwarded for review.',
];

// Subjects used for 'log'-type notes, which track an ongoing rotation via a
// sequence of append-only entries rather than a single body of content.
const LOG_SUBJECTS = [
  'Overwatch rotation',
  'Perimeter watch',
  'Signal desk',
  'Checkpoint duty',
  'Safehouse maintenance',
];

// Individual entries appended to 'log'-type notes, mimicking short
// timestamped shift updates.
const LOG_ENTRY_LINES = [
  'Shift change completed, no incidents to report.',
  'Checked in with local contact, area remains quiet.',
  'Vehicle inspection completed, cleared for transport.',
  'Equipment tested nominal, standing by for next rotation.',
  'Brief increase in foot traffic noted, continuing observation.',
  'Relief team arrived on schedule, briefed on current status.',
  'Routine sweep completed, no anomalies detected.',
  'Supply resupply confirmed, inventory updated.',
  'Weather conditions deteriorating, visibility reduced.',
  'Coordination call with adjacent team completed.',
  'Minor equipment fault resolved, no further action needed.',
  'Extended watch due to delayed relief, no incidents.',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function pickSome<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Scatters notes across the canvas view within a fixed bounding box. */
function randomCanvasPosition(): { canvasX: number; canvasY: number } {
  return {
    canvasX: randomInt(-1500, 1500),
    canvasY: randomInt(-1000, 1000),
  };
}

/** Rolls the odds of assigning a custom note color, or `null` if not. */
function maybeCustomColor(): string | null {
  return Math.random() < CUSTOM_COLOR_PROBABILITY
    ? pick(CUSTOM_NOTE_COLORS)
    : null;
}

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  const projectFolderRepo = AppDataSource.getRepository(ProjectFolder);
  const projectRepo = AppDataSource.getRepository(Project);
  const tagRepo = AppDataSource.getRepository(Tag);
  const noteRepo = AppDataSource.getRepository(Note);
  const noteLogEntryRepo = AppDataSource.getRepository(NoteLogEntry);
  const noteRelationRepo = AppDataSource.getRepository(NoteRelation);

  console.log('Creating demo project folder...');
  const projectFolder = await projectFolderRepo.save(
    projectFolderRepo.create(DEMO_PROJECT_FOLDER),
  );

  console.log('Creating demo project...');
  const project = await projectRepo.save(
    projectRepo.create({ ...DEMO_PROJECT, folderId: projectFolder.id }),
  );

  console.log('Creating global tags...');
  const tags = await tagRepo.save(
    TAG_DEFINITIONS.map((tag) => tagRepo.create(tag)),
  );
  const tagNames = tags.map((tag) => tag.name);

  const allNoteIds: number[] = [];

  // --- 'standard' notes ---------------------------------------------------
  console.log(`Creating ${TOTAL_STANDARD_NOTES} standard notes...`);
  const standardNotesToInsert: Note[] = [];

  for (let i = 0; i < TOTAL_STANDARD_NOTES; i++) {
    const placeName = pick(PLACE_NAMES);
    const subject = pick(REPORT_SUBJECTS);
    const body = pick(REPORT_BODIES);

    const title = `${subject} — ${placeName}`;
    const content = `## ${subject} — ${placeName}\n\n${body}`;

    standardNotesToInsert.push(
      noteRepo.create({
        projectId: project.id,
        type: 'standard',
        title,
        content,
        tags: pickSome(tagNames, randomInt(1, 3)),
        color: maybeCustomColor(),
        ...randomCanvasPosition(),
      }),
    );
  }

  // Insert in batches to avoid overly large single queries.
  const BATCH_SIZE = 50;
  const savedStandardNotes: Note[] = [];
  for (let i = 0; i < standardNotesToInsert.length; i += BATCH_SIZE) {
    const saved = await noteRepo.save(
      standardNotesToInsert.slice(i, i + BATCH_SIZE),
    );
    savedStandardNotes.push(...saved);
  }
  allNoteIds.push(...savedStandardNotes.map((note) => note.id));

  // --- 'log' notes, each with several append-only log entries ------------
  console.log(`Creating ${TOTAL_LOG_NOTES} log notes...`);
  const logNotesToInsert: Note[] = [];
  for (let i = 0; i < TOTAL_LOG_NOTES; i++) {
    const placeName = pick(PLACE_NAMES);
    const subject = pick(LOG_SUBJECTS);
    logNotesToInsert.push(
      noteRepo.create({
        projectId: project.id,
        type: 'log',
        title: `${subject} — ${placeName}`,
        tags: pickSome(tagNames, randomInt(1, 2)),
        color: maybeCustomColor(),
        ...randomCanvasPosition(),
      }),
    );
  }
  const savedLogNotes = await noteRepo.save(logNotesToInsert);
  allNoteIds.push(...savedLogNotes.map((note) => note.id));

  console.log('Creating log entries...');
  const logEntriesToInsert: NoteLogEntry[] = [];
  for (const note of savedLogNotes) {
    const entryCount = randomInt(3, 6);
    for (let i = 0; i < entryCount; i++) {
      logEntriesToInsert.push(
        noteLogEntryRepo.create({
          noteId: note.id,
          content: pick(LOG_ENTRY_LINES),
        }),
      );
    }
  }
  await noteLogEntryRepo.save(logEntriesToInsert);

  // --- Nest all notes into a parent/child DAG -----------------------------
  console.log('Nesting notes into a parent/child hierarchy...');
  const { relations } = buildNoteRelations(allNoteIds);
  if (relations.length > 0) {
    await noteRelationRepo.save(
      relations.map((relation) => noteRelationRepo.create(relation)),
    );
  }

  console.log(
    [
      `Done. Created project "${project.name}" (id=${project.id})`,
      `in folder "${projectFolder.name}" (theme=${project.color})`,
      `with ${tags.length} tags,`,
      `${savedStandardNotes.length} standard notes,`,
      `${savedLogNotes.length} log notes (${logEntriesToInsert.length} log entries),`,
      `and ${relations.length} parent/child relations.`,
    ].join(' '),
  );

  await AppDataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
