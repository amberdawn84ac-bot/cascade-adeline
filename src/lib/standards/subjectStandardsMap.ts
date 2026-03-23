/**
 * Static mapping of subject areas to CCSS and Oklahoma Academic Standards codes.
 * Based on the Dear Adeline Standards Mapping Guide.
 * Credit hours are Carnegie Units (120 hrs = 1.0 credit).
 */

export interface SubjectStandardsEntry {
  ccss: string[];
  oas: string[];
  ap?: string[];
  creditSubject: string;
  creditHoursPerLesson: number;
  scedCode: string;
}

const HISTORY_CCSS_RH_6_8 = [
  'CCSS.ELA-LITERACY.RH.6-8.1',
  'CCSS.ELA-LITERACY.RH.6-8.2',
  'CCSS.ELA-LITERACY.RH.6-8.6',
  'CCSS.ELA-LITERACY.RH.6-8.8',
  'CCSS.ELA-LITERACY.RH.6-8.9',
  'CCSS.ELA-LITERACY.WHST.6-8.1',
  'CCSS.ELA-LITERACY.WHST.6-8.2',
  'CCSS.ELA-LITERACY.WHST.6-8.9',
];

const HISTORY_CCSS_RH_9_10 = [
  'CCSS.ELA-LITERACY.RH.9-10.1',
  'CCSS.ELA-LITERACY.RH.9-10.3',
  'CCSS.ELA-LITERACY.RH.9-10.9',
  'CCSS.ELA-LITERACY.WHST.9-10.1',
  'CCSS.ELA-LITERACY.WHST.9-10.2',
  'CCSS.ELA-LITERACY.WHST.9-10.9',
];

// 8 Integrated Tracks Standards Mapping
export const TRACK_STANDARDS_MAP: Record<string, SubjectStandardsEntry> = {
  'gods-creation-science': {
    ccss: [
      'CCSS.ELA-LITERACY.RST.6-8.1',
      'CCSS.ELA-LITERACY.RST.6-8.3',
      'CCSS.ELA-LITERACY.WHST.6-8.2',
      'CCSS.MATH.CONTENT.6.SP.B.5',
      'CCSS.MATH.CONTENT.7.RP.A.3',
    ],
    oas: ['OAS.SCI.6.LS2.1', 'OAS.SCI.7.LS2.1', 'OAS.SCI.8.PS1.1', 'OAS.SCI.BIO.1.1'],
    ap: ['APBIO-1.A', 'APENV-1.A'],
    creditSubject: 'Integrated Science',
    creditHoursPerLesson: 0.75,
    scedCode: '03001',
  },
  'health-naturopathy': {
    ccss: [
      'CCSS.ELA-LITERACY.RST.9-10.1',
      'CCSS.ELA-LITERACY.RST.9-10.3',
      'CCSS.MATH.CONTENT.6.SP.B.5',
    ],
    oas: ['OAS.SCI.BIO.2.1', 'OAS.SCI.BIO.3.1', 'OAS.HEALTH.1.1'],
    creditSubject: 'Health Sciences',
    creditHoursPerLesson: 0.5,
    scedCode: '03051',
  },
  'homesteading': {
    ccss: [
      'CCSS.ELA-LITERACY.RST.6-8.1',
      'CCSS.MATH.CONTENT.6.SP.B.5',
      'CCSS.MATH.CONTENT.7.RP.A.3',
      'CCSS.ELA-LITERACY.WHST.6-8.2',
    ],
    oas: ['OAS.AGRI.1.1', 'OAS.AGRI.2.1', 'OAS.CTE.1.1'],
    creditSubject: 'Agricultural Sciences',
    creditHoursPerLesson: 0.75,
    scedCode: '03002',
  },
  'government-economics': {
    ccss: [
      'CCSS.ELA-LITERACY.RH.9-10.1',
      'CCSS.ELA-LITERACY.RH.9-10.3',
      'CCSS.ELA-LITERACY.WHST.9-10.1',
    ],
    oas: ['OAS.GOV.1.1', 'OAS.GOV.2.1', 'OAS.GOV.3.1', 'OAS.ECON.1.1', 'OAS.ECON.2.1'],
    ap: ['APCGOV-1.1', 'APECON-1.1'],
    creditSubject: 'Government & Economics',
    creditHoursPerLesson: 0.75,
    scedCode: '04201',
  },
  'justice-change-making': {
    ccss: [
      'CCSS.ELA-LITERACY.RH.9-10.1',
      'CCSS.ELA-LITERACY.RH.9-10.9',
      'CCSS.ELA-LITERACY.WHST.9-10.1',
      'CCSS.ELA-LITERACY.SL.9-10.4',
    ],
    oas: ['OAS.GOV.4.1', 'OAS.SS.6.1', 'OAS.SS.7.1'],
    creditSubject: 'Social Justice Studies',
    creditHoursPerLesson: 0.5,
    scedCode: '04251',
  },
  'discipleship-cultural-discernment': {
    ccss: [
      'CCSS.ELA-LITERACY.RI.6-8.1',
      'CCSS.ELA-LITERACY.RI.6-8.6',
      'CCSS.ELA-LITERACY.SL.6-8.4',
    ],
    oas: [],
    creditSubject: 'Bible & Cultural Studies',
    creditHoursPerLesson: 0.5,
    scedCode: '22251',
  },
  'truth-based-history': {
    ccss: HISTORY_CCSS_RH_9_10,
    oas: ['OAS.USH.3.5', 'OAS.USH.2.3', 'OAS.USH.1.1', 'OAS.WH.1.1'],
    ap: ['APUSH-6.2.I.A', 'APWH-1.1'],
    creditSubject: 'U.S. History',
    creditHoursPerLesson: 0.75,
    scedCode: '04101',
  },
  'english-language-literature': {
    ccss: [
      'CCSS.ELA-LITERACY.RI.9-10.1',
      'CCSS.ELA-LITERACY.RI.9-10.6',
      'CCSS.ELA-LITERACY.W.9-10.1',
      'CCSS.ELA-LITERACY.W.9-10.2',
      'CCSS.ELA-LITERACY.SL.9-10.4',
      'CCSS.ELA-LITERACY.RL.9-10.1',
      'CCSS.ELA-LITERACY.RL.9-10.2',
    ],
    oas: ['OAS.ELA.9.1', 'OAS.ELA.9.2', 'OAS.ELA.9.3'],
    creditSubject: 'English Language Arts',
    creditHoursPerLesson: 0.75,
    scedCode: '01001',
  },
};

