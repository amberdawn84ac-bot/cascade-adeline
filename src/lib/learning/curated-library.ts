export interface CuratedBook {
  id: string;
  title: string;
  author: string;
  minGrade: number;
  maxGrade: number;
  subject: string;
  sourceUrl: string;
  coverUrl?: string;
}

export const PUBLIC_DOMAIN_LIBRARY: CuratedBook[] = [
  // ── K–2 (grades 0–2) ─────────────────────────────────────────────────────────
  {
    id: 'mcguffey-primer',
    title: "McGuffey's First Eclectic Reader",
    author: 'William Holmes McGuffey',
    minGrade: 0,
    maxGrade: 2,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/14640',
  },
  {
    id: 'peter-rabbit',
    title: 'The Tale of Peter Rabbit',
    author: 'Beatrix Potter',
    minGrade: 0,
    maxGrade: 2,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/14838',
  },
  {
    id: 'mother-goose',
    title: 'The Real Mother Goose',
    author: 'Blanche Fisher Wright',
    minGrade: 0,
    maxGrade: 2,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/17371',
  },
  {
    id: 'aesops-fables',
    title: "Aesop's Fables",
    author: 'Aesop',
    minGrade: 0,
    maxGrade: 4,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/21',
  },
  {
    id: 'grimms-fairy-tales',
    title: "Grimm's Fairy Tales",
    author: 'Jacob & Wilhelm Grimm',
    minGrade: 0,
    maxGrade: 4,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/2591',
  },
  {
    id: 'andersens-fairy-tales',
    title: "Andersen's Fairy Tales",
    author: 'Hans Christian Andersen',
    minGrade: 0,
    maxGrade: 4,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/1597',
  },
  // ── Grades 2–5 ───────────────────────────────────────────────────────────────
  {
    id: 'alice-wonderland',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    minGrade: 2,
    maxGrade: 6,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/11',
  },
  {
    id: 'wind-in-willows',
    title: 'The Wind in the Willows',
    author: 'Kenneth Grahame',
    minGrade: 2,
    maxGrade: 5,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/289',
  },
  {
    id: 'wizard-of-oz',
    title: 'The Wonderful Wizard of Oz',
    author: 'L. Frank Baum',
    minGrade: 2,
    maxGrade: 5,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/55',
  },
  {
    id: 'black-beauty',
    title: 'Black Beauty',
    author: 'Anna Sewell',
    minGrade: 3,
    maxGrade: 6,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/271',
  },
  {
    id: 'secret-garden',
    title: 'The Secret Garden',
    author: 'Frances Hodgson Burnett',
    minGrade: 3,
    maxGrade: 6,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/113',
  },
  {
    id: 'little-princess',
    title: 'A Little Princess',
    author: 'Frances Hodgson Burnett',
    minGrade: 3,
    maxGrade: 7,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/146',
  },
  {
    id: 'pollyanna',
    title: 'Pollyanna',
    author: 'Eleanor H. Porter',
    minGrade: 3,
    maxGrade: 7,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/1450',
  },
  {
    id: 'swiss-family-robinson',
    title: 'Swiss Family Robinson',
    author: 'Johann David Wyss',
    minGrade: 4,
    maxGrade: 7,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/3836',
  },
  {
    id: 'jungle-book',
    title: 'The Jungle Book',
    author: 'Rudyard Kipling',
    minGrade: 3,
    maxGrade: 7,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/236',
  },
  // ── Grades 5–8 ───────────────────────────────────────────────────────────────
  {
    id: 'treasure-island',
    title: 'Treasure Island',
    author: 'Robert Louis Stevenson',
    minGrade: 5,
    maxGrade: 8,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/120',
  },
  {
    id: 'tom-sawyer',
    title: 'The Adventures of Tom Sawyer',
    author: 'Mark Twain',
    minGrade: 5,
    maxGrade: 8,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/74',
  },
  {
    id: 'little-women',
    title: 'Little Women',
    author: 'Louisa May Alcott',
    minGrade: 5,
    maxGrade: 9,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/514',
  },
  {
    id: 'white-fang',
    title: 'White Fang',
    author: 'Jack London',
    minGrade: 5,
    maxGrade: 8,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/910',
  },
  {
    id: 'around-world-80-days',
    title: 'Around the World in Eighty Days',
    author: 'Jules Verne',
    minGrade: 5,
    maxGrade: 9,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/103',
  },
  {
    id: 'robinson-crusoe',
    title: 'Robinson Crusoe',
    author: 'Daniel Defoe',
    minGrade: 5,
    maxGrade: 8,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/521',
  },
  // ── Grades 6–9 ───────────────────────────────────────────────────────────────
  {
    id: 'call-of-the-wild',
    title: 'The Call of the Wild',
    author: 'Jack London',
    minGrade: 6,
    maxGrade: 9,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/215',
  },
  {
    id: '20000-leagues',
    title: 'Twenty Thousand Leagues Under the Sea',
    author: 'Jules Verne',
    minGrade: 6,
    maxGrade: 9,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/164',
  },
  // ── Grades 7–10 ──────────────────────────────────────────────────────────────
  {
    id: 'huck-finn',
    title: 'Adventures of Huckleberry Finn',
    author: 'Mark Twain',
    minGrade: 7,
    maxGrade: 10,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/76',
  },
  {
    id: 'frederick-douglass',
    title: 'Narrative of the Life of Frederick Douglass',
    author: 'Frederick Douglass',
    minGrade: 7,
    maxGrade: 12,
    subject: 'Social Studies',
    sourceUrl: 'https://www.gutenberg.org/ebooks/23',
  },
  {
    id: 'red-badge-courage',
    title: 'The Red Badge of Courage',
    author: 'Stephen Crane',
    minGrade: 7,
    maxGrade: 10,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/73',
  },
  {
    id: 'sojourner-truth',
    title: 'Narrative of Sojourner Truth',
    author: 'Sojourner Truth',
    minGrade: 7,
    maxGrade: 12,
    subject: 'Social Studies',
    sourceUrl: 'https://www.gutenberg.org/ebooks/1039',
  },
  {
    id: 'kidnapped',
    title: 'Kidnapped',
    author: 'Robert Louis Stevenson',
    minGrade: 6,
    maxGrade: 9,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/421',
  },
  // ── Grades 8–12 ──────────────────────────────────────────────────────────────
  {
    id: 'common-sense',
    title: 'Common Sense',
    author: 'Thomas Paine',
    minGrade: 8,
    maxGrade: 12,
    subject: 'Social Studies',
    sourceUrl: 'https://www.gutenberg.org/ebooks/147',
  },
  {
    id: 'scarlet-letter',
    title: 'The Scarlet Letter',
    author: 'Nathaniel Hawthorne',
    minGrade: 8,
    maxGrade: 12,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/25344',
  },
  {
    id: 'count-of-monte-cristo',
    title: 'The Count of Monte Cristo',
    author: 'Alexandre Dumas',
    minGrade: 8,
    maxGrade: 12,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/1184',
  },
  // ── Grades 9–12 ──────────────────────────────────────────────────────────────
  {
    id: 'pride-and-prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    minGrade: 9,
    maxGrade: 12,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/1342',
  },
  {
    id: 'jane-eyre',
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    minGrade: 9,
    maxGrade: 12,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/1260',
  },
  {
    id: 'frankenstein',
    title: 'Frankenstein',
    author: 'Mary Wollstonecraft Shelley',
    minGrade: 9,
    maxGrade: 12,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/84',
  },
  {
    id: 'dorian-gray',
    title: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    minGrade: 9,
    maxGrade: 12,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/174',
  },
  {
    id: 'great-expectations',
    title: 'Great Expectations',
    author: 'Charles Dickens',
    minGrade: 9,
    maxGrade: 12,
    subject: 'English Language Arts',
    sourceUrl: 'https://www.gutenberg.org/ebooks/1400',
  },
  {
    id: 'flatland',
    title: 'Flatland: A Romance of Many Dimensions',
    author: 'Edwin Abbott Abbott',
    minGrade: 9,
    maxGrade: 12,
    subject: 'Mathematics',
    sourceUrl: 'https://www.gutenberg.org/ebooks/97',
  },
  {
    id: 'federalist-papers',
    title: 'The Federalist Papers',
    author: 'Hamilton, Madison & Jay',
    minGrade: 10,
    maxGrade: 12,
    subject: 'Social Studies',
    sourceUrl: 'https://www.gutenberg.org/ebooks/1404',
  },
];

/**
 * Returns up to `limit` books whose grade range includes `gradeLevel`.
 * Results are randomly shuffled so each call returns a fresh selection.
 */
export function getRecommendedBooks(gradeLevel: number, limit: number = 3): CuratedBook[] {
  const eligible = PUBLIC_DOMAIN_LIBRARY.filter(
    (book) => gradeLevel >= book.minGrade && gradeLevel <= book.maxGrade
  );

  // Fisher-Yates shuffle
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }

  return eligible.slice(0, limit);
}
