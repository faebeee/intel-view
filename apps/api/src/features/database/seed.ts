import { AppDataSource } from './datasource';
import { Project } from '../project/entities/project.entity';
import { ProjectFolder } from '../project-folder/entities/project-folder.entity';
import { Tag } from '../tag/entities/tag.entity';
import { Note } from '../note/entities/note.entity';
import { NoteLocation } from '../note/entities/note-location.entity';
import { NoteLogEntry } from '../note/entities/note-log-entry.entity';
import { NoteRelation } from '../note/entities/note-relation.entity';
import { buildNoteRelations } from './note-relations.util';

/**
 * Seeds a "Switzerland Field Ops" demo project (assigned to a demo project
 * folder, with a non-default map/color theme) with tags and ~200 notes,
 * geographically concentrated within Switzerland (with a small fraction of
 * notes spilling into neighbouring countries to simulate cross-border
 * activity). Exercises every note type except `'file'` (which requires a
 * reachable object storage instance to seed real bytes into, so is left out
 * of this offline-friendly script): most notes are `'standard'` notes with
 * an embedded `[[geo:...]]` map pin, plus a handful of `'log'` notes (each
 * with several append-only log entries) and `'address'` notes (with a
 * directly-set "resolved" geocode, rather than calling the live geocoding
 * API, to keep this script fast and deterministic). Notes are also nested
 * into a parent/child DAG and scattered across the canvas view.
 *
 * Run with: npm run seed --workspace=api
 */

const TOTAL_STANDARD_NOTES = 170;
const TOTAL_LOG_NOTES = 15;
const TOTAL_ADDRESS_NOTES = 15;

const DEMO_PROJECT_FOLDER = {
  name: 'Field Operations',
  description: 'Active field intelligence operations across Europe.',
  color: '#0ea5e9',
};

const DEMO_PROJECT = {
  name: 'Switzerland Field Ops',
  description:
    'Demo project tracking field reports, checkpoints, and points of interest across Switzerland.',
  mapTheme: 'dark' as const,
  color: 'crimson' as const,
};

const TAG_DEFINITIONS: { name: string; color: string }[] = [
  { name: 'Checkpoint', color: '#ef4444' },
  { name: 'Safehouse', color: '#8b5cf6' },
  { name: 'Logistics', color: '#f59e0b' },
  { name: 'Surveillance', color: '#3b82f6' },
  { name: 'Contact Meeting', color: '#10b981' },
  { name: 'Infrastructure', color: '#6366f1' },
  { name: 'Financial', color: '#eab308' },
  { name: 'Communications', color: '#14b8a6' },
  { name: 'Border Activity', color: '#f43f5e' },
  { name: 'Transport Hub', color: '#0ea5e9' },
];

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

// Swiss cities/towns with approximate coordinates, weighted so that larger
// cities appear more frequently. A small pool of nearby cross-border cities
// is included separately to represent the "mostly Switzerland" spillover.
const SWISS_LOCATIONS: { name: string; lat: number; lng: number }[] = [
  { name: 'Zurich', lat: 47.3769, lng: 8.5417 },
  { name: 'Geneva', lat: 46.2044, lng: 6.1432 },
  { name: 'Basel', lat: 47.5596, lng: 7.5886 },
  { name: 'Bern', lat: 46.948, lng: 7.4474 },
  { name: 'Lausanne', lat: 46.5197, lng: 6.6323 },
  { name: 'Lucerne', lat: 47.0502, lng: 8.3093 },
  { name: 'St. Gallen', lat: 47.4245, lng: 9.3767 },
  { name: 'Lugano', lat: 46.0037, lng: 8.9511 },
  { name: 'Winterthur', lat: 47.4996, lng: 8.7241 },
  { name: 'Biel/Bienne', lat: 47.1368, lng: 7.2468 },
  { name: 'Thun', lat: 46.7576, lng: 7.6281 },
  { name: 'Fribourg', lat: 46.8065, lng: 7.1619 },
  { name: 'Schaffhausen', lat: 47.6959, lng: 8.6304 },
  { name: 'Chur', lat: 46.8499, lng: 9.5329 },
  { name: 'Neuchatel', lat: 46.9895, lng: 6.9293 },
  { name: 'Sion', lat: 46.2331, lng: 7.36 },
  { name: 'Zug', lat: 47.1662, lng: 8.5155 },
  { name: 'Solothurn', lat: 47.2088, lng: 7.5323 },
  { name: 'Aarau', lat: 47.3915, lng: 8.0442 },
  { name: 'Davos', lat: 46.7996, lng: 9.8388 },
  { name: 'Interlaken', lat: 46.6863, lng: 7.8632 },
  { name: 'Montreux', lat: 46.4312, lng: 6.9107 },
  { name: 'Zermatt', lat: 46.0207, lng: 7.7491 },
  { name: 'Bellinzona', lat: 46.1944, lng: 9.0175 },
  { name: 'Locarno', lat: 46.1704, lng: 8.7995 },
];