export const SUBJECT_STANDARDS_MAP: Record<string, SubjectStandardsEntry> = {
  'american history': {
    ccss: HISTORY_CCSS_RH_9_10,
    oas: ['OAS.USH.3.5', 'OAS.USH.2.3', 'OAS.USH.1.1'],
    ap: ['APUSH-6.2.I.A', 'APUSH-7.1.I.A'],
    creditSubject: 'U.S. History',
    creditHoursPerLesson: 0.75,
    scedCode: '04101',
  },
  'u.s. history': {
    ccss: HISTORY_CCSS_RH_9_10,
    oas: ['OAS.USH.3.5', 'OAS.USH.2.3', 'OAS.USH.1.1'],
    ap: ['APUSH-6.2.I.A', 'APUSH-7.1.I.A'],
    creditSubject: 'U.S. History',
    creditHoursPerLesson: 0.75,
    scedCode: '04101',
  },
  'history': {
    ccss: HISTORY_CCSS_RH_6_8,
    oas: ['OAS.USH.3.5', 'OAS.USH.2.3', 'OAS.OK.5.2', 'OAS.OK.5.3'],
    creditSubject: 'U.S. History',
    creditHoursPerLesson: 0.5,
    scedCode: '04101',
  },
  'world history': {
    ccss: HISTORY_CCSS_RH_9_10,
    oas: ['OAS.WH.1.1', 'OAS.WH.2.1', 'OAS.WH.3.1'],
    ap: ['APWH-1.1', 'APWH-2.1'],
    creditSubject: 'World History',
    creditHoursPerLesson: 0.75,
    scedCode: '04104',
  },
  'oklahoma history': {
    ccss: HISTORY_CCSS_RH_6_8,
    oas: ['OAS.OK.5.2', 'OAS.OK.5.3', 'OAS.OK.5.4', 'OAS.OK.5.5'],
    creditSubject: 'Oklahoma History',
    creditHoursPerLesson: 0.5,
    scedCode: '04151',
  },
  'social studies': {
    ccss: HISTORY_CCSS_RH_6_8,
    oas: ['OAS.SS.6.1', 'OAS.SS.7.1', 'OAS.SS.8.1'],
    creditSubject: 'Social Studies',
    creditHoursPerLesson: 0.5,
    scedCode: '04101',
  },
  'civics': {
    ccss: [
      'CCSS.ELA-LITERACY.RH.9-10.1',
      'CCSS.ELA-LITERACY.RH.9-10.3',
      'CCSS.ELA-LITERACY.WHST.9-10.1',
    ],
    oas: ['OAS.GOV.1.1', 'OAS.GOV.2.1', 'OAS.GOV.3.1', 'OAS.GOV.4.1'],
    ap: ['APCGOV-1.1', 'APCGOV-2.1'],
    creditSubject: 'U.S. Government',
    creditHoursPerLesson: 0.75,
    scedCode: '04201',
  },
  'government': {
    ccss: [
      'CCSS.ELA-LITERACY.RH.9-10.1',
      'CCSS.ELA-LITERACY.RH.9-10.3',
      'CCSS.ELA-LITERACY.WHST.9-10.1',
    ],
    oas: ['OAS.GOV.1.1', 'OAS.GOV.2.1', 'OAS.GOV.3.1'],
    ap: ['APCGOV-1.1', 'APCGOV-2.1'],
    creditSubject: 'U.S. Government',
    creditHoursPerLesson: 0.75,
    scedCode: '04201',
  },
  'economics': {
    ccss: [
      'CCSS.ELA-LITERACY.RH.9-10.1',
      'CCSS.ELA-LITERACY.WHST.9-10.1',
    ],
    oas: ['OAS.ECON.1.1', 'OAS.ECON.2.1', 'OAS.ECON.3.1'],
    ap: ['APECON-1.1'],
    creditSubject: 'Economics',
    creditHoursPerLesson: 0.75,
    scedCode: '04202',
  },
  'english': {
    ccss: [
      'CCSS.ELA-LITERACY.RI.9-10.1',
      'CCSS.ELA-LITERACY.RI.9-10.6',
      'CCSS.ELA-LITERACY.W.9-10.1',
      'CCSS.ELA-LITERACY.W.9-10.2',
      'CCSS.ELA-LITERACY.SL.9-10.4',
    ],
    oas: ['OAS.ELA.9.1', 'OAS.ELA.9.2', 'OAS.ELA.9.3'],
    creditSubject: 'English Language Arts',
    creditHoursPerLesson: 0.75,
    scedCode: '01001',
  },
  'language arts': {
    ccss: [
      'CCSS.ELA-LITERACY.RI.6-8.1',
      'CCSS.ELA-LITERACY.W.6-8.1',
      'CCSS.ELA-LITERACY.SL.6-8.4',
    ],
    oas: ['OAS.ELA.6.1', 'OAS.ELA.7.1', 'OAS.ELA.8.1'],
    creditSubject: 'English Language Arts',
    creditHoursPerLesson: 0.5,
    scedCode: '01001',
  },
  'mathematics': {
    ccss: [
      'CCSS.MATH.CONTENT.6.SP.B.5',
      'CCSS.MATH.CONTENT.7.RP.A.3',
    ],
    oas: ['OAS.MATH.6.D.1', 'OAS.MATH.7.A.1'],
    creditSubject: 'Mathematics',
    creditHoursPerLesson: 0.5,
    scedCode: '02101',
  },
  'math': {
    ccss: [
      'CCSS.MATH.CONTENT.6.SP.B.5',
      'CCSS.MATH.CONTENT.7.RP.A.3',
    ],
    oas: ['OAS.MATH.6.D.1', 'OAS.MATH.7.A.1'],
    creditSubject: 'Mathematics',
    creditHoursPerLesson: 0.5,
    scedCode: '02101',
  },
  'science': {
    ccss: [
      'CCSS.ELA-LITERACY.RST.6-8.1',
      'CCSS.ELA-LITERACY.RST.6-8.3',
      'CCSS.ELA-LITERACY.WHST.6-8.2',
    ],
    oas: ['OAS.SCI.6.LS2.1', 'OAS.SCI.7.LS2.1', 'OAS.SCI.8.PS1.1'],
    creditSubject: 'Science',
    creditHoursPerLesson: 0.5,
    scedCode: '03001',
  },
  'biology': {
    ccss: [
      'CCSS.ELA-LITERACY.RST.9-10.1',
      'CCSS.ELA-LITERACY.RST.9-10.3',
    ],
    oas: ['OAS.SCI.BIO.1.1', 'OAS.SCI.BIO.2.1', 'OAS.SCI.BIO.3.1'],
    ap: ['APBIO-1.A'],
    creditSubject: 'Biology',
    creditHoursPerLesson: 0.75,
    scedCode: '03001',
  },
  'biblical studies': {
    ccss: [
      'CCSS.ELA-LITERACY.RI.6-8.1',
      'CCSS.ELA-LITERACY.RI.6-8.6',
    ],
    oas: [],
    creditSubject: 'Bible/Theology',
    creditHoursPerLesson: 0.5,
    scedCode: '22251',
  },
  'bible': {
    ccss: [
      'CCSS.ELA-LITERACY.RI.6-8.1',
      'CCSS.ELA-LITERACY.RI.6-8.6',
    ],
    oas: [],
    creditSubject: 'Bible/Theology',
    creditHoursPerLesson: 0.5,
    scedCode: '22251',
  },
};

/**
 * Look up standards entry for a subject (case-insensitive, partial match).
 * Checks 8 Integrated Tracks first, then legacy subjects.
 */
export function getStandardsForSubject(subject: string): SubjectStandardsEntry | null {
  const key = subject.toLowerCase().trim();
  
  // Check 8 Integrated Tracks first
  if (TRACK_STANDARDS_MAP[key]) return TRACK_STANDARDS_MAP[key];
  for (const [mapKey, entry] of Object.entries(TRACK_STANDARDS_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return entry;
  }
  
  // Fallback to legacy subjects
  if (SUBJECT_STANDARDS_MAP[key]) return SUBJECT_STANDARDS_MAP[key];
  for (const [mapKey, entry] of Object.entries(SUBJECT_STANDARDS_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return entry;
  }
  return null;
}

/**
 * Get all standard codes (CCSS + OAS + AP) for a subject as a flat array.
 */
export function getAllCodesForSubject(subject: string): string[] {
  const entry = getStandardsForSubject(subject);
  if (!entry) return [];
  return [...entry.ccss, ...entry.oas, ...(entry.ap ?? [])];
}
