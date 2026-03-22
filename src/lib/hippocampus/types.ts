export type NarrativeRole =
  | 'official_claim'
  | 'eyewitness'
  | 'counter_document'
  | 'propagandist'
  | 'victim_testimony'
  | 'government_record'
  | 'scripture'
  | 'investigative_data'
  | 'evidence';

export type InvestigationType =
  | 'follow-the-money'
  | 'compare-sources'
  | 'timeline'
  | 'network-map'
  | 'propaganda-analysis'
  | 'document-analysis';

export interface ScriptureConnection {
  passage: string;
  connection: string;
}

export interface PrimarySourceMetadata {
  sourceSlug: string;
  creator: string;
  date: string;
  collection?: string;
  url?: string;
  rights: 'public_domain' | 'fair_use' | 'cc_by';
  topics: string[];
  era: string;
  subjectTracks: string[];
  readingLevel?: string;
  investigationTypes: InvestigationType[];
  narrativeRole: NarrativeRole;
  scriptureConnections: ScriptureConnection[];
  contentWarnings: string[];
  investigationPrompts: string[];
  citation: string;
}

export interface PrimarySourceRecord {
  id: string;
  title: string;
  content: string;
  metadata: PrimarySourceMetadata;
  similarity?: number;
}

export interface IngestPrimarySourceInput {
  title: string;
  content: string;
  metadata: PrimarySourceMetadata;
}