// A handful of nearby cross-border cities to simulate the small fraction of
// notes that fall outside Switzerland.
const NEARBY_FOREIGN_LOCATIONS: { name: string; lat: number; lng: number }[] = [
  { name: 'Milan, Italy', lat: 45.4642, lng: 9.19 },
  { name: 'Lyon, France', lat: 45.764, lng: 4.8357 },
  { name: 'Freiburg, Germany', lat: 47.999, lng: 7.8421 },
  { name: 'Innsbruck, Austria', lat: 47.2692, lng: 11.4041 },
  { name: 'Annecy, France', lat: 45.8992, lng: 6.1294 },
  { name: 'Vaduz, Liechtenstein', lat: 47.141, lng: 9.5209 },
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

// Street names used to build plausible-looking street addresses for
// 'address'-type demo notes.
const STREET_NAMES = [
  'Bahnhofstrasse',
  'Rue du Rhône',
  'Freie Strasse',
  'Marktgasse',
  'Via Nassa',
  'Seestrasse',
  'Poststrasse',
  'Bundesplatz',
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
  const noteLocationRepo = AppDataSource.getRepository(NoteLocation);
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

  // --- 'standard' notes, each with an embedded [[geo:...]] map pin -------
  console.log(`Creating ${TOTAL_STANDARD_NOTES} standard notes...`);
  const locationsByNoteIndex: {
    lat: number;
    lng: number;
    label: string;
  }[] = [];
  const standardNotesToInsert: Note[] = [];

  for (let i = 0; i < TOTAL_STANDARD_NOTES; i++) {
    // ~92% of notes land in Switzerland, the rest spill into neighbouring
    // countries to keep things "mostly" Swiss.
    const useForeign = Math.random() < 0.08;
    const location = useForeign
      ? pick(NEARBY_FOREIGN_LOCATIONS)
      : pick(SWISS_LOCATIONS);

    const subject = pick(REPORT_SUBJECTS);
    const body = pick(REPORT_BODIES);

    const title = `${subject} — ${location.name}`;
    const content =
      `## ${subject} — ${location.name}\n\n${body}\n\n` +
      `[[geo:${location.lat},${location.lng},${location.name}]]`;

    locationsByNoteIndex.push({
      lat: location.lat,
      lng: location.lng,
      label: location.name,
    });

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

  // Insert in batches to avoid overly large single queries, keeping track of
  // each batch's saved (ID-bearing) notes so matching `NoteLocation` rows can
  // be created afterwards (raw repository saves don't go through
  // `NoteService`, which is what normally keeps that table in sync).
  const BATCH_SIZE = 50;
  const savedStandardNotes: Note[] = [];
  for (let i = 0; i < standardNotesToInsert.length; i += BATCH_SIZE) {
    const saved = await noteRepo.save(
      standardNotesToInsert.slice(i, i + BATCH_SIZE),
    );
    savedStandardNotes.push(...saved);
  }
  allNoteIds.push(...savedStandardNotes.map((note) => note.id));

  console.log('Creating map pins for standard notes...');
  await noteLocationRepo.save(
    savedStandardNotes.map((note, index) =>
      noteLocationRepo.create({
        noteId: note.id,
        lat: locationsByNoteIndex[index].lat,
        lng: locationsByNoteIndex[index].lng,
        label: locationsByNoteIndex[index].label,
      }),
    ),
  );

  // --- 'log' notes, each with several append-only log entries ------------
  console.log(`Creating ${TOTAL_LOG_NOTES} log notes...`);
  const logNotesToInsert: Note[] = [];
  for (let i = 0; i < TOTAL_LOG_NOTES; i++) {
    const location = pick(SWISS_LOCATIONS);
    const subject = pick(LOG_SUBJECTS);
    logNotesToInsert.push(
      noteRepo.create({
        projectId: project.id,
        type: 'log',
        title: `${subject} — ${location.name}`,
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

  // --- 'address' notes, with a directly-set "resolved" geocode ------------
  console.log(`Creating ${TOTAL_ADDRESS_NOTES} address notes...`);
  const addressNotesToInsert: Note[] = [];
  for (let i = 0; i < TOTAL_ADDRESS_NOTES; i++) {
    const location = pick(SWISS_LOCATIONS);
    const street = pick(STREET_NAMES);
    const streetNumber = randomInt(1, 120);
    const address = `${street} ${streetNumber}, ${location.name}`;
    // Small jitter so the pin isn't pinned to the exact city-center
    // coordinate as every other note referencing the same city.
    const jitteredLat = location.lat + (Math.random() - 0.5) * 0.02;
    const jitteredLng = location.lng + (Math.random() - 0.5) * 0.02;

    addressNotesToInsert.push(
      noteRepo.create({
        projectId: project.id,
        type: 'address',
        title: `Safehouse address — ${location.name}`,
        content: address,
        tags: pickSome(tagNames, randomInt(1, 2)),
        color: maybeCustomColor(),
        ...randomCanvasPosition(),
        latitude: jitteredLat,
        longitude: jitteredLng,
        geocodeStatus: 'resolved',
        geocodedLabel: `${address}, Switzerland`,
      }),
    );
  }
  const savedAddressNotes = await noteRepo.save(addressNotesToInsert);
  allNoteIds.push(...savedAddressNotes.map((note) => note.id));

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
      `in folder "${projectFolder.name}" (theme=${project.color}/${project.mapTheme})`,
      `with ${tags.length} tags,`,
      `${savedStandardNotes.length} standard notes (with map pins),`,
      `${savedLogNotes.length} log notes (${logEntriesToInsert.length} log entries),`,
      `${savedAddressNotes.length} address notes,`,
      `and ${relations.length} parent/child relations.`,
    ].join(' '),
  );

  await AppDataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
