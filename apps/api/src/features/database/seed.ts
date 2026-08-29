import { AppDataSource } from './datasource';
import { Project } from '../project/entities/project.entity';
import { Tag } from '../tag/entities/tag.entity';
import { Note } from '../note/entities/note.entity';

/**
 * Seeds a "Switzerland Field Ops" demo project with tags and ~200 notes,
 * geographically concentrated within Switzerland (with a small fraction of
 * notes spilling into neighbouring countries to simulate cross-border
 * activity).
 *
 * Run with: npm run seed --workspace=api
 */

const TOTAL_NOTES = 200;

const DEMO_PROJECT = {
  name: 'Switzerland Field Ops',
  description:
    'Demo project tracking field reports, checkpoints, and points of interest across Switzerland.',
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

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  const projectRepo = AppDataSource.getRepository(Project);
  const tagRepo = AppDataSource.getRepository(Tag);
  const noteRepo = AppDataSource.getRepository(Note);

  console.log('Creating demo project...');
  const project = await projectRepo.save(projectRepo.create(DEMO_PROJECT));

  console.log('Creating global tags...');
  const tags = await tagRepo.save(
    TAG_DEFINITIONS.map((tag) => tagRepo.create(tag)),
  );
  const tagNames = tags.map((tag) => tag.name);

  console.log(`Creating ${TOTAL_NOTES} notes...`);
  const notesToInsert: Note[] = [];

  for (let i = 0; i < TOTAL_NOTES; i++) {
    // ~92% of notes land in Switzerland, the rest spill into neighbouring
    // countries to keep things "mostly" Swiss.
    const useForeign = Math.random() < 0.08;
    const location = useForeign
      ? pick(NEARBY_FOREIGN_LOCATIONS)
      : pick(SWISS_LOCATIONS);

    const subject = pick(REPORT_SUBJECTS);
    const body = pick(REPORT_BODIES);

    const title = `${subject} — ${location.name}`;
    const content = `## ${subject} — ${location.name}\n\n${body}`;

    notesToInsert.push(
      noteRepo.create({
        projectId: project.id,
        title,
        content,
        tags: pickSome(tagNames, randomInt(1, 3)),
      }),
    );
  }

  // Insert in batches to avoid overly large single queries.
  const BATCH_SIZE = 50;
  for (let i = 0; i < notesToInsert.length; i += BATCH_SIZE) {
    await noteRepo.save(notesToInsert.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `Done. Created project "${project.name}" (id=${project.id}) with ${tags.length} tags and ${notesToInsert.length} notes.`,
  );

  await AppDataSource.destroy();
}

seed().catch((error: unknown) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
