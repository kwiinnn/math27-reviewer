import type { Chapter, Formula, Topic } from '../types/curriculum';
import { inverseFunctions } from './topics/inverse-functions';
import { expLog } from './topics/exp-log';
import { naturalExpLog } from './topics/natural-exp-log';
import { inverseTrig } from './topics/inverse-trig';
import { inverseTrigIntegrals } from './topics/inverse-trig-integrals';
import { hyperbolic } from './topics/hyperbolic';
import { applications } from './topics/applications';
import { integrationByParts } from './topics/integration-by-parts';
import { trigIntegrals } from './topics/trig-integrals';
import { trigSubstitution } from './topics/trig-substitution';
import { partialFractions } from './topics/partial-fractions';
import { otherSubstitutions } from './topics/other-substitutions';
import { area } from './topics/area';
import { diskMethod } from './topics/disk-method';
import { washerMethod } from './topics/washer-method';
import { centerOfMassRod } from './topics/center-of-mass-rod';
import { centroid } from './topics/centroid';
import { arcLength } from './topics/arc-length';

/**
 * Central curriculum registry.
 *
 * To add a topic: create `src/data/topics/<slug>.ts` exporting a typed `Topic`,
 * import it here, and append it to `topics`. The sidebar, topic pages and the
 * global Formula Reference all read from this file — nothing else changes.
 */
export const topics: Topic[] = [
  inverseFunctions,
  expLog,
  naturalExpLog,
  inverseTrig,
  inverseTrigIntegrals,
  hyperbolic,
  applications,
  integrationByParts,
  trigIntegrals,
  trigSubstitution,
  partialFractions,
  otherSubstitutions,
  area,
  diskMethod,
  washerMethod,
  centerOfMassRod,
  centroid,
  arcLength,
];

export const chapters: Chapter[] = [
  { number: '1', title: 'Transcendental Functions' },
  { number: '2', title: 'Techniques of Integration' },
  { number: '3', title: 'Applications of Integration' },
];

const byUnit = (a: Topic, b: Topic) =>
  a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true });

export const sortedTopics: Topic[] = [...topics].sort(byUnit);

export function getTopicBySlug(slug: string): Topic | undefined {
  return topics.find((t) => t.slug === slug);
}

export interface ChapterGroup {
  chapter: Chapter;
  topics: Topic[];
}

/** Topics grouped by the chapter prefix of their unit number. */
export function getChapterGroups(): ChapterGroup[] {
  const groups = new Map<string, Topic[]>();
  for (const topic of sortedTopics) {
    const key = topic.unitNumber.split('.')[0];
    groups.set(key, [...(groups.get(key) ?? []), topic]);
  }
  return [...groups.entries()].map(([number, list]) => ({
    chapter: chapters.find((c) => c.number === number) ?? { number, title: `Unit ${number}` },
    topics: list,
  }));
}

export interface FormulaGroup {
  topic: Topic;
  formulas: Formula[];
}

/** Every formula in the course, aggregated from the topics themselves. */
export function getAllFormulas(): FormulaGroup[] {
  return sortedTopics.map((topic) => ({ topic, formulas: topic.keyFormulas }));
}
