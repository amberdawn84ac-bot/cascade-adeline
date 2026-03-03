export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface UserProfile {
  id: string; // Unique ID (usually email)
  email: string;
  name: string;
  gradeLevel: string;
  learningStyle: {
    visual: number;      // 0-10: Preference for images, diagrams
    auditory: number;    // 0-10: Preference for discussion, listening
    reading: number;     // 0-10: Preference for text, lists
    kinesthetic: number; // 0-10: Preference for doing, experiments
  };
  interests: string[];
}

export interface Memory {
  id: string;
  userId: string;
  content: string; // The fact or summary stored
  tags: string[];  // Keywords for retrieval
  timestamp: number;
  importance: number; // 1-10, how critical is this memory?
}

export interface LearningActivity {
  type: 'read' | 'practice' | 'reflect';
  description: string;
}

export interface LearningWeek {
  weekNumber: number;
  title: string;
  objective: string;
  activities: LearningActivity[];
}

export interface LearningPlan {
  topic: string;
  overview: string;
  weeks: LearningWeek[];
}

// Microcredits & Standards
export type SubjectArea = 'English' | 'Math' | 'Science' | 'Social Studies' | 'Arts' | 'Elective';

export interface ProposedCredit {
  id: string;
  courseTitle: string; 
  subjectArea: SubjectArea;
  credits: number;
  standards: string[];
  reasoning: string;   
  confidence: 'High' | 'Medium' | 'Low';
}

export interface CreditAssessment {
  experienceSummary: string;
  proposedCredits: ProposedCredit[];
}

export interface WebSource {
  title: string;
  uri: string;
}

// History Timeline Types
export interface TimelineEvent {
  id: string;
  year: number; // Numeric for sorting
  displayDate: string; // "c. 1492" or "Late 19th Century"
  title: string;
  myth: string;
  reality: string;
  evidence: string; // Primary source reference
  sources?: WebSource[]; // Real-world grounding links
}

// Science Book Types
export interface ScienceEntry {
  id: string;
  topic: string;
  category: 'Biology' | 'Physics' | 'Chemistry' | 'Astronomy' | 'Earth Science' | 'General';
  hypothesis: string; // The initial question or assumption
  observation: string; // The core scientific explanation/mechanism
  conclusion: string; // The summary fact
  funFact: string; // A "Did you know?" style margin note
  sources?: WebSource[]; // Mandatory citations
}

export interface ScienceExperiment {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  duration: string;
  materials: string[];
  safety: string[];
  steps: string[];
  science: string; // The explanation
  funFactor: string; // Why it's epic
  sources?: WebSource[]; // Mandatory citations for safety/procedure
}

// Bible Discovery Types
export interface BibleAnalysis {
  id: string;
  query: string; // The verse or topic requested
  originalTerm: string; // The Hebrew/Greek word/phrase
  originalMeaning: string; // The literal definition/context
  modernTranslation: string; // How we usually read it
  historicalShift: string; // When/Why it changed (The "Investigation")
  implication: string; // The "Truth" we miss
  sources?: WebSource[]; // Real-world grounding links
}

// Expedition Types (Geology/Archaeology/Geography)
export interface ExpeditionReport {
  id: string;
  location: string;
  coordinates: string; // e.g. "30°N, 31°E" (fictional or real)
  geology: {
    formation: string; // How the land was made
    rocks: string[]; // Key rock types found there
  };
  archaeology: {
    remnants: string; // Key ruins or artifacts
    era: string; // Time period of interest
  };
  sociology: {
    culture: string; // How the land shaped the people
    connection: string; // The explicit link between geology and sociology
  };
  sources?: WebSource[];
}

// Journal Types
export interface DailySchedule {
  date: string;
  theme: string;
  blocks: {
    time: string;
    activity: string;
    subject: string;
  }[];
  quote: string;
}

// College Prep Types
export interface TestPrepQuestion {
  id: string;
  subject: 'Math' | 'English' | 'Science' | 'Reading';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Scholarship {
  id: string;
  name: string;
  amount: string;
  deadline: string;
  requirements: string;
  category: string;
}

// Book Club Types
export type ReadingLevel = 'Early Reader' | 'Middle Grade' | 'Young Adult' | 'Classic Literature';

export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  description: string;
  level: ReadingLevel;
  themes: string[];
  discussionQuestions: string[];
  sources?: WebSource[];
}

export interface ReadingProgram {
  name: string;
  description: string;
  targetAudience: string;
  link?: string; // Optional URL
}

// Game Types
export interface GameProject {
  id: string;
  title: string;
  code: string; // Full HTML string including <script>
  status: 'draft' | 'published';
  thumbnail?: string; // CSS color or gradient
  description: string;
}

// Home Ec Types
export interface HomeEcEntry {
  id: string;
  type: 'recipe' | 'pattern';
  title: string;
  materials: string[]; // Ingredients or Fabric/Notions
  instructions: string[];
  notes: string; // User's personal blog post content
  tip: string; // Adeline's Tip
  date: Date;
  sources?: WebSource[]; // Mandatory citations
}

// Art Types
export interface ArtProject {
  id: string;
  title: string;
  medium: string; // e.g. "Oil Painting", "Digital Photography"
  description: string;
  techniqueFocus: string; // The specific skill being practiced
  steps: string[];
  inspiration: string; // Artistic quote or reference
  sources?: WebSource[]; // Mandatory citations
}

// Generic Community Types (Shared across all domains)
export interface Club {
  id: string;
  name: string;
  focus: string; // e.g. "Oil Painting", "Robotics", "Historical Reenactment"
  description: string;
  currentChallenge: string;
  members: number;
}

export interface Opportunity {
  id: string;
  title: string;
  type: 'Competition' | 'Exhibition' | 'Workshop' | 'Grant' | 'Fair' | 'Hackathon';
  description: string;
  deadline?: string;
  organization: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  data?: LearningPlan | CreditAssessment; 
  type?: 'text' | 'plan' | 'assessment'; 
  timestamp: Date;
  feedback?: 'positive' | 'negative';
}

export enum AppMode {
  ONBOARDING = 'onboarding',
  DASHBOARD = 'dashboard',
  CHAT = 'chat',
  JOURNAL = 'journal',
  HISTORY = 'history',
  SCIENCE = 'science',
  BOOK_CLUB = 'book_club',
  GAMES = 'games',
  HOME_EC = 'home_ec',
  ARTS = 'arts',
  BIBLE = 'bible',
  EXPEDITION = 'expedition',
  COLLEGE_PREP = 'college_prep',
}
